/* ================= v29.3: «Водители» — рекорды, вызовы, посылки, карточка, медали =================
   Сервер — веб-приложение Apps Script при Google Таблице (server/sheets), клиент — window.SHT_SHEETS (src/net/sheets.js).
   Состояние DRV объявлено в 10-economy.js. Без сети игра не страдает: результаты ждут в очереди DRV.q. */
const DRV_BOSS={krot:'Крот',hornet:'Шершень',dragon:'Дракон',crypt:'Энергобот'}, DRV_BOSSES=['krot','hornet','dragon','crypt'];
const DRV_PRIZE=300, DRV_POLL=120;
const DRV_KIND={scrap:'лом',rep:'ремкомплект',ammo:'ящик патронов'};
const MEDALS=[['first','Первая победа','одолеть любого босса'],['all4','Охотник','одолеть всех четырёх боссов'],['clean','Без царапины','одолеть босса, потеряв меньше 10% брони'],
  ['fast','Молния','одолеть босса быстрее 90 с'],['shadow','Тихая смерть','одолеть босса на «Тени»'],['arty','Артиллерист','одолеть босса на РСЗО-537'],
  ['fleet','Автопарк','собрать все 7 машин'],['post','Почтальон','отправить 5 посылок'],['duel','Дуэлянт','побить чужой вызов'],['major','Майор','дослужиться до майора']];
const DRV_ERR={net:'Нет связи с сервером. Проверь интернет.',nourl:'Сервер «Водителей» ещё не подключён.',auth:'Сервер не узнал тебя. Попробуй заново выбрать позывной.',nick:'Позывной: 2–16 символов, буквы, цифры, пробел, _ - .',
  nick_taken:'Этот позывной уже занят.',no_nick:'Нет водителя с таким позывным.',self:'Себе посылку не отправить.',limit:'Лимит на сегодня исчерпан.',bad:'Сервер отклонил запрос.',server:'Ошибка на сервере. Попробуй позже.',own:'Это твой вызов.',no_challenge:'Вызов не найден.'};
const drvEsc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const drvTime=s=>{ s=Math.max(0,+s||0); const m=Math.floor(s/60), r=Math.round((s-m*60)*10)/10; return m+':'+(r<10?'0':'')+r.toFixed(1); };
const drvTank=id=>(CHASSIS[id]&&CHASSIS[id].name)||id||'—';
function drvLoad(){ try{ const d=JSON.parse(localStorage.getItem(DRV_KEY)||'null'); if(d) for(const k of ['id','key','nick','q','acc','sent','wins','medals','best','seenBeaten','lastCard']) if(d[k]!=null) DRV[k]=d[k]; }catch(_){ /* приватный режим */ } }
function drvSave(){ try{ const o={}; for(const k of ['id','key','nick','q','acc','sent','wins','medals','best','seenBeaten','lastCard']) o[k]=DRV[k]; localStorage.setItem(DRV_KEY,JSON.stringify(o)); }catch(_){ /* приватный режим */ } }
function drvRand(n){ const a=new Uint8Array(n); crypto.getRandomValues(a); return Array.from(a,b=>'abcdefghijklmnopqrstuvwxyz0123456789'[b%36]).join(''); }
function drvApi(){ return window.SHT_SHEETS||null; }
async function drvCall(a,p,auth){ const S=drvApi(); if(!S) return {ok:false,err:'nourl'}; const q=Object.assign({},p||{}); if(auth){ if(!DRV.nick) return {ok:false,err:'auth'}; q.id=DRV.id; q.key=DRV.key; } return S.call(a,q); }
const drvOn=()=>!!(drvApi()&&drvApi().url());

/* ---- medals ---- */
function medalGive(id){ if(DRV.medals[id]) return; DRV.medals[id]=Date.now(); drvSave(); const m=MEDALS.find(x=>x[0]===id); if(m){ radioSay(`Медаль «${m[1]}» — ${m[2]}.`); toast('Медаль: '+m[1]); sfxBuy(); } }
function medalsCheck(){ if(Object.keys(UP.tanks||{}).length>=CH_ORDER.length) medalGive('fleet'); if(MS.rank>=RANKS.indexOf('Майор')) medalGive('major'); if(DRV.sent>=5) medalGive('post'); if(DRV.wins>0) medalGive('duel');
  if(DRV_BOSSES.every(b=>DRV.best[b])) medalGive('all4'); }

