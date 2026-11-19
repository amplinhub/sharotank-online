/* ================= TUTORIAL (v30.7) =================
   First «Поехали» → a short drill in the safe camp, one control at a time, each step stays until it is done:
   drive to the beacon → shoot two targets → switch to the cannon for the armoured one → drive into HQ.
   Prompts show the real control (live keycaps / mouse on a PC, a ghost thumb over the real stick and a pulse on the real
   button on a phone), General Jiao says one short line per step. After that: one-off hints at the moment they are needed
   (target lock, repair kit). State: TUT in 18-input.js. */
const TUT_W1={x:56,z:55};
const TUT_TG=[{x:67,z:52.5,arm:0},{x:70.5,z:57.5,arm:0},{x:73,z:53.5,arm:1}];
const TUT_N=4, TUT_S=1.35, TUT_PY=1.28*TUT_S;   /* target scale, plate centre height */
const kc=(k,l)=>`<kbd data-k="${k}">${l}</kbd>`;
const TUT_MOUSE=b=>`<svg class="tmouse" viewBox="0 0 40 58" aria-hidden="true"><rect x="3" y="3" width="34" height="52" rx="17"/><path class="mb${b==='l'?' hot':''}" d="M20 3A17 17 0 0 0 3 20v4h17z"/><path class="mb" d="M20 3a17 17 0 0 1 17 17v4H20z"/><rect class="mw${b==='m'?' hot':''}" x="17" y="9" width="6" height="11" rx="3"/></svg>`;
const TUT_STICK=`<svg class="tstk" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21"/><circle class="kn" cx="24" cy="24" r="9"/></svg>`;
const TUT_STEPS=[
  { say:'Водитель, на связи генерал Джао. Сначала проверим ход: доедь до отметки.',
    kb:{v:`<div class="twasd">${kc('KeyW','W')}${kc('KeyA','A')}${kc('KeyS','S')}${kc('KeyD','D')}</div>`, t:'Доедь до отметки', s:'W S — газ и назад · A D — руль'},
    tc:{v:TUT_STICK, t:'Доедь до отметки', s:'Левый стик — езда', hand:'#moveStick', anim:'mv'} },
  { say:'Хорошо идёшь. Впереди мишени, сбей обе.',
    kb:{v:`<div class="trow">${TUT_MOUSE('l')}<span class="tor">или</span>${kc('KeyF','F')}</div>`, t:'Сбей мишени', s:'Мышь — прицел · левая кнопка — огонь'},
    tc:{v:`<div class="trow">${TUT_STICK}<span class="tbtn">ОГОНЬ</span></div>`, t:'Сбей мишени', s:'Правый стик — прицел · ОГОНЬ — выстрел', hand:'#aimStick', anim:'aim', pulse:'#bFire'} },
  { say:'Эта мишень в броне. Пулемёт её не возьмёт, бери пушку.',
    kb:{v:`<div class="trow">${kc('KeyQ','Q')}<span class="tor">или</span>${TUT_MOUSE('m')}<span class="tor">или</span>${kc('Digit2','2')}</div>`, t:'Возьми пушку', s:'Q или колесо мыши — смена оружия'},
    tc:{v:`<div class="trow"><span class="tbtn sw">⇄ СМЕНА</span></div>`, t:'Возьми пушку', s:'Кнопка СМЕНА — другое оружие', pulse:'#bSwap'} },
  { say:'Машина в порядке. Заезжай в штаб, там тебя ждёт первое задание.',
    kb:{v:'<div class="thq"><b>!</b></div>', t:'Заезжай в штаб', s:'Иди по стрелке к зданию с флажком'},
    tc:{v:'<div class="thq"><b>!</b></div>', t:'Заезжай в штаб', s:'Иди по стрелке к зданию с флажком'} }
];
const TUT_HINTS={
  lock:{ kb:{v:TUT_MOUSE('m'), t:'Захват цели', s:'Прицел сам берёт ближнего робота. Нажми колесо на другом — сменишь цель'},
         tc:{v:'<div class="ttap"></div>', t:'Захват цели', s:'Прицел сам берёт ближнего робота. Тапни по другому — сменишь цель'} },
  repair:{ kb:{v:kc('KeyR','R'), t:'Ремонт', s:'Корпус пробит. R — ремкомплект', pulse:'#kRep'},
           tc:{v:'<span class="tbtn">＋</span>', t:'Ремонт', s:'Корпус пробит. Кнопка ＋ справа — ремкомплект', pulse:'#kRep'} }
};

