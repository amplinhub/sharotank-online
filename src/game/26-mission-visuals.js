/* ================= MISSION VISUALS: 3D preview, target arrow, rings, hold zones ================= */
const MCOL=0x3dffb5, MCOL3=[0.24,1,0.71];
const LOC_XY={camp:[1,1],north:[1,0],south:[1,2],west:[0,1],east:[2,1],nw:[0,0],ne:[2,0],sw:[0,2],se:[2,2],cem:[-1,1],junk:[1,-1],auto:[3,1],park:[1,3]};
const PV={r:null,scene:null,cam:null,obj:null,e:null,t:0,type:null};
function pvInit(){ const cv=$('#mcPrev'); try{ PV.r=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true}); }catch(err){ PV.r=null; return; }
  PV.r.setPixelRatio(Math.min(2,window.devicePixelRatio||1)); PV.scene=new THREE.Scene(); PV.cam=new THREE.PerspectiveCamera(30,1,0.1,100);
  PV.scene.add(new THREE.HemisphereLight(0xffffff,0x223344,1.1)); const dl=new THREE.DirectionalLight(0xffffff,0.7); dl.position.set(-3,6,5); PV.scene.add(dl); }
function pvSet(type){ if(!PV.r) pvInit(); if(!PV.r) return; if(PV.obj){ PV.scene.remove(PV.obj); PV.obj=null; } PV.e=null; PV.type=type; const root=new THREE.Group(); PV.obj=root; PV.scene.add(root);
  const disc=new THREE.Mesh(new THREE.CircleGeometry(1,40),new THREE.MeshBasicMaterial({color:MCOL,transparent:true,opacity:0.18})); disc.rotation.x=-Math.PI/2; root.add(disc);
  if(ETYPE[type]){ const e={type,x:0,z:0,y:0,h:0,vx:0,vz:0,kx:0,kz:0,mats:[],glows:[],g:new THREE.Group(),body:new THREE.Group(),lg:new THREE.Group(),legs:[],home:{x:0,z:0},yaw:0,side:1,state:'idle',t:0,r:1,hy:0};
    e.g.add(e.body); const nC=scene.children.length, nD=DRONES.length, nX=EXTRAS.length; ETYPE[type].build(e,{mod:'ac'});
    while(scene.children.length>nC) scene.remove(scene.children[scene.children.length-1]); DRONES.length=nD; EXTRAS.length=nX;
    if(e.halo) e.halo=null; root.add(e.g,e.lg); e.g.position.y=e.wc?e.wc.bodyH:0; PV.e=e; disc.scale.setScalar(Math.max(1.2,e.r*1.8)); }
  else if(type==='evac'){ const c=civMake(0,0,1); scene.remove(c.g); EXTRAS.pop(); c.g.position.set(0,0,0); root.add(c.g); disc.scale.setScalar(1.3); }
  else if(type==='hold'||type==='flag'){ const m=new THREE.MeshToonMaterial({color:0x8d96a1,gradientMap:gradTex}), f=new THREE.MeshBasicMaterial({color:MCOL,side:THREE.DoubleSide});
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,2.6,8),m); pole.position.y=1.3; root.add(pole); const fl=new THREE.Mesh(new THREE.PlaneGeometry(1.2,0.7),f); fl.position.set(0.62,2.2,0); root.add(fl); PV.flag=fl;
    const ring=new THREE.Mesh(new THREE.RingGeometry(1.6,1.75,48),new THREE.MeshBasicMaterial({color:MCOL})); ring.rotation.x=-Math.PI/2; ring.position.y=0.02; root.add(ring); disc.scale.setScalar(1.6); }
  else { const n=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,0.3,6),new THREE.MeshToonMaterial({color:0xffc94a,gradientMap:gradTex})); n.rotation.x=Math.PI/2; n.position.y=0.8; root.add(n); PV.nut=n; }
  const S={crypt:[20,4.0],xfmr:[11,2.4],krot:[17,2.0],hornet:[18,0.2],dragon:[17,1.6],lion:[8,1.4],katok:[11,1.5],zont:[6,1.0],flag:[7.5,1.5],evac:[4,0.9],jian:[6.2,0.95],bomb:[3.4,0.5],hive:[11,1.8],factory:[16,2.8],bull:[9.5,1.4],lamp:[17,4.2],hold:[7.5,1.2]}[type]||[4,0.8]; PV.dist=S[0]; PV.ty=S[1]; PV.t=0; }
