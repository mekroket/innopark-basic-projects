/* ============================================================
   jumpscare.js — Jumpscare sistemi + QTE
   triggerJumpscare(opts):
     - beyaz flash -> portrenin ani zoom'u (kırmızı overlay + jitter
       "bozulma" efekti, çalışma anında kodla) -> 1sn karartma -> dönüş
     - ekran sarsıntısı (canvas transform, main.js shake değerini okur)
     - ses: jumpscare_sting veya whisper varyantı
   Çizim main.js render döngüsünün EN ÜSTÜNDE yapılır.
   ============================================================ */
(function () {
  'use strict';
  window.G = window.G || {};

  /* ---- Tam ekran jumpscare görselleri (assets/jumpscares/) ----
     fx/fy: cover kırpmasında ekran merkezine hizalanacak nokta
     (karakterin YÜZÜ/GÖZLERİ) — görsel oranı ne olursa olsun yüz
     kadrajda kalır (üstten değil, yüz odaklı kırpım). */
  const JS_IMAGES = {
    marla_jumpscare:     { fx: 0.50, fy: 0.48 },   // yatay — yüz ortada
    liam_jumpscare:      { fx: 0.52, fy: 0.26 },   // dikey — yüz üst bölgede
    katheryne_jumpscare: { fx: 0.44, fy: 0.36 }    // dikey — yüz üst-ortada
  };
  const _imgCache = {};   // isim -> Image | null

  // Uzantı fallback'li ön yükleme (.png / .jpeg / .jpg) — boot'ta başlar
  function preloadJsImage(name) {
    const exts = ['png', 'jpeg', 'jpg'];
    let i = 0;
    const tryNext = () => {
      if (i >= exts.length) { _imgCache[name] = null; return; }
      const img = new Image();
      img.onload = () => { _imgCache[name] = img; };
      img.onerror = () => { i++; tryNext(); };
      img.src = 'assets/jumpscares/' + name + '.' + exts[i];
    };
    tryNext();
  }
  Object.keys(JS_IMAGES).forEach(preloadJsImage);

  const js = {
    active: false,
    _t: 0,
    _opts: null,
    _resolve: null,
    _phase: 'flash',     // flash -> zoom -> hold -> black

    /* opts: {who:'katheryne', image:'katheryne_jumpscare' (ops.),
              sting:'jumpscare_sting', voice:null,
              zoomTime, holdTime, blackTime}
       image verilirse: tam ekran cover görsel (0.5-0.8s) + sarsıntı/flash.
       Görsel yüklenememişse otomatik olarak portre-zoom'a düşer. */
    trigger(opts) {
      opts = opts || {};
      const hasImg = !!(opts.image && _imgCache[opts.image]);
      return new Promise(resolve => {
        this.active = true;
        this._t = 0;
        this._phase = 'flash';
        this._opts = Object.assign({
          who: 'katheryne',
          image: null,
          sting: 'jumpscare_sting',
          voice: null,
          // Görsel modunda ani pat diye belirir (~0.7s ekranda kalır)
          zoomTime: hasImg ? 0.12 : 0.7,
          holdTime: hasImg ? 0.55 : 0.45,
          blackTime: 1.0
        }, opts);
        this._resolve = resolve;
        G.audio.sfx(this._opts.sting, { volume: 1.0 });
        if (this._opts.voice) G.audio.voice(this._opts.voice);
        G.fx.shake(0.5, 14);          // ekran sarsıntısı ~0.4-0.5s
      });
    },

    update(dt) {
      if (!this.active) return;
      this._t += dt;
      const o = this._opts;
      if (this._phase === 'flash' && this._t > 0.1)  { this._phase = 'zoom'; this._t = 0; }
      else if (this._phase === 'zoom' && this._t > o.zoomTime) { this._phase = 'hold'; this._t = 0; }
      else if (this._phase === 'hold' && this._t > o.holdTime) { this._phase = 'black'; this._t = 0; }
      else if (this._phase === 'black' && this._t > o.blackTime) {
        this.active = false;
        const r = this._resolve; this._resolve = null;
        if (r) r();
      }
    },

    draw(ctx) {
      if (!this.active) return;
      const o = this._opts;
      const ch = G.CHARS[o.who] || {};
      const img = ch.portraitImg;

      ctx.save();
      if (this._phase === 'flash') {
        ctx.fillStyle = '#e8dcd0';
        ctx.fillRect(0, 0, 960, 540);
        ctx.restore();
        return;
      }
      if (this._phase === 'black') {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 960, 540);
        ctx.restore();
        return;
      }

      // zoom / hold: karanlık zemin + görsel/portre + jitter
      ctx.fillStyle = '#050203';
      ctx.fillRect(0, 0, 960, 540);

      const prog = this._phase === 'zoom' ? Math.min(1, this._t / o.zoomTime) : 1;
      // easeOutCubic — ilk anda çok hızlı büyür (ani hissi)
      const e = 1 - Math.pow(1 - prog, 3);
      const jx = (Math.random() - 0.5) * 16;
      const jy = (Math.random() - 0.5) * 16;

      /* ---- TAM EKRAN GÖRSEL MODU (opts.image) ---- */
      const jimg = o.image ? _imgCache[o.image] : null;
      if (jimg && jimg.naturalWidth) {
        const focus = JS_IMAGES[o.image] || { fx: 0.5, fy: 0.5 };
        // cover: canvas'ı tamamen kaplayacak ölçek + hafif büyüme (1.0 -> 1.07)
        const cover = Math.max(960 / jimg.naturalWidth, 540 / jimg.naturalHeight);
        const s = cover * (1.0 + 0.07 * (this._phase === 'zoom' ? e : 1) + 0.02 * Math.sin(this._t * 25));
        const dw = jimg.naturalWidth * s;
        const dh = jimg.naturalHeight * s;
        // Yüz noktası ekran merkezine; kenarlarda açık kalmayacak şekilde clamp'le
        let dx = 480 - focus.fx * dw;
        let dy = 270 - focus.fy * dh;
        dx = Math.max(960 - dw, Math.min(0, dx));
        dy = Math.max(540 - dh, Math.min(0, dy));
        ctx.drawImage(jimg, dx + jx, dy + jy, dw, dh);
        // Kenar vinyeti (görselin üstüne)
        const gv = ctx.createRadialGradient(480, 270, 200, 480, 270, 580);
        gv.addColorStop(0, 'rgba(0,0,0,0)');
        gv.addColorStop(1, 'rgba(0,0,0,0.85)');
        ctx.fillStyle = gv;
        ctx.fillRect(0, 0, 960, 540);
        ctx.restore();
        return;
      }

      /* ---- ESKİ PORTRE-ZOOM MODU (image verilmezse) ---- */
      if (img && img.complete && img.naturalWidth) {
        const scale = (0.6 + 2.1 * e) * (540 / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        const x = 480 - w / 2 + jx;
        const y = 270 - h / 2.6 + jy;   // yüz merkezde kalsın diye hafif yukarı

        // "Bozulmuş" görünüm: kanal kaydırmalı çift çizim
        ctx.globalAlpha = 0.55;
        ctx.drawImage(img, x - 6 - e * 4, y, w, h);
        ctx.drawImage(img, x + 6 + e * 4, y + 3, w, h);
        ctx.globalAlpha = 1;
        ctx.drawImage(img, x, y, w, h);

        // Kırmızı overlay
        ctx.globalCompositeOperation = 'source-atop';
        ctx.globalAlpha = 0.38 + 0.15 * Math.sin(this._t * 40);
        ctx.fillStyle = '#8a0f0f';
        ctx.fillRect(0, 0, 960, 540);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      } else {
        // Portre yoksa: kırmızı flash placeholder
        ctx.fillStyle = 'rgba(150,10,10,' + (0.4 + 0.3 * Math.sin(this._t * 30)) + ')';
        ctx.fillRect(0, 0, 960, 540);
      }

      // Kenar vinyeti
      const g = ctx.createRadialGradient(480, 270, 180, 480, 270, 560);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.9)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 960, 540);
      ctx.restore();
    }
  };

  /* =================== QTE — hızlı SPACE basma ===================
     run({duration, needed}): true (kurtuldu) / false (başarısız) */
  const qte = {
    active: false,
    _t: 0, _dur: 6, _value: 0, _needed: 16, _decay: 2.2,
    _resolve: null,

    run(opts) {
      opts = opts || {};
      return new Promise(resolve => {
        this.active = true;
        this._t = 0;
        this._dur = opts.duration || 6;
        this._value = 3;
        this._needed = opts.needed || 16;
        this._decay = opts.decay || 2.2;
        this._resolve = resolve;
        G.audio.sfx('heartbeat_fast_loop', { volume: 0.9 });
      });
    },

    press() {
      if (!this.active) return;
      this._value += 1;
      G.fx.shake(0.08, 5);
      if (this._value >= this._needed) this._finish(true);
    },

    update(dt) {
      if (!this.active) return;
      this._t += dt;
      this._value = Math.max(0, this._value - this._decay * dt);
      if (this._t >= this._dur) this._finish(false);
    },

    _finish(ok) {
      this.active = false;
      const r = this._resolve; this._resolve = null;
      if (r) r(ok);
    },

    draw(ctx) {
      if (!this.active) return;
      ctx.save();
      // Karanlık çerçeve + titreşim
      ctx.fillStyle = 'rgba(20,0,0,0.45)';
      ctx.fillRect(0, 0, 960, 540);

      const pulse = 1 + 0.06 * Math.sin(this._t * 20);
      ctx.translate(480, 300);
      ctx.scale(pulse, pulse);
      ctx.font = '30px Alagard, monospace';
      ctx.fillStyle = '#e8dcd0';
      ctx.textAlign = 'center';
      ctx.fillText('SPACE — KURTUL!', 0, -40);
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Direnç barı
      const w = 420, h = 26, x = 480 - w / 2, y = 300;
      ctx.fillStyle = '#231822';
      ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
      ctx.fillStyle = '#3c3534';
      ctx.fillRect(x, y, w, h);
      const p = Math.min(1, this._value / this._needed);
      ctx.fillStyle = p > 0.7 ? '#a4623d' : '#8a0f0f';
      ctx.fillRect(x, y, w * p, h);
      // Kalan süre
      const tp = 1 - this._t / this._dur;
      ctx.fillStyle = '#6d5640';
      ctx.fillRect(x, y + h + 10, w * tp, 6);
      ctx.restore();
    }
  };

  G.jumpscare = js;
  G.qte = qte;
  // Kısayol — master prompt'taki isimle de erişilebilir
  window.triggerJumpscare = opts => js.trigger(opts);
})();
