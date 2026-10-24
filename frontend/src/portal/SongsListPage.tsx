import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { StatusDot, statusLabel } from '../components/StatusDot';
import { relativeTime } from '../lib/dates';
import type { SongRow } from '../lib/types';
import { useApi } from '../lib/useApi';
import { useMeta } from './PortalContext';

export function SongsListPage() {
  const navigate = useNavigate();
  const { meta } = useMeta();
  const { data, error } = useApi<SongRow[]>('/api/portal/songs');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [lang, setLang] = useState('');
  const [status, setStatus] = useState('');
  const nativeName = (code: string) => meta?.songLanguages.find((l) => l.code === code)?.nativeName ?? code;

  const rows = (data ?? []).filter(
    (s) =>
      (!q || s.title.toLowerCase().includes(q.trim().toLowerCase())) &&
      (!cat || s.category === cat) &&
      (!lang || s.lang === lang) &&
      (!status || (status === 'live' ? s.status === 'PUBLISHED' || s.status === 'CHANGES' : s.status === 'DRAFT')),
  );

  return (
    <>
      <div className="page-bar">
        <h1 className="ptitle">Songs</h1>
        <button type="button" className="btn btn-p" onClick={() => navigate('/portal/songs/new')}>
          New song
        </button>
      </div>
      <div className="actions" style={{ alignItems: 'center' }}>
        <div className="search-field sm" style={{ flex: '1 1 260px', maxWidth: 420 }}>
          <label htmlFor="lq" className="sr-only">
            Search
          </label>
          <Icon name="search" size={16} />
          <input id="lq" type="search" className="inp" placeholder="Search songs" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="inp auto" aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {meta?.songCategories.map((c) => (
            <option key={c.id}>{c.name}</option>
          ))}
        </select>
        <select className="inp auto" aria-label="Language" value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="">All languages</option>
          {meta?.songLanguages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.nativeName}
            </option>
          ))}
        </select>
        <select className="inp auto" aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          <option value="live">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>
      {error && <p className="empty-state">{error.message}</p>}
      <section className="card tblwrap">
        <table className="tbl" style={{ minWidth: 720 }}>
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Category</th>
              <th scope="col">Language</th>
              <th scope="col">Status</th>
              <th scope="col">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link to={`/portal/songs/${s.id}`} className="rowbtn" lang={s.lang}>
                    {s.title}
                  </Link>
                  {s.rights === 'NEEDS_CHECKING' && (
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--danger)' }}>Licence needed before publishing</span>
                  )}
                </td>
                <td className="muted">{s.category}</td>
                <td lang={s.lang} style={{ fontWeight: 500 }}>
                  {nativeName(s.lang)}
                </td>
                <td style={{ fontWeight: 600, whiteSpace: 'nowrap', color: s.status === 'PUBLISHED' ? 'var(--season-ordinary)' : 'var(--ink-muted)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <StatusDot status={s.status} size={8} />
                    {statusLabel(s.status)}
                  </span>
                </td>
                <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                  {relativeTime(s.updatedAt).replace(/, .*$/, '')}
                  {s.who ? ` · ${s.who}` : ''}
                </td>
              </tr>
            ))}
            {data && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  No songs match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
