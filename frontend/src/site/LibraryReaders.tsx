import { qs } from '../lib/api';
import type { PrayersData, SongsData } from '../lib/types';
import { useApi } from '../lib/useApi';
import { Reader } from './Reader';
import { prayerPages, songPages } from './readerPages';

/** Opens one prayer in the reader; swiping moves through the rest of the prayers. */
export function PrayerReaderBySlug({ slug, lang, onClose }: { slug: string; lang: string; onClose: () => void }) {
  const { data } = useApi<PrayersData>(`/api/public/prayers${qs({ lang })}`);
  if (!data) return null;
  const start = Math.max(0, data.prayers.findIndex((p) => p.slug === slug));
  return <Reader pages={prayerPages(data.prayers)} start={start} onClose={onClose} />;
}

/** Opens one song in the reader; swiping moves through the other songs in its language. */
export function SongReaderBySlug({ slug, onClose }: { slug: string; onClose: () => void }) {
  const { data } = useApi<SongsData>('/api/public/songs');
  if (!data) return null;
  const song = data.songs.find((s) => s.slug === slug);
  const list = song ? data.songs.filter((s) => s.lang === song.lang) : data.songs;
  const start = Math.max(0, list.findIndex((s) => s.slug === slug));
  return <Reader pages={songPages(list)} start={start} onClose={onClose} />;
}
