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
    for (var p = o.parent; p; p = p.parent) { if (p.isScene) break; if (window.__W && p === window.__W.ST) return false; if (p.userData && (p.userData.act || p.userData.sec || p.userData.dyn || p.userData.keep)) return false; if (p.isCamera || p.isLight) return false; }
    return true;
  }
  function why(o) {
    if (!o.isMesh) return '';
    if (o.isInstancedMesh || o.isSkinnedMesh) return 'instanced/skinned';
    var m = o.material; if (!m) return 'нет материала';
    var ms = Array.isArray(m) ? m : [m];
    if (Array.isArray(m) && !(o.geometry && o.geometry.groups && o.geometry.groups.length)) return 'много материалов без групп';
    for (var q = 0; q < ms.length; q++) { var mm = ms[q]; if (!mm) return 'нет материала'; if (mm.transparent) return 'прозрачный'; if (mm.visible === false || mm.wireframe) return 'скрытый материал'; }
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
    scene.traverse(function (o) { if (cand(o)) map.set(o, { m: o.matrixWorld.elements.slice(), s: osig(o) }); });
    return map;
  }
  function same(a, b) { for (var i = 0; i < 16; i++) if (Math.abs(a[i] - b[i]) > 1e-5) return false; return true; }
  function msig(m) {
    var t = m.type + '|' + (m.color ? m.color.getHex() : 0) + '|' + (m.emissive ? m.emissive.getHex() : 0) + '|' + m.emissiveIntensity + '|' + m.roughness + '|' + m.metalness + '|' + m.opacity + '|' + m.side + '|' + (m.flatShading ? 1 : 0) + '|' + (m.vertexColors ? 1 : 0) + '|' + m.envMapIntensity;
    t += '|' + (m.map ? m.map.uuid : '') + '|' + (m.emissiveMap ? m.emissiveMap.uuid : '') + '|' + (m.bumpMap ? m.bumpMap.uuid : '') + '|' + (m.normalMap ? m.normalMap.uuid : '') + '|' + (m.roughnessMap ? m.roughnessMap.uuid : '') + '|' + (m.alphaMap ? m.alphaMap.uuid : '') + '|' + (m.envMap ? m.envMap.uuid : '') + '|' + (m.aoMap ? m.aoMap.uuid : '');
    if (m.map) t += '|' + m.map.repeat.x + ',' + m.map.repeat.y + ',' + m.map.offset.x + ',' + m.map.offset.y;
    return t;
  }
  function osig(o) { return Array.isArray(o.material) ? o.material.map(msig).join('#') : msig(o.material); }
  function sig(g) { return Object.keys(g.attributes).sort().join(',') + (g.index ? 'i' : 'n'); }

  /* элемент склейки: целый меш или одна группа граней (для мешей с массивом материалов) */
  function items(o) {
    var m = o.material, g = o.geometry, out = [];
    if (!Array.isArray(m)) { out.push({ o: o, mat: m, st: 0, cnt: g.index ? g.index.count : g.attributes.position.count }); return out; }
    g.groups.forEach(function (gr) { var mt = m[gr.materialIndex]; if (mt) out.push({ o: o, mat: mt, st: gr.start, cnt: gr.count }); });
    return out;
  }
  function prep(it) {   // какие вершины нужны элементу и как их перенумеровать
    var g = it.o.geometry, n = g.attributes.position.count, whole = it.st === 0 && it.cnt === (g.index ? g.index.count : n);
    if (whole) { it.nv = n; it.verts = null; it.idx = null; return; }
    var map = new Int32Array(n).fill(-1), verts = [], idx = new Array(it.cnt);
    for (var i = 0; i < it.cnt; i++) { var vi = g.index ? g.index.getX(it.st + i) : it.st + i; if (map[vi] < 0) { map[vi] = verts.length; verts.push(vi); } idx[i] = map[vi]; }
    it.nv = verts.length; it.verts = verts; it.idx = idx;
  }
  function mergeGroup(list, mat) {
    var attrs = Object.keys(list[0].o.geometry.attributes), nv = 0, ni = 0, i, j;
    list.forEach(function (it) { prep(it); nv += it.nv; ni += it.idx ? it.idx.length : it.cnt; });
    var arrs = {}; attrs.forEach(function (n) { var a = list[0].o.geometry.attributes[n]; arrs[n] = { s: a.itemSize, d: new Float32Array(nv * a.itemSize) }; });
    var idx = new Uint16Array(ni), vo = 0, io = 0, v = new THREE.Vector3(), nm = new THREE.Matrix3();
    list.forEach(function (it) {
      var o = it.o, g = o.geometry, n = it.nv; nm.getNormalMatrix(o.matrixWorld);
      attrs.forEach(function (name) {
        var a = g.attributes[name], dst = arrs[name].d, s = a.itemSize;
        for (i = 0; i < n; i++) {
          var si = it.verts ? it.verts[i] : i;
          if (name === 'position') { v.fromBufferAttribute(a, si).applyMatrix4(o.matrixWorld); dst[(vo + i) * 3] = v.x; dst[(vo + i) * 3 + 1] = v.y; dst[(vo + i) * 3 + 2] = v.z; }
          else if (name === 'normal') { v.fromBufferAttribute(a, si).applyMatrix3(nm).normalize(); dst[(vo + i) * 3] = v.x; dst[(vo + i) * 3 + 1] = v.y; dst[(vo + i) * 3 + 2] = v.z; }
          else for (j = 0; j < s; j++) dst[(vo + i) * s + j] = a.array[si * s + j];
        }
      });
      var flip = o.matrixWorld.determinant() < 0, cnt = it.idx ? it.idx.length : it.cnt;
      for (i = 0; i < cnt; i++) idx[io + i] = (it.idx ? it.idx[i] : (g.index ? g.index.getX(i) : i)) + vo;
      if (flip) for (i = 0; i < cnt; i += 3) { var t = idx[io + i + 1]; idx[io + i + 1] = idx[io + i + 2]; idx[io + i + 2] = t; }
      io += cnt; vo += n;
    });
    var bg = new THREE.BufferGeometry();
    attrs.forEach(function (n) { bg.setAttribute(n, new THREE.BufferAttribute(arrs[n].d, arrs[n].s)); });
    bg.setIndex(new THREE.BufferAttribute(idx, 1)); bg.computeBoundingSphere(); bg.computeBoundingBox();
    var mesh = new THREE.Mesh(bg, mat); mesh.frustumCulled = true;
    mesh.castShadow = list.some(function (it) { return it.o.castShadow; }); mesh.receiveShadow = list.some(function (it) { return it.o.receiveShadow; });
    mesh.matrixAutoUpdate = false; mesh.userData.batch = 1;
    return mesh;
  }
  function kill(c) { if (c.dead) return; c.dead = true; if (c.mesh.parent) c.mesh.parent.remove(c.mesh); c.mesh.geometry.dispose(); stat.out--; }
  function unbatch(c) {
    if (c.dead) return;
    var todo = [c], seen = new Set(), objs = [];
    while (todo.length) {   // меш мог попасть в несколько кусков (по одному на материал) — разбираем все связанные вместе
      var x = todo.pop(); if (seen.has(x)) continue; seen.add(x); kill(x);
      x.recs.forEach(function (r) { if (objs.indexOf(r) < 0) objs.push(r); r.chunks.forEach(function (y) { if (!seen.has(y)) todo.push(y); }); });
    }
    objs.forEach(function (r) { r.dead = true; try { delete r.o.visible; r.o.visible = r.want; } catch (e) { } });
    console.log('[batch] группа разобрана (объект изменился)');
  }
  function build(map) {
    var groups = new Map(), recs = new Map();
    map.forEach(function (info, o) {
      var p = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld), cell = floor(p.x / CELL) + ',' + floor(p.z / CELL) + ',' + floor(p.y / 8);
      items(o).forEach(function (it) {
        var key = msig(it.mat) + '|' + sig(o.geometry) + '|' + cell;
        var gr = groups.get(key); if (!gr) { gr = { mat: it.mat, list: [] }; groups.set(key, gr); } gr.list.push(it);
      });
    });
    var root = new THREE.Group(); root.userData.batchRoot = 1; root.matrixAutoUpdate = false; scene.add(root);
    var made = [];
    groups.forEach(function (gr) {
      if (gr.list.length < 3) return;
      var part = [], nv = 0, parts = [];
      gr.list.forEach(function (it) { var n = it.o.geometry.attributes.position.count; if (nv + n > MAXV) { parts.push(part); part = []; nv = 0; } part.push(it); nv += n; });
      parts.push(part);
      parts.forEach(function (l) {
        if (l.length < 3) return;
        var mesh = mergeGroup(l, gr.mat.clone()); root.add(mesh);
        var c = { mesh: mesh, recs: [], dead: false }; stat.out++; made.push({ c: c, l: l });
      });
    });
    // у меша, часть граней которого не склеилась, оставляем видимым весь меш (иначе пропадут стены)
    var cover = new Map(); made.forEach(function (m) { m.l.forEach(function (it) { cover.set(it.o, (cover.get(it.o) || 0) + 1); }); });
    var need = new Map(); map.forEach(function (_, o) { need.set(o, items(o).length); });
    var bad = new Set(); need.forEach(function (n, o) { if ((cover.get(o) || 0) < n) bad.add(o); });
    var dropped = true;   // убираем куски, в которых есть «неполные» меши, и считаем заново
    while (dropped) {
      dropped = false;
      made.forEach(function (m) { if (m.c.dead) return; if (m.l.some(function (it) { return bad.has(it.o); })) { kill(m.c); dropped = true; m.l.forEach(function (it) { bad.add(it.o); }); } });
    }
    made.forEach(function (m) {
      if (m.c.dead) return;
      m.l.forEach(function (it) {
        var o = it.o, r = recs.get(o);
        if (!r) {
          r = { o: o, want: true, mat: o.material, ms: osig(o), mw: map.get(o).m, chunks: [], dead: false, anc: [] };
          (function (rr) { Object.defineProperty(o, 'visible', { configurable: true, get: function () { return rr.dead ? rr.want : false; }, set: function (v) { rr.want = v; if (!rr.dead) unbatch(rr.chunks[0]); } }); })(r);
          for (var p = o.parent; p && !p.isScene; p = p.parent) r.anc.push({ p: p, v: p.visible });
          recs.set(o, r); stat.src++;
        }
        if (r.chunks.indexOf(m.c) < 0) r.chunks.push(m.c);
        if (m.c.recs.indexOf(r) < 0) m.c.recs.push(r);
      });
      chunks.push(m.c);
    });
    allRecs = allRecs.concat(Array.from(recs.values()));
  }
  var allRecs = [];
  function watch() {
    scene.updateMatrixWorld(true);
    for (var i = 0; i < allRecs.length; i++) {
      var r = allRecs[i]; if (r.dead || !r.chunks.length || r.chunks[0].dead) continue;
      var bad = r.o.material !== r.mat || osig(r.o) !== r.ms || !same(r.o.matrixWorld.elements, r.mw);
      for (var k = 0; !bad && k < r.anc.length; k++) if (r.anc[k].p.visible !== r.anc[k].v) bad = true;
      if (bad) unbatch(r.chunks[0]);
    }
  }
  /* что реально рисуется: меши в кадре, прозрачные, спрайты, тени; по крупным веткам сцены */
  function breakdown(full) {
    if (typeof cam === 'undefined' || !cam || !scene) return null;
    cam.updateMatrixWorld(); var fr = new THREE.Frustum(), pm = new THREE.Matrix4(); pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); fr.setFromProjectionMatrix(pm);
    var r = { mesh: 0, calls: 0, trans: 0, sprite: 0, cast: 0, lights: 0, shLights: 0, cull: 0 }, br = new Map();
    scene.traverse(function (o) {
      if (o.isLight) { r.lights++; if (o.castShadow) r.shLights++; return; }
      if (!(o.isMesh || o.isSprite || o.isLine || o.isPoints)) return;
      if (o.castShadow) r.cast++;
      var vis = true; for (var p = o; p; p = p.parent) if (!p.visible) { vis = false; break; }
      if (!vis) return;
      var inF = true; try { inF = o.frustumCulled === false || (o.geometry && (o.geometry.boundingSphere || o.geometry.computeBoundingSphere(), fr.intersectsObject(o))) || o.isSprite; } catch (e) { }
      if (!inF) { r.cull++; return; }
      var n = Array.isArray(o.material) ? (o.geometry.groups.length || 1) : 1; r.mesh++; r.calls += n;
      var m = Array.isArray(o.material) ? o.material[0] : o.material; if (m && m.transparent) r.trans += n; if (o.isSprite) r.sprite++;
      if (full) { var top = o; while (top.parent && !top.parent.isScene) top = top.parent; var k = (top.userData && top.userData.batchRoot ? 'СКЛЕЕННОЕ' : (top === o ? 'одиночный ' + (o.isSprite ? 'спрайт' : 'меш') : 'группа #' + scene.children.indexOf(top) + ' (' + (top.children ? top.children.length : 0) + ')')); br.set(k, (br.get(k) || 0) + n); }
    });
    if (full) { var arr = Array.from(br.entries()).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 15); r.top = arr; console.log('[batch] в кадре', JSON.stringify(r)); console.table(arr.map(function (e) { return { ветка: e[0], вызовов: e[1] }; })); }
    return r;
  }
  var rsCache = '', rsT = 0;
  function reasonsLine() {
    var now = Date.now(); if (now - rsT < 4000) return rsCache; rsT = now;
    var r = {}; scene.traverse(function (o) { if (!o.isMesh) return; var w = why(o); if (w) r[w] = (r[w] || 0) + 1; });
    rsCache = Object.keys(r).sort(function (a, b) { return r[b] - r[a]; }).slice(0, 5).map(function (k) { return k + ' ' + r[k]; }).join(', '); return rsCache;
  }
  /* тени: мелкие предметы (детали, мусор, мелочь) тень не отбрасывают — это основная нагрузка на проход теней */
  var PR_R = .45;
  function pruneShadows() {
    var n = 0, v = new THREE.Vector3();
    scene.traverse(function (o) {
      if (!o.isMesh || !o.castShadow || o.userData.batch || o.isInstancedMesh || !o.geometry) return;
      var g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); if (!g.boundingSphere) return;
      o.updateWorldMatrix(true, false); var e = o.matrixWorld.elements, sc = Math.max(Math.hypot(e[0], e[1], e[2]), Math.hypot(e[4], e[5], e[6]), Math.hypot(e[8], e[9], e[10]));
      if (g.boundingSphere.radius * sc < PR_R) { o.castShadow = false; n++; }
    });
    if (n) console.log('[batch] убрана тень у мелких объектов:', n); return n;
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
  var mxF = 0, mxT = performance.now(), mxShow = 0, lastF = performance.now();
  (function tick() { requestAnimationFrame(tick); frames++; var n = performance.now(); var df = n - lastF; lastF = n; if (df > mxF) mxF = df; if (n - mxT > 10000) { mxShow = mxF; mxF = 0; mxT = n; } if (n - tPrev >= 500) { fps = Math.round(frames * 1000 / (n - tPrev)); frames = 0; tPrev = n; if (hudOn && hudEl) { var i = (typeof R !== 'undefined' && R.info) ? R.info : null; hudEl.textContent = fps + ' FPS\nвызовов ' + (i ? i.render.calls : '?') + '\nтреугольников ' + (i ? i.render.triangles : '?') + '\nобъектов ' + (i ? i.memory.geometries : '?') + (done && stat.out ? '\nсклеено ' + stat.src + '→' + stat.out : '') + '\nсамый долгий кадр за 10 с: ' + Math.round(Math.max(mxShow, mxF)) + ' мс'; try { var b = breakdown(false); if (b) hudEl.textContent += '\nв кадре: мешей ' + b.mesh + ' (≈' + b.calls + ' выз.)\nпрозрачных ' + b.trans + ', спрайтов ' + b.sprite + '\nтени: кастеров ' + b.cast + ', света с тенью ' + b.shLights + '\nотказы склейки: ' + reasonsLine(); } catch (e) { } } } })();
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
    run: run, prune: pruneShadows, why: report, top: function () { return breakdown(true); }, again: function () { run(true); }, stats: function () { return { src: stat.src, groups: stat.out, alive: chunks.filter(function (c) { return !c.dead; }).length }; }
  };
})();
