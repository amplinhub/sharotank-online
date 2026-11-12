/* ================= SHADOWS (blobs that lean away from nearby light) ================= */
const shMat=new THREE.MeshBasicMaterial({map:TEX_SOFT,color:0x000000,transparent:true,opacity:0.5,depthWrite:false});
const LIGHTS=[]; let lightsT=0;
function lightsRefresh(){ LIGHTS.length=0; for(const l of LAMPS) if(l.alive&&l.pool!==false) LIGHTS.push([l.x,l.z,l.r*2.4,0.9]); }
const _sl=[0,0,0];
function shadowLight(x,z){ let lx=0,lz=0,I=0; for(const L of LIGHTS){ const dx=x-L[0], dz=z-L[1]; if(Math.abs(dx)>L[2]||Math.abs(dz)>L[2]) continue; const d=Math.hypot(dx,dz); if(d>=L[2]) continue; const w=(1-d/L[2])*L[3]; lx+=dx/(d+0.4)*w; lz+=dz/(d+0.4)*w; I+=w; }
  for(const f of flashPools){ if(f.t<=0) continue; const k=f.t/f.ml, R=f.s*0.9+4, dx=x-f.m.position.x, dz=z-f.m.position.z, d=Math.hypot(dx,dz); if(d>=R) continue; const w=(1-d/R)*k*2.2; lx+=dx/(d+0.3)*w; lz+=dz/(d+0.3)*w; I+=w; }
  _sl[0]=lx; _sl[1]=lz; _sl[2]=I; return _sl; }

/* ================= LAWNS & TEMPORARY TRACKS ================= */
const TRK={n:900,i:0,pos:null,al:null,life:null,mesh:null};
(function(){ const n=TRK.n; TRK.pos=new Float32Array(n*12); TRK.al=new Float32Array(n*4); TRK.life=new Float32Array(n); const idx=new Uint16Array(n*6); for(let k=0;k<n;k++){ const v=k*4,o=k*6; idx[o]=v;idx[o+1]=v+1;idx[o+2]=v+2;idx[o+3]=v;idx[o+4]=v+2;idx[o+5]=v+3; }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(TRK.pos,3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('alpha',new THREE.BufferAttribute(TRK.al,1).setUsage(THREE.DynamicDrawUsage)); g.setIndex(new THREE.BufferAttribute(idx,1));
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uC:{value:new THREE.Color(0x0a1410)}},vertexShader:'attribute float alpha;varying float vA;void main(){vA=alpha;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform vec3 uC;varying float vA;void main(){if(vA<0.01)discard;gl_FragColor=vec4(uC,vA);}'});
  TRK.mesh=new THREE.Mesh(g,mat); TRK.mesh.frustumCulled=false; TRK.mesh.renderOrder=1; scene.add(TRK.mesh); })();
function onLawn(x,z){ const L=LOC.lawns; if(!L) return false; for(const r of L) if(x>r[0]&&x<r[2]&&z>r[1]&&z<r[3]) return true; return false; }
function addTrack(x,z,ang,w,l,a){ const k=TRK.i=(TRK.i+1)%TRK.n, p=TRK.pos, o=k*12, c=Math.cos(ang), s=Math.sin(ang), y=groundH(x,z)+0.035;
  const pts=[[-w,-l],[w,-l],[w,l],[-w,l]]; for(let q=0;q<4;q++){ const u=pts[q][0], v=pts[q][1]; p[o+q*3]=x+u*c+v*s; p[o+q*3+1]=y; p[o+q*3+2]=z-u*s+v*c; }
  TRK.life[k]=14; TRK.a0=TRK.a0||new Float32Array(TRK.n); TRK.a0[k]=a; for(let q=0;q<4;q++) TRK.al[k*4+q]=a; TRK.dirty=2; }
function tracksUpdate(dt){ let any=false; for(let k=0;k<TRK.n;k++){ if(TRK.life[k]<=0) continue; TRK.life[k]-=dt; const a=Math.max(0,Math.min(1,TRK.life[k]/5))*TRK.a0[k]; for(let q=0;q<4;q++) TRK.al[k*4+q]=a; any=true; }
  if(any||TRK.dirty){ TRK.mesh.geometry.attributes.alpha.needsUpdate=true; if(TRK.dirty){ TRK.mesh.geometry.attributes.position.needsUpdate=true; TRK.dirty--; } } }
function tracksClear(){ TRK.life.fill(0); TRK.al.fill(0); TRK.dirty=2; }
let trkDist=0;
function tankTracks(dt){ trkDist+=Math.abs(TK.vF)*dt; if(trkDist<0.32||TK.air) return; trkDist=0; const ch=Math.cos(TK.h), sh=Math.sin(TK.h);
  for(const [lx,lz] of WHL){ const x=TK.x+lx*ch+lz*sh, z=TK.z-lx*sh+lz*ch; if(onLawn(x,z)) addTrack(x,z,TK.h,0.22,0.2,0.42); } }
