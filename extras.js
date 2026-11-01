[extras.js](https://github.com/user-attachments/files/34234102/extras.js)
/* extras.js — звуки, меню по Esc, песочница.
   Подключается в index.html ОДНОЙ строкой перед </body>:
   <script src="extras.js"></script>
   Управление камерой и мышью из index.html НЕ меняется. */
(function(){
const $$=id=>document.getElementById(id);

/* ---------- 1. озвучка героя выключена полностью ---------- */
window.say=function(){};
try{opt.v=0}catch(e){}

/* ---------- 2. звуки ---------- */
let AC=null,NB=null,MASTER=null,lastAl=0,lastStep=0,vol=1;
try{const v=parseFloat(localStorage.getItem('pcvol'));if(v>=0&&v<=1)vol=v}catch(e){}
function actx(){
 if(!AC){try{
  AC=new(window.AudioContext||window.webkitAudioContext)();
  MASTER=AC.createGain();MASTER.gain.value=1.5*vol;
  const cp=AC.createDynamicsCompressor();MASTER.connect(cp);cp.connect(AC.destination);
  const rl=Math.floor(AC.sampleRate*1.3),ib=AC.createBuffer(2,rl,AC.sampleRate);
  for(let c=0;c<2;c++){const d=ib.getChannelData(c);for(let i=0;i<rl;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/rl,2.8)}
  const cv=AC.createConvolver();cv.buffer=ib;const wg=AC.createGain();wg.gain.value=.3;MASTER.connect(cv);cv.connect(wg);wg.connect(AC.destination);
  const n=AC.sampleRate,b=AC.createBuffer(1,n,n),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;NB=b;
 }catch(e){AC=null}}
 if(AC&&AC.state==='suspended')AC.resume();
 return AC}
function tn(a,t,d,ty,f0,f1,v){const o=a.createOscillator(),g=a.createGain();o.type=ty;o.frequency.setValueAtTime(f0,t);if(f1&&f1!==f0)o.frequency.exponentialRampToValueAtTime(f1,t+d);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(MASTER);o.start(t);o.stop(t+d+.03)}
function nz(a,t,d,ty,f0,f1,q,v){const s=a.createBufferSource(),fl=a.createBiquadFilter(),g=a.createGain();s.buffer=NB;fl.type=ty;fl.Q.value=q||1;fl.frequency.setValueAtTime(f0,t);if(f1&&f1!==f0)fl.frequency.exponentialRampToValueAtTime(f1,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(fl);fl.connect(g);g.connect(MASTER);s.start(t);s.stop(t+d+.02)}
function t2(a,t,f,d,ty,v){tn(a,t,d,ty,f,f,v)}
function bl(a,t,f,d,v){t2(a,t,f,d,'sine',v);t2(a,t,f*2.005,d*.6,'sine',v*.35);t2(a,t,f*3.01,d*.3,'triangle',v*.12)}
function pl(a,t,f,d,v){const o=a.createOscillator(),fl=a.createBiquadFilter(),g=a.createGain();o.type='triangle';o.frequency.value=f;fl.type='lowpass';fl.frequency.setValueAtTime(f*6,t);fl.frequency.exponentialRampToValueAtTime(f*1.2,t+d);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(fl);fl.connect(g);g.connect(MASTER);o.start(t);o.stop(t+d+.02)}
const SFX={
 take(a,t){nz(a,t,.1,'bandpass',600,2400,1.2,.16);pl(a,t+.02,659,.14,.3)},
 buy(a,t){bl(a,t,988,.3,.34);bl(a,t+.09,1319,.5,.34)},
 put(a,t){pl(a,t,392,.2,.38);tn(a,t,.12,'sine',150,70,.4);nz(a,t,.05,'lowpass',900,300,.7,.18)},
 place(a,t){nz(a,t,.025,'highpass',5000,5000,1,.3);pl(a,t+.01,784,.12,.28);pl(a,t+.06,1047,.18,.3)},
 screw(a,t){for(let i=0;i<5;i++){nz(a,t+i*.07,.025,'highpass',4200,4200,1,.2);pl(a,t+i*.07,900+i*70,.06,.14)}bl(a,t+.38,1319,.35,.28)},
 cable(a,t){nz(a,t,.35,'bandpass',700,3000,1.5,.14);pl(a,t+.32,659,.16,.3);pl(a,t+.4,880,.22,.3)},
 sell(a,t){nz(a,t,.03,'highpass',5000,5000,1,.35);bl(a,t+.02,1319,.5,.34);bl(a,t+.1,1760,.6,.34);bl(a,t+.18,2093,.8,.3)},
 power(a,t){[392,523,659,784].forEach((f,i)=>pl(a,t+i*.1,f,.3,.3));nz(a,t,.9,'bandpass',400,2200,.8,.07);bl(a,t+.45,1047,.9,.3)},
 step(a,t){nz(a,t,.07,'lowpass',450+Math.random()*150,200,.8,.14)},
 error(a,t){pl(a,t,330,.16,.34);pl(a,t+.13,247,.26,.34)},
 hit(a,t){nz(a,t,.2,'lowpass',800,150,.8,.9);tn(a,t,.25,'sine',150,45,.9)},
 boom(a,t){tn(a,t,.7,'sine',80,28,1);nz(a,t,.6,'lowpass',400,80,.8,.8)},
 catch(a,t){[523,659,784,1047].forEach((f,i)=>pl(a,t+i*.07,f,.22,.32))},
 alarm(a,t){for(let i=0;i<4;i++)t2(a,t+i*.15,i%2?698:880,.14,'triangle',.3)},
 bell(a,t){bl(a,t,1175,.7,.32);bl(a,t+.22,1568,.9,.32)},
 day(a,t){[523,659,784,1047,1319].forEach((f,i)=>bl(a,t+i*.11,f,.5,.3))},
 tick(a,t){pl(a,t,1500,.05,.16)}
};
function sfx(n){
 if(!opt.s)return;
 try{const a=actx();if(!a||!SFX[n])return;
  if(n==='alarm'){const w=performance.now();if(w-lastAl<700)return;lastAl=w}
  SFX[n](a,a.currentTime+.005)}catch(e){}}
window.sfx=sfx;
let inBuy=false;
const BMAP={90:'boom',120:'hit',200:'error',300:'catch',400:'take',500:'put',520:'place',600:'cable',700:'screw',800:'sell',900:'alarm'};
window.beep=function(f){sfx((f===400&&inBuy)?'buy':(BMAP[Math.round(f)]||'put'))};
/* покупка в маркете, ошибка, ПК включился, новый клиент, конец дня */
const _buy=window.buy;window.buy=function(id){const m0=G.m;inBuy=true;try{_buy(id)}finally{inBuy=false}if(G&&G.m===m0)sfx('error')};
const _fin=window.fin;window.fin=function(){_fin();sfx('power')};
const _spawn=window.spawn;window.spawn=function(){const n=CU.length;_spawn();if(CU.length>n)sfx('bell')};
const _next=window.next;window.next=function(){const d=G.day;_next();if(G&&G.day>d)sfx('day')};
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('.b'))sfx('tick')});
addEventListener('pointerdown',()=>{if(opt.s)actx()});
addEventListener('keydown',()=>{if(opt.s)actx()});

/* ---------- 3. меню по Esc (пауза) ---------- */
let paused=false,prevMode='play',pauseT=0,lockWas=false,lastTry=0,quiet=0;
const coarse=()=>matchMedia('(pointer:coarse)').matches;
const css=document.createElement('style');
css.textContent=`
.pz{position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;background:rgba(5,6,10,.62);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.pz.on{display:flex;animation:pzin .18s ease-out}
@keyframes pzin{from{opacity:0}to{opacity:1}}
@keyframes pzup{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
.pz-card{width:min(340px,86%);padding:22px 22px 14px;border-radius:18px;background:rgba(10,14,26,.9);border:1px solid rgba(255,255,255,.16);box-shadow:0 20px 60px rgba(0,0,0,.6);display:flex;flex-direction:column;gap:12px;text-align:center;animation:pzup .22s ease-out}
.pz-t{font-size:28px;font-weight:800;letter-spacing:.32em;padding-left:.32em;background:linear-gradient(90deg,#6ee7ff,#c084fc,#f472b6);-webkit-background-clip:text;background-clip:text;color:transparent}
.pz-main,.pz-set{display:flex;flex-direction:column;gap:9px}
.pz-card .b{padding:12px;font-size:16px;transition:background .15s,transform .1s}
.pz-card .b:hover{background:rgba(255,255,255,.17)}.pz-card .b:active{transform:scale(.98)}.pz-card .pr:hover{filter:brightness(1.1)}
.pz-card .b:focus-visible{outline:2px solid #6ee7ff;outline-offset:2px}
.pz-row{display:flex;align-items:center;gap:12px;color:#cbd5e1;font-size:15px}.pz-row input{flex:1;accent-color:#6ee7ff}
.pz-h{color:#98a0ae;font-size:12px}`;
document.head.appendChild(css);
const ov=document.createElement('div');ov.className='pz';
ov.innerHTML='<div class="pz-card"><div class="pz-t">ПАУЗА</div>'+
 '<div class="pz-main"><button class="b pr" data-a="resume">Продолжить</button><button class="b" data-a="set">Настройки</button><button class="b" data-a="exit">Выйти в главное меню</button></div>'+
 '<div class="pz-set" style="display:none"><label class="pz-row"><span>Громкость</span><input type="range" id="pz_v" min="0" max="100"></label><button class="b" data-a="snd"></button><button class="b" data-a="gfx"></button><button class="b" data-a="flip">⟲ Повернуть вид</button><button class="b pr" data-a="back">Назад</button></div>'+
 '<div class="pz-h">Esc — продолжить</div></div>';
$$('w').appendChild(ov);
const pzMain=ov.querySelector('.pz-main'),pzSet=ov.querySelector('.pz-set'),pzV=ov.querySelector('#pz_v');
function lab(){ov.querySelector('[data-a=snd]').textContent='Звуки: '+(opt.s?'вкл':'выкл');ov.querySelector('[data-a=gfx]').textContent='Графика: '+(opt.q?'высокая':'экономная');pzV.value=Math.round(vol*100)}
function view(sets){pzMain.style.display=sets?'none':'flex';pzSet.style.display=sets?'flex':'none';const f=ov.querySelector(sets?'[data-a=back]':'[data-a=resume]');if(f)f.focus()}
function pause(){
 if(paused||mode!=='play')return;
 paused=true;prevMode=mode;pauseT=performance.now();mode='term';
 keys={};jx=jy=0;for(const k in pt)delete pt[k];jb.style.display='none';
 if(document.pointerLockElement)document.exitPointerLock();
 lab();view(false);ov.classList.add('on')}
function resume(){
 if(!paused)return;
 paused=false;mode=prevMode;ov.classList.remove('on');plErr=0;UI()}
ov.addEventListener('click',e=>{
 const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
 if(a==='resume')resume();else if(a==='set'){lab();view(true)}else if(a==='back')view(false);
 else if(a==='snd'){opt.s=!opt.s;lab()}
 else if(a==='gfx'){opt.q=!opt.q;rs();lab()}
 else if(a==='flip'){flip=-flip;rs()}
 else if(a==='exit'){try{save()}catch(_){}history.replaceState(null,'',location.pathname+location.search);location.reload()}});
pzV.addEventListener('input',()=>{vol=pzV.value/100;try{localStorage.setItem('pcvol',vol)}catch(_){}if(MASTER)MASTER.gain.value=1.5*vol});
pzV.addEventListener('change',()=>sfx('tick'));
/* Esc: перехватываем раньше игры; в настройках Esc возвращает на шаг назад */
addEventListener('keydown',e=>{
 if(e.code!=='Escape')return;
 if(paused){e.stopImmediatePropagation();e.preventDefault();if(performance.now()-pauseT>350){if(pzSet.style.display==='flex')view(false);else resume()}return}
 if(mode==='play'){e.stopImmediatePropagation();e.preventDefault();pause()}
},true);
/* Chrome сам отпускает мышь по Esc и клавишу странице не отдаёт — ловим потерю захвата */
document.addEventListener('pointerlockchange',()=>{
 const l=!!document.pointerLockElement;
 if(!l&&lockWas&&mode==='play'&&!paused)pause();
 lockWas=l});
/* автозахват мыши по уже сделанному клику; ошибки такого захвата не считаются */
document.addEventListener('pointerlockerror',()=>{if(performance.now()-quiet<800){plErr=Math.max(0,plErr-1);if(plErr<3)noPL=0}});
/* пауза замораживает время игры */
const _gd=clock.getDelta.bind(clock);
clock.getDelta=function(){const d=_gd();return paused?0:d};
/* кнопка паузы на телефоне */
const pb=document.createElement('button');
pb.className='b';pb.textContent='⏸ Меню';pb.style.cssText='position:fixed;top:8px;right:10px;display:none;z-index:30;padding:6px 12px';
pb.onclick=pause;$$('w').appendChild(pb);
(function loop(){
 requestAnimationFrame(loop);
 pb.style.display=(coarse()&&mode==='play'&&!paused)?'block':'none';
 if(mode==='play'&&!document.pointerLockElement&&!noPL&&!coarse()&&navigator.userActivation&&navigator.userActivation.isActive&&performance.now()-lastTry>700){
  lastTry=quiet=performance.now();tryLock()}
 if(mode==='play'&&mvf>.25){const s=Math.floor(walk/Math.PI);if(s!==lastStep){lastStep=s;sfx('step')}}
})();
$$('lk').textContent='Клик — захватить мышь · WASD — ходить · E — действие · Esc — пауза';

/* ---------- 4. песочница ---------- */
window.save=function(){
 try{const m=G.mk,x=[carry,benchPC&&benchPC.userData.pc].filter(Boolean),c=G.cand,rn=G.rn,gc=G.gc;
  x.forEach(q=>G.pcs.push(q));G.mk=null;G.cand=null;G.rn=null;G.gc=null;
  localStorage.setItem(G.sb?'pcv3sb':'pcv3',JSON.stringify(G));
  G.mk=m;G.cand=c;G.rn=rn;G.gc=gc;x.forEach(()=>G.pcs.pop())}catch(e){}};
window.sandbox=function(){
 let s=null;try{s=JSON.parse(localStorage.getItem('pcv3sb'))}catch(e){}
 if(s){G=s;G.sb=1;G.ev=G.ev||{};G.sec=G.sec||{alarm:0,guard:0};G.pts=G.pts||[];G.pcs=G.pcs||[];G.st=G.st||[];genAll();G.st.forEach(x=>{x.h=0;x.pl=0})}
 else{G={sb:1,m:1000000,debt:0,loan:0,day:1,st:[],pcs:[],shops:0,done:0,tid:1,sold:1,ev:{ch:1,g:1,a:1,b:1,c:1,d:1,e:1,f:1},sec:{alarm:0,guard:0},pts:[],mk:[]};genAll()}
 lockL();startPlay()};

/* ---------- 5. кнопка «Песочница» в главном меню, без пункта про озвучку ---------- */
const _UI=window.UI;
window.UI=function(){
 _UI.apply(this,arguments);
 if(mode==='menu'){
  const bt=document.querySelector('#ui .bt');
  if(bt&&!bt.querySelector('.sbx')){
   const b=document.createElement('button');b.className='b sbx';b.textContent='Песочница';
   b.style.cssText='border-color:#fde68a;color:#fde68a';b.onclick=()=>window.sandbox();
   bt.insertBefore(b,bt.children[2]||null)}}
 if(mode==='set')document.querySelectorAll('#ui .bt .b').forEach(b=>{if(/Озвучка/.test(b.textContent))b.remove()});
};
UI();

/* ---------- 6. запуск из menu.html: #play / #continue / #sandbox ---------- */
try{const o=JSON.parse(localStorage.getItem('pcopt')||'null');if(o){opt.s=o.s!==false;opt.q=o.q!==false;rs()}}catch(e){}
const h=location.hash.slice(1);
if(h==='play')play();else if(h==='continue'&&ld())cont();else if(h==='sandbox')window.sandbox();
})();
