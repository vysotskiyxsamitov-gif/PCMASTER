/* PC МАСТЕР — chars2.js (после chars.js и pcvis.js): ещё более проработанные люди.
   Пальцы на руках, шнурки, карманы, принт на футболке, ресницы и губы, бакенбарды, шея и воротник. */
(function () {
  if (window.__chars2Loaded) return; window.__chars2Loaded = 1;
  function ready() { try { return typeof mkP === 'function' && window.__charsLoaded && typeof THREE !== 'undefined' && typeof tickCU === 'function' && typeof CU !== 'undefined'; } catch (e) { return false; } }
  function go() {
    var _mk = mkP, PI = Math.PI;
    function M(c, r) { return new THREE.MeshStandardMaterial({ color: c, roughness: r === undefined ? .75 : r, metalness: 0 }); }
    function bx(p, w, h, d, c, x, y, z, r) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c, r)); m.position.set(x, y, z); m.castShadow = true; p.add(m); return m; }
    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
    var PR = {};
    function print(kind, col) {
      var k = kind + col; if (PR[k]) return PR[k];
      var c = document.createElement('canvas'); c.width = c.height = 128; var x = c.getContext('2d'); x.clearRect(0, 0, 128, 128);
      x.fillStyle = col; x.strokeStyle = col; x.lineWidth = 10;
      if (kind == 0) { x.beginPath(); x.arc(64, 64, 44, 0, PI * 2); x.stroke(); x.fillRect(54, 30, 20, 68); }
      else if (kind == 1) { for (var i = 0; i < 4; i++) x.fillRect(14, 22 + i * 26, 100, 12); }
      else if (kind == 2) { x.beginPath(); x.moveTo(64, 12); x.lineTo(116, 112); x.lineTo(12, 112); x.closePath(); x.fill(); }
      else { x.font = 'bold 74px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('PC', 64, 66); }
      var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return (PR[k] = t);
    }
    mkP = function (o) {
      var g = _mk(o); o = o || {};
      try {
        var ar = g.userData.ar || [], lg = g.userData.lg || [];
        /* пальцы */
        ar.forEach(function (arm, i) {
          var hand = arm.children[arm.children.length - 2], col = hand && hand.material ? hand.material.color.getHex() : 0xe0b99a;
          if (o.bad) col = 0x0a0a0a;
          for (var k = 0; k < 4; k++) { var f = bx(arm, .032, .13, .05, col, -.06 + k * .04, -1.47 - (k == 1 || k == 2 ? .02 : 0), .02, .6); f.rotation.x = .12; }
        });
        /* шнурки и карманы */
        lg.forEach(function (l) {
          if (!o.bad) { bx(l, .2, .02, .15, 0xf8fafc, 0, -1.34, .26, .6); bx(l, .02, .02, .1, 0x9ca3af, 0, -1.33, .2, .6); }
          var pc = l.children[0] && l.children[0].material ? l.children[0].material.color.getHex() : 0x1f2937;
          bx(l, .15, .02, .02, new THREE.Color(pc).multiplyScalar(.6).getHex(), 0, -.12, .19, .9);
        });
        if (o.bad) return g;
        /* принт на футболке (ищем воротник футболки: цилиндр r=.17 на уровне шеи) */
        var tee = g.children.some(function (c) { return c.geometry && c.geometry.type == 'CylinderGeometry' && c.geometry.parameters && Math.abs(c.geometry.parameters.radiusTop - .17) < .005 && Math.abs(c.position.y - 3.0) < .02; });
        if (tee && Math.random() < .55) {
          var pl = new THREE.Mesh(new THREE.PlaneGeometry(.34, .34), new THREE.MeshStandardMaterial({ map: print(Math.floor(Math.random() * 4), pick(['#f8fafc', '#fde047', '#22d3ee', '#fb7185'])), transparent: true, roughness: .8 }));
          pl.position.set(0, 2.55, .292); g.add(pl);
        }
        /* лицо: ресницы, губы, бакенбарды */
        var ey = g.userData.ey;
        if (ey && Math.random() < .5) { [-.11, .11].forEach(function (x) { bx(ey, .1, .012, .02, 0x15110d, x, .06, .04); }); }
        bx(g, .09, .016, .02, 0xb4505a, 0, 3.145, .283, .5);
        if (Math.random() < .4) [-.27, .27].forEach(function (x) { bx(g, .04, .22, .06, 0x2a1a10, x, 3.28, .06, .8).material.color.set(0x2a1a10); });
        /* шея: тень под подбородком */
        bx(g, .24, .05, .16, 0x000000, 0, 3.07, .09, 1).material.transparent = true;
        g.children[g.children.length - 1].material.opacity = .18;
        /* борода и кудри */
        var hm = g.children.find(function (c) { return c.geometry && c.geometry.type == 'SphereGeometry' && c.geometry.parameters && Math.abs(c.geometry.parameters.radius - .325) < .01; });
        var hcol = hm && hm.material ? hm.material.color.getHex() : 0x2a1a10;
        if (Math.random() < .22 && !g.children.some(function (c) { return c.geometry && c.geometry.type == 'BoxGeometry' && Math.abs(c.position.y - 3.08) < .01 && Math.abs(c.position.z + .2) < .01; })) {
          var bd = new THREE.Mesh(new THREE.SphereGeometry(.27, 16, 12), M(hcol, .9)); bd.scale.set(.95, .62, .8); bd.position.set(0, 3.14, .1); bd.castShadow = true; g.add(bd);
        }
        if (Math.random() < .14) { for (var k = 0; k < 9; k++) { var a2 = k / 9 * PI * 2, cl = new THREE.Mesh(new THREE.SphereGeometry(.11, 10, 8), M(hcol, .9)); cl.position.set(Math.cos(a2) * .22, 3.56 + (k % 3) * .04, Math.sin(a2) * .22 - .02); g.add(cl); } }
        /* голова — отдельная группа, чтобы кивать и поворачиваться */
        var head = new THREE.Group(); head.position.set(0, 3.05, 0);
        g.children.slice().forEach(function (c) { if (c.position.y >= 3.05 && c.parent === g) { c.position.y -= 3.05; head.add(c); } });
        g.add(head); g.userData.head = head;
      } catch (e) { }
      return g;
    };

    /* ---------- оживление клиентов: кивки, взгляды, жесты, ожидание ---------- */
    function damp(o, k, v, dt) { o[k] += (v - o[k]) * Math.min(1, dt * 8); }
    function anim(dt) {
      var tt = clock.elapsedTime, talkN = (typeof TK !== 'undefined' && TK && mode == 'talk') ? TK.l[TK.i][0] : null;
      CU.forEach(function (c) {
        var a = c.g.userData, h = a.head; if (!h || !a.ar) return;
        var L = a.ar[0], Rr = a.ar[1], hx = 0, hy = 0, hz = 0, l0x = 0, l0z = 0, r0x = null, r0z = 0;
        if (c.s == 'wait') {
          c.wt = (c.wt || 0) + dt;
          var talking = talkN && talkN == c.name, imp = c.t < 25;
          hx = Math.sin(tt * .8 + c.sl) * .035; hz = Math.sin(tt * .55 + c.sl * 2) * .03; hy = talking ? 0 : Math.sin(tt * .35 + c.sl) * .14;
          if (talking) { hx += Math.sin(tt * 6.5) * .05; l0x = -.5 + Math.sin(tt * 4.2) * .28; r0x = -.45 + Math.sin(tt * 3.3 + 1) * .3; }
          else if (c.wt < 2.4) { r0x = -2.5; r0z = Math.sin(c.wt * 10) * .3; }               // «привет!» рукой
          else if (imp) { l0x = -1.05; l0z = .6; r0x = -1.05; r0z = -.6; hx += .1; var tap = Math.max(0, Math.sin(tt * 9)); a.lg[1].rotation.x = -tap * .25; }  // скрестил руки, постукивает ногой
          if (!(imp && !talking && c.wt >= 2.4)) a.lg[1].rotation.x *= .85;
        } else { hx = Math.sin(tt * 9 + c.sl) * .025; }
        damp(h.rotation, 'x', hx, dt); damp(h.rotation, 'y', hy, dt); damp(h.rotation, 'z', hz, dt);
        damp(L.rotation, 'x', l0x, dt); damp(L.rotation, 'z', l0z, dt);
        if (r0x !== null) { Rr.rotation.x = r0x; damp(Rr.rotation, 'z', r0z, dt); } else damp(Rr.rotation, 'z', 0, dt);
      });
    }
    var _tc = tickCU;
    tickCU = function (dt) { var r = _tc.apply(this, arguments); try { anim(dt); } catch (e) { console.error('[chars2]', e); } return r; };
  }
  var n = 0, iv = setInterval(function () { if (ready()) { clearInterval(iv); go(); } else if (++n > 400) clearInterval(iv); }, 100);
})();
