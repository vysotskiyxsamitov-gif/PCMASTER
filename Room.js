/* PC МАСТЕР — room.js: реалистичная планировка, мягкий свет и новые низкие широкие стеллажи.
   Подключать ПОСЛЕ основного скрипта игры (после street.js):  <script src="room.js"></script>  перед </body>. */
(function () {
  if (window.__roomLoaded) return;
  window.__roomLoaded = 1;

  function ready() {
    try { return typeof THREE !== 'undefined' && !!scene && !!shF && !!R && typeof bx === 'function' && typeof shelf === 'function' && !!SEC && !!BOXD && typeof boxTex === 'function'; } catch (e) { return false; }
  }

  function go() {
    var PI = Math.PI;
    var rr0 = 5; function rnd01() { rr0 = (rr0 * 9301 + 49297) % 233280; return rr0 / 233280; }

    /* ---------- находим старую «коробку» комнаты ---------- */
    var floor = null, ceil = null, walls = [];
    scene.children.forEach(function (o) {
      var g = o.geometry; if (!g || g.type != 'PlaneGeometry') return;
      var p = g.parameters;
      if (p.width == 20 && p.height == 16) { if (o.position.y < 1) floor = o; else ceil = o; }
      else if (p.height == 10 || (p.width == 3 && p.height == 4.8)) walls.push({ o: o, w: p.width, h: p.height });
      else if (p.width == 8 && p.height == 2) o.position.y = 6.1;               // вывеска PC SHOP ниже потолка
    });
    scene.children.forEach(function (o) {
      if (o.isSprite && Math.abs(o.position.y - 7) < .01 && Math.abs(o.position.z + 7.6) < .05) o.position.y = 6.1;
    });

    /* ---------- пол: тёплый паркет ---------- */
    if (floor) {
      var ft = ct(512, 512, function (x, W, H) {
        var rows = 8, ph = H / rows;
        x.fillStyle = '#2b1d12'; x.fillRect(0, 0, W, H);
        for (var r = 0; r < rows; r++) {
          var off = (r % 2) * 128;
          for (var c = -1; c < 3; c++) {
            var xx = c * 256 + off, l = 34 + rnd01() * 12;
            x.fillStyle = 'hsl(' + (24 + rnd01() * 6) + ',' + (38 + rnd01() * 12) + '%,' + l + '%)';
            x.fillRect(xx + 1, r * ph + 1, 254, ph - 2);
            for (var g = 0; g < 16; g++) {
              x.strokeStyle = 'rgba(40,22,10,' + (rnd01() * .22) + ')'; x.lineWidth = 1;
              var gy = r * ph + rnd01() * ph; x.beginPath(); x.moveTo(xx, gy); x.lineTo(xx + 256, gy + (rnd01() - .5) * 5); x.stroke();
            }
          }
        }
      }, 5, 4);
      floor.material.map = ft; floor.material.color.setHex(0xffffff);
      floor.material.roughness = .38; floor.material.metalness = .04; floor.material.envMapIntensity = 1.1; floor.material.needsUpdate = true;
    }

    /* ---------- стены: светлая покраска, панели, плинтус, молдинг ---------- */
    var wallBase = ct(256, 640, function (x, W, H) {
      x.fillStyle = '#7f8fb3'; x.fillRect(0, 0, W, H); noise(x, W, H, 900, .05);
      var wy = 640 - 3.2 * 64;
      x.fillStyle = '#232a3a'; x.fillRect(0, wy, W, H - wy);
      for (var i = 0; i < 4; i++) { x.strokeStyle = 'rgba(255,255,255,.13)'; x.lineWidth = 2; x.strokeRect(i * 64 + 8, wy + 22, 48, H - wy - 58); }
      x.fillStyle = '#6b4b2e'; x.fillRect(0, wy - 10, W, 12);
      x.fillStyle = '#22a5b8'; x.fillRect(0, wy - 36, W, 6);
      x.fillStyle = '#10131a'; x.fillRect(0, H - 26, W, 26);
      x.fillStyle = '#e7e2d8'; x.fillRect(0, 154, W, 12);
      x.fillStyle = 'rgba(0,0,0,.07)'; x.fillRect(0, 0, 2, H);
    }, 1, 1);
    walls.forEach(function (it) {
      var t = wallBase.clone(); t.needsUpdate = true;
      if (it.h == 10) t.repeat.set(it.w / 4, 1); else { t.repeat.set(it.w / 4, it.h / 10); t.offset.set(0, .52); }
      it.o.material.map = t; it.o.material.color.setHex(0xffffff); it.o.material.roughness = .88; it.o.material.needsUpdate = true;
    });

    /* ---------- подвесной потолок со светильниками ---------- */
    var ctex = ct(512, 512, function (x, W, H) {
      x.fillStyle = '#c9ccd8'; x.fillRect(0, 0, W, H); noise(x, W, H, 2600, .09);
      for (var i = 0; i < 900; i++) { var px = rnd01() * W, py = rnd01() * H, rr = .8 + rnd01() * 1.6; x.fillStyle = 'rgba(70,74,90,' + (.18 + rnd01() * .25) + ')'; x.beginPath(); x.arc(px, py, rr, 0, 6.283); x.fill(); }
      x.strokeStyle = 'rgba(80,84,100,.35)'; x.lineWidth = 1.5; x.strokeRect(14, 14, W - 28, H - 28);
      x.fillStyle = '#e9ebf2'; x.fillRect(0, 0, W, 9); x.fillRect(0, H - 9, W, 9); x.fillRect(0, 0, 9, H); x.fillRect(W - 9, 0, 9, H);
      x.fillStyle = 'rgba(60,64,80,.55)'; x.fillRect(0, 9, W, 2); x.fillRect(0, H - 11, W, 2); x.fillRect(9, 0, 2, H); x.fillRect(W - 11, 0, 2, H);
    }, 10, 8); ctex.offset.set(.5, .5);
    var cm = new THREE.Mesh(new THREE.PlaneGeometry(20, 16), new THREE.MeshBasicMaterial({ map: ctex, color: 0x9aa0b4 }));
    cm.rotation.x = PI / 2; cm.position.y = 7.8; scene.add(cm);
    setInterval(function () { try { var e = window.__W && window.__W.ENV; var d = e && typeof e.dayF == 'number' ? e.dayF : 1; var k = .42 + .58 * Math.max(0, Math.min(1, d)); cm.material.color.setRGB(.60 * k, .63 * k, .72 * k); } catch (er) { } }, 1000);
    var pm = new THREE.MeshBasicMaterial({ color: 0xe6d3b0 });
    [-6, -2, 2, 6].forEach(function (px) { [-4, 0, 4].forEach(function (pz) {
      var p = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), pm); p.rotation.x = PI / 2; p.position.set(px, 7.78, pz); scene.add(p);
    }); });
    [[-4, -4], [4, -4], [-4, 1], [4, 1], [-4, 5], [4, 5]].forEach(function (a) {
      var l = new THREE.PointLight(0xffe2b8, .7, 17); l.position.set(a[0], 7.2, a[1]); scene.add(l);
    });
    bx(scene, 20, .25, .2, 0xe7e2d8, 0, 7.7, -7.9, 0, .8, 0); bx(scene, 20, .25, .2, 0xe7e2d8, 0, 7.7, 7.9, 0, .8, 0);
    bx(scene, .2, .25, 16, 0xe7e2d8, -9.9, 7.7, 0, 0, .8, 0); bx(scene, .2, .25, 16, 0xe7e2d8, 9.9, 7.7, 0, 0, .8, 0);

    /* ---------- свет: мягче и теплее ---------- */
    scene.children.forEach(function (o) {
      if (o.isPointLight && o.position.y > 8.5) o.visible = false;
      if (o.isHemisphereLight) { o.intensity = .55; o.color.setHex(0xa9b8e0); o.groundColor.setHex(0x4a3a30); }
      if (o.isSpotLight) { o.intensity = 1.4; if (o.shadow) o.shadow.radius = 6; }
    });
    R.toneMappingExposure = .9;
    if (scene.fog) scene.fog.color.setHex(0x1b2030);
    if (scene.background && scene.background.setHex) scene.background.setHex(0x0c0f18);

    /* ---------- новые низкие широкие стеллажи (виден каждый товар) ---------- */
    var TY = [.8, 2.15, 3.5];
    // категория -> {tier, z0, z1}
    var SEC2 = [];
    SEC2[0] = { t: 0, z0: -7.2, z1: -1.7 };   // корпуса
    SEC2[1] = { t: 0, z0: -1.5, z1: 3.4 };    // материнки
    SEC2[6] = { t: 0, z0: 3.6, z1: 7.2 };     // блоки питания
    SEC2[2] = { t: 1, z0: -7.2, z1: -4.7 };   // процессоры
    SEC2[3] = { t: 1, z0: -4.5, z1: -.5 };    // кулеры
    SEC2[4] = { t: 1, z0: -.3, z1: 2.5 };     // память
    SEC2[5] = { t: 2, z0: -7.2, z1: .2 };     // видеокарты
    var XC = -9.55;

    while (shF.children.length) shF.remove(shF.children[0]);
    bx(shF, .08, 4.9, 14.7, 0x1a1e28, -9.96, 2.45, 0, 0, .7, .1);
    TY.forEach(function (y, i) {
      bx(shF, .8, .08, 14.6, 0x3a3f4c, XC, y, 0, 0, .4, .5);
      bx(shF, .84, .1, .05, 0x6ee7ff, XC, y, 7.33, 0x22d3ee);
      if (i > 0) bx(shF, .05, .03, 14.4, 0xfff2cc, -9.22, y - .07, 0, 0xfff2cc);
    });
    bx(shF, .8, .1, 14.6, 0x2a2f3a, XC, 4.75, 0, 0, .5, .4); bx(shF, .05, .03, 14.4, 0xfff2cc, -9.22, 4.68, 0, 0xfff2cc);
    bx(shF, .8, 4.8, .08, 0x2a2f3a, XC, 2.4, 7.34, 0, .5, .4); bx(shF, .8, 4.8, .08, 0x2a2f3a, XC, 2.4, -7.34, 0, .5, .4);
    var seen = {};
    SEC2.forEach(function (s, c) {
      if (!s) return;
      var y = TY[s.t], L = s.z1 - s.z0, zc = (s.z0 + s.z1) / 2;
      [s.z0 - .05, s.z1 + .05].forEach(function (z) { var k = s.t + '_' + z.toFixed(2); if (!seen[k]) { seen[k] = 1; bx(shF, .8, 1.25, .05, 0x2a2f3a, XC, y + .64, z, 0, .5, .4); } });
      lp(shF, SECN[c], Math.min(L - .2, 3.6), .3, -9.9, y + 1.1, zc, '#fff', CCOL[c], PI / 2);
      var h = new THREE.Mesh(new THREE.BoxGeometry(.9, 1.25, L), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      h.position.set(XC, y + .66, zc);
      (function (cc) { h.userData.act = function () { putSec(cc); }; })(c);
      h.userData.sec = 1; shF.add(h);
    });
    [[-9.0, 2.6, -5], [-9.0, 2.6, 0], [-9.0, 2.6, 5]].forEach(function (a) {
      var l = new THREE.PointLight(0xffe2b8, .4, 7); l.position.set(a[0], a[1], a[2]); scene.add(l);
    });

    // ящики-«обманки» для сцены избиения — на новых местах
    while (deco.children.length) deco.remove(deco.children[0]);
    SEC2.forEach(function (s, c) {
      if (!s) return; var bd = BOXD[c], w = bd[0], h = bd[1], dp = bd[2], per = Math.max(1, Math.floor((s.z1 - s.z0) / (w + .06)));
      for (var n = 0; n < Math.min(per, 8); n++) bx(deco, dp, h, w, CCH[c], -9.88 + dp / 2, TY[s.t] + .04 + h / 2, s.z0 + .1 + w / 2 + n * (w + .06), 0, .8, 0);
    });

    // переопределяем отрисовку товара на полках: один ряд лицом к игроку, стопки до 3 штук
    shelf = function () {
      while (shI.children.length) shI.remove(shI.children[0]);
      if (!G) return;
      var n = need(), cnt = [0, 0, 0, 0, 0, 0, 0];
      G.st.filter(function (x) { return !x.fl && !x.h && !x.pl; }).forEach(function (x) {
        var s = SEC2[x.c], k = cnt[x.c]++, bd = BOXD[x.c], w = bd[0], h = bd[1], dp = bd[2];
        var per = Math.max(1, Math.floor((s.z1 - s.z0) / (w + .06))), stk = Math.max(1, Math.floor(.95 / (h + .03))), lv = Math.floor(k / per), col = k % per;
        if (lv >= stk) return;
        var hl = x.c == n;
        var side = new THREE.MeshStandardMaterial({ map: sideTex(x), roughness: .7, metalness: .05 });
        var front = new THREE.MeshStandardMaterial({ map: boxTex(x), roughness: .35, metalness: .15, emissive: hl ? 0x22d3ee : 0, emissiveIntensity: hl ? .35 : 0 });
        var b = new THREE.Mesh(new THREE.BoxGeometry(dp, h, w), [front, side, side, side, side, side]);
        b.position.set(-9.88 + dp / 2, TY[s.t] + .04 + lv * (h + .03) + h / 2, s.z0 + .1 + w / 2 + col * (w + .06));
        b.castShadow = b.receiveShadow = true; b.userData.act = function () { take(x); }; shI.add(b);
      });
    };
    shelf();

    /* ---------- мебель и детали: реальная планировка ---------- */
    function grp(x, y, z, ry) { var g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry || 0; scene.add(g); return g; }
    function adTex(t1, t2, c1, c2) { return ct(256, 160, function (x, W, H) { var g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; x.fillRect(0, 0, W, H); x.fillStyle = '#fff'; x.font = 'bold 34px sans-serif'; x.textAlign = 'center'; x.fillText(t1, W / 2, 70); x.font = '22px sans-serif'; x.fillText(t2, W / 2, 108); noise(x, W, H, 300, .08); }); }

    // стенд с инструментами над верстаком
    plane(6, 2.4, ct(512, 205, function (x, W, H) {
      x.fillStyle = '#b9935c'; x.fillRect(0, 0, W, H);
      x.fillStyle = 'rgba(60,40,20,.5)'; for (var i = 0; i < W; i += 16) for (var j = 0; j < H; j += 16) { x.beginPath(); x.arc(i + 8, j + 8, 2, 0, 7); x.fill(); }
      x.fillStyle = '#2a2f3a'; x.strokeStyle = '#2a2f3a'; x.lineWidth = 6;
      for (var k = 0; k < 6; k++) { x.fillRect(40 + k * 36, 30, 8, 80); x.fillStyle = k % 2 ? '#dc2626' : '#2563eb'; x.fillRect(34 + k * 36, 108, 20, 44); x.fillStyle = '#2a2f3a'; }
      x.beginPath(); x.moveTo(290, 40); x.lineTo(320, 140); x.moveTo(330, 40); x.lineTo(300, 140); x.stroke();
      x.beginPath(); x.arc(400, 90, 34, 0, 7); x.stroke(); x.beginPath(); x.arc(400, 90, 18, 0, 7); x.stroke();
      x.fillRect(450, 30, 12, 110); x.beginPath(); x.arc(456, 30, 18, 0, 7); x.fill();
    }), 0, 3.7, -7.88, 0);
    bx(scene, 6.15, .1, .12, 0x20242c, 0, 4.95, -7.84, 0, .5, .5); bx(scene, 6.15, .1, .12, 0x20242c, 0, 2.45, -7.84, 0, .5, .5);
    // антистатический коврик, лампа, ящик с инструментами
    plane(5.6, 2.2, ct(256, 100, function (x, W, H) { x.fillStyle = '#16361f'; x.fillRect(0, 0, W, H); x.strokeStyle = 'rgba(255,255,255,.12)'; for (var i = 0; i < W; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); } for (var j = 0; j < H; j += 16) { x.beginPath(); x.moveTo(0, j); x.lineTo(W, j); x.stroke(); } x.fillStyle = '#fff'; x.font = 'bold 14px sans-serif'; x.fillText('ESD SAFE', 10, 18); }), 0, 1.604, -5, 0, -PI / 2);
    var lamp = grp(-2.4, 1.6, -5.7); cyl(lamp, .26, .3, .06, 0x20242c, 0, .03, 0); cyl(lamp, .03, .03, 1.1, 0x20242c, .1, .6, 0, 0, -.35); bx(lamp, .6, .08, .3, 0xfff0c0, .38, 1.15, 0, 0xfff0c0, .5, 0);
    var tb = grp(2.4, 1.6, -5.8); bx(tb, .9, .5, .45, 0xb91c1c, 0, .25, 0, 0, .5, .4); bx(tb, .5, .06, .08, 0x20242c, 0, .55, 0);

    // стойка продавца: касса, монитор, рекламная панель
    plane(4.6, 1.1, adTex('ИГРОВЫЕ ПК ОТ $399', 'сборка · гарантия · апгрейд', '#7c3aed', '#0e7490'), 0, .85, 2.705, 0, 0, true);
    var pos = grp(-1.3, 1.65, 1.9); cyl(pos, .12, .16, .3, 0x20242c, 0, .15, 0); bx(pos, 1.0, .6, .06, 0x15171c, 0, .6, 0, 0, .4, .4);
    plane(.9, .5, adTex('КАССА', 'чек № 0001', '#0b2a5a', '#1d4ed8'), -1.3, 2.25, 1.865, PI, 0, true);
    var reg = grp(1.4, 1.65, 1.9); bx(reg, .8, .3, .55, 0x2a2f3a, 0, .15, 0, 0, .5, .5); bx(reg, .5, .12, .3, 0x111827, 0, .36, -.05, 0x0e7490); bx(reg, .6, .05, .35, 0x9ca3af, 0, .32, .28, 0, .4, .8);
    bx(scene, .22, .08, .32, 0x111827, .2, 1.78, 2.3, 0, .4, .4); sph(scene, .09, 0xfacc15, -.4, 1.78, 2.2, 1, .8, 1);
    var mini = grp(2.0, 1.65, 2.1); bx(mini, .5, .5, .5, 0x15171c, 0, .25, 0, 0, .5, .5); cy(mini, .17, .04, 0x0a0a0a, 0, .25, -.26, 0x22d3ee);

    // зона ожидания: диван, растения, коврики
    var sf = grp(-6, 0, 6.75);
    bx(sf, 3.4, .55, 1.2, 0x2d6a6a, 0, .45, 0, 0, .9, 0); bx(sf, 3.4, 1.0, .3, 0x275a5a, 0, 1.1, .5, 0, .9, 0);
    bx(sf, .35, .9, 1.2, 0x275a5a, -1.62, .75, 0, 0, .9, 0); bx(sf, .35, .9, 1.2, 0x275a5a, 1.62, .75, 0, 0, .9, 0);
    [-1, 0, 1].forEach(function (i) { bx(sf, 1.0, .2, .95, 0x35807f, i * 1.05, .8, -.05, 0, .9, 0); });
    [[-1.5, .5], [1.5, .5], [-1.5, -.5], [1.5, -.5]].forEach(function (a) { bx(sf, .12, .2, .12, 0x15171c, a[0], .1, a[1]); });
    function plant(x, z) { var g = grp(x, 0, z); cyl(g, .45, .38, .7, 0xe5e7eb, 0, .35, 0, 0, 0, 1, 1); [[0, 1.1, 0, .55], [.3, 1.4, .1, .4], [-.3, 1.3, -.1, .42], [0, 1.7, .05, .35]].forEach(function (a) { sph(g, a[3], 0x2f7d3a, a[0], a[1], a[2], 1, 1.2, 1); }); }
    plant(-9.1, 6.8); plant(9.2, 6.8); plant(9.2, -6.6);
    plane(3.2, 1.6, ct(256, 128, function (x, W, H) { x.fillStyle = '#1f2937'; x.fillRect(0, 0, W, H); x.fillStyle = '#e5e7eb'; x.font = 'bold 30px sans-serif'; x.textAlign = 'center'; x.fillText('ДОБРО ПОЖАЛОВАТЬ', W / 2, 70); x.fillStyle = '#22d3ee'; x.fillRect(0, 0, W, 8); x.fillRect(0, H - 8, W, 8); }), 0, .008, 7.0, 0, -PI / 2);
    plane(5, 3, ct(256, 160, function (x, W, H) { x.fillStyle = '#4a1c28'; x.fillRect(0, 0, W, H); x.strokeStyle = '#d6b36a'; x.lineWidth = 6; x.strokeRect(10, 10, W - 20, H - 20); for (var i = 0; i < 6; i++) { x.strokeStyle = 'rgba(214,179,106,.5)'; x.lineWidth = 2; x.strokeRect(24 + i * 12, 24 + i * 8, W - 48 - i * 24, H - 48 - i * 16); } noise(x, W, H, 1200, .08); }), 0, .009, 5.3, 0, -PI / 2);

    // витрина с мониторами у входа справа
    var dt = grp(6, 0, 6.7); bx(dt, 3.6, .12, 1.3, 0x2a2f3a, 0, 1.1, 0, 0, .5, .4);
    [[-1.7, -.55], [1.7, -.55], [-1.7, .55], [1.7, .55]].forEach(function (a) { bx(dt, .12, 1.1, .12, 0x15171c, a[0], .55, a[1]); });
    [-1.1, 0, 1.1].forEach(function (x0, i) {
      bx(dt, .1, .3, .1, 0x20242c, x0, 1.3, 0); bx(dt, .8, .05, .4, 0x20242c, x0, 1.17, 0); bx(dt, 1.0, .62, .06, 0x15171c, x0, 1.72, 0);
      plane(.92, .54, adTex(['RVX 5090', 'RYZOR 9', 'ХИТ ПРОДАЖ'][i], ['ИГРЫ В 4K', 'БЫСТРЕЕ ВСЕХ', 'сборки от $399'][i], ['#14532d', '#7c2d12', '#312e81'][i], '#0b0e16'), 6 + x0, 1.72 + 0, 6.7 - .04, PI, 0, true);
    });

    // правая стена: стул, ТВ, часы, кулер, огнетушитель, картины
    var ch = grp(6.3, 0, -3);
    cyl(ch, .5, .5, .08, 0x20242c, 0, .08, 0); cyl(ch, .06, .06, .6, 0x4b5563, 0, .4, 0); bx(ch, .9, .14, .9, 0x1f2937, 0, .95, 0, 0, .8, 0); bx(ch, .12, 1.0, .9, 0x1f2937, -.42, 1.5, 0, 0, .8, 0);
    plane(3.2, 1.8, adTex('PC SALE', 'до −30% на комплектующие', '#7c3aed', '#be185d'), 9.88, 5.2, 2.0, -PI / 2, 0, true); bx(scene, .08, 1.95, 3.35, 0x0b0b0e, 9.93, 5.2, 2.0);
    plane(1.1, 1.1, ct(128, 128, function (x, W, H) { x.fillStyle = '#f5f5f4'; x.beginPath(); x.arc(64, 64, 60, 0, 7); x.fill(); x.strokeStyle = '#111'; x.lineWidth = 6; x.stroke(); x.lineWidth = 6; x.beginPath(); x.moveTo(64, 64); x.lineTo(64, 24); x.moveTo(64, 64); x.lineTo(92, 74); x.stroke(); }), 9.88, 6.3, -3, -PI / 2, 0, true);
    var wc = grp(9.2, 0, 4.2); bx(wc, .8, 1.8, .8, 0xe5e7eb, 0, .9, 0, 0, .5, .2); cyl(wc, .32, .32, .9, 0x60a5fa, 0, 2.25, 0).material.transparent = true; wc.children[wc.children.length - 1].material.opacity = .55; bx(wc, .1, .1, .12, 0xef4444, 0, 1.2, -.41);
    cyl(scene, .17, .17, .8, 0xdc2626, 9.7, .4, 5.7, 0, 0, 1, 1);
    plane(1.8, 1.2, adTex('СБОРКА', 'на ваших глазах', '#0e7490', '#1d4ed8'), 9.88, 4.8, -.4, -PI / 2, 0, true);
    plane(1.8, 1.2, adTex('ГАРАНТИЯ', '12 месяцев', '#166534', '#0f766e'), 9.88, 4.8, -6.2, -PI / 2, 0, true);

    // служебная дверь у задней стены и зона склада
    var sd = grp(4.2, 0, -7.85); bx(sd, 1.5, 4.5, .1, 0x5a3b22, 0, 2.25, 0, 0, .7, .1); bx(sd, .08, .35, .14, 0xcbd5e1, .55, 2.2, .06, 0, .3, .9); lp(sd, 'ТОЛЬКО ДЛЯ ПЕРСОНАЛА', 1.2, .22, 0, 3.6, .07, '#fff', '#991b1b');

    // зона безопасности вокруг верстака
    [[-3.4, -5], [3.4, -5]].forEach(function (a) { plane(.12, 3.3, ct(32, 128, function (x, W, H) { for (var i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#111' : '#facc15'; x.fillRect(0, i * 16, W, 16); } }), a[0], .015, a[1], 0, -PI / 2); });

    /* ---------- столкновения под новую планировку ---------- */
    blocked = function (x, z) {
      return (Math.abs(x) < 3.6 && z < -3.4) || (Math.abs(x) < 2.8 && z > 1 && z < 3) || x < -8.7 || x > 7 || z < -7 || z > 7 ||
        (z > 6.0 && x < -4.2) || (z > 6.0 && x > 4.1) || (x > 5.6 && z > -4 && z < -2);
    };
  }

  if (ready()) go();
  else {
    var n = 0, iv = setInterval(function () {
      if (ready()) { clearInterval(iv); go(); }
      else if (++n > 400) clearInterval(iv);
    }, 50);
  }
})();
