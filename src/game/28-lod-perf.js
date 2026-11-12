/* ================= VEHICLE DETAIL MESHES (LOD) ================= */
const VEHS=[]; let CAR_LOD=2, lodT=0, lodLow=0, lodHigh=0;
const VM={}; function vmat(k,c){ return VM[k]||(VM[k]=new THREE.MeshToonMaterial({color:c,gradientMap:gradTex})); }
const VG={hub:new THREE.CylinderGeometry(1,1,1,14).rotateX(Math.PI/2),box:new THREE.BoxGeometry(1,1,1),disc:new THREE.CircleGeometry(1,16),cyl:new THREE.CylinderGeometry(1,1,1,10)};
const VGLOW={warm:new THREE.MeshBasicMaterial({color:0xfff2c8}),red:new THREE.MeshBasicMaterial({color:0xff3a2e}),amber:new THREE.MeshBasicMaterial({color:0xffb53a}),blue:new THREE.MeshBasicMaterial({color:0x6fd0ff})};
function vehDetail(kind,x,z,ax,car,y0){ VEHS.push({kind,x,z,ax,car,y0:y0||0,parts:[],built:false}); }
function vehBuild(v){ const D=vmat('dk',0x1c2226), Mt=vmat('mt',0x8d96a1), Rim=vmat('rim',0x4a5260), Ch=vmat('ch',0x3a4248), Ar=vmat('ar',0x55705e), Cn=vmat('cn',0x6c7a52);
  const add=(geo,mat,u,y,w,su,sy,sw,tier,rot)=>{ const o=_vo; o.position.set(v.ax?v.x+u:v.x+w,y+(v.y0||0),v.ax?v.z+w:v.z+u); o.rotation.set(0,0,0); o.scale.set(v.ax?su:sw,sy,v.ax?sw:su); if(rot) rot(o); o.updateMatrix();
    v.parts.push({geo,mat,mtx:o.matrix.clone(),tier,ax:c(o.position.x),ay:c(Math.max(0.05,o.position.y)),az:c(o.position.z),px:o.position.x,pz:o.position.z,dead:false,inst:null,idx:0}); return o; };
  const hubs=(us,ws,y,r,tier)=>{ for(const u of us) for(const w of ws){ const s=Math.sign(w); add(VG.hub,Rim,u,y,w,r*2*(v.ax?1:1),r*2,0.08,1,m=>{ if(v.ax) m.rotation.y=0; else m.rotation.y=Math.PI/2; m.scale.set(r,r,0.06); }); add(VG.hub,Mt,u,y,w+s*0.03,0,0,0,2,m=>{ m.rotation.y=v.ax?0:Math.PI/2; m.scale.set(r*0.42,r*0.42,0.07); }); } };
  const lights=(u,y,ws,mat,sz)=>{ for(const w of ws) add(VG.box,mat,u,y,w,0.03,sz,sz*1.6,1); };
  if(/^(sedan|van)/.test(v.kind)){ const L=v.kind[0]==='v'?2.9:2.0, d=v.kind.endsWith('R')?-1:1, w=v.kind[0]==='v'?1.1:0.95; hubs([-L*0.6,L*0.6],[-w,w],v.kind[0]==='v'?0.36:0.3,v.kind[0]==='v'?0.36:0.28,1);
    lights(d*(L-0.02),0.66,[-0.55,0.55],VGLOW.warm,0.15); lights(-d*(L-0.02),0.68,[-0.6,0.6],VGLOW.red,0.13); add(VG.box,D,d*(L+0.01),0.34,0,0.08,0.1,w*1.7,2); add(VG.box,D,-d*(L+0.01),0.34,0,0.08,0.1,w*1.7,2);
    for(const s of [-1,1]){ add(VG.box,D,d*(L*0.4),1.1,s*(w+0.04),0.14,0.1,0.1,2); add(VG.box,Mt,d*0.3,0.8,s*(w-0.04),0.14,0.03,0.02,2); }
    /* v26 detail: plates, grille bar, fog lamps, side skirts, door seams, wipers, exhaust, van roof rack */
    const Pl=vmat('pl',0xe9edf0), isV=v.kind[0]==='v'; add(VG.box,Pl,d*(L+0.03),0.42,0,0.02,0.14,0.46,2); add(VG.box,Pl,-d*(L+0.03),isV?0.5:0.46,0,0.02,0.14,0.46,2);
    add(VG.box,Mt,d*(L+0.025),0.56,0,0.02,0.05,w*1.0,2); lights(d*(L+0.02),0.3,[-w*0.7,w*0.7],VGLOW.amber,0.06); add(VG.box,D,-d*(L+0.03),0.24,w*0.5*d,0.1,0.08,0.08,2);
    for(const s of [-1,1]){ add(VG.box,D,0,0.3,s*(w+0.02),L*1.05,0.07,0.03,2); for(const du of (isV?[0.2,-1.0]:[0.15,-0.85])) add(VG.box,D,d*du,isV?1.2:0.66,s*(w+0.012),0.03,isV?1.6:0.62,0.02,2);
      if(!isV) add(VG.box,D,d*1.02,0.99,s*0.32,0.03,0.03,0.46,2); else { add(VG.box,Mt,0,2.78,s*0.82,L*1.3,0.06,0.06,2); } }
    if(isV){ for(const du of [-1,0,1]) add(VG.box,Mt,du,2.8,0,0.06,0.06,1.7,2); add(VG.box,D,-d*(L+0.012),1.5,0,0.02,1.9,0.03,2); } }
  else if(v.kind==='taxi'){ hubs([-1.15,1.15],[-0.94,0.94],0.3,0.27,1); lights(1.93,0.68,[-0.55,0.55],VGLOW.warm,0.16); lights(-1.93,0.7,[-0.55,0.55],VGLOW.red,0.14);
    add(VG.box,D,1.94,0.46,0,0.04,0.16,1.0,2); add(VG.box,D,-1.94,0.4,0,0.04,0.14,1.4,2); add(VG.box,D,1.95,0.32,0,0.08,0.1,1.7,2); add(VG.box,D,-1.95,0.32,0,0.08,0.1,1.7,2);
    for(const s of [-1,1]){ add(VG.box,D,0.78,1.12,s*0.98,0.14,0.1,0.12,2); for(const u of [0.05,-0.85]) add(VG.box,D,u,0.7,s*0.905,0.02,0.6,0.02,2); add(VG.box,Mt,0.4,0.82,s*0.91,0.14,0.03,0.02,2); add(VG.box,Mt,-0.5,0.82,s*0.91,0.14,0.03,0.02,2); }
    add(VG.box,VGLOW.amber,0,1.98,0,0.5,0.1,0.32,2);
    for(const s of [-1,1]){ add(VG.box,VGLOW.blue,-0.1,0.33,s*0.92,2.6,0.03,0.03,2); add(VG.box,Mt,1.98,0.46,s*0.6,0.06,0.05,0.25,2); } for(let k=0;k<4;k++) add(VG.box,Mt,1.97,0.62+k*0.055,0,0.02,0.02,0.78,2); }
  else if(v.kind==='bus'){ hubs([-3.8,3.6],[-1.27,1.27],0.42,0.42,1); lights(5.62,0.82,[-0.8,0.8],VGLOW.warm,0.2); lights(-5.62,0.9,[-0.9,0.9],VGLOW.red,0.18); add(VG.box,VGLOW.amber,5.62,2.7,0,0.03,0.24,1.8,1);
    for(const s of [-1,1]){ add(VG.box,D,5.5,2.2,s*1.45,0.08,0.06,0.4,2); add(VG.box,D,5.7,2.0,s*1.6,0.12,0.36,0.06,2); for(const u of [4.2,1.0]) add(VG.box,D,u,1.15,s*1.265,1.2,1.4,0.02,2); }
    add(VG.box,Ch,-1,3.05,0,2.2,0.3,1.6,2); add(VG.box,Ch,-3.6,3.0,0,1.6,0.22,1.7,2); for(const s of [-1,1]) add(VG.box,VGLOW.blue,-3.6,3.12,s*0.86,1.5,0.04,0.03,2); add(VG.box,D,-5.63,0.6,0,0.04,0.5,1.6,2); for(let k=0;k<3;k++) add(VG.box,D,5.63,1.7+k*0.02,-0.4+k*0.4,0.03,0.04,0.36,2); }
  else if(v.kind==='truck'){ hubs([-2.2,-0.9,2.1],[-1.37,1.37],0.55,0.42,1); lights(3.1,1.25,[-0.8,0.8],VGLOW.warm,0.2); add(VG.box,D,3.09,1.6,0,0.04,0.4,1.3,2);
    for(const s of [-1,1]){ add(VG.box,D,2.6,2.1,s*1.3,0.1,0.32,0.06,2); add(VG.box,Cn,-1.6,1.45,s*1.24,0.5,0.6,0.16,2); for(const u of [-2.6,-1.6,-0.6,0.4]) add(VG.box,D,u,2.45,s*1.17,0.05,0.9,0.03,2); }
    add(VG.cyl,Mt,1.05,2.15,1.05,0.1,2.1,0.1,2); add(VG.cyl,D,1.05,3.25,1.05,0.12,0.14,0.12,2); add(VG.box,D,2.2,3.0,-0.6,0.03,0.9,0.03,2); add(VG.box,Mt,-3.05,0.9,0,0.08,0.18,2.2,2);
    /* v23 extra detail (medium/high): grille, bumper, fuel tanks, steps, mud flaps, tail lights, tarp ropes, beacon, spare wheel */
    for(let k=0;k<5;k++) add(VG.box,D,3.11,1.15+k*0.07,0,0.02,0.03,1.0,2); add(VG.box,Ch,3.15,0.72,0,0.18,0.18,2.3,2); for(const s of [-1,1]) add(VG.box,Mt,3.22,0.72,s*0.7,0.06,0.12,0.2,2);
    for(const s of [-1,1]){ add(VG.cyl,Mt,0.45,0.8,s*1.28,0.26,0.8,0.26,2,m=>{ m.rotation.z=Math.PI/2; m.scale.set(0.26,0.8,0.26); }); add(VG.box,D,0.45,0.8,s*1.28,0.03,0.3,0.3,2);
      add(VG.box,D,1.45,0.55,s*1.25,0.4,0.05,0.24,2); add(VG.box,D,1.45,0.85,s*1.25,0.4,0.05,0.24,2); add(VG.box,D,-2.85,0.55,s*1.1,0.04,0.45,0.42,2); add(VG.box,D,1.55,0.55,s*1.15,0.04,0.42,0.38,2);
      add(VG.box,VGLOW.red,-3.07,1.1,s*0.95,0.03,0.12,0.22,2); add(VG.box,VGLOW.amber,-3.07,1.27,s*0.95,0.03,0.06,0.22,2);
      for(const u of [-2.6,-1.6,-0.6,0.4]) add(VG.box,D,u,2.0,s*1.17,0.03,0.04,0.03,2); add(VG.box,D,-1.1,2.0,s*1.165,3.9,0.02,0.02,2); add(VG.box,Mt,2.62,2.0,s*1.38,0.04,0.04,0.2,2); }
    add(VG.box,VGLOW.amber,2.3,2.66,0,0.16,0.1,0.16,2); add(VG.box,D,2.3,2.62,0,0.24,0.03,0.24,2); add(VG.cyl,D,-1.1,2.2,-1.25,0.42,0.18,0.42,2,m=>{ m.rotation.x=Math.PI/2; m.scale.set(0.42,0.18,0.42); }); }
  else if(v.kind==='apc'){ hubs([-2.6,-0.9,0.9,2.6],[-1.6,1.6],0.58,0.44,1); lights(4.17,1.32,[-0.8,0.8],VGLOW.warm,0.18);
    for(const s of [-1,1]){ add(VG.box,Ar,0,1.6,s*1.45,4.6,0.5,0.08,2); for(const u of [-2,0,2]) add(VG.cyl,Mt,u,1.92,s*1.42,0.06,0.04,0.06,2,m=>{m.rotation.x=Math.PI/2;}); add(VG.box,Ch,-2.4,2.35,s*0.9,0.8,0.12,0.4,2); for(let k=0;k<3;k++) add(VG.cyl,D,0.45,2.6+k*0.12,s*0.55,0.07,0.28,0.07,2,m=>{ m.rotation.z=0.7; }); }
    add(VG.cyl,Mt,-0.2,2.92,0,0.32,0.06,0.32,2); add(VG.box,D,-3.1,3.3,0.8,0.03,1.6,0.03,2); add(VG.box,D,-3.1,3.1,-0.8,0.03,1.2,0.03,2); add(VG.box,Mt,4.12,0.75,0,0.1,0.15,1.6,2); add(VG.box,VGLOW.blue,-0.6,2.95,0,0.05,0.05,0.05,2); }
  else if(v.kind==='ptank'){ hubs([-0.9,0.9],[-1.38,1.38],0.55,0.42,1); add(VG.box,D,0,1.3,0,0.03,1.6,0.03,2,m=>{ m.position.x+=0.5; m.position.z-=0.6; m.position.y=3.3; });
    add(VG.cyl,Mt,0,3.05,-0.3,0.3,0.06,0.3,2); add(VG.box,Ar,0,1.32,1.32,1.6,0.1,0.06,2); add(VG.box,Ar,0,1.32,-1.32,1.6,0.1,0.06,2); }
  v.built=true; }
