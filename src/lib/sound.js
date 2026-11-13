/* Звук (раньше src/game/16-sound.js). Настоящий ES-модуль.
   От игры нужны только танк, апгрейды и таблица скоростей двигателя — их игра передаёт один раз через bindSound(). */
import { clamp, rnd } from './util.js';

let ENV = { TK: null, UP: null, ENG_V: null };
export function bindSound(env) { ENV = env; }

export const SND={ctx:null,master:null,noise:null,muted:false,tick:0,E:null,sk:1,sp:0};
/* sounds made while a world position is set get quieter with distance and pan left/right */
export function sndAt(x,z){ const p=[SND.sk,SND.sp]; const d=Math.hypot(x-ENV.TK.x,z-ENV.TK.z); SND.sk=Math.pow(clamp(1-(d-7)/46,0,1),1.6); SND.sp=clamp((x-ENV.TK.x)/20,-0.75,0.75); return p; }
export function sndOff(p){ SND.sk=p?p[0]:1; SND.sp=p?p[1]:0; }
export function sndOut(ctx){ if(!SND.sp) return SND.master; const pn=ctx.createStereoPanner(); pn.pan.value=SND.sp; pn.connect(SND.master); return pn; }
export function sInit(){ if(SND.ctx){ if(SND.ctx.state==='suspended') SND.ctx.resume(); return; } try{ const C=window.AudioContext||window.webkitAudioContext; if(!C) return; const ctx=new C(); SND.ctx=ctx;
    SND.master=ctx.createGain(); SND.master.gain.value=SND.muted?0:0.55; SND.master.connect(ctx.destination);
    const len=ctx.sampleRate; const b=ctx.createBuffer(1,len,ctx.sampleRate), d=b.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1; SND.noise=b;
    engineInit(ctx); }catch(e){ SND.ctx=null; } }
export function engineInit(ctx){ const E={rpm:0.1}; const osc=(type,f)=>{ const o=ctx.createOscillator(); o.type=type; o.frequency.value=f; o.start(); return o; };
  E.o1=osc('sawtooth',45); E.o2=osc('sawtooth',45.6); E.o3=osc('square',22.5); E.o4=osc('sine',360);
  const mix=ctx.createGain(); mix.gain.value=0.3; E.o1.connect(mix); E.o2.connect(mix); const g3=ctx.createGain(); g3.gain.value=0.5; E.o3.connect(g3); g3.connect(mix);
  const sh=ctx.createWaveShaper(), cv=new Float32Array(1024); for(let i=0;i<1024;i++){ const x=i/511.5-1; cv[i]=Math.tanh(x*2.6); } sh.curve=cv; mix.connect(sh);
  E.lp=ctx.createBiquadFilter(); E.lp.type='lowpass'; E.lp.frequency.value=500; E.lp.Q.value=2.2; sh.connect(E.lp);
  E.am=ctx.createGain(); E.am.gain.value=0.7; E.lp.connect(E.am);
  E.lfo=osc('sine',11); const ld=ctx.createGain(); ld.gain.value=0.3; E.lfo.connect(ld); ld.connect(E.am.gain);
  E.eg=ctx.createGain(); E.eg.gain.value=0; E.am.connect(E.eg); E.eg.connect(SND.master);
  E.wg=ctx.createGain(); E.wg.gain.value=0; E.o4.connect(E.wg); E.wg.connect(SND.master);
  const ns=ctx.createBufferSource(); ns.buffer=SND.noise; ns.loop=true; const bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=700; bp.Q.value=0.9;
  E.ng=ctx.createGain(); E.ng.gain.value=0; ns.connect(bp); bp.connect(E.ng); E.ng.connect(SND.master); ns.start(); E.bp=bp; SND.E=E; }
/* engine voice per chassis: [idle Hz, rev range, whine mult, rumble mult] */
export const ENG_VOICE={base:[34,96,1,1],ten:[46,128,1.5,0.7],krep:[24,66,0.6,1.6],igla:[52,118,2.2,0.35],pchela:[38,104,1.1,1],kovch:[28,78,0.8,1.4]};
/* v24: short throttle blip of a given chassis (motor pool «drive out») */
export function sfxRev(id){ sInit(); const cv=ENG_VOICE[id]||ENG_VOICE.base, f0=cv[0]+0.1*cv[1], f1=cv[0]+0.95*cv[1], up=0.24, dn=0.55;
  sO(f0,f1,up,0.13,'sawtooth'); sO(f0*1.013,f1*1.013,up,0.08,'sawtooth'); sO(f0*0.5,f1*0.5,up,0.16,'sine'); sO(300*cv[2],1100*cv[2],up,0.025,'sine'); sNz(up+0.1,'bandpass',500,0.9,0.05*cv[3]);
  setTimeout(()=>{ sO(f1,f0*1.15,dn,0.1,'sawtooth'); sO(f1*0.5,f0*0.6,dn,0.13,'sine'); sO(1100*cv[2],350*cv[2],dn,0.02,'sine'); sNz(dn,'bandpass',900,0.9,0.03*cv[3]); },up*1000); }
