/* ================= ПШР-4 «Кузнечик» ================= */
function buildJian(e){ Object.assign(e,{hp:60,maxHp:60,r:0.95,hy:0.55,hr:0.85,mass:1.2,turn:4.5,acc:14,speedW:4.4});
  const Y=emat(e,0xf2b01e), D=emat(e,0x2e343b), W=emat(e,0xe8e2d0), Mt=emat(e,0x6d7681), Sp=emapMat(e,TEXS.spike); e.eyeM=eglow(e,0xffb53a); const B=e.body, H=0.66;
  ep(e,EGEO.cyl,Y,B,0,-0.24,0,0.74,0.34,0.74,true); ep(e,EGEO.thin,D,B,0,-0.09,0,0.76).rotation.x=Math.PI/2; ep(e,EGEO.box,D,B,0,-0.24,0.37,0.2,0.12,0.04); ep(e,EGEO.cyl,D,B,0,-0.42,0,0.5,0.06,0.5);
  ep(e,EGEO.cyl,D,B,0,0.06,0,0.42,0.24,0.42); for(let k=0;k<4;k++) ep(e,EGEO.thin,Mt,B,0,-0.04+k*0.06,0,0.46).rotation.x=Math.PI/2;
  ep(e,EGEO.box,Y,B,0,H,0,0.96,0.92,0.96,true); ep(e,EGEO.box,W,B,0.17,H,0,0.08,0.93,0.97); ep(e,EGEO.box,W,B,0.29,H,0,0.04,0.93,0.97); ep(e,EGEO.box,D,B,0,H+0.465,0,0.72,0.02,0.72);
  ep(e,EGEO.ring,D,B,-0.13,H+0.02,0.5,0.64,0.64,1.4); ep(e,EGEO.disc,e.eyeM,B,-0.13,H+0.02,0.49,0.52); ep(e,EGEO.disc,PKM.glint,B,-0.21,H+0.11,0.5,0.1);
  const cy=gmat(0x6fe8ff); ep(e,EGEO.ring,D,B,-0.37,H+0.37,0.49,0.15); ep(e,EGEO.disc,cy,B,-0.37,H+0.37,0.488,0.07);
  ep(e,EGEO.box,D,B,-0.13,H-0.36,0.485,0.34,0.07,0.02); ep(e,EGEO.box,cy,B,-0.13,H-0.36,0.497,0.27,0.022,0.01);
  const gr=gmat(0x9dff7a); ep(e,EGEO.box,D,B,0.5,H+0.13,0.14,0.07,0.38,0.24); ep(e,EGEO.box,gr,B,0.537,H+0.22,0.14,0.01,0.1,0.17); for(let k=0;k<3;k++) ep(e,EGEO.box,Mt,B,0.537,H+0.07-k*0.05,0.14,0.01,0.03,0.17);
  ep(e,EGEO.box,D,B,0.5,H+0.85,0.2,0.022,0.62,0.022); ep(e,EGEO.joint,gmat(0xff5a40),B,0.5,H+1.17,0.2,0.05); ep(e,EGEO.helix,D,B,0.53,H-0.07,0.2,1,1,1);
  ep(e,EGEO.box,D,B,0.5,H-0.3,0.22,0.06,0.2,0.26); ep(e,EGEO.box,gr,B,0.535,H-0.26,0.22,0.01,0.06,0.15); ep(e,EGEO.box,Mt,B,0.535,H-0.34,0.22,0.01,0.05,0.18);
  for(let k=0;k<3;k++) ep(e,EGEO.box,D,B,0,H-0.2+k*0.12,-0.485,0.5,0.05,0.02); ep(e,EGEO.box,D,B,-0.49,H,0,0.02,0.5,0.6);
  for(const [x,z] of [[0.26,0.26],[-0.26,0.26],[0.26,-0.26],[-0.26,-0.26]]) ep(e,EGEO.cyl,Mt,B,x,-0.3,z,0.2,0.16,0.2);
  addLegs(e,{L1:0.8,L2:1.2,w1:0.13,w2:0.34,stepH:0.4,thr:0.42,stepT:0.17,lead:0.22,bodyH:1.32,bob:0.08,fast:0.06,lowerGeo:EGEO.spike,capMat:D,noPad:true,
    legs:[[0.27,-0.26,0.27,1.2,1.2,0],[-0.27,-0.26,0.27,-1.2,1.2,1],[0.27,-0.26,-0.27,1.2,-1.2,1],[-0.27,-0.26,-0.27,-1.2,-1.2,0]]},D,Sp);
  e.marker=new THREE.Mesh(EGEO.mark,new THREE.MeshBasicMaterial({color:0xff3a2e,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false})); e.marker.rotation.x=-Math.PI/2; scene.add(e.marker); EXTRAS.push(e.marker); }

