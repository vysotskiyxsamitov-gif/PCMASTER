/* PC МАСТЕР — windows.js (после world.js, street.js, Room.js)
   Большие настоящие окна на всю ширину стены: сквозь них видна живая 3D-улица (погода, день/ночь, машины, люди).
   Дверь тоже открыта на улицу. Старые «нарисованные» окна и фон за дверью убираются. */
(function () {
  if (window.__windowsLoaded) return; window.__windowsLoaded = 1;
  function ready() { try { return typeof THREE !== 'undefined' && !!scene && !!window.__roomLoaded && !!window.__worldLoaded; } catch (e) { return false; } }

  function go() {
    var Z = 8, kids = scene.children.slice(), left = null, right = null, top = null;
    function par(o) { return (o.geometry && o.geometry.parameters) || {}; }
    kids.forEach(function (o) {
      var p = par(o), pos = o.position;
      if (o.geometry && o.geometry.type == 'PlaneGeometry') {
        if (Math.abs(pos.z - Z) < .01 && p.width == 8.5 && p.height == 10) { if (pos.x < 0) left = o; else right = o; }
        else if (Math.abs(pos.z - Z) < .01 && p.width == 3 && p.height == 4.8) top = o;
        else if (p.width == 5 && p.height == 4 && Math.abs(pos.z - 7.84) < .02) o.visible = false;      // нарисованное окно
        else if (p.width == 8 && p.height == 7 && Math.abs(pos.z - 9.8) < .05) o.visible = false;        // оранжевый фон за дверью
        else if (p.width == 16 && p.height == 7 && Math.abs(pos.z - 11.5) < .05) o.visible = false;     // серый «пол» снаружи
      } else if (o.type == 'Group' && Math.abs(pos.y - 5) < .01 && Math.abs(pos.z - 7.8) < .02 && Math.abs(Math.abs(pos.x) - 6) < .01) o.visible = false; // окна street.js
    });
    if (!left || !right) { console.warn('[windows] стена не найдена'); return; }

    function wallMat(src) { var m = src.material.clone(); m.side = THREE.DoubleSide; return m; }
    var mL = wallMat(left), mR = wallMat(right), mT = top ? wallMat(top) : mL;
    function quad(x0, x1, y0, y1, mat, uf, vf) {
      var g = new THREE.BufferGeometry(), P = [x0, y0, Z, x1, y0, Z, x1, y1, Z, x0, y1, Z], U = [];
      [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].forEach(function (c) { U.push(uf(c[0]), vf(c[1])); });
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1], 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex([0, 1, 2, 0, 2, 3]);
      var m = new THREE.Mesh(g, mat); m.receiveShadow = true; scene.add(m); return m;
    }
    var uL = function (x) { return (-1.5 - x) / 8.5; }, uR = function (x) { return (10 - x) / 8.5; }, vW = function (y) { return y / 10; };
    var WY0 = 1.5, WY1 = 5.8, WX0 = 3, WX1 = 9;                       // окно: x 3…9 (с обеих сторон), y 1.5…5.8
    // левая часть стены (x −10…−1.5) и правая (1.5…10)
    [[-10, -1.5, mL, uL, -1], [1.5, 10, mR, uR, 1]].forEach(function (s) {
      var a = s[0], b = s[1], m = s[2], u = s[3], sg = s[4];
      var w0 = sg < 0 ? -WX1 : WX0, w1 = sg < 0 ? -WX0 : WX1;
      quad(a, w0, 0, 10, m, u, vW); quad(w1, b, 0, 10, m, u, vW);        // боковые простенки
      quad(w0, w1, 0, WY0, m, u, vW); quad(w0, w1, WY1, 10, m, u, vW);   // под и над окном
    });
    if (top) quad(-1.5, 1.5, 5.2, 10, mT, function (x) { return (1.5 - x) / 3; }, function (y) { return (y - 5.2) / 4.8; });
    left.visible = right.visible = false; if (top) top.visible = false;

    // стекло, рамы, переплёты
    var FR = new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: .5, metalness: .3 });
    var GL = new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: .07, depthWrite: false, side: THREE.DoubleSide });
    function fb(w, h, d, x, y, z) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), FR); m.position.set(x, y, z); m.castShadow = true; scene.add(m); }
    [-6, 6].forEach(function (cx) {
      var W = WX1 - WX0, H = WY1 - WY0, cy = (WY0 + WY1) / 2, g = new THREE.Mesh(new THREE.PlaneGeometry(W, H), GL); g.position.set(cx, cy, Z - .02); g.renderOrder = 5; scene.add(g);
      fb(W + .3, .18, .3, cx, WY1 + .05, Z - .1); fb(W + .3, .18, .3, cx, WY0 - .05, Z - .1);
      fb(.18, H + .3, .3, cx - W / 2 - .05, cy, Z - .1); fb(.18, H + .3, .3, cx + W / 2 + .05, cy, Z - .1);
      fb(.1, H, .14, cx, cy, Z - .08); fb(W, .09, .14, cx, cy + .5, Z - .08);
      fb(W + .6, .14, .5, cx, WY0 - .12, Z - .3);                               // подоконник
    });
    // дверь: тоньше рамы, стекло ещё прозрачнее
    try { [doorL, doorR].forEach(function (d) { d.material.opacity = .14; }); } catch (e) { }
    console.log('[windows] готово');
  }

  var n = 0, iv = setInterval(function () { if (ready()) { clearInterval(iv); setTimeout(go, 2500); } else if (++n > 400) clearInterval(iv); }, 100);
})();
