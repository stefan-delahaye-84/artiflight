import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
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
    .select("id, title, description, html, tags, category, views, created_at")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!artifact) notFound();

  // Fire-and-forget view increment (non-blocking).
  void incrementViews(artifact.id);

  const createdDate = new Date(artifact.created_at).toLocaleDateString("nl-BE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <a href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          ← artiflight
        </a>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {artifact.category && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
              {artifact.category}
            </span>
          )}
          <span>{artifact.views + 1} views</span>
          <span>{createdDate}</span>
        </div>
      </header>

      <div className="border-b px-6 py-4">
        <h1 className="text-xl font-semibold">{artifact.title}</h1>
        {artifact.description && (
          <p className="mt-1 text-sm text-muted-foreground">{artifact.description}</p>
        )}
        {artifact.tags && artifact.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {artifact.tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <main className="flex-1">
        {/* sandbox: allow-scripts lets the artifact run JS, but omitting
            allow-same-origin prevents it from accessing parent cookies/storage. */}
        <iframe
          srcDoc={artifact.html}
          sandbox="allow-scripts allow-forms allow-modals allow-popups"
          className="w-full h-full min-h-[calc(100vh-130px)] border-0"
          title={artifact.title}
        />
      </main>
    </div>
  );
}
