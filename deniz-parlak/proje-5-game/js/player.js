/* ============================================================
   player.js — Evelyn: hareket, collision, animasyon, ayak sesi
   LPC Universal Sheet: 64x64 kare, 13 sütun.
   Yürüme satırları: up=8, left=9, down=10, right=11.
   Kare 0 = idle, kare 1-8 = yürüme döngüsü.
   ============================================================ */
(function () {
  'use strict';
  window.G = window.G || {};

  const ROW_ORDER = { up: 8, left: 9, down: 10, right: 11 };
  const FRAME_SIZE = 64;
  const WALK_FRAMES = 8;

  class Player {
    constructor(sheet) {
      this.sheet = sheet;         // Image (evelyn.png)
      this.x = 0;                 // ayak merkezi (dünya px)
      this.y = 0;
      this.dir = 'down';
      this.speed = 180;           // px/sn
      this.moving = false;
      this.animT = 0;
      this.frame = 0;
      this.stepT = 0.3;           // ayak sesi zamanlayıcısı (ilk adım çabuk gelsin)
      // Ayak collision kutusu (ayak merkezine göre)
      this.boxW = 24;
      this.boxH = 12;
    }

    place(x, y, dir) {
      this.x = x; this.y = y;
      if (dir) this.dir = dir;
      this.moving = false;
      this.frame = 0;
    }

    /* Girdiyle hareket. map: GameMap. locked ise sadece animasyon durur. */
    update(dt, input, map, locked) {
      let dx = 0, dy = 0;
      if (!locked) {
        if (input.down.has('KeyW') || input.down.has('ArrowUp'))    dy -= 1;
        if (input.down.has('KeyS') || input.down.has('ArrowDown'))  dy += 1;
        if (input.down.has('KeyA') || input.down.has('ArrowLeft'))  dx -= 1;
        if (input.down.has('KeyD') || input.down.has('ArrowRight')) dx += 1;
      }
      this.moving = (dx !== 0 || dy !== 0);

      if (this.moving) {
        // Yön: baskın eksen
        if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 'right' : 'left';
        else if (dy !== 0) this.dir = dy > 0 ? 'down' : 'up';
        const len = Math.hypot(dx, dy) || 1;
        const step = this.speed * dt;
        const nx = this.x + (dx / len) * step;
        const ny = this.y + (dy / len) * step;
        this.tryMove(nx, ny, map);

        // Animasyon
        this.animT += dt;
        this.frame = 1 + Math.floor(this.animT / 0.09) % WALK_FRAMES;

        // Ayak sesi — ~0.38s aralıkla kısa çalım (tek eleman, üst üste binmez)
        this.stepT += dt;
        if (this.stepT >= 0.38) { this.stepT = 0; G.audio.step(); }
      } else {
        this.frame = 0;
        this.animT = 0;
        this.stepT = 0.3;          // tekrar yürüyünce ilk adım hızlı gelsin
        G.audio.stopStep();
      }
    }

    stopFootsteps() { G.audio.stopStep(); }

    /* Eksen ayrı collision — duvara sürtünerek kayabilme.
       GÜVENCE: mevcut konum zaten bir solid ile çakışıyorsa (kötü spawn,
       cutscene ışınlaması vb.) hareket engellenmez — oyuncu asla kalıcı
       olarak sıkışamaz; serbest alana çıkınca normal collision devam eder. */
    tryMove(nx, ny, map) {
      const hw = this.boxW / 2;
      const stuck = !map.rectFree(this.x - hw, this.y - this.boxH, this.boxW, this.boxH);
      if (stuck || map.rectFree(nx - hw, this.y - this.boxH, this.boxW, this.boxH)) this.x = nx;
      if (stuck || map.rectFree(this.x - hw, ny - this.boxH, this.boxW, this.boxH)) this.y = ny;
    }

    /* Scriptli yürüyüş (cutscene): hedefe doğru bir kare ilerle.
       Vardıysa true döner. Collision yok sayılır (yol temiz seçilir). */
    stepToward(tx, ty, dt, speed) {
      const sp = speed || this.speed;
      const dx = tx - this.x, dy = ty - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) { this.moving = false; this.frame = 0; return true; }
      if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 'right' : 'left';
      else this.dir = dy > 0 ? 'down' : 'up';
      const step = Math.min(dist, sp * dt);
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
      this.moving = true;
      this.animT += dt;
      this.frame = 1 + Math.floor(this.animT / 0.09) % WALK_FRAMES;
      return false;
    }

    draw(ctx, cam) {
      const sx = Math.round(this.x - FRAME_SIZE / 2 - cam.x);
      const sy = Math.round(this.y - FRAME_SIZE + 6 - cam.y);  // ayaklar y'ye oturur
      if (this.sheet && this.sheet.complete && this.sheet.naturalWidth) {
        ctx.drawImage(this.sheet,
          this.frame * FRAME_SIZE, ROW_ORDER[this.dir] * FRAME_SIZE,
          FRAME_SIZE, FRAME_SIZE, sx, sy, FRAME_SIZE, FRAME_SIZE);
      } else {
        // Sprite yoksa placeholder
        ctx.fillStyle = '#b06a8a';
        ctx.fillRect(sx + 20, sy + 16, 24, 44);
      }
    }
  }

  G.Player = Player;
  G.SPRITE = { ROW_ORDER, FRAME_SIZE, WALK_FRAMES };
})();
