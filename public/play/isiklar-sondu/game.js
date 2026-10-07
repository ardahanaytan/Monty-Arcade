/* Işıklar Söndü — start ışıkları tepki oyunu. Süre, ışıkların söndüğü kare ile basış anı arasında ölçülür. */
(() => {
  'use strict';

  const kit = MontyKit.create('isiklar-sondu');
  const { sound, store } = kit;
  const touchUI = window.matchMedia?.('(pointer: coarse)').matches;

  const STR = {
    tr: {
      single: 'TEK START',
      gp: 'GRAND PRIX',
      start: touchUI ? 'BAŞLAMAK İÇİN DOKUN' : 'BAŞLAMAK İÇİN BOŞLUK',
      again: touchUI ? 'TEKRAR İÇİN DOKUN' : 'TEKRAR: BOŞLUK',
      next: touchUI ? 'SONRAKİ START İÇİN DOKUN' : 'SONRAKİ START: BOŞLUK',
      wait: 'IŞIKLAR SÖNÜNCE BAS',
      early: 'ERKEN ÇIKIŞ!',
      guess: 'TAHMİN!',
      earlySub: 'Işıklar sönmeden bastın.',
      guessSub: (ms) => `${ms} ms: insan tepkisi için fazla hızlı.`,
      penalty: '+1.000 SN CEZA',
      ranks: ['POLE POSITION!', 'PODYUM!', 'PUANLARDA', 'ORTA GRUP', 'PİTTE UYUDUN'],
      best: 'EN İYİ',
      gpBest: 'GP REKORU',
      newBest: 'YENİ REKOR!',
      startN: (n) => `GRAND PRIX · START ${n}/5`,
      gpDone: 'GRAND PRIX BİTTİ',
      gpSub: (best, f) => `EN İYİ ${best} · ERKEN ÇIKIŞ ${f}`,
      paused: 'DURAKLATILDI',
      sound: 'Ses',
    },
    en: {
      single: 'SINGLE START',
      gp: 'GRAND PRIX',
      start: touchUI ? 'TAP TO START' : 'PRESS SPACE TO START',
      again: touchUI ? 'TAP TO GO AGAIN' : 'AGAIN: SPACE',
      next: touchUI ? 'TAP FOR THE NEXT START' : 'NEXT START: SPACE',
      wait: 'GO WHEN THE LIGHTS GO OUT',
      early: 'JUMP START!',
      guess: 'GUESSED!',
      earlySub: 'You went before the lights went out.',
      guessSub: (ms) => `${ms} ms: too fast for a human reaction.`,
      penalty: '+1.000 S PENALTY',
      ranks: ['POLE POSITION!', 'PODIUM!', 'IN THE POINTS', 'MIDFIELD', 'ASLEEP IN THE PITS'],
      best: 'BEST',
      gpBest: 'GP RECORD',
      newBest: 'NEW BEST!',
      startN: (n) => `GRAND PRIX · START ${n}/5`,
      gpDone: 'GRAND PRIX FINISHED',
      gpSub: (best, f) => `BEST ${best} · JUMP STARTS ${f}`,
      paused: 'PAUSED',
      sound: 'Sound',
    },
  };
  const T = STR[kit.lang];

  const $ = (id) => document.getElementById(id);
  const app = $('app');
  const gantry = $('gantry');
  const pods = [...document.querySelectorAll('.pod')];
  const timeEl = $('time');
  const msgEl = $('msg');
  const subEl = $('sub');
  const progEl = $('progress');
  const modeBtns = [...document.querySelectorAll('[data-mode]')];
  const soundBtn = $('btnSound');

  const data = store.get('data', { best: 0, gpBest: 0, history: [] });
  const PENALTY = 1000;
  const fmt = (ms) => (ms / 1000).toFixed(3);

  let mode = 'single';
  let state = 'idle'; // idle | lights | armed | go | result | summary
  let timers = [];
  let goAt = 0;
  let readyAt = 0;
  let gp = null; // { results: [ms], falses: n }

  // --- Görünüm yardımcıları ---
  function setLights(n) {
    pods.forEach((p, i) => p.classList.toggle('on', i < n));
    app.style.setProperty('--glow', (n * 0.035).toFixed(3));
  }
  function show(time, timeClass, msg, msgClass, sub, blink) {
    timeEl.textContent = time;
    timeEl.className = `time ${timeClass}`;
    msgEl.textContent = msg;
    msgEl.className = `msg ${msgClass}`;
    subEl.textContent = sub;
    subEl.classList.toggle('blink', !!blink);
  }
  function renderProgress() {
    progEl.textContent = mode === 'gp' && gp && !gp.done ? T.startN(Math.min(5, gp.results.length + 1)) : mode === 'gp' ? T.gp : T.single;
  }
  function renderStats() {
    $('lblBest').textContent = T.best;
    $('best').textContent = data.best ? fmt(data.best) : '—';
    $('lblAvg').textContent = T.gpBest;
    $('avg').textContent = data.gpBest ? fmt(data.gpBest) : '—';
    const hist = data.history.slice(-24);
    const max = 600;
    $('history').innerHTML = hist
      .map((h, i) => {
        const cls = h === 0 ? 'bad' : i === hist.length - 1 ? 'last' : '';
        const pct = h === 0 ? 100 : Math.max(8, Math.min(100, (h / max) * 100));
        return `<i class="${cls}" style="height:${pct}%"></i>`;
      })
      .join('');
  }
  function renderModes() {
    const busy = state === 'lights' || state === 'armed' || state === 'go';
    modeBtns.forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
      b.disabled = busy;
    });
    soundBtn.setAttribute('aria-pressed', String(sound.userMuted));
  }
  function save() {
    data.history = data.history.slice(-40);
    store.set('data', data);
  }

  // --- Akış ---
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function startSequence() {
    clearTimers();
    if (mode === 'gp' && (!gp || gp.done)) gp = { results: [], falses: 0, done: false };
    state = 'lights';
    setLights(0);
    renderProgress();
    renderModes();
    show('0.000', 'dim', '', '', T.wait, false);
    // F1 usulü: ışıklar saniyede bir yanar, beşi de yanınca 0,2–3 sn arası rastgele bekleme
    for (let i = 1; i <= 5; i++) {
      timers.push(
        setTimeout(() => {
          setLights(i);
          sound.tone(330, 0, 0.1, 'square', 0.03);
          if (i === 5) state = 'armed';
        }, 600 + (i - 1) * 1000),
      );
    }
    const hold = 200 + Math.random() * 2800;
    timers.push(
      setTimeout(() => {
        requestAnimationFrame((ts) => {
          if (state !== 'armed') return;
          setLights(0);
          goAt = ts; // ışıkların söndüğü karenin zamanı
          state = 'go';
        });
      }, 600 + 4000 + hold),
    );
  }

  function falseStart(kind, ms) {
    clearTimers();
    state = 'result';
    setLights(0);
    gantry.classList.remove('fault');
    void gantry.offsetWidth; // animasyonu yeniden başlat
    gantry.classList.add('fault');
    sound.tone(110, 0, 0.35, 'sawtooth', 0.07);
    sound.noise(0, 0.25, 300, 0.8, 0.3);
    kit.unlock('jump-start');
    data.history.push(0);
    let sub = kind === 'guess' ? T.guessSub(Math.round(ms)) : T.earlySub;
    if (gp && mode === 'gp') {
      gp.falses++;
      gp.results.push(PENALTY);
      sub += ` ${T.penalty}`;
    }
    show('-.---', 'bad', kind === 'guess' ? T.guess : T.early, 'bad', sub, false);
    save();
    afterStart();
  }

  function result(ms) {
    clearTimers();
    state = 'result';
    const rounded = Math.round(ms);
    const rankIdx = rounded < 180 ? 0 : rounded < 220 ? 1 : rounded < 260 ? 2 : rounded < 330 ? 3 : 4;
    let msg = T.ranks[rankIdx];
    let msgClass = rankIdx <= 1 ? 'good' : rankIdx === 4 ? 'bad' : '';
    const isBest = !data.best || rounded < data.best;
    if (isBest) {
      if (data.best) {
        msg = T.newBest;
        msgClass = 'good';
        [523, 659, 784, 1047].forEach((f, i) => sound.tone(f, 0.05 + i * 0.09, 0.12, 'square', 0.04));
      }
      data.best = rounded;
    }
    sound.tone(1200, 0, 0.04, 'square', 0.04);
    data.history.push(rounded);
    kit.unlock('first-start');
    if (rounded < 250) kit.unlock('under-250');
    if (rounded < 200) kit.unlock('under-200');
    if (gp && mode === 'gp') gp.results.push(rounded);
    show(fmt(rounded), '', msg, msgClass, '', false);
    save();
    afterStart();
  }

  function afterStart() {
    readyAt = performance.now() + 700;
    if (mode === 'gp' && gp && gp.results.length >= 5) return timers.push(setTimeout(finishGP, 900));
    timers.push(
      setTimeout(() => {
        subEl.textContent = mode === 'gp' ? T.next : T.again;
        subEl.classList.add('blink');
        renderProgress();
      }, 700),
    );
    renderModes();
    renderStats();
  }

  function finishGP() {
    state = 'summary';
    gp.done = true;
    const avg = gp.results.reduce((a, b) => a + b, 0) / gp.results.length;
    const best = Math.min(...gp.results);
    kit.unlock('gp-finish');
    if (avg < 230 && gp.falses === 0) kit.unlock('gp-under-230');
    let msg = T.gpDone;
    let msgClass = '';
    if (!data.gpBest || avg < data.gpBest) {
      if (data.gpBest) {
        msg = T.newBest;
        msgClass = 'good';
        [523, 659, 784, 1047].forEach((f, i) => sound.tone(f, i * 0.09, 0.12, 'square', 0.04));
      }
      data.gpBest = Math.round(avg);
    }
    save();
    progEl.textContent = T.gp;
    show(fmt(avg), '', msg, msgClass, T.gpSub(fmt(best), gp.falses), false);
    readyAt = performance.now() + 900;
    timers.push(
      setTimeout(() => {
        subEl.textContent = `${T.gpSub(fmt(best), gp.falses)} · ${T.again}`;
      }, 900),
    );
    renderModes();
    renderStats();
  }

  function toIdle(sub) {
    clearTimers();
    state = 'idle';
    setLights(0);
    renderProgress();
    renderModes();
    show('0.000', 'dim', '', '', sub || T.start, true);
  }

  // --- Giriş ---
  function press(e) {
    const now = performance.now();
    // olayın kendi zaman damgası daha kesin; tutarsızsa şimdiki zamanı kullan
    const at = e && e.timeStamp > 0 && e.timeStamp <= now + 5 && e.timeStamp > now - 1000 ? e.timeStamp : now;
    switch (state) {
      case 'idle':
      case 'result':
      case 'summary':
        if (now < readyAt) return;
        startSequence();
        break;
      case 'lights':
      case 'armed':
        falseStart('early');
        break;
      case 'go': {
        const ms = at - goAt;
        if (ms < 100) falseStart('guess', ms);
        else result(ms);
        break;
      }
    }
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Escape'].includes(e.key)) return;
    if (e.code === 'KeyM') {
      sound.setUserMuted(!sound.userMuted);
      renderModes();
      return;
    }
    if (e.target.closest?.('button') && (e.code === 'Enter' || e.code === 'Space')) return; // buton kendi işini yapsın
    press(e);
  });
  app.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    press(e);
  });
  modeBtns.forEach((b) =>
    b.addEventListener('click', () => {
      if (b.disabled) return;
      mode = b.dataset.mode;
      gp = null;
      b.blur();
      toIdle();
    }),
  );
  soundBtn.setAttribute('aria-label', T.sound);
  soundBtn.addEventListener('click', () => {
    sound.setUserMuted(!sound.userMuted);
    soundBtn.blur();
    renderModes();
  });
  kit.on('pause', () => {
    if (state === 'lights' || state === 'armed' || state === 'go') toIdle();
  });

  // --- Başlangıç ---
  modeBtns[0].textContent = T.single;
  modeBtns[1].textContent = T.gp;
  document.title = kit.lang === 'tr' ? 'Işıklar Söndü' : 'Lights Out';
  toIdle();
  renderStats();
  kit.fontsReady().then(() => kit.ready());
})();
