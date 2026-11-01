import { describe,it,expect } from 'vitest';
import { addDays,blankEntry,demoData,entryFor,localDay,removeFoodEntry,score,streak,upsertEntry,upsertFoodEntry,upsertFoodPlan,upsertWeight,validEntry,validFoodEntry,validFoodPlan,weekDates } from './domain';
describe('daily tracking integrity',()=>{
 it('uses Jerusalem calendar days in summer and winter',()=>{
  expect(localDay(new Date('2026-10-31T22:30:00Z'))).toBe('2026-11-01');
  expect(localDay(new Date('2026-06-30T21:30:00Z'))).toBe('2026-07-01');
 });
 it('moves over year boundaries and builds Sunday-first weeks',()=>{
  expect(addDays('2026-12-31',1)).toBe('2027-01-01');
  expect(addDays('2026-10-25',-1)).toBe('2026-10-24');
  expect(weekDates('2026-11-01')).toEqual(['2026-11-01','2026-11-02','2026-11-03','2026-11-04','2026-11-05','2026-11-06','2026-11-07']);
 });
 it('a missing report is empty rather than borrowed from a partner',()=>{
  expect(entryFor(demoData('2026-11-01'),'me','2026-11-02')).toEqual(blankEntry('me','2026-11-02'));
 });
 it('updates idempotently without modifying partner data or the original state',()=>{
  const d=demoData('2026-11-01'),original=entryFor(d,'mom','2026-11-01');
  const e={...entryFor(d,'me','2026-11-01'),water:5};const next=upsertEntry(upsertEntry(d,e),e);
  expect(next.entries.length).toBe(d.entries.length);expect(entryFor(next,'mom',e.date)).toEqual(original);
  expect(entryFor(next,'me',e.date).water).toBe(5);expect(entryFor(d,'me',e.date).water).toBe(3);
 });
 it('scores habits and personal goals, never weight or energy',()=>{
  const me=demoData('2026-11-01').members[0];
  expect(score({...blankEntry('me','2026-11-01'),energy:5,water:7,walk:29},me)).toBe(0);
  expect(score({...blankEntry('me','2026-11-01'),meals:true,veggies:true,mindful:true,rest:true,water:8,walk:30},me)).toBe(6);
 });
 it('does not break yesterday’s streak before today is reported',()=>{
  const d=demoData('2026-11-01');d.entries=d.entries.filter(e=>e.date!=='2026-11-01');expect(streak(d,d.members[0],'2026-11-01')).toBe(13);
  d.entries=d.entries.filter(e=>e.date!=='2026-10-30');expect(streak(d,d.members[0],'2026-11-01')).toBe(1);
 });
 it('keeps one weight per user and date',()=>{
  const d=demoData('2026-11-01'),w={user_id:'me',date:'2026-11-01',kg:81,shared:false};
  const n=upsertWeight(upsertWeight(d,w),w);expect(n.weights.length).toBe(d.weights.length);expect(n.weights.find(x=>x.date===w.date)?.kg).toBe(81);
 });
 it('rejects invalid counters, energy and oversized notes',()=>{
  const e=blankEntry('me','2026-11-01');expect(validEntry(e)).toBe(true);
  for(const bad of [{water:-1},{water:1.5},{walk:601},{energy:6},{note:'a'.repeat(501)}])expect(validEntry({...e,...bad})).toBe(false);
 });
 it('keeps food records by id and rejects incomplete or malformed records',()=>{
  const data=demoData('2026-11-01');const entry=data.food_entries[0];
  expect(validFoodEntry(entry)).toBe(true);
  expect(validFoodEntry({...entry,calories:null})).toBe(true);
  expect(validFoodEntry({...entry,calories:0})).toBe(true);
  expect(validFoodEntry({...entry,calories:420})).toBe(true);
  expect(validFoodEntry({...entry,amount:''})).toBe(true);
  const changed={...entry,amount:'שתי קערות'};
  const updated=upsertFoodEntry(upsertFoodEntry(data,changed),changed);
  expect(updated.food_entries.length).toBe(data.food_entries.length);
  expect(updated.food_entries.find(item=>item.id===entry.id)?.amount).toBe('שתי קערות');
  expect(data.food_entries[0].amount).toBe('קערה אחת');
  expect(removeFoodEntry(updated,entry.id).food_entries.some(item=>item.id===entry.id)).toBe(false);
  for(const bad of [null,{...entry,time:'25:90'},{...entry,amount:'x'.repeat(81)},{...entry,food:'x'.repeat(161)},{...entry,kind:'dessert'},{...entry,calories:-1},{...entry,calories:10001},{...entry,calories:12.5},{...entry,calories:'420'}])expect(validFoodEntry(bad)).toBe(false);
 });
 it('keeps one private food plan per user',()=>{
  const data=demoData('2026-11-01');
  const plan={user_id:'me',breakfast:'יוגורט ופרי',lunch:'',dinner:'',snacks:'',guidance:'להכין מראש'};
  expect(validFoodPlan(plan)).toBe(true);
  const updated=upsertFoodPlan(upsertFoodPlan(data,plan),{...plan,lunch:'ארוחה בבית'});
  expect(updated.food_plans).toHaveLength(1);
  expect(updated.food_plans[0].lunch).toBe('ארוחה בבית');
  expect(validFoodPlan({...plan,breakfast:'x'.repeat(501)})).toBe(false);
 });
});
