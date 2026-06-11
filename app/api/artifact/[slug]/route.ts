import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("artifacts")
    .select("id, slug, title, description, tags, category, views, prompt, created_at, updated_at")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { html, note, published } = body as {
    html?: string;
    note?: string;
    published?: boolean;
  };

  const supabase = createServerClient();

  // --- Publish toggle (no HTML update, no versioning) ---
  if (published !== undefined && !html) {
    const { error } = await supabase
      .from("artifacts")
      .update({ published, updated_at: new Date().toISOString() })
      .eq("slug", slug);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, published });
  }

  // --- HTML update with versioning ---
  if (!html) {
    return NextResponse.json({ error: "html or published is required" }, { status: 400 });
  }

  const { data: artifact, error: fetchError } = await supabase
    .from("artifacts")
    .select("id")
    .eq("slug", slug)
    .single();

  if (fetchError || !artifact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { count } = await supabase
    .from("artifact_versions")
    .select("id", { count: "exact", head: true })
    .eq("artifact_id", artifact.id);

  const nextVersion = (count ?? 0) + 1;

  const { error: versionError } = await supabase
    .from("artifact_versions")
    .insert({
      artifact_id: artifact.id,
      html,
      version: nextVersion,
      note: note ?? null,
    });

  if (versionError) {
    return NextResponse.json({ error: versionError.message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("artifacts")
    .update({ html, updated_at: new Date().toISOString() })
    .eq("id", artifact.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, version: nextVersion });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  const { error } = await supabase
    .from("artifacts")
    .delete()
    .eq("slug", slug);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
