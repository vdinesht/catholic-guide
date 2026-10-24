import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { StatusDot, statusLabel } from '../components/StatusDot';
import { qs } from '../lib/api';
import { dayNumber, monthTitle, shiftMonth, weekdayIndex } from '../lib/dates';
import type { CalendarData } from '../lib/types';
import { useApi } from '../lib/useApi';
import { StatusLegend } from './DashboardPage';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ReadingsCalendarPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const month = params.get('month') ?? undefined;
  const show = params.get('show') ?? 'all';
  const { data, error } = useApi<CalendarData>(`/api/portal/readings${qs({ month })}`);

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next, { replace: true });
  };

  if (error) return <p className="empty-state">{error.message}</p>;
  const langs = (data?.languages ?? []).filter((l) => show === 'all' || l.code === show);
  const lead = data ? weekdayIndex(data.days[0].date) : 0;
  const trail = data ? (7 - ((lead + data.days.length) % 7)) % 7 : 0;

  return (
    <>
      <div className="page-bar">
        <h1 className="ptitle">Readings</h1>
        <div className="actions" style={{ alignItems: 'center' }}>
          <label className="muted" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <span className="hide-s">Show</span>
            <select className="inp auto" value={show} onChange={(e) => set('show', e.target.value)}>
              <option value="all">All languages</option>
              {data?.languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName}
                </option>
              ))}
            </select>
          </label>
          {data && (
            <button type="button" className="btn btn-p" onClick={() => navigate(`/portal/readings/${data.today}`)}>
              Edit today
            </button>
          )}
        </div>
      </div>

      <section className="card" aria-labelledby="cal-h" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
          <button type="button" className="btn btn-icon" aria-label="Previous month" onClick={() => data && set('month', shiftMonth(data.month, -1))}>
            <Icon name="chevronLeft" size={16} />
          </button>
          <h2 id="cal-h" className="h3" style={{ margin: '0 8px', minWidth: 130 }}>
            {data ? monthTitle(data.month) : '…'}
          </h2>
          <button type="button" className="btn btn-icon" aria-label="Next month" onClick={() => data && set('month', shiftMonth(data.month, 1))}>
            <Icon name="chevronRight" size={16} />
          </button>
          <span className="hide-s" style={{ marginLeft: 'auto' }}>
            <StatusLegend />
          </span>
        </div>
        {data ? (
          <div className="cal">
            {WEEKDAYS.map((w) => (
              <div key={w} className="wd">
                {w}
              </div>
            ))}
            {Array.from({ length: lead }, (_, i) => (
              <div key={`b${i}`} className="blank" />
            ))}
            {data.days.map((d) => {
              const aria = `${dayNumber(d.date)} ${monthTitle(data.month)}${d.label ? `, ${d.label}` : ''}. ${data.languages
                .map((l) => `${l.englishName} ${statusLabel(d.statuses[l.code] ?? 'MISSING')}`)
                .join(', ')}${d.date === data.today ? '. Today' : ''}`;
              return (
                <Link
                  key={d.date}
                  to={`/portal/readings/${d.date}`}
                  className={d.date === data.today ? 'day today' : 'day'}
                  aria-label={aria}
                  style={{ boxShadow: `inset 0 3px 0 var(--c-${d.colour})` }}
                >
                  <span className="n">{dayNumber(d.date)}</span>
                  <span className="lab">{d.label}</span>
                  <span className="st">
                    {langs.map((l) => (
                      <span key={l.code}>
                        <StatusDot status={d.statuses[l.code] ?? 'MISSING'} size={9} />
                        {l.code.toUpperCase()}
                      </span>
                    ))}
                  </span>
                </Link>
              );
            })}
            {Array.from({ length: trail }, (_, i) => (
              <div key={`t${i}`} className="blank" />
            ))}
          </div>
        ) : (
          <p className="loading">Loading…</p>
        )}
      </section>
    </>
  );
}
