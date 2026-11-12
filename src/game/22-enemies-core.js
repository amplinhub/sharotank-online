/* ================= ENEMIES ================= */
const ENEMIES=[], PICKUPS=[], GIBS=[], DRONES=[], FALLERS=[], DELAYS=[];
const EGEO={box:new THREE.BoxGeometry(1,1,1),tip:new THREE.CylinderGeometry(0.12,0.5,1,6),cyl:new THREE.CylinderGeometry(0.5,0.5,1,14),sph:new THREE.SphereGeometry(0.5,18,12),
  joint:new THREE.SphereGeometry(0.5,8,6),ring:new THREE.TorusGeometry(0.5,0.09,6,18),disc:new THREE.CircleGeometry(0.5,18),nut:new THREE.CylinderGeometry(0.24,0.24,0.12,6),
  mark:new THREE.RingGeometry(0.8,1.05,36),rotor:new THREE.CylinderGeometry(0.28,0.28,0.02,10),thin:new THREE.TorusGeometry(0.5,0.035,5,28),arc:new THREE.TorusGeometry(0.5,0.045,5,20,Math.PI*0.66)};
const PKM={glint:new THREE.MeshBasicMaterial({color:0xffffff}),nut:new THREE.MeshBasicMaterial({color:0xffc94a}),hole:new THREE.MeshBasicMaterial({color:0x0b0f16}),ammo:new THREE.MeshToonMaterial({color:0x4a6b52,gradientMap:gradTex}),stripe:new THREE.MeshBasicMaterial({color:0xffc94a})};
/* review: an exception inside one enemy's update used to abort the rest of the frame every frame
   (everything after it froze). Now the enemy is logged once and keeps going; after 30 errors it is removed. */
