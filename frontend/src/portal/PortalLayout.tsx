import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '../components/Icon';
import { LogoMark } from '../components/Logo';
import { MetaProvider, RequireAuth, ToastProvider, useAuth, useToast } from './PortalContext';

const MAIN: [string, string, IconName][] = [
  ['Dashboard', '/portal', 'dashboard'],
  ['Readings', '/portal/readings', 'book'],
  ['Prayers', '/portal/prayers', 'cross'],
  ['Songs', '/portal/songs', 'music'],
];

const ADMIN: [string, string, IconName][] = [
  ['Users', '/portal/users', 'users'],
  ['Activity', '/portal/activity', 'activity'],
  ['Settings', '/portal/settings', 'settings'],
];

export function initials(name: string): string {
  const parts = name.replace(/^Fr\.\s+/, '').split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function PortalLayout() {
  return (
    <RequireAuth>
      <ToastProvider>
        <MetaProvider>
          <Shell />
        </MetaProvider>
      </ToastProvider>
    </RequireAuth>
  );
}

function Shell() {
  const { me, signOut } = useAuth();
  const navigate = useNavigate();
  const admin = me?.role === 'ADMIN';
  const all = admin ? [...MAIN, ...ADMIN] : MAIN;
  const cls = ({ isActive }: { isActive: boolean }) => (isActive ? 'navi active' : 'navi');

  const out = async () => {
    await signOut();
    navigate('/portal/sign-in');
  };

  return (
    <div className="portal" lang="en">
      <aside className="side" aria-label="Portal">
        <div className="side-brand">
          <LogoMark />
          <span>
            <span className="n">Catholic Guide</span>
            <span className="s">Content portal</span>
          </span>
        </div>
        <nav aria-label="Sections">
          {MAIN.map(([name, to, icon]) => (
            <NavLink key={to} to={to} end={to === '/portal'} className={cls}>
              <Icon name={icon} />
              {name}
            </NavLink>
          ))}
        </nav>
        {admin && (
          <>
            <div className="overline section-label" style={{ fontSize: 11 }}>
              Admin
            </div>
            <nav aria-label="Admin">
              {ADMIN.map(([name, to, icon]) => (
                <NavLink key={to} to={to} className={cls}>
                  <Icon name={icon} />
                  {name}
                </NavLink>
              ))}
            </nav>
          </>
        )}
        <div className="me">
          <span className="avatar" aria-hidden="true">
            {initials(me?.name ?? '')}
          </span>
          <span style={{ flex: '1 1 auto', minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>{me?.name}</span>
            <span className="muted" style={{ display: 'block', fontSize: 12 }}>
              {admin ? 'Admin' : 'Editor'}
            </span>
          </span>
          <button type="button" className="btn btn-g btn-icon" aria-label="Sign out" onClick={out}>
            <Icon name="signOut" />
          </button>
        </div>
      </aside>

      <div className="portal-body">
        <div className="topnav">
          <div className="bar">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600 }}>
              <LogoMark size={24} />
              Portal
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="avatar" aria-hidden="true" style={{ width: 32, height: 32, fontSize: 13 }}>
                {initials(me?.name ?? '')}
              </span>
              <button type="button" className="btn btn-g btn-icon" aria-label="Sign out" onClick={out}>
                <Icon name="signOut" />
              </button>
            </span>
          </div>
          <nav aria-label="Sections">
            {all.map(([name, to]) => (
              <NavLink key={to} to={to} end={to === '/portal'} className={({ isActive }) => (isActive ? 'active' : undefined)}>
                {name}
              </NavLink>
            ))}
          </nav>
        </div>
        <main className="portal-main">
          <ToastBar />
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function ToastBar() {
  const { toast, clear } = useToast();
  if (!toast) return null;
  return (
    <div role={toast.error ? 'alert' : 'status'} className={toast.error ? 'toast error' : 'toast'}>
      <Icon name={toast.error ? 'alert' : 'check'} className={toast.error ? undefined : 'ok'} strokeWidth={2} />
      <span style={{ flex: '1 1 auto' }}>{toast.message}</span>
      <button type="button" onClick={clear} aria-label="Dismiss">
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
