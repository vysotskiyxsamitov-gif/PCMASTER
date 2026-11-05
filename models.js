/* PC МАСТЕР — models.js (подключать ПОСЛЕ chars2.js, detail.js, look.js — в самом конце)
   Полностью новые модели:
   • ЛЮДИ: сглаженные тела (lathe), шея, лицо с веками/ресницами/губами/носом, уши, руки с пальцами, обувь со шнурками,
     4 вида одежды (футболка, худи, пиджак, поло), 8 причёсок, борода, очки, рюкзаки, кепки, наушники, часы, бейджи
   • МЕБЕЛЬ: диван (мягкие подушки, пледы), офисное кресло на колёсиках, растения (качаются), кулер с пузырьками, верстак с ящиками и тисками
   Контракт для остального кода сохранён: userData.lg[2], ar[2], ey, bx, head; ноги крутятся вокруг бедра, руки — вокруг плеча.
   Если что-то пошло не так — модуль сам отключается и остаются старые модели. */
(function () {
  if (window.__modelsLoaded) return;
  window.__modelsLoaded = 1;
  function ready() { try { return typeof THREE !== 'undefined' && !!scene && typeof mkP === 'function' && !!window.__roomLoaded && !!window.__windowsLoaded && window.__chars2Loaded; } catch (e) { return false; } }
  function safe(f) { try { return f(); } catch (e) { console.error('[models]', e); } }

  function go() {
    var PI = Math.PI;
    function rn(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
    function M(c, r, m) { return new THREE.MeshStandardMaterial({ color: c, roughness: r === undefined ? .75 : r, metalness: m || 0 }); }
    function add(p, geo, mat, x, y, z, sx, sy, sz, shadow) {
      var m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); if (sx !== undefined) m.scale.set(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz);
      if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; } p.add(m); return m;
    }
    function S(p, r, mat, x, y, z, sx, sy, sz) { return add(p, new THREE.SphereGeometry(r, 18, 14), mat, x, y, z, sx, sy, sz); }
    function C(p, r1, r2, h, mat, x, y, z, sx, sz) { return add(p, new THREE.CylinderGeometry(r1, r2, h, 20), mat, x, y, z, sx === undefined ? 1 : sx, 1, sz === undefined ? 1 : sz); }
    function B(p, w, h, d, mat, x, y, z) { return add(p, new THREE.BoxGeometry(w, h, d), mat, x, y, z); }
    function L(p, pts, mat, x, y, z, sx, sz) { var g = new THREE.LatheGeometry(pts.map(function (a) { return new THREE.Vector2(a[0], a[1]); }), 28); return add(p, g, mat, x, y, z, sx === undefined ? 1 : sx, 1, sz === undefined ? 1 : sz); }
    function dk(c, k) { return new THREE.Color(c).multiplyScalar(k).getHex(); }
    function lt(c, k) { return new THREE.Color(c).lerp(new THREE.Color(0xffffff), k).getHex(); }
    var COL = [0x1d4ed8, 0xb91c1c, 0x15803d, 0xca8a04, 0x7e22ce, 0x0f766e, 0xea580c, 0x334155];
    var SKIN = [0xf1c9a5, 0xe0b99a, 0xc68a62, 0x8d5a3c, 0xf5d5b8, 0x6b4430];
    var HAIR = [0x2a1a10, 0x111111, 0x6b4a2a, 0xb8893c, 0x777777, 0x4a2a14, 0x9a3412];
    var _old = mkP;

    /* ---------- рисунок на футболке ---------- */
    var PR = {};
    function printTex(kind, col) {
      var k = kind + col; if (PR[k]) return PR[k];
      var c = document.createElement('canvas'); c.width = c.height = 128; var x = c.getContext('2d'); x.fillStyle = col; x.strokeStyle = col; x.lineWidth = 10;
      if (kind == 0) { x.beginPath(); x.arc(64, 64, 44, 0, PI * 2); x.stroke(); x.fillRect(54, 30, 20, 68); }
      else if (kind == 1) { for (var i = 0; i < 4; i++) x.fillRect(14, 22 + i * 26, 100, 12); }
      else if (kind == 2) { x.beginPath(); x.moveTo(64, 12); x.lineTo(116, 112); x.lineTo(12, 112); x.closePath(); x.fill(); }
      else { x.font = 'bold 74px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('PC', 64, 66); }
      var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return (PR[k] = t);
    }

    /* ---------- ЧЕЛОВЕК ---------- */
    function build(o) {
      o = o || {};
      var g = new THREE.Group(), bad = !!o.bad, col = o.col === undefined ? pick(COL) : o.col, pa = o.pa === undefined ? pick([0x1f2937, 0x334155, 0x3f3f46, 0x1e3a5f, 0x44403c]) : o.pa;
      var sk = o.sk === undefined ? pick(SKIN) : o.sk, hr = o.hair === undefined ? pick(HAIR) : o.hair;
      var fem = !bad && (o.long === true || (o.long === undefined && o.hs === undefined && Math.random() < .42));
      var style = bad ? 0 : (o.style === undefined ? rn(0, 3) : o.style);              // 0 футболка, 1 худи, 2 пиджак, 3 поло
      if (bad) { col = o.col === undefined ? 0x1b1b1f : col; }
      var mSk = M(sk, .62), mCol = M(col, .85), mDk = M(dk(col, .55), .85), mPa = M(pa, .9), mHr = M(hr, .6), mSh;
      var shoeC = bad ? 0x15171c : pick([0x15171c, 0xf8fafc, 0x7f1d1d, 0x1d4ed8, 0xe5e7eb]); mSh = M(shoeC, .6);
      var a = { lg: [], ar: [], fem: fem };

      /* торс: гладкий профиль вращения */
      var wA = fem ? .32 : .36, hA = fem ? .4 : .37, sh = fem ? .44 : .46;
      var tor = L(g, [[.01, 1.45], [hA, 1.5], [wA + .02, 1.88], [wA, 2.05], [.41, 2.4], [sh, 2.72], [.42, 2.9], [.22, 3.0], [.01, 3.02]], mCol, 0, 0, 0, 1.12, .66);
      /* плечи */
      [-1, 1].forEach(function (s) { S(g, .22, mCol, s * .56, 2.84, 0, 1, .92, 1); });
      /* ремень, шлёвки, пряжка */
      C(g, .385, .39, .1, M(0x1c1f26, .5), 0, 1.55, 0, 1.12, .66); B(g, .12, .1, .04, M(0xcbd5e1, .3, .8), 0, 1.55, .28);
      /* шея */
      C(g, .105, .12, .2, mSk, 0, 3.04, 0);
      /* одежда */
      if (style == 0) {                                                   // футболка: воротник + рисунок
        add(g, new THREE.TorusGeometry(.14, .035, 8, 18), mDk, 0, 3.0, .02, 1, 1, 1).rotation.x = PI / 2;
        if (!bad && Math.random() < .55) { var pl = new THREE.Mesh(new THREE.PlaneGeometry(.34, .34), new THREE.MeshStandardMaterial({ map: printTex(rn(0, 3), pick(['#f8fafc', '#fde047', '#22d3ee', '#fb7185'])), transparent: true, roughness: .8 })); pl.position.set(0, 2.5, .3); g.add(pl); }
      } else if (style == 1) {                                            // худи: капюшон, шнурки, карман, молния
        S(g, .3, mCol, 0, 3.0, -.2, 1.25, .8, .9); add(g, new THREE.TorusGeometry(.17, .05, 8, 20), mDk, 0, 2.98, .0, 1, 1, 1).rotation.x = PI / 2;
        [-.07, .07].forEach(function (x) { C(g, .012, .012, .5, M(0xe5e7eb, .6), x, 2.62, .29); });
        B(g, .62, .3, .05, mDk, 0, 1.85, .27); B(g, .02, 1.1, .02, M(0xcbd5e1, .3, .8), 0, 2.3, .29);
      } else if (style == 2) {                                            // пиджак: рубашка, лацканы, пуговицы, галстук
        B(g, .22, .8, .03, M(0xf3f4f6, .7), 0, 2.62, .29);
        [-1, 1].forEach(function (s) { var l = B(g, .13, .55, .035, M(lt(col, .12), .8), s * .14, 2.72, .3); l.rotation.z = s * .24; });
        B(g, .06, .46, .03, M(0x7f1d1d, .6), 0, 2.5, .31); [1.95, 2.15].forEach(function (y) { S(g, .025, M(0x111, .3, .6), 0, y, .3); });
        add(g, new THREE.TorusGeometry(.14, .03, 8, 18), M(0xf3f4f6, .7), 0, 3.0, .02, 1, 1, 1).rotation.x = PI / 2;
      } else {                                                            // поло: воротник и планка
        [-1, 1].forEach(function (s) { var c = B(g, .14, .12, .04, mDk, s * .1, 2.98, .24); c.rotation.z = s * -.5; });
        B(g, .06, .4, .02, mDk, 0, 2.78, .3); [2.84, 2.7].forEach(function (y) { S(g, .02, M(0xf3f4f6, .3), 0, y, .315); });
      }

      /* ноги */
      [-.2, .2].forEach(function (x, i) {
        var q = new THREE.Group(); q.position.set(x, 1.5, 0);
        C(q, .19, .16, .8, mPa, 0, -.4, 0); S(q, .165, mPa, 0, -.8, 0); C(q, .16, .125, .7, mPa, 0, -1.1, 0); C(q, .135, .14, .06, M(dk(pa, .7), .9), 0, -1.43, 0);
        B(q, .17, .02, .02, M(dk(pa, .6), .9), 0, -.15, .19);                         // шов кармана
        var sg = new THREE.Group(); sg.position.set(0, -1.44, 0); q.add(sg);
        add(sg, new THREE.BoxGeometry(.28, .15, .5), mSh, 0, .0, .1); S(sg, .14, mSh, 0, -.005, .33, 1, .7, 1.05);
        B(sg, .3, .05, .58, M(0xe5e7eb, .6), 0, -.1, .11);                              // подошва
        if (!bad) { B(sg, .2, .015, .14, M(0xf8fafc, .6), 0, .08, .16); B(sg, .012, .012, .12, M(0x9ca3af, .6), 0, .09, .2); }  // шнурки
        g.add(q); a.lg.push(q);
      });

      /* руки */
      var sleeve = style == 0 || style == 3;                                  // короткий рукав
      [-1, 1].forEach(function (s, i) {
        var q = new THREE.Group(); q.position.set(s * .64, 2.85, 0);
        C(q, .13, .115, sleeve ? .5 : .85, mCol, 0, sleeve ? -.25 : -.43, 0);
        if (!sleeve) C(q, .12, .12, .08, mDk, 0, -.86, 0);
        var fa = sleeve ? .82 : .5, fy = sleeve ? -.9 : -1.1, handM = bad ? M(0x0a0a0a, .8) : mSk;
        C(q, .095, .08, fa, handM, 0, fy, 0);
        var hd = new THREE.Group(); hd.position.set(0, -1.38, 0); q.add(hd);
        S(hd, .1, handM, 0, 0, 0, 1, 1.05, .6);
        for (var k = 0; k < 4; k++) { var f = C(hd, .02, .017, .15, handM, -.06 + k * .04, -.12 - (k == 1 || k == 2 ? .015 : 0), .015); f.rotation.x = .1; }
        var th = C(hd, .022, .018, .12, handM, -s * .095, -.04, .045); th.rotation.z = s * .7; th.rotation.x = .3;
        g.add(q); a.ar.push(q);
      });

      /* голова — отдельная группа */
      var head = new THREE.Group(); head.position.set(0, 3.05, 0); g.add(head); a.head = head;
      S(head, .3, mSk, 0, .3, 0, .92, 1.08, .98); S(head, .2, mSk, 0, .16, .07, 1.12, .8, .95);                          // череп и челюсть
      [-1, 1].forEach(function (s) { S(head, .06, mSk, s * .285, .28, 0, .5, 1, .8); S(head, .04, M(dk(sk, .85), .7), s * .292, .28, .01, .35, .7, .6); });   // уши
      S(head, .05, mSk, 0, .22, .3, 1, 1.15, .9);                                                                          // нос
      var mouth = new THREE.Group(); mouth.position.set(0, .13, .29); head.add(mouth);
      S(mouth, .045, M(fem ? 0xb4505a : 0xa6525a, .5), 0, .012, 0, 1.6, .45, .5); S(mouth, .04, M(fem ? 0x9f3f4a : 0x8f464e, .5), 0, -.012, .005, 1.4, .45, .5);
      /* глаза */
      var ey = new THREE.Group(); ey.position.set(0, .32, .265); head.add(ey); a.ey = ey;
      var eg = pick([0x2b2018, 0x3b5b92, 0x3f6b3a, 0x5a3a22]);
      [-.11, .11].forEach(function (x) {
        S(ey, .062, M(0xf8f8f8, .3), x, 0, 0, 1, .85, .5); S(ey, .036, M(eg, .3), x, 0, .028, 1, 1, .5); S(ey, .016, M(0x05060a, .3), x, 0, .04, 1, 1, .5); S(ey, .008, M(0xffffff, .1), x + .012, .014, .047, 1, 1, .5);
        var lid = S(ey, .066, mSk, x, .018, .004, 1, .55, .55); lid.position.y = .026;
        if (fem && !bad) B(ey, .11, .012, .02, M(0x15110d, .8), x, .052, .042);                                              // ресницы
      });
      [-.11, .11].forEach(function (x, i) { var b = B(head, .14, fem ? .022 : .03, .03, mHr, x, .445, .275); b.rotation.z = (i ? 1 : -1) * .12; });
      if (fem) [-.14, .14].forEach(function (x) { S(head, .055, M(0xf0a0a0, .9), x, .17, .26, 1, .6, .2).material.transparent = true; });

      /* причёска */
      var hs = bad ? -1 : (o.hs !== undefined ? o.hs : (fem ? pick([2, 3, 4, 5]) : pick([0, 1, 6, 7, 0, 1])));
      function cap(sc) { var m = new THREE.Mesh(new THREE.SphereGeometry(.325, 20, 14, 0, PI * 2, 0, PI * (sc || .55)), mHr); m.scale.set(.94, 1.12, 1.04); m.position.set(0, .31, -.01); m.castShadow = true; head.add(m); return m; }
      if (hs == 0) { cap(.55); B(head, .5, .08, .08, mHr, 0, .47, .27); }                                                    // стрижка с чёлкой
      else if (hs == 1) { cap(.5); for (var k = 0; k < 7; k++) { var sp = add(head, new THREE.ConeGeometry(.055, .2, 6), mHr, (k - 3) * .09, .62, .02 + (k % 2) * .08); sp.rotation.z = (k - 3) * .13; } }   // торчком
      else if (hs == 2) { cap(.6); B(head, .64, .8, .2, mHr, 0, .05, -.2); [-1, 1].forEach(function (s) { S(head, .1, mHr, s * .3, .27, -.02, .7, 1.6, .9); }); }          // длинные
      else if (hs == 3) { cap(.55); S(head, .15, mHr, 0, .72, -.1, 1, 1, 1); [-1, 1].forEach(function (s) { S(head, .08, mHr, s * .28, .35, .0, .7, 1.4, .9); }); }       // пучок
      else if (hs == 4) { cap(.55); [-1, 1].forEach(function (s) { S(head, .12, mHr, s * .3, .2, .02, .8, 1.5, 1); }); B(head, .62, .4, .2, mHr, 0, .15, -.22); }          // каре
      else if (hs == 5) { cap(.55); var pt = C(head, .06, .04, .55, mHr, 0, .15, -.36); pt.rotation.x = .35; S(head, .09, mHr, 0, -.14, -.46, 1, 1.2, 1); }                  // хвост
      else if (hs == 6) { for (var k2 = 0; k2 < 12; k2++) { var an = k2 / 12 * PI * 2, cl = S(head, .11, mHr, Math.cos(an) * .22, .56 + (k2 % 3) * .03, Math.sin(an) * .22 - .02, 1, 1, 1); } S(head, .25, mHr, 0, .6, -.02, 1, .7, 1); }   // кудри
      else if (hs == 7) { cap(.42); }                                                                                        // почти бритый
      if (bad) {                                                                                                             // балаклава
        var bm = new THREE.Mesh(new THREE.SphereGeometry(.34, 20, 14), M(0x0b0b0e, .95)); bm.scale.set(.96, 1.14, 1.06); bm.position.set(0, .3, -.01); head.add(bm);
        B(head, .5, .1, .09, M(0x000000, 1), 0, .33, .27);
      }
      /* борода и усы */
      if (!bad && !fem && Math.random() < .3) { var full = Math.random() < .5; S(head, full ? .27 : .2, mHr, 0, full ? .1 : .13, .1, .95, full ? .75 : .45, .8); if (full) S(head, .12, mHr, 0, .15, .26, 1.6, .35, .5); }
      else if (!bad && !fem && Math.random() < .2) B(head, .16, .03, .04, mHr, 0, .17, .295);
      /* очки */
      if (!bad && Math.random() < .22) { [-.11, .11].forEach(function (x) { add(head, new THREE.TorusGeometry(.078, .013, 8, 20), M(0x111111, .4), x, .32, .3, 1, 1, 1); }); B(head, .08, .012, .012, M(0x111111, .4), 0, .33, .3); [-1, 1].forEach(function (s) { B(head, .012, .012, .3, M(0x111111, .4), s * .19, .33, .15); }); }

      /* аксессуары */
      if (!bad) {
        var r = Math.random();
        if (r < .33) { var bp = pick(COL); B(g, .6, .8, .26, M(bp, .8), 0, 2.3, -.38); S(g, .3, M(bp, .8), 0, 2.7, -.38, 1, .35, .45); B(g, .5, .3, .06, M(0x111111, .8), 0, 2.05, -.53); [-.2, .2].forEach(function (x) { B(g, .07, .75, .05, M(0x111111, .8), x, 2.45, -.2); }); }
        else if (r < .5) { var bg = pick(COL); B(g, .42, .34, .16, M(bg, .8), -.74, 1.55, .05); var st = B(g, .06, 1.1, .06, M(0x111111, .8), -.55, 2.15, .02); st.rotation.z = .28; }
        var q = Math.random();
        if (q < .22) { var cc = pick(COL), mc = M(cc, .8); var cp = new THREE.Mesh(new THREE.SphereGeometry(.34, 18, 10, 0, PI * 2, 0, PI * .5), mc); cp.scale.set(1, .85, 1.06); cp.position.set(0, .34, -.01); head.add(cp); B(head, .46, .035, .3, mc, 0, .38, .37); if (hs !== 7) { /* волосы из-под кепки остаются */ } }
        else if (q < .38) { var hp = new THREE.Mesh(new THREE.TorusGeometry(.36, .03, 8, 24, PI), M(0x111111, .4)); hp.position.set(0, .33, 0); head.add(hp); [-.36, .36].forEach(function (x) { B(head, .08, .22, .2, M(0x111111, .4), x, .29, 0); }); }
        if (Math.random() < .22) { var sc = new THREE.Mesh(new THREE.TorusGeometry(.2, .07, 8, 18), M(pick(COL), .9)); sc.position.set(0, 3.0, .02); sc.rotation.x = PI / 2; g.add(sc); B(g, .12, .45, .05, M(0x555555, .9), .12, 2.8, .26); }
        if (Math.random() < .5) { var arm = a.ar[Math.random() < .5 ? 0 : 1], wt = new THREE.Mesh(new THREE.TorusGeometry(.1, .02, 6, 14), M(Math.random() < .5 ? 0x111111 : 0xb0b6c0, .3, .6)); wt.rotation.x = PI / 2; wt.position.set(0, -1.28, 0); arm.add(wt); }
        if (Math.random() < .3) { B(g, .12, .07, .02, M(0xffffff, .6), .22, 2.65, .3); B(g, .015, .3, .01, M(pick(COL), .6), .22, 2.9, .3); }       // бейдж на ленте
      }

      /* ящик для сцен с коробкой (контракт старого кода) */
      var bxx = new THREE.Mesh(new THREE.BoxGeometry(.9, .7, .7), M(0x8a6b45, .8)); bxx.position.set(0, 2.3, .7); bxx.visible = false; g.add(bxx); a.bx = bxx;
      g.userData = a; g.rotation.order = 'YXZ'; g.visible = true;
      if (!bad) { var w = .92 + Math.random() * .18, h = .94 + Math.random() * .14; g.scale.set(w, h, w); }
      scene.add(g);
      return g;
    }
    mkP = function (o) { try { return build(o); } catch (e) { console.error('[models] человек — откат на старую модель', e); mkP = _old; return _old(o); } };
    window.__models = { mkP: mkP };

    /* ---------- МЕБЕЛЬ: прячем старую, строим новую ---------- */
    function oldGroup(x, z, tol) {
      var f = null; scene.children.forEach(function (o) { if (!f && o.type == 'Group' && Math.abs(o.position.x - x) < (tol || .05) && Math.abs(o.position.z - z) < (tol || .05) && Math.abs(o.position.y) < .05) f = o; });
      return f;
    }
    function hideOld(x, z) { var o = oldGroup(x, z); if (o) { o.visible = false; return o; } return null; }
    function grp(x, z, ry) { var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry || 0; scene.add(g); return g; }
    var sway = [], bub = [];

    /* диван */
    safe(function () {
      var old = hideOld(-6, 6.75); if (!old) return;
      var g = grp(-6, 6.75, old.rotation.y), fab = M(0x2d6a6a, .95), fab2 = M(0x35807f, .95), wood = M(0x5a3b22, .6);
      B(g, 3.5, .42, 1.25, fab, 0, .45, 0);                                                          // каркас
      [-1, 0, 1].forEach(function (i) { S(g, .62, fab2, i * 1.1, .85, .05, 1.0, .32, .86); });          // сиденья-подушки
      [-1, 0, 1].forEach(function (i) { var b = S(g, .6, fab2, i * 1.1, 1.38, .52, 1.0, .85, .3); b.rotation.x = -.18; }); // спинки
      B(g, 3.5, .8, .3, fab, 0, 1.0, .55);                                                           // задняя стенка
      [-1, 1].forEach(function (s) { var ar = C(g, .27, .27, 1.2, fab, s * 1.7, 1.0, 0, 1, 1); ar.rotation.x = PI / 2; S(g, .27, fab, s * 1.7, 1.0, .6, 1, 1, 1); S(g, .27, fab, s * 1.7, 1.0, -.6, 1, 1, 1); B(g, .26, .62, 1.2, fab, s * 1.7, .7, 0); });
      [[-1.55, .5], [1.55, .5], [-1.55, -.5], [1.55, -.5]].forEach(function (a) { C(g, .05, .035, .22, wood, a[0], .12, a[1]); });
      var pl = B(g, .62, .62, .16, M(0xf59e0b, .9), -1.0, 1.1, -.12); pl.rotation.set(.2, .3, .35); var pl2 = B(g, .55, .55, .15, M(0xe5e7eb, .9), 1.05, 1.05, -.1); pl2.rotation.set(.15, -.3, -.25);
      var bl = B(g, 1.2, .08, .6, M(0x7f1d1d, 1), .3, .74, -.35); bl.rotation.set(.12, .2, .02);
    });

    /* офисное кресло */
    safe(function () {
      var old = hideOld(6.3, -3); if (!old) return;
      var g = grp(6.3, -3, old.rotation.y), mt = M(0x1f2937, .85), ch = M(0xcbd5e1, .3, .8);
      for (var i = 0; i < 5; i++) { var an = i / 5 * PI * 2, arm = B(g, .55, .06, .09, ch, Math.cos(an) * .27, .16, Math.sin(an) * .27); arm.rotation.y = -an; S(g, .06, M(0x0b0b0e, .5), Math.cos(an) * .52, .08, Math.sin(an) * .52, 1, 1, 1); }
      C(g, .05, .05, .5, ch, 0, .5, 0); C(g, .09, .09, .15, mt, 0, .8, 0);
      B(g, .95, .14, .9, mt, 0, .92, 0); S(g, .5, mt, 0, .96, 0, 1.0, .18, .95);                                      // сиденье
      var bk = B(g, .9, 1.1, .14, mt, 0, 1.55, -.4); bk.rotation.x = -.12; B(g, .6, .4, .1, M(0x2d3748, .85), 0, 2.25, -.42);
      [-1, 1].forEach(function (s) { B(g, .07, .5, .07, ch, s * .5, 1.18, -.05); B(g, .1, .05, .5, mt, s * .5, 1.45, -.02); });
    });

    /* растения (качаются) */
    [[-9.1, 6.8], [9.2, 6.8], [9.2, -6.6]].forEach(function (pp, idx) {
      safe(function () {
        var old = hideOld(pp[0], pp[1]); if (!old) return;
        var g = grp(pp[0], pp[1], 0), pot = M(idx == 1 ? 0xc2410c : 0xe5e7eb, .8);
        L(g, [[.01, 0], [.32, 0], [.42, .08], [.5, .7], [.52, .76], [.46, .76], [.01, .72]], pot, 0, 0, 0, 1, 1);
        C(g, .45, .45, .04, M(0x2a1a10, 1), 0, .7, 0);
        var leaf = [M(0x2f855a, .7), M(0x276749, .7), M(0x38a169, .7)];
        for (var k = 0; k < 16; k++) {
          var lf = new THREE.Group(); lf.position.set(0, .72, 0); lf.rotation.y = k / 16 * PI * 2 + Math.random() * .3; g.add(lf);
          var tilt = .25 + (k % 4) * .17, len = .9 + (k % 3) * .35;
          var st = C(lf, .018, .012, len, M(0x2f6b3a, .8), 0, len / 2, 0); lf.rotation.z = 0;
          var blade = S(lf, .22, leaf[k % 3], 0, len, 0, .5, 1.5, .08); blade.position.set(.0, len + .2, 0);
          lf.userData = { t: tilt, p: Math.random() * 6 }; lf.rotation.x = tilt; sway.push(lf);
        }
      });
    });

    /* кулер с водой */
    safe(function () {
      var old = hideOld(9.2, 4.2); if (!old) return;
      var g = grp(9.2, 4.2, old.rotation.y), body = M(0xe5e7eb, .4, .1);
      B(g, .85, 1.8, .85, body, 0, .9, 0); B(g, .87, .1, .87, M(0xcbd5e1, .4, .3), 0, 1.8, 0); B(g, .5, .1, .5, M(0x1f2937, .6), 0, .6, .45);
      for (var i = 0; i < 6; i++) B(g, .5, .012, .02, M(0x0b0b0e, .6), 0, .56 + i * .0, .46 + i * .0);
      B(g, .16, .12, .1, M(0x2563eb, .5), -.18, 1.35, .44); B(g, .16, .12, .1, M(0xdc2626, .5), .18, 1.35, .44);
      var tp = C(g, .03, .03, .1, M(0xcbd5e1, .3, .8), -.18, 1.22, .5); tp.rotation.x = PI / 2; tp = C(g, .03, .03, .1, M(0xcbd5e1, .3, .8), .18, 1.22, .5); tp.rotation.x = PI / 2;
      var wt = new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: .1, transparent: true, opacity: .45 });
      var bottle = C(g, .32, .3, .85, wt, 0, 2.3, 0); C(g, .12, .2, .12, wt, 0, 2.78, 0); C(g, .1, .1, .06, M(0x2563eb, .5), 0, 2.88, 0);
      var wl = C(g, .29, .27, .6, new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: .1, transparent: true, opacity: .4 }), 0, 2.2, 0);
      for (var k = 0; k < 6; k++) { var b = S(g, .03 + (k % 3) * .008, new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .55, roughness: .1 }), (Math.random() - .5) * .3, 2.0 + Math.random() * .4, (Math.random() - .5) * .3, 1, 1, 1); b.userData = { y: 2.0 + Math.random() * .4, sp: .25 + Math.random() * .3 }; bub.push(b); }
    });

    /* верстак: новая столешница, ящики, нижняя полка, тиски */
    safe(function () {
      var top = null, legs = [];
      scene.children.forEach(function (o) {
        if (!o.isMesh || !o.geometry || o.geometry.type != 'BoxGeometry') return; var p = o.geometry.parameters;
        if (Math.abs(p.width - 6) < .01 && Math.abs(p.height - .2) < .01 && Math.abs(p.depth - 2.6) < .01 && Math.abs(o.position.y - 1.5) < .01) top = o;
        if (Math.abs(p.width - .2) < .01 && Math.abs(p.height - 1.5) < .01 && Math.abs(p.depth - .2) < .01 && Math.abs(o.position.y - .75) < .01 && Math.abs(o.position.z + 5) < 1.5) legs.push(o);
      });
      if (!top) return;
      top.visible = false; legs.forEach(function (l) { l.visible = false; });
      var g = grp(0, -5, 0), steel = M(0x2a2f3a, .4, .7), oakC = document.createElement('canvas'); oakC.width = 512; oakC.height = 256; var x = oakC.getContext('2d');
      x.fillStyle = '#8a6440'; x.fillRect(0, 0, 512, 256);
      for (var i = 0; i < 8; i++) { x.fillStyle = 'rgba(' + (Math.random() < .5 ? '0,0,0' : '255,220,170') + ',' + (.04 + Math.random() * .06) + ')'; x.fillRect(0, i * 32, 512, 32); x.fillStyle = 'rgba(30,15,5,.5)'; x.fillRect(0, i * 32, 512, 2); }
      for (i = 0; i < 160; i++) { x.strokeStyle = 'rgba(50,28,10,' + Math.random() * .18 + ')'; x.lineWidth = Math.random() * 1.6 + .4; x.beginPath(); var y0 = Math.random() * 256; x.moveTo(0, y0); for (var xx = 0; xx < 512; xx += 32) x.lineTo(xx, y0 + Math.sin(xx * .02 + i) * 3); x.stroke(); }
      for (i = 0; i < 18; i++) { x.fillStyle = 'rgba(20,12,6,.35)'; x.beginPath(); x.ellipse(Math.random() * 512, Math.random() * 256, 12 + Math.random() * 30, 3 + Math.random() * 6, Math.random() * 3, 0, 7); x.fill(); }   // пятна и царапины
      var tex = new THREE.CanvasTexture(oakC); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 8;
      var tp = new THREE.Mesh(new THREE.BoxGeometry(6, .2, 2.6), [M(0x5a3a22, .6), M(0x5a3a22, .6), new THREE.MeshStandardMaterial({ map: tex, roughness: .55, metalness: .05 }), M(0x5a3a22, .6), M(0x5a3a22, .6), M(0x5a3a22, .6)]);
      tp.position.set(0, 1.5, 0); tp.castShadow = tp.receiveShadow = true; g.add(tp);
      B(g, 6.1, .06, .06, steel, 0, 1.4, 1.3); B(g, 6.1, .06, .06, steel, 0, 1.4, -1.3);            // стальной кант
      [[-2.8, -1.1], [2.8, -1.1], [-2.8, 1.1], [2.8, 1.1]].forEach(function (a) { B(g, .22, 1.4, .22, steel, a[0], .7, a[1]); B(g, .3, .06, .3, M(0x0b0b0e, .6), a[0], .03, a[1]); });
      B(g, 5.6, .06, .06, steel, 0, .4, 1.1); B(g, 5.6, .06, .06, steel, 0, .4, -1.1); B(g, .06, .06, 2.2, steel, -2.8, .4, 0); B(g, .06, .06, 2.2, steel, 2.8, .4, 0);
      B(g, 5.5, .06, 2.1, M(0x3a3f4c, .6, .3), 0, .43, 0);                                          // нижняя полка
      [[-1.6, .15], [-.4, -.2], [1.0, .1]].forEach(function (a, k) { B(g, .9, .5, .7, M([0x2563eb, 0xb91c1c, 0x15803d][k], .7), a[0], .73, a[1]); B(g, .7, .06, .5, M(0xe5e7eb, .6), a[0], .99, a[1]); });  // ящики на полке
      /* тумба с ящиками */
      B(g, 1.55, .9, 2.3, M(0x1f2430, .5, .4), 2.1, 1.0, 0);
      [0, 1, 2].forEach(function (i) { B(g, 1.45, .25, .04, M(0x2b3140, .5, .4), 2.1, .72 + i * .27, 1.17); B(g, .5, .05, .05, M(0xcbd5e1, .3, .9), 2.1, .72 + i * .27, 1.21); });
      /* тиски */
      B(g, .5, .22, .4, steel, -2.5, 1.7, 1.0); B(g, .5, .35, .08, steel, -2.5, 1.85, 1.24); var ha = C(g, .03, .03, .55, M(0xb0b6c0, .3, .9), -2.5, 1.82, .78); ha.rotation.x = PI / 2;
    });


    /* открытая книга на наклонной подставке: на страницах видны коды Морзе */
    safe(function () {
      var bk = null; scene.children.forEach(function (o) { if (!bk && o.type == 'Group' && o.userData && o.userData.act && Math.abs(o.position.x - 2.3) < .05 && Math.abs(o.position.z + 4.5) < .05) bk = o; });
      if (!bk) return;
      bk.children.forEach(function (c) { if (c.material && !(c.material.transparent && c.material.opacity === 0)) c.visible = false; });
      var F = (window.__orders && window.__orders.faults) || [];
      function page(items, title, num) {
        var c = document.createElement('canvas'); c.width = 512; c.height = 700; var x = c.getContext('2d');
        var gr = x.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, '#e9dfc4'); gr.addColorStop(.5, '#f6efd9'); gr.addColorStop(1, '#e9dfc4'); x.fillStyle = gr; x.fillRect(0, 0, 512, 700);
        x.fillStyle = '#3b2a14'; x.font = 'bold 30px serif'; x.textAlign = 'center'; x.fillText(title, 256, 52); x.fillRect(60, 66, 392, 3);
        items.forEach(function (f, i) {
          var y = 120 + i * 140;
          x.textAlign = 'left'; x.fillStyle = '#9a3412'; x.font = 'bold 40px monospace'; x.fillText(f.code.split('').join(' '), 36, y);
          x.fillStyle = '#1f2937'; x.font = 'bold 24px serif'; x.fillText(f.n, 36, y + 34);
          x.fillStyle = '#44403c'; x.font = '21px serif'; var w = String(f.sol).split(' '), ln = '', yy = y + 62;
          w.forEach(function (t) { if (x.measureText(ln + t).width > 440) { x.fillText(ln, 36, yy); ln = ''; yy += 24; } ln += t + ' '; }); x.fillText(ln, 36, yy);
          x.fillStyle = 'rgba(0,0,0,.15)'; x.fillRect(36, y + 106, 440, 1);
        });
        x.fillStyle = '#78716c'; x.font = '18px serif'; x.textAlign = 'center'; x.fillText('— ' + num + ' —', 256, 680);
        var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t;
      }
      var n = Math.ceil(F.length / 2) || 4, A = F.slice(0, n), Bp = F.slice(n);
      var st = new THREE.Group(); st.position.set(0, .02, 0); bk.add(st);
      var wood = M(0x4a3020, .6);
      B(st, .86, .03, .5, wood, 0, .015, 0); var back = B(st, .8, .02, .5, wood, 0, .25, -.2); back.rotation.x = .62;       // подставка
      B(st, .8, .04, .06, wood, 0, .06, .24);
      var tilt = new THREE.Group(); tilt.position.set(0, .22, -.03); tilt.rotation.x = 1.0; st.add(tilt);
      var cover = M(0x7f1d1d, .7);
      B(tilt, .74, .012, .52, cover, 0, -.012, 0);
      [-1, 1].forEach(function (s) {
        var pg = new THREE.Mesh(new THREE.PlaneGeometry(.34, .47), new THREE.MeshStandardMaterial({ map: page(s < 0 ? A : Bp, s < 0 ? 'Сигналы — I' : 'Сигналы — II', s < 0 ? 1 : 2), roughness: .9, side: THREE.DoubleSide }));
        pg.rotation.x = -PI / 2; pg.position.set(s * .175, .006, 0); pg.rotation.z = s * .03; pg.castShadow = false; pg.receiveShadow = true; tilt.add(pg);
        for (var k = 0; k < 4; k++) B(tilt, .34, .0025, .47, M(0xf1e8cf, .9), s * .175, .0 + k * .0025, 0).scale.x = 1 - k * .01;
      });
      B(tilt, .012, .016, .5, M(0x3b0d0d, .7), 0, .002, 0);                                                                // корешок
    });

    /* ---------- анимации мебели ---------- */
    var last = performance.now();
    (function loop(now) {
      requestAnimationFrame(loop);
      var dt = (now - last) / 1000; last = now; if (!(dt > 0) || dt > .25) return;
      try { if (mode == 'menu') return; } catch (e) { }
      var t = now / 1000;
      for (var i = 0; i < sway.length; i++) { var lf = sway[i], u = lf.userData; lf.rotation.x = u.t + Math.sin(t * .9 + u.p) * .035; lf.rotation.z = Math.sin(t * .7 + u.p * 1.7) * .03; }
      for (var j = 0; j < bub.length; j++) { var b = bub[j], d = b.userData; b.position.y += dt * d.sp; if (b.position.y > 2.52) { b.position.y = 1.95; b.position.x = (Math.random() - .5) * .3; b.position.z = (Math.random() - .5) * .3; } }
    })(last);
    console.log('[models] готово');
  }

  if (ready()) setTimeout(go, 300);
  else { var t = 0, iv = setInterval(function () { if (ready()) { clearInterval(iv); setTimeout(go, 300); } else if (++t > 600) clearInterval(iv); }, 100); }
})();
