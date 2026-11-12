/* ================= TANK STATE & PHYSICS ================= */
const TK={joyRev:false,jyaw:0,load:0,x:40,z:44,h:Math.PI,vx:0,vz:0,vF:0,steer:0,yaw:0,pitch:0,pitchV:0,roll:0,rollV:0,aL:0,prevVF:0,tYaw:Math.PI,gPitch:0,wheel:0,recoil:0,
  y:0,yV:0,air:false,tPitch:0,tRoll:0,wet:false,hp:100,dmgS:[0,0,0,0,0],dead:false,deadT:0};
let tank=null;
const shadowM=new THREE.Mesh(new THREE.PlaneGeometry(3.6,4.0),new THREE.MeshBasicMaterial({map:TEX_SOFT,color:0x000000,transparent:true,opacity:0.55,depthWrite:false})); shadowM.rotation.x=-Math.PI/2; scene.add(shadowM);
function buildGameTank(){ if(tank){ scene.remove(tank.root); disposeTank(tank); } tank=makeTank(false,UP); mergeStatic(tank.root); scene.add(tank.root); }
const TR=1.38;
const SAMP=[]; for(let k=0;k<16;k++){ const a=k/16*TAU; SAMP.push([Math.sin(a),Math.cos(a),TR]); } for(let k=0;k<8;k++){ const a=k/8*TAU+0.2; SAMP.push([Math.sin(a),Math.cos(a),0.75]); }
const SH_Y=[0.35,1.0,1.7,2.4];
function tankContacts(px,pz,out){ out.length=0; for(const s of SAMP){ const sx=px+s[0]*s[2], sz=pz+s[1]*s[2];
    for(const hy of SH_Y){ const cx=Math.floor(sx/VS), cy=Math.floor(hy/VS), cz=Math.floor(sz/VS); const m=get(cx,cy,cz); if(m){ out.push(cx,cy,cz,m,s[0],s[1]); break; } } } return out.length/6; }
