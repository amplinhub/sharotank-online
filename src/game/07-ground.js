/* ================= GROUND: blocky cell heightmap (0.5 m cells, 0.08 m steps) + painted texture ================= */
let HN=160; const HC=0.5, GT=20, HQS=0.08; let GTN=HN/GT, HM=new Float32Array(HN*HN);
const GC=document.createElement('canvas'); GC.width=GC.height=1024; const gx=GC.getContext('2d',{willReadFrequently:true}); const GS=12.8;
const gtex=new THREE.CanvasTexture(GC); gtex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
const groundMat=new THREE.MeshBasicMaterial({map:gtex,vertexColors:true,side:THREE.DoubleSide});
const ground=new THREE.Group(); scene.add(ground); let GTILE=new Array(GTN*GTN).fill(null);
const outer=new THREE.Mesh(new THREE.PlaneGeometry(700,700),new THREE.MeshBasicMaterial({color:0x000000})); outer.rotation.x=-Math.PI/2; outer.position.set(40,-0.6,40); scene.add(outer);
/* v25: map size varies per district (80 m, arena districts 160 m) — everything sized by WX is re-allocated here */
function mapResize(size){ if(size===WX&&HM.length===HN*HN) return; WX=WZ=size; HN=Math.round(size/HC); GTN=HN/GT; HM=new Float32Array(HN*HN);
  for(const m of GTILE) if(m){ ground.remove(m); m.geometry.dispose(); } GTILE=new Array(GTN*GTN).fill(null);
  GC.width=GC.height=Math.round(size*GS); gtex.dispose(); gtex.needsUpdate=true; outer.position.set(size/2,-0.6,size/2);
  NAVN=size; NAV.block=new Uint8Array(NAVN*NAVN); NAV.dist=new Float32Array(NAVN*NAVN); NAV.stamp=-1;
  NH.g=new Float32Array(NAVN*NAVN); NH.from=new Int32Array(NAVN*NAVN); NH.seen=new Uint16Array(NAVN*NAVN); NH.gen=0; NH.heap=new Int32Array(NAVN*NAVN*4); NH.hf=new Float32Array(NAVN*NAVN*4);
  const c=size/2; Object.assign(GATE_RECT,{N:[c-5,1.0,c+5,4.2],S:[c-5,size-4.2,c+5,size-1.0],W:[1.0,c-5,4.2,c+5],E:[size-4.2,c-5,size-1.0,c+5]}); }
function hAt(i,j){ return (i<0||j<0||i>=HN||j>=HN)?0:HM[j*HN+i]; }
function groundH(x,z){ const fx=clamp(x/HC-0.5,0,HN-1.0001), fz=clamp(z/HC-0.5,0,HN-1.0001); const i=fx|0, j=fz|0, tx=fx-i, tz=fz-j, k=j*HN+i;
  return (HM[k]*(1-tx)+HM[k+1]*tx)*(1-tz)+(HM[k+HN]*(1-tx)+HM[k+HN+1]*tx)*tz; }
