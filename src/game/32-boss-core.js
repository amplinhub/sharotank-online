/* ================= v25 BOSSES: «Страж склепа», «Крот», «Шершень», «Золотой дракон» ================= */
const BOSS={e:null,t:0};
/* boss toughness follows the garage: +10% per installed upgrade level on the tank you came in */
function bossMul(){ let s=0; for(const k of ['engine','armor','cal','load','stab','ammo','abl','rdr','rk']) s+=UP[k]|0; return 1+0.1*s; }
function bossSetup(e,name,base){ e.boss=true; e.bName=name; e.hp=e.maxHp=Math.round(base*bossMul()); e.ph=1; e.aggro=true; BOSS.e=e; bossBarShow(true); }
/* v27: phases start silently — no radio line, no toast */
function bossPhase(e,n){ if(e.ph>=n) return false; e.ph=n; return true; }
function bossBarShow(on){ const b=$('#bossBar'); if(b) b.hidden=!on; }
function bossUI(dt){ zapsDraw(dt); if(!LOC.safe&&!transit&&(!BOSS.e||(BOSS.e.dead&&!BOSS.e.dying))){ const b2=ENEMIES.find(x=>x.boss&&!x.dead); if(b2) BOSS.e=b2; } const e=BOSS.e, b=$('#bossBar'); if(!b) return; if(!e||(e.dead&&!e.dying)||LOC.safe||transit){ if(!b.hidden) b.hidden=true; if(e&&e.dead&&!e.dying) BOSS.e=null; return; }
  if(b.hidden) b.hidden=false; const [cur,max]=e.barHp?e.barHp():[e.hp,e.maxHp], f=clamp(cur/Math.max(1,max),0,1); BOSS.t+=dt;
  const U=BOSS.ui||(BOSS.ui={n:$('#bbName'),f:$('#bbF'),name:null,w:null,inv:null}); if(U.name!==e.bName){ U.name=e.bName; U.n.textContent=e.bName; }
  const w=(f*100).toFixed(1); if(U.w!==w){ U.w=w; U.f.style.width=w+'%'; } const iv=!!e.barInv; if(U.inv!==iv){ U.inv=iv; U.f.classList.toggle('inv',iv); } }
