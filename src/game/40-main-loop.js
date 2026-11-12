/* ================= MAIN LOOP ================= */
let last=performance.now(), fpsS=60, lampT=0, saveT=0, tankSh=null;
function frame(now){ requestAnimationFrame(frame); FRAME_N++; let dt=(now-last)/1000; last=now; if(!ready) return; const rdt=dt; dt=Math.min(dt,window.__DT_MAX||1/30); if(hitStop>0){ hitStop-=rdt; dt*=0.12; }
  fpsS+=((1/Math.max(rdt,1e-3))-fpsS)*0.05;
  if(GAR.open){ garUpdate(dt,now); if(SND.ctx&&!SND.muted) engineUpdate(dt,false); renderer.render(GAR.scene,GAR.cam); fpsEl.textContent=Math.round(fpsS)+' FPS'; return; }
  const inp=readInput(); if(helpOpen||transit||TK.dead){ inp.throttle=0; inp.steer=0; inp.fire=false; inp.joy=null; } if(SHD.on){ inp.throttle=0; inp.steer=0; inp.joy=null; }
  tankUpdate(dt,inp); if(!transit) gatesUpdate(dt);
  if(transit) { renderer.render(scene,camera); return; }
  const T=tank; T.root.position.set(TK.x,TK.y,TK.z); T.root.rotation.y=TK.h; T.susp.rotation.set(TK.pitch,0,TK.roll);
  const sk=STAB_K[UP.stab]; T.stab.rotation.set(-TK.pitch*sk,0,-TK.roll*sk);
  for(let i=0;i<T.wheels.length;i++){ const w=T.wheels[i], u=w.userData, st=u.st!=null?u.st:(i<2?1:0), wi=u.wi!=null?u.wi:i; T.spins[i].rotation.x=(w.position.x>0.05?(TK.wR||0):w.position.x<-0.05?(TK.wL||0):TK.wheel)*(u.rs||1); if(st) w.rotation.y=clamp(TK.steer,-0.42,0.42)*st; w.position.y=(u.y0!=null?u.y0:0.56)+(wi>=0?clamp(WH4[wi]-TK.y,-0.14,0.14):0); }
  for(const sp of T.spinners) sp.rotation.y+=dt*2.5;
  const gh=groundH(TK.x,TK.z); shadowM.visible=false; shadowsBegin(); shadowAdd(TK.x,TK.z,3.9,TK.y-gh,0.55); tankTracks(dt);
  T.root.updateMatrixWorld(true);
  aimIdleTick(dt,inp); updateAim();
  const w=WEAP[wcur]; const tgt=Math.hypot(AIM.x-TK.x,AIM.z-TK.z)>0.8?Math.atan2(AIM.x-TK.x,AIM.z-TK.z):AIM.yawRel;
  const dY=wrapA(tgt-TK.tYaw), slew=(wcur===0?3.4:2.4)*dt; TK.tYaw+=clamp(dY,-slew,slew); T.turret.rotation.y=wrapA(TK.tYaw-TK.h);
  T.root.updateMatrixWorld(true); T.gun.getWorldPosition(piv);
  const depL=chs().dep?chs().dep(T.turret.rotation.y):-0.32; TK.gPitch+=(clamp(solvePitch(piv.x,piv.y,piv.z,AIM.x,AIM.y,AIM.z,(wcur===1&&isRail())?RAILW:w),depL,0.5)-TK.gPitch)*Math.min(1,dt*10); T.gun.rotation.x=-TK.gPitch;
  if(wswap>0) T.gun.rotation.x+=Math.sin((1-wswap/0.35)*Math.PI)*0.6;
  T.root.updateMatrixWorld(true); tankDamageUniforms(T);
  LINES.begin();
  weaponsUpdate(dt,inp.fire&&!LOC.safe&&!TK.dead); projUpdate(dt); predictImpact();
  navUpdate(dt); enemiesUpdate(dt); tgtUpdate(dt); arenaGlassTick(); brkUpdate(dt); bossUI(dt); dronesUpdate(dt); gibsUpdate(dt); pickupsUpdate(dt); fallersUpdate(dt); delaysUpdate(dt); holdUpdate(dt,now/1000); v9Update(dt,now/1000); v10Update(dt); v11Update(dt); v12Update(dt,now/1000);
  enemyShadows(); shadowsEnd(); cratesUpdate(dt,now); sfxLUpdate(dt); campDecorUpdate(now/1000); tracksUpdate(dt); shockUpdate(dt); lightsT-=dt; if(lightsT<=0){ lightsT=0.5; lightsRefresh(); } lodUpdate(dt);
  carsUpdate(dt); debUpdate(dt); rigidUpdate(dt); spkUpdate(dt); SMOKE.update(dt); FIRE.update(dt); flashUpdate(dt); LINES.end();
  soldiersUpdate(dt,now/1000); zonesUpdate(); hqUpdate();
  T.beacon.visible=(now%1200)<600; SND.tick=Math.max(0,SND.tick-dt); SND.pk=Math.max(0,(SND.pk||0)-dt); SND.etk=Math.max(0,(SND.etk||0)-dt); SND.cl=Math.max(0,(SND.cl||0)-dt); ramCD-=dt;
  if(TK.hp<maxHP()*0.4&&!LOC.safe&&rnd()<0.25*(1-TK.hp/maxHP())+0.04){ const sm=mix3(P.dark,P.bg,0.2); SMOKE.spawn(TK.x-Math.sin(TK.h)*1.1,TK.y+1.6,TK.z-Math.cos(TK.h)*1.1,(rnd()-0.5)*0.6,1.4,(rnd()-0.5)*0.6,0.6,1.3,1.4,0.5,sm[0],sm[1],sm[2]); }
  if(TK.dead){ TK.deadT-=dt; if(rnd()<0.6){ const sm=mix3(P.dark,P.bg,0.15); SMOKE.spawn(TK.x+(rnd()-0.5),TK.y+1.5,TK.z+(rnd()-0.5),(rnd()-0.5),2,(rnd()-0.5),1,1.6,1.6,0.6,sm[0],sm[1],sm[2]); }
    if(TK.deadT<=0&&!transit){ TK.dead=false; ST.scrap=Math.floor(ST.scrap*0.8); TK.hp=Math.round(maxHP()*0.35); goLocation('camp',null,{x:CAMP_DOOR.x,z:CAMP_DOOR.z,h:CAMP_DOOR.h}); } }
  if(dirty.size){ const t0=performance.now(); for(const ci of dirty){ buildChunk(ci); dirty.delete(ci); if(performance.now()-t0>10) break; } }
  lampT-=dt; if(lampT<=0){ lampT=0.25; checkLamps(); if(groundDirty){ gtex.needsUpdate=true; groundDirty=0; } }
  if(SND.ctx&&!SND.muted) engineUpdate(dt,true);
  camUpdate(dt); camera.updateMatrixWorld(); shadowFollow(); shadowMark(rdt); xrayUpdate(dt); xrayEnemies(dt); missionTargets(); tringsUpdate(now/1000); arrowUpdate(); hudUpdate(dt); popsUpdate(dt); flashUpdateUI(rdt); if(mcOpen) pvRender(rdt);
  if(toastT>0){ toastT-=dt; if(toastT<=0) $('#toast').hidden=true; }
  saveT+=dt; if(saveT>8){ saveT=0; save(); }
  dynResUpdate(rdt); lampsFrame(); fpsEl.textContent=Math.round(fpsS)+' FPS'+(menuOpen?' · '+QUALITY[Q].label+(DYN.scale<0.999?' · '+Math.round(DYN.scale*100)+'%':''):'');
  autoQ(rdt);
  renderer.render(scene,camera); }

