import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateRoomCode(): string {
  // 6 karakter tanpa 0/O/1/I/L
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Buang pemain duplikat berdasarkan id (pertahankan urutan kemunculan pertama).
 * Duplikat bikin rotasi giliran kacau: index pemain beda antar tab, sehingga
 * "next player" bisa menunjuk orang yang sama dan giliran seolah tidak berpindah.
 */
export function dedupePlayers<T extends { id: string }>(players: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const p of players) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    result.push(p);
  }
  return result;
}
