/* ================= v30.4: robot AI — cover (4) and little things at rest (6) =================
   Только функции, вызываются во время игры: укрытия — из updBull (22) и updKatok (31), мелочи жизни — из ePatrol (25).

   УКРЫТИЕ — точка, где между роботом и танком в 0.6–3 м стоят блоки высотой с корпус.
   coverFind берёт точки сразу за первыми преградами на веере лучей от танка к роботу (+8 случайных вокруг него, не дальше 22 м), отбрасывает занятые другими (2.5 м) и те, куда смотрит пушка
   танка, и берёт лучшую: ближе к роботу и в его «рабочем» расстоянии до танка. Режимы:
     'bull'  — закрыт на высоте 1.0 и 1.7 м, а в 1.5–3 м вбок есть точка, откуда виден танк (выглянуть);
     'klow'  — «Каток»: низкое укрытие закрывает корпус (1.0 м), башня (2.6 м) видит танк поверх;
     'kback' — «Каток»: за кормой в 2.8 м стена, башня видит танк. */
function covBlocked(x,y,z,ux,uz,h,L){ return !losClear(x,y+h,z,x+ux*L,y+h,z+uz*L); }
function coverAt(x,z,mode,e){ const tx=TK.x, tz=TK.z, dx=tx-x, dz=tz-z, D=Math.hypot(dx,dz); if(D<3) return null; const ux=dx/D, uz=dz/D, y=groundH(x,z), ty=TK.y+1.3;
  if(mode==='bull'){
    if(!covBlocked(x,y,z,ux,uz,1.0,3)||!covBlocked(x,y,z,ux,uz,1.7,3)) return null;
    for(const s of rnd()<0.5?[1,-1]:[-1,1]) for(const o of [2.2,3]){ const px=x-uz*s*o, pz=z+ux*s*o; if(!eFree(px,pz,e.r*0.8)) continue;
      if(losClear(px,groundH(px,pz)+1.9,pz,tx,ty,tz)) return {x,z,px,pz}; }
    return null; }
  if(mode==='klow') return covBlocked(x,y,z,ux,uz,1.0,3.5)&&losClear(x,y+2.6,z,tx,ty,tz)?{x,z}:null;
  if(mode==='kback') return covBlocked(x,y,z,-ux,-uz,1.0,2.8)&&losClear(x,y+2.4,z,tx,ty,tz)?{x,z}:null;
  return null; }
function coverTaken(x,z,e){ for(const o of ENEMIES) if(o!==e&&!o.dead&&o.cov&&Math.hypot(o.cov.x-x,o.cov.z-z)<2.5) return true; return false; }
/* candidate points: a fan of rays from the tank towards the robot — just behind the first obstacle on each (the likely covers),
   plus a few random points around the robot */
function coverCands(e,dmin,dmax,hh){ const out=[], b=Math.atan2(e.x-TK.x,e.z-TK.z), y=Math.round(hh/VS);
  for(let k=0;k<16;k++){ const a=b+(k/15-0.5)*1.9, sx=Math.sin(a), sz=Math.cos(a);
    for(let r=Math.max(4,dmin-4);r<dmax;r+=0.8){ const x=TK.x+sx*r, z=TK.z+sz*r; if(x<2||z<2||x>WX-2||z>WZ-2) break;
      if(get(Math.round(x/VS),y,Math.round(z/VS))){ let rr=r; while(rr<r+4&&get(Math.round((TK.x+sx*rr)/VS),y,Math.round((TK.z+sz*rr)/VS))) rr+=0.4; out.push([TK.x+sx*(rr+1.5),TK.z+sz*(rr+1.5)]); break; } } }
  for(let k=0;k<8;k++){ const r=4+(k%4)*4, a=rnd()*TAU; out.push([e.x+Math.cos(a)*r,e.z+Math.sin(a)*r]); }
  return out; }
function coverFind(e,mode,dmin,dmax){ let best=null, bs=1e9; const want=(dmin+dmax)/2, aim=TK.h+(TK.tYaw||0);
  for(const [x,z] of coverCands(e,dmin,dmax,mode==='bull'?1.2:1.0)){
    if(Math.hypot(x-e.x,z-e.z)>22||x<3||z<3||x>WX-3||z>WZ-3||!eFree(x,z,(e.navR||e.r)*0.8)) continue;
    const dT=Math.hypot(TK.x-x,TK.z-z); if(dT<dmin||dT>dmax||coverTaken(x,z,e)) continue;
    const c=coverAt(x,z,mode,e); if(!c) continue;
    const look=Math.abs(wrapA(Math.atan2(x-TK.x,z-TK.z)-aim))<0.35?6:0; /* the tank's gun already points there */
    const s=Math.hypot(x-e.x,z-e.z)+Math.abs(dT-want)*0.4+look; if(s<bs){ bs=s; best=c; } }
  return best; }

