import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Copy, LoaderCircle, Plus, Sprout, Sun, X } from 'lucide-react';
import type { Data, Entry, FoodEntry, FoodPlan, Member, Weight } from './domain';
import {
  entryFor,
  localDay,
  removeFoodEntry,
  upsertEntry,
  upsertFoodEntry,
  upsertFoodPlan,
  upsertWeight,
  validFoodEntry,
  validFoodPlan,
} from './domain';
import {
  deleteCloudFoodEntry,
  fetchCloud,
  loadDemo,
  persistDemo,
  saveCloudEntry,
  saveCloudFoodEntry,
  saveCloudFoodPlan,
  saveCloudMember,
  saveCloudWeight,
  supabase,
} from './data';
import { formatDate } from './lib/presentation';
import { getTab } from './navigation';
import type { Tab } from './navigation';
import Dialog from './components/Dialog';
import Auth from './features/auth/Auth';
import Onboarding from './features/auth/Onboarding';
import WeightForm from './features/progress/WeightForm';
import Progress from './features/progress/Progress';
import EnergyTrend from './features/progress/EnergyTrend';
import Together from './features/together/Together';
import CheerForm from './features/together/CheerForm';
import Preferences from './features/settings/Preferences';
import FoodWeek from './features/food/FoodWeek';
import AppLayout from './components/AppLayout';
import TodayPage from './features/daily/TodayPage';
import CheckinForm from './features/daily/CheckinForm';

