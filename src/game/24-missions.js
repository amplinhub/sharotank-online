/* ================= MISSIONS · RANKS · HQ ================= */
const RANKS=['Рядовой','Ефрейтор','Мл. сержант','Сержант','Ст. сержант','Старшина','Прапорщик','Лейтенант','Ст. лейтенант','Капитан','Майор'];
/* missions completed to earn each rank: the story (20, four of them bosses) ends at Senior Lieutenant, Major needs 35 */
const RANK_AT=[0,2,4,6,8,11,14,17,20,27,35];
function rankFor(n){ let r=0; for(let i=0;i<RANK_AT.length;i++) if(n>=RANK_AT[i]) r=i; return r; }
/* ================= v10: story campaign · General Zhao radio · «Каток» heavy tank · «Зонт» shield support ================= */
/* ---- story: 16 missions, two per district, never the same district twice in a row ---- */
const STORY=[
 {k:'jian',n:4,loc:'south',r:150,title:'Рисовые чеки',brief:'Водитель, слушай внимательно. После аварии на подстанции городская сеть «Нефрит» перестала нас слушать, а её стройроботы взбесились. Крестьяне в Деревне жалуются: железные кузнечики топчут рассаду. Съезди, разгони четыре штуки. Похоже на обычную поломку.'},
 {k:'hold',loc:'nw',x:38,z:36,rad:6.5,t:40,r:180,name:'перрон',hint:{t:'krep',s:'Перрон открытый, укрыться негде. Тут бы пригодилась броня покрепче — а лучше собственный щит.'},title:'Последний состав',brief:'С Вокзала уходит эвакуационный поезд с людьми из пригорода. Встань у перрона и не подпускай роботов, пока состав не уйдёт. Сорок секунд, водитель. Держись.'},
 {k:'scrap',n:200,loc:'north',r:200,title:'Запчасти для гаража',brief:'Механики жалуются — нечем латать твою машину. На складах Промзоны полно железа. Набей трюм ломом: двести единиц, и ни гайкой меньше.'},
 {k:'hive',n:1,loc:'east',r:220,title:'Минный мост',brief:'В Речном квартале кто-то минирует мосты через каналы. Это бывший укладчик плитки, теперь он кладёт мины. Найди установку и уничтожь, пока квартал не отрезало от лагеря.'},
 {k:'crypt',n:1,loc:'cem',r:450,boss:true,title:'Склеп на Старом кладбище',brief:'Связисты поймали странный сигнал за Деловым центром — со Старого кладбища. «Нефрит» спрятал резервный узел прямо в фамильном склепе, а охраняют его два робота-льва. Разбей стражей — тогда проснётся «Энергобот». Его прикрывает поле невидимости, которое питают трансформаторы кладбища и дороги. Ломай трансформаторы — и бей по нему.'},
 {k:'lamp',n:2,loc:'west',r:260,hint:{t:'igla',s:'Они бьют издалека. Кто бьёт ещё дальше и точнее — тот и прав.'},title:'Снайперы на крышах',brief:'Патрули в Деловом центре обстреливают с высоты. Разведка говорит — это фонарные роботы. Они прикидываются столбами. Смотри внимательно: если фонарь повернулся к тебе — стреляй.'},
 {k:'flag',n:1,loc:'ne',r:300,obj:'журнал диспетчерской',hint:{t:'ten',s:'Охрана у журнала плотная. Тихий заход сработал бы лучше громкого.'},title:'Журнал диспетчерской',brief:'В Морском порту лежит журнал, куда «Нефрит» писал команды кранам. Он помечен флажком на причале. Забери его и привези в штаб — его будут охранять.'},
 {k:'evac',n:5,loc:'se',r:320,hint:{t:'pchela',s:'Людей придётся прикрывать со всех сторон — лишние глаза в небе не помешают.'},title:'Сборщики чая',brief:'На плантациях Чайных холмов застряли сборщики чая и монахи. Зачисти склон до последнего робота, потом люди сами побегут к дороге на лагерь. Не задень никого.'},
 {k:'bull',n:3,loc:'sw',r:340,title:'Башенный кран',brief:'На Новостройках тяжёлые шагоходы охраняют башенный кран — через него сеть держит связь. Уничтожь охрану. В лоб «Бизона» не возьмёшь, заходи с борта.'},
 {k:'krot',n:1,loc:'junk',r:650,boss:true,title:'Крот под свалкой',brief:'Кузницы получают железо со Свалки за Промзоной. Там хозяйничает буровая установка «Крот»: роет ходы под кучами лома, а на крыше у неё реактивный миномёт. Ракеты падают сверху — уходи из красных прицелов на земле. Когда он закапывается, из куч полезут роботы. Слушай, где загудит земля, — там он вынырнет.'},
 {k:'factory',n:1,loc:'north',r:400,title:'Сердце завода',brief:'Журнал из порта показал главное: роботов собирают прямо в Промзоне. Там работает передвижной цех «Кузница». Найди её и уничтожь — иначе мы воюем с бесконечным конвейером.'},
 {k:'hold',loc:'south',x:24,z:40,rad:7,t:55,r:420,name:'брод у мельницы',hint:{t:'krep',s:'Долго стоять под огнём на одном месте… Слышал, в автопарке есть машина, которая это умеет.'},title:'Брод у мельницы',brief:'Через брод у старой мельницы в Деревне идёт колонна беженцев. Роботы полезут волнами. Держи переправу пятьдесят пять секунд — колонна должна пройти целиком.'},
 {k:'flag',n:1,loc:'nw',r:450,obj:'схему путей',hint:{t:'ten',s:'В депо тесно и полно охраны. Иногда лучше, чтобы тебя вообще не заметили.'},title:'Карта путей',brief:'В депо Вокзала осталась схема железнодорожных путей с пометками. По ней сеть возит детали между районами. Флажок на схеме, найди и привези её в штаб.'},
 {k:'factory',n:1,loc:'ne',r:500,title:'Плавучий цех',brief:'По схеме путей нашли вторую Кузницу. Она встала у причала в Морском порту и штампует роботов прямо из контейнеров. Сноси её.'},
 {k:'hornet',n:1,loc:'auto',r:800,boss:true,title:'Шершень над автосалоном',brief:'Над Автосалоном за Речным кварталом кружит «Шершень» — штурмовой винтокрыл, собранный сетью из угнанных машин. Тяжёлый, разгоняется и тормозит медленно: лови его на развороте. Он сбрасывает мины и отстреливает ловушки, если долго держать его в захвате.'},
 {k:'evac',n:7,loc:'east',r:550,hint:{t:'pchela',s:'На улицах у каналов много углов — пара помощников с воздуха была бы кстати.'},title:'Каналы',brief:'Сеть отрезала жителей Речного квартала. Зачисти улицы у каналов и выведи людей к выезду на лагерь. Их семеро. Каждый на счету, водитель.'},
 {k:'lamp',n:4,loc:'sw',r:600,hint:{t:'igla',s:'Четыре маяка на высотках — тут нужен длинный ствол, который прошивает насквозь.'},title:'Ретрансляторы',brief:'Маяки на Новостройках передают сигнал «Нефрита» на холмы. Погаси все четыре — тогда резервная станция останется без глаз.'},
 {k:'hold',loc:'west',x:11,z:51,rad:7,t:70,r:650,name:'площадь у башни',title:'Площадь у башни',brief:'Наши сапёры минируют башню в Деловом центре — через неё сеть выходит в город. Держи площадь, пока они работают. Семьдесят секунд. Будет жарко.'},
 {k:'clear',loc:'se',r:800,extra:[['katok',36,30],['katok',46,30],['zont',41,27],['zont',40,36]],title:'Колокол тишины',brief:'Это предпоследний рубеж. Резервная станция «Нефрита» — под монастырём на Чайных холмах. Там ждут два «Катка» под куполами. Уничтожь всё, что движется на холмах, и мы отключим станцию навсегда. Удачи, водитель.'},
 {k:'dragon',n:1,loc:'park',r:1200,boss:true,final:true,title:'Золотой дракон',brief:'Станция под монастырём замолчала, но «Нефрит» успел перекачать ядро в праздничного дракона Луна-парка за Деревней. Это его последнее тело. Погаси четыре фонаря на спине — без них дракон беззащитен. Потом бей в голову и не стой перед пастью.'}
];
const UNLOCK={jian:0,bomb:0,hive:1,lamp:2,bull:3,zont:5,factory:6,katok:7};
function unlocked(t){ return MS.i>=(UNLOCK[t]||0); }
const LOC_EXTRA={north:[['katok',52,60],['zont',30,52]],west:[['zont',40,28]],south:[['zont',44,40]],east:[['katok',30,30]],nw:[['katok',52,40],['zont',42,52]],ne:[['zont',40,52]],sw:[['katok',50,52]],se:[['katok',42,60],['zont',40,52]],cem:[['katok',30,80],['katok',130,80],['zont',80,100]],junk:[['katok',40,80],['katok',120,80],['zont',80,110]],auto:[['katok',40,66],['katok',40,94],['zont',120,80]],park:[['katok',40,60],['katok',120,60],['zont',80,110]]};
function locEnemyList(){ let base=(LOC.enemies||[]).concat(LOC_EXTRA[LOC_ID]||[]); if(MS.active){ const m=missionAt(MS.i); if(m.boss&&m.loc===LOC_ID) base=base.filter((en,i)=>i%3===0&&en[0]!=='factory'&&en[0]!=='katok'); } return base.map((en,i)=>unlocked(en[0])?en:[i%3===2?'bomb':'jian',en[1],en[2],null]); }
const SEEN={}; const MXTRA={};
function missionExtras(){ if(!MS.active) return; const m=missionAt(MS.i); if(m.boss&&m.loc===LOC_ID){ if(!ENEMIES.some(e=>!e.dead&&e.type===m.k)) spawnBoss(m.k); return; } if(!m.extra||m.loc!==LOC_ID||MXTRA[MS.i]) return; MXTRA[MS.i]=true;
  for(const [t,x,z] of m.extra){ const p=pickNear(x,z,ER[t])||[x,z]; const e=spawnEnemy(t,p[0],p[1],t==='bull'?{mod:'ac'}:null); e.home={x,z}; } }
