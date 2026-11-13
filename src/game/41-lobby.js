/* 41 — онлайн-лобби (этап 1: транспорт + комната). Вариант B «хост-игрок»: хост считает мир.
   Здесь только: создать комнату (код) → друг входит по коду → готовность → старт.
   Снимков мира и ввода гостя пока нет — это этап 3 (см. docs/online-handoff.md).
   Транспорт — window.SHT_NET (src/net/transport.js); игра не знает, что под ним PeerJS. */
const NET_START={ loc:'junk', side:'S' };   // арена старта онлайна: Свалка (id 'junk', там живёт Крот; вход из Промзоны с юга); поменять тут
const NET_TXT={
  'server':'Сервер комнат недоступен. Проверь интернет и попробуй чуть позже.',
  'no-room':'Комнаты с таким кодом нет. Проверь код.',
  'timeout':'Не удалось соединиться напрямую. Попробуй другую сеть, например Wi-Fi.',
  'full':'В этой комнате уже двое.',
  'bad-code':'Код — 5 символов: буквы и цифры.'
};
const LB={ t:null, role:null, ready:{h:false,g:false}, inGame:false, busy:false, code:'', afterMsg:'' };
window.__lb=LB;

function lbSec(id,msg){ for(const s of ['lbMenu','lbRoom','lbMsg']) $('#'+s).hidden=s!==id; if(msg!==undefined) $('#lbMsgTx').textContent=msg; }
function lbRender(){
  const mine=LB.role==='host'?LB.ready.h:LB.ready.g, peer=LB.role==='host'?LB.ready.g:LB.ready.h, here=!!(LB.t&&LB.t.open);
  const me=$('#lbMe'), pe=$('#lbPeer');
  me.textContent=mine?'готов':'не готов'; me.className=mine?'on':'';
  pe.textContent=here?(peer?'готов':'не готов'):(LB.role==='host'?'ждём…':'—'); pe.className=here&&peer?'on':'';
  $('#lbCodeBig').textContent=LB.code||'·····';
  $('#lbReady').textContent=mine?'Не готов':'Готов'; $('#lbReady').disabled=!here;
  const st=$('#lbStart'); st.hidden=LB.role!=='host'; st.disabled=!(here&&LB.ready.h&&LB.ready.g);
  $('#lbHint').textContent=!here?(LB.role==='host'?'Назови код другу и жди, пока он войдёт.':'Соединяюсь…'):(LB.ready.h&&LB.ready.g?(LB.role==='host'?'Оба готовы — жми «Старт».':'Оба готовы — ждём старта хоста.'):'Когда оба нажмут «Готов», хост начнёт игру.');
}
function lbSend(m){ if(LB.t) LB.t.send(m); }
function lbBroadcast(){ lbSend({t:'state',h:LB.ready.h,g:LB.ready.g}); lbRender(); }

function lbReset(){ if(LB.t){ try{ LB.t.close(); }catch(_){} } Object.assign(LB,{t:null,role:null,ready:{h:false,g:false},inGame:false,busy:false,code:'',afterMsg:''}); }
function lbOpen(){ lbReset(); $('#help').hidden=true; $('#lobby').hidden=false; lbSec('lbMenu'); $('#lbCreate').disabled=$('#lbJoin').disabled=false; $('#lbJoin').textContent='Войти'; }
/* Назад в меню игры: гость после «хост отключился», любой после «Выйти». helpOpen остаётся true — мир на паузе. */
function lbToMenu(){
  const wasGame=LB.inGame; lbReset(); $('#lobby').hidden=true; helpOpen=true; $('#help').hidden=false;
  if(wasGame){ let n=0; const go=()=>{ if(LOC_ID==='camp') return; if(transit&&n++<40) return setTimeout(go,300); goLocation('camp',null,{x:40,z:44,h:Math.PI}); }; go(); }
}
function lbFail(code){ lbReset(); $('#lbCreate').disabled=$('#lbJoin').disabled=false; $('#lbJoin').textContent='Войти'; lbSec('lbMsg',NET_TXT[code]||NET_TXT.server); LB.afterMsg='lbMenu'; }

