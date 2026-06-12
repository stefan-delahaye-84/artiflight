import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const supabase = createServerClient();

  const { data: artifact, error: fetchError } = await supabase
    .from("artifacts")
    .select("id, active_version")
    .eq("slug", slug)
    .single();

  if (fetchError || !artifact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: versions, error } = await supabase
    .from("artifact_versions")
    .select("version, note, created_at")
    .eq("artifact_id", artifact.id)
    .order("version", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = (versions ?? []).map((v) => ({
    version: v.version,
    note: v.note,
    created_at: v.created_at,
    is_active: v.version === artifact.active_version,
  }));

  return NextResponse.json(result);
}
