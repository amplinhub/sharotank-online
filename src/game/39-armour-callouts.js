/* ================= v17: segmented armour rings · damage callouts · wounded robots · gait ================= */
CHASSIS.ten.col=0x30363b; CHASSIS.krep.col=0xe0582a; CHASSIS.igla.col=0xb8323a; CHASSIS.pchela.col=0xe8e6df; CHASSIS.kovch.col=0x7d7a5a;
/* «Ковчег»: the stern turret must clear the long hull — less gun depression over the front deck and the stern */
CHASSIS.ten.dep=y=>{ const c=Math.cos(y), f=c>0?clamp((c-0.3)/0.5,0,1):0; return -0.32+f*0.2; };
CHASSIS.kovch.dep=y=>{ const c=Math.cos(y), f=c>0?clamp((c-0.25)/0.6,0,1):clamp((-c-0.4)/0.5,0,1); return -0.3+f*(c>0?0.31:0.2); };
function ringTex(S){ const cv=document.createElement('canvas'); cv.width=cv.height=S; const t=new THREE.CanvasTexture(cv); t.anisotropy=4; return {cv,ctx:cv.getContext('2d'),t}; }
function ringMesh(tex){ const g=new THREE.PlaneGeometry(1,1); g.rotateX(-Math.PI/2); const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,opacity:0.4,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
  m.renderOrder=3; m.frustumCulled=false; scene.add(m); return m; }
function ringY(x,z,r){ const c=groundH(x,z); let m=c; for(let k=0;k<8;k++){ const a=k*TAU/8, h=groundH(x+Math.cos(a)*r,z+Math.sin(a)*r); if(h>m) m=h; } return Math.min(m,c+2.5); }
const RYS={v:0,init:false};
const RING_K=0.31; /* ring radius as a fraction of the canvas */
function drawSegs(R,frac,ghost,col,glow,labels,part){ const ctx=R.ctx, S=R.cv.width, c=S/2, r=S*RING_K, w=S*0.034, span=part?TAU*0.75:TAU, st=part?Math.PI/2:-Math.PI/2, seg=span/3, gap=0.15; ctx.clearRect(0,0,S,S); ctx.lineCap='butt';
  ctx.lineWidth=1.5; ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.arc(c,c,r+w*1.15,st,st+span); ctx.stroke();
  for(let i=0;i<3;i++){ const a0=st+i*seg+gap/2, a1=a0+seg-gap, f=clamp(frac*3-i,0,1), g=clamp(ghost*3-i,0,1);
    ctx.lineWidth=w; ctx.strokeStyle='rgba(255,255,255,0.13)'; ctx.beginPath(); ctx.arc(c,c,r,a0,a1); ctx.stroke();
    if(g>f){ ctx.strokeStyle=`rgba(255,255,255,${0.85*glow})`; ctx.beginPath(); ctx.arc(c,c,r,a0+(a1-a0)*f,a0+(a1-a0)*g); ctx.stroke(); }
    if(f>0){ ctx.strokeStyle=col; ctx.shadowColor=col; ctx.shadowBlur=glow*S*0.03; ctx.beginPath(); ctx.arc(c,c,r,a0,a0+(a1-a0)*f); ctx.stroke(); ctx.shadowBlur=0; }
    ctx.lineWidth=2; ctx.strokeStyle='rgba(255,255,255,0.35)'; for(const a of [a0,a1]){ ctx.beginPath(); ctx.moveTo(c+Math.cos(a)*(r-w*0.7),c+Math.sin(a)*(r-w*0.7)); ctx.lineTo(c+Math.cos(a)*(r+w*0.7),c+Math.sin(a)*(r+w*0.7)); ctx.stroke(); } }
  if(part&&R.crit>0){ const al=R.crit; for(const a of [Math.PI*1.25]) arcText(ctx,c,r+w*2.3,a,'КРИТИЧЕСКИЙ УРОН',`rgba(255,50,40,${al})`,S*0.06); }
  if(labels) for(const L of labels){ const k=clamp(L.t/0.25,0,1)*clamp(L.life/0.6,0,1); if(k<=0) continue; arcText(ctx,c,r+w*2.3,L.a,L.text,`rgba(255,214,110,${k})`,S*0.072); } R.t.needsUpdate=true; }
