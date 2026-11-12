/* ================= LOCATION: INDUSTRIAL (north) ================= */
function partitions(x0,z0,w,d,y0,fl,fh,m,step){ step=step||5; const t=Math.max(VS,0.24), nx=Math.max(1,Math.round(w/step)), nz=Math.max(1,Math.round(d/step)), sx=w/nx, sz=d/nz;
  const door=(u,seg,yy)=>{ const lu=u-Math.floor(u/seg)*seg, ly=(yy-y0)-Math.floor((yy-y0)/fh)*fh; return Math.abs(lu-seg*0.5)<0.65&&ly<2.3; };
  for(let k=1;k<nx;k++){ const x=x0+sx*k; box(x-t/2,y0,z0+0.35,x+t/2,y0+fl*fh,z0+d-0.35,(X,Y,Z)=>door((Z+0.5)*VS-z0,sz,(Y+0.5)*VS)?-1:m); }
  for(let k=1;k<nz;k++){ const z=z0+sz*k; box(x0+0.35,y0,z-t/2,x0+w-0.35,y0+fl*fh,z+t/2,(X,Y,Z)=>door((X+0.5)*VS-x0,sx,(Y+0.5)*VS)?-1:m); } }
function tower(x0,z0,w,d,fl,fh,bal,lit,seed){ FLOORS.push([x0,z0,x0+w,z0+d,'tile']); const bo=0.9, rt=Math.max(VS,0.22);
  const ex0=x0-(bal.nx?bo:0), ex1=x0+w+(bal.px?bo:0), ez0=z0-(bal.nz?bo:0), ez1=z0+d+(bal.pz?bo:0), lens=[w,w,d,d];
  for(let f=0;f<fl;f++){ const y=f*fh;
    box(ex0,y,ez0,ex1,y+0.35,ez1,M.MID);
    if(bal.pz) box(ex0,y+0.35,ez1-rt,ex1,y+0.85,ez1,M.MID);
    if(bal.nz) box(ex0,y+0.35,ez0,ex1,y+0.85,ez0+rt,M.MID);
    if(bal.px) box(ex1-rt,y+0.35,ez0,ex1,y+0.85,ez1,M.MID);
    if(bal.nx) box(ex0,y+0.35,ez0,ex0+rt,y+0.85,ez1,M.MID);
    if(bal.pz) for(let k=0;k<3;k++){ if(hash3(seed,f,k)<0.55){ const px=x0+0.8+hash3(f,k,seed)*(w-1.6); sphere(px,y+0.85,z0+d+0.45,0.42,M.LEAF,0.2); } }
    shell(x0,z0,x0+w,z0+d,y+0.35,y+fh, winMat(seed*7+f,lens,2.3,1.5,0.35,fh-0.55,lit));
  }
  partitions(x0,z0,w,d,0,fl,fh,M.MID,4.6);
  const top=fl*fh; box(x0-0.1,top,z0-0.1,x0+w+0.1,top+0.4,z0+d+0.1,M.ROOF);
  shell(x0-0.1,z0-0.1,x0+w+0.1,z0+d+0.1,top+0.4,top+0.8,()=>M.MID,0.25);
  box(x0+1,top+0.4,z0+1,x0+3.2,top+1.4,z0+2.6,M.METAL); box(x0+w-3.5,top+0.4,z0+d-3,x0+w-1,top+1.6,z0+d-1,M.ROOF);
  box(x0+w*0.5-0.2,top+0.4,z0+1.4,x0+w*0.5+0.2,top+2.6,z0+1.8,M.METAL);
}
function factory(x0,z0,w,d){ FLOORS.push([x0,z0,x0+w,z0+d,'conc']); const h=7, per=3.2;
  shell(x0,z0,x0+w,z0+d,0,h,(side,u,v)=>{ const L=side<2?w:d;
    if(v>4.4&&v<6.2&&u>0.8&&u<L-0.8) return ((u%1.4)<0.25)?M.DARK:M.WIN;
    if(side===1&&v<4.2&&((u>3&&u<7.5)||(u>14&&u<18.5))) return (Math.floor(v/0.5)%2)?M.MID:M.RUST;
    return M.DARK; },0.4);
  box(x0,h,z0,x0+w,h+2,z0+d,(x,y,z)=>{ const wz=(z+0.5)*VS-z0, wy=(y+0.5)*VS-h, fr=(wz%per)/per, top=0.3+1.5*fr;
    if(wy<0.4) return M.ROOF; if(wy>top) return -1; if(fr>0.86) return M.WIN; return (wy>top-0.45)?M.RUST:-1; });
  const s=glyphSign(x0+2,h+2.3,z0+d-0.9,z0+d-0.5,'电工厂',false,M.DARK,M.NEON);
  box(x0+2.6,h,z0+d-0.85,x0+2.9,h+2.3,z0+d-0.55,M.METAL); box(x0+2+s.w-0.9,h,z0+d-0.85,x0+2+s.w-0.6,h+2.3,z0+d-0.55,M.METAL);
  box(x0+w-6,h+1.6,z0+2,x0+w-2,h+3.2,z0+4.5,M.METAL);
}
function chimney(x,z){ box(x-1.6,0,z-1.6,x+1.6,1.2,z+1.6,M.DARK);
  cyl(x,z,1.15,1.2,17.4,(X,Y,Z)=>(((Y+0.5)*VS)%3.2<0.35)?M.NEON:M.RUST,0.45); }
function storage(x,z,r){ cyl(x,z,r,0,6.5,M.MID,0.4); sphere(x,6.4,z,r,(X,Y,Z)=>((Y+0.5)*VS>6.5)?M.MID:-1);
  cyl(x,z,r+0.14,2,2.3,M.METAL,0.3); cyl(x,z,r+0.14,4.6,4.9,M.METAL,0.3);
  box(x-0.3,4.2,z-r-1.2,x+0.3,4.8,z-r+0.2,M.RUST); box(x+r-0.2,0,z-0.2,x+r+0.4,6.6,z+0.2,M.METAL); }
function cafe(x0,z0,w,d){ FLOORS.push([x0,z0,x0+w,z0+d,'tile']); const h=6;
  shell(x0,z0,x0+w,z0+d,0,h,(side,u,v)=>{
    if(side===1){
      if(v>0.25&&v<3.2&&u>2.6&&u<w-0.7){
        if(u>5.2&&u<5.75&&v<1.9) return M.DARK; if(u>5.25&&u<5.7&&v>=1.9&&v<2.35) return M.DARK;
        if(u>6.2&&u<7.7&&v>0.95&&v<1.12) return M.DARK; if(u>6.85&&u<7.05&&v<0.95) return M.DARK;
        return M.SHOP; }
      if(v>0.25&&v<2.6&&u>0.8&&u<2.0) return M.WINOFF;
      if(v>4.0&&v<5.4&&(Math.abs(u-3.5)<0.9||Math.abs(u-7)<0.9)) return M.WIN;
    }
    if(side===3&&v>4&&v<5.4&&Math.abs(u-4)<1) return M.WINOFF; return M.DARK; },0.35);
  box(x0,3.4,z0,x0+w,3.75,z0+d,M.MID); box(x0-0.1,h,z0-0.1,x0+w+0.1,h+0.35,z0+d+0.1,M.ROOF);
  box(x0+w-2.2,h+0.35,z0+0.8,x0+w-1.2,h+2.2,z0+1.8,M.DARK);
  box(x0+2.4,3.2,z0+d,x0+w-0.5,3.42,z0+d+1.4,M.AWN);
  const s=glyphSign(x0+0.5,h+0.9,z0+d-0.75,z0+d-0.4,'工人',false,M.DARK,M.NEON);
  box(x0+1,h+0.35,z0+d-0.75,x0+1.3,h+0.9,z0+d-0.45,M.METAL); box(x0+0.5+s.w-0.8,h+0.35,z0+d-0.75,x0+0.5+s.w-0.5,h+0.9,z0+d-0.45,M.METAL); }