const gibOf=(m,vx,vy,vz,w)=>({m,v:new THREE.Vector3(vx,vy,vz),w:new THREE.Vector3((rnd()-0.5)*w,(rnd()-0.5)*w,(rnd()-0.5)*w),r:0.15,part:null,t:0,rest:false});
function lodUpdate(dt){ lodT+=dt; if(lodT<0.5) return; lodT=0; if(fpsS<36){ lodLow++; lodHigh=0; } else if(fpsS>52){ lodHigh++; lodLow=0; } else { lodLow=0; lodHigh=0; }
  const max=Q==='low'?1:2; let n=CAR_LOD; if(lodLow>=4&&CAR_LOD>0){ n=CAR_LOD-1; lodLow=0; } else if(lodHigh>=10&&CAR_LOD<max){ n=CAR_LOD+1; lodHigh=0; } if(n>max) n=max; if(n!==CAR_LOD){ CAR_LOD=n; for(const v of VEHS) vehLod(v); } }

/* ================= CAMP SOLDIERS step aside ================= */
function soldiersUpdate(dt,t){ const sp=Math.hypot(TK.vx,TK.vz);
  for(const s of SOLDIERS){ if(s.cx==null){ s.cx=s.x; s.cz=s.z; } const dx=TK.x-s.cx, dz=TK.z-s.cz, d=Math.hypot(dx,dz); let mvx=0, mvz=0;
    const tt=Math.max(0,((s.cx-TK.x)*TK.vx+(s.cz-TK.z)*TK.vz)/(sp*sp+1e-3)), px=TK.x+TK.vx*Math.min(tt,1.2), pz=TK.z+TK.vz*Math.min(tt,1.2), pd=Math.hypot(s.cx-px,s.cz-pz);
    if(d<3.4||(sp>1.5&&pd<3.2&&d<9)){ let ax=s.cx-px, az=s.cz-pz; if(Math.hypot(ax,az)<0.3){ ax=-TK.vz; az=TK.vx; } const l=Math.hypot(ax,az)||1; mvx=ax/l*3.6; mvz=az/l*3.6; s.away=1.2; }
    else if(s.away>0){ s.away-=dt; } else if(d>6&&Math.hypot(s.x-s.cx,s.z-s.cz)>0.15){ const ax=s.x-s.cx, az=s.z-s.cz, l=Math.hypot(ax,az); mvx=ax/l*Math.min(1.5,l*3); mvz=az/l*Math.min(1.5,l*3); }
    if(mvx||mvz){ const nx=s.cx+mvx*dt, nz=s.cz+mvz*dt; const cx=Math.floor(nx/VS), cz=Math.floor(nz/VS); if(!get(cx,Math.floor(0.6/VS),cz)&&!get(cx,Math.floor(1.2/VS),cz)){ s.cx=nx; s.cz=nz; } s.walk=(s.walk||0)+dt*Math.hypot(mvx,mvz)*2.4; s.g.rotation.y+=wrapA(Math.atan2(mvx,mvz)-s.g.rotation.y)*Math.min(1,dt*10); }
    else { let ty=s.base; if(d<15) ty=Math.atan2(dx,dz); s.g.rotation.y+=wrapA(ty-s.g.rotation.y)*Math.min(1,dt*3); }
    const mv=!!(mvx||mvz); s.amp+=((mv?1:0)-s.amp)*Math.min(1,dt*8); const bob=s.L?gaitPose(s.L,s.walk||0,s.amp):0; s.g.position.set(s.cx,bob+Math.sin(t*1.6+s.ph)*0.012,s.cz);
    const moving=!!(mvx||mvz); const sal=!moving&&d<7.5?1:0; s.armR.rotation.x+=((sal?-2.55:(moving?Math.sin(s.walk)*0.7:0))-s.armR.rotation.x)*Math.min(1,dt*8); s.armR.rotation.z+=((sal?0.5:0)-s.armR.rotation.z)*Math.min(1,dt*5); } }

