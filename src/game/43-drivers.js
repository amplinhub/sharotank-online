/* ================= v30.0: «Онлайн рейтинг» — пилоты, общий рейтинг, друзья, сообщения, лом, медали =================
   Сервер — веб-приложение Apps Script при Google Таблице (server/sheets/core.js), клиент — window.SHT_SHEETS (src/net/sheets.js).
   Состояние DRV — в 10-economy.js, медали и рисунки — в 44-online-art.js (используются только во время игры).
   Ничего не ждём: списки и карточки рисуются из кэша сразу, свежие данные подтягиваются в фоне (синхронизация раз в 20 с,
   рейтинг раз в 2 мин, карточки друзей и лидеров — по одной в 3 с). */
const DRV_BOSSN={krot:1,hornet:1,dragon:1,crypt:1};
const DRV_ERR={net:'Нет связи с сервером. Проверь интернет.',nourl:'Сервер онлайн-рейтинга ещё не подключён.',auth:'Неверный позывной или PIN.',locked:'Слишком много неверных PIN. Подожди 10 минут.',
  nick:'Позывной: 2–16 символов, буквы, цифры, пробел, _ - .',pin:'PIN — ровно 4 цифры.',nick_taken:'Этот позывной уже занят. Если он твой — нажми «Войти».',no_nick:'Нет пилота с таким позывным.',
  self:'Это ты.',limit:'Лимит на сегодня исчерпан.',not_friend:'Сначала добавь пилота в друзья (☆).',bad:'Сервер отклонил запрос.',server:'Ошибка на сервере. Попробуй позже.'};
const DRV_SAVE=['nick','pin','av','kills','kbt','deaths','medals','streak','st','friends','cache'];
const drvEsc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const drvTank=id=>(CHASSIS[id]&&CHASSIS[id].name)||'—';
const drvEName=t=>{ const n=ENAME[t]||t, m=/«(.+)»/.exec(n); return m?m[1]:n; };
const drvScore=()=>DRV.kills+50*Object.keys(DRV.medals).length;
function drvAgo(seen,now){ if(!seen) return ''; const m=Math.max(0,Math.round(((now||Date.now())-seen)/60000)); return m<3?'в игре сейчас':m<60?`был ${m} мин назад`:m<2880?`был ${Math.round(m/60)} ч назад`:`был ${Math.round(m/1440)} дн назад`; }
function drvLoad(){ try{ const d=JSON.parse(localStorage.getItem(DRV_KEY)||'null'); if(d) for(const k of DRV_SAVE) if(d[k]!=null) DRV[k]=d[k]; }catch(_){ /* приватный режим */ }
  DRV.st=Object.assign({ram:0,civ:0,flag:0,msg:0,gift:0},DRV.st); DRV.cache=Object.assign({top:null,topT:0,cards:{}},DRV.cache); }
function drvSave(){ DRV.ls=false; try{ const o={}; for(const k of DRV_SAVE) o[k]=DRV[k]; localStorage.setItem(DRV_KEY,JSON.stringify(o)); }catch(_){ /* приватный режим */ } }
function drvApi(){ return window.SHT_SHEETS||null; }
const drvOn=()=>!OFFLINE&&!!(drvApi()&&drvApi().url());
async function drvCall(a,p,auth){ const S=OFFLINE?null:drvApi(); if(!S) return {ok:false,err:'nourl'}; const q=Object.assign({},p||{}); if(auth){ if(!DRV.nick) return {ok:false,err:'auth'}; q.nick=DRV.nick; q.pin=DRV.pin; } return S.call(a,q); }

/* ---- counters (work without an account too) ---- */
function drvKill(type,src,e){ if(e&&(e.bossPart||e.xf)) return; if(type==='dseg'||type==='xfmr') return;
  DRV.kills++; DRV.kbt[type]=(DRV.kbt[type]|0)+1; if(src==='ram') DRV.st.ram++; DRV.dirty=true; DRV.ls=true; medalsCheck(); }
