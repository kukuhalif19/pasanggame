// Uji menyeluruh: apakah kata gabungan (cross-word) benar-benar terbaca
// di semua arah & posisi. Meniru keluhan user: "board ada P, tambah ANAS
// harusnya jadi PANAS, tapi cuma kebaca ANAS".
// Jalankan: node scripts/test-crossword-deep.mjs

import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

const OUT = process.env.ENGINE_OUT || 'C:/Users/kukuh/AppData/Local/Temp/pg-engine-test';
const engPath = `${OUT}/game/wordBattleEngine.js`;
if (!existsSync(engPath)) {
  console.error(`Engine belum dikompilasi: ${engPath}\nJalankan: bash scripts/build-engine.sh`);
  process.exit(1);
}
const require = createRequire(import.meta.url);
const { createEmptyBoard, calculateScore } = require(engPath);

let pass = 0, fail = 0;
const lines = [];
function check(name, ok, detail = '') {
  if (ok) { pass++; lines.push(`  ok   ${name}`); }
  else { fail++; lines.push(`  FAIL ${name} — ${detail}`); }
}

let tid = 0;
const tile = (letter, value = 1) => ({ id: `t${++tid}`, letter, value, isBlank: false });
function boardWith(cells) {
  const b = createEmptyBoard();
  for (const [r, c, letter] of cells) b[r][c].tile = tile(letter);
  return b;
}
const wordsOf = (res) => (res.words || []).map((w) => w.word.toUpperCase());
const P = (r, c, l) => ({ row: r, col: c, tile: tile(l) });

// ---- 1. HORIZONTAL: P di kiri, tambah ANAS ke kanan ----
{
  const res = calculateScore([P(6,7,'A'), P(6,8,'N'), P(6,9,'A'), P(6,10,'S')], boardWith([[6,6,'P']]));
  check('H: P + ANAS(kanan) → PANAS', wordsOf(res).includes('PANAS'), `[${wordsOf(res)}]`);
}
// ---- 2. HORIZONTAL: huruf lama di KIRI, huruf baru mengisi ke KANAN ----
// Regresi bug: readWordFromLine dulu mulai dari placements[0] lalu maju ke
// kanan, sehingga run terbaca "ANASP" bukan "PANAS".
{
  const res = calculateScore([P(6,3,'A'), P(6,4,'N'), P(6,5,'A'), P(6,6,'S')], boardWith([[6,2,'P']]));
  check('H: P(6,2) + ANAS ke kanan (lama di KIRI) → PANAS',
    wordsOf(res).includes('PANAS'), `[${wordsOf(res)}] ${res.message||''}`);
}
// ---- 3. VERTIKAL: P di atas, tambah ANAS ke bawah ----
{
  const res = calculateScore([P(7,6,'A'), P(8,6,'N'), P(9,6,'A'), P(10,6,'S')], boardWith([[6,6,'P']]));
  check('V: P + ANAS(bawah) → PANAS', wordsOf(res).includes('PANAS'), `[${wordsOf(res)}] ${res.message||''}`);
}
// ---- 4. VERTIKAL: huruf lama di ATAS, huruf baru mengisi ke BAWAH ----
{
  const res = calculateScore([P(3,6,'A'), P(4,6,'N'), P(5,6,'A'), P(6,6,'S')], boardWith([[2,6,'P']]));
  check('V: P(2,6) + ANAS ke bawah (lama di ATAS) → PANAS',
    wordsOf(res).includes('PANAS'), `[${wordsOf(res)}] ${res.message||''}`);
}
// ---- 5. Kata lama panjang: MAKAN, tambah 'AN' jadi MAKANAN ----
{
  const res = calculateScore([P(6,11,'A'), P(6,12,'N')],
    boardWith([[6,6,'M'],[6,7,'A'],[6,8,'K'],[6,9,'A'],[6,10,'N']]));
  check('H: MAKAN + AN → MAKANAN', wordsOf(res).includes('MAKANAN'), `[${wordsOf(res)}] ${res.message||''}`);
}
// ---- 6. Kata lama di tengah: 'MA' + 'KAN' + huruf baru nyambung ----
{
  const res = calculateScore([P(6,8,'K'), P(6,9,'A'), P(6,10,'N')], boardWith([[6,6,'M'],[6,7,'A']]));
  check('H: MA + KAN → MAKAN', wordsOf(res).includes('MAKAN'), `[${wordsOf(res)}]`);
}
// ---- 7. ANAS sendirian (tanpa P) harus DITOLAK: bukan kata ----
{
  const res = calculateScore([P(6,7,'A'), P(6,8,'N'), P(6,9,'A'), P(6,10,'S')], boardWith([[5,5,'B']]));
  check('ANAS sendirian ditolak (bukan kata)', !res.isValidPlacement, `lolos skor ${res.score}`);
}
// ---- 8. Skor PANAS harus 5 huruf, bukan 4 ----
{
  const res = calculateScore([P(6,7,'A'), P(6,8,'N'), P(6,9,'A'), P(6,10,'S')], boardWith([[6,6,'P']]));
  const w = (res.words || []).find((x) => x.word.toUpperCase() === 'PANAS');
  check('PANAS dihitung 5 huruf (P lama ikut)', w && w.tiles.length === 5, `panjang=${w?.tiles.length}`);
  check('hanya 1 kata dilaporkan (tidak dobel)', (res.words || []).length === 1, `[${wordsOf(res)}]`);
}
// ---- 9. Kata SILANG (perpendicular): harus ikut terbaca & diskor ----
{
  // Papan 'A' di (5,6). Pemain taruh PANAS di (6,6..6,10).
  // → horizontal PANAS, DAN vertikal A+P = "AP" harus ikut terbaca.
  const res = calculateScore(
    [P(6,6,'P'), P(6,7,'A'), P(6,8,'N'), P(6,9,'A'), P(6,10,'S')],
    boardWith([[5,6,'A']])
  );
  const ws = wordsOf(res);
  check('silang: horizontal PANAS terbaca', ws.includes('PANAS'), `[${ws}] ${res.message||''}`);
  check('silang: vertikal AP ikut terbaca', ws.includes('AP'), `[${ws}]`);
  check('silang: 2 kata diskor (PANAS + AP)', (res.words || []).length === 2, `[${ws}]`);
}
// ---- 10. Huruf lama mengapit: P,A,N,_,S + A baru di tengah → PANAS ----
{
  const res = calculateScore([P(6,9,'A')],
    boardWith([[6,6,'P'],[6,7,'A'],[6,8,'N'],[6,10,'S']]));
  check('H: lama mengapit + A baru di tengah → PANAS',
    wordsOf(res).includes('PANAS'), `[${wordsOf(res)}] ${res.message||''}`);
}

console.log(lines.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