/* ---- queue: results wait here until the player has a call sign and the network works ---- */
function drvQueue(a,p){ DRV.q.push({a,p}); if(DRV.q.length>30) DRV.q.shift(); drvSave(); }
async function drvFlush(){ if(DRV.busy||!DRV.nick||!DRV.q.length||!drvOn()) return; DRV.busy=true;
  try{ while(DRV.q.length){ const it=DRV.q[0], r=await drvCall(it.a,it.p,true); if(!r.ok&&(r.err==='net'||r.err==='nourl')) break; DRV.q.shift(); drvSave(); if(r.ok&&it.a==='rec') drvRecReply(it.p,r); } }
  finally{ DRV.busy=false; } }
function drvRecReply(p,r){ if(r.best) toast(`Рекорд: ${DRV_BOSS[p.boss]} ${drvTime(p.secs)}${r.place?` · ${r.place}-е место`:''}`); }

/* ---- boss fights: timer, hits taken, kills, result ---- */
function drvTick(dt){ const e=BOSS.e;
  if(e&&!e.dead&&!transit&&!LOC.safe){ const f=DRV.fight&&DRV.fight.e===e?DRV.fight:(DRV.fight={e,t:0,hp:TK.hp,lost:0,kills:DRV.kills,max:maxHP()}); f.t+=dt; if(TK.hp<f.hp) f.lost+=f.hp-TK.hp; f.hp=TK.hp; }
  if(LOC.safe&&DRV.dbg){ DRV.dbg=false; }
  drvGiftsTick();
  if(!drvOn()) return;
  DRV.flushT-=dt; if(DRV.flushT<=0){ DRV.flushT=30; drvFlush(); }
  if(!DRV.nick) return;
  DRV.pollT-=dt; if(DRV.pollT<=0){ DRV.pollT=DRV_POLL; drvPoll(); }
  DRV.cardT-=dt; if(DRV.cardT<=0){ DRV.cardT=60; drvCardPush(); } }
function drvBossWin(e){ const f=DRV.fight&&DRV.fight.e===e?DRV.fight:null; DRV.fight=null; if(DRV.dbg){ DRV.dbg=false; return; } if(!f||!DRV_BOSS[e.type]) return;
  const secs=Math.round(f.t*10)/10, boss=e.type, tank=UP.tank, prev=DRV.best[boss];
  if(!prev||secs<prev.secs) DRV.best[boss]={secs,tank}; drvSave();
  medalGive('first'); if(f.lost<f.max*0.1) medalGive('clean'); if(secs<90) medalGive('fast'); if(tank==='ten') medalGive('shadow'); if(tank==='rszo') medalGive('arty'); medalsCheck();
  const p={boss,tank,secs,kills:DRV.kills-f.kills,rank:MS.rank,ver:'29.3'}; drvQueue('rec',p);
  for(const cid of Object.keys(DRV.acc)){ const c=DRV.acc[cid]; if(c.boss===boss&&secs<c.secs) drvQueue('chTry',{cid,boss,secs,tank}); }
  drvOffer(boss,secs,tank); drvFlush().then(drvChecks); }
async function drvChecks(){ /* challenge attempts were sent by drvFlush; ask the server who won */ if(!DRV.nick) return; const r=await drvCall('chList',{id:DRV.id}); if(!r.ok) return;
  for(const c of r.list){ const a=DRV.acc[c.cid]; if(a&&c.status==='beaten'){ delete DRV.acc[c.cid]; if(c.winner===DRV.nick){ DRV.wins++; ST.scrap+=DRV_PRIZE; save(); radioSay(`Вызов от ${c.from} побит: ${DRV_BOSS[c.boss]} за ${drvTime(c.winnerSecs)}. Награда — ${DRV_PRIZE} лома.`); toast(`Вызов побит! +${DRV_PRIZE} лома`); sfxBuy(); medalGive('duel'); } }
    if(c.mine&&c.status==='beaten'&&!DRV.seenBeaten[c.cid]){ DRV.seenBeaten[c.cid]=1; radioSay(`${c.winner} побил твой вызов: ${DRV_BOSS[c.boss]} за ${drvTime(c.winnerSecs)} (у тебя ${drvTime(c.secs)}).`); } }
  for(const cid of Object.keys(DRV.acc)) if(!r.list.some(c=>c.cid===cid)) delete DRV.acc[cid];
  drvSave(); }
