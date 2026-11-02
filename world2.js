/* PC МАСТЕР — world2.js (подключать ПОСЛЕ world.js)
   • табличка «ДЕНЬ N завершён» + звуковой сигнал в конце каждого дня
   • Виктор (дни 10 и 30) и его человек Костя (день 20) сами приходят за деньгами:
     выбор «Отдать / Не отдавать», купюры видно как они перекладываются из руки в руку
   • прозрачные стеклянные двери — видно улицу и прохожих */
(function () {
  if (window.__world2Loaded) return;
  window.__world2Loaded = 1;
  function ready() {
    try { return !!window.__worldLoaded && typeof mkP === 'function' && typeof talk === 'function' && typeof pay === 'function' && typeof next === 'function' && !!cam && !!scene; } catch (e) { return false; }
  }

  function go() {
    var PI = Math.PI, dayT0 = performance.now();

    /* ---------- 1. табличка конца дня + звук ---------- */
    var bn = document.createElement('div');
    bn.style.cssText = 'position:fixed;left:0;right:0;top:32%;text-align:center;z-index:60;pointer-events:none;opacity:0;transition:opacity .6s;font:900 64px/1.1 system-ui,sans-serif;color:#fff;text-shadow:0 4px 30px #000,0 0 40px #22d3ee';
    document.body.appendChild(bn);
    function chime() {
      try {
        var c = (typeof AC !== 'undefined' && AC) ? AC : null; if (!c) return;
        [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
          var o = c.createOscillator(), g = c.createGain(), t = c.currentTime + i * .22;
          o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.16, t + .04); g.gain.exponentialRampToValueAtTime(.001, t + 1.3);
          o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 1.4);
        });
      } catch (e) {}
    }
    function banner(a, b) {
      bn.innerHTML = a + '<div style="font:600 26px system-ui;margin-top:10px;color:#9ff3ff">' + b + '</div>';
      bn.style.opacity = 1; chime();
      clearTimeout(banner.h); banner.h = setTimeout(function () { bn.style.opacity = 0; }, 3600);
    }
    var _next = next;
    next = function () {
      var d = G && G.day, r = _next.apply(this, arguments);
      try { if (G && !G.sb && G.day !== d && mode !== 'end') { banner('ДЕНЬ ' + d + ' ЗАВЕРШЁН', 'Начинается день ' + G.day); dayT0 = performance.now(); } } catch (e) {}
      return r;
    };

    /* ---------- 2. стеклянные двери ---------- */
    try { [doorL, doorR].forEach(function (d) { var m = d.material; m.transparent = true; m.opacity = .22; m.color.setHex(0x9fd8ff); m.depthWrite = false; m.needsUpdate = true; }); } catch (e) {}

    /* ---------- 3. Виктор приходит сам ---------- */
    var busy = 0;
    function mkBill() { return new THREE.Mesh(new THREE.BoxGeometry(.42, .02, .2), new THREE.MeshBasicMaterial({ color: 0x4ade80 })); }
    function walk(g, to, speed, done) {
      var t = 0, last = performance.now();
      (function st(now) {
        var dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
        var dx = to.x - g.position.x, dz = to.z - g.position.z, L = Math.hypot(dx, dz);
        if (L < .08) { (g.userData.lg || []).forEach(function (l) { l.rotation.x = 0; }); done && done(); return; }
        var s = Math.min(L, speed * dt); g.position.x += dx / L * s; g.position.z += dz / L * s; g.rotation.y = Math.atan2(dx, dz);
        (g.userData.lg || []).forEach(function (l, i) { l.rotation.x = Math.sin(t * 8) * .5 * (i ? 1 : -1); });
        requestAnimationFrame(st);
      })(last);
    }
    function handoff(g, done) {                       // купюры: из руки игрока в руку Виктора
      var hand = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 10), new THREE.MeshStandardMaterial({ color: 0xe0b99a, roughness: .7 }));
      hand.scale.set(1, .7, 1.3); cam.add(hand); hand.position.set(.42, -.5, -.9); if (!cam.parent) scene.add(cam);
      var ar = g.userData.ar; if (ar && ar[1]) ar[1].rotation.x = -1.25;
      var bills = [], N = 7; for (var i = 0; i < N; i++) { var b = mkBill(); b.visible = false; scene.add(b); bills.push(b); }
      var t0 = performance.now(), T = 1800;
      (function st(now) {
        var u = (now - t0) / T, s = new THREE.Vector3(), e = new THREE.Vector3(.35, 2.0, .55);
        cam.localToWorld(s.set(.42, -.5, -.9)); e.applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rotation.y).add(g.position);
        hand.position.set(.42 + Math.sin(Math.min(1, u * 1.6) * PI) * -.12, -.5 + Math.sin(Math.min(1, u * 1.6) * PI) * .12, -.9);
        bills.forEach(function (b, i) {
          var k = Math.min(1, Math.max(0, (u - i * .08) / .5)); b.visible = k > 0 && k < 1;
          b.position.lerpVectors(s, e, k); b.position.y += Math.sin(k * PI) * .45; b.rotation.set(k * 3, k * 5, k * 2);
        });
        if (u < 1.1) { requestAnimationFrame(st); return; }
        bills.forEach(function (b) { scene.remove(b); }); cam.remove(hand);
        if (ar && ar[1]) ar[1].rotation.x = 0; done && done();
      })(t0);
    }
    function leave(g) {
      walk(g, { x: g.position.x, z: 10.5 }, 3.2, function () { scene.remove(g); busy = 0; });
    }
    function visit() {
      var d = G.day, tg = d == 10 ? 2000 : d == 20 ? 7000 : 10000, need = tg - (10000 - G.debt);
      G.ev['v' + d] = 1; if (need <= 0 || G.debt <= 0) return;
      busy = 1; var name = d == 20 ? 'Костя' : 'Виктор';
      var g = mkP({ col: d == 20 ? 0x1f2937 : 0x111111, pa: 0x0b0b0b, hair: 0x111111, bad: 1 });
      g.position.set(0, 0, 10); scene.add(g);
      var dir = new THREE.Vector3(-P.x, 0, 8 - P.z).normalize(), tgp = { x: P.x + dir.x * 3.2, z: P.z + dir.z * 3.2 };
      try { sfx('door'); } catch (e) {}
      walk(g, tgp, 3, function () {
        g.rotation.y = Math.atan2(P.x - g.position.x, P.z - g.position.z);
        var amt = Math.min(need, Math.floor(G.m)), L = d == 10 ?
          [['Виктор', 'Привет. Десять дней прошло. По уговору с тебя ' + M(need) + '.'], ['Виктор', 'Ну что, отдаёшь?']] : d == 20 ?
          [['Костя', 'Виктор занят, так что приехал я. Нужно ещё ' + M(need) + '.'], ['Костя', 'Деньги при тебе?']] :
          [['Виктор', 'Последний срок. Остаток долга — ' + M(need) + '.'], ['Виктор', 'Закроем вопрос?']];
        if (amt <= 0) { talk([[name, 'У тебя нет денег? Плохо. Время идёт.']], function () { leave(g); }); return; }
        talk(L, null, [
          [amt >= need ? 'Отдать ' + M(amt) : 'Отдать всё, что есть: ' + M(amt), function () {
            handoff(g, function () { pay(amt); if (mode == 'end') { return; } talk([[name, amt >= need ? 'Другой разговор. Уважаю.' : 'Маловато, но принято. Остальное — к сроку.']], function () { leave(g); }); });
          }],
          ['Не отдавать', function () {
            talk([[name, 'Дело твоё. Но срок — до конца дня. Потом пеняй на себя.']], function () { leave(g); });
          }]
        ]);
      });
    }
    setInterval(function () {
      try {
        if (busy || typeof G === 'undefined' || !G || G.sb || mode != 'play' || [10, 20, 30].indexOf(G.day) < 0 || G.ev['v' + G.day]) return;
        if (performance.now() - dayT0 > 6000) visit();
      } catch (e) {}
    }, 1000);
  }

  var n = 0, iv = setInterval(function () { if (ready()) { clearInterval(iv); setTimeout(go, 200); } else if (++n > 600) clearInterval(iv); }, 100);
})();
