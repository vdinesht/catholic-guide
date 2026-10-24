import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import type { Me, Meta } from '../lib/types';
import { useApi } from '../lib/useApi';

// ------------------------------------------------------------------ auth

interface AuthState {
  me: Me | null | undefined;
  setMe: (me: Me | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  useEffect(() => {
    api
      .get<Me>('/api/auth/me')
      .then(setMe)
      .catch(() => setMe(null));
  }, []);
  const signOut = useCallback(async () => {
    await api.post('/api/auth/sign-out').catch(() => undefined);
    setMe(null);
  }, []);
  return <AuthContext.Provider value={{ me, setMe, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const a = useContext(AuthContext);
  if (!a) throw new Error('useAuth outside AuthProvider');
  return a;
}

/** Sends visitors who aren't signed in to the sign-in page, then back here afterwards. */
export function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { me } = useAuth();
  const location = useLocation();
  if (me === undefined) return <p className="loading">Loading…</p>;
  if (me === null) return <Navigate to={`/portal/sign-in?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (admin && me.role !== 'ADMIN') return <Navigate to="/portal" replace />;
  return <>{children}</>;
}

// ------------------------------------------------------------------ toast

interface Toast {
  message: string;
  error: boolean;
}

interface ToastState {
  toast: Toast | null;
  show: (message: string) => void;
  fail: (e: unknown) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastState | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<number>();
  const put = useCallback((t: Toast) => {
    setToast(t);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), t.error ? 8000 : 5000);
  }, []);
  const show = useCallback((message: string) => put({ message, error: false }), [put]);
  const fail = useCallback((e: unknown) => put({ message: e instanceof ApiError ? e.message : 'Something went wrong. Please try again.', error: true }), [put]);
  const clear = useCallback(() => setToast(null), []);
  return <ToastContext.Provider value={{ toast, show, fail, clear }}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastState {
  const t = useContext(ToastContext);
  if (!t) throw new Error('useToast outside ToastProvider');
  return t;
}

// ------------------------------------------------------------------ meta

const MetaContext = createContext<{ meta: Meta | undefined; reloadMeta: () => void } | null>(null);

export function MetaProvider({ children }: { children: ReactNode }) {
  const { data, reload } = useApi<Meta>('/api/portal/meta');
  return <MetaContext.Provider value={{ meta: data, reloadMeta: reload }}>{children}</MetaContext.Provider>;
}

export function useMeta() {
  const m = useContext(MetaContext);
  if (!m) throw new Error('useMeta outside MetaProvider');
  return m;
}

/** Asks before leaving the page while there are unsaved edits. */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [dirty]);
}
