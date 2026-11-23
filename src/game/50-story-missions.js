/* ================= v31.0: story missions — «Последний состав» (train), «Брод у мельницы» (ford), «Опоры башни» (tower) =================
   One «protect» system for all of them:
   • waves (WAVE) come from one side of the map; the district's usual robots stay away while the mission runs (protLoc);
   • a wave robot with e.goal goes for the protected thing, not the tank: its update runs with TK swapped for a decoy
     point next to the target (decoyOn/decoyOff), and whatever «tank damage» it deals lands on that target (damageTank → protHit).
     Within 7 m of the real tank it fights the tank as usual;
   • shells of both sides hit the train / the tower legs / repair drones through protTest (spheres), blasts through protBlast;
   • a failed attempt shows «Задание провалено» and restarts on the spot. */
Object.assign(ENAME,{train:'Эвакопоезд',ford:'Беженцы',tower:'Башня «Жемчужина»'});
Object.assign(EDESC,{train:'паровоз и три вагона с людьми · броня 600',ford:'12 человек бегут через брод в лагерь',tower:'4 опоры · купола «Зонтов» · дроны-ремонтники'});
const PROT={on:false};
const DECOY={on:false,obj:null,e:null,mul:1.5,s:[0,0,0,0,0,0,false]};
function protLoc(){ if(!MS.active) return false; const m=missionAt(MS.i); return (m.k==='train'||m.k==='ford')&&m.loc===LOC_ID; }
function storyKind(){ if(!MS.active||LOC.safe) return null; const m=missionAt(MS.i); return ['train','ford','tower'].includes(m.k)&&m.loc===LOC_ID?m.k:null; }

/* ---- the decoy: a wave robot sees its target where the tank would be ---- */
function decoyOn(e){ if(DECOY.on) return; const g=e.goal==='train'?trainGoal(e):e.goal==='ford'?fordGoal(e):null; if(!g) return;
  if(Math.hypot(TK.x-e.x,TK.z-e.z)<7&&!TK.dead) return;
  const S=DECOY.s; S[0]=TK.x; S[1]=TK.y; S[2]=TK.z; S[3]=TK.vx; S[4]=TK.vz; S[5]=TK.h; S[6]=TK.dead;
  TK.x=g.x; TK.z=g.z; TK.y=groundH(g.x,g.z); TK.vx=g.vx||0; TK.vz=g.vz||0; TK.dead=false; DECOY.obj=g.obj; DECOY.e=e; DECOY.on=true; }
function decoyOff(){ if(!DECOY.on) return; const S=DECOY.s, e=DECOY.e;
  /* a jumper that «landed on the tank» landed on the target: one bite, then it goes back to the chase */
  if(e&&e.state==='onTank'){ e.state='chase'; e.t=0; e.onTank=false; protHit(DECOY.obj,10*DECOY.mul,true); } TK.x=S[0]; TK.y=S[1]; TK.z=S[2]; TK.vx=S[3]; TK.vz=S[4]; TK.h=S[5]; TK.dead=S[6]; DECOY.on=false; DECOY.obj=null; }
/* damage that a robot meant for «the tank» */
function protHit(o,dmg,byEnemy){ if(!o) return; if(o.kind==='car') trainHurt(dmg,byEnemy); else if(o.kind==='civ'){ const c=o.c; if(c&&c.st!=='dead'&&c.st!=='saved') civDie(c,(rnd()-0.5),(rnd()-0.5),dmg>25?4:1); }
  else if(o.kind==='leg') legHurt(o,dmg); else if(o.kind==='rdr') rdrDie(o); }
/* a shell or bullet hit a protected thing */
function protShot(o,p,w,hx,hy,hz,ux,uy,uz){ let dmg;
  if(p.enemy) dmg=(w.dmg||10)*DECOY.mul; else dmg=w.id==='mg'?MG_DMG[UP.mg]:(w.id==='cn'?45*w.power*chs().cn:30);
  if(o.kind==='leg'&&w.id==='mg') dmg*=0.1;
  if(o.kind==='car'&&!p.enemy&&!TRAIN.ff){ TRAIN.ff=true; radioSay('Ты по своим бьёшь! Там люди, водитель!','zhao'); }
  protHit(o,dmg,p.enemy); hitSpark(hx,hy,hz,ux,uz,w.kind==='shell'?6:2); if(w.kind!=='shell') sfxClang();
  if(w.kind==='shell'){ PROT.skip=o; explode(hx,hy,hz,w.radius*(o.kind==='car'?0.5:0.8),w.power*0.6,ux,uy,uz,'shell',null,0,null,1); PROT.skip=null; } }
function protTest(ox,oy,oz,ux,uy,uz,len,enemy){ let best=null, bt=Infinity;
  if(TRAIN.g&&TRAIN.phase<4) for(const c of TRAIN.cars){ for(let k=-1;k<=1;k++){ const t=segSphere(ox,oy,oz,ux,uy,uz,len,TRAIN.x+c.cx+k*c.len*0.32,1.9,TRAIN.z,1.45); if(t>=0&&t<bt){ bt=t; best=c; } } }
  if(!enemy&&TOWER.on){ for(const L of TOWER.legs){ if(L.hp<=0) continue; for(const y of [1.4,3.4,5.6]){ const t=segSphere(ox,oy,oz,ux,uy,uz,len,L.x,y,L.z,0.8); if(t>=0&&t<bt){ bt=t; best=L; } } }
    for(const d of TOWER.drones){ if(d.dead) continue; const t=segSphere(ox,oy,oz,ux,uy,uz,len,d.p.x,d.p.y,d.p.z,0.6); if(t>=0&&t<bt){ bt=t; best=d; } } }
  return best?[best,bt]:null; }
function protBlast(px,py,pz,radius,power){ if(DECOY.on) return;
  if(TRAIN.g&&TRAIN.phase<4) for(const c of TRAIN.cars){ if(c===PROT.skip) continue; const dx=Math.max(0,Math.abs(px-(TRAIN.x+c.cx))-c.len/2), dz=Math.max(0,Math.abs(pz-TRAIN.z)-1.3), d=Math.hypot(dx,dz,Math.max(0,py-3.8)); if(d<radius+0.6){ trainHurt(30*power*(1-d/(radius+0.6)),false); break; } }
  if(TOWER.on){ for(const L of TOWER.legs){ if(L===PROT.skip||L.hp<=0) continue; const d=Math.hypot(px-L.x,pz-L.z); if(d<radius+0.7&&py<7) legHurt(L,22*power*(1-d/(radius+0.7))); }
    for(const d of TOWER.drones){ if(!d.dead&&Math.hypot(px-d.p.x,py-d.p.y,pz-d.p.z)<radius+0.6) rdrDie(d); } } }

