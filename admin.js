/* PC МАСТЕР — admin.js: консоль разработчика (отдельный файл, подключать последним).
   Открыть: клавиша ` (Ё) или F9.  Закрыть: Esc или снова ` .  Команда: help — список.
   Можно и из консоли браузера: cmd('day 5'). Не мешает игре, если файл убрать. */
(function () {
  if (window.__adminLoaded) return;
  window.__adminLoaded = 1;
  var EL, IN, LOG, open = false, hist = [], hi = 0;

  function say(t, c) { var d = document.createElement('div'); d.style.cssText = 'padding:1px 0;color:' + (c || '#cfe'); d.textContent = t; LOG.appendChild(d); LOG.scrollTop = 1e6; }
  function inG() { try { return !!G; } catch (e) { return false; } }
  function ev() { G.ev = G.ev || {}; return G.ev; }
  function sk() { var e = ev(); return (e.sk = e.sk || { st: 0, key: 0, cl: [] }); }
  function refresh() { try { hud(); } catch (e) { } try { save(); } catch (e) { } }
  function toast2(t) { try { toast(t); } catch (e) { } }

  var C = {};
  C.help = ['показать список команд', function () {
    var rows = [
      'day N — перейти на день N (сюжетные события привязаны к дню)', 'skip [N] — закончить день (N раз)', 'money N — поставить деньги', 'debt N — поставить долг', 'parts [N] — добавить N случайных деталей на склад (по умолч. 4)',
      '— СЦЕНЫ —', 'storage — запустить обвал стены и звонок Макса (склад)', 'storage key — выдать ключ от склада', 'storage open — открыть дверь, можно убираться', 'storage clean — склад убран, появился ящик с наградой', 'storage reward — выдать награду', 'storage reset — сбросить сюжет склада', 'storage go — телепорт к двери склада / внутрь',
      'blackout — выбить пробки (сцена со светом)', 'light — вернуть свет (рубильник включён)', 'call max | call viktor — тестовый звонок',
      'customer — позвать клиента сейчас', 'rob — запустить ограбление', 'book — открыть справочник',
      '— ПРОЧЕЕ —', 'tp store | door | bench | counter | out — телепорт', 'mood | realism | look — переключить атмосферу/тени/красоту', 'reset — сбросить все сюжетные флаги (G.ev)', 'where — где ты и состояние сюжетов', 'clear — очистить окно'];
    rows.forEach(function (r) { say(r, r[0] == '—' ? '#fbbf24' : '#cfe'); });
  }];
  C.clear = ['очистить', function () { LOG.innerHTML = ''; }];
  C.day = ['day N', function (a) { var n = parseInt(a[0], 10); if (!(n >= 1 && n <= 40)) return say('Пример: day 5', '#f88'); G.day = n; refresh(); say('Теперь день ' + n); }];
  C.skip = ['skip [N]', function (a) { var n = Math.max(1, Math.min(10, parseInt(a[0], 10) || 1)); (function loop(i) { if (i <= 0) return; try { next(); } catch (e) { say('next(): ' + e.message, '#f88'); return; } setTimeout(function () { loop(i - 1); }, 600); })(n); say('Дней пропущено: ' + n); }];
  C.money = ['money N', function (a) { var n = parseFloat(a[0]); if (isNaN(n)) return say('Пример: money 5000', '#f88'); G.m = n; refresh(); say('Деньги: ' + n); }];
  C.debt = ['debt N', function (a) { var n = parseFloat(a[0]); if (isNaN(n)) return say('Пример: debt 0', '#f88'); G.debt = n; refresh(); say('Долг: ' + n); }];
  C.parts = ['parts [N]', function (a) { var n = parseInt(a[0], 10) || 4; for (var k = 0; k < n; k++) { var c = Math.floor(Math.random() * CAT.length), i = Math.floor(Math.random() * CAT[c].length); G.st.push({ c: c, i: i, u: 0, bad: 0, h: 0, pl: 0, fl: 0 }); } try { shelf(); } catch (e) { } refresh(); say('Добавлено деталей: ' + n); }];
  C.storage = ['storage ...', function (a) {
    var S = window.__storage, s = sk(), w = a[0] || '';
    if (!S) return say('storage.js не загружен', '#f88');
    if (w == '' ) { if (s.st) return say('Сюжет уже идёт (st=' + s.st + '). Сбрось: storage reset', '#fb7'); S.start(); return say('Обвал запущен…'); }
    if (w == 'reset') { G.ev.sk = { st: 0, key: 0, cl: [] }; S.sync(); refresh(); return say('Сюжет склада сброшен (день ' + G.day + ')'); }
    if (w == 'key') { if (!s.st) s.st = 1; s.st = 3; s.key = 1; S.sync(); s.st = 3; s.key = 1; refresh(); return say('Ключ выдан. Иди к двери на правой стене.'); }
    if (w == 'open') { s.st = 4; s.key = 0; S.sync(); refresh(); return say('Дверь открыта — убирайся на складе.'); }
    if (w == 'clean') { s.st = 5; s.cl = []; for (var i = 0; i < S.total; i++) s.cl.push(i); S.sync(); refresh(); return say('Склад чист. Ящик с наградой у дальней стены.'); }
    if (w == 'reward') { s.st = 5; S.sync(); say('Открой ящик на складе (E).'); return; }
    if (w == 'go') { if (s.st >= 4) P.set(13, 3.4, -2.6); else P.set(8.2, 3.4, -2.6); yaw = s.st >= 4 ? 1.5 : 1.57; return say('Телепорт.'); }
    say('Неизвестно: storage ' + w, '#f88');
  }];
  C.blackout = ['blackout', function () { if (!window.__blackout) return say('blackout.js не загружен', '#f88'); window.__blackout.start(); say('Свет выбило.'); }];
  C.light = ['light', function () { try { var b = window.__blackout; if (b && b.state() && b.state().st) { var s = b.state(); s.st = 0; try { b.flip && b.flip(); } catch (e) { } } G.ev.bo = { st: 0, n: (G.ev.bo && G.ev.bo.n) || 1 }; refresh(); say('Свет включён.'); } catch (e) { say('Не вышло: ' + e.message, '#f88'); } }];
  C.call = ['call max|viktor', function (a) {
    var w = (a[0] || 'max').toLowerCase()[0] == 'v' ? 'V' : 'M';
    try { incomingCall(w, [[w, 'Это тестовый звонок из админ-консоли.'], ['Y', 'Слышу тебя.'], [w, 'Отлично, всё работает.']], null); say('Звонит ' + (w == 'V' ? 'Виктор' : 'Максим') + '…'); } catch (e) { say(e.message, '#f88'); }
  }];
  C.customer = ['customer', function () { try { spawn(); say('Клиент вызван.'); } catch (e) { say(e.message, '#f88'); } }];
  C.rob = ['rob', function () { try { spawnRob(); say('Ограбление!'); } catch (e) { say(e.message, '#f88'); } }];
  C.book = ['book', function () { close(); setTimeout(function () { window.__bookview && window.__bookview.open(); }, 80); }];
  C.tp = ['tp store|door|bench|counter|out', function (a) {
    var T = { store: [13, 3.4, -2.6, 1.5], door: [8.2, 3.4, -2.6, 1.57], bench: [0, 3.4, -2.6, 0], counter: [0, 3.4, 4.2, 0], out: [0, 3.4, 10.5, 0], start: [0, 3.4, .85, 0] }, t = T[a[0]];
    if (!t) return say('Места: store door bench counter out start', '#f88'); P.set(t[0], t[1], t[2]); yaw = t[3]; say('Телепорт: ' + a[0]);
  }];
  C.mood = ['mood', function () { window.__mood ? window.__mood.toggle() : say('mood.js не загружен', '#f88'); }];
  C.realism = ['realism', function () { window.__rz ? window.__rz.cycle() : say('нет', '#f88'); }];
  C.look = ['look', function () { window.__look ? window.__look.toggle() : say('нет', '#f88'); }];
  C.reset = ['reset', function () { G.ev = {}; try { window.__storage && window.__storage.sync(); } catch (e) { } refresh(); say('Сюжетные флаги сброшены.'); }];
  C.where = ['where', function () { say('x=' + P.x.toFixed(2) + ' z=' + P.z.toFixed(2) + ' · день ' + G.day + ' · $' + Math.round(G.m) + ' · долг ' + Math.round(G.debt || 0)); try { say('склад: ' + JSON.stringify(G.ev.sk || {}) + ' · свет: ' + JSON.stringify(G.ev.bo || {})); } catch (e) { } }];
  C.sklad = C.storage;

  function run(line) {
    if (!EL) build(); line = String(line || '').trim(); if (!line) return;
    say('> ' + line, '#fde68a');
    var p = line.split(/\s+/), n = p.shift().toLowerCase(), f = C[n];
    if (!f) return say('Нет такой команды. Введи help', '#f88');
    if (!inG() && n != 'help' && n != 'clear') return say('Сначала начни игру (Играть / Продолжить).', '#f88');
    try { f[1](p); } catch (e) { say('Ошибка: ' + e.message, '#f88'); console.error(e); }
  }
  window.cmd = run;

  function build() {
    EL = document.createElement('div'); EL.id = 'adm';
    EL.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:90;display:none;flex-direction:column;background:rgba(6,8,14,.94);border-top:2px solid #22d3ee;font:13px/1.4 Consolas,monospace;color:#cfe;backdrop-filter:blur(6px)';
    LOG = document.createElement('div'); LOG.style.cssText = 'height:34vh;overflow:auto;padding:8px 14px;user-select:text';
    var row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:center;padding:6px 14px;border-top:1px solid rgba(255,255,255,.1)';
    var pr = document.createElement('span'); pr.textContent = '›'; pr.style.cssText = 'color:#22d3ee;margin-right:8px;font-size:16px';
    IN = document.createElement('input'); IN.type = 'text'; IN.spellcheck = false; IN.autocomplete = 'off'; IN.placeholder = 'help — список команд';
    IN.style.cssText = 'flex:1;background:none;border:0;outline:0;color:#fff;font:inherit;user-select:text';
    row.appendChild(pr); row.appendChild(IN); EL.appendChild(LOG); EL.appendChild(row);
    try { document.getElementById('w').appendChild(EL); } catch (e) { document.body.appendChild(EL); }
    say('PC МАСТЕР · админ-консоль. Введи help.', '#22d3ee');
    IN.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key == 'Enter') { var v = IN.value; if (v.trim()) { hist.push(v); hi = hist.length; } IN.value = ''; run(v); }
      else if (e.key == 'ArrowUp') { if (hi > 0) IN.value = hist[--hi] || ''; e.preventDefault(); }
      else if (e.key == 'ArrowDown') { hi = Math.min(hist.length, hi + 1); IN.value = hist[hi] || ''; e.preventDefault(); }
      else if (e.key == 'Escape' || e.key == '`' || e.key == 'ё' || e.key == 'Ё' || e.code == 'Backquote') { e.preventDefault(); close(); }
      else if (e.key == 'Tab') { e.preventDefault(); var t = IN.value.toLowerCase(), m = Object.keys(C).filter(function (k) { return k.indexOf(t) == 0; }); if (m.length == 1) IN.value = m[0] + ' '; }
    });
    IN.addEventListener('keyup', function (e) { e.stopPropagation(); });
  }
  function openC() {
    if (open) return; if (!EL) build();
    try { if (typeof mode != 'undefined' && mode == 'play' && !PZ) { PZ = 1; window.__admPZ = 1; keys = {}; if (document.pointerLockElement) document.exitPointerLock(); } else window.__admPZ = 0; } catch (e) { }
    open = true; EL.style.display = 'flex'; setTimeout(function () { IN.focus(); }, 30);
  }
  function close() {
    if (!open) return; open = false; EL.style.display = 'none'; try { IN.blur(); } catch (e) { }
    if (window.__admPZ) { window.__admPZ = 0; try { if (typeof pauseClose == 'function' && PZ) pauseClose(); else { PZ = 0; tryLock(); } } catch (e) { } }
  }
  addEventListener('keydown', function (e) {
    if (e.repeat) return;
    if (e.code == 'Backquote' || e.code == 'F9') { if (open && e.target === IN && e.code == 'Backquote') return; e.preventDefault(); e.stopImmediatePropagation(); open ? close() : openC(); }
    else if (e.code == 'Escape' && open) { e.preventDefault(); e.stopImmediatePropagation(); close(); }
  }, true);
  window.__admin = { open: openC, close: close, run: run };
})();
