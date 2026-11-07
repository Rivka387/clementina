import { useState } from 'react';
import type { Weight } from '../../domain';

export default function WeightForm({
  userId,
  today,
  busy,
  error,
  weights,
  onSave,
}: {
  userId: string;
  today: string;
  busy: boolean;
  error: string;
  weights: Weight[];
  onSave: (w: Weight) => void;
}) {
  const [date, setDate] = useState(today),
    [kg, setKg] = useState(''),
    [shared, setShared] = useState(false);
  const existing = weights.find((w) => w.user_id === userId && w.date === date);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (Number(kg) >= 20 && Number(kg) <= 400)
          onSave({ user_id: userId, date, kg: Number(kg), shared });
      }}
    >
      <p className="muted">מדידה היא רק חלק מהתמונה. כברירת מחדל, היא נשארת רק שלך.</p>
      <div className="form-grid">
        <label>
          תאריך
          <input
            type="date"
            required
            max={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label>
          משקל בק״ג
          <input
            type="number"
            required
            min="20"
            max="400"
            step="0.1"
            inputMode="decimal"
            placeholder={existing ? String(existing.kg) : 'למשל 80.5'}
            value={kg}
            onChange={(e) => setKg(e.target.value)}
          />
        </label>
      </div>
      {existing && (
        <p className="muted">קיימת מדידה של {existing.kg} ק״ג בתאריך הזה. שמירה תעדכן אותה.</p>
      )}
      <label className="check-label">
        <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} />
        לשתף את המדידה עם השותפה
      </label>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <button className="primary full" disabled={busy}>
        {busy ? 'שומר…' : 'שמירת המדידה'}
      </button>
    </form>
  );
}
