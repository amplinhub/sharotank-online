/* =================================================================================== */
/* «ЗОЛОТОЙ ДРАКОН» — segmented dragon: lantern segments, bite, fire breath, rearing    */
/* =================================================================================== */
const DR_N=14, DR_GAP=1.75;
function buildDragon(e){ Object.assign(e,{r:1.8,hy:1.5,hr:1.9,mass:14,turn:1.2,st:'dance',stT:0,trail:[],segs:[],wp:0,bite:0,brCD:6,fbCD:3,rear:0,jaw:0,noCol:true,static:true,inv:true,lockable:false,walk:0});
  /* v27: hi-tech / cyberpunk — gunmetal armour, gold trim, neon lines, plasma core, a centipede's worth of mechanical legs */
  const Bk=emat(e,0x0d0f13), Pl=emat(e,0xeef2f5), Au=emat(e,0x262b32), Wh=emat(e,0xf7f9fb), Mt=emat(e,0x4a525c); e.eyeM=eglow(e,0xff1f16); const Cy=eglow(e,0xdbe6f0), Mg=emat(e,0x15181d);
  e.legMats={Bk,Pl,Wh,Cy}; const B=e.body; const H=new THREE.Group(); H.position.y=1.5; B.add(H); e.head=H;
  ep(e,EGEO.box,Bk,H,0,0.25,0,1.8,1.15,1.9,true); ep(e,EGEO.box,Pl,H,0,0.1,1.4,1.25,0.7,1.5,true).rotation.x=0.08; ep(e,EGEO.box,Au,H,0,0.8,0.7,1.3,0.12,1.9); ep(e,EGEO.box,Au,H,0,0.56,1.85,0.9,0.1,0.8);
  ep(e,EGEO.box,Pl,H,0,0.9,-0.2,0.5,0.35,1.2,true);
  for(const s of [-1,1]){ ep(e,EGEO.box,Pl,H,s*1.0,0.2,0.35,0.2,0.95,1.5,true); ep(e,EGEO.box,Cy,H,s*1.11,0.28,0.35,0.04,0.1,1.3); for(let k=0;k<4;k++) ep(e,EGEO.box,Bk,H,s*1.11,-0.08,-0.15+k*0.28,0.05,0.14,0.14);
    ep(e,EGEO.box,e.eyeM,H,s*0.55,0.55,0.98,0.5,0.13,0.06).rotation.z=s*-0.25; ep(e,EGEO.box,Bk,H,s*0.55,0.73,0.98,0.62,0.1,0.14); ep(e,EGEO.joint,Cy,H,s*0.3,0.4,2.28,0.1);
    for(let k=0;k<2;k++){ const a=ep(e,EGEO.box,k?Pl:Au,H,s*(0.6+k*0.28),1.0+k*0.12,-0.7-k*0.5,0.07,1.8-k*0.45,0.3); a.rotation.set(-1.0,0,s*(0.2+k*0.25)); ep(e,EGEO.joint,k?Mg:Cy,H,s*(0.7+k*0.36),1.78-k*0.2,-1.5-k*0.6,0.13); }
    const pst=ep(e,EGEO.cyl,Mt,H,s*0.7,-0.05,0.55,0.14,1.0,0.14); pst.rotation.x=1.25; }
  for(let k=0;k<5;k++) ep(e,EGEO.box,Bk,H,0,0.05+k*0.17,-1.02,1.5,0.07,0.1); ep(e,EGEO.box,Cy,H,0,0.0,-1.07,1.3,0.04,0.03);
  const hl=ep(e,EGEO.thin,Mg,H,0,0.85,-1.3,2.8); hl.userData.keep=true; e.hring=hl;
  const J=new THREE.Group(); J.position.set(0,-0.25,0.6); H.add(J); e.jawG=J; ep(e,EGEO.box,Bk,J,0,-0.15,0.75,1.2,0.3,1.5,true); ep(e,EGEO.box,Pl,J,0,-0.33,1.0,0.5,0.22,0.9); ep(e,EGEO.box,Cy,J,0,-0.06,0.75,1.0,0.04,1.2);
  for(let k=0;k<5;k++) ep(e,EGEO.tip,Wh,J,-0.44+k*0.22,0.1,1.35,0.08,0.22,0.08);
  for(let k=0;k<5;k++) ep(e,EGEO.tip,Wh,H,-0.44+k*0.22,-0.12,1.95,0.08,0.22,0.08);
  e.mouth=new THREE.Object3D(); e.mouth.position.set(0,-0.05,2.3); H.add(e.mouth); e.fireM=eglow(e,0x2a0a08); ep(e,EGEO.box,e.fireM,H,0,-0.1,1.6,0.9,0.15,0.8); ep(e,EGEO.ring,Cy,H,0,0.0,2.18,0.6);
  /* body segments live in world space (e.lg), each a hittable child; 4 of them carry an energy core (phase 1 weak points) */
  e.segG=[]; for(let i=0;i<DR_N;i++){ const g=new THREE.Group(); e.lg.add(g); const t=i/DR_N, rr=1.05*(1-t*0.45), lant=(i===2||i===5||i===8||i===11);
    const body=new THREE.Mesh(EGEO.cyl,i%2?Bk:Pl); body.scale.set(rr*2,DR_GAP*0.95,rr*2); body.rotation.x=Math.PI/2; g.add(body); { const o=new THREE.Mesh(EGEO.cyl,outlineMat); o.scale.setScalar(1.06); body.add(o); }
    for(let k=0;k<4;k++){ const a=k/4*TAU+(i%2)*0.8, p=new THREE.Mesh(EGEO.box,Au); p.scale.set(0.5,0.08,0.8); p.position.set(Math.cos(a)*rr*1.02,Math.sin(a)*rr*1.02,0); p.rotation.z=a-Math.PI/2; g.add(p); }
    const rg=new THREE.Mesh(EGEO.ring,i%2?Cy:Mg); rg.scale.setScalar(rr*2.12); rg.position.z=0.62; g.add(rg);
    for(const z of [-0.35,0.35]){ const fin=new THREE.Mesh(EGEO.box,Au); fin.scale.set(0.06,0.75*rr,0.4); fin.position.set(0,rr+0.3,z); g.add(fin); }
    if(lant){ const lm=eglow(e,0xff2a1f); const c=new THREE.Mesh(EGEO.sph,lm); c.scale.setScalar(rr*1.2); c.position.y=rr*0.55; g.add(c); const cage=[]; for(let k=0;k<3;k++){ const b=new THREE.Mesh(EGEO.thin,Bk); b.scale.setScalar(rr*3.1); b.position.y=rr*0.55; b.rotation.set(k*1.05,k*0.7,0); g.add(b); cage.push(b); } g.userData.lm=lm; g.userData.cage=cage; }
    if(i===DR_N-1){ const tf=new THREE.Mesh(EGEO.box,Au); tf.scale.set(0.1,1.4,1.4); tf.position.set(0,0.3,-1.1); tf.rotation.x=0.6; g.add(tf); const th=new THREE.Mesh(EGEO.disc,Cy); th.scale.setScalar(1.0); th.position.z=-DR_GAP*0.5; th.rotation.y=Math.PI; g.add(th); }
    const legs=[]; for(const sx of [-1,1]){ const th=new THREE.Mesh(EGEO.box,Bk), sh=new THREE.Mesh(EGEO.box,Pl), kj=new THREE.Mesh(EGEO.joint,Cy), hj=new THREE.Mesh(EGEO.joint,Au), ft=new THREE.Mesh(EGEO.tip,Wh); kj.scale.setScalar(0.34); hj.scale.setScalar(0.4); ft.scale.set(0.26,0.5,0.26); g.add(th,sh,kj,hj,ft); legs.push({sx,th,sh,kj,hj,ft,k:{x:0,y:0,z:0},f:{x:0,y:0,z:0},h:{x:0,y:0,z:0}}); }
    g.position.set(Math.sin(i*0.5)*1.6,rr,-1.6-i*DR_GAP); g.rotation.y=Math.cos(i*0.5)*0.5; e.segG.push({g,rr,lant,i,legs}); }
  e.trailInit=false; }
