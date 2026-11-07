import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { localDay } from '../../domain';
import { supabase } from '../../data';

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [join, setJoin] = useState(false),
    [name, setName] = useState(''),
    [code, setCode] = useState(''),
    [weeks, setWeeks] = useState(12),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { error } = await supabase!.rpc(
        join ? 'join_duo' : 'create_duo',
        join
          ? { p_code: code.trim(), p_name: name.trim() }
          : { p_name: name.trim(), p_weeks: weeks, p_start: localDay() },
      );
      if (error) throw error;
      onDone();
    } catch {
      setError(
        join
          ? 'לא הצלחנו להצטרף. בדקי שהקוד נכון ושהאתגר עדיין פנוי.'
          : 'לא הצלחנו ליצור את האתגר. בדקי שהוגדרה סכמת הנתונים ב־Supabase.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="onboarding">
      <img
        className="onboarding-logo"
        src="/clementina.svg"
        width="52"
        height="52"
        alt="קלמנטינה"
      />
      <form className="panel auth-form" onSubmit={submit}>
        <h1>מתחילים כאן</h1>
        <p>הגדירי את המעקב שלך. אפשר להזמין שותפה גם בהמשך.</p>
        <label>
          איך לקרוא לך?
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={30} />
        </label>
        <div className="segmented">
          <button type="button" aria-pressed={!join} onClick={() => setJoin(false)}>
            אתגר חדש
          </button>
          <button type="button" aria-pressed={join} onClick={() => setJoin(true)}>
            יש לי קוד הזמנה
          </button>
        </div>
        {join ? (
          <label>
            קוד ההזמנה
            <input dir="ltr" required value={code} onChange={(e) => setCode(e.target.value)} />
          </label>
        ) : (
          <label>
            משך האתגר
            <select value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
              {[8, 12, 16, 24].map((n) => (
                <option key={n} value={n}>
                  {n} שבועות
                </option>
              ))}
            </select>
          </label>
        )}
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {busy ? 'רגע…' : join ? 'הצטרפות לאתגר' : 'יצירת אתגר'}
          <ArrowLeft size={18} />
        </button>
      </form>
    </div>
  );
}
