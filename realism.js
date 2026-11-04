/* PC МАСТЕР — realism.js (подключать ПОСЛЕ всех остальных модулей, в самом конце)
   «Реализм» — три уровня (переключатель: пауза → «Реализм», или клавиша F8):
     0 — выкл (как раньше)
     1 — средний: рельеф (bump) на всех текстурах, реальные тени от солнца через окна (пятна света = настоящие тени
         окон и рам), больше предметов отбрасывают и принимают тени, мягче края теней, чёткие текстуры
     2 — высокий: + карта теней 4096 у солнца и мягкие тени от потолочных ламп над верстаком
   Если FPS падает — уровень снижается сам. Выбор запоминается. */
(function () {
  if (window.__realismLoaded) return;
  window.__realismLoaded = 1;

  function ready() {
    try { return typeof THREE !== 'undefined' && !!scene && !!cam && !!R && !!window.__W && !!window.__roomLoaded && !!window.__windowsLoaded && typeof opt === 'object'; } catch (e) { return false; }
  }
  function safe(f) { try { return f(); } catch (e) { console.error('[realism]', e); } }

  function go() {
    var LV = 2, NAMES = ['выкл', 'средний', 'высокий'];
    try { var sv = localStorage.getItem('pcrz'); if (sv !== null && sv !== '') LV = Math.max(0, Math.min(2, parseInt(sv, 10) || 0)); } catch (e) { }
    var seenMat = new WeakSet(), seenMesh = new WeakSet(), sun = null;

    /* ---------- общие ---------- */
    function findSun() {
      if (sun) return sun;
      scene.traverse(function (o) { if (!sun && o.isDirectionalLight) sun = o; });
      return sun;
    }
    function isFloorLike(o) {
      var p = o.geometry && o.geometry.parameters;
      return o.geometry && o.geometry.type == 'PlaneGeometry' && Math.abs(o.rotation.x + Math.PI / 2) < .05 && o.position.y < 1;
    }

    /* ---------- 1. материалы и тени ---------- */
    function sweep() {
      var maxA = R.capabilities.getMaxAnisotropy ? R.capabilities.getMaxAnisotropy() : 8;
      scene.traverse(function (o) {
        if (!o.isMesh || !o.material) return;
        var mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(function (mt) {
          if (!mt.isMeshStandardMaterial) return;
          if (!seenMat.has(mt)) {
            seenMat.add(mt);
            mt.__rz = { bump: mt.bumpMap, bs: mt.bumpScale };
            if (mt.map && mt.map.image && !mt.transparent && !mt.emissiveMap && !(mt.emissiveIntensity > 0) && !mt.bumpMap) {
              mt.__rz.can = 1; mt.__rz.fl = isFloorLike(o);
              if (mt.map.anisotropy < maxA) { mt.map.anisotropy = Math.min(maxA, 16); mt.map.needsUpdate = true; }
            }
          }
          var want = LV >= 1 && mt.__rz.can;
          if (want && !mt.bumpMap) { mt.bumpMap = mt.map; mt.bumpScale = mt.__rz.fl ? .55 : .3; mt.needsUpdate = true; }
          else if (!want && mt.__rz.can && mt.bumpMap === mt.map) { mt.bumpMap = null; mt.needsUpdate = true; }
        });
        if (!seenMesh.has(o)) {
          seenMesh.add(o);
          var std = mats.every(function (m) { return m.isMeshStandardMaterial && !m.transparent; });
          o.__rz = { c: o.castShadow, r: o.receiveShadow, set: 0 };
          if (std) {
            var g = o.geometry, t = g && g.type, big = false, small = false;
            if (g) {
              if (!g.boundingSphere) { try { g.computeBoundingSphere(); } catch (e) { } }
              var sc = Math.max(o.scale.x, o.scale.y, o.scale.z), r = g.boundingSphere ? g.boundingSphere.radius * sc : 1;
              small = r < .09;
              big = r > 5;
            }
            o.__rz.std = 1;
            o.__rz.cast = !isFloorLike(o) && !small && (t != 'PlaneGeometry' || big || o.__rz.c);
            o.__rz.recv = true;
          }
        }
        if (o.__rz && o.__rz.std) {
          if (LV >= 1) { if (o.__rz.cast) o.castShadow = true; o.receiveShadow = true; }
          else { o.castShadow = o.__rz.c; o.receiveShadow = o.__rz.r; }
        }
      });
      safe(applySun);
      safe(hidePatches);
      safe(applyLights);
    }

    /* ---------- 2. настоящее солнце: тени окон ---------- */
    function applySun() {
      var s = findSun(); if (!s) return;
      if (LV >= 1) {
        if (!s.castShadow) {
          s.castShadow = true;
          var c = s.shadow.camera; c.left = -13; c.right = 13; c.top = 13; c.bottom = -13; c.near = 5; c.far = 140; c.updateProjectionMatrix();
          s.shadow.mapSize.set(LV >= 2 ? 4096 : 2048, LV >= 2 ? 4096 : 2048);
          s.shadow.bias = -.0006; s.shadow.normalBias = .05; s.shadow.radius = 3;
          if (s.shadow.map) { s.shadow.map.dispose(); s.shadow.map = null; }
        } else if (s.shadow.mapSize.x != (LV >= 2 ? 4096 : 2048)) {
          s.shadow.mapSize.set(LV >= 2 ? 4096 : 2048, LV >= 2 ? 4096 : 2048);
          if (s.shadow.map) { s.shadow.map.dispose(); s.shadow.map = null; }
        }
      } else if (s.castShadow) { s.castShadow = false; if (s.shadow.map) { s.shadow.map.dispose(); s.shadow.map = null; } }
      /* мягкие тени у прожекторов */
      scene.traverse(function (o) { if (o.isSpotLight && o.shadow && !o.__rzs) { o.__rzs = 1; o.shadow.radius = Math.max(o.shadow.radius, 5); o.shadow.normalBias = Math.max(o.shadow.normalBias, .03); } });
    }
    function hidePatches() {   /* «нарисованные» солнечные пятна world.js больше не нужны — есть настоящие тени */
      scene.traverse(function (o) {
        if (!o.isMesh || !o.material || !o.material.map) return;
        if (o.material.blending === THREE.AdditiveBlending && o.renderOrder === 2 && o.frustumCulled === false && o.geometry && o.geometry.type == 'BufferGeometry' && o.geometry.attributes.position && o.geometry.attributes.position.count === 4) {
          o.material.colorWrite = !(LV >= 1);
        }
      });
    }

    /* ---------- 3. свет ламп: мягкие тени под потолочными лампами (уровень 2) ---------- */
    var spLow = false;
    function applyLights() {
      scene.traverse(function (o) {
        /* основной прожектор стоял ВЫШЕ потолка — с настоящими тенями потолок закрыл бы его. Опускаем под потолок (y 7.8). */
        if (o.isSpotLight && !o.__rzlow && o.position.y > 7.7) { o.__rzlow = 1; o.__rzy = o.position.y; o.position.y = 7.45; }
        if (o.isPointLight && o.position.y > 6.5 && o.position.y < 7.7 && !o.__rzp) {
          var over = (o.position.x === -4 || o.position.x === 4) && o.position.z === -4;   // две лампы над верстаком
          o.__rzp = 1; o.__rzOn = over;
        }
        if (o.isPointLight && o.__rzOn) {
          var want = LV >= 2;
          if (o.castShadow !== want) {
            o.castShadow = want;
            if (want) { o.shadow.mapSize.set(1024, 1024); o.shadow.camera.near = .6; o.shadow.camera.far = 17; o.shadow.bias = -.002; o.shadow.normalBias = .04; o.shadow.radius = 4; }
            if (o.shadow.map) { o.shadow.map.dispose(); o.shadow.map = null; }
          }
        }
      });
    }

    /* ---------- переключатель и авто-снижение ---------- */
    function draw() { try { localStorage.setItem('pcrz', String(LV)); } catch (e) { } try { if (typeof pauseDraw == 'function' && document.getElementById('pz')) pauseDraw(); } catch (e) { } }
    function set(v) { LV = v; sweep(); draw(); }
    window.__rz = { get: function () { return LV; }, name: function () { return NAMES[LV]; }, set: set, cycle: function () { set((LV + 1) % 3); try { toast('Реализм: ' + NAMES[LV]); } catch (e) { } } };
    addEventListener('keydown', function (e) { if (e.code == 'F8' && !e.repeat) { e.preventDefault(); window.__rz.cycle(); } });

    var last = performance.now(), acc = 0, n = 0;
    (function loop(now) {
      requestAnimationFrame(loop);
      var dt = (now - last) / 1000; last = now;
      if (!(dt > 0) || dt > .25 || mode == 'menu') { acc = 0; n = 0; return; }
      acc += dt; n++;
      if (n >= 180) { if (n / acc < 36 && LV > 0) { set(LV - 1); try { toast('Реализм снижен до «' + NAMES[LV] + '» — низкий FPS'); } catch (e) { } } acc = 0; n = 0; }
    })(last);

    setTimeout(sweep, 600); setInterval(sweep, 3000);
    console.log('[realism] готово, уровень', NAMES[LV]);
  }

  if (ready()) setTimeout(go, 1200);
  else { var t = 0, iv = setInterval(function () { if (ready()) { clearInterval(iv); setTimeout(go, 1200); } else if (++t > 600) clearInterval(iv); }, 100); }
})();
