/* ================= VOXEL GRID ================= */
let CS=16; let WX=80, WZ=80; let WH=18;
let Q='med', VS, NX, NY, NZ, grid, CX, CY, CZ, chunks=null;
const dirty = new Set();
const gi = (x,y,z) => x+NX*(z+NZ*y);
function get(x,y,z){ return (x<0||y<0||z<0||x>=NX||y>=NY||z>=NZ)?0:grid[x+NX*(z+NZ*y)]; }
function put(x,y,z,m){ if(x<0||y<0||z<0||x>=NX||y>=NY||z>=NZ) return; grid[x+NX*(z+NZ*y)]=m; }
const c = v => Math.round(v/VS);
function dirtyAdd(cx,cy,cz){ if(cx<0||cy<0||cz<0||cx>=CX||cy>=CY||cz>=CZ) return; dirty.add(cx+CX*(cz+CZ*cy)); }
function markDirty(x,y,z){ const cx=(x/CS)|0, cy=(y/CS)|0, cz=(z/CS)|0; dirtyAdd(cx,cy,cz);
  const lx=x-cx*CS, ly=y-cy*CS, lz=z-cz*CS;
  if(lx===0)dirtyAdd(cx-1,cy,cz); else if(lx===CS-1)dirtyAdd(cx+1,cy,cz);
  if(ly===0)dirtyAdd(cx,cy-1,cz); else if(ly===CS-1)dirtyAdd(cx,cy+1,cz);
  if(lz===0)dirtyAdd(cx,cy,cz-1); else if(lz===CS-1)dirtyAdd(cx,cy,cz+1); }
function matRGB(m,x,y,z,o){ const d=MD[m], a=P[d.k];
  if(d.k2){ const b=P[d.k2], s=Math.max(1,Math.round(1.1/VS));
    const t=clamp(0.6*hash3((x/s)|0,(y/s)|0,(z/s)|0)+0.4*((y%s)/s),0,1);
    o[0]=a[0]+(b[0]-a[0])*t; o[1]=a[1]+(b[1]-a[1])*t; o[2]=a[2]+(b[2]-a[2])*t;
  } else { const v=0.92+0.16*hash3(x,y,z); o[0]=a[0]*v; o[1]=a[1]*v; o[2]=a[2]*v; } }

/* ---------- primitive helpers (world units) ---------- */
function box(x0,y0,z0,x1,y1,z1,m){ let a=c(x0),b=c(x1),d=c(y0),e=c(y1),f=c(z0),g=c(z1);
  if(b<=a)b=a+1; if(e<=d)e=d+1; if(g<=f)g=f+1; const fn=typeof m==='function';
  for(let y=d;y<e;y++)for(let z=f;z<g;z++)for(let x=a;x<b;x++){ const v=fn?m(x,y,z):m; if(v>=0) put(x,y,z,v); } }
/* voxel callback in local coords: u along the object's long axis, w across, y up (world units) */
function LF(x,z,ax,fn){ return (X,Y,Z)=>{ const wx=(X+0.5)*VS, wy=(Y+0.5)*VS, wz=(Z+0.5)*VS; return ax?fn(wx-x,wz-z,wy):fn(wz-z,wx-x,wy); }; }
function lbox(x,z,ax,a0,a1,w0,w1,y0,y1,m){ if(ax) box(x+a0,y0,z+w0,x+a1,y1,z+w1,m); else box(x+w0,y0,z+a0,x+w1,y1,z+a1,m); }
function shell(x0,z0,x1,z1,y0,y1,fn,thick){ const a=c(x0),b=c(x1),f=c(z0),g=c(z1),d=c(y0),e=Math.max(c(y0)+1,c(y1));
  const t=Math.max(1,c(thick||0.35));
  for(let y=d;y<e;y++){ const v=(y+0.5)*VS-y0;
    for(let z=f;z<g;z++)for(let x=a;x<b;x++){ const d0=z-f,d1=g-1-z,d2=x-a,d3=b-1-x, mn=Math.min(d0,d1,d2,d3); if(mn>=t) continue;
      let side,u; if(mn===d1){side=1;u=(x+0.5)*VS-x0}else if(mn===d0){side=0;u=(x+0.5)*VS-x0}else if(mn===d2){side=2;u=(z+0.5)*VS-z0}else{side=3;u=(z+0.5)*VS-z0}
      const m=fn(side,u,v); if(m>=0) put(x,y,z,m); } } }
