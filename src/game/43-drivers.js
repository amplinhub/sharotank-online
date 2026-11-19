/* ================= v30.0: «Онлайн рейтинг» — пилоты, общий рейтинг, друзья, сообщения, лом, медали =================
   Сервер — веб-приложение Apps Script при Google Таблице (server/sheets/core.js), клиент — window.SHT_SHEETS (src/net/sheets.js).
   Состояние DRV — в 10-economy.js, медали и рисунки — в 44-online-art.js (используются только во время игры).
   Ничего не ждём: списки и карточки рисуются из кэша сразу, свежие данные подтягиваются в фоне.
   v30.1, щадим сервер: входящие — дешёвый опрос раз в 8 с (без новой почты сервер даже не открывает таблицу), свой профиль —
   раз в минуту, только если что-то изменилось (иначе отметка «в игре» раз в 4 мин), рейтинг — раз в 3 мин (сервер кэширует 60 с),
   карточки друзей и лидеров — по одной в 5 с, если старше 5 мин. */
const DRV_POLL=8, DRV_SYNC=60, DRV_BEAT=240, DRV_TOP=180, DRV_NEWS=300;
const DRV_BOSSN={krot:1,hornet:1,dragon:1,crypt:1};
const DRV_ERR={net:'Нет связи с сервером. Проверь интернет.',nourl:'Сервер профилей ещё не подключён.',auth:'Неверный позывной или PIN.',locked:'Слишком много неверных PIN. Подожди 10 минут.',
  nick:'Позывной: 2–16 символов, буквы, цифры, пробел, _ - .',pin:'PIN — ровно 4 цифры.',nick_taken:'Этот позывной уже занят. Если он твой — нажми «Войти».',no_nick:'Нет пилота с таким позывным.',
  self:'Это ты.',limit:'Лимит на сегодня исчерпан.',spam:'Не так быстро: не больше 10 сообщений в минуту.',not_friend:'Сначала добавь пилота в друзья (☆).',bad:'Сервер отклонил запрос.',server:'Ошибка на сервере. Попробуй позже.'};
const DRV_SAVE=['nick','pin','av','kills','kbt','deaths','medals','streak','st','friends','cache','unread'];
const drvEsc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const drvTank=id=>(CHASSIS[id]&&CHASSIS[id].name)||'—';
const drvEName=t=>{ const n=ENAME[t]||t, m=/«(.+)»/.exec(n); return m?m[1]:n; };
const drvScore=()=>DRV.kills+50*Object.keys(DRV.medals).length;
function drvErr(r){ if(r.err==='muted') return `Сообщения закрыты до ${new Date(r.until).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}: в прошлом было запрещённое слово.`; return DRV_ERR[r.err]||'Не получилось'; }
function drvAgo(seen,now){ if(!seen) return ''; const m=Math.max(0,Math.round(((now||Date.now())-seen)/60000)); return m<6?'в игре сейчас':m<60?`был ${m} мин назад`:m<2880?`был ${Math.round(m/60)} ч назад`:`был ${Math.round(m/1440)} дн назад`; }
function drvLoad(){ try{ const d=JSON.parse(localStorage.getItem(DRV_KEY)||'null'); if(d) for(const k of DRV_SAVE) if(d[k]!=null) DRV[k]=d[k]; }catch(_){ /* приватный режим */ }
  DRV.st=Object.assign({ram:0,civ:0,flag:0,msg:0,gift:0},DRV.st); DRV.cache=Object.assign({top:null,topT:0,cards:{},news:null,newsT:0,nv:{}},DRV.cache); }
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
  DRV.beatT=(DRV.beatT==null?DRV_BEAT:DRV.beatT)-dt;
  if((DRV.syncT-=dt)<=0&&(DRV.dirty||DRV.beatT<=0)){ DRV.syncT=DRV_SYNC; DRV.beatT=DRV_BEAT; drvSync(); }
  else if((DRV.pollT=(DRV.pollT==null?DRV_POLL:DRV.pollT)-dt)<=0){ DRV.pollT=DRV_POLL; drvPoll(); }
  if((DRV.topT-=dt)<=0){ DRV.topT=$('#drivers').hidden?DRV_TOP:45; drvTop(); }
  if((DRV.newsT=(DRV.newsT==null?8:DRV.newsT)-dt)<=0){ DRV.newsT=$('#drivers').hidden?DRV_NEWS:60; drvNews(); }
  if(DRV.preQ.length&&(DRV.preT-=dt)<=0){ DRV.preT=5; drvCardFetch(DRV.preQ.shift(),true); } }
