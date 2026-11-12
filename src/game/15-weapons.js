/* ================= WEAPONS ================= */
function buildWeapons(){ const mg=MGS[UP.mg]; const W=[Object.assign({id:'mg'},mg),{id:'cn',name:'Пушка',code:CAL_NAME[UP.cal],speed:48,g:9,spread:0.002,reload:LOAD_T[UP.load],radius:CAL_R[UP.cal],power:CAL_P[UP.cal],recoil:1.7+UP.cal*0.25}];
  if(UP.rk) W.push({id:'rk',name:'Ракеты',code:'HX-'+RK_N[UP.rk],count:RK_N[UP.rk],reload:3.4,radius:1.15,power:0.85,speed:16,g:0}); return W; }
let WEAP=buildWeapons();
let wcur=0, wswap=0, mgSpin=0, mgHeat=0, mgLock=false, mgT=0, cnT=0, rkT=0, rkQ=0, rkGap=0, mgAlt=0, rkAlt=0;
const proj=[];
const shellGeo=new THREE.SphereGeometry(0.17,10,8); const shellMat=new THREE.MeshBasicMaterial({color:0xfff2d2});
const shellPool=[]; function getShell(){ let m=shellPool.pop(); if(!m){ m=new THREE.Mesh(shellGeo,shellMat); scene.add(m); } m.visible=true; m.scale.setScalar(1); return m; }
function freeProj(p){ if(p.mesh){ p.mesh.visible=false; shellPool.push(p.mesh); } }
let lastMain=0, dryT=0;
function switchWeapon(i){ if(!wAllowed().includes(i)||i===wcur) return; wcur=i; if(i<2) lastMain=i; wswap=0.35; sfxClick(); sO(1400,700,0.06,0.06,'square'); drumTo(true); }
const AIM={x:40,y:0,z:30, yawRel:Math.PI, dist:14, lockE:null, manual:null}; const PRED={x:0,y:0,z:0,ok:false};
const muz=new THREE.Vector3(), mdir=new THREE.Vector3(), piv=new THREE.Vector3();
function solvePitch(gx_,gy,gz,tx,ty,tz,w){ const d=Math.hypot(tx-gx_,tz-gz), h=ty-gy; if(!w.g) return Math.atan2(h,d); const v2=w.speed*w.speed, disc=v2*v2-w.g*(w.g*d*d+2*h*v2); if(disc<0) return 0.6; return Math.atan((v2-Math.sqrt(disc))/(w.g*d)); }
function fire(w){ const T=tank; const mz=w.id==='mg'?T.mgMuz[mgAlt++%T.mgMuz.length]:T.cnMuz; if(w.id==='mg'&&(mgAlt%(UP.mg==='kpv'?1:2)===0)) casSpawn(mz); mz.getWorldPosition(muz); T.gun.getWorldDirection(mdir);
  stealthShot(); if(w.id==='cn'&&chs().abil==='rail'){ railShot(w); return; }
  const sp=w.spread; mdir.x+=(rnd()-0.5)*sp*2; mdir.y+=(rnd()-0.5)*sp*2; mdir.z+=(rnd()-0.5)*sp*2; mdir.normalize();
  const p={x:muz.x,y:muz.y,z:muz.z,vx:mdir.x*w.speed,vy:mdir.y*w.speed,vz:mdir.z*w.speed,w,life:w.id==='mg'?1.2:3.5,mesh:null};
  if(w.id==='cn'){ p.mesh=getShell(); p.mesh.position.set(p.x,p.y,p.z); const rel=TK.tYaw-TK.h; TK.pitchV-=w.recoil*Math.cos(rel); TK.rollV-=w.recoil*Math.sin(rel)*0.8; TK.vx-=mdir.x*1.4; TK.vz-=mdir.z*1.4; TK.recoil=1; if(T.cnSpin) T.cnSpinT=(T.cnSpinT||0)+TAU/3; shake=Math.min(1,shake+0.18); sfxCannon(); camPunch=Math.max(camPunch,0.4); groundFlash(muz.x,muz.z,5,P.glow2,0.18);
    for(let k=0;k<6;k++) SMOKE.spawn(muz.x,muz.y,muz.z,mdir.x*4+(rnd()-0.5)*2,mdir.y*4+rnd(),mdir.z*4+(rnd()-0.5)*2,0.8,2,0.9,0.5,0.75,0.8,0.88);
    FIRE.spawn(muz.x+mdir.x*0.3,muz.y,muz.z+mdir.z*0.3,mdir.x*3,0,mdir.z*3,2.6,3,0.1,1,1,0.85,0.5); }
  else { FIRE.spawn(muz.x,muz.y,muz.z,0,0,0,(UP.mg==='kpv'?1.4:0.9)+rnd()*0.6,2,0.05,1,1,0.85,0.5);
    { const big=UP.mg==='kpv', n=big?14:UP.mg==='twin'?6:4, sp=big?1.5:1; for(let k=0;k<n;k++){ const v=(10+rnd()*16)*sp, s2=big?0.55:0.4; spark(muz.x+mdir.x*0.2,muz.y,muz.z+mdir.z*0.2,(mdir.x+(rnd()-0.5)*s2)*v,(mdir.y+(rnd()-0.2)*s2)*v,(mdir.z+(rnd()-0.5)*s2)*v,1,0.75+rnd()*0.2,0.35,(big?0.14:0.08)+rnd()*(big?0.2:0.12)); }
      if(big) for(let k=0;k<2;k++){ const v=5+rnd()*6; FIRE.spawn(muz.x+mdir.x*0.5,muz.y,muz.z+mdir.z*0.5,(mdir.x+(rnd()-0.5)*0.5)*v,(rnd()-0.3)*2,(mdir.z+(rnd()-0.5)*0.5)*v,0.28+rnd()*0.2,0.5,0.14,1,1,0.8,0.35); }
      if(big&&rnd()<0.5) SMOKE.spawn(muz.x+mdir.x*0.4,muz.y,muz.z+mdir.z*0.4,mdir.x*2,0.6,mdir.z*2,0.5,1.4,0.5,0.35,0.75,0.78,0.82); } TK.pitchV+=(rnd()-0.5)*(UP.mg==='kpv'?0.12:0.05); TK.rollV+=(rnd()-0.5)*0.05; sfxMg(); }
  proj.push(p); }
