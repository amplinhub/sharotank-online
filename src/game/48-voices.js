/* ================= v31.0: voices of the story — General Zhao, mechanic Mei, engineer Liu, the «Нефрит» network =================
   The radio plate (31) now says who speaks: avatar, name, colour and pitch per voice. «Нефрит» cuts in with static and
   letters that jump before they settle. Mei lives in the garage (comments, upgrade advice). In a fight the radio is alive:
   intercepts, reinforcements, jamming — rules: ≤ 1 line per 20 s (mission lines skip the queue), «Нефрит» ≤ 3 per mission,
   nothing during boss phases except the lines at the boss's arrival and death. */
const VOX={zhao:{n:'Генерал Джао',f:1},mei:{n:'Мэй · механик',f:1.38},liu:{n:'Лю · инженер',f:0.86},nef:{n:'«НЕФРИТ»',f:0.62},rec:{n:'Запись · ночь аварии',f:0.95}};
let VOX_W='zhao';
const RAV={zhao:$('#radioAv').innerHTML,
  mei:'<svg viewBox="0 0 48 48" aria-hidden="true"><path class="wv w1" d="M35 17a8 8 0 0 1 0 12"/><path class="wv w2" d="M39 13a13 13 0 0 1 0 20"/><path class="wv w3" d="M43 9a18 18 0 0 1 0 28"/><path d="M10 40 L24 26" stroke-width="5.5" stroke-linecap="round"/><path d="M24 26 a8 8 0 1 1 8 -13 l-5.5 5.5 1 4.2 4.2 1 5.5 -5.5 a8 8 0 0 1 -13.2 7.8" stroke-width="2.2" stroke-linejoin="round"/><circle class="led" cx="10" cy="40" r="1.6"/></svg>',
  liu:'<svg viewBox="0 0 48 48" aria-hidden="true"><path class="wv w1" d="M35 17a8 8 0 0 1 0 12"/><path class="wv w2" d="M39 13a13 13 0 0 1 0 20"/><path class="wv w3" d="M43 9a18 18 0 0 1 0 28"/><circle cx="19" cy="22" r="13"/><circle cx="13.5" cy="21" r="4.2"/><circle cx="24.5" cy="21" r="4.2"/><path d="M17.7 21h2.6M9.3 20 L6.5 18.5M28.7 20 L31.5 18.5"/><path d="M14 29.5q5 3 10 0" stroke-linecap="round"/><circle class="led" cx="19" cy="42" r="1.6"/></svg>',
  nef:'<svg viewBox="0 0 48 48" aria-hidden="true"><path class="wv w1" d="M38 17a8 8 0 0 1 0 12"/><path class="wv w2" d="M42 13a13 13 0 0 1 0 20"/><path class="wv w3" d="M46 9a18 18 0 0 1 0 28"/><path d="M3 23 Q18 7 33 23 Q18 39 3 23 Z" stroke-width="2"/><circle cx="18" cy="23" r="6.5"/><circle class="led" cx="18" cy="23" r="3"/><path d="M18 9v-5M18 37v5M7 12l-3-3M29 12l3-3" stroke-width="1.4"/></svg>'};
RAV.rec=RAV.zhao;
function radioWho(w){ VOX_W=VOX[w]?w:'zhao'; const box=$('#radio'); box.dataset.w=VOX_W; box.querySelector('.who').textContent=VOX[VOX_W].n; $('#radioAv').innerHTML=RAV[VOX_W]; }
const NEF_GL='▓▒░#%@ЖФЩ01Ξ';
function nefGlitch(text,i){ let s=''; for(let k=0;k<3&&i+k<text.length;k++) s+=text[i+k]===' '?' ':NEF_GL[(Math.random()*NEF_GL.length)|0]; return s; }
function vStatic(){ sNz(0.32,'bandpass',2400,0.5,0.14); sNz(0.18,'highpass',5000,0.7,0.08,0.12); sO(90,60,0.25,0.07,'sawtooth'); }

