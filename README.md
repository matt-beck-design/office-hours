# Office Hours

A personal content dashboard PWA. Pulls RSS, Bluesky, and YouTube into live topic streams you can browse and read in-app. Lives on your iPhone home screen.

Design rules live in [`design.md`](design.md).

## Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS
- Supabase (Postgres)
- Web Push (VAPID) for optional notifications
- Deployed on Vercel with a daily ingest cron

---

## Setup

### 1. Supabase

Create a project at [supabase.com](https://supabase.com), then run `supabase/schema.sql` in the SQL editor.

If you already have an older schema, run the files in `supabase/migrations/` in order:
1. `001_feed_items.sql` — live feed items
2. `002_source_type.sql` — content-type tags
3. `003_releases.sql` — release feed

### 2. Environment variables

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role secret key |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | See below |
| `VAPID_PRIVATE_KEY` | See below |
| `VAPID_EMAIL` | Any email (`mailto:you@example.com`) |
| `CRON_SECRET` | Any long random string (e.g. `openssl rand -hex 32`) |
| `ADMIN_SECRET` | Password for `/admin` |
| `YOUTUBE_API_KEY` | Optional — needed for YouTube channels |

**Generating VAPID keys:**
```bash
npx web-push generate-vapid-keys
```

### 3. Add your sources

Edit `sources.config.js`, or manage groups/sources in `/admin` after seeding.

### 4. Run locally

```bash
npm run dev
```

### 5. Content loads live

Open the app — Articles and Videos fetch directly from your sources (cached about 5 minutes). Releases still use Supabase.

Optional: admin **Refresh feeds** still warms the DB cache; it is no longer required to see new content.

---

## Deploy to Vercel

1. Push to a GitHub repo
2. Import to Vercel
3. Add all env vars in Vercel → Settings → Environment Variables
4. Deploy

No cron is required for the dashboard. Vercel Hobby’s once-daily cron limit no longer affects feed freshness.

---

## PWA / Home Screen

1. Open the deployed URL in Safari on iPhone
2. Tap Share → Add to Home Screen
3. Enable notifications from **Settings** if you want them

Push notifications require the app to be installed to the home screen on iOS.

---

## How it works

- Sources are organized into **topic groups** in admin (or `sources.config.js`)
- The home screen opens on **Overview**, then Articles, Videos, Releases, Settings
- **Articles and Videos load live** from RSS / YouTube on request (~5 min server cache)
- Supabase stores **releases**, **push subscriptions**, and optional admin source config
- Articles open in the in-app reader; videos open externally
- Track games, movies, shows, and other drop dates on the Releases tab (add/edit requires the admin password)

---

## File overview

```
sources.config.js           — seed config for feeds / YouTube
supabase/schema.sql         — database tables (releases, sources, push)
supabase/migrations/        — incremental migrations for existing DBs
lib/
  live-feeds.ts             — on-demand RSS + YouTube aggregation
  run-ingest.ts             — optional DB cache warm
  fetch-feeds.ts            — RSS + Bluesky + YouTube fetchers
  get-sources.ts            — load sources from DB (fallback: config)
app/
  page.tsx                  — Overview + type tabs
  admin/                    — source management
  api/items/                — live feed items
  api/videos/               — live videos
  api/releases/             — release feed CRUD
  api/cron/daily/           — optional ingest (manual / leftover)
components/
  Overview.tsx              — dashboard
  ContentStream.tsx         — articles / videos streams
  ReleaseCalendar.tsx       — upcoming release feed
  ReaderSheet.tsx           — in-app article reader
  Settings.tsx              — notifications
```
