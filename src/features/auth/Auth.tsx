import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  TrendingUp,
  UsersRound,
  Utensils,
} from 'lucide-react';
import { supabase } from '../../data';

export default function Auth({ notify }: { notify: (s: string) => void }) {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [showPassword, setShowPassword] = useState(false),
    [signup, setSignup] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = signup
        ? await supabase!.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin },
          })
        : await supabase!.auth.signInWithPassword({ email, password });
      if (r.error) throw r.error;
      if (signup && !r.data.session)
        notify('שלחנו קישור לאישור כתובת המייל. אחרי האישור אפשר להתחבר.');
    } catch {
      setError('לא הצלחנו להתחבר. בדקי את הפרטים, אישור המייל והחיבור לאינטרנט.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="welcome">
      <div className="welcome-art">
        <div className="welcome-brand">
          <img src="/clementina.svg" width="44" height="44" alt="" />
          <strong>קלמנטינה</strong>
        </div>
        <span className="welcome-tag">כל צעד קטן נחשב.</span>
        <h1>
          דברים טובים <br />
          <em>מבשילים ביחד.</em>
        </h1>
        <p>מקום אחד לדברים שעושים לך טוב.</p>
        <div className="welcome-features">
          <span>
            <Utensils size={20} /> יומן אכילה אישי
          </span>
          <span>
            <TrendingUp size={20} /> התקדמות לאורך זמן
          </span>
          <span>
            <UsersRound size={20} /> לבד או ביחד
          </span>
        </div>
      </div>
      <form className="panel auth-form" onSubmit={submit}>
        <img src="/clementina.svg" width="48" height="48" alt="" />
        <h2>{signup ? 'יצירת חשבון' : 'איזה כיף שחזרת'}</h2>
        <p className="muted">המעקב האישי שלך, עם אפשרות לשותפה.</p>
        <label>
          כתובת מייל
          <input
            type="email"
            autoComplete="email"
            required
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <div className="password-control">
          <label htmlFor="auth-password">סיסמה</label>
          <div className="password-field">
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              minLength={8}
              required
              autoComplete={signup ? 'new-password' : 'current-password'}
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? 'הסתרת הסיסמה' : 'הצגת הסיסמה'}
              aria-pressed={showPassword}
              aria-controls="auth-password"
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? (
                <EyeOff size={18} aria-hidden="true" />
              ) : (
                <Eye size={18} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {busy ? <LoaderCircle className="spin" /> : null}
          {signup ? 'יצירת חשבון' : 'התחברות'}
          <ArrowLeft size={18} />
        </button>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setSignup(!signup);
            setShowPassword(false);
            setError('');
          }}
        >
          {signup ? 'כבר יש לי חשבון' : 'אין לך חשבון? הרשמה'}
        </button>
        <a className="outline-button full" href="/?demo=1#today">
          לנסות בלי להירשם
        </a>
      </form>
    </div>
  );
}
