/* ================= LOCATIONS TABLE ================= */
/* ================= v25: ARENA DISTRICTS (160 m) — mirror-symmetric fortifications, CTF bases, ammo pads ================= */
/* oriented box / cylinder voxelizers: local z = forward (yaw like a tank heading), m may be fn(lx,ly,lz) in local metres */
function obox(cx,cy,cz,hx,hy,hz,yaw,pitch,roll,m){ const R=Math.hypot(hx,hy,hz), a=c(cx-R)-1, b=c(cx+R)+1, d=Math.max(0,c(cy-R)-1), e=c(cy+R)+1, f=c(cz-R)-1, g=c(cz+R)+1;
  const cY=Math.cos(yaw||0), sY=Math.sin(yaw||0), cP=Math.cos(pitch||0), sP=Math.sin(pitch||0), cR=Math.cos(roll||0), sR=Math.sin(roll||0), fn=typeof m==='function';
  for(let y=d;y<e;y++) for(let z=f;z<g;z++) for(let x=a;x<b;x++){ const wx=(x+0.5)*VS-cx, wy=(y+0.5)*VS-cy, wz=(z+0.5)*VS-cz;
    const x1=wx*cY-wz*sY, z1=wx*sY+wz*cY, y2=wy*cP+z1*sP, z2=-wy*sP+z1*cP, lx=x1*cR+y2*sR, ly=-x1*sR+y2*cR;
    if(Math.abs(lx)>hx||Math.abs(ly)>hy||Math.abs(z2)>hz) continue; const v=fn?m(lx,ly,z2):m; if(v>=0) put(x,y,z,v); } }
function ocyl(cx,cy,cz,r,hl,yaw,pitch,roll,m,ri){ const R=Math.hypot(r,hl), a=c(cx-R)-1, b=c(cx+R)+1, d=Math.max(0,c(cy-R)-1), e=c(cy+R)+1, f=c(cz-R)-1, g=c(cz+R)+1;
  const cY=Math.cos(yaw||0), sY=Math.sin(yaw||0), cP=Math.cos(pitch||0), sP=Math.sin(pitch||0), cR=Math.cos(roll||0), sR=Math.sin(roll||0), fn=typeof m==='function', r2=r*r, i2=ri?ri*ri:-1;
  for(let y=d;y<e;y++) for(let z=f;z<g;z++) for(let x=a;x<b;x++){ const wx=(x+0.5)*VS-cx, wy=(y+0.5)*VS-cy, wz=(z+0.5)*VS-cz;
    const x1=wx*cY-wz*sY, z1=wx*sY+wz*cY, y2=wy*cP+z1*sP, z2=-wy*sP+z1*cP, lx=x1*cR+y2*sR, ly=-x1*sR+y2*cR, q=lx*lx+ly*ly;
    if(Math.abs(z2)>hl||q>r2||q<i2) continue; const v=fn?m(lx,ly,z2):m; if(v>=0) put(x,y,z,v); } }
/* half-world mirror: fortifications are built once on the first half and copied voxel-for-voxel, so both teams get the same cover */
function mirrorHalf(axis,lamp0){ if(axis==='z'){ const hz=NZ>>1; for(let y=0;y<NY;y++) for(let z=0;z<hz;z++){ const r=NX*(z+NZ*y); grid.copyWithin(NX*((NZ-1-z)+NZ*y),r,r+NX); } }
  else { const hx=NX>>1; for(let y=0;y<NY;y++) for(let z=0;z<NZ;z++){ const r=NX*(z+NZ*y); for(let x=0;x<hx;x++) grid[r+NX-1-x]=grid[r+x]; } }
  const n=LAMPS.length; for(let i=lamp0;i<n;i++){ const l=Object.assign({},LAMPS[i]); if(axis==='z') l.z=WZ-l.z; else l.x=WX-l.x; LAMPS.push(l); } }
/* side helper: s=0 first half (as written), s=1 mirrored; X/Z map a first-half coordinate to the given side */
const ARENA={piles:[],panes:[],pads:[],bases:[],ring:null};
function sideXZ(axis,s,x,z){ return s?(axis==='z'?[x,WZ-z]:[WX-x,z]):[x,z]; }
function arenaEdge(gate,mat,h){ const W=WX, c0=W/2-5.5, c1=W/2+5.5, t=0.6, w=(x0,z0,x1,z1)=>box(x0,0,z0,x1,h,z1,mat);
  if(gate==='N'){ w(0.1,0.1,c0,t); w(c1,0.1,W-0.1,t); } else w(0.1,0.1,W-0.1,t);
  if(gate==='S'){ w(0.1,W-t,c0,W-0.1); w(c1,W-t,W-0.1,W-0.1); } else w(0.1,W-t,W-0.1,W-0.1);
  if(gate==='W'){ w(0.1,t,t,c0); w(0.1,c1,t,W-t); } else w(0.1,t,t,W-t);
  if(gate==='E'){ w(W-t,t,W-0.1,c0); w(W-t,c1,W-0.1,W-t); } else w(W-t,t,W-0.1,W-t); }
/* coloured sedan / sports car / van — same destructible CARS contract as the taxi */
function sedan(x,z,ax,col,dir,sport,y0){ dir=dir||1; y0=y0||0; const hw=ax?2.0:0.95, hd=ax?0.95:2.0; CARS.push({x,z,b:[c(x-hw-0.2),c(y0),c(z-hd-0.2),c(x+hw+0.2),c(1.9+y0),c(z+hd+0.2)],n0:0,dead:false,fuse:0,smoke:0,big:1}); vehDetail(dir>0?'sedan':'sedanR',x,z,ax,CARS[CARS.length-1],y0);
  const top=(sport?1.3:1.62)+y0, wl=(sport?0.62:0.98)+y0;
  lbox(x,z,ax,-2.0,2.0,-0.92,0.92,y0,wl,LF(x,z,ax,(u,w,y)=>{ u*=dir; y-=y0; const au=Math.abs(u), aw=Math.abs(w), wu=Math.abs(au-1.2);
    if(wu<0.5&&y<0.72){ const q=Math.hypot(wu,y-0.32); if(q<0.36) return aw>0.45?M.TIRE:M.DARK; if(q<0.5) return aw>0.6?-1:M.DARK; } if(y<0.2) return -1; if(aw>0.86&&y<0.36) return M.DARK;
    if(au>1.86&&y<0.52) return M.METAL; if(u>1.88&&y>0.5&&y<0.78) return aw<0.4?M.DARK:aw<0.76?M.LAMP:col; if(u<-1.88&&y>0.55&&y<0.75&&aw>0.48) return M.NEON;
    if(sport&&aw>0.8&&y<0.45&&au<1.6) return M.DARK; if(u>1.0&&y>wl-y0-0.08) return -1; if(u<-1.3&&y>wl-y0-0.06&&!sport) return -1; return col; }));
  lbox(x,z,ax,sport?-0.9:-1.15,sport?0.7:1.0,-0.84,0.84,wl,top,LF(x,z,ax,(u,w,y)=>{ u*=dir; const aw=Math.abs(w), h=y-wl;
    if(u>(sport?0.7:1.0)-h*(sport?1.4:0.75)) return -1; if(u<(sport?-0.9:-1.15)+h*(sport?1.1:0.45)) return -1; if(y>top-0.1) return col;
    if(aw>0.72&&Math.abs(u+0.1)<0.09) return col; return M.WINOFF; }));
  if(sport) lbox(x,z,ax,dir>0?-2.05:1.75,dir>0?-1.75:2.05,-0.8,0.8,0.95+y0,1.05+y0,col); }
function van(x,z,ax,col,dir){ dir=dir||1; const hw=ax?2.9:1.1, hd=ax?1.1:2.9; CARS.push({x,z,b:[c(x-hw-0.2),0,c(z-hd-0.2),c(x+hw+0.2),c(2.9),c(z+hd+0.2)],n0:0,dead:false,fuse:0,smoke:0,big:1.3}); vehDetail(dir>0?'van':'vanR',x,z,ax,CARS[CARS.length-1]);
  lbox(x,z,ax,-2.9,2.9,-1.08,1.08,0,2.7,LF(x,z,ax,(u,w,y)=>{ u*=dir; const aw=Math.abs(w), wu=Math.abs(Math.abs(u)-1.74);
    if(wu<0.6&&y<0.86){ const q=Math.hypot(wu,y-0.38); if(q<0.42) return aw>0.55?M.TIRE:M.DARK; if(q<0.58) return aw>0.72?-1:M.DARK; } if(y<0.22) return -1;
    if(u>1.7&&y>1.7&&u-1.7>(y-1.7)*0.6) return -1; if(u>1.75&&y>1.3&&y<2.2&&aw<0.95) return M.WINOFF; if(u>2.8&&y<0.6) return M.METAL; if(u>2.82&&y>0.62&&y<0.86) return aw<0.45?M.DARK:M.LAMP;
    if(u<-2.82&&y>0.8&&y<1.1&&aw>0.7) return M.NEON; if(y<0.55) return M.DARK; if(u<1.6&&y>0.9&&y<1.15) return M.AWN; return col; })); }
function hedge(x0,z0,x1,z1,h){ box(x0,0,z0,x1,h||1.2,z1,(X,Y,Z)=>hash3(X,Y,Z)<0.12?M.BLOS:M.LEAF); }
/* big old tree: thick trunk, root flare, two limbs, dense crown (top ≈ 8–9 m) */
function bigTree(x,z,R){ const tr=0.62+0.18*R(); cyl(x,z,tr+0.45,0,0.5,M.TRUNK); cyl(x,z,tr+0.2,0.5,1.1,M.TRUNK); cyl(x,z,tr,1.1,4.6,M.TRUNK);
  for(let k=0;k<5;k++){ const a=k/5*TAU+R(), L=1.2+R()*0.6; obox(x+Math.cos(a)*L*0.6,0.2,z+Math.sin(a)*L*0.6,0.22,0.22,L*0.6,Math.atan2(Math.cos(a),Math.sin(a)),0.15,0,M.TRUNK); }
  const limbs=[]; for(let k=0;k<3;k++){ const a=k/3*TAU+R()*1.2, L=2.2+R()*0.8, px=x+Math.cos(a)*L*0.5, pz=z+Math.sin(a)*L*0.5; obox(px,4.4+R()*0.5,pz,0.26,0.26,L*0.55,Math.atan2(Math.cos(a),Math.sin(a)),-0.55,0,M.TRUNK); limbs.push([x+Math.cos(a)*L,z+Math.sin(a)*L]); }
  const cr=2.6+R()*0.6; sphere(x,6.4,z,cr,M.LEAF,0.18); for(const [lx,lz] of limbs) sphere(lx,5.7+R()*0.6,lz,cr*0.72,M.LEAF,0.22); sphere(x+(R()-0.5)*1.5,7.6,z+(R()-0.5)*1.5,cr*0.6,M.LEAF,0.25); }

/* v26 helpers: free-space test on the voxel grid, scatter of small props, ride fences, plant beds */
function vFree(x0,z0,x1,z1,h){ const a=Math.max(0,c(x0)),b=Math.min(NX-1,c(x1)),f=Math.max(0,c(z0)),g=Math.min(NZ-1,c(z1)),Y=Math.min(NY-1,c(h||1.5));
  for(let y=0;y<=Y;y++) for(let z=f;z<=g;z++){ const o=NX*(z+NZ*y); for(let x=a;x<=b;x++) if(grid[o+x]) return false; } return true; }
function arenaAvoid(more){ const A=LOC.arena||{}, o=[]; for(const b of A.bases||[]) o.push([b[0],b[1],7]); for(const p of A.pads||[]) o.push([p[0],p[1],3.8]); return more?o.concat(more):o; }
function scatter(R,n,x0,z0,x1,z1,r,avoid,fn){ let k=0; for(let t=0;t<n*10&&k<n;t++){ const x=x0+R()*(x1-x0), z=z0+R()*(z1-z0);
    if(avoid&&avoid.some(a=>Math.hypot(x-a[0],z-a[1])<a[2]+r)) continue; if(!vFree(x-r-0.6,z-r-0.6,x+r+0.6,z+r+0.6,1.8)) continue; fn(x,z,k++); } }
/* low ride railing along an axis-aligned line; gaps = [[u,width],...] measured from the start */
function railFence(x0,z0,x1,z1,gaps,h,post,rail){ h=h||1.0; const ax=Math.abs(x1-x0)>=Math.abs(z1-z0), L=ax?Math.abs(x1-x0):Math.abs(z1-z0), sg=ax?Math.sign(x1-x0)||1:Math.sign(z1-z0)||1, inG=u=>(gaps||[]).some(g=>Math.abs(u-g[0])<g[1]/2);
  const n=Math.max(1,Math.round(L/1.2)); for(let k=0;k<=n;k++){ const u=L*k/n; if(inG(u)) continue; const x=ax?x0+sg*u:x0, z=ax?z0:z0+sg*u; box(x-0.17,0,z-0.17,x+0.17,h+0.12,z+0.17,post||M.METAL); }
  for(let u=0;u<L-0.01;u+=0.4){ if(inG(u+0.2)) continue; const xa=ax?x0+sg*u:x0, za=ax?z0:z0+sg*u, xb=ax?x0+sg*(u+0.4):x0, zb=ax?z0:z0+sg*(u+0.4);
    for(const y of [h-0.17,h*0.45]) box(Math.min(xa,xb)-(ax?0:0.1),y,Math.min(za,zb)-(ax?0.1:0),Math.max(xa,xb)+(ax?0:0.1),y+0.17,Math.max(za,zb)+(ax?0.1:0),rail||M.AWN); } }
function rectFence(x0,z0,x1,z1,gN,gS,gW,gE,h){ railFence(x0,z0,x1,z0,gN,h); railFence(x0,z1,x1,z1,gS,h); railFence(x0,z0,x0,z1,gW,h); railFence(x1,z0,x1,z1,gE,h); }
/* ring railing around a round ride; gaps = [[angle,halfWidth],...] */
function ringFence(cx,cz,r,gaps,h,post,rail){ h=h||1.0; const n=Math.max(10,Math.round(TAU*r/1.15)), gap=a=>(gaps||[]).some(g=>Math.abs(wrapA(a-g[0]))<g[1]);
  for(let k=0;k<n;k++){ const a=k/n*TAU; if(gap(a)) continue; const x=cx+Math.cos(a)*r, z=cz+Math.sin(a)*r; box(x-0.17,0,z-0.17,x+0.17,h+0.12,z+0.17,post||M.METAL); }
  const m=Math.round(TAU*r/0.35); for(let k=0;k<m;k++){ const a=(k+0.5)/m*TAU; if(gap(a)) continue; const x=cx+Math.cos(a)*r, z=cz+Math.sin(a)*r; for(const y of [h-0.17,h*0.45]) box(x-0.12,y,z-0.12,x+0.12,y+0.17,z+0.12,rail||M.AWN); } }
