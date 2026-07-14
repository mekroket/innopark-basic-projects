<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Akademisyen Rehberi Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet"/>
  <style>
    body { font-family: 'Inter', sans-serif; background: #f1f5f9; }
    .display { font-family: 'Space Grotesk', sans-serif; }

    /* Kart hover efekti */
    .card { transition: box-shadow .18s, transform .18s; }
    .card:hover { box-shadow: 0 8px 32px rgba(37,99,235,.13); transform: translateY(-2px); }

    /* Unvan rozetleri */
    .badge-prof  { background: #dbeafe; color: #1e40af; }
    .badge-doc   { background: #ede9fe; color: #6d28d9; }
    .badge-dr    { background: #d1fae5; color: #065f46; }
    .badge-other { background: #f3f4f6; color: #374151; }

    .filter-label { font-size: .7rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #64748b; }
    .stat-pill    { background: #eff6ff; color: #2563eb; font-size: .75rem; font-weight: 700; border-radius: 9999px; padding: 3px 12px; }

    /* Hiyerarşi ok göstergesi */
    .hier-arrow { color: #94a3b8; font-size: .65rem; padding: 0 2px; user-select: none; }

    /* Yükleniyor spinner */
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { animation: spin 1s linear infinite; border: 3px solid #e2e8f0; border-top-color: #7c0f54; border-radius: 50%; width: 28px; height: 28px; display: inline-block; }

    /* Filtreleme aktif rozeti */
    .filter-active { box-shadow: 0 0 0 2px #4e1fad; border-color: #b00f9a !important; background: #eff6ff !important; }
  </style>
</head>
<body class="min-h-screen">

<header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
  <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
    <div class="flex items-center gap-3">
      <div class="bg-blue-600 rounded-xl p-2 shadow-md">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0121 21H3a12.083 12.083 0 012.84-10.422L12 14z"/>
        </svg>
      </div>
      <h1 class="text-base font-bold text-slate-800 display">Akademisyen Rehberi</h1>
    </div>
    <div class="flex items-center gap-3">
      <button onclick="loadData()"
        class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition shadow-sm">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Yenile
      </button>
      
      <a href="akademik_bot/export.php"
         class="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition shadow-sm">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 4v12m0 0l-4-4m4 4l4-4M5 20h14"/>
        </svg>
        Excel İndir
      </a>
      <span id="topCount" class="stat-pill">Yükleniyor…</span>
    </div>
  </div>
</header>

<div class="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row gap-5">

  <aside class="w-full md:w-64 flex-shrink-0">
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sticky top-20 space-y-4">

      <div class="relative">
        <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input id="searchInput" type="text" placeholder="İsim, üniversite veya bölüm…"
          class="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
      </div>

      <div class="flex items-center gap-1 text-xs text-slate-400 font-medium pb-1">
        <span>Şehir</span>
        <span class="hier-arrow">▶</span>
        <span>Üniversite</span>
        <span class="hier-arrow">▶</span>
        <span>Bölüm</span>
      </div>

      <div>
        <label class="filter-label block mb-1.5" for="fSehir">Şehir</label>
        <select id="fSehir" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700">
          <option value="">Tümü</option>
        </select>
      </div>

      <div>
        <label class="filter-label block mb-1.5" for="fUniversite">Üniversite</label>
        <select id="fUniversite" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700">
          <option value="">Tümü</option>
        </select>
      </div>

      <div>
        <label class="filter-label block mb-1.5" for="fBolum">Bölüm</label>
        <select id="fBolum" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700">
          <option value="">Tümü</option>
        </select>
      </div>

      <div>
        <label class="filter-label block mb-1.5" for="fUnvan">Unvan</label>
        <select id="fUnvan" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700">
          <option value="">Tümü</option>
        </select>
      </div>

      <div>
        <label class="filter-label block mb-1.5" for="fIletisim">İletişim</label>
        <select id="fIletisim" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700">
          <option value="">Tümü</option>
          <option value="email">E-postası olanlar</option>
          <option value="phone">Telefonu olanlar</option>
          <option value="both">Her ikisi olanlar</option>
        </select>
      </div>

      <button id="btnReset"
        class="w-full text-xs text-blue-600 hover:text-blue-800 font-semibold border border-blue-100 rounded-lg py-1.5 transition hover:bg-blue-50">
        Filtreleri Temizle
      </button>

      <div class="pt-3 border-t border-slate-100 space-y-2">
        <div class="flex justify-between text-xs text-slate-500">
          <span>Toplam sonuç</span>
          <span class="font-semibold text-slate-700" id="statTotal">—</span>
        </div>
        <div class="flex justify-between text-xs text-slate-500">
          <span>E-posta var</span>
          <span class="font-semibold text-green-600" id="statEmail">—</span>
        </div>
        <div class="flex justify-between text-xs text-slate-500">
          <span>Telefon var</span>
          <span class="font-semibold text-orange-500" id="statPhone">—</span>
        </div>
      </div>

      <div class="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
        <span id="dbDot" class="w-2 h-2 rounded-full bg-slate-300 inline-block"></span>
        <span id="dbStatusText">Bağlanılıyor…</span>
      </div>
    </div>
  </aside>

  <main class="flex-1 min-w-0">

    <div class="flex items-center justify-between mb-3">
      <p class="text-xs text-slate-400" id="pageInfo"></p>
      <div class="flex gap-2">
        <button id="btnPrev" disabled
          class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
          ← Önceki
        </button>
        <button id="btnNext" disabled
          class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
          Sonraki →
        </button>
      </div>
    </div>

    <div id="loadingState" class="flex flex-col items-center justify-center py-24 gap-4">
      <div class="spinner"></div>
      <p class="text-sm text-slate-400">Veritabanından veriler çekiliyor…</p>
    </div>

    <div id="errorState" class="hidden bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
      <p class="text-2xl mb-2">⚠️</p>
      <p class="text-sm font-semibold text-red-700" id="errorMessage">Bağlantı hatası</p>
      <p class="text-xs text-red-400 mt-1"><code>api.php</code> dosyasının sunucuda olduğundan emin olun.</p>
      <button onclick="loadData()" class="mt-4 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition">Tekrar Dene</button>
    </div>

    <div id="grid" class="hidden grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"></div>

    <div id="emptyState" class="hidden flex-col items-center justify-center py-24 text-center">
      <div class="bg-slate-100 rounded-full p-6 mb-4">
        <svg class="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </div>
      <p class="text-slate-600 text-sm font-semibold mb-1">Sonuç bulunamadı</p>
      <p class="text-slate-400 text-xs max-w-xs">Bu filtrelere uyan akademisyen kaydı mevcut değil. Farklı bir şehir, üniversite veya bölüm deneyin.</p>
      <button id="btnResetEmpty"
        class="mt-4 text-xs text-blue-600 hover:text-blue-800 font-semibold border border-blue-100 rounded-lg px-4 py-2 transition hover:bg-blue-50">
        Tüm Filtreleri Temizle
      </button>
    </div>

    <div id="bottomPag" class="hidden mt-5 flex items-center justify-center gap-2">
      <button id="btnPrev2" disabled
        class="px-4 py-2 text-sm font-semibold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
        ← Önceki
      </button>
      <span id="pageInfo2" class="text-xs text-slate-500 px-2"></span>
      <button id="btnNext2" disabled
        class="px-4 py-2 text-sm font-semibold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
        Sonraki →
      </button>
    </div>

  </main>
</div>

<script>
'use strict';

const API_URL   = 'api.php';
const PAGE_SIZE = 30;
const UNKNOWN   = 'Belirtilmemiş';   // null/boş değerler için sabit etiket

// ── DURUM ──────────────────────────────────────────────────────────────────
let RAW_DATA = [];           // Tüm ham kayıtlar
let filtered  = [];          // Aktif filtre sonuçları
let page      = 1;           // Güncel sayfa

let hIndex = new Map();
let unvanSet = new Set();

const norm = v => (v && v.trim()) ? v.trim() : UNKNOWN;

async function loadData() {
  showLoading();
  try {
    const res  = await fetch(API_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);

    RAW_DATA = json.data || [];
    setDbStatus(true, `${RAW_DATA.length.toLocaleString('tr-TR')} kayıt yüklendi`);

    buildIndex();
    populateFilters();
    applyFilters();
    showGrid();
  } catch (err) {
    setDbStatus(false, 'Bağlantı başarısız');
    showError(err.message);
  }
}

function buildIndex() {
  hIndex   = new Map();
  unvanSet = new Set();

  for (const p of RAW_DATA) {
    const sehir = norm(p['Şehir']);
    const uni   = norm(p['Üniversite']);
    const bol   = norm(p['Bölüm']);
    const unvan = norm(p['Unvan']);

    if (!hIndex.has(sehir)) hIndex.set(sehir, new Map());
    const uniMap = hIndex.get(sehir);

    if (!uniMap.has(uni)) uniMap.set(uni, new Set());
    uniMap.get(uni).add(bol);

    if (unvan !== UNKNOWN) unvanSet.add(unvan);
  }
}

function populateFilters() {
  const cities = [...hIndex.keys()].sort((a, b) => a.localeCompare(b, 'tr'));
  fillSelect('fSehir', cities, false);
  fillSelect('fUniversite', [], false);
  fillSelect('fBolum',      [], false);

  const unvanlar = [...unvanSet].sort((a, b) => a.localeCompare(b, 'tr'));
  fillSelect('fUnvan', unvanlar, false);
}

function fillSelect(id, values, disabled) {
  const sel = document.getElementById(id);
  const cur = sel.value;

  sel.innerHTML = '<option value="">Tümü</option>';
  for (const v of values) {
    const o = document.createElement('option');
    o.value = v; o.textContent = v;
    sel.appendChild(o);
  }
  sel.disabled = disabled;

  if (cur && [...sel.options].some(o => o.value === cur)) sel.value = cur;
}

function onSehirChange() {
  const sehir = document.getElementById('fSehir').value;

  if (!sehir) {
    const allUnis = [...new Set(RAW_DATA.map(p => norm(p['Üniversite'])).filter(v => v !== UNKNOWN))].sort((a,b) => a.localeCompare(b,'tr'));
    fillSelect('fUniversite', allUnis, false);
    fillSelect('fBolum',      [],      false);
  } else {
    const uniMap = hIndex.get(sehir) || new Map();
    const unis   = [...uniMap.keys()].sort((a, b) => a.localeCompare(b, 'tr'));
    fillSelect('fUniversite', unis, false);
    fillSelect('fBolum',      [],   false);
  }

  applyFilters();
}

function onUniversiteChange() {
  const sehir = document.getElementById('fSehir').value;
  const uni   = document.getElementById('fUniversite').value;

  if (!uni) {
    fillSelect('fBolum', [], false);
  } else {
    const uniMap = hIndex.get(sehir) || new Map();
    const bolSet = uniMap.get(uni)   || new Set();
    const bols   = [...bolSet].sort((a, b) => a.localeCompare(b, 'tr'));
    fillSelect('fBolum', bols, false);
  }

  applyFilters();
}

function applyFilters() {
  const search   = document.getElementById('searchInput').value.trim().toLowerCase();
  const sehir    = document.getElementById('fSehir').value;
  const uni      = document.getElementById('fUniversite').value;
  const bolum    = document.getElementById('fBolum').value;
  const unvan    = document.getElementById('fUnvan').value;
  const iletisim = document.getElementById('fIletisim').value;

  filtered = RAW_DATA.filter(p => {
    if (sehir && norm(p['Şehir'])      !== sehir) return false;
    if (uni   && norm(p['Üniversite']) !== uni)   return false;
    if (bolum && norm(p['Bölüm'])      !== bolum) return false;

    if (unvan && norm(p['Unvan']) !== unvan) return false;

    const hasEmail = !!(p['E-posta'] && p['E-posta'].trim());
    const hasPhone = !!(p['Telefon'] && p['Telefon'].trim());
    if (iletisim === 'email' && !hasEmail)             return false;
    if (iletisim === 'phone' && !hasPhone)             return false;
    if (iletisim === 'both'  && (!hasEmail || !hasPhone)) return false;

    if (search) {
      const haystack = [
        p['Ad Soyad'], p['E-posta'], p['Bölüm'], p['Üniversite'], p['Şehir']
      ].map(v => (v || '').toLowerCase()).join(' ');
      if (!haystack.includes(search)) return false;
    }

    return true;
  });

  page = 1;
  renderPage();
}

function renderPage() {
  const total      = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start      = (page - 1) * PAGE_SIZE;
  const slice      = filtered.slice(start, start + PAGE_SIZE);

  document.getElementById('topCount').textContent  = total.toLocaleString('tr-TR') + ' sonuç';
  document.getElementById('statTotal').textContent = total.toLocaleString('tr-TR');
  document.getElementById('statEmail').textContent = filtered.filter(p => p['E-posta'] && p['E-posta'].trim()).length.toLocaleString('tr-TR');
  document.getElementById('statPhone').textContent = filtered.filter(p => p['Telefon'] && p['Telefon'].trim()).length.toLocaleString('tr-TR');

  const pageText = total > 0
    ? `Sayfa ${page} / ${totalPages}  ·  ${start + 1}–${Math.min(start + PAGE_SIZE, total)} / ${total} kayıt`
    : '';
  ['pageInfo', 'pageInfo2'].forEach(id => document.getElementById(id).textContent = pageText);

  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  ['btnPrev', 'btnPrev2'].forEach(id => document.getElementById(id).disabled = !hasPrev);
  ['btnNext', 'btnNext2'].forEach(id => document.getElementById(id).disabled = !hasNext);
  document.getElementById('bottomPag').classList.toggle('hidden', total === 0);

  const grid       = document.getElementById('grid');
  const emptyState = document.getElementById('emptyState');

  if (total === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden'); emptyState.classList.add('flex');
  } else {
    emptyState.classList.add('hidden'); emptyState.classList.remove('flex');
    grid.innerHTML = slice.map(renderCard).join('');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function badgeClass(unvan) {
  const u = (unvan || '').toLowerCase();
  if (u.startsWith('prof'))    return 'badge-prof';
  if (u.startsWith('doç'))     return 'badge-doc';
  if (u.startsWith('dr. öğr')) return 'badge-dr';
  return 'badge-other';
}

function renderCard(p) {
  const bc       = badgeClass(p['Unvan']);
  const emailStr = p['E-posta'] || '';
  const telStr   = p['Telefon'] || '';
  const sehir    = p['Şehir']      || '';
  const uni      = p['Üniversite'] || '';

  const locationLine = [uni, sehir].filter(Boolean).join(' · ');

  const emailHTML = emailStr
    ? `<a href="mailto:${emailStr}"
          class="flex items-center gap-1.5 text-xs text-blue-600 hover:underline truncate">
         <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
         </svg>
         <span class="truncate">${emailStr}</span>
       </a>`
    : `<span class="text-xs text-slate-300 flex items-center gap-1.5">
         <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
         </svg>E-posta yok</span>`;

  const phoneHTML = telStr
    ? `<span class="flex items-center gap-1.5 text-xs text-slate-600">
         <svg class="w-3.5 h-3.5 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
         </svg>
         ${telStr}
       </span>`
    : `<span class="text-xs text-slate-300 flex items-center gap-1.5">
         <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
         </svg>Telefon yok</span>`;

  return `
    <div class="card bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3">
      <div class="flex items-start justify-between gap-2">
        <h3 class="text-sm font-bold text-slate-800 display leading-snug">${p['Ad Soyad'] || '—'}</h3>
        ${p['Unvan'] ? `<span class="flex-shrink-0 text-xs font-semibold rounded-full px-2.5 py-1 ${bc}">${p['Unvan']}</span>` : ''}
      </div>
      ${p['Bölüm'] ? `<div class="text-xs text-slate-500 bg-slate-50 rounded-lg px-2.5 py-1.5 font-medium">${p['Bölüm']}</div>` : ''}
      ${locationLine ? `<div class="text-xs text-slate-400 flex items-center gap-1">
        <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <span class="truncate">${locationLine}</span>
      </div>` : ''}
      <div class="border-t border-slate-100 pt-3 mt-auto space-y-1.5">
        ${emailHTML}
        ${phoneHTML}
      </div>
    </div>`;
}

function showLoading() {
  el('loadingState').classList.remove('hidden');
  el('errorState').classList.add('hidden');
  el('grid').classList.add('hidden');
  el('emptyState').classList.remove('flex'); el('emptyState').classList.add('hidden');
  el('topCount').textContent = 'Yükleniyor…';
}
function showGrid() {
  el('loadingState').classList.add('hidden');
  el('errorState').classList.add('hidden');
  el('grid').classList.remove('hidden');
}
function showError(msg) {
  el('loadingState').classList.add('hidden');
  el('grid').classList.add('hidden');
  el('errorState').classList.remove('hidden');
  el('errorMessage').textContent = msg;
  el('topCount').textContent = 'Hata';
}
function setDbStatus(ok, text) {
  el('dbDot').className = `w-2 h-2 rounded-full inline-block ${ok ? 'bg-green-400' : 'bg-red-400'}`;
  el('dbStatusText').textContent = text;
}
const el = id => document.getElementById(id);

function resetAllFilters() {
  ['fSehir', 'fUnvan', 'fIletisim'].forEach(id => el(id).value = '');
  el('searchInput').value = '';
  fillSelect('fUniversite', [], false);
  fillSelect('fBolum',      [], false);
  applyFilters();
}

el('fSehir').addEventListener('change', onSehirChange);
el('fUniversite').addEventListener('change', onUniversiteChange);
['fBolum', 'fUnvan', 'fIletisim'].forEach(id =>
  el(id).addEventListener('change', applyFilters)
);
el('searchInput').addEventListener('input', applyFilters);
el('btnReset').addEventListener('click', resetAllFilters);
el('btnResetEmpty').addEventListener('click', resetAllFilters);

['btnPrev', 'btnPrev2'].forEach(id =>
  el(id).addEventListener('click', () => { if (page > 1) { page--; renderPage(); } })
);
['btnNext', 'btnNext2'].forEach(id =>
  el(id).addEventListener('click', () => {
    if (page < Math.ceil(filtered.length / PAGE_SIZE)) { page++; renderPage(); }
  })
);

loadData();
</script>
</body>
</html>