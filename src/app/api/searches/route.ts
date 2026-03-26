import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getConfigNumber } from "@/lib/config";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("saved_searches")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check limit
  const maxSearches = (await getConfigNumber("max_searches_per_user")) ?? 10;
  const { count } = await supabase
    .from("saved_searches")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= maxSearches) {
    return NextResponse.json(
      { error: `Maximum ${maxSearches} searches allowed` },
      { status: 400 }
    );
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from("saved_searches")
    .insert({
      user_id: user.id,
      name: body.name,
      keyword: body.keyword,
      location: body.location || null,
      date_since_posted: body.date_since_posted || "past week",
      job_type: body.job_type || null,
      remote_filter: body.remote_filter || null,
      experience_level: body.experience_level || [],
      result_limit: body.result_limit || 100,
      sort_by: body.sort_by || "relevant",
      is_active: body.is_active !== false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
