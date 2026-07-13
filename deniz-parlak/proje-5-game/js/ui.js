/* ============================================================
   ui.js — Menüler, ara ekranlar, geçişler
   Hazır PNG ekranlar (assets/ui/) canvas'a çizilir; buton bölgeleri
   tıklanabilir dikdörtgenler olarak tanımlıdır (görsellerden ölçüldü,
   960x540 koordinatları). Hover'da hafif parlaklık overlay'i.
   ============================================================ */
(function () {
  'use strict';
  window.G = window.G || {};

  /* Ekran tanımları: her buton {x,y,w,h,action} */
  const SCREENS = {
    menu: {
      img: 'main_menu',
      buttons: [
        // OYNA — master prompt'ta verilen kesin alan
        { x: 292, y: 421, w: 669 - 292, h: 529 - 421, action: 'play' }
      ]
    },
    controls: {
      img: 'controls_screen',
      buttons: [],          // herhangi bir tuş/tıklama geçer (3sn sonra otomatik)
      anyKey: true,
      autoMs: 3000
    },
    pause: {
      img: 'pause_menu',
      buttons: [
        { x: 424, y: 206, w: 112, h: 42, action: 'resume' },   // DEVAM ET
        { x: 424, y: 282, w: 112, h: 42, action: 'settings' }, // AYARLAR -> kontrol ekranı
        { x: 424, y: 358, w: 112, h: 42, action: 'mainmenu' }  // ANA MENU
      ]
    },
    gameover: {
      img: 'game_over',
      buttons: [
        { x: 420, y: 316, w: 120, h: 40, action: 'retry' }     // TEKRAR DENE
      ]
    },
    credits: {
      img: 'credits_screen',
      buttons: [
        { x: 420, y: 338, w: 120, h: 38, action: 'mainmenu' }  // ANA MENUYE DON
      ]
    },
    loading: { img: 'loading_screen', buttons: [] }
  };

  const ui = {
    screen: null,          // aktif ekran adı (null = oyun dünyası)
    _hover: -1,
    _timer: 0,
    _anyKeyCb: null,       // controls ekranı bitince ne olacak
    _returnTo: null,       // AYARLAR'dan dönüş için (pause)

    open(name, opts) {
      this.screen = name;
      this._hover = -1;
      this._timer = 0;
      opts = opts || {};
      if (opts.onDone) this._anyKeyCb = opts.onDone;
      if (name === 'menu') G.audio.music('music_title_theme');
    },

    close() { this.screen = null; this._hover = -1; },

    update(dt) {
      if (!this.screen) return;
      const def = SCREENS[this.screen];
      if (def && def.autoMs) {
        this._timer += dt * 1000;
        if (this._timer >= def.autoMs) this._finishAnyKey();
      }
    },

    _finishAnyKey() {
      const cb = this._anyKeyCb;
      this._anyKeyCb = null;
      this.close();
      if (cb) cb();
    },

    /* Tuş — anyKey ekranları için */
    key() {
      if (!this.screen) return false;
      const def = SCREENS[this.screen];
      if (def && def.anyKey) { this._finishAnyKey(); return true; }
      return false;
    },

    mousemove(mx, my) {
      if (!this.screen) return;
      const def = SCREENS[this.screen];
      this._hover = -1;
      def.buttons.forEach((b, i) => {
        if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) this._hover = i;
      });
    },

    click(mx, my) {
      if (!this.screen) return false;
      const def = SCREENS[this.screen];
      if (def.anyKey) { this._finishAnyKey(); return true; }
      for (const b of def.buttons) {
        if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
          this._doAction(b.action);
          return true;
        }
      }
      return true;   // ekran açıkken tık dünyaya geçmesin
    },

    _doAction(a) {
      switch (a) {
        case 'play':
          this.close();
          G.startGame();                      // main.js: kontroller -> prolog
          break;
        case 'resume':
          this.close();
          break;
        case 'settings':
          this._returnTo = 'pause';
          this.open('controls', { onDone: () => this.open('pause') });
          break;
        case 'mainmenu':
          this.close();
          G.toMainMenu();
          break;
        case 'retry':
          this.close();
          G.retryCheckpoint();
          break;
      }
    },

    draw(ctx) {
      if (!this.screen) return;
      const def = SCREENS[this.screen];
      const img = G.uiImages[def.img];
      if (img && img.complete && img.naturalWidth) {
        // main_menu 1672x941 — canvas'a sığdırılır; diğerleri zaten 960x540
        ctx.drawImage(img, 0, 0, 960, 540);
      } else {
        // Görsel yoksa placeholder ekran
        ctx.fillStyle = '#231822';
        ctx.fillRect(0, 0, 960, 540);
        ctx.fillStyle = '#d8c8b8';
        ctx.font = '28px Alagard, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.screen.toUpperCase(), 480, 260);
      }
      // Hover parlaklığı
      if (this._hover >= 0) {
        const b = def.buttons[this._hover];
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(255,220,160,0.13)';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.restore();
      }
      // Loading ekranında nokta animasyonu üstüne hafif nefes efekti
      if (this.screen === 'loading') {
        ctx.fillStyle = 'rgba(0,0,0,' + (0.12 + 0.1 * Math.sin(performance.now() / 400)) + ')';
        ctx.fillRect(0, 0, 960, 540);
      }
    }
  };

  G.ui = ui;
  G.UI_SCREENS = SCREENS;

  /* ================================================================
     INTRO FRAGMAN — ana menüden ÖNCE bir kez gösterilir.
     - Tarayıcı sesli videoyu kullanıcı etkileşimi olmadan oynatmadığı
       için "FRAGMANI İZLE" tıklaması zorunlu adımdır.
     - Varlık kontrolü: sayfadaki GERÇEK #intro-video elemanına
       (preload="metadata") src atanır ve loadedmetadata/error beklenir.
       Ayrı bir fetch/HEAD veya DOM'a eklenmemiş "probe" elemanı KULLANILMAZ
       — bazı ağ/proxy/VPN ortamlarında bunlar güvenilmez şekilde
       başarısız oluyordu. preload="metadata" sadece küçük bir başlık
       isteği yapar (tüm dosyayı indirmez), sayfa açılışını yavaşlatmaz.
     - fragman.mp4 yoksa/yüklenemezse ekran HİÇ gösterilmez, sessizce
       ana menüye düşülür (konsola hata basılmaz).
     ================================================================ */
  const VIDEO_URL = 'assets/video/fragman.mp4';

  const intro = {
    active: false,
    _done: null,          // bitince çağrılacak (ana menüyü açar)
    _finished: false,

    /* Boot akışı: gerçek video elemanına src ata, metadata gelirse
       ekranı göster; hata veya 6sn içinde hiçbir sinyal gelmezse
       (yavaş ağ, VPN gecikmesi vb.) sessizce doğrudan done() (ana menü). */
    start(done) {
      let settled = false;
      const vid = document.getElementById('intro-video');
      const finishOnce = (ok) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        vid.onloadedmetadata = null;
        vid.onerror = null;
        ok ? this.show(done) : done();
      };
      vid.onloadedmetadata = () => finishOnce(true);
      vid.onerror = () => finishOnce(false);
      vid.src = VIDEO_URL;
      vid.load();
      const timer = setTimeout(() => finishOnce(false), 6000);
    },

    show(done) {
      this.active = true;
      this._finished = false;
      this._done = done || (() => {});
      const box = document.getElementById('intro');
      const watch = document.getElementById('intro-watch');
      box.classList.remove('fading');
      box.style.display = 'block';
      document.getElementById('intro-video').style.display = 'none';
      watch.style.display = 'block';

      watch.onclick = () => this._play();
      document.getElementById('intro-skip').onclick = () => this.skip();
    },

    _play() {
      const vid = document.getElementById('intro-video');
      document.getElementById('intro-watch').style.display = 'none';
      vid.style.display = 'block';
      G.audio.unlock();                          // tıklama ses kilidini de açar
      vid.onended = () => this._finish();
      vid.onerror = () => this._finish();        // oynatma sırasında hata: sessiz fallback
      vid.currentTime = 0;
      vid.play().catch(() => this._finish());
    },

    /* ESC veya "Atla" — video oynuyorsa hemen durdurur */
    skip() { this._finish(); },

    _finish() {
      if (this._finished) return;                // ended+skip çift tetiklenmesin
      this._finished = true;
      const box = document.getElementById('intro');
      const vid = document.getElementById('intro-video');
      try { vid.pause(); } catch (e) {}
      // Yumuşak fade-to-black (0.4s) -> ana menü
      box.classList.add('fading');
      setTimeout(() => {
        box.style.display = 'none';
        box.classList.remove('fading');
        vid.style.display = 'none';
        vid.removeAttribute('src');
        try { vid.load(); } catch (e) {}         // belleği bırak
        this.active = false;
        const d = this._done; this._done = null;
        if (d) d();
      }, 420);
    }
  };

  G.intro = intro;
})();