function drvDeath(){ DRV.deaths++; DRV.streak=0; DRV.dirty=true; drvSave(); }
function drvMission(){ if(!DRV.dbg) DRV.streak++; DRV.dirty=true; medalsCheck(); drvSave(); }
function drvStat(k){ DRV.st[k]=(DRV.st[k]|0)+1; DRV.dirty=true; medalsCheck(); drvSave(); }

/* ---- medals ---- */
function medalGive(id){ if(DRV.medals[id]) return; const m=MEDALS.find(x=>x[0]===id); if(!m) return; DRV.medals[id]=Date.now(); DRV.dirty=true; drvSave(); drvNote('НОВАЯ МЕДАЛЬ',m[1]); sfxBuy(); }
function medalsCheck(){ const k=DRV.kbt, s=DRV.st, give=(c,id)=>{ if(c&&!DRV.medals[id]) medalGive(id); };
  give(DRV.kills>=100,'k100'); give(DRV.kills>=1000,'k1000'); give(DRV.kills>=5000,'k5000'); give(s.ram>=25,'ram'); give((k.drone|0)>=30,'drones'); give((k.katok|0)>=10,'katok');
  give(s.civ>=20,'rescue'); give(s.flag>=3,'flags'); give(DRV.streak>=10,'streak'); give(s.msg>=10,'radio'); give(s.gift>=1000,'gift'); give(DRV.friends.length>=3,'team');
  give(['krot','hornet','dragon','crypt'].every(b=>DRV.medals[b]),'all4');
  if(!DRV.medals.fleet&&Object.keys(UP.tanks||{}).length>=CH_ORDER.length) medalGive('fleet');
  if(!DRV.medals.major&&MS.rank>=RANKS.indexOf('Майор')) medalGive('major');
  if(!DRV.medals.tuned){ const all=[UP].concat(Object.values(UP.per||{})); if(all.some(u=>u&&(u.engine|0)>=3&&(u.armor|0)>=3)) medalGive('tuned'); } }

/* ---- boss fights: timer and hits taken (medals «Молния», «Без царапины») ---- */
function drvTick(dt){ const e=BOSS.e;
  if(e&&!e.dead&&!transit&&!LOC.safe){ const f=DRV.fight&&DRV.fight.e===e?DRV.fight:(DRV.fight={e,t:0,hp:TK.hp,lost:0,max:maxHP()}); f.t+=dt; if(TK.hp<f.hp) f.lost+=f.hp-TK.hp; f.hp=TK.hp; }
  if(LOC.safe&&DRV.dbg) DRV.dbg=false;
  if(DRV.ls&&(DRV.lsT=(DRV.lsT||0)-dt)<=0){ DRV.lsT=5; drvSave(); }
  if(!drvOn()||!DRV.nick||document.hidden) return;
  if((DRV.syncT-=dt)<=0){ DRV.syncT=20; drvSync(); }
  if((DRV.topT-=dt)<=0){ DRV.topT=$('#drivers').hidden?120:30; drvTop(); }
  if(DRV.preQ.length&&(DRV.preT-=dt)<=0){ DRV.preT=3; drvCardFetch(DRV.preQ.shift(),true); } }
function drvBossWin(e){ const f=DRV.fight&&DRV.fight.e===e?DRV.fight:null; DRV.fight=null; if(DRV.dbg){ DRV.dbg=false; return; } if(!f||!DRV_BOSSN[e.type]) return;
  medalGive('first'); medalGive(e.type); if(f.lost<f.max*0.1) medalGive('clean'); if(f.t<90) medalGive('fast'); if(UP.tank==='ten') medalGive('shadow'); if(UP.tank==='rszo') medalGive('arty');
  medalsCheck(); DRV.dirty=true; DRV.syncT=Math.min(DRV.syncT,2); }

/* ---- sync: my numbers up, inbox down ---- */
function drvTlv(){ return {e:UP.engine|0,a:UP.armor|0,s:UP.stab|0,ab:UP.abl|0,mg:UP.mg,rk:UP.rk|0,c:UP.cal|0,l:UP.load|0}; }
function drvMerge(me){ if(!me) return; DRV.kills=Math.max(DRV.kills,me.kills|0); DRV.deaths=Math.max(DRV.deaths,me.deaths|0);
  for(const k of Object.keys(me.kbt||{})) DRV.kbt[k]=Math.max(DRV.kbt[k]|0,me.kbt[k]|0); for(const m of me.med||[]) if(!DRV.medals[m]) DRV.medals[m]=Date.now();
  if(Array.isArray(me.friends)) DRV.friends=me.friends; }
