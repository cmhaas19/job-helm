import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { user_rating, user_notes } = body;

  if (user_rating !== null && (user_rating < 1 || user_rating > 4)) {
    return NextResponse.json(
      { error: "Rating must be between 1 and 4" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("job_evaluations")
    .update({
      user_rating,
      user_notes: user_notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
