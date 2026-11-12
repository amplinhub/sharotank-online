/* ================= INTERMEDIATE LOCATIONS ================= */
function edgeWalls(g){ const w=(x0,z0,x1,z1)=>box(x0,0,z0,x1,1.2,z1,M.MID);
  if(g.N){ w(0.1,0.1,35,0.6); w(45,0.1,79.9,0.6); } else w(0.1,0.1,79.9,0.6);
  if(g.S){ w(0.1,79.4,35,79.9); w(45,79.4,79.9,79.9); } else w(0.1,79.4,79.9,79.9);
  if(g.W){ w(0.1,0.6,0.6,35); w(0.1,45,0.6,79.4); } else w(0.1,0.6,0.6,79.4);
  if(g.E){ w(79.4,0.6,79.9,35); w(79.4,45,79.9,79.4); } else w(79.4,0.6,79.9,79.4); }
function container(x,z,ax,mat,y0){ y0=y0||0; const H=2.5, ch=Math.max(0.32,VS*1.3);
  lbox(x,z,ax,-3,3,-1.2,1.2,y0,y0+H,LF(x,z,ax,(u,w,y)=>{ const ly=y-y0, aw=Math.abs(w), au=Math.abs(u), et=aw-(1.2-ch);
    const ec=Math.max(et+Math.max(0,ly-(H-ch)),et+Math.max(0,ch-ly)); if(et>0&&ec>ch*1.02) return -1;   /* chamfered long edges */
    if(au>2.86){ if(aw>0.92||ly<0.24||ly>H-0.28) return M.DARK; if(aw<0.06) return M.DARK;            /* end door frame */
      if(aw>0.3&&aw<0.42&&ly>0.5&&ly<H-0.5) return M.METAL; return (ly>H*0.62&&aw>0.5&&aw<0.82)?M.TIRE:mat; }
    if(au>2.62||(et>0&&(ly>H-ch||ly<ch)&&ec>ch*1.02-VS*1.2)||ly<0.2) return M.DARK;                          /* corner posts, chamfer trim, sill */
    if(ly>H-VS*1.5) return (Math.abs(w%0.6)<VS*0.55)?M.DARK:mat;                           /* roof ribs */
    if(aw>1.2-VS*1.5){ if(au<1.0) return (Math.floor(u/(VS*1.5))&1)?M.TIRE:M.DARK;         /* side vents */
      if(Math.abs((au-1.85)-(ly-H/2)*0.5)<0.13) return M.DARK; }                          /* hazard diagonal */
    return mat; }));
  lbox(x,z,ax,2.95,3.06,-0.1,0.1,y0+H-0.5,y0+H-0.34,M.NEON); }
/* ---- rolling stock ---- */
function trainBase(x,z,len){ box(x-len/2,0.72,z-1.18,x+len/2,0.96,z+1.18,M.DARK);
  for(const e of [-1,1]){ const xe=x+e*len/2; box(Math.min(xe,xe+e*0.55),0.74,z-0.14,Math.max(xe,xe+e*0.55),0.94,z+0.14,M.METAL); box(Math.min(xe,xe+e*0.12),0.66,z-0.2,Math.max(xe,xe+e*0.12),1.0,z+0.2,M.AWN); }
  for(const o of [-len/2+1.7,len/2-1.7]){ box(x+o-1.15,0.38,z-0.98,x+o+1.15,0.72,z+0.98,M.DARK); box(x+o-0.3,0.3,z-1.02,x+o+0.3,0.62,z+1.02,M.METAL);
    for(const k of [-0.7,0.7]) for(const sd of [-1,1]){ const cx=x+o+k, cz=z+sd*0.8; box(cx-0.42,0,cz-0.1,cx+0.42,0.84,cz+0.1,(X,Y)=>{ const dx=(X+0.5)*VS-cx, dy=(Y+0.5)*VS-0.42; const r2=dx*dx+dy*dy; return r2<0.42*0.42?(r2<0.13*0.13?M.METAL:M.TIRE):-1; }); } } }
