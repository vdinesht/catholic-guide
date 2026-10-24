import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { usePrefs } from '../lib/prefs';
import { t } from '../lib/i18n';
import { useSite } from './SiteContext';

/** The globe button in the header: switches readings, prayers and the interface together. */
export function LanguageMenu({ compact = false }: { compact?: boolean }) {
  const { setLang } = usePrefs();
  const { lang, contentLanguages, nativeName } = useSite();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="menu" ref={ref}>
      <button
        type="button"
        className={compact ? 'pill-btn small' : 'pill-btn'}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${t(lang, 'language')}: ${nativeName(lang)}`}
        onClick={() => setOpen((o) => !o)}
        lang={lang}
      >
        <Icon name="globe" size={compact ? 16 : 18} />
        {compact ? (lang === 'en' ? 'EN' : nativeName(lang)) : nativeName(lang)}
      </button>
      {open && (
        <ul className="menu-list">
          {contentLanguages.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                lang={l.code}
                aria-current={l.code === lang ? 'true' : undefined}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
              >
                <span>{l.nativeName}</span>
                <span className="menu-sub" lang="en">
                  {l.code === lang ? <Icon name="check" size={16} /> : l.englishName}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