function shadeTop(h,wet){ let s=1+(h<0?h*0.8:h*0.5); if(wet) s*=0.8; return clamp(s,0.45,1.15); }
function buildGTile(ti,tj){ const i0=ti*GT, j0=tj*GT, h0=HM[j0*HN+i0]; let flat=true;
  for(let j=j0;j<j0+GT&&flat;j++) for(let i=i0;i<i0+GT;i++) if(HM[j*HN+i]!==h0){ flat=false; break; }
  if(flat) for(let k=0;k<GT;k++) if(hAt(i0-1,j0+k)<h0||hAt(i0+GT,j0+k)<h0||hAt(i0+k,j0-1)<h0||hAt(i0+k,j0+GT)<h0){ flat=false; break; }
  const PP=[], CC=[];
  const v=(x,y,z,s)=>{ PP.push(x,y,z); CC.push(s,s,s); };
  const quad=(ax,ay,az,bx,by,bz,cx,cy,cz,dx,dy,dz,s)=>{ v(ax,ay,az,s); v(bx,by,bz,s); v(cx,cy,cz,s); v(ax,ay,az,s); v(cx,cy,cz,s); v(dx,dy,dz,s); };
  if(flat){ const x0=i0*HC, z0=j0*HC, x1=x0+GT*HC, z1=z0+GT*HC, s=shadeTop(h0,false); quad(x0,h0,z0,x0,h0,z1,x1,h0,z1,x1,h0,z0,s); }
  else for(let j=j0;j<j0+GT;j++) for(let i=i0;i<i0+GT;i++){ const h=HM[j*HN+i], x0=i*HC, z0=j*HC, x1=x0+HC, z1=z0+HC;
    quad(x0,h,z0,x0,h,z1,x1,h,z1,x1,h,z0,shadeTop(h,h<-0.25&&inWater(x0+HC/2,z0+HC/2)));
    let n=hAt(i+1,j); if(n<h) quad(x1,h,z0,x1,h,z1,x1,n,z1,x1,n,z0,0.7);
    n=hAt(i-1,j); if(n<h) quad(x0,h,z0,x0,n,z0,x0,n,z1,x0,h,z1,0.6);
    n=hAt(i,j+1); if(n<h) quad(x0,h,z1,x0,n,z1,x1,n,z1,x1,h,z1,0.84);
    n=hAt(i,j-1); if(n<h) quad(x0,h,z0,x1,h,z0,x1,n,z0,x0,n,z0,0.52); }
  const pos=new Float32Array(PP), uv=new Float32Array(PP.length/3*2); for(let k=0,q=0;k<PP.length;k+=3,q+=2){ uv[q]=PP[k]/WX; uv[q+1]=1-PP[k+2]/WZ; }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(CC),3)); g.setAttribute('uv',new THREE.BufferAttribute(uv,2)); g.computeBoundingSphere();
  const id=tj*GTN+ti; let m=GTILE[id]; if(m){ m.geometry.dispose(); m.geometry=g; } else { m=new THREE.Mesh(g,groundMat); GTILE[id]=m; ground.add(m); }
  if(REALSH){ if(m.userData.sh) m.userData.sh.geometry=g; else { const sh=new THREE.Mesh(g,SHR); sh.receiveShadow=true; sh.renderOrder=1; m.add(sh); m.userData.sh=sh; } } else if(m.userData.sh){ m.remove(m.userData.sh); m.userData.sh=null; } }
function hmUpdate(i0,j0,i1,j1){ const a=Math.max(0,Math.floor((i0-1)/GT)), b=Math.min(GTN-1,Math.floor((i1+1)/GT)), c0=Math.max(0,Math.floor((j0-1)/GT)), c1=Math.min(GTN-1,Math.floor((j1+1)/GT));
  for(let tj=c0;tj<=c1;tj++) for(let ti=a;ti<=b;ti++) buildGTile(ti,tj); }
function groundColorAt(x,z){ try{ const d=gx.getImageData(clamp(Math.floor(x*GS),0,GC.width-1),clamp(Math.floor(z*GS),0,GC.height-1),1,1).data; return [d[0]/255,d[1]/255,d[2]/255]; }catch(e){ return P.road; } }
function craterAt(x,z,r,depth){ if(inWater(x,z)||LOC.safe) return; const R2=r*1.45, seed=(x*13.7+z*7.1)|0, gc=groundColorAt(x,z);
  const i0=Math.max(0,Math.floor((x-R2)/HC)), i1=Math.min(HN-1,Math.floor((x+R2)/HC)), j0=Math.max(0,Math.floor((z-R2)/HC)), j1=Math.min(HN-1,Math.floor((z+R2)/HC));
  for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const d=Math.hypot((i+0.5)*HC-x,(j+0.5)*HC-z)/r, k=j*HN+i;
    if(d<1){ const nv=HM[k]-depth*(1-d*d)*(0.7+0.6*hash3(i,j,seed)); HM[k]=Math.max(-0.56,Math.floor(nv/HQS+0.25)*HQS); }
    else if(d<1.45&&hash3(i,j,seed+5)<0.5) HM[k]=Math.min(0.24,Math.round((HM[k]+depth*0.6*(1-(d-1)/0.45))/HQS)*HQS); }
  hmUpdate(i0,j0,i1,j1);
  const n=Math.round(5+r*6);
  for(let k=0;k<n;k++){ const a=rnd()*TAU, rr=rnd()*r*0.7, s=2+rnd()*4.5, sh=0.6+rnd()*0.45;
    debSpawn(x+Math.cos(a)*rr,0.12,z+Math.sin(a)*rr,Math.cos(a)*s,3.5+rnd()*5.5,Math.sin(a)*s,gc[0]*sh,gc[1]*sh,gc[2]*sh,0.13+rnd()*0.17); } }
