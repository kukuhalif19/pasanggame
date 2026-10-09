import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import type { RealtimeEvent } from '../types';

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
      console.warn('[SupabaseRT] No URL/ANON key configured — falling back to no-op');
      return;
    }
    if (this.channel) return;

    this.channel = sb.channel(`pasanggame:${roomCode}`, {
      config: { broadcast: { self: false } },
    });

    this.channel.on('broadcast', { event: 'pasanggame' }, (payload) => {
      const data: RealtimeEvent = payload.payload as RealtimeEvent;
      [...this.listeners].forEach((listener) => listener(data));
    });

    this.channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[SupabaseRT] Connected to room: ${roomCode}`);
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn(`[SupabaseRT] Status: ${status} for room ${roomCode}`);
      }
    });
  }

  send(type: string, payload: unknown, senderId?: string) {
    if (!this.channel) return;
    const event: RealtimeEvent = {
      type: type as RealtimeEvent['type'],
      payload,
      timestamp: Date.now(),
      senderId,
    };
    this.channel.send({ type: 'broadcast', event: 'pasanggame', payload: event });
  }

  on(listener: (event: RealtimeEvent) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  async disconnect() {
    if (this.channel) {
      await this.channel.unsubscribe();
      this.channel = null;
    }
    this.listeners = [];
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
