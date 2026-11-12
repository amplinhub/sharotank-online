/* ================= v9: idle turret · formwork · traffic lights · repair drones · artillery · flag · evacuation · ambience ================= */
/* ---- turret follows the driving direction when the player leaves the aim alone for 2 s ---- */
const AIMIDLE={t:0,on:false,dt:0};
function aimActivity(){ AIMIDLE.t=0; AIMIDLE.on=false; }
function aimIdleTick(dt,inp){ AIMIDLE.dt=dt; if(inp.fire||TCH.active||(aimMode==='mouse'&&mouse.down)) aimActivity(); else AIMIDLE.t+=dt;
  if(!AIMIDLE.on&&AIMIDLE.t>2&&Math.hypot(TK.vx,TK.vz)>1.5&&!AIM.manual){ AIMIDLE.on=true; if(aimMode==='mouse') AIM.yawRel=TK.tYaw; } if(AIM.manual) AIMIDLE.on=false; }
function aimIdleApply(){ const sp=Math.hypot(TK.vx,TK.vz); if(sp>0.8) AIM.yawRel=turnTo(AIM.yawRel,Math.atan2(TK.vx,TK.vz),AIMIDLE.dt*2.6);
  AIM.dist=13; const dx=Math.sin(AIM.yawRel), dz=Math.cos(AIM.yawRel);
  if(raycast(TK.x+dx*1.6,1.2+TK.y,TK.z+dz*1.6,dx,0,dz,AIM.dist)){ AIM.x=TK.x+dx*(1.6+RH.t); AIM.y=1.2+TK.y; AIM.z=TK.z+dz*(1.6+RH.t); }
  else { AIM.x=TK.x+dx*AIM.dist; AIM.y=0; AIM.z=TK.z+dz*AIM.dist; } AIM.lockE=null; }

/* ---- board-formed concrete apron around every building ---- */
function paintFormwork(){ if(!FLOORS.length) return; const W=1.1, base=mix3(mix3(P.mid,P.side,0.5),[1,1,1],0.12), seam='rgba(0,0,0,0.2)', lite=cssA(mix3(base,[1,1,1],0.18),0.55);
  gx.save(); gx.beginPath(); gx.rect(0,0,GC.width,GC.height); for(const r of ROADS){ if(r.v) gx.rect(r.b0*GS,r.a0*GS,(r.b1-r.b0)*GS,(r.a1-r.a0)*GS); else gx.rect(r.a0*GS,r.b0*GS,(r.a1-r.a0)*GS,(r.b1-r.b0)*GS); }
  for(const w of LOC.water) gx.rect(w[0]*GS,w[1]*GS,(w[2]-w[0])*GS,(w[3]-w[1])*GS); gx.clip('evenodd');
  for(const [x0,z0,x1,z1] of FLOORS){ const sides=[[x0-W,z0-W,x1+W,z0,0],[x0-W,z1,x1+W,z1+W,0],[x0-W,z0,x0,z1,1],[x1,z0,x1+W,z1,1]];
    for(const [a,b,c,d,vert] of sides){ gx.fillStyle=cssA(base,1); R_(a,b,c-a,d-b);
      const L=vert?d-b:c-a, T=vert?c-a:d-b, rows=Math.max(3,Math.round(T/0.22)), rw=T/rows;
      for(let k=0;k<rows;k++){ const o=k*rw; gx.fillStyle=k%2?lite:'rgba(0,0,0,0.05)'; if(vert) R_(a+o,b,rw,L); else R_(a,b+o,L,rw);
        gx.fillStyle=seam; if(vert) R_(a+o,b,0.035,L); else R_(a,b+o,L,0.035);
        for(let s=(k%2)*1.2+0.4;s<L;s+=2.4){ if(vert) R_(a+o,b+s,rw,0.04); else R_(a+s,b+o,0.04,rw); } }
      gx.fillStyle='rgba(0,0,0,0.38)'; for(let s=0.3;s<L;s+=0.6){ for(const f of [0.3,0.7]){ if(vert) R_(a+T*f-0.05,b+s-0.05,0.1,0.1); else R_(a+s-0.05,b+T*f-0.05,0.1,0.1); } }
      gx.strokeStyle='rgba(0,0,0,0.3)'; gx.lineWidth=0.06*GS; gx.strokeRect(a*GS,b*GS,(c-a)*GS,(d-b)*GS); } }
  gx.restore(); }

/* ---- traffic lights on crossings: opposite corners, all in sync ---- */
const TLS={lamps:[],phase:-1};
const tlLensGeo=new THREE.SphereGeometry(0.24,10,8);
const TL_COL=[[1,0.16,0.12],[1,0.78,0.12],[0.2,1,0.4]];
function tlPhase(t){ const c=t%66; return c<30?2:c<33?1:c<63?0:1; }
function buildTrafficLights(restored){ TLS.lamps.length=0; TLS.phase=-1; if(LOC_ID==='camp') return; const H=ROADS.filter(r=>!r.v), V=ROADS.filter(r=>r.v), done=[];
  const free=(x0,z0,x1,z1,y0,y1)=>{ for(let x=Math.floor(x0/VS);x<=Math.floor(x1/VS);x++) for(let z=Math.floor(z0/VS);z<=Math.floor(z1/VS);z++) for(let y=Math.floor(y0/VS);y<=Math.floor(y1/VS);y++) if(get(x,y,z)) return false; return true; };
  for(const h of H) for(const v of V){ if(v.b0<h.a0-0.5||v.b1>h.a1+0.5||h.b0<v.a0-0.5||h.b1>v.a1+0.5) continue; const cx=(v.b0+v.b1)/2, cz=(h.b0+h.b1)/2; if(done.some(p=>Math.hypot(p[0]-cx,p[1]-cz)<4)) continue; done.push([cx,cz]);
    for(const [px,pz,dir] of [[v.b0-1.1,h.b0-1.1,1],[v.b1+1.1,h.b1+1.1,-1]]){ if(px<2||pz<2||px>WX-2||pz>WZ-2||inWater(px,pz)) continue; const ax=px+dir*2.6, t=Math.max(VS,0.24)/2;
      if(!restored&&!free(Math.min(px,ax)-0.3,pz-0.4,Math.max(px,ax)+0.3,pz+0.4,0.1,4.8)) continue;
      if(!restored){ box(px-t,0,pz-t,px+t,4.6,pz+t,M.METAL); box(Math.min(px,ax)-t,4.4,pz-t,Math.max(px,ax)+t,4.62,pz+t,M.METAL); box(ax-dir*0.1-0.75,3.95,pz-0.22,ax-dir*0.1+0.75,4.42,pz+0.22,M.DARK); box(px-0.24,0,pz-0.24,px+0.24,0.25,pz+0.24,M.MID);
        for(const [x,y,z] of [[px,0,pz],[px,4.5,pz],[ax,4.2,pz]]) markDirty(Math.floor(x/VS),Math.floor(y/VS),Math.floor(z/VS)); }
      for(let k=0;k<3;k++){ const l={x:ax-dir*0.1+(k-1)*0.55*dir,y:4.88,z:pz,r:0,col:'tl',size:0.75,pool:false,tl:k,rgb:TL_COL[k]}; l.mesh=addExtra(new THREE.Mesh(tlLensGeo,new THREE.MeshBasicMaterial({color:0x000000}))); l.mesh.position.set(l.x,l.y-0.05,l.z); LAMPS.push(l); TLS.lamps.push(l); } } }
  if(TLS.lamps.length) makeLampVisuals(); }
function tlUpdate(t){ if(!TLS.lamps.length) return; for(const l of TLS.lamps) l.mesh.visible=l.alive!==false; const ph=tlPhase(t); if(ph===TLS.phase) return; TLS.phase=ph;
  for(const l of TLS.lamps){ const on=l.tl===ph; l.rgb=on?TL_COL[l.tl]:TL_COL[l.tl].map(v=>v*0.42); l.size=on?2.6:0.5; l.mesh.material.color.setRGB(l.rgb[0],l.rgb[1],l.rgb[2]); } lampMatrices(); lampColors(); }

/* ---- repair drones: hover behind the tank and weld damaged sides ---- */
const RDR={list:[]};
const rdMat={body:new THREE.MeshToonMaterial({color:0xd8dce2,gradientMap:gradTex}),dark:new THREE.MeshToonMaterial({color:0x262c35,gradientMap:gradTex}),acc:new THREE.MeshToonMaterial({color:0xffc94a,gradientMap:gradTex}),
  rotor:new THREE.MeshBasicMaterial({color:0x0b0f14,transparent:true,opacity:0.32,depthWrite:false}),tip:new THREE.MeshBasicMaterial({color:0xbff4ff}),red:new THREE.MeshBasicMaterial({color:0xff4030}),grn:new THREE.MeshBasicMaterial({color:0x40ff8a})};
const rdGeo={box:new THREE.BoxGeometry(1,1,1),cyl:new THREE.CylinderGeometry(1,1,1,12),disc:new THREE.CylinderGeometry(1,1,0.02,18),sph:new THREE.SphereGeometry(1,10,8),cable:new THREE.BoxGeometry(0.035,1,0.035).translate(0,-0.5,0)};
const RD_PARTS=[[0,1.0,1.8],[0,1.0,-1.8],[1.3,0.95,0],[-1.3,0.95,0],[0,1.9,-0.2]];
function rdMake(){ const g=new THREE.Group(), add=(geo,mat,x,y,z,sx,sy,sz,par)=>{ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.scale.set(sx,sy,sz); (par||g).add(m); return m; };
  add(rdGeo.box,rdMat.body,0,0,0,0.62,0.2,0.62); add(rdGeo.box,rdMat.dark,0,0.13,0,0.4,0.08,0.4); add(rdGeo.box,rdMat.acc,0,0,0.315,0.5,0.08,0.02);
  for(const a of [Math.PI/4,-Math.PI/4]){ const arm=add(rdGeo.box,rdMat.dark,0,0.04,0,1.55,0.06,0.09); arm.rotation.y=a; }
  const rotors=[]; for(const [x,z] of [[0.55,0.55],[-0.55,0.55],[0.55,-0.55],[-0.55,-0.55]]){ add(rdGeo.cyl,rdMat.dark,x,0.1,z,0.07,0.12,0.07); rotors.push(add(rdGeo.disc,rdMat.rotor,x,0.17,z,0.36,1,0.36)); }
  add(rdGeo.sph,rdMat.red,0.3,-0.06,0.3,0.04,0.04,0.04); add(rdGeo.sph,rdMat.grn,-0.3,-0.06,0.3,0.04,0.04,0.04);
  add(rdGeo.box,rdMat.dark,0,-0.13,0,0.46,0.08,0.3); add(rdGeo.cyl,rdMat.dark,0,-0.06,0.33,0.07,0.08,0.07); add(rdGeo.sph,rdMat.tip,0,-0.06,0.38,0.035,0.035,0.035);
  for(const s of [-1,1]){ add(rdGeo.box,rdMat.body,s*0.33,0.02,0,0.04,0.16,0.5); add(rdGeo.box,rdMat.acc,s*0.35,0.02,0.12,0.02,0.05,0.2); }
  let tip=null; const arms=[];
  for(const s of [-1,1]){ const sh=new THREE.Group(); sh.position.set(s*0.2,-0.16,0.06); g.add(sh); add(rdGeo.sph,rdMat.dark,0,0,0,0.07,0.07,0.07,sh);
    add(rdGeo.box,rdMat.body,0,-0.2,0,0.08,0.4,0.08,sh); add(rdGeo.box,rdMat.dark,0,-0.2,0.045,0.03,0.3,0.02,sh);
    const el=new THREE.Group(); el.position.y=-0.4; sh.add(el); add(rdGeo.sph,rdMat.acc,0,0,0,0.06,0.06,0.06,el); add(rdGeo.box,rdMat.dark,0,-0.19,0,0.06,0.38,0.06,el);
    const hd=new THREE.Group(); hd.position.y=-0.4; el.add(hd);
    if(s>0){ add(rdGeo.cyl,rdMat.acc,0,-0.04,0,0.06,0.12,0.06,hd); add(rdGeo.cyl,rdMat.dark,0,-0.16,0,0.025,0.16,0.025,hd); tip=add(rdGeo.sph,rdMat.tip,0,-0.26,0,0.055,0.055,0.055,hd); tip.visible=false; }
    else { add(rdGeo.box,rdMat.dark,0,-0.03,0,0.12,0.06,0.08,hd); for(const c of [-1,1]){ const f=add(rdGeo.box,rdMat.acc,c*0.045,-0.11,0,0.025,0.14,0.05,hd); f.rotation.z=c*0.25; } }
    arms.push({sh,el,ax:0,az:0,vx:0,vz:0,e:0,ev:0,s}); }
  scene.add(g); return {g,arms,pv:new THREE.Vector3(),rotors,tip,p:new THREE.Vector3(TK.x,TK.y+3.5,TK.z),v:new THREE.Vector3(),st:'follow',cool:1+rnd(),part:0,wt:0,loc:LOC_ID,dead:false,rd:true,snd:0}; }
