import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { StatusDot, statusLabel } from '../components/StatusDot';
import { relativeTime } from '../lib/dates';
import type { PrayerRow } from '../lib/types';
import { useApi } from '../lib/useApi';
import { useMeta } from './PortalContext';

type StatusFilter = 'any' | 'live' | 'notlive' | 'missing';

export function PrayersListPage() {
  const navigate = useNavigate();
  const { meta } = useMeta();
  const { data, error } = useApi<PrayerRow[]>('/api/portal/prayers');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [status, setStatus] = useState<StatusFilter>('any');
  const langs = meta?.contentLanguages ?? [];

  const rows = (data ?? []).filter((p) => {
    if (q && !p.title.toLowerCase().includes(q.trim().toLowerCase())) return false;
    if (cat && p.category !== cat) return false;
    if (status === 'live' && !p.live) return false;
    if (status === 'notlive' && p.live) return false;
    if (status === 'missing' && langs.every((l) => p.statuses[l.code])) return false;
    return true;
  });

  return (
    <>
      <div className="page-bar">
        <h1 className="ptitle">Prayers</h1>
        <button type="button" className="btn btn-p" onClick={() => navigate('/portal/prayers/new')}>
          New prayer
        </button>
      </div>
      <div className="actions" style={{ alignItems: 'center' }}>
        <div className="search-field sm" style={{ flex: '1 1 260px', maxWidth: 420 }}>
          <label htmlFor="lq" className="sr-only">
            Search
          </label>
          <Icon name="search" size={16} />
          <input id="lq" type="search" className="inp" placeholder="Search prayers" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="inp auto" aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {meta?.prayerCategories.map((c) => (
            <option key={c.id}>{c.name}</option>
          ))}
        </select>
        <select className="inp auto" aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
          <option value="any">Any status</option>
          <option value="live">Live</option>
          <option value="notlive">Not live</option>
          <option value="missing">Missing a language</option>
        </select>
      </div>
      {error && <p className="empty-state">{error.message}</p>}
      <section className="card tblwrap">
        <table className="tbl" style={{ minWidth: 720 }}>
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Category</th>
              <th scope="col">Languages</th>
              <th scope="col">Site status</th>
              <th scope="col">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link to={`/portal/prayers/${p.id}`} className="rowbtn">
                    {p.title}
                  </Link>
                </td>
                <td className="muted">{p.category}</td>
                <td>
                  <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {langs.map((l) => {
                      const s = p.statuses[l.code] ?? 'MISSING';
                      return (
                        <span key={l.code} className="lang-pill" title={`${l.englishName}: ${statusLabel(s)}`}>
                          <StatusDot status={s} size={8} label={`${l.englishName}: ${statusLabel(s)}`} />
                          {l.code.toUpperCase()}
                        </span>
                      );
                    })}
                  </span>
                </td>
                <td style={{ fontWeight: 600, whiteSpace: 'nowrap', color: p.live ? 'var(--season-ordinary)' : 'var(--ink-muted)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <StatusDot status={p.live ? 'PUBLISHED' : 'DRAFT'} size={8} />
                    {p.live ? 'Live' : 'Not live'}
                  </span>
                </td>
                <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                  {relativeTime(p.updatedAt).replace(/, .*$/, '')}
                  {p.who ? ` · ${p.who}` : ''}
                </td>
              </tr>
            ))}
            {data && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  No prayers match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
