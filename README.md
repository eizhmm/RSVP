# Kind Table RSVP

Public RSVP site for a charity donation dinner, plus a private admin report.

**Live:** [rsvp.muhammadidzham.site](https://rsvp.muhammadidzham.site)

## Stack

- **Next.js** (App Router, TypeScript)
- **Postgres** via Supabase (server-side service role only)
- **Vercel** hosting (Singapore `sin1`)
- **Resend** invitation emails
- Cookie-based admin password auth

## Features

- Landing page with live seat counts
- RSVP flow: date → sitting → party size → guest details
- Persistent field validation; unique email & phone (one registration each)
- Confirm dialog → engraved invitation card + optional email
- Admin: sitting tabs, search, CSV/PDF export, clear sitting / wipe all (type `DELETE`)
- After admin delete, freed emails/phones can register again

## Project layout

```text
src/
  app/                 # Routes (/, /rsvp, /admin, export)
  components/          # RsvpForm, BrandMark, admin UI
  lib/                 # Auth, queries, schema, email, PDF
public/brand/          # Logo mark
supabase/migrations/   # Schema + seed + capacity + uniqueness
```

## Setup

1. Copy env template:

```bash
cp .env.example .env.local
```

2. Fill values from your Supabase project (**Settings → API**):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon / publishable)
   - `SUPABASE_SERVICE_ROLE_KEY` (**service_role** — server only, never `NEXT_PUBLIC_`)

3. Resend:
   - `RESEND_API_KEY`
   - Optional verified domain: `RESEND_FROM_EMAIL`

4. Set a strong `ADMIN_PASSWORD`

5. Apply SQL in `supabase/migrations/` to your database (in filename order), then:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Security notes

- **Never commit** `.env.local` or real API keys (ignored via `.gitignore`)
- Service role key must stay server-side only
- Admin cookie is httpOnly; password compare is constant-time; auth fails closed if `ADMIN_PASSWORD` is unset
- Public clients do not write to the database; bookings go through a server action + RPC

## Deploy (Vercel)

```bash
npx vercel --prod
```

Set the same env vars in the Vercel project (Production + Preview). Region is configured in `vercel.json` as `sin1`.

## Database migrations

Apply in order:

| File | Purpose |
|------|---------|
| `20260720120000_init_rsvp.sql` | Sessions, parties, guests, booking RPC, RLS |
| `20260720120100_seed.sql` | 4 sittings + sample guests |
| `20260720130000_capacity_30.sql` | Capacities 8+8+7+7 |
| `20260720130100_unique_email_phone.sql` | Unique email/phone + booking checks |

## Admin

- Login: `/admin/login`
- Report / export / manage: `/admin`
