# Artiflight — Integration Guide

This document explains how to embed artiflight's gallery, viewer, admin UI,
and API logic into another Next.js project (the "consumer") under a custom
base path (e.g. `/artifacts`), while keeping the standalone deployment on
`artiflight.vercel.app` working unchanged.

---

## 1. Install the package

In the consumer project, add artiflight as a local dependency:

```json
// consumer/package.json
{
  "dependencies": {
    "artiflight": "file:../artiflight"
  }
}
```

Then tell Next.js to compile it (TypeScript source is shipped directly):

```ts
// consumer/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["artiflight"],
};

export default nextConfig;
```

---

## 2. Import the theme

In the consumer's root layout or global CSS, import the Space Indigo CSS
variables so artiflight's components render correctly:

```ts
// consumer/app/layout.tsx (or globals.css)
import "artiflight/styles";
```

---

## 3. Wrap your routes with ArtlightProvider

All artiflight components read `basePath` from React context. Wrap the
subtree that mounts the artiflight routes with `ArtlightProvider`:

```tsx
// consumer/app/artifacts/layout.tsx
import { ArtlightProvider } from "artiflight/lib/config-context";

export default function ArtifactsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ArtlightProvider config={{ basePath: "/artifacts" }}>
      {children}
    </ArtlightProvider>
  );
}
```

`basePath` must match the path prefix under which the consumer mounts all
artiflight routes *and* API handlers (see section 5).

---

## 4. Mount the UI pages

Create thin page files in the consumer's `app/` tree that re-export
artiflight's default page exports:

```
consumer/app/artifacts/page.tsx               ← gallery
consumer/app/artifacts/p/[slug]/page.tsx      ← viewer
consumer/app/artifacts/admin/page.tsx         ← admin dashboard
consumer/app/artifacts/admin/upload/page.tsx  ← upload form
```

Gallery page (replace the fetch URL with your basePath):

```tsx
// consumer/app/artifacts/page.tsx
// (copy from artiflight/app/page.tsx and update the fetch to /artifacts/api/artifacts)
```

Viewer page:

```tsx
// consumer/app/artifacts/p/[slug]/page.tsx
// (copy from artiflight/app/p/[slug]/page.tsx and update fetch/import paths)
```

Admin pages can be re-exported directly:

```tsx
// consumer/app/artifacts/admin/page.tsx
export { default } from "artiflight/admin";

// consumer/app/artifacts/admin/upload/page.tsx
export { default } from "artiflight/admin/upload";
```

---

## 5. Mount the API routes

Artiflight's API handlers are standard Next.js Route Handlers. Mirror them
under the consumer's `app/artifacts/api/` tree:

```
consumer/app/artifacts/api/artifacts/route.ts
consumer/app/artifacts/api/categories/route.ts
consumer/app/artifacts/api/publish/route.ts
consumer/app/artifacts/api/artifact/[slug]/route.ts
consumer/app/artifacts/api/artifact/[slug]/download/route.ts
consumer/app/artifacts/api/artifact/[slug]/versions/route.ts
consumer/app/artifacts/api/artifact/[slug]/versions/[version]/route.ts
consumer/app/artifacts/api/admin/login/route.ts
consumer/app/artifacts/api/admin/logout/route.ts
consumer/app/artifacts/api/admin/artifacts/route.ts
```

Each file is a one-liner re-export:

```ts
// example: consumer/app/artifacts/api/artifacts/route.ts
export { GET } from "artiflight/lib/supabase";  // ← not quite; see note below
```

> **Note:** The API routes in artiflight (`app/api/**/route.ts`) are not
> exported via the `exports` map because they contain logic that is tightly
> coupled to Next.js routing. Copy the route files from
> `artiflight/app/api/` into the consumer and adjust import paths (replacing
> `@/lib/` with `artiflight/lib/`). The underlying lib functions
> (`createServerClient`, `isAdminAuthed`) *are* exported and can be imported
> directly.

---

## 6. Using individual exported components

All reusable UI components are available as named exports:

```ts
import { ArtifactCard }      from "artiflight/components/ArtifactCard";
import { ArtifactView }      from "artiflight/components/ArtifactView";
import { CategoryInput }     from "artiflight/components/CategoryInput";
import { CopyLinkButton }    from "artiflight/components/CopyLinkButton";
import { DownloadButton }    from "artiflight/components/DownloadButton";
import { DeleteButton }      from "artiflight/components/DeleteButton";
import { EditArtifactPanel } from "artiflight/components/EditArtifactPanel";
import { Button }            from "artiflight/components/ui/button";
```

