"use client";

import { useEffect, useState } from "react";
import { Check, Link } from "lucide-react";

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  // Cancel the reset timer if the component unmounts while the timer is running.
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      // Fallback for browsers that block clipboard without user gesture.
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
    }
  }

  return (
    <button
      onClick={handleCopy}
      title={copied ? "Gekopieerd!" : "Kopieer link"}
      className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {copied ? <Check size={13} className="text-green-500" /> : <Link size={13} />}
    </button>
  );
}
