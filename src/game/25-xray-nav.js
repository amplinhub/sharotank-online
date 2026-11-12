/* ================= X-RAY: see the tank through buildings ================= */
const _xv=new THREE.Vector3(); let xrK=0;
function xrayUpdate(dt){ let occ=false; const cp=camera.position;
  for(const oy of [0.6,1.6]){ const dx=TK.x-cp.x, dy=TK.y+oy-cp.y, dz=TK.z-cp.z, L=Math.hypot(dx,dy,dz); if(raycast(cp.x,cp.y,cp.z,dx/L,dy/L,dz/L,L-1.7)&&RH.hit===1){ occ=true; break; } }
  xrK+=((occ?1:0)-xrK)*Math.min(1,dt*(occ?9:4)); if(xrK<0.02){ XR.r.value=0; return; }
  const pr=renderer.getPixelRatio(), a=toScreen(TK.x,TK.y+1.2,TK.z), b=toScreen(TK.x+6.8,TK.y+1.2,TK.z);
  XR.p.value.set(a[0]*pr,(innerHeight-a[1])*pr); XR.r.value=Math.abs(b[0]-a[0])*pr*(0.35+0.65*xrK);
  _xv.set(TK.x,TK.y+1.2,TK.z).applyMatrix4(camera.matrixWorldInverse); XR.z.value=-_xv.z; }
/* enemies the tank can see directly but the camera can't: their own see-through circle */
const XRE={t:0,list:[],k:[0,0,0,0],clock:0};
function xrayEnemies(dt){ XRE.t-=dt; XRE.clock+=dt; const cp=camera.position;
  if(XRE.t<=0){ XRE.t=0.2; const c=[]; if(!LOC.safe&&!transit&&!TK.dead) for(const e of ENEMIES){ if(e.dead||e.xhide) continue; const d=Math.hypot(e.x-TK.x,e.z-TK.z); if(d>42) continue; const ey=(e.y||groundH(e.x,e.z))+(e.hy||0.8);
      const dx=e.x-cp.x, dy=ey-cp.y, dz=e.z-cp.z, L=Math.hypot(dx,dy,dz); const occ=raycast(cp.x,cp.y,cp.z,dx/L,dy/L,dz/L,L-1.4)&&RH.hit===1;
      if(occ&&losClear(TK.x,TK.y+1.4,TK.z,e.x,ey,e.z)) e.xrL=XRE.clock; if(!(e.xrL!=null&&XRE.clock-e.xrL<=1.0)) continue; c.push([d,e]); } c.sort((a,b)=>a[0]-b[0]); XRE.list=c.slice(0,4).map(v=>v[1]); }
  const pr=renderer.getPixelRatio();
  for(let i=0;i<4;i++){ const e=XRE.list[i], q=XR.e.value[i]; const on=!!e&&!e.dead; XRE.k[i]+=((on?1:0)-XRE.k[i])*Math.min(1,dt*(on?8:5)); if(!on&&XRE.k[i]<0.03){ q.set(0,0,0,0); continue; } if(!e){ q.z*=0.8; continue; }
    const ey=(e.y||groundH(e.x,e.z))+(e.hy||0.8), a=toScreen(e.x,ey,e.z), b=toScreen(e.x+(e.xrR||3.6),ey,e.z); _xv.set(e.x,ey,e.z).applyMatrix4(camera.matrixWorldInverse);
    q.set(a[0]*pr,(innerHeight-a[1])*pr,Math.abs(b[0]-a[0])*pr*XRE.k[i],-_xv.z); } }

