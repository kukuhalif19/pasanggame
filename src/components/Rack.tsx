import { ArrowsClockwise, ArrowsLeftRight, FastForward, ArrowUUpLeft, PaperPlaneRight } from '@phosphor-icons/react';
import type { Tile } from '../types';

interface RackProps {
  rack: Tile[];
  selectedTile: Tile | null;
  onSelectTile: (tile: Tile) => void;
  onShuffle: () => void;
  onSwapClick: () => void;
  onSkip: () => void;
  onRecall: () => void;
  onRecallLast: () => void;
  onPlay: () => void;
  canPlay: boolean;
  hasPlacements: boolean;
  isMyTurn: boolean;
}

export default function Rack({
  rack,
  selectedTile,
  onSelectTile,
  onShuffle,
  onSwapClick,
  onSkip,
  onRecall,
  onRecallLast,
  onPlay,
  canPlay,
  hasPlacements,
  isMyTurn,
}: RackProps) {
  return (
    <div className="w-full flex flex-col items-center gap-3 max-w-[440px] px-2 select-none">
      {/* 7 Tiles di Rack */}
      <div className="flex items-center justify-center gap-1.5 p-2 rounded-2xl bg-[var(--color-surface)] border border-[#262633] shadow-lg w-full">
        {rack.map((tile) => {
          const isSelected = selectedTile?.id === tile.id;

          return (
            <button
              key={tile.id}
              data-testid="rack-tile"
              data-tile-id={tile.id}
              data-letter={tile.letter || (tile.isBlank ? '?' : '')}
              data-selected={isSelected ? 'true' : 'false'}
              onClick={() => onSelectTile(tile)}
              className={`relative flex flex-col items-center justify-center w-11 h-12 rounded-xl font-bold transition-all border ${
                isSelected
                  ? 'bg-gradient-to-t from-[#7C3AED] to-[#9333EA] text-white border-[#C084FC] -translate-y-2 shadow-lg shadow-[#7C3AED]/40 scale-105'
                  : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] hover:bg-[#252533] border-[#2D2D3B] hover:-translate-y-0.5'
              }`}
            >
              <span className="text-base font-extrabold">
                {tile.letter || (tile.isBlank ? '?' : '')}
              </span>
              <span className="text-[9px] absolute bottom-1 right-1 font-semibold opacity-60">
                {tile.value}
              </span>
            </button>
          );
        })}

        {rack.length === 0 && (
          <div className="py-2 text-xs text-[var(--color-text-muted)] italic">
            Rack kosong
          </div>
        )}
      </div>

      {/* Action Buttons: Shuffle, Swap, Skip, Recall All, Recall Last, Play */}
      <div className="w-full flex flex-col gap-2">
        <div className="grid grid-cols-5 gap-1.5">
          {/* Shuffle */}
          <button
            onClick={onShuffle}
            className="flex flex-col items-center justify-center gap-0.5 py-2 px-0.5 rounded-xl bg-[var(--color-surface)] border border-[#262633] text-[var(--color-text-muted)] hover:text-white hover:bg-[#1E1E28] text-[10px] font-semibold transition-all"
            title="Acak posisi huruf"
          >
            <ArrowsClockwise size={15} weight="bold" />
            <span>Acak</span>
          </button>

          {/* Swap */}
          <button
            onClick={onSwapClick}
            disabled={!isMyTurn || hasPlacements}
            className="flex flex-col items-center justify-center gap-0.5 py-2 px-0.5 rounded-xl bg-[var(--color-surface)] border border-[#262633] text-[var(--color-text-muted)] hover:text-white hover:bg-[#1E1E28] disabled:opacity-30 disabled:hover:bg-[var(--color-surface)] text-[10px] font-semibold transition-all"
            title="Tukar huruf dari sisa tas (korbankan 1 turn)"
          >
            <ArrowsLeftRight size={15} weight="bold" />
            <span>Tukar</span>
          </button>

          {/* Skip / Lewat */}
          <button
            onClick={onSkip}
            disabled={!isMyTurn || hasPlacements}
            className="flex flex-col items-center justify-center gap-0.5 py-2 px-0.5 rounded-xl bg-[var(--color-surface)] border border-[#262633] text-[var(--color-text-muted)] hover:text-white hover:bg-[#1E1E28] disabled:opacity-30 disabled:hover:bg-[var(--color-surface)] text-[10px] font-semibold transition-all"
            title="Lewati giliran"
          >
            <FastForward size={15} weight="bold" />
            <span>Lewat</span>
          </button>

          {/* Recall All - Tarik Semua */}
          <button
            onClick={onRecall}
            disabled={!hasPlacements}
            className="flex flex-col items-center justify-center gap-0.5 py-2 px-0.5 rounded-xl bg-[var(--color-surface)] border border-[#262633] text-[#EF4444] hover:bg-[#EF4444]/10 disabled:opacity-30 disabled:hover:bg-[var(--color-surface)] text-[10px] font-semibold transition-all"
            title="Tarik kembali SEMUA huruf yang sudah diletakkan"
          >
            <ArrowUUpLeft size={15} weight="bold" />
            <span>Semua</span>
          </button>

          {/* Recall Last - Tarik Terakhir */}
          <button
            onClick={onRecallLast}
            disabled={!hasPlacements}
            className="flex flex-col items-center justify-center gap-0.5 py-2 px-0.5 rounded-xl bg-[var(--color-surface)] border border-[#262633] text-[#F97316] hover:bg-[#F97316]/10 disabled:opacity-30 disabled:hover:bg-[var(--color-surface)] text-[10px] font-semibold transition-all"
            title="Tarik huruf terakhir yang diletakkan"
          >
            <ArrowUUpLeft size={15} weight="bold" />
            <span>1x</span>
          </button>
        </div>

        {/* Play / Submit Move */}
        <button
          onClick={onPlay}
          disabled={!isMyTurn || !canPlay}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:opacity-95 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-[#F97316]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          <PaperPlaneRight size={18} weight="fill" />
          {isMyTurn ? 'Tempatkan Kata' : 'Menunggu Giliranmu...'}
        </button>

        {/* Status message saat bukan giliran */}
        {!isMyTurn && (
          <p className="text-center text-xs text-[var(--color-text-muted)]">
            ✋ Bukan giliranmu — tunggu giliranmu untuk menaruh huruf ke papan
          </p>
        )}
      </div>
    </div>
  );
}
