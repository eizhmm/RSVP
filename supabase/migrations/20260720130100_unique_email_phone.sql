-- Unique email + phone across all guests; strengthen booking checks

create or replace function public.normalize_phone(p text)
returns text
language sql
immutable
as $$
  select regexp_replace(coalesce(p, ''), '\D', '', 'g');
$$;

create unique index if not exists rsvp_guests_email_lower_uidx
  on public.rsvp_guests (lower(email));

create unique index if not exists rsvp_guests_phone_digits_uidx
  on public.rsvp_guests (public.normalize_phone(phone));

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
  v_emails text[];
  v_phones text[];
  v_email text;
  v_phone text;
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

  -- Collect party emails / phones (normalized)
  v_emails := array[lower(trim(p_lead->>'email'))];
  v_phones := array[public.normalize_phone(p_lead->>'phone')];

  for v_companion in select * from jsonb_array_elements(coalesce(p_companions, '[]'::jsonb))
  loop
    v_emails := array_append(v_emails, lower(trim(v_companion->>'email')));
    v_phones := array_append(v_phones, public.normalize_phone(v_companion->>'phone'));
  end loop;

  -- Within-party duplicates
  if exists (
    select 1 from unnest(v_emails) e
    group by e
    having count(*) > 1
  ) then
    raise exception 'DUPLICATE_EMAIL_IN_PARTY';
  end if;

  if exists (
    select 1 from unnest(v_phones) p
    where length(p) > 0
    group by p
    having count(*) > 1
  ) then
    raise exception 'DUPLICATE_PHONE_IN_PARTY';
  end if;

  -- Against existing guests (any sitting)
  foreach v_email in array v_emails
  loop
    if exists (
      select 1 from public.rsvp_guests g where lower(g.email) = v_email
    ) then
      raise exception 'EMAIL_ALREADY_REGISTERED';
    end if;
  end loop;

  foreach v_phone in array v_phones
  loop
    if length(v_phone) > 0 and exists (
      select 1 from public.rsvp_guests g
      where public.normalize_phone(g.phone) = v_phone
    ) then
      raise exception 'PHONE_ALREADY_REGISTERED';
    end if;
  end loop;

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
