/* ============================================================
   maps.js — TMX yükleme + render + collision
   - tiles.png: 16x16 tile, 20 sütun, 320 tile (gid 1'den başlar)
   - Ekranda 3x ölçek (16 -> 48 px)
   - Collision: gid 0 + harita dışı + SOLID_GIDS + sahne bazlı solids
     dikdörtgenleri. Sahne 'opens' dikdörtgenleriyle delik açılabilir.
   ============================================================ */
(function () {
  'use strict';
  window.G = window.G || {};

  G.TILE = 16;        // kaynak tile boyutu
  G.SCALE = 3;        // ekran ölçeği
  G.TS = G.TILE * G.SCALE;  // 48 px — dünya birimi

  // Duvar/mobilya görünümlü gid'ler (tiles.png incelenerek seçildi).
  // Takım notu: yeni bir gid'in geçilmez olması gerekiyorsa buraya ekleyin,
  // tek bir noktadan geçilebilir olacaksa sahnenin 'opens' listesini kullanın.
  const SOLID_GIDS = new Set([
    4, 11, 12, 13, 14, 15, 16, 17, 24,
    31, 32, 33, 34, 35, 36, 37, 38, 39,
    41, 42, 43, 44, 45, 46, 51, 52, 53, 54, 55, 56, 57, 58, 59,
    90, 94, 95, 96, 97, 110, 112, 113, 125, 126,
    134, 135, 154, 155, 163, 164, 172, 173, 192, 193,
    289, 290, 291, 292, 293, 294, 309, 310, 311, 312, 313, 314
  ]);

  const _tmxCache = {};   // url -> Promise<{cols,rows,data}>

  /* TMX dosyasını fetch edip CSV katmanını parse eder. */
  function loadTMX(url) {
    if (_tmxCache[url]) return _tmxCache[url];
    _tmxCache[url] = fetch(url)
      .then(r => { if (!r.ok) throw new Error('TMX yok: ' + url); return r.text(); })
      .then(txt => {
        const mW = /width="(\d+)"/.exec(txt);
        const mH = /height="(\d+)"/.exec(txt);
        const mD = /<data encoding="csv">([\s\S]*?)<\/data>/.exec(txt);
        if (!mW || !mH || !mD) throw new Error('TMX parse hatası: ' + url);
        const cols = parseInt(mW[1], 10);
        const rows = parseInt(mH[1], 10);
        const data = mD[1].trim().split(/[\s,]+/).map(n => parseInt(n, 10) || 0);
        return { cols, rows, data };
      })
      .catch(err => {
        console.warn('[maps] ' + err.message + ' — placeholder oda üretildi');
        // Eksik dosya oyunu kırmasın: düz zeminli yedek oda
        const cols = 20, rows = 12, data = new Array(cols * rows).fill(194);
        return { cols, rows, data };
      });
    return _tmxCache[url];
  }

  /* Harita nesnesi — TMX'ten ya da koddan (data dizisi) kurulabilir. */
  class GameMap {
    constructor(def) {
      this.cols = def.cols;
      this.rows = def.rows;
      this.data = def.data;                    // gid dizisi (satır satır)
      this.solids = def.solids || [];          // ekstra geçilmez dikdörtgenler (px)
      this.opens  = def.opens  || [];          // zorla geçilebilir dikdörtgenler (px)
      this.solidGids = def.solidGids || SOLID_GIDS;
      this.pxW = this.cols * G.TS;
      this.pxH = this.rows * G.TS;
    }

    gidAt(tx, ty) {
      if (tx < 0 || ty < 0 || tx >= this.cols || ty >= this.rows) return 0;
      return this.data[ty * this.cols + tx];
    }

    /* Nokta (px) geçilmez mi? Öncelik: solids > opens > gid */
    solidAtPx(px, py) {
      for (const s of this.solids)
        if (px >= s.x && px < s.x + s.w && py >= s.y && py < s.y + s.h) return true;
      // opens: duvar görünümlü gid'lerde delik açar (kapı geçitleri vb.)
      for (const o of this.opens)
        if (px >= o.x && px < o.x + o.w && py >= o.y && py < o.y + o.h) return false;
      const tx = Math.floor(px / G.TS), ty = Math.floor(py / G.TS);
      const gid = this.gidAt(tx, ty);
      if (gid === 0) return true;                       // boşluk / harita dışı
      return this.solidGids.has(gid);
    }

    /* Dikdörtgen (ayak kutusu) serbest mi? Kenar + orta noktalar test edilir. */
    rectFree(x, y, w, h) {
      const pts = [
        [x, y], [x + w, y], [x, y + h], [x + w, y + h],
        [x + w / 2, y], [x + w / 2, y + h], [x, y + h / 2], [x + w, y + h / 2]
      ];
      for (const p of pts) if (this.solidAtPx(p[0], p[1])) return false;
      return true;
    }

    /* Görünür tile'ları çizer (kamera + 1 tile pay). */
    draw(ctx, cam, img) {
      if (!img || !img.complete || !img.naturalWidth) {
        // tileset yoksa düz koyu zemin — oyun kırılmasın
        ctx.fillStyle = '#1a1416';
        ctx.fillRect(0, 0, 960, 540);
        return;
      }
      const t0x = Math.max(0, Math.floor(cam.x / G.TS) - 1);
      const t0y = Math.max(0, Math.floor(cam.y / G.TS) - 1);
      const t1x = Math.min(this.cols - 1, Math.ceil((cam.x + 960) / G.TS) + 1);
      const t1y = Math.min(this.rows - 1, Math.ceil((cam.y + 540) / G.TS) + 1);
      for (let ty = t0y; ty <= t1y; ty++) {
        for (let tx = t0x; tx <= t1x; tx++) {
          const gid = this.data[ty * this.cols + tx];
          if (!gid) continue;
          const i = gid - 1;
          const sx = (i % 20) * G.TILE;
          const sy = Math.floor(i / 20) * G.TILE;
          ctx.drawImage(img, sx, sy, G.TILE, G.TILE,
            Math.round(tx * G.TS - cam.x), Math.round(ty * G.TS - cam.y), G.TS, G.TS);
        }
      }
    }

    /* Debug: geçilmez alanları kırmızıyla boyar (game.debug.collision = true). */
    drawCollision(ctx, cam) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,0,0,0.28)';
      const t0x = Math.max(0, Math.floor(cam.x / G.TS) - 1);
      const t0y = Math.max(0, Math.floor(cam.y / G.TS) - 1);
      const t1x = Math.min(this.cols - 1, Math.ceil((cam.x + 960) / G.TS) + 1);
      const t1y = Math.min(this.rows - 1, Math.ceil((cam.y + 540) / G.TS) + 1);
      for (let ty = t0y; ty <= t1y; ty++)
        for (let tx = t0x; tx <= t1x; tx++)
          if (this.solidAtPx(tx * G.TS + G.TS / 2, ty * G.TS + G.TS / 2))
            ctx.fillRect(tx * G.TS - cam.x, ty * G.TS - cam.y, G.TS, G.TS);
      ctx.fillStyle = 'rgba(255,160,0,0.35)';
      for (const s of this.solids) ctx.fillRect(s.x - cam.x, s.y - cam.y, s.w, s.h);
      ctx.restore();
    }
  }

  /* ================================================================
     ODA GÖRSELİ (backgroundImage) SİSTEMİ
     assets/maps/rooms/<isim>.png varsa TMX/kod-oda yerine zemin olarak
     bu resim çizilir (canvas'a sığdırılır). Collision yalnızca sahnenin
     solids/opens dikdörtgenleri + kenar payı (pad) ile çalışır.
     game.debug.collision = true görselleştirmesi aynen çalışır.
     ================================================================ */
  const _roomImgCache = {};   // isim -> Image | null (yok)

  function loadRoomImage(name) {
    if (_roomImgCache[name] !== undefined) return Promise.resolve(_roomImgCache[name]);
    return new Promise(res => {
      const img = new Image();
      img.onload = () => { _roomImgCache[name] = img; res(img); };
      img.onerror = () => { _roomImgCache[name] = null; res(null); };  // yok: TMX'e düş
      img.src = 'assets/maps/rooms/' + name + '.png';
    });
  }

  class ImageMap {
    constructor(img, opts) {
      opts = opts || {};
      // canvas'a sığdır (en-boy oranı korunur)
      const s = Math.min(960 / img.naturalWidth, 540 / img.naturalHeight);
      this.img = img;
      this.pxW = Math.round(img.naturalWidth * s);
      this.pxH = Math.round(img.naturalHeight * s);
      this.solids = opts.solids || [];    // resme göre px — kolayca ayarlanır
      this.opens = opts.opens || [];
      this.pad = opts.pad != null ? opts.pad : 14;  // kenarlardan duvar payı
    }

    solidAtPx(px, py) {
      for (const s of this.solids)
        if (px >= s.x && px < s.x + s.w && py >= s.y && py < s.y + s.h) return true;
      for (const o of this.opens)
        if (px >= o.x && px < o.x + o.w && py >= o.y && py < o.y + o.h) return false;
      return (px < this.pad || py < this.pad ||
              px > this.pxW - this.pad || py > this.pxH - this.pad);
    }

    rectFree(x, y, w, h) {
      const pts = [
        [x, y], [x + w, y], [x, y + h], [x + w, y + h],
        [x + w / 2, y], [x + w / 2, y + h], [x, y + h / 2], [x + w, y + h / 2]
      ];
      for (const p of pts) if (this.solidAtPx(p[0], p[1])) return false;
      return true;
    }

    draw(ctx, cam) {
      ctx.drawImage(this.img, Math.round(-cam.x), Math.round(-cam.y), this.pxW, this.pxH);
    }

    drawCollision(ctx, cam) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,160,0,0.35)';
      for (const s of this.solids) ctx.fillRect(s.x - cam.x, s.y - cam.y, s.w, s.h);
      ctx.strokeStyle = 'rgba(255,0,0,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(this.pad - cam.x, this.pad - cam.y,
        this.pxW - 2 * this.pad, this.pxH - 2 * this.pad);
      ctx.restore();
    }
  }

  /* ---------- Kod-içi oda inşası ----------
     fill(gidFn): (tx,ty) -> gid. Küçük mekanlar için TMX yerine kullanılır. */
  function buildRoom(cols, rows, gidFn) {
    const data = new Array(cols * rows);
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++)
        data[y * cols + x] = gidFn(x, y);
    return { cols, rows, data };
  }

  /* Standart küçük oda deseni: 43/44 duvar, 174 duvar dibi gölgesi,
     141/142 damalı zemin; alt duvar ortasında 303'lü kapı. */
  function simpleRoom(cols, rows, opts) {
    opts = opts || {};
    const doorX = opts.doorX != null ? opts.doorX : Math.floor(cols / 2);
    return buildRoom(cols, rows, (x, y) => {
      const border = (x === 0 || y === 0 || x === cols - 1 || y === rows - 1);
      if (border) {
        if (y === rows - 1 && (x === doorX || x === doorX + 1) && opts.doorBottom !== false) return 303;
        return ((x + y) % 2 === 0) ? 43 : 44;
      }
      if (y === 1) return 174;                     // üst duvar gölgesi
      if (opts.floorDark) return 194;
      return ((x + y) % 2 === 0) ? 141 : 142;
    });
  }

  G.maps = { loadTMX, GameMap, buildRoom, simpleRoom, SOLID_GIDS, loadRoomImage, ImageMap };
})();