/* ================= PERFORMANCE: instanced lamps, vehicle details, shadows; dynamic resolution ================= */
const LAMPV={halo:null,pool:null,q:new THREE.Quaternion(1,1,1,1)};
const haloGeo=new THREE.PlaneGeometry(1,1);
const _lm=new THREE.Matrix4(), _lq=new THREE.Quaternion(), _lp3=new THREE.Vector3(), _ls=new THREE.Vector3(), _q0=new THREE.Quaternion(), _lc=new THREE.Color();
function lampVisDispose(){ for(const k of ['halo','pool']){ const m=LAMPV[k]; if(m){ scene.remove(m); m.material.dispose(); LAMPV[k]=null; } } }
function makeLampVisuals(){ lampVisDispose(); const n=LAMPS.length; if(!n) return; let pi=0; LAMPS.forEach((l,i)=>{ l.hi=i; l.pi=l.pool!==false?pi++:-1; l.alive=true; });
  const hm=new THREE.InstancedMesh(haloGeo,new THREE.MeshBasicMaterial({map:TEX_R,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0.55}),n); hm.frustumCulled=false; hm.renderOrder=5; LAMPV.halo=hm; scene.add(hm);
  if(pi){ const pm=new THREE.InstancedMesh(poolGeo,new THREE.MeshBasicMaterial({map:TEX_SOFT,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0.3}),pi); pm.frustumCulled=false; LAMPV.pool=pm; scene.add(pm); }
  lampMatrices(); lampColors(); }
