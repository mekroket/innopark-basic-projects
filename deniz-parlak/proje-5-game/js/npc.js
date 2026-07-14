/* ============================================================
   npc.js — NPC sınıfı
   Aynı LPC sheet düzeni. Sabit durabilir, waypoint listesi yürüyebilir,
   silüet (karartılmış) çizilebilir. Depth sorting main.js'te yapılır.
   ============================================================ */
(function () {
  'use strict';
  window.G = window.G || {};

  const { ROW_ORDER, FRAME_SIZE, WALK_FRAMES } = G.SPRITE;

  class NPC {
    constructor(key, x, y, opts) {
      opts = opts || {};
      this.key = key;                     // G.CHARS anahtarı (sprite + portre + isim)
      this.x = x; this.y = y;             // ayak merkezi
      this.dir = opts.dir || 'down';
      this.speed = opts.speed || 150;
      this.visible = opts.visible !== false;
      this.silhouette = !!opts.silhouette;  // karanlıkta beliren çocuk vb.
      this.alpha = opts.alpha != null ? opts.alpha : 1;
      this.moving = false;
      this.animT = 0;
      this.frame = 0;
      this._target = null;                // {x,y,resolve}
    }

    get sheet() {
      const c = G.CHARS[this.key];
      return c ? c.sheetImg : null;
    }

    face(dir) { this.dir = dir; this.moving = false; this.frame = 0; }

    /* Oyuncuya dön */
    facePlayer(player) {
      const dx = player.x - this.x, dy = player.y - this.y;
      if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 'right' : 'left';
      else this.dir = dy > 0 ? 'down' : 'up';
    }

    /* Hedefe yürü — Promise döner (cutscene await için). */
    walkTo(x, y, speed) {
      return new Promise(resolve => {
        this._target = { x, y, resolve };
        if (speed) this.speed = speed;
      });
    }

    /* Anında ışınla */
    place(x, y, dir) {
      this.x = x; this.y = y;
      if (dir) this.dir = dir;
      this._target = null;
      this.moving = false; this.frame = 0;
    }

    update(dt) {
      if (!this._target) { if (this.moving) { this.moving = false; this.frame = 0; } return; }
      const t = this._target;
      const dx = t.x - this.x, dy = t.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) {
        this.x = t.x; this.y = t.y;
        this.moving = false; this.frame = 0;
        this._target = null;
        t.resolve();
        return;
      }
      if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 'right' : 'left';
      else this.dir = dy > 0 ? 'down' : 'up';
      const step = Math.min(dist, this.speed * dt);
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
      this.moving = true;
      this.animT += dt;
      this.frame = 1 + Math.floor(this.animT / 0.1) % WALK_FRAMES;
    }

    draw(ctx, cam) {
      if (!this.visible) return;
      const sx = Math.round(this.x - FRAME_SIZE / 2 - cam.x);
      const sy = Math.round(this.y - FRAME_SIZE + 6 - cam.y);
      const img = this.sheet;
      ctx.save();
      ctx.globalAlpha = this.alpha;
      if (img && img.complete && img.naturalWidth) {
        if (this.silhouette) {
          // Silüet: sprite'ı simsiyaha yakın çiz (karanlıkta beliren figür)
          ctx.filter = 'brightness(0.18) contrast(1.2)';
        }
        ctx.drawImage(img,
          this.frame * FRAME_SIZE, ROW_ORDER[this.dir] * FRAME_SIZE,
          FRAME_SIZE, FRAME_SIZE, sx, sy, FRAME_SIZE, FRAME_SIZE);
      } else {
        ctx.fillStyle = this.silhouette ? '#0a0a0c' : '#557';
        ctx.fillRect(sx + 20, sy + 16, 24, 44);
      }
      ctx.restore();
    }
  }

  G.NPC = NPC;
})();