const CT=[]; let ramCD=0, transit=false;
const gate=v=>v>35.4&&v<44.6;
function maxHP(){ return Math.round(ARM_HP[UP.armor]*chs().hp); }
const WH4=[0,0,0,0];
function tankUpdate(dt,inp){
  const fx=Math.sin(TK.h), fz=Math.cos(TK.h); let vF=TK.vx*fx+TK.vz*fz, vL=TK.vx*fz-TK.vz*fx; let th=inp.throttle, joyYaw=null;
  if(inp.joy){ const tgt=Math.atan2(inp.joy.x,inp.joy.y), dF=wrapA(tgt-TK.h), dB=wrapA(tgt-TK.h-Math.PI);
    let rev=TK.joyRev; const hy=0.35+Math.min(0.5,Math.abs(vF)*0.06);
    if(rev){ if(Math.abs(dF)<Math.abs(dB)-hy) rev=false; } else if(Math.abs(dB)<Math.abs(dF)-hy) rev=true; TK.joyRev=rev;
    const d=rev?dB:dF, al=Math.cos(d); joyYaw=clamp(d*3.4,-2.3,2.3);
    th=(rev?-1:1)*inp.joy.m*(al>0.8?1:al>0.3?(al-0.3)/0.5:0); }
  TK.load=Math.abs(th);
  const wet=TK.wet, CHc=chs(), vmax=ENG_V[UP.engine]*CHc.spd*(wet?0.42:1), A=ENG_A[UP.engine]*CHc.acc*(wet?0.6:1);
  let acc=0; if(th>0) acc=vF<-0.3?28:(vF<vmax*Math.max(th,0.3)?A*(1-vF/(vmax*1.16)):0); else if(th<0) acc=vF>0.3?-28:(vF>-8.5*Math.max(-th,0.3)*(wet?0.5:1)?-12:0);
  vF+=acc*dt; const dec=(1.6+0.035*vF*vF+(inp.hb?16:0)+(wet?3+0.3*vF*vF:0))*dt; vF=Math.abs(vF)<=dec?0:vF-Math.sign(vF)*dec;
  vL*=Math.exp(-(inp.hb?1.4:8.5)*dt);
  const maxS=lerp(0.62,0.27,clamp(Math.abs(vF)/12,0,1)); let yaw;
  if(joyYaw!==null){ TK.jyaw+=(joyYaw-TK.jyaw)*Math.min(1,dt*7); yaw=TK.jyaw; TK.steer+=(clamp(yaw*0.3*(vF<-0.3?-1:1),-0.55,0.55)-TK.steer)*Math.min(1,dt*8); }
  else { TK.jyaw*=Math.exp(-dt*10); TK.steer+=(inp.steer*maxS-TK.steer)*Math.min(1,dt*8); yaw=vF*Math.tan(TK.steer)/1.75*(inp.hb?1.4:1)+TK.jyaw+(CHc.abil==='stealth'?inp.steer*1.9*(1-clamp(Math.abs(vF)/5,0,1)):0); }
  if(TK.air) yaw*=0.4;
  yaw*=CHc.turn; TK.h+=yaw*dt; TK.yaw=yaw;
  const nfx=Math.sin(TK.h), nfz=Math.cos(TK.h); TK.vx=nfx*vF+nfz*vL; TK.vz=nfz*vF-nfx*vL;
  let nx=TK.x+TK.vx*dt, nz=TK.z+TK.vz*dt;
  nx=clamp(nx,1.6,WX-1.6); nz=clamp(nz,1.6,WZ-1.6);
  let n=tankContacts(nx,nz,CT); const speed=Math.hypot(TK.vx,TK.vz);
  if(n&&speed>2.5&&!LOC.safe){ const pow=speed*0.6*CHc.ram; let smashed=0, hardSum=0;
    for(let k=0;k<CT.length;k+=6){ const m=CT[k+3]; if(MD[m].hard<=pow){ hardSum+=ram(CT[k],CT[k+1],CT[k+2],pow); smashed++; } }
    if(smashed){ n=tankContacts(nx,nz,CT); const slow=Math.pow(0.5,dt*smashed*0.8); TK.vx*=slow; TK.vz*=slow;
      if(hardSum>0) damageTank(hardSum*0.005*(UP.armor>=2?0.5:1)/CHc.ram,TK.vx,TK.vz,0); } }
  if(n){ let sx=0,sz=0; for(let k=0;k<CT.length;k+=6){ sx-=CT[k+4]; sz-=CT[k+5]; } const l=Math.hypot(sx,sz)||1; sx/=l; sz/=l;
    const vn=TK.vx*sx+TK.vz*sz; if(vn<0){ TK.vx-=vn*sx*1.12; TK.vz-=vn*sz*1.12; const imp=-vn;
      if(imp>2.5){ const fw=-(sx*nfx+sz*nfz), sd=-(sx*nfz-sz*nfx); TK.pitchV+=imp*0.09*fw; TK.rollV+=imp*0.07*sd; shake=Math.min(1,shake+imp*0.025); sfxThud(Math.min(1,imp/10)); sfxClank(Math.min(1,imp/8));
        if(imp>4) damageTank((imp-4)*0.8*(UP.armor>=2?0.5:1),-sx,-sz,0);
        const dc=mix3(P.mid,P.bg,0.3); for(let k=0;k<3;k++) SMOKE.spawn(TK.x-sx*1.4,0.8,TK.z-sz*1.4,(rnd()-0.5)*2,0.8,(rnd()-0.5)*2,1,1.2,0.9,0.45,dc[0],dc[1],dc[2]); } }
    if(vn<0&&-vn>0.6&&-vn<=2.5) sfxClank(Math.min(0.5,-vn/6));
    if(speed>1.2){ scrapeT-=dt; if(scrapeT<=0){ scrapeT=0.12; sfxScrape(Math.min(1,speed/8)); if(rnd()<0.6) spark(TK.x-sx*1.5,0.6,TK.z-sz*1.5,(rnd()-0.5)*3,1+rnd()*2,(rnd()-0.5)*3,1,0.8,0.4,0.25); } }
    const c0=tankContacts(TK.x,TK.z,CT), mx=TK.x+TK.vx*dt, mz=TK.z+TK.vz*dt;
    if(tankContacts(mx,mz,CT)<=c0){ nx=mx; nz=mz; }
    else if(tankContacts(mx,TK.z,CT)<=c0){ nx=mx; nz=TK.z; TK.vz*=-0.12; }
    else if(tankContacts(TK.x,mz,CT)<=c0){ nx=TK.x; nz=mz; TK.vx*=-0.12; }
    else { nx=TK.x; nz=TK.z; TK.vx*=-0.12; TK.vz*=-0.12; } }
  for(let it=0;it<8;it++){ if(!tankContacts(nx,nz,CT)) break; let px=0,pz=0; for(let k=0;k<CT.length;k+=6){ px-=CT[k+4]; pz-=CT[k+5]; } const pl=Math.hypot(px,pz); if(pl<1e-3) break; nx+=px/pl*0.06; nz+=pz/pl*0.06; }
  TK.x=clamp(nx,1.6,WX-1.6); TK.z=clamp(nz,1.6,WZ-1.6);
  if(!transit) tankVsEnemies();
  vF=TK.vx*nfx+TK.vz*nfz; TK.vF=vF;
  terrainUpdate(dt);
  const aL=(vF-TK.prevVF)/Math.max(dt,1e-3); TK.prevVF=vF; TK.aL+=(aL-TK.aL)*Math.min(1,dt*10);
  const pT=clamp(-TK.aL*0.0058,-0.17,0.17)+TK.tPitch, rT=clamp(vF*yaw*0.0048,-0.15,0.15)+TK.tRoll;
  TK.pitchV+=((pT-TK.pitch)*70-TK.pitchV*8.5)*dt; TK.pitch+=TK.pitchV*dt; TK.rollV+=((rT-TK.roll)*80-TK.rollV*9)*dt; TK.roll+=TK.rollV*dt;
  TK.wheel+=vF*dt/0.56; { const yr=TK.yaw||0; TK.wR=(TK.wR||0)+(vF-yr*1.2)*dt/0.56; TK.wL=(TK.wL||0)+(vF+yr*1.2)*dt/0.56; }
  const slip=Math.abs(vL)>2.5||(Math.abs(acc)>20&&Math.abs(vF)>1);
  if(slip&&rnd()<0.6&&!wet){ const dc=mix3(P.side,[1,1,1],0.15); const bx=TK.x-nfx*1.0, bz=TK.z-nfz*1.0; SMOKE.spawn(bx+(rnd()-0.5)*2,0.3,bz+(rnd()-0.5)*0.5,(rnd()-0.5),0.6,(rnd()-0.5),0.6,1.4,0.9,0.35,dc[0],dc[1],dc[2]); }
  if(wet&&speed>0.8&&rnd()<0.8){ const w=mix3(P.glass,[1,1,1],0.3); const s=WHL[(rnd()*4)|0], ch=Math.cos(TK.h), sh=Math.sin(TK.h); const wx=TK.x+s[0]*ch+s[1]*sh, wz=TK.z-s[0]*sh+s[1]*ch;
    spark(wx,0,wz,(rnd()-0.5)*3+TK.vx*0.3,2+rnd()*3,(rnd()-0.5)*3+TK.vz*0.3,w[0],w[1],w[2],0.5); if(rnd()<0.4) SMOKE.spawn(wx,0.1,wz,0,0.6,0,0.7,1.6,0.7,0.4,w[0]*0.85,w[1]*0.9,w[2]); }
  const d=DEB; for(let i=0;i<d.n;i++){ const ox=d.px[i]-TK.x, oz=d.pz[i]-TK.z; if(d.py[i]>2.2+TK.y) continue; const q=ox*ox+oz*oz; if(q>2.4) continue; const l=Math.sqrt(q)+0.01;
    d.px[i]=TK.x+ox/l*1.56; d.pz[i]=TK.z+oz/l*1.56; d.vx[i]=ox/l*(1+speed*0.6)+TK.vx*0.5; d.vz[i]=oz/l*(1+speed*0.6)+TK.vz*0.5; d.vy[i]=1+speed*0.25*rnd(); d.rest[i]=0; }
  for(const r of rigids){ const ox=r.pos.x-TK.x, oz=r.pos.z-TK.z, l=Math.hypot(ox,oz); if(r.pos.y-r.hy>2.4||l>1.4+Math.min(r.hx,r.hz)+0.3) continue;
    r.vel.x+=ox/(l+0.01)*(1+speed*0.5)*dt*8; r.vel.z+=oz/(l+0.01)*(1+speed*0.5)*dt*8; r.vel.y+=speed*dt*1.5; r.ang.x+=(rnd()-0.5)*dt*4; r.ang.z+=(rnd()-0.5)*dt*4; r.sleep=false; }
}
function terrainUpdate(dt){ const ch=Math.cos(TK.h), sh=Math.sin(TK.h);
  for(let i=0;i<4;i++){ const lx=WHL[i][0], lz=WHL[i][1]; WH4[i]=groundH(TK.x+lx*ch+lz*sh, TK.z-lx*sh+lz*ch); }
  const tgt=(WH4[0]+WH4[1]+WH4[2]+WH4[3])/4;
  TK.tPitch=Math.atan2(((WH4[2]+WH4[3])-(WH4[0]+WH4[1]))/2,1.76);
  TK.tRoll=Math.atan2(((WH4[0]+WH4[2])-(WH4[1]+WH4[3]))/2,2.16);
  const rate=(tgt-(TK.ptgt??tgt))/Math.max(dt,1e-3); TK.ptgt=tgt; const dP=TK.tPitch-(TK.ptP??TK.tPitch), dR=TK.tRoll-(TK.ptR??TK.tRoll); TK.ptP=TK.tPitch; TK.ptR=TK.tRoll;
  TK.pitchV+=dP*9; TK.rollV+=dR*9;
  if(TK.y>tgt+0.004) TK.yV-=22*dt; else { TK.yV+=((tgt-TK.y)*260-TK.yV*13)*dt; if(rate>0.4) TK.yV=Math.max(TK.yV,rate*1.6); }
  const wasAir=TK.air, vyBefore=TK.yV; TK.y+=TK.yV*dt; if(TK.y<tgt-0.12){ TK.y=tgt-0.12; if(TK.yV<0) TK.yV*=0.3; }
  TK.air=TK.y>tgt+0.05;
  if(wasAir&&!TK.air&&vyBefore<-2){ const k=Math.min(1,-vyBefore/7); TK.pitchV+=(rnd()-0.4)*1.2*k; TK.rollV+=(rnd()-0.5)*0.9*k; shake=Math.min(1,shake+0.15*k); sfxThud(0.4+0.6*k);
    const dc=mix3(P.side,[1,1,1],0.12); for(let n=0;n<5;n++) SMOKE.spawn(TK.x+(rnd()-0.5)*2.4,0.2,TK.z+(rnd()-0.5)*2.4,(rnd()-0.5)*2,0.5,(rnd()-0.5)*2,0.8,1.5,0.8,0.4,dc[0],dc[1],dc[2]); }
  const dep=-groundH(TK.x,TK.z); TK.wet=dep>0.28&&inWater(TK.x,TK.z); }
