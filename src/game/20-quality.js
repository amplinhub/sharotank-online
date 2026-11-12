/* ================= PALETTE / QUALITY ================= */
function applyPalette(i){ loadPalette(i); const s=PALETTES[i];
  scene.background.set(s.bg); scene.fog.color.set(s.bg); renderer.setClearColor(s.bg,1); outer.material.color.set(s.ground).multiplyScalar(0.7);
  hemi.color.set(s.side).lerp(new THREE.Color(0xffffff),0.45); hemi.groundColor.set(s.dark);
  if(tank&&tank.ghost) tank.ghost.material.color.set(s.glow); if(tank) tank.beacon.material.color.set(s.accent); shellMat.color.set(s.lamp);
  lampColors();
  for(const o of EXTRAS) if(o.userData.water) o.material.color.setRGB(...P.water);
  if(chunks) for(let i2=0;i2<chunks.length;i2++) dirty.add(i2);
  for(const r of rigids){ r.mesh.geometry.dispose(); r.mesh.geometry=meshLocal(r.lg,r.sx,r.sy,r.sz,r.mn); }
  if(grid){ drawGround(); if(LOC_ID==='camp') campDecor(); for(const g of GATES){ g.gc=groundColorAt((g.r[0]+g.r[2])/2,(g.r[1]+g.r[3])/2); drawGate(g); } } garPalette();
  SOLMAT.army.color.setRGB(...P.army);
  const R=document.documentElement.style; R.setProperty('--acc',css(s.glow)); R.setProperty('--acc2',css(s.glow2));
  $('#pname').textContent=s.name; const ds=document.querySelectorAll('#pdots i'); ds[0].style.background=css(s.bg); ds[1].style.background=css(s.glow); ds[2].style.background=css(s.neon); }
$('#bPal').addEventListener('click',()=>applyPalette((PAL+1)%PALETTES.length));
let qMode='auto';
/* auto quality: calibrate down once at start, raise one step when FPS is high or rock-steady (vsync-capped),
   fall back once if the raised level gets choppy — then lock until the player picks a level in the menu */
const GFX_KEY='sharotank_gfx_v1', Q_ORD=['low','med','high'];
const AQ={phase:'calib',s:[],t:0,fr:0,skip:3,locked:false,up:false,from:null,base:60,downT:0};
function gfxLoad(){ try{ const d=JSON.parse(localStorage.getItem(GFX_KEY)||'null'); if(!d) return null; if(d.mode&&d.mode!=='auto'&&QUALITY[d.mode]) qMode=d.mode; AQ.locked=!!d.locked; if(d.q&&QUALITY[d.q]&&d.mode==='auto') AQ.phase='watch'; return d; }catch(_){ return null; } }
function gfxSave(){ try{ localStorage.setItem(GFX_KEY,JSON.stringify({mode:qMode,q:Q,locked:AQ.locked})); }catch(_){} }
function aqReset(skip){ AQ.s.length=0; AQ.t=0; AQ.fr=0; AQ.skip=skip==null?2.5:skip; }
function aqSet(q,msg){ saveLocState(); rebuild(q); toast(msg); aqReset(3); gfxSave(); }
function aqCalm(){ if(LOC.safe) return true; for(const e of ENEMIES) if(!e.dead&&Math.hypot(e.x-TK.x,e.z-TK.z)<30) return false; return true; }
function autoQ(rdt){ if(qMode!=='auto'||!ready||transit||document.hidden) return; if(AQ.skip>0){ AQ.skip-=rdt; return; }
  AQ.t+=rdt; AQ.fr++; if(AQ.t<1) return; AQ.s.push(AQ.fr/AQ.t); AQ.t=0; AQ.fr=0; if(AQ.s.length>12) AQ.s.shift();
  const S=AQ.s, n=S.length, srt=S.slice().sort((a,b)=>a-b), med=srt[n>>1], qi=Q_ORD.indexOf(Q);
  if(AQ.phase==='calib'){ if(n<3) return; const avg=S.reduce((a,b)=>a+b,0)/n; AQ.phase='watch'; if(avg<40&&qi>0) aqSet(Q_ORD[qi-1],`Авто: ${Math.round(avg)} FPS → ${QUALITY[Q_ORD[qi-1]].label}`); else aqReset(0); return; }
  if(AQ.up){ const last=S.slice(-5).sort((a,b)=>a-b), lm=last[last.length>>1], comfort=Math.min(50,AQ.base*0.85);
    if(S.length>=5&&(lm<comfort||DYN.scale<0.8)){ AQ.up=false; AQ.locked=true; aqSet(AQ.from,`Авто: FPS просел до ${Math.round(lm)} → ${QUALITY[AQ.from].label}. Дальше графику меняешь сам в меню`); return; } }
  if(AQ.locked||qi>=2||n<10) return;
  const steady=srt[n-1]-srt[0]<=3&&med>=45, fast=srt[0]>=61;
  if((steady||fast)&&DYN.scale>=0.999&&aqCalm()){ AQ.from=Q; AQ.base=med; AQ.up=true; aqSet(Q_ORD[qi+1],`Авто: стабильно ${Math.round(med)} FPS → ${QUALITY[Q_ORD[qi+1]].label}`); } }
