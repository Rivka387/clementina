import { Check, Heart, Minus, Plus, UsersRound } from 'lucide-react';
import type { Data, Member } from '../../domain';
import { addDays, entryFor, score, streak } from '../../domain';
import { formatDate, energyLabels } from '../../lib/presentation';
import Ring from '../../components/Ring';

export default function Together({
  data,
  me,
  today,
  onCheer,
  onInvite,
}: {
  data: Data;
  me: Member;
  today: string;
  onCheer: () => void;
  onInvite: () => void;
}) {
  const dates = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const sharedDays = dates.filter(
    (d) =>
      data.members.length === 2 &&
      data.members.every((m) => score(entryFor(data, m.user_id, d), m) > 0),
  ).length;
  return (
    <div className="together-page">
      <section className="together-hero">
        <div>
          <span className="eyebrow">המרחב המשותף</span>
          <h2>{data.members.length === 2 ? 'ההתקדמות שלכן, ביחד.' : 'אפשר גם ביחד.'}</h2>
          <p>
            {data.members.length === 2
              ? `${sharedDays} ימים פעילים לשתיכן בשבוע האחרון.`
              : 'המעקב שלך כבר עובד. שותפה יכולה להצטרף מתי שתרצי.'}
          </p>
          <button className="outline-button" onClick={onInvite}>
            <UsersRound size={18} /> הזמנת שותפה
          </button>
        </div>
        <span className="together-symbol">
          <UsersRound size={52} />
        </span>
      </section>
      <div className="duo-cards">
        {data.members.map((m) => {
          const e = entryFor(data, m.user_id, today);
          return (
            <section key={m.user_id} className="panel">
              <div className="partner-summary">
                <span
                  className={
                    'avatar avatar-large ' + (m.user_id === me.user_id ? 'peach' : 'green')
                  }
                >
                  {m.name.slice(0, 1)}
                </span>
                <div>
                  <h2>
                    {m.name}
                    {m.user_id === me.user_id ? ' · זאת אני' : ''}
                  </h2>
                  <p>{streak(data, m, today)} ימים פעילים ברצף</p>
                </div>
                <Ring value={score(e, m)} />
              </div>
              <div className="duo-week">
                {dates.map((d) => (
                  <span
                    key={d}
                    title={`${formatDate(d)}: ${score(entryFor(data, m.user_id, d), m)} מתוך 6`}
                  >
                    <small>{formatDate(d, { weekday: 'short' })}</small>
                    <span
                      className={
                        score(entryFor(data, m.user_id, d), m) > 0 ? 'day-done' : 'day-empty'
                      }
                    >
                      {score(entryFor(data, m.user_id, d), m) > 0 ? (
                        <Check size={16} />
                      ) : (
                        <Minus size={14} />
                      )}
                    </span>
                  </span>
                ))}
              </div>
              {e.note && <p className="member-note">״{e.note}״</p>}
              <p className="muted">
                אנרגיה היום: {e.energy ? energyLabels[e.energy - 1] : 'עוד לא דווחה'}
              </p>
              {m.user_id !== me.user_id &&
                data.weights
                  .filter((w) => w.user_id === m.user_id && w.shared)
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 1)
                  .map((w) => (
                    <p key={w.date} className="muted">
                      מדידה שבחרה לשתף: {w.kg} ק״ג · {formatDate(w.date)}
                    </p>
                  ))}
            </section>
          );
        })}
      </div>
      <section className="panel notes-board">
        <div className="section-heading">
          <div>
            <h2>הודעות</h2>
            <p>ההודעות שלכן במקום אחד.</p>
          </div>
          <button className="primary" onClick={onCheer}>
            <Plus size={17} /> הודעה חדשה
          </button>
        </div>
        <div className="notes-grid">
          {[...data.cheers]
            .sort((a, b) => b.created_at.localeCompare(a.created_at))
            .map((c, i) => (
              <article key={c.id} className={'note note-' + (i % 3)}>
                <Heart size={19} />
                <p>{c.message}</p>
                <div>
                  <strong>
                    {data.members.find((m) => m.user_id === c.user_id)?.name ?? 'השותפה'}
                  </strong>
                  <small>
                    {new Intl.DateTimeFormat('he-IL', {
                      day: 'numeric',
                      month: 'short',
                      timeZone: 'Asia/Jerusalem',
                    }).format(new Date(c.created_at))}
                  </small>
                </div>
              </article>
            ))}
          {data.cheers.length === 0 && (
            <div className="empty">
              <Heart />
              <p>עוד אין הודעות.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
