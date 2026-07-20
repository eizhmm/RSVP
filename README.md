# Kind Table RSVP

Next.js charity dinner RSVP app backed by **Supabase**, deployable on **Vercel**, with invitation emails via **Resend**.

## Stack

- Next.js App Router + TypeScript
- Supabase Postgres (project **RSVP** / `ydceqlxxnqvotjfpmngm`)
- Resend for invitation emails
- Admin password cookie auth

## Setup

1. Copy env file:

```bash
cp .env.example .env.local
```

2. In Supabase → **RSVP** → Project Settings → API, paste:
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon / publishable)
   - `SUPABASE_SERVICE_ROLE_KEY` (**service_role** — server only)

3. In [Resend](https://resend.com) create an API key:
   - `RESEND_API_KEY`
   - Optional: verify a domain and set `RESEND_FROM_EMAIL`

4. Set `ADMIN_PASSWORD`

5. Run:

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Features

- Public RSVP with date → sitting → pax (capped by seats left)
- Guest details for each pax
- Yes/No confirm → florist invitation card
- Resend email with engraved invitation
- Admin report + CSV export (`/admin`)

## Vercel

```bash
npx vercel
```

Add the same env vars in the Vercel project settings (Production + Preview).

## Database

Schema lives in `supabase/migrations/`. Already applied to the RSVP project:

- 4 sittings (15–16 Aug 2026, 6 PM / 8 PM, capacity 5)
- 3 seed guests on Sat 6 PM
