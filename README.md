# Chronos Agent

Turn meetings into outcomes — transcripts, summaries, decisions, action items, and shareable PDFs.

Built with React + Vite + Tailwind on the frontend, and Lovable Cloud (managed Supabase) for database, auth, storage, and edge functions.

---

## Running Locally

### 1. Clone & install

```bash
git clone <your-repo-url>
cd <your-repo>
npm install
npm run dev
```

The app starts at [http://localhost:5173](http://localhost:5173).

By default, the local frontend talks to the **hosted Lovable Cloud backend** using the values already in `.env` — so auth, meetings, and emails keep working with zero extra setup.

---

## Running Your Own Supabase Backend Locally

If you want to fully detach from Lovable Cloud and run Postgres + Auth + Edge Functions on your own machine (or your own self-hosted Supabase project), follow these steps.

### 1. Install the Supabase CLI

```bash
npm install -g supabase
# or: brew install supabase/tap/supabase
```

You'll also need **Docker Desktop** running (the CLI uses it to spin up Postgres, Auth, Storage, etc.).

### 2. Start a local Supabase stack

From the project root:

```bash
supabase start
```

This boots a full local stack and prints out:

- **API URL** — usually `http://localhost:54321`
- **anon key** — a local JWT
- **Studio URL** — `http://localhost:54323` (visual database UI)

### 3. Apply the database migrations

The schema (the `meetings` table, RLS policies, triggers) lives in `supabase/migrations/`. Apply them locally:

```bash
supabase db reset
```

This wipes the local DB and re-runs every migration in order.

### 4. Serve the edge functions

The project has two edge functions: `process-meeting` and `send-email`.

```bash
supabase functions serve
```

Set any required secrets (e.g. `RESEND_API_KEY`, `LOVABLE_API_KEY`) in a local `supabase/.env` file:

```env
RESEND_API_KEY=your_resend_key
LOVABLE_API_KEY=your_lovable_ai_key
```

### 5. Point the frontend at your local backend

Update the project `.env`:

```env
VITE_SUPABASE_URL="http://localhost:54321"
VITE_SUPABASE_PUBLISHABLE_KEY="<the local anon key from supabase start>"
VITE_SUPABASE_PROJECT_ID="local"
```

Restart the dev server:

```bash
npm run dev
```

You're now running 100% locally.

### 6. (Optional) Deploy to your own hosted Supabase project

If instead of running locally you want to host on your own Supabase account:

```bash
supabase link --project-ref <your-project-ref>
supabase db push                  # apply migrations
supabase functions deploy         # deploy edge functions
supabase secrets set RESEND_API_KEY=... LOVABLE_API_KEY=...
```

Then update `.env` with your hosted project's URL and anon key.

---

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `supabase start` | Boot local Postgres + Auth + Storage |
| `supabase stop` | Shut down the local stack |
| `supabase db reset` | Re-apply all migrations from scratch |
| `supabase functions serve` | Run edge functions locally |