function lampMatrices(){ const hm=LAMPV.halo, pm=LAMPV.pool; if(!hm) return; _lq.copy(camera.quaternion);
  for(const l of LAMPS){ const s=l.alive?l.size:0; _lm.compose(_lp3.set(l.x,l.y,l.z),_lq,_ls.set(s,s,s)); hm.setMatrixAt(l.hi,_lm);
    if(pm&&l.pi>=0){ const r=l.alive?l.r*2:0; _lm.compose(_lp3.set(l.x,0.03,l.z),_q0,_ls.set(r,1,r)); pm.setMatrixAt(l.pi,_lm); } }
  hm.instanceMatrix.needsUpdate=true; if(pm) pm.instanceMatrix.needsUpdate=true; LAMPV.q.copy(camera.quaternion); }
function lampColors(){ const hm=LAMPV.halo, pm=LAMPV.pool; if(!hm) return; for(const l of LAMPS){ if(l.rgb) _lc.setRGB(l.rgb[0],l.rgb[1],l.rgb[2]); else _lc.set(PALETTES[PAL][l.col]); hm.setColorAt(l.hi,_lc); if(pm&&l.pi>=0) pm.setColorAt(l.pi,_lc); } hm.instanceColor.needsUpdate=true; if(pm) pm.instanceColor.needsUpdate=true; }
function lampsFrame(){ if(LAMPV.halo&&!LAMPV.q.equals(camera.quaternion)) lampMatrices(); }
function checkLamps(){ let ch=false; for(const l of LAMPS){ if(!l.alive) continue; const cx=Math.floor(l.x/VS), cy=Math.floor(l.y/VS), cz=Math.floor(l.z/VS); let ok=false;
    for(let y=cy-1;y<=cy+1&&!ok;y++)for(let z=cz-1;z<=cz+1&&!ok;z++)for(let x=cx-1;x<=cx+1;x++){ const m=get(x,y,z); if(m===M.LAMP||m===M.NEON||m===M.LANT||m===M.BILL||(l.tl!=null&&m)){ok=true;break;} }
    if(!ok){ l.alive=false; ch=true; } } if(ch) lampMatrices(); }

