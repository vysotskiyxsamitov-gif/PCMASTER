/* PC МАСТЕР — rays.js: солнечные лучи из окон (объёмные «шахты» света) + блик солнца, когда смотришь в окно. */
(function () {
  if (window.__raysLoaded) return;
  window.__raysLoaded = 1;
  function ready() { try { return typeof THREE !== 'undefined' && !!scene && !!cam && !!R && !!window.__W && !!window.__W.sunDir && !!window.__windowsLoaded && !!window.__lookLoaded; } catch (e) { return false; } }
  function go() {
    var W3 = window.__W, grp = new THREE.Group(); scene.add(grp);
    var on = true; try { on = localStorage.getItem('pcrays') !== '0'; } catch (e) { }
    /* текстура: вдоль луча затухает, поперёк мягкие края */
    var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d');
    for (var i = 0; i < 64; i++) for (var j = 0; j < 64; j++) {
      var u = i / 63, a = Math.pow(1 - u, 1.1) * Math.min(1, u * 9) * Math.pow(Math.sin(Math.PI * (j + .5) / 64), 1.5);
      x.fillStyle = 'rgba(255,238,196,' + a.toFixed(3) + ')'; x.fillRect(i, j, 1, 1);
    }
    var tex = new THREE.CanvasTexture(c);
    var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    var rb = [];
    [-1, 1].forEach(function (sg) {
      for (var k = 0; k < 4; k++) [2.4, 3.6, 4.8].forEach(function (y) {
        var pos = new Float32Array(12), g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 1, 1, 1, 0]), 2)); g.setIndex([0, 1, 2, 0, 2, 3]);
        var m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 4; m.visible = false; grp.add(m);
        rb.push({ m: m, p: pos, x: sg * (3.75 + k * 1.5), y: y });
      });
    });
    var amt = 0;
    function upd() {
      var sd = W3.sunDir, env = W3.ENV, wx = W3.WX;
      var up = on && sd && env && sd.y > .14 && sd.z > .12 && env.dayF > .3;
      amt = up ? Math.min(1, (sd.y - .14) * 4) * Math.min(1, (sd.z - .12) * 4) * env.dayF * (1 - (wx ? wx.cloud : 0) * .9) : 0;
      rb.forEach(function (b) {
        b.m.visible = amt > .02; if (!(amt > .02)) return;
        var t = b.y / sd.y, hw = .6, p = b.p, fz = Math.max(-7.5, 8 - sd.z * t);
        p[0] = b.x - hw; p[1] = b.y; p[2] = 8;
        p[3] = b.x + hw; p[4] = b.y; p[5] = 8;
        p[6] = b.x + hw - sd.x * t; p[7] = .03; p[8] = fz;
        p[9] = b.x - hw - sd.x * t; p[10] = .03; p[11] = fz;
        b.m.geometry.attributes.position.needsUpdate = true;
      });
    }
    setInterval(function () { try { upd(); } catch (e) { } }, 400); upd();
    /* блик */
    var host = document.getElementById('w') || document.body;
    var gl = document.createElement('div'), wash = document.createElement('div');
    gl.style.cssText = 'position:absolute;left:50%;top:50%;width:90vmin;height:90vmin;margin:-45vmin 0 0 -45vmin;pointer-events:none;z-index:1;opacity:0;mix-blend-mode:screen;background:radial-gradient(circle,rgba(255,250,225,.95) 0,rgba(255,232,170,.5) 18%,rgba(255,214,140,.18) 42%,rgba(255,214,140,0) 68%)';
    wash.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1;opacity:0;mix-blend-mode:screen;background:radial-gradient(ellipse at 50% 40%,rgba(255,236,190,.55),rgba(255,236,190,.12) 70%)';
    host.appendChild(wash); host.appendChild(gl);
    var v = new THREE.Vector3(), d = new THREE.Vector3(), k = 0;
    (function loop() {
      requestAnimationFrame(loop);
      try {
        var sd = W3.sunDir, tgt = 0, boost = .8;
        if (amt > .03 && typeof mode !== 'undefined' && (mode == 'play' || mode == 'talk') && sd.z > .05) {
          var P = cam.position, t = (8 - P.z) / sd.z, hx = P.x + sd.x * t, hy = P.y + sd.y * t;
          cam.getWorldDirection(d); boost = .8 + .7 * Math.max(0, d.z);
          v.set(P.x + sd.x * 200, P.y + sd.y * 200, P.z + sd.z * 200).project(cam);
          var ax = Math.abs(hx);
          if (P.z < 7.6 && hy > 1.3 && hy < 6 && ax > 3 && ax < 10.3 && v.z < 1 && Math.abs(v.x) < 1.5 && Math.abs(v.y) < 1.5) {
            tgt = amt;
            gl.style.left = ((v.x * .5 + .5) * 100).toFixed(1) + '%'; gl.style.top = ((-v.y * .5 + .5) * 100).toFixed(1) + '%';
          }
        }
        k += (tgt - k) * .08;
        var vis = k > .01 ? 'block' : 'none'; if (gl.style.display !== vis) { gl.style.display = vis; wash.style.display = vis; }
        if (k > .01) { gl.style.opacity = (k * .9).toFixed(3); wash.style.opacity = (k * .35).toFixed(3); }
        mat.opacity = Math.min(.5, .5 * amt * boost);
      } catch (e) { }
    })();
    window.__rays = { get: function () { return on; }, set: function (b) { on = !!b; upd(); try { localStorage.setItem('pcrays', on ? '1' : '0'); } catch (e) { } } };
    console.log('[rays] готово');
  }
  if (ready()) setTimeout(go, 1000); else { var n = 0, iv = setInterval(function () { if (ready()) { clearInterval(iv); setTimeout(go, 1000); } else if (++n > 600) clearInterval(iv); }, 100); }
})();
