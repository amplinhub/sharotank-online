/* ================= ECONOMY / SAVE ================= */
const ENG_V=[12.5,13.8,15.2,16.8], ENG_A=[16,18,20.5,23], ARM_HP=[100,140,185,240], CAL_R=[1.7,2.0,2.35,2.7], CAL_P=[1,1.15,1.3,1.45], CAL_NAME=['KX-90','KX-100','KX-115','KX-125'],
  LOAD_T=[1.25,1.0,0.8,0.6], STAB_K=[0,0.5,0.8], RK_N=[0,4,6];
const HEATM=new THREE.MeshBasicMaterial({color:0x2a2e33}); const _hc=new THREE.Color(), _hd=new THREE.Color(0x2a2e33), _hr=new THREE.Color(0xff2a10), _hy=new THREE.Color(0xffc060);
const MGS={gau:{name:'Миниган',code:'GAU-6M',speed:95,g:0,spread:0.011,rate:16,radius:0.33,power:0.55,spin:true,heat:0.03,cost:0,info:'6 стволов, раскрутка, 16 выстр/с'},
  twin:{name:'Спарка',code:'GAU-6M×2',speed:95,g:0,spread:0.014,rate:28,radius:0.33,power:0.55,spin:true,heat:0.019,cost:450,info:'2 блока стволов, 28 выстр/с'},
  kpv:{name:'Крупняк',code:'КПВ-14.5',speed:115,g:0,spread:0.005,rate:6.5,radius:0.62,power:0.8,spin:false,heat:0.08,cost:600,info:'1 тяжёлый ствол, грызёт стены'}};
const AMMO_CAP={mg:[600,900,1300,1800],cn:[30,45,65,90],rk:[24,36,48,64]};
const ST={scrap:1000,ammo:{mg:600,cn:30,rk:24},kits:{rep:0,ammo:0,art:0}}; const UP={engine:0,armor:0,cal:0,load:0,stab:0,rk:0,ammo:0,mg:'gau',own:{gau:1},rdr:0,tank:'base',tanks:{base:1},per:{},abl:0};
const MS={i:0,active:false,prog:0,rank:0,v:25};
function ammoCap(id){ return AMMO_CAP[id][UP.ammo]; }
function refillAmmo(){ for(const id of ['mg','cn','rk']) ST.ammo[id]=ammoCap(id); }
const SAVE_KEY='sharotank-5tl-v3';
function save(){ try{ localStorage.setItem(SAVE_KEY,JSON.stringify({scrap:Math.floor(ST.scrap),hp:TK.hp,dmg:TK.dmgS,up:UP,ammo:ST.ammo,ms:MS,kits:ST.kits,seen:SEEN})); }catch(e){} }
function loadSave(){ try{ const d=JSON.parse(localStorage.getItem(SAVE_KEY)||'null'); if(!d) return false; ST.scrap=d.scrap|0;
  const u=d.up||{}; for(const k of ['engine','armor','cal','load','stab','rk','ammo','rdr','abl']) if(typeof u[k]==='number') UP[k]=u[k]; if(MGS[u.mg]) UP.mg=u.mg; UP.own=Object.assign({gau:1},u.own||{}); UP.tanks=Object.assign({base:1},u.tanks||{}); UP.tank=(CHASSIS[u.tank]&&UP.tanks[u.tank])?u.tank:'base'; UP.per=u.per||{}; perFix();
  TK.hp=clamp(+d.hp||maxHP(),1,maxHP()); if(Array.isArray(d.dmg)) for(let i=0;i<5;i++) TK.dmgS[i]=clamp(+d.dmg[i]||0,0,1);
  refillAmmo(); if(d.ammo) for(const id of ['mg','cn','rk']) if(typeof d.ammo[id]==='number') ST.ammo[id]=clamp(d.ammo[id],0,ammoCap(id));
  if(d.kits){ ST.kits.rep=clamp(d.kits.rep|0,0,2); ST.kits.ammo=clamp(d.kits.ammo|0,0,2); ST.kits.art=clamp(d.kits.art|0,0,2); }
  if(d.ms){ MS.i=Math.max(0,d.ms.i|0); if(!d.ms.v){ MS.i+=Math.min(4,Math.floor(MS.i/4)); } MS.v=25; MS.active=!!d.ms.active; MS.prog=+d.ms.prog||0; MS.rank=rankFor(MS.i); MS.flag=!!d.ms.flag; if(d.seen) Object.assign(SEEN,d.seen); MS.fp=d.ms.fp==null?null:d.ms.fp|0; } return true; }catch(e){ return false; } }
let gainAcc=0, gainT=0;

