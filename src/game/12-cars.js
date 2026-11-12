/* ================= CARS ================= */
let lastDestroyed=0;
function carCount(cr){ const b=cr.b; let n=0; for(let y=b[1];y<b[4];y++)for(let z=b[2];z<b[5];z++)for(let x=b[0];x<b[3];x++) if(get(x,y,z)) n++; return n; }
function carBoom(cr){ cr.dead=true; cr.smoke=3;
  explode(cr.x,0.9,cr.z,2.4*cr.big,1.6,0,-1,0,'shell',null,1.6,null,0.5);
  const G2=P.glow2, GL=P.glow; for(let k=0;k<22;k++) FIRE.spawn(cr.x+(rnd()-0.5)*3,0.6+rnd()*1.5,cr.z+(rnd()-0.5)*3,(rnd()-0.5)*6,3+rnd()*5,(rnd()-0.5)*6,2+rnd()*2.5,3.5,0.5+rnd()*0.4,1,k%2?G2[0]:GL[0],k%2?G2[1]:GL[1],k%2?G2[2]:GL[2]);
  FIRE.spawn(cr.x,1.2,cr.z,0,1,0,12,8,0.22,1,1,0.95,0.75); groundFlash(cr.x,cr.z,16,GL,0.8);
  for(let k=0;k<80;k++){ const a=rnd()*TAU, s=10+18*rnd(); spark(cr.x,1,cr.z,Math.cos(a)*s,4+rnd()*10,Math.sin(a)*s,1,0.85,0.5,0.6+0.8*rnd()); }
  addMark({t:0,x:cr.x,z:cr.z,r:3.4}); shake=Math.min(1,shake+0.6); sfxBoom(1.4); }
function carsUpdate(dt){ const chk=destroyed!==lastDestroyed; lastDestroyed=destroyed; if(chk) vehsCheck();
  for(const cr of CARS){
    if(cr.smoke>0){ cr.smoke-=dt; const sm=mix3(P.dark,P.bg,0.3); if(rnd()<0.5*cr.smoke/3) SMOKE.spawn(cr.x+(rnd()-0.5)*1.5,0.8,cr.z+(rnd()-0.5)*1.5,(rnd()-0.5)*0.6,1.6+rnd(),(rnd()-0.5)*0.6,1.1,1.5,2,0.45,sm[0],sm[1],sm[2]); continue; }
    if(cr.dead) continue;
    if(cr.fuse>0){ cr.fuse-=dt; if(rnd()<0.6){ const sm=mix3(P.dark,P.bg,0.3); SMOKE.spawn(cr.x+(rnd()-0.5),1,cr.z+(rnd()-0.5),0,1.5,0,0.8,1.4,0.8,0.5,sm[0],sm[1],sm[2]); } if(cr.fuse<=0) carBoom(cr); continue; }
    if(chk&&cr.n0&&carCount(cr)<cr.n0*0.5){ cr.fuse=0.25+rnd()*0.45; } } }