async function drvPoll(){ if(DRV.busy) return; DRV.busy=true; try{ const r=await drvCall('poll',{},true); if(r.ok) for(const m of r.inbox||[]) drvInbox(m); } finally{ DRV.busy=false; } }
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
function drvInbox(m){ const c=DRV.cache.cards[m.from]; if(c){ c.log=c.log||[]; c.log.push({out:false,kind:m.kind,text:m.text,amount:m.amount,time:m.time}); }
  const open=!$('#drivers').hidden&&DRVUI.view==='card'&&DRVUI.who===m.from;
  if(open) drvChatSync(); else { DRV.unread[m.from]=(DRV.unread[m.from]|0)+1; if(!$('#drivers').hidden) drvRender(true); } drvSave();
  if(m.kind==='scrap'){ ST.scrap+=m.amount; save(); drvNote(`ПОСЫЛКА ОТ ${m.from}`,`+${m.amount} лома`); sfxPickup(1); }
  else drvNote(`ВХОДЯЩЕЕ СООБЩЕНИЕ ОТ ${m.from}`,m.text,{reply:m.from}); }
async function drvTop(){ const r=await drvCall('top',{}); if(!r.ok) return; DRV.cache.top=r.list; DRV.cache.topT=Date.now(); DRV.cache.topNow=r.now; drvSave();
  /* warm the cards people are likely to open: friends first, then the leaders */
  const want=DRV.friends.concat(r.list.slice(0,8).map(x=>x.n)).filter((n,i,a)=>n!==DRV.nick&&a.indexOf(n)===i);
  DRV.preQ=want.filter(n=>{ const c=DRV.cache.cards[n]; return !c||Date.now()-c.t>300000; }); DRV.preT=1;
  if(!$('#drivers').hidden&&DRVUI.view!=='card') drvRender(true); }
async function drvCardFetch(who,quiet){ const r=await drvCall('card',{who},true); if(!r.ok){ if(!quiet&&DRVUI.view==='card'&&DRVUI.who===who) drvMsg(DRV_ERR[r.err]||'Ошибка',true); return; }
  r.t=Date.now(); const old=DRV.cache.cards[r.nick]; if(old&&old.log){ const loc=old.log.filter(m=>m.st); if(loc.length) r.log=(r.log||[]).concat(loc); } DRV.cache.cards[r.nick]=r; const ks=Object.keys(DRV.cache.cards); if(ks.length>40){ ks.sort((a,b)=>DRV.cache.cards[a].t-DRV.cache.cards[b].t); delete DRV.cache.cards[ks[0]]; }
  drvSave(); if(DRVUI.view==='card'&&DRVUI.who===r.nick) drvRender(true); }

/* ---- dialog «Профиль» (v30.3: clearer layout, messenger-style chat, optimistic sending) ---- */
const DRVUI={view:'top',tab:'top',who:'',med:'',amt:100,txt:'',pane:'chat',mode:'reg',caKey:'',seen:new Set()};
function drvMsg(s,err){ const m=$('#drvMsg'); m.textContent=s||''; m.classList.toggle('err',!!err); }
function drvAnim(el){ if(!el) return; el.classList.remove('vin'); void el.offsetWidth; el.classList.add('vin'); }
function drvOpen(){ $('#drivers').hidden=false; drvMsg(''); drvAnim($('#drivers .card'));
  if(!drvOn()){ $('#drvReg').hidden=true; $('#drvMain').hidden=true; drvMsg(DRV_ERR.nourl,true); return; }
  if(!DRV.nick){ $('#drvReg').hidden=false; $('#drvMain').hidden=true; drvRegRender(); return; }
  $('#drvReg').hidden=true; $('#drvMain').hidden=false; if(DRVUI.view==='card') DRVUI.view=DRVUI.tab; drvRender();
  if(Date.now()-DRV.cache.topT>45000) DRV.topT=0; if(Date.now()-(DRV.cache.newsT||0)>60000) DRV.newsT=0; }
function drvClose(){ $('#drivers').hidden=true; drvTkStop(); }
function drvTab(t){ DRVUI.tab=DRVUI.view=t; drvMsg(''); drvRender(); drvAnim($('#drvBody')); }
function drvCardOpen(who){ DRVUI.view='card'; DRVUI.who=who; DRVUI.med=''; DRVUI.caKey=''; DRVUI.txt=''; DRVUI.pane='chat'; DRVUI.seen=new Set(); drvMsg('');
  if(DRV.unread[who]){ delete DRV.unread[who]; drvSave(); } drvRender(); drvAnim($('#drvCard')); if(who!==DRV.nick) drvCardFetch(who); }

