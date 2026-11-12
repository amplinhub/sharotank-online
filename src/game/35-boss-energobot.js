/* =================================================================================== */
/* «ЭНЕРГОБОТ» — see below (robot lions + hovering titan + 12 transformers)             */
/* =================================================================================== */
/* =================================================================================== */
/* «ЭНЕРГОБОТ» — two robot lions guard the crypt; then a hovering legless titan, whose     */
/* invisibility field is fed by 12 transformers (4 on the road, 4 in each fenced yard)    */
/* =================================================================================== */
const XF_ZONE=[[80,36,36],[80,124,36],[117,80,24]];   /* field zone: centre + leash radius for each transformer group */
const _xt=[0,0,0], _ep=new THREE.Vector3();
function xfTip(e,k,out){ const ch=Math.cos(e.h), sh=Math.sin(e.h), lx=(k-1)*0.85, lz=0.35; out[0]=e.x+lx*ch+lz*sh; out[1]=e.y+4.85; out[2]=e.z-lx*sh+lz*ch; return out; }
function buildXfmr(e){ Object.assign(e,{r:1.9,hy:1.6,hr:2.1,mass:40,static:true,lockable:true,xf:true,noScrap:true,turn:0});
  e.hp=e.maxHp=Math.round(220*(1+(bossMul()-1)*0.5)); e.onHit=xfHit;
  const G=emat(e,0x6f7f78), G2=emat(e,0x56635e), Dk=emat(e,0x23282c), Mt=emat(e,0x9aa3ad), Yl=emat(e,0xe0a81e), Pc=emat(e,0x7a4326), Wh=emat(e,0xe9e4d6), Hz=emapMat(e,TEXS.haz);
  e.led=eglow(e,0x2aff6a); e.tipM=eglow(e,0x335566); const B=e.body;
  ep(e,EGEO.box,Dk,B,0,0.16,0,4.0,0.32,3.4,true); ep(e,EGEO.box,G,B,0,1.65,0,2.5,2.5,1.9,true); ep(e,EGEO.box,G2,B,0,2.95,0,2.7,0.16,2.1,true);
  for(let k=0;k<6;k++) ep(e,EGEO.box,G2,B,-1.0+k*0.4,1.65,0.97,0.06,2.2,0.04);
  for(const s of [-1,1]){ for(let k=0;k<6;k++) ep(e,EGEO.box,G2,B,s*(1.45+k*0.16),1.55,0,0.07,2.15,1.45);
    for(const y of [0.65,2.45]){ const p=ep(e,EGEO.cyl,Mt,B,s*2.4,y,0,0.22,1.7,0.22); p.rotation.x=Math.PI/2; for(const z of [-0.8,0.8]) ep(e,EGEO.box,Dk,B,s*1.9,y,z,0.8,0.18,0.18); }
    ep(e,EGEO.box,Dk,B,s*2.62,1.55,0,0.05,2.2,0.12); ep(e,EGEO.box,Hz,B,s*2.64,1.0,0.0,0.03,0.4,0.9); }
  const cs=ep(e,EGEO.cyl,G,B,0,3.55,-0.55,0.8,2.6,0.8,true); cs.rotation.z=Math.PI/2; for(const x of [-0.95,0.95]){ ep(e,EGEO.box,Dk,B,x,3.2,-0.55,0.12,0.5,0.4); ep(e,EGEO.sph,G2,B,x*1.35,3.55,-0.55,0.8); }
  e.tips=[]; for(let k=-1;k<=1;k++){ const x=k*0.85, z=0.35; ep(e,EGEO.cyl,Mt,B,x,3.1,z,0.5,0.3,0.5); for(let j=0;j<6;j++){ const rr=0.44-j*0.02; ep(e,EGEO.cyl,j%2?Wh:Pc,B,x,3.35+j*0.2,z,rr,0.17,rr); }
    ep(e,EGEO.cyl,Mt,B,x,4.62,z,0.22,0.3,0.22); ep(e,EGEO.joint,e.tipM,B,x,4.85,z,0.18); const o=new THREE.Object3D(); o.position.set(x,4.85,z); B.add(o); e.tips.push(o); }
  for(let k=-1;k<=1;k++){ ep(e,EGEO.cyl,Pc,B,k*0.75,3.2,-0.8,0.3,0.5,0.3); ep(e,EGEO.cyl,Wh,B,k*0.75,3.55,-0.8,0.22,0.3,0.22); }
  ep(e,EGEO.box,Mt,B,0,1.0,1.18,1.3,1.5,0.45,true); ep(e,EGEO.box,Dk,B,0,1.0,1.42,1.1,1.3,0.03); ep(e,EGEO.box,Hz,B,0,1.62,1.43,1.0,0.22,0.02); ep(e,EGEO.box,e.led,B,0.42,0.55,1.43,0.12,0.12,0.03);
  for(const x of [-0.3,0.15]) ep(e,EGEO.disc,Wh,B,x,1.15,1.44,0.26); ep(e,EGEO.box,Yl,B,-1.0,2.2,0.97,0.5,0.35,0.03);
  for(const x of [-0.32,0.32]) ep(e,EGEO.box,Mt,B,x,1.7,-1.1,0.05,2.6,0.05); for(let k=0;k<7;k++) ep(e,EGEO.box,Mt,B,0,0.55+k*0.33,-1.1,0.64,0.04,0.04);
  ep(e,EGEO.cyl,Dk,B,1.0,0.5,1.55,0.18,1.5,0.18); ep(e,EGEO.box,emat(e,0x3f7a3a),B,-1.5,0.6,1.0,0.06,1.0,0.06); for(let k=0;k<5;k++){ const st=ep(e,EGEO.box,emat(e,0x14181c),B,(rnd()-0.5)*2.2,1.0+rnd()*1.4,0.99,0.3+rnd()*0.4,0.15+rnd()*0.4,0.02); void st; } }
function xfHit(e,dmg,dx,dz,src){ if(e.dead) return; const now=performance.now(); e.hitF=1; const full=now-(e.fxT||0)>70; if(full) e.fxT=now; const l=Math.hypot(dx,dz)||1, ux=dx/l, uz=dz/l, ps=sndAt(e.x,e.z);
  const hx=e.x-ux*1.5, hz=e.z-uz*1.5, hy=e.y+1.0+rnd()*1.6, n=full?(12+Math.min(16,dmg*0.5))|0:3;
  for(let k=0;k<n;k++) spark(hx,hy,hz,-ux*(2+rnd()*9)+(rnd()-0.5)*8,rnd()*7,-uz*(2+rnd()*9)+(rnd()-0.5)*8,0.7+rnd()*0.3,0.9,1,0.2+rnd()*0.3);
  if(full){ FIRE.spawn(hx,hy,hz,0,0.6,0,1.1,2.2,0.12,1,0.6,0.85,1); e.arcT=0.4; xfTip(e,(rnd()*3)|0,_xt); zapBolt(_xt[0],_xt[1],_xt[2],hx,hy,hz,[0.6,0.9,1],0.12,0.6,5);
    sNz(0.12,'highpass',3500,0.8,0.14); sO(2600+rnd()*900,900,0.1,0.06,'sawtooth'); sO(180,80,0.1,0.07,'square'); }
  sndOff(ps); }
function updXfmr(e,dt){ e.t+=dt; { const cb=ENEMIES.find(x=>x.type==='crypt'&&!x.dead); const on=!!cb&&cb.st!=='hidden'; e.inv=!on; e.lockable=on; } const f=e.hp/e.maxHp, hf=e.hitF||0; e.hitF=Math.max(0,hf-dt*4);
  e.led.color.setRGB(f>0.5?0.15:1,f>0.5?1:0.3+0.3*Math.sin(e.t*14),0.15); e.tipM.color.setRGB(0.25+0.7*hf,0.4+0.6*hf,0.55+0.45*hf);
  if(e.arcT>0){ e.arcT-=dt; for(let n=0;n<2;n++){ xfTip(e,(rnd()*3)|0,_xt); const a=rnd()*TAU; zapLine(_xt[0],_xt[1],_xt[2],_xt[0]+Math.cos(a)*(1.5+rnd()*2),e.y+0.8+rnd()*2.5,_xt[2]+Math.sin(a)*(1.5+rnd()*2),[0.6,0.9,1],0.5,5); } }
  if(f<0.7&&rnd()<dt*(1.1-f)*6){ xfTip(e,(rnd()*3)|0,_xt); spark(_xt[0],_xt[1]-0.3,_xt[2],(rnd()-0.5)*4,1+rnd()*3,(rnd()-0.5)*4,0.7,0.9,1,0.3); }
  if(f<0.45&&rnd()<dt*10) SMOKE.spawn(e.x+(rnd()-0.5)*1.6,e.y+3.0,e.z+(rnd()-0.5)*1.4,(rnd()-0.5)*0.5,1.8,(rnd()-0.5)*0.5,0.7,1.8,1.5,0.5,0.1,0.1,0.11);
  if(f<0.25&&rnd()<dt*8) FIRE.spawn(e.x+(rnd()-0.5)*1.4,e.y+3.0,e.z+(rnd()-0.5)*1.2,0,2,0,0.9,1.8,0.5,1,1,0.5,0.15); }
