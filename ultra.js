/* PC МАСТЕР — ultra.js: «ультра»-картинка поверх готовой сцены.
   • отражения на металле и полу (процедурная карта окружения)
   • лучи света из потолочных ламп и пылинки в воздухе
   • виньетка, максимальная чёткость текстур
   Включается/выключается в Настройках («Ультра-графика»). Если FPS падает — эффекты сами отключаются по шагам.
   Подключать ПОСЛЕ index.html, street.js и Room.js:  <script src="ultra.js"></script> */
(function () {
  if (window.__ultraLoaded) return;
  window.__ultraLoaded = 1;

  function ready() {
    try { return typeof THREE !== 'undefined' && !!scene && !!R && window.__roomLoaded && typeof opt === 'object'; } catch (e) { return false; }
  }
  function on() { return opt.ul !== 0; }

  function go() {
    var envTex = null, shafts = new THREE.Group(), dust = null, vig = null, level = 0;

    /* ---------- 1. карта окружения: светлая комната с неоновыми панелями ---------- */
    try {
      var es = new THREE.Scene();
      es.add(new THREE.Mesh(new THREE.BoxGeometry(20, 10, 16), new THREE.MeshBasicMaterial({ color: 0x1c212e, side: THREE.BackSide })));
      function panel(w, h, x, y, z, ry, hex, k) {
        var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), side: THREE.DoubleSide }));
        m.position.set(x, y, z); m.rotation.y = ry; es.add(m);
      }
      [-6, -2, 2, 6].forEach(function (x) { [-4, 0, 4].forEach(function (z) {
        var m = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff1dd).multiplyScalar(4) }));
        m.rotation.x = Math.PI / 2; m.position.set(x, 4.9, z); es.add(m);
      }); });
      panel(10, 2, 0, 1, -7.9, 0, 0x22d3ee, 3.5);     // неон задней стены
      panel(6, 2.5, -9.9, 0.5, 0, Math.PI / 2, 0xd946ef, 2.2);
      panel(6, 2.5, 9.9, 0.5, 0, Math.PI / 2, 0x22d3ee, 2.2);
      panel(8, 3, 0, 0, 7.9, 0, 0xffb066, 2.5);        // тёплый свет с улицы
      var pm = new THREE.PMREMGenerator(R);
      envTex = pm.fromScene(es, 0.03).texture;
      pm.dispose();
      scene.environment = on() ? envTex : null;
    } catch (e) { envTex = null; }

    /* ---------- 2. лучи света под потолочными лампами ---------- */
    var gc = document.createElement('canvas'); gc.width = 4; gc.height = 64;
    var gx = gc.getContext('2d'), gg = gx.createLinearGradient(0, 0, 0, 64);
    gg.addColorStop(0, 'rgba(255,244,224,.95)'); gg.addColorStop(.5, 'rgba(255,240,215,.28)'); gg.addColorStop(1, 'rgba(255,240,215,0)');
    gx.fillStyle = gg; gx.fillRect(0, 0, 4, 64);
    var shMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, opacity: .035, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    var shGeo = new THREE.CylinderGeometry(.75, 2.1, 7, 14, 1, true);
    [-6, -2, 2, 6].forEach(function (x) { [-4, 0, 4].forEach(function (z) {
      var c = new THREE.Mesh(shGeo, shMat); c.position.set(x, 4.3, z); c.renderOrder = 2; shafts.add(c);
    }); });
    scene.add(shafts);

    /* ---------- 3. пылинки в воздухе ---------- */
    var N = 260, pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), i;
    for (i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - .5) * 18; pos[i * 3 + 1] = .4 + Math.random() * 7; pos[i * 3 + 2] = (Math.random() - .5) * 14;
      vel[i * 3] = (Math.random() - .5) * .05; vel[i * 3 + 1] = (Math.random() - .5) * .03; vel[i * 3 + 2] = (Math.random() - .5) * .05;
    }
    var dc = document.createElement('canvas'); dc.width = dc.height = 32;
    var dx = dc.getContext('2d'), dg = dx.createRadialGradient(16, 16, 0, 16, 16, 16);
    dg.addColorStop(0, 'rgba(255,255,255,1)'); dg.addColorStop(1, 'rgba(255,255,255,0)'); dx.fillStyle = dg; dx.fillRect(0, 0, 32, 32);
    var dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    dust = new THREE.Points(dgeo, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(dc), size: .07, transparent: true, opacity: .28, color: 0xffe2b8, blending: THREE.AdditiveBlending, depthWrite: false }));
    dust.frustumCulled = false; scene.add(dust);

    /* ---------- 4. виньетка ---------- */
    try {
      vig = document.createElement('div');
      vig.style.cssText = 'position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 55%,rgba(0,0,0,.45) 100%)';
      R.domElement.parentNode.insertBefore(vig, R.domElement.nextSibling);
    } catch (e) { vig = null; }

    /* ---------- 5. материалы: отражения и чёткость текстур ---------- */
    var seen = new WeakSet(), maxA = R.capabilities.getMaxAnisotropy ? R.capabilities.getMaxAnisotropy() : 8;
    function sweep() {
      scene.traverse(function (o) {
        var m = o.material; if (!m) return;
        (Array.isArray(m) ? m : [m]).forEach(function (mt) {
          if (seen.has(mt)) return; seen.add(mt);
          if (mt.isMeshStandardMaterial) {
            if (mt.envMapIntensity === 1) mt.envMapIntensity = mt.metalness > .5 ? .7 : (mt.roughness < .5 ? .3 : .1);
            if (mt.map && mt.map.anisotropy < maxA) { mt.map.anisotropy = Math.min(maxA, 16); mt.map.needsUpdate = true; }
          }
        });
      });
      scene.traverse(function (o) { if (o.isSpotLight && o.shadow && !o.__ul) { o.__ul = 1; o.shadow.normalBias = .02; o.shadow.radius = 5; } });
    }
    sweep(); setInterval(sweep, 2500);

    /* ---------- 6. цикл: пыль, переключатель, защита от просадок FPS ---------- */
    var last = performance.now(), acc = 0, n = 0;
    (function loop(now) {
      requestAnimationFrame(loop);
      var dt = (now - last) / 1000; last = now;
      if (!(dt > 0) || dt > .25) return;
      var u = on(), full = u && level < 1;
      shafts.visible = full; dust.visible = full; if (vig) vig.style.display = u ? '' : 'none';
      var want = u && level < 2 ? envTex : null;
      if (scene.environment !== want) scene.environment = want;
      if (full && !(typeof PZ !== 'undefined' && PZ)) {
        var a = dgeo.attributes.position.array;
        for (var k = 0; k < N; k++) {
          var p = k * 3;
          a[p] += vel[p] * dt; a[p + 1] += vel[p + 1] * dt; a[p + 2] += vel[p + 2] * dt;
          if (a[p] > 9 || a[p] < -9) vel[p] = -vel[p];
          if (a[p + 1] > 7.5 || a[p + 1] < .4) vel[p + 1] = -vel[p + 1];
          if (a[p + 2] > 7 || a[p + 2] < -7) vel[p + 2] = -vel[p + 2];
        }
        dgeo.attributes.position.needsUpdate = true;
      }
      if (u) { acc += dt; n++; if (n >= 150) { if (n / acc < 38 && level < 2) level++; acc = 0; n = 0; } }
      else { acc = 0; n = 0; }
    })(last);
  }

  if (ready()) setTimeout(go, 400);
  else {
    var t = 0, iv = setInterval(function () {
      if (ready()) { clearInterval(iv); setTimeout(go, 400); }
      else if (++t > 400) clearInterval(iv);
    }, 50);
  }
})();
