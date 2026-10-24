import { describe, expect, it } from 'vitest';
import { paragraphs, parseParagraphs } from './readingText';

describe('parseParagraphs', () => {
  it('splits verses on bracketed numbers and paragraphs on blank lines', () => {
    const out = parseParagraphs('[7] But to every one. [8] Wherefore he saith.\n\n[11] And he gave some apostles,');
    expect(out).toEqual([
      [
        { n: '7', t: 'But to every one.' },
        { n: '8', t: 'Wherefore he saith.' },
      ],
      [{ n: '11', t: 'And he gave some apostles,' }],
    ]);
  });

  it('keeps unnumbered text as a verse without a number', () => {
    expect(parseParagraphs('Alleluia, alleluia.\nI desire not the death of the wicked.')).toEqual([
      [{ n: '', t: 'Alleluia, alleluia.\nI desire not the death of the wicked.' }],
    ]);
  });

  it('ignores empty input', () => {
    expect(parseParagraphs('  \n\n ')).toEqual([]);
  });
});

describe('paragraphs', () => {
  it('keeps line breaks inside a paragraph', () => {
    expect(paragraphs('Glory be,\nas it was.\n\nAmen.')).toEqual(['Glory be,\nas it was.', 'Amen.']);
  });
});
