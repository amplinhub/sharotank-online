/* ================= v11: middle-click lock · minigun motor · heavier robots · celebrations ================= */
function midAim(e){ if(LOC.safe||TK.dead||transit) return; aimMode='mouse'; aimActivity(); const t=pickEnemyAt(e.clientX,e.clientY);
  if(t){ AIM.manual=t; tapFx(e.clientX,e.clientY,true); sfxClick(); toast('Цель захвачена · средняя кнопка по пустому месту — сброс'); } else { if(AIM.manual) toast('Захват снят'); AIM.manual=null; tapFx(e.clientX,e.clientY,false); } }
addEventListener('mousedown',e=>{ if(e.button===1) e.preventDefault(); });

/* ---- minigun electric motor whine follows barrel spin ---- */
const MGM={o:null,o2:null,g:null,f:null};
function mgMotorUpdate(){ const ctx=SND.ctx; if(!ctx) return; const t=ctx.currentTime;
  if(!MGM.o){ MGM.o=ctx.createOscillator(); MGM.o.type='sawtooth'; MGM.o2=ctx.createOscillator(); MGM.o2.type='square'; MGM.f=ctx.createBiquadFilter(); MGM.f.type='bandpass'; MGM.f.Q.value=3; MGM.g=ctx.createGain(); MGM.g.gain.value=0;
    const g2=ctx.createGain(); g2.gain.value=0.35; MGM.o.connect(MGM.f); MGM.o2.connect(g2); g2.connect(MGM.f); MGM.f.connect(MGM.g); MGM.g.connect(SND.master); MGM.o.start(); MGM.o2.start(); }
  const w=WEAP[0], spin=(w&&w.spin&&wcur===0&&!GAR.open&&!transit&&!SND.muted)?mgSpin:0, f=90+spin*720+(spin>0.9?Math.sin(t*40)*6:0);
  MGM.o.frequency.setTargetAtTime(f,t,0.05); MGM.o2.frequency.setTargetAtTime(f*0.5,t,0.05); MGM.f.frequency.setTargetAtTime(f*2.2+200,t,0.05);
  MGM.g.gain.setTargetAtTime(spin>0.02?0.035+0.06*spin:0,t,spin>0.02?0.04:0.12); }

/* ---- metal footsteps: every robot clanks, heavy ones shake the ground ---- */
function stepImpact(e,L){ if(e.wc.heavy){ stepHeavy(e,L); return; } const d=Math.hypot(L.foot.x-TK.x,L.foot.z-TK.z); if(d>28) return; const k=1-d/28, m=e.mass||1;
  if(m>=2.5){ shake=Math.min(1,shake+0.012*m*k); sfxThud(0.06*m*k+0.03); if(rnd()<0.5){ const dc=mix3(P.side,[1,1,1],0.15); SMOKE.spawn(L.foot.x,L.foot.y+0.1,L.foot.z,(rnd()-0.5)*1.5,0.4,(rnd()-0.5)*1.5,0.5*Math.min(2,m/2),1.4,0.7,0.3,dc[0],dc[1],dc[2]); } }
  e.stT=(e.stT||0); const now=performance.now(); if(now-e.stT<90) return; e.stT=now; if(SND.ctx&&k>0.15) sO(m>=2.5?150+rnd()*40:380+rnd()*160,m>=2.5?80:220,m>=2.5?0.09:0.04,(m>=2.5?0.05:0.022)*k,'square'); }

/* ---- 8-bit jingles ---- */
const NOTE=n=>440*Math.pow(2,(n-69)/12);
function jingle(seq,type,vol){ const ctx=SND.ctx; if(!ctx||SND.muted) return; const t0=ctx.currentTime+0.02;
  for(const [n,at,dur] of seq){ const ns=Array.isArray(n)?n:[n]; for(const nn of ns){ const o=ctx.createOscillator(), g=ctx.createGain(); o.type=type||'square'; o.frequency.value=NOTE(nn);
      g.gain.setValueAtTime(0.0001,t0+at); g.gain.exponentialRampToValueAtTime((vol||0.07)/Math.sqrt(ns.length),t0+at+0.01); g.gain.setValueAtTime((vol||0.07)/Math.sqrt(ns.length)*0.8,t0+at+dur*0.7); g.gain.exponentialRampToValueAtTime(0.0001,t0+at+dur);
      o.connect(g); g.connect(SND.master); o.start(t0+at); o.stop(t0+at+dur+0.02); } } }
const sfxWin=()=>{ jingle([[72,0,0.12],[76,0.12,0.12],[79,0.24,0.12],[84,0.36,0.3],[79,0.68,0.1],[84,0.8,0.55],[[72,76,79,84],0.8,0.9]],'square',0.08); jingle([[48,0,0.3],[55,0.36,0.3],[48,0.8,0.9]],'triangle',0.12); };
const sfxRankUp=()=>{ jingle([[79,0,0.1],[83,0.1,0.1],[86,0.2,0.1],[91,0.3,0.5],[[86,91,95],0.3,0.8]],'square',0.06); jingle([[96,0.3,0.6],[103,0.45,0.8]],'sine',0.05); };
const sfxLose=()=>{ jingle([[67,0,0.22],[66,0.24,0.22],[65,0.48,0.22],[64,0.72,0.7]],'square',0.07); jingle([[43,0,0.5],[40,0.5,0.9]],'triangle',0.12); };
const sfxAccept=()=>{ jingle([[67,0,0.08],[72,0.09,0.08],[76,0.18,0.2]],'square',0.06); };
const sfxPop=k=>{ sNz(0.25,'highpass',1500,0.7,0.12*k); sNz(0.6,'bandpass',3500,0.5,0.06*k,0.05); };

/* ---- mission complete: fireworks, stamp, counting reward, rank-up, a reason to go back to HQ ---- */
function fireworks(){ const cols=[[1,0.8,0.25],[0.24,1,0.71],[1,1,1],[1,0.45,0.3]];
  for(let b=0;b<5;b++) later(0.15+b*0.32,()=>{ const a=rnd()*TAU, r=3+rnd()*5, x=TK.x+Math.cos(a)*r, z=TK.z+Math.sin(a)*r, y=6+rnd()*4, c=cols[b%cols.length];
    FIRE.spawn(x,y,z,0,0,0,3,3,0.25,1,c[0],c[1],c[2]); for(let k=0;k<44;k++){ const u=rnd()*TAU, v=Math.acos(2*rnd()-1), s=7+rnd()*5; spark(x,y,z,Math.sin(v)*Math.cos(u)*s,Math.cos(v)*s+2,Math.sin(v)*Math.sin(u)*s,c[0],c[1],c[2],0.7+rnd()*0.6); }
    sfxPop(1); groundFlash(x,z,8,c,0.3); });
  shockwave(TK.x,TK.z,10,[1,0.8,0.3]); later(0.2,()=>shockwave(TK.x,TK.z,14,[0.24,1,0.71])); }
