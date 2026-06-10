import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category");
  const tag = searchParams.get("tag");

  const supabase = createServerClient();

  let query = supabase
    .from("artifacts")
    .select("id, slug, title, description, tags, category, views, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);
  if (tag) query = query.contains("tags", [tag]);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
