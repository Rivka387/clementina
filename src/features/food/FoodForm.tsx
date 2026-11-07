import { useState } from 'react';
import type { FormEvent } from 'react';
import { Check } from 'lucide-react';
import type { FoodEntry, FoodKind } from '../../domain';
import { kinds, localTime, kindAt } from './helpers';

export default function FoodForm({
  entry,
  userId,
  date,
  busy,
  error,
  onSave,
  onCancel,
}: {
  entry: FoodEntry | null;
  userId: string;
  date: string;
  busy: boolean;
  error: string;
  onSave: (entry: FoodEntry) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [time, setTime] = useState(entry?.time ?? localTime());
  const [kind, setKind] = useState<FoodKind>(entry?.kind ?? kindAt(time));
  const [food, setFood] = useState(entry?.food ?? '');
  const [amount, setAmount] = useState(entry?.amount ?? '');
  const [calories, setCalories] = useState(entry?.calories == null ? '' : String(entry.calories));
  const [note, setNote] = useState(entry?.note ?? '');
  async function submit(event: FormEvent) {
    event.preventDefault();
    const saved = await onSave({
      id: entry?.id ?? crypto.randomUUID(),
      user_id: userId,
      date,
      time,
      kind,
      food: food.trim(),
      amount: amount.trim(),
      note: note.trim(),
      calories: calories.trim() === '' ? null : Number(calories),
    });
    if (saved) onCancel();
  }
  return (
    <form className="food-form" onSubmit={(event) => void submit(event)}>
      <h3>{entry ? 'עריכת רישום' : 'מה אכלת או שתית?'}</h3>
      <div className="food-form-row">
        <label>
          סוג
          <select value={kind} onChange={(event) => setKind(event.target.value as FoodKind)}>
            {kinds.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          שעה
          <input
            type="time"
            required
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
        </label>
      </div>
      <label>
        מה היה?
        <input
          required
          maxLength={160}
          value={food}
          onChange={(event) => setFood(event.target.value)}
          placeholder="לדוגמה: אורז, עדשים וסלט"
        />
      </label>
      <label>
        כמה (לא חובה)
        <input
          maxLength={80}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="למשל: צלחת אחת או 2 פרוסות"
        />
      </label>
      <label>
        קלוריות (לא חובה)
        <input
          type="number"
          inputMode="numeric"
          min="0"
          max="10000"
          step="1"
          value={calories}
          onChange={(event) => setCalories(event.target.value)}
          placeholder="אם ידוע לך"
        />
      </label>
      <label>
        הערה, אם תרצי
        <textarea
          maxLength={180}
          rows={2}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="למשל: הייתי רעבה, אכלתי מחוץ לבית"
        />
      </label>
      <p className="food-form-help">מים רגילים מעדכנים בכרטיס ״מים״. כאן רושמים משקאות אחרים.</p>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <div className="food-form-actions">
        <button className="primary" disabled={busy || !food.trim()}>
          <Check size={17} />
          {busy ? 'שומר…' : 'שמירת הרישום'}
        </button>
        <button className="outline-button" type="button" disabled={busy} onClick={onCancel}>
          ביטול
        </button>
      </div>
    </form>
  );
}