/* registration / login: one form, one main button */
function drvRegRender(){ const reg=DRVUI.mode==='reg';
  $('#drvAvs').innerHTML=AVATARS.map((a,i)=>`<button class="dav${i===DRV.av?' on':''}" data-av="${i}" aria-label="${a[0]}" title="${a[0]}">${avSvg(i)}</button>`).join('');
  $('#drvAvSec').hidden=!reg; $('#drvRegGo').textContent=reg?'Создать пилота':'Войти'; $('#drvAltTx').textContent=reg?'Уже есть пилот?':'Нет пилота?'; $('#drvLogGo').textContent=reg?'Войти':'Создать';
  $('#drvLead').textContent=reg?'Создай пилота: попадёшь в общий рейтинг, сможешь дружить, переписываться и дарить лом. С позывным и PIN войдёшь с любого устройства.':'Впиши позывной и PIN, с которыми создавал пилота.'; }
async function drvAuth(kind){ const nick=$('#drvNick').value.trim(), pin=$('#drvPin').value.trim(); if(!nick) return drvMsg('Впиши позывной.',true); if(!/^\d{4}$/.test(pin)) return drvMsg(DRV_ERR.pin,true);
  const b=$('#drvRegGo'); b.disabled=true; drvMsg(kind==='reg'?'Регистрирую…':'Вхожу…');
  const r=await drvCall(kind,{nick,pin,av:DRV.av}); b.disabled=false;
  if(!r.ok) return drvMsg(DRV_ERR[r.err]||'Не получилось',true);
  DRV.nick=r.me.nick; DRV.pin=pin; if(kind==='login') DRV.av=r.me.av|0; drvMerge(r.me); DRV.cache.cards={}; DRV.dirty=true; DRV.syncT=0.3; DRV.topT=0; drvSave();
  drvMsg(kind==='reg'?`Пилот «${DRV.nick}» создан. Запомни PIN — с ним можно войти с другого устройства.`:`С возвращением, ${DRV.nick}!`); drvOpen(); }

/* lists */
const drvOnline=(x,now)=>x&&x.seen&&((now||Date.now())-x.seen)<360000;
function drvRow(x,i,now){ const me=x.n===DRV.nick, fr=DRV.friends.includes(x.n), un=DRV.unread[x.n]|0, pl=i<0?'—':i+1;
  return `<li class="${me?'me':''}${i>=0&&i<3?' p'+(i+1):''}" data-who="${drvEsc(x.n)}"><span class="n">${pl}</span><span class="av">${avSvg(x.av)}${drvOnline(x,now)?'<i class="on"></i>':''}</span>`+
    `<span class="nm">${drvEsc(x.n)}<small>${me?'<em>это ты</em> · ':''}${drvEsc(x.t?drvTank(x.t):'—')} · ${x.m} мед.</small></span>`+
    (un?`<span class="dun">${un}</span>`:'<span></span>')+`<b>${x.s}<small>очк.</small></b>`+(me?'<i></i>':`<button class="dstar${fr?' on':''}" data-star="${drvEsc(x.n)}" aria-label="${fr?'Убрать из друзей':'В друзья'}">${fr?'★':'☆'}</button>`)+'</li>'; }
