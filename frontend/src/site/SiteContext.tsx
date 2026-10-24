import { createContext, useContext, type ReactNode } from 'react';
import { useApi } from '../lib/useApi';
import type { Site, SiteLanguage } from '../lib/types';
import { usePrefs } from '../lib/prefs';

interface SiteState {
  today: string | undefined;
  colour: Site['colour'];
  /** Languages readings and prayers can be read in. */
  contentLanguages: SiteLanguage[];
  /** The visitor's language, if it is still turned on; otherwise English. */
  lang: string;
  nativeName: (code: string) => string;
}

const SiteContext = createContext<SiteState | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
  const { data } = useApi<Site>('/api/public/site');
  const { lang } = usePrefs();
  const contentLanguages = (data?.languages ?? [{ code: 'en', nativeName: 'English', englishName: 'English', songsOnly: false }]).filter(
    (l) => !l.songsOnly,
  );
  const effective = contentLanguages.some((l) => l.code === lang) ? lang : 'en';
  const nativeName = (code: string) => data?.languages.find((l) => l.code === code)?.nativeName ?? code;
  return (
    <SiteContext.Provider value={{ today: data?.today, colour: data?.colour ?? 'GREEN', contentLanguages, lang: effective, nativeName }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite(): SiteState {
  const s = useContext(SiteContext);
  if (!s) throw new Error('useSite outside SiteProvider');
  return s;
}
