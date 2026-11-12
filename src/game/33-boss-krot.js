/* =================================================================================== */
/* «КРОТ» — drilling rig on WWI rhomboid tracks, MLRS on the roof, side MGs, burrows   */
/* =================================================================================== */
const KR_TRACK=[[-4.8,1.05],[-3.3,3.25],[3.5,3.25],[5.5,1.0],[3.7,0.0],[-3.0,0.0]];
function buildKrot(e){ Object.assign(e,{r:3.4,hy:1.8,hr:3.1,mass:30,turn:0.8,acc:2.4,speedW:3.4,navR:3.6,xrR:7.2,st:'roam',stT:0,out:0,lift:0,drill:0,dig:0,salvoN:0,rkCD:4,mgCD:[0,0],trkS:0,spawned:[],noCol:false});
  const Y=emat(e,0xd49524), D=emat(e,0x23252a), R=emat(e,0x6a3a22), Mt=emat(e,0x8d96a1), St=emat(e,0x5d6570), Hz=emapMat(e,TEXS.haz); e.eyeM=eglow(e,0xff6a1e); const B=e.body;
  /* hull between the tracks */
  ep(e,EGEO.box,Y,B,0,2.0,-0.2,3.6,2.2,7.8,true); ep(e,EGEO.box,D,B,0,3.16,-0.4,3.3,0.12,7.0); ep(e,EGEO.box,Hz,B,0,1.2,3.75,3.62,0.4,0.04);
  ep(e,EGEO.box,St,B,0,2.6,3.7,2.4,1.2,0.3,true); for(const s of [-1,1]) ep(e,EGEO.box,e.eyeM,B,s*0.7,2.75,3.87,0.5,0.14,0.02);
  for(let k=0;k<7;k++) ep(e,EGEO.box,D,B,-1.5+k*0.5,3.24,-3.6,0.06,0.06,0.9);
  /* rear engine block, exhaust stacks */
  ep(e,EGEO.box,St,B,0,2.4,-4.4,3.0,1.6,1.4,true); for(let k=0;k<6;k++) ep(e,EGEO.box,D,B,-1.2+k*0.48,2.4,-5.12,0.08,1.2,0.04);
  e.exh=[]; for(const s of [-1,1]){ ep(e,EGEO.cyl,D,B,s*1.0,4.0,-4.2,0.36,1.9,0.36,true); ep(e,EGEO.cyl,R,B,s*1.0,5.0,-4.2,0.46,0.18,0.46); const o=new THREE.Object3D(); o.position.set(s*1.0,5.15,-4.2); B.add(o); e.exh.push(o); }
  /* rhomboid tracks: armoured side frames + moving plates around the lozenge */
  e.trk=[]; const P_=KR_TRACK, seg=[]; let L=0; for(let i=0;i<P_.length;i++){ const a=P_[i], b=P_[(i+1)%P_.length], l=Math.hypot(b[0]-a[0],b[1]-a[1]); seg.push([a,b,l,L]); L+=l; } e.trkL=L; e.trkSeg=seg;
  for(const s of [-1,1]){ const side=new THREE.Group(); side.position.x=s*2.45; B.add(side);
    for(const [a,b,l] of seg){ const m=ep(e,EGEO.box,D,side,0,(a[1]+b[1])/2,(a[0]+b[0])/2,1.15,0.32,l+0.2); m.rotation.x=-Math.atan2(b[1]-a[1],b[0]-a[0]); }
    const pan=ep(e,EGEO.box,Y,side,s*0.62,1.62,0.3,0.12,2.4,7.0,true); void pan; ep(e,EGEO.box,Hz,side,s*0.69,0.75,0.3,0.02,0.3,6.2);
    for(let k=0;k<9;k++){ ep(e,EGEO.joint,Mt,side,s*0.69,2.5,-3.1+k*0.8,0.08); ep(e,EGEO.joint,Mt,side,s*0.69,0.95,-2.6+k*0.7,0.08); }
    for(let k=0;k<6;k++){ const w=ep(e,EGEO.cyl,St,side,0,0.5,-2.6+k*1.15,0.62,1.2,0.62); w.rotation.z=Math.PI/2; }
    const pl=[]; for(let k=0;k<30;k++){ const p=ep(e,EGEO.box,St,side,0,0,0,1.22,0.16,0.42); p.userData.keep=true; pl.push(p); } e.trk.push(pl);
    /* sponson with a machine gun */
    const sp=new THREE.Group(); sp.position.set(s*3.25,1.7,0.4); B.add(sp); ep(e,EGEO.box,Y,sp,0,0,0,0.9,1.2,1.8,true); ep(e,EGEO.box,D,sp,s*0.46,0.1,0,0.04,0.5,1.2);
    const gun=new THREE.Group(); gun.position.set(s*0.5,0.15,0.3); sp.add(gun); ep(e,EGEO.joint,D,gun,0,0,0,0.38); const brl=ep(e,EGEO.cyl,D,gun,s*0.5,0,0,0.13,1.2,0.13); brl.rotation.z=Math.PI/2; const ja=ep(e,EGEO.cyl,Mt,gun,s*0.75,0,0,0.2,0.5,0.2); ja.rotation.z=Math.PI/2;
    const mz=new THREE.Object3D(); mz.position.set(s*1.15,0,0); gun.add(mz); (s<0?e:e).mgL=s<0?{gun,mz}:e.mgL; if(s>0) e.mgR={gun,mz};
    /* hydraulic outrigger: cylinder + rod + foot pad */
    const og=new THREE.Group(); og.position.set(s*2.4,1.1,-1.6); B.add(og); const cy=ep(e,EGEO.cyl,Mt,og,0,0,0,0.3,1.0,0.3,true); cy.rotation.z=Math.PI/2;
    const rod=new THREE.Group(); og.add(rod); const rr=ep(e,EGEO.cyl,gmat(0xd8dde4),rod,s*0.6,0,0,0.16,1.2,0.16); rr.rotation.z=Math.PI/2;
    const foot=new THREE.Group(); rod.add(foot); ep(e,EGEO.box,D,foot,s*1.2,-0.3,0,0.3,0.8,0.3); ep(e,EGEO.box,Hz,foot,s*1.2,-0.75,0,1.1,0.14,1.1,true);
    (e.outr=e.outr||[]).push({og,rod,foot,s}); }
  /* the drill: housing + cone with spiral flutes */
  const dh=ep(e,EGEO.cyl,St,B,0,1.8,4.3,1.5,0.8,1.5,true); dh.rotation.x=Math.PI/2; ep(e,EGEO.ring,Y,B,0,1.8,4.75,3.0).rotation.x=0;
  const dr=new THREE.Group(); dr.position.set(0,1.8,4.7); B.add(dr); e.drillG=dr; const cone=new THREE.Mesh(new THREE.ConeGeometry(1.35,3.4,16),emat(e,0x8f8e86)); cone.rotation.x=Math.PI/2; cone.position.z=1.7; dr.add(cone);
  { const o=new THREE.Mesh(cone.geometry,outlineMat); o.scale.setScalar(1.06); cone.add(o); }
  for(let k=0;k<26;k++){ const t=k/26, a=t*TAU*2.4, rr=1.3*(1-t)+0.1, z=0.2+t*3.2; const f=ep(e,EGEO.box,D,dr,Math.cos(a)*rr,Math.sin(a)*rr,z,0.14,0.42*(1-t)+0.1,0.3); f.rotation.z=a; }
  /* roof MLRS: turntable, lift arm, 4×3 tube box */
  const lb=new THREE.Group(); lb.position.set(0,3.3,-1.6); B.add(lb); ep(e,EGEO.cyl,D,lb,0,0.1,0,1.8,0.2,1.8);
  const arm=new THREE.Group(); arm.position.set(0,0.3,-1.0); lb.add(arm); e.lift=0; e.liftG=arm; for(const s of [-1,1]){ const h=ep(e,EGEO.cyl,Mt,lb,s*0.9,0.6,0.4,0.16,1.2,0.16); h.rotation.x=0.6; }
  const box_=new THREE.Group(); box_.position.set(0,0.75,1.4); arm.add(box_); ep(e,EGEO.box,R,box_,0,0,0,2.7,1.4,3.2,true); ep(e,EGEO.box,Hz,box_,0,0.72,0,2.72,0.04,3.0);
  e.tubes=[]; for(let i=0;i<4;i++) for(let j=0;j<3;j++){ const x=-0.95+i*0.63, y=-0.42+j*0.42; ep(e,EGEO.disc,PKM.hole,box_,x,y,1.61,0.38); const o=new THREE.Object3D(); o.position.set(x,y,1.7); box_.add(o); e.tubes.push(o); }
  /* v27: caked with soil — it has just come out of the ground */
  { const Ms=emat(e,0x5a3f27), Ms2=emat(e,0x3d2a1a), Ms3=emat(e,0x7b5c3a), Gr=emat(e,0x6d7068);
    const patch=(par,x,y,z,sx,sy,sz,m)=>{ const p=ep(e,EGEO.box,m,par,x,y,z,sx,sy,sz); p.rotation.set((rnd()-0.5)*0.5,rnd()*TAU,(rnd()-0.5)*0.5); return p; };
    for(let k=0;k<64;k++){ const m=[Ms,Ms2,Ms3][k%3];
      if(k<20) patch(B,(rnd()-0.5)*3.2,3.16,-3.8+rnd()*7.4,0.4+rnd()*1.0,0.1+rnd()*0.16,0.4+rnd()*0.9,m);
      else if(k<40){ const sd=rnd()<0.5?-1:1; patch(B,sd*1.84,0.85+rnd()*1.7,-3.9+rnd()*7.6,0.12+rnd()*0.1,0.3+rnd()*0.8,0.4+rnd()*1.1,m); }
      else if(k<50) patch(B,(rnd()-0.5)*3.2,0.95+rnd()*1.8,3.76,0.5+rnd()*1.0,0.3+rnd()*0.6,0.1,m);
      else { const sd=rnd()<0.5?-1:1; patch(B,sd*(3.05+rnd()*0.12),0.25+rnd()*2.8,-4.2+rnd()*9,0.12,0.2+rnd()*0.5,0.5+rnd()*1.4,m); } }
    for(let k=0;k<20;k++){ const a=rnd()*TAU, rr=0.5+rnd()*0.8, z=0.1+rnd()*2.8; patch(dr,Math.cos(a)*rr,Math.sin(a)*rr,z,0.25+rnd()*0.45,0.25+rnd()*0.4,0.3+rnd()*0.5,[Ms,Ms2,Ms3,Gr][k%4]); }
    for(let k=0;k<9;k++){ const rt=ep(e,EGEO.cyl,Ms2,B,(rnd()-0.5)*3.2,0.7+rnd()*1.4,3.9,0.05,0.9+rnd()*1.1,0.05); rt.rotation.set((rnd()-0.5)*0.7,0,(rnd()-0.5)*0.7); }
    for(let k=0;k<5;k++) patch(B,(rnd()-0.5)*2.6,3.3,-3+rnd()*5,0.35+rnd()*0.35,0.3+rnd()*0.3,0.35+rnd()*0.35,Gr); }
  B.scale.setScalar(1.0); }
