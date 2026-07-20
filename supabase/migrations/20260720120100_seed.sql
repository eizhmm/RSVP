-- Seed 4 sittings + 3 existing guests on Sat 6 PM

insert into public.dinner_sessions (event_date, slot_key, slot_label, starts_at, capacity)
values
  ('2026-08-15', 'sat-18', 'Early seating', '18:00', 8),
  ('2026-08-15', 'sat-20', 'Main seating', '20:00', 8),
  ('2026-08-16', 'sun-18', 'Early seating', '18:00', 7),
  ('2026-08-16', 'sun-20', 'Main seating', '20:00', 7)
on conflict (slot_key) do nothing;

do $$
declare
  v_session_id uuid;
  v_party_id uuid;
begin
  select id into v_session_id from public.dinner_sessions where slot_key = 'sat-18';

  if v_session_id is null then
    return;
  end if;

  if exists (select 1 from public.rsvp_parties where lower(lead_email) = 'aisha@example.com') then
    return;
  end if;

  insert into public.rsvp_parties (session_id, pax, confirmation_code, lead_email)
  values (v_session_id, 1, 'KT-SEED01', 'aisha@example.com')
  returning id into v_party_id;

  insert into public.rsvp_guests (party_id, is_lead, full_name, phone, email, designation, dietary_note, sort_order)
  values (v_party_id, true, 'Aisha Rahman', '012-345 6789', 'aisha@example.com', 'Community Partner', 'Vegetarian', 1);

  insert into public.rsvp_parties (session_id, pax, confirmation_code, lead_email)
  values (v_session_id, 1, 'KT-SEED02', 'daniel.lim@example.com')
  returning id into v_party_id;

  insert into public.rsvp_guests (party_id, is_lead, full_name, phone, email, designation, dietary_note, sort_order)
  values (v_party_id, true, 'Daniel Lim', '017-222 1100', 'daniel.lim@example.com', 'Donor', null, 1);

  insert into public.rsvp_parties (session_id, pax, confirmation_code, lead_email)
  values (v_session_id, 1, 'KT-SEED03', 'priya.n@example.com')
  returning id into v_party_id;

  insert into public.rsvp_guests (party_id, is_lead, full_name, phone, email, designation, dietary_note, sort_order)
  values (v_party_id, true, 'Priya Nair', '019-880 4411', 'priya.n@example.com', 'Guest', 'No nuts', 1);
end $$;
