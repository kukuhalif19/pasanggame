export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  rack: Tile[];
  isConnected: boolean;
  lastSeen?: number;
  /** Waktu join (ms). Dipakai sebagai dasar urutan giliran yang sama di semua tab. */
  joinedAt: number;
}

export interface Tile {
  id: string;
  letter: string;
  value: number;
  isBlank: boolean;
  assignedLetter?: string; // for blank tiles
  displayLetter?: string; // huruf yang dipilih saat blank diletakkan di papan
}

export interface BoardCell {
  row: number;
  col: number;
  tile: Tile | null;
  bonus: BonusType | null;
  bonusUsed: boolean;
}

export type BonusType = '2L' | '3L' | '2W' | '3W' | 'CENTER' | 'DL' | 'TL' | 'DW' | 'TW';

export interface Room {
  code: string;
  players: Player[];
  hostId: string;
  state: RoomState;
  gameType: GameType | null;
  settings: GameSettings;
  createdAt: number;
}

export type RoomState = 'lobby' | 'playing' | 'finished';

export type GameType = 'word-battle' | 'this-or-that' | 'truth-or-dare';

export interface GameSettings {
  turnTimerSeconds: 30 | 60 | 90;
  maxSwapTiles: number;
  language: 'id';
}

export interface WordBattleState {
  board: BoardCell[][];
  currentPlayerId: string;
  turnStartTime: number;
  stock: Tile[];
  consecutivePassRounds: number;
  placedWords: PlacedWord[];
  winnerId: string | null;
  winnerNames: string[] | null;
}

export interface PlacedWord {
  word: string;
  playerId: string;
  score: number;
  cells: { row: number; col: number }[];
  timestamp: number;
}

export type RealtimeEventType =
  | 'REQUEST_SYNC'
  | 'SYNC_ROOM_STATE'
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'START_GAME'
  | 'PLACE_WORD'
  | 'SWAP_TILES'
  | 'SKIP_TURN'
  | 'GAME_STATE';

export interface RealtimeEvent {
  type: RealtimeEventType;
  payload: unknown;
  timestamp: number;
  senderId?: string;
}