let drvOfferT=null, drvOfferP=null;
function drvOffer(boss,secs,tank){ drvOfferP={boss,secs,tank}; const el=$('#drvOffer'); $('#drvOfferTx').textContent=DRV.nick?`${DRV_BOSS[boss]} за ${drvTime(secs)} на «${drvTank(tank)}». Бросить вызов друзьям?`:`${DRV_BOSS[boss]} за ${drvTime(secs)}. Выбери позывной в меню «Водители» — результат попадёт в рейтинг.`;
  $('#drvOfferGo').textContent=DRV.nick?'Бросить вызов':'Водители'; el.hidden=false; clearTimeout(drvOfferT); drvOfferT=setTimeout(()=>{ el.hidden=true; },16000); }
$('#drvOfferX').addEventListener('click',e=>{ e.stopPropagation(); $('#drvOffer').hidden=true; });
$('#drvOfferGo').addEventListener('click',async e=>{ e.stopPropagation(); $('#drvOffer').hidden=true; if(!DRV.nick){ drvOpen(); return; } const p=drvOfferP; if(!p) return;
  const r=await drvCall('chNew',p,true); toast(r.ok?`Вызов брошен: ${DRV_BOSS[p.boss]} ${drvTime(p.secs)}`:(DRV_ERR[r.err]||'Не получилось')); });

/* ---- parcels: poll the inbox, deliver by parachute crate (or straight away in camp) ---- */
async function drvPoll(){ const r=await drvCall('inbox',{},true); if(r.ok&&r.parcels&&r.parcels.length) for(const g of r.parcels) drvGift(g); drvChecks(); }
function drvGiftApply(g){ if(g.kind==='scrap') ST.scrap+=g.amount; else { const k=g.kind; if((ST.kits[k]||0)<KIT_MAX) ST.kits[k]=(ST.kits[k]||0)+1; else ST.scrap+=KIT_COST[k]; } save(); kitsHud();
  const what=g.kind==='scrap'?`${g.amount} лома`:DRV_KIND[g.kind]; popText(TK.x,TK.y+2.6,TK.z,'+ '+what,'heal'); sfxPickup(1); }
function drvGift(g){ const what=g.kind==='scrap'?`${g.amount} лома`:DRV_KIND[g.kind];
  const p=!LOC.safe&&!transit&&!TK.dead?dropSpot():null;
  if(!p){ drvGiftApply(g); radioSay(`Посылка от ${g.from}: ${what}.`); toast(`Посылка от ${g.from}: ${what}`); return; }
  const c=crateSpawn(p,g); DRV.gifts.push({c,g,done:false}); radioSay(`${g.from} прислал посылку: ${what}. Ящик садится рядом — подъедь.`); toast(`Посылка от ${g.from} садится · подъедь к ней`); }
function drvGiftsTick(){ for(let i=DRV.gifts.length-1;i>=0;i--){ const it=DRV.gifts[i]; if(it.done){ DRV.gifts.splice(i,1); continue; } if(!CRATES.includes(it.c)||it.c.state==='spent'||it.c.state==='give'){ if(!it.c.given) drvGiftApply(it.g); it.done=true; } } }

/* ---- driver card: pushed when it changes ---- */
function drvCard(){ const tanks={}; for(const id of Object.keys(UP.tanks||{})){ const u=id===UP.tank?UP:((UP.per&&UP.per[id])||perDefault(id)); tanks[id]={e:u.engine|0,a:u.armor|0,s:u.stab|0,am:u.ammo|0,ab:u.abl|0,c:u.cal|0,l:u.load|0,rk:u.rk|0,mg:u.mg}; }
  return {v:1,tank:UP.tank,tanks,best:DRV.best,medals:Object.keys(DRV.medals)}; }
