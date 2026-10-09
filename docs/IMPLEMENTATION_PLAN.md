# PasangGame — Implementation Plan

## Overview

- **Proyek**: PasangGame — web party game untuk pasangan LDR & teman
- **Repo**: `github.com/kukuhalif19/pasanggame`
- **Live**: **`https://pasanggame.vercel.app`** (HTTP 200, deploy aktif via Vercel)
- **Stack**: React + Vite + Tailwind CSS + Zustand
- **Realtime**: **Supabase Realtime Broadcast** (sudah terintegrasi & live). Channel `pasanggame:{roomCode}`.
  Kredensial via env `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. `services/mockRealtime.ts` (BroadcastChannel) tidak dipakai lagi.
- **Kamus**: KBBI v6.1.0 — 123.463 kata (jauh melampaui target awal 1.000 kata)

### Status Ringkas

| Fase | Isi | Status |
|---|---|---|
| Wave 1 | Setup & arsitektur dasar | ✅ done |
| Wave 2 | Room system (create/join/lobby) | ✅ done |
| Wave 3 | Word Battle core (papan 17×17, rack, skor, timer) | ✅ done |
| Wave 4 | Kamus & validasi | ✅ done (KBBI v6.1.0) |
| Wave 5 | Polish UI/UX & animasi | ✅ done |
| Wave 6A | Deploy Vercel | ✅ **LIVE** |
| Wave 6B | Supabase Realtime multi-device | ✅ **LIVE** (Broadcast) |
| Wave 6C | Auto-resync saat reconnect + indikator koneksi | ✅ done |
| Wave 7 | Game 2 & 3, chat, leaderboard (backlog) | 🚧 pending |

> **Papan 17×17** dengan layout bonus simetris 180° (61 petak bonus). Distribusi 100 tile & aturan lain tidak berubah.
> **Urutan giliran diacak** saat game dimulai (`turnOrder`), bukan urutan join.

## Wave 1: Project Setup & Arsitektur Dasar

### Tujuan
Repo siap, tooling terinstall, struktur folder jelas, mock real-time jalan.

### Tasks
1.1 Inisialisasi project Vite + React + TypeScript  
1.2 Install dependencies: Tailwind CSS, Zustand, React Router, Phosphor icons  
1.3 Setup struktur folder (components, hooks, stores, types, utils, game)  
1.4 Setup Tailwind config dengan color tokens design system  
1.5 Setup TypeScript types dasar (Player, Room, GameState)  
1.6 Implementasi mock real-time service dengan BroadcastChannel/local events  
1.7 Verifikasi: `npm run dev` berjalan tanpa error

## Wave 2: Room System (Create, Join, Lobby)

### Tujuan
Pemain bisa buat room, invite, join, lihat daftar pemain di lobby.

### Tasks
2.1 Landing page: input nama + tombol buat room  
2.2 Room code generation (6 karakter, tanpa 0/O/1/I/L)  
2.3 Join page: input nama + room code  
2.4 Lobby UI: room code, copy link, daftar pemain, badge status  
2.5 Host detection & host migration saat host keluar  
2.6 Reconnect dengan grace period 60 detik  
2.7 Disconnect handling & kursi ditahan  
2.8 Verifikasi end-to-end: dua tab browser bisa create & join

## Wave 3: Word Battle — Core Game

### Tujuan
Papan 13×13, rack huruf, pemain bisa susun kata.

### Tasks
3.1 Render papan 13×13 dengan bonus petak  
3.2 Render rack huruf dari distribusi 100 tiles  
3.3 Drag & drop / tap untuk meletakkan huruf di papan  
3.4 Validasi placement dasar (nyambung ke kata lain, melewati center star)  
3.5 Validasi kata via mock dictionary dulu  
3.6 Hitung skor dasar  
3.7 Giliran bergantian & timer  
3.8 Tombol swap (maks 5 huruf, pengorbanan turn)  
3.9 Tombol skip (lewat turn)  
3.10 End game conditions (3 ronde pass, stock habis, papan penuh)  
3.11 Verifikasi: game bisa dimainkan 2 pemain sampai selesai

## Wave 4: Kamus & Validasi Server-Side

### Tujuan
Validasi kata pakai kamus Bahasa Indonesia + slang kurasi.

### Tasks
4.1 Kumpulkan daftar kata Indonesia dari Wiktionary / open source  
4.2 Kurasi slang gaul Jakarta, gaming, sosmed  
4.3 Build mock dictionary 1.000 kata untuk local dev  
4.4 Setup Supabase project & Edge Function untuk validasi kata  
4.5 Integrasi frontend dengan Edge Function  
4.6 Verifikasi: kata valid diterima, kata invalid ditolak

## Wave 5: Polish UI/UX & Animasi

### Tujuan
Tampilan modern, playful, responsive, animasi halus.

### Tasks
5.1 Apply design system colors & typography  
5.2 Responsive layout mobile & desktop  
5.3 Animasi tile snap, score counter, turn transition  
5.4 Loading & empty states  
5.5 Error states & toast notifications  
5.6 Sound effects (opsional, default OFF)  
5.7 prefers-reduced-motion  
5.8 Verifikasi UI di 375px, 768px, 1024px, 1440px

## Wave 6: Deploy & Realtime Multi-Device

### 6A — Deploy Vercel → ✅ LIVE
Produk sudah live di `https://pasanggame.vercel.app`. Vercel auto-deploy dari branch `master`
(`github.com/kukuhalif19/pasanggame`).

- ✅ 6.4 Setup Vercel project & deploy
- ✅ 6.5 Subdomain Vercel (`pasanggame.vercel.app`)
- ⚠️ 6.6 Testing multi-device — terbatas multi-tab (belum real multi-device)
- ⬜ 6.7 Lighthouse audit & Core Web Vitals (belum dijalankan)

