/* PC МАСТЕР — «ультра» эффекты поверх 3D-картинки:
     • разводы (шлейф) при быстром повороте камеры — opt.mb
     • мягкое свечение неона и ярких поверхностей — opt.bl
   Размытие — усреднение нескольких сдвинутых копий кадра вдоль направления поворота (гладкое, без «квадратных» призраков).
   Всё делается в обычном 2D-холсте поверх сцены, сам 3D-рендер не меняется.
   Если игра начинает тормозить, эффекты сами выключаются (по одному), включить обратно можно в настройках. */
var FX = { pr: null, cv: null, x: null, acc: null, ax: null, bl: null, bx: null, bOk: false, bc: 0, pq: null, last: 0, tt: 0, n: 0, sum: 0, slow: 0, filt: null };

function fxInit() {
  var GL = R.domElement, cv = document.createElement('canvas');
  cv.id = 'fxc'; cv.style.pointerEvents = 'none';
  GL.parentNode.insertBefore(cv, GL.nextSibling); // сразу над 3D-картинкой, под интерфейсом
  FX.cv = cv; FX.x = cv.getContext('2d', { alpha: false });
  FX.acc = document.createElement('canvas'); FX.ax = FX.acc.getContext('2d', { alpha: false });
  FX.bl = document.createElement('canvas'); FX.bx = FX.bl.getContext('2d');
  FX.bOk = !!FX.bx && ('filter' in FX.bx);
}

function fxHide() {
  if (FX.cv && FX.cv.style.display != 'none') FX.cv.style.display = 'none';
  FX.pq = null; FX.pr = null; FX.tt = 0;
}

function fxFrame() {
  var GL = R.domElement;
  var useT = opt.mb !== 0, useB = opt.bl !== 0 && (FX.cv ? FX.bOk : true);
  if (!useT && opt.bl === 0) { fxHide(); return; }
  if (!FX.cv) { fxInit(); useB = opt.bl !== 0 && FX.bOk; }
  if (!useT && !useB) { fxHide(); return; }
  var w = GL.width, h = GL.height;
  if (!w || !h) return;
  if (FX.cv.width !== w || FX.cv.height !== h) {
    FX.cv.width = w; FX.cv.height = h; FX.acc.width = w; FX.acc.height = h;
    FX.bl.width = Math.max(2, w >> 3); FX.bl.height = Math.max(2, h >> 3);
  }
  FX.cv.style.display = 'block';
  if (FX.filt !== GL.style.filter) { FX.filt = GL.style.filter; FX.cv.style.filter = FX.filt; } // тот же цветокор/размытие, что и у 3D

  var now = performance.now(), dt = (now - FX.last) / 1000;
  FX.last = now;
  if (!(dt > 0)) dt = .016;
  dt = Math.min(dt, .1);

  // смещение картинки между кадрами (px) из поворота камеры: yaw → по X, pitch → по Y
  var cr = cam.rotation, mdx = 0, mdy = 0;
  if (FX.pr) {
    var dyaw = Math.atan2(Math.sin(cr.y - FX.pr[0]), Math.cos(cr.y - FX.pr[0])), dpit = cr.x - FX.pr[1];
    var f = (h / 2) / Math.tan(cam.fov * Math.PI / 360);
    mdx = -f * dyaw; mdy = -f * dpit;
  }
  FX.pr = [cr.y, cr.x];
  var len = Math.hypot(mdx, mdy);
  /* плавное включение: слабые движения не размываем; ограничиваем длину шлейфа */
  var t = useT ? Math.min(1, Math.max(0, (len - 3) / 25)) : 0;
  FX.tt += (t - FX.tt) * Math.min(1, dt * 20);
  var cap = h * .06, k = len > cap * 2 ? cap * 2 / len : 1;        // не больше ~6% высоты в каждую сторону
  var ox = mdx * k * .5 * FX.tt, oy = mdy * k * .5 * FX.tt, tl = Math.hypot(ox, oy);

  var cx = FX.x;
  cx.globalCompositeOperation = 'source-over'; cx.globalAlpha = 1;
  cx.drawImage(GL, 0, 0);                                           // кадр как есть
  if (useT && tl > 1.2) {                                           // настоящее размытие: усредняем сдвинутые копии кадра вдоль движения
    var N = Math.max(3, Math.min(9, Math.ceil(tl / 5)));
    for (var i = 1; i <= N; i++) {
      cx.globalAlpha = 1 / (i + 1);
      cx.drawImage(GL, ox * i / N, oy * i / N);
    }
    cx.globalAlpha = 1;
  }
  if (useB) { // свечение: яркие места → уменьшенная размытая копия → добавляем поверх
    if ((FX.bc++ & 1) == 0) {
      var bx = FX.bx;
      bx.globalCompositeOperation = 'source-over';
      bx.filter = 'brightness(.55) contrast(3.4) blur(2px)';
      bx.drawImage(GL, 0, 0, FX.bl.width, FX.bl.height);
      bx.filter = 'none';
    }
    cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = .22;
    cx.drawImage(FX.bl, 0, 0, w, h);
    cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
  }

  // защита плавности: если игра тормозит 2 «окна» подряд, выключаем сначала свечение, потом шлейф
  if (mode != 'menu' && !PZ) {
    FX.sum += dt;
    if (++FX.n >= 90) {
      var av = FX.sum / FX.n;
      FX.n = 0; FX.sum = 0;
      if (av > .04) {
        if (++FX.slow >= 2) {
          FX.slow = 0;
          if (opt.bl !== 0 && FX.bOk) { opt.bl = 0; toast('Свечение выключено, чтобы игра шла плавно. Включить: Настройки'); }
          else if (opt.mb !== 0) { opt.mb = 0; toast('Разводы при повороте выключены, чтобы игра шла плавно. Включить: Настройки'); }
        }
      } else FX.slow = 0;
    }
  }
}
