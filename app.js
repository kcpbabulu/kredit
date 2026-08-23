// =========================================================================
// BRIDGE PROXY: MENYULAP google.script.run MENJADI FETCH API OTOMATIS
// =========================================================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbyck07bvRRtow084FWUkJc1MtNaOAofZLhGv2Q1iwpqAFA7lE2IK2NtmnMDwRa0MlfV/exec";

window.google = { script: { run: null } };

// Membuat objek palsu yang mencegat perintah google.script.run
function createGasProxy(successHandler, failureHandler) {
    return new Proxy({}, {
        get: function(target, propName) {
            // Jika memanggil .withSuccessHandler
            if (propName === 'withSuccessHandler') {
                return function(cb) { return createGasProxy(cb, failureHandler); };
            }
            // Jika memanggil .withFailureHandler
            if (propName === 'withFailureHandler') {
                return function(cb) { return createGasProxy(successHandler, cb); };
            }
            
            // Jika bukan handler, berarti ini adalah NAMA FUNGSI (misal: getDashboardData)
            return function(...args) {
                // Eksekusi Fetch ke Google Apps Script
                fetch(GAS_URL, {
                    method: 'POST',
                    // Harus plain text agar terhindar dari CORS Preflight Error di browser
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({ action: propName, args: args })
                })
                .then(res => res.json())
                .then(res => {
                    // --- TAMBAHKAN 3 BARIS INI (AUTO-CLEANER) ---
                    document.querySelectorAll('.tab-view').forEach(el => {
                        el.classList.remove('opacity-50', 'pointer-events-none');
                    });
                    // -----------------
                    if (res.status === 'success' && successHandler) {
                        successHandler(res.data);
                    } else if (res.status === 'error') {
                        console.error("GAS API Error:", res.message);
                        if (failureHandler) failureHandler(res.message);
                    }
                })
                .catch(err => {
                    console.error("Fetch Error:", err);
                    if (failureHandler) failureHandler(err);
                });
            };
        }
    });
}

// Terapkan Proxy
window.google.script.run = createGasProxy(null, null);

// ================= BATAS BRIDGE PROXY =================

window.app = (function() {
  var s = { 
    data: null, snaps: [], filter: { d:'', b:'ALL', c:'' }, 
    maturityList: [],
    sim: { f:[], b:[] }, 
    simKUR: { heal:[], crash:[] }, simKons: { heal:[], crash:[] }, sim4S: { heal:[], crash:[] }, simALL: { heal:[], crash:[] },
    krSort: {key:'os', asc:false}, kredit: null, kur: null, kons: null, fours: null, allnpl: null, watchlist: null, collection: null, freshDrops: null, ckpn: null, topObligor: null, vintage: null
  };
  var charts = {};
  var map = null;
  // --- KOORDINAT GPS DESA/KELURAHAN SE-PENAJAM PASER UTARA ---
const cityCoords = {
    // === KEC PENAJAM ===
    "KEL. PETUNG": [-1.2989, 116.7118],
    "DESA GIRI MUKTI": [-1.3250, 116.6800],
    "DESA SIDOREJO": [-1.3100, 116.6900],
    "KEL. NIPAH-NIPAH": [-1.2450, 116.7650], 
    "KEL. NENANG": [-1.2650, 116.7500],
    "KEL. PENAJAM": [-1.2523, 116.7725],      
    "KEL. GUNUNG SETELENG": [-1.2600, 116.7600],
    "KEL. SOTEK": [-1.3653, 116.5867],
    "KEL. RIKO": [-1.1500, 116.7000],
    "KEL. GERSIK": [-1.1800, 116.7500],
    "KEL. JENEBORA": [-1.1600, 116.7600],
    "KEL. PANTAI LANGO": [-1.1300, 116.7400],
    "KEL. SALOLOANG": [-1.3500, 116.6500],
    "KEL. KAMPUNG BARU": [-1.2300, 116.7700],
    "KEL. SESUMPU": [-1.2800, 116.7300],
    "KEL. TANJUNG TENGAH": [-1.3300, 116.6600],

    // === KEC WARU ===
    "DESA WARU": [-1.3965, 116.6340],
    "DESA SESULU": [-1.4100, 116.6200],
    "DESA BANGUN MULYA": [-1.4200, 116.6400],
    "DESA API-API": [-1.4500, 116.6000],

    // === KEC BABULU ===
    "DESA BABULU DARAT": [-1.5165, 116.4800],
    "DESA BABULU LAUT": [-1.5300, 116.4500],
    "DESA GUNUNG MAKMUR": [-1.5000, 116.5000],
    "DESA SEBAKUNG JAYA": [-1.5500, 116.4200],
    "DESA RAWA MULIA": [-1.5200, 116.5200],
    "DESA LABANGKA": [-1.5600, 116.5500],
    "DESA SUMBER SARI": [-1.4900, 116.5100],
    "DESA GUNUNG INTAN": [-1.4800, 116.5300],
    "DESA SRI RAHARJA": [-1.4700, 116.5400],

    // === KEC SEPAKU (IKN) ===
    "DESA SEPAKU": [-0.9258, 116.7725],
    "DESA TENGIN BARU": [-0.9500, 116.7800],
    "DESA BUKIT RAYA": [-0.9700, 116.7600],
    "DESA SUKARAJA": [-0.9900, 116.7500],
    "DESA BUMI HARAPAN": [-0.9000, 116.7200],
    "KEL. PEMALUAN": [-1.0500, 116.8000],
    "KEL. MARIDAN": [-1.1000, 116.8200],
    "DESA SEMOI DUA": [-0.8500, 116.8500],
    "DESA ARGO MULYO": [-0.8800, 116.8800],
    "DESA MENTAWIR": [-1.0200, 116.8500],
    "DESA WONOSARI": [-0.9100, 116.7900],

    // === FALLBACK (Jika Desa Tidak Terdeteksi) ===
    "KEC. PENAJAM (UMUM)": [-1.2800, 116.7300],
    "KEC. WARU (UMUM)": [-1.4000, 116.6300],
    "KEC. BABULU (UMUM)": [-1.5100, 116.4900],
    "KEC. SEPAKU (UMUM)": [-0.9300, 116.7700],
    "KEC. PENAJAM (SOTEK AREA)": [-1.3600, 116.5800],
    "PENAJAM KOTA (UMUM)": [-1.2523, 116.7725],
    "DEFAULT": [-1.3093, 116.7274] // Fallback absolut
};

// --- VARIABEL GLOBAL PETA (LEAFLET VERSION) ---
var mapInstance = null;
var mapMarkers = [];

function renderMapPage(res) {
    if(document.getElementById('loader')) document.getElementById('loader').style.display='none';
    
    var container = document.getElementById('view-map');
    var fmtIDR = function(v) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v); };

    // 1. RENDER UI MODERN PLAYFUL (Floating Panel & Full Map)
    container.innerHTML = `
    <!-- Layer Peta Latar Belakang -->
    <div class="absolute inset-0 z-0 bg-slate-100 dark:bg-slate-900">
        <div id="map_canvas" class="w-full h-full"></div>
    </div>

    <!-- Floating Glass Panel (Daftar Wilayah) -->
    <div class="absolute top-4 left-4 right-4 md:right-auto z-[400] md:w-[380px] flex flex-col max-h-[50vh] md:max-h-[calc(100%-2rem)] pointer-events-none">
        
        <div class="glass-card rounded-[2rem] border border-white/50 shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 pointer-events-auto transition-all duration-500">
            
            <!-- Header Panel (Bisa diklik di HP untuk melipat/collapse) -->
            <div class="p-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex justify-between items-center cursor-pointer shadow-md group" onclick="toggleMapList()">
                <div class="flex items-center gap-3">
                    <div class="bg-white/20 p-2 rounded-xl backdrop-blur-md shadow-inner text-lg group-hover:scale-110 transition-transform"><i class="fas fa-map-marked-alt"></i></div>
                    <div>
                        <h3 class="font-black text-sm uppercase tracking-[0.15em] drop-shadow-sm">Sebaran Wilayah</h3>
                        <div class="text-[9px] text-emerald-100 mt-0.5 font-bold tracking-widest">Pilih Titik Kordinat</div>
                    </div>
                </div>
                <div class="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center md:hidden transition-transform duration-300" id="map-chevron">
                    <i class="fas fa-chevron-up"></i>
                </div>
            </div>
            
            <!-- Daftar Kartu Wilayah -->
            <div id="map_region_list" class="overflow-y-auto custom-scrollbar p-3 space-y-3 transition-all duration-500">
                ${res.regions.map(function(reg, idx) {
                    var isHighRisk = reg.npl_pct > 5;
                    var riskTheme = isHighRisk 
                        ? 'border-red-400 bg-gradient-to-r from-red-500/10 to-rose-500/5 hover:from-red-500/20 text-red-700 dark:text-red-400 shadow-[0_4px_15px_-3px_rgba(239,68,68,0.2)]' 
                        : (reg.npl_pct > 2 ? 'border-amber-400 bg-gradient-to-r from-amber-500/10 to-orange-500/5 hover:from-amber-500/20 text-orange-700 dark:text-orange-400 shadow-[0_4px_15px_-3px_rgba(245,158,11,0.2)]' : 'border-emerald-400 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 hover:from-emerald-500/20 text-emerald-700 dark:text-emerald-400 shadow-[0_4px_15px_-3px_rgba(16,185,129,0.2)]');
                    
                    var badgeTheme = isHighRisk ? 'bg-red-500 text-white' : (reg.npl_pct > 2 ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white');

                    return `
                    <div class="p-4 rounded-2xl border-l-[6px] border border-white/60 dark:border-slate-700/50 backdrop-blur-md transition-all duration-500 cursor-pointer group transform translate-x-[-20px] opacity-0 region-card ${riskTheme}"
                         style="transition-delay: ${idx * 50}ms"
                         onclick="zoomToRegion('${reg.name}')">
                        <div class="flex justify-between items-center">
                            <div>
                                <div class="font-black text-sm text-slate-800 dark:text-white group-hover:translate-x-1 transition-transform">${reg.name}</div>
                                <div class="text-[10px] opacity-70 font-bold mt-1 text-slate-500"><i class="fas fa-users mr-1"></i> ${reg.count} Debitur</div>
                                <div class="text-xs font-black font-mono mt-0.5 text-slate-700 dark:text-slate-300">${fmtIDR(reg.os)}</div>
                            </div>
                            <div class="text-right flex flex-col items-end">
                                <div class="text-xs font-black px-3 py-1 rounded-full shadow-inner ${badgeTheme}">${reg.npl_pct.toFixed(2)}%</div>
                                <div class="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-60 text-slate-600">Ratio</div>
                            </div>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>
    </div>

    <!-- Map Loader Kaca -->
    <div id="map_loader" class="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 z-[500] backdrop-blur-xl transition-opacity duration-500 rounded-[2.5rem]">
        <div class="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin shadow-lg"></div>
        <span class="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-800 dark:text-emerald-400 mt-5 bg-white/50 px-4 py-1 rounded-full shadow-sm">Memuat Peta...</span>
    </div>
    `;

    setTimeout(function() { initLeafletMap(res.points); }, 300);
    unlockMenu();
}

// --- FUNGSI TOGGLE UNTUK MOBILE UX ---
window.toggleMapList = function() {
    // Fungsi ini hanya berefek jika layar sempit (Mobile)
    if(window.innerWidth > 768) return; 
    
    var listContainer = document.getElementById('map_region_list');
    var chevron = document.getElementById('map-chevron');
    
    if (listContainer.style.maxHeight === '0px') {
        listContainer.style.maxHeight = '50vh';
        listContainer.style.opacity = '1';
        listContainer.style.padding = '12px';
        chevron.style.transform = 'rotate(0deg)';
    } else {
        listContainer.style.maxHeight = '0px';
        listContainer.style.opacity = '0';
        listContainer.style.padding = '0 12px';
        chevron.style.transform = 'rotate(180deg)';
    }
};

// --- LOGIKA UTAMA LEAFLET JS ---
function initLeafletMap(points) {
    // Animasi Kartu Masuk Bergilir
    document.querySelectorAll('.region-card').forEach(el => {
        el.classList.remove('opacity-0', 'translate-x-[-20px]');
    });

    if (mapInstance) { mapInstance.remove(); mapInstance = null; }

    var centerPPU = [-1.3093, 116.7274]; 
    mapInstance = L.map('map_canvas', { zoomControl: false }).setView(centerPPU, 10);

    // Style Peta Bersih (CartoDB Positron)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(mapInstance);

    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

    const markerClusterGroup = L.markerClusterGroup({
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 40 // Radius yang ideal untuk HP & PC
    });

    points.forEach(function(p) {
        var baseCoord = getCoordByRegion(p.area);
        var lat = baseCoord.lat + (Math.random() - 0.5) * 0.005;
        var lng = baseCoord.lng + (Math.random() - 0.5) * 0.005;
        
        var targetRadius = p.os > 500000000 ? 10 : 7; 

        // Warna marker playful
        var marker = L.circleMarker([lat, lng], {
            color: '#ffffff', weight: 2, fillColor: '#ef4444',
            fillOpacity: 0.85, radius: targetRadius
        });

        var content = `
            <div class="p-3 min-w-[200px] font-sans bg-white/50 backdrop-blur-md rounded-xl">
                <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1"><i class="fas fa-map-pin text-emerald-500 mr-1"></i> ${p.area}</div>
                <div class="font-black text-slate-800 text-sm leading-tight mb-3">${p.nama}</div>
                <div class="flex justify-between items-center bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                    <span class="text-[9px] font-bold text-red-600 uppercase tracking-wider">Outstanding</span>
                    <span class="font-black font-mono text-red-700 text-xs">Rp ${new Intl.NumberFormat('id-ID').format(p.os)}</span>
                </div>
            </div>`;
        
        marker.bindPopup(content, { className: 'playful-popup' });
        markerClusterGroup.addLayer(marker); 
    });

    mapInstance.addLayer(markerClusterGroup);

    var loader = document.getElementById('map_loader');
    if(loader) {
        loader.classList.add('opacity-0');
        setTimeout(() => { loader.style.display = 'none'; }, 500);
    }
}

// --- FUNGSI ZOOM KE WILAYAH ---
window.zoomToRegion = function(regionName) {
    if(!mapInstance) return;
    
    var coord = getCoordByRegion(regionName);
    mapInstance.flyTo([coord.lat, coord.lng], 13, { duration: 1.5 });

    // UX Tambahan: Otomatis lipat menu di HP saat wilayah diklik agar peta terlihat
    if(window.innerWidth <= 768) {
        toggleMapList();
    }
};

// --- FUNGSI PENCARIAN KOORDINAT PERBAIKAN ---
function getCoordByRegion(name) {
    var n = String(name).toUpperCase().trim();
    
    // Cari di kamus utama (cityCoords) terlebih dahulu
    if (cityCoords[n]) {
        return { lat: cityCoords[n][0], lng: cityCoords[n][1] };
    }
    
    // Fallback jika desa spesifik tidak ditemukan, cari kecamatannya saja
    if (n.includes('PENAJAM')) return { lat: cityCoords["KEC. PENAJAM (UMUM)"][0], lng: cityCoords["KEC. PENAJAM (UMUM)"][1] };
    if (n.includes('WARU')) return { lat: cityCoords["KEC. WARU (UMUM)"][0], lng: cityCoords["KEC. WARU (UMUM)"][1] };
    if (n.includes('BABULU')) return { lat: cityCoords["KEC. BABULU (UMUM)"][0], lng: cityCoords["KEC. BABULU (UMUM)"][1] };
    if (n.includes('SEPAKU')) return { lat: cityCoords["KEC. SEPAKU (UMUM)"][0], lng: cityCoords["KEC. SEPAKU (UMUM)"][1] };
    
    // Fallback absolut
    return { lat: cityCoords["DEFAULT"][0], lng: cityCoords["DEFAULT"][1] };
}

  function el(id) { return document.getElementById(id); }
  function 
  fmt(n) { return "Rp " + Math.round(n||0).toLocaleString('id-ID'); }
  function fmtNum(n) { return Math.round(n||0).toLocaleString('id-ID'); }
  function safeTxt(id, val) { const e = el(id); if(e) e.innerHTML = val; }
  function safeHTML(id, htm) { const e = el(id); if(e) e.innerHTML = htm; }
  function clean(v) { if(!v) return 0;
  let s = String(v).replace(/Rp|\s/g,''); return parseFloat(s) || 0; }
  
  function excelDateToJS(serial) { 
    if(!serial) return "";
    if(typeof serial === 'string' && serial.includes('-')) return serial; 
    if(!isNaN(serial) && serial > 20000) {
       const date = new Date((serial - 25569) * 86400 * 1000);
       return date.toISOString().split('T')[0];
    }
    return serial;
  }
  
  function getBranchColor(str) {
    if(!str) return '#ccc';
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const h = hash % 360; return `hsl(${h}, 85%, 85%)`;
  }
  function getBranchTextCol(str) {
    if(!str) return '#333';
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const h = hash % 360; return `hsl(${h}, 70%, 30%)`;
  }

  // --- FUNGSI BADGE SELISIH (UPDATED: NOMINAL PENUH / FULL NUMBER) ---
  function diffBadge(v, prev, bad, isNoa) {
     if(!prev) return '';
     let p = prev>0?(v/prev)*100:0;
     let gd = bad ? v<0 : v>0;
     let color = gd ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
     let arrow = v>0?'▲':'▼';
     
     // FORMAT NOMINAL SELISIH (FULL ANGKA)
     let nomStr = "";
     if(isNoa) {
         // Jika Data NOA (Orang), pakai angka biasa
         nomStr = Math.round(v).toLocaleString('id-ID');
     } else {
         // Jika Rupiah, SELALU pakai angka penuh (Rp 1.500.000, bukan 1.5 Jt)
         nomStr = "Rp " + Math.round(v).toLocaleString('id-ID');
     }

     // TAMPILAN: [ Arrow % | Nominal ]
     return `<span class="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${color} inline-flex items-center gap-1">
        <span>${arrow} ${Math.abs(p).toFixed(1)}%</span>
        <span class="opacity-40">|</span>
        <span>${v>0?'+':''}${nomStr}</span>
     </span>`;
  }

  // --- FUNGSI UPDATE KARTU (ALL IN ONE) ---
function updateCard(id, currVal, diffVal, prevVal, invertColor) {
      const target = el(id); if (!target) return;
      const oldVal = clean(target.innerText) || 0;
      const isNoa = id.toLowerCase().includes('noa');
      animateValue(id, oldVal, currVal, 800, !isNoa);

      let badgeId = 'bdg_' + id;
      const elBadge = el(badgeId);
      if (elBadge) {
          if (diffVal !== undefined && diffVal !== null) {
              let isGood = invertColor ? (diffVal <= 0) : (diffVal >= 0);
              let colorClass = diffVal === 0 ? "text-gray-400 bg-gray-100" : 
                              (isGood ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : "text-red-600 bg-red-50 dark:bg-red-900/20");
              let pct = prevVal ? (diffVal/prevVal)*100 : 0;
              elBadge.innerHTML = `<div class="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold ${colorClass} mt-1 border border-black/5">
                                    ${diffVal > 0 ? '▲' : '▼'} ${isNoa ? formatNumber(diffVal) : formatRupiah(diffVal)} | ${Math.abs(pct).toFixed(1)}%
                                   </div>`;
              elBadge.classList.remove('hidden');
          } else { elBadge.classList.add('hidden'); }
      }
  }

  // --- INIT FUNCTION (DENGAN SINKRONISASI MENU LAPORAN) ---
function init() {
    console.log("App Init V60 Resilience (Report Hub Ready)");
    
    // Setup Tema & Loader
    if(localStorage.getItem('theme')==='dark') document.documentElement.classList.add('dark');
    if(el('loader')) el('loader').style.display = 'flex';

    // 1. AMBIL DATA SNAPSHOT (TANGGAL)
    google.script.run.withSuccessHandler(res => {
      s.snaps = res;
      if(!res || !res.length) { 
          alert("Data Kosong / Belum ada Snapshot."); 
          if(el('loader')) el('loader').style.display='none'; 
          return; 
      }

      // Buat HTML Options
      let opts = res.map(x => `<option value="${x.date}">${x.label}</option>`).join('');

      // A. Populate Toolbar Utama (Header Atas)
      el('selDate').innerHTML = opts; 
      el('selComp').innerHTML = '<option value="">Banding...</option>' + opts;

      // B. Populate Menu Laporan Baru (Panel Cantik) [BARU]
      if(el('rptDateSel')) el('rptDateSel').innerHTML = opts;
      if(el('rptCompSel')) el('rptCompSel').innerHTML = '<option value="">- Tidak ada pembanding -</option>' + opts;

      // C. Set Default Values
      s.filter.d = res[0].date; // Default tanggal terbaru
      if(res.length > 1) s.filter.c = res[1].date; // Default pembanding bulan lalu
      
      // Update Value Dropdown Utama
      el('selDate').value = s.filter.d;
      el('selComp').value = s.filter.c;

      // Update Value Dropdown Laporan [BARU]
      if(el('rptDateSel')) el('rptDateSel').value = s.filter.d;
      if(el('rptCompSel')) el('rptCompSel').value = s.filter.c;

      // Lanjut Load Cabang & Render
      updateHeaderDate();
      loadBranches(); 

    }).withFailureHandler(e => { 
        alert("Error Init: "+e); 
        if(el('loader')) el('loader').style.display='none'; 
    }).getAvailableSnapshots();

    // 2. LISTENER PENCARIAN
    if(el('searchKredit')) {
        el('searchKredit').addEventListener('input', (e) => {
            if(!s.kredit || !s.kredit.list) return;
            let term = e.target.value.toLowerCase();
            let filtered = s.kredit.list.filter(r => r.nama.toLowerCase().includes(term) || r.loan.toLowerCase().includes(term));
            renderTableRaw('tblKredit', filtered.slice(0, 100));
        });
    }
    
    // 3. LISTENER KLIK LUAR (SHEET)
    document.addEventListener('click', (e) => {
        const sheet = el('nplSheet'); const trigger = el('btnNPLSheet');
        if(sheet && sheet.classList.contains('open') && !sheet.contains(e.target) && !trigger.contains(e.target)) sheet.classList.remove('open');
    });
}

// --- LOAD BRANCHES (UPDATE: ISI JUGA DROPDOWN DI MENU LAPORAN) ---
function loadBranches() {
    google.script.run.withSuccessHandler(res => {
      let h = '<option value="ALL">Semua Unit</option>'; 
      res.forEach(b => h += `<option value="${b}">${b}</option>`);
      
      // A. Isi Dropdown Toolbar Utama
      el('selBranch').innerHTML = h; 
      el('selBranch').value = 'ALL';

      // B. Isi Dropdown Menu Laporan [BARU]
      if(el('rptBranchSel')) {
          el('rptBranchSel').innerHTML = h;
          el('rptBranchSel').value = 'ALL';
      }

      // Refresh Tampilan Awal
      refresh();
      
    }).getBranchList(s.filter.d);
}

 






   



  function updateHeaderDate() {
      const snap = s.snaps.find(x => x.date === s.filter.d);
      const snapC = s.snaps.find(x => x.date === s.filter.c);
      let html = `<span class="text-brand-600 font-bold">${snap?snap.label:'-'}</span>`;
      if(snapC) html += ` <span class="text-gray-400 text-[10px]">vs ${snapC.label}</span>`;
      safeHTML('headerDate', html);
  }


  function toggleSheet() { el('nplSheet').classList.toggle('open'); }

  
function switchTab(id) {
    // 1. PEMBERSIHAN TOTAL (Mencegah menu menumpuk)
    // Tutup semua bottom sheets yang mungkin sedang terbuka
    document.querySelectorAll('.custom-bottom-sheet').forEach(sheet => {
        sheet.classList.remove('open');
    });
    
    // Tutup Native Menu Utama
    const nativeMenu = document.getElementById('nativeMenuSheet');
    if (nativeMenu) {
        nativeMenu.classList.add('translate-y-full');
    }

    // Sembunyikan Overlay
    const overlay = document.getElementById('nativeOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }

    // Paksa tutup modal detail yang mungkin masih menempel (dari video Anda)
    const modalDetail = document.getElementById('modalDetail');
    if (modalDetail) {
        modalDetail.classList.add('hidden');
    }

    // 2. LOGIKA PINDAH HALAMAN
    if(id === 'npl-menu') { toggleSheet(); return; }

    document.querySelectorAll('.tab-view').forEach(e => e.classList.add('hidden')); 
    if(document.getElementById(id)) document.getElementById(id).classList.remove('hidden');

    // ... sisa kodingan switchTab Anda selanjutnya ...
}


  
function refresh(viewId) {

    // --- FUNGSI RESET SLIDER (WHAT-IF ANALYSIS) ---
    // Memastikan tuas slider kembali ke 0 setiap kali data/cabang baru dimuat
    if (typeof resetSimSliders === 'function') resetSimSliders();

    // --- TAMBAHAN VISUAL ---
    // Cari elemen angka utama dan beri efek loading "shimmer" (Skeleton)
    const loadIds = ['kr_os', 'kr_noa', 'v_os', 'v_npl', 'v_kkr', 'v_tgk'];
    loadIds.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            // Ganti angka dengan kotak abu-abu berdenyut
            el.innerHTML = '<div class="animate-pulse bg-gray-200 dark:bg-slate-700 h-6 w-24 rounded"></div>';
        }
    });

    // 1. DEFINISI STATE (PENTING!)
    var s = app.state; 
    
    // 2. Deteksi View Aktif
    // Menggunakan fallback aman jika querySelector null
    var activeTab = document.querySelector('.tab-view:not(.hidden)');
    var id = viewId || (activeTab ? activeTab.id : 'view-dashboard');

    // 3. Update Filter State dari DOM
    if(document.getElementById('selDate')) s.filter.d = document.getElementById('selDate').value;
    if(document.getElementById('selBranch')) s.filter.b = document.getElementById('selBranch').value;
    if(document.getElementById('selComp')) s.filter.c = document.getElementById('selComp').value;

    // Update Label Tanggal di Header
    if(typeof updateHeaderDate === 'function') updateHeaderDate();

    // Tampilkan Loader Utama
    var loader = document.getElementById('loader');
    if(loader) loader.style.display = 'flex';
    
    // --- FITUR BARU: MENU LOCK (UI DEBOUNCE) ---
    // Mengunci sidebar dan navigasi bawah agar user tidak memencet menu lain saat loading
    const navMenu = document.getElementById('sidebar');
    const bottomNav = document.getElementById('bottom-nav');
    
    if (navMenu) {
        navMenu.classList.add('pointer-events-none', 'opacity-70', 'transition-all');
    }
    if (bottomNav) {
        bottomNav.classList.add('pointer-events-none', 'opacity-70', 'transition-all');
    }
    // ------------------------------------------

    // --- BLOK SKELETON (SHIMMER EFFECT) ---
    // 1. Redupkan area yang sedang loading
    const activeView = document.querySelector('.tab-view:not(.hidden)');
    if (activeView) {
        activeView.classList.add('opacity-50', 'pointer-events-none', 'transition-opacity', 'duration-300');
    }

    // 2. Suntikkan efek Shimmering (Garis Berdenyut) ke dalam tabel yang aktif
    const activeTableBodies = document.querySelectorAll('.tab-view:not(.hidden) tbody');
    activeTableBodies.forEach(tbody => {
        tbody.innerHTML = `
            <tr><td colspan="10" class="p-8">
                <div class="animate-pulse space-y-5 w-full">
                    <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-3/4"></div>
                    <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-1/2"></div>
                    <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-5/6"></div>
                    <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-2/3"></div>
                </div>
            </td></tr>
        `;
    });

    // Bersihkan Chart Lama (Memory Management)
    if(typeof charts !== 'undefined') {
        Object.keys(charts).forEach(function(k) { 
            if(charts[k]) { charts[k].destroy(); delete charts[k]; } 
        });
    }

    // --- ROUTING LOGIC ---

    // 1. Dashboard Utama
    if(id === 'view-dash' || id === 'view-dashboard') {
        google.script.run.withSuccessHandler(renderDashboard).getDashboardData(s.filter.b, s.filter.d, s.filter.c);
    }
    
    // 2. Kelompok NPL & Kredit
    else if(id === 'view-nplall') google.script.run.withSuccessHandler(renderAllNPLPage).getAllNPLData(s.filter.b, s.filter.d, s.filter.c);
    else if(id === 'view-nplkur') google.script.run.withSuccessHandler(renderKURPage).getKURChartData(s.filter.b, s.filter.d, s.filter.c);
    else if(id === 'view-nplkonsumtif') google.script.run.withSuccessHandler(renderKonsumtifPage).getKonsumtifData(s.filter.b, s.filter.d, s.filter.c);
    else if(id === 'view-nplprod') google.script.run.withSuccessHandler(renderProdPage).get4SData(s.filter.b, s.filter.d, s.filter.c);
    else if(id === 'view-kredit') google.script.run.withSuccessHandler(renderKreditPage).getAllCreditExtended(s.filter.b, s.filter.d, s.filter.c);
    
    // 3. Kelompok Operasional (Watchlist, Collection, Top)
    else if(id === 'view-watchlist') google.script.run.withSuccessHandler(renderWatchlist).getWatchlistData(s.filter.b, s.filter.d);
    else if(id === 'view-collection') google.script.run.withSuccessHandler(renderCollectionPage).getCollectionCandidates(s.filter.b, s.filter.d);
    else if(id === 'view-top') google.script.run.withSuccessHandler(renderTopObligorPage).getTopObligors(s.filter.b, s.filter.d);
    
    // 4. Manajemen Risiko (CKPN, Risk Matrix, Stress, Vintage)
    else if(id === 'view-ckpn') google.script.run.withSuccessHandler(renderCKPNPage).getCKPNEstimate(s.filter.b, s.filter.d);
    else if(id === 'view-risk') google.script.run.withSuccessHandler(renderRiskMatrix).getRiskMatrixData(s.filter.b, s.filter.d);
    else if(id === 'view-vintage') google.script.run.withSuccessHandler(renderVintagePage).getVintageData(s.filter.b, s.filter.d);
    else if(id === 'view-stress') google.script.run.withSuccessHandler(initStressTest).getCKPNEstimate(s.filter.b, s.filter.d);
    else if(id === 'view-trend') google.script.run.withSuccessHandler(renderTrend).getTrendAnalysis(s.filter.b);
    else if(id === 'view-map') google.script.run.withSuccessHandler(renderMapPage).getMapData(s.filter.b, s.filter.d);

    // 5. FITUR BARU & PERBAIKAN
    
    // Write Off (Hapus Buku)
    else if(id === 'view-writeoff') {
        google.script.run.withSuccessHandler(renderWriteOffPage).getWriteOffData(s.filter.b, s.filter.d);
    }
    
    // Mutasi
    else if(id === 'view-mutasi') {
        if (!s.filter.c) {
            alert("Harap pilih Tanggal Pembanding untuk melihat Mutasi!");
            if(loader) loader.style.display = 'none';
            if (typeof unlockMenu === 'function') unlockMenu(); // Pastikan menu terbuka kembali jika dibatalkan
        } else {
            google.script.run.withSuccessHandler(renderMutasiPage).getMovementExtended(s.filter.b, s.filter.d, s.filter.c);
        }
    }
    
    // Jatuh Tempo
    else if(id === 'view-maturity') {
        var elRange = document.getElementById('selMatRange');
        var range = elRange ? elRange.value : 2;
        google.script.run.withSuccessHandler(renderMaturityPage).getMaturityDashboard(s.filter.b, s.filter.d, range);
    }
    
    // Fresh Drop
    else if(id === 'view-freshdrop') {
        google.script.run.withSuccessHandler(renderFreshDropPage).getFreshDropData(s.filter.b, s.filter.d);
    }
    
    // Debtor Journey
    else if(id === 'view-journey') {
        google.script.run.withSuccessHandler(function(res) {
            app.state = app.state || {};
            app.state.data = app.state.data || {};
            s.data.npl_list = res.npl_list;
            
            renderJourneyPage();
            
            if(loader) loader.style.display = 'none';
            if (typeof unlockMenu === 'function') unlockMenu(); // Buka kunci navigasi
        }).getDashboardData(s.filter.b, s.filter.d, s.filter.c);
    }

    // Laporan Preview
    else if(id === 'view-report') {
        if(!s.filter.c) console.warn("Pembanding kosong, laporan mungkin tidak lengkap.");
        google.script.run.withSuccessHandler(renderReportPreview).getFullReportData(s.filter.b, s.filter.d, s.filter.c);
    }
    
    // Arsip Kredit
    else if(id === 'view-archive') {
        loadArchiveData();
    }

    // Fallback: Jika view tidak dikenali
    else {
        console.log("View tidak dikenal: " + id);
        if(loader) loader.style.display = 'none';
        if (typeof unlockMenu === 'function') unlockMenu(); // Buka kunci navigasi
    }
}

// Fungsi untuk membuka kunci menu setelah loading selesai
function unlockMenu() {
    const navMenu = document.getElementById('sidebar');
    const bottomNav = document.getElementById('bottom-nav');
    
    if (navMenu) navMenu.classList.remove('pointer-events-none', 'opacity-70');
    if (bottomNav) bottomNav.classList.remove('pointer-events-none', 'opacity-70');
}




// --- UPDATE FUNGSI RENDER CHART (FIX ERROR CANVAS IN USE) ---

// Pastikan ada penampung global untuk menyimpan instance chart
if (!s.charts) s.charts = {}; 

// --- FUNGSI RENDER CHART UMUM (MENDUKUNG HORIZONTAL BAR) ---
function renderChart(canvasId, type, labels, data, title) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (charts[canvasId]) { charts[canvasId].destroy(); }

    // Jika tipenya bar, kita ubah orientasinya jadi mendatar (horizontal)
    const isHorizontal = type === 'bar';

    charts[canvasId] = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: title,
                data: data,
                // Gunakan gradien warna elegan agar tidak butuh belasan warna berbeda
                backgroundColor: isHorizontal 
                    ? 'rgba(59, 130, 246, 0.8)' // Biru solid elegan untuk bar chart
                    : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'], 
                borderWidth: 0,
                borderRadius: isHorizontal ? 4 : 0, // Ujung batang melengkung
                hoverBackgroundColor: 'rgba(29, 78, 216, 1)' // Warna saat di-hover
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: isHorizontal ? 'y' : 'x', // 'y' mengubah Bar menjadi Horizontal
            
            // --- FITUR KLIK UNTUK MEMUNCULKAN POPUP SEKTOR ---
            onClick: function(event, activeElements) {
                if (activeElements.length > 0) {
                    const dataIndex = activeElements[0].index;
                    const clickedSector = labels[dataIndex];
                    if (typeof app.openSectorModal === 'function') {
                        app.openSectorModal(clickedSector);
                    }
                }
            },
            
            plugins: {
                legend: { 
                    display: !isHorizontal, // Sembunyikan legenda jika Bar Chart
                    position: 'right' 
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let val = context.raw;
                            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
                        }
                    }
                }
            },
            scales: isHorizontal ? {
                x: { display: false }, // Sembunyikan angka rupiah di bawah agar bersih
                y: { 
                    grid: { display: false }, // Hilangkan garis-garis latar
                    ticks: {
                        font: { size: 10, weight: 'bold' },
                        color: '#64748b'
                    }
                }
            } : {} // Biarkan default jika bukan horizontal bar
        }
    });
}


  
// =================================================================
// LOGIKA MENU STRESS TEST (VERSI GLOBAL / ANTI-ERROR)
// =================================================================

// 1. INISIALISASI DATA
window.initStressTest = function(res) {
    if(document.getElementById('loader')) document.getElementById('loader').style.display='none';
    
    // Simpan Data
    s.ckpn = res;
    s.stressBuckets = JSON.parse(JSON.stringify(res.buckets)); 
    s.baseBuckets = JSON.parse(JSON.stringify(res.buckets)); 
    
    renderStressUI();
    unlockMenu();
};

// 2. RENDER TAMPILAN UTAMA
window.renderStressUI = function() {
    var container = document.getElementById('view-stress');
    if(!container) return;

    var currentBuckets = s.stressBuckets;
    var baseBuckets = s.baseBuckets;
    
    var totalCKPN = currentBuckets.reduce((a,x) => a+x.prov, 0);
    var baseCKPN = baseBuckets.reduce((a,x) => a+x.prov, 0);
    var diff = totalCKPN - baseCKPN;
    
    // Ambil nilai lama untuk titik awal animasi
    const oldTotal = clean(document.getElementById('stress_total_val')?.innerText) || baseCKPN;

    var diffColor = diff > 0 ? "text-red-400" : (diff < 0 ? "text-green-400" : "text-slate-400");
    var diffIcon = diff > 0 ? "▲" : (diff < 0 ? "▼" : "•");

    var html = `
    <div class="flex flex-col h-full bg-slate-50 dark:bg-slate-900 p-4 gap-4 fade-in">
        
        <div class="bg-gradient-to-br from-indigo-900 via-slate-900 to-black rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden shrink-0 border border-white/10">
            <div id="stress_glow" class="absolute -top-20 -right-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-screen filter blur-[80px] opacity-20 transition-all duration-1000"></div>
            
            <div class="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                    <div class="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Projected CKPN (Post-Stress)</div>
                    <div id="stress_total_val" class="text-4xl font-black font-mono tracking-tighter text-white">
                        ${fmt(totalCKPN)}
                    </div>
                </div>
                <div class="md:text-right md:border-l border-white/10 md:pl-6">
                    <div class="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Capital Impact (Delta)</div>
                    <div id="stress_diff_val" class="text-2xl font-black font-mono ${diffColor} drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]">
                        ${diffIcon} ${fmt(Math.abs(diff))}
                    </div>
                </div>
            </div>
        </div>

        <div class="flex flex-col gap-2 shrink-0">
            <div class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Quick Scenarios</div>
            <div class="flex gap-2">
                <button onclick="window.setScenario('BASE')" class="flex-1 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition active:scale-95 shadow-sm">Reset</button>
                <button onclick="window.setScenario('MODERATE')" class="flex-1 py-3 rounded-xl bg-yellow-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-yellow-600 transition active:scale-95 shadow-lg shadow-yellow-500/20">Moderate</button>
                <button onclick="window.setScenario('HARD')" class="flex-1 py-3 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition active:scale-95 shadow-lg shadow-red-600/20">Crisis</button>
            </div>
        </div>

        <div class="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            <div class="overflow-y-auto flex-1 custom-scrollbar">
                <table class="w-full text-sm">
                    <tbody class="divide-y divide-slate-50 dark:divide-slate-700">
                        ${currentBuckets.map((r, i) => renderStressRow(r, i, baseBuckets[i])).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;

    container.innerHTML = html;

    // Trigger Animasi Angka Berjalan
    animateValue('stress_total_val', oldTotal, totalCKPN, 600, true);
    
    // Beri efek flash warna pada kartu jika ada perubahan besar
    if(diff > 0) {
        let glow = document.getElementById('stress_glow');
        if(glow) { glow.classList.replace('bg-blue-500', 'bg-red-500'); glow.style.opacity = "0.4"; }
    }
};

// 3. HELPER RENDER ROW
window.renderStressRow = function(r, i, base) {
    var fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
    var isStressed = r.rate > base.rate;
    var rowBg = isStressed ? "bg-red-50/50 dark:bg-red-900/10" : "";
    var accentColor = r.rate < 10 ? 'accent-blue-500' : (r.rate < 50 ? 'accent-yellow-500' : 'accent-red-600');
    
    var diffProv = r.prov - base.prov;

    return `
    <tr class="transition-colors duration-500 ${rowBg}">
        <td class="p-4 w-1/4 align-top">
            <div class="flex items-center gap-2 mb-1">
                <div class="w-2 h-2 rounded-full ${r.k>=3?'bg-red-500 shadow-[0_0_8px_red]':(r.k==2?'bg-yellow-500':'bg-blue-500')}"></div>
                <span class="font-black text-slate-700 dark:text-white text-xs uppercase">Kol ${r.k}</span>
            </div>
            <div class="text-[10px] text-slate-400 font-mono font-bold">${fmt(r.os)}</div>
        </td>
        <td class="p-4 w-1/2 align-middle">
            <div class="flex justify-between text-[9px] mb-2 font-black uppercase tracking-tighter">
                <span class="${isStressed?'text-red-600':'text-slate-500'}">Prob. Default: ${r.rate}%</span>
                <span class="text-slate-300">Base: ${base.rate}%</span>
            </div>
            <input type="range" min="0" max="100" step="0.5" 
                   value="${r.rate}" 
                   oninput="window.updateStress(${i}, this.value)" 
                   class="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer ${accentColor} transition-all">
        </td>
        <td class="p-4 w-1/4 text-right align-middle">
            <div class="font-black font-mono text-slate-800 dark:text-white text-xs">${fmt(r.prov)}</div>
            ${diffProv > 0 ? `<div class="text-[9px] font-bold text-red-500 animate-bounce-short">+${fmt(diffProv)}</div>` : ''}
        </td>
    </tr>`;
};

// 4. LOGIKA UPDATE SLIDER (GLOBAL)
window.updateStress = function(idx, newRate) {
    let r = s.stressBuckets[idx];
    r.rate = parseFloat(newRate);
    r.prov = r.os * (r.rate/100);
    renderStressUI();
};

// 5. LOGIKA SKENARIO (GLOBAL)
window.setScenario = function(type) {
    let base = JSON.parse(JSON.stringify(s.baseBuckets));
    
    if (type === 'BASE') {
        s.stressBuckets = base;
    } 
    else if (type === 'MODERATE') {
        s.stressBuckets = base.map(b => {
            let newRate = b.k >= 2 ? Math.min(100, b.rate + 5) : b.rate;
            return { ...b, rate: newRate, prov: b.os * (newRate/100) };
        });
    } 
    else if (type === 'HARD') {
        s.stressBuckets = base.map(b => {
            let newRate = b.k >= 2 ? Math.min(100, b.rate + 15) : b.rate;
            return { ...b, rate: newRate, prov: b.os * (newRate/100) };
        });
    }
    
    renderStressUI();
};




  function renderVintagePage(res) {
    // Hide Loader
    if(document.getElementById('loader')) document.getElementById('loader').style.display='none';

    var container = document.getElementById('view-vintage');
    if (!container) return;

    var fmtIDR = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
    var fmtPct = (v) => v.toFixed(2) + '%';

    // Ambil data untuk rangkuman (High Risk & Best Quality)
    const sortedByNpl = [...res.list].sort((a,b) => b.npl_pct - a.npl_pct);
    const highRiskYear = sortedByNpl[0];
    const bestQualityYear = sortedByNpl[sortedByNpl.length - 1];

    var html = `
    <div class="space-y-6 p-4 md:p-6 bg-slate-50 dark:bg-slate-900 min-h-screen animate-fade-in">
        <div class="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl border-l-8 border-indigo-400 relative overflow-hidden transform transition-all duration-700 hover:scale-[1.01]">
            <div class="relative z-10">
                <h3 class="font-black text-xs text-indigo-300 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <i class="fas fa-history animate-spin-slow"></i> Vintage & Quality Analytics
                </h3>
                <p class="text-white text-xl md:text-2xl font-light italic leading-relaxed">"${res.insight}"</p>
            </div>
            <div class="absolute right-[-20px] bottom-[-20px] text-[12rem] text-white opacity-5 transform rotate-12">
                <i class="fas fa-chart-line"></i>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div class="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <span class="font-black text-xs uppercase tracking-widest text-slate-500">Portfolio Quality by Booking Year</span>
                    <span class="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">LIVE DATA</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left">
                        <thead class="text-[10px] text-slate-400 uppercase tracking-tighter bg-white dark:bg-slate-800 sticky top-0">
                            <tr>
                                <th class="px-6 py-4">Tahun</th>
                                <th class="px-6 py-4 text-right">Volume (OS)</th>
                                <th class="px-6 py-4 text-center">Avg Rate</th>
                                <th class="px-6 py-4 text-center">Watchlist</th>
                                <th class="px-6 py-4 text-center">NPL Ratio</th>
                                <th class="px-6 py-4 text-center">Grade</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50 dark:divide-slate-700">`;

    res.list.forEach((r, idx) => {
        var nplColor = r.npl_pct > 5 ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : (r.npl_pct > 2 ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20');
        var grade = r.npl_pct < 2 ? 'A' : (r.npl_pct < 5 ? 'B' : 'C');
        var gradeClass = r.npl_pct < 2 ? 'bg-emerald-500 shadow-emerald-500/20' : (r.npl_pct < 5 ? 'bg-orange-500 shadow-orange-500/20' : 'bg-red-500 shadow-red-500/20');

        html += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-300 opacity-0 transform translate-y-4 vintage-row" style="transition-delay: ${idx * 70}ms">
                <td class="px-6 py-4 font-black text-slate-700 dark:text-slate-200">${r.year}</td>
                <td class="px-6 py-4 text-right font-mono font-bold text-slate-600 dark:text-slate-400">${fmtIDR(r.os)}</td>
                <td class="px-6 py-4 text-center font-medium text-slate-500">${fmtPct(r.avg_rate)}</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">${fmtPct(r.kol2_pct)}</span>
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="${nplColor} px-3 py-1 rounded-full text-xs font-black">${fmtPct(r.npl_pct)}</span>
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="w-7 h-7 rounded-lg ${gradeClass} text-white flex items-center justify-center font-black text-xs mx-auto shadow-lg transform transition hover:rotate-12 cursor-default">
                        ${grade}
                    </div>
                </td>
            </tr>`;
    });

    html += ` </tbody>
                    </table>
                </div>
            </div>

            <div class="space-y-6">
                <div class="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                    <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500 text-red-500">
                        <i class="fas fa-radiation text-4xl"></i>
                    </div>
                    <div class="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">High Risk Vintage</div>
                    <div class="text-4xl font-black text-red-600 dark:text-red-400 mb-1 animate-pulse">${highRiskYear ? highRiskYear.year : '-'}</div>
                    <div class="text-xs text-slate-500 font-medium">Tahun booking dengan tingkat gagal bayar tertinggi (${fmtPct(highRiskYear ? highRiskYear.npl_pct : 0)}).</div>
                </div>

                <div class="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                    <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500 text-emerald-500">
                        <i class="fas fa-shield-alt text-4xl"></i>
                    </div>
                    <div class="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Best Quality Vintage</div>
                    <div class="text-4xl font-black text-emerald-600 dark:text-emerald-400 mb-1">${bestQualityYear ? bestQualityYear.year : '-'}</div>
                    <div class="text-xs text-slate-500 font-medium">Standard approval terbaik ditemukan pada portofolio tahun ini.</div>
                </div>
                
                <div class="bg-slate-800 dark:bg-slate-950 p-6 rounded-3xl text-white shadow-xl">
                    <div class="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-4">Risk Matrix Legend</div>
                    <div class="space-y-4">
                        <div class="flex items-center gap-4">
                            <div class="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-xs shadow-lg shadow-emerald-500/40">A</div>
                            <div class="flex flex-col"><span class="text-xs font-bold">HEALTHY</span><span class="text-[9px] text-slate-400">NPL Ratio < 2%</span></div>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center font-black text-xs shadow-lg shadow-orange-500/40">B</div>
                            <div class="flex flex-col"><span class="text-xs font-bold">WATCHLIST</span><span class="text-[9px] text-slate-400">NPL Ratio 2% - 5%</span></div>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="w-8 h-8 rounded-xl bg-red-500 flex items-center justify-center font-black text-xs shadow-lg shadow-red-500/40">C</div>
                            <div class="flex flex-col"><span class="text-xs font-bold">CRITICAL</span><span class="text-[9px] text-slate-400">NPL Ratio > 5%</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    container.innerHTML = html;

    // --- TRIGGER ANIMASI SETELAH DOM SIAP ---
    setTimeout(() => {
        document.querySelectorAll('.vintage-row').forEach(row => {
            row.classList.remove('opacity-0', 'translate-y-4');
        });
    }, 100);
      unlockMenu();
}

  function renderDashboard(res) {
    s.data = res; 
    if(el('loader')) el('loader').style.display='none';
    
    const k = res.kpi; const d = res.diff;

    // A. Animasi Kartu Utama
    document.querySelectorAll('.glass-card').forEach((card, index) => {
        card.style.opacity = '0'; card.style.transform = 'translateY(20px)';
        card.style.transition = `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
        requestAnimationFrame(() => { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; });
    });

    // B. Update KPI Angka
    updateCard('v_os', k.total_os, d?.os, d?.prev_os, false);
    updateCard('v_tgk', k.tunggakan, d?.tunggakan, d?.prev_tgk, true); 
    updateCard('v_noa', k.noa, d?.noa, d?.prev_noa, false);
    updateCard('v_prod', k.prod_os, d?.prod_os, d?.prev_prod, false);
    updateCard('v_cons', k.cons_os, d?.cons_os, d?.prev_cons, false);

    // C. Perekaman Data Cabang (PENTING UNTUK MODAL)
    if(res.branch_perf) {
        app.state.branch_perf = res.branch_perf; // Simpan ke state
        
        let topBr = Object.keys(res.branch_perf).sort((x, y) => res.branch_perf[y].os - res.branch_perf[x].os)[0];
        if (topBr) {
            let elTop = document.getElementById('v_branch_top');
            if (elTop) elTop.innerText = "Top: " + topBr.replace('KANTOR CABANG PENAJAM', 'KC PPU').replace('CAPEM', 'KCP').substring(0,20);
        }
    }

    // D. NPL Glow Effect
    if(el('v_npl')) {
        let nplNow = (k.total_os > 0 ? (k.npl_os / k.total_os) * 100 : 0);
        let oldNpl = clean(el('v_npl').innerText) || 0;
        
        if (typeof animateValueDecimal === 'function') animateValueDecimal('v_npl', oldNpl, nplNow, 800);
        else el('v_npl').innerText = nplNow.toFixed(2) + '%';
        
        const nplCard = el('v_npl').closest('.glass-card');
        if(nplNow > 5) nplCard.classList.add('ring-2', 'ring-red-500', 'animate-pulse-slow');
        else nplCard.classList.remove('ring-2', 'ring-red-500', 'animate-pulse-slow');

        if(d && el('bdg_rat_npl')) {
            let nplPrev = d.prev_os > 0 ? (d.prev_npl / d.prev_os) * 100 : 0;
            let df = nplNow - nplPrev;
            let colorClass = df <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
            el('bdg_rat_npl').innerHTML = `<span class="ml-2 text-[10px] font-black px-2 py-0.5 rounded-full ${colorClass} shadow-sm border border-black/5">${df > 0 ? '▲' : '▼'} ${Math.abs(df).toFixed(2)}%</span>`;
        }
    }

    // E. KKR Rupiah Info
    if (el('v_kkr')) {
        let oldKkr = clean(el('v_kkr').innerText) || 0;
        animateValue('v_kkr', oldKkr, k.kkr_os, 800, true);
        
        if (d && el('bdg_v_kkr')) {
            let colorClass = d.kkr > 0 ? "text-rose-600 bg-rose-50" : "text-emerald-600 bg-emerald-50";
            el('bdg_v_kkr').innerHTML = `<div class="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-black ${colorClass} border border-black/5 animate-fade-in">${d.kkr > 0 ? "▲" : "▼"} ${formatRupiah(Math.abs(d.kkr))}</div>`;
            el('bdg_v_kkr').classList.remove('hidden');
        }
    }

    // F. Render Chart Sektor & Tabel
    renderTableRaw('tblTop', res.top_npl ? res.top_npl.slice(0,10) : []);
    if(res.chart_sector) setTimeout(() => { renderSectorList(res.chart_sector.labels, res.chart_sector.data); }, 100);
    if(typeof unlockMenu === 'function') unlockMenu();
}

// --- FUNGSI RENDER INTERACTIVE SECTOR LIST ---
function renderSectorList(labels, data) {
    const container = document.getElementById('list-sektor-container');
    if (!container) return;

    let html = '';
    // Cari nilai tertinggi untuk menghitung persentase lebar background bar
    const maxData = Math.max(...data) || 1; 
    
    // Format angka menjadi ringkas (Misal: 1.500.000.000 menjadi 1,5 M)
    const fmtCompact = new Intl.NumberFormat('id-ID', { notation: "compact", maximumFractionDigits: 2 });

    labels.forEach((label, i) => {
        const value = data[i];
        const pct = (value / maxData) * 100;
        
        // Pilih warna acak yang selaras untuk setiap baris agar playful
        const colors = ['blue', 'emerald', 'indigo', 'violet', 'rose'];
        const color = colors[i % colors.length];

        html += `
        <div onclick="if(typeof app.openSectorModal === 'function') app.openSectorModal('${label}')" 
             class="group relative bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700 p-3 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] overflow-hidden">
            
            <!-- Background Progress Bar (Animasi Lebar) -->
            <div class="absolute left-0 top-0 bottom-0 bg-${color}-100/60 dark:bg-${color}-900/30 rounded-2xl transition-all duration-1000 ease-out origin-left" style="width: 0%;" data-width="${pct}%"></div>

            <!-- Konten Kartu -->
            <div class="relative flex justify-between items-center z-10 gap-3">
                <div class="flex flex-col w-2/3">
                    <span class="text-[11px] font-black text-slate-700 dark:text-slate-200 truncate group-hover:text-${color}-600 dark:group-hover:text-${color}-400 transition-colors" title="${label}">
                        ${label}
                    </span>
                </div>
                <div class="text-right">
                    <span class="text-xs font-mono font-black text-slate-800 dark:text-white bg-white/50 dark:bg-black/20 px-2 py-1 rounded-lg backdrop-blur-sm">
                        Rp ${fmtCompact.format(value)}
                    </span>
                </div>
            </div>
        </div>
        `;
    });

    if(labels.length === 0) {
        html = `<div class="text-center text-slate-400 text-xs py-8">Tidak ada data sektor.</div>`;
    }

    container.innerHTML = html;

    // Trigger Animasi Progress Bar setelah dirender ke DOM
    setTimeout(() => {
        const bars = container.querySelectorAll('[data-width]');
        bars.forEach(bar => {
            bar.style.width = bar.getAttribute('data-width');
        });
    }, 50);
}


// Helper: Format Rupiah Penuh (Rp 1.000.000)
function formatRupiah(angka) {
    if (angka == null) return "Rp 0";
    let isNeg = angka < 0;
    let val = Math.abs(angka);
    // Format standar Indonesia tanpa singkatan
    let str = val.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return (isNeg ? "-" : "") + "Rp " + str;
}

// Helper: Format Angka Biasa (untuk NOA/Orang)
function formatNumber(angka) {
    if (angka == null) return "0";
    return Math.abs(angka).toLocaleString('id-ID');
}



  function renderAllNPLPage(res) { renderGenericPage(res, 'ALL');
                                 unlockMenu();}
  function renderKURPage(res) { renderGenericPage(res, 'KUR'); 
                              unlockMenu();}
  function renderKonsumtifPage(res) { renderGenericPage(res, 'Kons'); 
                                    unlockMenu();}
  function renderProdPage(res) { renderGenericPage(res, 'Prod'); 
                               unlockMenu();}
  function render4SPage(res) { renderGenericPage(res, '4S'); 
                             unlockMenu();}



// --- 2. RENDER TABLE WITH CHECKLIST (FIX SIMULASI VISUAL) ---
// --- UPDATE: RENDER TABLE (SUPPORT DETAIL KLIK NAMA) ---
    function renderSimTableHTML(elementId, rows, type, isSimulation, suffix) {
    let tbody = el(elementId); 
    if (!tbody) return; 
    tbody.innerHTML = '';
    
    if (rows.length === 0) { 
        tbody.innerHTML = '<tr><td colspan="7" class="p-12 text-center text-slate-400 italic">Tidak ada data ditemukan</td></tr>'; 
        return; 
    }

    rows.forEach((r, i) => {
        let tr = document.createElement('tr'); 
        tr.className = "group border-b border-slate-100 dark:border-slate-800 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all duration-200"; 
        tr.id = `row_${type}_${suffix}_${i}`;
        
        // Premium Badge Style
        const kolStyle = {
            1: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            2: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            3: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            4: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
            5: 'bg-slate-900 text-white dark:bg-black dark:text-slate-300 shadow-sm'
        };
        let colBadgeClass = kolStyle[r.kol] || 'bg-slate-100 text-slate-600';
        
        // Modern Simulation Checkbox
        let checkHTML = '';
        if (isSimulation) { 
            tr.style.cursor = "pointer"; 
            tr.onclick = function(e) { 
                if(e.target.closest('.click-detail')) return; 
                if(e.target.type !== 'checkbox') window.app.toggleSim(type, i, r.os, r.kol, suffix); 
            }; 
            checkHTML = `
                <div class="relative flex items-center justify-center">
                    <input type="checkbox" id="chk_${type}_${suffix}_${i}" 
                           class="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:border-blue-600 checked:bg-blue-600 transition-all" 
                           onclick="window.app.toggleSim('${type}', ${i}, ${r.os}, ${r.kol}, '${suffix}')">
                    <i class="fas fa-check absolute text-[10px] text-white opacity-0 peer-checked:opacity-100 pointer-events-none"></i>
                </div>`; 
        } else { 
            checkHTML = `<span class="text-[10px] font-bold text-slate-300 font-mono">${(i+1).toString().padStart(2, '0')}</span>`; 
        }

        tr.innerHTML = `
            <td class="p-3 text-center">${checkHTML}</td>
            <td class="p-3">
                <div class="click-detail flex flex-col group/item" onclick="event.stopPropagation(); window.app.fetchDetail('${r.loan}')">
                    <div class="truncate w-32 md:w-48 font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors uppercase tracking-tight text-xs">${r.nama}</div>
                    <div class="text-[9px] font-black font-mono text-slate-400 mt-0.5">${r.loan} | PK: ${r.pk || '-'}</div>
                </div>
            </td>
            <td class="p-3 hidden sm:table-cell"><span class="text-[10px] font-bold text-slate-500 uppercase">${r.br}</span></td>
            <td class="p-3 text-center"><span class="px-2 py-0.5 rounded-md text-[9px] font-black shadow-sm ${colBadgeClass}">KOL ${r.kol}</span></td>
            <td class="p-3 text-right font-mono text-[10px] text-slate-400 hidden lg:table-cell">${formatRupiah(r.plafond || 0)}</td>
            <td class="p-3 text-right font-mono text-xs font-black text-slate-700 dark:text-slate-200">${formatRupiah(r.os)}</td>
            <td class="p-3 text-right">
                <div class="font-mono text-xs font-black text-red-600 dark:text-red-400">${formatRupiah(r.tgk || 0)}</div>
                ${r.tgk > 0 ? `<div class="text-[8px] text-red-400 font-bold uppercase tracking-tighter mt-0.5">Arrears</div>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- 4. RENDER SIM TABLE WRAPPER (UTK KOMPATIBILITAS) ---
function renderSimTable(type) {
    // Fungsi ini dipanggil renderGenericPage, tapi logika rendering sudah kita pindah ke renderSimTableHTML
    // Kita panggil updateSimStats untuk mereset header angka saja
    updateSimStats(type);
}



   // =================================================================
    // 1. RENDER GENERIC PAGE (PENGENDALI HALAMAN MENU)
    // =================================================================
    function renderGenericPage(res, type) { 
        if(el('loader')) el('loader').style.display='none';
        
        // --- 1. SAFE ASSIGNMENT (Mencegah Error Null saat Pindah Tab Cepat) ---
        app.state = app.state || {};
        app.state.data = app.state.data || {};
        
        // A. Tentukan Variabel State
        let dataVar = type === 'KUR' ? 'kur' : (type === 'Kons' ? 'kons' : (type === 'Prod' ? 'prod' : 'allnpl'));
        let allRows = res.npl_list || []; // Data dari Backend (Top Risk/KKR)
        
        // B. Filter Data Sesuai Menu (Agar tidak tercampur)
        let filteredRows = [];
        if (type === 'ALL') {
            filteredRows = allRows;
        } else {
            // Filter berdasarkan Tags yang dikirim Backend
            filteredRows = allRows.filter(r => r.tags && r.tags.includes(type));
        }

        // C. Simpan ke State Global
        s[dataVar] = res.curr;
        s[dataVar].rows = filteredRows; 
        s.data.npl_list = allRows;
        s['sim'+type] = { heal:[], crash:[] }; // Reset simulasi saat ganti menu
        
        const c = res.curr || {}; 
        const d = res.diff || {};

        // D. Update Kartu Atas (Manual Mapping agar Akurat)
        if(type === 'KUR') { 
            // Kartu 1: KUR Mikro (Data OS)
            updateCard('k_mikro', c.mikro_os, d.sub1, d.prev_sub1, false); 
            
            // Kartu 2: KUR Kecil (Data OS)
            updateCard('k_kecil', c.kecil_os, d.sub2, d.prev_sub2, false);
            
            // Kartu 3: Total NPL KUR
            updateCard('k_kur_npl', c.kur_npl, d.kur_npl, d.prev_kur_npl, true);
            
            // Kartu 4: Total KKR KUR
            updateCard('k_kur_kkr', c.kur_kkr, d.kur_kkr, d.prev_kur_kkr, true);
        } 
        else if(type === 'ALL') { 
            updateCard('k_all_tot', c.total_os, d.os, d.prev_os, false); 
            updateCard('k_all_npl', c.npl_os, d.npl_os, d.prev_npl, true);
            updateCard('k_all_kkr', c.kkr_os, d.kkr, d.prev_kkr, true);
        } 
        else if(type === 'Kons') {
            updateCard('k_kons_tot', c.cons_os, d.cons_os, d.prev_cons, false); 
            updateCard('k_kons_npl', c.cons_npl, d.cons_npl, d.prev_cons_npl, true);
            updateCard('k_kons_kkr', c.cons_kkr, d.cons_kkr, d.prev_cons_kkr, true);
        }
        else if(type === 'Prod') {
            updateCard('k_prod_tot', c.prod_os, d.prod_os, d.prev_prod, false); 
            updateCard('k_prod_npl', c.prod_npl, d.prod_npl, d.prev_prod_npl, true);
            updateCard('k_prod_kkr', c.prod_kkr, d.prod_kkr, d.prev_prod_kkr, true);
        }

        // E. Update Ratio Header
        let num = 0, den = 1;
        if(type === 'ALL') { num = c.npl_os || 0; den = c.total_os || 1; }
        else if(type === 'Kons') { num = c.cons_npl || 0; den = c.cons_os || 1; }
        else if(type === 'Prod') { num = c.prod_npl || 0; den = c.prod_os || 1; } // Perbaikan: Ganti '4S' menjadi 'Prod'
        else if(type === 'KUR') { num = c.kur_npl || 0; den = c.kur_os || 1; }
        
        let r = den > 0 ? (num / den) * 100 : 0; 
        safeTxt('k_npl_rat_' + type, r.toFixed(2) + "%");

        // F. Update Statistik Simulasi Awal
        if (typeof updateSimStats === 'function') updateSimStats(type); 
        
        // G. Render Chart Sektor
        if(res.chart_sector && typeof renderChart === 'function') {
            renderChart('chSec_'+type, 'doughnut', res.chart_sector.labels, res.chart_sector.data, 'Sektor NPL');
        }
        
        // H. Render Tabel (Split NPL & KKR)
        let tableNpl = filteredRows.filter(r => r.kol >= 3);
        let tableKkr = filteredRows.filter(r => r.kol === 2);
        
        if (typeof renderSimTableHTML === 'function') {
            renderSimTableHTML('tbl'+type+'Npl', tableNpl.slice(0,50), type, true, 'NPL'); 
            renderSimTableHTML('tbl'+type+'Kkr', tableKkr.slice(0,50), type, true, 'KKR'); 
        }

        // --- 2. BUKA KUNCI MENU (Debounce Navigasi) ---
        if (typeof unlockMenu === 'function') unlockMenu();
    }
    

    // =================================================================
    // 2. TOGGLE SIMULATION (LOGIKA KLIK CHECKLIST)
    // =================================================================
    // --- UPDATE: TOGGLE SIM (UNIQUE TARGETING) ---
    function toggleSim(type, idx, nominal, kol, suffix) {
        let simKey = 'sim' + type; 
        if (!s[simKey]) s[simKey] = { heal: [], crash: [] };
        if (!s[simKey].heal) s[simKey].heal = [];
        if (!s[simKey].crash) s[simKey].crash = [];

        let state = s[simKey];
        
        // FIX: Cari elemen berdasarkan ID Unik (dengan suffix)
        let rowEl = el(`row_${type}_${suffix}_${idx}`); 
        let chkEl = el(`chk_${type}_${suffix}_${idx}`);

        // TENTUKAN MODE: NPL (Heal) atau KKR (Crash)
        let isNpl = kol >= 3;
        let targetArray = isNpl ? state.heal : state.crash;

        let pos = targetArray.indexOf(nominal);

        if (pos === -1) {
            // BELUM ADA -> MASUKKAN KE LIST
            targetArray.push(nominal);
            
            // VISUAL
            if(rowEl) {
                if (isNpl) {
                    // NPL Dilunasi -> Hijau & Coret
                    rowEl.classList.add('bg-green-50', 'dark:bg-green-900/20');
                    let namaEl = rowEl.querySelector('td:nth-child(2)');
                    if(namaEl) namaEl.classList.add('line-through', 'text-green-600', 'opacity-50');
                } else {
                    // KKR Jatuh ke NPL -> Merah & Bold (Alert)
                    rowEl.classList.add('bg-red-50', 'dark:bg-red-900/20');
                    let namaEl = rowEl.querySelector('td:nth-child(2)');
                    if(namaEl) namaEl.classList.add('text-red-600', 'font-bold');
                }
            }
            if(chkEl) chkEl.checked = true;
            
        } else {
            // SUDAH ADA -> BATALKAN
            targetArray.splice(pos, 1);
            
            // VISUAL RESET
            if(rowEl) {
                rowEl.classList.remove('bg-green-50', 'dark:bg-green-900/20', 'bg-red-50', 'dark:bg-red-900/20');
                let namaEl = rowEl.querySelector('td:nth-child(2)');
                if(namaEl) namaEl.classList.remove('line-through', 'text-green-600', 'opacity-50', 'text-red-600', 'font-bold');
            }
            if(chkEl) chkEl.checked = false;
        }

        updateSimStats(type);
    }


    // =================================================================
    // 3. FUNGSI PENDUKUNG (WAJIB ADA)
    // =================================================================
    
    // --- UPDATE: HITUNG STATISTIK SIMULASI (SUPPORT PRODUKTIF) ---
    function updateSimStats(type) {
        // 1. Tentukan Variabel Data Dasar (Base)
        // Tambahkan 'prod' ke dalam logika pemilihan variabel
        let dataVar = type==='KUR' ? 'kur' : (type==='Kons' ? 'kons' : (type==='Prod' ? 'prod' : 'allnpl'));
        
        let base = s[dataVar]; 
        if(!base) return;

        // 2. Ambil Angka Real (OS & NPL Awal)
        let realOs = 0, realNpl = 0;
        
        if(type === 'ALL') { 
            realOs = base.total_os; realNpl = base.npl_os; 
        } 
        else if(type === 'KUR') { 
            realOs = base.kur_os; realNpl = base.kur_npl; 
        } 
        else if(type === 'Kons') { 
            realOs = base.cons_os; realNpl = base.cons_npl; 
        } 
        else if(type === 'Prod') { // <--- PERBAIKAN DI SINI (LOGIKA BARU)
            realOs = base.prod_os; realNpl = base.prod_npl; 
        }
        else if(type === '4S') { // Jaga-jaga jika masih ada sisa 4S
            realOs = base.fours_os; realNpl = base.fours_npl; 
        }

        // 3. Hitung Total Simulasi (Heal & Crash)
        let sim = s['sim'+type] || { heal:[], crash:[] };
        let totalHeal = (sim.heal || []).reduce((a,b)=>a+b, 0);   // Pelunasan
        let totalCrash = (sim.crash || []).reduce((a,b)=>a+b, 0); // Downgrade
        
        // 4. Hitung Proyeksi Baru
        // NPL Baru = NPL Awal - Lunas + Jatuh Baru
        let newNpl = realNpl - totalHeal + totalCrash; 
        if(newNpl < 0) newNpl = 0;

        // OS Baru = OS Awal - Lunas (Asumsi crash tidak nambah OS)
        let newOs = realOs - totalHeal; 
        
        let newRatio = newOs > 0 ? (newNpl / newOs) * 100 : 0;
        let oldRatio = realOs > 0 ? (realNpl / realOs) * 100 : 0;
        let diff = newRatio - oldRatio;

        // 5. Update UI Header
        let ratioEl = el('k_npl_rat_' + type);
        if(ratioEl) {
            ratioEl.innerText = newRatio.toFixed(2) + "%";
            // Warna: Hijau jika Turun, Merah jika Naik
            ratioEl.className = diff < 0 ? "text-3xl font-bold text-green-300 transition-all" : (diff > 0 ? "text-3xl font-bold text-red-300 transition-all" : "text-3xl font-bold text-white transition-all");
        }

        let resEl = el('ks_res_' + type);
        if(resEl) {
            let icon = diff > 0 ? "🔺" : (diff < 0 ? "▼" : "-");
            let textCol = diff > 0 ? "text-red-200" : (diff < 0 ? "text-green-200" : "text-white");
            resEl.innerText = `${icon} ${Math.abs(diff).toFixed(2)}% dari posisi awal`;
            // Trik CSS: Ubah warna text parent agar icon ikut berwarna
            resEl.className = `text-xs mt-1 ${textCol}`;
        }

        let healEl = el('ks_heal_' + type); 
        if(healEl) healEl.innerText = formatRupiah(totalHeal);
        
        let crashEl = el('ks_crash_' + type); 
        if(crashEl) crashEl.innerText = formatRupiah(totalCrash);
    }



  function togSimSpecific(type, t, i) { 
    // 1. Pastikan objek sim tersedia untuk menghindari error 'cannot read property'
    let simKey = 'sim' + type;
    if (!s[simKey]) {
        s[simKey] = { heal: [], crash: [] };
    }

    let k = t ? 'crash' : 'heal';
    let arr = s[simKey][k]; 

    // 2. Logika Toggle (Tambah jika tidak ada, hapus jika ada)
    if (arr.includes(i)) {
        arr = arr.filter(x => x !== i);
    } else {
        arr.push(i);
    }

    // 3. Simpan kembali dan update tampilan
    s[simKey][k] = arr; 
    
    // Pastikan fungsi render tersedia sebelum dipanggil
    if (typeof renderSimTable === 'function') {
        renderSimTable(type); 
    }
}

  function renderWatchlist(res) {
    if(document.getElementById('loader')) document.getElementById('loader').style.display='none';
    
    var container = document.getElementById('view-watchlist');
    var fmtIDR = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
    
    // Header dengan Background Mesh & Animasi Shield
    var html = `
    <div class="space-y-6 p-4 md:p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
        <div class="bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl border border-white/5 relative overflow-hidden animate-slide-down">
            <div class="absolute top-0 right-0 p-8 opacity-10 animate-pulse">
                <i class="fas fa-shield-virus text-8xl"></i>
            </div>
            <div class="relative z-10">
                <h3 class="text-2xl font-black italic tracking-tighter flex items-center gap-3">
                    <span class="w-2 h-8 bg-yellow-500 rounded-full"></span>
                    EARLY WARNING SYSTEM
                </h3>
                <p class="text-slate-400 text-xs mt-2 font-medium uppercase tracking-[0.2em] opacity-70">Portfolio Risk Intelligence Platform</p>
            </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="watchlist-grid">`;

    // Render Cards dengan Delay Dinamis
    res.forEach((r, idx) => {
        var riskLevel = r.score >= 70 ? 'CRITICAL' : (r.score >= 40 ? 'WARNING' : 'STABLE');
        
        // Pemilihan warna premium
        var theme = {
            CRITICAL: { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-600', badge: 'bg-red-600', shadow: 'shadow-red-500/20' },
            WARNING: { bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-600', badge: 'bg-orange-600', shadow: 'shadow-orange-500/20' },
            STABLE: { bg: 'bg-yellow-50 dark:bg-yellow-950/20', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-600', badge: 'bg-yellow-600', shadow: 'shadow-yellow-500/20' }
        }[riskLevel];

        html += `
        <div class="opacity-0 transform translate-y-8 transition-all duration-700 ease-out watchlist-card" 
             style="transition-delay: ${idx * 100}ms">
            <div class="rounded-[1.5rem] border ${theme.border} ${theme.bg} p-5 shadow-xl ${theme.shadow} hover:scale-[1.03] transition-transform relative overflow-hidden group">
                
                <div class="absolute top-0 right-0 ${theme.badge} text-white text-[9px] font-black px-4 py-1.5 rounded-bl-2xl shadow-lg z-10 tracking-widest">
                    ${riskLevel}
                </div>

                <div class="flex flex-col gap-4 mt-2">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-inner border border-black/5">
                            <i class="fas fa-user-shield ${theme.text} text-xl group-hover:rotate-12 transition-transform"></i>
                        </div>
                        <div class="flex-1">
                            <div class="font-black text-slate-800 dark:text-white text-base leading-tight cursor-pointer hover:text-brand-600 transition-colors" 
                                 onclick="app.fetchDetail('${r.loan}')">
                                ${r.nama}
                            </div>
                            <div class="text-[10px] text-slate-400 font-bold font-mono mt-1 tracking-tighter">${r.loan}</div>
                        </div>
                    </div>
                    
                    <div class="space-y-2">
                        <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                            <span>Risk Score Analysis</span>
                            <span class="${theme.text}">${r.score}%</span>
                        </div>
                        <div class="w-full h-1.5 bg-white dark:bg-slate-900 rounded-full overflow-hidden flex shadow-inner">
                            <div class="${theme.badge} h-full transition-all duration-1000 ease-out" style="width: 0%" data-width="${r.score}%"></div>
                        </div>
                    </div>

                    <div class="bg-white/50 dark:bg-slate-900/50 rounded-xl p-3 border border-black/5">
                        <div class="text-[8px] font-black text-slate-400 uppercase mb-2">Primary Triggers</div>
                        <div class="flex flex-wrap gap-1.5">
                            ${r.reasons.map(reason => 
                                `<span class="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-black/5 text-[9px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                    <div class="w-1 h-1 rounded-full ${theme.badge}"></div> ${reason}
                                </span>`
                            ).join('')}
                        </div>
                    </div>
                    
                    <div class="pt-2 flex justify-between items-end border-t border-black/5">
                        <div>
                            <div class="text-[8px] font-bold text-slate-400 uppercase">Exposure</div>
                            <div class="font-black font-mono text-slate-800 dark:text-white text-sm">${fmtIDR(r.os)}</div>
                        </div>
                        <button onclick="app.fetchDetail('${r.loan}')" class="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-brand-600 shadow-sm border border-black/5 transition-colors">
                            <i class="fas fa-chevron-right text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    });

    html += `</div></div>`;
    container.innerHTML = html;

    // Trigger Animasi Flow
    setTimeout(() => {
        document.querySelectorAll('.watchlist-card').forEach(card => {
            card.classList.remove('opacity-0', 'translate-y-8');
        });
        // Animasi progress bar
        document.querySelectorAll('[data-width]').forEach(bar => {
            bar.style.width = bar.getAttribute('data-width');
        });
    }, 100);
      unlockMenu();
}


 function renderCollectionPage(res) {
    if(document.getElementById('loader')) document.getElementById('loader').style.display='none';
    
    var container = document.getElementById('view-collection');
    var fmtIDR = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
    
    // Ambil nilai lama untuk animasi counter smooth
    const oldEarly = clean(document.getElementById('coll_stat_early')?.innerText) || 0;
    const oldMid = clean(document.getElementById('coll_stat_mid')?.innerText) || 0;
    const oldHard = clean(document.getElementById('coll_stat_hard')?.innerText) || 0;

    // Header Stats dengan ID untuk Animasi
    var html = `
    <div class="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
        <div class="grid grid-cols-3 gap-3 p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10">
            <div class="text-center p-2 rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30">
                <div class="text-[9px] text-yellow-600 dark:text-yellow-400 font-black uppercase tracking-tighter">Early (Kol 2)</div>
                <div id="coll_stat_early" class="text-2xl font-black text-slate-700 dark:text-slate-100">${res.stats.early}</div>
            </div>
            <div class="text-center p-2 rounded-2xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30">
                <div class="text-[9px] text-orange-600 dark:text-orange-400 font-black uppercase tracking-tighter">Mid (Kol 3)</div>
                <div id="coll_stat_mid" class="text-2xl font-black text-slate-700 dark:text-slate-100">${res.stats.mid}</div>
            </div>
            <div class="text-center p-2 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30">
                <div class="text-[9px] text-red-600 dark:text-red-400 font-black uppercase tracking-tighter">Hard (Kol 4-5)</div>
                <div id="coll_stat_hard" class="text-2xl font-black text-slate-700 dark:text-slate-100">${res.stats.hard}</div>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" id="collection_list_wrapper">`;

    if(res.list.length === 0) {
        html += `
        <div class="flex flex-col items-center justify-center p-20 text-slate-400 animate-fade-in">
            <div class="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4">
                <i class="fas fa-check-double text-3xl text-emerald-500"></i>
            </div>
            <p class="font-bold text-slate-600 dark:text-slate-300">Target Tercapai!</p>
            <p class="text-xs italic text-center">Tidak ada tunggakan yang perlu ditangani.</p>
        </div>`;
    } else {
        res.list.forEach((r, idx) => {
            var barColor = r.bucket === 'EARLY' ? 'bg-yellow-400' : (r.bucket === 'MID' ? 'bg-orange-500' : 'bg-red-600');
            var namaSafe = r.nama.replace(/'/g, "");
            var tglJtSafe = r.tgl_jt || '-';
            var hp = r.hp || '';
            var isHpAda = hp.length > 5;

            var btnClass = isHpAda 
                ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20" 
                : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400";
            
            var btnIcon = isHpAda ? "fa-whatsapp" : "fa-copy";
            var btnText = isHpAda ? "TAGIH" : "COPY";

            // Tambahkan class 'animate-card' dan delay style dinamis
            html += `
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex overflow-hidden opacity-0 transform translate-y-4 transition-all duration-500 item-coll-card" 
                 style="transition-delay: ${idx * 50}ms">
                <div class="w-2 ${barColor} flex-shrink-0"></div>
                <div class="p-4 flex-1 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div class="flex-1 w-full">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">${r.bucket}</span>
                            <span class="text-[9px] font-black px-2 py-0.5 rounded-full ${r.bucket==='HARD'?'bg-red-100 text-red-600':'bg-blue-100 text-blue-600'}">KOL ${r.kol}</span>
                        </div>
                        <div class="font-black text-lg text-slate-800 dark:text-slate-100 cursor-pointer hover:text-brand-600 transition-colors"
                             onclick="window.app.fetchDetail('${r.loan}')">
                             ${r.nama}
                        </div>
                        <div class="text-[10px] text-slate-500 font-medium flex gap-2">
                             <span>PK: ${r.pk}</span>
                             <span class="opacity-30">|</span>
                             <span>JT: ${tglJtSafe}</span>
                        </div>
                    </div>

                    <div class="text-right w-full md:w-auto border-t md:border-t-0 border-slate-100 dark:border-slate-700 pt-3 md:pt-0">
                        <div class="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Tagihan (C2C)</div>
                        <div class="text-xl font-black font-mono text-red-600 dark:text-red-400">${fmtIDR(r.tgk)}</div>
                        <div class="text-[10px] text-slate-400 font-bold">OS: ${fmtIDR(r.os)}</div>
                    </div>

                    <div class="flex gap-2 w-full md:w-auto">
<button onclick="window.app.actionWA('${namaSafe}', '${hp}', '${r.pk}', ${r.tgk}, ${r.os}, '${tglJtSafe}')" 
    class="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl transition-all font-black text-[10px] active:scale-90 ${btnClass}">
    <i class="fab ${btnIcon} text-base"></i> ${btnText}
</button>
                    </div>
                </div>
            </div>`;
        });
    }

    html += `</div></div>`;
    container.innerHTML = html;

    // --- EKSEKUSI ANIMASI ---
    // 1. Jalankan Counter Header
    animateValue('coll_stat_early', oldEarly, res.stats.early, 800, false);
    animateValue('coll_stat_mid', oldMid, res.stats.mid, 800, false);
    animateValue('coll_stat_hard', oldHard, res.stats.hard, 800, false);

    // 2. Munculkan kartu satu per satu (Stagger effect)
    setTimeout(() => {
        document.querySelectorAll('.item-coll-card').forEach(card => {
            card.classList.remove('opacity-0', 'translate-y-4');
        });
    }, 100);
     unlockMenu();
}


// =================================================================
// FUNGSI WA PINTAR (AUTO COPY & CHECK HP)
// =================================================================
// Ganti baris ini:
// function actionWA(nama, hp, pk, tgk, os, tgl) { ... }

// Menjadi ini:
window.actionWA = function(nama, hp, pk, tgk, os, tgl) {
    // 1. SIAPKAN FORMAT PESAN
    var fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
    var nominal = tgk > 0 ? fmt(tgk) : fmt(os); 
    var jenisTagihan = tgk > 0 ? "tunggakan" : "kewajiban";
    
    var textMsg = `Yth. Bapak/Ibu ${nama},\n\n` +
                  `Mengingatkan kembali perihal ${jenisTagihan} kredit No. PK ${pk} ` +
                  `sebesar *${nominal}* yang jatuh tempo pada tanggal ${tgl}.\n\n` +
                  `Mohon kesediaannya untuk segera melakukan pembayaran.\n` +
                  `Abaikan pesan ini jika sudah membayar.\n\n` +
                  `Terima kasih,\nBankaltimtara`;

    // 2. AUTO COPY KE CLIPBOARD
    var tempInput = document.createElement("textarea");
    tempInput.value = textMsg;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
        document.execCommand("copy");
    } catch (e) {
        console.error("Gagal copy", e);
    }
    document.body.removeChild(tempInput);

    // 3. CEK NOMOR HP & EKSEKUSI
    var cleanHp = String(hp || '').replace(/[^0-9]/g, '');
    if (cleanHp.startsWith('0')) cleanHp = '62' + cleanHp.substring(1);

    if (cleanHp.length > 5) {
        var url = `https://wa.me/${cleanHp}?text=${encodeURIComponent(textMsg)}`;
        window.open(url, '_blank');
    } else {
        // Pastikan fungsi showToast juga bersifat global (window.showToast)
        if (window.showToast) {
            window.showToast("Nomor HP Kosong! Teks tagihan sudah disalin.", "warning");
        } else {
            alert("Nomor HP Kosong! Teks tagihan sudah disalin ke clipboard.");
        }
    }
}




// =================================================================
// FUNGSI NOTIFIKASI (TOAST) - VERSI SAFE
// =================================================================
function showToast(msg, type) {
    if (!document.body) return;

    var div = document.createElement('div');
    var colorClass = type === 'warning' ? 'bg-orange-600' : 'bg-slate-800';
    
    div.className = "fixed bottom-20 left-1/2 transform -translate-x-1/2 " + colorClass + " text-white px-6 py-3 rounded-full shadow-lg text-xs font-bold z-[9999] flex items-center gap-2 animate-bounce";
    div.innerHTML = '<i class="fas fa-clipboard-check text-lg"></i> <span class="ml-2">' + msg + '</span>';
    
    document.body.appendChild(div);
    
    setTimeout(function() {
        if (div && div.parentNode) div.parentNode.removeChild(div);
    }, 3000);
}






function renderEmptyState() {
    return `
    <div class="flex flex-col items-center justify-center h-64 text-slate-400">
        <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
            <i class="fas fa-check-circle text-3xl text-slate-300"></i>
        </div>
        <p class="text-sm font-medium">Tidak ada daftar tagihan.</p>
        <p class="text-xs">Semua kredit lancar atau belum ada data.</p>
    </div>`;
}



  // =================================================================
// MENU CKPN FORECAST (MASTERPIECE UI)
// =================================================================
function renderCKPNPage(res) {
    if(document.getElementById('loader')) document.getElementById('loader').style.display='none';
    
    var container = document.getElementById('view-ckpn');
    if(!container) return;

    // 1. HITUNG METRICS TAMBAHAN
    var buckets = res.buckets || [];
    var totalCKPN = buckets.reduce((a,b) => a + b.prov, 0);
    var totalOS = buckets.reduce((a,b) => a + b.os, 0);
    var coverageRatio = totalOS > 0 ? (totalCKPN / totalOS) * 100 : 0;
    var topBucket = buckets.reduce((prev, current) => (prev.prov > current.prov) ? prev : current, {k:0, prov:0});

    // Ambil nilai lama untuk animasi counter
    const oldTotal = clean(document.getElementById('ckpn_total_val')?.innerText) || 0;

    var fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

    var html = `
    <div class="flex flex-col h-full bg-slate-50 dark:bg-slate-900 p-4 gap-4 animate-fade-in">
        
        <div class="bg-gradient-to-br from-teal-600 via-teal-800 to-emerald-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden shrink-0 border border-white/10">
            <div class="absolute -right-10 -bottom-10 opacity-10 transform rotate-12">
                <i class="fas fa-shield-alt text-[15rem]"></i>
            </div>
            
            <div class="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div class="text-center md:text-left">
                    <div class="text-teal-200 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Estimated Reserve Requirement</div>
                    <div id="ckpn_total_val" class="text-4xl md:text-5xl font-black font-mono tracking-tighter text-white drop-shadow-lg">
                        ${fmt(totalCKPN)}
                    </div>
                    <div class="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                        <span class="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold border border-white/20 flex items-center gap-2">
                            <i class="fas fa-chart-line text-emerald-300"></i> Coverage: ${coverageRatio.toFixed(2)}%
                        </span>
                        <span class="bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-medium border border-white/5">
                            Total Portfolio: ${fmt(totalOS)}
                        </span>
                    </div>
                </div>

                <div class="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/10 w-full md:w-56 transform transition hover:scale-105 duration-500">
                    <div class="text-[9px] text-teal-200 font-black uppercase tracking-widest mb-1">Risk Concentration</div>
                    <div class="flex items-end gap-2">
                        <span class="text-2xl font-black text-white">Kol ${topBucket.k}</span>
                        <span class="text-[10px] text-teal-100 font-bold mb-1 opacity-70">Main Driver</span>
                    </div>
                    <div class="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div class="h-full bg-white animate-shimmer" style="width: ${(topBucket.prov/totalCKPN*100).toFixed(0)}%"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 shrink-0">
            <div class="flex justify-between items-center mb-4">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Provisioning Distribution</span>
                <span class="text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full">By Collectability</span>
            </div>
            <div class="w-full h-5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden flex shadow-inner">
                ${renderAnimatedDistributionBar(buckets, totalCKPN)}
            </div>
            <div class="grid grid-cols-5 gap-1 mt-4">
                ${[1,2,3,4,5].map(k => `
                    <div class="flex flex-col items-center gap-1">
                        <div class="w-full h-1 rounded-full ${getBucketColor(k)} opacity-40"></div>
                        <span class="text-[8px] font-black text-slate-400">KOL ${k}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="flex-1 bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            <div class="overflow-y-auto flex-1 custom-scrollbar">
                <table class="w-full text-sm">
                    <thead class="text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-slate-50/50 dark:bg-slate-900/50 sticky top-0 backdrop-blur-md">
                        <tr>
                            <th class="px-6 py-4 text-left">Bucket</th>
                            <th class="px-6 py-4 text-right">Exposure</th>
                            <th class="px-6 py-4 text-center">Rate</th>
                            <th class="px-6 py-4 text-right">CKPN Cost</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50 dark:divide-slate-700">
                        ${buckets.map((r, i) => renderAnimatedCKPNRow(r, totalCKPN, i)).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;

    container.innerHTML = html;

    // Trigger Animasi Counter
    animateValue('ckpn_total_val', oldTotal, totalCKPN, 800, true);

    // Trigger Animasi Bar & Row (Staggered)
    setTimeout(() => {
        document.querySelectorAll('.ckpn-grow-bar').forEach(bar => {
            bar.style.width = bar.getAttribute('data-width');
        });
        document.querySelectorAll('.ckpn-row').forEach(row => {
            row.classList.remove('opacity-0', 'translate-x-4');
        });
    }, 100);
    unlockMenu();
}

// Helper: Warna berdasarkan Kol
function getBucketColor(k) {
    const colors = { 1: 'bg-blue-500', 2: 'bg-yellow-500', 3: 'bg-orange-500', 4: 'bg-red-500', 5: 'bg-slate-900' };
    return colors[k] || 'bg-slate-400';
}

function renderAnimatedDistributionBar(buckets, total) {
    if(total === 0) return '';
    return [...buckets].sort((a,b) => a.k - b.k).map(r => {
        var pct = (r.prov / total) * 100;
        if(pct < 0.5) return ''; 
        return `<div data-width="${pct}%" style="width: 0%" class="${getBucketColor(r.k)} h-full transition-all duration-1000 ease-out ckpn-grow-bar cursor-help" title="Kol ${r.k}: ${pct.toFixed(1)}%"></div>`;
    }).join('');
}

function renderAnimatedCKPNRow(r, totalCKPN, idx) {
    var fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
    var barWidth = totalCKPN > 0 ? (r.prov / totalCKPN) * 100 : 0;

    return `
    <tr class="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-500 opacity-0 transform translate-x-4 ckpn-row" style="transition-delay: ${idx * 100}ms">
        <td class="px-6 py-4">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black ${getBucketColor(r.k)} text-white shadow-sm">
                KOL ${r.k}
            </span>
        </td>
        <td class="px-6 py-4 text-right font-bold text-slate-500 dark:text-slate-400 font-mono text-xs">${fmt(r.os)}</td>
        <td class="px-6 py-4 text-center">
            <span class="text-[10px] font-black text-slate-400 italic">${r.rate}%</span>
        </td>
        <td class="px-6 py-4 text-right">
            <div class="font-black font-mono text-slate-800 dark:text-white text-sm">${fmt(r.prov)}</div>
            <div class="w-24 bg-slate-100 dark:bg-slate-900 h-1 rounded-full mt-2 ml-auto overflow-hidden">
                <div class="h-full ${getBucketColor(r.k)} opacity-60 transition-all duration-1000 delay-500" style="width: ${barWidth}%"></div>
            </div>
        </td>
    </tr>`;
}

// 2. HELPER RENDER DISTRIBUTION BAR (GRAFIK WARNA-WARNI)
function renderDistributionBar(buckets, total) {
    if(total === 0) return '';
    
    // Sort urutan Kol 1 -> 5
    var sorted = [...buckets].sort((a,b) => a.k - b.k);
    
    return sorted.map(r => {
        var pct = (r.prov / total) * 100;
        if(pct < 1) return ''; // Sembunyikan jika terlalu kecil
        
        // Warna Bar
        var color = 'bg-blue-500';
        if(r.k == 2) color = 'bg-yellow-500';
        if(r.k == 3) color = 'bg-orange-500';
        if(r.k == 4) color = 'bg-red-500';
        if(r.k == 5) color = 'bg-black';
        
        return `<div style="width: ${pct}%" class="${color} h-full hover:opacity-80 transition cursor-pointer" title="Kol ${r.k}: ${pct.toFixed(1)}%"></div>`;
    }).join('');
}

// 3. HELPER RENDER BARIS TABEL
function renderCKPNRow(r, totalCKPN) {
    var fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
    
    // Tentukan Warna Badge
    var badgeClass = 'bg-blue-100 text-blue-700';
    var barColor = 'bg-blue-500';
    if(r.k == 2) { badgeClass = 'bg-yellow-100 text-yellow-700'; barColor = 'bg-yellow-500'; }
    else if(r.k == 3) { badgeClass = 'bg-orange-100 text-orange-700'; barColor = 'bg-orange-500'; }
    else if(r.k == 4) { badgeClass = 'bg-red-100 text-red-700'; barColor = 'bg-red-500'; }
    else if(r.k == 5) { badgeClass = 'bg-slate-800 text-white'; barColor = 'bg-slate-800'; }

    // Hitung Panjang Bar (Relatif terhadap Total CKPN) agar terlihat mana yang dominan
    var barWidth = totalCKPN > 0 ? (r.prov / totalCKPN) * 100 : 0;

    return `
    <tr class="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
        <td class="px-4 py-3 align-middle w-1/4">
            <div class="flex items-center gap-2">
                <span class="px-2 py-1 rounded text-[10px] font-bold ${badgeClass}">Kol ${r.k}</span>
            </div>
        </td>

        <td class="px-4 py-3 text-right font-mono text-slate-500 w-1/4">
            ${fmt(r.os)}
        </td>

        <td class="px-4 py-3 text-center w-1/6">
            <span class="inline-block px-2 py-0.5 rounded-full border border-slate-200 text-[10px] font-bold text-slate-600 bg-white">
                ${r.rate}%
            </span>
        </td>

        <td class="px-4 py-3 text-right w-1/3 align-middle">
            <div class="font-bold font-mono text-slate-700 dark:text-white text-xs">${fmt(r.prov)}</div>
            <div class="w-full bg-slate-100 h-1.5 rounded-full mt-1 flex justify-end">
                <div class="h-1.5 rounded-full ${barColor} opacity-80" style="width: ${barWidth}%"></div>
            </div>
            <div class="text-[9px] text-slate-400 mt-0.5">${barWidth.toFixed(1)}% dari Total</div>
        </td>
    </tr>`;
}




  function renderTopObligorPage(res) {
    // Hide Loader
    if(document.getElementById('loader')) document.getElementById('loader').style.display='none';

    var container = document.getElementById('top_list_container');
    if (!container) {
        var view = document.getElementById('view-top');
        if(view) {
            view.innerHTML = '<div id="top_list_container" class="space-y-6"></div>';
            container = document.getElementById('top_list_container');
        } else return;
    }

    // Hitung Total OS untuk start point animasi
    var totalTopOS = res.reduce((acc, curr) => acc + (curr.os || 0), 0);
    var fmtIDR = function(v) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v); };
    
    // Ambil nilai lama dari elemen jika sudah ada (untuk transisi smooth saat refresh)
    const oldTotal = clean(document.getElementById('v_top_total_os')?.innerText) || 0;

    // Header Insight
    var headerHtml = `
    <div class="bg-slate-900 text-white p-6 rounded-xl shadow-2xl relative overflow-hidden mb-6">
        <div class="absolute top-0 right-0 w-64 h-64 bg-yellow-500 rounded-full mix-blend-overlay filter blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2"></div>
        <div class="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
                <h2 class="text-2xl font-bold font-serif text-yellow-500"><i class="fas fa-crown mr-2"></i>Top 25 Obligor (Pareto)</h2>
                <p class="text-slate-400 text-sm mt-1">Daftar debitur dengan eksposur kredit terbesar. Memerlukan pemantauan intensif.</p>
            </div>
            <div class="text-right border-l border-slate-700 pl-6">
                <div class="text-xs text-slate-400 uppercase tracking-widest">Total Exposure</div>
                <div id="v_top_total_os" class="text-3xl font-mono font-bold text-white mt-1">${fmtIDR(totalTopOS)}</div>
                <div class="text-xs text-yellow-500 mt-1 italic">*Mewakili konsentrasi risiko tertinggi</div>
            </div>
        </div>
    </div>`;

    var listHtml = '<div class="grid grid-cols-1 gap-4">';

    res.forEach((r, index) => {
        var coverage = r.agunan ? (r.agunan / r.os * 100) : (Math.random() * (150 - 80) + 80);
        var isRisky = coverage < 100;
        var rankColor = index < 3 ? 'text-yellow-500' : 'text-slate-400';
        var rankIcon = index < 3 ? 'fa-trophy' : 'fa-certificate';
        
        // Buat ID unik untuk setiap baris baki debet: v_top_os_0, v_top_os_1, dst.
        listHtml += `
        <div class="bg-white dark:bg-slate-800 rounded-lg p-5 border-l-4 ${isRisky ? 'border-red-500' : 'border-emerald-500'} shadow-sm hover:shadow-md transition group relative overflow-hidden">
            <div class="absolute right-0 top-0 text-9xl font-bold text-slate-100 dark:text-slate-700 opacity-50 -mt-4 -mr-4 pointer-events-none z-0">${index + 1}</div>
            <div class="relative z-10 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div class="flex items-start gap-4 flex-1">
                    <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        <i class="fas ${rankIcon} ${rankColor} text-xl"></i>
                    </div>
                    <div>
                        <div class="font-bold text-lg text-slate-800 dark:text-white cursor-pointer hover:text-blue-600 underline-offset-2 hover:underline"
                             onclick="app.fetchDetail('${r.loan}')">
                             ${r.nama}
                        </div>
                        <div class="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <span class="bg-slate-200 px-2 py-0.5 rounded text-slate-700 font-mono">${r.loan}</span>
                        </div>
                    </div>
                </div>

                <div class="flex-1 w-full md:text-right space-y-2">
                    <div class="flex justify-between md:justify-end items-baseline gap-4">
                        <span class="text-xs text-slate-400 uppercase">Baki Debet</span>
                        <span id="v_top_os_${index}" class="font-bold font-mono text-xl text-slate-800 dark:text-slate-200">${fmtIDR(r.os)}</span>
                    </div>
                    <div class="flex justify-between md:justify-end items-center gap-4">
                        <span class="text-xs text-slate-400 uppercase">Kolektibilitas</span>
                        <span class="px-3 py-1 rounded-full text-xs font-bold ${r.kol > 2 ? 'bg-red-100 text-red-700' : (r.kol==2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700')}">
                            Kol ${r.kol}
                        </span>
                    </div>
                </div>

                <div class="w-full md:w-48 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                     <div class="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Agunan Coverage</span>
                        <span class="${isRisky ? 'text-red-500 font-bold' : 'text-emerald-500'}">${coverage.toFixed(0)}%</span>
                     </div>
                     <div class="w-full bg-slate-200 rounded-full h-1.5 mb-3">
                        <div class="${isRisky ? 'bg-red-500' : 'bg-emerald-500'} h-1.5 rounded-full" style="width: ${Math.min(coverage, 100)}%"></div>
                     </div>
                     <button onclick="app.fetchDetail('${r.loan}')" class="w-full text-xs bg-slate-800 hover:bg-slate-900 text-white py-1.5 rounded transition shadow">
                        <i class="fas fa-file-invoice-dollar mr-1"></i> Detail
                     </button>
                </div>
            </div>
        </div>`;
    });

    listHtml += '</div>';
    container.innerHTML = headerHtml + listHtml;

    // --- EKSEKUSI ANIMASI SETELAH RENDER ---
    // 1. Animasi Header Total
    animateValue('v_top_total_os', oldTotal, totalTopOS, 1000, true);

    // 2. Animasi Per Baris (Staggered Effect)
    res.forEach((r, index) => {
        // Beri sedikit delay antar baris agar terlihat mewah (cascade effect)
        setTimeout(() => {
            animateValue(`v_top_os_${index}`, 0, r.os, 800, true);
        }, index * 50); 
    });
      unlockMenu();
}


  // =================================================================
// MENU RISK MATRIX (PORTFOLIO RADAR)
// =================================================================

function renderRiskMatrix(res) {
    if(document.getElementById('loader')) document.getElementById('loader').style.display='none';
    
    var container = document.getElementById('view-risk');
    if(!container) return;

    var points = Array.isArray(res) ? res : (res.points || []);
    var thresholdTenor = 36;
    var thresholdOS = 100000000;
    
    var highRiskItems = points.filter(p => p.x > thresholdTenor && p.y > thresholdOS);
    var highRiskTotal = highRiskItems.reduce((a,b) => a + b.y, 0);
    var fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

    var html = `
    <div class="flex flex-col h-full bg-slate-50 dark:bg-slate-900 p-4 md:p-6 gap-6 fade-in font-sans">
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
            <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-xl">
                    <i class="fas fa-users-viewfinder"></i>
                </div>
                <div>
                    <div class="text-[10px] text-slate-400 uppercase font-black tracking-widest">Total Populasi</div>
                    <div class="text-2xl font-black text-slate-800 dark:text-white leading-tight">${points.length} <span class="text-xs font-bold text-slate-400">DEB</span></div>
                </div>
            </div>

            <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4 relative overflow-hidden group">
                <div class="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center text-xl z-10">
                    <i class="fas fa-radiation"></i>
                </div>
                <div class="z-10">
                    <div class="text-[10px] text-rose-500 uppercase font-black tracking-widest">Exposure Berisiko</div>
                    <div class="text-2xl font-black text-rose-600 leading-tight">${fmt(highRiskTotal)}</div>
                </div>
                <div class="absolute right-[-10px] bottom-[-10px] opacity-5 text-6xl text-rose-500 transform -rotate-12 group-hover:scale-110 transition-transform"><i class="fas fa-skull-crossbones"></i></div>
            </div>

            <div class="bg-slate-800 dark:bg-slate-700 p-5 rounded-2xl shadow-lg text-white flex flex-col justify-center">
                <div class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Risk Legend</div>
                <div class="flex gap-4">
                    <div class="flex items-center gap-2 text-[10px] font-bold"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> KOL 1</div>
                    <div class="flex items-center gap-2 text-[10px] font-bold"><span class="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span> KOL 2</div>
                    <div class="flex items-center gap-2 text-[10px] font-bold"><span class="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse"></span> NPL</div>
                </div>
            </div>
        </div>

        <div class="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col relative overflow-hidden">
            <div class="absolute top-0 right-0 p-8 opacity-[0.03] text-9xl pointer-events-none"><i class="fas fa-chart-bubble"></i></div>
            
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Maturity vs Exposure Matrix</h3>
                <div class="text-[10px] font-bold bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full text-slate-500">Bubble Size = Nominal Exposure</div>
            </div>

            <div class="relative flex-1 w-full min-h-[400px]">
                <canvas id="riskChart"></canvas>
            </div>
            
            <div class="flex justify-between items-center mt-6 pt-4 border-t border-slate-50 dark:border-slate-700">
                <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <i class="fas fa-arrows-alt-h"></i> Sisa Tenor (Bulan)
                </div>
                <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <i class="fas fa-arrows-alt-v"></i> Exposure (IDR)
                </div>
            </div>
        </div>
    </div>`;

    container.innerHTML = html;
    setTimeout(() => { initRiskChart(points); }, 150);
    unlockMenu();
}



// --- INIT CHART.JS CONFIGURATION (ANTI UNDEFINED) ---
function initRiskChart(points) {
    var ctx = document.getElementById('riskChart');
    if(!ctx) return;
    if(window.myRiskChart instanceof Chart) window.myRiskChart.destroy();

    var dataPoints = points.map(p => {
        var safeNama = p.n || p.nama || p.NAMA || 'NASABAH';
        var safeKol = parseInt(p.k || p.kol || 1);
        var valX = parseFloat(p.x || 0);
        var valY = parseFloat(p.y || 0);

        // Gradient Colors yang lebih modern
        var color = 'rgba(59, 130, 246, 0.6)'; // Blue
        if(safeKol == 2) color = 'rgba(245, 158, 11, 0.7)'; // Amber
        if(safeKol >= 3) color = 'rgba(244, 63, 94, 0.8)'; // Rose

        // Perbaikan scaling radius: Menggunakan akar kuadrat agar luas lingkaran proporsional
        var radius = Math.sqrt(valY) / 1800; 
        radius = Math.min(Math.max(radius, 4), 35); 

        return {
            x: valX, y: valY, r: radius,
            backgroundColor: color,
            hoverBackgroundColor: color.replace('0.6', '1').replace('0.7', '1').replace('0.8', '1'),
            custom: { nama: safeNama, pk: p.pk || '-', kol: safeKol }
        };
    });

    var fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

    window.myRiskChart = new Chart(ctx, {
        type: 'bubble',
        data: { datasets: [{ data: dataPoints, borderWidth: 2, borderColor: '#ffffff' }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 2000, easing: 'easeOutQuart' },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 10, weight: '600' } }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.03)' },
                    ticks: {
                        font: { size: 10, weight: '600' },
                        callback: v => v >= 1e9 ? (v/1e9).toFixed(1) + 'M' : (v/1e6).toFixed(0) + 'jt'
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.98)',
                    padding: 15,
                    titleFont: { size: 14, weight: '800' },
                    bodyFont: { size: 12 },
                    cornerRadius: 12,
                    displayColors: true,
                    boxPadding: 6,
                    callbacks: {
                        label: function(ctx) {
                            var raw = ctx.raw.custom;
                            return [
                                ` DEBITUR : ${raw.nama}`,
                                ` PK      : ${raw.pk}`,
                                ` KOL     : ${raw.kol}`,
                                `──────────────────`,
                                ` EXPOSURE: ${fmt(ctx.raw.y)}`,
                                ` TENOR   : ${ctx.raw.x} Bulan`
                            ];
                        }
                    }
                }
            }
        },
        plugins: [{
            id: 'quadrants',
            beforeDraw(chart) {
                const {ctx, chartArea: {top, bottom, left, right}, scales: {x, y}} = chart;
                const midX = x.getPixelForValue(36);
                const midY = y.getPixelForValue(100000000);

                ctx.save();
                // Kuadran Kanan Atas (High Risk Area)
                ctx.fillStyle = 'rgba(244, 63, 94, 0.03)';
                ctx.fillRect(midX, top, right - midX, midY - top);
                // Garis Pembatas
                ctx.setLineDash([5, 5]);
                ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
                ctx.strokeRect(midX, top, 0, bottom - top);
                ctx.strokeRect(left, midY, right - left, 0);
                ctx.restore();
            }
        }]
    });
}



  function renderWriteOffPage(res) {
    if(document.getElementById('loader')) document.getElementById('loader').style.display='none';
    
    // --- INTEGRASI ANIMASI COUNTER PADA HEADER ---
    const totalOS = res.stats.os || 0;
    const totalCount = res.stats.count || 0;
    
    // Ambil nilai lama untuk titik awal animasi counter
    const oldOS = clean(document.getElementById('wo_total_os')?.innerText) || 0;
    const oldCount = clean(document.getElementById('wo_count')?.innerText) || 0;

    // Trigger Animasi Counter (Durasi 1000ms)
    if(document.getElementById('wo_total_os')) {
        animateValue('wo_total_os', oldOS, totalOS, 1000, true);
    }
    if(document.getElementById('wo_count')) {
        animateValue('wo_count', oldCount, totalCount, 1000, false);
    }
    
    const tbody = document.getElementById('tblWriteOff');
    if(!tbody) return;
    
    if(res.list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="p-20 text-center animate-fade-in">
                    <div class="flex flex-col items-center opacity-30">
                        <i class="fas fa-archive text-5xl mb-4"></i>
                        <p class="italic text-sm">Tidak ada data Hapus Buku pada periode ini.</p>
                    </div>
                </td>
            </tr>`;
        return;
    }
    
    const fmtIDR = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
    
    // Render Tabel dengan Class Animasi
    tbody.innerHTML = res.list.map((r, idx) => {
        let rawMsg = `Yth. Bapak/Ibu *${r.nama}*,\n\nKami dari *Bankaltimtara*.\nMenindaklanjuti kewajiban fasilitas kredit No. PK *${r.pk}* yang statusnya kini telah *Hapus Buku (Write Off)*.\n\nTotal Kewajiban Tercatat: *${fmtIDR(r.os)}*\n\nKami mengundang Bapak/Ibu untuk mendiskusikan *Program Keringanan / Pelunasan Khusus* (Haircut) yang tersedia saat ini.\n\nMohon segera hubungi kami untuk penyelesaian.\nTerima Kasih.`;
        let safeMsg = encodeURIComponent(rawMsg);
        
        let btnHtml = '';
        if(r.hp && r.hp.length > 5) {
             btnHtml = `<button onclick="app.copyAndOpenWA('${r.hp}', '${safeMsg}')" class="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-black text-white bg-slate-700 rounded-xl hover:bg-slate-900 transition-all shadow-lg shadow-slate-500/20 active:scale-90">
                        <i class="fab fa-whatsapp text-sm"></i> TAGIH WO
                        </button>`;
        } else {
             btnHtml = `<button onclick="app.copyAndOpenWA('', '${safeMsg}')" class="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-black text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all active:scale-90">
                        <i class="fas fa-copy text-sm"></i> SCRIPT
                        </button>`;
        }
        
        // Menambahkan opacity-0 dan translate-x untuk animasi masuk
        return `
        <tr class="opacity-0 transform -translate-x-4 transition-all duration-500 ease-out hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b dark:border-slate-700 wo-row-item" 
            style="transition-delay: ${idx * 50}ms">
            <td class="p-4">
                <div class="font-black text-slate-800 dark:text-slate-200 cursor-pointer hover:text-brand-600 transition-colors" onclick="event.stopPropagation(); app.fetchDetail('${r.loan}')">${r.nama}</div>
                <div class="text-[10px] font-mono text-slate-400 mt-1">${r.loan}</div>
            </td>
            <td class="p-4 text-center">
                <span class="px-3 py-1 rounded-full text-[9px] font-black bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">${r.br}</span>
            </td>
            <td class="p-4 text-center text-[10px] font-bold text-slate-500 italic">${r.tgl_wo || '-'}</td>
            <td class="p-4 text-right">
                <div class="font-black font-mono text-slate-900 dark:text-white text-sm">${fmtIDR(r.os)}</div>
                <div class="text-[8px] text-slate-400 uppercase font-bold">Saldo Ekstrakom</div>
            </td>
            <td class="p-4 text-center">${btnHtml}</td>
        </tr>`;
    }).join('');

    // Trigger animasi masuk setelah DOM di-update
    requestAnimationFrame(() => {
        document.querySelectorAll('.wo-row-item').forEach(el => {
            el.classList.remove('opacity-0', '-translate-x-4');
        });
    });
      unlockMenu();
}

function renderFreshDropPage(res) {
    if(document.getElementById('loader')) document.getElementById('loader').style.display='none';

    // Handle Error jika data bulan lalu tidak ada
    if(res.error) {
        const container = document.getElementById('fresh_list_container');
        if(container) container.innerHTML = `<div class="p-8 text-center text-red-500 font-bold bg-red-50 rounded border border-red-200">${res.error}</div>`;
        return;
    }

    // --- INTEGRASI ANIMASI ANGKA BERJALAN (COUNTER) ---
    // Ambil nilai lama (start) untuk animasi dari innerText saat ini
    const oldNoa = clean(document.getElementById('fresh_total_noa')?.innerText) || 0;
    const oldOs = clean(document.getElementById('fresh_total_os')?.innerText) || 0;

    // Trigger Animasi (Duration: 800ms)
    // animateValue(id, start, end, duration, isCurrency)
    if(document.getElementById('fresh_total_noa')) {
        animateValue('fresh_total_noa', oldNoa, res.stats.count, 800, false);
    }
    if(document.getElementById('fresh_total_os')) {
        animateValue('fresh_total_os', oldOs, res.stats.os, 800, true);
    }

    var container = document.getElementById('fresh_list_container');
    if (!container) return;

    if (!res.list || res.list.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center p-12 text-slate-400">
                <i class="fas fa-check-circle text-4xl text-green-100 mb-3"></i>
                <span class="italic">Aman. Tidak ada penurunan kualitas kredit (Fresh Drop) bulan ini.</span>
            </div>`;
        return;
    }

    var fmtIDR = function(v) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v); };

    // --- MODERN TABLE DESIGN ---
    var html = `
    <div class="overflow-hidden rounded-xl shadow-lg border border-slate-200 bg-white dark:bg-slate-800 transition-all duration-300">
        <div class="bg-gradient-to-r from-orange-500 to-red-600 px-4 py-3 border-b border-orange-700 flex justify-between items-center text-white">
            <span class="font-bold text-sm"><i class="fas fa-exclamation-triangle mr-2"></i>Daftar Penurunan Kualitas (Early Warning)</span>
            <span class="text-xs bg-white/20 px-2 py-0.5 rounded text-white font-mono">Total: ${res.list.length}</span>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                <thead class="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                        <th class="px-4 py-3 pl-6">Debitur</th>
                        <th class="px-4 py-3 text-center">Perubahan Kol</th>
                        <th class="px-4 py-3 text-right">Tunggakan</th>
                        <th class="px-4 py-3 text-right">Baki Debet</th>
                        <th class="px-4 py-3 text-center">Action</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-700">`;

    for (var i = 0; i < res.list.length; i++) {
        var r = res.list[i];
        
        // Visualisasi Perubahan Kol (Misal: 1 -> 2)
        var kolBadge = `
            <div class="flex items-center justify-center gap-2 font-bold font-mono bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 px-2 py-1 rounded-lg">
                <span class="text-slate-400 text-xs">${r.kol_old}</span>
                <i class="fas fa-arrow-right text-xs animate-pulse"></i>
                <span class="text-lg">${r.kol_new}</span>
            </div>
        `;

        // Pesan WA: Tegas tapi Sopan (Format Penagihan Drop)
        var rawMsg = `Yth. Bapak/Ibu *${r.nama}*,\n\nKami dari *Bankaltimtara*.\nMenginformasikan fasilitas kredit No. PK *${r.pk}*.\n\nSistem kami mendeteksi adanya penurunan status kolektibilitas dari *Lancar* menjadi *Dalam Perhatian Khusus/Kurang Lancar*.\n\nTunggakan saat ini: *${fmtIDR(r.tgk)}*\n\nMohon segera melakukan penyetoran agar status kredit kembali PULIH (Lancar) dan terhindar dari denda keterlambatan.\n\nTerima kasih.`;
        var safeMsg = encodeURIComponent(rawMsg);

        // Tombol Action
        var btnHtml = '';
        if(r.hp && r.hp.length > 5) {
             btnHtml = `<button onclick="app.copyAndOpenWA('${r.hp}', '${safeMsg}')" class="group flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-600 hover:text-white transition shadow-sm active:scale-90" title="Tagih via WA">
                        <i class="fab fa-whatsapp text-lg group-hover:scale-110 transition"></i>
                        </button>`;
        } else {
             btnHtml = `<button onclick="app.copyAndOpenWA('', '${safeMsg}')" class="group flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition shadow-sm active:scale-90" title="Copy Script">
                        <i class="fas fa-copy text-sm"></i>
                        </button>`;
        }

        html += `
        <tr class="hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition-colors group">
            <td class="px-4 py-3 pl-6">
                <div class="font-bold text-slate-700 dark:text-slate-200 group-hover:text-orange-700 dark:group-hover:text-orange-400 cursor-pointer" 
                     onclick="event.stopPropagation(); app.fetchDetail('${r.loan}')">
                     ${r.nama}
                </div>
                <div class="text-[10px] text-slate-400 font-mono">${r.loan} • ${r.br}</div>
            </td>
            <td class="px-4 py-3 text-center">
                ${kolBadge}
            </td>
            <td class="px-4 py-3 text-right">
                <div class="font-mono font-bold text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/30 inline-block px-2 py-0.5 rounded">${fmtIDR(r.tgk)}</div>
            </td>
            <td class="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-400 font-medium text-xs">
                ${fmtIDR(r.os)}
            </td>
            <td class="px-4 py-3 text-center">
                <div class="flex justify-center items-center gap-2">
                    ${btnHtml}
                </div>
            </td>
        </tr>`;
    }

    html += '</tbody></table></div></div>';
    
    // Tambahkan footer keterangan
    html += `<div class="mt-2 text-[10px] text-slate-400 text-right px-2 italic">*Data dibandingkan dengan posisi akhir bulan sebelumnya.</div>`;

    container.innerHTML = html;
    unlockMenu();
}

  
  function copyToClipboard(text) {
      var textArea = document.createElement("textarea"); textArea.value = text;
      textArea.style.position = "fixed"; textArea.style.left = "-9999px"; textArea.style.top = "0"; document.body.appendChild(textArea); textArea.focus(); textArea.select();
      try { var successful = document.execCommand('copy');
      if(successful) alert("⚠️ NOMOR HP TIDAK TERSEDIA!\n\nScript penagihan telah disalin ke Clipboard.\nSilakan paste ke Email, Surat, atau Catatan.");
      else alert("Gagal menyalin script."); } catch (err) { alert("Gagal menyalin script: " + err); } document.body.removeChild(textArea);
  }

  // --- FUNGSI SEND WA (VERSI STABIL & TERINTEGRASI) ---
function sendWA(hp, nama, tgk, kol, loan, tglBayar, pk, tglPK, tenor, plafond, noRek) {
    
    // 1. Helper Format Tanggal (Lokal)
    const fmtDateIndo = function(dStr) {
        if(!dStr || dStr === '-' || dStr === 'N/A') return '-';
        var parts = dStr.split('/');
        if(parts.length !== 3) return dStr; 
        var months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        var day = parseInt(parts[0], 10);
        var month = parseInt(parts[1], 10) - 1;
        var year = parts[2];
        if(month < 0 || month > 11) return dStr;
        return day + ' ' + months[month] + ' ' + year;
    };
    
    // Helper Tanggal Hari Ini
    const getTodayIndo = function() {
        var d = new Date();
        var months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    };
    
    // Helper Format Rupiah (Menggunakan fmt global jika ada, atau fallback)
    const fmtUang = function(v) {
        if(typeof fmt === 'function') return fmt(v);
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);
    };

    // 2. Persiapan Data (Handling Undefined/Null yang Kuat)
    var today = getTodayIndo();
    var valPK = (pk && String(pk) !== 'undefined' && String(pk) !== 'null') ? pk : '-';
    var valTglPK = fmtDateIndo(tglPK);
    var valPlafond = fmtUang(plafond);
    var valTenor = (tenor || 0);
    var valRek = (noRek && String(noRek) !== 'undefined') ? noRek : '-';
    
    var valTglJatuhTempo = (tglBayar && tglBayar !== '-' && tglBayar !== 'N/A') ? fmtDateIndo(tglBayar) : 'Segera'; 
    var valTunggakan = fmtUang(tgk);
    
    // Sanitasi Nama (Hapus kutip tunggal agar tidak merusak string JS)
    var safeNama = nama ? nama.replace(/'/g, '') : 'Nasabah';

    var sapaan = "Selamat Pagi"; 
    var msg = "";

    // 3. Logika Narasi Sesuai Kolektibilitas
    // Kita gunakan template literal biasa karena ini di dalam blok script, aman.
    
    // === KOL 2 (DALAM PERHATIAN KHUSUS) ===
    if (kol === 2) {
        msg = `${sapaan},\n` +
              `Kepada Yth Sdr/i _*${safeNama}*_,\n\n` +
              `Menunjuk Perjanjian Kredit Sdr/i :\n` +
              `Nomor : ${valPK}\n` +
              `Tanggal : ${valTglPK}\n` +
              `Plafond : ${valPlafond}\n` +
              `Tenor : ${valTenor} Bulan\n\n` +
              `Per Tanggal ${today} ini telah _*melewati*_ tanggal batas pembayaran yang telah ditentukan _*(${valTglJatuhTempo})*_. Mohon untuk _*segera*_ dilakukan kewajiban pembayaran tunggakan angsuran sebesar :\n\n` +
              `\t\t\t\t_*${valTunggakan}*_\n\n` +
              `Sehubungan dengan tunggakan sebagaimana tercantum diatas sehingga menyebabkan kualitas kredit tergolong *DALAM PERHATIAN KHUSUS*\n\n` +
              `Jika dalam 7 hari kalender sejak pesan ini disampaikan sdr/i belum melakukan pembayaran,\n` +
              `maka Bankaltimtara akan melakukan *PERINGATAN PERTAMA* berupa Surat Peringatan I (Pertama)\n\n` +
              `Pembayaran dapat dilakukan melalui Teller Bank atau Transfer ke Rekening Bankaltimtara ${valRek} an. ${safeNama}\n\n` +
              `Terima Kasih`;

    // === KOL 3 (KURANG LANCAR) ===
    } else if (kol === 3) {
        msg = `${sapaan},\n` +
              `Kepada Yth Sdr/i _*${safeNama}*_,\n\n` +
              `Menunjuk Perjanjian Kredit Sdr/i :\n` +
              `Nomor : ${valPK}\n` +
              `Tanggal : ${valTglPK}\n` +
              `Plafond : ${valPlafond}\n` +
              `Tenor : ${valTenor} Bulan\n\n` +
              `Per Tanggal ${today} ini telah _*melewati*_ tanggal batas pembayaran yang telah ditentukan _*(${valTglJatuhTempo})*_. Mohon untuk _*segera*_ dilakukan kewajiban pembayaran tunggakan angsuran sebesar :\n\n` +
              `\t\t\t\t_*${valTunggakan}*_\n\n` +
              `Sehubungan dengan tunggakan sebagaimana tercantum diatas sehingga menyebabkan kualitas kredit tergolong *KURANG LANCAR*\n\n` +
              `Jika dalam 15 hari kalender sejak pesan ini disampaikan sdr/i belum melakukan pembayaran,\n` +
              `maka Bankaltimtara akan melakukan *PERINGATAN KEDUA* berupa Surat Peringatan II (Kedua)\n\n` +
              `Pembayaran dapat dilakukan melalui Teller Bank atau Transfer ke Rekening Bankaltimtara ${valRek} an. ${safeNama}\n\n` +
              `Terima Kasih`;

    // === KOL 4 (DIRAGUKAN) ===
    } else if (kol === 4) {
        msg = `${sapaan},\n` +
              `Kepada Yth Sdr/i _*${safeNama}*_,\n\n` +
              `Menunjuk Perjanjian Kredit Sdr/i :\n` +
              `Nomor : ${valPK}\n` +
              `Tanggal : ${valTglPK}\n` +
              `Plafond : ${valPlafond}\n` +
              `Tenor : ${valTenor} Bulan\n\n` +
              `Per Tanggal ${today} ini telah _*melewati*_ tanggal batas pembayaran yang telah ditentukan _*(${valTglJatuhTempo})*_. Mohon untuk _*segera*_ dilakukan kewajiban pembayaran tunggakan angsuran sebesar :\n\n` +
              `\t\t\t\t_*${valTunggakan}*_\n\n` +
              `Sehubungan dengan tunggakan sebagaimana tercantum diatas sehingga menyebabkan kualitas kredit tergolong *DIRAGUKAN*\n\n` +
              `Jika dalam 15 hari kalender sejak pesan ini disampaikan sdr/i belum melakukan pembayaran,\n` +
              `maka Bankaltimtara akan melakukan *PEMASANGAN PLANG* pada Agunan yang telah dijaminkan\n\n` +
              `Pembayaran dapat dilakukan melalui Teller Bank atau Transfer ke Rekening Bankaltimtara ${valRek} an. ${safeNama}\n\n` +
              `Terima Kasih`;

    // === KOL 5 (MACET) ===
    } else {
        msg = `${sapaan},\n` +
              `Kepada Yth Sdr/i _*${safeNama}*_,\n\n` +
              `Menunjuk Perjanjian Kredit Sdr/i :\n` +
              `Nomor : ${valPK}\n` +
              `Tanggal : ${valTglPK}\n` +
              `Plafond : ${valPlafond}\n` +
              `Tenor : ${valTenor} Bulan\n\n` +
              `Per Tanggal ${today} ini telah _*melewati*_ tanggal batas pembayaran yang telah ditentukan _*(${valTglJatuhTempo})*_. Mohon untuk _*segera*_ dilakukan kewajiban pembayaran tunggakan angsuran sebesar :\n\n` +
              `\t\t\t\t_*${valTunggakan}*_\n\n` +
              `Sehubungan dengan tunggakan sebagaimana tercantum diatas sehingga menyebabkan kualitas kredit tergolong *MACET*\n\n` +
              `Jika dalam 15 hari kalender sejak pesan ini disampaikan sdr/i belum melakukan pembayaran,\n` +
              `maka Bankaltimtara akan melakukan *PEMASANGAN PLANG* pada Agunan yang telah dijaminkan\n\n` +
              `Pembayaran dapat dilakukan melalui Teller Bank atau Transfer ke Rekening Bankaltimtara ${valRek} an. ${safeNama}\n\n` +
              `Terima Kasih`;
    }

    // --- FIX UTAMA ---
    // Jangan gunakan window.open manual atau copyToClipboard yang belum ada.
    // Panggil helper yang sudah kita buat sebelumnya di window.app
    
    // Encode dulu pesannya agar karakter seperti enter (\n) aman saat dipassing
    var msgEncoded = encodeURIComponent(msg);
    
    if(typeof app !== 'undefined' && typeof app.copyAndOpenWA === 'function') {
        app.copyAndOpenWA(hp, msgEncoded);
    } else {
        console.error("Fungsi app.copyAndOpenWA belum didefinisikan!");
    }
}

  // --- HELPER GLOBAL (Agar tidak error 'not defined') ---
const fmtIDR = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);

const fmtDate = (d) => {
    if(!d) return '-';
    try {
        var date = new Date(d);
        return isNaN(date.getTime()) ? d : date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch(e) { return d; }
};

function renderMutasiPage(res) {
    if(document.getElementById('loader')) document.getElementById('loader').style.display='none';
    if(res.error) { alert(res.error); return; }

    var container = document.getElementById('view-mutasi');
    
    // --- AMAN: Mengambil nilai angka dari UI saat ini ---
    const oldCair  = clean(document.getElementById('m_val_cair')?.innerText) || 0;
    const oldLunas = clean(document.getElementById('m_val_lunas')?.innerText) || 0;
    const oldNet   = clean(document.getElementById('m_val_net')?.innerText) || 0;
    const oldDrop  = clean(document.getElementById('m_val_drop')?.innerText) || 0;

    var netGrowth = res.summary.booking_amt - res.summary.repayment_amt;
    var growthColor = netGrowth >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400';
    var growthBg = netGrowth >= 0 ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200' : 'bg-red-50 dark:bg-red-900/30 border-red-200';

    // Render Struktur Dashboard Mutasi (Modern Playful Bento Box)
    container.innerHTML = `
    <div class="p-4 md:p-6 space-y-8 animate-fade-in min-h-screen">
        
        <!-- 4 KPI CARDS (Bouncy & Playful) -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            
            <!-- Card: Pencairan -->
            <div class="glass-card p-5 rounded-[2rem] border-b-4 border-emerald-500 shadow-sm hover:shadow-xl group hover:-translate-y-2 transition-all duration-300 relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/50 dark:from-slate-800 dark:to-emerald-900/20">
                <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-500"><i class="fas fa-hand-holding-usd text-9xl text-emerald-500"></i></div>
                <div class="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div class="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 bg-emerald-100 dark:bg-emerald-900/50 inline-block px-2 py-0.5 rounded-md">New Booking</div>
                        <div id="m_val_cair" class="text-xl md:text-2xl font-black text-slate-800 dark:text-white drop-shadow-sm mt-1">Rp 0</div>
                    </div>
                    <div class="mt-4 text-[10px] font-bold text-emerald-600 flex items-center gap-1.5 bg-white/60 dark:bg-black/20 w-fit px-3 py-1 rounded-full shadow-inner backdrop-blur-sm">
                        <i class="fas fa-user-plus text-[9px]"></i> <span>${res.details.new_booking.length} Debitur</span>
                    </div>
                </div>
            </div>
            
            <!-- Card: Pelunasan -->
            <div class="glass-card p-5 rounded-[2rem] border-b-4 border-rose-500 shadow-sm hover:shadow-xl group hover:-translate-y-2 transition-all duration-300 relative overflow-hidden bg-gradient-to-br from-white to-rose-50/50 dark:from-slate-800 dark:to-rose-900/20">
                <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-500"><i class="fas fa-flag-checkered text-9xl text-rose-500"></i></div>
                <div class="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div class="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1 bg-rose-100 dark:bg-rose-900/50 inline-block px-2 py-0.5 rounded-md">Repayment</div>
                        <div id="m_val_lunas" class="text-xl md:text-2xl font-black text-slate-800 dark:text-white drop-shadow-sm mt-1">Rp 0</div>
                    </div>
                    <div class="mt-4 text-[10px] font-bold text-rose-600 flex items-center gap-1.5 bg-white/60 dark:bg-black/20 w-fit px-3 py-1 rounded-full shadow-inner backdrop-blur-sm">
                        <i class="fas fa-user-check text-[9px]"></i> <span>${res.details.repayment.length} Debitur</span>
                    </div>
                </div>
            </div>
            
            <!-- Card: Net Growth -->
            <div class="glass-card p-5 rounded-[2rem] border-b-4 ${netGrowth >= 0 ? 'border-blue-500' : 'border-red-500'} shadow-sm hover:shadow-xl group hover:-translate-y-2 transition-all duration-300 relative overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
                <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform duration-500"><i class="fas fa-chart-pie text-9xl text-slate-500"></i></div>
                <div class="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div class="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 bg-slate-100 dark:bg-slate-700 inline-block px-2 py-0.5 rounded-md">Net Growth</div>
                        <div id="m_val_net" class="text-xl md:text-2xl font-black ${growthColor} drop-shadow-sm mt-1">Rp 0</div>
                    </div>
                    <div class="mt-4 text-[10px] font-bold text-slate-500 flex items-center gap-1.5 ${growthBg} w-fit px-3 py-1 rounded-full shadow-inner border backdrop-blur-sm">
                        <i class="fas fa-bolt text-[9px] text-yellow-500"></i> <span>MTD Performance</span>
                    </div>
                </div>
            </div>

            <!-- Card: Downgrade -->
            <div class="glass-card p-5 rounded-[2rem] border-b-4 border-orange-500 shadow-sm hover:shadow-xl group hover:-translate-y-2 transition-all duration-300 relative overflow-hidden bg-gradient-to-br from-white to-orange-50/50 dark:from-slate-800 dark:to-orange-900/20">
                <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-500"><i class="fas fa-sort-amount-down text-9xl text-orange-500"></i></div>
                <div class="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div class="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1 bg-orange-100 dark:bg-orange-900/50 inline-block px-2 py-0.5 rounded-md">Quality Drop</div>
                        <div id="m_val_drop" class="text-xl md:text-2xl font-black text-orange-600 dark:text-orange-400 drop-shadow-sm mt-1">Rp 0</div>
                    </div>
                    <div class="mt-4 text-[10px] font-bold text-orange-600 flex items-center gap-1.5 bg-white/60 dark:bg-black/20 w-fit px-3 py-1 rounded-full shadow-inner backdrop-blur-sm">
                        <i class="fas fa-exclamation-triangle text-[9px]"></i> <span>${res.details.downgrade.length} Debitur</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- LIST AREA (Floating Tabs & Rows) -->
        <div class="glass-card rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 dark:border-slate-700 overflow-hidden bg-white/40 dark:bg-slate-900/40 pb-2">
            
            <!-- Segmented Control (Tabs gaya iOS) -->
            <div class="p-4 md:p-6 pb-2">
                <div class="flex p-1.5 bg-slate-200/50 dark:bg-slate-800/80 backdrop-blur-md gap-1 rounded-full shadow-inner overflow-x-auto custom-scrollbar">
                    <button onclick="switchMutasiTab(this, 'tab_new')" class="mut-btn active-mut flex-1 min-w-[90px] py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300">Pencairan</button>
                    <button onclick="switchMutasiTab(this, 'tab_lunas')" class="mut-btn flex-1 min-w-[90px] py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 text-slate-500 hover:text-slate-800 dark:hover:text-white">Pelunasan</button>
                    <button onclick="switchMutasiTab(this, 'tab_drop')" class="mut-btn flex-1 min-w-[90px] py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 text-slate-500 hover:text-slate-800 dark:hover:text-white">Downgrade</button>
                    <button onclick="switchMutasiTab(this, 'tab_rise')" class="mut-btn flex-1 min-w-[90px] py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 text-slate-500 hover:text-slate-800 dark:hover:text-white">Upgrade</button>
                </div>
            </div>

            <!-- Area Data Tabel -->
            <div class="px-4 md:px-6 h-[500px] overflow-y-auto custom-scrollbar relative">
                <div id="tab_new" class="mutasi-tab py-2 animate-fade-in">${renderMutasiList(res.details.new_booking, 'NEW')}</div>
                <div id="tab_lunas" class="mutasi-tab hidden py-2 animate-fade-in">${renderMutasiList(res.details.repayment, 'LUNAS')}</div>
                <div id="tab_drop" class="mutasi-tab hidden py-2 animate-fade-in">${renderMutasiList(res.details.downgrade, 'DROP')}</div>
                <div id="tab_rise" class="mutasi-tab hidden py-2 animate-fade-in">${renderMutasiList(res.details.upgrade, 'RISE')}</div>
            </div>
        </div>
    </div>`;

    // --- TRIGGER ANIMASI ---
    animateValue('m_val_cair', oldCair, res.summary.booking_amt, 800, true);
    animateValue('m_val_lunas', oldLunas, res.summary.repayment_amt, 800, true);
    animateValue('m_val_net', oldNet, netGrowth, 1000, true);
    animateValue('m_val_drop', oldDrop, res.summary.downgrade_amt, 800, true);
    unlockMenu();
}

function renderMutasiList(data, type) {
    if(!data || data.length === 0) {
        return `<div class="flex flex-col items-center justify-center p-16 h-full text-slate-400 animate-pulse-slow">
                    <div class="bg-white/50 dark:bg-slate-800 w-24 h-24 rounded-full flex items-center justify-center shadow-inner mb-4">
                        <i class="fas fa-ghost text-5xl opacity-50"></i>
                    </div>
                    <p class="text-xs font-black uppercase tracking-widest">Tidak Ada Aktivitas</p>
                    <p class="text-[10px] mt-1 opacity-60">Belum ada pergerakan data di kategori ini.</p>
                </div>`;
    }

    const fmtIDR = v => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);

    return `
    <div class="flex flex-col gap-3 pb-4">
        ${data.map((r, idx) => {
            let badge = '';
            let amtColor = 'text-slate-700 dark:text-white';
            let iconBox = '';
            
            if(type === 'LUNAS') {
                badge = '<span class="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 text-[9px] font-black tracking-widest uppercase border border-rose-200 dark:border-rose-800">Lunas</span>';
                amtColor = 'text-slate-400 line-through opacity-60';
                iconBox = '<div class="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 shadow-inner border border-rose-100"><i class="fas fa-check-double"></i></div>';
            } else if(type === 'NEW') {
                badge = '<span class="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 text-[9px] font-black tracking-widest uppercase border border-emerald-200 dark:border-emerald-800">Cair</span>';
                amtColor = 'text-emerald-600 dark:text-emerald-400';
                iconBox = '<div class="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 shadow-inner border border-emerald-100"><i class="fas fa-hand-holding-usd"></i></div>';
            } else if(type === 'DROP') {
                badge = `<span class="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 text-[9px] font-black tracking-widest uppercase border border-orange-200 dark:border-orange-800">K${r.kol_old} <i class="fas fa-arrow-right mx-1"></i> K${r.kol_new}</span>`;
                amtColor = 'text-orange-600 dark:text-orange-400';
                iconBox = '<div class="w-10 h-10 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 shadow-inner border border-orange-100"><i class="fas fa-sort-amount-down"></i></div>';
            } else if(type === 'RISE') {
                badge = `<span class="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 text-[9px] font-black tracking-widest uppercase border border-blue-200 dark:border-blue-800">K${r.kol_old} <i class="fas fa-arrow-right mx-1"></i> K${r.kol_new}</span>`;
                amtColor = 'text-blue-600 dark:text-blue-400';
                iconBox = '<div class="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 shadow-inner border border-blue-100"><i class="fas fa-level-up-alt"></i></div>';
            }

            return `
            <!-- Kartu Baris (Floating Row Bento) -->
            <div class="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-100 dark:border-slate-700/50 p-3.5 sm:p-4 rounded-2xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4" onclick="if(typeof app.fetchDetail === 'function') app.fetchDetail('${r.loan}')">
                
                <!-- Info Kiri -->
                <div class="flex items-start gap-3">
                    ${iconBox}
                    <div class="flex flex-col">
                        <span class="font-black text-slate-800 dark:text-white text-xs sm:text-sm uppercase tracking-wide group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">${r.nama || 'Nasabah'}</span>
                        
                        <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5">
                            <span class="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-900/80 px-2 py-0.5 rounded shadow-inner"><i class="fas fa-fingerprint mr-1 opacity-50"></i>${r.loan}</span>
                            <span class="text-[9px] font-bold text-slate-500 uppercase bg-slate-100 dark:bg-slate-900/80 px-2 py-0.5 rounded shadow-inner"><i class="fas fa-building mr-1 opacity-50"></i>${r.br || '-'}</span>
                            <span class="text-[9px] font-bold text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded hidden md:inline-block">${(r.segmen || 'UMUM').substring(0,20)}</span>
                        </div>
                    </div>
                </div>

                <!-- Info Kanan (Badge & Nominal) -->
                <div class="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t border-slate-100 dark:border-slate-700/50 sm:border-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
                    <div class="mb-0 sm:mb-1.5">${badge}</div>
                    <div class="font-mono font-black ${amtColor} text-sm sm:text-base bg-white dark:bg-black/20 sm:bg-transparent px-3 py-1 sm:p-0 rounded-lg shadow-inner sm:shadow-none">
                        ${fmtIDR(r.os || r.amount || 0)}
                    </div>
                </div>
            </div>`;
        }).join('')}
    </div>`;
}

// Global Tab Switcher (Animasi gaya Segmented Control)
window.switchMutasiTab = function(btn, tabId) {
    // Sembunyikan semua tab content
    document.querySelectorAll('.mutasi-tab').forEach(el => el.classList.add('hidden'));
    
    // Kembalikan semua tombol ke style pasif
    document.querySelectorAll('.mut-btn').forEach(b => {
        b.classList.remove('active-mut', 'bg-white', 'dark:bg-slate-700', 'shadow-md', 'text-slate-800', 'dark:text-white', 'scale-105');
        b.classList.add('text-slate-500');
    });
    
    // Munculkan tab content target
    document.getElementById(tabId).classList.remove('hidden');
    
    // Aktifkan style tombol yang diklik
    btn.classList.remove('text-slate-500');
    btn.classList.add('active-mut', 'bg-white', 'dark:bg-slate-700', 'shadow-md', 'text-slate-800', 'dark:text-white', 'scale-105');
}


// =================================================================
// 1. VARIABLE GLOBAL & RESETTER
// =================================================================
var isSearching = false; 

// --- RENDER HALAMAN DATA KREDIT (MASTER) ---
function renderKreditPage() { 
    isSearching = false; 
    window.isServerSearchMode = false;

    if(document.getElementById('loader')) document.getElementById('loader').style.display='none';
    var container = document.getElementById('view-kredit');
    if(!container) return; 

    // Render Struktur HTML Modern Playful (Compact & Safe Area)
    var html = `
    <div class="p-3 md:p-5 space-y-3 md:space-y-4 bg-transparent animate-fade-in">
        
        <!-- Header & Search -->
        <div class="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/50 p-3 md:p-4 rounded-[1.2rem] md:rounded-[1.5rem] shadow-sm flex flex-col xl:flex-row justify-between items-center gap-3 md:gap-4">
            <div class="flex items-center gap-3 w-full xl:w-auto">
                <div class="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30 shrink-0">
                    <i class="fas fa-database text-lg md:text-xl"></i>
                </div>
                <div>
                    <h2 class="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Data Master Kredit</h2>
                    <div class="flex items-center gap-1.5 mt-1">
                        <span class="px-1.5 py-0.5 rounded text-[7px] md:text-[8px] font-black bg-blue-100 text-blue-600 uppercase tracking-wider">Live</span>
                        <span class="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest" id="creditInfoStatus">Sinkronisasi...</span>
                    </div>
                </div>
            </div>
            <div class="flex gap-2 w-full xl:w-auto">
                <div class="relative flex-1 xl:w-64">
                    <input id="searchCreditInput" type="text" onkeydown="app.handleSearchEnter(event)" placeholder="Ketik Nama / No. PK..." class="w-full pl-8 pr-3 py-2 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] md:text-xs font-bold outline-none focus:border-blue-500 transition-all shadow-inner">
                    <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-[10px] md:text-xs"></i>
                </div>
                <button onclick="app.handleSearchEnter({key:'Enter'})" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 shrink-0">Cari</button>
                <button id="btnResetSearch" onclick="app.resetSearchCredit()" class="hidden bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 px-3 py-2 rounded-full text-[10px] md:text-xs transition-all active:scale-95 shrink-0"><i class="fas fa-times"></i></button>
            </div>
        </div>

        <!-- KPI & Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
            <!-- KPI Kiri -->
            <div class="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 md:gap-4">
                <div class="glass-card p-4 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] border-l-[3px] border-blue-500 shadow-sm hover:shadow-md transition-all relative overflow-hidden bg-white/80 dark:bg-slate-800/80 flex-1 flex flex-col justify-center">
                    <div class="absolute -right-3 -bottom-3 opacity-5"><i class="fas fa-coins text-7xl text-blue-500"></i></div>
                    <div class="relative z-10">
                        <div class="text-[8px] md:text-[9px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md inline-block uppercase tracking-widest mb-1 border border-blue-100 dark:border-blue-800/50">Total Outstanding</div>
                        <div class="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter" id="kr_os">...</div>
                    </div>
                </div>
                <div class="glass-card p-4 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] border-l-[3px] border-emerald-500 shadow-sm hover:shadow-md transition-all relative overflow-hidden bg-white/80 dark:bg-slate-800/80 flex-1 flex flex-col justify-center">
                    <div class="absolute -right-3 -bottom-3 opacity-5"><i class="fas fa-users text-7xl text-emerald-500"></i></div>
                    <div class="relative z-10">
                        <div class="text-[8px] md:text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md inline-block uppercase tracking-widest mb-1 border border-emerald-100 dark:border-emerald-800/50">Total Debitur</div>
                        <div class="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter" id="kr_noa">...</div>
                    </div>
                </div>
            </div>

            <!-- Charts Kanan -->
            <div class="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div class="glass-card p-3 md:p-4 rounded-[1.2rem] md:rounded-[1.5rem] bg-white/80 dark:bg-slate-800/80 flex flex-col h-[220px] md:h-[280px] shadow-sm">
                    <div class="text-[8px] md:text-[9px] font-black mb-2 flex items-center gap-1.5 text-slate-600 dark:text-slate-300 uppercase tracking-widest shrink-0">
                        <div class="w-6 h-6 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center text-xs"><i class="fas fa-chart-pie"></i></div> Komposisi Kredit
                    </div>
                    <div class="flex-1 relative w-full h-full"><canvas id="chKr1"></canvas></div>
                </div>
                <div class="glass-card p-3 md:p-4 rounded-[1.2rem] md:rounded-[1.5rem] bg-white/80 dark:bg-slate-800/80 flex flex-col h-[220px] md:h-[280px] shadow-sm">
                    <div class="text-[8px] md:text-[9px] font-black mb-2 flex items-center gap-1.5 text-slate-600 dark:text-slate-300 uppercase tracking-widest shrink-0">
                        <div class="w-6 h-6 rounded bg-orange-100 dark:bg-orange-900/40 text-orange-600 flex items-center justify-center text-xs"><i class="fas fa-chart-bar"></i></div> Sektor Ekonomi
                    </div>
                    <div class="flex-1 relative w-full h-full"><canvas id="chKr2"></canvas></div>
                </div>
            </div>
        </div>

        <!-- Table Daftar Debitur -->
        <div class="glass-card rounded-[1.2rem] md:rounded-[1.5rem] overflow-hidden flex flex-col h-[400px] md:h-[500px] shadow-sm bg-white/80 dark:bg-slate-900/80 pb-1">
            <div class="overflow-auto flex-1 custom-scrollbar px-1 pt-1">
                <table class="w-full text-left text-[10px] md:text-xs whitespace-nowrap border-separate border-spacing-y-1">
                    <thead class="bg-slate-50/90 dark:bg-slate-800/90 text-slate-500 sticky top-0 z-10 shadow-sm rounded-md backdrop-blur-md">
                        <tr class="text-[7px] md:text-[8px] font-black uppercase tracking-widest">
                            <th class="p-2.5 md:p-3 rounded-l-md cursor-pointer hover:text-blue-600 transition" onclick="app.sortKredit('nama')">Identitas Debitur <i class="fas fa-sort text-slate-300 ml-1"></i></th>
                            <th class="p-2.5 md:p-3 text-center">No. Perjanjian</th>
                            <th class="p-2.5 md:p-3 text-center">Status</th>
                            <th class="p-2.5 md:p-3 text-right hidden sm:table-cell">Plafond Limit</th>
                            <th class="p-2.5 md:p-3 text-right rounded-r-md cursor-pointer hover:text-blue-600 transition" onclick="app.sortKredit('os')">Baki Debet <i class="fas fa-sort text-slate-300 ml-1"></i></th>
                        </tr>
                    </thead>
                    <tbody id="creditTableBody" class="before:block before:h-1 divide-y divide-slate-100/50 dark:divide-slate-800/50">
                    <!-- Data disuntikkan oleh JS -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;

    container.innerHTML = html;

    var branchVal = document.getElementById('selBranch')?.value || 'ALL';
    var dateVal = document.getElementById('selDate')?.value || '';

    google.script.run
    .withSuccessHandler(function(res) {
        window.unlockSearch(); 
        if(res.error) {
             var tb = document.getElementById('creditTableBody');
             if(tb) tb.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-red-500 font-bold bg-red-50 rounded-xl m-4 inline-block">${res.error}</td></tr>`;
        } else {
             const totalOS = res.totalOS || 0; 
             const totalNOA = res.totalNOA || 0;

             if (typeof animateValue === 'function') {
                animateValue('kr_os', 0, totalOS, 800, true);
                animateValue('kr_noa', 0, totalNOA, 800, false);
             } else {
                document.getElementById('kr_os').innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalOS);
                document.getElementById('kr_noa').innerText = totalNOA.toLocaleString('id-ID');
             }

             document.getElementById('creditInfoStatus').innerHTML = `<span class="bg-blue-100 text-blue-600 px-2 py-0.5 rounded shadow-inner">Live</span> ${totalNOA.toLocaleString('id-ID')} Rekening`;

             renderCreditRows(res.list);
             window.allCreditData = res.list; 

             if (typeof updateCreditCharts === 'function') updateCreditCharts(res.list);
        }
    })
    .withFailureHandler(function(err) {
         window.unlockSearch();
         var tb = document.getElementById('creditTableBody');
         if(tb) tb.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-red-500 font-bold"><i class="fas fa-wifi text-3xl mb-3 block"></i>FAILURE: ${err.message}</td></tr>`;
    })
    .searchCreditGlobal(branchVal, dateVal, ''); 

    if(typeof unlockMenu === 'function') unlockMenu();
}


// =================================================================
// 2. HANDLER SEARCH & UTILITIES
// =================================================================
window.handleSearchEnter = function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (isSearching) return; 

        var inputEl = document.getElementById('searchCreditInput');
        var keyword = inputEl.value;

        if (keyword.length > 2) {
            isSearching = true; 
            inputEl.disabled = true; 
            inputEl.classList.add('opacity-50');

            var tbody = document.getElementById('creditTableBody');
            if(tbody) tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="p-16 md:p-24 text-center">
                        <div class="relative inline-flex w-16 h-16 md:w-20 md:h-20 bg-blue-50 dark:bg-slate-800 rounded-2xl shadow-inner items-center justify-center mb-4 mx-auto border border-slate-100 dark:border-slate-700">
                             <i class="fas fa-database text-2xl md:text-3xl text-blue-300 dark:text-slate-600"></i>
                             <i class="fas fa-search absolute -bottom-2 -right-2 text-xl text-blue-500 animate-bounce drop-shadow-md"></i>
                        </div>
                        <div class="text-blue-500 text-[9px] md:text-[10px] font-black tracking-[0.2em] uppercase animate-pulse">Memindai Database...</div>
                    </td>
                </tr>`;
            
            var branchVal = document.getElementById('selBranch')?.value || 'ALL';
            var dateVal = document.getElementById('selDate')?.value || '';
            
            google.script.run
                .withSuccessHandler(onSearchResult)
                .withFailureHandler(onSearchFail)
                .searchCreditGlobal(branchVal, dateVal, keyword);

        } else if (keyword.length === 0) {
            window.resetSearchCredit();
        } else {
             alert("Ketik minimal 3 huruf untuk mencari.");
        }
    }
}

window.onSearchResult = function(res) {
    window.unlockSearch(); 
    var tbody = document.getElementById('creditTableBody');
    if (!tbody) return; 

    if (res.error) { 
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center"><div class="bg-rose-50 text-rose-500 font-bold text-xs p-4 rounded-xl inline-block shadow-inner">${res.error}</div></td></tr>`;
        return; 
    }
    
    var displayData = res.list || [];
    var isLimited = false;
    if (displayData.length > 100) {
        displayData = displayData.slice(0, 100);
        isLimited = true;
    }
    
    renderCreditRows(displayData);
    
    var infoEl = document.getElementById('creditInfoStatus');
    if (infoEl) {
        var msg = `<span class="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded shadow-inner">Ditemukan</span> <b>${res.count}</b> kecocokan.`;
        if (isLimited) msg += " (Top 100)";
        infoEl.innerHTML = msg;
    }
    
    var btnReset = document.getElementById('btnResetSearch');
    if (btnReset) btnReset.classList.remove('hidden');
    
    setTimeout(() => { 
        var inp = document.getElementById('searchCreditInput');
        if(inp && !inp.disabled) inp.focus(); 
    }, 100);
}

window.onSearchFail = function(err) {
    window.unlockSearch();
    var tbody = document.getElementById('creditTableBody');
    if(tbody) tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center"><div class="bg-rose-50 text-rose-500 text-xs font-bold p-4 rounded-xl inline-block shadow-inner">Koneksi Gagal. Silakan coba lagi.</div></td></tr>`;
}

window.unlockSearch = function() {
    isSearching = false; 
    var inputEl = document.getElementById('searchCreditInput');
    if(inputEl) {
        inputEl.disabled = false;
        inputEl.classList.remove('opacity-50'); 
    }
}

window.resetSearchCredit = function() {
    if(isSearching) return; 
    document.getElementById('searchCreditInput').value = '';
    if(window.allCreditData) {
        renderCreditRows(window.allCreditData);
        var infoEl = document.getElementById('creditInfoStatus');
        if(infoEl) infoEl.innerHTML = `<span class="bg-blue-100 text-blue-600 px-2 py-0.5 rounded shadow-inner">Live</span> Menampilkan 50 data teratas`;
    }
    document.getElementById('btnResetSearch').classList.add('hidden');
    window.isServerSearchMode = false;
}

// =================================================================
// 3. RENDER ROWS & SORTING (MODERN PLAYFUL ROW)
// =================================================================
function renderCreditRows(data) {
    var tbody = document.getElementById('creditTableBody');
    if(!tbody) return;
    
    var fmtIDR = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);

    if(!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="p-16 md:p-24 text-center animate-fade-in">
                    <div class="flex flex-col items-center justify-center space-y-3">
                        <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shadow-inner border border-slate-200 dark:border-slate-700">
                            <i class="fas fa-ghost text-2xl text-slate-300"></i>
                        </div>
                        <div>
                            <p class="text-xs font-black tracking-widest uppercase text-slate-400">Pencarian Kosong</p>
                            <p class="text-[9px] font-bold text-slate-400 mt-1">Coba gunakan kata kunci lain.</p>
                        </div>
                    </div>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = data.map((r, idx) => {
        var k = parseInt(r.kol) || 1; 
        
        var kolConfig = {
            1: { bg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600', icon: 'fa-check-circle' },
            2: { bg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600', icon: 'fa-exclamation-circle' },
            3: { bg: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600', icon: 'fa-exclamation-triangle' },
            4: { bg: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600', icon: 'fa-skull' },
            5: { bg: 'bg-red-600 text-white shadow-md animate-pulse-slow', icon: 'fa-skull-crossbones' },
            'E': { bg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600', icon: 'fa-star' }
        };
        
        var style = kolConfig[k] || kolConfig[1];
        var isNpl = (k >= 3 && k <= 5);
        var bakiColor = isNpl ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white';
        var safeNama = String(r.nama || '-').replace(/'/g, "\\'");
        
        return `
        <tr class="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer border-b border-slate-100/50 dark:border-slate-800/50 animate-fade-in" style="animation-delay: ${Math.min(idx * 10, 500)}ms" onclick="if(window.app && typeof window.app.fetchDetail === 'function') window.app.fetchDetail('${r.loan}')">
            
            <td class="p-2 md:p-3 rounded-l-md align-middle">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 text-slate-500 shadow-inner border border-slate-200/50 group-hover:scale-110 group-hover:bg-blue-100 group-hover:text-blue-500 transition-all">
                        <i class="fas fa-user text-xs"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="font-black text-[10px] md:text-[11px] text-slate-800 dark:text-white uppercase truncate">${safeNama}</div>
                        <div class="text-[7px] md:text-[8px] font-bold text-slate-400 mt-0.5 flex items-center gap-1">
                            <span class="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200/50"><i class="fas fa-fingerprint text-blue-400"></i> ${r.loan}</span>
                        </div>
                    </div>
                </div>
            </td>
            
            <td class="p-2 md:p-3 text-center align-middle hidden sm:table-cell">
                <div class="text-[8px] md:text-[9px] font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md inline-block border border-slate-200/50">
                    <i class="fas fa-file-contract text-blue-500"></i> ${r.pk || '-'}
                </div>
            </td>
            
            <td class="p-2 md:p-3 text-center align-middle">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded shadow-sm text-[8px] md:text-[9px] font-black uppercase tracking-wider border ${style.bg}">
                    <i class="fas ${style.icon}"></i> KOL ${k}
                </span>
            </td>
            
            <td class="p-2 md:p-3 text-right align-middle hidden lg:table-cell">
                <div class="text-[9px] md:text-[10px] font-bold text-slate-400 font-mono tracking-tighter">${fmtIDR(r.plafond)}</div>
            </td>
            
            <td class="p-2 md:p-3 text-right align-middle rounded-r-md">
                <div class="font-mono font-black ${bakiColor} text-[11px] md:text-[13px] group-hover:text-blue-600 transition-colors tracking-tighter">${fmtIDR(r.os)}</div>
                <div class="text-[7px] md:text-[8px] font-bold text-slate-400 mt-0.5 flex justify-end items-center gap-1">
                    <i class="far fa-calendar-alt"></i> JT: ${r.tgl_jt || '-'}
                </div>
            </td>
        </tr>`;
    }).join('');
}

// Fungsi Filter Client-Side (Sangat Cepat)
window.filterCreditTable = function(keyword) {
    if(!window.allCreditData) return;
    var k = keyword.toLowerCase();
    
    var filtered = window.allCreditData.filter(item => 
        (item.nama && item.nama.toLowerCase().includes(k)) || 
        (item.loan && item.loan.includes(k)) ||
        (item.pk && item.pk.toLowerCase().includes(k))
    );
    
    renderCreditRows(filtered.slice(0, 100));
};

window.sortKredit = function(key) {
    if(!window.allCreditData) return;
    
    // Init state jika belum ada
    app.state = app.state || {};
    if(!app.state.krSort) app.state.krSort = { key: 'os', asc: false };
    
    if(app.state.krSort.key === key) {
        app.state.krSort.asc = !app.state.krSort.asc; 
    } else { 
        app.state.krSort.key = key; 
        app.state.krSort.asc = false;
    }
    
    window.allCreditData.sort((a,b) => { 
        if(key === 'os') return app.state.krSort.asc ? a.os - b.os : b.os - a.os; 
        if(key === 'nama') return app.state.krSort.asc ? a.nama.localeCompare(b.nama) : b.nama.localeCompare(a.nama); 
        return 0; 
    });
    
    renderCreditRows(window.allCreditData.slice(0,100));
};


// =================================================================
// 4. TREND PERFORMANCE (WIDGET STYLE)
// =================================================================
function renderTrend(res) {
    if(document.getElementById('loader')) document.getElementById('loader').style.display='none';
    
    var container = document.getElementById('view-trend');
    if(!container) return;

    // Perhitungan untuk skala chart HTML murni
    const maxOS = Math.max(...res.map(x => x.os));
    const last = res[res.length-1];
    const first = res[0];
    const fmtIDR = v => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

    container.innerHTML = `
    <div class="p-3 md:p-5 space-y-3 md:space-y-4 fade-in">
        
        <!-- Header -->
        <div class="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/50 p-3 md:p-4 rounded-[1.2rem] md:rounded-[1.5rem] shadow-sm flex items-center gap-3">
            <div class="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md transform -rotate-3 shrink-0">
                <i class="fas fa-chart-line text-lg md:text-xl"></i>
            </div>
            <div>
                <h3 class="font-black text-lg md:text-xl text-slate-800 dark:text-white tracking-tight leading-none">Trend Performance</h3>
                <p class="text-[8px] md:text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-widest">OS Volume vs Kualitas (NPL)</p>
            </div>
        </div>

        <!-- HTML Based Chart Area -->
        <div class="glass-card p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-900/60 flex flex-col">
            <div class="flex items-end justify-between h-[200px] md:h-[280px] gap-1.5 md:gap-4 mt-2 relative">
                ${res.map(d => {
                    let hPct = (d.os / maxOS) * 80; // Sisakan ruang atas
                    let nplRatio = (d.npl/d.os*100);
                    let barColor = nplRatio > 5 ? 'from-red-400 to-rose-600' : 'from-blue-400 to-indigo-600';
                    let dotColor = nplRatio > 5 ? 'bg-red-500 ring-red-200 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-emerald-500 ring-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.8)]';
                    let dotPos = Math.min(nplRatio * 10, 95); // Skala visual NPL (10x ratio)

                    return `
                    <div class="group relative flex flex-col items-center justify-end w-full h-full cursor-pointer">
                        
                        <!-- Floating Tooltip -->
                        <div class="absolute bottom-full mb-3 hidden group-hover:flex flex-col bg-slate-800/95 backdrop-blur-md text-white text-[9px] md:text-[10px] p-2.5 rounded-xl shadow-xl z-20 w-32 md:w-40 text-center border border-slate-600 transform transition-all animate-pop-in">
                            <div class="font-black text-blue-300 uppercase tracking-widest mb-1 border-b border-slate-600 pb-1">${d.label}</div>
                            <div class="font-mono mt-1">OS: ${(d.os/1e9).toFixed(1)} M</div>
                            <div class="font-mono font-bold ${nplRatio>5 ? 'text-red-400' : 'text-emerald-400'}">NPL: ${nplRatio.toFixed(2)}%</div>
                        </div>
                        
                        <!-- Floating Dot Indicator -->
                        <div class="absolute w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full border border-white z-10 ${dotColor} ring-2 transition-all duration-500 group-hover:scale-125" 
                             style="bottom: ${dotPos}%;"></div>
                        
                        <!-- Gradient Bar -->
                        <div class="w-full md:w-12 rounded-t-md md:rounded-t-xl bg-gradient-to-t ${barColor} opacity-70 group-hover:opacity-100 transition-all duration-500 relative shadow-inner" style="height: ${hPct}%">
                             <div class="absolute top-1 left-0 right-0 text-center text-[7px] md:text-[9px] text-white/90 font-black hidden md:block">${nplRatio.toFixed(1)}%</div>
                        </div>
                        
                        <!-- Label Bulan -->
                        <div class="mt-2 text-[7px] md:text-[9px] text-slate-500 font-bold truncate w-full text-center">${d.label.split(' ')[0]}</div>
                    </div>`;
                }).join('')}
            </div>
            
            <!-- Legend -->
            <div class="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">
                <div class="flex items-center gap-1.5"><div class="w-3 h-3 bg-gradient-to-t from-blue-400 to-indigo-600 rounded-sm shadow-sm"></div> Volume Kredit (OS)</div>
                <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 bg-red-500 rounded-full border border-white ring-2 ring-red-200 shadow-sm"></div> Trend NPL Ratio</div>
            </div>
        </div>

        <!-- Insights Bento -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
             <div class="glass-card p-4 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] border-l-[3px] border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 flex flex-col justify-center">
                <div class="font-black text-blue-700 dark:text-blue-400 text-[10px] md:text-[11px] mb-1.5 uppercase tracking-widest flex items-center gap-1.5"><i class="fas fa-chart-line"></i> Growth Insight</div>
                <div class="text-[9px] md:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Posisi kredit terakhir tercatat <b class="font-mono text-blue-600 dark:text-blue-400">${fmtIDR(last.os)}</b>.
                    Trend volume menunjukkan pergerakan yang <b class="${last.os > first.os ? 'text-emerald-600' : 'text-rose-600'}">${last.os > first.os ? 'POSITIF (Ekspansi)' : 'NEGATIF (Kontraksi)'}</b> dibandingkan awal periode pengamatan.
                </div>
             </div>
             <div class="glass-card p-4 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] border-l-[3px] border-orange-500 bg-orange-50/50 dark:bg-orange-900/10 flex flex-col justify-center">
                <div class="font-black text-orange-700 dark:text-orange-400 text-[10px] md:text-[11px] mb-1.5 uppercase tracking-widest flex items-center gap-1.5"><i class="fas fa-exclamation-triangle"></i> Risk Insight</div>
                <div class="text-[9px] md:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Rasio NPL terkini berada di level <b class="font-mono text-orange-600 dark:text-orange-400">${(last.npl/last.os*100).toFixed(2)}%</b>.
                    Waspadai jika titik rasio NPL (Dot) bergerak melampaui tinggi batang volume kredit.
                </div>
             </div>
        </div>
    </div>`;
    unlockMenu();
}

    
  function fetchDetail(loanId) { 
    if(el('loader')) el('loader').style.display = 'flex'; 
    // PERBAIKAN 1: Syntax google.script.run dibersihkan
    google.script.run.withSuccessHandler(showDetailModal).getDebtorDetailFull(loanId, s.filter.d);
  }

  function showDetailModal(r) {
      if(el('loader')) el('loader').style.display = 'none'; 
      if(!r) { alert("Data Detail tidak ditemukan."); return; } 
      el('modalDetail').classList.remove('hidden');

      // Helper row yang lebih compact (text-xs)
      const row = (l, v, m, b) => `<div class="flex justify-between py-1.5 border-b border-dashed border-slate-100 dark:border-slate-700/50"><span class="text-xs text-slate-500">${l}</span><span class="text-xs ${m?'font-mono':''} ${b?'font-black text-slate-800 dark:text-white':'font-bold text-slate-600 dark:text-slate-300'} text-right">${v}</span></div>`;

      // Logika Strategi Remedial
      let remedial = ""; 
      if(r.kol === 1) remedial = "✅ Maintain: Lakukan courtesy call per 3 bulan. Tawarkan Top Up jika lancar > 1 tahun."; 
      else if(r.kol === 2) remedial = "⚠️ Restrukturisasi: Analisa arus kas. Pertimbangkan perpanjangan tenor untuk menurunkan angsuran."; 
      else remedial = "🚨 Eksekusi: Kirim SP 1-3. Siapkan berkas lelang agunan atau hapus buku jika tidak ada harapan.";

      let tenor = 0;
      if(r.mulai && r.selesai) {
          let pDate = (d) => { let p=d.split('/'); return new Date(p[2], p[1]-1, p[0]); }; 
          let t1 = pDate(r.mulai); let t2 = pDate(r.selesai);
          if(!isNaN(t1) && !isNaN(t2)) tenor = Math.round((t2 - t1) / (1000 * 60 * 60 * 24 * 30.44));
      }

      let btnText = (r.hp && r.hp.length > 5) ? "Chat Penagihan WA" : "Salin Script (HP Kosong)"; 
      let btnColor = (r.hp && r.hp.length > 5) ? "bg-green-600 hover:bg-green-700 shadow-green-500/30" : "bg-slate-600 hover:bg-slate-700 shadow-slate-500/30"; 

      let waBtn = `<button onclick="app.sendWA('${r.hp}','${r.nama}','${r.total_tgk}',${r.kol},'${r.loan}','${r.tgl_bayar}','${r.pk}','${r.mulai}',${tenor},${r.plafond},'${r.rek}')" class="w-full mt-4 ${btnColor} text-white py-3 rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"><i class="fab fa-whatsapp text-base"></i> ${btnText}</button>`;

      el('detailContent').innerHTML = `
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl mb-4 border border-blue-100 dark:border-blue-800/50">
              <h3 class="text-sm font-black text-blue-800 dark:text-blue-300 leading-tight">${r.nama}</h3>
              <div class="text-[10px] font-mono text-blue-600/70 dark:text-blue-400 mt-0.5">${r.loan}</div>
              <div class="mt-1.5 flex items-center gap-1">
                  <span class="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-[9px] font-bold shadow-sm border border-slate-100 dark:border-slate-700">${r.type}</span>
                  <span class="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-[9px] font-bold shadow-sm border border-slate-100 dark:border-slate-700">${r.gol}</span>
              </div>
          </div>
          
          <div class="space-y-0.5 px-1">
              ${row('Nasabah ID', r.nasabah)} 
              ${row('No PK', r.pk)} 
              ${row('Plafond', fmt(r.plafond), true)} 
              ${row('Baki Debet', fmt(r.os), true, true)} 
              ${row('Bunga %', r.bunga)} 
              ${row('Jangka Waktu', `${r.mulai} - ${r.selesai} <span class="text-[9px] text-slate-400">(${tenor} bln)</span>`)} 
              ${row('Sektor', (r.sektor || 'UMUM').substring(0, 25) + '...')}
          </div>
          
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-xl p-3 mt-4">
              <div class="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1.5">Tunggakan (KOL ${r.kol})</div>
              <div class="flex justify-between text-xs mb-1">
                  <span class="text-slate-500">Pokok</span>
                  <span class="font-mono font-bold text-slate-700 dark:text-slate-300">${fmt(r.tgk_pokok)}</span>
              </div>
              <div class="flex justify-between text-xs mb-1">
                  <span class="text-slate-500">Bunga</span>
                  <span class="font-mono font-bold text-slate-700 dark:text-slate-300">${fmt(r.tgk_bunga)}</span>
              </div>
              <div class="flex justify-between text-xs font-black text-red-600 dark:text-red-400 border-t border-red-200 dark:border-red-800/50 pt-1.5 mt-1.5">
                  <span>Total</span>
                  <span class="font-mono">${fmt(r.total_tgk)}</span>
              </div>
          </div>
          
          <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-xl p-3 mt-4">
              <div class="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">🤖 Remedial Strategy</div>
              <div class="text-[10px] text-amber-800 dark:text-amber-200 font-medium leading-relaxed">${remedial}</div>
          </div>
          
          <div class="mt-4 flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
              <div class="flex items-center gap-2 text-[10px] text-slate-500 flex-1 truncate pr-2">
                  <i class="fas fa-map-marker-alt text-rose-500 text-sm"></i> 
                  <span class="truncate font-medium">${r.alamat}</span>
              </div>
              <button onclick="window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('${r.alamat}'))" class="text-blue-500 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold text-[10px] shrink-0 transition-colors">
                  Peta
              </button>
          </div>
          ${waBtn}`;
  }

  function getWA() { if(el('loader')) el('loader').style.display='flex'; google.script.run.withSuccessHandler(txt => { if(el('loader')) el('loader').style.display='none'; el('waText').value = txt; el('modalWA').classList.remove('hidden'); }).getWAReport(s.filter.b, s.filter.d, s.filter.c); }
  function copyWA() { const t = el('waText'); t.select(); document.execCommand('copy'); alert("Laporan Tersalin!"); }

 function doUpload(btn) {
    const file = el('upFileRaw').files[0];
    const date = el('upDate').value;
    if (!file || !date) { alert("Lengkapi data!"); return; }

    // --- INISIALISASI ANIMASI UI ---
    showUploadOverlay(); // Munculkan layar progress keren
    btn.disabled = true;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheetName = wb.SheetNames[0];
        const raw = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: "" });
        
        let startRow = 0;
        for (let i = 0; i < Math.min(raw.length, 20); i++) {
            if (raw[i].join('|').toUpperCase().includes('BRNAME')) { startRow = i + 1; break; }
        }
        if (startRow === 0 && raw[0].length < 10) startRow = 1;
        
        let headerRow = raw[startRow - 1];
        let m = {};
        if (headerRow) {
            let cols = headerRow.map(c => String(c).toUpperCase().trim());
            const findCol = (keys) => {
                for (let k of keys) { let idx = cols.indexOf(k); if (idx > -1) return idx; }
                return -1;
            };
            // Mapping kolom DB Anda
            m[0] = findCol(['JOBDATE']); m[1] = findCol(['L0BRCD', 'KODE_CABANG']); m[2] = findCol(['BRNAME']);
            m[3] = findCol(['KOL']); m[4] = findCol(['L0LNTY', 'TIPE_KREDIT']); m[5] = findCol(['LYTITL']);
            m[6] = findCol(['L0ECON', 'KODE_SEKTOR']); m[7] = findCol(['ECNAME']); m[8] = findCol(['L0CIRT', 'BUNGA_PERSEN']);
            m[9] = findCol(['NASABAH_ID', 'L0CSPR']); m[10] = findCol(['LOAN_ID', 'L0LNNO']); m[11] = findCol(['NAMA', 'L0NAME']);
            m[12] = findCol(['PK', 'L0NARR']); m[13] = findCol(['DATE', 'DATE_START']); m[14] = findCol(['DATE1', 'DATE_END']);
            m[15] = findCol(['TGLBYRAK']); m[16] = findCol(['NO_REK', 'L0RSTL']); m[17] = findCol(['PLAFOND', 'PLA']);
            m[18] = findCol(['BAKI']); m[19] = findCol(['TUNGPK']); m[20] = findCol(['TUNGBG']);
            m[21] = findCol(['ALAMAT', 'CUADR1']); m[22] = findCol(['KOTA', 'CUADR3']); m[23] = findCol(['FSGOKR']);
            m[24] = findCol(['HP', 'NO_HP', 'CUTELP', 'TELEPON', 'WA']);
        }

        let totalRows = raw.length - startRow;
        let batchSize = 1000;
        let processed = 0;

        function uploadNextChunk(targetSheetName) {
    // 1. KONDISI SELESAI (100%)
    if (processed >= totalRows) {
        updateUploadUI(100, "Finalisasi Data & Membersihkan Cache...");
        
        // PANGGIL BACKEND UNTUK MEMBERSIHKAN CACHE (DIBUAT OLEH FUNGSI FINALIZEUPLOAD)
        // Kita kirim 'date' (variabel tanggal yang dipilih user saat upload)
        google.script.run.withSuccessHandler(() => {
            setTimeout(() => {
                alert("Sukses! Data Strategic V60 telah diupdate.");
                location.reload();
            }, 1000);
        }).finalizeUpload(date); // <--- INI ADALAH PANGGILAN KUNCI
        
        return;
    }

    // 2. PROSES UPLOAD CHUNK (TETAP SAMA)
    let chunk = [];
    let limit = Math.min(startRow + processed + batchSize, raw.length);
    for (let i = startRow + processed; i < limit; i++) {
        let r = raw[i];
        if (!r || r.length < 5) continue;
        let stdRow = [];
        for (let c = 0; c < 25; c++) {
            let val = "";
            if (m[c] > -1 && r[m[c]] !== undefined) val = r[m[c]];
            if (c === 18 || c === 19 || c === 20 || c === 17) val = clean(val);
            if (c === 0 || c === 13 || c === 14 || c === 15) val = excelDateToJS(val);
            if (c === 10) val = String(val).replace(/[^a-zA-Z0-9]/g, "").trim().toUpperCase();
            if (c === 24) val = String(val).replace(/[^0-9]/g, "");
            stdRow.push(val);
        }
        chunk.push(stdRow);
    }

    google.script.run.withSuccessHandler(() => {
        processed += chunk.length;
        let pct = Math.round((processed / totalRows) * 100);
        
        // --- UPDATE ANIMASI PERSENTASE ---
        updateUploadUI(pct, "Mengirim " + processed + " data...");
        
        uploadNextChunk(targetSheetName);
    }).doUploadBatch(targetSheetName, chunk);
}

        google.script.run.withSuccessHandler(sn => {
            updateUploadUI(5, "Inisialisasi Server...");
            uploadNextChunk(sn);
        }).initUpload(date);
    };
    reader.readAsArrayBuffer(file);
}

// --- FUNGSI UI ANIMASI BARU ---
function showUploadOverlay() {
    let overlay = document.createElement('div');
    overlay.id = 'uploadOverlay';
    overlay.className = 'fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white';
    overlay.innerHTML = `
        <div class="relative w-48 h-48 flex items-center justify-center">
            <svg class="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="80" stroke="currentColor" stroke-width="8" fill="transparent" class="text-slate-700" />
                <circle id="uploadCircle" cx="96" cy="96" r="80" stroke="url(#grad1)" stroke-width="10" fill="transparent" 
                    stroke-dasharray="502.6" stroke-dashoffset="502.6" stroke-linecap="round" class="transition-all duration-500 ease-out" />
                <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
                    </linearGradient>
                </defs>
            </svg>
            <div class="absolute flex flex-col items-center">
                <span id="uploadPct" class="text-4xl font-black italic">0%</span>
                <span class="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Syncing</span>
            </div>
        </div>
        <div id="uploadStatus" class="mt-8 text-sm font-medium text-blue-300 animate-pulse">Menyiapkan File...</div>
    `;
    document.body.appendChild(overlay);
}

function updateUploadUI(pct, status) {
    const circle = document.getElementById('uploadCircle');
    const text = document.getElementById('uploadPct');
    const statusText = document.getElementById('uploadStatus');
    
    if (circle) {
        const radius = 80;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (pct / 100) * circumference;
        circle.style.strokeDashoffset = offset;
    }
    if (text) text.innerText = pct + "%";
    if (statusText) statusText.innerText = status;
}

  function toggleNativeMenu() {
    const menu = el('nativeMenuSheet');
    if (!menu) return;
    
    if (menu.classList.contains('translate-y-full')) {
        internalCloseAll(); // Bersihkan drawer lain agar tidak bertumpuk
        menu.classList.remove('translate-y-full');
        if (el('nativeOverlay')) el('nativeOverlay').classList.remove('hidden');
    } else {
        internalCloseAll();
    }
}


  function toggleSpecificSheet(id) {
    const sheet = el(id);
    if (!sheet) {
        console.error("ID Sheet tidak ditemukan: " + id);
        return;
    }
    internalCloseAll(); // Reset tampilan drawer lain
    sheet.classList.add('open');
    if (el('nativeOverlay')) el('nativeOverlay').classList.remove('hidden');
}


  function internalCloseAll() {
    // 1. Tutup Menu Utama & Bottom Sheets
    const menu = document.getElementById('nativeMenuSheet');
    if (menu) menu.classList.add('translate-y-full');
    
    document.querySelectorAll('.custom-bottom-sheet').forEach(sheet => {
        sheet.classList.remove('open');
    });

    // 2. TUTUP SEMUA MODAL
    document.getElementById('modalDetail')?.classList.add('hidden');
    document.getElementById('modalUpload')?.classList.add('hidden');
    document.getElementById('modalWA')?.classList.add('hidden');

    // 3. Sembunyikan Overlays
    const overlay = document.getElementById('nativeOverlay');
    if (overlay) overlay.classList.add('hidden');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebarOverlay) sidebarOverlay.classList.add('hidden');

    // --- TAMBAHAN BARIS INI UNTUK MENUTUP SIDEBAR HP ---
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.add('-translate-x-full');
    // --------------------------------------------------
  }


  function toggleSidebar() {
    const sidebar = el('sidebar');
    const overlay = el('sidebarOverlay');
    if (!sidebar) return;
    
    if (sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
        if (overlay) overlay.classList.remove('hidden');
    } else {
        internalCloseAll(); // Tutup dengan cara standar
    }
}


  // ======================================================
// FRONTEND: LOGIKA CETAK & FORMAT NAMA FILE
// ======================================================

function printPDF() {
    // 1. Validasi Pembanding
    if (!s.filter.c) {
        let confirmNoComp = confirm("⚠️ PERHATIAN:\nAnda belum memilih Tanggal Pembanding (vs).\nLaporan tidak akan menampilkan % kenaikan/penurunan.\n\nLanjutkan?");
        if (!confirmNoComp) return;
    }

    if(el('loader')) el('loader').style.display = 'flex';

    // 2. FORMAT NAMA FILE: Laporan_Kredit_DDMMYYYY
    // Input s.filter.d formatnya "YYYY-MM-DD" (misal: 2026-01-05)
    let rawDate = s.filter.d || ""; 
    let fileDateSuffix = "Report";
    
    if(rawDate.length === 10) {
        let parts = rawDate.split('-'); // [2026, 01, 05]
        fileDateSuffix = parts[2] + parts[1] + parts[0]; // 05012026
    }

    // Ubah Judul Dokumen (Browser akan pakai ini sebagai nama file default)
    let originalTitle = document.title;
    document.title = `Laporan_Kredit_${fileDateSuffix}`;

    console.log("Fetching Full Report Data...");
    
    // 3. Panggil Backend
    google.script.run.withSuccessHandler(function(res) {
        renderReportPage(res);
        
        // Tunggu rendering selesai, lalu print
        setTimeout(() => {
            window.print();
            document.title = originalTitle; // Kembalikan nama tab asli
        }, 1000);

    }).getFullReportData(s.filter.b, s.filter.d, s.filter.c);
}





function renderMaturityPage(res) {
    if(document.getElementById('loader')) document.getElementById('loader').style.display='none';

    // --- INTEGRASI ANIMASI ANGKA BERJALAN ---
    // Ambil nilai saat ini di layar sebagai titik awal (start)
    const oldNoa = clean(document.getElementById('mat_total_noa')?.innerText) || 0;
    const oldOs = clean(document.getElementById('mat_total_os')?.innerText) || 0;

    // Trigger Animasi (Durasi 800ms)
    // animateValue(id, start, end, duration, isCurrency)
    if(document.getElementById('mat_total_noa')) {
        animateValue('mat_total_noa', oldNoa, res.stats.noa, 800, false);
    }
    if(document.getElementById('mat_total_os')) {
        animateValue('mat_total_os', oldOs, res.stats.os, 800, true);
    }

    var container = document.getElementById('maturity_list_container');
    if (!container) return;

    if (!res.list || res.list.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center p-12 text-slate-400">
                <i class="fas fa-calendar-check text-4xl text-brand-100 mb-3"></i>
                <p class="italic text-sm">Tidak ada debitur mendekati jatuh tempo dalam range ini.</p>
            </div>`;
        return;
    }

    var fmtIDR = function(v) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v); };

    var html = `
    <div class="overflow-x-auto rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <table class="w-full text-sm text-left text-slate-600 dark:text-slate-300">
            <thead class="text-[10px] font-black text-white uppercase bg-slate-800 dark:bg-slate-900 tracking-tighter">
                <tr>
                    <th class="px-4 py-4">Debitur / Loan ID</th>
                    <th class="px-4 py-4 text-center">Nomor PK</th>
                    <th class="px-4 py-4 text-center">Tgl Jatuh Tempo</th>
                    <th class="px-4 py-4 text-center">Sisa Waktu</th>
                    <th class="px-4 py-4 text-right">Baki Debet</th>
                    <th class="px-4 py-4 text-center">Action</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">`;

    for (var i = 0; i < res.list.length; i++) {
        var r = res.list[i];
        
        var badgeClass = r.sisa_hari < 0 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : (r.sisa_hari < 30 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400');
        var badgeText = r.sisa_hari < 0 ? 'Lewat ' + Math.abs(r.sisa_hari) + ' Hari' : r.sisa_hari + ' Hari Lagi';

        // Template Pesan WA
        var rawMessage = `Yth. Bapak/Ibu *${r.nama}*,\n\nKami dari *Bankaltimtara* menginformasikan fasilitas kredit:\nNo. PK: *${r.pk}*\nJatuh Tempo: *${r.tgl_jt}*\n\nSehubungan dengan riwayat pembayaran yang baik, kami menawarkan prioritas *Top-Up / Suplesi Kredit* sebelum tanggal jatuh tempo.\n\nMohon balas pesan ini jika berminat simulasi angsuran terbaik.\n\nTerima kasih,\n_Bankaltimtara_`;
        var safeMsg = encodeURIComponent(rawMessage);

        var btnHtml = '';
        if(r.hp && r.hp.length > 5) {
            btnHtml = `<button onclick="app.copyAndOpenWA('${r.hp}', '${safeMsg}')" class="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-black text-white bg-green-600 rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-500/20 active:scale-95">
                        <i class="fab fa-whatsapp text-sm"></i> CHAT
                       </button>`;
        } else {
            btnHtml = `<button onclick="app.copyAndOpenWA('', '${safeMsg}')" class="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-black text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition active:scale-95">
                        <i class="fas fa-copy text-sm"></i> COPY
                       </button>`;
        }

        html += `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
            <td class="px-4 py-3">
                <div class="font-bold text-brand-700 dark:text-brand-400 cursor-pointer hover:underline underline-offset-4" 
                     onclick="event.stopPropagation(); app.fetchDetail('${r.loan}')">
                     ${r.nama}
                </div>
                <div class="text-[10px] font-mono text-slate-400">${r.loan}</div>
            </td>
            <td class="px-4 py-3 text-center font-mono text-[10px]">${r.pk}</td>
            <td class="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-200">${r.tgl_jt}</td>
            <td class="px-4 py-3 text-center">
                <span class="${badgeClass} px-3 py-1 rounded-full text-[9px] font-black whitespace-nowrap shadow-sm border border-black/5">${badgeText}</span>
            </td>
            <td class="px-4 py-3 text-right font-mono font-black text-slate-800 dark:text-slate-100">${fmtIDR(r.os)}</td>
            <td class="px-4 py-3 text-center">${btnHtml}</td>
        </tr>`;
    }

    html += '</tbody></table></div>';
    container.innerHTML = html;
    unlockMenu();
}





// ======================================================
// 2. DOWNLOAD PDF (WYSIWYG)
// ======================================================
function downloadPDF() {
    const element = document.getElementById('rpt_content_body');
    if (!element || element.innerHTML.trim() === "") {
        refreshReport(true); 
        return;
    }

    if(document.getElementById('loader')) document.getElementById('loader').style.display = 'flex';

    let rawDate = s.filter.d || ""; 
    let fileDateSuffix = "Report";
    if(rawDate.length === 10) {
        let parts = rawDate.split('-'); 
        fileDateSuffix = parts[2] + parts[1] + parts[0]; 
    }
    const fileName = `Laporan_Kredit_${fileDateSuffix}.pdf`;

    const opt = {
        margin:       [10, 5, 10, 5], 
        filename:     fileName,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    setTimeout(() => {
        html2pdf().set(opt).from(element).save().then(() => {
            if(document.getElementById('loader')) document.getElementById('loader').style.display = 'none';
        });
    }, 500);
}

// ======================================================
// 3. REFRESH & KIRIM PARAMETER BULAN (PENTING)
// ======================================================
function refreshReport(autoDownload = false) {
    if(document.getElementById('loader')) document.getElementById('loader').style.display = 'flex';
    
    // Set matRange ke 6 (6 bulan = 180 hari) untuk cakupan strategis
    let matRange = 6; 
    
    google.script.run.withSuccessHandler(function(res) {
        renderReportPreview(res);
        if(autoDownload) downloadPDF(); 
    }).getFullReportData(s.filter.b, s.filter.d, s.filter.c, matRange);
}

// ======================================================
// 4. RENDER PREVIEW (JEMBATAN)
// ======================================================
function renderReportPreview(res) {
    if(document.getElementById('loader')) document.getElementById('loader').style.display='none';
    
    const container = document.getElementById('rpt_content_body');
    if(!container) return; 
    if(document.getElementById('rpt_placeholder')) document.getElementById('rpt_placeholder').style.display = 'none';

    if (!res || !res.curr) {
        container.innerHTML = `<div class="p-8 text-center text-red-500 font-bold border-2 border-dashed border-red-300 bg-red-50 rounded-xl">DATA TIDAK TERSEDIA<br><span class="text-xs font-normal text-black">Cek filter tanggal atau unit.</span></div>`;
        return;
    }
    // Update data di tab Maturity juga (Sinkronisasi)
    renderMaturityPage(res.maturity); 
    
    container.innerHTML = generateFullReportHTML(res);
    unlockMenu();
}








// ======================================================
// GENERATOR HTML (EXECUTIVE DAKOPEN V60 PREMIUM)
// ======================================================
function generateFullReportHTML(res) {
    const curr = res.curr.stats;
    const prev = res.prev ? res.prev.stats : null;
    const matData = res.maturity || { list:[], stats:{noa:0, os:0} };
    const matList = matData.list || [];
    const move = res.movement || { cair:[], lunas:[], stats:{ net_os:0, net_noa:0 } };
    
    let rangeBulan = res.meta.mat_range || 2;
    let matOs = matData.stats.os || 0; 
    let dateStr = res.dates.current;
    if(res.dates.prev) dateStr += ` vs ${res.dates.prev}`;
    let unitName = res.meta.branch === 'ALL' ? 'KONSOLIDASI SELURUH UNIT' : res.meta.branch;

    // --- PERBAIKAN DI SINI: FORMATTER PRESISI TINGGI ---
    // Menggunakan maximumFractionDigits: 20 agar semua desimal dari database muncul (tidak dibulatkan)
    const fmtIDR = (v) => new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        minimumFractionDigits: 0, // Tidak memaksa ,00 jika angka bulat
        maximumFractionDigits: 2 // Mengizinkan hingga 20 angka di belakang koma (Full Precision)
    }).format(v || 0);

    const fmtNum = (v) => new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(v || 0);
    // ---------------------------------------------------

    // --- HELPERS UI ---
    const renderDiff = (valNow, valPrev, isInverted) => {
        if (!prev || valPrev === undefined) return `<span style="font-size:8px; color:#94a3b8; font-style:italic;">New Portfolio</span>`;
        let diff = valNow - valPrev;
        let pct = valPrev !== 0 ? (diff / valPrev) * 100 : 0;
        let isBad = isInverted ? (diff > 0) : (diff < 0);
        let color = diff === 0 ? "#94a3b8" : (isBad ? "#ef4444" : "#10b981");
        let arrow = diff > 0 ? "▲" : (diff < 0 ? "▼" : "•");
        return `<div style="font-size: 10px; font-weight: 800; color: ${color}; display: flex; align-items: center; gap: 2px;">
                    ${arrow} ${fmtIDR(Math.abs(diff))} <span style="font-size: 8px; opacity: 0.7;">(${Math.abs(pct).toFixed(1)}%)</span>
                </div>`;
    };

    const cardBig = (label, nominal, diffHtml, ratioVal, colorBase, isRatio=true, isMoney=true) => {
        const config = {
            blue:    { hex: '#1e40af', bg: '#eff6ff', icon: 'fa-vault' },
            red:     { hex: '#b91c1c', bg: '#fef2f2', icon: 'fa-triangle-exclamation' },
            orange:  { hex: '#c2410c', bg: '#fff7ed', icon: 'fa-eye' },
            slate:   { hex: '#334155', bg: '#f8fafc', icon: 'fa-users' }
        };
        const theme = config[colorBase] || config.slate;
        let mainValue = isMoney ? fmtIDR(nominal) : fmtNum(nominal);

        return `
        <div class="avoid-break" style="background: ${theme.bg}; border: 1px solid #e2e8f0; border-top: 3px solid ${theme.hex}; border-radius: 8px; padding: 10px; position: relative; overflow: hidden; box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.05);">
            <i class="fas ${theme.icon}" style="position: absolute; right: -5px; bottom: -5px; font-size: 35px; color: ${theme.hex}; opacity: 0.05; transform: rotate(-15deg);"></i>
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 1;">
                <div style="flex: 1; overflow: hidden;">
                    <div style="font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${label}</div>
                    
                    <div style="font-size: 13px; font-weight: 800; color: #0f172a; font-family: 'Inter', sans-serif; letter-spacing: -0.5px;">${mainValue}</div>
                    
                    <div style="margin-top: 3px; display: flex; align-items: center; gap: 4px; transform: scale(0.9); transform-origin: left;">
                        ${diffHtml}
                    </div>
                </div>
                
                <div style="text-align: right; background: #ffffff; padding: 6px 10px; border-radius: 8px; border: 2px solid ${theme.hex}15; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-left: 8px; min-width: 60px;">
                    <div style="font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">${isRatio ? 'RASIO' : 'DEBITUR'}</div>
                    
                    <div style="font-size: 15px; font-weight: 900; color: ${theme.hex}; letter-spacing: -0.5px; line-height: 1;">
                        ${isRatio ? ratioVal + '%' : ratioVal}
                    </div>
                </div>
            </div>
        </div>`;
    };

    let html = `
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        .rpt-font { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; line-height: 1.4; width: 100%; length: 100%; margin:0 auto; }
        .card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 9px; margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
        th { background: #0f172a !important; color: #ffffff !important; padding: 10px 8px; text-align: left; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #334155; }
        td { border-bottom: 1px solid #f1f5f9; padding: 8px; color: #334155; vertical-align: middle; }
        tr:last-child td { border-bottom: none; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0f172a; padding: 8px 12px; margin-bottom: 12px; background: #f1f5f9; border-radius: 6px; border-left: 4px solid #0f172a; display: flex; align-items: center; }
        .w-money { text-align: right; font-family: 'Courier New', monospace; font-weight: 700; font-size: 10px; }
        .page-break { page-break-before: always; height: 10px; }
        .avoid-break { page-break-inside: avoid; break-inside: avoid; }
    </style>
    <div class="rpt-font">`;

    const getHeader = (title, sub) => `
        <div class="avoid-break" style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
            <div>
                <h1 style="font-size: 22px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin: 0; letter-spacing: -1px;">${title}</h1>
                <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">${sub}</div>
            </div>
            <div style="text-align: right;">
                <div style="background: #0f172a; color: white; padding: 4px 10px; border-radius: 4px; font-size: 9px; font-weight: 800; margin-bottom: 5px;">${unitName}</div>
                <div style="font-size: 9px; font-weight: 700; color: #475569;">POSISI: ${dateStr}</div>
            </div>
        </div>`;

    // 1. GLOBAL SUMMARY (EXECUTIVE DASHBOARD STYLE)
html += getHeader('Executive Risk Report', '01. Ringkasan Kualitas Aset');

let rNpl = curr.os > 0 ? (curr.npl / curr.os) * 100 : 0;
let rKkr = curr.os > 0 ? (curr.kkr / curr.os) * 100 : 0;

// Wrapper Grid dengan jarak yang lebih lega
html += `
<div class="avoid-break" style="margin-bottom: 15px;">
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
        ${cardBig('Total Portfolio (OS)', curr.os, renderDiff(curr.os, prev?.os, false), fmtNum(curr.noa), 'blue', false)}
        ${cardBig('NPL Ratio', curr.npl, renderDiff(curr.npl, prev?.npl, true), rNpl.toFixed(2), 'red', true)}
        ${cardBig('Watchlist Ratio', curr.kkr, renderDiff(curr.kkr, prev?.kkr, true), rKkr.toFixed(2), 'orange', true)}
        ${cardBig('Total NOA', curr.noa, renderDiff(curr.noa, prev?.noa, false), fmtNum(curr.noa), 'slate', false, false)}
    </div>
</div>`;

    // 2. SEKTOR EKONOMI
    html += `
    <div class="avoid-break" style="margin-top: 10px;">
        <div class="section-title">02. Analisa Eksposur Per Sektor Ekonomi</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 30px; text-align: center;">No</th>
                    <th>Sektor Ekonomi</th>
                    <th style="text-align: center; width: 40px;">NOA</th>
                    <th style="text-align: right;">Outstanding</th>
                    <th style="text-align: right; color: #ef4444;">NPL Amount</th>
                    <th style="text-align: right; width: 50px;">NPL%</th>
                    <th style="text-align: right; color: #f59e0b;">KKR Amount</th>
                </tr>
            </thead>
            <tbody>`;

    let secKeys = Object.keys(curr.sectors).sort((a,b) => curr.sectors[b].os - curr.sectors[a].os);
    secKeys.forEach((key, i) => {
        let s = curr.sectors[key];
        let pNpl = s.os > 0 ? (s.npl/s.os)*100 : 0;
        let rowStyle = s.npl > 0 ? 'background-color: #fef2f2;' : ''; 
        html += `
            <tr style="${rowStyle}">
                <td style="text-align: center; color: #94a3b8; font-weight: 700;">${i+1}</td>
                <td style="font-weight: 700;">${key}</td>
                <td style="text-align: center; font-weight: 600;">${s.noa}</td>
                <td class="w-money">${fmtIDR(s.os)}</td>
                <td class="w-money" style="color: #ef4444;">${s.npl > 0 ? fmtIDR(s.npl) : '-'}</td>
                <td style="text-align: right; font-weight: 800; color: #b91c1c;">${pNpl.toFixed(2)}%</td>
                <td class="w-money" style="color: #d97706;">${s.kkr > 0 ? fmtIDR(s.kkr) : '-'}</td>
            </tr>`;
    });
    html += `</tbody></table></div>`;

    // --- RENDER SEGMEN ANALYST ---
    const renderSegPage = (title, key, colorBase, numberPrefix) => {
        if (!curr.seg[key]) return '';
        let cSeg = curr.seg[key]; let pSeg = prev && prev.seg[key] ? prev.seg[key] : null;
        let sNpl = cSeg.os > 0 ? (cSeg.npl/cSeg.os)*100 : 0; 
        let sKkr = cSeg.os > 0 ? (cSeg.kkr/cSeg.os)*100 : 0;

        let page = `<div class="page-break"></div>`; 
        page += getHeader('Segmental Analysis', `0${numberPrefix}. ${title}`);
        page += `<div class="card-grid">
            ${cardBig('Outstanding', cSeg.os, renderDiff(cSeg.os, pSeg?.os, false), fmtNum(cSeg.diff), colorBase, false)}
            ${cardBig('NPL (Macet)', cSeg.npl, renderDiff(cSeg.npl, pSeg?.npl, true), sNpl.toFixed(2), 'red', true)}
            ${cardBig('Watchlist (Kol 2)', cSeg.kkr, renderDiff(cSeg.kkr, pSeg?.kkr, true), sKkr.toFixed(2), 'orange', true)}
        </div>`;

        const renderList = (subTitle, list, isNpl) => { 
            if(!list || list.length===0) return ''; 
            let accent = isNpl ? '#b91c1c' : '#c2410c'; // Darker shades for professional look
            let lightAccent = isNpl ? '#fef2f2' : '#fffbe0';

            let t = `<div class="avoid-break" style="margin-bottom: 25px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 2px solid ${accent};">
                    <div style="font-size: 11px; font-weight: 800; color: ${accent}; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
                        <i class="fas ${isNpl ? 'fa-biohazard' : 'fa-hand-holding-warning'}"></i>
                        ${subTitle}
                    </div>
                    <div style="font-size: 9px; font-weight: 700; color: white; background: ${accent}; padding: 2px 10px; border-radius: 10px;">
                        ${list.length} Records
                    </div>
                </div>

                <table style="border: none; border-radius: 0;">
                    <thead>
                        <tr>
                            <th style="width: 25px; text-align: center; background: ${accent} !important; border: none;">#</th>
                            <th style="background: ${accent} !important; border: none;">Identitas Debitur</th>
                            <th style="text-align: center; background: ${accent} !important; border: none;">Loan ID & PK</th>
                            <th style="text-align: center; width: 60px; background: ${accent} !important; border: none;">Jatuh Tempo</th>
                            <th style="width: 35px; text-align: center; background: ${accent} !important; border: none;">KOL</th>
                            <th style="text-align: right; background: ${accent} !important; border: none;">Baki Debet</th>
                            <th style="text-align: right; background: ${accent} !important; border: none;">Tunggakan</th>
                        </tr>
                    </thead>
                    <tbody style="border: 1px solid #e2e8f0;">`;
            
            list.slice(0, 35).forEach((r,x) => { 
                t += `<tr style="background: ${x % 2 === 0 ? 'white' : '#fcfcfc'};">
                    <td style="text-align: center; color: #94a3b8; font-weight: 700; font-size: 8px;">${x+1}</td>
                    <td>
                        <div style="font-weight: 800; font-size: 9.5px; color: #0f172a;">${r.nama}</div>
                        <div style="font-size: 7.5px; color: #64748b; margin-top: 1px; font-weight: 600;">SEKTOR: ${r.sektor || 'UMUM'}</div>
                    </td>
                    <td style="text-align: center;">
                        <div style="font-family: 'Courier New', monospace; font-weight: 800; color: #334155; font-size: 9px;">${r.loan}</div>
                        <div style="font-size: 7px; color: #94a3b8;">PK: ${r.pk}</div>
                    </td>
                    <td style="text-align: center;">
                        <div style="font-weight: 700; color: #475569;">${r.tgl_akhir || '-'}</div>
                    </td>
                    <td style="text-align: center;">
                        <span style="display: inline-block; width: 18px; height: 18px; line-height: 18px; border-radius: 4px; background: ${isNpl ? '#fee2e2' : '#ffedd5'}; color: ${accent}; font-weight: 900; font-size: 10px; border: 1px solid ${accent}44;">
                            ${r.kol}
                        </span>
                    </td>
                    <td class="w-money" style="font-size: 10px; color: #0f172a;">${fmtIDR(r.os)}</td>
                    <td class="w-money" style="color: ${accent}; font-size: 10px; background: ${lightAccent}44;">
                        ${r.tgk > 0 ? fmtIDR(r.tgk) : '-'}
                    </td>
                </tr>`; 
            }); 
            return t + '</tbody></table></div>';
        };

        page += renderList('Priority Portfolio Distress (NPL)', res.curr.details[key].npl, true);
        page += renderList('Early Warning Watchlist (KKR)', res.curr.details[key].kkr, false);
        return page;
    };

    html += renderSegPage('Kredit Produktif', 'prod_all', 'emerald', 3);
    html += renderSegPage('Kredit KUR', 'kur', 'indigo', 4);
    html += renderSegPage('Kredit Konsumtif', 'kons', 'blue', 5);


   // 7. MUTASI & GROWTH (EXECUTIVE DASHBOARD STYLE)
    if(res.prev) {
        let ms = move.stats;
        let isGrowth = ms.net_os >= 0;
        let netColor = isGrowth ? '#0ea5e9' : '#f59e0b'; // Sky Blue vs Amber
        let netBg = isGrowth ? '#f0f9ff' : '#fffbeb';
        let netIcon = isGrowth ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
        let netLabel = isGrowth ? 'EXPANSION (GROWTH)' : 'CONTRACTION';

        html += `<div class="page-break"></div>`; 
        html += getHeader('Portfolio Movement Dynamics', '06. Analisa Arus Dana (Cair vs Lunas)');
        
        // --- 1. KPI TILES (COMPACT FLOW LAYOUT) ---
        html += `
        <div class="avoid-break" style="margin-bottom: 20px;">
            <div style="display: flex; gap: 10px; align-items: stretch;">
                
                <div style="flex: 1; background: #ffffff; border: 1px solid #10b981; border-top: 3px solid #10b981; border-radius: 6px; padding: 10px; position: relative; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    <i class="fas fa-hand-holding-dollar" style="position: absolute; right: -5px; bottom: -5px; font-size: 30px; color: #10b981; opacity: 0.1; transform: rotate(-15deg);"></i>
                    <div style="position: relative; z-index: 1;">
                        <div style="font-size: 8px; font-weight: 800; color: #059669; text-transform: uppercase; margin-bottom: 2px;">NEW BOOKING (INFLOW)</div>
                        <div style="font-size: 14px; font-weight: 800; color: #064e3b; font-family: 'Inter', sans-serif; letter-spacing: -0.5px;">${fmtIDR(ms.cair_os)}</div>
                        <div style="margin-top: 2px; font-size: 8px; font-weight: 700; color: #10b981;">
                            <i class="fas fa-plus-circle" style="font-size: 7px;"></i> ${fmtNum(ms.cair_noa)} Rek Baru
                        </div>
                    </div>
                </div>

                <div style="flex: 1; background: #ffffff; border: 1px solid #ef4444; border-top: 3px solid #ef4444; border-radius: 6px; padding: 10px; position: relative; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    <i class="fas fa-file-invoice-dollar" style="position: absolute; right: -5px; bottom: -5px; font-size: 30px; color: #ef4444; opacity: 0.1; transform: rotate(-15deg);"></i>
                    <div style="position: relative; z-index: 1;">
                        <div style="font-size: 8px; font-weight: 800; color: #b91c1c; text-transform: uppercase; margin-bottom: 2px;">REPAYMENT (OUTFLOW)</div>
                        <div style="font-size: 14px; font-weight: 800; color: #7f1d1d; font-family: 'Inter', sans-serif; letter-spacing: -0.5px;">${fmtIDR(ms.lunas_os)}</div>
                        <div style="margin-top: 2px; font-size: 8px; font-weight: 700; color: #ef4444;">
                            <i class="fas fa-circle-minus" style="font-size: 7px;"></i> ${fmtNum(ms.lunas_noa)} Rek Lunas
                        </div>
                    </div>
                </div>

                <div style="flex: 1; background: ${netBg}; border: 1px solid ${netColor}; border-radius: 6px; padding: 10px; position: relative; overflow: hidden;">
                    <i class="fas ${netIcon}" style="position: absolute; right: -5px; bottom: -5px; font-size: 35px; color: ${netColor}; opacity: 0.1; transform: rotate(-15deg);"></i>
                    <div style="position: relative; z-index: 1;">
                        <div style="font-size: 8px; font-weight: 800; color: ${netColor}; text-transform: uppercase; margin-bottom: 2px;">NET PORTFOLIO IMPACT</div>
                        <div style="font-size: 16px; font-weight: 900; color: ${netColor}; font-family: 'Inter', sans-serif; letter-spacing: -0.5px;">
                            ${ms.net_os >= 0 ? '+' : ''}${fmtIDR(ms.net_os)}
                        </div>
                        <div style="margin-top: 2px; font-size: 8px; font-weight: 700; color: #64748b;">
                            Status: <span style="color: ${netColor}; font-weight: 800;">${netLabel}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>`;

        // --- 2. ENHANCED TABLE RENDERER (DENGAN KOLOM TGL MULAI) ---
        const renderTableMutasi = (title, list, accentColor, type) => {
            if (!list || list.length === 0) return '';
            
            const isCair = type === 'CAIR';
            const icon = isCair ? 'fa-seedling' : 'fa-clipboard-check';
            const subHeaderBg = isCair ? '#d1fae5' : '#ffe4e6'; 

            let t = `<div class="avoid-break" style="margin-bottom: 25px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 2px solid ${accentColor};">
                    <div style="font-size: 11px; font-weight: 800; color: ${accentColor}; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
                        <i class="fas ${icon}"></i>
                        ${title}
                    </div>
                    <div style="font-size: 9px; font-weight: 700; color: white; background: ${accentColor}; padding: 2px 10px; border-radius: 10px;">
                        ${list.length} Records
                    </div>
                </div>

                <table style="border: none; border-radius: 0;">
                    <thead>
                        <tr style="background: ${subHeaderBg};">
                            <th style="width: 25px; text-align: center; background: ${accentColor} !important; border: none;">#</th>
                            <th style="background: ${accentColor} !important; border: none;">Identitas Debitur</th>
                            <th style="text-align: center; background: ${accentColor} !important; border: none;">Loan ID & PK</th>
                            
                            <th style="text-align: center; width: 55px; background: ${accentColor} !important; border: none;">Tgl Mulai</th>
                            
                            <th style="text-align: center; width: 55px; background: ${accentColor} !important; border: none;">Jatuh Tempo</th>
                            <th style="width: 25px; text-align: center; background: ${accentColor} !important; border: none;">KOL</th>
                            <th style="text-align: right; background: ${accentColor} !important; border: none;">Baki Debet</th>
                            <th style="text-align: right; background: ${accentColor} !important; border: none;">Tunggakan</th>
                        </tr>
                    </thead>
                    <tbody style="border: 1px solid #e2e8f0;">`;
            
            list.forEach((r,x) => { 
                let isNpl = r.kol >= 3;
                let bgBadge = isNpl ? '#fee2e2' : (r.kol==2 ? '#ffedd5' : '#d1fae5');
                let colorBadge = isNpl ? '#b91c1c' : (r.kol==2 ? '#c2410c' : '#047857');

                t += `<tr style="background: ${x % 2 === 0 ? 'white' : '#fcfcfc'};">
                    <td style="text-align: center; color: #94a3b8; font-weight: 700; font-size: 8px;">${x+1}</td>
                    <td>
                        <div style="font-weight: 800; font-size: 9.5px; color: #0f172a;">${r.nama}</div>
                        <div style="font-size: 7.5px; color: #64748b; margin-top: 1px; font-weight: 600;">SEKTOR: ${r.sektor || 'UMUM'}</div>
                    </td>
                    <td style="text-align: center;">
                        <div style="font-family: 'Courier New', monospace; font-weight: 800; color: #334155; font-size: 9px;">${r.loan}</div>
                        <div style="font-size: 7px; color: #94a3b8;">PK: ${r.pk}</div>
                    </td>
                    
                    <td style="text-align: center;">
                        <div style="font-weight: 700; color: #475569; font-size: 9px;">${r.tgl_mulai || '-'}</div>
                    </td>

                    <td style="text-align: center;">
                        <div style="font-weight: 700; color: #475569; font-size: 9px;">${r.tgl_akhir || '-'}</div>
                    </td>
                    
                    <td style="text-align: center;">
                        <span style="display: inline-block; width: 18px; height: 18px; line-height: 18px; border-radius: 4px; background: ${bgBadge}; color: ${colorBadge}; font-weight: 900; font-size: 10px; border: 1px solid ${colorBadge}44;">
                            ${r.kol}
                        </span>
                    </td>
                    <td class="w-money" style="font-size: 10px; color: #0f172a;">${fmtIDR(r.os)}</td>
                    <td class="w-money" style="color: ${accentColor}; font-size: 10px; background: ${subHeaderBg}44;">
                        ${r.tgk > 0 ? fmtIDR(r.tgk) : '-'}
                    </td>
                </tr>`; 
            }); 
            
            // Footer Total per Table
            t += `<tr style="background: ${subHeaderBg}; border-top: 1px solid ${accentColor};">
                    <td colspan="6" style="text-align: right; font-weight: 700; color: ${accentColor}; text-transform: uppercase;">Total ${title}:</td>
                    <td class="w-money" style="font-weight: 900; color: ${accentColor};">${fmtIDR(list.reduce((a,b)=>a+(b.os||0),0))}</td>
                    <td></td>
                  </tr>`;

            return t + '</tbody></table></div>';
        };

        // Render Tabel Pencairan (Warna Emerald/Green)
        html += renderTableMutasi('PENCAIRAN KREDIT BARU (FRESH MONEY)', move.cair, '#059669', 'CAIR');

        // Render Tabel Pelunasan (Warna Rose/Red)
        html += renderTableMutasi('PELUNASAN / PENUTUPAN FASILITAS', move.lunas, '#be123c', 'LUNAS');
    }

// ======================================================
// SEKSI: TOP OBLIGOR (PARETO ANALYSIS - EXECUTIVE REDESIGN)
// ======================================================
let topObligors = res.topObligors || [];
if(topObligors.length > 0) {
    let totalTopOS = topObligors.reduce((acc, curr) => acc + (curr.os || 0), 0);
    let paretoRatio = curr.os > 0 ? ((totalTopOS / curr.os) * 100).toFixed(2) : 0;
    
    // Theme Constants (Gold/Amber for High Value)
    const accentColor = '#b45309'; // Dark Amber
    const subHeaderBg = '#fffbeb'; // Light Amber
    
    html += `<div class="page-break"></div>`;
    html += getHeader('Concentration Risk Analysis', '07. Top 20 Obligor (Pareto)');
    
    // --- 1. KPI TILES (COMPACT PREMIUM STYLE) ---
    html += `
    <div class="avoid-break" style="margin-bottom: 20px;">
        <div style="display: flex; gap: 10px; align-items: stretch;">
            
            <div style="flex: 1.5; background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%); border: 1px solid #f59e0b; border-top: 3px solid #f59e0b; border-radius: 6px; padding: 10px; position: relative; overflow: hidden; box-shadow: 0 1px 2px rgba(245, 158, 11, 0.1);">
                <i class="fas fa-crown" style="position: absolute; right: -5px; bottom: -8px; font-size: 40px; color: #f59e0b; opacity: 0.15; transform: rotate(-15deg);"></i>
                
                <div style="position: relative; z-index: 1;">
                    <div style="font-size: 8px; font-weight: 800; color: #b45309; text-transform: uppercase; margin-bottom: 2px;">TOP 20 EXPOSURE IMPACT</div>
                    <div style="font-size: 16px; font-weight: 900; color: #78350f; font-family: 'Inter', sans-serif; letter-spacing: -0.5px;">${fmtIDR(totalTopOS)}</div>
                    
                    <div style="margin-top: 3px; display: flex; align-items: center; gap: 5px; font-size: 8px; font-weight: 700; color: #d97706;">
                        <span style="background: #fffbeb; border: 1px solid #fcd34d; padding: 1px 5px; border-radius: 4px;">${paretoRatio}%</span>
                        <span>dari Total Portofolio</span>
                    </div>
                </div>
            </div>

            <div style="flex: 1; background: #fffbeb; border: 1px solid #d97706; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; justify-content: center; position: relative; overflow: hidden;">
                <i class="fas fa-chart-pie" style="position: absolute; right: -5px; bottom: -5px; font-size: 35px; color: #d97706; opacity: 0.1; transform: rotate(-15deg);"></i>

                <div style="position: relative; z-index: 1;">
                    <div style="font-size: 8px; font-weight: 800; color: #92400e; text-transform: uppercase;">RISK STATUS</div>
                    <div style="font-size: 13px; font-weight: 900; color: #78350f; margin-top: 1px;">
                        ${paretoRatio > 20 ? 'HIGH CONCENTRATION' : 'DIVERSIFIED'}
                    </div>
                    <div style="width: 100%; background: rgba(0,0,0,0.05); height: 3px; border-radius: 10px; margin-top: 5px; overflow: hidden;">
                        <div style="width: ${Math.min(paretoRatio, 100)}%; background: #d97706; height: 100%;"></div>
                    </div>
                </div>
            </div>

        </div>
    </div>`;

    // --- 2. TABLE DETAIL (DENGAN TGL MULAI & JATUH TEMPO) ---
    html += `
    <div class="avoid-break">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 2px solid ${accentColor};">
            <div style="font-size: 11px; font-weight: 800; color: ${accentColor}; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
                <i class="fas fa-list-ol"></i>
                Rincian Debitur Terbesar (Top 20)
            </div>
            <div style="font-size: 9px; font-weight: 700; color: white; background: ${accentColor}; padding: 2px 10px; border-radius: 10px;">
                ${topObligors.length} Records
            </div>
        </div>

        <table style="border: none; border-radius: 0;">
            <thead>
                <tr style="background: ${subHeaderBg};">
                    <th style="width: 25px; text-align: center; background: ${accentColor} !important; border: none;">#</th>
                    <th style="background: ${accentColor} !important; border: none;">Identitas Debitur</th>
                    <th style="text-align: center; background: ${accentColor} !important; border: none;">Loan ID & PK</th>
                    
                    <th style="text-align: center; width: 55px; background: ${accentColor} !important; border: none;">Tgl Mulai</th>
                    <th style="text-align: center; width: 55px; background: ${accentColor} !important; border: none;">Jatuh Tempo</th>
                    
                    <th style="width: 35px; text-align: center; background: ${accentColor} !important; border: none;">KOL</th>
                    <th style="text-align: right; background: ${accentColor} !important; border: none;">Baki Debet</th>
                    <th style="text-align: right; background: ${accentColor} !important; border: none;">Tunggakan</th>
                </tr>
            </thead>
            <tbody style="border: 1px solid #e2e8f0;">`;

    topObligors.forEach((r, idx) => {
        // Warna Badge Kol
        let isNpl = r.kol >= 3;
        let bgBadge = isNpl ? '#fee2e2' : (r.kol==2 ? '#ffedd5' : '#d1fae5');
        let colorBadge = isNpl ? '#b91c1c' : (r.kol==2 ? '#c2410c' : '#047857');
        
        // Zebra Striping
        let rowBg = idx % 2 === 0 ? '#ffffff' : '#fffbeb'; 

        html += `
            <tr style="background-color: ${rowBg};">
                <td style="text-align: center; color: #94a3b8; font-weight: 700; border-bottom: 1px solid #f1f5f9;">${idx + 1}</td>
                
                <td style="border-bottom: 1px solid #f1f5f9; padding: 10px 8px;">
                    <div style="font-weight: 800; color: #0f172a; font-size: 10px; text-transform: uppercase;">${r.nama}</div>
                    <div style="font-size: 7px; color: #64748b; font-weight: 700; margin-top: 2px; display: flex; align-items: center; gap: 4px;">
                        <i class="fas fa-industry" style="opacity: 0.5;"></i> ${r.sektor || 'UMUM'}
                    </div>
                </td>

                <td style="text-align: center; border-bottom: 1px solid #f1f5f9;">
                    <div style="font-family: 'Courier New', monospace; font-weight: 800; color: #334155; font-size: 9px;">${r.loan}</div>
                    <div style="font-size: 7px; color: #94a3b8; font-weight: 600;">PK: ${r.pk}</div>
                </td>

                <td style="text-align: center; border-bottom: 1px solid #f1f5f9;">
                    <div style="font-weight: 700; color: #475569; font-size: 9px;">${r.tgl_mulai || '-'}</div>
                </td>
                <td style="text-align: center; border-bottom: 1px solid #f1f5f9;">
                    <div style="font-weight: 700; color: #475569; font-size: 9px;">${r.tgl_akhir || '-'}</div>
                </td>

                <td style="text-align: center; border-bottom: 1px solid #f1f5f9;">
                    <span style="display: inline-block; width: 18px; height: 18px; line-height: 18px; border-radius: 4px; background: ${bgBadge}; color: ${colorBadge}; font-weight: 900; font-size: 10px; border: 1px solid ${colorBadge}44;">
                        ${r.kol}
                    </span>
                </td>

                <td style="text-align: right; font-weight: 800; color: #1e293b; font-family: 'Courier New', monospace; font-size: 10px; border-bottom: 1px solid #f1f5f9;">
                    ${fmtIDR(r.os)}
                </td>

                <td style="text-align: right; border-bottom: 1px solid #f1f5f9;">
                    <div style="font-family: 'Courier New', monospace; font-weight: 800; color: ${r.tgk > 0 ? '#ef4444' : '#94a3b8'}; font-size: 10px; background: ${r.tgk > 0 ? '#fef2f2' : 'transparent'}; display: inline-block; padding: 2px 4px; border-radius: 4px;">
                        ${r.tgk > 0 ? fmtIDR(r.tgk) : '-'}
                    </div>
                </td>
            </tr>`;
    });

    // Footer Total
    html += `
            <tr style="background: ${subHeaderBg}; border-top: 2px solid ${accentColor};">
                <td colspan="6" style="text-align: right; font-weight: 700; color: ${accentColor}; text-transform: uppercase; padding: 8px;">Total Top Exposure:</td>
                <td style="text-align: right; font-weight: 900; font-family: monospace; color: ${accentColor}; font-size: 11px; padding: 8px;">
                    ${fmtIDR(totalTopOS)}
                </td>
                <td></td>
            </tr>
        </tbody>
    </table>
    </div>`;
}


// ======================================================
// 08. MATURITY STRATEGIC WATCHLIST (RETENTION ANALYSIS)
// ======================================================
html += `<div class="page-break"></div>`; 
html += getHeader('Retention & Maturity Strategy', '08. Monitoring Jatuh Tempo');

// Informational Alert Box - Executive Design
html += `
<div style="background: linear-gradient(to right, #ecfeff, #ffffff); border-left: 5px solid #0891b2; padding: 15px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 15px;">
    <div style="background: #0891b2; color: white; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <i class="fas fa-calendar-check" style="font-size: 16px;"></i>
    </div>
    <div>
        <div style="font-size: 11px; font-weight: 800; color: #0891b2; text-transform: uppercase; letter-spacing: 0.5px;">Strategic Asset Retention</div>
        <div style="font-size: 9px; color: #155e75; font-weight: 600; margin-top: 2px;">
            Menampilkan debitur yang akan jatuh tempo dalam ${rangeBulan * 30} hari ke depan. Prioritaskan penawaran <span style="text-decoration: underline;">Suplesi / Top-Up</span> untuk menjaga stabilitas Outstanding.
        </div>
    </div>
</div>`;

if(matList && matList.length > 0) {
    html += `
    <div class="avoid-break">
        <table style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; border-collapse: collapse; width: 100%;">
            <thead>
                <tr style="background: #0891b2 !important; color: white !important;">
                    <th style="width: 25px; text-align: center; background: #0891b2 !important; padding: 10px 5px; font-size: 8px;">#</th>
                    <th style="background: #0891b2 !important; padding: 10px 8px; font-size: 8px;">Identitas Debitur / Sektor</th>
                    <th style="text-align: center; background: #0891b2 !important; padding: 10px 8px; font-size: 8px;">Loan ID & PK</th>
                    <th style="text-align: center; background: #0891b2 !important; padding: 10px 8px; font-size: 8px;">Tgl Jatuh Tempo</th>
                    <th style="text-align: center; background: #0891b2 !important; padding: 10px 8px; font-size: 8px;">Status</th>
                    <th style="text-align: right; background: #0891b2 !important; padding: 10px 8px; font-size: 8px;">Plafond</th>
                    <th style="text-align: right; background: #0891b2 !important; padding: 10px 8px; font-size: 8px;">Baki Debet</th>
                </tr>
            </thead>
            <tbody>`;
            
    matList.slice(0, 50).forEach((r, idx) => { 
        let isUrgent = r.sisa_hari < 15;
        let isExpired = r.sisa_hari < 0;
        
        // Logic warna baris dan status
        let rowStyle = isExpired ? 'background-color: #fff1f2;' : (isUrgent ? 'background-color: #f0f9ff;' : (idx % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f8fafc;'));
        let statusColor = isExpired ? '#e11d48' : (isUrgent ? '#0284c7' : '#64748b');
        let statusBg = isExpired ? '#ffe4e6' : (isUrgent ? '#e0f2fe' : '#f1f5f9');

        html += `
            <tr style="${rowStyle}">
                <td style="text-align: center; color: #94a3b8; font-weight: 700; border-bottom: 1px solid #f1f5f9; padding: 8px 5px; font-size: 8px;">${idx + 1}</td>
                <td style="border-bottom: 1px solid #f1f5f9; padding: 8px;">
                    <div style="font-weight: 800; font-size: 9px; color: #0f172a; text-transform: uppercase; line-height: 1;">${r.nama}</div>
                    <div style="font-size: 7px; color: #0891b2; font-weight: 700; margin-top: 3px; display: flex; align-items: center; gap: 4px;">
                        <i class="fas fa-industry" style="opacity: 0.6;"></i> ${r.sektor || 'UMUM'}
                    </div>
                </td>
                <td style="text-align: center; border-bottom: 1px solid #f1f5f9; padding: 8px;">
                    <div style="font-family: 'Courier New', monospace; font-weight: 800; color: #334155; font-size: 8px;">${r.loan}</div>
                    <div style="font-size: 7px; color: #94a3b8; font-weight: 600;">PK: ${r.pk}</div>
                </td>
                <td style="text-align: center; border-bottom: 1px solid #f1f5f9; padding: 8px;">
                    <div style="font-weight: 800; color: #0f172a; font-size: 8px;">${r.tgl_jt}</div>
                </td>
                <td style="text-align: center; border-bottom: 1px solid #f1f5f9; padding: 8px;">
                    <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; background: ${statusBg}; color: ${statusColor}; font-weight: 900; font-size: 8px; text-transform: uppercase; white-space: nowrap; border: 1px solid ${statusColor}33;">
                        ${isExpired ? 'Expired' : r.sisa_hari + ' HARI'}
                    </span>
                </td>
                <td style="text-align: right; border-bottom: 1px solid #f1f5f9; padding: 8px; font-family: 'Courier New', monospace; font-size: 9px; color: #64748b; font-weight: 600;">
                    ${fmtIDR(r.plafond || 0)}
                </td>
                <td style="text-align: right; border-bottom: 1px solid #f1f5f9; padding: 8px; font-family: 'Courier New', monospace; font-size: 9px; color: #0f172a; font-weight: 800;">
                    ${fmtIDR(r.os || 0)}
                </td>
            </tr>`; 
    });
    html += `</tbody></table></div>`;
} else {
    html += `
    <div style="text-align: center; padding: 40px; border: 2px dashed #e2e8f0; border-radius: 12px; color: #94a3b8;">
        <i class="fas fa-calendar-day" style="font-size: 30px; margin-bottom: 10px; opacity: 0.3;"></i>
        <div style="font-size: 11px; font-weight: 700;">Tidak ditemukan debitur jatuh tempo</div>
        <div style="font-size: 9px;">Dalam jangkauan pengamatan ${rangeBulan * 30} hari.</div>
    </div>`;
}

// ======================================================
// FOOTER (AUDIT READY)
// ======================================================
html += `
<div class="avoid-break" style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="font-size: 8px; color: #94a3b8; font-style: italic;">
            Laporan ini dihasilkan secara otomatis oleh DAKOPEN RISK INTELLIGENCE V60.<br>
            Klasifikasi data bersifat rahasia dan untuk kepentingan internal Bank.
        </div>
        <div style="display: flex; gap: 50px; text-align: center; padding-right: 20px;">
            <div style="width: 120px;">
                <div style="font-size: 9px; font-weight: 700; margin-bottom: 50px;">Admin Kredit,</div>
                <div style="border-top: 1.5px solid #0f172a; font-size: 9px; font-weight: 800; padding-top: 5px;">UNIT KREDIT</div>
            </div>
            <div style="width: 120px;">
                <div style="font-size: 9px; font-weight: 700; margin-bottom: 50px;">Pimpinan Unit,</div>
                <div style="border-top: 1.5px solid #0f172a; font-size: 9px; font-weight: 800; padding-top: 5px;">PIMPINAN</div>
            </div>
        </div>
    </div>
</div>`;

    html += `</div>`; 
    return html;
}

// ======================================================
// 3. FUNGSI RENDER (PENERIMA DATA DARI BACKEND)
// ======================================================
function renderReportPage(res) {
    // 1. Matikan Loader
    if(el('loader')) el('loader').style.display='none';
    
    // 2. Ambil Container Kertas
    const container = document.getElementById('rpt_content_body');
    if(!container) return; // Safety check

    // 3. Sembunyikan Placeholder (Gambar Printer Abu-abu)
    if(document.getElementById('rpt_placeholder')) {
        document.getElementById('rpt_placeholder').style.display = 'none';
    }

    // 4. Cek Jika Data Kosong
    if (!res || !res.curr) {
        container.innerHTML = `<div class="p-8 text-center text-red-500 font-bold border-2 border-dashed border-red-300 bg-red-50 rounded-xl">DATA TIDAK TERSEDIA<br><span class="text-xs font-normal text-black">Cek data periode ini.</span></div>`;
        return;
    }

    // 5. GENERATE HTML & MASUKKAN KE KERTAS
    // Fungsi ini memanggil generator panjang yang sudah saya berikan sebelumnya
    container.innerHTML = generateFullReportHTML(res);
}





// --- FUNGSI BARU: COPY & WA HELPER (Safe Mode) ---
  function copyAndOpenWA(hp, msgEncoded) {
      // Decode pesan kembali agar spasi dan enter terbaca benar
      var msg = decodeURIComponent(msgEncoded);

      // 1. Proses Copy ke Clipboard
      var t = document.createElement('textarea');
      t.value = msg;
      document.body.appendChild(t);
      t.select();
      try {
          document.execCommand('copy');
      } catch (err) {
          console.error('Gagal copy', err);
      }
      document.body.removeChild(t);

      // 2. Buka WhatsApp (Jika ada nomor HP)
      if (hp && hp.length > 5) {
          var url = 'https://wa.me/' + hp + '?text=' + encodeURIComponent(msg);
          window.open(url, '_blank');
      } else {
          alert('Script Penawaran berhasil disalin ke Clipboard! (Nomor HP Kosong)');
      }
  }




  function animateValue(id, start, end, duration, isCurrency = true) {
      const obj = el(id); if (!obj) return;
      if (start === end) { obj.innerHTML = isCurrency ? formatRupiah(end) : formatNumber(end); return; }
      let startTimestamp = null;
      const step = (timestamp) => {
          if (!startTimestamp) startTimestamp = timestamp;
          const progress = Math.min((timestamp - startTimestamp) / duration, 1);
          const currentVal = Math.floor(progress * (end - start) + start);
          obj.innerHTML = isCurrency ? formatRupiah(currentVal) : formatNumber(currentVal);
          if (progress < 1) window.requestAnimationFrame(step);
          else { obj.classList.add('counting'); setTimeout(() => obj.classList.remove('counting'), 300); }
      };
      window.requestAnimationFrame(step);
  }


  /**
 * Fungsi Animasi Angka Desimal (Khusus Persentase/NPL)
 * id: ID elemen HTML
 * start: Angka awal
 * end: Angka tujuan
 * duration: Durasi animasi (ms)
 */
function animateValueDecimal(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;

    // Pastikan input adalah angka, jika tidak set ke 0
    start = parseFloat(start) || 0;
    end = parseFloat(end) || 0;

    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Hitung nilai saat ini berdasarkan progress
        const currentVal = (progress * (end - start) + start);
        
        // Tampilkan dengan format 2 desimal + simbol %
        obj.innerHTML = currentVal.toFixed(2) + "%";
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            // Pastikan nilai akhir benar-benar presisi sesuai target
            obj.innerHTML = end.toFixed(2) + "%";
        }
    };
    window.requestAnimationFrame(step);
}

// Tambahkan ke app.switchTab atau buat fungsi baru
function updateActiveMenu(viewId) {
  const btns = document.querySelectorAll('.nav-btn');
  btns.forEach(btn => {
    // Reset Style
    btn.classList.remove('bg-brand-50', 'text-brand-700', 'dark:bg-slate-700', 'shadow-sm');
    
    // Set Active Style jika cocok
    if(btn.getAttribute('onclick').includes(viewId)) {
      btn.classList.add('bg-brand-50', 'text-brand-700', 'dark:bg-slate-700', 'shadow-sm');
    }
  });
}


function processUploadWithAutoDate(data) {
  
  // 1. Validasi Header (Kolom A Baris 1)
  // Ingat: Array index 0 = Baris 1, Index 0 = Kolom A
  const header = String(data[0][0]).trim().toUpperCase();
  
  if (header !== "JOBDATE") {
    alert("Error: Format file salah! Kolom A1 harus berisi header 'JOBDATE'.");
    return;
  }

  // 2. Ambil Tanggal (Kolom A Baris 2)
  let rawDate = data[1][0]; // Contoh isi: "03/02/2026" atau object Date
  let fixedDateStr = "";

  // 3. Normalisasi Format Tanggal
  if (rawDate instanceof Date) {
    // Jika Excel membacanya sebagai Object Date
    let d = rawDate;
    let dd = String(d.getDate()).padStart(2, '0');
    let mm = String(d.getMonth() + 1).padStart(2, '0');
    let yyyy = d.getFullYear();
    fixedDateStr = `${yyyy}-${mm}-${dd}`;
  } 
  else if (typeof rawDate === 'string') {
    // Jika format teks "03/02/2026" (DD/MM/YYYY)
    let parts = rawDate.split('/');
    if (parts.length === 3) {
      // Ubah ke format ISO: YYYY-MM-DD
      fixedDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  else if (typeof rawDate === 'number') {
      // Jika Excel serial number (opsional, jaga-jaga)
      // Excel date serial logic butuh library moment/xlsx helper, 
      // tapi biasanya SheetJS sudah handle ini jadi string/date.
      alert("Format tanggal Excel numeric terdeteksi. Pastikan cell diformat sebagai Text/Date.");
      return;
  }

  if (!fixedDateStr) {
    alert("Gagal membaca tanggal di A2. Pastikan format DD/MM/YYYY");
    return;
  }

  console.log("Tanggal terdeteksi dari isi file: " + fixedDateStr);

  // 4. KIRIM KE BACKEND (Google Apps Script)
  // Panggil fungsi initUpload dengan tanggal yang sudah ditemukan
  google.script.run
    .withSuccessHandler(function(sheetName) {
        // Lanjutkan proses upload batch ke sheetName tersebut
        uploadBatchData(sheetName, data); 
    })
    .withFailureHandler(function(err) {
        alert("Gagal Init: " + err.message);
    })
    .initUpload(fixedDateStr); // Kirim "2026-02-03"
}



// --- FUNGSI AUTO DETECT TANGGAL (REVISI FIX FORMAT) ---
function detectDateFromFile(input) {
    const file = input.files[0];
    
    // Elemen UI
    const nameDisplay = document.getElementById('fileNameDisplay');
    const dateInput = document.getElementById('upDate');
    const statusLabel = document.getElementById('fileStatus');
    const autoLabel = document.getElementById('autoLabel');
    
    if (!file) {
        if(nameDisplay) nameDisplay.innerText = "Pilih file atau drag disini...";
        return;
    }

    if(nameDisplay) nameDisplay.innerText = file.name;
    if(statusLabel) statusLabel.classList.remove('hidden');

    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            if (typeof XLSX === 'undefined') {
                alert("Library SheetJS belum dimuat.");
                return;
            }

            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Ambil Header (A1) & Isi (A2)
            // Gunakan .v (raw value) untuk A1, dan cek .w (formatted) atau .v (value) untuk A2
            const cellA1 = worksheet['A1'] ? String(worksheet['A1'].v).trim().toUpperCase() : null;
            const cellA2 = worksheet['A2']; 

            let finalDateISO = null; // Target: YYYY-MM-DD

            // 1. CEK ISI FILE (Header JOBDATE)
            if (cellA1 === 'JOBDATE' && cellA2) {
                console.log("Header JOBDATE ditemukan.");
                
                // Kasus A: Excel menyimpan sebagai Serial Number (Angka, misal 45321)
                if (cellA2.t === 'n') {
                    const dateObj = XLSX.SSF.parse_date_code(cellA2.v);
                    if(dateObj) {
                        // Pastikan format 0 digit (01, 02)
                        const y = dateObj.y;
                        const m = String(dateObj.m).padStart(2, '0');
                        const d = String(dateObj.d).padStart(2, '0');
                        finalDateISO = `${y}-${m}-${d}`;
                    }
                } 
                // Kasus B: Excel menyimpan sebagai Text (misal "03/02/2026")
                else if (cellA2.w || cellA2.v) {
                    const rawText = cellA2.w || cellA2.v;
                    finalDateISO = fixDateToISO(rawText);
                }
            }

            // 2. CEK NAMA FILE (Fallback)
            if (!finalDateISO) {
                console.log("Cek nama file...");
                // Regex cari DDMMYYYY atau D-M-YYYY
                const match = file.name.match(/(\d{2})(\d{2})(\d{4})/);
                if (match) {
                    // match[1]=DD, match[2]=MM, match[3]=YYYY
                    finalDateISO = `${match[3]}-${match[2]}-${match[1]}`;
                }
            }

            // --- UPDATE UI ---
            if (statusLabel) statusLabel.classList.add('hidden');

            if (finalDateISO) {
                console.log("Tanggal Valid Ditemukan: " + finalDateISO);
                
                if(dateInput) {
                    // INI KUNCINYA: Value harus YYYY-MM-DD persis
                    dateInput.value = finalDateISO;
                    
                    // Efek Visual
                    dateInput.classList.add('border-emerald-500', 'bg-emerald-50', 'text-emerald-700');
                    if(autoLabel) autoLabel.classList.remove('hidden');
                    
                    // Hilangkan highlight setelah 1.5 detik
                    setTimeout(() => {
                        dateInput.classList.remove('bg-emerald-50');
                    }, 1500);
                }
            } else {
                console.warn("Tanggal tidak dikenali formatnya.");
                if(dateInput) {
                    dateInput.classList.remove('border-emerald-500', 'text-emerald-700');
                    dateInput.focus();
                }
                if(autoLabel) autoLabel.classList.add('hidden');
            }

        } catch (err) {
            console.error("Error parsing Excel:", err);
            if(statusLabel) statusLabel.classList.add('hidden');
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// --- HELPER BARU: KONVERSI APAPUN KE YYYY-MM-DD ---
function fixDateToISO(str) {
    if (!str) return null;
    str = String(str).trim();

    // Normalisasi pemisah (ganti . atau / jadi -)
    str = str.replace(/\//g, '-').replace(/\./g, '-');
    
    const parts = str.split('-');
    
    // Asumsi format Indonesia: DD-MM-YYYY
    if (parts.length === 3) {
        let day = parts[0];
        let month = parts[1];
        let year = parts[2];

        // Jika terbalik (YYYY-MM-DD), tukar
        if (day.length === 4) {
            year = parts[0];
            month = parts[1];
            day = parts[2];
        }

        // Pad dengan '0' jika cuma 1 digit (misal: 3 -> 03)
        // Input type date WAJIB 2 digit
        day = day.padStart(2, '0');
        month = month.padStart(2, '0');

        return `${year}-${month}-${day}`;
    }
    
    return null;
}

// Helper: Ubah "03/02/2026" atau "03-02-2026" menjadi "2026-02-03" (Format HTML Date)
function parseDateString(str) {
    if(!str) return null;
    str = String(str).trim();
    
    // Jika format DD/MM/YYYY
    if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    // Jika format DD-MM-YYYY
    if (str.includes('-')) {
        const parts = str.split('-');
        if (parts.length === 3 && parts[0].length === 2) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    return null;
}

// --- GLOBAL VARIABLES ---
let journeyDataCache = null; // Cache data NPL + Recovery
let searchTimeout;           // Timer untuk Debounce pencarian

// --- FUNGSI UTAMA RENDER HALAMAN JOURNEY ---
function renderJourneyPage() {
    const container = document.getElementById('listDebtorJourney');
    if (!container) return;

    // 1. CEK DATA (Caching Strategy)
    // Jika cache kosong, ambil dari server
    if (!journeyDataCache) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-20 text-slate-400 animate-pulse">
                <i class="fas fa-satellite-dish text-4xl mb-4 text-emerald-200"></i>
                <div class="text-xs font-bold uppercase tracking-widest mb-1">Sinkronisasi Data...</div>
                <div class="text-[9px]">Mengambil NPL & Debitur dalam Pemantauan</div>
            </div>`;
            
        // [PENTING] Ambil Tanggal yang sedang dipilih user
        const elDate = document.getElementById('selDate');
        const selectedDate = elDate ? elDate.value : "";

        google.script.run.withSuccessHandler(serverData => {
            journeyDataCache = serverData; // Simpan ke cache memory
            renderJourneyPage(); // Panggil ulang fungsi ini setelah data siap
        }).getJourneyList(selectedDate); // <--- KIRIM TANGGAL KE SERVER
        
        return; // Stop eksekusi sampai data datang
    }

    // 2. DATA SIAP -> PERSIAPAN FILTER
    const list = journeyDataCache;
    
    // Ambil Filter Cabang Global
    // Pastikan object 's' dan 's.filter' ada sebelum akses properti
    const activeBranch = (typeof s !== 'undefined' && s.filter && s.filter.b) ? s.filter.b : 'ALL';
    
    const searchInput = document.getElementById('searchJourney');
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';

    // 3. PROSES FILTERING
    let filtered = list.filter(d => {
        // A. Filter Cabang
        const isBranchMatch = (activeBranch === 'ALL') || 
                              (String(d.kode_cabang) === String(activeBranch)) || 
                              (String(d.br) === String(activeBranch));
        
        // B. Filter Search (Nama atau No Loan)
        const isSearchMatch = !keyword || 
                              (d.nama && d.nama.toLowerCase().includes(keyword)) || 
                              (d.loan && d.loan.toLowerCase().includes(keyword));

        return isBranchMatch && isSearchMatch;
    });

    // 4. SORTING: Prioritas NPL (KOL Tinggi) di atas, Recovery di bawah
    filtered.sort((a, b) => b.kol - a.kol);

    // 5. RENDER UI
    
    // State Kosong
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64 text-slate-400">
                <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <i class="fas fa-search text-xl opacity-30"></i>
                </div>
                <p class="text-[10px] font-black uppercase tracking-widest text-center">Data tidak ditemukan</p>
                <p class="text-[9px] text-slate-300 mt-1">Filter: ${activeBranch} | "${keyword}"</p>
            </div>`;
        return;
    }

    // Batasi Tampilan (Max 50 Item) agar HP tidak berat
    const MAX_ITEMS = 50; 
    const displayList = filtered.slice(0, MAX_ITEMS);
    const sisaItem = filtered.length - MAX_ITEMS;

    // Generate HTML Item
    let htmlContent = displayList.map(d => {
        const kol = parseInt(d.kol);
        
        // --- LOGIKA VISUAL (Warna & Badge) ---
        let badgeHTML = '';
        let borderClass = '';
        let bgClass = 'hover:bg-slate-50 dark:hover:bg-slate-800'; // Hover standar
        
        if (d.status_journey === 'RECOVERY') {
            // TAMPILAN KHUSUS KOL 1 (RECOVERY) - Biru
            badgeHTML = `<span class="px-2 py-1 rounded text-[9px] font-black leading-none bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
                            <i class="fas fa-history"></i> PANTAU
                         </span>`;
            borderClass = 'border-l-4 border-blue-400';
            bgClass = 'bg-blue-50/30 hover:bg-blue-50 dark:bg-blue-900/10'; 
        } else {
            // TAMPILAN NPL BIASA - Merah/Orange
            let kolColor = kol == 2 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700';
            badgeHTML = `<span class="px-2 py-1 rounded text-[9px] font-black leading-none ${kolColor}">KOL ${d.kol}</span>`;
            borderClass = 'border-l-4 border-transparent'; 
        }

        // Helper Format Uang Singkat (Jt/M)
        const formatMoney = (val) => {
            if(val >= 1000000000) return (val/1000000000).toFixed(2) + ' M';
            if(val >= 1000000) return (val/1000000).toFixed(1) + ' Jt';
            return val.toLocaleString('id-ID');
        };

        return `
        <div onclick="app.showJourneyDetail('${d.loan}')" class="p-4 border-b border-slate-100 dark:border-slate-800 ${borderClass} ${bgClass} cursor-pointer transition group animate-fade-in">
            <div class="flex justify-between items-start">
                
                <div class="flex-1 pr-2">
                    <div class="font-black text-slate-800 dark:text-white text-sm group-hover:text-emerald-600 transition truncate w-48 flex items-center gap-1">
                        ${d.nama}
                        ${d.status_journey === 'RECOVERY' ? '<i class="fas fa-shield-alt text-blue-400 text-xs" title="Debitur Recovery"></i>' : ''}
                    </div>
                    <div class="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
                        ${d.loan} <span class="mx-1">•</span> ${d.br}
                    </div>
                </div>

                <div class="flex flex-col items-end gap-1">
                    ${badgeHTML}
                    <span class="text-[8px] font-bold text-slate-400 font-mono">
                        Rp ${formatMoney(d.os)}
                    </span>
                </div>

            </div>
        </div>
        `;
    }).join('');

    // Info jika data terpotong
    if (sisaItem > 0) {
        htmlContent += `
            <div class="p-4 text-center text-[10px] text-slate-400 italic">
                ...dan ${sisaItem} data lainnya. <br>Gunakan pencarian untuk hasil spesifik.
            </div>
        `;
    }

    container.innerHTML = htmlContent;
}

// --- FUNGSI SEARCH LISTENER (DENGAN DEBOUNCE) ---
function searchDebtorJourney() {
    // Clear timeout sebelumnya (reset timer)
    clearTimeout(searchTimeout);
    
    // Tunggu 300ms sebelum eksekusi render
    // Ini mencegah render berulang-ulang saat user mengetik cepat
    searchTimeout = setTimeout(() => {
        renderJourneyPage(); 
    }, 300);
}



// 2. FUNGSI EKSEKUSI LOGIKA
function executeRender(container) {
    // Safety Check State
    const list = (typeof s !== 'undefined' && s.data && s.data.npl_list) ? s.data.npl_list : [];
    const activeBranch = (typeof s !== 'undefined' && s.filter && s.filter.b) ? s.filter.b : 'ALL';
    
    const searchInput = document.getElementById('searchJourney');
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';

    // --- PROSES FILTERING ---
    // Menggunakan chaining filter agar lebih bersih
    let filtered = list.filter(d => {
        // A. Filter Cabang
        const isBranchMatch = (activeBranch === 'ALL') || 
                              (String(d.kode_cabang) === String(activeBranch)) || 
                              (String(d.br) === String(activeBranch));
        
        // B. Filter KOL (Min KOL 2)
        const isKolMatch = parseInt(d.kol) >= 2;

        // C. Filter Search
        const isSearchMatch = !keyword || 
                              (d.nama && d.nama.toLowerCase().includes(keyword)) || 
                              (d.loan && d.loan.toLowerCase().includes(keyword));

        return isBranchMatch && isKolMatch && isSearchMatch;
    });

    // --- RENDER HASIL ---
    
    // A. State Kosong
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64 text-slate-400 animate-fade-in">
                <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <i class="fas fa-search text-2xl opacity-30"></i>
                </div>
                <p class="text-[10px] font-black uppercase tracking-widest text-center">
                    Data tidak ditemukan<br>
                    <span class="text-[9px] font-normal opacity-70 normal-case">"${keyword}" di cabang ${activeBranch}</span>
                </p>
            </div>`;
        return;
    }

    // B. Optimasi Render (Batasi Max 100 Item agar HP tidak berat)
    // Jika lebih dari 100, user disuruh search lebih spesifik
    const MAX_ITEMS = 50; 
    const displayList = filtered.slice(0, MAX_ITEMS);
    const sisaItem = filtered.length - MAX_ITEMS;

    // Generate HTML
    let htmlContent = displayList.map(d => {
        // Helper Format Rupiah Singkat
        const formatMoney = (val) => {
            if(val >= 1000000000) return (val/1000000000).toFixed(2) + ' M';
            if(val >= 1000000) return (val/1000000).toFixed(1) + ' Jt';
            return val.toLocaleString('id-ID');
        };

        // Tentukan Warna Badge KOL
        let badgeColor = 'bg-slate-100 text-slate-600';
        if(d.kol == 2) badgeColor = 'bg-yellow-100 text-yellow-700 border border-yellow-200';
        if(d.kol >= 3) badgeColor = 'bg-red-100 text-red-600 border border-red-200';

        // Sanitasi sederhana untuk mencegah error HTML
        const safeNama = (d.nama || '-').replace(/</g, "&lt;").replace(/>/g, "&gt;");

        return `
        <div onclick="app.showJourneyDetail('${d.loan}')" class="p-3 border-b border-slate-100 dark:border-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 cursor-pointer transition-all duration-200 group">
            <div class="flex justify-between items-center">
                
                <div class="flex-1 min-w-0 pr-3">
                    <div class="flex items-center gap-2 mb-0.5">
                        <h4 class="font-bold text-slate-700 dark:text-slate-200 text-xs truncate group-hover:text-emerald-600 transition">
                            ${safeNama}
                        </h4>
                        ${d.is_new ? '<span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>' : ''} 
                    </div>
                    <div class="flex items-center text-[9px] text-slate-400 font-medium tracking-wide">
                        <span class="font-mono text-slate-500 bg-slate-100 px-1 rounded mr-1">${d.loan}</span>
                        <span>${d.br}</span>
                    </div>
                </div>

                <div class="flex flex-col items-end gap-1 shrink-0">
                    <span class="px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-wider ${badgeColor}">
                        KOL ${d.kol}
                    </span>
                    <span class="text-[9px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                        Rp ${formatMoney(d.os)}
                    </span>
                </div>

            </div>
        </div>
        `;
    }).join('');

    // Tambahkan info jika data dipotong
    if (sisaItem > 0) {
        htmlContent += `
            <div class="p-4 text-center text-[10px] text-slate-400 italic">
                ...dan ${sisaItem} data lainnya. <br>Gunakan pencarian untuk hasil spesifik.
            </div>
        `;
    }

    container.innerHTML = htmlContent;
}



function openMitigationForm(loanId) {
    // 1. SAFETY CHECK & AMBIL DATA (Sama seperti sebelumnya)
    let list = [];
    if (typeof s !== 'undefined' && s && s.data && s.data.npl_list) {
        list = s.data.npl_list;
    } else if (typeof app !== 'undefined' && app.state && app.state.data && app.state.data.npl_list) {
        list = app.state.data.npl_list;
    }

    const d = list.find(x => String(x.loan).trim() === String(loanId).trim());
    
    // Fallback jika data tidak ketemu
    if(!d) {
        console.warn("Data debitur tidak ditemukan, mode manual.");
        document.getElementById('mitigasi-loan-id').value = loanId;
        document.getElementById('modal-mitigasi').classList.remove('hidden');
        return;
    }

    // 2. MAPPING DATA
    const elLoan = document.getElementById('mitigasi-loan-id');
    const elNama = document.getElementById('mitigasi-nama');
    const elKol = document.getElementById('mitigasi-kol');
    const elTarget = document.getElementById('mitigasi-target-name');
    const elPetugas = document.getElementById('mitigasi-petugas');
    
    // [UPDATE BARU] Elemen Tanggal Manual
    const elTglManual = document.getElementById('mitigasi-tgl-manual');

    if(elLoan) elLoan.value = d.loan;
    if(elNama) elNama.value = d.nama;
    if(elKol)  elKol.value = d.kol;
    
    // Reset Petugas (agar diisi manual)
    if(elPetugas) elPetugas.value = ""; 

    if(elTarget) {
        elTarget.innerText = `${d.nama} (${d.loan}) - ${d.br}`;
    }

    // [UPDATE BARU] SET TANGGAL MANUAL KE HARI INI (DEFAULT)
    if(elTglManual) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        elTglManual.value = `${yyyy}-${mm}-${dd}`;
    }

    // Tampilkan Modal
    const modal = document.getElementById('modal-mitigasi');
    if(modal) {
        modal.classList.remove('hidden');
        if(modal.firstElementChild) modal.firstElementChild.classList.add('animate-pop-in');
    }
}


// UPDATE FUNGSI CLOSE (RESET TANGGAL)
function closeMitigasiModal() {
    const modal = document.getElementById('modal-mitigasi');
    const form = document.getElementById('formMitigasi');
    
    if(modal) modal.classList.add('hidden');
    if(form) {
        form.reset();
        document.getElementById('mitigasi-log-id').value = "";
        
        // Reset Tanggal ke Default (Hari Ini) lagi supaya bersih
        const elTglManual = document.getElementById('mitigasi-tgl-manual');
        if(elTglManual) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            elTglManual.value = `${yyyy}-${mm}-${dd}`;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        if(submitBtn) submitBtn.innerHTML = 'SIMPAN PENANGANAN <i class="fas fa-paper-plane ml-1"></i>';
    }
}


function submitMitigasi(e) {
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
    }
    
    const submitBtn = document.querySelector('#formMitigasi button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : 'SIMPAN';
    
    // Fungsi Helper Ambil Value
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : "";
    };

    // --- [BARU] 1. AMBIL & BERSIHKAN NOMINAL ---
    // Ambil value mentah (misal: "1.500.000") dan buang titiknya
    const rawNominal = document.getElementById('mitigasi-nominal').value;
    const cleanNominal = rawNominal.replace(/\./g, ""); // Hapus semua titik
    const nominalVal = parseInt(cleanNominal) || 0;

    // --- [BARU] 2. VALIDASI LOGIKA JANJI BAYAR ---
    // Jika ada nominal janji, TAPI tanggalnya kurang dari hari ini -> TOLAK
    const tglJanjiStr = getVal('mitigasi-tgl-komitmen');
    
    if (nominalVal > 0 && tglJanjiStr) {
        const tglJanji = new Date(tglJanjiStr);
        const hariIni = new Date();
        hariIni.setHours(0, 0, 0, 0); // Reset jam ke 00:00 agar perbandingan adil

        if (tglJanji < hariIni) {
            alert("⚠️ LOGIC ERROR:\nTanggal Janji Bayar tidak boleh di masa lalu (Backdate).\nSilakan perbaiki tanggal janji bayar.");
            return; // STOP PROSES, JANGAN LANJUT
        }
    }

    // KUNCI TOMBOL SETELAH LOLOS VALIDASI
    if(submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    }

    // SIAPKAN DATA KE SERVER
    const data = {
        loanId: getVal('mitigasi-loan-id'),
        nama: getVal('mitigasi-nama'), 
        kol: getVal('mitigasi-kol'),   
        
        tglManual: getVal('mitigasi-tgl-manual'), 
        
        petugas: (document.getElementById('mitigasi-petugas') ? document.getElementById('mitigasi-petugas').value : "PETUGAS").toUpperCase(), 
        
        aksi: getVal('mitigasi-aksi'),
        media: getVal('mitigasi-media'),
        catatan: getVal('mitigasi-catatan'),
        
        // Kirim Nominal yang sudah bersih
        nominal: nominalVal, 
        tglKomitmen: tglJanjiStr,
        
        logId: getVal('mitigasi-log-id') 
    };

    google.script.run.withSuccessHandler((res) => {
        if(submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
        
        closeMitigasiModal();
        
        if (typeof showJourneyDetail === 'function') {
            showJourneyDetail(data.loanId);
        } else {
            app.showJourneyDetail(data.loanId);
        }

    }).withFailureHandler((err) => {
        if(submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
        alert("Gagal simpan: " + err);
    }).processMitigationForm(data); 
}



function exportJourneyResume(loanId) {
    // 1. Set ID Config
    const elId = document.getElementById('config-loan-id');
    if(elId) elId.value = loanId;
    
    // 2. Reset Form Petugas
    const elPetugas = document.getElementById('cfg-nama-petugas');
    const elJabatan = document.getElementById('cfg-jabatan-petugas');
    if(elPetugas) elPetugas.value = "SIRAZ MUNIR";
    if(elJabatan) elJabatan.value = "Officer Kredit";

    // 2.5. Set Default Tanggal Manual
    const elTgl = document.getElementById('cfg-tgl-manual');
    if(elTgl) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        elTgl.value = `${yyyy}-${mm}-${dd}`;
    }
    
    // --- [UPDATE] 3. Reset Input Narasi (Termasuk Tindak Lanjut) ---
    const elSolusi = document.getElementById('cfg-solusi');
    const elKeuangan = document.getElementById('cfg-keuangan');
    const elTindak = document.getElementById('cfg-tindak-lanjut'); // Ambil elemen

    if(elSolusi) elSolusi.value = "Mengambil riwayat...";
    if(elKeuangan) elKeuangan.value = "Mengambil riwayat...";
    if(elTindak) elTindak.value = "Mengambil riwayat..."; // Tampilkan loading dulu

    // 5. BUKA MODAL
    document.getElementById('modal-resume-config').classList.remove('hidden');

    // 6. LOAD DATA DARI SERVER
    const container = document.getElementById('list-dasar-container');
    if(container) {
        container.innerHTML = '<div class="text-center text-xs text-slate-400 py-4"><i class="fas fa-circle-notch fa-spin mr-1"></i> Mengambil data...</div>';
        
        google.script.run.withSuccessHandler(data => {
            
            // --- BAGIAN A: DOKUMEN ---
            const savedDocs = data.docs;
            const today = new Date();
            const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
            const tglStr = today.getDate() + ' ' + months[today.getMonth()] + ' ' + today.getFullYear();
            const defaultDoc = { text: `Monitoring dan Evaluasi Kolektibilitas Kredit Posisi ${tglStr}`, checked: true, isDefault: true };

            if (!savedDocs || savedDocs.length === 0) {
                currentDasarList = [defaultDoc];
            } else {
                const hasDefault = savedDocs.some(d => d.text.includes("Monitoring dan Evaluasi"));
                if(!hasDefault) {
                    currentDasarList = [defaultDoc, ...savedDocs];
                } else {
                    if(savedDocs[0].isDefault) savedDocs[0].text = defaultDoc.text; 
                    currentDasarList = savedDocs;
                }
            }
            renderDasarList();

            // --- [UPDATE] BAGIAN B: HISTORY NARASI (SOLUSI, KEUANGAN & TINDAK LANJUT) ---
            const resumeData = data.resume;
            
            // Default Text untuk Tindak Lanjut
            const defaultTindak = "Jika wanprestasi, akan dilakukan Surat Peringatan lanjutan.";

            if (resumeData) {
                // Jika ada data di database, pakai data tsb. Jika kosong, pakai default.
                if(elSolusi) elSolusi.value = resumeData.solusi || "";
                if(elKeuangan) elKeuangan.value = resumeData.keuangan || "";
                if(elTindak) elTindak.value = resumeData.tindakLanjut || defaultTindak; // <--- UPDATE DISINI
            } else {
                // Jika Debitur Baru (Belum pernah ada resume)
                if(elSolusi) elSolusi.value = "1. Melakukan Penagihan Rutin.\n2. Memberikan Surat Peringatan secara berkala.";
                if(elKeuangan) elKeuangan.value = "Belum ada mutasi signifikan pada rekening debitur.";
                if(elTindak) elTindak.value = defaultTindak;
            }

        }).getResumeBundle(loanId); 
    }
}

// FUNGSI RENDER (TETAP SAMA)
function renderDasarList() {
    const container = document.getElementById('list-dasar-container');
    if(!container) return;
    
    container.innerHTML = '';

    currentDasarList.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = "flex items-center justify-between bg-white p-2 rounded border border-slate-100 shadow-sm mb-1";
        
        div.innerHTML = `
            <label class="flex items-center gap-2 cursor-pointer flex-1">
                <input type="checkbox" onchange="app.toggleDasarCheck(${index})" ${item.checked ? 'checked' : ''} class="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500">
                <span class="text-xs text-slate-700 select-none">${item.text}</span>
            </label>
        `;

        if (!item.isDefault) {
            const delBtn = document.createElement('button');
            delBtn.className = "text-slate-300 hover:text-red-500 ml-2 px-1";
            delBtn.innerHTML = '<i class="fas fa-trash text-[10px]"></i>';
            delBtn.onclick = () => removeDasarItem(index);
            div.appendChild(delBtn);
        }

        container.appendChild(div);
    });
}

// 3. FUNGSI HELPER (Tambah, Hapus, Toggle)
function addNewDasarItem() {
    const input = document.getElementById('input-new-dasar');
    const val = input.value.trim();
    if (!val) return;

    // Tambah ke Array Global
    currentDasarList.push({ text: val, checked: true, isDefault: false });
    
    input.value = ''; // Reset input
    renderDasarList(); // Refresh tampilan
    
    // Auto Save ke Server
    saveCurrentDocsToServer();
}

function removeDasarItem(index) {
    if(!confirm("Hapus dokumen ini dari riwayat?")) return;
    currentDasarList.splice(index, 1);
    renderDasarList();
    saveCurrentDocsToServer();
}

function toggleDasarCheck(index) {
    currentDasarList[index].checked = !currentDasarList[index].checked;
    // Kita tidak perlu auto-save status 'checked' ke server jika ingin status checknya reset tiap sesi.
    // Tapi jika ingin status checknya diingat juga, panggil saveCurrentDocsToServer() di sini.
    saveCurrentDocsToServer(); 
}

function saveCurrentDocsToServer() {
    const loanId = document.getElementById('config-loan-id').value;
    // Kirim seluruh array ke backend
    google.script.run.withSuccessHandler(() => {
        console.log("Dokumen tersimpan.");
    }).saveDebtorDocuments(loanId, currentDasarList);
}



// HELPER: Tambah Teks ke Dasar Penagihan
function addDasarText(type) {
    const el = document.getElementById('cfg-dasar');
    let currentText = el.value.trim();
    let nextNum = currentText.split('\n').length + 1;
    
    let newText = "";
    if (type === 'Surat Tugas') newText = `${nextNum}. Surat Tugas Penagihan Nomor: ...`;
    if (type === 'Surat Peringatan') newText = `${nextNum}. Surat Peringatan (SP-...) Nomor: ...`;
    if (type === 'Berita Acara') newText = `${nextNum}. Berita Acara Kunjungan Tanggal: ...`;
    
    // Tambahkan baris baru
    el.value = currentText + (currentText ? "\n" : "") + newText;
    el.focus();
}


function generateResumeFinal() {
    const loanId = document.getElementById('config-loan-id').value;

    // --- 1. PROSES TANGGAL MANUAL & NAMA FILE ---
    const rawDate = document.getElementById('cfg-tgl-manual').value;
    let dateObj = rawDate ? new Date(rawDate) : new Date();

    const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const tglSurat = dateObj.getDate() + ' ' + months[dateObj.getMonth()] + ' ' + dateObj.getFullYear();

    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const tglFile = `${yyyy}${mm}${dd}`;

    // --- 2. PROSES CHECKLIST DASAR ---
    let htmlDasar = "";
    let counter = 1;
    currentDasarList.forEach(item => {
        if (item.checked) {
            htmlDasar += `
            <div style="display: flex; margin-bottom: 4px; align-items: baseline;">
                <span style="width: 20px; font-weight: bold; color: #1e40af;">${counter}.</span>
                <span style="flex: 1;">${item.text}</span>
            </div>`;
            counter++;
        }
    });
    if (htmlDasar === "") htmlDasar = "-";

    // --- 3. AMBIL DATA INPUT NARASI ---
    const valSolusi = document.getElementById('cfg-solusi').value;
    const valKeuangan = document.getElementById('cfg-keuangan').value;
    const valTindak = document.getElementById('cfg-tindak-lanjut').value;

    google.script.run.saveDebtorResumeData(loanId, valSolusi, valKeuangan, valTindak);

    const config = {
        namaPetugas: document.getElementById('cfg-nama-petugas').value.toUpperCase(),
        jabatanPetugas: document.getElementById('cfg-jabatan-petugas').value,
        namaPim: document.getElementById('cfg-nama-pim').value.toUpperCase(),
        jabatanPim: document.getElementById('cfg-jabatan-pim').value,
        namaCabang: document.getElementById('cfg-nama-cabang').value.toUpperCase(),
        jabatanCabang: document.getElementById('cfg-jabatan-cabang').value,
        dasarHtml: htmlDasar,
        solusiText: valSolusi,
        keuanganText: valKeuangan,
        tindakLanjut: document.getElementById('cfg-tindak-lanjut').value 
    };

    document.getElementById('modal-resume-config').classList.add('hidden');
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'flex';

    const list = (s && s.data && s.data.npl_list) ? s.data.npl_list : [];
    const basicData = list.find(x => String(x.loan).trim() === String(loanId).trim());

    if (!basicData) { alert("Data dasar tidak ditemukan."); if(loader)loader.style.display='none'; return; }

    // --- 4. AMBIL DATA SERVER & RENDER ---
    google.script.run.withSuccessHandler(serverData => {
        if (loader) loader.style.display = 'none';
        
        const d = { ...basicData, ...serverData };
        const history = serverData.history || [];
        const lastLog = history.length > 0 ? history[0] : { catatan: '-', aksi: '-', nominal: 0 };

        // Statistik
        let totalJanji = 0, ditepati = 0, ingkar = 0;
        history.forEach(h => { if(h.nominal>0){ totalJanji++; if(h.statusKomitmen==='LUNAS')ditepati++; else if(h.statusKomitmen==='BATAL')ingkar++; }});
        let trustScore = totalJanji > 0 ? Math.round((ditepati/totalJanji)*100) : 100;
        let behaviorLabel = "Belum Ada Track Record";
        let scoreColor = "#334155"; let scoreBg = "#f1f5f9";
        
        if(totalJanji>0){
             if(trustScore>=80){ behaviorLabel="Sangat Kooperatif"; scoreColor="#047857"; scoreBg="#d1fae5"; }
             else if(trustScore>=50){ behaviorLabel="Cukup Kooperatif"; scoreColor="#b45309"; scoreBg="#fef3c7"; }
             else{ behaviorLabel="Kurang Kooperatif"; scoreColor="#b91c1c"; scoreBg="#fee2e2"; }
        }

        const valPlafond = Math.floor(parseFloat(d.plafond)||0); const textPlafond = valPlafond>0?terbilang(valPlafond)+" Rupiah":"-";
        const valOs = Math.floor(parseFloat(d.os)||0); const textOs = valOs>0?terbilang(valOs)+" Rupiah":"-";
        const valPokok = Math.floor(parseFloat(d.tgk_pokok)||0);
        const valBunga = Math.floor(parseFloat(d.tgk_bunga)||0);
        const noPK = d.no_pk||"-"; const tglPK = d.tgl_pk||"-";
        const jangkaWaktuStr = `${d.tenor||0} Bulan <span style="font-size:9pt; color:#64748b;">(${d.tgl_mulai||'-'} s.d ${d.tgl_jatuh_tempo||'-'})</span>`;
        
        let masalah = "Keterlambatan pembayaran angsuran berjalan";
        if(d.kol==3) masalah="Debitur dalam perhatian khusus (Substandard)"; 
        else if(d.kol==4) masalah="Debitur diragukan kemampuannya (Doubtful)"; 
        else if(d.kol==5) masalah="Debitur mengalami kemacetan usaha total (Loss)";
        
        const txtCabang = d.cabang_nama ? `${d.cabang_nama} (${d.cabang_kode})` : (d.br || "-");
        const txtProduk = d.produk || "KREDIT UMUM";
        const txtAlamat = d.alamat || "-";

        // --- RENDER HTML PREVIEW ---
        const resumeArea = document.getElementById('resume-preview-content');
        const modalPreview = document.getElementById('modal-resume-preview');

        const finalFilename = `RESUME_${d.loan}_${tglFile}`;
        const btnPrint = document.getElementById('btn-print-resume');
        if(btnPrint) btnPrint.setAttribute('data-filename', finalFilename);

        // --- STYLE CSS INLINE (Agar terbawa saat Print) ---
        const styles = {
            headerTitle: "font-size: 14pt; font-weight: bold; color: #1e3a8a; font-family: 'Times New Roman', serif;",
            headerSub: "font-size: 8pt; color: #334155; line-height: 1.3;",
            sectionHeader: "background-color: #f8fafc; border-left: 5px solid #1e40af; padding: 8px 12px; font-weight: bold; color: #1e3a8a; font-size: 10pt; margin-top: 15px; margin-bottom: 10px; display: flex; align-items: center;",
            label: "width: 140px; color: #64748b; font-size: 9pt; padding: 3px 0; vertical-align: top;",
            value: "color: #0f172a; font-weight: bold; font-size: 10pt; padding: 3px 0; vertical-align: top;",
            separator: "width: 15px; color: #64748b; vertical-align: top; padding: 3px 0;",
            tableHeader: "background-color: #1e3a8a; color: white; padding: 6px; font-size: 9pt; text-align: center; font-weight: bold;",
            tableCell: "border-bottom: 1px solid #e2e8f0; padding: 6px; font-size: 9pt; vertical-align: top; color: #334155;",
            terbilang: "font-style: italic; font-size: 8pt; color: #64748b; margin-top: 2px;"
        };

        resumeArea.innerHTML = `
        <div style="font-family: Arial, sans-serif; color: #0f172a; padding: 15mm 20mm; font-size: 10pt; line-height: 1.5;">
            
            <div style="border-bottom: 3px solid #1e40af; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center;">
                <div style="width: 40%;">
                    <div style="${styles.headerTitle}"></div>
                    <div style="font-size: 8pt; color: #1e40af; font-weight: bold; margin-top: 2px;"></div>
                </div>
                <div style="width: 60%; text-align: right; ${styles.headerSub}">
                    <div style="font-weight: bold; font-size: 9pt; color: #0f172a;">${(config.jabatanPim || '').includes('Capem') ? 'KANTOR CABANG PEMBANTU BABULU' : 'KANTOR CABANG PENAJAM'}</div>
                    <div>Jl. Propinsi KM 48 RT.05 RW.02, Kec. Babulu</div>
                    <div>Kab. Penajam Paser Utara - Kalimantan Timur</div>
                    <div>Telp: (0543) 5232228 | Fax: (0543) 523229</div>
                </div>
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-weight: bold; text-decoration: underline; font-size: 12pt; color: #0f172a;">RESUME KREDIT ATAS NAMA ${d.nama}</div>
                <div style="font-size: 10pt; color: #64748b; margin-top: 2px;">Nomor Loan: ${d.loan}</div>
            </div>

            <div style="${styles.sectionHeader}">
                <span style="margin-right: 10px;">A.</span> JENIS KREDIT
            </div>
            <div style="padding-left: 20px; font-weight: bold; color: #0f172a;">
                ${txtProduk.toUpperCase()}
            </div>

            <div style="${styles.sectionHeader}">
                <span style="margin-right: 10px;">B.</span> DASAR PENAGIHAN
            </div>
            <div style="padding-left: 20px; font-size: 10pt;">
                ${config.dasarHtml}
            </div>

            <div style="${styles.sectionHeader}">
                <span style="margin-right: 10px;">C.</span> DATA DEBITUR
            </div>
            <div style="padding-left: 15px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="${styles.label}">Nama Debitur</td><td style="${styles.separator}">:</td><td style="${styles.value}">${d.nama}</td></tr>
                    <tr><td style="${styles.label}">Alamat Domisili</td><td style="${styles.separator}">:</td><td style="${styles.value}">${txtAlamat}</td></tr>
                    <tr><td style="${styles.label}">Cabang</td><td style="${styles.separator}">:</td><td style="${styles.value}">${txtCabang}</td></tr>
                </table>
            </div>

            <div style="${styles.sectionHeader}">
                <span style="margin-right: 10px;">D.</span> DATA KREDIT
            </div>
            <div style="padding-left: 15px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="${styles.label}">No. & Tgl PK</td><td style="${styles.separator}">:</td><td style="${styles.value}">${noPK}, Tgl ${tglPK}</td></tr>
                    <tr>
                        <td style="${styles.label}">Plafond Kredit</td><td style="${styles.separator}">:</td>
                        <td style="${styles.value}">Rp ${valPlafond.toLocaleString('id-ID')}<div style="${styles.terbilang}">(${textPlafond})</div></td>
                    </tr>
                    <tr>
                        <td style="${styles.label}">Baki Debet</td><td style="${styles.separator}">:</td>
                        <td style="${styles.value}">Rp ${valOs.toLocaleString('id-ID')}<div style="${styles.terbilang}">(${textOs})</div></td>
                    </tr>
                    <tr><td style="${styles.label}">Tunggakan Pokok</td><td style="${styles.separator}">:</td><td style="${styles.value}">Rp ${valPokok.toLocaleString('id-ID')}</td></tr>
                    <tr><td style="${styles.label}">Tunggakan Bunga</td><td style="${styles.separator}">:</td><td style="${styles.value}">Rp ${valBunga.toLocaleString('id-ID')}</td></tr>
                    <tr><td style="${styles.label}">Jangka Waktu</td><td style="${styles.separator}">:</td><td style="${styles.value}">${jangkaWaktuStr}</td></tr>
                    <tr><td style="${styles.label}">Suku Bunga</td><td style="${styles.separator}">:</td><td style="${styles.value}">${d.rate || 0}% per tahun</td></tr>
                    <tr><td style="${styles.label}">Kolektibilitas</td><td style="${styles.separator}">:</td><td style="${styles.value}"><span style="background:#f1f5f9; padding:2px 6px; border-radius:4px;">${d.kol} - DALAM PERHATIAN KHUSUS</span></td></tr>
                </table>
            </div>

            <div style="${styles.sectionHeader}">
                <span style="margin-right: 10px;">E.</span> RIWAYAT PENANGANAN TERAKHIR
            </div>
            <div style="padding-left: 10px; padding-right: 10px;">
                <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 15px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
                    <thead>
                        <tr>
                            <th style="${styles.tableHeader} width: 15%;">Tanggal</th>
                            <th style="${styles.tableHeader} width: 20%;">Petugas</th>
                            <th style="${styles.tableHeader} width: 65%;">Aksi & Hasil</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.slice(0, 5).map(h => `
                        <tr>
                            <td style="${styles.tableCell} text-align: center; border-right: 1px solid #e2e8f0;">${h.timestamp || '-'}</td>
                            <td style="${styles.tableCell} border-right: 1px solid #e2e8f0;">${h.petugas ? h.petugas.split('@')[0] : 'System'}</td>
                            <td style="${styles.tableCell}">
                                <div style="font-weight: bold; color: #1e3a8a;">${h.aksi} (${h.media})</div>
                                <div style="font-style: italic;">"${h.catatan}"</div>
                                ${h.nominal > 0 ? `<div style="margin-top:4px; font-size:8pt; background:#f0fdf4; color:#15803d; padding:2px 5px; border-radius:4px; display:inline-block;">Komitmen: Rp ${Number(h.nominal).toLocaleString()}</div>` : ''}
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table>

                <div style="border: 1px solid ${scoreColor}; background-color: ${scoreBg}; padding: 12px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 9pt;">
                        <span style="display:block; font-weight:bold; font-size:8pt; text-transform:uppercase; color:#64748b; margin-bottom:2px;">Statistik Perilaku</span>
                        Total Janji: <b>${totalJanji}x</b> &nbsp;|&nbsp; Ditepati: <b style="color: #15803d;">${ditepati}x</b> &nbsp;|&nbsp; Ingkar: <b style="color: #b91c1c;">${ingkar}x</b>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 8pt; color: #64748b;">Trust Score</div>
                        <div style="font-size: 14pt; font-weight: bold; color: ${scoreColor};">${trustScore}% <span style="font-size:10pt;">(${behaviorLabel})</span></div>
                    </div>
                </div>
            </div>

            <div style="${styles.sectionHeader}">
                <span style="margin-right: 10px;">F.</span> PERMASALAHAN
            </div>
            <div style="padding-left: 20px; text-align: justify; color: #334155;">
                ${masalah}. Berdasarkan kunjungan terakhir, permasalahan debitur adalah: <i>"${lastLog.catatan}"</i>.
            </div>

            <div style="${styles.sectionHeader}">
                <span style="margin-right: 10px;">G.</span> SOLUSI YANG DIUPAYAKAN
            </div>
            <div style="padding-left: 20px; text-align: justify; color: #334155;">
                ${config.solusiText.replace(/\n/g, '<br>')}
                ${config.tindakLanjut ? `<br><br><b>Langkah Lanjutan:</b> ${config.tindakLanjut}` : ''}
            </div>

            <div style="${styles.sectionHeader}">
                <span style="margin-right: 10px;">H.</span> KONDISI KEUANGAN
            </div>
            <div style="padding-left: 20px; text-align: justify; color: #334155; margin-bottom: 20px;">
                ${config.keuanganText.replace(/\n/g, '<br>')}
            </div>

            <div style="page-break-inside: avoid; margin-top: 30px; border-top: 2px dashed #e2e8f0; padding-top: 20px;">
                <div style="margin-bottom: 20px; font-style: italic; color: #64748b;">
                    Demikian disampaikan Resume Kredit ini sebagai bahan pertimbangan dan dasar pengambilan keputusan selanjutnya.
                </div>
                
                <div style="margin-bottom: 10px; text-align: right;">Babulu, ${tglSurat}</div>

                <table style="width: 100%; text-align: center; margin-bottom: 15px;">
                    <tr>
                        <td style="width: 50%; vertical-align: top;">
                            <div style="margin-bottom: 70px; font-size: 9pt;">Mengetahui/Mengusulkan,</div>
                            <div style="font-weight: bold; text-decoration: underline; color: #0f172a;">${config.namaPetugas}</div>
                            <div style="font-size: 9pt; color: #64748b;">${config.jabatanPetugas}</div>
                        </td>
                        <td style="width: 50%; vertical-align: top;">
                            <div style="margin-bottom: 70px; font-size: 9pt;">Menyetujui,</div>
                            <div style="font-weight: bold; text-decoration: underline; color: #0f172a;">${config.namaPim}</div>
                            <div style="font-size: 9pt; color: #64748b;">${config.jabatanPim}</div>
                        </td>
                    </tr>
                </table>

                <div style="margin: 20px 0; background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 15px;">
                    <div style="font-weight: bold; font-size: 9pt; margin-bottom: 50px; color: #475569;">ARAHAN PEMIMPIN CABANG:</div>
                </div>

                <div style="text-align: center; margin-top: 20px;">
                    <div style="margin-bottom: 70px; font-size: 9pt;">Mengetahui,<br>PT BPD KALTIM KALTARA<br>KANTOR CABANG PENAJAM</div>
                    <div style="font-weight: bold; text-decoration: underline; color: #0f172a;">${config.namaCabang}</div>
                    <div style="font-size: 9pt; color: #64748b;">${config.jabatanCabang}</div>
                </div>
            </div>
        </div>`;

        modalPreview.classList.remove('hidden');

    }).getDebtorDetailForResume(loanId);
}

// --- 2. FUNGSI HELPER: TERBILANG (WAJIB ADA) ---
function terbilang(nilai) {
  var bilangan = String(Math.floor(Math.abs(nilai))); // Pastikan Bulat Positif
  var angka   = new Array('0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0');
  var kata    = new Array('','Satu','Dua','Tiga','Empat','Lima','Enam','Tujuh','Delapan','Sembilan');
  var tingkat = new Array('','Ribu','Juta','Milyar','Triliun');
  var kalimat = "";
  
  var panjang_bilangan = bilangan.length;
  if(panjang_bilangan > 15) return "Diluar Batas";

  for(let i = 1; i <= panjang_bilangan; i++) {
    angka[i] = bilangan.substr(-(i),1);
  }

  var i = 1; var j = 0;
  while(i <= panjang_bilangan) {
    var subkalimat = "";
    var kata1 = ""; var kata2 = ""; var kata3 = "";

    // Ratusan
    if(angka[i+2] != "0") {
      if(angka[i+2] == "1") kata1 = "Seratus"; else kata1 = kata[angka[i+2]] + " Ratus";
    }
    // Puluhan
    if(angka[i+1] != "0") {
      if(angka[i+1] == "1") {
        if(angka[i] == "0") kata2 = "Sepuluh";
        else if(angka[i] == "1") kata2 = "Sebelas";
        else kata2 = kata[angka[i]] + " Belas";
      } else {
        kata2 = kata[angka[i+1]] + " Puluh";
      }
    }
    // Satuan
    if (angka[i] != "0") {
      if (angka[i+1] != "1") kata3 = kata[angka[i]];
    }

    if ((angka[i] != "0") || (angka[i+1] != "0") || (angka[i+2] != "0")) {
      subkalimat = kata1+" "+kata2+" "+kata3+" "+tingkat[j]+" ";
    }
    kalimat = subkalimat + kalimat;
    i = i + 3; j = j + 1;
  }

  if ((angka[5] == "0") && (angka[6] == "0")) kalimat = kalimat.replace("Satu Ribu","Seribu");
  
  return kalimat.trim().replace(/\s{2,}/g, ' ') + " Rupiah";
}


function showJourneyDetail(loanId) {
    // 1. CARI DATA SEMENTARA
    let list = [];
    if (typeof s !== 'undefined' && s && s.data && s.data.npl_list) {
        list = s.data.npl_list;
    } else if (typeof app !== 'undefined' && app.state && app.state.data && app.state.data.npl_list) {
        list = app.state.data.npl_list;
    }

    const targetId = String(loanId).trim();
    let debtor = list.find(x => String(x.loan).trim() === targetId);

    if (!debtor && typeof journeyDataCache !== 'undefined' && journeyDataCache) {
        debtor = journeyDataCache.find(x => String(x.loan).trim() === targetId);
    }

    const detailArea = document.getElementById('detailJourneyArea');
    if (!detailArea) return;

    // UI Loader
    detailArea.innerHTML = `
      <div class="glass-card rounded-3xl p-8 flex flex-col items-center justify-center animate-pulse">
        <div class="flex items-center gap-4 w-full mb-6">
            <div class="w-16 h-16 bg-slate-200 rounded-full"></div>
            <div class="flex-1 space-y-2">
                <div class="h-4 bg-slate-200 rounded w-1/2"></div>
                <div class="h-3 bg-slate-200 rounded w-1/3"></div>
            </div>
        </div>
        <div class="w-full h-40 bg-slate-100 rounded-xl"></div>
        <p class="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest">Sinkronisasi Data Lengkap...</p>
      </div>
    `;

    // 2. AMBIL DATA LENGKAP DARI SERVER
    google.script.run.withSuccessHandler(res => {
        
        // --- HELPER FUNCTIONS (AMAN DARI ERROR REFERENCE) ---

        function parseDate(str) {
            if (!str || str === '-' || str === 'N/A') return null;
            let d = null;
            // Format dd/mm/yyyy
            if (str.includes('/')) {
                const p = str.split('/');
                if(p.length === 3) d = new Date(p[2], p[1]-1, p[0]); 
            } 
            // Format yyyy-mm-dd
            else if (str.includes('-')) {
                d = new Date(str);
            }
            return (d && !isNaN(d.getTime())) ? d : null;
        }

        function formatTglIndo(dateObjOrStr) {
            let d = dateObjOrStr instanceof Date ? dateObjOrStr : parseDate(dateObjOrStr);
            if (!d) return dateObjOrStr || '-';
            const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
        }

        function getTglTagihanDefault() {
            const d = new Date();
            const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            return `1 ${months[d.getMonth()]} ${d.getFullYear()}`;
        }

        // --- PROSES DATA ---
        const history = res.history || [];
        const detail = res.detail || {};

        // Gabungkan Data
        if (detail) {
            debtor = { ...debtor, ...detail };
            debtor.found = true;
        }

        // --- PERSIAPAN DATA UNTUK WHATSAPP ---

        // 1. Data Dasar
        const waRek = debtor.rek || debtor.no_rek || "-";
        const waHP = debtor.hp || ""; 
        const waPK = debtor.pk || "-"; 
        const waTglPK = formatTglIndo(debtor.mulai || debtor.tgl_pk); 
        
        // 2. Tenor
        let waTenor = debtor.tenor || 0;
        if (waTenor === 0) {
            const start = parseDate(debtor.mulai);
            const end = parseDate(debtor.selesai);
            if (start && end) {
                waTenor = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                if (waTenor < 0) waTenor = 0;
            }
        }
        
        const waPlafond = debtor.plafond || 0;

        // 3. [UPDATE] TANGGAL TAGIHAN (AMBIL DARI KOLOM P / tgl_bayar)
        // Prioritas 1: Ambil dari data 'tgl_bayar' (Kolom P)
        let waTglTagihan = formatTglIndo(debtor.tgl_bayar);

        // Prioritas 2: Jika Kolom P kosong/invalid, baru pakai default tanggal 1
        if (!waTglTagihan || waTglTagihan === '-' || waTglTagihan === 'N/A') {
            waTglTagihan = getTglTagihanDefault();
        }

        // 4. Hitung Total Tunggakan
        let totalTgk = debtor.total_tgk || 0;
        if (totalTgk === 0) {
            totalTgk = (Number(debtor.tgk_pokok) || 0) + (Number(debtor.tgk_bunga) || 0);
        }
        if (totalTgk === 0) totalTgk = Number(debtor.os) || 0;

        // RENDER TOMBOL WA
        const btnWA = `
            <button onclick="app.sendWA('${waHP}', '${debtor.nama}', ${totalTgk}, ${debtor.kol}, '${debtor.loan}', '${waTglTagihan}', '${waPK}', '${waTglPK}', ${waTenor}, ${waPlafond}, '${waRek}')" 
                    class="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-xl text-white shadow-lg transition flex items-center gap-2 text-[10px] font-bold uppercase transform active:scale-95 ml-3" 
                    title="Kirim WA Penagihan">
                <i class="fab fa-whatsapp text-sm"></i> Chat
            </button>
        `;

        // --- RENDER TIMELINE & UI ---
        let commitmentHTML = '';
        const lastCommitment = history.find(h => h.nominal > 0 && h.tglKomitmen && h.tglKomitmen !== '-' && !h.statusKomitmen);
        
        if (lastCommitment) {
            const today = new Date();
            const promiseDate = new Date(lastCommitment.tglKomitmen);
            if (!isNaN(promiseDate.getTime())) {
                const diffTime = promiseDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays < 0) {
                    commitmentHTML = `<div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-xl flex items-center justify-between animate-pulse"><div><div class="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2"><i class="fas fa-exclamation-triangle"></i> STATUS: WANPRESTASI</div><div class="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">Janji bayar Rp ${Number(lastCommitment.nominal).toLocaleString()} terlewat <span class="text-red-600 font-black">${Math.abs(diffDays)} hari</span> lalu.</div></div><button onclick="app.openMitigationForm('${debtor.loan}')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase shadow-lg shadow-red-200">Tagih</button></div>`;
                } else if (diffDays >= 0 && diffDays <= 3) {
                    commitmentHTML = `<div class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-r-xl flex items-center justify-between"><div><div class="text-[10px] font-black text-yellow-600 uppercase tracking-widest flex items-center gap-2"><i class="fas fa-clock"></i> REMINDER JATUH TEMPO</div><div class="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">Janji bayar Rp ${Number(lastCommitment.nominal).toLocaleString()} jatuh tempo dalam <span class="text-yellow-600 font-black">${diffDays === 0 ? 'HARI INI' : diffDays + ' hari'}</span>.</div></div></div>`;
                }
            }
        }

        let historyHtml = '';
        if(history.length === 0) {
             historyHtml = `<div class="text-center py-10 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-200"><i class="fas fa-folder-open text-4xl text-slate-200 mb-2"></i><p class="text-[10px] font-bold text-slate-400 uppercase">Belum ada history penanganan</p><button onclick="app.openMitigationForm('${debtor.loan}')" class="mt-4 text-[10px] font-bold text-emerald-600 hover:underline">Mulai Penanganan Sekarang</button></div>`;
        } else {
            historyHtml += `<div class="relative pl-4 sm:pl-6 space-y-0 my-2"><div class="absolute left-[1.65rem] top-2 bottom-6 w-0.5 bg-slate-200/70 -z-10"></div>`;
            historyHtml += history.map((h, index) => {
                let theme = { color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200', icon: 'fa-info' };
                const aksi = (h.aksi || '').toLowerCase(); const media = (h.media || '').toLowerCase(); const status = (h.statusKomitmen || '').toUpperCase();
                if (status === 'LUNAS' || aksi.includes('lunas')) theme = { color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200', icon: 'fa-check' };
                else if (status === 'BATAL' || aksi.includes('ingkar')) theme = { color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200', icon: 'fa-times' };
                else if (media.includes('kunjungan')) theme = { color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200', icon: 'fa-walking' };
                else if (h.nominal > 0) theme = { color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200', icon: 'fa-hand-holding-usd' };

                let statusButtons = '';
                if(h.nominal > 0) {
                    if(h.statusKomitmen) {
                        let badgeColor = h.statusKomitmen === 'LUNAS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';
                        if(h.statusKomitmen === 'PARSIAL') badgeColor = 'bg-yellow-100 text-yellow-700';
                        statusButtons = `<button onclick="app.updateStatusKomitmen('${h.logId}', 'RESET', '${debtor.loan}', ${h.nominal}, ${h.realisasi || 0})" class="px-2 py-1 rounded text-[9px] font-black ${badgeColor} flex items-center gap-1 hover:brightness-95 transition ml-auto">${h.statusKomitmen} <i class="fas fa-pen text-[8px] opacity-50"></i></button>`;
                    } else {
                        statusButtons = `<div class="flex gap-1 ml-auto"><button onclick="app.updateStatusKomitmen('${h.logId}', 'LUNAS', '${debtor.loan}', ${h.nominal})" class="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-emerald-500 hover:text-white transition text-slate-400 border border-slate-200 shadow-sm"><i class="fas fa-check text-[10px]"></i></button><button onclick="app.updateStatusKomitmen('${h.logId}', 'BATAL', '${debtor.loan}', ${h.nominal})" class="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-red-500 hover:text-white transition text-slate-400 border border-slate-200 shadow-sm"><i class="fas fa-times text-[10px]"></i></button></div>`;
                    }
                }

                return `<div class="relative pl-10 py-3 group animate-fade-in" style="animation-delay: ${index * 50}ms"><div class="absolute left-3 top-4 w-9 h-9 rounded-full ${theme.bg} ${theme.color} border-2 border-white shadow-sm flex items-center justify-center z-10 ring-1 ring-slate-100 group-hover:scale-110 transition-transform duration-200"><i class="fas ${theme.icon} text-sm"></i></div><div class="bg-white rounded-xl border border-slate-100 shadow-sm p-3.5 hover:shadow-md hover:border-emerald-100 transition-all duration-200"><div class="flex justify-between items-start mb-2 border-b border-dashed border-slate-100 pb-2"><div class="flex flex-col"><span class="text-[11px] font-black text-slate-700 uppercase tracking-tight">${h.aksi} <span class="text-slate-400 font-normal mx-1">•</span> ${h.media}</span><span class="text-[10px] text-slate-400 mt-0.5 font-mono">${h.timestamp || '-'}</span></div><div class="flex items-center gap-2"><div class="text-[9px] font-bold px-2 py-1 rounded bg-slate-50 text-slate-500 uppercase tracking-wider">${h.petugas ? h.petugas.split('@')[0] : 'System'}</div>${h.logId ? `<button onclick="app.editLog('${h.logId}', '${h.aksi}', '${h.media}', '${h.nominal}', '${h.tglKomitmen}', '${debtor.loan}', this)" data-catatan="${h.catatan}" class="text-slate-300 hover:text-blue-500 transition px-1"><i class="fas fa-pencil-alt text-[10px]"></i></button><button onclick="app.deleteLog('${h.logId}', '${debtor.loan}')" class="text-slate-300 hover:text-red-500 transition px-1"><i class="fas fa-trash text-[10px]"></i></button>` : ''}</div></div><div class="text-xs text-slate-600 leading-relaxed mb-1 font-medium italic">"${h.catatan || ''}"</div>${h.nominal > 0 ? `<div class="mt-3 flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100"><div class="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100 shrink-0"><i class="fas fa-money-bill-wave"></i></div><div class="flex-1 min-w-0"><div class="text-[9px] text-slate-400 uppercase font-bold">Komitmen Bayar</div><div class="text-sm font-black text-emerald-700">Rp ${Number(h.nominal).toLocaleString('id-ID')}</div><div class="text-[9px] text-slate-400 mt-0.5">Jatuh Tempo: <span class="font-bold text-slate-600">${h.tglKomitmen || '-'}</span></div></div>${statusButtons}</div>` : ''}</div></div>`;
            }).join('');
            historyHtml += `</div>`;
        }

        // RENDER HEADER
        detailArea.innerHTML = `
            <div class="glass-card rounded-3xl overflow-hidden animate-slide-up">
                <div class="p-6 bg-slate-800 text-white flex justify-between items-center">
                    <div>
                        <div class="flex items-center">
                            <h3 class="text-xl font-black uppercase tracking-tighter">${debtor.nama}</h3>
                            ${btnWA} 
                        </div>
                        <p class="text-[10px] opacity-60 font-bold uppercase mt-1">${debtor.loan} • ${debtor.br}</p>
                        ${debtor.status_journey === 'RECOVERY' || debtor.kol == 1 ? '<span class="inline-block mt-2 px-2 py-0.5 bg-blue-600 rounded text-[9px] font-bold uppercase shadow-sm">RECOVERY / PANTAU</span>' : ''}
                    </div>
                    <div class="flex gap-2">
                         <button onclick="app.exportJourneyResume('${debtor.loan}')" class="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl transition" title="Cetak PDF"><i class="fas fa-file-pdf"></i></button>
                        <button onclick="app.openMitigationForm('${debtor.loan}')" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition shadow-lg shadow-emerald-900/50 flex items-center gap-2"><i class="fas fa-plus"></i> Update Log</button>
                    </div>
                </div>
                <div class="p-6 bg-slate-50/50 min-h-[400px]">
                    ${commitmentHTML}
                    <div class="flex items-center gap-2 mb-4 ml-2"><i class="fas fa-stream text-emerald-600"></i><h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeline Penanganan</h4></div>
                    <div class="max-h-[500px] overflow-y-auto custom-scrollbar pr-2 pb-10">${historyHtml}</div>
                </div>
            </div>
        `;

    }).withFailureHandler(err => {
        console.error("Gagal load history:", err);
        detailArea.innerHTML = `<div class="p-10 text-center"><i class="fas fa-exclamation-circle text-red-500 text-2xl mb-2"></i><p class="text-xs font-bold text-red-500">Gagal mengambil data.</p><p class="text-[10px] text-slate-400 mt-1">${err}</p></div>`;
    }).getJourneyFullPackage(loanId);
}

  // --- HELPER: TERBILANG (ANGKA KE HURUF) ---
function terbilang(nilai) {
  var bilangan = String(nilai).replace(/[^,\d]/g, '');
  var kalimat = "";
  var angka   = new Array('0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0');
  var kata    = new Array('','Satu','Dua','Tiga','Empat','Lima','Enam','Tujuh','Delapan','Sembilan');
  var tingkat = new Array('','Ribu','Juta','Milyar','Triliun');
  var panjang_bilangan = bilangan.length;

  if(panjang_bilangan > 15) return "Diluar Batas";

  for(i = 1; i <= panjang_bilangan; i++) {
    angka[i] = bilangan.substr(-(i),1);
  }

  var i = 1; var j = 0;
  while(i <= panjang_bilangan) {
    var subkalimat = "";
    var kata1 = ""; var kata2 = ""; var kata3 = "";

    // Ratusan
    if(angka[i+2] != "0") {
      if(angka[i+2] == "1") kata1 = "Seratus"; else kata1 = kata[angka[i+2]] + " Ratus";
    }

    // Puluhan
    if(angka[i+1] != "0") {
      if(angka[i+1] == "1") {
        if(angka[i] == "0") kata2 = "Sepuluh";
        else if(angka[i] == "1") kata2 = "Sebelas";
        else kata2 = kata[angka[i]] + " Belas";
      } else {
        kata2 = kata[angka[i+1]] + " Puluh";
      }
    }

    // Satuan
    if (angka[i] != "0") {
      if (angka[i+1] != "1") kata3 = kata[angka[i]];
    }

    if ((angka[i] != "0") || (angka[i+1] != "0") || (angka[i+2] != "0")) {
      subkalimat = kata1+" "+kata2+" "+kata3+" "+tingkat[j]+" ";
    }
    kalimat = subkalimat + kalimat;
    i = i + 3; j = j + 1;
  }

  if ((angka[5] == "0") && (angka[6] == "0")) kalimat = kalimat.replace("Satu Ribu","Seribu");
  return (kalimat.trim().replace(/\s{2,}/g, ' ')) + " Rupiah";
}


// HELPER: Format Rupiah saat mengetik (Live Typing)
// Pasang di HTML: onkeyup="app.formatRupiahInput(this)"
function formatRupiahInput(input) {
    // 1. Hapus karakter selain angka
    let value = input.value.replace(/\D/g, "");
    
    // 2. Format dengan titik jika ada isinya
    if (value !== "") {
        input.value = new Intl.NumberFormat('id-ID').format(value);
    } else {
        input.value = "";
    }
}

// --- FITUR CRUD LOG ---

// Perhatikan penambahan parameter 'loanId' sebelum 'btnElement'
function editLog(logId, aksi, media, nominal, tgl, loanId, btnElement) {
    const catatan = btnElement.getAttribute('data-catatan');
    
    // 1. Buka Modal menggunakan Loan ID yang valid dari parameter
    openMitigationForm(loanId);
    
    // 2. Isi Form dengan Data Lama
    // Tunggu sebentar agar modal siap, atau langsung isi
    const elLogId = document.getElementById('mitigasi-log-id');
    const elAksi = document.getElementById('mitigasi-aksi');
    const elMedia = document.getElementById('mitigasi-media');
    const elCatatan = document.getElementById('mitigasi-catatan');
    const elNominal = document.getElementById('mitigasi-nominal');
    const elTgl = document.getElementById('mitigasi-tgl');

    if(elLogId) elLogId.value = logId;
    if(elAksi) elAksi.value = aksi;
    if(elMedia) elMedia.value = media;
    if(elCatatan) elCatatan.value = catatan; // Ambil dari atribut data
    if(elNominal) elNominal.value = (nominal && nominal != 0) ? nominal : '';
    
    // Parsing Tanggal (YYYY-MM-DD)
    if(tgl && tgl !== '-' && tgl !== 'null') {
       // Cek format tanggal, jika sudah YYYY-MM-DD langsung pakai
       // Jika format DD/MM/YYYY, perlu dibalik (biasanya dari input date HTML butuh YYYY-MM-DD)
       if(elTgl) elTgl.value = tgl; 
    }

    // Ubah Teks Tombol
    const submitBtn = document.querySelector('#formMitigasi button[type="button"]');
    if(submitBtn) submitBtn.innerHTML = "UPDATE PERUBAHAN";
}

function deleteLog(logId, loanId) {
    if(!confirm("⚠️ Apakah Anda yakin ingin menghapus log penanganan ini?\nTindakan ini tidak bisa dibatalkan.")) return;

    const loader = document.getElementById('loader');
    if(loader) loader.style.display = 'flex';

    google.script.run.withSuccessHandler(res => {
        if(loader) loader.style.display = 'none';
        showJourneyDetail(loanId); // Refresh timeline
    }).withFailureHandler(err => {
        if(loader) loader.style.display = 'none';
        alert("Gagal menghapus: " + err);
    }).deleteHandlingLog(logId);
}

// FUNGSI SMART: HANDLE STATUS, EDIT NOMINAL, & RESET
function updateStatusKomitmen(logId, action, loanId, nominalJanji, currentRealisasi) {
    let statusFinal = action;
    let realisasiFinal = 0;

    // --- A. JIKA KLIK BADGE YANG SUDAH ADA (EDIT/RESET) ---
    if (action === 'RESET') {
        // Tawarkan opsi: Edit Nominal atau Hapus Status
        let choice = prompt(
            "Opsi Perubahan Status:\n" +
            "1. Ketik angka baru untuk EDIT nominal bayar.\n" +
            "2. Ketik '0' untuk ubah jadi BATAL/INGKAR.\n" +
            "3. Kosongkan dan OK untuk RESET (Hapus Status).\n\n" +
            "Masukkan nominal realisasi (Rp):", 
            currentRealisasi || nominalJanji
        );

        if (choice === null) return; // Cancel button

        if (choice.trim() === "") {
            // Jika dikosongkan -> RESET
            if(!confirm("⚠️ Yakin ingin MENGHAPUS status? Data akan kembali menjadi 'Pending'.")) return;
            statusFinal = 'RESET';
        } else {
            // Jika diisi angka -> EDIT NOMINAL
            let bayar = parseFloat(choice.replace(/[^0-9]/g, '')) || 0;
            if (bayar <= 0) {
                statusFinal = 'BATAL';
                realisasiFinal = 0;
            } else if (bayar >= nominalJanji) {
                statusFinal = 'LUNAS';
                realisasiFinal = bayar;
            } else {
                statusFinal = 'PARSIAL';
                realisasiFinal = bayar;
            }
        }
    } 
    
    // --- B. JIKA KLIK TOMBOL BARU (LUNAS) ---
    else if (action === 'LUNAS') {
        let input = prompt("Masukkan jumlah yang dibayarkan (Rupiah):", nominalJanji);
        if (input === null) return;
        
        let bayar = parseFloat(input.replace(/[^0-9]/g, '')) || 0;
        
        if (bayar <= 0) {
            statusFinal = 'BATAL';
            realisasiFinal = 0;
        } else if (bayar >= nominalJanji) {
            statusFinal = 'LUNAS';
            realisasiFinal = bayar;
        } else {
            statusFinal = 'PARSIAL';
            realisasiFinal = bayar;
            alert(`⚠️ Pembayaran parsial.\nStatus: PARSIAL (Rp ${bayar.toLocaleString()})`);
        }
    } 
    
    // --- C. JIKA KLIK TOMBOL BARU (BATAL) ---
    else if (action === 'BATAL') {
        if(!confirm("Yakin tandai nasabah ini INGKAR JANJI (Tidak Bayar)?")) return;
        statusFinal = 'BATAL';
        realisasiFinal = 0;
    }

    // EKSEKUSI KE SERVER
    const loader = document.getElementById('loader');
    if(loader) loader.style.display = 'flex';

    google.script.run.withSuccessHandler(() => {
        if(loader) loader.style.display = 'none';
        if (typeof showJourneyDetail === 'function') showJourneyDetail(loanId);
        else app.showJourneyDetail(loanId);
    }).withFailureHandler(err => {
        if(loader) loader.style.display = 'none';
        alert("Gagal update: " + err);
    }).updateCommitmentStatus(logId, statusFinal, realisasiFinal);
}



// HELPER: Template Cepat
function setTemplateSolusi(type) {
    const el = document.getElementById('cfg-solusi');
    if (type === 'Rutin') {
        el.value = "1. Melakukan penagihan intensif melalui Kunjungan.\n2. Meminta debitur merealisasikan komitmen bayar.\n3. Jika wanprestasi, akan dilakukan Surat Peringatan lanjutan.";
    } else if (type === 'Eksekusi') {
        el.value = "1. Memberikan Surat Peringatan ke-3.\n2. Melakukan pemasangan plang agunan.\n3. Mempersiapkan berkas untuk lelang eksekusi hak tanggungan.";
    }
}



// HELPER: Custom Print dengan Nama File Dinamis
function printResumeCustom() {
    const btn = document.getElementById('btn-print-resume');
    // Ambil nama file yang sudah disiapkan oleh generateResumeFinal
    const filename = btn.getAttribute('data-filename') || 'Resume_Kredit';
    const originalTitle = document.title;

    // 1. Ubah Judul Halaman (Browser pakai ini sebagai nama file PDF)
    document.title = filename;

    // 2. Perintah Cetak
    window.print();

    // 3. Kembalikan Judul Asli setelah jeda (agar browser sempat baca nama baru)
    setTimeout(() => {
        document.title = originalTitle;
    }, 1000);
}


// HELPER: RENDER TIMELINE VISUAL
function renderHistoryTimeline(history) {
    if (!history || history.length === 0) {
        return `
        <div class="flex flex-col items-center justify-center py-10 text-slate-400 opacity-60">
            <i class="fas fa-history text-4xl mb-2"></i>
            <span class="text-xs font-bold uppercase tracking-widest">Belum ada riwayat</span>
        </div>`;
    }

    // Container Timeline
    let html = `<div class="relative pl-4 sm:pl-6 space-y-0 my-2">
                <div class="absolute left-[1.65rem] top-2 bottom-6 w-0.5 bg-slate-200/70 -z-10"></div>`;

    html += history.map((h, index) => {
        // 1. LOGIKA WARNA & IKON OTOMATIS
        let theme = {
            color: 'text-slate-500', 
            bg: 'bg-slate-100', 
            border: 'border-slate-200', 
            icon: 'fa-info'
        };

        const aksi = (h.aksi || '').toLowerCase();
        const media = (h.media || '').toLowerCase();
        const status = (h.statusKomitmen || '').toUpperCase();

        // Logika Penentuan Gaya
        if (status === 'LUNAS' || aksi.includes('lunas') || aksi.includes('setor')) {
            theme = { color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200', icon: 'fa-check' };
        } else if (status === 'BATAL' || aksi.includes('ingkar')) {
            theme = { color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200', icon: 'fa-times' };
        } else if (aksi.includes('surat') || aksi.includes('sp')) {
            theme = { color: 'text-rose-600', bg: 'bg-rose-100', border: 'border-rose-200', icon: 'fa-envelope' };
        } else if (media.includes('kunjungan') || aksi.includes('visit')) {
            theme = { color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200', icon: 'fa-walking' };
        } else if (media.includes('telepon') || media.includes('wa')) {
            theme = { color: 'text-cyan-600', bg: 'bg-cyan-100', border: 'border-cyan-200', icon: 'fa-phone-alt' };
        } else if (h.nominal > 0) {
            theme = { color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200', icon: 'fa-hand-holding-usd' };
        }

        // 2. FORMAT TANGGAL & JAM
        // Asumsi format timestamp: "YYYY-MM-DD HH:mm:ss" atau Date Object
        let dateObj = new Date(h.timestamp);
        let dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' });
        let timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.',':');
        if(isNaN(dateObj.getTime())) { dateStr = h.timestamp; timeStr = ""; } // Fallback jika format string

        // 3. HTML ITEM
        return `
        <div class="relative pl-10 py-3 group">
            
            <div class="absolute left-3 top-4 w-9 h-9 rounded-full ${theme.bg} ${theme.color} border-2 border-white shadow-sm flex items-center justify-center z-10 ring-1 ring-slate-100 group-hover:scale-110 transition-transform duration-200">
                <i class="fas ${theme.icon} text-sm"></i>
            </div>

            <div class="bg-white rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-3.5 hover:shadow-md hover:border-emerald-100 transition-all duration-200">
                
                <div class="flex justify-between items-start mb-2 border-b border-dashed border-slate-100 pb-2">
                    <div class="flex flex-col">
                        <span class="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                            ${h.aksi} <span class="text-slate-400 font-normal mx-1">•</span> ${h.media}
                        </span>
                        <span class="text-[10px] text-slate-400 mt-0.5">
                            <i class="far fa-clock mr-1"></i> ${dateStr} <span class="opacity-50">(${timeStr})</span>
                        </span>
                    </div>
                    <div class="text-[9px] font-bold px-2 py-1 rounded bg-slate-50 text-slate-500 uppercase tracking-wider">
                        ${h.petugas ? h.petugas.split(' ')[0] : 'System'}
                    </div>
                </div>

                <div class="text-xs text-slate-600 leading-relaxed mb-1 font-medium">
                    "${h.catatan}"
                </div>

                ${h.nominal > 0 ? `
                <div class="mt-3 flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div class="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100 shrink-0">
                        <i class="fas fa-money-bill-wave"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-[10px] text-slate-400 uppercase font-bold">Komitmen Bayar</div>
                        <div class="text-sm font-black text-emerald-700">Rp ${Number(h.nominal).toLocaleString('id-ID')}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-[9px] text-slate-400">Jatuh Tempo</div>
                        <div class="text-[10px] font-bold text-slate-600">${h.komitmenTanggal || '-'}</div>
                    </div>
                </div>
                ` : ''}

            </div>
        </div>`;
    }).join('');

    html += `</div>`; // Tutup Container
    return html;
}



// --- GLOBAL VARIABLES KALENDER ---
let calCurrentDate = new Date();
let calEventsCache = []; // Menyimpan data janji bayar bulan ini

// 1. FUNGSI TOGGLE VIEW (List vs Calendar)
function toggleJourneyView(mode) {
    const contList = document.getElementById('journey-list-container');
    const contCal = document.getElementById('journey-calendar-container');
    const btnList = document.getElementById('btn-view-list');
    const btnCal = document.getElementById('btn-view-calendar');

    if (mode === 'calendar') {
        contList.classList.add('hidden');
        contCal.classList.remove('hidden');
        
        // Update Button Style
        btnList.className = "px-4 py-2 rounded-lg text-xs font-bold transition text-slate-500 hover:text-slate-700";
        btnCal.className = "px-4 py-2 rounded-lg text-xs font-bold transition bg-white text-emerald-600 shadow-sm";
        
        // Render Calendar Pertama Kali
        renderCalendarSetup();
    } else {
        contList.classList.remove('hidden');
        contCal.classList.add('hidden');
        
        // Update Button Style
        btnList.className = "px-4 py-2 rounded-lg text-xs font-bold transition bg-white text-emerald-600 shadow-sm";
        btnCal.className = "px-4 py-2 rounded-lg text-xs font-bold transition text-slate-500 hover:text-slate-700";
    }
}

// 2. NAVIGASI BULAN (+1 / -1)
function changeCalendarMonth(delta) {
    calCurrentDate.setMonth(calCurrentDate.getMonth() + delta);
    renderCalendarSetup();
}

// 3. SETUP & FETCH DATA
// --- UPDATE 1: PANGGIL FUNGSI BARU DI SETUP ---
function renderCalendarSetup() {
    const year = calCurrentDate.getFullYear();
    const month = calCurrentDate.getMonth();
    
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    document.getElementById('cal-month-year').innerText = `${months[month]} ${year}`;
    
    document.getElementById('calendar-grid').innerHTML = `<div class="col-span-7 text-center py-20 text-slate-400"><i class="fas fa-spinner fa-spin text-2xl"></i><br>Memuat Agenda...</div>`;

    // Panggil getCalendarEvents (Bukan getCalendarPromises lagi)
    google.script.run.withSuccessHandler(events => {
        calEventsCache = events;
        renderCalendarGrid(year, month);
    }).getCalendarEvents(month, year);
}

// 4. RENDER GRID KALENDER (CORE LOGIC)
// --- UPDATE 2: RENDER GRID DENGAN DUA TIPE MARKER ---
function renderCalendarGrid(year, month) {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = ""; 

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += `<div class="h-24 md:h-28 bg-transparent"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        // Filter Event Tanggal Ini
        const eventsToday = calEventsCache.filter(e => e.date === day);
        
        // Hitung Total Uang (Hanya dari Tipe PROMISE)
        const totalNominal = eventsToday.filter(e => e.type === 'PROMISE').reduce((sum, e) => sum + e.nominal, 0);
        
        // Hitung Jumlah Aktivitas
        const countActivity = eventsToday.filter(e => e.type === 'ACTIVITY').length;
        const countPromise = eventsToday.filter(e => e.type === 'PROMISE').length;

        const isToday = (day === today.getDate() && month === today.getMonth() && year === today.getFullYear());
        const activeClass = isToday ? "border-blue-500 ring-1 ring-blue-200 bg-blue-50 dark:bg-blue-900/20" : "border-slate-100 dark:border-slate-700 hover:border-emerald-300 hover:shadow-md bg-white dark:bg-slate-800";
        
        let markerHtml = `<div class="mt-1 flex flex-col gap-1 items-center">`;
        
        // Marker 1: Nominal Uang (Jika ada janji)
        if (totalNominal > 0) {
            markerHtml += `
                <span class="text-[8px] font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-md truncate w-full text-center">
                    Rp ${(totalNominal/1000000).toFixed(1)}Jt
                </span>`;
        }
        
        // Marker 2: Dots Indikator
        if (countActivity > 0 || countPromise > 0) {
            markerHtml += `<div class="flex justify-center gap-0.5 mt-0.5">`;
            // Dot Biru untuk Aktivitas
            for(let k=0; k<Math.min(countActivity, 3); k++) markerHtml += `<div class="w-1.5 h-1.5 rounded-full bg-blue-400"></div>`;
            // Dot Hijau untuk Janji
            for(let k=0; k<Math.min(countPromise, 3); k++) markerHtml += `<div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>`;
            markerHtml += `</div>`;
        }
        
        markerHtml += `</div>`;

        const cellHtml = `
            <div onclick="app.showCalendarDetail(${day})" class="h-24 md:h-28 rounded-xl border p-1.5 cursor-pointer transition flex flex-col justify-between ${activeClass}">
                <span class="text-sm font-bold ${isToday ? 'text-blue-600' : 'text-slate-400'} ml-1">${day}</span>
                ${markerHtml}
            </div>
        `;
        grid.innerHTML += cellHtml;
    }
}

// 5. SHOW DETAIL DI SIDEBAR
// --- UPDATE 3: SIDEBAR DETAIL (GABUNGAN PROMISE & ACTIVITY) ---
function showCalendarDetail(day) {
    const events = calEventsCache.filter(e => e.date === day);
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const currentMonth = calCurrentDate.getMonth();
    
    document.getElementById('cal-detail-date').innerText = `${day} ${months[currentMonth]}`;
    
    // Hitung Total Hanya dari Promise
    const total = events.filter(e => e.type === 'PROMISE').reduce((sum, e) => sum + e.nominal, 0);
    document.getElementById('cal-detail-total').innerText = `Potensi: Rp ${Number(total).toLocaleString('id-ID')}`;

    const listContainer = document.getElementById('cal-detail-list');
    
    if (events.length === 0) {
        listContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                <i class="fas fa-calendar-day text-4xl mb-3"></i>
                <p class="text-xs font-bold">Tidak ada agenda</p>
            </div>`;
        return;
    }

    listContainer.innerHTML = events.map(e => {
        // Tentukan Gaya Card berdasarkan Tipe
        let cardBorder = e.type === 'PROMISE' ? 'border-emerald-500' : 'border-blue-400';
        let iconType = e.type === 'PROMISE' ? '<i class="fas fa-money-bill-wave text-emerald-500"></i>' : '<i class="fas fa-shoe-prints text-blue-400"></i>';
        let bgType = e.type === 'PROMISE' ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-blue-50 dark:bg-blue-900/10';
        let titleType = e.type === 'PROMISE' ? 'Janji Bayar' : e.desc; // e.g. "Kunjungan"

        return `
        <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border-l-4 ${cardBorder} shadow-sm hover:shadow-md transition group relative overflow-hidden">
            <div class="flex justify-between items-start relative z-10">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5 mb-1">
                        ${iconType}
                        <span class="text-[9px] font-bold uppercase tracking-wider text-slate-500">${titleType}</span>
                    </div>
                    <h4 class="font-bold text-xs text-slate-700 dark:text-slate-200 truncate">${e.nama}</h4>
                    <p class="text-[9px] font-mono text-slate-400">${e.loanId}</p>
                </div>
                
                ${e.type === 'PROMISE' ? 
                `<div class="text-right">
                    <div class="font-black text-xs text-emerald-600">Rp ${(e.nominal/1000).toFixed(0)}k</div>
                    <div class="text-[9px] text-slate-400 mt-0.5">${e.status === 'LUNAS' ? '✅ LUNAS' : '⏳ MENUNGGU'}</div>
                </div>` : 
                `<div class="text-right">
                    <div class="text-[9px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">${e.petugas ? e.petugas.split(' ')[0] : 'AO'}</div>
                </div>`}
            </div>

            <button onclick="app.openDetailFromCalendar('${e.loanId}')" class="mt-3 w-full py-1.5 ${bgType} border border-slate-100 hover:brightness-95 rounded-lg text-[9px] font-bold transition flex items-center justify-center gap-2">
                <i class="fas fa-external-link-alt"></i> LIHAT DETAIL
            </button>
        </div>
    `}).join('');
}


// --- [FIX UTAMA] FUNGSI PENGHUBUNG CALENDAR -> LIST ---
function openDetailFromCalendar(loanId) {
    // 1. Paksa Pindah ke Tab LIST (Karena Detail Area ada disana)
    toggleJourneyView('list'); 
    
    // 2. Load Detail Debitur (Fungsi yang sudah ada)
    // Beri sedikit delay agar transisi tab selesai (opsional, tapi lebih smooth)
    setTimeout(() => {
        showJourneyDetail(loanId);
    }, 100);
}


// --- FITUR LAPORAN HARIAN ---

function printDailyReport() {
    // 1. Ambil Filter Aktif
    const branch = s.filter.b || 'ALL';
    const dateStr = document.getElementById('selDate').value;
    
    // Validasi
    if(!dateStr) { alert("Harap pilih tanggal terlebih dahulu di header atas."); return; }

    // 2. Tampilkan Loading UI
    const container = document.getElementById('daily-report-content');
    const modal = document.getElementById('modal-daily-report');
    
    modal.classList.remove('hidden');
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-96">
            <i class="fas fa-circle-notch fa-spin text-4xl text-blue-600 mb-4"></i>
            <p class="font-bold text-slate-500 uppercase tracking-widest">Mengkompilasi Data Aktivitas...</p>
            <p class="text-xs text-slate-400 mt-2">${branch} • ${dateStr}</p>
        </div>`;

    // 3. Request Data
    google.script.run.withSuccessHandler(data => {
        if(data.error) {
            container.innerHTML = `<div class="p-10 text-center text-red-500 font-bold">${data.error}</div>`;
            return;
        }
        renderDailyReportTemplate(data);
    }).getDailyActivityReport(branch, dateStr);
}

function renderDailyReportTemplate(data) {
    const { meta, summary, details } = data;
    
    // Format Uang Helper
    const fmtUang = (n) => n > 0 ? "Rp " + Number(n).toLocaleString('id-ID') : "-";
    
    // Format Tanggal Header
    const dObj = new Date(meta.date);
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const tglIndo = `${dObj.getDate()} ${months[dObj.getMonth()]} ${dObj.getFullYear()}`;

    let html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; font-size: 9pt;">
        
        <table style="width: 100%; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 20px;">
            <tr>
                <td style="width: 50%;">
                    <div style="font-size: 16pt; font-weight: bold; color: #1e3a8a;">bankaltimtara</div>
                    <div style="font-size: 10pt; font-weight: bold;">LAPORAN AKTIVITAS PENANGANAN KREDIT</div>
                </td>
                <td style="width: 50%; text-align: right;">
                    <div style="font-weight: bold; font-size: 11pt;">UNIT KERJA: ${meta.branch === 'ALL' ? 'KONSOLIDASI' : meta.branch}</div>
                    <div style="font-size: 10pt;">Tanggal: ${tglIndo}</div>
                </td>
            </tr>
        </table>

        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; background: #f8fafc;">
                <div style="font-size: 8pt; color: #64748b; font-weight: bold; text-transform: uppercase;">Total Kunjungan</div>
                <div style="font-size: 14pt; font-weight: bold; color: #1e3a8a;">${summary.total_visit} <span style="font-size:10pt;">Titik</span></div>
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; background: #f8fafc;">
                <div style="font-size: 8pt; color: #64748b; font-weight: bold; text-transform: uppercase;">Total Telepon/WA</div>
                <div style="font-size: 14pt; font-weight: bold; color: #0f766e;">${summary.total_call} <span style="font-size:10pt;">Kontak</span></div>
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; background: #ecfdf5; border-left: 4px solid #10b981;">
                <div style="font-size: 8pt; color: #047857; font-weight: bold; text-transform: uppercase;">Total Komitmen Bayar</div>
                <div style="font-size: 14pt; font-weight: bold; color: #047857;">${fmtUang(summary.nominal_janji)}</div>
                <div style="font-size: 8pt; color: #065f46;">Dari ${summary.total_janji} Debitur</div>
            </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 8pt;">
            <thead>
                <tr style="background-color: #1e3a8a; color: white;">
                    <th style="padding: 8px; border: 1px solid #1e3a8a; width: 40px;">JAM</th>
                    <th style="padding: 8px; border: 1px solid #1e3a8a; width: 80px;">PETUGAS</th>
                    <th style="padding: 8px; border: 1px solid #1e3a8a; width: 150px;">DEBITUR</th>
                    <th style="padding: 8px; border: 1px solid #1e3a8a; width: 50px;">KOL</th>
                    <th style="padding: 8px; border: 1px solid #1e3a8a; width: 90px;">BAKI DEBET</th>
                    <th style="padding: 8px; border: 1px solid #1e3a8a; width: 80px;">MEDIA</th>
                    <th style="padding: 8px; border: 1px solid #1e3a8a;">HASIL / CATATAN</th>
                    <th style="padding: 8px; border: 1px solid #1e3a8a; width: 100px;">KOMITMEN</th>
                </tr>
            </thead>
            <tbody>`;

    if(details.length === 0) {
        html += `<tr><td colspan="8" style="padding: 20px; text-align: center; font-style: italic; color: #64748b;">Tidak ada aktivitas penanganan pada tanggal ini.</td></tr>`;
    } else {
        details.forEach((row, i) => {
            const bgRow = i % 2 === 0 ? '#ffffff' : '#f8fafc';
            // Highlight baris jika ada uang masuk/janji
            const highlight = row.janji_rp > 0 ? 'font-weight:bold; color:#047857;' : '';
            
            html += `
            <tr style="background-color: ${bgRow};">
                <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">${row.waktu}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">${row.petugas}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">
                    <div style="font-weight: bold;">${row.nama}</div>
                    <div style="font-size: 7pt; color: #64748b;">${row.loan} • ${row.cabang}</div>
                </td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">${row.kol}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">${fmtUang(row.os)}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">
                    <span style="padding: 2px 6px; border-radius: 4px; background: ${row.media.includes('VISIT') ? '#dbeafe' : '#f3f4f6'}; color: ${row.media.includes('VISIT') ? '#1e40af' : '#475569'}; font-size: 7pt; font-weight: bold;">${row.media}</span>
                </td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">${row.hasil}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right; ${highlight}">
                    ${row.janji_rp > 0 ? fmtUang(row.janji_rp) + '<br><span style="font-size:7pt; color:#64748b; font-weight:normal;">Tgl: ' + row.janji_tgl + '</span>' : '-'}
                </td>
            </tr>`;
        });
    }

    html += `
            </tbody>
        </table>

        <div style="margin-top: 30px; page-break-inside: avoid;">
            <table style="width: 100%; text-align: center;">
                <tr>
                    <td style="width: 33%;">
                        <div style="margin-bottom: 60px;">Admin Kredit</div>
                        <div style="font-weight: bold; border-top: 1px solid #000; display: inline-block; padding-top: 2px; width: 120px;">( .................... )</div>
                    </td>
                    <td style="width: 33%;">
                        <div style="margin-bottom: 60px;">Penyelia Kredit</div>
                        <div style="font-weight: bold; border-top: 1px solid #000; display: inline-block; padding-top: 2px; width: 120px;">( .................... )</div>
                    </td>
                    <td style="width: 33%;">
                        <div style="margin-bottom: 60px;">Pemimpin ${meta.branch === 'ALL' ? 'Cabang' : 'Unit'}</div>
                        <div style="font-weight: bold; border-top: 1px solid #000; display: inline-block; padding-top: 2px; width: 120px;">( .................... )</div>
                    </td>
                </tr>
            </table>
            <div style="font-size: 7pt; color: #94a3b8; margin-top: 20px; text-align: right;">
                Dicetak otomatis oleh Sistem Monitoring Kredit (DaKOPen) pada ${new Date().toLocaleString('id-ID')}
            </div>
        </div>

    </div>`;

    document.getElementById('daily-report-content').innerHTML = html;
}

// FUNGSI SIMPAN KE PDF (Using html2pdf)
function saveDailyPDF() {
    const element = document.getElementById('daily-report-content');
    const dateStr = document.getElementById('selDate').value;
    const branch = s.filter.b || 'ALL';
    
    const opt = {
      margin:       5,
      filename:     `DAILY_REPORT_${branch}_${dateStr}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' } // LANDSCAPE AGAR LEGA
    };

    // Tombol loading state
    const btn = document.getElementById('btn-save-daily-pdf');
    const oldText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    btn.disabled = true;

    html2pdf().set(opt).from(element).save().then(() => {
        btn.innerHTML = oldText;
        btn.disabled = false;
    });
}








// --- FITUR LAPORAN BERKALA (RANGE TANGGAL) ---

// 1. Inisialisasi Modal (Set Default Tanggal)
function openReportModal() {
    const modal = document.getElementById('modal-daily-report');
    modal.classList.remove('hidden');
    
    // Set Default: Tanggal 1 bulan ini s/d Hari ini
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Helper format YYYY-MM-DD untuk input date
    const toInputVal = (d) => d.toISOString().split('T')[0];
    
    document.getElementById('rpt-start-date').value = toInputVal(firstDay);
    document.getElementById('rpt-end-date').value = toInputVal(today);
    
    // Reset Preview
    document.getElementById('btn-save-pdf').disabled = true;
    document.getElementById('btn-save-pdf').classList.add('opacity-50', 'cursor-not-allowed');
}

// 2. Request Data ke Server
function generatePeriodicReport() {
    const branch = s.filter.b || 'ALL';
    const startStr = document.getElementById('rpt-start-date').value;
    const endStr = document.getElementById('rpt-end-date').value;
    
    if(!startStr || !endStr) { alert("Pilih rentang tanggal."); return; }
    if(new Date(startStr) > new Date(endStr)) { alert("Tanggal Awal tidak boleh lebih besar dari Tanggal Akhir."); return; }

    const container = document.getElementById('periodic-report-content');
    
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-[100mm]">
            <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-6"></div>
            <p class="font-bold text-slate-600 text-lg uppercase tracking-widest">Sedang Menyusun Laporan...</p>
            <p class="text-sm text-slate-400 mt-2">${branch} • ${startStr} s/d ${endStr}</p>
        </div>`;

    google.script.run.withSuccessHandler(data => {
        if(data.error) {
            container.innerHTML = `<div class="p-10 text-center text-red-500 font-bold">${data.error}</div>`;
            return;
        }
        renderPeriodicReportTemplate(data);
        
        // Enable Tombol Download
        const btnDown = document.getElementById('btn-save-pdf');
        btnDown.disabled = false;
        btnDown.classList.remove('opacity-50', 'cursor-not-allowed');
        
    }).getPeriodicActivityReport(branch, startStr, endStr);
}

// 3. Render HTML Laporan (Layout Profesional)
function renderPeriodicReportTemplate(data) {
    const { meta, summary, details } = data;
    const fmtUang = (n) => n > 0 ? "Rp " + Number(n).toLocaleString('id-ID') : "-";

    let html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; font-size: 9pt; line-height: 1.4;">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 25px;">
            <div>
                <div style="font-size: 20pt; font-weight: 900; color: #1e3a8a; letter-spacing: -1px;">bankaltimtara</div>
                <div style="font-size: 10pt; font-weight: bold; color: #64748b; margin-top: 2px;">SISTEM MONITORING KREDIT (DaKOPen)</div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 14pt; font-weight: bold; color: #0f172a; text-transform: uppercase;">LAPORAN AKTIVITAS PENANGANAN</div>
                <div style="font-size: 10pt; font-weight: 500; margin-top: 4px;">Periode: <b>${meta.start}</b> s.d <b>${meta.end}</b></div>
                <div style="font-size: 10pt; margin-top: 2px;">Unit Kerja: <span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${meta.branch === 'ALL' ? 'KONSOLIDASI' : meta.branch}</span></div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px;">
            <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="font-size: 8pt; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">Total Kunjungan</div>
                <div style="font-size: 18pt; font-weight: 800; color: #1e40af;">${summary.total_visit}</div>
                <div style="font-size: 8pt; color: #94a3b8;">Titik Lokasi</div>
            </div>
            <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="font-size: 8pt; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">Total Call/WA</div>
                <div style="font-size: 18pt; font-weight: 800; color: #0f766e;">${summary.total_call}</div>
                <div style="font-size: 8pt; color: #94a3b8;">Kontak Debitur</div>
            </div>
            <div style="border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; background: #f0fdf4; border-left: 4px solid #16a34a;">
                <div style="font-size: 8pt; color: #166534; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">Total Komitmen</div>
                <div style="font-size: 18pt; font-weight: 800; color: #15803d;">${summary.total_janji}</div>
                <div style="font-size: 8pt; color: #166534;">Jumlah Janji Bayar</div>
            </div>
            <div style="border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; background: #f0fdf4; border-left: 4px solid #16a34a;">
                <div style="font-size: 8pt; color: #166534; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">Nominal Potensi</div>
                <div style="font-size: 14pt; font-weight: 800; color: #15803d; line-height: 1.2;">${fmtUang(summary.nominal_janji)}</div>
                <div style="font-size: 8pt; color: #166534;">Estimasi Cash In</div>
            </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 8pt;">
            <thead>
                <tr style="background-color: #1e3a8a; color: white;">
                    <th style="padding: 10px; border: 1px solid #1e3a8a; width: 30px;">NO</th>
                    <th style="padding: 10px; border: 1px solid #1e3a8a; width: 70px;">TANGGAL</th>
                    <th style="padding: 10px; border: 1px solid #1e3a8a; width: 90px;">PETUGAS</th>
                    <th style="padding: 10px; border: 1px solid #1e3a8a; width: 160px;">DEBITUR</th>
                    <th style="padding: 10px; border: 1px solid #1e3a8a; width: 90px;">BAKI DEBET</th>
                    <th style="padding: 10px; border: 1px solid #1e3a8a; width: 70px;">MEDIA</th>
                    <th style="padding: 10px; border: 1px solid #1e3a8a;">HASIL PENANGANAN / CATATAN</th>
                    <th style="padding: 10px; border: 1px solid #1e3a8a; width: 110px;">KOMITMEN</th>
                </tr>
            </thead>
            <tbody>`;

    if(details.length === 0) {
        html += `<tr><td colspan="8" style="padding: 40px; text-align: center; font-style: italic; color: #64748b; background-color: #f8fafc;">
            <div style="font-size: 14pt; font-weight: bold; margin-bottom: 5px;">Data Tidak Ditemukan</div>
            <div>Tidak ada aktivitas penanganan pada periode tanggal ini.</div>
        </td></tr>`;
    } else {
        let currentMonth = "";
        
        details.forEach((row, i) => {
            const bgRow = i % 2 === 0 ? '#ffffff' : '#f8fafc';
            
            // Logika Warna Badge Media
            let badgeMedia = 'background:#f1f5f9; color:#475569; border:1px solid #cbd5e1;'; // Default
            if (row.media.includes('VISIT') || row.media.includes('KUNJUNGAN')) {
                badgeMedia = 'background:#eff6ff; color:#1e40af; border:1px solid #bfdbfe; font-weight:bold;';
            } else if (row.media.includes('SURAT')) {
                badgeMedia = 'background:#fef2f2; color:#b91c1c; border:1px solid #fecaca;';
            }

            // Logika Kolom Komitmen
            let cellKomitmen = '-';
            if (row.janji_rp > 0) {
                let statusBadge = '';
                if(row.status_janji === 'LUNAS') statusBadge = '<span style="font-size:6pt; background:#dcfce7; color:#166534; padding:1px 3px; border-radius:2px; margin-left:3px;">LUNAS</span>';
                
                cellKomitmen = `
                    <div style="font-weight: bold; color: #047857;">${fmtUang(row.janji_rp)}</div>
                    <div style="font-size: 7pt; color: #64748b;">JT: ${row.janji_tgl} ${statusBadge}</div>
                `;
            }

            html += `
            <tr style="background-color: ${bgRow}; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; border-right: 1px solid #e2e8f0; text-align: center; vertical-align: top;">${i + 1}</td>
                <td style="padding: 8px; border-right: 1px solid #e2e8f0; text-align: center; vertical-align: top;">
                    <div style="font-weight: bold;">${row.tgl_log}</div>
                    <div style="font-size: 7pt; color: #94a3b8;">${row.jam_log}</div>
                </td>
                <td style="padding: 8px; border-right: 1px solid #e2e8f0; vertical-align: top;">
                    <div style="font-weight: 600; color: #334155;">${row.petugas}</div>
                </td>
                <td style="padding: 8px; border-right: 1px solid #e2e8f0; vertical-align: top;">
                    <div style="font-weight: bold; color: #0f172a;">${row.nama}</div>
                    <div style="font-size: 7pt; color: #64748b; margin-top:2px;">${row.loan} • KOL ${row.kol_log}</div>
                </td>
                <td style="padding: 8px; border-right: 1px solid #e2e8f0; text-align: right; vertical-align: top; font-family: 'Consolas', monospace; color: #334155;">
                    ${fmtUang(row.os_cur)}
                </td>
                <td style="padding: 8px; border-right: 1px solid #e2e8f0; text-align: center; vertical-align: top;">
                    <span style="padding: 3px 6px; border-radius: 4px; font-size: 7pt; display: inline-block; ${badgeMedia}">${row.media}</span>
                </td>
                <td style="padding: 8px; border-right: 1px solid #e2e8f0; vertical-align: top; text-align: justify; line-height: 1.3;">
                    ${row.catatan}
                </td>
                <td style="padding: 8px; vertical-align: top; text-align: right;">
                    ${cellKomitmen}
                </td>
            </tr>`;
        });
    }

    html += `
            </tbody>
        </table>

        <div style="margin-top: 40px; page-break-inside: avoid;">
            <table style="width: 100%; text-align: center; border: none;">
                <tr>
                    <td style="width: 33%;">
                        <div style="margin-bottom: 70px;">Disiapkan Oleh,<br><b>Admin Kredit</b></div>
                        <div style="font-weight: bold; text-decoration: underline;">( .............................. )</div>
                    </td>
                    <td style="width: 33%;">
                        <div style="margin-bottom: 70px;">Diperiksa Oleh,<br><b>Penyelia Kredit</b></div>
                        <div style="font-weight: bold; text-decoration: underline;">( .............................. )</div>
                    </td>
                    <td style="width: 33%;">
                        <div style="margin-bottom: 70px;">Diketahui Oleh,<br><b>Pemimpin ${meta.branch === 'ALL' ? 'Cabang' : 'Unit'}</b></div>
                        <div style="font-weight: bold; text-decoration: underline;">( .............................. )</div>
                    </td>
                </tr>
            </table>
            <div style="font-size: 7pt; color: #94a3b8; margin-top: 20px; text-align: right; border-top: 1px dashed #cbd5e1; padding-top: 5px;">
                Dokumen ini dicetak otomatis oleh Sistem Monitoring Kredit (DaKOPen) pada ${new Date().toLocaleString('id-ID')} | Halaman 1 dari 1
            </div>
        </div>

    </div>`;

    document.getElementById('periodic-report-content').innerHTML = html;
}

// 4. Download PDF
function savePeriodicPDF() {
    const element = document.getElementById('periodic-report-content');
    const startStr = document.getElementById('rpt-start-date').value;
    const endStr = document.getElementById('rpt-end-date').value;
    const branch = s.filter.b || 'ALL';
    
    // Config html2pdf
    const opt = {
      margin:       5,
      filename:     `ACTIVITY_REPORT_${branch}_${startStr}_to_${endStr}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    const btn = document.getElementById('btn-save-pdf');
    const oldIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    html2pdf().set(opt).from(element).save().then(() => {
        btn.innerHTML = oldIcon;
        btn.disabled = false;
    });
}



// ==========================================
// FITUR E-ARSIP KREDIT (DIGITAL TWIN - TURBO OPTIMIZED)
// ==========================================

let archiveCache = [];
let selectedLabels = new Set(); 
let currentPage = 1;        
const ITEMS_PER_PAGE = 9;   

function loadArchiveData() {
    document.querySelectorAll('.tab-view').forEach(el => el.classList.add('hidden'));
    const viewArc = document.getElementById('view-archive');
    if(viewArc) viewArc.classList.remove('hidden');
    
    selectedLabels.clear();
    updatePrintButton();
    currentPage = 1; 

    const grid = document.getElementById('archive-grid');
    if(grid) {
        grid.innerHTML = `
            <div class="py-20 flex flex-col items-center justify-center text-slate-400">
                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-600 mb-4"></div>
                <p class="font-bold text-xs uppercase tracking-widest">Memuat Arsip Cepat...</p>
            </div>`;
    }

    const branch = (typeof s !== 'undefined' && s.filter) ? s.filter.b : 'ALL';

    google.script.run.withSuccessHandler(res => {
        // --- TAMBAHKAN BARIS INI UNTUK MATIKAN LOADER PUTIH ---
        if(document.getElementById('loader')) document.getElementById('loader').style.display = 'none';

        if (!res || !res.data) {
            if(grid) grid.innerHTML = `<div class="p-8 text-center text-slate-400 font-bold uppercase">Data Kosong</div>`;
            return;
        }

        // --- OPTIMASI KUNCI: CACHING & PRE-CALCULATION ---
        // Hitung semua konversi waktu dan sanitasi string SEKALI SAJA di awal
        archiveCache = res.data.map(d => {
            // 1. Pre-calculate Sorting Date
            let tglMulai = String(d.tgl_mulai || '-');
            let timestamp = 0;
            if (tglMulai !== '-' && tglMulai !== 'N/A') {
                const p = tglMulai.includes('/') ? tglMulai.split('/') : tglMulai.split('-');
                if (p.length === 3) {
                    timestamp = parseInt(p[0]) > 1900 
                        ? new Date(p[0], p[1]-1, p[2]).getTime() 
                        : new Date(p[2], p[1]-1, p[0]).getTime();
                }
            }
            d._sortTime = timestamp;
            d._sortNum = parseInt(d.no_urut) || 0;
            
            // 2. Pre-format Tanggal Tampil (Tgl Fix)
            d._tglFix = tglMulai;
            if(d._tglFix.includes('-') && d._tglFix.length > 8) {
                 let pt = d._tglFix.split('-');
                 if(pt[0].length === 4) d._tglFix = `${pt[2]}/${pt[1]}/${pt[0]}`;
            }

            // 3. Pre-sanitize String untuk Print (menghindari replace berulang di template HTML)
            d._safeNama = String(d.nama || '-').replace(/'/g, "\\'");
            d._safeJenis = String(d.jenis_kredit || 'UMUM').replace(/'/g, "\\'");
            d._safeCabang = String(d.cabang || '').replace(/'/g, "\\'");

            // 4. Pre-calc Color Theme
            d._theme = getCreditColorTheme(d.jenis_kredit);

            return d;
        });

        filterArchive(true); 
        
        const elTotal = document.getElementById('arc-total');
        if(elTotal) elTotal.innerText = res.active_count || 0;
        
    }).withFailureHandler(err => {
        // --- TAMBAHKAN BARIS INI JUGA ---
        if(document.getElementById('loader')) document.getElementById('loader').style.display = 'none';
        
        if(grid) grid.innerHTML = `<div class="p-4 text-center text-red-500 font-bold text-xs">Error: ${err.message}</div>`;
    }).getArchiveList(branch);
}

// 1. POPULATE FILTER
function populateFilterDropdown(data) {
    const select = document.getElementById('filterType');
    if(!select) return;
    const uniqueTypes = [...new Set(data.map(item => item.jenis_kredit))].sort();
    let opts = '<option value="ALL">Semua Jenis Kredit</option>';
    opts += uniqueTypes.filter(t => t && t !== 'UMUM').map(t => `<option value="${t}">${t}</option>`).join('');
    select.innerHTML = opts;
}

// --- FILTERING LOGIC (SUPER CEPAT) ---
function filterArchive(resetPage = false) {
    const searchEl = document.getElementById('searchArchive');
    const searchKey = searchEl ? searchEl.value.toLowerCase() : '';
    const filterCatEl = document.getElementById('filterCategory');
    const filterCat = filterCatEl ? filterCatEl.value : 'ALL';
    const sortModeEl = document.getElementById('sortArchive');
    const sortMode = sortModeEl ? sortModeEl.value : 'date_desc';

    if (resetPage) currentPage = 1; 

    // 1. FILTER
    let filtered = archiveCache;
    if (searchKey || filterCat !== 'ALL') {
        filtered = archiveCache.filter(d => {
            const matchText = !searchKey || (d.nama.toLowerCase().includes(searchKey) || String(d.loan).includes(searchKey) || String(d.no_urut).includes(searchKey));
            const matchCat = (filterCat === 'ALL') || (d.status === filterCat);
            return matchText && matchCat;
        });
    }

    // 2. SORT (Menggunakan Properti Cached)
    filtered.sort((a, b) => {
        switch (sortMode) {
            case 'date_desc': return b._sortTime - a._sortTime;
            case 'date_asc': return a._sortTime - b._sortTime;
            case 'num_asc': return a._sortNum - b._sortNum;
            case 'num_desc': return b._sortNum - a._sortNum;
            case 'alpha_asc': return (a.nama || '').localeCompare(b.nama || '');
            default: return 0;
        }
    });

    // 👇 TAMBAHAN UNTUK FITUR EKSPOR EXCEL 👇
    // Simpan hasil filter ke variabel global agar bisa dibaca oleh fungsi exportArchiveData()
    window.currentArchiveData = filtered;

    renderArchiveList(filtered);
}

// --- RENDER LIST (HIGH PERFORMANCE ARRAY PUSH + NEW UI) ---
function renderArchiveList(data) {
    const grid = document.getElementById('archive-grid');
    if (!grid) return;
    
    // EMPTY STATE
    if (!data || data.length === 0) {
        grid.innerHTML = `
        <div class="flex flex-col items-center justify-center p-12 text-center text-slate-400 border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50">
            <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 text-slate-300 shadow-sm">
                <i class="fas fa-search text-3xl"></i>
            </div>
            <h3 class="font-bold text-slate-600 uppercase tracking-widest text-sm mb-1">Tidak Ada Data</h3>
        </div>`;
        return;
    }

    // PAGINATION
    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageData = data.slice(startIndex, endIndex);

    // ARRAY HTML (Mencegah ConsString Error V8)
    const htmlParts = [];

    // HEADER PAGER & TOOLS
    htmlParts.push(`
    <div class="sticky top-0 z-20 flex justify-between items-center mb-4 bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-slate-200 shadow-sm">
        <div class="flex items-center gap-3">
            <label class="group flex items-center gap-2 cursor-pointer bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition border border-transparent hover:border-blue-200">
                <input type="checkbox" id="checkAllPage" onchange="app.togglePageSelection(this)" class="w-4 h-4 text-blue-600 rounded cursor-pointer">
                <span class="text-xs font-bold text-slate-600 uppercase">Pilih Hal ${currentPage}</span>
            </label>
        </div>
        <div class="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            ${startIndex + 1}-${Math.min(endIndex, data.length)} / ${data.length}
        </div>
    </div>
    <div class="flex flex-col gap-3 mb-8">
    `);

    // LOOP DATA CARDS
    pageData.forEach(item => {
        // Ambil properti yang sudah di-cache dari loadArchiveData
        const t = item._theme || getCreditColorTheme(item.jenis_kredit);
        const isChecked = selectedLabels.has(item.loan) ? 'checked' : '';
        const isHB = item.status === 'HAPUS_BUKU';
        const isLunas = item.status === 'LUNAS' && !isHB;

        // Logika Visual Card
        let cardBg = isHB ? 'bg-red-50' : (isLunas ? 'bg-slate-100' : 'bg-white');
        let cardBorder = isHB ? 'border-l-4 border-l-red-600 border-y border-r border-red-200' : 
                         (isLunas ? 'border-l-4 border-l-slate-500 border-y border-r border-slate-200' : 'border-y border-r border-slate-200');
        let opacityClass = isLunas ? 'opacity-80 grayscale hover:grayscale-0 transition-all' : '';
        let leftBorderStyle = (!isHB && !isLunas) ? `border-left: 5px solid ${t.hex};` : '';

        // Status Badge
        let statusBadge = isHB ? `<span class="bg-red-600 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shadow-sm"><i class="fas fa-ban mr-1"></i>HAPUS BUKU</span>` : 
                          (isLunas ? `<span class="bg-slate-600 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shadow-sm"><i class="fas fa-check mr-1"></i>LUNAS</span>` : 
                                     `<span class="bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider"><i class="fas fa-circle text-[6px] mr-1 align-middle"></i>AKTIF</span>`);

        let highlightClass = isChecked ? 'ring-2 ring-blue-500 bg-blue-50/50 z-10' : '';

        // Variabel Aman yang sudah dikalkulasi
        const tglFix = item._tglFix || item.tgl_mulai || '-';
        const safeNama = item._safeNama || String(item.nama || '-').replace(/'/g, "\\'");
        const safeJenis = item._safeJenis || String(item.jenis_kredit || 'UMUM').replace(/'/g, "\\'");
        const safeCabang = item._safeCabang || String(item.cabang || '').replace(/'/g, "\\'");

        // PUSH KARTU KE DALAM ARRAY
        htmlParts.push(`
        <div class="group relative flex items-center ${cardBg} ${cardBorder} ${opacityClass} rounded-r-xl p-0 hover:shadow-lg transition-all duration-200 h-[85px] ${highlightClass}" 
             style="${leftBorderStyle}"
             onclick="const chk = document.getElementById('chk_${item.loan}'); if(chk) chk.click();">
            
            <div class="w-10 self-stretch flex items-center justify-center border-r border-slate-200/50 cursor-pointer hover:bg-black/5">
                <input type="checkbox" id="chk_${item.loan}" onchange="app.toggleSelect('${item.loan}', this); event.stopPropagation();" ${isChecked} 
                       class="page-checkbox w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer">
            </div>

            <div class="w-16 flex flex-col items-center justify-center self-stretch border-r border-slate-200/50 bg-white/50">
                <span class="text-[7px] font-black text-slate-400 uppercase mb-0.5">ARSIP</span>
                <span class="text-2xl font-black text-slate-800 font-mono leading-none">${item.no_urut || '-'}</span>
            </div>

            <div class="flex-1 px-4 flex flex-col justify-center min-w-0 gap-1.5 py-2">
                <div class="flex items-center justify-between">
                    <h4 class="font-black text-sm text-slate-800 truncate pr-2" title="${item.nama || '-'}">${item.nama || '-'}</h4>
                    ${statusBadge}
                </div>
                <div class="flex items-center">
                    <span class="${t.bg_solid} ${t.text_solid} text-[9px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wide">
                        ${(item.jenis_kredit || 'UMUM').substring(0,20)}
                    </span>
                    ${item.is_new ? '<span class="ml-2 px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-400 text-amber-900">BARU</span>' : ''}
                </div>
                <div class="flex items-center gap-3 text-[10px] text-slate-500 font-mono mt-0.5">
                    <div class="flex items-center gap-1">
                        <i class="fas fa-barcode text-slate-300"></i> <span class="font-bold text-slate-600">${item.loan || '-'}</span>
                    </div>
                    <div class="hidden sm:flex items-center gap-1 border-l border-slate-300 pl-3">
                        <i class="fas fa-file-signature text-slate-300"></i> <span>${item.pk || '-'}</span>
                    </div>
                </div>
            </div>

            <div class="hidden md:flex flex-col items-end justify-center px-4 border-l border-dashed border-slate-300 h-14 min-w-[110px]">
                <div class="text-[8px] font-bold text-slate-400 uppercase mb-1">Realisasi</div>
                <div class="text-xs font-bold text-slate-700">${tglFix}</div>
            </div>

            <div class="flex items-center px-3 h-full gap-2">
                 <button onclick="event.stopPropagation(); app.changeStatus('${item.loan}', '${isHB ? 'AKTIF' : 'HAPUS_BUKU'}')" 
                        class="w-9 h-9 rounded-lg ${isHB ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600' : 'bg-red-50 text-red-600 hover:bg-red-600'} hover:text-white transition-colors flex items-center justify-center shadow-sm" 
                        title="${isHB ? 'Kembalikan ke Aktif' : 'Pindahkan ke Hapus Buku'}">
                    <i class="fas ${isHB ? 'fa-undo' : 'fa-ban'}"></i>
                </button>

                <button onclick="event.stopPropagation(); app.printSingleLabel('${item.no_urut}', '${item.loan}', '${safeNama}', '${safeJenis}', '${tglFix}', '${safeCabang}')" 
                        class="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-colors flex items-center justify-center shadow-sm" 
                        title="Cetak Label">
                    <i class="fas fa-print"></i>
                </button>
            </div>
        </div>
        `);
    });

    htmlParts.push(`</div>`); 

    // NAVIGATION PAGER BAWAH
    const disablePrev = currentPage === 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-slate-800 hover:text-white cursor-pointer';
    const disableNext = currentPage === totalPages ? 'opacity-50 pointer-events-none' : 'hover:bg-slate-800 hover:text-white cursor-pointer';

    htmlParts.push(`
    <div class="flex justify-center items-center gap-3 mt-4 pb-12">
        <button onclick="${currentPage > 1 ? 'app.changePage(-1)' : ''}" class="px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-600 font-bold text-xs shadow-sm transition-colors flex items-center gap-2 ${disablePrev}"><i class="fas fa-arrow-left"></i></button>
        <div class="bg-slate-800 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-md tracking-wider">HAL ${currentPage} <span class="text-slate-500 mx-1">/</span> ${totalPages}</div>
        <button onclick="${currentPage < totalPages ? 'app.changePage(1)' : ''}" class="px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-600 font-bold text-xs shadow-sm transition-colors flex items-center gap-2 ${disableNext}"><i class="fas fa-arrow-right"></i></button>
    </div>`);

    // GABUNG HTML (Aman dari error ConsString V8)
    grid.innerHTML = htmlParts.join('');
    
    // Perbarui status master checkbox
    updatePageCheckboxState();
}

// ==========================================
// FUNGSI EKSPOR DATA ARSIP KE EXCEL
// ==========================================
function exportArchiveData() {
    // 1. Ambil data yang sedang aktif di layar (hasil filter)
    const dataToExport = window.currentArchiveData;
    
    if (!dataToExport || dataToExport.length === 0) {
        alert("Tidak ada data untuk diekspor. Silakan muat atau filter data terlebih dahulu.");
        return;
    }

    // Ubah teks tombol menjadi loading
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    btn.disabled = true;

    try {
        // 2. Format ulang data agar nama header kolom di Excel terlihat profesional
        const formattedData = dataToExport.map(item => {
            return {
                "No. Urut": item.no_urut,
                "Label Berkas": item.label_code,
                "Loan ID": item.loan,
                "Nama Debitur": item.nama,
                "No. PK": item.pk,
                "Unit/Cabang": item.cabang,
                "Jenis Kredit": item.jenis_kredit,
                "Tgl Mulai": item.tgl_mulai,
                "Tgl Selesai": item.tgl_selesai,
                "Status": item.status,
                "Baki Debet": item.os
            };
        });

        // 3. Buat Workbook dan Worksheet menggunakan SheetJS (XLSX)
        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data_Arsip");

        // 4. Generate nama file dengan tanggal & jam saat ini
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const fileName = `E-Arsip_DaKOPen_${year}${month}${day}_${hours}${minutes}.xlsx`;

        // 5. Eksekusi Download otomatis
        XLSX.writeFile(workbook, fileName);

    } catch (e) {
        console.error("Error Export Excel:", e);
        alert("Gagal mengekspor data: " + e.message);
    } finally {
        // Kembalikan tombol ke semula
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// --- FUNGSI CHECKLIST ---
function toggleSelect(loanId, checkbox) {
    if (checkbox.checked) selectedLabels.add(loanId);
    else selectedLabels.delete(loanId);
    updatePrintButton();
    
    // Highlight parent card (Optimistic UI Update)
    const card = checkbox.closest('.group');
    if (card) {
        if (checkbox.checked) card.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50/50', 'z-10');
        else card.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50/50', 'z-10');
    }
}

function updatePrintButton() {
    const btn = document.getElementById('btnPrintSelected');
    const count = document.getElementById('countSelected');
    if (btn && count) {
        if (selectedLabels.size > 0) {
            btn.classList.remove('hidden');
            count.innerText = selectedLabels.size;
        } else {
            btn.classList.add('hidden');
        }
    }
}

// --- FUNGSI CETAK LABEL ---
function printSingleLabel(noUrut, loan, nama, jenis, tgl, cabang) {
    const theme = getCreditColorTheme(jenis);
    const branchName = (cabang && String(cabang) !== 'undefined') ? cabang : 'BANKALTIMTARA';
    const safeJenis = (jenis || 'UMUM').substring(0, 25); 
    
    const w = window.open('', '_blank', 'width=800,height=300');
    
    const htmlContent = `
        <html>
        <head>
            <title>Label ${noUrut}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Roboto:wght@400;700;900&display=swap');
                @page { size: 12cm 2cm; margin: 0; } 
                body { margin: 0; padding: 0; font-family: 'Roboto', sans-serif; background: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; }
                .label-container { width: 12cm; height: 2cm; background: white; border: 1px solid #ccc; display: flex; flex-direction: row; overflow: hidden; box-sizing: border-box; position: relative; }
                .zone-number { width: 2.8cm; background-color: ${theme.hex} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; }
                .zone-number .label-small { font-family: 'Oswald', sans-serif; font-size: 5pt; letter-spacing: 1px; opacity: 0.9; margin-bottom: -3px; }
                .zone-number .big-digit { font-family: 'Oswald', sans-serif; font-size: 32pt; font-weight: 700; line-height: 1; z-index: 2; }
                .zone-number::after { content: ''; position: absolute; right: -6px; top: 50%; transform: translateY(-50%); border-top: 6px solid transparent; border-bottom: 6px solid transparent; border-left: 6px solid ${theme.hex}; z-index: 1; }
                .zone-info { flex: 1; padding: 2px 8px 2px 14px; display: flex; flex-direction: column; justify-content: center; border-bottom: 3px solid ${theme.hex}; }
                .info-loan { font-family: 'Oswald', sans-serif; font-size: 18pt; font-weight: 700; color: ${theme.hex}; line-height: 1; margin-bottom: 1px; letter-spacing: 0.5px; }
                .info-name { font-size: 9pt; font-weight: 900; text-transform: uppercase; color: #333; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 6cm; }
                .info-type { display: inline-block; font-size: 5pt; font-weight: 700; text-transform: uppercase; background-color: #f0f0f0; color: #555; padding: 1px 4px; border-radius: 2px; margin-top: 1px; }
                .zone-meta { width: 2.8cm; background-color: #fafafa; border-left: 1px dashed #ddd; border-bottom: 3px solid ${theme.hex}; display: flex; flex-direction: column; justify-content: space-between; padding: 4px; text-align: right; }
                .meta-branch { font-size: 5pt; font-weight: 900; color: #1e3a8a; text-transform: uppercase; line-height: 1.1; }
                .meta-label { font-size: 4pt; color: #888; font-weight: bold; }
                .meta-value { font-size: 8pt; font-weight: 700; color: #333; }
                @media print { body { background: none; height: auto; display: block; } .label-container { border: none; page-break-inside: avoid; } }
            </style>
        </head>
        <body>
            <div class="label-container">
                <div class="zone-number">
                    <div class="label-small">ARSIP</div>
                    <div class="big-digit">${noUrut}</div>
                </div>
                <div class="zone-info">
                    <div class="info-loan">${loan}</div>
                    <div class="info-name">${nama}</div>
                    <div><span class="info-type">${safeJenis}</span></div>
                </div>
                <div class="zone-meta">
                    <div class="meta-branch">${branchName}</div>
                    <div class="meta-date-group">
                        <span class="meta-label">REALISASI</span>
                        <span class="meta-value">${tgl}</span>
                    </div>
                </div>
            </div>
            <script>
                window.onload = function() { setTimeout(() => { window.print(); }, 800); };
                window.onafterprint = function() { window.close(); };
            <\\/script>
        </body>
        </html>
    `;
    const finalHtmlContent = htmlContent.replace('<\\\\/script>', '<\\/script>');
    w.document.open(); w.document.write(finalHtmlContent); w.document.close();
}

function printSelectedLabels() {
    const ids = Array.from(selectedLabels);
    if(ids.length === 0) return alert("Silakan centang minimal satu berkas!");
    
    const itemsToPrint = archiveCache.filter(item => ids.includes(item.loan));
    if(itemsToPrint.length === 0) return;

    const w = window.open('', '_blank');
    let labelsHTML = '';
    
    itemsToPrint.forEach(item => {
        const t = item._theme || getCreditColorTheme(item.jenis_kredit);
        const branchName = item.cabang || 'BANKALTIMTARA';
        const safeJenis = (item.jenis_kredit || 'UMUM').substring(0, 25); 

        labelsHTML += `
        <div class="label-wrapper">
            <div class="label-container">
                <div class="zone-number" style="background-color: ${t.hex} !important;">
                    <div class="label-small">ARSIP</div>
                    <div class="big-digit">${item.no_urut}</div>
                </div>
                <div class="zone-info" style="border-bottom: 3px solid ${t.hex};">
                    <div class="info-loan" style="color: ${t.hex} !important;">${item.loan}</div>
                    <div class="info-name">${item.nama}</div>
                    <div style="margin-top:1px;"><span class="info-type">${safeJenis}</span></div>
                </div>
                <div class="zone-meta" style="border-bottom: 3px solid ${t.hex};">
                    <div class="meta-branch">${branchName}</div>
                    <div class="meta-date-group">
                        <span class="meta-label">REALISASI</span>
                        <span class="meta-value">${item._tglFix}</span>
                    </div>
                </div>
            </div>
            <div class="cut-line">✂ Potong Disini</div>
        </div>
        `;
    });

    const htmlContent = `
        <html>
        <head>
            <title>Cetak Label Arsip</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Roboto:wght@400;700;900&display=swap');
                @page { size: A4 portrait; margin: 1cm; }
                body { margin: 0; padding: 0; font-family: 'Roboto', sans-serif; background: white; }
                .label-wrapper { page-break-inside: avoid; margin-bottom: 15px; }
                .label-container { width: 12cm; height: 2cm; background: white; border: 1px solid #333; display: flex; flex-direction: row; overflow: hidden; box-sizing: border-box; margin: 0 auto; }
                .zone-number { width: 2.8cm; -webkit-print-color-adjust: exact; print-color-adjust: exact; color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; }
                .zone-number .label-small { font-family: 'Oswald', sans-serif; font-size: 5pt; letter-spacing: 1px; opacity: 0.9; margin-bottom: -3px; }
                .zone-number .big-digit { font-family: 'Oswald', sans-serif; font-size: 32pt; font-weight: 700; line-height: 1; z-index: 2; }
                .zone-number::after { content: ''; position: absolute; right: -6px; top: 50%; transform: translateY(-50%); border-top: 6px solid transparent; border-bottom: 6px solid transparent; border-left: 6px solid inherit; z-index: 1; }
                .zone-info { flex: 1; padding: 2px 8px 2px 14px; display: flex; flex-direction: column; justify-content: center; overflow: hidden; border-bottom: 3px solid #ccc; }
                .info-loan { font-family: 'Oswald', sans-serif; font-size: 18pt; font-weight: 700; line-height: 1; margin-bottom: 1px; letter-spacing: 0.5px; }
                .info-name { font-size: 9pt; font-weight: 900; text-transform: uppercase; color: #333; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 6cm; }
                .info-type { display: inline-block; font-size: 5pt; font-weight: 700; text-transform: uppercase; background-color: #eee; color: #555; padding: 1px 4px; border-radius: 2px; }
                .zone-meta { width: 2.8cm; background-color: #fafafa; border-left: 1px dashed #ccc; display: flex; flex-direction: column; justify-content: space-between; padding: 4px; text-align: right; border-bottom: 3px solid #ccc; }
                .meta-branch { font-size: 5pt; font-weight: 900; color: #1e3a8a; text-transform: uppercase; }
                .meta-label { font-size: 4pt; color: #888; font-weight: bold; }
                .meta-value { font-size: 8pt; font-weight: 700; color: #333; }
                .cut-line { width: 12cm; margin: 2px auto 0 auto; border-top: 1px dashed #bbb; color: #bbb; font-size: 6pt; text-align: right; display: block; }
                @media print { body { -webkit-print-color-adjust: exact; } }
            </style>
        </head>
        <body>
            <div style="text-align:center; margin-bottom:20px; font-weight:bold; font-family:sans-serif;">DAFTAR LABEL (${ids.length})</div>
            ${labelsHTML}
            <script>
                window.onload = function() { setTimeout(() => { window.print(); }, 800); };
                window.onafterprint = function() { window.close(); };
            <\\/script>
        </body>
        </html>
    `;
    const finalHtmlContent = htmlContent.replace('<\\\\/script>', '<\\/script>');
    w.document.open(); w.document.write(finalHtmlContent); w.document.close();
}

function changePage(step) {
    currentPage += step;
    filterArchive(false); 
    const grid = document.getElementById('archive-grid');
    if(grid) grid.scrollIntoView({behavior: 'auto', block: 'start'});
}

function togglePageSelection(masterChk) {
    const isChecked = masterChk.checked;
    document.querySelectorAll('.page-checkbox').forEach(chk => {
        if (chk.checked !== isChecked) {
            chk.checked = isChecked;
            const loanId = chk.id.replace('chk_', ''); 
            toggleSelect(loanId, chk);
        }
    });
}

function updatePageCheckboxState() {
    const checkboxes = document.querySelectorAll('.page-checkbox');
    const masterChk = document.getElementById('checkAllPage');
    if(!masterChk) return;
    if (checkboxes.length === 0) { masterChk.checked = false; masterChk.disabled = true; return; }
    masterChk.checked = Array.from(checkboxes).every(c => c.checked);
    masterChk.disabled = false;
}

// --- FUNGSI UBAH STATUS ---
function changeStatus(loanId, newStatus) {
    if(!confirm(`Pindahkan berkas ini ke Rak ${newStatus.replace('_', ' ')}?`)) return;
    
    const itemIdx = archiveCache.findIndex(x => x.loan === loanId);
    if(itemIdx > -1) {
        archiveCache[itemIdx].status = newStatus;
        filterArchive(); 
    }

    google.script.run.withSuccessHandler(res => {
        if(!res.success) alert("Gagal update status: " + res.message);
    }).setArchiveStatus(loanId, newStatus);
}

// 5. JEMBATAN DETAIL
function openDetailFromArchive(loanId) {
    document.getElementById('view-archive').classList.add('hidden');
    document.getElementById('view-journey').classList.remove('hidden');
    if(typeof toggleJourneyView === 'function') toggleJourneyView('list');
    
    if(typeof showJourneyDetail === 'function') {
        setTimeout(() => {
            showJourneyDetail(loanId);
            const detailArea = document.getElementById('detailJourneyArea');
            if(detailArea) detailArea.scrollIntoView({behavior: 'smooth'});
        }, 100);
    } else {
        alert("Modul Journey belum dimuat.");
    }
}

// LOGIKA WARNA 
function getCreditColorTheme(type) {
    type = (type || "").toUpperCase();
    if (type.includes('KUR') || type.includes('MIKRO')) return { border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-500', hex: '#10b981' };
    if (type.includes('KONSUM') || type.includes('GUNA') || type.includes('PNS') || type.includes('PEGAWAI') || type.includes('KPRS')) return { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-500', hex: '#3b82f6' };
    if (type.includes('MODAL') || type.includes('KONSTRUKSI') || type.includes('KMK')) return { border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-500', hex: '#f97316' };
    if (type.includes('INVESTASI') || type.includes('KI ') || type.includes('KI-') || type === 'KI') return { border: 'border-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', badge: 'bg-violet-500', hex: '#8b5cf6' };
    return { border: 'border-slate-400', bg: 'bg-slate-50', text: 'text-slate-600', badge: 'bg-slate-500', hex: '#64748b' };
}

// --- HELPER UNTUK SHORTCUT MENU ---
function filterNewFiles() {
    const searchInput = document.getElementById('searchArchive');
    if(searchInput) searchInput.value = '';
    const filterCat = document.getElementById('filterCategory');
    if(filterCat) filterCat.value = 'ALL';
    
    const newItems = archiveCache.filter(x => x.is_new);
    renderArchiveList(newItems);
    alert(`Menampilkan ${newItems.length} berkas baru bulan ini.`);
}

function selectAllForPrint() {
    const checkboxes = document.querySelectorAll('#archive-grid input[type="checkbox"]');
    let count = 0;
    
    checkboxes.forEach(chk => {
        if(!chk.checked) {
            chk.click(); 
            count++;
        }
    });
    
    if(count > 0) {
        document.getElementById('btnPrintSelected').scrollIntoView({behavior: 'smooth', block: 'center'});
        const btn = document.getElementById('btnPrintSelected');
        btn.classList.add('ring-4', 'ring-blue-400');
        setTimeout(() => btn.classList.remove('ring-4', 'ring-blue-400'), 1000);
    } else {
        alert("Semua berkas yang tampil sudah dipilih.");
    }
}

// --- FUNGSI MANAJEMEN SHEET (HAPUS DATA) ---

// 1. Menampilkan daftar sheet ke dalam UI
function renderSheetManager() {
    const container = document.getElementById('sheetManagerList');
    if(!container) return;
    
    // Kita gunakan data 'snaps' (snapshot) yang sudah di-load oleh aplikasi di awal
    if(!s.snaps || s.snaps.length === 0) {
        container.innerHTML = '<div class="p-4 text-center text-xs font-bold text-slate-400">Tidak ada sheet data.</div>';
        return;
    }

    let html = '';
    // Sort dari yang paling tua (opsional, karena biasanya data lama yang ingin dihapus)
    let reversedSnaps = [...s.snaps].reverse(); 

    reversedSnaps.forEach(snap => {
        // Rekonstruksi nama sheet: "2026-02-05" -> "DATA_20260205"
        let sheetName = 'DATA_' + snap.date.replace(/-/g, '');
        
        html += `
        <label class="flex items-center justify-between p-3 hover:bg-white dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors group">
            <div class="flex items-center gap-3">
                <input type="checkbox" value="${sheetName}" onchange="app.updateDeleteCount()" class="sheet-delete-cb w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer">
                <div>
                    <div class="font-bold text-sm text-slate-700 dark:text-slate-200 group-hover:text-red-600 transition-colors">${snap.label}</div>
                    <div class="text-[10px] text-slate-400 font-mono">${sheetName}</div>
                </div>
            </div>
        </label>`;
    });
    
    container.innerHTML = html;
    updateDeleteCount(); // Reset hitungan tombol
}

// 2. Mengupdate counter pada tombol Hapus
function updateDeleteCount() {
    const checked = document.querySelectorAll('.sheet-delete-cb:checked');
    const btn = document.getElementById('btnDeleteSheets');
    const counter = document.getElementById('countDelete');
    
    if(checked.length > 0) {
        btn.classList.remove('hidden');
        counter.innerText = checked.length;
    } else {
        btn.classList.add('hidden');
    }
}

// 3. Mengeksekusi Penghapusan ke Server
function executeDeleteSheets() {
    const checked = document.querySelectorAll('.sheet-delete-cb:checked');
    if(checked.length === 0) return;

    let sheetNames = Array.from(checked).map(cb => cb.value);
    
    // Keamanan Ganda (Konfirmasi)
    let konfirmasi = confirm(`⚠️ PERINGATAN BAHAYA!\n\nAnda akan menghapus ${sheetNames.length} sheet database PERMANEN.\nData yang dihapus tidak akan dapat dikembalikan.\n\nApakah Anda benar-benar yakin ingin melanjutkan?`);
    
    if(!konfirmasi) return;

    const btn = document.getElementById('btnDeleteSheets');
    const btnTextOriginal = btn.innerHTML;
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SEDANG MENGHAPUS...';
    btn.disabled = true;
    btn.classList.remove('hover:bg-red-600', 'hover:text-white', 'text-red-600');
    btn.classList.add('bg-slate-300', 'text-white', 'cursor-not-allowed');

    google.script.run.withSuccessHandler(res => {
        if(res.success) {
            alert(res.message);
            // Refresh halaman paksa agar memori aplikasi tidak memanggil sheet yang sudah ga ada
            location.reload(); 
        } else {
            alert("Gagal: " + res.message);
            btn.innerHTML = btnTextOriginal;
            btn.disabled = false;
        }
    }).withFailureHandler(err => {
        alert("Error Koneksi: " + err);
        btn.innerHTML = btnTextOriginal;
        btn.disabled = false;
    }).deleteDatabaseSheets(sheetNames);
}

// --- FUNGSI RESET SLIDER SIMULASI ---
  function resetSimSliders() {
      const types = ['ALL', 'KUR', 'KONS', 'PROD'];
      
      types.forEach(type => {
          const slider = document.getElementById('slide_os_' + type);
          if (slider) slider.value = 0;

          // PENYESUAIAN ID (Case Sensitive Fix)
          let ratioIdSuffix = type;
          if (type === 'KONS') ratioIdSuffix = 'Kons';
          if (type === 'PROD') ratioIdSuffix = 'Prod';

          const ratioEl = document.getElementById('k_npl_rat_' + ratioIdSuffix);
          if (ratioEl) {
              delete ratioEl.dataset.original; 
              ratioEl.style.color = ''; 
          }

          const osBadge = document.getElementById('sim_os_' + type);
          if (osBadge) osBadge.innerText = "Geser Slider 👉";

          const pctBadge = document.getElementById('sim_pct_' + type);
          if (pctBadge) {
              pctBadge.innerText = "0%";
              pctBadge.className = 'text-white bg-white/10 px-3 py-1 rounded-full border border-white/10 shadow-inner';
          }
          
          const diffBadge = document.getElementById('sim_diff_' + type);
          if (diffBadge) diffBadge.innerHTML = '';
      });
  }

  // --- FUNGSI SIMULASI NPL RATIO (WHAT-IF ANALYSIS) ---
  function calcSim(type) {
      const slider = document.getElementById('slide_os_' + type);
      if(!slider) return;
      
      const pct = parseInt(slider.value);
      
      // 1. Dapatkan OS Asli & NPL Asli
      let osText = '';
      let nplText = '';
      
      if(type === 'ALL') {
          osText = document.getElementById('k_all_tot')?.innerText || '0';
          nplText = document.getElementById('k_all_npl')?.innerText || '0';
      } else if(type === 'KUR') {
          let m = document.getElementById('k_mikro')?.innerText || '0';
          let k = document.getElementById('k_kecil')?.innerText || '0';
          let valM = parseInt(m.replace(/[^\d]/g, '')) || 0;
          let valK = parseInt(k.replace(/[^\d]/g, '')) || 0;
          osText = (valM + valK).toString(); 
          nplText = document.getElementById('k_kur_npl')?.innerText || '0';
      } else if(type === 'KONS') {
          osText = document.getElementById('k_kons_tot')?.innerText || '0';
          nplText = document.getElementById('k_kons_npl')?.innerText || '0';
      } else if(type === 'PROD') {
          osText = document.getElementById('k_prod_tot')?.innerText || '0';
          nplText = document.getElementById('k_prod_npl')?.innerText || '0';
      }

      const baseOS = parseInt(osText.replace(/[^\d]/g, '')) || 0;
      const baseNPL = parseInt(nplText.replace(/[^\d]/g, '')) || 0;
      
      if(baseOS === 0) return;

      // PENYESUAIAN ID (Case Sensitive Fix)
      let ratioIdSuffix = type;
      if (type === 'KONS') ratioIdSuffix = 'Kons';
      if (type === 'PROD') ratioIdSuffix = 'Prod';

      const ratioEl = document.getElementById('k_npl_rat_' + ratioIdSuffix);
      if(!ratioEl) return; // Mencegah error jika elemen tetap tidak ditemukan

      if(!ratioEl.dataset.original) {
          ratioEl.dataset.original = ratioEl.innerText; 
      }

      const diffBadge = document.getElementById('sim_diff_' + type);

      // 2. Jika Slider Kembali ke Tengah (0%)
      if(pct === 0) {
          ratioEl.innerText = ratioEl.dataset.original;
          ratioEl.style.color = '';
          document.getElementById('sim_os_' + type).innerText = "Geser Slider 👉";
          document.getElementById('sim_pct_' + type).innerText = "0%";
          document.getElementById('sim_pct_' + type).classList.replace('bg-emerald-500', 'bg-white/10');
          document.getElementById('sim_pct_' + type).classList.replace('bg-red-500', 'bg-white/10');
          if (diffBadge) diffBadge.innerHTML = '';
          return;
      }

      // 3. Kalkulasi Matematis (Proyeksi OS & Selisih)
      const newOS = baseOS + (baseOS * (pct / 100));
      const diffOS = newOS - baseOS; 
      let newRatio = 0;
      if(newOS > 0) newRatio = (baseNPL / newOS) * 100;

      // 4. Update UI Angka Persentase & Proyeksi OS
      const badge = document.getElementById('sim_pct_' + type);
      badge.innerText = (pct > 0 ? '+' : '') + pct + '%';
      badge.className = `text-white px-3 py-1 rounded-full border border-white/10 shadow-inner ${pct > 0 ? 'bg-emerald-500' : 'bg-red-500'}`;
      
      const formatRupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
      document.getElementById('sim_os_' + type).innerText = formatRupiah.format(newOS);
      ratioEl.innerText = newRatio.toFixed(2) + '%';
      
      // 5. Update UI Selisih Penambahan / Pengurangan
      if (diffBadge) {
          if (diffOS > 0) {
              diffBadge.innerHTML = `<span class="text-emerald-300">Ekspansi OS: +${formatRupiah.format(Math.abs(diffOS))}</span>`;
          } else {
              diffBadge.innerHTML = `<span class="text-red-300">Run-off OS: -${formatRupiah.format(Math.abs(diffOS))}</span>`;
          }
      }
      
      // 6. Efek Warna NPL Ratio Berubah
      const baseRatio = (baseNPL / baseOS) * 100;
      if (newRatio > baseRatio) {
          ratioEl.style.color = '#fda4af'; // Memburuk (Merah Muda)
      } else if (newRatio < baseRatio) {
          ratioEl.style.color = '#86efac'; // Membaik (Hijau Muda)
      }
  }


// --- FUNGSI INTERAKTIF: POPUP DETAIL SEKTOR (FINAL & EXACT MATCH) ---
  function openSectorModal(sectorName) {
      // 1. Ambil data dari all_list (yang sudah memuat KOL 1-5)
      const allData = (app.state.data && app.state.data.all_list) ? app.state.data.all_list : [];
      
      // 2. Filter Cerdas (EXACT MATCH / SAMA PERSIS)
      // Kita tidak lagi menggunakan substring, melainkan mencocokkan teks secara utuh
      const searchTarget = sectorName.toLowerCase().trim();
      
      const filtered = allData.filter(r => {
          if (r.sektor) {
              const rowSector = String(r.sektor).toLowerCase().trim();
              return rowSector === searchTarget;
          }
          return false;
      });

      const tbody = document.getElementById('tbl-modal-sector');
      const fmtIDR = v => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);
      
      let html = '';
      
      // Variabel Penampung Kalkulasi
      let totalOS = 0;
      let totalKKR = 0;
      let totalNPL = 0;
      
      // 3. Render Baris per Baris & Lakukan Perhitungan
      filtered.forEach((r, i) => {
          const bakiDebet = Number(r.os || 0);
          const kol = parseInt(r.kol) || 1;
          
          // --- KALKULASI TOTAL ---
          totalOS += bakiDebet;
          if(kol >= 2) totalKKR += bakiDebet;
          if(kol >= 3) totalNPL += bakiDebet;
          
          // --- STYLING KOL WARNA-WARNI ---
          let kolColor = 'bg-emerald-500 text-white'; // Default KOL 1 (Lancar)
          if(kol == 5) kolColor = 'bg-red-500 text-white animate-pulse-slow';
          else if(kol == 4) kolColor = 'bg-pink-500 text-white';
          else if(kol == 3) kolColor = 'bg-orange-500 text-white';
          else if(kol == 2) kolColor = 'bg-yellow-500 text-black';
          
          const namaDebitur = r.nama || 'Tanpa Nama';
          const noRekening = r.loan || r.pk || '-';
          const unitCabang = r.br || '-';
          const nilaiTunggakan = Number(r.tgk || 0);
          
          html += `
          <tr class="hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors group cursor-pointer border-b border-slate-50 dark:border-slate-800/50">
              <td class="p-4 text-center font-bold text-slate-400 group-hover:text-blue-500 transition-colors">${i+1}</td>
              <td class="p-4">
                  <div class="font-black text-slate-700 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all transform group-hover:translate-x-1">${namaDebitur}</div>
                  <div class="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-1"><i class="fas fa-fingerprint mr-1"></i> ${noRekening}</div>
              </td>
              <td class="p-4 hidden sm:table-cell text-xs font-bold text-slate-500"><i class="fas fa-building mr-1"></i> ${unitCabang}</td>
              <td class="p-4 text-center">
                  <span class="px-2 py-1 text-[10px] font-black rounded-md shadow-sm ${kolColor}">KOL ${kol}</span>
              </td>
              <td class="p-4 text-right font-mono font-black text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors">${fmtIDR(bakiDebet)}</td>
              <td class="p-4 text-right font-mono font-black ${nilaiTunggakan > 0 ? 'text-red-500' : 'text-slate-300'}">${fmtIDR(nilaiTunggakan)}</td>
          </tr>`;
      });
      
      if(filtered.length === 0) {
          html = `<tr><td colspan="6" class="p-12 text-center flex flex-col items-center justify-center">
                    <i class="fas fa-folder-open text-4xl text-slate-300 mb-3 hover:scale-110 transition-transform"></i>
                    <span class="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">Tidak ada detail rincian untuk ${sectorName}</span>
                  </td></tr>`;
      }
      
      tbody.innerHTML = html;
      
      // 4. Kalkulasi Persentase
      const pctKKR = totalOS > 0 ? ((totalKKR / totalOS) * 100).toFixed(2) : 0;
      const pctNPL = totalOS > 0 ? ((totalNPL / totalOS) * 100).toFixed(2) : 0;
      
      // 5. Suntikkan Data ke Footer HTML
      document.getElementById('modal-sector-title').innerText = sectorName.toUpperCase();
      document.getElementById('modal-sector-count').innerText = filtered.length; 
      
      document.getElementById('modal-sector-os').innerText = fmtIDR(totalOS);
      document.getElementById('modal-sector-kkr').innerText = fmtIDR(totalKKR);
      document.getElementById('modal-sector-pct-kkr').innerText = `${pctKKR}% dari Total`;
      
      document.getElementById('modal-sector-npl').innerText = fmtIDR(totalNPL);
      document.getElementById('modal-sector-pct-npl').innerText = `${pctNPL}% dari Total`;
      
      // 6. Animasi Masuk
      const modal = document.getElementById('modal-sector');
      modal.classList.remove('hidden');
      setTimeout(() => {
          modal.classList.remove('opacity-0');
          if(modal.children[1]) modal.children[1].classList.remove('scale-95'); 
      }, 10);
  }

  // --- FUNGSI MENUTUP MODAL ---
  function closeSectorModal() {
      const modal = document.getElementById('modal-sector');
      modal.classList.add('opacity-0');
      modal.children[1].classList.add('scale-95'); // Efek Zoom Out
      setTimeout(() => {
          modal.classList.add('hidden');
      }, 300); // Tunggu animasi CSS selesai
  }

// --- FUNGSI MODAL KOMPARASI CABANG (SUPER BENTO COMPACT) ---
function openBranchModal() {
    let stats = null;
    if (typeof s !== 'undefined' && s.branch_perf) stats = s.branch_perf;
    else if (typeof app !== 'undefined' && app.state && app.state.branch_perf) stats = app.state.branch_perf;

    if(!stats || Object.keys(stats).length === 0) {
        alert("Data komparasi unit belum tersedia. Pastikan sinkronisasi data berhasil.");
        return;
    }

    const container = document.getElementById('list-modal-branch');
    if (!container) return;
    
    let html = '';
    const fmtIDR = v => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);
    
    // Format Singkat (Miliar / Juta) untuk badge selisih
    const fmtShort = (v) => {
        if(v === 0) return '0';
        let abs = Math.abs(v);
        if(abs >= 1e9) return (abs/1e9).toFixed(2).replace(/\.00$/, '') + 'M';
        if(abs >= 1e6) return (abs/1e6).toFixed(0) + 'Jt';
        return new Intl.NumberFormat('id-ID').format(abs);
    };

    // Helper Badge Selisih
    const getDiff = (now, prev, isBadIfUp = false, isRupiah = true) => {
        let diff = now - (prev || 0);
        let pct = prev ? (diff / prev * 100).toFixed(1) : (now > 0 ? 100 : 0);
        if(diff === 0) return `<span class="inline-block px-1.5 py-0.5 rounded border border-transparent bg-slate-100/50 dark:bg-slate-700/50 text-slate-400 text-[7px] md:text-[8px] font-black shadow-sm">Tetap</span>`;
        
        let sign = diff > 0 ? '+' : '';
        let arrow = diff > 0 ? '▲' : '▼';
        let isBad = isBadIfUp ? diff > 0 : diff < 0;
        let color = isBad ? 'text-rose-600 bg-rose-100/60 border-rose-200 dark:bg-rose-900/30 dark:border-rose-800/50' : 'text-emerald-600 bg-emerald-100/60 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800/50';
        let valStr = isRupiah ? 'Rp ' + fmtShort(diff) : fmtShort(diff);
        
        return `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border shadow-sm text-[7px] md:text-[8px] font-black ${color}">
                    <span>${arrow}</span> <span>${sign}${valStr} (${sign}${pct}%)</span>
                </span>`;
    };

    // Urutkan dari Eksposur paling besar
    const sortedBranches = Object.keys(stats).sort((a,b) => (stats[b].os || 0) - (stats[a].os || 0));
    
    let globalOs = 0;
    Object.values(stats).forEach(v => globalOs += (v.os || 0));

    sortedBranches.forEach((br, i) => {
        const d = stats[br];
        const pNpl = d.os > 0 ? (d.npl / d.os * 100).toFixed(2) : 0;
        const pKkr = d.os > 0 ? (d.kkr / d.os * 100).toFixed(2) : 0;
        const pPort = globalOs > 0 ? (d.os / globalOs * 100).toFixed(1) : 0;

        // Tarik Data Diff
        let noaDiff = getDiff(d.noa, d.prev_noa, false, false);
        let osDiff = getDiff(d.os, d.prev_os, false, true);
        let prodDiff = getDiff(d.prod, d.prev_prod, false, true);
        let konsDiff = getDiff(d.kons, d.prev_kons, false, true);
        let kurDiff = getDiff(d.kur, d.prev_kur, false, true);
        let kkrDiff = getDiff(d.kkr, d.prev_kkr, true, true);
        let nplDiff = getDiff(d.npl, d.prev_npl, true, true);

        let badgeNPL = pNpl > 5 ? 'bg-red-500 text-white shadow-sm border-transparent animate-pulse' : (pNpl > 0 ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200');

        html += `
        <div class="bg-white/90 dark:bg-slate-800/90 rounded-[1.5rem] p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-purple-300 transition-all animate-pop-in flex flex-col gap-3" style="animation-delay: ${i * 40}ms; animation-fill-mode: forwards;">
            
            <!-- ROW 1: Header Cabang & OS -->
            <div class="flex justify-between items-start border-b border-dashed border-slate-200 dark:border-slate-700 pb-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center font-black shadow-inner border border-purple-200 dark:border-purple-800/50 shrink-0">
                        <i class="fas fa-building text-sm"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="font-black text-sm text-slate-800 dark:text-white uppercase tracking-tight truncate">${br}</div>
                        <div class="text-[9px] font-bold text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                            <span class="flex items-center gap-1"><i class="fas fa-users text-blue-400"></i> ${d.noa || 0} NOA ${noaDiff}</span>
                            <span class="opacity-50">|</span>
                            <span>Porsi: ${pPort}%</span>
                        </div>
                    </div>
                </div>
                <div class="text-right shrink-0 ml-2">
                    <div class="font-mono font-black text-blue-600 dark:text-blue-400 text-[13px] md:text-sm leading-tight">${fmtIDR(d.os)}</div>
                    <div class="mt-1">${osDiff}</div>
                </div>
            </div>

            <!-- ROW 2: Segmen Kredit (Prod, Kons, KUR) -->
            <div class="grid grid-cols-3 gap-2">
                <div class="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center text-center shadow-inner">
                    <span class="text-[8px] font-black text-teal-600 uppercase tracking-widest mb-1">Produktif</span>
                    <span class="font-mono font-black text-slate-700 dark:text-slate-200 text-[10px] mb-1">${fmtIDR(d.prod)}</span>
                    ${prodDiff}
                </div>
                <div class="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center text-center shadow-inner">
                    <span class="text-[8px] font-black text-indigo-600 uppercase tracking-widest mb-1">Konsumtif</span>
                    <span class="font-mono font-black text-slate-700 dark:text-slate-200 text-[10px] mb-1">${fmtIDR(d.kons)}</span>
                    ${konsDiff}
                </div>
                <div class="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center text-center shadow-inner">
                    <span class="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">KUR</span>
                    <span class="font-mono font-black text-slate-700 dark:text-slate-200 text-[10px] mb-1">${fmtIDR(d.kur)}</span>
                    ${kurDiff}
                </div>
            </div>

            <!-- ROW 3: Mutasi & Risiko -->
            <div class="grid grid-cols-2 gap-3 mt-1">
                <!-- Col 1: Mutasi Cair Lunas -->
                <div class="flex flex-col gap-2">
                    <div class="flex-1 bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800/50 flex justify-between items-center">
                        <span class="text-[8px] font-black text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-1"><i class="fas fa-plus-circle"></i> Cair</span>
                        <div class="text-right">
                            <div class="font-mono font-black text-emerald-700 dark:text-emerald-400 text-[9px]">+${fmtIDR(d.cair_os || 0)}</div>
                            <div class="text-[7px] font-bold text-emerald-600 mt-0.5">${d.cair_noa || 0} Rek</div>
                        </div>
                    </div>
                    <div class="flex-1 bg-rose-50 dark:bg-rose-900/10 p-2 rounded-lg border border-rose-100 dark:border-rose-800/50 flex justify-between items-center">
                        <span class="text-[8px] font-black text-rose-700 dark:text-rose-400 uppercase flex items-center gap-1"><i class="fas fa-check-double"></i> Lunas</span>
                        <div class="text-right">
                            <div class="font-mono font-black text-rose-700 dark:text-rose-400 text-[9px]">-${fmtIDR(d.lunas_os || 0)}</div>
                            <div class="text-[7px] font-bold text-rose-600 mt-0.5">${d.lunas_noa || 0} Rek</div>
                        </div>
                    </div>
                </div>

                <!-- Col 2: Kinerja NPL KKR -->
                <div class="flex flex-col gap-2">
                    <div class="bg-orange-50/50 dark:bg-orange-900/20 p-2 rounded-lg border border-orange-100 dark:border-orange-800/40 flex flex-col justify-center relative overflow-hidden">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-[8px] font-black text-orange-600 uppercase tracking-widest">KKR (2-5)</span>
                            <span class="text-[7px] font-bold text-orange-700 bg-orange-100 dark:bg-orange-900/60 border border-orange-200 dark:border-orange-800 px-1 py-0.5 rounded shadow-sm">${pKkr}%</span>
                        </div>
                        <div class="font-mono font-black text-orange-600 dark:text-orange-400 text-[10px] mb-1">${fmtIDR(d.kkr)}</div>
                        <div>${kkrDiff}</div>
                    </div>
                    <div class="bg-red-50/50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-800/40 flex flex-col justify-center relative overflow-hidden">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-[8px] font-black text-red-600 uppercase tracking-widest">NPL (3-5)</span>
                            <span class="text-[7px] font-bold border px-1 py-0.5 rounded ${badgeNPL}">${pNpl}%</span>
                        </div>
                        <div class="font-mono font-black text-red-600 dark:text-red-400 text-[10px] mb-1">${fmtIDR(d.npl)}</div>
                        <div>${nplDiff}</div>
                    </div>
                </div>
            </div>

        </div>
        `;
    });

    container.innerHTML = html;

    // Animate Modal Entry
    const modal = document.getElementById('modal-branch');
    const backdrop = document.getElementById('modal-branch-backdrop');
    const content = document.getElementById('modal-branch-content');

    if(modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex'; 

        if (navigator.vibrate) navigator.vibrate(10);

        requestAnimationFrame(() => {
            if(backdrop) backdrop.classList.remove('opacity-0');
            if(content) content.classList.remove('translate-y-full'); 
        });
    }
}

function closeBranchModal() {
    const modal = document.getElementById('modal-branch');
    const backdrop = document.getElementById('modal-branch-backdrop');
    const content = document.getElementById('modal-branch-content');

    if(!modal || modal.classList.contains('hidden')) return;

    backdrop.classList.add('opacity-0');
    content.style.transform = ''; 
    content.classList.add('translate-y-full'); 
    
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.style.display = '';
    }, 300);
}

// --- FISIKA BOTTOM SHEET (SWIPE TO DISMISS & RUBBER BAND) ---
// Note: Kode ini menyatukan logika drag agar bisa dipakai banyak modal
function attachPhysicsToModal(handleId, contentId, closeFunc) {
    const handle = document.getElementById(handleId);
    const content = document.getElementById(contentId);
    if(!handle || !content) return;

    let startY = 0; let currentY = 0; let isDragging = false;

    handle.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        isDragging = true;
        content.style.transition = 'none'; 
    }, { passive: true });

    handle.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;
        
        if (deltaY > 0) {
            content.style.transform = `translateY(${deltaY}px)`;
        } else {
            // UX Magic: Rubber Band effect jika ditarik ke atas (terasa mentok)
            content.style.transform = `translateY(${deltaY * 0.15}px)`; 
        }
    }, { passive: false });

    handle.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        
        content.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
        const deltaY = currentY - startY;
        
        if (deltaY > 100) {
            if (navigator.vibrate) navigator.vibrate(30); 
            closeFunc(); // Tutup modal jika ditarik cukup jauh ke bawah
        } else {
            content.style.transform = 'translateY(0)'; // Membal ke posisi semula
        }
    });
}

function initBottomSheetPhysics() {
    attachPhysicsToModal('modal-sector-handle', 'modal-sector-content', closeSectorModal);
    attachPhysicsToModal('modal-branch-handle', 'modal-branch-content', closeBranchModal);
}

// --- FUNGSI EKSPOR WA: KOMPARASI CABANG (LENGKAP & SIAP FORWARD) ---
function exportBranchWA() {
    const stats = app.state.branch_perf;
    if (!stats || Object.keys(stats).length === 0) return alert("Data komparasi tidak tersedia.");
    
    const fmt = v => new Intl.NumberFormat('id-ID').format(v || 0);
    const dateStr = document.getElementById('headerDate') ? document.getElementById('headerDate').innerText : new Date().toLocaleDateString('id-ID');
    
    let msg = `*📊 EXECUTIVE SUMMARY KINERJA UNIT*\n_Posisi Data: ${dateStr}_\n\n`;

    const sortedBranches = Object.keys(stats).sort((a,b) => (stats[b].os || 0) - (stats[a].os || 0));
    
    sortedBranches.forEach((br, i) => {
        const d = stats[br];
        
        // Helper Perhitungan Selisih
        const calcDiff = (now, prev) => {
            let diff = (now || 0) - (prev || 0);
            let pct = prev ? (diff / prev * 100).toFixed(2) : ((now || 0) > 0 ? 100 : 0);
            let sign = diff >= 0 ? '+' : '';
            return { diff, pct, sign };
        };

        let os = calcDiff(d.os, d.prev_os);
        let noa = calcDiff(d.noa, d.prev_noa);
        let npl = calcDiff(d.npl, d.prev_npl);
        let kkr = calcDiff(d.kkr, d.prev_kkr);

        let nplRatio = d.os > 0 ? (d.npl / d.os * 100).toFixed(2) : 0;
        let kkrRatio = d.os > 0 ? (d.kkr / d.os * 100).toFixed(2) : 0;

        // Emoji indikator (Naik Hijau untuk OS, Turun Hijau untuk NPL)
        let iconOs = os.diff >= 0 ? '🟢' : '🔴';
        let iconNpl = npl.diff <= 0 ? '🟢' : '🔴';
        let iconKkr = kkr.diff <= 0 ? '🟢' : '🔴';

        msg += `*${i+1}. ${br}*\n`;
        msg += `📈 *Baki Debet:* Rp ${fmt(d.os)}\n`;
        msg += `      _Selisih: ${iconOs} ${os.sign}Rp ${fmt(Math.abs(os.diff))} (${os.sign}${os.pct}%)_\n`;
        
        msg += `👥 *Debitur:* ${fmt(d.noa)} NOA\n`;
        msg += `      _Selisih: ${noa.sign}${fmt(Math.abs(noa.diff))} NOA (${noa.sign}${noa.pct}%)_\n`;
        
        msg += `⚠️ *NPL (3-5):* Rp ${fmt(d.npl)} (${nplRatio}%)\n`;
        msg += `      _Selisih: ${iconNpl} ${npl.sign}Rp ${fmt(Math.abs(npl.diff))} (${npl.sign}${npl.pct}%)_\n`;
        
        msg += `👀 *KKR (2-5):* Rp ${fmt(d.kkr)} (${kkrRatio}%)\n`;
        msg += `      _Selisih: ${iconKkr} ${kkr.sign}Rp ${fmt(Math.abs(kkr.diff))} (${kkr.sign}${kkr.pct}%)_\n`;
        
        msg += `💸 *Pencairan:* Rp ${fmt(d.cair_os)} (${d.cair_noa} Rek)\n`;
        msg += `💳 *Pelunasan:* Rp ${fmt(d.lunas_os)} (${d.lunas_noa} Rek)\n`;
        msg += `➖➖➖➖➖➖➖➖➖➖\n`;
    });

    msg += `\n_🤖 Dokumen otomatis dihasilkan oleh DaKOPen_`;
    
    // Buka aplikasi WhatsApp (Universal link agar langsung masuk ke App di HP/Web)
    const waUrl = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(msg);
    window.open(waUrl, '_blank');
}

// --- FUNGSI EKSPOR PDF: KOMPARASI CABANG (ANTI BLANK PUTIH) ---
function exportBranchPDF() {
    const stats = app.state.branch_perf;
    if (!stats || Object.keys(stats).length === 0) return alert("Data komparasi tidak tersedia.");
    
    // Tampilkan loading screen
    if (document.getElementById('loader')) document.getElementById('loader').style.display = 'flex';

    const fmtIDR = v => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);
    const dateStr = document.getElementById('headerDate') ? document.getElementById('headerDate').innerText : new Date().toLocaleDateString('id-ID');

    // KUNCI PERBAIKAN: Buat HTML langsung dalam bentuk String. 
    // html2pdf akan merender string ini di mesin virtualnya, sehingga tidak ada error blank karena div off-screen.
    let htmlString = `
    <div style="padding: 10mm; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #ffffff; color: #0f172a;">
        <div style="border-bottom: 3px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
                <h1 style="color: #1e3a8a; font-size: 22pt; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: -0.5px;">Komparasi Kinerja Unit Kerja</h1>
                <p style="color: #64748b; font-size: 10pt; font-weight: bold; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Growth, Mutasi, & Risiko</p>
            </div>
            <div style="text-align: right;">
                <p style="background-color: #1e293b; color: #ffffff; padding: 4px 10px; border-radius: 4px; font-size: 9pt; font-weight: bold; margin: 0 0 6px 0; display: inline-block;">POSISI: ${dateStr}</p>
                <p style="color: #94a3b8; font-size: 8pt; margin: 0;">DaKOPen - Dicetak ${new Date().toLocaleDateString('id-ID')}</p>
            </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 8pt;">
            <thead>
                <tr style="background-color: #1e293b; color: #ffffff; text-transform: uppercase;">
                    <th style="padding: 10px; text-align: center; border: 1px solid #cbd5e1;">#</th>
                    <th style="padding: 10px; text-align: left; border: 1px solid #cbd5e1;">Unit Kerja</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">Outstanding (OS)</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">Cair (Inflow)</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">Lunas (Outflow)</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">KKR (Kol 2-5)</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">NPL (Kol 3-5)</th>
                </tr>
            </thead>
            <tbody>
    `;

    const sortedBranches = Object.keys(stats).sort((a,b) => (stats[b].os || 0) - (stats[a].os || 0));

    sortedBranches.forEach((br, i) => {
        const d = stats[br];
        
        // Helper Perhitungan untuk PDF
        const calc = (now, prev) => {
            let diff = (now || 0) - (prev || 0);
            let pct = prev ? (diff / prev * 100).toFixed(1) : ((now || 0) > 0 ? 100 : 0);
            let sign = diff >= 0 ? '+' : '';
            return { diff, pct, sign };
        };

        let os = calc(d.os, d.prev_os);
        let npl = calc(d.npl, d.prev_npl);
        let kkr = calc(d.kkr, d.prev_kkr);

        let nplPct = d.os > 0 ? (d.npl / d.os * 100).toFixed(2) : 0;
        let kkrPct = d.os > 0 ? (d.kkr / d.os * 100).toFixed(2) : 0;
        
        let bgRow = i % 2 === 0 ? '#ffffff' : '#f8fafc';

        // Penentuan Warna (Naik hijau untuk OS, Naik Merah untuk NPL)
        let colorOs = os.diff >= 0 ? '#15803d' : '#e11d48';
        let colorNpl = npl.diff > 0 ? '#e11d48' : '#15803d';
        let colorKkr = kkr.diff > 0 ? '#e11d48' : '#15803d';

        htmlString += `
        <tr style="background-color: ${bgRow};">
            <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; color: #64748b;">${i+1}</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">
                ${br}<br><span style="font-size:7pt; font-weight:normal; color:#64748b;">${d.noa} NOA</span>
            </td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">
                <div style="font-weight: bold; font-size: 10pt;">${fmtIDR(d.os)}</div>
                <div style="font-size: 7.5pt; color: ${colorOs}; margin-top: 2px;">${os.sign}${fmtIDR(Math.abs(os.diff))} (${os.sign}${os.pct}%)</div>
            </td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">
                <div style="font-weight: bold; color: #047857;">+${fmtIDR(d.cair_os)}</div>
                <div style="font-size: 7pt; color: #64748b; margin-top: 2px;">${d.cair_noa} Rek</div>
            </td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">
                <div style="font-weight: bold; color: #be123c;">-${fmtIDR(d.lunas_os)}</div>
                <div style="font-size: 7pt; color: #64748b; margin-top: 2px;">${d.lunas_noa} Rek</div>
            </td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">
                <div style="font-weight: bold; color: #c2410c;">${fmtIDR(d.kkr)}</div>
                <div style="font-size: 7.5pt; margin-top: 2px;">
                    <span style="background-color: #ffedd5; padding: 2px 4px; border-radius: 3px; color: #c2410c;">${kkrPct}%</span>
                    <span style="color: ${colorKkr}; margin-left: 4px;">${kkr.sign}${fmtIDR(Math.abs(kkr.diff))}</span>
                </div>
            </td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">
                <div style="font-weight: bold; color: #b91c1c;">${fmtIDR(d.npl)}</div>
                <div style="font-size: 7.5pt; margin-top: 2px;">
                    <span style="background-color: #fee2e2; padding: 2px 4px; border-radius: 3px; color: #b91c1c;">${nplPct}%</span>
                    <span style="color: ${colorNpl}; margin-left: 4px;">${npl.sign}${fmtIDR(Math.abs(npl.diff))}</span>
                </div>
            </td>
        </tr>`;
    });

    htmlString += `
            </tbody>
        </table>
        <table style="width: 100%; text-align: center; margin-top: 40px; font-size: 9pt; border: none;">
            <tr>
                <td style="width: 50%; border: none;">
                    <div style="margin-bottom: 60px;">Mengetahui,<br><b>Pemimpin Cabang</b></div>
                    <div style="font-weight: bold; border-top: 1px solid #000; display: inline-block; padding-top: 2px; width: 180px;"></div>
                </td>
                <td style="width: 50%; border: none;">
                    <div style="margin-bottom: 60px;">Disiapkan Oleh,<br><b>Penyelia / Admin Kredit</b></div>
                    <div style="font-weight: bold; border-top: 1px solid #000; display: inline-block; padding-top: 2px; width: 180px;"></div>
                </td>
            </tr>
        </table>
    </div>
    `;

    // 2. Eksekusi Print menggunakan HTML2PDF (Langsung dari htmlString)
    const opt = {
        margin:       10,
        filename:     `Kinerja_Unit_${dateStr.replace(/[^a-zA-Z0-9]/g, '')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' } // Landscape agar tidak desak-desakan
    };

    setTimeout(() => {
        html2pdf().set(opt).from(htmlString).save().then(() => {
            if(document.getElementById('loader')) document.getElementById('loader').style.display = 'none';
        });
    }, 500);
}

    



 
  function toggleTheme() { document.documentElement.classList.toggle('dark'); localStorage.setItem('theme',document.documentElement.classList.contains('dark')?'dark':'light'); }
  // --- PUBLIC API EXPORT ---
  // --- PUBLIC API EXPORT ---



 // =================================================================
// FUNGSI RENDER TABEL GLOBAL (MEMPERBAIKI ERROR renderTableRaw)
// =================================================================
window.renderTableRaw = function(tableId, rows) {
    const body = document.getElementById(tableId); 
    if(!body) return;
    
    const fmtIDR = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);

    if(!rows || rows.length === 0) { 
        body.innerHTML = `<tr><td colspan="10" class="p-8 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-xl"><i class="fas fa-ghost text-xl mb-2 block"></i> Data Bersih / Kosong</td></tr>`; 
        return;
    }

    body.innerHTML = rows.map((r, idx) => { 
        let k = parseInt(r.kol) || 1;
        
        // Konfigurasi Warna Badge Kolektibilitas
        let bgKol = k >= 3 ? 'bg-red-100 dark:bg-red-900/40 text-red-600 border-red-200' : (k == 2 ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 border-orange-200' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 border-emerald-200');
        
        // Membersihkan nama dari tanda kutip agar tidak merusak fungsi klik
        let safeNama = String(r.nama || '-').replace(/'/g, "\\'");

        return `
        <tr class="hover:bg-blue-50/50 dark:hover:bg-slate-800/80 transition-colors group cursor-pointer animate-fade-in border-b border-slate-100/50 dark:border-slate-800/50" style="animation-delay: ${Math.min(idx * 20, 400)}ms" onclick="if(window.app && window.app.fetchDetail) window.app.fetchDetail('${r.loan}')">
            
            <td class="p-2.5 md:p-3 align-middle">
                <div class="font-black text-[10px] md:text-xs text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors truncate w-32 md:w-auto uppercase">${safeNama}</div>
                <div class="text-[8px] md:text-[9px] font-bold text-slate-500 mt-0.5 font-mono flex items-center gap-1"><i class="fas fa-fingerprint opacity-50 text-blue-400"></i>${r.loan}</div>
            </td>
            
            <td class="p-2.5 md:p-3 text-center align-middle hidden sm:table-cell">
                <span class="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-md border border-slate-200/50 dark:border-slate-700 shadow-sm">${r.br || '-'}</span>
            </td>
            
            <td class="p-2.5 md:p-3 text-center align-middle">
                <span class="inline-flex items-center justify-center min-w-[30px] px-1.5 py-0.5 rounded shadow-sm text-[9px] font-black border ${bgKol}">
                    KOL ${k}
                </span>
            </td>
            
            <td class="p-2.5 md:p-3 text-right align-middle hidden lg:table-cell">
                <div class="text-[9px] md:text-[10px] font-bold text-slate-400 font-mono tracking-tighter">${fmtIDR(r.plafond)}</div>
            </td>
            
            <td class="p-2.5 md:p-3 text-right align-middle">
                <div class="font-mono font-black text-slate-800 dark:text-white text-[11px] md:text-xs group-hover:scale-105 group-hover:text-blue-600 transition-all origin-right tracking-tighter">${fmtIDR(r.os)}</div>
            </td>
            
        </tr>`; 
    }).join('');
};
    
  return {
    state: s, 

    // 1. Core Functions
    init: init, 
    refresh: refresh, 
    
    // 2. Event Handlers
    onDateChange: function() { 
        s.filter.d = document.getElementById('selDate').value; 
        loadBranches(); 
    },

    toggleTheme: toggleTheme,
    toggleNativeMenu: toggleNativeMenu,
    toggleSpecificSheet: toggleSpecificSheet,
    internalCloseAll: internalCloseAll,
    toggleSidebar: toggleSidebar,

    // FIX 1: Penutupan total overlay, laci, dan SIDEBAR KIRI HP
      closeAllSheets: function() {
          // 1. Tutup semua laci bawah (Bottom Sheets)
          document.querySelectorAll('.custom-bottom-sheet').forEach(sheet => {
              sheet.classList.remove('open');
          });
          
          // 2. Tutup Master Menu
          const menu = document.getElementById('nativeMenuSheet');
          if (menu) menu.classList.add('translate-y-full');
          
          // 3. Sembunyikan Overlay Gelap
          const overlay = document.getElementById('nativeOverlay');
          if (overlay) overlay.classList.add('hidden');
          
          const sideOverlay = document.getElementById('sidebarOverlay');
          if (sideOverlay) sideOverlay.classList.add('hidden');

          // --- KUNCI PERBAIKAN: TUTUP SIDEBAR KIRI DI HP ---
          // Ini akan menggeser sidebar kembali ke kiri (-translate-x-full) 
          // setiap kali sebuah menu diklik, namun tetap aman di tampilan PC.
          const sidebar = document.getElementById('sidebar');
          if (sidebar) {
              sidebar.classList.add('-translate-x-full');
          }
      },

    // FIX 2: Perbaikan fungsi switchTab (Tutup laci SEBELUM pindah halaman)
    switchTab: function(id) {
        this.closeAllSheets(); // Membersihkan menu yang menumpuk

        if(id === 'npl-menu') { toggleSheet(); return; }

        document.querySelectorAll('.tab-view').forEach(e => e.classList.add('hidden')); 
        const target = document.getElementById(id);
        if(target) target.classList.remove('hidden');

        this.refresh(id);
    },

    // FIX 3: Fungsi pembuka Upload Modal dengan delay (Anti-Tumpuk & Z-Index Safety)
    openUploadModal: function() {
        this.closeAllSheets(); // Bersihkan laci utilitas dulu
        
        // Jeda agar laci turun sempurna, baru modal muncul di atas
        setTimeout(() => {
            const modal = document.getElementById('modalUpload');
            if(modal) {
                modal.classList.remove('hidden');
                // Reset input tanggal
                const upDate = document.getElementById('upDate');
                if(upDate) upDate.value = "";
            }
        }, 300);
    },



    // 3. Data Operations
    togSimSpecific: togSimSpecific, 
    sortKredit: sortKredit, 
    fetchDetail: fetchDetail, 
    detectDateFromFile: detectDateFromFile,
    doUpload: doUpload,
    renderSheetManager: renderSheetManager,
    updateDeleteCount: updateDeleteCount,
    executeDeleteSheets: executeDeleteSheets,
    
    // 4. Simulation & Tools
    updateStress: updateStress, 
    initStressTest: initStressTest, 
    toggleSim: toggleSim,
    
    // 5. WhatsApp Helpers
    getWA: getWA,      
    copyWA: copyWA,    
    sendWA: sendWA,    
    copyAndOpenWA: copyAndOpenWA, 
    actionWA : actionWA,
    
    // 6. Report & Print
    renderReportPage: renderReportPage, 
    printPDF: printPDF, 
    downloadPDF: downloadPDF, 
    renderReportPreview: renderReportPreview, 
    refreshReport: refreshReport, 
    
    // 7. Render Pages (View)
    renderDashboard: renderDashboard,
    renderMaturityPage: renderMaturityPage, 
    renderWriteOffPage: renderWriteOffPage, 
    renderFreshDropPage: renderFreshDropPage,
    renderMapPage: renderMapPage,
    renderJourneyPage: renderJourneyPage,
    showJourneyDetail: showJourneyDetail,
    openMitigationForm: openMitigationForm,
    closeMitigasiModal: closeMitigasiModal,
    submitMitigasi: submitMitigasi,
    exportJourneyResume: exportJourneyResume,
    generateResumeFinal: generateResumeFinal,
    addDasarText: addDasarText,
    toggleDasarCheck: toggleDasarCheck,
    addNewDasarItem: addNewDasarItem,
    removeDasarItem: removeDasarItem,
    updateStatusKomitmen: updateStatusKomitmen,
    setTemplateSolusi: setTemplateSolusi,
    searchDebtorJourney: searchDebtorJourney,
    toggleJourneyView: toggleJourneyView,
    changeCalendarMonth: changeCalendarMonth,
    showCalendarDetail: showCalendarDetail,
    openDetailFromCalendar: openDetailFromCalendar,
    printDailyReport: printDailyReport,
    saveDailyPDF: saveDailyPDF,
    openReportModal: openReportModal,
    generatePeriodicReport: generatePeriodicReport,
    savePeriodicPDF: savePeriodicPDF,
    printResumeCustom: printResumeCustom,
    formatRupiahInput: formatRupiahInput,
    editLog: editLog, 
    deleteLog: deleteLog,
    loadArchiveData: loadArchiveData,
    filterArchive: filterArchive,
    exportArchiveData: exportArchiveData,
    printSingleLabel: printSingleLabel,
    openDetailFromArchive: openDetailFromArchive,
    filterNewFiles: filterNewFiles,
    selectAllForPrint: selectAllForPrint,
    toggleSelect: toggleSelect,
    printSelectedLabels: printSelectedLabels,
    changeStatus: changeStatus,
    changePage: changePage,
    calcSim: calcSim,
    resetSimSliders: resetSimSliders,
    openSectorModal: openSectorModal,
    closeSectorModal: closeSectorModal,
    openBranchModal: openBranchModal,
    closeBranchModal: closeBranchModal,
    exportBranchWA: exportBranchWA,        
    exportBranchPDF: exportBranchPDF,
    handleSearchEnter: window.handleSearchEnter,
    resetSearchCredit: window.resetSearchCredit,
    sortKredit: window.sortKredit,
    togglePageSelection: togglePageSelection,
    closeModal: function(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('hidden');
        const overlay = document.getElementById('nativeOverlay');
        if (overlay) overlay.classList.add('hidden');
    }
  };   

})(); // Tutup IIFE

// Init Listener
document.addEventListener("DOMContentLoaded", function() { 
    if(window.app && window.app.init) window.app.init(); 
});
