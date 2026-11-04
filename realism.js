/* PC МАСТЕР — realism.js (подключать ПОСЛЕ всех остальных модулей, в самом конце)
   «Реализм» — три уровня (переключатель: пауза → «Реализм», или клавиша F8):
     0 — выкл (как раньше)
     1 — средний: рельеф (bump) на всех текстурах, реальные тени от солнца через окна (пятна света = настоящие тени
         окон и рам), больше предметов отбрасывают и принимают тени, мягче края теней, чёткие текстуры
     2 — высокий: + настоящее отражение комнаты в полу (зеркальный проход рендера с размытием и Френелем)
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
    var seenMat = new WeakSet(), seenMesh = new WeakSet(), sun = null, floor = null, ovl = null, rt = null, vcam = null;

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

    /* ---------- 3. отражение в полу ---------- */
    var refl = { M: new THREE.Matrix4(), N: new THREE.Vector3(0, 1, 0), P: new THREE.Vector3(), cw: new THREE.Vector3(), v: new THREE.Vector3(), la: new THREE.Vector3(), tg: new THREE.Vector3(), rm: new THREE.Matrix4(), pl: new THREE.Plane(), cp: new THREE.Vector4(), q: new THREE.Vector4(), bs: new THREE.Vector2(), dir: new THREE.Vector3() };
    var fy = 0;
    function findFloor() {
      if (floor) return floor;
      var best = 0;
      scene.children.forEach(function (o) {
        if (o.isMesh && isFloorLike(o) && o.parent === scene) {
          var p = o.geometry.parameters, a = (p.width || 0) * (p.height || 0) * o.scale.x * o.scale.y;
          if (a > best && a < 700 && Math.abs(o.position.x) < 3 && Math.abs(o.position.z) < 3 && (p.width * o.scale.x) > 12) { best = a; floor = o; }
        }
      });
      return floor;
    }
    function buildOverlay() {
      var f = findFloor(); if (!f) return false;
      var p = f.geometry.parameters;
      fy = f.position.y + .004;
      var mat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false,
        uniforms: { tRef: { value: null }, tm: { value: new THREE.Matrix4() }, k: { value: .38 } },
        vertexShader: 'uniform mat4 tm; varying vec4 vUv; varying vec3 vView; void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vUv = tm * wp; vView = cameraPosition - wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }',
        fragmentShader: 'uniform sampler2D tRef; uniform float k; varying vec4 vUv; varying vec3 vView; void main(){ vec3 v = normalize(vView); float f = pow(1.0 - clamp(v.y, 0.0, 1.0), 3.0); vec4 c = texture2DProj(tRef, vUv, 1.6); float a = k * (0.22 + 0.78 * f); gl_FragColor = vec4(c.rgb, a); }'
      });
      ovl = new THREE.Mesh(new THREE.PlaneGeometry(p.width, p.height, 1, 1), mat);
      ovl.rotation.copy(f.rotation); ovl.scale.copy(f.scale); ovl.position.set(f.position.x, fy, f.position.z);
      ovl.renderOrder = 1; ovl.frustumCulled = false; ovl.visible = false; scene.add(ovl);
      vcam = new THREE.PerspectiveCamera();
      return true;
    }
    function makeRT() {
      var s = R.getDrawingBufferSize(refl.bs), w = Math.max(256, Math.floor(s.x * .5)), h = Math.max(144, Math.floor(s.y * .5));
      if (rt && Math.abs(rt.width - w) < 40 && Math.abs(rt.height - h) < 40) return;
      if (rt) rt.dispose();
      rt = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, generateMipmaps: true });
      rt.texture.encoding = THREE.sRGBEncoding;
      ovl.material.uniforms.tRef.value = rt.texture;
    }
    function reflectPass() {
      var r = refl;
      cam.updateMatrixWorld(true);
      r.P.set(0, fy, 0); r.cw.setFromMatrixPosition(cam.matrixWorld);
      r.v.subVectors(r.P, r.cw);
      if (r.v.dot(r.N) > 0) return false;                      // камера под полом
      cam.getWorldDirection(r.dir); if (r.dir.y > .6) return false; // смотрим вверх — пола не видно
      r.rm.extractRotation(cam.matrixWorld);
      r.v.reflect(r.N).negate(); r.v.add(r.P);
      r.la.set(0, 0, -1).applyMatrix4(r.rm).add(r.cw);
      r.tg.subVectors(r.P, r.la); r.tg.reflect(r.N).negate(); r.tg.add(r.P);
      vcam.position.copy(r.v); vcam.up.set(0, 1, 0).applyMatrix4(r.rm).reflect(r.N); vcam.lookAt(r.tg);
      vcam.far = cam.far; vcam.near = cam.near;
      vcam.updateMatrixWorld(); vcam.projectionMatrix.copy(cam.projectionMatrix);
      var tm = ovl.material.uniforms.tm.value;
      tm.set(.5, 0, 0, .5, 0, .5, 0, .5, 0, 0, .5, .5, 0, 0, 0, 1);
      tm.multiply(vcam.projectionMatrix); tm.multiply(vcam.matrixWorldInverse);
      /* наклонная плоскость отсечения: всё, что ниже пола, не попадает в отражение */
      r.pl.setFromNormalAndCoplanarPoint(r.N, r.P); r.pl.applyMatrix4(vcam.matrixWorldInverse);
      r.cp.set(r.pl.normal.x, r.pl.normal.y, r.pl.normal.z, r.pl.constant);
      var pm = vcam.projectionMatrix, e = pm.elements;
      r.q.x = (Math.sign(r.cp.x) + e[8]) / e[0]; r.q.y = (Math.sign(r.cp.y) + e[9]) / e[5]; r.q.z = -1; r.q.w = (1 + e[10]) / e[14];
      r.cp.multiplyScalar(2 / r.cp.dot(r.q));
      e[2] = r.cp.x; e[6] = r.cp.y; e[10] = r.cp.z + 1 - .003; e[14] = r.cp.w;
      makeRT();
      var vis = ovl.visible, au = R.shadowMap.autoUpdate, tgt = R.getRenderTarget();
      ovl.visible = false; R.shadowMap.autoUpdate = false;
      R.setRenderTarget(rt); R.clear(); _render(scene, vcam);
      R.setRenderTarget(tgt); R.shadowMap.autoUpdate = au; ovl.visible = true;
      return true;
    }

    var _render = R.render.bind(R), inRef = 0, errs = 0;
    R.render = function (s, c) {
      if (LV >= 2 && s === scene && c === cam && !inRef && mode != 'menu') {
        try {
          if (!ovl && !buildOverlay()) { LV = 1; console.warn('[realism] пол не найден — отражения выключены'); }
          else if (ovl) {
            inRef = 1;
            var ok = reflectPass();
            inRef = 0;
            if (!ok) ovl.visible = false;
          }
        } catch (e) {
          inRef = 0; errs++; console.error('[realism] отражение отключено:', e);
          try { R.setRenderTarget(null); R.shadowMap.autoUpdate = true; } catch (e2) { }
          if (ovl) ovl.visible = false; LV = 1; draw();
        }
      } else if (ovl && (LV < 2 || mode == 'menu')) ovl.visible = false;
      return _render(s, c);
    };

    /* ---------- переключатель и авто-снижение ---------- */
    function draw() { try { localStorage.setItem('pcrz', String(LV)); } catch (e) { } try { if (typeof pauseDraw == 'function' && document.getElementById('pz')) pauseDraw(); } catch (e) { } }
    function set(v) { LV = v; if (LV < 2 && ovl) ovl.visible = false; sweep(); draw(); }
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