function dragonSegs(e){ if(e.segs.length) return; for(const s of e.segG){ if(!s.lant) continue; const q=newEnemy('dseg',e.x,e.z); buildE(q); q.dr=e; q.si=s.i; q.lm=s.g.userData.lm; q.hp=q.maxHp=Math.round(260*bossMul()); q.lockable=true; q.bossPart=true; e.segs.push(q); } }
function dragonBar(e){ if(e.ph===1){ let c=0,m=0; for(const q of e.segs){ m+=q.maxHp; if(!q.dead) c+=Math.max(0,q.hp); } return [c,Math.max(1,m)]; } return [e.hp,e.maxHp]; }
function dragonTrail(e){ const T=e.trail, hy=e.y; if(!T.length||Math.hypot(T[0][0]-e.x,T[0][2]-e.z)>0.25){ T.unshift([e.x,hy,e.z]); if(T.length>DR_N*DR_GAP*4+40) T.pop(); } }
const _lgU=new THREE.Vector3(), _lgD=new THREE.Vector3(), _lgP=new THREE.Vector3();
/* two-bone IK for one centipede leg (local space of the segment group) */
function dragonLeg(s,L,phase,gy,py,moving){ const sx=L.sx, rr=s.rr, A=1.35, L1=1.7, L2=1.9;
  const u=((phase/TAU)%1+1)%1; let zf, lift=0; if(u<0.6){ zf=A-(u/0.6)*2*A; } else { const w=(u-0.6)/0.4; zf=-A+w*2*A; lift=Math.sin(w*Math.PI)*(moving?1.0:0.1); }
  const H=L.h, F=L.f, K=L.k; H.x=sx*rr*0.82; H.y=-rr*0.25; H.z=0; F.x=sx*(rr+1.7+lift*0.3); F.y=gy-py+0.14+lift; F.z=zf;
  let vx=F.x-H.x, vy=F.y-H.y, vz=F.z-H.z, dist=Math.hypot(vx,vy,vz)||1e-3; const maxD=(L1+L2)*0.985; if(dist>maxD){ const k=maxD/dist; F.x=H.x+vx*k; F.y=H.y+vy*k; F.z=H.z+vz*k; vx*=k; vy*=k; vz*=k; dist=maxD; }
  const dx=vx/dist, dy=vy/dist, dz=vz/dist, along=(L1*L1-L2*L2+dist*dist)/(2*dist), h=Math.sqrt(Math.max(0,L1*L1-along*along));
  _lgU.set(sx*0.7,1,0); const dp=_lgU.x*dx+_lgU.y*dy+_lgU.z*dz; _lgU.x-=dx*dp; _lgU.y-=dy*dp; _lgU.z-=dz*dp; _lgU.normalize();
  K.x=H.x+dx*along+_lgU.x*h; K.y=H.y+dy*along+_lgU.y*h; K.z=H.z+dz*along+_lgU.z*h;
  placeSeg(L.th,H,K,0.34,0.34); placeSeg(L.sh,K,F,0.26,0.26); L.kj.position.set(K.x,K.y,K.z); L.hj.position.set(H.x,H.y,H.z); L.ft.position.set(F.x,F.y-0.18,F.z); }
