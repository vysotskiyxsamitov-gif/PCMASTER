/* PC МАСТЕР — world.js: живая 3D-улица за окнами.
   • настоящая улица: тротуары, дорога, дома напротив, фонари, деревья, машины, прохожие
   • смена времени суток по таймеру дня (07:00 → 22:00), закат, ночь, звёзды, луна
   • погода меняется сама: ясно / облачно / дождь / гроза / туман / снег (+ звук дождя и грома)
   Подключать ПОСЛЕ основного скрипта игры и Room.js:  <script src="world.js"></script>
   Остальные модули (world2.js, visit.js, layout.js) берут общие функции из window.__W. */
(function () {
  if (window.__worldLoaded) return;
  window.__worldLoaded = 1;

  function ready() {
    try {
      return typeof THREE !== 'undefined' && !!scene && typeof bx === 'function' && typeof mkP === 'function' &&
        typeof gait === 'function' && typeof turn === 'function' && typeof next === 'function' && !!window.__roomLoaded;
    } catch (e) { return false; }
  }

  function go() {
    var PI = Math.PI, TAU = PI * 2;
    var W3 = window.__W = { OUT: [] };

    /* ---------- мелкие помощники ---------- */
    var sd = 4242;
    function rr() { sd = (sd * 9301 + 49297) % 233280; return sd / 233280; }
    function R2(a, b) { return a + Math.random() * (b - a); }
    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function sstep(a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
    function pickS(a) { return a[Math.floor(rr() * a.length)]; }
    W3.clamp = clamp; W3.lerp = lerp; W3.sstep = sstep; W3.R2 = R2; W3.pick = pick;

    function ctex(w, h, fn, rx, ry) {
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      fn(c.getContext('2d'), w, h);
      var t = new THREE.CanvasTexture(c);
      t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(rx || 1, ry || 1); t.anisotropy = 8;
      return t;
    }
    W3.ctex = ctex;

    var OUT = W3.OUT;                                   // уличные материалы: их цвет зависит от времени суток
    function stdM(color, r, m, extra) {
      var mt = new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: r === undefined ? .85 : r, metalness: m || 0 }, extra || {}));
      OUT.push({ m: mt, base: mt.color.clone() });
      return mt;
    }
    W3.stdM = stdM;
    var UNIT = new THREE.BoxGeometry(1, 1, 1); UNIT.userData.shared = 1;
    function box(p, w, h, d, m, x, y, z) {
      var o = new THREE.Mesh(UNIT, m); o.scale.set(w, h, d); o.position.set(x, y, z); p.add(o); return o;
    }
    W3.box = box;
    function dispose(o) {
      o.traverse(function (n) {
        if (n.geometry && !n.geometry.userData.shared) n.geometry.dispose();
        if (n.material && !n.userData.keepMat) {
          (Array.isArray(n.material) ? n.material : [n.material]).forEach(function (m) { if (!m.userData.shared) m.dispose(); });
        }
      });
      if (o.parent) o.parent.remove(o);
    }
    W3.dispose = dispose;

    /* ---------- звук (свой AudioContext) ---------- */
    var AC = null, MG = null, NBF = null, rainG = null, hushG = null;
    function actx() {
      if (!AC) {
        try {
          AC = new (window.AudioContext || window.webkitAudioContext)();
          MG = AC.createGain(); MG.gain.value = .8; MG.connect(AC.destination);
          var n = AC.sampleRate * 2; NBF = AC.createBuffer(1, n, AC.sampleRate);
          var d = NBF.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
          var s = AC.createBufferSource(); s.buffer = NBF; s.loop = true;
          var hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 450;
          var lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
          rainG = AC.createGain(); rainG.gain.value = 0;
          s.connect(hp); hp.connect(lp); lp.connect(rainG); rainG.connect(MG); s.start();
          var s2 = AC.createBufferSource(); s2.buffer = NBF; s2.loop = true;
          var l2 = AC.createBiquadFilter(); l2.type = 'lowpass'; l2.frequency.value = 260;
          hushG = AC.createGain(); hushG.gain.value = 0;
          s2.connect(l2); l2.connect(hushG); hushG.connect(MG); s2.start();
        } catch (e) { AC = null; }
      }
      if (AC && AC.state === 'suspended') AC.resume();
      return AC;
    }
    function tn(t, dur, type, f0, f1, v) {
      var o = AC.createOscillator(), g = AC.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t);
      if (f1 && f1 != f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + .01);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g); g.connect(MG); o.start(t); o.stop(t + dur + .05);
    }
    function nb(t, dur, type, f0, f1, q, v) {
      var s = AC.createBufferSource(); s.buffer = NBF; s.loop = true;
      var f = AC.createBiquadFilter(); f.type = type; f.Q.value = q || 1;
      f.frequency.setValueAtTime(f0, t); if (f1 && f1 != f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      var g = AC.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + Math.min(.08, dur / 3));
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(MG); s.start(t, Math.random()); s.stop(t + dur + .05);
    }
    function sOn() { try { return !!opt.s; } catch (e) { return true; } }
    var SND = W3.snd = {
      init: actx,
      bell: function () {           // плашка «День N»: колокольчик + низкий гонг
        if (!sOn() || !actx()) return; var t = AC.currentTime + .02;
        [[659, 0], [880, .2], [1318, .4]].forEach(function (a) { tn(t + a[1], 1.8, 'sine', a[0], a[0], .16); tn(t + a[1], 1.2, 'sine', a[0] * 2.01, a[0] * 2.01, .05); });
        tn(t, 3.2, 'sine', 98, 88, .3); nb(t, 2.4, 'lowpass', 400, 120, .7, .08);
      },
      rustle: function () {         // шелест купюр
        if (!sOn() || !actx()) return; var t = AC.currentTime + .01;
        for (var i = 0; i < 4; i++) nb(t + i * .11, .13, 'bandpass', 2600 + i * 200, 1800, .8, .06);
      },
      thud: function () { if (!sOn() || !actx()) return; var t = AC.currentTime; tn(t, .18, 'sine', 140, 50, .3); },
      whoosh: function (v) {
        if (!sOn() || !actx()) return; var t = AC.currentTime;
        nb(t, 1.6, 'bandpass', 300, 900, .8, .025 * clamp(v, .3, 1));
        nb(t + .8, 1.4, 'bandpass', 900, 260, .8, .025 * clamp(v, .3, 1));
      },
      thunder: function () {
        if (!sOn() || !actx()) return; var t = AC.currentTime + .05;
        nb(t, 3.8, 'lowpass', 220, 60, .7, .55); nb(t + .5, 2.6, 'lowpass', 140, 50, .7, .4); tn(t, 2.4, 'sine', 55, 38, .3);
      }
    };
    ['pointerdown', 'keydown'].forEach(function (ev) { addEventListener(ev, function () { actx(); }, { capture: true }); });

    /* ---------- время суток ---------- */
    var TM = W3.TM = { h: 19.1, frac: .8, day: 0, tot: 900, live: 0 };
    var CAMP = { play: 1, term: 1, talk: 1, mg: 1, call: 1 };
    function timeNow() {
      var live = false;
      try { live = !!G && !!CAMP[mode] && typeof G.dl == 'number'; } catch (e) { }
      TM.live = live;
      if (!live) { TM.h = 19.1; TM.frac = (19.1 - 7) / 15; return; }
      if (TM.day !== G.day || !(TM.tot > 0) || G.dl > TM.tot + 2) {
        if (TM.day !== G.day) rollWeather();
        TM.day = G.day; TM.tot = Math.max(60, G.dl);
      }
      TM.frac = clamp(1 - G.dl / TM.tot, 0, 1); TM.h = 7 + TM.frac * 15;
    }
    W3.hour = function () { return TM.h; };
    W3.frac = function () { return TM.frac; };

    /* ---------- погода ---------- */
    var WX = W3.WX = { type: 'clear', rain: 0, snow: 0, cloud: .12, fog: 0, wet: 0, snowAcc: 0, timer: 80, flash: 0, nextFlash: 12, wind: 1,
      tg: { rain: 0, snow: 0, cloud: .1, fog: 0 } };
    var WNAME = { clear: 'ясно', cloud: 'облачно', rain: 'дождь', storm: 'гроза', fog: 'туман', snow: 'снег' };
    var WICON = { clear: '☀', cloud: '☁', rain: '🌧', storm: '⛈', fog: '🌫', snow: '❄' };
    function setWeather(t) {
      WX.type = t; var g = WX.tg;
      g.rain = t == 'rain' ? .75 : t == 'storm' ? 1 : 0; g.snow = t == 'snow' ? 1 : 0; g.fog = t == 'fog' ? 1 : 0;
      g.cloud = { clear: .1, cloud: .7, rain: .9, storm: 1, fog: .55, snow: .85 }[t];
    }
    function rollWeather() {
      var t = WX.type, r = Math.random();
      var nx = t == 'clear' ? (r < .5 ? 'clear' : r < .88 ? 'cloud' : 'fog')
        : t == 'cloud' ? (r < .3 ? 'clear' : r < .55 ? 'cloud' : r < .85 ? 'rain' : r < .93 ? 'storm' : 'snow')
        : t == 'rain' ? (r < .4 ? 'cloud' : r < .75 ? 'rain' : r < .88 ? 'storm' : 'clear')
        : t == 'storm' ? (r < .6 ? 'rain' : 'cloud')
        : t == 'fog' ? (r < .55 ? 'clear' : 'cloud')
        : (r < .5 ? 'cloud' : 'snow');
      setWeather(nx); WX.timer = R2(110, 230);
    }
    W3.setWeather = setWeather; W3.rollWeather = rollWeather;
    W3.weatherText = function () { return WICON[WX.type] + ' ' + WNAME[WX.type]; };

    /* ---------- небо ---------- */
    var C = function (h) { return new THREE.Color(h); };
    var SKYK = [
      [6.5, 0x0b1030, 0x2a2f5a], [7.6, 0x4a6fa5, 0xf0a878], [9.2, 0x4a90d9, 0xbad8f2], [13, 0x3a83d8, 0xa9d2f4],
      [16.6, 0x4a85cc, 0xe9d3a6], [18.4, 0x4b5a9a, 0xf4a65a], [19.6, 0x2a2f6a, 0xc65a6a], [20.8, 0x121746, 0x4a3a78], [22.3, 0x050818, 0x182046]
    ].map(function (k) { return [k[0], C(k[1]), C(k[2])]; });
    var zen = C(0x4a90d9), hor = C(0xbad8f2), GRAYD = C(0x8a93a3), GRAYN = C(0x1c2030);
    function skyAt(h) {
      var i = 0; while (i < SKYK.length - 2 && h > SKYK[i + 1][0]) i++;
      var a = SKYK[i], b = SKYK[i + 1], t = clamp((h - a[0]) / (b[0] - a[0]), 0, 1);
      zen.copy(a[1]).lerp(b[1], t); hor.copy(a[2]).lerp(b[2], t);
    }

    var domeMat = new THREE.ShaderMaterial({
      uniforms: { top: { value: C(0x4a90d9) }, hor: { value: C(0xbad8f2) }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: C(0xffd9a0) }, glow: { value: .5 } },
      vertexShader: 'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'uniform vec3 top;uniform vec3 hor;uniform vec3 sunDir;uniform vec3 sunCol;uniform float glow;varying vec3 vP;' +
        'void main(){vec3 n=normalize(vP);float h=clamp(n.y,0.0,1.0);vec3 c=mix(hor,top,pow(h,0.55));float s=max(dot(n,sunDir),0.0);' +
        'c+=sunCol*(pow(s,40.0)*0.9+pow(s,6.0)*0.25)*glow;if(n.y<0.0)c=hor*0.85;gl_FragColor=vec4(c,1.0);#include <encodings_fragment>\n}',
      side: THREE.BackSide, depthWrite: false, fog: false
    });
    domeMat.userData.shared = 1;
    var dome = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), domeMat);
    dome.frustumCulled = false; dome.renderOrder = -100; scene.add(dome);

    var glowTex = ctex(64, 64, function (x) {
      var g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    });
    glowTex.wrapS = glowTex.wrapT = THREE.ClampToEdgeWrapping;
    var sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xfff2c8, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    sunGlow.scale.set(150, 150, 1); sunGlow.renderOrder = -60; scene.add(sunGlow);
    var sunCore = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    sunCore.scale.set(46, 46, 1); sunCore.renderOrder = -59; scene.add(sunCore);

    var moonDay = -1, moonTex = null, moonMat = new THREE.SpriteMaterial({ color: 0xdfe8ff, transparent: true, depthWrite: false, fog: false });
    var moon = new THREE.Sprite(moonMat); moon.scale.set(34, 34, 1); moon.renderOrder = -58; scene.add(moon);
    function drawMoon(dayN) {
      if (moonTex) moonTex.dispose();
      var ph = (dayN % 29) / 29;                              // 0 новолуние → .5 полнолуние
      moonTex = ctex(128, 128, function (x) {
        var g = x.createRadialGradient(64, 64, 0, 64, 64, 54);
        g.addColorStop(0, '#f4f7ff'); g.addColorStop(1, '#c9d3ee');
        x.fillStyle = g; x.beginPath(); x.arc(64, 64, 52, 0, TAU); x.fill();
        x.fillStyle = 'rgba(120,130,160,.25)';
        [[48, 52, 11], [78, 44, 8], [72, 78, 14], [46, 82, 7]].forEach(function (c) { x.beginPath(); x.arc(c[0], c[1], c[2], 0, TAU); x.fill(); });
        var k = Math.abs(Math.cos(ph * TAU));                 // 1 = тонкий серп, 0 = полная
        if (k > .08) { x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000'; x.beginPath(); x.arc(64 + (ph < .5 ? -1 : 1) * 52 * (1 - k * .5) * .9, 64, 52 * (.7 + .3 * k), 0, TAU); x.fill(); }
      });
      moonTex.wrapS = moonTex.wrapT = THREE.ClampToEdgeWrapping;
      moonMat.map = moonTex; moonMat.needsUpdate = true;
    }
    drawMoon(8);

    var stars; (function () {
      var n = 520, p = new Float32Array(n * 3), i = 0;
      while (i < n) { var x = Math.random() * 2 - 1, y = Math.random(), z = Math.random() * 2 - 1, l = Math.sqrt(x * x + y * y + z * z); if (l > 1 || l < .2 || y / l < .04) continue; p[i * 3] = x / l * 480; p[i * 3 + 1] = y / l * 480; p[i * 3 + 2] = z / l * 480; i++; }
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
      stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false }));
      stars.frustumCulled = false; stars.renderOrder = -70; scene.add(stars);
    })();

    var cloudTex = ctex(256, 128, function (x) {
      for (var i = 0; i < 18; i++) {
        var cx = 30 + rr() * 196, cy = 50 + rr() * 40, r = 24 + rr() * 30, g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
    });
    cloudTex.wrapS = cloudTex.wrapT = THREE.ClampToEdgeWrapping;
    var clouds = [], cloudGeo = new THREE.PlaneGeometry(170, 70);
    for (var ci = 0; ci < 16; ci++) {
      var cm = new THREE.Mesh(cloudGeo, new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, opacity: 0, depthWrite: false, fog: false }));
      cm.position.set(R2(-430, 430), R2(60, 190), R2(290, 440)); cm.rotation.y = PI; cm.renderOrder = -50;
      cm.userData.sp = R2(.8, 2.4); scene.add(cm); clouds.push(cm);
    }

    var sunL = new THREE.DirectionalLight(0xfff0d0, 0); sunL.position.set(0, 40, 40); scene.add(sunL);
    var tint = W3.tint = new THREE.Color(1, 1, 1);
    var sunDir = W3.sunDir = new THREE.Vector3(0, 1, 0);
    var ENV = W3.ENV = { dayF: 1, lampF: 0, winF: 0, starF: 0, bri: 1 };

    /* ---------- улица ---------- */
    var ST = new THREE.Group(); scene.add(ST); W3.ST = ST;
    var NZ = 8.15;                   // наружная грань стены магазина
    var roadMat, snowMat, lampGlowMat, lampHeadMat, winMats = [], shopMats = [], treeMats = [];
    var lamps = [], trees = [], parked = [];

    function tileTex(rx, ry) {
      return ctex(128, 128, function (x, W, H) {
        x.fillStyle = '#868a93'; x.fillRect(0, 0, W, H);
        for (var i = 0; i < 700; i++) { x.fillStyle = 'rgba(0,0,0,' + rr() * .08 + ')'; x.fillRect(rr() * W, rr() * H, 2, 2); }
        x.strokeStyle = '#656972'; x.lineWidth = 3; x.strokeRect(0, 0, W / 2, H / 2); x.strokeRect(W / 2, 0, W / 2, H / 2); x.strokeRect(0, H / 2, W / 2, H / 2); x.strokeRect(W / 2, H / 2, W / 2, H / 2);
      }, rx, ry);
    }

    function facadeMat(v) {
      var cols = 4, rows = 3, cw = 64, ch = 118, Wp = cols * cw, Hp = rows * ch;
      var pal = [['#8d6d5a', '#715745'], ['#bcae92', '#9f9176'], ['#707b8d', '#59637a'], ['#a65a4d', '#86463d'], ['#818d78', '#697560'], ['#cbc3b2', '#aaa292']][v % 6];
      var lit = [], r, c; for (r = 0; r < rows; r++) { lit[r] = []; for (c = 0; c < cols; c++) lit[r][c] = rr() < .5 ? (rr() < .3 ? 2 : 1) : 0; }
      var day = ctex(Wp, Hp, function (x) {
        x.fillStyle = pal[0]; x.fillRect(0, 0, Wp, Hp);
        for (var i = 0; i < 900; i++) { x.fillStyle = 'rgba(' + (rr() < .5 ? 255 : 0) + ',' + (rr() < .5 ? 255 : 0) + ',' + (rr() < .5 ? 255 : 0) + ',' + rr() * .05 + ')'; x.fillRect(rr() * Wp, rr() * Hp, 2, 2); }
        for (r = 0; r < rows; r++) {
          x.fillStyle = pal[1]; x.fillRect(0, r * ch + ch - 10, Wp, 10);
          for (c = 0; c < cols; c++) {
            var wx = c * cw + 11, wy = r * ch + 26, ww = 42, wh = 68;
            x.fillStyle = '#24262c'; x.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
            x.fillStyle = lit[r][c] ? '#9bb7cd' : '#5d7488'; x.fillRect(wx, wy, ww, wh);
            x.fillStyle = '#24262c'; x.fillRect(wx + ww / 2 - 1, wy, 2, wh); x.fillRect(wx, wy + wh * .38, ww, 2);
            x.fillStyle = pal[1]; x.fillRect(wx - 5, wy + wh + 3, ww + 10, 5);
          }
        }
      });
      var night = ctex(Wp, Hp, function (x) {
        x.fillStyle = '#000'; x.fillRect(0, 0, Wp, Hp);
        for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) if (lit[r][c]) {
          var wx = c * cw + 11, wy = r * ch + 26, ww = 42, wh = 68;
          x.fillStyle = lit[r][c] == 2 ? '#ffe9b8' : '#ffc46b'; x.fillRect(wx, wy, ww, wh);
          x.fillStyle = 'rgba(0,0,0,.5)'; x.fillRect(wx + ww / 2 - 1, wy, 2, wh); x.fillRect(wx, wy + wh * .38, ww, 2);
        }
      });
      return stdM(0xffffff, .92, 0, { map: day, emissiveMap: night, emissive: 0xffffff, emissiveIntensity: 0 });
    }
    function shopMat(i) {
      var cs = ['#f472b6', '#22d3ee', '#a3e635', '#fb923c', '#c084fc', '#f87171', '#fbbf24', '#34d399'];
      var nm = ['КАФЕ', 'АПТЕКА', 'БАР', 'ПИЦЦА', 'МАРКЕТ', 'ЦВЕТЫ', 'ХЛЕБ', 'КНИГИ'][i % 8], col = cs[i % 8];
      function paint(x, W, H, isNight) {
        x.fillStyle = isNight ? '#000' : '#2b2f3a'; x.fillRect(0, 0, W, H);
        x.fillStyle = isNight ? col : '#3a3f4e'; x.fillRect(8, 6, W - 16, 28);
        x.fillStyle = isNight ? '#0a0a0a' : '#e5e7eb'; x.font = 'bold 22px sans-serif'; x.textAlign = 'center'; x.fillText(nm, W / 2, 28);
        x.fillStyle = isNight ? '#ffd9a0' : '#6f8aa2'; x.fillRect(12, 44, W * .56, H - 52);
        x.fillStyle = isNight ? '#ffc98a' : '#59718a'; x.fillRect(W * .66, 44, W * .3, H - 52);
        x.fillStyle = isNight ? 'rgba(0,0,0,.55)' : '#1d2028'; x.fillRect(12 + W * .28 - 1, 44, 2, H - 52); x.fillRect(W * .81 - 1, 44, 2, H - 52);
      }
      var day = ctex(256, 128, function (x, W, H) { paint(x, W, H, 0); }), nt = ctex(256, 128, function (x, W, H) { paint(x, W, H, 1); });
      return stdM(0xffffff, .8, 0, { map: day, emissiveMap: nt, emissive: 0xffffff, emissiveIntensity: 0 });
    }

    function buildStreet() {
      var i, g;
      for (i = 0; i < 6; i++) winMats.push(facadeMat(i));
      for (i = 0; i < 8; i++) shopMats.push(shopMat(i));

      // земля, тротуары, дорога
      var gm = new THREE.Mesh(new THREE.PlaneGeometry(1400, 700), stdM(0x23262c, .95, 0)); gm.rotation.x = -PI / 2; gm.position.set(0, -.05, 330); ST.add(gm);
      function sidewalk(z0, z1) {
        var d = z1 - z0, tt = tileTex(200, d / 2), side = stdM(0x7b7f88, .9, 0);
        var m = new THREE.Mesh(new THREE.BoxGeometry(400, .16, d), [side, side, stdM(0xffffff, .9, 0, { map: tt }), side, side, side]);
        m.position.set(0, .08, (z0 + z1) / 2); ST.add(m);
      }
      sidewalk(NZ, 13.5); sidewalk(29.5, 35.5);
      var curbM = stdM(0xb9bcc4, .8, 0);
      box(ST, 400, .22, .32, curbM, 0, .11, 13.5); box(ST, 400, .22, .32, curbM, 0, .11, 29.5);
      var asph = ctex(512, 256, function (x, W, H) {
        x.fillStyle = '#2a2c33'; x.fillRect(0, 0, W, H);
        for (var k = 0; k < 2600; k++) { x.fillStyle = 'rgba(' + (rr() < .5 ? 255 : 0) + ',' + (rr() < .5 ? 255 : 0) + ',' + (rr() < .5 ? 255 : 0) + ',' + rr() * .06 + ')'; x.fillRect(rr() * W, rr() * H, 2, 2); }
        x.fillStyle = '#d9d9d2'; x.fillRect(0, 5, W, 3); x.fillRect(0, H - 8, W, 3);
        x.fillStyle = '#e8c547'; x.fillRect(0, H / 2 - 5, W, 3); x.fillRect(0, H / 2 + 2, W, 3);
        x.fillStyle = 'rgba(235,235,225,.7)'; for (var q = 0; q < W; q += 64) { x.fillRect(q + 8, H * .25 - 1, 34, 2); x.fillRect(q + 8, H * .75 - 1, 34, 2); }
      }, 14, 1);
      roadMat = stdM(0xffffff, .92, 0, { map: asph, envMapIntensity: .8 });
      var road = new THREE.Mesh(new THREE.PlaneGeometry(400, 16), roadMat); road.rotation.x = -PI / 2; road.position.set(0, .01, 21.5); ST.add(road);
      var zeb = ctex(64, 256, function (x, W, H) { x.fillStyle = 'rgba(0,0,0,0)'; x.clearRect(0, 0, W, H); x.fillStyle = 'rgba(235,235,228,.85)'; for (var s = 0; s < H; s += 32) x.fillRect(6, s + 4, W - 12, 18); });
      [-22, 26].forEach(function (zx) {
        var zm = new THREE.Mesh(new THREE.PlaneGeometry(6, 16), stdM(0xffffff, .9, 0, { map: zeb, transparent: true })); zm.rotation.x = -PI / 2; zm.rotation.z = PI / 2; zm.position.set(zx, .02, 21.5); ST.add(zm);
      });
      // снег поверх (виден только когда идёт снег)
      snowMat = new THREE.MeshBasicMaterial({ color: 0xeef3fb, transparent: true, opacity: 0, depthWrite: false });
      [[NZ, 13.5, .17], [13.5, 29.5, .03], [29.5, 35.5, .17]].forEach(function (a) {
        var sm = new THREE.Mesh(new THREE.PlaneGeometry(400, a[1] - a[0]), snowMat); sm.rotation.x = -PI / 2; sm.position.set(0, a[2], (a[0] + a[1]) / 2); sm.renderOrder = 1; ST.add(sm);
      });

      // дома напротив: три ряда
      function building(x, z0, w, h, depth, face, v) {
        /* дом = одна плоская стена-«картинка» (фасад с окнами). Раньше был куб из 6 материалов, это ~6 вызовов отрисовки на дом. */
        var geo = new THREE.PlaneGeometry(w, h), uv = geo.attributes.uv, rx = Math.max(1, w / 12), ry = Math.max(1, h / 16.5);
        for (var k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * rx, uv.getY(k) * ry);
        uv.needsUpdate = true;
        var m = new THREE.Mesh(geo, winMats[v % 6]);
        if (face == 'nz') { m.rotation.y = PI; m.position.set(x, h / 2, z0); }          // смотрит на магазин (в сторону −z)
        else m.position.set(x, h / 2, z0 + depth);                                        // соседние дома: фасад к улице (+z)
        ST.add(m); return m;
      }
      var x, v = 0;
      for (x = -204; x < 204; x += 24) {                                        // первый ряд
        var w1 = 24, h1 = 16.5 * (1 + (rr() < .55 ? 1 : 0) + (rr() < .2 ? 1 : 0));
        building(x + 12, 35.5, w1, h1, 16, 'nz', v++);
        for (var s = 0; s < 2; s++) {
          var sp = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), shopMats[Math.floor(rr() * 8)]); sp.rotation.y = PI; sp.position.set(x + 6 + s * 12, 3, 35.45); ST.add(sp);
        }
      }
      for (x = -216; x < 216; x += 36) building(x + 18, 56, 36, 33 + 16.5 * Math.floor(rr() * 3), 24, 'nz', v++);   // второй ряд
      for (x = -300; x < 300; x += 60) building(x + 30, 118, 60, 66 + 33 * Math.floor(rr() * 3), 40, 'nz', v++);   // дальний
      // соседние дома справа и слева от магазина: фасад вровень с фасадом магазина (z = NZ), а вся глубина уходит ВНУТРЬ квартала.
      // Раньше они росли от фасада наружу и торчали «стенками» поперёк тротуара и дороги.
      var GAP = .06, NBD = 12, ni;
      for (ni = 7; ni >= 0; ni--) building(-(10 + GAP) - 12 - 24 * ni, NZ - NBD, 24, 16.5 * (1 + (rr() < .6 ? 1 : 0)), NBD, 'pz', v++);   // слева (от дальних к ближним)
      for (ni = 0; ni < 8; ni++) building((10 + GAP) + 12 + 24 * ni, NZ - NBD, 24, 16.5 * (1 + (rr() < .6 ? 1 : 0)), NBD, 'pz', v++);       // справа

      // фонари
      lampGlowMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xffd9a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
      lampHeadMat = new THREE.MeshStandardMaterial({ color: 0xfff1c9, emissive: 0xffd9a0, emissiveIntensity: .1 });
      var poleM = stdM(0x2a2e37, .6, .5), poolMat = new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffd9a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      function lamp(lx, lz, dirz) {
        var lg = new THREE.Group(); lg.position.set(lx, 0, lz);
        var p = new THREE.Mesh(new THREE.CylinderGeometry(.13, .18, 11, 8), poleM); p.position.y = 5.5; lg.add(p);
        box(lg, .12, .12, 2.2 * dirz, poleM, 0, 10.9, 1.1 * dirz).scale.z = 2.2;
        box(lg, .9, .2, .5, lampHeadMat, 0, 10.75, 2.2 * dirz);
        var sp = new THREE.Sprite(lampGlowMat); sp.scale.set(9, 9, 1); sp.position.set(0, 10.5, 2.2 * dirz); sp.renderOrder = 5; lg.add(sp);
        var pool = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), poolMat); pool.rotation.x = -PI / 2; pool.position.set(0, .2, 2.2 * dirz); lg.add(pool);
        ST.add(lg); lamps.push(lg);
      }
      for (x = -88; x <= 88; x += 22) { lamp(x, 12.9, 1); lamp(x + 11, 30.2, -1); }

      // деревья, лавочки, урны
      var trunkM = stdM(0x4a3526, .95, 0), leafM = [stdM(0x2f6b3a, .9, 0), stdM(0x3b7d3f, .9, 0), stdM(0x2a5e36, .9, 0)];
      var sphG = new THREE.SphereGeometry(1, 8, 6); sphG.userData.shared = 1;
      [-52, -34, -14, 14, 33, 52, -66, 66].forEach(function (tx, k) {
        var tg = new THREE.Group(); tg.position.set(tx, 0, k % 2 ? 12.4 : 30.8);
        var tr = new THREE.Mesh(new THREE.CylinderGeometry(.3, .4, 5, 7), trunkM); tr.position.y = 2.6; tg.add(tr);
        var lm = leafM[k % 3];
        [[0, 6.4, 0, 2.5], [1.3, 5.6, .6, 1.8], [-1.2, 5.8, -.5, 1.9], [.2, 7.8, .2, 1.7]].forEach(function (a) { var s = new THREE.Mesh(sphG, lm); s.scale.setScalar(a[3]); s.position.set(a[0], a[1], a[2]); tg.add(s); });
        ST.add(tg); trees.push(tg);
      });
      var woodM = stdM(0x6b4a2a, .85, 0), metalM = stdM(0x2e323b, .6, .5);
      [-8.4, 9.6, -40, 42].forEach(function (bxx) {
        var b = new THREE.Group(); b.position.set(bxx, 0, 12.1);
        box(b, 3.2, .18, .9, woodM, 0, 1.1, 0); box(b, 3.2, .9, .14, woodM, 0, 1.7, .4); box(b, .14, 1.1, .8, metalM, -1.4, .55, 0); box(b, .14, 1.1, .8, metalM, 1.4, .55, 0); ST.add(b);
      });
      [-5.4, 4.8, 18, -26].forEach(function (ux) { var u = new THREE.Mesh(new THREE.CylinderGeometry(.4, .34, 1.4, 10), metalM); u.position.set(ux, .8, 12.9); ST.add(u); });
    }

    /* ---------- машины ---------- */
    var beamTex = ctex(256, 128, function (x, W, H) {   // конус света: узкий у фары, широкий и мягкий на дороге
      var g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(255,246,214,1)'); g.addColorStop(.35, 'rgba(255,240,200,.55)'); g.addColorStop(1, 'rgba(255,236,190,0)');
      x.fillStyle = g; x.beginPath(); x.moveTo(0, H * .46); x.lineTo(W, H * .04); x.lineTo(W, H * .96); x.lineTo(0, H * .54); x.closePath(); x.fill();
      x.globalCompositeOperation = 'destination-in';
      var v = x.createLinearGradient(0, 0, 0, H); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(.28, 'rgba(0,0,0,.8)'); v.addColorStop(.5, 'rgba(0,0,0,1)'); v.addColorStop(.72, 'rgba(0,0,0,.8)'); v.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = v; x.fillRect(0, 0, W, H);
    });
    beamTex.wrapS = beamTex.wrapT = THREE.ClampToEdgeWrapping;
    var beamMat = new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide });
    var carGlow = new THREE.SpriteMaterial({ map: glowTex, color: 0xfff0c0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    var carHalo = new THREE.SpriteMaterial({ map: glowTex, color: 0xffd98a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    var carCore = new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    var carStreak = new THREE.SpriteMaterial({ map: glowTex, color: 0x9cc4ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    var tailGlow = new THREE.SpriteMaterial({ map: glowTex, color: 0xff2a2a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    var headMat = new THREE.MeshStandardMaterial({ color: 0xfff6dd, emissive: 0xfff0c0, emissiveIntensity: .2 });
    var tailMat = new THREE.MeshStandardMaterial({ color: 0x7a0f14, emissive: 0xff2a2a, emissiveIntensity: .3 });
    var glassMat = stdM(0x1b2430, .12, .6), wheelMat = stdM(0x111214, .9, 0), hubMat = stdM(0x9aa0aa, .4, .8);
    var WGEO = new THREE.CylinderGeometry(.75, .75, .5, 14), HGEO = new THREE.CylinderGeometry(.35, .35, .52, 10), BEAMG = new THREE.PlaneGeometry(26, 12);
    [WGEO, HGEO, BEAMG].forEach(function (g) { g.userData.shared = 1; });
    var bodyCache = {}, CARC = [0xdc2626, 0x2563eb, 0xe5e7eb, 0xfacc15, 0x16a34a, 0x7c3aed, 0x1f2937, 0x94a3b8, 0xea580c, 0x0f766e];
    function bodyMat(c) { return bodyCache[c] || (bodyCache[c] = stdM(c, .26, .6, { envMapIntensity: 1.6 })); }
    function mkCar(color, kind) {
      kind = kind || 'sedan';
      var g = new THREE.Group(), bm = bodyMat(color), L = kind == 'van' ? 8.6 : kind == 'hatch' ? 8 : 9.2;
      if (kind == 'van') {
        box(g, L, 2.7, 3.9, bm, 0, 2.05, 0); box(g, 2.1, 1.1, 3.92, glassMat, L / 2 - 1.5, 2.9, 0); box(g, L - 3.4, 1.0, 3.92, glassMat, -1.5, 2.9, 0).scale.y = .001;
      } else {
        box(g, L, 1.5, 3.9, bm, 0, 1.15, 0);
        var cl = kind == 'hatch' ? 5.4 : 4.6, cx = kind == 'hatch' ? -1.1 : -.5;
        box(g, cl, 1.3, 3.5, bm, cx, 2.45, 0); box(g, cl + .04, .95, 3.54, glassMat, cx, 2.55, 0); box(g, cl - .4, .12, 3.4, bm, cx, 3.16, 0);
      }
      [-2.9, 2.9].forEach(function (wx) { [-1.95, 1.95].forEach(function (wz) {
        var w = new THREE.Mesh(WGEO, wheelMat); w.rotation.x = PI / 2; w.position.set(wx, .75, wz); g.add(w);
        var h = new THREE.Mesh(HGEO, hubMat); h.rotation.x = PI / 2; h.position.set(wx, .75, wz); g.add(h);
      }); });
      [-1.25, 1.25].forEach(function (z) {
        box(g, .15, .4, .85, headMat, L / 2, 1.4, z); box(g, .15, .38, .85, tailMat, -L / 2, 1.45, z);
        var sp = new THREE.Sprite(carHalo); sp.scale.set(7.5, 7.5, 1); sp.position.set(L / 2 + .5, 1.4, z); sp.renderOrder = 4; g.add(sp);
        var sc = new THREE.Sprite(carCore); sc.scale.set(1.9, 1.9, 1); sc.position.set(L / 2 + .3, 1.4, z); sc.renderOrder = 5; g.add(sc);
      });
      var stk = new THREE.Sprite(carStreak); stk.scale.set(13, 1.1, 1); stk.position.set(L / 2 + .6, 1.4, 0); stk.renderOrder = 4; g.add(stk);   // горизонтальный блик линзы
      var tl = new THREE.Sprite(tailGlow); tl.scale.set(6.5, 2.2, 1); tl.position.set(-L / 2 - .4, 1.45, 0); tl.renderOrder = 4; g.add(tl);
      var bm2 = new THREE.Mesh(BEAMG, beamMat); bm2.rotation.x = -PI / 2; bm2.position.set(L / 2 + 10, .09, 0); bm2.renderOrder = 3; g.add(bm2);
      g.userData.L = L; scene.add(g); return g;
    }
    W3.mkCar = function (color, kind) { var c = mkCar(color, kind); ST.add(c); return c; };
    W3.CARC = CARC;

    var cars = [], LANES = [{ z: 19.5, dir: -1, gap: 0 }, { z: 23.5, dir: 1, gap: 0 }];
    function spawnCar(ln) {
      var kind = pick(['sedan', 'sedan', 'hatch', 'van']), g = mkCar(pick(CARC), kind);
      var v = R2(15, 24); g.position.set(ln.dir > 0 ? -118 : 118, 0, ln.z); g.rotation.y = ln.dir > 0 ? 0 : PI;
      ST.add(g); cars.push({ g: g, ln: ln, v: v, v0: v, whoosh: 0 });
      ln.gap = R2(26, 70);
    }
    function updCars(dt) {
      var busy = TM.h > 21 ? .5 : 1;
      LANES.forEach(function (ln) {
        var last = null; cars.forEach(function (c) { if (c.ln === ln && (!last || (ln.dir > 0 ? c.g.position.x < last.g.position.x : c.g.position.x > last.g.position.x))) last = c; });
        var edge = last ? Math.abs(last.g.position.x - (ln.dir > 0 ? -118 : 118)) : 999;
        if (edge > ln.gap / busy) spawnCar(ln);
      });
      for (var i = cars.length - 1; i >= 0; i--) {
        var c = cars[i], g = c.g, d = c.ln.dir, tv = c.v0 * (WX.rain > .3 ? .8 : 1), ahead = 999;
        cars.forEach(function (o) { if (o !== c && o.ln === c.ln) { var dd = (o.g.position.x - g.position.x) * d; if (dd > 0 && dd < ahead) { ahead = dd; if (dd < 16) tv = Math.min(tv, o.v * .95); } } });
        if (ahead < 11) tv = 0;
        c.v += (tv - c.v) * Math.min(1, dt * 2);
        g.position.x += d * c.v * dt;
        if (!c.whoosh && Math.abs(g.position.x) < 16) { c.whoosh = 1; SND.whoosh(c.v / 24); }
        if (Math.abs(g.position.x) > 122) { dispose(g); cars.splice(i, 1); }
      }
    }
    function buildParked() {
      [[-36, 15.3, 'sedan'], [-26, 15.3, 'hatch'], [30, 15.3, 'sedan'], [44, 15.3, 'van'], [-48, 27.6, 'sedan'], [-18, 27.6, 'hatch'], [8, 27.6, 'sedan'], [38, 27.6, 'sedan']].forEach(function (a) {
        var g = mkCar(pick(CARC), a[2]); g.position.set(a[0], 0, a[1]); g.rotation.y = a[1] < 20 ? 0 : PI; ST.add(g); parked.push(g);
      });
    }

    /* ---------- прохожие ---------- */
    var PEDS = W3.peds = [];
    function mkLow(col, pa, sk, hair) {
      var g = new THREE.Group(), a = { lg: [], ar: [] };
      function M(c) { return new THREE.MeshStandardMaterial({ color: c, roughness: .85, metalness: 0 }); }
      var mc = M(col), mp = M(pa), ms = M(sk), mh = M(hair), msh = M(0x15171c);
      function B(p, w, h, d, m, x, y, z) { var o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); p.add(o); return o; }
      B(g, .95, 1.45, .55, mc, 0, 2.3, 0);
      var hd = new THREE.Mesh(new THREE.SphereGeometry(.3, 10, 8), ms); hd.position.set(0, 3.3, 0); g.add(hd);
      var hh = new THREE.Mesh(new THREE.SphereGeometry(.32, 10, 8, 0, TAU, 0, PI * .55), mh); hh.position.set(0, 3.34, -.02); g.add(hh);
      [-.2, .2].forEach(function (x) { var q = new THREE.Group(); q.position.set(x, 1.55, 0); B(q, .34, 1.45, .38, mp, 0, -.72, 0); B(q, .36, .16, .62, msh, 0, -1.45, .1); g.add(q); a.lg.push(q); });
      [-.64, .64].forEach(function (x) { var q = new THREE.Group(); q.position.set(x, 2.95, 0); B(q, .24, 1.15, .26, mc, 0, -.55, 0); B(q, .2, .22, .22, ms, 0, -1.22, 0); g.add(q); a.ar.push(q); });
      g.userData = a; g.rotation.order = 'YXZ'; scene.add(g); return g;
    }
    W3.mkLow = mkLow;
    var SHIRT = [0x3b82f6, 0xef4444, 0x22c55e, 0xeab308, 0xa855f7, 0xf97316, 0xe5e7eb, 0x14b8a6, 0x64748b, 0xdb2777], PANTS = [0x1f2937, 0x334155, 0x3f3f46, 0x1e3a8a, 0x44403c, 0x0f172a];
    var SKIN = [0xf1c9a5, 0xe0b99a, 0xc68a62, 0x8d5a3c, 0xf5d5b8], HAIR = [0x2a1a10, 0x111111, 0x6b4a2a, 0xb8893c, 0x777777];
    function addUmbrella(g) {
      var u = new THREE.Group(), cm = new THREE.MeshStandardMaterial({ color: pick([0xdc2626, 0x2563eb, 0x111827, 0x16a34a, 0xeab308]), roughness: .7, side: THREE.DoubleSide });
      var top = new THREE.Mesh(new THREE.SphereGeometry(1.25, 14, 6, 0, TAU, 0, PI * .5), cm); top.position.y = 4.35; u.add(top);
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1.5, 6), new THREE.MeshStandardMaterial({ color: 0x222222 })); pole.position.y = 3.7; u.add(pole);
      g.add(u); g.userData.umb = u;
    }
    function spawnPed(near) {
      var g, dir = Math.random() < .5 ? -1 : 1, rain = WX.rain > .35;
      if (near) { g = mkP({ col: pick(SHIRT), pa: pick(PANTS) }); g.traverse(function (o) { if (o.isMesh) o.castShadow = o.receiveShadow = false; }); }
      else g = mkLow(pick(SHIRT), pick(PANTS), pick(SKIN), pick(HAIR));
      if (rain && Math.random() < .7) addUmbrella(g);
      var z = near ? R2(9.7, 12.4) : R2(30.2, 34.6);
      g.position.set(-dir * 62, 0, z);
      PEDS.push({ g: g, near: near, dir: dir, spd: R2(3.1, 4.5) * (rain ? 1.25 : 1), z: z, ph: Math.random() * 6, st: 'walk', t: 0, stopped: 0, umb: !!g.userData.umb, phone: Math.random() < .15 });
    }
    function updPeds(dt, tt) {
      var dayF = ENV.dayF, tn = Math.round(lerp(1, 3, dayF) * (WX.rain > .4 ? .7 : 1)), tf = Math.round(lerp(1, 4, dayF) * (WX.rain > .4 ? .7 : 1));
      var cn = 0, cf = 0; PEDS.forEach(function (p) { if (p.near) cn++; else cf++; });
      if (cn < tn && Math.random() < dt * .35) spawnPed(true);
      if (cf < tf && Math.random() < dt * .5) spawnPed(false);
      for (var i = PEDS.length - 1; i >= 0; i--) {
        var p = PEDS[i], g = p.g, a = g.userData;
        if (p.st == 'stop') {
          p.t -= dt; turn(g, PI, dt); a.lg.forEach(function (q) { q.rotation.x *= .85; }); a.ar[0].rotation.x *= .85; g.position.y *= .8; g.rotation.x *= .85; g.rotation.z *= .85;
          if (p.phone) a.ar[1].rotation.x = -2.2; else a.ar[1].rotation.x *= .85;
          if (p.t <= 0) { p.st = 'walk'; p.stopped = 1; }
        } else {
          g.position.x += p.dir * p.spd * dt; turn(g, p.dir > 0 ? PI / 2 : -PI / 2, dt);
          gait(g, p.ph, Math.min(1, p.spd / 3.6), tt);
          if (p.umb) a.ar[1].rotation.x = -1.2;
          if (p.near && !p.stopped && !p.umb && Math.abs(g.position.x) < 9 && Math.random() < dt * .05) { p.st = 'stop'; p.t = R2(3, 8); }
        }
        if (Math.abs(g.position.x) > 66) { dispose(g); PEDS.splice(i, 1); }
      }
    }

    /* ---------- дождь и снег ---------- */
    var RN = 2200, rpos = new Float32Array(RN * 6), rvel = new Float32Array(RN), rainGeo = new THREE.BufferGeometry();
    function dropReset(i, init) {
      var x = R2(-70, 70), z = 8.4 + Math.pow(Math.random(), 1.5) * 40, y = init ? R2(0, 45) : R2(40, 48), o = i * 6;
      rpos[o] = x; rpos[o + 1] = y; rpos[o + 2] = z; rpos[o + 3] = x - .18; rpos[o + 4] = y + 1.1; rpos[o + 5] = z; rvel[i] = R2(46, 64);
    }
    for (var di = 0; di < RN; di++) dropReset(di, true);
    var rainAttr = new THREE.BufferAttribute(rpos, 3); rainAttr.setUsage(THREE.DynamicDrawUsage); rainGeo.setAttribute('position', rainAttr);
    var rainMat = new THREE.LineBasicMaterial({ color: 0xb8d0ee, transparent: true, opacity: 0, depthWrite: false });
    var rainL = new THREE.LineSegments(rainGeo, rainMat); rainL.frustumCulled = false; rainL.renderOrder = 6; scene.add(rainL);
    function updRain(dt) {
      var n = Math.floor(RN * clamp(WX.rain, 0, 1)); rainL.visible = n > 20; if (!rainL.visible) return;
      rainGeo.setDrawRange(0, n * 2); rainMat.opacity = .5 * clamp(WX.rain * 1.3, 0, 1) * lerp(.35, 1, ENV.dayF + .2);
      var wx = -4 * WX.wind;
      for (var i = 0; i < n; i++) {
        var o = i * 6, d = rvel[i] * dt;
        rpos[o + 1] -= d; rpos[o + 4] -= d; rpos[o] += wx * dt; rpos[o + 3] += wx * dt;
        if (rpos[o + 1] < 0) dropReset(i, false);
      }
      rainAttr.needsUpdate = true;
    }
    var SN = 1500, spos = new Float32Array(SN * 3), sph = new Float32Array(SN), snowGeo = new THREE.BufferGeometry();
    for (var si = 0; si < SN; si++) { spos[si * 3] = R2(-60, 60); spos[si * 3 + 1] = R2(0, 40); spos[si * 3 + 2] = 8.4 + Math.pow(Math.random(), 1.4) * 38; sph[si] = Math.random() * 6; }
    var snowAttr = new THREE.BufferAttribute(spos, 3); snowAttr.setUsage(THREE.DynamicDrawUsage); snowGeo.setAttribute('position', snowAttr);
    var snowP = new THREE.Points(snowGeo, new THREE.PointsMaterial({ map: glowTex, color: 0xffffff, size: .5, transparent: true, opacity: 0, depthWrite: false })); snowP.frustumCulled = false; snowP.renderOrder = 6; scene.add(snowP);
    function updSnow(dt, tt) {
      var n = Math.floor(SN * clamp(WX.snow, 0, 1)); snowP.visible = n > 20; if (!snowP.visible) return;
      snowGeo.setDrawRange(0, n); snowP.material.opacity = .9;
      for (var i = 0; i < n; i++) {
        var o = i * 3; spos[o + 1] -= (3.6 + (i % 5) * .5) * dt; spos[o] += Math.sin(tt * .8 + sph[i]) * .9 * dt + WX.wind * .6 * dt;
        if (spos[o + 1] < 0) { spos[o + 1] = 40; spos[o] = R2(-60, 60); }
      }
      snowAttr.needsUpdate = true;
    }

    /* ---------- пятна солнца на полу ---------- */
    var patchTex = ctex(64, 64, function (x) { x.fillStyle = 'rgba(0,0,0,0)'; x.clearRect(0, 0, 64, 64); x.filter = 'blur(5px)'; x.fillStyle = '#fff'; x.fillRect(10, 10, 44, 44); });
    patchTex.wrapS = patchTex.wrapT = THREE.ClampToEdgeWrapping;
    var patchMat = new THREE.MeshBasicMaterial({ map: patchTex, color: 0xffe2a8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    var patches = [-5.9, 5.9].map(function (wx) {
      var g = new THREE.BufferGeometry(), p = new Float32Array(12);
      g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2)); g.setIndex([0, 1, 2, 0, 2, 3]);
      var m = new THREE.Mesh(g, patchMat); m.frustumCulled = false; m.renderOrder = 2; scene.add(m); return { m: m, p: p, wx: wx };
    });
    function updPatches() {
      var up = sunDir.y > .2 && ENV.dayF > .2;
      patchMat.opacity = up ? .2 * ENV.dayF * (1 - WX.cloud * .95) : 0; patches.forEach(function (q) { q.m.visible = up && patchMat.opacity > .01; });
      if (!up) return;
      var sx = sunDir.x, sy = sunDir.y, sz = sunDir.z;
      patches.forEach(function (q) {
        var c = [[q.wx - 3.4, 1.2], [q.wx + 3.4, 1.2], [q.wx + 3.4, 6.4], [q.wx - 3.4, 6.4]];
        for (var i = 0; i < 4; i++) {
          var t = c[i][1] / sy; q.p[i * 3] = c[i][0] - sx * t; q.p[i * 3 + 1] = .03; q.p[i * 3 + 2] = Math.max(-7.6, 8 - sz * t);
        }
        q.m.geometry.attributes.position.needsUpdate = true;
      });
    }

    /* ---------- обновление неба, света, тумана ---------- */
    var lastEnv = 0, tmpC = new THREE.Color();
    function updEnv(dt, tt) {
      WX.timer -= dt; if (WX.timer <= 0) rollWeather();
      var k = Math.min(1, dt * .25), g = WX.tg;
      WX.rain += (g.rain - WX.rain) * k; WX.snow += (g.snow - WX.snow) * k; WX.cloud += (g.cloud - WX.cloud) * k; WX.fog += (g.fog - WX.fog) * k;
      WX.wet = clamp(WX.wet + (WX.rain > .2 ? dt / 25 : -dt / 120), 0, 1);
      WX.snowAcc = clamp(WX.snowAcc + (WX.snow > .3 ? dt / 45 : -dt / 150), 0, 1);
      WX.wind = 1 + Math.sin(tt * .13) * .5 + WX.rain * 1.5;
      if (WX.type == 'storm') {
        WX.nextFlash -= dt;
        if (WX.nextFlash <= 0) { WX.flash = 1; WX.nextFlash = R2(9, 32); setTimeout(function () { SND.thunder(); }, R2(500, 2200)); }
      }
      WX.flash = Math.max(0, WX.flash - dt * 3.2);
      if (tt - lastEnv < .08) return; lastEnv = tt;

      var h = TM.h; skyAt(h);
      var dayF = ENV.dayF = sstep(6.8, 8.8, h) * (1 - sstep(18.4, 20.4, h));
      var gray = clamp(WX.cloud * .45 + WX.rain * .3 + WX.fog * .45 + WX.snow * .2, 0, .85);
      tmpC.copy(GRAYD).lerp(GRAYN, 1 - dayF);
      zen.lerp(tmpC, gray * .85); hor.lerp(tmpC, gray * .75 + WX.fog * .15);
      if (WX.flash > 0) { zen.lerp(C(0xdde6ff), WX.flash * .6); hor.lerp(C(0xdde6ff), WX.flash * .5); }
      var u = domeMat.uniforms; u.top.value.copy(zen); u.hor.value.copy(hor);
      ENV.lampF = clamp(sstep(17.2, 19.6, h) + (1 - dayF) * .0 + (WX.rain + WX.fog) * .35 * dayF, 0, 1);
      ENV.winF = clamp(Math.max(sstep(17.6, 19.8, h), (WX.rain + WX.fog + WX.snow * .5) * .45), 0, 1);
      ENV.starF = sstep(20.2, 21.6, h) * (1 - WX.cloud) * (1 - WX.fog);

      // солнце и луна
      var us = clamp((h - 6.5) / 13.3, 0, 1) * PI, um = clamp((h - 18.6) / 12, 0, 1) * PI, Rr = 450;
      sunDir.set(-Math.cos(us) * .9, Math.sin(us) * .55, .75).normalize();
      sunGlow.position.copy(sunDir).multiplyScalar(Rr); sunCore.position.copy(sunDir).multiplyScalar(Rr);
      var sunUp = sstep(6.5, 7.6, h) * (1 - sstep(19.4, 20.4, h)), sunVis = sunUp * (1 - WX.cloud * .9) * (1 - WX.fog * .7);
      sunGlow.material.opacity = sunVis * .8; sunCore.material.opacity = sunVis;
      var low = 1 - clamp(sunDir.y / .35, 0, 1); sunGlow.material.color.setRGB(1, lerp(.95, .55, low), lerp(.8, .3, low));
      u.sunDir.value.copy(sunDir); u.sunCol.value.setRGB(1, lerp(.85, .5, low), lerp(.6, .25, low)); u.glow.value = sunUp * (1 - WX.cloud * .8);
      var mv = new THREE.Vector3(-Math.cos(um) * .9, Math.sin(um) * .55, .75).normalize();
      moon.position.copy(mv).multiplyScalar(Rr); moonMat.opacity = sstep(18.8, 20.4, h) * (1 - WX.cloud * .85) * (1 - WX.fog * .8);
      if (TM.live && moonDay != G.day) { moonDay = G.day; drawMoon(G.day); }
      stars.material.opacity = ENV.starF;
      sunL.position.copy(dayF > .35 ? sunDir : mv).multiplyScalar(60);
      sunL.color.setRGB(1, lerp(.96, .72, low), lerp(.88, .5, low)); if (dayF < .35) sunL.color.setRGB(.55, .65, 1);
      sunL.intensity = (.85 * dayF * (1 - WX.cloud * .7) + .16 * (1 - dayF) * (1 - WX.cloud * .5)) + WX.flash * 2.2;

      // облака
      var cOp = clamp(.12 + WX.cloud * .8, 0, .95), cc = tmpC.setRGB(1, 1, 1).lerp(C(0x6b7384), WX.rain * .7 + WX.cloud * .15).lerp(C(0xf0b090), (1 - dayF) * dayF * 1.4).multiplyScalar(lerp(.12, 1, dayF));
      clouds.forEach(function (c, i) { c.material.opacity = cOp * (i % 3 == 0 ? .7 : 1); c.material.color.copy(cc); c.position.x += c.userData.sp * dt * 4 * WX.wind; if (c.position.x > 460) c.position.x = -460; });

      // туман, фон
      var f = scene.fog; if (f) { f.color.copy(hor); f.near = 30 - 18 * WX.fog - 10 * WX.rain - 8 * WX.snow; f.far = 190 - 120 * WX.fog - 60 * WX.rain - 70 * WX.snow; }
      if (scene.background && scene.background.copy) scene.background.copy(hor).multiplyScalar(.5);

      // цвет уличных материалов
      var nt = 1 - dayF, sunset = Math.max(0, 1 - Math.abs(h - 18.7) / 1.6) * dayF * 1.2 + Math.max(0, 1 - Math.abs(h - 7.4) / 1) * .5;
      tint.setRGB(lerp(1, .5, nt) * lerp(1, 1, sunset), lerp(1, .62, nt) * lerp(1, .82, sunset), lerp(1, .95, nt) * lerp(1, .68, sunset));
      var bri = (.3 + .7 * dayF) * (1 - WX.cloud * .18 - WX.rain * .12) + WX.flash * .6; ENV.bri = bri; tint.multiplyScalar(bri);
      OUT.forEach(function (o) { o.m.color.copy(o.base).multiply(tint); });
      winMats.forEach(function (m) { m.emissiveIntensity = ENV.winF * 1.15; });
      shopMats.forEach(function (m) { m.emissiveIntensity = Math.max(.15, ENV.winF * 1.2); });
      lampHeadMat.emissiveIntensity = .1 + 2 * ENV.lampF; lampGlowMat.opacity = ENV.lampF * .85;
      headMat.emissiveIntensity = .2 + 1.8 * ENV.lampF; tailMat.emissiveIntensity = .3 + .9 * ENV.lampF;
      carGlow.opacity = ENV.lampF * .8; carHalo.opacity = ENV.lampF * .5 + (WX.fog > .3 ? .15 : 0); carCore.opacity = ENV.lampF * .95; carStreak.opacity = ENV.lampF * .38; tailGlow.opacity = ENV.lampF * .55; beamMat.opacity = ENV.lampF * .7 + (WX.fog > .3 ? .15 : 0);
      if (roadMat) { roadMat.roughness = lerp(.92, .3, WX.wet); roadMat.metalness = lerp(0, .25, WX.wet); }
      if (snowMat) snowMat.opacity = WX.snowAcc * .78 * (.35 + .65 * (dayF + .2));
      updPatches();
    }

    /* ---------- главный цикл ---------- */
    var last = performance.now(), ready3 = false;
    function loop(now) {
      requestAnimationFrame(loop);
      var dt = Math.min(.1, (now - last) / 1000); last = now;
      var paused = false; try { paused = !!PZ; } catch (e) { }
      if (paused) { if (hushG) { hushG.gain.value = 0; rainG.gain.value = 0; } return; }
      var tt = now / 1000;
      try {
        timeNow(); updEnv(dt, tt); updCars(dt); updPeds(dt, tt); updRain(dt); updSnow(dt, tt);
        trees.forEach(function (t, i) { t.rotation.z = Math.sin(tt * .7 + i) * .012 * (1 + WX.wind); });
        if (AC && rainG) {
          var vol = (sOn() && mode != 'menu') ? 1 : 0, o = 0; try { o = doorA > .3 ? 1.6 : 1; } catch (e) { o = 1; }
          rainG.gain.setTargetAtTime(WX.rain * .03 * vol * o, AC.currentTime, .4); hushG.gain.setTargetAtTime(.012 * vol * (cars.length > 2 ? 1 : .6) * o, AC.currentTime, .6);
        }
        W3.beat && W3.beat(dt, tt);
      } catch (e) { if (!loop.err) { loop.err = 1; console.error('[world] loop', e); } }
    }

    /* ---------- запуск ---------- */
    try {
      buildStreet(); buildParked();
      cam.far = 700; cam.updateProjectionMatrix();
      if (scene.fog) { scene.fog.near = 30; scene.fog.far = 190; }
      rollWeather(); setWeather('clear'); WX.rain = 0; WX.cloud = .1;
      for (var pi = 0; pi < 3; pi++) spawnPed(true);
      for (pi = 0; pi < 3; pi++) spawnPed(false);
      PEDS.forEach(function (p) { p.g.position.x = R2(-50, 50); });
      LANES.forEach(function (ln) { spawnCar(ln); cars[cars.length - 1].g.position.x = ln.dir * R2(-70, 30); });
      requestAnimationFrame(loop);
    } catch (e) { console.error('[world] init', e); }
  }

  var tries = 0, iv = setInterval(function () {
    if (ready()) { clearInterval(iv); setTimeout(go, 60); }
    else if (++tries > 400) clearInterval(iv);
  }, 50);
})();
