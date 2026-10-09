import type {
  BoardCell,
  Tile,
  Player,
  WordBattleState,
  BonusType,
} from '../types';
import {
  BOARD_SIZE,
  BONUS_LAYOUT,
  createInitialTileBag,
} from './wordBattleConstants';
import { isValidWord } from './dictionary';

// 1. Inisialisasi Papan 13x13 Kosong
export function createEmptyBoard(): BoardCell[][] {
  const board: BoardCell[][] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    const row: BoardCell[] = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      const key = `${r},${c}`;
      const bonus: BonusType | null = BONUS_LAYOUT[key] || null;
      row.push({
        row: r,
        col: c,
        tile: null,
        bonus,
        bonusUsed: false,
      });
    }
    board.push(row);
  }

  return board;
}

// 2. Inisialisasi State Awal Word Battle
export function initWordBattle(players: Player[]): {
  state: WordBattleState;
  updatedPlayers: Player[];
} {
  const stock = createInitialTileBag();
  const board = createEmptyBoard();

  // Bagikan 7 tile ke setiap pemain
  const updatedPlayers = players.map((player) => {
    const rack: Tile[] = [];
    for (let i = 0; i < 7; i++) {
      const tile = stock.pop();
      if (tile) rack.push(tile);
    }
    return {
      ...player,
      score: 0,
      rack,
    };
  });

  const state: WordBattleState = {
    board,
    // Pemain pertama = yang paling awal join (deterministik di semua tab)
    currentPlayerId:
      [...updatedPlayers].sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0))[0]?.id || '',
    turnStartTime: Date.now(),
    stock,
    consecutivePassRounds: 0,
    placedWords: [],
    winnerId: null,
    winnerNames: null,
  };

  return { state, updatedPlayers };
}

// 3. Hitung Skor Kata & Multiplier
export interface PendingPlacement {
  row: number;
  col: number;
  tile: Tile;
}

export interface PlacedWordInfo {
  word: string;
  tiles: { tile: Tile; row: number; col: number; isPending: boolean }[];
  score: number;
}

function hasAdjacentTile(row: number, col: number, board: BoardCell[][]): boolean {
  const dirs = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
  ];
  for (const [dr, dc] of dirs) {
    const r = row + dr;
    const c = col + dc;
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c].tile) {
      return true;
    }
  }
  return false;
}

function getTileLetter(tile: Tile): string {
  return tile.letter || tile.displayLetter || 'A';
}

function getCellLetter(
  board: BoardCell[][],
  row: number,
  col: number,
  placements: PendingPlacement[]
): string | null {
  const pending = placements.find((p) => p.row === row && p.col === col);
  if (pending) return getTileLetter(pending.tile);
  const placed = board[row][col].tile;
  if (placed) return getTileLetter(placed);
  return null;
}

function readWordFromLine(
  board: BoardCell[][],
  placements: PendingPlacement[],
  startRow: number,
  startCol: number,
  direction: 'horizontal' | 'vertical'
): PlacedWordInfo | null {
  const placedSet = new Set(placements.map((p) => `${p.row},${p.col}`));
  const dRow = direction === 'horizontal' ? 0 : 1;
  const dCol = direction === 'horizontal' ? 1 : 0;

  // Mundur ke awal run
  let r = startRow;
  let c = startCol;
  while (r >= 0 && c >= 0 && getCellLetter(board, r, c, placements)) {
    r -= dRow;
    c -= dCol;
  }
  r += dRow;
  c += dCol;

  // Scan satu run penuh di garis ini
  const runTiles: PlacedWordInfo['tiles'] = [];
  while (r < BOARD_SIZE && c < BOARD_SIZE) {
    const letter = getCellLetter(board, r, c, placements);
    if (!letter) break;
    const pending = placements.find((p) => p.row === r && p.col === c);
    const cellTile = pending ? pending.tile : board[r][c].tile!;
    runTiles.push({ tile: cellTile, row: r, col: c, isPending: !!pending });
    r += dRow;
    c += dCol;
  }

  // Dari run ini, ambil sub-run minimal 2 huruf yang mengandung tile pending.
  // Ini menangani huruf lama di kiri/kanan/atas/bawah tile yang kita taruh,
  // sehingga P + ANAS selalu terbaca PANAS, bukan ANASP.
  const best: PlacedWordInfo['tiles'] = [];
  for (let i = 0; i < runTiles.length; i++) {
    for (let j = i + 1; j < runTiles.length; j++) {
      const slice = runTiles.slice(i, j + 1);
      if (slice.some((t) => placedSet.has(`${t.row},${t.col}`)) && slice.length > best.length) {
        best.length = 0;
        best.push(...slice);
      }
    }
  }

  if (best.length < 2) return null;

  const word = best.map((t) => getTileLetter(t.tile)).join('');
  return { word, tiles: best, score: 0 };
}

