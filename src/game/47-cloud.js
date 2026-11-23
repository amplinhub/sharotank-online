/* ================= v31.0: cloud save — the whole progress lives with the pilot on the server =================
   What goes up: scrap, machines and their upgrades, the campaign (MS), known enemies, kits, rescued people,
   pilot counters and medals, tutorial done. Not: graphics, sound, chat cache, hp/ammo (device-local, refilled on apply).
   Rules: the newer save wins for scrap and kits, but progress never goes backwards — mission number, machines,
   upgrades, medals and counters are merged by maximum. First contact on a device: an empty game takes the server
   copy silently, a game with its own progress gets a card «server or this device». Applying = write localStorage
   in a calm moment (camp or menu) along the cold-start path: loadSave → tank → HUD. */
const CLOUD_KEY='sharotank_cloud_v1', CLOUD_BAK='sharotank_cloud_backup';
function cloudHash(s){ let h=5381; for(let i=0;i<s.length;i++) h=((h<<5)+h+s.charCodeAt(i))|0; return (h>>>0).toString(36)+':'+s.length; }
function cloudLoad(){ try{ const d=JSON.parse(localStorage.getItem(CLOUD_KEY)||'null'); if(d&&typeof d==='object'){ CLOUD.t=+d.t||0; CLOUD.last=d.last||''; CLOUD.up=d.up||''; CLOUD.sb=+d.sb||0; CLOUD.ready=!!d.ready; } }catch(_){ /* приватный режим */ } }
function cloudKeep(){ if(CLOUD.lock) return; try{ localStorage.setItem(CLOUD_KEY,JSON.stringify({t:CLOUD.t,last:CLOUD.last,up:CLOUD.up,sb:CLOUD.sb,ready:CLOUD.ready?1:0})); }catch(_){ /* приватный режим */ } }
function cloudBody(){ return {g:{scrap:Math.floor(ST.scrap),up:UP,ms:{i:MS.i,active:MS.active,prog:Math.floor(MS.prog*10)/10,flag:!!MS.flag,fp:MS.fp==null?null:MS.fp,ease:MS.ease||{},camp:MS.camp||{},mei:MS.mei||{}},kits:ST.kits,seen:SEEN},
  d:{kills:DRV.kills,deaths:DRV.deaths,kbt:DRV.kbt,med:DRV.medals,st:DRV.st,streak:DRV.streak},tut:TUT.done?1:0}; }
function cloudNow(){ return JSON.parse(JSON.stringify(Object.assign({v:1,t:CLOUD.t},cloudBody()))); }
function cloudStrip(b){ const c=Object.assign({},b); delete c.t; delete c.v; return JSON.stringify(c); }

/* every few seconds: did the progress change? then it is «newer» from now on and the next sync carries it */
function cloudTick(dt){ if(CLOUD.lock) return; if((CLOUD.chk-=dt)>0) return; CLOUD.chk=3;
  const h=cloudHash(cloudStrip(cloudNow())); if(h!==CLOUD.last){ CLOUD.last=h; CLOUD.t=Date.now(); cloudKeep(); if(DRV.nick&&CLOUD.ready){ DRV.dirty=true; DRV.syncT=Math.min(DRV.syncT,20); } }
  if(CLOUD.pend&&cloudCalm()){ const p=CLOUD.pend; CLOUD.pend=null; cloudApply(cloudMerge(cloudNow(),p),'merge'); } }
function cloudCalm(){ return helpOpen||(LOC_ID==='camp'&&!transit&&!GAR.open&&!mcOpen); }
/* what the next sync sends */
function cloudParams(p){ if(!CLOUD.ready||CLOUD.lock) { p.sb=CLOUD.sb; return null; } p.sb=CLOUD.sb; if(CLOUD.last===CLOUD.up&&!CLOUD.force) return null;
  const b=cloudNow(), s=JSON.stringify(b); p.save=s; p.saveT=b.t; if(CLOUD.force) p.sf='1'; return {h:CLOUD.last,t:b.t}; }
function cloudReply(r,sent){ if(!r||!r.ok) return; if(sent&&+r.saveT===sent.t){ CLOUD.up=sent.h; CLOUD.force=false; } CLOUD.sb=Math.max(CLOUD.sb,+r.saveT||0);
  if(r.save) cloudArrive(r.save); else if(!CLOUD.ready){ CLOUD.ready=true; DRV.dirty=true; DRV.syncT=Math.min(DRV.syncT,1); } cloudKeep(); }
