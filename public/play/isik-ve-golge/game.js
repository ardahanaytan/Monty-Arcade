/*
 * Işık ve Gölge — akış: başlık → bölüm → bölüm sonu. Giriş, HUD, ses, kayıt, ölçekleme.
 * Aynı klavyede 2 kişi: Işık WASD (W zıplar), Gölge oklar (↑ zıplar).
 */
(function () {
  'use strict';

  const kit = MontyKit.create('isik-ve-golge');
  const { World, TILE } = IVGWorld;
  const { LEVELS } = IVGLevels;
  const R = IVGRender;
  const SC = IVGScenes;
  const { VW, VH } = R;
  const sound = kit.sound;
  const STEP = 1 / 120;

  const STR = {
    tr: {
      title: 'IŞIK VE GÖLGE',
      subtitle: 'Birbirine dokunamayan iki yürek',
      start: 'ENTER: BAŞLA',
      two: 'AYNI KLAVYEDE 2 KİŞİ',
      level: (n) => `BÖLÜM ${n}`,
      light: 'IŞIK',
      shadow: 'GÖLGE',
      move: 'YÜRÜ',
      jump: 'ZIPLA',
      complete: 'BÖLÜM TAMAM',
      time: 'SÜRE',
      stars: 'YILDIZ TOZU',
      feathers: 'GECE TÜYÜ',
      next: 'ENTER: SIRADAKİ BÖLÜM',
      toTitle: 'ENTER: BAŞLIĞA DÖN',
      final: 'ENTER: FİNAL',
      paused: 'DURAKLATILDI',
      resume: 'ENTER: DEVAM',
      restart: 'R: BÖLÜMÜ YENİDEN BAŞLAT',
      menu: 'ESC: BAŞLIK',
      best: 'EN İYİ',
      hintEnd: 'Her ikisi de kendi kapısında durunca bölüm biter.',
      skip: 'ENTER: GEÇ',
      pick: 'B: BÖLÜMLER',
      selTitle: 'BÖLÜMLER',
      selHelp: 'OKLAR / WASD: SEÇ    ENTER: OYNA    ESC: GERİ',
      region: { dungeon: 'ZİNDAN', courtyard: 'AVLU', sur: 'SUR', ozgurluk: 'ÖZGÜRLÜK' },
      doneMark: 'TAMAM',
      locked: 'Önceki bölümü bitirince açılır.',
    },
    en: {
      title: 'LIGHT & SHADOW',
      subtitle: 'Two hearts that cannot touch',
      start: 'ENTER: START',
      two: '2 PLAYERS, ONE KEYBOARD',
      level: (n) => `LEVEL ${n}`,
      light: 'LIGHT',
      shadow: 'SHADOW',
      move: 'MOVE',
      jump: 'JUMP',
      complete: 'LEVEL COMPLETE',
      time: 'TIME',
      stars: 'STARDUST',
      feathers: 'NIGHT FEATHERS',
      next: 'ENTER: NEXT LEVEL',
      toTitle: 'ENTER: BACK TO TITLE',
      final: 'ENTER: FINALE',
      paused: 'PAUSED',
      resume: 'ENTER: RESUME',
      restart: 'R: RESTART LEVEL',
      menu: 'ESC: TITLE',
      best: 'BEST',
      hintEnd: 'The level ends when both stand at their own doors.',
      skip: 'ENTER: SKIP',
      pick: 'B: LEVELS',
      selTitle: 'LEVELS',
      selHelp: 'ARROWS / WASD: PICK    ENTER: PLAY    ESC: BACK',
      region: { dungeon: 'DUNGEON', courtyard: 'COURTYARD', sur: 'RAMPART', ozgurluk: 'FREEDOM' },
      doneMark: 'DONE',
      locked: 'Opens after you finish the previous level.',
    },
  };
  const T = STR[kit.lang];
  document.title = kit.lang === 'tr' ? 'Işık ve Gölge' : 'Light & Shadow';

  // --- Kayıt ---
  /** { done: { [levelId]: { time, stars, feathers } } } */
  const save = kit.store.get('save', { done: {} });
  const persist = () => kit.store.set('save', save);
  // Başarımlar: bölümü ?level= / ?unlock= / ?scene= ile atlayarak açılan oyunlarda verilmez (hile sayılır)
  const _q = new URLSearchParams(location.search);
  const CHEAT = !!(_q.get('unlock') || _q.get('level') || _q.get('scene'));
  const ach = (id) => {
    if (CHEAT) return;
    if (_q.get('debug')) (window.__ach = window.__ach || []).push(id); // test: hangi başarımlar tetiklendi
    kit.unlock(id);
  };
  const totals = (lv) => ({
    star: lv.items.filter((it) => it.kind === 'star').length,
    feather: lv.items.filter((it) => it.kind === 'feather').length,
  });
  /** Bir bölüm bitince ilerleme başarımlarını değerlendirir. */
  function checkLevelAchievements(i, res, w) {
    const n = i + 1;
    if (n === 1) ach('first-light');
    if (n === 5) ach('dungeon-out');
    if (n === 10) ach('courtyard-beyond');
    if (n === 15) ach('on-ramparts');
    const t = w.total;
    const allStars = t.star > 0 && res.stars === t.star;
    const allFeathers = t.feather > 0 && res.feathers === t.feather;
    if (allStars) ach('stardust-hunter');
    if (allFeathers) ach('feather-hunter');
    if (allStars && allFeathers) ach('perfect');
    if (G.deaths === 0) ach('no-death');
    if (save.done['zindan-sinavi'] && save.done['uzun-sicrayis']) ach('spark-master');
    // tüm bölümlerde her şey toplanmış mı (en iyi kayıtlardan)
    let all = true;
    for (const lv of LEVELS) {
      const d = save.done[lv.id];
      const tt = totals(lv);
      if (!d || d.stars < tt.star || d.feathers < tt.feather) {
        all = false;
        break;
      }
    }
    if (all) ach('collector');
  }

  // --- Tuval ---
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  let scale = 1;
  let ox = 0;
  let oy = 0;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    // çok büyük/yüksek DPI ekranlarda arka tampon boyutunu sınırla (dolgu maliyeti piksel sayısıyla artar); CSS tuvali yine tam ekrana gerer
    const k = Math.min(1, 2000 / (w * dpr));
    canvas.width = Math.round(w * dpr * k);
    canvas.height = Math.round(h * dpr * k);
    scale = Math.min(canvas.width / VW, canvas.height / VH);
    ox = (canvas.width - VW * scale) / 2;
    oy = (canvas.height - VH * scale) / 2;
  }
  window.addEventListener('resize', resize);
  resize();

  // --- Durum ---
  const G = {
    mode: 'title', // title | intro | play | complete | outro
    sceneT: 0,
    sceneCue: 0,
    sel: 0,
    selFrom: 'title',
    lockShake: 0,
    deaths: 0, // bu bölüm girişindeki ölüm sayısı (başarım: hiç ölmeden bitir)
    t: 0,
    levelIndex: 0,
    world: null,
    parts: [],
    lvT: 0,
    paused: false,
    shake: 0,
    completeT: 0,
    result: null,
  };

  /** Bölüme dışarıdan girmek (seçim, sonraki bölüm, açılış): bölümün ölüm sayacı sıfırlanır. */
  function enterLevel(i) {
    G.deaths = 0;
    startLevel(i);
  }
  function startLevel(i) {
    G.levelIndex = i;
    G.world = new World(LEVELS[i]);
    G.world.curtainFlash = {};
    G.parts = [];
    G.lvT = 0;
    G.paused = false;
    G.mode = 'play';
  }

  // --- Bölüm seçimi ---
  const SEL = { cols: 5, cw: 210, ch: 112, gap: 16, x0: 83, y0: 138 };
  const REGION_COL = { dungeon: '#6a78d8', courtyard: '#8a96ee', sur: '#c08ad8', ozgurluk: '#f0c0e8' };
  // Bölüm i, öncekini bitirince açılır (?unlock=1 ile hepsi açık: test için)
  const q0 = new URLSearchParams(location.search);
  const UNLOCK_ALL = !!q0.get('unlock');
  const isOpen = (i) => UNLOCK_ALL || i === 0 || !!save.done[LEVELS[i - 1].id];
  function tryStart(i) {
    if (isOpen(i)) {
      enterLevel(i);
      return;
    }
    G.lockShake = 0.35;
    sound.tone(150, 0, 0.12, 'square', 0.05, 100);
  }
  function openSelect(from) {
    G.selFrom = from;
    G.sel = Math.max(0, Math.min(LEVELS.length - 1, G.levelIndex));
    G.mode = 'select';
  }
  const selRect = (i) => ({
    x: SEL.x0 + (i % SEL.cols) * (SEL.cw + SEL.gap),
    y: SEL.y0 + Math.floor(i / SEL.cols) * (SEL.ch + SEL.gap),
    w: SEL.cw,
    h: SEL.ch,
  });
  const toWorld = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * (canvas.width / r.width) - ox) / scale, y: ((e.clientY - r.top) * (canvas.height / r.height) - oy) / scale };
  };
  const hitCard = (p) => {
    for (let i = 0; i < LEVELS.length; i++) {
      const c = selRect(i);
      if (p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h) return i;
    }
    return -1;
  };
  canvas.addEventListener('pointermove', (e) => {
    if (G.mode !== 'select') return;
    const i = hitCard(toWorld(e));
    if (i >= 0) G.sel = i;
  });
  canvas.addEventListener('click', (e) => {
    if (G.mode === 'title') {
      const p = toWorld(e);
      if (p.y > 505 && p.y < 560 && Math.abs(p.x - VW / 2) < 160) startScene('intro');
      else if (p.y > 596 && Math.abs(p.x - VW / 2) < 120) openSelect('title');
      return;
    }
    if (G.mode !== 'select') return;
    const i = hitCard(toWorld(e));
    if (i >= 0) tryStart(i);
  });

  // --- Sahneler (açılış / kapanış) ---
  function startScene(kind) {
    G.mode = kind; // 'intro' | 'outro'
    G.sceneT = 0;
    G.sceneCue = 0;
    G.parts = [];
  }
  function sceneUpdate(dt) {
    const sc = SC[G.mode];
    G.sceneT += dt;
    while (G.sceneCue < sc.cues.length && G.sceneT >= sc.cues[G.sceneCue].t) {
      sc.cues[G.sceneCue].f(sound);
      G.sceneCue++;
    }
    if (G.mode === 'intro' && G.sceneT >= sc.dur) enterLevel(0);
    if (G.mode === 'outro' && G.fromFinal && G.sceneT >= 18.4) ach('freedom');
  }
  function drawScene() {
    SC[G.mode].draw(ctx, G.sceneT, { VW, VH, R, text, lang: kit.lang });
    const sc = SC[G.mode];
    const done = G.sceneT >= sc.dur;
    if (G.mode === 'intro' || done || G.sceneT > 3) {
      text(done ? T.toTitle : T.skip, VW - 24, VH - 20, 13, { font: 'mono', align: 'right', color: '#ffd27a', alpha: done ? 0.6 + 0.4 * Math.sin(G.t * 4) : 0.5 });
    }
  }

  // --- Giriş ---
  const keys = new Set();
  const PREVENT = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space']);
  window.addEventListener('keydown', (e) => {
    if (PREVENT.has(e.code)) e.preventDefault();
    if (e.repeat) return;
    keys.add(e.code);
    onKey(e.code);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());
  canvas.addEventListener('pointerdown', () => window.focus());
  kit.on('pause', () => {
    keys.clear();
    if (G.mode === 'play') G.paused = true;
  });

  function onKey(code) {
    if (code === 'KeyM') sound.setUserMuted(!sound.userMuted);
    if (G.mode === 'title') {
      if (code === 'Enter' || code === 'Space') startScene('intro');
      else if (code === 'KeyB' || code === 'KeyL') openSelect('title');
    } else if (G.mode === 'select') {
      const COLS = 5;
      const n = LEVELS.length;
      if (code === 'ArrowLeft' || code === 'KeyA') G.sel = Math.max(0, G.sel - 1);
      else if (code === 'ArrowRight' || code === 'KeyD') G.sel = Math.min(n - 1, G.sel + 1);
      else if (code === 'ArrowUp' || code === 'KeyW') G.sel = G.sel - COLS >= 0 ? G.sel - COLS : G.sel;
      else if (code === 'ArrowDown' || code === 'KeyS') G.sel = G.sel + COLS < n ? G.sel + COLS : G.sel;
      else if (code === 'Enter' || code === 'Space') tryStart(G.sel);
      else if (code === 'Escape' || code === 'Backspace' || code === 'KeyB') {
        if (G.selFrom === 'play' && G.world) {
          G.mode = 'play';
          G.paused = true;
        } else G.mode = 'title';
      }
    } else if (G.mode === 'intro') {
      if (code === 'Enter' || code === 'Space' || code === 'Escape') enterLevel(0);
    } else if (G.mode === 'outro') {
      if ((code === 'Enter' || code === 'Space' || code === 'Escape') && G.sceneT > 1.5) {
        G.mode = 'title';
        G.fromFinal = false;
      }
    } else if (G.mode === 'play') {
      if (code === 'Escape' || code === 'KeyP') G.paused = !G.paused;
      else if (G.paused && code === 'Enter') G.paused = false;
      else if (code === 'KeyR') startLevel(G.levelIndex);
      else if (G.paused && code === 'Backspace') G.mode = 'title';
      else if (G.paused && (code === 'KeyB' || code === 'KeyL')) openSelect('play');
    } else if (G.mode === 'complete' && G.completeT > 0.8) {
      if (code === 'Enter' || code === 'Space') {
        if (G.levelIndex + 1 < LEVELS.length) enterLevel(G.levelIndex + 1);
        else {
          G.fromFinal = true;
          startScene('outro');
        }
      }
    }
  }

  const readInput = () => ({
    light: { left: keys.has('KeyA'), right: keys.has('KeyD'), jump: keys.has('KeyW') },
    shadow: { left: keys.has('ArrowLeft'), right: keys.has('ArrowRight'), jump: keys.has('ArrowUp') },
  });

  // --- Parçacıklar ve ses ---
  function burst(x, y, n, color, speed, life = 0.6, r = 2.4, up = 0) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random() * 0.7);
      G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - up, life: life * (0.6 + Math.random() * 0.4), max: life, r: r * (0.5 + Math.random() * 0.8), color });
    }
  }
  function handleEvents(w) {
    for (const e of w.events) {
      if (e.type === 'jump') {
        burst(e.x, e.y, 5, e.kind === 'light' ? 'rgba(255,220,150,.8)' : 'rgba(170,130,255,.8)', 40, 0.4, 2, -20);
        sound.tone(e.kind === 'light' ? 420 : 300, 0, 0.11, 'triangle', 0.05, e.kind === 'light' ? 640 : 460);
      } else if (e.type === 'land') {
        burst(e.x, e.y, 6, 'rgba(200,210,255,.6)', 60, 0.35, 2);
        sound.noise(0, 0.06, 240, 1, 0.12, 'lowpass');
      } else if (e.type === 'pickup') {
        const star = e.kind === 'star';
        burst(e.x, e.y, 14, star ? '#ffe9a8' : '#c8b0ff', 120, 0.7, 2.6);
        [880, 1175, 1568].forEach((f, i) => sound.tone(star ? f : f * 0.75, i * 0.07, 0.25, 'sine', 0.05));
      } else if (e.type === 'spark') {
        burst(e.x, e.y, 22, '#fff1c4', 220, 0.5, 2.4);
        burst(e.x, e.y, 14, '#b79bff', 200, 0.5, 2.4);
        G.shake = 4;
        sound.tone(1200, 0, 0.12, 'sawtooth', 0.04, 300);
        sound.noise(0, 0.08, 3000, 1, 0.1, 'highpass');
      } else if (e.type === 'curtain') {
        const r = Math.floor(e.y / TILE);
        for (const c of [Math.floor(e.x / TILE), Math.floor(e.x / TILE) - 1]) if (w.tileAt(c, r) === e.ch) w.curtainFlash[c] = 1;
        burst(e.x, e.y, 10, e.ch === 'l' ? 'rgba(255,214,130,.9)' : 'rgba(150,100,255,.9)', 90, 0.5, 2);
        sound.tone(120, 0, 0.14, 'sine', 0.07, 70);
      } else if (e.type === 'death') {
        G.deaths++;
        save.deaths = (save.deaths || 0) + 1;
        persist();
        if (save.deaths >= 50) ach('fog-kings-guest');
        const light = e.kind === 'light';
        burst(e.x, e.y, 30, light ? '#9aa4d8' : '#b79bff', 160, 1.0, 3, 40);
        if (light) {
          sound.noise(0, 0.5, 700, 1, 0.22, 'lowpass');
          sound.tone(520, 0, 0.6, 'sine', 0.06, 90);
        } else {
          sound.tone(900, 0, 0.5, 'sawtooth', 0.05, 120);
          sound.noise(0, 0.25, 4000, 1, 0.12, 'highpass');
        }
        G.shake = 7;
      } else if (e.type === 'lever') {
        burst(e.x, e.y, 8, '#cfd6ff', 90, 0.4, 2);
        sound.tone(e.pos === 'right' ? 240 : 190, 0, 0.08, 'square', 0.05);
        sound.noise(0.02, 0.07, 1800, 1, 0.08);
      } else if (e.type === 'plate') {
        sound.tone(e.down ? 330 : 250, 0, 0.07, 'square', 0.04);
      } else if (e.type === 'sdoor') {
        sound.noise(0, 0.5, 160, 1, 0.22, 'lowpass');
        sound.tone(e.open ? 110 : 90, 0, 0.45, 'sine', 0.05, e.open ? 140 : 70);
        G.shake = Math.max(G.shake, 2);
      } else if (e.type === 'lifthit') {
        sound.noise(0, 0.1, 200, 1, 0.1, 'lowpass');
      } else if (e.type === 'lantern') {
        burst(e.x, e.y, 12, e.lit ? '#ffe9a8' : '#8c93c8', 100, 0.6, 2.4);
        sound.tone(e.lit ? 660 : 330, 0, 0.25, 'sine', 0.06, e.lit ? 880 : 200);
      } else if (e.type === 'boxpush') {
        sound.noise(0, 0.05, 300, 1, 0.05, 'lowpass');
      } else if (e.type === 'doorin') {
        sound.tone(e.kind === 'light' ? 660 : 495, 0, 0.3, 'sine', 0.05);
      } else if (e.type === 'won') {
        [523, 659, 784, 1047].forEach((f, i) => sound.tone(f, i * 0.12, 0.6, 'sine', 0.06));
      }
    }
    w.events.length = 0;
  }

  function finish() {
    const w = G.world;
    const id = LEVELS[G.levelIndex].id;
    const prev = save.done[id];
    const res = { time: w.time, stars: w.collected.star, feathers: w.collected.feather };
    G.result = { ...res, bestTime: prev ? Math.min(prev.time, res.time) : res.time, newBest: !prev || res.time < prev.time };
    save.done[id] = { time: G.result.bestTime, stars: Math.max(prev ? prev.stars : 0, res.stars), feathers: Math.max(prev ? prev.feathers : 0, res.feathers) };
    persist();
    checkLevelAchievements(G.levelIndex, res, w);
    G.mode = 'complete';
    G.completeT = 0;
  }

  // --- Güncelleme ---
  let acc = 0;
  function update(dt) {
    G.t += dt;
    G.lockShake = Math.max(0, G.lockShake - dt);
    G.shake = Math.max(0, G.shake - dt * 30);
    for (const p of G.parts) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt;
      p.life -= dt;
    }
    G.parts = G.parts.filter((p) => p.life > 0);
    if (G.mode === 'complete') G.completeT += dt;
    if (G.mode === 'intro' || G.mode === 'outro') {
      sceneUpdate(dt);
      return;
    }
    if (G.mode !== 'play') return;
    const w = G.world;
    if (!G.paused) {
      G.lvT += dt;
      acc += Math.min(dt, 0.05);
      const inp = readInput();
      while (acc >= STEP) {
        w.step(STEP, inp);
        acc -= STEP;
      }
      handleEvents(w);
      for (const k of Object.keys(w.curtainFlash)) w.curtainFlash[k] = Math.max(0, w.curtainFlash[k] - dt * 3);
      if (w.state === 'won' && w.stateT > 1.1) finish();
      if (w.state === 'dead' && w.deadT > 1.1) startLevel(G.levelIndex);
    }
  }

  // --- Çizim yardımcıları ---
  function text(str, x, y, size, o = {}) {
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.font = o.font === 'mono' ? `700 ${size}px "Space Mono", ui-monospace, monospace` : `italic 900 ${size}px "Archivo Variable", system-ui, sans-serif`;
    ctx.textAlign = o.align || 'center';
    if (o.glow) {
      ctx.shadowColor = o.glow;
      ctx.shadowBlur = 18;
    }
    ctx.fillStyle = o.color || '#f3ead8';
    ctx.fillText(str, x, y);
    ctx.restore();
  }
  const veil = (a) => {
    ctx.fillStyle = `rgba(5,7,18,${a})`;
    ctx.fillRect(0, 0, VW, VH);
  };

  function drawHints(w) {
    const big = G.lvT < 9;
    const a = big ? Math.min(1, G.lvT * 2) * (G.lvT > 7.5 ? Math.max(0.55, 9 - G.lvT) : 1) : 0.55;
    ctx.save();
    ctx.globalAlpha = a;
    const y = VH - 44;
    const group = (x, title, accent, caps, labels, align) => {
      ctx.font = '700 12px "Space Mono", monospace';
      let total = 0;
      for (const c of caps) total += Math.max(28, ctx.measureText(c).width + 16) + 4;
      const lw = Math.max(ctx.measureText(labels).width, 0) + 12;
      const w0 = ctx.measureText(title).width + 22 + total + lw + 12;
      let cx = align === 'left' ? x : x - w0;
      ctx.fillStyle = 'rgba(5,7,18,.6)';
      R.rr(ctx, cx - 10, y - 10, w0 + 8, 46, 12);
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.textAlign = 'left';
      ctx.fillText(title, cx, y + 17);
      cx += ctx.measureText(title).width + 14;
      for (const c of caps) cx += R.keycap(ctx, cx, y, c, accent) + 4;
      ctx.font = '700 12px "Space Mono", monospace';
      ctx.fillStyle = big ? '#ffd27a' : 'rgba(243,234,216,.8)';
      ctx.textAlign = 'left';
      ctx.fillText(labels, cx + 6, y + 17);
    };
    group(24, T.light, '#ffc86a', ['A', 'D', 'W'], `${T.move} · ${T.jump}`, 'left');
    group(VW - 24, T.shadow, '#a98bff', ['←', '→', '↑'], `${T.move} · ${T.jump}`, 'right');
    ctx.restore();
  }

  function drawHUD(w) {
    // sol üst: Işık'ın yıldız tozu; sağ üst: Gölge'nin gece tüyü
    const row = (x, kind, n, total, align) => {
      for (let i = 0; i < total; i++) {
        const cx = align === 'left' ? x + i * 26 : x - i * 26;
        const on = i < n;
        ctx.save();
        ctx.translate(cx, 30);
        if (kind === 'star') {
          ctx.fillStyle = on ? '#ffe9a8' : 'rgba(243,234,216,.18)';
          if (on) ctx.shadowColor = 'rgba(255,214,130,.9)';
          if (on) ctx.shadowBlur = 10;
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2 - Math.PI / 2;
            const rad = k % 2 ? 3.5 : 10;
            ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.rotate(-0.6);
          ctx.fillStyle = on ? '#b79bff' : 'rgba(243,234,216,.18)';
          if (on) ctx.shadowColor = 'rgba(170,120,255,.9)';
          if (on) ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(0, -11);
          ctx.quadraticCurveTo(7, -2, 0, 11);
          ctx.quadraticCurveTo(-7, -2, 0, -11);
          ctx.fill();
        }
        ctx.restore();
      }
    };
    row(36, 'star', w.collected.star, w.total.star, 'left');
    row(VW - 36, 'feather', w.collected.feather, w.total.feather, 'right');
    // her zaman görünen küçük bölüm göstergesi (üst orta)
    text(`${T.level(G.levelIndex + 1)} / ${LEVELS.length}`, VW / 2, 28, 14, { font: 'mono', color: 'rgba(243,234,216,.8)' });
    text(LEVELS[G.levelIndex].name[kit.lang], VW / 2, 46, 12, { font: 'mono', color: 'rgba(243,234,216,.45)' });
    // bölüm adı
    if (G.lvT < 3.2) {
      const a = Math.min(1, G.lvT * 3) * Math.min(1, (3.2 - G.lvT) * 2);
      const lv = LEVELS[G.levelIndex];
      text(T.level(G.levelIndex + 1), VW / 2, VH * 0.3, 15, { font: 'mono', color: 'rgba(243,234,216,.75)', alpha: a });
      text(lv.name[kit.lang], VW / 2, VH * 0.3 + 46, 44, { alpha: a, glow: 'rgba(0,0,0,.6)' });
    }
  }

  function drawPlay() {
    const w = G.world;
    const cam = { x: G.shake ? (Math.random() - 0.5) * G.shake : 0, y: G.shake ? (Math.random() - 0.5) * G.shake : 0 };
    R.drawScene(ctx, w, cam, G.t);
    ctx.save();
    ctx.translate(cam.x, cam.y);
    R.drawParticles(ctx, G.parts);
    ctx.restore();
    drawHUD(w);
    drawHints(w);
    if (sound.muted) text('♪ ✕', VW / 2, VH - 14, 12, { font: 'mono', color: 'rgba(243,234,216,.5)' });
    if (w.state === 'dead') veil(Math.min(0.55, w.deadT * 0.6));
    if (w.state === 'won') {
      ctx.fillStyle = `rgba(255,236,200,${Math.min(0.3, w.stateT * 0.3)})`;
      ctx.fillRect(0, 0, VW, VH);
    }
    if (G.paused) {
      veil(0.65);
      text(T.paused, VW / 2, VH * 0.36, 46);
      text(T.resume, VW / 2, VH * 0.36 + 64, 16, { font: 'mono', color: '#ffd27a' });
      text(T.restart, VW / 2, VH * 0.36 + 94, 14, { font: 'mono' });
      text(T.pick, VW / 2, VH * 0.36 + 120, 14, { font: 'mono' });
      text('BACKSPACE: ' + T.menu.split(': ')[1], VW / 2, VH * 0.36 + 146, 14, { font: 'mono' });
    }
  }

  function drawTitle() {
    const bg = G.title || (G.title = new World(LEVELS[0]));
    R.drawScene(ctx, bg, { x: 0, y: 0 }, G.t);
    veil(0.72);
    // iki figür, aralarında kıvılcım
    const mk = (kind, x) => ({ kind, x, y: 420, w: 22, h: 34, vx: 0, vy: 0, onGround: true, face: kind === 'light' ? 1 : -1, walk: 0, squash: 1 });
    const t = G.t;
    const sep = 120 + Math.sin(t * 1.4) * 14;
    const a = mk('light', VW / 2 - sep);
    const b = mk('shadow', VW / 2 + sep);
    drawFig(a, t);
    drawFig(b, t);
    // ortada nabız atan kıvılcım
    R.glow(ctx, VW / 2, 400, 90 + Math.sin(t * 3) * 10, '255,230,180', 0.18);
    text(T.title, VW / 2, 250, 78, { glow: 'rgba(255,200,120,.5)' });
    text(T.subtitle, VW / 2, 296, 18, { font: 'mono', color: 'rgba(243,234,216,.75)' });
    text(T.start, VW / 2, 540, 20, { font: 'mono', color: '#ffd27a', alpha: 0.6 + 0.4 * Math.sin(t * 4) });
    text(T.pick, VW / 2, 612, 14, { font: 'mono', color: 'rgba(243,234,216,.8)' });
    text(T.two, VW / 2, 582, 13, { font: 'mono', color: 'rgba(243,234,216,.6)' });
    if (sound.muted) text('♪ ✕ (M)', VW - 24, VH - 16, 12, { font: 'mono', color: 'rgba(243,234,216,.5)', align: 'right' });
    else text('M: ♪', VW - 24, VH - 16, 12, { font: 'mono', color: 'rgba(243,234,216,.4)', align: 'right' });
  }
  const drawFig = (h, t) => R.drawHeroAt(ctx, h, t);

  function drawSelect() {
    const bg = G.title || (G.title = new World(LEVELS[0]));
    R.drawScene(ctx, bg, { x: 0, y: 0 }, G.t);
    veil(0.84);
    text(T.selTitle, VW / 2, 84, 46, { glow: 'rgba(255,200,120,.4)' });
    let doneCount = 0;
    for (const lv of LEVELS) if (save.done[lv.id]) doneCount++;
    text(`${doneCount} / ${LEVELS.length}`, VW / 2, 112, 15, { font: 'mono', color: 'rgba(243,234,216,.7)' });
    for (let i = 0; i < LEVELS.length; i++) {
      const lv = LEVELS[i];
      const c = selRect(i);
      const d = save.done[lv.id];
      const sel = i === G.sel;
      const open = isOpen(i);
      const cur = G.selFrom === 'play' && i === G.levelIndex;
      const col = REGION_COL[lv.region] || '#8a96ee';
      ctx.save();
      if (!open) ctx.globalAlpha = 0.55;
      if (sel && !open && G.lockShake > 0) ctx.translate(Math.sin(G.lockShake * 70) * 5, 0);
      ctx.fillStyle = sel ? 'rgba(40,46,90,.95)' : 'rgba(16,20,44,.85)';
      R.rr(ctx, c.x, c.y, c.w, c.h, 12);
      ctx.fill();
      ctx.lineWidth = sel ? 3 : 1.5;
      ctx.strokeStyle = sel ? '#ffd27a' : d ? col : 'rgba(150,160,210,.28)';
      if (sel) {
        ctx.shadowColor = 'rgba(255,200,120,.7)';
        ctx.shadowBlur = 16;
      }
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = col;
      ctx.globalAlpha = d ? 0.9 : 0.4;
      ctx.fillRect(c.x + 14, c.y + 12, 26, 3);
      ctx.globalAlpha = 1;
      text(T.region[lv.region], c.x + 48, c.y + 18, 10, { font: 'mono', align: 'left', color: 'rgba(243,234,216,.55)' });
      text(String(i + 1), c.x + 16, c.y + 66, 44, { align: 'left', color: d ? '#ffe9a8' : 'rgba(243,234,216,.85)' });
      text(lv.name[kit.lang], c.x + 16, c.y + c.h - 30, 14, { font: 'mono', align: 'left', color: 'rgba(243,234,216,.9)' });
      if (d) {
        const ts = lv.items.filter((it) => it.kind === 'star').length;
        const tf = lv.items.filter((it) => it.kind === 'feather').length;
        text('✓ ' + T.doneMark, c.x + c.w - 14, c.y + 22, 11, { font: 'mono', align: 'right', color: '#9af0b4' });
        text(`${d.time.toFixed(1)} s`, c.x + c.w - 14, c.y + 50, 12, { font: 'mono', align: 'right', color: 'rgba(243,234,216,.75)' });
        text(`★ ${d.stars}/${ts}   ✦ ${d.feathers}/${tf}`, c.x + 16, c.y + c.h - 11, 11, { font: 'mono', align: 'left', color: 'rgba(243,234,216,.6)' });
      }
      if (cur) text('▶', c.x + c.w - 14, c.y + 22, 12, { font: 'mono', align: 'right', color: '#ffd27a' });
      if (!open) {
        // asma kilit
        const lx = c.x + c.w - 30;
        const ly = c.y + 40;
        ctx.save();
        ctx.strokeStyle = 'rgba(243,234,216,.75)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(lx, ly - 3, 7, Math.PI, 0);
        ctx.stroke();
        ctx.fillStyle = 'rgba(243,234,216,.75)';
        R.rr(ctx, lx - 11, ly - 3, 22, 17, 3);
        ctx.fill();
        ctx.restore();
      }
    }
    if (!isOpen(G.sel)) text(T.locked, VW / 2, VH - 54, 14, { font: 'mono', color: '#ffb36a' });
    text(T.selHelp, VW / 2, VH - 28, 13, { font: 'mono', color: 'rgba(243,234,216,.65)' });
  }

  function drawComplete() {
    const w = G.world;
    R.drawScene(ctx, w, { x: 0, y: 0 }, G.t);
    veil(0.75);
    const r = G.result;
    const a = Math.min(1, G.completeT * 1.6);
    text(T.complete, VW / 2, 210, 62, { alpha: a, glow: 'rgba(255,200,120,.45)' });
    text(`${T.time}  ${r.time.toFixed(1)} s` + (r.newBest ? `   ★ ${T.best}` : `   ${T.best} ${r.bestTime.toFixed(1)} s`), VW / 2, 290, 18, { font: 'mono', alpha: a });
    text(`${T.stars}  ${r.stars}/${w.total.star}`, VW / 2 - 170, 360, 18, { font: 'mono', color: '#ffe9a8', alpha: a });
    text(`${T.feathers}  ${r.feathers}/${w.total.feather}`, VW / 2 + 170, 360, 18, { font: 'mono', color: '#c8b0ff', alpha: a });
    const next = G.levelIndex + 1 < LEVELS.length;
    text(next ? T.next : T.final, VW / 2, 470, 18, { font: 'mono', color: '#ffd27a', alpha: G.completeT > 0.8 ? 0.6 + 0.4 * Math.sin(G.t * 4) : 0 });
  }

  const FPS = { on: false, n: 0, t0: performance.now(), fps: 0 };
  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0d1328';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
    ctx.beginPath();
    ctx.rect(0, 0, VW, VH);
    ctx.clip();
    if (G.mode === 'title') drawTitle();
    else if (G.mode === 'intro' || G.mode === 'outro') drawScene();
    else if (G.mode === 'select') drawSelect();
    else if (G.mode === 'complete') drawComplete();
    else drawPlay();
    if (FPS.on) {
      // ?fps=1 : performans teşhisi (kare/sn, ort. kare süresi, bölüm, parçacık, canvas boyutu)
      FPS.n++;
      if (performance.now() - FPS.t0 >= 500) {
        FPS.fps = (FPS.n * 1000) / (performance.now() - FPS.t0);
        FPS.n = 0;
        FPS.t0 = performance.now();
      }
      text(`${FPS.fps.toFixed(0)} fps · B${G.levelIndex + 1} · parçacık ${G.parts.length} · ${canvas.width}×${canvas.height}`, 12, VH - 8, 12, { font: 'mono', align: 'left', color: '#7dff9a' });
    }
  }

  // --- Döngü ---
  const q = new URLSearchParams(location.search);
  FPS.on = !!q.get('fps');
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }
  kit.fontsReady().then(() => {
    const lv = parseInt(q.get('level') || '', 10);
    if (lv >= 1 && lv <= LEVELS.length) enterLevel(lv - 1);
    else if (q.get('scene') === 'intro' || q.get('scene') === 'outro') startScene(q.get('scene'));
    last = performance.now();
    requestAnimationFrame(frame);
    kit.ready();
  });
  if (q.get('debug')) window.__G = G;
})();
