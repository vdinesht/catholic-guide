import { Link } from 'react-router-dom';
import { StatusPill } from '../components/StatusDot';
import type { ContentStatus, PortalLanguage } from '../lib/types';
import { useAuth } from './PortalContext';

/** One tab per language with its publish status, plus the side-by-side switch for translators. */
export function LangTabs({
  languages,
  statusOf,
  current,
  onPick,
  sideBySide,
  onSideBySide,
}: {
  languages: PortalLanguage[];
  statusOf: (code: string) => ContentStatus;
  current: string;
  onPick: (code: string) => void;
  sideBySide: boolean;
  onSideBySide: (on: boolean) => void;
}) {
  const { me } = useAuth();
  return (
    <div className="tabs">
      <div role="tablist" aria-label="Language">
        {languages.map((l) => (
          <button key={l.code} type="button" role="tab" aria-selected={l.code === current} lang={l.code} onClick={() => onPick(l.code)}>
            {l.nativeName} <StatusPill status={statusOf(l.code)} />
          </button>
        ))}
        {me?.role === 'ADMIN' && (
          <Link to="/portal/settings" className="ghost" style={{ display: 'inline-flex', alignItems: 'center' }}>
            + Add language
          </Link>
        )}
      </div>
      {current !== 'en' && (
        <label className="check hide-s" style={{ marginLeft: 'auto' }}>
          <input type="checkbox" checked={sideBySide} onChange={(e) => onSideBySide(e.target.checked)} />
          Side by side with English
        </label>
      )}
    </div>
  );
}
