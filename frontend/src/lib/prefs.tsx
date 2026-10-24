import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

// Per-visitor conveniences kept in localStorage. Storage can be unavailable
// (private windows, blocked site data), so every access is guarded.

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Not persisted; the choice still applies for this visit.
  }
}

export type Theme = 'light' | 'dark';

export const TEXT_SIZES = [18, 20, 22, 24, 26];

interface Prefs {
  lang: string;
  setLang: (code: string) => void;
  theme: Theme;
  toggleTheme: () => void;
  textSize: number;
  setTextSize: (index: number) => void;
  hintSeen: boolean;
  markHintSeen: () => void;
  saved: string[];
  toggleSaved: (key: string) => void;
}

const PrefsContext = createContext<Prefs | null>(null);

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(() => read('cg.lang') ?? 'en');
  const [theme, setTheme] = useState<Theme>(() => (read('cg.theme') as Theme | null) ?? systemTheme());
  const [textSize, setTextSizeState] = useState(() => {
    const n = Number(read('cg.textSize'));
    return Number.isInteger(n) && n >= 0 && n < TEXT_SIZES.length ? n : 1;
  });
  const [hintSeen, setHintSeen] = useState(() => read('cg.readerHint') === '1');
  const [saved, setSaved] = useState<string[]>(() => {
    try {
      return JSON.parse(read('cg.saved') ?? '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((code: string) => {
    setLangState(code);
    write('cg.lang', code);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      write('cg.theme', next);
      return next;
    });
  }, []);

  const setTextSize = useCallback((i: number) => {
    const n = Math.max(0, Math.min(TEXT_SIZES.length - 1, i));
    setTextSizeState(n);
    write('cg.textSize', String(n));
  }, []);

  const markHintSeen = useCallback(() => {
    setHintSeen(true);
    write('cg.readerHint', '1');
  }, []);

  const toggleSaved = useCallback((key: string) => {
    setSaved((s) => {
      const next = s.includes(key) ? s.filter((k) => k !== key) : [...s, key];
      write('cg.saved', JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ lang, setLang, theme, toggleTheme, textSize, setTextSize, hintSeen, markHintSeen, saved, toggleSaved }),
    [lang, setLang, theme, toggleTheme, textSize, setTextSize, hintSeen, markHintSeen, saved, toggleSaved],
  );
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): Prefs {
  const p = useContext(PrefsContext);
  if (!p) throw new Error('usePrefs outside PrefsProvider');
  return p;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** The site switches to its phone layout (tab bar, full-screen reader) below 760px. */
export function useIsPhone(): boolean {
  return useMediaQuery('(max-width: 760px)');
}
