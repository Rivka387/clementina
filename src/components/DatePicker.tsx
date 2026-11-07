import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, weekDates } from '../domain';
import { formatDate } from '../lib/presentation';

export default function DatePicker({
  date,
  today,
  start,
  setDate,
}: {
  date: string;
  today: string;
  start: string;
  setDate: (d: string) => void;
}) {
  return (
    <div className="date-picker">
      <div className="date-controls">
        <button
          className="icon-button"
          disabled={date <= start}
          onClick={() => setDate(addDays(date, -1))}
          aria-label="ליום הקודם"
        >
          <ChevronRight size={18} />
        </button>
        <span>
          {date === today
            ? 'היום'
            : formatDate(date, { weekday: 'long', day: 'numeric', month: 'short' })}
        </span>
        <button
          className="icon-button"
          disabled={date >= today}
          onClick={() => setDate(addDays(date, 1))}
          aria-label="ליום הבא"
        >
          <ChevronLeft size={18} />
        </button>
        {date !== today && (
          <button className="text-button" onClick={() => setDate(today)}>
            חזרה להיום
          </button>
        )}
      </div>
      <div className="week-days">
        {weekDates(date).map((d) => (
          <button
            key={d}
            disabled={d > today || d < start}
            aria-pressed={d === date}
            aria-label={formatDate(d, { weekday: 'long', day: 'numeric', month: 'long' })}
            onClick={() => setDate(d)}
          >
            <small>{formatDate(d, { weekday: 'short' })}</small>
            <strong>{Number(d.slice(-2))}</strong>
            {d === today && <i />}
          </button>
        ))}
      </div>
    </div>
  );
}