function rdLocal(lx,ly,lz,out){ const ch=Math.cos(TK.h), sh=Math.sin(TK.h); out.set(TK.x+lx*ch+lz*sh,TK.y+ly,TK.z-lx*sh+lz*ch); return out; }
const _rt=new THREE.Vector3(), _rp=new THREE.Vector3();
function rdUpdate(dt,t){ const want=Math.max(0,Math.min(2,UP.rdr|0)); while(RDR.list.length<want) RDR.list.push(rdMake()); while(RDR.list.length>want){ const d=RDR.list.pop(); scene.remove(d.g); }
  const need=!TK.dead&&(TK.hp<maxHP()-0.3||TK.dmgS.some(v=>v>0.01))&&Math.hypot(TK.vx,TK.vz)<ENG_V[UP.engine]*chs().spd*0.7, still=Math.hypot(TK.vx,TK.vz)<0.6, rate=still?1.8:1;
  RDR.list.forEach((d,i)=>{ d.g.visible=!transit; if(d.loc!==LOC_ID){ d.loc=LOC_ID; rdLocal(i?-2.4:2.4,3.4,-1.8,d.p); d.v.set(0,0,0); d.st='follow'; }
    d.cool-=dt; d.snd-=dt;
    if(d.st==='follow'&&need&&d.cool<=0){ let best=-1, bv=-1; TK.dmgS.forEach((v,k)=>{ const s=v+rnd()*0.08; if(s>bv&&!RDR.list.some(o=>o!==d&&o.st!=='follow'&&o.part===k)){ bv=s; best=k; } }); d.part=best<0?(rnd()*5)|0:best; d.st='go'; d.goT=0; }
    if(d.st!=='follow'&&!need){ d.st='follow'; d.cool=1; }
    const P_=RD_PARTS[d.part]; let tx,ty,tz;
    if(d.st==='follow'){ rdLocal(i?-2.3:2.3,3.3+Math.sin(t*1.7+i*2)*0.18,-1.9,_rt); }
    else { rdLocal(P_[0],P_[1],P_[2],_rp); _rt.copy(_rp); _rt.y+=1.12+(d.st==='go'?0.3:0); }
    tx=_rt.x; ty=_rt.y; tz=_rt.z; const dx=tx-d.p.x, dy=ty-d.p.y, dz=tz-d.p.z, dist=Math.hypot(dx,dy,dz);
    const k=d.st==='weld'?14:4.2, mx=d.st==='follow'?16:11; d.v.x+=(dx*k-d.v.x)*Math.min(1,dt*6); d.v.y+=(dy*k-d.v.y)*Math.min(1,dt*6); d.v.z+=(dz*k-d.v.z)*Math.min(1,dt*6);
    const vl=d.v.length(); if(vl>mx) d.v.multiplyScalar(mx/vl); d.p.addScaledVector(d.v,dt);
    if(d.st==='go'){ d.goT+=dt; if(dist<0.45||d.goT>3){ d.st='weld'; d.wt=1.1+rnd()*0.9; } }
    else if(d.st==='weld'){ d.wt-=dt; const tip=_rp; for(let n=0;n<3;n++) spark(tip.x,tip.y+0.05,tip.z,(rnd()-0.5)*7,1+rnd()*4,(rnd()-0.5)*7,1,0.85+rnd()*0.15,0.5+rnd()*0.4,0.22+rnd()*0.25);
      if(rnd()<0.5) FIRE.spawn(tip.x,tip.y+0.05,tip.z,0,0.3,0,0.35+rnd()*0.25,1,0.06,1,0.75,0.95,1); if(rnd()<0.08) SMOKE.spawn(tip.x,tip.y+0.1,tip.z,0,0.8,0,0.25,1.2,0.6,0.25,0.75,0.78,0.82);
      if(d.snd<=0){ d.snd=0.09+rnd()*0.08; sNz(0.08,'highpass',3000+rnd()*2500,1.2,0.05); }
      TK.hp=Math.min(maxHP(),TK.hp+1.6*rate*dt); TK.dmgS[d.part]=Math.max(0,TK.dmgS[d.part]-0.05*rate*dt);
      if(d.wt<=0){ d.st=rnd()<0.6&&need?'go':'follow'; d.goT=0; d.cool=0.4+rnd()*1.1; if(d.st==='go') d.part=(rnd()<0.5?d.part:(rnd()*5)|0); } }
    d.tip.visible=d.st==='weld'&&rnd()<0.8; d.g.position.copy(d.p); d.g.rotation.y=turnTo(d.g.rotation.y,TK.h,dt*3);
    const ch=Math.cos(d.g.rotation.y), sh=Math.sin(d.g.rotation.y), lvx=d.v.x*ch-d.v.z*sh, lvz=d.v.x*sh+d.v.z*ch;
    d.g.rotation.x=clamp(lvz*0.035,-0.4,0.4); d.g.rotation.z=clamp(-lvx*0.035,-0.4,0.4);
    /* arms: damped pendulums driven by the drone's acceleration; elbows whip behind the shoulders */
    const ax_=(d.v.x-d.pv.x)/Math.max(dt,1e-3), az_=(d.v.z-d.pv.z)/Math.max(dt,1e-3); d.pv.copy(d.v); const lax=ax_*ch-az_*sh, laz=ax_*sh+az_*ch, wld=d.st==='weld';
    for(const A of d.arms){ const tx=wld?(A.s>0?0.05+Math.sin(t*23)*0.05:-0.5):-d.g.rotation.x+clamp(laz*0.03,-0.9,0.9), tz=wld?(A.s>0?0:A.s*0.25):-d.g.rotation.z+clamp(-lax*0.03,-0.9,0.9);
      A.vx+=((tx-A.ax)*55-A.vx*5.5)*dt; A.vz+=((tz-A.az)*55-A.vz*5.5)*dt; A.ax+=A.vx*dt; A.az+=A.vz*dt; A.sh.rotation.set(A.ax,0,A.az);
      const te=wld?(A.s>0?-0.15:0.9):clamp(-A.vx*0.12,-0.3,0.9)+0.12; A.ev+=((te-A.e)*70-A.ev*6)*dt; A.e+=A.ev*dt; A.el.rotation.x=-Math.abs(A.e)*(A.s>0&&wld?0.3:1); }
    for(const r of d.rotors) r.rotation.y+=dt*40;
    if(!LOC.safe) shadowAdd(d.p.x,d.p.z,0.9,d.p.y-groundH(d.p.x,d.p.z),0.35); }); }
function rdDie(d,ux,uz){ if(d.dead) return; d.dead=true; const i=RDR.list.indexOf(d); if(i>=0) RDR.list.splice(i,1); UP.rdr=Math.max(0,Math.min(UP.rdr|0,RDR.list.length)); if(UP.per&&UP.per[UP.tank]) UP.per[UP.tank].rdr=UP.rdr; save();
  const p=d.p; for(let k=0;k<6;k++) FIRE.spawn(p.x,p.y,p.z,(rnd()-0.5)*4,rnd()*3,(rnd()-0.5)*4,0.8+rnd()*0.5,2,0.25,1,1,0.7,0.3); sparkBurst(p.x,p.y,p.z,18); sfxGlass(0.6); sfxThud(0.5);
  for(const c of d.g.children.slice(0,6)){ const m=new THREE.Mesh(c.geometry||rdGeo.box,c.material||rdMat.dark); c.getWorldPosition(m.position); m.scale.copy(c.scale); scene.add(m); EXTRAS.push(m); GIBS.push(gibOf(m,ux*4+(rnd()-0.5)*5,2+rnd()*4,uz*4+(rnd()-0.5)*5,14)); }
  scene.remove(d.g); toast('Ремонтный дрон сбит · новый — в гараже'); }

