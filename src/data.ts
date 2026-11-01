import { createClient } from '@supabase/supabase-js';
import type { Data, Entry, Member, Weight } from './domain';
import { demoData, validEntry } from './domain';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
// Bound network waits so a dropped connection cannot leave a form saving forever.
const timedFetch: typeof fetch=(input,init)=>{
  const timeout=AbortSignal.timeout(15000);
  const existing=init?.signal??(input instanceof Request?input.signal:null);
  return fetch(input,{...init,signal:existing?AbortSignal.any([existing,timeout]):timeout});
};
export const supabase=url&&key?createClient(url,key,{global:{fetch:timedFetch}}):null;
const DEMO_KEY='clementina-demo-v1';
export function loadDemo(): Data {
  const raw=localStorage.getItem(DEMO_KEY);
  if(!raw) { const data=demoData(); persistDemo(data); return data; }
  const data=JSON.parse(raw) as Data;
  if(data.version!==1 || !Array.isArray(data.members) || data.members.length!==2 || !data.group || !Array.isArray(data.entries) || !data.entries.every(validEntry) || !Array.isArray(data.weights)||!Array.isArray(data.cheers)) throw new Error('הנתונים השמורים לא נקראו. אפשר להוריד גיבוי לפני שמתחילים מחדש.');
  return data;
}
export function persistDemo(data: Data) { localStorage.setItem(DEMO_KEY,JSON.stringify(data)); }
export async function fetchCloud(userId: string): Promise<Data|null> {
  if(!supabase) throw new Error('החיבור עדיין לא הוגדר');
  const {data:me,error}=await supabase.from('members').select('*').eq('user_id',userId).maybeSingle();
  if(error) throw error; if(!me)return null;
  const responses=await Promise.all([
    supabase.from('groups').select('*').eq('id',me.group_id).single(),
    supabase.from('members').select('*').eq('group_id',me.group_id),
    supabase.from('daily_entries').select('*').order('date',{ascending:false}).limit(4000),
    supabase.from('weights').select('*').order('date',{ascending:false}).limit(2000),
    supabase.from('cheers').select('*').eq('group_id',me.group_id).order('created_at',{ascending:false}).limit(100),
  ]);
  for(const r of responses)if(r.error)throw r.error;
  return {version:1,group:responses[0].data,members:responses[1].data,entries:responses[2].data,weights:responses[3].data,cheers:responses[4].data} as Data;
}
export async function saveCloudEntry(entry: Entry) { if(!validEntry(entry))throw new Error('חלק מהערכים אינם תקינים'); const {error}=await supabase!.from('daily_entries').upsert(entry,{onConflict:'user_id,date'}); if(error)throw error; }
export async function saveCloudWeight(weight: Weight) { const {error}=await supabase!.from('weights').upsert(weight,{onConflict:'user_id,date'});if(error)throw error; }
export async function saveCloudMember(member: Member) { const {error}=await supabase!.from('members').update({name:member.name,water_goal:member.water_goal,walk_goal:member.walk_goal}).eq('user_id',member.user_id); if(error)throw error; }
export function exportData(data: Data) { const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='clementina-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
