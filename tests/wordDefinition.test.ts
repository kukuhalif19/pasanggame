import { describe, expect, it } from 'vitest';
import {
  parseEnglishDefinition,
  parseIndonesianDefinition,
} from '../src/services/wordDefinition';

describe('word definition parsers', () => {
  it('mengambil definisi Inggris pertama yang tersedia', () => {
    const result = parseEnglishDefinition([
      {
        meanings: [
          { definitions: [{ definition: 'Large, great.' }] },
        ],
      },
    ]);

    expect(result).toEqual({ definition: 'Large, great.', partOfSpeech: undefined });
  });

  it('mengambil makna Indonesia pertama dan menghapus heading Wiktionary', () => {
    const result = parseIndonesianDefinition({
      query: {
        pages: {
          '123': {
            extract: '\n== Bahasa Indonesia ==\n\nru·mah\n\ntempat atau bangunan untuk hunian\n\n== Bahasa Banjar ==\n\nrumah',
          },
        },
      },
    });

    expect(result).toEqual({ definition: 'tempat atau bangunan untuk hunian' });
  });

  it('mengembalikan null untuk respons API yang tidak memiliki definisi', () => {
    expect(parseEnglishDefinition({})).toBeNull();
    expect(parseIndonesianDefinition({ query: { pages: {} } })).toBeNull();
  });
});
