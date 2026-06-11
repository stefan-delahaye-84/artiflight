"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";

export function DeleteButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/artifact/${slug}`, {
      method: "DELETE",
      headers: { "x-admin-secret": secret },
    });

    if (res.ok) {
      router.push("/");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Delete failed");
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        title="Delete artifact"
      >
        <Trash2 size={13} />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="password"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleDelete()}
        placeholder="Admin secret"
        autoFocus
        className="h-6 rounded border border-input bg-background px-2 text-xs w-32 focus:outline-none focus:ring-1 focus:ring-destructive"
      />
      <button
        onClick={handleDelete}
        disabled={loading || !secret}
        className="h-6 rounded bg-destructive px-2 text-xs font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? "…" : "Delete"}
      </button>
      <button
        onClick={() => { setOpen(false); setError(""); setSecret(""); }}
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
      >
        <X size={12} />
      </button>
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </div>
  );
}