function dragonPose(e,dt){ const T=e.trail; let acc=0, j=0; const mv=(e.mvS||0)>0.4;
  for(const s of e.segG){ const want=(s.i+1)*DR_GAP+0.4; while(j<T.length-1&&acc+Math.hypot(T[j+1][0]-T[j][0],T[j+1][2]-T[j][2])<want){ acc+=Math.hypot(T[j+1][0]-T[j][0],T[j+1][2]-T[j][2]); j++; }
    const p=T[Math.min(j,T.length-1)], q=T[Math.min(j+1,T.length-1)]; const gy=groundH(p[0],p[2]), wave=Math.sin(e.t*3-s.i*0.55)*0.35, rear=e.rear*Math.max(0,3-s.i)/3*3.4;
    s.g.position.set(p[0],Math.max(gy+s.rr+wave,p[1]-s.i*0.9*(e.rear>0?1:0))+rear*0.4,p[2]); const yaw=Math.atan2(p[0]-q[0],p[2]-q[2]); s.g.rotation.set(0,yaw,Math.sin(e.t*3-s.i*0.55)*0.08);
    if(s.lant&&s.g.userData.lm){ const f=0.6+0.4*Math.sin(e.t*6+s.i); s.g.userData.lm.color.setRGB(0.15+0.2*f,0.55+0.4*f,1); for(const b of s.g.userData.cage){ b.rotation.y+=dt*2.2; b.rotation.x+=dt*1.3; } }
    for(const L of s.legs) dragonLeg(s,L,e.walk-s.i*0.62+(L.sx>0?Math.PI:0),gy,s.g.position.y,mv);
    s.wx=s.g.position.x; s.wy=s.g.position.y; s.wz=s.g.position.z; } }
