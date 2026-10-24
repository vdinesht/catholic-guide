export interface Verse {
  n: string;
  t: string;
}

/**
 * Reading text is plain: verse numbers in square brackets ("[7] But to every one…"),
 * a blank line between paragraphs. Text before the first number is a verse with no number.
 */
export function parseParagraphs(body: string): Verse[][] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const verses: Verse[] = [];
      const re = /\[(\w{1,4})\]\s*/g;
      let last = 0;
      let n = '';
      let m: RegExpExecArray | null;
      while ((m = re.exec(p)) !== null) {
        const text = p.slice(last, m.index).trim();
        if (text || n) verses.push({ n, t: text });
        n = m[1];
        last = re.lastIndex;
      }
      const tail = p.slice(last).trim();
      if (tail || n) verses.push({ n, t: tail });
      return verses;
    });
}

/** Paragraphs of a prayer or lyric, keeping single line breaks inside each one. */
export function paragraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