function initTerrain(){ HM.fill(0); if(LOC.terrain) LOC.terrain();
  for(const [x0,z0,x1,z1] of LOC.water){ for(let j=Math.max(0,Math.floor(z0/HC));j<Math.min(HN,Math.ceil(z1/HC));j++) for(let i=Math.max(0,Math.floor(x0/HC));i<Math.min(HN,Math.ceil(x1/HC));i++){
    const e=Math.min((i+0.5)*HC-x0,x1-(i+0.5)*HC,(j+0.5)*HC-z0,z1-(j+0.5)*HC); if(e<=0) continue; const k=j*HN+i; HM[k]=Math.min(HM[k],e<0.6?-0.32:-0.62); } }
  hmUpdate(0,0,HN-1,HN-1); }
const marks=[]; let groundDirty=0;
function R_(x,z,w,d){ gx.fillRect(x*GS,z*GS,w*GS,d*GS); }
function gtext(t,x,z,size,color,alpha){ gx.save(); gx.globalAlpha=alpha==null?0.5:alpha; gx.fillStyle=color; gx.font=`800 ${size*GS}px Unbounded, 'Noto Sans SC', 'Arial Black', sans-serif`; gx.textAlign='center'; gx.textBaseline='middle'; gx.fillText(t,x*GS,z*GS); gx.restore(); }
/* v24: roads are painted as sidewalk band + carriageway; at every crossing the crossing road is carried through the band,
   kerb highlights stop at the road they cross, dashes skip the junction box (an edge is "crossed" only if the other road runs past it) */
function crossOf(r){ return ROADS.filter(o=>o!==r&&o.v!==r.v&&o.a0<r.b1+2.5&&o.a1>r.b0-2.5&&o.b1>r.a0&&o.b0<r.a1); }
function crossEdge(r,e){ return ROADS.filter(o=>o!==r&&o.v!==r.v&&o.a0<e-0.05&&o.a1>e+0.05&&o.b1>r.a0&&o.b0<r.a1); }
function RA_(r,a0,a1,b0,b1){ if(a1<=a0||b1<=b0) return; if(r.v) R_(b0,a0,b1-b0,a1-a0); else R_(a0,b0,a1-a0,b1-b0); }
function cutSpans(a0,a1,holes){ let parts=[[a0,a1]]; for(const [h0,h1] of holes){ const nx=[]; for(const [p0,p1] of parts){ if(h1<=p0||h0>=p1){ nx.push([p0,p1]); continue; } if(h0>p0) nx.push([p0,h0]); if(h1<p1) nx.push([h1,p1]); } parts=nx; } return parts; }
function roadEdge(r,e,a0,a1,w0,w1){ a0=Math.max(a0,r.a0); a1=Math.min(a1,r.a1); if(a1<=a0) return; gx.fillStyle='rgba(255,255,255,0.12)'; if(e===r.b0) RA_(r,a0,a1,e-0.1,e+0.02); else RA_(r,a0,a1,e-0.02,e+0.1); }
function roadDash(s,r,a0,a1,skip){ if(!r.dash) return; gx.globalAlpha=0.6; gx.fillStyle=css(s.line); const c=(r.b0+r.b1)/2;
  for(let a=r.a0+1;a<r.a1-1;a+=3){ const e=a+1.6; if(e<=a0||a>=a1) continue; if(skip&&skip.some(o=>e>o.b0-0.4&&a<o.b1+0.4)) continue; RA_(r,Math.max(a,a0),Math.min(e,a1),c-0.1,c+0.1); } gx.globalAlpha=1; }
function street(s,v,b0,b1,a0,a1,dash){ const me={v,b0,b1,a0,a1,dash:!!dash}, perp=crossOf(me); ROADS.push(me);
  const ex0=ROADS.some(o=>o!==me&&o.v!==v&&Math.abs(o.b0-a0)<0.05&&o.a0<b1&&o.a1>b0)?2.5:0, ex1=ROADS.some(o=>o!==me&&o.v!==v&&Math.abs(o.b1-a1)<0.05&&o.a0<b1&&o.a1>b0)?2.5:0;
  gx.fillStyle=css(s.side); RA_(me,a0-ex0,a1+ex1,b0-2.5,b1+2.5);
  for(const o of perp){ const wa=Math.max(o.a0,b0-2.5), wb=Math.min(o.a1,b1+2.5); gx.fillStyle=css(s.road); RA_(o,wa,wb,Math.max(o.b0,a0),Math.min(o.b1,a1));
    for(const [p0,p1] of [[b0-2.5,b0],[b1,b1+2.5]]){ for(const e of [o.b0,o.b1]) if(e>=a0&&e<=a1) roadEdge(o,e,p0,p1); roadDash(s,o,p0,p1,null); } }
  gx.fillStyle=css(s.road); RA_(me,a0,a1,b0,b1);
  for(const e of [b0,b1]) for(const [p0,p1] of cutSpans(a0,a1,crossEdge(me,e).map(o=>[o.b0+0.11,o.b1-0.11]))) roadEdge(me,e,p0,p1);
  roadDash(s,me,a0,a1,perp); }
