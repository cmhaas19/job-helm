import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { evaluateJob } from "@/lib/evaluator";
import { getConfigNumber } from "@/lib/config";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { jobIds } = body as { jobIds?: string[] };

  if (!jobIds || jobIds.length === 0) {
    return NextResponse.json({ error: "No job IDs provided" }, { status: 400 });
  }

  const serviceClient = await createServiceClient();

  // Get user's resume
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("resume_text")
    .eq("id", user.id)
    .single();

  if (!profile?.resume_text) {
    return NextResponse.json(
      { error: "No resume uploaded. Upload a resume before re-evaluating." },
      { status: 400 }
    );
  }

  // Get the jobs
  const { data: jobs } = await serviceClient
    .from("job_evaluations")
    .select("id, company, position, description")
    .eq("user_id", user.id)
    .in("id", jobIds);

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ error: "No matching jobs found" }, { status: 404 });
  }

  // Stream progress via SSE
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  function sendEvent(type: string, data: any) {
    const payload = JSON.stringify({ type, ...data });
    writer.write(encoder.encode(`data: ${payload}\n\n`));
  }

  (async () => {
    let evaluated = 0;
    let failed = 0;
    const concurrency = (await getConfigNumber("eval_concurrency")) ?? 5;

    // Split out jobs without descriptions
    const evalJobs = jobs.filter((job) => {
      if (!job.description) {
        sendEvent("log", { message: `  Skipping ${job.company} — ${job.position} (no description)` });
        failed++;
        return false;
      }
      return true;
    });

    sendEvent("log", { message: `Re-evaluating ${evalJobs.length} job(s) with concurrency ${concurrency}...` });

    for (let i = 0; i < evalJobs.length; i += concurrency) {
      const batch = evalJobs.slice(i, i + concurrency);
      const batchNum = Math.floor(i / concurrency) + 1;
      sendEvent("log", { message: `Batch ${batchNum}: evaluating ${batch.length} jobs...` });

      const results = await Promise.all(
        batch.map(async (job) => {
          try {
            const result = await evaluateJob(
              user.id,
              profile.resume_text,
              job.company,
              job.position,
              job.description
            );

            if (result) {
              await serviceClient
                .from("job_evaluations")
                .update({
                  fit_category: result.fit_category,
                  total_score: result.total_score,
                  score_details: result.scores,
                  eval_summary: result.summary,
                  strengths: result.strengths,
                  gaps: result.gaps,
                  prompt_version: result.prompt_version,
                  skipped: false,
                  skip_reason: null,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", job.id);

              sendEvent("log", {
                message: `  ✓ ${job.company}: ${result.fit_category} (${result.total_score}) — prompt v${result.prompt_version}`,
              });
              return true;
            } else {
              sendEvent("log", { message: `  ✗ ${job.company}: evaluation returned null` });
              return false;
            }
          } catch (err: any) {
            sendEvent("log", { message: `  ✗ ${job.company}: ${err.message}` });
            return false;
          }
        })
      );

      for (const ok of results) {
        if (ok) evaluated++;
        else failed++;
      }
    }

    sendEvent("log", {
      message: `Re-evaluation complete! ${evaluated} succeeded, ${failed} failed.`,
    });
    sendEvent("complete", { evaluated, failed });
    writer.close();
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