function dieXfmr(e,dx,dz,src){ const x=e.x, z=e.z, y=e.y; deathFx(x,y+1.8,z,2.0); explode(x,y+1.6,z,3.2,2.0,0,-1,0,'shell',null,1.2,e,0.8); sfxBoom(1.2);
  for(let k=0;k<6;k++){ const a=rnd()*TAU; zapBolt(x,y+4.8,z,x+Math.cos(a)*(3+rnd()*3),y+0.3,z+Math.sin(a)*(3+rnd()*3),[0.6,0.9,1],0.35,1.0,8); }
  shatterGroup(e.g,x,y+1.8,z,0.9,28); e.g.visible=false; craterAt(x,z,2.6,0.4); sO(900,60,0.6,0.12,'sawtooth'); sNz(0.5,'highpass',2500,0.8,0.18);
  for(let k=0;k<28;k++) later(0.3+k*0.25,()=>{ FIRE.spawn(x+(rnd()-0.5)*2,y+0.4,z+(rnd()-0.5)*2,(rnd()-0.5),2+rnd()*2,(rnd()-0.5),1.0,2,0.7,1,1,0.5,0.15); SMOKE.spawn(x,y+1.2,z,(rnd()-0.5)*0.6,2+rnd(),(rnd()-0.5)*0.6,0.9,2,1.6,0.5,0.08,0.08,0.09); });
  dropScrap(x,z,60,2); eRemove(e); }

/* ---- robot lions ---- */
function buildLion(e){ Object.assign(e,{hp:540,maxHp:540,r:1.7,hy:1.3,hr:1.6,mass:9,turn:1.6,acc:6,speedW:4.6,navR:1.6,st:'statue',stT:0,pcd:3,rcd:6,lcd:5,gait:0});
  const S=emat(e,0x9fb0c0), S2=emat(e,0x55616e), D=emat(e,0x1b1f24), Au=emat(e,0xd9a21e), Wh=emat(e,0xe8edf2); e.eyeM=eglow(e,0xff3a2a); const Cy=eglow(e,0x34f0ff), B=e.body; e.mats.forEach(m=>m.flatShading=true);
  ep(e,EGEO.box,S,B,0,1.35,-0.2,1.5,1.1,2.4,true); ep(e,EGEO.box,S,B,0,1.55,0.85,1.7,1.4,1.0,true); ep(e,EGEO.box,D,B,0,0.85,-0.2,1.2,0.3,2.2);
  for(let k=0;k<5;k++) ep(e,EGEO.box,S2,B,0,1.95,-1.2+k*0.55,1.2,0.08,0.3); ep(e,EGEO.ring,Cy,B,0,1.45,1.37,0.7); ep(e,EGEO.disc,Cy,B,0,1.45,1.38,0.45);
  for(const s of [-1,1]){ const v=ep(e,EGEO.cyl,D,B,s*0.5,2.0,-1.0,0.3,0.8,0.3); v.rotation.x=0.5; ep(e,EGEO.joint,Cy,B,s*0.5,2.15,-1.3,0.18); ep(e,EGEO.box,S2,B,s*0.82,1.5,0.1,0.06,0.8,1.8); }
  const H=new THREE.Group(); H.position.set(0,2.35,1.35); B.add(H); e.head=H; ep(e,EGEO.box,S,H,0,0,0.25,1.15,1.0,1.0,true);
  for(let k=0;k<14;k++){ const a=k/14*TAU; const f=ep(e,EGEO.box,k%2?S2:Au,H,Math.cos(a)*0.78,Math.sin(a)*0.68+0.05,-0.08,0.26,0.55,0.14); f.rotation.z=a-Math.PI/2; }
  ep(e,EGEO.box,S,H,0,-0.18,0.85,0.8,0.45,0.5,true); const jaw=new THREE.Group(); jaw.position.set(0,-0.42,0.6); H.add(jaw); e.jaw=jaw; ep(e,EGEO.box,S2,jaw,0,-0.1,0.25,0.7,0.22,0.6,true);
  for(let k=0;k<4;k++) ep(e,EGEO.tip,Wh,jaw,-0.24+k*0.16,0.05,0.5,0.08,0.18,0.08);
  e.eyes=[]; for(const s of [-1,1]){ ep(e,EGEO.box,e.eyeM,H,s*0.3,0.15,0.76,0.22,0.12,0.04); ep(e,EGEO.box,D,H,s*0.3,0.32,0.76,0.3,0.08,0.05); const a=ep(e,EGEO.cyl,S2,H,s*0.48,0.8,0.1,0.05,0.7,0.05); ep(e,EGEO.joint,Cy,H,s*0.48,1.18,0.1,0.1); void a; const o=new THREE.Object3D(); o.position.set(s*0.3,0.15,0.82); H.add(o); e.eyes.push(o); }
  ep(e,EGEO.box,D,B,0,1.95,1.05,1.75,0.14,0.2); ep(e,EGEO.joint,Au,B,0,1.85,1.22,0.2);
  e.legsG=[]; for(const [x,z] of [[0.55,0.95],[-0.55,0.95],[0.55,-1.1],[-0.55,-1.1]]){ const L=new THREE.Group(); L.position.set(x,1.1,z); B.add(L); ep(e,EGEO.joint,Au,L,0,0,0,0.5); ep(e,EGEO.box,S,L,0,-0.45,0,0.45,1.0,0.5,true); const pst=ep(e,EGEO.cyl,Wh,L,x>0?0.28:-0.28,-0.5,0.2,0.08,0.9,0.08); void pst; ep(e,EGEO.box,S2,L,0,-1.0,0.12,0.55,0.22,0.75,true); for(let k=0;k<3;k++) ep(e,EGEO.tip,Wh,L,-0.15+k*0.15,-1.0,0.55,0.07,0.2,0.07).rotation.x=Math.PI/2; e.legsG.push(L); }
  const T=new THREE.Group(); T.position.set(0,1.8,-1.4); B.add(T); for(let k=0;k<4;k++) ep(e,EGEO.cyl,k%2?S2:D,T,0,k*0.2,-k*0.15,0.22-k*0.03,0.2,0.22-k*0.03).rotation.x=0.6; ep(e,EGEO.joint,Cy,T,0,0.85,-0.65,0.22); e.tail=T;
  e.pedY=0; }
/* eye-laser beams: additive cylinder cores + soft glow shells (v27.2) */
function lionBeams(e){ if(e.bm) return; e.bm=[]; for(let i=0;i<2;i++){ const mk=(rad,col,op)=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(rad,rad,1,10,1,true).rotateX(Math.PI/2),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); m.visible=false; m.frustumCulled=false; addExtra(m); return m; };
    e.bm.push({core:mk(0.07,0xfff1e0,1),mid:mk(0.16,0xff7a4a,0.7),glow:mk(0.34,0xff3a22,0.35)}); } }