function enemyCrash(e,err){ e.errN=(e.errN||0)+1; if(e.errN===1) console.error('[enemy '+e.type+']',err); if(e.errN>30&&!e.boss){ e.dead=true; eRemove(e); } }
const UPV=new THREE.Vector3(0,1,0), _dirV=new THREE.Vector3(), _h3=new THREE.Vector3(), _d3=new THREE.Vector3(), _u3=new THREE.Vector3(), _w3=new THREE.Vector3(), _c3=new THREE.Vector3();
const EYE_RED=[1,0.23,0.18];
function later(t,fn){ DELAYS.push({t,fn}); }
function delaysUpdate(dt){ for(let i=DELAYS.length-1;i>=0;i--){ DELAYS[i].t-=dt; if(DELAYS[i].t<=0){ const f=DELAYS[i].fn; DELAYS.splice(i,1); try{ f(); } catch(err){ console.error('[later]',err); } } } }
function turnTo(a,b,max){ const d=wrapA(b-a); return wrapA(a+clamp(d,-max,max)); }
function emat(e,color){ const m=new THREE.MeshToonMaterial({color,gradientMap:gradTex}); e.mats.push(m); return m; }
const GLM={}; function gmat(c){ return GLM[c]||(GLM[c]=new THREE.MeshBasicMaterial({color:c})); }
function eglow(e,color){ const m=new THREE.MeshBasicMaterial({color}); e.glows.push(m); return m; }
function ep(e,geo,mat,par,x,y,z,sx,sy,sz,ol){ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.scale.set(sx,sy==null?sx:sy,sz==null?sx:sz); par.add(m); if(ol){ const o=new THREE.Mesh(geo,outlineMat); o.scale.setScalar(1.07); m.add(o); } return m; }
function placeSeg(m,a,b,w,d){ const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,L=Math.hypot(dx,dy,dz)||1e-4; m.position.set((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2); _dirV.set(dx/L,dy/L,dz/L); m.quaternion.setFromUnitVectors(UPV,_dirV); m.scale.set(w,L,d); }
function segSphere(ox,oy,oz,ux,uy,uz,len,cx,cy,cz,r){ const lx=cx-ox, ly=cy-oy, lz=cz-oz, tc=lx*ux+ly*uy+lz*uz; const q=lx*lx+ly*ly+lz*lz-tc*tc; if(q>r*r) return -1; const t=tc-Math.sqrt(r*r-q); return (t>=0&&t<=len)?t:(tc>=0&&tc<=len?tc:-1); }
function losClear(ax,ay,az,bx,by,bz){ const dx=bx-ax,dy=by-ay,dz=bz-az, L=Math.hypot(dx,dy,dz); if(L<0.05) return true; return !(raycast(ax,ay,az,dx/L,dy/L,dz/L,L-0.6)&&RH.hit===1); }
function losTank(x,y,z){ return losClear(x,y,z,TK.x,TK.y+1.4,TK.z); }
function colTop(x,z){ const cx=Math.floor(x/VS), cz=Math.floor(z/VS); for(let y=NY-1;y>=0;y--) if(get(cx,y,cz)) return (y+1)*VS; return 0; }
function eFree(x,z,r){ if(x<r+0.8||z<r+0.8||x>WX-r-0.8||z>WZ-r-0.8) return false; const y1=Math.floor(0.5/VS), y2=Math.floor(1.3/VS);
  for(let k=0;k<8;k++){ const a=k*0.7854, cx=Math.floor((x+Math.sin(a)*r)/VS), cz=Math.floor((z+Math.cos(a)*r)/VS); if(get(cx,y1,cz)||get(cx,y2,cz)) return false; }
  return !(get(Math.floor(x/VS),y1,Math.floor(z/VS))); }
/* a spot with a roof over most of its footprint is inside a building */
function indoor(x,z){ const y0=Math.floor(2.2/VS), y1=NY-1; let n=0; for(const [ox,oz] of [[0,0],[1.4,0],[-1.4,0],[0,1.4],[0,-1.4]]){ const cx=Math.floor((x+ox)/VS), cz=Math.floor((z+oz)/VS); for(let y=y0;y<=y1;y++) if(get(cx,y,cz)){ n++; break; } } return n>=4; }
function freeSpotOut(x,z,r){ if(eFree(x,z,r)&&!indoor(x,z)) return [x,z]; for(let k=1;k<260;k++){ const a=k*2.4, rr=0.45*Math.sqrt(k)*1.8, px=x+Math.cos(a)*rr, pz=z+Math.sin(a)*rr; if(eFree(px,pz,r)&&!indoor(px,pz)) return [px,pz]; } return freeSpot(x,z,r); }
function freeSpot(x,z,r){ if(eFree(x,z,r)) return [x,z]; for(let k=1;k<140;k++){ const a=k*2.4, rr=0.45*Math.sqrt(k)*1.6, px=x+Math.cos(a)*rr, pz=z+Math.sin(a)*rr; if(eFree(px,pz,r)) return [px,pz]; } return [x,z]; }
function smashAround(x,z,r,h,maxHard){ const a=Math.floor((x-r)/VS),b=Math.floor((x+r)/VS),f=Math.floor((z-r)/VS),g=Math.floor((z+r)/VS),yt=Math.min(NY-1,Math.floor(h/VS)); const rem=[];
  for(let y=0;y<=yt;y++)for(let zz=f;zz<=g;zz++)for(let xx=a;xx<=b;xx++){ const m=get(xx,y,zz); if(!m||MD[m].hard>maxHard) continue; const wx=(xx+0.5)*VS-x, wz=(zz+0.5)*VS-z; if(wx*wx+wz*wz>r*r) continue; rem.push(xx,y,zz,m); grid[gi(xx,y,zz)]=0; markDirty(xx,y,zz); }
  if(!rem.length) return; destroyed+=rem.length/4; let glass=0;
  for(let i=0;i<rem.length;i+=4){ const m=rem[i+3]; if(MD[m].glass) glass++; if(rnd()>0.5) continue; voxelColor(m,rem[i],rem[i+1],rem[i+2],col); debSpawn((rem[i]+0.5)*VS,(rem[i+1]+0.5)*VS,(rem[i+2]+0.5)*VS,(rnd()-0.5)*4,1+rnd()*3,(rnd()-0.5)*4,col[0],col[1],col[2],VS*(0.6+0.4*rnd())); }
  if(glass) sfxGlass(0.4); structural(rem); }

/* ---------- legs: IK + gait ---------- */
function walkUpdate(e,dt){ const C=e.wc; const ch=Math.cos(e.h), sh=Math.sin(e.h); let sw=0; const yl=(e.yaw||0)*C.lead, cy=Math.cos(yl), sy=Math.sin(yl);
  for(const L of e.legs){ if(!L.alive) continue; let lx=L.rest[0], lz=L.rest[1]; if(e.curl){ lx*=0.3; lz*=0.3; }
    const rx=lx*cy+lz*sy, rz=-lx*sy+lz*cy; L.tx=e.x+rx*ch+rz*sh+e.vx*C.lead; L.tz=e.z-rx*sh+rz*ch+e.vz*C.lead; L.err=Math.hypot(L.foot.x-L.tx,L.foot.z-L.tz); if(L.t>=0) sw++; }
  if(!sw){ const ge=[]; for(const L of e.legs){ if(L.alive) ge[L.g]=Math.max(ge[L.g]||0,L.err); } let bg=-1, bv=C.thr;
    for(let g=0;g<ge.length;g++) if(ge[g]>bv){ bv=ge[g]; bg=g; }
    if(bg>=0) for(const L of e.legs) if(L.alive&&L.g===bg&&L.err>C.thr*0.2){ L.t=0; L.from.copy(L.foot); } }
  const st=C.stepT/(1+Math.hypot(e.vx,e.vz)*(C.fast||0));
  for(const L of e.legs){ if(!L.alive||L.t<0) continue; L.t+=dt/st; const k=Math.min(1,L.t), s=k*k*(3-2*k), ty=groundH(L.tx,L.tz);
    L.foot.set(L.from.x+(L.tx-L.from.x)*s, L.from.y+(ty-L.from.y)*s+Math.sin(Math.PI*k)*C.stepH, L.from.z+(L.tz-L.from.z)*s);
    if(L.t>=1){ L.t=-1; L.foot.y=ty; stepImpact(e,L); footTrack(e,L); } } }
function stepHeavy(e,L){ const d=Math.hypot(L.foot.x-TK.x,L.foot.z-TK.z); if(d<24){ shake=Math.min(1,shake+0.06*(1-d/24)); sfxThud(0.25*(1-d/24)+0.05); }
  const dc=mix3(P.side,[1,1,1],0.15); for(let k=0;k<3;k++) SMOKE.spawn(L.foot.x+(rnd()-0.5),L.foot.y+0.15,L.foot.z+(rnd()-0.5),(rnd()-0.5)*1.5,0.5,(rnd()-0.5)*1.5,0.9,1.5,0.8,0.35,dc[0],dc[1],dc[2]); }

/* ---------- movement ---------- */
function eMove(e,tx,tz,speed,dt){ e.steerT-=dt;
  if(e.steerT<=0||e.pick===null){ e.steerT=0.15; const want=Math.atan2(tx-e.x,tz-e.z), look=e.r+1.5; e.pick=null;
    for(const o of [0,0.45,-0.45,0.9,-0.9,1.4,-1.4,2.1,-2.1,2.8]){ const a=want+o*e.side; if(eFree(e.x+Math.sin(a)*look,e.z+Math.cos(a)*look,e.r*0.9)){ e.pick=a; break; } }
    if(e.pick===null){ e.pick=want+Math.PI*0.6*e.side; e.side=-e.side; } }
  const sp=speed*(1-0.6*e.slow)*(e.maxHp&&e.hp<e.maxHp*0.5?0.72:1), dh=wrapA(e.pick-e.h), mk=Math.max(1,e.mass||1), want=clamp(dh*3,-e.turn,e.turn), ta=e.turn*7/mk*dt; e.av=(e.av||0)+clamp(want-(e.av||0),-ta,ta); const turn=clamp(e.av*dt,-Math.abs(dh),Math.abs(dh)); e.h=wrapA(e.h+turn); e.yaw=turn/Math.max(dt,1e-3);
  const fwd=Math.cos(dh)>0.4?sp:sp*0.2; const dvx=Math.sin(e.h)*fwd-e.vx, dvz=Math.cos(e.h)*fwd-e.vz, a=e.acc*dt/Math.pow(mk,0.4), dl=Math.hypot(dvx,dvz);
  if(dl>a){ e.vx+=dvx/dl*a; e.vz+=dvz/dl*a; } else { e.vx+=dvx; e.vz+=dvz; } }
function eBrake(e,dt,k){ const f=Math.exp(-(k||6)/Math.sqrt(Math.max(1,e.mass||1))*dt); e.vx*=f; e.vz*=f; e.av=(e.av||0)*f; e.yaw=0; }
function eSeparate(){ for(let i=0;i<ENEMIES.length;i++){ const a=ENEMIES[i]; if(a.dead||a.noCol) continue;
  for(let j=i+1;j<ENEMIES.length;j++){ const b=ENEMIES[j]; if(b.dead||b.noCol) continue; const dx=b.x-a.x, dz=b.z-a.z, d=Math.hypot(dx,dz), m=a.r+b.r; if(!(d<m)||d<1e-3) continue;
    const pen=(m-d)/d, wa=a.static?0:(b.static?1:b.mass/(a.mass+b.mass)); const tx=a.x-dx*pen*wa, tz=a.z-dz*pen*wa, ux=b.x+dx*pen*(1-wa), uz=b.z+dz*pen*(1-wa);
    if(!a.static&&eFree(tx,tz,a.r*0.8)){ a.x=tx; a.z=tz; } if(!b.static&&eFree(ux,uz,b.r*0.8)){ b.x=ux; b.z=uz; } } } }
function tankVsEnemies(){ for(const e of ENEMIES){ if(e.dead||e.noCol||e.onTank) continue; const dx=e.x-TK.x, dz=e.z-TK.z, d=Math.hypot(dx,dz), m=TR*0.92+e.r; if(!(d<m)||d<1e-3) continue;
  const nx=dx/d, nz=dz/d, rel=(TK.vx-e.vx)*nx+(TK.vz-e.vz)*nz, tv=TK.vx*nx+TK.vz*nz, mr=e.static?1:e.mass/(e.mass+3);
  if(tv>3.5&&e.ramCD<=0&&!LOC.safe){ e.ramCD=0.35; enemyHit(e,(tv-3.5)*16*(UP.armor>=2?1.3:1),nx,nz,tv*1.3,'ram'); sfxThud(Math.min(1,tv/12)); shake=Math.min(1,shake+tv*0.02); TK.pitchV+=tv*0.03;
    if(e.mass>2.5) damageTank(tv*0.8*(UP.armor>=2?0.5:1),dx,dz,0); const sc=mix3(P.glow,[1,1,1],0.4); for(let k=0;k<8;k++) spark(TK.x+nx*1.4,1.2,TK.z+nz*1.4,nx*6+(rnd()-0.5)*6,rnd()*5,nz*6+(rnd()-0.5)*6,sc[0],sc[1],sc[2],0.4); }
  if(rel>0){ TK.vx-=nx*rel*mr; TK.vz-=nz*rel*mr; }
  const pen=m-d; if(!e.static&&!e.dead){ const ex=e.x+nx*pen*(1-mr), ez=e.z+nz*pen*(1-mr); if(eFree(ex,ez,e.r*0.8)){ e.x=ex; e.z=ez; } }
  const tx=TK.x-nx*pen*(e.static?1:mr), tz=TK.z-nz*pen*(e.static?1:mr); if(!tankContacts(tx,tz,CT)){ TK.x=tx; TK.z=tz; } } }

/* ---------- damage ---------- */
function enemyArea(px,py,pz,radius,power,skipE,kind){ const R=radius*(kind==='shell'?2.2:1.3), base=kind==='shell'?42:5; zontBlast(px,py,pz,R,base*power*0.8);
  for(const e of ENEMIES){ if(e.dead||e===skipE) continue; if(zontCovered(e,px,py,pz)) continue; const dx=e.x-px, dz=e.z-pz, dy=e.y+e.hy-py, d=Math.hypot(dx,dy,dz);
    if(d<R+e.hr){ const f=Math.min(1,1-Math.max(0,d-e.hr)/R), l=Math.hypot(dx,dz)||1; enemyHit(e,f*base*power,dx/l,dz/l,f*7*power,'area'); }
    if(e.type==='lamp'&&!e.dead) for(let li=0;li<e.legs.length;li++){ const L=e.legs[li]; if(!L.alive) continue; const dd=Math.min(Math.hypot(L.knee.x-px,L.knee.y-py,L.knee.z-pz),Math.hypot((L.knee.x+L.foot.x)/2-px,(L.knee.y+L.foot.y)/2-py,(L.knee.z+L.foot.z)/2-pz));
      if(dd<R*0.8){ L.hp-=(1-dd/(R*0.8))*base*power*0.8; if(L.hp<=0) lampLegBreak(e,li,px,pz); } } }
  for(const d of DRONES){ if(d.dead) continue; const dd=Math.hypot(d.x-px,d.y-py,d.z-pz); if(dd<R+0.5){ d.hp-=(1-dd/(R+0.5))*base*power; d.flash=1; if(d.hp<=0) droneDie(d,(d.x-px)/(dd||1),(d.z-pz)/(dd||1)); } }
  for(const g of GIBS){ const P_=g.m.position, dx=P_.x-px, dy=P_.y-py, dz=P_.z-pz, d=Math.hypot(dx,dy,dz); if(d<R*1.6){ const f=(1-d/(R*1.6))*(kind==='shell'?12:3); g.v.x+=dx/(d||1)*f; g.v.z+=dz/(d||1)*f; g.v.y+=f*0.7; g.rest=false; g.t=Math.min(g.t,2); } } }
function eRemove(e){ if(e.shadow) e.shadow.visible=false; scene.remove(e.g); scene.remove(e.lg); if(e.marker) scene.remove(e.marker); if(e.halo){ scene.remove(e.halo); scene.remove(e.pool); } e.dead=true; }
function gibMeshes(list,center,part,vx,vy,vz,r){ const G2=new THREE.Group(); G2.position.copy(center);
  for(const m of list){ m.updateMatrixWorld(true); const c=m.clone(); m.matrixWorld.decompose(c.position,c.quaternion,c.scale); c.position.sub(center); G2.add(c); }
  scene.add(G2); EXTRAS.push(G2); const g={m:G2,v:new THREE.Vector3(vx,vy,vz),w:new THREE.Vector3((rnd()-0.5)*9,(rnd()-0.5)*9,(rnd()-0.5)*9),r:r||0.35,part,t:0,rest:false}; GIBS.push(g); return g; }
function bodyGib(e,part,dx,dz,spd,r){ e.g.updateMatrixWorld(true); const c=new THREE.Vector3(); e.body.getWorldPosition(c); return gibMeshes([e.body],c,part,dx*spd+(rnd()-0.5)*2,4+rnd()*3,dz*spd+(rnd()-0.5)*2,r); }
function deathFx(x,y,z,k){ const G2=P.glow2; for(let n=0;n<10*k;n++) FIRE.spawn(x+(rnd()-0.5)*k,y+rnd()*k*0.6,z+(rnd()-0.5)*k,(rnd()-0.5)*4,2+rnd()*3,(rnd()-0.5)*4,1.2+rnd()*1.5*k,3,0.35+rnd()*0.3,0.9,G2[0],G2[1],G2[2]);
  for(let n=0;n<30*k;n++){ const a=rnd()*TAU, s=6+12*rnd(); spark(x,y,z,Math.cos(a)*s,3+rnd()*7,Math.sin(a)*s,1,0.85,0.55,0.4+0.6*rnd()); }
  const sm=mix3(P.dark,P.bg,0.3); for(let n=0;n<8*k;n++) SMOKE.spawn(x+(rnd()-0.5)*k,y,z+(rnd()-0.5)*k,(rnd()-0.5)*2,1.5+rnd()*2,(rnd()-0.5)*2,1.2*k,1.6,1.8,0.5,sm[0],sm[1],sm[2]); sfxBoom(0.5+0.3*k); }

/* ---------- gibs & pickups ---------- */
function gibsUpdate(dt){ for(let i=GIBS.length-1;i>=0;i--){ const g=GIBS[i]; g.t+=dt; const P_=g.m.position;
  if(!g.rest){ g.v.y-=G*dt; P_.addScaledVector(g.v,dt); const a=g.w.length(); if(a>1e-3){ _q.setFromAxisAngle(_v.copy(g.w).divideScalar(a),a*dt); g.m.quaternion.premultiply(_q); }
    const cx=Math.floor(P_.x/VS), cy=Math.floor(P_.y/VS), cz=Math.floor(P_.z/VS); if(cy>=0&&cy<NY&&get(cx,cy,cz)){ P_.x-=g.v.x*dt; P_.z-=g.v.z*dt; P_.y-=g.v.y*dt*0.5; g.v.x*=-0.4; g.v.z*=-0.4; if(g.v.y<0) g.v.y*=-0.3; }
    const gy=groundH(P_.x,P_.z)+g.r; if(P_.y<gy){ P_.y=gy;
      if(g.v.y<-2.5){ g.v.y*=-0.35; g.v.x*=0.6; g.v.z*=0.6; g.w.multiplyScalar(0.55); if(g.v.y>1.6) sfxThud(0.2); }
      else { g.v.y=0; const fr=Math.pow(0.015,dt); g.v.x*=fr; g.v.z*=fr; g.w.multiplyScalar(fr); if(g.v.lengthSq()<0.06&&g.t>0.5) g.rest=true; } }
    if(P_.x<1||P_.x>WX-1){ g.v.x*=-0.5; P_.x=clamp(P_.x,1,WX-1); } if(P_.z<1||P_.z>WZ-1){ g.v.z*=-0.5; P_.z=clamp(P_.z,1,WZ-1); } }
  if((g.rest||g.t>6)&&g.part){ const kind=g.part==='scrapdrone'?'scrap':'part'; makePickup(kind,P_.x,P_.z,g.part==='scrapdrone'?15:8,g.part==='scrapdrone'?null:g.part,g.m,P_.y); GIBS.splice(i,1); continue; }
  if(g.t>6){ const s=Math.max(0,1-(g.t-6)/1.2); if(!g.s0) g.s0=g.m.scale.clone(); g.m.scale.copy(g.s0).multiplyScalar(s); if(s<=0){ scene.remove(g.m); GIBS.splice(i,1); } } } }
function makePickup(kind,x,z,value,part,mesh,y){ let m=mesh;
  if(!m){ m=new THREE.Group(); if(kind==='ammo'){ const b=new THREE.Mesh(EGEO.box,PKM.ammo); b.scale.set(0.9,0.5,0.6); m.add(b); const s=new THREE.Mesh(EGEO.box,PKM.stripe); s.scale.set(0.92,0.12,0.62); m.add(s); }
    else { const n=new THREE.Mesh(EGEO.nut,PKM.nut); n.rotation.x=Math.PI/2; m.add(n); const h=new THREE.Mesh(EGEO.cyl,PKM.hole); h.scale.set(0.22,0.14,0.22); h.rotation.x=Math.PI/2; m.add(h); }
    scene.add(m); EXTRAS.push(m); }
  const p={kind,x,z,y:y!=null?y:groundH(x,z)+0.4,value,part,m,claimed:null,t:rnd()*6,mag:false}; m.position.set(x,p.y,z); PICKUPS.push(p); return p; }
function dropScrap(x,z,total,y){ const n=Math.max(1,Math.min(8,Math.ceil(total/6))), v=Math.round(total/n);
  for(let k=0;k<n;k++){ const a=rnd()*TAU, r=0.5+rnd()*2.2, p=makePickup('scrap',x+Math.cos(a)*r,z+Math.sin(a)*r,v,null,null,(y||1)+rnd()); p.fall=true; p.vy=2+rnd()*3; } }
/* ---- «Игла»: magnet. Base pickup radius 5.5 m, ×2 for Игла, ×2 more for 5 s on E (cooldown 7 s after it ends) ---- */
const MAG={on:0,cd:0,wt:0,waves:[]}, MAG_T=2, MAG_CD=5;
function magR(){ return 5.5*(UP.tank==='igla'?2:1)*(MAG.on>0?2:1); }
const magWaveM=new THREE.MeshBasicMaterial({color:0x6fd8ff,transparent:true,opacity:0.6,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
const magAuraM=new THREE.MeshBasicMaterial({color:0x8fe8ff,transparent:true,opacity:0.55,blending:THREE.AdditiveBlending,depthWrite:false});
const magAuraG=new THREE.TorusGeometry(0.42,0.025,6,24);
function magAura(p){ const g=new THREE.Group(); for(let k=0;k<3;k++){ const r=new THREE.Mesh(magAuraG,magAuraM); r.rotation.set(k*1.05,k*0.7,0); g.add(r); } p.m.add(g); p.aura=g; }
function magWave(r0,big){ const m=new THREE.Mesh(new THREE.RingGeometry(0.86,1,48),magWaveM.clone()); m.rotation.x=-Math.PI/2; m.position.set(TK.x,TK.y+0.15,TK.z); scene.add(m); MAG.waves.push({m,t:0,r0,r1:magR()*(big?1.05:1),life:big?0.8:1.1}); }
function magPress(){ if(UP.tank!=='igla'||TK.dead||transit) return; if(LOC.safe){ toast('В лагере магнит не нужен'); return; } if(MAG.on>0) return; if(MAG.cd>0){ toast(`Магнит заряжается · ${Math.ceil(MAG.cd)} с`); return; }
  MAG.on=MAG_T; MAG.wt=0; magWave(1,true); sO(70,260,0.9,0.09,'sawtooth'); sTone(110,1.2,0.05,'sine',180); sNz(0.6,'bandpass',300,0.8,0.08); shake=Math.min(1,shake+0.12); abilHud(); }
function magUpdate(dt){ if(UP.tank!=='igla'||LOC.safe){ if(MAG.on>0){ MAG.on=0; MAG.cd=MAG_CD; } }
  if(MAG.on>0){ MAG.on-=dt; MAG.wt-=dt; if(MAG.wt<=0){ MAG.wt=0.45; magWave(1,false); sTone(150+rnd()*20,0.35,0.025,'sine',90); } if(MAG.on<=0){ MAG.on=0; MAG.cd=MAG_CD; sO(240,60,0.5,0.05,'sawtooth'); abilHud(); } }
  else MAG.cd=Math.max(0,MAG.cd-dt);
  for(let i=MAG.waves.length-1;i>=0;i--){ const w=MAG.waves[i]; w.t+=dt; const k=w.t/w.life; if(k>=1){ scene.remove(w.m); w.m.geometry.dispose(); w.m.material.dispose(); MAG.waves.splice(i,1); continue; }
    const r=w.r0+(w.r1-w.r0)*(1-Math.pow(1-k,2)); w.m.scale.setScalar(r); w.m.position.set(TK.x,TK.y+0.15,TK.z); w.m.material.opacity=0.55*(1-k); }
  if(MAG.on>0){ const t=performance.now()/1000; magAuraM.opacity=0.4+Math.sin(t*9)*0.2; for(const p of PICKUPS) if(p.aura&&p.aura.visible){ p.aura.rotation.y+=dt*4; p.aura.rotation.x+=dt*2.5; const s_=1+Math.sin(t*12+p.t)*0.12; p.aura.scale.setScalar(s_/Math.max(0.35,p.m.scale.x)); } } }
function pickupsUpdate(dt){ const tx=TK.x, tz=TK.z; for(let i=PICKUPS.length-1;i>=0;i--){ const p=PICKUPS[i]; p.t+=dt; if(p.claimed) continue;
  const dx=tx-p.x, dz=tz-p.z, d=Math.hypot(dx,dz)||1e-3;
  const MR=magR(); if(p.aura) p.aura.visible=MAG.on>0&&d<MR&&!LOC.safe;
  if(d<MR&&!TK.dead&&!transit&&!LOC.safe){ p.mag=true; if(MAG.on>0&&!p.aura) magAura(p); const sp=(MR-d)*4.5*5.5/MR+5+(MAG.on>0?3:0); p.x+=dx/d*sp*dt; p.z+=dz/d*sp*dt; p.y+=(TK.y+1.3-p.y)*Math.min(1,dt*5); p.fall=false; }
  else if(p.fall){ p.vy-=G*dt; p.y+=p.vy*dt; const gy=groundH(p.x,p.z)+0.4; if(p.y<=gy){ p.y=gy; p.fall=false; } }
  else if(p.kind!=='part'){ p.y=groundH(p.x,p.z)+0.4+Math.sin(p.t*3)*0.08; p.m.rotation.y+=dt*2.2; }
  p.m.position.set(p.x,p.y,p.z); if(p.mag) p.m.scale.setScalar(clamp(d/2.2,0.35,1));
  if(d<1.4&&!LOC.safe&&!TK.dead){ collectPickup(p); PICKUPS.splice(i,1); } } }
function collectPickup(p){ scene.remove(p.m);
  if(p.kind==='ammo'){ for(const id of ['mg','cn','rk']) ST.ammo[id]=Math.min(ammoCap(id),ST.ammo[id]+Math.ceil(ammoCap(id)*0.2)); toast('Боеприпасы +20%'); sfxPickup(1); updateWeaponUI(); return; }
  ST.scrap+=p.value; gainAcc+=p.value; gainT=1.4; missionScrap(p.value); sfxPickup(0); popText(TK.x+(rnd()-0.5)*0.8,TK.y+2.4,TK.z,'+'+p.value); }

/* ---------- enemy shots ---------- */
const EW={ac:{speed:42,g:9,spread:0.02,radius:0.85,power:0.7,dmg:9,kind:'shell',size:0.6,burst:3,gap:0.22,mag:6},
  mg:{speed:80,g:0,spread:0.03,radius:0.3,power:0.5,dmg:2.2,kind:'bullet',burst:10,gap:0.07,mag:30},
  mortar:{speed:24,g:12,spread:0.02,radius:1.5,power:1.0,dmg:15,kind:'shell',size:0.9,burst:1,gap:0,mag:3,high:true}};
function eShoot(ox,oy,oz,tx,ty,tz,w){ const dx=tx-ox, dz=tz-oz, dh=Math.hypot(dx,dz)||1, dy=ty-oy; let vh, vy;
  if(w.g){ const v2=w.speed*w.speed, disc=v2*v2-w.g*(w.g*dh*dh+2*dy*v2); const ang=disc<0?Math.PI/4:Math.atan((v2+(w.high?1:-1)*Math.sqrt(disc))/(w.g*dh)); vh=Math.cos(ang)*w.speed; vy=Math.sin(ang)*w.speed; }
  else { const L=Math.hypot(dh,dy); vh=w.speed*dh/L; vy=w.speed*dy/L; }
  const a=(rnd()-0.5)*w.spread*2, ca=Math.cos(a), sa=Math.sin(a), ux=dx/dh, uz=dz/dh;
  const p={x:ox,y:oy,z:oz,vx:(ux*ca-uz*sa)*vh,vy:vy+(rnd()-0.5)*w.spread*w.speed*0.5,vz:(ux*sa+uz*ca)*vh,w,life:6,mesh:null,enemy:true};
  if(w.kind==='shell'){ p.mesh=getShell(); p.mesh.scale.setScalar(w.size||0.7); p.mesh.position.set(ox,oy,oz); } proj.push(p); }

/* ---------- common lifecycle ---------- */
function newEnemy(type,x,z){ const e={type,x,z,y:groundH(x,z),h:rnd()*TAU,vx:0,vz:0,kx:0,kz:0,hp:1,maxHp:1,r:1,hy:0,hr:1,mass:1,turn:3,acc:8,speedW:3,state:'idle',t:0,cd:1+rnd()*2,flash:0,slow:0,
  dead:false,aggro:false,mats:[],glows:[],side:rnd()<0.5?1:-1,yaw:0,g:new THREE.Group(),body:new THREE.Group(),lg:new THREE.Group(),legs:[],home:{x,z},steerT:0,pick:null,hurtT:0,yOv:null,lockable:true};
  e.g.add(e.body); scene.add(e.g); scene.add(e.lg); EXTRAS.push(e.g,e.lg); ENEMIES.push(e); return e; }
const ER={jian:0.95,bomb:0.55,hive:1.9,factory:2.4,bull:1.4,lamp:1.1};
function spawnEnemy(type,x,z,opt){ const s=freeSpotOut(x,z,ER[type]); const e=newEnemy(type,s[0],s[1]); buildE(e,opt);
  if(opt&&opt.h!=null) e.h=opt.h; for(const L of e.legs){ const ch=Math.cos(e.h), sh=Math.sin(e.h); L.foot.set(e.x+L.rest[0]*ch+L.rest[1]*sh,0,e.z-L.rest[0]*sh+L.rest[1]*ch); L.foot.y=groundH(L.foot.x,L.foot.z); }
  eRender(e,0); return e; }
function countType(t){ let n=0; for(const e of ENEMIES) if(!e.dead&&e.type===t) n++; return n; }
function eRender(e,dt){ const gy=groundH(e.x,e.z);
  if(e.yOv!=null) e.y=e.yOv; else if(e.wc){ let bob=0; for(const L of e.legs) if(L.alive&&L.t>=0) bob+=Math.sin(Math.PI*Math.min(1,L.t)); e.y=gy+e.wc.bodyH-(e.crouch||0)*0.35+bob*e.wc.bob; } else e.y=gy;
  e.g.position.set(e.x,e.y,e.z); e.g.rotation.y=e.h;
  const vF=e.vx*Math.sin(e.h)+e.vz*Math.cos(e.h); const acc=dt>0?(vF-(e.pvF||0))/dt:0; e.pvF=vF;
  e.body.rotation.x+=(clamp(-acc*0.025*(1+(e.mass||1)*0.25),-0.22,0.22)+(e.tiltX||0)-e.body.rotation.x)*Math.min(1,dt*6); e.body.rotation.z+=(clamp(-(e.yaw||0)*0.05,-0.15,0.15)-e.body.rotation.z)*Math.min(1,dt*6);
  e.flash=Math.max(0,e.flash-dt*7); const lk=AIM.lockE===e?0.22:0, f=Math.max(e.flash,lk);
  for(const m of e.mats) m.emissive.setRGB(f,e.flash>lk?f:f*0.55,e.flash>lk?f:f*0.25);
  if(e.wc&&!e.spear&&dt>0) walkUpdate(e,dt); legRender(e); }
function eyeColor(e,red,blink){ const c=red?EYE_RED:P.glow; const k=blink?((performance.now()%260)<130?1:0.25):1; if(e.eyeM) e.eyeM.color.setRGB(c[0]*k,c[1]*k,c[2]*k); }
function enemiesUpdate(dt){ const live=!LOC.safe&&!transit&&!TK.dead&&!helpOpen&&!mcOpen;
  for(const e of ENEMIES){ if(e.dead) continue; const px=e.x, pz=e.z, ph=e.h; e.ramCD=Math.max(0,(e.ramCD||0)-dt); e.hurtT=Math.max(0,(e.hurtT||0)-dt); e.aimImm=Math.max(0,(e.aimImm||0)-dt); if(live){ const ps=sndAt(e.x,e.z); try{ ETYPE[e.type].update(e,dt); } catch(err){ enemyCrash(e,err); } finally{ sndOff(ps); } } else { eBrake(e,dt); if(e.wc&&e.state!=='onTank'&&!e.yOv) e.yOv=null; } if(!(isFinite(e.x)&&isFinite(e.z))){ e.x=px; e.z=pz; e.vx=e.vz=e.kx=e.kz=0; } if(!isFinite(e.h)) e.h=isFinite(ph)?ph:0; if(!isFinite(e.vx+e.vz)) e.vx=e.vz=0; if(!e.dead) eRender(e,dt); }
  eSeparate(); for(let i=ENEMIES.length-1;i>=0;i--) if(ENEMIES[i].dead) ENEMIES.splice(i,1); }

/* ================= 1. JIAN — melee jumper ================= */

/* ================= 2. BOMB — rolling kamikaze ================= */
function bombBoom(e){ if(e.dead) return; e.dead=true; e.lockable=false; explode(e.x,0.55,e.z,1.35,1.1,0,-1,0,'shell',null,0,e); eRemove(e); }
function dieBomb(e,dx,dz,src){ e.dead=false; bombBoom(e); dropScrap(e.x,e.z,4,0.8); }

/* ================= 3. HIVE — bomb mother ================= */
function launchBomb(h){ const a=Math.atan2(TK.x-h.x,TK.z-h.z)+(rnd()-0.5)*1.4, dist=4.5+rnd()*4, T=0.9, tx=h.x+Math.sin(a)*dist, tz=h.z+Math.cos(a)*dist;
  const b=newEnemy('bomb',h.x,h.z); buildE(b); b.state='fly'; b.fy=h.y+3.3; b.fv={x:(tx-h.x)/T,z:(tz-h.z)/T,y:(0.62-3.3)/T+0.5*G*T}; b.aggro=true; b.noCol=true; b.h=a; h.bombs.push(b); sfxRocket(); }
function dieHive(e,dx,dz,src){ const x=e.x, z=e.z; deathFx(x,2,z,2.2); explode(x,1.6,z,2.6,1.6,0,-1,0,'shell',null,1.5,e);
  const n=2+Math.min(3,5-e.bombs.length); for(let k=0;k<n;k++) later(0.18+k*0.17,()=>{ const a=rnd()*TAU, r=1+rnd()*2; explode(x+Math.cos(a)*r,0.8,z+Math.sin(a)*r,1.4,1.1,0,-1,0,'shell',null,0,null); });
  for(const g of e.hpet){ const c=new THREE.Vector3(); g.getWorldPosition(c); gibMeshes([g],c,null,(rnd()-0.5)*10,7+rnd()*5,(rnd()-0.5)*10,0.3); }
  dropScrap(x,z,40,2); eRemove(e); }

/* ================= 4. FACTORY — walking spawner with drones ================= */
function dieFactory(e,dx,dz,src){ deathFx(e.x,e.y,e.z,2.6); explode(e.x,e.y-1,e.z,2.8,1.5,0,-1,0,'shell',null,1.4,e); later(0.25,()=>explode(e.x+1,1.5,e.z-1,1.8,1,0,-1,0,'shell',null,0,null));
  legGibs(e,dx,dz,null,4); bodyGib(e,null,dx,dz,2,1.4); for(const d of DRONES) if(d.f===e&&!d.dead) droneDie(d,(rnd()-0.5),(rnd()-0.5),true); dropScrap(e.x,e.z,100,3); eRemove(e); }
function dronesUpdate(dt){ for(let i=DRONES.length-1;i>=0;i--){ const d=DRONES[i]; if(d.dead){ DRONES.splice(i,1); continue; } const f=d.f; d.t+=dt;
  let tx=f.x, tz=f.z, ty=f.y+3.5;
  if(d.state==='orbit'){ d.ang+=dt*0.8; tx=f.x+Math.cos(d.ang)*4.5; tz=f.z+Math.sin(d.ang)*4.5; ty=f.y+3.2;
    if(d.t>0.5){ let best=null,bd=48; for(const p of PICKUPS){ if(p.kind!=='part'||p.claimed) continue; const dd=Math.hypot(p.x-f.x,p.z-f.z); if(dd<bd){ bd=dd; best=p; } } if(best){ best.claimed=d; d.target=best; d.state='fetch'; } } }
  else if(d.state==='fetch'){ const p=d.target; if(!PICKUPS.includes(p)){ d.target=null; d.state='orbit'; }
    else { tx=p.x; tz=p.z; const hd=Math.hypot(tx-d.x,tz-d.z); ty=hd<1.5?p.y+0.8:Math.max(4,colTop(d.x,d.z)+1.5,colTop(tx,tz)+1.5);
      if(hd<0.7&&Math.abs(d.y-(p.y+0.8))<0.6){ PICKUPS.splice(PICKUPS.indexOf(p),1); d.carry=p; d.state='return'; } } }
  else if(d.state==='return'){ ty=Math.max(f.y+4.2,colTop(d.x,d.z)+1.5); if(Math.hypot(tx-d.x,tz-d.z)<0.7&&Math.abs(d.y-ty)<0.7){ d.state='drop'; d.t=0; f.hatchT=1.2; } }
  else if(d.state==='drop'){ ty=f.y+4.2; if(d.carry){ d.carry.m.position.y-=dt*5; } if(d.t>0.55){ if(d.carry){ f.parts[d.carry.part]=(f.parts[d.carry.part]||0)+1; scene.remove(d.carry.m); d.carry=null; } d.state='orbit'; d.t=0; } }
  if(d.state!=='orbit'&&d.state!=='fetch') ty=Math.max(ty,f.y+4.2);
  const ax=(tx-d.x)*3-d.vx*2.2, ay=(ty-d.y)*4-d.vy*2.6, az=(tz-d.z)*3-d.vz*2.2; d.vx+=ax*dt; d.vy+=ay*dt; d.vz+=az*dt; const sp=Math.hypot(d.vx,d.vz); if(sp>8){ d.vx*=8/sp; d.vz*=8/sp; }
  d.x+=d.vx*dt; d.y+=d.vy*dt; d.z+=d.vz*dt; d.g.position.set(d.x,d.y+Math.sin(d.t*4+i)*0.05,d.z); d.g.rotation.set(d.vz*0.07,Math.atan2(d.vx,d.vz),-d.vx*0.07,'YXZ');
  for(const r of d.rot) r.rotation.y+=dt*40; d.flash=Math.max(0,d.flash-dt*7); for(const m of d.mats) m.emissive.setRGB(d.flash,d.flash,d.flash);
  if(d.carry&&d.state!=='drop') d.carry.m.position.set(d.x,d.y-0.55,d.z); } }

/* ================= 5. BULL — braced gunner ================= */
const _mz=new THREE.Vector3();
function dieBull(e,dx,dz,src){ deathFx(e.x,e.y,e.z,1.6); legGibs(e,dx,dz,null,5); bodyGib(e,null,dx,dz,4,0.7); dropScrap(e.x,e.z,25,e.y); if(rnd()<0.22) makePickup('ammo',e.x+(rnd()-0.5)*2,e.z+(rnd()-0.5)*2,0); eRemove(e); }

/* ================= 6. LAMP — sniper disguised as a streetlight ================= */
const _lp=new THREE.Vector3();
function lampLOS(ax,ay,az,bx,by,bz){ // thin walls pass, thick block
  const dx=bx-ax,dy=by-ay,dz=bz-az, L=Math.hypot(dx,dy,dz), st=VS*0.5, n=Math.ceil(L/st); let run=0, tot=0;
  for(let i=1;i<n;i++){ const t=i/n, x=ax+dx*t, y=ay+dy*t, z=az+dz*t; if(y<0) return {clear:false,t}; const s=get(Math.floor(x/VS),Math.floor(y/VS),Math.floor(z/VS)); if(s) return {clear:false,t}; }
  return {clear:true,t:1}; }
function updLamp(e,dt){ const dx=TK.x-e.x, dz=TK.z-e.z, d=Math.max(1e-3,Math.hypot(dx,dz)); e.t+=dt; e.g.updateMatrixWorld(true); e.lampPos.getWorldPosition(_lp);
  const tY=TK.y+1.3; let see=false; if(d<(STL.on?Math.min(22,STL_R[UP.abl|0]):22)&&!TK.dead){ e.losT=(e.losT||0)-dt; if(e.losT<=0){ e.losT=0.25; e.seeC=lampLOS(_lp.x,_lp.y,_lp.z,TK.x,tY,TK.z).clear; } see=e.seeC; if(see&&!e.seenL&&STL.on) stealthSpotted(); e.seenL=see; }
  let heatT=0;
  switch(e.state){
  case 'disguise': eBrake(e,dt,4); e.idleT=(e.idleT||0)+dt; if(!see&&e.idleT>20){ e.idleT=0; const p=pickNear(e.x+(rnd()-0.5)*24,e.z+(rnd()-0.5)*24,1.2); if(p){ e.state='move'; e.t=0; e.mv={x:p[0],z:p[1]}; } break; } if(see){ e.idleT=0; e.state='charge'; e.t=0; e.aggro=true; e.bx=TK.x; e.by=tY; e.bz=TK.z; sfxCharge(1); } break;
  case 'charge': eBrake(e,dt,4); heatT=1; if(!see){ e.lostC=(e.lostC||0)+dt; if(e.lostC>0.5){ e.state='disguise'; e.t=0; e.lostC=0; e.idleT=0; break; } } else e.lostC=0; e.bx+=(TK.x-e.bx)*Math.min(1,dt*2.6); e.by+=(tY-e.by)*Math.min(1,dt*2.6); e.bz+=(TK.z-e.bz)*Math.min(1,dt*2.6);
    { const k=Math.min(1,e.t/1.5), R=EYE_RED; LINES.push(_lp.x,_lp.y,_lp.z,e.bx,e.by,e.bz,R[0]*k*0.7,R[1]*k*0.7,R[2]*k*0.7,0.3); }
    if(e.t>1.5){ beamShot(e); e.state='cool'; e.t=0; e.shots++; } break;
  case 'cool': eBrake(e,dt,4); heatT=0.6; if(e.t>2.2){ if(e.shots>=3){ e.state='move'; e.t=0; e.shots=0; let tgt=null; for(let k=0;k<12;k++){ const a=rnd()*TAU, r=6+rnd()*6, x=e.x+Math.cos(a)*r, z=e.z+Math.sin(a)*r; if(eFree(x,z,1.2)){ tgt={x,z}; break; } } e.mv=tgt||{x:e.x,z:e.z}; } else e.state=see?'charge':'disguise'; e.t=0; if(e.state==='charge'){ e.bx=TK.x; e.by=tY; e.bz=TK.z; } } break;
  case 'move': heatT=0.3; navMove(e,e.mv.x,e.mv.z,e.speedW,dt); if(Math.hypot(e.mv.x-e.x,e.mv.z-e.z)<1.2||e.t>9){ e.state='disguise'; e.t=0; } break; }
  eIntegrate(e,dt);
  e.heat+=(heatT-e.heat)*Math.min(1,dt*3); const lc=P.lamp, h=e.heat, c=[lerp(lc[0],EYE_RED[0],h),lerp(lc[1],EYE_RED[1],h),lerp(lc[2],EYE_RED[2],h)];
  e.eyeM.color.setRGB(...c); e.halo.material.color.setRGB(...c); e.pool.material.color.setRGB(...c); e.halo.position.copy(_lp); e.pool.position.set(_lp.x,groundH(_lp.x,_lp.z)+0.04,_lp.z);
  if(e.beamT>0){ e.beamT-=dt; const k=e.beamT/0.18, R=mix3(EYE_RED,[1,1,1],0.5); LINES.push(e.b0.x,e.b0.y,e.b0.z,e.b1.x,e.b1.y,e.b1.z,R[0]*k,R[1]*k,R[2]*k,1); } }
function beamShot(e){ const ax=_lp.x, ay=_lp.y, az=_lp.z; let dx=e.bx-ax, dy=e.by-ay, dz=e.bz-az; const L0=Math.hypot(dx,dy,dz); dx/=L0; dy/=L0; dz/=L0; const L=Math.min(48,L0+6), st=VS*0.5;
  let run=0, tot=0, endT=L, punched=0; const tt=segSphere(ax,ay,az,dx,dy,dz,L,TK.x,TK.y+1.25,TK.z,1.45);
  for(let s=st;s<L;s+=st){ const x=ax+dx*s, y=ay+dy*s, z=az+dz*s; if(y<0){ endT=s; break; } if(tt>=0&&s>=tt){ endT=tt; break; } const cx=Math.floor(x/VS), cy=Math.floor(y/VS), cz=Math.floor(z/VS), m=get(cx,cy,cz);
    if(m){ run+=st; tot+=st; if(run>0){ endT=s; explode(x,y,z,0.6,0.6,dx,dy,dz,'bullet',null); break; } if(punched<40){ grid[gi(cx,cy,cz)]=0; markDirty(cx,cy,cz); punched++; voxelColor(m,cx,cy,cz,col); debSpawn(x,y,z,dx*6+(rnd()-0.5)*3,2+rnd()*3,dz*6+(rnd()-0.5)*3,col[0],col[1],col[2],VS*0.8); } } else run=0; }
  if(tt>=0&&endT>=tt-0.01){ damageTank(22,ax-TK.x,az-TK.z,0); const R=mix3(EYE_RED,[1,1,1],0.4); for(let k=0;k<14;k++) spark(ax+dx*tt,ay+dy*tt,az+dz*tt,(rnd()-0.5)*8,rnd()*5,(rnd()-0.5)*8,R[0],R[1],R[2],0.4); shake=Math.min(1,shake+0.25); }
  e.b0={x:ax,y:ay,z:az}; e.b1={x:ax+dx*endT,y:ay+dy*endT,z:az+dz*endT}; e.beamT=0.18; sfxBeam(); }
function lampLegBreak(e,li,px,pz){ const L=e.legs[li]; if(!L||!L.alive||e.dead) return; const dx=e.x-px, dz=e.z-pz, l=Math.hypot(dx,dz)||1; killEnemy(e,dx/l,dz/l,'leg'); }
function dieLamp(e,dx,dz,src){ legGibs(e,dx,dz,null,3); scene.remove(e.halo); scene.remove(e.pool); const fa=Math.atan2(dx||rnd()-0.5,dz||rnd()-0.5);
  e.g.updateMatrixWorld(true); const D=e.mats[0]; const pole=new THREE.Mesh(EGEO.box,D); pole.scale.set(0.22,6.1,0.22); pole.position.set(0,-3.05,0); e.body.add(pole);
  FALLERS.push({e,px:e.x,pz:e.z,py:groundH(e.x,e.z),fa,th:0.05,w:0.4,H:e.y-groundH(e.x,e.z)}); deathFx(e.x,e.y,e.z,0.8); sfxCreak(); }
function fallersUpdate(dt){ for(let i=FALLERS.length-1;i>=0;i--){ const f=FALLERS[i], e=f.e; f.w+=Math.sin(f.th)*3.2*dt; f.th+=f.w*dt;
  const th=Math.min(f.th,Math.PI/2), sx=Math.sin(f.fa), sz=Math.cos(f.fa); e.g.position.set(f.px+sx*Math.sin(th)*f.H,f.py+Math.cos(th)*f.H,f.pz+sz*Math.sin(th)*f.H);
  e.g.rotation.set(0,0,0); e.g.rotateOnWorldAxis(new THREE.Vector3(sz,0,-sx),th);
  if(f.th>=Math.PI/2){ for(let k=1;k<=4;k++){ const r=f.H*k/4; later(k*0.06,()=>explode(f.px+sx*r,0.8,f.pz+sz*r,1.2,0.8,0,-1,0,'shell',null,0,null)); }
    shake=Math.min(1,shake+0.4); dropScrap(f.px+sx*f.H*0.8,f.pz+sz*f.H*0.8,30,1); const c=new THREE.Vector3(); e.body.getWorldPosition(c); gibMeshes([e.body],c,null,sx*2,3,sz*2,0.4); scene.remove(e.g); scene.remove(e.lg); FALLERS.splice(i,1); } } }

function eIntegrate(e,dt){
  if(!eFree(e.x,e.z,e.r*0.85)){ e.unst=(e.unst||0)+dt; if(e.unst>0.25){ const s=freeSpot(e.x,e.z,e.r); const dx=s[0]-e.x, dz=s[1]-e.z, l=Math.hypot(dx,dz); if(l>0.01){ const st=Math.min(l,4*dt+0.02); e.x+=dx/l*st; e.z+=dz/l*st; } e.vx*=0.5; e.vz*=0.5; return; } } else e.unst=0;
  const vx=e.vx+e.kx, vz=e.vz+e.kz; let nx=e.x+vx*dt, nz=e.z+vz*dt;
  if(!eFree(nx,e.z,e.r)){ nx=e.x; e.vx*=0.2; e.kx*=-0.3; } if(!eFree(nx,nz,e.r)){ nz=e.z; e.vz*=0.2; e.kz*=-0.3; }
  e.x=nx; e.z=nz; const kd=Math.exp(-4*dt); e.kx*=kd; e.kz*=kd; e.slow=Math.max(0,e.slow-dt*0.7); }
/* damage multipliers [front, side, rear] — the heavy ones should be flanked */
const ARMZ={bull:[0.55,1.0,1.6],katok:[0.4,1.35,1.7],zont:[0.6,1.15,1.5],factory:[0.7,1.0,1.45],jian:[0.85,1.0,1.3],lamp:[0.9,1.0,1.35]};
function armFx(e,k,ux,uz){ if(k>0.8&&k<1.2) return; const now=performance.now(); if(now-(e.azT||0)<90) return; e.azT=now; const R=(e.hr||e.r||0.8)*0.9, x=e.x-ux*R, y=e.y+(e.hy||0.6)+0.1, z=e.z-uz*R;
  const ps=sndAt(x,z);
  if(k<=0.8){ for(let n=0;n<8;n++){ const a=Math.atan2(-uz,-ux)+(rnd()-0.5)*2.2; spark(x,y,z,Math.cos(a)*(5+rnd()*5),1.5+rnd()*4,Math.sin(a)*(5+rnd()*5),0.85,0.92,1,0.14+rnd()*0.12); }
    sO(2400+rnd()*900,1500,0.16,0.07,'triangle'); sO(3600+rnd()*600,2900,0.08,0.04,'sine'); sNz(0.05,'highpass',6000,1,0.05); }
  else { for(let n=0;n<10;n++) spark(x,y,z,(rnd()-0.5)*6,1+rnd()*5,(rnd()-0.5)*6,1,0.55+rnd()*0.25,0.15,0.25+rnd()*0.2); FIRE.spawn(x,y,z,0,0.8,0,0.55,1.2,0.12,1,0.7,0.35,0.6);
    sNz(0.18,'lowpass',700,0.8,0.22); sO(160,60,0.14,0.14,'square'); sNz(0.1,'bandpass',2200,2,0.08); }
  sndOff(ps); }
function enemyHit(e,dmg,dx,dz,kb,src){ if(e.dead||dmg<=0) return; if(e.inv){ if(src!=='area'&&(dx||dz)){ const l=Math.hypot(dx,dz)||1; armFx(e,0.5,dx/l,dz/l); } return; }
  const AZ=ARMZ[e.type]; if(AZ&&src!=='ram'&&src!=='area'&&(dx||dz)){ const l=Math.hypot(dx,dz)||1, f=(Math.sin(e.h)*dx+Math.cos(e.h)*dz)/l, k=f<-0.38?AZ[0]:f>0.38?AZ[2]:AZ[1]; dmg*=k; armFx(e,k,dx/l,dz/l); }
  if(e.onHit) e.onHit(e,dmg,dx,dz,src); e.hp-=dmg; e.flash=1; e.slow=Math.min(1,e.slow+Math.min(0.5,dmg/40)); const inv=1/(e.mass||1); e.kx+=dx*(kb||0)*inv; e.kz+=dz*(kb||0)*inv; e.aggro=true; e.hurtT=3; e.last={x:TK.x,z:TK.z}; e.lostT=0;
  if(e.type==='bull'&&e.hp>0&&(e.aimImm||0)<=0&&['brace','laser','fire'].includes(e.state)){ e.aimImm=1.3; e.state='brace'; e.t=0.15; e.shots=0; e.h+=(rnd()-0.5)*0.5; if(e.aim){ e.aim.x+=(rnd()-0.5)*6; e.aim.z+=(rnd()-0.5)*6; } sparkBurst(e.x,e.y+0.5,e.z,6); }
  if(e.hp<=0) killEnemy(e,dx,dz,src); }
function sparkBurst(x,y,z,n){ const sc=mix3(P.glow,[1,1,1],0.5); for(let k=0;k<n;k++) spark(x,y,z,(rnd()-0.5)*8,rnd()*6,(rnd()-0.5)*8,sc[0],sc[1],sc[2],0.25+rnd()*0.2); }
function killEnemy(e,dx,dz,src){ if(e.dead) return; e.dead=true; e.lockable=false; e.flash=0; for(const m of e.mats) m.emissive.setRGB(0,0,0); if(e.shadow) e.shadow.visible=false;
  ETYPE[e.type].die(e,dx||0,dz||0,src); onKill(e); fxKill(e); }

/* ================= 1. JIAN — melee jumper ================= */
function jianSpear(e,tipY,spread){ const fx=Math.sin(e.h)*0.15, fz=Math.cos(e.h)*0.15; let k=0; for(const L of e.legs){ if(!L.alive) continue; const a=k*1.57+0.8; L.foot.set(e.x+fx+Math.sin(a)*spread,tipY,e.z+fz+Math.cos(a)*spread); L.t=-1; k++; } }
function jianLeap(e,x,z,arc,kind,T){ if(!eFree(x,z,e.r*0.9)){ const s=freeSpot(x,z,e.r); x=s[0]; z=s[1]; } e.state='jump'; e.t=0; e.j0={x:e.x,z:e.z,y:e.y}; e.jt={x,z}; e.arc=arc; e.jkind=kind; e.jT=T||0.75; e.vx=e.vz=0; e.h=Math.atan2(x-e.x,z-e.z); sfxJump(); }
function jianTryHop(e,tx,tz){ e.hopCD=1.3; const dx=tx-e.x, dz=tz-e.z, L=Math.hypot(dx,dz)||1, ux=dx/L, uz=dz/L; let blocked=false, top=0;
  for(let s=0.8;s<=Math.min(9,L+2);s+=0.4){ const x=e.x+ux*s, z=e.z+uz*s; if(!eFree(x,z,0.55)){ blocked=true; top=Math.max(top,colTop(x,z)); if(top>2.7) return false; }
    else if(blocked&&eFree(x,z,e.r)){ jianLeap(e,x+ux*0.5,z+uz*0.5,Math.max(2.2,top+1.5),'hop',0.7); return true; } }
  return false; }
function jianDodge(e,d){ if(e.dodgeCD>0||d>8.5||d<1.8) return false; const sp=Math.hypot(TK.vx,TK.vz); if(sp<6.5) return false; const ux=(e.x-TK.x)/d, uz=(e.z-TK.z)/d; if((TK.vx*ux+TK.vz*uz)/sp<0.75) return false;
  e.dodgeCD=2.8; if(rnd()>=0.3) return false; jianLeap(e,TK.x-ux*4.4+TK.vx*0.5,TK.z-uz*4.4+TK.vz*0.5,4.8,'dodge',0.68); return true; }
function updJian(e,dt){ const dx=TK.x-e.x, dz=TK.z-e.z, d=Math.max(1e-3,Math.hypot(dx,dz)); e.t+=dt; ePerceive(e,dt,28,0.6); e.spear=false; e.yOv=null; e.crouch=0; e.onTank=false;
  e.dodgeCD=Math.max(0,(e.dodgeCD||0)-dt); e.hopCD=Math.max(0,(e.hopCD||0)-dt); let mk=0;
  switch(e.state){
  case 'idle': if(e.aggro){ e.state='chase'; break; } ePatrol(e,dt,1.7); if(e.hopCD<=0&&eStuck(e,dt)&&e.wp) jianTryHop(e,e.wp.x,e.wp.z); break;
  case 'chase': { if(!e.aggro){ e.state='idle'; break; } if(jianDodge(e,d)) break;
    const tx=e.sees||!e.last?TK.x:e.last.x, tz=e.sees||!e.last?TK.z:e.last.z;
    if(d<3.4&&e.sees) eMove(e,e.x-dx/d*5,e.z-dz/d*5,e.speedW*0.8,dt);
    else { const r=navMove(e,tx,tz,e.speedW,dt); if(e.hopCD<=0&&(eStuck(e,dt)||(r!==1&&d<14&&rnd()<dt*0.8))) jianTryHop(e,tx,tz); }
    e.cd-=dt;
    if(e.sees&&d<8.5&&d>2.8&&e.cd<=0){ e.state='aim'; e.t=0; let px=TK.x+TK.vx*0.8, pz=TK.z+TK.vz*0.8; const pd=Math.hypot(px-e.x,pz-e.z); if(pd>10){ px=e.x+(px-e.x)/pd*10; pz=e.z+(pz-e.z)/pd*10; }
      if(!eFree(px,pz,0.6)&&Math.hypot(px-TK.x,pz-TK.z)>2){ const s=freeSpot(px,pz,0.8); px=s[0]; pz=s[1]; } e.jt={x:px,z:pz}; sfxCharge(0.5); } break; }
  case 'aim': eBrake(e,dt,8); e.h=turnTo(e.h,Math.atan2(e.jt.x-e.x,e.jt.z-e.z),6*dt); e.crouch=Math.min(1,e.t/0.6); mk=Math.min(1,e.t/0.85);
    if(e.t>0.85){ e.state='jump'; e.t=0; e.j0={x:e.x,z:e.z,y:e.y}; e.vx=e.vz=0; e.arc=3.4; e.jkind='strike'; e.jT=0.6; sfxJump(); } break;
  case 'jump': { const T=e.jT||0.6, k=Math.min(1,e.t/T); e.x=lerp(e.j0.x,e.jt.x,k); e.z=lerp(e.j0.z,e.jt.z,k); const gy=groundH(e.x,e.z); e.yOv=lerp(e.j0.y,gy+(e.jkind==='strike'?1.6:e.wc.bodyH),k)+Math.sin(Math.PI*k)*(e.arc||3.4);
    const strike=e.jkind==='strike'; e.spear=true; jianSpear(e,e.yOv-(strike?1.75:1.1),strike?0.06:0.3+0.25*Math.sin(Math.PI*k)); mk=strike?1:0; if(!strike) e.tiltX=-0.5*Math.sin(Math.PI*k);
    if(k>=1){ e.tiltX=0;
      if(!strike){ e.state='land'; e.t=0; e.yOv=null; sfxThud(0.35); for(const L of e.legs){ L.foot.y=groundH(L.foot.x,L.foot.z); } dustAt(e.x,e.z,0.8); break; }
      const td=Math.hypot(TK.x-e.x,TK.z-e.z); if(td<2.1&&!TK.dead&&!ENEMIES.some(o=>o!==e&&o.state==='onTank')){ e.state='onTank'; e.t=0; e.hitT=0.5; damageTank(10,0,0,1); sfxClang(); }
      else { e.state='stuck'; e.t=0; craterAt(e.x,e.z,0.8,0.18); smashAround(e.x,e.z,0.7,1.2,1.5); sfxThud(0.6); } } break; }
  case 'land': eBrake(e,dt,10); e.crouch=Math.max(0,0.6-e.t*2); if(e.t>0.3){ e.state=e.aggro?'chase':'idle'; e.cd=Math.max(e.cd,0.6); } break;
  case 'onTank': { e.onTank=true; e.x=TK.x; e.z=TK.z; e.h=turnTo(e.h,TK.h,3*dt); e.hitT-=dt; const PER=0.62, p=clamp(1-e.hitT/PER,0,1), base=TK.y+2.95;
    /* three legs braced on the roof, the fourth winds up and stamps */
    const fx=Math.sin(e.h), fz=Math.cos(e.h), up=p<0.62?Math.sin(p/0.62*Math.PI/2)*1.35:1.35*Math.pow(1-(p-0.62)/0.38,2), back=p<0.62?-0.35*p/0.62:-0.35+(p-0.62)/0.38*1.25;
    let k=0, strike=null; for(const L of e.legs){ if(!L.alive) continue; if(!strike){ strike=L; L.foot.set(e.x+fx*(0.55+back)+fz*0.25,base+up,e.z+fz*(0.55+back)-fx*0.25); L.t=-1; continue; } const a=e.h+Math.PI*0.75+k*Math.PI*0.5; L.foot.set(e.x+Math.sin(a)*0.8,base,e.z+Math.cos(a)*0.8); L.t=-1; k++; }
    const bob=p>0.9?-0.22*(1-(p-0.9)/0.1):0; e.yOv=base+1.2+bob+Math.sin(p*Math.PI)*0.12; e.spear=true; e.tiltX=p<0.62?-0.22*p/0.62:0.3*(1-(p-0.62)/0.38)-0.05;
    if(e.hitT<=0){ e.hitT=PER; damageTank(6,0,0,1); sfxClang(); sfxThud(0.6); shake=Math.min(1,shake+0.18); const hx=strike?strike.foot.x:TK.x, hz=strike?strike.foot.z:TK.z;
      for(let k=0;k<16;k++){ const a=rnd()*TAU, sp=3+rnd()*7; spark(hx,base+0.05,hz,Math.cos(a)*sp,2+rnd()*5,Math.sin(a)*sp,1,0.8+rnd()*0.15,0.4,0.25+rnd()*0.25); }
      FIRE.spawn(hx,base+0.1,hz,0,0.5,0,1.1,2.5,0.09,1,1,0.85,0.5); sparkBurst&&sparkBurst(hx,base+0.05,hz,8); }
    if(((TK.load>0.45&&TK.aL>4)||Math.abs(TK.vF)>5||Math.abs(TK.yaw)>1.3||TK.air)&&e.t>0.25){ e.state='fall'; e.t=0; e.fv={x:-TK.vx*0.5+(rnd()-0.5)*3,y:4,z:-TK.vz*0.5+(rnd()-0.5)*3}; e.fy=e.yOv; } break; }
  case 'fall': { e.fv.y-=G*dt; const nx=e.x+e.fv.x*dt, nz=e.z+e.fv.z*dt; if(eFree(nx,nz,0.4)){ e.x=nx; e.z=nz; } else { e.fv.x*=-0.3; e.fv.z*=-0.3; } e.fy+=e.fv.y*dt; e.yOv=e.fy; e.spear=true; jianSpear(e,e.fy-1.55,0.35);
    const gy=groundH(e.x,e.z)+e.wc.bodyH; if(e.fy<=gy&&e.fv.y<0){ e.state='stun'; e.t=0; e.yOv=null; if(!e.born) enemyHit(e,8,0,0,0,'area'); e.born=false; sfxThud(0.5); dustAt(e.x,e.z,1); for(const L of e.legs){ L.foot.y=groundH(L.foot.x,L.foot.z); } } break; }
  case 'stuck': eBrake(e,dt,20); e.spear=true; e.yOv=groundH(e.x,e.z)+1.5; jianSpear(e,groundH(e.x,e.z)-0.25,0.05); e.tiltX=0.25; if(e.t>1.1){ e.state='chase'; e.cd=1.2+rnd(); e.tiltX=0; } break;
  case 'stun': eBrake(e,dt,8); if(e.t>1.0){ e.state=e.aggro?'chase':'idle'; e.cd=0.8; } break; }
  if(!['jump','onTank','fall'].includes(e.state)) eIntegrate(e,dt);
  eyeColor(e,['aim','jump','onTank'].includes(e.state)||(e.state==='chase'&&d<10&&e.sees),e.state==='aim');
  if(e.marker){ e.marker.material.opacity=mk*(0.55+0.35*Math.sin(performance.now()*0.025)); e.marker.visible=mk>0;
    if(mk>0){ e.marker.position.set(e.jt.x,groundH(e.jt.x,e.jt.z)+0.06,e.jt.z); const s=e.state==='aim'?lerp(2.2,1,mk):1; e.marker.scale.setScalar(s); } } }
function dieJian(e,dx,dz,src){ const c=new THREE.Vector3(e.x,e.y+0.4,e.z); deathFx(c.x,c.y,c.z,1); legGibs(e,dx,dz,'leg',6); bodyGib(e,'torso',dx,dz,5,0.55); if(!e.noScrap) dropScrap(e.x,e.z,e.wave?3:6,e.y); eRemove(e); }
function dustAt(x,z,k){ const dc=mix3(P.side,[1,1,1],0.15); for(let n=0;n<5*k;n++) SMOKE.spawn(x+(rnd()-0.5)*1.5*k,groundH(x,z)+0.2,z+(rnd()-0.5)*1.5*k,(rnd()-0.5)*2.5,0.5+rnd(),(rnd()-0.5)*2.5,0.9*k,1.5,1,0.4,dc[0],dc[1],dc[2]); }

/* ================= 2. BOMB — rolling kamikaze ================= */
function updBomb(e,dt){ const dx=TK.x-e.x, dz=TK.z-e.z, d=Math.max(1e-3,Math.hypot(dx,dz)); e.t+=dt; e.yOv=null; e.spear=false; if(e.state!=='fly') ePerceive(e,dt,30,0.3);
  switch(e.state){
  case 'fly': { e.fv.y-=G*dt; e.x+=e.fv.x*dt; e.z+=e.fv.z*dt; e.fy+=e.fv.y*dt; e.yOv=e.fy; e.spear=true; for(const L of e.legs){ _h3.copy(L.hip).applyMatrix4(e.body.matrixWorld); L.foot.set(_h3.x,e.fy-0.3,_h3.z); }
    const gy=groundH(e.x,e.z)+0.62; if(e.fy<=gy&&e.fv.y<0){ e.state='walk'; e.t=0; e.noCol=false; e.yOv=null; const s=freeSpot(e.x,e.z,0.55); e.x=s[0]; e.z=s[1]; const ch=Math.cos(e.h), sh=Math.sin(e.h); for(const L of e.legs){ L.foot.set(e.x+L.rest[0]*ch+L.rest[1]*sh,0,e.z-L.rest[0]*sh+L.rest[1]*ch); L.foot.y=groundH(L.foot.x,L.foot.z); L.t=-1; } sfxThud(0.3); } break; }
  case 'idle': case 'walk': if(e.aggro){ const tx=e.sees||!e.last?TK.x:e.last.x, tz=e.sees||!e.last?TK.z:e.last.z; navMove(e,tx,tz,e.speedW,dt);
      if(e.sees&&d<11&&e.t>0.6&&navClear(e.x,e.z,TK.x,TK.z,0.45)){ e.state='warn'; e.t=0; e.bp=0; } } else ePatrol(e,dt,1.2); break;
  case 'warn': eBrake(e,dt,10); e.bp-=dt; if(e.bp<=0){ e.bp=0.16; sO(1500,1500,0.07,0.07,'square'); } if(e.t>0.65){ e.state='curl'; e.t=0; sfxCharge(0.4); } break;
  case 'curl': eBrake(e,dt,10); e.curl=true; e.crouch=Math.min(1,e.t/0.35)*0.5; if(e.t>0.4){ e.state='roll'; e.t=0; e.h=Math.atan2(dx,dz); e.rs=2; bombLegsVis(e,false); } break;
  case 'roll': { e.h=turnTo(e.h,Math.atan2(dx,dz),1.5*dt); e.rs=Math.min(13,e.rs+18*dt)*(1-0.4*e.slow); e.vx=Math.sin(e.h)*e.rs; e.vz=Math.cos(e.h)*e.rs; e.spin+=e.rs*dt/0.45;
    e.yOv=groundH(e.x,e.z)+0.45; e.spear=true; const nx=e.x+(e.vx+e.kx)*dt, nz=e.z+(e.vz+e.kz)*dt;
    if(!eFree(nx,nz,0.5)){ if(e.rs>5){ bombBoom(e); return; } e.vx=e.vz=0; } else { e.x=nx; e.z=nz; } e.kx*=Math.exp(-4*dt); e.kz*=Math.exp(-4*dt);
    smashAround(e.x+e.vx*0.05,e.z+e.vz*0.05,0.55,0.9,0.7); if(d<1.9){ bombBoom(e); return; } if(rnd()<0.5){ const dc=mix3(P.side,[1,1,1],0.15); SMOKE.spawn(e.x,0.2,e.z,0,0.4,0,0.5,1.4,0.6,0.3,dc[0],dc[1],dc[2]); }
    if(e.t>3){ e.state='uncurl'; e.t=0; bombLegsVis(e,true); const ch=Math.cos(e.h), sh=Math.sin(e.h); for(const L of e.legs){ L.foot.set(e.x+L.rest[0]*0.3*ch+L.rest[1]*0.3*sh,0,e.z-L.rest[0]*0.3*sh+L.rest[1]*0.3*ch); L.foot.y=groundH(L.foot.x,L.foot.z); L.t=-1; } } break; }
  case 'uncurl': eBrake(e,dt,6); e.curl=e.t<0.2; e.crouch=Math.max(0,0.5-e.t); if(e.t>0.45){ e.state='walk'; e.t=0; } break; }
  if(['walk','idle','warn','curl','uncurl'].includes(e.state)) eIntegrate(e,dt);
  { const st=e.state, on=st==='warn'?((e.t*9)%1<0.5):(st==='curl'||st==='roll')?((e.t*5)%1<0.6):false; e.lampM.color.setHex(on?0xff2414:0x3a0606); }
  e.ball.rotation.x=e.spin; eyeColor(e,e.state==='curl'||e.state==='roll',e.state==='roll'&&d<5); }

/* ================= 3. HIVE — bomb mother ================= */
function updHive(e,dt){ e.t+=dt; const d=Math.hypot(TK.x-e.x,TK.z-e.z); ePerceive(e,dt,34,3.1); e.bombs=e.bombs.filter(b=>!b.dead);
  if(e.aggro){ if(e.state==='idle'){ e.cd-=dt; if(e.cd<=0&&e.bombs.length<5){ e.state='open'; e.t=0; sfxHatch(); } }
    else if(e.state==='open'){ e.open=Math.min(1,e.t/0.6); if(e.t>1.0){ launchBomb(e); e.state='close'; e.t=0; } }
    else if(e.state==='close'){ e.open=Math.max(0,1-e.t/0.5); if(e.t>0.5){ e.state='idle'; e.cd=5+rnd()*1.5; } } }
  else if(e.state!=='idle'){ e.open=Math.max(0,e.open-dt*2); if(e.open<=0) e.state='idle'; }
  for(const g of e.hpet) g.rotation.x=e.open*1.35; const k=0.25+e.open*0.75*(0.7+0.3*Math.sin(e.t*20)); const G2=P.glow; e.coreM.color.setRGB(G2[0]*k,G2[1]*k,G2[2]*k);
  e.body.scale.setScalar(1+Math.sin(e.t*2)*0.01); eyeColor(e,e.state!=='idle',e.state==='open'); }

/* ================= 4. FACTORY ================= */
function updFactory(e,dt){ e.t+=dt; const d=Math.hypot(TK.x-e.x,TK.z-e.z); ePerceive(e,dt,30,1);
  if(e.prod>0){ e.prod-=dt; eBrake(e,dt,3); e.lift=Math.sin(Math.min(1,(1.8-e.prod)/1.8)*Math.PI)*0.75; e.bh=e.prod<1.3&&e.prod>0.15?1:0;
    if(e.prod<0.75&&!e.spawned){ e.spawned=true; const j=newEnemy('jian',e.x,e.z); buildE(j); j.noScrap=true; j.born=true; j.state='fall'; j.fy=e.y-1.75; j.fv={x:0,y:-1.5,z:0}; j.aggro=true; j.h=e.h; j.noCol=false; sfxThud(0.5); for(const L of j.legs){ L.foot.set(j.x,j.fy-1.5,j.z); } } }
  else if((d<14||e.hurtT>0)&&e.aggro){ e.bh=0; e.fleeT-=dt; if(!e.flee||e.fleeT<=0||Math.hypot(e.flee.x-e.x,e.flee.z-e.z)<2){ let best=null,bs=-1; for(let k=0;k<14;k++){ const x=6+rnd()*68, z=6+rnd()*68; if(!eFree(x,z,e.r)) continue; const s=Math.hypot(x-TK.x,z-TK.z)-Math.hypot(x-e.x,z-e.z)*0.4; if(s>bs){ bs=s; best={x,z}; } } e.flee=best||{x:e.home.x,z:e.home.z}; e.fleeT=7; }
    navMove(e,e.flee.x,e.flee.z,e.speedW,dt); }
  else { e.bh=0; ePatrol(e,dt,0.8); }
  smashAround(e.x+e.vx*0.5,e.z+e.vz*0.5,e.r+0.4,1.3,1.25); eIntegrate(e,dt);
  e.yOv=null; if(e.lift) { e.yOv=groundH(e.x,e.z)+e.wc.bodyH+e.lift; if(e.prod<=0) e.lift=Math.max(0,e.lift-dt); }
  if(e.prod<=0&&e.parts.leg>=4&&e.parts.torso>=1&&countType('jian')<8){ e.parts.leg-=4; e.parts.torso-=1; e.prod=1.8; e.spawned=false; sfxHatch(); }
  const lit=Math.min(4,e.parts.leg)+Math.min(1,e.parts.torso); for(let k=0;k<5;k++){ const on=k<lit; e.ind[k].color.setRGB(...(on?P.glow:[0.13,0.1,0.06])); }
  e.hatch+=((e.hatchT>0?1:0)-e.hatch)*Math.min(1,dt*6); e.hatchT=Math.max(0,(e.hatchT||0)-dt); e.lid.rotation.x=-e.hatch*1.25;
  e.bhatch+=((e.bh||0)-e.bhatch)*Math.min(1,dt*8); e.bdoors[0].rotation.z=-e.bhatch*1.4; e.bdoors[1].rotation.z=e.bhatch*1.4;
  const ik=0.25+0.75*Math.max(e.hatch,e.bhatch); e.inM.color.setRGB(P.glow2[0]*ik,P.glow2[1]*ik*0.7,P.glow2[2]*ik*0.4);
  for(let i=e.droneQ.length-1;i>=0;i--){ e.droneQ[i]-=dt; if(e.droneQ[i]<=0){ e.droneQ.splice(i,1); spawnDrone(e,(rnd()*4)|0); e.hatchT=0.9; } }
  const wk=0.4+0.25*Math.sin(e.t*3); e.winM.color.setRGB(P.glow2[0]*wk,P.glow2[1]*wk*0.8,P.glow2[2]*wk*0.5); eyeColor(e,e.hurtT>0||d<14,false); }
function droneDie(d,dx,dz,factoryDead){ if(d.dead) return; d.dead=true; if(d.shadow) d.shadow.visible=false; for(const m of d.mats) m.emissive.setRGB(0,0,0); const G2=P.glow2; for(let k=0;k<12;k++) spark(d.x,d.y,d.z,(rnd()-0.5)*8,rnd()*6,(rnd()-0.5)*8,1,0.85,0.55,0.4); FIRE.spawn(d.x,d.y,d.z,0,0,0,1.4,2,0.2,1,G2[0],G2[1],G2[2]); sfxTick();
  if(d.carry){ const p=d.carry; d.carry=null; p.claimed=null; p.y=d.y-0.5; p.fall=true; p.vy=0; p.x=d.x; p.z=d.z; PICKUPS.push(p); }
  if(d.target){ d.target.claimed=null; d.target=null; }
  const g={m:d.g,v:new THREE.Vector3(d.vx+dx*4,1,d.vz+dz*4),w:new THREE.Vector3((rnd()-0.5)*10,(rnd()-0.5)*10,(rnd()-0.5)*10),r:0.25,part:factoryDead?'scrapdrone':null,t:0,rest:false}; GIBS.push(g);
  if(!factoryDead&&!d.f.dead) d.f.droneQ.push(9+rnd()*4); }

/* ================= 5. BULL ================= */
function bullSpot(e){ const b=Math.atan2(e.x-TK.x,e.z-TK.z); for(let k=0;k<16;k++){ const a=b+(rnd()<0.5?-1:1)*(0.6+rnd()*1.1), r=12+rnd()*8, x=TK.x+Math.sin(a)*r, z=TK.z+Math.cos(a)*r;
    if(x<5||z<5||x>75||z>75||!eFree(x,z,e.r)||!navOk(Math.floor(x),Math.floor(z),1.1)) continue; if(e.mod!=='mortar'&&!losClear(x,1.9,z,TK.x,TK.y+1.3,TK.z)) continue; return {x,z}; } return null; }
function updBull(e,dt){ const dx=TK.x-e.x, dz=TK.z-e.z, d=Math.max(1e-3,Math.hypot(dx,dz)); e.t+=dt; ePerceive(e,dt,32,1.9); e.crouch=0; const W=EW[e.mod];
  e.g.updateMatrixWorld(true); e.muz.getWorldPosition(_mz); let laser=false;
  switch(e.state){
  case 'idle': if(e.aggro){ e.state='move'; break; } ePatrol(e,dt,1.4); break;
  case 'move': { if(!e.aggro){ e.state='idle'; break; } e.cd-=dt; const los=(e.sees&&losTank(_mz.x,_mz.y,_mz.z))||(e.mod==='mortar'&&d<30&&e.lostT<3); let tx=TK.x, tz=TK.z;
    if(!e.sees&&e.last){ tx=e.last.x; tz=e.last.z; }
    else if(d<12){ tx=e.x-dx/d*6; tz=e.z-dz/d*6; } else if(d<22&&los){ const a=Math.atan2(-dx,-dz)+0.6*e.side; tx=TK.x+Math.sin(a)*17; tz=TK.z+Math.cos(a)*17; }
    navMove(e,tx,tz,d<22&&los?e.speedW*0.6:e.speedW,dt); if(e.cd<=0&&d<28&&los){ e.state='brace'; e.t=0; } break; }
  case 'repos': e.cd-=dt; navMove(e,e.rp.x,e.rp.z,e.speedW*1.15,dt); if(Math.hypot(e.rp.x-e.x,e.rp.z-e.z)<1.5||e.t>6){ e.state='move'; e.cd=0.3; } break;
  case 'brace': eBrake(e,dt,8); e.h=turnTo(e.h,Math.atan2(dx,dz),3*dt); e.crouch=Math.min(1,e.t/0.4); if(e.t>0.55){ e.state='laser'; e.t=0; const lt=e.mod==='mortar'?1.6:d/W.speed+0.3; e.tgD=null; const G=GD.d; if(G&&!G.dead&&G.st!=='rise'&&e.mod!=='mortar'){ const dg=Math.hypot(G.p.x-e.x,G.p.z-e.z); if(dg<28&&(dg<d*0.85||rnd()<0.3)&&losClear(e.x,e.y+1,e.z,G.p.x,G.p.y,G.p.z)) e.tgD=G; }
      e.aim=e.tgD?{x:e.tgD.p.x+e.tgD.v.x*lt*0.5,y:e.tgD.p.y,z:e.tgD.p.z+e.tgD.v.z*lt*0.5}:{x:TK.x+TK.vx*lt+(rnd()-0.5)*1.2,y:TK.y+1.2,z:TK.z+TK.vz*lt+(rnd()-0.5)*1.2}; sfxCharge(0.6); } break;
  case 'laser': eBrake(e,dt,8); e.crouch=1; e.h=turnTo(e.h,Math.atan2(e.aim.x-e.x,e.aim.z-e.z),3*dt); { const G=e.tgD&&!e.tgD.dead?e.tgD.p:null; if(G){ e.aim.x+=(G.x-e.aim.x)*dt*1.6; e.aim.y+=(G.y-e.aim.y)*dt*1.6; e.aim.z+=(G.z-e.aim.z)*dt*1.6; } else { e.tgD=null; e.aim.x+=(TK.x-e.aim.x)*dt*0.8; e.aim.z+=(TK.z-e.aim.z)*dt*0.8; } } laser=e.mod!=='mortar';
    if(e.t>0.9){ e.state='fire'; e.t=0; e.shots=0; e.ft=0; } break;
  case 'fire': e.crouch=1; e.ft-=dt; if(e.ft<=0&&e.shots<W.burst&&e.mag>0){ e.ft=W.gap; e.shots++; e.mag--; eShoot(_mz.x,_mz.y,_mz.z,e.aim.x,e.aim.y,e.aim.z,W); const G2=P.glow2; FIRE.spawn(_mz.x,_mz.y,_mz.z,0,0,0,e.mod==='mg'?0.8:1.6,2,0.07,1,G2[0],G2[1],G2[2]); e.kx-=Math.sin(e.h)*0.6; e.kz-=Math.cos(e.h)*0.6; e.mod==='mg'?sfxMgE():sfxCannonE(); }
    if(e.shots>=W.burst||e.mag<=0){ if(e.mag<=0){ e.state='reload'; e.t=0; const c=new THREE.Vector3(e.x-Math.sin(e.h)*1.3,e.y+0.3,e.z-Math.cos(e.h)*1.3); const box_=new THREE.Mesh(EGEO.box,PKM.ammo); box_.scale.set(0.5,0.3,0.4); box_.position.copy(c); scene.add(box_); EXTRAS.push(box_);
        const g={m:box_,v:new THREE.Vector3(-Math.sin(e.h)*3+(rnd()-0.5)*2,4,-Math.cos(e.h)*3),w:new THREE.Vector3(rnd()*8,rnd()*8,rnd()*8),r:0.15,part:null,t:0,rest:false}; GIBS.push(g); sfxClick(); }
      else { e.t=0; const sp=rnd()<0.5?bullSpot(e):null; if(sp){ e.state='repos'; e.rp=sp; e.cd=0.4; } else { e.state='move'; e.cd=1.2+rnd()*1.2; } } } break;
  case 'reload': eBrake(e,dt,8); e.crouch=0.6; if(e.t>2.0){ e.mag=W.mag; e.t=0; const sp=rnd()<0.5?bullSpot(e):null; if(sp){ e.state='repos'; e.rp=sp; } else { e.state='move'; e.cd=0.5; } } break; }
  eIntegrate(e,dt);
  if(laser){ const k=Math.min(1,e.t/0.9), R=EYE_RED; LINES.push(_mz.x,_mz.y,_mz.z,e.aim.x,e.aim.y,e.aim.z,R[0]*k,R[1]*k,R[2]*k,0.6); }
  if(e.marker){ const on=e.state==='laser'||e.state==='fire'; e.marker.visible=on; if(on){ e.marker.position.set(e.aim.x,groundH(e.aim.x,e.aim.z)+0.07,e.aim.z); e.marker.material.opacity=0.5+0.3*Math.sin(performance.now()*0.02); } }
  eyeColor(e,['brace','laser','fire'].includes(e.state),e.state==='laser'||(e.aimImm||0)>0.9); }

/* ================= 6. LAMP ================= */
function buildLamp(e){ Object.assign(e,{hp:70,maxHp:70,r:1.1,hy:0,hr:0.75,mass:1.5,turn:1.2,acc:2,speedW:1.3,shots:0,bx:0,by:0,bz:0,beamT:0,heat:0});
  const D=emat(e,0x161d2c), Mt=emat(e,0x3a4252); e.eyeM=eglow(e,0xfff2d2); const B=e.body;
  ep(e,EGEO.cyl,D,B,0,0,0,0.55,0.5,0.55,true); ep(e,EGEO.thin,Mt,B,0,0.12,0,1.15).rotation.x=Math.PI/2; ep(e,EGEO.box,D,B,0,0.12,0.75,0.42,0.14,1.5,true); ep(e,EGEO.box,D,B,0,0.06,1.35,0.62,0.12,0.62); ep(e,EGEO.box,e.eyeM,B,0,-0.01,1.35,0.56,0.04,0.56);
  for(let k=0;k<5;k++) ep(e,EGEO.box,Mt,B,0,0.16,1.13+k*0.11,0.56,0.08,0.03); ep(e,EGEO.box,Mt,B,0,0.21,0.4,0.2,0.06,0.5); ep(e,EGEO.joint,gmat(0xff5a40),B,0,0.3,0,0.06);
  ep(e,EGEO.cyl,Mt,B,0,-0.32,0,0.4,0.16,0.4); ep(e,EGEO.box,D,B,0.2,0.3,-0.15,0.02,0.4,0.02);
  e.lampPos=new THREE.Object3D(); e.lampPos.position.set(0,-0.1,1.35); B.add(e.lampPos);
  e.halo=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX_R,color:0xffffff,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0.6})); e.halo.scale.setScalar(3); scene.add(e.halo); EXTRAS.push(e.halo);
  e.pool=new THREE.Mesh(poolGeo,new THREE.MeshBasicMaterial({map:TEX_SOFT,color:0xffffff,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0.3})); e.pool.scale.setScalar(8.8); scene.add(e.pool); EXTRAS.push(e.pool);
  addLegs(e,{L1:3.3,L2:3.5,w1:0.12,w2:0.15,stepH:0.8,thr:0.9,stepT:0.75,lead:0.6,bodyH:6.1,bob:0.05,legHp:24,tipGeo:EGEO.box,
    legs:[[0,-0.2,-0.3,0,-2.0,0],[0.26,-0.2,0.15,1.75,1.0,1],[-0.26,-0.2,0.15,-1.75,1.0,2]]},D,D); e.state='disguise'; }

