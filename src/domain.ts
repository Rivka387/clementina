export type Member = { user_id: string; group_id: string; name: string; water_goal: number; walk_goal: number };
export type Group = { id: string; title: string; start_date: string; weeks: number; invite_code: string };
export type Entry = { user_id: string; date: string; meals: boolean; veggies: boolean; mindful: boolean; rest: boolean; water: number; walk: number; energy: number | null; note: string };
export type Weight = { user_id: string; date: string; kg: number; shared: boolean };
export type Cheer = { id: string; group_id: string; user_id: string; message: string; created_at: string };
export type Data = { version: 1; group: Group; members: Member[]; entries: Entry[]; weights: Weight[]; cheers: Cheer[] };
export const HABITS = [
  { key: 'meals', title: 'עושות מקום לארוחות', detail: 'אכלתי מסודר, בקצב שלי', icon: 'utensils', color: 'peach' },
  { key: 'veggies', title: 'קצת צבע בצלחת', detail: 'הוספתי ירקות או סלט', icon: 'salad', color: 'green' },
  { key: 'mindful', title: 'מקשיבות לעצמנו', detail: 'עצרתי לבדוק אם אני רעבה', icon: 'heart', color: 'pink' },
  { key: 'rest', title: 'גם מנוחה היא התקדמות', detail: 'פיניתי זמן לשינה ולמנוחה', icon: 'moon', color: 'purple' },
] as const;
export function localDay(now = new Date()) { return new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Jerusalem', year:'numeric',month:'2-digit',day:'2-digit'}).format(now); }
export function addDays(date: string, n: number) { const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
export function dayDiff(a: string, b: string) { return Math.round((Date.parse(a + 'T12:00:00Z') - Date.parse(b + 'T12:00:00Z')) / 86400000); }
export function blankEntry(user_id: string, date: string): Entry { return { user_id, date, meals:false, veggies:false, mindful:false, rest:false, water:0, walk:0, energy:null, note:'' }; }
export function entryFor(data: Data, user: string, date: string) { return data.entries.find(e => e.user_id === user && e.date === date) ?? blankEntry(user, date); }
export function score(entry: Entry, member: Member) { return HABITS.filter(h => entry[h.key]).length + Number(entry.water >= member.water_goal) + Number(entry.walk >= member.walk_goal); }
export function streak(data: Data, member: Member, today: string) { let day = score(entryFor(data, member.user_id, today), member) > 0 ? today : addDays(today, -1); let n=0; while(n < 3660 && score(entryFor(data,member.user_id,day),member)>0) { n++; day=addDays(day,-1); } return n; }
export function weekDates(date: string) { const day = new Date(date + 'T12:00:00Z').getUTCDay(); return Array.from({length:7},(_,i)=>addDays(date,i-day)); }
export function upsertEntry(data: Data, entry: Entry): Data { return {...data, entries:[...data.entries.filter(e=>!(e.user_id===entry.user_id && e.date===entry.date)),entry]}; }
export function upsertWeight(data: Data, weight: Weight): Data { return {...data, weights:[...data.weights.filter(w=>!(w.user_id===weight.user_id && w.date===weight.date)),weight]}; }
export function validEntry(e: Entry) { return /^\d{4}-\d{2}-\d{2}$/.test(e.date) && [e.meals,e.veggies,e.mindful,e.rest].every(v=>typeof v==='boolean') && Number.isInteger(e.water) && e.water>=0 && e.water<=40 && Number.isInteger(e.walk) && e.walk>=0 && e.walk<=600 && (e.energy===null || (Number.isInteger(e.energy)&&e.energy>=1&&e.energy<=5)) && typeof e.note==='string' && e.note.length<=500; }
export function demoData(today=localDay()): Data {
  const group: Group={id:'demo',title:'הפרק הקטן שלנו',start_date:addDays(today,-13),weeks:12,invite_code:''};
  const members: Member[]=[{user_id:'me',group_id:'demo',name:'אני',water_goal:8,walk_goal:30},{user_id:'mom',group_id:'demo',name:'אמא',water_goal:8,walk_goal:30}];
  const entries: Entry[]=[];
  for(let i=13;i>=1;i--)for(const [j,m] of members.entries()) entries.push({...blankEntry(m.user_id,addDays(today,-i)),meals:true,veggies:i%4!==0,mindful:(i+j)%3!==0,rest:i%3!==0,water:6+(i+j)%3,walk: i%4===0?15:30,energy:3+(i%3)});
  entries.push({...blankEntry('me',today),meals:true,veggies:true,water:3,walk:10,energy:4});
  entries.push({...blankEntry('mom',today),meals:true,veggies:true,mindful:true,water:8,walk:20,energy:4});
  return {version:1,group,members,entries,weights:[{user_id:'me',date:addDays(today,-13),kg:82,shared:false},{user_id:'me',date:addDays(today,-7),kg:81.7,shared:false},{user_id:'me',date:today,kg:81.4,shared:false}],cheers:[{id:'demo-welcome',group_id:'demo',user_id:'mom',message:'איזה כיף שאנחנו עושות את זה יחד. צעד קטן, חיבוק גדול!',created_at:today+'T08:30:00+02:00'}]};
}