loadPalette(0);
const hadSave=loadSave(); if(!hadSave){ TK.hp=ARM_HP[0]; refillAmmo(); }
buildGameTank(); updateWeaponUI(); setQualityUI(); rankUI(); objUI(); if(touchDev) aimMode='stick';
$('#loadq').textContent=touchDev?'старт на низком, дальше по FPS':'старт на среднем, дальше по FPS';
requestAnimationFrame(()=>setTimeout(()=>{ try{ const gd=gfxLoad(); Q=qMode!=='auto'?qMode:(gd&&QUALITY[gd.q]?gd.q:(touchDev?'low':'med')); setQualityUI(); rebuild(Q); }catch(err){ $('#loadq').textContent='Ошибка: '+err.message; throw err; }
  $('#load').hidden=true; helpOpen=true; $('#help').hidden=false; last=performance.now(); requestAnimationFrame(frame); },30));
/* v26 debug: jump straight into a boss fight (story progress is restored after the win) */
const DBG_SIDE={cem:'W',junk:'N',auto:'E',park:'S'};
function dbgBoss(t){ const i=STORY.findIndex(m=>m.boss&&m.k===t); if(i<0||transit) return; if(MS.dbgRet==null&&MS.i!==i) MS.dbgRet=MS.i; MS.i=i; MS.active=true; MS.prog=0; objUI(); save();
  if(menuOpen) $('#bMenu').click(); TK.hp=Math.max(TK.hp,maxHP()); toast('Отладка · бой: '+(ENAME[t]||t)); goLocation(STORY[i].loc,DBG_SIDE[STORY[i].loc]); }