/* ================= ПМ-6 «Колобок» ================= */
const RIVETS=[]; for(let k=0;k<18;k++){ const y=-0.75+1.5*((k*0.618)%1), a=k*2.4, r=Math.sqrt(1-y*y); RIVETS.push([Math.cos(a)*r,y,Math.sin(a)*r]); }
function buildBomb(e){ Object.assign(e,{hp:12,maxHp:12,r:0.55,hy:0,hr:0.6,mass:0.4,turn:5,acc:10,speedW:2.6,rs:0,spin:0});
  const O=emat(e,0x8a8a52), D=emat(e,0x2e343b), Mt=emat(e,0x6d7681), Cl=emat2(e,0x7d7d4a), Rd=emat(e,0xd42a20); e.eyeM=eglow(e,0xffb53a); e.ball=new THREE.Group(); e.body.add(e.ball); const Bl=e.ball;
  ep(e,EGEO.sph,O,Bl,0,0,0,0.9,0.9,0.9,true); const s1=ep(e,EGEO.thin,Rd,Bl,0,0,0,0.93); s1.rotation.y=0.28; const s2=ep(e,EGEO.thin,Rd,Bl,0,0,0,0.93);
  for(const a of [0.9,-0.9,Math.PI-0.6,Math.PI+0.6]){ const t=ep(e,EGEO.box,Rd,Bl,Math.sin(a)*0.43,0.12,Math.cos(a)*0.43,0.16,0.22,0.03); t.rotation.y=a; t.rotation.z=0.5; }
  e.lampM=eglow(e,0x3a0606); ep(e,EGEO.cyl,D,e.body,0,0.44,0,0.2,0.06,0.2); ep(e,EGEO.sph,e.lampM,e.body,0,0.5,0,0.16,0.12,0.16); e.lampL=ep(e,EGEO.sph,e.lampM,e.body,0,0.5,0,0.01); s2.rotation.set(Math.PI/2,0,0); s2.position.y=-0.08;
  for(const p of RIVETS){ if(p[2]>0.55&&Math.abs(p[0])<0.5) continue; ep(e,EGEO.joint,O,Bl,p[0]*0.452,p[1]*0.452,p[2]*0.452,0.055); }
  ep(e,EGEO.ring,D,Bl,0,-0.03,0.4,0.42,0.42,0.9); ep(e,EGEO.disc,PKM.hole,Bl,0,-0.03,0.425,0.3);
  for(let k=0;k<6;k++){ const b=ep(e,EGEO.box,Mt,Bl,0,-0.03,0.43,0.02,0.11,0.01); b.rotation.z=k/6*Math.PI; b.position.x=Math.cos(k/6*TAU+0.5)*0.035; b.position.y=-0.03+Math.sin(k/6*TAU+0.5)*0.035; }
  ep(e,EGEO.disc,e.eyeM,Bl,0,-0.03,0.432,0.07);
  for(const s of [-1,1]){ const n=new THREE.Vector3(s*0.55,0.42,0.72).normalize(); const r=ep(e,EGEO.ring,D,Bl,n.x*0.44,n.y*0.44,n.z*0.44,0.17,0.17,0.6); r.quaternion.setFromUnitVectors(_ZV,n);
    const g=ep(e,EGEO.disc,e.eyeM,Bl,n.x*0.45,n.y*0.45,n.z*0.45,0.07); g.quaternion.copy(r.quaternion);
    const fl=ep(e,EGEO.plate,Cl,Bl,0,-0.05,0,0.48,0.62,0.48); fl.rotation.y=s*Math.PI/2; }
  addLegs(e,{L1:0.36,L2:0.55,w1:0.07,w2:0.36,d2:0.36,stepH:0.2,thr:0.28,stepT:0.11,lead:0.15,bodyH:0.62,bob:0.04,fast:0.05,lowerGeo:EGEO.claw,detail:false,
    legs:[[0.3,-0.05,0.18,0.75,0.55,0],[-0.3,-0.05,0.18,-0.75,0.55,1],[0.34,-0.05,0,0.85,0,1],[-0.34,-0.05,0,-0.85,0,0],[0.3,-0.05,-0.18,0.75,-0.55,0],[-0.3,-0.05,-0.18,-0.75,-0.55,1]]},D,Cl); }

