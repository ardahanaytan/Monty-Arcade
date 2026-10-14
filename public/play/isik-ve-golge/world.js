/*
 * Işık ve Gölge — oyun mantığı (DOM yok; Node'da test edilir).
 * Sabit adım fizik, karo çarpışması, iki karakter, perdeler, çıkışlar, toplanabilirler, kıvılcım itmesi.
 * Harita karakterleri: bkz. levels.js
 */
(function (root) {
  'use strict';

  const TILE = 32;
  /** Hareket hissi (TASARIM §3): orta ivme, havada az kontrol. Sayılar prototipte ayarlanır. */
  const PHYS = {
    maxRun: 230, // px/sn
    accel: 575, // tam hıza ~0,4 sn
    friction: 900, // bırakınca ~bir karakter boyu kayar (230²/(2·900) ≈ 29 px)
    airAccel: 400, // havada orta kontrol (~0,6 sn'de tam hız); momentum yine korunur
    gravity: 1900,
    jumpV: 640, // ~3,3 karo yükseklik
    jumpCut: 0.5, // tuş erken bırakılırsa
    maxFall: 820,
    coyote: 0.06,
    buffer: 0.1,
  };
  const HERO = { w: 22, h: 34 };
  // kıvılcım itmesi: bağıl hızla güçlenir (durana çarpmak ~450, karşılıklı koşmak 640 px/sn). Havadaki biri fırlatılırsa boşluk aşar.
  const SPARK = { base: 200, perRel: 1.1, max: 640, cooldown: 0.3, hop: 170 };
  const PUSH_MAX = 110; // kutu iterken azami hız (px/sn)
  const BOX = 32;
  const LANTERN_REACH = 44; // kandile bu kadar yakın olan dokunmuş sayılır (duvara gömülü kandilin önündeki kutunun arkasından da erişilir)
  const LB = 34; // kandil huzmesinin kalınlığı: karakter boyunda, zıplayarak aşılamaz
  const SDOOR_SPEED = 1.8; // taş kapı: tam açılma ~0,55 sn
  const DOOR_HOLD = 0.55; // ikisi de kapıdayken bölümün bitmesi için bekleme (sn)

  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  /** Bu karakter için bu karo katı mı? (#: herkes · l: Işık perdesi, Gölge'ye katı · d: karanlık perde, Işık'a katı) */
  function solidFor(kind, ch) {
    if (ch === '#') return true;
    if (ch === 'l') return kind === 'shadow';
    if (ch === 'd') return kind === 'light';
    return false;
  }

  class World {
    constructor(level) {
      this.level = level;
      this.cols = level.cols;
      this.rows = level.rows;
      this.tiles = level.tiles.map((r) => r.split(''));
      this.time = 0;
      this.state = 'play'; // play | won | dead
      this.deadT = 0;
      this.deadCause = null;
      this.stateT = 0;
      this.doorT = 0;
      this.events = [];
      this.heroes = {
        light: this.makeHero('light', level.starts.light),
        shadow: this.makeHero('shadow', level.starts.shadow),
      };
      this.list = [this.heroes.light, this.heroes.shadow];
      this.doors = level.doors.map((d) => ({ kind: d.kind, c: d.c, r: d.r, x: d.c * TILE, y: (d.r - 1) * TILE, w: TILE, h: TILE * 2, open: 0 }));
      this.items = level.items.map((it, i) => ({ id: i, kind: it.kind, x: it.c * TILE + TILE / 2, y: it.r * TILE + TILE / 2, taken: false }));
      /** Kandil: Işık dokununca yanar, Gölge dokununca söner. Yanıkken dokunduğu yönde ışık huzmesi yayar (Gölge için ölümcül) ve bağlı kapıyı açar. */
      this.lanterns = (level.lanterns || []).map((l) => ({ ...l, lit: !!l.lit }));
      this.beamSrc = (level.beams || []).map((b) => ({ ...b, kind: 'static' }));
      this.beams = [];
      /** Kaldıraç: iki konumlu, kalıcı. 'right' = açık. Karakter hangi yönden içinden geçerse o yöne yatar. */
      this.levers = (level.levers || []).map((l) => ({ ...l, pos: 'left', x: l.c * TILE + TILE / 2 }));
      /** Basınç plakası: üstünde ağırlık olduğu sürece aktif. */
      this.plates = (level.plates || []).map((p) => ({ ...p, down: false, rect: { x: p.c * TILE + 3, y: (p.r + 1) * TILE - 6, w: TILE - 6, h: 6 } }));
      /** Taş kapı: c sütunu, r0..r1 satırları; yukarı kayarak açılır. */
      this.sdoors = (level.sdoors || []).map((d) => ({ ...d, open: 0, len: d.r1 - d.r0 + 1 }));
      this.force = new Set(); // testler: bu gruplar sanki açılmış sayılır
      /** İtilebilir kutu: karakterler iter (yavaş), yerçekimi, plakayı basılı tutar, basamak olur. */
      this.boxes = (level.boxes || []).map((b) => ({ x: b.c * TILE, y: (b.r + 1) * TILE - BOX, w: BOX, h: BOX, vy: 0, onGround: false }));
      this.updateBeams();
      this.collected = { star: 0, feather: 0 };
      this.total = { star: this.items.filter((i) => i.kind === 'star').length, feather: this.items.filter((i) => i.kind === 'feather').length };
    }

    makeHero(kind, s) {
      return {
        kind,
        x: s.c * TILE + (TILE - HERO.w) / 2,
        y: (s.r + 1) * TILE - HERO.h,
        w: HERO.w,
        h: HERO.h,
        vx: 0,
        vy: 0,
        onGround: false,
        face: kind === 'light' ? 1 : -1,
        coyote: 0,
        buffer: 0,
        prevJump: false,
        jumping: false,
        walk: 0,
        squash: 1,
        inDoor: false,
        sparkCD: 0,
        bumpCD: 0,
        landV: 0,
        dead: false,
        pcx: 0,
        immune: false, // testler: tehlikelerden etkilenmez
        wet: false,
      };
    }

    emit(type, data = {}) {
      this.events.push({ type, ...data });
    }

    tileAt(c, r) {
      if (c < 0 || c >= this.cols || r < 0) return '#';
      if (r >= this.rows) return '.';
      return this.tiles[r][c];
    }

    // --- Çarpışma ---
    /** Taş kapının şu an kapalı olan satır sayısı (yukarıdan aşağı). */
    closedRows(d) {
      return Math.ceil(d.len * (1 - d.open) - 1e-6);
    }
    blocked(kind, c, r) {
      if (solidFor(kind, this.tileAt(c, r))) return true;
      for (const d of this.sdoors) if (d.c === c && r >= d.r0 && r < d.r0 + this.closedRows(d)) return true;
      return false;
    }
    /** x ekseninde dx kadar ilerler; çarpılan karoyu döner (yoksa null). */
    moveX(h, dx) {
      h.x += dx;
      if (dx === 0) return null;
      const r0 = Math.floor(h.y / TILE);
      const r1 = Math.floor((h.y + h.h - 0.001) / TILE);
      const c = dx > 0 ? Math.floor((h.x + h.w - 0.001) / TILE) : Math.floor(h.x / TILE);
      for (let r = r0; r <= r1; r++) {
        const ch = this.tileAt(c, r);
        if (this.blocked(h.kind, c, r)) {
          h.x = dx > 0 ? c * TILE - h.w : (c + 1) * TILE;
          return ch;
        }
      }
      // kutular: itilir; itilemiyorsa katı
      for (const b of this.boxes) {
        if (!overlap(h, b)) continue;
        const push = dx > 0 ? h.x + h.w - b.x : h.x - (b.x + b.w);
        const moved = this.moveBoxX(b, push, h);
        if (Math.abs(moved - push) > 1e-6) {
          h.x -= push - moved;
          return 'box';
        }
      }
      return null;
    }
    /** Kutuyu x'te ilerletir; engel varsa durur. Gerçekte kat edilen mesafeyi döner. */
    moveBoxX(b, dx, pusher) {
      const old = b.x;
      b.x += dx;
      const r0 = Math.floor(b.y / TILE);
      const r1 = Math.floor((b.y + b.h - 0.001) / TILE);
      const c = dx > 0 ? Math.floor((b.x + b.w - 0.001) / TILE) : Math.floor(b.x / TILE);
      for (let r = r0; r <= r1; r++) {
        if (this.boxBlocked(c, r)) {
          b.x = dx > 0 ? c * TILE - b.w : (c + 1) * TILE;
          break;
        }
      }
      for (const o of this.boxes) if (o !== b && overlap(b, o)) b.x = dx > 0 ? o.x - b.w : o.x + o.w;
      for (const h of this.list) if (h !== pusher && overlap(b, h)) b.x = dx > 0 ? h.x - b.w : h.x + h.w;
      return b.x - old;
    }
    boxBlocked(c, r) {
      const ch = this.tileAt(c, r);
      if (ch === '#' || ch === 'l' || ch === 'd') return true;
      for (const d of this.sdoors) if (d.c === c && r >= d.r0 && r < d.r0 + this.closedRows(d)) return true;
      return false;
    }
    updateBoxes(dt) {
      for (const b of this.boxes) {
        b.vy = Math.min(700, b.vy + PHYS.gravity * dt);
        b.y += b.vy * dt;
        b.onGround = false;
        const c0 = Math.floor(b.x / TILE);
        const c1 = Math.floor((b.x + b.w - 0.001) / TILE);
        const r = Math.floor((b.y + b.h - 0.001) / TILE);
        for (let c = c0; c <= c1; c++) {
          if (this.boxBlocked(c, r)) {
            b.y = r * TILE - b.h;
            b.vy = 0;
            b.onGround = true;
            break;
          }
        }
        for (const o of this.boxes) if (o !== b && overlap(b, o) && b.y < o.y) {
          b.y = o.y - b.h;
          b.vy = 0;
          b.onGround = true;
        }
        for (const h of this.list) if (overlap(b, h) && b.y < h.y && b.vy >= 0) {
          b.y = h.y - b.h;
          b.vy = 0;
          b.onGround = true;
        }
      }
    }
    moveY(h, dy) {
      h.y += dy;
      if (dy === 0) return null;
      const c0 = Math.floor(h.x / TILE);
      const c1 = Math.floor((h.x + h.w - 0.001) / TILE);
      const r = dy > 0 ? Math.floor((h.y + h.h - 0.001) / TILE) : Math.floor(h.y / TILE);
      for (let c = c0; c <= c1; c++) {
        const ch = this.tileAt(c, r);
        if (this.blocked(h.kind, c, r)) {
          h.y = dy > 0 ? r * TILE - h.h : (r + 1) * TILE;
          return ch;
        }
      }
      for (const b of this.boxes) {
        if (!overlap(h, b)) continue;
        h.y = dy > 0 ? b.y - h.h : b.y + b.h;
        return 'box';
      }
      return null;
    }

    // --- Adım ---
    step(dt, inp) {
      this.time += dt;
      if (this.state === 'dead') {
        this.deadT += dt;
        return;
      }
      if (this.state === 'won') {
        this.stateT += dt;
        for (const d of this.doors) d.open = Math.min(1, d.open + dt * 3);
        // kazanırken karakterler yavaşça durur
        for (const h of this.list) {
          h.vx *= Math.max(0, 1 - dt * 8);
          this.simulate(h, dt, {});
        }
        return;
      }
      for (const h of this.list) h.pcx = h.x + h.w / 2;
      for (const h of this.list) this.simulate(h, dt, (inp && inp[h.kind]) || {});
      this.updateBoxes(dt);
      this.triggers(dt);
      this.updateBeams();
      this.hazards();
      if (this.state === 'dead') return;
      this.sparks(dt);
      this.pickups();
      this.doorsStep(dt);
    }

    simulate(h, dt, i) {
      h.sparkCD = Math.max(0, h.sparkCD - dt);
      h.bumpCD = Math.max(0, h.bumpCD - dt);
      const dir = (i.right ? 1 : 0) - (i.left ? 1 : 0);
      if (dir) h.face = dir;

      // karanlık su: Gölge yüzer gibi geçer (yavaş, hafif); Işık için ölümcül (hazards)
      h.wet = h.kind === 'shadow' && this.tileAt(Math.floor((h.x + h.w / 2) / TILE), Math.floor((h.y + h.h / 2) / TILE)) === 'w';
      // yatay ivme
      if (h.onGround) {
        if (dir === 0) {
          const f = PHYS.friction * dt;
          h.vx = Math.abs(h.vx) <= f ? 0 : h.vx - Math.sign(h.vx) * f;
        } else if (Math.sign(h.vx) === -dir) {
          h.vx += dir * PHYS.friction * dt; // ters yöne dönüş
        } else if (Math.abs(h.vx) < PHYS.maxRun) {
          h.vx = Math.max(-PHYS.maxRun, Math.min(PHYS.maxRun, h.vx + dir * PHYS.accel * dt));
        } else if (Math.abs(h.vx) > PHYS.maxRun + 0.5) {
          h.vx -= Math.sign(h.vx) * PHYS.friction * dt; // fırlatmadan kalan fazla hız yerde sönümlenir
        }
      } else if (dir !== 0) {
        // havada orta kontrol: yön rahatça değişir, hız artırılabilir ama momentum (sürtünmesizlik) korunur
        const a = Math.sign(h.vx) === -dir ? PHYS.airAccel * 1.5 : PHYS.airAccel;
        if (Math.sign(h.vx) === -dir || Math.abs(h.vx) < PHYS.maxRun) h.vx += dir * a * dt;
        if (Math.sign(h.vx) === dir && Math.abs(h.vx) > PHYS.maxRun && Math.sign(h.vx) !== -dir) h.vx = Math.max(h.vx - dir * a * dt, Math.sign(h.vx) * PHYS.maxRun);
      }

      // zıplama
      const pressed = !!i.jump && !h.prevJump;
      h.prevJump = !!i.jump;
      if (pressed) h.buffer = PHYS.buffer;
      else h.buffer = Math.max(0, h.buffer - dt);
      h.coyote = h.onGround ? PHYS.coyote : Math.max(0, h.coyote - dt);
      h.hopCD = Math.max(0, (h.hopCD || 0) - dt);
      if (h.wet && i.jump && !h.onGround && h.hopCD <= 0) {
        // yüzeye yakınken (zıplama tuşu basılıysa) suyun dışına sıçra
        const above = this.tileAt(Math.floor((h.x + h.w / 2) / TILE), Math.floor((h.y + 4) / TILE));
        if (above !== 'w') {
          h.vy = -PHYS.jumpV * 0.8;
          h.hopCD = 0.4;
        }
      }
      if (h.buffer > 0 && (h.onGround || h.coyote > 0)) {
        h.vy = h.wet ? -330 : -PHYS.jumpV;
        h.onGround = false;
        h.coyote = 0;
        h.buffer = 0;
        h.jumping = true;
        h.squash = 1.25;
        this.emit('jump', { kind: h.kind, x: h.x + h.w / 2, y: h.y + h.h });
      }
      if (h.jumping && !i.jump && h.vy < 0) {
        h.vy *= PHYS.jumpCut;
        h.jumping = false;
      }

      // yerçekimi ve hareket
      if (h.wet) {
        h.vy = Math.min(150, h.vy + PHYS.gravity * 0.3 * dt);
        if (i.jump && h.vy > -170) h.vy = Math.max(h.vy - 1700 * dt, -170); // zıplama tuşu: yukarı yüz (sıçrama hızını kırpmaz)
        h.vx = Math.max(-PHYS.maxRun * 0.75, Math.min(PHYS.maxRun * 0.75, h.vx));
      } else h.vy = Math.min(PHYS.maxFall, h.vy + PHYS.gravity * dt);
      const wasGround = h.onGround;
      if (h.vx !== 0 && this.boxes.some((b) => overlap({ x: h.x + Math.sign(h.vx) * 2, y: h.y, w: h.w, h: h.h }, b))) h.vx = Math.max(-PUSH_MAX, Math.min(PUSH_MAX, h.vx));
      const hit = this.moveX(h, h.vx * dt);
      if (hit) {
        if ((hit === 'l' || hit === 'd') && h.bumpCD <= 0 && Math.abs(h.vx) > 20) {
          // yanlış perde: Öldürmez, sadece engeller ve geri sektirir
          this.emit('curtain', { kind: h.kind, ch: hit, x: h.vx > 0 ? h.x + h.w : h.x, y: h.y + h.h / 2 });
          h.bumpCD = 0.25;
          h.vx = -h.vx * 0.3;
        } else h.vx = 0;
      }
      const vy0 = h.vy;
      const hy = this.moveY(h, h.vy * dt);
      if (hy) {
        if (vy0 > 0) {
          h.onGround = true;
          if (!wasGround && vy0 > 260) {
            h.squash = 0.78;
            this.emit('land', { kind: h.kind, x: h.x + h.w / 2, y: h.y + h.h, power: vy0 });
          }
        }
        h.vy = 0;
        h.jumping = false;
      } else h.onGround = false;
      if (h.onGround && Math.abs(h.vx) > 8) h.walk += Math.abs(h.vx) * dt * 0.06;
      h.squash += (1 - h.squash) * Math.min(1, dt * 14);
    }

    // --- Kaldıraç, plaka, taş kapı ---
    triggers(dt) {
      // kaldıraç: içinden geçen karakterin yönüne yatar
      for (const l of this.levers) {
        const zone = { x: l.c * TILE, y: l.r * TILE, w: TILE, h: TILE };
        for (const h of this.list) {
          if (h.dead || !overlap(h, zone)) continue;
          const cx = h.x + h.w / 2;
          let pos = null;
          if (h.pcx < l.x && cx >= l.x) pos = 'right';
          else if (h.pcx > l.x && cx <= l.x) pos = 'left';
          if (pos && pos !== l.pos) {
            l.pos = pos;
            this.emit('lever', { x: l.x, y: l.r * TILE + TILE / 2, pos, group: l.group });
          }
        }
      }
      // plaka
      for (const p of this.plates) {
        const was = p.down;
        p.down = this.list.some((h) => !h.dead && overlap(h, p.rect)) || this.boxes.some((b) => overlap(b, p.rect));
        if (p.down !== was) this.emit('plate', { x: p.c * TILE + TILE / 2, y: (p.r + 1) * TILE, down: p.down, group: p.group });
      }
      // kandiller: Işık yakar, Gölge söndürür (yakınlık yeterli)
      for (const l of this.lanterns) {
        const zone = { x: l.c * TILE - LANTERN_REACH, y: l.r * TILE - 4, w: TILE + LANTERN_REACH * 2, h: TILE + 8 };
        const was = l.lit;
        if (this.heroes.light && !this.heroes.light.dead && overlap(this.heroes.light, zone)) l.lit = true;
        if (this.heroes.shadow && !this.heroes.shadow.dead && overlap(this.heroes.shadow, zone)) l.lit = false;
        if (l.lit !== was) this.emit('lantern', { x: l.c * TILE + TILE / 2, y: l.r * TILE + TILE / 2, lit: l.lit });
      }
      // taş kapılar
      for (const d of this.sdoors) {
        const lamps = this.lanterns.filter((l) => l.group === d.group);
        const lampOn = d.inv ? lamps.length > 0 && lamps.every((l) => !l.lit) : lamps.some((l) => l.lit);
        const on = this.force.has(d.group) || lampOn || this.levers.some((l) => l.group === d.group && l.pos === 'right') || this.plates.some((p) => p.group === d.group && p.down);
        const was = d.open;
        if (on) d.open = Math.min(1, d.open + dt * SDOOR_SPEED);
        else {
          const next = Math.max(0, d.open - dt * SDOOR_SPEED);
          // altında biri varsa kapanma (ezme yok)
          const rows = Math.ceil(d.len * (1 - next) - 1e-6);
          const rect = { x: d.c * TILE, y: d.r0 * TILE, w: TILE, h: rows * TILE };
          if (!this.list.some((h) => overlap(h, rect)) && !this.boxes.some((b) => overlap(b, rect))) d.open = next;
        }
        if ((was === 0) !== (d.open === 0) || (was === 1) !== (d.open === 1)) this.emit('sdoor', { x: d.c * TILE + TILE / 2, y: (d.r0 + d.len / 2) * TILE, open: d.open > was });
      }
    }

    // --- Huzmeler: yayıcıdan ilk duvara / kapalı taş kapıya / kutuya kadar; her adımda yeniden hesaplanır ---
    rayBlocked(c, r) {
      if (this.tileAt(c, r) === '#') return true;
      for (const d of this.sdoors) if (d.c === c && r >= d.r0 && r < d.r0 + this.closedRows(d)) return true;
      return false;
    }
    updateBeams() {
      const out = [];
      for (const s of this.beamSrc) out.push(this.traceBeam(s));
      for (const l of this.lanterns) if (l.lit) {
        const t = this.traceLantern(l);
        if (t) out.push(t);
      }
      this.beams = out;
    }
    /** Kandil huzmesi: kandilin merkezinden başlar, karakter boyunda (zemine hizalı), kutu ve kapalı kapı keser. */
    traceLantern(l) {
      const d = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] }[l.dir];
      let c = l.c + d[0];
      let r = l.r + d[1];
      while (!this.rayBlocked(c, r)) {
        c += d[0];
        r += d[1];
      }
      const horiz = d[1] === 0;
      const ox = l.c * TILE + TILE / 2;
      const oy = l.r * TILE + TILE / 2;
      let rect;
      if (horiz) {
        const y = (l.r + 1) * TILE - LB;
        const x1 = d[0] > 0 ? c * TILE : (c + 1) * TILE;
        let end = x1;
        for (const b of this.boxes) {
          if (b.y >= y + LB || b.y + b.h <= y) continue;
          if (d[0] > 0 && b.x + b.w > ox && b.x < end) end = Math.max(ox, b.x);
          if (d[0] < 0 && b.x < ox && b.x + b.w > end) end = Math.min(ox, b.x + b.w);
        }
        const w = Math.abs(end - ox);
        if (w < 2) return null;
        rect = { x: Math.min(ox, end), y, w, h: LB };
      } else {
        const x = l.c * TILE + TILE / 2 - LB / 2;
        const y1 = d[1] > 0 ? r * TILE : (r + 1) * TILE;
        let end = y1;
        for (const b of this.boxes) {
          if (b.x >= x + LB || b.x + b.w <= x) continue;
          if (d[1] > 0 && b.y + b.h > oy && b.y < end) end = Math.max(oy, b.y);
          if (d[1] < 0 && b.y < oy && b.y + b.h > end) end = Math.min(oy, b.y + b.h);
        }
        const h = Math.abs(end - oy);
        if (h < 2) return null;
        rect = { x, y: Math.min(oy, end), w: LB, h };
      }
      return { c: l.c, r: l.r, dir: l.dir, ...rect, horiz, lantern: true };
    }
    traceBeam(b) {
      const d = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] }[b.dir];
      let c = b.c + d[0];
      let r = b.r + d[1];
      const c0 = c;
      const r0 = r;
      while (!this.rayBlocked(c, r)) {
        c += d[0];
        r += d[1];
      }
      const c1 = c - d[0];
      const r1 = r - d[1];
      const horiz = d[1] === 0;
      const x0 = Math.min(c0, c1) * TILE;
      const y0 = Math.min(r0, r1) * TILE;
      const len = (Math.abs(c1 - c0) + Math.abs(r1 - r0) + 1) * TILE;
      const rect = horiz ? { x: x0, y: b.r * TILE + TILE / 2 - 5, w: len, h: 10 } : { x: b.c * TILE + TILE / 2 - 5, y: y0, w: 10, h: len };
      return { c: b.c, r: b.r, dir: b.dir, ...rect, horiz };
    }

    // --- Ölümcül tehlikeler ---
    /** Işık: karanlık su söndürür. Gölge: ışık huzmesi yok eder. */
    hazards() {
      for (const h of this.list) {
        if (h.dead || h.immune) continue;
        if (h.kind === 'light') {
          const t = this.tileAt(Math.floor((h.x + h.w / 2) / TILE), Math.floor((h.y + h.h / 2) / TILE));
          if (t === 'w') this.die(h, 'water');
        } else {
          const box = { x: h.x + 3, y: h.y + 3, w: h.w - 6, h: h.h - 6 };
          for (const b of this.beams) if (overlap(box, b)) this.die(h, 'beam');
        }
        if (this.state === 'dead') return;
      }
    }
    die(h, cause) {
      h.dead = true;
      h.vx = 0;
      h.vy = 0;
      this.state = 'dead';
      this.deadT = 0;
      this.deadCause = cause;
      this.emit('death', { kind: h.kind, cause, x: h.x + h.w / 2, y: h.y + h.h / 2 });
    }

    // --- Kıvılcım itmesi: dokunacak kadar yaklaşırlarsa ikisi de geri seker ---
    sparks() {
      const a = this.heroes.light;
      const b = this.heroes.shadow;
      const pad = 1;
      const A = { x: a.x - pad, y: a.y - pad, w: a.w + 2 * pad, h: a.h + 2 * pad };
      if (!overlap(A, b)) return;
      if (a.sparkCD > 0 || b.sparkCD > 0) return;
      const dir = a.x + a.w / 2 <= b.x + b.w / 2 ? -1 : 1; // Işık'ın itildiği yön
      const rel = Math.abs(a.vx - b.vx);
      const kick = Math.min(SPARK.max, SPARK.base + SPARK.perRel * rel);
      a.vx = dir * kick;
      b.vx = -dir * kick;
      if (a.onGround) a.vy = -SPARK.hop;
      if (b.onGround) b.vy = -SPARK.hop;
      a.sparkCD = b.sparkCD = SPARK.cooldown;
      // üst üste binmişlerse yatayda ayır
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      if (ox > 0) {
        this.moveX(a, (dir * ox) / 2 + dir * 0.5);
        this.moveX(b, (-dir * ox) / 2 - dir * 0.5);
      }
      this.emit('spark', { x: (a.x + b.x + a.w) / 2, y: (a.y + b.y + a.h) / 2, power: kick });
    }

    pickups() {
      for (const it of this.items) {
        if (it.taken) continue;
        const h = it.kind === 'star' ? this.heroes.light : this.heroes.shadow;
        const dx = h.x + h.w / 2 - it.x;
        const dy = h.y + h.h / 2 - it.y;
        if (dx * dx + dy * dy < 22 * 22) {
          it.taken = true;
          this.collected[it.kind]++;
          this.emit('pickup', { kind: it.kind, x: it.x, y: it.y });
        }
      }
    }

    doorsStep(dt) {
      for (const h of this.list) {
        const d = this.doors.find((x) => x.kind === h.kind);
        const cx = h.x + h.w / 2;
        const was = h.inDoor;
        h.inDoor = !!d && h.onGround && cx > d.x + 4 && cx < d.x + d.w - 4 && h.y + h.h > d.y + d.h - 6 && h.y + h.h < d.y + d.h + 6;
        if (h.inDoor && !was) this.emit('doorin', { kind: h.kind });
      }
      for (const d of this.doors) {
        const inside = this.heroes[d.kind].inDoor;
        d.open += ((inside ? 1 : 0) - d.open) * Math.min(1, dt * 10);
      }
      if (this.heroes.light.inDoor && this.heroes.shadow.inDoor) {
        this.doorT += dt;
        if (this.doorT >= DOOR_HOLD) {
          this.state = 'won';
          this.stateT = 0;
          this.emit('won', {});
        }
      } else this.doorT = 0;
    }
  }

  const api = { World, TILE, PHYS, HERO, SPARK, solidFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.IVGWorld = api;
})(typeof self !== 'undefined' ? self : this);
