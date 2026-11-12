/* ================= TANK MODEL (hi = garage close-up, lo = in-game) ================= */
const gradTex=new THREE.DataTexture(new Uint8Array([80,165,255]),3,1,THREE.LuminanceFormat); gradTex.minFilter=gradTex.magFilter=THREE.NearestFilter; gradTex.generateMipmaps=false; gradTex.needsUpdate=true;
const outlineMat=new THREE.MeshBasicMaterial({color:0x060a14,side:THREE.BackSide});
const WHL=[[1.08,0.88],[-1.08,0.88],[1.08,-0.88],[-1.08,-0.88]];
function dmgMat(color,U){ const m=new THREE.MeshToonMaterial({color,gradientMap:gradTex});
  m.onBeforeCompile=sh=>{ sh.uniforms.uRootInv=U.rootInv; sh.uniforms.uDmg=U.dmg; sh.uniforms.uDmgTop=U.top;
    sh.vertexShader='uniform mat4 uRootInv;\nvarying vec3 vLP;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvLP=(uRootInv*modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader='uniform vec4 uDmg;\nuniform float uDmgTop;\nvarying vec3 vLP;\nfloat dHash(vec3 p){return fract(sin(dot(floor(p*9.0),vec3(12.9898,78.233,37.719)))*43758.5453);}\n'+
      sh.fragmentShader.replace('#include <dithering_fragment>',
      'float dw=uDmg.x*smoothstep(0.05,1.2,vLP.z)+uDmg.y*smoothstep(-0.05,-1.2,vLP.z)+uDmg.z*smoothstep(0.05,1.0,vLP.x)+uDmg.w*smoothstep(-0.05,-1.0,vLP.x)+uDmgTop*smoothstep(1.5,2.4,vLP.y);\n'+
      'float dn=dHash(vLP); float dk=clamp(dw*(0.45+0.85*dn),0.0,1.0); gl_FragColor.rgb*=1.0-0.8*dk; gl_FragColor.rgb+=vec3(0.32,0.1,0.0)*step(0.95,dn)*step(0.55,dw)*0.7;\n#include <dithering_fragment>'); };
  return m; }
const plateTex=(()=>{ const pc=document.createElement('canvas'); pc.width=160; pc.height=56; const pg=pc.getContext('2d'); pg.fillStyle='#2b363a'; pg.fillRect(0,0,160,56); pg.fillStyle='#c9d2cf'; pg.font='bold 38px Arial, sans-serif'; pg.textAlign='center'; pg.textBaseline='middle'; pg.fillText('5T-L',80,30); return new THREE.CanvasTexture(pc); })();
const plateMat=new THREE.MeshBasicMaterial({map:plateTex}); const plateGeo=new THREE.PlaneGeometry(0.9,0.32);
const glowMats={}; function glowMat(cc){ return glowMats[cc]||(glowMats[cc]=new THREE.MeshBasicMaterial({color:cc})); }
const TANK_SKIN={turret:0x6c9a80,chassis:0x2b363a,wheels:0x7a383d};
/* ================= v13: tank chassis — stats, weapon sets, ability upgrades and detailed models ================= */
const CHASSIS={
 base:{name:'Шаротанк 5T-L',cls:'Универсал',cost:0,hp:1,spd:1,acc:1,turn:1,ram:1,cn:1,abil:null,w:[0,1,2],mgs:['gau','twin','kpv'],arms:'пулемёт, пушка, ракеты',abN:'Без особенностей',abI:'надёжная стартовая машина, хороша во всём понемногу',desc:'Колёсный танк со сферической башней. С него начинают все водители лагеря.'},
 ten:{name:'ЛТ-7 «Тень»',cls:'Лёгкий',cost:1600,hp:0.7,spd:1.3,acc:1.35,turn:1.3,ram:0.6,cn:1,abil:'stealth',w:[0,1],mgs:['gau'],arms:'миниган и пушка',abN:'Маскировка',abI:'после паузы в стрельбе враги перестают замечать танк издалека, а первый выстрел из маскировки наносит двойной урон',desc:'Разведчик на колёсах-роликах с длинными рычагами подвески. Быстрый, вёрткий и хрупкий.'},
 krep:{name:'ТТ-14 «Крепость»',cls:'Тяжёлый',cost:2600,hp:1.75,spd:0.72,acc:0.7,turn:0.78,ram:2,cn:1.1,abil:'shield',w:[0,1],mgs:['twin'],arms:'спаренный пулемёт и трёхствольная пушка',abN:'Щит (E)',abI:'на стоянке раскрывает створки и поднимает купол: снаружи по танку не попасть, а сам он стреляет. Пока купол стоит, танк не двигается',desc:'Шестиколёсная бронированная махина с кабиной-аквариумом и дымящей трубой. Медленная, но выдерживает всё.'},
 igla:{name:'ПТ-6 «Игла»',cls:'Дальнобойный',cost:2200,hp:0.9,spd:0.95,acc:0.9,turn:0.9,ram:0.8,cn:1.7,abil:'rail',w:[1,2],mgs:[],arms:'сдвоенный рельсотрон и ракеты',abN:'Рельсотрон',abI:'вместо снаряда — сдвоенный мгновенный луч от 70 м (длиннее с улучшением рельсов): прошивает всех роботов на линии и бьёт за ними',desc:'Длинный шестиколёсный истребитель с вытянутой башней и двумя энергетическими стволами. Мощный магнит притягивает лом вдвое дальше, а по кнопке E создаёт сильное магнитное поле: ещё вдвое шире на 5 с.'},
 kovch:{name:'БТР-9 «Ковчег»',cls:'Носитель дрона',cost:2800,hp:1.35,spd:0.9,acc:0.85,turn:0.85,ram:1.5,cn:1,abil:'gdrone',w:[0,1],mgs:['gau','twin','kpv'],arms:'пулемёт и пушка в кормовой башне',abN:'Боевой дрон (E)',abI:'из люка в крыше взлетает крупный дрон со спаренными пулемётами: 15 с кружит рядом и бьёт ближайших врагов, уворачивается от четверти пуль, затем самоуничтожается со взрывом. Новый — раз в 15 с',desc:'Восьмиколёсный бронетранспортёр с ангаром для боевого дрона в середине корпуса. Тяжёлый и неторопливый, но в бою никогда не один.'},
 pchela:{name:'ИТ-1 «Пчела»',cls:'Инженерный',cost:2000,hp:1.05,spd:0.95,acc:1,turn:1,ram:1,cn:0.85,abil:'drones',w:[0],mgs:['gau','twin','kpv'],arms:'только пулемёт',abN:'Рой камикадзе',abI:'дроны-камикадзе кружат над танком и таранят ближайшего врага со взрывом, новые вылетают из люка в корме. Сначала один, улучшается до трёх',desc:'Бронеавтомобиль с ульем для дронов на корме. Сам стреляет только из пулемёта, зато не воюет один.'}};
const CH_ORDER=['base','ten','krep','igla','pchela','kovch'];
function chs(){ return CHASSIS[UP.tank]||CHASSIS.base; }
const ABL={ten:{t:'Маскировка',cur:l=>`включается через ${[2,1.5,1][l]} с · видят с ${[15,12,9][l]} м`,info:'Быстрее уходит в тень, враги замечают её с меньшего расстояния.'},
 krep:{t:'Генератор щита',cur:l=>`щит ${[260,340,420][l]} ед.`,info:'Купол выдерживает больше попаданий, прежде чем погаснет.'},
 igla:{t:'Накопитель рельсотрона',cur:l=>`урон луча ×${[1,1.2,1.4][l]}`,info:'Луч рельсотрона бьёт сильнее.'},
 kovch:{t:'Огневая мощь дрона',cur:l=>`урон ×${GD_DMGK[l]} · ${GD_RATE[l]} выстр/с`,info:'Пулемёты дрона бьют сильнее и чаще.'},
 pchela:{t:'Рой камикадзе',cur:l=>`${l+1} ${l?'дрона':'дрон'} в рое`,info:'Больше дронов-камикадзе одновременно кружит над танком.'}};
const GD_DMGK=[1,1.3,1.6], GD_RATE=[8,10,12];
const STL_DELAY=[2,1.5,1], STL_R=[15,12,9], SHD_MAX=[260,340,420], RAIL_K=[1,1.2,1.4];
function chWheel(T,o,x,y0,z,r,w,tc,hc,opt){ const g=new THREE.Group(); g.position.set(x,y0,z); T.root.add(g); const sp=new THREE.Group(); g.add(sp); const sd=Math.sign(x)||1;
  o.add(o.xc(o.Cy(r,r,w,16*o.S)),tc,sp,0,0,0,o.hi?1.04:1.06); o.add(o.xc(o.Cy(r*0.58,r*0.58,w+0.02,12*o.S)),hc,sp,0,0,0);
  if(opt.rim){ o.add(o.xc(o.Cy(r*0.44,r*0.44,0.05,14)),opt.rim,sp,sd*(w/2+0.015),0,0); o.add(o.xc(o.Cy(r*0.16,r*0.2,0.12,10)),0x2a2e33,sp,sd*(w/2+0.05),0,0); }
  if(o.hi&&opt.rim) for(let k=0;k<6;k++){ const a=k/6*TAU; o.add(o.xc(o.Cy(0.03,0.03,0.06,6)),0x3b424c,sp,sd*(w/2+0.04),Math.cos(a)*r*0.3,Math.sin(a)*r*0.3); }
  const nl=o.hi?16:9, lg=o.B(w+0.03,0.1,0.15); for(let k=0;k<nl;k++){ const a=k/nl*TAU; const l=o.add(lg,opt.lug||tc,sp,0,Math.cos(a)*r,Math.sin(a)*r); l.rotation.x=-a; }
  if(o.hi&&opt.lug) for(let k=0;k<nl;k++){ const a=(k+0.5)/nl*TAU; for(const s of [-1,1]){ const l=o.add(o.B(w*0.32,0.07,0.12),opt.lug,sp,s*w*0.25,Math.cos(a)*r,Math.sin(a)*r); l.rotation.x=-a; } }
  g.userData={y0,wi:opt.wi,st:opt.st||0,rs:0.56/r}; T.wheels.push(g); T.spins.push(sp); return sp; }
