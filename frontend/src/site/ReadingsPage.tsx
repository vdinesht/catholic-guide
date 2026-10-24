import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { qs } from '../lib/api';
import { addDays, longDate, mediumDate } from '../lib/dates';
import { kindLabel, t } from '../lib/i18n';
import { TEXT_SIZES, useIsPhone, usePrefs } from '../lib/prefs';
import { parseParagraphs } from '../lib/readingText';
import type { ReadingsData, TodayData } from '../lib/types';
import { useApi } from '../lib/useApi';
import { countWord, cycleLabel, daySubtitle, partId, shortCredit } from './format';
import { ReadingsReader } from './readerPages';
import { useSite } from './SiteContext';

export function ReadingsPage() {
  const params = useParams();
  const { today } = useSite();
  const isPhone = useIsPhone();
  const date = params.date ?? today;
  if (!date) return <p className="loading">Loading…</p>;
  return isPhone ? <PhoneReadings date={date} /> : <DesktopReadings date={date} />;
}

function DatePickerButton({ date, label, onPick, className = 'pill-btn' }: { date: string; label: string; onPick: (d: string) => void; className?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const open = () => {
    const el = input.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') el.showPicker();
    else el.focus();
  };
  return (
    <span className="date-picker" style={{ display: 'inline-flex', flex: className.includes('grow') ? '1 1 auto' : undefined }}>
      <button type="button" className={className} onClick={open} style={{ width: '100%' }}>
        <Icon name="calendar" />
        {label}
      </button>
      <input ref={input} type="date" tabIndex={-1} aria-hidden="true" value={date} onChange={(e) => e.target.value && onPick(e.target.value)} />
    </span>
  );
}

function DesktopReadings({ date }: { date: string }) {
  const { lang, contentLanguages, nativeName } = useSite();
  const { setLang, textSize, setTextSize, saved, toggleSaved } = usePrefs();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const { data, error } = useApi<ReadingsData>(`/api/public/readings/${date}${qs({ lang })}`);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (data && hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [data, hash]);

  if (error) {
    return (
      <div className="wrap" style={{ padding: '48px 32px' }}>
        <p className="empty-state">{error.status === 404 ? "This day isn't in the liturgical calendar yet." : error.message}</p>
      </div>
    );
  }
  if (!data) return <p className="loading">Loading…</p>;

  const r = data.readings;
  const rLang = data.readingsLang ?? lang;
  const px = TEXT_SIZES[textSize];
  const savedKey = `readings:${date}`;
  const share = async () => {
    const url = window.location.href.split('#')[0];
    try {
      if (navigator.share) await navigator.share({ title: `Readings · ${longDate(date)}`, url });
      else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      }
    } catch {
      // The visitor cancelled the share sheet.
    }
  };

  return (
    <div className={`season-${data.day.colour}`}>
      <div className="day-bar">
        <div className="wrap">
          <Link to={`/readings/${data.previous}`} className="pill-btn icon" aria-label={`${t(lang, 'previousDay')}: ${longDate(data.previous, 'en', false)}`}>
            <Icon name="chevronLeft" />
          </Link>
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <div className="season-line">
              <span className="dot" />
              {data.day.seasonLabel}
            </div>
            <h1>{longDate(date, lang)}</h1>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: 15, lineHeight: '22px' }}>
              {daySubtitle(data.day)}
            </p>
          </div>
          <DatePickerButton date={date} label={t(lang, 'pickDate')} onPick={(d) => navigate(`/readings/${d}`)} />
          <Link to={`/readings/${data.next}`} className="pill-btn icon" aria-label={`${t(lang, 'nextDay')}: ${longDate(data.next, 'en', false)}`}>
            <Icon name="chevronRight" />
          </Link>
        </div>
      </div>

      <div className="wrap readings-layout">
        <nav className="toc hide-phone" aria-label={t(lang, 'onThisPage')}>
          <span className="overline" style={{ padding: '0 12px 8px' }}>
            {t(lang, 'onThisPage')}
          </span>
          {r?.parts.map((p, i) => (
            <a key={i} href={`#${partId(p.kind, i)}`} lang={rLang}>
              <span style={{ fontSize: 15, lineHeight: '20px', fontWeight: 600 }}>{kindLabel(p.kind, rLang)}</span>
              <span className="muted" style={{ fontSize: 13, lineHeight: '18px' }}>
                {p.citation}
              </span>
            </a>
          ))}
          {data.day.saint && (
            <div className="card" style={{ marginTop: 20, padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="overline">{t(lang, 'saintOfDay')}</span>
              <span style={{ fontSize: 15, lineHeight: '20px', fontWeight: 600 }}>{data.day.saint}</span>
              {data.day.saintNote && (
                <span className="muted" style={{ fontSize: 13, lineHeight: '18px' }}>
                  {data.day.saintNote}
                </span>
              )}
            </div>
          )}
        </nav>

        <article className="reading-column" lang={rLang}>
          <div role="toolbar" aria-label="Reading options" className="toolbar" lang="en">
            <div role="group" aria-label={t(lang, 'language')} className="segmented">
              {contentLanguages.map((l) => (
                <button key={l.code} type="button" lang={l.code} aria-pressed={l.code === lang} onClick={() => setLang(l.code)}>
                  {l.nativeName}
                </button>
              ))}
            </div>
            {r && (
              <span className="muted" style={{ fontSize: 14 }}>
                <span className="hide-phone">{t(lang, 'translation')}: </span>
                {shortCredit(r.credit)}
              </span>
            )}
            <div className="tools">
              <button type="button" className="pill-btn small icon" aria-label="Smaller text" onClick={() => setTextSize(textSize - 1)} disabled={textSize === 0} style={{ fontWeight: 600, fontSize: 14 }}>
                A−
              </button>
              <span aria-live="polite" className="muted" style={{ minWidth: 40, textAlign: 'center', fontSize: 13 }}>
                {px}px
              </span>
              <button type="button" className="pill-btn small icon" aria-label="Larger text" onClick={() => setTextSize(textSize + 1)} disabled={textSize === TEXT_SIZES.length - 1} style={{ fontWeight: 600, fontSize: 18 }}>
                A+
              </button>
              <button
                type="button"
                className="pill-btn small icon"
                aria-label={saved.includes(savedKey) ? 'Remove bookmark' : 'Bookmark these readings'}
                aria-pressed={saved.includes(savedKey)}
                onClick={() => toggleSaved(savedKey)}
                style={saved.includes(savedKey) ? { background: 'var(--accent-tint)', borderColor: 'var(--accent)' } : undefined}
              >
                <Icon name="bookmark" />
              </button>
              <button type="button" className="pill-btn small icon" aria-label="Share" onClick={share}>
                <Icon name="share" />
              </button>
              <span role="status" className="muted" style={{ fontSize: 13 }}>
                {shared ? 'Link copied' : ''}
              </span>
            </div>
          </div>

          {r && rLang !== lang && (
            <p className="muted" style={{ margin: 0, fontSize: 14 }} lang="en">
              Not yet available in {nativeName(lang)} — showing {nativeName(rLang)}.
            </p>
          )}

          {r ? (
            r.parts.map((p, i) => (
              <section key={i} id={partId(p.kind, i)} aria-labelledby={`${partId(p.kind, i)}-h`} className="card reading-section">
                <div className="title-row">
                  <h2 id={`${partId(p.kind, i)}-h`} className="h2" style={rLang === 'ta' ? { fontSize: 22, lineHeight: '34px', letterSpacing: 0 } : undefined}>
                    {kindLabel(p.kind, rLang)}
                  </h2>
                  <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 600, color: 'var(--accent)' }}>{p.citation}</span>
                </div>
                {p.intro && <p className="intro">{p.intro}</p>}
                {p.response && (
                  <p className="response" style={{ fontSize: px, lineHeight: `${Math.round(px * 1.7)}px` }}>
                    <span className="r">R.</span> {p.response}
                  </p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {parseParagraphs(p.body).map((para, j) => (
                    <p key={j} className="scripture" style={{ fontSize: px, lineHeight: `${Math.round(px * 1.7)}px` }}>
                      {para.map((v, k) => (
                        <span key={k}>
                          {v.n && <sup>{v.n}</sup>}
                          {v.t}{' '}
                        </span>
                      ))}
                    </p>
                  ))}
                </div>
                {p.closeReader && (
                  <div className="closing">
                    <span className="muted">{p.closeReader}</span>
                    <span style={{ fontWeight: 600 }}>{p.closePeople}</span>
                  </div>
                )}
              </section>
            ))
          ) : (
            <p className="empty-state">{t(lang, 'noReadings')}</p>
          )}

          {r && (
            <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: '20px' }}>
              Scripture texts: {r.credit}.{rLang === 'en' ? ' Psalm response and acclamation follow the Lectionary for Mass.' : ''}
            </p>
          )}
        </article>
      </div>
    </div>
  );
}