function krotPose(e,dt){ /* tracks */ e.trkS=(e.trkS+(e.vF||0)*dt)%e.trkL; const L=e.trkL;
  for(const pl of e.trk){ for(let k=0;k<pl.length;k++){ let s=((k/pl.length)*L+e.trkS)%L; if(s<0) s+=L; let sg=e.trkSeg[0]; for(const q of e.trkSeg){ if(s>=q[3]&&s<q[3]+q[2]){ sg=q; break; } } const t=(s-sg[3])/sg[2], a=sg[0], b=sg[1];
      pl[k].position.set(0,a[1]+(b[1]-a[1])*t,a[0]+(b[0]-a[0])*t); pl[k].rotation.x=-Math.atan2(b[1]-a[1],b[0]-a[0]); } }
  e.drillG.rotation.z+=dt*(e.drill*14+0.6); e.liftG.rotation.x=-e.lift*1.0;
  for(const o of e.outr){ o.rod.position.x=o.s*e.out*1.9; o.rod.rotation.z=o.s*-e.out*0.55; } }
function krotTargetPt(e){ for(let k=0;k<40;k++){ const a=rnd()*TAU, r=18+rnd()*14, x=clamp(TK.x+Math.cos(a)*r,10,WX-10), z=clamp(TK.z+Math.sin(a)*r,10,WZ-10); if(eFree(x,z,3.0)&&!inWater(x,z)) return {x,z}; } return {x:clamp(TK.x+12,10,WX-10),z:clamp(TK.z+12,10,WZ-10)}; }
/* v27.4: a dig site is simply open ground a short drive away (no piles needed) */
function krotPile(e){ const bad=e.badS||(e.badS=[]); let best=null, bs=1e9;
  for(let t=0;t<48;t++){ const a=rnd()*TAU, dd=11+rnd()*14, x=e.x+Math.sin(a)*dd, z=e.z+Math.cos(a)*dd; if(x<16||z<16||x>WX-16||z>WZ-16) continue; if(!eFree(x,z,e.r*1.25)) continue;
    if(bad.some(q=>Math.hypot(q.x-x,q.z-z)<9)) continue; if(NAVN&&NAV.dist){ const i=Math.floor(x), j=Math.floor(z); if(NAV.dist[j*NAVN+i]<4.2) continue; }
    const sc=dd+Math.hypot(x-TK.x,z-TK.z)*0.15+rnd()*3; if(sc<bs){ bs=sc; best={x,z,r:0,spot:true}; } }
  return best; }
