import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import type { RealtimeEvent, ConnectionStatus } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Singleton supabase client
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

export class SupabaseRealtimeService {
  private channel: RealtimeChannel | null = null;
  private listeners: ((event: RealtimeEvent) => void)[] = [];
  private statusListeners: ((status: ConnectionStatus) => void)[] = [];
  private status: ConnectionStatus = 'connecting';
  /** Sudah pernah tersambung minimal sekali — dipakai untuk mendeteksi reconnect. */
  private hasConnectedOnce = false;
  public readonly roomCode: string;

  constructor(roomCode?: string) {
    this.roomCode = roomCode || '';
    if (roomCode) {
      this.connect(roomCode);
    }
  }

  connect(roomCode: string) {
    const sb = getSupabase();
    if (!sb) {
      console.warn('[SupabaseRT] No URL/ANON key configured — realtime disabled');
      this.setStatus('disconnected');
      return;
    }
    if (this.channel) return;

    this.setStatus('connecting');

    this.channel = sb.channel(`pasanggame:${roomCode}`, {
      config: { broadcast: { self: false } },
    });

    this.channel.on('broadcast', { event: 'pasanggame' }, (payload) => {
      const data: RealtimeEvent = payload.payload as RealtimeEvent;
      [...this.listeners].forEach((listener) => listener(data));
    });

    this.channel.subscribe((status) => {
      switch (status) {
        case 'SUBSCRIBED':
          this.setStatus('connected');
          if (!this.hasConnectedOnce) {
            this.hasConnectedOnce = true;
            console.log(`[SupabaseRT] Connected to room: ${roomCode}`);
          } else {
            // Reconnect setelah putus (ganti jaringan, HP sleep, dsb).
            // Hook useRoomSync akan meminta state terbaru saat status ini.
            console.log(`[SupabaseRT] Reconnected to room: ${roomCode}`);
          }
          break;

        case 'CHANNEL_ERROR':
          this.setStatus(this.hasConnectedOnce ? 'reconnecting' : 'disconnected');
          console.warn(`[SupabaseRT] Status: ${status} for room ${roomCode}`);
          break;

        case 'TIMED_OUT':
          this.setStatus('reconnecting');
          console.warn(`[SupabaseRT] Status: ${status} for room ${roomCode}`);
          break;

        case 'CLOSED':
          this.setStatus('disconnected');
          break;

        default:
          break;
      }
    });
  }

  /**
   * Kirim event. Mengembalikan false kalau channel belum siap — supaya
   * pemanggil tahu event tidak terkirim dan bisa mencoba lagi setelah
   * tersambung (event yang dikirim saat putus akan hilang diam-diam).
   */
  send(type: string, payload: unknown, senderId?: string): boolean {
    if (!this.channel || this.status !== 'connected') {
      return false;
    }
    const event: RealtimeEvent = {
      type: type as RealtimeEvent['type'],
      payload,
      timestamp: Date.now(),
      senderId,
    };
    // channel.send() mengembalikan Promise — tangani rejection supaya tidak
    // jadi unhandled error dan supaya kegagalan kirim terlihat di console.
    Promise.resolve(
      this.channel.send({ type: 'broadcast', event: 'pasanggame', payload: event })
    ).catch((err) => {
      console.warn('[SupabaseRT] send failed:', err);
    });
    return true;
  }

  on(listener: (event: RealtimeEvent) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /** Dengarkan perubahan status koneksi. Listener langsung dipanggil dengan status terkini. */
  onStatus(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.status);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  isReady(): boolean {
    return this.status === 'connected';
  }

  private setStatus(next: ConnectionStatus) {
    if (this.status === next) return;
    this.status = next;
    [...this.statusListeners].forEach((listener) => listener(next));
  }

  async disconnect() {
    if (this.channel) {
      await this.channel.unsubscribe();
      this.channel = null;
    }
    this.listeners = [];
    this.statusListeners = [];
    this.hasConnectedOnce = false;
    this.status = 'disconnected';
  }
}

// ==== Registry per room code ====
const registry = new Map<string, SupabaseRealtimeService>();

export function getRealtime(roomCode: string): SupabaseRealtimeService {
  let rt = registry.get(roomCode);
  if (!rt) {
    rt = new SupabaseRealtimeService(roomCode);
    registry.set(roomCode, rt);
  }
  return rt;
}

export function releaseRealtime(roomCode: string) {
  const rt = registry.get(roomCode);
  if (rt) {
    rt.disconnect();
    registry.delete(roomCode);
  }
}
