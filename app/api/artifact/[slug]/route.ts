import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("artifacts")
    .select("id, slug, title, description, tags, category, model, views, prompt, created_at, updated_at")
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
  const { html, note, published, title, description, category, tags, model, prompt, active_version } = body as {
    html?: string;
    note?: string;
    published?: boolean;
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
    model?: string;
    prompt?: string;
    active_version?: number;
  };

  const supabase = createServerClient();

  // --- Rollback to a specific version ---
  if (active_version !== undefined) {
    const { data: artifact, error: fetchError } = await supabase
      .from("artifacts")
      .select("id")
      .eq("slug", slug)
      .single();

    if (fetchError || !artifact) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: versionRow, error: versionError } = await supabase
      .from("artifact_versions")
      .select("html")
      .eq("artifact_id", artifact.id)
      .eq("version", active_version)
      .single();

    if (versionError || !versionRow) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("artifacts")
      .update({ html: versionRow.html, active_version, updated_at: new Date().toISOString() })
      .eq("id", artifact.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, active_version });
  }

  // --- Publish toggle ---
  if (published !== undefined && !html) {
    const { error } = await supabase
      .from("artifacts")
      .update({ published, updated_at: new Date().toISOString() })
      .eq("slug", slug);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, published });
  }

  // --- Metadata update (title, description, category, tags, model, prompt) ---
  if (!html) {
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (category !== undefined) update.category = category;
    if (tags !== undefined) update.tags = tags;
    if (model !== undefined) update.model = model;
    if (prompt !== undefined) update.prompt = prompt;

    const { error } = await supabase.from("artifacts").update(update).eq("slug", slug);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // --- HTML update via atomic publish_new_version function ---
  const { data: artifact, error: fetchError } = await supabase
    .from("artifacts")
    .select("id")
    .eq("slug", slug)
    .single();

  if (fetchError || !artifact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: nextVersion, error: rpcError } = await supabase.rpc("publish_new_version", {
    p_artifact_id: artifact.id,
    p_html: html,
    p_note: note ?? null,
  });

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
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