function PhoneReadings({ date }: { date: string }) {
  const { lang } = useSite();
  const navigate = useNavigate();
  const { data, error } = useApi<TodayData>(`/api/public/today${qs({ date, lang })}`);
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);

  if (error) return <p className="empty-state" style={{ margin: 16 }}>{error.status === 404 ? "This day isn't in the liturgical calendar yet." : error.message}</p>;
  if (!data) return <p className="loading">Loading…</p>;
  const r = data.readings;

  return (
    <div className={`season-${data.day.colour}`}>
      <div style={{ padding: '24px 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h1 className="p-title" style={{ margin: 0 }}>
          {t(lang, 'readings')}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to={`/readings/${addDays(date, -1)}`} className="pill-btn icon" aria-label={t(lang, 'previousDay')}>
            <Icon name="chevronLeft" size={16} />
          </Link>
          <DatePickerButton date={date} label={mediumDate(date, lang)} onPick={(d) => navigate(`/readings/${d}`)} className="pill-btn strong grow" />
          <Link to={`/readings/${addDays(date, 1)}`} className="pill-btn icon" aria-label={t(lang, 'nextDay')}>
            <Icon name="chevronRight" size={16} />
          </Link>
        </div>

        <section className="p-list" aria-labelledby="r-today">
          <div style={{ padding: 16, background: 'var(--accent-tint)' }}>
            <div className="season-line">{data.day.seasonLabel}</div>
            <h2 id="r-today" className="h3" style={{ marginTop: 4 }}>
              {data.day.dayName}
            </h2>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: 13, lineHeight: '18px' }}>
              {[cycleLabel(data.day.cycle), r ? shortCredit(r.credit) : ''].filter(Boolean).join(' · ')}
            </p>
          </div>
          {r ? (
            <>
              <ul lang={r.lang}>
                {r.parts.map((p, i) => (
                  <li key={i}>
                    <button type="button" className="p-row" style={{ borderTop: '1px solid var(--line)' }} onClick={() => setOpen(i)}>
                      <span className="grow">
                        <span className="k" lang={r.lang}>
                          {kindLabel(p.kind, r.lang)}
                        </span>
                        <span className="t">{p.citation}</span>
                        <span className="l">{p.firstLine}</span>
                      </span>
                      <Icon name="chevronRight" size={16} className="chev" />
                    </button>
                  </li>
                ))}
              </ul>
              <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--line)' }}>
                <button type="button" className="accent-btn" style={{ width: '100%', height: 48 }} onClick={() => setOpen(0)}>
                  Read all {countWord(r.parts.length)}
                </button>
              </div>
            </>
          ) : (
            <p className="muted" style={{ margin: 0, padding: 16, fontSize: 15 }}>
              {t(lang, 'noReadings')}
            </p>
          )}
        </section>

        {data.tomorrow && (
          <section className="p-list" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }} aria-labelledby="r-sun">
            <div className="overline">
              {t(lang, 'tomorrow')} · {mediumDate(data.tomorrow.date)}
            </div>
            <h2 id="r-sun" className="h3">
              {data.tomorrow.dayName}
            </h2>
            <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: '22px' }}>
              {data.tomorrow.parts.map((p) => p.citation).join(' · ')}
            </p>
          </section>
        )}
      </div>
      {open !== null && <ReadingsReader date={date} lang={lang} start={open} onClose={close} />}
    </div>
  );
}
