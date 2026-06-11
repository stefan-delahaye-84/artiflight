import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { DeleteButton } from "@/components/DeleteButton";
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

  void incrementViews(artifact.id);

  const createdDate = new Date(artifact.created_at).toLocaleDateString("nl-BE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Slim 40px header — one single row */}
      <header className="h-10 shrink-0 border-b flex items-center gap-2 px-3 text-xs text-muted-foreground overflow-hidden">
        <a
          href="/"
          className="shrink-0 hover:text-foreground transition-colors font-medium"
        >
          ← artiflight
        </a>

        <span className="text-border select-none">|</span>

        <span className="truncate font-medium text-foreground min-w-0">
          {artifact.title}
        </span>

        {/* Right side: meta + delete — never shrinks, pushes title left */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {artifact.category && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
              {artifact.category}
            </span>
          )}
          <span>{artifact.views + 1} views</span>
          <span className="hidden sm:inline">{createdDate}</span>
          <DeleteButton slug={slug} />
        </div>
      </header>

      {/* iframe fills remaining viewport height exactly */}
      <main className="flex-1 overflow-hidden">
        <iframe
          srcDoc={artifact.html}
          sandbox="allow-scripts allow-forms allow-modals allow-popups"
          className="w-full h-full border-0"
          title={artifact.title}
        />
      </main>
    </div>
  );
}