function boxcar(x,z,len,mat){ wagon('box',x,z,len,mat); }
function wagon(kind,x,z,len,mat){ trainBase(x,z,len); const hl=len/2;
  const ribs=(u,step)=>Math.abs(((u+hl)%step+step)%step)<VS*1.05;
  if(kind==='box'){ box(x-hl,0.96,z-1.25,x+hl,3.05,z+1.25,LF(x,z,true,(u,w,y)=>{ const aw=Math.abs(w), au=Math.abs(u);
      if(aw>1.25-VS&&!ribs(u,0.8)&&y>1.1&&y<2.9&&au<hl-0.25&&au>1.25) return -1;              /* recessed panels between ribs */
      if(au<1.25){ if(y<1.08||y>2.88) return M.DARK; if(Math.abs(u)<VS*0.6) return M.DARK; return (aw>1.25-VS&&ribs(u,0.32))?M.DARK:mat; }   /* sliding doors */
      return mat; }));
    box(x-hl+0.1,3.05,z-1.05,x+hl-0.1,3.22,z+1.05,M.METAL); box(x-hl+0.3,3.22,z-0.7,x+hl-0.3,3.32,z+0.7,M.METAL); return; }
  if(kind==='hopper'){ const f0=-hl+2.95, f1=hl-2.95, fc=[(f0+(-0.25))/2,(0.25+f1)/2], fl=(f1-0.25)/2;
    box(x-hl,0.96,z-1.25,x+hl,3.1,z+1.25,LF(x,z,true,(u,w,y)=>{ const aw=Math.abs(w), au=Math.abs(u);
      if(y<1.75){ if(au>hl-0.4) return (y>1.5)?mat:-1; if(au>hl-2.95) return (y>1.5)?mat:-1;          /* end decks over bogies */
        const t=(y-0.96)/0.79, k=fc.map(cu=>Math.abs(u-cu)), m=Math.min(...k); if(m>fl*(0.3+0.7*t)||aw>1.25*(0.45+0.55*t)) return -1; return (m>fl*(0.3+0.7*t)-VS*1.2)?M.DARK:mat; }
      if(aw>1.25-VS&&!ribs(u,1.0)&&y<2.95&&au<hl-0.2) return -1;
      return mat; }));
    box(x-hl+0.4,3.1,z-0.35,x+hl-0.4,3.22,z+0.35,M.METAL); for(const e of [-1,1]) box(x+e*(hl-0.2)-0.06,3.1,z-1.1,x+e*(hl-0.2)+0.06,3.6,z+1.1,M.METAL); return; }
  if(kind==='gondola'){ box(x-hl,0.96,z-1.25,x+hl,2.65,z+1.25,LF(x,z,true,(u,w,y)=>{ const aw=Math.abs(w), au=Math.abs(u);
      const wall=aw>1.25-VS*2||au>hl-VS*2||y<1.15; if(!wall) return (y<2.15+0.25*Math.sin(u*1.7)*Math.cos(w*2.3))?M.DARK:-1;      /* coal heap */
      if(aw>1.25-VS&&!ribs(u,1.1)&&y>1.2&&y<2.5&&au<hl-0.2) return -1; return y>2.5?M.METAL:mat; })); return; }
  if(kind==='flat'){ box(x-hl,0.96,z-1.25,x+hl,1.22,z+1.25,(X,Y,Z)=>Math.abs((Z+0.5)*VS-z)>1.1?M.DARK:mat);
    for(let u=-hl+0.6;u<=hl-0.5;u+=1.45) for(const sd of [-1,1]) box(x+u-0.07,1.22,z+sd*1.17-0.07,x+u+0.07,1.9,z+sd*1.17+0.07,M.METAL);
    container(x,z,true,mat===M.CGRN?M.TAXI:M.CORNG,1.22); return; } }
function locomotive(x,z){ trainBase(x,z,12.2);
  box(x-6,0.96,z-1.28,x+6,3.4,z+1.28,LF(x,z,true,(u,w,y)=>{ const aw=Math.abs(w);
    if(u>4.4&&y>3.4-(u-4.4)*1.35) return -1;                                         /* raked nose */
    if(u<-5.6&&y>3.0) return -1;
    if(aw>1.12&&y>3.1&&(aw-1.12)+(y-3.1)>0.18) return -1;                           /* rounded roof */
    if(y<1.24) return M.AWN;                                                          /* accent skirt */
    if(y>1.62&&y<1.76) return M.NEON;                                                 /* light belt */
    if(u>3.0&&y>2.3&&y<3.05&&(aw>1.12||u>4.4)) return M.WINOFF;                      /* cab glass */
    if(u>4.4&&y<1.6&&y>1.3&&aw<0.55) return M.LAMP;                                   /* headlight bar */
    if(u<2.2&&u>-4.8&&y>2.05&&y<3.0&&aw>1.12) return (Math.floor(u/(VS*2))&1)?M.DARK:M.CGRY;   /* side vents */
    if(u<-5.85&&aw<0.45&&y<2.9) return M.DARK;                                        /* rear door */
    return M.CGRY; }));
  box(x-4.6,3.4,z-0.75,x+1.2,3.62,z+0.75,M.METAL); cyl(x-3.2,z,0.45,3.62,3.8,M.DARK); cyl(x-0.8,z,0.45,3.62,3.8,M.DARK);
  box(x+2.0,3.4,z-0.12,x+2.2,4.2,z+0.12,M.METAL); box(x+1.6,4.1,z-0.55,x+2.6,4.2,z+0.55,M.METAL);
  LAMPS.push({x:x+6.4,y:1.5,z,r:4,col:'lamp',size:2.4}); }