function arcText(ctx,c,rad,ang,text,col,fs){ ctx.save(); ctx.font=`800 ${fs}px "Oswald","Arial Narrow",sans-serif`; ctx.fillStyle=col; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.shadowColor='rgba(0,0,0,0.8)'; ctx.shadowBlur=6;
  const bottom=Math.sin(ang)>0, total=ctx.measureText(text).width*1.12/rad; let a=ang+(bottom?total/2:-total/2);
  for(const ch of text){ const cw=ctx.measureText(ch).width*1.12/rad; a+=bottom?-cw/2:cw/2; ctx.save(); ctx.translate(c+Math.cos(a)*rad,c+Math.sin(a)*rad); ctx.rotate(a+(bottom?-Math.PI/2:Math.PI/2)); ctx.fillText(ch,0,0); ctx.restore(); a+=bottom?-cw/2:cw/2; } ctx.restore(); }
const ARM_ICO='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.2 13.8 3.4V7.9c0 3.3-2.5 5.7-5.8 7-3.3-1.3-5.8-3.7-5.8-7V3.4z" fill="currentColor"/><path d="M8 3.6 11.6 5v3c0 2-1.4 3.6-3.6 4.6z" fill="rgba(0,0,0,.35)"/></svg>';
const ARM={R:null,m:null,ghost:1,flash:0,labels:[],dirty:true,reach:4.2,tank:null,last:-1};
function armReach(){ if(!tank) return 4.2; tank.root.updateMatrixWorld(true); let mx=2.6; const v=new THREE.Vector3(); for(const o of [tank.cnMuz].concat(tank.mgMuz||[])){ if(!o||!o.parent) continue; o.getWorldPosition(v); mx=Math.max(mx,Math.hypot(v.x-tank.root.position.x,v.z-tank.root.position.z)); } return mx+0.7; }
function armCol(f){ return f>0.66?'#4ef08a':f>0.33?'#ffc94a':'#ff3b30'; }
const HIT_TXT={front:['ЛОБОВАЯ БРОНЯ ПРОБИТА','УДАР В ЛОБ'],rear:['ПЕРЕГРЕВ ДВИГАТЕЛЯ','ПОВРЕЖДЕНИЕ КОРМЫ'],side:['ПОВРЕЖДЕНИЕ ШАССИ','ПОДВЕСКА ЗАДЕТА'],top:['ПОВРЕЖДЕНИЕ БАШНИ','ОТКАЗ СТАБИЛИЗАТОРА']};
function armGapA(a){ a=((a%TAU)+TAU)%TAU; if(a>TAU-0.4) a-=TAU; if(a>-0.4&&a<Math.PI/2+0.4) return a<Math.PI/4?-0.45:Math.PI/2+0.45; return a; }
function armHit(amount,dx,dz,top){ ARM.flash=1; ARM.dirty=true; if(amount<Math.max(12,maxHP()*0.12)) return; const ch=Math.cos(TK.h), sh=Math.sin(TK.h), l=Math.hypot(dx,dz)||1, lx=(dx*ch-dz*sh)/l, lz=(dx*sh+dz*ch)/l;
  const k=top?'top':lz>0.5?'front':lz<-0.5?'rear':'side', arr=HIT_TXT[k]; const a=armGapA(Math.atan2(dz,dx)); ARM.labels=ARM.labels.filter(L=>Math.abs(wrapA(L.a-a))>0.6); ARM.labels.push({a,text:arr[(rnd()*arr.length)|0],t:0,life:2.4}); if(ARM.labels.length>3) ARM.labels.shift(); }
