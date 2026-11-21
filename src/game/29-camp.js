/* ================= TOUCH TARGETING ================= */
function pickEnemyAt(x,y){ let best=null,bd=1e9;
  for(const e of ENEMIES){ if(e.dead||!e.lockable||e.state==='fly') continue; const s=toScreen(e.x,e.y+e.hy,e.z); if(!s[2]) continue; const d=Math.hypot(s[0]-x,s[1]-y), lim=46+(e.hr||0.6)*24; if(d<lim&&d<bd){ bd=d; best=e; } }
  for(const dr of DRONES){ if(dr.dead) continue; const s=toScreen(dr.x,dr.y,dr.z); if(!s[2]) continue; const d=Math.hypot(s[0]-x,s[1]-y); if(d<40&&d<bd){ bd=d; best=dr; } }
  return best; }
const tapEl=$('#tap');
function tapFx(x,y,on){ tapEl.className=on?'on':'off'; tapEl.style.transform=`translate(${x}px,${y}px)`; tapEl.hidden=false; void tapEl.offsetWidth; tapEl.classList.add('go'); clearTimeout(tapFx.t); tapFx.t=setTimeout(()=>{ tapEl.hidden=true; },450); }
function touchAim(e){ if(LOC.safe||TK.dead||transit) return; aimMode='stick'; aimActivity(); const t=pickEnemyAt(e.clientX,e.clientY);
  if(t){ AIM.manual=t; tapFx(e.clientX,e.clientY,true); sfxClick(); } else { if(AIM.manual) toast('Наводка сброшена · ближайшая цель'); AIM.manual=null; tapFx(e.clientX,e.clientY,false); } }

/* ================= CAMP: interaction pads, signs, routes ================= */
const CAMP_PADS=[{x0:10.2,z0:24.6,x1:19.8,z1:29.6,t:'ГАРАЖ',s:'ремонт · апгрейды',dir:'N'},{x0:60.6,z0:31.6,x1:70.4,z1:35.0,t:'ШТАБ',s:'задания',dir:'N'},{x0:12,z0:60.6,x1:24,z1:66,t:'АВТОПАРК',s:'смена танка',dir:'W'}];
const CAMP_PARK={x0:12,z0:60.6,x1:24,z1:66,in:false};
const SIGNS=[];
const CDK={g:null,aa:null,beacons:[],t:0,fire:0};
const CDM={};
function cdMat(k,c,glow){ return CDM[k]||(CDM[k]=glow?new THREE.MeshBasicMaterial({color:c}):new THREE.MeshToonMaterial({color:c,gradientMap:gradTex})); }
const CDG={box:new THREE.BoxGeometry(1,1,1),cyl:new THREE.CylinderGeometry(0.5,0.5,1,14),cyl6:new THREE.CylinderGeometry(0.5,0.5,1,8),sph:new THREE.SphereGeometry(0.5,20,14),dish:new THREE.SphereGeometry(0.5,16,8,0,TAU,0,1.0),tor:new THREE.TorusGeometry(0.5,0.06,6,24)};
function cdP(par,geo,mat,x,y,z,sx,sy,sz,ol,rx,ry,rz){ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.scale.set(sx,sy==null?sx:sy,sz==null?sx:sz); if(rx||ry||rz) m.rotation.set(rx||0,ry||0,rz||0); par.add(m);
  if(ol){ const o=new THREE.Mesh(geo,outlineMat); o.scale.setScalar(1.06); m.add(o); } return m; }
function bendUpdate(dt){ dt=Math.min(dt,0.05); for(const b of CDK.bend){ const dx=b.x-TK.x, dz=b.z-TK.z, d=Math.hypot(dx,dz)||1e-3; let tx=0, tz=0; const near=d<b.R+1.4&&!TK.dead;
    if(near){ const k=clamp((b.R+1.4-d)/(b.R+0.4),0,1)*b.max; tx=dx/d*k; tz=dz/d*k; if(b.sh>2&&d<1.9){ const sl=Math.exp(-dt*1.6*(1-d/1.9)); TK.vx*=sl; TK.vz*=sl; } /* v30.12: the tank rolls over a tree (it bends away) but is held back a little */ if(!b.hit&&k>0.25){ b.hit=true; sNz(0.3,'bandpass',1800,0.6,0.05); for(let i=0;i<5;i++) debSpawn(b.x,0.6+rnd()*1.5,b.z,(rnd()-0.5)*3,1+rnd()*2,(rnd()-0.5)*3,P.foliage[0],P.foliage[1],P.foliage[2],0.08+rnd()*0.06); } } else b.hit=false;
    const kk=near?60:14, cc=near?12:2.6; b.vx+=((tx-b.ax)*kk-b.vx*cc)*dt; b.vz+=((tz-b.az)*kk-b.vz*cc)*dt; b.ax+=b.vx*dt; b.az+=b.vz*dt; b.g.rotation.set(b.az,0,-b.ax); } }
