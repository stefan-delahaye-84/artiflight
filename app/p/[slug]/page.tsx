import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { DeleteButton } from "@/components/DeleteButton";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { DownloadButton } from "@/components/DownloadButton";
import { EditArtifactPanel } from "@/components/EditArtifactPanel";
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

  const createdDate = new Date(artifact.created_at).toLocaleDateString("nl-BE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className="flex flex-col"
      style={{ height: "calc(100vh - 3.5rem)" }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--surface-1)",
          height: "3rem",
        }}
        className="shrink-0 flex items-center gap-2 px-3 text-xs"
      >
        <a
          href="/"
          style={{ color: "var(--accent-color)" }}
          className="shrink-0 font-medium hover:opacity-80 transition-opacity flex items-center gap-1"
        >
          ← artiflight
        </a>

        <span style={{ color: "var(--border-strong)" }} className="select-none" aria-hidden>
          |
        </span>

        <span
          style={{ color: "var(--foreground)" }}
          className="truncate font-medium min-w-0"
        >
          {artifact.title}
        </span>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {artifact.category && (
            <span
              style={{
                border: "1px solid rgba(99,102,241,0.2)",
                color: "var(--accent-color)",
                background: "var(--accent-glow)",
              }}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full capitalize"
            >
              {artifact.category}
            </span>
          )}

          {artifact.model && (
            <span
              style={{
                background: "var(--surface-3)",
                color: "var(--muted-foreground)",
                border: "1px solid var(--border)",
              }}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full hidden sm:inline-flex items-center gap-1"
            >
              ✦ {artifact.model}
            </span>
          )}

          <span style={{ color: "var(--muted-foreground)" }}>
            {artifact.views + 1} views
          </span>

          <span style={{ color: "var(--border-strong)" }} aria-hidden>·</span>

          <span style={{ color: "var(--muted-foreground)" }}>{createdDate}</span>

          <DownloadButton slug={slug} />
          <CopyLinkButton />
          <EditArtifactPanel
            slug={slug}
            artifact={{
              title: artifact.title,
              description: artifact.description,
              category: artifact.category,
              tags: artifact.tags,
              model: artifact.model,
              prompt: artifact.prompt,
            }}
          />
          <DeleteButton slug={slug} title={artifact.title} />
        </div>
      </header>

      {/* iframe fills remaining height */}
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