/* ---- artillery strike: three distant salvos, shrinking red circles, shells drop in their centres ---- */
const ART={active:false,t:0,salvo:0,circles:[],cnt:null,pts:[]};
const artRingGeo=new THREE.RingGeometry(0.9,1,56); artRingGeo.rotateX(-Math.PI/2); const artDiscGeo=new THREE.CircleGeometry(1,40); artDiscGeo.rotateX(-Math.PI/2);
const artTickGeo=new THREE.PlaneGeometry(0.12,0.7); artTickGeo.rotateX(-Math.PI/2);
function useArt(){ if(!kitAvail('art')) return; ST.kits.art--; save(); ART.active=true; ART.t=0; ART.salvo=0; ART.cnt=new Map(); ART.pts=[]; artPlan(); toast('Артиллерия на связи · три залпа'); sO(900,1200,0.12,0.06,'square'); }
function artGun(){ sNz(1.1,'lowpass',150,0.7,0.5,0.01); sO(58,26,0.8,0.32); setTimeout(()=>sNz(0.9,'lowpass',110,0.7,0.18,0.05),260); }
function artTargets(){ return ENEMIES.filter(e=>!e.dead&&e.lockable!==false&&e.state!=='fly'&&Math.hypot(e.x-TK.x,e.z-TK.z)<34).sort((a,b)=>Math.hypot(a.x-TK.x,a.z-TK.z)-Math.hypot(b.x-TK.x,b.z-TK.z)).slice(0,3); }
function artPlan(){ const es=artTargets(), q=[]; if(es.length){ const per=es.map(()=>Math.floor(6/es.length)); for(let k=0;k<6%es.length;k++) per[k]++; for(let r=0;r<6;r++) for(let k=0;k<es.length;k++) if(per[k]>0&&q.filter(x=>x===es[k]).length<per[k]){ q.push(es[k]); if(q.length>=6) break; } while(q.length<6) q.push(es[0]); } ART.plan=q; }
function artSpot(){ const ok=(x,z,sep)=>x>3&&z>3&&x<WX-3&&z<WZ-3&&!inWater(x,z)&&Math.hypot(x-TK.x,z-TK.z)>4.5&&ART.pts.every(p=>Math.hypot(p[0]-x,p[1]-z)>sep);
  let e=ART.plan&&ART.plan.length?ART.plan.shift():null; if(e&&e.dead){ const alt=artTargets(); e=alt.length?alt[(rnd()*alt.length)|0]:null; }
  if(e){ const n=ART.cnt.get(e)||0; for(let k=0;k<16;k++){ let x=e.x, z=e.z; if(n||k){ const a=rnd()*TAU, r=2.2+n*0.5+k*0.15+rnd()*1.2; x+=(e.vx||0)*1.2+Math.cos(a)*r; z+=(e.vz||0)*1.2+Math.sin(a)*r; } if(ok(x,z,2.4)){ ART.cnt.set(e,n+1); return [x,z,e]; } } }
  for(let k=0;k<40;k++){ const a=rnd()*TAU, r=6+rnd()*16, x=TK.x+Math.cos(a)*r, z=TK.z+Math.sin(a)*r; if(ok(x,z,3.4)) return [x,z,null]; } return null; }
function artCircle(){ const s=artSpot(); if(!s) return; ART.pts.push([s[0],s[1]]); const g=new THREE.Group(); const col=0xff2a1f;
  const ring=new THREE.Mesh(artRingGeo,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.95,depthWrite:false})); const disc=new THREE.Mesh(artDiscGeo,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.14,depthWrite:false}));
  g.add(disc,ring); for(let k=0;k<4;k++){ const tk=new THREE.Mesh(artTickGeo,ring.material); const a=k*Math.PI/2; tk.position.set(Math.sin(a)*1.25,0,Math.cos(a)*1.25); tk.rotation.y=a; g.add(tk); }
  g.position.set(s[0],groundH(s[0],s[1])+0.1,s[1]); g.renderOrder=4; scene.add(g); ART.circles.push({x:s[0],z:s[1],g,t:0,wh:false}); }
function artUpdate(dt){ if(ART.active){ ART.t+=dt; while(ART.salvo<3&&ART.t>=0.2+ART.salvo*1.25){ ART.salvo++; artGun(); setTimeout(()=>{ if(!transit&&!LOC.safe){ artCircle(); artCircle(); } },380); } if(ART.salvo>=3&&ART.t>4&&!ART.circles.length) ART.active=false; }
  for(let i=ART.circles.length-1;i>=0;i--){ const c=ART.circles[i]; c.t+=dt; const k=Math.min(1,c.t/2), e=1-Math.pow(1-k,2), r=lerp(5.2,0.85,e);
    c.g.scale.set(r,1,r); c.g.rotation.y+=dt*(0.6+k*2); c.g.children[1].material.opacity=0.6+0.4*Math.abs(Math.sin(c.t*(6+k*14))); c.g.children[0].material.opacity=0.08+k*0.2;
    if(c.t>1.15&&!c.wh){ c.wh=true; sO(1700,480,0.85,0.03,'sine'); }
    if(c.t>1.7){ const h=(2-c.t)*60, gy=groundH(c.x,c.z); LINES.push(c.x,gy+h+0.5,c.z,c.x,gy+h+5,c.z,1,0.85,0.5,0); }
    if(c.t>=2){ scene.remove(c.g); c.g.children.forEach(m=>{ if(m.material&&m.material!==c.g.children[1].material) m.material.dispose(); }); c.g.children[1].material.dispose(); ART.circles.splice(i,1);
      { const zc=ENEMIES.find(z=>zontOn(z)&&zontInside(z,c.x,groundH(c.x,c.z)+0.3,c.z,0)); if(zc){ const gy=groundH(zc.x,zc.z), dd=Math.hypot(c.x-zc.x,c.z-zc.z), hy=gy+Math.sqrt(Math.max(0,ZR*ZR-dd*dd)); zontAbsorb(zc,70,c.x,hy,c.z); FIRE.spawn(c.x,hy,c.z,0,0,0,3.2,3,0.2,1,1,0.7,0.3); sfxBoom(0.7); } else explode(c.x,groundH(c.x,c.z)+0.25,c.z,2.4,1.8,0,-1,0,'shell',null,0,null,0.6); } shockwave(c.x,c.z,7,[1,0.45,0.3]); shake=Math.min(1,shake+0.25); } } }
function artClear(){ for(const c of ART.circles) scene.remove(c.g); ART.circles.length=0; ART.active=false; }

/* ---- capture the flag: grab it in the district, bring it to HQ ---- */
const FLG={g:null,cloth:null,carry:null,guarded:{},x:0,z:0};
const flagTex=(()=>{ const cv=document.createElement('canvas'); cv.width=128; cv.height=80; const c=cv.getContext('2d'); c.fillStyle='#e8322a'; c.fillRect(0,0,128,80); c.fillStyle='#ffc94a'; c.fillRect(0,34,128,12);
  c.beginPath(); for(let k=0;k<10;k++){ const a=-Math.PI/2+k*Math.PI/5, r=k%2?7:16; c.lineTo(26+Math.cos(a)*r,22+Math.sin(a)*r); } c.fill(); return new THREE.CanvasTexture(cv); })();
function flagMesh(sc){ const g=new THREE.Group(); const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,4.2,8),rdMat.body); pole.position.y=2.1; g.add(pole);
  const knob=new THREE.Mesh(rdGeo.sph,rdMat.acc); knob.scale.setScalar(0.14); knob.position.y=4.22; g.add(knob);
  const geo=new THREE.PlaneGeometry(2.0,1.2,12,4); geo.translate(1.0,-0.6,0); geo.rotateX(-0.95); const cloth=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:flagTex,side:THREE.DoubleSide})); cloth.position.y=4.1; g.add(cloth);
  cloth.userData.base=Float32Array.from(geo.attributes.position.array); g.scale.setScalar(sc); scene.add(g); return {g,cloth}; }
function flagWave(cl,t,amp){ const a=cl.geometry.attributes.position, b=cl.userData.base; for(let i=0;i<a.count;i++){ const x=b[i*3]; const w=Math.sin(t*6-x*3.2)*0.18*amp*(x/2); a.array[i*3+2]=b[i*3+2]+w*0.6; a.array[i*3+1]=b[i*3+1]+w*0.8; } a.needsUpdate=true; }
function flagPoints(id){ const L=LOCS[id]; if(!L) return []; if(L.flags) return L.flags; if(id===LOC_ID&&!L._fp) L._fp=computeFlagPoints(); return L._fp||[]; }
function computeFlagPoints(){ const out=[]; const cand=[];
  for(let z=8;z<=WZ-8;z+=2) for(let x=8;x<=WX-8;x+=2){ if(inWater(x,z)) continue; if(FLOORS.some(f=>x>f[0]-2&&x<f[2]+2&&z>f[1]-2&&z<f[3]+2)) continue; const cl=NAV.dist[z*NAVN+x]; if(cl<4.5) continue;
    let open=true; for(let dz=-2;dz<=2&&open;dz+=0.5) for(let dx=-2;dx<=2&&open;dx+=0.5) for(let y=0;y<NY;y+=2) if(get(Math.floor((x+dx)/VS),y,Math.floor((z+dz)/VS))){ open=false; break; } if(open) cand.push([x,z,cl]); }
  cand.sort((a,b)=>b[2]-a[2]); for(const c of cand){ if(out.length>=3) break; if(out.every(o=>Math.hypot(o[0]-c[0],o[1]-c[1])>18)) out.push([c[0],c[1]]); } return out; }
function flagBuild(){ if(FLG.g){ scene.remove(FLG.g); FLG.g=null; } if(!MS.active) return; const m=missionAt(MS.i); if(m.k!=='flag'||MS.flag||m.loc!==LOC_ID) return;
  const pts=flagPoints(LOC_ID); if(!pts.length) return; if(MS.fp==null||MS.fp>=pts.length) MS.fp=(rnd()*pts.length)|0; const p=pts[MS.fp]; FLG.x=p[0]; FLG.z=p[1];
  const f=flagMesh(1); FLG.g=f.g; FLG.cloth=f.cloth; FLG.g.position.set(p[0],groundH(p[0],p[1]),p[1]);
  const ring=new THREE.Mesh(new THREE.RingGeometry(2.2,2.5,56),new THREE.MeshBasicMaterial({color:MCOL,transparent:true,opacity:0.9,depthWrite:false})); ring.rotation.x=-Math.PI/2; ring.position.y=0.08; FLG.g.add(ring);
  if(!FLG.guarded[MS.i]){ FLG.guarded[MS.i]=true; const n=3+Math.min(2,MS.i>>3); for(let k=0;k<n;k++){ const a=k/n*TAU+rnd()*0.5, q=pickNear(p[0]+Math.cos(a)*7,p[1]+Math.sin(a)*7,1); if(!q) continue; const t=k===0&&MS.i>3?'bull':'jian'; const e=spawnEnemy(t,q[0],q[1],t==='bull'?{mod:'ac'}:null); e.home={x:p[0],z:p[1]}; } } }
function flagUpdate(dt,t){ const m=MS.active?missionAt(MS.i):null; const on=m&&m.k==='flag';
  if(FLG.g){ if(!on||MS.flag){ scene.remove(FLG.g); FLG.g=null; } else { flagWave(FLG.cloth,t,1); FLG.g.children[3].material.opacity=0.55+0.4*Math.sin(t*5);
      if(!TK.dead&&Math.hypot(TK.x-FLG.x,TK.z-FLG.z)<2.6){ MS.flag=true; scene.remove(FLG.g); FLG.g=null; sfxPickup(1); toast('Флаг у тебя · доставь его в штаб'); popText(TK.x,TK.y+2.6,TK.z,'флаг захвачен','ammo'); objUI(); save(); } } }
  const carry=on&&MS.flag&&!transit; if(carry&&!FLG.carry){ const f=flagMesh(0.62); FLG.carry=f; } if(!carry&&FLG.carry){ scene.remove(FLG.carry.g); FLG.carry=null; }
  if(FLG.carry){ const g=FLG.carry.g; rdLocal(-0.55,1.25,-1.3,_rt); g.position.copy(_rt); g.rotation.set(0,TK.h+Math.PI/2,0); flagWave(FLG.carry.cloth,t,1+Math.min(1.5,Math.hypot(TK.vx,TK.vz)*0.15));
    if(TK.dead){ MS.flag=false; toast('Флаг потерян · он вернулся на место'); objUI(); save(); }
    else if(LOC_ID==='camp'&&Math.hypot(TK.x-(HQ.x0+HQ.x1)/2,TK.z-(HQ.z0+HQ.z1)/2)<8){ MS.flag=false; MS.fp=null; completeMission(); } } }

