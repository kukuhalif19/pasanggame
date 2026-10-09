# PasangGame — Implementation Plan

## Overview

| **Proyek**: PasangGame — web party game untuk pasangan LDR & teman |


- **Stack**: React + Vite + Tailwind CSS + Zustand
- **Realtime**: BroadcastChannel (classroom-level async), Supabase deps tersedia tapi belum integrasi (stub supabaseRealtime.ts)
- **Phase 1**: Local development + deploy Vercel (mock realtime)
- **Phase 2**: Integrasi Supabase Realtime → multi-device sync (tunda, manual integration saat perlu) |

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

## Wave 6: Integrasi Supabase Realtime & Deploy

### Tujuan
Game multi-device real-time, deploy ke Vercel.

### Status
🚧 **BLOCKED** (Manual execution - auto-dispatch error `hermes_cli` not found)

### Tasks
6.1 Setup Supabase project free tier  
6.2 Integrasi Supabase Realtime Broadcast  
6.3 Ganti mock real-time dengan Supabase channel  
6.4 Setup Vercel project & deploy  
6.5 Custom domain atau subdomain Vercel  
6.6 Testing multi-device  
6.7 Lighthouse audit & Core Web Vitals  

## Wave 7: Rilis Berikutnya (Backlog)

### Status
🚧 **BLOCKED** (Manual execution - auto-dispatch error `hermes_cli` not found)

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
- Host browser sebagai wasit, validasi kata via server
- Local dulu, live nanti