/* ================= ЗМУ-2 «Улей» ================= */
function buildHive(e){ Object.assign(e,{hp:240,maxHp:240,r:1.9,hy:1.5,hr:1.7,mass:99,static:true,turn:0,acc:0,open:0,bombs:[],cd:2+rnd()*2});
  const O=emat(e,0x8a8a52), D=emat(e,0x2e343b), Mt=emat(e,0x6d7681), Pl=emat2(e,0x7d7d4a), Rd=emat(e,0xd42a20); e.eyeM=eglow(e,0xffb53a); e.coreM=eglow(e,0x806020); const B=e.body;
  ep(e,EGEO.sph,O,B,0,1.45,0,3.0,2.3,3.0,true);
  for(const ry of [0.4,0.4+Math.PI/2]){ const gg=new THREE.Group(); gg.position.set(0,1.45,0); gg.rotation.y=ry; gg.scale.set(3.04,2.34,3.04); B.add(gg); for(const z0 of [-0.32*Math.PI,0.66*Math.PI]){ const a=new THREE.Mesh(EGEO.arc,D); a.rotation.z=z0; gg.add(a); } }
  const belt=ep(e,EGEO.ring,D,B,0,1.2,0,3.0,3.0,3.6); belt.rotation.x=Math.PI/2; const belt2=ep(e,EGEO.thin,Rd,B,0,1.36,0,2.98); belt2.rotation.x=Math.PI/2;
  for(let k=0;k<4;k++){ const a=k/4*TAU+0.35, n=new THREE.Vector3(Math.sin(a),0,Math.cos(a)), g=new THREE.Group(); g.position.set(n.x*1.5,1.2,n.z*1.5); g.quaternion.setFromUnitVectors(_ZV,n); B.add(g);
    ep(e,EGEO.cyl,D,g,0,0,0,0.6,0.42,0.6,true).rotation.x=Math.PI/2; ep(e,EGEO.ring,Mt,g,0,0,0.22,0.56); ep(e,EGEO.disc,k<2?e.eyeM:gmat(0xffb53a),g,0,0,0.215,0.4); ep(e,EGEO.disc,PKM.glint,g,-0.07,0.07,0.222,0.07); ep(e,EGEO.box,D,g,0,0.34,0.05,0.42,0.08,0.3); }
  const top=ep(e,EGEO.ring,D,B,0,2.55,0,1.9,1.9,2.6); top.rotation.x=Math.PI/2; const rim=ep(e,EGEO.thin,Rd,B,0,2.68,0,1.7); rim.rotation.x=Math.PI/2;
  const hole=ep(e,EGEO.disc,PKM.hole,B,0,2.6,0,1.62); hole.rotation.x=-Math.PI/2; const core=ep(e,EGEO.disc,e.coreM,B,0,2.61,0,1.0); core.rotation.x=-Math.PI/2;
  e.hpet=[]; for(let k=0;k<4;k++){ const a=k/4*TAU+Math.PI/4, g=new THREE.Group(); g.position.set(Math.sin(a)*0.78,2.66,Math.cos(a)*0.78); g.rotation.y=a; B.add(g); ep(e,EGEO.box,O,g,0,0.02,-0.36,0.78,0.07,0.7,true); ep(e,EGEO.box,Rd,g,0,0.06,-0.36,0.14,0.02,0.6); e.hpet.push(g); }
  for(let k=0;k<10;k++){ const a=k/10*TAU, t=ep(e,EGEO.box,k%2?Rd:emat(e,0xf2b01e),B,Math.sin(a)*1.52,1.2,Math.cos(a)*1.52,0.34,0.3,0.05); t.rotation.y=a; }
  for(let k=0;k<5;k++){ const a=k/5*TAU+0.95, g=new THREE.Group(); g.position.set(Math.sin(a)*1.2,0.95,Math.cos(a)*1.2); g.rotation.y=a; B.add(g);
    const p=ep(e,EGEO.plate,Pl,g,0,-0.55,0.15,0.8,1.5,0.8,true); p.rotation.x=-0.42; ep(e,EGEO.box,D,g,0,0.05,0.62,0.22,0.3,0.22); ep(e,EGEO.cyl,Mt,g,0,0.05,0.7,0.18,0.36,0.18).rotation.z=Math.PI/2; }
  ep(e,EGEO.cyl,D,B,0,0.25,0,2.3,0.4,2.3); ep(e,EGEO.box,D,B,0.6,2.45,-0.7,0.03,0.7,0.03); ep(e,EGEO.joint,gmat(0xff5a40),B,0.6,2.82,-0.7,0.07); }

