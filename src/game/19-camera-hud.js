/* ================= CAMERA ================= */
const camLook=new THREE.Vector3(40,0,40);
function camUpdate(dt){ const lx=TK.x+TK.vx*0.32+clamp((AIM.x-TK.x)*0.2,-6,6), lz=TK.z+TK.vz*0.32+clamp((AIM.z-TK.z)*0.2,-5,5);
  const k=1-Math.exp(-4*dt); camLook.x+=(lx-camLook.x)*k; camLook.z+=(lz-camLook.z)*k;
  const portrait=innerWidth<innerHeight; const H=portrait?54:40, Z=portrait?26:22;
  let sx=0,sy=0; if(!REDUCED&&shake>0){ const s=shake*shake*0.9; sx=(rnd()-0.5)*s; sy=(rnd()-0.5)*s; } shake=Math.max(0,shake-dt*1.6);
  camera.position.set(camLook.x+sx,H,camLook.z+Z+sy); camera.lookAt(camLook.x+sx*0.5,0,camLook.z+sy*0.5);
  const bf=portrait?48:36, nf=bf-camPunch*2.4; if(Math.abs(camera.fov-nf)>0.01){ camera.fov=nf; camera.updateProjectionMatrix(); } camPunch=Math.max(0,camPunch-dt*3.5); }
function resize(){ renderer.setSize(innerWidth,innerHeight,false); camera.aspect=innerWidth/innerHeight; camera.fov=innerWidth<innerHeight?48:36; camera.updateProjectionMatrix();
  const u=renderer.getDrawingBufferSize(new THREE.Vector2()).y/(2*Math.tan(camera.fov*Math.PI/360)); if(SMOKE){ SMOKE.mat.uniforms.uScale.value=u; FIRE.mat.uniforms.uScale.value=u; }
  if(GAR.cam) setGarView(); }
addEventListener('resize',resize);

/* ================= HUD ================= */
const ret=$('#ret'), imp=$('#imp'), wst=$('#wst'), wbar=$('#wbar'), spdEl=$('#spd'), errEl=$('#err'), dstEl=$('#dst'), stabEl=$('#stab'), hzg=$('#hzg'), fpsEl=$('#fps');
const sv=new THREE.Vector3();
function toScreen(x,y,z){ sv.set(x,y,z).project(camera); return [(sv.x*0.5+0.5)*innerWidth,(-sv.y*0.5+0.5)*innerHeight,sv.z<1]; }
const WIDS=['mg','cn','rk'];
function ammoTxt(id){ return ST.ammo[id]>0?String(Math.floor(ST.ammo[id])):'пусто'; }
function updateWeaponUI(){ WEAP=buildWeapons(); const a=wAllowed(); if(!a.includes(wcur)) wcur=a[0]; const mains=a.filter(i=>i<2); if(!mains.includes(lastMain)) lastMain=mains.length?mains[0]:0;
  const nm=[WEAP[0].name,chs().abil==='rail'?'Рельсотрон':UP.tank==='krep'?'Трёхствольная пушка':'Пушка','Ракеты'];
  $('#wdIn').innerHTML=a.map((wi,p)=>`<div class="w" data-w="${wi}"><span class="k">0${p+1}</span><span>${nm[wi]}</span><span class="am" id="wam${wi}">${ammoTxt(WIDS[wi])}</span></div>`).join('');
  $('#wchm').innerHTML=a.map(()=>'<i></i>').join(''); drumTo(false); }
function drumTo(anim){ const el=$('#wdIn'), d=$('#wdrum'), pos=Math.max(0,wAllowed().indexOf(wcur)); el.style.transition=anim?'transform .34s cubic-bezier(.3,1.45,.5,1)':'none'; el.style.transform=`translateY(${-pos*26}px)`;
  [...el.children].forEach((b,k)=>b.classList.toggle('on',k===pos)); [...$('#wchm').children].forEach((b,k)=>b.classList.toggle('on',k===pos));
  if(anim){ d.classList.remove('spin'); void d.offsetWidth; d.classList.add('spin'); }
  const mv=wcur<2?wcur:lastMain; if(tank){ tank.mg.visible=mv===0; tank.cn.visible=mv===1; } }