function pvRender(dt){ if(!PV.r||!PV.obj) return; const cv=PV.r.domElement, w=cv.clientWidth||110, h=cv.clientHeight||110; if(cv.width!==Math.round(w*PV.r.getPixelRatio())) PV.r.setSize(w,h,false);
  PV.cam.aspect=w/h; PV.cam.updateProjectionMatrix(); PV.t+=dt; const a=PV.t*0.7; PV.cam.position.set(Math.sin(a)*PV.dist,PV.ty+PV.dist*0.42,Math.cos(a)*PV.dist); PV.cam.lookAt(0,PV.ty,0);
  const e=PV.e; if(e){ e.g.position.y=(e.wc?e.wc.bodyH:0)+Math.sin(PV.t*3)*0.03; const ch=1, sh=0; for(const L of e.legs){ L.foot.set(L.rest[0]*ch+L.rest[1]*sh,0,-L.rest[0]*sh+L.rest[1]*ch); } if(e.wc){ e.g.updateMatrixWorld(true); legRender(e); }
    if(e.eyeM){ const c=P.glow; e.eyeM.color.setRGB(c[0],c[1],c[2]); } if(e.hpet){ const o=0.5+0.5*Math.sin(PV.t*2); for(const g of e.hpet) g.rotation.x=o*1.3; } if(e.lid){ const o=Math.max(0,Math.sin(PV.t*1.6)); e.lid.rotation.x=-o*1.2; } }
  if(PV.flag) PV.flag.rotation.y=Math.sin(PV.t*4)*0.25; if(PV.nut) PV.nut.rotation.z+=dt*2;
  PV.r.render(PV.scene,PV.cam); }

/* ---- target finder: which way to go, which things to ring ---- */
const MTGT={x:0,z:0,ok:false,gate:null,list:[]};
function routeGate(to){ const a=LOC_XY[LOC_ID], b=LOC_XY[to]; if(!a||!b) return null; const ex=LOC.exits; const opts=[];
  if(b[0]<a[0]&&ex.W) opts.push('W'); if(b[0]>a[0]&&ex.E) opts.push('E'); if(b[1]<a[1]&&ex.N) opts.push('N'); if(b[1]>a[1]&&ex.S) opts.push('S');
  if(opts.length) return opts[0]; for(const s of ['N','S','W','E']) if(ex[s]&&ex[s]==='camp') return s; return Object.keys(ex)[0]; }
