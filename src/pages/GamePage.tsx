import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Stack } from '@phosphor-icons/react';
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
  ensureDictionaryLoaded,
  type PendingPlacement,
} from '../game/wordBattleEngine';
import { calculateFinalScores, hasPassEnded } from '../game/gameEnd';
import type { Tile, PlacedWord, GameLanguage } from '../types';

/**
 * Hitung ID pemain berikutnya.
 * Memakai `turnOrder` (urutan acak saat game dimulai, di-broadcast ke semua
 * pemain) supaya urutan giliran SAMA di semua tab. Pemain yang sudah keluar
 * dilewati; pemain yang belum ada di turnOrder ditambahkan di belakang.
 * Kalau turnOrder tidak tersedia, fallback ke urutan join.
 */
function getNextPlayerId(
  players: { id: string; joinedAt?: number }[],
  currentPlayerId: string,
  turnOrder?: string[]
): string {
  if (players.length === 0) return currentPlayerId;
  const active = new Set(players.map((p) => p.id));

  let order: string[];
  if (turnOrder && turnOrder.length > 0) {
    order = turnOrder.filter((id) => active.has(id));
    for (const p of players) {
      if (!order.includes(p.id)) order.push(p.id);
    }
  } else {
    order = [...players]
      .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0))
      .map((p) => p.id);
  }

  if (order.length === 0) return currentPlayerId;
  const idx = order.indexOf(currentPlayerId);
  if (idx === -1) return order[0];
  return order[(idx + 1) % order.length];
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
  const connectionStatus = useGameStore((state) => state.connectionStatus);

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

  // Language room ditentukan saat create room — dipakai untuk validasi kamus.
  const language: GameLanguage = room?.settings.language ?? 'id';

  // Saat papan berubah (mis. pemain lain menaruh kata), tarik kembali HANYA
  // tile persiapan yang cell-nya sudah terisi pemain lain — supaya tidak
  // tertimpa / hilang. Tile yang cell-nya masih kosong tetap aman tersimpan.
  // Effect ini diletakkan SEBELUM early return untuk mematuhi aturan React hooks.
  useEffect(() => {
    if (!wordBattle) return;
    setPendingPlacements((prev) => {
      if (prev.length === 0) return prev;
      const kept = prev.filter((p) => wordBattle.board[p.row][p.col].tile === null);
      return kept.length === prev.length ? prev : kept;
    });
  }, [wordBattle?.board]);

  useEffect(() => {
    if (!wordBattle && room && localPlayer && localPlayer.isHost) {
      const lang = room.settings.language ?? 'id';
      // Pastikan kamus Inggris ter-load (kalau mode en/mix) sebelum game mulai.
      // Tambahkan timeout 10 detik agar tidak hang selamanya kalau jaringan lambat/putus.
      const loadPromise = ensureDictionaryLoaded(lang);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Dictionary load timeout (10s)')), 10000)
      );

      Promise.race([loadPromise, timeoutPromise])
        .catch((err) => {
          console.warn('[WordBattle] Dictionary load failed/timeout:', err);
          // Biarkan game tetap jalan meski kamus gagal — user masih bisa main tanpa validasi.
        })
        .finally(() => {
          const { state, updatedPlayers } = initWordBattle(room.players, lang);
          setWordBattle(state);
          const updatedRoom = { ...room, players: updatedPlayers };
          setRoom(updatedRoom);

          // Broadcast game state ke guest pemain
          if (broadcastGameState) {
            broadcastGameState(state, updatedRoom);
          }
        });
    }
  }, [wordBattle, room, localPlayer, broadcastGameState, setWordBattle, setRoom]);

  useEffect(() => {
    if (!localPlayer || !room || room.state !== 'playing') {
      navigate(`/room/${code}`);
    }
  }, [localPlayer, room, code, navigate]);

  // Preload kamus sesuai bahasa room untuk SEMUA pemain (host & guest).
  // Guest butuh kamus lokal untuk validasi kata saat menghitung skor.
  // Dilakukan segera saat mount supaya tidak menghambat saat game berjalan.
  useEffect(() => {
    if (!room) return;
    ensureDictionaryLoaded(room.settings.language ?? 'id').catch((err) => {
      console.error('[WordBattle] Gagal memuat kamus:', err);
    });
  }, [room?.settings.language]);

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

  // Akhir permainan: rack kosong setelah stock habis, atau deadlock (2 putaran penuh pass).
  // Kedua kondisi menerapkan pengurangan nilai tile tersisa; yang menghabiskan rack
  // juga mendapat bonus sejumlah total tile lawan.
  useEffect(() => {
    if (!wordBattle || !room || wordBattle.winnerId || room.players.length === 0) return;

    const finishingPlayer = wordBattle.stock.length === 0
      ? room.players.find((player) => player.rack.length === 0)
      : undefined;
    const endedByEmptyRack = Boolean(finishingPlayer);
    const endedByPasses = hasPassEnded(wordBattle.consecutivePassRounds, room.players.length);
    if (!endedByEmptyRack && !endedByPasses) return;

    const finalPlayers = calculateFinalScores(room.players, finishingPlayer?.id ?? null);
    const topScore = Math.max(...finalPlayers.map((player) => player.score));
    const winnerNames = finalPlayers
      .filter((player) => player.score === topScore)
      .map((player) => player.name);
    const winnerId = finalPlayers.find((player) => player.score === topScore)?.id ?? null;
    const finalRoom = { ...room, players: finalPlayers };
    const finalWordBattle = { ...wordBattle, winnerId, winnerNames };

    setRoom(finalRoom);
    setWordBattle(finalWordBattle);
    broadcastGameState(finalWordBattle, finalRoom);
    setShowGameOver(true);
  }, [wordBattle, room, setRoom, setWordBattle, broadcastGameState]);

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

      const nextPlayerId = getNextPlayerId(r.players, wb.currentPlayerId, wb.turnOrder);
      const updated = {
        ...wb,
        currentPlayerId: nextPlayerId,
        turnStartTime: Date.now(),
        consecutivePassRounds: wb.consecutivePassRounds + 1,
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
  const scoreResult = calculateScore(pendingPlacements, wordBattle.board, language);

  // Tile yang sudah ditaruh (pending) HARUS hilang dari rack, seperti memindahkan
  // ubin dari rak ke papan. Tanpa ini satu tile bisa dipakai berulang kali.
  const pendingTileIds = new Set(pendingPlacements.map((p) => p.tile.id));
  const availableRack = myRack.filter((t) => !pendingTileIds.has(t.id));

  const handleBoardCellClick = (row: number, col: number) => {
    // Semua pemain boleh menyiapkan kata di papan lokal sebelum gilirannya.
    // Hanya tombol submit yang terkunci sampai giliran pemain tersebut tiba.
    // Saat submit, dicek dulu apakah cell persiapan belum terisi orang lain.
    if (!selectedRackTile) return;
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
    const nextPlayerId = getNextPlayerId(room.players, wordBattle.currentPlayerId, wordBattle.turnOrder);

    const updatedWordBattle = {
      ...wordBattle,
      stock: newStock,
      currentPlayerId: nextPlayerId,
      turnStartTime: Date.now(),
      consecutivePassRounds: 0,
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

    const nextPlayerId = getNextPlayerId(room.players, wordBattle.currentPlayerId, wordBattle.turnOrder);

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

  const handleRecallLast = () => {
    setPendingPlacements((placements) => placements.slice(0, -1));
    setSelectedRackTile(null);
    setBlankPlacementTarget(null);
  };

  const remainingLetterCounts = wordBattle.stock.reduce<Record<string, number>>((counts, tile) => {
    const letter = tile.isBlank ? '?' : (tile.letter || tile.displayLetter || '?');
    counts[letter] = (counts[letter] || 0) + 1;
    return counts;
  }, {});
  const remainingStockCount = wordBattle.stock.length;
  const remainingLettersLabel = Object.entries(remainingLetterCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, count]) => `${letter}:${count}`)
    .join('  ');

  const handleShowRemainingTiles = () => {
    window.alert(`Sisa huruf di kantong: ${remainingStockCount}\n\n${remainingLettersLabel || 'Kantong kosong'}`);
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

    // Guard: pastikan semua cell persiapan masih kosong. Kalau ada yang sudah
    // terisi pemain lain (mis. saat kita menyiapkan di luar giliran), tolak
    // submit dan tarik kembali tile yang bentrok supaya tidak hilang/tertimpa.
    const conflicting = pendingPlacements.filter(
      (p) => wordBattle.board[p.row][p.col].tile !== null
    );
    if (conflicting.length > 0) {
      const conflictKeys = new Set(conflicting.map((p) => `${p.row},${p.col}`));
      setPendingPlacements((prev) =>
        prev.filter((p) => !conflictKeys.has(`${p.row},${p.col}`))
      );
      window.alert(
        'Sebagian hurufmu berada di petak yang sudah diisi pemain lain. Huruf tersebut ditarik kembali ke rak — silakan susun ulang.'
      );
      return;
    }

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
    const nextPlayerId = getNextPlayerId(room.players, wordBattle.currentPlayerId, wordBattle.turnOrder);

    // 5. Update state
    setRoom({ ...room, players: updatedPlayers });
    
    // Build lastPlacedWord dari kata utama (scoreResult.words[0])
    const mainWord = (scoreResult.words || [])[0];
    const lastPlacedWordData: PlacedWord | null = mainWord
      ? {
          word: mainWord.word,
          playerId: myPlayer.id,
          score: scoreResult.score,
          cells: mainWord.tiles.map(t => ({ row: t.row, col: t.col })),
          timestamp: Date.now(),
        }
      : null;
    
    setWordBattle({
      ...wordBattle,
      board: newBoard,
      stock: newStock,
      currentPlayerId: nextPlayerId,
      turnStartTime: Date.now(),
      consecutivePassRounds: 0,
      lastPlacedWord: lastPlacedWordData,
    });

    // 6. Broadcast game state ke semua pemain (dengan lastPlacedWord)
    const updatedWordBattle = {
      ...wordBattle,
      board: newBoard,
      stock: newStock,
      currentPlayerId: nextPlayerId,
      turnStartTime: Date.now(),
      consecutivePassRounds: 0,
      lastPlacedWord: lastPlacedWordData,
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
        <button
          onClick={handleShowRemainingTiles}
          className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-white border border-[#262633] rounded-lg px-2 py-1 bg-[var(--color-surface)] hover:bg-[#1E1E28] transition-all"
          title="Lihat distribusi sisa huruf di kantong"
        >
          <Stack size={14} weight="bold" />
          <span>Sisa: {remainingStockCount}</span>
        </button>
        <span className="text-[10px] font-mono font-bold text-[#A78BFA]">ROOM: {code}</span>
      </div>

      {/* Indikator koneksi: hanya tampil kalau tidak normal, supaya tidak berisik */}
      {connectionStatus !== 'connected' && (
        <div className="w-full max-w-[440px] mb-2 px-3 py-1.5 rounded-lg bg-[#F97316]/15 border border-[#F97316]/40 text-[#FDBA74] text-[11px] font-semibold text-center animate-fadeIn">
          {connectionStatus === 'disconnected'
            ? '⚠ Koneksi terputus — menunggu jaringan…'
            : '🔄 Menyambungkan ulang…'}
        </div>
      )}
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
      {/* Label kata terakhir yang berhasil dipasang */}
      {wordBattle.lastPlacedWord && (
        <div className="w-full max-w-[440px] px-2 mb-2 flex items-center justify-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-lg bg-[#F97316]/15 border border-[#F97316]/40 text-[#FDBA74] font-bold">
            Kata terakhir: {wordBattle.lastPlacedWord.word} · +{wordBattle.lastPlacedWord.score}
          </span>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center my-4">
        <Board
          board={wordBattle.board}
          pendingPlacements={pendingPlacements}
          highlightedCells={wordBattle.lastPlacedWord?.cells || []}
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
        onRecallLast={handleRecallLast}
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
