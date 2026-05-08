# Office Hours

A personal news PWA. Consolidates RSS and Bluesky feeds into a daily AI digest, with a separate YouTube video feed. Lives on your iPhone home screen.

## Stack

- Next.js 14 App Router + TypeScript
- Tailwind CSS
- Supabase (Postgres)
- Anthropic Claude (`claude-sonnet-4-20250514`) for digest generation and breaking news filtering
- Web Push (VAPID) for push notifications
- Deployed on Vercel with two cron jobs

---

## Setup

### 1. Supabase

Create a project at [supabase.com](https://supabase.com), then run `supabase/schema.sql` in the SQL editor.

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role secret key |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | See below |
| `VAPID_PRIVATE_KEY` | See below |
| `VAPID_EMAIL` | Any email (`mailto:you@example.com`) |
| `CRON_SECRET` | Any long random string (e.g. `openssl rand -hex 32`) |

**Generating VAPID keys:**
```bash
npx web-push generate-vapid-keys
```
Placeholder keys are pre-filled in `.env.local` — replace with real ones before deploying to production.

### 3. Add your sources

Edit `sources.config.js`. The shape is documented inline. Add YouTube channels like:
```js
youtube: [
  { name: 'Channel Name', channelId: 'UCxxxxxxxxxxxxxxxxxxxxxxxx' },
]
```
YouTube channel IDs can be found in the channel URL or via the YouTube Data API.

### 4. Run locally

```bash
npm run dev
```

### 5. Test the crons manually

```bash
# Daily digest
curl -X POST http://localhost:3000/api/cron/daily \
  -H "Authorization: Bearer your_cron_secret"

# Breaking news check
curl -X POST http://localhost:3000/api/cron/breaking \
  -H "Authorization: Bearer your_cron_secret"
```

---

## Deploy to Vercel

1. Push to a GitHub repo
2. Import to Vercel
3. Add all env vars in Vercel → Settings → Environment Variables
4. Deploy — cron jobs are configured in `vercel.json`:
   - Daily digest: `0 15 * * *` (7am PT / 15:00 UTC)
   - Breaking news: `0 * * * *` (every hour)

> Vercel crons require a Pro plan or above for sub-hourly schedules. The hourly breaking news cron is within the free Hobby plan limit.

---

## PWA / Home Screen

1. Open the deployed URL in Safari on iPhone
2. Tap Share → Add to Home Screen
3. Enable notifications when prompted

Push notifications require the app to be installed to the home screen on iOS.

---

## File overview

```
sources.config.js        — all feed and YouTube channel config
supabase/schema.sql      — database tables
lib/
  supabase.ts            — Supabase client (browser + admin)
  push.ts                — Web Push helpers (server-only)
  fetch-feeds.ts         — RSS + Bluesky + YouTube fetchers
app/
  page.tsx               — two-tab shell
  api/cron/daily/        — daily digest cron
  api/cron/breaking/     — hourly breaking news cron
  api/digest/            — serve latest digest
  api/videos/            — serve videos
  api/push/              — subscribe/unsubscribe push
components/
  DigestView.tsx         — digest reader
  VideosView.tsx         — video feed
  PushManager.tsx        — notification subscribe button
  ServiceWorkerRegistrar — registers sw.js
public/
  sw.js                  — service worker (offline + push)
  manifest.json          — PWA manifest
vercel.json              — cron schedules
```