function streetH(s,z0,z1,x0,x1,dash){ street(s,false,z0,z1,x0,x1,dash); }
function streetV(s,x0,x1,z0,z1,dash){ street(s,true,x0,x1,z0,z1,dash); }
function zebraV(s,x,z0,z1){ gx.fillStyle=css(s.road); R_(x,z0,2.3,z1-z0); gx.globalAlpha=0.55; gx.fillStyle=css(s.line); for(let z=z0+0.4;z<z1-0.3;z+=1.0) R_(x,z,2.2,0.5); gx.globalAlpha=1; }
function zebraH(s,z,x0,x1){ gx.fillStyle=css(s.road); R_(x0,z,x1-x0,2.3); gx.globalAlpha=0.55; gx.fillStyle=css(s.line); for(let x=x0+0.4;x<x1-0.3;x+=1.0) R_(x,z,0.5,2.2); gx.globalAlpha=1; }
function paintIndustrial(s){ streetH(s,36,44,0,80,false); streetV(s,36,44,0,80,false); gx.fillStyle=css(s.road); R_(36,36,8,8);
  gx.globalAlpha=0.6; gx.fillStyle=css(s.line); for(let x=1;x<79;x+=3){ if(x>29&&x<50) continue; R_(x,39.9,1.6,0.2); } for(let z=1;z<79;z+=3){ if(z>29&&z<50) continue; R_(39.9,z,0.2,1.6); }
  gx.globalAlpha=1; zebraV(s,31,36,44); zebraV(s,47,36,44); zebraH(s,31,36,44); zebraH(s,47,36,44);
  gx.globalAlpha=0.35; gx.fillStyle=css(s.line); R_(53,36.6,24,0.15); R_(3,43.25,24,0.15); gx.globalAlpha=1;
  }