export default function App() {
  const isDemo = !supabase || new URLSearchParams(window.location.search).has('demo');
  const [data, setData] = useState<Data | null>(null),
    [userId, setUserId] = useState(isDemo ? 'me' : ''),
    [ready, setReady] = useState(isDemo),
    [loading, setLoading] = useState(true),
    [fatal, setFatal] = useState(''),
    [refresh, setRefresh] = useState(0);
  const [tab, setTab] = useState<Tab>(getTab),
    [today, setToday] = useState(localDay),
    [date, setDate] = useState(localDay),
    [modal, setModal] = useState<'checkin' | 'weight' | 'cheer' | 'invite' | null>(null),
    [toast, setToast] = useState(''),
    [saveError, setSaveError] = useState(''),
    [busy, setBusy] = useState(false),
    [online, setOnline] = useState(navigator.onLine);
  const saving = useRef(false),
    requestVersion = useRef(0),
    lastFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const h = () => setTab(getTab());
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  useEffect(() => {
    const h = () => setOnline(navigator.onLine);
    window.addEventListener('online', h);
    window.addEventListener('offline', h);
    const id = setInterval(() => setToday(localDay()), 30000);
    return () => {
      window.removeEventListener('online', h);
      window.removeEventListener('offline', h);
      clearInterval(id);
    };
  }, []);
  useEffect(() => {
    if (isDemo) return;
    supabase!.auth.getSession().then(({ data, error }) => {
      if (error) setFatal('לא הצלחנו לקרוא את ההתחברות. נסי לרענן.');
      setUserId(data.session?.user.id ?? '');
      setReady(true);
    });
    const {
      data: { subscription },
    } = supabase!.auth.onAuthStateChange((_e, s) => {
      setUserId(s?.user.id ?? '');
      setReady(true);
    });
    return () => subscription.unsubscribe();
  }, [isDemo]);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    requestVersion.current++;
    setLoading(true);
    setFatal('');
    setData(null);
    if (isDemo) {
      try {
        setData(loadDemo());
      } catch (e) {
        setFatal(e instanceof Error ? e.message : 'לא הצלחנו לקרוא את הנתונים השמורים.');
      }
      setLoading(false);
      return;
    }
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchCloud(userId)
      .then((d) => {
        if (active) setData(d);
      })
      .catch(() => {
        if (active) setFatal('הנתונים לא נטענו. בדקי את החיבור ונסי שוב.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ready, userId, isDemo, refresh]);
  useEffect(() => {
    if (isDemo || !userId || !data) return;
    let active = true;
    const reload = async () => {
      if (document.hidden || saving.current) return;
      const v = requestVersion.current;
      try {
        const d = await fetchCloud(userId);
        if (active && d && v === requestVersion.current && !saving.current) setData(d);
      } catch {
        if (active) setSaveError('העדכון מהענן לא הגיע. הנתונים המוצגים הם מהטעינה האחרונה.');
      }
    };
    const id = setInterval(reload, 20000);
    window.addEventListener('focus', reload);
    return () => {
      active = false;
      clearInterval(id);
      window.removeEventListener('focus', reload);
    };
  }, [isDemo, userId, !!data]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  function openModal(m: typeof modal) {
    lastFocus.current = document.activeElement as HTMLElement;
    setModal(m);
    setSaveError('');
  }
  function closeModal() {
    if (saving.current) return;
    setModal(null);
    requestAnimationFrame(() => lastFocus.current?.focus());
  }
  async function commit(next: Data, remote: () => Promise<void>, message = 'השינוי נשמר.') {
    if (saving.current) return false;
    saving.current = true;
    requestVersion.current++;
    setBusy(true);
    setSaveError('');
    try {
      if (isDemo) persistDemo(next);
      else {
        if (!navigator.onLine) throw new Error('offline');
        await remote();
      }
      setData(next);
      setToast(message);
      return true;
    } catch (error) {
      setSaveError(
        isDemo
          ? 'השמירה במכשיר לא הצליחה. ייתכן שהאחסון מלא או חסום; השינוי לא נשמר.'
          : error instanceof Error && error.message === 'missing-calories-migration'
            ? 'כדי לשמור קלוריות, הריצי ב־Supabase את המיגרציה 003_optional_calories.sql.'
            : error instanceof Error && error.message === 'missing-optional-amount-migration'
              ? 'כדי לשמור ארוחה ללא כמות, הריצי ב־Supabase את המיגרציה 004_optional_amount.sql.'
              : 'השינוי לא נשמר. בדקי את החיבור ונסי שוב.',
      );
      return false;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  async function updateEntry(entry: Entry) {
    if (!data || entry.user_id !== userId) return false;
    return commit(upsertEntry(data, entry), () => saveCloudEntry(entry));
  }
  async function updateFood(entry: FoodEntry) {
    if (!data || !data.food_log_ready || entry.user_id !== userId) return false;
    if (!validFoodEntry(entry)) {
      setSaveError('בדקי את פרטי הארוחה ונסי שוב.');
      return false;
    }
    return commit(
      upsertFoodEntry(data, entry),
      () => saveCloudFoodEntry(entry),
      'הרישום נשמר ביומן האכילה.',
    );
  }
  async function deleteFood(entry: FoodEntry) {
    if (
      !data ||
      entry.user_id !== userId ||
      !data.food_entries.some((item) => item.id === entry.id && item.user_id === userId)
    )
      return false;
    return commit(
      removeFoodEntry(data, entry.id),
      () => deleteCloudFoodEntry(entry.id, userId),
      'הרישום הוסר מיומן האכילה.',
    );
  }
  async function updateFoodPlan(plan: FoodPlan) {
    if (!data || !data.food_log_ready || plan.user_id !== userId) return false;
    if (!validFoodPlan(plan)) {
      setSaveError('בדקי את תכנון הארוחות ונסי שוב.');
      return false;
    }
    return commit(upsertFoodPlan(data, plan), () => saveCloudFoodPlan(plan), 'תכנון הארוחות נשמר.');
  }
  async function updateWeight(weight: Weight) {
    if (!data) return false;
    return commit(upsertWeight(data, weight), () => saveCloudWeight(weight), 'המדידה נשמרה.');
  }
  async function updateMember(member: Member) {
    if (!data) return;
    await commit(
      { ...data, members: data.members.map((m) => (m.user_id === member.user_id ? member : m)) },
      () => saveCloudMember(member),
      'ההגדרות נשמרו.',
    );
  }
  async function cheer(message: string) {
    if (!data) return false;
    const item = {
      id: crypto.randomUUID(),
      group_id: data.group.id,
      user_id: userId,
      message,
      created_at: new Date().toISOString(),
    };
    return commit(
      { ...data, cheers: [item, ...data.cheers] },
      async () => {
        const { error } = await supabase!.from('cheers').insert(item);
        if (error) throw error;
      },
      isDemo ? 'הפתק נוסף להדגמה במכשיר.' : 'ההודעה נשלחה.',
    );
  }
  const toastEl = toast ? (
    <div role="status" className="toast">
      <Check size={18} />
      {toast}
    </div>
  ) : null;
  if (!ready || loading)
    return (
      <div className="loading-screen">
        <img src="/clementina.svg" width="64" alt="" />
        <h2>טוענים את קלמנטינה…</h2>
        <LoaderCircle className="spin" />
      </div>
    );
  if (fatal)
    return (
      <div className="onboarding">
        <div className="panel">
          <h1>לא הצלחנו לטעון את הנתונים</h1>
          <p role="alert">{fatal}</p>
          <button className="primary" onClick={() => setRefresh((x) => x + 1)}>
            ננסה שוב
          </button>
        </div>
      </div>
    );
  if (!isDemo && !userId)
    return (
      <>
        {toastEl}
        <Auth notify={setToast} />
      </>
    );
  if (!data) return <Onboarding onDone={() => setRefresh((x) => x + 1)} />;
  const me = data.members.find((m) => m.user_id === userId);
  if (!me)
    return (
      <div className="onboarding">
        <p>לא נמצא פרופיל לחשבון הזה.</p>
      </div>
    );
  const partner = data.members.find((m) => m.user_id !== userId),
    entry = entryFor(data, userId, date);
  const go = (t: Tab) => {
    window.location.hash = t;
    setTab(t);
  };
  return (
    <>
      <AppLayout
        me={me}
        partner={partner}
        online={online}
        isDemo={isDemo}
        tab={tab}
        onNavigate={go}
      >
        {isDemo && (
          <div className="demo-banner">
            <Sprout size={16} />
            <span>
              <strong>מצב הדגמה</strong> · נתוני דוגמה, נשמרים רק בדפדפן הזה.
            </span>
            {supabase ? (
              <a href="/" className="text-button">
                לחשבון אמיתי <ArrowLeft size={14} />
              </a>
            ) : (
              <button onClick={() => go('settings')}>
                על ההדגמה <ArrowLeft size={14} />
              </button>
            )}
          </div>
        )}
        {saveError && (
          <div className="error-banner" role="alert">
            {saveError}
            <button
              className="icon-button"
              onClick={() => setSaveError('')}
              aria-label="סגירת הודעה"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="page-heading">
          <div>
            <p className="eyebrow">
              <Sun size={16} />{' '}
              {formatDate(tab === 'today' ? date : today, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
            <h1>
              {tab === 'today'
                ? 'היום שלי'
                : tab === 'progress'
                  ? 'ההתקדמות שלי'
                  : tab === 'together'
                    ? 'ביחד'
                    : 'הגדרות'}
            </h1>
            <p>
              {tab === 'today'
                ? 'ארוחות, תנועה והרגלים. הכל במקום אחד.'
                : tab === 'progress'
                  ? 'הנתונים שלך לאורך זמן.'
                  : tab === 'together'
                    ? 'מעקב משותף, כל אחת בקצב שלה.'
                    : 'הפרופיל, היעדים והחשבון שלך.'}
            </p>
          </div>
          {tab === 'today' && (
            <button className="primary" onClick={() => openModal('checkin')}>
              <Plus size={18} /> עדכון היום
            </button>
          )}
          {tab === 'progress' && (
            <button className="primary" onClick={() => openModal('weight')}>
              <Plus size={18} /> הוספת מדידה
            </button>
          )}
        </div>
        {tab === 'today' && (
          <TodayPage
            data={data}
            me={me}
            userId={userId}
            date={date}
            today={today}
            isDemo={isDemo}
            busy={busy}
            saveError={saveError}
            setDate={setDate}
            onUpdateEntry={updateEntry}
            onSaveFood={updateFood}
            onDeleteFood={deleteFood}
            onSavePlan={updateFoodPlan}
            onCheer={() => openModal('cheer')}
            onInvite={() => openModal('invite')}
            onTogether={() => go('together')}
          />
        )}
        {tab === 'progress' && (
          <>
            <Progress data={data} me={me} today={today} onWeight={() => openModal('weight')} />
            <FoodWeek
              entries={data.food_entries}
              userId={userId}
              today={today}
              start={data.group.start_date}
              ready={data.food_log_ready}
              onOpenDay={(selected) => {
                setDate(selected);
                go('today');
              }}
            />
            <EnergyTrend data={data} me={me} today={today} />
          </>
        )}
        {tab === 'together' && (
          <Together
            data={data}
            me={me}
            today={today}
            onCheer={() => openModal('cheer')}
            onInvite={() => openModal('invite')}
          />
        )}
        {tab === 'settings' && (
          <Preferences
            key={userId}
            me={me}
            data={data}
            isDemo={isDemo}
            busy={busy}
            update={updateMember}
            switchUser={setUserId}
            notify={setToast}
          />
        )}
      </AppLayout>
      {toastEl}
      {modal === 'checkin' && (
        <Dialog title="עדכון היום" onClose={closeModal}>
          <CheckinForm
            entry={entry}
            me={me}
            busy={busy}
            error={saveError}
            onSave={async (e) => {
              if (await updateEntry(e)) closeModal();
            }}
          />
        </Dialog>
      )}
      {modal === 'weight' && (
        <Dialog title="הוספת מדידה" onClose={closeModal}>
          <WeightForm
            userId={userId}
            today={today}
            busy={busy}
            error={saveError}
            weights={data.weights}
            onSave={async (w) => {
              if (await updateWeight(w)) closeModal();
            }}
          />
        </Dialog>
      )}
      {modal === 'cheer' && (
        <Dialog title="הודעה חדשה" onClose={closeModal}>
          <CheerForm
            busy={busy}
            error={saveError}
            onSend={async (s) => {
              if (await cheer(s)) closeModal();
            }}
          />
        </Dialog>
      )}
      {modal === 'invite' && (
        <Dialog title="הזמנת שותפה" onClose={closeModal}>
          {isDemo ? (
            <>
              <p>
                במצב ההדגמה שתיכן כבר כאן. כדי להתחבר משני טלפונים, צריך לחבר את הפרויקט ל־Supabase.
                הוראות החיבור מצורפות לקוד.
              </p>
            </>
          ) : (
            <>
              <p>
                שלחי לשותפה את כתובת האפליקציה ואת הקוד. אחרי הרשמה, היא תבחר ״יש לי קוד הזמנה״.
              </p>
              <label>
                קוד ההזמנה
                <input
                  dir="ltr"
                  value={data.group.invite_code}
                  readOnly
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <button
                className="primary"
                onClick={() =>
                  void navigator.clipboard
                    .writeText(data.group.invite_code)
                    .then(() => setToast('הקוד הועתק.'))
                    .catch(() => setToast('אפשר לסמן את הקוד ולהעתיק ידנית.'))
                }
              >
                <Copy size={18} /> העתקת קוד
              </button>
              <p className="muted">הקוד אישי לאתגר שלכן. שתפו אותו רק ביניכן.</p>
            </>
          )}
        </Dialog>
      )}
    </>
  );
}
