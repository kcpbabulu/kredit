/* DaKOPen Detail & Calendar v1560
   1) Kalender interaktif untuk pemilihan tanggal data (menggantikan <select> tanggal; select tetap menjadi sumber nilai)
   2) Detail debitur: kartu keputusan (tab, riwayat per snapshot, catatan tindak lanjut, aksi melayang, navigasi antar debitur)
   Dimuat sebelum app.js. Tidak mengubah logika bisnis; app.js memanggil window.dakDetailRender(r) bila tersedia. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nf = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
  const rp = n => 'Rp ' + nf.format(Number(n) || 0);
  const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const toast = (m, t) => { if (window.showAppNotice) window.showAppNotice(m, t || 'info'); };
  const isoToLabel = iso => { const p = String(iso).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso; };
  const isoToLong = iso => { const p = String(iso).split('-'); return p.length === 3 ? (+p[2]) + ' ' + MON3[+p[1] - 1] + ' ' + p[0] : iso; };
  const isoOf = (y, m, d) => y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');

  function copyText(text) {
    const done = () => toast('Tersalin', 'success');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    function fallback() {
      const t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Gagal menyalin', 'error'); } t.remove();
    }
  }
  window.dakCopy = copyText;


  /* ---- Mutasi kredit: rekap NoA & OS per segmen + filter segmen ---- */
  const MUT = [['new_booking', 'Pencairan', 'NEW'], ['repayment', 'Pelunasan', 'LUNAS'], ['downgrade', 'Downgrade', 'DROP'], ['upgrade', 'Upgrade', 'RISE']];
  const TABS = { new_booking: 'tab_new', repayment: 'tab_lunas', downgrade: 'tab_drop', upgrade: 'tab_rise' };
  window.dakMutasiSeg = function (res, renderList) {
    try {
      const host = $('view-mutasi'); if (!host || !res || !res.details) return;
      const old = $('bk-seg'); if (old) old.remove();
      const det = res.details, known = MUT.some(m => (det[m[0]] || []).some(x => x.seg));
      const agg = (arr, seg) => { let n = 0, o = 0; (arr || []).forEach(x => { if (!seg || x.seg === seg) { n++; o += Number(x.os) || 0; } }); return { n, o }; };
      const cell = a => a.n ? nf.format(a.n) + ' NoA<small>' + rp(a.o) + '</small>' : '<span style="color:var(--dd-mut)">–</span>';
      let rows = '';
      MUT.forEach(m => {
        const arr = det[m[0]] || [], k = agg(arr, 'Kons'), p = agg(arr, 'Prod'), t = agg(arr);
        rows += '<tr><td>' + m[1] + '</td>' + (known ? '<td>' + cell(k) + '</td><td>' + cell(p) + '</td>' : '') + '<td>' + cell(t) + '</td></tr>';
      });
      const grid = host.querySelector('.grid'); if (!grid) return;
      const sec = document.createElement('section'); sec.id = 'bk-seg'; sec.className = 'bk-seg'; sec.setAttribute('aria-label', 'Rekap mutasi per segmen');
      sec.innerHTML = '<div class="bk-seg-head"><h3>Rekap per segmen kredit</h3>' + (known ? '<div class="bk-seg-filter" role="group" aria-label="Filter segmen daftar mutasi"><button type="button" data-seg="" aria-pressed="true">Semua</button><button type="button" data-seg="Kons" aria-pressed="false">Konsumtif</button><button type="button" data-seg="Prod" aria-pressed="false">Produktif</button></div>' : '') + '</div>' +
        '<div class="bk-seg-scroll"><table><thead><tr><th>Mutasi</th>' + (known ? '<th>Konsumtif</th><th>Produktif</th>' : '') + '<th>Total</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<p class="bk-seg-note">' + (known ? 'OS adalah baki debet akhir periode (pelunasan memakai baki debet sebelum lunas). Filter di atas juga berlaku untuk daftar di bawah.' : 'Segmentasi belum tersedia: perbarui Code.gs di Apps Script agar rekap per konsumtif/produktif muncul.') + '</p>';
      grid.insertAdjacentElement('afterend', sec);
      sec.querySelectorAll('[data-seg]').forEach(b => b.addEventListener('click', () => {
        sec.querySelectorAll('[data-seg]').forEach(x => x.setAttribute('aria-pressed', x === b));
        const seg = b.dataset.seg;
        MUT.forEach(m => { const t = $(TABS[m[0]]); if (t && renderList) t.innerHTML = renderList((det[m[0]] || []).filter(x => !seg || x.seg === seg), m[2]); });
      }));
    } catch (e) { console.warn('dakMutasiSeg:', e); }
  };

  /* ---- NoA kecil di bawah angka kartu (dashboard & NPL Intelligence Center) ---- */
  window.dakNoa = function (valueId, n, label) {
    const v = $(valueId); if (!v) return;
    let t = $('noa_' + valueId);
    if (n == null || isNaN(Number(n))) { if (t) t.remove(); return; }
    if (!t) { t = document.createElement('div'); t.id = 'noa_' + valueId; t.className = 'bk-noa'; v.insertAdjacentElement('afterend', t); }
    t.textContent = (label || 'NoA') + ' ' + nf.format(Number(n));
  };

  /* =====================================================================
     1. KALENDER PEMILIH TANGGAL DATA
     ===================================================================== */
  const cal = { el: null, sel: null, btn: null, view: null, focus: null, allowEmpty: false, dates: [], set: new Set() };

  function readDates(sel) {
    const arr = Array.from(sel.options).map(o => o.value).filter(v => /^\d{4}-\d{2}-\d{2}$/.test(v)).sort();
    return arr;
  }
  function labelFor(sel, emptyText) {
    const o = sel.selectedOptions && sel.selectedOptions[0];
    if (!o || !o.value) return emptyText || 'Pilih tanggal';
    return o.textContent.trim() || isoToLabel(o.value);
  }
  function syncButton(sel) {
    const b = sel._bkBtn; if (!b) return;
    const txt = b.querySelector('.bk-calbtn-txt'), isC = sel.id === 'selComp', v0 = labelFor(sel, isC ? 'Tanpa pembanding' : 'Pilih tanggal'), v = isC && sel.value ? 'vs ' + v0 : v0;
    if (txt.textContent !== v) txt.textContent = v;
    b.setAttribute('aria-label', (sel.id === 'selComp' ? 'Tanggal pembanding: ' : 'Tanggal data: ') + v);
    b.disabled = readDates(sel).length === 0;
  }
  function attach(sel) {
    if (!sel || sel._bkBtn) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'bk-calbtn'; b.dataset.for = sel.id;
    b.setAttribute('aria-haspopup', 'dialog');
    b.innerHTML = '<i class="fas fa-calendar-days" aria-hidden="true"></i><span class="bk-calbtn-txt"></span>';
    sel.parentNode.insertBefore(b, sel); sel.classList.add('bk-cal-src'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
    sel._bkBtn = b; b.addEventListener('click', () => openCal(sel));
    sel.addEventListener('change', () => syncButton(sel));
    new MutationObserver(() => syncButton(sel)).observe(sel, { childList: true });
    syncButton(sel);
  }
  function ensureEl() {
    if (cal.el) return cal.el;
    const d = document.createElement('div'); d.id = 'bk-cal'; d.className = 'bk-cal'; d.hidden = true; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Pilih tanggal data');
    document.body.appendChild(d);
    const scrim = document.createElement('div'); scrim.id = 'bk-cal-scrim'; scrim.hidden = true; scrim.addEventListener('click', closeCal); document.body.appendChild(scrim);
    d.addEventListener('keydown', onKey);
    cal.el = d; return d;
  }
  function openCal(sel, anchor) {
    const el = ensureEl();
    cal.sel = sel; cal.btn = anchor || sel._bkBtn; cal.allowEmpty = sel.id === 'selComp';
    cal.dates = readDates(sel); cal.set = new Set(cal.dates);
    if (!cal.dates.length) return;
    const cur = sel.value && cal.set.has(sel.value) ? sel.value : cal.dates[cal.dates.length - 1];
    const p = cur.split('-'); cal.view = { y: +p[0], m: +p[1] - 1 }; cal.focus = cur;
    el.hidden = false; $('bk-cal-scrim').hidden = false; document.body.classList.add('bk-cal-open');
    render(); position(); focusDay();
    setTimeout(() => document.addEventListener('pointerdown', outside, true), 0);
  }
  function closeCal(refocus) {
    if (!cal.el || cal.el.hidden) return;
    cal.el.hidden = true; $('bk-cal-scrim').hidden = true; document.body.classList.remove('bk-cal-open');
    document.removeEventListener('pointerdown', outside, true);
    if (refocus !== false && cal.btn) cal.btn.focus({ preventScroll: true });
  }
  function outside(e) { if (cal.el && !cal.el.contains(e.target) && !(cal.btn && cal.btn.contains(e.target))) closeCal(false); }
  function position() {
    const el = cal.el; el.style.left = el.style.top = el.style.bottom = el.style.right = '';
    if (window.matchMedia('(max-width: 767px)').matches) return; // mobile: lembar bawah via CSS
    const r = cal.btn.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
    let left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8), top = r.bottom + 8;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 8);
    el.style.left = left + 'px'; el.style.top = top + 'px';
  }
  function pick(iso) {
    const sel = cal.sel; sel.value = iso; sel.dispatchEvent(new Event('change', { bubbles: true }));
    syncButton(sel); closeCal();
  }
  function render() {
    const el = cal.el, { y, m } = cal.view, first = new Date(y, m, 1), startDow = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
    const sel = cal.sel, cur = sel.value, today = new Date(), todayIso = isoOf(today.getFullYear(), today.getMonth(), today.getDate());
    const minD = cal.dates[0], maxD = cal.dates[cal.dates.length - 1];
    const prevOk = (y > +minD.slice(0, 4)) || (y === +minD.slice(0, 4) && m > +minD.slice(5, 7) - 1);
    const nextOk = (y < +maxD.slice(0, 4)) || (y === +maxD.slice(0, 4) && m < +maxD.slice(5, 7) - 1);
    let cells = '';
    for (let i = 0; i < startDow; i++) cells += '<span class="bk-cal-pad"></span>';
    for (let d = 1; d <= days; d++) {
      const iso = isoOf(y, m, d), on = cal.set.has(iso);
      cells += '<button type="button" class="bk-cal-day' + (on ? ' is-avail' : '') + (iso === cur ? ' is-sel' : '') + (iso === todayIso ? ' is-today' : '') + '" data-iso="' + iso + '" ' +
        (on ? 'tabindex="' + (iso === cal.focus ? 0 : -1) + '"' : 'disabled aria-disabled="true"') + ' aria-label="' + d + ' ' + MONTHS[m] + ' ' + y + (on ? ', ada data' : ', tidak ada data') + (iso === cur ? ', dipilih' : '') + '"' + (iso === cur ? ' aria-pressed="true"' : '') + '>' + d + '</button>';
    }
    el.innerHTML =
      '<div class="bk-cal-head"><button type="button" class="bk-cal-nav" data-nav="-1" aria-label="Bulan sebelumnya"' + (prevOk ? '' : ' disabled') + '>‹</button>' +
      '<div class="bk-cal-title" aria-live="polite">' + MONTHS[m] + ' ' + y + '</div>' +
      '<button type="button" class="bk-cal-nav" data-nav="1" aria-label="Bulan berikutnya"' + (nextOk ? '' : ' disabled') + '>›</button></div>' +
      '<div class="bk-cal-dow" aria-hidden="true"><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span></div>' +
      '<div class="bk-cal-grid" role="group" aria-label="Tanggal">' + cells + '</div>' +
      '<div class="bk-cal-foot"><span class="bk-cal-info"><i></i> ' + cal.dates.length + ' snapshot · ' + isoToLong(minD) + ' – ' + isoToLong(maxD) + '</span>' +
      '<span class="bk-cal-btns">' + (cal.allowEmpty ? '<button type="button" class="bk-cal-link" data-pick="">Tanpa pembanding</button>' : '') +
      '<button type="button" class="bk-cal-link" data-pick="' + maxD + '">Terbaru</button><button type="button" class="bk-cal-link bk-cal-close">Tutup</button></span></div>';
    el.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', () => shiftMonth(+b.dataset.nav)));
    el.querySelectorAll('.bk-cal-day.is-avail').forEach(b => b.addEventListener('click', () => pick(b.dataset.iso)));
    el.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => pick(b.dataset.pick)));
    el.querySelector('.bk-cal-close').addEventListener('click', () => closeCal());
  }
  function shiftMonth(n) {
    let { y, m } = cal.view; m += n; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    cal.view = { y, m };
    const pref = y + '-' + String(m + 1).padStart(2, '0');
    const inMonth = cal.dates.filter(d => d.indexOf(pref) === 0);
    if (inMonth.length) cal.focus = inMonth.indexOf(cal.focus) >= 0 ? cal.focus : (n > 0 ? inMonth[0] : inMonth[inMonth.length - 1]);
    render(); focusDay();
  }
  function focusDay() { const b = cal.el.querySelector('.bk-cal-day[data-iso="' + cal.focus + '"]') || cal.el.querySelector('.bk-cal-day.is-avail') || cal.el.querySelector('.bk-cal-nav:not([disabled])'); if (b) b.focus({ preventScroll: true }); }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeCal(); return; }
    if (e.key === 'PageUp' || e.key === 'PageDown') { e.preventDefault(); shiftMonth(e.key === 'PageUp' ? -1 : 1); return; }
    const t = e.target; if (!t.classList || !t.classList.contains('bk-cal-day')) return;
    const i = cal.dates.indexOf(t.dataset.iso); let n = -1;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = i - 1;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = i + 1;
    else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = cal.dates.length - 1;
    else return;
    e.preventDefault();
    if (n < 0 || n >= cal.dates.length) return;
    cal.focus = cal.dates[n]; const p = cal.focus.split('-'); cal.view = { y: +p[0], m: +p[1] - 1 };
    render(); focusDay();
  }
  window.addEventListener('resize', () => { if (cal.el && !cal.el.hidden) position(); });


  /* =====================================================================
     1b. BAR FILTER HEADER (unit · periode · pembanding) — desktop
     ===================================================================== */
  const shortUnit = t => String(t || '').replace('KANTOR CABANG PENAJAM', 'KC PPU').replace(/^KANTOR CABANG /, 'KC ').replace(/^CAPEM /, 'KCP ').replace(/\s+/g, ' ').trim();
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const FB = { bar: null, pop: null, hi: 0, stepT: 0, busyT: 0 };
  const fire = sel => sel.dispatchEvent(new Event('change', { bubbles: true }));
  function busy() { if (!FB.bar) return; FB.bar.classList.add('is-busy'); clearTimeout(FB.busyT); FB.busyT = setTimeout(() => FB.bar && FB.bar.classList.remove('is-busy'), 1100); }

  function buildBar() {
    const w = $('bk-filterwrap'), sb = $('selBranch'), sd = $('selDate'); if (!w || !sb || !sd || FB.bar) return;
    const cap = sb.closest('#bk-filterwrap > div'); if (cap) cap.classList.add('bk-cap');
    const bar = document.createElement('div'); bar.id = 'bk-fbar'; bar.className = 'bk-fbar'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Filter data');
    bar.innerHTML =
      '<div class="bk-fb-unitwrap"><button type="button" class="bk-fb-unit" aria-haspopup="listbox" aria-expanded="false"><i class="fas fa-building-columns" aria-hidden="true"></i><span class="bk-fb-unit-t">Semua Unit</span><i class="fas fa-chevron-down bk-fb-chev" aria-hidden="true"></i></button><button type="button" class="bk-fb-x" aria-label="Kembali ke Semua Unit" title="Kembali ke Semua Unit" hidden>×</button></div>' +
      '<span class="bk-fb-sep" aria-hidden="true"></span>' +
      '<div class="bk-fb-date"><button type="button" class="bk-fb-step" data-step="-1" aria-label="Periode sebelumnya" title="Periode sebelumnya (Alt+←)">‹</button>' +
      '<button type="button" class="bk-fb-datebtn" aria-haspopup="dialog"><i class="fas fa-calendar-days" aria-hidden="true"></i><span class="bk-fb-d">–</span></button>' +
      '<button type="button" class="bk-fb-step" data-step="1" aria-label="Periode berikutnya" title="Periode berikutnya (Alt+→)">›</button></div>' +
      '<button type="button" class="bk-fb-latest" hidden title="Kembali ke data terbaru">Ke terbaru</button>' +
      '<span class="bk-fb-sep" aria-hidden="true"></span>' +
      '<button type="button" class="bk-fb-comp" aria-haspopup="dialog"><span class="bk-fb-c">–</span></button>' +
      '<span class="bk-fb-bar" aria-hidden="true"></span>';
    w.insertBefore(bar, w.firstChild); FB.bar = bar;
    const q = sel => bar.querySelector(sel);
    q('.bk-fb-unit').addEventListener('click', toggleUnit);
    q('.bk-fb-x').addEventListener('click', () => setUnit('ALL'));
    q('.bk-fb-datebtn').addEventListener('click', e => openCal(sd, e.currentTarget));
    q('.bk-fb-comp').addEventListener('click', e => { const c = $('selComp'); if (c) openCal(c, e.currentTarget); });
    bar.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => step(+b.dataset.step)));
    q('.bk-fb-latest').addEventListener('click', () => { const d = readDates(sd); if (d.length) goDate(d[d.length - 1]); });
    ['selBranch', 'selDate', 'selComp'].forEach(id => { const x = $(id); if (!x) return; x.addEventListener('change', () => { syncBar(); busy(); }); new MutationObserver(syncBar).observe(x, { childList: true }); });
    document.addEventListener('keydown', e => {
      if (!e.altKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      if (/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) return;
      e.preventDefault(); step(e.key === 'ArrowLeft' ? -1 : 1);
    });
    syncBar();
  }
  function syncBar() {
    const bar = FB.bar; if (!bar) return;
    const sb = $('selBranch'), sd = $('selDate'), sc = $('selComp'); if (!sb || !sd) return;
    const o = sb.selectedOptions && sb.selectedOptions[0], full = o ? o.textContent.trim() : '';
    const isAll = !o || o.value === 'ALL' || !o.value, hasAll = Array.from(sb.options).some(x => x.value === 'ALL');
    const unit = bar.querySelector('.bk-fb-unit'), ut = bar.querySelector('.bk-fb-unit-t');
    const txt = isAll ? (full || 'Semua Unit') : shortUnit(full);
    if (ut.textContent !== txt) ut.textContent = txt; unit.title = full || 'Pilih unit';
    unit.classList.toggle('is-filtered', !isAll); unit.disabled = sb.disabled || sb.options.length <= 1;
    bar.querySelector('.bk-fb-chev').style.display = unit.disabled ? 'none' : '';
    bar.querySelector('.bk-fb-x').hidden = isAll || !hasAll || sb.disabled;
    const dates = readDates(sd), cur = sd.value, i = dates.indexOf(cur);
    const dt = bar.querySelector('.bk-fb-d'), dtxt = cur ? isoToLong(cur) : '–'; if (dt.textContent !== dtxt) dt.textContent = dtxt;
    const steps = bar.querySelectorAll('[data-step]'); steps[0].disabled = i <= 0; steps[1].disabled = i < 0 || i >= dates.length - 1;
    bar.querySelector('.bk-fb-latest').hidden = !(dates.length && i >= 0 && i < dates.length - 1);
    bar.querySelector('.bk-fb-datebtn').setAttribute('aria-label', 'Tanggal data: ' + dtxt);
    const ct = bar.querySelector('.bk-fb-c'), cb = bar.querySelector('.bk-fb-comp'), cv = sc && sc.value;
    const ctxt = cv ? 'vs ' + isoToLong(cv) : 'Tanpa pembanding'; if (ct.textContent !== ctxt) ct.textContent = ctxt; cb.classList.toggle('is-none', !cv);
    cb.setAttribute('aria-label', 'Tanggal pembanding: ' + (cv ? isoToLong(cv) : 'tidak ada'));
    cb.disabled = !sc || readDates(sc).length === 0;
  }
  function goDate(iso) { const sd = $('selDate'); if (!sd || sd.value === iso) return; sd.value = iso; syncBar(); clearTimeout(FB.stepT); FB.stepT = setTimeout(() => { fire(sd); }, 380); busy(); }
  function step(dir) {
    const sd = $('selDate'); if (!sd) return; const dates = readDates(sd), i = dates.indexOf(sd.value), n = i + dir;
    if (i < 0 || n < 0 || n >= dates.length) return; goDate(dates[n]);
  }
  /* popover unit */
  function ensurePop() {
    if (FB.pop) return FB.pop;
    const p = document.createElement('div'); p.id = 'bk-unitpop'; p.className = 'bk-unitpop'; p.hidden = true;
    p.innerHTML = '<div class="bk-up-search"><i class="fas fa-magnifying-glass" aria-hidden="true"></i><input type="search" placeholder="Cari unit…" aria-label="Cari unit" autocomplete="off"></div><div class="bk-up-recent" hidden></div><ul role="listbox" aria-label="Unit"></ul><p class="bk-up-empty" hidden>Unit tidak ditemukan</p>';
    document.body.appendChild(p); FB.pop = p;
    const inp = p.querySelector('input');
    inp.addEventListener('input', () => renderUnits(inp.value));
    p.addEventListener('keydown', e => {
      const items = Array.from(p.querySelectorAll('li:not([hidden])'));
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeUnit(true); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!items.length) return; FB.hi = (FB.hi + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; markHi(items); }
      else if (e.key === 'Enter') { e.preventDefault(); const it = items[FB.hi]; if (it) setUnit(it.dataset.v); }
    });
    p.addEventListener('click', e => { const li = e.target.closest('li[data-v]'), rc = e.target.closest('[data-rc]'); if (li) setUnit(li.dataset.v); else if (rc) setUnit(rc.dataset.rc); });
    return p;
  }
  function markHi(items) { items.forEach((li, i) => { li.classList.toggle('is-hi', i === FB.hi); li.setAttribute('aria-selected', li.classList.contains('is-cur')); if (i === FB.hi) li.scrollIntoView({ block: 'nearest' }); }); }
  function renderUnits(filter) {
    const p = FB.pop, sb = $('selBranch'), ul = p.querySelector('ul'), f = String(filter || '').toLowerCase().trim();
    const opts = Array.from(sb.options).filter(o => o.value);
    ul.innerHTML = opts.map(o => '<li role="option" data-v="' + esc(o.value) + '" class="' + (o.value === sb.value ? 'is-cur' : '') + '"' + (f && o.textContent.toLowerCase().indexOf(f) < 0 ? ' hidden' : '') + '><span>' + esc(o.value === 'ALL' ? o.textContent.trim() : o.textContent.trim()) + '</span>' + (o.value === sb.value ? '<b>✓</b>' : '') + '</li>').join('');
    const vis = ul.querySelectorAll('li:not([hidden])'); p.querySelector('.bk-up-empty').hidden = vis.length > 0;
    let rec = []; try { rec = JSON.parse(lsGet('dak_unit_recent', '[]')); } catch (e) {}
    rec = rec.filter(v => v !== sb.value && opts.some(o => o.value === v)).slice(0, 3);
    const rc = p.querySelector('.bk-up-recent'); rc.hidden = !!f || !rec.length;
    rc.innerHTML = rec.length ? '<span>Terakhir dipakai</span>' + rec.map(v => '<button type="button" data-rc="' + esc(v) + '">' + esc(v === 'ALL' ? 'Semua Unit' : shortUnit((opts.find(o => o.value === v) || {}).textContent)) + '</button>').join('') : '';
    FB.hi = Math.max(0, Array.from(vis).findIndex(li => li.classList.contains('is-cur'))); markHi(Array.from(vis));
  }
  function toggleUnit() { const p = ensurePop(); if (p.hidden) openUnit(); else closeUnit(true); }
  function openUnit() {
    const p = ensurePop(), b = FB.bar.querySelector('.bk-fb-unit'); if (b.disabled) return;
    renderUnits(''); p.querySelector('input').value = ''; p.hidden = false; b.setAttribute('aria-expanded', 'true');
    const r = b.getBoundingClientRect(), w = Math.max(280, r.width);
    p.style.minWidth = w + 'px'; p.style.left = Math.min(Math.max(8, r.left), window.innerWidth - p.offsetWidth - 8) + 'px'; p.style.top = (r.bottom + 8) + 'px';
    p.querySelector('input').focus({ preventScroll: true });
    setTimeout(() => document.addEventListener('pointerdown', outsideUnit, true), 0);
  }
  function outsideUnit(e) { if (FB.pop && !FB.pop.contains(e.target) && !FB.bar.querySelector('.bk-fb-unit').contains(e.target)) closeUnit(false); }
  function closeUnit(refocus) {
    const p = FB.pop; if (!p || p.hidden) return; p.hidden = true; document.removeEventListener('pointerdown', outsideUnit, true);
    const b = FB.bar.querySelector('.bk-fb-unit'); b.setAttribute('aria-expanded', 'false'); if (refocus) b.focus({ preventScroll: true });
  }
  function setUnit(v) {
    const sb = $('selBranch'); closeUnit(true); if (!sb) return;
    if (sb.value !== v) { sb.value = v; if (sb.value !== v) return; fire(sb); }
    lsSet('dak_unit', v);
    let rec = []; try { rec = JSON.parse(lsGet('dak_unit_recent', '[]')); } catch (e) {}
    rec = [v].concat(rec.filter(x => x !== v)).slice(0, 4); lsSet('dak_unit_recent', JSON.stringify(rec));
    syncBar(); busy();
  }

  document.addEventListener('change', e => { if (e.target && e.target.id === 'selBranch') lsSet('dak_unit', e.target.value); }, true);

  function initCalendars() { attach($('selDate')); attach($('selComp')); }

  /* =====================================================================
     2. DETAIL DEBITUR
     ===================================================================== */
  const D = { r: null, ids: null, idx: -1, tab: 'ringkasan', follow: null, tl: null, waMenu: false };
  const KOLNAME = { 1: 'Lancar', 2: 'Dalam perhatian khusus', 3: 'Kurang lancar', 4: 'Diragukan', 5: 'Macet' };
  const SARAN = {
    1: ['Lakukan courtesy call per 3 bulan.', 'Tawarkan top up bila pembayaran lancar lebih dari 1 tahun.'],
    2: ['Analisa arus kas debitur.', 'Pertimbangkan perpanjangan tenor untuk menurunkan angsuran.', 'Hubungi sebelum tunggakan bertambah.'],
    3: ['Kirim surat peringatan (SP 1 sampai SP 3) sesuai tahapan.', 'Siapkan berkas agunan bila tidak ada tanda pembayaran.'],
    4: ['Kirim surat peringatan dan jadwalkan kunjungan.', 'Siapkan berkas lelang agunan.'],
    5: ['Kirim surat peringatan terakhir dan jadwalkan kunjungan.', 'Siapkan berkas lelang agunan atau hapus buku jika tidak ada harapan.']
  };
  const parseDMY = s => { const p = String(s || '').split('/'); if (p.length !== 3) return null; const d = new Date(+p[2], +p[1] - 1, +p[0]); return isNaN(d) ? null : d; };
  const phoneIntl = hp => { let d = String(hp || '').replace(/\D/g, ''); if (d.length < 8) return ''; if (d[0] === '0') d = '62' + d.slice(1); else if (d.slice(0, 2) !== '62') d = '62' + d; return d; };

  function histChip(r) {
    if (!(r.worst_kol && r.worst_kol > r.kol)) return '';
    return '<div class="bk-d-chip bk-d-chip--warn" role="note"><b>Pernah Kol ' + esc(r.worst_kol) + '</b><span>' + esc(r.worst_date && r.worst_date !== '-' ? r.worst_date : 'tanggal tidak tersedia') + '</span></div>';
  }
  function progress(r) {
    let out = '';
    const pl = Number(r.plafond) || 0, os = Number(r.os) || 0;
    if (pl > 0) {
      const paid = Math.max(0, Math.min(100, (pl - os) / pl * 100));
      out += '<div class="bk-d-prog"><div class="bk-d-prog-l"><span>Pokok terbayar</span><b>' + paid.toFixed(0) + '%</b></div><div class="bk-bar bk-bar--lg" role="img" aria-label="Pokok terbayar ' + paid.toFixed(0) + ' persen"><i style="width:' + paid.toFixed(1) + '%"></i></div></div>';
    }
    const a = parseDMY(r.mulai), b = parseDMY(r.selesai);
    if (a && b && b > a) {
      const now = Date.now(), total = b - a, el = Math.max(0, Math.min(1, (now - a) / total)), tm = Math.round(total / 2629800000), em = Math.round(el * tm);
      out += '<div class="bk-d-prog"><div class="bk-d-prog-l"><span>Tenor berjalan</span><b>bulan ke-' + em + ' dari ' + tm + '</b></div><div class="bk-bar bk-bar--lg bk-bar--muted" role="img" aria-label="Tenor berjalan ' + em + ' dari ' + tm + ' bulan"><i style="width:' + (el * 100).toFixed(1) + '%"></i></div></div>';
    }
    return out;
  }
  const copyRow = (label, val) => {
    const v = val == null || val === '' || val === '-' ? '' : String(val);
    return '<div class="bk-d-row"><span>' + esc(label) + '</span>' + (v ? '<button type="button" class="bk-copy" data-copy="' + esc(v) + '" title="Ketuk untuk menyalin">' + esc(v) + '</button>' : '<em>-</em>') + '</div>';
  };
  const plainRow = (label, html) => '<div class="bk-d-row"><span>' + esc(label) + '</span><div>' + html + '</div></div>';

  function tabRingkasan(r, tenorM) {
    return copyRow('ID debitur', r.nasabah) + copyRow('No PK', r.pk) + copyRow('No rekening', r.rek) +
      plainRow('Jangka waktu', esc(r.mulai) + ' – ' + esc(r.selesai) + (tenorM ? ' <small>(' + tenorM + ' bln)</small>' : '')) +
      plainRow('Suku bunga', esc(r.bunga) + (r.bunga && r.bunga !== '-' ? '%' : '')) +
      plainRow('Sektor', esc(r.sektor || 'Umum')) + copyRow('No arsip', r.noArsip) +
      '<div class="bk-d-addr"><i class="fas fa-location-dot" aria-hidden="true"></i><span>' + esc(r.alamat) + '</span><button type="button" class="bk-btn-ghost" data-act="map">Buka peta</button></div>';
  }
  function tabTunggakan(r) {
    const pk = Number(r.tgk_pokok) || 0, bg = Number(r.tgk_bunga) || 0, tot = pk + bg;
    const pp = tot > 0 ? pk / tot * 100 : 0;
    let h = '<div class="bk-d-tgk"><div class="bk-d-tgk-top"><span>Total tunggakan</span><b>' + rp(r.total_tgk) + '</b></div>';
    if (tot > 0) h += '<div class="bk-stack" role="img" aria-label="Pokok ' + pp.toFixed(0) + ' persen, bunga ' + (100 - pp).toFixed(0) + ' persen"><i class="a" style="width:' + pp.toFixed(1) + '%"></i><i class="b" style="width:' + (100 - pp).toFixed(1) + '%"></i></div>' +
      '<div class="bk-stack-leg"><span><i class="a"></i>Pokok ' + rp(pk) + '</span><span><i class="b"></i>Bunga ' + rp(bg) + '</span></div>';
    else h += '<p class="bk-d-ok">Tidak ada tunggakan pada snapshot ini.</p>';
    h += '</div>' + plainRow('Tgl bayar / jatuh tempo', esc(r.tgl_bayar && r.tgl_bayar !== '-' ? r.tgl_bayar : '-'));
    const kol = Math.min(5, Math.max(1, Number(r.kol) || 1));
    h += '<div class="bk-d-saran"><h4>Saran penanganan <small>(Kol ' + kol + ' · ' + KOLNAME[kol] + ')</small></h4><ul>' + SARAN[kol].map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div>';
    return h;
  }
  function tabRiwayat() { return '<div id="bk-d-tl" class="bk-d-tl"><div class="bk-d-skel"></div><div class="bk-d-skel bk-d-skel--s"></div></div>'; }
  function tabTindakan(r) {
    const chips = ['Tidak diangkat', 'Janji bayar', 'Bayar sebagian', 'Nomor tidak aktif', 'Debitur minta waktu'];
    return '<form id="bk-fu-form" class="bk-fu-form" novalidate>' +
      '<label>Jenis tindakan<select id="bk-fu-aksi"><option>Telepon</option><option>WhatsApp</option><option>Kunjungan</option><option>Surat</option><option>Lainnya</option></select></label>' +
      '<div class="bk-fu-chips" aria-label="Isi cepat">' + chips.map(c => '<button type="button" class="bk-chip" data-fill="' + esc(c) + '">' + esc(c) + '</button>').join('') + '</div>' +
      '<label>Hasil kontak<textarea id="bk-fu-note" rows="3" maxlength="600" placeholder="Tulis hasil kontak singkat…"></textarea></label>' +
      '<label>Janji bayar <small>(opsional)</small><input id="bk-fu-date" type="date"></label>' +
      '<div class="bk-fu-msg" id="bk-fu-msg" role="status"></div>' +
      '<button type="submit" class="bk-fu-save">Simpan catatan</button></form>' +
      '<h4 class="bk-fu-h">Riwayat tindak lanjut</h4><div id="bk-fu-list" class="bk-fu-list"><div class="bk-d-skel bk-d-skel--s"></div></div>';
  }

  window.dakDetailRender = function (r) {
    try {
      const host = $('detailContent'); if (!host || !r) return false;
      const kol = Math.min(5, Math.max(1, Number(r.kol) || 1));
      D.r = r; D.follow = null; D.tl = null; D.tab = 'ringkasan'; D.waMenu = false;
      const id = String(r.loan);
      if (D.ids) { const i = D.ids.indexOf(id); if (i < 0) { D.ids = null; D.idx = -1; } else D.idx = i; }
      const a = parseDMY(r.mulai), b = parseDMY(r.selesai); const tenorM = a && b && b > a ? Math.round((b - a) / 2629800000) : 0;
      const hasHp = !!phoneIntl(r.hp);
      const nav = D.ids && D.ids.length > 1 ?
        '<div class="bk-d-nav" role="group" aria-label="Debitur lain di daftar"><button type="button" data-act="prev" aria-label="Debitur sebelumnya"' + (D.idx <= 0 ? ' disabled' : '') + '>‹</button><span>' + (D.idx + 1) + ' / ' + D.ids.length + '</span><button type="button" data-act="next" aria-label="Debitur berikutnya"' + (D.idx >= D.ids.length - 1 ? ' disabled' : '') + '>›</button></div>' : '';
      host.innerHTML =
        '<div class="bk-d" data-kol="' + kol + '" data-loan="' + esc(id) + '">' +
        '<header class="bk-d-head bk-d-k' + kol + '"><span class="bk-d-strip" aria-hidden="true"></span><div class="bk-d-id"><h3>' + esc(r.nama) + '</h3>' +
        '<div class="bk-d-meta"><button type="button" class="bk-copy" data-copy="' + esc(id) + '" title="Salin ID pinjaman">' + esc(id) + '</button><span>' + esc(r.type) + '</span><span>' + esc(r.gol) + '</span></div></div>' +
        '<span class="bk-kol bk-kol-' + kol + ' bk-kol--lg">Kol ' + kol + '</span></header>' +
        '<div id="bk-d-flags">' + histChip(r) + '</div>' +
        '<div class="bk-d-kpis"><div><span>Baki debet</span><b>' + rp(r.os) + '</b></div><div class="is-tgk"><span>Tunggakan</span><b>' + rp(r.total_tgk) + '</b></div><div><span>Plafond</span><b>' + rp(r.plafond) + '</b></div></div>' +
        progress(r) +
        '<div class="bk-d-tabs" role="tablist" aria-label="Bagian detail">' +
        [['ringkasan', 'Ringkasan'], ['tunggakan', 'Tunggakan'], ['riwayat', 'Riwayat'], ['tindakan', 'Tindakan']].map(t => '<button type="button" role="tab" id="bk-t-' + t[0] + '" data-tab="' + t[0] + '" aria-controls="bk-p-' + t[0] + '" aria-selected="' + (t[0] === 'ringkasan') + '" tabindex="' + (t[0] === 'ringkasan' ? 0 : -1) + '">' + t[1] + (t[0] === 'tindakan' ? '<span id="bk-fu-count"></span>' : '') + '</button>').join('') + '</div>' +
        '<section id="bk-p-ringkasan" class="bk-d-panel" role="tabpanel" aria-labelledby="bk-t-ringkasan">' + tabRingkasan(r, tenorM) + '</section>' +
        '<section id="bk-p-tunggakan" class="bk-d-panel" role="tabpanel" aria-labelledby="bk-t-tunggakan" hidden>' + tabTunggakan(r) + '</section>' +
        '<section id="bk-p-riwayat" class="bk-d-panel" role="tabpanel" aria-labelledby="bk-t-riwayat" hidden>' + tabRiwayat() + '</section>' +
        '<section id="bk-p-tindakan" class="bk-d-panel" role="tabpanel" aria-labelledby="bk-t-tindakan" hidden>' + tabTindakan(r) + '</section>' +
        '<div class="bk-d-bar">' + nav +
        '<div class="bk-d-acts"><div class="bk-split"><button type="button" class="bk-act bk-act--wa" data-act="wa">' + (hasHp ? 'Tagih via WA' : 'Salin pesan tagih') + '</button><button type="button" class="bk-act bk-act--wa bk-act--caret" data-act="wamenu" aria-haspopup="menu" aria-expanded="false" aria-label="Pilih templat pesan">▾</button></div>' +
        (hasHp ? '<a class="bk-act" href="tel:+' + phoneIntl(r.hp) + '" data-act="tel">Telepon</a>' : '') +
        '<button type="button" class="bk-act" data-act="share">Salin ringkasan</button></div>' +
        '<div class="bk-d-menu" id="bk-wa-menu" role="menu" hidden><button role="menuitem" type="button" data-tpl="kol">Sesuai Kol (standar)</button><button role="menuitem" type="button" data-tpl="remind">Pengingat singkat</button><button role="menuitem" type="button" data-tpl="promise">Konfirmasi janji bayar</button></div></div>' +
        '</div>';
      wire(host);
      setHash(id);
      loadFollow(id);
      host.scrollTop = 0;
      return true;
    } catch (e) { console.warn('dakDetailRender:', e); return false; }
  };

  function wire(host) {
    const root = host.querySelector('.bk-d');
    root.addEventListener('click', onClick);
    const tabs = root.querySelector('.bk-d-tabs');
    tabs.addEventListener('keydown', e => {
      const list = Array.from(tabs.querySelectorAll('[role=tab]')), i = list.indexOf(document.activeElement);
      if (i < 0) return; let n = -1;
      if (e.key === 'ArrowRight') n = (i + 1) % list.length; else if (e.key === 'ArrowLeft') n = (i - 1 + list.length) % list.length; else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = list.length - 1; else return;
      e.preventDefault(); list[n].focus(); setTab(list[n].dataset.tab);
    });
    const form = $('bk-fu-form'); if (form) form.addEventListener('submit', onSaveFollow);
    // geser pada kepala debitur untuk pindah debitur (HP)
    const head = root.querySelector('.bk-d-head'); let x0 = 0, y0 = 0;
    head.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    head.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) go(dx < 0 ? 1 : -1);
    });
  }
  function setTab(name) {
    D.tab = name;
    document.querySelectorAll('.bk-d-tabs [role=tab]').forEach(b => { const on = b.dataset.tab === name; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    document.querySelectorAll('.bk-d-panel').forEach(p => { p.hidden = p.id !== 'bk-p-' + name; });
    if (name === 'riwayat') loadTimeline();
  }
  function go(delta) {
    if (!D.ids) return; const n = D.idx + delta; if (n < 0 || n >= D.ids.length) return;
    if (window.app && app.fetchDetail) app.fetchDetail(D.ids[n]);
  }
  function onClick(e) {
    const t = e.target.closest('[data-tab],[data-act],[data-copy],[data-fill],[data-tpl]'); if (!t) return;
    const r = D.r; if (!r) return;
    if (t.dataset.tab) { setTab(t.dataset.tab); return; }
    if (t.dataset.copy) { copyText(t.dataset.copy); return; }
    if (t.dataset.fill) { const n = $('bk-fu-note'); if (n) { n.value = (n.value ? n.value.replace(/\s*$/, '') + '. ' : '') + t.dataset.fill; n.focus(); } return; }
    if (t.dataset.tpl) { waTemplate(t.dataset.tpl); toggleMenu(false); return; }
    switch (t.dataset.act) {
      case 'prev': go(-1); break;
      case 'next': go(1); break;
      case 'wa': waTemplate('kol'); break;
      case 'wamenu': toggleMenu(); break;
      case 'map': window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(r.alamat || ''), '_blank', 'noopener'); break;
      case 'share': copyText(r.nama + ' · ' + r.loan + ' · Kol ' + r.kol + ' · Baki debet ' + rp(r.os) + ' · Tunggakan ' + rp(r.total_tgk)); break;
      case 'tel': break;
    }
  }
  function toggleMenu(force) {
    const m = $('bk-wa-menu'), b = document.querySelector('[data-act=wamenu]'); if (!m) return;
    const open = force === undefined ? m.hidden : force; m.hidden = !open; if (b) b.setAttribute('aria-expanded', open);
    if (open) { const f = m.querySelector('button'); if (f) f.focus(); }
  }
  function waTemplate(kind) {
    const r = D.r; if (!r) return;
    if (kind === 'kol') { // pesan standar yang sudah ada di aplikasi
      if (window.app && app.sendWA) { (function(){const a=parseDMY(r.mulai),b=parseDMY(r.selesai);const t=a&&b&&b>a?Math.round((b-a)/2629800000):0;app.sendWA(r.hp, r.nama, r.total_tgk, r.kol, r.loan, r.tgl_bayar, r.pk, r.mulai, t, r.plafond, r.rek);})(); return; }
    }
    const nama = String(r.nama || 'Nasabah').replace(/\s+/g, ' ').trim();
    const msg = kind === 'promise' ?
      'Selamat siang,\nKepada Yth Sdr/i *' + nama + '*,\n\nKami mengonfirmasi janji pembayaran Sdr/i atas kredit nomor ' + (r.pk || '-') + ' sebesar *' + rp(r.total_tgk) + '*. Mohon konfirmasi apakah pembayaran dapat dilakukan sesuai tanggal yang disepakati.\n\nTerima kasih.\nBankaltimtara' :
      'Selamat siang,\nKepada Yth Sdr/i *' + nama + '*,\n\nKami mengingatkan bahwa kredit Sdr/i (PK ' + (r.pk || '-') + ') memiliki tunggakan *' + rp(r.total_tgk) + '*. Mohon pembayaran dapat segera dilakukan. Jika sudah membayar, abaikan pesan ini.\n\nTerima kasih.\nBankaltimtara';
    const num = phoneIntl(r.hp);
    if (!num) { copyText(msg); return; }
    window.open('https://wa.me/' + num + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  }

  /* ---- Riwayat per snapshot ---- */
  function loadTimeline() {
    const id = D.r && String(D.r.loan); if (!id || D.tl) return; const box = $('bk-d-tl'); if (!box) return;
    D.tl = 'loading';
    google.script.run.withSuccessHandler(res => { if (!D.r || String(D.r.loan) !== id) return; D.tl = res || { points: [] }; drawTimeline(); })
      .withFailureHandler(err => { if (!D.r || String(D.r.loan) !== id) return; D.tl = null; const b = $('bk-d-tl'); if (b) b.innerHTML = '<p class="bk-d-err">Riwayat belum dapat dimuat. ' + esc(err && err.message || '') + ' <button type="button" class="bk-btn-ghost" id="bk-tl-retry">Coba lagi</button></p>'; const rt = $('bk-tl-retry'); if (rt) rt.addEventListener('click', () => { const b2 = $('bk-d-tl'); if (b2) b2.innerHTML = '<div class="bk-d-skel"></div>'; loadTimeline(); }); })
      .getDebtorTimeline(id);
  }
  function drawTimeline() {
    const box = $('bk-d-tl'); if (!box) return;
    const pts = (D.tl && D.tl.points) || [];
    const have = pts.filter(p => p.kol != null);
    if (!have.length) { box.innerHTML = '<p class="bk-d-empty">Belum ada riwayat snapshot untuk debitur ini.</p>'; return; }
    const W = 320, H = 96, padL = 8, padR = 8, padT = 10, padB = 10;
    const vals = have.map(p => p.os), mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), span = mx - mn || 1;
    const X = i => padL + (pts.length === 1 ? (W - padL - padR) / 2 : i * (W - padL - padR) / (pts.length - 1));
    const Y = v => padT + (1 - (v - mn) / span) * (H - padT - padB);
    let path = '', dots = '', started = false;
    pts.forEach((p, i) => {
      if (p.os == null) { started = false; return; }
      path += (started ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.os).toFixed(1) + ' '; started = true;
      dots += '<g class="bk-tl-pt" data-i="' + i + '" tabindex="0" role="img" aria-label="' + esc(isoToLong(p.d)) + ', Kol ' + p.kol + ', baki debet ' + esc(rp(p.os)) + '"><circle class="hit" cx="' + X(i).toFixed(1) + '" cy="' + Y(p.os).toFixed(1) + '" r="13"/><circle class="dot bk-k' + p.kol + '" cx="' + X(i).toFixed(1) + '" cy="' + Y(p.os).toFixed(1) + '" r="4.5"/></g>';
    });
    const chips = pts.map((p, i) => '<button type="button" class="bk-tl-chip' + (p.kol == null ? ' is-none' : ' bk-kol-' + p.kol) + '" data-i="' + i + '" aria-label="' + esc(isoToLong(p.d)) + (p.kol == null ? ', tidak ada di snapshot' : ', Kol ' + p.kol) + '"><b>' + (p.kol == null ? '–' : p.kol) + '</b><small>' + esc(p.d.slice(8, 10) + '/' + p.d.slice(5, 7)) + '</small></button>').join('');
    // ringkasan tren
    const first = have[0], last = have[have.length - 1]; let change = null;
    for (let i = have.length - 1; i > 0; i--) if (have[i].kol !== have[i - 1].kol) { change = have[i]; break; }
    let trend = 'Kol stabil di ' + last.kol + ' pada ' + have.length + ' snapshot terakhir.';
    if (change) trend = 'Kol ' + (last.kol > have[have.indexOf(change) - 1].kol ? 'memburuk' : 'membaik') + ' dari ' + have[have.indexOf(change) - 1].kol + ' ke ' + last.kol + ' sejak ' + isoToLong(change.d) + '.';
    const dOs = last.os - first.os;
    box.innerHTML = '<p class="bk-tl-trend">' + esc(trend) + '</p>' +
      '<div class="bk-tl-chips" role="group" aria-label="Kolektibilitas per snapshot">' + chips + '</div>' +
      '<svg class="bk-tl-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" aria-label="Grafik baki debet per snapshot"><path class="bk-tl-line" d="' + path + '"/>' + dots + '</svg>' +
      '<div class="bk-tl-read" id="bk-tl-read" role="status"></div>' +
      '<p class="bk-tl-note">Baki debet ' + (dOs === 0 ? 'tidak berubah' : (dOs < 0 ? 'turun ' : 'naik ') + rp(Math.abs(dOs))) + ' sejak ' + isoToLong(first.d) + '. Ketuk titik atau kotak untuk melihat rinciannya.</p>';
    const read = i => {
      const p = pts[i], el = $('bk-tl-read'); if (!el) return;
      el.innerHTML = p.kol == null ? '<b>' + esc(isoToLong(p.d)) + '</b> · tidak ada di snapshot ini' : '<b>' + esc(isoToLong(p.d)) + '</b> · <span class="bk-kol bk-kol-' + p.kol + '">Kol ' + p.kol + '</span> · Baki ' + rp(p.os) + ' · Tunggakan ' + rp(p.tgk);
      box.querySelectorAll('.bk-tl-chip').forEach(c => c.classList.toggle('is-on', +c.dataset.i === i));
      box.querySelectorAll('.bk-tl-pt').forEach(c => c.classList.toggle('is-on', +c.dataset.i === i));
    };
    box.querySelectorAll('[data-i]').forEach(n => { const i = +n.dataset.i; n.addEventListener('pointerenter', () => read(i)); n.addEventListener('focus', () => read(i)); n.addEventListener('click', () => read(i)); });
    read(pts.length - 1);
  }

  /* ---- Catatan tindak lanjut ---- */
  function loadFollow(id) {
    google.script.run.withSuccessHandler(res => {
      if (!D.r || String(D.r.loan) !== id) return; D.follow = res || { list: [] }; drawFollow();
    }).withFailureHandler(err => {
      if (!D.r || String(D.r.loan) !== id) return; const l = $('bk-fu-list'); if (l) l.innerHTML = '<p class="bk-d-err">Riwayat tindak lanjut belum dapat dimuat. ' + esc(err && err.message || '') + '</p>';
    }).getFollowUps(id);
  }
  function drawFollow() {
    const f = D.follow || { list: [] }, list = f.list || [];
    const cnt = $('bk-fu-count'); if (cnt) cnt.textContent = list.length ? ' (' + list.length + ')' : '';
    const flags = $('bk-d-flags'); if (flags) {
      const old = flags.querySelector('.bk-d-chip--today'); if (old) old.remove();
      if (f.today) flags.insertAdjacentHTML('beforeend', '<div class="bk-d-chip bk-d-chip--today" role="note"><b>Sudah dihubungi hari ini</b><span>' + esc(f.today.petugas) + ' · ' + esc(f.today.aksi) + ' · ' + esc((f.today.ts || '').slice(11)) + '</span></div>');
    }
    const box = $('bk-fu-list'); if (!box) return;
    box.innerHTML = list.length ? list.map(x => '<article class="bk-fu-item"><header><b>' + esc(x.aksi || 'Tindakan') + '</b><span>' + esc(x.ts) + ' · ' + esc(x.petugas) + '</span></header><p>' + esc(x.catatan) + '</p>' + (x.tglKomitmen && x.tglKomitmen !== '-' ? '<small>Janji bayar: ' + esc(isoToLong(x.tglKomitmen)) + (x.status ? ' · ' + esc(x.status) : '') + '</small>' : '') + '</article>').join('') : '<p class="bk-d-empty">Belum ada catatan. Catat hasil kontak agar rekan tidak menghubungi debitur yang sama.</p>';
  }
  function onSaveFollow(e) {
    e.preventDefault(); const r = D.r; if (!r) return;
    const note = $('bk-fu-note').value.trim(), msg = $('bk-fu-msg'), btn = e.target.querySelector('.bk-fu-save');
    if (note.length < 3) { msg.textContent = 'Isi hasil kontak terlebih dahulu.'; msg.className = 'bk-fu-msg is-err'; $('bk-fu-note').focus(); return; }
    btn.disabled = true; btn.textContent = 'Menyimpan…'; msg.textContent = ''; const id = String(r.loan);
    google.script.run.withSuccessHandler(() => {
      btn.disabled = false; btn.textContent = 'Simpan catatan'; $('bk-fu-note').value = ''; $('bk-fu-date').value = '';
      msg.textContent = 'Catatan tersimpan.'; msg.className = 'bk-fu-msg is-ok'; toast('Catatan tindak lanjut tersimpan', 'success'); loadFollow(id);
    }).withFailureHandler(err => {
      btn.disabled = false; btn.textContent = 'Simpan catatan'; msg.textContent = (err && err.message) || 'Gagal menyimpan. Coba lagi.'; msg.className = 'bk-fu-msg is-err';
    }).saveFollowUp({ loanId: id, nama: r.nama, kol: r.kol, aksi: $('bk-fu-aksi').value, catatan: note, tglKomitmen: $('bk-fu-date').value });
  }

  /* ---- Daftar konteks untuk navigasi, tautan langsung, optimistic header ---- */
  const FD = /fetchDetail\('([^']+)'\)/;
  function captureList(el) {
    const m = FD.exec(el.getAttribute('onclick') || el.getAttribute('onkeydown') || ''); if (!m) return;
    const scope = el.closest('tbody,.bk-clist,.bk-tablewrap,[id$="List"],[id$="list"]') || el.closest('.tab-view') || document;
    const ids = []; scope.querySelectorAll('[onclick*="fetchDetail("],[onkeydown*="fetchDetail("]').forEach(n => {
      if (n.closest('[hidden]') || n.offsetParent === null) return;
      const mm = FD.exec(n.getAttribute('onclick') || n.getAttribute('onkeydown') || ''); if (mm && ids.indexOf(mm[1]) < 0) ids.push(mm[1]);
    });
    D.ids = ids.indexOf(m[1]) >= 0 && ids.length > 1 ? ids : null; D.idx = D.ids ? D.ids.indexOf(m[1]) : -1;
    const row = el.closest('tr,.bk-crow'); const nm = row && row.querySelector('.bk-name,.bk-crow-name,.click-detail > div:first-child');
    D.pending = nm ? nm.textContent.trim() : '';
    setTimeout(() => { const c = $('detailContent'), sk = c && c.querySelector('.animate-pulse'); if (sk && D.pending) sk.insertAdjacentHTML('afterbegin', '<div class="bk-d-opt"><b>' + esc(D.pending) + '</b></div>'); }, 0);
  }
  document.addEventListener('click', e => { const el = e.target.closest && e.target.closest('[onclick*="fetchDetail("]'); if (el) captureList(el); }, true);
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') { const el = e.target.closest && e.target.closest('[onkeydown*="fetchDetail("]'); if (el) captureList(el); }
    const modal = $('modalDetail'); if (!modal || modal.classList.contains('hidden') || !D.r) return;
    if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !document.activeElement.closest('[role=tablist]')) { e.preventDefault(); go(e.key === 'ArrowRight' ? 1 : -1); }
    if (e.key === 'Escape') { const m = $('bk-wa-menu'); if (m && !m.hidden) { e.stopPropagation(); toggleMenu(false); } }
  }, true);
  document.addEventListener('click', e => { const m = $('bk-wa-menu'); if (m && !m.hidden && !e.target.closest('.bk-d-bar')) toggleMenu(false); });

  function curDate() { const s = $('selDate'); return s ? s.value : ''; }
  function setHash(id) { try { history.replaceState(null, '', '#debitur=' + encodeURIComponent(id) + (curDate() ? '&tgl=' + curDate() : '')); } catch (e) {} }
  function clearHash() { try { if (/^#debitur=/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }
  function watchClose() {
    const m = $('modalDetail'); if (!m) return;
    new MutationObserver(() => { if (m.classList.contains('hidden')) { clearHash(); D.r = null; } }).observe(m, { attributes: true, attributeFilter: ['class'] });
  }
  window.dakDetailLink = function () { if (!D.r) return; const u = location.href.split('#')[0] + '#debitur=' + encodeURIComponent(D.r.loan) + (curDate() ? '&tgl=' + curDate() : ''); copyText(u); };
  function openFromHash() {
    const m = /^#debitur=([^&]+)(?:&tgl=(\d{4}-\d{2}-\d{2}))?/.exec(location.hash); if (!m) return;
    const id = decodeURIComponent(m[1]), tgl = m[2]; let tries = 0;
    const iv = setInterval(() => {
      tries++; const a = window.app, sel = $('selDate');
      if (a && a.fetchDetail && a.state && a.state.filter && a.state.filter.d && sel && sel.options.length) {
        clearInterval(iv);
        if (tgl && a.state.filter.d !== tgl && Array.from(sel.options).some(o => o.value === tgl)) { sel.value = tgl; a.state.filter.d = tgl; sel.dispatchEvent(new Event('change', { bubbles: true })); }
        a.fetchDetail(id);
      } else if (tries > 80) clearInterval(iv);
    }, 500);
  }

  /* tombol "Salin tautan" di header modal */
  function addLinkButton() {
    const m = $('modalDetail'); if (!m || m.querySelector('.bk-d-linkbtn')) return;
    const head = m.querySelector('h3'); if (!head || !head.parentElement) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'bk-d-linkbtn'; b.setAttribute('aria-label', 'Salin tautan debitur ini'); b.title = 'Salin tautan debitur ini';
    b.innerHTML = '<i class="fas fa-link" aria-hidden="true"></i>'; b.addEventListener('click', window.dakDetailLink);
    head.parentElement.insertBefore(b, head.parentElement.querySelector('button:last-of-type'));
  }

  function init() {
    initCalendars(); buildBar(); watchClose(); addLinkButton(); openFromHash();
    // select tanggal dibuat/diisi ulang oleh app.js; pastikan tombol selalu sinkron
    setInterval(() => { initCalendars(); buildBar(); syncBar(); const a = $('selDate'), c = $('selComp'); if (a) syncButton(a); if (c) syncButton(c); }, 900);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