function office(x0,z0,w,d,fl,seed){ FLOORS.push([x0,z0,x0+w,z0+d,'tile']); const fh=2, lens=[w,w,d,d];
  for(let f=0;f<fl;f++){ const y=f*fh; box(x0,y,z0,x0+w,y+0.35,z0+d,M.MID);
    shell(x0,z0,x0+w,z0+d,y+0.35,y+fh, f===0 ? (s,u,v)=>(s===1&&v<1.6&&u>2&&u<w-2)?M.SHOP:M.DARK : winMat(seed+f*13,lens,1.6,1.15,0.3,1.5,0.32)); }
  partitions(x0,z0,w,d,0,fl,fh,M.MID,4.5);
  const top=fl*fh; box(x0,top,z0,x0+w,top+0.35,z0+d,M.ROOF);
  box(x0+2,top+0.35,z0+2,x0+5,top+1.5,z0+4.5,M.METAL); box(x0+w-1.4,top+0.35,z0+1,x0+w-1.1,top+3.6,z0+1.3,M.METAL);
  box(x0+w-1.5,top+3.6,z0+0.9,x0+w-1.0,top+3.9,z0+1.4,M.NEON); }
function warehouse(x0,z0,w,d){ FLOORS.push([x0,z0,x0+w,z0+d,'conc']); const h=4.6;
  shell(x0,z0,x0+w,z0+d,0,h,(side,u,v)=>{ if(side===1&&v<3.4){ const k=Math.floor((u-1)/4.5), lu=(u-1)-k*4.5; if(lu>0.3&&lu<3.2&&u<w-1) return (Math.floor(v/0.4)%2)?M.MID:M.METAL; }
    if(side===1&&v>3.7&&v<4.2&&(u%3)<1.8) return M.WIN; return M.DARK; },0.35);
  partitions(x0,z0,w,d,0,1,h,M.MID,9);
  box(x0,h,z0,x0+w,h+0.35,z0+d,(x)=>((((x+0.5)*VS-x0)%4.5)<0.7)?M.WIN:M.RUST); }
function market(x0,z0,w,d){
  const posts=[[x0+1,z0+0.5],[x0+w*0.5,z0+0.5],[x0+w-1,z0+0.5],[x0+1,z0+d-0.5],[x0+w*0.5,z0+d-0.5],[x0+w-1,z0+d-0.5]];
  for(const [x,z] of posts){ box(x-0.12,0,z-0.12,x+0.12,3.3,z+0.12,M.METAL); }
  for(const zz of [z0+0.5,z0+d-0.5]){ box(x0+1,3.15,zz-0.06,x0+w-1,3.3,zz+0.06,M.METAL);
    for(let x=x0+2.5;x<x0+w-1.5;x+=2.6){ box(x-0.25,2.6,zz-0.25,x+0.25,3.15,zz+0.25,M.NEON); LAMPS.push({x,y:2.8,z:zz,r:2.2,col:'neon',size:1.4}); } }
  for(let i=0;i<4;i++){ const tx=x0+3+i*6.2, tz=z0+d*0.5; if(tx>x0+w-2) break; box(tx-0.7,0.7,tz-0.7,tx+0.7,0.82,tz+0.7,M.FURN); box(tx-0.1,0,tz-0.1,tx+0.1,0.7,tz+0.1,M.METAL);
    for(const [dx,dz] of [[-1.1,0],[1.1,0],[0,-1.1],[0,1.1]]) box(tx+dx-0.22,0,tz+dz-0.22,tx+dx+0.22,0.45,tz+dz+0.22,M.FURN); } }
function genIndustrial(R){
  tower(3,3,11,11,8,2.0,{pz:1,px:1},0.55,11); tower(18,3,11,11,8,2.0,{pz:1,nx:1},0.5,12);
  cafe(6,21,10,8); for(const tx of [8,11.2,14.4]) cafeTable(tx,31.2); kiosk(20,24,4,3.4); busStop(22,33.45);
  factory(50,3,26,14); chimney(73.5,23); storage(55,25,2.3); storage(61.5,25,2.3); billboard(63.5,31.0,10.5);
  for(const z of [5,15,25]){ box(78.2,0,z-0.15,78.5,11,z+0.15,M.METAL); box(77.4,10.2,z-0.1,79.3,10.4,z+0.1,M.METAL); }
  box(77.5,10.45,5,77.6,10.55,25,M.METAL); box(79.1,10.45,5,79.2,10.55,25,M.METAL);
  office(4,52,14,12,5,21); warehouse(3,68,27,9); taxi(23.5,57,false); taxi(27.5,57,false); taxi(31.3,60,false);
  shops(50,50,26,8); market(50,60,26,7); tower(53,69,18,8,8,2.0,{pz:1},0.5,13);
  for(const x of [4,15,31.5,49,60,75]) streetLamp(x,33.9,0,1);
  for(const x of [4,30,50,62,75]) streetLamp(x,46.1,0,-1);
  for(const z of [4,15,28.5,50,63,75]){ streetLamp(33.9,z,1,0); streetLamp(46.1,z,-1,0); }
  for(const x of [9.5,55,68]) tree(x,34.7,R); for(const x of [9.5,22,56,68]) tree(x,45.3,R);
  for(const z of [9.5,22,56,69]){ tree(34.7,z,R); tree(45.3,z,R); }
  bench(26,46.3); bench(62.5,33.5);
  for(const [x,z] of [[33.4,33.4],[46.6,33.4],[33.4,46.6],[46.6,46.6],[35,33.4],[45,33.4],[35,46.6],[45,46.6]]) bollard(x,z);
  taxi(12,42.4,true); taxi(58,37.6,true); taxi(37.6,60,false);
  for(const [a,b] of [[0,33],[47,80]]){ box(0.1,0,a,0.6,1.2,b,M.MID); box(79.4,0,a,79.9,1.2,b,M.MID); box(a,0,0.1,b,1.2,0.6,M.MID); box(a,0,79.4,b,1.2,79.9,M.MID); }
}

