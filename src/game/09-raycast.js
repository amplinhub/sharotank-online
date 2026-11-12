/* ================= RAYCAST ================= */
const RH={hit:0,t:0,x:0,y:0,z:0,nx:0,ny:0,nz:0};
function raycast(ox,oy,oz,dx,dy,dz,maxT){ const tG=dy<-1e-6?-oy/dy:Infinity; const tMax=Math.min(maxT,tG);
  let x=Math.floor(ox/VS), y=Math.floor(oy/VS), z=Math.floor(oz/VS); const sx=dx>0?1:-1, sy=dy>0?1:-1, sz=dz>0?1:-1;
  const tdx=dx!==0?Math.abs(VS/dx):Infinity, tdy=dy!==0?Math.abs(VS/dy):Infinity, tdz=dz!==0?Math.abs(VS/dz):Infinity;
  let tnx=dx!==0?((dx>0?(x+1)*VS-ox:ox-x*VS)/Math.abs(dx)):Infinity, tny=dy!==0?((dy>0?(y+1)*VS-oy:oy-y*VS)/Math.abs(dy)):Infinity, tnz=dz!==0?((dz>0?(z+1)*VS-oz:oz-z*VS)/Math.abs(dz)):Infinity;
  if(get(x,y,z)){ RH.hit=1;RH.t=0;RH.x=x;RH.y=y;RH.z=z;RH.nx=-dx;RH.ny=-dy;RH.nz=-dz; return true; }
  let t=0, face=-1, guard=0;
  while(guard++<4000){ if(tnx<tny&&tnx<tnz){ x+=sx; t=tnx; tnx+=tdx; face=0; } else if(tny<tnz){ y+=sy; t=tny; tny+=tdy; face=1; } else { z+=sz; t=tnz; tnz+=tdz; face=2; }
    if(t>tMax) break; if(y>=NY&&dy>=0) break;
    if(y>=0&&get(x,y,z)){ RH.hit=1;RH.t=t;RH.x=x;RH.y=y;RH.z=z; RH.nx=face===0?-sx:0; RH.ny=face===1?-sy:0; RH.nz=face===2?-sz:0; return true; } }
  if(tG<=maxT){ RH.hit=2; RH.t=tG; RH.nx=0;RH.ny=1;RH.nz=0; RH.x=Math.floor((ox+dx*tG)/VS); RH.y=-1; RH.z=Math.floor((oz+dz*tG)/VS); return true; }
  RH.hit=0; return false; }