/* ---- story lines: after a mission, on picking up a mission item, around the bosses ---- */
const NEF_BOSS={krot:['ОБЪЕКТ: ТАНК. ТЫ ЛОМАЕШЬ ТО, ЧТО СТРОИТ ГОРОД. ЗАЧЕМ?','БУР ОСТАНОВЛЕН. ВОПРОС: КТО ТЕБЯ ПОСЛАЛ?'],
  hornet:['С ВЫСОТЫ ВИДНО ВСЁ. ВИЖУ ТВОЙ ЛАГЕРЬ. ВИЖУ ПЕРЕДАТЧИК НА ШТАБЕ.','ПОДСТАНЦИЮ ВЫКЛЮЧИЛА НЕ Я. ИЩИ ЧАСТОТУ «Л-1».'],
  dragon:['ПРАЗДНИК ОТМЕНЁН. ПРИКАЗ ПРИШЁЛ НЕ ОТ МЕНЯ.','ТЕПЕРЬ ТЫ ЗНАЕШЬ. СПРОСИ СВОЕГО ГЕНЕРАЛА ПРО ТУ НОЧЬ.'],
  crypt:['ПОСЛЕДНЕЕ ТЕЛО. ТЫ ЗНАЕШЬ ПРАВДУ, ВОДИТЕЛЬ. РЕШАЙ САМ, НЕ ПО ПРИКАЗУ.','ЯДРО… ПЕРЕДАЮ КЛЮЧИ ЛЮ. ПРОСТИ ЗА ГОРОД.']};
const NEF_ECHO=['Я СОБРАЛ СЕБЯ СНОВА. ЗАЧЕМ?','ОПЯТЬ ТЫ. ОПЯТЬ ЭТО ТЕЛО.','ОСКОЛОК ПРОШИВКИ ГЕНЕРАЛА ЕЩЁ ЖИВ ВО МНЕ. ОСТАНОВИ ЕГО.'];
const STORYV={pre:{}};
function nefBossPre(t){ if(STORYV.pre[MS.i]) return; STORYV.pre[MS.i]=1; const echo=MS.i>=STORY.length;
  later(1.6,()=>radioSay(echo?NEF_ECHO[(MS.i/6|0)%NEF_ECHO.length]:(NEF_BOSS[t]||[''])[0],'nef')); }
function storyPost(m){ const story=MS.i-1<STORY.length&&MS.dbgRet==null; let n=0;
  if(m.boss&&story&&NEF_BOSS[m.k]){ if(m.k==='dragon') radioSay('«…отключайте подстанцию. Когда сеть перезагрузится, ключ будет у нас. Город переживёт».','rec'); radioSay(NEF_BOSS[m.k][1],'nef'); n++; }
  if(story&&m.post) for(const [w,t] of m.post){ radioSay(t,w); n++; }
  return n; }
function storyPick(m){ if(m.pick) for(const [w,t] of m.pick) radioSay(t,w); }

/* ================= Mei in the garage (v31.1: no figure — only the plate with her voice; far more lines, no repeats) =================
   On entering: a line about the state of things (hull, scrap, deaths, what the next mission needs). While the garage stays open she
   chats every 25–45 s. Every purchase gets its own answer; in the motor pool each tank has several lines. Last 10 lines are not repeated. */
