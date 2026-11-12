/* ================= RENDERER ================= */
const canvas=$('#c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:(window.devicePixelRatio||1)<1.5,powerPreference:'high-performance',stencil:false});
renderer.setClearColor(0x0a1322,1);
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x1d5c99);
scene.fog=new THREE.Fog(0x1d5c99,44,120);
const camera=new THREE.PerspectiveCamera(36,innerWidth/innerHeight,1,320);
const hemi=new THREE.HemisphereLight(0xffffff,0x000000,1.05); scene.add(hemi);
const sun=new THREE.DirectionalLight(0xdfe8ff,0.6); sun.position.set(-0.5,1,0.7); scene.add(sun); scene.add(sun.target);
/* real shadow maps on MED/HIGH: a moon light that follows the camera; the unlit world receives them through a ShadowMaterial overlay */
const SHR=new THREE.ShadowMaterial({opacity:0.4,side:THREE.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
/* world geometry has no normals: give the shadow lookup a fixed up-normal so it doesn't turn into NaN */
SHR.onBeforeCompile=sh=>{ sh.vertexShader=sh.vertexShader.replace('#include <shadowmap_vertex>',THREE.ShaderChunk.shadowmap_vertex.replace('inverseTransformDirection( transformedNormal, viewMatrix )','vec3(0.0,1.0,0.0)')); };
const SUN_DIR=new THREE.Vector3(-0.42,1,0.55).normalize(); let REALSH=false, shMarkT=0;
function shadowCfg(){ const on=Q!=='low', hi=Q==='high';
  if(renderer.shadowMap.enabled!==on){ renderer.shadowMap.enabled=on; renderer.shadowMap.type=THREE.PCFShadowMap; renderer.shadowMap.needsUpdate=true; scene.traverse(o=>{ const m=o.material; if(m) (Array.isArray(m)?m:[m]).forEach(x=>x.needsUpdate=true); }); }
  REALSH=on; sun.castShadow=on; shMarkT=0; if(!on) return; const sz=hi?2048:1024;
  if(sun.shadow.mapSize.x!==sz){ sun.shadow.mapSize.set(sz,sz); if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map=null; } }
  const c=sun.shadow.camera, R=hi?30:24; c.left=-R; c.right=R; c.top=R; c.bottom=-R; c.near=1; c.far=140; c.updateProjectionMatrix(); sun.shadow.bias=-0.0012; sun.shadow.normalBias=0; }
function shadowFollow(){ if(!REALSH) return; const R=sun.shadow.camera.right*2/sun.shadow.mapSize.x, x=Math.round(camLook.x/R)*R, z=Math.round((camLook.z-3)/R)*R;
  sun.target.position.set(x,0,z); sun.position.set(x+SUN_DIR.x*60,SUN_DIR.y*60,z+SUN_DIR.z*60); sun.target.updateMatrixWorld(); }
function shadowMark(dt){ if(!REALSH) return; shMarkT-=dt; if(shMarkT>0) return; shMarkT=0.4; const hi=Q==='high';
  const mark=root=>{ if(root) root.traverse(o=>{ if(!o.isMesh) return; const m=o.material; o.castShadow=!!m&&!Array.isArray(m)&&!m.transparent&&m!==outlineMat&&!m.isMeshBasicMaterial&&!m.isShaderMaterial; }); };
  if(tank) mark(tank.root); for(const e of ENEMIES) if(!e.dead){ mark(e.g); mark(e.lg); } for(const d of DRONES) if(!d.dead) mark(d.g);
  for(const b of BEE.list) mark(b.g); for(const d of RDR.list) mark(d.g); for(const c of CIV.list) mark(c.g); for(const s of SOLDIERS) mark(s.g);
  if(hi){ if(chunks) for(const ch of chunks) if(ch.mesh) ch.mesh.castShadow=true; for(const im of VINST) im.castShadow=true; mark(CDK.g); } }
const worldMat=new THREE.MeshBasicMaterial({vertexColors:true});
const XR={p:{value:new THREE.Vector2(-9999,-9999)},r:{value:0},z:{value:0},e:{value:[new THREE.Vector4(),new THREE.Vector4(),new THREE.Vector4(),new THREE.Vector4()]}};
worldMat.onBeforeCompile=sh=>{ sh.uniforms.uTP=XR.p; sh.uniforms.uTR=XR.r; sh.uniforms.uTZ=XR.z; sh.uniforms.uXE=XR.e;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying float vVZ;varying vec3 vVP;').replace('#include <project_vertex>','#include <project_vertex>\nvVZ=-mvPosition.z;vVP=mvPosition.xyz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vVZ;varying vec3 vVP;uniform vec2 uTP;uniform float uTR;uniform float uTZ;uniform vec4 uXE[4];')
    .replace('void main() {','void main() {\n float xW=0.0; if(uTR>0.0||uXE[0].z>0.0||uXE[1].z>0.0||uXE[2].z>0.0||uXE[3].z>0.0){ vec3 xn=normalize(cross(dFdx(vVP),dFdy(vVP))); vec3 xu=normalize((viewMatrix*vec4(0.,1.,0.,0.)).xyz); xW=abs(dot(xn,xu))<0.6?1.0:0.0; }\n if(uTR>0.0&&vVZ<uTZ-1.3+xW*4.3){ float e=length(gl_FragCoord.xy-uTP)/uTR; if(e<1.0){ float th=smoothstep(0.62,1.0,e); float bay=mod(floor(gl_FragCoord.x)+floor(gl_FragCoord.y)*2.0,4.0)/4.0+0.125; if(bay>th) discard; } }\n for(int i=0;i<4;i++){ vec4 q=uXE[i]; if(q.z>0.0&&vVZ<q.w-1.0+xW*3.0){ float e=length(gl_FragCoord.xy-q.xy)/q.z; if(e<1.0){ float th=smoothstep(0.55,1.0,e); float bay=mod(floor(gl_FragCoord.x)+floor(gl_FragCoord.y)*2.0,4.0)/4.0+0.125; if(bay>th) discard; } } }'); };
const litMat=new THREE.MeshLambertMaterial({vertexColors:true});
function radialTex(inner){ const cv=document.createElement('canvas'); cv.width=cv.height=128; const g=cv.getContext('2d');
  const gr=g.createRadialGradient(64,64,0,64,64,64); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(inner||0.25,'rgba(255,255,255,0.45)'); gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gr; g.fillRect(0,0,128,128); return new THREE.CanvasTexture(cv); }
const TEX_R=radialTex(0.2), TEX_SOFT=radialTex(0.55);
const EXTRAS=[];
function addExtra(o){ scene.add(o); EXTRAS.push(o); return o; }

/* ---------- mesher ---------- */
const FACES=[[1,0,0,[1,0,0,1,1,0,1,1,1,1,0,1]],[-1,0,0,[0,0,1,0,1,1,0,1,0,0,0,0]],[0,1,0,[0,1,0,0,1,1,1,1,1,1,1,0]],
  [0,-1,0,[0,0,0,1,0,0,1,0,1,0,0,1]],[0,0,1,[1,0,1,1,1,1,0,1,1,0,0,1]],[0,0,-1,[0,0,0,0,1,0,1,1,0,1,0,0]]];
const FD=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1];
const SH=[0.80,0.60,1.0,0.45,0.88,0.64], GSH=[0.93,0.86,1.0,0.8,1.0,0.88];
let sP=new Float32Array(1<<18), sC=new Uint8Array(1<<18), sN=new Float32Array(1<<18), sI=new Uint32Array(1<<17);
function ensure(nf){ if(nf*12>sP.length){ let n=sP.length; while(n<nf*12)n*=2; const a=new Float32Array(n);a.set(sP);sP=a; const b=new Uint8Array(n);b.set(sC);sC=b; const d=new Float32Array(n);d.set(sN);sN=d; }
  if(nf*6>sI.length){ let n=sI.length; while(n<nf*6)n*=2; sI=new Uint32Array(n); } }