function ammoHud(){ for(let i=0;i<3;i++){ const el=document.getElementById('wam'+i); if(!el||(i===2&&!UP.rk)) continue; const id=WIDS[i]; el.textContent=ammoTxt(id); el.classList.toggle('low',ST.ammo[id]<ammoCap(id)*0.2); } }
let hudT=0;
function hudUpdate(dt){ const a=toScreen(AIM.x,AIM.y,AIM.z); ret.style.transform=`translate(${a[0]}px,${a[1]}px)`; const rv=!retVisible(); if(ret.hidden!==rv) ret.hidden=rv;
  let err=99; if(PRED.ok&&!LOC.safe){ const b=toScreen(PRED.x,PRED.y,PRED.z); imp.style.transform=`translate(${b[0]}px,${b[1]}px)`; imp.style.opacity=1; err=Math.hypot(PRED.x-AIM.x,PRED.y-AIM.y,PRED.z-AIM.z); } else imp.style.opacity=0;
  ret.classList.toggle('on',err<0.6&&!LOC.safe); ret.classList.toggle('safe',!!LOC.safe);
  const tilt=Math.hypot(TK.pitch,TK.roll)*180/Math.PI; hzg.setAttribute('transform',`translate(0 ${clamp(TK.pitch*120,-18,18).toFixed(1)}) rotate(${(TK.roll*180/Math.PI*2).toFixed(1)} 42 23)`);
  if(gainT>0){ gainT-=dt; if(gainT<=0){ gainAcc=0; $('#scrapGain').classList.remove('on'); } }
  const lockEl=$('#lock'), LK=AIM.lockE; if(LK&&!LK.dead&&!LOC.safe){ const y=(LK.y||0)+(LK.hy||0), sp=toScreen(LK.x,y,LK.z), sr=toScreen(LK.x+(LK.hr||0.5),y,LK.z), sz=clamp(Math.abs(sr[0]-sp[0])*2.6,36,170);
    lockEl.hidden=false; lockEl.classList.toggle('man',AIM.manual===LK); lockEl.style.transform=`translate(${sp[0]}px,${sp[1]}px)`; lockEl.style.width=lockEl.style.height=sz+'px'; lockEl.style.margin=`${-sz/2}px 0 0 ${-sz/2}px`; $('#lockHp').style.width=clamp(LK.hp/(LK.maxHp||8)*100,0,100)+'%'; const ln=ENAME[LK.type||'drone']; if(lockEl.dataset.n!==ln){ lockEl.dataset.n=ln; $('#lockN').textContent=ln; } } else lockEl.hidden=true;
  const hm=$('#hqMark'); if(LOC_ID==='camp'&&!MS.active&&!mcOpen&&!GAR.open&&!transit){ const q=toScreen(HQ_MARK.x,HQ_MARK.y,HQ_MARK.z); hm.hidden=!q[2]; hm.style.transform=`translate(${q[0]}px,${q[1]}px)`; } else hm.hidden=true;
  hudT-=dt; if(hudT>0) return; hudT=0.1;
  spdEl.textContent=Math.round(Math.abs(TK.vF)*3.6); errEl.textContent=err>50?'—':err.toFixed(1); dstEl.textContent=(destroyed*VS*VS*VS).toFixed(1);
  const st=tilt<0.8; stabEl.textContent=st?'Стаб ●':`Крен ${tilt.toFixed(1)}°`; stabEl.classList.toggle('bad',!st); hzg.style.color=st?'var(--acc)':'var(--warn)';
  const mh=maxHP(), hp=Math.max(0,Math.round(TK.hp)); $('#hpTxt').innerHTML=`${hp}<small> / ${mh}</small>`; const hf=$('#hpFill'); hf.style.width=(hp/mh*100).toFixed(1)+'%'; hf.classList.toggle('bad',hp/mh<0.3); const crit=hp/mh<0.3&&!LOC.safe&&!TK.dead; $('.hp').classList.toggle('crit',crit); document.body.classList.toggle('crit',crit); kitsHud();
  ammoHud(); $('#scrapTxt').textContent=Math.floor(ST.scrap); if(gainAcc>=1){ const g=$('#scrapGain'); g.textContent='+'+Math.floor(gainAcc); g.classList.add('on'); }
  let txt, frac, bad=false, safe=false;
  if(LOC.safe){ txt='Огонь запрещён'; frac=0; safe=true; }
  else if(wswap>0){ txt='Смена'; frac=1-wswap/0.35; }
  else if(ST.ammo[WIDS[wcur]]<=0&&rkQ<=0){ txt='Пусто'; frac=0; bad=true; }
  else if(wcur===0){ const mg=WEAP[0]; if(mgLock){ txt='Перегрев'; bad=true; } else if(mg.spin&&mgSpin>0&&mgSpin<0.92){ txt='Раскрутка'; } else txt=mgSpin>=0.92?'Огонь':'Готов'; frac=mgHeat; bad=bad||mgHeat>0.75; }
  else if(wcur===1){ txt=cnT>0?'Перезарядка':'Готов'; frac=cnT>0?1-cnT/WEAP[1].reload:1; }
  else { txt=rkQ>0?'Залп':(rkT>0?'Перезарядка':'Готов'); frac=rkT>0?1-rkT/WEAP[2].reload:1; }
  wst.textContent=txt; wst.classList.toggle('bad',bad); wst.classList.toggle('safe',safe); wbar.style.width=(frac*100).toFixed(0)+'%'; wbar.classList.toggle('bad',bad);
  $('#aimStick').classList.toggle('safe',!!LOC.safe); $('#bFire').classList.toggle('safe',!!LOC.safe); }
