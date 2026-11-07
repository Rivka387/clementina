import { Sun } from 'lucide-react';
import type { Data, Member } from '../../domain';
import { addDays, entryFor } from '../../domain';
import { formatDate, energyLabels } from '../../lib/presentation';

export default function EnergyTrend({
  data,
  me,
  today,
}: {
  data: Data;
  me: Member;
  today: string;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const reports = days.map((date) => ({ date, energy: entryFor(data, me.user_id, date).energy }));
  return (
    <section className="panel energy-trend" aria-labelledby="energy-trend-title">
      <div className="section-heading">
        <div>
          <h2 id="energy-trend-title">איך הרגשתי השבוע?</h2>
          <p>רמת האנרגיה שדיווחת בשבעת הימים האחרונים.</p>
        </div>
        <span className="stat-icon peach">
          <Sun />
        </span>
      </div>
      {reports.some((r) => r.energy !== null) ? (
        <ol className="energy-trend-chart" aria-label="רמת האנרגיה בשבעת הימים האחרונים">
          {reports.map(({ date, energy }) => (
            <li
              key={date}
              aria-label={`${formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}: ${energy === null ? 'לא דווחה אנרגיה' : energyLabels[energy - 1]}`}
            >
              <span className="trend-number">{energy ?? '—'}</span>
              <span className="trend-track">
                <span
                  className={energy === null ? 'trend-bar empty-bar' : 'trend-bar'}
                  style={{ height: energy === null ? '0%' : `${energy * 20}%` }}
                />
              </span>
              <small>{formatDate(date, { weekday: 'short' })}</small>
            </li>
          ))}
        </ol>
      ) : (
        <p className="energy-trend-empty">הגרף יופיע אחרי דיווח האנרגיה הראשון.</p>
      )}
      <p className="energy-trend-footnote">דירוג אישי בין 1 ל־5.</p>
    </section>
  );
}