function updDragon(e,dt){ const dx=TK.x-e.x, dz=TK.z-e.z, d=Math.max(1e-3,Math.hypot(dx,dz)); e.stT+=dt; e.t+=dt; e.brCD-=dt; e.fbCD-=dt; e.bite-=dt; dragonSegs(e);
  if(!e.trailInit){ e.trailInit=true; for(let k=0;k<DR_N*DR_GAP*4+10;k++) e.trail.push([e.x,e.y,e.z-k*0.25]); }
  const want=Math.atan2(dx,dz); let sp=0, tx=TK.x, tz=TK.z;
  if(e.ph===1){ e.inv=true; e.lockable=false; e.barInv=true; e.phTxt='фонари на спине';
    if(!e.segs.some(q=>!q.dead)){ bossPhase(e,2,'Фонари погасли — дракон без брони! Бей в голову, держись подальше от пасти.'); e.inv=false; e.lockable=true; e.barInv=false; e.phTxt='голова'; }
    /* v27.2: a tangled route — a Lissajous knot that re-rolls its phases and reverses every ~20 s */
    if(e.u==null){ e.u=0; e.ud=1; e.ft=0; e.pa=0; e.pb=0; } const Lc=ARENA.lair||[WX/2,WZ/2], rx=Math.min(44,WX/2-14), rz=Math.min(44,WZ/2-14), PU=u=>({x:Lc[0]+rx*(0.8*Math.sin(u)+0.2*Math.sin(3.1*u+e.pa)),z:Lc[1]+rz*(0.8*Math.sin(2*u+e.pb)+0.2*Math.cos(2.3*u))});
    let wq=PU(e.u); if(Math.hypot(wq.x-e.x,wq.z-e.z)<6){ e.u+=0.2*e.ud; wq=PU(e.u); } tx=wq.x; tz=wq.z; sp=9+2.5*Math.sin(e.u*1.7); e.ft+=dt; if(e.ft>20+rnd()*6){ e.ft=0; e.ud=-e.ud; e.pa=rnd()*TAU; e.pb=rnd()*TAU; }
    if(e.fbCD<=0){ e.fbCD=2.4; const sl=e.segG.filter(s=>s.lant&&e.segs.some(q=>q.si===s.i&&!q.dead)); const s=sl[(rnd()*sl.length)|0]; if(s) dragonFireball(s.wx,s.wy+0.6,s.wz,TK.x+(rnd()-0.5)*4,TK.z+(rnd()-0.5)*4); } }
  else { const f=e.hp/e.maxHp; if(f<0.4) bossPhase(e,3,'Дракон встаёт на дыбы! Когда он поднимает голову — уходи из-под удара.');
    if(e.st==='rear'){ sp=0; e.rear=Math.min(1,e.rear+dt*1.2); e.g.updateMatrixWorld(true); e.mouth.getWorldPosition(_bw);
      if(e.stT<1.1){ const k=e.stT/1.1; e.fireM.color.setRGB(0.5+k*0.5,0.1+k*0.3,0.08); if(!e.chS){ e.chS=1; sO(120,1100,1.1,0.1,'sawtooth'); sNz(1.0,'highpass',1500,0.7,0.1); }
        for(let n=0;n<4;n++){ const a=rnd()*TAU, rr=2.6*(1-k)+0.4; spark(_bw.x+Math.cos(a)*rr,_bw.y+(rnd()-0.5)*rr,_bw.z+Math.sin(a)*rr,-Math.cos(a)*rr*3,0,-Math.sin(a)*rr*3,1,0.4,0.3,0.35); }
        if(Math.floor(e.stT*14)!==Math.floor((e.stT-dt)*14)) sTone(300+k*900,0.07,0.04,'square'); }
      else if(e.stT<3.3&&e.fbCD<=0){ e.fbCD=0.2; const tx_=TK.x+(rnd()-0.5)*8, tz_=TK.z+(rnd()-0.5)*8; dragonFireball(_bw.x,_bw.y,_bw.z,tx_,tz_); e.recoil=1;
        zapBolt(_bw.x,_bw.y,_bw.z,tx_,groundH(tx_,tz_)+0.5,tz_,[1,0.45,0.38],0.1,0.5,6); FIRE.spawn(_bw.x,_bw.y,_bw.z,0,0.4,0,1.8,3.2,0.18,1,0.9,0.75,1); for(let n=0;n<12;n++){ const a=e.h+(rnd()-0.5)*1.4; spark(_bw.x,_bw.y,_bw.z,Math.sin(a)*(6+rnd()*8),(rnd()-0.5)*4,Math.cos(a)*(6+rnd()*8),1,0.45,0.3,0.25+rnd()*0.2); }
        sO(1500,200,0.22,0.1,'sawtooth'); sO(80,38,0.3,0.16,'sine'); sNz(0.16,'highpass',3500,0.8,0.12); shake=Math.min(1,shake+0.1); }
      if(e.stT>3.6){ e.rear=0; e.chS=0; e.fireM.color.setRGB(0.16,0.04,0.03); e.st='chase'; e.stT=0; explode(e.x,0.6,e.z,2.2,1.2,0,-1,0,'shell',null,0,e,0); shake=Math.min(1,shake+0.5); const dd=Math.hypot(TK.x-e.x,TK.z-e.z); if(dd<7){ damageTank(15*(1-dd/8),TK.x-e.x,TK.z-e.z,1); TK.vx+=(TK.x-e.x)/dd*9; TK.vz+=(TK.z-e.z)/dd*9; } groundFlash(e.x,e.z,10,P.glow2,0.3); } }
    else if(e.st==='breath'){ sp=1.2; e.jaw=Math.min(1,e.jaw+dt*4); if(e.stT<0.9){ e.fireM.color.setRGB(0.4+e.stT*0.6,0.1+e.stT*0.2,0.08); if(Math.floor(e.stT*8)!==Math.floor((e.stT-dt)*8)) sO(120+e.stT*200,200,0.1,0.06,'sawtooth'); }
      else { e.g.updateMatrixWorld(true); e.mouth.getWorldPosition(_bw); const ca=Math.sin(e.h), cb=Math.cos(e.h); for(let n=0;n<5;n++){ const a=e.h+(rnd()-0.5)*0.55, s=10+rnd()*6; FIRE.spawn(_bw.x,_bw.y,_bw.z,Math.sin(a)*s,-0.5+rnd()*2,Math.cos(a)*s,1.2,3.2,0.6,1,0.45+rnd()*0.3,0.2,1); }
        e.brSnd=(e.brSnd||0)-dt; if(e.brSnd<=0){ e.brSnd=0.1; sNz(0.12,'lowpass',900,0.8,0.18); } const toT=Math.abs(wrapA(want-e.h)); if(d<11&&toT<0.45) damageTank(18*dt,dx,dz,0); void ca; void cb; }
      if(e.stT>2.9){ e.st='chase'; e.stT=0; e.brCD=e.ph===3?4.5:6; e.fireM.color.setRGB(0.16,0.04,0.03); } }
    else { e.st='chase'; sp=e.ph===3?8.5:7.5; e.wvT=(e.wvT||0)+dt; { const wv=Math.sin(e.wvT*0.8)*(d>12?9:3); tx=TK.x-dz/d*wv; tz=TK.z+dx/d*wv; }
      if(e.orbT>0){ e.orbT-=dt; e.orbA+=dt*0.8*e.orbD; tx=TK.x+Math.cos(e.orbA)*17; tz=TK.z+Math.sin(e.orbA)*17; sp*=1.15; } else if(e.stT>8&&d<24&&rnd()<dt*0.2){ e.orbT=4.5; e.orbD=rnd()<0.5?-1:1; e.orbA=Math.atan2(e.z-TK.z,e.x-TK.x); }
      if(e.brCD<=0&&d<12){ e.st='breath'; e.stT=0; } else if(e.ph===3&&e.stT>7){ e.st='rear'; e.stT=0; e.fbCD=0; sO(80,40,1,0.2,'sawtooth'); } }
    e.jaw=e.st==='breath'?e.jaw:Math.max(0,e.jaw-dt*3);
    if(d<3.6&&e.bite<=0&&e.st==='chase'){ e.bite=1.5; e.jaw=1; damageTank(20,dx,dz,0); TK.vx+=dx/d*7; TK.vz+=dz/d*7; sfxThud(1.2); shake=Math.min(1,shake+0.35); } }
  /* move the head: smooth turning, smash light obstacles in the path */
  const tw=Math.atan2(tx-e.x,tz-e.z); e.h=turnTo(e.h,tw,dt*(e.ph===1?1.0:1.35)); if(sp>0){ e.x+=Math.sin(e.h)*sp*dt; e.z+=Math.cos(e.h)*sp*dt; e.x=clamp(e.x,4,WX-4); e.z=clamp(e.z,4,WZ-4); smashAround(e.x+Math.sin(e.h)*1.6,e.z+Math.cos(e.h)*1.6,1.6,2.6,1.7); }
  e.yOv=groundH(e.x,e.z)+Math.sin(e.t*3)*0.25+e.rear*4.2; e.tiltX=-e.rear*0.6-(e.recoil||0)*0.25; e.recoil=Math.max(0,(e.recoil||0)-dt*5); const mvd=Math.hypot(e.x-(e.pxx!=null?e.pxx:e.x),e.z-(e.pzz!=null?e.pzz:e.z)); e.pxx=e.x; e.pzz=e.z; e.mvS=mvd/Math.max(dt,1e-3); e.walk+=mvd*1.45+dt*0.25; dragonTrail(e); dragonPose(e,dt); e.jawG.rotation.x=e.jaw*0.6; e.head.rotation.z=Math.sin(e.t*2)*0.08; if(e.hring) e.hring.rotation.z+=dt*(e.st==='rear'?7:1.6);
  for(const q of e.segs){ if(q.dead) continue; const s=e.segG[q.si]; q.x=s.wx; q.z=s.wz; q.yOv=s.wy-0.9; }
  if(e.ph>=2&&rnd()<0.2){ const s=e.segG[(rnd()*DR_N)|0]; SMOKE.spawn(s.wx,s.wy+0.8,s.wz,0,1.2,0,0.7,1.8,1.4,0.5,0.1,0.08,0.06); if(rnd()<0.5) spark(s.wx,s.wy+0.9,s.wz,(rnd()-0.5)*4,1+rnd()*3,(rnd()-0.5)*4,1,0.5,0.35,0.3); }
  if(d<e.r+TR&&e.ph===1&&(e.bumpT=(e.bumpT||0)-dt)<=0){ e.bumpT=1; damageTank(10,-dx/d,-dz/d,0); TK.vx+=dx/d*6; TK.vz+=dz/d*6; }
  for(const s of e.segG){ const sx=TK.x-s.wx, sz=TK.z-s.wz, sd=Math.hypot(sx,sz); if(sd<s.rr+TR*0.8&&sd>0.01){ TK.vx+=sx/sd*dt*30; TK.vz+=sz/sd*dt*30; } }
  eyeColor(e,true,e.st==='breath'||e.st==='rear'); }