function idxFor(nf){ ensure(nf); for(let f=0;f<nf;f++){ const o=f*6,v=f*4; sI[o]=v;sI[o+1]=v+1;sI[o+2]=v+2;sI[o+3]=v;sI[o+4]=v+2;sI[o+5]=v+3; } return sI.slice(0,nf*6); }
const col=[0,0,0];
function buildChunk(ci){ const ch=chunks[ci]; const cy=Math.floor(ci/(CX*CZ)), rem=ci-cy*CX*CZ, cz=Math.floor(rem/CX), cx=rem-cz*CX;
  const x0=cx*CS,y0=cy*CS,z0=cz*CS,x1=Math.min(NX,x0+CS),y1=Math.min(NY,y0+CS),z1=Math.min(NZ,z0+CS); let nf=0;
  for(let y=y0;y<y1;y++){ const ao=0.62+0.38*Math.min(1,(y*VS)/7);
    for(let z=z0;z<z1;z++){ let i=gi(x0,y,z);
      for(let x=x0;x<x1;x++,i++){ const m=grid[i]; if(!m) continue; const md=MD[m]; let cd=false;
        for(let f=0;f<6;f++){ const F=FACES[f], nx=x+F[0], ny=y+F[1], nz=z+F[2]; if(ny<0) continue;
          if(nx>=0&&nx<NX&&ny<NY&&nz>=0&&nz<NZ&&grid[nx+NX*(nz+NZ*ny)]) continue;
          if(!cd){ matRGB(m,x,y,z,col); cd=true; }
          const s=md.glow?GSH[f]:SH[f]*ao; const r=Math.min(255,col[0]*s*255)|0, g=Math.min(255,col[1]*s*255)|0, b=Math.min(255,col[2]*s*255)|0;
          if((nf+1)*12>sP.length) ensure(nf+1); const v=F[3], o=nf*12;
          for(let k=0;k<4;k++){ const q=o+k*3; sP[q]=(x+v[k*3])*VS; sP[q+1]=(y+v[k*3+1])*VS; sP[q+2]=(z+v[k*3+2])*VS; sC[q]=r; sC[q+1]=g; sC[q+2]=b; }
          nf++; } } } }
  if(ch.mesh){ ch.mesh.geometry.dispose(); if(!nf){ scene.remove(ch.mesh); ch.mesh=null; if(ch.smesh){ scene.remove(ch.smesh); ch.smesh=null; } return; } }
  if(!nf) return;
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(sP.slice(0,nf*12),3));
  geo.setAttribute('color',new THREE.BufferAttribute(sC.slice(0,nf*12),3,true)); geo.setIndex(new THREE.BufferAttribute(idxFor(nf),1));
  geo.boundingSphere=ch.sphere;
  if(ch.mesh) ch.mesh.geometry=geo; else { ch.mesh=new THREE.Mesh(geo,worldMat); ch.mesh.matrixAutoUpdate=false; scene.add(ch.mesh); } if(REALSH&&Q==='high') ch.mesh.castShadow=true;
  if(REALSH&&Q==='high'){ if(ch.smesh) ch.smesh.geometry=geo; else { ch.smesh=new THREE.Mesh(geo,SHR); ch.smesh.matrixAutoUpdate=false; ch.smesh.receiveShadow=true; ch.smesh.renderOrder=1; scene.add(ch.smesh); } } else if(ch.smesh){ scene.remove(ch.smesh); ch.smesh=null; } }
