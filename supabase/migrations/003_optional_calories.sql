-- Run once after 002_food_entries.sql in Supabase SQL Editor.
-- NULL means this meal was recorded without a calorie estimate.
begin;
alter table public.food_entries
  add column if not exists calories integer check (calories between 0 and 10000);
commit;