/* ================= РМК-12 «Кузница» ================= */
function buildFactory(e){ Object.assign(e,{hp:520,maxHp:520,r:2.4,hy:0.2,hr:2.1,mass:12,turn:0.45,acc:0.9,speedW:1.7,parts:{leg:0,torso:0},prod:0,droneQ:[],hatch:0,bhatch:0,flee:null,fleeT:0});
  const F=factoryGeo(); const O=emat(e,0xf08a24), D=emat(e,0x2e343b), Gm=emat(e,0x4a5260), Mt=emat(e,0x8d96a1), Br=emat(e,0x6b3a2a), Bl=emat(e,0x3f8ed8); e.eyeM=eglow(e,0xffb53a); const B=e.body;
  ep(e,F.body,O,B,0,0.2,0,1,1,1,true); ep(e,F.frame,O,B,0,0.2,0,1,1,1,true); ep(e,F.liner,D,B,0,0.2,0,1,1,1); ep(e,F.back,D,B,0,0.2,0,1,1,1);
  ep(e,EGEO.box,Br,B,0,-0.48,1.12,0.66,0.16,0.56); ep(e,EGEO.box,Br,B,0,-0.02,0.9,0.66,0.78,0.14); ep(e,EGEO.box,Br,B,0,0.48,0.88,0.42,0.22,0.12); for(const s of [-1,1]) ep(e,EGEO.box,D,B,s*0.36,-0.3,1.0,0.06,0.1,0.5);
  ep(e,EGEO.box,D,B,0,0.06,0.97,0.04,0.7,0.02); ep(e,EGEO.box,D,B,0.12,0.06,0.97,0.04,0.7,0.02);
  e.winM=eglow(e,0x5a3a14); for(const s of [-1,1]){ ep(e,EGEO.box,D,B,s*0.86,-0.1,1.0,0.3,0.9,0.36); ep(e,EGEO.box,e.winM,B,s*0.86,0.12,1.19,0.22,0.16,0.01); ep(e,EGEO.box,gmat(s<0?0xff4a3a:0x9dff7a),B,s*0.81,-0.12,1.19,0.06,0.06,0.01); ep(e,EGEO.box,gmat(0xffb53a),B,s*0.91,-0.12,1.19,0.06,0.06,0.01); }
  const hose=ep(e,EGEO.ring,Bl,B,-0.78,-0.55,1.05,0.42,0.42,0.6); hose.rotation.y=Math.PI/2; const hose2=ep(e,EGEO.ring,Bl,B,-0.82,-0.25,0.95,0.3,0.3,0.6); hose2.rotation.y=Math.PI/2;
  ep(e,EGEO.ring,D,B,-1.15,-0.95,1.61,0.34); ep(e,EGEO.disc,e.eyeM,B,-1.15,-0.95,1.605,0.28); ep(e,EGEO.disc,PKM.glint,B,-1.19,-0.91,1.612,0.06);
  e.ind=[]; for(let k=0;k<5;k++){ const m=eglow(e,0x221a10); ep(e,EGEO.box,m,B,0.25+k*0.2,-1.0,1.605,0.12,0.12,0.02); e.ind.push(m); }
  for(let k=0;k<6;k++) ep(e,EGEO.box,k%2?D:PKM.stripe,B,-0.75+k*0.3,-1.17,1.605,0.3,0.1,0.02);
  ep(e,EGEO.box,D,B,1.605,0.75,0.35,0.02,0.32,0.06); const sm=new THREE.Mesh(EGEO.arc,D); sm.position.set(1.607,0.35,0.3); sm.scale.set(0.5,0.5,0.6); sm.rotation.set(0,Math.PI/2,1.17*Math.PI); B.add(sm);
  for(const z of [-0.2,0.2]) ep(e,EGEO.box,Mt,B,1.66,0.0,z+0.75,0.04,0.04,0.04); const cage=ep(e,EGEO.ring,Mt,B,1.68,0.1,0.95,0.42); cage.rotation.y=Math.PI/2; ep(e,EGEO.joint,gmat(0xfff2c8),B,1.66,0.1,0.95,0.14); ep(e,EGEO.box,Mt,B,1.7,0.1,0.95,0.03,0.4,0.03);
  for(let k=0;k<4;k++) ep(e,EGEO.box,D,B,-1.605,-0.6+k*0.13,-0.6,0.02,0.05,0.9); const coil=ep(e,EGEO.ring,D,B,-1.68,0.45,0.75,0.55,0.55,1.6); coil.rotation.y=Math.PI/2; ep(e,EGEO.ring,Mt,B,-1.62,0.6,-0.6,0.36).rotation.y=Math.PI/2; ep(e,EGEO.disc,gmat(0xe8e2d0),B,-1.625,0.6,-0.6,0.3).rotation.y=-Math.PI/2;
  for(const [x,z] of [[1.3,1.62],[-1.3,1.62]]) ep(e,EGEO.box,O,B,x,1.25,z,0.3,0.4,0.12,true);
  for(const x of [-1.05,-0.7]){ ep(e,EGEO.cyl,D,B,x,2.0,-1.25,0.24,0.6,0.24,true); ep(e,EGEO.cyl,Mt,B,x,2.32,-1.25,0.28,0.06,0.28); }
  ep(e,EGEO.box,PKM.hole,B,0,1.705,0.05,1.3,0.02,1.2); e.inM=eglow(e,0x3a2408); ep(e,EGEO.box,e.inM,B,0,1.707,0.05,0.8,0.02,0.7);
  for(const [x,z,w,d] of [[0,0.69,1.5,0.1],[0,-0.59,1.5,0.1],[0.74,0.05,0.1,1.3],[-0.74,0.05,0.1,1.3]]) ep(e,EGEO.box,D,B,x,1.73,z,w,0.06,d);
  e.lid=new THREE.Group(); e.lid.position.set(0,1.76,-0.6); B.add(e.lid); ep(e,EGEO.box,O,e.lid,0,0.04,0.65,1.5,0.08,1.32,true); ep(e,EGEO.box,D,e.lid,0,0.09,0.65,1.2,0.02,0.08); ep(e,EGEO.box,PKM.stripe,e.lid,0,0.09,1.18,1.3,0.02,0.12);
  ep(e,EGEO.box,D,e.lid,-0.62,0.9,0.05,0.025,1.8,0.025); ep(e,EGEO.box,Mt,e.lid,0,0.0,0.0,1.4,0.1,0.1);
  ep(e,EGEO.box,D,B,0,-1.36,0,3.0,0.14,3.0); ep(e,EGEO.box,PKM.hole,B,0,-1.435,0,1.4,0.02,1.4);
  e.bdoors=[]; for(const s of [-1,1]){ const g=new THREE.Group(); g.position.set(s*0.72,-1.44,0); B.add(g); ep(e,EGEO.box,D,g,-s*0.36,-0.03,0,0.72,0.06,1.4); e.bdoors.push(g); }
  for(const [x,z] of [[1.35,1.35],[-1.35,1.35],[1.35,-1.35],[-1.35,-1.35]]) ep(e,EGEO.box,Gm,B,x,-1.2,z,0.6,0.3,0.6,true);
  addLegs(e,{L1:1.7,L2:2.0,w1:0.34,d1:0.5,w2:0.5,stepH:0.6,thr:0.75,stepT:0.55,lead:0.5,bodyH:3.15,bob:0.12,heavy:true,lowerGeo:EGEO.cyl,lens:true,kneeK:1.9,hipK:2.6,hipMat:Gm,
    foot:{geo:EGEO.wedge,mat:D,s:[0.7,0.5,1.0]},capMat:Gm,
    legs:[[1.45,-1.3,1.45,2.75,2.75,0],[-1.45,-1.3,1.45,-2.75,2.75,2],[1.45,-1.3,-1.45,2.75,-2.75,3],[-1.45,-1.3,-1.45,-2.75,-2.75,1]]},Gm,O);
  for(let k=0;k<4;k++) spawnDrone(e,k); }

