import { useNavigate } from 'react-router-dom';
import { GameController, PlusCircle, SignIn, Sparkle } from '@phosphor-icons/react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 max-w-md mx-auto text-center">
      {/* Header / Hero */}
      <div className="w-full pt-12 pb-6 flex flex-col items-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#7C3AED] to-[#F97316] flex items-center justify-center shadow-lg shadow-[#7C3AED]/30 mb-6 animate-pulse">
          <GameController size={44} weight="duotone" className="text-white" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-[#F3F4F6] to-[#9CA3AF] bg-clip-text text-transparent mb-2">
          PasangGame
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] font-medium max-w-xs">
          Main game kata santai bareng pasangan atau teman secara real-time. Tanpa login!
        </p>
      </div>

      {/* Featured Game Card Preview */}
      <div className="w-full bg-[var(--color-surface)] border border-[#262633] rounded-2xl p-5 text-left shadow-xl mb-6 relative overflow-hidden group">
        <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-[#7C3AED]/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-2 text-[#F97316] text-xs font-bold tracking-wider uppercase">
          <Sparkle size={14} weight="fill" /> Game Unggulan
        </div>
        <h3 className="text-xl font-bold text-white mb-1">Word Battle</h3>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-4">
          Papan 13×13 Scrabble-style dengan kamus Bahasa Indonesia + slang gaul. Susun kata dan raih skor tertinggi!
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-[#1C1C24] text-[#9CA3AF] border border-[#2D2D3B]">2-4 Pemain</span>
          <span className="px-2.5 py-1 rounded-full bg-[#1C1C24] text-[#9CA3AF] border border-[#2D2D3B]">Turn 60s</span>
          <span className="px-2.5 py-1 rounded-full bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/40 font-semibold">Bahasa Indonesia</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full flex flex-col gap-3 pb-8">
        <button
          onClick={() => navigate('/create')}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:opacity-95 text-white font-bold text-base shadow-lg shadow-[#F97316]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <PlusCircle size={22} weight="bold" />
          Buat Room Baru
        </button>

        <button
          onClick={() => navigate('/join')}
          className="w-full py-4 rounded-xl bg-[var(--color-surface-elevated)] hover:bg-[#262633] text-white font-semibold text-base border border-[#2D2D3B] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <SignIn size={22} weight="bold" className="text-[#A78BFA]" />
          Gabung Room
        </button>
      </div>

      {/* Footer */}
      <footer className="text-[11px] text-[var(--color-text-muted)] pb-4">
        PasangGame &copy; {new Date().getFullYear()} &bull; Dibuat untuk LDR & Teman Santai
      </footer>
    </div>
  );
}