function waterTower(x,z){ for(const [dx,dz] of [[-1.6,-1.6],[1.6,-1.6],[-1.6,1.6],[1.6,1.6]]) box(x+dx-0.15,0,z+dz-0.15,x+dx+0.15,6,z+dz+0.15,M.METAL);
  box(x-1.6,3,z-0.08,x+1.6,3.15,z+0.08,M.METAL); box(x-0.08,3,z-1.6,x+0.08,3.15,z+1.6,M.METAL); cyl(x,z,2.3,6,9,(X,Y,Z)=>((Y%4)===0)?M.DARK:M.RUST,0.4); cyl(x,z,2.4,9,9.3,M.DARK); cyl(x,z,1.2,9.3,10,M.DARK); }
function platform(x0,z0,x1,z1){ const zc=(z0+z1)/2; box(x0,0,z0,x1,0.55,z1,M.MID); for(let x=x0+1;x<x1;x+=5) box(x-0.15,0.55,zc-0.15,x+0.15,3.6,zc+0.15,M.METAL);
  box(x0,3.6,z0-0.5,x1,3.9,z1+0.5,M.ROOF); for(let x=x0+3.5;x<x1;x+=10){ box(x-0.3,3.35,zc-0.3,x+0.3,3.6,zc+0.3,M.LAMP); LAMPS.push({x,y:3.4,z:zc,r:3,col:'lamp',size:2}); } }
function genStation(R){ edgeWalls({E:1,S:1});
  for(const z of [8,14,20,26]){ box(1,0,z-0.8,79,0.14,z-0.62,M.METAL); box(1,0,z+0.62,79,0.14,z+0.8,M.METAL); }
  wagon('box',12,8,10,M.CBLUE); wagon('hopper',23,8,10,M.CORNG); wagon('gondola',50,14,10,M.CGRY); wagon('flat',61,14,10,M.CGRN); wagon('gondola',72,26,9,M.CGRY); locomotive(30,20); wagon('box',13,20,9,M.CRED);
  for(const z of [8,14,20,26]){ box(78.2,0,z+1.4,78.5,3,z+1.7,M.METAL); box(78.05,2.6,z+1.35,78.65,3.1,z+1.75,M.NEON); LAMPS.push({x:78.35,y:2.85,z:z+1.55,r:1.5,col:'neon',size:1.6}); }
  platform(4,30,32,33.5); office(5,40,24,11,3,61); glyphSign(9,6.4,51,51.35,'中口',false,M.DARK,M.NEON);
  waterTower(18,64); warehouse(48,50,26,9); for(const [x,z,m] of [[50,66,M.CBLUE],[57,66,M.TAXI],[64,66,M.CGRN],[52,71.5,M.CGRY],[60,71.5,M.CORNG]]) container(x,z,true,m);
  container(57,66,true,M.TAXI,2.5); truck(8,72,true); crates(26,58); crates(28,74);
  for(const x of [50,58,66,74]){ streetLamp(x,34.6,0,1); streetLamp(x,45.4,0,-1); } for(const z of [50,58,66,74]){ streetLamp(34.6,z,1,0); streetLamp(45.4,z,-1,0); }
  for(const [x,z] of [[33.4,46.6],[46.6,33.4],[46.6,46.6]]) bollard(x,z); }
function paintStation(s){ gx.fillStyle=cssA(mix3(P.ground,P.dark,0.25),1); R_(0,2,80,30);
  gx.fillStyle=cssA(P.wood,0.55); for(const z of [8,14,20,26]) for(let x=1;x<79;x+=0.9) R_(x,z-1.05,0.32,2.1);
  streetH(s,36,44,36,80,true); streetV(s,36,44,36,80,true); gx.fillStyle=css(s.road); R_(36,36,8,8);
  }
