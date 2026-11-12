/* ================= GARAGE ================= */
const GAR={open:false,scene:null,cam:null,model:null,turn:null,ang:0.75,hgt:3.6,dist:11,drag:null,idle:0,view:'mg',lamps:[]};
const SOLMAT={body:new THREE.MeshToonMaterial({color:0x111a24,gradientMap:gradTex}),army:new THREE.MeshToonMaterial({color:0x3a5246,gradientMap:gradTex}),skin:new THREE.MeshToonMaterial({color:0x2a2a30,gradientMap:gradTex})};
const SGEO={legs:new THREE.BoxGeometry(0.36,0.85,0.22),torso:new THREE.BoxGeometry(0.48,0.62,0.28),head:new THREE.SphereGeometry(0.13,10,8),helm:new THREE.SphereGeometry(0.165,10,6,0,TAU,0,Math.PI/2),arm:new THREE.BoxGeometry(0.12,0.6,0.12),rifle:new THREE.BoxGeometry(0.06,0.08,0.8)};
const SOLDIERS=[];
function makeSoldier(x,z,ry,parent){ const g=new THREE.Group(); const m=(geo,mat,px,py,pz,par)=>{ const o=new THREE.Mesh(geo,mat); o.position.set(px,py,pz); (par||g).add(o); return o; };
  const sL=makeLeg(g,0.1,0.86,SOLMAT.body,SOLMAT.body,0.44,0.4,0.16), sR=makeLeg(g,-0.1,0.86,SOLMAT.body,SOLMAT.body,0.44,0.4,0.16); const torso=new THREE.Group(); g.add(torso); m(SGEO.torso,SOLMAT.army,0,1.17,0,torso); m(SGEO.head,SOLMAT.skin,0,1.62,0); m(SGEO.helm,SOLMAT.army,0,1.66,0);
  const armL=new THREE.Group(); armL.position.set(0.3,1.44,0); g.add(armL); m(SGEO.arm,SOLMAT.army,0,-0.28,0,armL); armL.rotation.x=-0.5;
  const armR=new THREE.Group(); armR.position.set(-0.3,1.44,0); g.add(armR); m(SGEO.arm,SOLMAT.army,0,-0.28,0,armR);
  const rf=m(SGEO.rifle,SOLMAT.body,0.12,1.1,0.22); rf.rotation.x=-0.9;
  g.position.set(x,0,z); g.rotation.y=ry; parent.add(g); return {g,armR,base:ry,ph:rnd()*TAU,x,z,L:{hipL:sL.hip,hipR:sR.hip,kneeL:sL.knee,kneeR:sR.knee},amp:0}; }
function garInit(){ const s=new THREE.Scene(); GAR.scene=s; GAR.cam=new THREE.PerspectiveCamera(34,1,0.1,200);
  GAR.hemi=new THREE.HemisphereLight(0xffffff,0x000000,0.62); s.add(GAR.hemi);
  GAR.key=new THREE.DirectionalLight(0xffffff,0.62); GAR.key.position.set(4,7,5); s.add(GAR.key);
  GAR.rim=new THREE.DirectionalLight(0xffffff,0.65); GAR.rim.position.set(-5,4,-6); s.add(GAR.rim);
  GAR.roomMat=new THREE.MeshLambertMaterial({color:0xffffff,side:THREE.BackSide}); const room=new THREE.Mesh(new THREE.BoxGeometry(26,12,36),GAR.roomMat); room.position.set(0,6,0); s.add(room);
  const fc=document.createElement('canvas'); fc.width=fc.height=1024; GAR.floorCv=fc; GAR.floorTex=new THREE.CanvasTexture(fc);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(26,36),new THREE.MeshBasicMaterial({map:GAR.floorTex})); floor.rotation.x=-Math.PI/2; floor.position.set(0,0.002,0); s.add(floor);
  GAR.ribMat=new THREE.MeshLambertMaterial({color:0x222b36}); const ribG=new THREE.TorusGeometry(12.2,0.22,6,32,Math.PI);
  for(const z of [-15,-9,-3,3,9,15]){ const rb=new THREE.Mesh(ribG,GAR.ribMat); rb.position.set(0,0,z); rb.scale.y=0.92; s.add(rb); }
  GAR.doorMat=new THREE.MeshBasicMaterial({color:0x1d5c99}); const door=new THREE.Mesh(new THREE.PlaneGeometry(11,7.4),GAR.doorMat); door.position.set(0,3.7,-17.9); s.add(door);
  GAR.silMat=new THREE.MeshBasicMaterial({color:0x0f1726});
  for(const [x,w,h] of [[-4.2,2.4,1.6],[-1.4,2.8,2.3],[2.4,3.4,1.4],[4.6,1.4,2.8]]){ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),GAR.silMat); m.position.set(x,h/2,-17.85); s.add(m); }
  GAR.winMat=new THREE.MeshBasicMaterial({color:0xffc94a}); for(const [x,y] of [[-1.7,1.4],[-1.0,1.4],[4.5,2.1],[2.0,0.8],[-4.6,0.9]]){ const m=new THREE.Mesh(new THREE.PlaneGeometry(0.34,0.26),GAR.winMat); m.position.set(x,y,-17.8); s.add(m); }
  const moon=new THREE.Mesh(new THREE.CircleGeometry(0.55,24),new THREE.MeshBasicMaterial({color:0xf4f1ea})); moon.position.set(3.2,5.6,-17.85); s.add(moon);
  GAR.lampMat=new THREE.MeshBasicMaterial({color:0xfff2d2});
  for(const [x,z] of [[-4,-3],[4,-3],[0,4.5],[-4,9],[4,9]]){ const c_=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,4,4),GAR.ribMat); c_.position.set(x,8.2,z); s.add(c_);
    const shade=new THREE.Mesh(new THREE.ConeGeometry(0.55,0.4,16,1,true),GAR.ribMat); shade.position.set(x,6.1,z); s.add(shade);
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(0.16,10,8),GAR.lampMat); bulb.position.set(x,5.92,z); s.add(bulb);
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX_R,color:0xffc94a,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0.55})); halo.position.set(x,5.9,z); halo.scale.setScalar(2.2); s.add(halo);
    const pool=new THREE.Mesh(poolGeo,new THREE.MeshBasicMaterial({map:TEX_SOFT,color:0xffc94a,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0.22})); pool.position.set(x,0.01,z); pool.scale.setScalar(7); s.add(pool);
    GAR.lamps.push(halo,pool); }
  GAR.propMat=new THREE.MeshToonMaterial({color:0x2b3a46,gradientMap:gradTex}); GAR.propMat2=new THREE.MeshToonMaterial({color:0x7a383d,gradientMap:gradTex});
  const pb=(w,h,d,x,y,z,m)=>{ const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m||GAR.propMat); o.position.set(x,y,z); s.add(o); return o; };
  pb(1.0,1.0,4.5,-9.5,0.5,-6); pb(0.1,2.6,4.5,-12.4,2.4,-6); for(let k=0;k<5;k++) pb(0.12,0.5,0.12,-12.3,1.8+(k%2)*0.6,-7.8+k*0.9);
  pb(1.4,1.2,1.4,9.6,0.6,-8); pb(1.0,0.9,1.0,9.8,1.65,-8); pb(1.2,0.8,1.2,8.2,0.4,-10);
  for(let k=0;k<4;k++){ const t=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,0.42,16),GAR.propMat2); t.position.set(10.5,0.21+k*0.44,-2.2); s.add(t); }
  GAR.mech=makeMechanic(-7.8,-3.5,0.9,s); GAR.mech.armR.rotation.x=-0.9; GAR.mech2=makeMechanic(8.2,-4.6,-0.7,s); garDeco(s);
  GAR.turn=new THREE.Group(); s.add(GAR.turn); GAR.lie=[makeLyingMech(GAR.turn,0),makeLyingMech(GAR.turn,Math.PI)];
  GAR.diskMat=new THREE.MeshToonMaterial({color:0x1e2832,gradientMap:gradTex}); const disk=new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.5,0.16,64),GAR.diskMat); disk.position.y=0.08; GAR.turn.add(disk);
  GAR.ringMat=new THREE.MeshBasicMaterial({color:0xffc94a}); const ringG=new THREE.Mesh(new THREE.TorusGeometry(3.45,0.035,6,96),GAR.ringMat); ringG.rotation.x=Math.PI/2; ringG.position.y=0.15; GAR.turn.add(ringG);
  for(let k=0;k<24;k++){ const a=k/24*TAU; const tick=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.02,0.3),GAR.ringMat); tick.position.set(Math.sin(a)*3.1,0.165,Math.cos(a)*3.1); tick.rotation.y=a; GAR.turn.add(tick); }
  garPalette(); }
