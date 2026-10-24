import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { qs } from '../lib/api';
import { longDate } from '../lib/dates';
import type { SearchData } from '../lib/types';
import { useApi } from '../lib/useApi';
import { useSite } from './SiteContext';

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const [draft, setDraft] = useState(q);
  const { lang } = useSite();
  const { data, loading } = useApi<SearchData>(q.trim().length >= 2 ? `/api/public/search${qs({ q, lang })}` : null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setParams(draft.trim() ? { q: draft.trim() } : {});
  };
  const total = data ? data.readings.length + data.prayers.length + data.songs.length : 0;

  return (
    <div className="wrap" style={{ paddingTop: 32, paddingBottom: 64, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 840 }}>
      <h1 className="p-title" style={{ margin: 0 }}>
        Search
      </h1>
      <form role="search" onSubmit={submit} className="search-field">
        <label htmlFor="sq-all" className="sr-only">
          Search readings, prayers and songs
        </label>
        <Icon name="search" size={20} />
        <input id="sq-all" type="search" autoFocus placeholder="A citation, a prayer, a line from a hymn…" value={draft} onChange={(e) => setDraft(e.target.value)} />
      </form>
      {q && !loading && data && (
        <p className="muted" aria-live="polite" style={{ margin: 0 }}>
          {total} {total === 1 ? 'result' : 'results'} for “{q}”
        </p>
      )}
      {data && data.readings.length > 0 && (
        <section className="card" style={{ overflow: 'hidden' }}>
          <h2 className="h3" style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
            Readings
          </h2>
          {data.readings.map((r) => (
            <Link key={r.date} to={`/readings/${r.date}`} className="p-row" style={{ textDecoration: 'none' }}>
              <span className="grow">
                <span className="t">{longDate(r.date)}</span>
                <span className="m">{r.citations}</span>
              </span>
              <Icon name="chevronRight" className="chev" />
            </Link>
          ))}
        </section>
      )}
      {data && data.prayers.length > 0 && (
        <section className="card" style={{ overflow: 'hidden' }}>
          <h2 className="h3" style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
            Prayers
          </h2>
          {data.prayers.map((p) => (
            <Link key={p.slug} to={`/prayers/${p.slug}`} className="p-row" lang={p.lang} style={{ textDecoration: 'none' }}>
              <span className="grow">
                <span className="t">{p.title}</span>
                <span className="m">{p.category}</span>
              </span>
              <Icon name="chevronRight" className="chev" />
            </Link>
          ))}
        </section>
      )}
      {data && data.songs.length > 0 && (
        <section className="card" style={{ overflow: 'hidden' }}>
          <h2 className="h3" style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
            Songs
          </h2>
          {data.songs.map((s) => (
            <Link key={s.slug} to={`/songs/${s.slug}`} className="p-row" lang={s.lang} style={{ textDecoration: 'none' }}>
              <span className="grow">
                <span className="t">{s.title}</span>
                <span className="m">{[s.category, s.meta].filter(Boolean).join(' · ')}</span>
              </span>
              <Icon name="chevronRight" className="chev" />
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
