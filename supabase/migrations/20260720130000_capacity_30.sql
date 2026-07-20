-- Raise total capacity to 30 seats (8+8+7+7)

update public.dinner_sessions
set capacity = case slot_key
  when 'sat-18' then 8
  when 'sat-20' then 8
  when 'sun-18' then 7
  when 'sun-20' then 7
  else capacity
end;