function updKrot(e,dt){ const dx=TK.x-e.x, dz=TK.z-e.z, d=Math.max(1e-3,Math.hypot(dx,dz)); e.stT+=dt; e.t+=dt; e.rkCD-=dt;
  /* v27.2: stuck detector — a hard obstacle (gantry crane leg) turns the path aside instead of leaving him standing */
  if(e.st==='roam'||e.st==='toPile'){ e.skT=(e.skT||0)+dt; if(e.skT>2.2){ e.skT=0; const was=e.sk&&Math.hypot(e.x-e.sk[0],e.z-e.sk[1])<1.2; e.sk=[e.x,e.z]; e.skStuck=!!was; e.skN=was?(e.skN||0)+1:0;
      if(was){ const a=e.h+(rnd()<0.5?1:-1)*(1.3+rnd()*0.9)+(e.skN>2?Math.PI:0); e.det={x:clamp(e.x+Math.sin(a)*(14+rnd()*8),10,WX-10),z:clamp(e.z+Math.cos(a)*(14+rnd()*8),10,WZ-10)}; e.detT=3.2; e.path=null; e.goal=null; } } }
  else { e.skN=0; e.skStuck=false; e.detT=0; }
  if(e.detT>0) e.detT-=dt;
  const f=e.hp/e.maxHp; if(f<0.66) bossPhase(e,2,'Крот злится: залпы стали плотнее. Не стой на месте!'); if(f<0.33) bossPhase(e,3,'Он почти пробит! Закапывается всё чаще — следи, где загудит земля.');
  const N=[8,12,16][e.ph-1]; e.vF=e.vx*Math.sin(e.h)+e.vz*Math.cos(e.h);
  const go=(tx,tz,sp)=>{ const want=Math.atan2(tx-e.x,tz-e.z); e.h=turnTo(e.h,want,e.turn*dt); const al=Math.cos(wrapA(want-e.h)); const v=sp*Math.max(0.15,al);
    e.vx+=(Math.sin(e.h)*v-e.vx)*Math.min(1,dt*1.4); e.vz+=(Math.cos(e.h)*v-e.vz)*Math.min(1,dt*1.4);
    if(Math.hypot(e.vx,e.vz)>0.5) smashAround(e.x+Math.sin(e.h)*4.6,e.z+Math.cos(e.h)*4.6,2.4,3.0,2.2); };
  switch(e.st){
  case 'roam': { if(!e.goal||e.stT>9||Math.hypot(e.goal.x-e.x,e.goal.z-e.z)<3) { if(e.stT>2.5&&e.rkCD<=0&&d<46){ e.st='brace'; e.stT=0; eBrake(e,dt,8); sO(140,90,0.6,0.1,'square'); break; } e.goal=krotTargetPt(e); }
    if(e.detT>0) navMove(e,e.det.x,e.det.z,e.speedW,dt); else navMove(e,e.goal.x,e.goal.z,e.speedW*(e.ph===3?1.25:1),dt); if(Math.hypot(e.vx,e.vz)>0.5) smashAround(e.x+Math.sin(e.h)*4.6,e.z+Math.cos(e.h)*4.6,2.4,3.0,2.2); eIntegrate(e,dt); if(e.ph>=2&&e.stT>6&&rnd()<dt*0.15) { e.st='toPile'; e.stT=0; } break; }
  case 'brace': { eBrake(e,dt,10); e.h=turnTo(e.h,Math.atan2(dx,dz),dt*0.5); e.out=Math.min(1,e.out+dt/1.1); if(e.out>=1) e.lift=Math.min(1,e.lift+dt/0.9);
    if(e.out<1&&e.stT<1.2&&Math.floor(e.stT*8)!==Math.floor((e.stT-dt)*8)) sO(90,70,0.12,0.08,'square');
    if(e.out>=1&&e.stT>0.4&&Math.floor(e.stT*10)%4===0) for(const o of e.outr){ o.foot.getWorldPosition(_bw); dustAt? dustAt(_bw.x,_bw.z,0.6):0; }
    if(e.lift>=1){ e.st='salvo'; e.stT=0; e.salvoN=0; } eIntegrate(e,dt); break; }
  case 'salvo': { eBrake(e,dt,10); const gap=1.9/N; if(e.salvoN<N&&e.stT>=e.salvoN*gap){ const o=e.tubes[e.salvoN%e.tubes.length]; e.g.updateMatrixWorld(true); o.getWorldPosition(_bw);
      const ring=e.salvoN%3, a=rnd()*TAU, rr=ring===0?rnd()*1.5:ring===1?3+rnd()*3:6.5+rnd()*4.5, lead=e.salvoN<N/2?0.6:1.2; bossRocket(_bw.x,_bw.y,_bw.z,TK.x+TK.vx*lead+Math.cos(a)*rr,TK.z+TK.vz*lead+Math.sin(a)*rr,1.4+e.salvoN*0.05,13);
      FIRE.spawn(_bw.x,_bw.y,_bw.z,0,4,0,1.4,3,0.2,1,1,0.7,0.3); for(let n=0;n<4;n++) SMOKE.spawn(_bw.x,_bw.y,_bw.z,(rnd()-0.5)*2,1+rnd()*2,(rnd()-0.5)*2,1,2,1.6,0.6,0.7,0.72,0.75); e.salvoN++; shake=Math.min(1,shake+0.03); }
    if(e.salvoN>=N&&e.stT>N*gap+0.6){ e.st='unbrace'; e.stT=0; e.rkCD=e.ph===3?5:7; } eIntegrate(e,dt); break; }
  case 'unbrace': { eBrake(e,dt,8); e.lift=Math.max(0,e.lift-dt/0.8); if(e.lift<=0) e.out=Math.max(0,e.out-dt/0.9); if(e.out<=0){ e.st=e.ph>=1?'toPile':'roam'; e.stT=0; e.pile=krotPile(e); } eIntegrate(e,dt); break; }
  case 'toPile': { const p=e.pile||(e.pile=krotPile(e)); if(!p){ e.st='roam'; e.stT=0; e.badP=null; break; } const pd=Math.hypot(p.x-e.x,p.z-e.z), foot=p.spot?1.6:p.r+3.6;
    if(e.skN>=3&&pd>foot+6){ (e.badS=e.badS||[]).push(p); if(e.badS.length>6) e.badS.shift(); e.pile=null; e.stT=0; e.skN=0; break; }
    if(pd>foot&&!(e.skStuck&&pd<foot+4)){ if(e.stT>22){ (e.badS=e.badS||[]).push(p); e.pile=null; e.stT=0; break; }
      if(e.detT>0) navMove(e,e.det.x,e.det.z,e.speedW,dt); else if(pd<9||e.stT>8) go(p.x,p.z,e.speedW*1.15); else navMove(e,p.x,p.z,e.speedW*1.15,dt); eIntegrate(e,dt); }
    else { e.st='dig'; e.stT=0; e.dig=0; e.inv=true; e.lockable=false; e.digP={x:e.x,z:e.z}; e.badP=null; sO(70,140,1.4,0.12,'sawtooth'); } break; }
  case 'dig': { eBrake(e,dt,12); const p=e.pile; e.drill=Math.min(1,e.drill+dt*1.5); e.dig=Math.min(1,e.stT/4.2); e.h=turnTo(e.h,p.spot?e.h:Math.atan2(p.x-e.x,p.z-e.z),dt*0.8);
    const fx=Math.sin(e.h), fz=Math.cos(e.h); e.x+=fx*dt*1.4; e.z+=fz*dt*1.4;
    e.digSnd=(e.digSnd||0)-dt; if(e.digSnd<=0){ e.digSnd=0.11; sO(95+rnd()*20,70,0.1,0.07,'square'); sNz(0.1,'bandpass',1400+rnd()*800,2,0.06); }
    const tx=e.x+fx*(6.6-e.dig*3), tz=e.z+fz*(6.6-e.dig*3); if(rnd()<dt*7) explode(tx,1.2+rnd()*1.6,tz,1.1,0.55,fx,0,fz,'bullet',null,0,e,0);
    const gc=[0.42,0.3,0.2]; for(let n=0;n<4;n++){ const a=rnd()*TAU; debSpawn(tx,1.4+rnd()*1.4,tz,Math.cos(a)*(4+rnd()*6),3+rnd()*7,Math.sin(a)*(4+rnd()*6),gc[0]*(0.6+rnd()*0.5),gc[1]*(0.6+rnd()*0.5),gc[2],0.12+rnd()*0.22); }
    shake=Math.min(0.35,shake+dt*0.2); if(e.stT>4.2){ craterAt(e.digP.x+fx*2,e.digP.z+fz*2,3.0,0.55); e.st='under'; e.stT=0; e.g.visible=false; e.hideAt={x:e.x,z:e.z}; e.mw=0; } break; }
  case 'under': { e.drill=1; if(e.stT>1.4&&e.mw===0){ e.mw=1; krotMinions(e); } if(e.stT>7.4&&e.mw===1){ e.mw=2; krotMinions(e); }
    if(e.stT>13.4&&!e.emerge){ e.emerge=krotEmergePt(e); e.rumble=0; }
    if(e.emerge){ const p=e.emerge; e.rumble+=dt; if(rnd()<dt*14){ const a=rnd()*TAU, r=rnd()*3; debSpawn(p.x+Math.cos(a)*r,0.2,p.z+Math.sin(a)*r,(rnd()-0.5)*3,3+rnd()*4,(rnd()-0.5)*3,0.42,0.32,0.22,0.15+rnd()*0.15); }
      e.digSnd=(e.digSnd||0)-dt; if(e.digSnd<=0){ e.digSnd=0.12; const ps=sndAt(p.x,p.z); sO(85+rnd()*25,60,0.12,0.11,'square'); sNz(0.12,'bandpass',900+rnd()*600,2,0.1); sndOff(ps); }
      if(e.rumble>1.6){ e.h=Math.atan2(TK.x-p.x,TK.z-p.z); e.rp={x:p.x,z:p.z}; e.riseD=7.5; e.x=p.x-Math.sin(e.h)*e.riseD; e.z=p.z-Math.cos(e.h)*e.riseD; e.vx=e.vz=0; e.st='rise'; e.stT=0; e.g.visible=true; e.brk=0; e.fresh=7; sO(60,30,1.0,0.16,'sawtooth'); shake=Math.min(1,shake+0.3); } } break; }
  case 'rise': { /* v27: drill first — it tunnels up at an angle and breaks the surface nose-first */
    const T=2.3, k=Math.min(1,e.stT/T), q=1-Math.pow(1-k,1.6), fx=Math.sin(e.h), fz=Math.cos(e.h); e.dig=1-q; e.drill=Math.max(0,1-e.stT/2.6);
    e.x=e.rp.x-fx*e.riseD*(1-q); e.z=e.rp.z-fz*e.riseD*(1-q); const tx=e.x+fx*7.6, tz=e.z+fz*7.6;
    if(!e.brk&&k>0.2){ e.brk=1; craterAt(tx,tz,3.4,0.6); explode(tx,0.6,tz,2.6,1.4,fx,0.6,fz,'shell',null,0,e,0.8); shake=Math.min(1,shake+0.55); sfxBoom(1); groundFlash(tx,tz,7,P.glow2,0.3);
      for(let n=0;n<26;n++){ const a=rnd()*TAU, sp=2+rnd()*7; debSpawn(tx,0.4,tz,Math.cos(a)*sp+fx*3,5+rnd()*8,Math.sin(a)*sp+fz*3,0.42,0.32,0.22,0.2+rnd()*0.25); } }
    if(k>0.2&&rnd()<dt*40) debSpawn(tx+(rnd()-0.5)*2.4,0.3,tz+(rnd()-0.5)*2.4,fx*6+(rnd()-0.5)*6,4+rnd()*6,fz*6+(rnd()-0.5)*6,0.42,0.32,0.22,0.15+rnd()*0.2);
    if(k>0.2) smashAround(tx,tz,2.6,3.0,2.2);
    e.digSnd=(e.digSnd||0)-dt; if(e.digSnd<=0){ e.digSnd=0.1; sO(90+rnd()*20,60,0.1,0.08,'square'); sNz(0.1,'bandpass',1000+rnd()*700,2,0.07); }
    if(e.stT>T){ e.st='roam'; e.stT=0; e.inv=false; e.lockable=true; e.mw=0; e.emerge=null; e.goal=null; e.rkCD=1.2; e.pile=null; dustAt(e.x,e.z,1.6); } break; }
  }
  /* side MGs when the tank comes close */
  if(e.st!=='under'&&e.st!=='dig'&&d<15){ e.g.updateMatrixWorld(true); const side=Math.sin(e.h)*dz-Math.cos(e.h)*dx>0?1:-1, M_=side>0?e.mgR:e.mgL, idx=side>0?1:0; e.mgCD[idx]-=dt;
    M_.gun.lookAt(TK.x,TK.y+1.2,TK.z); M_.gun.rotateY(side>0?-Math.PI/2:Math.PI/2);
    if(e.mgCD[idx]<=0){ e.burst=(e.burst||0)+1; e.mgCD[idx]=e.burst%10===0?1.1:(e.ph===3?0.07:0.1); M_.mz.getWorldPosition(_bw); if(losTank(_bw.x,_bw.y,_bw.z)){ eShoot(_bw.x,_bw.y,_bw.z,TK.x,TK.y+1,TK.z,EW.mg); FIRE.spawn(_bw.x,_bw.y,_bw.z,0,0,0,0.5,1.5,0.06,1,1,0.85,0.4); sfxMgE(); } } }
  e.noCol=e.st==='under'||(e.st==='rise'&&e.dig>0.3)||(e.st==='dig'&&e.dig>0.85); e.state=e.st==='under'?'fly':'idle'; e.xhide=e.st==='under'||(e.dig>0.6&&e.st!=='roam');
  e.yOv=e.st==='dig'||e.st==='under'||e.st==='rise'?groundH(e.x,e.z)-e.dig*6.2:null; e.tiltX=(e.st==='dig')?e.dig*0.55:(e.st==='rise'?-e.dig*0.5:0); krotPose(e,dt);
  if(e.fresh>0&&e.g.visible&&e.st!=='under'){ e.fresh-=dt; if(rnd()<dt*22){ const a=rnd()*TAU, rr=rnd()*2.6, sx=Math.sin(e.h), cz=Math.cos(e.h); debSpawn(e.x+Math.cos(a)*rr*0.8+sx*(rnd()-0.5)*5,e.y+2.6+rnd()*1.4,e.z+Math.sin(a)*rr*0.8+cz*(rnd()-0.5)*5,(rnd()-0.5)*2,1+rnd()*2,(rnd()-0.5)*2,0.42,0.32,0.22,0.12+rnd()*0.18); }
    if(rnd()<dt*8) SMOKE.spawn(e.x+(rnd()-0.5)*4,e.y+3,e.z+(rnd()-0.5)*4,(rnd()-0.5),1,(rnd()-0.5),0.8,1.8,1.5,0.4,0.42,0.34,0.24); }
  if(d<e.r+TR+0.4&&!e.noCol&&(e.bumpT=(e.bumpT||0)-dt)<=0){ e.bumpT=1.0; damageTank(14,-dx/d,-dz/d,0); TK.vx+=dx/d*6; TK.vz+=dz/d*6; sfxThud(1); shake=Math.min(1,shake+0.3); }
  e.exT=(e.exT||0)-dt; if(e.exT<=0&&e.g.visible){ e.exT=0.1; e.g.updateMatrixWorld(true); for(const o of e.exh){ o.getWorldPosition(_bw); SMOKE.spawn(_bw.x,_bw.y,_bw.z,(rnd()-0.5)*0.6,2+rnd(),(rnd()-0.5)*0.6,0.45,1.8,1.4,0.7,0.06,0.06,0.07); } }
  eyeColor(e,true,e.st==='salvo'||e.st==='brace'); }