/* garage mechanic-soldier: overalls, vest with pouches, helmet with goggles and headset, gloves, boots, slung rifle, wrench */
function makeMechanic(x,z,ry,parent){ const g=new THREE.Group(); const T=c=>new THREE.MeshToonMaterial({color:c,gradientMap:gradTex});
  const OV=T(0x3a5246), VS_=T(0x2b3a32), DK=T(0x15191d), SK=T(0x8a6a52), GL=T(0x5c4a36), MT=T(0x6b7480), OR=T(0xf0a030), GG=new THREE.MeshBasicMaterial({color:0x8fe8ff});
  const m=(geo,mat,px,py,pz,par,ol)=>{ const o=new THREE.Mesh(geo,mat); o.position.set(px,py,pz); (par||g).add(o); if(ol){ const q=new THREE.Mesh(geo,outlineMat); q.scale.setScalar(1.06); o.add(q); } return o; };
  const B=(w,h,d)=>new THREE.BoxGeometry(w,h,d), Sp=(r,a,b)=>new THREE.SphereGeometry(r,a||10,b||8);
  const sL=makeLeg(g,0.11,0.86,OV,DK,0.44,0.4,0.16), sR=makeLeg(g,-0.11,0.86,OV,DK,0.44,0.4,0.16);
  for(const lg of [sL,sR]){ m(B(0.17,0.12,0.06),DK,0,-0.44,0.09,lg.knee); m(B(0.2,0.12,0.28),DK,0,-0.36,0.05,lg.knee); }
  const torso=new THREE.Group(); g.add(torso);
  m(B(0.46,0.6,0.26),OV,0,1.17,0,torso,true); m(B(0.5,0.42,0.32),VS_,0,1.26,0,torso,true); m(B(0.48,0.07,0.3),DK,0,0.92,0,torso);
  for(const px of [-0.15,0,0.15]) m(B(0.12,0.14,0.07),VS_,px,1.18,0.18,torso,true); m(B(0.1,0.16,0.08),DK,0.18,0.92,0.14,torso); m(B(0.08,0.12,0.06),OR,-0.16,0.94,0.15,torso);
  m(B(0.08,0.05,0.01),OR,0.15,1.38,0.165,torso); m(B(0.1,0.1,0.02),OR,0.27,1.38,0,torso); m(B(0.03,0.05,0.04),GG,-0.14,1.4,0.17,torso);
  m(B(0.36,0.44,0.18),VS_,0,1.22,-0.24,torso,true); m(B(0.3,0.08,0.2),DK,0,1.45,-0.25,torso);
  const rf=new THREE.Group(); rf.position.set(0,1.2,-0.36); rf.rotation.z=0.8; g.add(rf); m(B(0.06,0.09,0.78),DK,0,0,0,rf); m(B(0.05,0.18,0.08),DK,0,-0.1,0.1,rf); m(B(0.03,0.03,0.3),MT,0,0.02,0.5,rf); rf.rotation.y=Math.PI/2;
  m(B(0.12,0.08,0.12),SK,0,1.52,0); const head=new THREE.Group(); head.position.set(0,1.56,0); g.add(head); const H=(geo,mat,px,py,pz,ol)=>m(geo,mat,px,py-1.56,pz,head,ol); H(Sp(0.13),SK,0,1.64,0,true); H(B(0.025,0.025,0.01),DK,0.05,1.66,0.125); H(B(0.025,0.025,0.01),DK,-0.05,1.66,0.125);
  H(new THREE.SphereGeometry(0.17,12,6,0,TAU,0,Math.PI/2),OV,0,1.67,0,true); H(B(0.36,0.03,0.38),OV,0,1.67,0.02);
  H(B(0.26,0.07,0.06),DK,0,1.74,0.14); for(const s_ of [-1,1]) H(new THREE.CylinderGeometry(0.045,0.045,0.03,10).rotateX(Math.PI/2),GG,s_*0.065,1.74,0.17);
  for(const s_ of [-1,1]) H(B(0.04,0.09,0.09),DK,s_*0.15,1.63,0); H(B(0.015,0.015,0.12),DK,-0.14,1.58,0.07);
  const armL=new THREE.Group(); armL.position.set(0.3,1.44,0); g.add(armL); m(B(0.13,0.34,0.13),OV,0,-0.15,0,armL,true); m(B(0.12,0.3,0.12),OV,0,-0.42,0,armL); m(B(0.14,0.12,0.14),GL,0,-0.62,0,armL); m(B(0.14,0.06,0.14),OR,0,-0.06,0,armL); armL.rotation.x=-0.25; armL.rotation.z=0.1;
  const armR=new THREE.Group(); armR.position.set(-0.3,1.44,0); g.add(armR); m(B(0.13,0.34,0.13),OV,0,-0.15,0,armR,true); m(B(0.12,0.3,0.12),OV,0,-0.42,0,armR); m(B(0.14,0.12,0.14),GL,0,-0.62,0,armR);
  const wr=new THREE.Group(); wr.position.set(0,-0.66,0.04); armR.add(wr); m(B(0.04,0.04,0.5),MT,0,0,0.2,wr); m(B(0.12,0.04,0.08),MT,0,0,0.47,wr); m(B(0.05,0.045,0.04),DK,0,0,0.52,wr);
  g.position.set(x,0,z); g.rotation.y=ry; parent.add(g); return {g,armR,armL,head,torso,base:ry,ph:rnd()*TAU,x,z,L:{hipL:sL.hip,hipR:sR.hip,kneeL:sL.knee,kneeR:sR.knee},amp:0,act:0,actT:2+rnd()*3,hy:0,hyT:0}; }
/* detailed garage props (medium/high quality) */
function garMk(par){ const b=(w,h,d,x,y,z,m,ry,rx,rz)=>{ const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); o.position.set(x,y,z); if(ry) o.rotation.y=ry; if(rx) o.rotation.x=rx; if(rz) o.rotation.z=rz; par.add(o); return o; };
  const cy=(r1,r2,h,x,y,z,m,n,rx,rz)=>{ const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,n||16),m); o.position.set(x,y,z); if(rx) o.rotation.x=rx; if(rz) o.rotation.z=rz; par.add(o); return o; };
  const tor=(r,t,x,y,z,m,rx,ry,arc)=>{ const o=new THREE.Mesh(new THREE.TorusGeometry(r,t,6,18,arc||TAU),m); o.position.set(x,y,z); if(rx) o.rotation.x=rx; if(ry) o.rotation.y=ry; par.add(o); return o; };
  const sp=(r,x,y,z,m,sy)=>{ const o=new THREE.Mesh(new THREE.SphereGeometry(r,14,10),m); o.position.set(x,y,z); if(sy) o.scale.y=sy; par.add(o); return o; }; return {b,cy,tor,sp}; }
function garBottle(par,C,x,y0,z,col){ const {b,cy,tor,sp}=garMk(par);
  cy(0.14,0.14,1.1,x,y0+0.6,z,col,18); sp(0.14,x,y0+1.15,z,col,0.7); cy(0.145,0.145,0.04,x,y0+0.08,z,C.dk,18); cy(0.145,0.145,0.06,x,y0+0.98,z,C.wh,18);
  cy(0.05,0.06,0.1,x,y0+1.27,z,C.mt,10); cy(0.075,0.075,0.04,x,y0+1.33,z,C.ye,10); b(0.12,0.03,0.03,x,y0+1.38,z,C.dk); cy(0.035,0.035,0.06,x+0.07,y0+1.29,z,C.mt,8,0,Math.PI/2);
  cy(0.06,0.06,0.03,x+0.12,y0+1.29,z+0.02,C.wh,12,Math.PI/2); b(0.006,0.04,0.004,x+0.12,y0+1.3,z+0.04,C.rd);
  tor(0.15,0.012,x,y0+0.85,z,C.mt,Math.PI/2); }
