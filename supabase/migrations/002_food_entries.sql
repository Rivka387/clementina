-- Run after 001_clementina.sql in the same Supabase project.
-- The food diary is private to its author; the shared habit summary remains in daily_entries.
begin;
create table public.food_entries (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.members(user_id) on delete cascade,
 date date not null check (date <= (now() at time zone 'Asia/Jerusalem')::date),
 time text not null check (time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
 kind text not null check (kind in ('breakfast','lunch','dinner','snack','drink')),
 food text not null check (char_length(trim(food)) between 1 and 160),
 amount text not null check (char_length(trim(amount)) between 1 and 80),
 note text not null default '' check (char_length(note) <= 180),
 created_at timestamptz not null default now()
);
create index food_entries_user_date_idx on public.food_entries(user_id,date desc,time desc);
alter table public.food_entries enable row level security;
revoke all on public.food_entries from anon,authenticated;
grant select,insert,update,delete on public.food_entries to authenticated;
create policy food_read_own on public.food_entries for select to authenticated using (user_id=(select auth.uid()));
create policy food_insert_own on public.food_entries for insert to authenticated with check (user_id=(select auth.uid()));
create policy food_update_own on public.food_entries for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy food_delete_own on public.food_entries for delete to authenticated using (user_id=(select auth.uid()));
create table public.food_plans (
 user_id uuid primary key references public.members(user_id) on delete cascade,
 breakfast text not null default '' check (char_length(breakfast) <= 500),
 lunch text not null default '' check (char_length(lunch) <= 500),
 dinner text not null default '' check (char_length(dinner) <= 500),
 snacks text not null default '' check (char_length(snacks) <= 500),
 guidance text not null default '' check (char_length(guidance) <= 800)
);
alter table public.food_plans enable row level security;
revoke all on public.food_plans from anon,authenticated;
grant select,insert,update on public.food_plans to authenticated;
create policy plan_read_own on public.food_plans for select to authenticated using (user_id=(select auth.uid()));
create policy plan_insert_own on public.food_plans for insert to authenticated with check (user_id=(select auth.uid()));
create policy plan_update_own on public.food_plans for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
commit;
