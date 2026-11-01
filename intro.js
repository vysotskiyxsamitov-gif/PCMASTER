/* PC МАСТЕР — вступление: герой осматривает магазин, ему звонит Виктор.
   Телефон достаётся из кармана, звонок можно принять или сбросить. Дальше — сцена с коллекторами (startBeat). */
var CALL = null, PHN = null, PHC = null, PHX = null;

var CK_LOOK = [[0, 0, -.3], [1.2, 0, -.3], [3, .95, -.2], [5.2, .95, -.2], [6.4, .4, -.26], [8, -.8, -.14], [10, -.8, -.14], [11.6, -.3, -.35], [13.2, 0, -.3], [14.4, 0, -.3]];
var CK_BUZZ = [[0, 0, -.3], [.45, -.1, -.42], [1.1, -.4, -.95], [2.3, -.4, -.95], [3.2, -.1, -.5]];
var CK_RING = [[0, -.1, -.5], [99, -.1, -.5]];
var CK_ANS = [[0, -.1, -.5], [1.3, .1, -.3], [4, .12, -.28], [7, .4, -.2], [10, .05, -.3], [13, -.3, -.12], [16, -.05, -.28], [18, 0, -.3], [19.6, 0, -.3]];
var CK_DEC = [[0, -.1, -.5], [2.2, -.1, -.5], [3, -.3, -.9], [4.6, -.3, -.9], [5.8, 0, -.3], [7.4, 0, -.3]];
var CK_OUT = [[0, 0, -.3], [9, 0, -.3]];

var CALL_LOOK_END = 14.4, CALL_ANS_END = 18.6, CALL_OUT_LEN = 1.3, CALL_DEC_END = 7.4;
var CALL_SUBS = {
  look: [[.8, 'N', 'Раньше у тебя была сеть магазинов компьютеров. Куча точек по городу. Дела шли отлично.'],
         [7.4, 'N', 'Но однажды ты взял в долг у серьёзного человека — десять тысяч долларов. И не отдал.']],
  buzz: [[1.5, 'Y', 'Опять звонят… В такой час?']],
  ans: [[.9, 'V', 'Ну здравствуй. Знаешь, зачем я звоню?'],
        [4, 'Y', 'Виктор… я как раз собирался тебе позвонить.'],
        [7.6, 'V', 'Десять тысяч. Ты обещал вернуть их месяц назад.'],
        [11.5, 'Y', 'Мне нужно ещё немного времени…'],
        [14.1, 'V', 'Времени больше нет. Мои люди уже у твоего магазина.']],
  dec: [[.4, 'Y', 'Не сегодня.'],
        [3.6, 'S', 'Зря не берёшь трубку. Мы уже у твоего магазина.']]
};

/* позы телефона в системе координат камеры: [x, y, z, поворот x, y, z] */
var PH_HID = [.38, -1.55, -.95, -.25, 0, .2];
var PH_RD = [.16, -.24, -.86, -.55, 0, .03];
var PH_EAR = [.6, .06, -.42, -.12, -.8, -.3];

function lerpP(a, b, u) { return a.map(function (v, i) { return v + (b[i] - v) * u; }); }
function clamp01(u) { return Math.min(1, Math.max(0, u)); }

function sayP(t, p, r) {
  if (!opt.v || !window.speechSynthesis) return;
  try {
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(t);
    u.lang = 'ru-RU'; u.pitch = p; u.rate = r;
    speechSynthesis.speak(u);
  } catch (e) {}
}

function callSub(w, txt) {
  var e = $('sub');
  var nm = w == 'V' ? ['Виктор', '#f87171'] : w == 'S' ? ['SMS · Виктор', '#f87171'] : w == 'Y' ? ['Ты', '#6ee7ff'] : null;
  e.innerHTML = (nm ? '<b style="color:' + nm[1] + '">' + nm[0] + ':</b> ' : '') + txt;
  e.style.display = 'block';
  if (CALL) CALL.subT = Math.max(2.6, txt.length * .075);
  if (w == 'V' || w == 'S') { if (w == 'V') sayP(txt, .5, .92); } else say(txt);
}

