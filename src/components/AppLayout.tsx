import type { ReactNode } from 'react';
import { ChevronLeft, Leaf, Settings2 } from 'lucide-react';
import type { Member } from '../domain';
import { tabs } from '../navigation';
import type { Tab } from '../navigation';

type AppLayoutProps = {
  me: Member;
  partner: Member | undefined;
  online: boolean;
  isDemo: boolean;
  tab: Tab;
  onNavigate: (tab: Tab) => void;
  children: ReactNode;
};

export default function AppLayout({
  me,
  partner,
  online,
  isDemo,
  tab,
  onNavigate,
  children,
}: AppLayoutProps) {
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        דילוג לתוכן
      </a>
      <aside className="sidebar">
        <a className="brand" href="#today">
          <img src="/clementina.svg" alt="" />
          <span>
            קלמנטינה<small>דברים טובים מבשילים ביחד</small>
          </span>
        </a>
        <div className="sidebar-label">המעקב שלי</div>
        <nav aria-label="ניווט ראשי">
          {tabs.map((t) => (
            <a
              href={'#' + t.id}
              key={t.id}
              aria-current={tab === t.id ? 'page' : undefined}
              className={tab === t.id ? 'nav-item active' : 'nav-item'}
            >
              <t.icon size={20} />
              <span>{t.label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-tip">
          <span className="stat-icon green">
            <Leaf size={20} />
          </span>
          <strong>מספיק צעד אחד.</strong>
          <p>להתחיל. להמשיך. בקצב שלך.</p>
        </div>
        <button className="sidebar-profile" onClick={() => onNavigate('settings')}>
          <span className="avatar peach">{me.name.slice(0, 1)}</span>
          <span>
            <strong>{me.name}</strong>
            <small>{isDemo ? 'חשבון לדוגמה' : 'החשבון שלי'}</small>
          </span>
          <Settings2 size={17} />
        </button>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="breadcrumb">
            קלמנטינה <ChevronLeft size={14} />{' '}
            <strong>{tabs.find((t) => t.id === tab)?.label}</strong>
          </span>
          <div className="topbar-right">
            <span className={'connection ' + (!online ? 'offline' : '')}>
              <span />
              {!online ? 'ללא חיבור' : isDemo ? 'נשמר במכשיר' : 'מסונכרן'}
            </span>
            <button
              className="avatar-stack"
              aria-label="לצפייה בפינה המשותפת"
              onClick={() => onNavigate('together')}
            >
              <span className="avatar green">{partner?.name.slice(0, 1) ?? '+'}</span>
              <span className="avatar peach">{me.name.slice(0, 1)}</span>
            </button>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {children}{' '}
          <footer>
            <span>קלמנטינה</span>
            <span>דברים טובים מבשילים ביחד</span>
          </footer>
        </main>
      </div>{' '}
      <nav className="mobile-nav" aria-label="ניווט בנייד">
        {tabs.map((t) => (
          <a key={t.id} href={'#' + t.id} aria-current={tab === t.id ? 'page' : undefined}>
            <t.icon size={21} />
            <span>{t.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