/* planted bed: stone kerb, trees every ~5 m, clipped bushes and flowers between */
function plantBed(x0,z0,x1,z1,R,trees){ const k=0.3; box(x0,0,z0,x1,0.3,z0+k,M.MID); box(x0,0,z1-k,x1,0.3,z1,M.MID); box(x0,0,z0,x0+k,0.3,z1,M.MID); box(x1-k,0,z0,x1,0.3,z1,M.MID);
  const ax=x1-x0>=z1-z0, L=ax?x1-x0:z1-z0, n=Math.max(1,Math.floor(L/5.2)), mid=ax?(z0+z1)/2:(x0+x1)/2;
  for(let i=0;i<n;i++){ const u=(ax?x0:z0)+L*(i+0.5)/n; const [x,z]=ax?[u,mid]:[mid,u]; if(trees!==false&&i%2===0) tree(x,z,R,R()<0.3); else { sphere(x,0.55,z,0.85+R()*0.25,M.LEAF,0.15); } }
  for(let i=0;i<n*2;i++){ const u=(ax?x0:z0)+0.9+R()*(L-1.8), w=(R()-0.5)*((ax?z1-z0:x1-x0)-1.4); const [x,z]=ax?[u,mid+w]:[mid+w,u]; if(vFree(x-0.4,z-0.4,x+0.4,z+0.4,0.6)) sphere(x,0.35,z,0.45,R()<0.35?M.BLOS:M.LEAF,0.2); } }
function binPost(x,z){ cyl(x,z,0.32,0,0.9,M.DARK); cyl(x,z,0.36,0.9,1.0,M.METAL); }
/* ---------- v26 props: cemetery ---------- */
function cypress(x,z,R){ const h=4.4+R()*1.8; box(x-0.2,0,z-0.2,x+0.2,0.9,z+0.2,M.TRUNK); for(let k=0;k<6;k++){ const t=k/5, r=(0.95-0.62*t)*(0.9+R()*0.2); sphere(x,1.0+t*h*0.82,z,r,M.LEAF,0.15); } box(x-0.1,h+0.6,z-0.1,x+0.1,h+1.0,z+0.1,M.LEAF); }
function deadTree(x,z,R){ cyl(x,z,0.55,0,0.4,M.TRUNK); cyl(x,z,0.34,0.4,3.6,M.TRUNK); for(let k=0;k<5;k++){ const a=R()*TAU, L=1.0+R()*1.0; obox(x+Math.cos(a)*L*0.45,2.2+k*0.35,z+Math.sin(a)*L*0.45,0.17,0.17,L*0.55,Math.atan2(Math.cos(a),Math.sin(a)),-0.6-R()*0.4,0,M.TRUNK); } }
function angelStatue(x,z){ box(x-0.7,0,z-0.55,x+0.7,0.45,z+0.55,M.MID); box(x-0.5,0.45,z-0.4,x+0.5,1.25,z+0.4,M.WALL); box(x-0.3,1.25,z-0.22,x+0.3,2.45,z+0.22,M.WALL); box(x-0.4,1.25,z-0.3,x+0.4,1.55,z+0.3,M.WALL); sphere(x,2.72,z,0.26,M.WALL);
  for(const s of [-1,1]){ obox(x+s*0.5,2.25,z-0.2,0.17,0.62,0.32,0,0,s*0.45,M.WALL); obox(x+s*0.72,2.75,z-0.2,0.17,0.3,0.25,0,0,s*0.8,M.WALL); } box(x-0.3,0.9,z+0.38,x+0.3,1.05,z+0.45,M.LANT); }
function plotFence(x0,z0,x1,z1){ const t=0.12, h=0.85, st=Math.max(0.5,2*VS); for(let x=x0;x<=x1+0.01;x+=st) for(const z of [z0,z1]) box(x-t,0,z-t,x+t,h,z+t,M.METAL); for(let z=z0+st;z<z1-0.01;z+=st) for(const x of [x0,x1]) box(x-t,0,z-t,x+t,h,z+t,M.METAL);
  for(const z of [z0,z1]) box(x0,h-0.15,z-0.1,x1,h+0.05,z+0.1,M.DARK); for(const x of [x0,x1]) box(x-0.1,h-0.15,z0,x+0.1,h+0.05,z1,M.DARK); for(const [x,z] of [[x0,z0],[x1,z0],[x0,z1],[x1,z1]]) box(x-0.17,0,z-0.17,x+0.17,1.1,z+0.17,M.DARK); }
function sBench(x,z,f){ box(x-1.0,0,z-0.25,x-0.7,0.45,z+0.25,M.MID); box(x+0.7,0,z-0.25,x+1.0,0.45,z+0.25,M.MID); box(x-1.1,0.45,z-0.3,x+1.1,0.62,z+0.3,M.WALL); if(f) box(x-1.1,0.62,z+f*0.18,x+1.1,1.15,z+f*0.32,M.WALL); }
function brokenCol(x,z,R){ box(x-0.6,0,z-0.6,x+0.6,0.4,z+0.6,M.MID); cyl(x,z,0.38,0.4,1.3+R()*1.5,M.WALL); obox(x+1.0,0.34,z+0.5,0.34,0.34,0.8,R()*TAU,0,0,M.WALL); }
function coffinCart(x,z){ box(x-0.6,0.5,z-1.2,x+0.6,0.75,z+1.2,M.WOOD); for(const s of [-1,1]) ocyl(x+s*0.65,0.42,z,0.42,0.08,Math.PI/2,0,0,M.DARK,0.25); box(x-0.06,0.5,z+1.2,x+0.06,0.62,z+2.2,M.WOOD); }
/* ---------- v26 props: scrapyard ---------- */
function rollOff(x,z,ax,col){ lbox(x,z,ax,-3.0,3.0,-1.2,1.2,0,0.3,M.DARK);
  lbox(x,z,ax,-3.0,3.0,-1.2,1.2,0.3,2.1,LF(x,z,ax,(u,w,y)=>{ const au=Math.abs(u), aw=Math.abs(w);
    if(au<2.66&&aw<0.86){ const top=1.0+hash3((u*1.6+9)|0,3,(w*1.6+9)|0)*0.95; if(y>top) return -1; const q=hash3((u*3+20)|0,(y*3)|0,(w*3+20)|0); return q<0.45?M.RUST:q<0.65?M.METAL:q<0.78?M.TIRE:q<0.88?M.DARK:[M.CBLUE,M.CRED,M.CGRN][(q*30|0)%3]; }
    if(y>1.85) return M.DARK; if(aw>1.0&&((u+3)%1.2)<0.4) return M.DARK; if(au>2.8&&Math.abs(w)<0.4&&y<0.8) return M.DARK; return col; }));
  lbox(x,z,ax,2.75,3.25,-0.55,0.55,2.1,3.0,M.DARK); lbox(x,z,ax,3.0,3.35,-0.25,0.25,2.5,2.85,M.METAL);
  for(const s of [-1,1]) lbox(x,z,ax,-2.95,-2.45,s*1.2-0.2,s*1.2+0.2,0,0.55,M.METAL); }
function dumpster(x,z,ax,col){ lbox(x,z,ax,-1.0,1.0,-0.75,0.75,0.2,1.35,LF(x,z,ax,(u,w,y)=>(Math.abs(u)>0.8&&y<0.55)?M.DARK:(y>1.15?M.DARK:col)));
  lbox(x,z,ax,-1.08,1.08,-0.85,0.85,1.35,1.5,LF(x,z,ax,(u,w)=>w>0.2?M.DARK:-1)); lbox(x,z,ax,-1.08,1.08,-0.85,0.2,1.35,1.75,LF(x,z,ax,(u,w,y)=>y>1.62||w<-0.7?M.DARK:-1));
  for(const s of [-1,1]) for(const t of [-1,1]) lbox(x,z,ax,s*0.75-0.14,s*0.75+0.14,t*0.55-0.14,t*0.55+0.14,0,0.22,M.TIRE); }
function drums(x,z,n,R){ const cols=[M.CBLUE,M.CRED,M.RUST,M.CGRN,M.RUST,M.CBLUE]; for(let k=0;k<n;k++){ const a=k*2.3+R(), d=k?0.8+0.3*(k>>2):0, px=x+Math.cos(a)*d, pz=z+Math.sin(a)*d, col=cols[(R()*cols.length)|0];
    if(k&&R()<0.3) ocyl(px,0.36,pz,0.36,0.46,R()*TAU,0,0,(lx,ly,lz)=>Math.abs(lz)>0.36?M.DARK:col); else cyl(px,pz,0.36,0,0.95,(X,Y)=>(Y+0.5)*VS>0.82?M.DARK:col); } }
function pallets(x,z,n,R){ for(let k=0;k<n;k++){ const y=k*0.34; box(x-0.6,y,z-0.5,x+0.6,y+0.17,z+0.5,M.WOOD); box(x-0.6,y+0.17,z-0.5,x+0.6,y+0.34,z-0.3,M.WOOD); box(x-0.6,y+0.17,z+0.3,x+0.6,y+0.34,z+0.5,M.WOOD); }
  if(R()<0.6) box(x-0.45,n*0.34,z-0.4,x+0.45,n*0.34+0.75,z+0.4,R()<0.5?M.WOOD:M.CANV); }
function engineBlock(x,z,R){ const yaw=R()*TAU; obox(x,0.45,z,0.55,0.45,0.75,yaw,0,0,(lx,ly)=>ly>0.25&&Math.abs(lx)<0.28?M.DARK:M.METAL); obox(x,0.97,z,0.3,0.12,0.62,yaw,0,0,M.RUST); obox(x,0.6,z,0.35,0.35,0.17,yaw+Math.PI/2,0,0,M.DARK); }
function fridge(x,z,R){ if(R()<0.5) box(x-0.4,0,z-0.38,x+0.4,1.75,z+0.38,(X,Y,Z)=>Math.abs((Y+0.5)*VS-1.15)<0.12?M.DARK:M.WALL); else obox(x,0.42,z,0.42,0.4,0.88,R()*TAU,0,0,(lx,ly,lz)=>ly>0.25&&Math.abs(lz-0.2)<0.15?M.DARK:M.WALL); }
function pipes(x,z,ax){ for(let k=0;k<5;k++){ const w=k<3?(k-1)*0.52:(k-3.5)*0.52, y=k<3?0.26:0.7; if(ax) ocyl(x,y,z+w,0.26,2.3,Math.PI/2,0,0,M.RUST,0.12); else ocyl(x+w,y,z,0.26,2.3,0,0,0,M.RUST,0.12); } }
function looseTyres(x,z,R){ for(let k=0;k<3;k++){ const px=x+(R()-0.5)*2, pz=z+(R()-0.5)*2; if(R()<0.5) cyl(px,pz,0.55,0,0.3,(X,Y,Z)=>Math.hypot((X+0.5)*VS-px,(Z+0.5)*VS-pz)<0.25?-1:M.TIRE); else ocyl(px,0.55,pz,0.55,0.16,R()*TAU,0,0,(lx,ly)=>Math.hypot(lx,ly)<0.25?-1:M.TIRE); } }
function ecoBlocks(x,z,n,ax,lv){ for(let j=0;j<(lv||2);j++) for(let i=0;i<n-(j?1:0);i++){ const u=(i-(n-1)/2+(j?0.5:0))*1.65; lbox(x,z,ax,u-0.8,u+0.8,-0.42,0.42,j*0.8,j*0.8+0.78,M.MID); } }
/* ---------- v26 props: fun park ---------- */
function iceKiosk(x,z,ax,col){ lbox(x,z,ax,-1.1,1.1,-0.7,0.7,0.35,1.3,LF(x,z,ax,(u,w,y)=>y>1.12?M.WALL:(w>0.5&&y>0.62&&y<1.0?M.WIN:col))); for(const s of [-0.75,0.75]) lbox(x,z,ax,s-0.22,s+0.22,-0.78,0.78,0,0.42,M.TIRE);
  lbox(x,z,ax,-0.07,0.07,-0.07,0.07,1.3,2.6,M.METAL); cyl(x,z,1.45,2.6,2.82,(X,Y,Z)=>{ const a=Math.atan2((Z+0.5)*VS-z,(X+0.5)*VS-x); return (((a+4)*8/TAU)|0)%2?M.WALL:col; }); cyl(x,z,0.8,2.82,3.0,M.WALL);
  const cx=ax?x-2.3:x, cz=ax?z:z-2.3; box(cx-0.08,0,cz-0.08,cx+0.08,1.7,cz+0.08,M.METAL); for(let i=0;i<4;i++) cyl(cx,cz,0.12+i*0.11,1.6+i*0.25,1.85+i*0.25,M.WOOD); sphere(cx,2.85,cz,0.5,M.BLOS); sphere(cx,3.28,cz,0.34,M.WALL); box(cx-0.06,3.6,cz-0.06,cx+0.06,3.8,cz+0.06,M.CRED);
  LAMPS.push({x,y:2.5,z,r:1.4,col:'neon',size:1.1}); }
function popcorn(x,z){ box(x-0.8,0,z-0.55,x+0.8,0.25,z+0.55,M.DARK); box(x-0.75,0.25,z-0.5,x+0.75,1.1,z+0.5,(X,Y)=>(((X>>1)&1)?M.CRED:M.WALL)); box(x-0.7,1.1,z-0.45,x+0.7,1.9,z+0.45,M.WIN); box(x-0.85,1.9,z-0.6,x+0.85,2.15,z+0.6,M.CRED); box(x-0.4,2.15,z-0.3,x+0.4,2.45,z+0.3,M.TAXI); LAMPS.push({x,y:1.5,z,r:1.1,col:'lamp',size:1}); }
function balloons(x,z,R){ box(x-0.25,0,z-0.25,x+0.25,0.8,z+0.25,M.WOOD); box(x-0.05,0.8,z-0.05,x+0.05,2.2,z+0.05,M.METAL); const cols=[M.CRED,M.CBLUE,M.TAXI,M.CGRN,M.BLOS,M.CORNG,M.CRED];
  for(let k=0;k<7;k++){ const a=k/7*TAU+R(), r=0.5+R()*0.4, bx=x+Math.cos(a)*r, bz=z+Math.sin(a)*r, by=3.0+R()*0.9; for(let t=0.15;t<1;t+=0.3) box(x+(bx-x)*t-0.04,2.2+(by-2.6)*t-0.04,z+(bz-z)*t-0.04,x+(bx-x)*t+0.04,2.2+(by-2.6)*t+0.04,z+(bz-z)*t+0.04,M.DARK); sphere(bx,by,bz,0.36,cols[k]); } }
