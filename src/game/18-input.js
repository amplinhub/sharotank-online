/* ================= INPUT ================= */
const keys={}; const TCH={sx:0,sy:0,active:false,amag:0,mx:0,my:0,mActive:false};
const mouse={x:innerWidth*0.5,y:innerHeight*0.35,down:false}; let aimMode='mouse';
let helpOpen=false;
addEventListener('keydown',e=>{ sInit(); if(helpOpen){ closeHelp(); }
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  if(e.repeat) return; keys[e.code]=true;
  if(GAR.open){ if(e.code==='Escape') closeGarage(); return; }
  if(mcOpen&&(e.code==='Enter'||e.code==='KeyE')){ acceptMC(); return; }
  if(e.code==='KeyR'){ useRepair(); return; } if(e.code==='KeyT'){ useAmmo(); return; } if(e.code==='KeyG'){ useArt(); return; } if(e.code==='KeyE'&&!mcOpen&&!GAR.open){ abilPress(); return; } if(mcOpen&&e.code==='Escape'){ closeMC(); return; }
  if(e.code==='Digit1') selPos(0); else if(e.code==='Digit2') selPos(1); else if(e.code==='Digit3') selPos(2); else if(e.code==='KeyQ') cycleWeapon(1); else if(e.code==='KeyP') applyPalette((PAL+1)%PALETTES.length); });
addEventListener('keyup',e=>{ keys[e.code]=false; });
addEventListener('blur',()=>{ for(const k in keys) keys[k]=false; mouse.down=false; TCH.mActive=false; TCH.active=false; });
addEventListener('pointermove',e=>{ if(e.pointerType==='mouse'&&!(e.target.closest&&e.target.closest('.pad'))){ mouse.x=e.clientX; mouse.y=e.clientY; aimMode='mouse'; aimActivity(); } });
canvas.addEventListener('pointerdown',e=>{ sInit(); if(helpOpen){ closeHelp(); return; }
  if(GAR.open){ GAR.drag={id:e.pointerId,x:e.clientX,y:e.clientY}; try{ canvas.setPointerCapture(e.pointerId); }catch(_){} return; }
  if(e.pointerType==='mouse'&&e.button===1){ e.preventDefault(); midAim(e); return; }
  if(e.pointerType==='mouse'&&e.button===0){ mouse.down=true; mouse.x=e.clientX; mouse.y=e.clientY; aimMode='mouse'; canvas.focus(); }
  else if(e.pointerType!=='mouse') touchAim(e); });
canvas.addEventListener('pointermove',e=>{ if(GAR.open&&GAR.drag&&e.pointerId===GAR.drag.id){ GAR.ang-=(e.clientX-GAR.drag.x)*0.008; GAR.hgt=clamp(GAR.hgt+(e.clientY-GAR.drag.y)*0.01,1.0,7); GAR.drag.x=e.clientX; GAR.drag.y=e.clientY; GAR.idle=0; } });
const endDrag=e=>{ if(GAR.drag&&e.pointerId===GAR.drag.id) GAR.drag=null; };
canvas.addEventListener('pointerup',endDrag); canvas.addEventListener('pointercancel',endDrag);
addEventListener('pointerup',e=>{ if(e.pointerType==='mouse'&&e.button===0) mouse.down=false; });
canvas.addEventListener('wheel',e=>{ e.preventDefault(); if(GAR.open){ GAR.dist=clamp(GAR.dist+e.deltaY*0.004,6.5,15); return; } if(Math.abs(e.deltaY)>4) cycleWeapon(e.deltaY>0?1:-1); },{passive:false});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
{ const fb=$('#bFire'); let fid=null; const end=e=>{ if(e.pointerId!==fid) return; fid=null; TCH.fire=false; fb.classList.remove('on'); };
  fb.addEventListener('pointerdown',e=>{ e.preventDefault(); sInit(); if(helpOpen) closeHelp(); fid=e.pointerId; try{ fb.setPointerCapture(e.pointerId); }catch(_){} TCH.fire=true; if(!TCH.active) aimMode='stick'; fb.classList.add('on'); });
  fb.addEventListener('pointerup',end); fb.addEventListener('pointercancel',end); fb.addEventListener('lostpointercapture',end); fb.addEventListener('contextmenu',e=>e.preventDefault()); }