function campDecoClear(){ CDK.push=null; CDK.shG=null; CDK.lights=null; CDK.gen=null; if(CDK.fleet){ for(const T of CDK.fleet) disposeTank(T); CDK.fleet=null; } if(CDK.g){ scene.remove(CDK.g); CDK.g.traverse(o=>{ if(o.isMesh&&o.userData.own) o.geometry.dispose(); }); } CDK.g=null; CDK.aa=null; CDK.bend=null; CDK.sock=null; CDK.term=null; CDK.beacons.length=0; }
function campDecoBuild(){ campDecoClear(); if(LOC_ID!=='camp') return; const tier=Q==='low'?0:Q==='med'?1:2, G=new THREE.Group(); CDK.g=G; scene.add(G);
  const W=cdMat('w',0xd9d6cc), Gy=cdMat('g',0x5c656e), D=cdMat('d',0x22282e), A=cdMat('a',0x4f6b58), Y=cdMat('y',0xffb53a), R=cdMat('r',0xff3b30,true), Bl=cdMat('b',0x6fd0ff,true), Cu=cdMat('cu',0xb87a3a);
  const x0=59, z0=25, h=3.6, top=h+5+1.9;
  /* --- helipad: windsock, light masts, edge lights, terminal (future network zone) --- */
  { const Or=cdMat('or',0xff7a1a), Wg=cdMat('wg',0x7dff9a,true), Bq=cdMat('bq',0x6fd0ff,true);
    cdP(G,CDG.cyl,Gy,68.4,2.2,55.8,0.1,4.4,0.1,true); cdP(G,CDG.box,D,68.4,0.1,55.8,0.5,0.2,0.5); const sk=new THREE.Group(); sk.position.set(68.4,4.3,55.8); G.add(sk); cdP(sk,CDG.tor,Gy,0,0,0.05,0.42,0.42,0.42,false,0,Math.PI/2,0);
    for(let k=0;k<5;k++){ const r=0.4-k*0.06; cdP(sk,new THREE.CylinderGeometry(r,r-0.06,0.36,10,1,true).rotateX(Math.PI/2),k%2?W:Or,0,0,-0.2-k*0.36,1,1,1); } CDK.sock=sk;
    for(const [x,z] of [[55.4,68.6],[68.6,68.6]]){ cdP(G,CDG.cyl,Gy,x,3.0,z,0.14,6,0.14,true); cdP(G,CDG.box,D,x,0.15,z,0.7,0.3,0.7); cdP(G,CDG.box,D,x,6.05,z,1.2,0.12,0.3); for(const s_ of [-1,1]){ cdP(G,CDG.box,D,x+s_*0.4,5.85,z-0.18,0.36,0.3,0.24,true); cdP(G,CDG.box,cdMat('lw',0xfff2d2,true),x+s_*0.4,5.82,z-0.31,0.3,0.22,0.02); } }
    for(let k=0;k<16;k++){ const a=k/16*TAU, x=62+Math.cos(a)*6.9, z=62+Math.sin(a)*6.9; cdP(G,CDG.cyl,D,x,0.08,z,0.16,0.16,0.16); const l=cdP(G,CDG.sph,k%4===0?Wg:Bq,x,0.2,z,0.13); if(k%4===0) CDK.beacons.push(l); }
    cdP(G,CDG.box,D,55.8,0.7,56.0,0.9,1.4,0.6,true); const sc=cdP(G,CDG.box,new THREE.MeshBasicMaterial({color:0x6fd0ff}),55.8,1.15,56.31,0.7,0.45,0.02); cdP(G,CDG.box,Gy,55.8,1.45,56.0,1.0,0.08,0.7); for(let k=0;k<3;k++) cdP(G,CDG.box,k===1?Wg:Y,55.55+k*0.25,0.75,56.31,0.12,0.08,0.02);
    cdP(G,CDG.cyl,Gy,55.3,2.2,55.7,0.04,1.8,0.04); cdP(G,CDG.dish,W,55.3,3.15,55.7,0.5,0.5,0.5,false,-0.9,0.6,0); CDK.term=sc; }
  /* --- flag with the stylised AMPLIN mark --- */
  { const cv=document.createElement('canvas'); cv.width=512; cv.height=300; const c=cv.getContext('2d'), acc=css(PALETTES[PAL].accent);
    c.fillStyle='#0b1220'; c.fillRect(0,0,512,300); c.fillStyle=acc; c.fillRect(0,0,512,14); c.fillRect(0,286,512,14); for(let k=0;k<12;k++){ c.beginPath(); c.moveTo(k*48,14); c.lineTo(k*48+20,14); c.lineTo(k*48+8,30); c.lineTo(k*48-12,30); c.fill(); }
    c.save(); c.translate(256,160); c.transform(1,0,-0.18,1,0,0); c.font="900 104px Unbounded, 'Arial Black', sans-serif"; c.textAlign='center'; c.textBaseline='middle'; c.lineJoin='round';
    c.lineWidth=14; c.strokeStyle='#05080f'; c.strokeText('AMPLIN',0,0); c.fillStyle=acc; c.fillText('AMPLIN',0,0); c.fillStyle='rgba(255,255,255,0.35)'; c.fillRect(-230,-6,460,4); c.restore();
    c.fillStyle='#eaf2ff'; c.font="700 26px 'IBM Plex Mono', monospace"; c.textAlign='center'; c.fillText('★ 7 · 营 ★',256,252);
    const tex=new THREE.CanvasTexture(cv); for(const sd of [1,-1]){ const fm=new THREE.Mesh(new THREE.PlaneGeometry(2.5,1.5),new THREE.MeshBasicMaterial({map:tex})); fm.position.set(48.85,8.15,30.5+sd*(VS*1.2+0.08)); if(sd<0){ fm.rotation.y=Math.PI; } fm.userData.own=true; G.add(fm); } }
  /* --- bendable trees and bushes: they bow away from the tank and spring back.
     v30.8: lit (toon) faceted crowns instead of flat glowing cubes, cast shadows; on «Выс» a tapered trunk with root flare, branches and a layered crown --- */
  { const fo=mix3(P.foliage,[0.2,0.42,0.24],0.38), tr=P.trunk, FM=[1.05,1.3,1.6].map((k,i)=>cdMat('fo'+i+PAL,new THREE.Color(Math.min(1,fo[0]*k),Math.min(1,fo[1]*k),Math.min(1,fo[2]*k)).getHex())), TM=cdMat('tr'+PAL,new THREE.Color(tr[0]*1.2,tr[1]*1.2,tr[2]*1.2).getHex()); CDK.bend=[]; CDK.shG=[];
    const ICO=CDG.ico||(CDG.ico=new THREE.IcosahedronGeometry(0.5,0)), DOD=CDG.dod||(CDG.dod=new THREE.DodecahedronGeometry(0.5,0)), TRK=CDG.trk||(CDG.trk=new THREE.CylinderGeometry(0.11,0.2,1,8)), BR=CDG.br||(CDG.br=new THREE.CylinderGeometry(0.035,0.07,1,6).translate(0,0.5,0));
    const mk=(x,z,kind,sd,free)=>{ if(!free){ const m=kind==='tree'?1.0:0.55; let ok=false; for(const r of LOC.lawns||[]) if(x>r[0]+m&&x<r[2]-m&&z>r[1]+m&&z<r[3]-m) ok=true; if(!ok) return; } const g=new THREE.Group(); g.position.set(x,0,z); G.add(g); const r=n=>{ sd=(sd*9301+49297)%233280; return sd/233280; };
      if(kind==='tree'){ const H=2.3+r()*0.6;
        cdP(g,TRK,TM,0,H/2,0,1.6,H,1.6);
        if(tier>=2){ for(let k=0;k<4;k++){ const a=k/4*TAU+r(); cdP(g,BR,TM,Math.cos(a)*0.18,0.05,Math.sin(a)*0.18,0.9,0.35,0.9,false,Math.sin(a)*1.2,0,-Math.cos(a)*1.2); }
          for(let k=0;k<3;k++){ const a=k/3*TAU+r()*0.8, b=cdP(g,BR,TM,0,H*(0.55+k*0.12),0,1,1.1,1); b.rotation.set(Math.sin(a)*0.95,0,-Math.cos(a)*0.95); } }
        const n=tier>=2?11:tier?7:5; for(let k=0;k<n;k++){ const lay=k/n, a=r()*TAU, rr=k?(0.45+r()*0.55)*(1-lay*0.35):0, s_=k?(0.95+r()*0.55)*(1-lay*0.3):1.75;
          cdP(g,k%3?ICO:DOD,FM[k===0?1:(r()*3)|0],Math.cos(a)*rr,H+0.35+lay*1.15+r()*0.25,Math.sin(a)*rr,s_*1.25,s_*1.05,s_*1.25,false,r()*1.5,r()*1.5,r()*1.5); } }
      else { const n=tier>=2?7:5; for(let k=0;k<n;k++){ const a=r()*TAU, rr=k?0.28+r()*0.38:0, s_=k?0.5+r()*0.32:0.85; cdP(g,ICO,FM[(r()*3)|0],Math.cos(a)*rr,s_*0.42+(k?0.05:0.1),Math.sin(a)*rr,s_*1.15,s_*0.9,s_*1.15,false,0,r()*1.5,0); } }
      CDK.shG.push(g); CDK.bend.push({g,x,z,R:kind==='tree'?1.9:1.35,max:kind==='tree'?1.05:1.3,ax:0,az:0,vx:0,vz:0,hit:false,sh:kind==='tree'?2.8:1.5}); };
    let sd=7; for(const [x,z] of [[30,30],[50,46],[30,49],[52,52]]) mk(x,z,'tree',sd+=13);
    for(const [x,z] of CAMP_TREES) mk(x,z,'tree',sd+=11,true); /* v30.3: where the lamp posts stood */
    /* v30.8: the bushes of the middle «lawn» (x 36.5–43.5) stood on the main road — gone */
    for(const [x,z] of [[48.5,48.5],[49.6,55],[51.2,59.8],[47.8,61],[24.2,27.2],[31.4,31.6],[25.8,31.8]]) mk(x,z,'bush',sd+=17); }
  campPushBuild(G,tier); if(tier>=2) campHiDetail(G);
  /* --- parked fleet: one of every tank --- */
  CDK.fleet=[]; for(const [id,fx,fz,fh] of FLEET){ const T=makeTank(tier>=2,Object.assign({},UP,perDefault(id),{tank:id,skin:TANK_SKIN})); const w=CHASSIS[id].w; T.cn.visible=w.includes(1); T.mg.visible=!w.includes(1)&&w.includes(0); T.root.position.set(fx,0,fz); T.root.rotation.y=fh; mergeStatic(T.root); G.add(T.root); T.root.updateMatrixWorld(true); T.U.rootInv.value.copy(T.root.matrixWorld).invert(); T.U.dmg.value.set(0,0,0,0); CDK.fleet.push(T); }
  /* --- AA turret on the control deck (always) --- */
  const aa=new THREE.Group(); aa.position.set(x0+9.5,top,z0+3.2); G.add(aa);
  cdP(aa,CDG.cyl,Gy,0,0.16,0,2.5,0.32,2.5,true); cdP(aa,CDG.cyl,D,0,0.36,0,2.1,0.1,2.1);
  for(let k=0;k<12;k++){ const a=k/12*TAU; cdP(aa,CDG.box,k%3?Gy:Y,Math.cos(a)*1.12,0.24,Math.sin(a)*1.12,0.22,0.14,0.14,false,0,-a,0); }
  const yaw=new THREE.Group(); yaw.position.y=0.42; aa.add(yaw); cdP(yaw,CDG.cyl,Gy,0,0.12,0,1.9,0.24,1.9,true);
  cdP(yaw,CDG.sph,W,0,0.95,0,1.7,1.7,1.7,true); cdP(yaw,CDG.tor,D,0,0.95,0,1.72,1.72,1.72,false,0,Math.PI/2,0); cdP(yaw,CDG.tor,D,0,0.95,0,1.72,1.72,1.72,false,Math.PI/2,0,0);
  for(const s of [-1,1]){ cdP(yaw,CDG.cyl,Gy,s*0.82,0.95,0,0.42,0.22,0.42,true,0,0,Math.PI/2); cdP(yaw,CDG.box,D,s*0.86,0.62,0.1,0.18,0.4,0.5); }
  cdP(yaw,CDG.box,D,0,1.2,0.62,0.7,0.5,0.4); cdP(yaw,CDG.box,Bl,0,1.28,0.83,0.42,0.1,0.02);
  const pit=new THREE.Group(); pit.position.set(0,0.9,0.35); yaw.add(pit);
  for(const [bx,by] of [[-0.3,-0.12],[0.3,-0.12],[0,0.22]]){ cdP(pit,CDG.cyl,D,bx,by,0.45,0.26,0.6,0.26,true,Math.PI/2); cdP(pit,CDG.cyl,Gy,bx,by,1.5,0.12,2.0,0.12,true,Math.PI/2); cdP(pit,CDG.cyl,D,bx,by,1.3,0.17,0.18,0.17,false,Math.PI/2); cdP(pit,CDG.cyl,D,bx,by,2.55,0.18,0.24,0.18,true,Math.PI/2); }
  CDK.aa={yaw,pit,a:-0.6,ta:0.8,hold:0}; CDK.flash=cdP(pit,CDG.sph,cdMat('fl',0xffd36a,true),0,0.05,2.8,0.01);
  if(tier>=1){ /* --- HQ: AC units, ducts, roof tanks, dish, rails --- */
    for(const [x,z,ry] of [[x0+11.75,z0+2.4,Math.PI/2],[x0+7.25,z0+3.8,-Math.PI/2]]){ const u=cdP(G,CDG.box,Gy,x,h+4.2,z,0.95,0.7,0.5,true,0,ry,0); cdP(u,CDG.cyl,D,0,0,0.52,0.6,0.08,0.6,false,Math.PI/2); }
    cdP(G,CDG.box,Gy,x0+11.78,h+2.4,z0+4.5,0.32,4.4,0.32,true); cdP(G,CDG.box,Gy,x0+11.78,h+0.25,z0+4.5,0.32,0.32,1.3,true);
    for(const k of [0,1]) cdP(G,CDG.cyl,W,x0+11.3,top+0.55,z0+4.6-k*0.9,0.7,1.1,0.7,true); cdP(G,CDG.box,Gy,x0+11.3,top+0.08,z0+4.15,0.9,0.16,2.0);
    const dish=new THREE.Group(); dish.position.set(x0+4.2,h+0.6,z0+1.6); G.add(dish); cdP(dish,CDG.cyl,Gy,0,0.4,0,0.12,0.8,0.12); const WD=cdMat('wd',0xd9d6cc); WD.side=THREE.DoubleSide; const dd=cdP(dish,CDG.dish,WD,0,1.0,0,1.5,1.5,1.5,true,-0.9,0.6,0); 
    for(let x=x0+0.2;x<=x0+13;x+=1.6) for(const z of [z0-0.2,z0+7.2]) cdP(G,CDG.box,Y,x,h+0.75,z,0.06,0.7,0.06); for(const z of [z0-0.2,z0+7.2]) cdP(G,CDG.box,Y,x0+6.5,h+1.08,z,13.1,0.06,0.06);
    for(const z of [z0+0.2,z0+6.8]){ cdP(G,CDG.box,Gy,x0+2.8,h+0.6,z,1.4,0.4,0.6,true); }
    /* --- hangar: roof vents, front pipes, cable trays --- */
    for(const zz of [10,14.5,19]) { cdP(G,CDG.cyl,Gy,15,8.15,zz,0.7,0.5,0.7,true); cdP(G,CDG.cyl,D,15,8.45,zz,0.85,0.1,0.85); }
    for(const s of [-1,1]){ cdP(G,CDG.cyl6,Cu,15+s*6.3,3.0,24.35,0.16,6.0,0.16,true); cdP(G,CDG.cyl6,Cu,15+s*4.2,6.05,24.35,0.16,4.2,0.16,true,0,0,Math.PI/2); }
    cdP(G,CDG.box,Gy,23.2,1.8,8.5,0.5,0.9,1.2,true); cdP(G,CDG.cyl,D,23.47,1.8,8.5,0.7,0.06,0.7,false,0,0,Math.PI/2); }
  if(tier>=2){ /* --- high: antenna array, ladder, cables, extra gear, blinking beacons --- */
    const mx=x0+6.88, mz=z0+0.58; for(const [y,l] of [[top+1.6,1.4],[top+2.6,1.0],[top+3.3,0.7]]){ cdP(G,CDG.box,Gy,mx,y,mz,l,0.06,0.06); for(const s of [-1,1]) cdP(G,CDG.box,W,mx+s*l/2,y+0.25,mz,0.08,0.5,0.08); }
    for(const [y,ry] of [[top+1.1,0.8],[top+2.1,-1.6]]){ const d2=cdP(G,CDG.dish,cdMat('wd',0),mx+Math.cos(ry)*0.35,y,mz+Math.sin(ry)*0.35,0.55,0.55,0.55,false,-Math.PI/2,0,0); d2.rotation.set(0,ry,Math.PI/2); }
    for(let y=h+0.6;y<h+5;y+=0.35) cdP(G,CDG.box,Y,x0+9.5,y,z0+5.28,0.6,0.05,0.05); for(const s of [-1,1]) cdP(G,CDG.box,Y,x0+9.5+s*0.3,h+2.8,z0+5.28,0.05,4.4,0.05);
    for(const z of [z0+1.6,z0+2.4]) cdP(G,CDG.box,D,x0+4.3,h+0.45,z,6,0.06,0.06);
    for(let k=0;k<3;k++) cdP(G,CDG.box,k===1?Gy:A,x0+1+k*1.1,h+0.75,z0+3.6,0.9,0.7,1.1,true);
    for(const zz of [8,12,16,20]) cdP(G,CDG.box,D,8.5,4.6,zz,0.08,0.08,3.6);
    for(const [x,z] of [[22.3,7],[7.7,7],[22.3,23.5],[7.7,23.5]]){ const l=cdP(G,CDG.box,Y,x,4.1,z,0.25,0.25,0.25); cdP(l,CDG.box,cdMat('lw',0xfff2c8,true),0,-0.15,0,0.7,0.3,0.7); }
    for(const [x,y,z] of [[mx,top+3.85,mz],[x0+12.4,top+0.25,z0+0.3],[x0+6.6,top+0.25,z0+5.9]]) CDK.beacons.push(cdP(G,CDG.sph,R,x,y,z,0.16)); }
  for(const o of G.children) o.updateMatrixWorld(); }
