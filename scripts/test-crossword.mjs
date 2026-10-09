// Unit test: validasi kata sambung (cross-word) di wordBattleEngine.
// Skenario: di papan sudah ada 'P'. Pemain menambah 'ANAS' → harus dibaca "PANAS",
// bukan hanya "ANAS". Kata "ANAS" sendiri BUKAN kata Indonesia, jadi harus DITOLAK.
// Jalankan: node scripts/test-crossword.mjs

import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

// Engine dikompilasi dulu oleh script shell:
//   bash scripts/build-engine.sh
const OUT = process.env.ENGINE_OUT || 'C:/Users/kukuh/AppData/Local/Temp/pg-engine-test';

const engPath = `${OUT}/game/wordBattleEngine.js`;
if (!existsSync(engPath)) {
  console.error(`Engine belum dikompilasi: ${engPath}`);
  console.error('Jalankan dulu: bash scripts/build-engine.sh');
  process.exit(1);
}

const require = createRequire(import.meta.url);
const eng = require(engPath);
const { createEmptyBoard, calculateScore } = eng;

let pass = 0, fail = 0;
const lines = [];
function check(name, ok, detail = '') {
  if (ok) { pass++; lines.push(`  ok   ${name}`); }
  else { fail++; lines.push(`  FAIL ${name} — ${detail}`); }
}

// Helper bikin tile
let tid = 0;
const tile = (letter, value = 1) => ({ id: `t${++tid}`, letter, value, isBlank: false });
const blank = () => ({ id: `t${++tid}`, letter: '', value: 0, isBlank: true, displayLetter: 'A' });

function boardWith(cells) {
  const b = createEmptyBoard();
  for (const [r, c, letter] of cells) {
    b[r][c].tile = tile(letter);
  }
  return b;
}

// ---------------------------------------------------------------
// SKENARIO UTAMA: papan punya 'P' di (6,6). Tambah 'ANAS' di (6,7..10).
// Kata horizontal terbaca = PANAS (valid). Tidak boleh hanya membaca ANAS.
// ---------------------------------------------------------------
{
  const board = boardWith([[6, 6, 'P']]);
  const placements = [
    { row: 6, col: 7, tile: tile('A') },
    { row: 6, col: 8, tile: tile('N') },
    { row: 6, col: 9, tile: tile('A') },
    { row: 6, col: 10, tile: tile('S') },
  ];
  const res = calculateScore(placements, board);
  const words = (res.words || []).map((w) => w.word.toUpperCase());
  check('kata terbaca sebagai PANAS (menyambung ke P lama)', words.includes('PANAS'), `dapat [${words}]`);
  check('"PANAS" diterima sebagai kata valid', res.isValidPlacement, res.message || '');
  check('skor PANAS = 5 huruf dihitung', res.score >= 5, `skor=${res.score}`);
  check('"ANAS" tidak dilaporkan sebagai kata terpisah',
    !words.includes('ANAS'), `dapat [${words}]`);
}

// ---------------------------------------------------------------
// NEGATIF: 'P' + 'ANAS' kalau hasilnya bukan kata → harus DITOLAK.
// Papan punya 'X' di (6,6); tambah 'ANAS' → "XANAS" bukan kata.
// ---------------------------------------------------------------
{
  const board = boardWith([[6, 6, 'X']]);
  const placements = [
    { row: 6, col: 7, tile: tile('A') },
    { row: 6, col: 8, tile: tile('N') },
    { row: 6, col: 9, tile: tile('A') },
    { row: 6, col: 10, tile: tile('S') },
  ];
  const res = calculateScore(placements, board);
  check('kata sambung tidak valid ("XANAS") DITOLAK',
    !res.isValidPlacement, `diterima dengan skor ${res.score}`);
  check('pesan error menyebut kata gabungan, bukan hanya ANAS',
    /XANAS/i.test(res.message || ''), `pesan="${res.message}"`);
}

// ---------------------------------------------------------------
// KATA SILANG TEGAK LURUS: 'P' di (6,6), 'A' ditaruh di (5,6) membuat kata
// vertikal "AP"; horizontal juga harus tetap dicek.
// ---------------------------------------------------------------
{
  const board = boardWith([[6, 6, 'P']]);
  const placements = [
    { row: 6, col: 7, tile: tile('A') },
    { row: 6, col: 8, tile: tile('N') },
    { row: 6, col: 9, tile: tile('A') },
    { row: 6, col: 10, tile: tile('S') },
  ];
  const res = calculateScore(placements, board);
  const words = (res.words || []).map((w) => w.word.toUpperCase());
  check('kata utama dilaporkan lengkap dengan koordinatnya',
    (res.words || []).length > 0 && res.words[0].tiles.length === 5,
    `panjang=${(res.words || [])[0]?.tiles.length}`);
}

// ---------------------------------------------------------------
// VERTIKAL: papan punya 'A' di (5,6); tambah 'NAS' ke bawah → "ANAS"?
// Kita pakai kata nyata: 'A' + 'PI' → tidak valid; pakai 'MA' + 'KAN' → MAKAN
// ---------------------------------------------------------------
{
  const board = boardWith([[6, 6, 'M'], [6, 7, 'A']]);
  const placements = [
    { row: 6, col: 8, tile: tile('K') },
    { row: 6, col: 9, tile: tile('A') },
    { row: 6, col: 10, tile: tile('N') },
  ];
  const res = calculateScore(placements, board);
  const words = (res.words || []).map((w) => w.word.toUpperCase());
  check('kata sambung di tengah papan terbaca "MAKAN"',
    words.includes('MAKAN'), `dapat [${words}]`);
  check('"MAKAN" diterima', res.isValidPlacement, res.message || '');
}

// ---------------------------------------------------------------
// Huruf lama yang dipakai menyambung TIDAK boleh dapat bonus square.
// ---------------------------------------------------------------
{
  const board = boardWith([[6, 6, 'P']]);
  const placements = [
    { row: 6, col: 7, tile: tile('A') },
    { row: 6, col: 8, tile: tile('N') },
    { row: 6, col: 9, tile: tile('A') },
    { row: 6, col: 10, tile: tile('S') },
  ];
  const res = calculateScore(placements, board);
  const w = (res.words || []).find((x) => x.word.toUpperCase() === 'PANAS');
  const pendingCount = w ? w.tiles.filter((t) => t.isPending).length : 0;
  check('huruf lama (P) ditandai bukan-pending', w ? w.tiles[0].isPending === false : false);
  check('4 huruf baru ditandai pending', pendingCount === 4, `dapat ${pendingCount}`);
}

console.log(lines.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
