// Interface strings for the public site. Tamil strings come from the design; anything
// without a Tamil string falls back to English. Have a Tamil-speaking editor review
// additions before release.

const en = {
  today: 'Today',
  readings: 'Readings',
  prayers: 'Prayers',
  songs: 'Songs',
  calendar: 'Calendar',
  sections: 'Sections',
  language: 'Language',
  todaysReadings: "Today's readings",
  readAll: 'Read all',
  saintOfDay: 'Saint of the day',
  onThisPage: 'On this page',
  translation: 'Translation',
  hymnForToday: 'Hymn for today',
  comingUp: 'Coming up',
  tomorrow: 'Tomorrow',
  prayerFor: 'Prayer for',
  rosary: 'The Holy Rosary',
  prepareForSunday: 'Prepare for Sunday',
  readLyrics: 'Read the lyrics',
  prayRosary: 'Pray the Rosary',
  todaysGospel: "Today's Gospel",
  explore: 'Explore',
  chooseDay: 'Choose a day',
  pickDate: 'Pick a date',
  previousDay: 'Previous day',
  nextDay: 'Next day',
  noReadings: "The readings for this day haven't been published yet.",
  showingEnglish: 'Not yet available in your language — showing English.',
  searchPlaceholder: 'Search readings, prayers, songs',
};

type Strings = typeof en;

const ta: Partial<Strings> = {
  today: 'இன்று',
  readings: 'வாசகங்கள்',
  prayers: 'செபங்கள்',
  songs: 'பாடல்கள்',
  sections: 'பகுதிகள்',
  language: 'மொழி',
  todaysReadings: 'இன்றைய வாசகங்கள்',
  saintOfDay: 'இன்றைய புனிதர்',
  onThisPage: 'இன்றைய வாசகங்கள்',
  translation: 'மொழிபெயர்ப்பு',
  rosary: 'செபமாலை',
};

const STRINGS: Record<string, Partial<Strings>> = { en, ta };

export type StringKey = keyof Strings;

export function t(lang: string, key: StringKey): string {
  return STRINGS[lang]?.[key] ?? en[key];
}

/** Reading part names. The API stores the English name; Tamil readers see these. */
const KINDS_TA: Record<string, string> = {
  'First Reading': 'முதல் வாசகம்',
  'Responsorial Psalm': 'பதிலுரைப் பாடல்',
  'Second Reading': 'இரண்டாம் வாசகம்',
  'Gospel Acclamation': 'நற்செய்திக்கு முன் வாழ்த்தொலி',
  Gospel: 'நற்செய்தி வாசகம்',
};

export function kindLabel(kind: string, lang: string): string {
  return lang === 'ta' ? (KINDS_TA[kind] ?? kind) : kind;
}

/** The Rosary mysteries by weekday: Joyful Mon & Sat, Sorrowful Tue & Fri, Glorious Wed & Sun, Luminous Thu. */
const MYSTERIES = {
  joyful: {
    name: 'Joyful Mysteries',
    ta: 'மகிழ்ச்சி மறைபொருள்கள்',
    items: ['The Annunciation', 'The Visitation', 'The Nativity', 'The Presentation in the Temple', 'The Finding in the Temple'],
  },
  sorrowful: {
    name: 'Sorrowful Mysteries',
    items: ['The Agony in the Garden', 'The Scourging at the Pillar', 'The Crowning with Thorns', 'The Carrying of the Cross', 'The Crucifixion'],
  },
  glorious: {
    name: 'Glorious Mysteries',
    items: ['The Resurrection', 'The Ascension', 'The Descent of the Holy Spirit', 'The Assumption', 'The Coronation of Mary'],
  },
  luminous: {
    name: 'Luminous Mysteries',
    items: ['The Baptism of the Lord', 'The Wedding at Cana', 'The Proclamation of the Kingdom', 'The Transfiguration', 'The Institution of the Eucharist'],
  },
};

export function mysteriesFor(weekday: number): { name: string; ta?: string; items: string[] } {
  return [MYSTERIES.glorious, MYSTERIES.joyful, MYSTERIES.sorrowful, MYSTERIES.glorious, MYSTERIES.luminous, MYSTERIES.sorrowful, MYSTERIES.joyful][weekday];
}