function locsWith(type){ return Object.keys(LOCS).filter(k=>(LOCS[k].enemies||[]).some(en=>en[0]===type)); }
function missionTargets(){ MTGT.ok=false; MTGT.gate=null; MTGT.list.length=0; if(GAR.open) return;
  if(!MS.active){ if(LOC_ID!=='camp'){ MTGT.gate=routeGate('camp'); const g=GATES.find(q=>q.side===MTGT.gate); if(g){ MTGT.x=(g.r[0]+g.r[2])/2; MTGT.z=(g.r[1]+g.r[3])/2; MTGT.ok=true; } } else if(!mcOpen){ MTGT.x=(HQ.x0+HQ.x1)/2; MTGT.z=(HQ.z0+HQ.z1)/2; MTGT.ok=!HQ.in; } return; } const m=missionAt(MS.i);
  let goal=m.loc||null; if(m.k==='flag'&&MS.flag) goal='camp';
  if(m.k==='scrap'){ if(LOC.safe){ goal=null; const s=['N','W','S','E'].find(s=>LOC.exits[s]); MTGT.gate=s; } else return; }
  if(!goal&&m.k!=='scrap'){ const here=!LOC.safe&&ENEMIES.some(e=>!e.dead&&e.type===m.k); if(here) goal=LOC_ID; else { let best=null,bd=99; const a=LOC_XY[LOC_ID]; for(const k of locsWith(m.k)){ if(k===LOC_ID) continue; const b=LOC_XY[k], d=Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]); if(d<bd){ bd=d; best=k; } } goal=best; } }
  if(goal&&goal!==LOC_ID){ MTGT.gate=routeGate(goal); }
  if(MTGT.gate){ const g=GATES.find(g=>g.side===MTGT.gate); if(g){ MTGT.x=(g.r[0]+g.r[2])/2; MTGT.z=(g.r[1]+g.r[3])/2; MTGT.ok=true; } return; }
  if(m.k==='flag'){ if(MS.flag){ MTGT.x=(HQ.x0+HQ.x1)/2; MTGT.z=(HQ.z0+HQ.z1)/2; MTGT.ok=true; } else if(FLG.g){ MTGT.x=FLG.x; MTGT.z=FLG.z; MTGT.ok=Math.hypot(TK.x-FLG.x,TK.z-FLG.z)>3; } return; }
  if(m.k==='clear'){ let bd=1e9; for(const e of ENEMIES){ if(e.dead||e.xf||e.state==='fly') continue; MTGT.list.push(e); const d=Math.hypot(e.x-TK.x,e.z-TK.z); if(d<bd){ bd=d; MTGT.x=e.x; MTGT.z=e.z; MTGT.ok=true; } } return; }
  if(m.k==='evac'){ if(CIV.phase===0){ let bd=1e9; for(const e of ENEMIES){ if(e.dead||e.state==='fly') continue; MTGT.list.push(e); const d=Math.hypot(e.x-TK.x,e.z-TK.z); if(d<bd){ bd=d; MTGT.x=e.x; MTGT.z=e.z; MTGT.ok=true; } } } else if(CIV.gate){ MTGT.x=CIV.gate[0]; MTGT.z=CIV.gate[1]; MTGT.ok=true; } return; }
  if(m.k==='hold'){ MTGT.x=m.x; MTGT.z=m.z; MTGT.ok=Math.hypot(TK.x-m.x,TK.z-m.z)>m.rad; return; }
  let bd=1e9; for(const e of ENEMIES){ if(e.dead||e.type!==m.k||e.state==='fly') continue; MTGT.list.push(e); const d=Math.hypot(e.x-TK.x,e.z-TK.z); if(d<bd){ bd=d; MTGT.x=e.x; MTGT.z=e.z; MTGT.ok=true; } } }
const TRINGS=[]; const tringGeo=new THREE.RingGeometry(0.86,1,48); tringGeo.rotateX(-Math.PI/2);
function tringsUpdate(t){ const L=MTGT.list; while(TRINGS.length<L.length){ const m=new THREE.Mesh(tringGeo,new THREE.MeshBasicMaterial({color:MCOL,transparent:true,opacity:0.85,depthWrite:false})); m.renderOrder=4; scene.add(m); TRINGS.push(m); }
  for(let i=0;i<TRINGS.length;i++){ const m=TRINGS[i], e=L[i]; if(!e){ m.visible=false; continue; } m.visible=true; const r=e.r+0.9+Math.sin(t*4+i)*0.12; m.scale.set(r,1,r); m.position.set(e.x,groundH(e.x,e.z)+0.09,e.z); } }