function drvMine(){ return {n:DRV.nick,av:DRV.av,s:drvScore(),k:DRV.kills,m:Object.keys(DRV.medals).length,t:UP.tank,seen:Date.now()}; }
function drvList(){ const L=(DRV.cache.top||[]).map(x=>x.n===DRV.nick?drvMine():x); if(!L.some(x=>x.n===DRV.nick)) L.push(drvMine()); return L.sort((a,b)=>b.s-a.s); }
function drvRender(bg){ const B=$('#drvBody');
  const L=drvList(), place=L.findIndex(x=>x.n===DRV.nick)+1, un=Object.values(DRV.unread).reduce((a,b)=>a+b,0), mc=Object.keys(DRV.medals).length;
  document.querySelectorAll('.drvTabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===DRVUI.tab)); const bd=$('#drvBadge'); bd.hidden=!un; bd.textContent=un;
  $('#drvMe').innerHTML=`<span class="av big">${avSvg(DRV.av)}</span><span class="nm">${drvEsc(DRV.nick)}<small>${drvEsc(RANKS[MS.rank]||'')}</small></span>`+
    `<span class="dme"><span><b>${drvScore()}</b>очков</span><span><b>${place?place:'—'}</b>место</span><span><b>${mc}</b>медалей</span></span><span class="dgo">›</span>`;
  const card=DRVUI.view==='card'; $('.drvTabs').hidden=card; $('#drvMe').hidden=card;
  if(!card){ drvTkStop(); $('#drvCard').hidden=true; B.hidden=false; if(bg&&B.contains(document.activeElement)) return; const now=(DRV.cache.top&&DRV.cache.topNow)||Date.now();
    if(DRVUI.view==='news'){ const st=B.scrollTop, end=B.scrollHeight-B.clientHeight-st<30; B.innerHTML=drvNewsHtml(); B.scrollTop=bg&&!end?st:B.scrollHeight; return; }
    if(DRVUI.view==='fr'){ const idx=new Map(L.map((x,i)=>[x.n,i])); const F=DRV.friends.map(n=>L.find(y=>y.n===n)||{n,av:(DRV.cache.cards[n]||{}).av|0,s:0,k:0,m:0,t:''});
      B.innerHTML=F.length?'<ol class="drvL">'+F.map(x=>drvRow(x,idx.has(x.n)?idx.get(x.n):-1,now)).join('')+'</ol>':'<div class="dempty"><b>☆</b><p>Здесь будут друзья. Нажми ☆ у пилота в рейтинге — ему можно будет писать и отправлять лом.</p></div>'; }
    else B.innerHTML='<p class="dhint">Очки = уничтоженные роботы + 50 за каждую медаль</p>'+(DRV.cache.top?'':'<p class="drvMsg">Подтягиваю рейтинг…</p>')+'<ol class="drvL">'+L.map((x,i)=>drvRow(x,i,now)).join('')+'</ol>';
    return; }
  B.hidden=true; $('#drvCard').hidden=false; drvCardRender(); }

/* ---- news feed (v30.6): fetched in the background, kept in the cache, drawn instantly ---- */
async function drvNews(){ const r=await drvCall('news',{}); if(!r.ok||!Array.isArray(r.news)) return; const C=DRV.cache;
  const sig=JSON.stringify(r.news), was=JSON.stringify(C.news); C.news=r.news; C.newsT=Date.now(); C.newsNow=r.now;
  for(const id of Object.keys(C.nv)) if(!r.news.some(n=>n.id===id)) delete C.nv[id];
  drvSave(); if(sig!==was&&!$('#drivers').hidden&&DRVUI.view==='news') drvRender(true); }
async function drvVote(id,v){ const n=(DRV.cache.news||[]).find(x=>x.id===id); if(!n) return; const C=DRV.cache, old=C.nv[id]|0, nv=old===v?0:v;
  if(old===1) n.up--; if(old===-1) n.down--; if(nv===1) n.up++; if(nv===-1) n.down++; if(nv) C.nv[id]=nv; else delete C.nv[id];
  sfxClick(); drvSave(); drvNewsVotes(id);
  const r=await drvCall('vote',{id,v:nv},true); if(r.ok){ n.up=r.up; n.down=r.down; if(r.my) C.nv[id]=r.my; else delete C.nv[id]; drvSave(); drvNewsVotes(id); }
  else drvMsg(DRV_ERR[r.err]||'Голос не засчитан — нет связи.',true); }
function drvVoteBtns(n){ const my=DRV.cache.nv[n.id]|0;
  return `<button class="dv up${my===1?' on':''}" data-vote="1" data-nid="${drvEsc(n.id)}" aria-label="Нравится">${THUMB_SVG}<b>${Math.max(0,n.up|0)}</b></button>`+
    `<button class="dv dn${my===-1?' on':''}" data-vote="-1" data-nid="${drvEsc(n.id)}" aria-label="Не нравится">${THUMB_SVG}<b>${Math.max(0,n.down|0)}</b></button>`; }
function drvNewsVotes(id){ const el=document.querySelector(`.dnw[data-nid="${CSS.escape(id)}"] .dvs`), n=(DRV.cache.news||[]).find(x=>x.id===id); if(el&&n) el.innerHTML=drvVoteBtns(n); }
const THUMB_SVG='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 10v11H3V10z"/><path d="M7 10l4-8a3 3 0 0 1 3 3v4h6a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.6 21H7"/></svg>';
function drvNewsHtml(){ const L=DRV.cache.news;
  if(!L) return '<div class="dempty"><b>✦</b><p>Здесь будут новости игры: обновления, события, планы.</p></div>';
  if(!L.length) return '<div class="dempty"><b>✦</b><p>Новостей пока нет.</p></div>';
  let h='<div class="dnews">', day='';
  for(const n of L){ const d=new Date(n.t), dl=d.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:d.getFullYear()===new Date().getFullYear()?undefined:'numeric'});
    if(dl!==day){ day=dl; h+=`<div class="dday">${dl}</div>`; }
    h+=`<article class="dnw" data-nid="${drvEsc(n.id)}"><h4>${drvEsc(n.title)}</h4>${n.text?`<p>${drvEsc(n.text).replace(/\n/g,'<br>')}</p>`:''}`+
      `<footer><small>${d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</small><span class="dvs">${drvVoteBtns(n)}</span></footer></article>`; }
  return h+'</div>'; }

/* the card */
function drvCardData(who){ if(who===DRV.nick) return {nick:DRV.nick,av:DRV.av,kills:DRV.kills,kbt:DRV.kbt,deaths:DRV.deaths,med:Object.keys(DRV.medals),tank:UP.tank,tlv:drvTlv(),rank:MS.rank,me:true};
  return DRV.cache.cards[who]||null; }