export function engineUpdate(dt,on){ const E=SND.E; if(!E) return; const t=SND.ctx.currentTime, sp=Math.abs(ENV.TK.vF)/ENV.ENG_V[ENV.UP.engine], load=on?ENV.TK.load:0, eb=ENV.UP.engine*0.06;
  const target=on?clamp(0.12+0.72*sp+0.22*load,0,1.05):0.05; E.rpm+=(target-E.rpm)*Math.min(1,dt*(target>E.rpm?3.2:1.8)); const r=E.rpm, cv=ENG_VOICE[ENV.UP.tank]||ENG_VOICE.base, f=(cv[0]+r*cv[1])*(1+eb), tc=0.05;
  E.o1.frequency.setTargetAtTime(f,t,tc); E.o2.frequency.setTargetAtTime(f*1.013,t,tc); E.o3.frequency.setTargetAtTime(f*0.5,t,tc); E.lfo.frequency.setTargetAtTime(f*0.25,t,tc);
  E.o4.frequency.setTargetAtTime((300+r*900)*cv[2],t,tc); E.lp.frequency.setTargetAtTime(380+r*1500+load*600,t,tc); E.bp.frequency.setTargetAtTime(500+r*1300,t,tc);
  const vol=on?1:0.25; E.eg.gain.setTargetAtTime((0.13+0.09*load+0.05*r)*vol,t,0.08); E.ng.gain.setTargetAtTime((0.012+0.05*load*r)*vol*cv[3],t,0.1); E.wg.gain.setTargetAtTime((0.006+0.014*r+0.006*ENV.UP.engine)*vol*cv[2],t,0.1); }
export function sNz(dur,type,freq,q,vol,att){ const ctx=SND.ctx; if(!ctx||SND.muted) return; vol*=SND.sk; if(vol<0.003) return; const t=ctx.currentTime, s=ctx.createBufferSource(); s.buffer=SND.noise; const f=ctx.createBiquadFilter(); f.type=type; f.frequency.value=freq; f.Q.value=q;
  const g=ctx.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+(att||0.003)); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); s.connect(f); f.connect(g); g.connect(sndOut(ctx)); s.start(t,Math.random()*0.5); s.stop(t+dur+0.05); }
export function sO(f0,f1,dur,vol,type){ const ctx=SND.ctx; if(!ctx||SND.muted) return; vol*=SND.sk; if(vol<0.003) return; const t=ctx.currentTime, o=ctx.createOscillator(); o.type=type||'sine'; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  const g=ctx.createGain(); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(g); g.connect(sndOut(ctx)); o.start(t); o.stop(t+dur+0.05); }
export const sfxMg=()=>{ if(ENV.UP.mg==='kpv'){ sNz(0.14,'bandpass',700,0.7,0.35); sO(140,50,0.12,0.25,'square'); } else { sNz(0.06,'bandpass',1600,0.8,0.22); sO(180,90,0.05,0.12,'square'); } };
export const sfxCannon=()=>{ sNz(0.5,'lowpass',900,0.7,0.6); sO(120,40,0.4,0.5); };
export const sfxRocket=()=>{ sNz(0.45,'bandpass',1200,0.6,0.25,0.02); sO(300,900,0.3,0.06,'sawtooth'); };
export const sfxBoom=k=>{ sNz(1.3,'lowpass',420,0.6,0.7*k,0.01); sO(70,28,0.9,0.55*k); };
export const sfxTick=()=>{ if(SND.tick>0) return; SND.tick=0.04; sNz(0.04,'highpass',2500,0.6,0.08); };
export const sfxGlass=k=>{ sNz(0.35,'highpass',4200,1.5,0.2*k+0.05); };
export const sfxThud=k=>{ sNz(0.25,'lowpass',300,0.7,0.35*k+0.05); };
export const sfxClick=()=>{ sO(900,600,0.05,0.08,'square'); };
export const sfxBuy=()=>{ sO(520,780,0.12,0.12,'triangle'); setTimeout(()=>sO(780,1170,0.16,0.1,'triangle'),90); sNz(0.2,'bandpass',3000,2,0.06); };
export const sfxPickup=k=>{ if(k){ sO(440,880,0.12,0.12,'triangle'); setTimeout(()=>sO(660,1320,0.16,0.1,'triangle'),70); return; } if(SND.pk>0) return; SND.pk=0.04; const f=880+rnd()*240; sO(f,f*1.6,0.09,0.09,'triangle'); sNz(0.05,'highpass',5200,1,0.035); };
export const sfxCharge=k=>{ sO(180+(k||0)*200,900+(k||0)*900,0.5,0.05,'sawtooth'); };
export const sfxJump=()=>{ sNz(0.18,'bandpass',900,1,0.15); sO(240,520,0.16,0.07,'square'); };
export const sfxClang=()=>{ if(SND.cl>0) return; SND.cl=0.06; sO(620,400,0.22,0.14,'square'); sNz(0.12,'bandpass',3200,3,0.12); };
export const sfxHatch=()=>{ sNz(0.4,'lowpass',600,1,0.2); sO(95,60,0.3,0.1,'square'); };
export const sfxMgE=()=>{ if(SND.etk>0) return; SND.etk=0.05; sNz(0.06,'bandpass',1100,0.8,0.13); sO(150,80,0.05,0.07,'square'); };
export const sfxCannonE=()=>{ sNz(0.4,'lowpass',700,0.7,0.35); sO(100,36,0.35,0.28); };
export const sfxBeam=()=>{ sO(1800,160,0.5,0.14,'sawtooth'); sNz(0.5,'highpass',2000,0.7,0.2); };
export const sfxCreak=()=>{ sO(70,38,1.0,0.13,'sawtooth'); sNz(0.8,'lowpass',300,2,0.2); };
export const sfxWrench=()=>{ for(let k=0;k<4;k++) setTimeout(()=>sNz(0.07,'bandpass',2400+k*300,4,0.12),k*90); };