function armUpdate(dt){ if(!ARM.R){ ARM.R=ringTex(512); ARM.m=ringMesh(ARM.R.t); ARM.num=$('#armNum'); } if(ARM.tank!==tank){ ARM.tank=tank; ARM.reach=armReach(); ARM.dirty=true; }
  const show=!!tank&&!TK.dead&&!transit&&!GAR.open&&!helpOpen; ARM.m.visible=show; ARM.num.hidden=!show; if(!show){ ARM.ghost=TK.hp/maxHP(); return; }
  const f=clamp(TK.hp/maxHP(),0,1); if(ARM.ghost<f) ARM.ghost=f; else if(ARM.ghost>f){ ARM.ghost=Math.max(f,ARM.ghost-dt*0.35); ARM.dirty=true; }
  ARM.flash=Math.max(0,ARM.flash-dt); for(const L of ARM.labels){ L.t+=dt; L.life-=dt; } if(ARM.labels.length){ ARM.labels=ARM.labels.filter(L=>L.life>0); ARM.dirty=true; }
  const q=Math.round(f*300); if(q!==ARM.last){ ARM.last=q; ARM.dirty=true; } if(ARM.flash>0) ARM.dirty=true;
  const crit=f>0&&f<0.1; ARM.ct=(ARM.ct||0)+dt; if(crit){ const ph=(ARM.ct*2.2)%1, al=ph<0.6?1:0.15; if(al!==ARM.R.crit){ ARM.R.crit=al; ARM.dirty=true; } ARM.beep=(ARM.beep||0)-dt; if(ARM.beep<=0){ ARM.beep=0.9; sO(880,880,0.08,0.05,'square'); setTimeout(()=>sO(660,660,0.1,0.05,'square'),110); } } else if(ARM.R.crit){ ARM.R.crit=0; ARM.dirty=true; }
  if(ARM.dirty){ ARM.dirty=false; drawSegs(ARM.R,f,ARM.ghost,armCol(f),Math.min(1,ARM.flash*1.2),ARM.labels,true); }
  const ty=ringY(TK.x,TK.z,ARM.reach*0.8); if(!RYS.init||Math.abs(ty-RYS.v)>3) RYS.v=ty; else RYS.v+=(ty-RYS.v)*Math.min(1,dt*12); RYS.init=true; const size=ARM.reach/RING_K; ARM.m.scale.set(size,1,size); ARM.m.position.set(TK.x,RYS.v+0.1,TK.z); ARM.m.material.opacity=Math.max(ARM.R.crit?0.95:0,0.4+0.6*Math.min(1,ARM.flash*1.5));
  const sp=toScreen(TK.x+ARM.reach*Math.cos(0.5),RYS.v+0.1,TK.z+ARM.reach*Math.sin(0.5)); ARM.num.style.transform=`translate(${sp[0]}px,${sp[1]}px) translate(-50%,-50%)`;
  const txt=`${ARM_ICO}${Math.max(0,Math.ceil(TK.hp))}<small>/${maxHP()}</small>`; if(ARM.num.dataset.t!==txt){ ARM.num.dataset.t=txt; ARM.num.innerHTML=txt; } ARM.num.style.color=armCol(f); ARM.num.style.opacity=(0.55+0.45*Math.min(1,ARM.flash*1.5)).toFixed(2); }
/* ---- ammo ring: lower-left quarter outside the armour ring (grows into the upper-left with the ammo upgrade) ---- */
const AMO={R:null,m:null,f:-1,len:0,key:'',num:null,lastTxt:'',segs:0};
const AM_ICO={mg:'<svg viewBox="0 0 16 16"><path d="M6 2h4l1 3v9H5V5z" fill="currentColor"/><path d="M5 11h6" stroke="rgba(0,0,0,.4)" stroke-width="1.4"/></svg>',
 cn:'<svg viewBox="0 0 16 16"><path d="M8 1c2 1.6 3 3.4 3 5.5V14H5V6.5C5 4.4 6 2.6 8 1z" fill="currentColor"/><path d="M4.5 12h7" stroke="rgba(0,0,0,.4)" stroke-width="1.4"/></svg>',
 rail:'<svg viewBox="0 0 16 16"><path d="M9.5 1 4 9h4l-1.5 6L12 7H8z" fill="currentColor"/></svg>',
 rk:'<svg viewBox="0 0 16 16"><path d="M8 1c1.6 1.2 2.4 3 2.4 5v5H5.6V6C5.6 4 6.4 2.2 8 1z" fill="currentColor"/><path d="M5.6 9 3.5 12v2h2.1zM10.4 9l2.1 3v2h-2.1z" fill="currentColor"/><path d="M7 12.5h2l-.5 2.5h-1z" fill="#ff8a3a"/></svg>'};
function drawAmmo(R,frac,len,segs,col){ const ctx=R.ctx, S=R.cv.width, c=S/2, r=S*0.408, w=S*0.024, st=Math.PI/2+0.06, en=st+len; ctx.clearRect(0,0,S,S); ctx.lineCap='butt';
  const empty=frac<=0.0001;
  if(segs>1){ const gap=Math.min(0.03,len/segs*0.35), sl=len/segs; for(let i=0;i<segs;i++){ const a0=st+i*sl+gap/2, a1=st+(i+1)*sl-gap/2, on=(i+0.5)/segs<=frac+1e-6;
      if(on){ ctx.lineWidth=w; ctx.strokeStyle=col; ctx.beginPath(); ctx.arc(c,c,r,a0,a1); ctx.stroke(); }
      else { ctx.lineWidth=1.6; ctx.strokeStyle=empty?'rgba(255,201,74,0.85)':'rgba(255,201,74,0.4)'; ctx.beginPath(); ctx.arc(c,c,r-w/2,a0,a1); ctx.arc(c,c,r+w/2,a1,a0,true); ctx.closePath(); ctx.stroke(); } } }
  else { ctx.lineWidth=1.6; ctx.strokeStyle=empty?'rgba(255,201,74,0.9)':'rgba(255,201,74,0.4)'; ctx.beginPath(); ctx.arc(c,c,r-w/2,st,en); ctx.arc(c,c,r+w/2,en,st,true); ctx.closePath(); ctx.stroke();
    if(frac>0){ ctx.lineWidth=w; ctx.strokeStyle=col; ctx.shadowColor=col; ctx.shadowBlur=S*0.012; ctx.beginPath(); ctx.arc(c,c,r,st,st+len*frac); ctx.stroke(); ctx.shadowBlur=0; } }
  R.t.needsUpdate=true; }
