/* PC МАСТЕР — orders.js (подключать ПОСЛЕ blackout.js)
   • Клиент, подойдя к стойке, САМ говорит, что ему нужно. [E] — согласиться, [Q] — отказать.
     (То же [E]/[Q] теперь работает и в разговоре с Виктором: «Отдать» / «Не отдавать».)
   • Новый вид заказов — РЕМОНТ ПК. Клиент оставляет сломанный ПК на верстаке слева:
     осмотри его [E] (диагностика), поставь нужную деталь из своего запаса (или почисти/смени пасту),
     потом вернись к клиенту [E] — он заплатит за работу и деталь. */
(function () {
  if (window.__ordersLoaded) return; window.__ordersLoaded = 1;
  function ready() { try { return typeof THREE !== 'undefined' && !!scene && typeof talk === 'function' && typeof spawn === 'function' && typeof serve === 'function' && typeof tickCU === 'function' && typeof G !== 'undefined' && !!window.__blackoutLoaded; } catch (e) { return false; } }
  function safe(f) { try { return f(); } catch (e) { console.error('[orders]', e); } }
  function go() {
    /* код — буква азбуки Морзе: · точка (короткий писк), − тире (длинный) */
    var FAULTS = [
      { k: 'dust', code: '−··', L: 'D', t: 'Шумит и сильно перегревается', n: 'Перегрев: забит пылью', sol: 'Почистить ПК от пыли.', need: -1, fee: [35, 70], work: 'Продуваю и чищу от пыли…' },
      { k: 'paste', code: '−', L: 'T', t: 'Греется под нагрузкой и троттлит', n: 'Перегрев: высохла термопаста', sol: 'Заменить термопасту.', need: -1, fee: [30, 60], work: 'Снимаю кулер, меняю термопасту…' },
      { k: 'psu', code: '·−−·', L: 'P', t: 'Вообще не включается', n: 'Неисправен блок питания', sol: 'Заменить блок питания.', need: 6, fee: [40, 80], work: 'Меняю блок питания…' },
      { k: 'ram', code: '·−·', L: 'R', t: 'Синие экраны и зависания', n: 'Ошибка оперативной памяти', sol: 'Заменить планку памяти.', need: 4, fee: [35, 70], work: 'Меняю оперативную память…' },
      { k: 'gpu', code: '−−·', L: 'G', t: 'Нет картинки, на экране артефакты', n: 'Ошибка видеокарты', sol: 'Заменить видеокарту.', need: 5, fee: [50, 100], work: 'Меняю видеокарту…' },
      { k: 'cool', code: '−·−', L: 'K', t: 'Греется, вентилятор на процессоре стоит', n: 'Не вращается вентилятор процессора', sol: 'Заменить кулер.', need: 3, fee: [35, 70], work: 'Меняю кулер…' },
      { k: 'cpu', code: '−·−·', L: 'C', t: 'Не стартует, постоянные перезагрузки', n: 'Ошибка процессора', sol: 'Заменить процессор.', need: 2, fee: [60, 110], work: 'Меняю процессор и пасту…' },
      { k: 'mb', code: '−−', L: 'M', t: 'Не запускается, иногда искрит', n: 'Ошибка материнской платы', sol: 'Заменить материнскую плату.', need: 1, fee: [60, 120], work: 'Меняю материнскую плату…' }
    ];
    function rnd2(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
    function money(n) { try { return M(n); } catch (e) { return '$' + Math.round(n); } }
    var JOB = null;                                   // текущий ремонт: {c, f, g, fee, conn, on, fixed, mon, scr, ...}

    /* ---------- [E]/[Q] в разговоре с вариантами ---------- */
    var _talk = talk;
    talk = function (lines, cb, opts) {
      if (opts && opts.length && opts.length <= 2) opts = opts.map(function (o, i) { return [(/^\[[EQ]\]/.test(o[0]) ? '' : (i ? '[Q] ' : '[E] ')) + o[0], o[1]]; });
      else if (opts && opts.length > 2) opts = opts.map(function (o, i) { return [(/^\[\d\]/.test(o[0]) ? '' : '[' + (i + 1) + '] ') + o[0], o[1]]; });
      return _talk.call(this, lines, cb, opts);
    };
    addEventListener('keydown', function (e) {
      if (e.repeat || mode != 'talk' || !TK || !TK.o || TK.o.length > 2) return;
      if (TK.i != TK.l.length - 1) return;
      if (e.code == 'KeyE' && TK.o[0]) { e.preventDefault(); tpick(0); }
      else if (e.code == 'KeyQ' && TK.o[1]) { e.preventDefault(); tpick(1); }
    });
    addEventListener('keydown', function (e) {
      if (e.repeat || mode != 'talk' || !TK || !TK.o || TK.o.length < 3 || TK.i != TK.l.length - 1) return;
      var m = /^(Digit|Numpad)([1-9])$/.exec(e.code); if (m && TK.o[+m[2] - 1]) { e.preventDefault(); tpick(+m[2] - 1); }
    });

    /* ---------- клиенты: тип заказа ---------- */
    var _spawn = spawn;
    spawn = function () {
      var n0 = CU.length; _spawn.apply(this, arguments);
      safe(function () {
        if (CU.length > n0) {
          var c = CU[CU.length - 1], first = G.sold == 0;
          c.kind = 'buy';
          if (!first && !JOB && G.sold >= 1 && !CU.some(function (x) { return x.kind == 'repair'; }) && Math.random() < .4) {
            c.kind = 'repair'; c.fault = FAULTS[rnd2(0, FAULTS.length - 1)]; c.fee = rnd2(c.fault.fee[0], c.fault.fee[1]);
          }
          c.first = first;
        }
      });
    };

    function leaveC(c) { c.s = 'out'; try { c.mk.visible = false; } catch (e) { } }

    function ask(c) {
      c.asked = 1;
      if (c.kind == 'repair') {
        var f = c.fault;
        talk([[c.name, 'Здравствуйте! У меня проблема с ПК: ' + f.t.toLowerCase() + '.'], [c.name, 'Починишь? Заплачу за работу и за деталь, если потребуется.']], null, [
          ['Беру в ремонт', function () { acceptRepair(c); }],
          ['Отказать', function () { toast(c.name + ' ушёл ни с чем.'); say('Извините, сейчас не могу.'); leaveC(c); }]
        ]);
      } else {
        var need = 'ПК от ' + money(c.min) + (c.br ? ', видеокарта ' + c.br : '');
        var o = [['Подберу', function () { c.acc = 1; toast('Когда ПК будет готов — подойди к клиенту и нажми [E].'); }]];
        if (!c.first) o.push(['Отказать', function () { toast('Вы отказали клиенту ' + c.name + '.'); say('Извините, сейчас нет.'); leaveC(c); }]);
        talk([[c.name, 'Здравствуйте! Мне нужен ' + need + '.'], [c.name, c.first ? 'Первый свой компьютер хочу. Поможете?' : 'Найдётся что-нибудь подходящее?']], null, o);
      }
    }

    var _serve = serve;
    serve = function (c) {
      if (c.s != 'wait') return;
      if (!c.asked) { ask(c); return; }
      if (c.kind == 'repair') { return repairReturn(c); }
      return _serve.apply(this, arguments);
    };

    /* автоматически: клиент у стойки заговаривает */
    setInterval(function () {
      safe(function () {
        if (!G || mode != 'play' || (typeof PZ !== 'undefined' && PZ) || (typeof CALL !== 'undefined' && CALL) || A.lock || TK) return;
        var c = CU.find(function (x) { return x.s == 'wait' && !x.asked && x.kind; });
        if (c) ask(c);
      });
    }, 500);

    /* ---------- РЕМОНТ ---------- */
    var SPOT = { x: -1.5, y: 2.16, z: -5.6 }, MON = { x: -2.55, z: -5.6 };

    /* ---- звук: сигналы азбукой Морзе ---- */
    var AC2 = null;
    function ac() { try { if (!AC2) AC2 = new (window.AudioContext || window.webkitAudioContext)(); if (AC2.state == 'suspended') AC2.resume(); } catch (e) { } return AC2; }
    function beepAt(t, d) {
      var A2 = ac(); if (!A2 || !opt.s) return;
      var o = A2.createOscillator(), g = A2.createGain(), v = .07 * (typeof window.__vol == 'number' ? window.__vol : 1);
      o.type = 'square'; o.frequency.value = 780; o.connect(g); g.connect(A2.destination);
      var t0 = A2.currentTime + t; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + .01); g.gain.setValueAtTime(v, t0 + d - .02); g.gain.linearRampToValueAtTime(0, t0 + d);
      o.start(t0); o.stop(t0 + d + .02);
    }
    var LEDT = [];
    function playCode(code, reps, j) {                 // возвращает длительность, сек
      var t = 0, DOT = .17, DASH = .5, GAP = .17, k, i;
      LEDT.forEach(clearTimeout); LEDT = [];
      for (k = 0; k < reps; k++) {
        for (i = 0; i < code.length; i++) {
          var d = code[i] == '·' ? DOT : DASH; beepAt(t, d);
          (function (on, off) {
            LEDT.push(setTimeout(function () { if (j && j.mk) j.mk.material.color.setHex(0xfef08a); }, on * 1000));
            LEDT.push(setTimeout(function () { if (j && j.mk) j.mk.material.color.setHex(j.fixed ? 0x22c55e : 0x7f1d1d); }, off * 1000));
          })(t, t + d);
          t += d + GAP;
        }
        t += .85;
      }
      return t;
    }

    /* ---- монитор ---- */
    function mkScreenTex() {
      var c = document.createElement('canvas'); c.width = 256; c.height = 160; var tx = new THREE.CanvasTexture(c); return { c: c, tx: tx };
    }
    function paintScreen(j, kind) {
      var c = j.scr.c, x = c.getContext('2d'), W = c.width, H = c.height;
      x.fillStyle = kind == 'off' ? '#050607' : kind == 'err' ? '#0b1020' : kind == 'ok' ? '#06220f' : '#0a1b3a'; x.fillRect(0, 0, W, H);
      x.textAlign = 'center'; x.textBaseline = 'middle';
      function tx(t, y, col, fs) { x.fillStyle = col; x.font = 'bold ' + fs + 'px sans-serif'; x.fillText(t, W / 2, y); }
      if (kind == 'nosig') { tx('НЕТ СИГНАЛА', H / 2 - 8, '#e2e8f0', 22); tx('нажми [E] на ПК — включить', H / 2 + 24, '#94a3b8', 13); }
      else if (kind == 'err') { tx('POST ERROR', 46, '#f87171', 26); tx('Система не загрузилась', 84, '#e2e8f0', 15); tx('Слушай сигналы ПК и', 112, '#fde68a', 14); tx('смотри в справочник', 130, '#fde68a', 14); }
      else if (kind == 'ok') { tx('✓ ПК ИСПРАВЕН', 60, '#4ade80', 24); tx('Система загружается…', 100, '#bbf7d0', 15); }
      else if (kind == 'on') { tx('ЗАГРУЗКА…', H / 2, '#93c5fd', 20); }
      j.scr.tx.needsUpdate = true;
    }
    function buildMonitor(j) {
      var m = new THREE.Group(), s = mkScreenTex(); j.scr = s;
      var dark = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: .5, metalness: .3 });
      function B2(w, h, d, x, y, z) { var o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), dark); o.position.set(x, y, z); o.castShadow = true; m.add(o); return o; }
      B2(.5, .04, .3, 0, .02, 0); B2(.07, .34, .06, 0, .21, -.02); B2(.9, .56, .05, 0, .6, 0);
      var sc = new THREE.Mesh(new THREE.PlaneGeometry(.82, .48), new THREE.MeshBasicMaterial({ map: s.tx })); sc.position.set(0, .6, .03); m.add(sc);
      m.position.set(MON.x, 1.67, MON.z); m.rotation.y = .25; scene.add(m); j.mon = m; paintScreen(j, 'off'); return m;
    }
    function addCable(j, done) {
      var pts = [[MON.x + .12, 1.7, MON.z - .1], [MON.x + .35, 1.69, MON.z + .35], [SPOT.x - .75, 1.69, SPOT.z + .5], [SPOT.x - .5, 1.95, SPOT.z + .15]].map(function (a) { return new THREE.Vector3(a[0], a[1], a[2]); });
      var geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, .018, 6, false), cb = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x0b0b0e, roughness: .6 }));
      scene.add(cb); j.cable = cb; var n = geo.index.count; geo.setDrawRange(0, 0);
      try { sfx('cable'); } catch (e) { }
      tw(1.3, function (u) { geo.setDrawRange(0, Math.floor(n * u / 3) * 3); }, function () { geo.setDrawRange(0, n); done && done(); });
    }

    function buildPC() {
      var p = { n: 'ПК клиента', v: rnd2(250, 900), gb: ['NVIDIA', 'AMD'][rnd2(0, 1)], cb: ['AMD', 'Intel'][rnd2(0, 1)] };
      var g;
      try { g = window.mkShowPC(p); } catch (e) { g = PB[0](CAT[0][1]); }
      g.scale.setScalar(.213); g.position.set(SPOT.x, SPOT.y, SPOT.z); g.rotation.y = .12;
      g.traverse(function (o) { if (o.userData && o.userData.fan) o.userData.on = 0; });      // сломан: вентиляторы стоят
      scene.add(g); return g;
    }
    function marker(col) {
      var m = new THREE.Mesh(new THREE.SphereGeometry(.38, 16, 12), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .8, depthWrite: false }));
      m.position.set(0, 2.9, 1.0); return m;
    }
    function acceptRepair(c) {
      if (JOB) { toast('Верстак для ремонта занят.'); leaveC(c); return; }
      var g = buildPC(), mk = marker(0x7f1d1d); g.add(mk);
      JOB = { c: c, f: c.fault, g: g, fee: c.fee, conn: 0, on: 0, fixed: 0, mk: mk, busy: 0 };
      buildMonitor(JOB);
      g.userData.act = function () { repairAct(); };
      c.t = Math.max(c.t, 300); c.rep = 1;
      try { sfx('put'); } catch (e) { }
      toast('ПК клиента — на верстаке слева, рядом монитор. Подключи ПК к монитору — нажми [E] на ПК.');
      say('Хорошо, посмотрим.');
    }
    function findPart(cl) {
      if (typeof hand !== 'undefined' && hand && hand.c == cl) return hand;
      return G.st.find(function (x) { return x.c == cl && !x.pl && !x.h && !x.fl; }) || null;
    }
    function consume(x) {
      var i = G.st.indexOf(x); if (i >= 0) G.st.splice(i, 1);
      if (hand === x) { try { setHand(null); } catch (e) { hand = null; } }
      try { shelf(); } catch (e) { }
    }
    var PARTN = { 6: 'Блок питания', 4: 'Оперативная память', 5: 'Видеокарта', 3: 'Кулер процессора', 2: 'Процессор', 1: 'Материнская плата' };

    function repairAct() {
      if (!JOB || JOB.busy || A.lock) return;
      var j = JOB;
      if (j.fixed) { toast('Починено. Клиент ждёт у стойки — поговори с ним [E].'); return; }
      if (!j.conn) {
        j.busy = 1; toast('Подключаю ПК к монитору…');
        addCable(j, function () { j.busy = 0; j.conn = 1; paintScreen(j, 'nosig'); toast('Монитор подключён. Теперь включи ПК — нажми [E] на ПК.'); });
        return;
      }
      if (!j.on) { j.on = 1; powerOn(j); return; }
      if (j.beeping) { toast('Слушай сигнал…'); return; }
      menuMain(j);
    }
    function powerOn(j) {
      try { sfx('power'); } catch (e) { }
      j.busy = 1; paintScreen(j, 'on');
      setTimeout(function () {
        if (JOB !== j) return;
        paintScreen(j, 'err'); j.beeping = 1;
        var dur = playCode(j.f.code, 2, j);
        toast('ПК пищит! Это азбука Морзе: · — короткий, — — длинный. Найди в справочнике (красная книга на верстаке справа) решение.');
        setTimeout(function () { if (JOB === j) { j.beeping = 0; j.busy = 0; } }, dur * 1000 + 100);
      }, 1200);
    }
    function menuMain(j) {
      talk([['Верстак', 'ПК подключён и выдаёт ошибку. Что делаем?']], null, [
        ['Прослушать сигнал ещё раз', function () { j.beeping = 1; var d = playCode(j.f.code, 2, j); setTimeout(function () { if (JOB === j) j.beeping = 0; }, d * 1000 + 100); }],
        ['Ремонтировать…', function () { menuAction(j); }],
        ['Отмена', function () { }]
      ]);
    }
    function menuAction(j) {
      talk([['Верстак', 'Что сделать с ПК? (подсказка — в справочнике)']], null, [
        ['Почистить от пыли', function () { attempt(j, 'dust', -1); }],
        ['Заменить термопасту', function () { attempt(j, 'paste', -1); }],
        ['Заменить деталь…', function () { menuPart(j); }],
        ['Назад', function () { menuMain(j); }]
      ]);
    }
    function menuPart(j) {
      var ks = [6, 4, 5, 3, 2, 1];
      talk([['Верстак', 'Какую деталь заменить?']], null, ks.map(function (k) { return [PARTN[k], function () { attempt(j, 'part', k); }]; }).concat([['Назад', function () { menuAction(j); }]]));
    }
    function attempt(j, kind, cl) {
      var f = j.f, right = kind == 'part' ? (f.need == cl) : (f.k == kind);
      if (!right) {
        toast('Не помогло — ПК пищит так же. Сверься со справочником.'); try { sfx('error'); } catch (e) { }
        j.c.t = Math.max(1, j.c.t - 20); return;
      }
      var part = null;
      if (f.need >= 0) {
        part = findPart(f.need);
        if (!part) { toast('Нет детали: ' + CN[f.need].toLowerCase() + '. Купи в маркете (терминал справа), возьми с полки в руки и нажми [E] на ПК.'); try { sfx('error'); } catch (e) { } return; }
      }
      j.busy = 1; A.lock = 1;
      var d0 = part ? D(part) : null;
      try { sfx('screw'); } catch (e) { }
      toast(f.work);
      var g = j.g, y0 = g.position.y;
      tw(f.need >= 0 ? 4 : 5, function (u) { g.position.y = y0 + Math.sin(u * 40) * .006; g.rotation.z = Math.sin(u * 25) * .01; }, function () {
        g.position.y = y0; g.rotation.z = 0; A.lock = 0; j.busy = 0;
        if (part) { j.part = d0; consume(part); }
        j.fixed = 1; j.pay = Math.round(j.fee + (d0 ? d0.p * 1.3 : 0));
        g.traverse(function (o) { if (o.userData && o.userData.fan) o.userData.on = 1; });
        j.mk.material.color.setHex(0x22c55e);
        paintScreen(j, 'ok'); try { sfx('power'); } catch (e) { } beepAt(0, .15);
        toast('Готово! ПК загрузился с одним коротким сигналом. Подойди к клиенту [E] — он заплатит ' + money(j.pay) + '.');
        say('Работает!'); try { save(); } catch (e) { }
      });
    }

    /* ---- справочник мастера ---- */
    function bookHTML() {
      var h = '<div style="text-align:left;font-size:13.5px;line-height:1.35;max-height:62vh;overflow:auto">' +
        '<div style="opacity:.8;margin-bottom:6px">При запуске неисправный ПК пищит азбукой Морзе: <b>·</b> — короткий писк, <b>—</b> — длинный. Сигнал повторяется дважды.</div>' +
        '<table style="border-collapse:collapse;width:100%">';
      FAULTS.forEach(function (f) {
        h += '<tr style="border-top:1px solid rgba(255,255,255,.15)"><td style="padding:4px 8px 4px 0;white-space:nowrap;font-family:monospace;font-size:18px;color:#fde68a">' + f.code.split('').join(' ') + '</td>' +
          '<td style="padding:4px 8px"><b>' + f.n + '</b></td><td style="padding:4px 0;opacity:.9">→ ' + f.sol + '</td></tr>';
      });
      return h + '</table><div style="opacity:.7;margin-top:6px">Один короткий сигнал — ПК исправен. Если ремонт не помог — сигнал не изменится.</div></div>';
    }
    function openBook() {
      talk([['📖 Справочник мастера — звуковые сигналы', bookHTML()]], null, [['Закрыть книгу', function () { }]]);
    }
    var _say = say; say = function (t) { if (/<[a-z]/i.test(String(t))) return; return _say.apply(this, arguments); };
    var book = new THREE.Group();
    (function () {
      var cover = new THREE.MeshStandardMaterial({ color: 0x9f1239, roughness: .6 }), pg = new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: .9 });
      var b1 = new THREE.Mesh(new THREE.BoxGeometry(.62, .07, .46), cover); b1.position.y = .035; book.add(b1);
      var b2 = new THREE.Mesh(new THREE.BoxGeometry(.58, .04, .42), pg); b2.position.set(.01, .045, 0); book.add(b2);
      var b3 = new THREE.Mesh(new THREE.BoxGeometry(.62, .02, .46), cover); b3.position.y = .075; book.add(b3);
      try { var l = lp(book, 'СПРАВОЧНИК', .5, .1, 0, .088, 0, '#fde68a', null); l.rotation.x = -Math.PI / 2; var l2 = lp(book, '· — · —', .4, .08, 0, .088, .12, '#fff', null); l2.rotation.x = -Math.PI / 2; } catch (e) { }
      var hit = new THREE.Mesh(new THREE.BoxGeometry(.9, .5, .7), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.position.y = .2; book.add(hit);
      book.position.set(2.3, 1.67, -4.5); book.rotation.y = -.3; book.userData.act = openBook; scene.add(book);
    })();

    function repairReturn(c) {
      if (!JOB || JOB.c !== c) { toast(c.name + ': «Спасибо, что приняли!»'); return; }
      var j = JOB;
      if (!j.fixed) { toast(c.name + ': «Ну как там мой ПК? Он на верстаке слева.»'); return; }
      talk([[c.name, 'Отлично, работает! Сколько с меня?'], ['Ты', 'За работу' + (j.part ? ' и деталь «' + j.part.n + '»' : '') + ' — ' + money(j.pay) + '.']], null, [
        ['Принять оплату', function () {
          G.m += j.pay; G.fixed = (G.fixed || 0) + 1;
          clear(); leaveC(c);
          toast(c.name + ': «Спасибо!» Ремонт: +' + money(j.pay) + (j.part ? ' (деталь ' + money(j.part.p) + ' окупилась)' : ''));
          try { sfx('sell'); hud(); save(); } catch (e) { }
        }],
        ['Скидка 20%', function () {
          var p2 = Math.round(j.pay * .8); G.m += p2; G.fixed = (G.fixed || 0) + 1;
          clear(); leaveC(c);
          toast(c.name + ': «Вот это сервис!» Ремонт: +' + money(p2));
          try { sfx('sell'); hud(); save(); } catch (e) { }
        }]
      ]);
    }
    /* если клиент ушёл (устал ждать) — ПК возвращается хозяину */
    setInterval(function () {
      safe(function () {
        if (JOB && (JOB.c.s == 'out' || JOB.c.done) && !JOB.busy) {
          if (!JOB.fixed || JOB.c.done) { var msg = JOB.fixed ? '' : 'Клиент устал ждать и забрал ПК.'; clear(); if (msg) toast(msg); }
        }
      });
    }, 700);
    function clear() { if (JOB) { try { LEDT.forEach(clearTimeout); if (JOB.mon) scene.remove(JOB.mon); if (JOB.cable) scene.remove(JOB.cable); } catch (e) { } try { JOB.g.traverse(function (o) { var i = FN.indexOf(o); if (i >= 0) FN.splice(i, 1); }); scene.remove(JOB.g); } catch (e) { } JOB = null; } }
    var _sp = startPlay; startPlay = function () { clear(); return _sp.apply(this, arguments); };
    var _nx = next; next = function () { clear(); return _nx.apply(this, arguments); };
    var _tm = toMenu; toMenu = function () { clear(); return _tm.apply(this, arguments); };
    window.__orders = { faults: FAULTS, job: function () { return JOB; } };
    console.log('[orders] готово');
  }
  if (ready()) go(); else { var n = 0, iv = setInterval(function () { if (ready()) { clearInterval(iv); setTimeout(go, 300); } else if (++n > 600) clearInterval(iv); }, 100); }
})();