async function drvSync(){ if(DRV.busy) return; DRV.busy=true;
  try{ const p={kills:DRV.kills,kbt:JSON.stringify(DRV.kbt),deaths:DRV.deaths,med:JSON.stringify(Object.keys(DRV.medals)),tank:UP.tank,tlv:JSON.stringify(drvTlv()),av:DRV.av,rank:MS.rank,missions:MS.i};
    DRV.dirty=false; /* changes made while the request is in flight set it again */
    const r=await drvCall('sync',p,true); if(!r.ok){ DRV.dirty=true; return; } drvMerge(r.me); drvSave();
    for(const m of r.inbox||[]) drvInbox(m); if(!$('#drivers').hidden) drvRender(true); }
  finally{ DRV.busy=false; } }
function drvInbox(m){ const log=(DRV.cache.cards[m.from]||{}).log; if(log) log.push({out:false,kind:m.kind,text:m.text,amount:m.amount,time:m.time});
  if(m.kind==='scrap'){ ST.scrap+=m.amount; save(); drvNote(`ПОСЫЛКА ОТ ${m.from}`,`+${m.amount} лома`); sfxPickup(1); }
  else drvNote(`ВХОДЯЩЕЕ СООБЩЕНИЕ ОТ ${m.from}`,m.text); }
async function drvTop(){ const r=await drvCall('top',{}); if(!r.ok) return; DRV.cache.top=r.list; DRV.cache.topT=Date.now(); drvSave();
  /* warm the cards people are likely to open: friends first, then the leaders */
  const want=DRV.friends.concat(r.list.slice(0,8).map(x=>x.n)).filter((n,i,a)=>n!==DRV.nick&&a.indexOf(n)===i);
  DRV.preQ=want.filter(n=>{ const c=DRV.cache.cards[n]; return !c||Date.now()-c.t>300000; }); DRV.preT=1;
  if(!$('#drivers').hidden&&DRVUI.view!=='card') drvRender(true); }
async function drvCardFetch(who,quiet){ const r=await drvCall('card',{who},true); if(!r.ok){ if(!quiet&&DRVUI.view==='card'&&DRVUI.who===who) drvMsg(DRV_ERR[r.err]||'Ошибка',true); return; }
  r.t=Date.now(); DRV.cache.cards[r.nick]=r; const ks=Object.keys(DRV.cache.cards); if(ks.length>40){ ks.sort((a,b)=>DRV.cache.cards[a].t-DRV.cache.cards[b].t); delete DRV.cache.cards[ks[0]]; }
  drvSave(); if(DRVUI.view==='card'&&DRVUI.who===r.nick) drvRender(true); }

/* ---- dialog ---- */
const DRVUI={view:'top',tab:'top',who:'',med:'',amt:100,txt:''};
function drvMsg(s,err){ const m=$('#drvMsg'); m.textContent=s||''; m.classList.toggle('err',!!err); }
function drvOpen(){ $('#drivers').hidden=false; drvMsg('');
  if(!drvOn()){ $('#drvReg').hidden=true; $('#drvMain').hidden=true; drvMsg(DRV_ERR.nourl,true); return; }
  if(!DRV.nick){ $('#drvReg').hidden=false; $('#drvMain').hidden=true; drvRegRender(); return; }
  $('#drvReg').hidden=true; $('#drvMain').hidden=false; if(DRVUI.view==='card') DRVUI.view=DRVUI.tab; drvRender();
  if(Date.now()-DRV.cache.topT>15000) DRV.topT=0; DRV.syncT=Math.min(DRV.syncT,1); }
function drvClose(){ $('#drivers').hidden=true; drvTkStop(); }
function drvTab(t){ DRVUI.tab=DRVUI.view=t; drvMsg(''); drvRender(); }
function drvCardOpen(who){ DRVUI.view='card'; DRVUI.who=who; DRVUI.med=''; drvMsg(''); drvRender(); if(who!==DRV.nick) drvCardFetch(who); }