/* ---- waves ---- */
const WAVE={list:[],t:0,i:0,from:null,goal:null};
function waveSet(list,from,goal){ WAVE.list=list; WAVE.t=0; WAVE.i=0; WAVE.from=from; WAVE.goal=goal; }
function waveTick(dt){ if(!WAVE.list.length||WAVE.i>=WAVE.list.length) return; WAVE.t+=dt; const w=WAVE.list[WAVE.i]; if(WAVE.t<w[0]) return;
  if(ENEMIES.filter(e=>!e.dead&&e.wave).length>10) return; WAVE.i++; const taken=[];
  for(const t of w[1]){ let p=null; for(let k=0;k<8&&!p;k++){ const q=WAVE.from(); const r=pickNear(q[0],q[1],ER[t]||1.2); if(r&&Math.hypot(r[0]-TK.x,r[1]-TK.z)>14&&!taken.some(s=>Math.hypot(s[0]-r[0],s[1]-r[1])<2.2)) p=r; } if(!p) continue; taken.push(p);
    const e=spawnEnemy(t,p[0],p[1],t==='bull'?{mod:['ac','mg'][taken.length%2]}:null); e.wave=true; e.goal=WAVE.goal; e.aggro=true; e.alertT=30; e.noScrap=false; dustAt(p[0],p[1],1); } }
function waveClear(){ for(const e of ENEMIES) if(!e.dead&&e.wave&&e.goal){ e.dead=true; eRemove(e); } WAVE.list=[]; }

/* ---- big call in the middle of the screen; the red «failed» stamp ---- */
function bigCall(txt,cls){ let el=$('#bigCall'); if(!el){ el=document.createElement('div'); el.id='bigCall'; document.body.appendChild(el); } el.textContent=txt; el.className=cls||''; el.hidden=false; void el.offsetWidth; el.classList.add('on'); clearTimeout(bigCall.to); bigCall.to=setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>{ el.hidden=true; el.classList.remove('on','out'); },320); },1700); }
const FAIL={t:0,cb:null};
function storyFail(title,why,cb){ if(FAIL.t>0) return; const w=$('#win'); $('#winK').textContent='任务失败'; $('#winH').textContent='Задание провалено'; $('#winT').textContent=why; $('#winR').parentElement.hidden=true; $('#winRank').hidden=true; $('#winNext').textContent='Попробуем ещё раз — с самого начала';
  w.classList.add('fail'); w.hidden=false; w.classList.remove('on','out'); void w.offsetWidth; w.classList.add('on'); winT=2.5; winEnd=performance.now()+2500; clearTimeout(winTO); winTO=setTimeout(()=>{ winOut(); setTimeout(()=>{ w.classList.remove('fail'); $('#winR').parentElement.hidden=false; },300); },2500);
  sfxLose(); FAIL.t=2.6; FAIL.cb=cb; void title; }
function failTick(dt){ if(FAIL.t>0){ FAIL.t-=dt; if(FAIL.t<=0&&FAIL.cb){ const cb=FAIL.cb; FAIL.cb=null; cb(); } } }

