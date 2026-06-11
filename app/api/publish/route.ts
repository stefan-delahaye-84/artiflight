import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { generateSlug, uniqueSlug } from "@/lib/slug";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { html, title, description, tags, category, prompt, published } = body;

  if (!html || !title) {
    return NextResponse.json(
      { error: "html and title are required" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const baseSlug = generateSlug(title);

  // Try base slug first; fall back to suffixed slug on conflict.
  let slug = baseSlug;
  const { data: existing } = await supabase
    .from("artifacts")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    slug = uniqueSlug(baseSlug);
  }

  const { data, error } = await supabase
    .from("artifacts")
    .insert({
      slug,
      title,
      description: description ?? null,
      html,
      prompt: prompt ?? null,
      tags: tags ?? [],
      category: category ?? null,
      // Default true unless caller explicitly passes false.
      published: published !== false,
    })
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;

  return NextResponse.json({
    id: data.id,
    slug: data.slug,
    url: `${baseUrl}/p/${data.slug}`,
  });
}
