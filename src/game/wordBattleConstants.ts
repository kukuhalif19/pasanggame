import type { BonusType, Tile, GameLanguage } from '../types';

export const BOARD_SIZE = 17;

/** Titik pusat papan (bintang tengah). 17×17 → index 8,8. */
export const CENTER_INDEX = Math.floor(BOARD_SIZE / 2);

// Bonus layout 17×17 (simetri 180°, 61 petak bonus = 21.1%)
// Index 0-16 (0-indexed)
export const BONUS_LAYOUT: { [key: string]: BonusType } = {
  // Center
  '8,8': 'CENTER',

  // Triple Word (3W)
  '0,0': '3W',
  '0,8': '3W',
  '0,16': '3W',
  '8,0': '3W',
  '8,16': '3W',
  '16,0': '3W',
  '16,8': '3W',
  '16,16': '3W',

  // Double Word (2W)
  '1,1': '2W',
  '2,2': '2W',
  '3,3': '2W',
  '4,4': '2W',
  '1,15': '2W',
  '2,14': '2W',
  '3,13': '2W',
  '4,12': '2W',
  '15,1': '2W',
  '14,2': '2W',
  '13,3': '2W',
  '12,4': '2W',
  '15,15': '2W',
  '14,14': '2W',
  '13,13': '2W',
  '12,12': '2W',

  // Triple Letter (3L)
  '1,5': '3L',
  '1,11': '3L',
  '5,1': '3L',
  '5,5': '3L',
  '5,11': '3L',
  '5,15': '3L',
  '11,1': '3L',
  '11,5': '3L',
  '11,11': '3L',
  '11,15': '3L',
  '15,5': '3L',
  '15,11': '3L',

  // Double Letter (2L)
  '0,3': '2L',
  '0,13': '2L',
  '3,0': '2L',
  '3,16': '2L',
  '13,0': '2L',
  '13,16': '2L',
  '16,3': '2L',
  '16,13': '2L',
  '2,6': '2L',
  '2,10': '2L',
  '6,2': '2L',
  '6,6': '2L',
  '6,10': '2L',
  '6,14': '2L',
  '10,2': '2L',
  '10,6': '2L',
  '10,10': '2L',
  '10,14': '2L',
  '14,6': '2L',
  '14,10': '2L',
  '7,8': '2L',
  '9,8': '2L',
  '8,7': '2L',
  '8,9': '2L',
};

// 100 Tiles Indonesian Distribution (98 letters + 2 blanks)
export const INDONESIAN_TILE_DISTRIBUTION: { letter: string; value: number; count: number }[] = [
  // 1 Point
  { letter: 'A', value: 1, count: 12 },
  { letter: 'I', value: 1, count: 7 },
  { letter: 'U', value: 1, count: 7 },
  { letter: 'E', value: 1, count: 6 },
  { letter: 'O', value: 1, count: 7 },
  { letter: 'N', value: 1, count: 6 },
  { letter: 'S', value: 1, count: 4 },
  { letter: 'T', value: 1, count: 4 },

  // 2 Points
  { letter: 'R', value: 2, count: 5 },
  { letter: 'K', value: 2, count: 4 },
  { letter: 'L', value: 2, count: 3 },
  { letter: 'D', value: 2, count: 4 },
  { letter: 'M', value: 2, count: 3 },

  // 3 Points
  { letter: 'G', value: 3, count: 3 },
  { letter: 'B', value: 3, count: 3 },
  { letter: 'H', value: 3, count: 3 },
  { letter: 'P', value: 3, count: 3 },

  // 4 Points
  { letter: 'C', value: 4, count: 2 },
  { letter: 'J', value: 4, count: 2 },
  { letter: 'Y', value: 4, count: 2 },
  { letter: 'W', value: 4, count: 2 },

  // 5 Points
  { letter: 'V', value: 5, count: 2 },
  { letter: 'F', value: 5, count: 1 },

  // 8 Points
  { letter: 'Z', value: 8, count: 1 },
  { letter: 'Q', value: 8, count: 1 },
  { letter: 'X', value: 8, count: 1 },

  // Blank / Wildcard
  { letter: ' ', value: 0, count: 2 },
];