function fireRocket(w){ const T=tank; if(!T.rkMuz.length) return; stealthShot(); const mz=T.rkMuz[rkAlt++%T.rkMuz.length]; mz.getWorldPosition(muz); T.gun.getWorldDirection(mdir); rkHold=0.45; rkBlast(mz);
  const tilt=Math.hypot(TK.pitch,TK.roll)*(1-STAB_K[UP.stab]); const rs=0.5+tilt*14, a=rnd()*TAU, rr=Math.sqrt(rnd())*rs;
  const p={x:muz.x,y:muz.y,z:muz.z,vx:mdir.x*w.speed,vy:mdir.y*w.speed+1.5,vz:mdir.z*w.speed,w,life:4,mesh:getShell(),tx:AIM.x+Math.cos(a)*rr,ty:AIM.y,tz:AIM.z+Math.sin(a)*rr,sp:w.speed,lock:AIM.lockE||null};
  { const L=rkLoft(muz.x,muz.y,muz.z,p.lock?p.lock.x:p.tx,p.lock?(p.lock.y||0)+(p.lock.hy||0.3):p.ty,p.lock?p.lock.z:p.tz); if(L){ const c=Math.cos(L.ang), sn=Math.sin(L.ang); p.vx=L.hx*c*w.speed; p.vy=sn*w.speed; p.vz=L.hz*c*w.speed; p.loft=L.wp; p.lofted=true; p.life=6.5; } }
  p.mesh.scale.setScalar(0.7); p.mesh.position.set(p.x,p.y,p.z); proj.push(p); sfxRocket();
  for(let k=0;k<3;k++) SMOKE.spawn(muz.x,muz.y,muz.z,-mdir.x*3+(rnd()-0.5),(rnd()-0.5),-mdir.z*3+(rnd()-0.5),0.7,1.6,0.8,0.5,0.75,0.8,0.88); }