/* ================= NAV GRID · A* · PERCEPTION · PATROL ================= */
let NAVN=80; const NAV={block:new Uint8Array(NAVN*NAVN),dist:new Float32Array(NAVN*NAVN),stamp:-1,t:0};
function navBuild(){ const b=NAV.block; b.fill(0); const y0=Math.max(0,Math.floor(0.3/VS)), y1=Math.max(y0,Math.floor(1.25/VS));
  for(let y=y0;y<=y1;y++) for(let z=0;z<NZ;z++){ const row=NX*(z+NZ*y), cz=Math.min(NAVN-1,Math.floor((z+0.5)*VS)); for(let x=0;x<NX;x++) if(grid[row+x]) b[cz*NAVN+Math.min(NAVN-1,Math.floor((x+0.5)*VS))]=1; }
  for(let k=0;k<NAVN;k++){ b[k]=b[(NAVN-1)*NAVN+k]=b[k*NAVN]=b[k*NAVN+NAVN-1]=1; }
  const d=NAV.dist; for(let i=0;i<d.length;i++) d[i]=b[i]?0:1e4; const S=Math.SQRT2;
  for(let j=0;j<NAVN;j++) for(let i=0;i<NAVN;i++){ const k=j*NAVN+i; let v=d[k]; if(!v) continue; if(i>0) v=Math.min(v,d[k-1]+1); if(j>0){ v=Math.min(v,d[k-NAVN]+1); if(i>0) v=Math.min(v,d[k-NAVN-1]+S); if(i<NAVN-1) v=Math.min(v,d[k-NAVN+1]+S); } d[k]=v; }
  for(let j=NAVN-1;j>=0;j--) for(let i=NAVN-1;i>=0;i--){ const k=j*NAVN+i; let v=d[k]; if(!v) continue; if(i<NAVN-1) v=Math.min(v,d[k+1]+1); if(j<NAVN-1){ v=Math.min(v,d[k+NAVN]+1); if(i<NAVN-1) v=Math.min(v,d[k+NAVN+1]+S); if(i>0) v=Math.min(v,d[k+NAVN-1]+S); } d[k]=v; }
  NAV.stamp=destroyed; }
function navUpdate(dt){ NAV.t-=dt; if(NAV.stamp!==destroyed&&NAV.t<=0){ NAV.t=1.2; navBuild(); } }
const navOk=(i,j,r)=>i>0&&j>0&&i<NAVN-1&&j<NAVN-1&&NAV.dist[j*NAVN+i]>=r+0.45;
function navClear(ax,az,bx,bz,r){ const L=Math.hypot(bx-ax,bz-az), n=Math.ceil(L/0.5); for(let k=1;k<n;k++){ const t=k/n; if(!navOk(Math.floor(ax+(bx-ax)*t),Math.floor(az+(bz-az)*t),r)) return false; } return true; }
const NH={g:new Float32Array(NAVN*NAVN),from:new Int32Array(NAVN*NAVN),seen:new Uint16Array(NAVN*NAVN),gen:0,heap:new Int32Array(NAVN*NAVN*4),hf:new Float32Array(NAVN*NAVN*4)};
function navNear(i,j,r){ if(navOk(i,j,r)) return [i,j]; for(let R=1;R<6;R++) for(let dj=-R;dj<=R;dj++) for(let di=-R;di<=R;di++){ if(Math.max(Math.abs(di),Math.abs(dj))!==R) continue; if(navOk(i+di,j+dj,r)) return [i+di,j+dj]; } return null; }
function navPath(sx,sz,tx,tz,r){ const s=navNear(Math.floor(sx),Math.floor(sz),r), t=navNear(Math.floor(tx),Math.floor(tz),r); if(!s||!t) return null;
  const H=NH; if(++H.gen>65000){ H.gen=1; H.seen.fill(0); } const gen=H.gen, si=s[1]*NAVN+s[0], ti=t[1]*NAVN+t[0]; let hn=0;
  const push=(k,f)=>{ let i=hn++; while(i>0){ const p=(i-1)>>1; if(H.hf[p]<=f) break; H.heap[i]=H.heap[p]; H.hf[i]=H.hf[p]; i=p; } H.heap[i]=k; H.hf[i]=f; };
  const pop=()=>{ const top=H.heap[0], k=H.heap[--hn], f=H.hf[hn]; let i=0; while(true){ let c=2*i+1; if(c>=hn) break; if(c+1<hn&&H.hf[c+1]<H.hf[c]) c++; if(H.hf[c]>=f) break; H.heap[i]=H.heap[c]; H.hf[i]=H.hf[c]; i=c; } H.heap[i]=k; H.hf[i]=f; return top; };
  const hx=(k)=>{ const dx=Math.abs(k%NAVN-t[0]), dz=Math.abs(((k/NAVN)|0)-t[1]); return Math.max(dx,dz)+0.414*Math.min(dx,dz); };
  H.seen[si]=gen; H.g[si]=0; H.from[si]=-1; push(si,hx(si)); let n=0, found=false;
  while(hn&&n++<(NAVN>100?12000:3200)){ const k=pop(); if(k===ti){ found=true; break; } const i=k%NAVN, j=(k/NAVN)|0, g0=H.g[k];
    for(let dj=-1;dj<=1;dj++) for(let di=-1;di<=1;di++){ if(!di&&!dj) continue; const ni=i+di, nj=j+dj; if(!navOk(ni,nj,r)) continue; if(di&&dj&&(!navOk(i+di,j,r)||!navOk(i,j+dj,r))) continue;
      const nk=nj*NAVN+ni, ng=g0+(di&&dj?1.414:1)+Math.max(0,2-NAV.dist[nk])*0.6; if(H.seen[nk]===gen&&H.g[nk]<=ng) continue; H.seen[nk]=gen; H.g[nk]=ng; H.from[nk]=k; push(nk,ng+hx(nk)); } }
  if(!found) return null; const pts=[]; for(let k=ti;k!==-1;k=H.from[k]) pts.push([(k%NAVN)+0.5,((k/NAVN)|0)+0.5]); pts.reverse();
  const out=[pts[0]]; let a=0; for(let k=2;k<pts.length;k++){ if(!navClear(pts[a][0],pts[a][1],pts[k][0],pts[k][1],r)){ out.push(pts[k-1]); a=k-1; } } out.push([tx,tz]); return out; }
