/* ================= v31.0: people — a light «ragdoll», the tank's touch, speech bubbles, the rescued in the camp =================
   Ragdoll lite: the body tips over its feet about an axis across the fall direction (a pendulum that lands and
   bounces), flies when thrown, and every joint is a damped spring towards a random «limp» pose that gets kicked on
   impact. A blast closer than 3 m may tear the body in two (upper / lower half fly as debris, no blood).
   The tank: slow — a push and a word back; fast — thrown, gets up and runs on; very fast (outside the camp) — dead. */
const RAGS=[]; const PPL_SLOW=3, PPL_DEADLY=7.5;
const _pq1=new THREE.Quaternion(), _pq2=new THREE.Quaternion(), _pax=new THREE.Vector3(), _pup=new THREE.Vector3(0,1,0);
const BUMP_LINES=['Эй, смотри куда едешь!','Мы же свои!','Танкист, полегче!','Ай, моя тачка!','Я тебе не робот!','Осторожнее, у меня внуки!','Глаза разуй!'];
const UP_LINES=['Ох… вроде живой.','Вот это полёт!','Ты что творишь?!','Мои кости…','Да я же пешком шёл!'];
const THANKS=['Спасибо, танкист!','Это он нас вывел!','Слава водителю!','Заезжай на чай!','Без тебя бы не дошли.'];
function pplPick(a){ return a[(rnd()*a.length)|0]; }
function ragJ(c){ const R=(a,b)=>a+rnd()*(b-a), s=rnd()<0.5?-1:1, J=[];
  const add=(o,a,T)=>{ if(o) J.push({o,a,v:o.rotation[a],u:(rnd()-0.5)*6,T}); };
  add(c.aL,'x',R(-2.6,-0.4)); add(c.aL,'z',R(0.2,1.3)); add(c.aR,'x',R(-2.6,-0.4)); add(c.aR,'z',-R(0.2,1.3)); add(c.eL,'x',R(-1.4,-0.1)); add(c.eR,'x',R(-1.4,-0.1));
  add(c.lL,'x',R(-0.8,0.5)); add(c.lR,'x',R(-0.8,0.5)); add(c.kL,'x',R(0.1,1.4)); add(c.kR,'x',R(0.1,1.4)); add(c.torso,'x',R(-0.35,0.35)); add(c.torso,'z',s*R(0,0.25)); add(c.head,'x',R(-0.6,0.7)); add(c.head,'z',R(-0.5,0.5)); add(c.head,'y',R(-0.8,0.8));
  return J; }
/* o: {vx,vy,vz, w (spin), up (seconds until getting up; null = dead)} */
function ragStart(c,o){ const l=Math.hypot(o.vx,o.vz); let ax=l>0.2?o.vx/l:Math.sin(c.h), az=l>0.2?o.vz/l:Math.cos(c.h);
  /* the body tips along the push, whatever way it was facing */
  const r={vx:o.vx,vy:o.vy||0,vz:o.vz,ax,az,th:c.rg?c.rg.th:0,w:o.w==null?3:o.w,up:o.up==null?null:o.up,t:0,rise:0,J:c.rg?c.rg.J:ragJ(c),sink:false};
  if(c.rg) for(const j of r.J) j.u+=(rnd()-0.5)*10; c.rg=r; c.y=c.y||0; if(o.up!=null) c.st='rag'; }