function dry(){ if(dryT>0) return; dryT=2.5; sfxClick(); toast('Боезапас пуст · пополнение в лагере'); }
function weaponsUpdate(dt,firing){ const w=WEAP[wcur]; if(wswap>0){ wswap-=dt; firing=false; }
  const mg=WEAP[0];
  if(wcur===0){ if(mg.spin){ if(firing&&!mgLock) mgSpin=Math.min(1,mgSpin+dt*2.4); else mgSpin=Math.max(0,mgSpin-dt*1.2); } else mgSpin=(firing&&!mgLock)?1:0;
    mgT-=dt; if(firing&&!mgLock&&mgSpin>0.92){ while(mgT<=0){ if(ST.ammo.mg<=0){ mgT=0.2; dry(); break; } fire(mg); ST.ammo.mg--; mgT+=1/mg.rate; mgHeat+=mg.heat; } } if(mgT<0) mgT=0; }
  else mgSpin=Math.max(0,mgSpin-dt*1.2);
  mgHeat=Math.max(0,mgHeat-dt*0.38); if(mgHeat>=1){ if(!mgLock){ sNz(1.4,'highpass',3500,0.7,0.14,0.02); sO(900,300,0.6,0.04,'sawtooth'); } mgLock=true; mgHeat=1; } if(mgLock&&mgHeat<0.3) mgLock=false;
  cnT=Math.max(0,cnT-dt); if(wcur===1&&firing&&cnT<=0){ if(ST.ammo.cn>0){ fire(w); ST.ammo.cn--; cnT=w.reload; } else dry(); }
  rkT=Math.max(0,rkT-dt); if(w.id==='rk'&&firing&&rkT<=0&&rkQ<=0){ if(ST.ammo.rk>0){ rkQ=Math.min(w.count,ST.ammo.rk); rkGap=0; rkT=w.reload; if(tank.rkFlaps&&tank.rkOpen<0.1) sfxShutter(1); } else dry(); }
  if(rkQ>0&&WEAP[2]){ if(tank.rkFlaps&&tank.rkOpen<0.85){ rkGap=Math.max(rkGap,0.02); } else { rkGap-=dt; if(rkGap<=0){ fireRocket(WEAP[2]); ST.ammo.rk--; rkQ--; rkGap=0.11; } } }
  dryT=Math.max(0,dryT-dt);
  if(mg.spin) for(const b of tank.barrels) b.rotation.z+=mgSpin*dt*38;
  TK.recoil=Math.max(0,TK.recoil-dt*4); tank.cn.position.z=-0.35*TK.recoil; }
