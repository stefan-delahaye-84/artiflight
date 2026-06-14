import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { isAdminAuthed } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  // No published filter — admin sees everything.
  const { data, error } = await supabase
    .from("artifacts")
    .select("id, slug, title, category, published, views, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