/* vehicles: every (geometry, material) pair is one InstancedMesh for the whole district */
const VINST=[], _vo=new THREE.Object3D(), _zero=new THREE.Matrix4().makeScale(0,0,0);
function vehInstAll(){ for(const im of VINST) scene.remove(im); VINST.length=0; const groups=new Map();
  for(const v of VEHS) for(const p of v.parts){ const k=p.geo.uuid+'|'+p.mat.uuid; let g=groups.get(k); if(!g){ g=[]; groups.set(k,g); } g.push(p); }
  for(const list of groups.values()){ const im=new THREE.InstancedMesh(list[0].geo,list[0].mat,list.length); im.frustumCulled=false; list.forEach((p,i)=>{ p.inst=im; p.idx=i; }); VINST.push(im); scene.add(im); }
  for(const v of VEHS) vehLod(v); }
function vehLod(v){ for(const p of v.parts){ if(!p.inst) continue; p.inst.setMatrixAt(p.idx,(!p.dead&&p.tier<=CAR_LOD)?p.mtx:_zero); p.inst.instanceMatrix.needsUpdate=true; } }
function vehGib(p,vx,vy,vz,w){ const m=new THREE.Mesh(p.geo,p.mat); p.mtx.decompose(m.position,m.quaternion,m.scale); scene.add(m); EXTRAS.push(m); GIBS.push(gibOf(m,vx,vy,vz,w)); }
function vehsCheck(){ for(const v of VEHS){ if(!v.built) continue; let ch=false;
    if(v.car&&v.car.dead&&!v.thrown){ v.thrown=true; for(const p of v.parts){ if(p.dead) continue; p.dead=true; if(p.tier<=CAR_LOD&&rnd()<0.65) vehGib(p,(p.px-v.x)*4+(rnd()-0.5)*6,5+rnd()*6,(p.pz-v.z)*4+(rnd()-0.5)*6,14); } vehLod(v); continue; }
    for(const p of v.parts){ if(p.dead) continue; let ok=false; for(let dy=-1;dy<=1&&!ok;dy++) for(let dz=-1;dz<=1&&!ok;dz++) for(let dx=-1;dx<=1;dx++) if(get(p.ax+dx,p.ay+dy,p.az+dz)){ ok=true; break; }
      if(!ok){ p.dead=true; ch=true; if(p.tier<=CAR_LOD&&rnd()<0.7) vehGib(p,(rnd()-0.5)*5,3+rnd()*4,(rnd()-0.5)*5,10); } }
    if(ch) vehLod(v); } }

