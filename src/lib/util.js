/* Утилиты (раньше src/game/00-util.js). Настоящий ES-модуль без зависимостей от игры. */
import { SHT } from './state.js';

export const $ = s => document.querySelector(s);
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const wrapA = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
export const rnd = Math.random;
export function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
export function hash3(x,y,z){let h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(z|0,1440662683))|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296}
export const smooth=(a,b,x)=>{ const t=clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };
/* review: one world-matrix refresh per object per frame (bosses have 200-400 meshes; several full traversals per frame cost real ms on phones) */
export function wmOnce(e){ if(e._wmF===SHT.frame) return; e._wmF=SHT.frame; e.g.updateMatrixWorld(true); }
export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