const ENEMY_INTRO={hive:'Новый противник — «Улей». Ставит мины и выпускает дроны «Сорока». Держись подальше от мин и бей по корпусу.',
  lamp:'Новый противник — «Маяк». Прикидывается фонарём. Если фонарь смотрит на тебя — стреляй по ногам.',
  bull:'Новый противник — «Бизон». Лоб у него крепкий, заходи с борта или с кормы. Когда он припадает к земле — сейчас выстрелит.',
  zont:'Новый противник — «Зонт». Накрывает своих куполом, снаружи его не пробить. Въезжай под купол или перегрей его огнём. Сам «Зонт» хлипкий.',
  factory:'Новый противник — «Кузница». Передвижной цех, печёт новых роботов. Пока он жив, их будет всё больше.',
  katok:'Новый противник — «Каток». Бывший дорожный каток с пушкой. Лоб почти не пробить. Когда ствол краснеет — уходи с линии огня. Бей в радиатор на корме.'};
function newTypeAt(i){ for(const t in UNLOCK) if(UNLOCK[t]===i&&i>0) return t; return null; }

const MISSIONS=STORY;
const NOUNS={crypt:['«Энергобота»','«Энергобота»','«Энергоботов»'],krot:['«Крота»','«Крота»','«Кротов»'],hornet:['«Шершня»','«Шершня»','«Шершней»'],dragon:['«Золотого дракона»','«Золотого дракона»','«Драконов»'],katok:['«Каток»','«Катка»','«Катков»'],zont:['«Зонт»','«Зонта»','«Зонтов»'],jian:['«Кузнечика»','«Кузнечика»','«Кузнечиков»'],bull:['«Бизона»','«Бизона»','«Бизонов»'],hive:['«Улей»','«Улья»','«Ульев»'],lamp:['«Маяк»','«Маяка»','«Маяков»'],factory:['«Кузницу»','«Кузницы»','«Кузниц»']};
const ENAME={crypt:'«Энергобот»',krot:'БУ-7 «Крот»',hornet:'ВШ-24 «Шершень»',dragon:'«Золотой дракон»',lion:'Робот-лев',xfmr:'Трансформатор',jian:'ПШР-4 «Кузнечик»',bomb:'ПМ-6 «Колобок»',hive:'ЗМУ-2 «Улей»',factory:'РМК-12 «Кузница»',bull:'ТШ-75 «Бизон»',lamp:'СН-9 «Маяк»',drone:'БПЛА «Сорока»',katok:'ТК-90 «Каток»',zont:'ОЗ-5 «Зонт»',clear:'Зачистка района',flag:'Захват флага',evac:'Эвакуация гражданских',hold:'Оборона рубежа',scrap:'Сбор лома'};
const EDESC={crypt:'босс · летающий робот с катушками Теслы · питается от трансформаторов',krot:'босс · буровая установка с реактивным миномётом',hornet:'босс · штурмовой винтокрыл',dragon:'босс · механический дракон из 14 сегментов',lion:'робот-страж склепа',xfmr:'питает поле невидимости Энергобота',jian:'прыгающий штурмовой робот',bomb:'подвижная мина',hive:'заградительная минная установка',factory:'ремонтно-монтажный комплекс',bull:'тяжёлый шагоход',lamp:'снайперский робот-маскировщик',hold:'держи круг, пока идёт таймер',katok:'тяжёлый танк из дорожного катка',zont:'щитоносец · купол над союзниками',clear:'уничтожь всё, что движется',flag:'флаг охраняют · подбери и привези к штабу',evac:'зачисти район · люди побегут к лагерю · не задень их',scrap:'лом падает только с роботов'};
function plural(n,f){ const a=n%10, b=n%100; return f[(a===1&&b!==11)?0:(a>=2&&a<=4&&(b<10||b>=20))?1:2]; }
function missionAt(i){ if(i<MISSIONS.length) return MISSIONS[i]; const j=i-MISSIONS.length; if(j%6===5){ const q=STORY.filter(m=>m.boss)[((j/6)|0)%4]; return Object.assign({},q,{final:false,r:500+j*15,brief:`${q.title}: «Нефрит» собрал его заново. Разберись с ним ещё раз.`}); } const t=['jian','katok','flag','hive','zont','evac','factory','hold','bull','lamp'][j%10];
  if(t==='flag'||t==='evac'){ const L=['west','north','east','south','nw','ne','sw','se'][((j/8)|0)%8]; return t==='flag'?{k:'flag',n:1,loc:L,r:450+j*15}:{k:'evac',n:5+Math.min(3,(j/16)|0),loc:L,r:480+j*15}; }
  if(t==='hold'){ const L=['north','west','east','nw','se','ne'][((j/6)|0)%6]; return {k:'hold',loc:L,x:40,z:40,rad:7,t:60+((j/6)|0)*8,r:560+j*15,name:'перекрёсток'}; }
  if(t==='factory') return {k:t,n:1,loc:['north','south','ne'][((j/5)|0)%3],r:500+j*15};
  const base={jian:20,bull:9,hive:3,lamp:5,katok:2,zont:3}[t]; return {k:t,n:base+((j/5)|0)*2,r:420+j*15}; }