const DFW={speed:20,g:12,spread:0.03,radius:1.6,power:1.0,dmg:12,kind:'shell',size:0.95,burst:1,gap:0,mag:99,high:true};
function dragonFireball(x,y,z,tx,tz){ eShoot(x,y,z,tx,groundH(tx,tz),tz,DFW); FIRE.spawn(x,y,z,0,2,0,1.4,2.5,0.25,1,0.9,0.75,1); tgtMark(tx,tz,1.6,1.6); sO(260,120,0.35,0.07,'sawtooth'); }
function buildDseg(e){ Object.assign(e,{hp:260,maxHp:260,r:1.0,hy:0.9,hr:1.15,mass:5,noCol:true,static:true}); }
function updDseg(e,dt){ if(!e.dr||e.dr.dead){ e.dead=true; eRemove(e); } }
function dieDseg(e){ const s=e.dr&&e.dr.segG[e.si]; deathFx(e.x,(e.yOv||1)+1,e.z,1.6); sfxBoom(1); if(s){ s.lant=false; s.g.children.forEach(o=>{ if(o.material&&o.material===s.g.userData.lm) o.visible=false; }); if(s.g.userData.cage) for(const b of s.g.userData.cage) b.visible=false; s.g.userData.lm=null; }
  for(let k=0;k<20;k++) spark(e.x,(e.yOv||1)+1,e.z,(rnd()-0.5)*10,rnd()*8,(rnd()-0.5)*10,1,0.6,0.2,0.6); eRemove(e); }