/* ---- civilians and the evacuation mission ---- */
const CIV={list:[],phase:0,n:0,saved:0,dead:0,gate:null,spawnQ:[],failT:0};
const civMat={skin:new THREE.MeshToonMaterial({color:0xe2b48c,gradientMap:gradTex}),hair:new THREE.MeshToonMaterial({color:0x2a1d16,gradientMap:gradTex}),pants:new THREE.MeshToonMaterial({color:0x2e3a52,gradientMap:gradTex}),
  shirts:[0xf0f0ea,0x4fa3e0,0xe8b53a,0x6cc28a,0xd96aa0,0xff8a4a].map(c=>new THREE.MeshToonMaterial({color:c,gradientMap:gradTex}))};
const civGeo={up:new THREE.BoxGeometry(0.11,0.28,0.11).translate(0,-0.14,0),fore:new THREE.BoxGeometry(0.1,0.25,0.1).translate(0,-0.125,0),hand:new THREE.SphereGeometry(0.05,6,4),leg:new THREE.BoxGeometry(0.15,0.78,0.17).translate(0,-0.39,0),torso:new THREE.BoxGeometry(0.42,0.58,0.24).translate(0,0.29,0),arm:new THREE.BoxGeometry(0.11,0.52,0.11).translate(0,-0.26,0),head:new THREE.SphereGeometry(0.15,10,8),hair:new THREE.SphereGeometry(0.16,10,6,0,TAU,0,Math.PI/2)};
function civMake(x,z,k){ const g=new THREE.Group(), mesh=(geo,mat,px,py,pz,par)=>{ const m=new THREE.Mesh(geo,mat); m.position.set(px,py,pz); par.add(m); return m; }; const shirt=civMat.shirts[k%civMat.shirts.length];
  const legs=new THREE.Group(); legs.position.y=0.8; g.add(legs); const LL=makeLeg(legs,0.11,0,civMat.pants,civMat.hair,0.4,0.38,0.15), LR=makeLeg(legs,-0.11,0,civMat.pants,civMat.hair,0.4,0.38,0.15), lL=LL.hip, lR=LR.hip;
  const torso=new THREE.Group(); torso.position.y=0.8; g.add(torso); mesh(civGeo.torso,shirt,0,0,0,torso); const AR=[0.27,-0.27].map(x=>{ const sh=new THREE.Group(); sh.position.set(x,0.55,0); torso.add(sh); sh.add(new THREE.Mesh(civGeo.up,shirt)); const el=new THREE.Group(); el.position.y=-0.27; sh.add(el); el.add(new THREE.Mesh(civGeo.fore,shirt)); const hd=new THREE.Mesh(civGeo.hand,civMat.skin); hd.position.y=-0.26; el.add(hd); return [sh,el]; }), aL=AR[0][0], aR=AR[1][0];
  const head=new THREE.Group(); head.position.y=1.55; g.add(head); mesh(civGeo.head,civMat.skin,0,0,0,head); mesh(civGeo.hair,civMat.hair,0,0.02,0,head);
  g.position.set(x,groundH(x,z),z); scene.add(g); EXTRAS.push(g);
  return {g,legs,torso,head,lL,lR,aL,aR,kL:LL.knee,kR:LR.knee,eL:AR[0][1],eR:AR[1][1],x,z,vx:0,vz:0,vy:0,y:0,h:0,st:'run',ph:rnd()*TAU,spd:3.8+rnd()*1.0,path:null,pi:0,pathT:0,dodge:0,dx:0,dz:0,downT:0,civ:true}; }
function evacGate(){ const s=routeGate('camp'); const g=s&&GATES.find(q=>q.side===s); return g?[(g.r[0]+g.r[2])/2,(g.r[1]+g.r[3])/2]:null; }
function evacReset(){ for(const c of CIV.list) if(c.g.parent) scene.remove(c.g); CIV.list.length=0; CIV.phase=0; CIV.saved=0; CIV.dead=0; CIV.spawnQ.length=0; CIV.failT=0; CIV.gate=null; }
function evacOn(){ if(!MS.active) return null; const m=missionAt(MS.i); return m.k==='evac'&&m.loc===LOC_ID?m:null; }
function enemiesLeft(){ return ENEMIES.filter(e=>!e.dead&&!e.xf).length+DRONES.filter(d=>!d.dead).length; }
function evacStart(m){ CIV.gate=evacGate(); if(!CIV.gate) return; CIV.phase=1; CIV.n=m.n; CIV.saved=0; CIV.dead=0;
  const g=CIV.gate; let best=null, bs=-1e9; for(const f of FLOORS){ const cx=(f[0]+f[2])/2, cz=(f[1]+f[3])/2, dg=Math.hypot(cx-g[0],cz-g[1]), dt_=Math.hypot(cx-TK.x,cz-TK.z); const s=Math.min(dg,40)-Math.abs(dt_-18)*0.6+rnd()*6; if(dg>14&&s>bs){ bs=s; best=f; } }
  let sx=40, sz=40; if(best){ const cx=(best[0]+best[2])/2, cz=(best[1]+best[3])/2; let door=null, dd=1e9;
      for(let a=0;a<TAU;a+=0.2) for(let r=0;r<16;r+=0.5){ const x=cx+Math.cos(a)*r, z=cz+Math.sin(a)*r; if(x>best[0]-1.2&&x<best[2]+1.2&&z>best[1]-1.2&&z<best[3]+1.2) continue; if(!navOk(Math.floor(x),Math.floor(z),0.5)) continue; const d=Math.hypot(x-g[0],z-g[1]); if(d<dd){ dd=d; door=[x,z]; } break; }
      const inside=navOk(Math.floor(cx),Math.floor(cz),0.4)&&navPath(cx,cz,g[0],g[1],0.4); if(inside){ sx=cx; sz=cz; } else if(door){ sx=door[0]; sz=door[1]; } CIV.house=best; }
  for(let k=0;k<m.n;k++) CIV.spawnQ.push({t:0.6+k*0.45,x:sx+(rnd()-0.5)*0.8,z:sz+(rnd()-0.5)*0.8,k});
  toast('Район зачищен · гражданские выбегают — не задень их'); sfxBuy(); objUI(); }
function civFree(x,z){ const cx=Math.floor(x/VS), cz=Math.floor(z/VS); return x>0.5&&z>0.5&&x<WX-0.5&&z<WZ-0.5&&!get(cx,Math.floor(0.5/VS),cz)&&!get(cx,Math.floor(1.3/VS),cz); }
function civDie(c,ux,uz,force){ if(c.st==='dead'||c.st==='saved') return; c.st='dead'; CIV.dead++;
  const parts=[c.legs,c.torso,c.head]; parts.forEach((p,k)=>{ scene.attach(p); EXTRAS.push(p); GIBS.push(gibOf(p,ux*(3+force)+(rnd()-0.5)*4,2.5+k*1.6+rnd()*2+force*0.4,uz*(3+force)+(rnd()-0.5)*4,10+k*4)); });
  scene.remove(c.g); const gy=groundH(c.x,c.z);
  for(let k=0;k<14;k++){ const a=rnd()*TAU, r=Math.pow(rnd(),0.7)*1.3; addMark({x:c.x+Math.cos(a)*r+ux*r*0.6,z:c.z+Math.sin(a)*r+uz*r*0.6,t:2,s:0.18+rnd()*0.55,c:[0.42+rnd()*0.12,0.02,0.03]}); }
  for(let k=0;k<6;k++) SMOKE.spawn(c.x,gy+0.9,c.z,ux*2+(rnd()-0.5)*3,1+rnd()*2,uz*2+(rnd()-0.5)*3,0.35,1.2,0.5,0.6,0.55,0.04,0.05);
  ST.scrap=Math.max(0,ST.scrap-100); popText(c.x,gy+1.8,c.z,'−100 лома','kill'); sfxThud(0.6); toast('Погиб гражданский · −100 лома'); objUI(); }