function missionText(m){ if(m.k==='scrap') return `Собери ${m.n} лома${m.loc?' '+LOCS[m.loc].dir+' от лагеря':''}`; if(m.k==='clear') return `Уничтожь всех роботов ${LOCS[m.loc].dir} от лагеря`; if(m.k==='flag') return `Забери ${m.obj||'флаг'} ${LOCS[m.loc].dir} от лагеря и доставь в штаб`; if(m.k==='evac') return `Эвакуируй гражданских ${LOCS[m.loc].dir} от лагеря`; if(m.k==='hold') return `Удержи ${m.name} ${LOCS[m.loc].dir} от лагеря · ${m.t} с`; const where=m.loc?` ${LOCS[m.loc].dir} от лагеря`:'';
  return m.n===1?`Уничтожь ${NOUNS[m.k][0]}${where}`:`Уничтожь ${m.n} ${plural(m.n,NOUNS[m.k])}${where}`; }
/* v24: a «destroy N of X in location L» mission always has exactly (N - done) living X there */
function missionEnsure(){ if(!MS.active||LOC.safe) return; const m=missionAt(MS.i); if(!m||!m.n||m.loc!==LOC_ID||!['jian','bull','hive','lamp','katok','zont'].includes(m.k)) return;
  const need=Math.max(0,m.n-Math.floor(MS.prog)), list=ENEMIES.filter(e=>!e.dead&&e.type===m.k&&e.state!=='fly');
  if(list.length<need){ const taken=ENEMIES.filter(e=>!e.dead).map(e=>[e.x,e.z,ER[e.type]||1.2]), r=ER[m.k]||1.4, mods=['ac','mg','mortar'];
    for(let i=list.length;i<need;i++){ const p=pickSpawn(m.k,r,taken)||pickNear(WX/2+(rnd()-0.5)*WX/2,WZ/2+(rnd()-0.5)*WZ/2,r)||[WX/2,WZ/2]; taken.push([p[0],p[1],r]); spawnEnemy(m.k,p[0],p[1],m.k==='bull'?{mod:mods[i%3]}:null); } }
  else if(list.length>need){ const sub=m.k==='jian'?'bomb':'jian', rm=list.filter(e=>!e.wave).reverse().slice(0,list.length-need);
    for(const e of rm){ const x=e.x, z=e.z; eRemove(e); spawnEnemy(sub,x,z,null); } } }
