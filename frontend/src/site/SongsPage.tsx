import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { qs } from '../lib/api';
import { t } from '../lib/i18n';
import { useIsPhone } from '../lib/prefs';
import type { PublicSong, SongsData } from '../lib/types';
import { useApi } from '../lib/useApi';
import { Reader } from './Reader';
import { songPages } from './readerPages';
import { useSite } from './SiteContext';

export function SongsPage() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const { lang } = useSite();
  const [query, setQuery] = useState('');
  const { data } = useApi<SongsData>(`/api/public/songs${qs({ q: query.trim() || undefined })}`);
  const isPhone = useIsPhone();

  // Songs aren't translated: the visitor filters by the language each song is in.
  const defaultLang = data?.languages.some((l) => l.code === lang) ? lang : (data?.languages[0]?.code ?? 'en');
  const slang = params.get('lang') ?? defaultLang;
  const part = params.get('category') ?? 'All';
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next, { replace: true });
  };

  const list = (data?.songs ?? []).filter((s) => (slang === 'all' || s.lang === slang) && (part === 'All' || s.category === part));
  const langName = (code: string) => data?.languages.find((l) => l.code === code)?.nativeName ?? code;
  const props: Props = {
    data,
    list,
    slang,
    part,
    setLang: (v) => update('lang', v),
    setPart: (v) => update('category', v),
    query,
    setQuery,
    slug,
    langName,
  };
  return isPhone ? <PhoneSongs {...props} /> : <DesktopSongs {...props} />;
}

interface Props {
  data: SongsData | undefined;
  list: PublicSong[];
  slang: string;
  part: string;
  setLang: (v: string) => void;
  setPart: (v: string) => void;
  query: string;
  setQuery: (q: string) => void;
  slug: string | undefined;
  langName: (code: string) => string;
}

