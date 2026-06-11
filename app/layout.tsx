import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Artiflight — Publish AI Artifacts",
  description:
    "Share AI-built interactive apps via your own domain. From any LLM to public in seconds.",
  keywords: ["artifacts", "claude", "ai", "publish", "share"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0a0a0f" />
      </head>
      <body className="min-h-screen grid-bg">
        {/* Sticky global nav */}
        <nav
          style={{
            borderBottom: "1px solid var(--border)",
            backgroundColor: "rgba(10,10,15,0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
          className="sticky top-0 z-50 h-14"
        >
          <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 group">
              <div
                style={{
                  background: "var(--accent-color)",
                  boxShadow: "0 0 16px var(--accent-glow)",
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              >
                ✦
              </div>
              <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                Artiflight
              </span>
              <span
                style={{
                  border: "1px solid rgba(99,102,241,0.3)",
                  color: "var(--accent-color)",
                }}
                className="text-[10px] px-1.5 py-0.5 rounded-full font-mono"
              >
                v1.0
              </span>
            </a>

            {/* Nav links */}
            <div className="flex items-center gap-3">
              <a
                href="/admin"
                style={{ color: "var(--muted-foreground)" }}
                className="text-sm hover:text-white transition-colors"
              >
                Admin
              </a>
              <a
                href="/admin/upload"
                style={{
                  background: "var(--accent-color)",
                  boxShadow: "0 0 12px var(--accent-glow)",
                }}
                className="text-sm px-3 py-1.5 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
              >
                + Upload
              </a>
            </div>
          </div>
        </nav>

        <main>{children}</main>
      </body>
    </html>
  );
}
