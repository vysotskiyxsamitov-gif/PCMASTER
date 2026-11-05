/* PC МАСТЕР — storage.js: «Старый склад».
   С 5-го дня: в магазине что-то обваливается — у правой стены из-под штукатурки выглядывает железная дверь на замке.
   Звонит Макс: «когда-то там был склад, замуровали. Ключ ищи в ящиках стола». Ключ — в верхнем ящике верстака.
   За дверью — грязная комната: пыль в воздухе, паутина, мусор, пятна. Всё убрать (E) — найдёшь старые детали и деньги.
   Подключать ПОСЛЕ blackout.js, models.js — в самом конце.   Проверка без ожидания: Ctrl+Shift+K (или __storage.start()). */
(function () {
  if (window.__storageLoaded) return;
  window.__storageLoaded = 1;

  function ready() {
    try {
      return typeof THREE !== 'undefined' && !!scene && !!cam && !!R && !!window.__roomLoaded && !!window.__windowsLoaded && !!window.__blackoutLoaded &&
        typeof incomingCall === 'function' && typeof blocked === 'function' && typeof startPlay === 'function' && typeof qText === 'function' &&
        typeof toast === 'function' && typeof save === 'function' && typeof lp === 'function' && !!window.__modelsLoaded;
    } catch (e) { return false; }
  }
  function safe(f) { try { return f(); } catch (e) { console.error('[storage]', e); } }

  function go() {
    var PI = Math.PI;
    /* ---------- позиции ---------- */
    var DZ = -2.6, DW = 1.5, DH = 3.3;                       // дверь в правой стене (x=10)
    var X0 = 10.03, X1 = 16.6, Z0 = -5.9, Z1 = .7, RH = 5.4;   // склад
    var TOTAL = 0;

    /* ---------- состояние (сохраняется в G.ev.sk) ---------- */
    function SK() { G.ev = G.ev || {}; return (G.ev.sk = G.ev.sk || { st: 0, key: 0, cl: [] }); }
    function sst() { try { return G && G.ev && G.ev.sk ? G.ev.sk.st | 0 : 0; } catch (e) { return 0; } }
    function inGame() { try { return !!G && mode == 'play'; } catch (e) { return false; } }
    function dark() { try { var b = window.__blackout && window.__blackout.state(); return !!(b && b.st > 0 && !G.sb); } catch (e) { return false; } }
    function inStore() { return P.x > 9.7 && P.x < X1 && P.z > Z0 - .2 && P.z < Z1 + .2; }

    /* ---------- рисование ---------- */
    function cvs(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
    function T(c, rx, ry, enc) { var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rx) t.repeat.set(rx, ry); t.anisotropy = 8; if (enc !== false) t.encoding = THREE.sRGBEncoding; return t; }
    var sd = 7; function rr() { sd = (sd * 9301 + 49297) % 233280; return sd / 233280; }
    function rs(a, b) { return a + rr() * (b - a); }
    function M(c, r, m) { var x = new THREE.MeshStandardMaterial({ color: c, roughness: r === undefined ? .9 : r, metalness: m || 0 }); x.envMapIntensity = .3; return x; }
    function noiseOn(x, W, H, n, a) { for (var i = 0; i < n; i++) { x.fillStyle = 'rgba(' + (rr() < .5 ? '0,0,0' : '255,240,210') + ',' + (rr() * a) + ')'; x.fillRect(rr() * W, rr() * H, 1 + rr() * 3, 1 + rr() * 3); } }
    function mesh(p, geo, mat, x, y, z, sx, sy, sz) { var m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); if (sx !== undefined) m.scale.set(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz); m.castShadow = true; m.receiveShadow = true; p.add(m); return m; }
    function box(p, w, h, d, mat, x, y, z) { return mesh(p, new THREE.BoxGeometry(w, h, d), mat, x, y, z); }

    function brickTex() {
      var c = cvs(512, 640), x = c.getContext('2d'); x.fillStyle = '#4a4036'; x.fillRect(0, 0, 512, 640);
      var bh = 30, bw = 64;
      for (var r = 0; r < 22; r++) for (var q = -1; q < 9; q++) {
        var xx = q * bw + (r % 2 ? bw / 2 : 0) + 2, yy = r * bh + 2, l = 28 + rr() * 14;
        x.fillStyle = 'hsl(' + (12 + rr() * 14) + ',' + (30 + rr() * 20) + '%,' + l + '%)'; x.fillRect(xx, yy, bw - 4, bh - 4);
        x.fillStyle = 'rgba(0,0,0,' + (rr() * .25) + ')'; x.fillRect(xx, yy + bh - 9, bw - 4, 5);
      }
      noiseOn(x, 512, 640, 1800, .18);
      var g = x.createLinearGradient(0, 0, 0, 640); g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(.3, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 512, 640);
      /* неровные края пролома */
      x.globalCompositeOperation = 'destination-in'; x.beginPath(); x.moveTo(40, 640);
      var pts = [[30, 520], [60, 400], [28, 300], [70, 200], [50, 120], [110, 60], [180, 90], [230, 30], [290, 70], [350, 24], [420, 80], [470, 150], [440, 230], [490, 330], [455, 440], [490, 540], [470, 640]];
      pts.forEach(function (p) { x.lineTo(p[0] + (rr() - .5) * 26, p[1] + (rr() - .5) * 26); }); x.closePath(); x.fill();
      x.globalCompositeOperation = 'destination-out'; x.fillRect(150, 190, 215, 450);             // проём двери
      x.globalCompositeOperation = 'source-over';
      return T(c, 0, 0);
    }
    function doorTex() {
      var c = cvs(256, 512), x = c.getContext('2d'); x.fillStyle = '#3d5a48'; x.fillRect(0, 0, 256, 512);
      for (var i = 0; i < 60; i++) { x.fillStyle = 'rgba(' + (rr() < .5 ? '40,25,10' : '120,80,40') + ',' + (rr() * .2) + ')'; x.fillRect(rr() * 256, rr() * 512, 4 + rr() * 30, 1 + rr() * 6); }
      x.strokeStyle = 'rgba(30,45,38,.9)'; x.lineWidth = 6; x.strokeRect(14, 14, 228, 484); x.strokeRect(34, 34, 188, 200); x.strokeRect(34, 262, 188, 216);
      x.fillStyle = 'rgba(25,35,30,.8)'; for (var k = 0; k < 8; k++) { x.beginPath(); x.arc(24 + (k % 2) * 208, 30 + Math.floor(k / 2) * 150, 5, 0, 7); x.fill(); }
      x.fillStyle = 'rgba(230,200,60,.85)'; x.font = 'bold 34px sans-serif'; x.textAlign = 'center'; x.fillText('СКЛАД', 128, 150);
      x.fillStyle = 'rgba(200,60,40,.85)'; x.font = 'bold 22px sans-serif'; x.fillText('ВХОД ЗАПРЕЩЁН', 128, 190);
      for (i = 0; i < 40; i++) { x.fillStyle = 'rgba(120,60,20,' + (rr() * .25) + ')'; x.fillRect(rr() * 256, 300 + rr() * 212, 2 + rr() * 6, 14 + rr() * 90); }
      noiseOn(x, 256, 512, 1200, .15); return T(c, 0, 0);
    }
    function floorTex() {
      var c = cvs(512, 512), x = c.getContext('2d'); x.fillStyle = '#4c4a46'; x.fillRect(0, 0, 512, 512); noiseOn(x, 512, 512, 6000, .12);
      x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 2; for (var i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, 512); x.stroke(); x.beginPath(); x.moveTo(0, i * 128); x.lineTo(512, i * 128); x.stroke(); }
      for (i = 0; i < 12; i++) { x.strokeStyle = 'rgba(0,0,0,.4)'; x.lineWidth = 1; x.beginPath(); var sx = rr() * 512, sy = rr() * 512; x.moveTo(sx, sy); for (var k = 0; k < 6; k++) { sx += (rr() - .5) * 40; sy += (rr() - .5) * 40; x.lineTo(sx, sy); } x.stroke(); }
      return T(c, 3, 3);
    }
    function wallTexS() {
      var c = cvs(512, 512), x = c.getContext('2d'); x.fillStyle = '#6b6354'; x.fillRect(0, 0, 512, 512); noiseOn(x, 512, 512, 5000, .1);
      for (var i = 0; i < 18; i++) { var gx = rr() * 512, gg = x.createLinearGradient(gx, 0, gx, 512); gg.addColorStop(0, 'rgba(30,22,10,' + (.12 + rr() * .2) + ')'); gg.addColorStop(1, 'rgba(30,22,10,0)'); x.fillStyle = gg; x.fillRect(gx, 0, 6 + rr() * 26, 100 + rr() * 380); }
      for (i = 0; i < 7; i++) { x.fillStyle = 'rgba(40,50,40,' + (.1 + rr() * .15) + ')'; x.beginPath(); x.ellipse(rr() * 512, rr() * 512, 30 + rr() * 70, 20 + rr() * 50, 0, 0, 7); x.fill(); }
      var gb = x.createLinearGradient(0, 380, 0, 512); gb.addColorStop(0, 'rgba(0,0,0,0)'); gb.addColorStop(1, 'rgba(0,0,0,.45)'); x.fillStyle = gb; x.fillRect(0, 380, 512, 132);
      return T(c, 2, 1);
    }
    function ceilTex() { var c = cvs(256, 256), x = c.getContext('2d'); x.fillStyle = '#3a342c'; x.fillRect(0, 0, 256, 256); noiseOn(x, 256, 256, 2500, .15); for (var i = 0; i < 6; i++) { x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(rr() * 256, rr() * 256, 20 + rr() * 40, 14 + rr() * 30, 0, 0, 7); x.fill(); } return T(c, 3, 3); }
    function webTex() {
      var c = cvs(256, 256), x = c.getContext('2d'); x.strokeStyle = 'rgba(235,235,235,.8)'; x.lineWidth = 1.2;
      for (var a = 0; a <= 8; a++) { var an = a / 8 * PI / 2; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(an) * 256, Math.sin(an) * 256); x.stroke(); }
      for (var r = 30; r < 260; r += 28) { x.beginPath(); for (a = 0; a <= 8; a++) { var an2 = a / 8 * PI / 2, rd = r * (1 - .12 * Math.sin(a * 1.9 + r)); var px = Math.cos(an2) * rd, py = Math.sin(an2) * rd; if (a == 0) x.moveTo(px, py); else x.quadraticCurveTo((px + x.__lx) / 2 * .9, (py + x.__ly) / 2 * .9, px, py); x.__lx = px; x.__ly = py; } x.stroke(); }
      return T(c, 0, 0);
    }
    function blotTex(col) {
      var c = cvs(128, 128), x = c.getContext('2d'); for (var i = 0; i < 9; i++) { var g = x.createRadialGradient(64 + rr() * 40 - 20, 64 + rr() * 40 - 20, 0, 64, 64, 22 + rr() * 38); g.addColorStop(0, col + '.55)'); g.addColorStop(1, col + '0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }
      return T(c, 0, 0);
    }
    function dotTex() { var c = cvs(32, 32), x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,240,210,1)'); g.addColorStop(1, 'rgba(255,240,210,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); return T(c, 0, 0); }

    /* ============================ ГРУППЫ ============================ */
    var cg = new THREE.Group(); cg.visible = false; scene.add(cg);       // пролом, дверь, обломки (основная комната)
    var rm = new THREE.Group(); rm.visible = false; scene.add(rm);       // склад
    var animL = [], items = [], dustP = null;

    /* ---------- пролом: кирпич вокруг двери ---------- */
    var patch = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 4.8), new THREE.MeshStandardMaterial({ map: brickTex(), transparent: true, roughness: .95, alphaTest: .05 }));
    patch.rotation.y = -PI / 2; patch.position.set(9.95, 2.4, -2.6); patch.receiveShadow = true; patch.userData.keep = 1; cg.add(patch);
    var steel = M(0x2a2f3a, .5, .6), frameM = M(0x4b4d52, .8, .2);
    box(cg, .34, .4, DW + .5, frameM, 9.88, DH + .15, DZ); box(cg, .34, DH, .2, frameM, 9.88, DH / 2, DZ - DW / 2 - .1); box(cg, .34, DH, .2, frameM, 9.88, DH / 2, DZ + DW / 2 + .1);
    var door = new THREE.Group(); door.position.set(9.96, 0, DZ - DW / 2); cg.add(door);
    var dm = new THREE.MeshStandardMaterial({ map: doorTex(), roughness: .6, metalness: .45 }); dm.envMapIntensity = .5;
    var leaf = new THREE.Mesh(new THREE.BoxGeometry(.1, DH - .05, DW), [M(0x2e3a33, .7, .4), dm, M(0x2e3a33, .7, .4), M(0x2e3a33, .7, .4), M(0x2e3a33, .7, .4), M(0x2e3a33, .7, .4)]);
    /* лицевая сторона смотрит в комнату (−x): материал с индексом 1 (−x) */
    leaf.position.set(0, (DH - .05) / 2 + .02, DW / 2); leaf.castShadow = leaf.receiveShadow = true; door.add(leaf);
    var hnd = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .22, 8), M(0xb8b8bd, .3, .9)); hnd.rotation.z = PI / 2; hnd.position.set(-.1, 1.7, DW - .2); door.add(hnd);
    /* замок с цепью */
    var lock = new THREE.Group(); lock.position.set(-.1, 1.62, DW - .35); door.add(lock);
    box(lock, .08, .22, .17, M(0xb4883a, .35, .8), 0, 0, 0);
    var sh = new THREE.Mesh(new THREE.TorusGeometry(.07, .018, 8, 14, PI), M(0xc9ccd2, .3, .9)); sh.rotation.z = 0; sh.position.set(0, .12, 0); sh.rotation.y = PI / 2; lock.add(sh);
    for (var li = 0; li < 3; li++) { var lk = new THREE.Mesh(new THREE.TorusGeometry(.05, .014, 6, 10), M(0x6b6f78, .5, .8)); lk.position.set(-.02, -.18 - li * .08, 0); lk.rotation.y = li % 2 ? 0 : PI / 2; lock.add(lk); }
    door.userData.act = null;
    var doorHit = new THREE.Mesh(new THREE.BoxGeometry(.5, DH, DW + .3), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); doorHit.position.set(9.6, DH / 2, DZ); cg.add(doorHit);
    doorHit.userData.act = function () { doorAct(); };

    /* ---------- обломки ---------- */
    var debris = [];
    var dmat = [M(0x8a8478, .95), M(0xa39a8b, .95), M(0x6e5a48, .95), M(0x7a3f30, .95)];
    for (var di = 0; di < 34; di++) {
      var sz = rs(.12, .5), big = di < 8, left = di % 2;
      var rb = new THREE.Mesh(di % 3 ? new THREE.DodecahedronGeometry(sz, 0) : new THREE.BoxGeometry(sz * 1.4, sz * .8, sz), dmat[di % 4]);
      rb.scale.set(rs(.8, 1.4), rs(.5, 1), rs(.8, 1.3)); rb.rotation.set(rr() * 6, rr() * 6, rr() * 6); rb.castShadow = rb.receiveShadow = true;
      var tz = di < 24 ? (left ? DZ - 1.3 - rr() * 1.0 : DZ + 1.3 + rr() * 1.0) : DZ + (rr() - .5) * 1.1;
      var tx = di < 24 ? 8.7 + rr() * 1.0 : 8.9 + rr() * .9; var ty = sz * .45 + (big && rr() < .5 ? sz * .6 : 0);
      rb.position.set(tx + rr() * .2, 4 + rr() * 3, tz); rb.userData.t = { x: tx, y: ty, z: tz, vy: 0, wait: rr() * .5, done: 0 }; cg.add(rb); debris.push(rb);
    }
    var dustSp = []; (function () {
      var dt = dotTex();
      for (var i = 0; i < 16; i++) { var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dt, color: 0xb8a98a, transparent: true, opacity: 0, depthWrite: false })); sp.position.set(9.2, 1.5, DZ); sp.scale.set(.1, .1, .1); sp.userData = { a: 0 }; cg.add(sp); dustSp.push(sp); }
    })();

    /* ---------- склад: оболочка ---------- */
    var shellMats = [wallTexS, wallTexS, ceilTex, floorTex, wallTexS, wallTexS].map(function (f, i) {
      var m = new THREE.MeshStandardMaterial({ map: f(), roughness: .95, side: THREE.BackSide }); m.envMapIntensity = .15; if (i == 3) { m.roughness = .85; m.bumpMap = m.map; m.bumpScale = .5; } return m;
    });
    var shell = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0, RH, Z1 - Z0), shellMats); shell.position.set((X0 + X1) / 2, RH / 2, (Z0 + Z1) / 2); shell.receiveShadow = true; rm.add(shell);
    /* потолочные балки, трубы */
    var wood = M(0x2c2218, .9);
    [-4.5, -2.6, -.7].forEach(function (z) { box(rm, X1 - X0, .35, .3, wood, (X0 + X1) / 2, RH - .18, z); });
    [[.6, 4.9], [-.4, 5.05]].forEach(function (a, i) { var p = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, Z1 - Z0 - .3, 12), M(0x5a4a3a, .5, .6)); p.rotation.x = PI / 2; p.position.set(X1 - .6 - i * .5, a[1], (Z0 + Z1) / 2); p.castShadow = true; rm.add(p); });
    /* лампа */
    var bulb = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffd9a0 })); bulb.position.set(13.3, RH - .9, DZ); rm.add(bulb);
    var cord = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .7, 6), M(0x111111, .5)); cord.position.set(13.3, RH - .5, DZ); rm.add(cord);
    var shade = new THREE.Mesh(new THREE.ConeGeometry(.22, .18, 14, 1, true), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: .5, metalness: .6, side: THREE.DoubleSide })); shade.position.set(13.3, RH - .78, DZ); rm.add(shade);
    var lamp = new THREE.PointLight(0xffc27a, 0, 11, 1.4); lamp.position.set(13.3, RH - 1.1, DZ); scene.add(lamp);     // создаём сразу (без перекомпиляции шейдеров при показе)
    /* луч света из узкого окна под потолком */
    var slit = new THREE.Mesh(new THREE.PlaneGeometry(.4, 1.0), new THREE.MeshBasicMaterial({ color: 0xcfe4ff })); slit.position.set(X1 - .02, RH - 1.2, Z0 + 1.6); slit.rotation.y = -PI / 2; rm.add(slit);
    var beamC = cvs(32, 128), bx = beamC.getContext('2d'), bg = bx.createLinearGradient(0, 0, 0, 128); bg.addColorStop(0, 'rgba(210,230,255,.55)'); bg.addColorStop(1, 'rgba(210,230,255,0)'); bx.fillStyle = bg; bx.fillRect(0, 0, 32, 128);
    var beamM = new THREE.MeshBasicMaterial({ map: T(beamC, 0, 0, true), transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    var beam = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 4.4), beamM); beam.position.set(X1 - 1.8, RH / 2 - .5, Z0 + 1.6); beam.rotation.set(0, PI / 2, .38); rm.add(beam);

    /* ---------- мебель/хлам склада (декор) ---------- */
    var metal = M(0x4b5058, .55, .6), carton = M(0x8c6a43, .95), dkw = M(0x4a3522, .9);
    function shelfUnit(x, z, ry, w) {
      var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; rm.add(g);
      [-1, 1].forEach(function (s) { box(g, .08, 3.6, .08, metal, s * (w / 2), 1.8, -.4); box(g, .08, 3.6, .08, metal, s * (w / 2), 1.8, .4); });
      for (var l = 0; l < 4; l++) {
        box(g, w, .05, .9, metal, 0, .35 + l * 1.05, 0);
        var n = 2 + Math.floor(rr() * 3); for (var k = 0; k < n; k++) { var bw = rs(.4, .8), bh = rs(.3, .65); box(g, bw, bh, rs(.4, .7), rr() < .7 ? carton : M(0x5b6b7a, .9), -w / 2 + .5 + k * (w / n), .38 + l * 1.05 + bh / 2, rs(-.15, .15)).rotation.y = rs(-.2, .2); }
      }
    }
    shelfUnit(X1 - .55, Z0 + 1.7, PI / 2, 2.3); shelfUnit(X1 - .55, DZ + 1.4, PI / 2, 2.3); shelfUnit(13.4, Z0 + .55, 0, 2.6); shelfUnit(11.7, Z0 + .55, 0, 1.8);
    function crt(x, y, z, ry) { var g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; rm.add(g); box(g, .55, .5, .5, M(0xcfc6ae, .7), 0, .25, 0); box(g, .4, .35, .06, M(0x101418, .15, .3), 0, .27, .26); box(g, .3, .25, .3, M(0xcfc6ae, .7), 0, .6, -.1); return g; }
    crt(15.4, 0, -1.2, .6); crt(11.4, 0, -.2, -.4).position.y = 0; crt(15.2, .0, -4.6, 2.2);
    var tarp = mesh(rm, new THREE.BoxGeometry(1.4, .7, 1.0), M(0x59634f, 1), 12.1, .35, DZ + 2.4); tarp.rotation.y = .3; mesh(rm, new THREE.SphereGeometry(.7, 12, 8), M(0x59634f, 1), 12.1, .55, DZ + 2.4, 1, .55, .8);
    [[11.0, -5.0], [11.65, -5.2]].forEach(function (p) { mesh(rm, new THREE.CylinderGeometry(.3, .3, .9, 14), M(0x2d4f6e, .5, .5), p[0], .45, p[1]); });
    var puddle = new THREE.Mesh(new THREE.CircleGeometry(.9, 18), new THREE.MeshStandardMaterial({ color: 0x1a1d22, roughness: .05, metalness: .2, transparent: true, opacity: .75 })); puddle.rotation.x = -PI / 2; puddle.position.set(14.8, .02, -3.0); puddle.scale.set(1, 1.5, 1); rm.add(puddle);
    var cal = lp(rm, '2004', .45, .6, X1 - .03, 3.0, DZ + .2, '#7f1d1d', '#e7e2d8', -PI / 2);
    var table = new THREE.Group(); table.position.set(12.3, 0, -.9); rm.add(table); box(table, 1.6, .08, .8, dkw, 0, .75, 0); [[-.7, -.3], [.7, -.3], [-.7, .3], [.7, .3]].forEach(function (a) { box(table, .08, .75, .08, dkw, a[0], .37, a[1]); });
    var chairBroken = new THREE.Group(); chairBroken.position.set(11.7, 0, -3.3); chairBroken.rotation.z = 1.4; chairBroken.rotation.y = .6; rm.add(chairBroken); box(chairBroken, .5, .06, .5, dkw, 0, .5, 0); box(chairBroken, .5, .55, .05, dkw, 0, .85, -.22); [[-.2, -.2], [.2, -.2], [-.2, .2], [.2, .2]].forEach(function (a) { box(chairBroken, .05, .5, .05, dkw, a[0], .25, a[1]); });

    /* ---------- грязь: плёнка на полу ---------- */
    var grime = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0 - .1, Z1 - Z0 - .1), new THREE.MeshBasicMaterial({ map: blotTex('rgba(20,14,6,'), color: 0x000000, transparent: true, opacity: .5, depthWrite: false }));
    (function () { var c = cvs(256, 256), x = c.getContext('2d'); for (var i = 0; i < 40; i++) { var g = x.createRadialGradient(0, 0, 0, 0, 0, 1); x.save(); x.translate(rr() * 256, rr() * 256); x.scale(30 + rr() * 60, 30 + rr() * 60); g.addColorStop(0, 'rgba(20,14,6,.35)'); g.addColorStop(1, 'rgba(20,14,6,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, 7); x.fill(); x.restore(); } grime.material.map = T(c, 1, 1); grime.material.color.setHex(0xffffff); grime.material.needsUpdate = true; })();
    grime.rotation.x = -PI / 2; grime.position.set((X0 + X1) / 2, .015, (Z0 + Z1) / 2); grime.material.polygonOffset = true; grime.material.polygonOffsetFactor = -2; rm.add(grime);

    /* ============ ЗАДАЧИ УБОРКИ ============ */
    function spot() { var x, z, ok, t = 0; do { x = rs(X0 + .8, X1 - 1.1); z = rs(Z0 + .8, Z1 - .8); ok = true; if (x < 11.0 && Math.abs(z - DZ) < 1.1) ok = false; t++; } while (!ok && t < 40); return [x, z]; }
    function addItem(kind, obj, label) { var it = { id: items.length, kind: kind, obj: obj, label: label, done: false }; items.push(it); obj.userData.act = function () { clean(it); }; obj.userData.item = it; rm.add(obj); return it; }
    var paperM = new THREE.MeshStandardMaterial({ color: 0xd8d3c4, roughness: 1, flatShading: true });
    function mkTrash(k) {
      var g = new THREE.Group(), p = spot(); g.position.set(p[0], 0, p[1]); g.rotation.y = rr() * 6;
      if (k == 0) { var s = mesh(g, new THREE.IcosahedronGeometry(.14, 0), paperM, 0, .12, 0, 1, .8, 1); s.rotation.set(rr() * 3, rr() * 3, 0); mesh(g, new THREE.IcosahedronGeometry(.1, 0), paperM, .2, .08, .1); }
      else if (k == 1) { box(g, .55, .38, .42, M(0x9a7448, .95), 0, .19, 0); box(g, .56, .02, .1, M(0xc8b88a, .9), 0, .39, 0); g.rotation.z = rs(-.1, .1); }
      else if (k == 2) { var b = mesh(g, new THREE.CylinderGeometry(.07, .07, .3, 10), new THREE.MeshStandardMaterial({ color: 0x3f7f4f, roughness: .2, transparent: true, opacity: .8 }), 0, .07, 0); b.rotation.z = PI / 2; b.rotation.y = rr() * 3; }
      else if (k == 3) { var t1 = mesh(g, new THREE.TorusGeometry(.2, .03, 6, 16), M(0x111111, .6), 0, .04, 0); t1.rotation.x = PI / 2; var t2 = mesh(g, new THREE.TorusGeometry(.14, .03, 6, 14), M(0x222222, .6), .05, .08, .03); t2.rotation.x = PI / 2; }
      else if (k == 4) { box(g, .62, .05, .2, M(0x9a9a92, .7), 0, .03, 0); for (var q = 0; q < 14; q++) box(g, .035, .02, .035, M(0x2a2a2a, .8), -.27 + (q % 7) * .09, .065, q < 7 ? -.05 : .05); }
      else if (k == 5) { var tr = mesh(g, new THREE.TorusGeometry(.26, .12, 10, 18), M(0x161616, .9), 0, .13, 0); tr.rotation.x = PI / 2; }
      else { var gb = mesh(g, new THREE.SphereGeometry(.3, 12, 10), M(0x1f3a28, .35), 0, .22, 0, 1, .8, 1); mesh(g, new THREE.ConeGeometry(.08, .2, 8), M(0x1f3a28, .35), 0, .5, 0); }
      return g;
    }
    for (var ti = 0; ti < 14; ti++) addItem('trash', mkTrash(ti % 7), 'Убрать мусор');
    var webM = new THREE.MeshBasicMaterial({ map: webTex(), transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: .85 });
    [[X1 - .03, RH - .8, Z0 + .8, -PI / 2, 0], [X1 - .03, RH - .8, Z1 - .8, -PI / 2, PI / 2], [12.0, RH - .8, Z0 + .03, 0, 0], [15.4, RH - .8, Z1 - .03, PI, PI / 2], [X0 + .05, RH - .8, Z1 - .8, PI / 2, PI / 2]].forEach(function (a) {
      var g = new THREE.Group(); g.position.set(a[0], a[1], a[2]); g.rotation.y = a[3]; var w = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), webM); w.rotation.z = a[4]; w.position.set(.0, 0, .0); g.add(w);
      var hit = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, .5), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); g.add(hit); addItem('web', g, 'Снять паутину');
    });
    [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]].forEach(function (a, i) {
      var p = spot(), m = new THREE.Mesh(new THREE.PlaneGeometry(rs(.9, 1.5), rs(.9, 1.5)), new THREE.MeshBasicMaterial({ map: blotTex(i % 2 ? 'rgba(30,24,10,' : 'rgba(10,20,10,'), transparent: true, depthWrite: false, opacity: .95 }));
      m.rotation.x = -PI / 2; m.rotation.z = rr() * 6; m.position.set(p[0], .03, p[1]); m.material.polygonOffset = true; m.material.polygonOffsetFactor = -3;
      var g = new THREE.Group(); g.add(m); var hit = new THREE.Mesh(new THREE.BoxGeometry(1.2, .5, 1.2), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.position.set(p[0], .25, p[1]); g.add(hit); addItem('stain', g, 'Оттереть пятно');
    });
    var pileM = new THREE.MeshStandardMaterial({ map: blotTex('rgba(190,175,150,'), color: 0x8f8573, roughness: 1, transparent: false });
    for (var pi = 0; pi < 4; pi++) { var p2 = spot(), g2 = new THREE.Group(); g2.position.set(p2[0], 0, p2[1]); mesh(g2, new THREE.SphereGeometry(.45, 12, 8), new THREE.MeshStandardMaterial({ color: 0x8f8573, roughness: 1 }), 0, 0, 0, 1, .22, 1); mesh(g2, new THREE.SphereGeometry(.25, 10, 8), new THREE.MeshStandardMaterial({ color: 0x9c917e, roughness: 1 }), .25, 0, .1, 1, .3, 1); addItem('pile', g2, 'Подмести пыль'); }
    TOTAL = items.length;

    /* ---------- чистка: анимация исчезновения ---------- */
    var LB = { trash: 'мусор убран', web: 'паутина снята', stain: 'пятно оттёрто', pile: 'пыль подметена' };
    function clean(it) {
      if (it.done || !inStore() || sst() != 4) return;
      it.done = true; var s = SK(); if (s.cl.indexOf(it.id) < 0) s.cl.push(it.id);
      try { sfx(it.kind == 'trash' ? 'place' : 'buy'); } catch (e) { }
      animL.push({ o: it.obj, t: 0, kind: it.kind, y0: it.obj.position.y });
      it.obj.userData.act = null; if (it.obj.children) it.obj.children.forEach(function (c) { if (c.userData) c.userData.act = null; });
      var left = TOTAL - s.cl.length; toast(LB[it.kind] + ' · осталось ' + left); save(); prog();
      if (left <= 0) setTimeout(finish, 900);
    }
    function applyClean() {
      var s = SK(); items.forEach(function (it) {
        var d = s.cl.indexOf(it.id) >= 0; it.done = d;
        if (d) { it.obj.visible = false; it.obj.userData.act = null; if (it.obj.children) it.obj.children.forEach(function (c) { if (c.userData) c.userData.act = null; }); }
        else { it.obj.visible = true; it.obj.scale.set(1, 1, 1); it.obj.userData.act = function () { clean(it); }; }
      });
    }

    /* ---------- награда ---------- */
    var crate = new THREE.Group(); crate.position.set(X1 - 1.0, 0, -1.2); crate.rotation.y = -PI / 2; crate.visible = false; rm.add(crate);
    var crateM = M(0x7a5a34, .85); box(crate, 1.1, .6, .75, crateM, 0, .3, 0); box(crate, 1.14, .05, .79, M(0x5a4224, .9), 0, .62, 0); [-.4, .4].forEach(function (x) { box(crate, .06, .62, .8, M(0x4a3520, .9), x, .31, 0); });
    var cLid = new THREE.Group(); cLid.position.set(0, .62, -.37); crate.add(cLid); box(cLid, 1.14, .05, .76, M(0x6a4d2c, .9), 0, 0, .38);
    var glowC = cvs(64, 64), gx2 = glowC.getContext('2d'), gg2 = gx2.createRadialGradient(32, 32, 0, 32, 32, 32); gg2.addColorStop(0, 'rgba(255,220,120,.9)'); gg2.addColorStop(1, 'rgba(255,220,120,0)'); gx2.fillStyle = gg2; gx2.fillRect(0, 0, 64, 64);
    var cGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowC), transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending })); cGlow.position.set(0, .9, 0); cGlow.scale.set(1.6, 1.6, 1.6); crate.add(cGlow);
    var crateHit = new THREE.Mesh(new THREE.BoxGeometry(1.3, .9, .9), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); crateHit.position.set(0, .45, 0); crate.add(crateHit);
    crateHit.userData.act = function () { openCrate(); };
    function openCrate() {
      if (!inStore() || sst() != 5) return; var s = SK(); s.st = 6; s.rw = 1;
      var cash = 400 + Math.floor(Math.random() * 300), got = [];
      G.m += cash;
      try {
        for (var k = 0; k < 4; k++) { var c = Math.floor(Math.random() * CAT.length), l = CAT[c].length, i = Math.min(l - 1, Math.floor(l * (.35 + Math.random() * .4))); G.st.push({ c: c, i: i, u: 0, bad: 0, h: 0, pl: 0, fl: 0 }); got.push(CN[c] + ' «' + CAT[c][i].n + '»'); }
      } catch (e) { }
      animL.push({ o: cLid, t: 0, kind: 'lid' }); cGlow.visible = false; try { sfx('buy'); } catch (e) { }
      toast('В ящике: $' + cash + ' и старые детали — ' + got.join(', ')); try { shelf(); hud(); } catch (e) { } save(); prog();
    }
    function finish() {
      var s = SK(); if (s.st != 4) return; s.st = 5; crate.visible = true; save();
      try { sfx('buy'); } catch (e) { }
      incomingCall('M', [['M', 'Ну как там, живой? Слушай, ты молодец, что разгрёб этот склад.'], ['M', 'В таких местах хозяева часто оставляют что-то ценное. Загляни в старый ящик у дальней стены!']], function () { });
      toast('Склад убран! Загляни в старый ящик у дальней стены.');
    }

    /* ============ ЯЩИК СТОЛА И КЛЮЧ ============ */
    var drawers = [], keyMesh = null, drawerOpen = false;
    function setupDrawer(d) {
      if (!d) return;
      var ks = new THREE.Group(); ks.position.set(-.1, -.06, -.4); ks.rotation.y = .5; ks.visible = false; d.add(ks);
      var gold = new THREE.MeshStandardMaterial({ color: 0xf4c430, roughness: .25, metalness: .9, emissive: 0x6a4a00, emissiveIntensity: .6 });
      var rg = new THREE.Mesh(new THREE.TorusGeometry(.05, .014, 8, 14), gold); rg.rotation.x = PI / 2; ks.add(rg);
      var sf = new THREE.Mesh(new THREE.BoxGeometry(.012, .012, .2), gold); sf.position.set(0, 0, -.14); ks.add(sf);
      var tt = new THREE.Mesh(new THREE.BoxGeometry(.04, .012, .03), gold); tt.position.set(0, 0, -.2); ks.add(tt);
      var tt2 = tt.clone(); tt2.position.z = -.16; ks.add(tt2);
      var gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: 0xffd966, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .8 })); gl.scale.set(.5, .5, .5); gl.position.set(0, .03, -.1); ks.add(gl);
      keyMesh = ks;
      ks.userData.act = function () { takeKey(); };
      d.userData.act = function () { toggleDrawer(d); };
    }
    function toggleDrawer(d) {
      if (d.userData.moving) return; var op = !d.userData.open; d.userData.open = op; d.userData.moving = 1;
      animL.push({ o: d, t: 0, kind: 'drawer', from: d.position.z, to: d.userData.z0 + (op ? .75 : 0) });
      try { sfx('door'); } catch (e) { }
      var s = SK(); if (op && d === drawers[2]) { if (s.st == 2 && !s.key) { keyMesh.visible = true; toast('В ящике что-то блестит — это ключ! Нажми E.'); } else if (!s.key) toast('Старые винты, карандаши… ничего полезного.'); }
    }
    function takeKey() {
      var s = SK(); if (s.st != 2 || s.key || !drawers[2] || !drawers[2].userData.open) return;
      s.key = 1; s.st = 3; keyMesh.visible = false; keyMesh.userData.act = null; try { sfx('buy'); } catch (e) { } toast('Ключ от железной двери — в инвентаре. Дверь на правой стене.'); save(); inv();
    }
    function hookDrawers() {
      var ds = window.__models && window.__models.drawers; if (ds && ds.length == 3) { drawers = ds; setupDrawer(ds[2]); ds[0].userData.act = function () { toggleDrawer(ds[0]); }; ds[1].userData.act = function () { toggleDrawer(ds[1]); }; return true; }
      return false;
    }
    if (!hookDrawers()) {
      var tries = 0, iv0 = setInterval(function () { if (hookDrawers() || ++tries > 60) { clearInterval(iv0); if (!drawers.length) fallbackDrawer(); } }, 500);
    }
    function fallbackDrawer() {      /* если новый верстак не построился — ключ в обычном ящичке на верстаке */
      var g = new THREE.Group(); g.position.set(-2.4, 1.67, -4.4); scene.add(g); box(g, .5, .22, .4, M(0x4a3522, .8), 0, .11, 0);
      drawers = [g, g, g]; g.userData.z0 = g.position.z; setupDrawer(g); g.userData.act = function () { var s = SK(); if (s.st == 2 && !s.key) { s.key = 1; s.st = 3; toast('В ящичке был ключ! Идёт к железной двери на правой стене.'); save(); inv(); } else toast('Пусто.'); };
    }

    /* ============ ДВЕРЬ ============ */
    var doorAnim = null;
    function doorAct() {
      var s = SK(); if (!s.st) return;
      if (s.st >= 4) { if (inStore() || P.x > 8) toast(s.st == 4 ? 'Нужно прибраться: ' + (TOTAL - s.cl.length) + ' мест.' : 'Склад открыт.'); return; }
      if (s.st < 3 || !s.key) { try { sfx('error'); } catch (e) { } toast(s.st == 1 ? 'Железная дверь на навесном замке. (Сначала ответь на звонок.)' : 'Заперто на замок. Ключ должен быть в ящике стола — посмотри в верхний ящик верстака.'); return; }
      s.st = 4; s.key = 0; save(); inv(); try { sfx('door'); } catch (e) { }
      toast('Замок открыт.'); animL.push({ o: lock, t: 0, kind: 'lock' });
      setTimeout(function () { doorAnim = { t: 0, to: 1.5 }; try { sfx('door'); } catch (e) { } }, 700);
      setTimeout(function () { try { talk([['Ты', 'Фу… сколько тут пыли. Лет двадцать никто не заходил.'], ['Ты', 'Нужно всё прибрать: мусор, паутина, пятна. Нажимай E на всём грязном.']], null); } catch (e) { } }, 2400);
    }

    /* ============ СТЕНА: проём в стене ============ */
    var wallOrig = null, wallParts = [];
    function findWall() { var b = null; scene.children.forEach(function (o) { var g = o.geometry; if (!g || g.type != 'PlaneGeometry' || o.userData.keep) return; var p = g.parameters; if (p.height == 10 && Math.abs(o.position.x - 10) < .25 && o.material && o.material.map) b = o; }); return b; }
    function applyWall(on) {
      if (on) {
        if (wallParts.length) { wallOrig && (wallOrig.visible = false); wallParts.forEach(function (p) { p.visible = true; }); return; }
        var w = findWall(); if (!w) { console.warn('[storage] правая стена не найдена — проём без дыры'); return; }
        wallOrig = w; var m0 = w.material, W = w.geometry.parameters.width, H = 10, k = -Math.sin(w.rotation.y) >= 0 ? 1 : -1, ry = w.rotation.y;
        var a = Math.min((DZ - DW / 2) * k - w.position.z * k, (DZ + DW / 2) * k - w.position.z * k), b = Math.max((DZ - DW / 2) * k - w.position.z * k, (DZ + DW / 2) * k - w.position.z * k);
        var yb = DH - (w.position.y - H / 2);   // верх проёма в локальных координатах (от низа плоскости)
        function piece(xa, xb, ya, yb2) {
          var g = new THREE.PlaneGeometry(xb - xa, yb2 - ya), m = m0.clone(); m.map = m0.map.clone(); m.map.needsUpdate = true;
          m.map.repeat.set(m0.map.repeat.x * (xb - xa) / W, m0.map.repeat.y * (yb2 - ya) / H); m.map.offset.set(m0.map.offset.x + m0.map.repeat.x * (xa + W / 2) / W, m0.map.offset.y + m0.map.repeat.y * ya / H);
          m.bumpMap = (m0.bumpMap === m0.map) ? m.map : m0.bumpMap; m.needsUpdate = true;
          var o = new THREE.Mesh(g, m); o.rotation.copy(w.rotation); o.position.set(w.position.x, w.position.y - H / 2 + (ya + yb2) / 2, w.position.z + k * ((xa + xb) / 2)); o.castShadow = w.castShadow; o.receiveShadow = w.receiveShadow; scene.add(o); wallParts.push(o);
        }
        piece(-W / 2, a, 0, H); piece(b, W / 2, 0, H); piece(a, b, yb, H);
        w.visible = false;
      } else { if (wallOrig) wallOrig.visible = true; wallParts.forEach(function (p) { p.visible = false; }); }
    }

    /* ============ ПЕРЕХОДЫ И ЦИКЛ ============ */
    var shake = 0, fallT = -1;
    function rumble() {
      try {
        var A = window.__ac || (window.__ac = new (window.AudioContext || window.webkitAudioContext)()); if (A.state == 'suspended') A.resume();
        var len = A.sampleRate * 2.4, buf = A.createBuffer(1, len, A.sampleRate), d = buf.getChannelData(0), last = 0;
        for (var i = 0; i < len; i++) { var w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; d[i] = last * 3.2 * Math.pow(1 - i / len, 1.4) * (i < 3000 ? i / 3000 : 1); }
        var src = A.createBufferSource(); src.buffer = buf; var lp2 = A.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 220; var gn = A.createGain(); gn.gain.value = (window.opt && opt.s === false) ? 0 : .9;
        src.connect(lp2); lp2.connect(gn); gn.connect(A.destination); src.start();
        var len2 = A.sampleRate * .9, b2 = A.createBuffer(1, len2, A.sampleRate), d2 = b2.getChannelData(0); for (var j = 0; j < len2; j++) d2[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / len2, 3) * .5;
        var s2 = A.createBufferSource(); s2.buffer = b2; var g2 = A.createGain(); g2.gain.value = (window.opt && opt.s === false) ? 0 : .7; var hp = A.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 900; s2.connect(hp); hp.connect(g2); g2.connect(A.destination); setTimeout(function () { try { s2.start(); } catch (e) { } }, 300);
      } catch (e) { }
    }
    function start(force) {
      if (!G) return; var s = SK(); if (s.st) return; s.st = 1; save();
      applyWall(true); cg.visible = true; patch.visible = true; debris.forEach(function (r) { r.userData.t.done = 0; r.position.y = 4 + rr() * 3; r.userData.t.vy = 0; r.userData.t.wait = rr() * .6; });
      keyMesh && (keyMesh.visible = false); lock.visible = true; door.rotation.y = 0; fallT = 0; shake = 1.6; rumble(); lamp.intensity = 0;
      dustSp.forEach(function (sp) { sp.userData.a = 1; sp.position.set(8.9 + rr() * 1.0, 1 + rr() * 2.5, DZ + (rr() - .5) * 3.2); sp.scale.set(.6, .6, .6); });
      toast('Грохот! У правой стены что-то обвалилось…');
      setTimeout(function () {
        incomingCall('M', [
          ['M', 'Алё! Это Максим. У вас там что-то грохнуло? Соседи снизу звонят.'],
          ['Y', 'Стена обвалилась! А за ней — железная дверь на замке.'],
          ['M', 'Железная дверь?.. Подожди, вспомнил. Лет двадцать назад в этом здании был склад — его потом замуровали и забыли.'],
          ['M', 'Ключ от него хозяин оставлял где-то в магазине. Посмотри в ящиках рабочего стола.'],
          ['M', 'Только предупреждаю: там наверняка пыль, хлам и грязь. Придётся всё убрать. Зато могли остаться старые детали!']
        ], function () { var q = SK(); if (q.st == 1) { q.st = 2; save(); } try { toast('Найди ключ в ящиках верстака, потом открой железную дверь у правой стены.'); } catch (e) { } });
      }, 3400);
    }
    function sync() {
      if (!G) return; var s = G.ev && G.ev.sk, st = s ? s.st | 0 : 0;
      cg.visible = st >= 1; rm.visible = st >= 4; applyWall(st >= 1); lamp.visible = st >= 4;
      door.rotation.y = st >= 4 ? 1.5 : 0; lock.visible = st < 4; patch.visible = st >= 1;
      debris.forEach(function (r) { var t = r.userData.t; r.position.set(t.x, t.y, t.z); t.done = 1; });
      dustSp.forEach(function (sp) { sp.userData.a = 0; sp.material.opacity = 0; });
      if (st >= 4) { applyClean(); } crate.visible = st >= 5; cGlow.visible = st == 5; cLid.rotation.x = st >= 6 ? -1.9 : 0;
      keyMesh && (keyMesh.visible = false); drawers.forEach(function (d) { d.userData.open = false; d.position.z = d.userData.z0; });
      beam.visible = true; prog(); inv();
    }
    function hideAll() { cg.visible = false; rm.visible = false; applyWall(false); lamp.visible = false; }

    /* ---------- блокировка движения ---------- */
    var _bl = blocked;
    blocked = function (x, z) {
      var st = sst();
      if (st >= 4 && door.rotation.y > 1) {
        if (x >= 6.9 && x <= 9.8 && Math.abs(z - DZ) < .8) return false;
        if (x > 9.8 && x < X1 - .5 && z > Z0 + .5 && z < Z1 - .5) return false;
      }
      return _bl(x, z);
    };
    var _sp = startPlay; startPlay = function () { var r = _sp.apply(this, arguments); setTimeout(function () { safe(sync); }, 60); return r; };
    var _tm = toMenu; toMenu = function () { safe(hideAll); return _tm.apply(this, arguments); };

    /* ---------- подсказки ---------- */
    var _qt = qText;
    qText = function () {
      var st = sst(); if (st && st < 6 && !dark()) {
        var s = SK(), left = TOTAL - (s.cl || []).length;
        return st == 1 ? 'Что-то обвалилось у правой стены — ответь на звонок' : st == 2 ? 'Найди ключ в ящиках верстака (верхний ящик)' : st == 3 ? 'Открой железную дверь на правой стене — ключ у тебя' : st == 4 ? 'Прибери склад: осталось ' + left + ' из ' + TOTAL : 'Загляни в старый ящик у дальней стены склада';
      }
      return _qt.apply(this, arguments);
    };

    /* ---------- интерфейс: ключ и прогресс ---------- */
    var invEl = document.createElement('div'); invEl.className = 'g'; invEl.style.cssText = 'position:fixed;right:12px;top:calc(50% + 96px);z-index:30;display:none;pointer-events:none;text-align:center;min-width:92px;padding:8px 10px';
    var pgEl = document.createElement('div'); pgEl.className = 'g'; pgEl.style.cssText = 'position:fixed;left:10px;top:92px;z-index:30;display:none;pointer-events:none;min-width:190px;padding:8px 12px;font-size:13px';
    try { $('w').appendChild(invEl); $('w').appendChild(pgEl); } catch (e) { document.body.appendChild(invEl); document.body.appendChild(pgEl); }
    function inv() {
      var s = G && G.ev && G.ev.sk, show = !!(s && s.key && s.st == 3) && mode == 'play' && !PZ;
      invEl.innerHTML = '<div class="mu" style="margin-bottom:4px">ИНВЕНТАРЬ</div><div style="font-size:30px;line-height:1">🗝️</div><div style="font-size:12px;margin-top:3px">Ключ от склада</div>'; invEl.style.display = show ? 'block' : 'none';
    }
    function prog() {
      var s = G && G.ev && G.ev.sk, st = s ? s.st | 0 : 0, show = st == 4 && mode == 'play' && !PZ && inStore();
      if (!show) { pgEl.style.display = 'none'; return; }
      var n = s.cl.length, pc = Math.round(n / TOTAL * 100);
      pgEl.innerHTML = '<b>Уборка склада</b> <span class="mu">' + n + ' / ' + TOTAL + '</span><div style="margin-top:6px;height:7px;border-radius:5px;background:rgba(255,255,255,.12);overflow:hidden"><div style="height:100%;width:' + pc + '%;background:linear-gradient(90deg,#22d3ee,#a855f7)"></div></div><div class="mu" style="margin-top:5px">E — убрать · мусор, паутина, пятна, пыль</div>';
      pgEl.style.display = 'block';
    }
    setInterval(function () { safe(function () { inv(); prog(); }); }, 400);

    /* ---------- триггер события и горячая клавиша ---------- */
    var idle = 0, need = 20 + Math.random() * 40;
    setInterval(function () {
      safe(function () {
        if (!G || G.sb || !inGame() || PZ || dark() || (typeof CALL !== 'undefined' && CALL)) return; var s = SK(); if (s.st || G.day < 5 || [10, 20, 30].indexOf(G.day) >= 0) return;
        if (P.z > 6.5) return; idle++; if (idle >= need) start();
      });
    }, 1000);
    addEventListener('keydown', function (e) { if (e.ctrlKey && e.shiftKey && e.code == 'KeyK' && !e.repeat) { e.preventDefault(); if (inGame()) { var s = SK(); if (!s.st) start(); else toast('Состояние склада: ' + s.st); } } });

    /* ---------- встряска камеры ---------- */
    var _rend = R.render.bind(R), shx = 0, shy = 0;
    R.render = function (s, c) {
      if (shake > 0 && c === cam) {
        shx = (Math.random() - .5) * .22 * Math.min(1, shake); shy = (Math.random() - .5) * .16 * Math.min(1, shake);
        cam.position.x += shx; cam.position.y += shy; var r = _rend(s, c); cam.position.x -= shx; cam.position.y -= shy; return r;
      }
      return _rend(s, c);
    };

    /* ============ ПОКАДРОВАЯ АНИМАЦИЯ ============ */
    var motes = (function () {
      var n = 220, pos = new Float32Array(n * 3), g = new THREE.BufferGeometry(); for (var i = 0; i < n; i++) { pos[i * 3] = rs(X0 + .3, X1 - .3); pos[i * 3 + 1] = rs(.4, RH - .6); pos[i * 3 + 2] = rs(Z0 + .3, Z1 - .3); }
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      var p = new THREE.Points(g, new THREE.PointsMaterial({ map: dotTex(), color: 0xfff0d0, size: .09, transparent: true, opacity: .75, depthWrite: false, blending: THREE.AdditiveBlending })); p.frustumCulled = false; rm.add(p); p.userData.n = n; return p;
    })();
    var last = performance.now(), fl = 0;
    (function loop(now) {
      requestAnimationFrame(loop);
      var dt = Math.min(.05, (now - last) / 1000 || .016); last = now; if (!G || mode == 'menu') return;
      var s = G.ev && G.ev.sk, st = s ? s.st | 0 : 0; if (!st) return;
      if (shake > 0) shake = Math.max(0, shake - dt * 1.1);
      /* падение обломков */
      if (fallT >= 0) {
        fallT += dt; var all = 1;
        debris.forEach(function (r) { var t = r.userData.t; if (t.done) return; all = 0; if (t.wait > 0) { t.wait -= dt; return; } t.vy -= 18 * dt; r.position.y += t.vy * dt; r.rotation.x += dt * 2; r.rotation.z += dt * 1.5; if (r.position.y <= t.y) { r.position.y = t.y; if (Math.abs(t.vy) > 2) t.vy = -t.vy * .28; else { t.done = 1; t.vy = 0; } } });
        if (all || fallT > 5) { fallT = -1; debris.forEach(function (r) { var t = r.userData.t; r.position.y = t.y; t.done = 1; }); }
      }
      dustSp.forEach(function (sp) { var u = sp.userData; if (u.a > 0) { u.a = Math.max(0, u.a - dt * .22); sp.material.opacity = Math.min(.5, u.a * .6); sp.scale.addScalar(dt * .35); sp.position.y += dt * .08; } });
      /* дверь */
      if (doorAnim) { doorAnim.t += dt / 1.3; var k = Math.min(1, doorAnim.t), e = 1 - Math.pow(1 - k, 3); door.rotation.y = doorAnim.to * e; if (k >= 1) doorAnim = null; }
      /* прочие анимации */
      for (var i = animL.length - 1; i >= 0; i--) {
        var a = animL[i]; a.t += dt;
        if (a.kind == 'drawer') { var u = Math.min(1, a.t / .35); a.o.position.z = a.from + (a.to - a.from) * (1 - Math.pow(1 - u, 2)); if (u >= 1) { a.o.userData.moving = 0; animL.splice(i, 1); } }
        else if (a.kind == 'lock') { var u2 = Math.min(1, a.t / .6); lock.position.y = 1.62 - u2 * u2 * 1.2; lock.rotation.z = u2 * .6; if (u2 >= 1) { lock.visible = false; lock.position.y = 1.62; lock.rotation.z = 0; animL.splice(i, 1); } }
        else if (a.kind == 'lid') { var u3 = Math.min(1, a.t / .8); cLid.rotation.x = -1.9 * u3; if (u3 >= 1) animL.splice(i, 1); }
        else { var u4 = Math.min(1, a.t / .35); var sc = 1 - u4; a.o.scale.set(sc, sc, sc); a.o.position.y = (a.y0 || 0) + u4 * .6; if (u4 >= 1) { a.o.visible = false; a.o.scale.set(1, 1, 1); a.o.position.y = a.y0 || 0; animL.splice(i, 1); } }
      }
      /* склад: пылинки, мерцание, прогресс чистоты */
      if (rm.visible) {
        var cl = s.cl ? s.cl.length : 0, dirt = 1 - cl / TOTAL, p = motes.geometry.attributes.position, n = motes.userData.n, vis = Math.floor(n * (.12 + .88 * dirt));
        motes.geometry.setDrawRange(0, vis);
        for (var m = 0; m < vis; m++) { var ix = m * 3; p.array[ix] += Math.sin(now * .0004 + m) * dt * .08; p.array[ix + 1] += Math.cos(now * .0003 + m * 1.7) * dt * .06 - dt * .01; p.array[ix + 2] += Math.sin(now * .0005 + m * 2.3) * dt * .08; if (p.array[ix + 1] < .3) p.array[ix + 1] = RH - .8; }
        p.needsUpdate = true;
        fl -= dt; var base = st >= 5 ? 1.5 : 1.0 + (1 - dirt) * .35, f = 1;
        if (st < 5) { if (fl <= 0 && Math.random() < .012) fl = .12 + Math.random() * .25; f = fl > 0 ? .25 + Math.random() * .4 : 1 + Math.sin(now * .013) * .03; }
        lamp.intensity = base * f; lamp.color.setHex(st >= 5 ? 0xfff0d8 : 0xffc27a); bulb.material.color.setHex(f < .7 ? 0x6a5a40 : 0xffe2b0);
        grime.material.opacity = .15 + dirt * .55; beamM.opacity = .4 * (.5 + dirt * .5);
        if (st == 5) cGlow.material.opacity = .5 + Math.sin(now * .004) * .25;
      }
    })(last);

    window.__storage = { start: start, sync: sync, state: function () { return G && G.ev && G.ev.sk; }, total: TOTAL };
    console.log('[storage] готово, задач:', TOTAL);
  }

  var n = 0, iv = setInterval(function () {
    if (ready()) { clearInterval(iv); setTimeout(function () { try { go(); } catch (e) { console.error('[storage] init', e); } }, 2600); }
    else if (++n > 600) clearInterval(iv);
  }, 100);
})();