/* ---------- spawning & state ---------- */
function saveLocState(){ if(!grid||LOC.safe) return; for(const e of ENEMIES) if(e.boss||e.bossPart||e.xf||['dseg','lion'].includes(e.type)) e.__skip=true; LOC_STATE[LOC_ID]={Q,grid,HM:HM.slice(),marks:marks.slice(),lamps:LAMPS.map(l=>l.alive),cars:CARS.map(c=>c.dead),
  enemies:ENEMIES.filter(e=>!e.dead&&e.state!=='fly'&&!e.__skip).map(e=>({type:e.type,x:e.x,z:e.z,h:e.h,hp:e.hp,mod:e.mod,parts:e.parts?{...e.parts}:null,ns:!!e.noScrap,wave:!!e.wave})),
  pickups:PICKUPS.filter(p=>!p.claimed).map(p=>({kind:p.kind,x:p.x,z:p.z,value:p.value,part:p.part}))}; }
function spawnLocEnemies(st){ if(st){ for(const s of st.enemies){ const e=spawnEnemy(s.type,s.x,s.z,{mod:s.mod,h:s.h}); e.hp=s.hp; if(s.parts) e.parts=s.parts; e.noScrap=s.ns; e.wave=s.wave; }
    for(const p of st.pickups) makePickup(p.kind,p.x,p.z,p.value,p.part); return; }
  const taken=[]; for(const [t,x,z,o] of locEnemyList()){ const r=ER[t], p=pickSpawn(t,r,taken)||[x,z]; taken.push([p[0],p[1],r]); spawnEnemy(t,p[0],p[1],o); } }

