import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("resume_text, resume_uploaded_at")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    resumeText: profile?.resume_text || null,
    uploadedAt: profile?.resume_uploaded_at || null,
  });
}