function campDecoUpdate(dt,t){ if(CDK.bend) bendUpdate(dt); campPushUpdate(dt); campHiUpdate(t); if(CDK.sock){ CDK.sock.rotation.y=-0.6+Math.sin(t*0.35)*0.5; CDK.sock.rotation.x=Math.sin(t*1.7)*0.06; } if(CDK.term) CDK.term.material.color.setHex(Math.sin(t*2.4)>0?0x6fd0ff:0x3a8fbf); if(!CDK.aa) return; const a=CDK.aa;
  a.hold-=dt; if(a.hold<=0&&Math.abs(wrapA(a.ta-a.a))<0.02){ a.ta=a.a+(rnd()<0.5?-1:1)*(0.8+rnd()*1.6); a.hold=1.5+rnd()*3; }
  const st=clamp(wrapA(a.ta-a.a),-dt*0.32,dt*0.32); a.a+=st; a.yaw.rotation.y=a.a; a.pit.rotation.x=-(0.45+0.25*Math.sin(t*0.37)); a.moving=Math.abs(st)>1e-4;
  for(let i=0;i<CDK.beacons.length;i++) CDK.beacons[i].visible=((t*0.8+i*0.33)%1)<0.18; }
function campDecor(){ campDecoBuild(); for(const o of SIGNS){ scene.remove(o.m); o.m.material.map.dispose(); o.m.material.dispose(); } SIGNS.length=0; if(LOC_ID!=='camp') return;
  for(const p of CAMP_PADS){ const w=p.x1-p.x0, d=p.z1-p.z0, cv=document.createElement('canvas'); cv.width=512; cv.height=Math.round(512*d/w); const c=cv.getContext('2d'), W=cv.width, H=cv.height, acc=css(PALETTES[PAL].glow);
    c.strokeStyle=acc; c.lineWidth=7; c.setLineDash([26,14]); c.strokeRect(6,6,W-12,H-12); c.setLineDash([]); c.fillStyle=acc; c.globalAlpha=0.16; c.fillRect(6,6,W-12,H-12); c.globalAlpha=1;
    c.globalAlpha=0.55; for(let k=0;k<3;k++){ const y=H*0.22+k*H*0.12; c.beginPath(); c.moveTo(W*0.08,y+H*0.1); c.lineTo(W*0.14,y); c.lineTo(W*0.2,y+H*0.1); c.lineWidth=8; c.strokeStyle=acc; c.stroke(); c.beginPath(); c.moveTo(W*0.8,y+H*0.1); c.lineTo(W*0.86,y); c.lineTo(W*0.92,y+H*0.1); c.stroke(); } c.globalAlpha=1;
    c.textAlign='center'; c.textBaseline='middle'; c.font=`800 ${Math.round(H*0.32)}px Unbounded, 'Arial Black', sans-serif`; c.fillText(p.t,W/2,H*0.42); c.font=`600 ${Math.round(H*0.14)}px 'IBM Plex Mono', monospace`; c.fillText(p.s.toUpperCase(),W/2,H*0.74);
    const tex=new THREE.CanvasTexture(cv), m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2})); m.rotation.x=-Math.PI/2; m.position.set((p.x0+p.x1)/2,0.07,(p.z0+p.z1)/2); m.renderOrder=3; scene.add(m); SIGNS.push({m,kind:'pad'}); }
  for(const [t,s,x,y,z] of [['ГАРАЖ','ремонт и апгрейды',15,8.6,25.2],['ШТАБ','задания',65.5,6.4,31.4],['АВТОПАРК','танки за лом',18,4.6,61.5]]){
    const cv=document.createElement('canvas'); cv.width=512; cv.height=150; const c=cv.getContext('2d'), acc=css(PALETTES[PAL].glow);
    c.fillStyle='rgba(6,12,26,0.82)'; c.fillRect(4,4,504,112); c.strokeStyle=acc; c.lineWidth=5; c.strokeRect(4,4,504,112); c.beginPath(); c.moveTo(236,116); c.lineTo(256,146); c.lineTo(276,116); c.fillStyle=acc; c.fill();
    c.fillStyle=acc; c.textAlign='center'; c.textBaseline='middle'; c.font="800 46px Unbounded, 'Arial Black', sans-serif"; c.fillText(t,256,50); c.font="600 22px 'IBM Plex Mono', monospace"; c.fillStyle='#eaf2ff'; c.fillText(s.toUpperCase(),256,92);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),transparent:true,depthWrite:false})); sp.scale.set(6.4,1.88,1); sp.position.set(x,y,z); sp.renderOrder=6; scene.add(sp); SIGNS.push({m:sp,kind:'sign',y}); } }