/* ===================================== 1. THE TRAIN (Вокзал) ===================================== */
const TRAIN={g:null,phase:0,x:6,z:26,v:0,hp:600,max:600,t:0,cars:[],ring:null,chuff:0,dist:0,ff:false,boomT:0,whistled:false,portal:null};
const TR_END=-48, TR_X0=6;
const trM=(c,e)=>{ const m=new THREE.MeshToonMaterial({color:c,gradientMap:gradTex}); if(e){ m.emissive=new THREE.Color(e); } return m; };
function trainBuild(m){ trainDispose(); const G=new THREE.Group(), clip=[new THREE.Plane(new THREE.Vector3(1,0,0),-0.35)]; renderer.localClippingEnabled=true;
  const M={blk:trM(0x1e2226),red:trM(0xb3261e),dk:trM(0x34383d),grn:trM(0x2f6b4a),yel:trM(0xe8c040),roof:trM(0x5a6068),win:trM(0x332a14,0xffd27a),star:trM(0xd8302a,0x601010),lamp:trM(0xfff2c0,0xfff2c0)};
  for(const k in M) M[k].clippingPlanes=clip;
  const B=(w,h,d,mat,x,y,z,par)=>{ const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); o.position.set(x,y,z); (par||G).add(o); return o; };
  const Cx=(r,len,mat,x,y,z,par,n)=>{ const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,n||14).rotateZ(Math.PI/2),mat); o.position.set(x,y,z); (par||G).add(o); return o; };
  const Wh=(r,mat,x,z,par)=>{ const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,0.16,14).rotateX(Math.PI/2),mat); o.position.set(x,r,z); (par||G).add(o); return o; };
  TRAIN.cars=[]; TRAIN.wheels=[]; TRAIN.rods=[];
  /* locomotive: QJ-style black steam engine with red wheels, front at local x=0, facing −x */
  const L=new THREE.Group(); G.add(L);
  B(11,0.35,2.3,M.dk,5.6,1.0,0,L); B(0.3,0.55,2.6,M.red,0.15,1.05,0,L); const cw=B(0.9,0.5,2.2,M.red,-0.25,0.55,0,L); cw.rotation.z=0.55;
  Cx(1.05,6.4,M.blk,3.9,2.35,0,L); Cx(1.12,0.6,M.dk,0.75,2.35,0,L); const st=new THREE.Mesh(new THREE.CircleGeometry(0.32,5),M.star); st.rotation.y=-Math.PI/2; st.position.set(0.44,2.35,0); L.add(st);
  const ch=new THREE.Mesh(new THREE.CylinderGeometry(0.34,0.42,1.3,12),M.blk); ch.position.set(1.5,3.9,0); L.add(ch); B(0.9,0.12,0.9,M.dk,1.5,4.55,0,L);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(0.55,12,8,0,TAU,0,Math.PI/2),M.blk); dome.position.set(3.9,3.35,0); L.add(dome); const dome2=dome.clone(); dome2.position.x=5.6; L.add(dome2);
  B(0.35,0.35,0.35,M.lamp,0.45,3.2,0,L); B(6.9,0.12,2.6,M.red,3.9,1.3,0,L);
  B(3.2,2.6,2.5,M.blk,8.8,2.65,0,L); B(3.6,0.2,2.8,M.dk,8.8,4.05,0,L); for(const s of [-1,1]) for(const x of [8.1,9.4]) B(0.8,0.7,0.04,M.win,x,3.2,s*1.27,L);
  for(const s of [-1,1]){ for(const x of [2.8,4.6,6.4]){ const w=Wh(0.75,M.red,x,s*1.05,L); TRAIN.wheels.push({o:w,r:0.75}); } TRAIN.wheels.push({o:Wh(0.45,M.red,1.1,s*1.05,L),r:0.45}); TRAIN.wheels.push({o:Wh(0.5,M.red,9.6,s*1.05,L),r:0.5});
    TRAIN.rods.push({o:B(3.7,0.12,0.08,M.dk,4.6,0.75,s*1.22,L),s}); }
  TRAIN.cars.push({prot:true,kind:'car',cx:5.6,len:11.2,g:L});
  /* three green passenger cars with lit windows and people in them */
  for(let k=0;k<3;k++){ const C=new THREE.Group(), ox=11.8+k*11.2+5.2; C.position.x=ox; G.add(C);
    B(10.4,2.5,2.6,M.grn,0,2.35,0,C); B(10.4,0.4,2.4,M.dk,0,0.95,0,C); B(10.5,0.15,2.64,M.yel,0,1.75,0,C); B(10.6,0.28,2.8,M.roof,0,3.72,0,C); B(10.2,0.3,2.0,M.roof,0,3.98,0,C);
    for(const s of [-1,1]){ for(let i=0;i<6;i++){ const x=-3.9+i*1.56; B(0.95,0.72,0.04,M.win,x,2.8,s*1.31,C); if((i+k+(s>0?1:0))%2===0){ const h=new THREE.Mesh(new THREE.SphereGeometry(0.17,8,6),M.blk); h.position.set(x+0.1,2.72,s*1.22); C.add(h); } } B(0.8,1.7,0.04,M.dk,s*4.7,2.2,1.31,C); }
    for(const bx of [-3.4,3.4]){ B(2.4,0.4,2.0,M.dk,bx,0.75,0,C); for(const s of [-1,1]) for(const wx of [-0.7,0.7]){ const w=Wh(0.42,M.dk,bx+wx,s*0.98,C); TRAIN.wheels.push({o:w,r:0.42}); } }
    B(0.9,0.25,0.25,M.dk,-5.6,1.0,0,C);
    TRAIN.cars.push({prot:true,kind:'car',cx:ox,len:10.4,g:C}); }
  G.position.set(TR_X0,0,TRAIN.z); scene.add(G); EXTRAS.push(G); TRAIN.g=G;
  /* tunnel portal at the west edge: the train leaves into it */
  const P=new THREE.Group(), Pm=trM(0x6b5a4a), Pd=new THREE.MeshBasicMaterial({color:0x050608}); for(const s of [-1,1]) B(1.6,6,1.2,Pm,0.4,3,s*2.5,P); B(1.6,1.4,6.2,Pm,0.4,6.4,0,P); B(0.2,5.6,3.8,Pd,0.25,2.8,0,P);
  P.position.set(0,0,TRAIN.z); scene.add(P); EXTRAS.push(P); TRAIN.portal=P;
  /* the zone: a ring on the ground until the tank rolls in */
  const ring=new THREE.Mesh(new THREE.RingGeometry(m.rad-0.35,m.rad,64).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:MCOL,transparent:true,opacity:0.8,depthWrite:false}));
  ring.position.set(m.x,groundH(m.x,m.z)+0.08,m.z); ring.renderOrder=4; scene.add(ring); EXTRAS.push(ring); TRAIN.ring=ring;
  Object.assign(TRAIN,{phase:0,x:TR_X0,v:0,hp:TRAIN.max,t:0,chuff:0,dist:0,ff:false,boomT:0,whistled:false,ringT:0}); PROT.on=true; waveSet([],null,null); }
function trainDispose(){ if(TRAIN.g){ scene.remove(TRAIN.g); scene.remove(TRAIN.portal); scene.remove(TRAIN.ring); } TRAIN.g=null; TRAIN.cars=[]; }
function trainGoal(e){ if(!TRAIN.g||TRAIN.phase>=4) return null; let best=null, bd=1e9; for(const c of TRAIN.cars){ const x=Math.max(TRAIN.x+c.cx-c.len/2+0.8,Math.min(TRAIN.x+c.cx+c.len/2-0.8,e.x)), d=Math.abs(x-e.x); if(d<bd){ bd=d; best={x,z:TRAIN.z+2.2,vx:-TRAIN.v,vz:0,obj:c}; } } return best; }
function trainHurt(d,byEnemy){ if(TRAIN.phase>=4||TRAIN.phase===0||d<=0) return; TRAIN.hp=Math.max(0,TRAIN.hp-d); TRAIN.hurtT=0.25; if(byEnemy&&!TRAIN.warn&&TRAIN.hp<TRAIN.max*0.5){ TRAIN.warn=true; radioSay('Вагоны горят! Отгони их от состава!','zhao'); }
  if(TRAIN.hp<=0) trainBoom(); }
function trainBoom(){ TRAIN.phase=4; TRAIN.boomT=0; TRAIN.v=0; for(let k=0;k<TRAIN.cars.length;k++){ const c=TRAIN.cars[TRAIN.cars.length-1-k]; later(0.15+k*0.35,()=>{ if(!TRAIN.g) return; const x=TRAIN.x+c.cx; explode(x,2,TRAIN.z,2.2,1.4,0,-1,0,'shell',null,0,null,0.4); for(let n=0;n<10;n++) FIRE.spawn(x+(rnd()-0.5)*c.len,2+rnd()*2,TRAIN.z+(rnd()-0.5)*2,(rnd()-0.5)*2,2+rnd()*3,(rnd()-0.5)*2,1.6,2,1.2,0.9,1,0.6,0.2); c.g.rotation.x=(rnd()-0.5)*0.25; c.g.position.y=-0.15; }); }
  later(1.7,()=>storyFail('','Поезд уничтожен',trainRestart)); }
