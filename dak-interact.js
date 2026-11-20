/* DaKOPen Interact Layer v1530
   Dimuat SEBELUM app.js. Tidak mengubah logika bisnis; hanya menambah:
   1) cache respons backend (memori, per sesi)  2) tabel interaktif (urut, kartu di HP)
   3) shortcut keyboard  4) aksesibilitas (live region, fokus, Esc, toast)            */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     1. CACHE RESPONS BACKEND — hanya di memori tab (tidak ditulis ke disk,
        karena berisi data debitur). Hilang saat tab ditutup / logout.
        0–2 mnt: langsung dari cache. 2–15 mnt: tampil dari cache, lalu
        diperbarui di latar belakang. Aksi tulis/login/upload: cache dikosongkan.
     --------------------------------------------------------------------- */
  const READ = new Set(['getAvailableSnapshots','getBranchList','getDashboardData','getKURChartData',
    'getKonsumtifData','get4SData','getAllNPLData','getWatchlistData','getCollectionCandidates',
    'getTopObligors','getCKPNEstimate','getRiskMatrixData','getVintageData','getTrendAnalysis',
    'getMapData','getWriteOffData','getMovementExtended','getMaturityDashboard','getFreshDropData',
    'getFullReportData','getReportData','getDebtorDetailFull','searchCreditGlobal',
    'getCreditPortfolioAnalytics','getArchiveList']);
  const FRESH = 120000, STALE = 900000, MAX_ENTRIES = 40, MAX_CHARS = 3000000;
  const store = new Map(), inflight = new Map();
  const rawFetch = window.fetch.bind(window);

  const makeResponse = txt => new Response(txt, { status: 200, headers: { 'Content-Type': 'application/json' } });
  const clearCache = () => { store.clear(); };
  function put(key, txt) {
    store.delete(key); store.set(key, { t: Date.now(), body: txt });
    while (store.size > MAX_ENTRIES) store.delete(store.keys().next().value);
  }
  function fetchAndStore(key, input, init) {
    let p = inflight.get(key);
    if (!p) {
      p = rawFetch(input, init)
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(txt => {
          try { const j = JSON.parse(txt); if (j && j.status === 'success' && txt.length < MAX_CHARS) put(key, txt); } catch (e) {}
          return txt;
        })
        .finally(() => inflight.delete(key));
      inflight.set(key, p);
    }
    return p.then(makeResponse);
  }
  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (!init || init.method !== 'POST' || url.indexOf('script.google.com/macros/s/') < 0 || typeof init.body !== 'string') return rawFetch(input, init);
    let req; try { req = JSON.parse(init.body); } catch (e) { return rawFetch(input, init); }
    if (!req || typeof req.action !== 'string') return rawFetch(input, init);
    if (!READ.has(req.action)) { if (req.action !== 'authMe') clearCache(); return rawFetch(input, init); }
    const key = req.action + '|' + (req.token || '') + '|' + JSON.stringify(req.args || []);
    const hit = store.get(key), age = hit ? Date.now() - hit.t : Infinity;
    if (hit && age < FRESH) return Promise.resolve(makeResponse(hit.body));
    if (hit && age < STALE) {
      if (!inflight.has(key)) {
        const ac = new AbortController(); setTimeout(() => ac.abort(), 60000);
        window.dakPill && window.dakPill('Data tersimpan · memperbarui…');
        fetchAndStore(key, input, Object.assign({}, init, { signal: ac.signal })).then(() => window.dakPill && window.dakPill(''), () => window.dakPill && window.dakPill('Offline · menampilkan data tersimpan', 4000));
      }
      return Promise.resolve(makeResponse(hit.body));
    }
    const p = fetchAndStore(key, input, init);
    return hit ? p.catch(() => { window.dakPill && window.dakPill('Offline · menampilkan data tersimpan', 4000); return makeResponse(hit.body); }) : p;
  };
  window.dakCache = { clear: clearCache, size: () => store.size };
  window.dakForceRefresh = function () {
    clearCache();
    if (window.app && typeof app.refresh === 'function') app.refresh(); else location.reload();
  };

  /* ---------------------------------------------------------------------
     2. TABEL INTERAKTIF — urut kolom, angka rata kanan, mode kartu di HP.
        Otomatis untuk semua <table> di area kerja, termasuk yang dirender ulang.
     --------------------------------------------------------------------- */
  const norm = t => String(t == null ? '' : t).replace(/\s+/g, ' ').trim();
  function parseNum(s) {
    let t = norm(s).replace(/[▲▼↑↓+]/g, '').replace(/Rp\.?/gi, '').replace(/\s/g, '');
    t = t.replace(/(hari|%)$/i, '');
    if (!/^-?\d[\d.,]*$/.test(t)) return null;
    const neg = t[0] === '-'; t = t.replace('-', '');
    const d = t.lastIndexOf('.'), c = t.lastIndexOf(',');
    if (d >= 0 && c >= 0) t = c > d ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
    else if (d >= 0) { const p = t.split('.'); if (p.length > 2 || p[p.length - 1].length === 3) t = p.join(''); }
    else if (c >= 0) { const p = t.split(','); t = (p.length > 2 || p[p.length - 1].length === 3) ? p.join('') : p.join('.'); }
    const n = Number(t); return isFinite(n) ? (neg ? -n : n) : null;
  }
  function toKey(raw) {
    const m = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
    if (m) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; return new Date(y, +m[2] - 1, +m[1]).getTime(); }
    return parseNum(raw);
  }
  // Kolom dianggap angka jika bernilai angka DAN bukan nomor identitas (mis. Loan ID 8 digit)
  function looksNumeric(raw) {
    if (parseNum(raw) == null) return false;
    return /[.,%]/.test(raw) || norm(raw).replace(/\D/g, '').length <= 6;
  }
  const bodyRows = table => table.tBodies[0] ? Array.from(table.tBodies[0].rows) : [];
  const headCells = table => table.tHead && table.tHead.rows.length ? Array.from(table.tHead.rows[table.tHead.rows.length - 1].cells) : [];
  const rowsAligned = (table, n) => { const r = bodyRows(table); return r.length > 1 && r.every(x => x.cells.length === n && Array.from(x.cells).every(c => c.colSpan === 1)); };

  function sortTable(table, idx, dir) {
    const tb = table.tBodies[0]; if (!tb) return;
    const items = bodyRows(table).map((r, i) => {
      const c = r.cells[idx], raw = c ? (c.dataset.sort || norm(c.textContent)) : '';
      return { r, i, raw, num: toKey(raw) };
    });
    const numeric = items.every(k => k.num != null || k.raw === '' || k.raw === '-');
    items.sort((a, b) => {
      if (numeric) {
        const x = a.num == null ? -Infinity : a.num, y = b.num == null ? -Infinity : b.num;
        if (x !== y) return (x < y ? -1 : 1) * dir;
      } else {
        const r = a.raw.localeCompare(b.raw, 'id', { numeric: true, sensitivity: 'base' });
        if (r) return r * dir;
      }
      return a.i - b.i;
    });
    const frag = document.createDocumentFragment(); items.forEach(k => frag.appendChild(k.r)); tb.appendChild(frag);
  }
  function setSortState(table, idx, dir) {
    headCells(table).forEach((th, i) => { if (th.hasAttribute('data-bk-sort')) th.setAttribute('aria-sort', i === idx ? (dir === 1 ? 'ascending' : 'descending') : 'none'); });
  }
  function doSort(table, idx) {
    const ths = headCells(table); if (!rowsAligned(table, ths.length)) return;
    const cur = ths[idx].getAttribute('aria-sort'), dir = cur === 'ascending' ? -1 : 1;
    sortTable(table, idx, dir); setSortState(table, idx, dir);
    const live = document.getElementById('bk-live');
    if (live) live.textContent = 'Diurutkan menurut ' + norm(ths[idx].textContent) + (dir === 1 ? ', naik' : ', turun');
  }
  function initTable(table) {
    const ths = headCells(table); if (!ths.length) return;
    table.dataset.bkInit = '1'; table.classList.add('bk-table');
    const labs = ths.map(th => norm(th.textContent));
    const isList = labs.some(l => /^(identitas|nama|debitur|nama debitur|nasabah)/i.test(l));
    if (ths.length >= 5) table.classList.add(isList ? 'bk-cards' : 'bk-scroll'); // daftar debitur → kartu; tabel analitik tetap tabel (geser samping)
    if (isList && labs.indexOf('Identitas') >= 0 && labs.indexOf('Baki Debet') >= 0) {
      table.classList.add('bk-compact');
      table.addEventListener('click', e => {
        const tr = e.target.closest && e.target.closest('tbody tr');
        if (!tr || e.target.closest('a,button,input,select,.click-detail')) return;
        tr.classList.toggle('is-open');
      });
    }
    const sortable = [];
    ths.forEach((th, i) => {
      if (th.querySelector('input,button,select') || !norm(th.textContent) || th.classList.contains('no-sort') || th.colSpan > 1) return;
      th.setAttribute('data-bk-sort', ''); th.setAttribute('aria-sort', 'none'); th.tabIndex = 0; sortable.push(i);
      th.addEventListener('click', () => doSort(table, i));
      th.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doSort(table, i); } });
    });
    if (sortable.length && table.classList.contains('bk-cards')) { // pengurut ringkas untuk mode kartu di HP
      const wrap = document.createElement('label'); wrap.className = 'bk-sortbar';
      const sel = document.createElement('select'); sel.setAttribute('aria-label', 'Urutkan data');
      sel.innerHTML = '<option value="">Urutkan data…</option>' + sortable.map(i => {
        const t = norm(ths[i].textContent);
        return '<option value="' + i + '|1">' + t + ' (naik)</option><option value="' + i + '|-1">' + t + ' (turun)</option>';
      }).join('');
      sel.addEventListener('change', () => {
        if (!sel.value) return; const p = sel.value.split('|'), idx = +p[0], dir = +p[1];
        if (!rowsAligned(table, ths.length)) return; sortTable(table, idx, dir); setSortState(table, idx, dir);
      });
      wrap.appendChild(sel);
      const host = table.closest('.overflow-x-auto') || table; host.parentNode.insertBefore(wrap, host);
    }
  }
  function decorate(table) {
    const ths = headCells(table), n = ths.length, rows = bodyRows(table); if (!n || !rows.length) return;
    const sig = rows.length + '|' + (rows[0] && rows[0].cells.length);
    if (table.dataset.bkSig === sig) return; table.dataset.bkSig = sig;
    const labels = ths.map(th => norm(th.textContent));
    rows.forEach(r => { if (r.cells.length === n) Array.from(r.cells).forEach((c, i) => { if (!c.hasAttribute('data-label')) c.setAttribute('data-label', labels[i]); }); });
    if (table.classList.contains('bk-compact')) rows.forEach(r => {
      if (r.cells.length !== n) return;
      ['Baki Debet', 'Tgk', 'Plafond'].forEach(L => {
        const i = labels.indexOf(L); if (i < 0) return;
        const m = /Rp\s*([\d.,]+)/.exec(r.cells[i].textContent); if (!m) return;
        const v = parseNum(m[1]); if (v != null && window.dakRpShort) r.cells[i].setAttribute('data-short', window.dakRpShort(v));
      });
    });
    if (rows.length > 1 && rows.every(r => r.cells.length === n)) {
      for (let i = 0; i < n; i++) {
        const vals = rows.slice(0, 30).map(r => norm(r.cells[i].textContent)).filter(v => v && v !== '-');
        const isNum = vals.length > 1 && vals.every(looksNumeric);
        ths[i].classList.toggle('bk-num', isNum); rows.forEach(r => r.cells[i].classList.toggle('bk-num', isNum));
      }
    }
  }
  let scanTimer = null;
  function scan() {
    document.querySelectorAll('.tab-view table, #modalDetail table, #detailContent table').forEach(t => {
      if (t.classList.contains('bk-no-enhance')) return;
      if (!t.dataset.bkInit) initTable(t); if (t.dataset.bkInit) decorate(t);
    });
  }
  const schedule = () => { clearTimeout(scanTimer); scanTimer = setTimeout(scan, 160); };

  /* ---------------------------------------------------------------------
     3 & 4. SHORTCUT, AKSESIBILITAS, TOAST
     --------------------------------------------------------------------- */
  const GOTO = { d:['view-dash','Dashboard'], n:['view-nplall','NPL Total'], k:['view-kredit','Data Kredit'],
    m:['view-mutasi','Mutasi Kredit'], c:['view-collection','Penagihan'], w:['view-watchlist','Watchlist'],
    t:['view-maturity','Jatuh Tempo'], j:['view-journey','Linimasa Debitur'], r:['view-report','Laporan'] };
  const navAllowed = id => { const b = document.querySelector('#sidebar .nav-btn[onclick*="' + id + '"]'); return !b || !b.classList.contains('hidden'); };
  const typing = el => el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);
  const paletteOpen = () => { const p = document.getElementById('dak-command-palette'); return p && !p.hidden; };
  let gPending = false, gTimer = null, helpEl = null, helpReturn = null;

  function toggleHelp(show) {
    if (!helpEl) {
      helpEl = document.createElement('div'); helpEl.className = 'bk-help'; helpEl.hidden = true;
      helpEl.setAttribute('role', 'dialog'); helpEl.setAttribute('aria-modal', 'true'); helpEl.setAttribute('aria-labelledby', 'bk-help-title');
      helpEl.innerHTML = '<div class="bk-help-card"><div class="bk-help-head"><h2 id="bk-help-title">Pintasan keyboard</h2><button type="button" aria-label="Tutup" data-bk-close>✕</button></div>' +
        '<dl><dt><kbd>Ctrl</kbd> <kbd>K</kbd> atau <kbd>/</kbd></dt><dd>Cari menu atau debitur</dd>' +
        Object.keys(GOTO).map(k => '<dt><kbd>g</kbd> lalu <kbd>' + k + '</kbd></dt><dd>' + GOTO[k][1] + '</dd>').join('') +
        '<dt><kbd>Esc</kbd></dt><dd>Tutup jendela yang terbuka</dd><dt><kbd>?</kbd></dt><dd>Tampilkan panduan ini</dd></dl></div>';
      helpEl.addEventListener('click', e => { if (e.target === helpEl || e.target.closest('[data-bk-close]')) toggleHelp(false); });
      document.body.appendChild(helpEl);
    }
    if (show) { helpReturn = document.activeElement; helpEl.hidden = false; helpEl.querySelector('[data-bk-close]').focus(); }
    else { helpEl.hidden = true; if (helpReturn && helpReturn.focus) helpReturn.focus(); }
  }

  function closeTopDialog() {
    if (helpEl && !helpEl.hidden) { toggleHelp(false); return true; }
    const open = Array.from(document.querySelectorAll('[role="dialog"],[aria-modal="true"]')).filter(el =>
      el.id !== 'dak-command-palette' && !el.hidden && !el.classList.contains('hidden') && el.offsetParent !== null);
    if (!open.length) return false;
    open.sort((a, b) => (parseInt(getComputedStyle(b).zIndex) || 0) - (parseInt(getComputedStyle(a).zIndex) || 0));
    const top = open[0];
    const btn = top.querySelector('[aria-label*="Tutup" i],[aria-label*="close" i],[onclick*="close" i],[onclick*="classList.add(\'hidden\')"]');
    if (btn) { btn.click(); return true; }
    return false;
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (!paletteOpen() && closeTopDialog()) e.preventDefault(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target) || paletteOpen()) return;
    if (e.key === '/') { e.preventDefault(); if (window.dakOpenCommandPalette) dakOpenCommandPalette(); return; }
    if (e.key === '?') { e.preventDefault(); toggleHelp(true); return; }
    if (gPending) {
      gPending = false; clearTimeout(gTimer);
      const t = GOTO[e.key.toLowerCase()];
      if (t && navAllowed(t[0]) && window.app && app.switchTab) { e.preventDefault(); app.switchTab(t[0]); }
      return;
    }
    if (e.key === 'g') { gPending = true; gTimer = setTimeout(() => { gPending = false; }, 1200); }
  });

  document.addEventListener('DOMContentLoaded', () => {
    // live region untuk pembaca layar
    if (!document.getElementById('bk-live')) {
      const live = document.createElement('div'); live.id = 'bk-live'; live.className = 'bk-sr'; live.setAttribute('aria-live', 'polite'); document.body.appendChild(live);
    }
    // saat pindah menu: tandai menu aktif, umumkan, pindahkan fokus ke judul halaman
    if (window.app && typeof app.switchTab === 'function') {
      const orig = app.switchTab;
      app.switchTab = function (id) {
        const r = orig.apply(this, arguments);
        try {
          document.querySelectorAll('#sidebar .nav-btn[aria-current]').forEach(b => b.removeAttribute('aria-current'));
          document.querySelectorAll('#sidebar .nav-btn[onclick*="' + id + '"]').forEach(b => b.setAttribute('aria-current', 'page'));
          const view = document.getElementById(id), h = view && view.querySelector('h1,h2');
          if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
          const live = document.getElementById('bk-live'); if (live && h) live.textContent = 'Membuka ' + norm(h.textContent);
        } catch (e) {}
        return r;
      };
    }
    // toast: bisa ditutup dengan klik, galat diumumkan sebagai alert, maksimal 4 sekaligus
    const origNotice = window.showAppNotice;
    if (typeof origNotice === 'function') {
      window.showAppNotice = function (message, type) {
        origNotice.apply(this, arguments);
        const host = document.getElementById('dakopen-notice-host'); if (!host) return;
        const item = host.lastElementChild;
        if (item) { item.setAttribute('role', type === 'error' ? 'alert' : 'status'); item.title = 'Klik untuk menutup'; item.addEventListener('click', () => item.remove()); }
        while (host.children.length > 4) host.firstElementChild.remove();
      };
      // alert() bawaan memblokir layar; ganti dengan toast
      window.alert = function (msg) {
        const m = String(msg == null ? '' : msg);
        window.showAppNotice(m, /gagal|error|tidak (dapat|ditemukan|valid)|kosong/i.test(m) ? 'error' : 'info');
      };
    }
    scan();
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  });
})();

