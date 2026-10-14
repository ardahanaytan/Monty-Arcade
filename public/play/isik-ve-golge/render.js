/*
 * Işık ve Gölge — çizim. Minimal + parıltı: koyu zindan, geometrik platformlar, Işık sıcak parlayan figür,
 * Gölge mor-siyah ve kenarları bulanık. Hepsi Canvas ile (dosya yok).
 */
(function (root) {
  'use strict';

  const { TILE } = root.IVGWorld;
  const VW = 1280;
  const VH = 704;

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rnd = (i, k = 0) => {
    const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function glow(ctx, x, y, r, rgb, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  const REGIONS = {
    dungeon: { top: '#070a1a', bottom: '#151a37', brick: '#222a4f', edge: '#3a4580', deep: '#10152e', fog: '120,130,190' },
  };

  // --- Arka plan ---
  function drawBackground(ctx, w, t) {
    const R = REGIONS[w.level.region] || REGIONS.dungeon;
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, R.top);
    g.addColorStop(1, R.bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);
    // uzak kemerler
    ctx.fillStyle = 'rgba(8,11,28,.55)';
    for (let i = 0; i < 6; i++) {
      const x = 80 + i * 230;
      ctx.fillRect(x, 60, 46, VH);
      ctx.beginPath();
      ctx.arc(x + 115, 220, 69, Math.PI, 0);
      ctx.fill();
    }
    // sis bantları
    for (let i = 0; i < 3; i++) {
      const y = 330 + i * 120;
      const gx = (t * (6 + i * 3) + i * 300) % (VW + 400);
      glow(ctx, VW - gx + 100, y, 380, R.fog, 0.05);
    }
    // toz zerrecikleri
    for (let i = 0; i < 40; i++) {
      const x = (rnd(i, 1) * VW + t * (4 + rnd(i, 2) * 8)) % VW;
      const y = (rnd(i, 3) * VH - t * (3 + rnd(i, 4) * 6) + VH * 4) % VH;
      ctx.fillStyle = `rgba(200,210,255,${0.08 + rnd(i, 5) * 0.12})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }

  // --- Karolar ---
  function solidAt(w, c, r) {
    return w.tileAt(c, r) === '#';
  }
  function drawTiles(ctx, w, t) {
    const R = REGIONS[w.level.region] || REGIONS.dungeon;
    for (let r = 0; r < w.rows; r++) {
      for (let c = 0; c < w.cols; c++) {
        const ch = w.tiles[r][c];
        const x = c * TILE;
        const y = r * TILE;
        if (ch === '#') {
          const v = rnd(c * 31 + r * 17);
          ctx.fillStyle = R.brick;
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = `rgba(255,255,255,${0.02 + v * 0.03})`;
          ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
          // tuğla çizgileri
          ctx.fillStyle = 'rgba(0,0,0,.28)';
          ctx.fillRect(x, y + TILE / 2 - 1, TILE, 2);
          ctx.fillRect(x + ((r % 2) * 16 + 8), y, 2, TILE / 2);
          ctx.fillRect(x + (((r + 1) % 2) * 16 + 8), y + TILE / 2, 2, TILE / 2);
          // yüzey parlaması (üstü boşsa)
          if (!solidAt(w, c, r - 1)) {
            ctx.fillStyle = R.edge;
            ctx.fillRect(x, y, TILE, 3);
          }
          if (!solidAt(w, c, r + 1)) {
            ctx.fillStyle = 'rgba(0,0,0,.35)';
            ctx.fillRect(x, y + TILE - 3, TILE, 3);
          }
        }
      }
    }
    // perdeler (sütun bazında sürekli çizilir)
    for (let c = 0; c < w.cols; c++) {
      let r = 0;
      while (r < w.rows) {
        const ch = w.tiles[r][c];
        if (ch !== 'l' && ch !== 'd') {
          r++;
          continue;
        }
        let r1 = r;
        while (r1 + 1 < w.rows && w.tiles[r1 + 1][c] === ch) r1++;
        drawCurtain(ctx, ch, c * TILE, r * TILE, TILE, (r1 - r + 1) * TILE, t, w.curtainFlash ? w.curtainFlash[c] || 0 : 0);
        r = r1 + 1;
      }
    }
  }
  function drawCurtain(ctx, ch, x, y, w, h, t, flash) {
    const lightC = ch === 'l';
    const rgb = lightC ? '255,214,130' : '150,100,255';
    ctx.save();
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, `rgba(${rgb},0)`);
    g.addColorStop(0.5, `rgba(${rgb},${0.38 + flash * 0.4})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = lightC ? g : g;
    ctx.fillRect(x - 6, y, w + 12, h);
    if (!lightC) {
      ctx.fillStyle = `rgba(20,8,48,${0.5 + flash * 0.2})`;
      ctx.fillRect(x + 8, y, w - 16, h);
    }
    // süzülen çizgiler
    ctx.lineWidth = 2;
    ctx.strokeStyle = `rgba(${rgb},${0.55 + flash * 0.4})`;
    for (let i = 0; i < 3; i++) {
      const px = x + 8 + i * 8 + Math.sin(t * 1.6 + i + y * 0.05) * 3;
      ctx.beginPath();
      ctx.moveTo(px, y);
      for (let yy = 0; yy <= h; yy += 8) ctx.lineTo(px + Math.sin(t * 2.2 + yy * 0.08 + i * 2) * 2.5, y + yy);
      ctx.stroke();
    }
    // rün (üstte): Işık perdesi güneş, karanlık perde hilal
    const cx = x + w / 2;
    const cy = y + 14;
    ctx.fillStyle = `rgba(${rgb},.95)`;
    if (lightC) {
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.fillRect(cx + Math.cos(a) * 9 - 1, cy + Math.sin(a) * 9 - 1, 2, 2);
      }
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a0c3a';
      ctx.beginPath();
      ctx.arc(cx + 4, cy - 2, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // --- Toplanabilirler ---
  function drawItem(ctx, it, t) {
    if (it.taken) return;
    const bob = Math.sin(t * 2.4 + it.id) * 3;
    const x = it.x;
    const y = it.y + bob;
    if (it.kind === 'star') {
      glow(ctx, x, y, 26, '255,214,130', 0.55);
      const s = 7 + Math.sin(t * 5 + it.id) * 1.5;
      ctx.fillStyle = '#fff1c4';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const rad = i % 2 ? s * 0.35 : s;
        ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      glow(ctx, x, y, 26, '170,120,255', 0.5);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.6 + Math.sin(t * 1.8 + it.id) * 0.2);
      ctx.fillStyle = '#b79bff';
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.quadraticCurveTo(7, -2, 0, 11);
      ctx.quadraticCurveTo(-7, -2, 0, -11);
      ctx.fill();
      ctx.strokeStyle = '#2a1a5c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(0, 13);
      ctx.stroke();
      ctx.restore();
    }
  }

  // --- Çıkış kapıları ---
  function drawDoor(ctx, d, t) {
    const lightD = d.kind === 'light';
    const rgb = lightD ? '255,200,110' : '150,100,255';
    const open = d.open;
    glow(ctx, d.x + d.w / 2, d.y + d.h / 2, 70 + open * 40, rgb, 0.18 + open * 0.35);
    // kemer
    ctx.fillStyle = '#0a0d22';
    ctx.beginPath();
    ctx.moveTo(d.x + 2, d.y + d.h);
    ctx.lineTo(d.x + 2, d.y + 18);
    ctx.arc(d.x + d.w / 2, d.y + 18, d.w / 2 - 2, Math.PI, 0);
    ctx.lineTo(d.x + d.w - 2, d.y + d.h);
    ctx.fill();
    const g = ctx.createLinearGradient(0, d.y, 0, d.y + d.h);
    g.addColorStop(0, `rgba(${rgb},${0.25 + open * 0.5})`);
    g.addColorStop(1, `rgba(${rgb},${0.55 + open * 0.4})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(d.x + 6, d.y + d.h);
    ctx.lineTo(d.x + 6, d.y + 18);
    ctx.arc(d.x + d.w / 2, d.y + 18, d.w / 2 - 6, Math.PI, 0);
    ctx.lineTo(d.x + d.w - 6, d.y + d.h);
    ctx.fill();
    ctx.strokeStyle = `rgba(${rgb},.95)`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(d.x + 2, d.y + d.h);
    ctx.lineTo(d.x + 2, d.y + 18);
    ctx.arc(d.x + d.w / 2, d.y + 18, d.w / 2 - 2, Math.PI, 0);
    ctx.lineTo(d.x + d.w - 2, d.y + d.h);
    ctx.stroke();
    // üstteki rün
    const cx = d.x + d.w / 2;
    const cy = d.y - 10 + Math.sin(t * 2) * 2;
    ctx.fillStyle = `rgba(${rgb},.95)`;
    if (lightD) {
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + t * 0.4;
        ctx.fillRect(cx + Math.cos(a) * 10 - 1, cy + Math.sin(a) * 10 - 1, 2, 2);
      }
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0a0d22';
      ctx.beginPath();
      ctx.arc(cx + 4, cy - 2, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- Karakterler ---
  function drawHero(ctx, h, t) {
    const light = h.kind === 'light';
    const cx = h.x + h.w / 2;
    const base = h.y + h.h; // ayak
    const sq = h.squash;
    ctx.save();
    ctx.translate(cx, base);
    ctx.scale((1 / sq) * 0.6 + 0.4, sq);
    const f = h.face;
    const bob = h.onGround && Math.abs(h.vx) > 8 ? Math.abs(Math.sin(h.walk)) * 2 : 0;
    if (light) {
      glow(ctx, 0, -h.h / 2, 90, '255,200,110', 0.35);
      // saç / ışık telleri
      ctx.strokeStyle = 'rgba(255,214,130,.8)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-f * 4, -h.h + 8);
        ctx.quadraticCurveTo(-f * (14 + i * 4), -h.h + 14 + i * 3 + Math.sin(t * 5 + i) * 2 - h.vy * 0.004, -f * (18 + i * 5), -h.h + 26 + i * 4);
        ctx.stroke();
      }
      // gövde
      const g = ctx.createLinearGradient(0, -h.h, 0, 0);
      g.addColorStop(0, '#fff3cf');
      g.addColorStop(1, '#ffb347');
      ctx.fillStyle = g;
      rr(ctx, -9, -h.h + 14 - bob, 18, h.h - 20, 8);
      ctx.fill();
      // ayaklar
      ctx.fillStyle = '#ffcf7a';
      const st = h.onGround ? Math.sin(h.walk * 1.6) * 3 * Math.min(1, Math.abs(h.vx) / 120) : 0;
      ctx.fillRect(-7 + st, -6, 5, 6);
      ctx.fillRect(2 - st, -6, 5, 6);
      // kafa
      ctx.fillStyle = '#fff6dc';
      ctx.beginPath();
      ctx.arc(0, -h.h + 9 - bob, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a4a10';
      ctx.fillRect(f * 2 - 1, -h.h + 8 - bob, 2, 4);
      ctx.fillRect(f * 6 - 1, -h.h + 8 - bob, 2, 4);
    } else {
      ctx.shadowColor = 'rgba(160,110,255,.9)';
      ctx.shadowBlur = 14;
      // bulanık kenarlı gövde
      const g = ctx.createLinearGradient(0, -h.h, 0, 0);
      g.addColorStop(0, '#2a1a52');
      g.addColorStop(1, '#0e0820');
      ctx.fillStyle = g;
      rr(ctx, -9, -h.h + 14 - bob, 18, h.h - 20, 8);
      ctx.fill();
      // duman gibi saçaklar (etek)
      ctx.beginPath();
      ctx.moveTo(-10, -8);
      for (let i = 0; i <= 5; i++) ctx.lineTo(-10 + i * 4, -1 + Math.sin(t * 6 + i * 1.7) * 2.5 + (i % 2) * 2);
      ctx.lineTo(10, -8);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -h.h + 9 - bob, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#1b1040';
      ctx.fill();
      // dalgalanan şal
      ctx.shadowBlur = 8;
      ctx.strokeStyle = 'rgba(120,80,220,.85)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-f * 5, -h.h + 17);
      ctx.quadraticCurveTo(-f * 18, -h.h + 17 + Math.sin(t * 5) * 3 - h.vy * 0.004, -f * 24, -h.h + 24 + Math.sin(t * 6) * 3);
      ctx.stroke();
      ctx.shadowBlur = 0;
      // gözler
      ctx.fillStyle = '#d9c8ff';
      ctx.fillRect(f * 2 - 1, -h.h + 8 - bob, 2, 4);
      ctx.fillRect(f * 6 - 1, -h.h + 8 - bob, 2, 4);
    }
    ctx.restore();
  }

  // --- Sahne ---
  function drawScene(ctx, w, cam, t) {
    drawBackground(ctx, w, t);
    ctx.save();
    ctx.translate(cam.x, cam.y);
    drawTiles(ctx, w, t);
    for (const d of w.doors) drawDoor(ctx, d, t);
    for (const it of w.items) drawItem(ctx, it, t);
    // Işık'ın çevresine hafif aydınlatma
    const L = w.heroes.light;
    glow(ctx, L.x + L.w / 2, L.y + L.h / 2, 150, '255,210,130', 0.1);
    // pasif çizim sırası: Gölge arkada
    drawHero(ctx, w.heroes.shadow, t);
    drawHero(ctx, w.heroes.light, t);
    ctx.restore();
  }

  /** Parçacıklar dünya uzayında. */
  function drawParticles(ctx, parts) {
    for (const p of parts) {
      ctx.globalAlpha = clamp(p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /** Tuş kapsülü; genişliği döner. */
  function keycap(ctx, x, y, label, accent) {
    ctx.font = '700 13px "Space Mono", monospace';
    const w = Math.max(28, ctx.measureText(label).width + 16);
    ctx.fillStyle = 'rgba(243,234,216,.94)';
    rr(ctx, x, y, w, 26, 6);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(x + 4, y + 22, w - 8, 3);
    ctx.fillStyle = '#16193a';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + 17);
    return w;
  }

  root.IVGRender = { VW, VH, drawHeroAt: drawHero, drawScene, drawParticles, keycap, rr, glow, lerp, clamp, rnd };
})(typeof self !== 'undefined' ? self : this);
