/* ================= SUPPORT CALLS: emergency repair & ammo drop ================= */
const KIT_COST={rep:120,ammo:90,art:180}, KIT_MAX=1;
const SFX_L=[]; const plusTex=(()=>{ const cv=document.createElement('canvas'); cv.width=cv.height=64; const c=cv.getContext('2d'); c.shadowColor='#4dff8a'; c.shadowBlur=10; c.fillStyle='#7dffa6'; c.fillRect(26,10,12,44); c.fillRect(10,26,44,12); return new THREE.CanvasTexture(cv); })();
const healRingGeo=new THREE.RingGeometry(0.85,1,56); healRingGeo.rotateX(-Math.PI/2);
function kitAvail(k){ if(!ST.kits||ST.kits[k]<=0||LOC.safe||TK.dead||transit||GAR.open) return false;
  if(k==='art') return !ART.active;
  if(k==='rep') return TK.hp<maxHP()-0.5||TK.dmgS.some(v=>v>0.02); return !CRATES.some(c=>c.state!=='spent'&&c.state!=='boom')&&['mg','cn','rk'].some(id=>(id!=='rk'||UP.rk)&&ST.ammo[id]<ammoCap(id)); }
function useRepair(){ if(!kitAvail('rep')) return; ST.kits.rep--; const add=Math.round(maxHP()-TK.hp); TK.hp=maxHP(); TK.dmgS.fill(0); save();
  for(let k=0;k<3;k++){ const m=new THREE.Mesh(healRingGeo,new THREE.MeshBasicMaterial({color:0x4dff8a,transparent:true,opacity:0.9,blending:THREE.AdditiveBlending,depthWrite:false})); scene.add(m); SFX_L.push({k:'ring',m,t:-k*0.18,ml:0.9}); }
  for(let k=0;k<7;k++){ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:plusTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); sp.scale.setScalar(0.9); scene.add(sp); SFX_L.push({k:'plus',m:sp,t:-k*0.09,ml:1.7,a:k/7*TAU}); }
  const hb=$('#hpBar'); hb.classList.remove('heal'); void hb.offsetWidth; hb.classList.add('heal'); popText(TK.x,TK.y+3,TK.z,'+'+add+' броня','heal'); screenFlash(0.18,false);
  sO(300,900,0.5,0.12,'triangle'); setTimeout(()=>sO(450,1350,0.45,0.1,'triangle'),120); sfxWrench(); }
function sfxLUpdate(dt){ for(let i=SFX_L.length-1;i>=0;i--){ const f=SFX_L[i]; f.t+=dt; const k=f.t/f.ml; if(f.t<0){ f.m.visible=false; continue; } f.m.visible=true;
    if(f.k==='ring'){ f.m.position.set(TK.x,TK.y+0.15+k*0.3,TK.z); f.m.scale.setScalar(1.2+k*4.2); f.m.material.opacity=0.9*(1-k); }
    else { const a=f.a+f.t*4; f.m.position.set(TK.x+Math.cos(a)*1.7,TK.y+1+k*3.4,TK.z+Math.sin(a)*1.7); f.m.material.rotation=f.t*5; f.m.material.opacity=Math.min(1,(1-k)*2.5); f.m.scale.setScalar(0.7+0.4*Math.sin(k*Math.PI)); }
    if(k>=1){ scene.remove(f.m); f.m.material.dispose(); SFX_L.splice(i,1); } } }

const CRATES=[]; const crGeo={box:new THREE.BoxGeometry(1,1,1),cyl:new THREE.CylinderGeometry(1,1,1,12),ring:new THREE.RingGeometry(0.85,1,48).rotateX(-Math.PI/2),disc:new THREE.CircleGeometry(1,40).rotateX(-Math.PI/2)};
const crMat={body:new THREE.MeshToonMaterial({color:0x4a6b52,gradientMap:gradTex}),dark:new THREE.MeshToonMaterial({color:0x22282c,gradientMap:gradTex}),yel:new THREE.MeshToonMaterial({color:0xf2b01e,gradientMap:gradTex}),
  chute:new THREE.MeshToonMaterial({color:0xe8e2d0,gradientMap:gradTex,side:THREE.DoubleSide}),brass:new THREE.MeshToonMaterial({color:0xd9a441,gradientMap:gradTex})};