let winT=0;
function showWin(m,up,final){ const w=$('#win'); $('#winK').textContent=final?'胜利':'任务完成'; $('#winH').textContent=final?'«Нефрит» отключён':'Задание выполнено'; $('#winT').textContent=m.title?`«${m.title}»`:missionText(m);
  $('#winRank').hidden=!up; if(up){ $('#winRankIco').innerHTML=rankSVG(MS.rank); $('#winRankN').textContent=RANKS[MS.rank]; }
  $('#winNext').textContent=final?'Кампания пройдена · штаб продолжит выдавать задания':'Новое задание ждёт в штабе'; w.hidden=false; w.classList.remove('on','out'); void w.offsetWidth; w.classList.add('on'); winT=5.2;
  const R=$('#winR'), t0=performance.now(), dur=1200; const tick=()=>{ const k=Math.min(1,(performance.now()-t0-450)/dur); if(k>0){ R.textContent='+'+Math.round(m.r*k*(2-k)); if(SND.ctx&&Math.random()<0.35&&k<1) sO(900+k*900,1200+k*900,0.03,0.03,'square'); } if(k<1&&!w.hidden) requestAnimationFrame(tick); else R.textContent='+'+m.r; }; R.textContent='+0'; requestAnimationFrame(tick);
  fireworks(); sfxWin(); if(up) later(1.6,sfxRankUp); hitStop=Math.max(hitStop,0.12); camPunch=Math.max(camPunch,0.8); }
function winOut(){ const w=$('#win'); if(w.hidden||w.classList.contains('out')) return; winT=0; w.classList.add('out'); sO(700,1500,0.12,0.05,'square'); setTimeout(()=>{ w.hidden=true; w.classList.remove('out'); },300); }
function winUpdate(dt){ if(winT>0){ winT-=dt; if(winT<=0) winOut(); } }
for(const ev of ['pointerdown','touchstart','click']) $('#win').addEventListener(ev,e=>{ if(!e.target.closest('.wbx')) return; e.stopPropagation(); if(ev==='click'||ev==='pointerdown') winOut(); },{passive:true});
/* ---- defeat: sad jingle, desaturated screen, the general on the radio ---- */
function onTankLost(){ SHD.on=false; sfxLose(); canvas.classList.add('lost'); setTimeout(()=>radioSay(['Водитель, ты подбит! Тягач уже выехал, эвакуируем тебя в лагерь.','Машина горит! Держись, водитель, вытащим тебя в лагерь.','Подбит, но жив — это главное. Механики в лагере тебя подлатают.'][(rnd()*3)|0]),900); }
function v11Update(dt){ mgMotorUpdate(); winUpdate(dt); if(!TK.dead&&canvas.classList.contains('lost')) canvas.classList.remove('lost'); }

/* ================= v12: tank abilities · motor pool (автопарк) ================= */
/* ---- «Тень»: stealth ---- */
const STL={t:0,on:false,bonus:0};
function stealthShot(){ if(chs().abil!=='stealth') return; if(STL.on) STL.bonus=0.7; STL.t=0; setStealth(false); }
function stealthMul(){ return STL.bonus>0?2:1; }
/* ---- «Крепость»: deployable shield dome ---- */
const SHD={on:false,hp:260,max:260,cd:0,g:null,rip:0,grow:0,R:4.3};
function shieldMake(){ const g=new THREE.Group(); g.add(new THREE.Mesh(domeGeo,new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:0.08,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending})));
  g.add(new THREE.LineSegments(domeEdges,new THREE.LineBasicMaterial({color:0xffd27a,transparent:true,opacity:0.4,depthWrite:false,blending:THREE.AdditiveBlending}))); g.renderOrder=6; g.visible=false; scene.add(g); SHD.g=g; }
function shieldToggle(){ if(chs().abil!=='shield'||TK.dead||transit) return; if(LOC.safe){ toast('В лагере щит не нужен'); return; }
  if(SHD.on){ SHD.on=false; sO(800,200,0.35,0.06,'sawtooth'); return; }
  if(SHD.cd>0||SHD.hp<SHD.max*0.25){ toast('Щит перезаряжается'); sfxClick(); return; } SHD.on=true; SHD.grow=0; TK.vx*=0.3; TK.vz*=0.3; sO(220,880,0.5,0.08,'sine'); sNz(0.4,'bandpass',1800,1,0.08); }
function shieldHit(a,hx,hy,hz){ SHD.hp-=a; SHD.rip=1; if(hx!=null){ for(let k=0;k<6;k++) spark(hx,hy,hz,(rnd()-0.5)*6,(rnd()-0.5)*6,(rnd()-0.5)*6,1,0.85,0.45,0.3); FIRE.spawn(hx,hy,hz,0,0,0,1.4,2,0.12,1,1,0.85,0.45); } sNz(0.12,'bandpass',2200,2,0.1);
  if(SHD.hp<=0){ SHD.hp=0; SHD.on=false; SHD.cd=8; toast('Щит пробит · перезарядка 8 с'); sO(900,110,0.6,0.12,'sawtooth'); shake=Math.min(1,shake+0.2); } }
function shieldUpdate(dt,t){ if(!SHD.g) shieldMake(); SHD.max=SHD_MAX[UP.abl|0]; const on=SHD.on&&chs().abil==='shield'&&!TK.dead&&!LOC.safe&&!transit; if(!on) SHD.on=false;
  SHD.cd=Math.max(0,SHD.cd-dt); if(!on&&SHD.cd<=0) SHD.hp=Math.min(SHD.max,SHD.hp+20*dt); SHD.rip=Math.max(0,SHD.rip-dt*3); SHD.grow=Math.min(1,SHD.grow+dt*1.6);
  const g=SHD.g; g.visible=on; if(on){ const k=1-Math.pow(1-SHD.grow,3); g.position.set(TK.x,TK.y+0.3,TK.z); g.scale.setScalar(SHD.R*(0.15+0.85*k)*(1+SHD.rip*0.03)); g.rotation.y+=dt*0.2;
    const low=SHD.hp<SHD.max*0.3, fl=low?0.5+0.5*Math.sin(t*24):1; g.children[0].material.opacity=(0.07+SHD.rip*0.25)*fl; g.children[1].material.opacity=(0.32+SHD.rip*0.5)*fl; }
  if(tank&&tank.flaps) for(const f of tank.flaps) f.rotation.z+=((on?f.userData.s*-1.25:0)-f.rotation.z)*Math.min(1,dt*5); }