/* ---------- extra shapes for the reference-matched robots ---------- */
const HelixCurve=class extends THREE.Curve{ constructor(r,h,turns){ super(); this.r=r; this.h=h; this.n=turns; } getPoint(t,o){ o=o||new THREE.Vector3(); const a=t*this.n*TAU; return o.set(Math.cos(a)*this.r,-t*this.h,Math.sin(a)*this.r); } };
EGEO.spike=new THREE.CylinderGeometry(0.06,0.5,1,8); EGEO.helix=new THREE.TubeGeometry(new HelixCurve(0.035,0.3,6),60,0.012,4);
EGEO.plate=new THREE.CylinderGeometry(0.5,0.5,1,10,1,true,-0.6,1.2); EGEO.claw=new THREE.CylinderGeometry(0.5,0.38,1,6,1,true,-0.7,1.4);
{ const sh=new THREE.Shape(); sh.moveTo(-0.5,0); sh.lineTo(0.5,0); sh.lineTo(0.3,0.6); sh.lineTo(-0.4,0.5); sh.lineTo(-0.5,0); const w=new THREE.ExtrudeGeometry(sh,{depth:1,bevelEnabled:false}); w.translate(0,-0.3,-0.5); w.rotateY(-Math.PI/2); EGEO.wedge=w; }
PKM.lens=new THREE.MeshBasicMaterial({color:0x1a2a3a}); PKM.redLamp=new THREE.MeshBasicMaterial({color:0xff5a40});
function octShape(w,h,c){ const s=new THREE.Shape(), W=w/2, H=h/2; s.moveTo(-W+c,-H); s.lineTo(W-c,-H); s.lineTo(W,-H+c); s.lineTo(W,H-c); s.lineTo(W-c,H); s.lineTo(-W+c,H); s.lineTo(-W,H-c); s.lineTo(-W,-H+c); s.lineTo(-W+c,-H); return s; }
function octPath(w,h,c){ const s=new THREE.Path(), W=w/2, H=h/2; s.moveTo(-W+c,-H); s.lineTo(-W,-H+c); s.lineTo(-W,H-c); s.lineTo(-W+c,H); s.lineTo(W-c,H); s.lineTo(W,H-c); s.lineTo(W,-H+c); s.lineTo(W-c,-H); s.lineTo(-W+c,-H); return s; }
const FGEO={};
function factoryGeo(){ if(FGEO.body) return FGEO;
  FGEO.body=new THREE.ExtrudeGeometry(octShape(3.2,3.0,0.6),{depth:2.4,bevelEnabled:false}); FGEO.body.translate(0,0,-1.6);
  const fr=octShape(3.2,3.0,0.6); fr.holes.push(octPath(2.2,2.0,0.42)); FGEO.frame=new THREE.ExtrudeGeometry(fr,{depth:0.8,bevelEnabled:false}); FGEO.frame.translate(0,0,0.8);
  const ln=octShape(2.22,2.02,0.43); ln.holes.push(octPath(2.1,1.9,0.38)); FGEO.liner=new THREE.ExtrudeGeometry(ln,{depth:0.79,bevelEnabled:false}); FGEO.liner.translate(0,0,0.805);
  FGEO.back=new THREE.ShapeGeometry(octShape(2.2,2.0,0.42)); FGEO.back.translate(0,0,0.81); return FGEO; }
