import { Check, Droplets, Footprints, Flame, Minus, Plus } from 'lucide-react';
import type { Entry, Member } from '../../domain';
import { HABITS } from '../../domain';

export default function DailyOverview({
  entry,
  me,
  activeStreak,
  busy,
  onUpdate,
}: {
  entry: Entry;
  me: Member;
  activeStreak: number;
  busy: boolean;
  onUpdate: (entry: Entry) => Promise<boolean>;
}) {
  const habits = HABITS.filter((h) => entry[h.key]).length;
  return (
    <section className="overview-cards" aria-label="סיכום היום">
      <article className="panel summary-card habit-summary">
        <div className="summary-label">
          <span>ההרגלים שלי</span>
          <span className="stat-icon green">
            <Check size={20} />
          </span>
        </div>
        <div className="summary-value">
          {habits}
          <small>מתוך 4</small>
        </div>
        <progress value={habits} max={4} aria-label="הרגלים שהושלמו" />
        <p>{habits === 4 ? 'כל ההרגלים סומנו' : 'מסמנים הרגלים בהמשך העמוד'}</p>
      </article>
      <article className="panel summary-card water-card">
        <div className="summary-label">
          <span>כוסות מים</span>
          <span className="stat-icon blue">
            <Droplets size={20} />
          </span>
        </div>
        <div className="summary-value metric-value">
          {entry.water}
          <small>/ {me.water_goal} כוסות</small>
        </div>
        <progress
          value={Math.min(entry.water, me.water_goal)}
          max={me.water_goal}
          aria-label="התקדמות ליעד המים"
        />
        <p className="metric-remaining">
          {entry.water >= me.water_goal
            ? 'הגעת ליעד המים'
            : `נותרו ${me.water_goal - entry.water} כוסות ליעד`}
        </p>
        <div className="summary-actions">
          <button
            className="soft-button"
            disabled={busy || entry.water >= 40}
            onClick={() => void onUpdate({ ...entry, water: entry.water + 1 })}
          >
            <Plus size={15} /> הוספת כוס
          </button>
          <button
            className="icon-button"
            aria-label="הפחתת כוס מים"
            disabled={busy || entry.water === 0}
            onClick={() => void onUpdate({ ...entry, water: entry.water - 1 })}
          >
            <Minus size={16} />
          </button>
        </div>
      </article>
      <article className="panel summary-card walk-card">
        <div className="summary-label">
          <span>דקות הליכה</span>
          <span className="stat-icon purple">
            <Footprints size={20} />
          </span>
        </div>
        <div className="summary-value metric-value">
          {entry.walk}
          <small>/ {me.walk_goal} דקות</small>
        </div>
        <progress
          value={Math.min(entry.walk, me.walk_goal)}
          max={me.walk_goal}
          aria-label="התקדמות ליעד ההליכה"
        />
        <p className="metric-remaining">
          {entry.walk >= me.walk_goal
            ? 'הגעת ליעד ההליכה'
            : `נותרו ${me.walk_goal - entry.walk} דקות ליעד`}
        </p>
        <div className="summary-actions">
          <button
            className="soft-button"
            disabled={busy || entry.walk > 590}
            onClick={() => void onUpdate({ ...entry, walk: entry.walk + 10 })}
          >
            <Plus size={15} /> הוספת 10 דקות
          </button>
          <button
            className="icon-button"
            aria-label="הפחתת 10 דקות הליכה"
            disabled={busy || entry.walk === 0}
            onClick={() => void onUpdate({ ...entry, walk: Math.max(0, entry.walk - 10) })}
          >
            <Minus size={16} />
          </button>
        </div>
      </article>
      <article className="panel summary-card streak-card">
        <div className="summary-label">
          <span>הרצף שלי</span>
          <span className="stat-icon peach">
            <Flame size={20} />
          </span>
        </div>
        <div className="summary-value">
          {activeStreak}
          <small>ימים</small>
        </div>
        <div className="streak-caption">
          <Flame size={18} />
          <span>{activeStreak ? 'ימים פעילים ברצף' : 'כל התחלה נחשבת'}</span>
        </div>
        <p>יום פעיל = הרגל או יעד אחד לפחות</p>
      </article>
    </section>
  );
}
