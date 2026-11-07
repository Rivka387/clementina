import { useState } from 'react';
import type { FormEvent } from 'react';
import type { FoodPlan } from '../../domain';

const planFields: { key: 'breakfast' | 'lunch' | 'dinner' | 'snacks'; label: string }[] = [
  { key: 'breakfast', label: 'בוקר' },
  { key: 'lunch', label: 'צהריים' },
  { key: 'dinner', label: 'ערב' },
  { key: 'snacks', label: 'נשנושים' },
];

export default function FoodPlanCard({
  plan,
  userId,
  ready,
  busy,
  error,
  onSave,
}: {
  plan: FoodPlan | undefined;
  userId: string;
  ready: boolean;
  busy: boolean;
  error: string;
  onSave: (plan: FoodPlan) => Promise<boolean>;
}) {
  const blank: FoodPlan = {
    user_id: userId,
    breakfast: '',
    lunch: '',
    dinner: '',
    snacks: '',
    guidance: '',
  };
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<FoodPlan>(plan ?? blank);
  if (!ready) return null;
  const hasPlan =
    !!plan && (planFields.some((field) => plan[field.key].trim()) || !!plan.guidance.trim());
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (await onSave(draft)) setEditing(false);
  }
  return (
    <section className="panel food-plan" aria-labelledby="food-plan-title">
      <div className="section-heading">
        <div>
          <h2 id="food-plan-title">תכנון הארוחות שלי</h2>
          <p>רעיונות לארוחות והכנות מראש.</p>
        </div>
        <button
          className="outline-button"
          disabled={busy}
          onClick={() => {
            setDraft(plan ?? blank);
            setEditing(!editing);
          }}
        >
          {editing ? 'סגירה' : hasPlan ? 'עריכת התכנון' : 'כתיבת התכנון'}
        </button>
      </div>
      {editing ? (
        <form className="food-plan-form" onSubmit={(event) => void submit(event)}>
          {planFields.map((field) => (
            <label key={field.key}>
              {field.label}
              <textarea
                rows={2}
                maxLength={500}
                value={draft[field.key]}
                onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
                placeholder="מה מתאים לך לארוחה הזאת?"
              />
            </label>
          ))}
          <label>
            דברים שחשוב לי לזכור
            <textarea
              rows={2}
              maxLength={800}
              value={draft.guidance}
              onChange={(event) => setDraft({ ...draft, guidance: event.target.value })}
              placeholder="למשל: מה להכין מראש או מה עוזר לי להתמיד"
            />
          </label>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          <button className="primary" disabled={busy}>
            {busy ? 'שומר…' : 'שמירת התכנון'}
          </button>
        </form>
      ) : hasPlan ? (
        <div className="food-plan-grid">
          {planFields
            .filter((field) => plan?.[field.key].trim())
            .map((field) => (
              <div key={field.key}>
                <strong>{field.label}</strong>
                <p>{plan![field.key]}</p>
              </div>
            ))}
          {plan?.guidance && (
            <div className="food-plan-guidance">
              <strong>כדאי לזכור</strong>
              <p>{plan.guidance}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="food-plan-empty">עוד אין תכנון. אפשר להוסיף רעיונות לבוקר, לצהריים ולערב.</p>
      )}
    </section>
  );
}