function drvRegRender(){ $('#drvAvs').innerHTML=AVATARS.map((a,i)=>`<button class="dav${i===DRV.av?' on':''}" data-av="${i}" aria-label="${a[0]}" title="${a[0]}">${avSvg(i)}</button>`).join(''); }
async function drvAuth(kind){ const nick=$('#drvNick').value.trim(), pin=$('#drvPin').value.trim(); if(!nick) return drvMsg('Впиши позывной.',true); if(!/^\d{4}$/.test(pin)) return drvMsg(DRV_ERR.pin,true);
  document.querySelectorAll('#drvReg .go').forEach(b=>{ b.disabled=true; }); drvMsg(kind==='reg'?'Регистрирую…':'Вхожу…');
  const r=await drvCall(kind,{nick,pin,av:DRV.av}); document.querySelectorAll('#drvReg .go').forEach(b=>{ b.disabled=false; });
  if(!r.ok) return drvMsg(DRV_ERR[r.err]||'Не получилось',true);
  DRV.nick=r.me.nick; DRV.pin=pin; if(kind==='login') DRV.av=r.me.av|0; drvMerge(r.me); DRV.cache.cards={}; DRV.dirty=true; DRV.syncT=0.3; DRV.topT=0; drvSave();
  drvMsg(kind==='reg'?`Пилот «${DRV.nick}» записан. PIN запомни — с ним можно войти с другого устройства.`:`С возвращением, ${DRV.nick}!`); drvOpen(); }

function drvRow(x,i){ const me=x.n===DRV.nick, fr=DRV.friends.includes(x.n);
  return `<li class="${me?'me':''}" data-who="${drvEsc(x.n)}"><span class="n">${i<0?'—':i+1}</span><span class="av">${avSvg(x.av)}</span><span class="nm">${drvEsc(x.n)}<small>${drvEsc(x.t?drvTank(x.t):'—')} · ${x.k} врагов · ${x.m} мед.</small></span><b>${x.s}</b>${me?'<i></i>':`<button class="dstar${fr?' on':''}" data-star="${drvEsc(x.n)}" aria-label="${fr?'Убрать из друзей':'В друзья'}">${fr?'★':'☆'}</button>`}</li>`; }