function footTrack(e,L){ if(onLawn(L.foot.x,L.foot.z)){ const s=e.type==='factory'?0.42:e.type==='bull'?0.28:0.18; addTrack(L.foot.x,L.foot.z,e.h,s,s,0.38); } }
function paintLawns(){ const L=LOC.lawns; if(!L||LOC.lawnPaint===false) return; const base=mix3(P.foliage,P.ground,0.45), dk=mix3(base,P.dark,0.25), lt=mix3(base,[1,1,1],0.1);
  for(const r of L){ gx.fillStyle=cssA(base,1); R_(r[0],r[1],r[2]-r[0],r[3]-r[1]); gx.fillStyle=cssA(dk,0.35); for(let z=r[1];z<r[3];z+=1.6) R_(r[0],z,r[2]-r[0],0.8);
    gx.fillStyle=cssA(lt,0.5); for(let k=0;k<(r[2]-r[0])*(r[3]-r[1])*0.7;k++){ const x=r[0]+hash3(k,r[0]|0,3)*(r[2]-r[0]), z=r[1]+hash3(k,r[1]|0,5)*(r[3]-r[1]); R_(x,z,0.12,0.3); }
    gx.strokeStyle=cssA(mix3(base,P.dark,0.5),0.8); gx.lineWidth=0.18*GS; gx.strokeRect(r[0]*GS,r[1]*GS,(r[2]-r[0])*GS,(r[3]-r[1])*GS); } }

/* ================= CURBS along painted roads (visual, no collision) ================= */
const ROADS=[]; let curbMesh=null;
function buildCurbs(){ if(curbMesh){ scene.remove(curbMesh); curbMesh.geometry.dispose(); curbMesh=null; } if(!ROADS.length) return;
  const segs=[]; const cut=(a0,a1,holes)=>{ let parts=[[a0,a1]]; for(const [h0,h1] of holes){ const nx=[]; for(const [p0,p1] of parts){ if(h1<=p0||h0>=p1){ nx.push([p0,p1]); continue; } if(h0>p0) nx.push([p0,h0]); if(h1<p1) nx.push([h1,p1]); } parts=nx; } return parts.filter(p=>p[1]-p[0]>0.6); };
  for(const r of ROADS){ for(const edge of [r.b0,r.b1]){ const holes=crossEdge(r,edge).map(o=>[o.b0+0.11,o.b1-0.11]);
    for(const [p0,p1] of cut(r.a0,r.a1,holes)) segs.push(r.v?[edge,p0,edge,p1]:[p0,edge,p1,edge]); } }
  /* the transition fields lie on top of the kerbs: leave them clear */
  { const c_=WX/2, G_={N:[c_-5,-1,c_+5,4.35],S:[c_-5,WZ-4.35,c_+5,WZ+1],W:[-1,c_-5,4.35,c_+5],E:[WX-4.35,c_-5,WX+1,c_+5]}, out=[];
    for(const sg of segs){ let parts=[sg]; for(const side in (LOC.exits||{})){ const g=G_[side]; const nx=[]; for(const q of parts){ const hz=q[1]===q[3];
        if(hz){ if(q[1]<g[1]-0.15||q[1]>g[3]+0.15){ nx.push(q); continue; } for(const [p0,p1] of cut(Math.min(q[0],q[2]),Math.max(q[0],q[2]),[[g[0],g[2]]])) nx.push([p0,q[1],p1,q[3]]); }
        else { if(q[0]<g[0]-0.15||q[0]>g[2]+0.15){ nx.push(q); continue; } for(const [p0,p1] of cut(Math.min(q[1],q[3]),Math.max(q[1],q[3]),[[g[1],g[3]]])) nx.push([q[0],p0,q[2],p1]); } } parts=nx; } for(const q of parts) out.push(q); }
    segs.length=0; for(const q of out) segs.push(q); }
  const geos=[]; for(const [x0,z0,x1,z1] of segs){ const L=Math.hypot(x1-x0,z1-z0), g=new THREE.BoxGeometry(x1!==x0?L:0.22,0.14,z1!==z0?L:0.22); g.translate((x0+x1)/2,0.07,(z0+z1)/2); geos.push(g); }
  const pos=[], nor=[]; for(const g of geos){ const gg=g.toNonIndexed(); pos.push(...gg.attributes.position.array); nor.push(...gg.attributes.normal.array); g.dispose(); gg.dispose(); }
  const bg=new THREE.BufferGeometry(); bg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); bg.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  const c=mix3(P.side,[1,1,1],0.28); curbMesh=new THREE.Mesh(bg,new THREE.MeshLambertMaterial({color:new THREE.Color(c[0],c[1],c[2])})); scene.add(curbMesh); }