/* ---------- телефон ---------- */
function drawPhone(st, tt) {
  var c = PHC, x = c.getContext('2d'), W = c.width, H = c.height;
  x.fillStyle = '#05070c'; x.fillRect(0, 0, W, H);
  if (st != 'off') {
    var g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1c2540'); g.addColorStop(1, '#0b0f1a');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.textAlign = 'center';
    x.fillStyle = '#9aa4b8'; x.font = '16px sans-serif'; x.fillText('21:47', W / 2, 26);
    var pl = st == 'ring' ? (Math.sin(tt * 6) * .5 + .5) : 0;
    x.strokeStyle = 'rgba(110,231,255,' + (.15 + .35 * pl) + ')'; x.lineWidth = 3;
    x.beginPath(); x.arc(W / 2, 120, 44 + pl * 8, 0, 7); x.stroke();
    x.fillStyle = '#334155'; x.beginPath(); x.arc(W / 2, 120, 40, 0, 7); x.fill();
    x.fillStyle = '#e5e7eb'; x.font = 'bold 40px sans-serif'; x.textBaseline = 'middle'; x.fillText('В', W / 2, 122); x.textBaseline = 'alphabetic';
    x.font = 'bold 26px sans-serif'; x.fillStyle = '#fff'; x.fillText('Виктор', W / 2, 200);
    x.font = '14px sans-serif'; x.fillStyle = '#9aa4b8';
    x.fillText(st == 'ring' ? 'кредитор · входящий вызов' : 'идёт разговор', W / 2, 224);
    var btn = function (cx, cy, col, kind, lb) {
      x.fillStyle = col; x.beginPath(); x.arc(cx, cy, 26, 0, 7); x.fill();
      x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.lineWidth = 4; x.lineCap = 'round';
      if (kind == 'x') { x.beginPath(); x.moveTo(cx - 9, cy - 9); x.lineTo(cx + 9, cy + 9); x.moveTo(cx + 9, cy - 9); x.lineTo(cx - 9, cy + 9); x.stroke(); }
      else { x.save(); x.translate(cx, cy); x.rotate(-.7); x.fillRect(-4, -13, 8, 26); x.fillRect(-12, -13, 24, 7); x.fillRect(-12, 6, 24, 7); x.restore(); }
      if (lb) { x.font = '13px sans-serif'; x.fillStyle = '#cbd5e1'; x.fillText(lb, cx, cy + 46); }
    };
    if (st == 'ring') { btn(W * .27, 320, '#ef4444', 'x', 'Сброс'); btn(W * .73, 320, '#22c55e', 'p', 'Ответ'); }
    else btn(W / 2, 320, '#ef4444', 'x', '');
  }
  PHX.needsUpdate = true;
}

function phoneBuild() {
  var g = new THREE.Group();
  bx(g, .37, .75, .05, 0x15171c, 0, 0, 0, 0, .35, .6);
  bx(g, .355, .735, .012, 0x050507, 0, 0, .027, 0, .2, .2);
  var sc = new THREE.Mesh(new THREE.PlaneGeometry(.32, .69), new THREE.MeshBasicMaterial({ map: PHX }));
  sc.position.z = .034; g.add(sc);
  bx(g, .014, .1, .02, 0x2a2d35, .19, .18, 0);
  // рука: пальцы на правом ребре, большой палец слева внизу, предплечье уходит вниз за кадр
  for (var i = 0; i < 3; i++) bx(g, .09, .07, .07, SK, .2, .15 - i * .1, .012, 0, .85, 0);
  bx(g, .075, .06, .06, SK, .2, -.17, .012, 0, .85, 0);
  var th = bx(g, .075, .15, .06, SK, -.19, -.1, .03, 0, .85, 0); th.rotation.z = .3;
  bx(g, .32, .42, .12, SK, .04, -.25, -.1, 0, .85, 0);
  var arm = new THREE.Group(); arm.position.set(.1, -.4, -.12); arm.rotation.z = .45; g.add(arm);
  var sk = new THREE.Mesh(new THREE.CylinderGeometry(.075, .085, .5, 12), mat(SK, 0, .85, 0)); sk.position.y = -.2; arm.add(sk);
  var sl = new THREE.Mesh(new THREE.CylinderGeometry(.1, .12, 1.3, 12), mat(SH, 0, .9, 0)); sl.position.y = -1.1; arm.add(sl);
  return g;
}