/* ================= ТШ-75 «Бизон» ================= */
function buildBull(e,opt){ const mod=opt.mod||['ac','mg','mortar'][(rnd()*3)|0]; Object.assign(e,{hp:160,maxHp:160,r:1.4,hy:0,hr:1.3,mass:3,turn:2.2,acc:6,speedW:3.0,mod,mag:EW[mod].mag,shots:0});
  const Gy=emat(e,0x98a2b0), Y=emat(e,0xf2a81e), D=emat(e,0x2a2a2e), Mt=emat(e,0x6d7681), Hz=emapMat(e,TEXS.haz); e.eyeM=eglow(e,0xffb53a); const B=e.body;
  ep(e,EGEO.box,D,B,0,-0.38,-0.1,0.95,0.5,2.0); ep(e,EGEO.box,Gy,B,0,0.05,-0.3,1.25,0.62,2.3,true); ep(e,EGEO.box,Gy,B,0,0.42,-0.4,1.05,0.14,1.7);
  ep(e,EGEO.box,Y,B,0,0.12,1.12,1.12,0.72,0.72,true); ep(e,EGEO.box,D,B,0,-0.28,1.25,1.0,0.12,0.5); ep(e,EGEO.box,Y,B,0,0.5,1.0,1.0,0.06,0.45);
  ep(e,EGEO.cyl,D,B,-0.18,0.12,1.5,0.5,0.14,0.5,true).rotation.x=Math.PI/2; ep(e,EGEO.ring,Mt,B,-0.18,0.12,1.56,0.44); ep(e,EGEO.disc,e.eyeM,B,-0.18,0.12,1.575,0.3); ep(e,EGEO.disc,PKM.glint,B,-0.24,0.18,1.58,0.07);
  ep(e,EGEO.box,D,B,0.28,-0.12,1.485,0.36,0.14,0.02); for(const s of [-1,1]) ep(e,EGEO.box,D,B,s*0.565,0.12,1.12,0.02,0.4,0.46);
  for(const s of [-1,1]){ ep(e,EGEO.box,Hz,B,s*0.632,0.2,0.32,0.02,0.16,0.5); for(const z of [-1.1,-0.5,0.1]) ep(e,EGEO.cyl,Mt,B,s*0.635,-0.12,z,0.06,0.02,0.06).rotation.z=Math.PI/2;
    for(let k=0;k<3;k++) ep(e,EGEO.box,D,B,s*0.632,-0.1,-1.15+k*0.14,0.02,0.24,0.06); ep(e,EGEO.box,gmat(0xffb53a),B,s*0.45,-0.04,1.485,0.12,0.06,0.02); }
  ep(e,EGEO.box,Gy,B,0,0.15,-1.5,1.15,0.5,0.4,true); for(const x of [0.18,0.34]) ep(e,EGEO.box,Y,B,x,0.15,-1.71,0.08,0.5,0.02); for(const x of [0.18,0.34]) ep(e,EGEO.box,Y,B,x,0.41,-1.5,0.08,0.02,0.4);
  ep(e,EGEO.sph,D,B,-0.1,0.5,0.15,0.3,0.2,0.3); ep(e,EGEO.box,Mt,B,0.4,0.62,-1.25,0.12,0.14,0.04); ep(e,EGEO.box,D,B,-0.45,0.75,-1.2,0.03,0.6,0.03); ep(e,EGEO.joint,gmat(0xff5a40),B,-0.45,1.06,-1.2,0.06);
  for(const [x,z] of [[0.62,0.85],[-0.62,0.85],[0.62,-0.95],[-0.62,-0.95]]) ep(e,EGEO.box,D,B,x,-0.28,z,0.34,0.34,0.4);
  const mg=new THREE.Group(); mg.position.set(0,0.5,-0.55); B.add(mg); e.muz=new THREE.Object3D(); mg.add(e.muz);
  if(mod==='ac'){ ep(e,EGEO.box,D,mg,0,0.12,0,0.6,0.3,0.8,true); for(const s of [-1,1]){ ep(e,EGEO.box,D,mg,s*0.14,0.14,0.85,0.11,0.11,1.2); ep(e,EGEO.box,Mt,mg,s*0.14,0.14,1.42,0.15,0.15,0.14); } e.muz.position.set(0,0.14,1.5); }
  else if(mod==='mg'){ ep(e,EGEO.cyl,D,mg,0,0.12,0.2,0.4,0.6,0.4,true).rotation.x=Math.PI/2; for(let k=0;k<4;k++){ const a=k/4*TAU; ep(e,EGEO.box,D,mg,Math.cos(a)*0.09,0.12+Math.sin(a)*0.09,0.85,0.05,0.05,0.9); } ep(e,EGEO.thin,Mt,mg,0,0.12,1.15,0.44);
    ep(e,EGEO.box,PKM.ammo,mg,0.36,0.07,0,0.22,0.3,0.42,true); e.muz.position.set(0,0.12,1.35); }
  else { ep(e,EGEO.box,D,mg,0,0.06,0,0.7,0.16,0.7); ep(e,EGEO.box,Gy,mg,0,0.42,0.05,0.62,0.56,0.72,true); for(const [x,y] of [[-0.15,0.3],[0.15,0.3],[-0.15,0.56],[0.15,0.56]]){ ep(e,EGEO.cyl,D,mg,x,y,0.42,0.22,0.06,0.22).rotation.x=Math.PI/2; ep(e,EGEO.disc,PKM.hole,mg,x,y,0.455,0.16); }
    ep(e,EGEO.box,Y,mg,0,0.72,0.05,0.62,0.04,0.2); e.muz.position.set(0,0.45,0.5); }
  addLegs(e,{L1:1.05,L2:1.25,w1:0.3,d1:0.4,w2:0.4,d2:0.5,stepH:0.4,thr:0.5,stepT:0.22,lead:0.3,bodyH:1.75,bob:0.06,fast:0.04,lowerGeo:EGEO.box,capMat:Y,kneeK:1.3,hipK:1.8,
    band:{mat:Y,at:0.86,len:0.2,k:1.12},foot:{geo:EGEO.box,mat:D,s:[0.5,0.16,0.62]},
    legs:[[0.62,-0.3,0.9,1.6,1.75,0],[-0.62,-0.3,0.9,-1.6,1.75,1],[0.62,-0.3,-0.95,1.6,-1.6,1],[-0.62,-0.3,-0.95,-1.6,-1.6,0]]},Gy,Gy);
  if(mod==='mortar'){ e.marker=new THREE.Mesh(EGEO.mark,new THREE.MeshBasicMaterial({color:0xff3a2e,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false})); e.marker.rotation.x=-Math.PI/2; e.marker.scale.setScalar(1.6); scene.add(e.marker); EXTRAS.push(e.marker); } }