/* blob shadows: one instanced draw for everything */
const SHP={n:0,max:128,mesh:null,alpha:null};
(function(){ const g=poolGeo.clone(), a=new THREE.InstancedBufferAttribute(new Float32Array(SHP.max),1); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute('ia',a); SHP.alpha=a;
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{map:{value:TEX_SOFT}},
    vertexShader:'attribute float ia;varying float vA;varying vec2 vUv;void main(){vA=ia;vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform sampler2D map;varying float vA;varying vec2 vUv;void main(){float a=texture2D(map,vUv).a*vA;if(a<0.004)discard;gl_FragColor=vec4(0.0,0.0,0.0,a);}'});
  SHP.mesh=new THREE.InstancedMesh(g,mat,SHP.max); SHP.mesh.frustumCulled=false; SHP.mesh.renderOrder=1; SHP.mesh.count=0; scene.add(SHP.mesh); })();
const _sq=new THREE.Quaternion(), _sy=new THREE.Vector3(0,1,0);
function shadowsBegin(){ SHP.n=0; }
function shadowAdd(x,z,size,h,base){ if(SHP.n>=SHP.max||REALSH) return; const gy=groundH(x,z), L=shadowLight(x,z), I=Math.min(1.6,L[2]), lm=Math.hypot(L[0],L[1]), st=Math.min(1.4,lm)*(0.6+Math.min(2.5,Math.max(0,h))*0.35);
  const ox=lm>1e-3?L[0]/lm*st*size*0.45:0, oz=lm>1e-3?L[1]/lm*st*size*0.45:0, hs=1+Math.max(0,h)*0.12;
  _sq.setFromAxisAngle(_sy,lm>1e-3?Math.atan2(L[0],L[1]):0); _lm.compose(_lp3.set(x+ox,gy+0.04,z+oz),_sq,_ls.set(size*hs,1,size*hs*(1+st*0.9)));
  SHP.mesh.setMatrixAt(SHP.n,_lm); SHP.alpha.array[SHP.n]=clamp(((base||0.45)+I*0.22)/(1+Math.max(0,h)*0.35),0.08,0.82); SHP.n++; }
