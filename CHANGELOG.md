# Changelog

All notable changes to artiflight are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.3.3] — 2026-06-21

### Fixed
- `ArtifactView`: use `100dvh` instead of `100vh` so the container height matches the actual visible viewport on mobile (fixes iOS Safari rubber-band scroll revealing the footer when swiping or zooming)
- `ArtifactView`: extend scroll lock to `<html>` element and add `overscroll-behavior: none` on both `html` and `body` — prevents iOS Safari bounce scroll from revealing content outside the viewer

---

## [1.3.2] — 2026-06-21

### Fixed
- `ArtifactView`: lock `document.body.overflow` to `hidden` on mount (restored on unmount) — prevents the host page from scrolling past the artifact viewer and revealing the footer below it

---

## [1.3.1] — 2026-06-17

### Added
- `lib/utils.ts` (`wrapTsx`): improved JSX runtime shim — fixes module resolution for the React JSX transform inside Babel Standalone's blob-URL module context

### Changed
- `POST /api/publish` and the version re-upload path now store the original `.tsx` source alongside the wrapped HTML in a `source` column
- `GET /api/artifact/[slug]/download` returns the original `.tsx` file when the artifact was uploaded as TSX (`Content-Type: text/plain`, filename `<slug>.tsx`); HTML artifacts still download as `.html`
- `GET /api/artifact/[slug]` response includes `source_type` (`tsx` | `html`)

### Fixed
- Version rollback (`PATCH /api/artifact/[slug]`) now correctly restores both HTML and source from `artifact_versions` instead of reading stale values from the artifact row

---

## [1.3.0] — 2026-06-14

### Added

**Package embeddability**
- `package.json` exports map — consumers can import subpaths: `artiflight/components`, `artiflight/lib`, `artiflight/admin`, `artiflight/styles`, `artiflight/types`
- Shared `types.ts` with exported `Artifact` and `ArtifactVersion` interfaces
- `lib/config.ts` + `components/config-context.tsx` — `ArtlightConfig` interface, `ArtlightProvider` context component, and `useArtlightConfig()` hook
- `basePath` config prop: all API fetches and navigation hrefs are prefixed with `basePath`, allowing artiflight to be mounted at any sub-path inside a host app (default `""` keeps standalone behavior unchanged)
- `brandName` config prop: overrides the `← artiflight` back-link label in `ArtifactView` for host apps (e.g. `rawdepth`)
- All `@/` aliases inside exported files replaced with relative paths so they resolve correctly when consumed via `transpilePackages`
- `INTEGRATION.md` — full integration guide covering: local install, `transpilePackages` config, theme import, `ArtlightProvider` setup, page and API route mounting, individual component/lib imports, environment variables, Supabase schema, and the complete exports map

---

## [1.2.0] — 2026-06-14

### Added

**TSX artifact support**
- Upload `.tsx` files alongside `.html`; wrapped at upload time by `lib/utils.ts → wrapTsx()` into a self-contained HTML page
- Wrapper injects Babel Standalone + Tailwind CDN; bare module specifiers (`react`, `lucide-react`, etc.) rewritten to absolute `esm.sh` URLs so they resolve from Babel's blob URL module context
- `window.storage` (Claude artifact API) shimmed to `localStorage` automatically
- Supported out of the box: React hooks, lucide-react icons, Tailwind CSS
- File inputs and drag-and-drop zones in upload page and version re-upload dialog now accept `.tsx` / `.ts`

**httpOnly cookie authentication**
- `POST /api/admin/login` — verifies password against `ADMIN_SECRET`, sets `admin_token` (httpOnly, secure, SameSite=Strict, 7-day TTL) and `admin_session` (JS-readable flag, same TTL)
- `POST /api/admin/logout` — clears both cookies
- All admin-protected API routes now use `lib/admin-auth.ts → isAdminAuthed()` instead of `x-admin-secret` header
- Admin secret is no longer readable by any JavaScript, including artifacts running in the iframe
- Admin page auto-logs in on mount if `admin_session=1` cookie is present
- Sign out button added to admin page header

**Delete button in admin list**
- Trash icon on each artifact row; confirm dialog uses the existing cookie session — no secret re-entry needed
- Removes row from list on success without a page reload

**Version seeding on initial publish**
- `POST /api/publish` now seeds v1 in `artifact_versions` via `publish_new_version` RPC
- Version picker appears immediately after first upload without requiring a re-upload

### Changed
- Admin login UI calls `POST /api/admin/login` instead of writing to `sessionStorage`
- `ArtifactView` detects admin via `document.cookie` (`admin_session=1`) instead of `sessionStorage`
- `DeleteButton`, admin upload page, and `UploadVersionDialog` no longer show an admin secret input field
- Removed all `x-admin-secret` header sending from client code

---

## [1.1.0] — 2026-06-12

### Added

**Download**
- `GET /api/artifact/[slug]/download` — returns the artifact HTML as a `Content-Disposition: attachment` file download
- `DownloadButton` component — download icon in the artifact page header
- Download icon on gallery cards (appears on hover, alongside "View →")

**Model field**
- `model` column on the `artifacts` table (nullable text; see migration note below)
- Upload form now accepts a "Model" field (e.g. `claude-opus-4`, `gpt-4o`)
- Artifact page header shows a `✦ model-name` chip next to the category badge (hidden below `sm` breakpoint)
- Gallery cards show the model as a small monospace badge below the title when set