function beamSet(B,x0,y0,z0,x1,y1,z1,w){ const L=Math.hypot(x1-x0,y1-y0,z1-z0)||0.01; for(const k of ['core','mid','glow']){ const m=B[k]; m.visible=true; m.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2); m.lookAt(x1,y1,z1); m.scale.set(w,w,L); } }
function lionBeamsOff(e){ if(!e.bm) return; for(const B of e.bm){ B.core.visible=B.mid.visible=B.glow.visible=false; } }
function flashEyes(e){ e.g.updateMatrixWorld(true); for(const o of e.eyes){ o.getWorldPosition(_bw); FIRE.spawn(_bw.x,_bw.y,_bw.z,0,0,0,1.4,2.2,0.18,1,0.7,0.5,1); for(let k=0;k<8;k++) spark(_bw.x,_bw.y,_bw.z,(rnd()-0.5)*9,(rnd()-0.5)*9,(rnd()-0.5)*9,1,0.6,0.4,0.3); } }
function updLion(e,dt){ const dx=TK.x-e.x, dz=TK.z-e.z, d=Math.max(1e-3,Math.hypot(dx,dz)); e.stT+=dt; e.t+=dt; e.pcd-=dt; e.rcd-=dt; e.lcd-=dt; ePerceive(e,dt,40,1.5);
  const want=Math.atan2(dx,dz); let mv=false, eyeK=0;
  switch(e.st){
  case 'statue': e.inv=true; eBrake(e,dt,20); eyeK=-1; if(e.wake){ e.st='wake'; e.stT=0; sO(60,140,1.2,0.12,'sawtooth'); sO(300,900,1.0,0.07,'square'); } break;
  case 'wake': e.inv=true; eyeK=Math.min(1,e.stT/1.0); e.tiltX=Math.sin(e.stT*30)*0.03; e.g.updateMatrixWorld(true); for(let n=0;n<3;n++){ e.eyes[n%2].getWorldPosition(_bw); spark(_bw.x,_bw.y,_bw.z,(rnd()-0.5)*4,rnd()*3,(rnd()-0.5)*4,1,0.5,0.3,0.3); } for(let n=0;n<2;n++) debSpawn(e.x+(rnd()-0.5)*2.4,1+rnd()*2,e.z+(rnd()-0.5)*2.4,(rnd()-0.5)*5,2+rnd()*4,(rnd()-0.5)*5,0.6,0.62,0.66,0.12+rnd()*0.12);
    if(e.stT>1.3){ const L=ARENA.lair||[e.x,e.z], ux=e.x-L[0], uz=e.z-L[1], ul=Math.hypot(ux,uz)||1; let jt=e.out?{x:e.out[0],z:e.out[1]}:{x:e.x+ux/ul*5,z:e.z+uz/ul*5}; const s=freeSpotOut(jt.x,jt.z,e.r); e.st='leap'; e.stT=0; e.j0={x:e.x,z:e.z}; e.jt={x:s[0],z:s[1]}; e.h=Math.atan2(e.jt.x-e.x,e.jt.z-e.z); e.inv=false; e.lockable=true; e.aggro=true; e.tiltX=0; sfxJump(); } break;
  case 'prowl': { e.h=turnTo(e.h,want,dt*e.turn); if(d>5) { navMove(e,TK.x,TK.z,e.speedW,dt); mv=true; } else eBrake(e,dt,4);
    if(e.lcd<=0&&d>3&&d<13&&e.sees){ e.st='lcharge'; e.stT=0; e.lcd=5+rnd()*3; sO(140,1700,1.3,0.11,'sawtooth'); sO(70,420,1.3,0.08,'sine'); sNz(1.2,'highpass',2000,0.8,0.08); }
    else if((e.pcd<=0&&d>5&&d<16&&e.sees)||(eStuck(e,dt)&&e.pcd<=1.5)){ e.st='crouch'; e.stT=0; sO(110,60,0.5,0.1,'sawtooth'); }
    else if(e.rcd<=0&&d<12){ e.st='roar'; e.stT=0; e.jaw.rotation.x=0.6; sNz(1.1,'lowpass',380,0.7,0.35); sO(90,45,1.1,0.25,'sawtooth'); } eIntegrate(e,dt); break; }
  case 'crouch': eBrake(e,dt,10); e.h=turnTo(e.h,want,dt*3); e.tiltX=-0.18; if(e.stT>0.55){ e.st='leap'; e.stT=0; e.j0={x:e.x,z:e.z}; const L=Math.min(d-1.5,15), s=freeSpotOut(e.x+dx/d*L,e.z+dz/d*L,e.r); e.jt={x:s[0],z:s[1]}; e.tiltX=0; } break;
  case 'leap': { const T=e.leapT||0.75, arc=e.arc||3.6, k=Math.min(1,e.stT/T); e.x=e.j0.x+(e.jt.x-e.j0.x)*k; e.z=e.j0.z+(e.jt.z-e.j0.z)*k; e.yOv=groundH(e.x,e.z)+Math.sin(k*Math.PI)*arc; e.tiltX=-0.3+k*0.5;
    if(k>=1){ e.yOv=null; e.tiltX=0; e.leapT=0; e.arc=0; e.st='prowl'; e.stT=0; e.pcd=e.boss2?3:4.5; explode(e.x,0.4,e.z,1.6,0.9,0,-1,0,'shell',null,0,e,0); groundFlash(e.x,e.z,6,[0.6,0.65,0.7],0.25); shake=Math.min(1,shake+0.35); sfxThud(1.2);
      const dd=Math.hypot(TK.x-e.x,TK.z-e.z); if(dd<3.6){ damageTank(16,TK.x-e.x,TK.z-e.z,1); TK.vx+=(TK.x-e.x)/dd*7; TK.vz+=(TK.z-e.z)/dd*7; } } break; }
  case 'roar': { eBrake(e,dt,10); e.tiltX=-0.25; const R0=e.stT*12; if(!e.rw&&e.stT>0.35){ e.rw=1; const ring=new THREE.Mesh(new THREE.RingGeometry(0.85,1,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x9fffd0,transparent:true,opacity:0.7,depthWrite:false,blending:THREE.AdditiveBlending}));
      ring.position.set(e.x,groundH(e.x,e.z)+0.15,e.z); scene.add(ring); EXTRAS.push(ring); e.rring=ring; }
    if(e.rring){ const r=Math.max(0.1,R0-4); e.rring.scale.setScalar(r); e.rring.material.opacity=Math.max(0,0.8-r/12); if(!e.rhit&&Math.abs(Math.hypot(TK.x-e.x,TK.z-e.z)-r)<1.2){ e.rhit=1; damageTank(8,TK.x-e.x,TK.z-e.z,0); TK.vx+=(TK.x-e.x)/d*8; TK.vz+=(TK.z-e.z)/d*8; shake=Math.min(1,shake+0.3); } }
    if(e.stT>1.4){ e.st='prowl'; e.stT=0; e.rcd=7+rnd()*3; e.tiltX=0; e.jaw.rotation.x=0; if(e.rring){ scene.remove(e.rring); e.rring=null; } e.rw=0; e.rhit=0; } break; }
  /* eye lasers: the eyes charge up (rising whine, sparks converging), then two beams sweep onto the tank */
  case 'lcharge': { eBrake(e,dt,12); e.h=turnTo(e.h,want,dt*2.4); e.tiltX=-0.1; const k=Math.min(1,e.stT/1.3); eyeK=k; e.g.updateMatrixWorld(true); lionBeams(e);
    for(const o of e.eyes){ o.getWorldPosition(_bw); for(let n=0;n<3;n++){ const a=rnd()*TAU, rr=(1-k)*1.5+0.1; spark(_bw.x+Math.cos(a)*rr,_bw.y+Math.sin(a)*rr,_bw.z+(rnd()-0.5)*rr,-Math.cos(a)*rr*3.5,-Math.sin(a)*rr*3.5,0,1,0.3+k*0.5,0.2+k*0.4,0.25); }
      if(k>0.5&&rnd()<dt*18) FIRE.spawn(_bw.x,_bw.y,_bw.z,0,0,0,0.3+k*0.5,0.6+k*0.7,0.12,1,0.45,0.3,0.5); LINES.push(_bw.x,_bw.y,_bw.z,TK.x,TK.y+1.2,TK.z,0.4*k,0.07*k,0.05*k,0.3); }
    e.lcS=(e.lcS||0)-dt; if(e.lcS<=0){ e.lcS=0.09; sO(300+k*1700,330+k*1700,0.1,0.04,'sine'); }
    if(e.stT>1.3){ e.st='lfire'; e.stT=0; e.laim={x:TK.x,z:TK.z}; sO(2600,200,0.9,0.12,'sawtooth'); sO(120,50,0.9,0.14,'square'); sNz(0.9,'bandpass',3200,1.2,0.16); shake=Math.min(1,shake+0.2); flashEyes(e); } break; }
  case 'lfire': { eBrake(e,dt,12); e.h=turnTo(e.h,want,dt*1.2); eyeK=1; const A=e.laim, ax=TK.x-A.x, az=TK.z-A.z, al=Math.hypot(ax,az)||1, st=Math.min(al,7*dt); A.x+=ax/al*st; A.z+=az/al*st; const gy=groundH(A.x,A.z)+0.3; const fk=1-Math.abs(e.stT/1.1*2-1)*0.2, pul=0.85+0.15*Math.sin(e.t*70);
    e.g.updateMatrixWorld(true); lionBeams(e); let n=0; for(const o of e.eyes){ o.getWorldPosition(_bw); const B=e.bm[n++]; beamSet(B,_bw.x,_bw.y,_bw.z,A.x,gy,A.z,pul*fk); FIRE.spawn(_bw.x,_bw.y,_bw.z,0,0,0,0.5,0.9,0.1,1,0.5,0.35,0.6); }
    for(let q=0;q<3;q++) spark(A.x,gy+0.2,A.z,(rnd()-0.5)*10,2+rnd()*6,(rnd()-0.5)*10,1,0.65+rnd()*0.3,0.3,0.3+rnd()*0.2); if(rnd()<0.5) FIRE.spawn(A.x,gy+0.3,A.z,(rnd()-0.5),2,(rnd()-0.5),1.0,2.0,0.3,1,0.8,0.4,0.2); if(rnd()<0.25) SMOKE.spawn(A.x,gy+0.4,A.z,0,1.5,0,0.8,1.8,1.2,0.3,0.3,0.32,0.4);
    groundFlash(A.x,A.z,2.6,[1,0.5,0.3],0.12);
    e.lzS=(e.lzS||0)-dt; if(e.lzS<=0){ e.lzS=0.06; sO(1700+rnd()*500,1400,0.08,0.05,'sawtooth'); sNz(0.07,'bandpass',3000,2,0.08); sO(110,100,0.08,0.05,'square'); }
    if(Math.hypot(TK.x-A.x,TK.z-A.z)<2.0&&losTank(_bw.x,_bw.y,_bw.z)) damageTank(26*dt,TK.x-e.x,TK.z-e.z,0);
    if(e.stT>1.1){ e.st='prowl'; e.stT=0; e.tiltX=0; lionBeamsOff(e); } break; }
  }
  if(mv){ e.gait+=dt*8; } const sw=mv?Math.sin(e.gait)*0.45:0; e.legsG.forEach((L,i)=>L.rotation.x=(i===0||i===3)?sw:-sw); e.tail.rotation.x=Math.sin(e.t*3)*0.3; e.head.rotation.y=clamp(wrapA(want-e.h),-0.6,0.6)*0.5;
  if(e.st!=='leap'&&e.st!=='statue'&&e.st!=='wake'&&d<e.r+TR+0.2&&(e.bumpT=(e.bumpT||0)-dt)<=0){ e.bumpT=1; damageTank(7,-dx/d,-dz/d,0); TK.vx+=dx/d*4; TK.vz+=dz/d*4; sfxThud(0.8); }
  if(eyeK>0) e.eyeM.color.setRGB(1,0.25+0.75*eyeK,0.2+0.8*eyeK); else if(eyeK<0) e.eyeM.color.setRGB(0.25,0.04,0.03); else eyeColor(e,true,false); }
