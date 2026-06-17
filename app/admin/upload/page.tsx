"use client";

import { useRef, useState } from "react";
import { FileUp } from "lucide-react";
import { CategoryInput } from "../../../components/CategoryInput";
import { wrapTsx } from "../../../lib/utils";
import { useArtlightConfig } from "../../../lib/config-context";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPage() {
  const { basePath } = useArtlightConfig();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("");
  const [html, setHtml] = useState("");
  const [source, setSource] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ url: string; slug: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [published, setPublished] = useState(true);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Counter avoids false drag-leave when pointer moves over a child element.
  const dragCounter = useRef(0);

  function readFile(file: File) {
    const isTsx = file.name.match(/\.tsx?$/i);
    const isHtml = file.name.match(/\.html?$/i);
    if (!isTsx && !isHtml) return;
    setFileInfo({ name: file.name, size: file.size });
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") {
        if (isTsx) {
          setHtml(wrapTsx(text));
          setSource(text);
        } else {
          setHtml(text);
          setSource(null);
        }
      }
    };
    reader.readAsText(file, "utf-8");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current += 1;
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setResult(null);
    setErrorMsg("");

    try {
      const res = await fetch(`${basePath}/api/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description: description || undefined,
          category: category || undefined,
          tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          prompt: prompt || undefined,
          model: model || undefined,
          html,
          source: source ?? undefined,
          published,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Unknown error");
        setStatus("error");
        return;
      }

      setResult({ url: data.url, slug: data.slug });
      setStatus("done");
    } catch (err) {
      setErrorMsg(String(err));
      setStatus("error");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">

      {/* Page header */}
      <div className="mb-10">
        <a
          href={basePath || "/"}
          style={{ color: "var(--accent-color)" }}
          className="text-sm hover:opacity-80 transition-opacity"
        >
          ← artiflight
        </a>
        <h1
          style={{ color: "var(--foreground)" }}
          className="mt-4 text-2xl font-semibold"
        >
          Upload artifact
        </h1>
        <p style={{ color: "var(--muted-foreground)" }} className="mt-1 text-sm">
          Publish a new HTML artifact to your domain.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        <Field label="Title" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="Veldbos Field Manual"
            required
          />
        </Field>

        <Field label="Description">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
            placeholder="Short description shown in gallery"
          />
        </Field>

        <Field label="Category">
          <CategoryInput value={category} onChange={setCategory} />
        </Field>

        <Field label="Tags" hint="Comma-separated">
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="input"
            placeholder="koken, snacks, recepten"
          />
        </Field>

        <Field label="Prompt" hint="Optional — the prompt used to generate this artifact">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="input min-h-[80px] resize-y"
            placeholder="Create an interactive field manual for…"
          />
        </Field>

        <Field label="Model" hint="Optional — AI model used to build this artifact">
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="input font-mono"
            placeholder="e.g. claude-opus-4, gpt-4o, gemini-2.0-flash"
          />
        </Field>

        {/* HTML upload + textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label
              style={{ color: "var(--foreground)" }}
              className="text-sm font-medium"
            >
              HTML{" "}
              <span style={{ color: "var(--danger)" }}>*</span>
            </label>

            <div className="flex items-center gap-2">
              {fileInfo && (
                <span
                  style={{
                    background: "var(--surface-3)",
                    color: "var(--muted-foreground)",
                  }}
                  className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs"
                >
                  <span className="font-medium truncate max-w-[140px]">{fileInfo.name}</span>
                  <span className="opacity-50">·</span>
                  <span>{formatBytes(fileInfo.size)}</span>
                </span>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm,.tsx,.ts"
                className="hidden"
                onChange={handleFileChange}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "1px solid var(--border-strong)",
                  background: "var(--surface-2)",
                  color: "var(--muted-foreground)",
                }}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium hover:text-white hover:border-[#6366f1]/50 transition-colors"
              >
                <FileUp size={12} />
                Upload .html / .tsx
              </button>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={
              isDragging
                ? {
                    boxShadow: "0 0 0 2px var(--accent-color), 0 0 16px var(--accent-glow)",
                    background: "var(--accent-glow)",
                  }
                : {}
            }
            className="relative rounded-lg transition-all"
          >
            {isDragging && (
              <div
                style={{ background: "var(--accent-glow)", color: "var(--accent-color)" }}
                className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg"
              >
                <p className="text-sm font-medium">Drop .html or .tsx here</p>
              </div>
            )}
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="input min-h-[240px] resize-y font-mono text-xs"
              placeholder="Paste HTML here, or drag & drop / upload a file above…"
              required
            />
          </div>
        </div>

        {/* Published toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => setPublished((p) => !p)}
            style={{
              background: published ? "var(--accent-color)" : "var(--surface-3)",
              boxShadow: published ? "0 0 8px var(--accent-glow)" : "none",
            }}
            className="relative h-5 w-9 rounded-full transition-all"
          >
            <span
              className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
              style={{ transform: published ? "translateX(1rem)" : "translateX(0.125rem)" }}
            />
          </div>
          <span style={{ color: "var(--foreground)" }} className="text-sm">
            {published ? "Published" : "Hidden (not visible in gallery)"}
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={status === "loading"}
          style={{
            background: status === "loading" ? "var(--surface-3)" : "var(--accent-color)",
            boxShadow: status === "loading" ? "none" : "0 0 16px var(--accent-glow)",
            color: "white",
          }}
          className="w-full py-2.5 rounded-lg font-medium text-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading" ? "Publishing…" : "Publish artifact"}
        </button>
      </form>

      {/* Success state */}
      {status === "done" && result && (
        <div
          style={{
            border: "1px solid rgba(16,185,129,0.3)",
            background: "rgba(16,185,129,0.08)",
          }}
          className="mt-6 rounded-xl p-4 text-sm"
        >
          <p style={{ color: "#10b981" }} className="font-medium">
            Published successfully!
          </p>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#34d399" }}
            className="mt-1 block break-all hover:underline"
          >
            {result.url}
          </a>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div
          style={{
            border: "1px solid rgba(239,68,68,0.3)",
            background: "rgba(239,68,68,0.08)",
          }}
          className="mt-6 rounded-xl p-4 text-sm"
        >
          <p style={{ color: "var(--danger)" }} className="font-medium">
            Error
          </p>
          <p style={{ color: "#f87171" }} className="mt-1">
            {errorMsg}
          </p>
        </div>
      )}
    </div>
  );
}

function Field({
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
    <div className="space-y-1.5">
      <label style={{ color: "var(--foreground)" }} className="text-sm font-medium">
        {label}
        {required && (
          <span style={{ color: "var(--danger)" }} className="ml-0.5">
            *
          </span>
        )}
        {hint && (
          <span style={{ color: "var(--muted-foreground)" }} className="ml-2 font-normal">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
