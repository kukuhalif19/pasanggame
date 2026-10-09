import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Key, CaretRight } from '@phosphor-icons/react';
import { useGameStore } from '../stores/gameStore';

export default function JoinRoom() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const joinRoom = useGameStore((state) => state.joinRoom);
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  // Auto-fill room code dari query param ?room=CODE
  useEffect(() => {
    const roomFromUrl = searchParams.get('room')?.toUpperCase() || '';
    if (roomFromUrl && roomFromUrl.length === 6) {
      setRoomCode(roomFromUrl);
    }
  }, [searchParams]);

  const handleJoin = () => {
    if (!name.trim() || !roomCode.trim()) return;
    joinRoom(roomCode.trim().toUpperCase(), name.trim());
    navigate(`/room/${roomCode.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 max-w-md mx-auto">
      <div className="w-full bg-[var(--color-surface)] border border-[#262633] rounded-2xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-2">Gabung Room</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          Minta kode room dari host, lalu masukkan di bawah untuk bergabung.
        </p>

        {/* Name Input */}
        <div className="mb-5">
          <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">
            Nama Kamu
          </label>
          <div className="relative">
            <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama..."
              maxLength={20}
              className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface-elevated)] border border-[#2D2D3B] rounded-xl text-white placeholder:text-[#4A4A5B] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>

        {/* Room Code Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2 text-[var(--color-text-primary)]">
            Kode Room
          </label>
          <div className="relative">
            <Key size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="Contoh: ABC123"
              maxLength={6}
              className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface-elevated)] border border-[#2D2D3B] rounded-xl text-white placeholder:text-[#4A4A5B] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] font-mono tracking-widest text-lg"
            />
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            Kode room terdiri dari 6 karakter (A-Z, 2-9).
          </p>
        </div>

        {/* Join Button */}
        <button
          onClick={handleJoin}
          disabled={!name.trim() || roomCode.length !== 6}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base shadow-lg shadow-[#7C3AED]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          Gabung Room
          <CaretRight size={20} weight="bold" />
        </button>

        {/* Back Link */}
        <button
          onClick={() => navigate('/')}
          className="w-full mt-3 py-2 text-sm text-[var(--color-text-muted)] hover:text-white transition-colors"
        >
          ← Kembali
        </button>
      </div>
    </div>
  );
}
