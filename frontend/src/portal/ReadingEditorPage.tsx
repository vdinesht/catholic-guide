import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { api } from '../lib/api';
import { longDate, relativeTime, shortDate, weekdayIndex, weekdayShort } from '../lib/dates';
import type { Colour, ContentStatus, ReadingEditorData, ReadingPart } from '../lib/types';
import { useApi } from '../lib/useApi';
import { statusLabel } from '../components/StatusDot';
import { LangTabs } from './LangTabs';
import { useAuth, useMeta, useToast, useUnsavedGuard } from './PortalContext';

interface PartForm extends ReadingPart {
  key: number;
}

interface LangForm {
  dayName: string;
  saint: string;
  credit: string;
  quote: string;
  quoteCite: string;
  parts: PartForm[];
}

const COLOURS: [Colour, string][] = [
  ['GREEN', 'Green'],
  ['VIOLET', 'Violet'],
  ['WHITE', 'White'],
  ['RED', 'Red'],
  ['ROSE', 'Rose'],
];

const CLOSINGS: Record<string, [string, string]> = {
  'First Reading': ['The word of the Lord.', 'Thanks be to God.'],
  'Second Reading': ['The word of the Lord.', 'Thanks be to God.'],
  Gospel: ['The Gospel of the Lord.', 'Praise to you, Lord Jesus Christ.'],
};

let nextKey = 1;

function blankPart(kind: string, lang: string): PartForm {
  const [r, p] = lang === 'en' ? (CLOSINGS[kind] ?? ['', '']) : ['', ''];
  return { key: nextKey++, kind, citation: '', intro: '', response: '', body: '', closeReader: r, closePeople: p };
}

function defaultKinds(date: string): string[] {
  const sunday = weekdayIndex(date) === 0;
  return sunday
    ? ['First Reading', 'Responsorial Psalm', 'Second Reading', 'Gospel Acclamation', 'Gospel']
    : ['First Reading', 'Responsorial Psalm', 'Gospel Acclamation', 'Gospel'];
}

function formFor(data: ReadingEditorData, lang: string): LangForm {
  const set = data.sets[lang];
  const dayName = data.names[lang]?.dayName ?? '';
  const saint = data.names[lang]?.saint ?? '';
  if (set) {
    return {
      dayName,
      saint,
      credit: set.working.credit,
      quote: set.working.quote,
      quoteCite: set.working.quoteCite,
      parts: set.working.parts.map((p) => ({ ...p, key: nextKey++ })),
    };
  }
  // A new translation starts with the same parts as English, ready to fill in.
  const en = data.sets.en?.working.parts;
  const kinds = en?.length ? en.map((p) => p.kind) : defaultKinds(data.date);
  return {
    dayName,
    saint,
    credit: lang === 'en' ? 'Douay-Rheims Bible (public domain)' : '',
    quote: '',
    quoteCite: '',
    parts: kinds.map((k) => blankPart(k, lang)),
  };
}