function dropSpot(){ const c=[]; for(const r of ROADS){ const mid=(r.b0+r.b1)/2; for(let a=r.a0+2;a<r.a1-2;a+=2){ const x=r.v?mid:a, z=r.v?a:mid; c.push([x,z]); } }
  for(let k=0;k<70;k++){ const ang=rnd()*TAU, d=7+rnd()*14; c.push([TK.x+Math.cos(ang)*d,TK.z+Math.sin(ang)*d,1]); }
  let best=null,bs=1e9; for(const p of c){ const d=Math.hypot(p[0]-TK.x,p[1]-TK.z); if(d<6.5||d>26||p[0]<4||p[1]<4||p[0]>WX-4||p[1]>WZ-4) continue; if(inWater(p[0],p[1])||!eFree(p[0],p[1],p[2]?2.2:1.6)) continue; const sc=d+(p[2]?8:0); if(sc<bs){ bs=sc; best=p; } }
  if(best&&!best[2]) return best;
  /* v27: no road close by → nearest free open spot that is on screen */
  let b2=null, s2=1e9; for(let k=0;k<200;k++){ const ang=rnd()*TAU, d=5.5+rnd()*22, x=TK.x+Math.cos(ang)*d, z=TK.z+Math.sin(ang)*d; if(x<4||z<4||x>WX-4||z>WZ-4||inWater(x,z)||!eFree(x,z,2.2)) continue; const sc=toScreen(x,groundH(x,z)+1,z); if(!sc[2]||sc[0]<30||sc[0]>innerWidth-30||sc[1]<70||sc[1]>innerHeight-60) continue; if(d<s2){ s2=d; b2=[x,z,1]; } }
  return b2||best; }
function useAmmo(){ if(!kitAvail('ammo')) return; const p=dropSpot(); if(!p){ toast('Некуда сбросить ящик · отъедь на открытое место'); return; } ST.kits.ammo--; save();
  const g=new THREE.Group(), add=(geo,mat,x,y,z,sx,sy,sz,par)=>{ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.scale.set(sx,sy,sz); (par||g).add(m); return m; };
  add(crGeo.box,crMat.body,0,0.45,0,1.6,0.9,1.1); for(const x of [-0.62,0.62]) add(crGeo.box,crMat.dark,x,0.45,0,0.1,0.92,1.12); add(crGeo.box,crMat.yel,0,0.45,0.56,0.9,0.18,0.02); add(crGeo.box,crMat.yel,0,0.45,-0.56,0.9,0.18,0.02);
  const lid=new THREE.Group(); lid.position.set(0,0.9,-0.55); g.add(lid); add(crGeo.box,crMat.body,0,0.05,0.55,1.62,0.1,1.12,lid); add(crGeo.box,crMat.yel,0,0.11,0.55,0.5,0.02,0.5,lid);
  for(let k=0;k<5;k++) add(crGeo.cyl,crMat.brass,-0.5+k*0.25,0.95,0.15,0.07,0.32,0.07); for(let k=0;k<2;k++) add(crGeo.cyl,crMat.dark,-0.35+k*0.7,0.95,-0.22,0.14,0.36,0.14);
  const chute=new THREE.Group(); g.add(chute); const can=null; const NZ=[[0.62,0.4],[-0.62,0.4],[0.62,-0.4],[-0.62,-0.4]];
  for(const [x,z] of NZ){ add(crGeo.cyl,crMat.dark,x,0.02,z,0.13,0.2,0.13,chute); add(crGeo.cyl,crMat.yel,x,-0.06,z,0.09,0.06,0.09,chute); add(crGeo.box,crMat.dark,x*0.8,0.12,z,0.3,0.08,0.08,chute); }
  const aura=new THREE.Mesh(crGeo.ring,new THREE.MeshBasicMaterial({color:0xffc94a,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false})), glow=new THREE.Mesh(crGeo.disc,new THREE.MeshBasicMaterial({color:0xffc94a,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,map:TEX_SOFT}));
  scene.add(g,aura,glow); EXTRAS.push(g,aura,glow); const gy=groundH(p[0],p[1]);
  CRATES.push({g,lid,chute,can,aura,glow,x:p[0],z:p[1],gy,y:gy+62,vy:-30,state:'fall',t:0,fly:[],nz:NZ,burn:false,acc:0,rt:0}); toast('Ящик с боеприпасами садится · подъедь к нему'); sfxRocket(); }
