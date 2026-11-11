/* PC МАСТЕР — batch.js: объединение неподвижных объектов сцены.
   Тысячи мелких мешей = тысячи вызовов отрисовки, и именно они грузят процессор. Здесь одинаковые по материалу
   неподвижные меши, лежащие рядом, склеиваются в один. Если игра позже сдвинет, скроет или заменит любой из склеенных
   объектов, его группа сразу разбирается обратно, так что картинка не ломается. Включается в настройках. */
(function () {
  if (window.__batchLoaded) return;
  window.__batchLoaded = 1;
  var DEF = false, ON = DEF;
  try { var sv = localStorage.getItem('pcbatch'); if (sv === '1') ON = true; else if (sv === '0') ON = false; } catch (e) { }
  var CELL = 10, MAXV = 60000, done = false, chunks = [], stat = { src: 0, out: 0 };
  function ok() { try { return typeof THREE !== 'undefined' && !!scene; } catch (e) { return false; } }
  function chainVisible(o) { for (; o; o = o.parent) if (o.visible === false) return false; return true; }
  function chainClean(o) {
    for (var p = o.parent; p; p = p.parent) { if (p.isScene) break; if (p.userData && (p.userData.act || p.userData.sec || p.userData.dyn || p.userData.keep)) return false; if (p.isCamera || p.isLight) return false; }
    return true;
  }
  function why(o) {
    if (!o.isMesh) return '';
    if (o.isInstancedMesh || o.isSkinnedMesh) return 'instanced/skinned';
    var m = o.material; if (!m) return 'нет материала'; if (Array.isArray(m)) return 'много материалов';
    if (m.transparent) return 'прозрачный'; if (m.visible === false || m.wireframe) return 'скрытый материал';
    var g = o.geometry; if (!g || !g.isBufferGeometry || !g.attributes.position) return 'нет геометрии';
    if (g.morphAttributes && Object.keys(g.morphAttributes).length) return 'morph';
    if (g.attributes.position.count > 6000) return 'больше 6000 вершин';
    for (var k in g.attributes) { var at = g.attributes[k]; if (at.isInterleavedBufferAttribute || !at.array || at.array.constructor !== Float32Array) return 'формат атрибутов'; }
    if (o.renderOrder) return 'renderOrder'; if (o.frustumCulled === false) return 'frustumCulled off';
    if (o.layers.mask !== 1) return 'слой'; if (o.onBeforeRender !== THREE.Object3D.prototype.onBeforeRender) return 'onBeforeRender';
    if (o.userData && Object.keys(o.userData).length) return 'userData';
    if (!o.visible) return o.userData && o.userData.batch ? '' : 'уже склеен/скрыт'; if (!chainVisible(o)) return 'родитель скрыт';
    if (!chainClean(o)) return 'родитель интерактивный';
    return '';
  }
  function cand(o) { return o.isMesh && !why(o); }
  function report() {
    var r = {}, tot = 0, ok = 0; scene.traverse(function (o) { if (!o.isMesh) return; tot++; var w = why(o); if (w) r[w] = (r[w] || 0) + 1; else ok++; });
    var out = { всего_мешей: tot, подходят: ok, причины: r }; console.log('[batch] отчёт', JSON.stringify(out)); return out;
  }
  function snap() {
    scene.updateMatrixWorld(true);
    var map = new Map();
    scene.traverse(function (o) { if (cand(o)) map.set(o, { m: o.matrixWorld.elements.slice(), s: msig(o.material) }); });
    return map;
  }
  function same(a, b) { for (var i = 0; i < 16; i++) if (Math.abs(a[i] - b[i]) > 1e-5) return false; return true; }
  function msig(m) {
    var t = m.type + '|' + (m.color ? m.color.getHex() : 0) + '|' + (m.emissive ? m.emissive.getHex() : 0) + '|' + m.emissiveIntensity + '|' + m.roughness + '|' + m.metalness + '|' + m.opacity + '|' + m.side + '|' + (m.flatShading ? 1 : 0) + '|' + (m.vertexColors ? 1 : 0) + '|' + m.envMapIntensity;
    t += '|' + (m.map ? m.map.uuid : '') + '|' + (m.emissiveMap ? m.emissiveMap.uuid : '') + '|' + (m.bumpMap ? m.bumpMap.uuid : '') + '|' + (m.normalMap ? m.normalMap.uuid : '') + '|' + (m.roughnessMap ? m.roughnessMap.uuid : '') + '|' + (m.alphaMap ? m.alphaMap.uuid : '') + '|' + (m.envMap ? m.envMap.uuid : '') + '|' + (m.aoMap ? m.aoMap.uuid : '');
    if (m.map) t += '|' + m.map.repeat.x + ',' + m.map.repeat.y + ',' + m.map.offset.x + ',' + m.map.offset.y;
    return t;
  }
  function sig(g) { return Object.keys(g.attributes).sort().join(',') + (g.index ? 'i' : 'n'); }

  function mergeGroup(list, mat) {
    var attrs = Object.keys(list[0].geometry.attributes), nv = 0, ni = 0, i, j;
    list.forEach(function (o) { nv += o.geometry.attributes.position.count; ni += o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count; });
    var arrs = {}; attrs.forEach(function (n) { var a = list[0].geometry.attributes[n]; arrs[n] = { s: a.itemSize, d: new Float32Array(nv * a.itemSize) }; });
    var idx = new Uint16Array(ni), vo = 0, io = 0, v = new THREE.Vector3(), nm = new THREE.Matrix3();
    list.forEach(function (o) {
      var g = o.geometry, n = g.attributes.position.count; nm.getNormalMatrix(o.matrixWorld);
      attrs.forEach(function (name) {
        var a = g.attributes[name], dst = arrs[name].d, s = a.itemSize;
        for (i = 0; i < n; i++) {
          if (name === 'position') { v.fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld); dst[(vo + i) * 3] = v.x; dst[(vo + i) * 3 + 1] = v.y; dst[(vo + i) * 3 + 2] = v.z; }
          else if (name === 'normal') { v.fromBufferAttribute(a, i).applyMatrix3(nm).normalize(); dst[(vo + i) * 3] = v.x; dst[(vo + i) * 3 + 1] = v.y; dst[(vo + i) * 3 + 2] = v.z; }
          else for (j = 0; j < s; j++) dst[(vo + i) * s + j] = a.array[i * s + j];
        }
      });
      var flip = o.matrixWorld.determinant() < 0, cnt = g.index ? g.index.count : n;
      for (i = 0; i < cnt; i++) idx[io + i] = (g.index ? g.index.getX(i) : i) + vo;
      if (flip) for (i = 0; i < cnt; i += 3) { var t = idx[io + i + 1]; idx[io + i + 1] = idx[io + i + 2]; idx[io + i + 2] = t; }
      io += cnt;
      vo += n;
    });
    var bg = new THREE.BufferGeometry();
    attrs.forEach(function (n) { bg.setAttribute(n, new THREE.BufferAttribute(arrs[n].d, arrs[n].s)); });
    bg.setIndex(new THREE.BufferAttribute(idx, 1)); bg.computeBoundingSphere(); bg.computeBoundingBox();
    var mesh = new THREE.Mesh(bg, mat); mesh.frustumCulled = true;
    mesh.castShadow = list.some(function (o) { return o.castShadow; }); mesh.receiveShadow = list.some(function (o) { return o.receiveShadow; });
    mesh.matrixAutoUpdate = false; mesh.userData.batch = 1;
    return mesh;
  }
  function unbatch(c) {
    if (c.dead) return; c.dead = true;
    if (c.mesh.parent) c.mesh.parent.remove(c.mesh);
    c.mesh.geometry.dispose();
    c.src.forEach(function (s) { s.o.visible = s.want; try { delete s.o.visible; s.o.visible = s.want; } catch (e) { } });
    stat.out--; console.log('[batch] группа разобрана (объект изменился)');
  }
  function build(map) {
    var groups = new Map();
    map.forEach(function (_, o) {
      var p = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld), key = msig(o.material) + '|' + sig(o.geometry) + '|' + floor(p.x / CELL) + ',' + floor(p.z / CELL) + ',' + floor(p.y / 8);
      var gr = groups.get(key); if (!gr) { gr = { mat: o.material.clone(), list: [] }; groups.set(key, gr); } gr.list.push(o);
    });
    var root = new THREE.Group(); root.userData.batchRoot = 1; root.matrixAutoUpdate = false; scene.add(root);
    groups.forEach(function (gr) {
      if (gr.list.length < 3) return;
      var part = [], nv = 0, parts = [];
      gr.list.forEach(function (o) { var n = o.geometry.attributes.position.count; if (nv + n > MAXV) { parts.push(part); part = []; nv = 0; } part.push(o); nv += n; });
      parts.push(part);
      parts.forEach(function (l) {
        if (l.length < 3) return;
        var mesh = mergeGroup(l, gr.mat); root.add(mesh);
        var c = { mesh: mesh, src: [], anc: [], dead: false };
        l.forEach(function (o) {
          var rec = { o: o, want: true, mat: o.material, ms: msig(o.material), mw: map.get(o).m };
          Object.defineProperty(o, 'visible', { configurable: true, get: function () { return c.dead ? rec.want : false; }, set: function (v) { rec.want = v; if (!c.dead) unbatch(c); } });
          c.src.push(rec);
          for (var p = o.parent; p && !p.isScene; p = p.parent) if (c.anc.indexOf(p) < 0) c.anc.push(p);
        });
        c.anc = c.anc.map(function (p) { return { p: p, v: p.visible }; });
        chunks.push(c); stat.src += l.length; stat.out++;
      });
    });
  }
  function watch() {
    scene.updateMatrixWorld(true);
    chunks.forEach(function (c) {
      if (c.dead) return;
      for (var i = 0; i < c.anc.length; i++) if (c.anc[i].p.visible !== c.anc[i].v) return unbatch(c);
      for (var k = 0; k < c.src.length; k++) { var s = c.src[k]; if (s.o.material !== s.mat || msig(s.o.material) !== s.ms || !same(s.o.matrixWorld.elements, s.mw)) return unbatch(c); }
    });
  }
  var floor = Math.floor, watchOn = 0;
  function run(again) {
    if ((done && !again) || !ON || !ok()) return; done = true;
    var t0 = performance.now(), a = snap();
    setTimeout(function () {
      try {
        var b = snap(), keep = new Map();
        a.forEach(function (m, o) { var m2 = b.get(o); if (m2 && m.s === m2.s && same(m.m, m2.m)) keep.set(o, m2); });
        var calls0 = (R && R.info) ? R.info.render.calls : 0;
        build(keep); if (!watchOn) { watchOn = 1; setInterval(function () { try { watch(); } catch (e) { } }, 500); }
        console.log('[batch] склеено', stat.src, 'мешей в', stat.out, 'групп за', Math.round(performance.now() - t0), 'мс; вызовов до:', calls0);
      } catch (e) { console.warn('[batch] ошибка', e); }
    }, 1800);
  }
  /* счётчик нагрузки: FPS, вызовы отрисовки, треугольники */
  var hudEl = null, hudOn = false, frames = 0, tPrev = performance.now(), fps = 0;
  (function tick() { requestAnimationFrame(tick); frames++; var n = performance.now(); if (n - tPrev >= 500) { fps = Math.round(frames * 1000 / (n - tPrev)); frames = 0; tPrev = n; if (hudOn && hudEl) { var i = (typeof R !== 'undefined' && R.info) ? R.info : null; hudEl.textContent = fps + ' FPS\nвызовов ' + (i ? i.render.calls : '?') + '\nтреугольников ' + (i ? i.render.triangles : '?') + '\nобъектов ' + (i ? i.memory.geometries : '?') + (done && stat.out ? '\nсклеено ' + stat.src + '→' + stat.out : ''); } } })();
  function hud(v) {
    hudOn = v === undefined ? !hudOn : !!v;
    if (hudOn && !hudEl) { hudEl = document.createElement('pre'); hudEl.style.cssText = 'position:fixed;left:max(8px,env(safe-area-inset-left,0px));top:max(8px,env(safe-area-inset-top,0px));margin:0;padding:6px 9px;border-radius:8px;background:rgba(0,0,0,.6);color:#7cf0b2;font:12px/1.35 Consolas,monospace;z-index:99998;pointer-events:none;white-space:pre'; document.body.appendChild(hudEl); }
    if (hudEl) hudEl.style.display = hudOn ? 'block' : 'none';
  }
  addEventListener('keydown', function (e) { if (e.code === 'F3') { e.preventDefault(); hud(); } });
  window.__batch = {
    hud: hud, hudOn: function () { return hudOn; },
    get: function () { return ON; },
    toggle: function () { ON = !ON; try { localStorage.setItem('pcbatch', ON ? '1' : '0'); } catch (e) { } if (typeof toast == 'function') toast('Объединение объектов: ' + (ON ? 'включено, применится после перезапуска' : 'выключено, применится после перезапуска')); },
    run: run, why: report, again: function () { run(true); }, stats: function () { return { src: stat.src, groups: stat.out, alive: chunks.filter(function (c) { return !c.dead; }).length }; }
  };
})();