export function ReadingEditorPage() {
  const { date = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { me } = useAuth();
  const { meta } = useMeta();
  const { show, fail } = useToast();
  const { data, error, setData } = useApi<ReadingEditorData>(`/api/portal/readings/${date}`);

  const lang = params.get('lang') ?? 'en';
  const [side, setSide] = useState(true);
  const [colour, setColour] = useState<Colour>('GREEN');
  const [cycle, setCycle] = useState('');
  const [forms, setForms] = useState<Record<string, LangForm>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  useUnsavedGuard(Object.values(dirty).some(Boolean));

  // Load (or reload after another date) the server copy into the form.
  useEffect(() => {
    if (!data || data.date !== date) return;
    setColour(data.colour);
    setCycle(data.cycle);
    setForms({});
    setDirty({});
  }, [data, date]);

  const form: LangForm | undefined = useMemo(() => {
    if (!data) return undefined;
    return forms[lang] ?? formFor(data, lang);
  }, [data, forms, lang]);

  if (error) return <p className="empty-state">{error.message}</p>;
  if (!data || !form) return <p className="loading">Loading…</p>;

  const languages = data.languages;
  const langName = languages.find((l) => l.code === lang)?.nativeName ?? lang;
  const statusOf = (code: string): ContentStatus => data.sets[code]?.status ?? 'MISSING';
  const status = statusOf(lang);
  const live = status === 'PUBLISHED' || status === 'CHANGES';
  const en = data.sets.en?.working;
  const sideOn = lang !== 'en' && side && !!en;

  const update = (patch: Partial<LangForm>) => {
    setForms((f) => ({ ...f, [lang]: { ...form, ...patch } }));
    setDirty((d) => ({ ...d, [lang]: true }));
  };
  const updatePart = (key: number, patch: Partial<ReadingPart>) => update({ parts: form.parts.map((p) => (p.key === key ? { ...p, ...patch } : p)) });
  const movePart = (from: number, to: number) => {
    if (to < 0 || to >= form.parts.length || from === to) return;
    const parts = [...form.parts];
    const [moved] = parts.splice(from, 1);
    parts.splice(to, 0, moved);
    update({ parts });
  };

  const body = () => ({
    day: { colour, cycle, dayName: form.dayName, saint: form.saint },
    readings: {
      credit: form.credit,
      quote: form.quote,
      quoteCite: form.quoteCite,
      parts: form.parts.map(({ key: _key, ...p }) => p),
    },
  });

  const run = async (action: 'save' | 'publish' | 'unpublish') => {
    setBusy(true);
    try {
      const url = `/api/portal/readings/${date}/${lang}`;
      const next =
        action === 'save'
          ? await api.put<ReadingEditorData>(url, body())
          : action === 'publish'
            ? await api.post<ReadingEditorData>(`${url}/publish`, body())
            : await api.post<ReadingEditorData>(`${url}/unpublish`);
      setData(next);
      setForms((f) => {
        const copy = { ...f };
        delete copy[lang];
        return copy;
      });
      setDirty((d) => ({ ...d, [lang]: false }));
      show(
        action === 'save'
          ? 'Draft saved. Nothing changes on the site until you publish.'
          : action === 'publish'
            ? `${langName} version is now live on the site.`
            : `${langName} version taken off the site. It’s kept as a draft.`,
      );
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const pick = (code: string) => {
    const next = new URLSearchParams(params);
    next.set('lang', code);
    setParams(next, { replace: true });
  };

  const set = data.sets[lang];
  const kinds = meta?.partKinds ?? ['First Reading', 'Responsorial Psalm', 'Second Reading', 'Gospel Acclamation', 'Gospel'];

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <Link to={`/portal/readings?month=${date.slice(0, 7)}`}>Readings</Link> / {weekdayShort(date)} {shortDate(date)}
        </nav>
        <div className="page-bar" style={{ gap: 12 }}>
          <h1 className="ptitle sm">{longDate(date)}</h1>
          <div className="actions">
            {live && (
              <a className="btn" href={`/readings/${date}`} target="_blank" rel="noreferrer">
                View on site
              </a>
            )}
            <button type="button" className="btn" disabled={busy} onClick={() => run('save')}>
              Save draft
            </button>
            {live && (
              <button type="button" className="btn" disabled={busy} onClick={() => run('unpublish')}>
                Unpublish
              </button>
            )}
            <button type="button" className="btn btn-p" disabled={busy} onClick={() => run('publish')}>
              {live ? `Update ${langName}` : `Publish ${langName}`}
            </button>
          </div>
        </div>
      </div>

      <LangTabs languages={languages} statusOf={statusOf} current={lang} onPick={pick} sideBySide={side} onSideBySide={setSide} />

      <div className="editor-grid">
        <div className="editor-main">
          {form.parts.map((p, i) => {
            const id = `pt${p.key}`;
            const enPart = en?.parts[i]?.kind === p.kind ? en.parts[i] : en?.parts.find((x) => x.kind === p.kind);
            const showClose = !!CLOSINGS[p.kind] || !!p.closeReader || !!p.closePeople;
            return (
              <section
                key={p.key}
                className={`card part-card${dragFrom === i ? ' dragging' : ''}${dragOver === i && dragFrom !== i ? ' drop-target' : ''}`}
                aria-label={p.kind}
                onDragOver={(e) => {
                  if (dragFrom === null) return;
                  e.preventDefault();
                  setDragOver(i);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragFrom !== null) movePart(dragFrom, i);
                  setDragFrom(null);
                  setDragOver(null);
                }}
              >
                <div className="part-head">
                  <span
                    className="grip"
                    draggable
                    title="Drag to reorder"
                    onDragStart={(e) => {
                      setDragFrom(i);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => {
                      setDragFrom(null);
                      setDragOver(null);
                    }}
                  >
                    <Icon name="grip" />
                  </span>
                  <select className="inp auto" aria-label="Part type" value={p.kind} onChange={(e) => updatePart(p.key, { kind: e.target.value })} style={{ fontWeight: 600 }}>
                    {kinds.map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                  <span style={{ marginLeft: 'auto' }} />
                  <button type="button" className="btn btn-g btn-icon" aria-label={`Move ${p.kind} up`} disabled={i === 0} onClick={() => movePart(i, i - 1)}>
                    <Icon name="chevronUp" size={16} />
                  </button>
                  <button type="button" className="btn btn-g btn-icon" aria-label={`Move ${p.kind} down`} disabled={i === form.parts.length - 1} onClick={() => movePart(i, i + 1)}>
                    <Icon name="chevronDown" size={16} />
                  </button>
                  <button type="button" className="btn btn-g btn-icon" aria-label={`Remove ${p.kind}`} onClick={() => update({ parts: form.parts.filter((x) => x.key !== p.key) })}>
                    <Icon name="trash" size={16} />
                  </button>
                </div>
                <div className="field-row" style={{ gap: 16 }}>
                  {sideOn && (
                    <div className="ref" lang="en">
                      <span className="overline">English · reference</span>
                      {enPart ? (
                        <>
                          <span style={{ fontWeight: 600 }}>{enPart.citation}</span>
                          {enPart.intro && (
                            <span className="muted" style={{ fontSize: 14, fontStyle: 'italic' }}>
                              {enPart.intro}
                            </span>
                          )}
                          {enPart.response && <span style={{ fontSize: 14, fontStyle: 'italic' }}>R. {enPart.response}</span>}
                          <p>{enPart.body}</p>
                        </>
                      ) : (
                        <span className="muted">No English part to compare.</span>
                      )}
                    </div>
                  )}
                  <div lang={lang} style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="field-row">
                      <div style={{ flex: '1 1 180px' }}>
                        <label className="lbl" htmlFor={`${id}-c`} lang="en">
                          Citation
                        </label>
                        <input id={`${id}-c`} className="inp" value={p.citation} placeholder="e.g. Luke 13:1–9" onChange={(e) => updatePart(p.key, { citation: e.target.value })} />
                      </div>
                      <div style={{ flex: '2 1 260px' }}>
                        <label className="lbl" htmlFor={`${id}-i`} lang="en">
                          Opening line
                        </label>
                        <input id={`${id}-i`} className="inp" value={p.intro} placeholder="A reading from…" onChange={(e) => updatePart(p.key, { intro: e.target.value })} />
                      </div>
                    </div>
                    {(p.kind === 'Responsorial Psalm' || p.response) && (
                      <div>
                        <label className="lbl" htmlFor={`${id}-r`} lang="en">
                          Response (R.)
                        </label>
                        <input id={`${id}-r`} className="inp" value={p.response} placeholder="Response sung by the people" onChange={(e) => updatePart(p.key, { response: e.target.value })} />
                      </div>
                    )}
                    <div>
                      <label className="lbl" htmlFor={`${id}-t`} lang="en">
                        Text
                      </label>
                      <textarea id={`${id}-t`} className="inp" rows={p.body.length > 300 ? 8 : 4} value={p.body} placeholder="Paste or type the reading" onChange={(e) => updatePart(p.key, { body: e.target.value })} />
                      <p className="hint" lang="en">
                        Put verse numbers in square brackets, e.g. [7]. A blank line starts a new paragraph.
                      </p>
                    </div>
                    {showClose && (
                      <div className="field-row">
                        <div style={{ flex: '1 1 200px' }}>
                          <label className="lbl" htmlFor={`${id}-x1`} lang="en">
                            Closing (reader)
                          </label>
                          <input id={`${id}-x1`} className="inp" value={p.closeReader} onChange={(e) => updatePart(p.key, { closeReader: e.target.value })} />
                        </div>
                        <div style={{ flex: '1 1 200px' }}>
                          <label className="lbl" htmlFor={`${id}-x2`} lang="en">
                            Closing (people)
                          </label>
                          <input id={`${id}-x2`} className="inp" value={p.closePeople} onChange={(e) => updatePart(p.key, { closePeople: e.target.value })} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
          <div className="actions">
            <select
              className="inp auto"
              aria-label="Add a part"
              value=""
              onChange={(e) => {
                if (e.target.value) update({ parts: [...form.parts, blankPart(e.target.value, lang)] });
              }}
            >
              <option value="">+ Add part…</option>
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
        </div>

        <aside className="editor-aside">
          <section className="card pad-card" aria-labelledby="dd-h" style={{ padding: 20 }}>
            <h2 id="dd-h" className="h3" style={{ fontSize: 16, lineHeight: '22px' }}>
              Liturgical day
            </h2>
            <div>
              <label className="lbl" htmlFor="dd-d">
                Date
              </label>
              <input
                id="dd-d"
                className="inp"
                type="date"
                value={date}
                onChange={(e) => {
                  if (!e.target.value) return;
                  if (Object.values(dirty).some(Boolean) && !window.confirm('Leave without saving your changes?')) return;
                  navigate(`/portal/readings/${e.target.value}?lang=${lang}`);
                }}
              />
            </div>
            <div>
              <label className="lbl" htmlFor="dd-n">
                Day name {lang !== 'en' && <span className="muted">· {langName}</span>}
              </label>
              <input id="dd-n" className="inp" lang={lang} value={form.dayName} placeholder={lang === 'en' ? 'e.g. Saturday of the 29th Week in Ordinary Time' : data.names.en?.dayName} onChange={(e) => update({ dayName: e.target.value })} />
            </div>
            <div className="field-row">
              <div style={{ flex: '1 1 0' }}>
                <label className="lbl" htmlFor="dd-s">
                  Colour
                </label>
                <select
                  id="dd-s"
                  className="inp"
                  value={colour}
                  onChange={(e) => {
                    setColour(e.target.value as Colour);
                    setDirty((d) => ({ ...d, [lang]: true }));
                  }}
                >
                  {COLOURS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: '1 1 0' }}>
                <label className="lbl" htmlFor="dd-y">
                  Cycle
                </label>
                <input
                  id="dd-y"
                  className="inp"
                  value={cycle}
                  placeholder="A · II"
                  onChange={(e) => {
                    setCycle(e.target.value);
                    setDirty((d) => ({ ...d, [lang]: true }));
                  }}
                />
              </div>
            </div>
            <div>
              <label className="lbl" htmlFor="dd-m">
                Saint or memorial {lang !== 'en' && <span className="muted">· {langName}</span>}
              </label>
              <input id="dd-m" className="inp" lang={lang} value={form.saint} placeholder="Optional" onChange={(e) => update({ saint: e.target.value })} />
            </div>
            <div>
              <label className="lbl" htmlFor="dd-t">
                Translation credit · {langName}
              </label>
              <input id="dd-t" className="inp" value={form.credit} onChange={(e) => update({ credit: e.target.value })} />
              <p className="hint">Shown under every reading. Use only translations you hold rights to.</p>
            </div>
            <div>
              <label className="lbl" htmlFor="dd-q">
                Quote for the Today page
              </label>
              <input id="dd-q" className="inp" lang={lang} value={form.quote} placeholder="A line from the Gospel" onChange={(e) => update({ quote: e.target.value })} />
              <input className="inp" aria-label="Quote citation" style={{ marginTop: 8 }} value={form.quoteCite} placeholder="e.g. Luke 13:8" onChange={(e) => update({ quoteCite: e.target.value })} />
            </div>
          </section>

          <section className="card pad-card" aria-labelledby="st-h" style={{ padding: 20, gap: 10, fontSize: 14, lineHeight: '20px' }}>
            <h2 id="st-h" className="h3" style={{ fontSize: 16, lineHeight: '22px' }}>
              Status
            </h2>
            {languages.map((l) => {
              const s = statusOf(l.code);
              return (
                <div key={l.code} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span lang={l.code}>{l.nativeName}</span>
                  <span style={{ fontWeight: 600, color: s === 'PUBLISHED' ? 'var(--season-ordinary)' : s === 'MISSING' ? 'var(--season-red)' : 'var(--ink-muted)' }}>
                    {statusLabel(s)}
                    {dirty[l.code] ? ' · unsaved' : ''}
                  </span>
                </div>
              );
            })}
            {set && (
              <p className="muted" style={{ margin: '6px 0 0' }}>
                Last edited{set.who ? ` by ${set.who}` : ''} · {relativeTime(set.updatedAt).toLowerCase()}
              </p>
            )}
            {me?.role === 'ADMIN' && (
              <Link to={`/portal/activity?q=${encodeURIComponent(data.activityLabel)}`} className="rowbtn" style={{ fontSize: 14, textDecoration: 'underline' }}>
                Version history
              </Link>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