/* login on this device: start the handshake from zero */
function cloudLogin(r){ CLOUD.ready=false; CLOUD.sb=0; CLOUD.up=''; if(r.save) cloudArrive(r.save); else { CLOUD.ready=true; DRV.dirty=true; } cloudKeep(); }

function cloudParse(s){ try{ const b=JSON.parse(s); return b&&b.g&&b.g.up&&b.g.ms?b:null; }catch(_){ return null; } }
function cloudEmpty(b){ const u=b.g.up; return (b.g.ms.i|0)===0&&Object.keys(u.tanks||{}).length<=1&&!(u.engine||u.armor||u.cal||u.load||u.stab)&&(b.d.kills|0)<15; }
function cloudArrive(s){ const rem=cloudParse(s); if(!rem){ CLOUD.ready=true; return; } CLOUD.sb=Math.max(CLOUD.sb,+rem.t||0);
  const loc=cloudNow(); if(cloudStrip(loc)===cloudStrip(rem)){ CLOUD.ready=true; CLOUD.up=CLOUD.last; cloudKeep(); return; }
  if(!CLOUD.ready){ if(cloudEmpty(loc)){ cloudApply(rem,'replace'); return; } if(cloudEmpty(rem)){ CLOUD.ready=true; CLOUD.force=true; DRV.dirty=true; DRV.syncT=Math.min(DRV.syncT,1); return; } cloudAsk(loc,rem); return; }
  const m=cloudMerge(loc,rem); if(cloudStrip(m)===cloudStrip(loc)){ CLOUD.force=true; DRV.dirty=true; return; } /* ours already covers theirs — just send ours over it */
  if(cloudCalm()) cloudApply(m,'merge'); else CLOUD.pend=rem; }

/* ---- merge: the newer save is the base, progress taken by maximum from both ---- */
function cloudPerAll(u){ const out={}; for(const id of Object.keys(u.tanks||{base:1})){ let s; if(id===u.tank){ s={}; for(const k of PER_KEYS) s[k]=u[k]; } else s=(u.per&&u.per[id])||perDefault(id); out[id]=s; } return out; }
function cloudUpMerge(n,o){ const r=JSON.parse(JSON.stringify(n)), pn=cloudPerAll(n), po=cloudPerAll(o); r.tanks=Object.assign({},o.tanks||{},n.tanks||{});
  const all={}; for(const id of Object.keys(r.tanks)){ const a=pn[id]||po[id]||perDefault(id), b=po[id]||a, m=JSON.parse(JSON.stringify(a));
    for(const k of PER_KEYS){ if(k==='own') m.own=Object.assign({},b.own||{},a.own||{}); else if(typeof a[k]==='number'||typeof b[k]==='number') m[k]=Math.max(+a[k]||0,+b[k]||0); }
    all[id]=m; }
  if(!r.tanks[r.tank]) r.tank='base'; r.per={}; for(const id in all){ if(id===r.tank) for(const k of PER_KEYS) r[k]=all[id][k]; else r.per[id]=all[id]; }
  r.own=Object.assign({},r.own||{}); return r; }
function cloudMax(a,b){ const r=Object.assign({},b||{},a||{}); for(const k in r) r[k]=Math.max(+(a||{})[k]||0,+(b||{})[k]||0); return r; }
function cloudMerge(a,b){ const n=(+a.t||0)>=(+b.t||0)?a:b, o=n===a?b:a, r=JSON.parse(JSON.stringify(n));
  if((o.g.ms.i|0)>(r.g.ms.i|0)) r.g.ms=JSON.parse(JSON.stringify(o.g.ms));
  r.g.ms.camp=cloudMax(n.g.ms.camp,o.g.ms.camp);
  r.g.up=cloudUpMerge(n.g.up,o.g.up); r.g.seen=Object.assign({},o.g.seen||{},n.g.seen||{});
  r.d.kills=Math.max(n.d.kills|0,o.d.kills|0); r.d.deaths=Math.max(n.d.deaths|0,o.d.deaths|0); r.d.kbt=cloudMax(n.d.kbt,o.d.kbt); r.d.st=cloudMax(n.d.st,o.d.st);
  r.d.med=Object.assign({},o.d.med||{},n.d.med||{}); r.tut=(a.tut||b.tut)?1:0; r.t=Math.max(+a.t||0,+b.t||0); return r; }