function flowerBed(x,z){ cyl(x,z,1.15,0,0.32,M.MID); cyl(x,z,0.9,0.32,0.55,(X,Y,Z)=>hash3(X,Y,Z)<0.45?M.BLOS:M.LEAF); }
function lounger(x,z,col){ for(const [dx,dz] of [[-0.3,-0.75],[0.3,-0.75],[-0.3,0.85],[0.3,0.85]]) box(x+dx-0.07,0,z+dz-0.07,x+dx+0.07,0.3,z+dz+0.07,M.METAL);
  box(x-0.38,0.3,z-0.5,x+0.38,0.45,z+1.0,col); box(x-0.38,0.45,z-0.75,x+0.38,0.68,z-0.45,col); box(x-0.38,0.68,z-0.95,x+0.38,0.92,z-0.68,col); box(x-0.38,0.92,z-1.12,x+0.38,1.15,z-0.88,col); box(x-0.3,0.45,z+0.6,x+0.3,0.55,z+0.95,M.WALL); }
function parasol(x,z,col){ box(x-0.07,0,z-0.07,x+0.07,2.3,z+0.07,M.METAL); cyl(x,z,0.4,0,0.14,M.DARK); cyl(x,z,1.35,2.2,2.4,(X,Y,Z)=>{ const a=Math.atan2((Z+0.5)*VS-z,(X+0.5)*VS-x); return (((a+4)*8/TAU)|0)%2?M.WALL:col; }); cyl(x,z,0.7,2.4,2.56,col); }
function poolLadder(x,z){ for(const s of [-0.45,0.45]){ box(x+s-0.08,0,z+0.45,x+s+0.08,1.1,z+0.62,M.METAL); box(x+s-0.08,0.95,z-0.4,x+s+0.08,1.12,z+0.62,M.METAL); box(x+s-0.08,0,z-0.4,x+s+0.08,1.1,z-0.24,M.METAL); } for(const y of [0.05,0.45]) box(x-0.45,y,z-0.42,x+0.45,y+0.12,z-0.22,M.METAL); }
function divingBoard(x,z){ box(x-0.8,0,z-3.3,x+0.8,1.0,z-0.7,M.MID); for(let k=0;k<3;k++) box(x-0.6,0,z-4.5+k*0.4,x+0.6,0.33*(k+1),z-4.1+k*0.4,M.MID);
  box(x-0.38,1.0,z-2.9,x+0.38,1.18,z+2.6,M.WALL); box(x-0.38,1.0,z+2.2,x+0.38,1.18,z+2.6,M.CBLUE); box(x-0.3,0.6,z-0.4,x+0.3,1.0,z,M.METAL);
  for(const s of [-1,1]){ box(x+s*0.72-0.07,1.0,z-3.1,x+s*0.72+0.07,1.95,z-2.95,M.METAL); box(x+s*0.72-0.07,1.82,z-3.1,x+s*0.72+0.07,1.95,z-1.3,M.METAL); box(x+s*0.72-0.07,1.0,z-1.45,x+s*0.72+0.07,1.95,z-1.3,M.METAL); } }
/* ---------- v26 props: dealership ---------- */
/* AMPLIN billboard: voxel legs + frame, the face is a lit canvas texture on both sides (falls off when a blast wrecks it) */
let AMPLIN_TEX=null;
function amplinTex(){ if(AMPLIN_TEX) return AMPLIN_TEX; const cv=document.createElement('canvas'); cv.width=1024; cv.height=320; const g=cv.getContext('2d');
  const gr=g.createLinearGradient(0,0,1024,320); gr.addColorStop(0,'#0f1d3a'); gr.addColorStop(0.55,'#1b3f7a'); gr.addColorStop(1,'#e8432e'); g.fillStyle=gr; g.fillRect(0,0,1024,320);
  g.fillStyle='rgba(255,255,255,0.08)'; for(let k=0;k<9;k++){ g.beginPath(); g.moveTo(560+k*60,0); g.lineTo(640+k*60,0); g.lineTo(520+k*60,320); g.lineTo(440+k*60,320); g.fill(); }
  g.fillStyle='#ffffff'; g.textAlign='center'; g.textBaseline='middle'; g.font='800 170px Unbounded, "Arial Black", Arial, sans-serif'; g.fillText('AMPLIN',512,150);
  g.fillStyle='#ffc94a'; g.fillRect(250,250,524,10); g.font='600 34px "IBM Plex Mono", monospace'; g.fillStyle='rgba(255,255,255,0.85)'; g.fillText('AUTO · 汽车城',512,288);
  g.strokeStyle='#ffc94a'; g.lineWidth=12; g.strokeRect(6,6,1012,308);
  AMPLIN_TEX=new THREE.CanvasTexture(cv); AMPLIN_TEX.anisotropy=4; return AMPLIN_TEX; }
function amplinBoard(x,z,alongX){ const W=10, H=3.2, y0=4.2; /* legs, catwalk, frame */
  for(const s of [-3.4,3.4]){ const lx=alongX?x+s:x, lz=alongX?z:z+s; box(lx-0.3,0,lz-0.3,lx+0.3,0.5,lz+0.3,M.MID); box(lx-0.17,0.5,lz-0.17,lx+0.17,y0,lz+0.17,M.METAL); }
  if(alongX){ box(x-W/2,y0-0.25,z-0.9,x+W/2,y0-0.1,z+0.9,M.METAL); box(x-W/2-0.15,y0,z-0.25,x+W/2+0.15,y0+H+0.15,z+0.25,M.DARK); }
  else { box(x-0.9,y0-0.25,z-W/2,x+0.9,y0-0.1,z+W/2,M.METAL); box(x-0.25,y0,z-W/2-0.15,x+0.25,y0+H+0.15,z+W/2+0.15,M.DARK); }
  const mat=new THREE.MeshBasicMaterial({map:amplinTex()}), g=new THREE.PlaneGeometry(W-0.3,H-0.2);
  for(const s of [-1,1]){ const m=new THREE.Mesh(g,mat); m.position.set(alongX?x:x+s*0.62,y0+H/2+0.07,alongX?z+s*0.62:z); m.rotation.y=alongX?(s>0?0:Math.PI):(s>0?Math.PI/2:-Math.PI/2); addExtra(m); ARENA.panes.push({m,x,z,y:y0+H/2,bb:1}); }
  for(const s of [-2.5,2.5]){ const lx=alongX?x+s:x, lz=alongX?z:z+s; LAMPS.push({x:lx,y:y0+H+0.4,z:lz,r:3,col:'lamp',size:1.6}); } }
/* vertical glass wall panes (meshes): see-through, shatter on blasts or when a tank drives into them */
function arenaGlassWall(x0,z0,x1,z1,y0,y1,cuts,gaps){ const mat=new THREE.MeshBasicMaterial({color:0xa8ecff,transparent:true,opacity:0.14,depthWrite:false,side:THREE.DoubleSide}), em=new THREE.LineBasicMaterial({color:0xd6f6ff,transparent:true,opacity:0.5});
  const ax=Math.abs(x1-x0)>=Math.abs(z1-z0), L=ax?x1-x0:z1-z0, st=L/cuts;
  for(let k=0;k<cuts;k++){ const u=(k+0.5)*st; if((gaps||[]).some(g=>Math.abs((ax?x0:z0)+u-g)<st*0.6)) continue; const g=new THREE.PlaneGeometry(st-0.36,y1-y0), m=new THREE.Mesh(g,mat);
    m.position.set(ax?x0+u:x0,(y0+y1)/2,ax?z0:z0+u); if(!ax) m.rotation.y=Math.PI/2; m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g),em)); m.renderOrder=5; addExtra(m);
    ARENA.panes.push({m,x:m.position.x,z:m.position.z,y:(y0+y1)/2,v:1,hw:ax?st/2:0.1,hd:ax?0.1:st/2}); } }
function flagstones(x,z,r,col){ const n=5, st=2*r/n; for(let i=0;i<n;i++) for(let j=0;j<n;j++){ const h=hash3(i,j,(x*7+z)|0); gx.fillStyle=cssA(mix3(col,P.dark,0.06+h*0.2),1); R_(x-r+i*st+0.07,z-r+j*st+0.07,st-0.14,st-0.14); } }
/* ---------- 1. CEMETERY (west of the Business district) · mirror across z=80 · gate E ---------- */
function graveStone(x,z,k,R){ if(k<0.48){ box(x-0.42,0,z-0.13,x+0.42,0.82,z+0.13,M.WALL); box(x-0.32,0.82,z-0.1,x+0.32,0.95,z+0.1,M.WALL); }
  else if(k<0.72){ box(x-0.65,0,z-0.28,x+0.65,0.25,z+0.28,M.MID); box(x-0.55,0.25,z-0.18,x+0.55,1.35,z+0.18,M.WALL); cyl(x,z,0.55,1.35,1.5,M.WALL); box(x-0.2,0.9,z+0.17,x+0.2,1.0,z+0.2,M.LANT); }
  else if(k<0.86){ box(x-0.4,0,z-0.4,x+0.4,0.3,z+0.4,M.MID); box(x-0.12,0.3,z-0.12,x+0.12,1.9,z+0.12,M.WALL); box(x-0.48,1.35,z-0.12,x+0.48,1.55,z+0.12,M.WALL); }
  else { box(x-0.45,0,z-0.45,x+0.45,0.35,z+0.45,M.MID); for(let i=0;i<5;i++){ const w=0.3-i*0.045; box(x-w,0.35+i*0.45,z-w,x+w,0.8+i*0.45,z+w,M.WALL); } box(x-0.08,2.6,z-0.08,x+0.08,2.8,z+0.08,M.WALL); } }
function familyVault(x0,z0,w,d){ box(x0-0.3,0,z0-0.3,x0+w+0.3,0.3,z0+d+0.3,M.MID); box(x0,0.3,z0,x0+w,2.6,z0+d,M.WALL);
  box(x0+w/2-0.6,0.3,z0+d-0.05,x0+w/2+0.6,2.0,z0+d+0.05,M.DARK); roof(x0-0.35,z0-0.35,x0+w+0.35,z0+d+0.35,2.6,1.0,true,M.TILE,0.6);
  for(const sx of [0,w]) box(x0+sx-0.25,0.3,z0+d-0.25,x0+sx+0.25,2.75,z0+d+0.25,M.RUST); }
/* thick stone wall with brick piers; breaches let a tank through, breach ends stepped down and rubble beside them */
function cemWall(x0,z0,x1,z1,gaps,R){ const ax=Math.abs(x1-x0)>Math.abs(z1-z0), L=ax?x1-x0:z1-z0, t=0.5, H=2.4;
  const inGap=u=>gaps.find(g=>Math.abs(u-g[0])<g[1]/2), at=(u,w)=>ax?[x0+u,z0+w]:[x0+w,z0+u];
  for(let u=0;u<L;u+=0.5){ const g=gaps.find(g=>Math.abs(u+0.25-g[0])<g[1]/2+1.6); if(inGap(u+0.25)) continue;
    let h=H; if(g){ const dd=Math.abs(u+0.25-g[0])-g[1]/2; h=0.8+Math.min(1,dd/1.6)*(H-0.8)-hash3(u*7|0,3,g[0]|0)*0.5; }
    const [a,b]=at(u,0); if(ax) box(a,0,b-t,a+0.5,h,b+t,M.WALL); else box(a-t,0,b,a+t,h,b+0.5,M.WALL);
    if(h>=H-0.01){ if(ax) box(a,H,b-t-0.08,a+0.5,H+0.18,b+t+0.08,M.MID); else box(a-t-0.08,H,b,a+t+0.08,H+0.18,b+0.5,M.MID); } }
  for(let u=0;u<=L+0.01;u+=6.5){ if(inGap(u)||gaps.some(g=>Math.abs(u-g[0])<g[1]/2+0.9)) continue; const [a,b]=at(u,0); box(a-0.75,0,b-0.75,a+0.75,2.95,b+0.75,M.RUST); box(a-0.9,2.95,b-0.9,a+0.9,3.2,b+0.9,M.MID); box(a-0.35,3.2,b-0.35,a+0.35,3.45,b+0.35,M.MID); }
  for(const g of gaps){ if(g[2]==='gate'){ for(const s of [-1,1]){ const [a,b]=at(g[0]+s*(g[1]/2+0.6),0); box(a-0.85,0,b-0.85,a+0.85,3.6,b+0.85,M.RUST); box(a-1.0,3.6,b-1.0,a+1.0,3.85,b+1.0,M.MID); sphere(a,4.2,b,0.4,M.WALL); }
      for(const s of [-1,1]){ const [a,b]=at(g[0]+s*(g[1]/2-0.2),s*1.6); if(ax) box(a-0.05,0,Math.min(b,z0+s*0.1),a+0.05,2.4,Math.max(b,z0+s*0.1),M.METAL); else box(Math.min(a,x0+s*0.1),0,b-0.05,Math.max(a,x0+s*0.1),2.4,b+0.05,M.METAL); } continue; }
    for(let k=0;k<5;k++){ const s=k%2?1:-1, uu=g[0]+s*(g[1]/2+0.4+R()*1.2), ww=(R()-0.5)*2.6, [a,b]=at(uu,ww); const r=0.3+R()*0.35; box(a-r,0,b-r,a+r,r*0.9,b+r,R()<0.5?M.WALL:M.RUST); } } }
/* v27: 12 transformer sites — group 0 north fenced yard, group 1 south fenced yard, group 2 along the road to the crypt */
const XF_PADS=[[54,17,0],[106,17,0],[54,55,0],[106,55,0],[54,143,1],[106,143,1],[54,105,1],[106,105,1],[111,72.4,2],[124,72.4,2],[111,87.6,2],[124,87.6,2]];
function xfPad(x,z){ box(x-2.7,0,z-2.7,x+2.7,0.14,z+2.7,M.MID); box(x-2.4,0.14,z-2.4,x+2.4,0.2,z+2.4,M.DARK);
  for(const a of [-2.55,2.55]) for(const b of [-2.55,2.55]){ box(x+a-0.14,0.2,z+b-0.14,x+a+0.14,0.95,z+b+0.14,M.RUST); box(x+a-0.15,0.8,z+b-0.15,x+a+0.15,0.92,z+b+0.15,M.LANT); }
  box(x-0.4,0,z+2.7,x+0.4,0.1,z+5.0,M.DARK); }