function civHitTest(ox,oy,oz,ux,uy,uz,len){ let best=null, bt=Infinity; for(const c of CIV.list){ if(c.st==='dead'||c.st==='saved') continue; const t=segSphere(ox,oy,oz,ux,uy,uz,len,c.x,c.y+groundH(c.x,c.z)+0.95,c.z,0.5); if(t>=0&&t<bt){ bt=t; best=c; } } return best?[best,bt]:null; }
function civBlast(px,py,pz,radius){ for(const c of CIV.list){ if(c.st==='dead'||c.st==='saved') continue; const dx=c.x-px, dz=c.z-pz, d=Math.hypot(dx,dz); if(d<radius*1.6+0.6&&Math.abs(py-groundH(c.x,c.z))<radius*2+1) civDie(c,dx/(d||1),dz/(d||1),3); } }
function civUpdate(dt,t){ const m=evacOn(); if(!m){ if(CIV.list.length||CIV.phase) evacReset(); return; }
  if(CIV.phase===0){ CIV.ot=(CIV.ot||0)-dt; if(CIV.ot<=0){ CIV.ot=0.5; objUI(); } if(!LOC.safe&&!transit&&enemiesLeft()===0) evacStart(m); return; }
  for(let i=CIV.spawnQ.length-1;i>=0;i--){ const q=CIV.spawnQ[i]; q.t-=dt; if(q.t<=0){ CIV.spawnQ.splice(i,1); CIV.list.push(civMake(q.x,q.z,q.k)); } }
  const g=CIV.gate, sp=Math.hypot(TK.vx,TK.vz);
  for(const c of CIV.list){ if(c.st==='dead'||c.st==='saved') continue;
    if(c.st==='down'){ c.downT-=dt; c.vy-=18*dt; c.y=Math.max(0,c.y+c.vy*dt); c.x+=c.vx*dt; c.z+=c.vz*dt; c.vx*=Math.pow(0.1,dt); c.vz*=Math.pow(0.1,dt); if(!civFree(c.x,c.z)){ c.x-=c.vx*dt; c.z-=c.vz*dt; c.vx=c.vz=0; }
      c.g.rotation.x+=((c.downT>0.5?-Math.PI/2:0)-c.g.rotation.x)*Math.min(1,dt*(c.downT>0.5?9:4)); if(c.downT<=0){ c.st='run'; c.g.rotation.x=0; } }
    else { const dx=c.x-TK.x, dz=c.z-TK.z, d=Math.hypot(dx,dz); let mx=0, mz=0;
      const tt=Math.max(0,(dx*TK.vx+dz*TK.vz)/(sp*sp+1e-3)), px=TK.x+TK.vx*Math.min(tt,1.3), pz=TK.z+TK.vz*Math.min(tt,1.3), pd=Math.hypot(c.x-px,c.z-pz);
      if(c.dodge<=0&&sp>1.8&&d<11&&pd<3.2){ let ax=-TK.vz, az=TK.vx; if(ax*(c.x-px)+az*(c.z-pz)<0){ ax=-ax; az=-az; } const l=Math.hypot(ax,az)||1; c.dx=ax/l; c.dz=az/l; c.dodge=0.55+rnd()*0.3; if(rnd()<0.5) c.vy=0; }
      if(c.dodge>0){ c.dodge-=dt; mx=c.dx*6.2; mz=c.dz*6.2; }
      else { c.pathT-=dt; if(!c.path||c.pathT<=0){ c.pathT=1.1+rnd()*0.5; c.path=navPath(c.x,c.z,g[0],g[1],0.4); c.pi=1; }
        let tx=g[0], tz=g[1]; if(c.path&&c.pi<c.path.length){ let w=c.path[c.pi]; while(c.pi<c.path.length-1&&Math.hypot(w[0]-c.x,w[1]-c.z)<1){ c.pi++; w=c.path[c.pi]; } tx=w[0]; tz=w[1]; }
        const ax=tx-c.x, az=tz-c.z, l=Math.hypot(ax,az)||1; mx=ax/l*c.spd; mz=az/l*c.spd;
        for(const o of CIV.list){ if(o===c||o.st!=='run') continue; const ox=c.x-o.x, oz=c.z-o.z, od=Math.hypot(ox,oz); if(od<0.7&&od>1e-3){ mx+=ox/od*2; mz+=oz/od*2; } } }
      const nx=c.x+mx*dt, nz=c.z+mz*dt; if(civFree(nx,nz)){ c.x=nx; c.z=nz; } else if(civFree(nx,c.z)) c.x=nx; else if(civFree(c.x,nz)) c.z=nz; else c.pathT=0;
      if(mx||mz){ c.h=turnTo(c.h,Math.atan2(mx,mz),dt*12); c.ph+=dt*Math.hypot(mx,mz)*2.6; }
      c.bob=gaitPose({hipL:c.lL,hipR:c.lR,kneeL:c.kL,kneeR:c.kR,armL:c.aL,armR:c.aR,elbL:c.eL,elbR:c.eR,torso:c.torso},c.ph,1.35); c.torso.rotation.x=0.22; c.g.rotation.x=0;
      if(d<2.0&&!TK.dead){ const l=d||1; if(sp>4.2) civDie(c,TK.vx/sp,TK.vz/sp,sp*0.5); else if(sp>0.6){ c.st='down'; c.downT=1.6; c.vx=dx/l*5+TK.vx; c.vz=dz/l*5+TK.vz; c.vy=3.5; sfxThud(0.3); } else { c.x+=dx/l*dt*3; c.z+=dz/l*dt*3; } }
      if(c.st==='run'&&Math.hypot(c.x-g[0],c.z-g[1])<3){ c.st='saved'; CIV.saved++; scene.remove(c.g); popText(c.x,1.8,c.z,'спасён','heal'); sO(660,990,0.12,0.06,'triangle'); objUI(); } }
    if(c.st!=='dead'&&c.st!=='saved'){ c.g.position.set(c.x,groundH(c.x,c.z)+c.y+(c.st==='run'?(c.bob||0)*1.4:0),c.z); c.g.rotation.y=c.h; shadowAdd(c.x,c.z,0.8,c.y,0.4); } }
  if(!CIV.spawnQ.length&&CIV.saved+CIV.dead>=CIV.n){ if(CIV.saved>0){ const sv=CIV.saved, n=CIV.n; evacReset(); completeMission(); toast(`Эвакуация завершена · спасено ${sv} из ${n}`); }
    else { CIV.failT+=dt; if(CIV.failT>3){ toast('Никто не выжил · попробуй ещё раз'); sfxLose(); radioSay('Мы потеряли всех гражданских... Соберись, водитель. Попробуем ещё раз.'); evacReset(); } } } }

/* ---- background ambience: helicopters, distant firefights, sirens, jets ---- */
const AMB={t:14,heli:null};
function ambNoise(dur,type,f0,f1,q,vol,pan,att){ const ctx=SND.ctx; if(!ctx||SND.muted) return; const t=ctx.currentTime, s=ctx.createBufferSource(); s.buffer=SND.noise; s.loop=true; const f=ctx.createBiquadFilter(); f.type=type; f.Q.value=q; f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  const g=ctx.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+(att||0.01)); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); let out=g;
  if(ctx.createStereoPanner){ const p=ctx.createStereoPanner(); p.pan.setValueAtTime(pan[0],t); p.pan.linearRampToValueAtTime(pan[1],t+dur); g.connect(p); out=p; } s.connect(f); f.connect(g); out.connect(SND.master); s.start(t); s.stop(t+dur+0.05); return g; }
function ambHeli(){ const ctx=SND.ctx; if(!ctx||SND.muted) return; const dur=9, t=ctx.currentTime, dir=rnd()<0.5?1:-1;
  const s=ctx.createBufferSource(); s.buffer=SND.noise; s.loop=true; const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=380; const am=ctx.createGain(); am.gain.value=0.5;
  const lfo=ctx.createOscillator(); lfo.frequency.setValueAtTime(10.5,t); lfo.frequency.linearRampToValueAtTime(9.2,t+dur); const lg=ctx.createGain(); lg.gain.value=0.5; lfo.connect(lg); lg.connect(am.gain);
  const g=ctx.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.16,t+dur*0.5); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); let out=g;
  if(ctx.createStereoPanner){ const p=ctx.createStereoPanner(); p.pan.setValueAtTime(-0.9*dir,t); p.pan.linearRampToValueAtTime(0.9*dir,t+dur); g.connect(p); out=p; }
  s.connect(f); f.connect(am); am.connect(g); out.connect(SND.master); s.start(t); lfo.start(t); s.stop(t+dur); lfo.stop(t+dur);
  const a=rnd()*TAU; AMB.heli={t:0,dur,x0:40+Math.cos(a)*70,z0:40+Math.sin(a)*70,x1:40-Math.cos(a)*70+(rnd()-0.5)*30,z1:40-Math.sin(a)*70+(rnd()-0.5)*30}; }
function ambFire(){ const pan=(rnd()-0.5)*1.6; let tt=0; const n=3+((rnd()*5)|0); for(let b=0;b<n;b++){ const shots=3+((rnd()*6)|0); for(let k=0;k<shots;k++){ setTimeout(()=>ambNoise(0.09,'bandpass',900+rnd()*300,500,0.8,0.05+rnd()*0.03,[pan,pan]),(tt+k*0.085)*1000); } tt+=shots*0.085+0.3+rnd()*0.9; } }
function ambBoom(){ const pan=(rnd()-0.5)*1.6; ambNoise(1.8,'lowpass',260,60,0.7,0.12,[pan,pan],0.02); setTimeout(()=>ambNoise(1.2,'lowpass',140,50,0.7,0.05,[pan,pan],0.05),350); }
function ambSiren(){ const ctx=SND.ctx; if(!ctx||SND.muted) return; const t=ctx.currentTime, dur=7, o=ctx.createOscillator(); o.type='triangle'; for(let k=0;k<7;k++){ o.frequency.setValueAtTime(620,t+k); o.frequency.linearRampToValueAtTime(820,t+k+0.5); o.frequency.linearRampToValueAtTime(620,t+k+1); }
  const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=1400; const g=ctx.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.025,t+2); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(f); f.connect(g); g.connect(SND.master); o.start(t); o.stop(t+dur); }
function ambJet(){ const d=rnd()<0.5?1:-1; ambNoise(5,'bandpass',300,1800,0.6,0.09,[-0.9*d,0.9*d],2.2); ambNoise(5,'lowpass',200,120,0.5,0.07,[-0.9*d,0.9*d],2.4); }
/* ---- v19 sound layer ---- */
const SFX19={servo:0,amb:3,ui:0,aa:0};
function enemySounds(dt){ if(LOC.safe||transit) return; SFX19.servo-=dt; if(SFX19.servo>0) return; SFX19.servo=0.12;
  for(const e of ENEMIES){ if(e.dead) continue; const d=Math.hypot(e.x-TK.x,e.z-TK.z); if(d>40) continue; const sp=Math.hypot(e.vx||0,e.vz||0); e.sT=(e.sT||rnd())-0.12; if(e.sT>0) continue;
    const ps=sndAt(e.x,e.z);
    if(e.type==='hive'){ e.sT=1.6; sO(48,44,1.5,0.09,'sine'); sO(96,90,1.2,0.025,'triangle'); }
    else if(e.type==='factory'){ e.sT=0.9; sNz(0.12,'bandpass',500,4,0.1); sO(70,55,0.3,0.06,'square'); }
    else if(sp>0.5&&e.type!=='bomb'){ e.sT=e.type==='jian'?0.32:e.type==='katok'?0.5:0.45; const f=e.type==='katok'?90:e.type==='bull'?160:e.type==='lamp'?240:320; sO(f,f*1.6,0.09,0.035,'square'); sNz(0.06,'bandpass',f*6,3,0.03); }
    else if(e.type==='bomb'&&sp>0.5){ e.sT=0.18; sNz(0.03,'highpass',4000,2,0.03); }
    else e.sT=0.5;
    sndOff(ps); } }
function ambExtra(dt){ if(!SND.ctx||SND.muted||transit) return;
  if(LOC_ID==='camp'&&CDK.aa&&CDK.aa.moving){ SFX19.aa-=dt; if(SFX19.aa<=0){ SFX19.aa=0.5; const ps=sndAt(68.5,28); sO(110,118,0.5,0.03,'sawtooth'); sndOff(ps); } }
  SFX19.amb-=dt; if(SFX19.amb>0) return; SFX19.amb=3+rnd()*5; const id=LOC_ID;
  if(id==='camp'){ const r=rnd(); if(r<0.4){ const ps=sndAt(65,28); for(let k=0;k<4;k++) setTimeout(()=>{ const q=sndAt(65,28); sO(900+rnd()*900,700+rnd()*500,0.06,0.03,'square'); sNz(0.08,'bandpass',1800,2,0.02); sndOff(q); },k*120+rnd()*80); sndOff(ps); }
    else if(r<0.7){ const ps=sndAt(15,15); sNz(2.5,'lowpass',180,0.7,0.05,0.4); sO(60,60,2.2,0.02,'sine'); sndOff(ps); }
    else { const ps=sndAt(40+(rnd()-0.5)*50,40+(rnd()-0.5)*50); sNz(0.18,'bandpass',900,3,0.06); sO(260,180,0.12,0.03,'square'); sndOff(ps); } return; }
  const rx=6+rnd()*68, rz=6+rnd()*68, ps=sndAt(rx,rz);
  if(id==='nw'){ if(rnd()<0.6){ for(let k=0;k<3;k++) setTimeout(()=>{ const q=sndAt(rx,rz); sNz(0.2,'bandpass',600+rnd()*500,4,0.12); sO(180,120,0.15,0.05,'square'); sndOff(q); },k*(180+rnd()*120)); } else { sNz(1.3,'highpass',2500,0.6,0.07,0.05); } }
  else if(id==='ne'){ if(rnd()<0.5){ sNz(0.3,'bandpass',420,5,0.12); sO(140,90,0.4,0.06,'square'); } else { sO(98,96,2.2,0.05,'sawtooth'); sO(147,145,2.2,0.03,'sawtooth'); } }
  else { if(rnd()<0.5) sNz(3.5,'bandpass',500+rnd()*500,0.5,0.035,1.2); else { sO(600+rnd()*300,500,0.25,0.02,'triangle'); sNz(0.15,'bandpass',2600,3,0.02); } }
  sndOff(ps); }