function setQualityUI(){ document.querySelectorAll('#qseg button').forEach(b=>b.classList.toggle('on',b.dataset.q===qMode)); }
document.querySelectorAll('#qseg button').forEach(b=>b.addEventListener('click',()=>{ const q=b.dataset.q; qMode=q; setQualityUI();
  if(q==='auto'){ AQ.locked=false; AQ.up=false; AQ.phase='watch'; aqReset(1); toast('Авто: подбираю качество по FPS'); } else { AQ.up=false; if(q!==Q){ saveLocState(); rebuild(q); toast('Качество: '+QUALITY[q].label+' · район пересобран'); } } gfxSave(); }));
const touchDev=('ontouchstart' in window)||matchMedia('(pointer: coarse)').matches;
let showTouch=true; $('#bTouch').addEventListener('click',()=>{ showTouch=!showTouch; $('#padL').hidden=!showTouch; $('#padR').hidden=!showTouch; $('#bTouch').classList.toggle('on',showTouch); });
$('#bSnd').addEventListener('click',()=>{ sInit(); SND.muted=!SND.muted; if(SND.master) SND.master.gain.value=SND.muted?0:0.55; $('#bSnd').classList.toggle('on',!SND.muted); });
$('#bHelp').addEventListener('click',()=>{ helpOpen=true; $('#help').hidden=false; });
$('#kRep').addEventListener('click',e=>{ e.stopPropagation(); sInit(); useRepair(); });
$('#kAmmo').addEventListener('click',e=>{ e.stopPropagation(); sInit(); useAmmo(); });
$('#kArt').addEventListener('click',e=>{ e.stopPropagation(); sInit(); useArt(); });
function abilPress(){ const a=chs().abil; if(a==='gdrone') gdLaunch(); else if(a==='rail') magPress(); else shieldToggle(); }
$('#kAbil').addEventListener('click',e=>{ e.stopPropagation(); sInit(); abilPress(); });
$('#bShield').addEventListener('pointerdown',e=>{ e.preventDefault(); sInit(); if(helpOpen) closeHelp(); abilPress(); });
let menuOpen=false; $('#bMenu').addEventListener('click',e=>{ e.stopPropagation(); menuOpen=!menuOpen; $('#trMenu').hidden=!menuOpen; document.body.classList.toggle('menu',menuOpen); $('#bMenu').setAttribute('aria-expanded',String(menuOpen)); sfxClick(); });
$('#bGo').addEventListener('click',e=>{ e.stopPropagation(); closeHelp(); });
$('#bReset').addEventListener('click',e=>{ e.stopPropagation(); try{ localStorage.removeItem(SAVE_KEY); }catch(_){} ST.scrap=1000; Object.assign(UP,{engine:0,armor:0,cal:0,load:0,stab:0,rk:0,ammo:0,mg:'gau',own:{gau:1},tank:'base',tanks:{base:1},per:{},abl:0,rdr:0}); TK.hp=ARM_HP[0]; TK.dmgS.fill(0);
  refillAmmo(); ST.kits.rep=ST.kits.ammo=0; Object.assign(MS,{i:0,active:false,prog:0,rank:0}); rankUI(); objUI(); for(const k in LOC_STATE) delete LOC_STATE[k];
  wcur=0; buildGameTank(); updateWeaponUI(); closeHelp(); if(LOC_ID!=='camp') goLocation('camp',null,{x:40,z:44,h:Math.PI}); toast('Прогресс сброшен'); });
$('#help').addEventListener('pointerdown',e=>{ if(e.target.id==='help') closeHelp(); });
let firstBanner=true;
function closeHelp(){ helpOpen=false; $('#help').hidden=true; canvas.focus(); if(firstBanner){ firstBanner=false; banner(LOC); } }