/* falling-rocket artillery: spinning target reticles on the ground mark where each rocket will land */
const TGTS=[], BRK=[];
const tgtGeo={ring:new THREE.RingGeometry(0.86,1,40).rotateX(-Math.PI/2),in:new THREE.RingGeometry(0.36,0.42,28).rotateX(-Math.PI/2),tick:new THREE.PlaneGeometry(0.08,0.5).rotateX(-Math.PI/2)};
const tgtMat=new THREE.MeshBasicMaterial({color:0xff4a32,transparent:true,opacity:0.85,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
function tgtMark(x,z,r,T){ const g=new THREE.Group(), s=new THREE.Group(); g.add(s); s.add(new THREE.Mesh(tgtGeo.ring,tgtMat)); s.add(new THREE.Mesh(tgtGeo.in,tgtMat));
  for(let k=0;k<4;k++){ const t=new THREE.Mesh(tgtGeo.tick,tgtMat); const a=k/4*TAU; t.position.set(Math.cos(a)*0.68,0,Math.sin(a)*0.68); t.rotation.y=-a+Math.PI/2; s.add(t); }
  g.scale.setScalar(r); g.position.set(x,groundH(x,z)+0.09,z); g.renderOrder=7; scene.add(g); EXTRAS.push(g); const o={g,s,t:0,T,spin:(rnd()<0.5?1:-1)*(1.6+rnd()*1.4)}; TGTS.push(o); return o; }
function tgtUpdate(dt){ for(let i=TGTS.length-1;i>=0;i--){ const o=TGTS[i]; o.t+=dt; const k=o.t/o.T; o.s.rotation.y+=o.spin*dt*(1+k*2); o.g.scale.y=1; const pul=1+0.08*Math.sin(o.t*14);
    o.s.scale.set(pul*(1.25-0.25*Math.min(1,k)),1,pul*(1.25-0.25*Math.min(1,k))); if(o.t>=o.T){ scene.remove(o.g); TGTS.splice(i,1); } }
  tgtMat.opacity=0.6+0.35*Math.sin(performance.now()/90); }
const brkGeo=new THREE.CylinderGeometry(0.13,0.13,1.1,8).rotateX(Math.PI/2), brkMat=new THREE.MeshBasicMaterial({color:0x2a2e34}), brkFire=new THREE.MeshBasicMaterial({color:0xffb04a});
function bossRocket(ox,oy,oz,tx,tz,delay,dmg){ const m=new THREE.Mesh(brkGeo,brkMat), f=new THREE.Mesh(new THREE.SphereGeometry(0.22,8,6),brkFire); f.position.z=-0.6; m.add(f); m.position.set(ox,oy,oz); scene.add(m); EXTRAS.push(m);
  const mk=tgtMark(tx,tz,1.7,delay+1.05); BRK.push({m,st:'up',t:0,x:ox,y:oy,z:oz,vx:(rnd()-0.5)*4,vy:26+rnd()*6,vz:(rnd()-0.5)*4,tx,tz,delay,dmg:dmg||14,mk}); sfxRocket(); }
function brkUpdate(dt){ for(let i=BRK.length-1;i>=0;i--){ const r=BRK[i]; r.t+=dt;
    if(r.st==='up'){ r.x+=r.vx*dt; r.y+=r.vy*dt; r.z+=r.vz*dt; r.vy+=8*dt; r.m.position.set(r.x,r.y,r.z); r.m.lookAt(r.x+r.vx,r.y+r.vy,r.z+r.vz); SMOKE.spawn(r.x,r.y,r.z,(rnd()-0.5),-1,(rnd()-0.5),0.5,1.6,1.1,0.55,0.75,0.76,0.8);
      if(r.t>0.9){ r.st='wait'; r.m.visible=false; } }
    else if(r.st==='wait'){ if(r.t>=r.delay){ r.st='down'; r.m.visible=true; r.x=r.tx+(rnd()-0.5)*0.6; r.z=r.tz+(rnd()-0.5)*0.6; r.y=34; r.vy=-36; sO(1800,500,0.9,0.05,'sine'); } }
    else { r.y+=r.vy*dt; r.vy-=10*dt; r.m.position.set(r.x,r.y,r.z); r.m.lookAt(r.x,r.y-5,r.z); SMOKE.spawn(r.x,r.y+0.6,r.z,0,1,0,0.45,1.5,0.8,0.5,0.75,0.76,0.8);
      const gy=groundH(r.x,r.z); if(r.y<=gy+0.4){ explode(r.x,gy+0.5,r.z,1.7,1.0,0,-1,0,'shell',null,1,null,1); const d=Math.hypot(TK.x-r.x,TK.z-r.z); if(d<3.2) damageTank(r.dmg*(1-d/4),TK.x-r.x,TK.z-r.z,1);
        groundFlash(r.x,r.z,5,P.glow2,0.25); scene.remove(r.m); BRK.splice(i,1); } } } }
function bossFxClear(){ ZAPS.length=0; for(const o of TGTS) scene.remove(o.g); TGTS.length=0; for(const r of BRK) scene.remove(r.m); BRK.length=0; BOSS.e=null; bossBarShow(false); }
const _bw=new THREE.Vector3(), _bw2=new THREE.Vector3();

/* ---- v27: electric arcs (immediate-mode lines, redrawn every frame) ---- */
const ZAPS=[];
function zapLine(ax,ay,az,bx,by,bz,c,jit,n){ let px=ax,py=ay,pz=az; n=n||7; for(let i=1;i<=n;i++){ const t=i/n, k=i<n?jit:0, x=ax+(bx-ax)*t+(rnd()-0.5)*k, y=ay+(by-ay)*t+(rnd()-0.5)*k, z=az+(bz-az)*t+(rnd()-0.5)*k; LINES.push(px,py,pz,x,y,z,c[0],c[1],c[2],0.85); px=x; py=y; pz=z; } }
function zapBolt(ax,ay,az,bx,by,bz,c,life,jit,n){ ZAPS.push({a:[ax,ay,az],b:[bx,by,bz],c:c||[0.5,0.85,1],t:life||0.15,T:life||0.15,j:jit==null?0.6:jit,n:n||7}); }
function zapsDraw(dt){ for(let i=ZAPS.length-1;i>=0;i--){ const z=ZAPS[i]; z.t-=dt; if(z.t<=0){ ZAPS.splice(i,1); continue; } const k=0.35+0.65*z.t/z.T; zapLine(z.a[0],z.a[1],z.a[2],z.b[0],z.b[1],z.b[2],[z.c[0]*k,z.c[1]*k,z.c[2]*k],z.j,z.n); } }
/* ---- v27: every boss dies in a chain of blasts, then a huge detonation tears the model into flying pieces ---- */
const _sh1=new THREE.Vector3();
function shatterGroup(root,cx,cy,cz,pw,maxN){ root.updateMatrixWorld(true); const ms=[]; root.traverse(o=>{ if(o.isMesh&&o.material!==outlineMat&&o.visible&&o.geometry) ms.push(o); });
  if(ms.length>maxN){ for(let i=ms.length-1;i>0;i--){ const j=(rnd()*(i+1))|0, t=ms[i]; ms[i]=ms[j]; ms[j]=t; } ms.length=maxN; }
  for(const m of ms){ const g=m.geometry; if(!g.boundingSphere) g.computeBoundingSphere(); _sh1.copy(g.boundingSphere.center).applyMatrix4(m.matrixWorld); const rad=g.boundingSphere.radius*Math.max(m.matrixWorld.getMaxScaleOnAxis(),0.01);
    let dx=_sh1.x-cx, dy=_sh1.y-cy, dz=_sh1.z-cz; const l=Math.hypot(dx,dy,dz)||1; dx/=l; dy/=l; dz/=l; const sp=(5+rnd()*9)*pw;
    const gb=gibMeshes([m],_sh1,null,dx*sp+(rnd()-0.5)*3,Math.max(1,dy*sp*0.6)+4+rnd()*8*pw,dz*sp+(rnd()-0.5)*3,clamp(rad*0.35,0.3,1.4)); gb.w.multiplyScalar(1+pw*0.4);
    if(rnd()<0.3) FIRE.spawn(_sh1.x,_sh1.y,_sh1.z,dx*3,2,dz*3,1.2,2.6,0.6,1,1,0.6,0.2); } return ms.length; }
function bossDeath(e,o){ o=o||{}; const k=o.k||3.4; e.dead=true; e.dying=true; e.lockable=false; e.inv=true;
  const cx=o.x!=null?o.x:e.x, cz=o.z!=null?o.z:e.z, cy=o.y!=null?o.y:(e.y||groundH(cx,cz))+(e.hy||1.5), N=o.n||9, gap=0.17;
  sO(300,40,N*gap+0.8,0.16,'sawtooth'); sNz(N*gap+0.6,'lowpass',500,0.7,0.3);
  for(let i=0;i<N;i++) later(i*gap,()=>{ const a=rnd()*TAU, r=rnd()*k*0.8, x=cx+Math.cos(a)*r, y=cy+(rnd()-0.35)*k*0.55, z=cz+Math.sin(a)*r;
    explode(x,y,z,1.5+rnd()*0.9,0.9,0,-1,0,'shell',null,0,e,0.25); deathFx(x,y,z,0.7); for(let n=0;n<8;n++) spark(x,y,z,(rnd()-0.5)*12,rnd()*8,(rnd()-0.5)*12,1,0.8,0.4,0.5); shake=Math.min(1,shake+0.12); if(i%3===0) hitStop=Math.max(hitStop,0.04); });
  later(N*gap+0.3,()=>{ explode(cx,cy,cz,k*1.25,2.6,0,-1,0,'shell',null,0,e,0.5); shockwave(cx,cz,26,[1,0.85,0.45]); later(0.12,()=>shockwave(cx,cz,16,[1,1,1]));
    groundFlash(cx,cz,k*5,P.glow2,0.6); screenFlash(0.75,false); shake=1; hitStop=Math.max(hitStop,0.22); camPunch=Math.max(camPunch,1.3); deathFx(cx,cy,cz,k*1.2);
    for(let n=0;n<22;n++){ const a=rnd()*TAU, sp=3+rnd()*7; FIRE.spawn(cx+(rnd()-0.5)*k,cy,cz+(rnd()-0.5)*k,Math.cos(a)*sp,6+rnd()*10,Math.sin(a)*sp,1.6+rnd()*2.2,4,0.7+rnd()*0.8,1,1,0.55+rnd()*0.3,0.15); }
    for(let n=0;n<90;n++){ const a=rnd()*TAU, sp=8+rnd()*16; spark(cx,cy,cz,Math.cos(a)*sp,rnd()*14,Math.sin(a)*sp,1,0.8+rnd()*0.2,0.45,0.7+rnd()*0.9); }
    for(let n=0;n<24;n++){ const a=rnd()*TAU, sp=3+rnd()*9; debSpawn(cx,Math.max(0.5,cy-1),cz,Math.cos(a)*sp,4+rnd()*8,Math.sin(a)*sp,0.3,0.3,0.32,0.2+rnd()*0.3); }
    shatterGroup(e.g,cx,cy,cz,o.pw||1.15,o.maxN||70); if(e.lg&&o.lg) shatterGroup(e.lg,cx,cy,cz,o.pw||1.15,40); e.g.visible=false; e.lg.visible=false;
    craterAt(cx,cz,k,0.55); dropScrap(cx,cz,o.scrap||600,2); sfxBoom(2); sO(180,25,1.6,0.2,'sawtooth'); sNz(1.4,'lowpass',700,0.7,0.35);
    later(0.05,()=>{ eRemove(e); e.dying=false; bossWin(e); if(o.after) o.after(); }); }); }