### 6B — Supabase Realtime Multi-Device → ✅ LIVE
Supabase deps `@supabase/supabase-js@^2.117.3`, `services/supabaseRealtime.ts` aktif.
Channel `pasanggame:{roomCode}`, broadcast mode. Kredensial dari env
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (di-set di Vercel project settings).

- ✅ 6.1 Setup Supabase project free tier (`xsezlpbzwncjjxhcscdb`)
- ✅ 6.2 Integrasi Supabase Realtime Broadcast
- ✅ 6.3 Ganti mock real-time dengan Supabase channel
- ✅ Bisa main HP + laptop dari jaringan berbeda

### 6C — Auto-resync saat Reconnect → ✅ done
Menangani kasus ganti jaringan (Wi-Fi → seluler) yang bikin state tertinggal.

- ✅ Track status channel: `connecting` / `connected` / `reconnecting` / `disconnected`
- ✅ `send()` refuse saat belum `connected` (event tidak hilang diam-diam) + handle error
- ✅ Auto `REQUEST_SYNC` ke host begitu channel tersambung lagi
- ✅ Badge "Menyambungkan ulang…" saat koneksi tidak normal

### 6D — Belum dikerjakan
- ⬜ 6.7 Lighthouse audit & Core Web Vitals
- ⚠️ Pengujian multi-device nyata (beda jaringan) masih perlu dites manual

### 6E — Multi-Bahasa (IND / ENG / MIX) → ✅ done (commit `48fe7d5`)
Pilihan bahasa ditetapkan saat **Create Room**, ikut `GameSettings.language` dan
tersimpan di room → tidak bisa berubah mid-game. Backward-compatible: default `'id'`.

**Kamus terpisah (tidak tercampur):**
- IND → `dictionary.ts` (KBBI v6.1.0, 123.463 kata, import statis ~1.5MB)
- ENG → `dictionary-en.ts` (TWL06 Scrabble, 178.691 kata, ~2.2MB) — **lazy chunk**,
  hanya di-download saat mode EN/MIX (gzip 475KB). Mode IND tidak pernah fetch ini.
- MIX → kedua kamus aktif; validasi `isValidWordForLanguage(w, 'mix')` = OR
- Loader terpusat di `wordDictionary.ts`: `ensureDictionaryLoaded(lang)` dipanggil
  host sebelum `initWordBattle` → kamus dijamin siap sebelum tile dibagikan.

**Distribusi tile per mode (semua 98 huruf + 2 blank = 100):**
- `INDONESIAN_TILE_DISTRIBUTION` — profil huruf Indonesia (A×12, I×7, ...)
- `ENGLISH_TILE_DISTRIBUTION` — TWL06 standar (E×12, A×9, I×9, ...)
- `HYBRID_TILE_DISTRIBUTION` — rata-rata frekuensi kedua bahasa (A×12, E×8, ...)
- `createInitialTileBag(language)` memilih distribusi sesuai mode; tile tersimpan di
  `wordBattle.stock` → aman, tidak tertukar saat permainan berjalan.

**UI:**
- Create Room: 3 button `IND` / `ENG` / `MIX` (styling sama dengan selector timer,
  grid 3 kolom, highlight ungu saat aktif) di atas pilihan timer.

**Flow engine:**
- `initWordBattle(players, language)` → tile bag sesuai bahasa
- `calculateScore(placements, board, language)` → validasi kata sesuai bahasa
- Skor huruf MIX: memakai `tile.value` dari distribusi hybrid yang dipilih di awal
  (konsisten untuk semua kata, tidak bergantung kamus tempat kata valid).

## Wave 7: Rilis Berikutnya (Backlog)

### Status
🚧 **PENDING** — belum dimulai.

### Backlog Items
- Game 2: This or That
- Game 3: Truth or Dare
- Chat text dalam room
- Emoji reactions
- Leaderboard lokal
- Hint feature
- More words / slang expansions

## Deliverable Files

- `D:/Project/PasangGame/docs/PRD.md`
- `D:/Project/PasangGame/docs/IMPLEMENTATION_PLAN.md`
- Repository project (setelah Wave 1)

## Catatan Penting

- Tidak ada akun/login untuk MVP
- Target utama: 2-4 pemain, pasangan LDR
- Free tier murni untuk MVP
- Host browser sebagai wasit, validasi kata client-side
- **Produk sudah live di Vercel** (`pasanggame.vercel.app`)
- **Realtime**: Supabase Broadcast — sudah bisa main dari jaringan berbeda
- **Papan 17×17**, bonus simetris 180°, center di `(8,8)`
- **Urutan giliran acak** saat mulai (`turnOrder`), sinkron di semua pemain
- Kamus: KBBI v6.1.0 (123.463 kata, ID) + TWL06 (178.691 kata, EN, lazy chunk) — validasi client-side
- **Multi-bahasa**: mode IND / ENG / MIX dipilih saat Create Room (`GameSettings.language`),
  kamus terpisah per bahasa + distribusi tile per mode (ID / TWL06 / hybrid, semua 100 tile)
- `services/mockRealtime.ts` (BroadcastChannel) tidak dipakai lagi — hanya arsip

> **Catatan arsitektur**: Supabase dipakai mode **Broadcast murni** (tanpa tabel/DB).
> Host bertindak sebagai sumber state — kalau host keluar, state game tidak tersimpan di server.
> Event yang terlewat saat putus **tidak** bisa diambil ulang dari server (tidak ada history),
> karena itu auto-resync `REQUEST_SYNC` saat reconnect itu penting.