export function calculateScore(
  placements: PendingPlacement[],
  board: BoardCell[][]
): { score: number; isValidPlacement: boolean; message?: string; words?: PlacedWordInfo[] } {
  if (placements.length === 0) {
    return { score: 0, isValidPlacement: false, message: 'Belum ada huruf yang diletakkan' };
  }

  // Duplicate guards
  const usedTileIds = new Set<string>();
  const usedCells = new Set<string>();
  for (const p of placements) {
    if (usedTileIds.has(p.tile.id)) {
      return { score: 0, isValidPlacement: false, message: 'Huruf yang sama dipakai lebih dari sekali' };
    }
    usedTileIds.add(p.tile.id);
    const cellKey = `${p.row},${p.col}`;
    if (usedCells.has(cellKey)) {
      return { score: 0, isValidPlacement: false, message: 'Ada dua huruf di satu petak' };
    }
    usedCells.add(cellKey);
  }

  const rows = new Set(placements.map((p) => p.row));
  const cols = new Set(placements.map((p) => p.col));
  const isHorizontal = rows.size === 1;
  const isVertical = cols.size === 1;

  if (!isHorizontal && !isVertical && placements.length > 1) {
    return { score: 0, isValidPlacement: false, message: 'Huruf harus diletakkan dalam satu garis lurus' };
  }

  const isFirstMove = board.every((row) => row.every((cell) => cell.tile === null));
  if (isFirstMove) {
    const touchesCenter = placements.some((p) => p.row === 6 && p.col === 6);
    if (!touchesCenter) {
      return { score: 0, isValidPlacement: false, message: 'Langkah pertama wajib melewati bintang tengah (⭐)' };
    }
    if (placements.length < 2) {
      return { score: 0, isValidPlacement: false, message: 'Langkah pertama minimal 2 huruf' };
    }
  } else {
    const touchesExisting = placements.some((p) => hasAdjacentTile(p.row, p.col, board));
    if (!touchesExisting) {
      return { score: 0, isValidPlacement: false, message: 'Penempatan harus menyambung ke kata yang sudah ada di papan' };
    }
  }

  // Collect all words formed
  const mainDirection: 'horizontal' | 'vertical' =
    isHorizontal || (!isVertical && placements.length === 1) ? 'horizontal' : 'vertical';
  const wordsToScore: PlacedWordInfo[] = [];

  // Main word (along the line of placements)
  const mainWord = readWordFromLine(board, placements, placements[0].row, placements[0].col, mainDirection);
  if (mainWord) wordsToScore.push(mainWord);

  // Cross words (perpendicular, for each newly placed tile)
  const crossDirection: 'horizontal' | 'vertical' =
    mainDirection === 'horizontal' ? 'vertical' : 'horizontal';
  for (const p of placements) {
    const cross = readWordFromLine(board, placements, p.row, p.col, crossDirection);
    if (cross && !wordsToScore.some((w) => w.word === cross.word && w.tiles.length === cross.tiles.length)) {
      wordsToScore.push(cross);
    }
  }

  if (wordsToScore.length === 0) {
    return { score: 0, isValidPlacement: false, message: 'Tidak ada kata yang terbentuk' };
  }

  // Validate every formed word
  for (const w of wordsToScore) {
    const lower = w.word.toLowerCase();
    if (lower.length >= 2 && !isValidWord(lower)) {
      return {
        score: 0,
        isValidPlacement: false,
        message: `Kata "${w.word.toUpperCase()}" tidak ditemukan dalam kamus`,
      };
    }
  }

  // Score all words
  let totalScore = 0;
  for (const w of wordsToScore) {
    let wordMultiplier = 1;
    let wordScore = 0;
    for (const t of w.tiles) {
      const cell = board[t.row][t.col];
      let letterScore = t.tile.value;
      // Bonus only counts for newly placed tiles
      if (t.isPending && cell.bonus && !cell.bonusUsed) {
        if (cell.bonus === '2L') letterScore *= 2;
        if (cell.bonus === '3L') letterScore *= 3;
        if (cell.bonus === '2W' || cell.bonus === 'CENTER') wordMultiplier *= 2;
        if (cell.bonus === '3W') wordMultiplier *= 3;
      }
      wordScore += letterScore;
    }
    totalScore += wordScore * wordMultiplier;
  }

  // Bingo bonus
  if (placements.length === 7) {
    totalScore += 50;
  }

  return { score: totalScore, isValidPlacement: true, words: wordsToScore };
}

// 4. Draw Tile dari Stock untuk Isi Rack Kembali sampai 7
export function drawTiles(
  currentRack: Tile[],
  stock: Tile[],
  countNeeded: number
): { newRack: Tile[]; remainingStock: Tile[] } {
  const newStock = [...stock];
  const newRack = [...currentRack];

  for (let i = 0; i < countNeeded; i++) {
    const tile = newStock.pop();
    if (tile) {
      newRack.push(tile);
    }
  }

  return { newRack, remainingStock: newStock };
}

// 5. Swap Tile (Maks 5 tile, korbankan turn)
export function swapTiles(
  currentRack: Tile[],
  tilesToSwap: Tile[],
  stock: Tile[]
): { newRack: Tile[]; newStock: Tile[] } {
  if (stock.length < tilesToSwap.length) {
    return { newRack: currentRack, newStock: stock };
  }

  // Ambil huruf baru dari stock
  const remainingRack = currentRack.filter(
    (t) => !tilesToSwap.some((swap) => swap.id === t.id)
  );

  const { newRack, remainingStock } = drawTiles(
    remainingRack,
    stock,
    tilesToSwap.length
  );

  // Masukkan kembali tile lama ke stock lalu shuffle
  const updatedStock = [...remainingStock, ...tilesToSwap];
  for (let i = updatedStock.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [updatedStock[i], updatedStock[j]] = [updatedStock[j], updatedStock[i]];
  }

  return { newRack, newStock: updatedStock };
}