function trainRestart(){ waveClear(); const m=missionAt(MS.i); if(m.k!=='train'||LOC_ID!==m.loc){ trainDispose(); return; } trainBuild(m); objUI(); }
function trainCollide(){ if(TK.dead) return; for(const c of TRAIN.cars){ const cx=TRAIN.x+c.cx, hx=c.len/2, hz=1.35, qx=Math.max(cx-hx,Math.min(cx+hx,TK.x)), qz=Math.max(TRAIN.z-hz,Math.min(TRAIN.z+hz,TK.z)), dx=TK.x-qx, dz=TK.z-qz, d=Math.hypot(dx,dz), R=TR*0.95;
    if(d>=R) continue; let nx, nz, pen; if(d<1e-3){ nx=0; nz=TK.z>TRAIN.z?1:-1; pen=R+hz-Math.abs(TK.z-TRAIN.z); } else { nx=dx/d; nz=dz/d; pen=R-d; }
    const tx=TK.x+nx*pen, tz=TK.z+nz*pen; if(!tankContacts(tx,tz,CT)){ TK.x=tx; TK.z=tz; } const vn=TK.vx*nx+TK.vz*nz; if(vn<0){ TK.vx-=nx*vn; TK.vz-=nz*vn; } if(nx<-0.5&&TRAIN.v>0) TK.vx=Math.min(TK.vx,-TRAIN.v); } }
function trainTick(dt,t,m){ if(!TRAIN.g||!TRAIN.g.parent){ trainBuild(m); objUI(); }
  const G=TRAIN.g; TRAIN.t+=dt;
  if(TRAIN.phase===0){ TRAIN.ring.material.opacity=0.55+Math.sin(t*4)*0.25; const r=1+Math.sin(t*3)*0.03; TRAIN.ring.scale.set(r,1,r);
    if(rnd()<dt*1.2) SMOKE.spawn(TRAIN.x+1.5,4.6,TRAIN.z,(rnd()-0.5)*0.4,0.8,(rnd()-0.5)*0.4,0.5,1.6,2.2,0.35,0.5,0.5,0.52);
    if(!TK.dead&&Math.hypot(TK.x-m.x,TK.z-m.z)<m.rad){ TRAIN.phase=1; TRAIN.t=0; TRAIN.ringT=0.5; bigCall('ЗАЩИЩАЙ ПОЕЗД'); sfxAccept();
      for(let k=0;k<30;k++){ const a=k/30*TAU; spark(m.x+Math.cos(a)*m.rad,0.4,m.z+Math.sin(a)*m.rad,Math.cos(a)*-3,2+rnd()*3,Math.sin(a)*-3,1,0.85,0.3,0.6); }
      waveSet([[2,['jian','jian','jian']],[10,['jian','jian','bomb']],[18,['jian','bomb','jian','jian']],[26,['bomb','bomb','jian','jian']],[34,['jian','jian','jian','bomb','bomb']],[42,['jian','bomb','jian','bomb']]],()=>[6+rnd()*68,68+rnd()*9],'train');
      later(0.8,()=>radioSay('Он трогается. Не подпускай их к вагонам!','zhao')); objUI(); } }
  if(TRAIN.ringT>0){ TRAIN.ringT-=dt; const k=Math.max(0,TRAIN.ringT/0.5); TRAIN.ring.scale.set(k,1,k); TRAIN.ring.material.opacity=k; if(TRAIN.ringT<=0) TRAIN.ring.visible=false; }
  if(TRAIN.phase===1){ /* the engine wakes: puffs speed up, then the whistle, then off it goes */
    TRAIN.chuff-=dt; const rate=0.9-Math.min(0.6,TRAIN.t*0.1); if(TRAIN.chuff<=0){ TRAIN.chuff=rate; sNz(0.14,'bandpass',420,1.2,0.12); for(let n=0;n<3;n++) SMOKE.spawn(TRAIN.x+1.5,4.7,TRAIN.z,(rnd()-0.5)*0.6,2.5+rnd(),(rnd()-0.5)*0.6,0.7,1.8,2.4,0.7,0.12,0.12,0.13); }
    if(TRAIN.t>4.2&&!TRAIN.whistled){ TRAIN.whistled=true; sO(523,520,1.3,0.07,'triangle'); sO(659,655,1.3,0.05,'triangle'); later(1.5,()=>{ sO(523,523,0.35,0.07,'triangle'); sO(659,659,0.35,0.05,'triangle'); });
      for(let n=0;n<14;n++) SMOKE.spawn(TRAIN.x+3.9,3.9,TRAIN.z,(rnd()-0.5)*1.5,3+rnd()*2,(rnd()-0.5)*1.5,0.6,2.2,1.6,0.8,0.95,0.95,0.97); }
    if(TRAIN.t>6.2){ TRAIN.phase=2; TRAIN.t=0; } }
  if(TRAIN.phase===2){ TRAIN.v=Math.min(1.35,TRAIN.t*0.135); TRAIN.x-=TRAIN.v*dt;
    TRAIN.chuff-=dt; if(TRAIN.chuff<=0){ TRAIN.chuff=Math.max(0.22,0.9-TRAIN.v*0.5); sNz(0.12,'bandpass',380,1.2,0.1); SMOKE.spawn(TRAIN.x+1.5,4.7,TRAIN.z,TRAIN.v*0.4,2.6,(rnd()-0.5)*0.5,0.7,1.8,2.6,0.7,0.12,0.12,0.13); }
    if(TRAIN.x<=TR_END){ TRAIN.phase=3; sO(523,523,0.8,0.04,'triangle'); sO(659,659,0.8,0.03,'triangle'); waveTickEnd(); completeMission(); return; } }
  if(TRAIN.phase===4) TRAIN.boomT+=dt;
  /* wheels and rods follow the distance travelled */
  if(TRAIN.v>0){ TRAIN.dist+=TRAIN.v*dt; for(const w of TRAIN.wheels) w.o.rotation.z=TRAIN.dist/w.r; const a=TRAIN.dist/0.75; for(const r of TRAIN.rods){ r.o.position.x=4.6+Math.cos(a)*0.35; r.o.position.y=0.75+Math.sin(a)*0.35; } }
  if(TRAIN.phase>=1&&TRAIN.phase<4){ /* damage shows: smoke over the train, fire from the windows below a quarter */
    const k=1-TRAIN.hp/TRAIN.max; if(k>0.5&&rnd()<dt*k*8){ const c=TRAIN.cars[(rnd()*TRAIN.cars.length)|0]; SMOKE.spawn(TRAIN.x+c.cx+(rnd()-0.5)*c.len,3.6,TRAIN.z,0,1.5,0,0.6,1.6,2,0.6,0.15,0.14,0.14); if(k>0.75) FIRE.spawn(TRAIN.x+c.cx+(rnd()-0.5)*c.len,2.8,TRAIN.z+(rnd()<0.5?1.3:-1.3),0,1,0,0.7,1,0.6,0.9,1,0.6,0.2); } }
  G.position.x=TRAIN.x; trainCollide(); if(TRAIN.phase===1||TRAIN.phase===2) waveTick(dt);
  if((TRAIN.hudT=(TRAIN.hudT||0)-dt)<=0){ TRAIN.hudT=0.25; objUI(); } }