/* «Бизон»: drop the crate from the hide (moved here from the old reload state) */
function bullEject(e){ const c=new THREE.Vector3(e.x-Math.sin(e.h)*1.3,e.y+0.3,e.z-Math.cos(e.h)*1.3), box_=new THREE.Mesh(EGEO.box,PKM.ammo); box_.scale.set(0.5,0.3,0.4); box_.position.copy(c); scene.add(box_); EXTRAS.push(box_);
  GIBS.push({m:box_,v:new THREE.Vector3(-Math.sin(e.h)*3+(rnd()-0.5)*2,4,-Math.cos(e.h)*3),w:new THREE.Vector3(rnd()*8,rnd()*8,rnd()*8),r:0.15,part:null,t:0,rest:false}); sfxClick(); }
/* the «Бизон» cover cycle; returns true when it handled this frame */
function bullCover(e,dt,d,W){ const lx=e.last?e.last.x:TK.x, lz=e.last?e.last.z:TK.z;
  const drop=()=>{ e.cov=null; e.state='move'; e.cvT=0; e.t=0; return true; };
  switch(e.state){
  case 'tocover': if(!e.aggro){ e.cov=null; e.state='idle'; return true; }
    navMove(e,e.cov.x,e.cov.z,e.speedW*1.15,dt);
    if(Math.hypot(e.cov.x-e.x,e.cov.z-e.z)<1.2){ e.state='hide'; e.t=0; e.hideT=1.5+rnd()*1.5; e.hp0=e.hp; e.cvC=0.5; }
    else if(e.t>8||d<7){ e.cvT=2; return drop(); } return true;
  case 'hide': eBrake(e,dt,8); e.crouch=0.35; e.h=turnTo(e.h,Math.atan2(lx-e.x,lz-e.z),2*dt); e.lostT=Math.min(e.lostT||0,3);
    if(e.mag<=0&&!e.rl){ e.rl=true; bullEject(e); e.hideT=Math.max(e.hideT,2.2); }
    if(d<7||e.hp<e.hp0) return drop();
    if((e.cvC-=dt)<=0){ e.cvC=0.5; if(!coverAt(e.cov.x,e.cov.z,'bull',e)&&!covBlocked(e.cov.x,groundH(e.cov.x,e.cov.z),e.cov.z,(TK.x-e.cov.x)/Math.max(1,d),(TK.z-e.cov.z)/Math.max(1,d),1.7,3)) return drop(); }
    if(e.t>=e.hideT){ if(e.rl){ e.mag=W.mag; e.rl=false; }
      if(e.mod==='mortar'){ if((e.lostT||0)<3&&d<30){ e.state='brace'; e.t=0; } else { e.t=0; e.hideT=1; } return true; }
      const c=coverAt(e.cov.x,e.cov.z,'bull',e); if(!c){ e.miss=(e.miss||0)+1; if(e.miss>1){ e.miss=0; return drop(); } e.t=0; e.hideT=1; return true; }
      e.miss=0; e.cov=c; e.state='peek'; e.t=0; }
    return true;
  case 'peek': navMove(e,e.cov.px,e.cov.pz,e.speedW,dt); if(Math.hypot(e.cov.px-e.x,e.cov.pz-e.z)<0.8||e.t>1.4){ e.state='brace'; e.t=0; } return true; }
  return false; }
/* after a burst: back into cover, and every 2–3 bursts look for a new one */
function bullAfterBurst(e){ if(!e.cov) return false; e.cyc=(e.cyc||0)+1;
  if(e.cyc>=2+(rnd()<0.5?1:0)){ e.cyc=0; e.cov=null; e.state='move'; e.cvT=0; } else { e.state='tocover'; } e.t=0; return true; }

