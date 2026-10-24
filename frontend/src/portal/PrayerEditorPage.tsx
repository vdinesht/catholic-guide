import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { ContentStatus, PrayerDetail } from '../lib/types';
import { useApi } from '../lib/useApi';
import { LangTabs } from './LangTabs';
import { useMeta, useToast, useUnsavedGuard } from './PortalContext';

interface Details {
  categoryId: number | '';
  readingTime: string;
  tags: string;
  source: string;
}

interface Text {
  title: string;
  body: string;
}

export function PrayerEditorPage() {
  const { id = 'new' } = useParams();
  const isNew = id === 'new';
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { meta } = useMeta();
  const { show, fail } = useToast();
  const { data, error, setData } = useApi<PrayerDetail>(isNew ? null : `/api/portal/prayers/${id}`);
  const lang = params.get('lang') ?? 'en';
  const [side, setSide] = useState(true);
  const [details, setDetails] = useState<Details>({ categoryId: '', readingTime: '1 min', tags: '', source: 'Traditional' });
  const [texts, setTexts] = useState<Record<string, Text>>({});
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  useUnsavedGuard(dirty);

  useEffect(() => {
    if (!data) return;
    setDetails({ categoryId: data.categoryId, readingTime: data.readingTime, tags: data.tags, source: data.source });
    setTexts(Object.fromEntries(Object.entries(data.translations).map(([k, v]) => [k, { title: v.title, body: v.body }])));
    setDirty(false);
  }, [data]);

  useEffect(() => {
    if (isNew && meta && details.categoryId === '') setDetails((d) => ({ ...d, categoryId: meta.prayerCategories[0]?.id ?? '' }));
  }, [isNew, meta, details.categoryId]);

  if (error) return <p className="empty-state">{error.message}</p>;
  if (!isNew && !data) return <p className="loading">Loading…</p>;

  const languages = meta?.contentLanguages ?? [];
  const langName = languages.find((l) => l.code === lang)?.nativeName ?? lang;
  const statusOf = (code: string): ContentStatus => data?.translations[code]?.status ?? 'MISSING';
  const status = statusOf(lang);
  const live = status === 'PUBLISHED' || status === 'CHANGES';
  const text = texts[lang] ?? { title: '', body: '' };
  const enText = texts.en;
  const sideOn = lang !== 'en' && side && !!enText?.body;
  const enTitle = data?.translations.en?.title ?? enText?.title ?? 'New prayer';
  const categoryName = meta?.prayerCategories.find((c) => c.id === details.categoryId)?.name ?? '';

  const setText = (patch: Partial<Text>) => {
    setTexts((t) => ({ ...t, [lang]: { ...text, ...patch } }));
    setDirty(true);
  };
  const setDetail = (patch: Partial<Details>) => {
    setDetails((d) => ({ ...d, ...patch }));
    setDirty(true);
  };

  const body = () => ({
    details: { ...details, categoryId: details.categoryId === '' ? null : details.categoryId },
    lang,
    text: texts[lang] ? text : null,
  });

  const run = async (action: 'save' | 'publish' | 'unpublish' | 'delete') => {
    setBusy(true);
    try {
      if (action === 'delete') {
        if (!window.confirm(`Delete “${enTitle}” in every language? This can't be undone.`)) return;
        await api.del(`/api/portal/prayers/${id}`);
        setDirty(false);
        show('Prayer deleted.');
        navigate('/portal/prayers');
        return;
      }
      if (isNew) {
        const created = await api.post<PrayerDetail>('/api/portal/prayers', body());
        setDirty(false);
        show('Draft saved. Nothing changes on the site until you publish.');
        navigate(`/portal/prayers/${created.id}?lang=${lang}`, { replace: true });
        return;
      }
      const url = `/api/portal/prayers/${id}`;
      const next =
        action === 'save'
          ? await api.put<PrayerDetail>(url, body())
          : action === 'publish'
            ? await api.post<PrayerDetail>(`${url}/publish?lang=${lang}`, body())
            : await api.post<PrayerDetail>(`${url}/unpublish?lang=${lang}`);
      setData(next);
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
  const anyLive = data ? Object.values(data.translations).some((t) => t.status === 'PUBLISHED' || t.status === 'CHANGES') : false;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <Link to="/portal/prayers">Prayers</Link> / {enTitle}
        </nav>
        <div className="page-bar" style={{ gap: 12 }}>
          <h1 className="ptitle sm" lang={lang}>
            {text.title || (isNew ? 'New prayer' : enTitle)}
          </h1>
          <div className="actions">
            <button type="button" className="btn" disabled={busy} onClick={() => run('save')}>
              Save draft
            </button>
            {live && (
              <button type="button" className="btn" disabled={busy} onClick={() => run('unpublish')}>
                Unpublish
              </button>
            )}
            {!isNew && (
              <button type="button" className="btn btn-p" disabled={busy} onClick={() => run('publish')}>
                {live ? `Update ${langName}` : `Publish ${langName}`}
              </button>
            )}
          </div>
        </div>
      </div>

      {!isNew && <LangTabs languages={languages} statusOf={statusOf} current={lang} onPick={pick} sideBySide={side} onSideBySide={setSide} />}

      <div className="editor-grid">
        <div className="editor-main" style={{ flexBasis: 520 }}>
          <section className="card part-card" lang={lang}>
            <div>
              <label className="lbl" htmlFor="it-t" lang="en">
                Title
              </label>
              <input id="it-t" className="inp" value={text.title} placeholder={lang === 'en' ? 'e.g. Prayer for the sick' : enText?.title} onChange={(e) => setText({ title: e.target.value })} style={{ fontSize: 17, fontWeight: 600 }} />
            </div>
            <div className="field-row" style={{ gap: 16 }}>
              {sideOn && (
                <div className="ref" lang="en" style={{ flexBasis: 240 }}>
                  <span className="overline">English · Prayer text</span>
                  <p>{enText!.body}</p>
                </div>
              )}
              <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                <label className="lbl" htmlFor="it-b" lang="en">
                  Prayer text
                </label>
                <textarea id="it-b" className="inp" rows={12} value={text.body} onChange={(e) => setText({ body: e.target.value })} />
              </div>
            </div>
            <p className="hint" style={{ margin: 0 }} lang="en">
              Plain text only. Each new line stays a new line; a blank line starts a new paragraph.
            </p>
          </section>
        </div>

        <aside className="editor-aside" style={{ flexBasis: 300 }}>
          <section className="card pad-card" aria-labelledby="det-h" style={{ padding: 20 }}>
            <h2 id="det-h" className="h3" style={{ fontSize: 16, lineHeight: '22px' }}>
              Details
            </h2>
            <div>
              <label className="lbl" htmlFor="f-cat">
                Category
              </label>
              <select id="f-cat" className="inp" value={details.categoryId} onChange={(e) => setDetail({ categoryId: Number(e.target.value) })}>
                {meta?.prayerCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="lbl" htmlFor="f-tags">
                Tags
              </label>
              <input id="f-tags" className="inp" value={details.tags} placeholder="Comma separated" onChange={(e) => setDetail({ tags: e.target.value })} />
              <p className="hint">Tags help people find prayers in search.</p>
            </div>
            <div>
              <label className="lbl" htmlFor="f-time">
                Reading time
              </label>
              <select id="f-time" className="inp" value={details.readingTime} onChange={(e) => setDetail({ readingTime: e.target.value })}>
                {Array.from(new Set([...(meta?.readingTimes ?? []), details.readingTime])).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="lbl" htmlFor="f-src">
                Source
              </label>
              <input id="f-src" className="inp" value={details.source} onChange={(e) => setDetail({ source: e.target.value })} />
            </div>
            {!isNew && !anyLive && (
              <button type="button" className="btn btn-g btn-danger" style={{ alignSelf: 'flex-start', paddingLeft: 0 }} disabled={busy} onClick={() => run('delete')}>
                Delete prayer
              </button>
            )}
          </section>
          <section className="card pad-card" aria-labelledby="pv-h" style={{ padding: 16, gap: 12 }}>
            <h2 id="pv-h" className="h3" style={{ fontSize: 16, lineHeight: '22px' }}>
              Preview on the site
            </h2>
            <div className="preview-phone" lang={lang}>
              <span className="overline" style={{ fontSize: 10, color: 'var(--season-ordinary)' }}>
                {categoryName}
              </span>
              <span style={{ fontSize: 18, lineHeight: '24px', fontWeight: 600 }}>{text.title}</span>
              <p className="serif" style={{ margin: '6px 0 0', fontSize: 15, lineHeight: '25px', whiteSpace: 'pre-line' }}>
                {text.body}
              </p>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