/* ================= LOCATION: CITY (west) ================= */
function towerC(x0,z0,w,d,fl,seed,lit){ FLOORS.push([x0,z0,x0+w,z0+d,'tile']); const fh=2.0, lens=[w,w,d,d];
  for(let f=0;f<fl;f++){ const y=f*fh;
    shell(x0,z0,x0+w,z0+d,y,y+0.3,()=>M.MID,1.0);
    shell(x0,z0,x0+w,z0+d,y+0.3,y+fh, f===0?((s,u,v)=>(s===1&&v<1.6&&u>1&&u<lens[s]-1)?M.SHOP:M.DARK):winMat(seed*5+f,lens,1.7,1.2,0.3,fh-0.45,lit));
  }
  box(x0+w/2-1.2,0,z0+d/2-1.2,x0+w/2+1.2,fl*fh,z0+d/2+1.2,M.DARK); partitions(x0,z0,w,d,0,fl,fh,M.MID,4.2);
  const top=fl*fh; box(x0,top,z0,x0+w,top+0.35,z0+d,M.ROOF);
  shell(x0,z0,x0+w,z0+d,top+0.35,top+0.8,()=>M.MID,0.25);
  box(x0+1,top+0.35,z0+1,x0+3,top+1.6,z0+2.6,M.METAL);
  box(x0+w-1.3,top+0.35,z0+d-1.3,x0+w-1.0,top+3.2,z0+d-1.0,M.METAL); box(x0+w-1.45,top+3.2,z0+d-1.45,x0+w-0.85,top+3.5,z0+d-0.85,M.NEON);
}
function pearlTower(cx,cz){ box(cx-4,0,cz-4,cx+4,0.6,cz+4,M.MID);
  for(const [dx,dz] of [[-2.4,-2.4],[2.4,-2.4],[-2.4,2.4],[2.4,2.4]]) cyl(cx+dx,cz+dz,0.5,0.6,7.5,M.MID);
  cyl(cx,cz,0.9,0.6,22,M.MID);
  sphere(cx,8,cz,2.8,(X,Y,Z)=>((Y+(X>>1))%4===0)?M.NEON:M.BILL);
  sphere(cx,17.2,cz,1.7,(X,Y,Z)=>(Y%3===0)?M.NEON:M.BILL);
  cyl(cx,cz,0.45,18.8,25,M.METAL); sphere(cx,22.6,cz,0.8,M.LAMP); box(cx-0.1,25,cz-0.1,cx+0.1,27.5,cz+0.1,M.METAL);
  LAMPS.push({x:cx,y:8,z:cz+2.9,r:5,col:'neon',size:7,pool:false}); LAMPS.push({x:cx,y:17.2,z:cz+1.8,r:3,col:'neon',size:4.5,pool:false}); }

/* ================= LOCATION: VILLAGE (south) ================= */
function house(x0,z0,w,d,h,door,seed,two){ FLOORS.push([x0,z0,x0+w,z0+d,'wood']);
  shell(x0,z0,x0+w,z0+d,0,h,(side,u,v)=>{ const L=side<2?w:d;
     if(v<0.45) return M.MID;
     if(side===door && Math.abs(u-L/2)<0.7 && v<2.1) return M.WOOD;
     const k=Math.floor((u-0.4)/2.2), lu=(u-0.4)-k*2.2;
     const win=lu>0.5&&lu<1.6&&u>0.6&&u<L-0.6&&!(side===door&&Math.abs(u-L/2)<1.3);
     if(v>1.0&&v<2.0&&win) return ((Math.floor(lu/0.36)+Math.floor(v/0.36))%3===0)?M.WOOD:(hash3(seed,k,side)<0.62?M.WIN:M.WINOFF);
     if(two&&v>h-1.7&&v<h-0.7&&win) return hash3(seed+3,k,side)<0.55?M.WIN:M.WOOD;
     return M.WALL; },0.33);
  box(x0,h-0.25,z0,x0+w,h,z0+d,M.WOOD); partitions(x0,z0,w,d,0,1,h,M.WOOD,4.4);
  roof(x0-0.6,z0-0.6,x0+w+0.6,z0+d+0.6,h,Math.min(w,d)*0.3,w>=d,M.TILE,1);
  const dc=[[x0+w/2,z0-0.35],[x0+w/2,z0+d+0.35],[x0-0.35,z0+d/2],[x0+w+0.35,z0+d/2]][door];
  const along=door<2;
  for(const s of [-1,1]) lantern(dc[0]+(along?s*1.15:0),2.35,dc[1]+(along?0:s*1.15),false);
}
function paifang(cx,z){ for(const [dx,hh] of [[-3.6,5.2],[3.6,5.2],[-6.4,3.8],[6.4,3.8]]){ box(cx+dx-0.28,0,z-0.28,cx+dx+0.28,hh,z+0.28,M.AWN); box(cx+dx-0.45,0,z-0.45,cx+dx+0.45,0.5,z+0.45,M.MID); }
  box(cx-4.2,4.6,z-0.32,cx+4.2,5.2,z+0.32,M.WOOD); box(cx-7,3.4,z-0.3,cx+7,3.8,z+0.3,M.WOOD);
  roof(cx-5,z-1.0,cx+5,z+1.0,5.2,0.9,true,M.TILE,1.2); roof(cx-7.6,z-0.8,cx-4.6,z+0.8,3.8,0.6,true,M.TILE,1); roof(cx+4.6,z-0.8,cx+7.6,z+0.8,3.8,0.6,true,M.TILE,1);
  glyphSign(cx-1.6,3.85,z+0.3,z+0.6,'田',false,M.DARK,M.NEON);
  lantern(cx-2.2,3.9,z+0.6,true,false); lantern(cx+2.2,3.9,z+0.6,true,false); }
function bamboo(x,z,R){ for(let k=0;k<8;k++){ const bx=x+(R()-0.5)*2.8, bz=z+(R()-0.5)*2.8, h=5+R()*4, s=Math.max(2,Math.round(1.2/VS));
  box(bx-VS/2,0,bz-VS/2,bx+VS/2,h,bz+VS/2,(X,Y,Z)=>(Y%s===0)?M.TRUNK:M.LEAF); sphere(bx+(R()-0.5)*0.8,h,bz+(R()-0.5)*0.8,0.85,M.LEAF,0.4); } }
function haystack(x,z){ cyl(x,z,1.1,0,1.0,M.HAY); cyl(x,z,0.8,1.0,1.8,M.HAY); cyl(x,z,0.45,1.8,2.4,M.HAY); box(x-0.08,2.4,z-0.08,x+0.08,2.8,z+0.08,M.TRUNK); }
function well(x,z){ cyl(x,z,0.9,0,0.9,M.MID,0.3); box(x-1.0,0,z-0.12,x-0.8,2.2,z+0.12,M.WOOD); box(x+0.8,0,z-0.12,x+1.0,2.2,z+0.12,M.WOOD);
  roof(x-1.4,z-0.8,x+1.4,z+0.8,2.2,0.6,true,M.TILE,0.6); }
function fence(x0,z0,x1,z1){ const ax=Math.abs(x1-x0)>Math.abs(z1-z0); box(x0,0.55,z0,x1,0.7,z1,M.WOOD); box(x0,0.25,z0,x1,0.35,z1,M.WOOD);
  const L=ax?x1-x0:z1-z0; for(let t=0;t<=L;t+=1.6){ const x=ax?x0+t:x0, z=ax?z0:z0+t; box(x-0.1,0,z-0.1,x+0.1,0.9,z+0.1,M.WOOD); } }
function cart(x,z){ box(x-1.0,0.6,z-0.7,x+1.0,0.9,z+0.7,M.WOOD); box(x-1.0,0.9,z-0.7,x+1.0,1.3,z-0.6,M.WOOD); box(x-1.0,0.9,z+0.6,x+1.0,1.3,z+0.7,M.WOOD);
  box(x-0.5,0,z-0.85,x+0.1,1.1,z-0.75,M.WOOD); box(x-0.5,0,z+0.75,x+0.1,1.1,z+0.85,M.WOOD); box(x+1.0,0.7,z-0.08,x+2.6,0.82,z+0.08,M.WOOD); box(x-0.8,0.9,z-0.5,x+0.6,1.6,z+0.5,M.HAY); }