function navMove(e,tx,tz,spd,dt){ e.pathT=(e.pathT||0)-dt; const r=e.navR||Math.min(e.r,1.6);
  if(navClear(e.x,e.z,tx,tz,r*0.8)){ e.path=null; eMove(e,tx,tz,spd,dt); return 1; }
  if(!e.path||e.pathT<=0||Math.hypot((e.pathTo?e.pathTo.x:0)-tx,(e.pathTo?e.pathTo.z:0)-tz)>3){ e.pathT=0.7+rnd()*0.4; e.path=navPath(e.x,e.z,tx,tz,r*0.8); e.pi=1; e.pathTo={x:tx,z:tz}; }
  if(e.path&&e.pi<e.path.length){ let w=e.path[e.pi]; while(e.pi<e.path.length-1&&(Math.hypot(w[0]-e.x,w[1]-e.z)<1.3||navClear(e.x,e.z,e.path[e.pi+1][0],e.path[e.pi+1][1],r*0.8))){ e.pi++; w=e.path[e.pi]; } eMove(e,w[0],w[1],spd,dt); return 2; }
  eMove(e,tx,tz,spd,dt); return 0; }
/* perception: sees the tank (range + line of sight), remembers where, loses interest after a while */
function ePerceive(e,dt,range,eyeY){ e.seeT=(e.seeT||0)-dt; const d=Math.hypot(TK.x-e.x,TK.z-e.z);
  if(e.seeT<=0){ e.seeT=0.25+rnd()*0.1; const was=e.sees; e.sees=!TK.dead&&d<(STL.on?Math.min(range,STL_R[UP.abl|0]):range)&&losClear(e.x,e.y+(eyeY||0.5),e.z,TK.x,TK.y+1.4,TK.z); if(e.sees&&!was&&STL.on) stealthSpotted(); }
  if(e.sees||(e.hurtT>2.6)){ e.aggro=true; e.lostT=0; e.last={x:TK.x,z:TK.z}; } else if(e.aggro){ e.lostT=(e.lostT||0)+dt; if(e.lostT>6){ e.aggro=false; e.wp=null; } }
  return e.sees; }