function chBeacon(T,par,x,y,z){ T.beacon=new THREE.Mesh(new THREE.SphereGeometry(0.07,8,6),new THREE.MeshBasicMaterial({color:0xffb53a})); T.beacon.userData.keep=true; T.beacon.position.set(x,y,z); par.add(T.beacon); }
function chRivets(o,par,col,pts){ if(!o.hi) return; for(const [x,y,z,ax] of pts){ const g=ax==='x'?o.xc(o.Cy(0.028,0.028,0.04,6)):ax==='z'?o.zc(o.Cy(0.028,0.028,0.04,6)):o.Cy(0.028,0.028,0.04,6); o.add(g,col,par,x,y,z); } }
function chAntenna(o,par,x,y,z,h,col){ o.add(o.Cy(0.03,0.04,0.12,8),0x2a2e33,par,x,y+0.06,z); o.add(o.Cy(0.016,0.01,h,6),col||0x1d2226,par,x,y+h/2+0.1,z); if(o.hi) o.add(new THREE.SphereGeometry(0.035,6,4),0x1d2226,par,x,y+h+0.12,z); }
const CH_BUILD={
 /* «Тень» — ref: rover with omni-roller wheels on long articulated arms and a black glass canopy; stealth graphite */
 ten(T,o){ const {add,B,Cy,xc,zc,hi}=o, Sp=T.susp, Tu=T.turret, C=0x30363b, C2=0x262b30, D=0x15191c, G=0x0b1115, A=0x4a535b, GL=glowMat(0x5dff9a);
  for(const [x,z,wi] of [[1.45,1.22,0],[-1.45,1.22,1],[1.45,-1.18,2],[-1.45,-1.18,3]]){ const sp=chWheel(T,o,x,0.5,z,0.5,0.44,0x101316,0x5b646c,{wi,st:z>0?1:-1,lug:0x1d2226,rim:A});
    add(xc(Cy(0.09,0.09,0.5,8)),GL,sp,0,0,0); const n=hi?14:8; for(let k=0;k<n;k++){ const a=(k+0.5)/n*TAU, rl=add(Cy(0.07,0.07,0.36,8),0x23282c,sp,0,Math.cos(a)*0.5,Math.sin(a)*0.5); rl.rotation.x=-a; } }
  for(const s of [-1,1]) for(const z of [1.22,-1.18]){ const a=add(B(1.0,0.13,0.17),A,Sp,s*0.97,0.66,z*0.93,true); a.rotation.z=s*-0.2; const a2=add(B(0.6,0.08,0.1),C2,Sp,s*0.8,0.84,z*0.9); a2.rotation.z=s*-0.32;
    add(B(0.14,0.14,0.46),D,Sp,s*0.52,0.78,z*0.86); add(xc(Cy(0.14,0.14,0.2,12)),D,Sp,s*1.32,0.52,z); add(xc(Cy(0.09,0.09,0.24,10)),A,Sp,s*0.5,0.78,z*0.86); if(hi) add(Cy(0.05,0.05,0.32,8),0x8a9096,Sp,s*0.75,0.98,z*0.88); }
  add(B(1.2,0.55,2.2),C,Sp,0,0.98,-0.2,true); const nose=add(xc(Cy(0.6,0.6,1.2,18*o.S)),C,Sp,0,0.98,0.9,true); nose.scale.set(1,0.48,1); add(B(1.24,0.06,2.1),D,Sp,0,0.72,-0.2);
  const cp=add(B(1.02,0.42,0.95),G,Sp,0,1.32,0.62,true); cp.rotation.x=0.2; add(B(1.08,0.07,1.05),A,Sp,0,1.56,0.55); for(const s of [-1,1]) add(B(0.08,0.42,0.08),A,Sp,s*0.5,1.36,1.02);
  add(B(0.86,0.03,0.02),GL,Sp,0,1.2,1.1); for(const s of [-1,1]){ add(B(0.02,0.05,1.8),GL,Sp,s*0.61,1.06,-0.25); add(xc(Cy(0.22,0.22,0.3,12)),D,Sp,s*0.42,1.0,-1.3,true); add(xc(Cy(0.12,0.12,0.32,10)),glowMat(0x1d6b46),Sp,s*0.42,1.0,-1.32);
    add(zc(Cy(0.07,0.07,0.04,10)),glowMat(0xe8fff2),Sp,s*0.38,0.98,1.2); add(B(0.04,0.12,0.18),A,Sp,s*0.62,1.48,0.95); add(B(0.03,0.1,0.14),G,Sp,s*0.66,1.48,1.0); }
  add(B(0.9,0.06,0.04),glowMat(0xff3a3a),Sp,0,1.05,-1.31);
  if(hi){ for(let k=0;k<4;k++) add(B(1.22,0.012,0.012),D,Sp,0,1.26,-1.1+k*0.42); for(let k=0;k<6;k++) add(B(0.5,0.02,0.04),D,Sp,0,1.27,-0.45-k*0.1);
    chRivets(o,Sp,A,[[0.61,0.85,0.4,'x'],[0.61,0.85,-0.3,'x'],[0.61,0.85,-1.0,'x'],[-0.61,0.85,0.4,'x'],[-0.61,0.85,-0.3,'x'],[-0.61,0.85,-1.0,'x']]);
    add(B(0.5,0.05,0.3),0x8a9096,Sp,0,1.27,-0.95); add(B(0.08,0.08,0.3),D,Sp,0.3,0.7,1.32); add(B(0.08,0.08,0.3),D,Sp,-0.3,0.7,1.32); }
  Sp.add(T.stab); T.stab.position.set(0,1.65,-0.45); T.stab.add(Tu);
  add(B(0.74,0.4,0.9),C2,Sp,0,1.45,-0.45,true); add(B(0.78,0.04,0.94),A,Sp,0,1.27,-0.45); add(B(0.04,0.3,0.5),GL,Sp,0.38,1.46,-0.45); add(B(0.04,0.3,0.5),GL,Sp,-0.38,1.46,-0.45);
  add(Cy(0.5,0.55,0.1,16),D,Tu,0,0.03,0,true); add(B(0.86,0.32,1.0),A,Tu,0,0.2,0,true); const wd=add(B(0.86,0.1,0.4),A,Tu,0,0.33,0.62); wd.rotation.x=0.4; add(B(0.6,0.12,0.62),D,Tu,0,0.42,-0.12);
  add(B(0.3,0.16,0.2),G,Tu,0.25,0.44,0.3); add(B(0.22,0.04,0.02),GL,Tu,0.25,0.44,0.41); chAntenna(o,Tu,-0.32,0.38,-0.38,1.6); chBeacon(T,Tu,-0.32,2.12,-0.38);
  if(hi){ add(B(0.88,0.012,0.012),D,Tu,0,0.36,-0.25); chRivets(o,Tu,D,[[0.43,0.2,0.3,'x'],[0.43,0.2,-0.3,'x'],[-0.43,0.2,0.3,'x'],[-0.43,0.2,-0.3,'x']]); add(B(0.18,0.18,0.3),C2,Tu,-0.5,0.2,-0.2,true); }
  T.gun.position.set(0,0.2,0.48); },
 /* «Крепость» — ref: orange 6x6 armoured truck; triple rotary cannon, twin MG, vertical smoking exhaust */
 krep(T,o){ const {add,B,Cy,zc,xc,hi}=o, Sp=T.susp, Tu=T.turret, O=0xe0582a, O2=0xc84a22, D=0x2a2d31, Gl=0x14222a, M=0x5a5f64, Y=0xf0a030;
  for(const [x,z,wi,st] of [[1.2,1.3,0,1],[-1.2,1.3,1,1],[1.2,0.02,-1,0],[-1.2,0.02,-1,0],[1.2,-1.26,2,0],[-1.2,-1.26,3,0]]) chWheel(T,o,x,0.62,z,0.62,0.56,0x2e2a27,Y,{wi,st,lug:0x221f1d,rim:D});
  add(B(1.7,0.45,3.7),D,Sp,0,0.88,0,true); for(const s of [-1,1]) for(const z of [0.66,-0.62]){ add(B(0.5,0.16,0.08),D,Sp,s*1.2,1.0,z); if(hi) add(B(0.52,0.4,0.04),0x1a1c1f,Sp,s*1.2,0.78,z-0.05); }
  add(B(2.05,1.1,1.15),O,Sp,0,1.62,1.25,true); add(B(1.78,0.72,0.04),D,Sp,0,1.76,1.83); add(B(1.62,0.58,0.04),Gl,Sp,0,1.77,1.85); add(B(0.04,0.58,0.05),D,Sp,0,1.77,1.86);
  for(const s of [-1,1]){ add(B(0.04,0.48,0.62),Gl,Sp,s*1.03,1.8,1.28); add(zc(Cy(0.12,0.12,0.08,12)),glowMat(0xfff2d2),Sp,s*0.86,1.08,1.96); add(zc(Cy(0.07,0.07,0.06,10)),glowMat(0xfff2d2),Sp,s*0.5,2.1,1.84);
    const ma=add(B(0.3,0.04,0.04),D,Sp,s*1.18,1.95,1.6); ma.rotation.y=s*0.4; add(B(0.06,0.22,0.14),D,Sp,s*1.33,1.9,1.52); add(B(0.05,0.12,0.12),glowMat(0xffb53a),Sp,s*0.98,1.32,1.86); }
  add(B(2.15,0.26,0.28),D,Sp,0,0.98,1.92,true); for(let k=0;k<5;k++) add(B(0.08,0.2,0.06),M,Sp,-0.5+k*0.25,1.2,1.84); add(B(0.4,0.1,0.12),Y,Sp,0,0.94,2.08);
  add(B(2.15,1.35,2.3),O,Sp,0,1.75,-0.6,true); for(const s of [-1,1]){ for(let k=0;k<2;k++){ add(B(0.05,0.72,0.9),O2,Sp,s*1.1,1.78,-0.12-k*1.0); if(hi){ add(B(0.06,0.04,0.3),D,Sp,s*1.12,1.95,-0.12-k*1.0); chRivets(o,Sp,D,[[s*1.13,2.1,0.25-k,'x'],[s*1.13,2.1,-0.48-k,'x'],[s*1.13,1.46,0.25-k,'x'],[s*1.13,1.46,-0.48-k,'x']]); } }
    add(B(0.05,0.08,1.9),D,Sp,s*1.1,1.18,-0.6); add(zc(Cy(0.13,0.13,0.08,12)),glowMat(0xffd27a),Sp,s*0.8,1.95,-1.78); add(xc(Cy(0.16,0.16,0.7,12)),M,Sp,s*0.95,0.95,-0.1,true); }
  add(B(1.95,0.06,2.1),D,Sp,0,2.45,-0.6); for(let k=0;k<5;k++) add(B(1.95,0.04,0.04),M,Sp,0,2.52,-1.5+k*0.45); add(B(0.5,0.3,0.4),M,Sp,0.55,2.62,-1.25,true);
  add(B(0.6,0.9,0.06),O2,Sp,0,1.75,-1.77); add(B(0.08,0.2,0.06),D,Sp,0.22,1.75,-1.8); add(B(0.3,0.3,0.02),glowMat(0xffc94a),Sp,-0.55,2.15,-1.77); if(hi) for(let k=0;k<6;k++) add(B(0.4,0.04,0.06),M,Sp,0.75,0.95+k*0.22,-1.82);
  const ex=add(Cy(0.11,0.12,1.5,12),M,Sp,-0.9,2.6,0.55,true); add(Cy(0.14,0.14,0.12,12),D,Sp,-0.9,3.38,0.55); add(B(0.3,0.06,0.3),D,Sp,-0.9,3.46,0.55); add(B(0.12,0.4,0.2),D,Sp,-0.9,2.2,0.55); T.exh=new THREE.Object3D(); T.exh.position.set(-0.9,3.5,0.55); Sp.add(T.exh);
  for(const [x,z,h] of [[0.8,1.55,1.5],[-0.55,1.5,1.0],[0.88,-1.55,1.8],[0.62,-1.62,1.25],[-0.7,-1.6,1.4]]) chAntenna(o,Sp,x,2.22,z,h);
  T.flaps=[]; for(const s of [-1,1]){ const f=new THREE.Group(); f.position.set(s*1.12,2.42,-0.6); Sp.add(f); add(B(0.08,0.95,2.0),O2,f,s*0.04,-0.48,0,true); add(B(0.03,0.06,1.8),glowMat(0x7fe8ff),f,s*0.1,-0.25,0); for(let k=0;k<3;k++) add(B(0.03,0.6,0.05),D,f,s*0.09,-0.5,-0.7+k*0.7); f.userData.s=s; T.flaps.push(f); }
  const em=new THREE.Group(); em.position.set(-0.4,2.5,-1.2); Sp.add(em); add(Cy(0.07,0.07,0.32,8),M,em,0,0.16,0); const dish=add(new THREE.SphereGeometry(0.42,14,6,0,TAU,0,Math.PI/2.6),M,em,0,0.42,0,true); dish.rotation.x=Math.PI; add(new THREE.SphereGeometry(0.1,8,6),glowMat(0x7fe8ff),em,0,0.26,0); T.spinners.push(em);
  Sp.add(T.stab); T.stab.position.set(0,2.2,0.7); T.stab.add(Tu); add(Cy(0.58,0.64,0.16,18),D,Tu,0,0.04,0,true); add(B(1.1,0.5,1.1),O,Tu,0,0.36,-0.05,true); add(B(1.0,0.06,1.0),D,Tu,0,0.63,-0.05);
  add(B(0.32,0.26,0.3),M,Tu,0.42,0.76,-0.25,true); add(B(0.26,0.04,0.02),glowMat(0x7fe8ff),Tu,0.42,0.78,-0.09); for(const s of [-1,1]) add(B(0.06,0.4,0.6),O2,Tu,s*0.58,0.36,0.1);
  chRivets(o,Tu,D,[[0.56,0.5,-0.4,'x'],[-0.56,0.5,-0.4,'x'],[0.56,0.2,-0.4,'x'],[-0.56,0.2,-0.4,'x']]); chBeacon(T,Tu,-0.4,0.75,-0.35);
  T.gun.position.set(0,0.38,0.52); T.customCn=true; add(B(0.66,0.56,0.5),D,T.cn,0,0,0.2,true); add(zc(Cy(0.34,0.34,0.16,16)),M,T.cn,0,0,0.5,true);
  const sp=new THREE.Group(); sp.position.z=0.55; T.cn.add(sp); T.cnSpin=sp; for(let k=0;k<3;k++){ const a=k/3*TAU; add(zc(Cy(0.09,0.1,2.0,10*o.S)),0x454d55,sp,Math.cos(a)*0.17,Math.sin(a)*0.17,1.0,true); add(zc(Cy(0.12,0.12,0.18,10)),0x2a3036,sp,Math.cos(a)*0.17,Math.sin(a)*0.17,1.95); }
  add(zc(Cy(0.3,0.3,0.1,14)),0x2a3036,sp,0,0,0.6,true); add(zc(Cy(0.3,0.3,0.08,14)),0x2a3036,sp,0,0,1.5,true); T.cnMuz.position.set(0,0,2.6); T.cn.add(T.cnMuz); },
 /* «Игла» — wheeled 6x6 tank destroyer, long stretched turret with a twin energy cannon (ref: crimson tank with twin glowing cells) */
 igla(T,o){ const {add,B,Cy,xc,zc,hi}=o, Sp=T.susp, Tu=T.turret, R=0xb8323a, Rd=0x8c2630, D=0x2e1b20, Te=0x3fd0c0, BL=glowMat(0x7fe8ff), M=0x5a5f64;
  for(const [x,z,wi,st] of [[1.18,1.35,0,1],[-1.18,1.35,1,1],[1.18,0.05,-1,0],[-1.18,0.05,-1,0],[1.18,-1.25,2,0],[-1.18,-1.25,3,0]]) chWheel(T,o,x,0.55,z,0.55,0.48,0x2a2224,0x3a2a2e,{wi,st,lug:0x17110f,rim:Te});
  add(B(1.6,0.62,3.9),R,Sp,0,1.02,0.05,true); const nose=add(B(1.6,0.14,1.0),R,Sp,0,1.26,2.05,true); nose.rotation.x=0.38; add(B(1.0,0.03,0.5),Rd,nose,0,0.08,0);
  for(const s of [-1,1]){ add(B(0.08,0.32,3.6),Rd,Sp,s*0.82,0.86,0); add(B(0.1,0.05,3.5),Te,Sp,s*0.86,1.12,0); for(const z of [1.35,0.05,-1.25]){ add(B(0.66,0.08,1.36),R,Sp,s*1.22,1.34,z,true); add(B(0.06,0.24,1.36),Rd,Sp,s*1.52,1.22,z); }
    add(zc(Cy(0.1,0.1,0.06,10)),D,Sp,s*0.48,1.12,2.42); add(new THREE.SphereGeometry(0.055,8,6),BL,Sp,s*0.48,1.12,2.46); add(B(0.12,0.12,0.04),glowMat(0xff3a3a),Sp,s*0.6,1.1,-1.9); }
  add(B(1.3,0.08,1.0),D,Sp,0,1.34,-1.3); if(hi){ for(let k=0;k<7;k++) add(B(1.1,0.02,0.04),M,Sp,0,1.39,-1.7+k*0.12); for(let k=0;k<5;k++) add(B(1.62,0.012,0.012),D,Sp,0,1.1,-1.6+k*0.8);
    chRivets(o,Sp,D,[[0.81,1.0,1.2,'x'],[0.81,1.0,0.2,'x'],[0.81,1.0,-0.8,'x'],[-0.81,1.0,1.2,'x'],[-0.81,1.0,0.2,'x'],[-0.81,1.0,-0.8,'x']]); add(B(0.4,0.2,0.3),M,Sp,0.5,1.42,-1.6,true); add(B(0.4,0.2,0.3),M,Sp,-0.5,1.42,-1.6,true); }
  Sp.add(T.stab); T.stab.position.set(0,1.42,-0.45); T.stab.add(Tu);
  add(Cy(0.68,0.76,0.16,18),D,Tu,0,0.05,0,true); add(B(1.2,0.55,2.9),R,Tu,0,0.38,0.35,true); const wg=add(B(1.2,0.12,0.8),R,Tu,0,0.62,1.75,true); wg.rotation.x=0.3; add(B(1.05,0.14,2.4),Rd,Tu,0,0.7,0.1);
  add(B(1.24,0.08,0.06),Te,Tu,0,0.5,1.82); add(B(1.0,0.3,0.6),D,Tu,0,0.36,-1.3,true); for(const s of [-1,1]){ add(B(0.06,0.32,2.2),Rd,Tu,s*0.62,0.36,0.4); add(B(0.04,0.04,2.0),BL,Tu,s*0.64,0.5,0.4); }
  add(B(0.3,0.2,0.36),M,Tu,0.38,0.88,-0.4,true); add(B(0.24,0.12,0.02),BL,Tu,0.38,0.9,-0.21); chAntenna(o,Tu,-0.4,0.78,-0.9,1.2); chBeacon(T,Tu,-0.4,2.1,-0.9);
  if(hi) chRivets(o,Tu,D,[[0.61,0.55,1.2,'x'],[0.61,0.55,-0.6,'x'],[-0.61,0.55,1.2,'x'],[-0.61,0.55,-0.6,'x'],[0.4,0.66,1.3],[-0.4,0.66,1.3]]);
  T.noMg=true; T.customCn=true; T.gun.position.set(0,0.36,1.95);
  const CM=T.coilM=[0,1,2,3,4,5,6].map(()=>new THREE.MeshBasicMaterial({color:0x245a6c})), cmz=z=>CM[clamp(Math.floor((z-0.7)/0.36),0,6)];
  add(B(0.92,0.42,0.6),D,T.cn,0,0,0.15,true); for(const s of [-1,1]){ add(zc(Cy(0.11,0.12,2.6,12*o.S)),0x3a3f46,T.cn,s*0.26,0,1.6,true); for(let k=0;k<4;k++){ add(zc(Cy(0.17,0.17,0.12,12)),Te,T.cn,s*0.26,0,0.75+k*0.42); add(zc(Cy(0.175,0.175,0.03,12)),cmz(0.84+k*0.42),T.cn,s*0.26,0,0.84+k*0.42); }
    add(zc(Cy(0.15,0.13,0.22,12)),D,T.cn,s*0.26,0,2.95,true); add(zc(Cy(0.07,0.07,0.04,10)),CM[6],T.cn,s*0.26,0,3.07); }
  add(B(0.2,0.06,2.3),BL,T.cn,0,0,1.6); add(B(0.3,0.14,2.3),D,T.cn,0,-0.1,1.6);
  for(let k=0;k<(o.up.cal|0);k++) for(const s of [-1,1]){ add(zc(Cy(0.21,0.21,0.1,12)),Te,T.cn,s*0.26,0,0.96+k*0.42); add(zc(Cy(0.215,0.215,0.025,12)),cmz(0.96+k*0.42),T.cn,s*0.26,0,0.96+k*0.42); }
  if((o.up.cal|0)>=2) for(const s of [-1,1]) add(zc(Cy(0.15,0.19,0.4,12)),M,T.cn,s*0.26,0,3.2,true);
  for(let k=0;k<(o.up.load|0);k++){ add(B(0.26,0.26,0.5),D,Tu,(k-1)*0.34,0.66,-1.3,true); add(B(0.28,0.03,0.36),BL,Tu,(k-1)*0.34,0.8,-1.3); }
  T.cnMuz.position.set(0,0,3.1); T.cn.add(T.cnMuz); T.rkPos=new THREE.Vector3(-0.95,0.1,-1.6); },
 /* «Пчела» — ref: white/red armoured car; drone hive with an opening hatch, machine gun only */
 pchela(T,o){ const {add,B,Cy,zc,xc,hi}=o, Sp=T.susp, Tu=T.turret, W=0xe8e6df, W2=0xcfccc4, Rr=0xd8322a, Or=0xf0a030, D=0x2a2e33, M=0x8a9096;
  for(const [x,z,wi,st] of [[1.22,1.15,0,1],[-1.22,1.15,1,1],[1.22,-1.15,2,0],[-1.22,-1.15,3,0]]) chWheel(T,o,x,0.62,z,0.62,0.56,0x2a2a2c,M,{wi,st,lug:0x1c1c1e,rim:0xd8d6cf});
  add(B(1.78,0.78,3.0),W,Sp,0,1.15,-0.12,true); const n=add(B(1.72,0.12,1.05),W,Sp,0,1.36,1.42,true); n.rotation.x=0.42; add(B(1.0,0.03,0.62),Rr,n,0,0.07,0.02); add(B(0.2,0.03,0.2),D,n,0.55,0.07,-0.2);
  add(B(1.52,0.42,1.85),W,Sp,0,1.75,-0.5,true); add(B(1.24,0.18,0.05),0x1a2228,Sp,0,1.72,0.44); add(B(1.3,0.04,0.06),Or,Sp,0,1.84,0.44);
  for(const s of [-1,1]){ add(B(0.02,0.26,1.65),Rr,Sp,s*0.9,1.0,-0.35); add(B(0.03,0.32,0.4),Or,Sp,s*0.9,1.18,0.9); add(B(0.05,0.46,0.72),W2,Sp,s*0.91,1.22,-0.05,true); add(B(0.05,0.08,0.3),D,Sp,s*0.935,1.22,-0.05);
    for(const z of [1.15,-1.15]){ const f=add(B(0.72,0.1,1.44),W,Sp,s*1.24,1.52,z,true); f.rotation.z=s*0.05; add(B(0.7,0.03,0.2),Rr,Sp,s*1.24,1.58,z+0.52); add(B(0.04,0.2,1.36),W2,Sp,s*1.59,1.42,z); } add(zc(Cy(0.06,0.06,0.05,8)),glowMat(0xffb53a),Sp,s*0.85,1.38,1.0); }
  add(B(0.95,0.24,0.12),Or,Sp,0,0.84,1.34); add(B(1.66,0.22,0.24),D,Sp,0,0.82,1.48,true); for(const s of [-1,1]){ add(B(0.2,0.1,0.04),glowMat(0xfff2d2),Sp,s*0.62,1.0,1.62); add(B(0.1,0.18,0.12),Or,Sp,s*0.4,0.74,1.62); }
  add(B(0.8,0.06,0.04),glowMat(0xff3a3a),Sp,0,1.1,-1.63); add(B(0.5,0.4,0.06),W2,Sp,0.4,1.15,-1.64); if(hi){ for(let k=0;k<4;k++) add(B(1.8,0.012,0.012),D,Sp,0,0.95+k*0.12,-1.645);
    chRivets(o,Sp,M,[[0.89,1.5,0.6,'x'],[0.89,1.5,-0.2,'x'],[0.89,1.5,-1.0,'x'],[-0.89,1.5,0.6,'x'],[-0.89,1.5,-0.2,'x'],[-0.89,1.5,-1.0,'x']]); add(B(0.08,0.4,0.08),D,Sp,0.8,1.5,-1.6); add(B(0.08,0.4,0.08),D,Sp,0.6,1.5,-1.6); }
  add(B(1.25,0.36,0.92),D,Sp,0,2.12,-1.0,true); for(let k=0;k<3;k++){ if(k===1) continue; add(Cy(0.18,0.18,0.05,6),Or,Sp,-0.4+k*0.4,2.32,-1.0); add(Cy(0.1,0.1,0.06,6),D,Sp,-0.4+k*0.4,2.34,-1.0); }
  const hatch=new THREE.Group(); hatch.position.set(0,2.31,-0.82); Sp.add(hatch); add(Cy(0.2,0.2,0.05,6),Or,hatch,0,0,-0.18,true); add(B(0.12,0.03,0.08),D,hatch,0,0.03,-0.18); T.hatch=hatch;
  T.hatchPt=new THREE.Object3D(); T.hatchPt.position.set(0,2.4,-1.0); Sp.add(T.hatchPt); add(Cy(0.16,0.16,0.02,6),0x05080a,Sp,0,2.3,-1.0);
  for(const [x,z,h] of [[0.7,-1.5,1.4],[-0.72,-1.45,1.1]]) chAntenna(o,Sp,x,2.28,z,h);
  Sp.add(T.stab); T.stab.position.set(0,1.98,0.2); T.stab.add(Tu); add(Cy(0.55,0.6,0.14,16),D,Tu,0,0.04,0,true); add(B(1.05,0.46,1.25),W,Tu,0,0.32,0,true); add(B(0.7,0.03,0.6),Rr,Tu,0,0.56,0.15);
  add(B(0.3,0.26,0.36),M,Tu,-0.45,0.62,-0.3,true); add(B(0.26,0.06,0.02),glowMat(0x7fe8ff),Tu,-0.45,0.64,-0.11); for(const s of [-1,1]) add(B(0.06,0.3,0.9),W2,Tu,s*0.54,0.3,0.05);
  chRivets(o,Tu,M,[[0.53,0.45,0.4,'x'],[-0.53,0.45,0.4,'x'],[0.53,0.45,-0.4,'x'],[-0.53,0.45,-0.4,'x']]); chBeacon(T,Tu,0.42,0.72,-0.4);
  T.customCn=true; T.gun.position.set(0,0.32,0.62); },
 /* «Ковчег» — original 8x8 armoured carrier: long faceted hull, offset driver cab, mid-hull drone bay with split doors, compact turret near the stern */
 kovch(T,o){ const {add,B,Cy,zc,xc,hi}=o, Sp=T.susp, Tu=T.turret, K=0x7d7a5a, K2=0x66634a, K3=0x8e8b6a, D=0x2b2e2c, M=0x5a5f64, Or=0xf0a030, GL=glowMat(0x8fe8ff), LT=glowMat(0xfff2d2), RD=glowMat(0xff3a3a), AM=glowMat(0xffb53a);
  for(const [x,z,wi,st] of [[1.18,1.68,0,1],[-1.18,1.68,1,1],[1.18,0.6,-1,0.55],[-1.18,0.6,-1,0.55],[1.18,-0.6,-1,0],[-1.18,-0.6,-1,0],[1.18,-1.68,2,0],[-1.18,-1.68,3,0]]) chWheel(T,o,x,0.5,z,0.5,0.42,0x262624,0x4a4c40,{wi,st,lug:0x1b1b1a,rim:K2});
  add(B(1.46,0.5,4.75),D,Sp,0,0.86,0,true);
  add(B(2.1,0.64,4.25),K,Sp,0,1.47,-0.12,true); add(B(1.62,0.12,3.95),K2,Sp,0,1.84,-0.2,true);
  for(const s of [-1,1]){ const sh=add(B(0.34,0.12,4.05),K3,Sp,s*0.93,1.76,-0.18,true); sh.rotation.z=s*-0.55; }
  const gl=add(B(1.95,0.12,0.92),K,Sp,0,1.64,2.0,true); gl.rotation.x=0.42; add(B(1.2,0.03,0.5),K2,gl,0,0.07,0.1);
  const lf=add(B(2.0,0.56,0.12),K2,Sp,0,1.0,2.38,true); lf.rotation.x=-0.34;
  const cab=add(B(0.74,0.36,0.86),K,Sp,-0.5,2.0,1.26,true); add(B(0.74,0.08,0.3),K3,Sp,-0.5,2.15,1.74).rotation.x=0.5; for(let k=0;k<3;k++) add(B(0.16,0.06,0.03),GL,Sp,-0.74+k*0.24,2.04,1.7);
  for(const s of [-1,1]) add(B(0.03,0.06,0.3),GL,Sp,-0.5+s*0.375,2.04,1.38);
  add(Cy(0.3,0.34,0.24,14*o.S),K2,Sp,0.48,2.0,1.0,true); add(Cy(0.26,0.26,0.06,14),D,Sp,0.48,2.14,1.0); for(let k=0;k<5;k++){ const a=-0.9+k*0.45; add(B(0.1,0.08,0.06),GL,Sp,0.48+Math.sin(a)*0.3,2.02,1.0+Math.cos(a)*0.3).rotation.y=a; }
  for(const s of [-1,1]){ add(B(0.42,0.24,0.1),D,Sp,s*0.68,1.28,2.36,true); add(zc(Cy(0.08,0.08,0.05,10)),LT,Sp,s*0.56,1.28,2.44); add(zc(Cy(0.08,0.08,0.05,10)),LT,Sp,s*0.8,1.28,2.44); add(B(0.12,0.06,0.04),AM,Sp,s*0.92,1.12,2.47);
    if(hi) for(let k=0;k<3;k++) add(B(0.4,0.02,0.02),D,Sp,s*0.68,1.21+k*0.07,2.48); }
  add(B(2.2,0.22,0.26),D,Sp,0,0.78,2.5,true); add(xc(Cy(0.13,0.13,0.72,12)),M,Sp,0,0.8,2.6,true); for(const s of [-1,1]){ const hk=add(new THREE.TorusGeometry(0.07,0.025,6,10),M,Sp,s*0.7,0.68,2.66); hk.rotation.y=Math.PI/2; add(B(0.12,0.1,0.1),Or,Sp,s*1.0,0.82,2.58); }
  for(const s of [-1,1]){
    for(const z of [1.14,-1.14]){ add(B(0.6,0.08,2.3),K2,Sp,s*1.24,1.22,z,true); add(B(0.05,0.12,2.3),K,Sp,s*1.52,1.2,z); add(B(0.04,0.03,2.2),D,Sp,s*1.545,1.15,z); }
    add(B(0.05,0.56,0.76),K2,Sp,s*1.065,1.43,0.0,true); add(B(0.04,0.06,0.2),D,Sp,s*1.1,1.43,-0.22); add(B(0.03,0.16,0.3),GL,Sp,s*1.095,1.58,0.08);
    add(B(0.2,0.3,0.8),K3,Sp,s*1.12,1.5,-1.35,true); add(B(0.21,0.04,0.82),D,Sp,s*1.12,1.6,-1.35);
    add(B(0.02,0.07,1.1),Or,Sp,s*1.056,1.66,1.25); add(B(0.02,0.07,0.32),Or,Sp,s*1.056,1.66,-0.58);
    add(B(0.2,0.24,0.04),D,Sp,s*0.9,1.57,-2.35); add(B(0.16,0.12,0.03),RD,Sp,s*0.9,1.62,-2.385); add(B(0.16,0.06,0.03),AM,Sp,s*0.9,1.5,-2.385); }
  add(B(2.0,0.9,0.1),K2,Sp,0,1.36,-2.28,true); add(B(1.1,0.74,0.04),K,Sp,0.3,1.33,-2.34); for(const y of [0.98,1.7]) add(B(1.12,0.04,0.05),D,Sp,0.3,y,-2.36); add(B(0.08,0.12,0.06),D,Sp,0.72,1.33,-2.37);
  add(zc(Cy(0.32,0.32,0.2,14*o.S)),0x262624,Sp,-0.42,1.2,-2.44,true); add(zc(Cy(0.18,0.18,0.22,10)),K2,Sp,-0.42,1.2,-2.44);
  for(const s of [-1,1]){ add(B(0.5,0.08,0.7),D,Sp,s*0.52,1.92,-1.9); if(hi) for(let k=0;k<5;k++) add(B(0.46,0.03,0.04),M,Sp,s*0.52,1.97,-2.15+k*0.12); }
  for(const [x,z,h] of [[0.86,-2.0,1.5],[-0.86,-2.05,1.1],[0.8,1.6,0.9]]) chAntenna(o,Sp,x,1.9,z,h);
  /* drone bay (centre of the hull roof) */
  const BZ=0.32; add(B(1.36,0.06,1.36),0x05080a,Sp,0,1.89,BZ); add(B(1.5,0.1,0.1),D,Sp,0,1.92,BZ+0.72); add(B(1.5,0.1,0.1),D,Sp,0,1.92,BZ-0.72); add(B(0.1,0.1,1.5),D,Sp,0.72,1.92,BZ); add(B(0.1,0.1,1.5),D,Sp,-0.72,1.92,BZ);
  for(const [x,z] of [[0.7,BZ+0.7],[-0.7,BZ+0.7],[0.7,BZ-0.7],[-0.7,BZ-0.7]]) add(B(0.08,0.06,0.08),AM,Sp,x,1.98,z);
  if(hi){ for(let k=0;k<7;k++){ add(B(0.1,0.02,0.05),k%2?D:Or,Sp,-0.6+k*0.2,1.975,BZ+0.72); add(B(0.1,0.02,0.05),k%2?D:Or,Sp,-0.6+k*0.2,1.975,BZ-0.72); }
    for(let k=0;k<4;k++) add(B(1.2,0.02,0.04),M,Sp,0,1.9,BZ-0.45+k*0.3); }
  T.bay=[]; for(const s of [-1,1]){ const g=new THREE.Group(); g.position.set(s*0.68,1.97,BZ); Sp.add(g); add(B(0.66,0.07,1.3),K2,g,-s*0.33,0.0,0,true); add(B(0.5,0.02,0.06),D,g,-s*0.33,0.045,0.4); add(B(0.5,0.02,0.06),D,g,-s*0.33,0.045,-0.4);
    add(B(0.04,0.03,1.1),Or,g,-s*0.62,0.045,0); g.userData={s,keep:true}; T.bay.push(g); }
  T.hatchPt=new THREE.Object3D(); T.hatchPt.position.set(0,1.7,BZ); Sp.add(T.hatchPt);
  if(hi){ chRivets(o,Sp,D,[[1.055,1.2,1.6,'x'],[1.055,1.2,0.6,'x'],[1.055,1.2,-0.6,'x'],[1.055,1.2,-1.6,'x'],[-1.055,1.2,1.6,'x'],[-1.055,1.2,0.6,'x'],[-1.055,1.2,-0.6,'x'],[-1.055,1.2,-1.6,'x']]);
    for(const s of [-1,1]){ add(B(0.03,0.03,1.6),M,Sp,s*0.86,1.98,-0.9); for(const z of [-0.2,-1.6]) add(B(0.03,0.08,0.03),M,Sp,s*0.86,1.93,z); }
    for(let k=0;k<4;k++) add(B(2.12,0.012,0.012),D,Sp,0,1.25,1.6-k*1.05); add(B(0.5,0.3,0.25),K3,Sp,-0.55,2.0,-0.65,true); add(B(0.3,0.25,0.2),M,Sp,0.6,1.98,-0.55,true); }
  /* compact turret near the stern */
  Sp.add(T.stab); T.stab.position.set(0,2.0,-1.2); T.stab.add(Tu);
  add(Cy(0.64,0.7,0.22,18),D,Tu,0,0.01,0,true); add(B(1.16,0.44,1.2),K,Tu,0,0.33,-0.05,true); const tf=add(B(1.16,0.1,0.46),K,Tu,0,0.45,0.66,true); tf.rotation.x=0.55; add(B(1.0,0.07,1.0),K2,Tu,0,0.58,-0.1);
  for(const s of [-1,1]){ const ch=add(B(0.12,0.38,0.9),K3,Tu,s*0.62,0.32,0.1,true); ch.rotation.y=s*0.12; for(let k=0;k<3;k++){ const t=add(zc(Cy(0.055,0.055,0.22,8)),D,Tu,s*0.72,0.42+k*0.0,-0.25+k*0.14); t.rotation.y=s*0.6; t.rotation.x=-0.5; } }
  add(B(0.3,0.24,0.32),M,Tu,0.36,0.72,-0.32,true); add(B(0.24,0.08,0.02),GL,Tu,0.36,0.74,-0.15); add(B(0.4,0.2,0.3),K2,Tu,0,0.38,-0.75,true);
  chAntenna(o,Tu,-0.42,0.6,-0.5,1.3); chBeacon(T,Tu,-0.42,2.0,-0.5); add(B(0.04,0.04,0.5),Or,Tu,0,0.62,0.3);
  if(hi) chRivets(o,Tu,D,[[0.58,0.48,0.4,'x'],[-0.58,0.48,0.4,'x'],[0.58,0.18,0.4,'x'],[-0.58,0.18,0.4,'x'],[0.58,0.48,-0.4,'x'],[-0.58,0.48,-0.4,'x']]);
  T.gun.position.set(0,0.34,0.62); },
};