const MG_DMG={gau:4,twin:3.5,kpv:13};
function hitSpark(x,y,z,ux,uz,n){ const sc=mix3(P.glow,[1,1,1],0.45); for(let k=0;k<n;k++) spark(x,y,z,-ux*4+(rnd()-0.5)*7,rnd()*5,-uz*4+(rnd()-0.5)*7,sc[0],sc[1],sc[2],0.18+rnd()*0.2); }
function projUpdate(dt){ for(let i=proj.length-1;i>=0;i--){ const p=proj[i]; p.life-=dt; const ox=p.x,oy=p.y,oz=p.z, w=p.w;
    if(w.id==='rk'){ if(p.lock&&!p.lock.dead){ p.tx=p.lock.x; p.ty=(p.lock.y||0)+(p.lock.hy||0.2); p.tz=p.lock.z; }
      if(p.loft&&(Math.hypot(p.x-p.loft.x,p.z-p.loft.z)<3||((p.loft.x-p.x)*p.vx+(p.loft.z-p.z)*p.vz)<0)) p.loft=null;
      p.sp=Math.min(p.loft?34:44,p.sp+70*dt); const G=p.loft||{x:p.tx,y:p.ty,z:p.tz}; let dx=G.x-p.x, dy=G.y-p.y, dz=G.z-p.z;
      if(!p.loft&&p.lock&&!p.lock.dead){ const tl=Math.hypot(dx,dz)/Math.max(12,p.sp); dx+=(p.lock.vx||0)*tl*0.9; dz+=(p.lock.vz||0)*tl*0.9; }
      { if(p.ph==null) p.ph=rnd()*TAU; p.age=(p.age||0)+dt; const dd=Math.hypot(dx,dy,dz)||1, wv=Math.sin(p.age*7+p.ph)*Math.min(1.1,dd*0.1)*Math.min(1,p.age*3)*(p.loft?0.4:1), px=-dz/dd, pz=dx/dd; dx+=px*wv*dd*0.28; dz+=pz*wv*dd*0.28; dy+=Math.cos(p.age*8+p.ph)*Math.min(0.5,dd*0.04)*dd*0.18; } const dl=Math.hypot(dx,dy,dz)||1; dx/=dl; dy/=dl; dz/=dl;
      const v=Math.hypot(p.vx,p.vy,p.vz)||1; let ux=p.vx/v, uy=p.vy/v, uz=p.vz/v; const k=Math.min(1,dt*(p.loft?2.2:(p.lofted||p.life<3.6?7:1.5))); ux+=(dx-ux)*k; uy+=(dy-uy)*k; uz+=(dz-uz)*k; const ul=Math.hypot(ux,uy,uz)||1;
      p.vx=ux/ul*p.sp; p.vy=uy/ul*p.sp; p.vz=uz/ul*p.sp; }
    else p.vy-=w.g*dt;
    const nx=p.x+p.vx*dt, ny=p.y+p.vy*dt, nz=p.z+p.vz*dt; const dx=nx-ox, dy=ny-oy, dz=nz-oz, len=Math.hypot(dx,dy,dz)||1e-6;
    const ux=dx/len, uy=dy/len, uz=dz/len; let hitT=Infinity, hk=null;
    if(raycast(ox,oy,oz,ux,uy,uz,len)){ hitT=RH.t; hk={hit:RH.hit,x:RH.x,y:RH.y,z:RH.z,nx:RH.nx,ny:RH.ny,nz:RH.nz}; }
    for(let j=rigids.length-1;j>=0;j--){ const r=rigids[j], rr=r.radius*0.7, cx=r.pos.x-ox, cy=r.pos.y-oy, cz=r.pos.z-oz, tc=cx*ux+cy*uy+cz*uz; if(tc<0||tc>len) continue;
      const q=cx*cx+cy*cy+cz*cz-tc*tc; if(q<rr*rr&&tc<hitT){ hitT=tc; hk={hit:3,ri:j,nx:-ux,ny:-uy,nz:-uz}; } }
    let eh=null, eT=Infinity, leg=-1;
    if(p.enemy){ if(!TK.dead&&!transit){ const t=segSphere(ox,oy,oz,ux,uy,uz,len,TK.x,TK.y+1.25,TK.z,1.45); if(t>=0){ eT=t; eh=TK; } } for(const d of RDR.list.concat(BEE.list)){ const t=segSphere(ox,oy,oz,ux,uy,uz,len,d.p.x,d.p.y,d.p.z,0.6); if(t>=0&&t<eT){ eT=t; eh=d; } } if(GD.d&&!GD.d.dead&&GD.d.st!=='rise'&&p.dodge!==GD.d){ const t=segSphere(ox,oy,oz,ux,uy,uz,len,GD.d.p.x,GD.d.p.y,GD.d.p.z,0.75); if(t>=0&&t<eT){ eT=t; eh=GD.d; } } { const t=shieldProj(ox,oy,oz,ux,uy,uz,len); if(t>=0&&t<eT){ eT=t; eh=SHD_HIT; } } }
    else { for(const e of ENEMIES){ if(e.dead||e.state==='fly') continue; const t=segSphere(ox,oy,oz,ux,uy,uz,len,e.x,e.y+e.hy,e.z,e.shOn?e.shieldR:e.hr); if(t>=0&&t<eT){ eT=t; eh=e; leg=-1; }
        if(e.type==='lamp') for(let li=0;li<e.legs.length;li++){ const L=e.legs[li]; if(!L.alive||!L.knee) continue; for(const f of [0,0.5]){
          const t2=segSphere(ox,oy,oz,ux,uy,uz,len,L.knee.x+(L.foot.x-L.knee.x)*f,L.knee.y+(L.foot.y-L.knee.y)*f,L.knee.z+(L.foot.z-L.knee.z)*f,0.42); if(t2>=0&&t2<eT){ eT=t2; eh=e; leg=li; } } } }
      for(const d of DRONES){ if(d.dead) continue; const t=segSphere(ox,oy,oz,ux,uy,uz,len,d.x,d.y,d.z,0.55); if(t>=0&&t<eT){ eT=t; eh=d; leg=-1; } } if(CIV.list.length){ const ch=civHitTest(ox,oy,oz,ux,uy,uz,len); if(ch&&ch[1]<eT){ eT=ch[1]; eh=ch[0]; leg=-1; } } }
    if(!p.enemy){ const zp=zontProj(ox,oy,oz,ux,uy,uz,len); if(zp&&zp[1]<=hitT&&zp[1]<=eT){ const t=zp[1], hx=ox+ux*t, hy=oy+uy*t, hz=oz+uz*t; zontAbsorb(zp[0],w.id==='mg'?MG_DMG[UP.mg]:(w.id==='cn'?45*w.power:30),hx,hy,hz);
      if(w.id!=='mg'){ FIRE.spawn(hx,hy,hz,0,0,0,2.4,3,0.14,1,0.6,0.95,1); sfxCannonE(); } freeProj(p); proj.splice(i,1); continue; } }
    if(eh&&eT<=hitT){ const hx=ox+ux*eT, hy=oy+uy*eT, hz=oz+uz*eT;
      if(eh.gd&&rnd()<GD_DODGE){ p.dodge=eh; gdDodge(eh,ux,uz); p.x=nx; p.y=ny; p.z=nz; continue; }
      if(eh.gd){ gdDamage(eh,w,ux,uy,uz,hx,hy,hz); if(w.kind==='shell') explode(hx,hy,hz,w.radius*0.6,w.power*0.5,ux,uy,uz,'shell',null,0,null,0); }
      else if(eh.shd){ shieldHit(w.dmg*0.9,hx,hy,hz); }
      else if(eh.bee){ beeDie(eh,ux,uz); }
      else if(eh.rd){ rdDie(eh,ux,uz); if(w.kind==='shell') explode(hx,hy,hz,w.radius*0.6,w.power*0.5,ux,uy,uz,'shell',null,0,null,0); }
      else if(eh.civ){ civDie(eh,ux,uz,w.id==='mg'?1:4); if(w.id!=='mg') explode(hx,hy,hz,w.radius,w.power,ux,uy,uz,'shell',null,0,null,1); }
      else if(eh===TK){ damageTank(w.dmg,-ux,-uz,uy<-0.45?0.7:0); TK.vx+=ux*w.power*1.4; TK.vz+=uz*w.power*1.4; TK.pitchV+=(rnd()-0.5)*w.power*0.5; TK.rollV+=(rnd()-0.5)*w.power*0.5;
        if(w.kind==='shell') explode(hx,hy,hz,w.radius,w.power,ux,uy,uz,'shell',null,0,null,0); else { hitSpark(hx,hy,hz,ux,uz,3); sfxClang(); } }
      else { const dmg=(p.dmg!=null?p.dmg:(w.id==='mg'?MG_DMG[UP.mg]:(w.id==='cn'?45*w.power*chs().cn:30)))*stealthMul(), kb=w.id==='mg'?0.6:(w.id==='cn'?7:4);
        if(eh.type===undefined){ eh.hp-=dmg; eh.flash=1; if(eh.hp<=0) droneDie(eh,ux,uz); }
        else if(leg>=0){ const L=eh.legs[leg]; L.hp-=dmg; eh.flash=1; if(L.hp<=0) lampLegBreak(eh,leg,hx-ux*3,hz-uz*3); }
        else { enemyHit(eh,dmg,ux,uz,kb,'proj'); if(eh.shOn&&eh.shellHit) eh.shellHit(eh,hx,hy,hz); }
        hitSpark(hx,hy,hz,ux,uz,w.id==='mg'?4:10); if(w.id==='mg') sfxTick(); else explode(hx,hy,hz,w.radius,w.power,ux,uy,uz,'shell',null,0,eh.type?eh:null); }
      freeProj(p); proj.splice(i,1); continue; }
    if(hk){ const hx=ox+ux*hitT, hy=oy+uy*hitT, hz=oz+uz*hitT;
      if(hk.hit===3&&(w.id==='mg'||w.kind==='bullet')){ const r=rigids[hk.ri]; r.vel.x+=ux*1.5; r.vel.z+=uz*1.5; r.vel.y+=0.5; r.ang.x+=(rnd()-0.5)*2; r.ang.z+=(rnd()-0.5)*2; r.sleep=false;
        hitSpark(hx,hy,hz,ux,uz,5); sfxTick(); }
      else explode(hx,Math.max(0.05,hy),hz,w.radius,w.power,ux,uy,uz,w.kind||(w.id==='mg'?'bullet':'shell'),hk,0,null,p.enemy?0.55:1);
      freeProj(p); proj.splice(i,1); continue; }
    p.x=nx;p.y=ny;p.z=nz;
    if(p.life<=0||p.x<-10||p.x>WX+10||p.z<-10||p.z>WZ+10){ freeProj(p); proj.splice(i,1); continue; }
    const L=p.enemy?EYE_RED:P.lamp, A=p.enemy?EYE_RED:P.glow;
    if(!p.mesh){ const tl=1.8/len; LINES.push(p.x,p.y,p.z,p.x-dx*tl,p.y-dy*tl,p.z-dz*tl,L[0],L[1],L[2],0.05); }
    else { p.mesh.position.set(p.x,p.y,p.z); LINES.push(p.x,p.y,p.z,ox-dx*1.5,oy-dy*1.5,oz-dz*1.5,A[0],A[1],A[2],0); const isR=w.id==='rk'; if(isR||rnd()<0.7) SMOKE.spawn(ox,oy,oz,0,0.3,0,isR?0.6:0.45,1.2,isR?1.0:0.6,0.35,0.7,0.75,0.82); } } }
function predictImpact(){ const w=WEAP[wcur]; if(w.id==='rk'){ PRED.x=AIM.x; PRED.y=AIM.y; PRED.z=AIM.z; PRED.ok=true; return; }
  const mz=w.id==='mg'?tank.mgMuz[0]:tank.cnMuz; mz.getWorldPosition(muz); tank.gun.getWorldDirection(mdir);
  let x=muz.x,y=muz.y,z=muz.z, vx=mdir.x*w.speed, vy=mdir.y*w.speed, vz=mdir.z*w.speed; const st=1/30; PRED.ok=false;
  for(let k=0;k<90;k++){ vy-=w.g*st; const dx=vx*st, dy=vy*st, dz=vz*st, l=Math.hypot(dx,dy,dz);
    if(raycast(x,y,z,dx/l,dy/l,dz/l,l)){ PRED.x=x+dx/l*RH.t; PRED.y=y+dy/l*RH.t; PRED.z=z+dz/l*RH.t; PRED.ok=true; return; } x+=dx;y+=dy;z+=dz; if(y<-1) break; } }

