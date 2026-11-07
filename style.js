/* PC МАСТЕР — style.js: «аниме-стиль» в духе MiSide (мультяшная 3D-графика).
   • мягкое «мультяшное» затенение: свет разбит на ступени, цвета чуть насыщеннее (шейдер-вставка в материалы, ссылки на материалы не ломаются)
   • тёмный контур у людей (inverted hull)
   • большие блестящие глаза и румянец у персонажей
   • пастельная цветокоррекция розово-бирюзовым оттенком
   Включить/выключить: пауза → «Аниме-стиль» (или window.__style.toggle()). Без этого файла игра работает как раньше. */
(function () {
  if (window.__styleLoaded) return;
  window.__styleLoaded = 1;
  function ready() { try { return typeof THREE !== 'undefined' && !!scene && !!R && typeof mkP === 'function' && !!window.__modelsLoaded && !!document.getElementById('w'); } catch (e) { return false; } }

  function go() {
    var ON = false; try { var sv = localStorage.getItem('pcstyle2'); if (sv === '1') ON = true; } catch (e) { }
    var TU = { value: ON ? 1 : 0 }, queue = [], seen = new WeakSet(), outlines = 0, MAXO = 150;
    var CODE = [
      '{',
      ' float l = dot(gl_FragColor.rgb, vec3(0.299,0.587,0.114));',
      ' float t = l * 4.5; float f = fract(t);',
      ' float qb = (floor(t) + smoothstep(0.38, 0.62, f)) / 4.5;',
      ' float k = clamp((qb + 0.06) / (l + 0.06), 0.55, 1.6);',
      ' vec3 c = gl_FragColor.rgb * k;',
      ' float l2 = dot(c, vec3(0.299,0.587,0.114));',
      ' c = mix(vec3(l2), c, 1.22);',
      ' gl_FragColor.rgb = mix(gl_FragColor.rgb, c, uToon);',
      '}'
    ].join('\n');

    function patch(m) {
      if (m.__toon || !m.isMeshStandardMaterial) return; m.__toon = 1;
      var prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey;
      m.onBeforeCompile = function (sh, r) {
        try { prev && prev.call(this, sh, r); } catch (e) { }
        sh.uniforms.uToon = TU;
        if (sh.fragmentShader.indexOf('#include <tonemapping_fragment>') >= 0) sh.fragmentShader = 'uniform float uToon;\n' + sh.fragmentShader.replace('#include <tonemapping_fragment>', '#include <tonemapping_fragment>\n' + CODE);
      };
      m.customProgramCacheKey = function () { return (prevKey ? prevKey.call(this) : '') + '|toon1'; };
      m.needsUpdate = true;
    }

    /* контур: перевёрнутая оболочка, раздутая по нормали */
    var oMat = null;
    function outlineMat() {
      if (oMat) return oMat;
      oMat = new THREE.MeshBasicMaterial({ color: 0x241437, side: THREE.BackSide });
      oMat.onBeforeCompile = function (sh) { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position + normalize(normal) * 0.035;'); };
      oMat.customProgramCacheKey = function () { return 'outline1'; };
      return oMat;
    }
    function addOutlines(g) {
      var list = [];
      g.traverse(function (o) { if (o.isMesh && !o.userData.__ol && o.visible && o.material && !Array.isArray(o.material) && !o.material.transparent && o.geometry) list.push(o); });
      list.forEach(function (o) {
        if (outlines >= MAXO) return;
        var geo = o.geometry; if (!geo.boundingSphere) { try { geo.computeBoundingSphere(); } catch (e) { return; } }
        var sc = Math.max(o.scale.x, o.scale.y, o.scale.z); if (!geo.boundingSphere || geo.boundingSphere.radius * sc < .12) return;
        var t = geo.type; if (t == 'PlaneGeometry' || t == 'CircleGeometry' || t == 'RingGeometry') return;
        var ol = new THREE.Mesh(geo, outlineMat()); ol.userData.__ol = 1; ol.position.copy(o.position); ol.rotation.copy(o.rotation); ol.scale.copy(o.scale);
        ol.castShadow = false; ol.receiveShadow = false; ol.visible = ON; ol.userData.outline = 1;
        if (o.parent) { o.parent.add(ol); outlines++; }
      });
    }
    function setOutlines(v) { scene.traverse(function (o) { if (o.userData && o.userData.outline) o.visible = v; }); }

    /* аниме-лицо: крупнее глаза, блики, румянец */
    function animeFace(g) {
      try {
        var ey = g.userData && g.userData.ey, hd = g.userData && g.userData.head;
        if (ey) ey.children.forEach(function (c) { c.scale.x *= 1.16; c.scale.y *= 1.16; });
        if (hd) {
          var cm = new THREE.MeshStandardMaterial({ color: 0xff9aae, roughness: 1, transparent: true, opacity: .45 });
          [-1, 1].forEach(function (s) { var c = new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), cm); c.scale.set(1.5, .75, .25); c.position.set(s * .17, .17, .275); hd.add(c); });
          var sh = new THREE.MeshBasicMaterial({ color: 0xffffff });
          [-1, 1].forEach(function (s) { var d = new THREE.Mesh(new THREE.SphereGeometry(.014, 8, 6), sh); d.scale.set(1, 1, .4); d.position.set(s * .11 + .018, .335, .296); hd.add(d); });
        }
      } catch (e) { }
    }
    var _mk = mkP;
    mkP = function (o) { var g = _mk.apply(this, arguments); try { animeFace(g); addOutlines(g); } catch (e) { } return g; };

    /* очередь материалов — по кусочкам, чтобы не было подвисания */
    function scan() {
      scene.traverse(function (o) {
        if (!o.isMesh || !o.material) return; var ms = Array.isArray(o.material) ? o.material : [o.material];
        ms.forEach(function (m) { if (!seen.has(m)) { seen.add(m); queue.push(m); } });
      });
    }
    setInterval(function () { try { scan(); } catch (e) { } }, 3000);
    setInterval(function () { for (var i = 0; i < 24 && queue.length; i++) { var m = queue.shift(); try { patch(m); } catch (e) { } } }, 120);
    setTimeout(scan, 1500);

    /* пастельный цветовой оттенок поверх картинки */
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1;mix-blend-mode:soft-light;opacity:.34;background:radial-gradient(ellipse at 15% 10%,#ff8fd0 0%,rgba(255,143,208,0) 55%),radial-gradient(ellipse at 90% 95%,#6fe3ff 0%,rgba(111,227,255,0) 60%)';
    document.getElementById('w').appendChild(ov);

    function apply() { TU.value = ON ? 1 : 0; ov.style.display = ON ? 'block' : 'none'; setOutlines(ON); try { localStorage.setItem('pcstyle2', ON ? '1' : '0'); } catch (e) { } }
    apply();
    window.__style = { get: function () { return ON; }, set: function (v) { ON = !!v; apply(); }, toggle: function () { ON = !ON; apply(); try { toast('Аниме-стиль: ' + (ON ? 'вкл' : 'выкл')); } catch (e) { } } };
    console.log('[style] готово');
  }
  if (ready()) setTimeout(go, 2000); else { var n = 0, iv = setInterval(function () { if (ready()) { clearInterval(iv); setTimeout(go, 2000); } else if (++n > 600) clearInterval(iv); }, 100); }
})();
