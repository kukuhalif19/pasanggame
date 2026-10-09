import { useEffect, useState } from 'react';
import { Clock } from '@phosphor-icons/react';
import type { Player } from '../types';

interface GameHeaderProps {
  players: Player[];
  currentPlayerId: string;
  turnStartTime: number;
  turnTimerSeconds: number;
  localPlayerId: string;
}

export default function GameHeader({
  players,
  currentPlayerId,
  turnStartTime,
  turnTimerSeconds,
  localPlayerId,
}: GameHeaderProps) {
  const [timeLeft, setTimeLeft] = useState(turnTimerSeconds);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const elapsed = Math.floor((Date.now() - turnStartTime) / 1000);
      const remaining = Math.max(0, turnTimerSeconds - elapsed);
      setTimeLeft(remaining);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 200);

    return () => clearInterval(interval);
  }, [turnStartTime, turnTimerSeconds]);

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const isMyTurn = currentPlayerId === localPlayerId;

  return (
    <div className="w-full max-w-[440px] flex flex-col gap-2 px-2">
      {/* Turn Indicator & Timer */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface)] border border-[#262633] shadow-md">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-md text-sm ${
              isMyTurn
                ? 'bg-gradient-to-tr from-[#F97316] to-[#FB923C] animate-pulse'
                : 'bg-gradient-to-tr from-[#7C3AED] to-[#8B5CF6]'
            }`}
          >
            {currentPlayer?.name.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <div className="text-xs font-semibold text-[var(--color-text-muted)]">
              {isMyTurn ? 'Giliran Kamu' : 'Giliran'}
            </div>
            <div className="text-sm font-bold text-white">
              {currentPlayer?.name || 'Loading...'}
            </div>
          </div>
        </div>

        {/* Timer */}
        {turnTimerSeconds === 0 ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]">
            <span className="text-xs font-bold uppercase tracking-wider">Casual</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Clock
              size={18}
              weight="bold"
              className={timeLeft < 10 ? 'text-[#EF4444]' : 'text-[#F97316]'}
            />
            <span
              className={`text-xl font-black font-mono ${
                timeLeft < 10 ? 'text-[#EF4444]' : 'text-white'
              }`}
            >
              {timeLeft}s
            </span>
          </div>
        )}
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-2 gap-2">
        {players.map((player) => {
          const isActive = player.id === currentPlayerId;
          const isMe = player.id === localPlayerId;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                isActive
                  ? 'bg-[var(--color-surface-elevated)] border-[#7C3AED]'
                  : 'bg-[var(--color-surface)] border-[#262633]'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#8B5CF6] flex items-center justify-center font-bold text-white text-xs shadow-sm">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white">
                      {player.name}
                    </span>
                    {isMe && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-[#2D2D3B] text-[#9CA3AF] font-semibold">
                        Kamu
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    {player.rack.length} huruf
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-[#F97316]">
                  {player.score}
                </div>
                <div className="text-[9px] text-[var(--color-text-muted)] font-semibold">
                  POIN
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