function lbStartGame(){
  LB.inGame=true; $('#lobby').hidden=true; closeHelp();
  if(LOC_ID!==NET_START.loc) goLocation(NET_START.loc,NET_START.side);
  toast(LB.role==='host'?'Онлайн · ты хост':'Онлайн · ты гость');
}
function lbWire(t){
  t.onMessage(m=>{
    if(!m||typeof m!=='object') return;
    if(LB.role==='host'&&m.t==='ready'){ LB.ready.g=!!m.v; lbBroadcast(); }
    else if(LB.role==='guest'&&m.t==='state'){ LB.ready.h=!!m.h; LB.ready.g=!!m.g; lbRender(); }
    else if(LB.role==='guest'&&m.t==='start'&&!LB.inGame){ lbStartGame(); }
  });
  t.onClose(()=>{
    if(LB.role==='guest'){ const g=LB.inGame; lbReset(); LB.inGame=g; $('#lobby').hidden=false; lbSec('lbMsg','Хост отключился.'); LB.afterMsg='menu'; }
    else if(LB.role==='host'){
      LB.ready.h=LB.ready.g=false;
      if(LB.inGame) toast('Друг отключился'); else lbRender();
    }
  });
  t.onPeer(()=>{ LB.ready.g=false; LB.ready.h=false; lbBroadcast(); });
}

$('#bOnline').addEventListener('click',e=>{ e.stopPropagation(); sfxClick(); lbOpen(); });
$('#lbBack').addEventListener('click',()=>{ sfxClick(); lbReset(); $('#lobby').hidden=true; $('#help').hidden=false; });
$('#lbOk').addEventListener('click',()=>{ sfxClick(); if(LB.afterMsg==='lbMenu'){ lbSec('lbMenu'); } else lbToMenu(); LB.afterMsg=''; });
$('#lbLeave').addEventListener('click',()=>{ sfxClick(); lbToMenu(); });
/* Клавиши в поле кода не должны ездить танком и закрывать меню (глобальные обработчики висят на window). */
for(const ev of ['keydown','keyup']) $('#lobby').addEventListener(ev,e=>e.stopPropagation());

$('#lbCreate').addEventListener('click',async()=>{
  if(LB.busy) return; sfxClick(); LB.busy=true; $('#lbCreate').disabled=$('#lbJoin').disabled=true;
  const t=window.SHT_NET.createTransport(); LB.t=t; LB.role='host'; lbWire(t);
  try{ LB.code=await t.host(); LB.busy=false; lbSec('lbRoom'); lbRender(); }
  catch(err){ if(LB.t!==t) return; LB.busy=false; lbFail(err.code); }
});
$('#lbJoin').addEventListener('click',async()=>{
  if(LB.busy) return; sfxClick();
  const code=window.SHT_NET.normalizeCode($('#lbCode').value); if(!code){ lbSec('lbMsg',NET_TXT['bad-code']); LB.afterMsg='lbMenu'; return; }
  LB.busy=true; $('#lbCreate').disabled=$('#lbJoin').disabled=true; $('#lbJoin').textContent='Соединяюсь…';
  const t=window.SHT_NET.createTransport(); LB.t=t; LB.role='guest'; LB.code=code; lbWire(t);
  try{ await t.join(code); LB.busy=false; lbSec('lbRoom'); lbRender(); }
  catch(err){ if(LB.t!==t) return; LB.busy=false; lbFail(err.code); }
});
$('#lbReady').addEventListener('click',()=>{
  sfxClick(); if(!LB.t||!LB.t.open) return;
  if(LB.role==='host'){ LB.ready.h=!LB.ready.h; lbBroadcast(); }
  else { LB.ready.g=!LB.ready.g; lbSend({t:'ready',v:LB.ready.g}); lbRender(); }
});
$('#lbStart').addEventListener('click',()=>{
  if(LB.role!=='host'||!(LB.t&&LB.t.open&&LB.ready.h&&LB.ready.g)) return; sfxClick();
  lbSend({t:'start',loc:NET_START.loc,side:NET_START.side}); lbStartGame();
});
