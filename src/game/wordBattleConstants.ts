import type { BonusType, Tile } from '../types';

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

// 100 Tiles Indonesian Distribution
export const INDONESIAN_TILE_DISTRIBUTION: { letter: string; value: number; count: number }[] = [
  // 1 Point
  { letter: 'A', value: 1, count: 17 },
  { letter: 'I', value: 1, count: 9 },
  { letter: 'U', value: 1, count: 7 },
  { letter: 'E', value: 1, count: 8 },
  { letter: 'O', value: 1, count: 7 },
  { letter: 'N', value: 1, count: 6 },
  { letter: 'S', value: 1, count: 5 },
  { letter: 'T', value: 1, count: 5 },

  // 2 Points
  { letter: 'R', value: 2, count: 5 },
  { letter: 'K', value: 2, count: 4 },
  { letter: 'L', value: 2, count: 4 },
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

export function createInitialTileBag(): Tile[] {
  const bag: Tile[] = [];
  let id = 1;

  for (const item of INDONESIAN_TILE_DISTRIBUTION) {
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
