/* ================= LOCATION LOADING ================= */
let ready=false;
/* ---- v23 street furniture: benches, bins, bollards, hydrants, planters, railings along the main roads of every district ---- */
function spotFree(x0,z0,x1,z1,h){ if(x0<3||z0<3||x1>WX-3||z1>WZ-3) return false; for(let x=c(x0);x<=c(x1);x++) for(let z=c(z0);z<=c(z1);z++){ if(inWater(x*VS,z*VS)) return false; for(let y=1;y<=c(h||1.4);y++) if(get(x,y,z)) return false; } return true; }
function benchZ(x,z){ box(x-0.22,0.42,z-0.85,x+0.22,0.55,z+0.85,M.FURN); box(x-0.24,0.55,z-0.85,x-0.1,1.0,z+0.85,M.FURN); box(x-0.18,0,z-0.75,x+0.18,0.42,z-0.6,M.METAL); box(x-0.18,0,z+0.6,x+0.18,0.42,z+0.75,M.METAL); }
function binAt(x,z){ cyl(x,z,0.28,0,0.85,M.METAL); cyl(x,z,0.32,0.85,0.95,M.DARK); }
function hydrant(x,z){ cyl(x,z,0.16,0,0.7,M.CRED); cyl(x,z,0.2,0.7,0.8,M.CRED); box(x-0.28,0.4,z-0.07,x+0.28,0.52,z+0.07,M.CRED); }
function planter(x,z,R){ box(x-0.6,0,z-0.6,x+0.6,0.55,z+0.6,M.WALL); sphere(x,0.95,z,0.6,R()<0.25?M.BLOS:M.LEAF,0.3); }
function bollards(x,z,vert){ for(const k of [-1,0,1]){ const bx=vert?x:x+k*1.2, bz=vert?z+k*1.2:z; cyl(bx,bz,0.13,0,0.85,M.METAL); box(bx-0.14,0.62,bz-0.14,bx+0.14,0.7,bz+0.14,M.LAMP); } }
function railing(x,z,len,vert){ for(let k=0;k<=len;k+=1.5){ const px=vert?x:x+k, pz=vert?z+k:z; box(px-0.07,0,pz-0.07,px+0.07,0.95,pz+0.07,M.METAL); }
  if(vert){ box(x-0.04,0.85,z,x+0.04,0.95,z+len,M.METAL); box(x-0.04,0.45,z,x+0.04,0.52,z+len,M.METAL); } else { box(x,0.85,z-0.04,x+len,0.95,z+0.04,M.METAL); box(x,0.45,z-0.04,x+len,0.52,z+0.04,M.METAL); } }
function picketFence(x,z,len,vert){ for(let k=0;k<=len;k+=0.5){ const px=vert?x:x+k, pz=vert?z+k:z; box(px-0.06,0,pz-0.06,px+0.06,0.75,pz+0.06,M.WOOD); } if(vert) box(x-0.03,0.45,z,x+0.03,0.55,z+len,M.WOOD); else box(x,0.45,z-0.03,x+len,0.55,z+0.03,M.WOOD); }
function vRoadHit(x,z,m){ return Math.abs(x-roadAt(z))<2.7+m||(z>37-m&&z<43+m); }
function streetDress(id,R){ if(id==='camp'||(LOCS[id]&&LOCS[id].size>80)) return; const rural=id==='south', seq=rural?['fence','bench','planter','fence','bin']:['bench','bin','planter','hydrant','bollards','bench','railing','bin'];
  let n=0; const tryPut=(x,z,vert,side)=>{ const kind=seq[n%seq.length]; let ok=false;
    if(rural){ const pts=[]; if(kind==='fence'||kind==='railing'){ for(let k=0;k<=4.5;k+=0.75) pts.push(vert?[x,z+k]:[x+k,z]); } else for(const [dx,dz] of [[0,0],[0.8,0],[-0.8,0],[0,0.8],[0,-0.8],[0.8,0.8],[-0.8,-0.8],[0.8,-0.8],[-0.8,0.8]]) pts.push([x+dx,z+dz]);
      if(pts.some(p=>vRoadHit(p[0],p[1],0.6))){ n++; return false; } }
    if(kind==='bench'){ ok=vert?spotFree(x-0.4,z-1.0,x+0.4,z+1.0):spotFree(x-1.0,z-0.4,x+1.0,z+0.4); if(ok){ if(vert) benchZ(x+side*0.05,z); else bench(x,z); } }
    else if(kind==='bin'){ ok=spotFree(x-0.4,z-0.4,x+0.4,z+0.4); if(ok) binAt(x,z); }
    else if(kind==='hydrant'){ ok=spotFree(x-0.35,z-0.35,x+0.35,z+0.35); if(ok) hydrant(x,z); }
    else if(kind==='planter'){ ok=spotFree(x-0.7,z-0.7,x+0.7,z+0.7,1.6); if(ok) planter(x,z,R); }
    else if(kind==='bollards'){ ok=vert?spotFree(x-0.2,z-1.4,x+0.2,z+1.4):spotFree(x-1.4,z-0.2,x+1.4,z+0.2); if(ok) bollards(x,z,vert); }
    else if(kind==='railing'||kind==='fence'){ ok=vert?spotFree(x-0.15,z-0.1,x+0.15,z+4.6):spotFree(x-0.1,z-0.15,x+4.6,z+0.15); if(ok){ if(kind==='fence') picketFence(x,z,4.5,vert); else railing(x,z,4.5,vert); } }
    n++; return ok; };
  for(const sd of [-1,1]){ const off=40+sd*6.7;
    for(let a=6;a<=74;a+=5.5){ if(Math.abs(a-40)<8.5) continue; tryPut(off,a+R()*0.8,true,sd); tryPut(a+R()*0.8,off,false,sd); } } }