function genPort(R){ edgeWalls({W:1,S:1});
  box(49,0,0.6,49.6,0.6,30,M.MID); for(let z=3;z<29;z+=5) box(48.3,0,z-0.2,48.8,0.7,z+0.2,M.METAL);
  for(const z of [5,24]) for(const x of [46,53]) box(x-0.4,0,z-0.4,x+0.4,12.5,z+0.4,M.AWN);
  for(const z of [5,24]) box(45,12.5,z-0.45,78,13.4,z+0.45,(X)=>(X%4===0)?M.DARK:M.AWN); for(const x of [46,53]) box(x-0.4,12.5,5,x+0.4,13.4,24,M.AWN);
  box(60,11.6,4.6,63,12.5,24.4,M.DARK); box(60.8,6.5,14.3,62.2,11.6,14.7,M.METAL); box(60.5,5.5,13.3,62.5,6.5,15.7,M.MID); box(45.5,10.5,10,48,12.5,13,M.WIN); LAMPS.push({x:77,y:13.6,z:14.5,r:2,col:'neon',size:2.5,pool:false});
  box(56,0,7,78,2.6,19,M.DARK); box(56,0,7,78,0.6,19,M.AWN); box(71,2.6,8.5,77,7.2,17.5,(X,Y,Z)=>((Y%3===1)&&(X%2===0))?M.WIN:M.WALL); box(73,7.2,12.5,74,9.5,13.5,M.METAL);
  for(const [x,z,m] of [[59,10,M.TAXI],[65,10,M.CBLUE],[59,16,M.CRED],[65,16,M.CORNG]]) container(x,z,true,m,2.6);
  const cols=[M.TAXI,M.CBLUE,M.CORNG,M.CRED,M.CGRN,M.CGRY]; let ci=0;
  for(let z=4;z<32;z+=3.2) for(let x=4;x<31;x+=7){ if(hash3(x|0,(z*10)|0,3)<0.15) continue; const n=1+((hash3(x|0,(z*10)|0,5)*3)|0); for(let k=0;k<n;k++) container(x+3,z,true,cols[(ci++)%6],k*2.5); }
  storage(56,58,2.6); storage(64,58,2.6); storage(72,58,2.6); storage(60,70,2.6); storage(70,70,2.6); warehouse(3,50,28,9); office(6,64,12,12,3,62); truck(24,70,true);
  for(const x of [6,14,22,30]){ streetLamp(x,34.6,0,1); streetLamp(x,45.4,0,-1); } for(const z of [50,58,66,74]){ streetLamp(34.6,z,1,0); streetLamp(45.4,z,-1,0); }
  for(const [x,z] of [[33.4,46.6],[46.6,46.6],[33.4,33.4],[46.6,33.4]]) bollard(x,z); }
function paintPort(s){ gx.fillStyle=cssA(mix3(P.road,P.side,0.5),1); R_(30,0,20,34); R_(0,0,34,34);
  gx.strokeStyle=cssA(P.line,0.18); gx.lineWidth=1; gx.beginPath(); for(let z=2;z<34;z+=3.2){ gx.moveTo(0,z*GS); gx.lineTo(34*GS,z*GS); } gx.stroke();
  gx.fillStyle=cssA(P.accent,0.5); for(let z=1;z<30;z+=2) R_(48.5,z,0.4,1);
  streetH(s,36,44,0,44,true); streetV(s,36,44,36,80,true); gx.fillStyle=css(s.road); R_(36,36,8,8);
  }
function cframe(x0,z0,w,d,fl,seed){ const fh=3; box(x0,0,z0,x0+w,0.35,z0+d,M.MID);
  for(let f=0;f<fl;f++){ const y=f*fh; if(f>0) box(x0,y,z0,x0+w,y+0.35,z0+d,(X,Y,Z)=>(f===fl-1&&hash3(X>>3,Z>>3,seed+f)<0.3)?-1:M.MID);
    const nx=Math.round(w/3.5), nz=Math.round(d/3.5);
    for(let i=0;i<=nx;i++) for(let j=0;j<=nz;j++){ const x=x0+w*i/nx, z=z0+d*j/nz; if(f===fl-1&&hash3(i,j,seed)<0.35) continue; box(x-0.25,y+0.35,z-0.25,x+0.25,y+fh,z+0.25,M.MID); if(f===fl-1) box(x-0.05,y+fh,z-0.05,x+0.05,y+fh+1,z+0.05,M.METAL); } } }