/* how far along a count-based medal is (own card only) */
function medProg(id){ const k=DRV.kbt, s=DRV.st, n=Object.keys(UP.tanks||{}).length;
  const P={k100:[DRV.kills,100],k1000:[DRV.kills,1000],k5000:[DRV.kills,5000],ram:[s.ram,25],drones:[k.drone|0,30],katok:[k.katok|0,10],rescue:[s.civ,20],flags:[s.flag,3],streak:[DRV.streak,10],
    team:[DRV.friends.length,3],radio:[s.msg,10],gift:[s.gift,1000],fleet:[n,CH_ORDER.length],all4:[['krot','hornet','dragon','crypt'].filter(b=>DRV.medals[b]).length,4]};
  return P[id]||null; }
function drvCardRender(){ const who=DRVUI.who, r=drvCardData(who), H=$('#drvCH'), C=$('#drvCI'); const fr=DRV.friends.includes(who), me=who===DRV.nick;
  const top=(DRV.cache.top||[]).find(x=>x.n===who), on=me||drvOnline(r||top,r&&r.now);
  $('#drvBack').textContent=DRVUI.tab==='fr'?'‹ Друзья':DRVUI.tab==='news'?'‹ Новости':'‹ Рейтинг';
  if(!r){ H.innerHTML=`<span class="av big">${avSvg(top?top.av:0)}</span><span class="nm">${drvEsc(who)}<small>загружаю карточку…</small></span>`; C.innerHTML=''; $('#drvCA').innerHTML=''; DRVUI.caKey=''; drvTkShow(top&&top.t,null); return; }
  H.innerHTML=`<span class="av big">${avSvg(r.av)}${on?'<i class="on"></i>':''}</span><span class="nm">${drvEsc(r.nick)}<small>${drvEsc(RANKS[r.rank]||'')}${me?' · это ты':' · '+drvAgo(r.seen,r.now)}</small></span>`+(me?'':`<button class="dstar big${fr?' on':''}" data-star="${drvEsc(who)}" aria-label="${fr?'Убрать из друзей':'В друзья'}">${fr?'★':'☆'}</button>`);
  $('#drvTkN').textContent=r.tank?drvTank(r.tank):'машина не выбрана'; drvTkShow(r.tank,r.tlv);
  const med=new Set(r.med||[]), kb=Object.keys(r.kbt||{}).filter(k=>r.kbt[k]>0).sort((a,b)=>r.kbt[b]-r.kbt[a]);
  let h=`<div class="dstat"><span><b>${r.kills|0}</b>роботов</span><span><b>${r.deaths|0}</b>раз подбит</span><span><b>${(r.kills|0)+50*med.size}</b>очков</span></div>`;
  if(kb.length) h+='<div class="dkbt">'+kb.map(k=>`<span>${drvEsc(drvEName(k))} <b>${r.kbt[k]}</b></span>`).join('')+'</div>';
  const ML=me?MEDALS:MEDALS.filter(m=>med.has(m[0]));
  h+=`<div class="dsec">Медали <small>${med.size} из ${MEDALS.length}</small></div>`;
  h+=ML.length?'<div class="dmed">'+ML.map(m=>`<button class="${med.has(m[0])?'on':''}${DRVUI.med===m[0]?' sel':''}" data-med="${m[0]}" aria-label="${drvEsc(m[1])}">${medSvg(m[0])}</button>`).join('')+'</div>':'<p class="drvMsg">Медалей пока нет.</p>';
  const sm=MEDALS.find(m=>m[0]===DRVUI.med), pg=sm&&me&&!med.has(sm[0])?medProg(sm[0]):null;
  h+=`<div class="dmedTx">${sm?`<b>${drvEsc(sm[1])}</b>${med.has(sm[0])?' <i class="ok">получена</i>':''}<span>${drvEsc(sm[2])}</span>${pg?`<span class="dprog"><i style="width:${Math.min(100,Math.round(100*pg[0]/pg[1]))}%"></i><small>${Math.min(pg[0],pg[1])} / ${pg[1]}</small></span>`:''}`:'<span>Нажми на медаль, чтобы узнать, как её получить.</span>'}</div>`;
  if(me) h+='<div class="dsec">Аватарка</div><div class="davs">'+AVATARS.map((a,i)=>`<button class="dav${i===DRV.av?' on':''}" data-av="${i}" aria-label="${a[0]}" title="${a[0]}">${avSvg(i)}</button>`).join('')+'</div>';
  C.innerHTML=h; drvActions(r,me,fr); }

