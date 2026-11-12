/* ================= DESTRUCTION ================= */
let destroyed=0, shake=0;
const rigids=[]; const MAXR=28;
function voxelColor(m,x,y,z,o){ matRGB(m,x,y,z,o); if(!MD[m].glow){ const k=0.85; o[0]*=k;o[1]*=k;o[2]*=k; } return o; }
function explode(...a){ const ps=sndAt(a[0],a[2]); try{ return explode0(...a); } finally{ sndOff(ps); } }
function explode0(px,py,pz,radius,power,dx,dy,dz,kind,hit,carK,skipE,tankK){ if(tankK==null) tankK=1; if(CIV.list.length) civBlast(px,py,pz,radius); if(ARENA.panes.length) arenaBlast(px,py,pz,radius);
  const wet=py<0.6&&inWater(px,pz);
  const reach=radius*2.2, cr=Math.ceil(reach/VS)+1, ccx=Math.floor(px/VS), ccy=Math.floor(py/VS), ccz=Math.floor(pz/VS); const rem=[];
  for(let y=Math.max(0,ccy-cr);y<=Math.min(NY-1,ccy+cr);y++) for(let z=Math.max(0,ccz-cr);z<=Math.min(NZ-1,ccz+cr);z++) for(let x=Math.max(0,ccx-cr);x<=Math.min(NX-1,ccx+cr);x++){
    const i=gi(x,y,z), m=grid[i]; if(!m) continue; const wx=(x+0.5)*VS-px, wy=(y+0.5)*VS-py, wz=(z+0.5)*VS-pz, d=Math.sqrt(wx*wx+wy*wy+wz*wz);
    const reff=radius*1.3/(0.6+0.35*MD[m].hard); if(d<reff*(0.8+0.4*rnd())){ rem.push(x,y,z,m); grid[i]=0; markDirty(x,y,z); } }
  if(hit&&hit.hit===1){ const m=get(hit.x,hit.y,hit.z); if(m&&rnd()<1.8/MD[m].hard){ rem.push(hit.x,hit.y,hit.z,m); grid[gi(hit.x,hit.y,hit.z)]=0; markDirty(hit.x,hit.y,hit.z); } }
  const nrem=rem.length/4; destroyed+=nrem;
  const chance=Math.min(1,(kind==='shell'?240:22)/Math.max(1,nrem)); let glass=0, metal=0; const firstM=rem.length?rem[3]:0;
  for(let r=0;r<rem.length;r+=4){ const m=rem[r+3]; if(MD[m].glass) glass++; if(MD[m].metal) metal++;
    if(rnd()>chance) continue; const cx=(rem[r]+0.5)*VS, cy=(rem[r+1]+0.5)*VS, cz=(rem[r+2]+0.5)*VS;
    let ox=cx-px, oy=cy-py, oz=cz-pz; const l=Math.hypot(ox,oy,oz)||1; ox/=l; oy/=l; oz/=l;
    const sp=kind==='shell'?(3+11*rnd())*power:(1.5+4*rnd()); voxelColor(m,rem[r],rem[r+1],rem[r+2],col);
    let vx=ox*sp, vy=oy*sp+(2+5*rnd())*power, vz=oz*sp; if(kind!=='shell'){ vx-=dx*2.5; vz-=dz*2.5; vy+=1.5; }
    debSpawn(cx,cy,cz,vx,vy,vz,col[0],col[1],col[2],VS*(0.55+0.4*rnd())); }
  const nx=hit?hit.nx:0, ny=hit?hit.ny:1, nz=hit?hit.nz:0; const hot=[1,0.85,0.55], G2=P.glow2, GL=P.glass;
  if(kind==='shell'){
    if(wet){ splashBig(px,pz,Math.min(1.6,radius/1.5)); }
    else {
      for(let k=0;k<55;k++){ const a=rnd()*TAU, e=rnd()*1.2, s=8+16*rnd(); spark(px,py+0.1,pz,Math.cos(a)*Math.cos(e)*s,Math.sin(e)*s+3,Math.sin(a)*Math.cos(e)*s,hot[0],hot[1],hot[2],0.4+0.7*rnd()); }
      for(let k=0;k<8;k++) FIRE.spawn(px+(rnd()-0.5)*1.2,py+rnd()*0.8,pz+(rnd()-0.5)*1.2,(rnd()-0.5)*4,2+rnd()*3,(rnd()-0.5)*4,1.6+rnd()*1.8,3,0.35+rnd()*0.25,0.9,G2[0],G2[1]*0.9,G2[2]);
      FIRE.spawn(px,py+0.5,pz,0,0,0,7,6,0.16,1,1,0.92,0.7); }
    const sm=firstM?voxelColor(firstM,0,0,0,[0,0,0]):P.mid; const smc=mix3(P.dark,P.bg,0.35);
    for(let k=0;k<14;k++) SMOKE.spawn(px+(rnd()-0.5)*2,py+rnd()*1.5,pz+(rnd()-0.5)*2,(rnd()-0.5)*3,1+rnd()*2.5,(rnd()-0.5)*3,2+rnd()*2,1.6,2.2+rnd()*2.2,0.6,smc[0],smc[1],smc[2]);
    for(let k=0;k<6;k++) SMOKE.spawn(px,py,pz,(rnd()-0.5)*8,rnd()*3,(rnd()-0.5)*8,1.2,1.2,1.2,0.5,sm[0]*0.8+0.1,sm[1]*0.8+0.1,sm[2]*0.8+0.1);
    if(!wet){ groundFlash(px,pz,radius*6,G2,0.45); if(py<1.6){ craterAt(px,pz,radius*(carK?1.0:0.72),(0.1+0.08*power)*(carK||1)); addMark({t:0,x:px,z:pz,r:radius*1.25+rnd()*0.4}); } }
    shake=Math.min(1,shake+0.5*Math.max(0.2,1-Math.hypot(px-TK.x,pz-TK.z)/40)); sfxBoom(1);
    if(!wet&&radius>=1.1) shockwave(px,pz,radius*4.5,mix3(P.glow2,[1,1,1],0.35)); screenFlash(Math.max(0,0.22*radius/2-Math.hypot(px-TK.x,pz-TK.z)/90),false);
  } else {
    if(wet){ splashSmall(px,pz); }
    else { const sc=metal?[1,0.9,0.6]:mix3(P.glow,[1,1,1],0.3);
      for(let k=0;k<6;k++){ const s=4+8*rnd(); spark(px,py,pz,(nx+(rnd()-0.5)*1.6)*s,(ny+(rnd()-0.2)*1.4)*s,(nz+(rnd()-0.5)*1.6)*s,sc[0],sc[1],sc[2],0.15+0.3*rnd()); }
      const dc=firstM?voxelColor(firstM,0,0,0,[0,0,0]):mix3(P.road,[1,1,1],0.25); SMOKE.spawn(px+nx*0.2,py+ny*0.2,pz+nz*0.2,nx*1.5,0.6+ny,nz*1.5,0.5,1.5,0.6,0.55,dc[0]*0.8+0.15,dc[1]*0.8+0.15,dc[2]*0.8+0.15);
      if(rnd()<0.35) FIRE.spawn(px,py,pz,0,0,0,0.9,1,0.06,0.9,1,0.9,0.6); }
    sfxTick(); }
  for(let k=0;k<Math.min(40,glass*3);k++){ const s=3+7*rnd(); spark(px,py,pz,(rnd()-0.5)*s,rnd()*s*0.8,(rnd()-0.5)*s,GL[0],GL[1],GL[2],0.4+0.6*rnd()); }
  if(glass>2) sfxGlass(Math.min(1,glass/20));
  if(nrem) structural(rem);
  const R2=(radius*(kind==='shell'?3:1.5))**2, d=DEB;
  for(let i=0;i<d.n;i++){ const ox=d.px[i]-px, oy=d.py[i]-py, oz=d.pz[i]-pz, q=ox*ox+oy*oy+oz*oz; if(q>R2) continue; const l=Math.sqrt(q)+0.3, f=(kind==='shell'?14:3)*(1-Math.sqrt(q/R2))/l;
    d.vx[i]+=ox*f; d.vy[i]+=Math.abs(oy)*f+(kind==='shell'?4:1); d.vz[i]+=oz*f; d.rest[i]=0; }
  for(let i=rigids.length-1;i>=0;i--){ const r=rigids[i]; const ox=r.pos.x-px, oy=r.pos.y-py, oz=r.pos.z-pz, dd=Math.hypot(ox,oy,oz);
    if(dd<radius+r.radius*0.8){ if(kind==='shell'&&r.age>0.15&&(r.count<900||dd<radius+Math.min(r.hx,r.hy,r.hz))) shatter(r,i,ox/dd*6,4,oz/dd*6); else if(kind==='shell'){ r.vel.x+=ox/dd*2.5; r.vel.y+=1.5; r.vel.z+=oz/dd*2.5; r.ang.x+=(rnd()-0.5)*1.5; r.ang.z+=(rnd()-0.5)*1.5; r.sleep=false; } else { r.vel.x+=ox/dd*1.2; r.vel.y+=0.8; r.vel.z+=oz/dd*1.2; r.ang.x+=(rnd()-0.5); r.ang.z+=(rnd()-0.5); r.sleep=false; } } }
  enemyArea(px,py,pz,radius,power*(tankK<1?0.3:1),skipE,kind);
  if(kind==='shell'){ const ox=TK.x-px, oz=TK.z-pz, dd=Math.hypot(ox,oz), dy_=TK.y+1.3-py, d3=Math.hypot(dd,dy_);
    if(dd<radius*3){ const f=(1-dd/(radius*3))*7*(tankK<1?0.35:1); TK.vx+=ox/(dd+0.1)*f; TK.vz+=oz/(dd+0.1)*f; TK.pitchV+=(rnd()-0.5)*f*0.3; TK.rollV+=(rnd()-0.5)*f*0.3; }
    const DR=radius*2.1; if(d3<DR&&tankK>0) damageTank((1-d3/DR)*26*power*(carK?1.2:1)*tankK,px-TK.x,pz-TK.z,py>TK.y+2?0.6:0); }
}
function structural(rem){ const CAP=QUALITY[Q].cap, sup=new Set(), seen=new Set();
  for(let r=0;r<rem.length;r+=4){ const x=rem[r],y=rem[r+1],z=rem[r+2];
    for(let f=0;f<6;f++){ const sx=x+FD[f*3], sy=y+FD[f*3+1], sz=z+FD[f*3+2]; if(!get(sx,sy,sz)) continue; const k0=gi(sx,sy,sz); if(sup.has(k0)||seen.has(k0)) continue;
      const comp=[k0], loc=new Set(comp); let grounded=false, qi=0;
      while(qi<comp.length){ const ck=comp[qi++], cx=ck%NX, t=(ck-cx)/NX, cz=t%NZ, cy=(t-cz)/NZ; if(cy===0){grounded=true;break;}
        for(let g=0;g<6;g++){ const ax=cx+FD[g*3], ay=cy+FD[g*3+1], az=cz+FD[g*3+2]; if(ax<0||ay<0||az<0||ax>=NX||ay>=NY||az>=NZ) continue;
          const ak=ax+NX*(az+NZ*ay); if(!grid[ak]||loc.has(ak)) continue; if(sup.has(ak)){grounded=true;break;} loc.add(ak); comp.push(ak); }
        if(grounded) break; if(comp.length>CAP){grounded=true;break;} }
      if(grounded){ for(const kk of comp) sup.add(kk); } else { for(const kk of comp) seen.add(kk); detach(comp); } } } }