function genCemetery(R){ arenaEdge('E',M.WALL,1.4); const l0=LAMPS.length;
  /* first half (north): walled grave field x 28..132, z 12..60 */
  cemWall(28,12,132,12,[[60,4.4],[100,4.4]],R); cemWall(28,60,132,60,[[46,4.4],[80,5.6,'gate'],[114,4.4]],R);
  cemWall(28,12,28,60.5,[[24,4.4]],R); cemWall(132,12,132,60.5,[[18,4.4]],R);
  for(let z=17;z<=56;z+=5){ if(z>31&&z<41) continue; for(let x=33;x<=127;x+=3){ if(Math.abs(x-50)<3.5||Math.abs(x-80)<3.5||Math.abs(x-110)<3.5) continue; if(Math.abs(x-80)<12&&z<30) continue; if(XF_PADS.some(p=>p[2]===0&&Math.hypot(x-p[0],z-p[1])<4.4)) continue; const hz=hash3(x,z,9); if(hz<0.035) angelStatue(x,z+0.15); else { graveStone(x,z,hash3(x,z,5),R); if(hz>0.94) plotFence(x-1.15,z-0.6,x+1.15,z+2.35); else if(hz>0.78) sphere(x+0.25,0.2,z+0.6,0.3,M.BLOS,0.2); } } }
  familyVault(62,22,4,3.4); familyVault(94,22,4,3.4); familyVault(36,44,4.4,3.6); familyVault(119.6,44,4.4,3.6);
  /* along the central gravel walk: cypress pairs, benches; memorial plaza around the north flag spot */
  for(const x of [37,64,96,123]){ cypress(x,31.0,R); cypress(x+6,31.0,R); sBench(x+3,31.5,-1); } for(const x of [44,58,102,116]) sBench(x,40.5,1);
  for(const [x,z] of [[74.6,18.6],[85.4,18.6],[74.6,29.4],[85.4,29.4]]) stoneLantern(x,z); sBench(80,16.6,-1); brokenCol(70,14.6,R); brokenCol(90,14.6,R);
  /* outside the west wall: columbarium, cypress line, dead trees; east: well, woodpile, shed, hearse cart */
  box(3.0,0,13,4.6,3.2,27,(X,Y,Z)=>{ const y=(Y+0.5)*VS, z=(Z+0.5)*VS; return ((X+0.5)*VS>4.15&&y>0.5&&y<2.9&&((y-0.5)%0.8)<0.5&&((z-13)%1.0)<0.6)?M.DARK:M.WALL; }); box(2.8,3.2,12.8,4.8,3.45,27.2,M.MID);
  for(const z of [15,22]) sBench(8,z,-1); deadTree(14,20,R); deadTree(150,9,R); deadTree(12,57,R);
  for(const [x,z] of [[22,15],[22,24],[24,48],[136,16],[136,26],[136,46]]) cypress(x,z,R);
  cyl(152,22,1.05,0,0.95,M.WALL,0.38); for(const s of [-1,1]) box(152+s*0.9-0.12,0,21.9,152+s*0.9+0.12,2.4,22.1,M.WOOD); roof(150.6,20.9,153.4,23.1,2.4,0.7,true,M.TILE,0.3); box(151.2,1.75,21.95,152.8,1.85,22.05,M.WOOD);
  box(141,0,39,145.5,0.9,40.4,(X,Y,Z)=>hash3(X,Y,Z)<0.3?M.TRUNK:M.WOOD); box(150,0,44,154,2.2,48,M.WOOD); box(151.4,0,47.9,152.6,1.9,48.1,M.DARK); roof(149.6,43.6,154.4,48.4,2.2,0.9,true,M.TILE,0.4); coffinCart(146,44);
  for(const x of [48,112]) sBench(x,68.4,-1);
  /* outside the wall: ruined chapel stub (W), caretaker lodge (E), hedges and lantern line along the avenue */
  for(const [x0,z0,x1,z1,h] of [[8,30,9,46,1.8],[8,30,18,31,2.2],[8,45,14,46,1.4],[17,30,18,38,1.2]]) box(x0,0,z0,x1,h,z1,M.WALL); box(11,0,36,15,0.3,40,M.MID);
  box(140,0,30,148,0.3,37,M.MID); box(140.3,0.3,30.3,147.7,2.8,36.7,M.WALL); box(143,0.3,36.6,144.6,2.2,36.8,M.DARK); roof(139.6,29.6,148.4,37.4,2.8,1.4,true,M.TILE,0.8);
  hedge(36,66,64,67.2); hedge(96,66,124,67.2); hedge(6,52,22,53.2); hedge(138,52,154,53.2);
  for(let x=20;x<=140;x+=20){ if(Math.abs(x-80)<12) continue; streetLamp(x,75.6,0,1,'lamp'); }
  for(let x=30;x<=130;x+=12.5) if(Math.abs(x-80)>14) stoneLantern(x,70.5);
  mirrorHalf('z',l0);
  for(const p of XF_PADS) xfPad(p[0],p[1]);
  /* on the axis: the crypt (the boss lair) and the avenue split around it */
  /* v26: open crypt pavilion — four corner piers only, a tank drives in under the roof; the Reaper sleeps in the sarcophagus */
  box(69,0,71,91,0.3,89,(X,Y,Z)=>{ const x=(X+0.5)*VS, z=(Z+0.5)*VS; if(x<72||x>88||z<72||z>88) return M.MID; return ((((x-72)/1.6)|0)+(((z-72)/1.6)|0))%2?M.MID:M.WALL; });
  for(const [x,z] of [[73.2,73.2],[86.8,73.2],[73.2,86.8],[86.8,86.8]]){ box(x-1.5,0.3,z-1.5,x+1.5,1.0,z+1.5,M.MID); box(x-1.15,1.0,z-1.15,x+1.15,6.0,z+1.15,(X,Y,Z)=>{ const y=(Y+0.5)*VS; return (y>3.2&&y<3.55)||(y>5.4)?M.MID:M.WALL; }); box(x-1.45,6.0,z-1.45,x+1.45,6.45,z+1.45,M.MID); }
  for(const z of [72.4,87.6]) box(72,6.45,z-1.0,88,7.4,z+1.0,(X,Y)=>((Y+0.5)*VS<6.8)?M.MID:M.WALL); for(const x of [72.4,87.6]) box(x-1.0,6.45,73.4,x+1.0,7.4,86.6,(X,Y)=>((Y+0.5)*VS<6.8)?M.MID:M.WALL);
  box(73.4,7.1,73.4,86.6,7.4,86.6,M.MID); roofHip(71.0,71.0,89.0,89.0,7.4,2.8,M.WALL,0.6); box(79.4,10.0,79.4,80.6,10.6,80.6,M.WALL); box(79.7,10.6,79.7,80.3,11.8,80.3,M.WALL); box(79.1,11.05,79.85,80.9,11.3,80.15,M.WALL);
  box(78.3,0.3,77.4,81.7,0.7,82.6,M.MID); box(78.6,0.7,77.7,81.4,1.45,82.3,M.WALL); box(78.4,1.45,77.5,81.6,1.75,82.5,M.MID); box(79.75,1.75,78.4,80.25,1.92,81.6,M.RUST); box(79.1,1.75,79.75,80.9,1.92,80.25,M.RUST);
  for(const [x,z] of [[80,72.4],[80,87.6],[72.4,80],[87.6,80]]){ box(x-0.06,5.3,z-0.06,x+0.06,6.45,z+0.06,M.DARK); lantern(x,4.95,z,true); }
    for(const sz of [69.6,90.4]) for(const sx of [76.5,83.5]){ box(sx-0.7,0,sz-0.7,sx+0.7,1.2,sz+0.7,M.MID); }
  for(const sz of [70.0,90.0]) for(const sx of [74.2,85.8]){ box(sx-0.22,0.3,sz-0.22,sx+0.22,1.5,sz+0.22,M.MID); lantern(sx,1.85,sz,true); }
  bigTree(50,36,R); bigTree(110,36,R); bigTree(18,64,R); bigTree(142,64,R); bigTree(50,124,R); bigTree(110,124,R); bigTree(18,96,R); bigTree(142,96,R);
  bigTree(80,6.5,R); bigTree(80,153.5,R); bigTree(8,8,R); bigTree(8,152,R);
  ARENA.lions=[[76.5,69.6],[83.5,69.6],[76.5,90.4],[83.5,90.4]]; ARENA.lair=[80,80]; }
function paintCemetery(s){ const grass=mix3(P.ground,[0.2,0.32,0.18],0.35), dark=mix3(grass,P.dark,0.35), grav=mix3(P.side,P.road,0.5);
  gx.fillStyle=cssA(grass,1); R_(0,0,WX,WZ/2); gx.fillStyle=cssA(dark,1); R_(28,12,104,48.5);
  gx.fillStyle=cssA(grav,1); R_(30,33,100,7); for(const x of [50,80,110]) R_(x-2.5,13,5,47); R_(76,60,8,14); R_(132,75,28,10);
  gx.fillStyle=cssA(mix3(dark,P.dark,0.35),1); for(let z=17;z<=56;z+=5){ if(z>31&&z<41) continue; for(let x=33;x<=127;x+=3){ if(Math.abs(x-50)<3.5||Math.abs(x-80)<3.5||Math.abs(x-110)<3.5) continue; if(Math.abs(x-80)<12&&z<30) continue; R_(x-0.45,z+0.25,0.9,1.9); } }
  /* memorial plaza (team flag spot) and flagstone patches (ammo spots) — plain paving, nothing written on them */
  const stone=mix3(grav,P.wall,0.3); gx.fillStyle=cssA(stone,1); gx.beginPath(); gx.arc(80*GS,24*GS,5.8*GS,0,TAU); gx.fill(); gx.strokeStyle=cssA(mix3(stone,P.dark,0.3),0.75); gx.lineWidth=0.12*GS;
  for(const rr of [2.0,3.9,5.8]){ gx.beginPath(); gx.arc(80*GS,24*GS,rr*GS,0,TAU); gx.stroke(); } gx.beginPath(); for(let k=0;k<12;k++){ const a=k/12*TAU, r0=k%2?3.9:2.0; gx.moveTo((80+Math.cos(a)*r0)*GS,(24+Math.sin(a)*r0)*GS); gx.lineTo((80+Math.cos(a)*5.8)*GS,(24+Math.sin(a)*5.8)*GS); } gx.stroke();
  flagstones(40,70,2.2,stone); flagstones(120,70,2.2,stone);
  gx.fillStyle=cssA(mix3(grass,[0.45,0.32,0.15],0.4),0.55); for(let k=0;k<30;k++){ const x=2+hash3(k,1,8)*156, z=2+hash3(k,2,8)*70; gx.beginPath(); gx.ellipse(x*GS,z*GS,(0.6+hash3(k,3,8))*GS,(0.4+hash3(k,4,8)*0.6)*GS,hash3(k,5,8)*3,0,TAU); gx.fill(); }
  arenaMirrorPaint('z');
  gx.fillStyle=cssA(grav,1); R_(0,75,160,10); gx.beginPath(); gx.ellipse(80*GS,80*GS,15*GS,13*GS,0,0,TAU); gx.fill(); }
/* mirror the painted first half onto the second (text is drawn afterwards so it stays readable) */
function arenaMirrorPaint(axis){ const W=GC.width, t=document.createElement('canvas'); t.width=t.height=W; const tg=t.getContext('2d'); tg.drawImage(GC,0,0);
  gx.save(); if(axis==='z'){ gx.translate(0,W); gx.scale(1,-1); gx.drawImage(t,0,0,W,W/2,0,0,W,W/2); } else { gx.translate(W,0); gx.scale(-1,1); gx.drawImage(t,0,0,W/2,W,0,0,W/2,W); } gx.restore(); }
function arenaPadLabels(pts){ gx.save(); gx.fillStyle=cssA(P.accent,0.85); gx.textAlign='center'; gx.textBaseline='middle'; gx.font=`800 ${0.9*GS}px Unbounded, Arial, sans-serif`;
  for(const [x,z] of pts) gx.fillText('БК',x*GS,z*GS); gx.restore(); }

/* ---------- 2. SCRAPYARD (north of the Industrial zone) · mirror across x=80 · gate S ---------- */
function junkHeap(cx,cz,r,H){ const a=c(cx-r)-1,b=c(cx+r)+1,f=c(cz-r)-1,g=c(cz+r)+1, pal=[M.RUST,M.RUST,M.METAL,M.DARK,M.TIRE,M.CGRY,M.CBLUE,M.RUST];
  for(let z=f;z<g;z++) for(let x=a;x<b;x++){ const wx=(x+0.5)*VS-cx, wz=(z+0.5)*VS-cz, d=Math.hypot(wx*1.0,wz*1.15)/r; if(d>=1) continue;
    const h=H*Math.pow(1-d,0.75)*(0.82+0.3*hash3(x>>3,z>>3,7)); const top=c(h); for(let y=0;y<top;y++){ const q=hash3(x>>2,y>>2,z>>2); put(x,y,z,q<0.55?M.RUST:q<0.75?M.METAL:q<0.85?M.DARK:q<0.92?M.TIRE:pal[(hash3(x>>1,y>>1,z>>1)*pal.length)|0]); } } }
function junkParts(cx,cz,r,H,R){ const cars=[M.CRED,M.CBLUE,M.CORNG,M.CGRN,M.TAXI,M.CGRY];
  for(let k=0,n=Math.round(6+r*1.3);k<n;k++){ const a=R()*TAU, d=r*(0.15+R()*0.7), x=cx+Math.cos(a)*d, z=cz+Math.sin(a)*d, y=H*Math.pow(Math.max(0,1-d/r),0.75)*0.8, yaw=R()*TAU, kind=R();
    if(kind<0.34){ const col=cars[(R()*cars.length)|0]; obox(x,y+0.4,z,0.9,0.65,1.9,yaw,(R()-0.5)*1.4,(R()-0.5)*1.2,(lx,ly,lz)=>ly>0.25&&Math.abs(lz)<0.9&&Math.abs(lx)>0.7?M.WINOFF:(ly>0.45&&Math.abs(lz)>1.0)?-1:col); }
    else if(kind<0.55){ ocyl(x,y+0.5,z,0.55,0.18,yaw,(R()-0.5)*1.2,0.4,(lx,ly)=>Math.hypot(lx,ly)<0.25?M.METAL:M.TIRE); }
    else if(kind<0.75){ ocyl(x,y+0.6,z,0.16,1.4+R()*1.4,yaw,0.4+R()*0.7,0,M.METAL,0.08); }
    else if(kind<0.9){ obox(x,y+0.5,z,0.75,0.05,1.0,yaw,0.6+R()*0.6,R(),cars[(R()*cars.length)|0]); }
    else { obox(x,y+0.3,z,0.12,0.12,1.3,yaw,0.9,0,M.METAL); obox(x,y+0.8,z,1.0,0.1,0.1,yaw,0.2,0,M.METAL); } } }
