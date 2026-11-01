/* PC МАСТЕР — звуки. Всё синтезируется кодом (WebAudio), отдельных аудиофайлов нет.
   Наружу отдаётся: sfx(имя), beep(частота, длительность), ringStart(), ringStop(), humLevel(громкость). */
(function () {
  let AC = null, MASTER = null, NB = null, HUMG = null, RT = null;

  function ac() {
    if (!AC) {
      try {
        AC = new (window.AudioContext || window.webkitAudioContext)();
        MASTER = AC.createGain();
        MASTER.gain.value = 0.9;
        MASTER.connect(AC.destination);
      } catch (e) { return null; }
    }
    if (AC.state == 'suspended') AC.resume();
    return AC;
  }

  function nbuf(a) {
    if (!NB) {
      const l = a.sampleRate * 2;
      NB = a.createBuffer(1, l, a.sampleRate);
      const d = NB.getChannelData(0);
      for (let i = 0; i < l; i++) d[i] = Math.random() * 2 - 1;
    }
    return NB;
  }

  // шум через фильтр с огибающей громкости
  function nz(a, t, dur, type, f0, f1, q, v0, v1) {
    const s = a.createBufferSource();
    s.buffer = nbuf(a); s.loop = true;
    const fl = a.createBiquadFilter();
    fl.type = type; fl.Q.value = q || 1;
    fl.frequency.setValueAtTime(f0, t);
    if (f1 && f1 != f0) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v0, t + Math.min(0.02, dur / 3));
    g.gain.exponentialRampToValueAtTime(Math.max(v1, 0.0001), t + dur);
    s.connect(fl); fl.connect(g); g.connect(MASTER);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  // тон с затуханием
  function tn(a, t, dur, type, f0, f1, v) {
    const o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 != f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(MASTER);
    o.start(t); o.stop(t + dur + 0.02);
  }

  const SFX = {
    take(a, t) { nz(a, t, .16, 'bandpass', 900, 2200, 1.2, .18, .001); tn(a, t, .1, 'sine', 200, 110, .18); },
    put(a, t) { tn(a, t, .14, 'sine', 170, 60, .35); nz(a, t, .07, 'lowpass', 1200, 400, .7, .2, .001); },
    place(a, t) { tn(a, t, .05, 'square', 1300, 900, .05); nz(a, t, .05, 'highpass', 3000, 3000, 1, .12, .001); tn(a, t + .07, .12, 'sine', 150, 70, .3); tn(a, t + .07, .05, 'square', 800, 500, .05); },
    paste(a, t) { for (let i = 0; i < 5; i++) nz(a, t + i * .16, .22, 'bandpass', 450 + i * 90, 1500 - i * 180, 3.5, .2, .001); nz(a, t, .9, 'lowpass', 700, 300, .8, .05, .001); tn(a, t + .85, .12, 'sine', 320, 120, .15); },
    screw(a, t) { for (let i = 0; i < 5; i++) { nz(a, t + i * .075, .03, 'highpass', 3500, 3500, 1, .1, .001); tn(a, t + i * .075, .05, 'square', 600 + i * 40, 500, .03); } tn(a, t, .4, 'sawtooth', 260, 520, .025); tn(a, t + .4, .05, 'square', 1800, 1200, .05); },
    cable(a, t) { nz(a, t, .5, 'highpass', 2500, 6000, .7, .15, .01); tn(a, t + .5, .08, 'square', 700, 400, .08); nz(a, t + .5, .05, 'bandpass', 2000, 2000, 2, .2, .001); },
    panel(a, t) { nz(a, t, .5, 'bandpass', 3000, 900, 1.5, .12, .01); tn(a, t + .55, .18, 'sine', 120, 55, .4); nz(a, t + .55, .1, 'lowpass', 2000, 500, 1, .3, .001); },
    buy(a, t) { tn(a, t, .12, 'sine', 1300, 1300, .12); tn(a, t + .09, .25, 'sine', 1750, 1750, .12); },
    sell(a, t) { nz(a, t, .05, 'highpass', 4000, 4000, 1, .2, .001); tn(a, t + .03, .9, 'sine', 2100, 2100, .1); tn(a, t + .03, .9, 'sine', 3150, 3150, .04); tn(a, t + .18, .5, 'sine', 2500, 2500, .06); },
    power(a, t) { tn(a, t, .25, 'sine', 440, 880, .1); tn(a, t + .28, .35, 'sine', 660, 1320, .1); nz(a, t, 1.2, 'bandpass', 400, 2000, .8, .08, .001); },
    door(a, t) { nz(a, t, .7, 'bandpass', 500, 1500, 1, .08, .001); tn(a, t, .4, 'sine', 220, 160, .04); },
    step(a, t) { nz(a, t, .08, 'lowpass', 500 + Math.random() * 200, 200, .8, .12, .001); },
    error(a, t) { tn(a, t, .18, 'sawtooth', 150, 110, .12); tn(a, t + .12, .2, 'sawtooth', 120, 80, .12); },
    // телефон
    buzz(a, t) { for (let i = 0; i < 3; i++) { tn(a, t + i * .16, .11, 'square', 58, 52, .1); nz(a, t + i * .16, .11, 'bandpass', 140, 140, 2, .12, .001); } },
    rustle(a, t) { nz(a, t, .35, 'bandpass', 1200, 500, .6, .14, .001); nz(a, t + .3, .3, 'highpass', 2500, 1800, .7, .07, .001); },
    tap(a, t) { tn(a, t, .04, 'sine', 1500, 1100, .1); nz(a, t, .02, 'highpass', 4000, 4000, 1, .1, .001); },
    hangup(a, t) { [520, 420, 330].forEach((f, i) => tn(a, t + i * .14, .12, 'sine', f, f, .1)); },
    sms(a, t) { tn(a, t, .12, 'sine', 1175, 1175, .1); tn(a, t + .12, .2, 'sine', 1568, 1568, .1); }
  };

  // фоновый гул магазина (запускается при первом звуке)
  function hum(a) {
    if (HUMG) return;
    const s = a.createBufferSource();
    s.buffer = nbuf(a); s.loop = true;
    const f = a.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 180;
    HUMG = a.createGain(); HUMG.gain.value = 0.035;
    s.connect(f); f.connect(HUMG); HUMG.connect(MASTER);
    s.start();
  }

  function sfx(n) {
    if (!opt.s) return;
    const a = ac();
    if (!a || !SFX[n]) return;
    try { hum(a); SFX[n](a, a.currentTime + .005); } catch (e) {}
  }

  function beep(f, d) {
    if (!opt.s) return;
    const a = ac();
    if (!a) return;
    try {
      const o = a.createOscillator(), g = a.createGain();
      o.connect(g); g.connect(MASTER);
      g.gain.value = .08; o.frequency.value = f || 520;
      o.start(); o.stop(a.currentTime + (d || .07));
    } catch (e) {}
  }

  // рингтон: две серии коротких двойных звонков, повтор каждые 2.2 с
  function ringBurst() {
    const a = ac();
    if (!a || !opt.s) return;
    const t = a.currentTime + .01;
    for (let k = 0; k < 2; k++) for (let i = 0; i < 6; i++) {
      const f = i % 2 ? 740 : 988, tt = t + k * .55 + i * .07;
      tn(a, tt, .06, 'sine', f, f, .09);
      tn(a, tt, .06, 'triangle', f * 2, f * 2, .025);
    }
  }
  function ringStart() { ringStop(); if (!opt.s) return; ringBurst(); RT = setInterval(ringBurst, 2200); }
  function ringStop() { if (RT) { clearInterval(RT); RT = null; } }
  function humLevel(v) { if (HUMG) HUMG.gain.value = v; }

  window.sfx = sfx; window.beep = beep;
  window.ringStart = ringStart; window.ringStop = ringStop; window.humLevel = humLevel;
})();