function detach(comp){ const cells=[]; const mn=[1e9,1e9,1e9], mx=[-1,-1,-1];
  for(const k of comp){ const x=k%NX, t=(k-x)/NX, z=t%NZ, y=(t-z)/NZ, m=grid[k]; if(!m) continue; cells.push(x,y,z,m); grid[k]=0; markDirty(x,y,z);
    if(x<mn[0])mn[0]=x; if(y<mn[1])mn[1]=y; if(z<mn[2])mn[2]=z; if(x>mx[0])mx[0]=x; if(y>mx[1])mx[1]=y; if(z>mx[2])mx[2]=z; }
  const n=cells.length/4; if(!n) return;
  if(n<=14){ for(let r=0;r<cells.length;r+=4){ voxelColor(cells[r+3],cells[r],cells[r+1],cells[r+2],col); debSpawn((cells[r]+0.5)*VS,(cells[r+1]+0.5)*VS,(cells[r+2]+0.5)*VS,(rnd()-0.5)*1.5,rnd(),(rnd()-0.5)*1.5,col[0],col[1],col[2],VS*0.9); } return; }
  makeRigid(cells,mn,mx); }
function makeRigid(cells,mn,mx){ const sx=mx[0]-mn[0]+1, sy=mx[1]-mn[1]+1, sz=mx[2]-mn[2]+1, lg=new Uint8Array(sx*sy*sz);
  for(let r=0;r<cells.length;r+=4) lg[(cells[r]-mn[0])+sx*((cells[r+2]-mn[2])+sz*(cells[r+1]-mn[1]))]=cells[r+3];
  const mesh=new THREE.Mesh(meshLocal(lg,sx,sy,sz,mn),litMat); scene.add(mesh);
  const r={mesh,lg,sx,sy,sz,mn:mn.slice(),count:cells.length/4,pos:new THREE.Vector3((mn[0]+sx/2)*VS,(mn[1]+sy/2)*VS,(mn[2]+sz/2)*VS),
    vel:new THREE.Vector3((rnd()-0.5)*1.4,0.3,(rnd()-0.5)*1.4),quat:new THREE.Quaternion(),ang:new THREE.Vector3((rnd()-0.5)*1.4,(rnd()-0.5)*0.5,(rnd()-0.5)*1.4),
    hx:sx*VS/2,hy:sy*VS/2,hz:sz*VS/2,sleep:false,still:0,age:0};
  r.radius=Math.hypot(r.hx,r.hy,r.hz); mesh.position.copy(r.pos); rigids.push(r);
  if(rigids.length>MAXR){ let oi=0; for(let i=1;i<rigids.length;i++) if(rigids[i].age>rigids[oi].age) oi=i; shatter(rigids[oi],oi,0,0,0); } }