async function drvCardPush(){ medalsCheck(); const c=JSON.stringify(drvCard()), sig=c+'|'+MS.rank+'|'+MS.i; if(sig===DRV.lastCard) return; const r=await drvCall('card',{card:c,rank:MS.rank,missions:MS.i},true); if(r.ok){ DRV.lastCard=sig; drvSave(); } }

/* ---- dialog ---- */
const DRVUI={tab:'top',boss:'krot',top:null,ch:null,card:null,find:'',to:''};
function drvMsg(s,err){ const m=$('#drvMsg'); m.textContent=s||''; m.classList.toggle('err',!!err); }
function drvOpen(){ $('#drivers').hidden=false; drvMsg(''); if(!drvOn()){ $('#drvReg').hidden=true; $('#drvMain').hidden=true; drvMsg(DRV_ERR.nourl+' Инструкция — server/sheets/README.md.',true); return; }
  if(!DRV.nick){ $('#drvReg').hidden=false; $('#drvMain').hidden=true; $('#drvNick').value=''; return; } $('#drvReg').hidden=true; $('#drvMain').hidden=false; drvTab(DRVUI.tab); }
function drvClose(){ $('#drivers').hidden=true; }
$('#drvClose').addEventListener('click',e=>{ e.stopPropagation(); drvClose(); });
$('#bDrv').addEventListener('click',e=>{ e.stopPropagation(); sfxClick(); drvOpen(); });
$('#bDrv2').addEventListener('click',e=>{ e.stopPropagation(); sfxClick(); drvOpen(); });
$('#drvRegGo').addEventListener('click',async e=>{ e.stopPropagation(); const nick=$('#drvNick').value.trim(); if(!nick) return; const b=$('#drvRegGo'); b.disabled=true; drvMsg('Регистрирую…');
  if(!DRV.id){ DRV.id='d'+drvRand(15); DRV.key=drvRand(24); }
  const r=await drvCall('reg',{id:DRV.id,key:DRV.key,nick}); b.disabled=false;
  if(!r.ok){ drvMsg(DRV_ERR[r.err]||'Не получилось',true); return; } DRV.nick=r.nick; DRV.lastCard=''; DRV.cardT=0.5; DRV.pollT=2; drvSave(); drvMsg('Позывной «'+DRV.nick+'» записан.'); drvFlush(); drvOpen(); });
