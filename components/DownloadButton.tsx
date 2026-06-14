"use client";

import { Download } from "lucide-react";
import { useArtlightConfig } from "../lib/config-context";

export function DownloadButton({ slug }: { slug: string }) {
  const { basePath } = useArtlightConfig();

  function handleDownload() {
    const a = document.createElement("a");
    a.href = `${basePath}/api/artifact/${slug}/download`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <button
      onClick={handleDownload}
      title="Download HTML"
      className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      <Download size={13} />
    </button>
  );
}
