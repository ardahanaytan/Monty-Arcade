/*
 * Işık ve Gölge — açılış ve kapanış sahneleri (metinsiz, Canvas ile çizilen kısa animasyonlar).
 *  - Açılış: Işık ile Gölge birbirine yaklaşır, dokunamazlar; Sis Kralı gelir ve ikisini zindana atar.
 *  - Kapanış: Sur üzerinde tam tutulma; alacakaranlıkta ilk kez el ele tutuşurlar.
 * Çizim: IVGScenes.intro / IVGScenes.outro  →  { dur, draw(ctx, t, env), cues }
 * env: { VW, VH, R (IVGRender), text(str, x, y, size, opts), lang }
 */
(function (root) {
  'use strict';

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sm = (a, b, t) => {
    const x = clamp((t - a) / (b - a));
    return x * x * (3 - 2 * x);
  };
  const rnd = (i, k = 0) => {
    const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const mix = (c1, c2, t) => c1.map((v, i) => Math.round(lerp(v, c2[i], t)));
  const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  const fig = (kind, x, y, o = {}) => ({
    kind,
    x: x - 11,
    y: y - 34,
    w: 22,
    h: 34,
    vx: o.vx || 0,
    vy: 0,
    onGround: o.air ? false : true,
    face: o.face || (kind === 'light' ? 1 : -1),
    walk: o.walk || 0,
    squash: 1,
    dead: false,
    deadP: 0,
  });

  function sky(ctx, env, top, bottom) {
    const g = ctx.createLinearGradient(0, 0, 0, env.VH);
    g.addColorStop(0, rgb(top));
    g.addColorStop(1, rgb(bottom));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, env.VW, env.VH);
  }
  function ridge(ctx, env, y0, amp, seed, color, shift = 0) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, env.VH);
    for (let x = 0; x <= env.VW + 20; x += 20) {
      const yy = y0 - amp * (0.5 + 0.5 * Math.sin((x + shift) * 0.006 + seed)) - amp * 0.4 * Math.sin((x + shift) * 0.017 + seed * 2);
      ctx.lineTo(x, yy);
    }
    ctx.lineTo(env.VW + 20, env.VH);
    ctx.closePath();
    ctx.fill();
  }
  function stars(ctx, env, alpha, t) {
    if (alpha <= 0.01) return;
    for (let i = 0; i < 70; i++) {
      const x = rnd(i, 1) * env.VW;
      const y = rnd(i, 2) * env.VH * 0.62;
      const tw = 0.5 + 0.5 * Math.sin(t * (1 + rnd(i, 3) * 2) + i);
      ctx.fillStyle = `rgba(255,248,230,${alpha * (0.25 + 0.6 * tw * rnd(i, 4))})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
  function fogBlobs(ctx, env, n, offsetX, yBase, alpha, tint = '170,170,185') {
    for (let i = 0; i < n; i++) {
      const x = ((rnd(i, 5) * (env.VW + 500) + offsetX * (0.6 + rnd(i, 6) * 0.8)) % (env.VW + 500)) - 150;
      const y = yBase + rnd(i, 7) * 200;
      env.R.glow(ctx, x, y, 130 + rnd(i, 8) * 110, tint, alpha);
    }
  }

  // ───────────────────────────── Sis Kralı ─────────────────────────────
  function drawKing(ctx, x, y, s, t, raise) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const sway = Math.sin(t * 1.3) * 4;
    // pelerin
    const g = ctx.createLinearGradient(0, -260, 0, 0);
    g.addColorStop(0, '#2c2c3a');
    g.addColorStop(1, 'rgba(60,60,76,.0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-70 + sway, 0);
    ctx.lineTo(-44 + sway * 0.5, -210);
    ctx.lineTo(0, -262);
    ctx.lineTo(44 + sway * 0.5, -210);
    ctx.lineTo(70 + sway, 0);
    for (let i = 6; i >= -6; i--) ctx.lineTo(i * 11 + sway, 10 + Math.sin(t * 2 + i) * 8);
    ctx.closePath();
    ctx.fill();
    // başlık
    ctx.fillStyle = '#1b1b25';
    ctx.beginPath();
    ctx.arc(0, -250, 34, 0, Math.PI * 2);
    ctx.fill();
    // sis tacı
    ctx.fillStyle = 'rgba(190,190,205,.75)';
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 10 - 6, -276);
      ctx.lineTo(i * 10, -300 - (3 - Math.abs(i)) * 6 - Math.sin(t * 3 + i) * 3);
      ctx.lineTo(i * 10 + 6, -276);
      ctx.fill();
    }
    // gözler
    ctx.fillStyle = '#eaf2ff';
    ctx.shadowColor = '#bcd4ff';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.ellipse(-11, -252, 5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(11, -252, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // asa
    ctx.strokeStyle = '#4e4e5e';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(86, 6);
    ctx.lineTo(86, -280 - raise * 30);
    ctx.stroke();
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(34, -190);
    ctx.lineTo(80, -170 - raise * 80);
    ctx.stroke();
    const orbY = -300 - raise * 30;
    const pulse = 0.6 + 0.4 * Math.sin(t * 6) * (0.4 + raise);
    ctx.restore();
    return { ox: x + 86 * s, oy: y + orbY * s, pulse };
  }

  // ───────────────────────────── AÇILIŞ ─────────────────────────────
  const INTRO_DUR = 24;
  function drawIntro(ctx, t, env) {
    const { VW, VH, R } = env;
    // gökyüzü: alacakaranlık → sisle grileşir
    const gray = sm(7, 11, t);
    const top = mix([64, 40, 110], [88, 90, 104], gray);
    const bot = mix([232, 150, 120], [128, 130, 142], gray);
    const pit = sm(13.2, 15.2, t); // zindana düşüş: sahne kararır
    ctx.save();
    if (t < 15.5) {
      sky(ctx, env, top, bot);
      stars(ctx, env, 0.5 * (1 - gray), t);
      // uzak kale
      ctx.fillStyle = rgb(mix([40, 26, 70], [70, 72, 84], gray), 0.8);
      ctx.fillRect(900, 330, 38, 140);
      ctx.fillRect(950, 300, 44, 170);
      ctx.beginPath();
      ctx.moveTo(900, 330);
      ctx.lineTo(919, 300);
      ctx.lineTo(938, 330);
      ctx.moveTo(950, 300);
      ctx.lineTo(972, 262);
      ctx.lineTo(994, 300);
      ctx.fill();
      ridge(ctx, env, 470, 60, 1.3, rgb(mix([48, 30, 84], [78, 80, 92], gray)), 0);
      ridge(ctx, env, 540, 44, 4.1, rgb(mix([28, 18, 58], [52, 54, 64], gray)), 120);
      // yer
      const gy = 520;
      ctx.fillStyle = rgb(mix([22, 14, 44], [40, 42, 50], gray));
      ctx.fillRect(0, gy, VW, VH - gy);
      ctx.fillStyle = rgb(mix([60, 40, 100], [70, 72, 84], gray), 0.6);
      ctx.fillRect(0, gy, VW, 3);

      // A: iki yürek birbirine yaklaşır
      const ap = sm(0.8, 5.2, t);
      const lx = lerp(150, VW / 2 - 40, ap);
      const sx = lerp(VW - 150, VW / 2 + 40, ap);
      let lxx = lx;
      let sxx = sx;
      let lvx = 90 * (1 - ap);
      let svx = -90 * (1 - ap);
      // 5.6 s: dokunmaya çalışırlar → kıvılcım geri savurur
      const clash = sm(5.2, 5.6, t) * (1 - sm(5.6, 7.2, t));
      lxx -= clash * 70;
      sxx += clash * 70;
      if (t > 5.2 && t < 7.2) {
        lvx = -60 * (1 - sm(5.6, 7.2, t));
        svx = 60 * (1 - sm(5.6, 7.2, t));
      }
      const liftP = sm(9.8, 11.6, t) * (1 - sm(12.8, 13.6, t)); // havaya kalkış
      const fall = sm(13.0, 15.4, t);
      const ly = 520 - liftP * 150 + fall * fall * 700;
      const sy = 520 - liftP * 130 + fall * fall * 700;
      // aralarındaki çekim
      const mid = (lxx + sxx) / 2;
      R.glow(ctx, mid, 490, 70 + Math.sin(t * 4) * 12 + clash * 140, '255,225,170', 0.16 + clash * 0.5 + 0.06 * Math.sin(t * 3));
      for (let i = 0; i < 10; i++) {
        const u = ((t * 0.5 + i / 10) % 1);
        const px = lerp(lxx, sxx, u);
        const py = 488 - Math.sin(u * Math.PI) * 26 + Math.sin(t * 4 + i) * 4;
        ctx.fillStyle = `rgba(255,236,190,${0.55 * Math.sin(u * Math.PI) * (1 - gray * 0.7)})`;
        ctx.fillRect(px, py, 2, 2);
      }
      R.glow(ctx, lxx, ly - 17, 120, '255,206,130', 0.2 * (1 - gray * 0.6));
      R.glow(ctx, sxx, sy - 17, 100, '110,80,190', 0.16);
      const L = fig('light', lxx, ly, { vx: lvx, face: 1, walk: t * 8 });
      const S = fig('shadow', sxx, sy, { vx: svx, face: -1, walk: t * 8 });
      const wob = liftP > 0 ? Math.sin(t * 9) * 0.25 * liftP : 0;
      const drawTilted = (h, a) => {
        const cx = h.x + h.w / 2;
        const cy = h.y + h.h / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(a);
        ctx.translate(-cx, -cy);
        R.drawHeroAt(ctx, h, t);
        ctx.restore();
      };
      drawTilted(L, wob + fall * 2.4);
      drawTilted(S, -wob - fall * 3);

      // B: sis yuvarlanır, Sis Kralı belirir
      const fogA = sm(6.4, 9.5, t);
      if (fogA > 0) {
        fogBlobs(ctx, env, 16, -(t - 6) * 120 + 400, 360, 0.22 * fogA);
        ctx.fillStyle = `rgba(150,152,166,${0.18 * fogA})`;
        ctx.fillRect(0, 0, VW, VH);
      }
      const kingA = sm(8.2, 9.8, t);
      let orb = null;
      if (kingA > 0.01) {
        ctx.save();
        ctx.globalAlpha = kingA * (1 - fall);
        orb = drawKing(ctx, 1010 - kingA * 30, 520, 1.15, t, sm(9.6, 10.4, t));
        ctx.restore();
      }
      // gri dokunaçlar: asadan Işık ve Gölge'ye
      if (orb && liftP > 0.02) {
        ctx.save();
        ctx.lineWidth = 5;
        ctx.strokeStyle = `rgba(205,208,224,${0.55 * liftP})`;
        for (const [hx, hy] of [[lxx, ly - 24], [sxx, sy - 24]]) {
          ctx.beginPath();
          ctx.moveTo(orb.ox, orb.oy);
          const mx = (orb.ox + hx) / 2;
          const my = (orb.oy + hy) / 2 - 40 + Math.sin(t * 6 + hx) * 14;
          ctx.quadraticCurveTo(mx, my, hx, hy);
          ctx.stroke();
        }
        ctx.restore();
        R.glow(ctx, orb.ox, orb.oy, 70 + liftP * 40, '220,225,245', 0.4 * orb.pulse);
      }
      // sis üstte kalır
      if (fogA > 0.4) fogBlobs(ctx, env, 8, -(t - 6) * 160 + 700, 470, 0.16 * fogA, '150,150,168');
    }

    // C: kuyuya düşüş + zindan kapısı (t 13.5 → 22)
    if (t >= 13.4) {
      const tt = t - 13.4;
      const a = sm(13.4, 15.2, t);
      ctx.fillStyle = `rgba(6,7,16,${a})`;
      ctx.fillRect(0, 0, VW, VH);
      // kuyunun taş duvarı yukarı kayar
      ctx.save();
      ctx.globalAlpha = a;
      const sp = tt * tt * 90 + tt * 140;
      for (let side = 0; side < 2; side++) {
        const x0 = side === 0 ? 0 : VW - 330;
        ctx.fillStyle = '#10142a';
        ctx.fillRect(x0, 0, 330, VH);
        for (let r = -2; r < 24; r++) {
          const y = ((r * 40 - sp) % 960) + 0;
          const yy = ((y % 960) + 960) % 960 - 120;
          ctx.fillStyle = 'rgba(70,82,140,.35)';
          ctx.fillRect(x0, yy, 330, 3);
          for (let k = 0; k < 6; k++) ctx.fillRect(x0 + ((r % 2) * 27) + k * 55, yy, 3, 40);
        }
      }
      ctx.restore();
      // düşen iki figür (kuyu içinde, hafifçe dönerek)
      const fp = sm(14.4, 17.4, t);
      const ly2 = lerp(-60, 520, fp);
      const sy2 = lerp(-140, 540, fp);
      if (t < 18.4) {
        const dl = fig('light', VW / 2 - 40, ly2, { air: true, vx: 0 });
        const ds = fig('shadow', VW / 2 + 40, sy2, { air: true, vx: 0 });
        R.glow(ctx, dl.x + 11, dl.y + 17, 90, '255,206,130', 0.2 * a);
        for (const [h, ang] of [[dl, Math.sin(t * 5) * 0.4], [ds, Math.sin(t * 4 + 1) * 0.4]]) {
          ctx.save();
          ctx.translate(h.x + 11, h.y + 17);
          ctx.rotate(ang);
          ctx.translate(-(h.x + 11), -(h.y + 17));
          R.drawHeroAt(ctx, h, t);
          ctx.restore();
        }
      }
      // 17.4: yere iner → hücre. Demir parmaklıklar yukarıdan iner, Sis Kralı'nın gözleri
      if (t >= 17.2) {
        const cell = sm(17.2, 17.8, t);
        ctx.fillStyle = `rgba(14,16,34,${cell})`;
        ctx.fillRect(0, 0, VW, VH);
        // hücre zemini ve duvar
        ctx.save();
        ctx.globalAlpha = cell;
        ctx.fillStyle = '#1a1f3c';
        ctx.fillRect(VW / 2 - 260, 150, 520, 430);
        for (let r = 0; r < 11; r++) {
          ctx.fillStyle = 'rgba(0,0,0,.28)';
          ctx.fillRect(VW / 2 - 260, 150 + r * 40, 520, 2);
          for (let k = 0; k < 9; k++) ctx.fillRect(VW / 2 - 260 + ((r % 2) * 29) + k * 58, 150 + r * 40, 2, 40);
        }
        ctx.fillStyle = '#0c0f22';
        ctx.fillRect(VW / 2 - 260, 540, 520, 40);
        ctx.restore();
        const dl = fig('light', VW / 2 - 70, 540, { face: 1 });
        const ds = fig('shadow', VW / 2 + 70, 540, { face: -1 });
        ctx.save();
        ctx.globalAlpha = cell;
        R.glow(ctx, dl.x + 11, 520, 110, '255,206,130', 0.2);
        R.drawHeroAt(ctx, dl, t);
        R.drawHeroAt(ctx, ds, t);
        ctx.restore();
        // parmaklıklar
        const bars = sm(18.6, 19.0, t);
        const barY = lerp(-460, 0, bars);
        ctx.fillStyle = '#05060f';
        for (let i = 0; i < 9; i++) ctx.fillRect(VW / 2 - 260 + 10 + i * 62, barY, 14, 590);
        ctx.fillRect(VW / 2 - 266, barY + 150, 532, 12);
        ctx.fillRect(VW / 2 - 266, barY + 560, 532, 14);
        if (t > 18.55 && t < 18.85) {
          ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - (t - 18.55) / 0.3)})`;
          ctx.fillRect(0, 0, VW, VH);
        }
        // Sis Kralı'nın soluk gözleri ızgaranın üstünden bakar
        const eyes = sm(19.2, 20.0, t) * (1 - sm(21.6, 22.6, t));
        if (eyes > 0.01) {
          ctx.fillStyle = `rgba(234,242,255,${eyes})`;
          ctx.shadowColor = '#bcd4ff';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.ellipse(VW / 2 - 24, 90, 12, 5, 0, 0, Math.PI * 2);
          ctx.ellipse(VW / 2 + 24, 90, 12, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }
    // sona doğru kararır
    const out = sm(22.2, 23.8, t);
    ctx.restore();
    if (out > 0) {
      ctx.fillStyle = `rgba(4,5,12,${out})`;
      ctx.fillRect(0, 0, VW, VH);
    }
    // açılışta yumuşak giriş
    const inn = 1 - sm(0, 1.2, t);
    if (inn > 0) {
      ctx.fillStyle = `rgba(4,5,12,${inn})`;
      ctx.fillRect(0, 0, VW, VH);
    }
  }
  const INTRO_CUES = [
    { t: 0.4, f: (s) => [262, 330, 392].forEach((f, i) => s.tone(f, i * 0.2, 1.8, 'sine', 0.035)) },
    { t: 3.2, f: (s) => [294, 370, 440].forEach((f, i) => s.tone(f, i * 0.2, 1.8, 'sine', 0.035)) },
    { t: 5.55, f: (s) => (s.tone(900, 0, 0.35, 'sawtooth', 0.05, 160), s.noise(0, 0.25, 3200, 1, 0.12, 'highpass')) },
    { t: 8.4, f: (s) => (s.tone(62, 0, 3.4, 'sawtooth', 0.05, 48), s.noise(0, 3, 220, 1, 0.1, 'lowpass')) },
    { t: 10.0, f: (s) => s.tone(84, 0, 1.6, 'square', 0.03, 60) },
    { t: 14.5, f: (s) => s.tone(700, 0, 2.6, 'sine', 0.05, 80) },
    { t: 18.55, f: (s) => (s.noise(0, 0.5, 500, 1, 0.28, 'lowpass'), s.tone(110, 0, 0.8, 'square', 0.07, 55)) },
    { t: 19.4, f: (s) => s.tone(48, 0, 2.6, 'sine', 0.06, 40) },
  ];

  // ───────────────────────────── KAPANIŞ ─────────────────────────────
  const OUTRO_DUR = 36;
  function drawOutro(ctx, t, env) {
    const { VW, VH, R } = env;
    // ay, güneşin önünden geçer: ofset büyükken kapsama yok, 0 iken tam tutulma
    const moonOff = t < 15 ? lerp(-420, -90, sm(1, 15, t)) : t < 21.5 ? lerp(-90, 0, sm(15, 18, t)) + (t > 20 ? lerp(0, 40, sm(20, 21.5, t)) : 0) : lerp(40, 460, sm(21.5, 31, t));
    const sunR = 78;
    const moonR = 82;
    const dist = Math.abs(moonOff);
    const cov = clamp(1 - Math.max(0, dist - (moonR - sunR)) / (sunR + moonR - (moonR - sunR) - 0), 0, 1);
    const total = cov > 0.995 ? 1 : cov * cov * cov;
    // gökyüzü: gün → alacakaranlık → gece → şafak
    const day = [96, 140, 210];
    const dayB = [236, 190, 150];
    const dusk = [18, 20, 54];
    const duskB = [210, 110, 70];
    const sk = mix(day, dusk, total);
    const skb = mix(dayB, duskB, total);
    sky(ctx, env, sk, skb);
    stars(ctx, env, total * 0.9, t);
    // ufuk boyunca turuncu halka (tam tutulmada her yerde gün batımı)
    const hz = ctx.createLinearGradient(0, 380, 0, 560);
    hz.addColorStop(0, 'rgba(255,140,70,0)');
    hz.addColorStop(1, `rgba(255,150,80,${0.5 * total})`);
    ctx.fillStyle = hz;
    ctx.fillRect(0, 380, VW, 180);

    const cx = VW / 2;
    const cy = 190;
    // güneş
    const sunVis = 1;
    R.glow(ctx, cx, cy, 260, '255,214,140', 0.35 * (1 - total) * sunVis);
    ctx.fillStyle = '#fff0c6';
    ctx.beginPath();
    ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
    ctx.fill();
    if (total > 0.05) R.glow(ctx, cx + moonOff, cy, 230, '255,226,170', 0.3 * total);
    // ay
    ctx.fillStyle = total > 0.3 ? '#05060c' : '#1a1d33';
    ctx.beginPath();
    ctx.arc(cx + moonOff, cy, moonR, 0, Math.PI * 2);
    ctx.fill();
    // korona
    if (total > 0.05) {
      const k = total;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2 + t * 0.05;
        const len = 40 + 70 * rnd(i, 9) + Math.sin(t * 2 + i) * 8;
        ctx.strokeStyle = `rgba(255,236,200,${0.1 * k})`;
        ctx.lineWidth = 3 + rnd(i, 10) * 5;
        ctx.beginPath();
        ctx.moveTo(cx + moonOff + Math.cos(a) * (moonR + 2), cy + Math.sin(a) * (moonR + 2));
        ctx.lineTo(cx + moonOff + Math.cos(a) * (moonR + len), cy + Math.sin(a) * (moonR + len));
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = `rgba(255,244,214,${0.85 * k})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx + moonOff, cy, moonR + 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // sis: uzakta dağılır
    const fogL = 1 - sm(8, 22, t);
    ridge(ctx, env, 470, 50, 2.2, rgb(mix([46, 52, 96], [12, 14, 34], total), 1), 40);
    if (fogL > 0.01) fogBlobs(ctx, env, 14, t * 14, 400, 0.22 * fogL);
    ridge(ctx, env, 540, 36, 5.3, rgb(mix([34, 36, 70], [8, 10, 24], total)), 200);

    // sur: kale duvarı ve ardıllar
    const wy = 500;
    ctx.fillStyle = rgb(mix([88, 76, 96], [20, 20, 36], total));
    ctx.fillRect(0, wy, VW, VH - wy);
    for (let r = 0; r < 6; r++) {
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      ctx.fillRect(0, wy + 14 + r * 34, VW, 2);
      for (let k = 0; k < 26; k++) ctx.fillRect(((r % 2) * 25) + k * 50, wy + 14 + r * 34, 2, 34);
    }
    ctx.fillStyle = rgb(mix([120, 106, 128], [34, 34, 58], total));
    ctx.fillRect(0, wy - 4, VW, 8);
    for (let k = 0; k < 8; k++) {
      for (const bx of [k * 60, VW - 40 - k * 60]) {
        if (bx > 260 && bx < VW - 300) continue;
        ctx.fillStyle = rgb(mix([100, 88, 110], [26, 26, 46], total));
        ctx.fillRect(bx, wy - 36, 38, 36);
      }
    }

    // iki figür: birbirine yürür; 17 s'de buluşur
    const walk = sm(1.5, 16.6, t);
    const lx = lerp(250, cx - 14, walk);
    const sx = lerp(VW - 250, cx + 14, walk);
    const meet = sm(16.6, 18.4, t);
    const fy = wy - 2;
    // ışık/karanlık ışımaları: tutulmada ikisi de aynı tonda
    R.glow(ctx, lx, fy - 17, 130, '255,206,130', 0.22 * (1 - total) + 0.1 + 0.15 * meet);
    R.glow(ctx, sx, fy - 17, 120, '120,90,210', 0.1 + 0.2 * total);
    const moving = t > 1.5 && t < 16.6;
    const L = fig('light', lx, fy, { vx: moving ? 70 : 0, face: 1, walk: t * 7 });
    const S = fig('shadow', sx, fy, { vx: moving ? -70 : 0, face: -1, walk: t * 7 });
    R.drawHeroAt(ctx, L, t);
    R.drawHeroAt(ctx, S, t);

    // el ele: ortada ılık-mor bir düğüm ve halkalar
    if (meet > 0.01) {
      const hx = cx;
      const hy = fy - 15;
      R.glow(ctx, hx, hy, 90 + 60 * meet, '255,196,150', 0.5 * meet);
      R.glow(ctx, hx, hy, 70 + 40 * meet, '170,130,255', 0.4 * meet);
      ctx.strokeStyle = `rgba(255,232,200,${0.8 * meet})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lx + 10, hy);
      ctx.lineTo(sx - 10, hy);
      ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const rr = ((t - 17 + i * 0.9) % 2.7);
        if (rr < 0 || t < 17) continue;
        ctx.strokeStyle = `rgba(255,226,190,${0.5 * (1 - rr / 2.7)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hx, hy, rr * 90, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = 0; i < 14; i++) {
        const a = rnd(i, 21) * Math.PI * 2 + t * 0.4;
        const rr = 20 + ((t * 30 + i * 17) % 120);
        ctx.fillStyle = `rgba(255,236,200,${0.5 * meet * (1 - rr / 140)})`;
        ctx.fillRect(hx + Math.cos(a) * rr, hy + Math.sin(a) * rr * 0.6, 2, 2);
      }
    }

    // son: kararır, "SON"
    const endA = sm(31.5, 34.2, t);
    if (endA > 0) {
      ctx.fillStyle = `rgba(4,5,12,${endA * 0.92})`;
      ctx.fillRect(0, 0, VW, VH);
      env.text(env.lang === 'tr' ? 'SON' : 'THE END', VW / 2, VH / 2 + 12, 64, { alpha: sm(32.2, 34.6, t), glow: 'rgba(255,200,120,.5)' });
    }
    const inn = 1 - sm(0, 1.4, t);
    if (inn > 0) {
      ctx.fillStyle = `rgba(4,5,12,${inn})`;
      ctx.fillRect(0, 0, VW, VH);
    }
  }
  const OUTRO_CUES = [
    { t: 0.5, f: (s) => [262, 330, 392, 523].forEach((f, i) => s.tone(f, i * 0.25, 2.4, 'sine', 0.03)) },
    { t: 9.0, f: (s) => [294, 370, 440, 587].forEach((f, i) => s.tone(f, i * 0.25, 2.6, 'sine', 0.03)) },
    { t: 16.8, f: (s) => (s.tone(110, 0, 3.4, 'sine', 0.06, 98), s.noise(0, 1.6, 400, 1, 0.08, 'lowpass')) },
    { t: 18.0, f: (s) => [523, 659, 784, 1047, 1319].forEach((f, i) => s.tone(f, i * 0.16, 1.6, 'sine', 0.06)) },
    { t: 21.5, f: (s) => [392, 523, 659, 784].forEach((f, i) => s.tone(f, i * 0.22, 2.4, 'sine', 0.045)) },
    { t: 28.0, f: (s) => [262, 330, 392, 523, 659].forEach((f, i) => s.tone(f, i * 0.3, 3.2, 'sine', 0.04)) },
  ];

  root.IVGScenes = {
    intro: { dur: INTRO_DUR, draw: drawIntro, cues: INTRO_CUES },
    outro: { dur: OUTRO_DUR, draw: drawOutro, cues: OUTRO_CUES },
  };
})(typeof self !== 'undefined' ? self : this);
