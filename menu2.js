/* PC МАСТЕР — menu2.js: новое главное меню и настройки (подключать ПОСЛЕ index.html, pause.js — в самом конце).
   Заменяет разметку меню/настроек, которую рисует UI(); вся логика игры остаётся прежней. */
(function () {
  if (window.__menu2Loaded) return;
  window.__menu2Loaded = 1;
  var BUILD = 'сборка 13.11-K';

  function ready() { try { return typeof UI === 'function' && typeof play === 'function' && typeof cont === 'function' && typeof ld === 'function' && !!document.getElementById('ui'); } catch (e) { return false; } }

  var CSS = '' +
    '.m2{position:absolute;inset:0;display:flex;pointer-events:none;color:#ece8f6;font-family:system-ui,"Segoe UI",sans-serif}' +
    '.m2:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(6,7,14,.92) 0%,rgba(6,7,14,.72) 36%,rgba(6,7,14,.18) 62%,transparent 80%),linear-gradient(0deg,rgba(6,7,14,.7),transparent 30%);pointer-events:none}' +
    '.m2 .lc{position:relative;pointer-events:auto;width:min(480px,46vw);padding:6vh 3.5vw 4vh 5vw;display:flex;flex-direction:column;justify-content:center;gap:0;animation:m2in .7s cubic-bezier(.2,.8,.2,1) both}' +
    '@keyframes m2in{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:none}}' +
    '.m2 .sup{letter-spacing:.55em;font-size:11px;color:#6ee7ff;font-weight:600;margin-bottom:6px}' +
    '.m2 h1{margin:0;font-size:clamp(40px,7.2vw,86px);line-height:.95;letter-spacing:.03em;font-weight:900;background:linear-gradient(95deg,#8af0ff 5%,#c084fc 50%,#f472b6 95%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 6px 24px rgba(110,231,255,.35))}' +
    '.m2 .tag{margin:8px 0 3vh;color:#aeb4c8;font-size:15px;letter-spacing:.04em}' +
    '.m2 .mb{display:flex;align-items:center;gap:14px;width:100%;padding:13px 16px;margin:5px 0;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:inherit;font:inherit;text-align:left;cursor:pointer;transition:transform .18s,background .18s,border-color .18s,box-shadow .18s;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}' +
    '.m2 .mb:hover:not(:disabled){transform:translateX(8px);background:rgba(110,231,255,.12);border-color:rgba(110,231,255,.5);box-shadow:0 8px 28px rgba(0,0,0,.35)}' +
    '.m2 .mb:disabled{opacity:.35;cursor:default}' +
    '.m2 .mb .ic{font-size:22px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:rgba(255,255,255,.07)}' +
    '.m2 .mb b{display:block;font-size:17px;font-weight:700}.m2 .mb small{display:block;color:#98a0b4;font-size:12px;margin-top:1px}' +
    '.m2 .mb.pri{background:linear-gradient(95deg,rgba(34,211,238,.9),rgba(168,85,247,.9));border:0;color:#06080f;box-shadow:0 10px 30px rgba(110,80,255,.35)}.m2 .mb.pri .ic{background:rgba(255,255,255,.3)}.m2 .mb.pri small{color:rgba(6,8,15,.7)}.m2 .mb.pri:hover:not(:disabled){background:linear-gradient(95deg,#4ee3f8,#b86cfb)}' +
    '.m2 .rc{position:absolute;right:3.5vw;top:50%;transform:translateY(-50%);width:min(300px,28vw);pointer-events:auto;display:flex;flex-direction:column;gap:12px;animation:m2in .8s .15s cubic-bezier(.2,.8,.2,1) both}' +
    '.m2 .cd{padding:14px 16px;border-radius:16px;background:rgba(10,13,24,.62);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}' +
    '.m2 .cd h4{margin:0 0 8px;font-size:11px;letter-spacing:.2em;color:#6ee7ff;font-weight:700}' +
    '.m2 .st{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:14px}.m2 .st:last-child{border:0}.m2 .st span{color:#98a0b4}.m2 .st b.bd{color:#f87171}' +
    '.m2 .tp{font-size:13.5px;line-height:1.45;color:#cdd2e2}' +
    '.m2 kbd{display:inline-block;min-width:22px;padding:1px 6px;margin-right:5px;border-radius:6px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);font:600 12px monospace;text-align:center}' +
    '.m2 .kr{font-size:13px;color:#c3c9da;margin:4px 0}' +
    '.m2 .ft{position:absolute;left:5vw;bottom:2.5vh;color:#6e7488;font-size:12px;pointer-events:none}' +
    '.m2 .rot{position:absolute;top:14px;right:16px;pointer-events:auto;padding:8px 12px;border-radius:10px;font-size:13px}' +
    '.m2 .bk{display:inline-flex;align-items:center;gap:6px;margin-top:6px;color:#98a0b4;font-size:13px;background:none;border:0;cursor:pointer;padding:6px 2px}.m2 .bk:hover{color:#fff}' +
    /* настройки */
    '.s2{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:auto;background:radial-gradient(ellipse at 50% 50%,rgba(6,7,14,.5),rgba(6,7,14,.9));color:#ece8f6;font-family:system-ui,sans-serif;animation:m2f .35s both}@keyframes m2f{from{opacity:0}to{opacity:1}}' +
    '.s2 .pn{width:min(860px,94vw);max-height:88vh;overflow:auto;border-radius:20px;padding:22px 26px;background:rgba(12,15,28,.88);border:1px solid rgba(255,255,255,.14);box-shadow:0 30px 80px rgba(0,0,0,.6)}' +
    '.s2 h2{margin:0 0 14px;font-size:28px;letter-spacing:.08em;background:linear-gradient(90deg,#6ee7ff,#c084fc,#f472b6);-webkit-background-clip:text;background-clip:text;color:transparent}' +
    '.s2 .gr{display:grid;grid-template-columns:1fr 1fr;gap:6px 26px}@media(max-width:700px){.s2 .gr{grid-template-columns:1fr}}' +
    '.s2 h5{grid-column:1/-1;margin:14px 0 2px;font-size:11px;letter-spacing:.22em;color:#6ee7ff}' +
    '.rw{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:11px;background:rgba(255,255,255,.04);cursor:pointer;transition:background .15s;font-size:14.5px}.rw:hover{background:rgba(110,231,255,.1)}' +
    '.rw .v{color:#98a0b4;font-size:13px}.sw{width:42px;height:23px;border-radius:99px;background:rgba(255,255,255,.18);position:relative;transition:background .2s;flex:none}.sw:after{content:"";position:absolute;top:3px;left:3px;width:17px;height:17px;border-radius:50%;background:#fff;transition:transform .2s}.sw.on{background:linear-gradient(90deg,#22d3ee,#a855f7)}.sw.on:after{transform:translateX(19px)}' +
    '.s2 .ac{display:flex;gap:10px;margin-top:18px;justify-content:space-between}.s2 .bn{padding:11px 20px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.07);color:inherit;font:inherit;cursor:pointer}.s2 .bn:hover{background:rgba(255,255,255,.14)}.s2 .bn.pr2{background:linear-gradient(90deg,#22d3ee,#a855f7);border:0;color:#06080f;font-weight:700}.s2 .bn.dg{color:#fca5a5;border-color:rgba(248,113,113,.4)}' +
    '@media(max-width:820px){.m2 .rc{display:none}.m2 .lc{width:100%}.m2:before{background:linear-gradient(90deg,rgba(6,7,14,.9),rgba(6,7,14,.55))}}';

  function go() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var TIPS = ['Книга на верстаке расскажет, что значат писки неисправных компьютеров.', 'Свет погас? Ищи ключ от щитка — он блестит в темноте.', 'Клиенту не нужен ПК? Откажи клавишей Q — иногда это выгоднее.', 'Чистка от пыли и новая термопаста обходятся без деталей.', 'Держи на складе запас блоков питания и памяти — ремонт идёт быстрее.', 'Старые здания хранят секреты… иногда стены обваливаются.'];
    var tip = TIPS[Math.floor(Math.random() * TIPS.length)];
    function M0(n) { try { return M(n); } catch (e) { return '$' + Math.round(n); } }
    function mb(ic, t, s, js, cls, dis) { return '<button class="mb ' + (cls || '') + '" ' + (dis ? 'disabled' : '') + ' onclick="' + js + '"><span class="ic">' + ic + '</span><span><b>' + t + '</b><small>' + s + '</small></span></button>'; }

    function menuHTML() {
      var s = null; try { s = ld(); } catch (e) { }
      var h = '<div class="m2"><div class="lc"><div class="sup">СИМУЛЯТОР</div><h1>PC<br>МАСТЕР</h1><div class="tag">С нуля до империи</div>' +
        mb('▶', 'Новая игра', 'начать с долгом и пустой мастерской', 'play()', 'pri') +
        mb('⏵', 'Продолжить', s ? 'день ' + (s.day || 1) + ' · ' + M0(s.m || 0) : 'нет сохранений', 'cont()', '', !s) +
        mb('🧪', 'Песочница', 'свободная игра без ограничений', 'sandbox()') +
        mb('⚙', 'Настройки', 'звук, графика, управление', "mode='set';UI()") + '</div>' +
        '<div class="rc">' +
        (s ? '<div class="cd"><h4>ТВОЯ МАСТЕРСКАЯ</h4><div class="st"><span>День</span><b>' + (s.day || 1) + ' / 30</b></div><div class="st"><span>Деньги</span><b>' + M0(s.m || 0) + '</b></div><div class="st"><span>Долг</span><b class="bd">' + M0(s.debt || 0) + '</b></div></div>' : '<div class="cd"><h4>КАК НАЧАТЬ</h4><div class="tp">Ты вернулся в мастерскую, которая должна деньги. Собирай и чини компьютеры, продавай клиентам, возвращай долг до 30-го дня.</div></div>') +
        '<div class="cd"><h4>УПРАВЛЕНИЕ</h4><div class="kr"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> ходить</div><div class="kr"><kbd>E</kbd> взять / использовать</div><div class="kr"><kbd>Q</kbd> отказать · <kbd>Esc</kbd> пауза</div></div>' +
        '<div class="cd"><h4>СОВЕТ</h4><div class="tp">' + tip + '</div></div></div>' +
        '<button class="b rot" onclick="flip=-flip;rs()">⟲ Повернуть вид</button><div class="ft">' + BUILD + ' · F8 — реализм</div></div>';
      document.getElementById('ui').innerHTML = h;
    }

    function row(label, val, js, isSw) { return '<div class="rw" onclick="' + js + '"><span>' + label + '</span>' + (isSw ? '<span class="sw ' + (val ? 'on' : '') + '"></span>' : '<span class="v">' + val + '</span>') + '</div>'; }
    window.__m2conf = function () { if (confirm('Стереть сохранение? Это нельзя отменить.')) { try { localStorage.removeItem('pcv3'); localStorage.removeItem('pcv3sb'); } catch (e) { } UI(); } };
    function setHTML() {
      var MS = [.5, .75, 1, 1.5, 2], mi = MS.indexOf(opt.ms || 1);
      var rz = window.__rz, lk = window.__look, md = window.__mood;
      var h = '<div class="s2"><div class="pn"><h2>НАСТРОЙКИ</h2><div class="gr">' +
        '<h5>ЗВУК</h5>' + row('Звуки', opt.s, 'opt.s=!opt.s;UI()', 1) + row('Озвучка героя', opt.v, 'opt.v=!opt.v;UI()', 1) +
        '<h5>УПРАВЛЕНИЕ</h5>' + row('Чувствительность мыши', '× ' + (opt.ms || 1), 'opt.ms=[.5,.75,1,1.5,2][' + ((mi + 1) % 5) + '];UI()') + row('Инверсия оси Y', opt.inv, 'opt.inv=!opt.inv;UI()', 1) + row('Плавная камера', opt.sm, 'opt.sm=opt.sm?0:1;UI()', 1) +
        '<h5>ГРАФИКА</h5>' + row('Высокое качество', opt.q, 'opt.q=!opt.q;rs();UI()', 1) + row('Ультра-отражения', opt.ul !== 0, 'opt.ul=opt.ul===0?1:0;UI()', 1) + row('Свечение неона', opt.bl !== 0, 'opt.bl=opt.bl===0?1:0;UI()', 1) + row('Размытие при повороте', opt.mb !== 0, 'opt.mb=opt.mb===0?1:0;UI()', 1) +
        (window.__tqapi ? row('Качество текстур', window.__tqapi.name(), 'window.__tqapi.cycle();UI()') : '') + (rz ? row('Реализм (тени)', rz.name(), 'window.__rz.cycle();UI()') : '') + (window.__batch ? row('Объединение объектов (бета)', window.__batch.get(), 'window.__batch.toggle();UI()', 1) : '') + (lk ? row('Красота (паркет, лучи)', lk.get(), 'window.__look.toggle();UI()', 1) : '') + (window.__style ? row('Аниме-стиль (как MiSide)', window.__style.get(), 'window.__style.toggle();UI()', 1) : '') + (md ? row('Атмосфера (мрак, зерно)', md.get(), 'window.__mood.toggle();UI()', 1) : '') +
        '</div><div class="ac"><button class="bn dg" onclick="__m2conf()">Стереть сохранение</button><button class="bn pr2" onclick="mode=\'menu\';UI()">Назад</button></div></div></div>';
      document.getElementById('ui').innerHTML = h;
    }

    var _UI = UI;
    UI = function () {
      var r = _UI.apply(this, arguments);
      try { if (mode == 'menu') menuHTML(); else if (mode == 'set') setHTML(); } catch (e) { console.error('[menu2]', e); }
      return r;
    };
    try { UI(); } catch (e) { }
    console.log('[menu2] готово');
  }

  if (ready()) go(); else { var n = 0, iv = setInterval(function () { if (ready()) { clearInterval(iv); go(); } else if (++n > 300) clearInterval(iv); }, 100); }
})();