function cratesUpdate(dt,now){ for(let i=CRATES.length-1;i>=0;i--){ const c=CRATES[i]; c.t+=dt;
  if(c.state==='fall'){ const h=c.y-c.gy;
    if(!c.burn&&h<22){ c.burn=true; c.acc=(c.vy*c.vy-9)/(2*Math.max(1,h-3)); sNz(0.5,'lowpass',500,0.8,0.35); }
    if(c.burn){ c.vy=Math.min(-3,c.vy+c.acc*dt); const G2=P.glow2, ch=Math.cos(c.g.rotation.y), sh=Math.sin(c.g.rotation.y);
      for(const [nx,nz] of c.nz){ const wx=c.x+nx*ch+nz*sh, wz=c.z-nx*sh+nz*ch; FIRE.spawn(wx,c.y-0.15,wz,(rnd()-0.5)*1.5,-11-rnd()*6,(rnd()-0.5)*1.5,1.1+rnd()*0.7,3.5,0.2+rnd()*0.1,1,1,0.75+rnd()*0.2,0.35); FIRE.spawn(wx,c.y-0.1,wz,0,-6,0,0.6,1.5,0.08,1,1,1,0.85); if(rnd()<0.35) spark(wx,c.y-0.2,wz,(rnd()-0.5)*4,-6-rnd()*6,(rnd()-0.5)*4,1,0.8,0.4,0.25); }
      const sm=mix3(P.side,[0.72,0.7,0.68],0.6); const gr=h<12; for(let k=0;k<(gr?5:2);k++){ const a=rnd()*TAU, sp=gr?(6+rnd()*6)*(1.3-h/12):1.5; SMOKE.spawn(c.x+Math.cos(a)*0.8,gr?c.gy+0.4:c.y-1,c.z+Math.sin(a)*0.8,Math.cos(a)*sp,gr?0.8+rnd()*1.2:-3,Math.sin(a)*sp,1.6+rnd()*1.2,2.2,1.4+rnd()*1.0,0.6,sm[0],sm[1],sm[2]); }
      c.rt-=dt; if(c.rt<=0){ c.rt=0.14; sNz(0.2,'bandpass',700,0.7,0.12); } if(h<14) groundFlash(c.x,c.z,9*(1-h/14)+2,[1,0.7,0.3],0.12); shake=Math.min(1,shake+dt*0.15*Math.max(0,1-Math.hypot(TK.x-c.x,TK.z-c.z)/20)); }
    c.y+=c.vy*dt; c.g.rotation.y+=dt*(c.burn?0.15:0.8); c.g.rotation.z=Math.sin(c.t*2.2)*(c.burn?0.03:0.06);
    if(c.y<=c.gy){ c.y=c.gy; c.state='land'; c.t=0; c.g.rotation.z=0; dustAt(c.x,c.z,1.6); sfxThud(0.6); shockwave(c.x,c.z,5,[1,0.85,0.5]); } }
  else if(c.state==='land'){ if(c.t<0.45&&rnd()<0.6){ const sm=mix3(P.side,[0.72,0.7,0.68],0.6); SMOKE.spawn(c.x+(rnd()-0.5)*1.4,c.gy+0.2,c.z+(rnd()-0.5)*1.4,(rnd()-0.5)*3,0.8,(rnd()-0.5)*3,0.8,1.6,0.9,0.4,sm[0],sm[1],sm[2]); }
    c.lid.rotation.x=-Math.min(1,Math.max(0,(c.t-0.35)/0.45))*1.95; if(c.t>0.85){ c.state='ready'; c.t=0; sfxHatch(); } }
  else if(c.state==='ready'){ const k=0.55+0.35*Math.sin(c.t*4); c.aura.material.opacity=k; c.glow.material.opacity=k*0.5; const s=2.4+Math.sin(c.t*4)*0.25; c.aura.scale.setScalar(s); c.glow.scale.setScalar(s*0.95);
    if(!TK.dead&&Math.hypot(TK.x-c.x,TK.z-c.z)<4.5) crateGive(c); }
  else if(c.state==='give'){ c.aura.material.opacity=0.9; const tx=TK.x, ty=TK.y+1.4, tz=TK.z;
    for(let j=c.fly.length-1;j>=0;j--){ const f=c.fly[j]; f.t+=dt; if(f.t<0) continue; f.m.visible=true; const k=Math.min(1,f.t/0.55), e2=k*k; f.m.position.set(lerp(c.x,tx,e2),lerp(c.gy+1,ty,e2)+Math.sin(k*Math.PI)*2.2,lerp(c.z,tz,e2)); f.m.rotation.x+=dt*12; f.m.rotation.z+=dt*9;
      if(k>=1){ scene.remove(f.m); c.fly.splice(j,1); sfxPickup(0); } }
    if(!c.fly.length&&c.t>0.3){ c.state='spent'; c.t=0; } }
  else if(c.state==='spent'){ c.aura.material.opacity=Math.max(0,c.aura.material.opacity-dt); c.glow.material.opacity=Math.max(0,c.glow.material.opacity-dt);
    if(c.t>10){ const on=Math.floor((c.t-10)*7)%2===0; c.g.visible=on||c.t>11.6; c.aura.material.color.setRGB(1,0.25,0.15); c.aura.material.opacity=on?0.9:0; c.aura.scale.setScalar(1.6); if(on&&!c.beep){ c.beep=true; sO(1200,1100,0.06,0.08,'square'); } if(!on) c.beep=false; }
    if(c.t>11.6){ c.state='boom'; c.g.visible=false; explode(c.x,0.6,c.z,1.0,0.7,0,-1,0,'shell',null,0,null,0.25); for(const m of [c.g,c.aura,c.glow]) scene.remove(m); CRATES.splice(i,1); continue; } }
  c.g.position.set(c.x,c.y,c.z); c.aura.position.set(c.x,c.gy+0.08,c.z); c.glow.position.set(c.x,c.gy+0.06,c.z); } }
