/* PC МАСТЕР — look.js (подключать ПОСЛЕ detail.js, в самом конце)
   «Красота» без тяжёлых эффектов (почти не нагружает видеокарту):
   • новая текстура пола: паркет с волокнами, сучками, стыками досок + карта шероховатости и рельефа
   • мягкие контактные тени: тёмные подтёки у основания стен и под мебелью — предметы «садятся» на пол, появляется объём
   • объёмный свет: лучи солнца из окон (зависят от времени суток и погоды), с пылью в луче
   Включается/выключается в паузе («Красота»). */
(function () {
  if (window.__lookLoaded) return;
  window.__lookLoaded = 1;
  function ready() { try { return typeof THREE !== 'undefined' && !!scene && !!R && !!window.__W && !!window.__roomLoaded && !!window.__windowsLoaded; } catch (e) { return false; } }
  function safe(f) { try { return f(); } catch (e) { console.error('[look]', e); } }

  function go() {
    var PI = Math.PI, W3 = window.__W, ON = true;
    try { if (localStorage.getItem('pclook') === '0') ON = false; } catch (e) { }
    var deco = new THREE.Group(); scene.add(deco);
    function cvs(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
    function rnd(a, b) { return a + Math.random() * (b - a); }

    /* ---------- 1. паркет ---------- */
    function parquet() {
      var S = 1024, PW = 128, N = S / PW;
      var cA = cvs(S, S), xa = cA.getContext('2d'), cR = cvs(S, S), xr = cR.getContext('2d'), cB = cvs(S, S), xb = cB.getContext('2d');
      xa.fillStyle = '#2b1a0e'; xa.fillRect(0, 0, S, S); xr.fillStyle = '#ffffff'; xr.fillRect(0, 0, S, S); xb.fillStyle = '#202020'; xb.fillRect(0, 0, S, S);
      for (var c = 0; c < N; c++) {
        var x0 = c * PW, off = Math.floor(Math.random() * S), hue = rnd(24, 34), sat = rnd(42, 58), lit = rnd(38, 52);
        for (var rep = -1; rep <= 1; rep += 1) {
          var y0 = off + rep * S;                                  // одна доска длиной в весь тайл, сдвинутая; стык — на y0
          xa.save(); xa.beginPath(); xa.rect(x0 + 2, 0, PW - 4, S); xa.clip();
          xr.save(); xr.beginPath(); xr.rect(x0 + 2, 0, PW - 4, S); xr.clip();
          xb.save(); xb.beginPath(); xb.rect(x0 + 2, 0, PW - 4, S); xb.clip();
          /* доска: заливка + продольный градиент освещения */
          var g = xa.createLinearGradient(x0, 0, x0 + PW, 0);
          g.addColorStop(0, 'hsl(' + hue + ',' + sat + '%,' + (lit + 3) + '%)'); g.addColorStop(.5, 'hsl(' + hue + ',' + sat + '%,' + lit + '%)'); g.addColorStop(1, 'hsl(' + hue + ',' + sat + '%,' + (lit - 3) + '%)');
          xa.fillStyle = g; xa.fillRect(x0, y0, PW, S);
          xr.fillStyle = 'rgb(' + Math.floor(rnd(95, 150)) + ',' + Math.floor(rnd(95, 150)) + ',' + Math.floor(rnd(95, 150)) + ')'; xr.fillRect(x0, y0, PW, S);
          xb.fillStyle = '#9a9a9a'; xb.fillRect(x0, y0, PW, S);
          /* волокна */
          for (var k = 0; k < 46; k++) {
            var gx = x0 + rnd(4, PW - 4), amp = rnd(1, 4), fr = rnd(.004, .012), ph = rnd(0, 6), dark = Math.random() < .7;
            xa.strokeStyle = dark ? 'rgba(52,28,10,' + rnd(.05, .17) + ')' : 'rgba(255,214,160,' + rnd(.04, .1) + ')'; xa.lineWidth = rnd(.6, 2);
            xb.strokeStyle = dark ? 'rgba(60,60,60,' + rnd(.15, .35) + ')' : 'rgba(210,210,210,' + rnd(.1, .2) + ')'; xb.lineWidth = rnd(.6, 1.6);
            xa.beginPath(); xb.beginPath();
            for (var y = y0; y < y0 + S; y += 16) { var xx = gx + Math.sin(y * fr + ph) * amp; if (y == y0) { xa.moveTo(xx, y); xb.moveTo(xx, y); } else { xa.lineTo(xx, y); xb.lineTo(xx, y); } }
            xa.stroke(); xb.stroke();
          }
          /* сучок */
          if (Math.random() < .45) {
            var kx = x0 + rnd(30, PW - 30), ky = y0 + rnd(60, S - 60);
            for (var rr = 14; rr > 2; rr -= 3) { xa.fillStyle = 'rgba(50,26,8,' + (.07 + (14 - rr) * .018) + ')'; xa.beginPath(); xa.ellipse(kx, ky, rr * .75, rr * 1.9, 0, 0, 7); xa.fill(); xb.fillStyle = 'rgba(70,70,70,.2)'; xb.beginPath(); xb.ellipse(kx, ky, rr * .75, rr * 1.9, 0, 0, 7); xb.fill(); }
          }
          /* мелкая крапинка */
          for (k = 0; k < 220; k++) { xa.fillStyle = 'rgba(' + (Math.random() < .5 ? '0,0,0' : '255,230,190') + ',' + rnd(.02, .06) + ')'; xa.fillRect(x0 + rnd(0, PW), y0 + rnd(0, S), 2, 2); }
          xa.restore(); xr.restore(); xb.restore();
          /* стык досок: тёмная и грубая линия, рельеф вниз */
          xa.fillStyle = '#24150a'; xa.fillRect(x0 + 2, y0 - 1, PW - 4, 3); xr.fillStyle = '#ffffff'; xr.fillRect(x0 + 2, y0 - 1, PW - 4, 3); xb.fillStyle = '#202020'; xb.fillRect(x0 + 2, y0 - 1, PW - 4, 3);
        }
      }
      function T(c, enc) { var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16; if (enc) t.encoding = THREE.sRGBEncoding; return t; }
      return { map: T(cA, true), rough: T(cR), bump: T(cB) };
    }
    var floorMat = null, oldFloor = null;
    function findFloor() {
      var best = null, ba = 0;
      scene.children.forEach(function (o) {
        if (!o.isMesh || !o.geometry || o.geometry.type != 'PlaneGeometry' || !o.material || !o.material.isMeshStandardMaterial) return;
        var p = o.geometry.parameters, w = p.width * o.scale.x, h = p.height * o.scale.y;
        if (Math.abs(o.rotation.x + PI / 2) < .05 && o.position.y < .2 && w > 12 && w < 30 && Math.abs(o.position.x) < 3 && Math.abs(o.position.z) < 3 && w * h > ba) { ba = w * h; best = o; }
      });
      return best;
    }
    var floor = findFloor();
    if (floor) {
      safe(function () {
        var mt = floor.material, rep = mt.map ? mt.map.repeat.clone() : new THREE.Vector2(10, 8), p = parquet();
        oldFloor = { map: mt.map, rough: mt.roughness, metal: mt.metalness, bump: mt.bumpMap, bs: mt.bumpScale, rmap: mt.roughnessMap };
        floorMat = { map: p.map, rmap: p.rough, bump: p.bump };
        [p.map, p.rough, p.bump].forEach(function (t) { t.repeat.copy(rep); });
        applyFloor();
      });
    }
    function applyFloor() {
      if (!floor || !floorMat) return; var mt = floor.material;
      if (ON) { mt.map = floorMat.map; mt.roughnessMap = floorMat.rmap; mt.bumpMap = floorMat.bump; mt.bumpScale = 1.2; mt.roughness = .8; mt.metalness = .06; mt.color.setHex(0xffffff); }
      else { mt.map = oldFloor.map; mt.roughnessMap = oldFloor.rmap || null; mt.bumpMap = oldFloor.bump || null; mt.bumpScale = oldFloor.bs; mt.roughness = oldFloor.rough; mt.metalness = oldFloor.metal; }
      mt.needsUpdate = true;
    }

    /* ---------- 2. контактные тени ---------- */
    var gc = cvs(4, 64), gx = gc.getContext('2d'), gg = gx.createLinearGradient(0, 0, 0, 64);   // v=1 (верх текстуры) — у стены
    gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(.35, 'rgba(0,0,0,.14)'); gg.addColorStop(1, 'rgba(0,0,0,.55)'); gx.fillStyle = gg; gx.fillRect(0, 0, 4, 64);
    var wallTex = new THREE.CanvasTexture(gc);
    var sc = cvs(128, 128), sx = sc.getContext('2d'); sx.filter = 'blur(13px)'; sx.fillStyle = 'rgba(0,0,0,.75)'; sx.fillRect(30, 30, 68, 68);
    var softTex = new THREE.CanvasTexture(sc);
    function decalMat(t) { var m = new THREE.MeshBasicMaterial({ map: t, color: 0x000000, transparent: true, depthWrite: false }); m.polygonOffset = true; m.polygonOffsetFactor = -3; m.polygonOffsetUnits = -3; return m; }
    var wm = decalMat(wallTex), sm = decalMat(softTex);
    [[0, 0, -8, 20], [-PI / 2, 10, 0, 16], [PI / 2, -10, 0, 16], [PI, 0, 8, 20]].forEach(function (a) {   // [угол, x, z, длина]
      var g = new THREE.Group(); g.rotation.y = a[0]; g.position.set(a[1], 0, a[2]);
      var m = new THREE.Mesh(new THREE.PlaneGeometry(a[3], 1.05), wm); m.rotation.x = -PI / 2; m.position.set(0, .016, a[0] === 0 || a[0] === PI ? (a[0] === 0 ? .525 : -.525) * 1 : 0);
      /* внутрь комнаты от стены: локальная ось z группы после поворота смотрит в комнату */
      m.position.set(0, .016, .525); g.add(m); deco.add(g);
    });
    function blob(x, z, w, d, op) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), sm); m.rotation.x = -PI / 2; m.position.set(x, .018, z); m.material = m.material; deco.add(m); m.userData.op = op; return m;
    }
    [[-6, 6.75, 4.4, 2.0], [6, 6.7, 4.6, 2.1], [6.3, -3, 1.8, 1.8], [9.2, 4.2, 1.7, 1.7], [-9.1, 6.8, 1.5, 1.5], [9.2, 6.8, 1.5, 1.5], [9.2, -6.6, 1.5, 1.5], [0, 2, 6.4, 2.3], [0, -5, 7.2, 3.5], [-7.2, -7.35, 2.0, 1.8], [-1.3, 1.9, 1.6, 1.2]].forEach(function (a) { blob(a[0], a[1], a[2], a[3]); });

    /* ---------- 3. лучи солнца из окон ---------- */
    var bc = cvs(64, 8), bxx = bc.getContext('2d');
    for (var i = 0; i < 64; i++) { var a = Math.pow(1 - i / 63, 1.4) * Math.min(1, i / 4); bxx.fillStyle = 'rgba(255,236,190,' + a.toFixed(3) + ')'; bxx.fillRect(i, 0, 1, 8); }
    var beamTex = new THREE.CanvasTexture(bc);
    var beamMat = new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    var beams = [];
    [-1, 1].forEach(function (sg) {
      for (var k = 0; k < 4; k++) {
        var xi = sg * (3.75 + k * 1.5), pos = new Float32Array(12), g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 1, 0, 0, 1, 0, 1, 1]), 2)); g.setIndex([0, 1, 2, 0, 2, 3]);
        var m = new THREE.Mesh(g, beamMat); m.frustumCulled = false; m.renderOrder = 3; m.visible = false; deco.add(m); beams.push({ m: m, p: pos, x: xi });
      }
    });
    function updBeams() {
      var sd = W3.sunDir, env = W3.ENV, wx = W3.WX;
      var up = ON && sd && env && sd.y > .14 && sd.z > .12 && env.dayF > .3;
      var amt = up ? Math.min(1, (sd.y - .14) * 4) * Math.min(1, (sd.z - .12) * 4) * env.dayF * (1 - (wx ? wx.cloud : 0) * .9) : 0;
      beamMat.opacity = .2 * amt;
      beams.forEach(function (b) {
        b.m.visible = amt > .02; if (!(amt > .02)) return;
        var yt = 5.8, yb = 1.5, tt = yt / sd.y, tb = yb / sd.y, p = b.p;
        p[0] = b.x; p[1] = yt; p[2] = 8;
        p[3] = b.x; p[4] = yb; p[5] = 8;
        p[6] = b.x - sd.x * tb; p[7] = .03; p[8] = Math.max(-7.5, 8 - sd.z * tb);
        p[9] = b.x - sd.x * tt; p[10] = .03; p[11] = Math.max(-7.5, 8 - sd.z * tt);
        b.m.geometry.attributes.position.needsUpdate = true;
      });
    }
    setInterval(function () { safe(updBeams); }, 400); safe(updBeams);

    /* ---------- переключатель ---------- */
    function apply() { deco.visible = ON; applyFloor(); try { localStorage.setItem('pclook', ON ? '1' : '0'); } catch (e) { } updBeams(); }
    window.__look = { get: function () { return ON; }, set: function (v) { ON = !!v; apply(); }, toggle: function () { ON = !ON; apply(); try { toast('Красота: ' + (ON ? 'вкл' : 'выкл')); } catch (e) { } } };
    apply();
    console.log('[look] готово');
  }

  if (ready()) setTimeout(go, 1800);
  else { var t = 0, iv = setInterval(function () { if (ready()) { clearInterval(iv); setTimeout(go, 1800); } else if (++t > 600) clearInterval(iv); }, 100); }
})();
