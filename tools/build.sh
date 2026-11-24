#!/usr/bin/env bash
# DaKOPen v1595 — Kompilasi Tailwind CSS statis & hapus CDN Tailwind otomatis (Anti-Flicker Permanen)
# Jalankan sekali di komputer Anda (macOS/Linux) yang memiliki Node.js:
#   bash kredit-main/tools/build.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "[1/3] Mengompilasi tailwind.css statis..."
npx --yes tailwindcss@3.4.17 -c tailwind.config.js -i tools/tailwind-input.css -o tailwind.css --minify

echo "[2/3] Menghapus CDN Tailwind dari index.html & menautkan tailwind.css..."
node -e '
const fs = require("fs");
let html = fs.readFileSync("index.html", "utf8");
html = html.replace(/<script\s+src="https:\/\/cdn\.tailwindcss\.com\/3\.4\.17"><\/script>\s*/g, "");
if (!html.includes("tailwind.css")) {
  html = html.replace("<link href=\"style.css", "<link href=\"tailwind.css?v=1595\" rel=\"stylesheet\">\n<link href=\"style.css");
}
fs.writeFileSync("index.html", html, "utf8");
let sw = fs.readFileSync("sw.js", "utf8");
if (!sw.includes("./tailwind.css")) {
  sw = sw.replace("\x27./index.html\x27,", "\x27./index.html\x27,\x27./tailwind.css?v=1595\x27,");
  fs.writeFileSync("sw.js", sw, "utf8");
}
'

echo "[3/3] Selesai! File tailwind.css siap diunggah bersama isi folder kredit-main."
ls -lh tailwind.css