function shieldProj(ox,oy,oz,ux,uy,uz,len){ if(!SHD.on) return -1; const cy=TK.y+0.3; if(Math.hypot(ox-TK.x,oy-cy,oz-TK.z)<SHD.R) return -1; return segSphere(ox,oy,oz,ux,uy,uz,len,TK.x,cy,TK.z,SHD.R); }
const SHD_HIT={shd:true};
/* ---- «Игла»: piercing rail beam ---- */
const RAILS=[];
function railShot(w){ if(tank&&tank.coilM) tank.coilT=0; for(let i=0;i<6;i++) setTimeout(()=>{ sO(700+i*260,1100+i*300,0.05,0.035,'square'); },i*45); mdir.y=clamp(mdir.y,-0.12,0.3); mdir.normalize(); const L0=RAIL_L[UP.cal|0], wall=raycast(muz.x,muz.y,muz.z,mdir.x,mdir.y,mdir.z,L0); let L=wall?RH.t:L0, zHit=null; const zp=zontProj(muz.x,muz.y,muz.z,mdir.x,mdir.y,mdir.z,L); if(zp){ L=zp[1]; zHit=zp[0]; }
  const dmg=95*stealthMul()*RAIL_K[UP.abl|0], hits=[];
  for(const e of ENEMIES){ if(e.dead) continue; const t=segSphere(muz.x,muz.y,muz.z,mdir.x,mdir.y,mdir.z,L,e.x,e.y+e.hy,e.z,e.hr); if(t>=0) hits.push([t,e]); }
  for(const d of DRONES){ if(d.dead) continue; const t=segSphere(muz.x,muz.y,muz.z,mdir.x,mdir.y,mdir.z,L,d.x,d.y,d.z,0.9); if(t>=0) hits.push([t,d]); }
  for(const c of CIV.list){ if(c.st==='dead'||c.st==='saved') continue; const t=segSphere(muz.x,muz.y,muz.z,mdir.x,mdir.y,mdir.z,L,c.x,groundH(c.x,c.z)+0.95,c.z,0.5); if(t>=0) hits.push([t,c]); }
  hits.sort((a,b)=>a[0]-b[0]); for(const [t,e] of hits){ const hx=muz.x+mdir.x*t, hy=muz.y+mdir.y*t, hz=muz.z+mdir.z*t;
    if(e.civ) civDie(e,mdir.x,mdir.z,4); else if(e.type===undefined){ e.hp-=dmg; e.flash=1; if(e.hp<=0) droneDie(e,mdir.x,mdir.z); } else enemyHit(e,dmg,mdir.x,mdir.z,8,'rail'); hitSpark(hx,hy,hz,mdir.x,mdir.z,12); FIRE.spawn(hx,hy,hz,0,0,0,1.6,2,0.15,1,0.5,0.9,1); }
  const ex=muz.x+mdir.x*L, ey=muz.y+mdir.y*L, ez=muz.z+mdir.z*L; if(zHit) zontAbsorb(zHit,dmg*0.8,ex,ey,ez); else if(L<L0) explode(ex,ey,ez,w.radius*0.8,w.power,mdir.x,mdir.y,mdir.z,'shell',null,0,null,1);
  { const ox=mdir.z*0.26, oz=-mdir.x*0.26; for(const s2 of [-1,1]) RAILS.push({a:[muz.x+ox*s2,muz.y,muz.z+oz*s2],b:[ex+ox*s2*0.3,ey,ez+oz*s2*0.3],t:0}); } for(let s=1.2;s<L;s+=1.6) FIRE.spawn(muz.x+mdir.x*s,muz.y+mdir.y*s,muz.z+mdir.z*s,0,0,0,0.5,1.5,0.18,1,0.45,0.85,1);
  const rel=TK.tYaw-TK.h; TK.pitchV-=w.recoil*1.3*Math.cos(rel); TK.rollV-=w.recoil*Math.sin(rel); TK.recoil=1; shake=Math.min(1,shake+0.25); camPunch=Math.max(camPunch,0.6); groundFlash(muz.x,muz.z,6,[0.45,0.85,1],0.22);
  sNz(0.5,'highpass',1800,0.7,0.3); sO(2400,160,0.45,0.18,'sawtooth'); sfxCannon(); }
function railsUpdate(dt){ for(let i=RAILS.length-1;i>=0;i--){ const r=RAILS[i]; r.t+=dt; const k=1-r.t/0.35; if(k<=0){ RAILS.splice(i,1); continue; } LINES.push(r.a[0],r.a[1],r.a[2],r.b[0],r.b[1],r.b[2],0.55*k+0.3,0.9*k+0.1,1*k,0); } }
/* ---- motor pool: buy and switch tanks ---- */
$('#gpanel').addEventListener('click',e=>{ if(GAR.mode!=='park') return; const b=e.target.closest('button');
  if(b&&!b.disabled&&b.dataset.tkbuy){ const id=b.dataset.tkbuy, c=CHASSIS[id]; if(ST.scrap<c.cost) return; ST.scrap-=c.cost; UP.tanks[id]=1; selectTank(id); GAR.pick=id; sfxBuy(); later(0.3,sfxAccept); toast(`${c.name} теперь твой`); garRebuildModel(); renderPark(); return; }
  if(b&&!b.disabled&&b.dataset.tk){ selectTank(b.dataset.tk); GAR.pick=b.dataset.tk; sfxRev(b.dataset.tk); garRebuildModel(); renderPark(); return; }
  const s=e.target.closest('[data-pick]'); if(s&&!b&&GAR.pick!==s.dataset.pick){ GAR.pick=s.dataset.pick; sfxClick(); garRebuildModel(); renderPark(); } });
/* ---- «Пчела»: kamikaze drone swarm launched from the hull hatch ---- */
const BEE={list:[],cd:0,hatch:0};
const kmGeo={body:new THREE.BoxGeometry(0.3,0.14,0.44),nose:new THREE.SphereGeometry(0.11,10,8),rot:new THREE.CylinderGeometry(0.17,0.17,0.02,12),arm:new THREE.BoxGeometry(0.66,0.04,0.05),fin:new THREE.BoxGeometry(0.02,0.14,0.12)};
const kmMat={y:new THREE.MeshToonMaterial({color:0xf2b21e,gradientMap:gradTex}),d:new THREE.MeshToonMaterial({color:0x22262b,gradientMap:gradTex}),r:new THREE.MeshBasicMaterial({color:0xff4030})};
function kmMake(){ const g=new THREE.Group(), m=(geo,mat,x,y,z)=>{ const o=new THREE.Mesh(geo,mat); o.position.set(x,y,z); g.add(o); return o; };
  m(kmGeo.body,kmMat.y,0,0,0); m(kmGeo.body,kmMat.d,0,0.06,-0.05).scale.set(0.7,0.4,0.6); m(kmGeo.nose,kmMat.r,0,0,0.25); m(kmGeo.fin,kmMat.d,0,0.1,-0.2);
  for(const a of [Math.PI/4,-Math.PI/4]) m(kmGeo.arm,kmMat.d,0,0.02,0).rotation.y=a; const rotors=[]; for(const [x,z] of [[0.23,0.23],[-0.23,0.23],[0.23,-0.23],[-0.23,-0.23]]) rotors.push(m(kmGeo.rot,rdMat.rotor,x,0.07,z));
  scene.add(g); return {g,rotors,p:new THREE.Vector3(),v:new THREE.Vector3(),st:'launch',t:0,tgt:null,tT:0,bee:true,rd:true,dead:false,loc:LOC_ID,ph:rnd()*TAU}; }
