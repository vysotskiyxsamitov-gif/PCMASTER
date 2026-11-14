/* Отсечение улицы: пока игрок смотрит не в сторону окон и двери, улица (дома, машины, люди, фонари) вообще не рисуется
   и не обходится движком. Как только окно попадает в поле зрения — улица включается и оказывается на месте.
   Выключить: window.__cull = false (в консоли). Условие: только когда игрок внутри магазина. */
(function () {
  function init() {
    if (typeof R === 'undefined' || typeof scene === 'undefined' || !window.__W || !window.__W.ST || window.__cullInit) return false;
    window.__cullInit = true;
    var ST = window.__W.ST, fr = new THREE.Frustum(), pm = new THREE.Matrix4(),
      box = new THREE.Box3(new THREE.Vector3(-12, -.5, 6), new THREE.Vector3(12, 11, 10)),   // передняя стена с окнами и дверью
      hid = 0, _r = R.render.bind(R);
    R.render = function (s, c) {
      try {
        if (window.__cull !== false && c && c.position) {
          if (c.position.z < 7.3 && Math.abs(c.position.x) < 10.2 && c.position.y > 0) {
            c.updateMatrixWorld(); pm.multiplyMatrices(c.projectionMatrix, c.matrixWorldInverse); fr.setFromProjectionMatrix(pm);
            var see = fr.intersectsBox(box); if (ST.visible !== see) { ST.visible = see; hid += see ? 0 : 1; }
          } else if (!ST.visible) ST.visible = true;
        } else if (!ST.visible) ST.visible = true;
      } catch (e) { }
      return _r(s, c);
    };
    var _ns = 0, _nt = setInterval(function () { try { ST.traverse(function (o) { if (o.isMesh && o.castShadow) o.castShadow = false; }); } catch (e) { } if (++_ns > 40) clearInterval(_nt); }, 3000);
    window.__cullInfo = function () { return { улицаВидна: ST.visible, скрытийУлицы: hid }; };
    return true;
  }
  if (!init()) { var n = 0, t = setInterval(function () { if (init() || ++n > 120) clearInterval(t); }, 500); }
})();
