"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, ExternalLink } from "lucide-react";

type Artifact = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  published: boolean;
  views: number;
  created_at: string;
};

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  // Restore secret from sessionStorage on mount.
  useEffect(() => {
    const stored = sessionStorage.getItem("admin_secret");
    if (stored) {
      setSecret(stored);
      fetchArtifacts(stored);
    }
  }, []);

  async function fetchArtifacts(s: string) {
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/artifacts", {
      headers: { "x-admin-secret": s },
    });

    if (res.status === 401) {
      setError("Wrong admin secret.");
      setLoading(false);
      return;
    }

    if (!res.ok) {
      setError("Failed to load artifacts.");
      setLoading(false);
      return;
    }

    const data = await res.json();
    setArtifacts(data);
    setAuthed(true);
    sessionStorage.setItem("admin_secret", s);
    setLoading(false);
  }

  async function togglePublished(slug: string, current: boolean) {
    setToggling(slug);

    const res = await fetch(`/api/artifact/${slug}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": secret,
      },
      body: JSON.stringify({ published: !current }),
    });

    if (res.ok) {
      setArtifacts((prev) =>
        prev.map((a) => (a.slug === slug ? { ...a, published: !current } : a))
      );
    }

    setToggling(null);
  }

  if (!authed) {
    return (
      <div className="flex items-center justify-center px-6" style={{ minHeight: "calc(100vh - 3.5rem)" }}>
        <div className="w-full max-w-sm space-y-4">
          {/* Lock icon */}
          <div className="text-center mb-2">
            <div
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)" }}
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
            >
              <span style={{ color: "var(--accent-color)" }} className="text-xl">✦</span>
            </div>
            <h1 style={{ color: "var(--foreground)" }} className="text-lg font-semibold">
              Admin
            </h1>
            <p style={{ color: "var(--muted-foreground)" }} className="text-sm mt-1">
              Enter your admin secret to continue.
            </p>
          </div>

          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchArtifacts(secret)}
            placeholder="ADMIN_SECRET"
            className="input"
            autoFocus
          />

          {error && (
            <p style={{ color: "var(--danger)" }} className="text-sm">
              {error}
            </p>
          )}

          <button
            onClick={() => fetchArtifacts(secret)}
            disabled={loading || !secret}
            style={{
              background: "var(--accent-color)",
              boxShadow: "0 0 16px var(--accent-glow)",
              color: "white",
            }}
            className="w-full py-2.5 rounded-lg font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading…" : "Sign in"}
          </button>
        </div>
      </div>
    );
  }

  const publishedItems = artifacts.filter((a) => a.published);
  const unpublishedItems = artifacts.filter((a) => !a.published);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Page header */}
      <div
        style={{ borderBottom: "1px solid var(--border)" }}
        className="flex items-center justify-between pb-6 mb-8"
      >
        <div className="flex items-center gap-4">
          <a
            href="/"
            style={{ color: "var(--accent-color)" }}
            className="text-sm hover:opacity-80 transition-opacity"
          >
            ← gallery
          </a>
          <h1 style={{ color: "var(--foreground)" }} className="text-sm font-semibold">
            Admin
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span style={{ color: "var(--muted-foreground)" }} className="text-xs">
            {publishedItems.length} published · {unpublishedItems.length} hidden
          </span>
          <a
            href="/admin/upload"
            style={{
              background: "var(--accent-color)",
              boxShadow: "0 0 10px var(--accent-glow)",
              color: "white",
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity"
          >
            + Upload
          </a>
        </div>
      </div>

      <div className="space-y-8">
        <ArtifactTable
          title="Published"
          items={publishedItems}
          secret={secret}
          toggling={toggling}
          onToggle={togglePublished}
        />
        {unpublishedItems.length > 0 && (
          <ArtifactTable
            title="Hidden"
            items={unpublishedItems}
            secret={secret}
            toggling={toggling}
            onToggle={togglePublished}
          />
        )}
      </div>
    </div>
  );
}

function ArtifactTable({
  title,
  items,
  toggling,
  onToggle,
}: {
  title: string;
  items: Artifact[];
  secret: string;
  toggling: string | null;
  onToggle: (slug: string, current: boolean) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2
        style={{ color: "var(--muted-foreground)" }}
        className="text-xs font-medium uppercase tracking-wide mb-3"
      >
        {title} ({items.length})
      </h2>

      <div
        style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
        className="rounded-xl overflow-hidden"
      >
        <table className="w-full text-sm">
          <thead style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
            <tr className="text-left">
              <th style={{ color: "var(--muted-foreground)" }} className="px-4 py-2.5 text-xs font-medium">
                Title
              </th>
              <th style={{ color: "var(--muted-foreground)" }} className="px-4 py-2.5 text-xs font-medium hidden sm:table-cell">
                Category
              </th>
              <th style={{ color: "var(--muted-foreground)" }} className="px-4 py-2.5 text-xs font-medium hidden sm:table-cell">
                Views
              </th>
              <th style={{ color: "var(--muted-foreground)" }} className="px-4 py-2.5 text-xs font-medium">
                Status
              </th>
              <th style={{ color: "var(--muted-foreground)" }} className="px-4 py-2.5 text-xs font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((artifact, i) => (
              <ArtifactRow
                key={artifact.id}
                artifact={artifact}
                toggling={toggling}
                onToggle={onToggle}
                isLast={i === items.length - 1}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ArtifactRow({
  artifact,
  toggling,
  onToggle,
  isLast,
}: {
  artifact: Artifact;
  toggling: string | null;
  onToggle: (slug: string, current: boolean) => void;
  isLast: boolean;
}) {
  const date = new Date(artifact.created_at).toLocaleDateString("nl-BE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <tr
      style={
        isLast
          ? { background: "transparent" }
          : { borderBottom: "1px solid var(--border)", background: "transparent" }
      }
      className="hover:bg-white/[0.02] transition-colors"
    >
      <td className="px-4 py-3">
        <div style={{ color: "var(--foreground)" }} className="font-medium truncate max-w-[200px]">
          {artifact.title}
        </div>
        <div style={{ color: "var(--muted-foreground)" }} className="text-xs mt-0.5">
          {date}
        </div>
      </td>

      <td className="px-4 py-3 hidden sm:table-cell">
        {artifact.category ? (
          <span style={{ color: "var(--muted-foreground)" }} className="text-xs capitalize">
            {artifact.category}
          </span>
        ) : (
          <span style={{ color: "var(--border-strong)" }} className="text-xs">
            —
          </span>
        )}
      </td>

      <td className="px-4 py-3 hidden sm:table-cell">
        <span style={{ color: "var(--muted-foreground)" }} className="text-xs">
          {artifact.views}
        </span>
      </td>

      <td className="px-4 py-3">
        {artifact.published ? (
          <span
            style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
            Published
          </span>
        ) : (
          <span
            style={{ background: "var(--surface-3)", color: "var(--muted-foreground)" }}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40" />
            Hidden
          </span>
        )}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {artifact.published && (
            <a
              href={`/p/${artifact.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                border: "1px solid var(--border-strong)",
                background: "var(--surface-2)",
                color: "var(--muted-foreground)",
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:text-white hover:border-[#6366f1]/50 transition-colors"
              title="View"
            >
              <ExternalLink size={13} />
            </a>
          )}

          <button
            onClick={() => onToggle(artifact.slug, artifact.published)}
            disabled={toggling === artifact.slug}
            title={artifact.published ? "Hide" : "Publish"}
            style={{
              border: "1px solid var(--border-strong)",
              background: "var(--surface-2)",
              color: "var(--muted-foreground)",
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:text-white hover:border-[#6366f1]/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {artifact.published ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
      </td>
    </tr>
  );
}
