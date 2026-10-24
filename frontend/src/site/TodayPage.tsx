import { useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { qs } from '../lib/api';
import { dayNumber, longDate, monthShort, weekdayIndex, weekdayLong, weekdayShort } from '../lib/dates';
import { kindLabel, mysteriesFor, t } from '../lib/i18n';
import { useIsPhone, usePrefs } from '../lib/prefs';
import type { TodayData } from '../lib/types';
import { useApi } from '../lib/useApi';
import { countWord, cycleLabel, daySubtitle, partId, shortCredit } from './format';
import { ReadingsReader } from './readerPages';
import { useSite } from './SiteContext';
import { PrayerReaderBySlug, SongReaderBySlug } from './LibraryReaders';

export function TodayPage() {
  const [params] = useSearchParams();
  const date = params.get('date') ?? undefined;
  const { lang } = useSite();
  const { data, error } = useApi<TodayData>(`/api/public/today${qs({ date, lang })}`);
  const isPhone = useIsPhone();

  if (error) {
    return (
      <div className="wrap" style={{ padding: '48px 16px' }}>
        <p className="empty-state">
          {error.status === 404 ? "This day isn't in the liturgical calendar yet." : error.message} <Link to="/">Go to today</Link>
        </p>
      </div>
    );
  }
  if (!data) return <p className="loading">Loading…</p>;
  return <div className={`season-${data.day.colour}`}>{isPhone ? <PhoneToday data={data} /> : <DesktopToday data={data} />}</div>;
}

function WeekStrip({ data, phone }: { data: TodayData; phone?: boolean }) {
  const { lang } = useSite();
  return (
    <div role="group" aria-label={t(lang, 'chooseDay')} className={phone ? 'p-week noscroll' : 'week-strip'}>
      {data.week.map((d) => {
        const selected = d.date === data.date;
        const isToday = d.date === data.today;
        return (
          <Link
            key={d.date}
            to={isToday ? '/' : `/?date=${d.date}`}
            className={selected ? 'week-day selected' : 'week-day'}
            aria-current={selected ? 'date' : undefined}
            aria-label={`${longDate(d.date, 'en', false)}${isToday ? ', today' : ''}`}
          >
            <span className="wd">{weekdayShort(d.date, lang)}</span>
            <span className="n">{dayNumber(d.date)}</span>
            <span className={`dot c-${d.colour}`} />
          </Link>
        );
      })}
    </div>
  );
}

function DesktopToday({ data }: { data: TodayData }) {
  const { lang, contentLanguages, nativeName } = useSite();
  const { setLang } = usePrefs();
  const isToday = data.date === data.today;
  const r = data.readings;
  const mysteries = mysteriesFor(weekdayIndex(data.date));

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="season-line">
              <span className="dot" />
              {data.day.seasonLabel}
            </div>
            <h1 className="display">{longDate(data.date, lang)}</h1>
            <p className="lede">{daySubtitle(data.day)}</p>
          </div>
          <WeekStrip data={data} />
          {r?.quote && (
            <figure className="quote">
              <blockquote>“{r.quote}”</blockquote>
              <figcaption>
                {isToday ? t(lang, 'todaysGospel') : 'Gospel'} · {r.quoteCite}
              </figcaption>
            </figure>
          )}
        </div>
      </section>

      <div className="wrap today-grid">
        <div className="today-main">
          <section className="card readings-card" aria-labelledby="readings-h">
            <div className="head">
              <div>
                <h2 id="readings-h" className="h2">
                  {isToday ? t(lang, 'todaysReadings') : t(lang, 'readings')}
                </h2>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 14, lineHeight: '20px' }}>
                  {[cycleLabel(data.day.cycle), r ? shortCredit(r.credit) : ''].filter(Boolean).join(' · ')}
                </p>
              </div>
              {r && (
                <Link to={`/readings/${data.date}`} className="accent-btn">
                  Read all {countWord(r.parts.length)}
                </Link>
              )}
            </div>
            {r ? (
              <ul lang={r.lang}>
                {r.parts.map((p, i) => (
                  <li key={i}>
                    <Link className="reading-row" to={`/readings/${data.date}#${partId(p.kind, i)}`}>
                      <span className="overline kind">{kindLabel(p.kind, r.lang)}</span>
                      <span className="body">
                        <span className="cite">{p.citation}</span>
                        <span className="line">{p.firstLine}</span>
                      </span>
                      <Icon name="chevronRight" className="chev" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state" style={{ margin: 24 }}>
                {t(lang, 'noReadings')}
              </p>
            )}
            {r && r.lang !== lang && <div className="foot">{t(lang, 'showingEnglish')}</div>}
            {data.otherLanguages.length > 0 && (
              <div className="foot">
                Also available in{' '}
                {data.otherLanguages.map((code, i) => (
                  <span key={code}>
                    {i > 0 && ' · '}
                    <button type="button" className="text-link" style={{ background: 'none', border: 0, padding: 0, fontSize: 14 }} lang={code} onClick={() => setLang(code)}>
                      {nativeName(code)}
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {data.tomorrow && (
            <section className="card pad-card" aria-labelledby="tomorrow-h" style={{ gap: 16 }}>
              <span className="overline" style={{ color: 'var(--accent)' }}>
                {t(lang, 'tomorrow')} · {longDate(data.tomorrow.date, 'en', false).replace(',', '')}
              </span>
              <h2 id="tomorrow-h" className="h2">
                {data.tomorrow.dayName}
              </h2>
              <div className="cite-grid">
                {data.tomorrow.parts.map((p, i) => (
                  <div key={i}>
                    <div className="k">{p.kind.replace(' Reading', '').replace('Responsorial ', '')}</div>
                    <div className="v">{p.citation}</div>
                  </div>
                ))}
              </div>
              <Link to={`/readings/${data.tomorrow.date}`} className="text-link" style={{ alignSelf: 'flex-start' }}>
                {weekdayIndex(data.tomorrow.date) === 0 ? t(lang, 'prepareForSunday') : 'Read ahead'}
              </Link>
            </section>
          )}

          <section aria-labelledby="ex-h" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 id="ex-h" className="h2">
              {t(lang, 'explore')}
            </h2>
            <div className="explore-grid">
              <Link to="/readings">
                <Icon name="book" size={24} strokeWidth={1.5} />
                <span>
                  <span className="t">Daily readings</span>
                  <span className="d">Every day's Mass readings, a full year ahead</span>
                </span>
              </Link>
              <Link to="/prayers">
                <Icon name="cross" size={24} strokeWidth={1.5} />
                <span>
                  <span className="t">Prayers</span>
                  <span className="d">Rosary, novenas, litanies and prayers to the saints</span>
                </span>
              </Link>
              <Link to="/songs">
                <Icon name="music" size={24} strokeWidth={1.5} />
                <span>
                  <span className="t">Songs &amp; hymns</span>
                  <span className="d">Hymns and songs for prayer and worship</span>
                </span>
              </Link>
              <a href="#calendar">
                <Icon name="calendar" size={24} strokeWidth={1.5} />
                <span>
                  <span className="t">Liturgical calendar</span>
                  <span className="d">Seasons, feasts and saints, day by day</span>
                </span>
              </a>
            </div>
          </section>
        </div>

        <aside className="today-aside">
          <section className="card pad-card" aria-labelledby="pr-h">
            <span className="overline">
              {t(lang, 'prayerFor')} {weekdayLong(data.date)}
            </span>
            <h2 id="pr-h" className="h3" style={{ fontSize: 22, lineHeight: '28px' }}>
              {t(lang, 'rosary')} · {lang === 'ta' && mysteries.ta ? mysteries.ta : mysteries.name}
            </h2>
            <ol className="mysteries" lang="en">
              {mysteries.items.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ol>
            {data.devotion && (
              <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: '20px' }}>
                {data.devotion.label}: <Link to={`/prayers/${data.devotion.prayerSlug}`} style={{ textDecoration: 'underline' }}>{data.devotion.prayerTitle}</Link>
              </p>
            )}
            <Link to="/prayers?category=Mary%20%26%20Rosary" className="pill-btn strong">
              {t(lang, 'prayRosary')}
            </Link>
          </section>

          {data.hymn && (
            <section className="card pad-card" aria-labelledby="hy-h">
              <span className="overline">{t(lang, 'hymnForToday')}</span>
              <div>
                <h2 id="hy-h" className="h3">
                  {data.hymn.title}
                </h2>
                <p className="muted" style={{ margin: '2px 0 0', fontSize: 14, lineHeight: '20px' }}>
                  {[data.hymn.meta.split(' · ')[0], data.hymn.category].filter(Boolean).join(' · ')}
                </p>
              </div>
              <p className="serif" style={{ margin: 0, fontSize: 17, lineHeight: '27px', whiteSpace: 'pre-line' }}>
                {data.hymn.firstLines}
              </p>
              <Link to={`/songs/${data.hymn.slug}`} className="text-link">
                {t(lang, 'readLyrics')}
              </Link>
            </section>
          )}

          <section id="calendar" className="card pad-card" aria-labelledby="up-h" style={{ gap: 4 }}>
            <h2 id="up-h" className="h3" style={{ marginBottom: 8 }}>
              {t(lang, 'comingUp')}
            </h2>
            {data.upcoming.map((u) => (
              <Link key={u.date} to={`/?date=${u.date}`} className="upcoming-row" style={{ textDecoration: 'none' }}>
                <span className="date">
                  <span className="m">{monthShort(u.date)}</span>
                  <span className="d">{dayNumber(u.date)}</span>
                </span>
                <span className={`dot c-${u.colour}`} />
                <span style={{ minWidth: 0 }}>
                  <span className="t">{u.shortLabel || u.dayName}</span>
                  <span className="k">{u.highlightNote}</span>
                </span>
              </Link>
            ))}
            {data.upcoming.length === 0 && <p className="muted" style={{ margin: 0, fontSize: 14 }}>No feasts in the calendar yet.</p>}
          </section>
        </aside>
      </div>

      <section className="lang-band">
        <div className="wrap">
          <div style={{ flex: '1 1 320px' }}>
            <h2 className="h3" style={{ fontSize: 22, lineHeight: '28px' }}>
              Pray in your own language
            </h2>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: 15, lineHeight: '22px' }}>
              Readings, prayers and the whole site switch together, and we remember your choice on this device.
            </p>
          </div>
          <div className="chips">
            {contentLanguages.map((l) => (
              <button key={l.code} type="button" className="lang-chip" lang={l.code} aria-pressed={l.code === lang} onClick={() => setLang(l.code)}>
                {l.nativeName}
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

type Open = { kind: 'reading'; start: number } | { kind: 'prayer'; slug: string } | { kind: 'song'; slug: string } | null;

function PhoneToday({ data }: { data: TodayData }) {
  const { lang } = useSite();
  const [open, setOpen] = useState<Open>(null);
  const r = data.readings;
  const gospel = r ? r.parts.findIndex((p) => p.kind === 'Gospel') : -1;
  const close = useCallback(() => setOpen(null), []);

  return (
    <>
      <section className="p-hero">
        <div className="season-line">
          <span className="dot" />
          {data.day.seasonLabel}
        </div>
        <h1 className="p-title" lang={lang}>
          {longDate(data.date, lang, false)}
        </h1>
        <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: lang === 'ta' ? '24px' : '20px' }}>
          {data.day.saint ? `${data.day.saint}${data.day.saintNote ? ` · ${data.day.saintNote.toLowerCase()}` : ''}` : data.day.dayName}
        </p>
        <WeekStrip data={data} phone />
      </section>

      <div className="p-stack">
        {r?.quote && (
          <button type="button" className="p-card-btn p-quote" onClick={() => setOpen({ kind: 'reading', start: Math.max(0, gospel) })}>
            <span className="q">“{r.quote}”</span>
            <span className="c">
              {t(lang, 'todaysGospel')} · {r.quoteCite}
            </span>
          </button>
        )}

        <section className="p-list" aria-labelledby="t-r">
          <div className="p-list-head">
            <h2 id="t-r">{t(lang, 'todaysReadings')}</h2>
          </div>
          {r ? (
            <ul lang={r.lang}>
              {r.parts.map((p, i) => (
                <li key={i}>
                  <button type="button" className="p-row" onClick={() => setOpen({ kind: 'reading', start: i })}>
                    <span className="grow">
                      <span className="k" lang={r.lang}>
                        {kindLabel(p.kind, r.lang)}
                      </span>
                      <span className="t">{p.citation}</span>
                    </span>
                    <Icon name="chevronRight" size={16} className="chev" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted" style={{ margin: 0, padding: '0 16px 16px', fontSize: 15 }}>
              {t(lang, 'noReadings')}
            </p>
          )}
        </section>

        {data.devotion && (
          <button type="button" className="p-card-btn" onClick={() => setOpen({ kind: 'prayer', slug: data.devotion!.prayerSlug })}>
            <span className="grow">
              <span className="overline" style={{ display: 'block' }}>
                {data.devotion.label}
              </span>
              <span style={{ display: 'block', marginTop: 2, fontSize: 16, lineHeight: '22px', fontWeight: 600 }}>{data.devotion.prayerTitle}</span>
            </span>
            <Icon name="chevronRight" size={16} className="chev" />
          </button>
        )}

        {data.hymn && (
          <button type="button" className="p-card-btn" onClick={() => setOpen({ kind: 'song', slug: data.hymn!.slug })}>
            <span className="grow">
              <span className="overline" style={{ display: 'block' }}>
                {t(lang, 'hymnForToday')}
              </span>
              <span style={{ display: 'block', marginTop: 2, fontSize: 16, lineHeight: '22px', fontWeight: 600 }}>{data.hymn.title}</span>
            </span>
            <Icon name="chevronRight" size={16} className="chev" />
          </button>
        )}

        <section id="calendar" aria-labelledby="t-u" style={{ padding: '4px 4px 8px' }}>
          <h2 id="t-u" className="h3" style={{ fontSize: 16, lineHeight: '22px', marginBottom: 6 }}>
            {t(lang, 'comingUp')}
          </h2>
          {data.upcoming.map((u) => (
            <div key={u.date} className="upcoming-row" style={{ gap: 12 }}>
              <span className="date" style={{ flexBasis: 40 }}>
                <span className="m">{monthShort(u.date)}</span>
                <span className="d" style={{ fontSize: 18, lineHeight: '22px' }}>
                  {dayNumber(u.date)}
                </span>
              </span>
              <span className={`dot c-${u.colour}`} />
              <span style={{ minWidth: 0 }}>
                <span className="t">{u.shortLabel || u.dayName}</span>
                <span className="k">{u.highlightNote}</span>
              </span>
            </div>
          ))}
        </section>
      </div>

      {open?.kind === 'reading' && <ReadingsReader date={data.date} lang={lang} start={open.start} onClose={close} />}
      {open?.kind === 'prayer' && <PrayerReaderBySlug slug={open.slug} lang={lang} onClose={close} />}
      {open?.kind === 'song' && <SongReaderBySlug slug={open.slug} onClose={close} />}
    </>
  );
}