function drvMine(){ return {n:DRV.nick,av:DRV.av,s:drvScore(),k:DRV.kills,m:Object.keys(DRV.medals).length,t:UP.tank}; }
function drvRender(bg){ const B=$('#drvBody'); if(bg&&B.contains(document.activeElement)&&document.activeElement.tagName==='INPUT') return; /* don't yank the field the player is typing in */
  document.querySelectorAll('.drvTabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===DRVUI.tab));
  $('#drvMe').innerHTML=`<span class="av">${avSvg(DRV.av)}</span><span class="nm">${drvEsc(DRV.nick)}<small>${drvScore()} очков · моя карточка</small></span>`;
  $('.drvTabs').hidden=DRVUI.view==='card'; $('#drvMe').hidden=DRVUI.view==='card';
  if(DRVUI.view!=='card'){ drvTkStop(); $('#drvCard').hidden=true; B.hidden=false;
    let L=(DRV.cache.top||[]).map(x=>x.n===DRV.nick?drvMine():x); if(!L.some(x=>x.n===DRV.nick)) L.push(drvMine()); L.sort((a,b)=>b.s-a.s);
    if(DRVUI.view==='fr'){ const idx=new Map(L.map((x,i)=>[x.n,i])); const F=DRV.friends.map(n=>{ const x=L.find(y=>y.n===n); return x||{n,av:(DRV.cache.cards[n]||{}).av|0,s:0,k:0,m:0,t:''}; });
      B.innerHTML=F.length?'<ol class="drvL">'+F.map(x=>drvRow(x,idx.has(x.n)?idx.get(x.n):-1)).join('')+'</ol>':'<p class="drvMsg">Пока никого. Нажми ☆ у пилота в рейтинге — он появится здесь, и ему можно будет писать и отправлять лом.</p>'; }
    else B.innerHTML=(DRV.cache.top?'':'<p class="drvMsg">Подтягиваю рейтинг…</p>')+'<ol class="drvL">'+L.map(drvRow).join('')+'</ol>';
    return; }
  B.hidden=true; $('#drvCard').hidden=false; drvCardRender(); }

function drvCardData(who){ if(who===DRV.nick){ const u=UP; return {nick:DRV.nick,av:DRV.av,kills:DRV.kills,kbt:DRV.kbt,deaths:DRV.deaths,med:Object.keys(DRV.medals),tank:UP.tank,tlv:drvTlv(),rank:MS.rank,score:drvScore(),me:true,_u:u}; }
  return DRV.cache.cards[who]||null; }
function drvCardRender(){ const who=DRVUI.who, r=drvCardData(who), H=$('#drvCH'), C=$('#drvCB'); const fr=DRV.friends.includes(who), me=who===DRV.nick;
  const top=(DRV.cache.top||[]).find(x=>x.n===who);
  if(!r){ H.innerHTML=`<span class="av big">${avSvg(top?top.av:0)}</span><span class="nm">${drvEsc(who)}<small>загружаю карточку…</small></span>`; C.innerHTML=''; drvTkShow(top&&top.t,null); return; }
  H.innerHTML=`<span class="av big">${avSvg(r.av)}</span><span class="nm">${drvEsc(r.nick)}<small>${drvEsc(RANKS[r.rank]||'')}${me?'':' · '+drvAgo(r.seen,r.now)}</small></span>`+(me?'':`<button class="dstar${fr?' on':''}" data-star="${drvEsc(who)}">${fr?'★':'☆'}</button>`);
  $('#drvTkN').textContent=r.tank?drvTank(r.tank):'машина не выбрана'; drvTkShow(r.tank,r.tlv);
  const med=new Set(r.med||[]), kb=Object.keys(r.kbt||{}).filter(k=>r.kbt[k]>0).sort((a,b)=>r.kbt[b]-r.kbt[a]);
  let h=`<div class="dstat"><span><b>${r.kills|0}</b>врагов</span><span><b>${r.deaths|0}</b>раз подбит</span><span><b>${(r.kills|0)+50*med.size}</b>очков</span></div>`;
  if(kb.length) h+='<div class="dkbt">'+kb.map(k=>`<span>${drvEsc(drvEName(k))} <b>${r.kbt[k]}</b></span>`).join('')+'</div>';
  const ML=me?MEDALS:MEDALS.filter(m=>med.has(m[0]));
  h+=`<div class="dsec">Медали <small>${med.size} из ${MEDALS.length}</small></div>`;
  h+=ML.length?'<div class="dmed">'+ML.map(m=>`<button class="${med.has(m[0])?'on':''}${DRVUI.med===m[0]?' sel':''}" data-med="${m[0]}" aria-label="${drvEsc(m[1])}">${medSvg(m[0])}</button>`).join('')+'</div>':'<p class="drvMsg">Медалей пока нет.</p>';
  const sm=MEDALS.find(m=>m[0]===DRVUI.med); h+=`<p class="dmedTx">${sm?`<b>${drvEsc(sm[1])}</b>${med.has(sm[0])?' ✓':''} — ${drvEsc(sm[2])}`:'Нажми на медаль, чтобы узнать, как её получить.'}</p>`;
  if(me){ h+='<div class="dsec">Аватарка</div><div class="davs">'+AVATARS.map((a,i)=>`<button class="dav${i===DRV.av?' on':''}" data-av="${i}" aria-label="${a[0]}" title="${a[0]}">${avSvg(i)}</button>`).join('')+'</div>'; }
  else if(fr){ const mx=Math.max(10,Math.min(1000,Math.floor(ST.scrap))), a=Math.max(10,Math.min(mx,DRVUI.amt|0));
    h+=`<div class="dsec">Отправить лом <small>у тебя ${Math.floor(ST.scrap)}</small></div><div class="dgift"><input type="range" id="drvAmt" min="10" max="${mx}" step="10" value="${a}" aria-label="Сколько лома"><input type="number" id="drvAmtN" min="10" max="${mx}" value="${a}" inputmode="numeric" aria-label="Сколько лома"><button class="go" data-gift>Отправить</button></div>`;
    h+=`<div class="dsec">Сообщение <small id="drvCnt">${DRVUI.txt.length}/50</small></div><div class="dgift"><input id="drvTxt" maxlength="50" autocomplete="off" placeholder="до 50 символов" value="${drvEsc(DRVUI.txt)}" aria-label="Сообщение"><button class="go" data-say>Отправить</button></div>`;
    const log=(r.log||[]).slice().reverse();
    h+='<div class="dsec">Переписка <small>хранится 7 дней</small></div>'+(log.length?'<ul class="dlog">'+log.map(m=>`<li class="${m.out?'out':''}"><small>${m.out?'ты':drvEsc(who)} · ${new Date(m.time).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</small>${m.kind==='scrap'?`<b>посылка: ${m.amount} лома</b>`:drvEsc(m.text)}</li>`).join('')+'</ul>':'<p class="drvMsg">Сообщений пока нет.</p>'); }
  else h+='<p class="drvMsg">Нажми ☆, чтобы добавить пилота в друзья: тогда ему можно писать и отправлять лом.</p>';
  C.innerHTML=h; }

/* ---- 3D model of the pilot's last machine ---- */
const TKV={r:null,scene:null,cam:null,T:null,sig:'',raf:0,t:0,last:0};
function drvTkShow(id,tlv){ const cv=$('#drvTk'); if(!id||!CHASSIS[id]){ cv.hidden=true; drvTkStop(); TKV.sig=''; return; } cv.hidden=false;
  if(!TKV.r){ try{ TKV.r=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true}); }catch(_){ cv.hidden=true; return; }
    TKV.r.setPixelRatio(Math.min(2,window.devicePixelRatio||1)); TKV.scene=new THREE.Scene(); TKV.cam=new THREE.PerspectiveCamera(28,2,0.1,100);
    TKV.scene.add(new THREE.HemisphereLight(0xffffff,0x223344,1.1)); const dl=new THREE.DirectionalLight(0xffffff,0.7); dl.position.set(-3,6,5); TKV.scene.add(dl); }
  const sig=id+JSON.stringify(tlv||{}); if(sig!==TKV.sig){ TKV.sig=sig; if(TKV.T){ TKV.scene.remove(TKV.T.root); disposeTank(TKV.T); }
    const v=tlv||{}, up=Object.assign({},UP,perDefault(id),{engine:v.e|0,armor:v.a|0,stab:v.s|0,abl:v.ab|0,rk:v.rk|0,cal:v.c|0,load:v.l|0},v.mg&&MGS[v.mg]?{mg:v.mg}:{},{tank:id,skin:TANK_SKIN});
    const T=makeTank(true,up), w=CHASSIS[id].w; T.cn.visible=w.includes(1); T.mg.visible=!w.includes(1)&&w.includes(0); T.U.dmg.value.set(0,0,0,0); TKV.scene.add(T.root); TKV.T=T; }
  if(!TKV.raf){ TKV.last=performance.now(); TKV.raf=requestAnimationFrame(drvTkFrame); } }
