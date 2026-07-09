/* ============================================================
   dialogue.js — Diyalog paneli + portre + ses senkronu
   Ayrıca: seçim kutusu, not kağıdı, metin akışı (prolog/epilog),
   hedef göstergesi ve toast mesajları.
   Hepsi DOM overlay — canvas üstünde. SPACE ile ilerletilir.
   ============================================================ */
(function () {
  'use strict';
  window.G = window.G || {};

  const $ = id => document.getElementById(id);

  /* =================== DİYALOG =================== */
  const dlg = {
    active: false,
    _lines: [], _i: 0,
    _typing: false, _timer: null,
    _resolve: null,
    _fullText: '',

    /* lines: [{who:'evelyn', text:'...', voice:'evelyn_001', thought:true, name:'...'}] */
    show(lines) {
      return new Promise(resolve => {
        this._lines = lines;
        this._i = 0;
        this._resolve = resolve;
        this.active = true;
        $('dlg').style.display = 'block';
        this._startLine();
      });
    },

    _startLine() {
      const L = this._lines[this._i];
      const ch = G.CHARS[L.who] || {};
      const name = L.name || (L.thought ? (ch.name || '') + ' (iç ses)' : (ch.name || '???'));
      $('dlg-name').textContent = name;

      // Portre: cover + üstten hizalama (yüz görünsün)
      const p = $('dlg-portrait');
      if (ch.portrait) {
        p.style.display = 'block';
        p.style.backgroundImage = "url('" + ch.portrait + "')";
      } else {
        p.style.display = 'none';
      }

      const txtEl = $('dlg-text');
      txtEl.className = L.thought ? 'thought' : '';
      txtEl.textContent = '';
      this._fullText = L.text;
      this._typing = true;
      $('dlg-more').style.visibility = 'hidden';

      // Satırla senkron voice — önceki satırın sesi voice() içinde durdurulur
      G.audio.voice(L.voice || null);

      // Typewriter ~25ms/harf
      let i = 0;
      clearInterval(this._timer);
      this._timer = setInterval(() => {
        i++;
        txtEl.textContent = this._fullText.slice(0, i);
        if (i >= this._fullText.length) {
          clearInterval(this._timer);
          this._typing = false;
          $('dlg-more').style.visibility = 'visible';
        }
      }, 25);
    },

    /* SPACE: yazım bitmediyse tamamla, bittiyse sonraki satır / kapan */
    advance() {
      if (!this.active) return;
      if (this._typing) {
        clearInterval(this._timer);
        this._typing = false;
        $('dlg-text').textContent = this._fullText;
        $('dlg-more').style.visibility = 'visible';
        return;
      }
      this._i++;
      if (this._i >= this._lines.length) {
        this.close();
      } else {
        this._startLine();
      }
    },

    close() {
      this.active = false;
      clearInterval(this._timer);
      $('dlg').style.display = 'none';
      G.audio.stopVoice();
      const r = this._resolve; this._resolve = null;
      if (r) r();
    }
  };

  /* =================== SEÇİM =================== */
  const choice = {
    active: false,
    _resolve: null,
    _sel: 0,
    _labels: [],

    show(labels) {
      return new Promise(resolve => {
        this.active = true;
        this._resolve = resolve;
        this._labels = labels;
        this._sel = 0;
        const box = $('choice');
        box.innerHTML = '';
        labels.forEach((lab, i) => {
          const b = document.createElement('div');
          b.className = 'choice-btn' + (i === 0 ? ' sel' : '');
          b.textContent = lab;
          b.onclick = () => this._pick(i);
          b.onmouseenter = () => { this._sel = i; this._paint(); };
          box.appendChild(b);
        });
        box.style.display = 'block';
      });
    },

    _paint() {
      const kids = $('choice').children;
      for (let i = 0; i < kids.length; i++)
        kids[i].className = 'choice-btn' + (i === this._sel ? ' sel' : '');
    },

    key(code) {
      if (!this.active) return;
      if (code === 'KeyW' || code === 'ArrowUp')   { this._sel = (this._sel + this._labels.length - 1) % this._labels.length; this._paint(); }
      if (code === 'KeyS' || code === 'ArrowDown') { this._sel = (this._sel + 1) % this._labels.length; this._paint(); }
      if (code === 'Space' || code === 'Enter' || code === 'KeyE') this._pick(this._sel);
    },

    _pick(i) {
      this.active = false;
      $('choice').style.display = 'none';
      const r = this._resolve; this._resolve = null;
      if (r) r(i);
    }
  };

  /* =================== NOT KAĞIDI =================== */
  const note = {
    active: false,
    _resolve: null,
    show(html) {
      return new Promise(resolve => {
        this.active = true;
        this._resolve = resolve;
        $('note').innerHTML = html + '<small>SPACE — kapat</small>';
        $('note').style.display = 'block';
      });
    },
    close() {
      if (!this.active) return;
      this.active = false;
      $('note').style.display = 'none';
      const r = this._resolve; this._resolve = null;
      if (r) r();
    }
  };

  /* =================== METİN AKIŞI (prolog / epilog) ===================
     lines: [{text, voice, cls, delay}] — satırlar sırayla belirir,
     SPACE bir sonraki satırı getirir (voice varsa çalar). */
  const scroll = {
    active: false,
    _resolve: null, _lines: [], _i: -1,
    _waiting: false,

    show(lines) {
      return new Promise(resolve => {
        this.active = true;
        this._resolve = resolve;
        this._lines = lines;
        this._i = -1;
        $('scroll-inner').innerHTML = '';
        $('scroll').style.display = 'block';
        this._next();
      });
    },

    _next() {
      this._i++;
      if (this._i >= this._lines.length) { this.close(); return; }
      const L = this._lines[this._i];
      if (L.clear) $('scroll-inner').innerHTML = '';
      const div = document.createElement('div');
      div.className = 'scroll-line' + (L.cls ? ' ' + L.cls : '');
      div.textContent = L.text;
      $('scroll-inner').appendChild(div);
      requestAnimationFrame(() => requestAnimationFrame(() => div.classList.add('on')));
      if (L.voice) G.audio.voice(L.voice);
      this._waiting = true;
    },

    advance() { if (this.active && this._waiting) this._next(); },

    close() {
      this.active = false;
      $('scroll').style.display = 'none';
      $('scroll-inner').innerHTML = '';
      G.audio.stopVoice();
      const r = this._resolve; this._resolve = null;
      if (r) r();
    }
  };

  /* =================== HEDEF & TOAST =================== */
  function setObjective(text) {
    const el = $('objective');
    if (!text) { el.style.display = 'none'; return; }
    el.textContent = '◆ ' + text;
    el.style.display = 'block';
  }

  let _toastTimer = null;
  function toast(text, ms) {
    const el = $('toast');
    el.textContent = text;
    el.style.display = 'block';
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => { el.style.display = 'none'; }, ms || 2600);
  }

  /* Kısayol: tek satır söylet */
  function say(who, voice, text, opts) {
    opts = opts || {};
    return dlg.show([{ who, voice, text, thought: opts.thought, name: opts.name }]);
  }

  G.dlg = dlg;
  G.choice = c => choice.show(c);
  G.choiceBox = choice;
  G.note = note;
  G.scroll = scroll;
  G.setObjective = setObjective;
  G.toast = toast;
  G.say = say;
})();
