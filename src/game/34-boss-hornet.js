/* =================================================================================== */
/* «ШЕРШЕНЬ» — heavy gunship: Mi-24 style tandem cockpit, two ducted side rotors        */
/* =================================================================================== */
let _ionTex=null;
function ionGlowTex(){ if(_ionTex) return _ionTex; const cv=document.createElement('canvas'); cv.width=cv.height=64; const g=cv.getContext('2d'), gr=g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.25,'rgba(150,215,255,0.65)'); gr.addColorStop(1,'rgba(40,120,255,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64); return _ionTex=new THREE.CanvasTexture(cv); }
function buildHornet(e){ e.onHit=hornetHit; Object.assign(e,{r:3.2,hy:0,hr:3.0,mass:20,alt:8,vy:0,st:'run',stT:0,run:null,cnCD:3,rkCD:6,flCD:0,bombCD:9,yawV:0,tp:0,tr:0,crash:0,rot:0,lockable:true,noCol:true,static:true});
  const C=emat(e,0x3f5a4a), C2=emat(e,0x2c3f35), D=emat(e,0x1c2024), Mt=emat(e,0x8d96a1), Gl=new THREE.MeshPhongMaterial({color:0x8fd8ff,transparent:true,opacity:0.55,shininess:90}), Y=emat(e,0xf2a81e), Hz=emapMat(e,TEXS.haz);
  e.eyeM=eglow(e,0xff3a2a); const B=e.body; const F=new THREE.Group(); F.position.y=0; B.add(F); e.fus=F;
  /* fuselage */
  ep(e,EGEO.box,C,F,0,0,0.1,1.9,1.7,4.6,true); ep(e,EGEO.box,C2,F,0,-0.95,0.2,1.6,0.2,4.2); ep(e,EGEO.box,C,F,0,0.95,-0.4,1.6,0.25,3.6);
  const nose=ep(e,EGEO.box,C,F,0,-0.25,2.9,1.5,1.2,1.4,true); nose.rotation.x=0.12; ep(e,EGEO.box,C,F,0,-0.4,3.75,1.1,0.8,0.8,true);
  /* stepped tandem canopies */
  const c1=ep(e,EGEO.box,Gl,F,0,0.55,3.0,1.25,0.75,1.25); c1.rotation.x=-0.25; const c2=ep(e,EGEO.box,Gl,F,0,1.05,1.65,1.35,0.85,1.4); c2.rotation.x=-0.2;
  for(const [z,y,w] of [[3.0,0.55,1.27],[1.65,1.05,1.37]]){ for(const s of [-1,1]) ep(e,EGEO.box,D,F,s*w/2,y,z,0.05,0.8,1.3); ep(e,EGEO.box,D,F,0,y+0.4,z,w,0.05,0.06); }
  /* big intakes above the cabin */
  for(const s of [-1,1]){ const it=ep(e,EGEO.cyl,C,F,s*0.62,1.45,0.1,0.62,2.0,0.62,true); it.rotation.x=Math.PI/2; ep(e,EGEO.disc,PKM.hole,F,s*0.62,1.45,1.11,1.1); ep(e,EGEO.ring,Mt,F,s*0.62,1.45,1.12,1.15);
    for(let k=0;k<3;k++) ep(e,EGEO.box,Mt,F,s*0.62,1.45-0.36+k*0.36,1.13,1.0,0.04,0.02);
    const ex=ep(e,EGEO.cyl,D,F,s*0.9,0.95,-1.3,0.42,0.9,0.42); ex.rotation.x=Math.PI/2+0.3; }
  e.heat=eglow(e,0xff7a2a); for(const s of [-1,1]) ep(e,EGEO.disc,e.heat,F,s*0.9,0.82,-1.75,0.32);
  /* tail boom, fin, stabiliser */
  const tb=ep(e,EGEO.cyl,C,F,0,0.25,-3.6,0.55,3.8,0.55,true); tb.rotation.x=Math.PI/2; const tb2=ep(e,EGEO.cyl,C2,F,0,0.35,-6.1,0.36,1.6,0.36); tb2.rotation.x=Math.PI/2;
  /* v27: fixed fin + stabiliser, with a moving rudder and two elevons that follow the manoeuvres */
  ep(e,EGEO.box,C,F,0,1.2,-6.3,0.15,2.0,0.75,true); ep(e,EGEO.box,C,F,0,0.42,-6.05,2.5,0.1,0.6,true); ep(e,EGEO.box,D,F,0,0.42,-5.7,0.5,0.14,0.7);
  e.rud=new THREE.Group(); e.rud.position.set(0,1.2,-6.68); F.add(e.rud); ep(e,EGEO.box,C2,e.rud,0,0,-0.3,0.13,1.95,0.6,true); ep(e,EGEO.box,Hz,e.rud,0,0.75,-0.3,0.15,0.34,0.5);
  e.elev=[]; for(const s of [-1,1]){ const g=new THREE.Group(); g.position.set(s*0.15,0.42,-6.35); F.add(g); ep(e,EGEO.box,C2,g,s*0.62,0,-0.21,1.2,0.08,0.42,true); ep(e,EGEO.box,Y,g,s*1.12,0,-0.2,0.12,0.1,0.38); e.elev.push(g);
    ep(e,EGEO.box,C,F,s*1.28,0.62,-6.05,0.07,0.5,0.6,true); ep(e,EGEO.joint,eglow(e,s<0?0xff2a2a:0x2aff6a),F,s*1.3,0.9,-6.0,0.1); }
  /* two ion thrusters hanging under the tail boom */
  e.ionM=eglow(e,0x58e0ff); e.ion=[]; for(const s of [-1,1]){ ep(e,EGEO.box,C2,F,s*0.42,-0.15,-5.3,0.14,0.55,0.9,true); const ig=new THREE.Group(); ig.position.set(s*0.55,-0.55,-5.3); F.add(ig);
    const hs=ep(e,EGEO.cyl,D,ig,0,-0.1,0,0.62,0.7,0.62,true); void hs; ep(e,EGEO.ring,Mt,ig,0,-0.45,0,0.7).rotation.x=Math.PI/2; for(let k=0;k<3;k++) ep(e,EGEO.ring,Mt,ig,0,0.1-k*0.17,0,0.64).rotation.x=Math.PI/2;
    const nz=ep(e,EGEO.disc,e.ionM,ig,0,-0.47,0,0.5); nz.rotation.x=Math.PI/2;
    const AM=(c,o)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
    const pl=new THREE.Mesh(new THREE.ConeGeometry(0.3,1,12,1,true),AM(0x3aa8ff,0.5)); pl.rotation.x=Math.PI; pl.userData.keep=true; ig.add(pl);
    const core=new THREE.Mesh(new THREE.ConeGeometry(0.15,1,10,1,true),AM(0xd8f6ff,0.8)); core.rotation.x=Math.PI; core.userData.keep=true; ig.add(core);
    const halo=new THREE.Mesh(new THREE.PlaneGeometry(1.7,1.7),new THREE.MeshBasicMaterial({map:ionGlowTex(),color:0x6cc8ff,transparent:true,opacity:0.8,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); halo.position.y=-0.5; halo.userData.keep=true; ig.add(halo); const halo2=halo.clone(); halo2.rotation.y=Math.PI/2; halo2.userData.keep=true; ig.add(halo2);
    const dia=[]; for(let k=0;k<4;k++){ const dm=new THREE.Mesh(new THREE.OctahedronGeometry(0.17,0),AM(0xbfeaff,0.7)); dm.scale.set(1,1.5,1); dm.userData.keep=true; ig.add(dm); dia.push(dm); }
    e.ion.push({g:ig,pl,core,halo,halo2,dia,s}); }
  /* chin turret with rotary cannon */
  const tur=new THREE.Group(); tur.position.set(0,-0.95,3.4); F.add(tur); e.tur=tur; ep(e,EGEO.sph,D,tur,0,0,0,0.75); const brl=new THREE.Group(); brl.position.z=0.35; tur.add(brl); e.brl=brl;
  for(let k=0;k<6;k++){ const a=k/6*TAU; const b=ep(e,EGEO.cyl,Mt,brl,Math.cos(a)*0.1,Math.sin(a)*0.1,0.7,0.05,1.4,0.05); b.rotation.x=Math.PI/2; } e.cmz=new THREE.Object3D(); e.cmz.position.z=1.45; brl.add(e.cmz);
  /* stub wings, rocket pods, nav lights */
  e.pods=[]; for(const s of [-1,1]){ const w=ep(e,EGEO.box,C,F,s*1.9,0.1,-0.1,2.4,0.18,1.3,true); w.rotation.z=s*-0.12;
    const pod=ep(e,EGEO.cyl,D,F,s*2.1,-0.45,0.0,0.36,1.6,0.36,true); pod.rotation.x=Math.PI/2; ep(e,EGEO.disc,PKM.hole,F,s*2.1,-0.45,0.81,0.62); const o=new THREE.Object3D(); o.position.set(s*2.1,-0.45,0.9); F.add(o); e.pods.push(o);
    ep(e,EGEO.joint,eglow(e,s<0?0xff2a2a:0x2aff6a),F,s*3.2,0.15,-0.1,0.12); }
  /* ducted rotors at the wing tips: pivots tilt with flight direction */
  e.ducts=[]; for(const s of [-1,1]){ const piv=new THREE.Group(); piv.position.set(s*3.95,0.45,-0.1); F.add(piv); ep(e,EGEO.box,C2,piv,-s*0.55,-0.25,0,0.8,0.5,0.9,true);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(1.75,0.24,8,32),C); ring.rotation.x=Math.PI/2; piv.add(ring); { const o=new THREE.Mesh(ring.geometry,outlineMat); o.scale.setScalar(1.04); ring.add(o); }
    const lip=new THREE.Mesh(new THREE.CylinderGeometry(1.95,1.95,0.5,32,1,true),emat(e,0x2c3f35)); lip.material.side=THREE.DoubleSide; piv.add(lip); ep(e,EGEO.box,Hz,piv,0,0.28,1.9,1.1,0.06,0.04);
    for(let k=0;k<4;k++){ const sp=ep(e,EGEO.box,D,piv,0,-0.18,0,3.5,0.06,0.09); sp.rotation.y=k/4*Math.PI; }
    const bl=new THREE.Group(); piv.add(bl); ep(e,EGEO.cyl,Mt,bl,0,0,0,0.42,0.3,0.42); for(let k=0;k<5;k++){ const b=ep(e,EGEO.box,emat(e,0x50565e),bl,0,0.05,0,3.2,0.05,0.38); b.rotation.y=k/5*Math.PI; b.rotation.x=0.18; }
    const gr=ep(e,EGEO.box,D,piv,0,0.26,0,3.5,0.03,0.05); gr.rotation.y=Math.PI/4; const gr2=ep(e,EGEO.box,D,piv,0,0.26,0,3.5,0.03,0.05); gr2.rotation.y=-Math.PI/4;
    e.ducts.push({piv,bl,s}); }
  /* searchlight + red beacon */
  e.beacon=eglow(e,0xff3a2a); ep(e,EGEO.joint,e.beacon,F,0,1.12,-1.6,0.16); ep(e,EGEO.box,e.eyeM,F,0,-0.7,3.95,0.5,0.12,0.04);
  /* v27: detailed cockpit — canopy frames, seats, pilots in helmets, instrument panels, HUD glass */
  { const Hm=emat(e,0xe9ecef), Vz=eglow(e,0xffb02a), Pn=eglow(e,0x3affc8), Pn2=eglow(e,0xff5a3a), Sk=emat(e,0x14181c);
    ep(e,EGEO.box,D,F,0,0.18,3.0,1.45,0.1,1.5,true); ep(e,EGEO.box,D,F,0,0.7,1.0,1.55,0.1,0.35); ep(e,EGEO.box,D,F,0,0.62,2.3,1.4,0.06,0.08);
    for(const s of [-1,1]){ for(const z of [3.55,2.45]) ep(e,EGEO.box,D,F,s*0.66,0.7,z,0.05,0.7,0.06).rotation.x=-0.25; ep(e,EGEO.box,D,F,s*0.66,1.2,1.7,0.05,0.7,0.06).rotation.x=-0.2; ep(e,EGEO.box,D,F,s*0.72,0.18,3.0,0.06,0.12,1.5); }
    /* pilot (rear) and gunner (front): seat, torso, helmet with a glowing visor */
    for(const [z,y,k] of [[3.0,0.45,0.95],[1.65,0.95,1.0]]){ ep(e,EGEO.box,Sk,F,0,y-0.2,z-0.28,0.55*k,0.7*k,0.18); ep(e,EGEO.box,Sk,F,0,y-0.28,z,0.5*k,0.14,0.5*k); ep(e,EGEO.box,emat(e,0x3f4a3a),F,0,y-0.05,z-0.02,0.42*k,0.42*k,0.3*k);
      ep(e,EGEO.sph,Hm,F,0,y+0.3,z-0.02,0.34*k,0.34*k,0.36*k,true); ep(e,EGEO.box,Vz,F,0,y+0.3,z+0.17,0.28*k,0.1*k,0.05); ep(e,EGEO.cyl,Sk,F,0.3*k,y+0.1,z+0.12,0.05,0.5,0.05).rotation.x=0.8; }
    /* instrument panels, HUD combiner glass, sensor ball on the nose, pitot tube */
    ep(e,EGEO.box,Sk,F,0,0.28,3.62,1.1,0.32,0.22,true); ep(e,EGEO.box,Pn,F,-0.25,0.4,3.74,0.32,0.14,0.02); ep(e,EGEO.box,Pn2,F,0.25,0.4,3.74,0.32,0.14,0.02); ep(e,EGEO.box,Pn,F,0,0.22,3.74,0.8,0.04,0.02);
    ep(e,EGEO.box,Gl,F,0,0.55,3.5,0.55,0.34,0.03).rotation.x=-0.5; ep(e,EGEO.box,Pn,F,0,0.28,2.38,0.6,0.18,0.02); ep(e,EGEO.sph,Sk,F,0,-0.05,4.35,0.42,0.42,0.42,true); ep(e,EGEO.disc,Pn,F,0,-0.05,4.57,0.22);
    const pt=ep(e,EGEO.cyl,Mt,F,0.5,0.02,4.55,0.05,1.1,0.05); pt.rotation.x=Math.PI/2; }
  /* fuselage detail: armour panel lines, rivets, spine antennas, flare dispensers, cannon feed belt, exhaust shrouds */
  { const Pl=emat(e,0x35493d), Rv=emat(e,0x9aa59c);
    for(const s of [-1,1]){ ep(e,EGEO.box,Pl,F,s*0.97,0.1,0.35,0.05,0.95,3.2); ep(e,EGEO.box,Pl,F,s*0.82,-0.62,1.7,0.05,0.4,2.0); for(let k=0;k<14;k++) ep(e,EGEO.joint,Rv,F,s*1.0,0.52,-1.05+k*0.28,0.06);
      ep(e,EGEO.box,D,F,s*0.9,0.78,-2.4,0.3,0.26,0.55,true); ep(e,EGEO.cyl,Pl,F,s*0.9,0.5,-1.55,0.52,0.5,0.52); }
    for(let k=0;k<2;k++) ep(e,EGEO.cyl,Mt,F,-0.2+k*0.4,1.5,-2.6+k*0.5,0.04,0.9+k*0.3,0.04);
    for(let k=0;k<8;k++){ const b=ep(e,EGEO.box,PKM.stripe,F,0.34,-0.62,2.7+k*0.2,0.08,0.2,0.1); b.rotation.x=0.3; } ep(e,EGEO.box,D,F,0.34,-0.55,3.2,0.18,0.18,1.7);
    for(let k=0;k<5;k++) ep(e,EGEO.box,Mt,F,0,1.04,-0.2-k*0.3,1.3,0.04,0.05); ep(e,EGEO.box,Pl,F,0,1.2,-0.6,0.9,0.18,2.0,true); }
  B.scale.setScalar(1.05); }
function hornetRun(e){ const a=Math.atan2(TK.x-e.x,TK.z-e.z)+(rnd()-0.5)*0.6, L=46; const sx=TK.x-Math.sin(a)*L*0.5, sz=TK.z-Math.cos(a)*L*0.5, ex=TK.x+Math.sin(a)*L*0.5, ez=TK.z+Math.cos(a)*L*0.5;
  return {sx:clamp(sx,8,WX-8),sz:clamp(sz,8,WZ-8),ex:clamp(ex,8,WX-8),ez:clamp(ez,8,WZ-8),leg:0}; }
function updHornet(e,dt){ const dx=TK.x-e.x, dz=TK.z-e.z, d=Math.max(1e-3,Math.hypot(dx,dz)); e.stT+=dt; e.t+=dt; e.cnCD-=dt; e.rkCD-=dt; e.flCD-=dt; e.bombCD-=dt;
  const f=e.hp/e.maxHp; if(f<0.6) bossPhase(e,2,'«Шершень» перешёл в режим охоты: кружит и сбрасывает мины. Сбивай мины — и бей по нему!'); if(f<0.3) bossPhase(e,3,'Один винт дымит! Он теряет управление — добей его, пока не упал на тебя.');
  const hp0=TK.hp; if(e.pHp==null) e.pHp=hp0; if(hp0<e.pHp-0.01) e.noDmgT=0; else e.noDmgT=(e.noDmgT||0)+dt; e.pHp=hp0; if(!e.mode) e.mode='norm';
  /* v27.2: eyes — line of sight from the belly sensor; behind a building it loses the tank and searches the last known spot */
  if(!e.lastSeen) e.lastSeen={x:TK.x,z:TK.z}; e.seeT=(e.seeT||0)-dt;
  if(e.seeT<=0){ e.seeT=0.3; const was=e.sees; e.sees=!TK.dead&&d<(e.mode==='strafe'?85:68)&&losClear(e.x,Math.max(1.5,e.y-1.2),e.z,TK.x,TK.y+1.5,TK.z); if(e.hurtT>2.4) e.sees=true;
    if(e.sees){ e.lastSeen={x:TK.x,z:TK.z}; e.lostT=0; if(!was&&e.lost){ e.lost=false; e.mode='norm'; e.noDmgT=0; sO(900,1300,0.25,0.06,'square'); sO(1300,900,0.25,0.05,'square'); } } else e.lostT=(e.lostT||0)+0.3;
    if(!e.sees&&!e.lost&&e.lostT>2.2){ e.lost=true; e.patT=0; e.pat=null; if(e.mode!=='norm'){ e.mode='norm'; e.sfDir=null; } sO(700,380,0.5,0.06,'sine'); } }
  let tx=TK.x, tz=TK.z, ta=8, maxA=e.ph===3?5.5:4.2, vmaxM=0;
  if(e.st==='crash'){ e.yawV+=dt*2.2; e.h+=e.yawV*dt; e.vy-=6*dt; e.alt+=e.vy*dt; e.vx*=0.995; e.vz*=0.995; e.x+=e.vx*dt; e.z+=e.vz*dt; if(rnd()<0.8) FIRE.spawn(e.x,e.y+0.5,e.z,(rnd()-0.5)*2,2,(rnd()-0.5)*2,1.6,2.5,0.4,1,1,0.6,0.25); SMOKE.spawn(e.x,e.y+1,e.z,0,2,0,1.4,2.2,2.4,0.7,0.06,0.06,0.07);
    hornetPose(e,dt,0,0); if(e.alt<=0.8){ hornetBoom(e); } return; }
  if(e.ph===1){ if(!e.run||e.run.leg>1) e.run=hornetRun(e); const r=e.run; if(e.run.leg===0){ tx=r.sx; tz=r.sz; if(Math.hypot(tx-e.x,tz-e.z)<6) r.leg=1; } else { tx=r.ex; tz=r.ez; if(Math.hypot(tx-e.x,tz-e.z)<6){ r.leg=2; } } ta=7.5; }
  else { e.orb=(e.orb||0)+dt*(e.ph===3?0.42:0.3); const R=e.ph===3?14:19, cx_=e.lost?e.lastSeen.x:TK.x, cz_=e.lost?e.lastSeen.z:TK.z; tx=cx_+Math.cos(e.orb)*R; tz=cz_+Math.sin(e.orb)*R; ta=e.ph===3?6.5:9; }
  /* v27: cannot hurt the tank for a long time → break off, turn around and come back for an attack run */
  if(e.mode==='norm'&&!e.lost&&e.noDmgT>(e.ph===1?15:11)){ e.mode='away'; e.modeT=0; let a=Math.atan2(e.x-TK.x,e.z-TK.z); let ax_=TK.x+Math.sin(a)*58, az_=TK.z+Math.cos(a)*58; if(ax_<14||ax_>WX-14||az_<14||az_>WZ-14){ a+=Math.PI; ax_=TK.x+Math.sin(a)*58; az_=TK.z+Math.cos(a)*58; } e.awayPt={x:clamp(ax_,10,WX-10),z:clamp(az_,10,WZ-10)}; sO(520,300,0.5,0.05,'sine'); }
  if(e.mode==='away'){ e.modeT+=dt; tx=e.awayPt.x; tz=e.awayPt.z; ta=15; vmaxM=21; maxA=7; if(Math.hypot(tx-e.x,tz-e.z)<9||e.modeT>8){ e.mode='strafe'; e.modeT=0; e.sfDir=null; e.rkCD=0; } }
  else if(e.mode==='strafe'){ e.modeT+=dt; const L=d; if(!e.sfDir) e.sfDir=[dx/L,dz/L]; tx=TK.x+e.sfDir[0]*40; tz=TK.z+e.sfDir[1]*40; ta=5.8; vmaxM=27; maxA=10; const past=-(dx*e.sfDir[0]+dz*e.sfDir[1]); if(past>9||e.modeT>10){ e.mode='norm'; e.sfDir=null; e.noDmgT=0; e.run=null; } }
  if(e.lost){ e.patT-=dt; if(!e.pat||e.patT<=0||Math.hypot(e.pat.x-e.x,e.pat.z-e.z)<7){ const a=rnd()*TAU, rr=10+rnd()*26; e.pat={x:clamp(e.lastSeen.x+Math.cos(a)*rr,10,WX-10),z:clamp(e.lastSeen.z+Math.sin(a)*rr,10,WZ-10)}; e.patT=5+rnd()*3; }
    tx=e.pat.x; tz=e.pat.z; ta=7.5; vmaxM=11; maxA=3.6; e.mode='norm'; e.sfDir=null; e.pingT=(e.pingT||0)-dt; if(e.pingT<=0){ e.pingT=2.6; sO(1500,1500,0.08,0.035,'sine'); later(0.35,()=>{ if(!e.dead) sO(1100,1100,0.08,0.03,'sine'); }); } }
  tx=clamp(tx,8,WX-8); tz=clamp(tz,8,WZ-8);
  /* heavy inertia: steer toward a desired velocity with a hard acceleration cap */
  const wdx=tx-e.x, wdz=tz-e.z, wl=Math.hypot(wdx,wdz)||1, vmax=vmaxM||(e.ph===1?15:10), wv=Math.min(vmax,wl*0.6); const ax=clamp((wdx/wl*wv-e.vx)*0.9,-maxA,maxA), az=clamp((wdz/wl*wv-e.vz)*0.9,-maxA,maxA);
  const al=Math.hypot(ax,az), k=al>maxA?maxA/al:1; e.vx+=ax*k*dt; e.vz+=az*k*dt; e.x+=e.vx*dt; e.z+=e.vz*dt; e.x=clamp(e.x,5,WX-5); e.z=clamp(e.z,5,WZ-5);
  const wob=e.ph===3?Math.sin(e.t*3.1)*0.9+Math.sin(e.t*7.3)*0.4:0; const gt=Math.max(groundH(e.x,e.z),colTop(e.x,e.z)); const tA=Math.max(ta+Math.sin(e.t*0.9)*0.6,gt+4.5); e.vy+=((tA-e.alt)*1.2-e.vy*1.6)*dt; e.alt+=e.vy*dt+wob*dt;
  /* heading: along the run in phase 1, at the tank while orbiting */
  const sp=Math.hypot(e.vx,e.vz), want=(e.mode==='away'||e.lost)?Math.atan2(e.vx,e.vz):(e.ph===1&&sp>4?Math.atan2(e.vx,e.vz):Math.atan2(dx,dz)); e.yawCmd=clamp(wrapA(want-e.h)*1.6,-0.7,0.7); e.h=turnTo(e.h,want,dt*(e.mode==='strafe'?2.2:(e.ph===1?0.9:1.3)));
  hornetPose(e,dt,ax*k,az*k);
  /* chin cannon */
  const ang=Math.abs(wrapA(Math.atan2(dx,dz)-e.h)); e.jamT=Math.max(0,(e.jamT||0)-dt); const jam=e.jamT, jx=jam>0?(e.jamX||0)*Math.min(1,jam/0.6):0, jz=jam>0?(e.jamZ||0)*Math.min(1,jam/0.6):0; wmOnce(e); e.tur.lookAt(TK.x+jx,TK.y+1,TK.z+jz); e.brl.rotation.z+=dt*(e.firing?40:4);
  if(e.cnCD<=0&&e.sees&&d<(e.mode==='strafe'?56:36)&&ang<0.6&&e.mode!=='away'){ e.firing=true; e.burst=(e.burst||0)+1; e.cnCD=e.burst%(e.ph===3?8:6)===0?(e.ph===1?2.6:1.9)+rnd()*0.7:0.085; e.cmz.getWorldPosition(_bw);
    if(losTank(_bw.x,_bw.y,_bw.z)){ const sp_=0.8+d*0.06, miss_=rnd()<0.16?3.2:1; eShoot(_bw.x,_bw.y,_bw.z,TK.x+TK.vx*0.2+jx*1.4+(rnd()-0.5)*2*sp_*miss_,TK.y+1+(rnd()-0.5)*sp_*miss_*0.8,TK.z+TK.vz*0.2+jz*1.4+(rnd()-0.5)*2*sp_*miss_,HNW); FIRE.spawn(_bw.x,_bw.y,_bw.z,0,0,0,0.7,1.6,0.05,1,1,0.85,0.4); sfxMgE(); } } else if(e.cnCD>0.5) e.firing=false;
  /* rockets */
  if(e.rkCD<=0&&e.sees&&d<(e.mode==='strafe'?60:40)&&d>9&&ang<0.9&&e.mode!=='away'){ e.rkCD=e.ph===1?7:4.5; for(let n=0;n<6;n++) later(n*0.12,()=>{ if(e.dead) return; const o=e.pods[n%2]; e.g.updateMatrixWorld(true); o.getWorldPosition(_bw); eShoot(_bw.x,_bw.y,_bw.z,TK.x+(rnd()-0.5)*5+jx,TK.y,TK.z+(rnd()-0.5)*5+jz,HNR); FIRE.spawn(_bw.x,_bw.y,_bw.z,0,0,0,1,2,0.12,1,1,0.75,0.35); sfxRocket(); }); }
  /* bombs dropped from the belly (phase 2+) */
  if(e.ph>=2&&e.bombCD<=0&&e.sees&&d<26){ e.bombCD=e.ph===3?7:10; for(let n=0;n<3;n++) later(n*0.35,()=>{ if(e.dead) return; const b=newEnemy('bomb',e.x,e.z); buildE(b); b.state='fly'; b.fy=e.y-0.8; sO(1500,420,0.9,0.045,'sine'); const T=1.0, a=rnd()*TAU; b.fv={x:e.vx*0.6+Math.cos(a)*2,z:e.vz*0.6+Math.sin(a)*2,y:-2}; b.aggro=true; b.noCol=true; b.noScrap=true; b.fromBoss=true; sO(500,200,0.3,0.05,'sine'); }); }
  /* flares break a lock-on */
  if(AIM.lockE===e&&e.flCD<=0&&e.ph>=2){ e.flCD=10; e.lockable=false; AIM.lockE=null; later(2.2,()=>{ if(!e.dead) e.lockable=true; }); for(let n=0;n<16;n++){ const a=rnd()*TAU; spark(e.x,e.y-0.5,e.z,Math.cos(a)*6,2-rnd()*4,Math.sin(a)*6,1,0.85,0.5,1.6+rnd()); } sNz(0.5,'highpass',2500,0.7,0.12); toast('«Шершень» отстрелил ловушки — захват сорван'); }
  /* downwash: dust ring and a push when it hovers low over the tank */
  if(d<8&&e.alt<12){ const k2=(1-d/8)*(1-(e.alt-6)/8); TK.vx+=dx/d*k2*dt*9; TK.vz+=dz/d*k2*dt*9; if(rnd()<0.5){ const a=rnd()*TAU; debSpawn(TK.x+Math.cos(a)*3,0.15,TK.z+Math.sin(a)*3,Math.cos(a)*7,1.5,Math.sin(a)*7,0.6,0.6,0.62,0.12); } }
  if(e.ph===3&&rnd()<0.5){ const D0=e.ducts[0]; D0.piv.getWorldPosition(_bw); SMOKE.spawn(_bw.x,_bw.y,_bw.z,(rnd()-0.5),1,(rnd()-0.5),0.8,2,1.8,0.6,0.05,0.05,0.06); if(rnd()<0.2) spark(_bw.x,_bw.y,_bw.z,(rnd()-0.5)*8,rnd()*4,(rnd()-0.5)*8,1,0.7,0.3,0.4); }
  e.rotSnd=(e.rotSnd||0)-dt; if(e.rotSnd<=0){ e.rotSnd=0.09; sNz(0.09,'lowpass',260,1,0.06*clamp(1.4-d/50,0.2,1)); }
  /* v27.2: voice of the Hornet — turbine whine that follows its speed, ion hum, fly-by whoosh, alarms, sputtering engine in the last phase */
  { const sp2=Math.hypot(e.vx,e.vz), near=clamp(1.5-d/55,0.15,1); e.whT=(e.whT||0)-dt;
    if(e.whT<=0){ e.whT=0.18; sO(170+sp2*8,176+sp2*8,0.22,0.03*near,'sawtooth'); sO(2300+sp2*45,2340+sp2*45,0.2,0.009*near,'sine'); sO(92+sp2*1.5,95+sp2*1.5,0.22,0.03*near,'sine'); }
    e.ihT=(e.ihT||0)-dt; if(e.ihT<=0){ e.ihT=0.5; sNz(0.5,'highpass',5200,0.6,0.012*near); }
    if(e.ph===3){ e.spT=(e.spT||0)-dt; if(e.spT<=0){ e.spT=0.5+rnd()*1.4; sNz(0.16,'lowpass',380+rnd()*200,0.8,0.1*near); sO(240,90,0.16,0.05*near,'sawtooth'); } }
    if(e.pph!==e.ph){ if(e.pph) { sO(660,440,0.28,0.07,'square'); later(0.34,()=>sO(660,440,0.28,0.07,'square')); sNz(0.9,'lowpass',700,0.8,0.12); } e.pph=e.ph; }
    if(e.pmode!==e.mode){ if(e.mode==='strafe') { sNz(1.4,'bandpass',700,1.3,0.16); sO(260,780,1.3,0.06,'sawtooth'); } else if(e.mode==='away') sO(200,520,1.2,0.05,'sawtooth'); e.pmode=e.mode; } }
  e.beacon.color.setRGB((e.t*2%1)<0.15?1:0.15,0.05,0.04); eyeColor(e,true,e.firing); }
const HNW={speed:72,g:0,spread:0.05,radius:0.32,power:0.55,dmg:3.0,kind:'bullet',burst:1,gap:0,mag:99};
const HNR={speed:38,g:2.5,spread:0.04,radius:1.4,power:0.9,dmg:11,kind:'shell',size:0.55,burst:1,gap:0,mag:99};
/* v27.3: phase 2+ — a hit shoves and tilts the machine and throws the gunner's aim off for a moment */
function hornetHit(e,dmg,dx,dz,src){ if(e.st==='crash') return;
  /* v27.4: it will not stand still and be shot: a long unbroken stream of hits makes it break off and come back for a run */
  { const gap=e.t-(e.lastHitT==null?-9:e.lastHitT); e.streak=gap<1.0?(e.streak||0)+gap:0; e.lastHitT=e.t; if(e.streak>4.2&&e.mode==='norm'&&!e.lost){ e.noDmgT=99; e.streak=0; } }
  if(e.ph<2||src==='area') return; const l=Math.hypot(dx,dz)||1, k=Math.min(1,0.45+dmg/70), ch=Math.cos(e.h), sh=Math.sin(e.h);
  e.vx+=dx/l*2.6*k; e.vz+=dz/l*2.6*k; e.hkP=(dx*sh+dz*ch)/l*0.3; e.hkR=-(dx*ch-dz*sh)/l*0.34; e.hitK=1; e.jamT=1.2; e.jamX=(rnd()-0.5)*9; e.jamZ=(rnd()-0.5)*9; e.cnCD=Math.max(e.cnCD,0.5); e.yawV=(e.yawV||0);
  if(e.g){ e.g.updateMatrixWorld(true); for(let n=0;n<4;n++) spark(e.x,e.y+0.4,e.z,(rnd()-0.5)*6,rnd()*4,(rnd()-0.5)*6,1,0.7,0.35,0.3); } sO(260,140,0.14,0.07,'square'); }
function hornetPose(e,dt,ax,az){ const ch=Math.cos(e.h), sh=Math.sin(e.h), aF=ax*sh+az*ch, aR=ax*ch-az*sh;
  e.tp+=(clamp(aF*0.07,-0.35,0.35)-e.tp)*Math.min(1,dt*3); e.tr+=(clamp(-aR*0.08,-0.45,0.45)-e.tr)*Math.min(1,dt*3); e.hitK=Math.max(0,(e.hitK||0)-dt*1.7); e.fus.rotation.set(e.tp+(e.hkP||0)*e.hitK,0,e.tr+(e.hkR||0)*e.hitK);
  const vF=e.vx*sh+e.vz*ch; for(const D of e.ducts){ D.piv.rotation.x=clamp(vF*0.04,-0.45,0.45); D.bl.rotation.y+=dt*(e.st==='crash'&&D.s<0?8:38)*D.s; }
  /* v27: control surfaces follow the commanded accelerations; ion thrusters pulse with climb and acceleration */
  const kk=Math.min(1,dt*6), pt=clamp(-aF*0.11-(e.vy||0)*0.03,-0.5,0.5), rl=clamp(aR*0.14,-0.5,0.5), yw=clamp(-(e.yawCmd||0)*0.7,-0.55,0.55);
  e.elP=(e.elP||0)+(pt-(e.elP||0))*kk; e.elR=(e.elR||0)+(rl-(e.elR||0))*kk; e.rdY=(e.rdY||0)+(yw-(e.rdY||0))*kk;
  if(e.elev){ e.elev[0].rotation.x=e.elP+e.elR; e.elev[1].rotation.x=e.elP-e.elR; e.rud.rotation.y=e.rdY; }
  if(e.ion){ const th=clamp(0.45+(e.vy||0)*0.1+Math.hypot(ax,az)*0.12+(e.st==='crash'?-0.3:0),0.15,1); e.ionM.color.setRGB(0.25+0.45*th,0.7+0.3*th,1);
    const fl=0.88+0.12*Math.sin(e.t*53)+0.06*Math.sin(e.t*91);
    for(const I of e.ion){ I.g.rotation.x=e.tp*0.8; I.g.rotation.z=-e.tr*0.8; const L=(0.7+th*2.6)*fl; I.pl.scale.set(1+0.15*th,L,1+0.15*th); I.pl.position.y=-0.5-L/2; I.pl.material.opacity=(0.28+0.5*th)*fl;
      I.core.scale.set(1,L*0.62,1); I.core.position.y=-0.5-L*0.31; I.core.material.opacity=(0.5+0.5*th)*fl; I.halo.scale.setScalar(0.8+th*0.9*fl); I.halo2.scale.copy(I.halo.scale); I.halo.position.y=I.halo2.position.y=-0.55; I.halo.material.opacity=0.45+0.5*th;
      I.dia.forEach((dm,k)=>{ const u=(k+1)/(I.dia.length+0.6); dm.position.y=-0.55-u*L*0.8; const sc=(1-u)*0.9*(0.7+0.3*Math.sin(e.t*40+k*1.7)); dm.scale.set(sc,sc*1.7,sc); dm.visible=th>0.35; }); }
    if(dt>0){ const hi=Q==='high', rate=(hi?120:30)*th; e.ionAcc=(e.ionAcc||0)+dt*rate; if(e.ionAcc>=1) wmOnce(e);
      while(e.ionAcc>=1){ e.ionAcc-=1; const I=e.ion[(rnd()*2)|0]; I.g.getWorldPosition(_bw); const jx=(rnd()-0.5)*0.35, jz=(rnd()-0.5)*0.35;
        spark(_bw.x+jx,_bw.y-0.6,_bw.z+jz,e.vx*0.7+(rnd()-0.5)*1.8,-4-rnd()*5-th*3,e.vz*0.7+(rnd()-0.5)*1.8,0.4+rnd()*0.3,0.8+rnd()*0.2,1,0.35+rnd()*0.45);
        if(hi&&rnd()<0.28) FIRE.spawn(_bw.x+jx,_bw.y-0.8,_bw.z+jz,e.vx*0.5,-2-rnd()*2,e.vz*0.5,0.35,0.9,0.28,0.45,0.85,1,0.5); } } }
  e.yOv=e.alt; }
function hornetBoom(e){ if(e.boomed) return; e.boomed=true; bossDeath(e,{k:3.6,y:Math.max(e.y,1.8)+0.4,scrap:600,n:7}); }
function dieHornet(e,dx,dz,src){ e.dead=false; e.dying=true; e.st='crash'; e.vy=-1; e.yawV=1.2; e.inv=true; e.lockable=false; sO(400,60,2.5,0.14,'sawtooth'); sNz(2.5,'lowpass',500,0.7,0.3); }

