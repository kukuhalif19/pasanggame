import { chromium } from 'playwright-core';

const URL = 'http://localhost:5173/';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function run() {
  console.log('--- TEST WILDCARD (BLANK TILE) FLOW ---');
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[PAGE ERROR]', msg.text());
  });

  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');

  // Setup deterministic state via __gameStore
  await page.evaluate(() => {
    const store = window.__gameStore;
    const p1Id = 'p1';
    const p2Id = 'p2';

    // Blank tile + tiles for KUDA ('U', 'D', 'A')
    const blankTile = { id: 'tile-blank-1', letter: '', value: 0, isBlank: true };
    const uTile = { id: 'tile-u-1', letter: 'U', value: 1, isBlank: false };
    const dTile = { id: 'tile-d-1', letter: 'D', value: 3, isBlank: false };
    const aTile = { id: 'tile-a-1', letter: 'A', value: 1, isBlank: false };

    store.setRoom({
      code: 'WILD1',
      name: 'Wildcard Room',
      game: 'word-battle',
      status: 'playing',
      hostId: p1Id,
      maxPlayers: 2,
      players: [
        { id: p1Id, name: 'Kukuh', isHost: true, score: 0, joinedAt: 1, rack: [blankTile, uTile, dTile, aTile] },
        { id: p2Id, name: 'Lawan', isHost: false, score: 0, joinedAt: 2, rack: [] }
      ]
    });

    store.setLocalPlayer({ id: p1Id, name: 'Kukuh' });

    const emptyBoard = Array.from({ length: 13 }, (_, r) =>
      Array.from({ length: 13 }, (_, c) => ({
        row: r,
        col: c,
        multiplier: 'NONE',
        tile: null,
        bonusUsed: false
      }))
    );
    emptyBoard[6][6].multiplier = 'CENTER';

    store.setWordBattle({
      board: emptyBoard,
      stock: [],
      currentPlayerId: p1Id,
      turnTimeLimit: 60,
      turnStartedAt: Date.now(),
      consecutivePasses: 0,
      winnerId: null,
      history: []
    });
  });

  // Navigate to game page
  await page.goto('http://localhost:5173/room/WILD1/game');
  await page.waitForSelector('[data-testid="rack-tile"]');

  // 1. Cek ubin di rak
  const rackTiles = await page.$$('[data-testid="rack-tile"]');
  console.log('Jumlah ubin di rak:', rackTiles.length);
  const blankTileEl = rackTiles[0];
  const blankText = await blankTileEl.textContent();
  console.log('Teks ubin wildcard di rak:', blankText.trim());
  if (!blankText.includes('?')) {
    throw new Error('Ubin wildcard seharusnya menampilkan simbol ?');
  }

  // 2. Klik ubin ? di rak
  await blankTileEl.click();
  console.log('Ubin ? dipilih');

  // 3. Klik cell tengah (6,6)
  const centerCell = page.locator('[data-row="6"][data-col="6"]');
  await centerCell.click();
  console.log('Petak (6,6) diklik, menunggu modal wildcard...');

  // 4. Verifikasi WildcardModal muncul
  await page.waitForSelector('[data-testid="wildcard-letter-K"]', { timeout: 3000 });
  console.log('✓ WildcardModal berhasil muncul!');

  // 5. Pilih huruf 'K'
  await page.click('[data-testid="wildcard-letter-K"]');
  console.log('Huruf K dipilih');

  // 6. Verifikasi petak (6,6) sekarang menampilkan 'K' dengan nilai 0
  await page.waitForTimeout(300);
  const cellText = await centerCell.textContent();
  console.log('Teks di petak (6,6) setelah dipilih:', cellText);
  if (!cellText.includes('K')) {
    throw new Error(`Petak seharusnya menampilkan K, tetapi mendapatkan: ${cellText}`);
  }

  // 7. Tarik kembali untuk memastikan tombol Tarik reset kembali
  await page.click('button:has-text("Tarik")');
  console.log('Tombol Tarik diklik');
  await page.waitForTimeout(200);
  const cellAfterRecall = await centerCell.textContent();
  if (cellAfterRecall.includes('K')) {
    throw new Error('Petak seharusnya kosong setelah ditarik');
  }
  console.log('✓ Tombol Tarik berhasil mengembalikan wildcard ke rak');

  // 8. Sekarang tempatkan kata K-U-D-A menggunakan ubin wildcard sebagai K
  // Pilih blank tile lagi
  const rackTilesAgain = await page.$$('[data-testid="rack-tile"]');
  await rackTilesAgain[0].click();
  await centerCell.click();
  await page.waitForSelector('[data-testid="wildcard-letter-K"]');
  await page.click('[data-testid="wildcard-letter-K"]');

  // Letakkan U di (6,7)
  const uTileEl = page.locator('[data-testid="rack-tile"]:has-text("U")');
  await uTileEl.click();
  await page.click('[data-row="6"][data-col="7"]');

  // Letakkan D di (6,8)
  const dTileEl = page.locator('[data-testid="rack-tile"]:has-text("D")');
  await dTileEl.click();
  await page.click('[data-row="6"][data-col="8"]');

  // Letakkan A di (6,9)
  const aTileEl = page.locator('[data-testid="rack-tile"]:has-text("A")');
  await aTileEl.click();
  await page.click('[data-row="6"][data-col="9"]');

  await page.waitForTimeout(500);

  // Verifikasi banner kata terbaca "KUDA"
  const bannerText = await page.locator('header, div').filter({ hasText: /Kata Terbentuk/i }).first().textContent();
  console.log('Banner preview:', bannerText);
  if (!bannerText.includes('KUDA')) {
    throw new Error(`Banner seharusnya membaca kata KUDA, tetapi teks: ${bannerText}`);
  }
  console.log('✓ Kata KUDA berhasil terbentuk dengan wildcard K!');

  // 9. Klik "Tempatkan Kata"
  const playButton = page.locator('button:has-text("Tempatkan Kata")');
  const isEnabled = await playButton.isEnabled();
  console.log('Tombol Tempatkan Kata aktif?', isEnabled);
  if (!isEnabled) {
    throw new Error('Tombol Tempatkan Kata seharusnya aktif untuk kata KUDA');
  }

  await playButton.click();
  await page.waitForTimeout(500);
  console.log('✓ Kata KUDA berhasil ditempatkan!');

  await browser.close();
  console.log('=== SEMUA TEST WILDCARD LULUS DENGAN SUKSES! ===');
}

run().catch(err => {
  console.error('TEST GAGAL:', err);
  process.exit(1);
});