const VROAD=[[40,0],[40,15],[33,27],[35,41],[46,53],[44,67],[40,80]];
function roadAt(z){ for(let i=0;i<VROAD.length-1;i++){ const a=VROAD[i], b=VROAD[i+1]; if(z>=a[1]&&z<=b[1]){ const t=(z-a[1])/(b[1]-a[1]); return a[0]+(b[0]-a[0])*t; } } return 40; }
function willow(x,z,R){ const t=Math.max(VS,0.4)/2; box(x-t,0,z-t,x+t,3.2,z+t,M.TRUNK); sphere(x,3.8,z,1.6,M.LEAF,0.25);
  for(let k=0;k<14;k++){ const a=R()*TAU, r=0.8+R()*0.75, sx=x+Math.cos(a)*r, sz=z+Math.sin(a)*r, y1=1.2+R()*1.3; box(sx-VS/2,y1,sz-VS/2,sx+VS/2,3.9,sz+VS/2,M.LEAF); } }

/* ================= LOCATION: WATER TOWN (east) ================= */
function pagoda(cx,cz,tiers){ tiers=tiers||6; box(cx-5.6,0,cz-5.6,cx+5.6,0.35,cz+5.6,M.MID); box(cx-4.8,0.35,cz-4.8,cx+4.8,0.7,cz+4.8,M.MID);
  let y=0.7, hw=3.5;
  for(let t=0;t<tiers;t++){ const h=t===0?3.0:2.2, L=hw*2;
    shell(cx-hw,cz-hw,cx+hw,cz+hw,y,y+h,(s,u,v)=>{ if(Math.abs(u-L/2)<0.55&&v>0.25&&v<h-0.5) return (t===0&&s===1)?M.WOOD:M.WIN; if(u<0.45||u>L-0.45) return M.WOOD; return M.WALL; },0.33);
    y+=h; const ov=1.5-t*0.12; roofHip(cx-hw-ov,cz-hw-ov,cx+hw+ov,cz+hw+ov,y-0.25,0.9+t*0.05,M.TILE,1.3);
    if(t%2===0) for(const dx of [-1,1]) lantern(cx+dx*(hw+ov*0.55),y-0.9,cz+(hw+ov*0.55),false,true);
    hw-=0.45; y+=0.35; }
  cyl(cx,cz,0.22,y,y+3,M.METAL); for(let k=0;k<3;k++) sphere(cx,y+0.6+k*0.7,cz,0.42-k*0.07,M.LANT);
  LAMPS.push({x:cx,y:y+1.2,z:cz,r:3,col:'neon',size:4,pool:false}); }
/* v20: high bridges — deck underside >= 3.2 m so any tank drives under; solid piers on the banks */
const BR_H=3.9;
function bridgeCore(ax,mid,L,w0,w1,w2){ /* ax: 0 = deck runs along Z (bridge at x=w0..), 1 = along X; w0 centre of cross axis */
  const a=c(w0-1.5), b=c(w0+1.5), f=c(mid-L), g=c(mid+L), pw=Math.max(2,Math.round(0.9/VS));
  for(let u=f;u<g;u++){ const t=((u+0.5)*VS-mid)/L, top=BR_H+0.8*(1-t*t), bot=top-0.6, pier=(u<f+pw||u>=g-pw);
    for(let v=a;v<b;v++){ const edge=(v===a||v===b-1); const yt=c(top+(edge?0.55:0));
      for(let y=pier?0:c(bot);y<=yt;y++){ const wall=(edge&&y*VS>top)||(pier&&y*VS<top-0.6&&(v===a||v===b-1)); const X=ax?u:v, Z=ax?v:u; put(X,y,Z,wall?M.WALL:M.MID); } } }
  for(const e of [-1,1]) for(const sd of [-1,1]){ const u=mid+e*(L-0.45), v=w0+sd*1.35, X=ax?u:v, Z=ax?v:u; lantern(X,BR_H+0.55+0.65,Z,false,true); } }
function archBridge(x,z0,z1){ const mid=(z0+z1)/2; bridgeCore(0,mid,(z1-z0)/2+1.6,x); }
function archBridgeX(x0,x1,z){ const mid=(x0+x1)/2; bridgeCore(1,mid,(x1-x0)/2+1.6,z); }
function boat(x,z,ax){ lbox(x,z,ax,-2.6,2.6,-0.75,0.75,0,0.35,M.WOOD); lbox(x,z,ax,-2.6,2.6,-0.85,-0.65,0.35,0.7,M.WOOD); lbox(x,z,ax,-2.6,2.6,0.65,0.85,0.35,0.7,M.WOOD);
  lbox(x,z,ax,2.4,3.0,-0.35,0.35,0.2,0.8,M.WOOD); lbox(x,z,ax,-3.0,-2.4,-0.35,0.35,0.2,0.8,M.WOOD);
  lbox(x,z,ax,-1.3,0.9,-0.85,0.85,1.45,1.65,M.TILE); for(const a of [-1.2,0.8]) for(const s of [-0.75,0.75]) lbox(x,z,ax,a-0.06,a+0.06,s-0.06,s+0.06,0.35,1.45,M.WOOD);
  const lx=ax?x+0.9:x, lz=ax?z:z+0.9; lantern(lx,1.1,lz,false,true); }