function waveTickEnd(){ WAVE.list=[]; for(const e of ENEMIES) if(!e.dead&&e.goal) e.goal=null; }

/* ===================================== 2. THE FORD (Деревня) ===================================== */
const FORD={on:false,list:[],t:0,q:[],n:12,dead:0,saved:0,src:null,gate:null,started:false,hudT:0};
function fordReset(){ for(const c of FORD.list) if(c.g.parent) scene.remove(c.g); FORD.list.length=0; Object.assign(FORD,{on:false,t:0,q:[],dead:0,saved:0,started:false}); }
function fordStart(m){ fordReset(); FORD.on=true; PROT.on=true; FORD.n=m.n||12; FORD.gate=evacGate()||[40,2.5];
  let src=null; for(let r=0;r<6&&!src;r+=0.5) for(let a=-Math.PI;a<Math.PI&&!src;a+=0.4){ const x=28.5+Math.sin(a)*r, z=60.6-Math.abs(Math.cos(a))*r*0.5; if(civFree(x,z)&&navOk(Math.floor(x),Math.floor(z),0.4)) src=[x,z]; } FORD.src=src||[27,60.5];
  for(let k=0;k<FORD.n;k++) FORD.q.push({t:3+Math.floor(k/3)*6+(k%3)*0.45,k}); }
function fordGoal(e){ let best=null, bd=1e9; for(const c of FORD.list){ if(c.st==='dead'||c.st==='saved') continue; const d=Math.hypot(c.x-e.x,c.z-e.z); if(d<bd){ bd=d; best=c; } } return best?{x:best.x,z:best.z,vx:0,vz:0,obj:best.po}:null; }
function fordTick(dt,t,m){ if(!FORD.on){ fordStart(m); objUI(); later(1,()=>radioSay('Они выходят из дома у реки! Встань между ними и роботами — роботы идут с востока.','zhao')); }
  if(!FORD.started){ if(Math.hypot(TK.x-FORD.src[0],TK.z-FORD.src[1])<34||(FORD.wait=(FORD.wait||0)+dt)>10){ FORD.started=true; FORD.t=0; waveSet([[1,['jian','jian','bomb']],[8,['jian','jian','jian']],[15,['bull','jian','bomb']],[22,['jian','bomb','jian','jian']],[29,['bull','jian','jian']],[36,['jian','bomb','bomb','jian']],[44,['jian','jian','bull']]],()=>[72+rnd()*6,22+rnd()*48],'ford'); } else return; }
  FORD.t+=dt; waveTick(dt);
  for(let i=FORD.q.length-1;i>=0;i--){ const q=FORD.q[i]; if(FORD.t<q.t) continue; FORD.q.splice(i,1); const c=civMake(FORD.src[0]+(rnd()-0.5)*0.8,FORD.src[1]+(rnd()-0.5)*0.6,q.k+7); pplDress(c,'ford'); c.ford=true; c.po={prot:true,kind:'civ',c}; c.spd=2.3+rnd()*0.6; c.pathT=0; FORD.list.push(c); }
  const g=FORD.gate;
  for(const c of FORD.list){ if(c.st==='dead'||c.st==='saved') continue; c.hitT=Math.max(0,(c.hitT||0)-dt); c.sayT=Math.max(0,(c.sayT||0)-dt);
    if(c.st==='rag'){ ragUpdate(c,dt); continue; }
    if(Math.hypot(c.x-TK.x,c.z-TK.z)<4.5&&pplTank(c,true)) continue;
    c.pathT-=dt; if(!c.path||c.pathT<=0){ c.pathT=1.2+rnd()*0.4; c.path=navPath(c.x,c.z,g[0],g[1],0.4); c.pi=1; }
    let tx=g[0], tz=g[1]; if(c.path&&c.pi<c.path.length){ let w=c.path[c.pi]; while(c.pi<c.path.length-1&&Math.hypot(w[0]-c.x,w[1]-c.z)<1){ c.pi++; w=c.path[c.pi]; } tx=w[0]; tz=w[1]; }
    const ax=tx-c.x, az=tz-c.z, l=Math.hypot(ax,az)||1, fear=ENEMIES.some(e=>!e.dead&&Math.hypot(e.x-c.x,e.z-c.z)<9)?1.35:1; let mx=ax/l*c.spd*fear, mz=az/l*c.spd*fear;
    for(const o of FORD.list){ if(o===c||o.st!=='run') continue; const ox=c.x-o.x, oz=c.z-o.z, od=Math.hypot(ox,oz); if(od<0.7&&od>1e-3){ mx+=ox/od*2; mz+=oz/od*2; } }
    const nx=c.x+mx*dt, nz=c.z+mz*dt; if(civFree(nx,nz)){ c.x=nx; c.z=nz; } else if(civFree(nx,c.z)) c.x=nx; else if(civFree(c.x,nz)) c.z=nz; else c.pathT=0;
    c.h=turnTo(c.h,Math.atan2(mx,mz),dt*12); c.ph+=dt*Math.hypot(mx,mz)*2.6;
    c.bob=gaitPose({hipL:c.lL,hipR:c.lR,kneeL:c.kL,kneeR:c.kR,armL:c.aL,armR:c.aR,elbL:c.eL,elbR:c.eR,torso:c.torso},c.ph,1.3); c.torso.rotation.x=fear>1?0.45:0.22;
    if(Math.hypot(c.x-g[0],c.z-g[1])<3){ c.st='saved'; FORD.saved++; drvStat('civ'); scene.remove(c.g); popText(c.x,1.8,c.z,'в лагере','heal'); sO(660,990,0.12,0.06,'triangle'); objUI(); continue; }
    c.g.position.set(c.x,groundH(c.x,c.z)+(c.bob||0)*1.4,c.z); c.g.rotation.y=c.h; shadowAdd(c.x,c.z,0.8,0,0.4); }
  if(FORD.dead>6&&!FAIL.t){ FORD.on=false; waveClear(); storyFail('','Погибло слишком много людей',()=>{ fordReset(); objUI(); }); return; }
  if(!FORD.q.length&&FORD.saved+FORD.dead>=FORD.n&&FORD.started){ const sv=FORD.saved; MS.camp=MS.camp||{}; MS.camp.ford=Math.max(MS.camp.ford|0,sv); if(FORD.dead===0){ ST.scrap+=150; toast('Все двенадцать дошли · +150 лома'); }
    FORD.on=false; waveTickEnd(); later(2,()=>{ fordReset(); }); completeMission(); return; }
  if((FORD.hudT-=dt)<=0){ FORD.hudT=0.3; objUI(); } }

