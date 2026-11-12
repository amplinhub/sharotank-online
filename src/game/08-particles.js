/* ================= PARTICLES ================= */
const G=22, _p=new THREE.Vector3(), _q=new THREE.Quaternion(), _e=new THREE.Euler(), _s=new THREE.Vector3(), _m=new THREE.Matrix4(), _v=new THREE.Vector3();
const DEB={n:0,max:0,mesh:null,rr:0};
const DK=['px','py','pz','vx','vy','vz','ax','ay','az','wx','wy','wz','s','life','ml','rest'];
const debGeo=new THREE.BoxGeometry(1,1,1);
function debInit(max){ if(DEB.mesh){ scene.remove(DEB.mesh); DEB.mesh.dispose&&DEB.mesh.dispose(); }
  DEB.n=0; DEB.max=max; for(const k of DK) DEB[k]=new Float32Array(max); DEB.col=new Float32Array(max*3);
  const mesh=new THREE.InstancedMesh(debGeo,new THREE.MeshLambertMaterial({color:0xffffff}),max);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(max*3),3); mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  mesh.count=0; mesh.frustumCulled=false; DEB.mesh=mesh; scene.add(mesh); }
function debSpawn(x,y,z,vx,vy,vz,r,g,b,s){ const d=DEB; let i; if(d.n<d.max) i=d.n++; else { d.rr=(d.rr+1)%d.max; i=d.rr; }
  d.px[i]=x;d.py[i]=y;d.pz[i]=z;d.vx[i]=vx;d.vy[i]=vy;d.vz[i]=vz; d.ax[i]=rnd()*TAU;d.ay[i]=rnd()*TAU;d.az[i]=rnd()*TAU;
  d.wx[i]=(rnd()-0.5)*14;d.wy[i]=(rnd()-0.5)*14;d.wz[i]=(rnd()-0.5)*14; d.s[i]=s; d.ml[i]=d.life[i]=5+rnd()*5; d.rest[i]=0;
  d.col[i*3]=r;d.col[i*3+1]=g;d.col[i*3+2]=b; }
function debKill(i){ const d=DEB, l=--d.n; if(i!==l){ for(const k of DK) d[k][i]=d[k][l]; d.col[i*3]=d.col[l*3];d.col[i*3+1]=d.col[l*3+1];d.col[i*3+2]=d.col[l*3+2]; } }
function debUpdate(dt){ const d=DEB, arr=d.mesh.instanceMatrix.array, ca=d.mesh.instanceColor.array; let i=0;
  while(i<d.n){ d.life[i]-=dt;
    if(d.life[i]<=0){ if(d.rest[i]) addMark({t:1,x:d.px[i],z:d.pz[i],s:d.s[i],c:[d.col[i*3]*0.8,d.col[i*3+1]*0.8,d.col[i*3+2]*0.8]}); debKill(i); continue; }
    if(!d.rest[i]){ d.vy[i]-=G*dt; const ox=d.px[i],oy=d.py[i],oz=d.pz[i]; d.px[i]+=d.vx[i]*dt; d.py[i]+=d.vy[i]*dt; d.pz[i]+=d.vz[i]*dt;
      const hs=d.s[i]*0.5; const cx=Math.floor(d.px[i]/VS), cy=Math.floor(d.py[i]/VS), cz=Math.floor(d.pz[i]/VS);
      if(cy>=0&&get(cx,cy,cz)){ const ocy=Math.floor(oy/VS);
        if(ocy>cy&&d.vy[i]<0){ d.py[i]=(cy+1)*VS+hs; if(d.vy[i]>-2){ d.vy[i]=0; d.vx[i]*=0.5; d.vz[i]*=0.5; if(d.vx[i]*d.vx[i]+d.vz[i]*d.vz[i]<0.1) d.rest[i]=1; } else { d.vy[i]*=-0.3; d.vx[i]*=0.6; d.vz[i]*=0.6; } }
        else { d.px[i]=ox; d.pz[i]=oz; d.py[i]=oy; d.vx[i]*=-0.35; d.vz[i]*=-0.35; } }
      const gy=groundH(d.px[i],d.pz[i]);
      if(d.py[i]<gy+hs){
        if(gy<-0.25&&inWater(d.px[i],d.pz[i])){ if(rnd()<0.4) splashSmall(d.px[i],d.pz[i]); debKill(i); continue; }
        d.py[i]=gy+hs; if(d.vy[i]<-1.6){ d.vy[i]*=-0.32; d.vx[i]*=0.62; d.vz[i]*=0.62; d.wx[i]*=0.6; d.wz[i]*=0.6; }
        else { d.vy[i]=0; const fr=Math.pow(0.004,dt); d.vx[i]*=fr; d.vz[i]*=fr; d.wx[i]*=fr; d.wy[i]*=fr; d.wz[i]*=fr; if(d.vx[i]*d.vx[i]+d.vz[i]*d.vz[i]<0.02){ d.rest[i]=1; d.ax[i]=Math.round(d.ax[i]/(Math.PI/2))*(Math.PI/2); d.az[i]=Math.round(d.az[i]/(Math.PI/2))*(Math.PI/2); } } }
      d.ax[i]+=d.wx[i]*dt; d.ay[i]+=d.wy[i]*dt; d.az[i]+=d.wz[i]*dt; }
    const k=Math.min(1,d.life[i]/0.7); _p.set(d.px[i],d.py[i],d.pz[i]); _q.setFromEuler(_e.set(d.ax[i],d.ay[i],d.az[i])); _s.setScalar(d.s[i]*k);
    _m.compose(_p,_q,_s); _m.toArray(arr,i*16); ca[i*3]=d.col[i*3]; ca[i*3+1]=d.col[i*3+1]; ca[i*3+2]=d.col[i*3+2]; i++; }
  d.mesh.count=d.n; d.mesh.instanceMatrix.needsUpdate=true; d.mesh.instanceColor.needsUpdate=true; }