function campDecorUpdate(t){ const cdt=Math.min(0.1,Math.max(0,t-(CDK.t||t))); CDK.t=t; campDecoUpdate(cdt,t); for(const o of SIGNS){ if(o.kind==='pad') o.m.material.opacity=0.6+0.4*Math.sin(t*3.2); else o.m.position.y=o.y+Math.sin(t*2)*0.18; }
  if(LOC_ID!=='camp'||GAR.open||transit){ CAMP_PARK.in=false; return; } const z=CAMP_PARK, ins=TK.x>z.x0&&TK.x<z.x1&&TK.z>z.z0&&TK.z<z.z1;
  if(ins&&!z.in){ z.in=true; openGarage('park'); } else if(!ins) z.in=false; }
function paintCampRoutes(s){ const acc=css(s.glow); gx.save(); gx.strokeStyle=acc; gx.globalAlpha=0.55; gx.lineWidth=0.32*GS; gx.setLineDash([1.2*GS,0.9*GS]); gx.lineCap='round';
  for(const pts of [[[37.2,40],[15,40],[15,30.4]],[[42.8,40],[65.5,40],[65.5,35.6]],[[40,42.8],[40,63.3],[24.6,63.3]],[[42.4,42.4],[44.6,44.6],[44.6,47.6],[62,47.6],[62,53.8]]]){ gx.beginPath(); pts.forEach((p,i)=>i?gx.lineTo(p[0]*GS,p[1]*GS):gx.moveTo(p[0]*GS,p[1]*GS)); gx.stroke();
    const a=pts[pts.length-2], b=pts[pts.length-1], ang=Math.atan2(b[1]-a[1],b[0]-a[0]); gx.setLineDash([]); gx.fillStyle=acc; gx.beginPath(); gx.moveTo(b[0]*GS,b[1]*GS); gx.lineTo((b[0]-Math.cos(ang-0.5)*1.4)*GS,(b[1]-Math.sin(ang-0.5)*1.4)*GS); gx.lineTo((b[0]-Math.cos(ang+0.5)*1.4)*GS,(b[1]-Math.sin(ang+0.5)*1.4)*GS); gx.fill(); gx.setLineDash([1.2*GS,0.9*GS]); }
  gx.restore(); gx.fillStyle=cssA(P.line,0.5); for(let x=3;x<34;x+=6.5){ R_(x,59.6,6.5,0.15); R_(x,66.2,6.5,0.15); }
  gtext('P',30.5,63.3,2.6,acc,0.55); }