function ambUpdate(dt){ enemySounds(dt); ambExtra(dt); if(AMB.heli){ const h=AMB.heli; h.t+=dt; const k=h.t/h.dur; if(k>=1) AMB.heli=null; else if(!transit){ const x=lerp(h.x0,h.x1,k), z=lerp(h.z0,h.z1,k); shadowAdd(x,z,5.5,9,0.5); } }
  if(!SND.ctx||SND.muted||transit) return; AMB.t-=dt; if(AMB.t>0) return; AMB.t=LOC.safe?18+rnd()*16:8+rnd()*12;
  if(rnd()<0.45&&ambLoc()) return; const r=rnd(); if(r<0.24) ambHeli(); else if(r<0.52) ambFire(); else if(r<0.7) ambBoom(); else if(r<0.85) ambSiren(); else ambJet(); }

/* ---- per-location build + per-frame hub ---- */
function v9Build(){ artClear(); evacReset(); flagBuild(); }
function v9Update(dt,t){ tlUpdate(t); rdUpdate(dt,t); artUpdate(dt); flagUpdate(dt,t); civUpdate(dt,t); ambUpdate(dt); }

/* ---- radio: General Zhao, walkie-talkie avatar, 8-bit floppy voice ---- */
const VOICE={timer:null,el:null,text:'',i:0,av:null,done:null};
function vBlip(base){ const ctx=SND.ctx; if(!ctx||SND.muted) return; const t=ctx.currentTime, o=ctx.createOscillator(), g=ctx.createGain(), f=ctx.createBiquadFilter(); o.type='square';
  const fr=base*(0.82+rnd()*0.45); o.frequency.setValueAtTime(fr,t); o.frequency.exponentialRampToValueAtTime(fr*(0.75+rnd()*0.4),t+0.05); f.type='lowpass'; f.frequency.value=2200;
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.17,t+0.004); g.gain.exponentialRampToValueAtTime(0.0001,t+0.055); o.connect(f); f.connect(g); g.connect(SND.master); o.start(t); o.stop(t+0.07); }
function vSeek(){ sNz(0.02,'bandpass',1500+rnd()*1200,3,0.16); sO(120,70,0.03,0.09,'square'); }
function vKey(){ sO(1500,1100,0.025,0.12,'square'); sNz(0.18,'bandpass',2800,0.6,0.09); }
function radioStop(fin){ if(VOICE.timer){ clearInterval(VOICE.timer); VOICE.timer=null; } if(VOICE.el&&fin) VOICE.el.textContent=VOICE.text; if(VOICE.av) VOICE.av.classList.remove('talk'); const d=VOICE.done; VOICE.done=null; if(fin&&d) d(); }
function radioType(el,text,av,done){ radioStop(false); Object.assign(VOICE,{el,text,i:0,av,done}); el.textContent=''; av.classList.add('talk'); vKey(); let pause=0; const base=150+rnd()*30;
  VOICE.timer=setInterval(()=>{ if(pause>0){ pause--; return; } const ch=text[VOICE.i++]; if(ch==null){ vKey(); radioStop(true); return; } el.textContent=text.slice(0,VOICE.i); if(el.id==='mcBrief'){ const c=el.closest('#mcard'); if(c&&c.scrollHeight>c.clientHeight+2){ const r=el.getBoundingClientRect(), cr=c.getBoundingClientRect(); if(r.bottom>cr.bottom-4) c.scrollTop+=r.bottom-cr.bottom+8; } }
    if(/[.!?…—]/.test(ch)){ pause=7; vSeek(); } else if(ch===','){ pause=3; } else if(ch===' '){ if(rnd()<0.5) vSeek(); } else if(VOICE.i%2===0){ vBlip(/[аеёиоуыэюяАЕЁИОУЫЭЮЯ]/.test(ch)?base*1.25:base); } },28); }
const RQ=[]; let radioT=0, radioBusy=false;
function radioSay(text){ if(RQ.length<3) RQ.push(text); }
function radioUpdate(dt){ const box=$('#radio'); if(radioBusy){ if(VOICE.done===null&&!VOICE.timer){ radioT-=dt; if(radioT<=0){ radioBusy=false; box.hidden=true; } } return; }
  if(!RQ.length||mcOpen||GAR.open||transit) return; const t=RQ.shift(); radioBusy=true; box.hidden=false; radioType($('#radioTx'),t,$('#radioAv'),()=>{ radioT=2.6; }); }
function sightUpdate(){ for(const e of ENEMIES){ if(e.dead||!e.sees||SEEN[e.type]) continue; SEEN[e.type]=1; save(); if(ENEMY_INTRO[e.type]) radioSay(ENEMY_INTRO[e.type]); } }

/* ---- «Каток»: heavy roller tank, directional armour, telegraphed big cannon, black exhaust ---- */
const KW={speed:30,g:9,spread:0.01,radius:2.1,power:1.5,dmg:26,kind:'shell',size:1.25};
const _kv=new THREE.Vector3(), _kv2=new THREE.Vector3();
function buildKatok(e){ Object.assign(e,{hp:640,maxHp:640,r:2.15,hy:1.4,hr:1.9,mass:7,turn:0.55,acc:3,speedW:2.0,navR:2.0,ty:e.h,fcd:2.5,exhT:0,bump:0});
  const Y=emat(e,0xf2b21e), D=emat(e,0x24262b), Gy=emat(e,0x8d96a1), Mt=emat(e,0x5d6570), Hz=emapMat(e,TEXS.haz); e.eyeM=eglow(e,0xffb53a); const B=e.body;
  ep(e,EGEO.box,D,B,0,0.75,-0.25,2.0,0.7,3.1,true); ep(e,EGEO.box,Y,B,0,1.18,-0.3,2.15,0.24,3.2,true); ep(e,EGEO.box,Hz,B,0,1.18,1.31,2.16,0.25,0.02);
  for(const s of [-1,1]){ ep(e,EGEO.box,Y,B,s*1.32,0.95,1.55,0.16,0.7,1.3,true); ep(e,EGEO.box,Hz,B,s*1.41,1.05,1.55,0.02,0.22,1.1); ep(e,EGEO.box,D,B,s*1.06,0.42,-1.05,0.06,0.5,1.2); }
  const drum=new THREE.Group(); drum.position.set(0,0.8,1.75); B.add(drum); const dr=ep(e,EGEO.cyl,Gy,drum,0,0,0,1.6,2.4,1.6,true); dr.rotation.z=Math.PI/2;
  for(let k=0;k<6;k++){ const a=k/6*TAU, s=ep(e,EGEO.box,Mt,drum,0,Math.cos(a)*0.79,Math.sin(a)*0.79,2.42,0.08,0.18); s.rotation.x=a; } e.drum=drum;
  const wh=new THREE.Group(); wh.position.set(0,0.55,-1.3); B.add(wh); for(const s of [-1,1]){ const w=ep(e,EGEO.cyl,D,wh,s*1.02,0,0,1.1,0.42,1.1,true); w.rotation.z=Math.PI/2; const hb=ep(e,EGEO.cyl,Y,wh,s*1.24,0,0,0.42,0.04,0.42); hb.rotation.z=Math.PI/2; } e.wheels=wh;
  ep(e,EGEO.box,Gy,B,0,1.78,-1.05,1.35,0.95,1.05,true); ep(e,EGEO.box,e.eyeM,B,0,1.92,-0.52,1.1,0.32,0.02); for(const s of [-1,1]) ep(e,EGEO.box,e.eyeM,B,s*0.68,1.92,-1.05,0.02,0.3,0.7); ep(e,EGEO.box,Y,B,0,2.3,-1.05,1.45,0.08,1.15);
  ep(e,EGEO.box,D,B,0,1.0,-1.85,1.5,0.62,0.06); e.rad=eglow(e,0xff6a1e); ep(e,EGEO.box,e.rad,B,0,1.0,-1.89,1.3,0.48,0.02); for(let k=0;k<6;k++) ep(e,EGEO.box,D,B,-0.55+k*0.22,1.0,-1.91,0.05,0.5,0.03);
  ep(e,EGEO.cyl,D,B,0.78,2.05,-1.55,0.16,1.5,0.16,true); ep(e,EGEO.cyl,Mt,B,0.78,2.85,-1.55,0.22,0.12,0.22); e.exh=new THREE.Object3D(); e.exh.position.set(0.78,2.95,-1.55); B.add(e.exh);
  const T=new THREE.Group(); T.position.set(0,1.45,0.35); B.add(T); e.tur=T;
  ep(e,EGEO.box,D,T,0,0.32,0,1.35,0.6,1.5,true); ep(e,EGEO.box,Y,T,0,0.66,-0.05,1.2,0.1,1.25); ep(e,EGEO.box,Hz,T,0,0.38,0.76,1.36,0.16,0.02); ep(e,EGEO.box,Mt,T,0,0.32,0.82,0.62,0.48,0.3,true);
  const bar=new THREE.Group(); bar.position.set(0,0.32,0.95); T.add(bar); const br=ep(e,EGEO.cyl,Mt,bar,0,0,1.2,0.3,2.4,0.3,true); br.rotation.x=Math.PI/2;
  e.glow=new THREE.MeshBasicMaterial({color:0x2a0a06}); const sl=new THREE.Mesh(EGEO.cyl,e.glow); sl.scale.set(0.34,1.0,0.34); sl.rotation.x=Math.PI/2; sl.position.z=1.9; bar.add(sl);
  ep(e,EGEO.box,D,bar,0,0,2.5,0.5,0.4,0.42,true); e.muz=new THREE.Object3D(); e.muz.position.set(0,0,2.8); bar.add(e.muz); e.bar=bar;
  ep(e,EGEO.joint,gmat(0xff5a40),T,-0.45,0.78,-0.4,0.09); ep(e,EGEO.box,D,T,-0.45,1.0,-0.4,0.03,0.45,0.03);
  /* v23 detail: drum yoke + hydraulics, drum cleats/caps, cab glazing and rails, lights, tool boxes, rear wheel hubs, turret armour */
  for(let k=0;k<12;k++){ const a=k/12*TAU+0.26, c_=ep(e,EGEO.box,D,drum,0,Math.cos(a)*0.83,Math.sin(a)*0.83,2.3,0.06,0.1); c_.rotation.x=a; }
  for(const s of [-1,1]){ const cap=ep(e,EGEO.cyl,Y,drum,s*1.22,0,0,1.0,0.06,1.0); cap.rotation.z=Math.PI/2; const hub=ep(e,EGEO.cyl,D,drum,s*1.27,0,0,0.42,0.08,0.42); hub.rotation.z=Math.PI/2; for(let k=0;k<6;k++){ const a=k/6*TAU; ep(e,EGEO.box,Mt,drum,s*1.3,Math.cos(a)*0.15,Math.sin(a)*0.15,0.04,0.05,0.05); }
    const arm=ep(e,EGEO.box,Y,B,s*1.34,0.95,1.2,0.12,0.22,1.25,true); arm.rotation.x=0.18; ep(e,EGEO.box,D,B,s*1.36,0.95,1.75,0.16,0.34,0.34);
    const cyl1=ep(e,EGEO.cyl,Mt,B,s*1.18,1.42,1.05,0.1,0.8,0.1); cyl1.rotation.x=1.15; const rod=ep(e,EGEO.cyl,gmat(0xd8dde4),B,s*1.18,1.22,1.5,0.06,0.5,0.06); rod.rotation.x=1.15;
    ep(e,EGEO.box,D,B,s*1.12,0.85,0.4,0.08,0.4,0.9,true); ep(e,EGEO.box,Gy,B,s*1.17,0.92,0.4,0.03,0.08,0.7);
    ep(e,EGEO.box,D,B,s*1.08,1.55,-0.35,0.1,0.32,0.55,true); ep(e,EGEO.box,Y,B,s*1.13,1.62,-0.35,0.02,0.06,0.5);
    const wh_=e.wheels; const hc=ep(e,EGEO.cyl,Mt,wh_,s*1.27,0,0,0.6,0.05,0.6); hc.rotation.z=Math.PI/2; for(let k=0;k<5;k++){ const a=k/5*TAU; ep(e,EGEO.box,D,wh_,s*1.31,Math.cos(a)*0.2,Math.sin(a)*0.2,0.03,0.05,0.05); }
    for(let k=0;k<10;k++){ const a=k/10*TAU, tr=ep(e,EGEO.box,D,wh_,s*1.02,Math.cos(a)*0.55,Math.sin(a)*0.55,0.44,0.07,0.12); tr.rotation.x=a; }
    ep(e,EGEO.box,e.eyeM,B,s*0.82,1.32,1.32,0.22,0.12,0.04); ep(e,EGEO.box,D,B,s*0.82,1.32,1.3,0.28,0.18,0.03);
    ep(e,EGEO.box,D,B,s*0.74,2.1,-0.48,0.06,0.04,0.3); ep(e,EGEO.box,Gy,B,s*0.78,2.05,-0.32,0.1,0.14,0.04);
    for(let k=0;k<3;k++) ep(e,EGEO.box,D,B,s*0.7,1.45+k*0.22,-1.62,0.05,0.04,0.2); }
  for(let k=0;k<4;k++) ep(e,EGEO.box,D,B,-0.45+k*0.3,2.36,-1.05,0.04,0.08,1.05); ep(e,EGEO.box,gmat(0xff8a1e),B,0.5,2.42,-1.4,0.12,0.12,0.12);
  for(const z of [-0.95,-0.65]) ep(e,EGEO.box,D,B,0,2.0,z-0.08,1.12,0.02,0.02);
  for(let k=0;k<5;k++) ep(e,EGEO.box,Mt,B,-0.8+k*0.4,1.32,-0.3,0.08,0.04,3.0);
  for(const s of [-1,1]){ const pl=ep(e,EGEO.box,Y,T,s*0.74,0.36,0.05,0.12,0.5,1.3,true); pl.rotation.z=s*-0.18; ep(e,EGEO.box,D,T,s*0.8,0.36,0.3,0.03,0.08,0.6); }
  ep(e,EGEO.box,Mt,T,0.38,0.82,-0.35,0.32,0.22,0.3,true); ep(e,EGEO.box,e.eyeM,T,0.38,0.84,-0.19,0.22,0.08,0.02); ep(e,EGEO.box,D,bar,0,0.22,1.1,0.12,0.06,1.6);
  B.scale.setScalar(1.18); }
