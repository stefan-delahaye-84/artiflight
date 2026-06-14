import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { isAdminAuthed } from "@/lib/admin-auth";

type Params = { params: Promise<{ slug: string; version: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug, version } = await params;
  const versionNum = parseInt(version, 10);

  if (isNaN(versionNum) || versionNum < 1) {
    return NextResponse.json({ error: "Invalid version" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: artifact, error: fetchError } = await supabase
    .from("artifacts")
    .select("id")
    .eq("slug", slug)
    .single();

  if (fetchError || !artifact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: versionRow, error } = await supabase
    .from("artifact_versions")
    .select("version, html, note, created_at")
    .eq("artifact_id", artifact.id)
    .eq("version", versionNum)
    .single();

  if (error || !versionRow) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  return NextResponse.json(versionRow);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, version } = await params;
  const versionNum = parseInt(version, 10);

  if (isNaN(versionNum) || versionNum < 1) {
    return NextResponse.json({ error: "Invalid version" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: artifact, error: fetchError } = await supabase
    .from("artifacts")
    .select("id, active_version")
    .eq("slug", slug)
    .single();

  if (fetchError || !artifact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { count, error: countError } = await supabase
    .from("artifact_versions")
    .select("id", { count: "exact", head: true })
    .eq("artifact_id", artifact.id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((count ?? 0) <= 1) {
    return NextResponse.json({ error: "Cannot delete the only version" }, { status: 400 });
  }

  if (artifact.active_version === versionNum) {
    return NextResponse.json(
      { error: "Cannot delete active version — rollback first" },
      { status: 400 }
    );
  }

  const { error: deleteError } = await supabase
    .from("artifact_versions")
    .delete()
    .eq("artifact_id", artifact.id)
    .eq("version", versionNum);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