/* ================= v30.8: pushable camp props (barrels, crates, sandbag walls) =================
   Meshes with a tiny 2D physics: the tank shoves them (heavier ones barely), barrels tip over and roll,
   a crate on top of a stack falls when the bottom one is pushed out, everything slides and stops against walls. */
const CAMP_PUSH={
  barrels:[[31.4,75],[32.3,75.4],[31.8,74.2],[33.6,73.4],[34.4,73.9],[24.6,21.6],[25.4,22.3],[24.8,23.1],[56.6,48.6],[57.4,48.4],[9.6,30.2],[10.4,30.8]],
  crates:[[26,8],[27,12],[52,74],[56,75],[73,72]],
  walls:[[46.5,71.5,53.5,71.5],[66,49.5,77,49.5],[76.5,50,76.5,58]] };
function campPushBuild(G,tier){ const L=CDK.push=[], Wd=cdMat('wd2',0x8a6a48), Wk=cdMat('wk2',0x6e5236), Ar=cdMat('ar2',0x4f6b58), Rd=cdMat('rd2',0xb0452e), Bk=cdMat('bk2',0x2a2f34), Hy=cdMat('hy2',0xb9a06a), Cv=cdMat('cv2',0x9a8a62);
  const add=(o)=>{ o.vx=0; o.vz=0; o.w=0; o.y=o.y||0; o.tip=0; L.push(o); CDK.shG.push(o.g); return o; };
  CAMP_PUSH.barrels.forEach(([x,z],i)=>{ const g=new THREE.Group(); g.position.set(x,0,z); G.add(g); const b=new THREE.Group(); g.add(b); const M=i%3===1?Rd:i%3===2?Bk:Ar;
    cdP(b,CDG.cyl,M,0,0.48,0,0.66,0.92,0.66,true); for(const y of [0.06,0.36,0.62,0.9]) cdP(b,CDG.tor,Bk,0,y,0,0.67,0.67,0.67,false,Math.PI/2,0,0);
    if(tier>=1){ cdP(b,CDG.cyl,Bk,0.14,0.95,0.08,0.1,0.04,0.1); cdP(b,CDG.box,cdMat('yl2',0xffc94a),0,0.5,0.335,0.28,0.18,0.01); }
    add({kind:'barrel',g,b,x,z,r:0.36,m:0.6,h:i*1.3}); });
  for(const [x,z] of CAMP_PUSH.crates){ const mkC=(cx,cz,s,y,h)=>{ const g=new THREE.Group(); g.position.set(cx,y,cz); G.add(g); cdP(g,CDG.box,Wd,0,s/2,0,s,s,s,true);
      if(tier>=1){ for(const [dx,dz,w,d] of [[0,s/2,s+0.02,0.06],[0,-s/2,s+0.02,0.06],[s/2,0,0.06,s+0.02],[-s/2,0,0.06,s+0.02]]){ cdP(g,CDG.box,Wk,dx,0.05,dz,w,0.09,d); cdP(g,CDG.box,Wk,dx,s-0.05,dz,w,0.09,d); }
        for(const sx of [-1,1]) for(const sz of [-1,1]) cdP(g,CDG.box,Wk,sx*s/2,s/2,sz*s/2,0.08,s,0.08); if(tier>=2){ cdP(g,CDG.box,Wk,0,s/2,s/2+0.01,s*1.3,0.08,0.02,false,0,0,Math.PI/4); cdP(g,CDG.box,cdMat('st2',0x2a2f34),0,s*0.62,-s/2-0.01,s*0.45,s*0.18,0.01); } }
      g.rotation.y=h; return add({kind:'crate',g,x:cx,z:cz,y,r:s*0.62,m:s>1.1?1.6:1.1,h,s}); };
    const a=mkC(x,z,1.2,0,0.1), b=mkC(x+1.25,z,1.0,0,-0.2), c=mkC(x+0.05,z+0.05,0.9,1.2,0.35); c.base=a; c.stack=true; void b; }
  for(const [x0,z0,x1,z1] of CAMP_PUSH.walls){ const len=Math.hypot(x1-x0,z1-z0), n=Math.max(1,Math.round(len/1.2)), h=Math.atan2(x1-x0,z1-z0);
    for(let k=0;k<n;k++){ const f=(k+0.5)/n, x=x0+(x1-x0)*f, z=z0+(z1-z0)*f, g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=h; G.add(g);
      for(let row=0;row<3;row++) for(let c=0;c<(row===2?1:2);c++){ const bz=(row===2?0:(c-0.5)*0.58)+(row===1?0.14:0), bag=cdP(g,tier>=1?CDG.sph:CDG.box,(row+c)%2?Hy:Cv,0,0.2+row*0.34,bz,0.9,tier>=1?0.42:0.34,tier>=1?0.62:0.56); if(tier>=1) bag.rotation.y=(row*7+c)%3*0.06; }
      add({kind:'bag',g,x,z,r:0.55,m:7,h}); } } }
