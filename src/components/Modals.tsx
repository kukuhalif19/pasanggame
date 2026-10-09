import { useState } from 'react';
import { X, Check } from '@phosphor-icons/react';
import type { Tile } from '../types';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  rack: Tile[];
  onConfirmSwap: (tiles: Tile[]) => void;
}

export function SwapModal({
  isOpen,
  onClose,
  rack,
  onConfirmSwap,
}: SwapModalProps) {
  const [selectedToSwap, setSelectedToSwap] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    if (selectedToSwap.includes(id)) {
      setSelectedToSwap(selectedToSwap.filter((tId) => tId !== id));
    } else {
      if (selectedToSwap.length < 5) {
        setSelectedToSwap([...selectedToSwap, id]);
      }
    }
  };

  const handleConfirm = () => {
    const tiles = rack.filter((t) => selectedToSwap.includes(t.id));
    onConfirmSwap(tiles);
    setSelectedToSwap([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-[var(--color-surface)] border border-[#262633] rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white">Tukar Huruf</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-[#262633]"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Pilih 1 sampai 5 huruf yang ingin kamu tukar dengan huruf acak dari kantong. Kamu akan mengorbankan 1 giliran.
        </p>

        {/* Rack Selection */}
        <div className="flex justify-center gap-1.5 mb-5 flex-wrap">
          {rack.map((tile) => {
            const isSelected = selectedToSwap.includes(tile.id);
            return (
              <button
                key={tile.id}
                onClick={() => toggleSelect(tile.id)}
                className={`relative flex flex-col items-center justify-center w-11 h-12 rounded-xl font-bold transition-all border ${
                  isSelected
                    ? 'bg-[#F97316] text-white border-[#FB923C] shadow-lg shadow-[#F97316]/30 -translate-y-1'
                    : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] hover:bg-[#252533] border-[#2D2D3B]'
                }`}
              >
                <span className="text-base font-extrabold">
                  {tile.letter || (tile.isBlank ? '?' : '')}
                </span>
                <span className="text-[9px] absolute bottom-1 right-1 font-semibold opacity-60">
                  {tile.value}
                </span>
                {isSelected && (
                  <Check
                    size={12}
                    weight="bold"
                    className="absolute top-1 right-1 text-white"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-[var(--color-surface-elevated)] hover:bg-[#262633] text-xs font-bold text-[var(--color-text-muted)] hover:text-white border border-[#2D2D3B] transition-all"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedToSwap.length === 0}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white shadow-lg shadow-[#F97316]/25 transition-all"
          >
            Tukar ({selectedToSwap.length})
          </button>
        </div>
      </div>
    </div>
  );
}

// 2. Wildcard Blank Tile Modal
interface WildcardModalProps {
  isOpen: boolean;
  onSelectLetter: (letter: string) => void;
  onClose?: () => void;
}

export function WildcardModal({ isOpen, onSelectLetter, onClose }: WildcardModalProps) {
  if (!isOpen) return null;

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-[var(--color-surface)] border border-[#262633] rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#9333EA] flex items-center justify-center font-black text-white text-base shadow-md shadow-[#7C3AED]/30">
            ?
          </span>
          <h3 className="text-lg font-bold text-white">
            Pilih Huruf Wildcard
          </h3>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mb-4 text-center">
          Pilih huruf (A-Z) yang ingin diwakili oleh ubin <strong className="text-white">?</strong> (0 poin) ini:
        </p>

        <div className="grid grid-cols-6 gap-1.5 max-h-56 overflow-y-auto p-1 mb-4">
          {alphabet.map((char) => (
            <button
              key={char}
              data-testid={`wildcard-letter-${char}`}
              onClick={() => onSelectLetter(char)}
              className="py-2.5 rounded-lg bg-[var(--color-surface-elevated)] hover:bg-[#7C3AED] hover:text-white font-extrabold text-sm border border-[#2D2D3B] transition-all hover:scale-105 active:scale-95"
            >
              {char}
            </button>
          ))}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[var(--color-surface-elevated)] hover:bg-[#262633] text-xs font-bold text-[var(--color-text-muted)] hover:text-white border border-[#2D2D3B] transition-all"
          >
            Batal
          </button>
        )}
      </div>
    </div>
  );
}

// 3. Game Over Modal
interface GameOverModalProps {
  isOpen: boolean;
  winnerName: string;
  players: { name: string; score: number }[];
  onBackToLobby: () => void;
}

export function GameOverModal({
  isOpen,
  winnerName,
  players,
  onBackToLobby,
}: GameOverModalProps) {
  if (!isOpen) return null;

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm bg-[var(--color-surface)] border border-[#262633] rounded-2xl p-6 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#F97316] to-[#FBBF24] flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg shadow-[#F97316]/30">
          🏆
        </div>
        <h2 className="text-2xl font-black text-white mb-1">Permainan Selesai!</h2>
        <p className="text-sm text-[#F97316] font-bold mb-6">
          Selamat, {winnerName} Menang!
        </p>

        {/* Leaderboard Final */}
        <div className="flex flex-col gap-2 mb-6">
          {sortedPlayers.map((p, idx) => (
            <div
              key={p.name}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                idx === 0
                  ? 'bg-[#7C3AED]/20 border-[#7C3AED]/40'
                  : 'bg-[var(--color-surface-elevated)] border-[#262633]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-black w-5 text-[var(--color-text-muted)]">
                  #{idx + 1}
                </span>
                <span className="text-sm font-bold text-white">{p.name}</span>
              </div>
              <span className="text-base font-black text-[#F97316]">
                {p.score} <span className="text-[10px] text-[var(--color-text-muted)]">PTS</span>
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onBackToLobby}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:opacity-95 text-white font-bold text-base shadow-lg shadow-[#F97316]/25 transition-all"
        >
          Kembali ke Lobby
        </button>
      </div>
    </div>
  );
}
