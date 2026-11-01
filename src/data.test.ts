import { afterEach,describe,expect,it,vi } from 'vitest';
import { loadDemo,persistDemo } from './data';
import { demoData,entryFor,upsertEntry } from './domain';
afterEach(()=>vi.unstubAllGlobals());
describe('durable demo storage',()=>{
 it('restores the exact saved report after reload',()=>{
  const values=new Map<string,string>();
  vi.stubGlobal('localStorage',{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v)});
  const d=demoData('2026-11-01');const next=upsertEntry(d,{...entryFor(d,'me','2026-11-01'),water:7,note:'remember this'});
  persistDemo(next);expect(loadDemo()).toEqual(next);
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