function cyl(cx,cz,r,y0,y1,m,t){ const a=c(cx-r)-1,b=c(cx+r)+1,f=c(cz-r)-1,g=c(cz+r)+1,d=c(y0),e=Math.max(d+1,c(y1));
  const r2=r*r, ri=t?(r-t)*(r-t):-1, fn=typeof m==='function';
  for(let y=d;y<e;y++)for(let z=f;z<g;z++)for(let x=a;x<b;x++){ const wx=(x+0.5)*VS-cx, wz=(z+0.5)*VS-cz, q=wx*wx+wz*wz;
    if(q<=r2&&q>ri){ const v=fn?m(x,y,z):m; if(v>=0) put(x,y,z,v); } } }
function sphere(cx,cy,cz,r,m,noise){ const a=c(cx-r)-1,b=c(cx+r)+1,d=c(cy-r)-1,e=c(cy+r)+1,f=c(cz-r)-1,g=c(cz+r)+1, fn=typeof m==='function';
  for(let y=Math.max(0,d);y<e;y++)for(let z=f;z<g;z++)for(let x=a;x<b;x++){ const wx=(x+0.5)*VS-cx, wy=(y+0.5)*VS-cy, wz=(z+0.5)*VS-cz;
    const dd=Math.sqrt(wx*wx+wy*wy+wz*wz); if(dd<=Math.max(VS*0.6,r*(1-(noise||0)*hash3(x,y,z)))){ const v=fn?m(x,y,z):m; if(v>=0) put(x,y,z,v); } } }
function roof(x0,z0,x1,z1,y0,rise,alongX,mat,curl){ const a=c(x0),b=c(x1),f=c(z0),g=c(z1), th=Math.max(VS,0.4);
  const slope=rise/Math.max(0.5,(alongX?(z1-z0):(x1-x0))/2)*VS;
  for(let z=f;z<g;z++)for(let x=a;x<b;x++){ const wx=(x+0.5)*VS, wz=(z+0.5)*VS;
    const u=alongX?(wx-x0)/(x1-x0)*2-1:(wz-z0)/(z1-z0)*2-1, v=alongX?(wz-z0)/(z1-z0)*2-1:(wx-x0)/(x1-x0)*2-1;
    const au=Math.abs(u), av=Math.abs(v), base=y0+rise*(1-av);
    const top=base+(curl||0)*(Math.pow(Math.max(0,au-0.72)/0.28,2)*0.8+Math.pow(Math.max(0,av-0.82)/0.18,2)*0.3);
    const yb=c(Math.min(base,top)-th-slope), yt=c(top);
    for(let y=Math.max(0,yb);y<=yt;y++) put(x,y,z,av<0.07?M.DARK:mat); } }
function roofHip(x0,z0,x1,z1,y0,rise,mat,curl){ const a=c(x0),b=c(x1),f=c(z0),g=c(z1), th=Math.max(VS,0.35), sl=rise/((x1-x0)/2)*VS;
  for(let z=f;z<g;z++)for(let x=a;x<b;x++){ const u=((x+0.5)*VS-x0)/(x1-x0)*2-1, v=((z+0.5)*VS-z0)/(z1-z0)*2-1;
    const au=Math.abs(u), av=Math.abs(v), m=Math.max(au,av), cr=Math.max(0,Math.min(au,av)-0.7)/0.3;
    const base=y0+rise*(1-m), top=base+(curl||0)*cr*cr*0.9;
    const yb=c(Math.min(base,top)-th-(m>0.9?0.25:0)-sl), yt=c(top);
    for(let y=Math.max(0,yb);y<=yt;y++) put(x,y,z,m<0.08?M.DARK:mat); } }