function carStack(x0,z0,n,lv,ax){ for(let i=0;i<n;i++) for(let j=0;j<lv;j++){ const x=ax?x0+i*3.4:x0, z=ax?z0:z0+i*3.4, h=hash3(i,j,x0|0), col=[M.CRED,M.CBLUE,M.CGRY,M.RUST,M.CORNG,M.CGRN][(h*6)|0];
    lbox(x,z,ax,-1.6,1.6,-0.85,0.85,j*1.15,j*1.15+1.1,LF(x,z,ax,(u,w,y)=>{ const ly=y-j*1.15; return (ly>0.5&&ly<0.72&&Math.abs(u)<1.2)?M.WINOFF:(hash3((u*4)|0,(ly*4)|0,(w*4)|0)<0.08?M.RUST:col); })); } }
function tyreStack(x,z,n){ for(let k=0;k<n;k++) cyl(x,z,0.55,k*0.32,k*0.32+0.3,(X,Y,Z)=>Math.hypot((X+0.5)*VS-x,(Z+0.5)*VS-z)<0.25?-1:M.TIRE); }
function dumpTruck(x,z){ CARS.push({x,z,b:[c(x-3),0,c(z-6),c(x+3),c(5.4),c(z+6)],n0:0,dead:false,fuse:0,smoke:0,big:2.4}); /* heading -z: cab at the front-left, tipping body over the rear */
  box(x-2.0,1.0,z-5.4,x+2.0,1.6,z+5.2,M.DARK); for(const s of [-1,1]) box(x+s*1.6-0.25,0.7,z-5.6,x+s*1.6+0.25,1.4,z+5.4,M.METAL);
  box(x-2.5,1.6,z-5.6,x+2.5,2.0,z-3.4,M.CORNG); box(x-2.4,0.9,z-5.75,x+2.4,1.6,z-5.5,(X,Y,Z)=>((X+Y)&1)?M.DARK:M.METAL); for(const s of [-1,1]) box(x+s*1.9-0.35,1.1,z-5.8,x+s*1.9+0.35,1.45,z-5.7,M.LAMP);
  box(x-2.45,2.0,z-5.4,x-0.2,4.2,z-3.4,(X,Y,Z)=>{ const y=(Y+0.5)*VS; return (y>2.9&&y<3.9&&((Z+0.5)*VS<z-5.2||(X+0.5)*VS<x-2.25))?M.WINOFF:M.CORNG; }); box(x-2.55,4.2,z-5.5,x-0.1,4.4,z-3.3,M.CORNG);
  box(x+0.2,2.0,z-5.2,x+2.2,2.9,z-3.6,M.METAL); box(x+0.5,2.9,z-4.9,x+1.9,3.2,z-3.9,M.DARK); ocyl(x+1.6,3.9,z-3.8,0.14,0.7,0,0,0,M.DARK);
  for(const s of [-1,1]) box(x+s*2.55-0.15,2.0,z-3.4,x+s*2.55+0.15,2.4,z-1.8,M.DARK);
  obox(x,3.0,z+1.5,2.55,1.15,4.3,0,-0.08,0,(lx,ly,lz)=>{ if(ly>-0.75&&Math.abs(lx)<2.25&&lz>-4.0&&lz<4.1) return ly>0.6?-1:(hash3((lx*3)|0,(ly*3)|0,(lz*3)|0)<0.3?M.RUST:-1); if(Math.abs(lz)<4.3&&ly>0.95&&Math.abs(lx)>2.3) return M.DARK; return Math.abs(lx)>2.4&&((lz*1.2)|0)%2===0?M.DARK:M.CORNG; });
  obox(x,4.2,z-3.0,2.55,0.12,1.4,0,0.05,0,M.CORNG);
  for(const [wz,s] of [[-4.2,-1],[-4.2,1],[2.3,-1],[2.3,1],[4.0,-1],[4.0,1]]) ocyl(x+s*1.95,1.1,z+wz,1.1,0.4,Math.PI/2,0,0,(lx,ly)=>Math.hypot(lx,ly)<0.5?M.METAL:M.TIRE); }
const JUNK_HEAPS=[[22,38,11,6.2],[46,60,8.5,4.8],[24,105,11.5,6.4],[50,133,8,4.6],[11,141,7,4.2],[44,84,6,3.8],[54,16,5.5,3.4],[62,128,4.5,3]];
function genJunk(R){ arenaEdge('S',M.METAL,2.4); const l0=LAMPS.length;
  /* first half (west, x<80): rail for the gantry, heaps, crushed-car walls, tyre stacks, site cabin */
  for(const rx of [61.2,62.8]) box(rx-0.08,0,16,rx+0.08,0.14,124,M.METAL);
  for(const [x,z,r,h] of JUNK_HEAPS) junkHeap(x,z,r,h);
  carStack(36,18,3,3,true); carStack(10,70,3,2,false); carStack(56,90,2,3,false); carStack(30,151,3,2,true); carStack(66,44,2,2,false); carStack(4,30,3,2,false); carStack(22,124,2,3,false); carStack(68,104,2,2,false);
  for(const [x,z,n] of [[14,58,5],[60,114,3],[16,121,4],[44,30,3],[6,94,4],[64,150,3],[34,92,5]]) tyreStack(x,z,n);
  rollOff(6,112,false,M.CBLUE); rollOff(34,128,true,M.CGRN); rollOff(56,40,false,M.CORNG); rollOff(44,153,true,M.CRED); rollOff(7,47,false,M.CGRY);
  ecoBlocks(28,82,4,false,2); ecoBlocks(52,104,4,true,2); ecoBlocks(20,2.4,5,true,1);
  for(const [x,z,ax,col] of [[30,8,true,M.CGRN],[66,24,false,M.CBLUE],[52,76,true,M.CGRY],[10,152,true,M.CORNG]]) dumpster(x,z,ax,col);
  box(7.6,0,90.5,10.4,0.25,93.5,M.MID); box(7.8,0.25,90.7,10.2,2.5,93.3,(X,Y,Z)=>{ const y=(Y+0.5)*VS; return y>1.2&&y<2.0&&(X+0.5)*VS>9.9?M.WIN:M.CGRY; }); box(7.5,2.5,90.4,10.5,2.7,93.6,M.METAL);
  box(4,0,4,12,0.3,12,M.MID); box(4.3,0.3,4.3,11.7,2.7,11.7,(X,Y,Z)=>{ const y=(Y+0.5)*VS, x=(X+0.5)*VS; return (y>1.2&&y<2.1&&((x%2.5)<1.4))?M.WINOFF:M.RUST; }); box(4,2.7,4,12,2.95,12,M.METAL);
  for(const [x,z] of [[20,8],[8,88],[40,152]]) streetLamp(x,z,1,0,'lamp');
  /* small clutter: drums, pallets, engines, white goods, pipe bundles, loose tyres */
  scatter(R,46,3,4,70,157,1.1,arenaAvoid([[80,160,8]]),(x,z,k)=>{ const t=k%6; if(t===0) drums(x,z,3+((R()*4)|0),R); else if(t===1) pallets(x,z,1+((R()*3)|0),R); else if(t===2) engineBlock(x,z,R); else if(t===3) fridge(x,z,R); else if(t===4) pipes(x,z,R()<0.5); else looseTyres(x,z,R); });
  mirrorHalf('x',l0);
  /* car parts sticking out of every heap — different on each side, same footprint */
  for(const [x,z,r,h] of JUNK_HEAPS) for(const s of [0,1]){ const [px,pz]=sideXZ('x',s,x,z); junkParts(px,pz,r,h,R); ARENA.piles.push({x:px,z:pz,r,h}); }
  /* gantry crane over both rails: A-frame legs on bogies, box girder, cab on top, trolley with a magnet holding a crushed car */
  for(const lx of [62,98]){ for(const lz of [57,71]){ obox(lx,4.6,lz+(lz<64?1.6:-1.6),0.45,4.7,0.45,0,lz<64?0.33:-0.33,0,M.CORNG); }
    box(lx-1.1,0,55.4,lx+1.1,1.1,72.6,M.DARK); for(const wz of [56.4,59.4,68.6,71.6]) ocyl(lx,0.55,wz,0.5,0.6,Math.PI/2,0,0,M.METAL); box(lx-0.8,8.7,57.5,lx+0.8,9.6,70.5,M.CORNG); box(lx-0.5,1.6,63.2,lx+0.5,2.4,64.8,M.DARK); }
  box(59,9.2,62,101,10.6,66,(X,Y,Z)=>{ const x=(X+0.5)*VS; return ((x*0.8)|0)%3===0?M.DARK:M.CORNG; }); box(59,10.6,61.6,101,10.75,66.4,M.METAL);
  box(76,10.75,62.4,84,12.9,65.6,(X,Y,Z)=>{ const y=(Y+0.5)*VS, z=(Z+0.5)*VS; return (y>11.5&&y<12.5&&(z<62.7||z>65.3))?M.WIN:M.MID; }); box(75.6,12.9,62,84.4,13.15,66,M.METAL); box(83,12.0,61.9,84,12.2,62.1,M.LAMP);
  box(66,8.4,62.4,71,9.2,65.6,M.DARK); for(const cz of [63.2,64.8]) box(68.4,5.0,cz-0.04,68.6,8.4,cz+0.04,M.METAL); cyl(68.5,64,1.1,4.6,5.0,M.DARK);
  obox(68.5,4.0,64,0.85,0.55,1.6,0.3,0,0,(lx,ly,lz)=>Math.abs(ly)<0.12?M.WINOFF:M.CBLUE);
  LAMPS.push({x:80,y:12.1,z:61.6,r:3,col:'lamp',size:2.2});
  dumpTruck(80,28); box(73,0,96,87,0.25,104,M.MID);
  ARENA.lair=[80,80]; }
function paintJunk(s){ const dirt=mix3(P.side,[0.42,0.34,0.24],0.4), oil=mix3(dirt,P.dark,0.55);
  gx.fillStyle=cssA(dirt,1); R_(0,0,WX/2,WZ); gx.fillStyle=cssA(mix3(dirt,P.road,0.5),1); R_(58,14,8,112);
  gx.fillStyle=cssA(P.wood,0.6); for(let z=16;z<124;z+=0.9) R_(60.6,z,2.8,0.3);
  for(let k=0;k<40;k++){ const x=4+hash3(k,1,3)*72, z=4+hash3(k,2,3)*152, r=0.6+hash3(k,3,3)*2.2; gx.fillStyle=cssA(oil,0.45); gx.beginPath(); gx.ellipse(x*GS,z*GS,r*GS,r*0.6*GS,hash3(k,4,3)*3,0,TAU); gx.fill(); }
  gx.strokeStyle=cssA(mix3(dirt,P.dark,0.3),0.6); gx.lineWidth=0.35*GS; gx.beginPath(); gx.moveTo(78*GS,160*GS); gx.bezierCurveTo(70*GS,120*GS,30*GS,96*GS,20*GS,70*GS); gx.stroke();
  /* weighbridge slab (team flag spot) and concrete pallet pads (ammo spots) */
  const conc=mix3(dirt,P.wall,0.35); gx.fillStyle=cssA(conc,1); R_(10.5,78.5,11,11); gx.fillStyle=cssA(mix3(conc,P.metal,0.55),1); R_(12.5,80.5,7,7);
  gx.strokeStyle=cssA(mix3(conc,P.dark,0.45),0.8); gx.lineWidth=0.1*GS; gx.beginPath(); for(let z=80.5;z<=87.51;z+=0.875){ gx.moveTo(12.5*GS,z*GS); gx.lineTo(19.5*GS,z*GS); } gx.stroke(); gx.strokeRect(10.5*GS,78.5*GS,11*GS,11*GS);
  for(const [x,z] of [[34,72],[30,146]]){ gx.fillStyle=cssA(conc,0.9); R_(x-2.3,z-2.3,4.6,4.6); gx.fillStyle=cssA(P.wood,0.7); for(let k=0;k<5;k++) R_(x-1.7,z-1.6+k*0.72,3.4,0.42); }
  arenaMirrorPaint('x'); gx.fillStyle=cssA(mix3(dirt,P.road,0.6),1); R_(74,96,12,64); }

/* ---------- 3. CAR DEALERSHIP (east of the River quarter) · mirror across z=80 · gate W ---------- */
const AUTO_BEDS=[[3,3,19,10],[26,3,70,9],[90,3,103,9],[118,3,146,9],[151,3,158,20],[151,42,158,60],[42,66,60,72.5],[100,67,122,72.5]];
const AUTO_ROWS=[[17,22.2,1],[23.4,28.6,-1],[35.6,40.8,1],[42,47.2,-1],[54.2,59.4,1]], AUTO_MED=[22.8,41.4];
function bigLamp(x,z){ box(x-0.18,0,z-0.18,x+0.18,8.2,z+0.18,M.METAL); box(x-1.6,8.0,z-0.12,x+1.6,8.25,z+0.12,M.METAL);
  for(const s of [-1,1]){ box(x+s*1.6-0.4,7.75,z-0.3,x+s*1.6+0.4,8.0,z+0.3,M.LAMP); LAMPS.push({x:x+s*1.6,y:7.85,z,r:5.2,col:'lamp',size:3.4}); }
  cyl(x,z,1.15,0,0.85,(X,Y,Z)=>{ const a=Math.atan2((Z+0.5)*VS-z,(X+0.5)*VS-x); return (((a+4)*3)|0)%2?M.AWN:M.MID; },0.35); }
function parkSign(x,z){ box(x-0.06,0,z-0.06,x+0.06,2.4,z+0.06,M.METAL); box(x-0.6,2.0,z-0.1,x+0.6,3.3,z+0.1,M.CBLUE); box(x-0.32,2.15,z-0.14,x-0.14,3.1,z+0.14,M.WALL); box(x-0.14,2.92,z-0.14,x+0.25,3.1,z+0.14,M.WALL); box(x-0.14,2.56,z-0.14,x+0.25,2.72,z+0.14,M.WALL); box(x+0.17,2.7,z-0.14,x+0.3,2.95,z+0.14,M.WALL); }
function boomGate(x,z0,z1){ box(x-0.35,0,z0-0.35,x+0.35,1.2,z0+0.35,M.AWN); box(x-0.2,1.2,z0-0.2,x+0.2,1.35,z0+0.2,M.LAMP);
  box(x-0.07,0.95,Math.min(z0,z1),x+0.07,1.1,Math.max(z0,z1),(X,Y,Z)=>(((Z+0.5)*VS*1.6)|0)%2?M.AWN:M.WALL); box(x-0.05,0,z1-0.05,x+0.05,0.95,z1+0.05,M.METAL); }
function guardBooth(x0,z0){ box(x0,0,z0,x0+3,0.25,z0+2.6,M.MID); box(x0+0.1,0.25,z0+0.1,x0+2.9,2.7,z0+2.5,(X,Y,Z)=>{ const y=(Y+0.5)*VS; return y>1.1&&y<2.2?M.WIN:M.WALL; });
  box(x0-0.3,2.7,z0-0.3,x0+3.3,2.95,z0+2.9,M.MID); box(x0+0.8,2.95,z0+0.8,x0+2.2,3.2,z0+1.8,M.NEON); LAMPS.push({x:x0+1.5,y:3.05,z:z0+1.3,r:1.2,col:'neon',size:1.2}); }