function DesktopSongs({ data, list, slang, part, setLang, setPart, query, setQuery, slug, langName }: Props) {
  const navigate = useNavigate();
  const { lang } = useSite();
  const cur = list.find((s) => s.slug === slug) ?? data?.songs.find((s) => s.slug === slug) ?? list[0];
  const total = data?.songs.length ?? 0;
  let verse = 0;

  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div>
            <h1 className="display">Songs &amp; hymns</h1>
            <p className="lede" style={{ marginTop: 8, maxWidth: 640 }}>
              Hymns and songs for prayer, worship and every season — for choirs, families and anyone who sings.
            </p>
          </div>
          <div className="search-field" style={{ maxWidth: 520 }}>
            <label htmlFor="sq" className="sr-only">
              Search songs
            </label>
            <Icon name="search" size={20} />
            <input id="sq" type="search" placeholder="Search by title, first line or tune" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div role="group" aria-label="Song language" className="tab-row">
            {(data?.languages ?? []).map((l) => (
              <button key={l.code} type="button" lang={l.code} aria-pressed={l.code === slang} onClick={() => setLang(l.code)}>
                {l.nativeName} <span className="count">{l.count}</span>
              </button>
            ))}
            <button type="button" aria-pressed={slang === 'all'} onClick={() => setLang('all')}>
              All languages <span className="count">{total}</span>
            </button>
          </div>
          <div role="group" aria-label="Category" className="chips">
            {['All', ...(data?.categories ?? [])].map((c) => (
              <button key={c} type="button" className="chip" aria-pressed={c === part} onClick={() => setPart(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="wrap library">
        <section aria-label={t(lang, 'songs')} className="card song-list">
          <div className="count-bar" aria-live="polite">
            {list.length} {list.length === 1 ? 'song' : 'songs'}
            {slang === 'all' ? '' : ` in ${langName(slang)}`}
            {part === 'All' ? '' : ` · ${part}`}
          </div>
          <ul>
            {list.map((s) => (
              <li key={s.slug}>
                <button type="button" className="song-btn" aria-pressed={s.slug === cur?.slug} lang={s.lang} onClick={() => navigate(`/songs/${s.slug}?${new URLSearchParams({ lang: slang, category: part })}`)}>
                  <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                    <span className="t">{s.title}</span>
                    <span className="m" lang="en">
                      {(slang === 'all' ? `${langName(s.lang)} · ` : '') + s.meta}
                    </span>
                  </span>
                  <span className="overline" style={{ flex: '0 0 auto', letterSpacing: '0.06em' }} lang="en">
                    {s.category}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {data && list.length === 0 && (
            <p className="muted" style={{ margin: 0, padding: 20 }}>
              No songs here yet.
            </p>
          )}
        </section>

        {cur && (
          <article aria-labelledby="song-h" lang={cur.lang} className="card lyric-sheet">
            <div className="head">
              <span className="overline" style={{ color: 'var(--accent)' }} lang="en">
                {cur.category} · <span lang={cur.lang}>{langName(cur.lang)}</span>
              </span>
              <h2 id="song-h">{cur.title}</h2>
              {cur.meta && (
                <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: '20px' }} lang="en">
                  {cur.meta}
                </p>
              )}
            </div>
            <div className="verses">
              {cur.blocks.map((b, i) => (
                <div key={i} className={b.type === 'REFRAIN' ? 'verse refrain' : 'verse'}>
                  <span className="n" aria-label={b.type === 'REFRAIN' ? 'Refrain' : undefined}>
                    {cur.blocks.length > 1 ? (b.type === 'REFRAIN' ? 'R.' : ++verse) : ''}
                  </span>
                  <p>{b.body}</p>
                </div>
              ))}
            </div>
          </article>
        )}
      </div>
    </>
  );
}

function PhoneSongs({ data, list, slang, part, setLang, setPart, query, setQuery, slug }: Props) {
  const navigate = useNavigate();
  const { lang } = useSite();
  const startIndex = slug ? list.findIndex((s) => s.slug === slug) : -1;
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => {
    setOpen(null);
    if (slug) navigate('/songs', { replace: true });
  }, [slug, navigate]);
  // A shared link to /songs/<slug> opens straight into the reader.
  useEffect(() => {
    if (slug && startIndex >= 0) setOpen(startIndex);
  }, [slug, data]);

  return (
    <div className="p-page">
      <h1 className="p-title g" style={{ margin: '0 16px' }}>
        {t(lang, 'songs')}
      </h1>
      <div className="search-field g">
        <label htmlFor="sq" className="sr-only">
          Search songs
        </label>
        <Icon name="search" />
        <input id="sq" type="search" placeholder="Title, first line or tune" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div role="group" aria-label="Song language" className="segmented p-seg g">
        {(data?.languages ?? []).map((l) => (
          <button key={l.code} type="button" lang={l.code} aria-pressed={l.code === slang} onClick={() => setLang(l.code)}>
            {l.nativeName}
          </button>
        ))}
        <button type="button" aria-pressed={slang === 'all'} onClick={() => setLang('all')}>
          All
        </button>
      </div>
      <div role="group" aria-label="Category" className="p-scroll-row noscroll">
        {['All', ...(data?.categories ?? [])].map((c) => (
          <button key={c} type="button" className="chip" aria-pressed={c === part} onClick={() => setPart(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="p-list g">
        <ul>
          {list.map((s, i) => (
            <li key={s.slug}>
              <button type="button" className="p-row" lang={s.lang} onClick={() => setOpen(i)}>
                <span className="grow">
                  <span className="t">{s.title}</span>
                  <span className="m" lang="en">
                    {[s.category, s.meta].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <Icon name="chevronRight" size={16} className="chev" />
              </button>
            </li>
          ))}
        </ul>
        {data && list.length === 0 && (
          <p className="muted" style={{ margin: 0, padding: 16 }}>
            No songs here yet.
          </p>
        )}
      </div>
      {!data && <p className="loading">Loading…</p>}
      {open !== null && list.length > 0 && <Reader pages={songPages(list)} start={open} onClose={close} />}
    </div>
  );
}