function tutLoad(hadSave){ let d=null; try{ d=JSON.parse(localStorage.getItem(TUT_KEY)||'null'); }catch(_){ d=null; }
  if(d&&typeof d==='object'){ TUT.done=!!d.done; TUT.hints=d.h&&typeof d.h==='object'?d.h:{}; }
  else if(hadSave){ TUT.done=true; TUT.hints={lock:1,repair:1}; tutSave(); }
  else { ST.scrap+=500; TUT.bonus=true; tutSave(); } }   /* v30.8: welcome bonus for a brand-new player */   /* players from before v30.7 skip it */
function tutSave(){ try{ localStorage.setItem(TUT_KEY,JSON.stringify({done:TUT.done?1:0,h:TUT.hints})); }catch(_){} }
function tutHelpMode(){ $('#help').classList.toggle('fresh',!TUT.done); $('#bGo').textContent=TUT.done?'Продолжить':'Поехали'; }
const tutKb=()=>document.body.classList.contains('kbm');

/* ---- start / stop ---- */
function tutStart(delay){ if(TUT.done||TUT.on) return; if(typeof LB!=='undefined'&&LB.inGame) return;
  Object.assign(TUT,{on:true,step:-1,wait:delay||0,okT:0,fire:false,mgPing:0,kb:null,sig:''}); document.body.classList.add('tut'); }
function tutEnd(){ TUT.on=false; TUT.fire=false; TUT.step=-1; tutClearTargets(); tutBeacon(false); tutUI(null); document.body.classList.remove('tut'); }
function tutFinish(skip){ if(!TUT.on) return; tutEnd(); TUT.done=true; tutSave(); tutHelpMode(); refillAmmo(); updateWeaponUI();
  if(!skip){ ST.scrap+=150; save(); toast('Обучение пройдено · +150 лома'); } }
function tutReset(){ if(TUT.on) tutEnd(); TUT.done=false; TUT.hints={}; TUT.hint=null; tutSave(); tutHelpMode(); }
function tutRestart(){ if(LOC_ID!=='camp'){ toast('Обучение проходит в лагере'); return; } tutReset(); tutStart(0.4); }
$('#tutSkip').addEventListener('click',e=>{ e.stopPropagation(); sfxClick(); tutFinish(true); toast('Обучение пропущено · всё управление — в Меню'); });
$('#tutX').addEventListener('click',e=>{ e.stopPropagation(); tutHintEnd(); });

function tutGo(i){ TUT.step=i; TUT.okT=0; TUT.t=0; if(i>=TUT_N){ tutFinish(false); return; }
  TUT.fire=i===1||i===2; TUT.kb=null; radioSay(TUT_STEPS[i].say);
  tutBeacon(i===0); if(i===1) tutSpawn(0,1); if(i===2) tutSpawn(2,2); }
function tutOk(){ TUT.okT=1.1; $('#tut').classList.add('ok'); sO(660,660,0.08,0.05,'triangle'); setTimeout(()=>sO(990,990,0.16,0.05,'triangle'),90); }