function paintCamp(s){ const conc=mix3(P.road,P.side,0.5);
  gx.fillStyle=cssA(conc,1); R_(35,0,10,80); R_(0,35,80,10); R_(8,24,14,11);
  gx.strokeStyle='rgba(255,255,255,0.07)'; gx.lineWidth=1; gx.beginPath(); for(let v=0;v<=80;v+=4){ gx.moveTo(35*GS,v*GS); gx.lineTo(45*GS,v*GS); gx.moveTo(v*GS,35*GS); gx.lineTo(v*GS,45*GS); } gx.stroke();
  gx.globalAlpha=0.55; gx.fillStyle=css(s.accent); for(let x=8.6;x<21.6;x+=1.2){ gx.beginPath(); gx.moveTo(x*GS,24*GS); gx.lineTo((x+0.6)*GS,24*GS); gx.lineTo((x+0.2)*GS,24.7*GS); gx.lineTo((x-0.4)*GS,24.7*GS); gx.fill(); } gx.globalAlpha=1;
  gx.globalAlpha=0.5; gx.fillStyle=css(s.accent); for(let x=61.2;x<70;x+=1.2){ gx.beginPath(); gx.moveTo(x*GS,32.6*GS); gx.lineTo((x+0.6)*GS,32.6*GS); gx.lineTo((x+0.2)*GS,33.2*GS); gx.lineTo((x-0.4)*GS,33.2*GS); gx.fill(); } gx.globalAlpha=1;
  gx.strokeStyle=cssA(P.line,0.45); gx.lineWidth=0.18*GS; gx.beginPath(); gx.arc(40*GS,40*GS,3.4*GS,0,TAU); gx.stroke();
  gx.fillStyle=cssA(P.accent,0.4); gx.beginPath(); for(let k=0;k<10;k++){ const a=-Math.PI/2+k*Math.PI/5, r=k%2?1.0:2.5; gx.lineTo((40+Math.cos(a)*r)*GS,(40+Math.sin(a)*r)*GS); } gx.fill();
  { const pc=mix3(P.road,P.side,0.62); gx.fillStyle=cssA(pc,1); R_(54.6,54.6,14.8,14.8); gx.fillStyle=cssA(P.dark,0.25); R_(54.6,69.2,14.8,0.25); R_(69.2,54.6,0.25,14.8);
    gx.strokeStyle='rgba(0,0,0,0.18)'; gx.lineWidth=0.06*GS; gx.beginPath(); for(let v=54.6;v<=69.4;v+=3.7){ gx.moveTo(v*GS,54.6*GS); gx.lineTo(v*GS,69.4*GS); gx.moveTo(54.6*GS,v*GS); gx.lineTo(69.4*GS,v*GS); } gx.stroke();
    gx.strokeStyle=cssA(P.accent,0.75); gx.lineWidth=0.3*GS; gx.strokeRect(55.2*GS,55.2*GS,13.6*GS,13.6*GS);
    gx.fillStyle=cssA(P.accent,0.7); for(const [cx,cz,sx,sz] of [[55.2,55.2,1,1],[68.8,55.2,-1,1],[55.2,68.8,1,-1],[68.8,68.8,-1,-1]]) for(let k=0;k<3;k++){ gx.beginPath(); gx.moveTo((cx+sx*k*0.7)*GS,cz*GS); gx.lineTo((cx+sx*(k*0.7+0.35))*GS,cz*GS); gx.lineTo(cx*GS,(cz+sz*(k*0.7+0.35))*GS); gx.lineTo(cx*GS,(cz+sz*k*0.7)*GS); gx.fill(); }
    gx.strokeStyle='rgba(255,255,255,0.75)'; gx.lineWidth=0.35*GS; gx.beginPath(); gx.arc(62*GS,62*GS,5.6*GS,0,TAU); gx.stroke(); gx.lineWidth=0.08*GS; gx.setLineDash([0.6*GS,0.4*GS]); gx.beginPath(); gx.arc(62*GS,62*GS,4.7*GS,0,TAU); gx.stroke(); gx.setLineDash([]);
    gtext('H',62,62,5.4,'rgba(255,255,255,0.85)',0.95); gx.fillStyle=cssA(P.accent,0.85); gx.font=`700 ${0.9*GS}px Unbounded, Arial Black, sans-serif`; gx.textAlign='center'; gx.textBaseline='middle'; gx.fillText('7',66.2,58);
    gx.fillStyle='rgba(255,255,255,0.6)'; gx.font=`600 ${0.55*GS}px 'IBM Plex Mono', monospace`; gx.fillText('MAX 12T',62,67.6); gx.fillText('VERTIPAD · 停机坪',62,56.4); }
  gx.fillStyle=cssA(P.line,0.35); for(let x=3;x<34;x+=6.5){ R_(x,50,0.15,10); R_(x,66,0.15,10); } paintCampRoutes(s);
 
 
  }
function drawGround(){ const s=PALETTES[PAL];
  const GW=GC.width; gx.fillStyle=css(s.ground); gx.fillRect(0,0,GW,GW);
  gx.strokeStyle='rgba(255,255,255,0.04)'; gx.lineWidth=1; gx.beginPath();
  for(let v=0;v<=WX;v+=2){ gx.moveTo(v*GS,0); gx.lineTo(v*GS,GW); gx.moveTo(0,v*GS); gx.lineTo(GW,v*GS); } gx.stroke();
  ROADS.length=0; paintLawns(); LOC.paint(s); paintRoadDetail(); paintFormwork(); paintFloors();
  gx.fillStyle=cssA(P.water,1); for(const r of LOC.water) R_(r[0],r[1],r[2]-r[0],r[3]-r[1]);
  for(const m of marks) drawMark(m); gtex.needsUpdate=true; buildCurbs(); }