/* ================= INTERIOR FLOORS ================= */
const FLOORS=[];
function paintFloors(){ for(const [x0,z0,x1,z1,k] of FLOORS){ if(k==='wood'){ gx.fillStyle=cssA(mix3(P.wood,[0.55,0.38,0.22],0.5),1); R_(x0,z0,x1-x0,z1-z0); gx.fillStyle='rgba(0,0,0,0.18)'; for(let z=z0;z<z1;z+=0.4) R_(x0,z,x1-x0,0.05); }
    else if(k==='tile'){ const a=mix3(P.mid,[1,1,1],0.35), b=mix3(P.mid,[1,1,1],0.15); for(let z=z0;z<z1;z+=0.8) for(let x=x0;x<x1;x+=0.8){ gx.fillStyle=cssA(((Math.round(x/0.8)+Math.round(z/0.8))&1)?a:b,1); R_(x,z,Math.min(0.8,x1-x),Math.min(0.8,z1-z)); } }
    else { gx.fillStyle=cssA(mix3(P.mid,P.side,0.5),1); R_(x0,z0,x1-x0,z1-z0); gx.strokeStyle='rgba(255,255,255,0.08)'; gx.lineWidth=1; gx.beginPath(); for(let x=x0;x<x1;x+=3){ gx.moveTo(x*GS,z0*GS); gx.lineTo(x*GS,z1*GS); } for(let z=z0;z<z1;z+=3){ gx.moveTo(x0*GS,z*GS); gx.lineTo(x1*GS,z*GS); } gx.stroke(); } } }

/* ================= JUICE: hit-stop, shockwaves, screen flash, popups, camera punch ================= */
let hitStop=0, camPunch=0;
const SHOCK=[]; const shockGeo=new THREE.RingGeometry(0.8,1,48); shockGeo.rotateX(-Math.PI/2);
for(let i=0;i<6;i++){ const m=new THREE.Mesh(shockGeo,new THREE.MeshBasicMaterial({color:0xffe0a0,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false})); m.visible=false; scene.add(m); SHOCK.push({m,t:0,ml:1,r:1}); }
let shi=0; function shockwave(x,z,r,col){ const s=SHOCK[shi=(shi+1)%SHOCK.length]; s.m.position.set(x,groundH(x,z)+0.12,z); s.t=s.ml=0.45; s.r=r; s.m.visible=true; s.m.material.color.setRGB(col[0],col[1],col[2]); }
function shockUpdate(dt){ for(const s of SHOCK){ if(s.t<=0) continue; s.t-=dt; const k=1-Math.max(0,s.t)/s.ml; s.m.scale.setScalar(0.3+k*s.r); s.m.material.opacity=(1-k)*0.9; if(s.t<=0) s.m.visible=false; } }
const flashEl=$('#flash'); let flashA=0, flashRed=false;
function screenFlash(a,red){ if(REDUCED) a*=0.4; if(a>flashA){ flashA=Math.min(0.8,a); flashRed=!!red; flashEl.classList.toggle('red',flashRed); } }
function flashUpdateUI(dt){ if(flashA<=0.005){ if(flashEl.style.opacity!=='0') flashEl.style.opacity='0'; return; } flashEl.style.opacity=flashA.toFixed(3); flashA*=Math.exp(-dt*7); }
const POPS=[]; function popText(x,y,z,txt,cls){ let el=POPS.find(p=>p.t<=0); if(!el){ const d=document.createElement('div'); d.className='pop'; document.body.appendChild(d); el={el:d,t:0}; POPS.push(el); }
  el.el.textContent=txt; el.el.className='pop '+(cls||''); el.x=x; el.y=y; el.z=z; el.t=1.1; el.el.hidden=false; }
function popsUpdate(dt){ for(const p of POPS){ if(p.t<=0) continue; p.t-=dt; if(p.t<=0){ p.el.hidden=true; continue; } const s=toScreen(p.x,p.y+(1.1-p.t)*1.6,p.z), k=p.t/1.1; p.el.style.transform=`translate(${s[0]}px,${s[1]}px) scale(${0.8+0.4*Math.min(1,(1.1-p.t)*6)})`; p.el.style.opacity=Math.min(1,k*2).toFixed(2); } }
function fxKill(e){ const big=e.type==='factory'||e.type==='hive'; hitStop=Math.max(hitStop,big?0.16:0.07); camPunch=Math.max(camPunch,big?1:0.45); shockwave(e.x,e.z,big?14:6,mix3(P.glow2,[1,1,1],0.3)); screenFlash(big?0.35:0.12,false);
  if(e.type!=='bomb') popText(e.x,e.y+1.2,e.z,big?'УНИЧТОЖЕН':'×','kill'); }