function rebuild(q){ ready=false; Q=q; mapResize(LOC.size||80); bossFxClear(); ARENA.piles=[]; ARENA.panes=[]; ARENA.lions=null; ARENA.lair=null; ARENA.ring=null; shadowCfg(); const qq=QUALITY[q]; VS=qq.vs; WH=LOC.wh; NX=Math.round(WX/VS); NZ=Math.round(WZ/VS); NY=Math.round(WH/VS); grid=new Uint8Array(NX*NY*NZ);
  CS=q==='low'?24:q==='med'?32:40; CX=Math.ceil(NX/CS); CY=Math.ceil(NY/CS); CZ=Math.ceil(NZ/CS);
  if(chunks) for(const ch of chunks){ if(ch.mesh){ scene.remove(ch.mesh); ch.mesh.geometry.dispose(); } if(ch.smesh){ scene.remove(ch.smesh); ch.smesh=null; } }
  chunks=new Array(CX*CY*CZ); for(let i=0;i<chunks.length;i++){ const cy=Math.floor(i/(CX*CZ)), rem=i-cy*CX*CZ, cz=Math.floor(rem/CX), cx=rem-cz*CX;
    chunks[i]={mesh:null,sphere:new THREE.Sphere(new THREE.Vector3((cx+0.5)*CS*VS,(cy+0.5)*CS*VS,(cz+0.5)*CS*VS),CS*VS*0.87)}; }
  lampVisDispose(); LAMPS.length=0; CARS.length=0;
  for(const o of EXTRAS){ scene.remove(o); if(o.userData.water){ o.geometry.dispose(); o.material.dispose(); } } EXTRAS.length=0; SOLDIERS.length=0;
  ENEMIES.length=0; CRATES.length=0; AIM.manual=null; PICKUPS.length=0; GIBS.length=0; DRONES.length=0; FALLERS.length=0; DELAYS.length=0; AIM.lockE=null; XR.r.value=0; xrK=0; XRE.list=[]; for(const q of XR.e.value) q.set(0,0,0,0);
  while(rigids.length) removeRigid(rigids.length-1);
  for(const p of proj) freeProj(p); proj.length=0; rkQ=0;
  debInit(qq.debris); spkInit(qq.sparks);
  if(SMOKE){ scene.remove(SMOKE.mesh); scene.remove(FIRE.mesh); SMOKE.geo.dispose(); FIRE.geo.dispose(); }
  SMOKE=new Puffs(qq.puffs,false); FIRE=new Puffs(Math.round(qq.puffs*0.5),true);
  marks.length=0; destroyed=0; dirty.clear(); FLOORS.length=0; VEHS.length=0; tracksClear(); for(const m of TRINGS) m.visible=false;
  LOC.gen(mulberry32(7)); streetDress(LOC_ID,mulberry32(11)); for(const cr of CARS) cr.n0=carCount(cr); lastDestroyed=0;
  const st=LOC.safe?null:LOC_STATE[LOC_ID]; if(st&&st.Q===q){ grid=st.grid; st.cars.forEach((d,i)=>{ if(CARS[i]&&d) CARS[i].dead=true; }); }
  for(let i=0;i<chunks.length;i++) buildChunk(i); makeLampVisuals();
  for(const r of LOC.water){ const m=new THREE.Mesh(new THREE.PlaneGeometry(r[2]-r[0],r[3]-r[1]),new THREE.MeshBasicMaterial({color:0xffffff})); m.rotation.x=-Math.PI/2; m.position.set((r[0]+r[2])/2,-0.14,(r[1]+r[3])/2); m.userData.water=1; addExtra(m); }
  if(LOC_ID==='camp'){ for(const [x,z,ry] of SOLDIER_SPOTS){ const s=makeSoldier(x,z,ry,scene); EXTRAS.push(s.g); SOLDIERS.push(s); } }
  scene.fog.near=LOC.fog[0]; scene.fog.far=LOC.fog[1];
  initTerrain(); if(st){ HM.set(st.HM); hmUpdate(0,0,HN-1,HN-1); for(const m of st.marks) marks.push(m); }
  applyPalette(PAL); dirty.clear(); drawGround(); buildTrafficLights(!!(st&&st.Q===q));
  navBuild(); CAR_LOD=Q==='low'?1:2; for(const v of VEHS) vehBuild(v); vehInstAll(); buildGates(); campDecor(); lightsRefresh();
  if(!LOC.safe) spawnLocEnemies(st); holdBuild(); v9Build(); missionExtras(); missionEnsure();
  setBasePR(Math.min(window.devicePixelRatio||1,qq.dpr)); resize(); updateWhere(); ready=true; }
