import {SIDES,geodesicBetween} from './hyperbolic.js';
import {forecastBolzaPair,pairedSideGlyph} from './hyperbolic-visuals.js';
import {createPulseStudy,startPulseStudy,stepPulseStudy,advancePulsePhase,pulseCanAdvance,pulseSnapshot,
  submitPulsePrediction,retryPulseTransfer,setPulseCondition,markPulseHelp,pulseDisplayCrossing,PULSE_PHASES} from './divergent-pulse.js';
import {RecordedScoreAudio,STC_SCORE,STC_ROOM_DEFAULT} from './stc-track-player.js';

const $=id=>document.getElementById(id),canvas=$('field'),ctx=canvas.getContext('2d'),keys=new Set();
const audio=new RecordedScoreAudio({sound:true,volume:.5,musicVolume:.55,effectsVolume:.8,spatialMode:'stereo',roomVolume:STC_ROOM_DEFAULT});
let game=createPulseStudy(),lastFrame=0,lastEvent=0,optionsOpener=null,starting=false;
const previousRuns=[];
const preferences={sound:true,volume:.5,musicVolume:.55,effectsVolume:.8,spatialMode:'stereo',roomVolume:STC_ROOM_DEFAULT,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches};
const roomHistory=[{roomVolume:preferences.roomVolume,time:0,phase:0}];
const colors=['#c7b17e','#8ebfb7','#ce9e89','#a9a9cf'],cx=500,cy=350,R=350;
const screen=p=>({x:cx+p.x*R,y:cy-p.y*R});
const edges=SIDES.map(side=>Array.from({length:49},(_,i)=>screen(geodesicBetween(side.from,side.to,i/48))));
const stars=Array.from({length:90},(_,i)=>({x:(i*173+51)%1000,y:(i*97+23)%700}));
const conditionName=()=>({combined:'Combined',visual:'Visual only',audio:'Audio-only · unscored listening',mismatched:'Mismatched audio · non-damaging probe'}[game.condition]);
for(let i=0;i<8;i++){
  const button=document.createElement('button');button.id=`edge-${i}`;button.textContent=`${i+1}`;
  button.setAttribute('aria-label',`Choose edge ${i+1}`);button.addEventListener('click',()=>{
    if(submitPulsePrediction(game,i)){canvas.focus({preventScroll:true});hud();}
  });$('choices').append(button);
}
function focusField(){canvas.focus({preventScroll:true});}
function restart(){
  previousRuns.push({condition:game.condition,probe:game.probe,spatialMode:preferences.spatialMode,roomVolume:preferences.roomVolume,records:structuredClone(game.records),
    guideHistory:structuredClone(game.guideHistory),conditionHistory:structuredClone(game.conditionHistory)});
  audio.stop();keys.clear();game=createPulseStudy({condition:game.condition,probe:game.probe});lastEvent=0;
  hud();draw();
}
function pause(){
  if(game.status!=='running'||$('options-dialog').open)return;
  game.paused=!game.paused;keys.clear();
  if(game.paused)audio.pause();else{void audio.unlock();audio.resume();focusField();}hud();
}
function hud(){
  const phase=PULSE_PHASES[game.phaseIndex],waiting=game.phaseIndex===4&&!game.prediction&&game.condition!=='audio';
  $('phase-title').textContent=`${game.phaseIndex+1} / 5 · ${phase.name}`;
  $('instruction').textContent=game.phaseIndex===4&&game.condition==='audio'?
    'Listen to the motif through its actual crossing. This condition does not score a destination prediction.':phase.instruction;
  $('start').hidden=game.status!=='ready';$('pause').disabled=game.status!=='running';
  $('pause').textContent=game.paused?'Resume (P)':'Pause (P)';
  $('next').disabled=!pulseCanAdvance(game)||game.paused;
  $('next').textContent=game.status==='complete'?'Study complete':game.phaseIndex===4?'Finish study':'Next phase';
  $('choices').hidden=game.phaseIndex!==4||game.condition==='audio';
  for(let i=0;i<8;i++)$(`edge-${i}`).disabled=Boolean(game.prediction)||game.paused||game.status!=='running';
  $('retry-transfer').hidden=game.phaseIndex!==4||!game.feedback;
  $('condition-label').textContent=conditionName();
  $('counts').textContent=`Contacts ${game.contacts} · Targets ${game.targetsHit}`;
  const trace=pulseDisplayCrossing(game);
  $('crossings').textContent=waiting?'Destination withheld until first choice':game.condition==='audio'?'Unscored listening mode':trace?
    `Actual crossing: ${pairedSideGlyph(trace.from)} → ${pairedSideGlyph(trace.to)} · ${trace.objectId}`:'Actual crossing: none';
  const feedback=game.feedback&&!game.feedback.listenOnly?
    `First choice: edge ${game.prediction.firstChoice+1}. Actual arrival: edge ${game.feedback.actualSide+1}. ${game.feedback.correct?'Correct.':'Different arrival.'} ${game.prediction.assisted?'Assisted attempt.':'No help in this trial.'}`:null;
  const musicError=audio.diagnosticState?.().loadError;
  $('status').textContent=starting?'Loading music.':musicError&&preferences.sound?'Music is not available. You can continue with sound off.':game.status==='complete'?'Study complete. This is an observation record, not proof of learning.':game.paused?
    'Paused. Use Resume to continue.':feedback||game.notice||'Safe study. Contacts are counted. Campaign saves are not changed.';
  $('condition').value=game.condition;$('probe').checked=game.probe;
  $('condition').disabled=game.phaseIndex===4;$('probe').disabled=game.phaseIndex===4;
  for(const button of document.querySelectorAll('[data-hold]'))button.disabled=game.condition==='audio'||game.paused||game.status!=='running';
}
function line(a,b,color,width=1){const x=screen(a),y=screen(b);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x.x,x.y);ctx.lineTo(y.x,y.y);ctx.stroke();}
function circle(point,r,color,fill=false){const p=screen(point);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);if(fill)ctx.fill();else ctx.stroke();}
function text(value,x,y,size=15,color='#cbd6cb'){ctx.fillStyle=color;ctx.font=`${size}px system-ui,sans-serif`;ctx.textAlign='center';ctx.fillText(value,x,y);}
function drawActor(item,index=0){
  if(!preferences.reducedMotion)for(const segment of item.trail.slice(-90))if(segment)line(segment.from,segment.to,index?'#584c62':'#3c6260',1.5);
  const p=screen(item.position);ctx.fillStyle=index?'#ceafd7':'#e0c58e';ctx.beginPath();
  ctx.moveTo(p.x,p.y-9);ctx.lineTo(p.x+8,p.y);ctx.lineTo(p.x,p.y+9);ctx.lineTo(p.x-8,p.y);ctx.closePath();ctx.fill();
  text(index?'2':'1',p.x,p.y-18,13);const h=item.heading;line(item.position,{x:item.position.x+h.x*.065,y:item.position.y+h.y*.065},'#dfdfc9',2);
}
function forecast(item){
  const prediction=forecastBolzaPair(item.position,item.heading,{lookAhead:item.speed*.3,stepLimit:.012});if(!prediction)return;
  ctx.save();ctx.globalAlpha=.65;ctx.setLineDash([4,5]);circle(prediction.destination,12,'#a2d4c4');ctx.restore();
  const p=screen(prediction.destination);text('FUTURE',p.x,p.y+29,12,'#a2c3b7');
  text(`${pairedSideGlyph(prediction.from)} → ${pairedSideGlyph(prediction.to)}`,p.x,p.y+44,12);
}
function draw(){
  ctx.fillStyle='#020405';ctx.fillRect(0,0,1000,700);
  for(const star of stars){ctx.fillStyle='#617873';ctx.globalAlpha=.35;ctx.fillRect(star.x,star.y,1.5,1.5);}ctx.globalAlpha=1;
  if(game.condition==='audio'){
    text('AUDIO-ONLY · LISTENING PROBE',500,305,25);text('No combat task. No destination answer is scored.',500,342,18);
    text('Use Next phase after each listening example.',500,376,16);return;
  }
  const waiting=game.phaseIndex===4&&!game.prediction;
  ctx.strokeStyle='#203935';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<edges.length;i++){
    const points=edges[i];ctx.strokeStyle=waiting?'#b1c3b8':colors[i%4];ctx.lineWidth=3;ctx.beginPath();
    points.forEach((point,j)=>j?ctx.lineTo(point.x,point.y):ctx.moveTo(point.x,point.y));ctx.stroke();
    const mid=points[24],x=cx+(mid.x-cx)*1.1,y=cy+(mid.y-cy)*1.1;
    text(waiting?`${i+1}`:`${pairedSideGlyph(i)} · ${i+1}`,x,y,17,waiting?'#d4d5c9':colors[i%4]);
  }
  for(const target of game.targets){circle(target.position,13,'#7f9d94');circle(target.position,6,'#7f9d94');}
  drawActor(game.primary);if(game.secondary)drawActor(game.secondary,1);
  for(const shot of game.shots)circle(shot.position,3,'#b2e2d4',true);
  if([1,2].includes(game.phaseIndex)&&!game.paused){forecast(game.primary);if(game.secondary)forecast(game.secondary);}
  if(game.phaseIndex===3||(game.phaseIndex===4&&game.feedback)){
    const trace=pulseDisplayCrossing(game);
    if(trace){circle(trace.source,14,'#dfc68d');circle(trace.destination,17,'#dfc68d');
      text(`SAME OBJECT · ${trace.objectId} · ${pairedSideGlyph(trace.from)} → ${pairedSideGlyph(trace.to)}`,500,46,18,'#dfc68d');
      const a=screen(trace.source),b=screen(trace.destination);text('DEPARTURE',a.x,a.y+32,12);text('ARRIVAL',b.x,b.y+32,12);
    }
  }
  const p=screen(game.player.position),angle=-Math.atan2(game.player.heading.y,game.player.heading.x);
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);ctx.fillStyle='#a8d6c7';ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-10,-7);ctx.lineTo(-5,0);ctx.lineTo(-10,7);ctx.closePath();ctx.fill();ctx.restore();
  text(waiting?'Choose one numbered edge. The path waits.':'Solid = physical object · hollow dashed = future image · no extra collider',500,675,14);
  if(game.paused){ctx.fillStyle='#020405aa';ctx.fillRect(0,0,1000,700);text('PAUSED',500,350,35);}
}
function processEvents(){
  for(const value of game.events)if(Number(value.eventId.split('-').at(-1))>lastEvent){
    lastEvent=Number(value.eventId.split('-').at(-1));
    if(value.type==='crossing')audio.crossing({...value,pan:Math.max(-.7,Math.min(.7,value.destination.x)),motif:value.family});
    if(value.type==='attack-entered')audio.attack({...value,pan:Math.max(-.7,Math.min(.7,value.position.x)),motif:value.family});
  }
}
$('start').addEventListener('click',async()=>{
  if(starting)return;starting=true;$('start').disabled=true;hud();
  try{
    await audio.unlock();
    if(!$('options-dialog').open&&startPulseStudy(game)){audio.setMode(game.condition);audio.start();processEvents();focusField();}
  }finally{starting=false;$('start').disabled=false;hud();}
});
$('pause').addEventListener('click',pause);$('restart').addEventListener('click',restart);
$('next').addEventListener('click',()=>{if(advancePulsePhase(game)){if(game.status==='complete')audio.stop();focusField();hud();}});
$('retry-transfer').addEventListener('click',()=>{if(retryPulseTransfer(game)){audio.resume();focusField();hud();}});
$('guide').addEventListener('click',()=>{
  optionsOpener=document.activeElement;markPulseHelp(game);game.paused=true;keys.clear();audio.pause();$('options-dialog').showModal();hud();
});
$('close-options').addEventListener('click',()=>$('options-dialog').close());
$('options-dialog').addEventListener('close',()=>{optionsOpener?.focus({preventScroll:true});hud();});
function conditionChange(){
  if(!setPulseCondition(game,$('condition').value,$('probe').checked))game.notice='This condition requires Probe and cannot change during transfer.';
  audio.setMode(game.condition);hud();draw();
}
$('condition').addEventListener('change',conditionChange);$('probe').addEventListener('change',conditionChange);
$('room-volume').value=Math.round(preferences.roomVolume*100);
$('room-volume').addEventListener('input',()=>{
  preferences.roomVolume=Number($('room-volume').value)/100;audio.setOptions({roomVolume:preferences.roomVolume});
  $('room-value').value=preferences.roomVolume===0?'0% · dry':`${Math.round(preferences.roomVolume*100)}%`;
  roomHistory.push({roomVolume:preferences.roomVolume,time:game.time,phase:game.phaseIndex});
});
$('reduced').checked=preferences.reducedMotion;$('reduced').addEventListener('change',()=>{preferences.reducedMotion=$('reduced').checked;draw();});
$('sound').addEventListener('change',()=>{preferences.sound=$('sound').checked;audio.setOptions(preferences);if(preferences.sound)void audio.unlock();});
$('master').addEventListener('input',()=>{preferences.volume=Number($('master').value)/100;audio.setOptions(preferences);});
for(const [id,key] of [['music-volume','musicVolume'],['effects-volume','effectsVolume']]){
  $(id).addEventListener('input',()=>{preferences[key]=Number($(id).value)/100;audio.setOptions(preferences);});
}
$('export').addEventListener('click',()=>{
  const data={study:'stc-study-r7',musicRevision:STC_SCORE.id,audioScoreId:audio.diagnosticState?.().scoreId||STC_SCORE.id,condition:game.condition,probe:game.probe,records:game.records,
    spatialMode:preferences.spatialMode,roomVolume:preferences.roomVolume,audioOptions:{...preferences},roomHistory,
    previousRuns,guideHistory:game.guideHistory,conditionHistory:game.conditionHistory,
    contacts:game.contacts,targetsHit:game.targetsHit,limits:'Local study records. No human understanding or causal music effect is established.'};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),link=document.createElement('a');
  link.href=url;link.download='divergent-pulse-r7-notes.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
window.addEventListener('keydown',event=>{
  if($('options-dialog').open||event.target.closest?.('input,select,textarea'))return;
  if(event.code==='KeyP'){event.preventDefault();if(!event.repeat)pause();return;}
  if(event.target.closest?.('button,a'))return;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(event.code)){event.preventDefault();keys.add(event.code);if(!event.repeat)void audio.unlock();}
});
window.addEventListener('keyup',event=>keys.delete(event.code));
function interrupt(){keys.clear();if(game.status==='running'){game.paused=true;audio.pause();hud();}}
window.addEventListener('blur',interrupt);document.addEventListener('visibilitychange',()=>{if(document.hidden)interrupt();});
for(const button of document.querySelectorAll('[data-hold]')){
  button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture?.(event.pointerId);keys.add(button.dataset.hold);void audio.unlock();focusField();});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,()=>keys.delete(button.dataset.hold));
}
function frame(now){
  const dt=Math.min(.045,Math.max(0,(now-lastFrame)/1000||0));lastFrame=now;
  stepPulseStudy(game,{turn:(keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0),drive:(keys.has('ArrowUp')?1:0)-(keys.has('ArrowDown')?1:0),fire:keys.has('Space')},dt);
  processEvents();if(game.status==='running'&&!game.paused)audio.update({intensity:game.phaseIndex===2?.75:.4,phase:game.phaseIndex});
  hud();draw();requestAnimationFrame(frame);
}
window.arrowSpaceShiftPulse=Object.freeze({read:()=>{
  const diagnostic=audio.diagnosticState?.();
  return {...pulseSnapshot(game),musicRevision:STC_SCORE.id,audioScoreId:diagnostic?.scoreId||STC_SCORE.id,audio:diagnostic,options:{...preferences}};
}});
hud();draw();requestAnimationFrame(frame);
