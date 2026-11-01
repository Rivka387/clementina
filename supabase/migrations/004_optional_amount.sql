-- Run after 002_food_entries.sql in Supabase SQL Editor.
-- An empty string means no amount was supplied. Existing amounts are unchanged.
begin;
alter table public.food_entries drop constraint if exists food_entries_amount_check;
alter table public.food_entries add constraint food_entries_amount_check
  check (char_length(amount) <= 80);
commit;