/* ===================================== 3. THE TOWER LEGS (Деловой центр) ===================================== */
const TOWER={on:false,legs:[],drones:[],phase:0,t:0,cx:12,cz:63,spawnT:4,waveT:18,rep:null,strip:null,dir:[1,0]};
const twM={cab:new THREE.MeshBasicMaterial({color:0x3dffa8}),dead:new THREE.MeshBasicMaterial({color:0x40100c}),bar:new THREE.MeshBasicMaterial({color:0x3dffa8,depthTest:false,transparent:true}),barBg:new THREE.MeshBasicMaterial({color:0x101418,depthTest:false,transparent:true,opacity:0.75}),
  body:new THREE.MeshToonMaterial({color:0x2c3238,gradientMap:gradTex}),beam:new THREE.MeshBasicMaterial({color:0x6bffc0,transparent:true,opacity:0.6,depthWrite:false})};
const twG={ring:new THREE.TorusGeometry(0.62,0.08,6,18).rotateX(Math.PI/2),bar:new THREE.PlaneGeometry(1.6,0.16),bg:new THREE.PlaneGeometry(1.7,0.26),box:new THREE.BoxGeometry(1,1,1),beam:new THREE.CylinderGeometry(0.04,0.04,1,6).translate(0,0.5,0).rotateX(Math.PI/2)};
function towerBuild(){ towerDispose(); TOWER.on=true; PROT.on=true; Object.assign(TOWER,{phase:0,t:0,spawnT:6,waveT:16,drones:[],legs:[]});
  for(const [dx,dz] of [[-2.4,-2.4],[2.4,-2.4],[-2.4,2.4],[2.4,2.4]]){ const L={prot:true,kind:'leg',x:TOWER.cx+dx,z:TOWER.cz+dz,hp:220,max:220,rings:[],g:new THREE.Group()};
    for(const y of [1.3,3.2,5.1,6.8]){ const r=new THREE.Mesh(twG.ring,twM.cab); r.position.set(0,y,0); L.g.add(r); L.rings.push(r); }
    const bg=new THREE.Mesh(twG.bg,twM.barBg), bar=new THREE.Mesh(twG.bar,twM.bar.clone()); bg.position.y=8.3; bar.position.y=8.3; bg.renderOrder=bar.renderOrder=6; L.g.add(bg); L.g.add(bar); L.bar=bar; L.bg=bg;
    L.g.position.set(L.x,0,L.z); scene.add(L.g); EXTRAS.push(L.g); TOWER.legs.push(L); }
  /* two «Зонты» keep domes over two of the legs */
  for(const i of [0,3]){ const L=TOWER.legs[i], ox=L.x-TOWER.cx, oz=L.z-TOWER.cz, p=pickNear(L.x+ox*0.7,L.z+oz*0.7,1.1); if(!p) continue; const e=spawnEnemy('zont',p[0],p[1],null); e.home={x:p[0],z:p[1]}; e.guard=true; } }
function towerDispose(){ for(const L of TOWER.legs) scene.remove(L.g); for(const d of TOWER.drones) scene.remove(d.g); if(TOWER.rep) scene.remove(TOWER.rep); if(TOWER.strip) scene.remove(TOWER.strip); TOWER.legs=[]; TOWER.drones=[]; TOWER.rep=null; TOWER.strip=null; TOWER.on=false; }
function legHurt(L,d){ if(L.hp<=0||TOWER.phase>0||d<=0) return; L.hp=Math.max(0,L.hp-d); L.flash=0.15;
  if(L.hp<=0){ for(const r of L.rings) r.material=twM.dead; for(let k=0;k<16;k++) spark(L.x,1+rnd()*5,L.z,(rnd()-0.5)*8,rnd()*6,(rnd()-0.5)*8,0.4,1,0.7,0.6); sfxClang(); sfxThud(0.8); shake=Math.min(1,shake+0.2);
    const left=TOWER.legs.filter(q=>q.hp>0).length; toast(left?`Опора разбита · осталось ${left}`:'Все опоры разбиты!'); objUI(); if(!left) towerCreak(); } }
/* repair drones: fly from the tower top to a damaged leg, hover, heal it with a green beam */
function rdrMake(){ const g=new THREE.Group(), b=new THREE.Mesh(twG.box,twM.body); b.scale.set(0.6,0.22,0.6); g.add(b); const lamp=new THREE.Mesh(twG.box,twM.cab); lamp.scale.set(0.18,0.12,0.18); lamp.position.y=-0.16; g.add(lamp);
  const rot=[]; for(const [x,z] of [[-0.4,-0.4],[0.4,-0.4],[-0.4,0.4],[0.4,0.4]]){ const r=new THREE.Mesh(twG.box,twM.body); r.scale.set(0.5,0.02,0.06); r.position.set(x,0.14,z); g.add(r); rot.push(r); }
  const beam=new THREE.Mesh(twG.beam,twM.beam); beam.visible=false; scene.add(beam); EXTRAS.push(beam);
  const d={prot:true,kind:'rdr',g,rot,beam,p:new THREE.Vector3(TOWER.cx,21,TOWER.cz),hp:1,dead:false,tgt:null,t:0}; g.position.copy(d.p); scene.add(g); EXTRAS.push(g); TOWER.drones.push(d); return d; }