function ragUpdate(c,dt){ const r=c.rg; if(!r) return; r.t+=dt; let land=false;
  if(r.sink){ c.y-=dt*0.35; } else { r.vy-=18*dt; c.y+=r.vy*dt; if(c.y<=0){ c.y=0; if(r.vy<-2.5){ r.vy=-r.vy*0.28; land=true; } else r.vy=0; } }
  const air=c.y>0.03&&!r.sink, f=Math.exp(-(air?0.35:5.5)*dt); r.vx*=f; r.vz*=f;
  const nx=c.x+r.vx*dt, nz=c.z+r.vz*dt; if(civFree(nx,nz)){ c.x=nx; c.z=nz; } else { r.vx*=-0.3; r.vz*=-0.3; if(Math.hypot(r.vx,r.vz)>1) land=true; }
  if(r.up!=null&&r.up<=0&&!air){ /* getting up: everything springs back to standing */
    if(!r.rise){ r.th0=((r.th%TAU)+TAU)%TAU; if(r.th0>Math.PI) r.th0-=TAU; for(const j of r.J) j.T=0; }
    r.rise+=dt; const k=Math.min(1,r.rise/0.85); r.th=r.th0*(1-k*k*(3-2*k));
    if(k>=1){ for(const j of r.J) j.o.rotation[j.a]=0; c.rg=null; c.g.quaternion.identity(); c.y=0; c.st=c.after||'run'; if(c.sayUp){ c.sayUp=false; pplSay(c,pplPick(UP_LINES)); } return; } }
  else if(air){ r.th+=r.w*dt; }
  else { let th=((r.th%TAU)+TAU)%TAU; const tgt=th<Math.PI?Math.PI/2:Math.PI*1.5; r.w+=((tgt-th)*42-r.w*7)*dt; r.th=th+r.w*dt; }
  if(r.up!=null) r.up-=dt;
  for(const j of r.J){ j.u+=((j.T-j.v)*32-j.u*5.5)*dt; j.v+=j.u*dt; j.o.rotation[j.a]=j.v; }
  if(land){ for(const j of r.J) j.u+=(rnd()-0.5)*16; if(r.t>0.15) sfxThud(0.12); dustAt(c.x,c.z,0.35); }
  _pq1.setFromAxisAngle(_pax.set(r.az,0,-r.ax),r.th); _pq2.setFromAxisAngle(_pup,c.h); c.g.quaternion.multiplyQuaternions(_pq1,_pq2);
  c.g.position.set(c.x,groundH(c.x,c.z)+c.y+0.13*Math.abs(Math.sin(r.th)),c.z); }
/* a dead body: stays a while, then sinks into the ground */
function ragsTick(dt){ for(let i=RAGS.length-1;i>=0;i--){ const c=RAGS[i]; if(!c.g.parent||!c.rg){ RAGS.splice(i,1); continue; } ragUpdate(c,dt); const r=c.rg; if(!r) { RAGS.splice(i,1); continue; }
    if(r.t>9&&!r.sink) r.sink=true; if(r.t>12){ scene.remove(c.g); RAGS.splice(i,1); } else if(r.t<9) shadowAdd(c.x,c.z,0.9,0,0.3); }
  if(RAGS.length>12){ const c=RAGS.shift(); scene.remove(c.g); } }
/* death: shot → falls; blast close by → torn in two (60 %) or thrown; o.tank → thrown hard by the hull */
function pplKill(c,ux,uz,force,o){ o=o||{}; c.st='dead';
  if(!o.tank&&force>=3&&rnd()<0.6){ c.g.updateMatrixWorld(true); const up=new THREE.Group(); c.torso.getWorldPosition(up.position); scene.add(up); EXTRAS.push(up); up.attach(c.torso); up.attach(c.head);
    GIBS.push(gibOf(up,ux*(3+force)+(rnd()-0.5)*3,3+force*0.5+rnd()*2,uz*(3+force)+(rnd()-0.5)*3,9)); GIBS.push(gibOf(c.g,ux*(1.5+force*0.5)+(rnd()-0.5)*2,1.5+rnd()*1.5,uz*(1.5+force*0.5)+(rnd()-0.5)*2,6));
    for(let k=0;k<8;k++) SMOKE.spawn(c.x,groundH(c.x,c.z)+0.9,c.z,ux*2+(rnd()-0.5)*3,1+rnd()*2,uz*2+(rnd()-0.5)*3,0.35,1.2,0.6,0.5,0.45,0.42,0.38); return; }
  const k=o.tank?1:Math.min(1,force/4); ragStart(c,{vx:o.vx!=null?o.vx:ux*(1.2+force*1.6),vz:o.vz!=null?o.vz:uz*(1.2+force*1.6),vy:o.vy!=null?o.vy:(force>=3?2.5+force*0.7:0.4+k),w:o.w!=null?o.w:2+force*1.5,up:null});
  c.st='dead'; RAGS.push(c); }