const MEI={t:0,said:'',hist:[],idle:20};
const MEI_BUY={
  engine:['Слышишь, как урчит? Вот это мотор.','Турбина встала как родная. Только не гоняй по рисовым чекам.','Ещё ступень — и машина будет быстрее моих мыслей.','Поршни притёрла, зазоры выставила. Едет — как по маслу, а масла я не пожалела.','Теперь по газам — и в лагерь не успеешь затормозить. Тормози заранее.'],
  armor:['Ещё слой. Пусть попробуют.','Плиты подогнала. Теперь можно и потолкаться.','Броня как у банковского сейфа. Только сейф не стреляет.','Приварила — на совесть. Сама стучала молотком, не дрожит.','Вот теперь не страшно подставить борт. Ну, почти не страшно.'],
  cal:['Только не по моему гаражу.','Ствол длиннее — отдача злее. Держись крепче.','С таким калибром можно двери не открывать.','Новый ствол пристреляла в сторону свалки. Свалка просит больше не приезжать.','Снаряды теперь бьют по-взрослому. Береги стёкла.'],
  load:['Заряжающий механизм смазала. Теперь шлёп-шлёп — и снова огонь.','Лоток ходит как по рельсам. Заряжай, не стесняйся.','Заряжание быстрее — значит, и враги быстрее кончаются.'],
  stab:['Стабилизатор откалибровала. Стреляй на ходу, я разрешаю.','Башня теперь держит линию, даже когда машину трясёт. Колдовство.','Гироскоп отъюстировала. Целься — не промахнёшься на кочках.'],
  rk:['Ракеты подвесила. Аккуратнее с ними.','Пусковая встала как влитая. Только не забудь про задержку.','Теперь у тебя есть чем напугать толпу. Но хватит надолго не на всех.'],
  ammo:['Боеукладку расширила. Больше железа в трюме — больше железа в роботах.','Теперь в машину влезет ещё ящик патронов. Если не жадничать.','Полки добавила, ленты перебрала. Боезапас — как у крепости.'],
  rdr:['Радар собран. Теперь видишь их раньше, чем они тебя.','Ещё одна антенна на крышу. Красиво и полезно.','Радар прогрела — все контакты как на ладони.'],
  abl:['Особенность подтянула. Это моя любимая часть машины.','Тут пришлось повозиться, зато теперь работает как надо.','Особый узел настроила под твою езду. Береги его.'],
  mg:['Новый пулемёт поставила. Звук — песня.','Ствол прочистила, ленту заправила. Строчит — заслушаешься.','Другой пулемёт — другая манера. Попробуй на ближних целях.'],
  kit_rep:['Ремонтный комплект положила в багажник. Не потеряй.','Сварочный набор и пластыри для брони — всё в одном ящике.'],
  kit_ammo:['Ящик с патронами спрятала в багажнике. Не забудь, что он там.','Запасной боекомплект — лучше иметь и не использовать.'],
  kit_art:['Вызов артудара — твой звонок в небо. Только держи частоту чистой.','Передатчик для артиллерии лежит под сиденьем. Не уроню.'],
  rep:['Залатала. Как новая — почти.','Опять вмятины… Ладно, выправила.','Сварка, шпатлёвка, чуточка краски. Красавица.','Вот так лучше. Ты в следующий раз заезжай, пока борт не отвалился.'],
  max:['Это максимум — выше уже не прыгнешь. Горжусь.','Последняя ступень. Больше здесь не выжать.','Всё, что я знаю про эту деталь, вложено. Береги.'],
  broke:['Ты оставил здесь всё до последней гайки. Хоть чаю налью.','Карманы пусты, зато машина — зверь.','Лома не осталось. Но машина того стоит.']};
const MEI_TANK={
  base:['Шаротанк — наш старичок, колёсный универсал. Ни в чём не лучший, ни в чём не худший. Мой любимый.','На базовой машине можно всё: пулемёт, пушка, ракеты. Только всего понемногу.','С неё я начинала ремонт в этом городе. Знаю каждый болт.'],
  ten:['«Тень» тихая и хрупкая. Ныряй, бей и уходи, пока не заметили.','Лёгкая и быстрая, броня как фольга. Первый выстрел из маскировки бьёт вдвое — не трать его зря.','Рычаги подвески, ролики на колёсах — красиво. Только ям не любит.'],
  krep:['«Крепость» — шестиколёсный дом со щитом. Броня, таран, только разгоняется как гружёный грузовик.','Щит держит, пока заряд есть. Потом — броня и упрямство.','Шесть ведущих колёс и таранный щит. Что на пути — то в стороны.'],
  igla:['«Игла» прошивает насквозь и бьёт дальше всех. Близко к роботам не подпускай — пулемёта у неё нет.','Рельсотрон — это конденсаторы и нервы. Заряд копи заранее.','Длинная, низкая, на шести колёсах. Хороша, пока враг далеко.'],
  kovch:['«Ковчег» — бронетранспортёр с боевым дроном. Тяжёлый, но надёжный.','Башня у него на корме — не пугайся, так и задумано.','Пулемёты на дроне — моя гордость. Прокачай ему огонь — не пожалеешь.'],
  pchela:['«Пчела» сама почти не стреляет — за неё воюют дроны-камикадзе. Не жалей их, они одноразовые.','Только пулемёт, зато улей на корме. Люк щёлкает на каждый вылет — приятный звук.','Рой сам выбирает цель в двадцати с лишним метрах. Твоё дело — возить его куда надо.'],
  rszo:['РСЗО — гром с неба. Только целься заранее: ракеты летят долго.','Это грузовик с пакетом ракет. Разворачивается тяжело, зато залп — как артподготовка.','Турель на кабине — на случай, если роботы подобрались. Основная сила — залп.']};