/* actions under the card: built once per (pilot, friendship, pane) so typing is never interrupted */
const SEND_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5z"/></svg>';
function drvActions(r,me,fr){ const A=$('#drvCA'), key=`${DRVUI.who}|${me}|${fr}|${DRVUI.pane}`;
  if(key!==DRVUI.caKey){ DRVUI.caKey=key;
    if(me){ A.innerHTML=''; return; }
    if(!fr){ A.innerHTML=`<div class="dcta"><button class="go" data-star="${drvEsc(DRVUI.who)}">☆ Добавить в друзья</button><small>Друзьям можно писать сообщения и отправлять лом.</small></div>`; return; }
    const mx=Math.max(10,Math.min(1000,Math.floor(ST.scrap))), a=Math.max(10,Math.min(mx,DRVUI.amt|0));
    A.innerHTML=`<div class="seg dpane"><button data-pane="chat" class="${DRVUI.pane==='chat'?'on':''}">Чат</button><button data-pane="gift" class="${DRVUI.pane==='gift'?'on':''}">Отправить лом</button></div>`+
      (DRVUI.pane==='chat'
        ?`<div class="dchat" id="drvChat"></div><small class="dnote7">Переписка хранится 7 дней</small><div class="dbar"><input id="drvTxt" maxlength="50" autocomplete="off" placeholder="Сообщение…" value="${drvEsc(DRVUI.txt)}" aria-label="Сообщение"><small id="drvCnt">${DRVUI.txt.length}/50</small><button class="dsendB" data-say aria-label="Отправить">${SEND_SVG}</button></div>`
        :`<div class="dgiftP"><div class="dq">${[50,100,250,500].map(v=>`<button data-q5="${v}"${v>ST.scrap?' disabled':''}>${v}</button>`).join('')}</div><div class="dgift"><input type="range" id="drvAmt" min="10" max="${mx}" step="10" value="${a}" aria-label="Сколько лома"><input type="number" id="drvAmtN" min="10" max="${mx}" value="${a}" inputmode="numeric" aria-label="Сколько лома"></div>`+
         `<button class="go" data-gift>Отправить <span id="drvAmtB">${a}</span> лома</button><small>У тебя ${Math.floor(ST.scrap)} лома · до 5 посылок в сутки · друг получит сразу</small></div>`);
    DRVUI.seen=new Set(); }
  if(DRVUI.pane==='chat'&&fr&&!me) drvChatSync(); }
function drvChatSync(){ const box=$('#drvChat'); if(!box) return; const c=DRV.cache.cards[DRVUI.who], log=(c&&c.log)||[], near=box.scrollHeight-box.scrollTop-box.clientHeight<40||!box.childElementCount;
  if(!log.length){ box.innerHTML='<p class="dempty1">Сообщений пока нет — напиши первым.</p>'; return; }
  let day='', h='';
  for(const m of log){ const d=new Date(m.time), dl=d.toLocaleDateString('ru-RU',{day:'numeric',month:'long'}), k=m.k||(m.time+'|'+m.kind+'|'+m.text+'|'+m.amount);
    if(dl!==day){ day=dl; h+=`<div class="dday">${dl}</div>`; }
    const fresh=!DRVUI.seen.has(k); DRVUI.seen.add(k);
    const st=m.st==='pend'?'<i class="dst">◷</i>':m.st==='err'?'<i class="dst err">!</i>':m.out?'<i class="dst">✓</i>':'';
    h+=`<div class="dmsg ${m.out?'out':'in'}${m.kind==='scrap'?' gift':''}${m.st?' '+m.st:''}${fresh?' fresh':''}">${m.kind==='scrap'?`<b>⬢ ${m.amount} лома</b>`:drvEsc(m.text)}<small>${d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}${st}</small></div>`; }
  box.innerHTML=h; if(near) box.scrollTop=box.scrollHeight; }

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
function drvNote(head,body,opt){ const box=$('#drvNotes'), el=document.createElement('div'); el.className='dnote'; el.innerHTML='<div class="dnH"></div><div class="dnB"></div>';
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
  /* swipe any way → a glitchy fly-out in that direction; a tap on a message → reply */
  const reply=opt&&opt.reply; if(reply) el.classList.add('rep');
  let x0=null, y0=0, dx=0, dy=0; el.addEventListener('pointerdown',e=>{ e.stopPropagation(); x0=e.clientX; y0=e.clientY; dx=dy=0; try{ el.setPointerCapture(e.pointerId); }catch(_){ /* old browsers */ } el.style.transition='none'; });
  el.addEventListener('pointermove',e=>{ if(x0==null) return; dx=e.clientX-x0; dy=e.clientY-y0; el.style.transform=`translate(${dx}px,${dy}px) rotate(${dx*0.03}deg)`; el.style.opacity=String(Math.max(0.25,1-Math.hypot(dx,dy)/200)); });
  const up=()=>{ if(x0==null) return; x0=null; el.style.transition=''; const d=Math.hypot(dx,dy);
    if(d>45){ swipeOut(dx/d,dy/d); return; }
    el.style.transform=''; el.style.opacity=''; if(d<8&&reply&&phase!=='gone'){ drvReplyOpen(reply); swipeOut(0,-1,true); } };
  const swipeOut=(ux,uy,quiet)=>{ if(phase==='gone') return; if(iv) clearInterval(iv); iv=0; phase='gone';
    el.style.setProperty('--sx',(ux*140)+'%'); el.style.setProperty('--sy',(uy*220)+'%'); el.style.transform=''; el.style.opacity=''; el.classList.remove('glitch'); el.classList.add('swipe');
    let n=0; const sc=setInterval(()=>{ for(const l of L) l.n.textContent=l.t.map(c=>c===' '||Math.random()<n/8?' ':glyph()).join(''); if(++n>8) clearInterval(sc); },35);
    if(!quiet){ sNz(0.22,'bandpass',2400,0.6,0.08); sO(900,180,0.18,0.05,'sawtooth'); } setTimeout(()=>el.remove(),380); };
  el.addEventListener('pointerup',up); el.addEventListener('pointercancel',up);
  return el; }