// 100 Tiles English Distribution (TWL06 / Standard Scrabble)
export const ENGLISH_TILE_DISTRIBUTION: { letter: string; value: number; count: number }[] = [
  // 1 Point
  { letter: 'E', value: 1, count: 12 },
  { letter: 'A', value: 1, count: 9 },
  { letter: 'I', value: 1, count: 9 },
  { letter: 'O', value: 1, count: 8 },
  { letter: 'N', value: 1, count: 6 },
  { letter: 'R', value: 1, count: 6 },
  { letter: 'T', value: 1, count: 6 },
  { letter: 'L', value: 1, count: 4 },
  { letter: 'S', value: 1, count: 4 },
  { letter: 'U', value: 1, count: 4 },

  // 2 Points
  { letter: 'D', value: 2, count: 4 },
  { letter: 'G', value: 2, count: 3 },

  // 3 Points
  { letter: 'B', value: 3, count: 2 },
  { letter: 'C', value: 3, count: 2 },
  { letter: 'M', value: 3, count: 2 },
  { letter: 'P', value: 3, count: 2 },

  // 4 Points
  { letter: 'F', value: 4, count: 2 },
  { letter: 'H', value: 4, count: 2 },
  { letter: 'V', value: 4, count: 2 },
  { letter: 'W', value: 4, count: 2 },
  { letter: 'Y', value: 4, count: 2 },

  // 5 Points
  { letter: 'K', value: 5, count: 1 },

  // 8 Points
  { letter: 'J', value: 8, count: 1 },
  { letter: 'X', value: 8, count: 1 },

  // 10 Points
  { letter: 'Q', value: 10, count: 1 },
  { letter: 'Z', value: 10, count: 1 },

  // Blank / Wildcard
  { letter: ' ', value: 0, count: 2 },
];

// 100 Tiles Hybrid Distribution (Mix mode: balanced for both languages)
export const HYBRID_TILE_DISTRIBUTION: { letter: string; value: number; count: number }[] = [
  // 1 Point — frekuensi tinggi di kedua bahasa
  { letter: 'E', value: 1, count: 8 },
  { letter: 'A', value: 1, count: 12 },
  { letter: 'I', value: 1, count: 8 },
  { letter: 'O', value: 1, count: 7 },
  { letter: 'U', value: 1, count: 6 },
  { letter: 'N', value: 1, count: 6 },
  { letter: 'R', value: 1, count: 5 },
  { letter: 'T', value: 1, count: 5 },
  { letter: 'S', value: 1, count: 5 },
  { letter: 'L', value: 1, count: 4 },

  // 2 Points
  { letter: 'D', value: 2, count: 4 },
  { letter: 'G', value: 2, count: 3 },
  { letter: 'K', value: 2, count: 3 },
  { letter: 'M', value: 2, count: 2 },

  // 3 Points
  { letter: 'B', value: 3, count: 2 },
  { letter: 'C', value: 3, count: 2 },
  { letter: 'H', value: 3, count: 2 },
  { letter: 'P', value: 3, count: 2 },

  // 4 Points
  { letter: 'F', value: 4, count: 2 },
  { letter: 'W', value: 4, count: 2 },
  { letter: 'Y', value: 4, count: 2 },
  { letter: 'V', value: 4, count: 2 },

  // 5 Points
  { letter: 'J', value: 5, count: 1 },

  // 8 Points
  { letter: 'X', value: 8, count: 1 },
  { letter: 'Z', value: 8, count: 1 },
  { letter: 'Q', value: 8, count: 1 },

  // Blank / Wildcard
  { letter: ' ', value: 0, count: 2 },
];

/**
 * Buat karung tile sesuai bahasa yang dipilih saat room dibuat.
 * - 'id'  → distribusi Indonesia
 * - 'en'  → distribusi Inggris (TWL06)
 * - 'mix' → distribusi hybrid (seimbang untuk kedua bahasa)
 */
export function createInitialTileBag(language: GameLanguage = 'id'): Tile[] {
  const distribution =
    language === 'en'
      ? ENGLISH_TILE_DISTRIBUTION
      : language === 'mix'
        ? HYBRID_TILE_DISTRIBUTION
        : INDONESIAN_TILE_DISTRIBUTION;

  const bag: Tile[] = [];
  let id = 1;

  for (const item of distribution) {
    for (let i = 0; i < item.count; i++) {
      bag.push({
        id: `tile-${id++}`,
        letter: item.letter === ' ' ? '' : item.letter,
        value: item.value,
        isBlank: item.letter === ' ',
      });
    }
  }

  // Shuffle bag (Fisher-Yates)
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }

  return bag;
}