function garExt(par,C,x,z,face){ const {b,cy,tor,sp}=garMk(par), X=x+face*0.06;
  b(0.04,0.5,0.32,x-face*0.02,1.25,z,C.dk); b(0.05,0.06,0.3,x+face*0.02,1.12,z,C.mt); b(0.02,0.4,0.04,X-face*0.02,1.2,z+0.14,C.dk);
  cy(0.12,0.12,0.56,X+face*0.1,0.92,z,C.rd,18); sp(0.12,X+face*0.1,1.2,z,C.rd,0.6); cy(0.122,0.122,0.08,X+face*0.1,0.7,z,C.wh,18); cy(0.122,0.122,0.03,X+face*0.1,0.66,z,C.dk,18);
  cy(0.035,0.04,0.08,X+face*0.1,1.3,z,C.dk,10); b(0.18,0.03,0.04,X+face*0.13,1.36,z,C.dk,0,0,-face*0.3); b(0.16,0.025,0.035,X+face*0.12,1.32,z,C.mt,0,0,-face*0.2);
  cy(0.035,0.035,0.02,X+face*0.1,1.26,z+0.04,C.wh,10,Math.PI/2); tor(0.09,0.015,X+face*0.16,1.05,z+0.08,C.dk,0,Math.PI/2,Math.PI*1.3); cy(0.02,0.03,0.12,X+face*0.22,0.92,z+0.1,C.dk,8);
  b(0.02,0.36,0.36,x-face*0.03,1.9,z,C.rd); b(0.022,0.22,0.08,x-face*0.025,1.92,z,C.wh); b(0.022,0.08,0.22,x-face*0.025,1.92,z,C.wh); }
function garBench(par,C,x,z){ const {b,cy,tor}=garMk(par);
  b(3.2,0.08,1.1,x,1.02,z,C.ol); b(3.24,0.04,1.14,x,0.97,z,C.dk); b(3.2,0.3,0.06,x,1.2,z-0.52,C.mt);
  for(const sx of [-1,1]){ for(const sz of [-1,1]){ b(0.08,0.96,0.08,x+sx*1.52,0.48,z+sz*0.48,C.dk); cy(0.05,0.05,0.04,x+sx*1.52,0.02,z+sz*0.48,C.dk,8); } b(0.06,0.06,1.0,x+sx*1.52,0.2,z,C.dk); }
  b(3.04,0.06,1.0,x,0.3,z,C.dk); for(let k=0;k<4;k++){ b(1.0,0.2,0.9,x-0.9,0.82-k*0.22,z+0.05,k%2?C.rd:C.st); b(0.3,0.03,0.02,x-0.9,0.83-k*0.22,z+0.51,C.mt); }
  /* vise */
  b(0.22,0.12,0.3,x+1.15,1.12,z+0.32,C.bl); b(0.22,0.16,0.08,x+1.15,1.24,z+0.44,C.bl); b(0.22,0.16,0.08,x+1.15,1.24,z+0.26,C.bl); cy(0.02,0.02,0.36,x+1.15,1.22,z+0.62,C.mt,8,Math.PI/2); b(0.2,0.03,0.03,x+1.15,1.22,z+0.8,C.mt);
  /* tools on the bench */
  b(0.04,0.03,0.36,x+0.3,1.08,z+0.1,C.mt,0.4); b(0.1,0.03,0.08,x+0.37,1.08,z+0.26,C.mt,0.4); b(0.05,0.05,0.24,x-0.1,1.08,z+0.2,C.ye,-0.3); b(0.12,0.08,0.06,x-0.15,1.1,z+0.06,C.mt,-0.3);
  b(0.3,0.14,0.2,x+0.65,1.13,z-0.2,C.rd); b(0.3,0.02,0.2,x+0.65,1.21,z-0.2,C.dk); cy(0.05,0.05,0.1,x-0.5,1.11,z-0.1,C.wh,10); cy(0.05,0.05,0.12,x-0.38,1.12,z-0.12,C.ye,10);
  b(0.4,0.02,0.3,x+0.05,1.07,z-0.15,C.wh,0.15); for(let k=0;k<5;k++) cy(0.012,0.012,0.04,x-1.3+k*0.08,1.08,z+0.3,C.mt,6);
  /* lamp on an arm */
  cy(0.06,0.08,0.04,x-1.35,1.08,z-0.35,C.dk,12); b(0.03,0.6,0.03,x-1.35,1.38,z-0.35,C.dk,0,0,0.3); b(0.03,0.5,0.03,x-1.2,1.78,z-0.3,C.dk,0,0,-0.8); const sh=cy(0.04,0.13,0.14,x-0.95,1.86,z-0.28,C.ye,14,0,0.6);
  const bulb=new THREE.Mesh(new THREE.CircleGeometry(0.11,14),GAR.lampMat); bulb.rotation.x=Math.PI/2; bulb.position.set(x-0.93,1.8,z-0.28); par.add(bulb); }
function garEngine(par,C,x,z){ const {b,cy,tor}=garMk(par);
  /* stand on casters */
  b(1.3,0.06,0.08,x,0.12,z-0.4,C.ye); b(1.3,0.06,0.08,x,0.12,z+0.4,C.ye); b(0.08,0.06,0.88,x-0.6,0.12,z,C.ye); for(const sx of [-1,1]) for(const sz of [-1,1]){ cy(0.05,0.05,0.04,x+sx*0.6,0.05,z+sz*0.4,C.dk,10,Math.PI/2); }
  b(0.1,0.85,0.1,x-0.6,0.55,z,C.ye); b(0.3,0.06,0.06,x-0.48,0.95,z,C.ye); cy(0.12,0.12,0.06,x-0.36,1.0,z,C.dk,14,0,Math.PI/2);
  /* block, heads, pan */
  b(1.0,0.5,0.56,x+0.18,1.02,z,C.mt); b(1.0,0.12,0.6,x+0.18,0.74,z,C.dk); for(const sz of [-1,1]){ const hd=b(1.0,0.16,0.26,x+0.18,1.32,z+sz*0.2,C.rd); hd.rotation.x=sz*0.35; b(0.94,0.05,0.2,x+0.18,1.41,z+sz*0.24,C.dk).rotation.x=sz*0.35; }
  for(let k=0;k<4;k++){ cy(0.035,0.035,0.18,x-0.18+k*0.24,1.47,z,C.mt,8); b(0.05,0.06,0.3,x-0.18+k*0.24,1.38,z,C.dk); }
  b(0.9,0.1,0.14,x+0.18,1.52,z,C.mt); cy(0.08,0.08,0.18,x+0.7,1.52,z,C.dk,12,0,Math.PI/2);
  /* front pulleys + belt */
  for(const [py,r] of [[0.88,0.14],[1.2,0.09],[1.06,0.07]]) cy(r,r,0.06,x+0.72,py,z+(r<0.1?0.12:0),C.dk,16,0,Math.PI/2); tor(0.2,0.015,x+0.76,1.03,z+0.04,C.dk,0,Math.PI/2);
  /* exhaust manifolds, hoses, sensors */
  for(const sz of [-1,1]) for(let k=0;k<4;k++){ cy(0.03,0.03,0.18,x-0.18+k*0.24,1.12,z+sz*0.35,C.wh,8,Math.PI/2); } for(const sz of [-1,1]) cy(0.04,0.04,1.0,x+0.18,1.12,z+sz*0.45,C.wh,8,0,Math.PI/2);
  tor(0.18,0.025,x+0.5,1.25,z+0.3,C.bl,0,0,Math.PI); for(let k=0;k<3;k++) b(0.04,0.05,0.04,x-0.1+k*0.3,0.96,z+0.29,C.ye);
  /* drip tray */
  b(1.4,0.03,0.9,x+0.1,0.015,z,C.dk); }