function rdrDie(d){ if(d.dead) return; d.dead=true; scene.remove(d.g); d.beam.visible=false; for(let k=0;k<10;k++) spark(d.p.x,d.p.y,d.p.z,(rnd()-0.5)*6,rnd()*4,(rnd()-0.5)*6,0.4,1,0.7,0.5); sfxClang(); popText(d.p.x,d.p.y+0.6,d.p.z,'дрон сбит','kill'); }
function rdrTick(dt,t){ for(const d of TOWER.drones){ if(d.dead) continue; d.t+=dt; for(let i=0;i<4;i++) d.rot[i].rotation.y=t*40+i;
    if(!d.tgt||d.tgt.hp<=0||d.tgt.hp>=d.tgt.max){ d.tgt=null; let bd=1e9; for(const L of TOWER.legs){ if(L.hp<=0||L.hp>=L.max) continue; const q=L.hp/L.max; if(q<bd){ bd=q; d.tgt=L; } } }
    const L=d.tgt; let tx=TOWER.cx, ty=14, tz=TOWER.cz; if(L){ const ox=L.x-TOWER.cx, oz=L.z-TOWER.cz, l=Math.hypot(ox,oz)||1; tx=L.x+ox/l*1.6; tz=L.z+oz/l*1.6; ty=4.2+Math.sin(d.t*2)*0.3; }
    const dx=tx-d.p.x, dy=ty-d.p.y, dz=tz-d.p.z, dl=Math.hypot(dx,dy,dz), sp=Math.min(dl,7*dt); if(dl>1e-3){ d.p.x+=dx/dl*sp; d.p.y+=dy/dl*sp; d.p.z+=dz/dl*sp; }
    d.g.position.copy(d.p); d.g.rotation.z=Math.max(-0.3,Math.min(0.3,-dx*0.1)); d.g.rotation.x=Math.max(-0.3,Math.min(0.3,dz*0.1));
    const heal=L&&dl<0.8; d.beam.visible=heal; if(heal){ L.hp=Math.min(L.max,L.hp+12*dt); d.beam.position.copy(d.p); d.beam.position.y-=0.2; const bx=L.x-d.p.x, by=3.4-d.p.y+0.2, bz=L.z-d.p.z; d.beam.scale.set(1,1,Math.hypot(bx,by,bz)); d.beam.lookAt(L.x,3.4,L.z); if(rnd()<dt*6) spark(L.x,3.4,L.z,(rnd()-0.5)*2,rnd()*2,(rnd()-0.5)*2,0.3,1,0.7,0.3); } }
  TOWER.drones=TOWER.drones.filter(d=>!d.dead); }
function towerCreak(){ TOWER.phase=1; TOWER.t=0; for(const d of TOWER.drones) rdrDie(d); radioSay('Она падает! Уходи с линии падения — на восток не суйся!','zhao');
  const strip=new THREE.Mesh(new THREE.PlaneGeometry(28,4.2).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xff3020,transparent:true,opacity:0.3,depthWrite:false})); strip.position.set(TOWER.cx+15,groundH(TOWER.cx+15,TOWER.cz)+0.1,TOWER.cz); strip.renderOrder=4; scene.add(strip); EXTRAS.push(strip); TOWER.strip=strip; }
/* the falling copy: the voxels of the tower vanish, a mesh with the same silhouette tips over its base */
function towerFall(){ const cx=TOWER.cx, cz=TOWER.cz;
  for(let x=c(cx-3.4);x<=c(cx+3.4);x++) for(let z=c(cz-3.4);z<=c(cz+3.4);z++) for(let y=c(0.7);y<NY;y++){ if(get(x,y,z)){ put(x,y,z,0); markDirty(x,y,z); } }
  for(const l of LAMPS) if(Math.hypot(l.x-cx,l.z-cz)<4&&l.y>5){ l.alive=false; l.dead=true; }
  const R=new THREE.Group(), pk=new THREE.MeshToonMaterial({color:0xd38aa8,gradientMap:gradTex}), ne=new THREE.MeshToonMaterial({color:0xff4fa8,gradientMap:gradTex,emissive:new THREE.Color(0x802050)}), mt=new THREE.MeshToonMaterial({color:0x9aa4ae,gradientMap:gradTex}), parts=[];
  const add=(geo,mat,x,y,z)=>{ const o=new THREE.Mesh(geo,mat); o.position.set(x,y,z); R.add(o); parts.push(o); return o; };
  for(const [dx,dz] of [[-2.4,-2.4],[2.4,-2.4],[-2.4,2.4],[2.4,2.4]]) add(new THREE.CylinderGeometry(0.45,0.5,6.9,8),pk,dx,4.05,dz);
  add(new THREE.CylinderGeometry(0.9,0.9,21.4,12),pk,0,11.3,0); add(new THREE.SphereGeometry(2.8,16,12),ne,0,8,0); add(new THREE.SphereGeometry(1.7,14,10),ne,0,17.2,0); add(new THREE.CylinderGeometry(0.45,0.45,6.2,8),mt,0,21.9,0); add(new THREE.SphereGeometry(0.8,10,8),ne,0,22.6,0); add(new THREE.CylinderGeometry(0.1,0.1,2.5,6),mt,0,26.2,0);
  R.position.set(cx,0.6,cz); scene.add(R); EXTRAS.push(R); TOWER.rep=R; TOWER.parts=parts; TOWER.th=0.02; TOWER.w=0.05; TOWER.phase=2; sfxThud(1); shake=1; }
function towerTick(dt,t,m){ if(!TOWER.on||!TOWER.legs.length||!TOWER.legs[0].g.parent){ towerBuild(); objUI(); later(1.2,()=>radioSay('Видишь светящиеся кольца на опорах? Бей туда из пушки. Ремонтников сбивай пулемётом.','liu')); }
  TOWER.t+=dt;
  for(const L of TOWER.legs){ const k=L.hp/L.max; L.bar.scale.x=Math.max(0.001,k); L.bar.position.x=-(1-k)*0.8; L.bar.material.color.setRGB(1-k*0.75,0.35+k*0.65,0.35+k*0.3); L.bar.visible=L.bg.visible=L.hp>0&&TOWER.phase===0;
    L.bar.quaternion.copy(camera.quaternion); L.bg.quaternion.copy(camera.quaternion); if(L.flash>0){ L.flash-=dt; } for(const r of L.rings){ r.rotation.y+=dt*(L.hp>0?1.5:0); r.scale.setScalar(L.hp>0?1+Math.sin(t*5+r.position.y)*0.06:1); } }
  if(TOWER.phase===0){ rdrTick(dt,t); TOWER.spawnT-=dt; if(TOWER.spawnT<=0){ TOWER.spawnT=9; if(TOWER.drones.length<3&&TOWER.legs.some(L=>L.hp>0&&L.hp<L.max)) rdrMake(); }
    TOWER.waveT-=dt; if(TOWER.waveT<=0){ TOWER.waveT=20; if(ENEMIES.filter(e=>!e.dead&&!e.xf).length<12){ const gs=GATES.filter(g=>Math.hypot((g.r[0]+g.r[2])/2-TK.x,(g.r[1]+g.r[3])/2-TK.z)>20); const g=gs[(rnd()*gs.length)|0]; if(g){ const gx=(g.r[0]+g.r[2])/2, gz=(g.r[1]+g.r[3])/2;
          for(const tp of ['jian','jian','bull']){ const p=pickNear(gx+(rnd()-0.5)*6,gz+(rnd()-0.5)*6,ER[tp]||1.2); if(!p) continue; const e=spawnEnemy(tp,p[0],p[1],tp==='bull'?{mod:'mortar'}:null); e.aggro=true; e.alertT=20; e.last={x:TK.x,z:TK.z}; } } } } }
  else if(TOWER.phase===1){ shake=Math.min(1,shake+dt*0.4); if(TOWER.strip) TOWER.strip.material.opacity=0.25+Math.abs(Math.sin(t*6))*0.3; if((TOWER.creakT=(TOWER.creakT||0)-dt)<=0){ TOWER.creakT=0.6+rnd()*0.5; sO(70+rnd()*30,45,0.7,0.08,'sawtooth'); sNz(0.5,'bandpass',300,2,0.05); }
    if(TOWER.t>4.2) towerFall(); }
  else if(TOWER.phase===2){ TOWER.w+=1.5*Math.sin(TOWER.th)*dt*1.2+dt*0.05; TOWER.th+=TOWER.w*dt; TOWER.rep.rotation.z=-Math.min(Math.PI/2,TOWER.th); if(TOWER.strip) TOWER.strip.material.opacity=0.5;
    if(TOWER.th>=Math.PI/2-0.03){ TOWER.phase=3; TOWER.t=0; towerImpact(); } }
  else if(TOWER.phase===3&&TOWER.t>2.2&&!TOWER.done){ TOWER.done=true; completeMission(); }
  if((TOWER.hudT=(TOWER.hudT||0)-dt)<=0){ TOWER.hudT=0.4; objUI(); } }
