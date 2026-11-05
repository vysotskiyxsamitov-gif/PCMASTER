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
      var S = 1024, PW = 128, N = S / PW, TP = Math.PI * 2;
      var cA = cvs(S, S), xa = cA.getContext('2d'), cR = cvs(S, S), xr = cR.getContext('2d'), cB = cvs(S, S), xb = cB.getContext('2d');
      xa.fillStyle = '#4a2e18'; xa.fillRect(0, 0, S, S); xr.fillStyle = '#ffffff'; xr.fillRect(0, 0, S, S); xb.fillStyle = '#303030'; xb.fillRect(0, 0, S, S);
      for (var c = 0; c < N; c++) {
        var x0 = c * PW, off = Math.floor(Math.random() * S), hue = rnd(26, 33), sat = rnd(38, 50), lit = rnd(40, 50);
        var fib = [], k;
        for (k = 0; k < 26; k++) fib.push({ gx: rnd(6, PW - 6), amp: rnd(1.5, 4), n: Math.floor(rnd(2, 6)), ph: rnd(0, 6.28), a: rnd(.025, .07), w: rnd(1.5, 4), dark: Math.random() < .65 });
        var kx = Math.random() < .4 ? { x: rnd(34, PW - 34), y: rnd(80, S - 80) } : null;
        for (var rep = -1; rep <= 1; rep++) {
          var y0 = off + rep * S;
          [xa, xr, xb].forEach(function (x) { x.save(); x.beginPath(); x.rect(x0 + 1, y0, PW - 2, S); x.clip(); });
          var g = xa.createLinearGradient(x0, 0, x0 + PW, 0);
          g.addColorStop(0, 'hsl(' + hue + ',' + sat + '%,' + (lit + 2) + '%)'); g.addColorStop(.5, 'hsl(' + hue + ',' + sat + '%,' + lit + '%)'); g.addColorStop(1, 'hsl(' + hue + ',' + sat + '%,' + (lit - 2) + '%)');
          xa.fillStyle = g; xa.fillRect(x0, y0, PW, S);
          var tone = xa.createLinearGradient(0, y0, 0, y0 + S); tone.addColorStop(0, 'rgba(255,230,190,.05)'); tone.addColorStop(.5, 'rgba(0,0,0,.04)'); tone.addColorStop(1, 'rgba(255,230,190,.05)'); xa.fillStyle = tone; xa.fillRect(x0, y0, PW, S);
          var rv = Math.floor(rnd(120, 150)); xr.fillStyle = 'rgb(' + rv + ',' + rv + ',' + rv + ')'; xr.fillRect(x0, y0, PW, S);
          xb.fillStyle = '#8c8c8c'; xb.fillRect(x0, y0, PW, S);
          /* мягкие продольные волокна: периодичны по высоте тайла (без шва) */
          xa.lineCap = 'round';
          fib.forEach(function (f) {
            xa.strokeStyle = f.dark ? 'rgba(70,38,14,' + f.a + ')' : 'rgba(255,225,175,' + (f.a * .7) + ')'; xa.lineWidth = f.w;
            xa.beginPath();
            for (var y = y0 - 8; y <= y0 + S + 8; y += 8) { var xx = x0 + f.gx + Math.sin((y - y0) * TP * f.n / S + f.ph) * f.amp; if (y == y0 - 8) xa.moveTo(xx, y); else xa.lineTo(xx, y); }
            xa.stroke();
          });
          if (kx) {
            var ky = y0 + kx.y;
            for (var rr = 12; rr > 2; rr -= 2) { xa.fillStyle = 'rgba(60,32,12,.06)'; xa.beginPath(); xa.ellipse(x0 + kx.x, ky, rr * .8, rr * 2, 0, 0, 7); xa.fill(); }
            xb.fillStyle = 'rgba(60,60,60,.12)'; xb.beginPath(); xb.ellipse(x0 + kx.x, ky, 7, 16, 0, 0, 7); xb.fill();
          }
          [xa, xr, xb].forEach(function (x) { x.restore(); });
          /* стык: тонкая мягкая канавка, ниже блик от фаски */
          var jg = xa.createLinearGradient(0, y0 - 3, 0, y0 + 3); jg.addColorStop(0, 'rgba(30,16,6,0)'); jg.addColorStop(.45, 'rgba(30,16,6,.55)'); jg.addColorStop(.6, 'rgba(255,230,190,.14)'); jg.addColorStop(1, 'rgba(255,230,190,0)');
          xa.fillStyle = jg; xa.fillRect(x0 + 1, y0 - 3, PW - 2, 6);
          var jb = xb.createLinearGradient(0, y0 - 3, 0, y0 + 3); jb.addColorStop(0, 'rgba(48,48,48,0)'); jb.addColorStop(.5, 'rgba(48,48,48,.9)'); jb.addColorStop(1, 'rgba(48,48,48,0)');
          xb.fillStyle = jb; xb.fillRect(x0 + 1, y0 - 3, PW - 2, 6);
        }
      }
      /* мягкая грань между рядами досок */
      for (c = 1; c < N; c++) { var gl = xa.createLinearGradient(c * PW - 3, 0, c * PW + 3, 0); gl.addColorStop(0, 'rgba(30,16,6,0)'); gl.addColorStop(.5, 'rgba(30,16,6,.5)'); gl.addColorStop(1, 'rgba(30,16,6,0)'); xa.fillStyle = gl; xa.fillRect(c * PW - 3, 0, 6, S); xb.fillStyle = 'rgba(48,48,48,.5)'; xb.fillRect(c * PW - 1, 0, 2, S); }
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
      if (ON) { mt.map = floorMat.map; mt.roughnessMap = floorMat.rmap; mt.bumpMap = floorMat.bump; mt.bumpScale = .35; mt.roughness = .62; mt.metalness = .06; mt.color.setHex(0xffffff); }
      else { mt.map = oldFloor.map; mt.roughnessMap = oldFloor.rmap || null; mt.bumpMap = oldFloor.bump || null; mt.bumpScale = oldFloor.bs; mt.roughness = oldFloor.rough; mt.metalness = oldFloor.metal; }
      mt.needsUpdate = true;
    }

    /* ---------- 2. контактные тени ---------- */
    var gc = cvs(4, 64), gx = gc.getContext('2d'), gg = gx.createLinearGradient(0, 0, 0, 64);   // v=1 (верх текстуры) — у стены
    gg.addColorStop(0, 'rgba(0,0,0,.55)'); gg.addColorStop(.65, 'rgba(0,0,0,.14)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); gx.fillStyle = gg; gx.fillRect(0, 0, 4, 64);
    var wallTex = new THREE.CanvasTexture(gc);
    var sc = cvs(128, 128), sx = sc.getContext('2d'); sx.filter = 'blur(13px)'; sx.fillStyle = 'rgba(0,0,0,.75)'; sx.fillRect(30, 30, 68, 68);
    var softTex = new THREE.CanvasTexture(sc);
    function decalMat(t) { var m = new THREE.MeshBasicMaterial({ map: t, color: 0x000000, transparent: true, depthWrite: false }); m.polygonOffset = true; m.polygonOffsetFactor = -3; m.polygonOffsetUnits = -3; return m; }
    var wm = decalMat(wallTex), sm = decalMat(softTex);
    [[0, 0, -8, 20], [-PI / 2, 10, 0, 16], [PI / 2, -10, 0, 16], [PI, 0, 8, 20]].forEach(function (a) {   // [угол, x, z, длина]
      var g = new THREE.Group(); g.rotation.y = a[0]; g.position.set(a[1], 0, a[2]);
      var m = new THREE.Mesh(new THREE.PlaneGeometry(a[3], 1.05), wm); m.rotation.x = -PI / 2;
      m.position.set(0, .016, .525);   /* локальная ось z группы после поворота смотрит внутрь комнаты */
      g.add(m); deco.add(g);
    });
    function blob(x, z, w, d, op) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), sm); m.rotation.x = -PI / 2; m.position.set(x, .018, z); m.material = m.material; deco.add(m); m.userData.op = op; return m;
    }
    [[-6, 6.75, 4.4, 2.0], [6, 6.7, 4.6, 2.1], [6.3, -3, 1.8, 1.8], [9.2, 4.2, 1.7, 1.7], [-9.1, 6.8, 1.5, 1.5], [9.2, 6.8, 1.5, 1.5], [9.2, -6.6, 1.5, 1.5], [0, 2, 6.4, 2.3], [0, -5, 7.2, 3.5], [-7.2, -7.35, 2.0, 1.8], [-1.3, 1.9, 1.6, 1.2]].forEach(function (a) { blob(a[0], a[1], a[2], a[3]); });

    /* ---------- 3. лучи солнца из окон ---------- */
    var bc = cvs(64, 64), bxx = bc.getContext('2d');
    for (var i = 0; i < 64; i++) for (var j = 0; j < 64; j++) { var a = Math.pow(1 - i / 63, 1.4) * Math.min(1, i / 8) * Math.pow(Math.sin(Math.PI * (j + .5) / 64), 1.2); bxx.fillStyle = 'rgba(255,236,190,' + a.toFixed(3) + ')'; bxx.fillRect(i, j, 1, 1); }
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
      beamMat.opacity = .16 * amt;
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
