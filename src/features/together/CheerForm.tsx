import { useState } from 'react';
import { Send } from 'lucide-react';

export default function CheerForm({
  busy,
  error,
  onSend,
}: {
  busy: boolean;
  error: string;
  onSend: (s: string) => void;
}) {
  const [message, setMessage] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (message.trim()) onSend(message.trim());
      }}
    >
      <p className="muted">הודעה שתופיע במרחב המשותף.</p>
      <div className="cheer-suggestions">
        {['גאה בך על כל צעד קטן', 'סיבוב קטן ביחד היום?', 'גם ביום פחות קל, אני איתך'].map((s) => (
          <button className="soft-button" type="button" key={s} onClick={() => setMessage(s)}>
            {s}
          </button>
        ))}
      </div>
      <label>
        הפתק שלך
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={280}
          rows={4}
          placeholder="רק רציתי להגיד לך…"
        />
      </label>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <button className="primary full" disabled={busy || !message.trim()}>
        <Send size={17} />
        {busy ? 'שולחים…' : 'שליחת הודעה'}
      </button>
    </form>
  );
}
