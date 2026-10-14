/*
 * Monty oyun kiti — dil, yerel kayıt, site iletişimi (GAMES.md §3) ve WebAudio sesleri.
 * Her oyunun klasörüne aynen kopyalanır (oyunlar dışarıya bağımlı olmasın diye).
 * Kullanım: const kit = MontyKit.create('slug');
 */
(function () {
  'use strict';

  const lang = new URLSearchParams(location.search).get('lang') === 'tr' ? 'tr' : 'en';
  document.documentElement.lang = lang;

  function createStore(slug) {
    const key = (k) => `monty:${slug}:${k}`;
    return {
      get(k, fallback) {
        try {
          const raw = localStorage.getItem(key(k));
          return raw ? JSON.parse(raw) : fallback;
        } catch {
          return fallback;
        }
      },
      set(k, value) {
        try {
          localStorage.setItem(key(k), JSON.stringify(value));
        } catch {}
      },
    };
  }

  function createSound(store) {
    let ac = null;
    let noiseBuf = null;
    let userMuted = store.get('muted', false);
    let siteMuted = false;

    function unlock() {
      if (!ac) {
        const AC = window.AudioContext || /** @type {any} */ (window).webkitAudioContext; // eski Safari
        if (!AC) return;
        ac = new AC();
        noiseBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.5), ac.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ac.state === 'suspended') ac.resume();
    }
    const ok = () => ac && ac.state === 'running' && !userMuted && !siteMuted;

    return {
      unlock,
      get muted() {
        return userMuted || siteMuted;
      },
      get userMuted() {
        return userMuted;
      },
      setUserMuted(v) {
        userMuted = !!v;
        store.set('muted', userMuted);
      },
      setSiteMuted(v) {
        siteMuted = !!v;
      },
      /** Kısa ton. delay saniye cinsinden. */
      tone(freq, delay, dur, type = 'square', vol = 0.05, freqEnd = 0) {
        if (!ok()) return;
        const t = ac.currentTime + 0.005 + delay;
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
      },
      /** Filtrelenmiş gürültü patlaması (vuruş, kaza, hava sesi). */
      noise(delay, dur, freq = 1000, q = 1, vol = 0.4, type = 'bandpass') {
        if (!ok()) return;
        const t = ac.currentTime + 0.005 + delay;
        const s = ac.createBufferSource();
        s.buffer = noiseBuf;
        const f = ac.createBiquadFilter();
        f.type = type;
        f.frequency.value = freq;
        f.Q.value = q;
        const g = ac.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        s.connect(f).connect(g).connect(ac.destination);
        s.start(t);
        s.stop(t + dur + 0.02);
      },
    };
  }

  function create(slug) {
    const store = createStore(slug);
    const sound = createSound(store);
    const inFrame = window.parent !== window;
    const unlocked = new Set();
    const listeners = {};
    const emit = (name, arg) => (listeners[name] || []).forEach((fn) => fn(arg));

    const post = (msg) => {
      if (!inFrame) return;
      try {
        window.parent.postMessage({ source: 'monty-sdk', v: 1, ...msg }, location.origin);
      } catch {}
    };

    window.addEventListener('message', (e) => {
      if (e.origin !== location.origin) return;
      const d = e.data;
      if (d && d.source === 'monty-site' && d.type === 'mute') {
        sound.setSiteMuted(d.muted);
        emit('mute', !!d.muted);
      }
    });
    document.addEventListener('visibilitychange', () => emit(document.hidden ? 'pause' : 'resume'));
    // Tarayıcılar sesi ilk etkileşimden önce açtırmaz.
    window.addEventListener('pointerdown', sound.unlock, { capture: true });
    window.addEventListener('keydown', sound.unlock, { capture: true });

    return {
      lang,
      slug,
      store,
      sound,
      inFrame,
      ready() {
        post({ type: 'ready' });
      },
      unlock(id) {
        if (unlocked.has(id)) return;
        unlocked.add(id);
        post({ type: 'unlock', gameId: slug, achievementId: id });
      },
      on(name, fn) {
        (listeners[name] = listeners[name] || []).push(fn);
      },
      upper(s) {
        return lang === 'tr' ? s.toLocaleUpperCase('tr') : s.toUpperCase();
      },
      /** Fontlar yüklenince (en fazla 1,5 sn bekler) çözülür. */
      fontsReady() {
        return document.fonts
          ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))])
          : Promise.resolve();
      },
    };
  }

  window.MontyKit = { create, lang };
})();
