import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { qs } from '../lib/api';
import { t } from '../lib/i18n';
import { useIsPhone, usePrefs } from '../lib/prefs';
import { paragraphs } from '../lib/readingText';
import type { PrayersData, PublicPrayer } from '../lib/types';
import { useApi } from '../lib/useApi';
import { Reader } from './Reader';
import { prayerPages } from './readerPages';
import { useSite } from './SiteContext';

const PRAYER_REQUEST_EMAIL = import.meta.env.VITE_PRAYER_REQUEST_EMAIL as string | undefined;

/** In late October and November the Church prays especially for the faithful departed. */
function holySoulsNotice(today: string | undefined): string | null {
  if (!today) return null;
  const [, m, d] = today.split('-').map(Number);
  if (m === 10 && d >= 15) return 'From 1 November';
  if (m === 11) return 'November';
  return null;
}

export function PrayersPage() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const { lang } = useSite();
  const [query, setQuery] = useState('');
  const { data } = useApi<PrayersData>(`/api/public/prayers${qs({ lang, q: query.trim() || undefined })}`);
  const isPhone = useIsPhone();
  const category = params.get('category') ?? 'All';
  const setCategory = (c: string) => setParams(c === 'All' ? {} : { category: c }, { replace: true });

  const list = (data?.prayers ?? []).filter((p) => category === 'All' || p.category === category);
  const cats = ['All', ...(data?.categories.map((c) => c.name) ?? [])];

  const props = { data, list, cats, category, setCategory, query, setQuery, slug };
  return isPhone ? <PhonePrayers {...props} lang={lang} /> : <DesktopPrayers {...props} />;
}

interface Props {
  data: PrayersData | undefined;
  list: PublicPrayer[];
  cats: string[];
  category: string;
  setCategory: (c: string) => void;
  query: string;
  setQuery: (q: string) => void;
  slug: string | undefined;
}

