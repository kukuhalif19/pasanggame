import { create } from 'zustand';
import type {
  Player,
  Room,
  GameType,
  GameSettings,
  WordBattleState,
} from '../types';
import { generateRoomCode, generateId } from '../utils';

interface GameState {
  // Connection
  localPlayer: Player | null;
  room: Room | null;

  // Word Battle specific
  wordBattle: WordBattleState | null;

  // Actions
  createRoom: (name: string, settings?: Partial<GameSettings>) => void;
  joinRoom: (roomCode: string, name: string) => void;
  startGame: (gameType: GameType) => void;
  leaveRoom: () => void;
  setRoom: (room: Room | null) => void;
  setLocalPlayer: (player: Player | null) => void;
  setWordBattle: (state: WordBattleState | null) => void;
}

const defaultSettings: GameSettings = {
  turnTimerSeconds: 60,
  maxSwapTiles: 5,
  language: 'id',
};

export const useGameStore = create<GameState>((set) => ({
  localPlayer: null,
  room: null,
  wordBattle: null,

  createRoom: (name, settings) => {
    const player: Player = {
      id: generateId(),
      name,
      isHost: true,
      score: 0,
      rack: [],
      isConnected: true,
      lastSeen: Date.now(),
      joinedAt: Date.now(),
    };

    const room: Room = {
      code: generateRoomCode(),
      players: [player],
      hostId: player.id,
      state: 'lobby',
      gameType: null,
      settings: { ...defaultSettings, ...settings },
      createdAt: Date.now(),
    };

    set({ localPlayer: player, room });
  },

  joinRoom: (_roomCode, name) => {
    const player: Player = {
      id: generateId(),
      name,
      isHost: false,
      score: 0,
      rack: [],
      isConnected: true,
      lastSeen: Date.now(),
      joinedAt: Date.now(),
    };

    // In mock mode, just set local player. Room will be synced via realtime.
    set({ localPlayer: player });
    // In real implementation, we'd connect to Supabase here
    // and receive the room state from the host
  },

  startGame: (gameType) => {
    set((state) => ({
      room: state.room ? { ...state.room, gameType, state: 'playing' } : null,
    }));
  },

  leaveRoom: () => {
    set({ localPlayer: null, room: null, wordBattle: null });
  },

  setRoom: (room) => set({ room }),
  setLocalPlayer: (player) => set({ localPlayer: player }),
  setWordBattle: (wordBattle) => set({ wordBattle }),
}));
