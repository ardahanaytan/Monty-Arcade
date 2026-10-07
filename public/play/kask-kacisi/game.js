/* Kask Kaçışı — Monty'nin sonsuz pist koşusu. Saf JS + Canvas. */
(() => {
  'use strict';

  const kit = MontyKit.create('kask-kacisi');
  const { sound, store } = kit;
  const touchUI = window.matchMedia?.('(pointer: coarse)').matches;

  const STR = {
    tr: {
      title: 'KASK KAÇIŞI',
      start: touchUI ? 'BAŞLAMAK İÇİN DOKUN' : 'BAŞLAMAK İÇİN BOŞLUK',
      hintJump: touchUI ? 'DOKUN: ZIPLA · BASILI TUT: DAHA YÜKSEK' : 'BOŞLUK / ↑ : ZIPLA · BASILI TUT: DAHA YÜKSEK',
      hintDuck: touchUI ? 'SOL KENARA BASILI TUT: EĞİL' : '↓ : EĞİL (HAVADAYKEN HIZLI İNİŞ)',
      best: 'EN İYİ',
      crash: 'KAZA!',
      cone: 'Koniye çarptın.',
      tires: 'Lastik duvarına çarptın. Daha uzun basılı tut!',
      oil: 'Yağa bastın ve savruldun.',
      sign: 'Tabelaya takıldın. Altından eğilerek geç!',
      distance: 'MESAFE',
      bolts: 'CİVATA',
      newBest: 'YENİ REKOR!',
      retry: touchUI ? 'TEKRAR İÇİN DOKUN' : 'TEKRAR: BOŞLUK',
      paused: 'DURAKLATILDI',
      resume: touchUI ? 'DEVAM İÇİN DOKUN' : 'DEVAM: P / BOŞLUK',
      checkpoint: 'CHECKPOINT',
      night: 'GECE YARIŞI',
    },
    en: {
      title: 'HELMET DASH',
      start: touchUI ? 'TAP TO START' : 'PRESS SPACE TO START',
      hintJump: touchUI ? 'TAP: JUMP · HOLD: JUMP HIGHER' : 'SPACE / ↑ : JUMP · HOLD: JUMP HIGHER',
      hintDuck: touchUI ? 'HOLD THE LEFT EDGE: DUCK' : '↓ : DUCK (FAST FALL IN THE AIR)',
      best: 'BEST',
      crash: 'CRASH!',
      cone: 'You hit a cone.',
      tires: 'You hit the tire wall. Hold longer!',
      oil: 'You hit the oil and spun out.',
      sign: 'You hit the sign. Duck under it!',
      distance: 'DISTANCE',
      bolts: 'BOLTS',
      newBest: 'NEW BEST!',
      retry: touchUI ? 'TAP TO RETRY' : 'RETRY: SPACE',
      paused: 'PAUSED',
      resume: touchUI ? 'TAP TO RESUME' : 'RESUME: P / SPACE',
      checkpoint: 'CHECKPOINT',
      night: 'NIGHT RACE',
    },
  };
  const T = STR[kit.lang];
  document.title = kit.lang === 'tr' ? 'Kask Kaçışı' : 'Helmet Dash';

  // --- Ekran ---
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  let W = 0;
  let H = 0;
  let dpr = 1;
  let scale = 1; // sanal birim → CSS piksel
  let VW = 800; // sanal genişlik
  let VHV = 450; // sanal yükseklik (görünen)
  let GY = 360; // zemin çizgisinin sanal y'si

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    // Yatayda yükseklik 450 birim; dar (dikey) ekranlarda en az 560 birim genişlik görünsün diye ölçek küçülür.
    scale = Math.max(0.1, Math.min(H / 450, W / 560));
    VW = W / scale;
    VHV = H / scale;
    GY = Math.min(VHV - 90, VHV * 0.5 + 200);
    P.x = Math.max(90, Math.min(VW * 0.2, 220));
  }

  // --- Monty (site maskotunun SVG yolları) ---
  const HELMET = new Path2D(
    'M30 130 C30 62 78 22 130 22 C188 22 220 70 220 130 L220 158 C220 176 206 188 188 188 L62 188 C44 188 30 176 30 158 Z',
  );
  const STRIPE = new Path2D('M112 23 C102 58 100 92 102 120 L136 120 C136 92 140 58 152 26 Z');
  const PIN_L = new Path2D('M104 23 C94 58 92 92 94 120 L100 120 C98 92 100 58 110 23 Z');
  const PIN_R = new Path2D('M156 26 C144 58 140 92 142 120 L148 120 C146 92 150 58 162 30 Z');
  const SHINE = new Path2D('M44 72 C60 44 86 30 108 27');

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /** Kaskı alt-orta noktası (x, y) olacak şekilde çizer. width: piksel genişlik. */
  function drawHelmet(x, y, width, sx, sy, rot, eyes) {
    const s = width / 190;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(s * sx, s * sy);
    ctx.translate(-125, -188);
    ctx.fillStyle = '#f3ead8';
    ctx.strokeStyle = '#0d1328';
    ctx.lineWidth = 6;
    ctx.fill(HELMET);
    ctx.stroke(HELMET);
    ctx.fillStyle = '#ff6b2c';
    ctx.fill(STRIPE);
    ctx.fillStyle = '#0d1328';
    ctx.fill(PIN_L);
    ctx.fill(PIN_R);
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke(SHINE);
    ctx.fillStyle = '#0d1328';
    rr(46, 94, 164, 68, 30);
    ctx.fill();
    ctx.fillStyle = '#ffc23d';
    if (eyes === 'x') {
      ctx.strokeStyle = '#ffc23d';
      ctx.lineWidth = 8;
      for (const ex of [96, 158]) {
        ctx.beginPath();
        ctx.moveTo(ex - 11, 114);
        ctx.lineTo(ex + 11, 142);
        ctx.moveTo(ex + 11, 114);
        ctx.lineTo(ex - 11, 142);
        ctx.stroke();
      }
    } else {
      const h = eyes === 'blink' ? 5 : 32;
      const top = 128 - h / 2;
      ctx.globalAlpha = 0.18;
      rr(80, top - 4, 32, h + 8, 8);
      ctx.fill();
      rr(142, top - 4, 32, h + 8, 8);
      ctx.fill();
      ctx.globalAlpha = 1;
      rr(84, top, 24, h, 5);
      ctx.fill();
      rr(146, top, 24, h, 5);
      ctx.fill();
    }
    ctx.strokeStyle = '#0d1328';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(96, 176);
    ctx.lineTo(154, 176);
    ctx.stroke();
    ctx.restore();
  }

  // --- Oyun durumu ---
  const PX_PER_M = 30;
  const GRAVITY = 2600;
  const JUMP_V = 900;
  const JUMP_CUT = 380;
  const P = { x: 140, y: 0, vy: 0, ground: true, duck: false, coyote: 0, buffer: 0, squash: 1, rot: 0, spin: 0 };
  const input = { jump: false, duck: false };
  const S = {
    mode: 'title', // title | run | over
    paused: false,
    t: 0,
    dist: 0,
    speed: 330,
    obstacles: [],
    bolts: [],
    gates: [],
    parts: [],
    nextSpawn: 0,
    nextGate: 500,
    boltCount: 0,
    best: store.get('best', 0),
    shake: 0,
    overT: 0,
    cause: '',
    newBest: false,
    banner: null, // { text, t }
    blink: 0,
  };
  const meters = () => Math.floor(S.dist / PX_PER_M);

  function reset() {
    Object.assign(P, { y: 0, vy: 0, ground: true, duck: false, coyote: 0, buffer: 0, squash: 1, rot: 0, spin: 0 });
    Object.assign(S, {
      mode: 'run',
      paused: false,
      t: 0,
      dist: 0,
      speed: 330,
      obstacles: [],
      bolts: [],
      gates: [],
      parts: [],
      nextSpawn: 650,
      nextGate: 500,
      boltCount: 0,
      shake: 0,
      overT: 0,
      newBest: false,
      banner: null,
      nightShown: false,
    });
    sound.tone(660, 0, 0.08, 'square', 0.04);
    sound.tone(990, 0.09, 0.12, 'square', 0.04);
  }

  // --- Engeller ---
  // Her engel: x (sol kenar, sanal), w, tip. Çarpışma kutusu tipten hesaplanır.
  const KINDS = {
    cone: { w: 28, hit: (o) => box(o.x + 4, 4, 20, 32) },
    tires: { w: 46, hit: (o) => box(o.x + 3, 0, 40, 76) },
    oil: { w: 140, hit: (o) => box(o.x + 10, 0, 120, 5) },
    sign: { w: 74, hit: (o) => box(o.x + 4, 40, 66, 2000) },
  };
  const box = (x, y, w, h) => ({ x, y, w, h }); // y: zeminden yükseklik (alt kenar)

  function addObstacle(kind, x) {
    S.obstacles.push({ kind, x, w: KINDS[kind].w });
  }

  function pickPattern() {
    const m = meters();
    const pool = [
      ['cone', 10],
      ['cone2', m > 120 ? 6 : 0],
      ['tires', m > 200 ? 7 : 0],
      ['oil', m > 300 ? 5 : 0],
      ['sign', m > 380 ? 6 : 0],
      ['coneSign', m > 900 ? 3 : 0],
      ['tiresOil', m > 1300 ? 2 : 0],
    ];
    let total = pool.reduce((a, p) => a + p[1], 0);
    let r = Math.random() * total;
    for (const [name, w] of pool) {
      if ((r -= w) < 0) return name;
    }
    return 'cone';
  }

  /** Bir engel grubu üretir, ardından bırakılacak boşluğu döndürür. */
  function spawn() {
    const x = VW + 40;
    const v = S.speed;
    let width = 0;
    switch (pickPattern()) {
      case 'cone':
        addObstacle('cone', x);
        width = 28;
        break;
      case 'cone2':
        addObstacle('cone', x);
        addObstacle('cone', x + 32);
        width = 60;
        break;
      case 'tires':
        addObstacle('tires', x);
        width = 46;
        break;
      case 'oil':
        addObstacle('oil', x);
        width = 140;
        break;
      case 'sign':
        addObstacle('sign', x);
        width = 74;
        break;
      case 'coneSign': {
        addObstacle('cone', x);
        const gap = v * 0.8;
        addObstacle('sign', x + 28 + gap);
        width = 28 + gap + 74;
        break;
      }
      case 'tiresOil': {
        addObstacle('tires', x);
        const gap = v * 0.85;
        addObstacle('oil', x + 46 + gap);
        width = 46 + gap + 140;
        break;
      }
    }
    // tepki + iniş payı; mesafe arttıkça rastgele kısım biraz daralır
    const slack = Math.max(0.45, 0.85 - meters() / 4000);
    const gap = v * (0.62 + Math.random() * slack) + 50;
    if (gap > v * 0.95 && Math.random() < 0.45) spawnBolts(x + width + gap * 0.18, gap * 0.6);
    return width + gap;
  }

  function spawnBolts(x, span) {
    const n = 3 + Math.floor(Math.random() * 3);
    const arc = Math.random() < 0.55;
    const step = Math.min(36, span / n);
    for (let i = 0; i < n; i++) {
      const k = n === 1 ? 0.5 : i / (n - 1);
      const h = arc ? 40 + Math.sin(k * Math.PI) * 80 : 26;
      S.bolts.push({ x: x + i * step, h, taken: false, t: Math.random() * 6 });
    }
  }

  // --- Parçacıklar ---
  function puff(x, y, n, color, speed, life) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random() * 0.7);
      S.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * 0.3, life, max: life, color, r: 2 + Math.random() * 3 });
    }
  }

  // --- Giriş ---
  function pressJump() {
    if (S.mode === 'title') return reset();
    if (S.mode === 'over') {
      if (S.overT > 0.6) reset();
      return;
    }
    if (S.paused) return togglePause();
    input.jump = true;
    P.buffer = 0.12;
  }
  function releaseJump() {
    input.jump = false;
  }
  function togglePause() {
    if (S.mode !== 'run') return;
    S.paused = !S.paused;
  }

  window.addEventListener('keydown', (e) => {
    const k = e.code;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) e.preventDefault();
    if (e.repeat) return;
    if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW' || k === 'Enter') pressJump();
    else if (k === 'ArrowDown' || k === 'KeyS') input.duck = true;
    else if (k === 'KeyP' || k === 'Escape') togglePause();
    else if (k === 'KeyR' && S.mode === 'run') reset();
    else if (k === 'KeyM') sound.setUserMuted(!sound.userMuted);
  });
  window.addEventListener('keyup', (e) => {
    const k = e.code;
    if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW' || k === 'Enter') releaseJump();
    else if (k === 'ArrowDown' || k === 'KeyS') input.duck = false;
  });

  // Dokunma: sol kenar (%30) eğilme, geri kalanı zıplama. Fare: her yer zıplama.
  const pointers = new Map();
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const duckZone = e.pointerType === 'touch' && S.mode === 'run' && !S.paused && e.clientX < W * 0.3;
    pointers.set(e.pointerId, duckZone ? 'duck' : 'jump');
    if (duckZone) input.duck = true;
    else pressJump();
  });
  const pointerEnd = (e) => {
    const role = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    if (role === 'duck' && ![...pointers.values()].includes('duck')) input.duck = false;
    if (role === 'jump' && ![...pointers.values()].includes('jump')) releaseJump();
  };
  canvas.addEventListener('pointerup', pointerEnd);
  canvas.addEventListener('pointercancel', pointerEnd);
  kit.on('pause', () => {
    if (S.mode === 'run') S.paused = true;
    input.jump = input.duck = false;
  });
  window.addEventListener('blur', () => {
    input.jump = input.duck = false;
  });

  // --- Güncelleme ---
  function crash(kind) {
    S.mode = 'over';
    S.cause = kind;
    S.overT = 0;
    S.shake = 14;
    P.vy = 520;
    P.ground = false;
    P.spin = (Math.random() < 0.5 ? -1 : 1) * 9;
    puff(P.x, GY - P.y - 20, 26, '#ff6b2c', 420, 0.7);
    puff(P.x, GY - P.y - 20, 14, '#f3ead8', 300, 0.6);
    sound.noise(0, 0.35, 700, 0.7, 0.9);
    sound.tone(140, 0, 0.3, 'sawtooth', 0.08, 40);
    const m = meters();
    if (m > S.best) {
      S.newBest = S.best > 0; // ilk koşu "rekor" sayılmaz
      S.best = m;
      store.set('best', m);
      [523, 659, 784, 1047].forEach((f, i) => sound.tone(f, 0.45 + i * 0.1, 0.14, 'square', 0.04));
    }
  }

  function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function playerBox() {
    const w = P.duck ? 64 : 56;
    const h = P.duck ? 30 : 50;
    return box(P.x - w / 2 + 8, P.y, w - 16, h - 6);
  }

  function update(dt) {
    S.blink -= dt;
    if (S.blink < -0.12) S.blink = 2 + Math.random() * 3;
    if (S.banner) {
      S.banner.t += dt;
      if (S.banner.t > 2.2) S.banner = null;
    }

    if (S.mode === 'run' && !S.paused) {
      S.t += dt;
      const m = meters();
      S.speed = Math.min(760, 330 + m * 0.28);
      const dx = S.speed * dt;
      S.dist += dx;

      // zıplama (tampon + coyote süresi ile affedici)
      P.buffer -= dt;
      P.coyote = P.ground ? 0.08 : P.coyote - dt;
      if (P.buffer > 0 && P.coyote > 0) {
        P.vy = JUMP_V;
        P.ground = false;
        P.coyote = 0;
        P.buffer = 0;
        P.squash = 1.25;
        sound.tone(320, 0, 0.12, 'square', 0.035, 720);
      }
      if (!P.ground) {
        if (!input.jump && P.vy > JUMP_CUT) P.vy = JUMP_CUT;
        const g = GRAVITY * (input.duck ? 2.6 : 1);
        P.vy -= g * dt;
        P.y += P.vy * dt;
        if (P.y <= 0) {
          P.y = 0;
          P.vy = 0;
          P.ground = true;
          P.squash = 0.72;
          puff(P.x, GY, 8, 'rgba(243,234,216,.8)', 160, 0.35);
          sound.noise(0, 0.06, 400, 1, 0.35);
        }
      }
      P.duck = input.duck && P.ground;
      P.rot = P.ground ? -0.04 : Math.max(-0.35, Math.min(0.25, -P.vy / 2600));

      for (const o of S.obstacles) o.x -= dx;
      for (const b of S.bolts) b.x -= dx;
      for (const g of S.gates) g.x -= dx;
      S.obstacles = S.obstacles.filter((o) => o.x + o.w > -60);
      S.bolts = S.bolts.filter((b) => b.x > -40 && !b.gone);
      S.gates = S.gates.filter((g) => g.x > -120);

      S.nextSpawn -= dx;
      if (S.nextSpawn <= 0) S.nextSpawn = spawn();

      // checkpoint kapısı: tam 500 m'nin katında oyuncunun hizasına gelecek şekilde önceden yerleştirilir
      const gateX = P.x + (S.nextGate * PX_PER_M - S.dist);
      if (gateX < VW + 60 && !S.gates.some((g) => g.m === S.nextGate)) S.gates.push({ x: gateX, m: S.nextGate });
      if (m >= S.nextGate) {
        S.banner = { text: `${T.checkpoint} · ${S.nextGate} m`, t: 0 };
        [784, 988, 1175].forEach((f, i) => sound.tone(f, i * 0.08, 0.12, 'square', 0.04));
        kit.unlock('checkpoint');
        if (S.nextGate === 1000) kit.unlock('one-km');
        if (S.nextGate === 2000) kit.unlock('two-km');
        S.nextGate += 500;
      }
      if (m >= 100) kit.unlock('first-100');
      if (m >= 800 && !S.nightShown) {
        S.nightShown = true;
        kit.unlock('night-race');
        if (!S.banner) S.banner = { text: T.night, t: 0 };
      }

      // çarpışmalar
      const pb = playerBox();
      for (const o of S.obstacles) {
        const hb = KINDS[o.kind].hit(o);
        if (overlaps(pb, hb)) {
          crash(o.kind);
          break;
        }
      }
      for (const b of S.bolts) {
        if (b.taken) continue;
        if (Math.abs(b.x - P.x) < 26 && b.h > P.y - 12 && b.h < P.y + (P.duck ? 30 : 52) + 12) {
          b.taken = true;
          b.gone = true;
          S.boltCount++;
          puff(b.x, GY - b.h, 6, '#ffc23d', 160, 0.35);
          sound.tone(1320 + (S.boltCount % 5) * 90, 0, 0.06, 'square', 0.03);
          if (S.boltCount >= 50) kit.unlock('bolt-50');
        }
      }
    } else if (S.mode === 'over') {
      S.overT += dt;
      // kask havaya fırlar, döner ve düşer
      P.vy -= GRAVITY * 0.7 * dt;
      P.y += P.vy * dt;
      P.rot += P.spin * dt;
      if (P.y < -200) P.y = -200;
    } else if (S.mode === 'title') {
      S.t += dt;
      S.dist += 120 * dt; // menüde pist yavaşça akar
    }

    P.squash += (1 - P.squash) * Math.min(1, dt * 12);
    S.shake = Math.max(0, S.shake - dt * 40);
    for (const p of S.parts) {
      p.life -= dt;
      p.x += p.vx * dt - (S.mode === 'run' && !S.paused ? S.speed * dt * 0.6 : 0);
      p.y += p.vy * dt;
      p.vy += 600 * dt;
    }
    S.parts = S.parts.filter((p) => p.life > 0);

    // hızlıyken kaskın altından kıvılcım
    if (S.mode === 'run' && !S.paused && P.ground && S.speed > 420 && Math.random() < dt * 30) {
      S.parts.push({ x: P.x - 18, y: GY - 2, vx: -120 - Math.random() * 160, vy: -60 - Math.random() * 80, life: 0.25, max: 0.25, color: '#ffc23d', r: 1.6 });
    }
  }

  // --- Çizim ---
  const lerp = (a, b, t) => a + (b - a) * t;
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => {
    const A = hex(a);
    const B = hex(b);
    return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
  };
  const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  // gün batımı → alacakaranlık → gece
  const THEMES = [
    { top: '#1d2754', bottom: '#f08a4b', far: '#2b2550', mid: '#1a2147', sun: '#ffc23d' },
    { top: '#10173a', bottom: '#6e4374', far: '#1e1a3d', mid: '#141a3a', sun: '#ff8f5a' },
    { top: '#050816', bottom: '#18234d', far: '#0b1026', mid: '#0a0f24', sun: '#f3ead8' },
  ];
  function theme() {
    const m = S.dist / PX_PER_M;
    const t1 = smooth(360, 440, m);
    const t2 = smooth(760, 840, m);
    const pick = (k) => (t2 > 0 ? mix(THEMES[1][k], THEMES[2][k], t2) : mix(THEMES[0][k], THEMES[1][k], t1));
    return { top: pick('top'), bottom: pick('bottom'), far: pick('far'), mid: pick('mid'), sun: pick('sun'), night: t2 };
  }

  // sabit tohumlu sözde rastgele (arka plan parçaları her seferinde aynı görünsün)
  const rnd = (i, k) => {
    const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  function drawBackground(th) {
    const sky = ctx.createLinearGradient(0, 0, 0, GY);
    sky.addColorStop(0, th.top);
    sky.addColorStop(1, th.bottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VW, GY);

    // yıldızlar
    if (th.night > 0) {
      ctx.fillStyle = `rgba(243,234,216,${0.7 * th.night})`;
      for (let i = 0; i < 70; i++) {
        const x = (rnd(i, 1) * VW * 1.2 - S.dist * 0.01) % (VW * 1.2);
        const y = rnd(i, 2) * (GY - 140);
        const s = rnd(i, 3) < 0.15 ? 2 : 1.2;
        ctx.fillRect((x + VW * 1.2) % (VW * 1.2), y, s, s);
      }
    }
    // güneş / ay
    const sunY = lerp(GY - 150, 90, th.night);
    ctx.fillStyle = th.sun;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(VW * 0.72, sunY, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.arc(VW * 0.72, sunY, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // uzak: tribünler ve ışık kuleleri
    const farOff = S.dist * 0.12;
    const tile = 520;
    ctx.fillStyle = th.far;
    for (let i = Math.floor(farOff / tile) - 1; i <= Math.floor((farOff + VW) / tile) + 1; i++) {
      const x0 = i * tile - farOff;
      const h1 = 70 + rnd(i, 4) * 40;
      const w1 = 220 + rnd(i, 5) * 140;
      ctx.beginPath();
      ctx.moveTo(x0, GY - 30);
      ctx.lineTo(x0 + 20, GY - h1);
      ctx.lineTo(x0 + w1, GY - h1 - 18);
      ctx.lineTo(x0 + w1 + 10, GY - 30);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(x0, GY - 34, tile, 34);
      // ışık kulesi
      const tx = x0 + w1 + 70 + rnd(i, 6) * 80;
      ctx.fillRect(tx, GY - 170, 5, 140);
      ctx.fillRect(tx - 14, GY - 180, 33, 14);
      if (th.night > 0) {
        const g = ctx.createRadialGradient(tx + 2, GY - 173, 2, tx + 2, GY - 173, 70);
        g.addColorStop(0, `rgba(255,236,190,${0.55 * th.night})`);
        g.addColorStop(1, 'rgba(255,236,190,0)');
        ctx.fillStyle = g;
        ctx.fillRect(tx - 70, GY - 243, 144, 140);
        // tribün ışıkları
        ctx.fillStyle = `rgba(255,194,61,${0.6 * th.night})`;
        for (let k = 0; k < 14; k++) ctx.fillRect(x0 + 30 + rnd(i, 10 + k) * (w1 - 40), GY - 40 - rnd(i, 30 + k) * (h1 - 30), 2, 2);
        ctx.fillStyle = th.far;
      }
    }

    // orta: reklam panoları ve tel çit (markasız, sadece şekiller)
    const midOff = S.dist * 0.5;
    const ptile = 300;
    for (let i = Math.floor(midOff / ptile) - 1; i <= Math.floor((midOff + VW) / ptile) + 1; i++) {
      const x0 = i * ptile - midOff;
      const variant = Math.floor(rnd(i, 7) * 3);
      const colors = ['#ff6b2c', '#f3ead8', '#2b3561'];
      ctx.fillStyle = th.mid;
      ctx.fillRect(x0, GY - 48, 230, 40);
      ctx.fillStyle = colors[variant];
      ctx.globalAlpha = 0.85 - th.night * 0.35;
      ctx.fillRect(x0 + 4, GY - 44, 222, 32);
      ctx.globalAlpha = 1;
      ctx.fillStyle = variant === 1 ? '#0d1328' : '#f3ead8';
      if (variant === 0) for (let k = 0; k < 6; k++) ctx.fillRect(x0 + 20 + k * 34, GY - 38, 18, 20);
      else if (variant === 1) {
        ctx.beginPath();
        ctx.arc(x0 + 40, GY - 28, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x0 + 60, GY - 32, 140, 8);
      } else {
        for (let k = 0; k < 9; k++) {
          ctx.beginPath();
          ctx.moveTo(x0 + 14 + k * 24, GY - 12);
          ctx.lineTo(x0 + 24 + k * 24, GY - 44);
          ctx.lineTo(x0 + 32 + k * 24, GY - 44);
          ctx.lineTo(x0 + 22 + k * 24, GY - 12);
          ctx.fill();
        }
      }
    }
    // tel çit
    ctx.strokeStyle = th.night > 0.5 ? 'rgba(243,234,216,.12)' : 'rgba(13,19,40,.35)';
    ctx.lineWidth = 2;
    const fOff = S.dist * 0.75;
    for (let x = -(fOff % 60); x < VW + 60; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, GY - 8);
      ctx.lineTo(x, GY - 110);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, GY - 108);
    ctx.lineTo(VW, GY - 108);
    ctx.stroke();
  }

  function drawTrack() {
    const asphalt = ctx.createLinearGradient(0, GY, 0, VHV);
    asphalt.addColorStop(0, '#2a3152');
    asphalt.addColorStop(1, '#141a33');
    ctx.fillStyle = asphalt;
    ctx.fillRect(0, GY, VW, VHV - GY);
    // damalı bordür
    const off = S.dist % 40;
    for (let x = -off; x < VW + 40; x += 20) {
      const even = Math.round((x + off) / 20) % 2 === 0;
      ctx.fillStyle = even ? '#f3ead8' : '#0d1328';
      ctx.fillRect(x, GY, 20, 7);
      ctx.fillStyle = even ? '#0d1328' : '#f3ead8';
      ctx.fillRect(x, GY + 7, 20, 7);
    }
    // şerit çizgileri
    ctx.fillStyle = 'rgba(243,234,216,.35)';
    const loff = S.dist % 160;
    for (let x = -loff; x < VW + 160; x += 160) ctx.fillRect(x, GY + 52, 80, 5);
    // hız çizgileri
    if (S.mode === 'run' && S.speed > 430) {
      const a = Math.min(0.35, (S.speed - 430) / 900);
      ctx.strokeStyle = `rgba(243,234,216,${a})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 9; i++) {
        const y = GY - 20 - rnd(i, 50) * (GY - 80);
        const len = 60 + rnd(i, 51) * 120;
        const x = VW - ((S.dist * (1.4 + rnd(i, 52)) + rnd(i, 53) * 2000) % (VW + 300));
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + len, y);
        ctx.stroke();
      }
    }
  }

  function drawCone(x) {
    const y = GY;
    ctx.fillStyle = '#0d1328';
    rr(x - 2, y - 6, 32, 6, 2);
    ctx.fill();
    ctx.fillStyle = '#ff6b2c';
    ctx.beginPath();
    ctx.moveTo(x + 14, y - 38);
    ctx.lineTo(x + 26, y - 5);
    ctx.lineTo(x + 2, y - 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f3ead8';
    ctx.beginPath();
    ctx.moveTo(x + 9.5, y - 26);
    ctx.lineTo(x + 18.5, y - 26);
    ctx.lineTo(x + 20.5, y - 19);
    ctx.lineTo(x + 7.5, y - 19);
    ctx.closePath();
    ctx.fill();
  }

  function drawTires(x) {
    for (let i = 0; i < 3; i++) {
      const y = GY - 26 * (i + 1);
      ctx.fillStyle = '#10142a';
      rr(x, y, 46, 26, 8);
      ctx.fill();
      ctx.fillStyle = i % 2 ? '#ff6b2c' : '#f3ead8';
      ctx.fillRect(x + 4, y + 10, 38, 5);
      ctx.strokeStyle = 'rgba(243,234,216,.18)';
      ctx.lineWidth = 2;
      rr(x + 1, y + 1, 44, 24, 7);
      ctx.stroke();
    }
  }

  function drawOil(x) {
    ctx.fillStyle = '#05070f';
    ctx.beginPath();
    ctx.ellipse(x + 70, GY + 3, 72, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createLinearGradient(x, GY, x + 140, GY);
    g.addColorStop(0, 'rgba(120,90,255,.0)');
    g.addColorStop(0.3, 'rgba(120,90,255,.45)');
    g.addColorStop(0.55, 'rgba(60,220,200,.45)');
    g.addColorStop(0.8, 'rgba(255,194,61,.4)');
    g.addColorStop(1, 'rgba(255,194,61,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x + 70, GY + 1, 50, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSign(x) {
    const bottom = GY - 42;
    const top = bottom - 70;
    ctx.strokeStyle = '#0a0e1e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 12, top);
    ctx.lineTo(x + 12, 0);
    ctx.moveTo(x + 62, top);
    ctx.lineTo(x + 62, 0);
    ctx.stroke();
    ctx.fillStyle = '#0d1328';
    rr(x, top, 74, 70, 6);
    ctx.fill();
    // damalı şerit + aşağı ok: "eğil" işareti
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = i % 2 ? '#0d1328' : '#f3ead8';
      ctx.fillRect(x + 1 + i * 8, bottom - 12, 8, 6);
      ctx.fillStyle = i % 2 ? '#f3ead8' : '#0d1328';
      ctx.fillRect(x + 1 + i * 8, bottom - 6, 8, 6);
    }
    ctx.fillStyle = '#ffc23d';
    ctx.beginPath();
    ctx.moveTo(x + 37, top + 50);
    ctx.lineTo(x + 22, top + 30);
    ctx.lineTo(x + 31, top + 30);
    ctx.lineTo(x + 31, top + 12);
    ctx.lineTo(x + 43, top + 12);
    ctx.lineTo(x + 43, top + 30);
    ctx.lineTo(x + 52, top + 30);
    ctx.closePath();
    ctx.fill();
  }

  function drawGate(g) {
    const x = g.x;
    ctx.fillStyle = '#0a0e1e';
    ctx.fillRect(x - 60, GY - 190, 10, 190);
    ctx.fillRect(x + 50, GY - 190, 10, 190);
    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 3; j++) {
        ctx.fillStyle = (i + j) % 2 ? '#0d1328' : '#f3ead8';
        ctx.fillRect(x - 60 + i * 8, GY - 214 + j * 8, 8, 8);
      }
    }
    ctx.fillStyle = '#ffc23d';
    ctx.font = '700 13px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${g.m} m`, x, GY - 222);
  }

  function drawBolt(b) {
    const y = GY - b.h;
    const pulse = 0.75 + Math.sin(S.t * 6 + b.t) * 0.25;
    ctx.fillStyle = `rgba(255,194,61,${0.25 * pulse})`;
    ctx.beginPath();
    ctx.arc(b.x, y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffc23d';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + S.t * 1.5;
      ctx.lineTo(b.x + Math.cos(a) * 8, y + Math.sin(a) * 8);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#0d1328';
    ctx.beginPath();
    ctx.arc(b.x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPlayer() {
    // gölge
    const shadowW = Math.max(10, 30 - P.y * 0.12);
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath();
    ctx.ellipse(P.x, GY + 3, shadowW, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // hız izi
    if (S.mode === 'run' && S.speed > 380) {
      ctx.strokeStyle = 'rgba(243,234,216,.35)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const y = GY - P.y - 12 - i * 13;
        ctx.beginPath();
        ctx.moveTo(P.x - 36 - i * 6, y);
        ctx.lineTo(P.x - 70 - i * 10 - (S.speed - 380) * 0.05, y);
        ctx.stroke();
      }
    }
    const duckS = P.duck ? 0.6 : 1;
    const sy = duckS * P.squash;
    const sx = (P.duck ? 1.14 : 1) * (2 - P.squash) * 0.5 + 0.5;
    const eyes = S.mode === 'over' ? 'x' : S.blink < 0 ? 'blink' : 'open';
    drawHelmet(P.x, GY - P.y, 58, sx, sy, P.rot, eyes);
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

  function drawHUD() {
    const m = meters();
    text(`${String(m).padStart(4, '0')} m`, 22, 44, 30, { font: 'mono', color: '#ffc23d', align: 'left', glow: 'rgba(255,194,61,.5)' });
    text(`${T.best} ${S.best} m`, 24, 66, 12, { font: 'mono', color: 'rgba(243,234,216,.6)', align: 'left' });
    // civata sayacı
    ctx.fillStyle = '#ffc23d';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.lineTo(VW - 92 + Math.cos(a) * 9, 36 + Math.sin(a) * 9);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#0d1328';
    ctx.beginPath();
    ctx.arc(VW - 92, 36, 3.2, 0, Math.PI * 2);
    ctx.fill();
    text(String(S.boltCount), VW - 76, 44, 24, { font: 'mono', color: '#f3ead8', align: 'left' });
    if (sound.muted) text('♪ ✕', VW - 22, 66, 11, { font: 'mono', color: 'rgba(243,234,216,.45)', align: 'right' });

    if (S.banner) {
      const t = S.banner.t;
      const a = Math.min(1, t * 4) * Math.min(1, (2.2 - t) * 3);
      text(S.banner.text, VW / 2, Math.min(GY - 150, VHV * 0.3), 30, { color: '#ffc23d', glow: 'rgba(255,194,61,.6)', alpha: a });
    }
    // dokunmatik eğilme bölgesi ipucu
    if (touchUI && S.mode === 'run' && !S.paused) {
      ctx.fillStyle = input.duck ? 'rgba(255,107,44,.22)' : 'rgba(243,234,216,.06)';
      ctx.fillRect(0, GY + 20, VW * 0.3, VHV - GY - 20);
      text('↓', VW * 0.15, Math.min(VHV - 20, GY + 70), 28, { font: 'mono', color: 'rgba(243,234,216,.4)' });
    }
  }

  function veil(a) {
    ctx.fillStyle = `rgba(7,11,24,${a})`;
    ctx.fillRect(0, 0, VW, VHV);
  }

  function drawTitle() {
    veil(0.45);
    const cy = Math.min(GY - 60, Math.max(170, VHV * 0.45));
    const bob = Math.sin(S.t * 3) * 6;
    drawHelmet(VW / 2, cy - 62 + bob, 104, 1, 1, Math.sin(S.t * 2) * 0.05, S.blink < 0 ? 'blink' : 'open');
    text(T.title, VW / 2, cy + 20, Math.min(64, VW / 9), { glow: 'rgba(255,107,44,.4)' });
    text(T.hintJump, VW / 2, cy + 52, 12, { font: 'mono', color: 'rgba(243,234,216,.75)' });
    text(T.hintDuck, VW / 2, cy + 72, 12, { font: 'mono', color: 'rgba(243,234,216,.75)' });
    if (Math.floor(S.t * 2) % 2 === 0) text(T.start, VW / 2, cy + 112, 16, { font: 'mono', color: '#ffc23d', glow: 'rgba(255,194,61,.5)' });
    if (S.best) text(`${T.best}: ${S.best} m`, VW / 2, cy + 136, 12, { font: 'mono', color: 'rgba(243,234,216,.55)' });
  }

  function drawOver() {
    const a = Math.min(1, S.overT * 2.5);
    veil(0.55 * a);
    const cy = Math.min(GY - 80, VHV * 0.4);
    text(T.crash, VW / 2, cy, Math.min(72, VW / 8), { color: '#ff6b2c', glow: 'rgba(255,107,44,.5)', alpha: a });
    text(T[S.cause] || '', VW / 2, cy + 30, 13, { font: 'mono', color: 'rgba(243,234,216,.8)', alpha: a });
    text(`${T.distance}: ${meters()} m   ·   ${T.bolts}: ${S.boltCount}`, VW / 2, cy + 64, 16, { font: 'mono', color: '#f3ead8', alpha: a });
    if (S.newBest) text(T.newBest, VW / 2, cy + 94, 20, { color: '#ffc23d', glow: 'rgba(255,194,61,.6)', alpha: a });
    else text(`${T.best}: ${S.best} m`, VW / 2, cy + 92, 12, { font: 'mono', color: 'rgba(243,234,216,.55)', alpha: a });
    if (S.overT > 0.6 && Math.floor(S.overT * 2) % 2 === 0) text(T.retry, VW / 2, cy + 128, 15, { font: 'mono', color: '#ffc23d' });
  }

  function draw() {
    const th = theme();
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    ctx.save();
    if (S.shake > 0) ctx.translate((Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake);
    drawBackground(th);
    drawTrack();
    for (const g of S.gates) drawGate(g);
    for (const o of S.obstacles) {
      if (o.kind === 'cone') drawCone(o.x);
      else if (o.kind === 'tires') drawTires(o.x);
      else if (o.kind === 'oil') drawOil(o.x);
    }
    for (const b of S.bolts) if (!b.taken) drawBolt(b);
    if (S.mode !== 'title') drawPlayer();
    for (const o of S.obstacles) if (o.kind === 'sign') drawSign(o.x);
    for (const p of S.parts) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // gece: pist farları
    if (th.night > 0 && S.mode !== 'title') {
      const g = ctx.createRadialGradient(P.x + 120, GY - 20, 10, P.x + 120, GY - 20, 260);
      g.addColorStop(0, `rgba(255,236,190,${0.12 * th.night})`);
      g.addColorStop(1, 'rgba(255,236,190,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VW, VHV);
    }
    ctx.restore();

    if (S.mode === 'title') drawTitle();
    else {
      drawHUD();
      if (S.mode === 'over') drawOver();
      else if (S.paused) {
        veil(0.5);
        text(T.paused, VW / 2, VHV * 0.42, 44);
        text(T.resume, VW / 2, VHV * 0.42 + 36, 14, { font: 'mono', color: '#ffc23d' });
      }
    }
  }

  // --- Döngü ---
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
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