function shadowsEnd(){ SHP.mesh.count=SHP.n; SHP.mesh.instanceMatrix.needsUpdate=true; SHP.alpha.needsUpdate=true; }
function enemyShadows(){ for(const e of ENEMIES){ if(e.dead||e.xhide||e.g.visible===false) continue; const s=e.type==='xfmr'?4.2:e.type==='crypt'?(e.mode==='fly'?3.6:5.2):e.type==='hornet'?9:e.type==='krot'?8:e.type==='lion'?3.4:e.type==='dragon'?3.2:e.type==='dseg'?2.4:e.type==='wisp'?1.0:e.type==='factory'?6.4:e.type==='katok'?5.2:e.type==='hive'?5.2:e.type==='bull'?3.6:e.type==='lamp'?2.2:e.type==='bomb'?1.3:2.2;
    shadowAdd(e.x,e.z,s,e.y-groundH(e.x,e.z)-(e.wc?e.wc.bodyH:0),0.42); }
  for(const d of DRONES) if(!d.dead) shadowAdd(d.x,d.z,1.2,d.y-groundH(d.x,d.z),0.4); }

/* dynamic resolution: trade pixels for frame time, smoothly */
const DYN={scale:1,t:0,base:1};
function setBasePR(pr){ DYN.base=pr; renderer.setPixelRatio(pr*DYN.scale); }
function dynResUpdate(rdt){ DYN.t+=rdt; if(DYN.t<1.0) return; DYN.t=0; let s=DYN.scale;
  if(fpsS<44&&s>0.55) s=Math.max(0.55,s-0.1); else if(fpsS>57&&s<1) s=Math.min(1,s+0.05); if(Math.abs(s-DYN.scale)>1e-3){ DYN.scale=s; renderer.setPixelRatio(DYN.base*s); } }