function drvTkFrame(now){ TKV.raf=0; if($('#drvCard').hidden||$('#drivers').hidden||!TKV.T) return; const dt=Math.min(0.1,(now-TKV.last)/1000); TKV.last=now; TKV.t+=dt;
  const cv=TKV.r.domElement, w=cv.clientWidth||300, h=cv.clientHeight||150; if(cv.width!==Math.round(w*TKV.r.getPixelRatio())) TKV.r.setSize(w,h,false);
  TKV.cam.aspect=w/h; TKV.cam.updateProjectionMatrix(); const a=TKV.t*0.5, d=10.5; TKV.cam.position.set(Math.sin(a)*d,4.6,Math.cos(a)*d); TKV.cam.lookAt(0,1.1,0);
  TKV.T.root.updateMatrixWorld(true); TKV.T.U.rootInv.value.copy(TKV.T.root.matrixWorld).invert(); TKV.r.render(TKV.scene,TKV.cam); TKV.raf=requestAnimationFrame(drvTkFrame); }
function drvTkStop(){ if(TKV.raf){ cancelAnimationFrame(TKV.raf); TKV.raf=0; } }

/* ---- incoming notes: hi-tech type-in, then a noisy fade-out; swipe to dismiss ---- */
const NOTE_GL='▓▒░#%&@<>/\\|=+*01ABCDEFXZ';
function drvNote(head,body){ const box=$('#drvNotes'), el=document.createElement('div'); el.className='dnote'; el.innerHTML='<div class="dnH"></div><div class="dnB"></div>';
  while(box.children.length>=3) box.firstChild.remove(); box.appendChild(el);
  const L=[[el.firstChild,head],[el.lastChild,body]].map(([n,t])=>({n,t:[...String(t)],cur:[],at:[]})); let t0=performance.now(), phase='in', iv=0;
  L.forEach((l,j)=>l.t.forEach((c,i)=>{ l.at[i]=j*90+i*14+Math.random()*90; l.cur[i]=c===' '?' ':''; }));
  const hold=4500+60*String(body).length, glyph=()=>NOTE_GL[Math.random()*NOTE_GL.length|0];
  const step=()=>{ const t=performance.now()-t0; let done=true;
    for(const l of L){ for(let i=0;i<l.t.length;i++){ const c=l.t[i];
        if(phase==='in'){ if(c===' ') continue; if(t>=l.at[i]) l.cur[i]=c; else { done=false; l.cur[i]=t>=l.at[i]-120?glyph():''; } }
        else { const k=l.at[i]; if(t>=k+160) l.cur[i]=' '; else if(t>=k){ l.cur[i]=c===' '?' ':glyph(); done=false; } else done=false; } }
      l.n.textContent=l.cur.join(''); }
    if(done&&phase==='in'){ phase='hold'; clearInterval(iv); iv=0; setTimeout(out,hold); }
    if(done&&phase==='out') kill(); };
  const out=()=>{ if(phase!=='hold') return; phase='out'; el.classList.add('glitch'); t0=performance.now(); L.forEach(l=>l.t.forEach((c,i)=>{ l.at[i]=Math.random()*800; })); iv=setInterval(step,40); };
  const kill=()=>{ if(iv) clearInterval(iv); iv=0; phase='gone'; el.remove(); };
  iv=setInterval(step,30); sO(1500,2100,0.05,0.03,'square');
  let x0=null, dx=0; el.addEventListener('pointerdown',e=>{ e.stopPropagation(); x0=e.clientX; dx=0; el.setPointerCapture(e.pointerId); el.style.transition='none'; });
  el.addEventListener('pointermove',e=>{ if(x0==null) return; dx=e.clientX-x0; el.style.transform=`translateX(${dx}px)`; el.style.opacity=String(Math.max(0.2,1-Math.abs(dx)/180)); });
  const up=()=>{ if(x0==null) return; x0=null; el.style.transition=''; if(Math.abs(dx)>50){ el.style.transform=`translateX(${dx>0?120:-120}%)`; el.style.opacity='0'; setTimeout(kill,200); } else { el.style.transform=''; el.style.opacity=''; } };
  el.addEventListener('pointerup',up); el.addEventListener('pointercancel',up);
  return el; }

