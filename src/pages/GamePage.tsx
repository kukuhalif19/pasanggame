import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { useGameStore } from '../stores/gameStore';
import { useRoomSync } from '../hooks/useRoomSync';
import GameHeader from '../components/GameHeader';
import Board from '../components/Board';
import Rack from '../components/Rack';
import { SwapModal, GameOverModal, WildcardModal } from '../components/Modals';
import {
  initWordBattle,
  calculateScore,
  swapTiles,
  type PendingPlacement,
} from '../game/wordBattleEngine';
import type { Tile } from '../types';

/**
 * Hitung ID pemain berikutnya secara aman.
 * Urutan pemain diurutkan berdasarkan joinedAt sebelum diputar, supaya
 * urutan giliran SAMA di semua tab (tidak bergantung urutan array lokal).
 */
function getNextPlayerId(players: { id: string; joinedAt?: number }[], currentPlayerId: string): string {
  if (players.length === 0) return currentPlayerId;
  const sorted = [...players].sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
  const idx = sorted.findIndex((p) => p.id === currentPlayerId);
  if (idx === -1) return sorted[0].id;
  return sorted[(idx + 1) % sorted.length].id;
}

export default function GamePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const room = useGameStore((state) => state.room);
  const localPlayer = useGameStore((state) => state.localPlayer);
  const wordBattle = useGameStore((state) => state.wordBattle);
  const setWordBattle = useGameStore((state) => state.setWordBattle);
  const setRoom = useGameStore((state) => state.setRoom);
  const leaveRoom = useGameStore((state) => state.leaveRoom);

  const { broadcastGameState, requestSync, broadcastLeave } = useRoomSync(code);

  const [selectedRackTile, setSelectedRackTile] = useState<Tile | null>(null);
  const [pendingPlacements, setPendingPlacements] = useState<PendingPlacement[]>([]);
  const [blankPlacementTarget, setBlankPlacementTarget] = useState<{
    row: number;
    col: number;
    tile: Tile;
  } | null>(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);

  useEffect(() => {
    if (!wordBattle && room && localPlayer && localPlayer.isHost) {
      const { state, updatedPlayers } = initWordBattle(room.players);
      setWordBattle(state);
      const updatedRoom = { ...room, players: updatedPlayers };
      setRoom(updatedRoom);

      // Broadcast game state ke guest pemain
      if (broadcastGameState) {
        broadcastGameState(state, updatedRoom);
      }
    }
  }, [wordBattle, room, localPlayer, broadcastGameState]);

  useEffect(() => {
    if (!localPlayer || !room || room.state !== 'playing') {
      navigate(`/room/${code}`);
    }
  }, [localPlayer, room, code, navigate]);

  // Guest: kalau belum menerima game state dari host, minta berulang.
  // BroadcastChannel tidak menyimpan history, jadi kalau host broadcast
  // sebelum listener guest terpasang, event-nya hilang.
  useEffect(() => {
    if (wordBattle || !room || !localPlayer || localPlayer.isHost) return;
    let attempts = 0;
    const timer = setInterval(() => {
      if (useGameStore.getState().wordBattle) {
        clearInterval(timer);
        return;
      }
      requestSync();
      attempts += 1;
      if (attempts >= 15) clearInterval(timer);
    }, 400);
    return () => clearInterval(timer);
  }, [wordBattle, room, localPlayer, requestSync]);

  // Deteksi akhir permainan: stock habis DAN ada pemain yang rack-nya kosong.
  // Pemenang = skor tertinggi. Modal game over ditampilkan sekali.
  useEffect(() => {
    if (!wordBattle || !room || wordBattle.winnerId) return;
    const stockEmpty = wordBattle.stock.length === 0;
    const someoneFinished = room.players.some((p) => p.rack.length === 0);
    if (!stockEmpty || !someoneFinished || room.players.length === 0) return;

    const ranked = [...room.players].sort((a, b) => b.score - a.score);
    const top = ranked[0];
    const winnerId = top?.id || null;
    const winnerNames = ranked.filter((p) => p.score === top?.score).map((p) => p.name);

    setWordBattle({ ...wordBattle, winnerId, winnerNames });
    setShowGameOver(true);
  }, [wordBattle, room, setWordBattle]);

  // Auto-ganti giliran saat waktu turn habis.
  // Hanya klien pemain yang sedang giliran yang mengeksekusi (mencegah dobel-advance).
  // Mode Casual (turnTimerSeconds === 0) tidak punya timer sama sekali.
  useEffect(() => {
    if (!wordBattle || !room) return;
    const timerSeconds = room.settings.turnTimerSeconds;
    if (!timerSeconds || timerSeconds <= 0) return; // casual: tanpa batas waktu
    if (wordBattle.winnerId) return;

    const tick = () => {
      const wb = useGameStore.getState().wordBattle;
      const r = useGameStore.getState().room;
      const me = useGameStore.getState().localPlayer;
      if (!wb || !r || !me || wb.winnerId) return;
      // Hanya klien pemain yang giliran yang memajukan turn.
      if (wb.currentPlayerId !== me.id) return;
      const elapsed = Math.floor((Date.now() - wb.turnStartTime) / 1000);
      if (elapsed < r.settings.turnTimerSeconds) return;

      const nextPlayerId = getNextPlayerId(r.players, wb.currentPlayerId);
      const updated = {
        ...wb,
        currentPlayerId: nextPlayerId,
        turnStartTime: Date.now(),
      };
      setWordBattle(updated);
      setPendingPlacements([]);
      setSelectedRackTile(null);
      setBlankPlacementTarget(null);
      if (broadcastGameState) broadcastGameState(updated, r);
    };

    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [wordBattle, room, setWordBattle, broadcastGameState]);

  // Keluar dari game: broadcast PLAYER_LEFT lalu bersihkan state dan kembali ke home.
  // Ini menghindari loop redirect (Lobby otomatis balik ke game saat room.state==='playing').
  const handleLeaveGame = () => {
    if (!window.confirm('Keluar dari permainan? Kamu akan meninggalkan room ini.')) return;
    if (broadcastLeave) broadcastLeave();
    leaveRoom();
    navigate('/');
  };

  if (!wordBattle || !localPlayer || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-[var(--color-text-muted)]">Memuat game...</div>
      </div>
    );
  }

  const currentPlayerIsMe = wordBattle.currentPlayerId === localPlayer.id;
  const myPlayer = room.players.find((p) => p.id === localPlayer.id);
  const currentPlayerObj = room.players.find((p) => p.id === wordBattle.currentPlayerId);
  const myRack = myPlayer?.rack || [];
  const scoreResult = calculateScore(pendingPlacements, wordBattle.board);

  // Tile yang sudah ditaruh (pending) HARUS hilang dari rack, seperti memindahkan
  // ubin dari rak ke papan. Tanpa ini satu tile bisa dipakai berulang kali.
  const pendingTileIds = new Set(pendingPlacements.map((p) => p.tile.id));
  const availableRack = myRack.filter((t) => !pendingTileIds.has(t.id));

  const handleBoardCellClick = (row: number, col: number) => {
    if (!currentPlayerIsMe || !selectedRackTile) return;
    const cell = wordBattle.board[row][col];
    if (cell.tile) return;
    // Jangan izinkan dua tile di cell yang sama.
    if (pendingPlacements.some((p) => p.row === row && p.col === col)) return;
    // Jangan izinkan tile yang sudah ditaruh dipakai lagi.
    if (pendingTileIds.has(selectedRackTile.id)) return;

    // Jika blank tile, tunjukkan modal pilih huruf terlebih dahulu
    if (selectedRackTile.isBlank) {
      setBlankPlacementTarget({ row, col, tile: selectedRackTile });
      return;
    }

    const newPlacement: PendingPlacement = { row, col, tile: selectedRackTile };
    setPendingPlacements([...pendingPlacements, newPlacement]);
    setSelectedRackTile(null);
  };

  const handleSelectRackTile = (tile: Tile) => {
    // Rack tetap bisa dipilih/diacak walau bukan giliran —
    // hanya penempatan ke papan yang dibatasi.
    // Tile yang sudah ditaruh di papan tidak bisa dipilih lagi.
    if (pendingTileIds.has(tile.id)) return;
    setSelectedRackTile(selectedRackTile?.id === tile.id ? null : tile);
  };

  const handleShuffle = () => {
    // Shuffle rack order visual saja
    if (!myPlayer) return;
    const shuffled = [...myPlayer.rack].sort(() => Math.random() - 0.5);
    const updatedPlayers = room.players.map(p => 
      p.id === myPlayer.id ? { ...p, rack: shuffled } : p
    );
    setRoom({ ...room, players: updatedPlayers });
  };
  
  const handleSwap = () => {
    if (pendingPlacements.length > 0) return;
    setShowSwapModal(true);
  };
  
  const handleConfirmSwap = (tilesToSwap: Tile[]) => {
    if (!myPlayer || !wordBattle) return;
    const { newRack, newStock } = swapTiles(myPlayer.rack, tilesToSwap, wordBattle.stock);
    
    // Update player rack & stock
    const updatedPlayers = room.players.map(p => 
      p.id === myPlayer.id ? { ...p, rack: newRack } : p
    );

    // Next turn
    const nextPlayerId = getNextPlayerId(room.players, wordBattle.currentPlayerId);

    const updatedWordBattle = {
      ...wordBattle,
      stock: newStock,
      currentPlayerId: nextPlayerId,
      turnStartTime: Date.now(),
    };

    setRoom({ ...room, players: updatedPlayers });
    setWordBattle(updatedWordBattle);
    
    // Broadcast
    if (broadcastGameState) {
      broadcastGameState(updatedWordBattle, { ...room, players: updatedPlayers });
    }
  };
  
  const handleSkip = () => {
    if (pendingPlacements.length > 0 || !wordBattle) return;
    if (!currentPlayerIsMe) return;

    const nextPlayerId = getNextPlayerId(room.players, wordBattle.currentPlayerId);

    const updatedWordBattle = {
      ...wordBattle,
      currentPlayerId: nextPlayerId,
      turnStartTime: Date.now(),
      consecutivePassRounds: wordBattle.consecutivePassRounds + 1,
    };

    setWordBattle(updatedWordBattle);

    if (broadcastGameState) {
      broadcastGameState(updatedWordBattle, room);
    }
  };
  const handleRecall = () => {
    setPendingPlacements([]);
    setSelectedRackTile(null);
    setBlankPlacementTarget(null);
  };

  const handleSelectBlankLetter = (chosenLetter: string) => {
    if (!blankPlacementTarget) return;
    const { row, col, tile } = blankPlacementTarget;
    const configuredTile: Tile = {
      ...tile,
      displayLetter: chosenLetter.toUpperCase(),
    };
    const newPlacement: PendingPlacement = { row, col, tile: configuredTile };
    setPendingPlacements([...pendingPlacements, newPlacement]);
    setBlankPlacementTarget(null);
    setSelectedRackTile(null);
  };
  const handlePlay = () => {
    if (!scoreResult.isValidPlacement || !currentPlayerIsMe || !myPlayer || !wordBattle) return;

    // 1. Commit tiles ke board
    const newBoard = wordBattle.board.map((row) => row.map((cell) => ({ ...cell })));
    for (const p of pendingPlacements) {
      newBoard[p.row][p.col] = {
        ...newBoard[p.row][p.col],
        tile: p.tile,
        bonusUsed: true,
      };
    }

    // 2. Tarik tile baru dari stock untuk isi rack kembali ke 7
    const tilesPlaced = pendingPlacements.length;
    const rackAfterPlay = myPlayer.rack.filter(
      (t) => !pendingPlacements.some((p) => p.tile.id === t.id)
    );
    const newStock = [...wordBattle.stock];
    const newRack = [...rackAfterPlay];
    for (let i = 0; i < tilesPlaced; i++) {
      const tile = newStock.pop();
      if (tile) newRack.push(tile);
    }

    // 3. Update skor player
    const updatedPlayers = room.players.map((p) =>
      p.id === myPlayer.id
        ? { ...p, score: p.score + scoreResult.score, rack: newRack }
        : p
    );

    // 4. Giliran ke player berikutnya
    const nextPlayerId = getNextPlayerId(room.players, wordBattle.currentPlayerId);

    // 5. Update state
    setRoom({ ...room, players: updatedPlayers });
    setWordBattle({
      ...wordBattle,
      board: newBoard,
      stock: newStock,
      currentPlayerId: nextPlayerId,
      turnStartTime: Date.now(),
      consecutivePassRounds: 0,
    });

    // 6. Broadcast game state ke semua pemain
    const updatedWordBattle = {
      ...wordBattle,
      board: newBoard,
      stock: newStock,
      currentPlayerId: nextPlayerId,
      turnStartTime: Date.now(),
      consecutivePassRounds: 0,
    };
    if (broadcastGameState) {
      broadcastGameState(updatedWordBattle, { ...room, players: updatedPlayers });
    }

    setPendingPlacements([]);
    setSelectedRackTile(null);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] flex flex-col items-center justify-between py-4 px-2">
      <div className="w-full max-w-[440px] flex items-center justify-between mb-2">
        <button
          onClick={handleLeaveGame}
          className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-white"
        >
          <ArrowLeft size={16} /> Kembali
        </button>
        <span className="text-[10px] font-mono font-bold text-[#A78BFA]">ROOM: {code}</span>
      </div>
      <GameHeader
        players={room.players}
        currentPlayerId={wordBattle.currentPlayerId}
        turnStartTime={wordBattle.turnStartTime}
        turnTimerSeconds={room.settings.turnTimerSeconds}
        localPlayerId={localPlayer.id}
      />
      
      {/* Turn Indicator Banner */}
      <div className={`w-full max-w-[440px] px-2 mb-3 py-3 rounded-xl border-2 text-center font-bold transition-all ${
        currentPlayerIsMe
          ? 'bg-gradient-to-r from-[#7C3AED] to-[#9333EA] border-[#A855F7] text-white shadow-lg shadow-[#7C3AED]/30'
          : 'bg-[var(--color-surface)] border-[#262633] text-[var(--color-text-muted)]'
      }`}>
        {currentPlayerIsMe ? (
          <div className="flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span>Giliran Kamu! 🎯</span>
          </div>
        ) : (
          <span>Giliran: <span className="text-white">{currentPlayerObj?.name || 'Loading...'}</span></span>
        )}
      </div>
      <div className="flex-1 flex items-center justify-center my-4">
        <Board
          board={wordBattle.board}
          pendingPlacements={pendingPlacements}
          onCellClick={handleBoardCellClick}
          selectedRackTile={selectedRackTile}
        />
      </div>
      {pendingPlacements.length > 0 && (
        <div className={`w-full max-w-[440px] px-2 mb-2 p-2.5 rounded-xl bg-[var(--color-surface)] border border-[#262633] text-center text-sm font-semibold transition-all ${
          !scoreResult.isValidPlacement ? 'animate-shake border-[#EF4444]' : ''
        }`}>
          {scoreResult.isValidPlacement ? (
            <div className="flex flex-col gap-1">
              {/* Kata yang terbaca (termasuk sambungan ke huruf lama) */}
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {(scoreResult.words || []).map((w, i) => (
                  <span
                    key={`${w.word}-${i}`}
                    data-testid="formed-word"
                    className="px-2 py-0.5 rounded-lg bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#C4B5FD] text-xs font-black tracking-wider"
                  >
                    {w.word}
                  </span>
                ))}
              </div>
              <span className="text-[#10B981]">
                Skor: <span className="text-lg font-black">{scoreResult.score}</span> poin
              </span>
            </div>
          ) : (
            <span className="text-[#EF4444]">⚠ {scoreResult.message || 'Langkah tidak valid'}</span>
          )}
        </div>
      )}
      <Rack
        rack={availableRack}
        selectedTile={selectedRackTile}
        onSelectTile={handleSelectRackTile}
        onShuffle={handleShuffle}
        onSwapClick={handleSwap}
        onSkip={handleSkip}
        onRecall={handleRecall}
        onPlay={handlePlay}
        canPlay={scoreResult.isValidPlacement && pendingPlacements.length > 0}
        hasPlacements={pendingPlacements.length > 0}
        isMyTurn={currentPlayerIsMe}
      />
      
      {/* Modals */}
      <WildcardModal
        isOpen={Boolean(blankPlacementTarget)}
        onSelectLetter={handleSelectBlankLetter}
        onClose={() => setBlankPlacementTarget(null)}
      />

      <SwapModal
        isOpen={showSwapModal}
        onClose={() => setShowSwapModal(false)}
        rack={availableRack}
        onConfirmSwap={handleConfirmSwap}
      />
      
      <GameOverModal
        isOpen={showGameOver}
        winnerName={wordBattle.winnerId ? room.players.find(p => p.id === wordBattle.winnerId)?.name || 'Player' : ''}
        players={room.players.map(p => ({ name: p.name, score: p.score }))}
        onBackToLobby={() => navigate(`/room/${code}`)}
      />
    </div>
  );
}
