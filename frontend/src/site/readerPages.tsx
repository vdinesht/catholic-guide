import { qs } from '../lib/api';
import { kindLabel } from '../lib/i18n';
import type { PublicPrayer, PublicSong, ReadingsData, ReadingSnapshot } from '../lib/types';
import { useApi } from '../lib/useApi';
import { Reader, scriptureBlocks, textBlocks, type ReaderPage } from './Reader';

export function readingPages(r: ReadingSnapshot, lang: string): ReaderPage[] {
  return r.parts.map((p, i) => ({
    key: `r${i}`,
    label: kindLabel(p.kind, lang),
    title: p.citation,
    intro: p.intro || undefined,
    response: p.response || undefined,
    blocks: scriptureBlocks(p.body),
    closeReader: p.closeReader || undefined,
    closePeople: p.closePeople || undefined,
    lang,
    teaser: kindLabel(p.kind, lang),
  }));
}

export function prayerPages(list: PublicPrayer[]): ReaderPage[] {
  return list.map((p) => ({
    key: p.slug,
    label: p.category,
    title: p.title,
    blocks: textBlocks(p.body),
    lang: p.lang,
    teaser: p.title,
  }));
}

export function songPages(list: PublicSong[]): ReaderPage[] {
  return list.map((s) => {
    let verse = 0;
    return {
      key: s.slug,
      label: [s.category, s.meta].filter(Boolean).join(' · '),
      title: s.title,
      blocks: s.blocks.map((b) => ({
        label: s.blocks.length > 1 ? (b.type === 'REFRAIN' ? 'Refrain' : String(++verse)) : undefined,
        text: b.body,
      })),
      lang: s.lang,
      teaser: s.title,
    };
  });
}

/** Opens the reader on a day's readings, loading the full texts first. */
export function ReadingsReader({ date, lang, start, onClose }: { date: string; lang: string; start: number; onClose: () => void }) {
  const { data } = useApi<ReadingsData>(`/api/public/readings/${date}${qs({ lang })}`);
  if (!data?.readings) return null;
  return <Reader pages={readingPages(data.readings, data.readingsLang ?? 'en')} start={start} onClose={onClose} />;
}