/* «Каток»: pick / keep a hull-down spot; returns the point to hold (or null = old behaviour) */
function katokCover(e,dt,d,want){ e.cvT=(e.cvT||0)-dt;
  const standing=e.cov&&Math.hypot(e.cov.x-e.x,e.cov.z-e.z)<1.5;
  /* the tank goes round the side: after 2 s look for a spot with a wall behind */
  e.flT=Math.abs(wrapA(want-e.h))>Math.PI/3&&(standing||(e.sees&&d<17))?(e.flT||0)+dt:0;
  if(e.flT>2){ e.flT=0; e.cov=null; e.cvT=0; e.cvMode='kback'; }
  if(e.cov&&(d<7.5||((e.cvC=(e.cvC||0)-dt)<=0&&(e.cvC=0.5,!coverAt(e.cov.x,e.cov.z,e.cov.mode,e))))){ e.cov=null; e.cvT=Math.max(e.cvT,1); }
  if(!e.cov&&e.cvT<=0&&e.sees&&d>7.5&&d<34){ e.cvT=2; const m=e.cvMode||'klow'; e.cvMode=null; let c=coverFind(e,m,9,17), cm=m; if(!c&&m==='klow'){ c=coverFind(e,'kback',9,17); cm='kback'; } if(c){ c.mode=cm; e.cov=c; } }
  return e.cov; }

/* ================= 6. little things at rest (looks only — perception unchanged) =================
   Только у робота без тревоги, между точками патруля, в 45 м от танка; одновременно до 6 (на «Низ» до 3, без искр).
   Занятия: оглядеться, размяться, отдых, подзарядка у фонаря, «ремонт» соседа (только искры, даже если он цел).
   Звуки тихие, слышно на 15–20 м, не чаще раза в секунду. Любая тревога обрывает занятие сразу (ePerceive → lifeStop). */
const LIFE_TYPES={jian:['look','stretch','rest','charge','fix'],bull:['look','stretch','rest','charge','fix'],katok:['look','charge'],bomb:['look','stretch']};
function lifeBusy(){ let n=0; for(const o of ENEMIES) if(o.act&&!o.dead) n++; return n; }
function lifeStop(e){ if(!e.act) return; const p=e.act.mate; e.act=null; if(p&&p.act&&p.act.k==='held') p.act=null; }
function lifeTry(e){ const L=LIFE_TYPES[e.type]; if(!L||e.boss||e.fromBoss||Math.hypot(e.x-TK.x,e.z-TK.z)>45||lifeBusy()>=(Q==='low'?3:6)) return false;
  const k=L[Math.floor(rnd()*L.length)], A={k,t:0,dur:4+rnd()*4,h0:e.h,sT:0};
  if(k==='charge'){ let best=null, bd=15; for(const l of LAMPS){ if(!l.alive||l.col!=='lamp'||l.y<3) continue; const dd=Math.hypot(l.x-e.x,l.z-e.z); if(dd<bd){ bd=dd; best=l; } } if(!best) return false; A.lamp=best; A.dur=5+rnd()*3; A.go=true; }
  if(k==='fix'){ let mate=null, bd=12; for(const o of ENEMIES){ if(o===e||o.dead||o.aggro||o.act||!(o.type==='jian'||o.type==='bull')||o.boss||o.fromBoss) continue; const dd=Math.hypot(o.x-e.x,o.z-e.z); if(dd<bd){ bd=dd; mate=o; } } if(!mate) return false;
    A.mate=mate; A.dur=3+rnd()*2; A.go=true; mate.act={k:'held',t:0,dur:99,h0:mate.h,sT:0,by:e}; }
  if(k==='rest') A.dur=4+rnd()*4;
  e.act=A; return true; }
