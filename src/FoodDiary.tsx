import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Check, Clock3, Pencil, Plus, Trash2, Utensils, X } from 'lucide-react';
import type { FoodEntry, FoodKind, FoodPlan } from './domain';
import { addDays } from './domain';

const kinds: { value: FoodKind; label: string }[] = [
  { value: 'breakfast', label: 'ארוחת בוקר' },
  { value: 'lunch', label: 'ארוחת צהריים' },
  { value: 'dinner', label: 'ארוחת ערב' },
  { value: 'snack', label: 'נשנוש' },
  { value: 'drink', label: 'שתייה אחרת' },
];

export function kindLabel(kind: FoodKind) { return kinds.find(item => item.value === kind)?.label ?? kind; }
function foodDetails(entry: FoodEntry) { return [entry.amount.trim(),entry.calories==null?'':`${entry.calories} קלוריות`,entry.note.trim()].filter(Boolean).join(' · '); }
function localTime() { return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date()); }
function kindAt(time: string): FoodKind { const hour=Number(time.slice(0,2)); return hour<11?'breakfast':hour<16?'lunch':hour<21?'dinner':'snack'; }

function FoodForm({entry,userId,date,busy,error,onSave,onCancel}: {entry: FoodEntry | null; userId: string; date: string; busy: boolean; error: string; onSave: (entry: FoodEntry) => Promise<boolean>; onCancel: () => void}) {
  const [time,setTime]=useState(entry?.time ?? localTime());
  const [kind,setKind]=useState<FoodKind>(entry?.kind ?? kindAt(time));
  const [food,setFood]=useState(entry?.food ?? '');
  const [amount,setAmount]=useState(entry?.amount ?? '');
  const [calories,setCalories]=useState(entry?.calories == null ? '' : String(entry.calories));
  const [note,setNote]=useState(entry?.note ?? '');
  async function submit(event: FormEvent) {
    event.preventDefault();
    const saved=await onSave({id:entry?.id ?? crypto.randomUUID(),user_id:userId,date,time,kind,food:food.trim(),amount:amount.trim(),note:note.trim(),calories:calories.trim()===''?null:Number(calories)});
    if(saved)onCancel();
  }
  return <form className="food-form" onSubmit={event=>void submit(event)}>
    <h3>{entry?'עריכת רישום':'מה אכלת או שתית?'}</h3>
    <div className="food-form-row"><label>סוג<select value={kind} onChange={event=>setKind(event.target.value as FoodKind)}>{kinds.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>שעה<input type="time" required value={time} onChange={event=>setTime(event.target.value)}/></label></div>
    <label>מה היה?<input required maxLength={160} value={food} onChange={event=>setFood(event.target.value)} placeholder="לדוגמה: אורז, עדשים וסלט"/></label>
    <label>כמה (לא חובה)<input maxLength={80} value={amount} onChange={event=>setAmount(event.target.value)} placeholder="למשל: צלחת אחת או 2 פרוסות"/></label>
    <label>קלוריות (לא חובה)<input type="number" inputMode="numeric" min="0" max="10000" step="1" value={calories} onChange={event=>setCalories(event.target.value)} placeholder="אם ידוע לך"/></label>
    <label>הערה, אם תרצי<textarea maxLength={180} rows={2} value={note} onChange={event=>setNote(event.target.value)} placeholder="למשל: הייתי רעבה, אכלתי מחוץ לבית"/></label>
    <p className="food-form-help">מים רגילים מעדכנים בכרטיס ״מים״. כאן רושמים משקאות אחרים.</p>
    {error&&<p role="alert" className="error-text">{error}</p>}
    <div className="food-form-actions"><button className="primary" disabled={busy||!food.trim()}><Check size={17}/>{busy?'שומר…':'שמירת הרישום'}</button><button className="outline-button" type="button" disabled={busy} onClick={onCancel}>ביטול</button></div>
  </form>;
}

export default function FoodDiary({entries,userId,date,ready,busy,error,onSave,onDelete}: {entries: FoodEntry[]; userId: string; date: string; ready: boolean; busy: boolean; error: string; onSave: (entry: FoodEntry) => Promise<boolean>; onDelete: (entry: FoodEntry) => Promise<boolean>}) {
  const [open,setOpen]=useState(false);
  const [form,setForm]=useState<{open: boolean; entry: FoodEntry | null}>({open:false,entry:null});
  const [confirmId,setConfirmId]=useState<string|null>(null);
  const dialogRef=useRef<HTMLDialogElement>(null);
  const triggerRef=useRef<HTMLButtonElement>(null);
  const own=entries.filter(entry=>entry.user_id===userId && entry.date===date).sort((a,b)=>a.time.localeCompare(b.time));
  useEffect(()=>{
    if(!open)return;
    const dialog=dialogRef.current;
    if(!dialog)return;
    const previousOverflow=document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow='hidden';
    return ()=>{
      document.body.style.overflow=previousOverflow;
      if(dialog.open)dialog.close();
      triggerRef.current?.focus();
    };
  },[open]);
  function openDiary(add=false){
    setConfirmId(null);
    setForm({open:add,entry:null});
    setOpen(true);
  }
  return <section className="panel food-diary" aria-labelledby="food-diary-title">
    <div className="food-diary-peek">
      <span className="food-diary-symbol" aria-hidden="true"><Utensils size={22}/></span>
      <div className="food-diary-copy"><h2 id="food-diary-title">יומן האכילה</h2><p>{!ready?'היומן עדיין לא הופעל בחשבון הזה.':own.length?`${own.length} רישומים ביום הזה · ${own.slice(-2).map(entry=>entry.food).join(' · ')}`:'עוד אין ארוחות ביום הזה. נתחיל?'}</p></div>
      {ready&&<button ref={triggerRef} className="food-diary-open" type="button" onClick={()=>openDiary(own.length===0)} aria-haspopup="dialog"><span>{own.length?'פתיחת היומן':'רישום ארוחה'}</span><Plus size={18}/></button>}
    </div>
    {ready&&own.length>0&&<ol className="food-preview" aria-label="הארוחות האחרונות">{own.slice(-3).map(item=><li key={item.id}><span className={'meal-symbol meal-'+item.kind}><Utensils size={17}/></span><div><strong>{item.food}</strong><small>{kindLabel(item.kind)}{item.amount?' · '+item.amount:''}</small></div><time>{item.time}</time></li>)}</ol>}
    <div className="food-diary-footer"><span>יומן אישי</span><span>כמות וקלוריות רק אם תרצי</span></div>
    {open&&<dialog ref={dialogRef} className="food-drawer" dir="rtl" aria-labelledby="food-drawer-title" onCancel={event=>{event.preventDefault();setOpen(false);}} onClick={event=>{if(event.target===event.currentTarget)setOpen(false);}}>
      <div className="food-drawer-inner">
        <header className="food-drawer-head"><div><span className="food-drawer-kicker">היומן האישי שלי</span><h2 id="food-drawer-title">יומן האכילה</h2><p>רשמי מה אכלת ומתי. כמות וקלוריות רק אם תרצי.</p></div><button className="food-drawer-close" type="button" aria-label="סגירת יומן האכילה" onClick={()=>setOpen(false)}><X size={21}/></button></header>
        <div className="food-drawer-body">
          <div className="food-drawer-toolbar"><strong>{own.length?`${own.length} רישומים ביום הזה`:'עוד אין רישומים ביום הזה'}</strong><button className="primary" type="button" disabled={busy} onClick={()=>{setConfirmId(null);setForm({open:true,entry:null});}}><Plus size={18}/> הוספת ארוחה או נשנוש</button></div>
          {form.open&&<FoodForm key={`${date}-${form.entry?.id??'new'}`} entry={form.entry} userId={userId} date={date} busy={busy} error={error} onSave={onSave} onCancel={()=>setForm({open:false,entry:null})}/>}
          {own.length===0?<p className="food-empty">עוד אין ארוחות ביום הזה. הוסיפי את הארוחה הראשונה.</p>:<ol className="food-list">{own.map(entry=><li key={entry.id}><div className="food-time"><Clock3 size={15}/><time dateTime={`${entry.date}T${entry.time}`}>{entry.time}</time></div><div className="food-description"><strong>{kindLabel(entry.kind)}</strong><p>{entry.food}</p>{foodDetails(entry)&&<small>{foodDetails(entry)}</small>}</div><div className="food-item-actions"><button className="icon-button" disabled={busy} aria-label={`עריכת ${kindLabel(entry.kind)} בשעה ${entry.time}`} onClick={()=>{setConfirmId(null);setForm({open:true,entry});}}><Pencil size={17}/></button><button className="icon-button" disabled={busy} aria-label={`מחיקת ${kindLabel(entry.kind)} בשעה ${entry.time}`} onClick={()=>setConfirmId(entry.id)}><Trash2 size={17}/></button></div>{confirmId===entry.id&&<div className="food-confirm"><span>למחוק את הרישום הזה?</span><button type="button" disabled={busy} onClick={()=>void onDelete(entry).then(ok=>{if(ok)setConfirmId(null);})}>כן, למחוק</button><button type="button" disabled={busy} onClick={()=>setConfirmId(null)}>ביטול</button></div>}</li>)}</ol>}
        </div>
      </div>
    </dialog>}
  </section>;
}

export function FoodWeek({entries,userId,today,start,ready,onOpenDay}: {entries: FoodEntry[]; userId: string; today: string; start: string; ready: boolean; onOpenDay: (date: string) => void}) {
  if(!ready)return null;
  const days=Array.from({length:7},(_,index)=>addDays(today,index-6)).filter(date=>date>=start);
  const rows=days.map(date=>({date,items:entries.filter(entry=>entry.user_id===userId&&entry.date===date).sort((a,b)=>a.time.localeCompare(b.time))}));
  const recorded=rows.filter(row=>row.items.length>0).length;
  return <section className="panel food-week" aria-labelledby="food-week-title">
    <div className="section-heading"><div><h2 id="food-week-title">האכילה שלי השבוע</h2><p>תיעדת אכילה ב־{recorded} מתוך {days.length} ימים. פתחי יום כדי לראות או לתקן את הרישומים.</p></div></div>
    <ol>{rows.map(row=><li key={row.date}><button type="button" onClick={()=>onOpenDay(row.date)}><strong>{new Intl.DateTimeFormat('he-IL',{weekday:'short',day:'numeric',month:'numeric'}).format(new Date(row.date+'T12:00:00Z'))}</strong><span>{row.items.length?`${row.items.length} רישומים`:'אין רישומים'}</span><small>{row.items.length?row.items.map(item=>item.food).slice(0,2).join(' · '):'אפשר להוסיף דיווח גם ליום הזה'}</small></button></li>)}</ol>
    <p className="food-week-note">הרישומים אישיים וזמינים רק לך.</p>
  </section>;
}

const planFields: {key: 'breakfast'|'lunch'|'dinner'|'snacks'; label: string}[]=[
  {key:'breakfast',label:'בוקר'}, {key:'lunch',label:'צהריים'}, {key:'dinner',label:'ערב'}, {key:'snacks',label:'נשנושים'},
];

export function FoodPlanCard({plan,userId,ready,busy,error,onSave}: {plan:FoodPlan|undefined;userId:string;ready:boolean;busy:boolean;error:string;onSave:(plan:FoodPlan)=>Promise<boolean>}) {
  const blank:FoodPlan={user_id:userId,breakfast:'',lunch:'',dinner:'',snacks:'',guidance:''};
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState<FoodPlan>(plan??blank);
  if(!ready)return null;
  const hasPlan=!!plan && (planFields.some(field=>plan[field.key].trim()) || !!plan.guidance.trim());
  async function submit(event:FormEvent){event.preventDefault();if(await onSave(draft))setEditing(false);}
  return <section className="panel food-plan" aria-labelledby="food-plan-title">
    <div className="section-heading"><div><h2 id="food-plan-title">תכנון הארוחות שלי</h2><p>רעיונות לארוחות והכנות מראש.</p></div><button className="outline-button" disabled={busy} onClick={()=>{setDraft(plan??blank);setEditing(!editing);}}>{editing?'סגירה':hasPlan?'עריכת התכנון':'כתיבת התכנון'}</button></div>
    {editing?<form className="food-plan-form" onSubmit={event=>void submit(event)}>{planFields.map(field=><label key={field.key}>{field.label}<textarea rows={2} maxLength={500} value={draft[field.key]} onChange={event=>setDraft({...draft,[field.key]:event.target.value})} placeholder="מה מתאים לך לארוחה הזאת?"/></label>)}<label>דברים שחשוב לי לזכור<textarea rows={2} maxLength={800} value={draft.guidance} onChange={event=>setDraft({...draft,guidance:event.target.value})} placeholder="למשל: מה להכין מראש או מה עוזר לי להתמיד"/></label>{error&&<p role="alert" className="error-text">{error}</p>}<button className="primary" disabled={busy}>{busy?'שומר…':'שמירת התכנון'}</button></form>:hasPlan?<div className="food-plan-grid">{planFields.filter(field=>plan?.[field.key].trim()).map(field=><div key={field.key}><strong>{field.label}</strong><p>{plan![field.key]}</p></div>)}{plan?.guidance&&<div className="food-plan-guidance"><strong>כדאי לזכור</strong><p>{plan.guidance}</p></div>}</div>:<p className="food-plan-empty">עוד אין תכנון. אפשר להוסיף רעיונות לבוקר, לצהריים ולערב.</p>}
  </section>;
}
