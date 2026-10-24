import { useEffect, useState, type FormEvent } from 'react';
import { Icon } from '../components/Icon';
import { api } from '../lib/api';
import type { CategoryDto, SettingsData } from '../lib/types';
import { useApi } from '../lib/useApi';
import { useMeta, useToast } from './PortalContext';

export function SettingsPage() {
  const { data, error, setData } = useApi<SettingsData>('/api/portal/settings');
  const { reloadMeta } = useMeta();
  const { show, fail } = useToast();
  const [signIn, setSignIn] = useState<SettingsData['signIn']>();
  const [addingLang, setAddingLang] = useState(false);

  useEffect(() => {
    if (data) setSignIn(data.signIn);
  }, [data]);

  if (error) return <p className="empty-state">{error.message}</p>;
  if (!data || !signIn) return <p className="loading">Loading…</p>;

  const apply = async (p: Promise<SettingsData>, message: string) => {
    try {
      setData(await p);
      reloadMeta();
      show(message);
      return true;
    } catch (e) {
      fail(e);
      return false;
    }
  };

  const saveSignIn = (e: FormEvent) => {
    e.preventDefault();
    apply(api.put<SettingsData>('/api/portal/settings/sign-in', signIn), 'Settings saved.');
  };

  const addCategory = (kind: 'PRAYER' | 'SONG') => {
    const name = window.prompt(kind === 'PRAYER' ? 'New prayer category' : 'New song category');
    if (name?.trim()) apply(api.post<SettingsData>('/api/portal/settings/categories', { kind, name }), `Added “${name.trim()}”.`);
  };

  const editCategory = (c: CategoryDto, kind: 'PRAYER' | 'SONG') => {
    const name = window.prompt(`Rename “${c.name}”. Leave empty to delete it${c.count > 0 ? ' (only possible when nothing uses it)' : ''}.`, c.name);
    if (name === null) return;
    if (name.trim() === '') {
      apply(api.del<SettingsData>(`/api/portal/settings/categories/${c.id}`), `Deleted “${c.name}”.`);
    } else if (name.trim() !== c.name) {
      apply(api.put<SettingsData>(`/api/portal/settings/categories/${c.id}`, { kind, name }), `Renamed to “${name.trim()}”.`);
    }
  };

  const groups: [string, 'PRAYER' | 'SONG', CategoryDto[]][] = [
    ['Song categories', 'SONG', data.songCategories],
    ['Prayer categories', 'PRAYER', data.prayerCategories],
  ];

  return (
    <>
      <h1 className="ptitle">Settings</h1>
      <div className="editor-grid">
        <section className="card" aria-labelledby="lg-h" style={{ flex: '1 1 420px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
            <h2 id="lg-h" className="h3" style={{ fontSize: 16, lineHeight: '22px' }}>
              Languages
            </h2>
            <p className="hint" style={{ marginTop: 2 }}>
              Readings and prayers get a tab for each turned-on language. Songs aren't translated: each song is tagged with one of these languages, and the site lets people filter songs by language.
            </p>
          </div>
          {data.languages.map((l) => (
            <label key={l.code} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: '1px solid var(--line)', cursor: l.isDefault ? 'default' : 'pointer' }}>
              <input
                type="checkbox"
                checked={l.enabled}
                disabled={l.isDefault}
                onChange={(e) =>
                  apply(api.put<SettingsData>(`/api/portal/settings/languages/${l.code}`, { enabled: e.target.checked }), `${l.englishName} turned ${e.target.checked ? 'on' : 'off'}.`)
                }
                style={{ width: 18, height: 18, accentColor: 'var(--ink)' }}
              />
              <span style={{ flex: '1 1 auto' }}>
                <span lang={l.code} style={{ display: 'block', fontWeight: 600 }}>
                  {l.nativeName}
                </span>
                <span className="muted" style={{ display: 'block', fontSize: 13 }}>
                  {l.englishName}
                </span>
              </span>
              <span className="muted" style={{ fontSize: 13 }}>
                {l.isDefault ? 'Default' : l.songsOnly ? 'Songs only' : ''}
              </span>
            </label>
          ))}
          <div style={{ padding: '12px 20px' }}>
            <button type="button" className="btn" onClick={() => setAddingLang(true)}>
              + Add a language
            </button>
          </div>
        </section>

        <section className="card" aria-labelledby="ct-h" style={{ flex: '1 1 420px', minWidth: 0, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h2 id="ct-h" className="h3" style={{ fontSize: 16, lineHeight: '22px' }}>
              Categories
            </h2>
            <p className="hint" style={{ marginTop: 2 }}>
              Used to group and filter prayers and songs on the site. Rename any time; a category in use can't be deleted.
            </p>
          </div>
          {groups.map(([title, kind, items]) => (
            <div key={kind} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="lbl" style={{ margin: 0 }}>
                {title}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {items.map((c) => (
                  <span key={c.id} className="cat-chip">
                    {c.name} <span className="muted" style={{ fontSize: 12 }}>{c.count}</span>
                    <button type="button" aria-label={`Edit ${c.name}`} onClick={() => editCategory(c, kind)}>
                      <Icon name="more" size={16} />
                    </button>
                  </span>
                ))}
                <button type="button" className="btn btn-sm" style={{ height: 34, borderRadius: 999, fontSize: 13 }} onClick={() => addCategory(kind)}>
                  + Add
                </button>
              </div>
            </div>
          ))}
        </section>

        <form className="card" aria-labelledby="si-h" onSubmit={saveSignIn} style={{ flex: '1 1 360px', minWidth: 0, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 id="si-h" className="h3" style={{ fontSize: 16, lineHeight: '22px' }}>
            Sign-in &amp; sessions
          </h2>
          <div>
            <label className="lbl" htmlFor="s1">
              Sign-in method
            </label>
            <input id="s1" className="inp" value="One-time code by email (6 digits)" disabled />
          </div>
          <div className="field-row">
            <div style={{ flex: '1 1 140px' }}>
              <label className="lbl" htmlFor="s2">
                Code expires after
              </label>
              <select id="s2" className="inp" value={signIn.codeExpiryMinutes} onChange={(e) => setSignIn({ ...signIn, codeExpiryMinutes: Number(e.target.value) })}>
                {[5, 10, 15].map((m) => (
                  <option key={m} value={m}>
                    {m} minutes
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label className="lbl" htmlFor="s3">
                Stay signed in for
              </label>
              <select id="s3" className="inp" value={signIn.sessionDays} onChange={(e) => setSignIn({ ...signIn, sessionDays: Number(e.target.value) })}>
                {[1, 7, 14, 30].map((d) => (
                  <option key={d} value={d}>
                    {d} {d === 1 ? 'day' : 'days'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="lbl" htmlFor="s4">
              Allowed email domains
            </label>
            <input id="s4" className="inp" placeholder="Any domain (invite only)" value={signIn.allowedDomains} onChange={(e) => setSignIn({ ...signIn, allowedDomains: e.target.value })} />
            <p className="hint">Optional. Leave empty to allow any email address that an Admin has invited.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-p">
              Save settings
            </button>
          </div>
        </form>
      </div>

      {addingLang && (
        <AddLanguageDialog
          onClose={() => setAddingLang(false)}
          onAdd={async (body) => {
            const ok = await apply(api.post<SettingsData>('/api/portal/settings/languages', body), `${body.englishName} added and turned on.`);
            if (ok) setAddingLang(false);
          }}
        />
      )}
    </>
  );
}

function AddLanguageDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (b: { code: string; nativeName: string; englishName: string; songsOnly: boolean }) => void }) {
  const [code, setCode] = useState('');
  const [nativeName, setNativeName] = useState('');
  const [englishName, setEnglishName] = useState('');
  const [songsOnly, setSongsOnly] = useState(false);
  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="al-h"
        className="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          onAdd({ code, nativeName, englishName, songsOnly });
        }}
      >
        <h2 id="al-h" className="h3" style={{ fontSize: 20, lineHeight: '26px' }}>
          Add a language
        </h2>
        <div className="field-row">
          <div style={{ flex: '1 1 100px' }}>
            <label className="lbl" htmlFor="al-c">
              Code
            </label>
            <input id="al-c" className="inp" placeholder="e.g. hi" value={code} onChange={(e) => setCode(e.target.value)} required autoFocus />
          </div>
          <div style={{ flex: '2 1 160px' }}>
            <label className="lbl" htmlFor="al-n">
              Its own name
            </label>
            <input id="al-n" className="inp" placeholder="e.g. हिन्दी" value={nativeName} onChange={(e) => setNativeName(e.target.value)} required />
          </div>
        </div>
        <div>
          <label className="lbl" htmlFor="al-e">
            English name
          </label>
          <input id="al-e" className="inp" placeholder="e.g. Hindi" value={englishName} onChange={(e) => setEnglishName(e.target.value)} required />
        </div>
        <label className="check" style={{ fontWeight: 500 }}>
          <input type="checkbox" checked={songsOnly} onChange={(e) => setSongsOnly(e.target.checked)} />
          Songs only (no readings or prayers in this language)
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-p">
            Add language
          </button>
        </div>
      </form>
    </div>
  );
}
