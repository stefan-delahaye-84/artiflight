"use client";

import { useState, useEffect, useRef } from "react";
import { Trash2, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { DownloadButton } from "./DownloadButton";
import { CopyLinkButton } from "./CopyLinkButton";
import { EditArtifactPanel } from "./EditArtifactPanel";
import { DeleteButton } from "./DeleteButton";

export interface ArtifactVersion {
  version: number;
  note: string | null;
  created_at: string;
  is_active: boolean;
}

export interface ArtifactData {
  id: string;
  title: string;
  description: string | null;
  html: string;
  tags: string[] | null;
  category: string | null;
  model: string | null;
  prompt: string | null;
  views: number;
  created_at: string;
}

export interface ArtifactViewProps {
  slug: string;
  artifact: ArtifactData;
}

function formatVersionDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "short",
  });
}

export function ArtifactView({ slug, artifact }: ArtifactViewProps) {
  const [currentHtml, setCurrentHtml] = useState(artifact.html);
  const [versions, setVersions] = useState<ArtifactVersion[]>([]);
  const [displayedVersion, setDisplayedVersion] = useState<number | null>(null);
  const [versionLoading, setVersionLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const createdDate = new Date(artifact.created_at).toLocaleDateString("nl-BE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  useEffect(() => {
    fetch(`/api/artifact/${slug}/versions`)
      .then((r) => r.json())
      .then((data: ArtifactVersion[]) => {
        setVersions(data);
        const active = data.find((v) => v.is_active);
        if (active) setDisplayedVersion(active.version);
      })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    const authed = document.cookie.split(";").some((c) => c.trim() === "admin_session=1");
    setIsAdmin(authed);
  }, []);

  async function handleVersionChange(version: number) {
    if (version === displayedVersion || versionLoading) return;
    setVersionLoading(true);
    try {
      const res = await fetch(`/api/artifact/${slug}/versions/${version}`);
      const data = await res.json();
      setCurrentHtml(data.html);
      setDisplayedVersion(version);
    } finally {
      setVersionLoading(false);
    }
  }

  async function handleDelete(version: number) {
    setDeleting(true);
    setDeleteError("");

    const res = await fetch(`/api/artifact/${slug}/versions/${version}`, {
      method: "DELETE",
    });

    if (res.ok) {
      const remaining = versions.filter((v) => v.version !== version);
      setVersions(remaining);
      // If the deleted version was being displayed, switch to the active version
      if (displayedVersion === version) {
        const activeVer = remaining.find((v) => v.is_active);
        if (activeVer) void handleVersionChange(activeVer.version);
      }
      setDeleteConfirm(null);
    } else {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error ?? "Delete failed");
    }

    setDeleting(false);
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 3.5rem)" }}>
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

          {versions.length > 0 && (
            <>
              <span style={{ color: "var(--border-strong)" }} aria-hidden>·</span>
              <VersionDropdown
                versions={versions}
                displayedVersion={displayedVersion}
                isAdmin={isAdmin}
                loading={versionLoading}
                onSelect={handleVersionChange}
                onDeleteRequest={setDeleteConfirm}
              />
            </>
          )}

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

      <main className="flex-1 overflow-hidden">
        <iframe
          srcDoc={currentHtml}
          sandbox="allow-scripts allow-forms allow-modals allow-popups"
          className="w-full h-full border-0"
          title={artifact.title}
        />
      </main>

      {/* Delete confirm dialog */}
      <Dialog
        open={deleteConfirm !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirm(null);
            setDeleteError("");
          }
        }}
      >
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Versie verwijderen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <p style={{ color: "var(--muted-foreground)" }} className="text-sm">
              Versie {deleteConfirm} verwijderen? Dit kan niet ongedaan worden.
            </p>
            {deleteError && (
              <p className="text-xs" style={{ color: "var(--danger)" }}>
                {deleteError}
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setDeleteConfirm(null);
                  setDeleteError("");
                }}
                disabled={deleting}
                style={{
                  border: "1px solid var(--border-strong)",
                  background: "var(--surface-2)",
                  color: "var(--muted-foreground)",
                }}
                className="px-3 py-1.5 rounded-lg text-sm hover:text-white transition-colors disabled:opacity-50"
              >
                Annuleren
              </button>
              <button
                onClick={() => deleteConfirm !== null && handleDelete(deleteConfirm)}
                disabled={deleting}
                style={{
                  background: "var(--danger, #ef4444)",
                  color: "white",
                }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Verwijderen…" : "Verwijderen"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VersionDropdown({
  versions,
  displayedVersion,
  isAdmin,
  loading,
  onSelect,
  onDeleteRequest,
}: {
  versions: ArtifactVersion[];
  displayedVersion: number | null;
  isAdmin: boolean;
  loading: boolean;
  onSelect: (version: number) => void;
  onDeleteRequest: (version: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = versions.find((v) => v.version === displayedVersion);
  const onlyOne = versions.length === 1;

  function handleSelect(version: number) {
    setOpen(false);
    onSelect(version);
  }

  function handleDeleteClick(e: React.MouseEvent, version: number) {
    e.stopPropagation();
    setOpen(false);
    onDeleteRequest(version);
  }

  const triggerLabel = current
    ? `v${current.version} · ${formatVersionDate(current.created_at)}${current.is_active ? " ●" : ""}`
    : "versies";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={loading}
        style={{
          background: "var(--surface-2)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
          fontSize: "10px",
          fontFamily: "inherit",
          padding: "2px 6px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          gap: "3px",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.5 : 1,
          transition: "opacity 0.15s",
          maxWidth: "180px",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{triggerLabel}</span>
        <ChevronDown size={9} style={{ flexShrink: 0 }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 4px)",
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            minWidth: "220px",
            maxWidth: "300px",
            maxHeight: "280px",
            overflowY: "auto",
            zIndex: 50,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          {versions.map((v, i) => {
            const isDisplayed = v.version === displayedVersion;
            const canDelete = isAdmin && !v.is_active && !onlyOne;

            return (
              <div
                key={v.version}
                style={{
                  borderBottom: i < versions.length - 1 ? "1px solid var(--border)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: isDisplayed ? "var(--surface-3)" : "transparent",
                }}
              >
                <button
                  onClick={() => handleSelect(v.version)}
                  style={{
                    flex: 1,
                    textAlign: "left",
                    padding: "7px 10px",
                    fontSize: "11px",
                    color: isDisplayed ? "var(--foreground)" : "var(--muted-foreground)",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    lineHeight: 1.4,
                  }}
                  className="hover:text-white transition-colors"
                >
                  <span className="font-medium">v{v.version}</span>
                  <span> · {formatVersionDate(v.created_at)}</span>
                  {v.note && (
                    <span
                      style={{
                        display: "block",
                        fontSize: "10px",
                        color: "var(--muted-foreground)",
                        marginTop: "1px",
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {v.note}
                    </span>
                  )}
                  {v.is_active && (
                    <span
                      style={{
                        marginLeft: "4px",
                        color: "#10b981",
                        fontSize: "9px",
                      }}
                    >
                      ● actief
                    </span>
                  )}
                </button>

                {isAdmin && (
                  <button
                    onClick={(e) => handleDeleteClick(e, v.version)}
                    disabled={!canDelete}
                    title={
                      v.is_active
                        ? "Actieve versie kan niet verwijderd worden"
                        : onlyOne
                        ? "Enige versie kan niet verwijderd worden"
                        : "Versie verwijderen"
                    }
                    style={{
                      padding: "6px 8px",
                      color: canDelete ? "var(--muted-foreground)" : "var(--border-strong)",
                      cursor: canDelete ? "pointer" : "not-allowed",
                      background: "none",
                      border: "none",
                      flexShrink: 0,
                    }}
                    className={canDelete ? "hover:text-red-400 transition-colors" : ""}
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
