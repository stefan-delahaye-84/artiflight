# artiflight

> Publish AI-built HTML artifacts on your own domain.

**Live demo → [artiflight.vercel.app](https://artiflight.vercel.app/)**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fstefan-delahaye-84%2Fartiflight&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,ADMIN_SECRET&envDescription=Supabase%20project%20keys%20and%20a%20secret%20for%20admin%20access&project-name=artiflight&repository-name=artiflight)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Claude.ai can publish artifacts, but only to `claude.ai` URLs. Artiflight gives you the same workflow on your own domain — open source, self-hostable, developer-first.

---

## Screenshots

| Gallery | Artifact viewer | Admin upload |
|---|---|---|
| *(coming soon)* | *(coming soon)* | *(coming soon)* |

---

## Features

- **Space Indigo design** — dark theme with indigo accent, neon glow, glassmorphism nav, dot-grid background
- **Gallery** — hero section + artifact grid; cards show category, model, tags, views, date
- **Viewer** — artifact rendered in a sandboxed iframe, no escape from the frame
- **Download** — export any artifact as a `.html` file from the viewer or the gallery card
- **Upload** — web UI with drag & drop, or API with `x-admin-secret`; includes prompt and model fields
- **Edit info** — update title, description, category, tags, model, or prompt on any published artifact without touching the HTML
- **Delete** — confirmation dialog with admin secret, redirect after delete
- **Share** — copy link button with clipboard fallback
- **Model tracking** — record which AI model built each artifact; shown as a chip in the viewer and on gallery cards
- **Categories** — free-text input with autocomplete from existing categories
- **Publish toggle** — publish or hide artifacts; admin overview with status badges
- **Versioning** — every HTML update saves a version (schema ready)
- **View counter** — atomic SQL increment, no race conditions

---

## Tech stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Database | Supabase (PostgreSQL) |
| Styling | Tailwind CSS v4 + shadcn/ui (base-nova) · Space Indigo theme |
| Deploy | Vercel |
| Language | TypeScript |

---

## Getting started

### 1 — Clone and install

```bash
git clone https://github.com/stefan-delahaye-84/artiflight.git
cd artiflight
npm install
```

### 2 — Supabase setup

Create a project at [supabase.com](https://supabase.com) and run the following SQL in the **SQL Editor**:

```sql
-- Artifacts table
create table artifacts (
  id          uuid default gen_random_uuid() primary key,
  slug        text unique not null,
  title       text not null,
  description text,
  html        text not null,
  prompt      text,
  model       text,
  tags        text[],
  category    text,
  views       integer default 0,
  published   boolean default true,
  password    text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Version history
create table artifact_versions (
  id           uuid default gen_random_uuid() primary key,
  artifact_id  uuid references artifacts(id) on delete cascade,
  html         text not null,
  version      integer not null,
  note         text,
  created_at   timestamptz default now()
);

-- Row Level Security
alter table artifacts enable row level security;
alter table artifact_versions enable row level security;

-- Public can read published artifacts
create policy "Public read"
  on artifacts for select
  using (published = true);

-- Atomic view counter (no race conditions)
create or replace function increment_views(artifact_id uuid)
returns void language sql security definer as $$
  update artifacts set views = views + 1 where id = artifact_id;
$$;
```

### 3 — Environment variables

Copy the template and fill in your values:

```bash
cp env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_SECRET=choose-a-strong-secret
```

> **Never commit `.env.local`.** It is already in `.gitignore`.

### 4 — Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API reference

All write endpoints require the `x-admin-secret` header.

### `POST /api/publish`

Publish a new artifact.

**Headers**

| Header | Required | Description |
|---|---|---|
| `x-admin-secret` | yes | Must match `ADMIN_SECRET` env var |
| `Content-Type` | yes | `application/json` |

**Body**

```jsonc
{
  "title": "Veldbos Field Manual",       // required
  "html": "<!DOCTYPE html>…",            // required
  "description": "Interactive guide",    // optional
  "category": "hiking",                  // optional, free text
  "tags": ["koken", "survival"],         // optional
  "prompt": "Create an interactive…",    // optional — the prompt used
  "model": "claude-opus-4",             // optional — AI model used to build it
  "published": true                      // optional, default true
}
```

**Response `200`**

```json
{
  "id": "uuid",
  "slug": "veldbos-field-manual",
  "url": "https://yourdomain.com/p/veldbos-field-manual"
}
```

---

### `GET /api/artifacts`

List all published artifacts.

**Query params**

| Param | Description |
|---|---|
| `category` | Filter by category (e.g. `?category=hiking`) |
| `tag` | Filter by tag (e.g. `?tag=koken`) |

**Response** — array of artifact metadata (no HTML).

---

### `GET /api/artifact/[slug]`

Get metadata for a single published artifact.

---

### `GET /api/artifact/[slug]/download`

Returns the artifact HTML as a file download (`Content-Disposition: attachment`).

---

### `PATCH /api/artifact/[slug]`

Three modes depending on the request body.

**Update HTML** (creates a new version in `artifact_versions`):

```json
{ "html": "<!DOCTYPE html>…", "note": "Fixed nav bug" }
```

**Update metadata** (title, description, category, tags, model, prompt — no version created):

```jsonc
{
  "title": "New title",
  "description": "Updated description",
  "category": "tools",
  "tags": ["interactive", "data-viz"],
  "model": "claude-opus-4",
  "prompt": "Build a…"
}
```

**Toggle published status** (no version created):

```json
{ "published": false }
```

---

### `DELETE /api/artifact/[slug]`

Delete an artifact and all its versions (cascade).

---

### `GET /api/categories`

Returns a sorted, deduplicated list of all categories in use.

**Response** — `string[]`

---

### `GET /api/admin/artifacts`

Returns **all** artifacts, including unpublished ones.  
Requires `x-admin-secret` header.

---

## Admin

| URL | Purpose |
|---|---|
| `/admin` | Overview of all artifacts with status + publish toggle |
| `/admin/upload` | Upload form with drag & drop and file picker |

The admin secret is stored in `sessionStorage` for the duration of the browser session.

---

## Deployment

The fastest path is the **Deploy to Vercel** button at the top of this README. It clones the repo, prompts for environment variables, and deploys in one click.

Manual deploy:

```bash
vercel --prod
```

Set the same four environment variables in **Vercel → Project → Settings → Environment Variables**.

---

## License

MIT — see [LICENSE](LICENSE).
