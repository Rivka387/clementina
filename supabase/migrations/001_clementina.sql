-- Run once in a new Supabase project's SQL editor.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create table public.groups (
 id uuid primary key default gen_random_uuid(),
 title text not null default 'הפרק הקטן שלנו',
 start_date date not null default (now() at time zone 'Asia/Jerusalem')::date,
 weeks integer not null default 12 check (weeks in (8,12,16,24)),
 invite_code uuid not null unique default gen_random_uuid(),
 created_at timestamptz not null default now()
);
create table public.members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 group_id uuid not null references public.groups(id) on delete cascade,
 name text not null check (char_length(trim(name)) between 1 and 30),
 water_goal integer not null default 8 check (water_goal between 1 and 20),
 walk_goal integer not null default 30 check (walk_goal between 5 and 180),
 created_at timestamptz not null default now()
);
create index members_group_idx on public.members(group_id);
create table public.daily_entries (
 user_id uuid not null references public.members(user_id) on delete cascade,
 date date not null,
 meals boolean not null default false, veggies boolean not null default false,
 mindful boolean not null default false, rest boolean not null default false,
 water integer not null default 0 check (water between 0 and 40),
 walk integer not null default 0 check (walk between 0 and 600),
 energy integer check (energy between 1 and 5),
 note text not null default '' check (char_length(note)<=500),
 updated_at timestamptz not null default now(), primary key(user_id,date)
);
create table public.weights (
 user_id uuid not null references public.members(user_id) on delete cascade,
 date date not null, kg numeric(4,1) not null check (kg between 20 and 400),
 shared boolean not null default false, primary key(user_id,date)
);
create table public.cheers (
 id uuid primary key default gen_random_uuid(),
 group_id uuid not null references public.groups(id) on delete cascade,
 user_id uuid not null references public.members(user_id) on delete cascade,
 message text not null check (char_length(trim(message)) between 1 and 280),
 created_at timestamptz not null default now()
);
create index cheers_group_created_idx on public.cheers(group_id,created_at desc);
-- Narrow helpers avoid recursive RLS on memberships.
create function private.my_group() returns uuid language sql stable security definer set search_path = '' as $$
 select group_id from public.members where user_id=(select auth.uid());
$$;
create function private.in_my_group(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.members me join public.members partner on me.group_id=partner.group_id
 where me.user_id=(select auth.uid()) and partner.user_id=target);
$$;
revoke all on function private.my_group() from public,anon;
revoke all on function private.in_my_group(uuid) from public,anon;
grant execute on function private.my_group() to authenticated;
grant execute on function private.in_my_group(uuid) to authenticated;
alter table public.groups enable row level security;
alter table public.members enable row level security;
alter table public.daily_entries enable row level security;
alter table public.weights enable row level security;
alter table public.cheers enable row level security;
revoke all on public.groups,public.members,public.daily_entries,public.weights,public.cheers from anon,authenticated;
grant select on public.groups,public.members to authenticated;
grant update(name,water_goal,walk_goal) on public.members to authenticated;
grant select,insert,update on public.daily_entries,public.weights to authenticated;
grant select,insert on public.cheers to authenticated;
create policy groups_read_duo on public.groups for select to authenticated using(id=(select private.my_group()));
create policy members_read_duo on public.members for select to authenticated using(group_id=(select private.my_group()));
create policy members_update_self on public.members for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy entries_read_duo on public.daily_entries for select to authenticated using(private.in_my_group(user_id));
create policy entries_insert_self on public.daily_entries for insert to authenticated with check(user_id=(select auth.uid()) and date<=(now() at time zone 'Asia/Jerusalem')::date);
create policy entries_update_self on public.daily_entries for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and date<=(now() at time zone 'Asia/Jerusalem')::date);
create policy weights_read_own_or_shared on public.weights for select to authenticated using(user_id=(select auth.uid()) or (shared and private.in_my_group(user_id)));
create policy weights_insert_self on public.weights for insert to authenticated with check(user_id=(select auth.uid()) and date<=(now() at time zone 'Asia/Jerusalem')::date);
create policy weights_update_self on public.weights for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and date<=(now() at time zone 'Asia/Jerusalem')::date);
create policy cheers_read_duo on public.cheers for select to authenticated using(group_id=(select private.my_group()));
create policy cheers_insert_self on public.cheers for insert to authenticated with check(user_id=(select auth.uid()) and group_id=(select private.my_group()));
create function public.create_duo(p_name text,p_weeks integer default 12,p_start date default (now() at time zone 'Asia/Jerusalem')::date)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_group uuid; caller uuid := auth.uid();
begin
 if caller is null then raise exception 'Authentication required'; end if;
 if exists(select 1 from public.members where user_id=caller) then raise exception 'Already in a duo'; end if;
 if p_start>(now() at time zone 'Asia/Jerusalem')::date then raise exception 'Start date cannot be in the future'; end if;
 insert into public.groups(weeks,start_date) values(p_weeks,p_start) returning id into new_group;
 insert into public.members(user_id,group_id,name) values(caller,new_group,trim(p_name));
 return new_group;
end;
$$;
create function public.join_duo(p_code uuid,p_name text) returns uuid language plpgsql security definer set search_path = '' as $$
declare target_group uuid; caller uuid := auth.uid();
begin
 if caller is null then raise exception 'Authentication required'; end if;
 if exists(select 1 from public.members where user_id=caller) then raise exception 'Already in a duo'; end if;
 -- Row lock prevents concurrent requests from admitting a third member.
 select id into target_group from public.groups where invite_code=p_code for update;
 if target_group is null then raise exception 'Invalid invitation'; end if;
 if (select count(*) from public.members where group_id=target_group)>=2 then raise exception 'Duo is full'; end if;
 insert into public.members(user_id,group_id,name) values(caller,target_group,trim(p_name));
 return target_group;
end;
$$;
revoke all on function public.create_duo(text,integer,date) from public,anon;
revoke all on function public.join_duo(uuid,text) from public,anon;
grant execute on function public.create_duo(text,integer,date) to authenticated;
grant execute on function public.join_duo(uuid,text) to authenticated;
create function private.stamp_entry() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at=now(); return new; end;
$$;
create trigger stamp_entry before update on public.daily_entries for each row execute function private.stamp_entry();
commit;