function carCarrier(x,z){ vehDetail('truck',x-6.2,z,true,null); lbox(x-6.2,z,true,1.2,3.0,-1.15,1.15,1.0,2.6,M.CBLUE); lbox(x-6.2,z,true,2.95,3.08,-1.0,1.0,1.7,2.3,M.WINOFF); lbox(x-6.2,z,true,-3,1.1,-1.2,1.2,0.55,1.0,M.DARK);
  box(x-9,0.9,z-1.25,x+5.5,1.15,z+1.25,M.METAL); box(x-9,3.0,z-1.25,x+5.5,3.2,z+1.25,M.METAL); for(let k=0;k<6;k++){ const px=x-8.6+k*2.8; for(const s of [-1,1]) box(px-0.08,1.15,z+s*1.2-0.08,px+0.08,3.0,z+s*1.2+0.08,M.CORNG); }
  for(const a of [-7.5,-6.4,3.0,4.1]) for(const s of [-1,1]) box(x+a-0.5,0,z+s*1.0-0.3,x+a+0.5,1.0,z+s*1.0+0.3,M.TIRE); }
function genAuto(R){ arenaEdge('W',M.METAL,1.8); const l0=LAMPS.length;
  /* first half (north, z<80): lamp islands with bollard rings, signs, booth + boom gate at the entry */
  for(const zm of AUTO_MED) for(let x=30;x<=140;x+=22) bigLamp(x,zm);
  for(const x of [52,104]) bigLamp(x,63);
  for(const [x,z] of [[21.5,19.6],[148.5,19.6],[21.5,44.6],[148.5,44.6],[21.5,57],[148.5,57]]) parkSign(x,z);
  guardBooth(9,68); boomGate(14,74.4,79.6); box(13.2,0,79.2,14.8,0.3,80,M.AWN);
  for(let x=126;x<=148;x+=4.4) box(x,0,66,x+3.6,1.0,66.8,(X,Y,Z)=>((X>>2)&1)?M.AWN:M.WALL);
  /* landscaped beds: kerbed islands with trees, clipped bushes and flowers */
  for(const [x0,z0,x1,z1] of AUTO_BEDS) plantBed(x0,z0,x1,z1,R);
  mirrorHalf('z',l0);
  /* parked cars in every row — independent on each side */
  const cols=[M.CRED,M.CBLUE,M.CGRY,M.CGRY,M.CORNG,M.CGRN,M.TAXI,M.WALL,M.DARK];
  for(const s of [0,1]) for(const [z0,z1,f] of AUTO_ROWS){ for(let x=24.3;x<=145;x+=2.6){ if(Math.abs(x-55)<3.4||Math.abs(x-105)<3.4) continue; if(z0>50&&Math.abs(x-80)<20) continue; const r=R(); if(r>0.58) continue;
      const zc=(z0+z1)/2, [px,pz]=sideXZ('z',s,x,zc), d=(s?-f:f);
      if(r<0.06&&x<140){ van(px+1.3,pz,false,cols[(R()*cols.length)|0],d); x+=2.6; } else sedan(px,pz,false,cols[(R()*cols.length)|0],d,R()<0.1); } }
  for(const s of [0,1]){ const [px,pz]=sideXZ('z',s,128,63); carCarrier(px,pz); for(const k of [0,1]){ sedan(px-6.4+k*5.2,pz,true,[M.CRED,M.CBLUE,M.TAXI,M.CGRN][s*2+k],1,false,1.15); sedan(px-6.4+k*5.2,pz,true,[M.CORNG,M.CGRY,M.WALL,M.CRED][s*2+k],1,false,3.2); } }
  /* the showroom: glass box, mullions, fascia, glass roof (meshes, shatter on blasts), five bright cars on turntables */
  box(63,0,68,97,0.3,92,M.MID);
  /* v26: steel frame with a real glass facade (mesh panes, see-through), solid roof with a glass skylight over the middle only */
  for(let x=64;x<=96.01;x+=3.2) for(const z of [69,91]) box(x-0.2,0.3,z-0.2,x+0.2,4.6,z+0.2,M.METAL);
  for(let k=1;k<7;k++){ const z=69+k*22/7; if(Math.abs(z-80)<2.5) continue; for(const x of [64,96]) box(x-0.2,0.3,z-0.2,x+0.2,4.6,z+0.2,M.METAL); }
  for(const z of [69,91]) box(64,0.3,z-0.15,96,0.55,z+0.15,M.DARK); for(const x of [64,96]){ box(x-0.15,0.3,69,x+0.15,0.55,77.7,M.DARK); box(x-0.15,0.3,82.3,x+0.15,0.55,91,M.DARK); for(const z of [77.6,82.4]) box(x-0.3,0.3,z-0.3,x+0.3,4.6,z+0.3,M.METAL); box(x-0.4,3.6,77.3,x+0.4,4.6,82.7,M.MID); }
  box(63.6,4.6,68.6,96.4,5.4,69.4,M.MID); box(63.6,4.6,90.6,96.4,5.4,91.4,M.MID); box(63.6,4.6,69.4,64.4,5.4,90.6,M.MID); box(95.6,4.6,69.4,96.4,5.4,90.6,M.MID);
  box(63.6,5.4,68.6,96.4,5.75,91.4,(X,Y,Z)=>{ const x=(X+0.5)*VS, z=(Z+0.5)*VS; return (x>72&&x<88&&z>74&&z<86)?-1:M.MID; }); for(const x of [72,88]) box(x-0.25,5.4,74,x+0.25,6.0,86,M.METAL); for(const z of [74,86]) box(72,5.4,z-0.25,88,6.0,z+0.25,M.METAL);
  for(const [x,z] of [[67,72],[93,72],[67,88],[93,88]]) box(x-1.0,5.75,z-0.8,x+1.0,6.6,z+0.8,(X,Y,Z)=>((X+Y)&1)?M.METAL:M.MID);
  for(const z of [69,91]) box(66,0.3,z+(z<80?0.3:-0.9),94,1.0,z+(z<80?0.9:-0.3),M.LEAF);
  for(const x of [64,96]) arenaGlassWall(x,69,x,91,0.55,4.6,7,[80]); for(const z of [69,91]) arenaGlassWall(64,z,96,z,0.55,4.6,10);
  glyphSign(76,5.75,90.6,90.9,'汽车',false,M.DARK,M.NEON,0.5); glyphSign(76,5.75,69.1,69.4,'汽车',false,M.DARK,M.NEON,0.5);
  for(const [x,z,col,sp] of [[71,74,M.CRED,1],[89,74,M.TAXI,0],[80,80,M.CORNG,1],[71,86,M.CBLUE,0],[89,86,M.CGRN,1]]){ cyl(x,z,2.4,0.3,0.42,M.NEON); sedan(x,z,true,col,x<80?1:-1,sp,0.14); }
  arenaPanes(72.2,74.2,87.8,85.8,5.7,3.12);
  for(const z of [74,86]) for(const x of [58,61]){ box(x-0.1,0,z-0.1,x+0.1,4.4,z+0.1,M.METAL); box(x-0.1,1.6,z-0.6,x+0.1,4.2,z-0.12,[M.CRED,M.NEON][(x>59)|0]); }
  amplinBoard(31,69,true); amplinBoard(155,80,false);
  for(const x of [66.5,93.5]) for(const z of [72,88]) { cyl(x,z,0.5,0.3,0.9,M.DARK); sphere(x,1.4,z,0.65,M.LEAF,0.2); }
  ARENA.lair=[80,80]; }
function arenaPanes(x0,z0,x1,z1,y,step){ const mat=new THREE.MeshBasicMaterial({color:0x9fe8ff,transparent:true,opacity:0.16,depthWrite:false,side:THREE.DoubleSide}), em=new THREE.LineBasicMaterial({color:0xcff4ff,transparent:true,opacity:0.45});
  for(let x=x0;x<x1-0.01;x+=step) for(let z=z0;z<z1-0.01;z+=step){ const w=Math.min(step,x1-x)-0.08, d=Math.min(step,z1-z)-0.08, g=new THREE.PlaneGeometry(w,d); const m=new THREE.Mesh(g,mat); m.rotation.x=-Math.PI/2; m.position.set(x+w/2+0.04,y,z+d/2+0.04);
    const e=new THREE.LineSegments(new THREE.EdgesGeometry(g),em); m.add(e); m.renderOrder=5; addExtra(m); ARENA.panes.push({m,x:m.position.x,z:m.position.z,y}); } }
function paneBreak(p){ p.m.visible=false; if(p.bb){ for(let k=0;k<10;k++) spark(p.x+(rnd()-0.5)*4,p.y,p.z+(rnd()-0.5)*4,(rnd()-0.5)*5,rnd()*3,(rnd()-0.5)*5,1,0.8,0.4,0.6); return; }
  for(let k=0;k<14;k++) spark(p.x+(rnd()-0.5)*(p.hw?p.hw*2:3),p.y+(rnd()-0.5)*(p.v?3:0),p.z+(rnd()-0.5)*(p.hd?p.hd*2:3),(rnd()-0.5)*4,-1-rnd()*3,(rnd()-0.5)*4,0.75,0.95,1,0.6); sNz(0.25,'highpass',3000,0.8,0.08); }
function arenaBlast(px,py,pz,R){ if(!ARENA.panes.length) return; for(const p of ARENA.panes){ if(!p.m.visible) continue; if(Math.hypot(p.x-px,p.z-pz)<R+1.6&&py>p.y-4.2) paneBreak(p); } }
function arenaGlassTick(){ const L=ARENA.panes; if(!L.length||TK.dead) return; for(let i=0;i<L.length;i++){ const p=L[i]; if(!p.v||!p.m.visible) continue; if(Math.abs(TK.x-p.x)<p.hw+1.45&&Math.abs(TK.z-p.z)<p.hd+1.45){ paneBreak(p); shake=Math.min(1,shake+0.08); } } }
function paintAuto(s){ const asph=mix3(P.road,P.dark,0.15), line=P.line;
  gx.fillStyle=cssA(asph,1); R_(0,0,WX,WZ/2); gx.fillStyle=cssA(mix3(asph,P.side,0.35),1); R_(0,74,40,6);
  gx.fillStyle=cssA(line,0.75); for(const [z0,z1] of AUTO_ROWS) for(let x=23;x<=146.5;x+=2.6){ if(Math.abs(x+1.3-55)<3.4||Math.abs(x+1.3-105)<3.4) continue; R_(x,z0,0.12,z1-z0); }
  for(const [z0,z1] of AUTO_ROWS) R_(23,z0,124,0.1), R_(23,z1-0.1,124,0.1);
  gx.fillStyle=cssA(mix3(asph,P.side,0.5),1); for(const zm of AUTO_MED) R_(22,zm-0.6,126,1.2);
  gx.fillStyle=cssA(line,0.7); for(const z of [13.5,32.1,50.7,63]) for(let x=6;x<150;x+=4) R_(x,z-0.06,2,0.12);
  gx.fillStyle=cssA(P.taxi,0.7); for(const x of [22,50,108,136]) for(let k=0;k<8;k++) R_(x-2+k*0.5,61,0.25,1.2);
  gx.save(); gx.fillStyle=cssA(line,0.8); for(const [x,z,a] of [[30,13.5,0],[90,32.1,Math.PI],[130,50.7,0],[40,63,0]]){ gx.save(); gx.translate(x*GS,z*GS); gx.rotate(a); gx.beginPath(); gx.moveTo(1.6*GS,0); gx.lineTo(0.4*GS,-0.8*GS); gx.lineTo(0.4*GS,-0.3*GS); gx.lineTo(-1.6*GS,-0.3*GS); gx.lineTo(-1.6*GS,0.3*GS); gx.lineTo(0.4*GS,0.3*GS); gx.lineTo(0.4*GS,0.8*GS); gx.closePath(); gx.fill(); gx.restore(); } gx.restore();
  for(let k=0;k<6;k++){ gx.fillStyle=cssA(line,0.85); R_(16+k*0.9,74.6,0.45,5); }
  /* wash bay (team flag spot), service hatches (ammo spots), soil in the planted beds */
  const conc=mix3(asph,P.wall,0.32); gx.fillStyle=cssA(conc,1); R_(149,25.5,10,13); gx.fillStyle=cssA(mix3(conc,P.water,0.35),0.6); gx.beginPath(); gx.ellipse(154*GS,32*GS,3.6*GS,4.6*GS,0,0,TAU); gx.fill();
  gx.fillStyle=cssA(P.dark,0.8); R_(153.6,27,0.8,10); gx.strokeStyle=cssA(mix3(conc,P.dark,0.4),0.8); gx.lineWidth=0.1*GS; gx.strokeRect(149*GS,25.5*GS,10*GS,13*GS);
  for(const [x,z] of [[14,36],[110,7]]){ gx.fillStyle=cssA(conc,0.95); R_(x-2.3,z-2.3,4.6,4.6); gx.fillStyle=cssA(mix3(conc,P.dark,0.5),1); gx.beginPath(); gx.arc(x*GS,z*GS,0.85*GS,0,TAU); gx.fill(); gx.strokeStyle=cssA(mix3(conc,P.dark,0.3),0.8); gx.beginPath(); gx.arc(x*GS,z*GS,1.15*GS,0,TAU); gx.stroke(); }
  gx.fillStyle=cssA(mix3(P.ground,[0.3,0.22,0.12],0.5),1); for(const [x0,z0,x1,z1] of AUTO_BEDS) R_(x0,z0,x1-x0,z1-z0);
  arenaMirrorPaint('z'); gx.fillStyle=cssA(mix3(asph,P.mid,0.25),1); R_(62,67,36,26);
  gx.save(); gx.fillStyle=cssA(P.accent,0.8); gx.textAlign='center'; gx.textBaseline='middle'; gx.font=`800 ${1.6*GS}px Unbounded, Arial, sans-serif`;
  const names=['A','B','C','D','E'], namesS=['K','L','M','N','P']; AUTO_ROWS.forEach(([z0,z1],i)=>{ for(const [x0,k] of [[30,1],[80,2],[130,3]]){ if(i===4&&k===2) continue; gx.fillText(names[i]+k,x0*GS,(z0+z1)/2*GS); gx.fillText(namesS[i]+k,x0*GS,(WZ-(z0+z1)/2)*GS); } });
  gx.font=`800 ${1.1*GS}px Unbounded, Arial, sans-serif`; gx.fillText('ВЪЕЗД',22*GS,77*GS); gx.fillText('ВЫЕЗД',22*GS,83*GS); gx.restore(); }