function beeLaunch(){ const d=kmMake(); tank.root.updateMatrixWorld(true); tank.hatchPt.getWorldPosition(d.p); d.v.set(-Math.sin(TK.h)*1.5,5,-Math.cos(TK.h)*1.5); BEE.list.push(d); BEE.hatch=1; sO(420,1200,0.35,0.06,'square'); sNz(0.2,'bandpass',900,1,0.06); }
function beeRemove(d){ d.dead=true; const i=BEE.list.indexOf(d); if(i>=0) BEE.list.splice(i,1); scene.remove(d.g); }
function beeBoom(d){ if(d.dead) return; beeRemove(d); const e=d.tgt; if(e&&!e.dead&&Math.hypot(e.x-d.p.x,e.z-d.p.z)<(e.hr||0.8)+1.2&&!zontCovered(e,d.p.x,d.p.y,d.p.z)){ const l=Math.hypot(d.v.x,d.v.z)||1; if(e.type===undefined){ e.hp-=40; e.flash=1; if(e.hp<=0) droneDie(e,d.v.x/l,d.v.z/l); } else enemyHit(e,40,d.v.x/l,d.v.z/l,4,'proj'); } explode(d.p.x,d.p.y,d.p.z,1.8,1.2,0,-1,0,'shell',null,0,null,0); }
function beeDie(d,ux,uz){ if(d.dead) return; beeRemove(d); FIRE.spawn(d.p.x,d.p.y,d.p.z,0,0,0,1,2,0.2,1,1,0.7,0.3); sparkBurst(d.p.x,d.p.y,d.p.z,10); sfxGlass(0.4); }
function beesClear(){ for(const d of BEE.list.slice()) beeRemove(d); }
const _bv=new THREE.Vector3();

function beesUpdate(dt,t){ if(chs().abil!=='drones'||TK.dead||!tank||!tank.hatchPt){ if(BEE.list.length) beesClear(); return; } const mx=1+(UP.abl|0);
  BEE.cd-=dt; if(BEE.list.length<mx&&BEE.cd<=0&&!transit){ beeLaunch(); BEE.cd=3.5; }
  BEE.hatch=Math.max(0,BEE.hatch-dt*1.1); if(tank.hatch) tank.hatch.rotation.x=-Math.min(1,BEE.hatch*2.2)*1.9;
  for(const d of BEE.list.slice()){ if(d.loc!==LOC_ID){ beeRemove(d); continue; } d.t+=dt; d.g.visible=!transit;
    let tx,ty,tz,k=3, vm=9;
    if(d.st==='dive'){ const e=d.tgt; if(!e||e.dead){ d.st='orbit'; d.tgt=null; } else { tx=e.x; ty=e.y+(e.hy||0.6); tz=e.z; k=8; vm=17;
        const dd=Math.hypot(tx-d.p.x,ty-d.p.y,tz-d.p.z); if(dd<(e.hr||0.8)+0.45||d.t>3.2){ beeBoom(d); continue; }
        for(const z of ENEMIES){ if(zontOn(z)&&zontInside(z,d.p.x,d.p.y,d.p.z,0)&&!zontInside(z,TK.x,TK.y+1,TK.z,0)&&!zontInside(z,d.p.x-d.v.x*dt*2,d.p.y-d.v.y*dt*2,d.p.z-d.v.z*dt*2,0)){ beeBoom(d); break; } } if(d.dead) continue;
        if(get(Math.floor(d.p.x/VS),Math.floor(d.p.y/VS),Math.floor(d.p.z/VS))||d.p.y<groundH(d.p.x,d.p.z)+0.1){ beeBoom(d); continue; }
        if(rnd()<0.6) spark(d.p.x,d.p.y,d.p.z,-d.v.x*0.2+(rnd()-0.5),-d.v.y*0.2,-d.v.z*0.2+(rnd()-0.5),1,0.6,0.25,0.25); } }
    if(d.st!=='dive'){ const a=t*1.1+d.ph; tx=TK.x+Math.cos(a)*3.1; tz=TK.z+Math.sin(a)*3.1; ty=TK.y+3.4+Math.sin(t*2.3+d.ph)*0.3; if(d.st==='launch'&&d.t>0.7) d.st='orbit';
      d.tT-=dt; if(d.st==='orbit'&&d.tT<=0&&!LOC.safe){ d.tT=0.3; let bd=18, best=null; for(const e of ENEMIES){ if(e.dead||BEE.list.some(o=>o!==d&&o.tgt===e)&&ENEMIES.filter(q=>!q.dead).length>1) continue; const dd=Math.hypot(e.x-d.p.x,e.z-d.p.z); if(dd<bd&&losClear(d.p.x,d.p.y,d.p.z,e.x,e.y+(e.hy||0.6),e.z)){ bd=dd; best=e; } }
        if(best){ d.st='dive'; d.tgt=best; d.t=0; sO(900,1800,0.4,0.06,'sawtooth'); } } }
    _bv.set(tx-d.p.x,ty-d.p.y,tz-d.p.z).multiplyScalar(k); if(_bv.length()>vm) _bv.setLength(vm); d.v.lerp(_bv,Math.min(1,dt*(d.st==='dive'?5:4))); d.p.addScaledVector(d.v,dt); d.g.position.copy(d.p);
    d.g.rotation.y=turnTo(d.g.rotation.y,Math.atan2(d.v.x,d.v.z),dt*8); d.g.rotation.x=d.st==='dive'?clamp(-d.v.y*0.06,-0.9,0.9):clamp(Math.hypot(d.v.x,d.v.z)*0.03,0,0.3); for(const r of d.rotors) r.rotation.y+=dt*50;
    if(!LOC.safe) shadowAdd(d.p.x,d.p.z,0.5,d.p.y-groundH(d.p.x,d.p.z),0.3); } }