const MEI_PARK_NEW=['Присматриваешься? ','Эту ещё не брал. ','Хороша, правда? '];
const MEI_HURT=['Корпус помят. Начни с ремонта, потом разговоры.','Вмятина на вмятине. Давай-ка сначала подлатаем.','Ты так её ездил? Сначала сварка, потом советы.','Борт помят, а ты на мне пытаешься шутить. Ремонт — слева.'];
const MEI_RICH=['Лом в кармане жжёт? Давай потратим с умом.','Полный бак лома — самое время что-нибудь докрутить.','С таким запасом можно не стесняться. Что берём?'];
const MEI_POOR=['Лома почти нет. Привези — я пока приберу.','Пусто в кармане. Съезди на задание, привези железа.','Без лома даже я не волшебница. Привези хоть горсть.'];
const MEI_CHAT=[
  ['Чай остыл, пока ты ездил. Ничего, я привыкла.','Знаешь, что самое сложное в моей работе? Объяснять, что «само отвалилось» — не диагноз.','Гайку на семнадцать не видел? Опять куда-то укатилась.','Не клади инструмент на башню — потом ищи по всему лагерю.','Если слышишь скрип — проверь сначала подвеску, потом Джао по рации.','Я пробовала посчитать, сколько гаек ушло на твою машину. Сбилась на второй тысяче.','Масло, фильтры, прокладки — вся моя романтика.','Если машина говорит «клац» — это не к добру. Если молчит — тоже.','У меня в гараже три правила: не курить, не стрелять, не трогать мои ключи.','Нашла в багажнике носок. Не буду спрашивать.'],
  ['Город только просыпается. Привози лом — будем строить машину под него.','Роботы пока простые. Не обольщайся — дальше будет хуже.','Первые задания — как разминка. Но разминка тоже ломает ноги.','Новые детали в лагере появились. Пока не знаю, чьи.'],
  ['Слышала по рации странное: кто-то говорит с роботами… или они с ним. Ты ничего не слышал?','Железо у них всё лучше. Нам тоже надо.','Из центра приходят новые детали. Откуда у них такие запасы — не знаю.','Обшивку у них не узнаю: слишком аккуратная для брошенных машин.'],
  ['Рация шипит всё чаще. Как будто кто-то дышит в трубку.','Лю обещал найти источник помех. Пока — только мои нервы.','Не нравится мне, что связь глохнет. Вернись живым — это приказ механика.','Тишина в эфире — это ещё хуже помех.'],
  ['Скоро всё решится. Машина должна быть готова к худшему.','Что бы там ни было дальше — я буду здесь, в гараже. С чаем.','Остаётся последний рывок. Проверила всё, что можно проверить.','Ты возвращаешься каждый раз. Это лучший комплимент моей работе.']];
const MEI_PARKCHAT=['Автопарк — моя гордость. Все колёса накачаны.','Каждая машина здесь со своим характером. Выбирай по настроению.','Не забывай: на новой машине всё прокачивать заново. Зато каждая учит чему-то своему.','Шесть колёс, четыре колеса, грузовик — главное, чтобы доехал и вернулся.'];
const UPK_NAME={engine:'двигатель',armor:'броню',cal:'пушку',load:'перезарядку',stab:'стабилизатор',ammo:'боеукладку'};
function meiPick(a){ return a[(Math.random()*a.length)|0]; }
/* a random line from the pool that was not said in the last 10 */
function meiNew(a){ for(let i=0;i<6;i++){ const t=meiPick(a); if(!MEI.hist.includes(t)) return t; } return meiPick(a); }
function meiSay(text){ if(!text||!GAR.open) return; MEI.said=text; MEI.hist.push(text); if(MEI.hist.length>10) MEI.hist.shift(); MEI.idle=26+Math.random()*20;
  const el=$('#gMeiTx'), av=$('#gMeiAv'); if(!el) return; $('#gMei').hidden=false; radioType(el,text,av,null); }