function lifeSnd(e,fn){ const A=e.act; if(A.sT>performance.now()) return; const d=Math.hypot(e.x-TK.x,e.z-TK.z); if(d>20) return; A.sT=performance.now()+1000; const p=sndAt(e.x,e.z); fn(clamp(1.2-d/20,0,1)); sndOff(p); }
/* returns true while the robot is busy (ePatrol then does nothing else) */
function lifeUpdate(e,dt){ const A=e.act; if(!A) return false; A.t+=dt;
  if(e.aggro||e.dead){ lifeStop(e); return false; }
  switch(A.k){
  case 'held': { const by=A.by; if(!by||by.dead||!by.act||by.act.mate!==e){ e.act=null; return false; } eBrake(e,dt,6); e.h=turnTo(e.h,Math.atan2(by.x-e.x,by.z-e.z),1.5*dt); return true; }
  case 'look': eBrake(e,dt,6); e.h=turnTo(e.h,A.h0+Math.sin(A.t*0.9)*1.05,1.6*dt); if(A.t>2.5&&A.t<2.6) lifeSnd(e,v=>sO(420,640,0.12,0.02*v,'triangle')); break;
  case 'stretch': eBrake(e,dt,6); e.crouch=Math.max(0,Math.sin(A.t*3.2))*0.9; e.h=A.h0+Math.sin(A.t*5)*0.12; if(Math.sin(A.t*3.2)>0.95) lifeSnd(e,v=>{ sO(180,320,0.18,0.03*v,'sawtooth'); }); if(A.t>3.2) A.dur=0; break;
  case 'rest': eBrake(e,dt,6); e.crouch=Math.min(e.type==='jian'?2.2:1.5,A.t*1.5)*(A.t>A.dur-0.8?Math.max(0,(A.dur-A.t)/0.8):1); break;
  case 'charge': { const l=A.lamp; if(!l.alive){ A.dur=0; break; }
    if(A.go){ navMove(e,l.x+0.01,l.z+1.4,1.2,dt); A.t=0; if(Math.hypot(l.x-e.x,l.z+1.4-e.z)<1.6||A.wt>10){ A.go=false; } A.wt=(A.wt||0)+dt; break; }
    eBrake(e,dt,6); const top=e.y+(e.hy||0)+0.9, f=0.5+0.5*Math.sin(A.t*30);
    const mx=(l.x+e.x)/2+(rnd()-0.5)*0.5, my=(l.y+top)/2+(rnd()-0.5)*0.4, mz=(l.z+e.z)/2+(rnd()-0.5)*0.5;
    LINES.push(l.x,l.y-0.2,l.z,mx,my,mz,0.4*f,0.9*f,1*f,0.6); LINES.push(mx,my,mz,e.x,top,e.z,0.4*f,0.9*f,1*f,0.6);
    if(Q!=='low'&&rnd()<dt*6) spark(e.x,top,e.z,(rnd()-0.5)*2,1+rnd()*2,(rnd()-0.5)*2,0.6,0.9,1,0.3);
    lifeSnd(e,v=>{ sO(110,118,0.9,0.025*v,'sawtooth'); sNz(0.5,'bandpass',3000,4,0.012*v); }); break; }
  case 'fix': { const m=A.mate; if(!m||m.dead||m.aggro){ lifeStop(e); return false; }
    if(A.go){ const a=Math.atan2(e.x-m.x,e.z-m.z), tx=m.x+Math.sin(a)*(m.r+e.r+0.5), tz=m.z+Math.cos(a)*(m.r+e.r+0.5); navMove(e,tx,tz,1.3,dt); A.t=0; A.wt=(A.wt||0)+dt; if(Math.hypot(tx-e.x,tz-e.z)<0.9||A.wt>10) A.go=false; break; }
    eBrake(e,dt,6); e.h=turnTo(e.h,Math.atan2(m.x-e.x,m.z-e.z),2*dt); e.crouch=0.5;
    const px=m.x+(e.x-m.x)*0.35, pz=m.z+(e.z-m.z)*0.35, py=m.y+(m.hy||0)+0.4+Math.sin(A.t*2)*0.25;
    if(Q!=='low'&&rnd()<dt*14){ for(let n=0;n<3;n++) spark(px,py,pz,(rnd()-0.5)*4,1+rnd()*3,(rnd()-0.5)*4,1,0.85,0.5,0.25+rnd()*0.3); if(rnd()<0.3) groundFlash(px,pz,1.2,[0.6,0.85,1],0.06); }
    lifeSnd(e,v=>{ sNz(0.35,'highpass',3500,0.8,0.03*v); sO(2400,1800,0.08,0.012*v,'square'); }); break; } }
  if(A.t>=A.dur&&!A.go){ lifeStop(e); return false; }
  return true; }

/* tests: a wall of voxels at runtime (x0..x1, z0..z1 in metres, height h) + nav grid rebuild */
function dbgWall(x0,z0,x1,z1,h,m){ const v=m||M.MID; for(let y=0;y<Math.round(h/VS);y++) for(let z=Math.floor(z0/VS);z<Math.ceil(z1/VS);z++) for(let x=Math.floor(x0/VS);x<Math.ceil(x1/VS);x++){ put(x,y,z,v); markDirty(x,y,z); } navBuild(); }