function meshLocal(lg,sx,sy,sz,mn){ let nf=0; const hx_=sx/2,hy=sy/2,hz=sz/2;
  for(let y=0;y<sy;y++)for(let z=0;z<sz;z++)for(let x=0;x<sx;x++){ const m=lg[x+sx*(z+sz*y)]; if(!m) continue; let cd=false;
    for(let f=0;f<6;f++){ const F=FACES[f], nx=x+F[0], ny=y+F[1], nz=z+F[2];
      if(nx>=0&&nx<sx&&ny>=0&&ny<sy&&nz>=0&&nz<sz&&lg[nx+sx*(nz+sz*ny)]) continue;
      if(!cd){ matRGB(m,x+mn[0],y+mn[1],z+mn[2],col); cd=true; } const gl=MD[m].glow?0.8:1;
      const r=Math.min(255,col[0]*gl*255)|0, g=Math.min(255,col[1]*gl*255)|0, b=Math.min(255,col[2]*gl*255)|0;
      if((nf+1)*12>sP.length) ensure(nf+1); const v=F[3], o=nf*12;
      for(let k=0;k<4;k++){ const q=o+k*3; sP[q]=(x+v[k*3]-hx_)*VS; sP[q+1]=(y+v[k*3+1]-hy)*VS; sP[q+2]=(z+v[k*3+2]-hz)*VS;
        sC[q]=r;sC[q+1]=g;sC[q+2]=b; sN[q]=F[0];sN[q+1]=F[1];sN[q+2]=F[2]; } nf++; } }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(sP.slice(0,nf*12),3));
  geo.setAttribute('normal',new THREE.BufferAttribute(sN.slice(0,nf*12),3)); geo.setAttribute('color',new THREE.BufferAttribute(sC.slice(0,nf*12),3,true));
  geo.setIndex(new THREE.BufferAttribute(idxFor(nf),1)); geo.computeBoundingSphere(); return geo; }

