@echo off
REM DaKOPen v1595 — Kompilasi Tailwind CSS statis & hapus CDN Tailwind otomatis (Windows)
cd /d "%~dp0.."

echo [1/3] Mengompilasi tailwind.css statis...
call npx --yes tailwindcss@3.4.17 -c tailwind.config.js -i tools/tailwind-input.css -o tailwind.css --minify
if errorlevel 1 exit /b 1

echo [2/3] Menghapus CDN Tailwind dari index.html ^& menautkan tailwind.css...
node -e "const fs=require('fs');let h=fs.readFileSync('index.html','utf8');h=h.replace(/<script\s+src="https:\/\/cdn\.tailwindcss\.com\/3\.4\.17"><\/script>\s*/g,'');if(!h.includes('tailwind.css'))h=h.replace('<link href="style.css','<link href="tailwind.css?v=1595" rel="stylesheet">\n<link href="style.css');fs.writeFileSync('index.html',h,'utf8');let sw=fs.readFileSync('sw.js','utf8');if(!sw.includes('./tailwind.css')){sw=sw.replace("'./index.html',","'./index.html','./tailwind.css?v=1595',");fs.writeFileSync('sw.js',sw,'utf8');}"

echo [3/3] Selesai! Unggah seluruh isi folder kredit-main termasuk tailwind.css.
pause