/* ---------- 4. FUN PARK «Golden Dragon» (south of the Village) · mirror across x=80 · gate N ---------- */
function kiosk2(x0,z0,w,d,mat){ box(x0,0,z0,x0+w,2.6,z0+d,(X,Y,Z)=>{ const y=(Y+0.5)*VS; return y>1.0&&y<1.9&&(Z+0.5)*VS>z0+d-0.4?M.SHOP:mat; });
  box(x0-0.4,2.6,z0-0.4,x0+w+0.4,2.85,z0+d+0.4,M.MID); box(x0-0.2,2.1,z0+d,x0+w+0.2,2.35,z0+d+1.0,(X)=>(X>>1)&1?M.AWN:M.WALL); LAMPS.push({x:x0+w/2,y:2.4,z:z0+d+0.6,r:1.6,col:'neon',size:1.4}); }
function teaCups(x,z){ cyl(x,z,6.5,0,0.35,M.MID); cyl(x,z,6.2,0.35,0.5,(X,Y,Z)=>{ const a=Math.atan2((Z+0.5)*VS-z,(X+0.5)*VS-x), d=Math.hypot((X+0.5)*VS-x,(Z+0.5)*VS-z); return d>5.7?M.AWN:((((a+4)*16/TAU)|0)%2?M.TILE:M.WALL); });
  /* teapot hub */ cyl(x,z,1.5,0.5,0.95,M.CBLUE); sphere(x,1.95,z,1.35,M.CBLUE); cyl(x,z,0.8,3.0,3.3,M.WALL); sphere(x,3.5,z,0.3,M.LANT); obox(x+1.55,2.25,z,0.2,0.2,0.8,Math.PI/2,-0.75,0,M.CBLUE); ocyl(x-1.45,2.1,z,0.5,0.17,0,0,0,M.CBLUE,0.24);
  for(let k=0;k<6;k++){ const a=k/6*TAU+0.3, cx=x+Math.cos(a)*4.0, cz=z+Math.sin(a)*4.0, col=[M.CRED,M.CBLUE,M.CORNG,M.CGRN,M.TAXI,M.BLOS][k];
    cyl(cx,cz,1.3,0.5,0.66,M.METAL); cyl(cx,cz,0.5,0.66,0.86,col); cyl(cx,cz,1.12,0.86,1.8,(X,Y)=>(Y+0.5)*VS>1.6?M.WALL:col,0.36); cyl(cx,cz,0.32,0.86,1.35,M.METAL); ocyl(cx+Math.cos(a)*1.22,1.35,cz+Math.sin(a)*1.22,0.32,0.17,Math.atan2(-Math.sin(a),Math.cos(a)),0,0,col,0.14); }
  LAMPS.push({x,y:3.4,z,r:2,col:'neon',size:1.6}); }
function bumperCar(x,z,col){ box(x-1.05,0,z-0.8,x+1.05,0.42,z+0.8,M.TIRE); box(x-0.9,0.42,z-0.66,x+0.9,0.8,z+0.66,col); box(x+0.2,0.8,z-0.55,x+0.75,1.35,z+0.55,col); box(x-0.35,0.8,z-0.5,x+0.2,1.0,z+0.5,M.DARK); box(x-0.75,0.8,z-0.15,x-0.45,1.15,z+0.15,M.DARK); box(x+0.55,0.8,z-0.06,x+0.67,4.4,z+0.06,M.METAL); }
function bumperHall(x0,z0,w,d){ for(let x=x0;x<=x0+w+0.01;x+=4) for(const z of [z0,z0+d]) box(x-0.2,0,z-0.2,x+0.2,4.4,z+0.2,M.METAL); for(let z=z0+4;z<z0+d;z+=4) for(const x of [x0,x0+w]) box(x-0.2,0,z-0.2,x+0.2,4.4,z+0.2,M.METAL);
  box(x0-0.4,4.4,z0-0.4,x0+w+0.4,4.8,z0+d+0.4,(X,Y,Z)=>{ const x=(X+0.5)*VS, z=(Z+0.5)*VS; return (x<x0+0.4||x>x0+w-0.4||z<z0+0.4||z>z0+d-0.4)?(((x+z)|0)%2?M.AWN:M.NEON):-1; });
  for(let x=x0+2;x<x0+w;x+=2) box(x-0.05,4.5,z0,x+0.05,4.7,z0+d,M.METAL); for(let z=z0+2;z<z0+d;z+=2) box(x0,4.5,z-0.05,x0+w,4.7,z+0.05,M.METAL);
  box(x0-0.3,0,z0-0.3,x0+w+0.3,0.55,z0-0.1,M.TIRE); box(x0-0.3,0,z0+d+0.1,x0+w+0.3,0.55,z0+d+0.3,M.TIRE); }
function coasterH(a){ return 3.0+2.2*Math.max(0,Math.sin(a+0.4))+0.8*Math.sin(a*3+0.6); }
function coasterLoop(cx,cz,rx,rz){ const n=26, Pt=a=>[cx+Math.cos(a)*rx,cz+Math.sin(a)*rz];
  for(let k=0;k<n;k++){ const a=k/n*TAU, [x,z]=Pt(a), h=coasterH(a), tx=-Math.sin(a)*rx, tz=Math.cos(a)*rz, tl=Math.hypot(tx,tz), nx=tz/tl, nz=-tx/tl, yaw=Math.atan2(nx,nz);
    box(x-0.5,0,z-0.5,x+0.5,0.3,z+0.5,M.MID); for(const s of [-1,1]) obox(x+nx*s*0.5,h/2,z+nz*s*0.5,0.17,h/2-0.1,0.17,0,0,0,M.METAL); obox(x,h*0.45,z,0.17,0.17,0.62,yaw,0,0,M.METAL); if(h>4) obox(x,h*0.75,z,0.17,0.17,0.62,yaw,0,0,M.METAL); }
  for(let k=0;k<n*5;k++){ const a=k/(n*5)*TAU, a2=(k+1)/(n*5)*TAU, [x,z]=Pt(a), [x2,z2]=Pt(a2), L=Math.hypot(x2-x,z2-z), yaw=Math.atan2(x2-x,z2-z), h1=coasterH(a), h2=coasterH(a2), pt=Math.atan2(h1-h2,L), mx=(x+x2)/2, mz=(z+z2)/2, mh=(h1+h2)/2;
    obox(mx,mh,mz,0.62,0.17,L/2+0.1,yaw,pt,0,(lx)=>Math.abs(lx)>0.42?M.CRED:(k%2?M.DARK:-1)); obox(mx,mh-0.36,mz,0.2,0.2,L/2+0.1,yaw,pt,0,M.DARK); }
  /* the train: four open cars on the lift hill */
  for(let i=0;i<4;i++){ const a=0.62+i*0.13, a2=a+0.02, [x,z]=Pt(a), [x2,z2]=Pt(a2), L=Math.hypot(x2-x,z2-z), yaw=Math.atan2(x2-x,z2-z), h=coasterH(a), pt=Math.atan2(h-coasterH(a2),L), col=i%2?M.TAXI:M.CRED;
    obox(x,h+0.55,z,0.66,0.42,0.82,yaw,pt,0,(lx,ly,lz)=>{ if(ly>0.0&&Math.abs(lx)<0.42&&Math.abs(lz)<0.58) return ly<0.2?M.DARK:-1; if(i===3&&lz>0.5&&ly>0.1) return M.WALL; return col; }); obox(x,h+0.15,z,0.5,0.15,0.7,yaw,pt,0,M.DARK); if(i===3) obox(x+Math.sin(yaw)*0.95,h+0.45,z+Math.cos(yaw)*0.95,0.6,0.3,0.25,yaw,pt,0,col); }
  /* station with a canopy at the low end */ { const a=Math.PI*1.38, [x,z]=Pt(a), h=coasterH(a); box(x-2.2,0,z-1.6,x+2.2,Math.max(0.3,h-0.6),z+1.6,M.MID); for(const [dx,dz] of [[-2,-1.4],[2,-1.4],[-2,1.4],[2,1.4]]) box(x+dx-0.12,0,z+dz-0.12,x+dx+0.12,h+2.6,z+dz+0.12,M.METAL); box(x-2.5,h+2.6,z-1.9,x+2.5,h+2.85,z+1.9,(X)=>(X>>1)&1?M.CRED:M.WALL); } }
function chairSwing(x,z){ cyl(x,z,2.1,0,0.45,M.MID); cyl(x,z,1.5,0.45,1.3,M.CBLUE); cyl(x,z,0.5,1.3,6.6,(X,Y)=>(((Y+0.5)*VS*1.4)|0)%2?M.METAL:M.WALL);
  const ang=(X,Z)=>Math.atan2((Z+0.5)*VS-z,(X+0.5)*VS-x); for(let i=0;i<4;i++){ const rr=3.7-i*0.85, y=6.6+i*0.3; cyl(x,z,rr,y,y+0.32,(X,Y,Z)=>((((ang(X,Z)+Math.PI)/TAU*12)|0)%2)?M.AWN:M.WALL); }
  cyl(x,z,3.75,6.25,6.6,(X,Y,Z)=>{ const d=Math.hypot((X+0.5)*VS-x,(Z+0.5)*VS-z); return d<3.3?-1:((((ang(X,Z)+Math.PI)/TAU*30)|0)%2?M.NEON:-1); }); cyl(x,z,0.6,7.8,8.3,M.NEON); box(x-0.05,8.3,z-0.05,x+0.05,9.1,z+0.05,M.METAL); box(x,8.7,z-0.05,x+0.7,9.05,z+0.05,M.CRED);
  LAMPS.push({x,y:7.1,z,r:2.6,col:'neon',size:2.2});
  for(let k=0;k<12;k++){ const a=k/12*TAU, tx=x+Math.cos(a)*3.4, tz=z+Math.sin(a)*3.4, sx=x+Math.cos(a)*4.7, sz=z+Math.sin(a)*4.7; for(let t=0.08;t<0.95;t+=0.14) box(tx+(sx-tx)*t-0.06,6.25+(2.9-6.25)*t-0.06,tz+(sz-tz)*t-0.06,tx+(sx-tx)*t+0.06,6.25+(2.9-6.25)*t+0.06,tz+(sz-tz)*t+0.06,M.METAL);
    obox(sx,2.75,sz,0.34,0.08,0.3,Math.atan2(Math.cos(a),Math.sin(a)),0,0,[M.CRED,M.CBLUE,M.TAXI][k%3]); obox(sx+Math.cos(a)*0.28,3.05,sz+Math.sin(a)*0.28,0.34,0.3,0.08,Math.atan2(Math.cos(a),Math.sin(a)),0,0,[M.CRED,M.CBLUE,M.TAXI][k%3]); } }
function genPark(R){ arenaEdge('N',M.RUST,1.4); const l0=LAMPS.length;
  /* first half (west, x<80) */
  bumperHall(26,28,22,16); for(let k=0;k<6;k++){ const x=30+(k%3)*6.5+((k/3)|0)*1.8, z=31.5+((k/3)|0)*7.2; bumperCar(x,z,[M.CRED,M.CBLUE,M.TAXI,M.CGRN,M.CORNG,M.BLOS][k]); }
  box(50.5,0,24,53.5,2.6,26.6,(X,Y,Z)=>{ const y=(Y+0.5)*VS; return y>1.1&&y<2.0&&(X+0.5)*VS<50.9?M.WIN:M.CRED; }); box(50.2,2.6,23.7,53.8,2.85,26.9,M.WALL);
  rectFence(24.4,26.4,49.6,45.6,[],[[13,4.2]],[],[[9,4.2]]);
  teaCups(34,96); ringFence(34,96,8.0,[[0.59,0.32]]); coasterLoop(44,132,13,8); rectFence(29,121,59.5,143,[[15,4.4]],[],[],[[11,4.4]]); chairSwing(56,62); ringFence(56,62,5.8,[[0.64,0.34]]);
  /* swimming pool (water 8..22 × 60..74): loungers and parasols on the tiled deck, a ladder, a diving board */
  for(const z of [62.6,66.6,70.6]){ lounger(24.4,z,M.CBLUE); lounger(5.6,z,M.CORNG); } for(const z of [64.6,68.6]){ parasol(24.4,z,M.CRED); parasol(5.6,z,M.CBLUE); }
  poolLadder(12,74); poolLadder(19,74); divingBoard(15,60); box(22.6,0,57,23.4,2.4,57.8,M.WOOD); box(22.3,2.4,56.7,23.7,2.55,58.1,M.WOOD); box(22.4,2.55,57.2,23.6,2.75,57.6,M.CRED);
  /* ice cream, popcorn, balloons */
  iceKiosk(20,48,true,M.BLOS); iceKiosk(62,92,false,M.CBLUE); iceKiosk(50,150,true,M.TAXI); iceKiosk(40,12,true,M.CGRN); iceKiosk(68,30,false,M.CRED); popcorn(14,100); popcorn(66,140); balloons(64,74,R); balloons(30,112,R);
  kiosk2(8,84,4,3,M.CRED); kiosk2(60,20,4,3,M.CBLUE); kiosk2(10,40,4,3,M.TAXI); kiosk2(62,116,4,3,M.CGRN); kiosk2(66,150,4,3,M.CORNG);
  box(6,0,112,15,2.8,116,(X,Y,Z)=>{ const y=(Y+0.5)*VS; return y>1.0&&y<2.2&&(Z+0.5)*VS>115.5?M.DARK:M.WOOD; }); box(5.6,2.8,111.6,15.4,3.05,116.4,M.AWN);
  for(let x=7;x<15;x+=1.6) box(x-0.25,1.3,112.2,x+0.25,1.8,112.4,M.NEON);
  hedge(28,72,40,73); hedge(26,85,40,86); hedge(66,96,72,112); hedge(66,40,72,54); hedge(4,150,24,151); hedge(30,20,48,21);
  for(let z=12;z<=150;z+=14) if(Math.abs(z-80)>18) { lantern(73.5,2.2,z,true); box(73.4,0,z-0.1,73.6,1.85,z+0.1,M.DARK); }
  for(const [x,z] of [[30,55],[22,104],[50,82],[66,134]]) tree(x,z,R,true);
  scatter(R,22,4,4,71,156,1.2,arenaAvoid([[80,80,14],[15,67,12]]),(x,z,k)=>{ const t=k%4; if(t===0) bench(x,z); else if(t===1) binPost(x,z); else if(t===2) flowerBed(x,z); else { bench(x,z); binPost(x+1.4,z); } });
  mirrorHalf('x',l0);
  /* on the axis: entrance arch, the carousel on the central plaza */
  paifang(80,8);
  cyl(80,80,7.2,0,0.5,M.TILE); cyl(80,80,6.8,0.5,0.75,M.WOOD); cyl(80,80,1.0,0.75,5.0,M.NEON); for(let k=0;k<12;k++){ const a=k/12*TAU, x=80+Math.cos(a)*5.2, z=80+Math.sin(a)*5.2; box(x-0.06,0.75,z-0.06,x+0.06,4.8,z+0.06,M.METAL); box(x-0.25,1.4+0.4*(k%2),z-0.6,x+0.25,2.1+0.4*(k%2),z+0.6,[M.WALL,M.TAXI,M.CRED][k%3]); }
  for(let i=0;i<8;i++){ const r=7.4-i*0.9, y=4.8+i*0.32; cyl(80,80,r,y,y+0.34,i%2?M.AWN:M.WALL,i===0?0:0.9); } sphere(80,7.6,80,0.5,M.LANT);
  for(let k=0;k<16;k++){ const a=k/16*TAU; LAMPS.push({x:80+Math.cos(a)*7.3,y:4.9,z:80+Math.sin(a)*7.3,r:1.2,col:'neon',size:1.2}); }
  ringFence(80,80,9.6,[[0,0.2],[Math.PI/2,0.2],[Math.PI,0.2],[-Math.PI/2,0.2]]);
  ARENA.lair=[80,80]; ARENA.ring=[[80,40],[110,52],[122,80],[110,110],[80,122],[50,110],[38,80],[50,52]]; }