/* ================= v14: visible engine / armour / stabiliser upgrades for every chassis ================= */
function upGyro(T,o,par,x,y,z,col){ const {add,B,Cy}=o, l=o.up.stab; if(l>=1){ add(new THREE.SphereGeometry(0.2,12*o.S,8*o.S,0,TAU,0,Math.PI/2),col||0x3d4a44,par,x,y,z,true); const r=add(new THREE.TorusGeometry(0.2,0.028,6,16*o.S),0x5a5f64,par,x,y,z); r.rotation.x=Math.PI/2; }
  if(l>=2){ add(Cy(0.03,0.03,0.6,8),0x5a5f64,par,-x,y+0.3,z); const sp=new THREE.Group(); sp.position.set(-x,y+0.62,z); par.add(sp); add(B(0.55,0.05,0.1),0x5a5f64,sp,0,0,0,true); add(B(0.08,0.12,0.12),glowMat(0xffc94a),sp,0.24,0,0); T.spinners.push(sp); } }
const CH_UPG={
 ten(T,o){ const {add,B,Cy,zc,up}=o, Sp=T.susp, Tu=T.turret, D=0x15191c, A=0x4a535b, GL=glowMat(0x5dff9a), e=up.engine, a=up.armor;
  if(e>=1){ add(zc(Cy(0.15,0.17,0.32,12)),D,Sp,0,1.02,-1.42,true); add(zc(Cy(0.1,0.1,0.04,12)),GL,Sp,0,1.02,-1.6); }
  if(e>=2){ add(Cy(0.3,0.3,0.1,16),D,Sp,0,1.3,-0.95,true); const f=new THREE.Group(); f.position.set(0,1.37,-0.95); Sp.add(f); for(let k=0;k<6;k++){ const bl=add(B(0.26,0.02,0.07),A,f,Math.cos(k/6*TAU)*0.13,0,Math.sin(k/6*TAU)*0.13); bl.rotation.order='YXZ'; bl.rotation.y=-k/6*TAU; bl.rotation.x=0.4; } T.spinners.push(f); }
  if(e>=3){ for(const s of [-1,1]){ add(B(0.06,0.3,0.06),D,Sp,s*0.5,1.42,-1.35); add(zc(Cy(0.14,0.14,0.04,12)),GL,Sp,s*0.42,1.0,-1.47); } add(B(1.3,0.05,0.32),A,Sp,0,1.58,-1.38,true); add(B(1.3,0.02,0.04),GL,Sp,0,1.6,-1.52); }
  if(a>=1) for(const s of [-1,1]) for(const z of [1.22,-1.18]){ add(B(0.62,0.06,0.8),A,Sp,s*1.45,1.26,z,true); add(B(0.05,0.36,0.05),D,Sp,s*1.15,1.08,z); }
  if(a>=2){ add(B(1.1,0.1,0.1),D,Sp,0,0.88,1.56,true); add(B(0.9,0.1,0.1),D,Sp,0,1.08,1.5,true); for(const x of [-0.45,0,0.45]) add(B(0.08,0.3,0.08),D,Sp,x,0.98,1.55); }
  if(a>=3){ for(const s of [-1,1]){ add(B(0.06,0.32,1.9),A,Sp,s*0.66,0.88,-0.25,true); add(B(0.06,0.24,0.8),A,Tu,s*0.47,0.2,0.05,true); } }
  upGyro(T,o,Tu,0.2,0.36,-0.35,0x262b30); },
 krep(T,o){ const {add,B,Cy,zc,up}=o, Sp=T.susp, Tu=T.turret, O2=0xc84a22, D=0x2a2d31, M=0x5a5f64, Y=0xf0a030, e=up.engine, a=up.armor;
  if(e>=1){ add(Cy(0.11,0.12,1.5,12),M,Sp,0.9,2.6,0.55,true); add(Cy(0.14,0.14,0.12,12),D,Sp,0.9,3.38,0.55); add(B(0.3,0.06,0.3),D,Sp,0.9,3.46,0.55); T.exh2=new THREE.Object3D(); T.exh2.position.set(0.9,3.5,0.55); Sp.add(T.exh2); }
  if(e>=2) for(const s of [-1,1]){ add(Cy(0.17,0.2,0.36,14),M,Sp,s*0.72,2.34,1.0,true); add(Cy(0.12,0.12,0.05,12),D,Sp,s*0.72,2.53,1.0); for(let k=0;k<3;k++) add(B(0.3,0.02,0.04),D,Sp,s*0.72,2.56,0.92+k*0.08); }
  if(e>=3) for(const s of [-1,1]){ add(B(0.03,0.16,1.0),glowMat(0xff9b1a),Sp,s*1.14,2.22,-0.6); for(let k=0;k<5;k++) add(B(0.04,0.2,0.04),D,Sp,s*1.15,2.22,-1.0+k*0.2); }
  if(a>=1){ for(let k=0;k<6;k++) add(B(0.05,0.62,0.05),D,Sp,-0.7+k*0.28,1.77,1.9); add(B(1.7,0.05,0.05),D,Sp,0,2.06,1.9); add(B(1.7,0.05,0.05),D,Sp,0,1.48,1.9); }
  if(a>=2){ const pl=add(B(2.25,0.62,0.12),O2,Sp,0,0.92,2.16,true); pl.rotation.x=-0.3; for(let k=0;k<5;k++) add(B(0.22,0.04,0.02),Y,pl,-0.8+k*0.4,0.12,0.07); }
  if(a>=3) for(const s of [-1,1]){ for(let k=0;k<4;k++) add(B(0.05,0.05,2.3),M,Sp,s*1.2,1.3+k*0.27,-0.6); for(let k=0;k<4;k++) add(B(0.05,1.0,0.05),M,Sp,s*1.2,1.7,-1.6+k*0.66); add(B(0.08,0.4,0.5),O2,Tu,s*0.62,0.35,0.35,true); }
  upGyro(T,o,Tu,0.3,0.62,-0.4,0x3d4a44); },
 igla(T,o){ const {add,B,Cy,zc,up}=o, Sp=T.susp, Tu=T.turret, R=0xb8323a, Rd=0x8c2630, D=0x2e1b20, M=0x5a5f64, BL=glowMat(0x7fe8ff), e=up.engine, a=up.armor;
  if(e>=1) for(let k=0;k<3;k++) add(B(1.0,0.02,0.05),BL,Sp,0,1.39,-1.6+k*0.18);
  if(e>=2) for(const s of [-1,1]){ add(Cy(0.22,0.22,0.16,14),D,Sp,s*0.45,1.42,-1.72,true); add(Cy(0.14,0.14,0.04,12),BL,Sp,s*0.45,1.51,-1.72); }
  if(e>=3){ for(const s of [-1,1]){ add(zc(Cy(0.16,0.2,0.3,14)),M,Sp,s*0.5,1.0,-2.05,true); add(zc(Cy(0.12,0.12,0.04,12)),BL,Sp,s*0.5,1.0,-2.21); } add(B(1.4,0.3,0.08),D,Sp,0,1.05,-1.98,true); }
  if(a>=1) for(const s of [-1,1]){ add(B(0.08,0.2,3.9),Rd,Sp,s*1.58,1.34,0.05,true); for(let k=0;k<4;k++) add(B(0.09,0.05,0.4),D,Sp,s*1.59,1.34,-1.3+k*0.85); }
  if(a>=2){ const w=add(B(1.75,0.14,0.7),R,Sp,0,0.98,2.45,true); w.rotation.x=0.55; add(B(1.3,0.03,0.4),D,w,0,0.08,0); }
  if(a>=3) for(const s of [-1,1]){ add(B(0.08,0.42,1.7),Rd,Tu,s*0.66,0.36,0.7,true); for(let k=0;k<3;k++) add(B(0.09,0.04,0.3),D,Tu,s*0.67,0.36,0.1+k*0.55); }
  upGyro(T,o,Tu,0.3,0.66,-0.9,D); },
 pchela(T,o){ const {add,B,Cy,zc,up}=o, Sp=T.susp, Tu=T.turret, W2=0xcfccc4, Rr=0xd8322a, Or=0xf0a030, D=0x2a2e33, M=0x8a9096, e=up.engine, a=up.armor;
  if(e>=1){ add(Cy(0.08,0.08,1.0,10),D,Sp,-0.98,1.95,0.35,true); add(B(0.2,0.12,0.24),D,Sp,-0.98,2.48,0.4); add(B(0.12,0.3,0.12),D,Sp,-0.92,1.4,0.35); }
  if(e>=2){ add(B(1.2,0.44,0.06),D,Sp,0,1.2,-1.67,true); for(let k=0;k<6;k++) add(B(1.1,0.03,0.04),M,Sp,0,1.02+k*0.07,-1.7); }
  if(e>=3) for(const s of [-1,1]){ add(zc(Cy(0.13,0.15,0.22,12)),M,Sp,s*0.55,0.92,-1.72,true); add(zc(Cy(0.09,0.09,0.03,10)),glowMat(0xff9b1a),Sp,s*0.55,0.92,-1.84); }
  if(a>=1){ for(let k=0;k<6;k++) add(B(0.04,0.22,0.04),D,Sp,-0.55+k*0.22,1.72,0.49); add(B(1.3,0.04,0.04),D,Sp,0,1.83,0.49); }
  if(a>=2){ for(const s of [-1,1]) add(B(0.08,0.4,0.08),D,Sp,s*0.6,0.95,1.75); add(B(1.4,0.08,0.08),D,Sp,0,1.15,1.76,true); add(B(1.3,0.08,0.08),D,Sp,0,0.8,1.78,true); add(B(0.5,0.06,0.03),Or,Sp,0,1.15,1.81); }
  if(a>=3) for(const s of [-1,1]){ add(B(0.06,0.48,0.82),W2,Sp,s*0.95,1.1,-0.0,true); add(B(0.07,0.06,0.7),Rr,Sp,s*0.965,1.26,-0.0); for(const z of [1.15,-1.15]) add(B(0.74,0.06,1.2),W2,Sp,s*1.24,1.6,z,true); add(B(0.08,0.36,0.7),W2,Tu,s*0.58,0.3,0.25,true); }
  upGyro(T,o,Tu,0.2,0.56,-0.45,0x3d4a44); },
 kovch(T,o){ const {add,B,Cy,zc,up}=o, Sp=T.susp, Tu=T.turret, K=0x7d7a5a, K2=0x66634a, D=0x2b2e2c, M=0x5a5f64, Or=0xf0a030, e=up.engine, a=up.armor;
  if(e>=1) for(const s of [-1,1]){ add(Cy(0.08,0.09,0.8,10),M,Sp,s*0.98,2.0,-2.18,true); add(Cy(0.11,0.11,0.08,10),D,Sp,s*0.98,2.42,-2.18); }
  if(e>=2){ add(Cy(0.34,0.34,0.08,16),D,Sp,0.5,1.94,-1.9,true); const f=new THREE.Group(); f.position.set(0.5,1.99,-1.9); Sp.add(f); for(let k=0;k<6;k++){ const bl=add(B(0.3,0.02,0.07),M,f,Math.cos(k/6*TAU)*0.15,0,Math.sin(k/6*TAU)*0.15); bl.rotation.order='YXZ'; bl.rotation.y=-k/6*TAU; bl.rotation.x=0.4; } T.spinners.push(f); }
  if(e>=3) for(const s of [-1,1]){ add(B(0.04,0.14,0.9),glowMat(0xff9b1a),Sp,s*1.07,1.62,-1.95); for(let k=0;k<5;k++) add(B(0.05,0.18,0.04),D,Sp,s*1.08,1.62,-2.3+k*0.18); }
  if(a>=1) for(const s of [-1,1]){ add(B(0.06,0.2,4.3),K2,Sp,s*1.58,1.32,0,true); add(B(0.4,0.04,4.3),K2,Sp,s*1.4,1.28,0); for(let k=0;k<6;k++) add(B(0.07,0.05,0.18),D,Sp,s*1.6,1.32,-1.9+k*0.76); }
  if(a>=2){ const pl=add(B(2.3,0.55,0.12),K2,Sp,0,0.95,2.72,true); pl.rotation.x=-0.28; for(let k=0;k<5;k++) add(B(0.22,0.04,0.02),Or,pl,-0.8+k*0.4,0.12,0.07); for(const s of [-1,1]) add(B(0.08,0.08,0.4),D,Sp,s*0.7,0.85,2.55); }
  if(a>=3) for(const s of [-1,1]){ for(let k=0;k<3;k++) add(B(0.04,0.04,3.6),M,Sp,s*1.16,1.3+k*0.18,-0.1); for(let k=0;k<7;k++) add(B(0.04,0.42,0.04),M,Sp,s*1.16,1.48,-1.8+k*0.58); add(B(0.08,0.36,0.6),K,Tu,s*0.7,0.32,0.3,true); }
  upGyro(T,o,Tu,0.3,0.62,-0.5,0x4a4c40); },
};
const UPINFO={
 engine:{ten:'Быстрее и резвее. Третье сопло, турбина на корме, задний спойлер с зелёной подсветкой.',krep:'Быстрее и резвее. Вторая выхлопная труба, турбины на крыше кабины, раскалённые жалюзи на кузове.',igla:'Быстрее и резвее. Светящиеся жалюзи, турбины на корме, форсажные сопла.',pchela:'Быстрее и резвее. Шноркель, радиатор на корме, турбины с оранжевым свечением.',kovch:'Быстрее и резвее. Выхлопные трубы на корме, вентилятор радиатора, светящиеся воздухозаборники.'},
 armor:{ten:'Больше прочности. Щитки над колёсами, кенгурятник, боковые экраны и броня башни.',krep:'Больше прочности. Решётка на лобовое стекло, отвал-таран, клетка из прутьев на кузове и щиты башни.',igla:'Больше прочности. Экраны над колёсами, клиновидный нос, бортовые плиты башни.',pchela:'Больше прочности. Решётка на смотровую щель, кенгурятник, бортовые бронепанели.',kovch:'Больше прочности. Бортовые экраны над колёсами, отвал-таран, решётчатая броня и щиты башни.'},
 stab:{ten:'Башня держит линию огня, когда корпус кренится. Гироблок и мачта датчиков на башне.',krep:'Башня держит линию огня, когда корпус кренится. Гироблок и мачта датчиков на башне.',igla:'Башня держит линию огня, когда корпус кренится. Гироблок и мачта датчиков на корме башни.',pchela:'Башня держит линию огня, когда корпус кренится. Гироблок и мачта датчиков на башне.',kovch:'Башня держит линию огня, когда корпус кренится. Гироблок и мачта датчиков на башне.'}};
