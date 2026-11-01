import { afterEach,describe,expect,it,vi } from 'vitest';
import { loadDemo,persistDemo } from './data';
import { demoData,entryFor,upsertEntry,upsertFoodEntry,upsertFoodPlan } from './domain';
afterEach(()=>vi.unstubAllGlobals());
describe('durable demo storage',()=>{
 it('restores the exact saved report after reload',()=>{
  const values=new Map<string,string>();
  vi.stubGlobal('localStorage',{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v)});
  const d=demoData('2026-11-01');const next=upsertFoodPlan(upsertFoodEntry(upsertEntry(d,{...entryFor(d,'me','2026-11-01'),water:7,note:'remember this'}),{...d.food_entries[0],amount:'שתי קערות'}),{user_id:'me',breakfast:'יוגורט',lunch:'',dinner:'',snacks:'',guidance:''});
  persistDemo(next);expect(loadDemo()).toEqual(next);
 });
 it('opens an older local demo without losing existing daily reports',()=>{
  const data=demoData('2026-11-01');
  const older=Object.fromEntries(Object.entries(data).filter(([key])=>!['food_entries','food_plans','food_log_ready'].includes(key)));
  vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify(older),setItem:vi.fn()});
  const restored=loadDemo();
  expect(restored.entries).toEqual(data.entries);
  expect(restored.food_entries).toEqual([]);
  expect(restored.food_plans).toEqual([]);
  expect(restored.food_log_ready).toBe(true);
 });
 it('never silently replaces corrupt saved data with sample data',()=>{
  const write=vi.fn();vi.stubGlobal('localStorage',{getItem:()=>'{broken json',setItem:write});
  expect(()=>loadDemo()).toThrow();expect(write).not.toHaveBeenCalled();
 });
 it('rejects an unknown storage version without overwriting it',()=>{
  const write=vi.fn();vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify({...demoData(),version:9}),setItem:write});
  expect(()=>loadDemo()).toThrow();expect(write).not.toHaveBeenCalled();
 });
 it('propagates quota failures so the UI cannot claim a successful save',()=>{
  vi.stubGlobal('localStorage',{setItem:()=>{throw new DOMException('Storage full','QuotaExceededError');}});
  expect(()=>persistDemo(demoData())).toThrow('Storage full');
 });
});