/* ---- quick reply from a note; a solo game pauses while the box is open (not in co-op) ---- */
function drvReplyOpen(who){ const R=$('#drvReply'); R.dataset.who=who; $('#drvRepTo').textContent=who; $('#drvRepTx').value=''; $('#drvRepCnt').textContent='0/50'; $('#drvRepMsg').textContent=''; R.hidden=false;
  PAUSED=!LB.inGame; setTimeout(()=>$('#drvRepTx').focus(),30); sfxClick(); }
function drvReplyClose(){ $('#drvReply').hidden=true; PAUSED=false; if(document.activeElement) document.activeElement.blur(); canvas.focus(); }
async function drvReplySend(){ const R=$('#drvReply'), who=R.dataset.who, t=$('#drvRepTx').value.replace(/\s+/g,' ').trim(); if(!t) return; const b=$('#drvRepGo'); b.disabled=true; $('#drvRepMsg').textContent='Отправляю…';
  if(!DRV.friends.includes(who)){ const f=await drvCall('friend',{who,on:'1'},true); if(f.ok){ DRV.friends=f.friends; medalsCheck(); } }
  const r=await drvCall('send',{to:who,kind:'msg',text:t.slice(0,50)},true); b.disabled=false;
  if(!r.ok){ $('#drvRepMsg').textContent=drvErr(r); return; }
  const c=DRV.cache.cards[who]; if(c){ c.log=c.log||[]; c.log.push({out:true,kind:'msg',text:r.text||t,amount:0,time:Date.now()}); }
  DRV.st.msg++; medalsCheck(); drvSave(); sfxBuy(); drvReplyClose(); toast(r.muted?'Ответ ушёл, но мат скрыт · сообщения закрыты на 24 ч':'Ответ ушёл к '+r.to); }
$('#drvRepGo').addEventListener('click',e=>{ e.stopPropagation(); drvReplySend(); });
$('#drvRepX').addEventListener('click',e=>{ e.stopPropagation(); drvReplyClose(); });
$('#drvRepTx').addEventListener('input',e=>{ $('#drvRepCnt').textContent=e.target.value.length+'/50'; });
$('#drvRepTx').addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter'){ e.preventDefault(); drvReplySend(); } if(e.key==='Escape') drvReplyClose(); });
$('#drvReply').addEventListener('pointerdown',e=>e.stopPropagation());

/* ---- events ---- */
$('#drvClose').addEventListener('click',e=>{ e.stopPropagation(); drvClose(); });
$('#bDrv').addEventListener('click',e=>{ e.stopPropagation(); sfxClick(); drvOpen(); });
$('#bDrv2').addEventListener('click',e=>{ e.stopPropagation(); sfxClick(); drvOpen(); });
$('#drvRegGo').addEventListener('click',e=>{ e.stopPropagation(); drvAuth(DRVUI.mode==='reg'?'reg':'login'); });
$('#drvLogGo').addEventListener('click',e=>{ e.stopPropagation(); sfxClick(); DRVUI.mode=DRVUI.mode==='reg'?'login':'reg'; drvMsg(''); drvRegRender(); drvAnim($('#drvReg')); });
$('#drvPin').addEventListener('input',e=>{ e.target.value=e.target.value.replace(/\D/g,'').slice(0,4); });
$('#drvMe').addEventListener('click',e=>{ e.stopPropagation(); sfxClick(); drvCardOpen(DRV.nick); });
$('#drvBack').addEventListener('click',e=>{ e.stopPropagation(); sfxClick(); DRVUI.view=DRVUI.tab; drvMsg(''); drvRender(); drvAnim($('#drvBody')); });
document.querySelectorAll('.drvTabs button').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); sfxClick(); drvTab(b.dataset.t); }));
async function drvStar(who){ const on=!DRV.friends.includes(who); DRV.friends=on?DRV.friends.concat(who):DRV.friends.filter(n=>n!==who); drvSave(); drvRender(true); sfxClick();
  const r=await drvCall('friend',{who,on:on?'1':'0'},true); if(r.ok){ DRV.friends=r.friends; medalsCheck(); drvSave(); if(on) drvCardFetch(who,true); } else { drvMsg(DRV_ERR[r.err]||'Не получилось',true); DRV.friends=on?DRV.friends.filter(n=>n!==who):DRV.friends.concat(who); }
  drvRender(true); }