/* ---- «Ковчег»: big combat drone «сфера в кольце» — rises from the roof bay, guards a small radius, 15 s, then self-destructs ---- */
const GD={d:null,cd:0,bayT:0,bay:0}, GD_LIFE=15, GD_CD=15, GD_LEASH=9, GD_RANGE=24, GD_HP=110, GD_DODGE=0.25;
const gdW={id:'mg',speed:92,g:0,spread:0,radius:0.3,power:0.45,kind:'bullet'};
const gdMat={sh:new THREE.MeshToonMaterial({color:0xc9c3a2,gradientMap:gradTex}),ol:new THREE.MeshToonMaterial({color:0x7d7a5a,gradientMap:gradTex}),dk:new THREE.MeshToonMaterial({color:0x262a2a,gradientMap:gradTex}),
  mt:new THREE.MeshToonMaterial({color:0x5a5f64,gradientMap:gradTex}),or:new THREE.MeshToonMaterial({color:0xf0a030,gradientMap:gradTex}),eye:new THREE.MeshBasicMaterial({color:0xffb53a}),jet:new THREE.MeshBasicMaterial({color:0x9fe8ff}),lamp:new THREE.MeshBasicMaterial({color:0xff3a2a})};
function gdMake(){ const g=new THREE.Group(), tl=new THREE.Group(); g.add(tl); const S=Q==='low'?1:2;
  const m=(geo,mat,par,x,y,z,ol)=>{ const o=new THREE.Mesh(geo,mat); o.position.set(x,y,z); par.add(o); if(ol){ const q=new THREE.Mesh(geo,outlineMat); q.scale.setScalar(1.06); o.add(q); } return o; };
  const zc=gg=>{ gg.rotateX(Math.PI/2); return gg; }, B=(w,h,d)=>new THREE.BoxGeometry(w,h,d), Cy=(a,b,h,n)=>new THREE.CylinderGeometry(a,b,h,n);
  m(new THREE.SphereGeometry(0.52,14*S,10*S),gdMat.sh,tl,0,0,0,true);
  m(new THREE.SphereGeometry(0.535,14*S,4,0,TAU,Math.PI*0.42,Math.PI*0.16),gdMat.ol,tl,0,0,0);
  const cap=m(new THREE.SphereGeometry(0.3,12,6,0,TAU,0,Math.PI/2),gdMat.ol,tl,0,0.36,-0.02,true); cap.scale.y=0.6; m(B(0.04,0.22,0.04),gdMat.dk,tl,0.12,0.6,-0.12); m(new THREE.SphereGeometry(0.035,6,4),gdMat.lamp,tl,0.12,0.73,-0.12);
  const ring=m(new THREE.TorusGeometry(0.76,0.075,8,28*S),gdMat.dk,tl,0,0,0,true); ring.rotation.x=Math.PI/2;
  for(const a of [0,Math.PI/2,Math.PI,-Math.PI/2]){ const bx=m(B(0.16,0.14,0.34),gdMat.ol,tl,Math.sin(a)*0.64,0,Math.cos(a)*0.64,true); bx.rotation.y=a; }
  m(zc(Cy(0.22,0.24,0.14,14)),gdMat.dk,tl,0,0.0,0.5,true); m(zc(Cy(0.15,0.15,0.04,14)),gdMat.mt,tl,0,0,0.575); const eye=m(new THREE.SphereGeometry(0.1,10,8),gdMat.eye,tl,0,0,0.58); eye.scale.z=0.5;
  for(const s of [-1,1]) m(B(0.05,0.03,0.08),gdMat.eye,tl,s*0.17,0.13,0.5);
  m(B(0.34,0.12,0.26),gdMat.dk,tl,0,-0.5,0.02,true); m(B(0.08,0.04,0.08),gdMat.lamp,tl,0,-0.57,0.12); m(B(0.26,0.06,0.03),gdMat.or,tl,0,-0.22,0.47);
  const guns=[], muz=[];
  for(const s of [-1,1]){ const pv=new THREE.Group(); pv.position.set(s*0.9,0,0.02); tl.add(pv); m(xcG(Cy(0.11,0.11,0.16,12)),gdMat.mt,tl,s*0.8,0,0.02);
    m(B(0.22,0.3,0.44),gdMat.ol,pv,s*0.04,0,0.06,true); m(B(0.23,0.06,0.3),gdMat.or,pv,s*0.04,0.16,0.08); m(B(0.16,0.14,0.2),gdMat.dk,pv,s*0.15,-0.08,-0.1,true);
    for(const y of [0.075,-0.075]){ m(zc(Cy(0.045,0.05,0.72,8)),gdMat.dk,pv,s*0.04,y,0.6,true); m(zc(Cy(0.065,0.065,0.12,8)),gdMat.mt,pv,s*0.04,y,0.94); const mz=new THREE.Object3D(); mz.position.set(s*0.04,y,1.02); pv.add(mz); muz.push(mz); }
    m(B(0.05,0.24,0.06),gdMat.mt,pv,s*0.04,0,0.5); guns.push(pv); }
  const jets=[]; for(const s of [-1,1]){ m(zc(Cy(0.12,0.15,0.34,12)),gdMat.mt,tl,s*0.28,-0.04,-0.7,true); m(zc(Cy(0.09,0.09,0.02,12)),gdMat.jet,tl,s*0.28,-0.04,-0.875); const j=new THREE.Object3D(); j.position.set(s*0.28,-0.04,-0.95); tl.add(j); jets.push(j); }
  m(B(0.7,0.18,0.3),gdMat.ol,tl,0,-0.04,-0.6,true); m(B(0.5,0.03,0.05),gdMat.or,tl,0,0.06,-0.75);
  for(const y of [0.3,-0.3]){ const sm=m(new THREE.TorusGeometry(Math.sqrt(0.52*0.52-y*y)+0.006,0.012,4,24*S),gdMat.dk,tl,0,y,0); sm.rotation.x=Math.PI/2; }
  for(let k=0;k<4;k++){ const a=Math.PI/4+k*Math.PI/2; const v=m(B(0.14,0.035,0.08),gdMat.dk,tl,Math.sin(a)*0.33,0.37,Math.cos(a)*0.33); v.rotation.y=a; v.rotation.x=-0.6; }
  m(zc(Cy(0.27,0.27,0.03,18)),gdMat.or,tl,0,0,0.53); m(B(0.03,0.32,0.03),gdMat.dk,tl,-0.14,0.55,-0.25); m(new THREE.SphereGeometry(0.03,6,4),gdMat.eye,tl,-0.14,0.72,-0.25);
  if(S>1) for(const s of [-1,1]) for(const y of [0.18,-0.18]) m(new THREE.SphereGeometry(0.025,6,4),gdMat.mt,tl,s*0.36,y,0.36);
  g.scale.setScalar(0.62); scene.add(g); return {g,tl,guns,muz,jets,eye,p:new THREE.Vector3(),v:new THREE.Vector3(),st:'rise',t:0,hp:GD_HP,tgt:null,tT:0,ft:0,mi:0,pitch:0,ax:0,az:0,avx:0,avz:0,jt:0,ph:rnd()*TAU,beep:false,gd:true,dead:false,loc:LOC_ID}; }