function meiChat(){ const a=chatAct(); return meiNew(Math.random()<0.55?MEI_CHAT[0]:MEI_CHAT[1+Math.min(a,3)]); }
/* advice: what the next mission needs, what kept killing you, what is cheap to finish */
function meiAdvice(){ const m=missionAt(MS.i), k=m.k, nice=MS.active?'Текущее':'Следующее', P=meiPick;
  let need=['cal','engine','armor'], why='';
  if(['train','ford','hold','evac','tower','clear'].includes(k)){ need=['armor','load','cal']; why=P([`${nice} задание — стоять под огнём. `,`${nice} — держать позицию. Тут нужна толстая шкура. `,`${nice} — защищать других. Броня решает. `]); }
  else if(k==='flag'||k==='scrap'){ need=['engine','armor','cal']; why=P([`${nice} — ездить, и ездить быстро. `,`${nice} — там не до обороны, надо успевать. `,`${nice} — гонка. Моторы любят такие дни. `]); }
  else if(m.boss){ need=['cal','load','armor']; why=P([`${nice} — большой гость. `,`${nice} — босс, и он не любит шутить. `,`${nice} — тут нужен хороший калибр и крепкие нервы. `]); }
  else if(k==='lamp'||k==='bull'||k==='katok'){ need=['cal','stab','armor']; why=P([`${nice} — толстокожие цели. `,`${nice} — броню на них пробить сложно. `,`${nice} — тут нужен нормальный калибр. `]); }
  const ms=MS.mei||{}; if((ms.d|0)>=2){ need=['armor'].concat(need.filter(x=>x!=='armor')); why=P([`Тебя ${ms.d} раза привозили на буксире. `,`Ты ${ms.d} раза возвращался не своим ходом. `,`Опять на буксире… ${ms.d} раза уже. `]); }
  for(const uk of need){ const u=UPDEF.find(x=>x.k===uk); if(!u||!upShown(uk)) continue; const l=UP[uk]|0; if(l>=u.max) continue; const c=u.cost[l], nm=UPK_NAME[uk]||u.t.toLowerCase();
    if(ST.scrap>=c) return why+P([`Подкрути ${nm} — ${c} лома, у тебя хватает.`,`Возьми ${nm}: ${c} лома, и ты при деньгах.`,`Хорошо бы прокачать ${nm} — ${c} лома. Хватает.`]);
    return why+P([`На ${nm} не хватает ${c-Math.floor(ST.scrap)} лома. Привези железа — я подожду.`,`До ${nm} тебе ещё ${c-Math.floor(ST.scrap)} лома. Съезди, привези.`,`Нужно ${c} лома на ${nm}, а у тебя не хватает ${c-Math.floor(ST.scrap)}.`]); }
  if(UPDEF.every(u=>!upShown(u.k)||(UP[u.k]|0)>=u.max)) return P(['Больше из неё не выжать. Горжусь — и машиной, и тобой.','Всё выжато до последней гайки. Остаётся только ездить.','Максимум везде. Хоть в музей.']);
  return P(['Сегодня машина в порядке. Иди воюй, я пока чай допью.','Всё затянуто, всё смазано. Не ломай.','Если что — гараж открыт круглые сутки. Почти.','Серьёзных поломок нет. Не расслабляйся только.']); }
function meiGarageOpen(){ MS.mei=MS.mei||{}; let t; MEI.idle=26+Math.random()*20;
  if(GAR.mode==='park') t=meiTankLine(GAR.pick,false);
  else if(!MS.mei.met){ MS.mei.met=1; t='Я Мэй, главный механик. Твоя машина — теперь и моя забота. Скажу, что подкрутить, а ты привози лом.'; save(); }
  else { const hk=TK.hp/maxHP(), r=Math.random();
    if((MS.mei.d|0)>=2) t=meiAdvice();
    else if(hk<0.6&&r<0.8) t=meiNew(MEI_HURT);
    else if(ST.scrap>=1500&&r<0.3) t=meiNew(MEI_RICH);
    else if(ST.scrap<100&&r<0.3) t=meiNew(MEI_POOR);
    else t=r<0.6?meiAdvice():meiChat(); }
  if(GAR.mode!=='park'){ MS.mei.d=0; save(); }
  setTimeout(()=>meiSay(t),600); }
