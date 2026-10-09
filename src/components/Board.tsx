import type { BoardCell, Tile } from '../types';
import type { PendingPlacement } from '../game/wordBattleEngine';

interface BoardProps {
  board: BoardCell[][];
  pendingPlacements: PendingPlacement[];
  /** Koordinat kata terakhir yang sudah tervalidasi dan dikirim ke semua pemain. */
  highlightedCells: { row: number; col: number }[];
  onCellClick: (row: number, col: number) => void;
  selectedRackTile: Tile | null;
}

export default function Board({
  board,
  pendingPlacements,
  highlightedCells,
  onCellClick,
  selectedRackTile,
}: BoardProps) {
  const getCellBonusLabel = (cell: BoardCell) => {
    if (cell.bonus === 'CENTER') return '⭐';
    return cell.bonus || '';
  };

  const getCellBonusColor = (bonus: string | null) => {
    switch (bonus) {
      case '3W':
        return 'bg-[#EF4444] text-white border-[#DC2626]';
      case '2W':
        return 'bg-[#F97316] text-white border-[#EA580C]';
      case '3L':
        return 'bg-[#3B82F6] text-white border-[#2563EB]';
      case '2L':
        return 'bg-[#06B6D4] text-white border-[#0891B2]';
      case 'CENTER':
        return 'bg-[#FBBF24] text-[#7C2D12] border-[#F59E0B]';
      default:
        return 'bg-[#E8E0D0] border-[#D4C9B4] text-[#8B7D6B]';
    }
  };

  return (
    <div className="w-full flex justify-center items-center py-2 overflow-auto select-none">
      <div className="grid grid-cols-13 gap-1 bg-[#F5EFE3] p-3 rounded-2xl border-2 border-[#C9B99A] shadow-2xl w-full max-w-3xl aspect-square">
        {board.map((row, rIdx) =>
          row.map((cell, cIdx) => {
            // Cek apakah ada tile pending di cell ini
            const pending = pendingPlacements.find(
              (p) => p.row === rIdx && p.col === cIdx
            );
            const isHighlighted = highlightedCells.some(
              (h) => h.row === rIdx && h.col === cIdx
            );
            const activeTile = cell.tile || pending?.tile;
            const isPending = !!pending;

            return (
              <button
                key={`${rIdx}-${cIdx}`}
                data-testid="board-cell"
                data-row={rIdx}
                data-col={cIdx}
                onClick={() => onCellClick(rIdx, cIdx)}
                className={`relative flex flex-col items-center justify-center rounded-lg text-xs sm:text-sm font-bold transition-all border ${
                  activeTile
                    ? isPending
                      ? 'bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white border-white shadow-md shadow-[#7C3AED]/40 scale-95 animate-pop'
                      : isHighlighted
                      ? 'bg-gradient-to-br from-[#F97316] to-[#FB923C] text-white border-[#FDBA74] shadow-lg shadow-[#F97316]/50 animate-pulse'
                      : 'bg-[#FDF6E3] text-[#111827] border-2 border-[#A89B8C] shadow-lg'
                    : getCellBonusColor(cell.bonus)
                } ${
                  selectedRackTile && !activeTile
                    ? 'hover:border-[#7C3AED] hover:bg-[#7C3AED]/15 hover:scale-105 cursor-pointer'
                    : ''
                } aspect-square`}
              >
                {activeTile ? (
                  <>
                    <span className="leading-none text-sm sm:text-base font-extrabold drop-shadow-sm">
                      {activeTile.displayLetter || activeTile.letter || (activeTile.isBlank ? '?' : '')}
                    </span>
                    <span className="text-[7px] leading-none opacity-80 absolute bottom-0.5 right-0.5 font-semibold">
                      {activeTile.value}
                    </span>
                  </>
                ) : (
                  <span className="font-extrabold tracking-tighter opacity-80">
                    {getCellBonusLabel(cell)}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