function ePatrol(e,dt,spd){ e.wpT=(e.wpT||0)-dt;
  if(e.last&&!e.aggro&&(e.lostT||0)<12&&Math.hypot(e.last.x-e.x,e.last.z-e.z)>2){ navMove(e,e.last.x,e.last.z,spd*1.3,dt); if(Math.hypot(e.last.x-e.x,e.last.z-e.z)<2.5) e.last=null; return; }
  if(!e.wp||e.wpT<=0||Math.hypot(e.wp.x-e.x,e.wp.z-e.z)<1.6){ e.wpT=8+rnd()*6; e.wp=null; for(let k=0;k<14&&!e.wp;k++){ const a=rnd()*TAU, rr=5+rnd()*14, x=clamp(e.home.x+Math.cos(a)*rr,4,WX-4), z=clamp(e.home.z+Math.sin(a)*rr,4,WZ-4); if(navOk(Math.floor(x),Math.floor(z),e.r*0.8)) e.wp={x,z}; } if(!e.wp) e.wp={x:e.home.x,z:e.home.z}; e.pause=rnd()<0.4?0.8+rnd()*1.6:0; }
  if(e.pause>0){ e.pause-=dt; eBrake(e,dt,5); return; } navMove(e,e.wp.x,e.wp.z,spd,dt); }
/* stuck detector: no progress while trying to move */
function eStuck(e,dt){ e.stk=e.stk||{x:e.x,z:e.z,t:0}; const s=e.stk; s.t+=dt; if(s.t>1.1){ const m=Math.hypot(e.x-s.x,e.z-s.z); s.x=e.x; s.z=e.z; s.t=0; return m<0.35&&Math.hypot(e.vx,e.vz)>0.3; } return false; }
/* random spawn placement away from the entry gate */
let ENTRY={x:40,z:78};
function pickSpawn(t,r,taken){ const lampPos=t==='lamp'?LAMPS.filter(l=>l.col==='lamp'&&l.y>4):null;
  for(let k=0;k<90;k++){ let x,z; if(lampPos&&lampPos.length&&k<50){ const l=lampPos[(rnd()*lampPos.length)|0], a=rnd()*TAU; x=l.x+Math.cos(a)*2.2; z=l.z+Math.sin(a)*2.2; } else { x=6+rnd()*(WX-12); z=6+rnd()*(WZ-12); }
    if(Math.hypot(x-ENTRY.x,z-ENTRY.z)<(k<70?32:22)) continue; if(inWater(x,z)) continue; if(taken.some(p=>Math.hypot(p[0]-x,p[1]-z)<p[2]+r+2)) continue;
    if(!eFree(x,z,r)||indoor(x,z)) continue; if(!navOk(Math.floor(x),Math.floor(z),Math.min(r,t==='katok'?2.4:1.6)*0.8)) continue; return [x,z]; }
  return null; }

