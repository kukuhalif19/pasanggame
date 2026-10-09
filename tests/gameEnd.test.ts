import { describe, it, expect } from 'vitest';
import { getPassEndThreshold, hasPassEnded, calculateFinalScores } from '../src/game/gameEnd';
import type { Player } from '../src/types';

describe('gameEnd', () => {
  describe('getPassEndThreshold', () => {
    it('2 pemain: threshold 4 pass', () => {
      expect(getPassEndThreshold(2)).toBe(4);
    });

    it('4 pemain: threshold 8 pass', () => {
      expect(getPassEndThreshold(4)).toBe(8);
    });

    it('1 pemain: threshold 2 pass', () => {
      expect(getPassEndThreshold(1)).toBe(2);
    });

    it('0 pemain: threshold 2 (minimum)', () => {
      expect(getPassEndThreshold(0)).toBe(2);
    });
  });

  describe('hasPassEnded', () => {
    it('2 pemain, 3 pass: belum berakhir', () => {
      expect(hasPassEnded(3, 2)).toBe(false);
    });

    it('2 pemain, 4 pass: game berakhir', () => {
      expect(hasPassEnded(4, 2)).toBe(true);
    });

    it('4 pemain, 7 pass: belum berakhir', () => {
      expect(hasPassEnded(7, 4)).toBe(false);
    });

    it('4 pemain, 8 pass: game berakhir', () => {
      expect(hasPassEnded(8, 4)).toBe(true);
    });
  });

  describe('calculateFinalScores', () => {
    it('winner memiliki rack kosong, dapat bonus dari lawan', () => {
      const players: Player[] = [
        {
          id: 'p1',
          name: 'Andi',
          score: 100,
          rack: [],
          isConnected: true,
          joinedAt: 1,
          isHost: false,
        },
        {
          id: 'p2',
          name: 'Budi',
          score: 95,
          rack: [
            { id: 't1', letter: 'A', value: 1, isBlank: false },
            { id: 't2', letter: 'B', value: 3, isBlank: false },
          ],
          isConnected: true,
          joinedAt: 2,
          isHost: false,
        },
      ];

      const result = calculateFinalScores(players, 'p1');
      expect(result[0].score).toBe(104); // 100 + (1+3) bonus
      expect(result[1].score).toBe(91); // 95 - (1+3) penalty
    });

    it('multiple losers: winner dapat bonus dari semua', () => {
      const players: Player[] = [
        {
          id: 'p1',
          name: 'Andi',
          score: 120,
          rack: [],
          isConnected: true,
          joinedAt: 1,
          isHost: true,
        },
        {
          id: 'p2',
          name: 'Budi',
          score: 100,
          rack: [{ id: 't1', letter: 'C', value: 3, isBlank: false }],
          isConnected: true,
          joinedAt: 2,
          isHost: false,
        },
        {
          id: 'p3',
          name: 'Citra',
          score: 110,
          rack: [{ id: 't2', letter: 'D', value: 2, isBlank: false }],
          isConnected: true,
          joinedAt: 3,
          isHost: false,
        },
      ];

      const result = calculateFinalScores(players, 'p1');
      expect(result[0].score).toBe(125); // 120 + (3+2) bonus
      expect(result[1].score).toBe(97); // 100 - 3 penalty
      expect(result[2].score).toBe(108); // 110 - 2 penalty
    });

    it('deadlock (finishingPlayerId null): semua pemain membayar penalty', () => {
      const players: Player[] = [
        {
          id: 'p1',
          name: 'Andi',
          score: 100,
          rack: [{ id: 't1', letter: 'A', value: 1, isBlank: false }],
          isConnected: true,
          joinedAt: 1,
          isHost: false,
        },
        {
          id: 'p2',
          name: 'Budi',
          score: 95,
          rack: [
            { id: 't2', letter: 'B', value: 3, isBlank: false },
            { id: 't3', letter: 'C', value: 3, isBlank: false },
          ],
          isConnected: true,
          joinedAt: 2,
          isHost: false,
        },
      ];

      const result = calculateFinalScores(players, null);
      expect(result[0].score).toBe(99); // 100 - 1
      expect(result[1].score).toBe(89); // 95 - (3+3)
    });

    it('all players empty rack on deadlock', () => {
      const players: Player[] = [
        {
          id: 'p1',
          name: 'Andi',
          score: 100,
          rack: [],
          isConnected: true,
          joinedAt: 1,
          isHost: false,
        },
        {
          id: 'p2',
          name: 'Budi',
          score: 95,
          rack: [],
          isConnected: true,
          joinedAt: 2,
          isHost: false,
        },
      ];

      const result = calculateFinalScores(players, null);
      expect(result[0].score).toBe(100); // 100 - 0
      expect(result[1].score).toBe(95); // 95 - 0
    });
  });
});
