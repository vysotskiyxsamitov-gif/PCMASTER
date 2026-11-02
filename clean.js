/* PC МАСТЕР — clean.js: уборка на полу.
   Коробки и мусор после погрома можно убрать: наведи прицел и нажми E (на телефоне — тап) —
   предмет улетает в чёрный мешок. Когда пол чистый, Максим звонит второй раз (E — ответить, Q — не брать).
   Подключать ПОСЛЕ index.html и intro.js:  <script src="clean.js"></script> */
(function () {
  if (window.__cleanLoaded) return;
  window.__cleanLoaded = 1;

  function ready() {
    try { return typeof THREE !== 'undefined' && !!scene && !!dbr && !!wrk && typeof incomingCall === 'function' && typeof lp === 'function'; } catch (e) { return false; }
  }

  function go() {
    var items = [];
    dbr.children.concat(wrk.children).forEach(function (m, i) {
      items.push({ m: m, i: i, p: m.position.clone(), r: m.rotation.clone(), s: m.scale.clone(), gone: false, fly: null });
    });
    var TOTAL = items.length;

    /* ---------- мешок для мусора ---------- */
    var bag = new THREE.Group(); bag.position.set(3.2, 0, -1.2); bag.visible = false; scene.add(bag);
    var bm = new THREE.MeshPhysicalMaterial({ color: 0x11141b, roughness: .4, metalness: 0, clearcoat: .7, clearcoatRoughness: .35 });
    var bgeo = new THREE.SphereGeometry(.52, 40, 30), pp = bgeo.attributes.position;
    for (var vi = 0; vi < pp.count; vi++) { // складки и мятый пластик, дно приплюснуто
      var vx = pp.getX(vi), vy = pp.getY(vi), vz = pp.getZ(vi), vl = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;
      var nz = Math.sin(vx * 9 + vy * 5) * Math.cos(vz * 8 - vy * 4) * .03 + Math.sin(vy * 15 + vz * 6) * .014;
      var kk = 1 + nz / vl; pp.setXYZ(vi, vx * kk * (1 + .06 * Math.max(0, -vy)), vy * kk * (vy < 0 ? .8 : 1), vz * kk);
    }
    bgeo.computeVertexNormals();
    var body = new THREE.Mesh(bgeo, bm); body.position.y = .57; body.castShadow = body.receiveShadow = true; bag.add(body);
    [[.28, .5, .3, .15], [-.3, .42, .28, .12], [.05, .7, -.38, .13]].forEach(function (l) { // предметы, выпирающие изнутри
      var s = new THREE.Mesh(new THREE.SphereGeometry(l[3], 14, 10), bm); s.position.set(l[0], l[1], l[2]); s.scale.set(1, .85, 1.1); s.castShadow = true; bag.add(s);
    });
    var neck = new THREE.Mesh(new THREE.CylinderGeometry(.08, .24, .42, 14, 4, true), bm); neck.position.y = 1.12; neck.material.side = THREE.DoubleSide; bag.add(neck);
    var nk = neck.geometry.attributes.position;
    for (var ni = 0; ni < nk.count; ni++) { var nx = nk.getX(ni), nzz = nk.getZ(ni), na = Math.atan2(nzz, nx), nr = 1 + .16 * Math.sin(na * 6); nk.setX(ni, nx * nr); nk.setZ(ni, nzz * nr); }
    neck.geometry.computeVertexNormals();
    [[-.07, .55], [.08, -.5], [0, .05]].forEach(function (a, i) {
      var e = new THREE.Mesh(new THREE.ConeGeometry(.08, .34 - i * .07, 8), bm); e.position.set(a[0], 1.46, i == 2 ? .04 : 0); e.rotation.z = a[1]; e.castShadow = true; bag.add(e);
    });
    var tie = new THREE.Mesh(new THREE.TorusGeometry(.115, .02, 8, 20), new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: .55 })); tie.position.y = 1.22; tie.rotation.x = Math.PI / 2; bag.add(tie);
    var knot = new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), tie.material); knot.position.set(0, 1.22, .12); bag.add(knot);
    var label = lp(bag, 'МУСОР', 1.1, .28, 0, 1.85, 0, '#fff', '#334155', 0);
    function bagGrow() {
      var n = items.filter(function (it) { return it.gone; }).length, g = 1 + Math.min(n, TOTAL) * .012;
      body.scale.set(g, 1.1 * g, .95 * g); body.position.y = .57 * g;
    }
    body.userData.act = function () {
      var n = G && G.ev && G.ev.clr ? G.ev.clr.length : 0;
      toast(n ? 'В мешке ' + n + ' шт. Собирай коробки и мусор с пола — наведи прицел и нажми E.' : 'Пустой мешок. Собирай в него коробки и мусор с пола (наведи прицел и нажми E).');
    };

    /* ---------- полёт предмета в мешок ---------- */
    var running = false, lastT = 0;
    function step(now) {
      var dt = Math.min(.05, (now - lastT) / 1000 || .016); lastT = now;
      var any = false;
      items.forEach(function (it) {
        var f = it.fly; if (!f) return;
        f.t += dt / f.d;
        var u = Math.min(1, f.t), e = u * u * (3 - 2 * u), m = it.m;
        m.position.lerpVectors(f.from, f.to, e); m.position.y += Math.sin(u * Math.PI) * 1.1;
        m.scale.copy(it.s).multiplyScalar(1 - .65 * e); m.rotation.y += dt * 9;
        if (u >= 1) { m.visible = false; it.gone = true; it.fly = null; bagGrow(); sfx('put'); if (G && G.ev && G.ev.cl === 1 && items.every(function (x) { return x.gone; })) toast('Пол чистый! Мешок можно оставить тут.'); }
        else any = true;
      });
      if (bag.visible && mode == 'play') label.rotation.y = Math.atan2(cam.position.x - bag.position.x, cam.position.z - bag.position.z);
      if (any) requestAnimationFrame(step); else running = false;
    }
    function kick() { if (!running) { running = true; lastT = performance.now(); requestAnimationFrame(step); } }
    (function lbl(now) { requestAnimationFrame(lbl); if (bag.visible && mode == 'play') label.rotation.y = Math.atan2(cam.position.x - bag.position.x, cam.position.z - bag.position.z); })(0);

    function pick(it) {
      if (it.gone || it.fly || !G || !G.ev || mode != 'play') return;
      var ev = G.ev; ev.clr = ev.clr || [];
      if (ev.clr.indexOf(it.i) < 0) ev.clr.push(it.i);
      var left = TOTAL - ev.clr.length;
      if (left <= 0) ev.cl = 1;
      it.m.userData.act = null;
      it.fly = { t: 0, d: .55, from: it.m.position.clone(), to: new THREE.Vector3(bag.position.x, bag.position.y + 1.05, bag.position.z) };
      sfx('take');
      if (left > 0) toast('В мешок: ' + ev.clr.length + '/' + TOTAL);
      try { save(); hud(); } catch (e) {}
      kick();
    }
    items.forEach(function (it) { it.m.userData.act = function () { pick(it); }; });

    function show(it) {
      var m = it.m; m.visible = true; m.position.copy(it.p); m.rotation.copy(it.r); m.scale.copy(it.s);
      it.gone = false; it.fly = null; m.userData.act = function () { pick(it); };
    }
    function hide(it) { var m = it.m; m.visible = false; m.userData.act = null; it.gone = true; it.fly = null; }

    /* новая игра: всё снова на полу */
    function resetAll() { items.forEach(show); bag.visible = false; bagGrow(); }

    /* при входе в магазин: применяем сохранённый прогресс уборки */
    function apply() {
      if (!G) return;
      var ev = G.ev = G.ev || {}; ev.clr = ev.clr || [];
      var skip = G.sb || ev.cl === 1 || (G.tid && ev.cl === undefined && !ev.clr.length);
      if (skip) {
        if (!G.sb && ev.cl !== 1) ev.cl = 1;
        items.forEach(hide);
        bag.visible = !G.sb && ev.clr.length > 0;
      } else {
        items.forEach(function (it) { if (ev.clr.indexOf(it.i) >= 0) hide(it); else show(it); });
        wrk.visible = true; dbr.visible = true; bag.visible = true;
      }
      bagGrow();
    }

    var sp0 = startPlay; startPlay = function () { var r = sp0.apply(this, arguments); try { apply(); } catch (e) {} return r; };
    var pl0 = play; play = function () { var r = pl0.apply(this, arguments); try { resetAll(); } catch (e) {} return r; };

    /* строка задания: показываем, сколько мусора осталось */
    var q0 = qText;
    qText = function () {
      var b = q0();
      if (G && !G.sb && G.ev && G.ev.cl !== 1 && G.ev.clr) return b + ' · мусор в мешок: осталось ' + (TOTAL - G.ev.clr.length);
      return b;
    };

    /* второй звонок Максима — когда пол чистый (и после первого звонка) */
    setInterval(function () {
      try {
        if (!G || G.sb || !G.ev || G.ev.mx2 || G.ev.cl !== 1 || !G.tid || !G.ev.mx1 || mode != 'play' || CALL) return;
        if (window.__mx1t && performance.now() - window.__mx1t < 6000) return;
        G.ev.mx2 = 1; save();
        incomingCall('M', [
          ['M', 'Вижу, пол наконец чистый. Теперь это снова похоже на магазин.'],
          ['Y', 'Да, пришлось повозиться.'],
          ['M', 'Теперь не стыдно пускать клиентов. Продавай и держись — я рядом.']
        ]);
      } catch (e) {}
    }, 1000);

    window.__clean = { items: items, pick: pick, apply: apply, resetAll: resetAll, bag: bag };
  }

  if (ready()) go();
  else {
    var n = 0, iv = setInterval(function () {
      if (ready()) { clearInterval(iv); go(); }
      else if (++n > 400) clearInterval(iv);
    }, 50);
  }
})();
