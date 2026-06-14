"use client";

import { useEffect, useState } from "react";
import { wrapTsx } from "../../lib/utils";
import { Eye, EyeOff, ExternalLink, Upload, Loader2, Check, X, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

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
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  // Auto-login if the session cookie is already set.
  useEffect(() => {
    const hasSession = document.cookie.split(";").some((c) => c.trim() === "admin_session=1");
    if (hasSession) fetchArtifacts();
  }, []);

  async function handleLogin() {
    if (!password) return;
    setLoading(true);
    setError("");

    const loginRes = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (loginRes.status === 401) {
      setError("Wrong password.");
      setLoading(false);
      return;
    }

    await fetchArtifacts();
  }

  async function fetchArtifacts() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/artifacts");

    if (res.status === 401) {
      setAuthed(false);
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
    setLoading(false);
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setArtifacts([]);
    setPassword("");
  }

  function handleDelete(slug: string) {
    setArtifacts((prev) => prev.filter((a) => a.slug !== slug));
  }

  async function togglePublished(slug: string, current: boolean) {
    setToggling(slug);

    const res = await fetch(`/api/artifact/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
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
              Enter your password to continue.
            </p>
          </div>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Password"
            className="input"
            autoFocus
          />

          {error && (
            <p style={{ color: "var(--danger)" }} className="text-sm">
              {error}
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !password}
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
          <button
            onClick={handleLogout}
            style={{ border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted-foreground)" }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <ArtifactTable
          title="Published"
          items={publishedItems}
          toggling={toggling}
          onToggle={togglePublished}
          onDelete={handleDelete}
        />
        {unpublishedItems.length > 0 && (
          <ArtifactTable
            title="Hidden"
            items={unpublishedItems}
            toggling={toggling}
            onToggle={togglePublished}
            onDelete={handleDelete}
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
  onDelete,
}: {
  title: string;
  items: Artifact[];
  toggling: string | null;
  onToggle: (slug: string, current: boolean) => void;
  onDelete: (slug: string) => void;
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
                onDelete={onDelete}
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
  onDelete,
  isLast,
}: {
  artifact: Artifact;
  toggling: string | null;
  onToggle: (slug: string, current: boolean) => void;
  onDelete: (slug: string) => void;
  isLast: boolean;
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const date = new Date(artifact.created_at).toLocaleDateString("nl-BE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  async function handleDelete() {
    setDeleting(true);
    setDeleteError("");
    const res = await fetch(`/api/artifact/${artifact.slug}`, {
      method: "DELETE",
    });
    if (res.ok) {
      onDelete(artifact.slug);
    } else {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error ?? "Delete failed");
      setDeleting(false);
    }
  }

  return (
    <>
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
              onClick={() => setUploadOpen(true)}
              title="Nieuwe versie"
              style={{
                border: "1px solid var(--border-strong)",
                background: "var(--surface-2)",
                color: "var(--muted-foreground)",
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:text-white hover:border-[#6366f1]/50 transition-colors"
            >
              <Upload size={13} />
            </button>

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

            <button
              onClick={() => { setDeleteOpen(true); setDeleteError(""); }}
              title="Delete"
              style={{
                border: "1px solid var(--border-strong)",
                background: "var(--surface-2)",
                color: "var(--muted-foreground)",
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:text-red-400 hover:border-red-500/50 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      </tr>

      <UploadVersionDialog
        slug={artifact.slug}
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />

      <Dialog open={deleteOpen} onOpenChange={(open) => { if (!open) { setDeleteOpen(false); setDeleteError(""); } }}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete artifact?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <p style={{ color: "var(--muted-foreground)" }} className="text-sm">
              Delete <span style={{ color: "var(--foreground)" }} className="font-medium">{artifact.title}</span>? This cannot be undone.
            </p>
            {deleteError && (
              <p className="text-xs" style={{ color: "var(--danger)" }}>{deleteError}</p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setDeleteOpen(false); setDeleteError(""); }}
                disabled={deleting}
                style={{ border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--muted-foreground)" }}
                className="px-3 py-1.5 rounded-lg text-sm hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ background: "var(--danger, #ef4444)", color: "white" }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function UploadVersionDialog({
  slug,
  open,
  onClose,
}: {
  slug: string;
  open: boolean;
  onClose: () => void;
}) {
  const [html, setHtml] = useState("");
  const [fileName, setFileName] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [dragging, setDragging] = useState(false);

  function resetForm() {
    setHtml("");
    setFileName("");
    setNote("");
    setStatus("idle");
    setErrorMsg("");
    setDragging(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      resetForm();
      onClose();
    }
  }

  function readFile(file: File) {
    const isTsx = file.name.match(/\.tsx?$/i);
    const isHtml = file.name.match(/\.html?$/i);
    if (!isTsx && !isHtml) {
      setErrorMsg("Only .html or .tsx files are supported.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? "";
      setHtml(isTsx ? wrapTsx(text) : text);
      setFileName(file.name);
      setErrorMsg("");
    };
    reader.readAsText(file, "utf-8");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) readFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  }

  async function handleSubmit() {
    if (!html || !note.trim()) return;
    setStatus("uploading");
    setErrorMsg("");

    const res = await fetch(`/api/artifact/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html, note: note.trim() }),
    });

    if (res.ok) {
      setStatus("success");
      setTimeout(() => handleOpenChange(false), 800);
    } else {
      const data = await res.json().catch(() => ({}));
      setErrorMsg(data.error ?? "Upload failed");
      setStatus("error");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Nieuwe versie</DialogTitle>
            <button
              onClick={() => handleOpenChange(false)}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById(`file-input-${slug}`)?.click()}
            style={{
              border: `2px dashed ${dragging ? "var(--accent-color)" : "var(--border-strong)"}`,
              background: dragging ? "var(--accent-glow)" : "var(--surface-2)",
              transition: "all 0.15s",
              cursor: "pointer",
            }}
            className="rounded-lg p-6 flex flex-col items-center justify-center gap-2"
          >
            <Upload size={18} style={{ color: "var(--muted-foreground)" }} />
            {fileName ? (
              <span style={{ color: "var(--foreground)" }} className="text-sm font-medium">
                {fileName}
              </span>
            ) : (
              <span style={{ color: "var(--muted-foreground)" }} className="text-sm">
                Drop .html or .tsx, or click to browse
              </span>
            )}
            <input
              id={`file-input-${slug}`}
              type="file"
              accept=".html,.htm,.tsx,.ts"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Note */}
          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
              Note <span style={{ color: "var(--danger)" }}>*</span>
              <span style={{ color: "var(--muted-foreground)" }} className="ml-1.5 font-normal">
                {note.length}/100
              </span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 100))}
              placeholder="Short description of this version"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {errorMsg && (
            <p className="text-xs" style={{ color: "var(--danger)" }}>
              {errorMsg}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!html || !note.trim() || status === "uploading" || status === "success"}
            style={{
              background:
                status === "success"
                  ? "var(--success)"
                  : status === "uploading"
                  ? "var(--surface-3)"
                  : "var(--accent-color)",
              boxShadow:
                status === "uploading" || status === "success"
                  ? "none"
                  : "0 0 12px var(--accent-glow)",
            }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "uploading" && <Loader2 size={14} className="animate-spin" />}
            {status === "success" && <Check size={14} />}
            {status === "uploading"
              ? "Publiceren…"
              : status === "success"
              ? "Gepubliceerd!"
              : "Versie publiceren"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
