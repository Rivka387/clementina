import {
  ArrowLeft,
  Check,
  Droplets,
  Footprints,
  Heart,
  Leaf,
  Moon,
  Salad,
  Sun,
  UsersRound,
  Utensils,
} from 'lucide-react';
import type { Data, Entry, FoodEntry, FoodPlan, Member } from '../../domain';
import { HABITS, entryFor, score, streak } from '../../domain';
import { formatDate, energyLabels } from '../../lib/presentation';
import Ring from '../../components/Ring';
import DatePicker from '../../components/DatePicker';
import DailyOverview from './DailyOverview';
import FoodDiary from '../food/FoodDiary';
import FoodPlanCard from '../food/FoodPlanCard';

type TodayPageProps = {
  data: Data;
  me: Member;
  userId: string;
  date: string;
  today: string;
  isDemo: boolean;
  busy: boolean;
  saveError: string;
  setDate: (date: string) => void;
  onUpdateEntry: (entry: Entry) => Promise<boolean>;
  onSaveFood: (entry: FoodEntry) => Promise<boolean>;
  onDeleteFood: (entry: FoodEntry) => Promise<boolean>;
  onSavePlan: (plan: FoodPlan) => Promise<boolean>;
  onCheer: () => void;
  onInvite: () => void;
  onTogether: () => void;
};
const icons = { utensils: Utensils, salad: Salad, heart: Heart, moon: Moon };

export default function TodayPage({
  data,
  me,
  userId,
  date,
  today,
  isDemo,
  busy,
  saveError,
  setDate,
  onUpdateEntry,
  onSaveFood,
  onDeleteFood,
  onSavePlan,
  onCheer,
  onInvite,
  onTogether,
}: TodayPageProps) {
  const entry = entryFor(data, userId, date);
  const partner = data.members.find((member) => member.user_id !== userId);
  const partnerEntry = partner ? entryFor(data, partner.user_id, date) : null;
  const latestForMe = [...data.cheers]
    .filter((cheer) => cheer.user_id !== userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  return (
    <>
      <div className="day-toolbar">
        <DatePicker date={date} today={today} start={data.group.start_date} setDate={setDate} />
      </div>
      <DailyOverview
        entry={entry}
        me={me}
        activeStreak={streak(data, me, date)}
        busy={busy}
        onUpdate={onUpdateEntry}
      />
      <div className="dashboard-grid">
        <div className="main-column">
          <FoodDiary
            key={`${userId}-${date}`}
            entries={data.food_entries}
            userId={userId}
            date={date}
            ready={data.food_log_ready}
            busy={busy}
            error={saveError}
            onSave={onSaveFood}
            onDelete={onDeleteFood}
          />
          <section className="panel habit-panel">
            <div className="section-heading">
              <div>
                <h2>הרגלים</h2>
                <p>סמני רק מה שכבר עשית.</p>
              </div>
              <span className="soft-label">{HABITS.filter((h) => entry[h.key]).length} מתוך 4</span>
            </div>
            <div className="habits">
              {HABITS.map((h) => {
                const Icon = icons[h.icon];
                return (
                  <button
                    key={h.key}
                    disabled={busy}
                    className={'habit ' + (entry[h.key] ? 'completed' : '')}
                    aria-pressed={entry[h.key]}
                    onClick={() => void onUpdateEntry({ ...entry, [h.key]: !entry[h.key] })}
                  >
                    <span className={'habit-icon ' + h.color}>
                      <Icon size={22} />
                    </span>
                    <span className="habit-copy">
                      <strong>{h.title}</strong>
                      <small>{h.detail}</small>
                    </span>
                    <span className="checkbox">{entry[h.key] && <Check size={17} />}</span>
                  </button>
                );
              })}
            </div>
            <div className="gentle-footnote">
              <Leaf size={15} />
              אפשר לחזור ולעדכן גם בהמשך היום.
            </div>
          </section>
        </div>
        <div className="side-column">
          <section className="panel partner-panel">
            <div className="section-heading">
              <h2>השותפה שלי</h2>
              <span className="mini-hearts">
                <Heart size={18} />
                <Heart size={13} />
              </span>
            </div>
            {partner && partnerEntry ? (
              <>
                <div className="partner-summary">
                  <span className="avatar avatar-large green">{partner.name.slice(0, 1)}</span>
                  <div>
                    <h3>{partner.name}</h3>
                    <p>
                      {formatDate(date)} · {isDemo ? 'נתוני דוגמה' : 'הדיווח שלה'}
                    </p>
                  </div>
                  <Ring small value={score(partnerEntry, partner)} />
                </div>
                <p className="partner-caption">
                  {score(partnerEntry, partner)} מתוך 6 הרגלים ויעדים הושלמו.
                </p>
                <div className="partner-metrics">
                  <span>
                    <Droplets size={16} />
                    {partnerEntry.water} כוסות
                  </span>
                  <span>
                    <Footprints size={16} />
                    {partnerEntry.walk} דקות
                  </span>
                </div>
                <button className="outline-button full" onClick={() => onCheer()}>
                  <Heart size={17} /> שליחת הודעה
                </button>
              </>
            ) : (
              <div className="empty">
                <UsersRound />
                <p>אפשר לעקוב לבד, או לצרף שותפה.</p>
                <button className="primary" onClick={() => onInvite()}>
                  הזמנת שותפה
                </button>
              </div>
            )}
          </section>
          <section className="energy-card">
            <span className="eyebrow">
              <Sun size={17} /> האנרגיה שלי
            </span>
            <h2>איך האנרגיה שלך {date === today ? 'היום' : 'ביום הזה'}?</h2>
            <div className="energy-options" role="group" aria-label="רמת האנרגיה">
              {energyLabels.map((label, i) => (
                <button
                  key={label}
                  aria-label={label}
                  title={label}
                  aria-pressed={entry.energy === i + 1}
                  disabled={busy}
                  className={entry.energy === i + 1 ? 'selected' : ''}
                  onClick={() => void onUpdateEntry({ ...entry, energy: i + 1 })}
                >
                  <span className={'energy-face face-' + i}>
                    <i />
                    <i />
                    <b />
                  </span>
                </button>
              ))}
            </div>
            <p className="energy-caption">
              {entry.energy ? `דיווחת: ${energyLabels[entry.energy - 1]}` : 'בחרי איך את מרגישה.'}
            </p>
          </section>
          {latestForMe && (
            <section className="panel latest-note">
              <span className="eyebrow">
                <Heart size={16} /> הודעה מ{partner?.name ?? 'השותפה'}
              </span>
              <p>{latestForMe.message}</p>
              <button className="text-button" onClick={() => onTogether()}>
                לכל ההודעות <ArrowLeft size={15} />
              </button>
            </section>
          )}
        </div>
      </div>
      <FoodPlanCard
        key={userId}
        plan={data.food_plans.find((plan) => plan.user_id === userId)}
        userId={userId}
        ready={data.food_log_ready}
        busy={busy}
        error={saveError}
        onSave={onSavePlan}
      />
    </>
  );
}