/* ==========================================================================
   v1540 — Polish: waktu setempat, fokus keyboard vs mouse, strip kolektibilitas,
   filter Penagihan, istilah Telegram Center dalam bahasa Indonesia.
   ========================================================================== */
(function () {
  'use strict';
  const fmt = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  window.dakFmtTime = function (v) {
    if (!v) return '-';
    const d = new Date(v); if (isNaN(d)) return String(v);
    return fmt.format(d).replace(/\./g, ':').replace(',', '');
  };

  // Cincin fokus hanya untuk keyboard
  document.addEventListener('pointerdown', () => document.body && document.body.classList.add('using-mouse'), true);
  document.addEventListener('keydown', e => { if (e.key === 'Tab' && document.body) document.body.classList.remove('using-mouse'); }, true);

  // Filter tahap penagihan (client-side)
  window.dakCollFilter = function (b) {
    const w = document.getElementById('collection_list_wrapper'); if (!w) return;
    w.querySelectorAll('.bk-crow').forEach(r => { r.hidden = (b !== 'ALL' && r.dataset.bucket !== b); });
    document.querySelectorAll('.bk-filter').forEach(x => x.classList.toggle('is-on', x.dataset.bucket === b));
  };

  // Strip kolektibilitas dari res.all_list (tanpa perubahan backend)
  const KOL = ['1', '2', '3', '4', '5'];
  const rupiahShort = n => {
    const a = Math.abs(n);
    if (a >= 1e12) return 'Rp ' + (n / 1e12).toFixed(2).replace('.', ',') + ' T';
    if (a >= 1e9) return 'Rp ' + (n / 1e9).toFixed(2).replace('.', ',') + ' M';
    if (a >= 1e6) return 'Rp ' + (n / 1e6).toFixed(1).replace('.', ',') + ' jt';
    return 'Rp ' + Math.round(n).toLocaleString('id-ID');
  };
  const TARGET = { 1: 'view-kredit', 2: 'view-watchlist', 3: 'view-nplall', 4: 'view-nplall', 5: 'view-nplall' };
  window.dakKolStrip = function (res) {
    const box = document.getElementById('bk-kolstrip'); if (!box) return;
    const rows = (res && res.all_list) || [];
    if (!rows.length) { box.hidden = true; return; }
    const sum = {}, cnt = {}; KOL.forEach(k => { sum[k] = 0; cnt[k] = 0; });
    let total = 0;
    rows.forEach(r => { const k = String(Math.round(Number(r.kol))); if (!(k in sum)) return; const o = Number(r.os) || 0; sum[k] += o; cnt[k]++; total += o; });
    if (total <= 0) { box.hidden = true; return; }
    const bar = document.getElementById('bk-kolbar'), leg = document.getElementById('bk-kollegend');
    bar.innerHTML = KOL.map(k => {
      const p = sum[k] / total * 100;
      return `<button type="button" class="bk-kolseg" style="--c:var(--kol-${k});flex-grow:${Math.max(p, 0.6)}" data-k="${k}" aria-label="Kol ${k}: ${p.toFixed(1)} persen dari baki debet, ${cnt[k]} debitur"></button>`;
    }).join('');
    leg.innerHTML = KOL.map(k => {
      const p = sum[k] / total * 100;
      return `<li><button type="button" data-k="${k}"><span class="k"><i style="--c:var(--kol-${k})"></i>Kol ${k}</span><span class="v">${p.toFixed(p < 10 ? 2 : 1).replace('.', ',')}%</span><span class="s">${rupiahShort(sum[k])} · ${cnt[k].toLocaleString('id-ID')} debitur</span></button></li>`;
    }).join('');
    box.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => {
      if (window.app && app.switchTab) app.switchTab(TARGET[b.dataset.k]);
    }));
    const np = (sum['3'] + sum['4'] + sum['5']) / total * 100;
    document.getElementById('bk-kolstrip-note').textContent = 'Klik segmen untuk membuka daftar terkait · NPL (Kol 3–5) ' + np.toFixed(2).replace('.', ',') + '%';
    box.hidden = false;
  };

  // Telegram Center: waktu setempat + istilah Indonesia (hanya di dalam komponen dak-tg)
  const ISO = /\b(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)\b/g;
  const TERMS = [
    [/Pending updates/g, 'Update tertunda'],
    [/Cleanup Failure Inspector/g, 'Rincian kegagalan penghapusan'],
    [/Failure Inspector/g, 'rincian kegagalan'],
    [/Bad Request: message to delete not found/g, 'Pesan yang akan dihapus sudah tidak ditemukan'],
    [/Read timeout expired/g, 'Waktu tunggu habis']
  ];
  let tgTimer = null;
  function localizeTg() {
    document.querySelectorAll('[class*="dak-tg"], [id^="dak-tg"]').forEach(root => {
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n; while ((n = w.nextNode())) {
        let t = n.nodeValue, o = t;
        t = t.replace(ISO, (_, iso) => window.dakFmtTime(iso));
        TERMS.forEach(([re, to]) => { t = t.replace(re, to); });
        if (t !== o) n.nodeValue = t;
      }
    });
  }
  new MutationObserver(() => { clearTimeout(tgTimer); tgTimer = setTimeout(localizeTg, 120); })
    .observe(document.documentElement, { childList: true, subtree: true });
})();