function upInfo(u){ return (UPINFO[u.k]&&UPINFO[u.k][UP.tank])||u.info; }

function makeTank(hi,up){
  const U={rootInv:{value:new THREE.Matrix4()},dmg:{value:new THREE.Vector4()},top:{value:0}};
  const mats={}; const mt=cc=>mats[cc]||(mats[cc]=dmgMat(cc,U));
  const T={hi,U,mats,root:new THREE.Group(),susp:new THREE.Group(),stab:new THREE.Group(),turret:new THREE.Group(),gun:new THREE.Group(),mg:new THREE.Group(),cn:new THREE.Group(),rk:null,
    wheels:[],spins:[],barrels:[],mgMuz:[],rkMuz:[],spinners:[],cnMuz:new THREE.Object3D()};
  const OL=hi?1.03:1.05, S=hi?2:1;
  const add=(geo,cc,par,x,y,z,ol)=>{ const m=new THREE.Mesh(geo,typeof cc==='number'?mt(cc):cc); m.position.set(x,y,z); par.add(m); if(ol){ const o=new THREE.Mesh(geo,outlineMat); o.scale.setScalar(typeof ol==='number'?ol:OL); m.add(o); } return m; };
  const zc=g=>{ g.rotateX(Math.PI/2); return g; }, xc=g=>{ g.rotateZ(Math.PI/2); return g; };
  const B=(w,h,d)=>new THREE.BoxGeometry(w,h,d), Cy=(r1,r2,h,s)=>new THREE.CylinderGeometry(r1,r2,h,s);
  const SK=up.skin||TANK_SKIN, C_BODY=SK.turret, C_CH=SK.chassis, C_TIRE=SK.wheels, C_HUB=0x5d8a72, C_MET=0x3b424c, C_DK=0x222b2f, C_ARM=0x557a66, C_GUN=0x454d55, C_GUN2=0x30373e, C_RIM=0x2a3036;
  const Rt=T.root, Sp=T.susp; Rt.add(Sp);
  const CHID=(up.tank&&CH_BUILD[up.tank])?up.tank:'base'; T.chid=CHID; if(CHID!=='base'){ const o2={add,B,Cy,zc,xc,hi,S,mt,up}; CH_BUILD[CHID](T,o2); CH_UPG[CHID](T,o2); } else {
  const tireG=xc(Cy(0.56,0.56,0.48,14*S)), hubG=xc(Cy(0.3,0.3,0.5,10*S)), lugG=B(0.5,0.12,0.18); const nl=hi?14:8;
  for(const [x,z] of WHL){ const w=new THREE.Group(); w.position.set(x,0.56,z); Rt.add(w); const sp=new THREE.Group(); w.add(sp);
    add(tireG,C_TIRE,sp,0,0,0,hi?1.04:1.06); add(hubG,C_HUB,sp,0,0,0);
    for(let k=0;k<nl;k++){ const a=k/nl*TAU; const l=add(lugG,0x5e2a2e,sp,0,Math.cos(a)*0.56,Math.sin(a)*0.56); l.rotation.x=-a; }
    if(hi){ const sd=Math.sign(x); add(xc(Cy(0.36,0.36,0.04,24)),C_RIM,sp,sd*0.25,0,0); for(let k=0;k<6;k++){ const a=k/6*TAU; add(xc(Cy(0.035,0.035,0.06,8)),C_MET,sp,sd*0.27,Math.cos(a)*0.2,Math.sin(a)*0.2); } add(xc(Cy(0.1,0.12,0.08,12)),C_MET,sp,sd*0.28,0,0); }
    T.wheels.push(w); T.spins.push(sp); }
  add(B(1.5,0.55,2.55),C_CH,Sp,0,0.85,0,true);
  add(B(1.0,0.24,0.26),C_DK,Sp,0,0.66,1.3,1.06); add(B(1.0,0.24,0.26),C_DK,Sp,0,0.66,-1.3,1.06);
  add(B(0.3,0.42,0.45),0x1f272a,Sp,-0.9,0.86,0,true);
  const plate=new THREE.Mesh(plateGeo,plateMat); plate.position.set(0,0.86,1.281); Sp.add(plate); const p2=plate.clone(); p2.position.set(0.752,0.88,0); p2.rotation.y=Math.PI/2; Sp.add(p2);
  for(const s of [-1,1]) add(B(0.22,0.12,0.04),glowMat(0xfff2d2),Sp,s*0.66,0.98,1.285);
  if(hi){ for(let k=0;k<6;k++) add(zc(Cy(0.028,0.028,0.04,8)),C_MET,Sp,-0.625+k*0.25,1.06,1.28);
    for(let k=0;k<5;k++) add(xc(Cy(0.028,0.028,0.04,8)),C_MET,Sp,0.753,1.06,-1.0+k*0.5);
    add(B(1.35,0.02,0.02),0x161c1f,Sp,0,0.72,1.282); add(B(0.02,0.02,2.3),0x161c1f,Sp,0.754,0.72,0);
    for(const s of [-1,1]) add(xc(Cy(0.03,0.03,0.5,8)),C_MET,Sp,s*0.5,1.16,1.18); }
  const eng=up.engine;
  const pipe=x=>{ add(Cy(0.09,0.09,0.95,10*S),C_MET,Sp,x,1.45,-1.16,1.15); const e=add(Cy(0.09,0.09,0.5,10*S),C_MET,Sp,x,1.92,-1.0,1.15); e.rotation.x=Math.PI/2.4;
    if(eng>=3){ const tip=add(Cy(0.12,0.13,0.16,12),glowMat(0xff9b1a),Sp,x,2.08,-0.84); tip.rotation.x=Math.PI/2.4; } };
  pipe(0.62); if(eng>=1) pipe(-0.62);
  if(eng>=2){ add(B(0.8,0.26,0.5),C_DK,Sp,0,1.25,-1.02,true); for(let k=0;k<(hi?6:3);k++) add(B(0.7,0.03,0.04),C_MET,Sp,0,1.39,-1.2+k*(hi?0.07:0.14)); add(xc(Cy(0.16,0.16,0.28,12*S)),C_MET,Sp,0.3,1.45,-0.96,true); }
  if(eng>=3){ add(B(1.5,0.4,0.12),C_DK,Sp,0,0.96,-1.36,true); for(let k=0;k<(hi?9:5);k++) add(B(0.03,0.32,0.06),C_MET,Sp,-0.64+k*(hi?0.16:0.32),0.96,-1.43); }
  const ar=up.armor;
  if(ar>=1){ for(const [x,z] of WHL){ add(B(0.66,0.07,1.3),C_ARM,Sp,x,1.42,z,true); for(const sz of [-1,1]) add(B(0.08,0.32,0.06),C_DK,Sp,x*0.72,1.24,z+sz*0.5); if(hi) for(let k=0;k<3;k++) add(Cy(0.03,0.03,0.03,8),C_MET,Sp,x,1.47,z-0.4+k*0.4); }
    for(const s of [-1,1]){ add(B(0.06,0.45,0.4),C_ARM,Sp,s*1.43,0.95,0,true); add(B(0.68,0.06,0.08),C_DK,Sp,s*1.1,1.15,0); } }
  if(ar>=2){ const ram=add(B(1.36,0.55,0.12),C_ARM,Sp,0,0.72,1.47,true); ram.rotation.x=-0.3; if(hi) for(let k=0;k<5;k++) add(zc(Cy(0.035,0.035,0.05,8)),C_MET,ram,-0.56+k*0.28,0.12,0.07);
    for(const s of [-1,1]) add(B(0.08,0.3,0.4),C_ARM,Sp,s*0.62,0.75,1.32); }
  Sp.add(T.stab); T.stab.position.set(0,1.12,0); T.stab.add(T.turret); const Tu=T.turret;
  add(Cy(0.82,0.95,0.2,24*S),0x263034,Tu,0,0.05,0,true);
  add(new THREE.SphereGeometry(1.0,28*S,20*S),C_BODY,Tu,0,0.95,0,hi?1.025:1.035);
  const n=new THREE.Vector3(0.74,0.14,0.62).normalize(), ctr=new THREE.Vector3(0,0.95,0), qq=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),n);
  const ring=add(new THREE.TorusGeometry(0.27,0.075,8*S,22*S),C_MET,Tu,0,0,0); ring.position.copy(ctr).addScaledVector(n,0.97); ring.quaternion.copy(qq);
  const glassM=new THREE.Mesh(new THREE.CircleGeometry(0.24,20*S),glowMat(0xdfeef2)); glassM.position.copy(ctr).addScaledVector(n,0.99); glassM.quaternion.copy(qq); Tu.add(glassM);
  const hl=new THREE.Mesh(new THREE.CircleGeometry(0.08,10),glowMat(0xffffff)); hl.position.copy(glassM.position).addScaledVector(n,0.005).add(new THREE.Vector3(-0.05,0.07,0)); hl.quaternion.copy(qq); Tu.add(hl);
  if(hi){ for(let k=0;k<10;k++){ const a=k/10*TAU; add(new THREE.SphereGeometry(0.025,6,4),C_MET,ring,Math.cos(a)*0.27,Math.sin(a)*0.27,0.07); }
    const seam=add(new THREE.TorusGeometry(1.002,0.01,4,64),0x4a6b58,Tu,0,0.95,0); seam.rotation.x=Math.PI/2;
    const seam2=add(new THREE.TorusGeometry(1.002,0.01,4,64),0x4a6b58,Tu,0,0.95,0); seam2.rotation.y=Math.PI/2; }
  add(Cy(0.26,0.28,0.1,16*S),0x587f6b,Tu,0.05,1.9,0.28,true);
  if(hi){ add(xc(Cy(0.03,0.03,0.24,8)),C_MET,Tu,0.05,1.97,0.28); add(B(0.1,0.05,0.12),C_MET,Tu,0.05,1.93,0.02); }
  const rail=add(new THREE.TorusGeometry(0.44,0.05,6,18*S,Math.PI),0x2b3336,Tu,0,1.86,-0.2); rail.scale.y=0.55;
  const sbx=add(B(0.5,0.55,0.22),0x4a5257,Tu,-0.62,0.95,-0.66,true); sbx.rotation.y=-0.8;
  add(Cy(0.025,0.025,0.9,6),C_MET,Tu,0.5,2.1,-0.55);
  T.beacon=new THREE.Mesh(new THREE.SphereGeometry(0.07,8,6),new THREE.MeshBasicMaterial({color:0xffb53a})); T.beacon.userData.keep=true; T.beacon.position.set(0.5,2.56,-0.55); Tu.add(T.beacon);
  if(ar>=3){ for(let k=0;k<16;k++){ const a=k/16*TAU, deg=a*180/Math.PI; if(deg<26||deg>334||(deg>28&&deg<72)||(up.rk&&deg>250&&deg<292)) continue;
    const pl=add(B(0.38,0.36,0.07),C_ARM,Tu,Math.sin(a)*1.0,0.9,Math.cos(a)*1.0,true); pl.rotation.y=a; if(hi) add(zc(Cy(0.03,0.03,0.04,8)),C_MET,pl,0,0.1,0.04); } }
  if(up.stab>=1){ add(new THREE.SphereGeometry(0.22,12*S,8*S,0,TAU,0,Math.PI/2),0x3d4a44,Tu,-0.32,1.78,-0.42,true); const tr=add(new THREE.TorusGeometry(0.22,0.03,6,16*S),C_MET,Tu,-0.32,1.78,-0.42); tr.rotation.x=Math.PI/2; }
  if(up.stab>=2){ add(Cy(0.035,0.035,0.7,8),C_MET,Tu,-0.55,2.12,0.1); const sp=new THREE.Group(); sp.position.set(-0.55,2.48,0.1); Tu.add(sp); add(B(0.55,0.05,0.1),C_MET,sp,0,0,0,true); add(B(0.08,0.12,0.12),glowMat(0xffc94a),sp,0.24,0,0); T.spinners.push(sp); }
  T.gun.position.set(0,0.88,0.74); }
  T.turret.add(T.gun); T.gun.add(T.mg); T.gun.add(T.cn);
  const gatling=(par,x)=>{ add(zc(Cy(0.25,0.27,0.55,16*S)),C_GUN2,par,x,0,0.25,true); const br=new THREE.Group(); br.position.set(x,0,0.55); par.add(br);
    for(let k=0;k<6;k++){ const a=k/6*TAU; add(zc(Cy(0.052,0.052,1.3,8*S)),C_GUN,br,Math.cos(a)*0.13,Math.sin(a)*0.13,0.65); }
    add(zc(Cy(0.21,0.21,0.08,16*S)),C_RIM,br,0,0,0.5,true); add(zc(Cy(0.21,0.21,0.08,16*S)),C_RIM,br,0,0,1.22,true);
    if(hi){ add(zc(Cy(0.07,0.07,1.3,8)),C_RIM,br,0,0,0.65); add(zc(Cy(0.19,0.19,0.05,16)),C_GUN,br,0,0,0.9); }
    T.barrels.push(br); const mz=new THREE.Object3D(); mz.position.set(x,0,1.95); par.add(mz); T.mgMuz.push(mz); };
  const MGK=CHASSIS[CHID].mgs.includes(up.mg)?up.mg:CHASSIS[CHID].mgs[0];
  if(T.noMg){ /* no machine gun on this chassis */ } else if(MGK==='twin'){ gatling(T.mg,-0.27); gatling(T.mg,0.27); add(B(0.95,0.16,0.4),C_GUN2,T.mg,0,-0.2,0.3,true); }
  else if(MGK==='kpv'){ add(B(0.5,0.42,0.7),C_GUN2,T.mg,0,0,0.3,true); add(zc(Cy(0.1,0.1,1.9,12*S)),C_GUN,T.mg,0,0.02,1.55,true); add(zc(Cy(0.16,0.16,1.1,12*S)),C_RIM,T.mg,0,0.02,1.15,true);
    if(hi) for(let k=0;k<8;k++) add(zc(Cy(0.168,0.168,0.035,12)),0x161b1f,T.mg,0,0.02,0.7+k*0.12);
    add(zc(Cy(0.14,0.12,0.22,12*S)),C_RIM,T.mg,0,0.02,2.5,true); add(B(0.3,0.35,0.34),0x3a4248,T.mg,0.38,-0.05,0.25,true);
    const mz=new THREE.Object3D(); mz.position.set(0,0.02,2.64); T.mg.add(mz); T.mgMuz.push(mz); }
  else gatling(T.mg,0);
  if(!T.customCn){ const L=1.9+0.2*up.cal, mb=1+0.15*up.cal;
  add(B(0.62,0.5,0.42),C_GUN2,T.cn,0,0,0.18,true);
  add(zc(Cy(0.12+0.012*up.cal,0.14+0.012*up.cal,L,14*S)),C_GUN,T.cn,0,0,0.3+L/2,true);
  add(zc(Cy(0.19*mb,0.19*mb,0.32*mb,14*S)),C_RIM,T.cn,0,0,0.3+L+0.1,true);
  if(hi) for(const s of [-1,1]) add(B(0.06,0.1*mb,0.18*mb),0x111518,T.cn,s*0.19*mb,0,0.3+L+0.1);
  if(up.cal>=2) add(zc(Cy(0.21,0.21,0.36,14*S)),C_GUN2,T.cn,0,0,0.3+L*0.55,true);
  if(up.load>=1){ const s=1+0.18*(up.load-1); add(xc(Cy(0.22*s,0.22*s,0.52,16*S)),0x3a4248,T.cn,0,0.4,0.24,true); if(hi) for(const o of [-0.18,0.18]) add(xc(Cy(0.23*s,0.23*s,0.04,16)),C_MET,T.cn,o,0.4,0.24);
    if(up.load>=3) add(B(0.12,0.3,0.12),C_MET,T.cn,0.3,0.15,0.3,true); }
  T.cnMuz.position.set(0,0,0.3+L+0.3); T.cn.add(T.cnMuz); }
  if(up.rk>=1&&CHASSIS[CHID].w.includes(2)){ const rows=up.rk>=2?3:2, pod=new THREE.Group(); if(T.rkPos) pod.position.copy(T.rkPos); else pod.position.set(-1.25,0.15,-0.62); T.gun.add(pod); T.rk=pod; T.rkBase=pod.position.y;
    add(B(0.6,0.24*rows+0.14,0.95),CHID==='base'?C_BODY:(CHASSIS[CHID].col||C_ARM),pod,0,0,0,true); add(B(0.3,0.16,0.4),C_MET,pod,0.42,0,-0.1);
    for(let r=0;r<rows;r++) for(let cI=0;cI<2;cI++){ const x=(cI-0.5)*0.26, y=(r-(rows-1)/2)*0.24; add(zc(Cy(0.09,0.09,0.06,12)),0x0b0f16,pod,x,y,0.48);
      if(hi){ const tip=add(new THREE.ConeGeometry(0.06,0.14,10),glowMat(0xffb53a),pod,x,y,0.46); tip.rotation.x=Math.PI/2; }
      const mz=new THREE.Object3D(); mz.position.set(x,y,0.56); pod.add(mz); T.rkMuz.push(mz); }
    { const ph=0.24*rows+0.14, fc=CHID==='base'?C_BODY:(CHASSIS[CHID].col||C_ARM); T.rkFlaps=[];
      for(const sd of [1,-1]){ const hg=new THREE.Group(); hg.position.set(0,sd*ph/2,0.5); pod.add(hg); add(B(0.62,ph/2,0.05),fc,hg,0,-sd*ph/4,0.02,true); add(B(0.5,0.03,0.06),0x111518,hg,0,-sd*(ph/2-0.03),0.03); add(B(0.08,ph/2-0.04,0.065),glowMat(0xffb53a),hg,0.22,-sd*ph/4,0.03); hg.userData.keep=true; T.rkFlaps.push({g:hg,sd}); }
      add(B(0.62,ph,0.08),0x2a2e33,pod,0,0,-0.5); for(let k=0;k<rows*2;k++) add(zc(Cy(0.07,0.09,0.06,10)),0x111518,pod,(k%2-0.5)*0.26,(Math.floor(k/2)-(rows-1)/2)*0.24,-0.55); T.rkOpen=0; } }
  T.cn.visible=false;
  return T; }
function disposeTank(T){ T.root.traverse(o=>{ if(o.geometry&&o.geometry!==plateGeo) o.geometry.dispose(); }); for(const k in T.mats) T.mats[k].dispose(); }
function tankDamageUniforms(T){ T.root.updateMatrixWorld(true); T.U.rootInv.value.copy(T.root.matrixWorld).invert(); const S=(T.hi&&GAR.open&&GAR.mode==='park')?[0,0,0,0,0]:TK.dmgS; T.U.dmg.value.set(S[0],S[1],S[2],S[3]); T.U.top.value=S[4]; }

