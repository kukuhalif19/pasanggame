import type { Player } from '../types';

/** Dua putaran penuh tanpa satu pun tile dimainkan dianggap deadlock. */
export function getPassEndThreshold(playerCount: number): number {
  return Math.max(1, playerCount) * 2;
}

export function hasPassEnded(consecutivePasses: number, playerCount: number): boolean {
  return consecutivePasses >= getPassEndThreshold(playerCount);
}

/**
 * Hitung skor akhir sesuai aturan akhir Scrabble.
 * - Pemain yang menghabiskan rack mendapat seluruh nilai tile lawan.
 * - Pada deadlock, semua pemain membayar nilai tile rack masing-masing.
 */
export function calculateFinalScores(
  players: Player[],
  finishingPlayerId: string | null,
): Player[] {
  const rackValue = (player: Player) =>
    player.rack.reduce((total, tile) => total + tile.value, 0);

  if (finishingPlayerId) {
    const bonus = players
      .filter((player) => player.id !== finishingPlayerId)
      .reduce((total, player) => total + rackValue(player), 0);

    return players.map((player) => {
      const penalty = player.id === finishingPlayerId ? 0 : rackValue(player);
      return {
        ...player,
        score: player.score + (player.id === finishingPlayerId ? bonus : -penalty),
      };
    });
  }

  return players.map((player) => ({
    ...player,
    score: player.score - rackValue(player),
  }));
}