$('#bSwap').addEventListener('pointerdown',e=>{ e.preventDefault(); sInit(); if(helpOpen) closeHelp(); cycleWeapon(1); });
function makeStick(el,onMove,onEnd){ const kn=el.querySelector('.knob'); let id=null;
  const mv=e=>{ const r=el.getBoundingClientRect(), R=r.width/2; let dx=e.clientX-(r.left+R), dy=e.clientY-(r.top+R); const m=Math.hypot(dx,dy); if(m>R){ dx*=R/m; dy*=R/m; }
    kn.style.transform=`translate(${dx}px,${dy}px)`; onMove(dx/R,dy/R); };
  el.addEventListener('pointerdown',e=>{ e.preventDefault(); sInit(); if(helpOpen) closeHelp(); id=e.pointerId; try{ el.setPointerCapture(e.pointerId); }catch(_){} el.classList.add('live'); mv(e); });
  el.addEventListener('pointermove',e=>{ if(e.pointerId===id) mv(e); });
  const end=e=>{ if(e.pointerId!==id) return; id=null; kn.style.transform=''; el.classList.remove('live'); onEnd(); };
  el.addEventListener('pointerup',end); el.addEventListener('pointercancel',end); el.addEventListener('lostpointercapture',end); el.addEventListener('contextmenu',e=>e.preventDefault()); }
makeStick($('#aimStick'),(x,y)=>{ TCH.sx=x; TCH.sy=y; TCH.amag=Math.hypot(x,y); TCH.active=TCH.amag>0.15; if(TCH.active) aimMode='stick'; },()=>{ TCH.active=false; TCH.amag=0; });
makeStick($('#moveStick'),(x,y)=>{ TCH.mx=x; TCH.my=y; TCH.mActive=Math.hypot(x,y)>0.2; },()=>{ TCH.mActive=false; });
$('#wdrum').addEventListener('click',e=>{ e.stopPropagation(); cycleWeapon(1); });
function readInput(){ const k=keys; const kt=((k.KeyW||k.ArrowUp)?1:0)-((k.KeyS||k.ArrowDown)?1:0), ks=((k.KeyA||k.ArrowLeft)?1:0)-((k.KeyD||k.ArrowRight)?1:0);
  const joy=(TCH.mActive&&!kt&&!ks)?{x:TCH.mx,y:TCH.my,m:Math.min(1,(Math.hypot(TCH.mx,TCH.my)-0.2)/0.6)}:null;
  return { throttle:kt, steer:ks, hb:!!k.Space, joy, fire:!!(mouse.down||k.KeyF||TCH.fire) }; }
const ndc=new THREE.Vector3();
function updateAim(){ if(AIMIDLE.on){ aimIdleApply(); return; }
  if(aimMode==='mouse'){ ndc.set(mouse.x/innerWidth*2-1,-(mouse.y/innerHeight)*2+1,0.5).unproject(camera).sub(camera.position).normalize();
    if(raycast(camera.position.x,camera.position.y,camera.position.z,ndc.x,ndc.y,ndc.z,200)){ AIM.x=camera.position.x+ndc.x*RH.t; AIM.y=camera.position.y+ndc.y*RH.t; AIM.z=camera.position.z+ndc.z*RH.t; }
    AIM.yawRel=Math.atan2(AIM.x-TK.x,AIM.z-TK.z); AIM.dist=Math.hypot(AIM.x-TK.x,AIM.z-TK.z); }
  else { if(TCH.active){ AIM.yawRel=Math.atan2(TCH.sx,TCH.sy); AIM.dist=5+Math.hypot(TCH.sx,TCH.sy)*24; }
    const dx=Math.sin(AIM.yawRel), dz=Math.cos(AIM.yawRel);
    if(raycast(TK.x+dx*1.6,1.2+TK.y,TK.z+dz*1.6,dx,0,dz,AIM.dist)){ AIM.x=TK.x+dx*(1.6+RH.t); AIM.y=1.2+TK.y; AIM.z=TK.z+dz*(1.6+RH.t); }
    else { AIM.x=TK.x+dx*AIM.dist; AIM.y=0; AIM.z=TK.z+dz*AIM.dist; } }
  const lk=findLock(); AIM.lockE=lk?lk[0]:null; if(lk){ AIM.x=lk[1]; AIM.y=lk[2]; AIM.z=lk[3]; if(aimMode!=='mouse'&&!TCH.active){ AIM.yawRel=Math.atan2(lk[1]-TK.x,lk[3]-TK.z); AIM.dist=Math.hypot(lk[1]-TK.x,lk[3]-TK.z); } } }