function spawnDrone(f,k){ const g=new THREE.Group(), D=new THREE.MeshToonMaterial({color:0x2e343b,gradientMap:gradTex}), O=new THREE.MeshToonMaterial({color:0xf08a24,gradientMap:gradTex}), eye=new THREE.MeshBasicMaterial({color:0xffb53a});
  const m=(geo,mat,x,y,z,sx,sy,sz)=>{ const o=new THREE.Mesh(geo,mat); o.position.set(x,y,z); o.scale.set(sx,sy,sz); g.add(o); return o; };
  m(EGEO.box,O,0,0,0,0.5,0.2,0.5); m(EGEO.box,D,0,0.11,0,0.32,0.04,0.32); m(EGEO.box,D,0,-0.14,0,0.3,0.1,0.3); m(EGEO.ring,D,0,0,0.26,0.32,0.32,0.32); m(EGEO.disc,eye,0,0,0.262,0.14,0.14,1); m(EGEO.disc,PKM.glint,-0.03,0.03,0.265,0.03,0.03,1); const rot=[];
  for(const s of [-1,1]){ m(EGEO.box,D,s*0.16,-0.26,0,0.03,0.1,0.03); m(EGEO.box,D,s*0.16,-0.31,0,0.04,0.03,0.5); }
  m(EGEO.box,D,-0.15,0.2,-0.15,0.02,0.2,0.02); m(EGEO.joint,PKM.redLamp,-0.15,0.31,-0.15,0.05,0.05,0.05);
  for(const [x,z] of [[0.42,0.42],[-0.42,0.42],[0.42,-0.42],[-0.42,-0.42]]){ m(EGEO.box,D,x/2,0.02,z/2,0.06,0.05,0.6).rotation.y=Math.atan2(x,z); m(EGEO.cyl,D,x,0.05,z,0.12,0.1,0.12); const r=m(EGEO.rotor,D,x,0.1,z,1,1,1); r.userData.keep=true; rot.push(r); }
  mergeGroup(g); scene.add(g); EXTRAS.push(g); const d={f,g,x:f.x,y:f.y+2,z:f.z,vx:0,vy:5,vz:0,hp:8,maxHp:8,dead:false,state:'orbit',ang:k/4*TAU,carry:null,target:null,flash:0,rot,mats:[D,O],t:0}; DRONES.push(d); return d; }