/* sending is optimistic: the bubble shows up at once («◷»), then turns into «✓» or «!» */
async function drvSend(kind){ const who=DRVUI.who; let p;
  if(kind==='scrap'){ const n=Math.floor(+$('#drvAmtN').value||0); if(n<10) return drvMsg('Минимум 10 лома.',true); if(n>ST.scrap) return drvMsg('Не хватает лома.',true); p={to:who,kind,amount:n}; }
  else { const inp=$('#drvTxt'), t=inp.value.replace(/\s+/g,' ').trim(); if(!t) return; p={to:who,kind,text:t.slice(0,50)}; inp.value=''; DRVUI.txt=''; $('#drvCnt').textContent='0/50'; inp.focus(); }
  const c=DRV.cache.cards[who]||(DRV.cache.cards[who]={nick:who,log:[],t:0}); c.log=c.log||[];
  const m={out:true,kind,text:p.text||'',amount:p.amount||0,time:Date.now(),st:'pend',k:'l'+Date.now()+Math.random()}; c.log.push(m);
  if(kind==='scrap'){ ST.scrap-=p.amount; save(); DRVUI.pane='chat'; DRVUI.caKey=''; drvCardRender(); } else drvChatSync(); sfxClick();
  const r=await drvCall('send',p,true);
  if(!r.ok){ m.st='err'; if(kind==='scrap'){ ST.scrap+=p.amount; save(); } drvMsg(drvErr(r),true); drvChatSync(); return; }
  m.st=''; if(r.text) m.text=r.text;
  if(kind==='scrap'){ DRV.st.gift+=p.amount; drvMsg(`Отправлено ${r.to}: ${p.amount} лома. Посылок сегодня ещё можно: ${r.left}.`); }
  else { DRV.st.msg++; drvMsg(r.muted?'Запрещённые слова заменены символами. Писать снова можно через 24 часа.':'',!!r.muted); }
  medalsCheck(); drvSave(); sfxBuy(); drvChatSync(); }
function drvAmt(v){ const s=$('#drvAmt'), n=$('#drvAmtN'); if(!s) return; v=Math.max(10,Math.min(+s.max,Math.floor(+v||0))); DRVUI.amt=v; s.value=String(v); if(document.activeElement!==n) n.value=String(v); $('#drvAmtB').textContent=v; }
$('#drivers').addEventListener('click',e=>{ const b=e.target.closest('button,li[data-who]'); if(!b||!$('#drivers').contains(b)) return; e.stopPropagation();
  if(b.dataset.star){ drvStar(b.dataset.star); return; }
  if(b.dataset.vote){ drvVote(b.dataset.nid,+b.dataset.vote); return; }
  if(b.dataset.av!=null){ DRV.av=+b.dataset.av; DRV.dirty=true; DRV.syncT=Math.min(DRV.syncT,1); drvSave(); sfxClick(); if(DRV.nick) drvRender(); else drvRegRender(); return; }
  if(b.dataset.med){ DRVUI.med=DRVUI.med===b.dataset.med?'':b.dataset.med; sfxClick(); drvCardRender(); return; }
  if(b.dataset.pane){ DRVUI.pane=b.dataset.pane; sfxClick(); drvCardRender(); drvAnim($('#drvCA')); return; }
  if(b.dataset.q5){ drvAmt(b.dataset.q5); sfxClick(); return; }
  if(b.dataset.gift!=null){ drvSend('scrap'); return; } if(b.dataset.say!=null){ drvSend('msg'); return; }
  if(b.dataset.who){ sfxClick(); drvCardOpen(b.dataset.who); } });
$('#drivers').addEventListener('input',e=>{ const t=e.target;
  if(t.id==='drvAmt'||t.id==='drvAmtN') drvAmt(t.value);
  if(t.id==='drvTxt'){ DRVUI.txt=t.value; const c=$('#drvCnt'); if(c) c.textContent=t.value.length+'/50'; } });
$('#drivers').addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.target.id==='drvTxt'){ e.preventDefault(); drvSend('msg'); } });
drvLoad();