function phoneEnsure() {
  if (PHN) return;
  PHC = document.createElement('canvas'); PHC.width = 192; PHC.height = 384;
  PHX = new THREE.CanvasTexture(PHC); PHX.encoding = THREE.sRGBEncoding; PHX.anisotropy = 4;
  drawPhone('off', 0);
  PHN = phoneBuild(); PHN.visible = false; cam.add(PHN);
}

function phonePose(p, vib, tt) {
  PHN.position.set(p[0] + Math.sin(tt * 53) * .004 * vib + Math.sin(tt * 1.3) * .004, p[1] + Math.cos(tt * 47) * .004 * vib + Math.sin(tt * 1.1) * .005, p[2]);
  PHN.rotation.set(p[3] + Math.sin(tt * .9) * .01, p[4] + Math.sin(tt * .7) * .01, p[5] + Math.sin(tt * 57) * .012 * vib);
}

/* ---------- ход сцены ---------- */
function setPh(p) {
  var C = CALL;
  C.ph = p; C.pt = 0; C.fl = {};
  C.sl = (CALL_SUBS[p] || []).map(function (s) { return { t: s[0], w: s[1], x: s[2], d: 0 }; });
  if (p == 'buzz') { PHN.visible = true; phonePose(PH_HID, 0, 0); }
  if (p == 'ring') { $('sub').style.display = 'none'; C.scr = 'ring'; ringStart(); UI(); }
  if (p == 'dec') ringStop();
  if (p == 'ans') ringStop();
}

function startCall() {
  phoneEnsure();
  CALL = { t: 0, pt: 0, ph: 'look', cy: 0, cp: -.3, bn: 2.8, bk: 0, subT: 0, sl: [], fl: {}, sd: 0, scr: 'off' };
  mode = 'call';
  wrk.visible = false; deco.visible = true; flG.visible = false;
  tScr.material.color.setHex(0xffffff);
  hL.visible = hR.visible = false; bod.visible = false;
  R.domElement.style.filter = 'contrast(1.08) saturate(1.2)';
  $('lt').style.display = $('lb').style.display = 'none';
  $('sub').style.display = 'none'; $('sub').style.zIndex = 2; $('ui').style.zIndex = 2;
  var o = $('cf');
  if (!o) { o = document.createElement('div'); o.id = 'cf'; o.style.cssText = 'position:fixed;inset:0;background:#000;opacity:1;pointer-events:none;z-index:1'; $('w').appendChild(o); }
  o.style.opacity = 1;
  PHN.visible = false;
  setPh('look');
  UI();
}

function callUI() {
  var C = CALL;
  if (!C || C.ph != 'ring') return '';
  return '<div class="it g pa" style="text-align:center"><p><b style="color:var(--ac)">Входящий вызов — Виктор</b></p>' +
    '<button class="b pr" style="margin-right:10px;background:linear-gradient(90deg,#22c55e,#16a34a)" onclick="callAnswer(1)">Ответить [E]</button>' +
    '<button class="b" style="background:rgba(239,68,68,.35)" onclick="callAnswer(0)">Не брать [Q]</button></div>';
}

function callAnswer(yes) {
  var C = CALL;
  if (!C || C.ph != 'ring') return;
  try { G.ev = G.ev || {}; G.ev.call = yes ? 'answer' : 'decline'; } catch (e) {}
  setPh(yes ? 'ans' : 'dec');
  UI();
}

function callEnd() {
  ringStop();
  CALL = null;
  if (PHN) PHN.visible = false;
  var o = $('cf'); if (o) o.style.opacity = 0;
  $('sub').style.display = 'none'; $('sub').style.zIndex = ''; $('ui').style.zIndex = '';
  try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {}
  startBeat();
}