const GLYPHS={
 '中':['...#...','#######','#..#..#','#..#..#','#######','...#...','...#...'],
 '工':['#######','...#...','...#...','...#...','...#...','...#...','#######'],
 '大':['...#...','...#...','#######','...#...','..#.#..','.#...#.','#.....#'],
 '电':['...#...','#######','#..#..#','#######','#..#..#','#######','...####'],
 '厂':['#######','#......','#......','#......','#......','.#.....','#......'],
 '人':['...#...','...#...','...#...','..#.#..','..#.#..','.#...#.','#.....#'],
 '车':['...#...','#######','..#....','.######','...#...','#######','...#...'],
 '田':['#######','#..#..#','#..#..#','#######','#..#..#','#..#..#','#######'],
 '山':['...#...','#..#..#','#..#..#','#..#..#','#..#..#','#######','.......'],
 '水':['...#...','...#..#','##.#.#.','..###..','.#.#.#.','#..#..#','..##...'],
 '日':['.#####.','.#...#.','.#...#.','.#####.','.#...#.','.#...#.','.#####.'],
 '口':['#######','#.....#','#.....#','#.....#','#.....#','#.....#','#######'],
 '米':['#..#..#','.#.#.#.','...#...','#######','..###..','.#.#.#.','#..#..#'],
'汽':['#..####','.#.....','...####','#......','.#.####','.#....#','#.....#'],
 '火':['...#...','#..#..#','.#.#.#.','...#...','..#.#..','.#...#.','#.....#'],
};
function glyphSign(x0,y0,z0,z1,text,vertical,bg,fg,scale){ const p=Math.max(1,Math.floor(0.5*(scale||1)/VS+0.01)); const n=text.length;
  const wpx=vertical?9:(n*8+1), hpx=vertical?(n*8+1):9, Wc=wpx*p, Hc=hpx*p;
  const ax=c(x0), ay=c(y0), az0=c(z0), az1=Math.max(az0+1,c(z1));
  for(let j=0;j<Hc;j++){ const ly=(j/p)|0; for(let i=0;i<Wc;i++){ const lx=(i/p)|0; let k,gx_,gy;
    if(vertical){ k=Math.floor((ly-1)/8); gy=(ly-1)-k*8; gx_=lx-1; } else { k=Math.floor((lx-1)/8); gx_=(lx-1)-k*8; gy=ly-1; }
    let on=false; if(k>=0&&k<n&&gx_>=0&&gx_<7&&gy>=0&&gy<7){ const G=GLYPHS[text[k]]; on=!!G&&G[gy][gx_]==='#'; }
    const m=on?fg:bg; if(m<0) continue; for(let z=az0;z<az1;z++) put(ax+i, ay+Hc-1-j, z, m); } }
  return {w:Wc*VS,h:Hc*VS}; }
function winMat(seed,lens,per,ww,v0,v1,lit){ return (side,u,v)=>{ const L=lens[side], uu=u-0.6;
  if(uu<0||u>L-0.6||v<v0||v>v1) return M.DARK; const k=Math.floor(uu/per), lu=uu-k*per;
  if(lu<(per-ww)*0.5||lu>(per+ww)*0.5) return M.DARK; return hash3(seed,k*3+side,side+11)<lit?M.WIN:M.WINOFF; }; }

/* ---------- shared props ---------- */
const LAMPS=[], CARS=[];
function streetLamp(x,z,dx,dz,colr){ const t=Math.max(VS,0.24)/2; box(x-t,0,z-t,x+t,5.4,z+t,M.METAL);
  const ex=x+dx*1.5, ez=z+dz*1.5; box(Math.min(x,ex)-t,5.2,Math.min(z,ez)-t,Math.max(x,ex)+t,5.42,Math.max(z,ez)+t,M.METAL);
  box(ex-0.3,4.95,ez-0.3,ex+0.3,5.2,ez+0.3,M.LAMP); LAMPS.push({x:ex,y:5.05,z:ez,r:4.4,col:colr||'lamp',size:3}); }
function lantern(x,y,z,big,noPool){ const r=big?0.38:0.27; box(x-0.04,y+r*0.6,z-0.04,x+0.04,y+r+0.55,z+0.04,M.DARK); sphere(x,y,z,r,M.LANT);
  LAMPS.push({x,y,z,r:big?2.4:1.7,col:'neon',size:big?2.2:1.5,pool:!noPool&&y<4.5}); }
function tree(x,z,R,blossom){ box(x-0.75,0,z-0.75,x+0.75,0.4,z+0.75,M.MID); const t=Math.max(VS,0.36)/2; box(x-t,0.4,z-t,x+t,2.6,z+t,M.TRUNK);
  const r=1.2+0.35*R(), mm=blossom?M.BLOS:M.LEAF; sphere(x,3.25,z,r,mm,0.22); sphere(x+0.55,2.85,z+0.35,r*0.62,mm,0.3); }
function bench(x,z){ box(x-0.85,0.42,z-0.22,x+0.85,0.55,z+0.22,M.FURN); box(x-0.85,0.55,z-0.24,x+0.85,1.0,z-0.1,M.FURN);
  box(x-0.75,0,z-0.18,x-0.6,0.42,z+0.18,M.METAL); box(x+0.6,0,z-0.18,x+0.75,0.42,z+0.18,M.METAL); }