const arrowEl=$('#tgtArrow');
function arrowUpdate(){ if(!MTGT.ok||transit||TK.dead){ arrowEl.hidden=true; return; } const s=toScreen(MTGT.x,0.5,MTGT.z), W=innerWidth, H=innerHeight, m=46;
  const on=s[2]&&s[0]>m&&s[0]<W-m&&s[1]>m&&s[1]<H-m; const tk=toScreen(TK.x,TK.y+1,TK.z);
  if(on&&!MTGT.gate&&MTGT.list.length){ arrowEl.hidden=true; return; }
  let dx=s[0]-W/2, dy=s[1]-H/2; if(!s[2]){ dx=-dx; dy=-dy; } const ang=Math.atan2(dy,dx);
  let x,y; if(on){ x=s[0]; y=s[1]-34; arrowEl.classList.add('near'); } else { const k=Math.min((W/2-m)/Math.abs(Math.cos(ang)||1e-3),(H/2-m)/Math.abs(Math.sin(ang)||1e-3)); x=W/2+Math.cos(ang)*k; y=H/2+Math.sin(ang)*k; arrowEl.classList.remove('near'); }
  arrowEl.hidden=false; arrowEl.style.transform=`translate(${x}px,${y}px)`; arrowEl.firstElementChild.style.transform=`rotate(${on?90:ang*180/Math.PI}deg)`;
  const d=Math.hypot(MTGT.x-TK.x,MTGT.z-TK.z); $('#tgtD').textContent=MTGT.gate?LOCS[LOC.exits[MTGT.gate]].ru:Math.round(d)+' м'; }

/* ---- hold zone: stand inside while waves come from the edges ---- */
const HOLD={m:null,label:null,lc:null,ltex:null,wave:0,waveT:0,active:false};
function holdBuild(){ HOLD.active=false; if(HOLD.m){ scene.remove(HOLD.m); scene.remove(HOLD.label); HOLD.m=null; } if(!MS.active) return; const m=missionAt(MS.i); if(m.k!=='hold'||m.loc!==LOC_ID) return;
  const g=new THREE.Group(); const disc=new THREE.Mesh(new THREE.CircleGeometry(m.rad,56),new THREE.MeshBasicMaterial({color:MCOL,transparent:true,opacity:0.12,depthWrite:false})); disc.rotation.x=-Math.PI/2; g.add(disc);
  const ring=new THREE.Mesh(new THREE.RingGeometry(m.rad-0.25,m.rad,72),new THREE.MeshBasicMaterial({color:MCOL,transparent:true,opacity:0.9,depthWrite:false})); ring.rotation.x=-Math.PI/2; g.add(ring);
  HOLD.prog=new THREE.Mesh(new THREE.RingGeometry(m.rad+0.15,m.rad+0.55,72,1,0,0.001),new THREE.MeshBasicMaterial({color:MCOL,depthWrite:false,side:THREE.DoubleSide})); HOLD.prog.rotation.x=-Math.PI/2; g.add(HOLD.prog);
  for(let k=0;k<4;k++){ const a=k*Math.PI/2+Math.PI/4, p=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,2.2,6),new THREE.MeshBasicMaterial({color:MCOL})); p.position.set(Math.cos(a)*m.rad,1.1,Math.sin(a)*m.rad); g.add(p); }
  g.position.set(m.x,0.08,m.z); g.renderOrder=3; scene.add(g); HOLD.m=g;
  const cv=document.createElement('canvas'); cv.width=512; cv.height=128; HOLD.lc=cv; HOLD.ltex=new THREE.CanvasTexture(cv); HOLD.label=new THREE.Sprite(new THREE.SpriteMaterial({map:HOLD.ltex,transparent:true,depthWrite:false,depthTest:false})); HOLD.label.scale.set(8,2,1); HOLD.label.position.set(m.x,4.4,m.z); HOLD.label.renderOrder=30; scene.add(HOLD.label);
  HOLD.active=true; HOLD.waveT=4; HOLD.lastTxt=''; holdLabel(m); }
