import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { ArtifactCard } from "@/components/ArtifactCard";
import type { ArtifactCardData } from "@/components/ArtifactCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createServerClient();

  const { data } = await supabase
    .from("artifacts")
    .select("id, slug, title, description, tags, category, model, views, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });

  const artifacts: ArtifactCardData[] = data ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4">

      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="pt-16 pb-10 text-center relative">
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
          <h1 className="text-2xl md:text-3xl lg:text-5xl font-bold tracking-tight mb-6 leading-tight whitespace-nowrap">
            <span className="gradient-text">Publish </span>
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
        className="grid grid-cols-3 gap-px rounded-xl overflow-hidden mb-10"
      >
        {[
          { label: "Artifacts", value: artifacts.length },
          { label: "Open Source", value: "MIT" },
          { label: "Deploy", value: "Vercel" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{ background: "var(--surface-1)" }}
            className="px-4 py-3 text-center"
          >
            <div className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
              {stat.value}
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Gallery ──────────────────────────────────────── */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-5">
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