/* idle standing: look around, scratch the head, shift weight */
function mechIdle(m,dt,t){ m.actT-=dt; if(m.actT<=0){ m.act=rnd()<0.4?1:rnd()<0.6?2:0; m.actT=m.act===1?2.2:3+rnd()*3; m.hyT=(rnd()-0.5)*1.4; }
  m.hy+=(m.hyT-m.hy)*Math.min(1,dt*2.5); m.head.rotation.y=m.hy; m.head.rotation.x=Math.sin(t*0.7+m.ph)*0.06;
  const sw=m.act===2?Math.sin(t*1.6+m.ph):Math.sin(t*0.5+m.ph)*0.3; m.g.position.x=m.x+Math.cos(m.base)*sw*0.04; m.g.rotation.z=sw*0.03; m.L.hipL.rotation.z=-sw*0.05; m.L.hipR.rotation.z=-sw*0.05; m.L.kneeL.rotation.x=Math.max(0,sw)*0.18; m.L.kneeR.rotation.x=Math.max(0,-sw)*0.18;
  const sc=m.act===1?Math.min(1,(2.2-m.actT)*4,m.actT*4):0; m.armL.rotation.x=-0.25-sc*2.55; m.armL.rotation.z=0.1-sc*0.55+sc*Math.sin(t*14)*0.12; if(m.act===1) m.head.rotation.x=0.12*sc;
  m.armR.rotation.x=-0.9+Math.sin(t*0.9+m.ph)*0.1; }
/* lying on the back with the upper body under the tank, knees up, hands working on the belly */
function makeLyingMech(par,ry){ const g=new THREE.Group(); const T=c=>new THREE.MeshToonMaterial({color:c,gradientMap:gradTex});
  const OV=T(0x3a5246), DK=T(0x15191d), SK=T(0x8a6a52), GL=T(0x5c4a36), MT=T(0x6b7480), OR=T(0xf0a030), GG=new THREE.MeshBasicMaterial({color:0x8fe8ff});
  const m=(geo,mat,px,py,pz,pr,ol)=>{ const o=new THREE.Mesh(geo,mat); o.position.set(px,py,pz); (pr||g).add(o); if(ol){ const q=new THREE.Mesh(geo,outlineMat); q.scale.setScalar(1.07); o.add(q); } return o; }, B=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
  /* torso along +z (head toward the tank centre at z=0) */
  m(B(0.44,0.2,0.62),OV,0,0.27,1.5,g,true); m(B(0.48,0.06,0.5),DK,0,0.39,1.52); m(B(0.46,0.07,0.08),DK,0,0.27,1.83); m(B(0.1,0.05,0.12),OR,0.14,0.38,1.36);
  m(new THREE.SphereGeometry(0.13,10,8),SK,0,0.3,1.08,g,true); const hm=m(new THREE.SphereGeometry(0.16,10,6,0,TAU,0,Math.PI/2),OV,0,0.3,1.04); hm.rotation.x=-Math.PI/2; m(B(0.24,0.05,0.04),DK,0,0.42,1.12); for(const s_ of [-1,1]) m(new THREE.CylinderGeometry(0.035,0.035,0.03,8),GG,s_*0.06,0.44,1.12);
  const lamp=m(B(0.06,0.05,0.05),DK,0.1,0.4,1.0); m(B(0.04,0.03,0.01),GG,0.1,0.43,1.0);
  /* legs: thighs up from the hips, shins down to the feet (knees bent) */
  for(const s_ of [-1,1]){ const th=m(B(0.15,0.48,0.16),OV,s_*0.12,0.42,2.0,g,true); th.rotation.x=0.75; const sh=m(B(0.14,0.46,0.14),OV,s_*0.13,0.36,2.42,g,true); sh.rotation.x=-0.55; m(B(0.16,0.12,0.28),DK,s_*0.13,0.08,2.6); m(B(0.17,0.12,0.06),DK,s_*0.12,0.62,2.2); }
  /* arms reach up to the belly and work */
  const arms=[]; for(const s_ of [-1,1]){ const sh=new THREE.Group(); sh.position.set(s_*0.28,0.3,1.3); g.add(sh); m(B(0.12,0.4,0.12),OV,0,0.18,0,sh,true); m(B(0.13,0.12,0.13),GL,0,0.42,0,sh); arms.push(sh); }
  const wr=new THREE.Group(); wr.position.set(0,0.46,0); arms[0].add(wr); m(B(0.04,0.04,0.42),MT,0,0,0.12,wr); m(B(0.11,0.04,0.07),MT,0,0,0.34,wr);
  const tb=m(B(0.34,0.16,0.22),T(0x7a383d),-0.42,0.08,1.9); m(B(0.36,0.03,0.24),DK,-0.42,0.17,1.9); m(B(0.05,0.03,0.3),MT,0.4,0.03,1.7);
  g.rotation.y=ry; par.add(g); return {g,arms,ph:rnd()*TAU}; }