function holdLabel(m){ const c=HOLD.lc.getContext('2d'), sec=Math.max(0,Math.ceil(m.t-MS.prog)), txt=`УДЕРЖИВАЙ · ${m.name.toUpperCase()} · ${sec} С`; if(txt===HOLD.lastTxt) return; HOLD.lastTxt=txt;
  c.clearRect(0,0,512,128); c.fillStyle='rgba(6,12,26,0.78)'; c.fillRect(8,24,496,80); c.strokeStyle='#3dffb5'; c.lineWidth=4; c.strokeRect(8,24,496,80); c.fillStyle='#3dffb5'; c.font="800 22px Unbounded, 'Arial Black', sans-serif"; c.textAlign='center'; c.textBaseline='middle'; c.fillText(txt,256,66); HOLD.ltex.needsUpdate=true; }
function holdUpdate(dt,t){ if(!HOLD.active) return; if(!MS.active){ holdBuild(); return; } const m=missionAt(MS.i); if(m.k!=='hold'){ holdBuild(); return; }
  const inside=!TK.dead&&Math.hypot(TK.x-m.x,TK.z-m.z)<m.rad; if(inside){ MS.prog=Math.min(m.t,MS.prog+dt); HOLD.started=true; }
  HOLD.m.children[1].material.opacity=inside?0.95:0.5+0.4*Math.sin(t*5); HOLD.m.children[0].material.opacity=inside?0.2:0.08;
  const f=MS.prog/m.t; if(Math.abs(f-(HOLD.pf||-1))>0.004){ HOLD.pf=f; HOLD.prog.geometry.dispose(); HOLD.prog.geometry=new THREE.RingGeometry(m.rad+0.15,m.rad+0.55,72,1,Math.PI/2,-Math.max(0.001,f*TAU)); }
  holdLabel(m); HOLD.label.position.y=4.4+Math.sin(t*2)*0.15; HOLD.objT=(HOLD.objT||0)-dt; if(HOLD.objT<=0){ HOLD.objT=0.25; objUI(); }
  if(HOLD.started&&inside){ HOLD.waveT-=dt; const alive=ENEMIES.filter(e=>!e.dead&&e.wave).length; if(HOLD.waveT<=0&&alive<10){ HOLD.waveT=9; holdWave(m); } }
  if(MS.prog>=m.t){ HOLD.started=false; completeMission(); } }
function holdWave(m){ HOLD.wave++; const sides=['N','S','W','E'].sort(()=>rnd()-0.5).slice(0,2); const n=2+Math.min(3,HOLD.wave>>1);
  for(const s of sides){ const ex=s==='W'?5:s==='E'?75:null, ez=s==='N'?5:s==='S'?75:null;
    for(let k=0;k<n;k++){ const x=ex!=null?ex:12+rnd()*56, z=ez!=null?ez:12+rnd()*56; if(Math.hypot(x-TK.x,z-TK.z)<16) continue; const p=pickNear(x,z,1); if(!p) continue;
      let t=HOLD.wave%3===0&&k===0?'bull':(rnd()<0.3?'bomb':'jian'); if(!unlocked(t)) t='jian'; if(k===1&&HOLD.wave%2===0&&unlocked('zont')) t='zont'; const e=spawnEnemy(t,p[0],p[1],t==='bull'?{mod:['ac','mg'][(rnd()*2)|0]}:null); e.wave=true; e.aggro=true; e.last={x:m.x,z:m.z}; e.lostT=0; e.home={x:m.x,z:m.z}; dustAt(p[0],p[1],1.2); } }
  toast(`Волна ${HOLD.wave} · враги с двух сторон`); }
function pickNear(x,z,r){ for(let k=0;k<30;k++){ const a=rnd()*TAU, rr=k*0.4, px=clamp(x+Math.cos(a)*rr,4,WX-4), pz=clamp(z+Math.sin(a)*rr,4,WZ-4); if(eFree(px,pz,r)&&navOk(Math.floor(px),Math.floor(pz),0.8)) return [px,pz]; } return null; }

