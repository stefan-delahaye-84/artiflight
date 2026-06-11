import { createServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const CATEGORY_COLORS: Record<string, string> = {
  hiking:  "bg-emerald-900/60 text-emerald-300 border-emerald-800",
  food:    "bg-orange-900/60 text-orange-300 border-orange-800",
  running: "bg-blue-900/60 text-blue-300 border-blue-800",
  music:   "bg-purple-900/60 text-purple-300 border-purple-800",
  imaging: "bg-cyan-900/60 text-cyan-300 border-cyan-800",
  tech:    "bg-zinc-800/60 text-zinc-300 border-zinc-700",
};

type Artifact = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  category: string | null;
  views: number;
  created_at: string;
};

export default async function HomePage() {
  const supabase = createServerClient();

  const { data: artifacts } = await supabase
    .from("artifacts")
    .select("id, slug, title, description, tags, category, views, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });

  const items: Artifact[] = artifacts ?? [];

  return (
    // dark class forces dark CSS variables for the entire page
    <div className="dark min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10 px-6 py-5">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">artiflight</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Publish HTML artifacts on your own domain.
            </p>
          </div>
          <a
            href="/admin/upload"
            className="rounded-md border border-white/15 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-white/30 transition-colors"
          >
            + Upload
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-muted-foreground">No artifacts yet.</p>
            <a
              href="/admin/upload"
              className="mt-4 text-sm font-medium underline underline-offset-4"
            >
              Publish your first artifact →
            </a>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((artifact) => (
              <ArtifactCard key={artifact.id} artifact={artifact} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ArtifactCard({ artifact }: { artifact: Artifact }) {
  const date = new Date(artifact.created_at).toLocaleDateString("nl-BE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const categoryClass = artifact.category
    ? (CATEGORY_COLORS[artifact.category] ?? "bg-zinc-800/60 text-zinc-300 border-zinc-700")
    : null;

  return (
    <a
      href={`/p/${artifact.slug}`}
      className="group flex flex-col rounded-xl border border-white/10 bg-card p-5 hover:border-white/25 hover:bg-white/5 transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-2 min-w-0">
        <h2 className="font-medium leading-snug truncate group-hover:text-white transition-colors">
          {artifact.title}
        </h2>
        {categoryClass && artifact.category && (
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${categoryClass}`}>
            {artifact.category}
          </span>
        )}
      </div>

      {artifact.description && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {artifact.description}
        </p>
      )}

      {artifact.tags && artifact.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {artifact.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto pt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{date}</span>
        <span>{artifact.views} views</span>
      </div>
    </a>
  );
}
