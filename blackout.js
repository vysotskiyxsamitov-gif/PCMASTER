/* PC МАСТЕР — blackout.js: «Выбило пробки».
   В магазине может внезапно пропасть свет:
     1) гаснет свет, компьютер не работает, клиенты не заходят, у героя включается фонарик на телефоне;
     2) звонит Макс: «иди к щитку на улице»;
     3) герой выходит на улицу — щиток на стене здания (слева от входа) заперт на замок;
     4) Макс говорит, что ключ где-то в магазине; ключ блестит в темноте — его нужно найти;
     5) с ключом открываем щиток и поднимаем рубильник — свет возвращается.
   Если день закончится, а свет так и не включили, электрики чинят сами за $60.

   Подключать ПОСЛЕ всех остальных модулей:  <script src="blackout.js"></script>  (после chars2.js)
   Управление:  F — фонарик вкл/выкл (пока темно),  E — действие.
   Для проверки без ожидания: Ctrl+Shift+B (или __blackout.start() в консоли). */
(function () {
  if (window.__blackoutLoaded) return;
  window.__blackoutLoaded = 1;

  function ready() {
    try {
      return typeof THREE !== 'undefined' && !!scene && !!cam && !!R && !!window.__W && !!window.__W.ST &&
        !!window.__roomLoaded && !!window.__windowsLoaded && !!window.__pcvisLoaded &&
        typeof incomingCall === 'function' && typeof bx === 'function' && typeof lp === 'function' &&
        typeof blocked === 'function' && typeof nearDoor === 'function' && typeof next === 'function' &&
        typeof openTerm === 'function' && typeof qText === 'function' && typeof hint === 'function';
    } catch (e) { return false; }
  }

  function go() {
    var PI = Math.PI;
    var W3 = window.__W;
    var BO = { lv: 0, fk: null, fl: true, flash: null, key: null, t: 0 };

    /* ---------- где может лежать ключ ---------- */
    var SP = [
      { x: .95, y: 1.74, z: 2.45, t: 'на кассовой стойке' },
      { x: -6.6, y: .99, z: 6.65, t: 'на диване в зоне ожидания' },
      { x: 6.3, y: 1.07, z: -3.0, t: 'на стуле у правой стены' },
      { x: -2.6, y: 1.67, z: -4.0, t: 'на верстаке' },
      { x: 4.8, y: 1.23, z: 6.4, t: 'на столе с мониторами у входа' },
      { x: 8.4, y: .06, z: 4.7, t: 'на полу у кулера с водой' }
    ];

    /* щиток на стене соседнего здания слева от входа (на простенке между окнами) */
    var NZ = 8.15, PX = -13.06, PY = 2.7;

    /* ---------- состояние (хранится в сохранении: G.ev.bo) ---------- */
    /* st: 0 — свет есть; 1 — погас, ждём звонка Макса; 2 — иди к щитку; 3 — щиток заперт, ищи ключ;
           4 — ключ у тебя; 5 — замок открыт, нужно поднять рубильник */
    function bo() { try { return (G && G.ev && G.ev.bo) || null; } catch (e) { return null; } }
    function st() { var b = bo(); return b ? (b.st | 0) : 0; }
    function isDark() { try { return st() > 0 && !!G && !G.sb; } catch (e) { return false; } }
    function inGame() { try { return !!G && (mode == 'play' || mode == 'term' || mode == 'talk' || mode == 'mg' || mode == 'call'); } catch (e) { return false; } }
    function allowOut() { try { return (isDark() && inGame()) || P.z > 7.2; } catch (e) { return false; } }
    function safe(f) { try { return f(); } catch (e) { console.error('[blackout]', e); } }

    /* ---------- общие помощники ---------- */
    function interp(pts, t) {
      for (var i = 1; i < pts.length; i++) {
        if (t <= pts[i][0]) { var a = pts[i - 1], b = pts[i], u = (t - a[0]) / ((b[0] - a[0]) || 1); return a[1] + (b[1] - a[1]) * u; }
      }
      return pts[pts.length - 1][1];
    }
    var FK_OFF = [[0, 0], [.1, .85], [.22, .05], [.45, .95], [.6, .25], [.9, 1], [1.1, .55], [1.5, 1]];
    var FK_ON = [[0, 1], [.18, .5], [.36, 1], [.55, .15], [.8, .75], [1.0, .1], [1.2, .4], [1.5, 0]];

    var glowTex = (function () {
      var c = document.createElement('canvas'); c.width = c.height = 64;
      var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.3, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, 64, 64);
      var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
    })();

    /* =====================================================================
       1. СВЕТ: все лампы магазина слушаются общего коэффициента BO.lv (0 — свет есть, 1 — полная темнота)
       ===================================================================== */
    function fac(l) {
      var k = BO.lv;
      if (l.isHemisphereLight) return 1 - .84 * k;      // немного рассеянного света остаётся
      if (l.isDirectionalLight) return 1 - .72 * k;     // свет с улицы через окна
      return 1 - k;                                     // потолочные, неоновые и прочие лампы — полностью
    }
    function wrapLight(l) {
      if (l.__bo || l.__bof) return;
      l.__bo = 1;
      var base = l.intensity;
      Object.defineProperty(l, 'intensity', {
        configurable: true, enumerable: true,
        get: function () { return base * fac(l); },
        set: function (v) { base = v; }
      });
    }
    function sweepLights() { scene.traverse(function (o) { if (o.isLight) wrapLight(o); }); }
    sweepLights(); setInterval(function () { safe(sweepLights); }, 1500);

    /* отражения (карта окружения): в темноте — тёмная, того же формата, чтобы шейдеры не перекомпилировались */
    var darkEnv = null, envBase = scene.environment;
    try {
      var es = new THREE.Scene();
      es.add(new THREE.Mesh(new THREE.SphereGeometry(10, 24, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, color: 0x04060b })));
      var wn = new THREE.Mesh(new THREE.PlaneGeometry(8, 3), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x9ab4e0).multiplyScalar(.7), side: THREE.DoubleSide }));
      wn.position.set(0, 3, 7.9); es.add(wn);
      var pm = new THREE.PMREMGenerator(R); darkEnv = pm.fromScene(es, .04).texture; pm.dispose();
    } catch (e) { darkEnv = null; }
    Object.defineProperty(scene, 'environment', {
      configurable: true, enumerable: true,
      get: function () { return (BO.lv > .5 && darkEnv) ? darkEnv : envBase; },
      set: function (v) { envBase = v; }
    });

    /* самосветящиеся материалы внутри магазина (вывески, экраны, неон, плафоны) гасим на время блэкаута */
    var dimList = [], tmpV = new THREE.Vector3();
    function inShop(o) {
      o.getWorldPosition(tmpV);
      return Math.abs(tmpV.x) < 10.3 && tmpV.z > -8.3 && tmpV.z < 8.05 && tmpV.y > -.1 && tmpV.y < 10.5;
    }
    function collectDim() {
      restoreDim(); dimList = [];
      var seen = new Set();
      (function walk(o) {
        if (o === cam || o === W3.ST || (o.userData && o.userData.noBO)) return;
        var m = o.material;
        if (m && (o.isMesh || o.isSprite) && inShop(o)) {
          (Array.isArray(m) ? m : [m]).forEach(function (mt) {
            if (!mt || seen.has(mt)) return;
            if (mt.isMeshBasicMaterial || mt.isSpriteMaterial) { seen.add(mt); dimList.push({ m: mt, c: mt.color.clone() }); }
            else if (mt.isMeshStandardMaterial && mt.emissiveIntensity > 0 && (mt.emissive.r + mt.emissive.g + mt.emissive.b) > 0) { seen.add(mt); dimList.push({ m: mt, e: mt.emissiveIntensity }); }
          });
        }
        for (var i = 0; i < o.children.length; i++) walk(o.children[i]);
      })(scene);
    }
    function applyDim() {
      var f = 1 - .94 * BO.lv, e = 1 - BO.lv;
      for (var i = 0; i < dimList.length; i++) {
        var d = dimList[i];
        if (d.c) d.m.color.copy(d.c).multiplyScalar(f); else d.m.emissiveIntensity = d.e * e;
      }
    }
    function restoreDim() {
      for (var i = 0; i < dimList.length; i++) {
        var d = dimList[i];
        if (d.c) d.m.color.copy(d.c); else d.m.emissiveIntensity = d.e;
      }
      dimList = [];
    }

    /* фонарик на телефоне: создаём заранее с нулевой яркостью, чтобы число ламп не менялось посреди игры */
    var fl = new THREE.SpotLight(0xfff1d6, 0, 26, .62, .65, 1.1);
    fl.__bof = 1; fl.position.set(.12, -.12, 0); fl.target.position.set(.12, -.2, -6);
    cam.add(fl); cam.add(fl.target);

    /* =====================================================================
       2. ЩИТОК НА УЛИЦЕ
       ===================================================================== */
    var PN = { g: null, door: null, lever: null, pad: null, led: null, open: 0, lev: 1, padVy: 0, padY: 0, padFell: false };
    function buildPanel() {
      var g = new THREE.Group(); g.position.set(PX, PY, NZ); g.userData.noBO = 1; scene.add(g); PN.g = g;
      function M(c) { return new THREE.MeshStandardMaterial({ color: c, roughness: .5, metalness: .55 }); }
      function B(p, w, h, d, c, x, y, z) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c == 'object' ? c : M(c)); m.position.set(x, y, z); p.add(m); return m; }
      B(g, .98, 1.42, .05, 0x2b2f38, 0, 0, .025);                                       // монтажная плита
      B(g, .86, 1.26, .03, 0x14171d, 0, 0, .07);                                       // задняя стенка шкафа
      B(g, .9, .05, .24, 0x69707d, 0, .65, .17); B(g, .9, .05, .24, 0x69707d, 0, -.65, .17);
      B(g, .05, 1.3, .24, 0x69707d, -.425, 0, .17); B(g, .05, 1.3, .24, 0x69707d, .425, 0, .17);
      [-.27, -.09, .09, .27].forEach(function (x) { B(g, .14, .28, .1, 0x3a4150, x, .3, .13); B(g, .05, .09, .06, 0x22c55e, x, .35, .19); });
      lp(g, 'ОСВЕЩ.', .64, .08, 0, .12, .115, '#e5e7eb', '#111827', 0);
      B(g, .5, .4, .08, 0x1f232b, 0, -.28, .12);                                       // колодка рубильника
      var lv = new THREE.Group(); lv.position.set(0, -.28, .17); g.add(lv); PN.lever = lv;
      B(lv, .07, .17, .07, 0xef4444, 0, .085, 0); B(lv, .13, .06, .1, 0xb91c1c, 0, .19, 0);
      lp(g, 'ГЛАВНЫЙ АВТОМАТ', .74, .09, 0, -.53, .1, '#fff', '#7f1d1d', 0);
      var led = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), new THREE.MeshBasicMaterial({ color: 0xef4444 })); led.position.set(-.36, .52, .2); g.add(led); PN.led = led;
      // лампочка над щитком, чтобы он был виден вечером
      B(g, .34, .07, .2, 0x2b2f38, 0, .95, .13);
      var bulb = new THREE.Mesh(new THREE.BoxGeometry(.26, .03, .14), new THREE.MeshBasicMaterial({ color: 0xfff0c0 })); bulb.position.set(0, .905, .13); g.add(bulb);
      // дверца на петлях слева
      var door = new THREE.Group(); door.position.set(-.45, 0, .29); g.add(door); PN.door = door;
      B(door, .9, 1.3, .04, 0x7b8494, .45, 0, 0); B(door, .78, 1.18, .012, 0x6a7282, .45, 0, .026);
      lp(door, 'ОПАСНО · 380 В', .64, .13, .45, .43, .04, '#111', '#facc15', 0);
      lp(door, 'ЭЛЕКТРОЩИТ', .6, .1, .45, .22, .04, '#e5e7eb', '#1f2937', 0);
      B(door, .1, .2, .05, 0x2a2f3a, .8, 0, .04);                                      // ручка
      var pad = new THREE.Group(); pad.position.set(.8, -.17, .07); door.add(pad); PN.pad = pad;
      var brass = new THREE.MeshStandardMaterial({ color: 0xd4a73c, roughness: .35, metalness: .85 });
      B(pad, .13, .1, .05, brass, 0, 0, 0);
      var sh = new THREE.Mesh(new THREE.TorusGeometry(.04, .013, 8, 14, PI), brass); sh.position.set(0, .05, 0); pad.add(sh);
      // невидимая зона для нажатия
      var hit = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.55, .7), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      hit.position.set(0, 0, .35); hit.userData.act = panelAct; g.add(hit);
    }

    function unlocked() { var b = bo(); return !!b && (b.st >= 5 || b.open == 1); }
    function updPanel(dt, tt) {
      if (!PN.g) return;
      var un = unlocked(), b = bo();
      // навесной замок: при открытии падает вниз
      if (un) {
        if (PN.pad.visible && !PN.padFell) { PN.padFell = true; PN.padVy = 0; PN.padY = 0; }
        if (PN.padFell && PN.pad.visible) {
          PN.padVy -= 6 * dt; PN.padY += PN.padVy * dt; PN.pad.position.y = -.17 + PN.padY; PN.pad.rotation.z += dt * 5;
          if (PN.padY < -2.2) PN.pad.visible = false;
        }
      } else { PN.padFell = false; PN.pad.visible = true; PN.pad.position.set(.8, -.17, .07); PN.pad.rotation.set(0, 0, 0); }
      var dT = un ? 1 : 0; PN.open += (dT - PN.open) * Math.min(1, dt * 4);
      PN.door.rotation.y = -PN.open * 1.85;
      var lT = (!b || b.st == 0) ? 1 : 0; PN.lev += (lT - PN.lev) * Math.min(1, dt * 7);
      PN.lever.rotation.z = (1 - PN.lev) * PI;
      PN.led.visible = !(b && b.st > 0) ? false : (Math.sin(tt * 6) > 0);
    }

    /* =====================================================================
       3. КЛЮЧ
       ===================================================================== */
    function mkKey(sp) {
      var g = new THREE.Group(); g.position.set(sp.x, sp.y, sp.z); g.rotation.y = Math.random() * PI; g.userData.noBO = 1;
      var gold = new THREE.MeshStandardMaterial({ color: 0xf2c23a, roughness: .3, metalness: .85, emissive: 0x7a5508, emissiveIntensity: .7 });
      var ring = new THREE.Mesh(new THREE.TorusGeometry(.09, .03, 8, 18), gold); ring.rotation.x = PI / 2; ring.position.x = -.16; g.add(ring);
      var shaft = new THREE.Mesh(new THREE.BoxGeometry(.34, .04, .04), gold); shaft.position.x = .06; g.add(shaft);
      [.17, .1].forEach(function (x) { var t = new THREE.Mesh(new THREE.BoxGeometry(.04, .05, .04), gold); t.position.set(x, 0, .045); g.add(t); });
      var gs = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffd77a, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false }));
      gs.scale.set(1, 1, 1); gs.position.y = .1; g.add(gs); g.userData.glow = gs;
      var hit = new THREE.Mesh(new THREE.SphereGeometry(.55, 8, 6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      hit.userData.act = pickKey; g.add(hit);
      scene.add(g); return g;
    }
    function dropKey() { if (BO.key) { scene.remove(BO.key); BO.key = null; } }

    /* =====================================================================
       4. ХОД СЦЕНЫ
       ===================================================================== */
    var Q = [];                                    // отложенные действия: { t, fn }
    function later(ms, fn) { Q.push({ t: performance.now() + ms, fn: fn }); }
    function refresh() { safe(function () { hud(); }); safe(function () { hint(); }); }
    function lite() { return mode == 'play' && !CALL && !PZ; }

    var L1 = [
      ['M', 'Алё, это Макс. У тебя там свет пропал? Видимо, выбило пробки.'],
      ['Y', 'Да, всё погасло. Компьютер не включается.'],
      ['M', 'Не паникуй. Иди к щитку на улице — он на стене здания, слева от входа.'],
      ['M', 'Поднимешь рубильник — и свет вернётся. Фонарик на телефоне включи, там темно.']
    ];
    var L1b = [
      ['M', 'Опять пробки выбило? Знаешь, что делать: иди к щитку на улице, слева от входа.']
    ];
    var L2 = [
      ['M', 'Ну что, дошёл до щитка? Что там?'],
      ['Y', 'Он заперт на замок!'],
      ['M', 'Точно, его же всегда запирают… Ключ должен быть где-то в помещении магазина.'],
      ['M', 'Поищи как следует — на столах, у кассы, на диване. Найдёшь — сразу неси к щитку.']
    ];
    var L2b = [
      ['M', 'Опять заперто? Ключ где-то в магазине, поищи — он должен блестеть.']
    ];

    function start() {
      if (!G || G.sb || mode != 'play' || CALL || isDark()) return false;
      G.ev = G.ev || {};
      var n = (G.ev.bo && G.ev.bo.n) || 0;
      G.ev.bo = { st: 1, n: n, key: Math.floor(Math.random() * SP.length), c2: 0, open: 0, hint: 0 };
      collectDim();
      BO.fk = { t: 0, k: 'off' };
      BO.fl = true;
      try { sfx('boom'); } catch (e) { }
      toast('Бах! Выбило пробки — в магазине погас свет.');
      refresh();
      try { save(); } catch (e) { }
      later(4500, call1);
      return true;
    }

    function call1() {
      var b = bo();
      if (!b || b.st != 1 || BO.calling) return;
      if (!lite()) { later(1200, call1); return; }
      BO.calling = true;
      incomingCall('M', b.n ? L1b : L1, function () {
        BO.calling = false;
        var bb = bo();
        if (bb && bb.st == 1) {
          bb.st = 2;
          try { save(); } catch (e) { }
          toast('Выйди на улицу: щиток на стене здания, слева от входа. F — фонарик.');
          refresh();
        }
      });
    }

    function discover() {
      var b = bo();
      if (!b || b.st != 2) return;
      b.st = 3;
      try { save(); } catch (e) { }
      try { sfx('error'); } catch (e) { }
      toast('Щиток заперт на навесной замок.');
      refresh();
      later(1500, call2);
    }

    function call2() {
      var b = bo();
      if (!b || b.st != 3 || b.c2 || BO.calling) return;
      if (!lite()) { later(1200, call2); return; }
      BO.calling = true;
      incomingCall('M', b.n ? L2b : L2, function () {
        BO.calling = false;
        var bb = bo();
        if (bb && bb.st == 3) {
          bb.c2 = 1; bb.t3 = Date.now();
          try { save(); } catch (e) { }
          toast('Ключ где-то в магазине. Ищи блик в темноте.');
          refresh();
        }
      });
    }

    function pickKey() {
      var b = bo();
      if (mode != 'play' || !b || b.st != 3 || !b.c2) return;
      b.st = 4;
      dropKey();
      try { sfx('take'); } catch (e) { }
      toast('Нашёл ключ! Неси его к щитку на улице.');
      try { save(); } catch (e) { }
      refresh();
    }

    function panelAct() {
      if (mode != 'play') return;
      var b = bo(), s = st();
      if (P.z < 8.3) { toast('Щиток снаружи — выйди на улицу.'); return; }
      if (!b || !isDark()) { toast('Электрощиток. Автоматы включены, всё в порядке.'); return; }
      if (s == 1 || s == 2) { b.st = 2; discover(); return; }
      if (s == 3) { try { sfx('error'); } catch (e) { } toast('Замок не открыть. Ключ где-то в магазине — поищи.'); return; }
      if (s == 4) {
        b.st = 5;
        try { sfx('panel'); } catch (e) { }
        toast('Ключ подошёл — замок открыт! Теперь поднимай рубильник.');
        try { save(); } catch (e) { }
        refresh(); return;
      }
      if (s == 5) flip();
    }

    function flip() {
      var b = bo();
      if (!b) return;
      b.st = 0; b.open = 1; b.n = (b.n || 0) + 1;
      BO.fk = { t: 0, k: 'on' };
      try { sfx('power'); } catch (e) { }
      toast('Свет включился! Магазин снова работает.');
      try { save(); } catch (e) { }
      refresh();
    }

    /* ---------- запрет на технику в темноте ---------- */
    var _ot = openTerm;
    openTerm = function () {
      if (isDark() && !G.sb) { try { sfx('error'); } catch (e) { } toast('Нет света — компьютер не работает. Сначала почини щиток.'); return; }
      return _ot.apply(this, arguments);
    };
    var _sp0 = spawn;
    spawn = function () {
      if (isDark()) { try { spT = 8; } catch (e) { } return; }
      return _sp0.apply(this, arguments);
    };

    /* ---------- выход на улицу ---------- */
    var _bl = blocked;
    blocked = function (x, z) {
      if (!allowOut() || z <= 7) return _bl(x, z);
      if (z < 8.5) return Math.abs(x) > 1.35;           // проход через дверь
      return z > 12.6 || Math.abs(x) > 19;              // тротуар перед магазином
    };
    var _nd = nearDoor;
    nearDoor = function () {
      try { if (allowOut() && Math.abs(P.x) < 2.8 && P.z > 5.3 && P.z < 11.5) return true; } catch (e) { }
      return _nd();
    };

    /* ---------- конец дня в темноте ---------- */
    var _next = next;
    next = function () {
      var b = bo(), was = !!(b && b.st > 0);
      if (was) {
        b.st = 0; b.open = 1; b.n = (b.n || 0) + 1;
        try { G.m -= 60; } catch (e) { }
        BO.fk = { t: 0, k: 'on' };
        dropKey();
      }
      var r = _next.apply(this, arguments);
      if (was) setTimeout(function () { safe(function () { toast('Свет вернули электрики — вызов обошёлся в $60.'); }); }, 4400);
      safe(function () { if (P.z > 7.2) { P.set(0, 3.4, 6.2); VX = VZ = 0; } });
      return r;
    };

    /* ---------- подсказки на экране ---------- */
    function objText() {
      var s = st();
      return s == 1 ? 'Свет погас. Сейчас позвонит Макс — ответь [E]' :
        s == 2 ? 'Выйди на улицу к электрощитку — он на стене слева от входа' :
        s == 3 ? 'Щиток заперт. Найди ключ в магазине (ищи блик в темноте)' :
        s == 4 ? 'Ключ у тебя — неси его к щитку на улице' :
        s == 5 ? 'Замок открыт — нажми на рубильник в щитке' : '';
    }
    var _q = qText;
    qText = function () { return (isDark() && !G.sb) ? objText() : _q(); };
    var _h = hint;
    hint = function () {
      _h.apply(this, arguments);
      try {
        if (isDark() && mode == 'play') {
          var el = $('hint'); el.style.display = 'block';
          el.innerHTML = '<b>Нет света!</b><br>' + objText() + '<br><span class="mu">F — фонарик</span>';
        }
      } catch (e) { }
    };

    /* ---------- управление ---------- */
    addEventListener('keydown', function (e) {
      if (e.repeat) return;
      if (e.code == 'KeyF' && mode == 'play' && isDark()) { BO.fl = !BO.fl; toast(BO.fl ? 'Фонарик включён' : 'Фонарик выключен'); }
      else if (e.code == 'KeyB' && e.ctrlKey && e.shiftKey) { e.preventDefault(); start(); }
    });

    /* =====================================================================
       5. ГЛАВНЫЙ ЦИКЛ
       ===================================================================== */
    var sch = { day: -1, fire: false, t: 0 }, lastNow = performance.now(), slow = 0;

    function schedule(dt) {
      if (!G || G.sb || !G.tid || !lite()) return;
      var b = bo(); if (b && b.st) return;
      if (G.day < 2) { sch.day = -1; return; }
      if ([10, 20, 30].indexOf(G.day) >= 0) return;                    // в дни визитов Виктора света не трогаем
      if (sch.day !== G.day) {
        sch.day = G.day;
        var n = b ? (b.n | 0) : 0;
        sch.fire = n == 0 ? true : (G.day >= 4 && Math.random() < .22);   // первый раз — в первый же подходящий день, потом изредка
        sch.t = 80 + Math.random() * 220;
      }
      if (!sch.fire) return;
      if (G.dl < 150) { sch.fire = false; return; }
      sch.t -= dt;
      if (sch.t <= 0) { sch.fire = false; start(); }
    }

    function sync() {
      var b = bo(), s = st();
      var want = (inGame() && isDark()) ? 1 : 0;
      // ключ существует только когда щиток уже найден запертым и Макс сказал искать
      var need = !!(b && s == 3 && b.c2 && inGame());
      if (need && !BO.key) BO.key = mkKey(SP[b.key | 0] || SP[0]);
      if (!need && BO.key) dropKey();
      // недоставленные звонки (например, после загрузки сохранения)
      if (b && s == 1 && !BO.calling && !Q.length) later(2500, call1);
      if (b && s == 3 && !b.c2 && !BO.calling && !Q.length) later(2500, call2);
      // подсказка, если ключ долго не находят
      if (b && s == 3 && b.c2 && !b.hint && b.t3 && Date.now() - b.t3 > 100000 && lite()) {
        b.hint = 1;
        toast('Подсказка: ключ лежит ' + (SP[b.key | 0] || SP[0]).t + '.');
        try { save(); } catch (e) { }
      }
    }

    function loop(now) {
      requestAnimationFrame(loop);
      var dt = Math.min(.1, (now - lastNow) / 1000); lastNow = now;
      if (typeof PZ !== 'undefined' && PZ) return;
      BO.t += dt;
      safe(function () {
        // мерцание при выключении / включении света
        var want = (inGame() && isDark()) ? 1 : 0;
        if (want && !dimList.length && BO.lv < .02 && !BO.fk) collectDim();   // например, после загрузки сохранения в темноте
        if (BO.fk) {
          BO.fk.t += dt;
          var pts = BO.fk.k == 'off' ? FK_OFF : FK_ON;
          BO.lv = interp(pts, BO.fk.t);
          if (BO.fk.t >= pts[pts.length - 1][0]) { BO.lv = BO.fk.k == 'off' ? 1 : 0; BO.fk = null; }
        } else if (Math.abs(BO.lv - want) > .001) {
          BO.lv += (want - BO.lv) * Math.min(1, dt * 7);
          if (Math.abs(BO.lv - want) < .004) BO.lv = want;
        }
        if (BO.lv > 0 || dimList.length) {
          applyDim();
          if (BO.lv == 0 && !BO.fk && dimList.length) restoreDim();
        }
        // фонарик
        var fw = (BO.fl && BO.lv > .4) ? 2.8 * Math.min(1, (BO.lv - .4) / .4) : 0;
        fl.intensity += (fw - fl.intensity) * Math.min(1, dt * 10);
        // блик ключа
        if (BO.key) { var g = BO.key.userData.glow; g.material.opacity = .5 + .35 * Math.sin(BO.t * 3.2); var sc = .9 + .25 * Math.sin(BO.t * 3.2); g.scale.set(sc, sc, 1); BO.key.rotation.y += dt * .6; }
        updPanel(dt, BO.t);
        // отложенные действия
        if (Q.length && lite() && performance.now() >= Q[0].t) { var it = Q.shift(); it.fn(); }
      });
    }

    setInterval(function () {
      safe(function () {
        slow++;
        sync();
        // дошли до запертого щитка — Макс звонит сам
        if (st() == 2 && lite() && P.z > 8.3 && Math.hypot(P.x - PX, P.z - (NZ + .6)) < 4.2) discover();
        schedule(1);
      });
    }, 1000);

    /* ---------- запуск ---------- */
    buildPanel();
    requestAnimationFrame(loop);
    window.__blackout = { start: start, state: function () { return bo(); }, flip: flip, BO: BO, panel: PN };
    console.log('[blackout] готово');
  }

  var n = 0, iv = setInterval(function () {
    if (ready()) { clearInterval(iv); setTimeout(function () { try { go(); } catch (e) { console.error('[blackout] init', e); } }, 3200); }
    else if (++n > 600) clearInterval(iv);
  }, 100);
})();