function pushHitSnd(o,v){ const ps=sndAt(o.x,o.z), k=Math.min(1,v/7);
  if(o.kind==='barrel'){ sO(220+rnd()*60,140,0.25,0.08*k+0.02,'triangle'); sNz(0.08,'bandpass',1400,3,0.05*k); }
  else if(o.kind==='crate'){ sNz(0.14,'lowpass',900,0.9,0.12*k+0.03); sO(160,90,0.12,0.06*k,'square'); }
  else { sNz(0.25,'lowpass',420,0.7,0.14*k+0.03); } sndOff(ps); }
function campPushUpdate(dt){ const L=CDK.push; if(!L||!L.length||LOC_ID!=='camp'||GAR.open||transit) return; dt=Math.min(dt,0.05); const tm=3*(chs().mass||1);
  for(const o of L){
    if(o.y<2.2&&!TK.dead){ const dx=o.x-TK.x, dz=o.z-TK.z, d=Math.hypot(dx,dz), R=TR*0.92+o.r;
      if(d<R&&d>1e-3){ const nx=dx/d, nz=dz/d, pen=R-d, sh=tm/(tm+o.m), tv=TK.vx*nx+TK.vz*nz;
        const ox=o.x+nx*pen*sh, oz=o.z+nz*pen*sh, free=eFree(ox,oz,o.r*0.75), k=free?sh:0;
        if(free){ o.x=ox; o.z=oz; } const tx=TK.x-nx*pen*(1-k), tz=TK.z-nz*pen*(1-k); if(!tankContacts(tx,tz,CT)){ TK.x=tx; TK.z=tz; }
        if(tv>0){ o.vx+=nx*tv*k*1.15; o.vz+=nz*tv*k*1.15; TK.vx-=nx*tv*(1-k*0.85); TK.vz-=nz*tv*(1-k*0.85); o.w+=((TK.vx*nz-TK.vz*nx)>0?1:-1)*tv*k*0.9/(o.m*0.6+0.4);
          if(tv>1.2&&(o.sT||0)<=0){ o.sT=0.25; pushHitSnd(o,tv); if(o.kind==='bag'){ for(let n=0;n<3;n++) SMOKE.spawn(o.x,0.3,o.z,(rnd()-0.5),0.6,(rnd()-0.5),0.4,1.2,0.6,0.3,0.75,0.7,0.55); } }
          if(o.kind==='barrel'&&!o.lying&&tv>3.2){ o.lying=true; o.ra=Math.atan2(nx,nz); } } } }
    o.sT=(o.sT||0)-dt;
    if(o.base){ const b=o.base; if(Math.hypot(b.x-o.x,b.z-o.z)>0.45||b.y>0.1||Math.hypot(b.vx,b.vz)>1.4){ o.base=null; o.fall=true; o.fv=0; o.vx+=(o.x-b.x)*1.5; o.vz+=(o.z-b.z)*1.5; } else { o.x+=(b.x-o.x)*0; } }
    if(o.fall){ o.fv-=14*dt; o.y=Math.max(0,o.y+o.fv*dt); o.tip=Math.min(1,o.tip+dt*2.5); if(o.y<=0){ o.fall=false; o.stack=false; pushHitSnd(o,6); dustAt(o.x,o.z,0.5); } }
    const sp=Math.hypot(o.vx,o.vz); if(sp>0.01||Math.abs(o.w)>0.01){ const nx=o.x+o.vx*dt, nz=o.z+o.vz*dt;
      if(eFree(nx,nz,o.r*0.75)){ o.x=nx; o.z=nz; } else { if(sp>2) pushHitSnd(o,sp); o.vx*=-0.25; o.vz*=-0.25; }
      const fr=o.lying?0.9:o.kind==='bag'?10:o.kind==='barrel'?3:4.5; const e=Math.exp(-fr*dt); o.vx*=e; o.vz*=e; o.w*=Math.exp(-5*dt); o.h+=o.w*dt; if(o.lying) o.roll=(o.roll||0)+sp*dt/0.33; }
    for(const q of L){ if(q===o||Math.abs(q.y-o.y)>0.6) continue; const dx=q.x-o.x, dz=q.z-o.z, d=Math.hypot(dx,dz), m=o.r+q.r; if(d>=m||d<1e-3) continue; const nx=dx/d, nz=dz/d, pen=(m-d)*0.5, wa=q.m/(o.m+q.m);
      if(eFree(o.x-nx*pen*wa*2,o.z-nz*pen*wa*2,o.r*0.75)){ o.x-=nx*pen*wa*2; o.z-=nz*pen*wa*2; } if(eFree(q.x+nx*pen*(1-wa)*2,q.z+nz*pen*(1-wa)*2,q.r*0.75)){ q.x+=nx*pen*(1-wa)*2; q.z+=nz*pen*(1-wa)*2; }
      const rv=(o.vx-q.vx)*nx+(o.vz-q.vz)*nz; if(rv>0){ const j=rv*0.8; o.vx-=nx*j*wa; o.vz-=nz*j*wa; q.vx+=nx*j*(1-wa); q.vz+=nz*j*(1-wa); } }
    o.g.position.set(o.x,o.y,o.z);
    if(o.kind==='barrel'&&o.lying){ o.tip=Math.min(1,o.tip+dt*5); o.g.rotation.set(0,o.ra,0); o.b.rotation.set(o.tip*Math.PI/2,0,0); o.b.position.set(0,o.tip*0.33,-o.tip*0.0); o.b.children[0].rotation.y=o.roll||0; o.ra+=o.w*dt*0.3; }
    else { o.g.rotation.set(o.fall||o.tip?o.tip*0.5:0,o.h,0); } } }
