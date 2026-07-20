-- Kind Table RSVP schema
-- Sessions, party bookings, and individual guests

create extension if not exists pgcrypto;

create table if not exists public.dinner_sessions (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  slot_key text not null unique,
  slot_label text not null,
  starts_at time not null,
  capacity int not null default 5 check (capacity > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.rsvp_parties (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.dinner_sessions(id) on delete restrict,
  pax int not null check (pax >= 1),
  confirmation_code text not null unique,
  lead_email text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists rsvp_parties_lead_email_lower_idx
  on public.rsvp_parties (lower(lead_email));

create table if not exists public.rsvp_guests (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.rsvp_parties(id) on delete cascade,
  is_lead boolean not null default false,
  full_name text not null,
  phone text not null,
  email text not null,
  designation text not null,
  dietary_note text,
  sort_order int not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists rsvp_guests_party_id_idx on public.rsvp_guests(party_id);
create index if not exists rsvp_parties_session_id_idx on public.rsvp_parties(session_id);

-- Remaining seats helper
create or replace function public.session_seats_taken(p_session_id uuid)
returns int
language sql
stable
as $$
  select coalesce(sum(pax), 0)::int
  from public.rsvp_parties
  where session_id = p_session_id;
$$;

-- Atomic booking: enforces capacity under row lock
create or replace function public.create_rsvp_booking(
  p_slot_key text,
  p_pax int,
  p_lead jsonb,
  p_companions jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.dinner_sessions%rowtype;
  v_taken int;
  v_party_id uuid;
  v_code text;
  v_companion jsonb;
  v_idx int := 2;
begin
  if p_pax < 1 then
    raise exception 'INVALID_PAX';
  end if;

  if jsonb_array_length(coalesce(p_companions, '[]'::jsonb)) <> (p_pax - 1) then
    raise exception 'COMPANION_COUNT_MISMATCH';
  end if;

  select * into v_session
  from public.dinner_sessions
  where slot_key = p_slot_key
  for update;

  if not found then
    raise exception 'SESSION_NOT_FOUND';
  end if;

  v_taken := public.session_seats_taken(v_session.id);

  if v_taken + p_pax > v_session.capacity then
    raise exception 'SESSION_FULL';
  end if;

  if exists (
    select 1 from public.rsvp_parties where lower(lead_email) = lower(p_lead->>'email')
  ) then
    raise exception 'EMAIL_ALREADY_REGISTERED';
  end if;

  v_code := 'KT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.rsvp_parties (session_id, pax, confirmation_code, lead_email)
  values (v_session.id, p_pax, v_code, p_lead->>'email')
  returning id into v_party_id;

  insert into public.rsvp_guests (
    party_id, is_lead, full_name, phone, email, designation, dietary_note, sort_order
  ) values (
    v_party_id,
    true,
    p_lead->>'fullName',
    p_lead->>'phone',
    p_lead->>'email',
    p_lead->>'designation',
    nullif(p_lead->>'dietaryNote', ''),
    1
  );

  for v_companion in select * from jsonb_array_elements(coalesce(p_companions, '[]'::jsonb))
  loop
    insert into public.rsvp_guests (
      party_id, is_lead, full_name, phone, email, designation, dietary_note, sort_order
    ) values (
      v_party_id,
      false,
      v_companion->>'fullName',
      v_companion->>'phone',
      v_companion->>'email',
      v_companion->>'designation',
      nullif(v_companion->>'dietaryNote', ''),
      v_idx
    );
    v_idx := v_idx + 1;
  end loop;

  return jsonb_build_object(
    'partyId', v_party_id,
    'confirmationCode', v_code,
    'pax', p_pax,
    'slotKey', v_session.slot_key,
    'eventDate', v_session.event_date,
    'slotLabel', v_session.slot_label,
    'startsAt', v_session.starts_at
  );
end;
$$;

revoke all on function public.create_rsvp_booking(text, int, jsonb, jsonb) from public;
grant execute on function public.create_rsvp_booking(text, int, jsonb, jsonb) to service_role;

alter table public.dinner_sessions enable row level security;
alter table public.rsvp_parties enable row level security;
alter table public.rsvp_guests enable row level security;

-- Public can read sessions (seat counts via service role / server)
create policy "sessions_public_read"
  on public.dinner_sessions
  for select
  to anon, authenticated
  using (true);

-- No direct public writes; server uses service_role
create policy "parties_service_all"
  on public.rsvp_parties
  for all
  to service_role
  using (true)
  with check (true);

create policy "guests_service_all"
  on public.rsvp_guests
  for all
  to service_role
  using (true)
  with check (true);

create policy "sessions_service_all"
  on public.dinner_sessions
  for all
  to service_role
  using (true)
  with check (true);