function removeRigid(i){ const r=rigids[i]; scene.remove(r.mesh); r.mesh.geometry.dispose(); rigids.splice(i,1); }
function shatter(r,i,evx,evy,evz){ r.mesh.updateMatrixWorld(); const budget=Math.max(20,Math.min(240,(DEB.max-DEB.n)*0.6)); const step=Math.max(1,r.count/budget); let cnt=0, acc=0;
  for(let y=0;y<r.sy;y++)for(let z=0;z<r.sz;z++)for(let x=0;x<r.sx;x++){ const m=r.lg[x+r.sx*(z+r.sz*y)]; if(!m) continue; acc++; if(acc<cnt*step) continue; cnt++;
    _v.set((x+0.5-r.sx/2)*VS,(y+0.5-r.sy/2)*VS,(z+0.5-r.sz/2)*VS).applyMatrix4(r.mesh.matrixWorld); voxelColor(m,x+r.mn[0],y+r.mn[1],z+r.mn[2],col);
    debSpawn(_v.x,_v.y,_v.z,r.vel.x+evx+(rnd()-0.5)*4,r.vel.y+evy+rnd()*3,r.vel.z+evz+(rnd()-0.5)*4,col[0],col[1],col[2],VS*(0.7+0.3*rnd())); }
  const dc=mix3(P.mid,P.bg,0.4); for(let k=0;k<6;k++) SMOKE.spawn(r.pos.x+(rnd()-0.5)*r.hx,Math.max(0.3,r.pos.y),r.pos.z+(rnd()-0.5)*r.hz,(rnd()-0.5)*2,0.8,(rnd()-0.5)*2,1.4,1.4,1.4,0.5,dc[0],dc[1],dc[2]);
  removeRigid(i); }
