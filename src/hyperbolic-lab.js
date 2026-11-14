import {OCTAGON_VERTICES,SIDES,insideOctagon,moveBolza,geodesicBetween,hyperbolicDistance,norm,rotate} from './hyperbolic.js';
import {forecastBolzaPair,pairedSideGlyph} from './hyperbolic-visuals.js';
const canvas=document.getElementById('field'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id),keys=new Set();
const colors=['#b5aa80','#9cc9c4','#ca9f86','#a9aad2'];
const cx=500,cy=354,scale=346;
const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
let showPairPreviews=true,nearestPair=null;
const toScreen=p=>({x:cx+p.x*scale,y:cy-p.y*scale});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const targets=[{x:.17,y:.42},{x:-.39,y:.08},{x:.36,y:-.29}];
let pilot,shots,trail,elapsed,travel,hitCount,paused,lastFrame,launchClock,seenCrossing;
function reset(){pilot={position:{x:0,y:0},heading:{x:0,y:1},crossings:0};shots=[];trail=[];elapsed=0;travel=0;hitCount=0;paused=false;lastFrame=0;launchClock=0;seenCrossing='none';$('pause').textContent='Pause';updateHUD();}
function updateHUD(){
  $('cross').textContent=seenCrossing;$('count').textContent=pilot.crossings;
  $('distance').textContent=travel.toFixed(2)+' hyperbolic units';$('hits').textContent=hitCount;
  $('state').textContent=paused?'paused':'running';
  $('next-join').textContent=showPairPreviews&&nearestPair?`${nearestPair.sourceGlyph} → ${nearestPair.targetGlyph} (≈${nearestPair.approximateDistance})`:'not approaching';
}
function moveActor(actor,distance){
  if(Math.abs(distance)<1e-8)return;
  try{
    const result=moveBolza(actor.position,actor.heading,distance);
    actor.position=result.position;actor.heading=result.heading;
    if(result.crossings.length){actor.crossings=(actor.crossings||0)+result.crossings.length;
      const crossing=result.crossings.at(-1);seenCrossing=`${'ABCD'[crossing.pair]} · side ${crossing.from+1} → ${crossing.to+1}`;
      if(actor===pilot)trail.push(null);
    }
    return result;
  }catch(error){
    // Large steps near a vertex may need more sophisticated path splitting.
    seenCrossing='vertex tolerance — reposition';actor.position={x:0,y:0};
  }
}
function tick(dt){
  elapsed+=dt;launchClock=Math.max(0,launchClock-dt);
  const steer=(keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0);
  const turn=steer*2.7*dt;
  const d=pilot.heading;pilot.heading={x:d.x*Math.cos(turn)-d.y*Math.sin(turn),y:d.x*Math.sin(turn)+d.y*Math.cos(turn)};
  const travelAxis=(keys.has('ArrowUp')?1:0)-(keys.has('ArrowDown')?1:0),length=travelAxis*(travelAxis>0?1.55:1.1)*dt;
  if(length){moveActor(pilot,length);travel+=Math.abs(length);trail.push({...pilot.position});if(trail.length>220)trail.shift();}
  if(keys.has('Space')&&launchClock<=0){shots.push({position:{...pilot.position},heading:{...pilot.heading},age:0,crossings:0});launchClock=.24;}
  for(const shot of shots){
    shot.age+=dt;moveActor(shot,2.7*dt);
    for(let j=0;j<targets.length;j++){
      if(hyperbolicDistance(shot.position,targets[j])<.105){hitCount++;shot.age=5;targets[j]=rotate(((hitCount*17+j*5)%19)/19*Math.PI*2);targets[j].x*=.46;targets[j].y*=.46;break;}
    }
  }
  shots=shots.filter(s=>s.age<3.8);
  nearestPair=showPairPreviews?forecastBolzaPair(pilot.position,pilot.heading,{lookAhead:.45}):null;
  updateHUD();
}
function lineBetween(a,b,color,width=2){const start=toScreen(a),end=toScreen(b);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.lineTo(end.x,end.y);ctx.stroke();}
function projectedHollow(point,r=11,color='#8bd2c7'){
  const p=toScreen(point);
  ctx.save();ctx.globalAlpha=.56;ctx.strokeStyle=color;ctx.lineWidth=2;
  ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle=color;ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText('FUTURE',p.x,p.y-r-7);ctx.restore();
}
function drawPairForecast(preview,{label=true,color='#8bd2c7'}={}){
  if(!preview)return;
  const source=toScreen(preview.source),dest=toScreen(preview.destination);
  ctx.save();ctx.strokeStyle=color;ctx.lineWidth=1.2;ctx.setLineDash([2,5]);
  // Two short local pointers, never a false teleport line across the polygon.
  ctx.beginPath();ctx.moveTo(source.x-11,source.y-11);ctx.lineTo(source.x,source.y);ctx.moveTo(dest.x+11,dest.y+11);ctx.lineTo(dest.x,dest.y);ctx.stroke();ctx.setLineDash([]);ctx.restore();
  projectedHollow(preview.destination,11,color);
  if(label){ctx.fillStyle='#e5d8ba';ctx.font='13px monospace';ctx.textAlign='center';ctx.fillText(`${preview.sourceGlyph} → ${preview.targetGlyph}`,dest.x,dest.y+26);}
}
function draw(){
  ctx.fillStyle='#050708';ctx.fillRect(0,0,1000,700);
  ctx.strokeStyle='#34484c';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy,scale,0,2*Math.PI);ctx.stroke();
  for(let r=.25;r<=.75;r+=.25){ctx.strokeStyle='#162427';ctx.beginPath();ctx.arc(cx,cy,r*scale,0,2*Math.PI);ctx.stroke();}
  ctx.setLineDash([3,9]);ctx.strokeStyle='#1d3336';lineBetween({x:-.95,y:0},{x:.95,y:0},'#1d3336',1);lineBetween({x:0,y:-.95},{x:0,y:.95},'#1d3336',1);ctx.setLineDash([]);
  for(const side of SIDES){
    ctx.beginPath();for(let i=0;i<=32;i++){const z=toScreen(geodesicBetween(side.from,side.to,i/32));if(i===0)ctx.moveTo(z.x,z.y);else ctx.lineTo(z.x,z.y);}
    const active=showPairPreviews&&nearestPair&&(side.id===nearestPair.from||side.id===nearestPair.to);
    ctx.strokeStyle=colors[side.pair];ctx.lineWidth=active?6:3.5;ctx.stroke();
    const mid=geodesicBetween(side.from,side.to,.5),m=toScreen(mid);ctx.fillStyle=colors[side.pair];ctx.font='bold 19px sans-serif';ctx.textAlign='center';ctx.fillText(pairedSideGlyph(side.id),m.x*1.05-cx*.05,m.y*1.05-cy*.05);
  }
  if(trail.length){ctx.lineWidth=1.5;ctx.strokeStyle='#4e7375';ctx.beginPath();let active=false;for(const pos of trail){if(!pos){active=false;continue;}const p=toScreen(pos);if(!active){ctx.moveTo(p.x,p.y);active=true;}else ctx.lineTo(p.x,p.y);}ctx.stroke();}
  for(const t of targets){const p=toScreen(t),pulse=reducedMotion?1:1+.13*Math.sin(elapsed*3);ctx.fillStyle='#caa36c';ctx.beginPath();ctx.arc(p.x,p.y,8*pulse,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e8c88e';ctx.lineWidth=1;ctx.stroke();}
  for(const shot of shots){const p=toScreen(shot.position);ctx.fillStyle='#89d4cb';ctx.beginPath();ctx.arc(p.x,p.y,3.5,0,Math.PI*2);ctx.fill();}
  if(showPairPreviews){
    const projections=shots.map(shot=>forecastBolzaPair(shot.position,shot.heading,{lookAhead:.24})).filter(Boolean).slice(0,2);
    for(const preview of projections)drawPairForecast(preview,{label:false,color:'#8bc4d2'});
    drawPairForecast(nearestPair);
  }
  const pp=toScreen(pilot.position),angle=Math.atan2(pilot.heading.y,pilot.heading.x);
  ctx.save();ctx.translate(pp.x,pp.y);ctx.rotate(-angle+Math.PI/2);ctx.fillStyle='#f1e4be';ctx.strokeStyle='#0b1417';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(8,12);ctx.lineTo(0,6);ctx.lineTo(-8,12);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  ctx.textAlign='left';ctx.fillStyle='#b5c1c0';ctx.font='14px monospace';ctx.fillText('Poincaré disk · compact genus-two quotient',16,25);
  ctx.font='12px monospace';ctx.fillStyle='#76898b';ctx.fillText('Unit disk boundary is NOT a game edge. Colored octagon sides are paired.',16,45);
  ctx.fillText('Intrinsic movement • angle-preserving side pairing • no automatic weapons',16,682);
}
function frame(time){if(!lastFrame)lastFrame=time;const dt=clamp((time-lastFrame)/1000,0,.045);lastFrame=time;if(!paused)tick(dt);draw();requestAnimationFrame(frame);}
for(const key of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyP','KeyR']){
  window.addEventListener('keydown',event=>{if(event.code!==key||event.target?.closest?.('button,a,input'))return;event.preventDefault();keys.add(key);if(event.repeat)return;if(key==='KeyP')togglePause();if(key==='KeyR')reset();});
}
window.addEventListener('keyup',event=>keys.delete(event.code));window.addEventListener('blur',()=>keys.clear());
function togglePause(){paused=!paused;$('pause').textContent=paused?'Resume':'Pause';updateHUD();}
$('reset').addEventListener('click',()=>reset());$('pause').addEventListener('click',()=>togglePause());
$('pair-previews').addEventListener('change',()=>{showPairPreviews=$('pair-previews').checked;nearestPair=null;updateHUD();});
reset();requestAnimationFrame(frame);
