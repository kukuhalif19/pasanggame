#!/usr/bin/env bash
# Kompilasi wordBattleEngine.ts -> CommonJS supaya bisa di-unit-test dari Node
# tanpa bundler (Vite 8/rolldown tidak menyediakan esbuild).
set -e

cd "$(dirname "$0")/.."

OUT="${ENGINE_OUT:-$LOCALAPPDATA/Temp/pg-engine-test}"

rm -rf "$OUT"
npx tsc src/game/wordBattleEngine.ts \
  --ignoreConfig \
  --outDir "$OUT" \
  --module commonjs \
  --target es2022 \
  --moduleResolution node \
  --skipLibCheck \
  --esModuleInterop

echo "Engine terkompilasi ke: $OUT"