function updKatok(e,dt){ const dx=TK.x-e.x, dz=TK.z-e.z, d=Math.max(1e-3,Math.hypot(dx,dz)); e.t+=dt; ePerceive(e,dt,34,2.2); e.fcd-=dt; e.bump-=dt;
  const want=Math.atan2(dx,dz); e.ty=turnTo(e.ty,e.aggro?want:e.h,dt*(e.state==='charge'?0.22:0.6));
  if(e.state==='idle'){ if(e.aggro) e.state='move'; else ePatrol(e,dt,1.0); }
  else if(e.state==='move'){ if(!e.aggro) e.state='idle'; else { let tx=TK.x, tz=TK.z; if(!e.sees&&e.last){ tx=e.last.x; tz=e.last.z; }
      if(!e.sees||d>17) navMove(e,tx,tz,e.speedW,dt); else if(d<7.5) navMove(e,TK.x,TK.z,e.speedW*1.3,dt); else eBrake(e,dt,1.5);
      if(eStuck(e,dt)){ e.stN=(e.stN||0)+1; if(e.stN%2===1){ const fx=e.x+Math.sin(e.h)*(e.r+0.7), fz=e.z+Math.cos(e.h)*(e.r+0.7); explode(fx,0.7,fz,1.1,0.55,Math.sin(e.h),0,Math.cos(e.h),'shell',null,1,e,0); } else { e.state='reverse'; e.t=0; e.rvs=rnd()<0.5?1:-1; } }
      e.g.updateMatrixWorld(true); e.muz.getWorldPosition(_kv);
      if(e.fcd<=0&&e.sees&&d<32&&d>4&&Math.abs(wrapA(want-e.ty))<0.15&&losTank(_kv.x,_kv.y,_kv.z)){ e.state='charge'; e.t=0; sO(55,150,1.1,0.14,'sawtooth'); sNz(1.1,'lowpass',300,1,0.08); } } }
  else if(e.state==='reverse'){ e.h=wrapA(e.h+e.rvs*0.6*dt); const tvx=-Math.sin(e.h)*1.6, tvz=-Math.cos(e.h)*1.6; e.vx+=(tvx-e.vx)*Math.min(1,dt*1.5); e.vz+=(tvz-e.vz)*Math.min(1,dt*1.5); if(e.t>1.7){ e.state=e.aggro?'move':'idle'; e.path=null; e.stk=null; } }
  else if(e.state==='charge'){ eBrake(e,dt,3); const k=Math.min(1,e.t/1.1); e.bpT=(e.bpT||0)-dt; if(e.bpT<=0){ e.bpT=0.28-0.2*k; sO(1250+k*500,1250+k*500,0.05,0.06,'square'); } e.glow.color.setRGB(0.16+0.84*k,0.04+0.12*k,0.02);
    e.g.updateMatrixWorld(true); e.muz.getWorldPosition(_kv); if(rnd()<k*0.6) spark(_kv.x,_kv.y,_kv.z,(rnd()-0.5)*3,rnd()*2,(rnd()-0.5)*3,1,0.3,0.15,0.3);
    const L=30, ca=Math.sin(e.ty), cb=Math.cos(e.ty), R=EYE_RED; LINES.push(_kv.x,_kv.y,_kv.z,_kv.x+ca*L,_kv.y,_kv.z+cb*L,R[0]*k,R[1]*k,R[2]*k,0.4);
    if(e.t>1.1){ const lt=d/KW.speed; void lt; eShoot(_kv.x,_kv.y,_kv.z,_kv.x+ca*d,TK.y+1,_kv.z+cb*d,KW); const G2=P.glow2;
      FIRE.spawn(_kv.x,_kv.y,_kv.z,ca*4,0,cb*4,3.2,3,0.12,1,G2[0],G2[1],G2[2]); for(let n=0;n<8;n++) SMOKE.spawn(_kv.x,_kv.y,_kv.z,ca*5+(rnd()-0.5)*3,rnd()*1.5,cb*5+(rnd()-0.5)*3,1,2.2,1.2,0.55,0.7,0.72,0.76);
      groundFlash(_kv.x,_kv.z,6,G2,0.2); sNz(0.9,'lowpass',500,0.7,0.6*clamp(1.4-d/40,0.3,1)); sO(90,30,0.6,0.45*clamp(1.4-d/40,0.3,1)); shake=Math.min(1,shake+0.25*clamp(1-d/30,0,1));
      e.kx-=ca*1.8; e.kz-=cb*1.8; e.bar.position.z=0.6; e.fcd=3.2+rnd()*1.2; e.state='move'; e.glow.color.setRGB(0.16,0.04,0.02); e.exhT=-0.4; } }
  eIntegrate(e,dt); e.bar.position.z+=(0.95-e.bar.position.z)*Math.min(1,dt*4);
  if(d<e.r+TR+0.25&&e.bump<=0&&!LOC.safe&&!TK.dead){ e.bump=1.1; damageTank(9,-dx/d,-dz/d,0); TK.vx+=dx/d*5; TK.vz+=dz/d*5; TK.pitchV+=0.3; sfxThud(0.9); shake=Math.min(1,shake+0.25); }
  const vF=e.vx*Math.sin(e.h)+e.vz*Math.cos(e.h); e.drum.rotation.x+=vF*dt/0.8; e.wheels.rotation.x+=vF*dt/0.55; e.tur.rotation.y=wrapA(e.ty-e.h);
  e.exhT-=dt; if(e.exhT<=0){ const mv=Math.hypot(e.vx,e.vz)>0.4; e.exhT=e.exhT<-0.2?0.03:(mv?0.08:0.18); e.g.updateMatrixWorld(true); e.exh.getWorldPosition(_kv2);
    SMOKE.spawn(_kv2.x,_kv2.y,_kv2.z,(rnd()-0.5)*0.5-e.vx*0.3,1.8+rnd()*1.2,(rnd()-0.5)*0.5-e.vz*0.3,0.35+rnd()*0.2,1.8,1.4+rnd()*0.8,0.7,0.05,0.05,0.06); }
  const fl=0.6+0.4*Math.sin(e.t*9); e.rad.color.setRGB(1*fl,0.42*fl,0.12*fl);
  eyeColor(e,e.aggro,e.state==='charge'); }
function dieKatok(e,dx,dz,src){ deathFx(e.x,e.y+1.3,e.z,2.4); explode(e.x,e.y+1,e.z,2.4,1.4,0,-1,0,'shell',null,1.5,e,0.6); sfxBoom(1);
  e.g.updateMatrixWorld(true); const c=new THREE.Vector3(); e.tur.getWorldPosition(c); gibMeshes([e.tur],c,null,dx*2+(rnd()-0.5)*3,10+rnd()*3,dz*2+(rnd()-0.5)*3,0.7); e.tur.visible=false;
  const hull=bodyGib(e,null,dx,dz,0.4,0.9); hull.v.set(dx*0.6,1.2,dz*0.6); hull.w.multiplyScalar(0.08);
  for(let k=1;k<14;k++) later(k*0.32,()=>{ const p=hull.m.position; for(let n=0;n<3;n++) FIRE.spawn(p.x+(rnd()-0.5)*1.6,p.y+0.6+rnd()*0.6,p.z+(rnd()-0.5)*1.6,(rnd()-0.5),2+rnd()*2,(rnd()-0.5),0.9+rnd()*0.6,1.5,0.5,1,1,0.55,0.2); SMOKE.spawn(p.x,p.y+1.4,p.z,(rnd()-0.5),2.4,(rnd()-0.5),1,2.2,2,0.6,0.07,0.07,0.08); });
  dropScrap(e.x,e.z,60,e.y+1); if(rnd()<0.3) makePickup('ammo',e.x+(rnd()-0.5)*3,e.z+(rnd()-0.5)*3,0); eRemove(e); }