function dieLion(e,dx,dz,src){ deathFx(e.x,e.y+1.4,e.z,1.8); sfxBoom(1); explode(e.x,e.y+1.2,e.z,2.4,1.4,0,-1,0,'shell',null,0,e,0.5); shatterGroup(e.g,e.x,e.y+1.3,e.z,0.8,30); e.g.visible=false;
  for(let k=0;k<24;k++) spark(e.x,e.y+1.3,e.z,(rnd()-0.5)*14,rnd()*9,(rnd()-0.5)*14,1,0.7,0.35,0.6); if(e.rring){ scene.remove(e.rring); e.rring=null; } if(e.bm){ lionBeamsOff(e); for(const B of e.bm) for(const k of ['core','mid','glow']) scene.remove(B[k]); e.bm=null; }
  dropScrap(e.x,e.z,80,1.5); eRemove(e); const R=ENEMIES.find(q=>q.type==='crypt'&&!q.dead); if(R) R.lionDied=true; }

/* ---- Energobot: legless hovering humanoid, very long verlet-physics arms, Tesla coils on the back ---- */
const EBW={speed:44,g:0,spread:0.035,radius:0.95,power:0.85,dmg:9,kind:'shell',size:0.75,burst:1,gap:0,mag:99};
const EB_SC=1.35, EB_K=EB_SC/1.15;
function buildCrypt(e){ Object.assign(e,{r:1.6*EB_K,hy:3.7*EB_K,hr:2.8*EB_K,shieldR:7.4*EB_K/1.43,mass:14,turn:2.4,acc:10,speedW:5,st:'hidden',stT:0,ghost:1,lockable:false,inv:true,noCol:true,mode:'guard',grp:2,aCD:3,swCD:1,atk:null,aT:0,vT:0,alt:0});
  const Bk=emat(e,0x1b2230), Pl=emat(e,0x38445a), Rd=emat(e,0x8e1f2a), Mt=emat(e,0x9aa3ad), Dk=emat(e,0x111419), Cu=emat(e,0xb5651d), Hz=emapMat(e,TEXS.haz);
  e.eyeM=eglow(e,0xff3a2a); e.coreM=eglow(e,0x34f0ff); e.tipM=eglow(e,0x9fe8ff); const Cy=eglow(e,0x34f0ff), Mg=eglow(e,0xff2ad0); const B=e.body;
  /* anti-grav pod instead of legs */
  const pod=ep(e,EGEO.tip,Dk,B,0,0.95,0,2.4,1.9,2.4,true); pod.rotation.x=Math.PI; e.rings=[]; for(let k=0;k<3;k++){ const rg=ep(e,EGEO.ring,k%2?Mg:Cy,B,0,0.3+k*0.5,0,1.0+k*0.5); rg.rotation.x=Math.PI/2; rg.userData.keep=true; e.rings.push(rg); }
  ep(e,EGEO.box,Pl,B,0,2.0,0,2.0,0.6,1.25,true); ep(e,EGEO.box,Bk,B,0,2.6,-0.05,1.2,0.9,0.9); for(let k=0;k<3;k++) ep(e,EGEO.box,Pl,B,0,2.35+k*0.28,0.5,1.0,0.14,0.25);
  ep(e,EGEO.box,Pl,B,0,3.4,0,2.4,1.5,1.45,true); ep(e,EGEO.box,Rd,B,0,3.45,0.65,2.0,1.1,0.3,true).rotation.x=-0.12; ep(e,EGEO.disc,e.coreM,B,0,3.4,0.84,0.7); ep(e,EGEO.ring,Cy,B,0,3.4,0.86,0.98);
  for(const s of [-1,1]){ ep(e,EGEO.box,Dk,B,s*0.55,3.0,0.84,0.12,0.5,0.05); ep(e,EGEO.sph,Pl,B,s*1.62,3.9,0,1.15,0.95,1.25,true); for(let k=0;k<3;k++){ const sp=ep(e,EGEO.tip,Rd,B,s*(1.4+k*0.32),4.5-k*0.1,-0.1-k*0.2,0.22,0.75,0.22); sp.rotation.z=-s*(0.15+k*0.12); }
    ep(e,EGEO.sph,Mt,B,s*1.62,3.78,0.0,0.5); ep(e,EGEO.ring,Cy,B,s*1.62,3.78,0.0,0.75).rotation.y=Math.PI/2; ep(e,EGEO.box,Bk,B,s*1.2,3.0,0.0,0.7,0.35,0.7); }
  ep(e,EGEO.box,Dk,B,0,4.12,0.05,0.5,0.4,0.5); const H=new THREE.Group(); H.position.set(0,4.65,0.15); B.add(H); e.head=H;
  ep(e,EGEO.box,Bk,H,0,0,0,0.95,0.9,1.0,true); ep(e,EGEO.box,Pl,H,0,-0.05,0.45,0.8,0.7,0.2,true); ep(e,EGEO.box,Rd,H,0,0.6,-0.1,0.14,0.45,1.0,true).rotation.x=-0.25; ep(e,EGEO.box,Dk,H,0,-0.42,0.5,0.6,0.1,0.15);
  for(const s of [-1,1]){ ep(e,EGEO.box,e.eyeM,H,s*0.22,0.1,0.56,0.32,0.07,0.04).rotation.z=s*-0.35; for(let k=0;k<3;k++) ep(e,EGEO.box,Dk,H,s*0.3,-0.25-k*0.0,0.56+0.0,0.04,0.06,0.04); const hn=ep(e,EGEO.tip,Rd,H,s*0.5,0.5,-0.2,0.16,0.85,0.16); hn.rotation.set(-0.9,0,s*0.4);
    ep(e,EGEO.box,Dk,H,s*0.52,-0.05,0.0,0.06,0.5,0.7); const an=ep(e,EGEO.cyl,Mt,H,s*0.3,0.75,-0.4,0.04,0.8,0.04); an.rotation.x=-0.3; ep(e,EGEO.joint,e.tipM,H,s*0.3,1.12,-0.55,0.1); }
  for(let k=0;k<4;k++) ep(e,EGEO.box,Dk,H,-0.18+k*0.12,-0.28,0.56,0.04,0.2,0.04);
  /* back container with two Tesla coils */
  ep(e,EGEO.box,Mt,B,0,3.35,-1.1,2.0,2.1,0.95,true); ep(e,EGEO.box,Hz,B,0,3.4,-0.62,1.7,0.3,0.03); for(let k=0;k<5;k++) ep(e,EGEO.box,Dk,B,0,2.6+k*0.33,-1.6,1.7,0.06,0.04);
  for(const s of [-1,1]){ ep(e,EGEO.box,Dk,B,s*0.9,3.3,-0.7,0.2,1.6,0.2); ep(e,EGEO.cyl,Dk,B,s*0.6,4.5,-1.1,0.62,0.35,0.62,true);
    for(let j=0;j<8;j++){ const rr=0.46-j*0.028; ep(e,EGEO.cyl,j%2?Cu:Mt,B,s*0.6,4.72+j*0.2,-1.1,rr,0.16,rr); } ep(e,EGEO.cyl,Mt,B,s*0.6,5.5,-1.1,0.1,1.4,0.1);
    ep(e,EGEO.ring,Mt,B,s*0.6,6.3,-1.1,1.0).rotation.x=Math.PI/2; ep(e,EGEO.sph,e.tipM,B,s*0.6,6.55,-1.1,0.36); }
  e.coilTip=[]; for(const s of [-1,1]){ const o=new THREE.Object3D(); o.position.set(s*0.6,6.7,-1.1); B.add(o); e.coilTip.push(o); }
  B.scale.setScalar(EB_SC);
  e.arms=[armBuild(e,-1),armBuild(e,1)]; armsInit(e);
  e.ghostMats=[]; const gm=o=>{ if(o.material&&o.material!==outlineMat&&!e.ghostMats.includes(o.material)) e.ghostMats.push(o.material); }; e.g.traverse(gm); e.lg.traverse(gm); }