function lyingUpdate(L,t){ const a=L.arms; a[0].rotation.x=-0.25+Math.sin(t*5.2+L.ph)*0.35; a[0].rotation.z=0.2+Math.sin(t*2.7+L.ph)*0.15; a[1].rotation.x=-0.4+Math.sin(t*3.1+L.ph+1)*0.25; a[1].rotation.z=-0.25+Math.cos(t*2.2+L.ph)*0.2; }
/* garage / motor-pool interior details: common hall dressing + a set per mode */
function garDeco(s){ const T=c=>new THREE.MeshToonMaterial({color:c,gradientMap:gradTex});
  const C={st:T(0x2b3a46),dk:T(0x161c22),mt:T(0x5a6470),rd:T(0x7a383d),ye:T(0xf0b030),gr:T(0x3a5246),ol:T(0x6e6a4c),tr:T(0x232628),cn:T(0xff7a1a),wh:T(0xd8d4c8),bl:T(0x2f5d7a)};
  const GW=GAR.winMat, LG=GAR.lampMat;
  const mk=(par)=>{ const b=(w,h,d,x,y,z,m,ry)=>{ const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m||C.st); o.position.set(x,y,z); if(ry) o.rotation.y=ry; par.add(o); return o; };
    const cy=(r1,r2,h,x,y,z,m,n,rx,rz)=>{ const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,n||14),m||C.st); o.position.set(x,y,z); if(rx) o.rotation.x=rx; if(rz) o.rotation.z=rz; par.add(o); return o; }; return {b,cy}; };
  const G0=new THREE.Group(), GG=new THREE.Group(), GP=new THREE.Group(); s.add(G0,GG,GP); GAR.dG=GG; GAR.dP=GP;
  const L0=new THREE.Group(), LG_=new THREE.Group(), H0=new THREE.Group(), HG=new THREE.Group(); G0.add(L0,H0); GG.add(LG_,HG); GAR.lo=[L0,LG_]; GAR.hi=[H0,HG];
  { const {b,cy}=mk(G0);
    /* side wall pillars with hazard bands, light strips, cable trays */
    for(const sx of [-1,1]) for(const z of [-15,-9,-3,3,9]){ b(0.5,9,0.5,sx*12.7,4.5,z,C.st); for(let k=0;k<4;k++) b(0.52,0.18,0.52,sx*12.7,0.3+k*0.36,z,k%2?C.dk:C.ye); b(0.06,1.6,0.08,sx*12.42,5.4,z+3,GW); }
    for(const sx of [-1,1]){ b(0.3,0.12,34,sx*12.3,7.4,0,C.dk); for(let k=0;k<3;k++) cy(0.035,0.035,34,sx*12.3,7.5+k*0.05,0,[C.rd,C.bl,C.ye][k],6,Math.PI/2); }
    /* ceiling ducts with fans */
    for(const sx of [-1,1]){ cy(0.45,0.45,34,sx*7.2,10.2,0,C.mt,12,Math.PI/2); for(const z of [-12,0,12]){ cy(0.55,0.55,0.2,sx*7.2,10.2,z,C.dk,12,Math.PI/2); cy(0.3,0.3,0.4,sx*7.2,9.6,z,C.dk,10); } }
    /* gantry crane: rails, bridge, hoist with chain and hook */
    for(const sx of [-1,1]) b(0.3,0.35,34,sx*5.2,9.0,0,C.ye); b(10.8,0.45,0.5,0,8.7,-1.2,C.ye); for(let k=0;k<9;k++) b(0.32,0.46,0.06,-4.8+k*1.2,8.7,-1.2,C.dk);
    b(0.8,0.6,0.7,-1.6,8.3,-1.2,C.dk); for(let k=0;k<10;k++) b(0.05,0.12,0.03,-1.6,7.9-k*0.13,-1.2,C.mt); const hk=new THREE.Mesh(new THREE.TorusGeometry(0.12,0.035,6,12,Math.PI*1.4),C.mt); hk.position.set(-1.6,6.5,-1.2); G0.add(hk);
    /* back wall: door frame with warning lights, signage */
    b(11.8,0.4,0.3,0,7.6,-17.7,C.dk); for(const sx of [-1,1]){ b(0.4,7.6,0.3,sx*5.7,3.8,-17.7,C.dk); for(let k=0;k<8;k++) b(0.42,0.45,0.32,sx*5.7,0.3+k*0.9,-17.7,k%2?C.dk:C.ye); cy(0.16,0.16,0.18,sx*5.7,8.0,-17.55,LG,10,Math.PI/2); }
    const sg=document.createElement('canvas'); sg.width=512; sg.height=128; const sc=sg.getContext('2d'); sc.fillStyle='#10161c'; sc.fillRect(0,0,512,128); sc.strokeStyle='#f0b030'; sc.lineWidth=6; sc.strokeRect(6,6,500,116); sc.fillStyle='#f0b030'; sc.font='bold 64px "Noto Sans SC", sans-serif'; sc.textAlign='center'; sc.textBaseline='middle'; sc.fillText('安全第一 · 7',256,66);
    const sp=new THREE.Mesh(new THREE.PlaneGeometry(4,1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(sg)})); sp.position.set(0,9.0,-17.82); G0.add(sp);
    /* floor drains, fire extinguishers, emergency panel */
    for(const z of [-12,6]) b(2.2,0.02,0.4,0,0.012,z,C.dk); { const L=mk(L0); for(const [x,z] of [[-12.3,-1.2],[12.3,4.5]]){ L.cy(0.13,0.13,0.55,x,0.6,z,C.rd,10); L.b(0.3,0.5,0.06,x,1.3,z+(x<0?0.01:0),C.wh); } }
    for(const [x,z] of [[-12.3,-1.2],[12.3,4.5]]) garExt(H0,C,x,z,x<0?1:-1);
    b(0.08,1.1,0.8,12.55,1.6,-12,C.dk); b(0.02,0.18,0.5,12.5,1.95,-12,GW); for(let k=0;k<3;k++) b(0.03,0.08,0.08,12.5,1.5,-12.2+k*0.2,[C.rd,C.ye,C.gr][k]); }
  /* ---- garage set: workshop ---- */
  { const {b,cy}=mk(GG);
    /* workbench with vise, tools, lamp; pegboard with tools */
    { const L=mk(LG_); L.b(3.2,0.12,1.1,-10.8,1.0,-11.6,C.mt); for(const sx of [-1,1]) for(const sz of [-1,1]) L.b(0.1,1.0,0.1,-10.8+sx*1.5,0.5,-11.6+sz*0.48,C.dk); L.b(3.0,0.08,1.0,-10.8,0.35,-11.6,C.dk);
    L.b(0.3,0.22,0.24,-9.6,1.18,-11.4,C.bl); L.b(0.06,0.08,0.4,-9.6,1.2,-11.15,C.mt); L.b(0.5,0.08,0.3,-11.4,1.1,-11.7,C.rd); L.b(0.06,0.04,0.4,-10.5,1.08,-11.5,C.mt); }
    garBench(HG,C,-10.8,-11.6);
    cy(0.03,0.03,0.6,-11.9,1.35,-11.9,C.dk,6); b(0.25,0.1,0.18,-11.75,1.62,-11.75,C.dk); b(0.18,0.03,0.12,-11.7,1.56,-11.7,LG);
    b(3.2,1.8,0.06,-10.8,2.2,-12.25,C.st); for(let i=0;i<12;i++) for(let j=0;j<5;j++) b(0.03,0.03,0.02,-12.2+i*0.26,1.45+j*0.36,-12.2,C.dk);
    for(const [x,y,h,c] of [[-12,2.4,0.6,C.mt],[-11.6,2.6,0.4,C.rd],[-11.2,2.3,0.7,C.mt],[-10.6,2.5,0.5,C.ye],[-10.1,2.4,0.55,C.mt],[-9.6,2.6,0.35,C.bl]]) b(0.06,h,0.04,x,y,-12.18,c);
    /* welding cart with two gas bottles and hoses */
    b(0.8,0.7,0.6,-6.2,0.5,-13.2,C.bl); for(const sx of [-1,1]) cy(0.12,0.12,0.06,-6.2+sx*0.35,0.12,-12.9,C.dk,10,0,Math.PI/2); { const L=mk(LG_); L.cy(0.14,0.14,1.3,-6.45,1.3,-13.35,C.gr,10); L.cy(0.14,0.14,1.3,-5.95,1.3,-13.35,C.rd,10);
    L.cy(0.06,0.06,0.12,-6.45,2.0,-13.35,C.mt,8); L.cy(0.06,0.06,0.12,-5.95,2.0,-13.35,C.mt,8); } garBottle(HG,C,-6.45,0.65,-13.35,C.gr); garBottle(HG,C,-5.95,0.65,-13.35,C.rd); b(0.5,0.25,0.3,-6.2,0.98,-13.1,C.dk); b(0.12,0.08,0.02,-6.1,1.0,-12.94,GW);
    /* engine block on a stand + hydraulic jack + toolbox chest */
    { const L=mk(LG_); L.b(1.2,0.08,0.8,6.4,0.7,-12.4,C.dk); for(const sx of [-1,1]) L.b(0.08,0.7,0.08,6.4+sx*0.5,0.35,-12.4,C.dk); L.b(1.0,0.6,0.6,6.4,1.05,-12.4,C.mt); for(let k=0;k<4;k++) L.cy(0.08,0.08,0.18,6.05+k*0.23,1.44,-12.4,C.dk,8); L.b(0.9,0.12,0.12,6.4,1.0,-12.05,C.rd); L.cy(0.18,0.18,0.1,5.8,1.05,-12.4,C.dk,12,0,Math.PI/2); }
    garEngine(HG,C,6.4,-12.4);
    b(0.5,0.18,1.0,3.6,0.12,-13.2,C.rd); b(0.12,0.4,0.12,3.6,0.4,-13.5,C.mt); b(0.06,0.06,0.9,3.6,0.25,-12.5,C.dk,0.0);
    b(1.0,1.3,0.55,10.9,0.65,-12.6,C.rd); for(let k=0;k<5;k++){ b(0.92,0.02,0.02,10.9,0.25+k*0.24,-12.32,C.dk); b(0.3,0.03,0.03,10.9,0.36+k*0.24,-12.31,C.mt); } b(1.1,0.1,0.65,10.9,1.35,-12.6,C.dk);
    /* oil drums, jerry cans, ammo crates, cable reel, diagnostics terminal */
    for(const [x,z,c] of [[11.4,-15.6,C.bl],[10.6,-15.9,C.bl],[11.0,-15.0,C.rd]]){ cy(0.36,0.36,1.0,x,0.5,z,c,14); cy(0.37,0.37,0.04,x,0.75,z,C.dk,14); cy(0.37,0.37,0.04,x,0.25,z,C.dk,14); }
    for(let k=0;k<3;k++){ b(0.3,0.45,0.15,8.8+k*0.34,0.23,-15.8,C.gr); b(0.1,0.06,0.03,8.8+k*0.34,0.48,-15.8,C.dk); }
    for(let k=0;k<4;k++){ b(1.0,0.4,0.55,-11.4,0.2+(k%2)*0.42,-15.5+((k/2)|0)*0.62,C.ol); b(1.02,0.06,0.57,-11.4,0.32+(k%2)*0.42,-15.5+((k/2)|0)*0.62,C.dk); }
    cy(0.5,0.5,0.4,-8.6,0.5,-15.9,C.dk,14,Math.PI/2); cy(0.35,0.35,0.42,-8.6,0.5,-15.9,C.ye,14,Math.PI/2);
    b(0.6,1.5,0.4,8.4,0.75,-9.6,C.dk); b(0.5,0.4,0.03,8.4,1.25,-9.39,GW); for(let k=0;k<3;k++) b(0.08,0.05,0.03,8.25+k*0.15,0.85,-9.39,[C.rd,C.ye,C.gr][k]); cy(0.03,0.03,1.8,8.4,0.6,-8.6,C.dk,6,Math.PI/2); }
  /* ---- motor-pool set: depot ---- */
  { const {b,cy}=mk(GP);
    /* fuel pump with hose and nozzle, price/fuel display */
    b(0.8,1.6,0.6,-10.6,0.8,-10.2,C.rd); b(0.82,0.3,0.62,-10.6,1.5,-10.2,C.dk); b(0.5,0.22,0.02,-10.6,1.5,-9.88,GW); b(0.2,0.3,0.15,-10.15,1.0,-10.2,C.dk); for(let k=0;k<6;k++) cy(0.035,0.035,0.2,-10.0,0.95-k*0.14,-10.0+k*0.08,C.dk,6);
    b(1.6,0.12,1.2,-10.6,0.06,-10.2,C.ye); for(const sx of [-1,1]) cy(0.1,0.1,0.9,-10.6+sx*1.0,0.45,-9.2,C.ye,8);
    /* barrier arm */
    b(0.4,1.0,0.4,7.0,0.5,-14.6,C.dk); const arm=b(5.0,0.14,0.14,9.6,0.95,-14.6,C.wh); for(let k=0;k<5;k++) b(0.5,0.15,0.15,7.6+k*1.0,0.95,-14.6,C.rd); cy(0.1,0.1,0.12,7.0,1.08,-14.6,LG,8);
    /* traffic cones */
    for(const [x,z] of [[-6,-14],[-4.8,-14.4],[5.2,-11],[6.2,-10.4],[-7.6,-6.2]]){ cy(0.04,0.22,0.6,x,0.32,z,C.cn,10); cy(0.15,0.17,0.07,x,0.3,z,C.wh,10); b(0.5,0.04,0.5,x,0.02,z,C.cn); }
    /* tarp-covered vehicle in bay P2 + wheel chocks */
    b(3.0,1.5,4.6,10.0,0.95,-8.6,C.gr); b(2.8,0.6,4.2,10.0,1.95,-8.9,C.gr); b(1.6,0.4,1.6,10.0,2.4,-9.4,C.gr); for(const sx of [-1,1]) for(const z of [-10.4,-6.8]) cy(0.5,0.5,0.3,10.0+sx*1.45,0.5,z,C.tr,14,0,Math.PI/2);
    for(let k=0;k<6;k++) b(3.06,0.04,0.05,10.0,0.4+k*0.3,-6.28,C.dk); for(let k=0;k<4;k++) b(0.05,0.9,0.05,8.5+k*1.0,1.5,-6.3,C.ye);
    /* spare wheels rack, armour plates, tool crates */
    for(let k=0;k<4;k++) cy(0.55,0.55,0.32,-11.6,0.6,-14.6+k*0.4,C.tr,14,Math.PI/2); b(0.08,1.3,1.8,-12.0,0.65,-14.0,C.dk); b(0.08,1.3,1.8,-11.2,0.65,-14.0,C.dk);
    for(let k=0;k<5;k++){ const pl=b(1.6,1.0,0.08,11.6,0.6,-15.6+k*0.14,C.ol); pl.rotation.x=-0.18; }
    for(let k=0;k<3;k++){ b(1.1,0.6,0.7,-3.6+k*1.2,0.3,-15.8,k===1?C.bl:C.ol); b(1.12,0.08,0.72,-3.6+k*1.2,0.5,-15.8,C.dk); b(0.3,0.1,0.02,-3.6+k*1.2,0.3,-15.44,C.ye); }
    /* wall board with silhouettes of the fleet */
    b(0.08,2.2,4.4,12.45,3.0,3.0,C.dk); for(let k=0;k<6;k++){ b(0.02,0.18,0.5,12.4,2.9,1.25+k*0.7,GW); cy(0.08,0.08,0.02,12.4,3.08,1.25+k*0.7,GW,8,0,Math.PI/2); b(0.02,0.06,0.3,12.4,2.5,1.25+k*0.7,C.wh); }
    /* drone service rack */
    b(1.6,0.1,1.2,-7.4,1.4,-12.6,C.dk); for(const sx of [-1,1]) for(const sz of [-1,1]) b(0.08,1.4,0.08,-7.4+sx*0.7,0.7,-12.6+sz*0.5,C.dk); const ds=new THREE.Mesh(new THREE.SphereGeometry(0.3,12,8),C.wh); ds.position.set(-7.4,1.75,-12.6); GP.add(ds); const rg=new THREE.Mesh(new THREE.TorusGeometry(0.44,0.05,6,20),C.dk); rg.rotation.x=Math.PI/2; rg.position.set(-7.4,1.75,-12.6); GP.add(rg); }
}
function garPalette(){ if(!GAR.scene) return; const s=PALETTES[PAL];
  GAR.scene.background=new THREE.Color().setRGB(...mix3(P.dark,P.bg,0.12));
  GAR.roomMat.color.setRGB(...mix3(P.mid,P.bg,0.2)); GAR.hemi.color.setRGB(...mix3(P.side,[1,1,1],0.5)); GAR.hemi.groundColor.setRGB(...P.dark);
  GAR.key.color.setRGB(...mix3(P.glow,[1,1,1],0.55)); GAR.rim.color.setRGB(...mix3(P.side,[1,1,1],0.35));
  GAR.doorMat.color.set(s.bg); GAR.silMat.color.set(s.dark); GAR.winMat.color.set(s.glow); GAR.ringMat.color.set(s.glow); GAR.lampMat.color.set(s.lamp);
  for(const l of GAR.lamps) l.material.color.set(s.glow);
  const g=GAR.floorCv.getContext('2d'); g.fillStyle=cssA(mix3(P.mid,P.dark,0.45),1); g.fillRect(0,0,1024,1024);
  g.strokeStyle='rgba(255,255,255,0.05)'; g.lineWidth=2; g.beginPath(); for(let v=0;v<=1024;v+=64){ g.moveTo(v,0); g.lineTo(v,1024); g.moveTo(0,v); g.lineTo(1024,v); } g.stroke();
  const sx=1024/26, sz=1024/36; g.save(); g.translate(512,512); g.scale(sx,sz); g.strokeStyle=cssA(P.accent,0.6); g.lineWidth=0.35; g.setLineDash([0.6,0.45]); g.beginPath(); g.arc(0,0,4.1,0,TAU); g.stroke(); g.restore();
  garFloorText(g,sx,sz); GAR.floorTex.needsUpdate=true; }