/* ---- the prompt card ---- */
function tutUI(spec,head){ const el=$('#tut'), hd=$('#tutHand'); for(const q of document.querySelectorAll('.tpulse')) q.classList.remove('tpulse');
  if(!spec){ el.hidden=true; hd.hidden=true; TUT.sig=''; return; }
  el.hidden=false; el.classList.remove('ok'); el.classList.toggle('hint',!head);
  $('#tutN').innerHTML=head||''; $('#tutV').innerHTML=spec.v; $('#tutTx').textContent=spec.t; $('#tutS').textContent=spec.s; $('#tutProg').textContent='';
  TUT.keys=[...el.querySelectorAll('[data-k]')]; TUT.mb=el.querySelector('.mb.hot'); TUT.mw=el.querySelector('.mw.hot'); TUT.sig='';
  if(spec.pulse) $(spec.pulse).classList.add('tpulse');
  hd.hidden=!spec.hand; hd.className=spec.anim||''; TUT.hand=spec.hand?$(spec.hand):null; TUT.handT=0; }
function tutHead(i){ let d=''; for(let k=0;k<TUT_N;k++) d+=`<i class="${k<i?'was':k===i?'on':''}"></i>`; return `<span class="tdots">${d}</span>Обучение · ${i+1} из ${TUT_N}`; }
function tutLive(dt){ /* live keycaps / mouse buttons; DOM written only on change */
  let s=''; for(const k of TUT.keys) s+=keys[k.dataset.k]?'1':'0'; s+=(mouse.down?'1':'0'); if(s!==TUT.sig){ TUT.sig=s; TUT.keys.forEach((k,j)=>k.classList.toggle('on',s[j]==='1')); if(TUT.mb) TUT.mb.classList.toggle('on',mouse.down); }
  const hd=$('#tutHand'); if(TUT.hand){ TUT.handT-=dt; if(TUT.handT<=0){ TUT.handT=0.5; const r=TUT.hand.getBoundingClientRect(); hd.style.left=(r.left+r.width/2)+'px'; hd.style.top=(r.top+r.height/2)+'px'; }
    const busy=TUT.hand.id==='moveStick'?TCH.mActive:TCH.active; if(hd.classList.contains('off')!==busy) hd.classList.toggle('off',busy); } }
function tutProgTx(s){ const p=$('#tutProg'); if(p.textContent!==s) p.textContent=s; }

/* ---- beacon and targets ---- */
let TMAT=null; function tutMats(){ if(TMAT) return TMAT; const T=c=>new THREE.MeshToonMaterial({color:c,gradientMap:gradTex});
  TMAT={wood:T(0x8a6a48),white:T(0xf1ead8),red:T(0xd8473a),metal:T(0x5b6470),dark:T(0x2f353d),yel:T(0xffc94a),
    glow:new THREE.MeshBasicMaterial({color:MCOL,transparent:true,opacity:0.85,depthWrite:false,side:THREE.DoubleSide}),
    beam:new THREE.MeshBasicMaterial({color:MCOL,transparent:true,opacity:0.22,depthWrite:false,blending:THREE.AdditiveBlending})}; return TMAT; }
function tutBeacon(on){ if(TUT.beacon){ scene.remove(TUT.beacon); TUT.beacon=null; } if(!on) return; const M=tutMats(), g=new THREE.Group();
  const ring=new THREE.Mesh(new THREE.RingGeometry(2.1,2.5,48),M.glow); ring.rotation.x=-Math.PI/2; ring.position.y=0.07; g.add(ring);
  const in2=new THREE.Mesh(new THREE.RingGeometry(1.2,1.35,40),M.glow); in2.rotation.x=-Math.PI/2; in2.position.y=0.08; g.add(in2);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.6,9,12,1,true),M.beam); beam.position.y=4.5; g.add(beam);
  g.position.set(TUT_W1.x,groundH(TUT_W1.x,TUT_W1.z),TUT_W1.z); g.userData.ring=ring; g.userData.in2=in2; scene.add(g); TUT.beacon=g; }