function onKill(e){ if(!MS.active) return; const m=missionAt(MS.i); if(m.k!==e.type||(m.loc&&m.loc!==LOC_ID)) return; MS.prog++; objUI();
  if(MS.prog>=m.n) completeMission(); else if(m.n>1){ toast(`Задание · ${MS.prog} / ${m.n}`); sO(600+MS.prog/m.n*600,900+MS.prog/m.n*600,0.12,0.06,'square'); } }
function missionScrap(v){ if(!MS.active) return; const m=missionAt(MS.i); if(m.k!=='scrap'||(m.loc&&m.loc!==LOC_ID)) return; MS.prog+=v; objUI(); if(MS.prog>=m.n) completeMission(); }
function completeMission(){ const m=missionAt(MS.i); MS.active=false; MS.prog=0; MS.i++; if(MS.dbgRet!=null){ MS.i=MS.dbgRet; MS.dbgRet=null; } const nr=rankFor(MS.i), up=nr>MS.rank; MS.rank=Math.max(MS.rank,nr);
  ST.scrap+=m.r; gainAcc+=m.r; gainT=2.2; rankUI(true); objUI(); save();
  radioSay(m.final?'Станция молчит. «Нефрит» отключён. Ты сделал это, водитель — весь лагерь слышит, как ты едешь домой.':['Отличная работа, водитель. Возвращайся в штаб — есть новое дело.','Чисто сработано. Жду тебя в штабе.','Принято, задача выполнена. Заезжай в штаб за следующим приказом.'][MS.i%3]);
  showWin(m,up,!!m.final); }
