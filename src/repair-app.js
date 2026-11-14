import {createJourney,loadJourney,saveJourney,syncLegacyParts,DRIVE_PARTS,canAssemble,assembleDrive,activateDrive,completeRepair} from './journey.js';
import {createRepair,startRepair,repairAction,stepRepair,REPAIR_LESSONS} from './repair.js';
import {loadFleetProfile,loadPreferences,savePreferences} from './storage.js';
import {recoverProgressTransfer} from './progress-transfer.js';
import {FlightAudio} from './audio.js';
import {PixelArt} from './pixel-art.js';
import {shipById} from './fleet.js';
import {spaceDistance} from './space.js';
import {mountAudioStatus} from './audio-interface.js';

const progressStorageReady=recoverProgressTransfer();
const $=id=>document.getElementById(id),canvas=$('field'),ctx=canvas.getContext('2d'),dialog=$('guide-dialog');
const systemReduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
const preferences=loadPreferences(undefined,systemReduced),audio=new FlightAudio(preferences),art=new PixelArt();art.load();
const audioStatus=mountAudioStatus(audio,dialog);
const journey=loadJourney(),fleet=loadFleetProfile();
if(syncLegacyParts(journey,fleet)&&progressStorageReady)saveJourney(journey);
let game=createRepair({shipId:journey.actFourBridge?.shipId??fleet.selectedShip,resumeEnding:journey.activated}),lastFrame=0,lastPhase=game.phase,saveFailed=false,opener=null;
const keys=new Set();
if(journey.completed){game.phase='complete';game.endingTime=8;game.message='Campaign complete. Your repaired drive is saved.';}
else if(journey.activated)game.paused=true;
const names={'klein-relay':'Klein Relay','projective-module':'Projective Module','curvature-seed':'Curvature Seed','hyperbolic-core':'Hyperbolic Core'};
function persist(){
  saveFailed=!progressStorageReady||!saveJourney(journey);
  $('save-status').textContent=saveFailed?'Save failed. Keep this page open. Use Save again.':journey.completed?'Campaign completion is saved.':'Banked parts and repair progress are saved.';
  $('save-again').hidden=!saveFailed;return !saveFailed;
}
function panel(){
  $('dock-panel').hidden=game.phase==='running'||game.phase==='ending'&&!game.paused;
  $('parts').replaceChildren(...DRIVE_PARTS.map(id=>{const li=document.createElement('li'),part=journey.parts[id];li.textContent=`${part?'✓':'○'} ${names[id]} · ${part?'extracted and banked':'not yet banked'}`;return li;}));
  const complete=journey.completed,ready=canAssemble(journey);
  const resume=game.phase==='ending'&&journey.activated;
  $('panel-title').textContent=complete?'Arrow Space Shift · Journey complete':resume?'A stable route':journey.assembled?'Drive assembled':'Repair dock';
  $('panel-detail').textContent=complete?'The repaired drive holds a stable route. You carry the return path with you. The stars remain. Your journey can continue.':resume?'The drive is active. Continue the ending to save campaign completion.':journey.assembled?'Deliver charge to three spatial circuits. This safe test uses manual fire, a fold, a Klein return, and capture/release.':ready?'All four extracted parts have saved provenance. Assemble the drive to start its safe activation test.':'Defeat the required bosses. Collect their parts. Extract each part before returning here.';
  $('assemble').hidden=journey.assembled||!ready;
  $('dock-launch').hidden=!journey.assembled;
  $('dock-launch').textContent=resume?'Continue ending':complete?'Replay repair':'Start repair';
  $('replay').hidden=!complete;
  $('save-again').hidden=!saveFailed;
}
function hud(){
  audioStatus.update();
  $('instruction').textContent=!progressStorageReady?'Saved progress needs recovery. Browser writes are blocked.':game.phase==='ready'?canAssemble(journey)?'Repair is ready. Select Start repair.':'Four extracted parts are required.':game.paused?'Paused. Press P to continue.':game.phase==='ending'?'Drive activation · a stable route opens':game.phase==='complete'?saveFailed?'Ending complete. Save pending. Keep this page open.':'Campaign complete. Your repaired drive remains saved.':REPAIR_LESSONS[game.stageIndex].brief;
  $('cause').textContent=game.lastCause||game.message;
  $('pause').textContent=game.paused?'Resume (P)':'Pause (P)';
}
function pause(){if(!['running','ending'].includes(game.phase)||dialog.open)return;game.paused=!game.paused;keys.clear();if(game.paused)audio.setPlaying(false);else audio.unlock();panel();hud();}
$('assemble').addEventListener('click',()=>{if(assembleDrive(journey)){persist();panel();hud();}});
$('dock-launch').addEventListener('click',()=>{
  if(!journey.assembled)return;
  game.paused=false;
  if(journey.completed){game=createRepair({shipId:journey.actFourBridge?.shipId??fleet.selectedShip});startRepair(game);}
  else if(game.phase==='ending')game.paused=false;
  else startRepair(game);
  audio.unlock();keys.clear();panel();hud();canvas.focus({preventScroll:true});
});
$('save-again').addEventListener('click',persist);
$('retry').addEventListener('click',()=>{
  if(!journey.assembled)return;game=createRepair({shipId:journey.actFourBridge?.shipId??fleet.selectedShip});lastPhase='ready';
  keys.clear();audio.setPlaying(false);panel();hud();
});
$('pause').addEventListener('click',pause);
function options(){
  if(dialog.open)return;opener=document.activeElement;game.paused=true;keys.clear();audio.setPlaying(false);dialog.showModal();hud();
}
$('guide').addEventListener('click',options);
dialog.addEventListener('close',()=>{opener?.focus({preventScroll:true});panel();hud();});
for(const [id,key] of [['reduced-motion','reducedMotion'],['sound','sound'],['music','music']]){
  $(id).checked=preferences[key];$(id).addEventListener('change',()=>{preferences[key]=$(id).checked;audio.setOptions(preferences);if(progressStorageReady)savePreferences(preferences);if(preferences.sound)audio.unlock();});
}
for(const [id,key,fallback] of [['volume','volume',.5],['music-volume','musicVolume',.55],['effects-volume','effectsVolume',.8],['ambience-volume','ambienceVolume',.25]]){
  $(id).value=Math.round((preferences[key]??fallback)*100);
  $(id).addEventListener('input',()=>{preferences[key]=Number($(id).value)/100;audio.setOptions(preferences);if(progressStorageReady)savePreferences(preferences);});
}
const actions={ShiftLeft:'fold',ShiftRight:'unfold',KeyC:'capture',KeyE:'release'};
window.addEventListener('keydown',event=>{
  if(!event.repeat&&['Space','KeyC','KeyE','ShiftLeft','ShiftRight','KeyP'].includes(event.code))void audio.resumeFromGesture();
  if(dialog.open||event.target?.closest?.('input,select,textarea'))return;
  if(event.code==='KeyP'){event.preventDefault();if(!event.repeat)pause();return;}
  if(event.target?.closest?.('button,a'))return;
  if(['ArrowLeft','ArrowRight','Space',...Object.keys(actions)].includes(event.code))event.preventDefault();
  if(actions[event.code]&&!event.repeat)repairAction(game,actions[event.code]);
  keys.add(event.code);
});
window.addEventListener('keyup',event=>keys.delete(event.code));
function interrupt(){keys.clear();if(['running','ending'].includes(game.phase)){game.paused=true;audio.setPlaying(false);panel();hud();}}
window.addEventListener('blur',interrupt);
document.addEventListener('visibilitychange',()=>{if(document.hidden)interrupt();});
for(const button of document.querySelectorAll('[data-hold]')){
  button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture?.(event.pointerId);keys.add(button.dataset.hold);audio.unlock();canvas.focus({preventScroll:true});});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,()=>keys.delete(button.dataset.hold));
}
for(const button of document.querySelectorAll('[data-action]'))button.addEventListener('click',()=>{repairAction(game,button.dataset.action);audio.unlock();canvas.focus({preventScroll:true});});
const project=(x,z)=>({x:500+x,y:645-spaceDistance(-70,z,game.fields)*.5});
const text=(value,x,y,size=18,color='#eee7d0')=>{ctx.fillStyle=color;ctx.font=`${size}px 'Segoe UI',sans-serif`;ctx.textAlign='center';ctx.fillText(value,x,y);};
function line(a,b,color='#45615f',width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
function ring(p,r,color,fill=null){ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();}
function draw(){
  ctx.fillStyle='#020405';ctx.fillRect(0,0,1000,740);ctx.imageSmoothingEnabled=false;
  for(let i=0;i<95;i++){ctx.fillStyle=i%3?'#61706d':'#a9b4a1';ctx.globalAlpha=.28;ctx.fillRect((i*173+71)%1000,(i*97+23)%740,1+(i%2),1+(i%2));}ctx.globalAlpha=1;
  if(game.phase==='ending'||game.phase==='complete'){
    const t=preferences.reducedMotion?5:Math.min(8,game.endingTime),factor=1-.8*Math.min(1,t/5),fields=[{start:120,end:1320,factor}];
    for(let z=0;z<=1600;z+=200){const distance=spaceDistance(0,z,fields),r=30+distance*.22;ctx.beginPath();ctx.ellipse(500,365,r,r*.28,0,0,Math.PI*2);ctx.strokeStyle='#294b4a';ctx.lineWidth=1;ctx.stroke();}
    const drift=preferences.reducedMotion?0:Math.min(140,game.endingZ*.05);
    if(!art.drawSized(ctx,shipById(game.shipId).sprite,500,475-drift,72,72)){text('▲',500,475-drift,42,'#a8d5ca');}
    text('WARP DRIVE · STABLE',500,110,28,'#b8d9c8');
    text(game.endingTime<3?'Four parts. One continuous route.':game.endingTime<6?'You carry the return path with you.':'The stars remain. Your journey can continue.',500,620,22);
    text('Arrow Space Shift',500,670,16,'#a4b5ac');return;
  }
  const lesson=REPAIR_LESSONS[game.stageIndex];
  text(`${game.stageIndex+1} / 3 · ${lesson.name}`,500,45,25);
  text(Object.entries(game.charged).map(([key,value])=>`${value?'✓':'○'} ${key}`).join('      '),500,80,17,'#b4c7bd');
  for(let z=-70;z<=950;z+=170)line(project(-400,z),project(400,z),'#17292c');
  line(project(-400,-70),project(-400,950),'#8eb9af',2);line(project(400,-70),project(400,950),'#8eb9af',2);
  if(game.fields.length){const field=game.fields[0],a=project(-400,field.start),b=project(400,950);ctx.fillStyle='#737e9c1c';ctx.fillRect(a.x,b.y,800,a.y-b.y);text('DISTANCE × 0.5',500,b.y+25,15,'#b7b7de');}
  if(game.stageIndex===1){
    text('RIGHT → LEFT · vertical reflection',500,130,16,'#a8d5ca');
    for(const side of [-1,1])for(const z of [180,490,800]){const p=project(side*400,z);line({x:p.x-side*12,y:p.y-8},{x:p.x+side*4,y:p.y+8},'#c3d0ad',3);}
    const mark=project(220,game.z);ring(mark,33,'#a8d5ca');text('ENTRY',mark.x,mark.y+58,16,'#a8d5ca');
  }
  if(game.stageIndex===2){const mark=project(120,game.z);ctx.setLineDash([5,5]);ring(mark,105*.5,'#9ebdb8');ctx.setLineDash([]);text(`ECHOES ${game.echoCount} / 1`,780,80,17,'#b9d3c6');}
  const receiver=project(lesson.x,lesson.z);ring(receiver,32,'#d3bc82');ring(receiver,25,'#d3bc82');
  text(game.stageIndex===2?'ECHO RECEIVER':'RECEIVER',receiver.x,receiver.y-46,16,'#dfc68d');
  for(const shot of game.shots){
    if(shot.paths)for(const path of shot.paths)line(project(path.from.x,path.from.y),project(path.to.x,path.to.y),'#b3cfba',2);
    const p=project(shot.x,shot.z);ring(p,5,shot.kind==='echo'?'#c9b6ed':'#aadfd2',shot.kind==='echo'?'#c9b6ed':'#aadfd2');
  }
  for(const charge of game.charges){const p=project(charge.x,charge.z);ring(p,8,'#dfc68d','#dfc68d');line({x:p.x,y:p.y-18},p,'#dfc68d',2);}
  const p=project(game.x,game.z);if(!art.drawSized(ctx,shipById(game.shipId).sprite,p.x,p.y,56,56))text('▲',p.x,p.y+10,34,'#a8d5ca');
  if(game.stageIndex===1)line({x:p.x+15,y:p.y-10},{x:p.x+40,y:p.y-24},'#bed6c0',3);
  text('SAFE DOCK · no hull loss · no campaign resource cost',500,710,16,'#a6b6b0');
}
function frame(now){
  const dt=Math.min(.05,Math.max(0,(now-lastFrame)/1000||0));lastFrame=now;
  stepRepair(game,{horizontal:(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0),fire:keys.has('Space'),capture:keys.has('KeyC'),release:keys.has('KeyE')},dt);
  if(game.phase!==lastPhase){
    if(game.phase==='ending'){activateDrive(journey,game);persist();}
    if(game.phase==='complete'){completeRepair(journey,game);persist();}
    lastPhase=game.phase;panel();
  }
  audio.process(game);hud();draw();requestAnimationFrame(frame);
}
window.arrowSpaceShiftRepair={audio:()=>audio.diagnosticState(),read:()=>{
  const snapshot=structuredClone(game);
  return {...snapshot,game:snapshot,journey:createJourney(journey),saveFailed};
},assets:()=>art.status()};
panel();hud();draw();requestAnimationFrame(frame);
