/* PC МАСТЕР — окна на вечернюю улицу: по тротуару ходят люди, по дороге ездят машины.
   Картинка рисуется в маленьком 2D-холсте и показывается в двух окнах магазина (стена у входа).
   Подключать ПОСЛЕ основного скрипта игры:  <script src="street.js"></script> (перед </body>). */
(function () {
  if (window.__streetLoaded) return;
  window.__streetLoaded = 1;

  var W = 640, H = 320, S = 1.5;
  var cv = document.createElement('canvas');
  cv.width = W * S; cv.height = H * S;
  var x = cv.getContext('2d');

  var sd = 11;
  function rr() { sd = (sd * 9301 + 49297) % 233280; return sd / 233280; }
  function pick(a) { return a[(rr() * a.length) | 0]; }

  var SHIRT = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#e5e7eb', '#14b8a6'];
  var PANTS = ['#1f2937', '#334155', '#3f3f46', '#1e3a8a', '#44403c'];
  var HAIR = ['#2a1a10', '#111111', '#6b4a2a', '#b8893c', '#777777'];
  var SKIN = ['#f1c9a5', '#e0b99a', '#c68a62', '#8d5a3c'];
  var CARC = ['#dc2626', '#2563eb', '#e5e7eb', '#facc15', '#16a34a', '#7c3aed'];

  var far = [], px = -20;
  while (px < W + 40) {
    var fw = 34 + rr() * 50, fh = 60 + rr() * 85, b = { x: px, w: fw, h: fh, win: [] };
    for (var wy = 14; wy < fh - 8; wy += 13) for (var wx = 6; wx < fw - 8; wx += 11)
      if (rr() < .55) b.win.push([wx, wy, rr() < .5 ? '#fde68a' : '#67e8f9', rr() * 6.28]);
    far.push(b); px += fw + rr() * 6;
  }
  var shops = [];
  px = 0;
  while (px < W) {
    var sw = 70 + rr() * 60;
    shops.push({ x: px, w: sw, c: pick(['#1c2236', '#241b33', '#182a35', '#2a2230']), neon: pick(['#f472b6', '#22d3ee', '#a3e635', '#fb923c', '#c084fc']), lit: rr() < .75 });
    px += sw;
  }
  var lamps = [70, 290, 510];

  var peds = [], cars = [];
  function mkPed(isFar, startX) {
    var left = rr() < .5, spd = (28 + rr() * 30) * (isFar ? .8 : 1);
    return {
      x: startX !== undefined ? startX : (left ? -30 : W + 30), y: isFar ? 231 : 247, sc: isFar ? .85 : 1.12,
      v: left ? spd : -spd, ph: rr() * 6, shirt: pick(SHIRT), pants: pick(PANTS), hair: pick(HAIR), skin: pick(SKIN),
      bag: rr() < .4, stop: 0, wait: 2 + rr() * 6, far: isFar
    };
  }
  function mkCar(i, startX) {
    var toLeft = i % 2 == 0, v = 70 + rr() * 70;
    return { x: startX !== undefined ? startX : (toLeft ? W + 80 : -80), y: toLeft ? 277 : 304, v: toLeft ? -v : v, c: pick(CARC), wait: 0 };
  }
  var i;
  for (i = 0; i < 4; i++) peds.push(mkPed(true, rr() * W));
  for (i = 0; i < 4; i++) peds.push(mkPed(false, rr() * W));
  for (i = 0; i < 3; i++) cars.push(mkCar(i, rr() * W));

  var T = 0;
  function update(dt) {
    T += dt;
    peds.forEach(function (p, k) {
      if (p.stop > 0) { p.stop -= dt; if (p.stop <= 0) p.wait = 3 + rr() * 8; }
      else {
        p.x += p.v * dt; p.ph += Math.abs(p.v) * dt * .2; p.wait -= dt;
        if (p.wait <= 0) p.stop = 1.5 + rr() * 2.5;
      }
      if (p.x < -50 || p.x > W + 50) peds[k] = mkPed(p.far);
    });
    cars.forEach(function (c, k) {
      if (c.wait > 0) { c.wait -= dt; return; }
      c.x += c.v * dt;
      if (c.x < -120 || c.x > W + 120) { cars[k] = mkCar(k); cars[k].wait = 1 + rr() * 5; cars[k].x = cars[k].v < 0 ? W + 100 : -100; }
    });
  }

  function glow(cx, cy, r, color, a) {
    var g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.globalAlpha = a; x.fillStyle = g;
    x.fillRect(cx - r, cy - r, r * 2, r * 2);
    x.globalAlpha = 1;
  }

  function person(p) {
    var dir = p.v >= 0 ? 1 : -1, sw = p.stop > 0 ? 0 : Math.sin(p.ph) * 7;
    x.save(); x.translate(p.x, p.y); x.scale(dir * p.sc, p.sc);
    x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(0, 1, 9, 3, 0, 0, 7); x.fill();
    x.lineCap = 'round';
    x.strokeStyle = p.pants; x.lineWidth = 4.5;
    x.beginPath(); x.moveTo(-1.5, -18); x.lineTo(-1.5 + sw, -1); x.moveTo(1.5, -18); x.lineTo(1.5 - sw, -1); x.stroke();
    x.fillStyle = '#15171c'; x.fillRect(-1.5 + sw - 3, -3, 6, 3); x.fillRect(1.5 - sw - 3, -3, 6, 3);
    x.fillStyle = p.shirt; x.fillRect(-6, -37, 12, 20);
    x.strokeStyle = p.shirt; x.lineWidth = 3.5;
    x.beginPath(); x.moveTo(-6, -35); x.lineTo(-6 - sw * .6, -22); x.moveTo(6, -35); x.lineTo(6 + sw * .6, -22); x.stroke();
    x.fillStyle = p.skin; x.beginPath(); x.arc(-6 - sw * .6, -21, 2, 0, 7); x.arc(6 + sw * .6, -21, 2, 0, 7); x.fill();
    x.fillStyle = p.skin; x.beginPath(); x.arc(0, -43, 5.6, 0, 7); x.fill();
    x.fillStyle = p.hair; x.beginPath(); x.arc(0, -44.5, 5.8, Math.PI, 0); x.fill();
    if (p.bag) { x.fillStyle = '#3a2a1c'; x.fillRect(5, -27, 7, 9); }
    x.restore();
  }

  function car(c) {
    var dir = c.v >= 0 ? 1 : -1;
    x.save(); x.translate(c.x, c.y); x.scale(dir, 1);
    x.fillStyle = 'rgba(0,0,0,.4)'; x.beginPath(); x.ellipse(0, 1, 44, 5, 0, 0, 7); x.fill();
    x.fillStyle = c.c; x.fillRect(-40, -22, 80, 15);
    x.beginPath(); x.moveTo(-24, -22); x.lineTo(-15, -34); x.lineTo(15, -34); x.lineTo(27, -22); x.closePath(); x.fill();
    x.fillStyle = 'rgba(180,220,255,.75)';
    x.beginPath(); x.moveTo(-20, -23); x.lineTo(-13, -32); x.lineTo(-1, -32); x.lineTo(-1, -23); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(3, -23); x.lineTo(3, -32); x.lineTo(14, -32); x.lineTo(23, -23); x.closePath(); x.fill();
    x.fillStyle = '#0b0b0d'; x.beginPath(); x.arc(-24, -6, 7, 0, 7); x.arc(24, -6, 7, 0, 7); x.fill();
    x.fillStyle = '#6b7280'; x.beginPath(); x.arc(-24, -6, 3, 0, 7); x.arc(24, -6, 3, 0, 7); x.fill();
    x.fillStyle = '#fef08a'; x.fillRect(38, -19, 4, 5);
    x.fillStyle = '#ef4444'; x.fillRect(-42, -19, 3, 5);
    x.globalCompositeOperation = 'lighter';
    var g = x.createLinearGradient(42, 0, 120, 0);
    g.addColorStop(0, 'rgba(255,240,170,.55)'); g.addColorStop(1, 'rgba(255,240,170,0)');
    x.fillStyle = g; x.beginPath(); x.moveTo(42, -19); x.lineTo(120, -34); x.lineTo(120, -2); x.lineTo(42, -14); x.closePath(); x.fill();
    x.globalCompositeOperation = 'source-over';
    x.restore();
  }

  function draw() {
    x.setTransform(S, 0, 0, S, 0, 0);
    var g = x.createLinearGradient(0, 0, 0, 170);
    g.addColorStop(0, '#141c40'); g.addColorStop(.55, '#4b2f6e'); g.addColorStop(1, '#f59e0b');
    x.fillStyle = g; x.fillRect(0, 0, W, 210);
    far.forEach(function (b) {
      x.fillStyle = '#10142a'; x.fillRect(b.x, 175 - b.h, b.w, b.h + 40);
      b.win.forEach(function (w) {
        var on = .55 + .45 * Math.sin(T * .6 + w[3]);
        x.globalAlpha = on > .5 ? .9 : .25; x.fillStyle = w[2];
        x.fillRect(b.x + w[0], 175 - b.h + w[1], 5, 7);
      });
      x.globalAlpha = 1;
    });
    shops.forEach(function (s) {
      x.fillStyle = s.c; x.fillRect(s.x, 112, s.w, 100);
      x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(s.x, 112, 2, 100);
      x.fillStyle = s.lit ? '#ffd9a0' : '#1a1d28';
      x.globalAlpha = s.lit ? .85 : 1; x.fillRect(s.x + 8, 150, s.w - 16, 48); x.globalAlpha = 1;
      x.fillStyle = s.neon; x.fillRect(s.x + 10, 124, s.w - 20, 11);
      glow(s.x + s.w / 2, 130, s.w * .6, s.neon, .35);
    });
    x.fillStyle = '#3b4252'; x.fillRect(0, 206, W, 46);
    x.fillStyle = '#566074'; x.fillRect(0, 206, W, 3); x.fillRect(0, 249, W, 3);
    x.fillStyle = '#16181f'; x.fillRect(0, 252, W, H - 252);
    x.fillStyle = 'rgba(255,255,255,.45)';
    for (var dx = -((T * 20) % 60); dx < W; dx += 60) x.fillRect(dx, 289, 30, 3);
    peds.filter(function (p) { return p.far; }).forEach(person);
    lamps.forEach(function (lx) {
      x.fillStyle = '#20242c'; x.fillRect(lx - 2, 120, 4, 128); x.fillRect(lx - 2, 120, 16, 4);
      glow(lx + 14, 128, 55, '#ffe9a8', .55);
      x.fillStyle = '#fff3c4'; x.beginPath(); x.arc(lx + 14, 127, 4, 0, 7); x.fill();
    });
    peds.filter(function (p) { return !p.far; }).forEach(person);
    cars.forEach(car);
    var v = x.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, W * .65);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.4)');
    x.fillStyle = v; x.fillRect(0, 0, W, H);
  }
  window.__street = { cv: cv, update: update, draw: draw };

  /* ---- вставка окон в сцену ---- */
  function ready() {
    try { return typeof THREE !== 'undefined' && !!scene && typeof bx === 'function'; } catch (e) { return false; }
  }
  function mount() {
    var tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 8; tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter;

    // прячем старое статичное окно на этом месте
    scene.children.forEach(function (o) {
      var gm = o.geometry;
      if (gm && gm.type == 'PlaneGeometry' && Math.abs(o.position.x + 6) < .05 && Math.abs(o.position.z - 7.84) < .05 && Math.abs(o.position.y - 5) < .05) o.visible = false;
    });

    var gc = document.createElement('canvas'); gc.width = 128; gc.height = 64;
    var gx = gc.getContext('2d'), gg = gx.createLinearGradient(0, 0, 128, 64);
    gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(.35, 'rgba(255,255,255,.10)'); gg.addColorStop(.5, 'rgba(255,255,255,0)');
    gg.addColorStop(.62, 'rgba(255,255,255,.07)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
    gx.fillStyle = gg; gx.fillRect(0, 0, 128, 64);
    var gtex = new THREE.CanvasTexture(gc);
    var FR = 0x1b1e26;

    [-6, 6].forEach(function (wx) {
      var g3 = new THREE.Group();
      g3.position.set(wx, 5, 7.8);
      g3.rotation.y = Math.PI;
      scene.add(g3);
      g3.add(new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.8), new THREE.MeshBasicMaterial({ map: tex })));
      var glass = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.8), new THREE.MeshBasicMaterial({ map: gtex, transparent: true, depthWrite: false }));
      glass.position.z = .04; g3.add(glass);
      bx(g3, 6, .22, .22, FR, 0, 1.51, .1);
      bx(g3, 6, .22, .22, FR, 0, -1.51, .1);
      bx(g3, .22, 3.2, .22, FR, -2.89, 0, .1);
      bx(g3, .22, 3.2, .22, FR, 2.89, 0, .1);
      bx(g3, .1, 2.9, .12, FR, 0, 0, .08);
      bx(g3, 5.7, .09, .12, FR, 0, .35, .08);
      bx(g3, 6.4, .16, .5, 0x2a2f3a, 0, -1.68, .22);
    });

    var last = 0;
    (function loop(now) {
      requestAnimationFrame(loop);
      if (now - last < 50) return;
      var dt = Math.min(.2, (now - last) / 1000);
      last = now;
      update(typeof PZ != 'undefined' && PZ ? 0 : dt);
      draw();
      tex.needsUpdate = true;
    })(0);
  }

  // ждём, пока основной скрипт игры создаст сцену (если street.js подключён раньше — это не мешает)
  if (ready()) mount();
  else {
    var tries = 0, iv = setInterval(function () {
      if (ready()) { clearInterval(iv); mount(); }
      else if (++tries > 400) clearInterval(iv);
    }, 50);
  }
})();