function stripeTex(c1,c2,wear,n){ const cv=document.createElement('canvas'); cv.width=32; cv.height=128; const g=cv.getContext('2d'); g.fillStyle=c1; g.fillRect(0,0,32,128); g.fillStyle=c2;
  for(let k=0;k<n;k++){ const y=8+k*(118/n); g.fillRect(0,y,32,128/n*0.32); } if(wear){ g.fillStyle=wear; for(let k=0;k<40;k++) g.fillRect((k*13)%32,(k*37)%128,2+(k%3),3+(k%4)*2); }
  const t=new THREE.CanvasTexture(cv); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; }
function hazardTex(){ const cv=document.createElement('canvas'); cv.width=64; cv.height=32; const g=cv.getContext('2d'); g.fillStyle='#f2b01e'; g.fillRect(0,0,64,32); g.fillStyle='#16191c'; for(let x=-32;x<64;x+=16){ g.beginPath(); g.moveTo(x,32); g.lineTo(x+8,32); g.lineTo(x+40,0); g.lineTo(x+32,0); g.fill(); } return new THREE.CanvasTexture(cv); }
const TEXS={spike:stripeTex('#f2b01e','#1a1c1e','#e8e2d0',5),haz:hazardTex()};
function emapMat(e,tex,side){ const m=new THREE.MeshToonMaterial({color:0xffffff,map:tex,gradientMap:gradTex,side:side||THREE.FrontSide}); e.mats.push(m); return m; }
function emat2(e,color){ const m=emat(e,color); m.side=THREE.DoubleSide; return m; }
const _ln=new THREE.Vector3(), _ZV=new THREE.Vector3(0,0,1);