function dieDragon(e,dx,dz,src){ e.dead=true; e.dying=true; e.lg.visible=true;
  e.segG.slice().reverse().forEach((sg,k)=>later(k*0.14,()=>{ deathFx(sg.wx,sg.wy,sg.wz,1.4); explode(sg.wx,sg.wy,sg.wz,1.4,0.7,0,-1,0,'shell',null,0,null,0); shatterGroup(sg.g,sg.wx,sg.wy,sg.wz,0.85,16); sg.g.visible=false; }));
  bossDeath(e,{k:3.4,y:e.y+2.4,scrap:900,n:8,after:()=>{ fireworks(); scene.remove(e.lg); }}); }

/* ---- shared: victory, spawning, registry ---- */
function bossWin(e){ for(const o of TGTS) o.T=Math.min(o.T,o.t+0.3); let k=0; for(const m of ENEMIES.filter(m=>!m.dead&&(m.fromBoss||m.fromKrot))) later(0.6+0.25*k++,()=>{ if(!m.dead) killEnemy(m); }); BOSS.e=null; bossBarShow(false); screenFlash(0.45,false); toast(`${e.bName} уничтожен!`); }
const BOSS_SPEC={crypt:{name:'«Энергобот»',hp:2000},krot:{name:'«Крот»',hp:2600},hornet:{name:'«Шершень»',hp:2200},dragon:{name:'«Золотой дракон»',hp:2400}};
function spawnBoss(t){ const L=ARENA.lair||[WX/2,WZ/2]; let e;
  if(t==='crypt'){ e=newEnemy('crypt',L[0],L[1]); buildE(e); bossSetup(e,BOSS_SPEC.crypt.name,BOSS_SPEC.crypt.hp); e.barHp=()=>cryptBar(e); e.ph=1; e.g.visible=false; e.lg.visible=false;
    /* two robot lions sleep inside the crypt; one leaps out toward the top of the map, the other toward the bottom */
    [[80,75.2,[80,61.5],1.15,6.2],[80,84.8,[80,98.5],1.0,4.4]].forEach(([x,z,out,T,arc])=>{ const q=newEnemy('lion',x,z); buildE(q); q.hp=q.maxHp=Math.round(650*bossMul()); q.bossPart=true; q.lockable=false; q.out=out; q.leapT=T; q.arc=arc; q.h=Math.atan2(out[0]-x,out[1]-z); q.pedY=0; });
    e.xfs=XF_PADS.map(([x,z,g])=>{ const q=newEnemy('xfmr',x,z); buildE(q); q.grp=g; q.fromBoss=true; q.h=Math.atan2(80-x,80-z); eRender(q,0); return q; }); }
  else if(t==='krot'){ const p=pickNear(L[0],L[1]-46,3.4)||pickNear(L[0],L[1]-28,3.4)||[L[0],L[1]-28]; e=newEnemy('krot',p[0],p[1]); buildE(e); bossSetup(e,BOSS_SPEC.krot.name,BOSS_SPEC.krot.hp); }
  else if(t==='hornet'){ e=newEnemy('hornet',L[0],L[1]); buildE(e); bossSetup(e,BOSS_SPEC.hornet.name,BOSS_SPEC.hornet.hp); e.alt=11; e.yOv=11; }
  else if(t==='dragon'){ const R=ARENA.ring||[[80,40]]; e=newEnemy('dragon',R[0][0],R[0][1]); buildE(e); bossSetup(e,BOSS_SPEC.dragon.name,BOSS_SPEC.dragon.hp); e.barHp=()=>dragonBar(e); e.h=Math.PI/2; }
  return e; }