function armBuild(e,s){ const Pl=emat(e,0x38445a), Bk=emat(e,0x1b2230), Rd=emat(e,0x8e1f2a), Mt=emat(e,0x9aa3ad); const a={s,L:[1.75*EB_K,1.65*EB_K,1.15*EB_K],pts:[],lm:[],jm:[],hit:false,orb:eglow(e,0xff5a3a)};
  for(let i=0;i<4;i++) a.pts.push({x:0,y:0,z:0,px:0,py:0,pz:0});
  const wd=[0.62*EB_K,0.52*EB_K,0.42*EB_K], mt=[Pl,Bk,Pl]; for(let i=0;i<3;i++){ const m=new THREE.Mesh(EGEO.box,mt[i]); e.lg.add(m); const ol=new THREE.Mesh(EGEO.box,outlineMat); ol.scale.setScalar(1.07); m.add(ol); a.lm.push({m,w:wd[i]}); }
  for(let i=0;i<4;i++){ const j=new THREE.Mesh(EGEO.sph,i===0?Mt:(i===3?Rd:Mt)); j.scale.setScalar([0.6,0.55,0.5,0.46][i]*EB_K); e.lg.add(j); a.jm.push(j); }
  const hd=new THREE.Group(); hd.scale.setScalar(EB_K); e.lg.add(hd); a.hand=hd; const pm=new THREE.Mesh(EGEO.box,Bk); pm.scale.set(0.6,0.45,0.34); pm.position.y=0.25; hd.add(pm);
  for(let k=-1;k<=1;k++){ const c=new THREE.Mesh(EGEO.tip,Rd); c.scale.set(0.14,0.85,0.14); c.position.set(k*0.24,0.78,0); c.rotation.z=-k*0.32; hd.add(c); }
  const ob=new THREE.Mesh(EGEO.sph,a.orb); ob.scale.setScalar(0.34); ob.position.set(0,0.42,0.22); hd.add(ob); a.obm=ob; return a; }
function ebShoulder(e,s,out){ const ch=Math.cos(e.h), sh=Math.sin(e.h), lx=s*1.62*EB_SC, ly=3.78*EB_SC; out.x=e.x+lx*ch; out.y=e.y+ly; out.z=e.z-lx*sh; return out; }
const _sh0={x:0,y:0,z:0}, _tg={x:0,y:0,z:0};
function armsInit(e){ for(const a of e.arms){ ebShoulder(e,a.s,_sh0); let y=_sh0.y; a.pts.forEach((p,i)=>{ if(i>0) y-=a.L[i-1]; p.x=_sh0.x; p.z=_sh0.z; p.y=y; p.px=p.x; p.py=p.y; p.pz=p.z; }); armRender(a); } }
function armRender(a){ const P=a.pts; for(let i=0;i<3;i++) placeSeg(a.lm[i].m,P[i],P[i+1],a.lm[i].w,a.lm[i].w); for(let i=0;i<4;i++) a.jm[i].position.set(P[i].x,P[i].y,P[i].z);
  const dx=P[3].x-P[2].x, dy=P[3].y-P[2].y, dz=P[3].z-P[2].z, l=Math.hypot(dx,dy,dz)||1; a.hand.position.set(P[3].x,P[3].y,P[3].z); _dirV.set(dx/l,dy/l,dz/l); a.hand.quaternion.setFromUnitVectors(UPV,_dirV); }
/* verlet chain: gravity + inertia make the arm trail and whip; a spring pulls the wrist to the commanded point */
function armStep(a,sh,tg,k,dt,grav){ const P=a.pts; P[0].x=sh.x; P[0].y=sh.y; P[0].z=sh.z; P[0].px=sh.x; P[0].py=sh.y; P[0].pz=sh.z;
  for(let i=1;i<4;i++){ const p=P[i], vx=(p.x-p.px)*0.985, vy=(p.y-p.py)*0.985, vz=(p.z-p.pz)*0.985; p.px=p.x; p.py=p.y; p.pz=p.z; p.x+=vx; p.y+=vy-(grav==null?16:grav)*dt*dt; p.z+=vz; }
  if(tg){ const f=Math.min(1,k*dt); for(const [i,w] of [[3,1],[2,0.66],[1,0.33]]){ const p=P[i], ox=sh.x+(tg.x-sh.x)*w, oy=sh.y+(tg.y-sh.y)*w, oz=sh.z+(tg.z-sh.z)*w; const ff=f*(i===3?1:0.5); p.x+=(ox-p.x)*ff; p.y+=(oy-p.y)*ff; p.z+=(oz-p.z)*ff; } }
  for(let it=0;it<5;it++){ for(let i=0;i<3;i++){ const A=P[i], C=P[i+1], dx=C.x-A.x, dy=C.y-A.y, dz=C.z-A.z, d=Math.hypot(dx,dy,dz)||1e-4, df=(d-a.L[i])/d;
      if(i===0){ C.x-=dx*df; C.y-=dy*df; C.z-=dz*df; } else { const h=0.5*df; A.x+=dx*h; A.y+=dy*h; A.z+=dz*h; C.x-=dx*h; C.y-=dy*h; C.z-=dz*h; } }
    for(let i=1;i<4;i++){ const gy=groundH(P[i].x,P[i].z)+0.3; if(P[i].y<gy) P[i].y=gy; } } }