function chair(x,z,dir){ box(x-0.25,0.42,z-0.25,x+0.25,0.52,z+0.25,M.FURN); box(dir>0?x-0.3:x+0.2,0.52,z-0.25,dir>0?x-0.2:x+0.3,1.0,z+0.25,M.FURN);
  box(x-0.06,0,z-0.06,x+0.06,0.42,z+0.06,M.METAL); }
function cafeTable(x,z){ box(x-0.08,0,z-0.08,x+0.08,0.75,z+0.08,M.METAL); box(x-0.5,0.75,z-0.5,x+0.5,0.88,z+0.5,M.FURN); chair(x-0.95,z,1); chair(x+0.95,z,-1); }
function taxi(x,z,ax){ const hw=ax?1.9:0.9, hd=ax?0.9:1.9; CARS.push({x,z,b:[c(x-hw-0.2),0,c(z-hd-0.2),c(x+hw+0.2),c(2.0),c(z+hd+0.2)],n0:0,dead:false,fuse:0,smoke:0,big:1}); vehDetail('taxi',x,z,ax,CARS[CARS.length-1]);
  const T=M.TAXI;
  lbox(x,z,ax,-1.95,1.95,-0.9,0.9,0.3,0.98,LF(x,z,ax,(u,w,y)=>{ const au=Math.abs(u), aw=Math.abs(w);
    if(au>1.8&&y<0.56) return M.METAL;                                   /* bumpers */
    if(u>1.84&&y>0.56&&y<0.84) return aw<0.42?M.DARK:aw<0.78?M.LAMP:T;    /* grille + headlamps */
    if(u<-1.84&&y>0.6&&y<0.8&&aw>0.5) return M.NEON;                     /* rear light bars */
    if(aw>0.78&&y>0.58&&y<0.76&&au<1.25) return ((Math.floor(u/0.2)+Math.floor(y/0.09))&1)?M.DARK:M.ROOF; /* checker band */
    if(u>1.0&&y>0.9) return -1;                                           /* hood sits lower */
    if(u<-1.25&&y>0.92) return -1;                                        /* trunk lower */
    return T; }));
  lbox(x,z,ax,-1.15,1.0,-0.82,0.82,0.98,1.66,LF(x,z,ax,(u,w,y)=>{ const aw=Math.abs(w), h=y-0.98;
    if(u>1.0-h*0.75) return -1; if(u<-1.15+h*0.45) return -1;            /* raked windshield + rear glass */
    if(y>1.52) return T;                                                  /* roof */
    if(aw>0.7&&(Math.abs(u+0.08)<0.09||u>0.86-h*0.75||u<-1.0+h*0.45)) return T; /* pillars */
    return M.WINOFF; }));
  box(x-0.25,1.66,z-0.15,x+0.25,1.9,z+0.15,M.LAMP);
  for(const sx of [-1,1]) for(const sz of [-1,1]){ const tx=x+sx*(hw-(ax?0.75:0.15)), tz=z+sz*(hd-(ax?0.15:0.75)); box(tx-(ax?0.3:0.12),0,tz-(ax?0.12:0.3),tx+(ax?0.3:0.12),0.6,tz+(ax?0.12:0.3),M.TIRE); } }
function bus(x,z,ax){ const L=5.6, W=1.25; CARS.push({x,z,b:ax?[c(x-L-0.3),0,c(z-W-0.3),c(x+L+0.3),c(3.4),c(z+W+0.3)]:[c(x-W-0.3),0,c(z-L-0.3),c(x+W+0.3),c(3.4),c(z+L+0.3)],n0:0,dead:false,fuse:0,smoke:0,big:1.4}); vehDetail('bus',x,z,ax,CARS[CARS.length-1]);
  lbox(x,z,ax,-L,L,-W,W,0.4,2.95,LF(x,z,ax,(u,w,y)=>{ const au=Math.abs(u), aw=Math.abs(w);
    if(aw>W-0.22&&y>2.72&&(aw-(W-0.22))+(y-2.72)>0.24) return -1;                 /* rounded roof edge */
    if(au>L-0.15&&u>0&&y>1.05&&y<2.5&&aw<W-0.12) return M.WINOFF;                   /* windscreen */
    if(au>L-0.15&&y<0.7) return M.METAL;                                            /* bumpers */
    if(y<0.62) return M.DARK;                                                       /* skirt */
    if(y>1.38&&y<1.5) return M.NEON;                                                /* light belt */
    if(y>=1.5&&y<2.5) return ((ax?Math.round(u/VS):Math.round(u/VS))%3===0||au>L-0.7)?M.MID:M.WIN; /* window band */
    if(y>=2.5) return M.FURN;
    return M.AWN; }));
  for(const a of [-3.8,3.6]) for(const s of [-1,1]) lbox(x,z,ax,a-0.5,a+0.5,s>0?W-0.3:-W,s>0?W:-W+0.3,0,0.85,M.TIRE); }