document.querySelectorAll('.drvTabs button').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); sfxClick(); drvTab(b.dataset.t); }));
async function drvTab(t){ DRVUI.tab=t; document.querySelectorAll('.drvTabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t)); drvMsg('');
  const B=$('#drvBody'); B.innerHTML='<p class="drvMsg">Загружаю…</p>';
  if(t==='top'){ const r=await drvCall('top',{}); if(!r.ok){ B.innerHTML=''; drvMsg(DRV_ERR[r.err]||'Ошибка',true); return; } DRVUI.top=r; }
  if(t==='ch'){ const r=await drvCall('chList',{id:DRV.id}); if(!r.ok){ B.innerHTML=''; drvMsg(DRV_ERR[r.err]||'Ошибка',true); return; } DRVUI.ch=r.list; }
  if(t==='post'&&!DRVUI.top){ const r=await drvCall('top',{}); if(r.ok) DRVUI.top=r; }
  if(t==='card'){ DRVUI.card=null; await drvCardPush(); const r=await drvCall('getCard',{nick:DRVUI.find||DRV.nick}); DRVUI.card=r.ok?r:null; if(!r.ok) drvMsg(DRV_ERR[r.err]||'Ошибка',true); }
  if(DRVUI.tab===t) drvRender(); }
function drvRender(){ const B=$('#drvBody'), t=DRVUI.tab; let h='';
  if(t==='top'){ const r=DRVUI.top; h+='<div class="drvSub">'+DRV_BOSSES.map(b=>`<button class="chip${DRVUI.boss===b?' on':''}" data-boss="${b}">${DRV_BOSS[b]}</button>`).join('')+`<button class="chip${DRVUI.boss==='rank'?' on':''}" data-boss="rank">Звания</button></div>`;
    if(DRVUI.boss==='rank'){ const L=r.ranks||[]; h+=L.length?'<ol class="drvL">'+L.map((x,i)=>`<li class="${x.nick===DRV.nick?'me':''}"><span class="n">${i+1}</span><span>${drvEsc(x.nick)}<small>${drvEsc(RANKS[x.rank]||'')}</small></span><b>${x.missions} зад.</b></li>`).join('')+'</ol>':'<p class="drvMsg">Пока никого.</p>'; }
    else { const L=(r.bosses&&r.bosses[DRVUI.boss])||[], me=DRV.best[DRVUI.boss];
      h+=L.length?'<ol class="drvL">'+L.map((x,i)=>`<li class="${x.nick===DRV.nick?'me':''}"><span class="n">${i+1}</span><span>${drvEsc(x.nick)}<small>${drvEsc(drvTank(x.tank))}</small></span><b>${drvTime(x.secs)}</b></li>`).join('')+'</ol>':'<p class="drvMsg">Этого босса ещё никто не одолел.</p>';
      h+=`<p class="drvMsg">Твой лучший бой: ${me?drvTime(me.secs)+' на «'+drvEsc(drvTank(me.tank))+'»':'ещё нет'}.</p>`; } }
  if(t==='ch'){ const L=DRVUI.ch||[], st=c=>c.status==='beaten'?`побит: ${drvEsc(c.winner)} ${drvTime(c.winnerSecs)}`:(c.tries?`попыток: ${c.tries}`:'открыт');
    const others=L.filter(c=>!c.mine), mine=L.filter(c=>c.mine);
    h+=`<p class="drvMsg">Прими вызов и одолей этого босса быстрее — получишь ${DRV_PRIZE} лома. Свой вызов можно бросить после победы над боссом.</p>`;
    h+=others.length?others.map(c=>`<div class="drvC"><div class="row2"><span><em>${drvEsc(c.from)}</em> · ${DRV_BOSS[c.boss]||c.boss} за <b>${drvTime(c.secs)}</b></span><small>${drvEsc(drvTank(c.tank))}</small></div><div class="row2"><small>${st(c)}</small>${c.status==='open'?(DRV.acc[c.cid]?'<small>принят ✓</small>':`<button class="go" data-acc="${drvEsc(c.cid)}">Принять</button>`):''}</div></div>`).join(''):'<p class="drvMsg">Чужих вызовов нет.</p>';
    if(mine.length) h+='<p class="drvMsg">Твои вызовы:</p>'+mine.map(c=>`<div class="drvC"><div class="row2"><span>${DRV_BOSS[c.boss]||c.boss} за <b>${drvTime(c.secs)}</b></span><small>${st(c)}</small></div></div>`).join(''); }
  if(t==='post'){ const rec=((DRVUI.top&&DRVUI.top.recent)||[]).filter(n=>n!==DRV.nick);
    h+=`<p class="drvMsg">Посылка списывается у тебя и прилетает другу на парашюте. До 5 посылок в день.</p>
      <div class="lbjoin"><input id="drvTo" list="drvToL" maxlength="16" autocomplete="off" spellcheck="false" placeholder="Позывной друга" aria-label="Кому" value="${drvEsc(DRVUI.to)}"></div><datalist id="drvToL">${rec.map(n=>`<option value="${drvEsc(n)}">`).join('')}</datalist>
      <div class="drvKinds">${[100,250,500].map(n=>`<button class="ghost" data-send="scrap" data-n="${n}">${n} лома</button>`).join('')}<button class="ghost" data-send="rep" data-n="1">Ремкомплект</button><button class="ghost" data-send="ammo" data-n="1">Ящик патронов</button></div>
      <p class="drvMsg">У тебя: ${Math.floor(ST.scrap)} лома · ремкомплектов ${ST.kits.rep|0} · ящиков ${ST.kits.ammo|0}.</p>`; }
  if(t==='card'){ const r=DRVUI.card; h+=`<div class="lbjoin"><input id="drvFind" maxlength="16" autocomplete="off" spellcheck="false" placeholder="Найти водителя" value="${drvEsc(DRVUI.find)}" aria-label="Позывной"><button class="go" id="drvFindGo">Найти</button></div>`;
    if(r){ const c=r.card||{}, med=new Set(c.medals||[]), tk=c.tanks||{}, ago=r.lastSeen?Math.max(0,Math.round((Date.now()-r.lastSeen)/60000)):null;
      h+=`<div class="drvC"><div class="row2"><span><em>${drvEsc(r.nick)}</em> · ${drvEsc(RANKS[r.rank]||'')}</span><small>${r.missions} заданий</small></div><small>${ago==null?'':ago<2?'в игре сейчас':ago<60?`был ${ago} мин назад`:ago<2880?`был ${Math.round(ago/60)} ч назад`:`был ${Math.round(ago/1440)} дн назад`}</small></div>`;
      h+='<div class="drvC"><b>Лучшие бои</b>'+DRV_BOSSES.map(b=>{ const x=(r.best||{})[b]; return `<div class="row2"><span>${DRV_BOSS[b]}</span><small>${x?drvTime(x.secs)+' · '+drvEsc(drvTank(x.tank)):'—'}</small></div>`; }).join('')+'</div>';
      h+='<div class="drvC"><b>Машины</b>'+(Object.keys(tk).length?Object.keys(tk).map(id=>{ const u=tk[id]; return `<div class="row2"><span>${drvEsc(drvTank(id))}${c.tank===id?' <em>●</em>':''}</span><small>двиг ${u.e} · броня ${u.a} · способн ${u.ab} · стаб ${u.s}</small></div>`; }).join(''):'<small>карточка ещё не заполнена</small>')+'</div>';
      h+='<div class="drvC"><b>Медали</b><div class="drvMed">'+MEDALS.map(m=>`<span class="${med.has(m[0])?'on':''}" title="${drvEsc(m[2])}">${m[1]}</span>`).join('')+'</div></div>'; } }
  B.innerHTML=h; }
$('#drvBody').addEventListener('click',async e=>{ const b=e.target.closest('button'); if(!b) return; e.stopPropagation();
  if(b.dataset.boss){ DRVUI.boss=b.dataset.boss; drvRender(); return; }
  if(b.dataset.acc){ const c=(DRVUI.ch||[]).find(x=>x.cid===b.dataset.acc); if(!c) return; DRV.acc[c.cid]={boss:c.boss,secs:c.secs,from:c.from}; drvSave(); sfxClick(); drvMsg(`Вызов принят: одолей ${DRV_BOSS[c.boss]}а быстрее ${drvTime(c.secs)}.`); drvRender(); return; }
  if(b.id==='drvFindGo'){ DRVUI.find=$('#drvFind').value.trim(); drvTab('card'); return; }
  if(b.dataset.send){ const to=($('#drvTo').value||'').trim(); DRVUI.to=to; const kind=b.dataset.send, n=+b.dataset.n; if(!to){ drvMsg('Впиши позывной друга.',true); return; }
    if(kind==='scrap'&&ST.scrap<n){ drvMsg('Не хватает лома.',true); return; } if(kind!=='scrap'&&(ST.kits[kind]|0)<1){ drvMsg('Нечего отправить: купи в штабе.',true); return; }
    b.disabled=true; const r=await drvCall('send',{to,kind,amount:n},true); b.disabled=false;
    if(!r.ok){ drvMsg(DRV_ERR[r.err]||'Не получилось',true); return; }
    if(kind==='scrap') ST.scrap-=n; else ST.kits[kind]--; save(); kitsHud(); DRV.sent++; drvSave(); medalsCheck(); sfxBuy();
    drvRender(); drvMsg(`Отправлено ${r.to}: ${kind==='scrap'?n+' лома':DRV_KIND[kind]}. Сегодня ещё можно ${r.left}.`); } });
drvLoad();
