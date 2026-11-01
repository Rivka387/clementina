-- Run as postgres in a TEST Supabase project after the migration. All fixtures roll back.
begin;
insert into auth.users(id,email) values
 ('10000000-0000-4000-8000-000000000001','clementina-test-1@example.invalid'),
 ('10000000-0000-4000-8000-000000000002','clementina-test-2@example.invalid'),
 ('10000000-0000-4000-8000-000000000003','clementina-test-3@example.invalid'),
 ('10000000-0000-4000-8000-000000000004','clementina-test-4@example.invalid');
insert into public.groups(id,invite_code) values ('20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001');
insert into public.members(user_id,group_id,name) values
 ('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Test one'),
 ('10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','Test two');
insert into public.daily_entries(user_id,date,water) values ('10000000-0000-4000-8000-000000000002',current_date-1,4);
insert into public.food_entries(id,user_id,date,time,kind,food,amount) values
 ('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',current_date-1,'09:00','breakfast','Eggs','One plate'),
 ('40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002',current_date-1,'12:00','lunch','Soup','One bowl');
insert into public.food_plans(user_id,breakfast) values ('10000000-0000-4000-8000-000000000002','Partner plan');
insert into public.weights(user_id,date,kg,shared) values
 ('10000000-0000-4000-8000-000000000001',current_date-1,80,false),
 ('10000000-0000-4000-8000-000000000002',current_date-1,90,false),
 ('10000000-0000-4000-8000-000000000002',current_date-2,90,true);
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
do $$ declare n integer; begin
 if (select count(*) from public.members)<>2 then raise exception 'FAIL: duo visibility'; end if;
 if (select count(*) from public.weights)<>2 then raise exception 'FAIL: private weight leaked'; end if;
 if (select count(*) from public.food_entries)<>1 then raise exception 'FAIL: partner food diary leaked'; end if;
 if (select calories from public.food_entries where user_id=auth.uid()) is not null then raise exception 'FAIL: calories should be optional'; end if;
 if (select count(*) from public.food_plans)<>0 then raise exception 'FAIL: partner food plan leaked'; end if;
 insert into public.food_plans(user_id,breakfast) values(auth.uid(),'Own plan');
 if (select count(*) from public.food_plans)<>1 then raise exception 'FAIL: own plan insert'; end if;
 update public.food_plans set breakfast='Changed' where user_id='10000000-0000-4000-8000-000000000002';
 get diagnostics n=row_count;
 if n<>0 then raise exception 'FAIL: partner plan update allowed'; end if;
 insert into public.food_entries(user_id,date,time,kind,food,amount,calories) values(auth.uid(),current_date-1,'15:00','snack','Fruit','One piece',95);
 if (select count(*) from public.food_entries)<>2 then raise exception 'FAIL: own food entry insert'; end if;
 if (select calories from public.food_entries where food='Fruit' and user_id=auth.uid())<>95 then raise exception 'FAIL: optional calories were not stored'; end if;
 insert into public.food_entries(user_id,date,time,kind,food,amount) values(auth.uid(),current_date-1,'15:30','snack','No amount','');
 if (select amount from public.food_entries where food='No amount' and user_id=auth.uid())<>'' then raise exception 'FAIL: optional amount was not stored'; end if;
 begin
  insert into public.food_entries(user_id,date,time,kind,food,amount,calories) values(auth.uid(),current_date-1,'16:00','snack','Invalid','One piece',-1);
  raise exception 'FAIL: negative calories allowed';
 exception when check_violation then null; end;
 update public.food_entries set food='Changed' where user_id='10000000-0000-4000-8000-000000000002';
 get diagnostics n=row_count;
 if n<>0 then raise exception 'FAIL: partner food update allowed'; end if;
 delete from public.food_entries where user_id='10000000-0000-4000-8000-000000000002';
 get diagnostics n=row_count;
 if n<>0 then raise exception 'FAIL: partner food delete allowed'; end if;
 begin
  insert into public.food_entries(user_id,date,time,kind,food,amount) values('10000000-0000-4000-8000-000000000002',current_date-1,'16:00','snack','Fruit','One piece');
  raise exception 'FAIL: partner food insert allowed';
 exception when insufficient_privilege then null; end;
 insert into public.daily_entries(user_id,date,meals) values(auth.uid(),current_date-1,true);
 if (select count(*) from public.daily_entries)<>2 then raise exception 'FAIL: shared entries'; end if;
 update public.daily_entries set water=99 where user_id='10000000-0000-4000-8000-000000000002';
 get diagnostics n=row_count;
 if n<>0 then raise exception 'FAIL: partner update allowed'; end if;
 begin
  insert into public.daily_entries(user_id,date) values('10000000-0000-4000-8000-000000000002',current_date-2);
  raise exception 'FAIL: partner insert allowed';
 exception when insufficient_privilege then null; end;
 begin
  update public.members set group_id=gen_random_uuid() where user_id=auth.uid();
  raise exception 'FAIL: membership reassignment allowed';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.daily_entries(user_id,date) values(auth.uid(),current_date+2);
  raise exception 'FAIL: future report allowed';
 exception when insufficient_privilege then null; end;
 update public.members set name='Changed' where user_id=auth.uid();
 if (select name from public.members where user_id=auth.uid())<>'Changed' then raise exception 'FAIL: own profile update'; end if;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
do $$ begin
 if (select count(*) from public.groups)<>0 or (select count(*) from public.members)<>0 or (select count(*) from public.weights)<>0 or (select count(*) from public.daily_entries)<>0 or (select count(*) from public.food_entries)<>0 or (select count(*) from public.food_plans)<>0 then raise exception 'FAIL: outsider can read data'; end if;
 begin
  perform public.join_duo('30000000-0000-4000-8000-000000000001','Third');
  raise exception 'FAIL: third member joined';
 exception when raise_exception then if SQLERRM<>'Duo is full' then raise; end if; end;
 perform public.create_duo('New owner',8,current_date-1);
 if (select count(*) from public.members)<>1 then raise exception 'FAIL: new duo is not isolated'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform * from public.groups; raise exception 'FAIL: anonymous read'; exception when insufficient_privilege then null; end;
 begin perform * from public.food_entries; raise exception 'FAIL: anonymous food read'; exception when insufficient_privilege then null; end;
 begin perform * from public.food_plans; raise exception 'FAIL: anonymous plan read'; exception when insufficient_privilege then null; end;
 begin perform public.create_duo('Anonymous',12,current_date); raise exception 'FAIL: anonymous create'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
