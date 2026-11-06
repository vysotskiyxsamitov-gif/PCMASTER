/* PC МАСТЕР — mood.js: атмосфера. Глубже тени (приглушённый рассеянный свет), сильная виньетка,
   киноплёночное зерно, редкое мерцание ламп под потолком. Переключатель: пауза → «Атмосфера» (window.__mood). */
(function () {
  if (window.__moodLoaded) return;
  window.__moodLoaded = 1;
  function ready() { try { return typeof THREE !== 'undefined' && !!scene && !!cam && !!R && !!document.getElementById('vg') && !!window.__roomLoaded; } catch (e) { return false; } }
  function go() {
    var ON = true; try { ON = localStorage.getItem('pcmood') !== '0'; } catch (e) { }
    var vg = document.getElementById('vg'), vg0 = vg.style.background, hemi = null, lamps = [];
    scene.traverse(function (o) { if (o.isHemisphereLight && !hemi) hemi = o; if (o.isPointLight && o.position.y > 6.5 && o.position.y < 7.7) lamps.push(o); });
    /* зерно */
    var c = document.createElement('canvas'); c.width = c.height = 128; var x = c.getContext('2d'), d = x.createImageData(128, 128);
    for (var i = 0; i < d.data.length; i += 4) { var v = 90 + Math.random() * 90; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } x.putImageData(d, 0, 0);
    var gr = document.createElement('div'), st = document.createElement('style');
    st.textContent = '@keyframes mgr{0%{background-position:0 0}20%{background-position:-31px 17px}40%{background-position:23px -41px}60%{background-position:-52px -9px}80%{background-position:37px 33px}100%{background-position:0 0}}';
    document.head.appendChild(st);
    gr.style.cssText = 'position:fixed;inset:0;pointer-events:none;mix-blend-mode:overlay;opacity:.09;background-image:url(' + c.toDataURL() + ');animation:mgr .5s steps(5) infinite;z-index:1';
    vg.parentNode.insertBefore(gr, vg.nextSibling);
    function apply() { vg.style.background = ON ? 'radial-gradient(ellipse at center,rgba(0,0,0,0) 45%,rgba(0,0,0,.4) 100%)' : vg0; gr.style.display = ON ? 'block' : 'none'; try { localStorage.setItem('pcmood', ON ? '1' : '0'); } catch (e) { } }
    apply();
    var flick = 0, fl = null, next = performance.now() + 20000 + Math.random() * 30000;
    var _r = R.render.bind(R);
    R.render = function (s, c2) {
      if (!ON || s !== scene || c2 !== cam) return _r(s, c2);
      var hi = hemi ? hemi.intensity : 0, ex = R.toneMappingExposure, li = fl ? fl.intensity : 0, now = performance.now();
      if (hemi) hemi.intensity = hi * 1.05; R.toneMappingExposure = ex * 1.2;
      if (flick > 0) { flick -= 16; if (fl) fl.intensity = li * (Math.random() < .5 ? .1 : .55); }
      else if (now > next && typeof mode !== 'undefined' && mode == 'play' && lamps.length) { fl = lamps[Math.floor(Math.random() * lamps.length)]; flick = 380; next = now + 25000 + Math.random() * 50000; }
      var r = _r(s, c2);
      if (hemi) hemi.intensity = hi; R.toneMappingExposure = ex; if (fl && flick > 0) fl.intensity = li;
      return r;
    };
    window.__mood = { get: function () { return ON; }, set: function (v) { ON = !!v; apply(); }, toggle: function () { ON = !ON; apply(); try { toast('Атмосфера: ' + (ON ? 'вкл' : 'выкл')); } catch (e) { } } };
    console.log('[mood] готово');
  }
  if (ready()) setTimeout(go, 1500); else { var n = 0, iv = setInterval(function () { if (ready()) { clearInterval(iv); setTimeout(go, 1500); } else if (++n > 600) clearInterval(iv); }, 100); }
})();