**Edit panel**
- Pencil icon in the artifact page header opens a dialog to edit title, description, category, tags, model, and prompt without touching the HTML
- Requires admin secret; shows a "Saved!" confirmation then refreshes the page

### Changed
- `PATCH /api/artifact/[slug]` now handles three distinct paths: publish toggle, metadata update (title / description / category / tags / model / prompt), and HTML versioned update
- `GET /api/artifact/[slug]` response now includes `model`
- `ArtifactCard` extracted to `components/ArtifactCard.tsx` as a client component to support interactive download and card navigation

### Database migration
Run in the Supabase SQL Editor for existing databases:
```sql
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS model text;
```

---

## [1.0.0] — 2026-06-11

First production-ready release. Includes the Space Indigo design system.

### Added

**Core**
- `POST /api/publish` — publish a new HTML artifact, generates a slug, returns public URL
- `GET /api/artifacts` — list published artifacts, filterable by `category` and `tag`
- `GET /api/artifact/[slug]` — fetch metadata for a single artifact
- `PATCH /api/artifact/[slug]` — update HTML (with versioning) or toggle `published` status
- `DELETE /api/artifact/[slug]` — delete artifact and all versions (cascade)
- `GET /api/categories` — deduplicated list of categories in use
- `GET /api/admin/artifacts` — admin-only endpoint, returns all artifacts including unpublished

**Design system — Space Indigo**
- CSS custom properties: `--background: #0a0a0f`, surface layers (`--surface-1/2/3`), `--accent-color: #6366f1`, `--neon: #22d3ee`
- Custom utilities: `.gradient-text` (indigo→cyan), `.glow-accent`, `.glow-neon`, `.grid-bg` (32px dot grid)
- Glassmorphism sticky nav with `backdrop-blur(12px)`, ✦ indigo logo, v1.0 badge
- Dark-always via `:root` — no `.dark` class wrapper needed
- shadcn/ui vars kept compatible (`--muted`, `--card`, etc.)

**Gallery (`/`)**
- Hero section with gradient headline, animated pulse badge, ambient glow
- Stats bar (artifact count · MIT · Vercel)
- Artifact cards with indigo category badge, tag pills, `View →` on hover
- Empty state with ✦ icon

**Artifact viewer (`/p/[slug]`)**
- 48px Space Indigo header: indigo `← artiflight` link, indigo category badge, muted meta (views · date), copy-link, delete
- `height: calc(100vh - 3.5rem)` container accounts for the 56px sticky nav
- Artifact rendered in sandboxed iframe (`allow-scripts allow-forms allow-modals allow-popups`; `allow-same-origin` intentionally omitted)
- Atomic view counter via Supabase `increment_views` SQL function
- Unpublished artifacts return 404
- `force-dynamic` rendering — no stale cache on Vercel

**Delete (Feature 1)**
- Trash icon in artifact header opens a confirmation dialog
- Dialog shows artifact name, admin secret input, error on wrong secret
- Redirect to gallery after successful delete

**File upload (Feature 2)**
- `/admin/upload` accepts `.html` / `.htm` files via button or drag & drop
- `dragCounter` ref prevents flickering when pointer crosses child elements
- File name and formatted size displayed as badge after selection

**Upload form (`/admin/upload`)**
- Fields: admin secret, title, description, category (autocomplete), tags, prompt, HTML, published toggle
- Published toggle (pill switch with indigo glow) — default on
- Drag & drop zone with indigo ring + glow on active drag
- File upload button in Space Indigo surface style
- Success / error banners in green/red with matching transparency

**Admin overview (`/admin`)**
- Login screen with ✦ icon, indigo submit button with glow
- Secret persisted in `sessionStorage` for the browser session
- Artifact table in Space Indigo (surface-1 card, surface-2 header row)
- Published badge (green) / Hidden badge (gray); action buttons with surface-2 border style

**Category autocomplete (Feature 5)**
- Free-text input replaces fixed dropdown
- Fetches existing categories from `/api/categories` on mount
- Filters by substring match while typing
- Keyboard navigation: ↑↓ Enter Escape
- "nieuw" badge appears when typed value is not yet in use

**Copy link (Feature 6)**
- Link icon in artifact header copies `window.location.href` to clipboard
- Graceful fallback using `document.execCommand` for non-HTTPS contexts
- Checkmark icon for 2 s, then resets; `useEffect` cleanup cancels timer on unmount

**Publish / unpublish (Feature 7)**
- Published toggle on upload form
- Admin overview at `/admin`: secret prompt, session-persisted auth, two-section table (published / hidden)
- Per-row status badge, toggle button (Eye / EyeOff), external link for published artifacts

### Technical

- Next.js 16.2.7 with React 19, TypeScript, Tailwind CSS v4
- shadcn/ui base-nova style using `@base-ui/react` primitives
- Two Supabase clients: browser (`anon` key) and server (`service_role` key, bypasses RLS)
- Slug generation: title → lowercase → strip non-alphanumeric → truncate 64 chars; suffix added on collision
- All API routes return structured JSON errors with appropriate HTTP status codes
- `force-dynamic` on gallery and artifact pages to prevent Vercel edge caching

---

## [0.1.0] — 2026-06-08

Initial scaffold.

### Added
- Next.js 16 project with TypeScript and Tailwind CSS v4
- shadcn/ui initialised (base-nova)
- Supabase client setup (browser + server)
- `.env.local` template