function ram(cx,cy,cz,pow){ const rr=Math.max(1,Math.round(0.55/VS)); const rem=[]; let hs=0;
  for(let y=Math.max(0,cy-rr);y<=cy+rr;y++)for(let z=cz-rr;z<=cz+rr;z++)for(let x=cx-rr;x<=cx+rr;x++){ const m=get(x,y,z); if(!m||MD[m].hard>pow) continue; if((x-cx)**2+(y-cy)**2+(z-cz)**2>rr*rr+1) continue;
    rem.push(x,y,z,m); grid[gi(x,y,z)]=0; markDirty(x,y,z); hs+=MD[m].hard>2?MD[m].hard*VS*VS*VS*30:0; }
  if(!rem.length) return 0; destroyed+=rem.length/4; let glass=0;
  for(let r=0;r<rem.length;r+=4){ const m=rem[r+3]; if(MD[m].glass) glass++; if(rnd()>0.7) continue; voxelColor(m,rem[r],rem[r+1],rem[r+2],col);
    debSpawn((rem[r]+0.5)*VS,(rem[r+1]+0.5)*VS,(rem[r+2]+0.5)*VS,TK.vx*(0.8+0.5*rnd())+(rnd()-0.5)*3,1.5+rnd()*4,TK.vz*(0.8+0.5*rnd())+(rnd()-0.5)*3,col[0],col[1],col[2],VS*(0.6+0.4*rnd())); }
  const GL=P.glass; for(let k=0;k<glass*2;k++) spark((cx+0.5)*VS,(cy+0.5)*VS,(cz+0.5)*VS,(rnd()-0.5)*6+TK.vx*0.5,rnd()*5,(rnd()-0.5)*6+TK.vz*0.5,GL[0],GL[1],GL[2],0.5+0.5*rnd());
  if(glass) sfxGlass(0.5); else if(ramCD<=0){ sfxThud(0.6); ramCD=0.12; }
  structural(rem); return hs; }
