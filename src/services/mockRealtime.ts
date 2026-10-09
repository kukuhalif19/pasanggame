import type { RealtimeEvent } from '../types';

export class MockRealtimeService {
  private channel: BroadcastChannel | null = null;
  private listeners: ((event: RealtimeEvent) => void)[] = [];
  public readonly roomCode: string;

  constructor(roomCode?: string) {
    this.roomCode = roomCode || '';
    if (roomCode) {
      this.connect(roomCode);
    }
  }

  connect(roomCode: string) {
    // Jangan bikin channel baru kalau sudah connect
    if (this.channel) return;
    this.channel = new BroadcastChannel(`pasanggame-${roomCode}`);
    this.channel.onmessage = (event) => {
      const data: RealtimeEvent = event.data;
      // copy array supaya aman kalau listener unsubscribe saat iterasi
      [...this.listeners].forEach((listener) => listener(data));
    };
  }

  send(type: string, payload: unknown, senderId?: string) {
    const event: RealtimeEvent = {
      type: type as RealtimeEvent['type'],
      payload,
      timestamp: Date.now(),
      senderId,
    };
    // Hanya kirim ke tab LAIN. Tidak echo ke listener sendiri, karena
    // pengirim sudah meng-update state-nya secara langsung. Echo bikin
    // event diproses dua kali dan memicu loop broadcast.
    if (this.channel) {
      this.channel.postMessage(event);
    }
  }

  on(listener: (event: RealtimeEvent) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  disconnect() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners = [];
  }
}

// ==== Singleton registry per room code ====
// Supaya channel & listener tidak dobel saat hook dipanggil lebih dari sekali.
const registry = new Map<string, MockRealtimeService>();

export function getRealtime(roomCode: string): MockRealtimeService {
  let rt = registry.get(roomCode);
  if (!rt) {
    rt = new MockRealtimeService(roomCode);
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