const _pa=new THREE.Vector3(), _pb=new THREE.Vector3();
function legRender(e){ const C=e.wc; if(!C) return; e.g.updateMatrixWorld(true); const MW=e.body.matrixWorld;
  for(const L of e.legs){ if(!L.alive) continue; _h3.copy(L.hip).applyMatrix4(MW); _d3.subVectors(L.foot,_h3); const d=_d3.length()||1e-3; _u3.copy(_d3).divideScalar(d);
    const L1=C.L1, L2=C.L2, dm=Math.min(d,L1+L2-0.01), ca=clamp((L1*L1+dm*dm-L2*L2)/(2*L1*dm),-1,1), sa=Math.sqrt(1-ca*ca);
    _w3.copy(UPV).addScaledVector(_u3,-_u3.y); if(_w3.lengthSq()<1e-4) _w3.set(_h3.x-e.x,0,_h3.z-e.z); _w3.normalize();
    L.knee.copy(_h3).addScaledVector(_u3,L1*ca).addScaledVector(_w3,L1*sa); _c3.copy(_h3).addScaledVector(_u3,dm);
    placeSeg(L.m1,_h3,L.knee,C.w1,C.d1||C.w1); placeSeg(L.m2,L.knee,_c3,C.w2,C.d2||C.w2); L.mk.position.copy(L.knee);
    if(L.hm){ L.hm.position.copy(_h3); L.cap.position.copy(L.knee); L.cap.position.y+=C.w1*0.5; L.cap.rotation.y=e.h;
      _pa.copy(_h3).lerp(L.knee,0.18).addScaledVector(_w3,C.w1*0.95); _pb.copy(L.knee).lerp(_c3,0.32).addScaledVector(_w3,C.w1*0.75); placeSeg(L.pi,_pa,_pb,C.w1*0.32,C.w1*0.32);
      if(L.ft){ L.ft.position.set(_c3.x,_c3.y+0.02,_c3.z); L.ft.visible=L.t<0||L.t>0.85; } }
    if(L.fw){ L.fw.position.copy(_c3); L.fw.position.y+=C.foot.s[1]*0.35; L.fw.rotation.set(0,Math.atan2(_c3.x-e.x,_c3.z-e.z),0); }
    if(L.bd){ const b=C.band; L.bd.position.copy(L.knee).lerp(_c3,b.at); L.bd.quaternion.copy(L.m2.quaternion); L.bd.scale.set(C.w2*b.k,L2*b.len,(C.d2||C.w2)*b.k); }
    if(L.ln){ for(let k=0;k<2;k++){ const p=k?L.knee:_h3, w=k?C.w1*1.05:C.w1*1.25; _ln.set(p.x-e.x,0,p.z-e.z).normalize(); const [r,g]=L.ln[k];
      r.position.copy(p).addScaledVector(_ln,w*0.55); r.quaternion.setFromUnitVectors(_ZV,_ln); r.scale.setScalar(w*1.25); g.position.copy(p).addScaledVector(_ln,w*0.57); g.quaternion.copy(r.quaternion); g.scale.setScalar(w*0.5); } } } legFlush(e); }