function garFloorText(g,sx,sz){ const nm=((CHASSIS[UP.tank]||CHASSIS.base).name||'').toUpperCase(), park=GAR.mode==='park';
  g.save(); g.translate(512,512+5.4*sz); g.scale(1,sz/sx); g.textAlign='center'; g.fillStyle=cssA(P.accent,0.5); let fs=34; g.font=`800 ${fs}px Unbounded, Arial Black, sans-serif`; while(g.measureText(nm).width>560&&fs>18){ fs-=2; g.font=`800 ${fs}px Unbounded, Arial Black, sans-serif`; } g.fillText(nm,0,0);
  g.fillStyle=cssA(P.accent,0.3); g.font='700 15px Unbounded, Arial Black, sans-serif'; g.fillText(park?'АВТОПАРК  ·  车队':'ГАРАЖ  ·  车库',0,30); g.restore();
  /* painted lanes, hazard edges and bay numbers */
  g.save(); g.translate(512,512); g.scale(sx,sz);
  g.fillStyle='rgba(255,201,74,0.16)'; for(let k=-12;k<12;k+=1.2){ g.beginPath(); g.moveTo(k,-17.6); g.lineTo(k+0.6,-17.6); g.lineTo(k+1.2,-16.6); g.lineTo(k+0.6,-16.6); g.closePath(); g.fill(); }
  g.strokeStyle='rgba(255,255,255,0.09)'; g.lineWidth=0.12; g.setLineDash([]);
  if(park){ for(const x of [-12.2,-7.8,7.8,12.2]){ g.beginPath(); g.moveTo(x,-14); g.lineTo(x,-2); g.stroke(); }
    g.fillStyle='rgba(255,255,255,0.12)'; g.font='bold 1.6px Arial, sans-serif'; g.textAlign='center'; g.fillText('P1',-10,-4); g.fillText('P2',10,-4);
    g.strokeStyle='rgba(255,201,74,0.22)'; g.lineWidth=0.18; g.beginPath(); g.moveTo(-4.6,-8); g.lineTo(0,-12.4); g.lineTo(4.6,-8); g.stroke(); }
  else { g.strokeRect(-11.6,-12.4,4.4,7.2); g.fillStyle='rgba(0,0,0,0.22)'; for(const [x,z,r] of [[-8.6,-1.4,0.9],[7.2,-5.8,1.2],[-3.4,-9.6,0.7]]){ g.beginPath(); g.ellipse(x,z,r,r*0.7,0.4,0,TAU); g.fill(); }
    g.fillStyle='rgba(255,255,255,0.08)'; for(const [x,z] of [[-5.6,6],[5.6,6]]) { g.fillRect(x-0.6,z-0.6,1.2,1.2); } }
  g.restore(); }