These all require an `ArtlightProvider` ancestor (see section 3) to resolve
paths correctly at runtime.

---

## 7. Using lib utilities

```ts
// Browser-side Supabase client
import { createClient } from "artiflight/lib/supabase";

// Server-side Supabase client (service role, bypasses RLS)
import { createServerClient } from "artiflight/lib/supabase-server";

// Server-side admin auth check (reads admin_token cookie)
import { isAdminAuthed } from "artiflight/lib/admin-auth";

// TSX → self-contained HTML wrapper (used in upload flows)
import { wrapTsx } from "artiflight/lib/utils";

// Config primitives
import { defaultConfig }       from "artiflight/lib/config";
import { ArtlightProvider,
         useArtlightConfig }   from "artiflight/lib/config-context";
```

---

## 8. Shared TypeScript types

```ts
import type {
  ArtifactCardData,
  ArtifactVersion,
  ArtifactData,
  ArtifactViewProps,
  ArtifactMeta,
} from "artiflight/types";
```

---

## 9. Required environment variables

Set these in the consumer's `.env.local` (same values as the standalone app):

| Variable | Where used | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Service role key (bypasses RLS) |
| `ADMIN_SECRET` | server | Password for admin login + cookie token |
| `NEXT_PUBLIC_SITE_URL` | optional | Used to build artifact share URLs |

---

## 10. Required Supabase tables

The consumer shares the same Supabase project as the standalone app (or
creates its own with the same schema). Required objects:

| Object | Type | Notes |
|---|---|---|
| `artifacts` | table | id, slug, title, description, category, tags, model, prompt, published, views, created_at |
| `artifact_versions` | table | id, artifact_id, version, html, note, is_active, created_at |
| `publish_new_version` | RPC | Creates/increments a version and optionally creates the parent artifact |

Row Level Security: the consumer can keep the default policies from the
standalone deployment. The service role key bypasses RLS for admin writes.

---

## 11. Full exports map

| Export path | Source file | What it contains |
|---|---|---|
| `artiflight/components/ArtifactCard` | `components/ArtifactCard.tsx` | Gallery card component + `ArtifactCardData` type |
| `artiflight/components/ArtifactView` | `components/ArtifactView.tsx` | Full-page viewer + version dropdown |
| `artiflight/components/CategoryInput` | `components/CategoryInput.tsx` | Autocomplete category selector |
| `artiflight/components/CopyLinkButton` | `components/CopyLinkButton.tsx` | Copy-URL icon button |
| `artiflight/components/DownloadButton` | `components/DownloadButton.tsx` | Download-HTML icon button |
| `artiflight/components/DeleteButton` | `components/DeleteButton.tsx` | Delete artifact with confirm dialog |
| `artiflight/components/EditArtifactPanel` | `components/EditArtifactPanel.tsx` | Edit metadata dialog |
| `artiflight/components/ui/button` | `components/ui/button.tsx` | Base button with variants |
| `artiflight/components/ui/dialog` | `components/ui/dialog.tsx` | Dialog primitives |
| `artiflight/admin` | `app/admin/page.tsx` | Admin dashboard page (default export) |
| `artiflight/admin/upload` | `app/admin/upload/page.tsx` | Upload artifact page (default export) |
| `artiflight/lib/supabase` | `lib/supabase.ts` | Browser Supabase client |
| `artiflight/lib/supabase-server` | `lib/supabase-server.ts` | Server Supabase client |
| `artiflight/lib/admin-auth` | `lib/admin-auth.ts` | `isAdminAuthed()` server helper |
| `artiflight/lib/utils` | `lib/utils.ts` | `cn()` + `wrapTsx()` |
| `artiflight/lib/config` | `lib/config.ts` | `ArtlightConfig` interface + `defaultConfig` |
| `artiflight/lib/config-context` | `lib/config-context.tsx` | `ArtlightProvider` + `useArtlightConfig` |
| `artiflight/styles` | `app/globals.css` | Space Indigo CSS variables + utility classes |
| `artiflight/types` | `types.ts` | All shared TypeScript types |
