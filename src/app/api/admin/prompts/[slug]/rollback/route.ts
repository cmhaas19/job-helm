import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { versionId } = body;

  const { data: version } = await supabase
    .from("prompt_versions")
    .select("*")
    .eq("id", versionId)
    .single();

  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  // Update the prompt content to the rolled-back version
  const { error } = await supabase
    .from("system_prompts")
    .update({
      content: version.content,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("slug", slug);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create a new version entry for the rollback
  const { data: latestVersion } = await supabase
    .from("prompt_versions")
    .select("version")
    .eq("prompt_id", version.prompt_id)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  await supabase.from("prompt_versions").insert({
    prompt_id: version.prompt_id,
    version: (latestVersion?.version || 0) + 1,
    content: version.content,
    created_by: user.id,
  });

  return NextResponse.json({ success: true });
}