function rankSVG(r){ let s='<path d="M8 6.5 L15 2.5 L22 6.5 V28.5 H8 Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>';
  const chev=y=>`<path d="M10 ${y} L15 ${y-3.4} L20 ${y}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`;
  const star=(x,y,R)=>{ let p=''; for(let k=0;k<10;k++){ const a=-Math.PI/2+k*Math.PI/5, rr=k%2?R*0.45:R; p+=(k?'L':'M')+(x+Math.cos(a)*rr).toFixed(2)+' '+(y+Math.sin(a)*rr).toFixed(2); } return `<path d="${p}Z" fill="currentColor"/>`; };
  const bar=x=>`<rect x="${x}" y="7" width="1.6" height="21.5" fill="currentColor" opacity=".45"/>`;
  if(r>=1&&r<=4){ for(let k=0;k<Math.min(3,r);k++) s+=chev(26-k*4.4); if(r===4) s+='<rect x="10" y="9" width="10" height="2.2" fill="currentColor"/>'; }
  else if(r===5) s+='<rect x="10" y="9" width="10" height="6" fill="currentColor"/>';
  else if(r===6) s+=star(15,13,2.7)+star(15,21,2.7);
  else if(r>=7&&r<=9){ s+=bar(14.2); for(const [x,y] of [[11,23],[19,23],[15,17],[15,11]].slice(0,r-5)) s+=star(x,y,2.5); }
  else if(r>=10){ s+=bar(11.4)+bar(17); for(const [x,y] of [[15,23],[15,16],[15,10]].slice(0,r-9)) s+=star(x,y,3.3); }
  return s; }
function rankUI(pulse){ $('#rankIco').innerHTML=rankSVG(MS.rank); $('#rankName').textContent=RANKS[MS.rank];
  if(pulse){ const el=$('#rank'); el.classList.remove('up'); void el.offsetWidth; el.classList.add('up'); } }