function ebAlive(e,g){ let n=0; for(const q of e.xfs) if(!q.dead&&q.grp===g) n++; return n; }
function ebPickGroup(e,from){ let best=-1, bd=1e9; for(let g=0;g<3;g++){ if(g===from||!ebAlive(e,g)) continue; const Z=XF_ZONE[g], dd=Math.hypot(Z[0]-e.x,Z[1]-e.z); if(dd<bd){ bd=dd; best=g; } } return best; }
function cryptGhost(e,k){ if(e.ghost===k&&e._ghSet) return; e._ghSet=true; e.ghost=k; for(const m of e.ghostMats){ m.transparent=k>0.02; m.opacity=1-k*0.74; m.depthWrite=k<0.5; } const ov=k<0.3; if(e._ov!==ov){ e._ov=ov; const f=o=>{ if(o.material===outlineMat) o.visible=ov; }; e.g.traverse(f); e.lg.traverse(f); } }
function cryptBar(e){ if(e.ph===1){ let c=0,m=0; for(const q of ENEMIES) if(q.type==='lion'&&q.bossPart){ m+=q.maxHp; if(!q.dead) c+=Math.max(0,q.hp); } return [c,Math.max(m,1)]; } return [e.hp,e.maxHp]; }
function ebWorld(e,lx,lz,out){ const ch=Math.cos(e.h), sh=Math.sin(e.h); out.x=e.x+lx*ch+lz*sh; out.z=e.z-lx*sh+lz*ch; return out; }
/* force-field shell around the Energobot while the transformers feed him (v27.2) */
const SH_VS='varying vec3 vN;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
const SH_FS='uniform float uK;uniform float uT;uniform vec3 uHit;uniform float uHT;varying vec3 vN;varying vec3 vP;void main(){float f=pow(1.0-abs(dot(normalize(vN),vec3(0.0,0.0,1.0))),2.0);float a=atan(vP.x,vP.z);float hx=abs(sin(a*9.0+uT*0.6))*abs(sin(vP.y*14.0-uT*1.3));float net=smoothstep(0.86,0.97,max(hx,abs(sin(vP.y*7.0+a*3.0+uT)))*0.9);float sc=0.5+0.5*sin(vP.y*5.0-uT*3.0);float dd=distance(vP,uHit);float rip=exp(-pow((dd-uHT*1.7)*6.0,2.0))*(1.0-uHT)*step(uHT,0.999);float fl=exp(-dd*2.2)*(1.0-uHT)*step(uHT,0.999);vec3 c=mix(vec3(0.15,0.6,1.0),vec3(0.75,0.95,1.0),f);float al=(0.07+f*0.55+net*0.22*(0.4+sc)+rip*1.2+fl*0.5)*uK;gl_FragColor=vec4(c*al*1.6,al);}';
function shellBuild(e){ const u={uK:{value:0},uT:{value:0},uHit:{value:new THREE.Vector3(0,1,0)},uHT:{value:1}};
  const m=new THREE.Mesh(new THREE.SphereGeometry(1,40,28),new THREE.ShaderMaterial({uniforms:u,vertexShader:SH_VS,fragmentShader:SH_FS,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.FrontSide})); m.scale.setScalar(e.shieldR); m.position.y=e.hy; m.visible=false; m.userData.keep=true; m.renderOrder=6; m.frustumCulled=false; e.g.add(m); e.shell=m; e.shU=u; e.shK=0;
  e.shellHit=(q,hx,hy,hz)=>{ _bw.set(hx,hy,hz); q.g.worldToLocal(_bw); _bw.y-=q.hy; _bw.normalize(); q.shU.uHit.value.copy(_bw); q.shU.uHT.value=0; for(let k=0;k<5;k++) spark(hx,hy,hz,(rnd()-0.5)*7,(rnd()-0.5)*7,(rnd()-0.5)*7,0.5,0.85,1,0.3); FIRE.spawn(hx,hy,hz,0,0,0,0.9,1.8,0.12,0.5,0.85,1,0.6); sO(1500,420,0.16,0.07,'sine'); sNz(0.1,'highpass',3500,0.7,0.1); }; }
function shellUpd(e,dt){ if(!e.shell) shellBuild(e); const U=e.shU; e.shK+=((e.shOn?1:0)-e.shK)*Math.min(1,dt*4); e.shell.visible=e.shK>0.02&&e.g.visible; U.uK.value=e.shK*(0.88+0.12*Math.sin(e.t*17)); U.uT.value=e.t; if(U.uHT.value<1) U.uHT.value=Math.min(1,U.uHT.value+dt*1.8);
  if(e.shell.visible&&rnd()<dt*7){ const a=rnd()*TAU, b=(rnd()-0.5)*2.2, R=e.shieldR, ch=Math.cos(b); const x=e.x+Math.cos(a)*ch*R, y=e.y+e.hy+Math.sin(b)*R, z=e.z+Math.sin(a)*ch*R; zapLine(x,y,z,x+(rnd()-0.5)*3,y+(rnd()-0.5)*3,z+(rnd()-0.5)*3,[0.5,0.85,1],0.35,4); } }
