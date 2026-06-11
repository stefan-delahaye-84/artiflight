import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

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

  const { data } = await supabase
    .from("artifacts")
    .select("id, slug, title, description, tags, category, views, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });

  const artifacts: Artifact[] = data ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4">

      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="py-24 text-center relative">
        {/* Ambient glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <div
            style={{ background: "var(--accent-color)", filter: "blur(80px)" }}
            className="w-96 h-96 rounded-full"
          />
        </div>

        <div className="relative">
          {/* Badge */}
          <div
            style={{
              border: "1px solid rgba(99,102,241,0.3)",
              color: "var(--accent-color)",
              background: "var(--accent-glow)",
            }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-6"
          >
            <span
              style={{ background: "var(--neon)" }}
              className="w-1.5 h-1.5 rounded-full animate-pulse"
            />
            Open source · Self-hostable · Any LLM
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            <span className="gradient-text">Publish</span>
            <br />
            <span style={{ color: "var(--foreground)" }}>AI Artifacts</span>
          </h1>

          <p
            style={{ color: "var(--muted-foreground)" }}
            className="text-lg max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Share interactive apps built with Claude, GPT, or any AI via your own
            domain. No claude.ai URLs. Your platform, your branding.
          </p>

          {/* CTA buttons */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/admin/upload"
              style={{
                background: "var(--accent-color)",
                boxShadow: "0 0 24px var(--accent-glow)",
              }}
              className="px-5 py-2.5 rounded-lg font-medium text-white hover:opacity-90 transition-all hover:scale-105 active:scale-95"
            >
              Upload Artifact
            </Link>
            <a
              href="https://github.com/stefan-delahaye-84/artiflight"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                border: "1px solid var(--border-strong)",
                background: "var(--surface-1)",
                color: "var(--muted-foreground)",
              }}
              className="px-5 py-2.5 rounded-lg font-medium hover:text-white transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </div>

      {/* ── Stats bar ────────────────────────────────────── */}
      <div
        style={{ border: "1px solid var(--border)", background: "var(--border)" }}
        className="grid grid-cols-3 gap-px rounded-xl overflow-hidden mb-16"
      >
        {[
          { label: "Artifacts", value: artifacts.length },
          { label: "Open Source", value: "MIT" },
          { label: "Deploy", value: "Vercel" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{ background: "var(--surface-1)" }}
            className="px-6 py-4 text-center"
          >
            <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
              {stat.value}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Gallery ──────────────────────────────────────── */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
            Published Artifacts
          </h2>
          <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {artifacts.length} {artifacts.length === 1 ? "artifact" : "artifacts"}
          </span>
        </div>

        {artifacts.length === 0 ? (
          <div
            style={{ border: "1px dashed var(--border-strong)" }}
            className="text-center py-24 rounded-xl"
          >
            <div className="text-4xl mb-4 opacity-30">✦</div>
            <p style={{ color: "var(--muted-foreground)" }} className="mb-4 text-sm">
              No artifacts yet
            </p>
            <Link
              href="/admin/upload"
              style={{ color: "var(--accent-color)" }}
              className="text-sm hover:opacity-80 transition-opacity"
            >
              Upload your first artifact →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {artifacts.map((artifact) => (
              <ArtifactCard key={artifact.id} artifact={artifact} />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer
        style={{ borderTop: "1px solid var(--border)" }}
        className="py-8 mb-4"
      >
        <div
          className="flex items-center justify-between text-sm"
          style={{ color: "var(--muted-foreground)" }}
        >
          <span>Artiflight — Open source artifact publishing</span>
          <span>From any LLM to public ✦</span>
        </div>
      </footer>
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
    <Link
      href={`/p/${artifact.slug}`}
      style={{
        border: "1px solid var(--border)",
        background: "var(--surface-1)",
      }}
      className="group block p-5 rounded-xl hover:border-[#6366f1]/50 hover:bg-[#16161f] transition-all duration-200 hover:shadow-lg"
    >
      {/* Category + views */}
      <div className="flex items-start justify-between mb-3">
        <span
          style={{
            border: "1px solid rgba(99,102,241,0.2)",
            color: "var(--accent-color)",
            background: "var(--accent-glow)",
          }}
          className="text-[10px] font-mono px-2 py-0.5 rounded-full capitalize"
        >
          {artifact.category ?? "artifact"}
        </span>
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {artifact.views} views
        </span>
      </div>

      {/* Title */}
      <h3
        style={{ color: "var(--foreground)" }}
        className="font-semibold mb-2 leading-snug line-clamp-2 group-hover:text-[#818cf8] transition-colors"
      >
        {artifact.title}
      </h3>

      {/* Description */}
      {artifact.description && (
        <p
          style={{ color: "var(--muted-foreground)" }}
          className="text-sm line-clamp-2 mb-4 leading-relaxed"
        >
          {artifact.description}
        </p>
      )}

      {/* Tags */}
      {artifact.tags && artifact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {artifact.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                background: "var(--surface-3)",
                color: "var(--muted-foreground)",
              }}
              className="text-[10px] px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
          {artifact.tags.length > 3 && (
            <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
              +{artifact.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer row */}
      <div
        style={{ borderTop: "1px solid var(--border)" }}
        className="pt-3 flex items-center justify-between"
      >
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {date}
        </span>
        <span
          style={{ color: "var(--accent-color)" }}
          className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        >
          View →
        </span>
      </div>
    </Link>
  );
}
