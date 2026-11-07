import { useState } from 'react';
import { Footprints, Heart, Leaf, Plus, ShieldCheck, Smile, Sprout, Sun } from 'lucide-react';
import type { Data, Member } from '../../domain';
import { addDays, entryFor, score } from '../../domain';
import { formatDate } from '../../lib/presentation';

export default function Progress({
  data,
  me,
  today,
  onWeight,
}: {
  data: Data;
  me: Member;
  today: string;
  onWeight: () => void;
}) {
  const [range, setRange] = useState(7);
  const dates = Array.from({ length: range }, (_, i) => addDays(today, i - range + 1));
  const weights = data.weights
    .filter((w) => w.user_id === me.user_id)
    .sort((a, b) => a.date.localeCompare(b.date));
  const min = Math.min(...weights.map((w) => w.kg)) - 1,
    max = Math.max(...weights.map((w) => w.kg)) + 1;
  const last = weights.at(-1),
    first = weights[0],
    change = last && first ? Math.round((last.kg - first.kg) * 10) / 10 : 0;
  const recorded = data.entries.filter((e) => e.user_id === me.user_id && dates.includes(e.date));
  const energy = recorded.filter((e) => e.energy !== null);
  const average = energy.length
    ? (energy.reduce((s, e) => s + e.energy!, 0) / energy.length).toFixed(1)
    : '—';
  return (
    <div className="progress-page">
      <div className="progress-summary">
        <section className="panel">
          <span className="stat-icon green">
            <Sprout />
          </span>
          <p>ימים פעילים</p>
          <h2>
            {recorded.filter((e) => score(e, me) > 0).length}
            <small> מתוך {range}</small>
          </h2>
        </section>
        <section className="panel">
          <span className="stat-icon peach">
            <Footprints />
          </span>
          <p>דקות הליכה</p>
          <h2>
            {recorded.reduce((s, e) => s + e.walk, 0)}
            <small> בתקופה</small>
          </h2>
        </section>
        <section className="panel">
          <span className="stat-icon pink">
            <Sun />
          </span>
          <p>אנרגיה ממוצעת</p>
          <h2>
            {average}
            <small> מתוך 5</small>
          </h2>
        </section>
      </div>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>ההרגלים לאורך זמן</h2>
            <p>הרגלים ויעדים שהושלמו בכל יום · מתוך 6</p>
          </div>
          <select
            aria-label="תקופת התצוגה"
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
          >
            <option value={7}>השבוע האחרון</option>
            <option value={14}>שבועיים אחרונים</option>
            <option value={28}>ארבעה שבועות</option>
          </select>
        </div>
        <div
          className={'bar-chart ' + (range > 14 ? 'dense' : '')}
          role="img"
          aria-label="מספר הסעיפים היומי מתוך שישה"
        >
          {dates.map((d) => {
            const n = score(entryFor(data, me.user_id, d), me);
            return (
              <div className="chart-column" key={d} title={`${formatDate(d)}: ${n} מתוך 6`}>
                <span>{n}</span>
                <div className="bar-space">
                  <div
                    className={d === today ? 'bar current' : 'bar'}
                    style={{ height: `${Math.max(3, (n / 6) * 100)}%` }}
                  />
                </div>
                <small>
                  {range > 14
                    ? Number(d.slice(-2))
                    : formatDate(d, { day: 'numeric', month: 'numeric' })}
                </small>
              </div>
            );
          })}
        </div>
        <p className="gentle-footnote">
          <Heart size={16} /> ימים ללא דיווח מוצגים כ־0.
        </p>
      </section>
      <div className="progress-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>מעקב משקל</h2>
              <p>
                <ShieldCheck size={14} /> המדידות האישיות שלך
              </p>
            </div>
            <button className="icon-button" onClick={onWeight} aria-label="הוספת מדידה">
              <Plus size={20} />
            </button>
          </div>
          {weights.length ? (
            <>
              <div className="weight-numbers">
                <span>
                  <b>{last?.kg}</b> ק״ג<small>מדידה אחרונה · {formatDate(last!.date)}</small>
                </span>
                <span className="weight-change">
                  {change > 0 ? '+' : ''}
                  {change} ק״ג<small>מהמדידה הראשונה</small>
                </span>
              </div>
              {weights.length > 1 ? (
                <svg
                  className="weight-chart"
                  viewBox="0 0 500 160"
                  role="img"
                  aria-label="מגמת מדידות המשקל. הערכים המדויקים בטבלה שמתחת."
                >
                  <path
                    d="M20 35H480 M20 80H480 M20 125H480"
                    stroke="var(--border)"
                    strokeDasharray="4 5"
                  />
                  <polyline
                    points={weights
                      .map(
                        (w, i) =>
                          `${20 + (i / (weights.length - 1)) * 460},${130 - ((w.kg - min) / (max - min)) * 110}`,
                      )
                      .join(' ')}
                    fill="none"
                    stroke="var(--green)"
                    strokeWidth="3"
                  />
                  {weights.map((w, i) => (
                    <circle
                      key={w.date}
                      cx={20 + (i / (weights.length - 1)) * 460}
                      cy={130 - ((w.kg - min) / (max - min)) * 110}
                      r="5"
                      fill="var(--green)"
                    >
                      <title>
                        {formatDate(w.date)}: {w.kg} ק״ג
                      </title>
                    </circle>
                  ))}
                </svg>
              ) : (
                <p>עוד מדידה אחת ונוכל לראות מגמה.</p>
              )}
              <details>
                <summary>כל המדידות ({weights.length})</summary>
                <table>
                  <thead>
                    <tr>
                      <th>תאריך</th>
                      <th>משקל</th>
                      <th>שיתוף</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...weights].reverse().map((w) => (
                      <tr key={w.date}>
                        <td>{formatDate(w.date)}</td>
                        <td>{w.kg} ק״ג</td>
                        <td>{w.shared ? 'משותפת' : 'רק שלי'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </>
          ) : (
            <div className="empty">
              <Leaf />
              <p>
                אין עדיין מדידות.
                <br />
                אפשר להוסיף מדידה כשתרצי.
              </p>
              <button className="outline-button" onClick={onWeight}>
                הוספת מדידה
              </button>
            </div>
          )}
        </section>
        <section className="panel journal">
          <h2>ההערות שלי</h2>
          <p className="muted">הערות מהדיווחים האחרונים</p>
          {data.entries
            .filter((e) => e.user_id === me.user_id && e.note)
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 8)
            .map((e) => (
              <article key={e.date}>
                <small>{formatDate(e.date)}</small>
                <p>{e.note}</p>
              </article>
            ))}
          {!data.entries.some((e) => e.user_id === me.user_id && e.note) && (
            <div className="empty">
              <Smile />
              <p>
                עוד אין הערות.
                <br />
                הוסיפי אותם דרך ״עדכון היום״.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
