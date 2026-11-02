/* PC МАСТЕР — chars.js (после world2.js): больше деталей и разнообразия у людей.
   Рюкзаки, сумки, кепки, наушники, шарфы, часы, усы, разный рост и комплекция. */
(function () {
  if (window.__charsLoaded) return; window.__charsLoaded = 1;
  function ready() { try { return typeof mkP === 'function' && typeof THREE !== 'undefined'; } catch (e) { return false; } }
  function go() {
    var _mk = mkP, PI = Math.PI;
    function M(c, r) { return new THREE.MeshStandardMaterial({ color: c, roughness: r === undefined ? .75 : r, metalness: 0 }); }
    function bx(p, w, h, d, c, x, y, z, r) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c, r)); m.position.set(x, y, z); m.castShadow = true; p.add(m); return m; }
    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
    var COL = [0x1d4ed8, 0xb91c1c, 0x15803d, 0xca8a04, 0x7e22ce, 0x0f766e, 0xea580c, 0x334155];
    mkP = function (o) {
      var g = _mk(o); o = o || {};
      try {
        if (o.bad) return g;
        var fem = false; try { fem = g.children.some(function (c) { return c.geometry && c.geometry.type == 'BoxGeometry' && Math.abs(c.position.y - 3.08) < .01 && Math.abs(c.position.z + .2) < .01; }); } catch (e) { }
        var w = .92 + Math.random() * .18, h = .94 + Math.random() * .14; g.scale.set(w, h, w);
        var r = Math.random();
        if (r < .35) { var bp = pick(COL); bx(g, .6, .8, .26, bp, 0, 2.3, -.36); bx(g, .5, .3, .06, 0x111111, 0, 2.05, -.5); [-.2, .2].forEach(function (x) { bx(g, .07, .75, .05, 0x111111, x, 2.45, -.2); }); }
        else if (r < .55 || fem && r < .7) { var bc = pick(COL); bx(g, .42, .34, .16, bc, -.74, 1.55, .05); bx(g, .06, 1.1, .06, 0x111111, -.55, 2.15, .02).rotation.z = .28; }
        var q = Math.random();
        if (q < .22) { var cc = pick(COL); g.children.slice().forEach(function (c) { var gt = c.geometry && c.geometry.type; if (gt == 'ConeGeometry' || (gt == 'SphereGeometry' && c.position.y > 3.7)) c.visible = false; }); var cap = new THREE.Mesh(new THREE.SphereGeometry(.37, 18, 10, 0, PI * 2, 0, PI * .5), M(cc)); cap.scale.set(1, .85, 1.06); cap.position.set(0, 3.4, -.01); g.add(cap); bx(g, .46, .035, .3, cc, 0, 3.47, .36); }
        else if (q < .38) { var hp = new THREE.Mesh(new THREE.TorusGeometry(.36, .03, 8, 24, PI), M(0x111111, .4)); hp.position.set(0, 3.38, 0); hp.rotation.z = 0; g.add(hp); [-.36, .36].forEach(function (x) { bx(g, .08, .22, .2, 0x111111, x, 3.34, 0); }); }
        if (Math.random() < .25) { var sc = new THREE.Mesh(new THREE.TorusGeometry(.2, .07, 8, 18), M(pick(COL))); sc.position.set(0, 3.0, .02); sc.rotation.x = PI / 2; g.add(sc); bx(g, .12, .45, .05, 0x222222, .12, 2.8, .26).material.color.set(0x555555); }
        if (Math.random() < .5) { var arm = g.userData.ar && g.userData.ar[Math.random() < .5 ? 0 : 1]; if (arm) { var wt = new THREE.Mesh(new THREE.TorusGeometry(.1, .02, 6, 14), M(Math.random() < .5 ? 0x111111 : 0xb0b6c0, .3)); wt.rotation.x = PI / 2; wt.position.set(0, -1.0, 0); arm.add(wt); } }
        if (!fem && Math.random() < .2) bx(g, .15, .025, .03, 0x2a1a10, 0, 3.225, .295);
        if (Math.random() < .3) bx(g, .12, .07, .02, 0xffffff, .22, 2.65, .3);
      } catch (e) { }
      return g;
    };
  }
  var n = 0, iv = setInterval(function () { if (ready()) { clearInterval(iv); go(); } else if (++n > 400) clearInterval(iv); }, 100);
})();