function paintPark(s){ const grass=mix3(P.ground,[0.22,0.36,0.2],0.32), path=mix3(P.side,P.wall,0.25), tile=mix3(P.road,P.side,0.6);
  gx.fillStyle=cssA(grass,1); R_(0,0,WX/2,WZ); gx.fillStyle=cssA(path,1); R_(76,0,4,160);
  gx.lineWidth=5*GS; gx.strokeStyle=cssA(path,1); gx.beginPath(); gx.ellipse(80*GS,80*GS,42*GS,40*GS,0,0,TAU); gx.stroke();
  gx.lineWidth=4*GS; gx.beginPath(); gx.moveTo(38*GS,80*GS); gx.lineTo(10*GS,80*GS); gx.moveTo(52*GS,52*GS); gx.lineTo(37*GS,36*GS); gx.moveTo(52*GS,108*GS); gx.lineTo(34*GS,96*GS); gx.moveTo(50*GS,112*GS); gx.lineTo(42*GS,132*GS); gx.stroke();
  gx.fillStyle=cssA(tile,1); R_(25,27,24,18); gx.beginPath(); gx.arc(34*GS,96*GS,7*GS,0,TAU); gx.fill();
  gx.fillStyle=cssA(mix3(grass,[0.9,0.3,0.4],0.25),0.7); for(let k=0;k<26;k++){ const x=4+hash3(k,5,9)*68, z=6+hash3(k,6,9)*148; gx.beginPath(); gx.arc(x*GS,z*GS,(0.5+hash3(k,7,9))*GS,0,TAU); gx.fill(); }
  /* mosaic rose (team flag spot), tiled picnic squares (ammo spots), pool deck with coping */
  gx.fillStyle=cssA(tile,1); gx.beginPath(); gx.arc(22*GS,140*GS,5.8*GS,0,TAU); gx.fill(); for(let k=0;k<16;k++){ const a=k/16*TAU, r1=k%2?3.2:5.2; gx.fillStyle=cssA(k%4===0?mix3(tile,[0.85,0.35,0.3],0.45):k%2?mix3(tile,P.wall,0.4):mix3(tile,[0.95,0.75,0.3],0.4),1); gx.beginPath(); gx.moveTo(22*GS,140*GS); gx.lineTo((22+Math.cos(a-0.2)*1.2)*GS,(140+Math.sin(a-0.2)*1.2)*GS); gx.lineTo((22+Math.cos(a)*r1)*GS,(140+Math.sin(a)*r1)*GS); gx.lineTo((22+Math.cos(a+0.2)*1.2)*GS,(140+Math.sin(a+0.2)*1.2)*GS); gx.fill(); }
  gx.strokeStyle=cssA(mix3(tile,P.dark,0.3),0.8); gx.lineWidth=0.18*GS; gx.beginPath(); gx.arc(22*GS,140*GS,5.8*GS,0,TAU); gx.stroke();
  for(const [x,z] of [[54,106],[16,22]]){ for(let i=0;i<4;i++) for(let j=0;j<4;j++){ gx.fillStyle=cssA((i+j)%2?tile:mix3(tile,P.wall,0.35),1); R_(x-2.2+i*1.1,z-2.2+j*1.1,1.1,1.1); } }
  gx.fillStyle=cssA(mix3(tile,P.wall,0.25),1); R_(3.5,55,23,23); gx.strokeStyle=cssA(mix3(tile,P.dark,0.25),0.55); gx.lineWidth=0.06*GS; gx.beginPath(); for(let v=3.5;v<=26.51;v+=1){ gx.moveTo(v*GS,55*GS); gx.lineTo(v*GS,78*GS); } for(let v=55;v<=78.01;v+=1){ gx.moveTo(3.5*GS,v*GS); gx.lineTo(26.5*GS,v*GS); } gx.stroke();
  gx.fillStyle=cssA(mix3(P.wall,[1,1,1],0.3),1); R_(7.3,59.3,15.4,15.4);
  arenaMirrorPaint('x'); gx.fillStyle=cssA(path,1); R_(74,0,12,160); gx.fillStyle=cssA(tile,1); gx.beginPath(); gx.arc(80*GS,80*GS,16*GS,0,TAU); gx.fill();
  gx.strokeStyle=cssA(P.accent,0.5); gx.lineWidth=0.3*GS; for(const r of [9,12.5,15]){ gx.beginPath(); gx.arc(80*GS,80*GS,r*GS,0,TAU); gx.stroke(); }
  }
/* symmetric enemy placement: a first-half list mirrored to the other half */
function symE(axis,list){ const out=[]; for(const e of list){ out.push(e); const [x,z]=axis==='z'?[e[1],160-e[2]]:[160-e[1],e[2]]; out.push([e[0],x,z,e[3]]); } return out; }

const LOCS={
 camp:{lawns:[[47,47,53.6,62],[23,26,33,33],[36.5,52,43.5,60]],cn:'七号营地',ru:'Лагерь №7',sub:'безопасная зона · гараж · штаб',safe:true,wh:14,exits:{N:'north',S:'south',W:'west',E:'east'},water:[],gen:genCamp,paint:paintCamp,fog:[52,135]},
 north:{lawns:[[32.4,48,34.6,79],[45.4,48,47.6,79],[32.4,1,34.6,32],[45.4,1,47.6,32]],cn:'金海工业区',ru:'Промзона',sub:'заводы и склады · север',dir:'на севере',wh:18,exits:{S:'camp',W:'nw',E:'ne',N:'junk'},water:[],gen:genIndustrial,paint:paintIndustrial,fog:[44,120],
   enemies:[['factory',66,40],['jian',20,40],['jian',27,46],['jian',40,22],['jian',45,27],['jian',58,46],['jian',48,58],['bull',30,40,{mod:'mg'}],['bull',40,60,{mod:'ac'}]]},
 west:{lawns:[[2,46.5,22,78],[66,26.2,79,30.5]],cn:'九龙湾',ru:'Деловой центр',sub:'высотки · запад',dir:'на западе',wh:28,exits:{E:'camp',N:'nw',S:'sw',W:'cem'},water:[],gen:genCity,paint:paintCity,fog:[46,125],
   enemies:[['lamp',34.6,18],['lamp',45.4,62],['lamp',18,45.4],['lamp',62,34.6],['bull',20,40,{mod:'mortar'}],['bull',40,20,{mod:'ac'}],['jian',52,40],['jian',40,54],['jian',28,40]]},
 south:{lawns:[[1,1,34,36],[46,1,79,16],[1,44,34,46.5],[21,58,34,79],[46,58,79,79]],lawnPaint:false,cn:'桃花村',ru:'Деревня',sub:'рисовые поля · юг',dir:'на юге',wh:12,exits:{N:'camp',W:'sw',E:'se',S:'park'},water:[[8,22,20,32]],gen:genVillage,paint:paintVillage,terrain:terrVillage,fog:[40,115],
   enemies:[['factory',60,40],['hive',66,26],['hive',12,62],['jian',30,40],['jian',44,30],['jian',50,52],['jian',22,40],['bull',40,64,{mod:'ac'}]]},
 east:{lawns:[[2,66,33,78]],cn:'灵水镇',ru:'Речной квартал',sub:'каналы и мосты · восток',dir:'на востоке',wh:24,exits:{W:'camp',N:'ne',S:'se',E:'auto'},water:[[8,52,35.5,58],[44.5,52,80,58],[58,0,64,34.4],[58,45.6,64,80]],gen:genWater,paint:paintWater,fog:[44,120],
   enemies:[['hive',14,74],['bull',50,40,{mod:'ac'}],['bull',40,70,{mod:'mg'}],['jian',60,40],['jian',40,20],['jian',70,40],['jian',30,40],['lamp',38,14]]},
 nw:{lawns:[[2,52,34,78]],cn:'北站',ru:'Вокзал',sub:'ж/д депо · северо-запад',dir:'на северо-западе',wh:14,exits:{E:'north',S:'west'},water:[],gen:genStation,paint:paintStation,fog:[44,120],
   enemies:[['hive',22,72],['bull',58,40,{mod:'ac'}],['bull',40,58,{mod:'mortar'}],['jian',30,40],['jian',40,30],['jian',62,30],['jian',20,40],['jian',66,56],['lamp',45.4,62]]},
 ne:{lawns:[[2,62,33,78]],cn:'东港',ru:'Морской порт',sub:'краны и контейнеры · северо-восток',dir:'на северо-востоке',wh:16,exits:{W:'north',S:'east'},water:[[50,0.6,79.4,30]],gen:genPort,paint:paintPort,fog:[46,125],
   enemies:[['factory',20,40],['jian',40,28],['jian',30,46],['jian',40,60],['jian',54,40],['bull',40,48,{mod:'mg'}],['bull',62,46,{mod:'ac'}]]},
 sw:{lawns:[[1,1,34,34],[46,46,79,79],[1,46,34,79],[46,1,79,34]],lawnPaint:false,cn:'新区',ru:'Новостройки',sub:'стройка · юго-запад',dir:'на юго-западе',wh:26,exits:{N:'west',E:'south'},water:[],gen:genSite,paint:paintSite,fog:[44,120],
   enemies:[['lamp',20,30],['lamp',60,28],['bull',40,24,{mod:'ac'}],['bull',30,40,{mod:'mortar'}],['bull',58,44,{mod:'mg'}],['jian',40,40],['jian',22,46],['jian',46,30]]},
 se:{lawns:[[1,1,34,34],[46,1,79,34],[1,46,34,79]],lawnPaint:false,cn:'茶山寺',ru:'Чайные холмы',sub:'монастырь · юго-восток',dir:'на юго-востоке',wh:18,exits:{W:'south',N:'east'},water:[],gen:genTemple,paint:paintTemple,fog:[44,120],
   enemies:[['hive',18,18],['hive',62,18],['bull',40,30,{mod:'ac'}],['jian',30,40],['jian',40,44],['jian',18,62],['jian',50,40],['lamp',75,74]]},
 cem:{size:160,arena:{axis:'z',bases:[[80,24],[80,136]],pads:[[40,70],[120,70],[40,90],[120,90]]},lawns:[],cn:'义冢',ru:'Старое кладбище',sub:'склеп и надгробия · дальний запад',dir:'на дальнем западе',wh:12,exits:{E:'west'},water:[],gen:genCemetery,paint:paintCemetery,fog:[60,150],
   enemies:symE('z',[['jian',40,30],['jian',100,52],['jian',66,42],['jian',140,44],['bull',120,30,{mod:'mortar'}],['bull',30,66,{mod:'ac'}],['bull',80,50,{mod:'mg'}],['lamp',60,75.6],['hive',110,20]])},
 junk:{size:160,arena:{axis:'x',bases:[[16,84],[144,84]],pads:[[34,72],[30,146],[126,72],[130,146]]},lawns:[],cn:'废品场',ru:'Свалка',sub:'металлолом и козловой кран · дальний север',dir:'на дальнем севере',wh:14,exits:{S:'north'},water:[],gen:genJunk,paint:paintJunk,fog:[60,150],
   enemies:symE('x',[['jian',30,50],['jian',50,110],['jian',20,90],['jian',60,72],['bull',40,30,{mod:'ac'}],['bull',30,140,{mod:'mortar'}],['bull',56,100,{mod:'mg'}],['hive',14,26],['factory',22,120],['lamp',8,88]])},
 auto:{size:160,arena:{axis:'z',bases:[[154,32],[154,128]],pads:[[14,36],[110,7],[14,124],[110,153]]},lawns:[],cn:'汽车城',ru:'Автосалон',sub:'парковка и шоурум · дальний восток',dir:'на дальнем востоке',wh:12,exits:{W:'east'},water:[],gen:genAuto,paint:paintAuto,fog:[60,150],
   enemies:symE('z',[['jian',40,32],['jian',90,51],['jian',130,32],['jian',100,13],['bull',60,13,{mod:'ac'}],['bull',120,51,{mod:'mortar'}],['bull',30,51,{mod:'mg'}],['lamp',52,63],['hive',140,10]])},
 park:{size:160,arena:{axis:'x',bases:[[22,140],[138,140]],pads:[[54,106],[16,22],[106,106],[144,22]]},lawns:[],cn:'游乐园',ru:'Луна-парк',sub:'«Золотой дракон» · аттракционы · дальний юг',dir:'на дальнем юге',wh:10,exits:{N:'south'},water:[[8,60,22,74],[138,60,152,74]],gen:genPark,paint:paintPark,fog:[60,150],
   enemies:symE('x',[['jian',30,60],['jian',40,110],['jian',20,140],['jian',60,140],['bull',50,30,{mod:'ac'}],['bull',30,84,{mod:'mortar'}],['bull',60,92,{mod:'mg'}],['hive',14,100],['lamp',66,70]])},
};

/* capture-the-flag spawn points: open ground, clear of buildings, trees and overhead objects (2–3 per district) */
const FLAG_PTS={"north":[[38,40],[40,16],[72,40]],"west":[[54,22],[40,38],[12,52]],"south":[[40,36],[12,66],[68,28]],"east":[[38,16],[40,38],[40,68]],"nw":[[8,58],[40,38],[26,66]],"ne":[[62,38],[40,16],[40,38]],"sw":[[40,66],[22,26],[28,52]],"se":[[42,38],[40,56],[40,12]]}; for(const k in FLAG_PTS) LOCS[k].flags=FLAG_PTS[k];
let LOC=LOCS.camp, LOC_ID='camp';
function inWater(x,z){ const W=LOC.water; for(let i=0;i<W.length;i++){ const r=W[i]; if(x>r[0]&&x<r[2]&&z>r[1]&&z<r[3]) return true; } return false; }

