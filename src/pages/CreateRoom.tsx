import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, CaretRight, Check } from '@phosphor-icons/react';
import { useGameStore } from '../stores/gameStore';

export default function CreateRoom() {
  const navigate = useNavigate();
  const createRoom = useGameStore((state) => state.createRoom);

  const [name, setName] = useState('');
  const [timerSeconds, setTimerSeconds] = useState<0 | 30 | 60 | 90>(60);

  const handleCreate = () => {
    if (!name.trim()) return;
    createRoom(name.trim(), { turnTimerSeconds: timerSeconds });
    // Room code is auto-generated in store
    const roomCode = useGameStore.getState().room?.code;
    if (roomCode) {
      navigate(`/room/${roomCode}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 max-w-md mx-auto">
      <div className="w-full bg-[var(--color-surface)] border border-[#262633] rounded-2xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-2">Buat Room Baru</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          Kamu akan jadi host. Setelah room dibuat, bagikan kode room ke teman-temanmu!
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

        {/* Timer Setting */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-3 text-[var(--color-text-primary)]">
            Durasi Turn Timer
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { val: 0, label: 'Casual', desc: 'No timer' },
              { val: 30, label: '30s', desc: 'Cepat' },
              { val: 60, label: '60s', desc: 'Normal' },
              { val: 90, label: '90s', desc: 'Santai' },
            ].map((item) => (
              <button
                key={item.val}
                onClick={() => setTimerSeconds(item.val as 0 | 30 | 60 | 90)}
                className={`py-3 rounded-lg font-semibold text-xs transition-all relative flex flex-col items-center justify-center ${
                  timerSeconds === item.val
                    ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[#7C3AED]/30'
                    : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:bg-[#262633] border border-[#2D2D3B]'
                }`}
              >
                {timerSeconds === item.val && (
                  <Check size={14} weight="bold" className="absolute top-1 right-1" />
                )}
                <span className="font-bold">{item.label}</span>
                <span className="text-[10px] opacity-75">{item.desc}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            {timerSeconds === 0
              ? 'Mode Casual: Tanpa batas waktu, bebas berdiskusi dan santai.'
              : `Setiap pemain punya ${timerSeconds} detik untuk menyelesaikan gilirannya.`}
          </p>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base shadow-lg shadow-[#F97316]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          Buat Room
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
