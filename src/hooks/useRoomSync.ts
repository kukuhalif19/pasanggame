import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getRealtime } from '../services/supabaseRealtime';
import { dedupePlayers } from '../utils';
import type { Player, Room, RealtimeEvent } from '../types';

export function useRoomSync(roomCode: string | undefined) {
  const localPlayer = useGameStore((state) => state.localPlayer);
  const setRoom = useGameStore((state) => state.setRoom);
  const setLocalPlayer = useGameStore((state) => state.setLocalPlayer);
  const startGame = useGameStore((state) => state.startGame);
  const setWordBattle = useGameStore((state) => state.setWordBattle);

  const realtimeRef = useRef<ReturnType<typeof getRealtime> | null>(null);

  useEffect(() => {
    if (!roomCode || !localPlayer) return;

    const rt = getRealtime(roomCode);
    realtimeRef.current = rt;

    // Listen for broadcast events
    const unsubscribe = rt.on((event: RealtimeEvent) => {
      const currentRoom = useGameStore.getState().room;
      const me = useGameStore.getState().localPlayer;

      switch (event.type) {
        // Player baru bergabung meminta room state dari host
        case 'REQUEST_SYNC': {
          if (me?.isHost && currentRoom) {
            rt.send('SYNC_ROOM_STATE', currentRoom, me.id);
            const currentWb = useGameStore.getState().wordBattle;
            if (currentWb) {
              rt.send('GAME_STATE', { wordBattle: currentWb, room: currentRoom }, me.id);
            }
          }
          break;
        }

        // Host mengirimkan state room terbaru ke semua peserta
        case 'SYNC_ROOM_STATE': {
          const syncedRoom = event.payload as Room;
          const cleanPlayers = dedupePlayers(syncedRoom.players);
          const withMe = me && !cleanPlayers.some((p) => p.id === me.id)
            ? [...cleanPlayers, me]
            : cleanPlayers;
          const finalRoom = { ...syncedRoom, players: withMe };
          setRoom(finalRoom);
          break;
        }

        // Game state sinkronisasi (Board, turn, rack, scores)
        case 'GAME_STATE': {
          const payload = event.payload as { wordBattle: any; room: Room };
          if (payload.wordBattle) setWordBattle(payload.wordBattle);
          if (payload.room) {
            const cleanRoom = { ...payload.room, players: dedupePlayers(payload.room.players) };
            setRoom(cleanRoom);
          }
          break;
        }

        // Ada player baru join
        case 'PLAYER_JOINED': {
          const newPlayer = event.payload as Player;
          if (currentRoom) {
            const playerExists = currentRoom.players.some((p) => p.id === newPlayer.id);
            if (!playerExists) {
              const updatedPlayers = [...currentRoom.players, newPlayer];
              const cleanRoom = { ...currentRoom, players: dedupePlayers(updatedPlayers) };
              setRoom(cleanRoom);
              // Jika kita host, broadcast updated room state
              if (me?.isHost) {
                rt.send('SYNC_ROOM_STATE', cleanRoom, me.id);
              }
            }
          }
          break;
        }

        // Player meninggalkan room
        case 'PLAYER_LEFT': {
          const leavingPlayerId = event.payload as string;
          if (currentRoom) {
            const updatedPlayers = currentRoom.players.filter((p) => p.id !== leavingPlayerId);
            let newHostId = currentRoom.hostId;

            // Host migration jika host keluar
            if (currentRoom.hostId === leavingPlayerId && updatedPlayers.length > 0) {
              newHostId = updatedPlayers[0].id;
              updatedPlayers[0].isHost = true;
              if (me && me.id === newHostId) {
                setLocalPlayer({ ...me, isHost: true });
              }
            }

            const updatedRoom = {
              ...currentRoom,
              players: updatedPlayers,
              hostId: newHostId,
            };
            setRoom(updatedRoom);
          }
          break;
        }

        // Game dimulai oleh host
        case 'START_GAME': {
          const gameType = event.payload as any;
          startGame(gameType);
          break;
        }

        default:
          break;
      }
    });

    // Ketika join: handshake dilakukan di effect terpisah dengan retry (lihat di bawah)
    return () => {
      // JANGAN kirim PLAYER_LEFT saat unmount (mis. pindah Lobby -> Game).
      // Disconnect nyata ditangani lewat event beforeunload.
      unsubscribe();
    };
  }, [roomCode, localPlayer?.id, setLocalPlayer, setRoom, setWordBattle, startGame]);

  // Handshake join untuk GUEST: announce sampai benar-benar tersinkron.
  // BroadcastChannel tidak menyimpan history, jadi kalau host belum mendengarkan
  // saat kita broadcast, event-nya hilang. Retry menutup race ini.
  useEffect(() => {
    if (!roomCode || !localPlayer || localPlayer.isHost) return;

    let attempts = 0;
    const announce = (): boolean => {
      const rt = realtimeRef.current;
      if (!rt) return false;
      const r = useGameStore.getState().room;
      const me = useGameStore.getState().localPlayer;
      if (!me) return false;
      // Sudah tersinkron kalau room memuat kita DAN ada pemain lain
      if (r && r.players.some((p) => p.id === me.id) && r.players.length > 1) {
        return true;
      }
      rt.send('PLAYER_JOINED', me, me.id);
      rt.send('REQUEST_SYNC', { playerId: me.id }, me.id);
      return false;
    };

    announce();
    const timer = setInterval(() => {
      const done = announce();
      attempts += 1;
      if (done || attempts >= 20) clearInterval(timer);
    }, 500);

    return () => clearInterval(timer);
  }, [roomCode, localPlayer?.id]);

  // Broadcast PLAYER_LEFT hanya saat tab benar-benar ditutup/di-refresh
  useEffect(() => {
    if (!roomCode || !localPlayer) return;
    const handleUnload = () => {
      const rt = realtimeRef.current;
      if (rt) rt.send('PLAYER_LEFT', localPlayer.id, localPlayer.id);
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [roomCode, localPlayer?.id]);

  const broadcastStartGame = useCallback((gameType: string) => {
    if (realtimeRef.current && localPlayer?.id) {
      realtimeRef.current.send('START_GAME', gameType, localPlayer.id);
    }
  }, [localPlayer?.id]);

  const broadcastGameState = useCallback((wordBattle: any, room: Room) => {
    if (realtimeRef.current && localPlayer?.id) {
      const cleanRoom = { ...room, players: dedupePlayers(room.players) };
      realtimeRef.current.send('GAME_STATE', { wordBattle, room: cleanRoom }, localPlayer.id);
    }
  }, [localPlayer?.id]);

  const requestSync = useCallback(() => {
    if (realtimeRef.current && localPlayer?.id) {
      realtimeRef.current.send('REQUEST_SYNC', { playerId: localPlayer.id }, localPlayer.id);
    }
  }, [localPlayer?.id]);

  const broadcastLeave = useCallback(() => {
    if (realtimeRef.current && localPlayer?.id) {
      realtimeRef.current.send('PLAYER_LEFT', localPlayer.id, localPlayer.id);
    }
  }, [localPlayer?.id]);

  return { broadcastStartGame, broadcastGameState, requestSync, broadcastLeave };
}
