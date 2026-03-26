import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
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
  const { value } = body;

  // Get old value for audit
  const { data: existing } = await supabase
    .from("system_config")
    .select("value")
    .eq("key", key)
    .single();

  // Update config
  const { error } = await supabase
    .from("system_config")
    .update({
      value,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("key", key);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit log
  await supabase.from("config_audit_log").insert({
    config_key: key,
    old_value: existing?.value ?? null,
    new_value: value,
    changed_by: user.id,
  });

  return NextResponse.json({ success: true });
}