/* the hull touches a person: returns true when it did */
function pplTank(c,lethal){ if(TK.dead||transit||(c.hitT||0)>0) return false; const fx=Math.sin(TK.h), fz=Math.cos(TK.h), dx=c.x-TK.x, dz=c.z-TK.z, lz=dx*fx+dz*fz, lx=dx*fz-dz*fx;
  if(Math.abs(lz)>FOOT.L+0.35||Math.abs(lx)>FOOT.W+0.35) return false;
  const sp=Math.hypot(TK.vx,TK.vz), l=Math.hypot(dx,dz)||1, px=dx/l, pz=dz/l; c.hitT=0.9;
  if(sp<0.6){ c.x+=px*0.08; c.z+=pz*0.08; c.hitT=0; return true; }
  if(sp<PPL_SLOW){ ragStart(c,{vx:px*2.6+TK.vx*0.6,vz:pz*2.6+TK.vz*0.6,vy:0.6,w:2.4,up:0.75}); pplSay(c,pplPick(BUMP_LINES)); sfxThud(0.25); return true; }
  if(sp<PPL_DEADLY||!lethal){ ragStart(c,{vx:TK.vx*1.05+px*3,vz:TK.vz*1.05+pz*3,vy:3+sp*0.3,w:5+sp*0.7,up:1.9}); c.sayUp=true; sfxThud(0.5); shake=Math.min(1,shake+0.08); return true; }
  civDie(c,TK.vx/sp,TK.vz/sp,1,{tank:true,vx:TK.vx*1.2+px*2,vz:TK.vz*1.2+pz*2,vy:4+sp*0.3,w:9}); sfxThud(0.7); return true; }

/* ---- speech bubbles over heads ---- */
const BUBS=[];
function pplSay(c,txt){ if((c.sayT||0)>0) return; c.sayT=5; let b=BUBS.find(q=>q.t<=0); if(!b){ const d=document.createElement('div'); d.className='bub'; document.body.appendChild(d); b={el:d,t:0}; BUBS.push(b); }
  b.el.textContent=txt; b.c=c; b.t=2.2; b.el.hidden=false; }
function bubsTick(dt){ for(const b of BUBS){ if(b.t<=0) continue; b.t-=dt; const c=b.c; if(b.t<=0||!c.g.parent){ b.t=0; b.el.hidden=true; continue; }
    const s=toScreen(c.x,groundH(c.x,c.z)+(c.y||0)+2.15,c.z); b.el.style.transform=`translate(${s[0]|0}px,${s[1]|0}px) scale(${Math.min(1,(2.2-b.t)*7).toFixed(2)})`; b.el.style.opacity=Math.min(1,b.t*3).toFixed(2); } }

/* ---- dress: straw hats for the tea pickers, glasses for Liu ---- */
const PPLG={cone:new THREE.ConeGeometry(0.34,0.2,12),band:new THREE.CylinderGeometry(0.16,0.16,0.04,10),lens:new THREE.TorusGeometry(0.045,0.01,4,10),bag:new THREE.BoxGeometry(0.34,0.3,0.18)};
const PPLM={straw:new THREE.MeshToonMaterial({color:0xd8b56a,gradientMap:gradTex}),dark:new THREE.MeshToonMaterial({color:0x1d1f22,gradientMap:gradTex}),bag:new THREE.MeshToonMaterial({color:0x8a6a48,gradientMap:gradTex}),coat:new THREE.MeshToonMaterial({color:0xe8ecef,gradientMap:gradTex})};
function pplDress(c,kind){ if(kind==='tea'){ const h=new THREE.Mesh(PPLG.cone,PPLM.straw); h.position.y=0.2; c.head.add(h); }
  else if(kind==='ford'){ const b=new THREE.Mesh(PPLG.bag,PPLM.bag); b.position.set(0,0.35,-0.2); c.torso.add(b); }
  else if(kind==='liu'){ for(const s of [-1,1]){ const l=new THREE.Mesh(PPLG.lens,PPLM.dark); l.position.set(s*0.055,0.02,0.145); c.head.add(l); } c.torso.children[0].material=PPLM.coat; } }

