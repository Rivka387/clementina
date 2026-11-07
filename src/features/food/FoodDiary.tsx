import { useEffect, useRef, useState } from 'react';
import { Plus, Utensils, X, Clock3, Pencil, Trash2 } from 'lucide-react';
import type { FoodEntry } from '../../domain';
import FoodForm from './FoodForm';
import { kindLabel, foodDetails } from './helpers';

export default function FoodDiary({
  entries,
  userId,
  date,
  ready,
  busy,
  error,
  onSave,
  onDelete,
}: {
  entries: FoodEntry[];
  userId: string;
  date: string;
  ready: boolean;
  busy: boolean;
  error: string;
  onSave: (entry: FoodEntry) => Promise<boolean>;
  onDelete: (entry: FoodEntry) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ open: boolean; entry: FoodEntry | null }>({
    open: false,
    entry: null,
  });
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const own = entries
    .filter((entry) => entry.user_id === userId && entry.date === date)
    .sort((a, b) => a.time.localeCompare(b.time));
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
      triggerRef.current?.focus();
    };
  }, [open]);
  function openDiary(add = false) {
    setConfirmId(null);
    setForm({ open: add, entry: null });
    setOpen(true);
  }
  return (
    <section className="panel food-diary" aria-labelledby="food-diary-title">
      <div className="food-diary-peek">
        <span className="food-diary-symbol" aria-hidden="true">
          <Utensils size={22} />
        </span>
        <div className="food-diary-copy">
          <h2 id="food-diary-title">יומן האכילה</h2>
          <p>
            {!ready
              ? 'היומן עדיין לא הופעל בחשבון הזה.'
              : own.length
                ? `${own.length} רישומים ביום הזה · ${own
                    .slice(-2)
                    .map((entry) => entry.food)
                    .join(' · ')}`
                : 'עוד אין ארוחות ביום הזה. נתחיל?'}
          </p>
        </div>
        {ready && (
          <button
            ref={triggerRef}
            className="food-diary-open"
            type="button"
            onClick={() => openDiary(own.length === 0)}
            aria-haspopup="dialog"
          >
            <span>{own.length ? 'פתיחת היומן' : 'רישום ארוחה'}</span>
            <Plus size={18} />
          </button>
        )}
      </div>
      {ready && own.length > 0 && (
        <ol className="food-preview" aria-label="הארוחות האחרונות">
          {own.slice(-3).map((item) => (
            <li key={item.id}>
              <span className={'meal-symbol meal-' + item.kind}>
                <Utensils size={17} />
              </span>
              <div>
                <strong>{item.food}</strong>
                <small>
                  {kindLabel(item.kind)}
                  {item.amount ? ' · ' + item.amount : ''}
                </small>
              </div>
              <time>{item.time}</time>
            </li>
          ))}
        </ol>
      )}
      <div className="food-diary-footer">
        <span>יומן אישי</span>
        <span>כמות וקלוריות רק אם תרצי</span>
      </div>
      {open && (
        <dialog
          ref={dialogRef}
          className="food-drawer"
          dir="rtl"
          aria-labelledby="food-drawer-title"
          onCancel={(event) => {
            event.preventDefault();
            setOpen(false);
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="food-drawer-inner">
            <header className="food-drawer-head">
              <div>
                <span className="food-drawer-kicker">היומן האישי שלי</span>
                <h2 id="food-drawer-title">יומן האכילה</h2>
                <p>רשמי מה אכלת ומתי. כמות וקלוריות רק אם תרצי.</p>
              </div>
              <button
                className="food-drawer-close"
                type="button"
                aria-label="סגירת יומן האכילה"
                onClick={() => setOpen(false)}
              >
                <X size={21} />
              </button>
            </header>
            <div className="food-drawer-body">
              <div className="food-drawer-toolbar">
                <strong>
                  {own.length ? `${own.length} רישומים ביום הזה` : 'עוד אין רישומים ביום הזה'}
                </strong>
                <button
                  className="primary"
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setConfirmId(null);
                    setForm({ open: true, entry: null });
                  }}
                >
                  <Plus size={18} /> הוספת ארוחה או נשנוש
                </button>
              </div>
              {form.open && (
                <FoodForm
                  key={`${date}-${form.entry?.id ?? 'new'}`}
                  entry={form.entry}
                  userId={userId}
                  date={date}
                  busy={busy}
                  error={error}
                  onSave={onSave}
                  onCancel={() => setForm({ open: false, entry: null })}
                />
              )}
              {own.length === 0 ? (
                <p className="food-empty">עוד אין ארוחות ביום הזה. הוסיפי את הארוחה הראשונה.</p>
              ) : (
                <ol className="food-list">
                  {own.map((entry) => (
                    <li key={entry.id}>
                      <div className="food-time">
                        <Clock3 size={15} />
                        <time dateTime={`${entry.date}T${entry.time}`}>{entry.time}</time>
                      </div>
                      <div className="food-description">
                        <strong>{kindLabel(entry.kind)}</strong>
                        <p>{entry.food}</p>
                        {foodDetails(entry) && <small>{foodDetails(entry)}</small>}
                      </div>
                      <div className="food-item-actions">
                        <button
                          className="icon-button"
                          disabled={busy}
                          aria-label={`עריכת ${kindLabel(entry.kind)} בשעה ${entry.time}`}
                          onClick={() => {
                            setConfirmId(null);
                            setForm({ open: true, entry });
                          }}
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          className="icon-button"
                          disabled={busy}
                          aria-label={`מחיקת ${kindLabel(entry.kind)} בשעה ${entry.time}`}
                          onClick={() => setConfirmId(entry.id)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                      {confirmId === entry.id && (
                        <div className="food-confirm">
                          <span>למחוק את הרישום הזה?</span>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void onDelete(entry).then((ok) => {
                                if (ok) setConfirmId(null);
                              })
                            }
                          >
                            כן, למחוק
                          </button>
                          <button type="button" disabled={busy} onClick={() => setConfirmId(null)}>
                            ביטול
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </dialog>
      )}
    </section>
  );
}
