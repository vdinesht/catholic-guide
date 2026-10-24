import { useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '../components/Icon';
import { LogoMark } from '../components/Logo';
import { t, type StringKey } from '../lib/i18n';
import { useIsPhone, usePrefs } from '../lib/prefs';
import { LanguageMenu } from './LanguageMenu';
import { useSite } from './SiteContext';

const SECTIONS: { to: string; key: StringKey; icon: IconName; end?: boolean }[] = [
  { to: '/', key: 'today', icon: 'sun', end: true },
  { to: '/readings', key: 'readings', icon: 'book' },
  { to: '/prayers', key: 'prayers', icon: 'cross' },
  { to: '/songs', key: 'songs', icon: 'music' },
];

export function SiteLayout() {
  const isPhone = useIsPhone();
  const { colour } = useSite();
  return <div className={`season-${colour}`}>{isPhone ? <PhoneShell /> : <DesktopShell />}</div>;
}

function ThemeToggle({ small = false }: { small?: boolean }) {
  const { theme, toggleTheme } = usePrefs();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className={small ? 'pill-btn small icon' : 'pill-btn icon'}
      aria-label={dark ? 'Switch to day (light) mode' : 'Switch to evening (dark) mode'}
      onClick={toggleTheme}
    >
      <Icon name={dark ? 'sun' : 'moon'} />
    </button>
  );
}

function HeaderSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const { lang } = useSite();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };
  return (
    <form className="header-search" role="search" onSubmit={submit}>
      <label htmlFor="site-q" className="sr-only">
        Search readings, prayers and songs
      </label>
      <Icon name="search" />
      <input id="site-q" type="search" placeholder={t(lang, 'searchPlaceholder')} value={q} onChange={(e) => setQ(e.target.value)} />
    </form>
  );
}

function DesktopShell() {
  const { lang } = useSite();
  const { pathname } = useLocation();
  const onToday = pathname === '/';
  return (
    <div lang={lang}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <div className="wrap">
          <Link to="/" className="brand" lang="en">
            <LogoMark />
            Catholic Guide
          </Link>
          <nav className="main-nav" aria-label="Main">
            {SECTIONS.map((s) => (
              <NavLink key={s.to} to={s.to} end={s.end} className={({ isActive }) => (isActive ? 'active' : undefined)}>
                {t(lang, s.key)}
              </NavLink>
            ))}
            <Link to="/#calendar">{t(lang, 'calendar')}</Link>
          </nav>
          <div className="header-tools">
            {onToday ? (
              <HeaderSearch />
            ) : (
              <Link to="/search" className="pill-btn icon" aria-label="Search">
                <Icon name="search" />
              </Link>
            )}
            <LanguageMenu />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="wrap">
          <div style={{ flex: '1 1 280px' }}>
            <div className="brand" lang="en">
              <LogoMark size={26} />
              Catholic Guide
            </div>
            <p style={{ margin: '8px 0 0', maxWidth: 360 }}>The day's Word, prayer and song — in your language. No ads, no pop-ups.</p>
          </div>
          <nav aria-label="Footer">
            <Link to="/readings">{t(lang, 'readings')}</Link>
            <Link to="/prayers">{t(lang, 'prayers')}</Link>
            <Link to="/songs">{t(lang, 'songs')}</Link>
            <Link to="/#calendar">{t(lang, 'calendar')}</Link>
            <Link to="/portal">Editors' portal</Link>
          </nav>
          <p style={{ flex: '1 1 100%', margin: 0 }}>Scripture: Douay-Rheims Bible (public domain). Other translations shown only where licensed.</p>
        </div>
      </footer>
    </div>
  );
}

function PhoneShell() {
  const { lang } = useSite();
  return (
    <div className="phone-app" lang={lang}>
      <header className="phone-header">
        <Link to="/" className="brand" lang="en" aria-label="Catholic Guide — Today">
          <LogoMark size={26} />
          Catholic Guide
        </Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <ThemeToggle small />
          <LanguageMenu compact />
        </div>
      </header>
      <main className="phone-main" id="main">
        <Outlet />
      </main>
      <nav className="phone-tabbar" aria-label={t(lang, 'sections')}>
        {SECTIONS.map((s) => (
          <NavLink key={s.to} to={s.to} end={s.end} className={({ isActive }) => (isActive ? 'active' : undefined)}>
            <Icon name={s.icon} size={22} />
            {t(lang, s.key)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
