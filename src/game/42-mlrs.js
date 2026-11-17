/* ================= v29: «РСЗО-537» — rocket salvo (E) =================
   Press E: the truck must stand or crawl; the pack tilts up, rockets leave one by one straight up
   (side backblast, whip + receding roar), then fall from above onto the point chosen at the moment of the press
   (locked enemy's position, else the aim point), each with its own scatter, an incoming whistle and a shell-size blast.
   Own salvo stock (ST.ammo.sv, cap grows with «Боеукладка»), one salvo per RSZ_CD seconds, 4/6/8 rockets by the ability upgrade. */
const rszGeo={body:new THREE.CylinderGeometry(0.1,0.1,1.2,8).rotateX(Math.PI/2),nose:new THREE.ConeGeometry(0.1,0.3,8).rotateX(Math.PI/2),fin:new THREE.BoxGeometry(0.42,0.03,0.2),fin2:new THREE.BoxGeometry(0.03,0.42,0.2),fl:new THREE.SphereGeometry(0.2,8,6)};
const rszMat={body:new THREE.MeshBasicMaterial({color:0xd9dcd5}),nose:new THREE.MeshBasicMaterial({color:0xd8322a}),fin:new THREE.MeshBasicMaterial({color:0x2a2d31}),fl:new THREE.MeshBasicMaterial({color:0xffb04a}),mk:new THREE.MeshBasicMaterial({color:0xffc21b,transparent:true,opacity:0.8,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})};
const rszPool=[], _rsA=new THREE.Vector3(), _rsB=new THREE.Vector3(), _rsC=new THREE.Vector3();
function rszMesh(){ let g=rszPool.pop(); if(!g){ g=new THREE.Group(); g.add(new THREE.Mesh(rszGeo.body,rszMat.body)); const n=new THREE.Mesh(rszGeo.nose,rszMat.nose); n.position.z=0.75; g.add(n);
    for(const gg of [rszGeo.fin,rszGeo.fin2]){ const f=new THREE.Mesh(gg,rszMat.fin); f.position.z=-0.5; g.add(f); } const fl=new THREE.Mesh(rszGeo.fl,rszMat.fl); fl.position.z=-0.72; fl.scale.set(1,1,2); g.add(fl); scene.add(g); }
  g.visible=true; return g; }
function rszFree(r){ r.m.visible=false; rszPool.push(r.m); }
/* own yellow target ring (the red one means «danger for you») */
function rszMark(x,z,r,T){ const g=new THREE.Group(), s=new THREE.Group(); g.add(s); s.add(new THREE.Mesh(tgtGeo.ring,rszMat.mk)); s.add(new THREE.Mesh(tgtGeo.in,rszMat.mk));
  for(let k=0;k<4;k++){ const t=new THREE.Mesh(tgtGeo.tick,rszMat.mk), a=k/4*TAU; t.position.set(Math.cos(a)*0.68,0,Math.sin(a)*0.68); t.rotation.y=-a+Math.PI/2; s.add(t); }
  g.scale.setScalar(r); g.position.set(x,groundH(x,z)+0.1,z); g.renderOrder=7; scene.add(g); EXTRAS.push(g); const o={g,s,t:0,T,spin:1.2}; TGTS.push(o); return o; }
