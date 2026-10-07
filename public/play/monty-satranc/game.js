/* Monty Satranç — arayüz, giriş, ses, kayıt ve site iletişimi. Kurallar ve yapay zeka engine.js'te. */
(() => {
  'use strict';

  const C = window.MontyChess;
  const { WHITE, BLACK, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING, F_CAP, F_EP, F_CASTLE, F_PROMO } = C;
  const { mFrom, mTo, mPromo, mFlags } = C;
  const SLUG = 'monty-satranc';
  const VALUE = [0, 1, 3, 3, 5, 9, 0];

  // --- Dil ---
  const lang = new URLSearchParams(location.search).get('lang') === 'tr' ? 'tr' : 'en';
  document.documentElement.lang = lang;
  const STR = {
    tr: {
      title: 'MONTY SATRANÇ',
      subtitle: "Monty'ye karşı satranç. Seviyeni seç, ilk hamleyi yap.",
      difficulty: 'ZORLUK',
      color: 'RENGİN',
      easy: 'Kolay',
      medium: 'Orta',
      hard: 'Zor',
      easyDesc: 'Monty daha acemi, sık sık hata yapar.',
      mediumDesc: 'Birkaç hamle ilerisini hesaplar.',
      hardDesc: 'Monty tüm gücüyle oynar.',
      white: 'Beyaz',
      black: 'Siyah',
      random: 'Rastgele',
      start: 'BAŞLA',
      resume: 'Kaldığın yerden devam et',
      record: (r) => `G ${r.w} · M ${r.l} · B ${r.d}`,
      recordLine: (lvl, r) => `${lvl.toLocaleUpperCase('tr')} SEVİYE: G ${r.w} · M ${r.l} · B ${r.d}`,
      you: 'SEN',
      yourTurn: 'Sıra sende',
      thinking: 'Monty düşünüyor…',
      check: 'Şah!',
      noMoves: 'İlk hamle seni bekliyor',
      undo: 'Geri al',
      resign: 'Teslim ol',
      confirmResign: 'Emin misin?',
      newGame: 'Yeni oyun',
      menu: 'Menü',
      promote: 'Terfi: taşını seç',
      win: 'KAZANDIN!',
      lose: 'KAYBETTİN',
      draw: 'BERABERE',
      kicker: (lvl) => `MONTY · ${lvl.toLocaleUpperCase('tr')}`,
      mateWin: 'Şah mat! Monty pes etti.',
      mateLose: 'Şah mat. Bir dahaki sefere!',
      resigned: 'Teslim oldun.',
      stalemate: 'Pat: sırası gelenin yasal hamlesi yok.',
      fifty: '50 hamle kuralı: alma ya da piyon hamlesi olmadı.',
      repetition: 'Aynı konum üç kez tekrarlandı.',
      material: 'Mat edecek kadar taş kalmadı.',
      overWin: 'Oyun bitti · kazandın',
      overLose: 'Oyun bitti · kaybettin',
      overDraw: 'Oyun bitti · berabere',
      again: 'Tekrar oyna',
      review: 'Tahtaya bak',
      board: 'Satranç tahtası',
      sound: 'Ses',
    },
    en: {
      title: 'MONTY CHESS',
      subtitle: 'Play chess against Monty. Pick a level and make the first move.',
      difficulty: 'DIFFICULTY',
      color: 'YOUR COLOR',
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      easyDesc: 'Monty is a beginner and makes mistakes.',
      mediumDesc: 'Thinks a few moves ahead.',
      hardDesc: 'Monty plays at full strength.',
      white: 'White',
      black: 'Black',
      random: 'Random',
      start: 'START',
      resume: 'Continue your game',
      record: (r) => `W ${r.w} · L ${r.l} · D ${r.d}`,
      recordLine: (lvl, r) => `${lvl.toUpperCase()} LEVEL: W ${r.w} · L ${r.l} · D ${r.d}`,
      you: 'YOU',
      yourTurn: 'Your move',
      thinking: 'Monty is thinking…',
      check: 'Check!',
      noMoves: 'The first move is yours',
      undo: 'Undo',
      resign: 'Resign',
      confirmResign: 'Sure?',
      newGame: 'New game',
      menu: 'Menu',
      promote: 'Promotion: pick a piece',
      win: 'YOU WIN!',
      lose: 'YOU LOST',
      draw: 'DRAW',
      kicker: (lvl) => `MONTY · ${lvl.toUpperCase()}`,
      mateWin: 'Checkmate! Monty is beaten.',
      mateLose: 'Checkmate. Better luck next time!',
      resigned: 'You resigned.',
      stalemate: 'Stalemate: the side to move has no legal moves.',
      fifty: '50-move rule: no capture or pawn move.',
      repetition: 'The same position appeared three times.',
      material: 'Not enough material left to checkmate.',
      overWin: 'Game over · you won',
      overLose: 'Game over · you lost',
      overDraw: 'Game over · draw',
      again: 'Play again',
      review: 'View board',
      board: 'Chess board',
      sound: 'Sound',
    },
  };
  const T = STR[lang];

  // --- Yerel kayıt (anahtarlar monty:<slug>: önekli) ---
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(`monty:${SLUG}:${key}`);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(`monty:${SLUG}:${key}`, JSON.stringify(value));
      } catch {}
    },
    del(key) {
      try {
        localStorage.removeItem(`monty:${SLUG}:${key}`);
      } catch {}
    },
  };

  // --- Site iletişimi (GAMES.md §3). Site dışında hiçbir şey yapmaz. ---
  const inFrame = window.parent !== window;
  const unlocked = new Set();
  const Monty = {
    post(msg) {
      if (!inFrame) return;
      try {
        window.parent.postMessage({ source: 'monty-sdk', v: 1, ...msg }, location.origin);
      } catch {}
    },
    ready() {
      this.post({ type: 'ready' });
    },
    unlock(id) {
      if (unlocked.has(id)) return;
      unlocked.add(id);
      this.post({ type: 'unlock', gameId: SLUG, achievementId: id });
    },
  };

  // --- Ses: WebAudio ile üretilen kısa efektler, dosya yok ---
  const Sound = (() => {
    let ac = null;
    let noise = null;
    let userMuted = store.get('muted', false);
    let siteMuted = false;
    function unlock() {
      if (!ac) {
        const AC = window.AudioContext || /** @type {any} */ (window).webkitAudioContext; // eski Safari
        if (!AC) return;
        ac = new AC();
        noise = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.25), ac.sampleRate);
        const d = noise.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ac.state === 'suspended') ac.resume();
    }
    function tone(freq, t, dur, type, vol, freqEnd) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    }
    function burst(t, dur, freq, q, vol) {
      const s = ac.createBufferSource();
      s.buffer = noise;
      const f = ac.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = freq;
      f.Q.value = q;
      const g = ac.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f).connect(g).connect(ac.destination);
      s.start(t);
      s.stop(t + dur + 0.02);
    }
    function play(name) {
      if (!ac || userMuted || siteMuted || ac.state !== 'running') return;
      const t = ac.currentTime + 0.005;
      switch (name) {
        case 'move':
          burst(t, 0.05, 1700, 1.4, 0.55);
          tone(170, t, 0.06, 'sine', 0.3, 80);
          break;
        case 'capture':
          burst(t, 0.09, 900, 0.9, 0.9);
          tone(120, t, 0.1, 'sine', 0.4, 50);
          break;
        case 'castle':
          burst(t, 0.05, 1700, 1.4, 0.5);
          burst(t + 0.09, 0.05, 1500, 1.4, 0.5);
          break;
        case 'check':
          tone(988, t + 0.05, 0.07, 'square', 0.05);
          tone(988, t + 0.15, 0.08, 'square', 0.05);
          break;
        case 'start':
          tone(660, t, 0.08, 'square', 0.04);
          tone(990, t + 0.1, 0.12, 'square', 0.04);
          break;
        case 'win':
          [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.11, 0.16, 'square', 0.045));
          break;
        case 'lose':
          [392, 330, 262].forEach((f, i) => tone(f, t + i * 0.17, 0.22, 'triangle', 0.09));
          break;
        case 'draw':
          tone(523, t, 0.16, 'triangle', 0.08);
          tone(523, t + 0.22, 0.2, 'triangle', 0.08);
          break;
        case 'error':
          tone(150, t, 0.08, 'square', 0.035);
          break;
      }
    }
    return {
      unlock,
      play,
      get userMuted() {
        return userMuted;
      },
      setUserMuted(v) {
        userMuted = v;
        store.set('muted', v);
      },
      setSiteMuted(v) {
        siteMuted = v;
      },
    };
  })();

  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin) return;
    const d = e.data;
    if (d && d.source === 'monty-site' && d.type === 'mute') Sound.setSiteMuted(!!d.muted);
  });

  // --- Taş çizimi (100x100 birimlik özgün, geometrik taşlar) ---
  function rr(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  const BODY = {
    // gövde parçaları sırayla doldurulup çizilir; sonra yaka ve taban gelir
    [PAWN]: [
      (c) => {
        c.moveTo(36, 74);
        c.quadraticCurveTo(40, 56, 44, 47);
        c.lineTo(56, 47);
        c.quadraticCurveTo(60, 56, 64, 74);
        c.closePath();
      },
      (c) => rr(c, 37, 42, 26, 6, 3),
      (c) => c.arc(50, 31, 12, 0, Math.PI * 2),
    ],
    [ROOK]: [
      (c) => {
        c.moveTo(33, 74);
        c.lineTo(36, 42);
        c.lineTo(64, 42);
        c.lineTo(67, 74);
        c.closePath();
      },
      (c) => {
        c.moveTo(28, 42);
        c.lineTo(28, 18);
        c.lineTo(37, 18);
        c.lineTo(37, 25);
        c.lineTo(45, 25);
        c.lineTo(45, 18);
        c.lineTo(55, 18);
        c.lineTo(55, 25);
        c.lineTo(63, 25);
        c.lineTo(63, 18);
        c.lineTo(72, 18);
        c.lineTo(72, 42);
        c.closePath();
      },
    ],
    [KNIGHT]: [
      (c) => {
        c.moveTo(30, 74);
        c.bezierCurveTo(30, 62, 36, 55, 44, 50);
        c.bezierCurveTo(38, 52, 32, 54, 27, 55);
        c.bezierCurveTo(21, 56, 17, 52, 18, 47);
        c.bezierCurveTo(19, 42, 24, 38, 29, 34);
        c.bezierCurveTo(33, 30, 36, 24, 40, 20);
        c.lineTo(42, 9);
        c.lineTo(50, 17);
        c.bezierCurveTo(64, 20, 74, 32, 74, 48);
        c.bezierCurveTo(74, 60, 71, 68, 70, 74);
        c.closePath();
      },
    ],
    [BISHOP]: [
      (c) => {
        c.moveTo(38, 74);
        c.quadraticCurveTo(42, 64, 42, 56);
        c.lineTo(58, 56);
        c.quadraticCurveTo(58, 64, 62, 74);
        c.closePath();
      },
      (c) => rr(c, 36, 51, 28, 6, 3),
      (c) => {
        c.moveTo(50, 16);
        c.bezierCurveTo(64, 26, 66, 40, 59, 51);
        c.lineTo(41, 51);
        c.bezierCurveTo(34, 40, 36, 26, 50, 16);
        c.closePath();
      },
      (c) => c.arc(50, 12, 5, 0, Math.PI * 2),
    ],
    [QUEEN]: [
      (c) => {
        c.moveTo(35, 74);
        c.quadraticCurveTo(41, 64, 40, 56);
        c.lineTo(60, 56);
        c.quadraticCurveTo(59, 64, 65, 74);
        c.closePath();
      },
      (c) => {
        c.moveTo(33, 51);
        c.lineTo(24, 25);
        c.lineTo(36, 39);
        c.lineTo(40, 20);
        c.lineTo(46, 36);
        c.lineTo(50, 14);
        c.lineTo(54, 36);
        c.lineTo(60, 20);
        c.lineTo(64, 39);
        c.lineTo(76, 25);
        c.lineTo(67, 51);
        c.closePath();
      },
      (c) => rr(c, 33, 50, 34, 7, 3),
      (c) => {
        for (const [x, y] of [
          [24, 25],
          [40, 20],
          [50, 14],
          [60, 20],
          [76, 25],
        ]) {
          c.moveTo(x + 3.8, y);
          c.arc(x, y, 3.8, 0, Math.PI * 2);
        }
      },
    ],
    [KING]: [
      (c) => {
        c.moveTo(35, 74);
        c.quadraticCurveTo(41, 64, 40, 56);
        c.lineTo(60, 56);
        c.quadraticCurveTo(59, 64, 65, 74);
        c.closePath();
      },
      (c) => {
        c.moveTo(32, 51);
        c.bezierCurveTo(22, 36, 30, 24, 42, 28);
        c.bezierCurveTo(46, 29, 49, 33, 50, 36);
        c.bezierCurveTo(51, 33, 54, 29, 58, 28);
        c.bezierCurveTo(70, 24, 78, 36, 68, 51);
        c.closePath();
      },
      (c) => rr(c, 33, 50, 34, 7, 3),
    ],
  };

  function drawPiece(ctx, type, color, size) {
    const white = color === WHITE;
    ctx.save();
    ctx.scale(size / 100, size / 100);
    const fill = ctx.createLinearGradient(0, 10, 0, 90);
    if (white) {
      fill.addColorStop(0, '#fffaf0');
      fill.addColorStop(1, '#e2d5b9');
    } else {
      fill.addColorStop(0, '#364170');
      fill.addColorStop(1, '#141a33');
    }
    const ink = white ? '#141a33' : '#05070f';
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const part = (build, f) => {
      ctx.beginPath();
      build(ctx);
      ctx.fillStyle = f || fill;
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.stroke();
    };

    ctx.fillStyle = 'rgba(0,0,0,.2)';
    ctx.beginPath();
    ctx.ellipse(50, 91, 30, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    for (const build of BODY[type]) part(build);
    if (type === KING) {
      // şahın haçı Monty turuncusu: iki şah tahtada hemen seçilir
      part((c) => {
        c.moveTo(47, 7);
        c.lineTo(53, 7);
        c.lineTo(53, 12);
        c.lineTo(59, 12);
        c.lineTo(59, 18);
        c.lineTo(53, 18);
        c.lineTo(53, 28);
        c.lineTo(47, 28);
        c.lineTo(47, 18);
        c.lineTo(41, 18);
        c.lineTo(41, 12);
        c.lineTo(47, 12);
        c.closePath();
      }, '#ff6b2c');
    }
    part((c) => rr(c, 28, 73, 44, 8, 3));
    part((c) => rr(c, 22, 80, 56, 10, 4));

    // ayrıntılar
    ctx.fillStyle = ink;
    ctx.strokeStyle = ink;
    if (type === KNIGHT) {
      ctx.beginPath();
      ctx.arc(37, 31, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(23, 46, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(53, 21);
      ctx.bezierCurveTo(62, 27, 67, 38, 67, 52);
      ctx.stroke();
    } else if (type === BISHOP) {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(55, 27);
      ctx.lineTo(47, 37);
      ctx.stroke();
    }
    // parlama
    ctx.strokeStyle = white ? 'rgba(255,255,255,.75)' : 'rgba(243,234,216,.22)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(26, 84);
    ctx.lineTo(40, 84);
    ctx.stroke();
    ctx.restore();
  }

  const pieceURL = {};
  (() => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 96;
    const ctx = cv.getContext('2d');
    for (const color of [WHITE, BLACK]) {
      for (let type = PAWN; type <= KING; type++) {
        ctx.clearRect(0, 0, 96, 96);
        drawPiece(ctx, type, color, 96);
        pieceURL[color | type] = cv.toDataURL();
      }
    }
  })();

  // --- DOM ---
  const $ = (id) => document.getElementById(id);
  const app = $('app');
  const canvas = $('board');
  const ctx = canvas.getContext('2d');
  const ui = {
    status: $('status'),
    moves: $('moves'),
    thinking: $('thinking'),
    levelBadge: $('levelBadge'),
    capsAi: $('capsAi'),
    capsYou: $('capsYou'),
    youAvatar: $('youAvatar'),
    undo: $('btnUndo'),
    resign: $('btnResign'),
    newGame: $('btnNew'),
    sound: $('btnSound'),
    menu: $('menu'),
    over: $('over'),
    promo: $('promo'),
    promoRow: $('promoRow'),
    resume: $('btnResume'),
  };

  document.querySelectorAll('[data-t]').forEach((el) => {
    const v = T[el.dataset.t];
    if (typeof v === 'string') el.textContent = v;
  });
  document.title = lang === 'tr' ? 'Monty Satranç' : 'Monty Chess';
  canvas.setAttribute('aria-label', T.board);
  ui.sound.setAttribute('aria-label', T.sound);
  ui.undo.setAttribute('aria-label', T.undo);
  ui.resign.setAttribute('aria-label', T.resign);
  ui.newGame.setAttribute('aria-label', T.newGame);
  const resignLabel = $('resignLabel');
  ui.moves.dataset.empty = T.noMoves;
  document.querySelector('[data-piece="white"]').src = pieceURL[WHITE | KING];
  document.querySelector('[data-piece="black"]').src = pieceURL[BLACK | KING];
  document.querySelector('[data-piece="random"]').src = pieceURL[WHITE | KNIGHT];

  // --- Oyun durumu ---
  const game = {
    pos: new C.Position(),
    records: [], // { m, san, mover, piece, captured }
    legal: [],
    level: 'medium',
    player: WHITE,
    phase: 'menu', // menu | play | over
    result: null,
    selected: -1,
    targets: [],
    lastMove: null,
    cursor: -1,
    thinking: false,
    reqId: 0,
    seed: 0,
    aiTimer: 0,
    promo: null,
  };
  game.legal = game.pos.legalMoves();

  const prefs = store.get('prefs', { level: 'medium', color: 'white' });
  const stats = store.get('stats', {});
  const statOf = (lvl) => stats[lvl] || { w: 0, l: 0, d: 0 };

  // --- Yapay zeka (worker; yoksa ana iş parçacığında) ---
  let worker = null;
  let workerBusy = false;
  let pending = null;
  function createWorker() {
    try {
      worker = new Worker('./ai.js');
      worker.onmessage = (e) => {
        workerBusy = false;
        const job = pending;
        pending = null;
        if (job && job.id === e.data.id) job.done(e.data.move);
      };
      worker.onerror = (e) => {
        e.preventDefault?.();
        worker = null;
        workerBusy = false;
        const job = pending;
        pending = null;
        if (job) runLocal(job);
      };
    } catch {
      worker = null;
    }
  }
  createWorker();

  function runLocal(job) {
    setTimeout(() => {
      if (job.id !== game.reqId) return;
      const p = new C.Position(job.fen);
      for (const m of job.moves) p.make(m);
      job.done(C.think(p, job.level, job.seed).move);
    }, 30);
  }

  function cancelAI() {
    game.reqId++;
    clearTimeout(game.aiTimer);
    game.thinking = false;
    pending = null;
    if (worker && workerBusy) {
      worker.terminate();
      workerBusy = false;
      createWorker();
    }
  }

  function requestAI() {
    game.thinking = true;
    renderPanel();
    const id = ++game.reqId;
    const started = performance.now();
    const job = {
      id,
      fen: C.START_FEN,
      moves: game.records.map((r) => r.m),
      level: game.level,
      seed: game.seed,
      done(move) {
        if (id !== game.reqId || game.phase !== 'play') return;
        const wait = Math.max(0, C.LEVELS[game.level].minMs - (performance.now() - started));
        game.aiTimer = setTimeout(() => {
          if (id !== game.reqId) return;
          game.thinking = false;
          if (!game.legal.includes(move)) move = game.legal[0]; // olmaması gereken durum için güvenlik
          applyMove(move, true);
        }, wait);
      },
    };
    if (worker) {
      pending = job;
      workerBusy = true;
      worker.postMessage({ id, fen: job.fen, moves: job.moves, level: job.level, seed: job.seed });
    } else {
      runLocal(job);
    }
  }

  // --- Hamle uygulama ---
  function pushMove(m) {
    const pos = game.pos;
    const san = pos.san(m, game.legal);
    const from = mFrom(m);
    const to = mTo(m);
    const flags = mFlags(m);
    const piece = pos.board[from];
    const capSq = flags & F_EP ? (piece & 8 ? to + 16 : to - 16) : to;
    const record = { m, san, mover: pos.side, piece, captured: flags & F_CAP ? pos.board[capSq] : 0 };
    pos.make(m);
    game.records.push(record);
    game.lastMove = { from, to };
    game.legal = pos.legalMoves();
    game.selected = -1;
    game.targets = [];
    return record;
  }

  function applyMove(m, animate) {
    const flags = mFlags(m);
    const record = pushMove(m);
    if (animate) startAnim(m, record.piece);
    if (flags & F_CASTLE) Sound.play('castle');
    else if (record.captured) Sound.play('capture');
    else Sound.play('move');
    if (game.pos.inCheck()) Sound.play('check');
    if (record.mover === game.player) {
      if (flags & F_PROMO) Monty.unlock('promotion');
      if (flags & F_EP) Monty.unlock('en-passant');
    }
    saveGame();
    const end = checkEnd();
    renderPanel();
    requestDraw();
    if (end) finish(end);
    else if (game.pos.side !== game.player) requestAI();
  }

  function checkEnd() {
    const pos = game.pos;
    if (!game.legal.length) return pos.inCheck() ? { type: 'mate', winner: pos.side ^ 8 } : { type: 'stalemate' };
    if (pos.half >= 100) return { type: 'fifty' };
    if (pos.repetitions() >= 2) return { type: 'repetition' };
    if (pos.insufficientMaterial()) return { type: 'material' };
    return null;
  }

  function finish(end) {
    cancelAI();
    game.phase = 'over';
    game.result = end;
    game.selected = -1;
    game.targets = [];
    store.del('save');
    const outcome = end.type === 'mate' ? (end.winner === game.player ? 'w' : 'l') : end.type === 'resign' ? 'l' : 'd';
    end.outcome = outcome;
    const s = statOf(game.level);
    s[outcome]++;
    stats[game.level] = s;
    store.set('stats', stats);
    if (outcome === 'w') {
      Monty.unlock(`${game.level}-win`);
      const myMoves = game.records.filter((r) => r.mover === game.player).length;
      if (myMoves <= 20) Monty.unlock('quick-mate');
    }
    renderPanel();
    requestDraw();
    setTimeout(
      () => {
        if (game.phase !== 'over' || game.result !== end) return;
        Sound.play(outcome === 'w' ? 'win' : outcome === 'l' ? 'lose' : 'draw');
        showOver();
      },
      end.type === 'resign' ? 150 : 700,
    );
  }

  function undo() {
    if (game.phase !== 'play' || !game.records.some((r) => r.mover === game.player)) return;
    cancelAI();
    while (game.records.length) {
      const r = game.records.pop();
      game.pos.unmake(r.m);
      if (r.mover === game.player) break;
    }
    const last = game.records[game.records.length - 1];
    game.lastMove = last ? { from: mFrom(last.m), to: mTo(last.m) } : null;
    game.legal = game.pos.legalMoves();
    game.selected = -1;
    game.targets = [];
    anim = null;
    saveGame();
    renderPanel();
    requestDraw();
  }

  function saveGame() {
    if (game.phase !== 'play') return;
    store.set('save', { v: 1, level: game.level, player: game.player, seed: game.seed, moves: game.records.map((r) => r.m) });
  }

  function startGame(level, color, saved) {
    cancelAI();
    closePromo();
    game.level = level;
    game.player = color === 'random' ? (Math.random() < 0.5 ? WHITE : BLACK) : color === 'black' ? BLACK : WHITE;
    game.pos = new C.Position();
    game.records = [];
    game.legal = game.pos.legalMoves();
    game.lastMove = null;
    game.selected = -1;
    game.targets = [];
    game.cursor = -1;
    game.result = null;
    game.seed = (Math.random() * 2 ** 31) | 0;
    anim = null;
    if (saved) {
      game.player = saved.player === BLACK ? BLACK : WHITE;
      game.seed = saved.seed | 0;
      for (const m of saved.moves) {
        if (!game.legal.includes(m)) break;
        pushMove(m);
      }
      const last = game.records[game.records.length - 1];
      game.lastMove = last ? { from: mFrom(last.m), to: mTo(last.m) } : null;
    }
    game.phase = 'play';
    ui.menu.hidden = true;
    ui.over.hidden = true;
    ui.youAvatar.innerHTML = `<img alt="" src="${pieceURL[game.player | PAWN]}">`;
    ui.levelBadge.textContent = upper(T[level]);
    saveGame();
    renderPanel();
    requestDraw();
    Sound.play('start');
    const end = checkEnd();
    if (end) finish(end);
    else if (game.pos.side !== game.player) requestAI();
  }

  const upper = (s) => (lang === 'tr' ? s.toLocaleUpperCase('tr') : s.toUpperCase());
  // Türkçe notasyon: Şah, Vezir, Kale, Fil, At (sütun harfleri küçük olduğu için karışmaz)
  const TR_LETTERS = { K: 'Ş', Q: 'V', R: 'K', B: 'F', N: 'A' };
  const localSan = (san) => (lang === 'tr' ? san.replace(/[KQRBN]/g, (c) => TR_LETTERS[c]) : san);

  // --- Panel ---
  function renderPanel() {
    const over = game.phase === 'over';
    const myTurn = game.phase === 'play' && game.pos.side === game.player && !game.thinking;
    ui.thinking.hidden = !game.thinking;
    let status;
    let check = false;
    if (over) {
      status = game.result.outcome === 'w' ? T.overWin : game.result.outcome === 'l' ? T.overLose : T.overDraw;
    } else if (game.thinking || game.pos.side !== game.player) {
      status = T.thinking;
    } else {
      status = T.yourTurn;
      if (game.pos.inCheck()) {
        status = `${T.check} ${T.yourTurn}`;
        check = true;
      }
    }
    ui.status.textContent = status;
    ui.status.classList.toggle('is-check', check);

    // hamle listesi
    const rows = [];
    const recs = game.records;
    for (let i = 0; i < recs.length; i += 2) {
      const lastIdx = recs.length - 1;
      const w = `<span class="mv${i === lastIdx ? ' is-last' : ''}">${localSan(recs[i].san)}</span>`;
      const b = recs[i + 1]
        ? `<span class="mv${i + 1 === lastIdx ? ' is-last' : ''}">${localSan(recs[i + 1].san)}</span>`
        : '<span></span>';
      rows.push(`<li><span class="num">${i / 2 + 1}.</span>${w}${b}</li>`);
    }
    ui.moves.innerHTML = rows.join('');
    ui.moves.scrollTop = ui.moves.scrollHeight;
    ui.moves.scrollLeft = ui.moves.scrollWidth;

    // alınan taşlar ve malzeme farkı
    const taken = { [WHITE]: [], [BLACK]: [] };
    let diff = 0; // oyuncu açısından
    for (const r of recs) {
      if (r.captured) {
        taken[r.mover].push(r.captured);
        diff += (r.mover === game.player ? 1 : -1) * VALUE[r.captured & 7];
      }
      if (mFlags(r.m) & F_PROMO) diff += (r.mover === game.player ? 1 : -1) * (VALUE[mPromo(r.m)] - 1);
    }
    const capsHtml = (list, lead) =>
      list
        .sort((a, b) => VALUE[b & 7] - VALUE[a & 7])
        .map((p) => `<img alt="" src="${pieceURL[p]}">`)
        .join('') + (lead > 0 ? `<span class="diff">+${lead}</span>` : '');
    ui.capsYou.innerHTML = capsHtml(taken[game.player], diff);
    ui.capsAi.innerHTML = capsHtml(taken[game.player ^ 8], -diff);

    ui.undo.disabled = !(game.phase === 'play' && recs.some((r) => r.mover === game.player));
    ui.resign.hidden = over;
    ui.resign.disabled = game.phase !== 'play';
    if (!resignArmed) resignLabel.textContent = T.resign;
    ui.sound.setAttribute('aria-pressed', String(Sound.userMuted));
    canvas.style.cursor = myTurn ? 'pointer' : 'default';
  }

  let resignArmed = 0;
  ui.resign.addEventListener('click', () => {
    if (game.phase !== 'play') return;
    if (!resignArmed) {
      resignLabel.textContent = T.confirmResign;
      ui.resign.setAttribute('aria-label', T.confirmResign);
      ui.resign.classList.add('btn--warn');
      resignArmed = setTimeout(disarmResign, 3000);
      return;
    }
    disarmResign();
    finish({ type: 'resign' });
  });
  function disarmResign() {
    clearTimeout(resignArmed);
    resignArmed = 0;
    resignLabel.textContent = T.resign;
    ui.resign.setAttribute('aria-label', T.resign);
    ui.resign.classList.remove('btn--warn');
  }
  ui.undo.addEventListener('click', undo);
  ui.newGame.addEventListener('click', openMenu);
  ui.sound.addEventListener('click', () => {
    Sound.setUserMuted(!Sound.userMuted);
    renderPanel();
  });

  // --- Menü ---
  let menuLevel = prefs.level in C.LEVELS ? prefs.level : 'medium';
  let menuColor = ['white', 'black', 'random'].includes(prefs.color) ? prefs.color : 'white';
  function syncMenu() {
    document.querySelectorAll('[data-level]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.level === menuLevel)));
    document.querySelectorAll('[data-color]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.color === menuColor)));
    document.querySelectorAll('[data-record]').forEach((el) => {
      const r = statOf(el.dataset.record);
      el.textContent = r.w + r.l + r.d ? T.record(r) : '';
    });
    const saved = store.get('save', null);
    ui.resume.hidden = !(saved && saved.v === 1 && saved.level in C.LEVELS && Array.isArray(saved.moves) && saved.moves.length);
  }
  function openMenu() {
    disarmResign();
    closePromo();
    // süren bir oyunda menüye dönülürse kayıt durur, "devam et" ile geri gelinir
    ui.over.hidden = true;
    ui.menu.hidden = false;
    syncMenu();
    $('btnStart').focus({ preventScroll: true });
  }
  document.querySelectorAll('[data-level]').forEach((b) =>
    b.addEventListener('click', () => {
      menuLevel = b.dataset.level;
      syncMenu();
    }),
  );
  document.querySelectorAll('[data-color]').forEach((b) =>
    b.addEventListener('click', () => {
      menuColor = b.dataset.color;
      syncMenu();
    }),
  );
  $('btnStart').addEventListener('click', () => {
    store.set('prefs', { level: menuLevel, color: menuColor });
    startGame(menuLevel, menuColor);
  });
  ui.resume.addEventListener('click', () => {
    const saved = store.get('save', null);
    if (saved) startGame(saved.level, null, saved);
  });

  // --- Oyun sonu ---
  function showOver() {
    const r = game.result;
    const titleEl = $('overTitle');
    titleEl.textContent = r.outcome === 'w' ? T.win : r.outcome === 'l' ? T.lose : T.draw;
    titleEl.classList.toggle('is-win', r.outcome === 'w');
    $('overKicker').textContent = T.kicker(T[game.level]);
    const reasons = {
      mate: r.outcome === 'w' ? T.mateWin : T.mateLose,
      resign: T.resigned,
      stalemate: T.stalemate,
      fifty: T.fifty,
      repetition: T.repetition,
      material: T.material,
    };
    $('overReason').textContent = reasons[r.type];
    $('overRecord').textContent = T.recordLine(T[game.level], statOf(game.level));
    ui.over.hidden = false;
    $('btnAgain').focus({ preventScroll: true });
  }
  $('btnAgain').addEventListener('click', () => {
    const color = game.player === WHITE ? 'white' : 'black';
    startGame(game.level, prefs.color === 'random' ? 'random' : color);
  });
  $('btnMenu').addEventListener('click', openMenu);
  $('btnReview').addEventListener('click', () => {
    ui.over.hidden = true;
    ui.newGame.focus({ preventScroll: true });
  });

  // --- Terfi ---
  function openPromo(options) {
    game.promo = options;
    ui.promoRow.innerHTML = '';
    for (const type of [QUEEN, ROOK, BISHOP, KNIGHT]) {
      const m = options.find((o) => mPromo(o) === type);
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `<img alt="" src="${pieceURL[game.player | type]}">`;
      b.setAttribute('aria-label', 'QRBN'[[QUEEN, ROOK, BISHOP, KNIGHT].indexOf(type)]);
      b.addEventListener('click', () => {
        closePromo();
        applyMove(m, false);
      });
      ui.promoRow.append(b);
    }
    ui.promo.hidden = false;
    ui.promoRow.firstChild.focus({ preventScroll: true });
  }
  function closePromo() {
    game.promo = null;
    ui.promo.hidden = true;
  }

  // --- Tahta geometrisi ve çizim ---
  let boardPx = 0;
  let sqPx = 0;
  let dpr = 1;
  let sprites = {};
  const flipped = () => game.player === BLACK;

  function squareXY(sq) {
    const f = sq & 7;
    const r = sq >> 4;
    const col = flipped() ? 7 - f : f;
    const row = flipped() ? r : 7 - r;
    return [col * sqPx, row * sqPx];
  }
  function squareAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor(((clientX - rect.left) / rect.width) * 8);
    const row = Math.floor(((clientY - rect.top) / rect.height) * 8);
    if (col < 0 || col > 7 || row < 0 || row > 7) return -1;
    const f = flipped() ? 7 - col : col;
    const r = flipped() ? row : 7 - row;
    return r * 16 + f;
  }

  function buildSprites() {
    sprites = {};
    const px = Math.round(sqPx * dpr);
    for (const color of [WHITE, BLACK]) {
      for (let type = PAWN; type <= KING; type++) {
        const cv = document.createElement('canvas');
        cv.width = cv.height = px;
        drawPiece(cv.getContext('2d'), type, color, px);
        sprites[color | type] = cv;
      }
    }
  }

  let anim = null;
  function startAnim(m, piece) {
    const from = mFrom(m);
    const to = mTo(m);
    const items = [{ piece: game.pos.board[to] || piece, from, to }];
    if (mFlags(m) & F_CASTLE) {
      const rookFrom = to > from ? to + 1 : to - 2;
      const rookTo = to > from ? to - 1 : to + 1;
      items.push({ piece: game.pos.board[rookTo], from: rookFrom, to: rookTo });
    }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    anim = { items, start: performance.now(), dur: reduce ? 0 : 170 };
  }

  let drawQueued = false;
  function requestDraw() {
    if (drawQueued) return;
    drawQueued = true;
    requestAnimationFrame((now) => {
      drawQueued = false;
      draw(now);
      if (anim) {
        if (now - anim.start >= anim.dur) {
          anim = null;
          requestDraw();
        } else requestDraw();
      }
    });
  }

  const LIGHT = '#ecdfc4';
  const DARK = '#b9835c';

  function draw(now) {
    if (!sqPx) return;
    const pos = game.pos;
    const s = sqPx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, boardPx, boardPx);

    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq = r * 16 + f;
        const [x, y] = squareXY(sq);
        const light = (r + f) % 2 === 1;
        ctx.fillStyle = light ? LIGHT : DARK;
        ctx.fillRect(x, y, s, s);
      }
    }

    const fill = (sq, color) => {
      const [x, y] = squareXY(sq);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, s, s);
    };
    if (game.lastMove) {
      fill(game.lastMove.from, 'rgba(255,194,61,.38)');
      fill(game.lastMove.to, 'rgba(255,194,61,.5)');
    }
    if (game.selected >= 0) fill(game.selected, 'rgba(255,107,44,.55)');

    // şah çekilen şah
    if (pos.inCheck()) {
      const [x, y] = squareXY(pos.kings[pos.side >> 3]);
      const g = ctx.createRadialGradient(x + s / 2, y + s / 2, s * 0.05, x + s / 2, y + s / 2, s * 0.62);
      g.addColorStop(0, 'rgba(255,60,30,.95)');
      g.addColorStop(0.55, 'rgba(255,90,40,.55)');
      g.addColorStop(1, 'rgba(255,90,40,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, s, s);
    }

    // koordinatlar
    ctx.font = `700 ${Math.max(8, Math.round(s * 0.15))}px "Space Mono", monospace`;
    for (let i = 0; i < 8; i++) {
      const fileSq = (flipped() ? 7 : 0) * 16 + i; // alt sıradaki kareler
      const [fx, fy] = squareXY(fileSq);
      const fileLight = ((fileSq >> 4) + (fileSq & 7)) % 2 === 1;
      ctx.fillStyle = fileLight ? DARK : LIGHT;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('abcdefgh'[i], fx + s - s * 0.06, fy + s - s * 0.02);
      const rankSq = i * 16 + (flipped() ? 7 : 0); // sol sütundaki kareler
      const [rx, ry] = squareXY(rankSq);
      const rankLight = ((rankSq >> 4) + (rankSq & 7)) % 2 === 1;
      ctx.fillStyle = rankLight ? DARK : LIGHT;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(String(i + 1), rx + s * 0.06, ry + s * 0.04);
    }

    // taşlar
    const hidden = new Set();
    if (anim) for (const it of anim.items) hidden.add(it.to);
    if (drag && drag.moved) hidden.add(drag.sq);
    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) {
        sq += 7;
        continue;
      }
      const p = pos.board[sq];
      if (!p || hidden.has(sq)) continue;
      const [x, y] = squareXY(sq);
      ctx.drawImage(sprites[p], x, y, s, s);
    }

    // olası hamleler
    for (const m of game.targets) {
      const to = mTo(m);
      const [x, y] = squareXY(to);
      ctx.beginPath();
      if (mFlags(m) & F_CAP) {
        ctx.lineWidth = s * 0.075;
        ctx.strokeStyle = 'rgba(13,19,40,.42)';
        ctx.arc(x + s / 2, y + s / 2, s * 0.45, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(13,19,40,.3)';
        ctx.arc(x + s / 2, y + s / 2, s * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // sürükleme hedefi
    if (drag && drag.moved) {
      const over = squareAt(drag.x, drag.y);
      if (over >= 0 && game.targets.some((m) => mTo(m) === over)) {
        const [x, y] = squareXY(over);
        ctx.lineWidth = Math.max(2, s * 0.05);
        ctx.strokeStyle = 'rgba(243,234,216,.85)';
        ctx.strokeRect(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, s - ctx.lineWidth, s - ctx.lineWidth);
      }
    }

    // klavye imleci
    if (game.cursor >= 0 && keyboardMode) {
      const [x, y] = squareXY(game.cursor);
      ctx.lineWidth = Math.max(2, s * 0.06);
      ctx.strokeStyle = '#ff6b2c';
      ctx.strokeRect(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, s - ctx.lineWidth, s - ctx.lineWidth);
    }

    // hareket eden taşlar
    if (anim) {
      const t = anim.dur ? Math.min(1, (now - anim.start) / anim.dur) : 1;
      const e = 1 - Math.pow(1 - t, 3);
      for (const it of anim.items) {
        const [x0, y0] = squareXY(it.from);
        const [x1, y1] = squareXY(it.to);
        if (it.piece) ctx.drawImage(sprites[it.piece], x0 + (x1 - x0) * e, y0 + (y1 - y0) * e, s, s);
      }
    }

    // sürüklenen taş
    if (drag && drag.moved) {
      const rect = canvas.getBoundingClientRect();
      const x = ((drag.x - rect.left) / rect.width) * boardPx;
      const y = ((drag.y - rect.top) / rect.height) * boardPx;
      const size = s * 1.15;
      ctx.drawImage(sprites[pos.board[drag.sq]], x - size / 2, y - size * 0.62, size, size);
    }
  }

  // --- Giriş ---
  let drag = null;
  let keyboardMode = false;
  const canAct = () => game.phase === 'play' && game.pos.side === game.player && !game.thinking && !game.promo;

  function select(sq) {
    game.selected = sq;
    game.targets = game.legal.filter((m) => mFrom(m) === sq);
  }
  function deselect() {
    game.selected = -1;
    game.targets = [];
  }
  function ownPiece(sq) {
    const p = game.pos.board[sq];
    return p && (p & 8) === game.player;
  }
  /** Seçili taşı hedefe oynamayı dener. */
  function tryMove(from, to, animate) {
    const options = game.legal.filter((m) => mFrom(m) === from && mTo(m) === to);
    if (!options.length) return false;
    if (options.length > 1) {
      deselect();
      openPromo(options);
      requestDraw();
      return true;
    }
    applyMove(options[0], animate);
    return true;
  }
  /** Bir kareye "tıklama" (fare, dokunma ya da klavye). */
  function activate(sq) {
    if (game.selected >= 0 && game.targets.some((m) => mTo(m) === sq)) {
      tryMove(game.selected, sq, true);
    } else if (ownPiece(sq)) {
      if (game.selected === sq) deselect();
      else select(sq);
    } else {
      if (game.selected >= 0) Sound.play('error');
      deselect();
    }
    requestDraw();
  }

  canvas.addEventListener('pointerdown', (e) => {
    Sound.unlock();
    keyboardMode = false;
    if (!canAct() || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const sq = squareAt(e.clientX, e.clientY);
    if (sq < 0) return;
    if (game.selected >= 0 && game.targets.some((m) => mTo(m) === sq)) {
      tryMove(game.selected, sq, true);
      requestDraw();
      return;
    }
    if (ownPiece(sq)) {
      const wasSelected = game.selected === sq;
      select(sq);
      drag = { sq, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, moved: false, wasSelected, id: e.pointerId };
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
    } else {
      deselect();
    }
    requestDraw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.x = e.clientX;
    drag.y = e.clientY;
    if (!drag.moved && Math.hypot(drag.x - drag.x0, drag.y - drag.y0) > Math.max(4, sqPx * 0.12)) drag.moved = true;
    if (drag.moved) requestDraw();
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (d.moved) {
      const to = squareAt(e.clientX, e.clientY);
      if (to >= 0 && to !== d.sq && canAct() && tryMove(d.sq, to, false)) return requestDraw();
    } else if (d.wasSelected) {
      deselect();
    }
    requestDraw();
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', (e) => {
    if (drag && e.pointerId === drag.id) drag = null;
    requestDraw();
  });

  window.addEventListener('keydown', (e) => {
    Sound.unlock();
    const k = e.key;
    if (k === ' ' || k.startsWith('Arrow')) e.preventDefault();

    if (game.promo) {
      const map = { q: QUEEN, r: ROOK, b: BISHOP, n: KNIGHT, 1: QUEEN, 2: ROOK, 3: BISHOP, 4: KNIGHT };
      const type = map[k.toLowerCase()];
      if (type) {
        const m = game.promo.find((o) => mPromo(o) === type);
        closePromo();
        applyMove(m, false);
      } else if (k === 'Escape') {
        closePromo();
        requestDraw();
      }
      return;
    }
    if (!ui.menu.hidden || !ui.over.hidden) {
      if (k === 'Escape' && !ui.over.hidden) $('btnReview').click();
      return; // menüde butonlar Tab/Enter ile çalışır
    }
    if (k === 'm' || k === 'M') {
      ui.sound.click();
      return;
    }
    if (k === 'u' || k === 'U' || (k === 'z' && (e.ctrlKey || e.metaKey))) {
      undo();
      return;
    }
    if (game.phase !== 'play') return;

    if (k.startsWith('Arrow')) {
      keyboardMode = true;
      if (game.cursor < 0) game.cursor = game.selected >= 0 ? game.selected : game.player === WHITE ? 0x14 : 0x64;
      let f = game.cursor & 7;
      let r = game.cursor >> 4;
      const s = flipped() ? -1 : 1;
      if (k === 'ArrowUp') r += s;
      if (k === 'ArrowDown') r -= s;
      if (k === 'ArrowRight') f += s;
      if (k === 'ArrowLeft') f -= s;
      game.cursor = Math.min(7, Math.max(0, r)) * 16 + Math.min(7, Math.max(0, f));
      requestDraw();
    } else if ((k === 'Enter' || k === ' ') && game.cursor >= 0) {
      keyboardMode = true;
      if (canAct()) activate(game.cursor);
    } else if (k === 'Escape') {
      deselect();
      requestDraw();
    }
  });
  window.addEventListener('pointerdown', () => Sound.unlock(), { capture: true });

  // --- Yerleşim ---
  function layout() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const landscape = W >= H * 1.12;
    const compact = H < 470 || W < 340;
    const tiny = landscape ? H < 230 : W < 300 || H < 420;
    app.classList.toggle('is-landscape', landscape);
    app.classList.toggle('is-portrait', !landscape);
    app.classList.toggle('is-compact', compact);
    app.classList.toggle('is-tiny', tiny);
    const pad = Math.max(6, Math.round(Math.min(W, H) * 0.035));
    let size;
    let panelW = 0;
    let panelH = 0;
    if (landscape) {
      panelW = Math.round(Math.min(360, Math.max(compact ? 150 : 230, W * 0.3)));
      size = Math.min(H - pad * 2, W - panelW - pad * 3);
      panelW = Math.min(360, Math.max(panelW, W - size - pad * 3 - 40));
    } else {
      panelH = Math.round(Math.min(230, Math.max(compact ? 120 : 160, H * 0.26)));
      size = Math.min(W - pad * 2, H - panelH - pad * 3);
      panelH = H - size - pad * 3;
    }
    size = Math.max(120, Math.floor(size / 8) * 8);
    const root = document.documentElement.style;
    root.setProperty('--board', `${size}px`);
    root.setProperty('--pad', `${pad}px`);
    root.setProperty('--panel-w', `${panelW}px`);
    root.setProperty('--panel-h', `${panelH}px`);
    // dar panelde aksiyon butonları sadece ikon
    app.classList.toggle('is-narrow', landscape ? panelW < 280 : size < 330);

    const newDpr = Math.min(window.devicePixelRatio || 1, 3);
    if (size !== boardPx || newDpr !== dpr) {
      boardPx = size;
      sqPx = size / 8;
      dpr = newDpr;
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      buildSprites();
    }
    requestDraw();
  }
  window.addEventListener('resize', layout);
  // bazı gömülü/gizli açılışlarda resize gelmeyebilir; boyut değişimini doğrudan da izle
  if (window.ResizeObserver) new ResizeObserver(() => layout()).observe(document.documentElement);
  document.addEventListener('fullscreenchange', layout);

  // --- Başlangıç ---
  layout();
  renderPanel();
  ui.levelBadge.textContent = upper(T[menuLevel]);
  ui.youAvatar.innerHTML = `<img alt="" src="${pieceURL[WHITE | PAWN]}">`;
  openMenu();
  const fontsReady = document.fonts
    ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))])
    : Promise.resolve();
  fontsReady.then(() => {
    requestDraw();
    Monty.ready();
  });
})();