function barrier(x0,z0,x1,z1){ box(x0,0,z0,x1,1.0,z1,(x,y,z)=>((((x+z)*VS)%2)<1)?M.AWN:M.MID); }
function bollard(x,z){ box(x-0.15,0,z-0.15,x+0.15,0.9,z+0.15,M.METAL); }
function kiosk(x0,z0,w,d){ shell(x0,z0,x0+w,z0+d,0,2.8,(s,u,v)=>(s===1&&v>0.9&&v<2.2&&u>0.4&&u<w-0.4)?M.PANEL:M.DARK,0.3);
  box(x0-0.2,2.8,z0-0.2,x0+w+0.2,3.05,z0+d+0.6,M.AWN); }
function busStop(x0,z0){ box(x0+0.1,0,z0,x0+0.35,2.6,z0+0.25,M.METAL); box(x0+4.6,0,z0,x0+4.85,2.6,z0+0.25,M.METAL);
  box(x0-0.3,2.6,z0-0.2,x0+5.4,2.85,z0+1.5,M.MID); box(x0+0.35,0.4,z0+0.02,x0+4.6,2.5,z0+0.17,M.WINOFF);
  box(x0+1,0.45,z0+0.35,x0+3.8,0.58,z0+0.85,M.FURN); box(x0+1.1,0,z0+0.5,x0+1.3,0.45,z0+0.7,M.METAL); box(x0+3.5,0,z0+0.5,x0+3.7,0.45,z0+0.7,M.METAL);
  box(x0+5.4,0.2,z0+0.2,x0+6.9,2.6,z0+0.55,M.METAL); box(x0+5.55,0.35,z0+0.15,x0+6.75,2.45,z0+0.6,M.PANEL); }
function billboard(x0,z0,w,y0){ y0=y0||4.8; const h=5; box(x0,y0,z0,x0+w,y0+h,z0+0.4,M.BILL);
  glyphSign(x0+0.6,y0+0.3,z0-0.05,z0+0.45,'电',false,-1,M.DARK,1.0);
  box(x0+w*0.55,y0+1.2,z0-0.05,x0+w-0.6,y0+1.5,z0+0.45,M.DARK); box(x0+w*0.55,y0+2.3,z0-0.05,x0+w-1.8,y0+2.6,z0+0.45,M.DARK);
  box(x0+w*0.55,y0+3.4,z0-0.05,x0+w-0.6,y0+3.7,z0+0.45,M.DARK);
  box(x0-0.2,y0-0.25,z0+0.05,x0+w+0.2,y0,z0+0.35,M.METAL); box(x0-0.2,y0+h,z0+0.05,x0+w+0.2,y0+h+0.25,z0+0.35,M.METAL);
  box(x0+2,0,z0+0.05,x0+2.4,y0,z0+0.4,M.METAL); box(x0+w-2.4,0,z0+0.05,x0+w-2,y0,z0+0.4,M.METAL); }
function shops(x0,z0,w,d){ FLOORS.push([x0,z0,x0+w,z0+d,'tile']); const h=4.2, n=3, uw=w/n;
  for(let i=0;i<n;i++){ const ux=x0+i*uw;
    shell(ux,z0,ux+uw,z0+d,0,h,(s,u,v)=>(s===1&&v>0.25&&v<2.9&&u>0.7&&u<uw-0.7)?(i===1?M.PANEL:M.SHOP):M.DARK,0.35);
    box(ux,h,z0,ux+uw,h+0.35,z0+d,M.ROOF); box(ux+0.6,2.95,z0+d,ux+uw-0.6,3.15,z0+d+1.2,i===1?M.MID:M.AWN);
    box(ux+1,h+0.35,z0+d-0.6,ux+uw-1,h+1.5,z0+d-0.35,i===2?M.BILL:M.NEON); box(ux+1.2,h+0.5,z0+d-0.65,ux+uw-1.2,h+1.35,z0+d-0.3,M.DARK); }
  box(x0-0.8,0,z0+d+1.6,x0-0.4,10.2,z0+d+1.9,M.METAL); glyphSign(x0-1.6,1.4,z0+d+1.95,z0+d+2.3,'大中',true,M.DARK,M.NEON); }