function addLegs(e,cfg,mat,tipMat){ e.wc=cfg; const ch=Math.cos(e.h), sh=Math.sin(e.h); const pm=cfg.detail!==false?emat(e,0x8d96a1):null; const n=cfg.legs.length;
  const I={}; const K=(k,geo,m)=>{ I[k]={geo,mat:m}; };
  K('m1',cfg.upperGeo||EGEO.box,mat); K('o1',cfg.upperGeo||EGEO.box,outlineMat); K('m2',cfg.lowerGeo||cfg.tipGeo||EGEO.tip,tipMat||mat); K('mk',EGEO.joint,cfg.kneeMat||mat);
  if(pm){ K('hm',EGEO.joint,cfg.hipMat||mat); K('pi',EGEO.cyl,pm); K('cap',EGEO.box,cfg.capMat||tipMat||mat); if(!cfg.foot&&!cfg.noPad) K('ft',EGEO.cyl,mat); }
  if(cfg.foot) K('fw',cfg.foot.geo,cfg.foot.mat||mat); if(cfg.band) K('bd',EGEO.box,cfg.band.mat);
  if(cfg.lens){ for(const k of ['0','1']){ K('lr'+k,EGEO.ring,pm||mat); K('lg'+k,EGEO.disc,PKM.lens); } }
  for(const k in I){ const im=new THREE.InstancedMesh(I[k].geo,I[k].mat,n); im.frustumCulled=false; for(let i=0;i<n;i++) im.setMatrixAt(i,_zm); e.lg.add(im); I[k].im=im; }
  e.legI=I;
  for(const l of cfg.legs){ const o={}; for(const k in I) if(k!=='o1') o[k]=new THREE.Object3D();
    const L={hip:new THREE.Vector3(l[0],l[1],l[2]),rest:[l[3],l[4]],g:l[5],foot:new THREE.Vector3(),from:new THREE.Vector3(),t:-1,tx:0,tz:0,err:0,alive:true,hp:cfg.legHp||0,o,
      m1:o.m1,m2:o.m2,mk:o.mk,hm:o.hm,pi:o.pi,cap:o.cap,ft:o.ft,fw:o.fw,bd:o.bd,knee:new THREE.Vector3(),parts:[]};
    L.foot.set(e.x+l[3]*ch+l[4]*sh,groundH(e.x,e.z),e.z-l[3]*sh+l[4]*ch); L.mk.scale.setScalar(cfg.w1*(cfg.kneeK||1.6));
    if(L.hm) L.hm.scale.setScalar(cfg.w1*(cfg.hipK||2.3)); if(L.cap) L.cap.scale.set(cfg.w1*1.9,cfg.w1*0.8,cfg.w1*1.9); if(L.ft) L.ft.scale.set(cfg.w2*1.6,Math.max(0.05,cfg.w2*0.3),cfg.w2*1.6); if(L.fw) L.fw.scale.set(...cfg.foot.s);
    if(cfg.lens) L.ln=[[o.lr0,o.lg0],[o.lr1,o.lg1]];
    for(const k in o) if(!['m1','m2','mk'].includes(k)) L.parts.push(o[k]);
    e.legs.push(L); } }
