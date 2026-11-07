import type { FoodEntry } from '../../domain';
import { addDays } from '../../domain';

export default function FoodWeek({
  entries,
  userId,
  today,
  start,
  ready,
  onOpenDay,
}: {
  entries: FoodEntry[];
  userId: string;
  today: string;
  start: string;
  ready: boolean;
  onOpenDay: (date: string) => void;
}) {
  if (!ready) return null;
  const days = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6)).filter(
    (date) => date >= start,
  );
  const rows = days.map((date) => ({
    date,
    items: entries
      .filter((entry) => entry.user_id === userId && entry.date === date)
      .sort((a, b) => a.time.localeCompare(b.time)),
  }));
  const recorded = rows.filter((row) => row.items.length > 0).length;
  return (
    <section className="panel food-week" aria-labelledby="food-week-title">
      <div className="section-heading">
        <div>
          <h2 id="food-week-title">האכילה שלי השבוע</h2>
          <p>
            תיעדת אכילה ב־{recorded} מתוך {days.length} ימים. פתחי יום כדי לראות או לתקן את
            הרישומים.
          </p>
        </div>
      </div>
      <ol>
        {rows.map((row) => (
          <li key={row.date}>
            <button type="button" onClick={() => onOpenDay(row.date)}>
              <strong>
                {new Intl.DateTimeFormat('he-IL', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'numeric',
                }).format(new Date(row.date + 'T12:00:00Z'))}
              </strong>
              <span>{row.items.length ? `${row.items.length} רישומים` : 'אין רישומים'}</span>
              <small>
                {row.items.length
                  ? row.items
                      .map((item) => item.food)
                      .slice(0, 2)
                      .join(' · ')
                  : 'אפשר להוסיף דיווח גם ליום הזה'}
              </small>
            </button>
          </li>
        ))}
      </ol>
      <p className="food-week-note">הרישומים אישיים וזמינים רק לך.</p>
    </section>
  );
}