/* ================= LOCATION: CAMP (centre, safe) ================= */
function hangar(x0,z0,w,d){ FLOORS.push([x0,z0,x0+w,z0+d,'conc']); const H=4.2, R=w/2, cx=x0+w/2, th=Math.max(VS,0.4);
  shell(x0,z0,x0+w,z0+d,0,H,(side,u,v)=>{ if(side===1) return -1; if(side===0) return M.ARMY; return (u%3)<0.35?M.DARK:((v>2.6&&v<3.5&&(u%3)>1)?M.WIN:M.ARMY); },0.4);
  const a=c(x0),b=c(x0+w),f=c(z0),g=c(z0+d);
  for(let z=f;z<g;z++)for(let x=a;x<b;x++){ const v=((x+0.5)*VS-cx)/R; const s=Math.sqrt(Math.max(0.0001,1-v*v)); const top=H+R*0.55*s;
    const st=Math.min(3,0.55*Math.abs(v)/s)*VS; const rib=(((z+0.5)*VS-z0)%3)<0.4;
    for(let y=c(top-th-st);y<=c(top);y++) put(x,y,z,rib?M.DARK:M.ARMY); }
  const fw=Math.max(1,c(0.4));
  for(let x=a;x<b;x++){ const v=((x+0.5)*VS-cx)/R, top=H+R*0.55*Math.sqrt(Math.max(0,1-v*v)), yt=c(top);
    for(let y=c(H);y<yt;y++) for(let k=0;k<fw;k++) put(x,y,f+k,M.ARMY);
    for(let y=0;y<yt;y++){ const wx=(x+0.5)*VS, wy=(y+0.5)*VS; if(Math.abs(wx-cx)<5.2&&wy<5.4) continue; const hz=(wy<5.95&&Math.abs(wx-cx)<5.75)||(wy>5.4&&wy<5.95); for(let k=0;k<fw;k++) put(x,y,g-1-k,hz?((Math.floor((wx+wy)/0.55)&1)?M.AWN:M.DARK):M.ARMY); } }
  glyphSign(cx-1.6,6.0,z0+d,z0+d+0.35,'车',false,M.DARK,M.NEON);
  for(const z of [z0+4,z0+9,z0+14]){ box(cx-0.3,3.9,z-0.3,cx+0.3,4.1,z+0.3,M.LAMP); LAMPS.push({x:cx,y:3.9,z,r:3.4,col:'glow',size:2.4}); }
  box(x0+0.5,0,z0+2.5,x0+1.5,1.0,z0+9,M.WOOD); box(x0+0.45,1.0,z0+3,x0+0.6,3.2,z0+8.5,M.METAL);
  box(x0+w-1.5,0,z0+2.5,x0+w-0.5,1.0,z0+7,M.WOOD); cyl(x0+w-1.4,z0+10,0.55,0,1.4,M.TIRE); cyl(x0+w-1.4,z0+11.3,0.55,0,0.9,M.TIRE);
  box(x0+0.6,0,z0+12,x0+1.8,1.2,z0+13.2,M.WOOD); box(x0+0.7,1.2,z0+12.2,x0+1.6,2.2,z0+13.1,M.WOOD);
  box(x0-1.7,0,z0+3,x0-0.2,0.25,z0+9.6,M.MID); for(let k=0;k<6;k++){ const zz=z0+3.6+k*1.05; cyl(x0-0.95,zz,0.36,0.25,1.75,k%3===0?M.CRED:k%3===1?M.CGRY:M.CBLUE); cyl(x0-0.95,zz,0.2,1.75,1.95,M.DARK); }
  box(x0-1.75,1.2,z0+3,x0-1.6,1.35,z0+9.6,M.METAL); box(x0-1.75,0,z0+3,x0-1.6,1.35,z0+3.15,M.METAL); box(x0-1.75,0,z0+9.45,x0-1.6,1.35,z0+9.6,M.METAL);
  box(x0+w+0.2,0,z0+10,x0+w+2.6,2.6,z0+15.5,(X,Y,Z)=>{ const wy=(Y+0.5)*VS; return wy>2.3?M.MID:wy<0.3?M.DARK:((Math.floor((Z+0.5)*VS/0.5))%3===0?M.DARK:M.ARMY); });
  box(x0+w+0.6,0,z0+16.2,x0+w+2.4,0.35,z0+19.6,M.MID); box(x0+w+0.75,0.35,z0+16.4,x0+w+2.25,1.6,z0+19.4,(X,Y,Z)=>{ const dz=(Z+0.5)*VS-(z0+17.9), dy=(Y+0.5)*VS-0.98; return Math.abs(dz)>1.35&&dy*dy+(Math.abs(dz)-1.35)**2>0.45?-1:M.CGRY; });
  box(x0+w+0.65,0.35,z0+17.0,x0+w+2.35,1.65,z0+17.12,M.AWN); box(x0+w+0.65,0.35,z0+18.7,x0+w+2.35,1.65,z0+18.82,M.AWN);
}
function tent(x0,z0,w,d){ const ax=w>=d; roof(x0,z0,x0+w,z0+d,0,2.6,ax,M.CANV,0);
  const a=c(x0),b=c(x0+w),f=c(z0),g=c(z0+d);
  if(ax){ for(const x of [a,b-1]) for(let z=f;z<g;z++){ const v=Math.abs(((z+0.5)*VS-z0)/d*2-1), top=2.6*(1-v); for(let y=0;y<c(top);y++){ const door=x===b-1&&v<0.32&&y*VS<1.8; put(x,y,z,door?M.DARK:M.CANV);} } }
  else { for(const z of [f,g-1]) for(let x=a;x<b;x++){ const v=Math.abs(((x+0.5)*VS-x0)/w*2-1), top=2.6*(1-v); for(let y=0;y<c(top);y++){ const door=z===g-1&&v<0.32&&y*VS<1.8; put(x,y,z,door?M.DARK:M.CANV);} } } }
function truck(x,z,ax){ vehDetail('truck',x,z,ax,null); lbox(x,z,ax,-3,3,-1.2,1.2,0.55,1.0,M.DARK);
  lbox(x,z,ax,1.2,3.0,-1.15,1.15,1.0,2.6,M.ARMY); lbox(x,z,ax,2.95,3.08,-1.0,1.0,1.7,2.3,M.WINOFF); lbox(x,z,ax,1.5,2.7,-1.18,1.18,1.8,2.3,M.WINOFF);
  lbox(x,z,ax,3.0,3.15,-1.0,-0.6,1.1,1.4,M.LAMP); lbox(x,z,ax,3.0,3.15,0.6,1.0,1.1,1.4,M.LAMP);
  lbox(x,z,ax,-3,1.1,-1.2,1.2,1.0,2.0,M.ARMY); lbox(x,z,ax,-3,1.0,-1.15,1.15,2.0,2.9,M.CANV); lbox(x,z,ax,-3,1.0,-0.8,0.8,2.9,3.2,M.CANV);
  for(const a of [-2.2,-0.9,2.1]) for(const s of [-1,1]) lbox(x,z,ax,a-0.5,a+0.5,s>0?0.85:-1.35,s>0?1.35:-0.85,0,1.1,M.TIRE); }
function apc(x,z,ax){ vehDetail('apc',x,z,ax,null); lbox(x,z,ax,-3.5,3.5,-1.4,1.4,0.7,2.1,M.ARMY); lbox(x,z,ax,3.5,4.1,-1.3,1.3,0.9,1.7,M.ARMY); lbox(x,z,ax,-3.4,3.4,-1.2,1.2,2.1,2.3,M.ARMY);
  lbox(x,z,ax,-0.8,0.8,-0.8,0.8,2.3,2.9,M.ARMY); lbox(x,z,ax,0.8,3.6,-0.08,0.08,2.5,2.66,M.METAL); lbox(x,z,ax,-2.6,-1.6,-0.5,0.5,2.3,2.45,M.DARK);
  lbox(x,z,ax,3.9,4.15,-1.0,-0.6,1.2,1.45,M.LAMP); lbox(x,z,ax,3.9,4.15,0.6,1.0,1.2,1.45,M.LAMP);
  for(const a of [-2.6,-0.9,0.9,2.6]) for(const s of [-1,1]) lbox(x,z,ax,a-0.55,a+0.55,s>0?1.0:-1.55,s>0?1.55:-1.0,0,1.15,M.TIRE); }
function parkedTank(x,z){ vehDetail('ptank',x,z,false,null); box(x-1.0,0.6,z-1.3,x+1.0,1.25,z+1.3,M.DARK); for(const sx of [-1,1]) for(const sz of [-1,1]) box(x+sx*1.1-0.25,0,z+sz*0.9-0.55,x+sx*1.1+0.25,1.1,z+sz*0.9+0.55,M.TIRE);
  sphere(x,2.15,z,1.0,M.ARMY); sphere(x+0.6,2.3,z+0.55,0.25,M.WIN); box(x-0.12,1.95,z+0.8,x+0.12,2.2,z+2.7,M.METAL); }
