import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { ArtifactView } from "@/components/ArtifactView";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServerClient();

  const { data } = await supabase
    .from("artifacts")
    .select("title, description")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!data) return { title: "Not found" };

  return {
    title: data.title,
    description: data.description ?? undefined,
  };
}

async function incrementViews(id: string) {
  const supabase = createServerClient();
  await supabase.rpc("increment_views", { artifact_id: id });
}

export default async function ArtifactPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServerClient();

  const { data: artifact } = await supabase
    .from("artifacts")
    .select("id, title, description, html, tags, category, model, prompt, views, created_at")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!artifact) notFound();

  void incrementViews(artifact.id);

  return <ArtifactView slug={slug} artifact={artifact} />;
}
