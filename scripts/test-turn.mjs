/**
 * Test logika giliran Word Battle (skip/play/swap rotation).
 * Jalankan: node scripts/test-turn.mjs
 *
 * Fokus: memastikan giliran SELALU berpindah ke pemain lain saat skip,
 * termasuk kasus pemain tidak ditemukan (index -1) yang dulu bikin giliran macet.
 */

// --- Copy logika dari src (dijaga sinkron) ---
function getNextPlayerId(players, currentPlayerId) {
  if (players.length === 0) return currentPlayerId;
  const sorted = [...players].sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
  const idx = sorted.findIndex((p) => p.id === currentPlayerId);
  if (idx === -1) return sorted[0].id;
  return sorted[(idx + 1) % sorted.length].id;
}

let pass = 0;
let fail = 0;
function check(name, actual, expected) {
  if (actual === expected) {
    pass++;
    console.log(`  ok  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL ${name}: expected ${expected}, got ${actual}`);
  }
}

const A = { id: 'A', name: 'A', joinedAt: 100 };
const B = { id: 'B', name: 'B', joinedAt: 200 };
const C = { id: 'C', name: 'C', joinedAt: 300 };

console.log('2 pemain:');
check('A -> B', getNextPlayerId([A, B], 'A'), 'B');
check('B -> A', getNextPlayerId([A, B], 'B'), 'A');

console.log('3 pemain:');
check('A -> B', getNextPlayerId([A, B, C], 'A'), 'B');
check('B -> C', getNextPlayerId([A, B, C], 'B'), 'C');
check('C -> A', getNextPlayerId([A, B, C], 'C'), 'A');

console.log('urutan array berbeda harus menghasilkan giliran sama:');
check('[C,B,A] A -> B', getNextPlayerId([C, B, A], 'A'), 'B');
check('[B,A,C] A -> B', getNextPlayerId([B, A, C], 'A'), 'B');

console.log('kasus tepi:');
check('currentPlayerId tidak ada di list -> pemain pertama', getNextPlayerId([A, B], 'X'), 'A');
check('1 pemain -> tetap dirinya', getNextPlayerId([A], 'A'), 'A');
check('list kosong -> tidak crash', getNextPlayerId([], 'A'), 'A');

console.log('\nskip 5x bolak-balik 2 pemain tidak boleh macet:');
let cur = 'A';
const seq = [];
for (let i = 0; i < 5; i++) {
  cur = getNextPlayerId([A, B], cur);
  seq.push(cur);
}
check('urutan skip', seq.join(','), 'B,A,B,A,B');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