function updCrypt(e,dt){ const dx=TK.x-e.x, dz=TK.z-e.z, d=Math.max(1e-3,Math.hypot(dx,dz)); e.stT+=dt; e.t+=dt; const want=Math.atan2(dx,dz);
  if(e.st==='hidden'){ e.g.visible=false; e.lg.visible=false; e.inv=true; e.lockable=false; e.noCol=true; e.xhide=true; e.state='fly';
    if(!e.lionsUp&&d<46){ e.lionsUp=true; for(const q of ENEMIES) if(q.type==='lion'&&q.bossPart) q.wake=true; }
    if(e.lionsUp&&e.t>2&&!ENEMIES.some(q=>q.type==='lion'&&q.bossPart&&!q.dead)){ e.st='emerge'; e.stT=0; e.ph=2; const L=ARENA.lair||[80,80]; e.x=L[0]; e.z=L[1]; e.h=Math.atan2(TK.x-e.x,TK.z-e.z); e.grp=Math.max(0,ebPickGroup(e,-1)); e.xhide=false; e.state='idle'; e.noCol=false;
      explode(e.x,1.4,e.z,2.4,1.6,0,1,0,'shell',null,0,e,0); shake=Math.min(1,shake+0.5); sO(60,160,1.6,0.16,'sawtooth'); sNz(1.2,'lowpass',400,0.8,0.3); e.g.visible=true; e.lg.visible=true; e.alt=groundH(e.x,e.z)-4; armsInit(e); } return; }
  const alive=e.xfs.filter(q=>!q.dead), rage=alive.length===0;
  if(rage&&e.ph<3){ e.ph=3; e.mode='rage'; e.atk=null; e.aCD=1; shockwave(e.x,e.z,20,[0.5,0.9,1]); screenFlash(0.35,false); shake=Math.min(1,shake+0.6); sO(70,35,1.4,0.2,'sawtooth'); sNz(1.0,'lowpass',500,0.7,0.3);
    for(let k=0;k<4;k++) zapBolt(e.x,e.y+4,e.z,e.x+(rnd()-0.5)*14,e.y+0.5+rnd()*6,e.z+(rnd()-0.5)*14,[0.6,0.9,1],0.35,1.2,8); }
  if(!rage){
    if(e.mode==='guard'){ if(ebAlive(e,e.grp)===0){ e.mode='vuln'; e.vT=0; shockwave(e.x,e.z,12,[0.6,0.9,1]); sO(900,60,0.8,0.12,'sawtooth'); sNz(0.5,'highpass',2000,0.8,0.15); for(let n=0;n<30;n++) spark(e.x,e.y+3.5,e.z,(rnd()-0.5)*14,rnd()*9,(rnd()-0.5)*14,0.6,0.9,1,0.5); } }
    else if(e.mode==='vuln'){ e.vT+=dt; if(e.vT>15){ const g=ebPickGroup(e,e.grp); if(g>=0){ e.mode='fly'; e.tgrp=g; e.fT=0; e.atk=null; sO(300,1200,0.9,0.1,'sawtooth'); } else e.vT=0; } }
    else if(e.mode==='fly'){ e.fT+=dt; const Z=XF_ZONE[e.tgrp]; if(Math.hypot(Z[0]-e.x,Z[1]-e.z)<10||e.fT>7){ e.grp=e.tgrp; e.mode=ebAlive(e,e.grp)>0?'guard':'vuln'; e.vT=0; e.aCD=1.5; } } }
  const shielded=!rage&&(e.mode==='guard'||e.mode==='fly'); e.inv=e.st==='emerge'||shielded; e.lockable=!e.inv; e.barInv=e.inv;
  cryptGhost(e,0); e.shOn=e.st==='emerge'||shielded; shellUpd(e,dt);
  /* hover & movement */
  const sc=1.0; void sc; let sp=0, tx=TK.x, tz=TK.z, lift=0;
  if(e.st==='emerge'){ if(!e.ex0){ e.ex0={x:e.x,z:e.z}; e.exd=TK.z<e.z?-1:1; } const T=3.8, up=Math.min(1,e.stT/1.2), ko=clamp((e.stT-0.8)/2.8,0,1), ea=ko*ko*(3-2*ko); e.x=e.ex0.x; e.z=e.ex0.z+e.exd*26*ea; const base=groundH(e.x,e.z);
    e.alt=e.stT<1.2?base-4+up*(4+9.2):base+9.2-ea*8.0;
    if(!e.roofFx&&e.stT>0.35){ e.roofFx=1; const rx=e.ex0.x, rz=e.ex0.z; explode(rx,8.2,rz,4.5,1.6,0,1,0,'shell',null,0,e,0); shockwave(rx,rz,18,[0.6,0.9,1]); screenFlash(0.3,false); shake=Math.min(1,shake+0.8); sO(50,200,1.4,0.2,'sawtooth'); sNz(1.4,'lowpass',500,0.8,0.35); sO(1800,200,0.9,0.1,'sawtooth');
      for(let n=0;n<42;n++){ const a=rnd()*TAU, v=4+rnd()*9; debSpawn(rx+Math.cos(a)*3,7.4,rz+Math.sin(a)*3,Math.cos(a)*v*0.6,6+rnd()*9,Math.sin(a)*v*0.6,0.42,0.43,0.46,0.14+rnd()*0.2); } for(let n=0;n<26;n++) spark(rx,7.8,rz,(rnd()-0.5)*16,rnd()*12,(rnd()-0.5)*16,0.6,0.9,1,0.7); for(let n=0;n<6;n++) zapBolt(rx,8,rz,rx+(rnd()-0.5)*16,2+rnd()*7,rz+(rnd()-0.5)*16,[0.6,0.9,1],0.3,1.0,7); }
    if(e.stT>T){ e.st='fight'; e.stT=0; } e.h=turnTo(e.h,Math.atan2(TK.x-e.x,TK.z-e.z),dt*2.2); for(let n=0;n<2;n++) debSpawn(e.x+(rnd()-0.5)*4,0.6,e.z+(rnd()-0.5)*4,(rnd()-0.5)*6,3+rnd()*4,(rnd()-0.5)*6,0.5,0.5,0.52,0.15+rnd()*0.15); }
  else {
    const Zc=XF_ZONE[e.mode==='fly'?e.tgrp:e.grp];
    if(e.mode==='fly'){ tx=Zc[0]; tz=Zc[1]; sp=26; lift=3; e.h=turnTo(e.h,Math.atan2(tx-e.x,tz-e.z),dt*3); }
    else { const stand=rage?5.5:15; if(e.atk==='swing'){ sp=d>4.4?6:0; } else if(d>stand+3) sp=rage?13:7.5; else if(d<stand-4&&!rage) sp=-4.5; else sp=0;
      e.h=turnTo(e.h,want,dt*(e.atk?3.2:e.turn)); }
    const mx=e.mode==='fly'||rage?tx-e.x:dx, mz=e.mode==='fly'||rage?tz-e.z:dz, ml=Math.hypot(mx,mz)||1; let vx=mx/ml*sp, vz=mz/ml*sp;
    if(!rage&&e.mode!=='fly'){ const nx=e.x+vx*dt, nz=e.z+vz*dt; if(Math.hypot(nx-Zc[0],nz-Zc[1])>Zc[2]&&Math.hypot(nx-Zc[0],nz-Zc[1])>Math.hypot(e.x-Zc[0],e.z-Zc[1])){ const ux=Zc[0]-e.x, uz=Zc[1]-e.z, ul=Math.hypot(ux,uz)||1; vx=ux/ul*3; vz=uz/ul*3; } }
    e.vx+=(vx-e.vx)*Math.min(1,dt*2.2); e.vz+=(vz-e.vz)*Math.min(1,dt*2.2); e.x=clamp(e.x+e.vx*dt,6,WX-6); e.z=clamp(e.z+e.vz*dt,6,WZ-6);
    const gt=Math.max(groundH(e.x,e.z),Math.min(colTop(e.x,e.z),3.4),Math.min(colTop(e.x+e.vx*0.6,e.z+e.vz*0.6),3.4)); const ty=gt+1.2+lift+Math.sin(e.t*1.7)*0.2; e.alt+=(ty-e.alt)*Math.min(1,dt*3); }
  e.yOv=e.alt; e.noCol=e.st==='emerge';
  if(e.alt-groundH(e.x,e.z)<2.6&&rnd()<dt*16){ const a=rnd()*TAU; debSpawn(e.x+Math.cos(a)*1.4,groundH(e.x,e.z)+0.15,e.z+Math.sin(a)*1.4,Math.cos(a)*5,0.8,Math.sin(a)*5,0.5,0.45,0.38,0.14); }
  for(let k=0;k<e.rings.length;k++){ const sc2=(1.0+k*0.5)*(1+0.06*Math.sin(e.t*8+k)); e.rings[k].scale.setScalar(sc2*(e.mode==='fly'?1.25:1)); }
  e.coreM.color.setRGB(rage?1:0.2,rage?0.25:0.85,rage?0.3:1); e.tipM.color.setRGB(0.5+0.4*Math.sin(e.t*30),0.9,1);
  /* attacks */
  if(e.st==='fight'&&e.mode!=='fly'){ e.aCD-=dt; e.swCD-=dt; ebAttacks(e,dt,d,dx,dz,rage); }
  /* field arcs: transformers of the current group → the Energobot's chest (and a dim echo) */
  wmOnce(e); const cx_=e.x, cy_=e.y+3.6, cz_=e.z;
  if(shielded&&e.st==='fight'){ const gg=e.mode==='fly'?e.grp:e.grp; for(const q of e.xfs){ if(q.dead||q.grp!==gg) continue; xfTip(q,(rnd()*3)|0,_xt); zapLine(_xt[0],_xt[1],_xt[2],cx_,cy_,cz_,[0.35,0.8,1],1.0,7); if(rnd()<0.5) zapLine(_xt[0],_xt[1],_xt[2],cx_,cy_,cz_,[0.9,0.25,0.85],1.6,6); if(rnd()<dt*18) spark(cx_+(rnd()-0.5)*2,cy_+(rnd()-0.5)*2,cz_,(rnd()-0.5)*5,rnd()*3,(rnd()-0.5)*5,0.5,0.9,1,0.3); } }
  if(rnd()<dt*(rage?6:2.5)&&e.coilTip){ e.coilTip[0].getWorldPosition(_bw); e.coilTip[1].getWorldPosition(_ep); zapBolt(_bw.x,_bw.y,_bw.z,_ep.x,_ep.y,_ep.z,[0.7,0.9,1],0.1,0.5,5); if(rnd()<0.5) zapBolt(_bw.x,_bw.y,_bw.z,_bw.x+(rnd()-0.5)*4,_bw.y+1+rnd()*2,_bw.z+(rnd()-0.5)*4,[0.6,0.85,1],0.1,0.8,4); }
  /* arms: verlet chains hanging from the shoulders, driven toward the commanded points */
  ebArms(e,dt);
  e.humT=(e.humT||0)-dt; if(e.humT<=0){ e.humT=0.12; sNz(0.12,'lowpass',200,1,0.05); }
  eyeColor(e,true,e.atk==='blast'||rage); }
