/* Плашка обновления внутри игры (только в приложении Electron; в браузере и на телефоне ничего не делает).
   Приложение само проверяет сайт; тут только показ и кнопки: «Обновить» → скачивание → «Перезапустить». */
(function () {
  if (!window.pcApp || !window.pcApp.onUpdate) return;
  var el = document.createElement('div');
  el.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:99999;display:none;max-width:340px;padding:12px 14px;border-radius:14px;background:rgba(14,18,30,.92);color:#e7ecf7;font:14px/1.35 system-ui,sans-serif;border:1px solid rgba(120,160,255,.35);box-shadow:0 8px 30px rgba(0,0,0,.45);backdrop-filter:blur(6px)';
  document.body.appendChild(el);
  var st = null;
  function btn(t, fn, primary) { var b = document.createElement('button'); b.textContent = t; b.style.cssText = 'margin:8px 8px 0 0;padding:7px 12px;border-radius:9px;border:0;cursor:pointer;font:600 13px system-ui;' + (primary ? 'background:linear-gradient(90deg,#22d3ee,#a855f7);color:#05060a' : 'background:#263045;color:#cfd8ee'); b.onclick = fn; return b; }
  function hint() { return document.pointerLockElement ? '<div style="opacity:.7;margin-top:4px;font-size:12px">Нажми Esc (пауза), чтобы нажать кнопку</div>' : ''; }
  function draw() {
    if (!st || st.hide) { el.style.display = 'none'; return; }
    el.style.display = 'block'; el.innerHTML = '';
    var t = document.createElement('div');
    if (st.state === 'available') {
      t.innerHTML = '<b>Доступно обновление ' + (st.version || '') + '</b><div style="opacity:.75">Сохранение не потеряется.</div>' + hint(); el.appendChild(t);
      el.appendChild(btn('Обновить', function () { st = { state: 'progress', percent: 0 }; draw(); window.pcApp.downloadUpdate(); }, 1));
      el.appendChild(btn('Позже', function () { st.hide = 1; draw(); }));
    } else if (st.state === 'progress') {
      t.innerHTML = '<b>Скачиваю обновление… ' + (st.percent || 0) + '%</b><div style="height:6px;border-radius:4px;background:#263045;margin-top:8px"><div style="height:6px;border-radius:4px;width:' + (st.percent || 0) + '%;background:linear-gradient(90deg,#22d3ee,#a855f7)"></div></div>'; el.appendChild(t);
    } else if (st.state === 'ready') {
      t.innerHTML = '<b>Обновление ' + (st.version || '') + ' готово</b><div style="opacity:.75">Игра перезапустится и продолжит с сохранения.</div>' + hint(); el.appendChild(t);
      el.appendChild(btn('Перезапустить', function () { try { typeof save === "function" && save(); } catch (e) {} window.pcApp.installUpdate(); }, 1));
      el.appendChild(btn('Позже', function () { st.hide = 1; draw(); }));
    } else { el.style.display = 'none'; try { console.warn('[update]', st.msg); } catch (e) {} }
  }
  window.pcApp.onUpdate(function (o) { st = o; draw(); });
  document.addEventListener('pointerlockchange', draw);
})();
