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
    courtyard: { top: '#0c1130', bottom: '#222a52', brick: '#2e3868', edge: '#5560a8', deep: '#171d40', fog: '160,150,210' },
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
    const dp = h.deadP || 0;
    ctx.save();
    ctx.globalAlpha = 1 - dp;
    ctx.translate(cx, base - (light ? 0 : dp * 20));
    ctx.scale(((1 / sq) * 0.6 + 0.4) * (light ? 1 - dp * 0.5 : 1 + dp * 0.6), sq * (light ? 1 - dp * 0.3 : 1));
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


  // --- Karanlık su: karakterlerin ÜSTÜNE yarı saydam çizilir (içindekiler batmış görünür) ---
  function drawWater(ctx, w, t) {
    for (let r = 0; r < w.rows; r++) {
      for (let c = 0; c < w.cols; c++) {
        if (w.tiles[r][c] !== 'w') continue;
        const x = c * TILE;
        const y = r * TILE;
        const top = w.tiles[r - 1] && w.tiles[r - 1][c] === 'w' ? 0 : 1;
        const g = ctx.createLinearGradient(0, y, 0, y + TILE);
        g.addColorStop(0, top ? 'rgba(46,20,96,.88)' : 'rgba(30,12,70,.86)');
        g.addColorStop(1, 'rgba(14,6,38,.92)');
        ctx.fillStyle = g;
        ctx.fillRect(x, y + (top ? 3 : 0), TILE, TILE - (top ? 3 : 0));
        if (top) {
          // yüzey dalgası
          ctx.fillStyle = 'rgba(160,110,255,.8)';
          ctx.beginPath();
          ctx.moveTo(x, y + 4);
          for (let k = 0; k <= TILE; k += 4) ctx.lineTo(x + k, y + 3 + Math.sin(t * 2.4 + (x + k) * 0.09) * 2);
          ctx.lineTo(x + TILE, y + 6);
          ctx.lineTo(x, y + 6);
          ctx.fill();
        }
        // dipteki yavaş kıpırtılar
        ctx.fillStyle = 'rgba(150,100,255,.16)';
        const k = ((t * 12 + c * 17 + r * 9) % 28) + 2;
        ctx.fillRect(x + k, y + 10 + ((c + r) % 3) * 6, 3, 2);
      }
    }
  }

  // --- Sabit ışık huzmesi ---
  function drawBeams(ctx, w, t) {
    for (const b of w.beams) {
      if (b.timed && !b.active) {
        // kapalı: yayıcıdan soluk noktalı iz; açılmadan önce yanıp söner
        const a = b.warn ? 0.25 + 0.35 * Math.abs(Math.sin(t * 22)) : 0.1;
        ctx.fillStyle = `rgba(255,236,190,${a})`;
        if (b.horiz) for (let x = b.x; x < b.x + b.w; x += 14) ctx.fillRect(x, b.y + b.h / 2 - 1, 5, 2);
        else for (let y = b.y; y < b.y + b.h; y += 14) ctx.fillRect(b.x + b.w / 2 - 1, y, 2, 5);
        const ex0 = b.c * TILE + TILE / 2;
        const ey0 = b.r * TILE + TILE / 2;
        ctx.fillStyle = '#0a0d22';
        ctx.beginPath();
        ctx.arc(ex0, ey0, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255,244,210,${b.warn ? 0.9 : 0.3})`;
        ctx.beginPath();
        ctx.arc(ex0, ey0, 6, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      const flick = 0.85 + Math.sin(t * 30) * 0.08;
      // geniş parıltı
      const pad = 14;
      ctx.fillStyle = `rgba(255,224,150,${0.12 * flick})`;
      ctx.fillRect(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2);
      ctx.fillStyle = `rgba(255,236,190,${0.35 * flick})`;
      ctx.fillRect(b.x - 5, b.y - 5, b.w + 10, b.h + 10);
      // çekirdek
      ctx.fillStyle = `rgba(255,252,235,${0.95 * flick})`;
      ctx.fillRect(b.x + (b.horiz ? 0 : 2), b.y + (b.horiz ? 2 : 0), b.horiz ? b.w : b.w - 4, b.horiz ? b.h - 4 : b.h);
      // akan kıvılcımlar
      for (let i = 0; i < Math.floor((b.horiz ? b.w : b.h) / 60); i++) {
        const u = (((t * 90 + i * 60) % (b.horiz ? b.w : b.h)) + (b.horiz ? b.w : b.h)) % (b.horiz ? b.w : b.h);
        ctx.fillStyle = 'rgba(255,255,255,.8)';
        if (b.horiz) ctx.fillRect(b.x + b.w - u, b.y + b.h / 2 - 1 + Math.sin(i * 3 + t * 9) * 6, 3, 2);
        else ctx.fillRect(b.x + b.w / 2 - 1 + Math.sin(i * 3 + t * 9) * 6, b.y + u, 2, 3);
      }
      if (b.lantern) continue;
      // yayıcı mercek (duvar karosunda)
      const ex = b.c * TILE + TILE / 2;
      const ey = b.r * TILE + TILE / 2;
      glow(ctx, ex, ey, 40, '255,224,150', 0.5 * flick);
      ctx.fillStyle = '#0a0d22';
      ctx.beginPath();
      ctx.arc(ex, ey, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,244,210,${flick})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }


  // --- Kaldıraç, plaka, taş kapı (aynı gruptakiler aynı renkte rünle işaretlenir) ---
  const GROUP = { red: '255,106,106', blue: '98,170,255', green: '120,230,150', amber: '255,196,90' };
  const gcol = (g) => GROUP[g] || '243,234,216';
  function rune(ctx, g, x, y, s, a = 1) {
    const rgb = gcol(g);
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = `rgba(${rgb},${a})`;
    ctx.fillStyle = `rgba(${rgb},${a})`;
    ctx.lineWidth = 2;
    // her grup farklı bir simge: kırmızı üçgen, mavi daire, yeşil kare, amber artı
    ctx.beginPath();
    if (g === 'red') {
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.9, s * 0.7);
      ctx.lineTo(-s * 0.9, s * 0.7);
      ctx.closePath();
    } else if (g === 'blue') ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2);
    else if (g === 'green') ctx.rect(-s * 0.75, -s * 0.75, s * 1.5, s * 1.5);
    else {
      ctx.moveTo(-s, 0);
      ctx.lineTo(s, 0);
      ctx.moveTo(0, -s);
      ctx.lineTo(0, s);
    }
    ctx.stroke();
    ctx.restore();
  }
  function drawSDoors(ctx, w, t) {
    for (const d of w.sdoors) {
      const x = d.c * TILE;
      const y0 = d.r0 * TILE;
      const full = d.len * TILE;
      const h = full * (1 - d.open);
      const rgb = gcol(d.group);
      // açıkken boşalan oluk
      ctx.fillStyle = 'rgba(5,7,18,.55)';
      ctx.fillRect(x + 6, y0, TILE - 12, full);
      if (h > 1) {
        const g = ctx.createLinearGradient(x, 0, x + TILE, 0);
        g.addColorStop(0, '#222a52');
        g.addColorStop(0.5, '#313c70');
        g.addColorStop(1, '#222a52');
        ctx.fillStyle = g;
        ctx.fillRect(x, y0, TILE, h);
        ctx.fillStyle = 'rgba(0,0,0,.3)';
        for (let yy = y0 + 28; yy < y0 + h; yy += 32) ctx.fillRect(x, yy, TILE, 2);
        ctx.fillStyle = `rgba(${rgb},.85)`;
        ctx.fillRect(x, y0 + h - 5, TILE, 5);
        ctx.fillStyle = `rgba(${rgb},.35)`;
        ctx.fillRect(x - 2, y0, 2, h);
        ctx.fillRect(x + TILE, y0, 2, h);
        if (h > 40) rune(ctx, d.group, x + TILE / 2, y0 + Math.min(h - 18, 24), 7, 0.9);
      }
      // üstte bağlantı rünü (kapı açıkken de görünür)
      rune(ctx, d.group, x + TILE / 2, y0 - 8, 5, 0.6 + d.open * 0.4);
    }
  }
  function drawLevers(ctx, w, t) {
    for (const l of w.levers) {
      const rgb = gcol(l.group);
      const x = l.c * TILE + TILE / 2;
      const y = (l.r + 1) * TILE;
      const target = l.pos === 'right' ? 0.62 : -0.62;
      l.a = l.a == null ? target : l.a + (target - l.a) * 0.3;
      ctx.fillStyle = '#10152e';
      rr(ctx, x - 12, y - 8, 24, 8, 3);
      ctx.fill();
      ctx.strokeStyle = `rgba(${rgb},.9)`;
      ctx.lineWidth = 2;
      rr(ctx, x - 12, y - 8, 24, 8, 3);
      ctx.stroke();
      ctx.save();
      ctx.translate(x, y - 8);
      ctx.rotate(l.a);
      ctx.strokeStyle = '#cfd6ff';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -24);
      ctx.stroke();
      glow(ctx, 0, -26, 18, rgb, l.pos === 'right' ? 0.6 : 0.25);
      ctx.fillStyle = `rgb(${rgb})`;
      ctx.beginPath();
      if (l.button) ctx.rect(-6, -32, 12, 10);
      else ctx.arc(0, -26, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (!l.button) rune(ctx, l.group, x, y - 52, 5, 0.6);
      else {
        ctx.fillStyle = 'rgba(255,214,140,.9)';
        ctx.fillRect(x - 3, y - 58, 6, 6);
      }
    }
  }
  function drawPlates(ctx, w, t) {
    for (const p of w.plates) {
      const rgb = gcol(p.group);
      const x = p.c * TILE;
      const y = (p.r + 1) * TILE;
      const dn = p.down ? 3 : 0;
      ctx.fillStyle = '#10152e';
      ctx.fillRect(x + 1, y - 2, TILE - 2, 2);
      ctx.fillStyle = p.down ? `rgba(${rgb},.95)` : `rgba(${rgb},.55)`;
      rr(ctx, x + 3, y - 7 + dn, TILE - 6, 6 - dn + 1, 2);
      ctx.fill();
      if (p.down) glow(ctx, x + TILE / 2, y - 6, 40, rgb, 0.45);
      rune(ctx, p.group, x + TILE / 2, y - 26, 5, p.down ? 0.95 : 0.55);
    }
  }

  // --- Kutu ---
  function drawBox(ctx, b, t) {
    const x = b.x;
    const y = b.y;
    glow(ctx, x + b.w / 2, y + b.h / 2, 38, '255,196,120', 0.12);
    ctx.fillStyle = '#4a3a2a';
    ctx.fillRect(x, y, b.w, b.h);
    ctx.fillStyle = '#6b5238';
    ctx.fillRect(x + 3, y + 3, b.w - 6, b.h - 6);
    ctx.strokeStyle = '#2c2116';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, y + 1.5, b.w - 3, b.h - 3);
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 4);
    ctx.lineTo(x + b.w - 4, y + b.h - 4);
    ctx.moveTo(x + b.w - 4, y + 4);
    ctx.lineTo(x + 4, y + b.h - 4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,220,160,.35)';
    ctx.fillRect(x + 2, y + 2, b.w - 4, 2);
  }

  // --- Kandil ---
  function drawLanterns(ctx, w, t) {
    for (const l of w.lanterns) {
      const x = l.c * TILE + TILE / 2;
      const y = l.r * TILE + TILE / 2;
      const on = l.lit;
      const fl = on ? 0.85 + Math.sin(t * 9 + l.c) * 0.1 : 0;
      if (on) glow(ctx, x, y, 70, '255,210,120', 0.55 * fl);
      // gövde (duvara/zemine monte, huzme yönüne bakan fener)
      ctx.fillStyle = '#0a0d22';
      rr(ctx, x - 11, y - 14, 22, 28, 6);
      ctx.fill();
      ctx.strokeStyle = on ? 'rgba(255,214,140,.95)' : 'rgba(120,130,190,.8)';
      ctx.lineWidth = 2;
      rr(ctx, x - 11, y - 14, 22, 28, 6);
      ctx.stroke();
      // alev
      const fx = x + (l.dir === 'r' ? 4 : l.dir === 'l' ? -4 : 0);
      const fy = y + (l.dir === 'd' ? 4 : l.dir === 'u' ? -4 : 0);
      if (on) {
        ctx.fillStyle = `rgba(255,236,170,${fl})`;
        ctx.beginPath();
        ctx.ellipse(fx, fy, 5, 8 + Math.sin(t * 12 + l.c) * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(120,130,190,.35)';
        ctx.beginPath();
        ctx.ellipse(fx, fy, 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // yön oku (hangi tarafa ışık verir)
      ctx.fillStyle = on ? 'rgba(255,214,140,.9)' : 'rgba(150,160,210,.55)';
      const dx = l.dir === 'r' ? 1 : l.dir === 'l' ? -1 : 0;
      const dy = l.dir === 'd' ? 1 : l.dir === 'u' ? -1 : 0;
      ctx.beginPath();
      ctx.moveTo(x + dx * 18, y + dy * 18);
      ctx.lineTo(x + dx * 10 - dy * 5, y + dy * 10 + dx * 5);
      ctx.lineTo(x + dx * 10 + dy * 5, y + dy * 10 - dx * 5);
      ctx.fill();
      if (l.group) rune(ctx, l.group, x, y - 26, 5, on ? 0.95 : 0.55);
    }
  }

  // --- Asansör ---
  function drawLifts(ctx, w, t) {
    for (const l of w.lifts) {
      // ray (yol boyunca ince çizgiler)
      ctx.fillStyle = 'rgba(8,11,28,.55)';
      ctx.fillRect(l.x + 2, l.yHigh, 6, l.yLow - l.yHigh + l.h);
      ctx.fillRect(l.x + l.w - 8, l.yHigh, 6, l.yLow - l.yHigh + l.h);
      ctx.fillStyle = 'rgba(120,130,190,.35)';
      for (let y = l.yHigh; y < l.yLow; y += 32) {
        ctx.fillRect(l.x + 4, y, 2, 8);
        ctx.fillRect(l.x + l.w - 6, y, 2, 8);
      }
      // platform
      const g = ctx.createLinearGradient(0, l.y, 0, l.y + l.h);
      g.addColorStop(0, '#6c78b8');
      g.addColorStop(1, '#2c3566');
      ctx.fillStyle = g;
      rr(ctx, l.x, l.y, l.w, l.h, 3);
      ctx.fill();
      ctx.fillStyle = l.moving ? 'rgba(255,214,140,.95)' : 'rgba(180,190,240,.6)';
      ctx.fillRect(l.x + 6, l.y + 2, l.w - 12, 2);
      // yön oku: hedef
      const up = l.target === 1;
      ctx.fillStyle = 'rgba(255,214,140,.8)';
      const cx = l.x + l.w / 2;
      ctx.beginPath();
      ctx.moveTo(cx, l.y - 10 + (up ? -6 : 6));
      ctx.lineTo(cx - 6, l.y - 10);
      ctx.lineTo(cx + 6, l.y - 10);
      ctx.fill();
    }
  }

  // --- Sahne ---
  function drawScene(ctx, w, cam, t) {
    drawBackground(ctx, w, t);
    ctx.save();
    ctx.translate(cam.x, cam.y);
    drawTiles(ctx, w, t);
    for (const d of w.doors) drawDoor(ctx, d, t);
    drawLifts(ctx, w, t);
    drawBeams(ctx, w, t);
    drawLanterns(ctx, w, t);
    drawPlates(ctx, w, t);
    drawLevers(ctx, w, t);
    drawSDoors(ctx, w, t);
    for (const b of w.boxes) drawBox(ctx, b, t);
    for (const it of w.items) drawItem(ctx, it, t);
    // Işık'ın çevresine hafif aydınlatma
    const L = w.heroes.light;
    glow(ctx, L.x + L.w / 2, L.y + L.h / 2, 150, '255,210,130', 0.1);
    // pasif çizim sırası: Gölge arkada
    for (const h of [w.heroes.shadow, w.heroes.light]) {
      h.deadP = h.dead ? clamp(w.deadT / 0.9) : 0;
      drawHero(ctx, h, t);
    }
    drawWater(ctx, w, t);
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
