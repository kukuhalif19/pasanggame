# Word Party (PasangGame) — Product Requirements Document (PRD)

## 1. Visi & Tujuan

**Nama produk (placeholder):** PasangGame  
**Tagline (saran):** Main bareng, meski beda ruang.  
**Tujuan:** Web publik yang memungkinkan pasangan LDR dan teman bermain game party ringan secara sinkron (real-time) melalui browser HP/desktop tanpa perlu daftar akun.

## 2. Target User

- Pasangan LDR yang ingin main game ringan sambil voice call
- Teman/kelompok kecil (2–4 orang)
- Pengguna yang ingin main dalam < 30 detik tanpa registrasi

## 3. Keputusan Produk yang Sudah Terkunci

| # | Aspek | Keputusan |
|---|---|---|
| 1 | Tujuan | Web publik multi-game party untuk LDR & teman |
| 2 | Nama game susun kata | **Word Battle** (bukan Scrabble) |
| 3 | Waktu main | Sinkron real-time |
| 4 | Model main | Buat room → link invite → join |
| 5 | Kapasitas room | Min 2, maks 4 pemain |
| 6 | Auth | Tanpa akun, cukup nama panggilan + token browser |
| 7 | Reconnect | Grace period 60 detik, token browser sama |
| 8 | Mode public/invite | Invite-only, tidak ada daftar publik |
| 9 | Room persistence | Tidak disimpan; room hilang saat semua pemain keluar |
| 10 | Bahasa UI | Bahasa Indonesia |
| 11 | Target platform | Web responsive + mobile-first |
| 12 | Budget | Free tier murni |
| 13 | Voice chat | Tidak dibuat; pakai WA/Discord |

## 4. Tech Stack

| Layer | Teknologi | Alasan |
|---|---|---|
| Frontend | React + Vite | Ringan, familiar, build cepat |
| Styling | Tailwind CSS | Utility-first, responsive mudah |
| State UI | Zustand | Simpel, ringan |
| Real-time | Supabase Realtime Broadcast | Free tier tanpa kartu, WebSocket managed |
| Backend | Supabase Edge Functions (hanya untuk validasi kata Word Battle) | Validasi server-side minimal |
| Hosting | Vercel | Deploy otomatis dari GitHub, gratis |
| Domain MVP | Subdomain Vercel (pasanggame.vercel.app) | Gratis, upgrade domain nanti |

## 5. User Flow

### 5.1 Create Room
1. User buka web
2. Halaman landing: input nama panggilan
3. Tombol "Buat Room"
4. Sistem generate room code 6 karakter (huruf kapital, tanpa 0/O/1/I/L)
5. User masuk lobby sebagai host

### 5.2 Lobby
- Tampil room code besar
- Tombol copy link invite (`domain/join/:code`)
- Daftar pemain (slot 1–4)
- Badge status: host, siap, terputus
- Dropdown pilih game (Word Battle, This or That, Truth or Dare)
- Panel setting game:
  - Timer per turn: 30 detik / 60 detik / 90 detik (default 60 detik)
  - Maksimal huruf swap: 5 huruf
  - End game: 3 ronde pass berturut-turut
  - Setting hanya bisa diubah host sebelum game dimulai
- Tombol "Mulai" hanya aktif untuk host jika jumlah pemain >= 2

### 5.3 Invite & Join
- Pemain lain buka link invite
- Input nama panggilan
- Masuk lobby
- Real-time update untuk semua pemain di room

### 5.4 Gameplay
- Host klik mulai
- Countdown 3 detik
- Game jalan
- Setelah selesai, tampil hasil
- Tombol "Balik ke Lobby" untuk main lagi atau ganti game

### 5.5 End Room
- Kalau semua pemain keluar, room dianggap selesai
- Tidak ada data yang disimpan

## 6. Arsitektur Real-Time

### 6.1 Konsep Channel
- Satu room = satu channel Supabase Realtime
- Nama channel: `room:{roomCode}`
- Semua pemain subscribe channel yang sama

### 6.2 Peran Host
- Host browser berperan sebagai "wasit"
- Mengatur state game
- Menghitung skor
- Broadcast event saat state berubah

### 6.3 Event Types
- `player:joined` — pemain masuk lobby
- `player:left` — pemain keluar / disconnect
- `player:reconnected` — pemain balik
- `game:selected` — host pilih game
- `game:started` — host mulai game
- `game:state_update` — state game berubah
- `game:finished` — game selesai
- `game:return_to_lobby` — balik ke lobby

### 6.4 State Management
- Global state di Zustand
- State per room di-sync via Supabase Realtime
- State game minimalis, JSON-serializable

## 7. Game 1: Word Battle

### 7.1 Mekanik Dasar
- Papan 13×13
- Setiap pemain dapat 7 huruf di rack
- Susun kata di papan, sambung huruf minimal dengan kata yang sudah ada
- Kata harus valid di kamus Bahasa Indonesia + slang kurasi
- Giliran bergantian, timer dipilih host di lobby (30s / 60s / 90s, default 60s)
- Kalau selama 3 ronde penuh berturut-turut tidak ada yang menempatkan kata, game berakhir
- Game berakhir kalau stock huruf habis DAN salah satu pemain rack-nya kosong
- Game berakhir kalau papan sudah penuh (edge case jarang)
- Fitur swap: tukar maksimal 5 huruf rack dengan stock, menghabiskan 1 turn
- Fitur skip: lewat turn
- Langkah pertama harus melewati center star (petak tengah)

### 7.2 Validasi
- Kata harus ada di kamus
- Kata harus nyambung dengan kata yang sudah ada (kecuali langkah pertama)
- Tidak boleh menempatkan huruf sembarangan di luar aturan
- Validasi kata utama di server via Edge Function