/* while the pack is up the truck only crawls */
function mlrsVK(){ return MLRS.st==='raise'||MLRS.st==='fire'?0.15:1; }
function mlrsReady(){ return MLRS.st==='idle'&&MLRS.cd<=0&&(ST.ammo.sv|0)>0; }
function mlrsPress(){ if(chs().abil!=='mlrs'||TK.dead||transit||!tank||!tank.rszPod) return;
  if(LOC.safe){ toast('В лагере залп запрещён'); return; }
  if(MLRS.st!=='idle') return;
  if(MLRS.cd>0){ sfxClick(); toast(`РСЗО перезаряжается · ${Math.ceil(MLRS.cd)} с`); return; }
  if((ST.ammo.sv|0)<=0){ sfxClick(); toast('Залпов нет · пополнение в лагере'); return; }
  if(Math.abs(TK.vF)>2.4){ sfxClick(); toast('Для залпа остановись или ползи'); return; }
  const e=AIM.lockE&&!AIM.lockE.dead&&AIM.lockE.state!=='fly'?AIM.lockE:null; let tx=AIM.x, tz=AIM.z; if(e){ tx=e.x; tz=e.z; }
  let dx=tx-TK.x, dz=tz-TK.z, d=Math.hypot(dx,dz); if(d<0.5){ dx=Math.sin(TK.h); dz=Math.cos(TK.h); d=1; }
  const dd=clamp(d,RSZ_MIN,RSZ_MAX); tx=clamp(TK.x+dx/d*dd,2,WX-2); tz=clamp(TK.z+dz/d*dd,2,WZ-2);
  ST.ammo.sv--; MLRS.N=RSZ_N[UP.abl|0]; MLRS.st='raise'; MLRS.t=0; MLRS.k=0; MLRS.gap=0; MLRS.cd=RSZ_CD; MLRS.tgt={x:tx,z:tz,e}; MLRS.loc=LOC_ID;
  MLRS.mk=rszMark(tx,tz,RSZ_SPREAD+1.3,0.9+MLRS.N*0.2+1.5+RSZ_FALL);
  sO(85,150,0.95,0.07,'sawtooth'); sNz(0.95,'bandpass',420,0.8,0.06,0.1); sfxClank(0.4); abilHud(); }
function rszPose(T){ const a=MLRS.ang, e=a*a*(3-2*a), th=-e*RSZ_ELEV; T.rszPod.rotation.x=th;
  if(T.rszRam){ const ay=1.62-1.5*Math.sin(th), az=-2.2+1.5*Math.cos(th), vy=ay-1.25, vz=az+0.62; T.rszRam.g.rotation.x=Math.atan2(vz,vy); T.rszRam.rod.scale.y=Math.max(0.3,Math.hypot(vy,vz)); } }
function rszLaunch(k){ const T=tank, mz=T.rszMuz[k%T.rszMuz.length]; T.root.updateMatrixWorld(true); mz.getWorldPosition(_rsA); T.rszPod.getWorldDirection(_rsB);
  const sp=26, r={m:rszMesh(),st:'up',t:0,x:_rsA.x,y:_rsA.y,z:_rsA.z,vx:_rsB.x*sp+(rnd()-0.5)*1.5,vy:_rsB.y*sp,vz:_rsB.z*sp+(rnd()-0.5)*1.5,ix:0,iz:0,sx:0,sy:0,sz:0,delay:1.35+k*0.2+rnd()*0.12};
  const a=rnd()*TAU, rr=Math.sqrt(rnd())*RSZ_SPREAD; r.ox=Math.cos(a)*rr; r.oz=Math.sin(a)*rr; r.g=MLRS.tgt; r.m.position.copy(_rsA); MLRS.list.push(r);
  const G=P.glow2, rx=Math.cos(TK.h), rz=-Math.sin(TK.h);
  FIRE.spawn(_rsA.x,_rsA.y,_rsA.z,_rsB.x*4,_rsB.y*4,_rsB.z*4,1.3,2.6,0.12,1,1,0.85,0.5);
  T.rszBlast.forEach((b,i)=>{ const s=i?1:-1; b.getWorldPosition(_rsC); for(let n=0;n<3;n++) FIRE.spawn(_rsC.x,_rsC.y,_rsC.z,s*rx*(5+rnd()*4)-_rsB.x*2,0.6+rnd(),s*rz*(5+rnd()*4)-_rsB.z*2,0.9+rnd()*0.5,2.4,0.22,1,G[0],G[1],G[2]);
    for(let n=0;n<2;n++) SMOKE.spawn(_rsC.x,_rsC.y,_rsC.z,s*rx*(3+rnd()*2),0.8+rnd(),s*rz*(3+rnd()*2),1.0,2.2,1.4,0.5,0.78,0.78,0.8); });
  shake=Math.min(1,shake+0.12); TK.pitchV+=0.25; camPunch=Math.max(camPunch,0.25);
  sNz(0.22,'highpass',2600,0.7,0.34); sO(1500,240,0.95,0.1,'sawtooth'); sNz(1.2,'bandpass',950,0.7,0.16,0.02); sO(90,40,0.35,0.22); }
