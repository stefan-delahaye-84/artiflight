"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const CATEGORIES = ["hiking", "food", "running", "music", "imaging", "tech"];

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [prompt, setPrompt] = useState("");
  const [html, setHtml] = useState("");
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ url: string; slug: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setResult(null);
    setErrorMsg("");

    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({
          title,
          description: description || undefined,
          category: category || undefined,
          tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          prompt: prompt || undefined,
          html,
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8">
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← artiflight
          </a>
          <h1 className="mt-4 text-2xl font-semibold">Upload artifact</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Publish a new HTML artifact to your domain.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Admin secret" required>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="input"
              placeholder="Your ADMIN_SECRET"
              required
            />
          </Field>

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
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
            >
              <option value="">— none —</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
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

          <Field label="Prompt" hint="Optional — the Claude prompt used to generate this artifact">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="input min-h-[80px] resize-y"
              placeholder="Create an interactive field manual for…"
            />
          </Field>

          <Field label="HTML" required>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="input min-h-[240px] resize-y font-mono text-xs"
              placeholder="Paste the full HTML here…"
              required
            />
          </Field>

          <Button type="submit" disabled={status === "loading"} className="w-full">
            {status === "loading" ? "Publishing…" : "Publish artifact"}
          </Button>
        </form>

        {status === "done" && result && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
            <p className="font-medium text-green-800">Published successfully!</p>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block break-all text-green-700 underline"
            >
              {result.url}
            </a>
          </div>
        )}

        {status === "error" && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
            <p className="font-medium text-red-800">Error</p>
            <p className="mt-1 text-red-700">{errorMsg}</p>
          </div>
        )}
      </div>
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
      <label className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
        {hint && <span className="ml-2 font-normal text-muted-foreground">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
