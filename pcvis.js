/* PC МАСТЕР — pcvis.js (подключать после windows.js)
   1) Детали ПК стали детальнее: у видеокарт вентиляторы и рёбра, у плат слоты PCIe/M.2 и подсветка,
      у блоков питания решётка и кабели, у корпусов — задний вентилятор и кабель-менеджмент.
   2) ВИТРИНА: теперь показывает НАСТОЯЩИЕ собранные ПК со своими деталями (а не одинаковые пустые корпуса).
      Каждому ПК запоминается список деталей; у старых сохранений детали подбираются по цене/бренду.
   3) Над каждым ПК на витрине — ценник, под ними — стеклянная полка с подсветкой. */
(function () {
  if (window.__pcvisLoaded) return; window.__pcvisLoaded = 1;
  var PI = Math.PI;
  function ok() { try { return typeof PB !== 'undefined' && typeof CAT !== 'undefined' && typeof decor === 'function' && typeof fin === 'function' && typeof THREE !== 'undefined'; } catch (e) { return false; } }
  function go() {
    var _tex = {};
    function T(k, f) { return _tex[k] || (_tex[k] = f()); }
    function M(c, e, r, m) { return mat(c, e || 0, r === undefined ? .6 : r, m === undefined ? .2 : m); }
    function B(g, w, h, d, c, x, y, z, e, r, m) { var o = bx(g, w, h, d, c, x, y, z, e || 0, r === undefined ? .6 : r, m === undefined ? .2 : m); return o; }
    function spinFan(g, r, x, y, z, e, rx, ry) { /* вентилятор на любой стороне */
      var tg = new THREE.Group(); tg.position.set(x, y, z); tg.rotation.set(rx || 0, ry || 0, 0); g.add(tg); fan(tg, r, 0, 0, 0, e); return tg;
    }

    /* ---------- видеокарта: вентиляторы снизу, рёбра, подсветка, бэкплейт ---------- */
    var _gpu = PB[5];
    PB[5] = function (d) {
      var g = _gpu(d), t = d.t, nv = d.b == 'Nvira', E1 = nv ? 0x76b900 : 0xed1c24,
        L = [2.3, 2.8, 3.1][t], th = [.4, .45, .6][t], w = [.95, 1.1, 1.2][t], n = t == 0 ? 2 : 3, r = t == 0 ? .38 : (t == 1 ? .4 : .42);
      try {
        var sp = (L - .35) / n;
        for (var i = 0; i < n; i++) spinFan(g, r, .3 + sp * (i + .5), -th / 2 - .02, 0, t ? E1 : 0, PI / 2, 0);
        /* рёбра радиатора на торце */
        for (var k = 0; k < 9; k++) B(g, L - .5, .02, .03, 0x2a2e37, L / 2 + .1, -th / 2 + .04 + k * (th / 10), -w / 2 - .005, 0, .4, .8);
        /* контакты PCIe */
        B(g, 1.0, .05, .04, 0xc9a24a, .6, -th / 2 + .03, -w / 2 + .02, 0, .3, .9);
        /* вырезы бэкплейта и полоса */
        B(g, L * .5, .01, w * .28, 0x050506, L * .58, th / 2 + .012, -w * .12);
        if (t) B(g, L - .4, .04, .04, E1, L / 2, th / 2 + .01, -w / 2 + .03, E1);
        if (t == 2) { B(g, .5, .03, .22, 0xdcdfe5, L - .45, th / 2 + .02, w / 2 - .22, 0, .3, .8); }
        /* разъём питания */
        B(g, .45, .12, .3, 0x111113, L - .35, th / 2 + .06, w / 2 - .22);
        for (var j = 0; j < 4; j++) B(g, .05, .03, .22, 0xc9a24a, L - .5 + j * .1, th / 2 + .13, w / 2 - .22);
      } catch (e) { }
      return g;
    };

    /* ---------- материнка: слоты PCIe, M.2 радиаторы, чипсет, подсветка ---------- */
    var _mb = PB[1];
    PB[1] = function (d) {
      var g = _mb(d), t = d.t, Z = .025, E1 = TC[t];
      try {
        /* слоты PCIe */
        [-.12, -.58].forEach(function (y) { B(g, 1.1, .09, .1, 0x15171c, .55, y, Z + .05); B(g, 1.1, .02, .02, 0x8c929c, .55, y + .04, Z + .105, 0, .3, .8); });
        B(g, .36, .1, .12, 0xe5e7eb, .2, 1.52, Z + .06); B(g, .36, .1, .12, 0xe5e7eb, -.3, 1.52, Z + .06);
        /* подсветка по краю */
        if (t) { B(g, .04, 3.0, .04, E1, 1.2, 0, Z + .03, E1); B(g, 2.3, .03, .03, E1, 0, -1.5, Z + .03, E1); }
        /* конденсаторы возле сокета */
        for (var k = 0; k < 6; k++) { var c = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .1, 12), M(k % 2 ? 0x1a1c22 : 0xc9ced6, 0, .4, .6)); c.position.set(-.55 + k * .12, .1 + (k % 2) * .08, Z + .06); c.rotation.x = PI / 2; g.add(c); }
      } catch (e) { }
      return g;
    };

    /* ---------- блок питания: решётка вентилятора, кабели, надписи ---------- */
    var _psu = PB[6];
    PB[6] = function (d) {
      var g = _psu(d);
      try {
        for (var i = 0; i < 6; i++) B(g, .05, .13, .17, 0x0b0b0e, .77, .28 - i * .11 + 0, -.4 + (i % 2) * .4 + .2, 0, .8, 0);
        B(g, .03, .86, 1.41, [0x16a34a, 0x2563eb, 0xd946ef][d.t], .76, 0, 0, [0, .6, 1.2][d.t], .5, .3);
        B(g, 1.52, .04, 1.42, 0x2a2e37, 0, .43, 0, 0, .4, .7);
      } catch (e) { }
      return g;
    };

    /* ---------- корпус: задний вентилятор, кабель-менеджмент, логотип ---------- */
    var _case = PB[0];
    PB[0] = function (d) {
      var g = _case(d), t = d.t, E1 = t ? TC[t] : 0;
      try {
        lp(g, ['', 'MIDI', 'RGB PRO', 'PREMIUM'][t] || '', 1.1, .22, 2.27, -1.85, 0, '#9ca3af', null, PI / 2);
        if (t == 2) B(g, .04, 4.0, .04, TC[t], 2.28, 0, -1.0, TC[t]);
        if (t == 1) B(g, .04, 3.6, .04, 0x2a2e37, 2.27, 0, -.9);
      } catch (e) { }
      return g;
    };
    /* PB — константа-массив, но элементы заменяются: старые ссылки на bCase не нужны */

    /* ---------- ВИТРИНА ---------- */
    function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
    function derive(p) { /* для старых сохранений: детали по цене и бренду */
      var h = hash(p.n || 'pc'), f = Math.max(0, Math.min(1, (p.v || 300) / 1400)), sel = [];
      function rn() { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 4294967296; }
      function pickc(c, flt) {
        var idx = []; CAT[c].forEach(function (x, i) { if (!flt || flt(x)) idx.push(i); });
        if (!idx.length) idx = CAT[c].map(function (x, i) { return i; });
        idx.sort(function (a, b) { return CAT[c][a].p - CAT[c][b].p; });
        var q = Math.max(0, Math.min(1, f + (rn() - .5) * .35)); return idx[Math.round(q * (idx.length - 1))];
      }
      var cs = pickc(2, function (x) { return !p.cb || x.b == p.cb; }), cpu = CAT[2][cs];
      var mb = pickc(1, function (x) { return x.s == cpu.s; }), mbd = CAT[1][mb];
      sel[0] = [0, pickc(0)]; sel[1] = [1, mb]; sel[2] = [2, cs]; sel[3] = [3, pickc(3)];
      sel[4] = [4, pickc(4, function (x) { return x.r == mbd.r; })];
      sel[5] = [5, pickc(5, function (x) { return !p.gb || x.b == p.gb; })]; sel[6] = [6, pickc(6)];
      return sel;
    }
    window.pcParts = function (p) { return (p.parts && p.parts.length ? p.parts : (p.parts = derive(p))); };

    window.mkShowPC = function (p) {
      var parts = window.pcParts(p), by = {};
      parts.forEach(function (a) { if (a && CAT[a[0]] && CAT[a[0]][a[1]]) by[a[0]] = CAT[a[0]][a[1]]; });
      var g = PB[0](by[0] || CAT[0][1]);
      [1, 2, 3, 4, 5, 6].forEach(function (c) { if (!by[c]) return; var q = PB[c](by[c]); q.position.set(GP[c][0], GP[c][1], GP[c][2]); g.add(q); });
      var gl = bx(g, 4.5, 4.5, .06, 0x99ccff, 0, 0, 1.1, 0, .05, .6); gl.material.transparent = true; gl.material.opacity = .14; gl.material.depthWrite = false;
      g.traverse(function (o) { if (o.material && o.material.emissiveIntensity > 0) o.material.emissiveIntensity = 1.8; if (o.userData && o.userData.fan) o.userData.on = 1; });
      return g;
    };

    var shelfG = null;
    decor = function () {
      try { dec.traverse(function (o) { if (o.userData && o.userData.fan) { var i = FN.indexOf(o); if (i >= 0) FN.splice(i, 1); } }); } catch (e) { }
      while (dec.children.length) dec.remove(dec.children[0]);
      if (!G) return;
      /* стеклянная полка с подсветкой */
      var sh = new THREE.Group();
      var gl = bx(sh, 5.8, .06, 1.3, 0x9fd8ff, 6.0, 2.46, -7.2, 0, .1, .1); gl.material.transparent = true; gl.material.opacity = .35;
      bx(sh, 5.8, .04, .06, 0x22d3ee, 6.0, 2.43, -6.58, 0x22d3ee);
      dec.add(sh);
      G.pcs.slice(0, 5).forEach(function (p, i) {
        var c = window.mkShowPC(p); c.scale.setScalar(.213); c.position.set(4.2 + i * 1.1, 2.97, -7.2); c.rotation.y = (i - 2) * .06; dec.add(c);
        var lb = ('$' + Math.round(p.v || 0)); lp(dec, lb, .8, .2, 4.2 + i * 1.1, 3.62, -6.9, '#fff', '#0e7490');
      });
    };
    try { if (G) decor(); } catch (e) { }

    /* запоминаем детали при завершении сборки */
    var _fin = fin;
    fin = function () {
      var pl = []; try { pl = A.pl.map(function (x) { return [x.c, x.i]; }); } catch (e) { }
      _fin.apply(this, arguments);
      try { if (benchPC && benchPC.userData && benchPC.userData.pc) benchPC.userData.pc.parts = pl; } catch (e) { }
    };
  }
  if (ok()) go(); else { var n = 0, iv = setInterval(function () { if (ok()) { clearInterval(iv); go(); } else if (++n > 200) clearInterval(iv); }, 50); }
})();
