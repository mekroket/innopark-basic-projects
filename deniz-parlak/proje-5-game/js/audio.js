/* ============================================================
   audio.js — Ses yöneticisi
   Üç kanal: music (loop, düşük ses), sfx (tek seferlik/loop), voice (diyalog).
   KURAL: Eksik dosya oyunu ASLA kırmaz — her yükleme onerror ile yutulur.
   Voice dosyaları standart "id.mp3" adlarındadır (isimler temizlendi);
   .ogg/.wav alternatifleri de denenir, hiçbiri yoksa sessiz devam edilir.
   ============================================================ */
(function () {
  'use strict';
  window.G = window.G || {};

  const VOICE_DIR = 'assets/audio/voice/';
  const SFX_DIR   = 'assets/audio/sfx/';
  const MUSIC_DIR = 'assets/audio/music/';

  const audio = {
    unlocked: false,          // tarayıcı autoplay kilidi ilk kullanıcı etkileşimiyle açılır
    musicEl: null,
    musicName: null,
    musicVol: 0.35,
    voiceEl: null,            // aynı anda tek voice çalar
    _voiceCache: {},          // id -> çözülmüş URL ('' = bulunamadı)
    _pending: [],             // kilit açılmadan istenen müzik

    /* ---- kilit açma: ilk tıklama/tuş ---- */
    unlock() {
      if (this.unlocked) return;
      this.unlocked = true;
      if (this._pendingMusic) {
        const p = this._pendingMusic;
        this._pendingMusic = null;
        this.music(p.name || p, p.vol);
      }
    },

    /* =================== MUSIC ===================
       vol: sahneye özel hedef seviye (kaçış sahnelerinde kısılır —
       kalp atışı baskın olsun). Seviye değişimleri YUMUŞAK geçer (ramp). */
    music(name, vol) {
      const target = (vol != null ? vol : this.musicVol);
      if (name === this.musicName && this.musicEl && !this.musicEl.paused) {
        this._rampTo(target);                       // aynı parça: sadece seviye geçişi
        return;
      }
      this.stopMusic();
      this.musicName = name;
      if (!name) return;
      if (!this.unlocked) { this._pendingMusic = { name, vol: target }; return; }
      try {
        const el = new Audio(MUSIC_DIR + name + '.mp3');
        el.loop = true;
        el.volume = 0;                              // 0'dan hedefe yumuşak giriş
        el.onerror = () => { /* müzik yoksa sessiz devam */ };
        el.play().catch(() => {});
        this.musicEl = el;
        this._rampTo(target);
      } catch (e) { /* yut */ }
    },

    _rampIv: null,
    _rampTo(target) {
      clearInterval(this._rampIv);
      const el = this.musicEl;
      if (!el) return;
      this._rampIv = setInterval(() => {
        if (this.musicEl !== el) { clearInterval(this._rampIv); return; }
        const d = target - el.volume;
        if (Math.abs(d) < 0.02) { el.volume = target; clearInterval(this._rampIv); }
        else el.volume = Math.max(0, Math.min(1, el.volume + d * 0.16));
      }, 80);
    },

    stopMusic() {
      if (this.musicEl) { try { this.musicEl.pause(); } catch (e) {} }
      this.musicEl = null;
      this.musicName = null;
    },

    /* =================== SFX =================== */
    // Tek seferlik efekt. opts: {volume, rate}
    sfx(name, opts) {
      opts = opts || {};
      try {
        const el = new Audio(SFX_DIR + name + '.mp3');
        el.volume = opts.volume != null ? opts.volume : 0.8;
        if (opts.rate) el.playbackRate = opts.rate;
        el.onerror = () => {};
        el.play().catch(() => {});
        return el;
      } catch (e) { return null; }
    },

    // Loop'lu efekt (rüzgar, kalp atışı, zincir...). Handle döner: {stop(), setVolume()}
    loopSfx(name, vol) {
      let el = null;
      try {
        el = new Audio(SFX_DIR + name + '.mp3');
        el.loop = true;
        el.volume = vol != null ? vol : 0.5;
        el.onerror = () => {};
        el.play().catch(() => {});
      } catch (e) { el = null; }
      return {
        el,
        stop() { if (el) { try { el.pause(); } catch (e) {} el = null; } },
        setVolume(v) { if (el) el.volume = Math.max(0, Math.min(1, v)); }
      };
    },

    /* =================== VOICE =================== */
    // Diyalog satırıyla senkron seslendirme. Önceki voice durdurulur.
    // Dosya bulunamazsa sessizce geçilir (kayıtlar sonradan eklenebilir).
    voice(id) {
      this.stopVoice();
      if (!id) return;
      const cached = this._voiceCache[id];
      if (cached === '') return;                 // daha önce arandı, yok
      if (cached) { this._playVoiceUrl(cached); return; }

      // Aday URL'ler — dosya adları temizlendi (id.mp3 standart);
      // ogg/wav alternatif format için yedek olarak kalır
      const candidates = [
        VOICE_DIR + id + '.mp3',
        VOICE_DIR + id + '.ogg',
        VOICE_DIR + id + '.wav'
      ];
      this._tryVoice(id, candidates, 0);
    },

    _tryVoice(id, candidates, i) {
      if (i >= candidates.length) { this._voiceCache[id] = ''; return; }
      const url = candidates[i];
      let el;
      try { el = new Audio(url); } catch (e) { this._voiceCache[id] = ''; return; }
      el.volume = 1.0;
      el.onerror = () => this._tryVoice(id, candidates, i + 1);
      el.oncanplaythrough = () => { this._voiceCache[id] = url; };
      el.play().then(() => {
        this._voiceCache[id] = url;
        this.voiceEl = el;
      }).catch(() => {
        // play reddi: dosya var ama autoplay kilidi olabilir; sıradakini deneme
        // (onerror gerçek 404'ü yakalar)
      });
      this.voiceEl = el;
    },

    _playVoiceUrl(url) {
      try {
        const el = new Audio(url);
        el.volume = 1.0;
        el.onerror = () => {};
        el.play().catch(() => {});
        this.voiceEl = el;
      } catch (e) {}
    },

    stopVoice() {
      if (this.voiceEl) { try { this.voiceEl.pause(); } catch (e) {} this.voiceEl = null; }
    },

    /* =================== SAAT ÇANI (sentez) ===================
       Elde çan sfx'i yok; WebAudio ile düşük, boğuk bir çan vuruşu
       sentezlenir. WebAudio yoksa sessiz geçilir. */
    _ctx: null,
    bellStrike() {
      try {
        if (!this._ctx) this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = this._ctx;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = 110;
        osc2.type = 'sine'; osc2.frequency.value = 220.7;   // hafif detune: metalik tını
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
        osc.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc2.start(t);
        osc.stop(t + 2.3); osc2.stop(t + 2.3);
      } catch (e) { /* sessiz */ }
    },

    // Kısa boğuk "tık" (kapı vuruşu) sentezi — door_knock.mp3 yoksa fallback
    knock() {
      try {
        if (!this._ctx) this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = this._ctx;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle'; osc.frequency.setValueAtTime(95, t);
        osc.frequency.exponentialRampToValueAtTime(55, t + 0.08);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.16);
      } catch (e) {}
    },

    /* =================== AYAK SESİ ===================
       Tek Audio elemanı yeniden kullanılır: her adımda başa sarılıp
       çalınır, böylece sesler ÜST ÜSTE BİNMEZ. Durunca pause edilir. */
    _stepEl: null,
    _stepMissing: false,
    step() {
      if (!this.unlocked || this._stepMissing) return;
      try {
        if (!this._stepEl) {
          this._stepEl = new Audio(SFX_DIR + 'footsteps_stone.mp3');
          this._stepEl.onerror = () => { this._stepMissing = true; };  // dosya yok: sessiz
        }
        const el = this._stepEl;
        el.volume = 0.35;
        el.currentTime = 0;
        el.play().catch(() => {});
      } catch (e) {}
    },
    stopStep() {
      if (this._stepEl) { try { this._stepEl.pause(); } catch (e) {} }
    },

    /* =================== KAPI TIKLAMASI ===================
       door_knock.mp3 varsa onu çalar (tek eleman, üst üste binmez);
       yoksa knock() sentezine düşer. Dosya sonradan eklenirse otomatik çalar. */
    _knockEl: null,
    _knockMissing: false,
    knockSfx() {
      if (this._knockMissing) { this.knock(); return; }
      try {
        if (!this._knockEl) {
          this._knockEl = new Audio(SFX_DIR + 'door_knock.mp3');
          this._knockEl.onerror = () => { this._knockMissing = true; this.knock(); };
        }
        this._knockEl.volume = 0.9;
        this._knockEl.currentTime = 0;
        this._knockEl.play().catch(() => {});
      } catch (e) { this.knock(); }
    },

    /* =================== SAAT: 12 VURUŞ ===================
       clock_chime.mp3 varsa akıllıca kullanılır:
         - dosya < 3sn (tek vuruş kaydı)  -> 12 kez, 600ms arayla
         - dosya >= 3sn (tam sekans)      -> bir kez çal, bitmesini bekle
       Dosya yoksa: sentez çan (bellStrike) x12.
       shouldContinue() false dönerse (sahne değişti) erken çıkar. */
    _clockMissing: false,
    clockChime(shouldContinue) {
      const cont = shouldContinue || (() => true);
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      return new Promise(resolve => {
        let settled = false;
        const done = () => { if (!settled) { settled = true; resolve(); } };
        const synth = async () => {
          for (let i = 0; i < 12; i++) {
            if (!cont()) break;
            this.bellStrike();
            await sleep(550);
          }
          done();
        };
        if (this._clockMissing) { synth(); return; }
        let el;
        try { el = new Audio(SFX_DIR + 'clock_chime.mp3'); }
        catch (e) { synth(); return; }
        el.volume = 0.7;
        el.onerror = () => { this._clockMissing = true; synth(); };
        el.onloadedmetadata = async () => {
          if (el.duration && el.duration < 3) {
            for (let i = 0; i < 12; i++) {
              if (!cont()) break;
              try { el.currentTime = 0; el.play().catch(() => {}); } catch (e) {}
              await sleep(600);
            }
            done();
          } else {
            el.onended = done;
            el.play().catch(() => done());
            setTimeout(done, 14000);      // emniyet: en geç 14sn sonra devam
          }
        };
        setTimeout(done, 16000);          // hiçbir olay gelmezse kilitlenme
      });
    }
  };

  G.audio = audio;

  // İlk kullanıcı etkileşimi ile ses kilidini aç
  const unlockOnce = () => { audio.unlock(); };
  window.addEventListener('pointerdown', unlockOnce, { once: false });
  window.addEventListener('keydown', unlockOnce, { once: false });
})();