/* ================= TRANSITION FIELDS (drive in, the bar fills, you leave) ================= */
const GATES=[], GATE_FILL=1.15;
const GATE_RECT={N:[35,1.0,45,4.2],S:[35,75.8,45,79.0],W:[1.0,35,4.2,45],E:[75.8,35,79.0,45]}; /* re-sized by mapResize */
const GATE_ARROW={N:'↑',S:'↓',W:'←',E:'→'};
function buildGates(){ for(const g of GATES){ scene.remove(g.m); g.m.geometry.dispose(); g.tex.dispose(); g.m.material.dispose(); } GATES.length=0;
  for(const side in LOC.exits){ const id=LOC.exits[side], r=GATE_RECT[side], vert=side==='W'||side==='E', w=vert?r[3]-r[1]:r[2]-r[0], d=vert?r[2]-r[0]:r[3]-r[1], cv=document.createElement('canvas'); cv.width=512; cv.height=Math.round(512*d/w);
    const tex=new THREE.CanvasTexture(cv); tex.anisotropy=4; const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
    m.rotation.set(-Math.PI/2,0,side==='W'?Math.PI/2:side==='E'?-Math.PI/2:0); m.position.set((r[0]+r[2])/2,0.07,(r[1]+r[3])/2); m.renderOrder=3; scene.add(m);
    const g={side,id,r,w,d,cv,ctx:cv.getContext('2d'),tex,m,fill:0,drawn:-1,inside:false,armed:false,pop:0,hint:false,gc:groundColorAt((r[0]+r[2])/2,(r[1]+r[3])/2)}; GATES.push(g); drawGate(g); } }
function drawGate(g){ const c=g.ctx, W=g.cv.width, H=g.cv.height, L=LOCS[g.id], acc=g.hint?'#3dffb5':css(PALETTES[PAL].glow), gc=`rgb(${g.gc[0]*255|0},${g.gc[1]*255|0},${g.gc[2]*255|0})`;
  c.clearRect(0,0,W,H); c.fillStyle='rgba(6,12,26,0.42)'; c.fillRect(0,0,W,H);
  c.strokeStyle=acc; c.lineWidth=6; c.strokeRect(5,5,W-10,H-10); c.globalAlpha=0.25; c.lineWidth=2; for(let x=-H;x<W;x+=26){ c.beginPath(); c.moveTo(x,H-8); c.lineTo(x+18,H-26); c.stroke(); } c.globalAlpha=1;
  const f=g.fill, s=g.side; let fx=0,fy=0,fw=W,fh=H; if(s==='S'){ fh=H*f; } else { fh=H*f; fy=H-fh; }
  const text=()=>{ c.textAlign='center'; c.textBaseline='middle'; const t=`${s==='S'?'↓':'↑'}  ${L.ru.toUpperCase()}  ${s==='S'?'↓':'↑'}`; let fs=Math.round(H*0.42); c.font=`800 ${fs}px Unbounded, 'Arial Black', sans-serif`; while(c.measureText(t).width>W*0.9&&fs>10){ fs-=2; c.font=`800 ${fs}px Unbounded, 'Arial Black', sans-serif`; } c.fillText(t,W/2,H*0.54); };
  c.fillStyle=acc; text();
  if(f>0.002){ c.save(); c.beginPath(); c.rect(fx,fy,fw,fh); c.clip(); c.fillStyle=acc; c.fillRect(0,0,W,H); c.fillStyle=gc; text(); c.restore(); }
  g.tex.needsUpdate=true; g.drawn=f; }
function gatesUpdate(dt){ for(const g of GATES){ const r=g.r, ins=!TK.dead&&TK.x>r[0]&&TK.x<r[2]&&TK.z>r[1]&&TK.z<r[3];
    if(!ins) g.armed=true; if(ins&&!g.inside&&g.armed){ g.pop=1; sfxClick(); } g.inside=ins;
    if(ins&&g.armed&&!transit){ g.fill=Math.min(1,g.fill+dt/GATE_FILL); if(g.fill>=1){ g.fill=0; drawGate(g); goLocation(g.id,g.side); return; } } else g.fill=Math.max(0,g.fill-dt/0.5);
    g.pop=Math.max(0,g.pop-dt*3); const pk=g.pop>0?Math.sin((1-g.pop)*Math.PI)*(0.1*g.pop+0.02):0; g.m.scale.set(1+pk,1+pk,1); g.m.position.y=0.07+pk*1.2;
    const hint=!!(MTGT.gate&&MTGT.gate===g.side); if(hint!==g.hint){ g.hint=hint; g.drawn=-1; }
    if(Math.abs(g.fill-g.drawn)>0.012||(g.fill===0&&g.drawn!==0)) drawGate(g); } }