### 7.3 Skor
- Tiap huruf punya nilai berdasar frekuensi Bahasa Indonesia
- Bonus petak: 2L, 3L, 2W, 3W (bukan posisi sama dengan Scrabble)
- Skor = sum(nilai huruf × bonus huruf) × bonus kata

### 7.4 Distribusi Huruf (contoh berdasar frekuensi BI)

| Huruf | Jumlah | Nilai |
|---|---|---|
| A | 17 | 1 |
| I | 9 | 1 |
| U | 7 | 1 |
| E | 8 | 1 |
| O | 7 | 1 |
| N | 6 | 1 |
| S | 5 | 1 |
| T | 5 | 1 |
| R | 5 | 2 |
| K | 4 | 2 |
| L | 4 | 2 |
| D | 4 | 2 |
| M | 3 | 2 |
| G | 3 | 3 |
| B | 3 | 3 |
| H | 3 | 3 |
| P | 3 | 3 |
| C | 2 | 4 |
| J | 2 | 4 |
| Y | 2 | 4 |
| W | 2 | 4 |
| V | 2 | 5 |
| F | 1 | 5 |
| Z | 1 | 8 |
| Q | 1 | 8 |
| X | 1 | 8 |
| Blank | 2 | 0 |

*(Distribusi final akan dihitung dari korpus kata MVP. Total tiles termasuk 2 blank = 100)*

### 7.5 Kamus
- Target: 1.000 kata untuk MVP
- Sumber utama: Wiktionary Indonesia (CC BY-SA)
- Tambahan: slang gaul Jakarta, gaming, sosmed (kurasi internal)
- Edge Function menerima array kata, return valid/invalid per kata

## 8. Game 2: This or That (Rilis Berikutnya)

- Bank pertanyaan A vs B kurasi internal
- Semua pemain lihat pertanyaan sama
- Vote dalam waktu tertentu
- Hasil: persentase vote setelah timer habis

## 9. Game 3: Truth or Dare (Rilis Berikutnya)

- Bank Truth dan Dare kurasi internal
- Random selector menentukan target
- Target pilih Truth atau Dare
- Semua lihat prompt

## 10. UI/UX & Design System

### 10.1 Prinsip Desain
- Mobile-first, playful, modern
- Dark cinematic background dengan aksen ungu & oranye
- Tombol besar, mudah di-tap
- Animasi halus, tidak berlebihan
- No emoji — pakai SVG/ikon
- Reduced motion dihormati

### 10.2 Color Tokens

| Token | HEX | Penggunaan |
|---|---|---|
| Background | `#0B0B10` | Latar utama |
| Surface | `#141419` | Kartu, panel, lobby |
| Surface elevated | `#1C1C24` | Hover, active state |
| Primary | `#7C3AED` | Aksen ungu utama |
| Primary hover | `#8B5CF6` | Hover primary |
| CTA | `#F97316` | Tombol aksi utama |
| CTA hover | `#FB923C` | Hover CTA |
| Text primary | `#F3F4F6` | Teks utama |
| Text muted | `#9CA3AF` | Teks sekunder |
| Success | `#10B981` | Kata valid |
| Error | `#EF4444` | Kata invalid, error |
| Tile face | `#F3F4F6` | Warna huruf di papan |
| Tile text | `#1F2937` | Warna huruf tile |
| Rack tile | Gradient ungu-oranye | Huruf di rack pemain |

### 10.3 Typography
- **Display/Headlines**: Fredoka atau Outfit
- **Body/UI**: Nunito atau Inter

### 10.4 Screen
- Landing
- Join Room
- Lobby
- Game Word Battle
- Result Screen

## 11. Error Handling & Edge Cases

| Kasus | Handling |
|---|---|
| Room code tidak ditemukan | Tampil error, arahkan ke landing |
| Room penuh | Tampil error, minta tunggu atau buat room baru |
| Host keluar | Host otomatis pindah ke pemain berikutnya |
| Pemain disconnect | Kursi ditahan 60 detik, badge "terputus" |
| Reconnect dalam 60 detik | Pemain balik ke kursi & skor yang sama |
| Browser freeze saat call | Timer tetap berjalan berdasar timestamp server |
| Network terputus saat main | Tampil reconnecting indicator |
| Semua pemain keluar | Room hilang |

## 12. Non-Goals (Tidak Ada di MVP)

- Akun / login
- Leaderboard global
- Chat dalam game
- Voice chat
- Public room list
- Riwayat game
- Push notification
- Multi-language

## 13. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Pelanggaran merek dagang Scrabble | Hindari nama, ukuran papan 15×15, distribusi huruf, dan visual Scrabble |
| Pelanggaran hak cipta KBBI | Pakai Wiktionary + kurasi internal |
| Supabase project sleep setelah 7 hari idle | Setup cron ping mingguan |
| Cheat oleh host | Validasi kata via Edge Function untuk Word Battle |
| Room menggantung | Auto-cleanup saat tidak ada pemain |

## 14. Kriteria Rilis MVP

- [ ] Bisa buat room dan invite pemain lain
- [ ] Bisa main Word Battle 2–4 orang real-time
- [ ] Validasi kata bahasa Indonesia + slang bekerja
- [ ] Host migration bekerja
- [ ] Reconnect dalam 60 detik bekerja
- [ ] UI responsive di HP dan desktop
- [ ] Deploy di Vercel + Supabase free tier

## 15. Next Steps Setelah Approval PRD

1. Tulis implementation plan (waves/tasks)
2. Setup repo + Supabase project
3. Wave 1: Lobby & room system
4. Wave 2: Word Battle core
5. Wave 3: Polish & deploy