function rszImpact(r,x,y,z){ explode(x,y,z,RSZ_RAD,RSZ_PWR,0,-1,0,'shell',null,0,null,1); groundFlash(x,z,5.5,P.glow2,0.25); if(y<groundH(x,z)+1) craterAt(x,z,1.5,0.32);
  const d=Math.hypot(TK.x-x,TK.z-z); shake=Math.min(1,shake+Math.max(0.05,0.35-d*0.006)); rszFree(r); }
function rszRockets(dt){ const L=MLRS.list; for(let i=L.length-1;i>=0;i--){ const r=L[i]; r.t+=dt;
    if(r.st==='up'){ const v=Math.hypot(r.vx,r.vy,r.vz), k=Math.min(70,v+dt*55)/v; r.vx*=k; r.vy*=k; r.vz*=k; r.x+=r.vx*dt; r.y+=r.vy*dt; r.z+=r.vz*dt;
      r.m.position.set(r.x,r.y,r.z); _rsC.set(r.x+r.vx,r.y+r.vy,r.z+r.vz); r.m.lookAt(_rsC);
      SMOKE.spawn(r.x,r.y,r.z,(rnd()-0.5),-1,(rnd()-0.5),0.55,1.8,1.3,0.55,0.8,0.8,0.82); if(rnd()<0.7) FIRE.spawn(r.x,r.y,r.z,-r.vx*0.05,-r.vy*0.05,-r.vz*0.05,0.5,1.5,0.06,1,1,0.75,0.35);
      if(r.t>1.0){ r.st='wait'; r.m.visible=false; } }
    else if(r.st==='wait'){ if(r.t>=r.delay){ r.st='down'; r.t=0; r.m.visible=true; r.ix=clamp(r.g.x+r.ox,1,WX-1); r.iz=clamp(r.g.z+r.oz,1,WZ-1); const ox=TK.x-r.ix, oz=TK.z-r.iz, ol=Math.hypot(ox,oz)||1;
        r.sx=r.ix+ox/ol*14; r.sz=r.iz+oz/ol*14; r.sy=groundH(r.ix,r.iz)+46; r.x=r.sx; r.y=r.sy; r.z=r.sz;
        const ps=sndAt(r.ix,r.iz); sO(2600,650,RSZ_FALL,0.09,'sine'); sNz(RSZ_FALL,'bandpass',1800,1.4,0.17,RSZ_FALL*0.85); sndOff(ps); } }
    else { if(r.g.e&&!r.g.e.dead&&r.t<RSZ_FALL*0.8){ r.ix=clamp(r.g.x+r.ox,1,WX-1); r.iz=clamp(r.g.z+r.oz,1,WZ-1); } const gy=groundH(r.ix,r.iz), k=Math.min(1,r.t/RSZ_FALL), ox=r.x, oy=r.y, oz=r.z;
      r.x=r.sx+(r.ix-r.sx)*k; r.z=r.sz+(r.iz-r.sz)*k; r.y=r.sy+(gy+0.3-r.sy)*(0.35*k+0.65*k*k);
      const dx=r.x-ox, dy=r.y-oy, dz=r.z-oz, len=Math.hypot(dx,dy,dz)||1e-6;
      r.m.position.set(r.x,r.y,r.z); _rsC.set(r.x+dx,r.y+dy,r.z+dz); r.m.lookAt(_rsC); SMOKE.spawn(ox,oy,oz,0,0.6,0,0.45,1.5,0.8,0.5,0.8,0.8,0.82);
      if(len>1e-4){ const ux=dx/len, uy=dy/len, uz=dz/len; let be=null, bt=Infinity; for(const e of ENEMIES){ if(e.dead||e.state==='fly'||e.xhide) continue; const t=segSphere(ox,oy,oz,ux,uy,uz,len,e.x,e.y+e.hy,e.z,e.shOn?e.shieldR:e.hr); if(t>=0&&t<bt){ bt=t; be=e; } }
        if(be&&!(raycast(ox,oy,oz,ux,uy,uz,len)&&RH.t<bt)){ const hx=ox+ux*bt, hy=oy+uy*bt, hz=oz+uz*bt; enemyHit(be,RSZ_DIRECT,0,0,2,'top'); if(be.shOn&&be.shellHit) be.shellHit(be,hx,hy,hz); L.splice(i,1); rszImpact(r,hx,hy,hz); continue; } }
      if(len>1e-4&&raycast(ox,oy,oz,dx/len,dy/len,dz/len,len)){ L.splice(i,1); rszImpact(r,RH.x,Math.max(0.05,RH.y),RH.z); continue; }
      if(k>=1){ L.splice(i,1); rszImpact(r,r.ix,gy+0.4,r.iz); continue; } } } }