const CORN=[[-1,-1,-1],[1,-1,-1],[-1,1,-1],[1,1,-1],[-1,-1,1],[1,-1,1],[-1,1,1],[1,1,1]];
function supportY(x,z,fromY){ const cx=Math.floor(x/VS), cz=Math.floor(z/VS); for(let y=Math.min(NY-1,Math.floor(fromY/VS));y>=0;y--) if(get(cx,y,cz)) return (y+1)*VS; return groundH(x,z); }
function rigidUpdate(dt){
  for(let i=rigids.length-1;i>=0;i--){ const r=rigids[i]; r.age+=dt; if(r.sleep) continue;
    r.vel.y-=G*dt; r.pos.addScaledVector(r.vel,dt); const a=r.ang.length(); if(a>1e-4){ _q.setFromAxisAngle(_v.copy(r.ang).divideScalar(a),a*dt); r.quat.premultiply(_q).normalize(); }
    let low=Infinity; const cy_=[], cx_=[], cz_=[]; for(const C of CORN){ _v.set(C[0]*r.hx,C[1]*r.hy,C[2]*r.hz).applyQuaternion(r.quat); cy_.push(r.pos.y+_v.y); cx_.push(_v.x); cz_.push(_v.z); if(r.pos.y+_v.y<low) low=r.pos.y+_v.y; }
    let lx=0, lz=0, nLow=0; for(let k=0;k<8;k++) if(cy_[k]<low+0.08){ lx+=cx_[k]; lz+=cz_[k]; nLow++; } lx/=nLow; lz/=nLow;
    const fl=supportY(r.pos.x,r.pos.z,r.pos.y);
    if(low<fl){ r.pos.y+=fl-low; const imp=-r.vel.y;
      if(imp>11&&r.count<320){ shatter(r,i,0,1,0); continue; }
      if(imp>3){ sfxThud(Math.min(1,imp/12)); const dc=mix3(P.mid,P.bg,0.4); for(let k=0;k<3;k++) SMOKE.spawn(r.pos.x+lx,fl+0.2,r.pos.z+lz,(rnd()-0.5)*2,0.6,(rnd()-0.5)*2,1,1.4,1,0.45,dc[0],dc[1],dc[2]); }
      if(imp>0) r.vel.y=imp*0.25; r.vel.x*=0.72; r.vel.z*=0.72; r.ang.multiplyScalar(0.75);
      if(nLow<4){ const tk=26/(r.radius+0.6); r.ang.x+=-lz*tk*dt; r.ang.z+=lx*tk*dt; }
      if(r.vel.lengthSq()<0.25&&r.ang.lengthSq()<0.2){ r.still+=dt; if(r.still>0.8) r.sleep=true; } else r.still=0; }
    r.ang.multiplyScalar(Math.pow(0.7,dt)); r.mesh.position.copy(r.pos); r.mesh.quaternion.copy(r.quat);
    if(r.pos.y<-4) removeRigid(i); } }