function sandbags(x0,z0,x1,z1,h){ box(x0,0,z0,x1,h,z1,(x,y,z)=>((Math.floor(y*VS/0.3)+Math.floor((x+z)*VS/0.6))%2)?M.HAY:M.CANV); }
function crates(x,z){ box(x-0.6,0,z-0.6,x+0.6,1.2,z+0.6,M.WOOD); box(x+0.7,0,z-0.5,x+1.7,1.0,z+0.5,M.WOOD); box(x-0.4,1.2,z-0.4,x+0.5,2.1,z+0.5,M.WOOD); }
function watchtower(x,z){ for(const [dx,dz] of [[-1.2,-1.2],[1.2,-1.2],[-1.2,1.2],[1.2,1.2]]) box(x+dx-0.15,0,z+dz-0.15,x+dx+0.15,6,z+dz+0.15,M.METAL);
  box(x-1.6,6,z-1.6,x+1.6,6.3,z+1.6,M.MID); shell(x-1.6,z-1.6,x+1.6,z+1.6,6.3,7.3,()=>M.ARMY,0.25); box(x-1.8,8.3,z-1.8,x+1.8,8.6,z+1.8,M.ARMY);
  for(const [dx,dz] of [[-1.5,-1.5],[1.5,1.5]]) box(x+dx-0.1,7.3,z+dz-0.1,x+dx+0.1,8.3,z+dz+0.1,M.METAL);
  box(x-0.3,7.4,z+1.5,x+0.3,7.8,z+1.8,M.LAMP); LAMPS.push({x,y:7.6,z:z+1.7,r:5.5,col:'lamp',size:3.2}); }
function flagpole(x,z){ box(x-0.6,0,z-0.6,x+0.6,0.4,z+0.6,M.MID); box(x-0.08,0.4,z-0.08,x+0.08,9,z+0.08,M.METAL); box(x+0.1,7.4,z-0.05,x+2.6,8.9,z+0.05,M.NEON); }
function hqBuilding(x0,z0){ const w=13, d=7, h=3.6; FLOORS.push([x0,z0,x0+w,z0+d,'tile']);
  shell(x0,z0,x0+w,z0+d,0,h,(sd,u,v)=>{ if(sd===1&&Math.abs(u-w/2)<1.2&&v<2.5) return -1; if(v>1.5&&v<2.5&&(u%2.6)>0.9&&(u%2.6)<2.0&&!(sd===1&&Math.abs(u-w/2)<1.9)) return M.WIN; return v<0.5?M.MID:M.ARMY; },0.4);
  box(x0-0.3,h,z0-0.3,x0+w+0.3,h+0.4,z0+d+0.3,M.MID); box(x0+w/2-1.8,h-0.1,z0+d,x0+w/2+1.8,h+0.15,z0+d+1.6,M.ARMY);
  sandbags(x0-1.2,z0+d+0.4,x0+w/2-2.2,z0+d+1.1,0.9); sandbags(x0+w/2+2.2,z0+d+0.4,x0+w+1.2,z0+d+1.1,0.9);
  box(x0+2,h+0.4,z0+2,x0+2.4,h+2.4,z0+2.4,M.METAL); sphere(x0+2.2,h+3.1,z0+2.2,1.15,(X,Y,Z)=>((Y+0.5)*VS<h+3.1)?M.METAL:-1);
  const tx0=x0+7.4, tx1=x0+11.6, tz0=z0+1.0, tz1=z0+5.2, ty0=h+0.4, ty1=h+5.0;
  shell(tx0,tz0,tx1,tz1,ty0,ty1,(sd,u,v)=>{ const L=sd<2?tx1-tx0:tz1-tz0;
    if(v>1.1&&v<2.4){ const t=(u%2.1)/2.1, k=(v-1.1)/1.3; return (Math.abs(t-k)<0.13||Math.abs(t-(1-k))<0.13||u%2.1<0.22)?M.METAL:M.DARK; }
    if(v>3.0&&v<3.9&&u>0.6&&u<L-0.6&&(u%1.4)>0.45) return M.WIN;
    if(v<0.25||Math.abs(v-1.0)<0.1||Math.abs(v-2.5)<0.1) return M.MID; return M.ARMY; },0.4);
  box(tx0+0.4,ty0,tz0+0.4,tx1-0.4,ty1,tz1-0.4,M.DARK);
  box(x0+6.7,ty1,z0+0.4,x0+12.3,ty1+0.35,z0+5.8,M.MID);
  shell(x0+6.6,z0+0.3,x0+12.4,z0+5.9,ty1+0.35,ty1+1.45,(sd,u,v)=>(v>0.22&&v<0.86&&(u%1.2)>0.16)?M.WIN:M.ARMY,0.35);
  box(x0+6.4,ty1+1.45,z0+0.1,x0+12.6,ty1+1.72,z0+6.1,M.MID); box(x0+6.4,ty1+1.72,z0+0.1,x0+12.6,ty1+1.9,z0+0.35,M.AWN);
  box(x0+6.75,ty1+1.72,z0+0.45,x0+7.0,ty1+5.6,z0+0.7,M.METAL); box(x0+6.65,ty1+5.6,z0+0.35,x0+7.1,ty1+5.85,z0+0.8,M.LAMP); LAMPS.push({x:x0+6.88,y:ty1+5.7,z:z0+0.58,r:1.5,col:'neon',size:2.2,pool:false});
  for(const k of [0,1,2]) cyl(x0+0.9+k*0.95,z0+5.9,0.38,h+0.4,h+1.5,M.ROOF);
  box(x0+w/2-0.3,h-0.35,z0+d+1.3,x0+w/2+0.3,h-0.1,z0+d+1.6,M.LAMP); LAMPS.push({x:x0+w/2,y:h-0.3,z:z0+d+1.5,r:3.4,col:'lamp',size:2});
  box(x0+3,0,z0+2.4,x0+w-3,0.85,z0+3.4,M.FURN); box(x0+5,0.85,z0+2.6,x0+8,1.3,z0+3.2,M.NEON); }