function crateGive(c){ c.state='give'; c.t=0; const got=[]; for(const [id,name] of [['mg','патронов'],['cn','снарядов'],['rk','ракет']]){ if(id==='rk'&&!UP.rk) continue; const add=Math.max(0,Math.floor(ammoCap(id)-ST.ammo[id])); ST.ammo[id]=ammoCap(id); if(add>0) got.push([add,name,id]); }
  updateWeaponUI(); got.forEach(([n,name],k)=>setTimeout(()=>popText(TK.x,TK.y+2.6+k*0.7,TK.z,`+${n} ${name}`,'ammo'),180+k*260)); if(!got.length) popText(TK.x,TK.y+2.6,TK.z,'боезапас полон','ammo');
  for(let k=0;k<16;k++){ const isShell=k%3===0, m=new THREE.Mesh(crGeo.cyl,isShell?crMat.dark:crMat.brass); m.scale.set(isShell?0.12:0.06,isShell?0.42:0.26,isShell?0.12:0.06); m.visible=false; scene.add(m); EXTRAS.push(m); c.fly.push({m,t:-k*0.06}); }
  sfxPickup(1); }
function kitsHud(){ for(const [k,id] of [['rep','#kRep'],['ammo','#kAmmo'],['art','#kArt']]){ const b=$(id), n=ST.kits?ST.kits[k]:0, av=kitAvail(k); b.disabled=!av; const bd=b.querySelector('b'); bd.textContent=n>0?String(n):''; bd.hidden=!(n>0&&av); b.classList.toggle('has',n>0); } }
function kitsCard(){ const row=(k,t,info,icon)=>{ const n=ST.kits[k], can=ST.scrap>=KIT_COST[k];
    return `<div class="kitrow"><span class="kico">${icon}</span><div><b>${t}</b><span>${info}</span></div>${n>=KIT_MAX?`<button class="btn" disabled>Есть · ${n}/${KIT_MAX}</button>`:`<button class="btn solid" data-kit="${k}" ${can?'':'disabled'}>${nutI} ${KIT_COST[k]}</button>`}</div>`; };
  return `<section class="gcard"><div class="ghead"><h3>Экстренная поддержка</h3><span>в бою · кнопки справа сверху</span></div>`+row('rep','Экстренный ремонт','мгновенно чинит корпус целиком',KIT_SVG.rep)+row('ammo','Сброс боеприпасов','ящик с неба на ближайшую дорогу',KIT_SVG.ammo)+row('art','Артиллерийский удар','три залпа по два снаряда · круги ложатся под врагов рядом',KIT_SVG.art)+
    `<p class="gnote">Можно держать по одному. Второй слот откроется позже за просмотр рекламного ролика.</p></section>`; }
const KIT_SVG={art:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5" stroke-width="1.6"/><circle cx="12" cy="12" r="2.6" stroke-width="1.6"/><path d="M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5" stroke-width="1.6"/></svg>',rep:'<svg viewBox="0 0 24 24"><path d="M12 4v16M4 12h16" stroke-width="3"/><circle cx="12" cy="12" r="10" stroke-width="1.4"/></svg>',ammo:'<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="11" rx="1" stroke-width="1.6"/><path d="M3 13h18M8 9V5h2v4M12 9V4h2v5M16 9V5h2v4" stroke-width="1.4"/></svg>'};

