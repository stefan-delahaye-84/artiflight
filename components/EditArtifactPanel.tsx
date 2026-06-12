"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ArtifactMeta = {
  title: string;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  model: string | null;
  prompt: string | null;
};

export function EditArtifactPanel({
  slug,
  artifact,
}: {
  slug: string;
  artifact: ArtifactMeta;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [secret, setSecret] = useState("");
  const [title, setTitle] = useState(artifact.title);
  const [description, setDescription] = useState(artifact.description ?? "");
  const [category, setCategory] = useState(artifact.category ?? "");
  const [tags, setTags] = useState((artifact.tags ?? []).join(", "));
  const [model, setModel] = useState(artifact.model ?? "");
  const [prompt, setPrompt] = useState(artifact.prompt ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setStatus("idle");
      setErrorMsg("");
    }
  }

  async function handleSave() {
    if (!secret) return;
    setStatus("saving");
    setErrorMsg("");

    const res = await fetch(`/api/artifact/${slug}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": secret,
      },
      body: JSON.stringify({
        title: title.trim() || artifact.title,
        description: description.trim() || null,
        category: category.trim() || null,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        model: model.trim() || null,
        prompt: prompt.trim() || null,
      }),
    });

    if (res.ok) {
      setStatus("saved");
      setTimeout(() => {
        setOpen(false);
        router.refresh();
      }, 800);
    } else {
      const data = await res.json().catch(() => ({}));
      setErrorMsg(data.error ?? "Save failed");
      setStatus("error");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Edit artifact info"
      >
        <Pencil size={13} />
      </DialogTrigger>

      <DialogContent showCloseButton={false} className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Edit artifact info</DialogTitle>
            <button
              onClick={() => setOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <EditField label="Title" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Artifact title"
            />
          </EditField>

          <EditField label="Description">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Short gallery description"
            />
          </EditField>

          <div className="grid grid-cols-2 gap-3">
            <EditField label="Category">
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="e.g. tools"
              />
            </EditField>

            <EditField label="Model" hint="AI model used">
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                placeholder="e.g. claude-opus-4"
              />
            </EditField>
          </div>

          <EditField label="Tags" hint="Comma-separated">
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="interactive, data-viz, tools"
            />
          </EditField>

          <EditField label="Prompt" hint="Optional">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-y"
              placeholder="The prompt used to generate this artifact…"
            />
          </EditField>

          <div
            style={{ borderTop: "1px solid var(--border)" }}
            className="pt-3 space-y-3"
          >
            <EditField label="Admin secret" required>
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Your ADMIN_SECRET"
                autoFocus
              />
            </EditField>

            {errorMsg && (
              <p className="text-xs" style={{ color: "var(--danger)" }}>
                {errorMsg}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={!secret || status === "saving" || status === "saved"}
              style={{
                background:
                  status === "saved"
                    ? "var(--success)"
                    : status === "saving"
                    ? "var(--surface-3)"
                    : "var(--accent-color)",
                boxShadow:
                  status === "saving" || status === "saved"
                    ? "none"
                    : "0 0 12px var(--accent-glow)",
              }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "saving" && <Loader2 size={14} className="animate-spin" />}
              {status === "saved" && <Check size={14} />}
              {status === "saving"
                ? "Saving…"
                : status === "saved"
                ? "Saved!"
                : "Save changes"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditField({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
        {label}
        {required && (
          <span style={{ color: "var(--danger)" }} className="ml-0.5">
            *
          </span>
        )}
        {hint && (
          <span style={{ color: "var(--muted-foreground)" }} className="ml-1.5 font-normal">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
