/* PC МАСТЕР — detail.js (подключать ПОСЛЕ realism.js, в самом конце)
   Больше объёма и «живости» в магазине:
   • потолочные вентиляторы (крутятся и отбрасывают бегущие тени), настенные часы (идут по игровому времени)
   • неоновая вывеска с мерцанием, телевизор с рекламой и бегущей строкой, стойка-сервер с мигающими светодиодами
   • радужная подсветка по периметру потолка, плинтусы, коврик у входа, провода по полу
   • кружка кофе на верстаке с паром, полка с коробками и кубком над витриной
   Всё лёгкое: несколько десятков мешей, обновление текстур 8–10 раз в секунду. */
(function () {
  if (window.__detailLoaded) return;
  window.__detailLoaded = 1;
  function ready() { try { return typeof THREE !== 'undefined' && !!scene && !!window.__W && !!window.__roomLoaded && !!window.__windowsLoaded && typeof bx === 'function' && typeof lp === 'function'; } catch (e) { return false; } }
  function safe(f) { try { return f(); } catch (e) { console.error('[detail]', e); } }

  function go() {
    var PI = Math.PI, W3 = window.__W, tick = [];
    function cvs(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
    function tex(c) { var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; }
    function grp(x, y, z, ry) { var g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry || 0; scene.add(g); return g; }
    function basicPlane(w, h, map, x, y, z, ry, tr) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: map, transparent: !!tr, depthWrite: !tr }));
      m.position.set(x, y, z); m.rotation.y = ry || 0; scene.add(m); return m;
    }
    function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }

    /* ---------- плинтусы ---------- */
    var skC = 0x2a2f3a;
    bx(scene, 20, .28, .08, skC, 0, .14, -7.96, 0, .6, .1); bx(scene, 20, .28, .08, skC, 0, .14, 7.96, 0, .6, .1);
    bx(scene, .08, .28, 16, skC, 9.96, .14, 0, 0, .6, .1);

    /* ---------- коврик у входа ---------- */
    var mc = cvs(256, 128), mx = mc.getContext('2d');
    mx.fillStyle = '#1b2430'; mx.fillRect(0, 0, 256, 128); mx.strokeStyle = '#38bdf8'; mx.lineWidth = 6; mx.strokeRect(8, 8, 240, 112);
    mx.fillStyle = '#e5e7eb'; mx.font = 'bold 34px sans-serif'; mx.textAlign = 'center'; mx.textBaseline = 'middle'; mx.fillText('ДОБРО ПОЖАЛОВАТЬ', 128, 64);
    for (var i = 0; i < 400; i++) { mx.fillStyle = 'rgba(255,255,255,' + Math.random() * .06 + ')'; mx.fillRect(Math.random() * 256, Math.random() * 128, 2, 2); }
    var mat = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.4), new THREE.MeshStandardMaterial({ map: tex(mc), roughness: 1 }));
    mat.rotation.x = -PI / 2; mat.position.set(0, .03, 6.9); mat.receiveShadow = true; scene.add(mat);

    /* ---------- провода по полу от верстака ---------- */
    [[[-2.9, .04, -6.0], [-3.6, .03, -6.9], [-5.2, .03, -7.5], [-7.0, .03, -7.8]], [[2.9, .04, -5.6], [3.6, .03, -6.6], [4.9, .03, -7.6], [6.8, .03, -7.8]]].forEach(function (p) {
      var cu = new THREE.CatmullRomCurve3(p.map(function (a) { return new THREE.Vector3(a[0], a[1], a[2]); }));
      var m = new THREE.Mesh(new THREE.TubeGeometry(cu, 24, .035, 6, false), new THREE.MeshStandardMaterial({ color: 0x0b0b0e, roughness: .6 })); m.castShadow = true; scene.add(m);
    });

    /* ---------- потолочные вентиляторы ---------- */
    var fans = [];
    [[-6, 2], [6, 2]].forEach(function (a) {
      var g = grp(a[0], 7.2, a[1]); bx(g, .06, .6, .06, 0x15171c, 0, .3, 0, 0, .5, .5);
      var hub = new THREE.Group(); hub.position.y = 0; g.add(hub);
      var h = new THREE.Mesh(new THREE.CylinderGeometry(.16, .2, .16, 18), new THREE.MeshStandardMaterial({ color: 0x20242c, roughness: .4, metalness: .6 })); h.castShadow = true; hub.add(h);
      var l = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff0c0 })); l.position.y = -.12; hub.add(l);
      for (var k = 0; k < 4; k++) {
        var arm = new THREE.Group(); arm.rotation.y = k * PI / 2; hub.add(arm);
        var b = bx(arm, 1.1, .025, .26, 0x6b4a2a, .78, -.04, 0, 0, .7, .05); b.rotation.z = .08;
      }
      fans.push(hub);
    });
    tick.push(function (dt) { fans.forEach(function (f, i) { f.rotation.y += dt * (i ? 3.2 : 2.6); }); });

    /* ---------- настенные часы ---------- */
    var cc = cvs(256, 256), cx = cc.getContext('2d');
    cx.fillStyle = '#f4f1ea'; cx.beginPath(); cx.arc(128, 128, 124, 0, 7); cx.fill(); cx.strokeStyle = '#1f2937'; cx.lineWidth = 10; cx.stroke();
    cx.fillStyle = '#111'; cx.font = 'bold 30px sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    for (i = 1; i <= 12; i++) { var an = i / 12 * PI * 2; cx.fillText(String(i), 128 + Math.sin(an) * 94, 128 - Math.cos(an) * 94); }
    for (i = 0; i < 60; i++) { var an2 = i / 60 * PI * 2, r1 = i % 5 ? 112 : 106; cx.fillRect(128 + Math.sin(an2) * r1 - 1, 128 - Math.cos(an2) * r1 - 1, 2, i % 5 ? 4 : 8); }
    var clock = grp(0, 6.4, -7.86);
    var face = new THREE.Mesh(new THREE.CircleGeometry(.62, 32), new THREE.MeshBasicMaterial({ map: tex(cc) })); clock.add(face);
    var hh = new THREE.Group(), mh = new THREE.Group(); hh.position.z = mh.position.z = .01; clock.add(hh, mh);
    var hb = new THREE.Mesh(new THREE.BoxGeometry(.045, .3, .01), new THREE.MeshBasicMaterial({ color: 0x111111 })); hb.position.y = .13; hh.add(hb);
    var mb = new THREE.Mesh(new THREE.BoxGeometry(.03, .46, .01), new THREE.MeshBasicMaterial({ color: 0x111111 })); mb.position.y = .2; mh.add(mb);
    tick.push(function () {
      var h = W3.hour ? W3.hour() : 12; mh.rotation.z = -((h % 1) * PI * 2); hh.rotation.z = -(((h % 12) / 12) * PI * 2);
    });

    /* ---------- неоновая вывеска ---------- */
    var nc = cvs(512, 160), nx = nc.getContext('2d');
    nx.clearRect(0, 0, 512, 160); nx.font = 'bold 84px sans-serif'; nx.textAlign = 'center'; nx.textBaseline = 'middle';
    nx.shadowColor = '#22d3ee'; nx.shadowBlur = 28; nx.fillStyle = '#a5f3fc'; nx.fillText('PC', 120, 84);
    nx.shadowColor = '#f472b6'; nx.fillStyle = '#fbcfe8'; nx.fillText('МАСТЕР', 340, 84);
    nx.shadowBlur = 10; nx.strokeStyle = '#22d3ee'; nx.lineWidth = 5; rr(nx, 8, 10, 496, 140, 26); nx.stroke();
    var neon = basicPlane(3.6, 1.12, tex(nc), -6.3, 5.7, -7.85, 0, true); neon.material.blending = THREE.AdditiveBlending;
    var nT = 0;
    tick.push(function (dt) {
      nT += dt; var fl = (Math.sin(nT * 41) > .985 || Math.sin(nT * 13.7 + 1) > .997) ? .35 : 1;
      var night = W3.ENV ? (.75 + .25 * Math.min(1, (W3.ENV.lampF || 0) + .3)) : 1; neon.material.opacity = fl * night;
    });

    /* ---------- телевизор с рекламой ---------- */
    var tv = null;
    scene.children.forEach(function (o) { if (!tv && o.isMesh && o.geometry && o.geometry.type == 'PlaneGeometry' && Math.abs(o.geometry.parameters.width - 3.2) < .01 && Math.abs(o.geometry.parameters.height - 1.8) < .01 && Math.abs(o.position.x - 9.88) < .05) tv = o; });
    var tvc = cvs(512, 288), tvx = tvc.getContext('2d'), tvt = tex(tvc), tT = 0, tAcc = 99;
    var SL = [['PC SALE', 'до −30% на комплектующие', '#7c3aed', '#be185d'], ['ИГРОВЫЕ ПК', 'сборка за 1 день · гарантия 12 мес', '#0e7490', '#1d4ed8'], ['АПГРЕЙД', 'видеокарты · процессоры · память', '#166534', '#0f766e'], ['РЕМОНТ ПК', 'диагностика и замена деталей', '#b45309', '#b91c1c']];
    function drawTV() {
      var s = SL[Math.floor(tT / 6) % SL.length], u = (tT % 6) / 6, W = 512, H = 288;
      var g = tvx.createLinearGradient(0, 0, W, H); g.addColorStop(0, s[2]); g.addColorStop(1, s[3]); tvx.fillStyle = g; tvx.fillRect(0, 0, W, H);
      for (var i = 0; i < 7; i++) { tvx.fillStyle = 'rgba(255,255,255,.07)'; tvx.beginPath(); tvx.arc((i * 97 + tT * 22) % (W + 120) - 60, 60 + Math.sin(tT + i) * 70 + i * 22, 30 + i * 6, 0, 7); tvx.fill(); }
      tvx.textAlign = 'center'; tvx.textBaseline = 'middle'; tvx.fillStyle = '#fff'; tvx.font = 'bold 66px sans-serif';
      var a = Math.min(1, u * 6, (1 - u) * 6); tvx.globalAlpha = a; tvx.fillText(s[0], W / 2, H / 2 - 26); tvx.font = '28px sans-serif'; tvx.fillText(s[1], W / 2, H / 2 + 38); tvx.globalAlpha = 1;
      tvx.fillStyle = 'rgba(0,0,0,.55)'; tvx.fillRect(0, H - 40, W, 40); tvx.fillStyle = '#fde68a'; tvx.font = 'bold 22px sans-serif'; tvx.textAlign = 'left';
      var tk = 'PC МАСТЕР · сборка на ваших глазах · бесплатная диагностика · принимаем старые ПК · ', off = (tT * 70) % 900; tvx.fillText(tk + tk, -off, H - 20);
      tvx.fillStyle = 'rgba(255,255,255,.8)'; tvx.fillRect(0, H - 4, W * u, 4);
      tvt.needsUpdate = true;
    }
    if (tv) { tv.material.map = tvt; tv.material.needsUpdate = true; }
    tick.push(function (dt) { tT += dt; tAcc += dt; if (tv && tAcc > .11) { tAcc = 0; drawTV(); } });

    /* ---------- стойка-сервер с мигающими диодами ---------- */
    var rack = grp(-7.2, 0, -7.35); bx(rack, 1.1, 3.4, .9, 0x15171c, 0, 1.7, 0, 0, .5, .4); bx(rack, 1.14, .08, .94, 0x2a2f3a, 0, 3.42, 0);
    var rc = cvs(128, 256), rx = rc.getContext('2d'), rt = tex(rc), rAcc = 99, leds = [];
    for (i = 0; i < 12; i++) for (var j = 0; j < 4; j++) leds.push({ x: 14 + j * 14, y: 22 + i * 19, p: Math.random() * 9, s: 1 + Math.random() * 5 });
    var rf = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 3.2), new THREE.MeshBasicMaterial({ map: rt })); rf.position.set(0, 1.7, .46); rack.add(rf);
    function drawRack(t) {
      rx.fillStyle = '#0b0d12'; rx.fillRect(0, 0, 128, 256);
      for (var r = 0; r < 12; r++) { rx.fillStyle = '#1b1f28'; rx.fillRect(4, 12 + r * 19, 120, 16); rx.fillStyle = '#2a2f3a'; for (var v = 0; v < 8; v++) rx.fillRect(72 + v * 6, 15 + r * 19, 3, 10); }
      leds.forEach(function (l) { var on = Math.sin(t * l.s + l.p) > (l.s > 4 ? .1 : -.4); rx.fillStyle = on ? (l.x > 40 ? '#4ade80' : '#22d3ee') : '#1f2937'; rx.fillRect(l.x - 20 + 22, l.y - 6, 5, 5); });
      rt.needsUpdate = true;
    }
    var rT = 0; tick.push(function (dt) { rT += dt; rAcc += dt; if (rAcc > .12) { rAcc = 0; drawRack(rT); } });

    /* ---------- радужная подсветка по периметру потолка ---------- */
    var strips = [];
    [[20, .06, .06, 0, 7.55, -7.82], [20, .06, .06, 0, 7.55, 7.82], [.06, .06, 15.6, -9.82, 7.55, 0], [.06, .06, 15.6, 9.82, 7.55, 0]].forEach(function (a) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(a[0], a[1], a[2]), new THREE.MeshBasicMaterial({ color: 0x22d3ee })); m.position.set(a[3], a[4], a[5]); scene.add(m); strips.push(m);
    });
    var hue = 0.5; var col = new THREE.Color();
    tick.push(function (dt) { hue = (hue + dt * .035) % 1; col.setHSL(hue, .85, .6); strips.forEach(function (m) { m.material.color.copy(col); }); });

    /* ---------- кофе на верстаке с паром ---------- */
    var cup = grp(1.45, 1.67, -4.15);
    var cm = new THREE.Mesh(new THREE.CylinderGeometry(.1, .08, .16, 18), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: .3 })); cm.position.y = .08; cm.castShadow = true; cup.add(cm);
    var cf = new THREE.Mesh(new THREE.CylinderGeometry(.088, .088, .01, 18), new THREE.MeshStandardMaterial({ color: 0x3b2314, roughness: .2 })); cf.position.y = .155; cup.add(cf);
    var hd = new THREE.Mesh(new THREE.TorusGeometry(.05, .014, 8, 14, PI), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: .3 })); hd.position.set(.1, .08, 0); hd.rotation.z = -PI / 2; cup.add(hd);
    var N = 16, sp = new Float32Array(N * 3), sa = new Float32Array(N), svx = [];
    for (i = 0; i < N; i++) { sa[i] = Math.random(); svx.push([(Math.random() - .5) * .03, (Math.random() - .5) * .03]); }
    var sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    var dc = cvs(32, 32), dx = dc.getContext('2d'), dg = dx.createRadialGradient(16, 16, 0, 16, 16, 16); dg.addColorStop(0, 'rgba(255,255,255,1)'); dg.addColorStop(1, 'rgba(255,255,255,0)'); dx.fillStyle = dg; dx.fillRect(0, 0, 32, 32);
    var steam = new THREE.Points(sgeo, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(dc), size: .09, transparent: true, opacity: .22, depthWrite: false, color: 0xffffff })); steam.frustumCulled = false; cup.add(steam);
    tick.push(function (dt) {
      for (var k = 0; k < N; k++) { sa[k] += dt * .35; if (sa[k] > 1) { sa[k] = 0; svx[k] = [(Math.random() - .5) * .03, (Math.random() - .5) * .03]; } var u = sa[k]; sp[k * 3] = svx[k][0] * u * 6 + Math.sin(u * 7 + k) * .02; sp[k * 3 + 1] = .17 + u * .42; sp[k * 3 + 2] = svx[k][1] * u * 6; }
      sgeo.attributes.position.needsUpdate = true; steam.material.opacity = .2;
    });

    /* ---------- полка над витриной: коробки, растение, кубок ---------- */
    bx(scene, 4.6, .08, .45, 0x2a2f3a, 6.2, 5.6, -7.7, 0, .5, .4); bx(scene, .08, .5, .4, 0x15171c, 4.1, 5.35, -7.7); bx(scene, .08, .5, .4, 0x15171c, 8.3, 5.35, -7.7);
    var bc = [0x16a34a, 0x2563eb, 0xb91c1c, 0x7c3aed, 0xea580c];
    for (i = 0; i < 5; i++) { var bh = .45 + (i % 3) * .1; bx(scene, .5, bh, .32, bc[i], 4.5 + i * .55, 5.64 + bh / 2, -7.7, 0, .6, .1); }
    cyl(scene, .12, .09, .08, 0xfacc15, 7.55, 5.68, -7.7); cyl(scene, .03, .03, .22, 0xfacc15, 7.55, 5.82, -7.7); sph(scene, .15, 0xfacc15, 7.55, 6.0, -7.7, 1, .8, 1);
    cyl(scene, .2, .16, .3, 0xe5e7eb, 8.0, 5.8, -7.7); sph(scene, .22, 0x22c55e, 8.0, 6.1, -7.7, 1, .9, 1); sph(scene, .15, 0x16a34a, 8.12, 6.3, -7.66, 1, .9, 1);
    /* сертификат в рамке */
    var ec = cvs(256, 180), ex = ec.getContext('2d'); ex.fillStyle = '#f3ead4'; ex.fillRect(0, 0, 256, 180); ex.strokeStyle = '#b8860b'; ex.lineWidth = 8; ex.strokeRect(8, 8, 240, 164);
    ex.fillStyle = '#3b2f1a'; ex.textAlign = 'center'; ex.font = 'bold 26px serif'; ex.fillText('СЕРТИФИКАТ', 128, 56); ex.font = '17px serif'; ex.fillText('мастер по сборке ПК', 128, 92); ex.fillText('уровень: профи', 128, 118);
    ex.fillStyle = '#9f1239'; ex.beginPath(); ex.arc(128, 148, 14, 0, 7); ex.fill();
    bx(scene, 1.5, 1.1, .05, 0x20242c, 8.85, 4.8, -7.9); basicPlane(1.34, .94, tex(ec), 8.85, 4.8, -7.865, 0);

    /* ---------- главный цикл ---------- */
    var last = performance.now();
    (function loop(now) {
      requestAnimationFrame(loop);
      var dt = (now - last) / 1000; last = now; if (!(dt > 0) || dt > .25) return;
      try { if (mode == 'menu') return; } catch (e) { }
      for (var k = 0; k < tick.length; k++) { try { tick[k](dt); } catch (e) { console.error('[detail]', e); tick.splice(k--, 1); } }
    })(last);
    console.log('[detail] готово');
  }

  if (ready()) setTimeout(go, 1500);
  else { var t = 0, iv = setInterval(function () { if (ready()) { clearInterval(iv); setTimeout(go, 1500); } else if (++t > 600) clearInterval(iv); }, 100); }
})();