function objUI(){ const o=$('#obj'); if(!MS.active){ o.hidden=true; return; } const m=missionAt(MS.i); o.hidden=false;
  if(m.k==='flag'){ o.innerHTML=`<span class="lbl">Задание</span><span>${MS.flag?'Флаг у тебя · вези в штаб':missionText(m)}</span><b>${MS.flag?1:0} / 1</b>`; return; }
  if(m.k==='clear'){ const here=m.loc===LOC_ID&&!LOC.safe; o.innerHTML=`<span class="lbl">Задание</span><span>${here?'Осталось роботов: '+enemiesLeft():missionText(m)}</span><b>${here?enemiesLeft():'—'}</b>`; return; }
  if(m.k==='evac'){ const here=m.loc===LOC_ID; o.innerHTML=`<span class="lbl">Задание</span><span>${here&&CIV.phase?'Выведи людей к выезду на лагерь':here?'Зачисти район · осталось '+enemiesLeft():missionText(m)}</span><b>${CIV.saved} / ${m.n}</b>`; return; }
  o.innerHTML=`<span class="lbl">Задание</span><span>${missionText(m)}</span><b>${Math.min(Math.floor(MS.prog),m.n||m.t)} / ${m.n||m.t}${m.k==='hold'?' с':''}</b>`; }
const HQ={x0:60.5,x1:70.5,z0:31.4,z1:37.5,in:false}, HQ_MARK={x:65.5,y:9.6,z:29.5};
let mcOpen=false;
function hqUpdate(){ if(LOC_ID!=='camp'||GAR.open||transit){ if(mcOpen) closeMC(); HQ.in=false; return; }
  const inside=TK.x>HQ.x0&&TK.x<HQ.x1&&TK.z>HQ.z0&&TK.z<HQ.z1; if(inside&&!HQ.in){ HQ.in=true; openMC(); } else if(!inside&&HQ.in){ HQ.in=false; closeMC(); } }
function openMC(){ const m=missionAt(MS.i); mcOpen=true; const story=MS.i<STORY.length, nt=MS.active?null:newTypeAt(MS.i);
  $('#mcKind').textContent=(MS.active?'Текущее задание':'Новое задание')+(story?` · ${MS.i+1} из ${STORY.length}`:''); $('#mcTitle').textContent=m.title||missionText(m); $('#mcObj').textContent=missionText(m);
  if(MS.active){ $('#mcInfo').textContent=`Награда ${m.r} лома`; $('#mcOk').textContent='Понял'; $('#mcLater').hidden=true; }
  else { const nr=rankFor(MS.i+1), left=MS.rank<RANKS.length-1?RANK_AT[MS.rank+1]-MS.i:0; $('#mcInfo').textContent=`Награда: ${m.r} лома`+(nr>MS.rank?` и звание «${RANKS[nr]}»`:left>0?` · до звания «${RANKS[MS.rank+1]}» ${left} ${left%10===1&&left%100!==11?'задание':left%10>=2&&left%10<=4&&(left%100<10||left%100>=20)?'задания':'заданий'}`:''); $('#mcOk').textContent='Принять'; $('#mcLater').hidden=false; }
  const nm=$('#mcName'); nm.textContent=nt?`Новый противник: ${ENAME[nt]}`:`${ENAME[m.k]||''} · ${EDESC[m.k]||''}`; nm.classList.toggle('new',!!nt);
  $('#mcard').hidden=false; sfxClick(); pvSet(nt||(m.k==='clear'?'katok':m.k));
  radioType($('#mcBrief'),(MS.active?'Задание в силе. ':'')+(m.brief||autoBrief(m))+(m.hint&&UP.tank!==m.hint.t?' '+m.hint.s:'')+(nt?' '+ENEMY_INTRO[nt]:''),$('#mcRav'),null); }
function closeMC(){ mcOpen=false; $('#mcard').hidden=true; radioStop(false); }
$('#mcBrief').addEventListener('click',e=>{ e.stopPropagation(); if(VOICE.timer) radioStop(true); });
function acceptMC(){ if(!MS.active){ MS.active=true; MS.prog=0; objUI(); toast('Задание принято · следуй за стрелкой'); sfxAccept(); save(); } closeMC(); canvas.focus(); }
$('#mcOk').addEventListener('click',e=>{ e.stopPropagation(); acceptMC(); });
$('#mcLater').addEventListener('click',e=>{ e.stopPropagation(); closeMC(); canvas.focus(); });