function mlrsClear(){ for(const r of MLRS.list) rszFree(r); MLRS.list.length=0; MLRS.st='idle'; MLRS.ang=0; MLRS.k=0; if(tank&&tank.rszPod) rszPose(tank); }
function mlrsUpdate(dt){ MLRS.cd=Math.max(0,MLRS.cd-dt);
  { const g=MLRS.tgt, e=g&&g.e; if(e&&!e.dead&&e.state!=='fly'){ g.x=e.x; g.z=e.z; if(MLRS.mk&&MLRS.mk.t<MLRS.mk.T) MLRS.mk.g.position.set(g.x,groundH(g.x,g.z)+0.1,g.z); } }
  if(MLRS.loc!==LOC_ID&&(MLRS.list.length||MLRS.st!=='idle')){ mlrsClear(); abilHud(); }
  const T=tank, on=!!(T&&T.rszPod&&chs().abil==='mlrs');
  if(!on){ if(MLRS.st!=='idle'){ MLRS.st='idle'; MLRS.ang=0; } }
  else { MLRS.t+=dt;
    if(TK.dead&&(MLRS.st==='raise'||MLRS.st==='fire')){ MLRS.st='lower'; MLRS.t=0; }
    if(MLRS.st==='raise'){ MLRS.ang=Math.min(1,MLRS.ang+dt/0.9); if(MLRS.ang>=1){ MLRS.st='fire'; MLRS.t=0; MLRS.gap=0; } }
    else if(MLRS.st==='fire'){ MLRS.gap-=dt; if(MLRS.gap<=0&&MLRS.k<MLRS.N){ rszLaunch(MLRS.k); MLRS.k++; MLRS.gap=0.17; } if(MLRS.k>=MLRS.N&&MLRS.gap<=-0.5){ MLRS.st='lower'; MLRS.t=0; sO(150,80,1.2,0.06,'sawtooth'); sNz(1.2,'bandpass',380,0.8,0.05,0.1); } }
    else if(MLRS.st==='lower'){ MLRS.ang=Math.max(0,MLRS.ang-dt/1.3); if(MLRS.ang<=0){ MLRS.st='idle'; sfxClank(0.35); abilHud(); } }
    rszPose(T); }
  rszRockets(dt); }
/* rear tandem: each side's two axles share a balance beam that follows the ground */
function rszBogies(T){ const ch=Math.cos(TK.h), sh=Math.sin(TK.h);
  for(const b of T.bogies){ const lx=b.s*1.32; let h1=0, h2=0; for(const [lz,o] of [[-0.85,0],[-1.95,1]]){ const h=groundH(TK.x+lx*ch+lz*sh,TK.z-lx*sh+lz*ch); if(o) h2=h; else h1=h; }
    b.g.position.y=0.66+clamp((h1+h2)/2-TK.y,-0.1,0.1); b.g.rotation.x=clamp(-Math.atan2(h1-h2,1.1),-0.18,0.18); } }