function xcG(g){ g.rotateZ(Math.PI/2); return g; }
function sTone(f,dur,vol,type,f2){ const ctx=SND.ctx; if(!ctx||SND.muted) return; vol*=SND.sk; if(vol<0.003) return; const t=ctx.currentTime, o=ctx.createOscillator(), g=ctx.createGain(); o.type=type||'sine'; o.frequency.setValueAtTime(f,t); if(f2) o.frequency.linearRampToValueAtTime(f2,t+dur);
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+0.012); g.gain.setValueAtTime(vol,t+Math.max(0.02,dur-0.04)); g.gain.linearRampToValueAtTime(0.0001,t+dur); o.connect(g); g.connect(sndOut(ctx)); o.start(t); o.stop(t+dur+0.05); }
function sfxGdHello(){ sTone(1560,0.12,0.07,'sine'); sTone(780,0.12,0.025,'triangle'); later(0.16,()=>{ sTone(1040,0.24,0.07,'sine'); sTone(520,0.24,0.025,'triangle'); }); }
function sfxGdBeep(){ sTone(1180,2.0,0.055,'sine'); sTone(1186,2.0,0.03,'triangle'); sTone(590,2.0,0.02,'square'); }
function gdOk(){ return chs().abil==='gdrone'&&!TK.dead&&!transit&&tank&&tank.hatchPt; }
function gdLaunch(){ if(!gdOk()) return; if(LOC.safe){ toast('В лагере дрон не нужен'); return; } if(GD.d){ toast('Дрон уже в воздухе'); return; } if(GD.cd>0){ toast(`Дрон готовится · ${Math.ceil(GD.cd)} с`); return; }
  const d=gdMake(); tank.root.updateMatrixWorld(true); tank.hatchPt.getWorldPosition(d.p); d.g.position.copy(d.p); d.g.rotation.y=TK.h; GD.d=d; GD.cd=GD_CD; GD.bayT=1.6;
  sfxGdHello(); sNz(1.0,'bandpass',600,0.6,0.08); sO(140,320,1.0,0.06,'sawtooth'); abilHud(); }
function gdRemove(){ const d=GD.d; if(!d) return; gdMat.sh.color.setHex(0xc9c3a2); gdMat.ol.color.setHex(0x7d7a5a); d.dead=true; scene.remove(d.g); d.g.traverse(o=>{ if(o.geometry&&o.material!==outlineMat) o.geometry.dispose(); }); GD.d=null; }
function gdBoom(big){ const d=GD.d; if(!d) return; const x=d.p.x,y=d.p.y,z=d.p.z; gdRemove();
  if(big){ explode(x,y,z,2.4,1.5,0,-1,0,'shell',null,0,null,0); enemyArea(x,y,z,2.4,1.0,null,'shell'); groundFlash(x,z,9,[1,0.75,0.4],0.3); shake=Math.min(1,shake+0.25); }
  else { explode(x,y,z,1.4,0.9,0,-1,0,'shell',null,0,null,0); sfxGlass(0.5); }
  for(let k=0;k<10;k++) debSpawn(x,y,z,(rnd()-0.5)*10,rnd()*7,(rnd()-0.5)*10,0.48,0.47,0.36,0.12+rnd()*0.1); abilHud(); }
function gdDodge(d,ux,uz){ const s=rnd()<0.5?1:-1; d.v.x+=-uz*s*7; d.v.z+=ux*s*7; d.v.y+=1.5; d.avz+=s*3; d.jt=0.25; popText(d.p.x,d.p.y+0.9,d.p.z,'мимо','dodge'); sNz(0.18,'bandpass',2600,1.2,0.07); }
function gdDamage(d,w,ux,uy,uz,hx,hy,hz){ d.hp-=w.dmg||3; const k=(w.power||0.5); d.v.x+=ux*k*4; d.v.z+=uz*k*4; d.v.y+=uy*k*2;
  const lx=Math.cos(d.g.rotation.y)*ux-Math.sin(d.g.rotation.y)*uz, lz=Math.sin(d.g.rotation.y)*ux+Math.cos(d.g.rotation.y)*uz; d.avx+=lz*k*7*(0.6+rnd()*0.6); d.avz-=lx*k*7*(0.6+rnd()*0.6); d.g.rotation.y+=(rnd()-0.5)*0.25*k;
  hitSpark(hx,hy,hz,-ux,-uz,5); sfxClang(); if(d.hp<=0) gdBoom(false); }