/* ================= the rescued in the camp: groups of two or three between the tents ================= */
const CAMPP={list:[],key:'',wanderT:25};
const CAMP_SLOTS=[[52.6,14],[57,14.3],[61.6,13.8],[66,14.3],[70.6,14],[52.6,26.6],[57.2,26.9],[62,26.3],[66.8,26.9],[71,26.5]];
function campWho(){ const c=MS.camp||{}, out=[]; for(const [k,n] of [['tea',c.tea|0],['ford',c.ford|0],['canal',c.canal|0]]) for(let i=0;i<n;i++) out.push(k); return out.slice(0,18); }
function campPeopleClear(){ for(const p of CAMPP.list) scene.remove(p.g); CAMPP.list.length=0; CAMPP.key=''; }
function campPeopleSync(){ campPeopleClear(); }
function campPeopleBuild(){ const who=campWho(), liu=!!(MS.camp&&MS.camp.liu); CAMPP.key=who.join(',')+(liu?'+liu':''); if(!who.length&&!liu) return;
  let si=0, k=0; while(k<who.length&&si<CAMP_SLOTS.length){ const n=Math.min(who.length-k,(si*7+3)%3===0?3:2+(si%2)), s=CAMP_SLOTS[si++];
    for(let j=0;j<n;j++){ const a=j/n*TAU+si, x=s[0]+Math.cos(a)*0.85, z=s[1]+Math.sin(a)*0.85; if(!civFree(x,z)) continue;
      const c=civMake(x,z,k*3+j); pplDress(c,who[k]); c.slot=s; c.h=Math.atan2(s[0]-x,s[1]-z); c.st='talk'; c.ph=rnd()*TAU; c.camp=true; CAMPP.list.push(c); k++; if(k>=who.length) break; } }
  if(liu){ const c=civMake(58.5,29.6,2); pplDress(c,'liu'); c.slot=[57.5,31.5]; c.h=Math.atan2(-1,1.9); c.st='talk'; c.solo=true; c.ph=0; c.camp=true; CAMPP.list.push(c); }
  for(const c of CAMPP.list){ c.g.position.set(c.x,groundH(c.x,c.z),c.z); c.g.rotation.y=c.h; } }