function setGarView(){ const W=innerWidth,H=innerHeight, portrait=W<H&&W<=820; GAR.cam.aspect=W/H; GAR.cam.fov=portrait?50:32;
  if(portrait) GAR.cam.setViewOffset(W,H,0,H*0.27,W,H); else { const pw=Math.min(430,W*0.44); GAR.cam.setViewOffset(W,H,pw/2,0,W,H); }
  GAR.cam.updateProjectionMatrix(); }
function garRebuildModel(){ if(GAR.model){ GAR.turn.remove(GAR.model.root); disposeTank(GAR.model); } GAR.model=makeTank(true,GAR.mode==='park'&&GAR.pick!==UP.tank?Object.assign({},UP,(UP.per&&UP.per[GAR.pick])||perDefault(GAR.pick),{tank:GAR.pick}):UP); garApplyView(); GAR.model.root.position.y=0.16; GAR.turn.add(GAR.model.root); garApplyView(); }
function garApplyView(){ if(!GAR.model) return; const w=(CHASSIS[GAR.model.chid]||CHASSIS.base).w; let v=GAR.view; if(v!=='cn'&&!w.includes(0)) v='cn'; if(v==='cn'&&!w.includes(1)) v='mg'; GAR.model.mg.visible=v==='mg'; GAR.model.cn.visible=v==='cn'; }
function openGarage(mode){ if(GAR.open||TK.dead||FADE.busy) return; FADE.busy=true; fadeOn(); setTimeout(()=>{ FADE.busy=false; openGarage0(mode); fadeOff(); },180); }
function openGarage0(mode){ if(GAR.open||TK.dead) return; sNz(0.5,'bandpass',700,0.8,0.08,0.1); sO(160,90,0.35,0.06,'sine'); GAR.mode=mode||'gar'; GAR.pick=UP.tank||'base'; $('#gTitle').innerHTML=GAR.mode==='park'?'АВТОПАРК <span class="cjk">车队</span>':`ГАРАЖ <span class="cjk">车库</span><small>${chs().name} · улучшения этого танка</small>`; $('#gHull').hidden=GAR.mode==='park'; $('#gPick').hidden=GAR.mode!=='park'; if(!GAR.scene) garInit(); GAR.dG.visible=GAR.mode!=='park'; GAR.dP.visible=GAR.mode==='park'; for(const g of GAR.lo) g.visible=Q==='low'; for(const g of GAR.hi) g.visible=Q!=='low'; garPalette(); GAR.open=true; document.body.classList.add('garage'); $('#garage').hidden=false;
  TK.vx=TK.vz=TK.vF=0; mouse.down=false; GAR.view=(wcur<2?wcur:lastMain)===1?'cn':'mg'; GAR.ang=0.75; GAR.idle=0; garRebuildModel(); setGarView(); renderGarage(); sfxWrench(); }
function closeGarage(){ if(!GAR.open||FADE.busy) return; FADE.busy=true; fadeOn(); setTimeout(()=>{ FADE.busy=false; closeGarage0(); fadeOff(); },180); }
function closeGarage0(){ if(!GAR.open) return; sNz(0.4,'bandpass',1000,0.8,0.06,0.05); sO(90,170,0.3,0.05,'sine'); GAR.open=false; document.body.classList.remove('garage'); $('#garage').hidden=true;
  const DR=GAR.mode==='park'?{x:27.5,z:63.3,h:Math.PI/2}:CAMP_DOOR; STL.on=false; buildGameTank(); updateWeaponUI(); Object.assign(TK,{x:DR.x,z:DR.z,h:DR.h,tYaw:DR.h,vx:0,vz:0,vF:0,prevVF:0,aL:0}); save(); canvas.focus(); }
