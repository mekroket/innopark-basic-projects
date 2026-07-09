/* ============================================================
   main.js — Oyun döngüsü + sahne yöneticisi + efektler + girdi
   Boot sırası: asset preload -> ana menü.
   Sahneler scenes.js'te tanımlıdır; burada çalıştırılır.
   Konsol: game.debug.goto('scene_id'), game.debug.list(),
           game.debug.collision = true
   ============================================================ */
(function () {
  'use strict';
  window.G = window.G || {};

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  /* =================== KARAKTER KAYDI =================== */
  // guard: ayrı sprite'ı yok — zırhlı olduğu için aldric görselleri kullanılır.
  const CHAR_DEFS = {
    evelyn:    { name: 'Evelyn',        file: 'evelyn' },
    theodore:  { name: 'Theodore',      file: 'theodore' },
    katheryne: { name: 'Katheryne',     file: 'katheryne' },
    lord:      { name: 'Lord Callisto', file: 'lord_callisto' },
    bruno:     { name: 'Bruno',         file: 'bruno' },
    aldric:    { name: 'Aldric',        file: 'aldric' },
    marla:     { name: 'Marla',         file: 'marla' },
    liam:      { name: 'Liam',          file: 'liam' },
    guard:     { name: 'Muhafız',       file: 'aldric' },
    narrator:  { name: '', file: null }
  };
  G.CHARS = {};
  for (const k in CHAR_DEFS) {
    const d = CHAR_DEFS[k];
    G.CHARS[k] = {
      name: d.name,
      sheet: d.file ? 'assets/characters/' + d.file + '.png' : null,
      portrait: d.file ? 'assets/characters/portraits/' + d.file + '.png' : null,
      sheetImg: null, portraitImg: null
    };
  }

  /* =================== ASSET PRELOAD =================== */
  G.tilesImg = null;
  G.decorImg = {};
  G.uiImages = {};

  function loadImage(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => { console.warn('[img] yok: ' + src); resolve(img); }; // kırma
      img.src = src;
    });
  }

  async function preload() {
    const jobs = [];
    jobs.push(loadImage('assets/maps/tiles.png').then(i => G.tilesImg = i));
    jobs.push(loadImage('assets/maps/castle.png').then(i => G.decorImg.castle = i));
    jobs.push(loadImage('assets/maps/stairs.png').then(i => G.decorImg.stairs = i));
    for (const k in G.CHARS) {
      const c = G.CHARS[k];
      if (c.sheet)    jobs.push(loadImage(c.sheet).then(i => c.sheetImg = i));
      if (c.portrait) jobs.push(loadImage(c.portrait).then(i => c.portraitImg = i));
    }
    for (const s of ['main_menu', 'game_over', 'pause_menu', 'loading_screen', 'credits_screen', 'controls_screen'])
      jobs.push(loadImage('assets/ui/' + s + '.png').then(i => G.uiImages[s] = i));
    await Promise.all(jobs);
  }

  /* =================== GİRDİ =================== */
  const input = { down: new Set(), pressedE: false };
  G.input = input;

  window.addEventListener('keydown', e => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    input.down.add(e.code);

    // Intro fragman: ESC = atla; diğer tuşlar oyuna geçmez
    if (G.intro && G.intro.active) {
      if (e.code === 'Escape') G.intro.skip();
      return;
    }

    // UI ekranları (anyKey)
    if (G.ui.key()) return;

    // Overlay öncelik sırası
    if (e.code === 'Space') {
      if (G.scroll.active)      { G.scroll.advance(); return; }
      if (G.note.active)        { G.note.close(); return; }
      if (G.choiceBox.active)   { G.choiceBox.key('Space'); return; }
      if (G.qte.active)         { G.qte.press(); return; }
      if (G.dlg.active)         { G.dlg.advance(); return; }
    }
    if (G.choiceBox.active) { G.choiceBox.key(e.code); return; }
    if (e.code === 'KeyE') input.pressedE = true;
    if (e.code === 'Escape') {
      if (G.jumpscare.active || G.qte.active) return;
      if (G.ui.screen === 'pause') { G.ui.close(); return; }
      if (!G.ui.screen && G.state === 'play') { G.ui.open('pause'); return; }
    }
  });
  window.addEventListener('keyup', e => input.down.delete(e.code));

  function canvasXY(e) {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) * (960 / r.width), (e.clientY - r.top) * (540 / r.height)];
  }
  canvas.addEventListener('mousemove', e => {
    const [mx, my] = canvasXY(e);
    G.ui.mousemove(mx, my);
    canvas.style.cursor = (G.ui.screen && G.ui._hover >= 0) ? 'pointer' : 'default';
  });
  canvas.addEventListener('mousedown', e => {
    const [mx, my] = canvasXY(e);
    if (G.ui.screen) { G.ui.click(mx, my); return; }
    if (G.dlg.active) G.dlg.advance();
  });

  /* =================== EFEKTLER (fade / shake / flash) =================== */
  const fx = {
    fadeAlpha: 1,           // 1 = simsiyah (boot siyah başlar)
    _fadeTarget: 1, _fadeSpeed: 0,
    shakeT: 0, shakeMag: 0,
    flashT: 0,

    fadeTo(target, dur) {
      this._fadeTarget = target;
      this._fadeSpeed = dur > 0 ? Math.abs(target - this.fadeAlpha) / dur : 1000;
      return new Promise(res => {
        const chk = () => {
          if (Math.abs(this.fadeAlpha - this._fadeTarget) < 0.01) res();
          else requestAnimationFrame(chk);
        };
        chk();
      });
    },
    shake(t, mag) { this.shakeT = Math.max(this.shakeT, t); this.shakeMag = mag; },
    flash(t) { this.flashT = t; },

    update(dt) {
      if (this.fadeAlpha !== this._fadeTarget) {
        const d = Math.sign(this._fadeTarget - this.fadeAlpha) * this._fadeSpeed * dt;
        this.fadeAlpha += d;
        if ((d > 0 && this.fadeAlpha > this._fadeTarget) || (d < 0 && this.fadeAlpha < this._fadeTarget))
          this.fadeAlpha = this._fadeTarget;
      }
      if (this.shakeT > 0) this.shakeT -= dt;
      if (this.flashT > 0) this.flashT -= dt;
    }
  };
  G.fx = fx;

  /* Karanlık maskesi için offscreen canvas */
  const darkCv = document.createElement('canvas');
  darkCv.width = 960; darkCv.height = 540;
  const darkCtx = darkCv.getContext('2d');

  /* =================== OYUN DURUMU =================== */
  G.state = 'boot';        // boot | menu | play
  G.scene = null;          // aktif sahne (runtime nesnesi)
  G.player = null;
  G.camera = { x: 0, y: 0 };
  G.checkpoint = null;     // {id, spawn}
  G.token = 0;             // sahne değişince artar -> eski scriptler iptal
  G.flags = {};            // hikaye bayrakları

  /* =================== SCRIPT YARDIMCISI ===================
     Cutscene'ler async akar; sahne değişir/menü açılırsa token uyuşmaz
     ve script sessizce durur (CANCEL fırlatılır, changeScene yutar). */
  const CANCEL = { cancelled: true };
  class Script {
    constructor() { this.token = G.token; }
    chk() { if (G.token !== this.token) throw CANCEL; }
    wait(ms) {
      return new Promise((res, rej) => setTimeout(() => {
        if (G.token !== this.token) rej(CANCEL); else res();
      }, ms));
    }
    async say(who, voice, text, opts) { this.chk(); await G.say(who, voice, text, opts); this.chk(); }
    async lines(arr) { this.chk(); await G.dlg.show(arr); this.chk(); }
    async fadeOut(sec) { await fx.fadeTo(1, sec || 0.5); this.chk(); }
    async fadeIn(sec)  { await fx.fadeTo(0, sec || 0.5); this.chk(); }
    async walk(npc, x, y, speed) { this.chk(); await npc.walkTo(x, y, speed); this.chk(); }
    async playerTo(x, y, speed) {           // scriptli oyuncu yürüyüşü
      this.chk();
      // Kilidi kendimiz açtıysak geri bırak — böylece cutscene bitince
      // input her koşulda geri gelir (kalıcı lock bug'ına karşı güvence)
      const prevLock = G.cutsceneLock;
      G.cutsceneLock = true;
      try {
        await new Promise((res, rej) => {
          const step = (last) => {
            if (G.token !== this.token) { rej(CANCEL); return; }
            const now = performance.now();
            const dt = Math.min(0.05, (now - last) / 1000);
            if (G.player.stepToward(x, y, dt, speed)) res();
            else requestAnimationFrame(() => step(now));
          };
          requestAnimationFrame(() => step(performance.now()));
        });
      } finally {
        if (G.token === this.token) G.cutsceneLock = prevLock;
      }
      this.chk();
    }
    async choice(labels) { this.chk(); const i = await G.choice(labels); this.chk(); return i; }
    lock(v) { G.cutsceneLock = v; }
  }
  G.Script = Script;

  /* =================== SAHNE YÖNETİCİSİ =================== */
  G.changeScene = async function (id, spawn) {
    const def = G.SCENES[id];
    if (!def) { console.warn('Sahne yok: ' + id); return; }
    G.token++;                                  // eski scriptleri iptal et
    const S = new Script();

    // Eski sahnenin loop seslerini durdur
    if (G.scene && G.scene.loops) G.scene.loops.forEach(h => h.stop());
    if (G.player) G.player.stopFootsteps();
    G.audio.stopVoice();
    G.dlg.close && G.dlg.active && G.dlg.close();
    G.setObjective(null);
    G.cutsceneLock = false;

    await fx.fadeTo(1, 0.5);

    let sc;
    try {
      sc = await def.build(S);
    } catch (e) {
      if (e && e.cancelled) return;
      console.error('Sahne kurulamadı: ' + id, e);
      return;
    }
    if (G.token !== S.token) return;            // bu arada başka sahneye geçildi

    sc.id = id;
    sc.loops = sc.loops || [];
    sc.npcs = sc.npcs || [];
    sc.hotspots = sc.hotspots || [];
    sc.triggers = sc.triggers || [];
    sc.decors = sc.decors || [];
    sc.dark = sc.dark || 0;
    sc.lights = sc.lights || [];
    G.scene = sc;
    G.S = S;

    // Oyuncu spawn
    const sp = spawn || sc.spawn || { x: 100, y: 100, dir: 'down' };
    G.player.place(sp.x, sp.y, sp.dir);
    updateCamera(true);

    // Checkpoint: her sahne başı (game over sonrası buraya dönülür)
    if (def.checkpoint !== false) G.checkpoint = { id, spawn: sp };

    // Müzik (sc.musicVol: kaçış sahnelerinde müzik kısılır — duck)
    if (sc.music !== undefined) G.audio.music(sc.music, sc.musicVol);

    G.state = 'play';
    await fx.fadeTo(0, 0.5);

    // Sahne hikaye scripti (arka planda akar; sahne değişirse sessizce iptal)
    if (def.onEnter) {
      def.onEnter(sc, S).catch(e => { if (!e || !e.cancelled) console.error(e); });
    }
  };

  /* =================== AKIŞ KONTROLÜ =================== */
  G.startGame = function () {
    // OYNA -> kontroller ekranı -> prolog
    G.flags = {};
    G.audio.stopMusic();
    G.ui.open('controls', { onDone: () => { G.changeScene('prologue'); } });
  };

  G.toMainMenu = function () {
    G.token++;
    if (G.scene && G.scene.loops) G.scene.loops.forEach(h => h.stop());
    if (G.player) G.player.stopFootsteps();
    G.audio.stopVoice();
    G.scene = null;
    G.state = 'menu';
    G.dlg.active && G.dlg.close();
    G.setObjective(null);
    G.ui.open('menu');
  };

  G.gameOver = function (msg) {
    G.token++;                                   // scriptleri kes
    if (G.scene && G.scene.loops) G.scene.loops.forEach(h => h.stop());
    if (G.player) G.player.stopFootsteps();
    G.audio.stopVoice();
    G.audio.stopMusic();
    G.dlg.active && G.dlg.close();
    G.setObjective(null);
    G.cutsceneLock = false;
    if (msg) G.toast(msg, 3500);
    G.ui.open('gameover');
  };

  G.retryCheckpoint = function () {
    if (G.checkpoint) G.changeScene(G.checkpoint.id, G.checkpoint.spawn);
    else G.toMainMenu();
  };

  G.showCredits = function () {
    G.token++;
    if (G.scene && G.scene.loops) G.scene.loops.forEach(h => h.stop());
    G.scene = null;
    G.audio.music('music_title_theme');
    G.ui.open('credits');
  };

  /* =================== KAMERA =================== */
  function updateCamera(snap) {
    const sc = G.scene;
    if (!sc) return;
    const m = sc.map;
    let tx = G.player.x - 480;
    let ty = G.player.y - 300;                   // ayaklar merkezden biraz aşağıda
    if (m.pxW <= 960) tx = -(960 - m.pxW) / 2;
    else tx = Math.max(0, Math.min(m.pxW - 960, tx));
    if (m.pxH <= 540) ty = -(540 - m.pxH) / 2;
    else ty = Math.max(0, Math.min(m.pxH - 540, ty));
    if (snap) { G.camera.x = tx; G.camera.y = ty; }
    else {
      G.camera.x += (tx - G.camera.x) * 0.15;
      G.camera.y += (ty - G.camera.y) * 0.15;
    }
  }

  /* =================== ETKİLEŞİM =================== */
  function nearestHotspot() {
    const sc = G.scene;
    if (!sc) return null;
    const px = G.player.x, py = G.player.y;
    let best = null, bestD = 1e9;
    for (const h of sc.hotspots) {
      if (h.enabled && !h.enabled()) continue;
      const cx = h.x + h.w / 2, cy = h.y + h.h / 2;
      const dx = Math.max(h.x - 26, Math.min(px, h.x + h.w + 26)) - px;
      const dy = Math.max(h.y - 26, Math.min(py, h.y + h.h + 26)) - py;
      if (dx * dx + dy * dy > 1) continue;       // genişletilmiş kutunun içinde mi
      const d = (cx - px) * (cx - px) + (cy - py) * (cy - py);
      if (d < bestD) { bestD = d; best = h; }
    }
    return best;
  }

  function isLocked() {
    return G.cutsceneLock || G.dlg.active || G.choiceBox.active || G.note.active ||
           G.scroll.active || G.qte.active || G.jumpscare.active || fx.fadeAlpha > 0.85;
  }

  /* =================== OYUN DÖNGÜSÜ =================== */
  let lastT = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;

    fx.update(dt);
    G.ui.update(dt);

    if (G.state === 'play' && G.scene && !G.ui.screen) {
      const locked = isLocked();
      G.player.update(dt, input, G.scene.map, locked);
      for (const n of G.scene.npcs) n.update(dt);
      G.jumpscare.update(dt);
      G.qte.update(dt);
      if (G.scene.update) G.scene.update(dt);
      updateCamera(false);

      // Trigger kontrolü
      for (const t of G.scene.triggers) {
        if (t.done) continue;
        if (t.when && !t.when()) continue;
        const px = G.player.x, py = G.player.y;
        if (px >= t.x && px <= t.x + t.w && py >= t.y && py <= t.y + t.h) {
          if (t.once !== false) t.done = true;
          Promise.resolve(t.action()).catch(e => { if (!e || !e.cancelled) console.error(e); });
        }
      }

      // E — etkileşim
      if (input.pressedE && !locked) {
        const h = nearestHotspot();
        if (h) Promise.resolve(h.action()).catch(e => { if (!e || !e.cancelled) console.error(e); });
      }
    }
    input.pressedE = false;

    render(now);
    requestAnimationFrame(loop);
  }

  function render(now) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, 960, 540);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 960, 540);

    const sc = G.scene;
    if (G.state === 'play' && sc) {
      // Sarsıntı
      let ox = 0, oy = 0;
      if (fx.shakeT > 0) {
        ox = (Math.random() - 0.5) * fx.shakeMag;
        oy = (Math.random() - 0.5) * fx.shakeMag;
      }
      ctx.save();
      ctx.translate(Math.round(ox), Math.round(oy));

      const cam = G.camera;
      sc.map.draw(ctx, cam, G.tilesImg);
      if (sc.underDraw) sc.underDraw(ctx, cam, now);

      // Depth sorting: dekorlar + NPC'ler + oyuncu, taban Y'ye göre
      const items = [];
      for (const d of sc.decors) items.push({ y: d.baseline != null ? d.baseline : d.y, draw: () => d.draw(ctx, cam, now) });
      for (const n of sc.npcs) if (n.visible) items.push({ y: n.y, draw: () => n.draw(ctx, cam) });
      if (!sc.hidePlayer) items.push({ y: G.player.y, draw: () => G.player.draw(ctx, cam) });
      items.sort((a, b) => a.y - b.y);
      for (const it of items) it.draw();

      if (sc.overDraw) sc.overDraw(ctx, cam, now);

      // Karanlık + ışıklar
      if (sc.dark > 0) {
        darkCtx.clearRect(0, 0, 960, 540);
        darkCtx.fillStyle = 'rgba(0,0,0,' + sc.dark + ')';
        darkCtx.fillRect(0, 0, 960, 540);
        darkCtx.globalCompositeOperation = 'destination-out';
        const lights = [];
        if (sc.candle) {
          const flick = 1 + 0.06 * Math.sin(now / 90) + 0.04 * Math.sin(now / 37);
          lights.push({ x: G.player.x - cam.x, y: G.player.y - 24 - cam.y, r: (sc.candleR || 150) * flick });
        }
        for (const L of sc.lights) lights.push({ x: L.x - cam.x, y: L.y - cam.y, r: L.r });
        for (const L of lights) {
          const g = darkCtx.createRadialGradient(L.x, L.y, L.r * 0.25, L.x, L.y, L.r);
          g.addColorStop(0, 'rgba(0,0,0,0.95)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          darkCtx.fillStyle = g;
          darkCtx.beginPath();
          darkCtx.arc(L.x, L.y, L.r, 0, Math.PI * 2);
          darkCtx.fill();
        }
        darkCtx.globalCompositeOperation = 'source-over';
        ctx.drawImage(darkCv, 0, 0);
      }

      // Renkli vinyet (Lord'un odası: yeşilimsi koku efekti vb.)
      if (sc.vignette) {
        const v = sc.vignette;
        const g = ctx.createRadialGradient(480, 270, 200, 480, 270, 580);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, v.color);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 960, 540);
      }

      // Debug collision
      if (G.debugObj.collision) sc.map.drawCollision(ctx, cam);

      ctx.restore();

      // Etkileşim ipucu ("E")
      if (!isLocked()) {
        const h = nearestHotspot();
        if (h) {
          const hx = h.x + h.w / 2 - cam.x, hy = h.y - 14 - cam.y + Math.sin(now / 250) * 3;
          ctx.font = '13px M6x11, monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#231822';
          ctx.fillRect(hx - 11, hy - 14, 22, 19);
          ctx.strokeStyle = '#6d5640';
          ctx.strokeRect(hx - 11, hy - 14, 22, 19);
          ctx.fillStyle = '#d8c8b8';
          ctx.fillText('E', hx, hy);
          if (h.label) {
            ctx.fillStyle = 'rgba(35,24,34,0.8)';
            const tw = ctx.measureText(h.label).width + 12;
            ctx.fillRect(hx - tw / 2, hy + 8, tw, 17);
            ctx.fillStyle = '#d8c8b8';
            ctx.fillText(h.label, hx, hy + 20);
          }
        }
      }
    }

    // Flash (beyaz)
    if (fx.flashT > 0) {
      ctx.fillStyle = 'rgba(232,220,208,' + Math.min(1, fx.flashT * 6) + ')';
      ctx.fillRect(0, 0, 960, 540);
    }

    // Fade (siyah)
    if (fx.fadeAlpha > 0) {
      ctx.fillStyle = 'rgba(0,0,0,' + fx.fadeAlpha + ')';
      ctx.fillRect(0, 0, 960, 540);
    }

    // QTE ve jumpscare her şeyin üstünde
    G.qte.draw(ctx);
    G.jumpscare.draw(ctx);

    // UI ekranları en üstte
    G.ui.draw(ctx);
  }

  /* =================== DEBUG =================== */
  G.debugObj = {
    collision: false,
    goto(id) { G.ui.close(); G.changeScene(id); },
    list() { return Object.keys(G.SCENES); },
    flags() { return G.flags; },
    intro() { G.ui.close(); G.intro.show(() => G.ui.open('menu')); }  // fragman ekranını test et
  };
  window.game = { debug: G.debugObj, G };

  /* =================== PENCERE ÖLÇEKLEME =================== */
  function fit() {
    const s = Math.min(window.innerWidth / 960, window.innerHeight / 540);
    document.getElementById('wrap').style.transform =
      'translate(-50%,-50%) scale(' + s + ')';
  }
  window.addEventListener('resize', fit);
  fit();

  /* =================== BOOT =================== */
  (async function boot() {
    // Önce loading ekranı görselini çek, hemen göster
    G.uiImages.loading_screen = await loadImage('assets/ui/loading_screen.png');
    G.ui.open('loading');
    G.state = 'menu';
    fx.fadeAlpha = 0;
    requestAnimationFrame(loop);

    await preload();
    G.player = new G.Player(G.CHARS.evelyn.sheetImg);
    // Önce intro fragman ekranı (video yoksa sessizce direkt ana menü)
    G.ui.close();
    G.intro.start(() => G.ui.open('menu'));
    console.log('%cCALLISTO MALİKANESİ hazır. game.debug.goto(id) — sahneler:',
      'color:#a4623d', Object.keys(G.SCENES).join(', '));
  })();
})();