const _gq=new THREE.Vector3(), _gr=new THREE.Vector3(), _gs=new THREE.Vector3();
function gdUpdate(dt,t){ const T=tank;
  if(!gdOk()||(GD.d&&GD.d.loc!==LOC_ID)){ if(GD.d) gdRemove(); }
  GD.cd=Math.max(0,GD.cd-dt); GD.bayT=Math.max(0,GD.bayT-dt);
  if(T&&T.bay){ const tgt=GD.bayT>0?1:0; GD.bay+=(tgt-GD.bay)*Math.min(1,dt*(tgt?9:5)); for(const g of T.bay) g.rotation.z=-g.userData.s*GD.bay*1.85; }
  const d=GD.d; if(!d) return; d.t+=dt; d.g.visible=!transit;
  const gy=groundH(d.p.x,d.p.z);
  if(d.st==='rise'){ T.root.updateMatrixWorld(true); T.hatchPt.getWorldPosition(_gq); const k=Math.min(1,d.t/1.1), e=k*k*(3-2*k); d.p.set(_gq.x,_gq.y+e*3.6,_gq.z); d.v.set(TK.vx,0,TK.vz); if(d.t>=1.1){ d.st='hunt'; d.t0=d.t; }
    for(const g of d.guns) g.rotation.x+=(0-g.rotation.x)*Math.min(1,dt*6); }
  else {
    d.tT-=dt; if(d.tT<=0){ d.tT=0.25; let best=null, bd=GD_RANGE; const cand=ENEMIES.filter(e=>!e.dead&&e.state!=='fly'&&!(e.xf&&e.inv)).concat(DRONES.filter(q=>!q.dead));
      for(const e of cand){ const ex=e.x, ey=(e.y||0)+(e.hy||0.5), ez=e.z, dd=Math.hypot(ex-d.p.x,ez-d.p.z); if(dd>=bd||Math.hypot(ex-TK.x,ez-TK.z)>GD_LEASH+GD_RANGE) continue; if(!losClear(d.p.x,d.p.y,d.p.z,ex,ey,ez)) continue; bd=dd; best=e; } d.tgt=best; }
    const e=d.tgt&&!d.tgt.dead?d.tgt:null; let tx,ty,tz;
    if(e){ let ax=TK.x-e.x, az=TK.z-e.z; const al=Math.hypot(ax,az)||1; tx=e.x+ax/al*7+Math.cos(t*0.9+d.ph)*1.5; tz=e.z+az/al*7+Math.sin(t*0.9+d.ph)*1.5; }
    else { const a=t*0.5+d.ph; tx=TK.x+Math.cos(a)*4; tz=TK.z+Math.sin(a)*4; }
    { const lx=tx-TK.x, lz=tz-TK.z, ll=Math.hypot(lx,lz); if(ll>GD_LEASH){ tx=TK.x+lx/ll*GD_LEASH; tz=TK.z+lz/ll*GD_LEASH; } }
    ty=Math.max(groundH(tx,tz),TK.y)+3.6+Math.sin(t*1.7+d.ph)*0.25;
    _gq.set(tx-d.p.x,ty-d.p.y,tz-d.p.z).multiplyScalar(2.2); if(_gq.length()>9) _gq.setLength(9); d.v.lerp(_gq,Math.min(1,dt*2.6));
    const ahx=d.p.x+d.v.x*0.35, ahy=d.p.y+d.v.y*0.35, ahz=d.p.z+d.v.z*0.35; if(get(Math.floor(ahx/VS),Math.floor(ahy/VS),Math.floor(ahz/VS))||get(Math.floor(d.p.x/VS),Math.floor((d.p.y-0.6)/VS),Math.floor(d.p.z/VS))) d.v.y=Math.max(d.v.y,5);
    d.p.addScaledVector(d.v,dt); if(d.p.y<gy+1.2){ d.p.y=gy+1.2; d.v.y=Math.max(0,d.v.y); }
    /* yaw toward the target; the hull never pitches with the guns */
    const yawT=e?Math.atan2(e.x-d.p.x,e.z-d.p.z):(Math.hypot(d.v.x,d.v.z)>0.6?Math.atan2(d.v.x,d.v.z):d.g.rotation.y); d.g.rotation.y=turnTo(d.g.rotation.y,yawT,dt*(d.jt>0?1.2:3.2)); d.jt=Math.max(0,d.jt-dt);
    let pt=0; if(e){ const ey=(e.y||0)+(e.hy||0.5); pt=Math.atan2(d.p.y-ey,Math.hypot(e.x-d.p.x,e.z-d.p.z)); } pt=clamp(pt,-0.5,1.1); d.pitch+=(pt-d.pitch)*Math.min(1,dt*5); for(const g of d.guns) g.rotation.x=d.pitch;
    d.ft-=dt; const yErr=e?Math.abs(wrapA(yawT-d.g.rotation.y)):9; if(!(e&&yErr<0.35)) d.ft=Math.max(d.ft,0);
    if(e&&yErr<0.35&&!LOC.safe) while(d.ft<=0){ const L=UP.abl|0; d.ft+=1/GD_RATE[L]; const mz=d.muz[d.mi++%d.muz.length]; d.g.updateMatrixWorld(true); mz.getWorldPosition(_gq); mz.parent.getWorldDirection(_gr);
      /* ideal lead-aimed direction, blended toward the real gun axis when knocked off by hits */
      const ey=(e.y||0)+(e.hy||0.5), dd=Math.hypot(e.x-_gq.x,ey-_gq.y,e.z-_gq.z), tf=dd/gdW.speed; _gs.set(e.x+(e.vx||0)*tf-_gq.x,ey-_gq.y,e.z+(e.vz||0)*tf-_gq.z).normalize();
      const off=Math.min(1,(Math.abs(d.ax)+Math.abs(d.az))*2.2+(d.jt>0?0.6:0)); _gr.lerp(_gs,1-off);
      _gr.x+=(rnd()-0.5)*0.06; _gr.y+=(rnd()-0.5)*0.06; _gr.z+=(rnd()-0.5)*0.06; _gr.normalize();
      proj.push({x:_gq.x,y:_gq.y,z:_gq.z,vx:_gr.x*gdW.speed,vy:_gr.y*gdW.speed,vz:_gr.z*gdW.speed,w:gdW,life:0.6,mesh:null,dmg:3.2*GD_DMGK[L]});
      FIRE.spawn(_gq.x,_gq.y,_gq.z,0,0,0,0.4+rnd()*0.2,2,0.05,1,1,0.85,0.5); for(let k=0;k<6;k++) spark(_gq.x+_gr.x*0.08,_gq.y+_gr.y*0.08,_gq.z+_gr.z*0.08,(_gr.x+(rnd()-0.5)*0.5)*(10+rnd()*8),(_gr.y+(rnd()-0.3)*0.5)*(10+rnd()*8),(_gr.z+(rnd()-0.5)*0.5)*(10+rnd()*8),1,0.85,0.4,0.16+rnd()*0.1);
      if(d.mi%2===0){ const sd=Math.sign(mz.position.x)||1, ry=d.g.rotation.y, rx=Math.cos(ry)*sd, rz=-Math.sin(ry)*sd; casSpawnAt(_gq.x-_gr.x*0.5+rx*0.12,_gq.y-0.08,_gq.z-_gr.z*0.5+rz*0.12,rx,rz,d.v.x,d.v.z,0.8); }
      const ps=sndAt(d.p.x,d.p.z); sNz(0.05,'bandpass',2100,0.9,0.12); sO(240,120,0.04,0.06,'square'); sndOff(ps); }
  }
  /* hit tilt: damped spring, plus a small lean from movement */
  const ch=Math.cos(d.g.rotation.y), sh=Math.sin(d.g.rotation.y), vf=d.v.x*sh+d.v.z*ch, vs=d.v.x*ch-d.v.z*sh;
  const lx=clamp(vf*0.018,-0.12,0.12), lz=clamp(-vs*0.018,-0.12,0.12);
  d.avx+=(-(d.ax-lx)*38-d.avx*6.5)*dt; d.avz+=(-(d.az-lz)*38-d.avz*6.5)*dt; d.ax+=d.avx*dt; d.az+=d.avz*dt; d.ax=clamp(d.ax,-0.8,0.8); d.az=clamp(d.az,-0.8,0.8);
  d.tl.rotation.x=d.ax; d.tl.rotation.z=d.az; d.g.position.copy(d.p);
  /* jets, lamps, life */
  if(!transit){ d.g.updateMatrixWorld(true); for(const j of d.jets){ j.getWorldPosition(_gq); FIRE.spawn(_gq.x,_gq.y,_gq.z,-sh*3+(rnd()-0.5),(rnd()-0.5)*0.6,-ch*3+(rnd()-0.5),0.18+rnd()*0.08,1.2,0.06,1,0.55,0.85,1); } }
  const left=GD_LIFE-d.t; if(left<=2.05&&!d.beep){ d.beep=true; const ps=sndAt(d.p.x,d.p.z); sfxGdBeep(); sndOff(ps); }
  const bl=left<=2.05?(Math.sin(t*28)>0):(Math.sin(t*5)>0.6); gdMat.lamp.color.setHex(bl?0xff3a2a:0x3a0a08); gdMat.eye.color.setHex(left<=2.05&&bl?0xff3a2a:0xffb53a);
  { const fl=left<=2.05&&(Math.sin(t*(left<0.8?40:18))>0.2); gdMat.sh.color.setHex(fl?0xff6a50:0xc9c3a2); gdMat.ol.color.setHex(fl?0xd04030:0x7d7a5a); }
  if(!LOC.safe) shadowAdd(d.p.x,d.p.z,0.6,d.p.y-gy,0.35);
  if(d.t>=GD_LIFE){ const ps=sndAt(d.p.x,d.p.z); gdBoom(true); sndOff(ps); } }
