# Changelog

All notable changes to artiflight are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
