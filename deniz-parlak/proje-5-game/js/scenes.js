/* ============================================================
   scenes.js — Tüm sahne tanımları, trigger'lar ve hikaye akışı
   Diyalog metinleri docs/senaryo.md'den, voice eşleştirmesi
   docs/seslendirme_replik_listesi.md'den alınmıştır.

   Sahne sözleşmesi:
     G.SCENES[id] = {
       build(S)  -> sahne nesnesi {map, spawn, npcs, hotspots, triggers,
                    decors, dark, candle, lights, music, update, overDraw...}
       onEnter(sc, S) -> hikaye scripti (async)
       checkpoint: false -> game over sonrası buraya dönülmez
     }
   Konsoldan test: game.debug.goto('corridor_night2') vb.
   ============================================================ */
(function () {
  'use strict';
  window.G = window.G || {};
  G.SCENES = {};

  const T = n => n * G.TS;          // tile -> px kısayolu (48px)

  /* ================================================================
     ODA GÖRSELLERİ (opsiyonel backgroundImage sistemi)
     assets/maps/rooms/<file>.png eklenirse ilgili oda TMX yerine bu
     görselle çizilir (canvas'a sığdırılır). Görsel yoksa TMX/kod-oda
     yöntemi otomatik devam eder — bugün hiçbir görsel olmadığı için
     davranış birebir aynıdır.

     solids/opens: GÖRSEL dünyasında px dikdörtgenleri. Ayarlamak için:
       1) resmi assets/maps/rooms/ altına at
       2) oyunda game.debug.collision = true yap
       3) buradaki solids listesini resme göre düzelt
     NOT: Görselli odada NPC/hotspot/trigger koordinatları da görsel
     dünyasına göre elle güncellenmelidir (özellikle TMX sahnelerinde).
     ================================================================ */
  const ROOM_BG = {
    room:      { file: 'oda' },            // Evelyn'in odası (tüm geceler)
    office:    { file: 'ofis' },           // Katheryne'in ofisi
    lord:      { file: 'lord_odasi' },     // Lord'un çalışma odası
    tunnel:    { file: 'tunel' },          // kaçış tüneli
    entrance:  { file: 'giris_holu' },     // giriş holü (TMX yedekli)
    dining:    { file: 'yemek_salonu' },   // yemek salonu + mutfak
    corridor:  { file: 'koridor' },        // gece koridorları
    courtyard: { file: 'avlu' },           // avlu (2. gün + şafak)
    basement:  { file: 'bodrum' }          // bodrum/mahzen
    // Her girişe eklenebilir alanlar:
    //   solids: [{x,y,w,h}], opens: [{x,y,w,h}], pad: 14,
    //   spawn: {x, y, dir}   (görselli odada başlangıç noktası)
  };

  /* Görsel varsa ImageMap, yoksa tmxBuilder() sonucu döner. */
  async function sceneMap(roomKey, tmxBuilder) {
    const def = ROOM_BG[roomKey];
    if (def && def.file) {
      const img = await G.maps.loadRoomImage(def.file);
      if (img) {
        const m = new G.maps.ImageMap(img, def);
        m.isImage = true;
        m.bgSpawn = def.spawn || null;
        return m;
      }
    }
    return tmxBuilder();
  }

  /* ================================================================
     ORTAK YARDIMCILAR
     ================================================================ */

  /* child_crying_loop.mp3'ü sahneye bağlar: düşük sesle loop çalar,
     oyuncu kaynağa yaklaştıkça hafifçe artar. Dosya yoksa sessiz.
     src: {x,y} ya da () => ({x,y}) (hareketli kaynak — ör. Liam). */
  function attachCrying(sc, src, minV, maxV, range) {
    const h = G.audio.loopSfx('child_crying_loop', minV);
    sc.loops.push(h);
    const prev = sc.update;
    sc.update = dt => {
      if (prev) prev(dt);
      if (!h.el) return;
      const s = (typeof src === 'function') ? src() : src;
      const d = Math.hypot(G.player.x - s.x, G.player.y - s.y);
      const t = Math.max(0, Math.min(1, 1 - d / range));
      h.setVolume(minV + (maxV - minV) * t);
    };
    return h;
  }

  /* Oyuncu, npc'ye yaklaşana kadar bekle (takip mekaniği) */
  function waitNear(S, npc, dist) {
    dist = dist || 240;
    return new Promise((res, rej) => {
      const iv = setInterval(() => {
        if (G.token !== S.token) { clearInterval(iv); rej({ cancelled: true }); return; }
        const d = Math.hypot(G.player.x - npc.x, G.player.y - npc.y);
        if (d < dist) { clearInterval(iv); res(); }
      }, 120);
    });
  }

  /* NPC'yi waypoint listesinde yürüt, her durakta oyuncuyu bekle */
  async function followLeg(S, npc, pts, dist) {
    for (const p of pts) {
      await S.walk(npc, p[0], p[1], p[2] || 150);
      await waitNear(S, npc, dist || 260);
      S.chk();
    }
  }

  /* Oyuncu bir noktaya yaklaşana kadar bekle */
  function waitAt(S, x, y, dist) {
    return new Promise((res, rej) => {
      const iv = setInterval(() => {
        if (G.token !== S.token) { clearInterval(iv); rej({ cancelled: true }); return; }
        if (Math.hypot(G.player.x - x, G.player.y - y) < (dist || 90)) { clearInterval(iv); res(); }
      }, 100);
    });
  }

  /* ---------- Kod-çizim dekorlar (pixel mobilyalar) ---------- */

  function bedDecor(x, y) {  // x,y sol üst (px). 144x110 yatak
    return {
      x, y, baseline: y + 104,
      draw(ctx, cam) {
        const sx = x - cam.x, sy = y - cam.y;
        ctx.fillStyle = '#4a3626'; ctx.fillRect(sx, sy, 144, 104);          // ahşap kasa
        ctx.fillStyle = '#2e2118'; ctx.fillRect(sx, sy, 144, 8);
        ctx.fillStyle = '#b9a68f'; ctx.fillRect(sx + 8, sy + 10, 128, 60);  // çarşaf
        ctx.fillStyle = '#d8c8b8'; ctx.fillRect(sx + 12, sy + 14, 40, 24);  // yastık
        ctx.fillStyle = '#6b3434'; ctx.fillRect(sx + 8, sy + 70, 128, 26);  // battaniye
      }
    };
  }

  function wardrobeDecor(x, y) { // 90x120 dolap
    return {
      x, y, baseline: y + 116,
      draw(ctx, cam) {
        const sx = x - cam.x, sy = y - cam.y;
        ctx.fillStyle = '#3a2a1c'; ctx.fillRect(sx, sy, 90, 116);
        ctx.fillStyle = '#241a10'; ctx.fillRect(sx + 4, sy + 6, 38, 100);
        ctx.fillStyle = '#241a10'; ctx.fillRect(sx + 48, sy + 6, 38, 100);
        ctx.fillStyle = '#a4623d'; ctx.fillRect(sx + 41, sy + 52, 4, 10);   // kulplar
        ctx.fillStyle = '#a4623d'; ctx.fillRect(sx + 45, sy + 52, 4, 10);
      }
    };
  }

  function tableCandleDecor(x, y) { // 46x54 komodin + mum
    return {
      x, y, baseline: y + 50,
      draw(ctx, cam, now) {
        const sx = x - cam.x, sy = y - cam.y;
        ctx.fillStyle = '#4a3626'; ctx.fillRect(sx, sy + 20, 46, 30);
        ctx.fillStyle = '#d8c8b8'; ctx.fillRect(sx + 19, sy + 4, 8, 18);    // mum
        const f = Math.sin(now / 90) * 2;
        ctx.fillStyle = '#f4b942'; ctx.fillRect(sx + 21, sy - 6 + f * 0.4, 4, 8);
        ctx.fillStyle = '#fff3c4'; ctx.fillRect(sx + 22, sy - 3 + f * 0.4, 2, 4);
      }
    };
  }

  function doorDecor(x, y, opts) { // 84x110 karanlık kapı (duvara çizilir)
    opts = opts || {};
    return {
      x, y, baseline: opts.front ? y + 110 : y + 4,   // genelde arkada kalır
      hidden: false,
      draw(ctx, cam) {
        if (this.hidden) return;
        const sx = x - cam.x, sy = y - cam.y;
        ctx.fillStyle = '#1c1210'; ctx.fillRect(sx - 6, sy - 6, 96, 116);   // taş çerçeve
        ctx.fillStyle = opts.open ? '#050304' : '#2e2118';
        ctx.fillRect(sx, sy, 84, 110);
        if (!opts.open) {
          ctx.fillStyle = '#1c1210';
          ctx.fillRect(sx + 40, sy, 4, 110);
          ctx.fillStyle = '#a4623d'; ctx.fillRect(sx + 30, sy + 54, 6, 6);  // kulp
        }
      }
    };
  }

  /* Kefenli beden (bodrum) */
  function shroudDecor(x, y) {
    return {
      x, y, baseline: y + 20,
      draw(ctx, cam) {
        const sx = x - cam.x, sy = y - cam.y;
        ctx.fillStyle = '#171317'; ctx.fillRect(sx - 4, sy + 16, 72, 12);   // gölge
        ctx.fillStyle = '#c9c2b4'; ctx.fillRect(sx, sy, 68, 22);            // kefen
        ctx.fillStyle = '#a89f8e'; ctx.fillRect(sx + 14, sy + 3, 6, 16);    // bağlar
        ctx.fillStyle = '#a89f8e'; ctx.fillRect(sx + 46, sy + 3, 6, 16);
        ctx.fillStyle = '#33232a'; ctx.fillRect(sx + 74, sy + 6, 14, 12);   // katlı önlük
        ctx.fillStyle = '#d8c8b8'; ctx.fillRect(sx + 74, sy + 6, 14, 3);
      }
    };
  }

  /* ================================================================
     1) PROLOG — siyah ekran + evelyn_001 + malikane silüeti
     ================================================================ */
  G.SCENES.prologue = {
    build() {
      const def = G.maps.simpleRoom(6, 5, { floorDark: true, doorBottom: false });
      const map = new G.maps.GameMap(def);
      const sc = {
        map, spawn: { x: T(3), y: T(3) },
        hidePlayer: true, dark: 0, music: null,
        loops: [G.audio.loopSfx('ambience_wind_howling', 0.45)],
        overDraw(ctx, cam, now) {
          // Siyah zemin + KODLA çizilen malikane silüeti + yağmur çizgileri
          // (castle.png bir mobilya sprite sheet'i — arka plana konmaz!)
          ctx.fillStyle = '#020204'; ctx.fillRect(0, 0, 960, 540);
          ctx.save();
          ctx.globalAlpha = 0.55 + 0.05 * Math.sin(now / 700);
          ctx.fillStyle = '#0d0a10';
          // ana gövde + kanatlar
          ctx.fillRect(300, 330, 360, 210);
          ctx.fillRect(210, 380, 110, 160);
          ctx.fillRect(640, 380, 110, 160);
          // kuleler + külahlar
          for (const tx of [285, 465, 645]) {
            ctx.fillRect(tx, 270, 40, 120);
            ctx.beginPath();
            ctx.moveTo(tx - 6, 274); ctx.lineTo(tx + 20, 232); ctx.lineTo(tx + 46, 274);
            ctx.closePath(); ctx.fill();
          }
          // sivri çatı hattı
          ctx.beginPath();
          ctx.moveTo(300, 334); ctx.lineTo(480, 292); ctx.lineTo(660, 334);
          ctx.closePath(); ctx.fill();
          // loş pencereler — biri titrek
          ctx.fillStyle = 'rgba(214,148,58,0.32)';
          for (const [wx, wy] of [[350, 400], [420, 380], [530, 380], [600, 400], [250, 430], [690, 430]])
            ctx.fillRect(wx, wy, 10, 16);
          if (Math.sin(now / 320) > 0.2) {
            ctx.fillStyle = 'rgba(214,148,58,0.5)';
            ctx.fillRect(475, 350, 10, 16);        // yukarıdaki tek ışık
          }
          ctx.restore();
          // yağmur
          ctx.strokeStyle = 'rgba(150,160,180,0.16)';
          ctx.beginPath();
          for (let i = 0; i < 60; i++) {
            const rx = (i * 137 + now * 0.55) % 1000 - 20;
            const ry = (i * 91 + now * 0.9) % 580 - 20;
            ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 14);
          }
          ctx.stroke();
        }
      };
      return sc;
    },
    async onEnter(sc, S) {
      await S.wait(1200);
      await S.say('evelyn', 'evelyn_001',
        "İş ilanında sadece şu yazıyordu: 'Kuzey Dükü'nün malikanesine hizmetçi aranıyor. " +
        "Kalacak yer ve yemek dahil. Sorular sorulmayacak.' " +
        "O zamanlar bu son cümleyi garip bulmamıştım. Bulmalıydım.", { thought: true });
      G.audio.sfx('door_creak', { volume: 0.9 });
      await S.wait(1400);
      G.changeScene('entrance');
    }
  };

  /* ================================================================
     2) GİRİŞ HOLÜ — Theodore karşılaması (giris_merdiven_aday.tmx)
     ================================================================ */
  G.SCENES.entrance = {
    async build(S) {
      const map = await sceneMap('entrance', async () => {
        const def = await G.maps.loadTMX('assets/maps/giris_merdiven_aday.tmx');
        return new G.maps.GameMap(Object.assign({}, def, {
          solids: [
            { x: T(23), y: 0, w: 480, h: 150 },         // büyük merdiven gövdesi (2x kırpım)
            { x: T(47), y: T(10), w: T(2), h: T(2) }    // Lord kanadı geçidi — yasak
          ],
          opens: [
            { x: T(13), y: T(8.9), w: T(5), h: T(1.2) } // koridor -> hol kapı geçidi
          ]
        }));
      });
      const theodore = new G.NPC('theodore', T(13.5), T(10) + 20, { dir: 'down' });
      const katheryne = new G.NPC('katheryne', T(35.5), T(6), { visible: false });
      // Büyük merdiven: stairs.png HAM SHEET DEĞİL — sheet'ten TEK merdiven
      // kırpılır (orta sıradaki çift kollu büyük merdiven) ve 2x çizilir.
      const STAIR_CROP = { sx: 8, sy: 98, sw: 240, sh: 94 };
      const stairs = {
        x: T(23), y: -8, baseline: 168,
        draw(ctx, cam) {
          const img = G.decorImg.stairs;
          if (!img || !img.naturalWidth) return;
          ctx.drawImage(img, STAIR_CROP.sx, STAIR_CROP.sy, STAIR_CROP.sw, STAIR_CROP.sh,
            T(23) - cam.x, -8 - cam.y, STAIR_CROP.sw * 2, STAIR_CROP.sh * 2);
        }
      };
      return {
        map, spawn: map.bgSpawn || { x: T(13.7), y: T(14) - 10, dir: 'up' },
        npcs: [theodore, katheryne],
        decors: map.isImage ? [] : [stairs],   // görselli odada merdiven zaten resimde
        dark: 0.45, candle: false,
        lights: [
          { x: T(22.5), y: T(1), r: 200 }, { x: T(30.5), y: T(1), r: 200 },
          { x: T(27), y: T(6), r: 320 }, { x: T(13.5), y: T(11), r: 220 }
        ],
        music: 'music_ambient_manor',
        loops: [G.audio.loopSfx('ambience_wind_howling', 0.18)],
        _theodore: theodore, _katheryne: katheryne,
        triggers: [{
          x: T(46), y: T(9.6), w: T(4), h: T(3.6), once: false,
          action: () => {
            if (!G.flags._wingWarned || performance.now() - G.flags._wingWarned > 4000) {
              G.flags._wingWarned = performance.now();
              G.toast('Lord\'un kanadı. Çağrılmadan girilmez — birinci kural.');
            }
          }
        }]
      };
    },
    async onEnter(sc, S) {
      const th = sc._theodore, ka = sc._katheryne;
      G.setObjective('Malikaneye gir');
      await waitAt(S, T(13.7), T(10.5), 110);

      // Theodore kapıda karşılar
      th.facePlayer(G.player);
      await S.say('theodore', 'theodore_001',
        'Bayan Evelyn. Tam vaktinde. Lord Callisto dakikliğe önem verir. Beni izleyin.');

      // Hole yürür — oyuncu takip eder
      G.setObjective('Theodore\'u takip et');
      await followLeg(S, th, [[T(13.5), T(9.4)], [T(21), T(9.4)], [T(27), T(7.6)]], 220);
      th.facePlayer(G.player);

      await S.lines([
        { who: 'theodore', voice: 'theodore_002', text: 'Kurallar basittir. Birinci: Lord\'un kanadına çağrılmadan girilmez. İkinci: Misafir odalarındaki eşyalara dokunulmaz. Üçüncü...' },
        { who: 'theodore', voice: 'theodore_003', text: 'Üçüncü kural en önemlisidir. Gece yarısından sonra odanızdan çıkmayacaksınız. Ne duyarsanız duyun. NE DUYARSANIZ DUYUN. Anlaşıldı mı?' },
        { who: 'evelyn', voice: 'evelyn_002', text: 'N-neden? Yani... anlaşıldı ama—' },
        { who: 'theodore', voice: 'theodore_004', text: 'Güzel. İşte Bayan Katheryne.' }
      ]);

      // Katheryne belirir
      ka.visible = true;
      await S.walk(ka, T(29.5), T(7.6), 130);
      ka.facePlayer(G.player);
      await S.lines([
        { who: 'theodore', voice: 'theodore_005', text: 'Bu yeni hizmetçi. Lütfen ona etrafı gösterin, yapacağı işleri anlatın ve odasına yerleştirin. Yarın sabah iş başı yapacak.' },
        { who: 'katheryne', voice: 'katheryne_001', text: '(Evelyn\'i baştan aşağı süzer) İncesin. Öncekiler de inceydi.' },
        { who: 'katheryne', voice: 'katheryne_002', text: 'Benimle gel.' }
      ]);
      await S.walk(th, T(27), T(2.4), 120);     // Theodore merdivene çekilir
      await S.fadeOut(0.6);
      G.changeScene('tour_dining');
    }
  };

  /* ================================================================
     3) TUR — Yemek salonu + mutfak (yemek_salonu_aday.tmx)
     ================================================================ */
  function buildDining(extra) {
    return sceneMap('dining', () =>
      G.maps.loadTMX('assets/maps/yemek_salonu_aday.tmx').then(def => {
        return new G.maps.GameMap(Object.assign({}, def, {
          solids: [
            { x: 0, y: 0, w: T(60), h: T(1) },          // üst duvar bandı
            { x: T(57), y: 0, w: T(3), h: T(17) }       // sağ kenar
          ].concat(extra || [])
        }));
      }));
  }

  G.SCENES.tour_dining = {
    async build() {
      const map = await buildDining();
      const ka = new G.NPC('katheryne', T(5), T(9.5));
      return {
        map, spawn: { x: T(3.5), y: T(9.5), dir: 'right' },
        npcs: [ka], _ka: ka,
        dark: 0.4, candle: false,
        lights: [{ x: T(17.5), y: T(4), r: 300 }, { x: T(28), y: T(6), r: 300 },
                 { x: T(6.5), y: T(13), r: 280 }, { x: T(28), y: T(14), r: 300 }],
        music: 'music_ambient_manor'
      };
    },
    async onEnter(sc, S) {
      const ka = sc._ka;
      G.setObjective('Katheryne\'i takip et — malikane turu');
      await S.wait(600);
      await followLeg(S, ka, [[T(14.5), T(9.5)], [T(17.5), T(9.5)], [T(17.5), T(3)]], 240);
      ka.face('left');
      await S.say('katheryne', 'katheryne_010', 'Yemek salonu. Kahvaltı altıda, akşam yemeği sekizde kurulur. Gümüşler sayılıdır.');
      await followLeg(S, ka, [[T(17.5), T(10)], [T(6.8), T(10)], [T(6.8), T(13.5)], [T(11), T(14.5)]], 260);
      ka.face('right');
      await S.say('katheryne', 'katheryne_011', 'Mutfak. Aşçı Bruno\'ya bulaşma; işini yapar, konuşmaz.');
      await S.fadeOut(0.6);
      G.changeScene('tour_corridor');
    }
  };

  /* ================================================================
     Koridor haritası (koridor_orta_aday.tmx) — ortak kurucu
     Sol bölge (x:0-52) gece koridorları; sağ blok ayrı bir kanattır.
     ================================================================ */
  function buildCorridor(extraSolids) {
    return sceneMap('corridor', () =>
      G.maps.loadTMX('assets/maps/koridor_orta_aday.tmx').then(def => {
        return new G.maps.GameMap(Object.assign({}, def, {
          solids: [
            { x: 0, y: 0, w: T(53), h: T(9.6) },        // üst karanlık boşluk kapalı
            { x: 0, y: 0, w: T(0.8), h: T(20) }         // sol kenar
          ].concat(extraSolids || [])
        }));
      }));
  }

  G.SCENES.tour_corridor = {
    async build() {
      const map = await buildCorridor();
      const ka = new G.NPC('katheryne', T(3), T(13.5));
      const roomDoor = doorDecor(T(48.6), T(11.1) + 6);
      return {
        map, spawn: { x: T(1.8), y: T(13.5), dir: 'right' },
        npcs: [ka], _ka: ka,
        decors: [roomDoor],
        dark: 0.55, candle: false,
        lights: [{ x: T(10), y: T(13.5), r: 260 }, { x: T(24), y: T(13.5), r: 260 },
                 { x: T(38), y: T(13.5), r: 260 }, { x: T(49), y: T(13), r: 240 }],
        music: 'music_ambient_manor'
      };
    },
    async onEnter(sc, S) {
      const ka = sc._ka;
      G.setObjective('Katheryne\'i takip et — hizmetçi kanadı');
      await followLeg(S, ka, [[T(20), T(13.5)], [T(36), T(13.5)], [T(48.5), T(13.2)]], 280);
      ka.face('down');
      await S.lines([
        { who: 'katheryne', voice: 'katheryne_003', text: 'Odan burası. Anahtar kapının üstünde. Geceleri kilitle.' },
        { who: 'katheryne', voice: 'katheryne_004', text: '(arkasını dönmeden) Kızım... Theodore\'un söylediği kural var ya. Gece odadan çıkmamak. Onu şaka sanma. Buradaki en uzun süre dayanan hizmetçi benim. Nedenini hiç merak etme.' }
      ]);
      await S.walk(ka, T(30), T(13.5), 170);
      await S.fadeOut(0.6);
      G.changeScene('room_night1');
    }
  };

  /* ================================================================
     EVELYN'İN ODASI — kod-içi küçük oda (tüm geceler bunu kullanır)
     ================================================================ */
  async function buildMaidRoom(opts) {
    opts = opts || {};
    const map = await sceneMap('room', () => {
      const def = G.maps.simpleRoom(12, 9, { doorX: 5 });
      return new G.maps.GameMap(Object.assign({}, def, {
        solids: [
          { x: 384, y: 120, w: 144, h: 90 },   // yatak
          { x: 52, y: 100, w: 90, h: 100 }     // dolap
        ]
      }));
    });
    const sc = {
      map, spawn: map.bgSpawn || { x: T(5.6), y: T(7.4), dir: 'up' },
      // Görselli odada kod-mobilyalar çizilmez (mobilyalar resimde);
      // hotspot koordinatları görsele göre elle güncellenmelidir.
      decors: map.isImage ? [] : [bedDecor(384, 110), wardrobeDecor(52, 60), tableCandleDecor(330, 96)],
      dark: opts.dark != null ? opts.dark : 0.78,
      candle: true, candleR: 175,
      lights: [{ x: 352, y: 110, r: 120 }],
      music: null,
      // Gece ambiyansı: rüzgar + sürekli saat tik-takı (gerilim fonu).
      // Tik-tak, gece yarısı 12 vuruş çan sekansının YERİNE geçmez — o ayrı çalar.
      loops: [G.audio.loopSfx('ambience_wind_howling', 0.22),
              G.audio.loopSfx('clock_tick_ambient', 0.16)],
      hotspots: [], triggers: []
    };
    return sc;
  }
  const ROOM_DOOR = { x: T(5) - 10, y: T(8) - 26, w: T(2) + 20, h: 40 };   // alt kapı bölgesi

  /* ---- 1. GECE — ağlayan ses; çıkış YASAK ---- */
  G.SCENES.room_night1 = {
    async build() {
      const sc = await buildMaidRoom({ dark: 0.72 });
      sc._state = { settled: false, clock: false };
      sc.hotspots.push({
        x: 52, y: 100, w: 90, h: 100, label: 'Dolap',
        action: async () => {
          const S = G.S;
          sc._state.settled = true;
          G.toast('Eşyalarını dolaba yerleştirdin.');
          await S.wait(400);
          if (!sc._state.clock) G.setObjective('Yatağa git ve uyumayı dene (E)');
        }
      });
      sc.hotspots.push({
        x: 384, y: 120, w: 144, h: 90, label: 'Yatak',
        action: () => G.SCENES.room_night1._bed(sc)
      });
      sc.hotspots.push({
        x: ROOM_DOOR.x, y: ROOM_DOOR.y, w: ROOM_DOOR.w, h: ROOM_DOOR.h, label: 'Kapı',
        action: () => G.SCENES.room_night1._door(sc)
      });
      return sc;
    },
    async _bed(sc) {
      const S = G.S;
      if (!sc._state.clock) {
        // Uyumayı dene -> gece yarısı sekansı
        sc._state.clock = true;
        S.lock(true);
        await G.fx.fadeTo(1, 1.2); await S.wait(700);
        await G.fx.fadeTo(0.4, 1.0);
        // Saat: 12 vuruş (clock_chime.mp3 varsa o, yoksa sentez çan)
        await G.audio.clockChime(() => G.token === S.token);
        S.chk();
        await S.wait(500);
        // Uzaktan çocuk ağlaması — kapıya (sese) yaklaştıkça hafifçe artar
        attachCrying(sc, { x: T(5.6), y: T(8.2) }, 0.08, 0.32, 420);
        await G.fx.fadeTo(0, 0.8);
        S.lock(false);
        await S.say('evelyn', 'evelyn_003',
          'Bir çocuk mu...? Bu malikanede çocuk mu var? Kimse bahsetmedi...', { thought: true });
        G.setObjective('Ses kapının dışından geliyor... (kapı / yatak)');
      } else {
        // Sabaha kadar uyu
        S.lock(true);
        await G.fx.fadeTo(1, 1.5);
        G.audio.sfx('jumpscare_whisper_02', { volume: 0.2 });
        await S.wait(1600);
        G.changeScene('day1');
      }
    },
    async _door(sc) {
      const S = G.S;
      if (!sc._state.clock) { G.toast('Bu gece dinlenmelisin. Yarın iş başı.'); return; }
      // KURAL: ilk gece çıkmaya izin YOK
      S.lock(true);
      G.audio.sfx('door_creak', { volume: 0.7 });
      await G.fx.fadeTo(0.85, 0.8);
      await S.wait(500);
      await G.fx.fadeTo(0, 0.6);
      S.lock(false);
      await S.say('evelyn', 'evelyn_004', 'Hayır... ilk gecemde olmaz.', { thought: true });
      // Evelyn kendini geri atar
      G.player.place(T(5.6), T(6.6), 'up');
      G.setObjective('Yatağa dön ve uyu');
    },
    async onEnter(sc, S) {
      G.setObjective('Odana yerleş (dolap: E)');
      await S.say('katheryne', null, '(Kapı arkandan kapanır. Kilidin sesi koridorda yankılanır.)', { name: ' ' });
    }
  };

  /* ================================================================
     4) 1. GÜN — Mutfak, huysuz aşçı Bruno
     ================================================================ */
  G.SCENES.day1 = {
    async build() {
      const map = await buildDining();
      const bruno = new G.NPC('bruno', T(13.5), T(14.2), { dir: 'down' });
      const sc = {
        map, spawn: { x: T(6.8), y: T(13), dir: 'down' },
        npcs: [bruno], _bruno: bruno,
        dark: 0.22, candle: false,
        music: 'music_ambient_manor',
        _tasks: { table: false, sheets: false, sack: false, carried: false },
        hotspots: [], triggers: []
      };
      const st = sc._tasks;
      sc.hotspots.push({
        x: T(17), y: T(3.5), w: 48, h: 60, label: 'Masaları sil',
        enabled: () => !st.table,
        action: async () => { st.table = true; G.toast('Yemek salonu masalarını sildin. (1/3)'); checkTasks(sc); }
      });
      sc.hotspots.push({
        x: T(2.2), y: T(3.6), w: 80, h: 50, label: 'Çarşafları topla',
        enabled: () => !st.sheets,
        action: async () => { st.sheets = true; G.toast('Kirli çarşafları topladın. (2/3)'); checkTasks(sc); }
      });
      sc.hotspots.push({
        x: T(9), y: T(15.3), w: 60, h: 50, label: 'Malzeme çuvalı',
        enabled: () => !st.sack && !st.carried,
        action: async () => { st.carried = true; G.toast('Çuvalı sırtladın — Bruno\'ya götür.'); G.setObjective('Çuvalı Bruno\'ya götür'); }
      });
      sc.hotspots.push({
        x: T(12.7), y: T(13.4), w: 96, h: 80, label: 'Bruno',
        action: () => G.SCENES.day1._bruno_talk(sc)
      });
      // Opsiyonel keşif: masanın başındaki BOŞ SANDALYE (game over tuzağı)
      sc.hotspots.push({
        x: T(24.5), y: T(2.2), w: 48, h: 48, label: 'Boş sandalye',
        action: async () => {
          const S = G.S;
          const i = await S.choice(['Otur ve dinlen', 'Uzak dur']);
          if (i === 0) {
            S.lock(true);
            G.audio.sfx('jumpscare_whisper_03', { volume: 0.9 });
            await G.fx.fadeTo(1, 1.4);
            await S.say('narrator', null, 'O sandalye boş değildi.', { name: ' ' });
            G.gameOver('O sandalye hiç boş değildi.');
          } else {
            G.toast('İçinden bir ses uzak durmanı söyledi.');
          }
        }
      });
      return sc;
    },
    async _bruno_talk(sc) {
      const S = G.S;
      const st = sc._tasks;
      if (st.carried && !st.sack) { st.sack = true; G.toast('Çuvalı teslim ettin. (3/3)'); }
      sc._bruno.facePlayer(G.player);
      if (sc._brunoDone) { G.audio.sfx('bruno_grunt', { volume: 0.9 }); return; }
      sc._brunoDone = true;
      await S.lines([
        { who: 'evelyn', voice: 'evelyn_005', text: 'Affedersiniz... Bruno Bey? Dün gece bir çocuk ağlaması duydum. Malikanede çocuk mu yaşıyor?' },
        { who: 'narrator', name: ' ', text: '(Bıçak bir an havada durur. Sonra doğramaya devam eder.)' }
      ]);
      G.audio.sfx('bruno_grunt', { volume: 1.0 });
      await S.lines([
        { who: 'bruno', voice: 'bruno_001', text: 'Hmph.' },
        { who: 'evelyn', voice: 'evelyn_006', text: 'Peki... neden geceleri odadan çıkmak yasak?' }
      ]);
      // Bıçak TAHTAYA saplanır — görsel vurgu kalır, korkutucu sting YOK;
      // sadece nötr, boğuk bir "tak" (sentez ahşap darbesi)
      G.audio.knock();
      G.fx.shake(0.25, 7);
      await S.lines([
        { who: 'narrator', name: ' ', text: '(Bıçağı tahtaya SAPLAR. Sana bakmaz. Sadece kapıyı işaret eder.)' },
        { who: 'evelyn', voice: 'evelyn_007', text: 'Sanki herkes aynı şeyi biliyor... ve kimse söylemiyor.', thought: true }
      ]);
      checkTasks(sc);
    },
    async onEnter(sc, S) {
      G.flags.day = 1;
      G.setObjective('Günlük işler: masaları sil, çarşafları topla, çuvalı Bruno\'ya taşı');
      await S.say('narrator', null, '— 1. GÜN —', { name: ' ' });
    }
  };

  async function checkTasks(sc) {
    const st = sc._tasks;
    if (st.table && st.sheets && st.sack && sc._brunoDone) {
      const S = G.S;
      G.setObjective(null);
      await S.wait(900);
      S.lock(true);
      await G.fx.fadeTo(1, 1.2);
      G.changeScene('room_night2');
    } else if (st.table && st.sheets && st.sack) {
      G.setObjective('Bruno ile konuş');
    }
  }

  /* ---- 2. GECE (oda) — ağlama çok yakın; artık çıkabilirsin ---- */
  G.SCENES.room_night2 = {
    async build() {
      const sc = await buildMaidRoom({ dark: 0.8 });
      sc._left = false;
      sc.hotspots.push({
        x: ROOM_DOOR.x, y: ROOM_DOOR.y, w: ROOM_DOOR.w, h: ROOM_DOOR.h, label: 'Kapı',
        action: async () => {
          const S = G.S;
          if (!sc._left) {
            sc._left = true;
            G.audio.sfx('door_creak', { volume: 0.9 });
            await S.fadeOut(0.6);
            G.changeScene('corridor_night2');
          }
        }
      });
      sc.hotspots.push({ x: 384, y: 120, w: 144, h: 90, label: 'Yatak',
        action: () => G.toast('Uyuyamazsın. Ses... çok yakın.') });
      return sc;
    },
    async onEnter(sc, S) {
      S.lock(true);
      await S.wait(800);
      await G.audio.clockChime(() => G.token === S.token);   // 12 vuruş
      S.chk();
      // Ağlama — bu kez ÇOK yakın, kapının hemen dışında gibi
      attachCrying(sc, { x: T(5.6), y: T(8.2) }, 0.25, 0.65, 420);
      await S.wait(900);
      S.lock(false);
      await S.say('evelyn', 'evelyn_008',
        'Yeter. Bir çocuk ağlıyorsa, birinin yardım etmesi gerekir. Kural falan umurumda değil.', { thought: true });
      G.setObjective('Koridora çık — sesi takip et');
    }
  };

  /* ================================================================
     5) 2. GECE — koridor: çocuk takibi + KANLI EL JUMPSCARE + QTE
     ================================================================ */
  G.SCENES.corridor_night2 = {
    async build() {
      const map = await buildCorridor();
      const liam = new G.NPC('liam', T(41), T(13.5), { silhouette: true, speed: 300 });
      const aldric = new G.NPC('aldric', T(4), T(15), { visible: false });
      const secretDoor = doorDecor(T(1.2), T(11.2));
      secretDoor.hidden = true;
      const sc = {
        map, spawn: { x: T(49), y: T(13.2), dir: 'left' },
        npcs: [liam, aldric], _liam: liam, _aldric: aldric, _door: secretDoor,
        decors: [secretDoor],
        dark: 0.93, candle: true, candleR: 165,
        music: null,
        // 2. gece koşusu: kalp atışı öne çıkar, rüzgar kısık (duck)
        loops: [G.audio.loopSfx('ambience_wind_howling', 0.14),
                G.audio.loopSfx('heartbeat_fast_loop', 0.75)],
        _stage: 0,
        hotspots: [], triggers: []
      };
      // Çocuk hep bir köşe ötede: 3 aşamalı takip trigger'ları
      const corners = [
        { x: T(41), y: T(13.5), next: [T(20), T(13.5)] },
        { x: T(20), y: T(13.5), next: [T(9), T(16.5)] },
        { x: T(9),  y: T(16.5), next: null }
      ];
      corners.forEach((c, i) => {
        sc.triggers.push({
          x: c.x - 200, y: c.y - 140, w: 400, h: 280,
          when: () => sc._stage === i,
          action: async () => {
            const S = G.S;
            sc._stage = i + 1;
            if (i === 0) {
              // Çocuğun İLK görünüşü — tam ekran Liam görseli + whisper
              await G.jumpscare.trigger({
                who: 'liam', image: 'liam_jumpscare',
                sting: 'jumpscare_whisper_02', blackTime: 0.5
              });
              await G.fx.fadeTo(0, 0.3);
              S.chk();
              await S.say('evelyn', 'evelyn_009', 'Hey... küçük? Sen kimsin? Burada ne yapıyorsun?');
              liam.walkTo(c.next[0], c.next[1], 320);
            } else if (i === 1) {
              G.audio.sfx('jumpscare_whisper_01', { volume: 0.6 });
              liam.walkTo(c.next[0], c.next[1], 320);
            } else {
              // 3. köşe: çocuk YOK. Onun yerine turda olmayan bir kapı.
              liam.visible = false;
              if (sc._cryingH) sc._cryingH.stop();          // ağlama aniden kesilir
              G.audio.sfx('door_creak_alt', { volume: 1.0 });
              sc._door.hidden = false;
              G.fx.shake(0.2, 4);
              G.setObjective('O kapı... turda yoktu.');
              await S.say('evelyn', null, 'Bu kapı... Katheryne\'in turunda burada kapı yoktu.', { thought: true });
            }
          }
        });
      });
      // Gizli kapı: merdiven + KANLI EL
      sc.hotspots.push({
        x: T(1.2), y: T(11.2), w: 90, h: 130, label: 'Aralık kapı',
        enabled: () => !sc._door.hidden,
        action: () => G.SCENES.corridor_night2._stairs(sc)
      });
      return sc;
    },
    async _stairs(sc) {
      const S = G.S;
      if (sc._stairsDone) return;
      sc._stairsDone = true;
      S.lock(true);
      G.audio.sfx('door_creak', { volume: 1.0 });
      await S.say('evelyn', 'evelyn_010', 'Aşağıda mısın...? Merak etme, sana zarar vermeyeceğim...');
      await G.fx.fadeTo(0.75, 1.2);        // merdivene ilk adım — zifiri karanlık
      await S.wait(600);

      // ============ JUMPSCARE #1: KANLI EL (BÜYÜK) ============
      // Tam ekran görsel: sürünen Marla + sting
      await G.jumpscare.trigger({ who: 'marla', image: 'marla_jumpscare', sting: 'jumpscare_sting' });
      await G.fx.fadeTo(0.55, 0.1);
      G.toast('Bir şey seni aşağı çekiyor!');
      const ok = await G.qte.run({ duration: 6, needed: 16 });
      if (G.token !== S.token) return;
      if (!ok) {
        G.audio.sfx('jumpscare_sting', { volume: 1 });
        G.gameOver('Karanlık seni aldı.');
        return;
      }
      // Aldric kurtarır
      G.audio.sfx('door_creak_alt', { volume: 1.0 });     // kapı kendiliğinden KAPANIR
      G.fx.shake(0.4, 10);
      await G.fx.fadeTo(0, 0.5);
      G.player.place(T(3.4), T(13.4), 'left');
      sc._aldric.visible = true;
      sc._aldric.place(T(2.2), T(12.8), 'down');
      sc._door.hidden = false;
      S.lock(false);
      await S.lines([
        { who: 'evelyn', voice: 'evelyn_011', text: '(nefes nefese) T-teşekkür... teşekkür ederim, ben—' },
        { who: 'aldric', voice: 'aldric_001', text: 'Aptal mısın sen? Sana söylenmedi mi? GECE. ODANDAN. ÇIKMA.' },
        { who: 'evelyn', voice: 'evelyn_012', text: 'Ama bir çocuk vardı, ağlıyordu—' },
        { who: 'aldric', voice: 'aldric_002', text: '...Bir daha gece seni buralarda görmeyeyim. Yürü.' }
      ]);
      // Odaya eşlik
      G.setObjective('Aldric seni odana götürüyor');
      S.lock(true);
      const legs = [[T(16), T(13.5)], [T(32), T(13.5)], [T(47), T(13.4)]];
      for (const p of legs) {
        sc._aldric.walkTo(p[0], p[1], 165);
        await S.playerTo(p[0] - 60, p[1] + 14, 165);
      }
      sc._aldric.face('down');
      await S.lines([
        { who: 'aldric', voice: 'aldric_003', text: '(sırtı dönük, duyulur duyulmaz bir fısıltıyla) ...O çocuğu bir daha görürsen... ona annesini nerede bulduğunu sorma.' }
      ]);
      await S.fadeOut(0.7);
      G.changeScene('room_after_rescue');
    },
    async onEnter(sc, S) {
      G.setObjective('Ağlama sesini takip et');
      // Ağlama kaynağı Liam — yaklaştıkça belirginleşir, kaybolunca susar
      sc._cryingH = attachCrying(sc, () => ({ x: sc._liam.x, y: sc._liam.y }), 0.12, 0.7, 900);
    }
  };

  /* ---- 2. gece sonu: odada kan + çığlıklar (çaresizlik sahnesi) ---- */
  G.SCENES.room_after_rescue = {
    checkpoint: false,
    async build() {
      const sc = await buildMaidRoom({ dark: 0.82 });
      sc.hidePrompt = true;
      return sc;
    },
    async onEnter(sc, S) {
      S.lock(true);
      G.player.place(T(6.5), T(5.2), 'down');
      await S.wait(900);
      await S.say('evelyn', 'evelyn_013',
        'Kan... Ama yaram yok. Bu benim kanım değil. Beni tutan... her kimse... elleri kan içindeydi.', { thought: true });
      // Ağlamalar yeniden — bu kez ÇIĞLIKLARLA. Oyuncu hiçbir şey yapamaz.
      G.audio.sfx('jumpscare_whisper_01', { volume: 0.7 });
      await S.wait(1200);
      G.audio.sfx('jumpscare_whisper_02', { volume: 0.8 });
      await S.wait(1000);
      G.audio.sfx('jumpscare_whisper_03', { volume: 0.9 });
      const hb = G.audio.loopSfx('heartbeat_fast_loop', 0.35);
      sc.loops.push(hb);
      // Ekran kenarları yavaşça kararır — sesler sabaha kadar sürer
      sc.vignette = { color: 'rgba(0,0,0,0.95)' };
      for (let d = sc.dark; d < 0.96; d += 0.02) {
        sc.dark = d; sc.candleR = Math.max(70, sc.candleR - 4);
        await S.wait(260);
      }
      await S.wait(1500);
      hb.stop();
      await G.fx.fadeTo(1, 2.0);
      G.changeScene('day2');
    }
  };

  /* ================================================================
     6) 2. GÜN — avlu: OLMAYAN MUHAFIZ (bahce_avlu_aday.tmx)
     ================================================================ */
  function buildCourtyard(extra, opens, roomKey) {
    return sceneMap(roomKey || 'courtyard', () =>
      G.maps.loadTMX('assets/maps/bahce_avlu_aday.tmx').then(def => {
        return new G.maps.GameMap(Object.assign({}, def, {
          solids: [
            { x: 0, y: 0, w: T(84), h: T(0.7) },       // üst kenar
            { x: T(76), y: 0, w: T(8), h: T(9) }       // sağ üst kule bölgesi
          ].concat(extra || []),
          // Ana yürüyüş bandı garantili açık (çit/heykel gid'leri yolu kesmesin)
          opens: [{ x: T(1), y: T(1), w: T(72), h: T(4.2) }].concat(opens || [])
        }));
      }));
  }

  G.SCENES.day2 = {
    async build() {
      const map = await buildCourtyard();
      const guard = new G.NPC('guard', T(28.5), T(2.6), { dir: 'down' });
      const sc = {
        map, spawn: { x: T(8), y: T(3), dir: 'right' },
        npcs: [guard], _guard: guard,
        dark: 0.12, candle: false,
        music: 'music_ambient_manor',
        loops: [G.audio.loopSfx('ambience_wind_howling', 0.25)],
        hotspots: []
      };
      sc.hotspots.push({
        x: T(27.8), y: T(1.8), w: 90, h: 90, label: 'Muhafız',
        action: () => G.SCENES.day2._talk(sc)
      });
      return sc;
    },
    async _talk(sc) {
      const S = G.S;
      if (sc._done) { G.toast('Muhafız seninle göz göze gelmiyor.'); return; }
      sc._done = true;
      sc._guard.facePlayer(G.player);
      await S.lines([
        { who: 'evelyn', voice: 'evelyn_014', text: 'Dün gece nöbette olan arkadaşınızı arıyorum. Uzun boylu, koyu zırhlı—' },
        { who: 'guard', voice: 'guard_001', text: 'Dün gece mi? Hanım, dün gece iç koridorlarda nöbetçi yoktu. Perşembeleri iç nöbet tutulmaz.' },
        { who: 'evelyn', voice: 'evelyn_015', text: 'Ama beni odama kadar götürdü, onunla konuştum—' },
        { who: 'guard', voice: 'guard_002', text: '(sesini alçaltır) İç koridorda... zırhlı biri mi? ...Bak kızım. Beni iyi dinle. Bu malikanede "Aldric" diye bir muhafız VARDI. Yirmi yıl önce. Merdiven kazasında öldü. Bodrum merdivenlerinde.' }
      ]);
      // Ekran bir kare titrer
      G.fx.flash(0.06); G.fx.shake(0.12, 6);
      await S.say('evelyn', 'evelyn_016',
        'Bodrum merdivenleri. Beni çektikleri yer. Beni KURTARDIĞI yer.', { thought: true });
      await S.wait(800);
      S.lock(true);
      await G.fx.fadeTo(1, 1.4);
      G.changeScene('room_night3');
    },
    async onEnter(sc, S) {
      G.flags.day = 2;
      G.setObjective('Avludaki muhafızla konuş');
      await S.say('narrator', null, '— 2. GÜN — Gözlerin kan çanağı. O zırhlı adamı bulmalısın.', { name: ' ' });
    }
  };

  /* ================================================================
     7) 3. GECE — kapıdaki not
     ================================================================ */
  G.SCENES.room_night3 = {
    async build() {
      const sc = await buildMaidRoom({ dark: 0.82 });
      sc._paper = { visible: false, y: 0 };
      // Kağıt animasyonu: kapının altından içeri süzülür
      sc.overDraw = (ctx, cam, now) => {
        if (!sc._paper.visible) return;
        const px = T(5.6) - cam.x, py = T(7.55) - sc._paper.y - cam.y;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(-0.06);
        ctx.fillStyle = '#d8c8b8'; ctx.fillRect(-14, -9, 28, 18);
        ctx.strokeStyle = '#6d5640'; ctx.strokeRect(-14, -9, 28, 18);
        ctx.restore();
      };
      sc.hotspots.push({
        x: T(5), y: T(6.8), w: T(2), h: T(1.4), label: 'Kağıt',
        enabled: () => sc._paper.visible && !sc._noteRead,
        action: async () => {
          const S = G.S;
          sc._noteRead = true;
          G.audio.voice('evelyn_018');
          await G.note.show('"Sonun annem gibi olmadan git buradan."<br><br>— L');
          S.chk();
          await S.say('evelyn', 'evelyn_019',
            'Annem gibi...? Bunu yazan... o çocuk mu? Onun annesi ne oldu? Bu ev insanlara NE YAPIYOR?', { thought: true });
          await S.wait(700);
          S.lock(true);
          await G.fx.fadeTo(1, 1.6);
          G.changeScene('day3_office');
        }
      });
      sc.hotspots.push({
        x: ROOM_DOOR.x, y: ROOM_DOOR.y, w: ROOM_DOOR.w, h: ROOM_DOOR.h, label: 'Kapı',
        action: () => G.toast(sc._knocked ? 'Kapıyı açmaya cesaret edemiyorsun.' : 'Eşyaların toplu. Yarın istifa ediyorsun.')
      });
      return sc;
    },
    async onEnter(sc, S) {
      G.flags.day = 3;
      G.setObjective('Eşyaların hazır. Yarın istifa ediyorsun.');
      S.lock(true);
      await S.wait(1000);
      await G.audio.clockChime(() => G.token === S.token);   // 12 vuruş
      S.chk();
      await S.wait(900);
      // Bu gece ağlama yok. Onun yerine: TIK. TIK. TIK.
      // (door_knock.mp3 varsa o çalar, yoksa sentez tıklama)
      sc._knocked = true;
      for (let i = 0; i < 3; i++) { G.audio.knockSfx(); await S.wait(650); }
      await S.wait(700);                                     // ...sessizlik
      S.lock(false);
      await S.say('evelyn', 'evelyn_017', 'Kim var orada?');
      S.lock(true);
      await S.wait(1200);
      for (let i = 0; i < 3; i++) { G.audio.knockSfx(); await S.wait(420); }
      // Sonra kapı KOLU — önce nazikçe, sonra ÖFKEYLE sarsılır (door_creak)
      G.audio.sfx('door_creak', { volume: 0.6, rate: 0.8 });
      await S.wait(1400);
      const hb = G.audio.loopSfx('heartbeat_fast_loop', 0.5);
      sc.loops.push(hb);
      G.audio.sfx('door_creak', { volume: 1.0, rate: 1.4 });
      G.fx.shake(0.9, 6);
      await S.wait(1600);
      // Ve aniden — MUTLAK sessizlik.
      hb.stop();
      await S.wait(1800);
      // Kağıt içeri süzülür
      sc._paper.visible = true;
      for (let i = 0; i <= 20; i++) { sc._paper.y = -20 + i * 2.2; await S.wait(40); }
      S.lock(false);
      G.setObjective('Kapının altından bir kağıt itildi — oku');
    }
  };

  /* ================================================================
     8) 3. GÜN — istifa (Katheryne ofisi, kod-içi oda)
     ================================================================ */
  G.SCENES.day3_office = {
    async build() {
      const map = await sceneMap('office', () => {
        const def = G.maps.buildRoom(10, 8, (x, y) => {
          if (x === 0 || y === 0 || x === 9 || y === 7) return ((x + y) % 2 === 0) ? 43 : 44;
          if (y === 1) return 174;
          if (y === 2 && x >= 2 && x <= 7) return 289 + (x - 2);      // arşiv rafı
          if ((y === 4) && (x === 4 || x === 5)) return x === 4 ? 172 : 173;  // çalışma masası
          if ((y === 5) && (x === 4 || x === 5)) return x === 4 ? 192 : 193;
          return 194;
        });
        return new G.maps.GameMap(def);
      });
      const ka = new G.NPC('katheryne', T(4.9), T(3.6), { dir: 'down' });
      return {
        map, spawn: map.bgSpawn || { x: T(5), y: T(6.6), dir: 'up' },
        npcs: [ka], _ka: ka,
        dark: 0.35, candle: false,
        lights: [{ x: T(5), y: T(4), r: 300 }],
        music: 'music_ambient_manor',
        hotspots: [{
          x: T(3.8), y: T(3.4), w: 120, h: 160, label: 'Katheryne',
          action: () => G.SCENES.day3_office._talk()
        }]
      };
    },
    async _talk() {
      const S = G.S;
      const sc = G.scene;
      if (sc._done) return;
      sc._done = true;
      await S.lines([
        { who: 'evelyn', voice: 'evelyn_020', text: 'Bayan Katheryne. İstifa etmek istiyorum. Bugün gidiyorum.' },
        { who: 'katheryne', voice: 'katheryne_005', text: '(uzun süre bakar) Hayır.' },
        { who: 'evelyn', voice: 'evelyn_021', text: 'Bu bir rica değildi. Gidiyorum.' },
        { who: 'katheryne', voice: 'katheryne_006', text: 'Sözleşmen bir ay. Lord imzaladı. Gidemezsin.' },
        { who: 'evelyn', voice: 'evelyn_022', text: 'O zaman Lord\'la konuşurum!' },
        { who: 'katheryne', voice: 'katheryne_007', text: '(bir saniyeliğine yüzünde korkuya benzer bir şey belirir) ...Peki. Ama kızım... odasında ne görürsen gör, ne duyarsan duy — YÜZÜNE BELLİ ETME. Bana bunu sonra teşekkür edersin.' }
      ]);
      await S.fadeOut(0.6);
      G.changeScene('lord_wing');
    },
    async onEnter(sc, S) {
      G.setObjective('Katheryne\'e istifanı bildir');
      await S.say('narrator', null, '— 3. GÜN — Kararını verdin: bugün gidiyorsun.', { name: ' ' });
    }
  };

  /* ================================================================
     9) LORD'UN KANADINA YÜRÜYÜŞ (giris_merdiven sağ kanadı)
     ================================================================ */
  G.SCENES.lord_wing = {
    checkpoint: false,
    async build() {
      const def = await G.maps.loadTMX('assets/maps/giris_merdiven_aday.tmx');
      const map = new G.maps.GameMap(Object.assign({}, def, {
        solids: [{ x: T(23), y: 0, w: T(8), h: 330 }]
      }));
      const ka = new G.NPC('katheryne', T(46), T(13.4));
      // DİKKAT: T(44) spawn'ı gid 112 (solid) ile çakışıyordu — oyuncu sıkışıyordu.
      return {
        map, spawn: { x: T(45), y: T(13.4), dir: 'right' },
        npcs: [ka], _ka: ka,
        dark: 0.62, candle: true, candleR: 190,
        music: 'music_ambient_manor',
        loops: [G.audio.loopSfx('ambience_wind_howling', 0.3)]
      };
    },
    async onEnter(sc, S) {
      const ka = sc._ka;
      G.setObjective('Katheryne\'i takip et — Lord\'un kanadı');
      await S.say('evelyn', null,
        'Bu koridor diğerlerinden farklı... daha eski, daha soğuk. Ve portreler... hepsi hizmetçi kıyafetli kadınlar. Hiçbirinin yüzü net değil.', { thought: true });
      await followLeg(S, ka, [[T(47.5), T(13)], [T(47.5), T(10.4)], [T(47.5), T(4.5)]], 240);
      ka.face('down');
      await S.say('katheryne', 'katheryne_012', '(önden girer, çıkar) Geç şimdi.');
      await S.walk(ka, T(47.5), T(8), 150);
      await S.fadeOut(0.7);
      G.changeScene('lord_study');
    }
  };

  /* ================================================================
     10) LORD'UN ODASI — koku, kan damlası, sahte anlaşma
     ================================================================ */
  G.SCENES.lord_study = {
    async build() {
      const map = await sceneMap('lord', () => new G.maps.GameMap(buildStudyDef()));
      const lord = new G.NPC('lord', T(8.5), T(4.6), { dir: 'up' });
      return buildStudyScene(map, lord);
    }
  };
  /* Lord'un odası tile tanımı — ROOM_BG.lord görseli varsa kullanılmaz */
  function buildStudyDef() {
      const def = G.maps.buildRoom(16, 10, (x, y) => {
        if (x === 0 || y === 0 || x === 15 || y === 9) return ((x + y) % 2 === 0) ? 43 : 44;
        if (y === 1) {
          if (x >= 7 && x <= 9) return 15 + (x - 7);          // şömine üst
          if (x >= 2 && x <= 5) return 289 + (x - 2);          // kitaplık
          if (x >= 11 && x <= 14) return 289 + (x - 11);
          return 174;
        }
        if (y === 2 && x >= 7 && x <= 9) return 35 + (x - 7);  // şömine orta
        if (y === 3 && x >= 7 && x <= 9) return 55 + (x - 7);  // şömine alt
        if ((y === 5 || y === 6) && (x === 11 || x === 12))    // çalışma masası
          return y === 5 ? (x === 11 ? 172 : 173) : (x === 11 ? 192 : 193);
        if (y >= 4 && y <= 7 && x >= 5 && x <= 10) return ((x + y) % 2 === 0) ? 121 : 122; // halı
        return 194;
      });
      return def;
  }

  /* Lord'un odası sahne nesnesi — tile ya da görsel harita, ikisiyle de çalışır */
  function buildStudyScene(map, lord) {
      const sc = {
        map, spawn: map.bgSpawn || { x: T(8), y: T(8.4), dir: 'up' },
        npcs: [lord], _lord: lord,
        dark: 0.5, candle: false,
        lights: [{ x: T(8.5), y: T(3), r: 260 }, { x: T(11.5), y: T(6), r: 200 }],
        music: null,
        vignette: { color: 'rgba(46,88,42,0.65)' },      // KOKU: yeşilimsi vinyet
        _blood: { t: 0, puddle: 0 },
        hotspots: []
      };
      // Şömine altından süzülen kan — damla döngüsü
      sc.update = dt => { sc._blood.t += dt; };
      sc.overDraw = (ctx, cam) => {
        const bx = T(8.5) - cam.x, by = T(3.8) - cam.y;
        const cyc = sc._blood.t % 1.4;
        ctx.fillStyle = '#7a0e0e';
        if (sc._blood.on) {
          // damla
          if (cyc < 1.0) ctx.fillRect(bx - 2, by + cyc * 26, 4, 7);
          // birikinti
          sc._blood.puddle = Math.min(26, sc._blood.puddle + 0.02);
          ctx.beginPath();
          ctx.ellipse(bx, by + 30, sc._blood.puddle, sc._blood.puddle * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      };
      return sc;
  }

  G.SCENES.lord_study.onEnter = async function (sc, S) {
      const lord = sc._lord;
      S.lock(true);
      await S.wait(800);
      await S.say('evelyn', null,
        'Bu koku... çürümüş... ceset kokusu. Oda ceset kokuyor. Ama Lord... orada öylece duruyor. Sanki hiçbir şey yokmuş gibi.', { thought: true });
      await S.lines([
        { who: 'lord', voice: 'lord_001', text: '(arkası dönük, pencereden dışarı bakıyor) Bayan Evelyn. Üç gün. Öncekilerden uzun dayandınız.' }
      ]);
      lord.face('down');
      await S.lines([
        { who: 'evelyn', voice: 'evelyn_023', text: 'L-lordum. Ben... istifa etmek istiyorum. Aileme dönmem gerekiyor, annem hasta ve—' },
        { who: 'lord', voice: 'lord_002', text: '(döner. Yakışıklı. Kusursuz. Gülümsüyor.) Yalan söylerken burnunuz kızarıyor. Anneniz üç yıl önce ölmüş. Başvurunuzda yazıyordu.' }
      ]);
      // Şöminenin altından süzülen İNCE, KOYU KIRMIZI sıvı. Damla. Damla.
      sc._blood.on = true;
      await S.wait(1800);
      await S.lines([
        { who: 'evelyn', voice: 'evelyn_024', text: 'Bakma. Bakma. BAKMA. Belli etme.', thought: true },
        { who: 'lord', voice: 'lord_003', text: '(baktığın yeri fark eder — gülümsemesi genişler) Bir sorun mu var, Bayan Evelyn?' },
        { who: 'evelyn', voice: 'evelyn_025', text: 'H-hayır lordum. Hiçbir sorun yok.' },
        { who: 'lord', voice: 'lord_004', text: 'Güzel. Şu halde anlaşalım: yarın yerinize yeni biri gelene kadar, bugün son kez işlerinizde yardımcı olun. Yarın sabah gidersiniz.' },
        { who: 'evelyn', voice: 'evelyn_026', text: '(rahatlamayla) Teşekkür ederim lordum—' },
        { who: 'narrator', name: ' ', text: '(Ve o an onun gülümsemesini görürsün. O gülümseme... bir ZAFERİN gülümsemesi. Kendi gülümsemen yüzünde solar.)' },
        { who: 'lord', voice: 'lord_005', text: 'Şimdi çekilebilirsin.' }
      ]);
      await S.fadeOut(0.8);
      G.player.place(T(8), T(8.4), 'down');
      await S.fadeIn(0.4);
      await S.say('evelyn', 'evelyn_027',
        'Neden öyle gülümsedi? Neden "yarın gidersin" derken... sanki "yarın" diye bir şey olmayacakmış gibi baktı?', { thought: true });
      await S.fadeOut(0.8);
      G.changeScene('room_final');
  };

  /* ================================================================
     11) SON GECE — "GELİYORLAR" + sahte seçim + kaçış başlangıcı
     ================================================================ */
  G.SCENES.room_final = {
    async build() {
      const sc = await buildMaidRoom({ dark: 0.84 });
      sc._bloodSeep = 0;    // kapı altından sızan kan (Açma seçilirse)
      const base = sc.overDraw;
      sc.overDraw = (ctx, cam) => {
        if (sc._bloodSeep > 0) {
          const px = T(5) - cam.x, py = T(7.7) - cam.y;
          ctx.fillStyle = 'rgba(122,14,14,0.9)';
          ctx.beginPath();
          ctx.ellipse(px + 48, py, sc._bloodSeep * 3, sc._bloodSeep, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      };
      return sc;
    },
    async onEnter(sc, S) {
      G.setObjective(null);
      S.lock(true);
      await S.say('narrator', null, '— SON GECE — Son eşyalarını topluyorsun. Yatağa uzanmak üzeresin...', { name: ' ' });
      await S.wait(900);
      for (let i = 0; i < 4; i++) { G.audio.knockSfx(); await S.wait(280); }   // TIK TIK TIK — aceleci
      await S.lines([
        { who: 'aldric', voice: 'aldric_004', text: '(kapının ardından) Hey! Hemen kapıyı aç ve benimle gel. HEMEN. Geliyorlar. Hızlı ol!' },
        { who: 'evelyn', voice: 'evelyn_028', text: 'Sen... sen gerçek değilsin! Bana öldüğünü söylediler! Yirmi yıl önce—' },
        { who: 'aldric', voice: 'aldric_005', text: 'Öldüm. ...Ve bu gece sen de öleceksin — eğer o kapıyı AÇMAZSAN. Seç: ölü bir adama güven, ya da canlı olanlara kal.' }
      ]);
      // SAHTE SEÇİM
      const i = await S.choice(['Kapıyı aç', 'Açma']);
      if (i === 1) {
        // Koridordan GERÇEK sesler... sürüklenen bir şey, tırnak sesleri, kan.
        G.audio.sfx('chains_rattling', { volume: 0.9 });
        await S.wait(1300);
        G.audio.sfx('door_creak_alt', { volume: 1, rate: 0.7 });
        const hb = G.audio.loopSfx('heartbeat_fast_loop', 0.6);
        sc.loops.push(hb);
        G.fx.shake(0.5, 5);
        for (let k = 1; k <= 10; k++) { sc._bloodSeep = k; await S.wait(160); }
        await S.say('evelyn', null, 'Kapının altından... kan sızıyor. Başka seçenek yok.', { thought: true });
        await S.choice(['Kapıyı aç']);
        hb.stop();
      }
      G.audio.sfx('door_creak', { volume: 1 });
      await S.fadeOut(0.5);
      G.changeScene('chase');
    }
  };

  /* ================================================================
     12) KAÇIŞ SEKANSI — koridor koşusu + LIAM JUMPSCARE + kan izleri
     ================================================================ */
  G.SCENES.chase = {
    async build() {
      const map = await buildCorridor();
      const aldric = new G.NPC('aldric', T(47), T(13.4), { speed: 210 });
      const liam = new G.NPC('liam', T(24), T(13.5), { visible: false });
      const basementDoor = doorDecor(T(1.2), T(11.2), { open: false });
      const sc = {
        map, spawn: { x: T(49), y: T(13.2), dir: 'left' },
        npcs: [aldric, liam], _aldric: aldric, _liam: liam, _door: basementDoor,
        decors: [basementDoor],
        dark: 0.86, candle: true, candleR: 200,
        music: 'music_tension_chase',
        musicVol: 0.14,                     // DUCK: müzik kısılır, kalp atışı baskın
        vignette: { color: 'rgba(90,10,10,0.5)' },
        loops: [G.audio.loopSfx('heartbeat_fast_loop', 0.95)],
        _bloodFront: T(53),     // arkadan süzülerek gelen kan derelerinin ucu
        _bloodOn: false,
        triggers: [], hotspots: []
      };
      // Kan izleri: zeminde, sağdan (arkadan) sola doğru İZ SÜRÜYOR
      sc.update = dt => {
        if (!sc._bloodOn) return;
        const target = G.player.x + 320;
        sc._bloodFront = Math.max(target, sc._bloodFront - 240 * dt);
      };
      sc.underDraw = (ctx, cam, now) => {
        if (!sc._bloodOn) return;
        const x0 = Math.max(sc._bloodFront, cam.x - 40);
        const x1 = cam.x + 1040;
        if (x0 >= x1) return;
        ctx.fillStyle = 'rgba(122,14,14,0.75)';
        for (let x = x0; x < x1; x += 34) {
          const wob = Math.sin(x * 0.11 + now / 160) * 8;
          ctx.fillRect(x - cam.x, T(13.3) + wob - cam.y, 30, 7);
          ctx.fillRect(x - cam.x + 10, T(13.9) - wob - cam.y, 22, 5);
        }
      };
      // JUMPSCARE #2: Liam aniden belirir
      sc.triggers.push({
        x: T(26), y: T(12), w: T(3), h: T(4),
        action: async () => {
          const S = G.S;
          S.lock(true);
          // Kaçışta ani Liam belirmesi — tam ekran görsel + whisper
          await G.jumpscare.trigger({
            who: 'liam', image: 'liam_jumpscare',
            sting: 'jumpscare_whisper_03', blackTime: 0.6
          });
          sc._liam.visible = true;
          sc._liam.place(T(23.5), T(13.5), 'right');
          await G.fx.fadeTo(0, 0.3);
          await S.lines([
            { who: 'liam', voice: 'liam_001', text: '(Aldric\'e) Geliyorlar. Hemen şu taraftan.' },
            { who: 'evelyn', voice: 'evelyn_029', text: 'Kim geliyor?! Ne geliyor?!' },
            { who: 'narrator', name: ' ', text: '(Arkana bakıyorsun — koridorun zemininde, SANA DOĞRU süzülerek ilerleyen kan dereleri. Kan... iz sürüyor.)' }
          ]);
          sc._bloodOn = true;
          sc._liam.walkTo(T(3), T(13.5), 260);
          S.lock(false);
          G.setObjective('KOŞ! Bodrum kapısına!');
        }
      });
      // Bodrum kapısı — final bölümüne geçiş
      sc.hotspots.push({
        x: T(1.2), y: T(11.2), w: 90, h: 130, label: 'Merdivenli kapı',
        action: async () => {
          const S = G.S;
          S.lock(true);
          sc._aldric.walkTo(T(2.5), T(12.6), 220);
          await S.lines([
            { who: 'evelyn', voice: 'evelyn_030', text: 'HAYIR. Orası— beni oradan bir şey aşağı çekmeye çalıştı!' },
            { who: 'aldric', voice: 'aldric_006', text: 'Seni aşağı çeken şey... sana zarar vermeye çalışmıyordu, Evelyn. Seni SAKLAMAYA çalışıyordu. Aşağısı bu evde onların ulaşamadığı tek yer.' },
            { who: 'liam', voice: 'liam_002', text: '(ilk kez seninle konuşur, sesi kırık) ...Annem aşağıda. Annem seni korudu. Senden önceki üç kızı da korumaya çalıştı. ...Yetişemedi.' }
          ]);
          G.audio.sfx('door_creak', { volume: 1 });
          await S.fadeOut(0.7);
          G.changeScene('basement');
        }
      });
      return sc;
    },
    async onEnter(sc, S) {
      G.setObjective('Aldric\'i izle — KOŞ!');
      sc._aldric.walkTo(T(28), T(13.5), 200).then(() => {
        if (G.token === S.token) sc._aldric.walkTo(T(4), T(13.2), 200);
      });
      await S.say('narrator', null,
        '(Koridorlar artık FARKLI. Duvarlar nefes alıyor gibi. Portrelerdeki yüzler... BOŞ. Arkandan gelen sesler ritmik değil — SÜRÜNEREK geliyorlar.)', { name: ' ' });
    }
  };

  /* ================================================================
     13) BODRUM — malikanenin midesi (bahce_avlu karanlık versiyon)
     ================================================================ */
  G.SCENES.basement = {
    async build() {
      // Gate (tünel kapısı) inişi için ek açık koridor
      const map = await buildCourtyard(null, [{ x: T(69), y: T(4), w: T(8), h: T(5) }], 'basement');
      const aldric = new G.NPC('aldric', T(6), T(4));
      const liam = new G.NPC('liam', T(5), T(3));
      const marla = new G.NPC('marla', T(42), T(2.2), { visible: false, alpha: 0 });
      const katheryne = new G.NPC('katheryne', T(78), T(3), { visible: false });
      const sc = {
        map, spawn: { x: T(4), y: T(3.5), dir: 'right' },
        npcs: [aldric, liam, marla, katheryne],
        _aldric: aldric, _liam: liam, _marla: marla, _kath: katheryne,
        decors: [],
        dark: 0.94, candle: true, candleR: 175,
        music: null,
        loops: [G.audio.loopSfx('chains_rattling', 0.4), G.audio.loopSfx('ambience_wind_howling', 0.2)],
        triggers: [], hotspots: []
      };
      // Duvar boyunca KEFENLİ BEDENLER — her birinin üzerinde katlı önlük
      for (let i = 0; i < 12; i++) sc.decors.push(shroudDecor(T(14) + i * 130, T(1.1) + (i % 2) * 10));
      // Kefenlere yaklaşınca — gerçek
      sc.triggers.push({
        x: T(13), y: T(0.8), w: T(20), h: T(4),
        action: async () => {
          const S = G.S;
          S.lock(true);
          await S.lines([
            { who: 'evelyn', voice: 'evelyn_031', text: 'Bunlar... bunların hepsi...' },
            { who: 'aldric', voice: 'aldric_007', text: 'Malikanenin hizmetçileri. Hepsi. Bu ev hizmetçilerini asla kovmaz, Evelyn. ONLARI SAKLAR. Lord Callisto iki yüz yıldır ölü. O koku — odasındaki koku — kendi kokusu. Bu evdeki "canlılar"... Theodore, Katheryne, Bruno... hepsi onun gibi. Çok uzun süre kaldılar. Ev onları SİNDİRDİ. Şimdi ev acıktıkça, yeni hizmetçi alıyorlar.' },
            { who: 'evelyn', voice: 'evelyn_032', text: 'Peki sen? Sen ve Liam ve... annesi?' },
            { who: 'aldric', voice: 'aldric_008', text: '(miğferini ilk kez çıkarır — yüzünün yarısı yok) Biz sindirilemeyecek kadar inatçı olanlarız. Ben bir hizmetçiyi kaçırmaya çalışırken merdivenden "düştüm". Liam\'ın annesi Marla, oğlunu kaçırmaya çalışırken yakalandı. Liam... Liam buradan hiç çıkamadı zaten.' }
          ]);
          // MARLA belirir — kanlı elleriyle tanıdığımız kadın
          sc._marla.visible = true;
          const fadeIn = setInterval(() => {
            sc._marla.alpha = Math.min(1, sc._marla.alpha + 0.07);
            if (sc._marla.alpha >= 1) clearInterval(fadeIn);
          }, 80);
          sc._liam.walkTo(T(41), T(2.6), 240);
          await S.wait(1400);
          await S.lines([
            { who: 'marla', voice: 'marla_001', text: '(fısıltı) Notumu okudun... ama gitmedin. Şimdi tek bir çıkış kaldı. Evin unuttuğu kapı. Eski hizmetçi tüneli — buradan, mahzenin sonundan, duvarın ardından geçer. Ama ev seni bırakmayacak. Ev, kapıyı açtığın an ANLAYACAK.' }
          ]);
          S.lock(false);
          G.setObjective('Mahzenin sonundaki tünel kapısına ulaş');
        }
      });
      // Tünel kapısı — evin uyanışı + KATHERYNE JUMPSCARE
      // (bölge geniş tutuldu: oyuncu kapının altına/önüne geçse de E çalışsın)
      sc.hotspots.push({
        x: T(72.5), y: T(6.5), w: T(3.5), h: T(6), label: 'Eski tünel kapısı',
        action: () => G.SCENES.basement._tunnelDoor(sc)
      });
      return sc;
    },
    async _tunnelDoor(sc) {
      const S = G.S;
      if (sc._doorDone) return;
      sc._doorDone = true;
      S.lock(true);
      G.audio.sfx('door_creak', { volume: 1 });
      await S.wait(600);
      // EV UYANIYOR: yüzlerce ayak sesi, sönen mumlar
      G.fx.shake(1.2, 8);
      G.audio.sfx('footsteps_stone', { volume: 1, rate: 1.6 });
      G.audio.sfx('chains_rattling', { volume: 1 });
      sc.candleR = 120; sc.dark = 0.97;
      await S.wait(1400);

      // ============ JUMPSCARE #3: KATHERYNE'İN YÜZÜ (BÜYÜK) ============
      // Tam ekran görsel: sürünen Katheryne + sting + voice
      await G.jumpscare.trigger({ who: 'katheryne', image: 'katheryne_jumpscare', sting: 'jumpscare_sting', voice: 'katheryne_008' });
      await G.fx.fadeTo(0, 0.3);
      sc._kath.visible = true;
      sc._kath.place(T(76.5), T(6.5), 'left');
      G.player.place(T(72), T(6.8), 'right');
      await S.lines([
        { who: 'katheryne', voice: 'katheryne_009', text: 'Ben sana söylemiştim... buradaki en uzun dayanan hizmetçi benim. YÜZ KIRK YILDIR. Dayanmak istemedim. Ama ev... ev bırakmıyor, kızım. Ev asla bırakmıyor.' }
      ]);
      // Marla ve Aldric araya girer
      sc._marla.place(T(74), T(6.2), 'right');
      sc._aldric.walkTo(T(74.5), T(7.4), 300);
      await S.wait(700);
      await S.lines([
        { who: 'aldric', voice: 'aldric_009', text: 'KOŞ, EVELYN! Tünelin sonuna kadar SAKIN arkana bakma! Ne duyarsan duy — NE DUYARSAN DUY — ARKANA BAKMA!' }
      ]);
      await S.fadeOut(0.5);
      G.changeScene('tunnel');
    },
    async onEnter(sc, S) {
      G.setObjective('Mahzeni geç — duvar boyunca ilerle');
      sc._aldric.walkTo(T(12), T(3.5), 170);
      sc._liam.walkTo(T(11), T(2.8), 170);
      await S.say('narrator', null,
        '(Merdivenlerden indiniz. Duvarlarda tırnak izleri — yukarı çıkmaya çalışan izler değil; aşağı İNMEYE çalışırken sürüklenen izler.)', { name: ' ' });
    }
  };

  /* ================================================================
     14) TÜNEL — "ARKANA BAKMA" mekaniği
     S'ye basmak veya geri (sola) dönmek = GAME OVER
     ================================================================ */
  G.SCENES.tunnel = {
    async build() {
      const map = await sceneMap('tunnel', () => {
        const def = G.maps.buildRoom(46, 5, (x, y) => {
          if (y === 0 || y === 4) return ((x + y) % 2 === 0) ? 43 : 44;
          if (y === 1) return 174;
          return 194;
        });
        return new G.maps.GameMap(def);
      });
      const sc = {
        map,
        spawn: map.bgSpawn || { x: map.pxW * 0.045, y: map.pxH * 0.52, dir: 'right' },
        dark: 0.95, candle: true, candleR: 130,
        music: 'music_tension_chase',
        musicVol: 0.14,                     // DUCK: kalp atışı baskın ses
        loops: [G.audio.loopSfx('heartbeat_fast_loop', 0.95), G.audio.loopSfx('footsteps_stone', 0.15)],
        _armed: false, _motherPlayed: false, _failed: false, _maxX: 0,
        triggers: []
      };
      // Işık: tünel sonunda büyüyen çıkış aydınlığı
      sc.overDraw = (ctx, cam) => {
        const exitX = map.pxW * 0.968 - cam.x;
        if (exitX < 1100) {
          const g = ctx.createRadialGradient(exitX, 270, 20, exitX, 270, 420);
          g.addColorStop(0, 'rgba(255,240,200,0.85)');
          g.addColorStop(1, 'rgba(255,240,200,0)');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, 960, 540);
        }
      };
      // ARKAYA BAKMA kontrolü
      sc.update = () => {
        if (!sc._armed || sc._failed) return;
        sc._maxX = Math.max(sc._maxX, G.player.x);
        const back = G.input.down.has('KeyS') || G.input.down.has('ArrowDown') ||
                     G.input.down.has('KeyA') || G.input.down.has('ArrowLeft') ||
                     G.player.x < sc._maxX - 30;
        if (back && !G.cutsceneLock && !G.dlg.active) {
          sc._failed = true;
          G.SCENES.tunnel._lookBack();
        }
      };
      // Trigger konumları harita genişliğine ORANLI — oda görseliyle de çalışır
      sc.triggers.push({
        x: map.pxW * 0.35, y: 0, w: map.pxW * 0.045, h: map.pxH,
        action: async () => {
          const S = G.S;
          sc._motherPlayed = true;
          G.audio.voice('mother_voice_001');
          G.toast('"Evelyn? Kızım? Arkana dön, benim, annen..."', 3200);
          await S.wait(3200);
          G.toast('ARKANA BAKMA.', 2000);
        }
      });
      sc.triggers.push({
        x: map.pxW * 0.94, y: 0, w: map.pxW * 0.06, h: map.pxH,
        action: async () => {
          const S = G.S;
          sc._armed = false;
          S.lock(true);
          await G.fx.fadeTo(1, 0.4);
          G.changeScene('escape');
        }
      });
      return sc;
    },
    async _lookBack() {
      // Psikolojik jumpscare: dönmek = son.
      const S = G.S;
      try {
        S.lock(true);
        G.audio.sfx('jumpscare_sting', { volume: 1 });
        G.fx.shake(0.5, 16);
        await G.fx.fadeTo(1, 0.5);
        G.gameOver('Arkana baktın. Annenin sesi... o değildi.');
      } catch (e) { /* iptal */ }
    },
    async onEnter(sc, S) {
      G.setObjective('KOŞ — sağa! ARKANA BAKMA!');
      await S.wait(400);
      // Arkadan: Katheryne'in çığlığı, Aldric'in savaş narası...
      G.audio.sfx('jumpscare_whisper_02', { volume: 0.8 });
      sc._armed = true;
    }
  };

  /* ================================================================
     15) DIŞARI ÇIKIŞ — şafak (kısa aydınlık nefes)
     ================================================================ */
  G.SCENES.escape = {
    checkpoint: false,
    async build() {
      const map = await buildCourtyard(null, [{ x: T(69), y: T(4), w: T(8), h: T(5) }]);
      return {
        map, spawn: { x: T(70), y: T(3.5), dir: 'right' },
        dark: 0, candle: false,
        music: null,
        vignette: { color: 'rgba(255,190,110,0.35)' },     // şafak sıcaklığı
        loops: [G.audio.loopSfx('ambience_wind_howling', 0.18)]
      };
    },
    async onEnter(sc, S) {
      S.lock(true);
      await S.say('narrator', null,
        '(Tünelin sonunda IŞIK. Kendini dışarı atıyorsun — şafak vakti, malikanenin arka duvarının dışında, çimlerin üzerinde. Nefes nefese. HAYATTA.)', { name: ' ' });
      S.lock(false);
      G.setObjective('Arkanda — malikane, sabah sisinin içinde, sessiz.');
      await S.wait(5000);
      S.lock(true);
      await G.fx.fadeTo(1, 2.0);
      G.changeScene('epilogue');
    }
  };

  /* ================================================================
     16) EPİLOG — "Sorular Sorulmayacak" (metin akışı) + twist
     ================================================================ */
  G.SCENES.epilogue = {
    checkpoint: false,
    build() {
      const def = G.maps.simpleRoom(4, 4, { floorDark: true, doorBottom: false });
      return { map: new G.maps.GameMap(def), spawn: { x: T(2), y: T(2) }, hidePlayer: true, dark: 0, music: null };
    },
    async onEnter(sc, S) {
      await G.scroll.show([
        { text: 'Birkaç gün sonra. Bir kasaba hanı.' },
        { text: '"Kimseye anlatamadım. Kim inanır ki? Ama bittiği sürece... önemli değil. Bitti. Artık bitti."' },
        { text: 'Gazeteyi çeviriyorsun. Bir ilan gözüne ilişiyor:' },
        { text: 'İLAN — "Kuzey Dükü\'nün malikanesine hizmetçi aranıyor. Kalacak yer ve yemek dahil. Sorular sorulmayacak."', cls: 'ilan' },
        { text: '"...Yeni birini arıyorlar. Zavallı kız her kimse—"' },
        { text: 'Ve o anda gözün ilanın altındaki tarihe takılıyor.', clear: true },
        { text: 'Gazete... KIRK YIL ÖNCESİNİN gazetesi. Sararmış. Eski.', cls: 'kirmizi' },
        { text: 'Masaya bakıyorsun — az önce temiz olan ellerin... kirli. Tırnakların... toprak dolu.' },
        { text: 'Han... han birden sessiz. Kimse yok. Pencereden dışarı bakıyorsun —' },
        { text: 'Kasaba yok. Sadece sis. Ve sisin içinde, uzakta... malikanenin silüeti.', cls: 'kirmizi' },
        { text: '"Bayan Evelyn. Tam vaktinde. Lord Callisto dakikliğe önem verir."', voice: 'theodore_006', cls: 'kirmizi', clear: true },
        { text: 'Donakalıyorsun. Yavaşça aşağı, kendi kıyafetlerine bakıyorsun —' },
        { text: 'Üzerinde hizmetçi üniforması var.', cls: 'kirmizi' }
      ]);
      S.chk();
      G.changeScene('finale');
    }
  };

  /* ================================================================
     17) FİNAL JUMPSCARE + KAPANIŞ — tek mum alevi, koro fısıltısı
     ================================================================ */
  G.SCENES.finale = {
    checkpoint: false,
    build() {
      const def = G.maps.simpleRoom(4, 4, { floorDark: true, doorBottom: false });
      const sc = {
        map: new G.maps.GameMap(def), spawn: { x: T(2), y: T(2) },
        hidePlayer: true, dark: 0, music: null, _t: 0, _phase: 0
      };
      sc.update = dt => { sc._t += dt; };
      sc.overDraw = (ctx, cam, now) => {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 960, 540);
        if (sc._phase >= 1) {
          // Tek mum alevi — kodla çizilen küçük animasyonlu sprite
          const fx0 = 480, fy = 300;
          const f = Math.sin(now / 80) * 3 + Math.sin(now / 210) * 2;
          ctx.fillStyle = '#d8c8b8';
          ctx.fillRect(fx0 - 5, fy, 10, 26);                     // mum gövdesi
          const g = ctx.createRadialGradient(fx0, fy - 12, 2, fx0, fy - 12, 90 + f * 4);
          g.addColorStop(0, 'rgba(255,190,90,0.35)');
          g.addColorStop(1, 'rgba(255,190,90,0)');
          ctx.fillStyle = g;
          ctx.fillRect(fx0 - 120, fy - 130, 240, 240);           // ışık halesi
          ctx.fillStyle = '#f4b942';
          ctx.beginPath();
          ctx.ellipse(fx0 + f * 0.5, fy - 14, 5, 11 + f * 0.6, f * 0.02, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff3c4';
          ctx.beginPath();
          ctx.ellipse(fx0 + f * 0.3, fy - 11, 2.4, 5.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        if (sc._phase >= 2) {
          ctx.font = '26px Alagard, monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(160,48,48,' + Math.min(1, (sc._t - sc._p2t) / 1.5) + ')';
          ctx.fillText('"Ev asla bırakmaz."', 480, 400);
        }
        if (sc._phase >= 3) {
          const a = Math.min(1, (sc._t - sc._p3t) / 1.5);
          ctx.fillStyle = 'rgba(216,200,184,' + a + ')';
          ctx.font = '44px Alagard, monospace';
          ctx.fillText('CALLISTO MALİKANESİ', 480, 160);
          ctx.font = '24px Alagard, monospace';
          ctx.fillText('SON HİZMETÇİ', 480, 200);
          ctx.font = '15px M6x11, monospace';
          ctx.fillStyle = 'rgba(164,98,61,' + a + ')';
          ctx.fillText('"Bu malikane hizmetçilerini asla kovmaz... Onları saklar."', 480, 240);
        }
      };
      return sc;
    },
    async onEnter(sc, S) {
      await S.wait(1200);
      // Koro fısıltısı: whispers_final (varsa) + üç whisper sfx üst üste
      G.audio.voice('whispers_final');
      G.audio.sfx('jumpscare_whisper_01', { volume: 0.9 });
      G.audio.sfx('jumpscare_whisper_02', { volume: 0.9 });
      G.audio.sfx('jumpscare_whisper_03', { volume: 0.9 });
      G.fx.shake(0.4, 6);
      await S.wait(900);
      sc._phase = 1;                       // tek mum alevi yanar
      await S.wait(1600);
      sc._phase = 2; sc._p2t = sc._t;      // "Ev asla bırakmaz."
      await S.wait(2600);
      sc._phase = 3; sc._p3t = sc._t;      // başlık kartı
      await S.wait(5000);
      await S.fadeOut(1.2);
      G.showCredits();                     // credits_screen.png -> ana menü
    }
  };
})();