/* ---- «Зонт»: support robot that keeps its allies under a shield dome ---- */
const ZR=7, domeGeo=new THREE.IcosahedronGeometry(1,2), domeEdges=new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1,1));
function buildZont(e){ Object.assign(e,{hp:90,maxHp:90,r:0.95,hy:0.2,hr:0.85,mass:1.6,turn:3.2,acc:7,speedW:3.4,sh:150,shMax:150,down:0,rip:0,grow:1,ztT:0,zt:null});
  const W=emat(e,0xe8e2d2), Y=emat(e,0xf2a81e), D=emat(e,0x2a2a2e), Hz=emapMat(e,TEXS.haz); e.eyeM=eglow(e,0x7fe8ff); const B=e.body;
  ep(e,EGEO.cyl,W,B,0,0,0,1.45,0.42,1.45,true); ep(e,EGEO.cyl,Hz,B,0,-0.06,0,1.48,0.14,1.48); ep(e,EGEO.cyl,D,B,0,0.24,0,1.05,0.1,1.05);
  ep(e,EGEO.box,e.eyeM,B,0,0.06,0.71,0.55,0.09,0.03); ep(e,EGEO.box,D,B,0,0.62,0,0.14,0.8,0.14,true);
  const U=new THREE.Group(); U.position.set(0,1.05,0); B.add(U); e.umb=U; ep(e,EGEO.tip,Y,U,0,0,0,1.6,0.34,1.6,true);
  for(let k=0;k<6;k++){ const a=k/6*TAU, rb=ep(e,EGEO.box,D,U,Math.sin(a)*0.42,-0.04,Math.cos(a)*0.42,0.05,0.05,0.85); rb.rotation.y=a; rb.rotation.x=0.35; }
  ep(e,EGEO.ring,e.eyeM,U,0,0.2,0,0.34).rotation.x=Math.PI/2; ep(e,EGEO.joint,e.eyeM,U,0,0.26,0,0.2);
  addLegs(e,{L1:0.6,L2:0.72,w1:0.14,d1:0.18,w2:0.18,d2:0.2,stepH:0.32,thr:0.4,stepT:0.17,lead:0.3,bodyH:0.95,bob:0.05,fast:0.04,lowerGeo:EGEO.box,capMat:Y,kneeK:1.3,hipK:1.6,
    foot:{geo:EGEO.box,mat:D,s:[0.26,0.1,0.32]},legs:[[0.45,-0.12,0.45,0.95,0.95,0],[-0.45,-0.12,0.45,-0.95,0.95,1],[0.45,-0.12,-0.45,0.95,-0.95,1],[-0.45,-0.12,-0.45,-0.95,-0.95,0]]},W,D);
  const dome=new THREE.Group(); dome.add(new THREE.Mesh(domeGeo,new THREE.MeshBasicMaterial({color:0x7fe8ff,transparent:true,opacity:0.07,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending})));
  dome.add(new THREE.LineSegments(domeEdges,new THREE.LineBasicMaterial({color:0x7fe8ff,transparent:true,opacity:0.35,depthWrite:false,blending:THREE.AdditiveBlending}))); dome.visible=false; dome.renderOrder=6; e.lg.add(dome); e.dome=dome; }
function zontOn(z){ return !z.dead&&z.type==='zont'&&z.down<=0&&z.grow>0.5; }
function zontInside(z,x,y,z_,pad){ const gy=groundH(z.x,z.z); return Math.hypot(x-z.x,y-gy,z_-z.z)<ZR+(pad||0); }
function zontCovered(e,x,y,z_){ for(const z of ENEMIES){ if(!zontOn(z)) continue; if(zontInside(z,e.x,e.y+e.hy,e.z,0)&&!zontInside(z,x,y,z_,-0.3)) return z; } return null; }
function zontAbsorb(z,dmg,hx,hy,hz){ z.sh-=dmg; z.rip=1; for(let k=0;k<7;k++) spark(hx,hy,hz,(rnd()-0.5)*6,(rnd()-0.5)*6,(rnd()-0.5)*6,0.5,0.95,1,0.3);
  FIRE.spawn(hx,hy,hz,0,0,0,1.2,2,0.12,1,0.45,0.9,1); sNz(0.12,'bandpass',2600,2,0.1);
  if(z.sh<=0){ z.down=5; z.sh=0; sO(900,110,0.6,0.12,'sawtooth'); sNz(0.5,'highpass',2500,0.8,0.15); const gy=groundH(z.x,z.z);
    for(let k=0;k<30;k++){ const a=rnd()*TAU, b=rnd()*1.4; spark(z.x+Math.cos(a)*Math.cos(b)*ZR,gy+Math.sin(b)*ZR,z.z+Math.sin(a)*Math.cos(b)*ZR,(rnd()-0.5)*4,-2-rnd()*3,(rnd()-0.5)*4,0.5,0.95,1,0.5); } } }
function zontProj(ox,oy,oz,ux,uy,uz,len){ let best=null, bt=Infinity; for(const z of ENEMIES){ if(!zontOn(z)) continue; if(zontInside(z,ox,oy,oz,0)) continue; const gy=groundH(z.x,z.z);
    const t=segSphere(ox,oy,oz,ux,uy,uz,len,z.x,gy,z.z,ZR); if(t>=0&&t<bt){ bt=t; best=z; } } return best?[best,bt]:null; }
function zontBlast(px,py,pz,R,dmg){ for(const z of ENEMIES){ if(!zontOn(z)) continue; if(zontInside(z,px,py,pz,-0.3)) continue; const gy=groundH(z.x,z.z), d=Math.hypot(px-z.x,py-gy,pz-z.z); if(d<ZR+R) zontAbsorb(z,dmg*(1-Math.max(0,d-ZR)/R),px,py,pz); } }
function zontTarget(e){ const al=ENEMIES.filter(a=>!a.dead&&a!==e&&a.type!=='zont'&&a.type!=='bomb'&&a.state!=='fly');
  let near=null, nd=1e9; for(const a of al){ const d=Math.hypot(a.x-e.x,a.z-e.z); if(d<nd){ nd=d; near=a; } } const dT=Math.hypot(TK.x-e.x,TK.z-e.z);
  if(near&&nd<30){ let cx=0, cz=0, n=0; for(const a of al) if(Math.hypot(a.x-near.x,a.z-near.z)<ZR*1.2){ cx+=a.x; cz+=a.z; n++; } cx/=n; cz/=n;
    const ax=cx-TK.x, az=cz-TK.z, l=Math.hypot(ax,az)||1, back=n>1?2.2:3.2; let tx=cx+ax/l*back, tz=cz+az/l*back; const dd=Math.hypot(near.x-tx,near.z-tz);
    if(dd>ZR-2){ tx=near.x+(tx-near.x)/dd*(ZR-2); tz=near.z+(tz-near.z)/dd*(ZR-2); } return {x:clamp(tx,3,WX-3),z:clamp(tz,3,WZ-3),cover:true}; }
  if(dT<20){ const a=Math.atan2(e.x-TK.x,e.z-TK.z); for(let k=0;k<9;k++){ const aa=a+(k%2?1:-1)*k*0.32, x=clamp(e.x+Math.sin(aa)*12,4,WX-4), z=clamp(e.z+Math.cos(aa)*12,4,WZ-4); if(navOk(Math.floor(x),Math.floor(z),0.8)) return {x,z,run:true}; } }
  if(near) return {x:near.x,z:near.z,run:true}; return null; }
function updZont(e,dt){ e.t+=dt; ePerceive(e,dt,30,1); e.ztT-=dt; if(e.ztT<=0){ e.ztT=0.45; e.zt=zontTarget(e); }
  const tg=e.zt; if(tg){ if(Math.hypot(tg.x-e.x,tg.z-e.z)>1.1) navMove(e,tg.x,tg.z,tg.run?e.speedW*1.25:e.speedW,dt); else eBrake(e,dt,6); } else ePatrol(e,dt,1.2);
  eIntegrate(e,dt);
  if(e.down>0){ e.down-=dt; if(e.down<=0){ e.sh=e.shMax; e.grow=0; sO(260,900,0.45,0.07,'sine'); } }
  e.rip=Math.max(0,e.rip-dt*3); e.grow=Math.min(1,e.grow+dt*1.4); const on=e.down<=0;
  const gy=groundH(e.x,e.z); e.dome.visible=on||(e.down>4.55&&Math.floor(e.down*30)%2===0); e.dome.position.set(e.x,gy,e.z); const gk=1-Math.pow(1-e.grow,3);
  e.dome.scale.setScalar(ZR*(on?(0.15+0.85*gk):1)*(1+e.rip*0.025)); e.dome.rotation.y+=dt*0.15;
  const low=e.sh<e.shMax*0.3, fl=low?0.5+0.5*Math.sin(e.t*24):1; e.dome.children[0].material.opacity=(0.06+e.rip*0.22)*fl; e.dome.children[1].material.opacity=(0.28+e.rip*0.5)*fl;
  const c=low?[1,0.45,0.35]:[0.5,0.91,1]; e.dome.children[0].material.color.setRGB(c[0],c[1],c[2]); e.dome.children[1].material.color.setRGB(c[0],c[1],c[2]);
  e.umb.rotation.y+=dt*(on?2.4:0.3); if(e.eyeM) e.eyeM.color.setRGB(on?0.5:1,on?0.91:0.3,on?1:0.25); }
function dieZont(e,dx,dz,src){ deathFx(e.x,e.y+0.8,e.z,1.1); legGibs(e,dx,dz,null,4); bodyGib(e,null,dx,dz,4,0.5); sO(700,90,0.5,0.1,'sawtooth');
  const gy=groundH(e.x,e.z); if(e.down<=0) for(let k=0;k<24;k++){ const a=rnd()*TAU, b=rnd()*1.3; spark(e.x+Math.cos(a)*Math.cos(b)*ZR,gy+Math.sin(b)*ZR,e.z+Math.sin(a)*Math.cos(b)*ZR,0,-3,0,0.5,0.95,1,0.5); }
  dropScrap(e.x,e.z,14,e.y); eRemove(e); }

ETYPE.katok={build:buildKatok,update:updKatok,die:dieKatok}; ETYPE.zont={build:buildZont,update:updZont,die:dieZont}; ER.katok=2.15; ER.zont=0.95;
