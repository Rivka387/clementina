import { useState } from 'react';
import { Check, CircleHelp, Cloud, Download, LogOut, Settings2, ShieldCheck } from 'lucide-react';
import type { Data, Member } from '../../domain';
import { exportData, supabase } from '../../data';

export default function Preferences({
  me,
  data,
  isDemo,
  busy,
  update,
  switchUser,
  notify,
}: {
  me: Member;
  data: Data;
  isDemo: boolean;
  busy: boolean;
  update: (m: Member) => Promise<void>;
  switchUser: (id: string) => void;
  notify: (s: string) => void;
}) {
  const [name, setName] = useState(me.name),
    [water, setWater] = useState(me.water_goal),
    [walk, setWalk] = useState(me.walk_goal);
  return (
    <div className="settings-grid">
      <form
        className="panel"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim())
            void update({ ...me, name: name.trim(), water_goal: water, walk_goal: walk });
        }}
      >
        <span className="stat-icon peach">
          <Settings2 />
        </span>
        <h2>הפרופיל והיעדים שלי</h2>
        <label>
          השם שלך
          <input required maxLength={30} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="form-grid">
          <label>
            יעד כוסות מים ביום
            <input
              type="number"
              required
              min="1"
              max="20"
              step="1"
              value={water}
              onChange={(e) => setWater(Number(e.target.value))}
            />
          </label>
          <label>
            יעד דקות הליכה ביום
            <input
              type="number"
              required
              min="5"
              max="180"
              step="5"
              value={walk}
              onChange={(e) => setWalk(Number(e.target.value))}
            />
          </label>
        </div>
        <p className="muted">
          היעדים הם העדפה אישית, ואפשר לשנות אותם בכל זמן. שינוי יעד מעדכן גם את חישובי ההתקדמות
          הקודמים.
        </p>
        <button className="primary" disabled={busy || !name.trim()}>
          {busy ? 'שומר…' : 'שמירת שינויים'}
          <Check size={17} />
        </button>
      </form>
      <div className="settings-aside">
        <section className="panel">
          <span className="stat-icon green">
            <ShieldCheck />
          </span>
          <h2>פרטיות וגיבוי</h2>
          <p>
            כל אחת מדווחת על עצמה. ההרגלים, האנרגיה והפתקים משותפים; יומן האכילה ותכנון הארוחות
            אישיים, וכל מדידת משקל פרטית, אלא אם בחרת לשתף אותה.
          </p>
          <button
            className="outline-button full"
            onClick={() => {
              exportData(data);
              notify('הגיבוי הורד למכשיר.');
            }}
          >
            <Download size={17} /> הורדת גיבוי הנתונים
          </button>
          <p className="muted">הגיבוי כולל את הנתונים האישיים הזמינים בחשבון הזה.</p>
        </section>
        <section className="panel">
          <span className="stat-icon peach">
            <Cloud />
          </span>
          <h2>{isDemo ? 'על ההדגמה' : 'החשבון שלי'}</h2>
          <p>
            {isDemo
              ? 'נתוני דוגמה נשמרים בדפדפן הזה בלבד ולא עוברים לחשבון אישי.'
              : 'הנתונים נשמרים בחשבון שלך ומסתנכרנים בין המכשירים.'}
          </p>
          {isDemo ? (
            <>
              <p className="muted">לבדיקת החוויה בלבד — החלפת דמות בהדגמה:</p>
              <div className="segmented">
                {data.members.map((m) => (
                  <button
                    type="button"
                    key={m.user_id}
                    aria-pressed={me.user_id === m.user_id}
                    onClick={() => switchUser(m.user_id)}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <button
              className="outline-button full"
              onClick={() =>
                void supabase!.auth.signOut().then(({ error }) => {
                  if (error) notify('ההתנתקות לא הצליחה. נסי שוב.');
                })
              }
            >
              <LogOut size={17} /> יציאה מהחשבון
            </button>
          )}
        </section>
      </div>
      <section className="care-note">
        <CircleHelp size={22} />
        <div>
          <h3>לידיעתך</h3>
          <p>המעקב אינו תחליף לייעוץ מקצועי. מומלץ להתאים יעדי תזונה ופעילות עם אשת מקצוע.</p>
        </div>
      </section>
    </div>
  );
}
