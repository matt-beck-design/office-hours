# Office Hours

A personal content dashboard PWA. Pulls RSS, Bluesky, and YouTube into live topic streams you can browse and read in-app. Lives on your iPhone home screen.

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

### 5. Pull content

```bash
# Daily ingest (also available as "Refresh feeds" in admin)
curl -X POST http://localhost:3000/api/cron/daily \
  -H "Authorization: Bearer your_cron_secret"
```

---

## Deploy to Vercel

1. Push to a GitHub repo
2. Import to Vercel
3. Add all env vars in Vercel → Settings → Environment Variables
4. Deploy — cron is configured in `vercel.json`:
   - Feed ingest: `0 13 * * *` (daily ~6am PDT / 13:00 UTC)

> Vercel Hobby only allows one cron run per day. Use admin **Refresh feeds** for a manual pull anytime; upgrade to Pro for sub-daily schedules.

---

## PWA / Home Screen

1. Open the deployed URL in Safari on iPhone
2. Tap Share → Add to Home Screen
3. Enable notifications when prompted

Push notifications require the app to be installed to the home screen on iOS.

---

## How it works

- Sources are organized into **topic groups** in admin (for managing feeds)
- The home screen opens on **Overview**, then type tabs: Articles, Posts, Videos, Releases
- A daily cron (or admin "Refresh feeds") fetches RSS + Bluesky into `feed_items` and YouTube into `videos`
- Articles open in the in-app reader; posts and videos open externally
- Track games, movies, shows, and other drop dates on the Releases tab (add/edit requires the admin password)

---

## File overview

```
sources.config.js           — seed config for feeds / YouTube
supabase/schema.sql         — database tables
supabase/migrations/        — incremental migrations for existing DBs
lib/
  run-ingest.ts             — fetch + upsert feed items and videos
  fetch-feeds.ts            — RSS + Bluesky + YouTube fetchers
  get-sources.ts            — load sources from DB (fallback: config)
app/
  page.tsx                  — Overview + type tabs
  admin/                    — source management + refresh controls
  api/items/                — serve feed items
  api/videos/               — serve videos
  api/releases/             — release feed CRUD
  api/cron/daily/           — daily ingest cron
components/
  Overview.tsx              — all-types dashboard
  ContentStream.tsx         — content-type streams
  ReleaseCalendar.tsx       — upcoming release feed
  ReaderSheet.tsx           — in-app article reader
  PushManager.tsx           — notification subscribe button
```
