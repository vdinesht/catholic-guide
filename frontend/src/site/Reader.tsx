import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Icon } from '../components/Icon';
import { usePrefs } from '../lib/prefs';
import { parseParagraphs, paragraphs, type Verse } from '../lib/readingText';

export interface ReaderBlock {
  label?: string;
  /** Scripture with verse numbers, or plain text when `text` is used instead. */
  verses?: Verse[];
  text?: string;
}

export interface ReaderPage {
  key: string;
  label: string;
  title: string;
  intro?: string;
  response?: string;
  blocks: ReaderBlock[];
  closeReader?: string;
  closePeople?: string;
  lang: string;
  /** Shown at the foot of the previous page: "Gospel  →". */
  teaser: string;
}

export function scriptureBlocks(body: string): ReaderBlock[] {
  return parseParagraphs(body).map((verses) => ({ verses }));
}

export function textBlocks(body: string): ReaderBlock[] {
  return paragraphs(body).map((text) => ({ text }));
}

/**
 * Full-screen, text-only reading on phones. Swipe left/right turns the page, swipe down
 * from the top closes. The browser's back button closes it too.
 */
export function Reader({ pages, start, onClose }: { pages: ReaderPage[]; start: number; onClose: () => void }) {
  const { hintSeen, markHintSeen } = usePrefs();
  const [page, setPage] = useState(Math.min(start, Math.max(0, pages.length - 1)));
  const scroller = useRef<HTMLDivElement>(null);
  const origin = useRef({ x: 0, y: 0 });
  const closing = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Each open reader adds a history entry, so "back" closes it instead of leaving the page.
  useEffect(() => {
    window.history.pushState({ reader: true }, '');
    const onPop = () => {
      closing.current = true;
      onCloseRef.current();
    };
    window.addEventListener('popstate', onPop);
    document.body.style.overflow = 'hidden';
    scroller.current?.focus();
    return () => {
      window.removeEventListener('popstate', onPop);
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [page]);

  const close = () => {
    if (!closing.current) {
      closing.current = true;
      window.history.back();
    }
  };

  const turn = (d: number) => {
    const n = page + d;
    if (n >= 0 && n < pages.length) {
      setPage(n);
      markHintSeen();
    }
  };

  const down = (e: PointerEvent) => {
    origin.current = { x: e.clientX, y: e.clientY };
  };

  const up = (e: PointerEvent) => {
    const dx = e.clientX - origin.current.x;
    const dy = e.clientY - origin.current.y;
    const atTop = (scroller.current?.scrollTop ?? 0) <= 0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) turn(dx < 0 ? 1 : -1);
    else if (dy > 90 && Math.abs(dx) < 60 && atTop) {
      markHintSeen();
      close();
    }
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') turn(1);
    else if (e.key === 'ArrowLeft') turn(-1);
    else if (e.key === 'Escape') close();
  };

  const pg = pages[page];
  if (!pg) return null;
  const next = pages[page + 1];

  return (
    <div
      ref={scroller}
      className="reader noscroll"
      role="document"
      aria-label={`${pg.label}, ${pg.title}`}
      lang={pg.lang}
      tabIndex={-1}
      onPointerDown={down}
      onPointerUp={up}
      onKeyDown={onKey}
    >
      <button type="button" className="reader-close" aria-label="Close" onClick={close}>
        <Icon name="close" />
      </button>
      <button type="button" className="skip-link reader-skip prev" onClick={() => turn(-1)} disabled={page === 0}>
        Previous
      </button>
      <button type="button" className="skip-link reader-skip next" onClick={() => turn(1)} disabled={!next}>
        Next
      </button>

      <div className="reader-inner">
        <div className="overline label">{pg.label}</div>
        <h1>{pg.title}</h1>
        {pg.intro && <p style={{ margin: '-6px 0 6px', fontSize: 15, lineHeight: '22px', fontStyle: 'italic', color: 'var(--ink-muted)' }}>{pg.intro}</p>}
        {pg.response && (
          <p className="response" style={{ background: 'none', padding: 0, fontSize: 21, lineHeight: '34px' }}>
            <span className="r">R. </span>
            {pg.response}
          </p>
        )}
        {pg.blocks.map((b, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {b.label && <span style={{ fontSize: 12, lineHeight: '16px', fontWeight: 600, letterSpacing: '0.06em', color: 'var(--ink-muted)' }}>{b.label}</span>}
            <p className="scripture">
              {b.verses
                ? b.verses.map((v, j) => (
                    <span key={j}>
                      {v.n && <sup>{v.n}</sup>}
                      {v.t}{' '}
                    </span>
                  ))
                : b.text}
            </p>
          </div>
        ))}
        {pg.closeReader && (
          <p style={{ margin: '8px 0 0', fontSize: 16, lineHeight: '26px' }}>
            <span className="muted">{pg.closeReader}</span>
            <br />
            <span style={{ fontWeight: 600 }}>{pg.closePeople}</span>
          </p>
        )}
        <p className="next-hint" lang="en">
          {next ? (
            <span lang={next.lang}>{next.teaser}  →</span>
          ) : (
            'Swipe down to close'
          )}
        </p>
      </div>

      {!hintSeen && (
        <div className="reader-hint" lang="en">
          <div role="dialog" aria-label="How to read">
            <div className="row">
              <svg aria-hidden="true" width="40" height="24" viewBox="0 0 40 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h34M9 6l-6 6 6 6M31 6l6 6-6 6" />
              </svg>
              Swipe left or right to turn the page
            </div>
            <div className="row">
              <svg aria-hidden="true" width="40" height="24" viewBox="0 0 40 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 2v20M14 16l6 6 6-6" />
              </svg>
              Swipe down from the top to close
            </div>
            <div className="row">
              <svg aria-hidden="true" width="40" height="24" viewBox="0 0 40 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 18l8-8M30 6l-8 8M10 18v-5M10 18h5M30 6v5M30 6h-5" />
              </svg>
              Pinch to change the text size
            </div>
            <button type="button" onClick={markHintSeen} autoFocus>
              Start reading
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
