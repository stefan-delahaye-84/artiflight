# artiflight

Open source artifact publishing tool — share AI-built interactive apps via your own domain.

## What is Artiflight?

Artifact publishing platform that lets you publish HTML artifacts (interactive tools built with Claude) to your own domain instead of being locked into claude.ai URLs.

Similar to ShareDuo, but open source, self-hostable, and developer-first.

## Features (Phase 1)

- Upload HTML artifact via web UI or API
- Receive public URL on your domain
- Artifact rendered in sandboxed iframe
- Metadata: title, description, tags, category
- View counter

## Features (Phase 2)

- Versioning per artifact
- Password protection
- "Open in Claude" fork button
- Prompt storage alongside HTML
- Analytics dashboard

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Deploy**: Vercel
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: Supabase Auth
- **Language**: TypeScript

## Getting Started

```bash
npm install
cp .env.local.example .env.local
# Fill in your Supabase keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Deployment

```bash
vercel deploy
```

## License

MIT