function ammoRingUpdate(dt){ if(!AMO.R){ AMO.R=ringTex(512); AMO.m=ringMesh(AMO.R.t); AMO.num=$('#ammoNum'); }
  const show=!!tank&&!TK.dead&&!transit&&!GAR.open&&!helpOpen&&!LOC.safe; AMO.m.visible=show; AMO.num.hidden=!show; if(!show) return;
  const id=WIDS[wcur], cap=ammoCap(id), have=Math.max(0,Math.floor(ST.ammo[id]||0)), tf=cap?clamp(have/cap,0,1):0;
  const lvl=UP.ammo|0, len=Math.PI/2*(lvl>=3?2:1+lvl*0.14)-0.12, segs=id==='mg'?1:Math.min(cap,90), key=id+'|'+(isRail()&&id==='cn'?'r':'');
  if(key!==AMO.key){ const first=!AMO.key; AMO.key=key; AMO.segs=segs; if(first) AMO.f=tf; AMO.dirtyN=true; }
  AMO.len+=(len-AMO.len)*Math.min(1,dt*8); const nf=AMO.f<0?tf:AMO.f+(tf-AMO.f)*Math.min(1,dt*9); const draw=Math.abs(nf-AMO.f)>0.0005||Math.abs(len-AMO.len)>0.002||AMO.dirtyR!==tf; AMO.f=nf;
  if(draw||AMO.segs!==AMO.ls){ AMO.ls=AMO.segs; AMO.dirtyR=tf; drawAmmo(AMO.R,Math.abs(AMO.f-tf)<0.002?tf:AMO.f,AMO.len,AMO.segs,'#ffc94a'); }
  const size=ARM.reach/RING_K; AMO.m.scale.set(size,1,size); AMO.m.position.set(TK.x,RYS.v+0.11,TK.z); AMO.m.material.opacity=have<=0?0.95:0.75;
  const sp=toScreen(TK.x+ARM.reach*Math.cos(0.5),RYS.v+0.1,TK.z+ARM.reach*Math.sin(0.5)); AMO.num.style.transform=`translate(${sp[0]}px,${sp[1]+22}px) translate(-50%,-50%)`;
  const ico=id==='cn'&&isRail()?AM_ICO.rail:AM_ICO[id]||AM_ICO.mg, txt=`${ico}<b>${have}</b><small>/${cap}</small>`; AMO.num.classList.toggle('empty',have<=0);
  if(txt!==AMO.lastTxt){ const rv=AMO.num.querySelector('.rv'); if(AMO.dirtyN&&AMO.lastTxt){ const old=rv.querySelector('span:not(.old)'); if(old){ old.className='old'; setTimeout(()=>old.remove(),300); } const n=document.createElement('span'); n.className='in'; n.innerHTML=txt; rv.appendChild(n); }
    else { let cur=rv.querySelector('span:not(.old)'); if(!cur){ cur=document.createElement('span'); rv.appendChild(cur); } cur.innerHTML=txt; } AMO.lastTxt=txt; AMO.dirtyN=false; } }