function krotEmergePt(e){ for(let k=0;k<60;k++){ const a=rnd()*TAU, r=(e.ph===3?20:26)+rnd()*12, x=clamp(TK.x+Math.cos(a)*r,10,WX-10), z=clamp(TK.z+Math.sin(a)*r,10,WZ-10); if(eFree(x,z,3.4)&&!inWater(x,z)) return {x,z}; } return {x:e.x,z:e.z}; }
function krotMinions(e){ const alive=ENEMIES.filter(m=>!m.dead&&m.fromKrot).length; let n=Math.max(0,Math.min(24-alive,[9,11,13][e.ph-1])); const piles=ARENA.piles.slice().sort(()=>rnd()-0.5); if(!piles.length) return; sfxJump();
  for(let i=0;i<n;i++){ const p=piles[i%piles.length]; later(i*0.14,()=>{ if(e.dead) return; const t=rnd()<0.5?'bomb':'jian', a=rnd()*TAU, x=p.x+Math.cos(a)*(p.r*0.5), z=p.z+Math.sin(a)*(p.r*0.5);
    const m=newEnemy(t,x,z); buildE(m); m.fromKrot=true; m.aggro=true; m.noScrap=true; const tx=p.x+Math.cos(a)*(p.r+2.5), tz=p.z+Math.sin(a)*(p.r+2.5), T=0.8;
    m.state='fly'; m.fy=p.h+0.4; m.fv={x:(tx-x)/T,z:(tz-z)/T,y:(0.62-m.fy)/T+0.5*G*T}; m.noCol=true; m.h=a;
    if(t==='jian'){ m.state='idle'; m.x=tx; m.z=tz; m.noCol=false; } explode(x,p.h,z,0.9,0.4,0,1,0,'bullet',null,0,m,0); sO(180+rnd()*80,90,0.12,0.06,'square'); }); } }
function dieKrot(e,dx,dz,src){ e.drill=0; bossDeath(e,{k:3.8,y:e.y+2.4,scrap:600,n:9}); }