function damageTank(amount,dx,dz,top){ if(LOC.safe||transit||TK.dead||amount<=0.05) return; if(SHD.on){ shieldHit(amount*0.9); return; } TK.hp-=amount; armHit(amount,dx,dz,top);
  const ch=Math.cos(TK.h), sh=Math.sin(TK.h), l=Math.hypot(dx,dz)||1, lx=(dx*ch-dz*sh)/l, lz=(dx*sh+dz*ch)/l; const a=amount/maxHP()*2.6, S=TK.dmgS;
  S[0]=Math.min(1,S[0]+Math.max(0,lz)*a); S[1]=Math.min(1,S[1]+Math.max(0,-lz)*a); S[2]=Math.min(1,S[2]+Math.max(0,lx)*a); S[3]=Math.min(1,S[3]+Math.max(0,-lx)*a); S[4]=Math.min(1,S[4]+(top||0)*a);
  if(amount>1.5) screenFlash(Math.min(0.55,amount/45),true);
  if(amount>2){ const hb=$('#hpBar'); hb.classList.remove('flash'); void hb.offsetWidth; hb.classList.add('flash'); }
  if(TK.hp<=0){ TK.hp=0; killTank(); } }
function killTank(){ TK.dead=true; TK.deadT=2.6; TK.vx*=0.2; TK.vz*=0.2;
  const G2=P.glow2; for(let k=0;k<30;k++) FIRE.spawn(TK.x+(rnd()-0.5)*2,1+rnd()*1.5,TK.z+(rnd()-0.5)*2,(rnd()-0.5)*5,3+rnd()*4,(rnd()-0.5)*5,2+rnd()*2,3,0.5+rnd()*0.4,1,G2[0],G2[1],G2[2]);
  for(let k=0;k<70;k++){ const a=rnd()*TAU, s=8+14*rnd(); spark(TK.x,1.5,TK.z,Math.cos(a)*s,4+rnd()*8,Math.sin(a)*s,1,0.85,0.5,0.6+0.6*rnd()); }
  shake=1; sfxBoom(1.5); banner({cn:'击毁',ru:'Танк подбит',sub:'эвакуация в лагерь · −20% лома'}); onTankLost(); }