/* ---- enemy ring: red segments around the hovered / locked target ---- */
const ERG={R:null,m:null,e:null,ghost:1,flash:0,lastHp:0,last:-1};
function eRingUpdate(dt){ if(!ERG.R){ ERG.R=ringTex(256); ERG.m=ringMesh(ERG.R.t); } const e=AIM.lockE; const show=!!e&&!e.dead&&!LOC.safe&&!transit&&!GAR.open; ERG.m.visible=show; if(!show){ ERG.e=null; return; }
  const mh=e.maxHp||8, f=clamp(e.hp/mh,0,1); if(ERG.e!==e){ ERG.e=e; ERG.ghost=f; ERG.lastHp=e.hp; ERG.last=-1; } if(e.hp<ERG.lastHp-0.01) ERG.flash=1; ERG.lastHp=e.hp;
  if(ERG.ghost<f) ERG.ghost=f; else ERG.ghost=Math.max(f,ERG.ghost-dt*0.5); ERG.flash=Math.max(0,ERG.flash-dt); const q=Math.round(f*200)*1000+Math.round(ERG.ghost*200)+(ERG.flash>0?Math.round(ERG.flash*20)*1e6:0);
  if(q!==ERG.last){ ERG.last=q; drawSegs(ERG.R,f,ERG.ghost,'#ff3b30',Math.min(1,ERG.flash*1.2),null); }
  const rr=(e.r||e.hr||0.8)*1.35+0.7, size=rr/RING_K; ERG.m.scale.set(size,1,size); ERG.m.position.set(e.x,ringY(e.x,e.z,rr*0.8)+0.12,e.z); ERG.m.material.opacity=0.5+0.5*Math.min(1,ERG.flash*1.5); }
/* ---- wounded robots: slower, sparking, smoking ---- */
function woundUpdate(dt){ if(LOC.safe||transit) return; for(const e of ENEMIES){ if(e.dead||!e.maxHp||e.hp>=e.maxHp*0.5) continue; const R=e.r||0.8, k=1-e.hp/(e.maxHp*0.5);
    if(rnd()<dt*(1+k*2)){ const a=rnd()*TAU, x=e.x+Math.cos(a)*R*0.6, z=e.z+Math.sin(a)*R*0.6, y=(e.y||0)+(e.hy||0.6)*(0.6+rnd()*0.8); for(let n=0;n<5;n++) spark(x,y,z,(rnd()-0.5)*5,1+rnd()*4,(rnd()-0.5)*5,1,0.8,0.4,0.3+rnd()*0.3); const ps=sndAt(x,z); sNz(0.07,'highpass',5000,1,0.05); if(rnd()<0.4) sO(2200,900,0.05,0.03,'square'); sndOff(ps); }
    if(rnd()<dt*(1.5+k*3)){ const a=rnd()*TAU, x=e.x+Math.cos(a)*R*0.5, z=e.z+Math.sin(a)*R*0.5, y=(e.y||0)+(e.hy||0.6)*(0.8+rnd()*0.6); SMOKE.spawn(x,y,z,(rnd()-0.5)*0.6,1.2+rnd(),(rnd()-0.5)*0.6,0.3+R*0.15,1.6,1.0+rnd()*0.6,0.55,0.06,0.06,0.07); } } }
/* ---- gait: thigh/shin legs with knees, elbows, torso twist and lean ---- */
function gaitPose(P,ph,amp){ const s=Math.sin(ph), c=Math.cos(ph);
  P.hipL.rotation.x=-s*0.55*amp; P.hipR.rotation.x=s*0.55*amp; if(P.kneeL){ P.kneeL.rotation.x=(0.06+Math.max(0,c)*1.0)*amp; P.kneeR.rotation.x=(0.06+Math.max(0,-c)*1.0)*amp; }
  if(P.armL){ P.armL.rotation.x=s*0.6*amp; P.armR.rotation.x=-s*0.6*amp; } if(P.elbL){ P.elbL.rotation.x=-(0.3+Math.max(0,-s)*0.6)*amp-0.15; P.elbR.rotation.x=-(0.3+Math.max(0,s)*0.6)*amp-0.15; }
  if(P.torso){ P.torso.rotation.y=s*0.12*amp; } return (Math.cos(2*ph)+1)*0.035*amp; }
function makeLeg(par,x,y,mat,shoeMat,L1,L2,w){ const hip=new THREE.Group(); hip.position.set(x,y,0); par.add(hip); const th=new THREE.Mesh(new THREE.BoxGeometry(w,L1,w*1.12).translate(0,-L1/2,0),mat); hip.add(th);
  const knee=new THREE.Group(); knee.position.y=-L1; hip.add(knee); knee.add(new THREE.Mesh(new THREE.BoxGeometry(w*0.92,L2,w*1.02).translate(0,-L2/2,0),mat)); const sh=new THREE.Mesh(new THREE.BoxGeometry(w*1.02,0.07,w*1.7),shoeMat); sh.position.set(0,-L2-0.01,w*0.32); knee.add(sh); return {hip,knee}; }