const _zm=new THREE.Matrix4().makeScale(0,0,0), _vo2=new THREE.Object3D();
function legFlush(e){ const I=e.legI; if(!I) return; const n=e.legs.length;
  for(const k in I){ const im=I[k].im; for(let i=0;i<n;i++){ const L=e.legs[i], o=k==='o1'?L.o.m1:L.o[k];
      if(!L.alive||!o.visible){ im.setMatrixAt(i,_zm); continue; }
      if(k==='o1'){ _vo2.position.copy(o.position); _vo2.quaternion.copy(o.quaternion); _vo2.scale.copy(o.scale).multiplyScalar(1.12); _vo2.updateMatrix(); im.setMatrixAt(i,_vo2.matrix); }
      else { o.updateMatrix(); im.setMatrixAt(i,o.matrix); } }
    im.instanceMatrix.needsUpdate=true; } }
function legMesh(e,k,o){ const m=new THREE.Mesh(e.legI[k].geo,e.legI[k].mat); m.position.copy(o.position); m.quaternion.copy(o.quaternion); m.scale.copy(o.scale); return m; }
function legGibs(e,dx,dz,part,spd){ for(const L of e.legs){ if(!L.alive) continue; L.alive=false; _c3.copy(L.knee); const list=[legMesh(e,'m1',L.o.m1),legMesh(e,'m2',L.o.m2)]; if(L.o.pi) list.push(legMesh(e,'pi',L.o.pi));
    const g=gibMeshes(list,_c3,part,dx*spd*(0.6+rnd())+(rnd()-0.5)*4,3+rnd()*4,dz*spd*(0.6+rnd())+(rnd()-0.5)*4,0.3); g.w.multiplyScalar(1.3); } legFlush(e); }
function bombLegsVis(e,v){ for(const L of e.legs){ L.m1.visible=L.m2.visible=L.mk.visible=v&&L.alive; for(const p of L.parts) p.visible=v&&L.alive; } legFlush(e); }

const ETYPE={jian:{build:buildJian,update:updJian,die:dieJian},bomb:{build:buildBomb,update:updBomb,die:dieBomb},hive:{build:buildHive,update:updHive,die:dieHive},
  factory:{build:buildFactory,update:updFactory,die:dieFactory},bull:{build:buildBull,update:updBull,die:dieBull},lamp:{build:buildLamp,update:updLamp,die:dieLamp}};

/* ---------- aim assist ---------- */
function findLock(){ if(LOC.safe){ AIM.manual=null; return null; } let best=null, bs=1e9; const cands=[];
  const mn=AIM.manual; if(mn){ if(mn.dead||mn.lockable===false||Math.hypot(mn.x-TK.x,mn.z-TK.z)>48) AIM.manual=null; else if(!(aimMode==='stick'&&TCH.active)) return [mn,mn.x,mn.y+(mn.hy||0),mn.z,mn.hr||0.5]; }
  for(const e of ENEMIES) if(!e.dead&&e.lockable&&e.state!=='fly') cands.push([e,e.x,e.y+e.hy,e.z,e.hr]); for(const d of DRONES) if(!d.dead) cands.push([d,d.x,d.y,d.z,0.5]);
  if(aimMode==='mouse'){ for(const c of cands){ const s=toScreen(c[1],c[2],c[3]); if(!s[2]) continue; const dd=Math.hypot(s[0]-mouse.x,s[1]-mouse.y)*(c[0]===AIM.lockE?0.55:1), lim=30+c[4]*16; if(dd<lim&&dd<bs){ bs=dd; best=c; } } }
  else if(!TCH.active){ for(const c of cands){ const d=Math.hypot(c[1]-TK.x,c[3]-TK.z); if(d>28||d<1) continue; const sc=d*(c[0]===AIM.lockE?0.6:1)*(c[0].type==='factory'?1.4:1); if(sc<bs){ bs=sc; best=c; } } }
  else { const ax=Math.sin(AIM.yawRel), az=Math.cos(AIM.yawRel); for(const c of cands){ const dx=c[1]-TK.x, dz=c[3]-TK.z, d=Math.hypot(dx,dz); if(d>38||d<1) continue; const ang=Math.acos(clamp((dx*ax+dz*az)/d,-1,1)), sc=(ang*12+d*0.04)*(c[0]===AIM.lockE?0.55:1); if(ang<0.32&&sc<bs){ bs=sc; best=c; } } }
  return best; }

/* ---------- per-location state ---------- */
const LOC_STATE={};
function serializeE(){}