const RAILW={g:0,speed:999}, RAIL_L=[70,82,94,106], isRail=()=>chs().abil==='rail';
function ammoCur(l){ const c=chs(), a=[]; if(c.mgs.length) a.push(`${AMMO_CAP.mg[l]} пат`); if(c.w.includes(1)) a.push(`${AMMO_CAP.cn[l]} ${isRail()?'зарядов':'сн'}`); if(c.w.includes(2)&&UP.rk) a.push(`${AMMO_CAP.rk[l]} рак`); return a.join(' · '); }
const UPDEF=[
 {k:'engine',t:'Двигатель',max:3,cost:[250,500,900],cur:l=>`${Math.round(ENG_V[l]*chs().spd*3.6)} км/ч · разгон ${(ENG_A[l]*chs().acc).toFixed(0)}`,info:'Быстрее и резвее. На корме появляются второй выхлоп, турбина и радиатор.'},
 {k:'armor',t:'Броня',max:3,cost:[300,600,1000],cur:l=>`${Math.round(ARM_HP[l]*chs().hp)} ед. прочности`,info:'Крылья над колёсами, таранный щит (удары о стены вдвое слабее), пояс плит на башне.'},
 {k:'cal',get t(){ return isRail()?'Длина рельсов':'Калибр пушки'; },max:3,cost:[300,650,1100],v:'cn',cur:l=>isRail()?`луч бьёт на ${RAIL_L[l]} м`:`${CAL_NAME[l]} · взрыв ${CAL_R[l]} м`,get info(){ return isRail()?'Рельсы длиннее — луч прошивает цель на большей дистанции. Добавляются катушки разгона.':'Мощнее взрыв, шире воронка. Ствол длиннее, дульный тормоз крупнее.'; }},
 {k:'load',get t(){ return isRail()?'Конденсаторы':'Автомат заряжания'; },max:3,cost:[250,550,950],v:'cn',cur:l=>`${isRail()?'зарядка':'перезарядка'} ${LOAD_T[l]} с`,get info(){ return isRail()?'Рельсотрон заряжается быстрее. На башне встают блоки накопителей.':'Пушка стреляет чаще. Над казёнником встаёт барабан.'; }},
 {k:'stab',t:'Стабилизатор',max:2,cost:[220,450],cur:l=>`гасит ${Math.round(STAB_K[l]*100)}% крена`,info:'Башня держит линию огня, когда корпус кренится. Гироблок и мачта датчиков.'},
 {k:'ammo',t:'Боеукладка',max:3,cost:[300,600,1000],cur:ammoCur,info:'Больше боезапаса с собой. Пополняется при каждом заезде в лагерь.'},
 {k:'abl',get t(){ return (ABL[UP.tank]||{}).t||''; },max:2,cost:[500,900],cur:l=>ABL[UP.tank]?ABL[UP.tank].cur(l):'',get info(){ return (ABL[UP.tank]||{}).info||''; }},
 {k:'rdr',t:'Ремонтный дрон',max:2,cost:[450,650],cur:l=>l?`${l} ${l===1?'дрон':'дрона'} в звене`:'дронов нет',info:'Квадрокоптер со сварочным аппаратом летает за танком и потихоньку заваривает повреждения. Стоишь на месте — чинит быстрее. Сбитый врагом дрон теряется.'},
 {k:'rk',t:'Ракетный блок',max:2,cost:[700,1000],cur:l=>l?`${RK_N[l]} ракет в залпе`:'не установлен',info:'Третье оружие: самонаводящийся залп в точку прицела. Блок на левом боку башни.'},
];
const nutI='<i class="nut" aria-hidden="true"></i>';
function upShown(k){ const c=chs(); if(k==='cal'||k==='load') return c.w.includes(1); if(k==='rk') return c.w.includes(2); if(k==='abl') return !!c.abil; return true; }
function renderGarage(){ if(GAR.mode==='park'){ renderPark(); return; } const mh=maxHP(), hp=Math.round(TK.hp), miss=mh-hp, rc=Math.ceil(miss*0.6);
  $('#gScrap').textContent=Math.floor(ST.scrap); $('#gHpTxt').textContent=`${hp} / ${mh}`; const f=$('#gHpFill'); f.style.width=(hp/mh*100)+'%'; f.classList.toggle('bad',hp/mh<0.3);
  const names=['Нос','Корма','Лево','Право','Верх']; $('#gSides').innerHTML=TK.dmgS.map((v,i)=>`<div class="${v>0.15?'hurt':''}">${names[i]}<b>${Math.round(v*100)}%</b></div>`).join('');
  const rb=$('#gRepair'); if(miss<=0&&TK.dmgS.every(v=>v<0.01)){ rb.disabled=true; rb.innerHTML='Корпус цел'; } else if(ST.scrap<1){ rb.disabled=true; rb.innerHTML='Нет лома на ремонт'; }
  else { rb.disabled=false; rb.innerHTML=ST.scrap>=rc?`Отремонтировать · ${nutI} ${Math.max(1,rc)}`:`Подлатать на ${Math.floor(ST.scrap/0.6)} ед. · ${nutI} ${Math.floor(ST.scrap)}`; }
  let h='';
  for(const u of UPDEF){ if(!upShown(u.k)) continue; const l=UP[u.k], mx=l>=u.max, cost=mx?0:u.cost[l], can=ST.scrap>=cost;
    h+=`<section class="gcard${GAR.view===u.v?' focus':''}" data-view="${u.v||''}"><div class="ghead"><h3>${u.t}</h3><div class="pips">${Array.from({length:u.max},(_,i)=>`<i class="${i<l?'on':''}"></i>`).join('')}</div></div>
      <div class="now">${u.cur(l)}${mx?'':` → <em>${u.cur(l+1)}</em>`}</div><p>${upInfo(u)}</p>
      <button class="btn${mx?'':' solid'}" data-buy="${u.k}" ${mx||!can?'disabled':''}>${mx?'Максимум':can?`Улучшить · ${nutI} ${cost}`:`Не хватает · ${nutI} ${cost}`}</button></section>`; }
  if(chs().mgs.length) h+=`<section class="gcard${GAR.view==='mg'?' focus':''}" data-view="mg"><div class="ghead"><h3>Пулемёт</h3><span>${MGS[UP.mg].code}</span></div><div class="mgopts">`+
    Object.entries(MGS).filter(([k])=>chs().mgs.includes(k)).map(([k,m])=>{ const own=!!UP.own[k], cur=UP.mg===k; const btn=cur?`<button class="btn" disabled>Стоит</button>`:own?`<button class="btn" data-mg="${k}">Поставить</button>`:`<button class="btn solid" data-mg="${k}" ${ST.scrap>=m.cost?'':'disabled'}>${nutI} ${m.cost}</button>`;
      return `<div class="mgo${cur?' cur':''}"><b>${m.name}</b><span>${m.info}</span>${btn}</div>`; }).join('')+`</div></section>`;
  h+=kitsCard(); $('#gUps').innerHTML=h; }
$('#gpanel').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b||b.disabled) return;
  if(b.id==='gExit'){ closeGarage(); return; }
  if(b.dataset.kit){ const k=b.dataset.kit; if(ST.kits[k]>=KIT_MAX||ST.scrap<KIT_COST[k]) return; ST.scrap-=KIT_COST[k]; ST.kits[k]++; sfxBuy(); renderGarage(); save(); return; }
  if(b.id==='gRepair'){ const mh=maxHP(), miss=Math.max(0,mh-TK.hp); const amt=Math.min(miss,ST.scrap/0.6); const frac=miss>0?amt/miss:1; ST.scrap=Math.max(0,ST.scrap-Math.ceil(amt*0.6-1e-6)); TK.hp+=amt; if(TK.hp>mh-0.5) TK.hp=mh;
    for(let i=0;i<5;i++) TK.dmgS[i]*=(1-frac); if(frac>=0.999) TK.dmgS.fill(0); sfxWrench(); renderGarage(); save(); return; }
  if(b.dataset.buy){ const u=UPDEF.find(x=>x.k===b.dataset.buy), l=UP[u.k]; if(l>=u.max) return; const cost=u.cost[l]; if(ST.scrap<cost) return; ST.scrap-=cost; UP[u.k]=l+1;
    if(u.k==='armor') TK.hp+=(ARM_HP[l+1]-ARM_HP[l])*chs().hp; if(u.k==='ammo') refillAmmo(); if(u.v) GAR.view=u.v; sfxBuy(); garRebuildModel(); renderGarage(); save(); return; }
  if(b.dataset.mg){ const k=b.dataset.mg, m=MGS[k]; if(!UP.own[k]){ if(ST.scrap<m.cost) return; ST.scrap-=m.cost; UP.own[k]=1; sfxBuy(); } else sfxClick(); UP.mg=k; GAR.view='mg'; garRebuildModel(); renderGarage(); save(); } });
$('#gpanel').addEventListener('pointerover',e=>{ const c_=e.target.closest('[data-view]'); if(!c_||!c_.dataset.view||c_.dataset.view===GAR.view) return; GAR.view=c_.dataset.view; garApplyView(); document.querySelectorAll('#gpanel .gcard').forEach(x=>x.classList.toggle('focus',x.dataset.view===GAR.view)); });
function garUpdate(dt,t){ GAR.idle+=dt; if(GAR.idle>2.5&&!GAR.drag) GAR.ang+=dt*0.22; const r=GAR.dist*(innerWidth<innerHeight?1.25:1);
  GAR.cam.position.set(Math.sin(GAR.ang)*r,GAR.hgt,Math.cos(GAR.ang)*r); GAR.cam.lookAt(0,1.15,0);
  const M_=GAR.model; if(M_){ for(const sp of M_.spinners) sp.rotation.y+=dt*2.5; for(const b of M_.barrels) b.rotation.z+=dt*0.6; M_.beacon.visible=(t%1200)<600; tankDamageUniforms(M_); }
  const ts=t/1000, park=GAR.mode==='park'; GAR.mech.g.visible=park; GAR.mech2.g.visible=park; for(const L of GAR.lie) L.g.visible=!park;
  if(park){ mechIdle(GAR.mech,dt,ts); mechIdle(GAR.mech2,dt,ts); } else for(const L of GAR.lie) lyingUpdate(L,ts); }

