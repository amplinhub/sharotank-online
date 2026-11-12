/* ================= PALETTES & QUALITY ================= */
const PALETTES = [
 {name:'Кобальт · янтарь', bg:0x1d5c99, ground:0x2a6aa6, side:0x3474b0, road:0x22598f, line:0x8fbde8,
  dark:0x0f1726, mid:0x1b2740, light:0x2d3f5e, metal:0x141d2e, foliage:0x13324f, rust:0x2c2a35,
  glow:0xffc94a, glow2:0xff9b1a, neon:0xff8f2e, neon2:0xffd98a, lamp:0xfff2d2, accent:0xffb53a, taxi:0xf2b01e, glass:0xcdeaff},
 {name:'Сумерки · малина', bg:0x5a86b4, ground:0x6690bd, side:0x739cc6, road:0x557fab, line:0xd3e4f4,
  dark:0x1e2638, mid:0x2b3551, light:0x3e4c6e, metal:0x1a2234, foliage:0x2a3f5e, rust:0x3a2f45,
  glow:0xff6aa8, glow2:0xe8327b, neon:0xff4f96, neon2:0xffb8d6, lamp:0xfff0f6, accent:0xff5b9d, taxi:0xe85a95, glass:0xffd8ea},
 {name:'Туман · оранж', bg:0x17466c, ground:0x1f527c, side:0x285d88, road:0x1a4870, line:0x6b9cc6,
  dark:0x0d1824, mid:0x172a3e, light:0x233c57, metal:0x101c2a, foliage:0x0f2a40, rust:0x2a2228,
  glow:0xff7d1f, glow2:0xff4a10, neon:0xff3d1a, neon2:0xffa45c, lamp:0xffe2c0, accent:0xff7a22, taxi:0xf0a32a, glass:0xffcda2},
];
const QUALITY = {
  low: {label:'НИЗКО', vs:0.5,   debris:450,  sparks:500,  puffs:260, dpr:1,   cap:5000},
  med: {label:'СРЕДНЕ',vs:1/3,   debris:1100, sparks:1100, puffs:450, dpr:1.5, cap:9000},
  high:{label:'ВЫСОКО',vs:0.25,  debris:2200, sparks:1800, puffs:700, dpr:2,   cap:14000},
};
const M = {DARK:1,MID:2,WIN:3,WINOFF:4,NEON:5,METAL:6,LAMP:7,LEAF:8,TRUNK:9,SHOP:10,FURN:11,BILL:12,PANEL:13,ROOF:14,AWN:15,RUST:16,TAXI:17,TIRE:18,
  ARMY:19,CANV:20,WALL:21,WOOD:22,TILE:23,HAY:24,BLOS:25,LANT:26,CBLUE:27,CORNG:28,CGRN:29,CGRY:30,CRED:31};
const MD = [null,
 {k:'dark',hard:3.4},{k:'mid',hard:2.8},{k:'glow',k2:'glow2',glow:1,hard:0.7,glass:1},{k:'winoff',hard:0.7,glass:1},
 {k:'neon',k2:'neon2',glow:1,hard:0.8,glass:1},{k:'metal',hard:2.2,metal:1},{k:'lamp',glow:1,hard:0.6,glass:1},
 {k:'foliage',hard:0.3},{k:'trunk',hard:1.4},{k:'glow2',k2:'glow',glow:1,hard:0.5,glass:1},{k:'light',hard:0.5},
 {k:'neon2',k2:'neon',glow:1,hard:0.8,glass:1},{k:'glow',k2:'lamp',glow:1,hard:0.6,glass:1},{k:'light',hard:2.0},
 {k:'accent',hard:0.6},{k:'rust',hard:2.6,metal:1},{k:'taxi',hard:1.6,metal:1},{k:'tire',hard:1.8},
 {k:'army',hard:2.2,metal:1},{k:'canvas',hard:0.5},{k:'wall',hard:2.6},{k:'wood',hard:1.0},{k:'tile',hard:1.6},
 {k:'hay',hard:0.25},{k:'blossom',hard:0.3},{k:'neon',k2:'glow2',glow:1,hard:0.5,glass:1},
 {k:'cblue',hard:2.4,metal:1},{k:'corng',hard:2.4,metal:1},{k:'cgrn',hard:2.4,metal:1},{k:'cgry',hard:2.6,metal:1},{k:'cred',hard:2.0,metal:1}];

let P = {}, PAL = 0;
const hx = h => [(h>>16&255)/255,(h>>8&255)/255,(h&255)/255];
const mix3 = (a,b,t) => [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
const css = h => '#' + h.toString(16).padStart(6,'0');
const cssA = (a,al) => `rgba(${a[0]*255|0},${a[1]*255|0},${a[2]*255|0},${al})`;
function loadPalette(i){ PAL=i; const s=PALETTES[i]; P={}; for(const k in s) if(typeof s[k]==='number') P[k]=hx(s[k]);
  P.winoff=mix3(P.mid,P.bg,0.32); P.trunk=mix3(P.dark,P.rust,0.5); P.tire=[0.04,0.055,0.08];
  P.army=mix3([0.30,0.42,0.36],P.dark,0.3); P.canvas=mix3(P.army,[0.78,0.82,0.7],0.2);
  P.wall=mix3(P.lamp,P.bg,0.5); P.wood=mix3(P.rust,[0.42,0.27,0.18],0.55); P.tile=mix3(P.dark,P.mid,0.35);
  P.hay=mix3(P.accent,P.dark,0.45); P.blossom=mix3(P.neon2,P.wall,0.35); P.water=mix3(P.bg,P.dark,0.5);
  P.cblue=mix3([0.16,0.40,0.74],P.dark,0.12); P.corng=mix3([0.95,0.58,0.12],P.dark,0.08); P.cgrn=mix3([0.20,0.44,0.24],P.dark,0.12); P.cgry=mix3([0.34,0.38,0.43],P.dark,0.08); P.cred=mix3([0.86,0.15,0.12],P.dark,0.08); }

