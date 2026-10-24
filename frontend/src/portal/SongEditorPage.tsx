import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { StatusPill } from '../components/StatusDot';
import { api } from '../lib/api';
import type { Rights, SongBlock, SongDetail } from '../lib/types';
import { useApi } from '../lib/useApi';
import { useMeta, useToast, useUnsavedGuard } from './PortalContext';

interface Form {
  lang: string;
  categoryId: number | '';
  rights: Rights;
  licenceNumber: string;
  title: string;
  author: string;
  tune: string;
  blocks: (SongBlock & { key: number })[];
}

let nextKey = 1;

const RIGHTS: [Rights, string][] = [
  ['PUBLIC_DOMAIN', 'Public domain'],
  ['LICENSED', 'Licensed'],
  ['NEEDS_CHECKING', 'Needs checking'],
];

function blockLabels(blocks: SongBlock[]): string[] {
  let verse = 0;
  return blocks.map((b) => (b.type === 'REFRAIN' ? 'Refrain' : `Verse ${++verse}`));
}

export function SongEditorPage() {
  const { id = 'new' } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { meta } = useMeta();
  const { show, fail } = useToast();
  const { data, error, setData } = useApi<SongDetail>(isNew ? null : `/api/portal/songs/${id}`);
  const [form, setForm] = useState<Form>({
    lang: 'en',
    categoryId: '',
    rights: 'PUBLIC_DOMAIN',
    licenceNumber: '',
    title: '',
    author: '',
    tune: '',
    blocks: [{ key: nextKey++, type: 'VERSE', body: '' }],
  });
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  useUnsavedGuard(dirty);

  useEffect(() => {
    if (!data) return;
    setForm({
      lang: data.lang,
      categoryId: data.categoryId,
      rights: data.rights,
      licenceNumber: data.licenceNumber,
      title: data.lyrics.title,
      author: data.lyrics.author,
      tune: data.lyrics.tune,
      blocks: data.lyrics.blocks.map((b) => ({ ...b, key: nextKey++ })),
    });
    setDirty(false);
  }, [data]);

  useEffect(() => {
    if (isNew && meta && form.categoryId === '') setForm((f) => ({ ...f, categoryId: meta.songCategories[0]?.id ?? '' }));
  }, [isNew, meta, form.categoryId]);

  if (error) return <p className="empty-state">{error.message}</p>;
  if (!isNew && !data) return <p className="loading">Loading…</p>;

  const status = data?.status ?? 'DRAFT';
  const live = status === 'PUBLISHED' || status === 'CHANGES';
  const labels = blockLabels(form.blocks);
  const langName = meta?.songLanguages.find((l) => l.code === form.lang)?.nativeName ?? form.lang;
  const categoryName = meta?.songCategories.find((c) => c.id === form.categoryId)?.name ?? '';

  const update = (patch: Partial<Form>) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };
  const updateBlock = (key: number, patch: Partial<SongBlock>) => update({ blocks: form.blocks.map((b) => (b.key === key ? { ...b, ...patch } : b)) });
  const move = (from: number, to: number) => {
    if (to < 0 || to >= form.blocks.length) return;
    const blocks = [...form.blocks];
    const [b] = blocks.splice(from, 1);
    blocks.splice(to, 0, b);
    update({ blocks });
  };

  const body = () => ({
    lang: form.lang,
    categoryId: form.categoryId === '' ? null : form.categoryId,
    rights: form.rights,
    licenceNumber: form.licenceNumber,
    lyrics: { title: form.title, author: form.author, tune: form.tune, blocks: form.blocks.map(({ type, body }) => ({ type, body })) },
  });

  const run = async (action: 'save' | 'publish' | 'unpublish' | 'delete') => {
    setBusy(true);
    try {
      if (action === 'delete') {
        if (!window.confirm(`Delete “${form.title}”? This can't be undone.`)) return;
        await api.del(`/api/portal/songs/${id}`);
        setDirty(false);
        show('Song deleted.');
        navigate('/portal/songs');
        return;
      }
      if (isNew) {
        const created = await api.post<SongDetail>('/api/portal/songs', body());
        setDirty(false);
        show('Draft saved. Nothing changes on the site until you publish.');
        navigate(`/portal/songs/${created.id}`, { replace: true });
        return;
      }
      const url = `/api/portal/songs/${id}`;
      const next =
        action === 'save'
          ? await api.put<SongDetail>(url, body())
          : action === 'publish'
            ? await api.post<SongDetail>(`${url}/publish`, body())
            : await api.post<SongDetail>(`${url}/unpublish`);
      setData(next);
      show(action === 'save' ? 'Draft saved. Nothing changes on the site until you publish.' : action === 'publish' ? 'Song is now live on the site.' : 'Song taken off the site. It’s kept as a draft.');
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <Link to="/portal/songs">Songs</Link> / <span lang={form.lang}>{data?.lyrics.title ?? 'New song'}</span>
        </nav>
        <div className="page-bar" style={{ gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 className="ptitle sm" lang={form.lang}>
              {form.title || 'New song'}
            </h1>
            {!isNew && <StatusPill status={status} />}
          </div>
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
                {live ? 'Update' : 'Publish'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="editor-grid">
        <div className="editor-main" style={{ flexBasis: 520 }}>
          <section className="card part-card" lang={form.lang}>
            <div>
              <label className="lbl" htmlFor="it-t" lang="en">
                Title
              </label>
              <input id="it-t" className="inp" value={form.title} onChange={(e) => update({ title: e.target.value })} style={{ fontSize: 17, fontWeight: 600 }} />
            </div>
            {form.blocks.map((b, i) => (
              <div key={b.key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }} lang="en">
                  <label className="lbl" htmlFor={`b${b.key}`} style={{ margin: 0 }}>
                    {labels[i]}
                  </label>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <select className="inp auto" aria-label={`${labels[i]} type`} value={b.type} onChange={(e) => updateBlock(b.key, { type: e.target.value as SongBlock['type'] })} style={{ height: 32, fontSize: 13 }}>
                      <option value="VERSE">Verse</option>
                      <option value="REFRAIN">Refrain</option>
                    </select>
                    <button type="button" className="btn btn-g btn-icon btn-sm" aria-label={`Move ${labels[i]} up`} disabled={i === 0} onClick={() => move(i, i - 1)}>
                      <Icon name="chevronUp" size={16} />
                    </button>
                    <button type="button" className="btn btn-g btn-icon btn-sm" aria-label={`Move ${labels[i]} down`} disabled={i === form.blocks.length - 1} onClick={() => move(i, i + 1)}>
                      <Icon name="chevronDown" size={16} />
                    </button>
                    <button type="button" className="btn btn-g btn-icon btn-sm" aria-label={`Remove ${labels[i]}`} disabled={form.blocks.length === 1} onClick={() => update({ blocks: form.blocks.filter((x) => x.key !== b.key) })}>
                      <Icon name="trash" size={16} />
                    </button>
                  </span>
                </div>
                <textarea id={`b${b.key}`} className="inp" rows={6} value={b.body} onChange={(e) => updateBlock(b.key, { body: e.target.value })} />
              </div>
            ))}
            <div className="actions" lang="en">
              <button type="button" className="btn" onClick={() => update({ blocks: [...form.blocks, { key: nextKey++, type: 'VERSE', body: '' }] })}>
                + Add verse
              </button>
              <button type="button" className="btn btn-g" onClick={() => update({ blocks: [...form.blocks, { key: nextKey++, type: 'REFRAIN', body: '' }] })}>
                + Add refrain
              </button>
            </div>
            <p className="hint" style={{ margin: 0 }} lang="en">
              Plain text only. Each new line stays a new line.
            </p>
          </section>
        </div>

        <aside className="editor-aside" style={{ flexBasis: 300 }}>
          <section className="card pad-card" aria-labelledby="det-h" style={{ padding: 20 }}>
            <h2 id="det-h" className="h3" style={{ fontSize: 16, lineHeight: '22px' }}>
              Details
            </h2>
            <div>
              <label className="lbl" htmlFor="f-lang">
                Language
              </label>
              <select id="f-lang" className="inp" value={form.lang} onChange={(e) => update({ lang: e.target.value })}>
                {meta?.songLanguages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName}
                  </option>
                ))}
              </select>
              <p className="hint">Each song is in one language. A song in another language is added as its own song.</p>
            </div>
            <div>
              <label className="lbl" htmlFor="f-cat">
                Category
              </label>
              <select id="f-cat" className="inp" value={form.categoryId} onChange={(e) => update({ categoryId: Number(e.target.value) })}>
                {meta?.songCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="hint">Admins manage the category list in Settings.</p>
            </div>
            <div>
              <label className="lbl" htmlFor="f-author">
                Author / composer
              </label>
              <input id="f-author" className="inp" value={form.author} placeholder="[Author]" onChange={(e) => update({ author: e.target.value })} />
            </div>
            <div>
              <label className="lbl" htmlFor="f-tune">
                Tune
              </label>
              <input id="f-tune" className="inp" value={form.tune} placeholder="Optional" onChange={(e) => update({ tune: e.target.value })} />
            </div>
            <div>
              <label className="lbl" htmlFor="f-rights">
                Rights
              </label>
              <select id="f-rights" className="inp" value={form.rights} onChange={(e) => update({ rights: e.target.value as Rights })}>
                {RIGHTS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              <p className="hint">Licensed lyrics need a licence number before they can be published.</p>
            </div>
            {form.rights === 'LICENSED' && (
              <div>
                <label className="lbl" htmlFor="f-lic">
                  Licence number
                </label>
                <input id="f-lic" className="inp" value={form.licenceNumber} onChange={(e) => update({ licenceNumber: e.target.value })} />
              </div>
            )}
            {!isNew && !live && (
              <button type="button" className="btn btn-g btn-danger" style={{ alignSelf: 'flex-start', paddingLeft: 0 }} disabled={busy} onClick={() => run('delete')}>
                Delete song
              </button>
            )}
          </section>
          <section className="card pad-card" aria-labelledby="pv-h" style={{ padding: 16, gap: 12 }}>
            <h2 id="pv-h" className="h3" style={{ fontSize: 16, lineHeight: '22px' }}>
              Preview on the site
            </h2>
            <div className="preview-phone" lang={form.lang}>
              <span className="overline" style={{ fontSize: 10, color: 'var(--season-ordinary)' }} lang="en">
                {categoryName} · <span lang={form.lang}>{langName}</span>
              </span>
              <span style={{ fontSize: 18, lineHeight: '24px', fontWeight: 600 }}>{form.title}</span>
              <p className="serif" style={{ margin: '6px 0 0', fontSize: 15, lineHeight: '25px', whiteSpace: 'pre-line' }}>
                {form.blocks[0]?.body}
              </p>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