/* ---- weapon sets per tank ---- */
function wAllowed(){ return chs().w.filter(i=>i!==2||UP.rk); }
function cycleWeapon(dr){ const a=wAllowed(); let p=a.indexOf(wcur); p=((p+dr)%a.length+a.length)%a.length; switchWeapon(a[p]); }
function selPos(p){ const a=wAllowed(); if(a[p]!=null) switchWeapon(a[p]); }
/* ---- per-tank upgrades: each tank keeps its own hangar upgrades ---- */
const PER_KEYS=['engine','armor','cal','load','stab','rk','ammo','mg','own','rdr','abl'];
function perDefault(id){ const c=CHASSIS[id], mg=(c.mgs&&c.mgs[0])||'gau'; return {engine:0,armor:0,cal:0,load:0,stab:0,rk:0,ammo:0,mg,own:{[mg]:1},rdr:0,abl:0}; }
function perSnap(){ const o={}; for(const k of PER_KEYS) o[k]=k==='own'?Object.assign({},UP.own):UP[k]; o.hpf=TK.hp/maxHP(); o.dmg=TK.dmgS.slice(); return o; }
function perFix(){ const c=chs(); if(c.mgs.length&&!c.mgs.includes(UP.mg)){ UP.mg=c.mgs[0]; UP.own[UP.mg]=1; } }
function selectTank(id){ if(id===UP.tank) return; if(!UP.per) UP.per={}; const f=TK.hp/maxHP(); UP.per[UP.tank]=perSnap(); UP.tank=id; const d=UP.per[id]||perDefault(id);
  for(const k of PER_KEYS) UP[k]=k==='own'?Object.assign({},d.own||{}):(d[k]==null?perDefault(id)[k]:d[k]); perFix(); TK.hp=Math.max(1,(d.hpf!=null?d.hpf:1)*maxHP()); for(let i=0;i<5;i++) TK.dmgS[i]=d.dmg?(+d.dmg[i]||0):0; void f;
  for(const a of ['mg','cn','rk']) ST.ammo[a]=Math.min(ST.ammo[a],ammoCap(a)); SHD.on=false; SHD.hp=SHD_MAX[UP.abl|0]; STL.on=false; STL.t=0; BEE.cd=1; if(GD.d) gdRemove(); updateWeaponUI(); save(); }
/* ---- «Крепость»: rotary cannon spin-down + black exhaust while driving ---- */
let exT=0;
function krepUpdate(dt){ if(!tank) return; if(tank.cnSpin) tank.cnSpin.rotation.z+=((tank.cnSpinT||0)-tank.cnSpin.rotation.z)*Math.min(1,dt*6);
  if(tank.exh&&!transit&&!TK.dead){ exT-=dt; const sp=Math.hypot(TK.vx,TK.vz); if(exT<=0){ exT=sp>0.6?0.07:0.35; tank.root.updateMatrixWorld(true); const k=Math.min(1,sp/8); for(const ex of [tank.exh,tank.exh2]){ if(!ex) continue; ex.getWorldPosition(_kv2);
    SMOKE.spawn(_kv2.x,_kv2.y,_kv2.z,-TK.vx*0.35+(rnd()-0.5)*0.4,1.6+rnd()*1.2,-TK.vz*0.35+(rnd()-0.5)*0.4,0.22+k*0.2,1.6,0.8+k*0.6,0.38+k*0.14,0.06,0.06,0.07); } } } }
/* ---- motor pool list ---- */
function renderPark(){ $('#gScrap').textContent=Math.floor(ST.scrap); const pk=CHASSIS[GAR.pick]||CHASSIS.base, own=!!UP.tanks[GAR.pick];
  const gp=$('#gPick'); gp.hidden=false; gp.innerHTML=`<span>${pk.cls} · на подиуме</span><b>${pk.name}</b><em>${UP.tank===GAR.pick?'● в строю':own?'куплен · можно выехать':'цена '+pk.cost+' лома'}</em>`;
  let h='<p class="pkintro">Нажми на танк, чтобы поставить его на подиум. Покупка — только за лом. У каждого танка свои улучшения в гараже.</p>';
  const bar=(l,v)=>`<div class="pkb"><span>${l}</span><i style="--v:${Math.min(1,v/1.8).toFixed(2)}"></i></div>`;
  CH_ORDER.forEach((id,n)=>{ const c=CHASSIS[id], ow=!!UP.tanks[id], cur=UP.tank===id, can=ST.scrap>=c.cost, look=GAR.pick===id;
    h+=`<section class="gcard pk${look?' focus':''}${cur?' cur':''}" data-pick="${id}"><div class="ghead"><h3><i class="pkn">${n+1}</i>${c.name}</h3><span>${cur?'<em class="pktag cur">В строю</em>':look?'<em class="pktag look">На подиуме</em>':c.cls}</span></div>
      ${look?`<div class="pkst">${bar('Скорость',c.spd)}${bar('Броня',c.hp)}${bar('Огонь',c.cn)}</div><p>${c.desc}</p><p class="pkab"><b>Оружие</b> — ${c.arms}</p><p class="pkab"><b>${c.abN}</b> — ${c.abI}</p>`:`<p class="pkshort">${c.cls} · ${c.arms}</p>`}
      ${cur?'':ow?`<button class="btn solid" data-tk="${id}">Выехать на нём</button>`:`<button class="btn${look?' solid':''}" data-tkbuy="${id}" ${can?'':'disabled'}>${can?'Купить':'Не хватает'} · ${nutI} ${c.cost}</button>`}</section>`; });
  $('#gUps').innerHTML=h; }