function tutBuildTarget(d){ const M=tutMats(), g=new THREE.Group(), B=(w,h,dd,m,x,y,z)=>{ const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,dd),m); o.position.set(x,y,z); g.add(o); return o; };
  B(0.12,1.25,0.12,M.wood,-0.42,0.62,-0.05); B(0.12,1.25,0.12,M.wood,0.42,0.62,-0.05); B(1.2,0.1,0.5,M.wood,0,0.05,-0.05); B(0.98,0.1,0.1,M.wood,0,0.5,-0.05);
  const pl=new THREE.Group(); pl.position.set(0,1.28,0); g.add(pl); const C=(r,m,z,seg)=>{ const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,0.06,seg||24),m); o.rotation.x=Math.PI/2; o.position.z=z; pl.add(o); };
  if(d.arm){ C(0.7,M.metal,0,8); C(0.5,M.dark,0.035,8); C(0.2,M.yel,0.06,8); for(let k=0;k<8;k++){ const a=k/8*TAU+TAU/16, r=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,0.06),M.yel); r.position.set(Math.cos(a)*0.6,Math.sin(a)*0.6,0.05); pl.add(r); } }
  else { C(0.64,M.white,0); C(0.48,M.red,0.02); C(0.32,M.white,0.04); C(0.15,M.red,0.06); }
  g.scale.setScalar(TUT_S); g.rotation.y=Math.atan2(TUT_W1.x-d.x,TUT_W1.z-d.z); g.position.set(d.x,groundH(d.x,d.z)-1.7,d.z); scene.add(g); return {g,pl}; }
function tutSpawn(a,b){ for(let i=a;i<=b;i++){ const d=TUT_TG[i]; if(TUT.tg.some(t=>t.i===i)) continue; const m=tutBuildTarget(d);
    TUT.tg.push({i,x:d.x,z:d.z,arm:d.arm,hp:d.arm?1:14,dead:false,r:0.75,g:m.g,pl:m.pl,rise:0,fl:0,fv:null}); } sNz(0.35,'lowpass',500,1,0.12); }
function tutClearTargets(){ for(const t of TUT.tg) scene.remove(t.g); TUT.tg.length=0; }
function tutTargets(){ /* MTGT override while the drill runs (26-mission-visuals) */
  const s=TUT.step; if(s<0||TUT.okT>0){ return s<3; }
  if(s===0){ MTGT.x=TUT_W1.x; MTGT.z=TUT_W1.z; MTGT.ok=Math.hypot(TK.x-TUT_W1.x,TK.z-TUT_W1.z)>3; return true; }
  if(s===1||s===2){ let bd=1e9; for(const t of TUT.tg){ if(t.dead||(s===1&&t.arm)||(s===2&&!t.arm)) continue; MTGT.list.push(t); const d=Math.hypot(t.x-TK.x,t.z-TK.z); if(d<bd){ bd=d; MTGT.x=t.x; MTGT.z=t.z; MTGT.ok=true; } } return true; }
  return false; }
function tutProj(ox,oy,oz,ux,uy,uz,len){ let best=-1; for(let j=0;j<TUT.tg.length;j++){ const t=TUT.tg[j]; if(t.dead||t.rise<0.8) continue; const gy=t.g.position.y;
    for(const [hy,r] of [[TUT_PY,0.8*TUT_S],[0.5*TUT_S,0.55*TUT_S]]){ const h=segSphere(ox,oy,oz,ux,uy,uz,len,t.x,gy+hy,t.z,r); if(h>=0&&(best<0||h<best)){ best=h; TUT.hitI=j; } } } return best; }
