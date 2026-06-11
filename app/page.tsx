import { createServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  hiking: "Hiking",
  food: "Food",
  running: "Running",
  music: "Music",
  imaging: "Imaging",
  tech: "Tech",
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
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-5">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">artiflight</h1>
            <p className="text-sm text-muted-foreground">
              Publish HTML artifacts on your own domain.
            </p>
          </div>
          <a
            href="/admin/upload"
            className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
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

  return (
    <a
      href={`/p/${artifact.slug}`}
      className="group flex flex-col rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-medium leading-snug group-hover:underline">
          {artifact.title}
        </h2>
        {artifact.category && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {CATEGORY_LABELS[artifact.category] ?? artifact.category}
          </span>
        )}
      </div>

      {artifact.description && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {artifact.description}
        </p>
      )}

      {artifact.tags && artifact.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {artifact.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{date}</span>
        <span>{artifact.views} views</span>
      </div>
    </a>
  );
}