$('#bDbg').addEventListener('click',()=>{ const r=$('#dbgBoss'); r.hidden=!r.hidden; $('#bDbg').textContent=r.hidden?'Отладка ▸':'Отладка ▾'; });
document.querySelectorAll('#dbgBoss [data-boss]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); dbgBoss(b.dataset.boss); }));
window.__dbg={enemyHit,get WEAP(){return WEAP},get BOSS(){return BOSS},ARENA,get transit(){return transit},GD,gdLaunch,gdBoom,EW,rdDie,MAG,magPress,makePickup,CDK,get gdOk(){return gdOk()},autoQ,CAS,sun,SHR,get REALSH(){return REALSH},get GTILE(){return GTILE},DYN,get qMode(){return qMode},ARM,civMake,gaitPose,makeSoldier,CIVL:CIV,GAR,losClear,navOk,CHASSIS,selectTank,SHD,STL,BEE,shieldToggle,get tank(){return tank},buildGameTank,forceWin:()=>completeMission(),killTank,STORY,MXTRA,SEEN,radioSay,openMC,zontOn,eShoot,get proj(){return proj},RDR,ART,CIV,FLG,TLS,AIMIDLE,useArt,computeFlagPoints,flagPoints,MISSIONS,missionAt,objUI,get LOCS(){return LOCS},TK,UP,ST,updateWeaponUI,get LOC(){return LOC_ID},get Q(){return Q},goLocation,openGarage,closeGarage,rebuild,explode:(x,z)=>explode(x,1,z,1.7,1,0,-1,0,'shell',null),
  crater:(x,z)=>craterAt(x,z,1.6,0.3),sim:(n)=>{const o=[];for(let i=0;i<n;i++){tankUpdate(1/60,{throttle:1,steer:0,hb:false,joy:null,fire:false});if(i%4===0)o.push([+TK.z.toFixed(1),+TK.y.toFixed(3),+TK.pitch.toFixed(3),TK.air?1:0]);}return o;},damage:(a,dx,dz)=>damageTank(a,dx,dz,0),groundH,GATES,get gx(){return gx},get GS(){return GS},get ROADS(){return ROADS},get VS(){return VS},get,raycast,RH,get XRK(){return xrK},XR,HOLD,NAV,navPath,VEHS,pvSet,pvRender,renderer,scene,CRATES,get hitStop(){return hitStop},ENEMIES,PICKUPS,DRONES,MS,AIM,spawnEnemy,killEnemy,eRemove,LOC_STATE,toScreen,craterAt,get xr(){return XR.r.value},get wcur(){return wcur},switchWeapon};