/* ---- events ---- */
$('#drvClose').addEventListener('click',e=>{ e.stopPropagation(); drvClose(); });
$('#bDrv').addEventListener('click',e=>{ e.stopPropagation(); sfxClick(); drvOpen(); });
$('#bDrv2').addEventListener('click',e=>{ e.stopPropagation(); sfxClick(); drvOpen(); });
$('#drvRegGo').addEventListener('click',e=>{ e.stopPropagation(); drvAuth('reg'); });
$('#drvLogGo').addEventListener('click',e=>{ e.stopPropagation(); drvAuth('login'); });
$('#drvPin').addEventListener('input',e=>{ e.target.value=e.target.value.replace(/\D/g,'').slice(0,4); });
$('#drvMe').addEventListener('click',e=>{ e.stopPropagation(); sfxClick(); drvCardOpen(DRV.nick); });
$('#drvBack').addEventListener('click',e=>{ e.stopPropagation(); sfxClick(); DRVUI.view=DRVUI.tab; drvMsg(''); drvRender(); });
document.querySelectorAll('.drvTabs button').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); sfxClick(); drvTab(b.dataset.t); }));
async function drvStar(who){ const on=!DRV.friends.includes(who); DRV.friends=on?DRV.friends.concat(who):DRV.friends.filter(n=>n!==who); drvSave(); drvRender(); sfxClick();
  const r=await drvCall('friend',{who,on:on?'1':'0'},true); if(r.ok){ DRV.friends=r.friends; medalsCheck(); drvSave(); if(on) drvCardFetch(who,true); } else { drvMsg(DRV_ERR[r.err]||'Не получилось',true); DRV.friends=on?DRV.friends.filter(n=>n!==who):DRV.friends.concat(who); }
  drvRender(); }