/* ==========================================================================
   v1550 — Mobile: header ringkas + auto-hide, lembar filter, dock, geser untuk
   menutup detail, tarik untuk menyegarkan, penanda data tersimpan.
   ========================================================================== */
(function () {
  'use strict';
  const mq = window.matchMedia('(max-width: 767px)');
  const $ = id => document.getElementById(id);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.dakRpShort = function (n) {
    const a = Math.abs(n), f = (v, d) => v.toFixed(d).replace('.', ',');
    if (a >= 1e12) return 'Rp ' + f(n / 1e12, 2) + ' T';
    if (a >= 1e9) return 'Rp ' + f(n / 1e9, 2) + ' M';
    if (a >= 1e6) return 'Rp ' + f(n / 1e6, 1) + ' jt';
    return 'Rp ' + Math.round(n).toLocaleString('id-ID');
  };

  /* ---- Penanda status data (tersimpan / offline) ---- */
  let pillT = null;
  window.dakPill = function (text, ms) {
    let p = $('bk-pill');
    if (!text) { if (p) p.classList.remove('is-on'); return; }
    if (!p) { p = document.createElement('div'); p.id = 'bk-pill'; p.setAttribute('role', 'status'); document.body.appendChild(p); }
    p.textContent = text; p.classList.add('is-on');
    clearTimeout(pillT); if (ms) pillT = setTimeout(() => p.classList.remove('is-on'), ms);
  };

  /* ---- Lembar filter (unit & tanggal) ---- */
  function filterSummary() {
    const b = $('selBranch'), d = $('selDate'), el = $('bk-filtersum'); if (!el) return;
    const bt = b && b.selectedOptions[0] ? b.selectedOptions[0].textContent.trim() : '';
    const dt = d && d.selectedOptions[0] ? d.selectedOptions[0].textContent.trim() : '';
    el.textContent = (bt || 'Semua Unit') + (dt ? ' · ' + dt : '');
    const fb = $('bk-filterbtn'); if (fb) fb.classList.toggle('is-filtered', !!(b && b.selectedIndex > 0));
  }
  function buildSheet() {
    const w = $('bk-filterwrap'); if (!w || w.dataset.bkSheet) return;
    w.dataset.bkSheet = '1'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', 'Filter data');
    const head = document.createElement('div'); head.className = 'bk-sheet-head';
    head.innerHTML = '<span class="bk-grab" aria-hidden="true"></span><strong>Filter data</strong><button type="button" class="bk-sheet-done">Selesai</button>';
    w.insertBefore(head, w.firstChild);
    head.querySelector('.bk-sheet-done').addEventListener('click', closeFilter);
    const labels = { selBranch: 'Unit', selDate: 'Tanggal data', selComp: 'Bandingkan dengan' };
    Object.keys(labels).forEach(id => { const s = $(id); if (!s) return; const l = document.createElement('span'); l.className = 'bk-fl'; l.textContent = labels[id]; s.parentNode.insertBefore(l, s); });
    const scrim = document.createElement('div'); scrim.id = 'bk-scrim'; scrim.addEventListener('click', closeFilter); document.body.appendChild(scrim);
    ['selBranch', 'selDate', 'selComp'].forEach(id => { const s = $(id); if (s) { s.addEventListener('change', filterSummary); new MutationObserver(filterSummary).observe(s, { childList: true }); } });
    filterSummary();
  }
  function openFilter() {
    buildSheet(); const w = $('bk-filterwrap');
    // pindahkan ke <body>: header punya stacking context sendiri sehingga lembar akan tertutup scrim
    if (w && !w._home) { w._home = document.createComment('bk-filter-home'); w.parentNode.insertBefore(w._home, w); document.body.appendChild(w); }
    document.body.classList.add('bk-filter-open'); const s = $('selBranch'); if (s) setTimeout(() => s.focus({ preventScroll: true }), 50); }
  function closeFilter() {
    document.body.classList.remove('bk-filter-open'); const w = $('bk-filterwrap');
    if (w && w._home && w._home.parentNode) { w._home.parentNode.insertBefore(w, w._home); w._home.remove(); w._home = null; }
    const b = $('bk-filterbtn'); if (b) b.focus({ preventScroll: true });
  }
  window.bkOpenFilter = openFilter;
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('bk-filter-open')) closeFilter(); });

  /* ---- Header menyembunyi saat menggulir ke bawah ---- */
  function setupAutoHide() {
    const sc = $('bk-scroll'), hd = $('bk-hdr'); if (!sc || !hd) return;
    let last = 0, lock = 0;
    sc.addEventListener('scroll', () => {
      if (!mq.matches || document.body.classList.contains('bk-filter-open')) { document.body.classList.remove('bk-hdr-hide'); return; }
      const now = Date.now(); if (now < lock) { last = sc.scrollTop; return; }
      const y = sc.scrollTop, dy = y - last;
      if (Math.abs(dy) < 10) return;
      const hide = dy > 0 && y > 90;
      if (hide !== document.body.classList.contains('bk-hdr-hide')) {
        hd.style.setProperty('--bk-hdr-h', hd.offsetHeight + 'px');
        document.body.classList.toggle('bk-hdr-hide', hide); lock = now + 320;
      }
      last = y;
    }, { passive: true });
  }

  /* ---- Dock: tandai halaman aktif, sembunyikan menu tanpa izin ---- */
  function syncDock() {
    const act = document.querySelector('.tab-view:not(.hidden)');
    document.querySelectorAll('.dak-dock-item[data-dock^="view-"]').forEach(b => {
      const id = b.dataset.dock, side = document.querySelector('#sidebar .nav-btn[onclick*="' + id + '"]');
      b.hidden = !!(side && side.classList.contains('hidden'));
      const on = !!act && act.id === id; b.classList.toggle('is-active', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    const dock = document.querySelector('.dak-mobile-dock');
    if (dock) dock.style.setProperty('--n', dock.querySelectorAll('.dak-dock-item:not([hidden])').length);
  }

  /* ---- Detail debitur: geser ke bawah untuk menutup (HP) ---- */
  function setupSheetSwipe() {
    const modal = $('modalDetail'); if (!modal) return;
    const box = modal.firstElementChild; if (!box || box.dataset.bkSwipe) return; box.dataset.bkSwipe = '1';
    const grab = document.createElement('span'); grab.className = 'bk-grab bk-grab-detail'; grab.setAttribute('aria-hidden', 'true'); box.insertBefore(grab, box.firstChild);
    const zone = box.children[1]; // header judul
    let y0 = 0, t0 = 0, dy = 0, drag = false;
    const start = e => { if (!mq.matches) return; drag = true; y0 = e.touches[0].clientY; t0 = Date.now(); dy = 0; box.style.transition = 'none'; };
    const move = e => { if (!drag) return; dy = Math.max(0, e.touches[0].clientY - y0); box.style.transform = 'translateY(' + dy + 'px)'; };
    const end = () => {
      if (!drag) return; drag = false; box.style.transition = '';
      const v = dy / Math.max(1, Date.now() - t0);
      if (dy > 110 || v > 0.5) { if (window.app && app.closeModal) app.closeModal('modalDetail'); }
      box.style.transform = '';
    };
    [grab, zone].forEach(z => { if (!z) return; z.addEventListener('touchstart', start, { passive: true }); z.addEventListener('touchmove', move, { passive: true }); z.addEventListener('touchend', end); z.addEventListener('touchcancel', end); });
  }

  /* ---- Tarik untuk menyegarkan ---- */
  function setupPull() {
    const sc = $('bk-scroll'); if (!sc) return;
    const ind = document.createElement('div'); ind.id = 'bk-ptr'; ind.setAttribute('aria-hidden', 'true'); ind.innerHTML = '<i class="fas fa-rotate"></i>'; document.body.appendChild(ind);
    let y0 = 0, pull = 0, on = false;
    sc.addEventListener('touchstart', e => { if (!mq.matches || sc.scrollTop > 0 || e.touches.length !== 1) { on = false; return; } on = true; y0 = e.touches[0].clientY; pull = 0; }, { passive: true });
    sc.addEventListener('touchmove', e => {
      if (!on) return; pull = Math.max(0, (e.touches[0].clientY - y0) * 0.5);
      if (sc.scrollTop > 0) { on = false; ind.style.transform = ''; return; }
      ind.style.transform = 'translate(-50%,' + Math.min(pull, 70) + 'px)'; ind.style.opacity = Math.min(1, pull / 60); ind.classList.toggle('is-ready', pull > 60);
    }, { passive: true });
    sc.addEventListener('touchend', () => {
      if (!on) return; on = false;
      const go = pull > 60; ind.style.transform = ''; ind.style.opacity = 0; ind.classList.remove('is-ready');
      if (go) { window.dakPill('Memperbarui data…', 2500); window.dakForceRefresh && window.dakForceRefresh(); }
    });
  }

  function init() {
    buildSheet(); setupAutoHide(); setupSheetSwipe(); setupPull();
    const fb = $('bk-filterbtn'); if (fb) fb.addEventListener('click', openFilter);
    syncDock(); setInterval(syncDock, 800);
    setTimeout(filterSummary, 1500); setInterval(filterSummary, 4000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
