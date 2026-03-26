import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !["md", "txt"].includes(ext)) {
    return NextResponse.json(
      { error: "Only .md and .txt files are accepted" },
      { status: 400 }
    );
  }

  const text = await file.text();
  const filePath = `${user.id}/resume.${ext}`;

  // Upload to storage (upsert)
  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    return NextResponse.json(
      { error: "Failed to upload file: " + uploadError.message },
      { status: 500 }
    );
  }

  // Update profile with resume text
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      resume_text: text,
      resume_uploaded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update profile: " + updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, resumeText: text });
}