/* ---- v23 road surface detail: manholes, patches, cracks, drains, lane arrows ---- */
function paintRoadDetail(){ const R=mulberry32(91+((LOC_ID||'').length*7)); gx.save();
  for(const r of ROADS){ const len=r.a1-r.a0, w=r.b1-r.b0; if(len<6) continue;
    for(let k=0;k<Math.floor(len/9);k++){ const a=r.a0+3+R()*(len-6), b=r.b0+0.8+R()*(w-1.6), x=r.v?b:a, z=r.v?a:b; const kind=R();
      if(kind<0.3){ gx.fillStyle='rgba(8,12,18,0.55)'; gx.beginPath(); gx.arc(x*GS,z*GS,0.38*GS,0,TAU); gx.fill(); gx.strokeStyle='rgba(160,170,180,0.25)'; gx.lineWidth=0.05*GS; gx.beginPath(); gx.arc(x*GS,z*GS,0.3*GS,0,TAU); gx.stroke(); for(let i=-1;i<=1;i++){ gx.beginPath(); gx.moveTo((x-0.26)*GS,(z+i*0.12)*GS); gx.lineTo((x+0.26)*GS,(z+i*0.12)*GS); gx.stroke(); } }
      else if(kind<0.6){ gx.fillStyle=R()<0.5?'rgba(0,0,0,0.12)':'rgba(255,255,255,0.04)'; const pw=1+R()*2, pd=0.8+R()*1.6; gx.fillRect((x-pw/2)*GS,(z-pd/2)*GS,pw*GS,pd*GS); }
      else { gx.strokeStyle='rgba(0,0,0,0.28)'; gx.lineWidth=0.05*GS; gx.beginPath(); gx.moveTo(x*GS,z*GS); let cx=x, cz=z; for(let i=0;i<5;i++){ cx+=(R()-0.5)*1.2; cz+=(R()-0.5)*1.2; gx.lineTo(cx*GS,cz*GS); } gx.stroke(); } }
    const XS=crossOf(r); gx.fillStyle='rgba(6,10,16,0.6)'; for(let a=r.a0+4;a<r.a1-2;a+=11){ if(XS.some(o=>a+0.9>o.b0-0.4&&a<o.b1+0.4)) continue; for(const b of [r.b0+0.15,r.b1-0.55]){ const x=r.v?b:a, z=r.v?a:b; gx.fillRect(x*GS,z*GS,(r.v?0.4:0.9)*GS,(r.v?0.9:0.4)*GS); } }
    if(len>20&&w>=6){ gx.fillStyle='rgba(255,255,255,0.22)'; for(const end of [0,1]){ const a=end?r.a1-5:r.a0+5, dir=end?1:-1; if(XS.some(o=>a>o.b0-2.4&&a<o.b1+2.4)) continue; for(const lane of [0.28,0.72]){ const b=r.b0+w*lane, x=r.v?b:a, z=r.v?a:b; const fx=r.v?0:dir*(lane<0.5?-1:1), fz=r.v?dir*(lane<0.5?-1:1):0; gx.beginPath(); gx.moveTo((x+fx*0.9)*GS,(z+fz*0.9)*GS); gx.lineTo((x-fz*0.45-fx*0.1)*GS,(z+fx*0.45-fz*0.1)*GS); gx.lineTo((x+fz*0.45-fx*0.1)*GS,(z-fx*0.45-fz*0.1)*GS); gx.fill(); gx.fillRect((x-(r.v?0.08:0.9*Math.abs(fx)))*GS,(z-(r.v?0.9*Math.abs(fz):0.08))*GS,(r.v?0.16:0.9)*GS,(r.v?0.9:0.16)*GS); } } } }
  gx.restore(); }
function drawMark(m){ if(m.t===0){ const g=gx.createRadialGradient(m.x*GS,m.z*GS,0,m.x*GS,m.z*GS,m.r*GS); g.addColorStop(0,'rgba(4,8,16,0.62)'); g.addColorStop(0.6,'rgba(4,8,16,0.32)'); g.addColorStop(1,'rgba(4,8,16,0)');
    gx.fillStyle=g; gx.beginPath(); gx.arc(m.x*GS,m.z*GS,m.r*GS,0,TAU); gx.fill(); }
  else { gx.fillStyle=`rgb(${m.c[0]*255|0},${m.c[1]*255|0},${m.c[2]*255|0})`; const s=Math.max(1.5,m.s*GS); gx.fillRect(m.x*GS-s/2,m.z*GS-s/2,s,s); } }
function addMark(m){ if(inWater(m.x,m.z)) return; marks.push(m); if(marks.length>1600) marks.splice(0,200); drawMark(m); groundDirty=1; }
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>{ if(grid) drawGround(); if(GAR.scene) garPalette(); });

/* ---------- lamps ---------- */
const poolGeo=new THREE.PlaneGeometry(1,1); poolGeo.rotateX(-Math.PI/2);