/* v20: parked fleet near the motor pool — five real tank models (meshes), voxel hulls only for collision */
const FLEET=[['base',18,55,0],['ten',22.5,55,0],['pchela',27,55,0],['igla',16.5,71.5,Math.PI],['krep',22,71.5,Math.PI],['kovch',27.5,71.5,Math.PI]];
const FLEET_AT=FLEET.map(f=>[f[1],f[2]]);
function fleetHull(x,z){ box(x-0.8,0.3,z-1.3,x+0.8,1.15,z+1.3,M.DARK); }
function genCamp(R){
  const wall=(x0,z0,x1,z1)=>{ box(x0,0,z0,x1,1.3,z1,M.MID); box(x0,1.3,z0,x1,1.6,z1,(x,y,z)=>((x+z)%3===0)?M.METAL:-1); };
  wall(0.2,0.2,34,1.0); wall(46,0.2,79.8,1.0); wall(0.2,79,34,79.8); wall(46,79,79.8,79.8);
  wall(0.2,1,1.0,34); wall(0.2,46,1.0,79); wall(79,1,79.8,34); wall(79,46,79.8,79);
  const post=(x,z)=>{ box(x-0.4,0,z-0.4,x+0.4,3.2,z+0.4,M.MID); box(x-0.25,3.2,z-0.25,x+0.25,3.5,z+0.25,M.LAMP); LAMPS.push({x,y:3.35,z,r:3,col:'lamp',size:2}); };
  for(const [x,z] of [[34.4,0.6],[45.6,0.6],[34.4,79.4],[45.6,79.4],[0.6,34.4],[0.6,45.6],[79.4,34.4],[79.4,45.6]]) post(x,z);
  for(const [x,z] of [[33.4,1.6],[46.6,78.4],[1.6,46.6],[78.4,33.4]]) box(x-0.15,0,z-0.15,x+0.15,6,z+0.15,(X,Y,Z)=>(Math.floor(Y*VS/0.6)%2)?M.AWN:M.WALL);
  hangar(8,6,14,18);
  crates(26,8); crates(27,12); cyl(28.5,19,1.1,0,2.6,M.ARMY); cyl(28.5,22,1.1,0,2.6,M.ARMY);
  for(const tx of [50,58,66]){ tent(tx,4,6,8); tent(tx,16,6,8); }
  hqBuilding(59,25);
  watchtower(75,5); watchtower(5,75); flagpole(47.5,30.5);
  truck(6,54,false); truck(12,54,false); for(const [x,z] of FLEET_AT) fleetHull(x,z);
  truck(8,70,true); cyl(31.4,75,1.1,0,2.4,M.ARMY); cyl(33.6,73.4,1.1,0,2.4,M.ARMY);
  sandbags(46.5,71,53.5,72,1.1); sandbags(66,49,77,50,1.1); sandbags(76,50,77,58,1.1);
  crates(52,74); crates(56,75); crates(73,72);
  for(let k=0;k<8;k++){ const a=k/8*TAU; box(62+Math.cos(a)*6.4-0.15,0,62+Math.sin(a)*6.4-0.15,62+Math.cos(a)*6.4+0.15,0.25,62+Math.sin(a)*6.4+0.15,M.LAMP); }
  for(const z of [10,24,56,70]){ streetLamp(33.9,z,1,0); streetLamp(46.1,z,-1,0); }
  for(const x of [10,24,56,70]){ streetLamp(x,33.9,0,1); streetLamp(x,46.1,0,-1); }
  /* camp trees and bushes are bendable meshes (campDecoBuild) */
}
const CAMP_GARAGE={x0:10.5,z0:8,x1:19.5,z1:22.5,in:false}, CAMP_DOOR={x:15,z:27.5,h:0};
const SOLDIER_SPOTS=[[12.5,26.8,0],[18,26.8,0],[34,3.5,0],[46,76.5,Math.PI],[3.5,34,Math.PI/2],[76.5,46,-Math.PI/2],[55,13.8,0.4],[63,13.6,-0.3],[16,60,0.6],[25,61,-0.4],[58,58,0.8],[47.5,33.5,Math.PI]];

function genCity(R){
  const edge=(x0,z0,x1,z1)=>box(x0,0,z0,x1,1.2,z1,M.MID);
  edge(0.1,0.1,0.6,34); edge(0.1,46,0.6,79.9); edge(79.4,0.1,79.9,34); edge(79.4,46,79.9,79.9);
  edge(0,0.1,34,0.6); edge(46,0.1,80,0.6); edge(0,79.4,34,79.9); edge(46,79.4,80,79.9);
  towerC(3,3,10,10,8,31,0.45); towerC(16,3,8,9,6,32,0.5); shops(3,22,27,8); glyphSign(4.5,3,13,13.35,'人口',true,M.DARK,M.NEON);
  towerC(48,3,12,10,8,33,0.42); towerC(63,3,7,13,9,35,0.45); towerC(72.5,3,6.5,8,7,34,0.5); billboard(49,30.6,10,2.2); kiosk(63,26,4,3.4); glyphSign(50,6,13,13.35,'大中',true,M.DARK,M.NEON);
  pearlTower(12,63); towerC(23,50,9,9,8,37,0.5); glyphSign(24,4,59,59.35,'米日',true,M.DARK,M.NEON);
  for(const [x,z] of [[4,50],[4,76],[20,76],[28,70]]) tree(x,z,R,true);
  towerC(49,49,10,10,7,38,0.4); towerC(62,49,8,8,9,40,0.5); towerC(72,49,7,7,8,41,0.5); market(49,67,17,7); office(68,62,10,12,5,39);
  for(const x of [6,14,22,30,50,58,66,74]){ streetLamp(x,34.6,0,1); streetLamp(x,45.4,0,-1); }
  for(const z of [6,14,22,30,50,58,66,74]){ streetLamp(34.6,z,1,0); streetLamp(45.4,z,-1,0); }
  taxi(10,37.3,true); taxi(26,42.7,true); taxi(37.3,12,false); taxi(42.7,66,false);
  bus(56,42.6,true); bus(14,42.6,true); busStop(50,32.3); busStop(24,46.2);
  bench(10,32.9); bench(66,47.2);
  for(const [x,z] of [[33.4,33.4],[46.6,33.4],[33.4,46.6],[46.6,46.6]]) bollard(x,z);
}
function paintCity(s){ streetH(s,36,44,0,80,true); streetV(s,36,44,0,80,true); gx.fillStyle=css(s.road); R_(36,36,8,8);
  zebraV(s,31,36,44); zebraV(s,46.8,36,44); zebraH(s,31,36,44); zebraH(s,46.8,36,44);
  gx.globalAlpha=0.3; gx.fillStyle=css(s.line); for(let x=2;x<78;x+=6){ if(x>28&&x<50) continue; R_(x,37.2,4,0.12); R_(x,42.7,4,0.12); } gx.globalAlpha=1;
  }

function genVillage(R){
  const st=(x0,z0,x1,z1)=>{ box(x0,0,z0,x1,1.0,z1,M.MID); box(x0,1.0,z0,x1,1.25,z1,M.TILE); };
  st(0.1,0.1,35,0.7); st(45,0.1,79.9,0.7); st(0.1,79.3,79.9,79.9); st(0.1,0.7,0.7,35); st(0.1,45,0.7,79.3); st(79.3,0.7,79.9,35); st(79.3,45,79.9,79.3);
  paifang(40,7);
  house(20,8,9,7,3.4,3,51); house(48,5,10,7,3.6,2,52,true); house(62,6,8,6,3.1,1,58); house(46,19,8,7,3.3,2,53); house(22,24,7,7,3.2,3,54);
  house(25,48,10,8,3.5,3,56); house(24,62,9,7,3.3,3,57); house(56,47,8,7,3.3,0,60);
  house(50,59,14,10,4.6,2,59,true); roof(52,61,62,67,5.9,1.4,true,M.TILE,1.3);
  well(30,59.3); cart(36,49);
  for(const [x,z] of [[60,57],[67,57.5],[10,45],[31,76],[70,14]]) haystack(x,z);
  bamboo(6,6,R); bamboo(74,70,R); bamboo(73,9,R); bamboo(5,30,R);
  for(const [x,z] of [[32,11],[28,30],[22,58],[60,73],[35,72],[52,46]]) tree(x,z,R,true);
  for(const [x,z] of [[21,19],[7,34]]) willow(x,z,R);
  fence(54,16.5,78,16.5); fence(2,46.5,20,46.5); fence(53.5,16.5,53.5,34);
  for(const z of [24,52]){ const p=roadAt(z); box(p-3.4,0,z-0.1,p-3.2,3.6,z+0.1,M.WOOD); box(p+3.2,0,z-0.1,p+3.4,3.6,z+0.1,M.WOOD); box(p-3.4,3.5,z-0.04,p+3.4,3.6,z+0.04,M.DARK); for(let k=-2;k<=2;k++) lantern(p+k*1.25,3.0,z,false,true); }
  for(const x of [16,62]){ box(x-0.1,0,36.4,x+0.1,3.6,36.6,M.WOOD); box(x-0.1,0,43.4,x+0.1,3.6,43.6,M.WOOD); box(x-0.04,3.5,36.4,x+0.04,3.6,43.6,M.DARK); for(let k=-2;k<=2;k++) lantern(x,3.0,40+k*1.25,false,true); }
}
const PADDIES=[[54,17,77,34],[2,47,20,76]];
function terrVillage(){ for(const [x0,z0,x1,z1] of PADDIES){ for(let j=Math.floor(z0/HC);j<Math.ceil(z1/HC);j++) for(let i=Math.floor(x0/HC);i<Math.ceil(x1/HC);i++){
  const x=(i+0.5)*HC, z=(j+0.5)*HC, ridge=((x-x0)%7)<0.6||((z-z0)%6.5)<0.6, edge=Math.min(x-x0,x1-x,z-z0,z1-z); HM[j*HN+i]=(ridge||edge<0.6)?0.1:-0.2; } } }