function tutHit(w,hx,hy,hz,ux,uz){ const t=TUT.tg[TUT.hitI]; if(!t||t.dead) return; t.fl=1;
  if(t.arm&&w.id==='mg'){ hitSpark(hx,hy,hz,ux,uz,6); sfxClang(); if(++TUT.mgPing===6) radioSay(tutKb()?'Пули отскакивают. Пушка — клавиша Q.':'Пули отскакивают. Жми СМЕНА, бери пушку.'); return; }
  t.hp-=w.id==='mg'?(MG_DMG[UP.mg]||4):999; hitSpark(hx,hy,hz,ux,uz,w.id==='mg'?5:12); if(w.id==='mg') sfxTick();
  if(t.hp>0) return; t.dead=true; t.fv={y:3.2,z:-3.5,r:-5-rnd()*3};
  if(w.id==='mg'){ sfxClang(); for(let k=0;k<6;k++) SMOKE.spawn(hx,hy,hz,(rnd()-0.5)*2,1+rnd(),(rnd()-0.5)*2,0.4,1.1,0.6,0.4,0.85,0.82,0.75); }
  else { FIRE.spawn(hx,hy,hz,0,0,0,2.6,3,0.12,1,1,0.85,0.5); for(let k=0;k<8;k++) SMOKE.spawn(hx,hy,hz,(rnd()-0.5)*3,1.5+rnd()*2,(rnd()-0.5)*3,0.8,1.8,0.9,0.5,0.6,0.6,0.62); sfxCannonE(); shake=Math.min(1,shake+0.25); } }
function tutAim(){ /* soft aim assist on the drill targets — like the auto-lock on robots in a real fight */
  const s=TUT.step; let best=null, bs=1e9;
  for(const t of TUT.tg){ if(t.dead||t.rise<0.8||(s===1&&t.arm)||(s===2&&!t.arm)) continue; const cy=t.g.position.y+TUT_PY;
    if(aimMode==='mouse'){ const cx=t.x-camera.position.x, cyy=cy-camera.position.y, cz=t.z-camera.position.z, tp=cx*ndc.x+cyy*ndc.y+cz*ndc.z; if(tp<0) continue; const q=Math.sqrt(Math.max(0,cx*cx+cyy*cyy+cz*cz-tp*tp)); if(q<1.6&&q<bs){ bs=q; best=t; } }
    else { const a=Math.atan2(t.x-TK.x,t.z-TK.z), da=TCH.active?Math.abs(wrapA(a-AIM.yawRel)):Math.hypot(t.x-TK.x,t.z-TK.z)*0.01; if((!TCH.active||da<0.4)&&da<bs){ bs=da; best=t; } } }
  if(!best) return; AIM.x=best.x; AIM.y=best.g.position.y+TUT_PY; AIM.z=best.z; if(aimMode!=='mouse'){ AIM.yawRel=Math.atan2(best.x-TK.x,best.z-TK.z); AIM.dist=Math.hypot(best.x-TK.x,best.z-TK.z); } }
function tutAnim(dt,t){ const b=TUT.beacon; if(b){ const k=1+Math.sin(t*4)*0.06; b.userData.ring.scale.set(k,k,1); b.userData.in2.rotation.z+=dt*1.5; }
  for(const q of TUT.tg){ if(q.g.parent!==scene) scene.add(q.g); /* survives a quality rebuild */
    if(q.rise<1){ q.rise=Math.min(1,q.rise+dt*1.8); const e=1-Math.pow(1-q.rise,3); q.g.position.y=groundH(q.x,q.z)-1.7*(1-e); }
    if(q.fl>0){ q.fl=Math.max(0,q.fl-dt*6); q.pl.scale.setScalar(1+q.fl*0.12); }
    if(q.fv){ const p=q.pl.position; q.fv.y-=14*dt; p.y+=q.fv.y*dt; p.z+=q.fv.z*dt; q.pl.rotation.x+=q.fv.r*dt; if(p.y<0.12){ p.y=0.12; q.pl.rotation.x=-Math.PI/2; q.fv=null; } } } }