let toastT=0; function toast(s){ const t=$('#toast'); t.textContent=s; t.hidden=false; toastT=2.6; }
/* iOS: no pinch / double-tap page zoom while playing */
['gesturestart','gesturechange','gestureend'].forEach(ev=>document.addEventListener(ev,e=>e.preventDefault(),{passive:false}));
document.addEventListener('touchmove',e=>{ if(e.touches.length>1||(e.scale!==undefined&&e.scale!==1)){ if(!e.target.closest||!e.target.closest('.gpanel,.mcbody')) e.preventDefault(); } },{passive:false});
{ let lastTE=0; document.addEventListener('touchend',e=>{ const n=Date.now(); if(n-lastTE<320&&!(e.target.closest&&e.target.closest('button,.gpanel,input,a,.wbx'))) e.preventDefault(); lastTE=n; },{passive:false}); }
const FADE={busy:false}, BN={t:0,on:false};
function fadeOn(){ const f=$('#fade'); f.classList.remove('out'); f.classList.add('on'); }
function fadeOff(){ const f=$('#fade'); requestAnimationFrame(()=>requestAnimationFrame(()=>{ f.classList.add('out'); f.classList.remove('on'); })); }
/* the area title fades sooner once the player starts moving */
function bannerUpdate(dt){ if(!BN.on) return; BN.t+=dt; const b=$('#banner'); if(BN.t>4.2){ BN.on=false; return; } if(BN.t>0.6&&!b.classList.contains('quick')&&(Math.abs(TK.vF||0)>1.6||Math.hypot(TK.vx,TK.vz)>1.6)) b.classList.add('quick'); }
function banner(L){ const b=$('#banner'); b.classList.remove('quick'); BN.t=0; BN.on=true; $('#bnCn').textContent=L.ru; $('#bnRu').textContent=L.cn; $('#bnSub').textContent=L.sub||''; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); }
function updateWhere(){ const w=$('#where'); w.textContent=LOC.safe?'Лагерь · безопасно':LOC.ru; w.classList.toggle('safe',!!LOC.safe); }