/* ---- apply: the same path a cold start takes (loadSave → tank → HUD), and keep it in localStorage too ---- */
function cloudApply(b,how){
  const d=Object.assign(JSON.parse(localStorage.getItem(SAVE_KEY)||'null')||{},{scrap:b.g.scrap|0,up:JSON.parse(JSON.stringify(b.g.up)),ms:Object.assign({},b.g.ms,{v:25}),kits:b.g.kits||{rep:0,ammo:0,art:0},seen:b.g.seen||{},hp:null,dmg:[],ammo:null});
  for(const k of Object.keys(SEEN)) delete SEEN[k]; MS.camp={};
  UP.per={}; UP.tanks={base:1}; loadSave(d);
  DRV.kills=b.d.kills|0; DRV.deaths=b.d.deaths|0; DRV.kbt=Object.assign({},b.d.kbt||{}); DRV.medals=Object.assign({},b.d.med||{}); DRV.st=Object.assign({},DRV.st,b.d.st||{}); DRV.streak=b.d.streak|0;
  if(b.tut){ TUT.done=true; tutSave(); }
  buildGameTank(); updateWeaponUI(); rankUI(); objUI(); if(typeof campPeopleSync==='function') campPeopleSync();
  save(); drvSave();
  CLOUD.ready=true; CLOUD.sb=Math.max(CLOUD.sb,+b.t||0); CLOUD.t=how==='merge'?Date.now():(+b.t||Date.now()); CLOUD.last=cloudHash(cloudStrip(cloudNow())); CLOUD.up=how==='merge'?'':CLOUD.last; cloudKeep();
  if(how==='merge'){ DRV.dirty=true; DRV.syncT=Math.min(DRV.syncT,5); }
  toast(how==='merge'?'Подтянул прогресс с другого устройства':'Прогресс загружен с сервера'); }

/* ---- first contact on a device that already has its own progress: let the player choose ---- */
function cloudSum(b){ const n=Math.min(b.g.ms.i|0,STORY.length), tk=Object.keys(b.g.up.tanks||{}).length;
  return `<b>${RANKS[rankFor(b.g.ms.i|0)]}</b><span>${(b.g.ms.i|0)>=STORY.length?'кампания пройдена':'задание '+(n+1)+' из '+STORY.length}</span><span>${b.g.scrap|0} лома · ${tk} ${plural(tk,['машина','машины','машин'])}</span><i>${b.t?new Date(+b.t).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''}</i>`; }
function cloudAsk(loc,rem){ let el=$('#cloudAsk'); if(!el){ el=document.createElement('div'); el.id='cloudAsk'; document.body.appendChild(el); }
  el.innerHTML=`<div class="cabx"><h3>Чей прогресс оставить?</h3><p>У пилота «${DRV.nick}» на сервере другой прогресс, чем на этом устройстве.</p>
    <div class="carow"><button id="caSrv"><em>На сервере</em>${cloudSum(rem)}</button><button id="caLoc"><em>На этом устройстве</em>${cloudSum(loc)}</button></div>
    <p class="cadim">Второй вариант не пропадёт: копия останется на этом устройстве.</p></div>`;
  el.hidden=false; sfxClick();
  $('#caSrv').onclick=e=>{ e.stopPropagation(); try{ localStorage.setItem(CLOUD_BAK,JSON.stringify(loc)); }catch(_){ /* нет места */ } el.hidden=true; cloudApply(rem,'replace'); };
  $('#caLoc').onclick=e=>{ e.stopPropagation(); el.hidden=true; CLOUD.ready=true; CLOUD.force=true; CLOUD.up=''; CLOUD.t=Date.now(); cloudKeep(); DRV.dirty=true; DRV.syncT=0.5; toast('Оставил прогресс этого устройства'); }; }

cloudLoad();
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&DRV.nick&&CLOUD.ready&&!CLOUD.lock){ CLOUD.chk=0; cloudTick(0); if(CLOUD.last!==CLOUD.up) drvSync(); } });