async function drvSend(kind){ const who=DRVUI.who; let p;
  if(kind==='scrap'){ const n=Math.floor(+$('#drvAmtN').value||0); if(n<10) return drvMsg('Минимум 10 лома.',true); if(n>ST.scrap) return drvMsg('Не хватает лома.',true); p={to:who,kind,amount:n}; }
  else { const t=$('#drvTxt').value.replace(/\s+/g,' ').trim(); if(!t) return; p={to:who,kind,text:t.slice(0,50)}; }
  const btn=document.querySelector(kind==='scrap'?'[data-gift]':'[data-say]'); if(btn) btn.disabled=true;
  const r=await drvCall('send',p,true); if(btn) btn.disabled=false; if(!r.ok) return drvMsg(DRV_ERR[r.err]||'Не получилось',true);
  const c=DRV.cache.cards[who]; if(c){ c.log=c.log||[]; c.log.push({out:true,kind,text:p.text||'',amount:p.amount||0,time:Date.now()}); }
  if(kind==='scrap'){ ST.scrap-=p.amount; save(); DRV.st.gift+=p.amount; drvMsg(`Отправлено ${r.to}: ${p.amount} лома. Посылок сегодня ещё можно: ${r.left}.`); }
  else { DRV.st.msg++; DRVUI.txt=''; drvMsg(`Сообщение ушло к ${r.to}.`); }
  medalsCheck(); drvSave(); sfxBuy(); if(document.activeElement) document.activeElement.blur(); drvRender(); }
$('#drivers').addEventListener('click',e=>{ const b=e.target.closest('button,li[data-who]'); if(!b||!$('#drivers').contains(b)) return; e.stopPropagation();
  if(b.dataset.star){ drvStar(b.dataset.star); return; }
  if(b.dataset.av!=null){ DRV.av=+b.dataset.av; DRV.dirty=true; DRV.syncT=Math.min(DRV.syncT,1); drvSave(); sfxClick(); if(DRV.nick) drvRender(); else drvRegRender(); return; }
  if(b.dataset.med){ DRVUI.med=DRVUI.med===b.dataset.med?'':b.dataset.med; sfxClick(); drvCardRender(); return; }
  if(b.dataset.gift!=null){ drvSend('scrap'); return; } if(b.dataset.say!=null){ drvSend('msg'); return; }
  if(b.dataset.who){ sfxClick(); drvCardOpen(b.dataset.who); } });
$('#drivers').addEventListener('input',e=>{ const t=e.target;
  if(t.id==='drvAmt'){ $('#drvAmtN').value=t.value; DRVUI.amt=+t.value; }
  if(t.id==='drvAmtN'){ const v=Math.floor(+t.value||0); DRVUI.amt=v; const s=$('#drvAmt'); if(s) s.value=String(Math.max(+s.min,Math.min(+s.max,v))); }
  if(t.id==='drvTxt'){ DRVUI.txt=t.value; const c=$('#drvCnt'); if(c) c.textContent=t.value.length+'/50'; } });
$('#drivers').addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.target.id==='drvTxt'){ e.preventDefault(); drvSend('msg'); } });
drvLoad();