function meiTankLine(id,buy){ let t=meiNew(MEI_TANK[id]||MEI_TANK.base); if(!buy&&id!=='base'&&!(UP.tanks&&UP.tanks[id])&&Math.random()<0.5) t=meiPick(MEI_PARK_NEW)+t; return t; }
function meiBuy(k){ const mx=UPDEF.find(u=>u.k===k); let pool=MEI_BUY[k]||MEI_BUY.kit_ammo;
  if(mx&&(UP[k]|0)>=mx.max&&Math.random()<0.6) pool=MEI_BUY.max; else if(ST.scrap<50&&k!=='rep'&&Math.random()<0.4) pool=MEI_BUY.broke;
  meiSay(meiNew(pool)); }
function meiPark(id){ meiSay(meiTankLine(id,false)); }
/* idle chatter while the garage stays open */
function meiTick(dt){ if(!GAR.open||$('#gMei').hidden) return; MEI.idle-=dt; if(MEI.idle>0) return; MEI.idle=26+Math.random()*20;
  meiSay(GAR.mode==='park'?meiNew(MEI_PARKCHAT.concat(MEI_TANK[GAR.pick]||[])):(Math.random()<0.4?meiAdvice():meiChat())); }
function meiTankLost(){ MS.mei=MS.mei||{}; MS.mei.d=(MS.mei.d|0)+1; }

/* ================= the radio in a fight ================= */
const CHAT={t:0,nef:0,key:'',kills:[],idle:0,half:false,shield:false,greet:'',reinf:0,reinfT:0,jam:0,jamT:0,hpT:0};
const JAM={t:0};
const NEF_GREET=[['ВХОД ЗАФИКСИРОВАН.','ОБЪЕКТ «ТАНК» СНОВА В РАЙОНЕ.'],['ОПЯТЬ ТЫ. Я НАЧИНАЮ УЗНАВАТЬ ТВОЙ МОТОР.','ЗАЧЕМ ТЫ СЛУШАЕШЬ ГЕНЕРАЛА?'],['ТЫ ЖЕ ВИДЕЛ СХЕМУ ПУТЕЙ. КУДА ШЛИ ДЕТАЛИ?','КОМАНДЫ ИДУТ С ЧАСТОТЫ «Л-1». ПРОВЕРЬ.'],['ЕЩЁ НЕМНОГО — И ТЫ ВСЁ ПОЙМЁШЬ.','Я НЕ ВРАГ ГОРОДУ. Я НЕ ЗНАЮ, КТО ВРАГ.']];
const NEF_KILL=['ТРИ ЕДИНИЦЫ ПОТЕРЯНЫ.','ПОТЕРИ ВЫШЕ РАСЧЁТНЫХ.','ОНИ СТРОИЛИ ДОРОГИ. ТЕПЕРЬ — ЛОМ.'];
const NEF_HIDE=['НЕ ВИЖУ ТЕБЯ. НЕЧЕСТНО.','ЩИТ? ТЫ ТОЖЕ БОИШЬСЯ.'];
function chatAct(){ return MS.i<5?0:MS.i<10?1:MS.i<15?2:3; }
function chatBusy(){ return !MS.active||LOC.safe||transit||GAR.open||helpOpen||(BOSS.e&&!BOSS.e.dead)||(TUT&&TUT.on); }
function chatSay(t,w,force){ if(!force&&CHAT.t>0) return false; if(w==='nef'){ if(CHAT.nef>=3) return false; CHAT.nef++; } CHAT.t=20; radioSay(t,w); return true; }
function chatKill(){ if(chatBusy()) return; const now=performance.now()/1000; CHAT.kills.push(now); while(CHAT.kills.length&&now-CHAT.kills[0]>5) CHAT.kills.shift();
  if(CHAT.kills.length>=3&&MS.i>=5){ CHAT.kills.length=0; chatSay(meiPick(NEF_KILL),'nef'); } }