/* merge every static mesh of a robot into one mesh per material: tens of draw calls become a handful */
function mergeGroup(G){ const byMat=new Map(); const kill=[];
  for(const m of G.children){ if(!m.isMesh||m.userData.keep||m.isInstancedMesh) continue; if(m.children.some(c=>!(c.isMesh&&c.material===outlineMat))) continue;
    m.updateMatrix(); const add=(geo,mat,mtx)=>{ const g=(geo.index?geo.toNonIndexed():geo.clone()); g.applyMatrix4(mtx); let a=byMat.get(mat); if(!a){ a=[]; byMat.set(mat,a); } a.push(g); };
    add(m.geometry,m.material,m.matrix); for(const c of m.children){ c.updateMatrix(); add(c.geometry,outlineMat,new THREE.Matrix4().multiplyMatrices(m.matrix,c.matrix)); } kill.push(m); }
  if(kill.length<2) return; for(const m of kill) G.remove(m);
  for(const [mat,list] of byMat){ let n=0; for(const g of list) n+=g.attributes.position.count; const pos=new Float32Array(n*3), nor=new Float32Array(n*3), uv=new Float32Array(n*2); let o=0;
    for(const g of list){ const c=g.attributes.position.count; pos.set(g.attributes.position.array,o*3); if(g.attributes.normal) nor.set(g.attributes.normal.array,o*3); if(g.attributes.uv) uv.set(g.attributes.uv.array,o*2); o+=c; g.dispose(); }
    const bg=new THREE.BufferGeometry(); bg.setAttribute('position',new THREE.BufferAttribute(pos,3)); bg.setAttribute('normal',new THREE.BufferAttribute(nor,3)); bg.setAttribute('uv',new THREE.BufferAttribute(uv,2)); bg.computeBoundingSphere();
    const mm=new THREE.Mesh(bg,mat); mm.userData.merged=true; G.add(mm); } }
function mergeStatic(root){ const gs=[]; root.traverse(o=>{ if(!o.isMesh) gs.push(o); }); for(const g of gs) mergeGroup(g); }
function buildE(e,opt){ ETYPE[e.type].build(e,opt||{}); mergeStatic(e.body); }

