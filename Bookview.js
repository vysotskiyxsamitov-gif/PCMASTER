/* PC МАСТЕР — bookview.js: настоящая книга «Справочник мастера».
   Нажал E на книге — игра встаёт на паузу, книга раскрывается на весь экран: страницы листаются (3D-переворот),
   есть оглавление, азбука Морзе и по развороту на каждую неисправность; кнопка ▶ проигрывает сигнал.
   Управление: ← → / A D — листать, клик по краю страницы — тоже, Esc / E / Q — закрыть. */
(function () {
  if (window.__bookviewLoaded) return;
  window.__bookviewLoaded = 1;

  var FAULTS_FALLBACK = [];
  var DET = {
    dust: { ic: '🌫️', steps: ['Отключить ПК от сети и подождать минуту.', 'Снять боковую крышку корпуса.', 'Продуть радиатор и вентиляторы сжатым воздухом.', 'Протереть корпус, собрать и проверить температуру.'], tip: 'Пыль — враг №1. Если ПК шумит, как пылесос, — начни с чистки.' },
    paste: { ic: '🧴', steps: ['Снять кулер процессора.', 'Стереть старую высохшую пасту спиртом.', 'Нанести каплю новой пасты размером с горошину.', 'Поставить кулер на место и затянуть крест-накрест.'], tip: 'Паста сохнет за 3–4 года. Признак: процессор горячий, а кулер крутится.' },
    psu: { ic: '🔌', steps: ['Убедиться, что розетка и шнур исправны.', 'Отсоединить все кабели питания от платы.', 'Выкрутить 4 винта сзади и вынуть старый блок.', 'Поставить новый блок питания и подключить кабели.'], tip: 'Если не горит ни один светодиод и вентиляторы мертвы — почти всегда виноват блок питания.' },
    ram: { ic: '🧠', steps: ['Открыть защёлки слотов памяти.', 'Вынуть сбойную планку.', 'Вставить новую до щелчка.', 'Запустить тест памяти — ошибок быть не должно.'], tip: 'Синие экраны с разными кодами — частый признак плохой памяти.' },
    gpu: { ic: '🎮', steps: ['Отсоединить дополнительное питание видеокарты.', 'Отжать защёлку слота PCIe и вынуть карту.', 'Вставить новую видеокарту и подключить питание.', 'Подключить монитор и проверить картинку.'], tip: 'Артефакты — цветные полосы и квадраты — выдают умирающую видеокарту.' },
    cool: { ic: '🌀', steps: ['Отсоединить питание вентилятора от платы.', 'Снять кулер вместе с радиатором.', 'Заменить кулер, нанести пасту.', 'Подключить питание вентилятора, проверить обороты.'], tip: 'Если вентилятор процессора стоит — ПК выключается через минуту.' },
    cpu: { ic: '🧩', steps: ['Снять кулер и стереть пасту.', 'Поднять рычаг сокета, вынуть процессор.', 'Совместить ключ-метку и опустить новый процессор.', 'Опустить рычаг, нанести пасту, поставить кулер.'], tip: 'Бесконечные перезагрузки ещё на старте — подозревай процессор.' },
    mb: { ic: '🧱', steps: ['Вынуть все карты, память и кабели.', 'Выкрутить винты, достать старую плату.', 'Установить новую плату на стойки.', 'Собрать всё обратно и проверить запуск.'], tip: 'Искры и запах гари — повод не включать ПК, пока плата не заменена.' }
  };
  var NEEDN = { 1: 'материнская плата', 2: 'процессор', 3: 'кулер', 4: 'оперативная память', 5: 'видеокарта', 6: 'блок питания' };
  var MORSE_NAME = { D: 'Дельта', T: 'Танго', P: 'Папа', R: 'Ромео', G: 'Гольф', K: 'Кило', C: 'Чарли', M: 'Майк' };

  var EL = null, cur = 0, leaves = [], N = 0, pages = [], open = false, AC = null, playing = 0, sizeCb = null;

  function glyphs(code) { return String(code).split('').map(function (c) { return (c == '·' || c == '.') ? '<i class="d"></i>' : '<i class="t"></i>'; }).join(''); }
  function faults() { try { return (window.__orders && window.__orders.faults) || FAULTS_FALLBACK; } catch (e) { return FAULTS_FALLBACK; } }

  function build() {
    var F = faults(), P = [];
    P.push('<div class="cv"><div class="cvt">СПРАВОЧНИК<br>МАСТЕРА</div><div class="cvl"></div><div class="cvs">звуковые сигналы неисправных ПК</div><div class="cvb">PC МАСТЕР</div></div>');
    P.push('<div class="pg"><h3>Как пользоваться</h3><p>Включи неисправный компьютер — он <b>пискнет азбукой Морзе</b>. Запомни сигнал и найди его в этой книге.</p><div class="lg"><div><span class="gl"><i class="d"></i></span> короткий писк — <b>точка</b></div><div><span class="gl"><i class="t"></i></span> длинный писк — <b>тире</b></div></div><p>Сигнал повторяется дважды. Один короткий писк — компьютер исправен.</p><p class="mu">Нажми ▶ рядом с сигналом, чтобы потренировать слух.</p></div>');
    var toc = '<div class="pg"><h3>Оглавление</h3><ol class="toc">';
    F.forEach(function (f, i) { toc += '<li><span class="gl">' + glyphs(f.code) + '</span><span class="tn">' + f.n + '</span><span class="tp">' + (5 + i * 2) + '</span></li>'; });
    P.push(toc + '</ol></div>');
    var al = '<div class="pg"><h3>Азбука Морзе</h3><p class="mu">Буквы, которые подают наши компьютеры:</p><div class="al">';
    F.forEach(function (f) { al += '<div class="ai"><b>' + (f.L || '?') + '</b><span class="gl">' + glyphs(f.code) + '</span><em>' + (MORSE_NAME[f.L] || '') + '</em></div>'; });
    P.push(al + '</div></div>');
    F.forEach(function (f, i) {
      var d = DET[f.k] || { ic: '🔧', steps: [f.sol], tip: '' };
      P.push('<div class="pg"><div class="pn">Случай ' + (i + 1) + '</div><div class="big"><span class="gl lg2">' + glyphs(f.code) + '</span><button class="pl" data-c="' + f.code + '" title="Прослушать">▶</button></div><h3>' + f.n + '</h3><div class="ic">' + d.ic + '</div><p><b>Как проявляется:</b> ' + f.t + '.</p><p class="mu">Сигнал: ' + (f.L || '') + ' · ' + f.code.split('').join(' ') + '</p></div>');
      var st = '<div class="pg"><div class="pn">Что делать</div><h3>' + f.sol.replace(/\.$/, '') + '</h3><ol class="stp">';
      d.steps.forEach(function (s) { st += '<li>' + s + '</li>'; });
      st += '</ol><p>' + (f.need > 0 ? '<b>Нужна деталь:</b> ' + (NEEDN[f.need] || 'запчасть') + ' (со склада или из рук).' : '<b>Деталей не нужно</b> — только твои руки.') + '</p>' + (f.fee ? '<p><b>Обычная плата:</b> $' + f.fee[0] + '–' + f.fee[1] + '</p>' : '') + '<div class="tip">' + d.tip + '</div></div>');
    });
    P.push('<div class="pg"><h3>Заметки мастера</h3><ul class="nt"><li>Не торопись: неверный ремонт злит клиента, терпение уходит.</li><li>Чистка и термопаста обходятся без деталей — это быстрые деньги.</li><li>Держи на складе запас: БП, память и видеокарту просят чаще всего.</li><li>Если после ремонта сигнал не изменился — ты ошибся с диагнозом.</li></ul><div class="sig">— прежний хозяин мастерской</div></div>');
    P.push('<div class="pg bk"><div class="stamp">PC<br>МАСТЕР</div></div>');
    P.push('<div class="pg"></div>');
    P.push('<div class="cv back"><div class="cvl"></div></div>');
    while (P.length % 2) P.splice(P.length - 1, 0, '<div class="pg"></div>');
    return P;
  }

  var CSS = '#bkv{position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 40%,rgba(34,22,12,.55),rgba(0,0,0,.93) 75%);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);user-select:none}' +
    '#bkv .wrap{position:relative;perspective:2600px;transition:transform .8s cubic-bezier(.3,.7,.2,1)}' +
    '#bkv .bk{position:relative;width:calc(var(--pw)*2);height:var(--ph);transform-style:preserve-3d;transform:rotateX(14deg);filter:drop-shadow(0 30px 40px rgba(0,0,0,.65))}' +
    '#bkv .lf{position:absolute;left:50%;top:0;width:50%;height:100%;transform-origin:left center;transform-style:preserve-3d;transition:transform .95s cubic-bezier(.45,.05,.25,1)}' +
    '#bkv .lf.fl{transform:rotateY(-180deg)}' +
    '#bkv .fc,#bkv .bc{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden}' +
    '#bkv .bc{transform:rotateY(180deg)}' +
    '#bkv .pg{padding:7% 8% 8% 9%;font:italic 400 calc(var(--ph)*.026) Georgia,"Times New Roman",serif;color:#3b2a14;line-height:1.42;background:linear-gradient(90deg,#d9cdac 0,#efe5c9 7%,#f6eed6 40%,#f2e8cc 100%);height:100%;box-shadow:inset 0 0 70px rgba(120,80,20,.22)}' +
    '#bkv .bc .pg{padding:7% 9% 8% 8%;background:linear-gradient(270deg,#d9cdac 0,#efe5c9 7%,#f6eed6 40%,#f2e8cc 100%)}' +
    '#bkv .pg h3{margin:.1em 0 .5em;font:700 calc(var(--ph)*.042) Georgia,serif;font-style:normal;color:#5a1d12;letter-spacing:.01em;border-bottom:2px solid rgba(110,40,20,.35);padding-bottom:.25em}' +
    '#bkv .pg p{margin:.45em 0}#bkv .pg b{font-style:normal;color:#2b1d0c}#bkv .mu{opacity:.7;font-size:.9em}' +
    '#bkv .pn{font:600 calc(var(--ph)*.02) system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#9a3412;opacity:.8}' +
    '#bkv .gl{display:inline-flex;gap:.28em;align-items:center;vertical-align:middle}' +
    '#bkv .gl i{display:inline-block;background:#8a1c12;border-radius:99px;height:.5em;box-shadow:0 1px 0 rgba(0,0,0,.25);transition:all .12s}#bkv .gl i.d{width:.5em}#bkv .gl i.t{width:1.5em}#bkv .gl i.on{background:#f59e0b;box-shadow:0 0 .9em #f59e0b;transform:scale(1.15)}' +
    '#bkv .lg{display:flex;flex-direction:column;gap:.5em;margin:.8em 0;padding:.7em .9em;background:rgba(120,80,20,.08);border-radius:8px}' +
    '#bkv .big{display:flex;align-items:center;gap:.7em;margin:.5em 0 .2em;font-size:calc(var(--ph)*.05)}' +
    '#bkv .pl{font:inherit;font-size:.55em;width:2.1em;height:2.1em;border-radius:50%;border:0;background:#7f1d1d;color:#fde68a;cursor:pointer;box-shadow:0 3px 8px rgba(0,0,0,.35)}#bkv .pl:hover{background:#9a2a1c}' +
    '#bkv .ic{font-size:calc(var(--ph)*.11);text-align:center;margin:.1em 0;filter:drop-shadow(0 4px 4px rgba(0,0,0,.25))}' +
    '#bkv .stp{margin:.4em 0 .6em;padding-left:1.4em}#bkv .stp li{margin:.35em 0}' +
    '#bkv .tip{margin-top:.7em;padding:.6em .8em;border-left:4px solid #b45309;background:rgba(180,83,9,.09);border-radius:0 8px 8px 0;font-size:.95em}' +
    '#bkv .toc{list-style:none;margin:.3em 0;padding:0}#bkv .toc li{display:flex;align-items:center;gap:.5em;padding:.38em 0;border-bottom:1px dotted rgba(90,50,20,.35)}#bkv .toc .gl{min-width:5.2em;font-size:.8em}#bkv .toc .tn{flex:1;font-style:normal;font-size:.93em}#bkv .toc .tp{opacity:.6}' +
    '#bkv .al{display:grid;grid-template-columns:1fr 1fr;gap:.5em .8em;margin-top:.4em}#bkv .ai{display:flex;align-items:center;gap:.5em;padding:.4em .5em;background:rgba(120,80,20,.07);border-radius:8px;font-style:normal}#bkv .ai b{font-size:1.4em;color:#7f1d1d;width:1em}#bkv .ai em{opacity:.65;font-size:.8em;margin-left:auto}#bkv .ai .gl{font-size:.8em}' +
    '#bkv .nt{padding-left:1.2em}#bkv .nt li{margin:.6em 0}#bkv .sig{margin-top:1.6em;text-align:right;opacity:.7}' +
    '#bkv .stamp{position:absolute;right:12%;bottom:12%;transform:rotate(-12deg);border:3px solid rgba(127,29,29,.45);color:rgba(127,29,29,.5);font:800 calc(var(--ph)*.05) system-ui,sans-serif;text-align:center;padding:.2em .5em;border-radius:6px;line-height:1.1}' +
    '#bkv .pg.bk{position:relative}' +
    '#bkv .cv{height:100%;background:linear-gradient(135deg,#7f1d1d,#5c1212 70%);border:calc(var(--ph)*.012) solid #4a0f0f;border-radius:4px 10px 10px 4px;box-shadow:inset 0 0 60px rgba(0,0,0,.5);position:relative;text-align:center;color:#e9c46a;font-family:Georgia,serif}' +
    '#bkv .cv.back{background:linear-gradient(225deg,#7f1d1d,#5c1212 70%);border-radius:10px 4px 4px 10px}' +
    '#bkv .cvt{margin-top:22%;font:800 calc(var(--ph)*.075)/1.1 Georgia,serif;letter-spacing:.06em;text-shadow:0 2px 0 rgba(0,0,0,.45)}' +
    '#bkv .cvl{height:2px;width:55%;margin:8% auto;background:linear-gradient(90deg,transparent,#e9c46a,transparent)}' +
    '#bkv .cvs{font-style:italic;font-size:calc(var(--ph)*.03);opacity:.9}#bkv .cvb{position:absolute;bottom:9%;left:0;right:0;letter-spacing:.35em;font:700 calc(var(--ph)*.026) system-ui,sans-serif}' +
    '#bkv .nav{position:absolute;top:50%;width:54px;height:54px;margin-top:-27px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(15,10,6,.75);color:#fde68a;font-size:24px;cursor:pointer;z-index:2}#bkv .nav:hover{background:rgba(70,40,12,.9)}#bkv .nav:disabled{opacity:.25;cursor:default}' +
    '#bkv .x{position:absolute;top:16px;right:18px;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(15,10,6,.75);color:#fde68a;font-size:20px;cursor:pointer;z-index:3}' +
    '#bkv .hl{position:absolute;bottom:14px;left:0;right:0;text-align:center;color:#c9b896;font:13px system-ui,sans-serif;pointer-events:none}' +
    '@media(max-width:700px){#bkv .nav{width:42px;height:42px}}';

  function ensure() {
    if (EL) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    EL = document.createElement('div'); EL.id = 'bkv';
    EL.innerHTML = '<div class="wrap"><div class="bk"></div></div><button class="nav" id="bkp" style="left:3%">‹</button><button class="nav" id="bkn" style="right:3%">›</button><button class="x" id="bkx">✕</button><div class="hl">← → листать · клик по странице · Esc / E — закрыть</div>';
    try { $('w').appendChild(EL); } catch (e) { document.body.appendChild(EL); }
    EL.addEventListener('click', function (e) {
      var t = e.target;
      if (t.id == 'bkx') return close(); if (t.id == 'bkp') return go(-1); if (t.id == 'bkn') return go(1);
      if (t.classList && t.classList.contains('pl')) return playCode(t.getAttribute('data-c'), t.parentNode);
      var lf = t.closest ? t.closest('.lf') : null; if (lf) { go(lf.classList.contains('fl') ? -1 : 1); return; }
      if (t === EL) close();
    });
    sizeCb = function () {
      var pw = Math.min(window.innerWidth * .46, (window.innerHeight * .8) / 1.38), ph = pw * 1.38;
      EL.style.setProperty('--pw', pw + 'px'); EL.style.setProperty('--ph', ph + 'px');
    };
    addEventListener('resize', sizeCb); sizeCb();
  }
  function render() {
    pages = build(); N = pages.length / 2; leaves = [];
    var bk = EL.querySelector('.bk'); bk.innerHTML = '';
    for (var i = 0; i < N; i++) {
      var lf = document.createElement('div'); lf.className = 'lf';
      lf.innerHTML = '<div class="fc">' + pages[i * 2] + '</div><div class="bc">' + pages[i * 2 + 1] + '</div>';
      bk.appendChild(lf); leaves.push(lf);
    }
    cur = 0; place(true);
  }
  function place(instant) {
    leaves.forEach(function (lf, i) { var f = i < cur; lf.classList.toggle('fl', f); lf.style.zIndex = f ? i : (N - i); });
    var wrap = EL.querySelector('.wrap'), pw = parseFloat(EL.style.getPropertyValue('--pw')) || 300;
    wrap.style.transform = cur == 0 ? 'translateX(' + (-pw / 2) + 'px)' : cur == N ? 'translateX(' + (pw / 2) + 'px)' : 'translateX(0)';
    EL.querySelector('#bkp').disabled = cur == 0; EL.querySelector('#bkn').disabled = cur == N;
  }
  function go(d) {
    var n = Math.max(0, Math.min(N, cur + d)); if (n == cur) return; cur = n;
    try { sfx('place'); } catch (e) { }
    place();
  }

  function playCode(code, host) {
    if (playing) return; playing = 1;
    var gl = host ? host.querySelectorAll('.gl i') : [], seq = String(code).split('');
    try {
      AC = AC || window.__ac || new (window.AudioContext || window.webkitAudioContext)(); window.__ac = AC; if (AC.state == 'suspended') AC.resume();
      var t = AC.currentTime + .08, ms = 80;
      seq.forEach(function (c, i) {
        var dash = !(c == '·' || c == '.'), dur = dash ? .5 : .17, o = AC.createOscillator(), g = AC.createGain();
        o.type = 'square'; o.frequency.value = 780; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + .01); g.gain.setValueAtTime(.12, t + dur - .02); g.gain.linearRampToValueAtTime(0, t + dur);
        o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + .02);
        (function (el, a, b) { setTimeout(function () { el && el.classList.add('on'); }, a); setTimeout(function () { el && el.classList.remove('on'); }, b); })(gl[i], (t - AC.currentTime) * 1000, (t - AC.currentTime + dur) * 1000);
        t += dur + .2;
      });
      setTimeout(function () { playing = 0; }, (t - AC.currentTime) * 1000 + 100);
    } catch (e) { playing = 0; }
  }

  function openB() {
    try { if (typeof mode == 'undefined' || mode != 'play' || PZ) return; } catch (e) { return; }
    ensure(); render(); open = true;
    PZ = 1; try { keys = {}; } catch (e) { }
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) { }
    EL.style.display = 'flex'; sizeCb(); place(true);
  }
  function close() {
    if (!open) return; open = false; EL.style.display = 'none';
    try { if (typeof pauseClose == 'function' && PZ) { pauseClose(); return; } } catch (e) { }
    PZ = 0; try { tryLock(); } catch (e) { }
  }
  addEventListener('keydown', function (e) {
    if (!open) return;
    var c = e.code;
    if (c == 'Escape' || c == 'KeyE' || c == 'KeyQ') { e.preventDefault(); e.stopImmediatePropagation(); close(); }
    else if (c == 'ArrowRight' || c == 'KeyD' || c == 'Space') { e.preventDefault(); e.stopImmediatePropagation(); go(1); }
    else if (c == 'ArrowLeft' || c == 'KeyA') { e.preventDefault(); e.stopImmediatePropagation(); go(-1); }
    else { e.stopImmediatePropagation(); }
  }, true);

  window.__bookview = { open: openB, close: close, isOpen: function () { return open; } };
})();