function scaffold(x0,x1,z,h){ for(let x=x0;x<=x1;x+=1.2) box(x-VS/2,0,z-VS/2,x+VS/2,h,z+VS/2,M.TRUNK); for(let y=1.4;y<h;y+=1.5){ box(x0,y,z-VS/2,x1,y+VS,z+VS/2,M.WOOD); box(x0,y-0.1,z-0.7,x1,y,z,M.WOOD); } }
function towerCrane(x,z,j0,j1,H){ box(x-0.6,0,z-0.6,x+0.6,H,z+0.6,(X,Y,Z)=>{ const lx=(X+0.5)*VS-x, lz=(Z+0.5)*VS-z, ex=Math.abs(lx)>0.38, ez=Math.abs(lz)>0.38; return ((ex&&ez)||((ex||ez)&&(Y+X+Z)%3===0))?M.AWN:-1; });
  box(x-1,H,z-1,x+1,H+1.4,z+1,M.AWN); box(x+0.4,H-0.5,z+0.8,x+1.6,H+0.9,z+1.9,M.WIN); box(j0,H+1.4,z-0.45,j1,H+2.1,z+0.45,(X)=>(X%3===0)?M.DARK:M.AWN); box(j0,H+0.4,z-0.8,j0+2.6,H+1.4,z+0.8,M.MID);
  box(x-0.1,H+2.1,z-0.1,x+0.1,H+4.4,z+0.1,M.METAL); const hx=j1-3; box(hx-0.05,H-8,z-0.05,hx+0.05,H+1.4,z+0.05,M.METAL); box(hx-0.35,H-8.6,z-0.35,hx+0.35,H-8,z+0.35,M.AWN);
  box(j1-0.3,H+2.1,z-0.3,j1,H+2.4,z+0.3,M.NEON); LAMPS.push({x:j1-0.15,y:H+2.2,z,r:2,col:'neon',size:2,pool:false}); }
function mixer(x,z){ truck(x,z,true); box(x-3,2.0,z-1.2,x+1,3.4,z+1.2,0); sphere(x-1,2.5,z,1.3,(X,Y,Z)=>((X+Y)%3===0)?M.DARK:M.WALL); }
function siteFence(x0,z0,x1,z1){ box(x0,0,z0,x1,2,z1,(X,Y,Z)=>((Y+0.5)*VS>1.6)?M.AWN:M.WALL); }
function genSite(R){ edgeWalls({N:1,E:1});
  cframe(4,4,14,12,4,1); scaffold(4,18,16.8,10); cframe(50,5,14,12,6,2); scaffold(50,64,17.8,16); cframe(6,52,12,14,3,3); cframe(52,52,16,12,5,4);
  towerCrane(26,26,12,40,20); mixer(14,40); mixer(66,28);
  sphere(24,0,40,2.4,M.HAY,0.15); sphere(28,0,62,2.2,M.HAY,0.15); sphere(70,0,24,2.0,M.MID,0.2); sphere(60,0,70.5,1.8,M.HAY,0.15);
  for(let k=0;k<3;k++) box(54,k*0.5,28,64,k*0.5+0.45,29+k*0.2,M.METAL);
  siteFence(48,48.6,56,49.1); siteFence(62,48.6,72,49.1); siteFence(4,48.6,22,49.1);
  for(const [x,z] of [[30,8],[31.5,8]]) box(x-0.6,0,z-0.6,x+0.6,2.3,z+0.6,M.PANEL);
  for(const z of [6,14,22,30]){ streetLamp(34.6,z,1,0); streetLamp(45.4,z,-1,0); } for(const x of [50,58,66,74]){ streetLamp(x,34.6,0,1); streetLamp(x,45.4,0,-1); }
  for(const [x,z] of [[33.4,46.6],[46.6,46.6],[46.6,33.4]]) bollard(x,z); }
function paintSite(s){ const dirt=mix3(P.side,[0.55,0.45,0.32],0.3); gx.fillStyle=cssA(mix3(dirt,P.dark,0.3),1); R_(0,0,80,80);
  gx.strokeStyle=cssA(P.dark,0.35); gx.lineWidth=0.5*GS; gx.beginPath(); gx.moveTo(14*GS,40*GS); gx.bezierCurveTo(24*GS,30*GS,30*GS,46*GS,36*GS,40*GS); gx.stroke();
  streetV(s,36,44,0,44,true); streetH(s,36,44,36,80,true); gx.fillStyle=css(s.road); R_(36,36,8,8);
  }