function campShadows(){ if(LOC_ID!=='camp'||REALSH) return; if(CDK.bend) for(const b of CDK.bend) shadowAdd(b.x+b.ax*0.6,b.z+b.az*0.6,b.sh,0,0.42); if(CDK.push) for(const o of CDK.push) shadowAdd(o.x,o.z,o.r*2.4,o.y,0.4); }

/* ================= v30.8: «Выс» — tents, watchtowers and odds and ends get real detail ================= */
function cdLine(par,mat,ax,ay,az,bx,by,bz,r){ const dx=bx-ax, dy=by-ay, dz=bz-az, L=Math.hypot(dx,dy,dz), m=new THREE.Mesh(CDG.cyl6,mat); m.scale.set(r*2,L,r*2); m.position.set((ax+bx)/2,(ay+by)/2,(az+bz)/2); m.quaternion.setFromUnitVectors(_cdUp,_cdV.set(dx/L,dy/L,dz/L)); par.add(m); return m; }
const _cdUp=new THREE.Vector3(0,1,0), _cdV=new THREE.Vector3();
function campHiDetail(G){ const Wd=cdMat('wd2',0x8a6a48), Rp=cdMat('rp2',0xcfc3a0), Gy=cdMat('g',0x5c656e), D=cdMat('d',0x22282e), Cv=cdMat('cvd',0x55603f), Cl=cdMat('cvl',0x6f7a52), Y=cdMat('y',0xffb53a), Wl=cdMat('lw',0xfff2c8,true);
  /* tents (6 × 8 m, ridge along z, door on the +z end) */
  for(const tx of [50,58,66]) for(const tz of [4,16]){ const x=tx+3, z0=tz, z1=tz+8, H=2.6, g=new THREE.Group(); G.add(g);
    cdLine(g,Wd,x,H+0.08,z0-0.35,x,H+0.08,z1+0.35,0.06);
    for(const z of [z0-0.15,z1+0.15]){ cdLine(g,Wd,x,0,z,x,H+0.2,z,0.07); for(const s of [-1,1]){ cdLine(g,Rp,x,H+0.1,z,x,0.02,z+(z<z0?-1.6:1.6)+s*0.4,0.012); cdP(g,CDG.box,Wd,x+s*0.4,0.1,z+(z<z0?-1.6:1.6),0.06,0.22,0.06); } }
    for(let k=0;k<4;k++){ const zz=z0+1+k*2; for(const s of [-1,1]){ const ex=x+s*3, ey=0.12; cdLine(g,Rp,x+s*2.6,0.35,zz,ex+s*0.9,0.02,zz,0.01); cdP(g,CDG.box,Wd,ex+s*0.9,0.08,zz,0.05,0.18,0.05); cdP(g,CDG.box,k%2?Cl:Cv,x+s*1.5,1.3,zz,0.05,0.9,0.7,false,0,0,s*-0.71); void ey; } }
    cdP(g,CDG.cyl,Cl,x,1.95,z1+0.05,0.18,1.3,0.18,false,0,0,Math.PI/2); for(const s of [-1,1]) cdP(g,CDG.box,Cv,x+s*0.62,0.95,z1+0.04,0.05,1.7,0.04,false,0,0,s*0.35);
    cdP(g,CDG.cyl,Gy,x+1.6,2.5,z0+2.2,0.14,1.6,0.14); cdP(g,CDG.cyl,D,x+1.6,3.35,z0+2.2,0.26,0.08,0.26);
    cdP(g,CDG.box,D,x+0.9,1.6,z1+0.05,0.36,0.24,0.02); cdP(g,CDG.box,Y,x+0.9,1.6,z1+0.06,0.3,0.06,0.01); cdP(g,CDG.sph,Wl,x-0.8,1.95,z1+0.12,0.09);
    for(let k=0;k<5;k++) cdP(g,CDG.sph,cdMat('hy2',0xb9a06a),x-2.6+k*0.55,0.18,z0-0.5,0.55,0.3,0.4); }
  /* watchtowers: X-bracing, ladder, railings, searchlight, antenna, sandbags on the deck */
  CDK.lights=[]; for(const [x,z] of [[75,5],[5,75]]){ const g=new THREE.Group(); g.position.set(x,0,z); G.add(g);
    for(const [a,b] of [[[-1.2,-1.2],[1.2,-1.2]],[[1.2,-1.2],[1.2,1.2]],[[1.2,1.2],[-1.2,1.2]],[[-1.2,1.2],[-1.2,-1.2]]]) for(const [y0,y1] of [[0.4,3.1],[3.1,5.8]]){ cdLine(g,Gy,a[0],y0,a[1],b[0],y1,b[1],0.045); cdLine(g,Gy,b[0],y0,b[1],a[0],y1,a[1],0.045); cdLine(g,Gy,a[0],y1,a[1],b[0],y1,b[1],0.04); }
    const lz=1.65; for(const s of [-1,1]) cdLine(g,Y,s*0.25,0,lz,s*0.25,6.4,lz,0.03); for(let y=0.3;y<6.3;y+=0.35) cdLine(g,Y,-0.25,y,lz,0.25,y,lz,0.02);
    for(const s of [-1,1]) for(const ax of [0,1]){ const p=s*1.75; ax?cdLine(g,D,p,7.55,-1.75,p,7.55,1.75,0.03):cdLine(g,D,-1.75,7.55,p,1.75,7.55,p,0.03); }
    for(const [dx,dz] of [[-1.25,-1.25],[1.25,-1.25],[-1.25,1.25]]) cdP(g,CDG.sph,cdMat('hy2',0xb9a06a),dx,6.5,dz,0.7,0.3,0.45);
    cdLine(g,Gy,1.4,8.6,-1.4,1.4,10.6,-1.4,0.025); cdP(g,CDG.sph,cdMat('r',0xff3b30,true),1.4,10.65,-1.4,0.08);
    const sl=new THREE.Group(); sl.position.set(0,8.85,0); g.add(sl); cdP(sl,CDG.cyl,Gy,0,0,0,0.3,0.3,0.3); const hd=new THREE.Group(); hd.position.y=0.3; sl.add(hd); cdP(hd,CDG.cyl,D,0,0,0.1,0.42,0.5,0.42,true,Math.PI/2,0,0); cdP(hd,CDG.cyl,Wl,0,0,0.36,0.34,0.02,0.34,false,Math.PI/2,0,0);
    CDK.lights.push({g:sl,ph:x*0.1}); }
  /* odds and ends: generator with cables next to the HQ, pallets, jerrycans, tool chests by the trucks */
  { const g=new THREE.Group(); g.position.set(56.2,0,28.5); G.add(g); cdP(g,CDG.box,cdMat('gn',0x4f6b58),0,0.55,0,1.6,0.9,0.9,true); cdP(g,CDG.box,D,0,0.06,0,1.8,0.12,1.0); for(let k=0;k<5;k++) cdP(g,CDG.box,D,-0.5+k*0.25,0.65,0.46,0.05,0.5,0.02);
    cdP(g,CDG.cyl,Gy,0.55,1.15,0.2,0.1,0.4,0.1); cdP(g,CDG.box,Y,-0.6,0.8,0.46,0.25,0.14,0.02); for(let k=0;k<6;k++) cdLine(g,Bk2(),0.8+k*0.4,0.05,0.1-k*0.15,1.2+k*0.4,0.05,-k*0.15-0.05,0.03); CDK.gen=g; }
  for(const [x,z] of [[9.5,58.6],[12.4,72.6],[3.6,52.6]]){ cdP(G,CDG.box,Wd,x,0.07,z,1.2,0.14,1.0); for(let k=0;k<3;k++) cdP(G,CDG.box,cdMat('jc',0x3d5a3a),x-0.35+k*0.35,0.42,z,0.26,0.56,0.4,true); cdP(G,CDG.box,cdMat('tb',0xb0452e),x+1.1,0.25,z+0.3,0.7,0.5,0.4,true); } }
function Bk2(){ return cdMat('bk2',0x2a2f34); }
function campHiUpdate(t){ if(!CDK.lights) return; for(const l of CDK.lights){ l.g.rotation.y=l.ph+Math.sin(t*0.4+l.ph)*1.6; } if(CDK.gen) CDK.gen.position.y=Math.sin(t*60)*0.006; }
