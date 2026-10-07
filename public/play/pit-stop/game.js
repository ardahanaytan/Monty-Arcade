/* Pit Stop — tek tuşlu zamanlama oyunu. İbre sarı bölgedeyken bas; araç durduğu andan çıkışa kadar süre tutulur. */
(() => {
  'use strict';

  const kit = MontyKit.create('pit-stop');
  const { sound, store } = kit;
  const touchUI = window.matchMedia?.('(pointer: coarse)').matches;

  const STR = {
    tr: {
      title: 'PIT STOP',
      how1: 'İBRE SARI BÖLGEDEYKEN BAS',
      how2: 'SIRA: KRİKOLAR → 4 TEKERLEK → YEŞİL IŞIKTA ÇIKIŞ',
      start: touchUI ? 'BAŞLAMAK İÇİN DOKUN' : 'BAŞLAMAK İÇİN BOŞLUK',
      next: touchUI ? 'SONRAKİ PİT İÇİN DOKUN' : 'SONRAKİ PİT: BOŞLUK',
      again: touchUI ? 'YENİ YARIŞ İÇİN DOKUN' : 'YENİ YARIŞ: BOŞLUK',
      steps: ['ÖN KRİKO', 'ARKA KRİKO', 'SOL ÖN', 'SAĞ ÖN', 'SOL ARKA', 'SAĞ ARKA', 'ÇIKIŞ'],
      waitGreen: 'YEŞİLİ BEKLE',
      go: 'ÇIK!',
      perfect: 'MÜKEMMEL',
      good: 'İYİ',
      miss: 'KAÇTI!',
      unsafe: 'GÜVENSİZ ÇIKIŞ! +1 SN',
      pit: (n) => `PİT ${n}/5`,
      best: 'EN İYİ PİT',
      raceBest: 'EN İYİ YARIŞ',
      stopTime: 'PİT SÜRESİ',
      raceDone: 'YARIŞ BİTTİ',
      total: 'TOPLAM',
      perfects: 'MÜKEMMEL',
      newBest: 'YENİ REKOR!',
      paused: 'DURAKLATILDI',
    },
    en: {
      title: 'PIT STOP',
      how1: 'PRESS WHEN THE NEEDLE IS IN THE YELLOW',
      how2: 'ORDER: JACKS → 4 WHEELS → GO ON GREEN',
      start: touchUI ? 'TAP TO START' : 'PRESS SPACE TO START',
      next: touchUI ? 'TAP FOR THE NEXT STOP' : 'NEXT STOP: SPACE',
      again: touchUI ? 'TAP FOR A NEW RACE' : 'NEW RACE: SPACE',
      steps: ['FRONT JACK', 'REAR JACK', 'FRONT LEFT', 'FRONT RIGHT', 'REAR LEFT', 'REAR RIGHT', 'RELEASE'],
      waitGreen: 'WAIT FOR GREEN',
      go: 'GO!',
      perfect: 'PERFECT',
      good: 'GOOD',
      miss: 'MISSED!',
      unsafe: 'UNSAFE RELEASE! +1 S',
      pit: (n) => `STOP ${n}/5`,
      best: 'BEST STOP',
      raceBest: 'BEST RACE',
      stopTime: 'STOP TIME',
      raceDone: 'RACE FINISHED',
      total: 'TOTAL',
      perfects: 'PERFECT',
      newBest: 'NEW BEST!',
      paused: 'PAUSED',
    },
  };
  const T = STR[kit.lang];
  document.title = 'Pit Stop';

  // --- Ekran ---
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  let W = 0;
  let H = 0;
  let dpr = 1;
  let scale = 1;
  let VW = 800;
  let VHV = 450;
  let portrait = false;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    portrait = W < H * 1.05;
    scale = Math.max(0.1, portrait ? Math.min(W / 520, H / 820) : Math.min(H / 450, W / 760));
    VW = W / scale;
    VHV = H / scale;
  }
  // araç ve gösterge yerleşimi (yatay: yan yana, dikey: üst üste)
  const carPos = () => (portrait ? { x: VW / 2, y: VHV * 0.42 } : { x: VW * 0.42, y: VHV * 0.56 });
  const gaugePos = () => (portrait ? { x: VW / 2, y: VHV * 0.76 } : { x: Math.min(VW - 110, VW * 0.82), y: VHV * 0.56 });

  let last = performance.now(); // son karenin zamanı (basış hassasiyeti için)

  // --- Durum ---
  const STEPS = 7; // 0-1 kriko, 2-5 tekerlek, 6 çıkış
  const S = {
    mode: 'title', // title | arrive | stop | leave | between | summary
    paused: false,
    t: 0,
    stopIdx: 0,
    stops: [], // { time, perfects }
    carX: -400,
    step: 0,
    gaugeStart: 0,
    zone: 0.5,
    stall: 0,
    stopStart: 0,
    elapsed: 0,
    penalty: 0,
    perfects: 0,
    greenAt: 0,
    done: [], // tamamlanan adımlar
    lift: 0,
    pops: [],
    parts: [],
    shake: 0,
    stopResult: null, // { time, best }
    records: store.get('records', { bestStop: 0, bestRace: 0 }),
    newBest: false,
    newRaceBest: false,
  };

  // İbre bir turu period saniyede atar; her pitte biraz hızlanır.
  const period = () => 0.52 - S.stopIdx * 0.025;
  const PERFECT_W = 0.085;
  const GOOD_W = 0.22;

  function newRace() {
    S.stopIdx = 0;
    S.stops = [];
    S.newRaceBest = false;
    beginArrive();
  }
  function beginArrive() {
    S.mode = 'arrive';
    S.t = 0;
    S.carX = -VW * 0.6;
    S.step = 0;
    S.done = [];
    S.lift = 0;
    S.penalty = 0;
    S.perfects = 0;
    S.elapsed = 0;
    S.stopResult = null;
    S.newBest = false;
    sound.tone(90, 0, 0.7, 'sawtooth', 0.05, 45);
  }
  function beginStop() {
    S.mode = 'stop';
    S.stopStart = S.t;
    S.step = 0;
    startStep();
  }
  function startStep() {
    S.gaugeStart = S.t;
    S.stall = 0;
    S.zone = 0.22 + Math.random() * 0.5; // sarı bölgenin başlangıcı (tur oranı)
    if (S.step === 6) S.greenAt = S.t + 0.25 + Math.random() * 0.4;
  }

  function popup(text, color) {
    const g = gaugePos();
    S.pops = [{ text, color, x: g.x, y: g.y + 112, t: 0 }]; // her seferinde tek yazı
  }

  // --- Basış ---
  function press() {
    if (S.paused) {
      S.paused = false;
      return;
    }
    switch (S.mode) {
      case 'title':
        newRace();
        return;
      case 'between':
        if (S.t > 0.5) beginArrive();
        return;
      case 'summary':
        if (S.t > 0.9) newRace();
        return;
      case 'stop':
        break;
      default:
        return;
    }
    // kareler arasında basılırsa: son kareden bu yana geçen süreyi de ekle
    const t = S.t + Math.min(0.05, Math.max(0, (performance.now() - last) / 1000));
    if (t < S.stall) return;

    if (S.step === 6) {
      if (t < S.greenAt) {
        S.penalty += 1;
        S.shake = 8;
        popup(T.unsafe, '#ff6b2c');
        sound.tone(120, 0, 0.3, 'sawtooth', 0.07);
        kit.unlock('unsafe-release');
        return;
      }
      finishStop(t);
      return;
    }

    const f = needle(t);
    const pStart = S.zone;
    const pEnd = S.zone + PERFECT_W;
    const gPad = (GOOD_W - PERFECT_W) / 2;
    if (f >= pStart && f <= pEnd) {
      S.perfects++;
      popup(T.perfect, '#ffc23d');
      completeStep(t, 0.04);
      sound.tone(1320, 0, 0.06, 'square', 0.035);
    } else if (f >= pStart - gPad && f <= pEnd + gPad) {
      popup(T.good, '#f3ead8');
      completeStep(t, 0.14);
      sound.tone(880, 0, 0.06, 'square', 0.03);
    } else {
      popup(T.miss, '#ff6b2c');
      S.stall = t + 0.4;
      S.gaugeStart = t + 0.4;
      S.shake = 5;
      sound.noise(0, 0.12, 500, 2, 0.5);
      sound.tone(160, 0, 0.12, 'square', 0.04);
    }
  }

  function needle(t = S.t) {
    return Math.max(0, (t - S.gaugeStart) / period()) % 1;
  }

  function completeStep(t, stall) {
    S.done.push(S.step);
    // efekt: krikolar "tok", tekerlekler hava tabancası
    if (S.step <= 1) sound.noise(0, 0.08, 220, 1, 0.6);
    else {
      sound.noise(0, 0.05, 3200, 3, 0.35);
      sound.noise(0.06, 0.05, 3400, 3, 0.35);
    }
    const anchor = partPos(S.step);
    const c = carPos();
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      S.parts.push({ x: c.x + anchor.x, y: c.y + anchor.y, vx: Math.cos(a) * 140, vy: Math.sin(a) * 140, life: 0.35, color: S.step <= 1 ? '#f3ead8' : '#ffc23d' });
    }
    S.step++;
    startStep();
    // kısa animasyon payı: ibre bir sonraki adımda bu süre sonunda döner
    S.stall = t + stall;
    S.gaugeStart = t + stall;
    if (S.step === 6) S.greenAt = S.stall + 0.25 + Math.random() * 0.4;
  }

  function finishStop(t) {
    const time = t - S.stopStart + S.penalty;
    S.elapsed = time;
    S.stops.push({ time, perfects: S.perfects });
    S.mode = 'leave';
    S.t = 0;
    S.lift = 0;
    sound.tone(140, 0, 0.6, 'sawtooth', 0.06, 520);
    sound.noise(0, 0.5, 900, 0.6, 0.25);

    kit.unlock('first-stop');
    if (time < 3) kit.unlock('sub-3');
    if (time < 2.5) kit.unlock('sub-2-5');
    if (time < 2.2) kit.unlock('sub-2-2');
    if (S.perfects >= 6 && S.penalty === 0) kit.unlock('perfect-stop');
    const rec = S.records;
    if (!rec.bestStop || time < rec.bestStop) {
      S.newBest = rec.bestStop > 0;
      rec.bestStop = time;
    }
    S.stopResult = { time };
    S.stopIdx++;
    if (S.stopIdx >= 5) {
      const total = S.stops.reduce((a, s) => a + s.time, 0);
      kit.unlock('full-race');
      if (!rec.bestRace || total < rec.bestRace) {
        S.newRaceBest = rec.bestRace > 0;
        rec.bestRace = total;
      }
    }
    store.set('records', rec);
    if (S.newBest || S.newRaceBest) [523, 659, 784, 1047].forEach((f, i) => sound.tone(f, 0.3 + i * 0.09, 0.12, 'square', 0.04));
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    if (e.repeat) return;
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp' || e.code === 'KeyW') press();
    else if ((e.code === 'KeyP' || e.code === 'Escape') && S.mode === 'stop') S.paused = !S.paused;
    else if (e.code === 'KeyM') sound.setUserMuted(!sound.userMuted);
  });
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    press();
  });
  kit.on('pause', () => {
    if (S.mode === 'stop') S.paused = true;
  });

  // --- Güncelleme ---
  function update(dt) {
    if (S.paused) return;
    S.t += dt;
    if (S.mode === 'arrive') {
      const k = Math.min(1, S.t / 0.9);
      const e = 1 - Math.pow(1 - k, 3);
      S.carX = lerp(-VW * 0.6, 0, e);
      if (k >= 1) beginStop();
    } else if (S.mode === 'stop') {
      S.elapsed = S.t - S.stopStart + S.penalty;
      const target = S.done.includes(0) && S.done.includes(1) ? 1 : S.done.includes(0) || S.done.includes(1) ? 0.5 : 0;
      S.lift += (target - S.lift) * Math.min(1, dt * 14);
    } else if (S.mode === 'leave') {
      S.carX = Math.pow(S.t, 2) * 900;
      if (S.t > 1.1) {
        S.mode = S.stopIdx >= 5 ? 'summary' : 'between';
        S.t = 0;
      }
    }
    for (const p of S.pops) p.t += dt;
    S.pops = S.pops.filter((p) => p.t < 0.8);
    for (const p of S.parts) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    S.parts = S.parts.filter((p) => p.life > 0);
    S.shake = Math.max(0, S.shake - dt * 30);
  }

  // --- Çizim yardımcıları ---
  const lerp = (a, b, t) => a + (b - a) * t;
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function text(str, x, y, size, { font = 'display', color = '#f3ead8', align = 'center', glow = null, alpha = 1, max = VW - 32 } = {}) {
    ctx.globalAlpha = alpha;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    if (font === 'display') {
      ctx.font = `italic 900 ${size}px "Archivo Variable", system-ui, sans-serif`;
      if ('fontStretch' in ctx) ctx.fontStretch = 'expanded';
    } else {
      ctx.font = `700 ${size}px "Space Mono", ui-monospace, monospace`;
      if ('fontStretch' in ctx) ctx.fontStretch = 'normal';
    }
    if (glow) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = size * 0.5;
    }
    ctx.fillStyle = color;
    ctx.fillText(str, x, y, max);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  // Araç parçalarının araç merkezine göre konumu (araç sağa bakıyor; "sol" = ekranın üstü)
  const WHEELS = [
    { x: 104, y: -70 },
    { x: 104, y: 70 },
    { x: -88, y: -70 },
    { x: -88, y: 70 },
  ];
  function partPos(step) {
    if (step === 0) return { x: 196, y: 0 };
    if (step === 1) return { x: -168, y: 0 };
    if (step >= 2 && step <= 5) return WHEELS[step - 2];
    return { x: 240, y: -110 };
  }

  function drawPitLane() {
    const c = carPos();
    ctx.fillStyle = '#1b2242';
    ctx.fillRect(0, 0, VW, VHV);
    // pit şeridi asfaltı
    const laneH = 300;
    const g = ctx.createLinearGradient(0, c.y - laneH / 2, 0, c.y + laneH / 2);
    g.addColorStop(0, '#262d4d');
    g.addColorStop(1, '#1d2443');
    ctx.fillStyle = g;
    ctx.fillRect(0, c.y - laneH / 2, VW, laneH);
    // garaj tarafı (üst) ve pit duvarı (alt)
    ctx.fillStyle = '#0d1328';
    ctx.fillRect(0, 0, VW, c.y - laneH / 2);
    for (let x = 0; x < VW; x += 160) {
      ctx.fillStyle = '#141b38';
      ctx.fillRect(x + 8, c.y - laneH / 2 - 60, 144, 60);
      ctx.fillStyle = 'rgba(255,194,61,.12)';
      ctx.fillRect(x + 8, c.y - laneH / 2 - 8, 144, 8);
    }
    ctx.fillStyle = '#0a0e1e';
    ctx.fillRect(0, c.y + laneH / 2, VW, VHV);
    for (let x = 0; x < VW; x += 24) {
      ctx.fillStyle = Math.floor(x / 24) % 2 ? '#f3ead8' : '#ff6b2c';
      ctx.fillRect(x, c.y + laneH / 2, 24, 8);
    }
    // pit kutusu çizgileri
    ctx.strokeStyle = 'rgba(243,234,216,.55)';
    ctx.lineWidth = 4;
    ctx.setLineDash([18, 12]);
    ctx.strokeRect(c.x - 200, c.y - 120, 400, 240);
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffc23d';
    ctx.fillRect(c.x + 168, c.y - 120, 6, 240); // durma çizgisi
    // şerit kenar çizgileri
    ctx.fillStyle = 'rgba(243,234,216,.25)';
    for (let x = 0; x < VW; x += 60) {
      ctx.fillRect(x, c.y - laneH / 2 + 10, 30, 3);
    }
  }

  function bodyPath() {
    ctx.beginPath();
    ctx.moveTo(170, 0);
    ctx.lineTo(150, -11);
    ctx.lineTo(100, -17);
    ctx.lineTo(70, -44);
    ctx.lineTo(-40, -52);
    ctx.lineTo(-118, -42);
    ctx.lineTo(-130, -24);
    ctx.lineTo(-130, 24);
    ctx.lineTo(-118, 42);
    ctx.lineTo(-40, 52);
    ctx.lineTo(70, 44);
    ctx.lineTo(100, 17);
    ctx.lineTo(150, 11);
    ctx.closePath();
  }

  function drawCar(cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    const lift = 1 + S.lift * 0.035;
    // gölge: gövde şeklinde, kriko kalkınca biraz kayar
    ctx.save();
    ctx.translate(6 + S.lift * 6, 8 + S.lift * 8);
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    bodyPath();
    ctx.fill();
    ctx.restore();
    ctx.scale(lift, lift);

    // tekerlekler
    WHEELS.forEach((w, i) => {
      const changed = S.done.includes(i + 2);
      const off = S.mode === 'stop' && S.step === i + 2 ? Math.sin(S.t * 30) * 1.5 : 0;
      ctx.fillStyle = '#0b0f1f';
      rr(w.x - 30 + off, w.y - 17, 60, 34, 8);
      ctx.fill();
      ctx.strokeStyle = changed ? '#ff6b2c' : '#3a4266';
      ctx.lineWidth = 4;
      rr(w.x - 22 + off, w.y - 10, 44, 20, 5);
      ctx.stroke();
    });
    // arka kanat
    ctx.fillStyle = '#0d1328';
    rr(-152, -72, 24, 144, 4);
    ctx.fill();
    ctx.fillStyle = '#ff6b2c';
    ctx.fillRect(-152, -72, 24, 8);
    ctx.fillRect(-152, 64, 24, 8);
    // gövde
    bodyPath();
    ctx.fillStyle = '#f3ead8';
    ctx.fill();
    ctx.strokeStyle = '#0d1328';
    ctx.lineWidth = 4;
    ctx.stroke();
    // orta şerit
    ctx.fillStyle = '#ff6b2c';
    ctx.fillRect(-118, -7, 272, 14);
    ctx.fillStyle = '#0d1328';
    ctx.fillRect(-118, -10, 272, 3);
    ctx.fillRect(-118, 7, 272, 3);
    // ön kanat
    ctx.fillStyle = '#0d1328';
    rr(146, -80, 20, 160, 4);
    ctx.fill();
    ctx.fillStyle = '#ff6b2c';
    ctx.fillRect(146, -80, 20, 8);
    ctx.fillRect(146, 72, 20, 8);
    // kokpit + Monty'nin kaskı (üstten)
    ctx.fillStyle = '#0d1328';
    ctx.beginPath();
    ctx.ellipse(8, 0, 36, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f3ead8';
    ctx.beginPath();
    ctx.arc(2, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff6b2c';
    ctx.fillRect(-12, -4, 28, 8);
    ctx.fillStyle = '#ffc23d';
    ctx.fillRect(13, -6, 3, 4);
    ctx.fillRect(13, 2, 3, 4);
    ctx.restore();
  }

  function drawCrew(cx, cy) {
    const spots = [
      { x: 214, y: 0 },
      { x: -186, y: 0 },
      { x: 104, y: -118 },
      { x: 104, y: 118 },
      { x: -88, y: -118 },
      { x: -88, y: 118 },
    ];
    spots.forEach((s, i) => {
      const active = S.mode === 'stop' && S.step === i;
      const done = S.done.includes(i);
      const x = cx + s.x;
      const y = cy + s.y;
      if (active) {
        const pulse = 0.5 + Math.sin(S.t * 10) * 0.5;
        ctx.strokeStyle = `rgba(255,107,44,${0.5 + pulse * 0.5})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 22 + pulse * 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = done ? '#2b3561' : '#ff6b2c';
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f3ead8';
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    });
    // çıkış ışığı
    const lx = Math.min(cx + 252, VW - 24);
    const ly = cy - 150;
    ctx.fillStyle = '#05070f';
    rr(lx - 16, ly - 30, 32, 60, 8);
    ctx.fill();
    const green = S.mode === 'stop' && S.step === 6 && S.t >= S.greenAt;
    const leaving = S.mode === 'leave';
    ctx.fillStyle = green || leaving ? '#2a0d0d' : '#ff3b2f';
    ctx.beginPath();
    ctx.arc(lx, ly - 13, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = green || leaving ? '#3cdc78' : '#0d2a18';
    if (green || leaving) {
      ctx.shadowColor = '#3cdc78';
      ctx.shadowBlur = 16;
    }
    ctx.beginPath();
    ctx.arc(lx, ly + 13, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function drawGauge() {
    const g = gaugePos();
    const R = 64;
    const label = T.steps[Math.min(S.step, 6)];
    text(label, g.x, g.y - R - 22, 18, { color: '#f3ead8' });
    ctx.fillStyle = '#070b18';
    ctx.beginPath();
    ctx.arc(g.x, g.y, R + 14, 0, Math.PI * 2);
    ctx.fill();
    const A0 = -Math.PI / 2;
    const arc = (f0, f1, color, w) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.arc(g.x, g.y, R, A0 + f0 * Math.PI * 2, A0 + f1 * Math.PI * 2);
      ctx.stroke();
    };
    if (S.step === 6) {
      // çıkış adımı: ibre yok, ışık bekleniyor
      const green = S.t >= S.greenAt;
      arc(0, 1, green ? '#3cdc78' : '#ff3b2f', 14);
      text(green ? T.go : T.waitGreen, g.x, g.y + 7, green ? 26 : 13, { font: green ? 'display' : 'mono', color: green ? '#3cdc78' : '#ff3b2f' });
      return;
    }
    arc(0, 1, '#1d2749', 14);
    const gPad = (GOOD_W - PERFECT_W) / 2;
    arc(S.zone - gPad, S.zone + PERFECT_W + gPad, 'rgba(243,234,216,.35)', 14);
    arc(S.zone, S.zone + PERFECT_W, '#ffc23d', 14);
    const stalled = S.t < S.stall;
    const f = stalled ? 0 : needle();
    const a = A0 + f * Math.PI * 2;
    ctx.strokeStyle = stalled ? 'rgba(243,234,216,.3)' : '#f3ead8';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(a) * (R + 8), g.y + Math.sin(a) * (R + 8));
    ctx.stroke();
    ctx.fillStyle = '#ff6b2c';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHUD() {
    const time = S.mode === 'stop' ? S.elapsed : S.stopResult ? S.stopResult.time : 0;
    text(time.toFixed(3), VW / 2, 58, 46, { font: 'mono', color: '#ffc23d', glow: 'rgba(255,194,61,.5)' });
    text(T.stopTime, VW / 2, 78, 11, { font: 'mono', color: 'rgba(243,234,216,.55)' });
    // adım noktaları
    for (let i = 0; i < STEPS; i++) {
      const x = VW / 2 + (i - 3) * 18;
      ctx.fillStyle = S.done.includes(i) || (S.mode !== 'stop' && S.mode !== 'arrive' && S.stopResult) ? '#ffc23d' : S.step === i && S.mode === 'stop' ? '#ff6b2c' : '#2b3561';
      ctx.beginPath();
      ctx.arc(x, 96, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    text(T.pit(Math.min(5, S.stopIdx + (S.mode === 'leave' || S.mode === 'between' ? 0 : 1))), 22, 36, 14, { font: 'mono', color: '#f3ead8', align: 'left' });
    if (S.records.bestStop) text(`${T.best} ${S.records.bestStop.toFixed(3)}`, VW - 22, 36, 12, { font: 'mono', color: 'rgba(243,234,216,.6)', align: 'right' });
    if (sound.muted) text('♪ ✕', VW - 22, 58, 12, { font: 'mono', color: 'rgba(243,234,216,.5)', align: 'right' });
    for (const p of S.pops) {
      const a = Math.min(1, (0.8 - p.t) * 4);
      text(p.text, p.x, p.y - p.t * 30, 22, { color: p.color, glow: 'rgba(0,0,0,.6)', alpha: a });
    }
  }

  function veil(a) {
    ctx.fillStyle = `rgba(7,11,24,${a})`;
    ctx.fillRect(0, 0, VW, VHV);
  }

  const HELMET = new Path2D('M30 130 C30 62 78 22 130 22 C188 22 220 70 220 130 L220 158 C220 176 206 188 188 188 L62 188 C44 188 30 176 30 158 Z');
  const STRIPE = new Path2D('M112 23 C102 58 100 92 102 120 L136 120 C136 92 140 58 152 26 Z');
  function drawHelmet(x, y, width) {
    const s = width / 190;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.translate(-125, -188);
    ctx.fillStyle = '#f3ead8';
    ctx.strokeStyle = '#0d1328';
    ctx.lineWidth = 6;
    ctx.fill(HELMET);
    ctx.stroke(HELMET);
    ctx.fillStyle = '#ff6b2c';
    ctx.fill(STRIPE);
    ctx.fillStyle = '#0d1328';
    rr(46, 94, 164, 68, 30);
    ctx.fill();
    ctx.fillStyle = '#ffc23d';
    rr(84, 112, 24, 32, 5);
    ctx.fill();
    rr(146, 112, 24, 32, 5);
    ctx.fill();
    ctx.restore();
  }

  function drawTitle() {
    veil(0.6);
    const cy = VHV * 0.42;
    drawHelmet(VW / 2, cy - 54 + Math.sin(S.t * 3) * 5, 96);
    text(T.title, VW / 2, cy + 22, Math.min(68, VW / 7), { glow: 'rgba(255,107,44,.4)' });
    text(T.how1, VW / 2, cy + 54, 13, { font: 'mono', color: 'rgba(243,234,216,.8)' });
    text(T.how2, VW / 2, cy + 74, 12, { font: 'mono', color: 'rgba(243,234,216,.6)' });
    if (Math.floor(S.t * 2) % 2 === 0) text(T.start, VW / 2, cy + 112, 16, { font: 'mono', color: '#ffc23d', glow: 'rgba(255,194,61,.5)' });
    const r = S.records;
    if (r.bestStop) text(`${T.best} ${r.bestStop.toFixed(3)}   ·   ${T.raceBest} ${r.bestRace ? r.bestRace.toFixed(3) : '—'}`, VW / 2, cy + 138, 12, { font: 'mono', color: 'rgba(243,234,216,.55)' });
  }

  function drawBetween() {
    const last = S.stops[S.stops.length - 1];
    const cy = VHV * 0.42;
    veil(0.45);
    text(last.time.toFixed(3), VW / 2, cy, 64, { font: 'mono', color: '#ffc23d', glow: 'rgba(255,194,61,.5)' });
    text(S.newBest ? T.newBest : `${T.perfects}: ${last.perfects}/6`, VW / 2, cy + 36, S.newBest ? 22 : 13, {
      font: S.newBest ? 'display' : 'mono',
      color: S.newBest ? '#ffc23d' : 'rgba(243,234,216,.75)',
    });
    if (S.t > 0.5 && Math.floor(S.t * 2) % 2 === 0) text(T.next, VW / 2, cy + 74, 15, { font: 'mono', color: '#ffc23d' });
  }

  function drawSummary() {
    veil(0.7);
    const cy = VHV * 0.2;
    text(T.raceDone, VW / 2, cy + 20, Math.min(46, VW / 10));
    S.stops.forEach((s, i) => {
      text(`${T.pit(i + 1)}   ${s.time.toFixed(3)}   ${'★'.repeat(s.perfects)}${'·'.repeat(6 - s.perfects)}`, VW / 2, cy + 60 + i * 22, 13, {
        font: 'mono',
        color: 'rgba(243,234,216,.8)',
      });
    });
    const total = S.stops.reduce((a, s) => a + s.time, 0);
    text(`${T.total} ${total.toFixed(3)}`, VW / 2, cy + 60 + 5 * 22 + 22, 26, { font: 'mono', color: '#ffc23d', glow: 'rgba(255,194,61,.5)' });
    if (S.newRaceBest) text(T.newBest, VW / 2, cy + 60 + 5 * 22 + 52, 20, { color: '#ffc23d' });
    if (S.t > 0.9 && Math.floor(S.t * 2) % 2 === 0) text(T.again, VW / 2, cy + 60 + 5 * 22 + 84, 15, { font: 'mono', color: '#ffc23d' });
  }

  function draw() {
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    ctx.save();
    if (S.shake > 0) ctx.translate((Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake);
    drawPitLane();
    const c = carPos();
    const carX = c.x + (S.mode === 'title' ? 0 : S.carX);
    if (S.mode !== 'title') drawCrew(c.x, c.y);
    if (S.mode !== 'between' && S.mode !== 'summary') drawCar(carX, c.y);
    for (const p of S.parts) {
      ctx.globalAlpha = Math.max(0, p.life / 0.35);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    if (S.mode === 'title') drawTitle();
    else {
      if (S.mode === 'stop') drawGauge();
      if (S.mode !== 'summary') drawHUD();
      if (S.mode === 'between') drawBetween();
      if (S.mode === 'summary') drawSummary();
      if (S.paused) {
        veil(0.5);
        text(T.paused, VW / 2, VHV / 2, 40);
      }
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(document.documentElement);
  resize();
  requestAnimationFrame(frame);
  kit.fontsReady().then(() => kit.ready());
})();