function teaRows(x0,z0,x1,z1,clear){ for(let z=z0;z<z1;z+=2.4){ for(let x=x0;x<x1;x+=0.5){ if(((x-x0)%10)>8.6) continue; let ok=true; for(const c of clear) if(Math.hypot(x-c[0],z+0.5-c[1])<4.4){ ok=false; break; } if(ok) box(x,0,z,x+0.5,0.75,z+1.1,M.LEAF); } } }
function stoneLantern(x,z){ box(x-0.3,0,z-0.3,x+0.3,0.3,z+0.3,M.MID); box(x-0.1,0.3,z-0.1,x+0.1,0.9,z+0.1,M.MID); box(x-0.28,0.9,z-0.28,x+0.28,1.3,z+0.28,M.MID); box(x-0.15,0.95,z-0.15,x+0.15,1.25,z+0.15,M.LANT); box(x-0.38,1.3,z-0.38,x+0.38,1.45,z+0.38,M.TILE); LAMPS.push({x,y:1.1,z,r:1.4,col:'neon',size:1.2}); }
function genTemple(R){ edgeWalls({W:1,N:1});
  teaRows(2,2,33,33,[[18,18]]); teaRows(47,2,78,33,[[62,18]]); teaRows(2,47,33,78,[[18,62]]);
  const cw=(x0,z0,x1,z1)=>{ box(x0,0,z0,x1,2.2,z1,M.WALL); box(x0-0.15,2.2,z0-0.15,x1+0.15,2.5,z1+0.15,M.TILE); };
  cw(48,49,59,49.5); cw(67,49,78.5,49.5); cw(48,49.5,48.5,78.5); cw(78,49.5,78.5,78.5); cw(48.5,78,78,78.5);
  paifang(63,46.8);
  house(54,62,18,10,5,0,301,true); roof(56,64,70,70,6.4,1.5,true,M.TILE,1.3); for(let x=55;x<=71;x+=2.6) box(x-0.2,0,61.2,x+0.2,4.6,61.6,M.AWN); box(54,0,60.6,72,0.4,62,M.MID);
  cyl(63,56,0.8,0,1.0,M.METAL); cyl(63,56,0.5,1.0,1.4,M.LANT); LAMPS.push({x:63,y:1.3,z:56,r:2.5,col:'neon',size:2.2});
  for(const [dx,dz] of [[-1.6,-1.6],[1.6,-1.6],[-1.6,1.6],[1.6,1.6]]) box(52+dx-0.18,0,54+dz-0.18,52+dx+0.18,3,54+dz+0.18,M.AWN); roofHip(49.3,51.3,54.7,56.7,3,1.2,M.TILE,1.2); sphere(52,2.0,54,0.75,M.METAL); box(51.95,2.6,53.95,52.05,3,54.05,M.DARK);
  pagoda(72,56,4);
  for(const z of [52,56,60]){ stoneLantern(60.5,z); stoneLantern(65.5,z); }
  bamboo(56,40,R); bamboo(72,40,R); for(const [x,z] of [[52,36],[64,44],[76,36]]) tree(x,z,R,true);
  for(const x of [8,18,28]){ box(x-0.12,0,34.3,x+0.12,3.2,34.6,M.WOOD); box(x-0.12,0,45.4,x+0.12,3.2,45.7,M.WOOD); lantern(x,2.55,34.9,false); lantern(x,2.55,45.1,false); }
  for(const z of [8,18,28]){ box(34.3,0,z-0.12,34.6,3.2,z+0.12,M.WOOD); box(45.4,0,z-0.12,45.7,3.2,z+0.12,M.WOOD); lantern(34.9,2.55,z,false); lantern(45.1,2.55,z,false); } }
function paintTemple(s){ gx.fillStyle=cssA(mix3(P.ground,P.dark,0.3),1); R_(0,0,80,80);
  gx.fillStyle=cssA(mix3(P.wall,P.mid,0.6),1); R_(48,49,30.5,29.5); gx.strokeStyle='rgba(255,255,255,0.06)'; gx.lineWidth=1; gx.beginPath(); for(let v=48;v<79;v+=1.5){ gx.moveTo(v*GS,49*GS); gx.lineTo(v*GS,78.5*GS); gx.moveTo(48*GS,(v+1)*GS); gx.lineTo(78.5*GS,(v+1)*GS); } gx.stroke();
  gx.fillStyle=cssA(mix3(P.wall,P.mid,0.5),1); R_(61,44,4,18);
  streetH(s,36,44,0,44,true); streetV(s,36,44,0,44,true); gx.fillStyle=css(s.road); R_(36,36,8,8);
  }

