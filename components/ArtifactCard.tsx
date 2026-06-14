"use client";

import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { useArtlightConfig } from "../lib/config-context";

export type ArtifactCardData = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  category: string | null;
  model: string | null;
  views: number;
  created_at: string;
};

export function ArtifactCard({ artifact }: { artifact: ArtifactCardData }) {
  const router = useRouter();
  const { basePath } = useArtlightConfig();

  const date = new Date(artifact.created_at).toLocaleDateString("nl-BE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = `${basePath}/api/artifact/${artifact.slug}/download`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div
      onClick={() => router.push(`${basePath}/p/${artifact.slug}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && router.push(`${basePath}/p/${artifact.slug}`)}
      style={{
        border: "1px solid var(--border)",
        background: "var(--surface-1)",
      }}
      className="group cursor-pointer p-5 rounded-xl hover:border-[#6366f1]/50 hover:bg-[#16161f] transition-all duration-200 hover:shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]/50"
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
        {artifact.views > 0 && (
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {artifact.views} views
          </span>
        )}
      </div>

      {/* Title */}
      <h3
        style={{ color: "var(--foreground)" }}
        className="font-semibold mb-2 leading-snug line-clamp-2 group-hover:text-[#818cf8] transition-colors"
      >
        {artifact.title}
      </h3>

      {/* Model badge */}
      {artifact.model && (
        <div className="mb-2">
          <span
            style={{
              background: "var(--surface-3)",
              color: "var(--muted-foreground)",
              border: "1px solid var(--border)",
            }}
            className="text-[10px] font-mono px-2 py-0.5 rounded-full"
          >
            ✦ {artifact.model}
          </span>
        </div>
      )}

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
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            title="Download HTML"
            style={{ color: "var(--muted-foreground)" }}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex h-5 w-5 items-center justify-center rounded hover:bg-muted hover:text-white"
          >
            <Download size={11} />
          </button>
          <span
            style={{ color: "var(--accent-color)" }}
            className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            View →
          </span>
        </div>
      </div>
    </div>
  );
}
