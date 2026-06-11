"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteButton({ slug, title }: { slug: string; title: string }) {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setSecret("");
    setError("");
    setLoading(false);
  }

  async function handleDelete() {
    if (!secret) return;
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

  return (
    <Dialog onOpenChange={(open) => !open && reset()}>
      <DialogTrigger
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        title="Verwijder artifact"
      >
        <Trash2 size={13} />
      </DialogTrigger>

      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Artifact verwijderen?</DialogTitle>
          <DialogDescription>
            Je staat op het punt <strong className="text-foreground">{title}</strong> te
            verwijderen. Dit kan niet ongedaan worden gemaakt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Admin secret</label>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleDelete()}
            placeholder="Voer je ADMIN_SECRET in"
            autoFocus
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />} onClick={reset}>
            Annuleer
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || !secret}
          >
            {loading ? "Verwijderen…" : "Verwijder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
