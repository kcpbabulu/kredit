#!/usr/bin/env bash
# OPSIONAL & BELUM DIUJI di lingkungan saya (tanpa internet). Jalankan di komputer Anda.
# Hasil: tailwind.css statis + app.min.js. Setelah itu di index.html:
#   1) hapus <script src="https://cdn.tailwindcss.com/3.4.17"> dan blok inline `tailwind.config = {...}`
#   2) tambahkan <link href="tailwind.css?v=1530" rel="stylesheet"> sebelum style.css
#   3) ganti app.js?v=1530 -> app.min.js?v=1530 (dan perbarui APP_SHELL di sw.js)
set -euo pipefail
cd "$(dirname "$0")/.."
npx --yes tailwindcss@3.4.17 -c tailwind.config.js -i tools/tailwind-input.css -o tailwind.css --minify
npx --yes esbuild@0.24.2 app.js --minify --outfile=app.min.js
ls -la tailwind.css app.min.js