function campPeopleTick(dt,t){ if(LOC_ID!=='camp'){ if(CAMPP.list.length) CAMPP.list.length=0; CAMPP.key=''; return; }
  const want=campWho().join(',')+(MS.camp&&MS.camp.liu?'+liu':'');
  if(CAMPP.key!==want||(CAMPP.list.length&&!CAMPP.list[0].g.parent)){ if(!transit) { campPeopleClear(); campPeopleBuild(); } return; }
  if(!CAMPP.list.length) return;
  const tk=!TK.dead&&!transit, sp=Math.hypot(TK.vx,TK.vz);
  /* who talks in each group: changes every few seconds */
  if((CAMPP.spkT=(CAMPP.spkT||0)-dt)<=0){ CAMPP.spkT=2.5+rnd()*2.5; for(const c of CAMPP.list) c.spk=false; const by={}; for(const c of CAMPP.list){ if(c.st!=='talk') continue; const k=c.slot.join(); (by[k]=by[k]||[]).push(c); } for(const k in by){ const g=by[k]; g[(rnd()*g.length)|0].spk=true; } }
  /* now and then somebody walks over to another group */
  if((CAMPP.wanderT-=dt)<=0){ CAMPP.wanderT=20+rnd()*20; const c=CAMPP.list.filter(q=>q.st==='talk'&&!q.solo)[(rnd()*CAMPP.list.length)|0]; if(c){ const s=CAMP_SLOTS[(rnd()*CAMP_SLOTS.length)|0], a=rnd()*TAU, x=s[0]+Math.cos(a)*0.9, z=s[1]+Math.sin(a)*0.9; if(civFree(x,z)&&s!==c.slot){ c.st='walk'; c.slot=s; c.to=[x,z]; } } }
  for(const c of CAMPP.list){ c.hitT=Math.max(0,(c.hitT||0)-dt); c.sayT=Math.max(0,(c.sayT||0)-dt);
    if(c.st==='rag'){ ragUpdate(c,dt); if(c.st!=='rag'){ c.st='talk'; c.after=null; } continue; }
    const dT=Math.hypot(TK.x-c.x,TK.z-c.z); if(tk&&dT<4.5&&pplTank(c,false)){ c.after='talk'; continue; }
    if(Math.hypot(c.x-TK.x,c.z-TK.z)>45) continue; /* far: frozen */
    if(c.st==='walk'){ const ax=c.to[0]-c.x, az=c.to[1]-c.z, l=Math.hypot(ax,az); if(l<0.15){ c.st='talk'; c.h=Math.atan2(c.slot[0]-c.x,c.slot[1]-c.z); }
      else { const v=Math.min(1.5,l*3), nx=c.x+ax/l*v*dt, nz=c.z+az/l*v*dt; if(civFree(nx,nz)){ c.x=nx; c.z=nz; } else c.st='talk'; c.h=turnTo(c.h,Math.atan2(ax,az),dt*8); c.ph+=dt*v*3; gaitPose({hipL:c.lL,hipR:c.lR,kneeL:c.kL,kneeR:c.kR,armL:c.aL,armR:c.aR,elbL:c.eL,elbR:c.eR,torso:c.torso},c.ph,0.8); } }
    else { /* talking: breathing, nodding, the speaker waves his hands, everyone turns to a tank that rolls up */
      const ph=t*1.7+c.ph, look=tk&&dT<7&&sp>0.3;
      c.torso.rotation.x=0.03+Math.sin(ph)*0.02; c.torso.rotation.z=Math.sin(ph*0.37)*0.04; c.lL.rotation.x=c.lR.rotation.x=0; c.kL.rotation.x=c.kR.rotation.x=0.04;
      if(look){ const want=wrapA(Math.atan2(TK.x-c.x,TK.z-c.z)-c.h); c.head.rotation.y+=(Math.max(-1.1,Math.min(1.1,want))-c.head.rotation.y)*Math.min(1,dt*5); c.aR.rotation.x=-2.7; c.aR.rotation.z=-0.3+Math.sin(t*9+c.ph)*0.35; c.eR.rotation.x=-0.4; c.aL.rotation.x=0; c.eL.rotation.x=-0.2;
        if(dT<5&&rnd()<dt*0.25) pplSay(c,pplPick(THANKS)); }
      else { c.head.rotation.y*=Math.exp(-dt*3); c.head.rotation.x=c.spk?Math.sin(t*6+c.ph)*0.08:Math.sin(t*0.9+c.ph)*0.05;
        if(c.spk){ c.aR.rotation.x=-0.7-Math.sin(t*3.1+c.ph)*0.45; c.aR.rotation.z=-0.15; c.eR.rotation.x=-1.0+Math.sin(t*4.3)*0.3; c.aL.rotation.x=-0.3-Math.max(0,Math.sin(t*2.3+1))*0.5; c.eL.rotation.x=-0.6; }
        else { c.aR.rotation.x=c.aR.rotation.x*0.9; c.aR.rotation.z=0; c.eR.rotation.x=-0.25; c.aL.rotation.x=-0.05; c.eL.rotation.x=-0.25+(c.ph%1>0.5?-0.9:0); }
        if(!c.solo&&rnd()<dt*0.04) c.laugh=0.5; if(c.laugh>0){ c.laugh-=dt; c.torso.rotation.x=-0.12+Math.sin(t*40)*0.05; } } }
    c.g.position.set(c.x,groundH(c.x,c.z),c.z); c.g.rotation.y=c.h; shadowAdd(c.x,c.z,0.75,0,0.35); } }
function pplTick(dt,t){ ragsTick(dt); bubsTick(dt); campPeopleTick(dt,t); }