function goLocation(id,side,spawn){ if(transit) return; transit=true; const L=LOCS[id]; saveLocState(); if(mcOpen) closeMC();
  { const S_=L.size||80, c=S_/2; ENTRY=spawn?{x:spawn.x,z:spawn.z}:side==='N'?{x:c,z:S_-2}:side==='S'?{x:c,z:2}:side==='W'?{x:S_-2,z:c}:{x:2,z:c}; }
  $('#loadCn').textContent=window._ld1?L.ru:'Sharotank Online'; window._ld1=true; $('#loadRu').textContent=L.cn; $('#loadq').textContent='загрузка района'; fadeOn();
  const fromW=WX; setTimeout(()=>{ LOC=L; LOC_ID=id; try{ rebuild(Q); }catch(err){ $('#loadq').textContent='Ошибка: '+err.message; transit=false; throw err; }
    const sp=Math.hypot(TK.vx,TK.vz), vdir=Math.atan2(TK.vx,TK.vz);
    if(spawn){ Object.assign(TK,{x:spawn.x,z:spawn.z,h:spawn.h,tYaw:spawn.h,vx:0,vz:0}); }
    else { const c=WX/2, cc=v=>c+clamp(v-(fromW/2),-2.5,2.5); if(side==='N'){ TK.z=WZ-2.3; TK.x=cc(TK.x); } else if(side==='S'){ TK.z=2.3; TK.x=cc(TK.x); }
    else if(side==='W'){ TK.x=WX-2.3; TK.z=cc(TK.z); } else if(side==='E'){ TK.x=2.3; TK.z=cc(TK.z); } }
    if(!spawn&&sp>0){ TK.vx=Math.sin(vdir)*Math.min(sp,6); TK.vz=Math.cos(vdir)*Math.min(sp,6); }
    Object.assign(TK,{y:0,yV:0,pitch:0,roll:0,pitchV:0,rollV:0,aL:0,prevVF:0,ptgt:undefined,ptP:undefined,ptR:undefined}); camLook.set(TK.x,0,TK.z-2);
    CAMP_GARAGE.in=false; HQ.in=false;
    if(id==='camp'){ for(const k in LOC_STATE) delete LOC_STATE[k]; refillAmmo(); updateWeaponUI(); }
    $('#load').hidden=true; transit=false; banner(L); save(); fadeOff(); },190); }
function zonesUpdate(){ if(LOC_ID!=='camp') return; const z=CAMP_GARAGE; const inside=TK.x>z.x0&&TK.x<z.x1&&TK.z>z.z0&&TK.z<z.z1; if(inside&&!z.in){ z.in=true; openGarage(); } else if(!inside) z.in=false; }

