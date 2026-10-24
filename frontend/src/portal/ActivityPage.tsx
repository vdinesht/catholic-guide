import { useSearchParams } from 'react-router-dom';
import { qs } from '../lib/api';
import { relativeTime } from '../lib/dates';
import type { ActivityEntry } from '../lib/types';
import { useApi } from '../lib/useApi';

export function ActivityPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const { data, error } = useApi<ActivityEntry[]>(`/api/portal/activity${qs({ q })}`);

  return (
    <>
      <div className="page-bar">
        <h1 className="ptitle">Activity</h1>
        <input
          type="search"
          className="inp auto"
          aria-label="Filter by item"
          placeholder="Filter, e.g. “Readings · 24 Oct”"
          value={q}
          onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
          style={{ minWidth: 260 }}
        />
      </div>
      {error && <p className="empty-state">{error.message}</p>}
      <section className="card tblwrap">
        <table className="tbl" style={{ minWidth: 640 }}>
          <thead>
            <tr>
              <th scope="col">When</th>
              <th scope="col">Who</th>
              <th scope="col">What</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((a) => (
              <tr key={a.id}>
                <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                  {relativeTime(a.at)}
                </td>
                <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{a.who}</td>
                <td>
                  {a.what} <span style={{ fontWeight: 600 }}>{a.item}</span>
                </td>
              </tr>
            ))}
            {data && data.length === 0 && (
              <tr>
                <td colSpan={3} className="muted">
                  Nothing recorded{q ? ` for “${q}”` : ''} yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