/* ---- per frame ---- */
let tutChk=0;
function tutUpdate(dt,t){
  if(!TUT.on){ tutHints(dt); return; }
  const here=LOC_ID==='camp', show=here&&!GAR.open&&!transit&&!helpOpen&&!ctrlOpen&&!mcOpen&&TUT.step>=0;
  if(!here){ if(TUT.tg.length||TUT.beacon){ tutClearTargets(); tutBeacon(false); } if(!$('#tut').hidden) tutUI(null); return; }
  if(TUT.wait>0){ TUT.wait-=dt; if(TUT.wait<=0&&TUT.step<0) tutGo(0); return; }
  if(TUT.step===0&&!TUT.beacon&&TUT.okT<=0) tutBeacon(true); if(TUT.step===1&&!TUT.tg.length) tutSpawn(0,1); if(TUT.step===2&&!TUT.tg.some(q=>q.arm)) tutSpawn(2,2);
  tutAnim(dt,t);
  if(TUT.step===3&&(HQ.in||mcOpen)){ tutFinish(false); return; }
  const kb=tutKb(); if(show&&(TUT.kb!==kb||$('#tut').hidden)){ TUT.kb=kb; const S=TUT_STEPS[TUT.step]; tutUI(kb?S.kb:S.tc,tutHead(TUT.step)); }
  else if(!show&&!$('#tut').hidden) tutUI(null);
  if(!show) return; tutLive(dt);
  if(TUT.okT>0){ TUT.okT-=dt; if(TUT.okT<=0) tutGo(TUT.step+1); return; }
  TUT.t+=dt; const s=TUT.step;
  if(s===0){ const d=Math.hypot(TK.x-TUT_W1.x,TK.z-TUT_W1.z); tutProgTx(Math.max(0,Math.round(d-2.5))+' м'); if(d<3){ tutBeacon(false); tutOk(); } }
  else if(s===1){ const n=TUT.tg.filter(q=>!q.arm&&q.dead).length; tutProgTx(`Мишени: ${n} из 2`); if(n>=2) tutOk(); }
  else if(s===2){ const a=TUT.tg.find(q=>q.arm); tutProgTx(wcur===1?'Пушка готова — огонь!':'Сейчас: '+WEAP[wcur].name.toLowerCase()); if(a&&a.dead) tutOk(); }
  else if(s===3){ tutProgTx(Math.round(Math.hypot(TK.x-(HQ.x0+HQ.x1)/2,TK.z-(HQ.z0+HQ.z1)/2))+' м'); } }

/* ---- just-in-time hints after the drill ---- */
function tutHintEnd(){ TUT.hint=null; tutUI(null); }
function tutHintShow(id){ TUT.hint=id; TUT.hintT=9; TUT.hints[id]=1; tutSave(); TUT.hkb=tutKb(); const H=TUT_HINTS[id]; tutUI(TUT.hkb?H.kb:H.tc,null); }
function tutHints(dt){
  if(TUT.hint){ const busy=helpOpen||ctrlOpen||mcOpen||GAR.open||transit; if(busy){ if(!$('#tut').hidden) tutUI(null); return; }
    if($('#tut').hidden||TUT.hkb!==tutKb()){ TUT.hkb=tutKb(); const H=TUT_HINTS[TUT.hint]; tutUI(TUT.hkb?H.kb:H.tc,null); }
    tutLive(dt); TUT.hintT-=dt; const ok=TUT.hint==='lock'?!!AIM.manual:TK.hp>=maxHP()*0.6; if(ok||TUT.hintT<=0) tutHintEnd(); return; }
  if(!TUT.done||LOC.safe||transit||TK.dead||helpOpen||mcOpen) return; tutChk-=dt; if(tutChk>0) return; tutChk=0.5;
  if(!TUT.hints.lock){ for(const e of ENEMIES){ if(e.dead||e.xf||e.lockable===false||e.state==='fly') continue; if(Math.hypot(e.x-TK.x,e.z-TK.z)<26){ tutHintShow('lock'); return; } } }
  if(!TUT.hints.repair&&ST.kits.rep>0&&TK.hp<maxHP()*0.45) tutHintShow('repair'); }