/* ---- attack scheduler: blast (arms out, charge, energy bolts), swing (wide alternating hooks), storm (Tesla lightning strikes) ---- */
function ebAttacks(e,dt,d,dx,dz,rage){
  if(!e.atk){ if(d<8.5*EB_K&&e.swCD<=0){ e.atk='swing'; e.aT=0; e.swN=rage?5:3; e.swA=e.arms[0].hit?1:0; e.swPh=0; e.swIdx=-1; e.arms[0].hit=e.arms[1].hit=false; }
    else if(e.aCD<=0){ if(d<38&&losClear(e.x,e.y+3.6,e.z,TK.x,TK.y+1.4,TK.z)&&(rnd()<(rage?0.4:0.45)||d<10)){ e.atk='blast'; e.aT=0; e.bN=0; sO(150,1200,1.0,0.1,'sawtooth'); sNz(0.9,'highpass',1800,0.7,0.07); }
      else { e.atk='storm'; e.aT=0; e.stN=0; sO(100,700,1.2,0.1,'sawtooth'); sNz(1.1,'bandpass',2400,1.5,0.09); } }
    return; }
  e.aT+=dt;
  if(e.atk==='blast'){ if(e.aT>1.0&&e.aT<2.5&&e.aT>1.0+e.bN*0.17){ const a=e.arms[e.bN%2], P=a.pts[3]; e.g.updateMatrixWorld(true); const fx=Math.sin(e.h), fz=Math.cos(e.h);
      eShoot(P.x+fx*0.8,P.y,P.z+fz*0.8,TK.x+TK.vx*0.25,TK.y+1.1,TK.z+TK.vz*0.25,EBW); FIRE.spawn(P.x+fx*0.8,P.y,P.z+fz*0.8,fx*2,0.3,fz*2,1.5,2.8,0.16,1,e.bN%2?1:0.35,e.bN%2?0.35:0.9,1);
      zapBolt(P.x,P.y,P.z,P.x+fx*2.5+(rnd()-0.5)*2,P.y+(rnd()-0.5)*2,P.z+fz*2.5+(rnd()-0.5)*2,[0.7,0.9,1],0.1,0.6,5); P.px+=fx*0.5; P.pz+=fz*0.5; shake=Math.min(1,shake+0.05);
      sO(1100,180,0.2,0.1,'sawtooth'); sNz(0.1,'highpass',2800,0.8,0.12); e.bN++; }
    if(e.aT>3.1){ e.atk=null; e.aCD=rage?3.0:6.2; } }
  else if(e.atk==='swing'){ const CY=1.15; e.swPh=e.aT%CY; const n=Math.floor(e.aT/CY); if(n>=e.swN||(n>=1&&d>12*EB_K)){ e.atk=null; e.swCD=rage?1.2:2.2; e.aCD=Math.max(e.aCD,rage?0.6:1.5); return; }
    if(n!==e.swIdx){ e.swIdx=n; e.swA=n%2; e.arms[e.swA].hit=false; sO(260,90,0.3,0.1,'sawtooth'); } }
  else if(e.atk==='storm'){ if(e.aT>1.2&&e.aT>1.2+e.stN*0.45&&e.stN<(rage?7:4)){ e.stN++; const pr=e.stN===1?0.8:0.4, px=TK.x+TK.vx*pr+(e.stN>1?(rnd()-0.5)*7:0), pz=TK.z+TK.vz*pr+(e.stN>1?(rnd()-0.5)*7:0); tgtMark(px,pz,2.3,0.9);
      const ct=e.coilTip[e.stN%2]; ct.getWorldPosition(_bw); const bx=_bw.x, by=_bw.y, bz=_bw.z; sO(1600,500,0.4,0.05,'sine');
      later(0.9,()=>{ if(e.dead) return; const gy=groundH(px,pz); zapBolt(bx,by,bz,px,gy+0.3,pz,[0.8,0.95,1],0.28,1.6,10); zapBolt(bx,by,bz,px+(rnd()-0.5)*0.8,gy+0.3,pz,[0.6,0.8,1],0.2,1.0,9); explode(px,gy+0.5,pz,1.5,0.9,0,-1,0,'shell',null,0,null,0);
        const dd=Math.hypot(TK.x-px,TK.z-pz); if(dd<3.4) damageTank(15*(1-dd/4.2),TK.x-px,TK.z-pz,1); groundFlash(px,pz,5,[0.5,0.85,1],0.25); for(let n=0;n<14;n++) spark(px,gy+0.4,pz,(rnd()-0.5)*12,rnd()*8,(rnd()-0.5)*12,0.6,0.9,1,0.4); shake=Math.min(1,shake+0.2); sNz(0.5,'lowpass',600,0.8,0.3); sO(2200,200,0.3,0.1,'sawtooth'); sO(70,35,0.5,0.14,'sine'); }); }
    if(e.aT>1.2+(rage?7:4)*0.45+0.9){ e.atk=null; e.aCD=rage?3.2:6.5; } } }
function ebArms(e,dt){ e.tiltX=(e.tiltX||0)+(((e.atk==='swing'?e.swTT:0)||0)-(e.tiltX||0))*Math.min(1,dt*9); const f=Math.sin(e.h), g=Math.cos(e.h), n=Math.min(3,Math.max(1,Math.ceil(dt/0.0167))), ddt=dt/n; if(!e.g.visible) return;
  for(let ai=0;ai<2;ai++){ const a=e.arms[ai]; ebShoulder(e,a.s,_sh0); let tg=null, k=8, orb=0.35;
    const lx=(x,z)=>({x:e.x+x*g+z*f, z:e.z-x*f+z*g});
    if(e.atk==='blast'){ const q=lx(a.s*1.0*EB_K,5.0*EB_K), up=e.aT<1.0?0.15+e.aT*0.5:0.65; _tg.x=q.x; _tg.z=q.z; _tg.y=_sh0.y-1.0+up; tg=_tg; k=9; orb=0.35+Math.min(1,e.aT/1.0)*1.2; e.g.updateMatrixWorld(true);
      if(e.aT<1.0){ const P=a.pts[3], kk=e.aT, rr=2.4*(1-kk)+0.2; for(let m=0;m<2;m++){ const aa=rnd()*TAU; spark(P.x+Math.cos(aa)*rr,P.y+Math.sin(aa)*rr,P.z+(rnd()-0.5)*rr,-Math.cos(aa)*rr*3,-Math.sin(aa)*rr*3,0,0.4,0.9,1,0.3); } } }
    else if(e.atk==='swing'){ const CY=1.15, ts=e.aT%CY, gy=groundH(e.x,e.z); e.swTT=0;
      if(a.s===(e.swA?1:-1)){ const R=4.3*EB_K; let ang,yy;
        if(ts<0.5){ const u=ts/0.5, ee=u*u*(3-2*u); ang=a.s*(1.5+0.65*ee); yy=gy+2.1+1.5*ee; k=8; e.swTT=-0.16*ee; }               /* wind-up: arm drawn back and up, torso leans away */
        else if(ts<0.72){ const u=(ts-0.5)/0.22, ee=u*u*u; ang=a.s*2.15+(-a.s*1.3-a.s*2.15)*ee; yy=gy+3.6+(1.5-3.6)*ee; k=36; e.swTT=-0.16+0.4*ee; }  /* strike: whip-fast, accelerating, torso lunges */
        else { const u=(ts-0.72)/0.43, o=1-(1-u)*(1-u); ang=-a.s*(1.3+0.4*o); yy=gy+1.5+0.9*o; k=6; e.swTT=0.24*(1-u); }                  /* follow-through: arm carries on past the target and slows */
        const q=lx(Math.sin(ang)*R,Math.cos(ang)*R); _tg.x=q.x; _tg.z=q.z; _tg.y=yy; tg=_tg; orb=0.5;
        if(ts>=0.5&&ts<0.8){ const P=a.pts[3]; spark(P.x,P.y,P.z,(rnd()-0.5)*3,rnd()*2,(rnd()-0.5)*3,0.5,0.9,1,0.3); if(!a.hit&&ts>0.56){ smashAround(P.x,P.z,1.6*EB_K,2.6,2.2); const dd=Math.hypot(TK.x-P.x,TK.z-P.z);
            if(dd<2.6*EB_K&&P.y<TK.y+3.4*EB_K){ a.hit=true; const dmg=e.ph===3?26:20, nx=(TK.x-e.x)/(Math.hypot(TK.x-e.x,TK.z-e.z)||1), nz=(TK.z-e.z)/(Math.hypot(TK.x-e.x,TK.z-e.z)||1); damageTank(dmg,nx,nz,0); TK.vx+=nx*11; TK.vz+=nz*11; sfxThud(1.4); shake=Math.min(1,shake+0.5); camPunch=Math.max(camPunch,0.6);
              for(let m=0;m<16;m++) spark(P.x,P.y,P.z,(rnd()-0.5)*12,rnd()*7,(rnd()-0.5)*12,1,0.8,0.4,0.4); sNz(0.25,'lowpass',500,0.8,0.3); } } } }
      else { /* off-hand counterweight: tucked back and low */ const q=lx(a.s*2.2*EB_K,-0.6*EB_K); _tg.x=q.x; _tg.z=q.z; _tg.y=gy+2.6; tg=_tg; k=4; orb=0.4; } }
    else if(e.atk==='storm'){ const q=lx(a.s*2.0*EB_K,0.8*EB_K); _tg.x=q.x; _tg.z=q.z; _tg.y=_sh0.y+3.2*EB_K; tg=_tg; k=7; orb=0.35+(e.aT>1.2?1.3:e.aT*1.0); }
    else if(e.mode==='rage'||e.ph===3){ const q=lx(a.s*2.4*EB_K,1.6*EB_K); _tg.x=q.x; _tg.z=q.z; _tg.y=_sh0.y-2.0*EB_K+Math.sin(e.t*3+a.s)*0.4; tg=_tg; k=3; orb=0.7; }
    for(let m=0;m<n;m++) armStep(a,_sh0,tg,k,ddt,16);
    armRender(a); a.obm.scale.setScalar(orb*(0.9+0.1*Math.sin(e.t*20))); a.orb.color.setRGB(1,0.35+0.4*Math.min(1,orb*0.6),0.2+0.6*Math.max(0,orb-1)); } }
function dieCrypt(e,dx,dz,src){ for(const q of ENEMIES) if(q.xf&&!q.dead) q.fromBoss=true; bossDeath(e,{k:3.6,y:e.y+3.6,scrap:700,n:10,lg:true,maxN:80}); }

