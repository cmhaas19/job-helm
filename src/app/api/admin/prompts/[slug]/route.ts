import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
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

  const { data: prompt } = await supabase
    .from("system_prompts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  const { data: versions } = await supabase
    .from("prompt_versions")
    .select("*")
    .eq("prompt_id", prompt.id)
    .order("version", { ascending: false });

  return NextResponse.json({ ...prompt, versions: versions || [] });
}

export async function PUT(
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

  const { data: prompt } = await supabase
    .from("system_prompts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  // Get latest version number
  const { data: latestVersion } = await supabase
    .from("prompt_versions")
    .select("version")
    .eq("prompt_id", prompt.id)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (latestVersion?.version || 0) + 1;

  // Save version
  await supabase.from("prompt_versions").insert({
    prompt_id: prompt.id,
    version: nextVersion,
    content: body.content,
    created_by: user.id,
  });

  // Update prompt
  const { error } = await supabase
    .from("system_prompts")
    .update({
      content: body.content,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("slug", slug);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, version: nextVersion });
}