function paintVillage(s){ const dirt=mix3(P.side,[0.55,0.45,0.32],0.25);
  gx.fillStyle=cssA(mix3(P.ground,P.dark,0.18),1); R_(0,0,80,80);
  for(const [x0,z0,x1,z1] of PADDIES){ gx.fillStyle=cssA(mix3(P.water,P.bg,0.35),1); R_(x0,z0,x1-x0,z1-z0); gx.globalAlpha=0.35; gx.fillStyle=cssA(P.foliage,1);
    for(let z=z0+0.8;z<z1;z+=0.9) for(let x=x0+0.8;x<x1;x+=0.9) if(((x-x0)%7)>0.7&&((z-z0)%6.5)>0.7) R_(x,z,0.2,0.2); gx.globalAlpha=1;
    gx.fillStyle=cssA(dirt,0.85); for(let x=x0;x<=x1;x+=7) R_(x,z0,0.6,z1-z0); for(let z=z0;z<=z1;z+=6.5) R_(x0,z,x1-x0,0.6); }
  gx.fillStyle=cssA(dirt,1); R_(0,37,80,6);
  gx.strokeStyle=cssA(dirt,1); gx.lineWidth=5.4*GS; gx.lineCap='round'; gx.lineJoin='round'; gx.beginPath(); VROAD.forEach((p,i)=>i?gx.lineTo(p[0]*GS,p[1]*GS):gx.moveTo(p[0]*GS,p[1]*GS)); gx.stroke();
  gx.strokeStyle=cssA(mix3(dirt,[1,1,1],0.12),0.5); gx.lineWidth=0.25*GS; gx.setLineDash([1.2*GS,1.6*GS]); gx.stroke(); gx.beginPath(); gx.moveTo(0,40*GS); gx.lineTo(80*GS,40*GS); gx.stroke(); gx.setLineDash([]);
  }

function genWater(R){
  const st=(x0,z0,x1,z1)=>{ box(x0,0,z0,x1,1.0,z1,M.WALL); box(x0,1.0,z0,x1,1.25,z1,M.TILE); };
  st(0.1,0.1,35,0.7); st(45,0.1,79.9,0.7); st(0.1,79.3,35,79.9); st(45,79.3,79.9,79.9); st(0.1,0.7,0.7,35); st(0.1,45,0.7,79.3); st(79.3,0.7,79.9,79.3);
  box(57.6,0,34.4,64.4,0.9,35.0,M.WALL); box(57.6,0,45.0,64.4,0.9,45.6,M.WALL);
  for(const [x,z] of [[57.6,34.7],[64.4,34.7],[57.6,45.3],[64.4,45.3]]){ box(x-0.3,0,z-0.3,x+0.3,1.4,z+0.3,M.MID); lantern(x,1.75,z,false); }
  box(35.1,0,51.6,35.6,0.9,58.4,M.WALL); box(44.4,0,51.6,44.9,0.9,58.4,M.WALL);
  for(const [x,z] of [[35.35,51.6],[44.65,51.6],[35.35,58.4],[44.65,58.4]]){ box(x-0.3,0,z-0.3,x+0.3,1.4,z+0.3,M.MID); lantern(x,1.75,z,false); }
  house(3,24,12,8,4.2,1,71,true); house(17,26,8,7,3.4,1,72); house(26,25,8,8,3.6,1,73,true); house(47,25,9,8,3.6,1,75,true);
  house(5,7,9,7,3.4,1,76); house(19,6,10,8,3.6,1,77,true); house(47,6,9,8,3.5,1,79);
  [2,9.6,17.2,24.8,47.2].forEach((x,i)=>house(x,46,6.6,5,3.3,0,80+i,i%2===0)); house(66,46,6,5,3.2,0,88); house(73,46,6,5,3.4,0,89,true);
  [9,17,25,47.5].forEach((x,i)=>house(x,59.5,6.8,5.5,3.3,0,90+i,i%2===1)); house(66,60,6,6,3.2,0,97); house(73,60,6,6,3.5,0,98,true);
  pagoda(71.5,17);
  archBridge(30,52,58); archBridgeX(58,64,16); archBridgeX(58,64,70);
  boat(20,55,true); boat(53,55.2,true); boat(61,64,false); boat(61,24,false); boat(72,54.8,true);
  for(const [x,z] of [[56.4,8],[65.6,27],[56.4,64],[65.6,74],[6,69],[22,70],[50,72]]) willow(x,z,R);
  for(const [dx,dz] of [[-2,-2],[2,-2],[-2,2],[2,2]]) box(30+dx-0.18,0,72+dz-0.18,30+dx+0.18,2.8,72+dz+0.18,M.AWN);
  roofHip(26.6,68.6,33.4,75.4,2.8,1.4,M.TILE,1.2); lantern(30,2.1,72,true);
  for(const x of [8,18,28,48,70]){ box(x-0.12,0,34.3,x+0.12,3.2,34.6,M.WOOD); box(x-0.12,0,45.4,x+0.12,3.2,45.7,M.WOOD); lantern(x,2.55,34.9,false); lantern(x,2.55,45.1,false); }
}
function paintWater(s){ const stone=mix3(P.side,P.ground,0.4);
  gx.fillStyle=cssA(stone,1); R_(0,0,80,80); gx.strokeStyle='rgba(255,255,255,0.05)'; gx.lineWidth=1; gx.beginPath(); for(let v=0;v<=80;v+=1.2){ gx.moveTo(v*GS,0); gx.lineTo(v*GS,1024); } for(let v=0;v<=80;v+=0.8){ gx.moveTo(0,v*GS); gx.lineTo(1024,v*GS); } gx.stroke();
  gx.fillStyle=cssA(mix3(P.road,stone,0.4),1); R_(0,35,80,10); R_(35,0,10,80);
  gx.globalAlpha=0.25; gx.fillStyle=css(s.line); for(let x=0;x<80;x+=2.4) R_(x,39.9,1.2,0.2); for(let z=0;z<80;z+=2.4) R_(39.9,z,0.2,1.2); gx.globalAlpha=1;
  gx.fillStyle=cssA(mix3(P.wall,P.mid,0.55),1); for(const r of LOC.water) R_(r[0]-0.5,r[1]-0.5,r[2]-r[0]+1,r[3]-r[1]+1);
  }

