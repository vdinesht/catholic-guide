import { Link, useNavigate } from 'react-router-dom';
import { StatusDot, statusLabel } from '../components/StatusDot';
import { ago, dayNumber, greeting, longDate, relativeTime, shortDate, weekdayShort } from '../lib/dates';
import type { Dashboard, DraftItem } from '../lib/types';
import { useApi } from '../lib/useApi';
import { useAuth } from './PortalContext';

export function draftLink(d: DraftItem): string {
  if (d.kind === 'READING') return `/portal/readings/${d.date}?lang=${d.lang}`;
  if (d.kind === 'PRAYER') return `/portal/prayers/${d.id}?lang=${d.lang}`;
  return `/portal/songs/${d.id}`;
}

export function StatusLegend() {
  return (
    <span className="legend">
      <span>
        <StatusDot status="PUBLISHED" size={10} />
        Published
      </span>
      <span>
        <StatusDot status="DRAFT" size={10} />
        Draft
      </span>
      <span>
        <StatusDot status="MISSING" size={10} />
        Missing
      </span>
    </span>
  );
}

export function DashboardPage() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const { data, error } = useApi<Dashboard>('/api/portal/dashboard');

  if (error) return <p className="empty-state">{error.message}</p>;
  if (!data) return <p className="loading">Loading…</p>;
  const first = me?.name.replace(/^Fr\.\s+/, '').split(' ')[0];

  return (
    <>
      <div className="page-bar" style={{ alignItems: 'flex-end' }}>
        <div>
          <h1 className="ptitle">
            {greeting()}, {first}
          </h1>
          <p className="muted" style={{ margin: '6px 0 0', fontSize: 15 }}>
            {longDate(data.today)}
            {data.day ? ` · ${data.day.seasonLabel.replace(' · Week', ', Week')}` : ''}
          </p>
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={() => navigate('/portal/prayers/new')}>
            New prayer
          </button>
          <button type="button" className="btn" onClick={() => navigate('/portal/songs/new')}>
            New song
          </button>
          <button type="button" className="btn btn-p" onClick={() => navigate('/portal/readings')}>
            Add readings
          </button>
        </div>
      </div>

      <section className="card" aria-labelledby="cov-h" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <h2 id="cov-h" className="h3">
            Readings for the next 14 days
          </h2>
          <StatusLegend />
        </div>
        <div className="tblwrap">
          <table className="tbl coverage" style={{ minWidth: 760 }}>
            <thead>
              <tr>
                <th scope="col" style={{ width: 110 }}>
                  Language
                </th>
                {data.coverage.days.map((d) => (
                  <th key={d} scope="col" style={{ textAlign: 'center', padding: '8px 4px' }}>
                    <span style={{ display: 'block' }}>{weekdayShort(d)}</span>
                    <span style={{ display: 'block', fontSize: 14, letterSpacing: 0, color: 'var(--ink)' }}>{dayNumber(d)}</span>
                  </th>
                ))}
                <th scope="col">Ready</th>
              </tr>
            </thead>
            <tbody>
              {data.coverage.rows.map((r) => (
                <tr key={r.lang}>
                  <th scope="row" lang={r.lang} style={{ textTransform: 'none', letterSpacing: 0, fontSize: 14, color: 'var(--ink)' }}>
                    {r.nativeName}
                  </th>
                  {r.cells.map((c, i) => (
                    <td key={i}>
                      <Link to={`/portal/readings/${data.coverage.days[i]}?lang=${r.lang}`} aria-label={`${shortDate(data.coverage.days[i])}: ${statusLabel(c)}`} style={{ display: 'inline-flex', padding: 4 }}>
                        <StatusDot status={c} />
                      </Link>
                    </td>
                  ))}
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                    {r.ready} of {r.cells.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="editor-grid">
        <section className="card" aria-labelledby="dr-h" style={{ flex: '1 1 420px', minWidth: 0, overflow: 'hidden' }}>
          <h2 id="dr-h" className="card-head">
            Drafts waiting to publish
          </h2>
          <ul className="list-plain">
            {data.drafts.map((d, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                  <Link to={draftLink(d)} className="rowbtn" lang={d.kind === 'READING' ? 'en' : d.lang}>
                    {d.kind === 'READING' && d.date ? `Readings · ${weekdayShort(d.date)} ${shortDate(d.date)}` : d.title}
                  </Link>
                  <span className="muted" style={{ display: 'block', fontSize: 13 }}>
                    {d.kind === 'READING' ? 'Reading' : d.kind === 'PRAYER' ? 'Prayer' : 'Song'} · <span lang={d.lang}>{d.nativeName}</span>
                    {d.status === 'CHANGES' ? ' · unpublished changes' : ''}
                    {d.who ? ` · ${d.who}` : ''}
                  </span>
                </span>
                <span className="muted" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                  {ago(d.updatedAt)}
                </span>
              </li>
            ))}
            {data.drafts.length === 0 && <li className="muted">Nothing waiting. Everything is published.</li>}
          </ul>
        </section>
        <section className="card" aria-labelledby="ac-h" style={{ flex: '1 1 360px', minWidth: 0, overflow: 'hidden' }}>
          <h2 id="ac-h" className="card-head">
            Recent activity
          </h2>
          <ul className="list-plain">
            {data.activity.map((a) => (
              <li key={a.id} style={{ fontSize: 14, lineHeight: '20px' }}>
                <strong style={{ fontWeight: 600 }}>{a.who}</strong> {a.what} <span style={{ fontWeight: 600 }}>{a.item}</span>
                <span className="muted" style={{ display: 'block', fontSize: 13 }}>
                  {relativeTime(a.at)}
                </span>
              </li>
            ))}
          </ul>
          {me?.role === 'ADMIN' && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)' }}>
              <Link to="/portal/activity" className="rowbtn" style={{ fontSize: 14, textDecoration: 'underline' }}>
                All activity
              </Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
