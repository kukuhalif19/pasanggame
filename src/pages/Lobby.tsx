import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, Check, Crown, Play, SignOut, Clock } from '@phosphor-icons/react';
import { useGameStore } from '../stores/gameStore';
import { useRoomSync } from '../hooks/useRoomSync';

export default function Lobby() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const room = useGameStore((state) => state.room);
  const localPlayer = useGameStore((state) => state.localPlayer);
  const startGame = useGameStore((state) => state.startGame);
  const leaveRoom = useGameStore((state) => state.leaveRoom);

  const [copied, setCopied] = useState(false);

  // Hook sinkronisasi real-time
  const { broadcastStartGame } = useRoomSync(code);

  useEffect(() => {
    // If user refreshes or visits directly without local player
    if (!localPlayer) {
      navigate('/join');
    }
  }, [localPlayer, navigate]);

  // Auto-navigate ke game saat room state berubah jadi 'playing'
  useEffect(() => {
    if (room?.state === 'playing') {
      navigate(`/room/${code}/game`);
    }
  }, [room?.state, code, navigate]);

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/join?room=${code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = () => {
    startGame('word-battle');
    broadcastStartGame('word-battle');
    navigate(`/room/${code}/game`);
  };

  const handleLeave = () => {
    leaveRoom();
    navigate('/');
  };

  const isHost = localPlayer?.isHost;
  const players = room?.players || (localPlayer ? [localPlayer] : []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 max-w-md mx-auto">
      {/* Header Info */}
      <div className="w-full pt-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Lobby Permainan
          </span>
          <button
            onClick={handleLeave}
            className="flex items-center gap-1 text-xs text-[#EF4444] hover:text-red-400 font-semibold px-2.5 py-1 rounded-lg bg-[#EF4444]/10 transition-colors"
          >
            <SignOut size={14} weight="bold" /> Keluar
          </button>
        </div>

        {/* Room Code Card */}
        <div className="w-full bg-[var(--color-surface)] border border-[#262633] rounded-2xl p-5 mb-6 shadow-lg text-center relative overflow-hidden">
          <p className="text-xs text-[var(--color-text-muted)] mb-1 font-medium">KODE ROOM</p>
          <div className="text-4xl font-black font-mono tracking-widest text-white mb-3">
            {code}
          </div>
          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 px-4 rounded-xl bg-[var(--color-surface-elevated)] hover:bg-[#262633] border border-[#2D2D3B] text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {copied ? (
              <>
                <Check size={16} weight="bold" className="text-[#10B981]" />
                Tersalin ke Clipboard!
              </>
            ) : (
              <>
                <Copy size={16} weight="bold" className="text-[#A78BFA]" />
                Salin Link Undang Teman
              </>
            )}
          </button>
        </div>

        {/* Room Settings Summary */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[#262633] mb-6 text-xs text-[var(--color-text-muted)]">
          <div className="flex items-center gap-1.5">
            <Clock size={16} className="text-[#F97316]" />
            <span>
              {room?.settings.turnTimerSeconds === 0
                ? 'Mode Casual (Tanpa Timer)'
                : `Turn: ${room?.settings.turnTimerSeconds || 60} detik`}
            </span>
          </div>
          <span className="text-[var(--color-text-muted)]">&bull;</span>
          <span>
            {room?.settings.language === 'en'
              ? 'English (TWL06)'
              : room?.settings.language === 'mix'
                ? 'IND + ENG (MIX)'
                : 'Bahasa Indonesia'}
          </span>
          <span className="text-[var(--color-text-muted)]">&bull;</span>
          <span>Maks 4 Pemain</span>
        </div>

        {/* Players List */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-bold text-white">
              Pemain ({players.length}/4)
            </h3>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              Min. 2 pemain untuk mulai
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-surface)] border border-[#262633]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#8B5CF6] flex items-center justify-center font-bold text-white shadow-md text-sm">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white">{p.name}</span>
                      {p.id === localPlayer?.id && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2D2D3B] text-[#9CA3AF] font-semibold">
                          Kamu
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#10B981] font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" /> Terhubung
                    </span>
                  </div>
                </div>

                {p.isHost && (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/30">
                    <Crown size={14} weight="fill" /> Host
                  </span>
                )}
              </div>
            ))}

            {/* Empty slots placeholders */}
            {Array.from({ length: Math.max(0, 4 - players.length) }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="p-3.5 rounded-xl border border-dashed border-[#262633] text-center text-xs text-[var(--color-text-muted)]/50"
              >
                Menunggu pemain lain...
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Start Button Area */}
      <div className="w-full pb-6 pt-4">
        {isHost ? (
          <button
            onClick={handleStart}
            disabled={players.length < 1} // allow testing with 1 in local dev
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:opacity-95 text-white font-bold text-base shadow-lg shadow-[#F97316]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Play size={20} weight="fill" />
            Mulai Word Battle
          </button>
        ) : (
          <div className="w-full py-4 rounded-xl bg-[var(--color-surface)] border border-[#262633] text-center text-sm font-semibold text-[var(--color-text-muted)]">
            Menunggu host memulai permainan...
          </div>
        )}
      </div>
    </div>
  );
}
