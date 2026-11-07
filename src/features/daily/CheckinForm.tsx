import { useState } from 'react';
import { Check } from 'lucide-react';
import type { Entry, Member } from '../../domain';
import { HABITS } from '../../domain';
import { formatDate, energyLabels } from '../../lib/presentation';

export default function CheckinForm({
  entry,
  me,
  busy,
  error,
  onSave,
}: {
  entry: Entry;
  me: Member;
  busy: boolean;
  error: string;
  onSave: (e: Entry) => void;
}) {
  const [draft, setDraft] = useState(entry);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
    >
      <p className="muted">
        {formatDate(entry.date, { weekday: 'long', day: 'numeric', month: 'long' })} · כאן אפשר
        לערוך את כל הדיווח ולהזין כמויות מדויקות. בסיום לחצי על שמירה.
      </p>
      <div className="checkin-habits">
        {HABITS.map((h) => (
          <label className="check-label" key={h.key}>
            <input
              type="checkbox"
              checked={draft[h.key]}
              onChange={(e) => setDraft({ ...draft, [h.key]: e.target.checked })}
            />
            {h.title}
          </label>
        ))}
      </div>
      <div className="form-grid">
        <label>
          כוסות מים · יעד {me.water_goal}
          <input
            type="number"
            min="0"
            max="40"
            step="1"
            inputMode="numeric"
            required
            value={draft.water}
            onChange={(e) => setDraft({ ...draft, water: Number(e.target.value) })}
          />
        </label>
        <label>
          דקות הליכה · יעד {me.walk_goal}
          <input
            type="number"
            min="0"
            max="600"
            step="1"
            inputMode="numeric"
            required
            value={draft.walk}
            onChange={(e) => setDraft({ ...draft, walk: Number(e.target.value) })}
          />
        </label>
      </div>
      <label>
        איך האנרגיה?
        <select
          value={draft.energy ?? ''}
          onChange={(e) =>
            setDraft({ ...draft, energy: e.target.value ? Number(e.target.value) : null })
          }
        >
          <option value="">בוחרת אחר כך</option>
          {energyLabels.map((l, i) => (
            <option key={l} value={i + 1}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label>
        פתק יומי · לא חובה
        <textarea
          maxLength={500}
          rows={3}
          value={draft.note}
          placeholder="מה עשה לך טוב היום?"
          onChange={(e) => setDraft({ ...draft, note: e.target.value })}
        />
        <small className="muted">הפתק משותף לשתיכן.</small>
      </label>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <button className="primary full" disabled={busy}>
        {busy ? 'שומר…' : 'שמירת הדיווח'}
        <Check size={18} />
      </button>
    </form>
  );
}
