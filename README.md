# Shoe IQ

Fleet Feet staff fitting tool: browse shoes by fitting category, infer matches from a
Volumental scan, get an insert recommendation, and reference the consultation checklist.
Data is shared live across every device via Supabase.

## One-time setup

### 1. Create the Supabase project
1. Go to [supabase.com](https://supabase.com), create a free project.
2. In the SQL editor, run the contents of [`supabase/schema.sql`](supabase/schema.sql). This creates
   the tables and seeds them with the current shoe list, categories, scan rules, insert triggers,
   and arch-color reference &mdash; all the data currently in the prototype.
3. In Project Settings → API, copy the **Project URL** and the **anon/public key**.

### 2. Configure the app
```bash
cp .env.example .env
```
Fill in:
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` &mdash; from step 1.
- `VITE_STAFF_PIN` &mdash; any PIN staff will enter once per browser session before they can
  use **Add new shoe** or **Manage rules**. This is a deterrent against a customer who picks up
  the tablet, not real authentication &mdash; anyone with the PIN (or who reads the bundled JS) can
  bypass it. If that's not enough, swap this for Supabase Auth.

### 3. Run locally
```bash
npm install
npm run dev
```

### 4. Deploy
Push this folder to a Git repo, then import it into [Vercel](https://vercel.com) or
[Netlify](https://netlify.com) as a Vite project. Add the three `VITE_*` env vars in the
hosting provider's dashboard (same values as your `.env`). Both platforms give you a stable
URL staff can bookmark on a store tablet or phone.

## What's editable without a code change

- **Shoe list** &mdash; via "+ Add new shoe" (PIN gated). Specs textareas save on blur.
- **Scan &#x2192; category rules** and **Insert finder triggers** &mdash; via "Manage rules" (PIN gated).
  These are Matt's own inference, grounded in Fleet Feet staff notes but not yet signed off by a
  fitter &mdash; review before treating as authoritative.
- **Categories** and **arch color map** &mdash; not yet exposed in the UI; edit directly in the
  Supabase table editor for now.

## Known data-quality flags

Shoes seeded with a `flagged = true` row carry a small "Needs review" badge on their card
(hover for the reason). These are spreadsheet rows that came in as a brand name with no model,
or that look like a typo/duplicate of another row (e.g. "Clifon" vs "Clifton", "Ultafly" vs
"Ultrafly"). Nothing about their matching behavior changed &mdash; this is just a visual flag so a
future data review can find them quickly. Resolve by editing the row in Supabase once a fitter
confirms the correct model/brand.