function DesktopPrayers({ data, list, cats, category, setCategory, query, setQuery, slug }: Props) {
  const navigate = useNavigate();
  const { today, nativeName, lang } = useSite();
  const { setLang, saved, toggleSaved } = usePrefs();
  const [copied, setCopied] = useState(false);
  const cur = list.find((p) => p.slug === slug) ?? data?.prayers.find((p) => p.slug === slug) ?? list.find((p) => p.slug === 'memorare') ?? list[0];
  const notice = holySoulsNotice(today);

  const share = async () => {
    if (!cur) return;
    const url = `${window.location.origin}/prayers/${cur.slug}`;
    try {
      if (navigator.share) await navigator.share({ title: cur.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Cancelled.
    }
  };

  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div>
            <h1 className="display">{t(lang, 'prayers')}</h1>
            <p className="lede" style={{ marginTop: 8, maxWidth: 640 }}>
              The prayers of the Church — for every hour, season and need. Read, pray aloud, or save your favourites.
            </p>
          </div>
          <div className="search-field" style={{ maxWidth: 640 }}>
            <label htmlFor="pq" className="sr-only">
              Search prayers
            </label>
            <Icon name="search" size={20} />
            <input id="pq" type="search" placeholder="Search by name, saint or intention — e.g. “for the sick”" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div role="group" aria-label="Filter by category" className="chips">
            {cats.map((c) => (
              <button key={c} type="button" className="chip" aria-pressed={c === category} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="wrap library">
        <div className="library-list">
          {notice && (
            <button type="button" className="notice" style={{ border: 0, textAlign: 'left', color: 'inherit' }} onClick={() => setCategory('For the departed')}>
              <span className="overline">{notice}</span>
              <span className="h3">The month of the Holy Souls</span>
              <span className="muted" style={{ fontSize: 14, lineHeight: '20px' }}>
                Prayers for the faithful departed.
              </span>
            </button>
          )}
          <p className="muted" style={{ margin: '4px 0 0', fontSize: 14, lineHeight: '20px' }} aria-live="polite">
            {list.length} {list.length === 1 ? 'prayer' : 'prayers'}
            {category === 'All' ? '' : ` in ${category}`}
          </p>
          <ul className="item-list">
            {list.map((p) => (
              <li key={p.slug}>
                <button type="button" className="item-btn" aria-pressed={p.slug === cur?.slug} onClick={() => navigate(`/prayers/${p.slug}${category === 'All' ? '' : `?category=${encodeURIComponent(category)}`}`)} lang={p.lang}>
                  <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                    <span className="t">{p.title}</span>
                    <span className="m" lang="en">
                      {p.category} · {p.readingTime}
                    </span>
                  </span>
                  <Icon name="chevronRight" className="chev" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {cur ? (
          <article aria-labelledby="pd-h" className="card detail" lang={cur.lang}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px' }} lang="en">
              <span className="overline" style={{ color: 'var(--accent)' }}>
                {cur.category}
              </span>
              <span className="muted" style={{ fontSize: 13 }}>
                · {cur.readingTime}
              </span>
            </div>
            <h2 id="pd-h">{cur.title}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} lang="en">
              <button type="button" className="pill-btn strong" aria-pressed={saved.includes(`prayer:${cur.slug}`)} onClick={() => toggleSaved(`prayer:${cur.slug}`)}>
                <Icon name="bookmark" />
                {saved.includes(`prayer:${cur.slug}`) ? 'Saved' : 'Save'}
              </button>
              <button type="button" className="pill-btn strong" onClick={share}>
                <Icon name="share" />
                {copied ? 'Link copied' : 'Share'}
              </button>
            </div>
            <div className="rule" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {paragraphs(cur.body).map((para, i) => (
                <p key={i} className="prayer-text">
                  {para}
                </p>
              ))}
            </div>
            {cur.lang !== lang && (
              <p className="muted" style={{ margin: 0, fontSize: 14 }} lang="en">
                Not yet available in {nativeName(lang)} — showing {nativeName(cur.lang)}.
              </p>
            )}
            {cur.availableLanguages.filter((l) => l !== cur.lang).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingTop: 8 }}>
                <span className="muted" style={{ fontSize: 14, marginRight: 4 }} lang="en">
                  Also in
                </span>
                {cur.availableLanguages
                  .filter((l) => l !== cur.lang)
                  .map((l) => (
                    <button key={l} type="button" className="chip" style={{ height: 36, fontWeight: 500 }} lang={l} onClick={() => setLang(l)}>
                      {nativeName(l)}
                    </button>
                  ))}
              </div>
            )}
            {PRAYER_REQUEST_EMAIL && (
              <div className="ask" lang="en">
                <div style={{ flex: '1 1 260px' }}>
                  <span style={{ display: 'block', fontSize: 16, lineHeight: '22px', fontWeight: 600 }}>Ask for prayer</span>
                  <span className="muted" style={{ display: 'block', marginTop: 2, fontSize: 14, lineHeight: '20px' }}>
                    Share an intention privately. Our prayer team will pray for you.
                  </span>
                </div>
                <a href={`mailto:${PRAYER_REQUEST_EMAIL}?subject=${encodeURIComponent('Prayer intention')}`} className="pill-btn strong">
                  Send an intention
                </a>
              </div>
            )}
          </article>
        ) : (
          <p className="empty-state" style={{ flex: '999 1 520px' }}>
            {data ? 'No prayers match your search.' : 'Loading…'}
          </p>
        )}
      </div>
    </>
  );
}

function PhonePrayers({ data, list, cats, category, setCategory, query, setQuery, slug, lang }: Props & { lang: string }) {
  const navigate = useNavigate();
  const startIndex = slug ? list.findIndex((p) => p.slug === slug) : -1;
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => {
    setOpen(null);
    if (slug) navigate('/prayers', { replace: true });
  }, [slug, navigate]);
  // A shared link to /prayers/<slug> opens straight into the reader.
  useEffect(() => {
    if (slug && startIndex >= 0) setOpen(startIndex);
  }, [slug, data]);

  return (
    <div className="p-page">
      <h1 className="p-title g" style={{ margin: '0 16px' }}>
        {t(lang, 'prayers')}
      </h1>
      <div className="search-field g">
        <label htmlFor="pq" className="sr-only">
          Search prayers
        </label>
        <Icon name="search" />
        <input id="pq" type="search" placeholder="Search prayers" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div role="group" aria-label="Category" className="p-scroll-row noscroll">
        {cats.map((c) => (
          <button key={c} type="button" className="chip" aria-pressed={c === category} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="p-list g">
        <ul>
          {list.map((p, i) => (
            <li key={p.slug}>
              <button type="button" className="p-row" onClick={() => setOpen(i)} lang={p.lang}>
                <span className="grow">
                  <span className="t">{p.title}</span>
                  <span className="m" lang="en">
                    {p.category} · {p.readingTime}
                  </span>
                </span>
                <Icon name="chevronRight" size={16} className="chev" />
              </button>
            </li>
          ))}
        </ul>
        {data && list.length === 0 && (
          <p className="muted" style={{ margin: 0, padding: 16 }}>
            No prayers match your search.
          </p>
        )}
      </div>
      {!data && <p className="loading">Loading…</p>}
      {open !== null && list.length > 0 && <Reader pages={prayerPages(list)} start={open} onClose={close} />}
      <p className="muted" style={{ margin: '0 16px', fontSize: 13 }}>
        <Link to="/search">Search everything</Link>
      </p>
    </div>
  );
}