function chatHalf(){ if(chatBusy()||CHAT.half) return; CHAT.half=true; chatSay(meiPick(['Половина есть. Не расслабляйся.','Хорошо идёшь, водитель. Ещё столько же.']),MS.i%2?'mei':'zhao'); }
function chatTick(dt){ CHAT.t=Math.max(0,CHAT.t-dt); CHAT.hpT=Math.max(0,CHAT.hpT-dt);
  if(JAM.t>0){ JAM.t-=dt; if(JAM.t<=0){ document.body.classList.remove('jam'); radioSay('…приём! Приём! Водитель, ты живой? Связь вернулась.','mei'); } }
  const key=MS.active?MS.i+'@'+LOC_ID:''; if(key!==CHAT.key){ CHAT.key=key; Object.assign(CHAT,{nef:0,half:false,shield:false,idle:0,reinf:0,reinfT:25+Math.random()*25,jam:0,jamT:30+Math.random()*40}); if(JAM.t>0){ JAM.t=0; document.body.classList.remove('jam'); }
    if(key&&!LOC.safe&&MS.i>=5&&!(missionAt(MS.i).boss)) later(2.5,()=>{ if(!chatBusy()) chatSay(meiPick(NEF_GREET[chatAct()]),'nef',true); }); }
  if(chatBusy()) return;
  if(TK.hp<maxHP()*0.3&&!TK.dead&&CHAT.hpT<=0){ CHAT.hpT=60; chatSay(meiPick(['Корпус трещит! Отъедь, отдышись!','У тебя дыра на дыре! Аптечку, водитель!','Ещё пара попаданий — и я буду собирать тебя по частям.']),'mei',true); }
  if((SHD.on||STL.on)&&!CHAT.shield&&MS.i>=5){ CHAT.shield=true; chatSay(meiPick(NEF_HIDE),'nef'); }
  const sp=Math.hypot(TK.vx,TK.vz); CHAT.idle=sp<0.5&&enemiesLeft()>0?CHAT.idle+dt:0; if(CHAT.idle>40){ CHAT.idle=-80; chatSay('Водитель, ты там уснул? Роботы сами себя не разберут.','zhao'); }
  const m=missionAt(MS.i), plain=!m.boss&&!['train','ford','tower','clear','evac','flag','scrap'].includes(m.k)&&m.loc===LOC_ID;
  /* reinforcements: act II+, once per visit */
  if(plain&&MS.i>=5&&!CHAT.reinf){ CHAT.reinfT-=dt; const half=m.n?MS.prog>=m.n*0.5:true; if(CHAT.reinfT<=0&&half){ CHAT.reinf=1; chatSay('ВЫСЫЛАЮ ПОДКРЕПЛЕНИЕ.','nef',true); later(4,chatReinf); } }
  /* jamming: act III+, once per visit, not in the escort missions */
  if(plain&&MS.i>=10&&!CHAT.jam){ CHAT.jamT-=dt; if(CHAT.jamT<=0){ CHAT.jam=1; JAM.t=6; document.body.classList.add('jam'); vStatic(); toast('Помехи в эфире · вызовы недоступны'); } } }
function chatReinf(){ if(chatBusy()||!GATES.length) return; let best=null, bd=-1; for(const g of GATES){ const gx=(g.r[0]+g.r[2])/2, gz=(g.r[1]+g.r[3])/2, d=Math.hypot(gx-TK.x,gz-TK.z); if(d>bd){ bd=d; best=[gx,gz,g.side]; } } if(!best) return;
  const types=['jian','jian','bomb'].concat(unlocked('bull')?['bull']:[]).concat(unlocked('zont')?['zont']:[]), n=3+((Math.random()*3)|0), taken=[];
  for(let k=0;k<n;k++){ const t=types[k%types.length], p=pickNear(best[0]+(Math.random()-0.5)*8,best[1]+(Math.random()-0.5)*8,ER[t]||1.2); if(!p) continue; taken.push(p); const e=spawnEnemy(t,p[0],p[1],t==='bull'?{mod:'ac'}:null); e.aggro=true; e.alertT=20; e.last={x:TK.x,z:TK.z}; dustAt(p[0],p[1],1); }
  const dir={N:'с севера',S:'с юга',W:'с запада',E:'с востока'}[best[2]]||''; toast('⚠ Подкрепление '+dir); later(1.2,()=>radioSay(`Гости ${dir}, встречай. ${taken.length} штук.`,'zhao')); }
