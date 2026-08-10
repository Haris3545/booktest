# Shelfie — Bookshelf Scanner

Point your phone at a bookshelf, tap Scan, and Shelfie catalogs every book spine — including old, faded, or embossed ones — so you can search "where's my copy of X" or ask for suggestions like "a funny book about turtles."

## How it works

1. **Scan** (`/scan`) — pick a shelf (or create one), take a photo with a guided full-screen camera.
2. Claude's vision model reads every spine and returns a best-guess title/author for each, flagging faded or uncertain ones as low-confidence rather than skipping them.
3. High-confidence titles are auto-matched against Open Library for clean metadata + cover art. Low-confidence ones get a cropped close-up and go to a **review screen** (`/scan/review`) where you confirm them in a few taps.
4. **Search** (`/search`) — find a book in your own catalog (with a photo of the shelf and the spine highlighted), or describe what you're in the mood for and get suggestions with links to Open Library.

## Setup (free tier)

You'll need three things, all free:

### 1. Supabase (database + photo storage)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/schema.sql` from this repo.
3. In **Storage**, create a bucket named `shelf-photos` and mark it **public** (so photos/covers can be viewed without extra auth).
4. In **Project Settings → API**, copy the **Project URL** and the **service_role** key (not the anon key — the app talks to Supabase only from the server).

### 2. Anthropic API key (Claude vision)

1. Create a key at [console.anthropic.com](https://console.anthropic.com).
2. There's no free permanent key, but usage is pay-as-you-go and cheap — this app only calls Claude once per shelf scan and once per recommendation search, not per book.

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...
```

### 4. Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For camera access on a phone, open it over HTTPS (deploy to Vercel, or use a tool like `ngrok` for local testing — most mobile browsers block camera access on plain HTTP).

## Deploying

Push this repo to GitHub and import it on [Vercel](https://vercel.com/new) (free tier). Add the same three environment variables in the Vercel project settings. The app is installable as a home-screen PWA once deployed over HTTPS.

## Notes

- Single-user, no login — all database access goes through server-side API routes using the Supabase service role key, so no credentials are ever exposed to the browser.
- Regenerate the app icons any time with `node scripts/gen-icons.mjs`.