class Lines{ constructor(max){ this.max=max; this.pos=new Float32Array(max*6); this.col=new Float32Array(max*6); this.n=0;
    const g=new THREE.BufferGeometry(); this.pa=new THREE.BufferAttribute(this.pos,3).setUsage(THREE.DynamicDrawUsage); this.ca=new THREE.BufferAttribute(this.col,3).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position',this.pa); g.setAttribute('color',this.ca); this.geo=g;
    this.mesh=new THREE.LineSegments(g,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})); this.mesh.frustumCulled=false; scene.add(this.mesh); }
  begin(){ this.n=0; }
  push(x1,y1,z1,x2,y2,z2,r,g,b,f){ if(this.n>=this.max) return; const o=this.n*6, p=this.pos, c_=this.col; p[o]=x1;p[o+1]=y1;p[o+2]=z1;p[o+3]=x2;p[o+4]=y2;p[o+5]=z2;
    c_[o]=r;c_[o+1]=g;c_[o+2]=b;c_[o+3]=r*f;c_[o+4]=g*f;c_[o+5]=b*f; this.n++; }
  end(){ this.geo.setDrawRange(0,this.n*2); this.pa.needsUpdate=true; this.ca.needsUpdate=true; } }
const LINES=new Lines(2600);
const SPK={n:0,max:0}; const SK=['px','py','pz','vx','vy','vz','life','ml','r','g','b'];
function spkInit(max){ SPK.n=0; SPK.max=max; for(const k of SK) SPK[k]=new Float32Array(max); }
function spark(x,y,z,vx,vy,vz,r,g,b,life){ const s=SPK; if(s.n>=s.max) return; const i=s.n++; s.px[i]=x;s.py[i]=y;s.pz[i]=z;s.vx[i]=vx;s.vy[i]=vy;s.vz[i]=vz;s.r[i]=r;s.g[i]=g;s.b[i]=b;s.life[i]=s.ml[i]=life; }
function spkUpdate(dt){ const s=SPK; let i=0; while(i<s.n){ s.life[i]-=dt; if(s.life[i]<=0){ const l=--s.n; if(i!==l) for(const k of SK) s[k][i]=s[k][l]; continue; }
    s.vy[i]-=16*dt; const dr=Math.pow(0.35,dt); s.vx[i]*=dr; s.vy[i]*=dr; s.vz[i]*=dr; s.px[i]+=s.vx[i]*dt; s.py[i]+=s.vy[i]*dt; s.pz[i]+=s.vz[i]*dt;
    if(s.py[i]<0.02){ s.py[i]=0.02; s.vy[i]*=-0.4; s.vx[i]*=0.6; s.vz[i]*=0.6; }
    const f=s.life[i]/s.ml[i], k=0.028; LINES.push(s.px[i],s.py[i],s.pz[i],s.px[i]-s.vx[i]*k,s.py[i]-s.vy[i]*k,s.pz[i]-s.vz[i]*k,s.r[i]*f,s.g[i]*f,s.b[i]*f,0.15); i++; } }
