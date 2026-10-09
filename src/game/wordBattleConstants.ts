import type { BonusType, Tile } from '../types';

export const BOARD_SIZE = 13;

// Bonus layout 13×13 (simetris)
// 1-indexed in PRD, here 0-indexed: 0-12
export const BONUS_LAYOUT: { [key: string]: BonusType } = {
  // Center
  '6,6': 'CENTER',

  // Triple Word (TW) - corners and edges
  '0,0': '3W',
  '0,7': '3W',
  '0,12': '3W',
  '7,0': '3W',
  '7,12': '3W',
  '12,0': '3W',
  '12,7': '3W',
  '12,12': '3W',

  // Double Word (DW)
  '1,1': '2W',
  '1,11': '2W',
  '2,2': '2W',
  '2,10': '2W',
  '3,3': '2W',
  '3,9': '2W',
  '11,1': '2W',
  '11,11': '2W',
  '10,2': '2W',
  '10,10': '2W',
  '9,3': '2W',
  '9,9': '2W',

  // Triple Letter (TL)
  '1,5': '3L',
  '1,8': '3L',
  '4,4': '3L',
  '4,8': '3L',
  '5,1': '3L',
  '5,11': '3L',
  '8,4': '3L',
  '8,8': '3L',
  '7,5': '3L',
  '7,8': '3L',
  '11,5': '3L',
  '11,8': '3L',

  // Double Letter (DL)
  '0,3': '2L',
  '0,9': '2L',
  '2,6': '2L',
  '2,8': '2L',
  '3,0': '2L',
  '3,6': '2L',
  '3,12': '2L',
  '5,5': '2L',
  '5,7': '2L',
  '6,2': '2L',
  '6,10': '2L',
  '7,3': '2L',
  '7,9': '2L',
  '9,0': '2L',
  '9,6': '2L',
  '9,12': '2L',
  '10,6': '2L',
  '10,8': '2L',
  '12,3': '2L',
  '12,9': '2L',
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