function towerImpact(){ const cx=TOWER.cx, cz=TOWER.cz; shake=1; camPunch=Math.max(camPunch,1); sfxThud(1); if(TOWER.strip){ scene.remove(TOWER.strip); TOWER.strip=null; }
  for(let k=0;k<9;k++){ const x=cx+2+k*3.1; later(k*0.06,()=>{ explode(x,1,cz,2.6,1.6,0,-1,0,'shell',null,0,null,1); for(let n=0;n<6;n++) SMOKE.spawn(x+(rnd()-0.5)*3,1,cz+(rnd()-0.5)*3,(rnd()-0.5)*3,2+rnd()*3,(rnd()-0.5)*3,2,2.4,2.5,0.7,0.6,0.56,0.52); }); }
  for(const e of ENEMIES){ if(e.dead||e.boss) continue; if(e.x>cx&&e.x<cx+29&&Math.abs(e.z-cz)<3.2) enemyHit(e,999,1,0,'area'); }
  const R=TOWER.rep; R.updateMatrixWorld(true); for(const p of TOWER.parts){ scene.attach(p); GIBS.push(gibOf(p,(rnd()-0.5)*4,2+rnd()*4,(rnd()-0.5)*4,4)); } scene.remove(R); TOWER.rep=null; }

/* ---- the frame: which mission is running here, HUD, nav arrow ---- */
function storyMissionsTick(dt,t){ failTick(dt); const k=storyKind(), m=k?missionAt(MS.i):null;
  if(k!=='train'&&TRAIN.g){ trainDispose(); } if(k!=='ford'&&FORD.on){ fordReset(); } if(k!=='tower'&&TOWER.on){ towerDispose(); }
  PROT.on=!!k; if(!k||transit||FAIL.t>0&&k!=='train') { if(!k) WAVE.list=[]; return; }
  if(k==='train') trainTick(dt,t,m); else if(k==='ford') fordTick(dt,t,m); else if(k==='tower') towerTick(dt,t,m); }
function storyObjUI(o,m){ const here=m.loc===LOC_ID&&!LOC.safe;
  if(m.k==='train'){ let s, b; if(!here||!TRAIN.g){ s=missionText(m); b='—'; } else if(TRAIN.phase===0){ s='Встань в круг у перрона'; b='—'; } else { const p=Math.round(Math.max(0,Math.min(1,(TR_X0-TRAIN.x)/(TR_X0-TR_END)))*100); s=`Защищай поезд · путь ${p}%`; b=`<i class="pbar"><i style="width:${Math.round(TRAIN.hp/TRAIN.max*100)}%"></i></i>`; }
    const h=`<span class="lbl">Задание</span><span>${s}</span><b>${b}</b>`; if(o.dataset.h!==h){ o.dataset.h=h; o.innerHTML=h; } return true; }
  if(m.k==='ford'){ const h=here&&FORD.on?`<span class="lbl">Задание</span><span>Дошли ${FORD.saved} · погибли ${FORD.dead} · в пути ${FORD.list.filter(c=>c.st!=='dead'&&c.st!=='saved').length+FORD.q.length}</span><b>${FORD.saved} / ${FORD.n}</b>`:`<span class="lbl">Задание</span><span>${missionText(m)}</span><b>0 / ${m.n}</b>`; if(o.dataset.h!==h){ o.dataset.h=h; o.innerHTML=h; } return true; }
  if(m.k==='tower'){ const down=TOWER.legs.filter(L=>L.hp<=0).length, h=`<span class="lbl">Задание</span><span>${here&&TOWER.on?(TOWER.phase>0?'Башня падает!':'Разбей опоры башни'):missionText(m)}</span><b>${here?down:0} / 4</b>`; if(o.dataset.h!==h){ o.dataset.h=h; o.innerHTML=h; } return true; }
  o.dataset.h=''; return false; }
function storyTarget(m){ if(m.loc!==LOC_ID) return false;
  if(m.k==='train'){ if(TRAIN.phase===0){ MTGT.x=m.x; MTGT.z=m.z; MTGT.ok=Math.hypot(TK.x-m.x,TK.z-m.z)>m.rad; } else { MTGT.x=TRAIN.x+20; MTGT.z=TRAIN.z+3; MTGT.ok=Math.hypot(TK.x-MTGT.x,TK.z-MTGT.z)>18; } return true; }
  if(m.k==='ford'){ const s=FORD.src||[28,60]; MTGT.x=s[0]; MTGT.z=s[1]-8; MTGT.ok=Math.hypot(TK.x-MTGT.x,TK.z-MTGT.z)>12; return true; }
  if(m.k==='tower'){ const L=TOWER.legs.find(q=>q.hp>0); MTGT.x=L?L.x:TOWER.cx; MTGT.z=L?L.z:TOWER.cz; MTGT.ok=TOWER.phase===0&&Math.hypot(TK.x-MTGT.x,TK.z-MTGT.z)>9; return true; }
  return false; }
