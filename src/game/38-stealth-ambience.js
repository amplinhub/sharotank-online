/* ================= v15: «Тень» stealth shader · per-tank health · ambience ================= */
const stealthOL=new THREE.MeshBasicMaterial({color:0x5fd8ff,side:THREE.BackSide,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
const causticMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,
  uniforms:{uT:{value:0},uA:{value:0},uS:{value:0},uR:{value:0}},
  vertexShader:'varying vec3 vW;varying vec3 vN;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`uniform float uT;uniform float uA;uniform float uS;uniform float uR;varying vec3 vW;varying vec3 vN;
float cau(vec2 p,float t){ vec2 i=p; float c=1.0; for(int n=0;n<4;n++){ float tt=t*(1.0-(3.5/float(n+1))); i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x)); c+=1.0/length(vec2(p.x/(sin(i.x+tt)/0.006),p.y/(cos(i.y+tt)/0.006))); } c/=4.0; c=1.17-pow(c,1.4); return clamp(pow(abs(c),7.0),0.0,1.0); }
void main(){ vec3 v=normalize(cameraPosition-vW); float rim=pow(1.0-abs(dot(normalize(vN),v)),2.2);
  float c=cau(vW.xz*1.7+vec2(vW.y*0.8,0.0),uT*0.9);
  float b=fract((vW.x*0.45+vW.z*0.7+vW.y*0.5)*0.35-uT*0.55); float band=smoothstep(0.0,0.06,b)*smoothstep(0.16,0.06,b);
  float sweep=uS*smoothstep(0.35,0.0,abs(fract(vW.y*0.4+vW.z*0.25)-uS));
  float a=uA*(c*0.55+rim*0.85+band*0.45)+sweep*0.9; gl_FragColor=vec4(mix(vec3(0.35,0.85,1.0),vec3(1.0,0.16,0.1),uR)*a,a); }`});
const STLFX={a:0,s:0,r:0,list:null,ol:null};
function stealthFxBuild(){ STLFX.list=[]; STLFX.ol=[]; const mats=Object.values(tank.mats);
  tank.root.traverse(m=>{ if(!m.isMesh||m.userData.cau) return; if(m.material===outlineMat||m.material===stealthOL){ STLFX.ol.push(m); return; } if(!mats.includes(m.material)) return;
    const o=new THREE.Mesh(m.geometry,causticMat); o.userData.cau=true; o.visible=false; o.renderOrder=7; m.add(o); STLFX.list.push(o); }); STLFX.tank=tank; }
function setStealth(v){ if(v===STL.on||!tank) return; STL.on=v; if(v){ STLFX.s=1; sO(1600,420,0.45,0.06,'sine'); sNz(0.5,'highpass',4000,0.6,0.05); toast('Маскировка · враги издалека тебя не видят'); } }
function stealthSpotted(){ if(!STL.on||TK.dead||chs().abil!=='stealth') return; STL.t=0; setStealth(false);
  const n=performance.now(); if(n-(stealthSpotted.t||0)<1200) return; stealthSpotted.t=n;
  sO(1250,1250,0.09,0.09,'square'); setTimeout(()=>sO(940,940,0.09,0.09,'square'),110); setTimeout(()=>sO(620,380,0.28,0.09,'sawtooth'),220); sNz(0.18,'bandpass',2400,2,0.05);
  STLFX.r=0; STLFX.a=0; STLFX.s=0; }
function stealthFxUpdate(dt,t){ if(!tank) return; STLFX.r=Math.max(0,STLFX.r-dt*1.3); causticMat.uniforms.uR.value=STLFX.r; if(STLFX.tank!==tank){ STLFX.list=null; STLFX.a=0; } const want=STL.on?1:0; STLFX.a+=(want-STLFX.a)*Math.min(1,dt*(want?3:6)*(STLFX.r>0&&!want?0.22:1)); STLFX.s=Math.max(0,STLFX.s-dt*1.4);
  if(STLFX.a<0.01&&!STL.on){ if(STLFX.list&&STLFX.list[0]&&STLFX.list[0].visible){ for(const o of STLFX.list) o.visible=false; for(const m of STLFX.ol) m.material=outlineMat; for(const k in tank.mats){ const m=tank.mats[k]; m.transparent=false; m.opacity=1; m.needsUpdate=true; } } return; }
  if(!STLFX.list) stealthFxBuild(); if(!STLFX.list[0]||!STLFX.list[0].visible){ for(const o of STLFX.list) o.visible=true; for(const m of STLFX.ol) m.material=stealthOL; for(const k in tank.mats){ const m=tank.mats[k]; m.transparent=true; m.needsUpdate=true; } }
  for(const k in tank.mats) tank.mats[k].opacity=1-0.62*STLFX.a; causticMat.uniforms.uT.value=t; causticMat.uniforms.uA.value=STLFX.a; causticMat.uniforms.uS.value=STLFX.s>0?1-STLFX.s:0;
  stealthOL.opacity=STLFX.a*(0.75+0.25*Math.sin(t*6)); }
/* ---- reticle only while actively aiming on touch ---- */
function retVisible(){ return aimMode!=='stick'||TCH.active||!!AIM.manual; }
/* ---- collisions and location ambience ---- */
let scrapeT=0;
function sfxClank(k){ sO(240+rnd()*60,90,0.18,0.09*k,'square'); sNz(0.16,'bandpass',1400+rnd()*600,2,0.12*k); }
function sfxScrape(k){ sNz(0.14,'bandpass',900+rnd()*500,1.5,0.05*k); }
function ambLoc(){ const id=LOC_ID, ctx=SND.ctx; if(!ctx) return false; const pan=(rnd()-0.5)*1.4;
  if(id==='ne'){ if(rnd()<0.5){ jingle([[45,0,2.2]],'sawtooth',0.05); jingle([[52,0.1,2.0]],'sawtooth',0.03); } else for(let k=0;k<3;k++) setTimeout(()=>sO(1500+rnd()*300,900,0.22,0.03,'sine'),k*260); return true; }
  if(id==='nw'){ jingle([[64,0,0.6],[68,0,0.6],[64,0.75,1.1],[68,0.75,1.1]],'square',0.025); return true; }
  if(id==='south'||id==='se'){ const n=4+((rnd()*5)|0); for(let k=0;k<n;k++) setTimeout(()=>sO(2600+rnd()*1400,3800+rnd()*800,0.07,0.025,'sine'),k*(90+rnd()*120)); if(rnd()<0.3) setTimeout(()=>{ sNz(0.12,'bandpass',600,2,0.05); sO(330,220,0.12,0.04,'square'); },900); return true; }
  if(rnd()<0.5){ ambNoise(4,'lowpass',260,500,0.5,0.06,[pan,-pan],1.8); return true; } return false; }

/* ---- rockets: loft over obstacles, launcher pitches to the launch angle ---- */
function rkLoft(x0,y0,z0,tx,ty,tz){ if(losClear(x0,y0,z0,tx,ty+0.4,tz)) return null; const dx=tx-x0, dz=tz-z0, d=Math.hypot(dx,dz); if(d<4) return null; const hx=dx/d, hz=dz/d; let mh=0;
  for(let s=1;s<d-1;s+=0.8) mh=Math.max(mh,colTop(x0+hx*s,z0+hz*s)); const ang=clamp(Math.atan2(mh+2.5-y0,d*0.4),0.38,Math.PI/4), ap=Math.max(mh+3.5,y0+d*0.5*Math.tan(ang)*0.75);
  return {ang,hx,hz,wp:{x:x0+hx*d*0.5,y:ap,z:z0+hz*d*0.5}}; }
let podT=0, rkAng=0;
let rkHold=0; const _rb=new THREE.Vector3(), _rd=new THREE.Vector3();
function rkBlast(mz){ if(!tank.rk) return; tank.rk.getWorldDirection(_rd); mz.getWorldPosition(_rb); _rb.addScaledVector(_rd,-1.1);
  for(let k=0;k<7;k++) FIRE.spawn(_rb.x,_rb.y,_rb.z,-_rd.x*(7+rnd()*5)+(rnd()-0.5),-_rd.y*(7+rnd()*5)+rnd()*0.6,-_rd.z*(7+rnd()*5)+(rnd()-0.5),0.35+rnd()*0.25,1.8,0.16+rnd()*0.08,1,1,0.55+rnd()*0.3,0.18);
  for(let k=0;k<3;k++) SMOKE.spawn(_rb.x,_rb.y,_rb.z,-_rd.x*3+(rnd()-0.5),0.6+rnd(),-_rd.z*3+(rnd()-0.5),0.5,1.8,0.9,0.4,0.55,0.55,0.58); }
const sfxShutter=o=>{ sNz(0.12,'bandpass',o?1800:1200,3,0.1); sO(o?320:420,o?520:240,0.1,0.05,'square'); };
function rkPodUpdate(dt){ if(!tank||!tank.rk) return;
  if(tank.rkFlaps){ const want=rkQ>0||rkHold>0?1:0; rkHold=Math.max(0,rkHold-dt); const was=tank.rkOpen; tank.rkOpen+=clamp(want-tank.rkOpen,-dt*4,dt*7); if(was>0.6&&tank.rkOpen<=0.6&&!want) sfxShutter(0);
    for(const f of tank.rkFlaps) f.g.rotation.x=-f.sd*tank.rkOpen*1.75; } podT-=dt; if(podT<=0){ podT=0.2; rkAng=0; if(wcur===2&&!TK.dead&&!LOC.safe){ tank.rkMuz[0].getWorldPosition(_kv); const t=AIM.lockE&&!AIM.lockE.dead?AIM.lockE:null; const L=rkLoft(_kv.x,_kv.y,_kv.z,t?t.x:AIM.x,t?(t.y||0)+(t.hy||0.3):AIM.y,t?t.z:AIM.z); if(L) rkAng=L.ang; } }
  const g=tank.gun.rotation.x||0; tank.rk.rotation.x+=((-rkAng-g*(rkAng?1:0))-tank.rk.rotation.x)*Math.min(1,dt*6); tank.rk.position.y=(tank.rkBase||0)+Math.max(0,-tank.rk.rotation.x)*0.15; }
/* ---- desktop: hide touch controls; back on menu / touch, gone again on any key ---- */
function setKbm(v){ document.body.classList.toggle('kbm',v); }
if(!touchDev) setKbm(true);
addEventListener('keydown',()=>setKbm(true),true);
addEventListener('pointerdown',e=>{ if(e.pointerType==='touch') setKbm(false); },true);
addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('button,.gcard,[data-pick]'); if(!b||!SND.ctx) return; const n=performance.now(); if(n-SFX19.ui<70) return; SFX19.ui=n; sO(b.disabled?300:1400,b.disabled?220:1100,0.035,0.05,'triangle'); sNz(0.03,'highpass',5000,1,0.03); },true);
$('#bMenu').addEventListener('click',()=>setKbm(false));
/* ---- HUD chip + hub ---- */
function abilCd(){ const c=chs(); let f=0, act=false, t=0;
  if(c.abil==='rail'){ if(MAG.on>0){ act=true; f=MAG.on/MAG_T; t=MAG.on; } else if(MAG.cd>0){ f=MAG.cd/MAG_CD; t=MAG.cd; } }
  else if(c.abil==='gdrone'){ if(GD.d){ act=true; f=Math.max(0,1-GD.d.t/GD_LIFE); t=Math.max(0,GD_LIFE-GD.d.t); } else if(GD.cd>0){ f=GD.cd/GD_CD; t=GD.cd; } }
  else if(c.abil==='shield'){ if(SHD.cd>0&&!SHD.on){ f=SHD.cd/8; t=SHD.cd; } }
  const on=f>0.001, key=on?(act?'a':'c')+f.toFixed(3):'';
  if(abilCd.k===key) return; abilCd.k=key;
  for(const b of [$('#bShield'),$('#kAbil')]){ b.classList.add('cdv'); b.classList.toggle('cdon',on); b.classList.toggle('cdact',on&&act); if(on){ b.style.setProperty('--cd',f.toFixed(3)); b.dataset.t=t>=10?Math.ceil(t):t.toFixed(1); } } }
function abilHud(){ const el=$('#abil'), c=chs(); const bS=$('#bShield'), kA=$('#kAbil'), hasB=c.abil==='shield'||c.abil==='gdrone'||c.abil==='rail'; if(!c.abil||LOC.safe){ el.hidden=true; kA.hidden=true; bS.hidden=true; return; } el.hidden=false; kA.hidden=!hasB; bS.hidden=!hasB;
  if(hasB&&bS.dataset.ic!==c.abil){ bS.dataset.ic=c.abil; const svg=c.abil==='gdrone'?GD_ICON:c.abil==='rail'?MG_ICON:SH_ICON; bS.innerHTML=svg; const ks=kA.querySelector('svg'); if(ks) ks.outerHTML=svg; bS.setAttribute('aria-label',c.abil==='gdrone'?'Запустить дрон':c.abil==='rail'?'Усилить магнит':'Поднять щит'); kA.title=c.abil==='gdrone'?'Боевой дрон (E)':c.abil==='rail'?'Магнитное поле (E)':'Щит (E)'; }
  if(c.abil==='rail'){ bS.disabled=MAG.on>0||MAG.cd>0; bS.classList.toggle('on',false); bS.classList.toggle('rdy',!bS.disabled); kA.classList.toggle('on',MAG.on>0); }
  if(c.abil==='gdrone'){ bS.disabled=!GD.d&&GD.cd>0; bS.classList.toggle('on',!!GD.d); bS.classList.toggle('rdy',!GD.d&&GD.cd<=0); kA.classList.toggle('on',!!GD.d); }
  if(c.abil==='shield'){ bS.disabled=!SHD.on&&(SHD.cd>0||SHD.hp<SHD.max*0.25); bS.classList.toggle('on',!!SHD.on); bS.classList.toggle('rdy',!SHD.on&&!bS.disabled); }
  let s=''; if(c.abil==='stealth') s=STL.on?'<b>Невидим</b> · первый выстрел ×2':`Маскировка через ${Math.max(0,STL_DELAY[UP.abl|0]-STL.t).toFixed(1)} с`;
  else if(c.abil==='shield') s=SHD.cd>0?`Щит · перезарядка ${Math.ceil(SHD.cd)} с`:`<b>Щит ${Math.round(SHD.hp/SHD.max*100)}%</b>${SHD.on?' · стоит':' · E — поднять'}`;
  else if(c.abil==='rail') s=MAG.on>0?`<b>Магнитное поле ${Math.ceil(MAG.on)} с</b> · радиус ×2`:MAG.cd>0?`Рельсотрон · магнит через ${Math.ceil(MAG.cd)} с`:'<b>Рельсотрон</b> · E — магнитное поле'; else if(c.abil==='gdrone') s=GD.d?`<b>Дрон ${Math.max(0,Math.ceil(GD_LIFE-GD.d.t))} с</b> · броня ${Math.max(0,Math.round(GD.d.hp/GD_HP*100))}%`:GD.cd>0?`Дрон · готовится ${Math.ceil(GD.cd)} с`:'<b>Дрон готов</b> · E — запуск'; else if(c.abil==='drones') { const mx=1+(UP.abl|0); s=`<b>Рой ${BEE.list.length}/${mx}</b>${BEE.list.length<mx?' · новый дрон готовится':' · камикадзе'}`; }
  if(el.innerHTML!==s) el.innerHTML=s; el.classList.toggle('on',(c.abil==='rail'&&MAG.on>0)||(c.abil==='stealth'&&STL.on)||(c.abil==='shield'&&SHD.on)||(c.abil==='gdrone'&&!!GD.d)); }
const MG_ICON='<svg viewBox="0 0 24 24"><path d="M6 3v8a6 6 0 0 0 12 0V3h-4v8a2 2 0 0 1-4 0V3z"/><path d="M6 6h4M14 6h4"/><path d="M3 18c2 1.5 4 1.5 6 0M15 18c2 1.5 4 1.5 6 0M8 21c2.6 1.4 5.4 1.4 8 0"/></svg>', SH_ICON='<svg viewBox="0 0 24 24"><path d="M12 2.5l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10v-6z"/><path d="M8 12l3 3 5-6"/></svg>', GD_ICON='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2"/><ellipse cx="12" cy="12" rx="8.4" ry="2.6"/><path d="M1.5 10.5h3M1.5 13.5h3M19.5 10.5h3M19.5 13.5h3"/><circle cx="12" cy="12" r="1.2"/></svg>';
let abT=0;
/* ---- MG heat tips, overheat smoke, ejected casings ---- */
let heatSmT=0; const _hv=new THREE.Vector3();
function mgHeatFx(dt){ if(!tank||!tank.mgMuz||!tank.mgMuz.length) return; if(!tank.heatTips){ tank.heatTips=[]; const g=new THREE.CylinderGeometry(1,1,1,12).rotateX(Math.PI/2); for(const mz of tank.mgMuz){ const r=UP.mg==='kpv'?0.085:UP.mg==='twin'?0.1:0.12; const m=new THREE.Mesh(g,HEATM); m.scale.set(r,r,0.22); m.position.set(0,0,-0.12); mz.add(m); tank.heatTips.push(m); } }
  const h=clamp(mgHeat,0,1), k=Math.pow(h,1.4); _hc.copy(_hd).lerp(_hr,Math.min(1,k*1.25)); if(h>0.85) _hc.lerp(_hy,(h-0.85)/0.15*0.5); HEATM.color.copy(_hc);
  heatSmT-=dt; if((mgLock||h>0.97)&&heatSmT<=0&&!transit){ heatSmT=0.07; for(const mz of tank.mgMuz){ mz.getWorldPosition(_hv); SMOKE.spawn(_hv.x,_hv.y+0.05,_hv.z,(rnd()-0.5)*0.4+TK.vx*0.5,0.9+rnd()*0.8,(rnd()-0.5)*0.4+TK.vz*0.5,0.18+rnd()*0.1,2.2,0.9+rnd()*0.4,0.75,0.05,0.05,0.06); } } }
const CAS={mesh:null,n:0,list:[],max:0}; const _cm=new THREE.Matrix4(), _cq=new THREE.Quaternion(), _ce=new THREE.Euler(), _cs=new THREE.Vector3(), _cp=new THREE.Vector3(), _cr=new THREE.Vector3();
function casInit(){ const mx=Q==='low'?30:Q==='med'?60:100; if(CAS.mesh&&CAS.max===mx) return; if(CAS.mesh) scene.remove(CAS.mesh); CAS.max=mx;
  CAS.mesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035,0.035,0.16,6).rotateZ(Math.PI/2),new THREE.MeshToonMaterial({color:0xd8a43a,gradientMap:gradTex}),mx); CAS.mesh.frustumCulled=false; CAS.mesh.count=0; scene.add(CAS.mesh); CAS.list.length=0; }
function casSpawn(mz){ casInit(); if(CAS.list.length>=CAS.max) CAS.list.shift(); mz.getWorldPosition(_cp); tank.gun.getWorldDirection(_cr); const rx=_cr.z, rz=-_cr.x, big=UP.mg==='kpv'?1.6:1;
  CAS.list.push({x:_cp.x-_cr.x*0.9+rx*0.18,y:_cp.y+0.05,z:_cp.z-_cr.z*0.9+rz*0.18,vx:rx*(2.5+rnd()*1.5)+TK.vx+(rnd()-0.5),vy:2.2+rnd()*1.6,vz:rz*(2.5+rnd()*1.5)+TK.vz+(rnd()-0.5),a:rnd()*6,b:rnd()*6,wa:(rnd()-0.5)*30,wb:(rnd()-0.5)*30,life:2.2,hit:false,big}); }
function casSpawnAt(x,y,z,rx,rz,vx,vz,big){ casInit(); if(CAS.list.length>=CAS.max) CAS.list.shift(); CAS.list.push({x,y,z,vx:rx*(2+rnd()*1.5)+vx+(rnd()-0.5),vy:0.5+rnd()*1.2,vz:rz*(2+rnd()*1.5)+vz+(rnd()-0.5),a:rnd()*6,b:rnd()*6,wa:(rnd()-0.5)*30,wb:(rnd()-0.5)*30,life:2.2,hit:false,big}); }
function casUpdate(dt){ if(!CAS.mesh) return; let n=0; for(let i=CAS.list.length-1;i>=0;i--){ const c=CAS.list[i]; c.life-=dt; c.vy-=G*dt; c.x+=c.vx*dt; c.y+=c.vy*dt; c.z+=c.vz*dt; c.a+=c.wa*dt; c.b+=c.wb*dt;
    const gy=groundH(c.x,c.z)+0.03, vox=get(Math.floor(c.x/VS),Math.floor(c.y/VS),Math.floor(c.z/VS));
    if(c.y<gy||vox){ if(!c.hit){ c.hit=true; c.life=Math.min(c.life,0.55); if(rnd()<0.35&&Math.hypot(c.x-TK.x,c.z-TK.z)<14){ const ps=sndAt(c.x,c.z); sO(4200+rnd()*1800,3600,0.05,0.025,'triangle'); sndOff(ps); } }
      if(c.y<gy) c.y=gy; c.vy=Math.abs(c.vy)*0.3; c.vx*=0.4; c.vz*=0.4; c.wa*=0.5; c.wb*=0.5; if(vox){ c.vx=-c.vx; c.vz=-c.vz; } }
    if(c.life<=0||transit){ CAS.list.splice(i,1); continue; } }
  for(const c of CAS.list){ const sc=Math.min(1,c.life/0.25)*c.big; _ce.set(c.a,c.b,0); _cq.setFromEuler(_ce); _cs.set(sc,sc,sc); _cp.set(c.x,c.y,c.z); _cm.compose(_cp,_cq,_cs); CAS.mesh.setMatrixAt(n++,_cm); }
  CAS.mesh.count=n; CAS.mesh.instanceMatrix.needsUpdate=true; }
/* ---- «Игла»: coil segments flash in sequence along the barrel on each shot ---- */
const _cd=new THREE.Color(0x245a6c), _cb=new THREE.Color(0xd8fbff), _cbl=new THREE.Color(0x7fe8ff);
function coilUpdate(dt){ if(!tank||!tank.coilM) return; tank.coilT=(tank.coilT==null?9:tank.coilT)+dt; const t=tank.coilT, n=tank.coilM.length;
  for(let i=0;i<n;i++){ const t0=i*0.045, k=t<t0?0:Math.exp(-(t-t0)*7); const m=tank.coilM[i]; if(k>0.5) m.color.copy(_cbl).lerp(_cb,(k-0.5)*2); else m.color.copy(_cd).lerp(_cbl,k*2); } }
function v12Update(dt,t){ mgHeatFx(dt); casUpdate(dt); coilUpdate(dt); if(chs().abil==='stealth'&&!TK.dead&&!transit){ STL.t+=dt; setStealth(STL.t>STL_DELAY[UP.abl|0]&&!LOC.safe); } else setStealth(false); STL.bonus=Math.max(0,STL.bonus-dt);
  stealthFxUpdate(dt,t); shieldUpdate(dt,t); railsUpdate(dt); rkPodUpdate(dt); armUpdate(dt); eRingUpdate(dt); ammoRingUpdate(dt); woundUpdate(dt); beesUpdate(dt,t); gdUpdate(dt,t); magUpdate(dt); abilCd(); bannerUpdate(dt); krepUpdate(dt); abT-=dt; if(abT<=0){ abT=0.15; abilHud(); } }