ETYPE.krot={build:buildKrot,update:updKrot,die:dieKrot}; ETYPE.hornet={build:buildHornet,update:updHornet,die:dieHornet};
ETYPE.lion={build:buildLion,update:updLion,die:dieLion}; ETYPE.crypt={build:buildCrypt,update:updCrypt,die:dieCrypt}; ETYPE.xfmr={build:buildXfmr,update:updXfmr,die:dieXfmr};
ETYPE.dragon={build:buildDragon,update:updDragon,die:dieDragon}; ETYPE.dseg={build:buildDseg,update:updDseg,die:dieDseg};
Object.assign(ER,{krot:3.4,hornet:3.2,lion:1.7,crypt:1.6,xfmr:2.2,dragon:1.8,dseg:1.0}); Object.assign(ARMZ,{krot:[0.6,1.0,1.5],lion:[0.75,1.1,1.5],dragon:[0.7,1.0,1.3]});

const AUTO_HINT={hold:['krep','Стоять придётся долго. Подумай, на чём ехать.'],lamp:['igla','Снайперов лучше снимать издалека.'],flag:['ten','Пробраться тихо было бы идеально.'],evac:['pchela','Людям пригодится прикрытие с воздуха.']};
function autoBrief(m){ const h=AUTO_HINT[m.k]; return `Сеть ещё огрызается, водитель. ${missionText(m)}. Действуй.`+(h&&UP.tank!==h[0]&&MS.i%2===0?' '+h[1]:''); }
let sightT=0, clearT=0;
function v10Update(dt){ radioUpdate(dt); sightT-=dt; if(sightT<=0){ sightT=0.5; if(!LOC.safe&&!transit) sightUpdate(); }
  if(MS.active){ const m=missionAt(MS.i); if(m.k==='clear'&&m.loc===LOC_ID&&!transit&&!LOC.safe){ clearT-=dt; if(clearT<=0){ clearT=0.5; objUI(); if(enemiesLeft()===0&&MXTRA[MS.i]) completeMission(); } } } }

