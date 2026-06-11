import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("artifacts")
    .select("category")
    .not("category", "is", null)
    .order("category");

  if (error) return NextResponse.json([], { status: 500 });

  // Deduplicate; Supabase doesn't support DISTINCT in the JS client select.
  const categories = [
    ...new Set(
      (data ?? []).map((r) => r.category as string).filter(Boolean)
    ),
  ].sort();

  return NextResponse.json(categories);
}