function callTick(dt) {
  var C = CALL;
  if (!C) return;
  C.t += dt; C.pt += dt;
  var t = C.t, pt = C.pt, K = CK_LOOK, pose = PH_HID, vib = 0, ph = C.ph;

  if (ph == 'look') {
    K = CK_LOOK;
    if (pt >= CALL_LOOK_END) setPh('buzz');
  } else if (ph == 'buzz') {
    K = CK_BUZZ;
    if (!C.fl.a && pt >= .05) { C.fl.a = 1; sfx('buzz'); }
    if (!C.fl.b && pt >= .7) { C.fl.b = 1; sfx('buzz'); }
    if (!C.fl.c && pt >= 1.15) { C.fl.c = 1; sfx('rustle'); }
    pose = lerpP(PH_HID, PH_RD, ease(clamp01((pt - 1.3) / 1.7)));
    if (pt >= 3) setPh('ring');
  } else if (ph == 'ring') {
    K = CK_RING; pose = PH_RD; vib = 1;
    C.sd -= dt; if (C.sd <= 0) { drawPhone('ring', t); C.sd = .1; }
  } else if (ph == 'ans') {
    K = pt < CALL_ANS_END ? CK_ANS : CK_OUT;
    if (pt < CALL_ANS_END) {
      if (!C.fl.a && pt >= .1) { C.fl.a = 1; sfx('tap'); drawPhone('talk', t); }
      var dip = pt < .3 ? Math.sin(clamp01(pt / .3) * Math.PI) * .03 : 0;
      pose = lerpP(PH_RD, PH_EAR, ease(clamp01((pt - .3) / 1)));
      pose = pose.slice(); pose[1] -= dip;
    } else {
      if (!C.fl.h) { C.fl.h = 1; sfx('hangup'); drawPhone('off', t); }
      var q = pt - CALL_ANS_END;
      if (q > .1 && !C.fl.r) { C.fl.r = 1; sfx('rustle'); }
      pose = lerpP(PH_EAR, PH_HID, ease(clamp01(q / CALL_OUT_LEN)));
      if (q >= CALL_OUT_LEN + .4) { callEnd(); return; }
    }
  } else if (ph == 'dec') {
    K = CK_DEC;
    if (!C.fl.a && pt >= .1) { C.fl.a = 1; sfx('tap'); }
    if (!C.fl.o && pt >= .3) { C.fl.o = 1; drawPhone('off', t); }
    if (!C.fl.r && pt >= .55) { C.fl.r = 1; sfx('rustle'); }
    pose = lerpP(PH_RD, PH_HID, ease(clamp01((pt - .45) / .9)));
    if (!C.fl.m && pt >= 2.6) { C.fl.m = 1; sfx('buzz'); sfx('sms'); }
    if (pt >= CALL_DEC_END) { callEnd(); return; }
  }

  // субтитры по времени текущей фазы
  C.sl.forEach(function (s) { if (!s.d && pt >= s.t) { s.d = 1; callSub(s.w, s.x); } });
  if (C.subT > 0 && (C.subT -= dt) <= 0) $('sub').style.display = 'none';

  if (PHN.visible) phonePose(pose, vib, t);

  // взгляд: ключи → плавная кривая → инерция головы + дыхание и лёгкое покачивание
  var L = kf(K, pt), gy = L(1), gp = L(2), k = 1 - Math.exp(-dt * 8);
  C.cy += (gy - C.cy) * k; C.cp += (gp - C.cp) * k;
  var br = Math.sin(t * 1.25) * .012;
  var sw = Math.sin(t * .63) * .012 + Math.sin(t * 1.7) * .005, sp = Math.sin(t * .8 + 1) * .008 + Math.sin(t * 2.1) * .003;
  var buz = (ph == 'buzz' && ((pt > .05 && pt < .3) || (pt > .7 && pt < .95))) ? Math.sin(t * 80) * .006 : 0;
  cam.position.set(Math.sin(t * .5) * .01, 3.4 + br, -1.2);
  cam.rotation.set(C.cp + sp, C.cy + sw, buz + Math.sin(t * .4) * .004);

  // чёрный экран на входе и моргание
  C.bn -= dt;
  if (C.bn <= 0) { C.bk = .16; C.bn = 3 + Math.random() * 3.5; }
  var bl = 0;
  if (C.bk > 0) { bl = Math.sin(clamp01(C.bk / .16) * Math.PI) * .85; C.bk -= dt; }
  var o = $('cf');
  if (o) o.style.opacity = Math.max(clamp01(1 - t / 1.6), bl);
}

addEventListener('keydown', function (e) {
  if (mode != 'call' || !CALL || CALL.ph != 'ring' || e.repeat) return;
  if (e.code == 'KeyE' || e.code == 'Enter') { e.preventDefault(); callAnswer(1); }
  else if (e.code == 'KeyQ' || e.code == 'Escape') { e.preventDefault(); callAnswer(0); }
});
