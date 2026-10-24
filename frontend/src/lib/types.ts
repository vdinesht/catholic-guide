// Shapes returned by the Spring Boot API.

export type Colour = 'GREEN' | 'VIOLET' | 'WHITE' | 'RED' | 'ROSE';
export type ContentStatus = 'MISSING' | 'DRAFT' | 'PUBLISHED' | 'CHANGES';

export interface DayView {
  date: string;
  colour: Colour;
  cycle: string;
  dayName: string;
  seasonLabel: string;
  saint: string;
  saintNote: string;
  shortLabel: string;
  highlightNote: string;
}

export interface SiteLanguage {
  code: string;
  nativeName: string;
  englishName: string;
  songsOnly: boolean;
}

export interface Site {
  today: string;
  colour: Colour;
  languages: SiteLanguage[];
}

export interface PartSummary {
  kind: string;
  citation: string;
  firstLine: string;
}

export interface TodayData {
  date: string;
  today: string;
  day: DayView;
  week: { date: string; colour: Colour }[];
  readings: { lang: string; credit: string; quote: string; quoteCite: string; parts: PartSummary[] } | null;
  otherLanguages: string[];
  tomorrow: { date: string; dayName: string; parts: PartSummary[] } | null;
  devotion: { label: string; prayerSlug: string; prayerTitle: string } | null;
  hymn: { slug: string; title: string; meta: string; category: string; firstLines: string } | null;
  upcoming: DayView[];
}

export interface ReadingPart {
  kind: string;
  citation: string;
  intro: string;
  response: string;
  body: string;
  closeReader: string;
  closePeople: string;
}

export interface ReadingSnapshot {
  credit: string;
  quote: string;
  quoteCite: string;
  parts: ReadingPart[];
}

export interface ReadingsData {
  date: string;
  today: string;
  day: DayView;
  readingsLang: string | null;
  readings: ReadingSnapshot | null;
  availableLanguages: string[];
  previous: string;
  next: string;
}

export interface PublicPrayer {
  slug: string;
  title: string;
  category: string;
  readingTime: string;
  lang: string;
  body: string;
  availableLanguages: string[];
}

export interface PrayersData {
  categories: { name: string; count: number }[];
  prayers: PublicPrayer[];
}

export interface SongBlock {
  type: 'VERSE' | 'REFRAIN';
  body: string;
}

export interface PublicSong {
  slug: string;
  title: string;
  lang: string;
  category: string;
  meta: string;
  blocks: SongBlock[];
}

export interface SongsData {
  languages: { code: string; nativeName: string; count: number }[];
  categories: string[];
  songs: PublicSong[];
}

export interface SearchData {
  q: string;
  readings: { date: string; dayName: string; citations: string }[];
  prayers: PublicPrayer[];
  songs: PublicSong[];
}

// ------------------------------------------------------------------ portal

export type Role = 'ADMIN' | 'EDITOR';

export interface Me {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface PortalLanguage {
  code: string;
  nativeName: string;
  englishName: string;
  enabled: boolean;
  isDefault: boolean;
  songsOnly: boolean;
}

export interface CategoryDto {
  id: number;
  name: string;
  count: number;
}

export interface Meta {
  contentLanguages: PortalLanguage[];
  songLanguages: PortalLanguage[];
  prayerCategories: CategoryDto[];
  songCategories: CategoryDto[];
  readingTimes: string[];
  partKinds: string[];
}

export interface ActivityEntry {
  id: number;
  at: string;
  who: string;
  what: string;
  item: string;
}

export interface DraftItem {
  kind: 'READING' | 'PRAYER' | 'SONG';
  title: string;
  lang: string;
  nativeName: string;
  who: string;
  updatedAt: string;
  date: string | null;
  id: number | null;
  status: ContentStatus;
}

export interface Dashboard {
  today: string;
  day: DayView | null;
  coverage: { days: string[]; rows: { lang: string; nativeName: string; cells: ContentStatus[]; ready: number }[] };
  drafts: DraftItem[];
  activity: ActivityEntry[];
}

export interface CalendarData {
  month: string;
  today: string;
  languages: PortalLanguage[];
  days: { date: string; label: string; colour: Colour; statuses: Record<string, ContentStatus> }[];
}

export interface ReadingEditorData {
  date: string;
  colour: Colour;
  cycle: string;
  names: Record<string, { dayName: string; saint: string }>;
  languages: PortalLanguage[];
  sets: Record<string, { lang: string; status: ContentStatus; working: ReadingSnapshot; who: string; updatedAt: string }>;
  activityLabel: string;
}

export interface PrayerRow {
  id: number;
  title: string;
  category: string;
  statuses: Record<string, ContentStatus>;
  live: boolean;
  who: string;
  updatedAt: string;
}

export interface PrayerDetail {
  id: number;
  slug: string;
  categoryId: number;
  readingTime: string;
  tags: string;
  source: string;
  translations: Record<string, { title: string; body: string; status: ContentStatus; who: string; updatedAt: string }>;
  who: string;
  updatedAt: string;
}

export type Rights = 'PUBLIC_DOMAIN' | 'LICENSED' | 'NEEDS_CHECKING';

export interface SongRow {
  id: number;
  title: string;
  category: string;
  lang: string;
  status: ContentStatus;
  rights: Rights;
  who: string;
  updatedAt: string;
}

export interface SongDetail {
  id: number;
  slug: string;
  lang: string;
  categoryId: number;
  rights: Rights;
  licenceNumber: string;
  lyrics: { title: string; author: string; tune: string; blocks: SongBlock[] };
  status: ContentStatus;
  who: string;
  updatedAt: string;
}

export interface UserRow {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: 'INVITED' | 'ACTIVE' | 'DEACTIVATED';
  lastSignInAt: string | null;
  isMe: boolean;
}

export interface SettingsData {
  languages: PortalLanguage[];
  prayerCategories: CategoryDto[];
  songCategories: CategoryDto[];
  signIn: { codeExpiryMinutes: number; sessionDays: number; allowedDomains: string };
}