class Puffs{ constructor(max,additive){ this.max=max; this.n=0; for(const k of ['px','py','pz','vx','vy','vz','sz','gr','life','ml','a0','r','g','b']) this[k]=new Float32Array(max);
    this.pos=new Float32Array(max*3); this.size=new Float32Array(max); this.alpha=new Float32Array(max); this.colr=new Float32Array(max*3);
    const g=new THREE.BufferGeometry(); this.aP=new THREE.BufferAttribute(this.pos,3).setUsage(THREE.DynamicDrawUsage); this.aS=new THREE.BufferAttribute(this.size,1).setUsage(THREE.DynamicDrawUsage);
    this.aA=new THREE.BufferAttribute(this.alpha,1).setUsage(THREE.DynamicDrawUsage); this.aC=new THREE.BufferAttribute(this.colr,3).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position',this.aP); g.setAttribute('psize',this.aS); g.setAttribute('palpha',this.aA); g.setAttribute('pcolor',this.aC); this.geo=g;
    this.mat=new THREE.ShaderMaterial({uniforms:{uScale:{value:600}},transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,
      vertexShader:'attribute float psize;attribute float palpha;attribute vec3 pcolor;uniform float uScale;varying vec3 vC;varying float vA;void main(){vC=pcolor;vA=palpha;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=psize*uScale/-mv.z;gl_Position=projectionMatrix*mv;}',
      fragmentShader:'varying vec3 vC;varying float vA;void main(){vec2 d=gl_PointCoord-0.5;float r=length(d);if(r>0.5)discard;float a=smoothstep(0.5,0.05,r);gl_FragColor=vec4(vC,a*vA);}'});
    this.mesh=new THREE.Points(g,this.mat); this.mesh.frustumCulled=false; scene.add(this.mesh); }
  spawn(x,y,z,vx,vy,vz,sz,gr,life,a0,r,g,b){ let i; if(this.n<this.max) i=this.n++; else i=(Math.random()*this.max)|0;
    this.px[i]=x;this.py[i]=y;this.pz[i]=z;this.vx[i]=vx;this.vy[i]=vy;this.vz[i]=vz;this.sz[i]=sz;this.gr[i]=gr;this.life[i]=this.ml[i]=life;this.a0[i]=a0;this.r[i]=r;this.g[i]=g;this.b[i]=b; }
  update(dt){ let i=0; const K=['px','py','pz','vx','vy','vz','sz','gr','life','ml','a0','r','g','b'];
    while(i<this.n){ this.life[i]-=dt; if(this.life[i]<=0){ const l=--this.n; if(i!==l) for(const k of K) this[k][i]=this[k][l]; continue; }
      const dr=Math.pow(0.25,dt); this.vx[i]*=dr; this.vy[i]*=dr; this.vz[i]*=dr; this.px[i]+=this.vx[i]*dt; this.py[i]+=this.vy[i]*dt; this.pz[i]+=this.vz[i]*dt; this.sz[i]+=this.gr[i]*dt;
      const f=this.life[i]/this.ml[i]; this.pos[i*3]=this.px[i]; this.pos[i*3+1]=this.py[i]; this.pos[i*3+2]=this.pz[i]; this.size[i]=this.sz[i]; this.alpha[i]=this.a0[i]*f*f;
      this.colr[i*3]=this.r[i]; this.colr[i*3+1]=this.g[i]; this.colr[i*3+2]=this.b[i]; i++; }
    this.geo.setDrawRange(0,this.n); this.aP.needsUpdate=this.aS.needsUpdate=this.aA.needsUpdate=this.aC.needsUpdate=true; } }
let SMOKE=null, FIRE=null;
const flashPools=[]; for(let i=0;i<5;i++){ const m=new THREE.Mesh(poolGeo,new THREE.MeshBasicMaterial({map:TEX_SOFT,color:0xffaa33,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0})); m.visible=false; scene.add(m); flashPools.push({m,t:0,ml:0.01,s:1}); }
let fpi=0; function groundFlash(x,z,r,colArr,life){ const f=flashPools[fpi=(fpi+1)%flashPools.length]; f.m.position.set(x,0.06,z); f.m.material.color.setRGB(colArr[0],colArr[1],colArr[2]); f.t=f.ml=life; f.s=r; f.m.visible=true; }
function flashUpdate(dt){ for(const f of flashPools){ if(f.t<=0) continue; f.t-=dt; const k=Math.max(0,f.t/f.ml); f.m.material.opacity=0.9*k; f.m.scale.setScalar(f.s*(1.4-0.4*k)); if(f.t<=0) f.m.visible=false; } }
function splashSmall(x,z){ const w=mix3(P.glass,[1,1,1],0.3); for(let k=0;k<3;k++) spark(x,0,z,(rnd()-0.5)*3,2+rnd()*3,(rnd()-0.5)*3,w[0],w[1],w[2],0.4); }
function splashBig(x,z,k){ const w=mix3(P.glass,[1,1,1],0.3); for(let n=0;n<40*k;n++){ const a=rnd()*TAU, s=2+rnd()*7*k; spark(x,0,z,Math.cos(a)*s,5+rnd()*9*k,Math.sin(a)*s,w[0],w[1],w[2],0.6+rnd()*0.6); }
  for(let n=0;n<10*k;n++) SMOKE.spawn(x+(rnd()-0.5)*2*k,0.3,z+(rnd()-0.5)*2*k,(rnd()-0.5)*2,2+rnd()*3,(rnd()-0.5)*2,1.2*k,2,0.9,0.55,w[0]*0.85,w[1]*0.9,w[2]); }

