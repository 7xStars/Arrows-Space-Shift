import {OCTAGON_VERTICES,SIDES,geodesicBetween,hyperbolicDistance} from './hyperbolic.js';
import {forecastBolzaPair,pairedSideGlyph} from './hyperbolic-visuals.js';
import {ACT4_SAVE_KEY,ACT4_STAGES,actFourProgress,createActFour,startActFour,stepActFour,actFourAction,nextActFour,restoreActFour,rememberActFourStage,recordActFourClear,seedActFourBridge,finalComponentReceipt,actFourShip,actFourForecastMotion,actFourShotForecastMotion} from './hyperbolic-campaign.js';
import {loadFleetProfile,loadPreferences,savePreferences} from './storage.js';
import {FlightAudio} from './audio.js';
import {loadJourney,saveJourney,syncLegacyParts,bankFinalComponent,hasFinalComponent} from './journey.js';
import {recoverProgressTransfer} from './progress-transfer.js';
import {StructuralFeedback} from './structural-feedback.js';
import {mountAudioStatus} from './audio-interface.js';

const $=id=>document.getElementById(id),canvas=$('field'),ctx=canvas.getContext('2d');
const optionsDialog=$('options-dialog');
let optionsOpener=null;
const keys=new Set(),cx=500,cy=366,R=331,colors=['#c9b47f','#8fcac4','#d7a68b','#a7a9d7'];
const toCanvas=p=>({x:cx+p.x*R,y:cy-p.y*R});
const hostedQA=/^(localhost|127\.0\.0\.1)$/.test(location.hostname)&&new URLSearchParams(location.search).has('qa');
const progressStorageReady=hostedQA||recoverProgressTransfer();
const fleet=loadFleetProfile(),canPlay=fleet.curvatureSeed||hostedQA;
let journey=loadJourney(),journeySaved=progressStorageReady&&hasFinalComponent(journey);
if(!hostedQA)syncLegacyParts(journey,fleet);
let saved;
try{saved=actFourProgress(JSON.parse(localStorage.getItem(ACT4_SAVE_KEY)||'null'));}catch{saved=actFourProgress(null);}
if(!hostedQA&&canPlay)saved=seedActFourBridge(saved,journey.actFourBridge);
const systemReduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
const preferences=loadPreferences(undefined,systemReduced),audioBus=new FlightAudio(preferences),structuralFeedback=new StructuralFeedback();
let structuralResponse={recoilPixels:0,damage:0};
const audioStatus=mountAudioStatus(audioBus,optionsDialog);
let game=restoreActFour(saved),lastFrame=0,wasPhase='',showProjections=preferences.manifoldCues;
const recoveryMessage='Progress recovery required. The import backup could not be restored. Progress and settings will not be saved.';
if(!progressStorageReady)game.message=recoveryMessage;
function updatePreferences(){
  $('reduced-motion').checked=preferences.reducedMotion;$('pair-previews').checked=preferences.manifoldCues;
  $('sound').textContent=preferences.sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(preferences.sound));
  $('volume').value=Math.round(preferences.volume*100);$('volume-value').textContent=`${Math.round(preferences.volume*100)}%`;
  $('music').checked=preferences.music;$('juice').checked=preferences.juice;
  for(const key of ['musicVolume','effectsVolume','ambienceVolume']){
    const id=key.replace('Volume','-volume');$(id).value=Math.round(preferences[key]*100);$(id+'-value').textContent=`${Math.round(preferences[key]*100)}%`;
  }
  showProjections=preferences.manifoldCues;audioBus.setOptions(preferences);
}
function saveSettings(){updatePreferences();if(progressStorageReady)savePreferences(preferences);else game.message=recoveryMessage;}
function unlockSound(){audioBus.resumeFromGesture().then(ok=>{if(ok)audioBus.setPlaying(game.phase==='running'&&!game.paused,game);});}
const stars=Array.from({length:190},(_,i)=>{
  const rand=(j)=>((Math.sin((i+1)*j*77.418)*43758.5453)%1+1)%1;
  return {x:rand(1.31)*1000,y:rand(3.17)*740,size:.35+rand(6.77)*1.1,alpha:.12+rand(9.32)*.34};
});
function updateStageSelector(){
  const maximum=hostedQA?9:Math.min(9,saved.unlocked+1),current=game.stageIndex;
  $('stage-select').replaceChildren();
  for(let i=0;i<maximum;i++){
    const option=document.createElement('option');option.value=String(i);option.textContent=`${i+1} · ${ACT4_STAGES[i].name}`;
    $('stage-select').append(option);
  }
  $('stage-select').value=String(current);
}
function saveProgress(){
  if(!canPlay||hostedQA||!progressStorageReady)return;
  try{localStorage.setItem(ACT4_SAVE_KEY,JSON.stringify(saved));}catch{game.message+=' · Browser storage blocked: progress may not persist.';}
}
function storeClear(){
  if(!canPlay||hostedQA)return;
  saveFinalReward();
  saved=recordActFourClear(saved,game);saveProgress();
  updateStageSelector();
}
function saveFinalReward(){
  const receipt=finalComponentReceipt(game);
  if(!receipt||hostedQA||!progressStorageReady){if(!progressStorageReady)game.message=recoveryMessage;return false;}
  bankFinalComponent(journey,receipt);journeySaved=saveJourney(journey);
  if(!journeySaved)game.message='Core extracted. Browser storage failed. Select Save recovered core before leaving.';
  return journeySaved;
}
function launchStage(){
  if(!canPlay||game.phase!=='ready')return;
  saved=rememberActFourStage(saved,game);saveProgress();unlockSound();startActFour(game);
  $('overlay').hidden=true;keys.clear();canvas.focus({preventScroll:true});wasPhase=game.phase;updateHUD();
}
function installStage(index,continuation=null){
  if(!canPlay||!Number.isInteger(index)||index<0||index>8||(!hostedQA&&index>saved.unlocked))return false;
  audioBus.setPlaying(false);
  game=hostedQA?(continuation||createActFour(index)):restoreActFour(saved,index);
  saved=rememberActFourStage(saved,game);saveProgress();keys.clear();wasPhase='';$('overlay').hidden=false;
  updateHUD();updateOverlay();updateStageSelector();return true;
}
function updateOverlay(){
  $('overlay').hidden=false;$('launch').hidden=game.phase!=='ready'||!canPlay;
  $('next').hidden=game.phase!=='cleared';$('return').hidden=game.phase!=='won';
  $('save-reward').hidden=!(game.phase==='won'&&!hostedQA&&!journeySaved);
  $('dock-link').hidden=!journeySaved;
  $('return').href=journeySaved?'./repair-dock.html':'./index.html';
  $('return').textContent=journeySaved?'Return to repair dock':'Return to main campaign';
  $('modal-kicker').textContent=`Act IV · Stage ${game.stageIndex+1}/9 · ${game.stage.lesson}`;
  if(!canPlay){
    $('modal-title').textContent='Curvature Seed required';
    $('modal-detail').textContent='Complete Act III’s Curvature Gate and physically extract the Curvature Seed to unlock this campaign. Existing saves are not modified.';
    $('modal-hint').textContent='For local development, ?qa=1 opens all nine stages without awarding persistent progress.';
    $('return').hidden=false;return;
  }
  $('modal-title').textContent=game.phase==='ready'?game.stage.name:game.phase==='lost'?'Hull lost · retry the lesson':game.phase==='won'?'Hyperbolic Core extracted':game.stage.name+' · cleared';
  $('modal-detail').textContent=game.phase==='ready'?`${game.stage.brief} ${actFourShip(game).name} retains its movement and core differences. Equipment is stored; operation effects are inactive in this chart.`:game.phase==='lost'?game.message:game.phase==='won'?game.message:'The next stage is unlocked. Continue with restored hull and your captured echoes.';
  $('modal-hint').textContent=game.stage.hint;
  if(game.phase==='lost'){$('launch').hidden=false;$('launch').textContent='Retry stage';}
  else $('launch').textContent='Launch stage';
}
function updateHUD(){
  audioStatus.update();
  const s=game;
  $('chapter').textContent=`Act IV · ${s.stageIndex+1} / 9`;
  $('lesson').textContent=s.stage.lesson;
  $('stage-name').textContent=s.stage.name;
  $('brief').textContent=s.stage.brief;
  $('hull').textContent=`${s.player.hull} / 5`;
  $('wave').textContent=`${s.waveIndex} / ${s.stage.waves.length}`;
  $('echoes').textContent=`${s.echoes} / 6`;
  $('phase').textContent=s.phase==='running'&&s.time<s.foldUntil?'FOLD · risk↑':'Open';
  for(const key of ['kills','crossings','captures','releases','folds']){
    $(key).textContent=key==='folds'?s.foldUses:s[key];
  }
  $('score').textContent=s.score.toLocaleString('en-US');
  $('ship-name').textContent=actFourShip(s).name;
  $('loadout-status').textContent=`${actFourShip(s).name}: ship movement and collision core are active. ${s.inventory.length} equipment items are retained. Their seven operation effects remain inactive in this chart. Capture, release and fold remain active. Act IV stores up to six echoes.`;
  $('objective').textContent=s.stage.require?
    Object.entries(s.stage.require).map(([key,target])=>`${key}: ${s[key]||0}/${target}`).join(' · '):
    s.stage.boss?s.finalReward?.state==='exposed'?'Collect the diamond core':s.finalReward?.state==='collected'?'Reach the square extraction beacon':s.finalReward?.state==='extracted'?'Core extracted. Return to the repair dock.':`Sentinel · Phase ${s.bossPhase||1}`:`Clear ${s.stage.waves.length} wave(s).`;
  $('status').textContent=!progressStorageReady?recoveryMessage:s.paused?'Paused · press P to resume.':s.message;
  $('pause').textContent=s.paused?'Resume (P)':'Pause (P)';
}
$('launch').addEventListener('click',()=>{if(game.phase==='lost'){installStage(game.stageIndex);}launchStage();});
$('next').addEventListener('click',()=>{if(game.phase==='cleared')installStage(game.stageIndex+1,hostedQA?nextActFour(game):null);});
$('stage-select').addEventListener('change',e=>installStage(Number(e.target.value)));
$('retry').addEventListener('click',()=>installStage(game.stageIndex));
$('save-reward').addEventListener('click',()=>{saveFinalReward();updateOverlay();});
$('pause').addEventListener('click',()=>togglePause());
$('options-open').addEventListener('click',()=>{
  if(optionsDialog.open)return;
  optionsOpener=document.activeElement||$('options-open');pauseForFocusLoss();optionsDialog.showModal();
});
$('options-close').addEventListener('click',()=>optionsDialog.close());
optionsDialog.addEventListener('close',()=>{keys.clear();optionsOpener?.focus({preventScroll:true});});
$('pair-previews').addEventListener('change',e=>{preferences.manifoldCues=e.target.checked;saveSettings();});
$('reduced-motion').addEventListener('change',e=>{preferences.reducedMotion=e.target.checked;saveSettings();});
$('music').addEventListener('change',e=>{preferences.music=e.target.checked;saveSettings();if(preferences.music)unlockSound();});
$('juice').addEventListener('change',e=>{preferences.juice=e.target.checked;saveSettings();});
$('sound').addEventListener('click',()=>{preferences.sound=!preferences.sound;saveSettings();if(preferences.sound)unlockSound();});
$('volume').addEventListener('input',e=>{preferences.volume=Math.max(0,Math.min(1,Number(e.target.value)/100));saveSettings();});
for(const key of ['musicVolume','effectsVolume','ambienceVolume']){
  const id=key.replace('Volume','-volume');$(id).addEventListener('input',e=>{preferences[key]=Number(e.target.value)/100;saveSettings();});
}
function togglePause(){
  if(game.phase!=='running'||optionsDialog.open)return;game.paused=!game.paused;keys.clear();
  if(game.paused)audioBus.setPlaying(false);else {unlockSound();canvas.focus({preventScroll:true});}
  updateHUD();
}
function dispatchAction(action){
  if(action==='pause'){togglePause();return;}
  if(action==='retry'){installStage(game.stageIndex);return;}
  if(game.paused)return;
  if(canPlay)actFourAction(game,action);
}
const actions={KeyC:'capture',KeyE:'release',ShiftLeft:'fold',ShiftRight:'fold',KeyP:'pause',KeyR:'retry'};
window.addEventListener('keydown',event=>{
  if(optionsDialog.open||event.target?.closest?.('input,select,textarea,[contenteditable="true"]'))return;
  if(!event.repeat)unlockSound();
  if(event.code==='KeyP'){event.preventDefault();if(!event.repeat)togglePause();return;}
  if(event.target?.closest?.('button,a'))return;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyA','KeyD','KeyW','KeyS',...Object.keys(actions)].includes(event.code))event.preventDefault();
  if(event.repeat&&actions[event.code])return;
  if(actions[event.code])dispatchAction(actions[event.code]);
  keys.add(event.code);
});
window.addEventListener('keyup',event=>keys.delete(event.code));
function pauseForFocusLoss(){if(game.phase==='running')game.paused=true;keys.clear();audioBus.setPlaying(false);updateHUD();}
window.addEventListener('blur',pauseForFocusLoss);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseForFocusLoss();});
for(const button of document.querySelectorAll('[data-hold]')){
  const name=button.dataset.hold;
  button.addEventListener('pointerdown',event=>{event.preventDefault();unlockSound();button.setPointerCapture?.(event.pointerId);keys.add(name);canvas.focus({preventScroll:true});});
  const release=()=>keys.delete(name);
  button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
}
for(const button of document.querySelectorAll('[data-action]'))button.addEventListener('click',()=>{unlockSound();dispatchAction(button.dataset.action);});
const control=()=>({turn:((keys.has('ArrowLeft')||keys.has('KeyA'))?1:0)-((keys.has('ArrowRight')||keys.has('KeyD'))?1:0),
  drive:((keys.has('ArrowUp')||keys.has('KeyW'))?1:0)-((keys.has('ArrowDown')||keys.has('KeyS'))?1:0),fire:keys.has('Space')});
function line(a,b,color='#24373a',width=1){const x=toCanvas(a),y=toCanvas(b);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x.x,x.y);ctx.lineTo(y.x,y.y);ctx.stroke();}
function circle(pos,r,fill,stroke=null,width=1){const p=toCanvas(pos);ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.lineWidth=width;ctx.strokeStyle=stroke;ctx.stroke();}}
function drawPolygon(){
  for(const side of SIDES){
    ctx.beginPath();for(let i=0;i<=26;i++){
      const q=toCanvas(geodesicBetween(side.from,side.to,i/26));if(!i)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);
    }
    ctx.strokeStyle=colors[side.pair];ctx.lineWidth=4;ctx.stroke();
    const p=toCanvas(geodesicBetween(side.from,side.to,.5));
    ctx.font='bold 18px ui-monospace,monospace';ctx.fillStyle=colors[side.pair];ctx.textAlign='center';
    ctx.fillText(pairedSideGlyph(side.id),cx+(p.x-cx)*1.09,cy+(p.y-cy)*1.09);
  }
}
function drawWarnings(){
  for(const enemy of game.enemies){
    const p=toCanvas(enemy.position),warn=enemy.warning&&enemy.gunClock<.8;
    const radius=enemy.boss?23:13;
    ctx.beginPath();ctx.moveTo(p.x,p.y-radius);ctx.lineTo(p.x+radius,p.y);
    ctx.lineTo(p.x,p.y+radius);ctx.lineTo(p.x-radius,p.y);ctx.closePath();
    ctx.fillStyle=enemy.boss?'#782d48':'#9b5160';ctx.strokeStyle=warn?'#f2bf87':'#c28e93';ctx.lineWidth=warn?3:1.6;ctx.fill();ctx.stroke();
    if(enemy.boss){ctx.fillStyle='#e9d7c1';ctx.textAlign='center';ctx.font='bold 11px monospace';ctx.fillText(`PHASE ${game.bossPhase||1} · ${enemy.hp}/${enemy.maxHp}`,p.x,p.y-33);
      if(game.time<game.bossRecoveryUntil){ctx.strokeStyle='#8fcac4';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,38,0,Math.PI*2);ctx.stroke();ctx.fillText('RECOVERY',p.x,p.y+48);}}
    if(warn){ctx.strokeStyle='#d4a87a';ctx.setLineDash([3,6]);ctx.beginPath();ctx.arc(p.x,p.y,radius+10,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle='#dfcfb4';ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText(`${enemy.pattern.toUpperCase()} ${Math.max(0,enemy.gunClock).toFixed(1)}s`,p.x,p.y+radius+21);
    }
  }
}
function hollowProjection(preview,who='FUTURE'){
  if(!preview)return;
  const p=toCanvas(preview.destination);ctx.save();ctx.globalAlpha=.67;ctx.strokeStyle='#9ed8db';ctx.lineWidth=2;ctx.setLineDash([4,5]);ctx.beginPath();ctx.arc(p.x,p.y,12,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#b8d9d4';ctx.textAlign='center';ctx.font='10px monospace';ctx.fillText(`${who} ${preview.sourceGlyph}→${preview.targetGlyph}`,p.x,p.y-19);ctx.restore();
}
function drawShip(){
  const p=toCanvas(game.player.position),angle=Math.atan2(game.player.heading.y,game.player.heading.x);
  const recoil=structuralResponse.recoilPixels;
  ctx.save();ctx.translate(p.x-Math.cos(angle)*recoil,p.y+Math.sin(angle)*recoil);ctx.rotate(-angle+Math.PI/2);
  const width=game.shipId===8?7:game.shipId===1?15:game.shipId===3?13:11;
  ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(width,12);ctx.lineTo(0,game.shipId===3?16:7);ctx.lineTo(-width,12);ctx.closePath();
  ctx.fillStyle='#e5dcc4';ctx.fill();ctx.strokeStyle='#4d968e';ctx.lineWidth=2;ctx.stroke();ctx.restore();
  circle(game.player.position,23,null,game.player.invuln>0?'#d9a07b':'#55706b',1.2);
  if(structuralResponse.damage>0)circle(game.player.position,25,null,'#d9a07b',1+structuralResponse.damage*2);
  if(game.time<game.foldUntil)circle(game.player.position,28,null,'#b5c78c',1);
  if(game.events.some(e=>e.type==='player-crossing'&&game.time-e.t<.45))circle(game.player.position,31,null,'#acd1d3',2);
}
function drawReward(){
  const reward=game.finalReward;if(!reward||reward.state==='extracted')return;
  const collected=reward.state==='collected',p=toCanvas(collected?reward.extractionPosition:reward.position);
  ctx.strokeStyle=collected?'#8fcac4':'#f1d79c';ctx.fillStyle=collected?'#173c3b':'#554323';ctx.lineWidth=3;
  ctx.beginPath();
  if(collected)ctx.rect(p.x-18,p.y-18,36,36);
  else {ctx.moveTo(p.x,p.y-18);ctx.lineTo(p.x+18,p.y);ctx.lineTo(p.x,p.y+18);ctx.lineTo(p.x-18,p.y);ctx.closePath();}
  ctx.fill();ctx.stroke();ctx.fillStyle='#eee7ce';ctx.textAlign='center';ctx.font='bold 13px monospace';
  ctx.fillText(collected?'EXTRACT':'CORE',p.x,p.y-28);
  const ship=toCanvas(game.player.position);ctx.setLineDash([3,7]);ctx.beginPath();ctx.moveTo(ship.x,ship.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.setLineDash([]);
}
function draw(){
  ctx.fillStyle='#020406';ctx.fillRect(0,0,1000,740);
  const reduced=$('reduced-motion').checked;
  for(const star of stars){ctx.globalAlpha=star.alpha;ctx.fillStyle='#cad5d3';ctx.fillRect(star.x,star.y,star.size,star.size);}
  ctx.globalAlpha=1;
  ctx.strokeStyle='#284145';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.stroke();
  for(const n of [.23,.46,.69]){ctx.strokeStyle='#132328';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,n*R,0,Math.PI*2);ctx.stroke();}
  if(!reduced&&preferences.juice){
    ctx.strokeStyle='rgba(130,193,191,.13)';ctx.lineWidth=.65;
    const count=game.stageIndex>=6?12:7;
    for(let i=0;i<count;i++){const a=(i/count)*Math.PI*2+game.time*.04;line({x:0,y:0},{x:Math.cos(a)*.78,y:Math.sin(a)*.78},'#193035',.6);}
  }
  drawPolygon();drawWarnings();
  for(const shot of game.shots){
    circle(shot.position,shot.team==='enemy'?5.5:4.5,shot.team==='enemy'?'#f4a37c':'#80d6d1',shot.team==='enemy'?'#ffd9b4':'#d3fff4',1);
    if(shot.arrival>0)circle(shot.position,reduced?15:11+(1-shot.arrival/.4)*7,null,'#a9d4cf',2);
  }
  if(showProjections){
    let n=0;
    for(const shot of game.shots.filter(x=>x.team==='enemy')){
      if(n>=3)break;
      const motion=actFourShotForecastMotion(game,shot);
      const prediction=motion?forecastBolzaPair(motion.position,motion.heading,{lookAhead:motion.distance,stepLimit:.02}):null;
      if(prediction){hollowProjection(prediction);n++;}
    }
    const motion=actFourForecastMotion(game,control());
    const own=motion?forecastBolzaPair(motion.position,motion.heading,{lookAhead:motion.distance,stepLimit:.02}):null;
    if(own)hollowProjection(own,'SHIP');
  }
  drawReward();drawShip();
  ctx.textAlign='left';ctx.fillStyle='#b6c2bd';ctx.font='13px ui-monospace,monospace';ctx.fillText('POINCARÉ DISK / LIVE QUOTIENT · genus 2 · no front/back immunity',18,29);
  ctx.font='12px ui-monospace,monospace';ctx.fillStyle='#839a97';ctx.fillText('A–D ↔ A′–D′ • side crossings transport orientation and velocity',18,49);
  ctx.fillStyle='#d9c4a1';ctx.font='14px monospace';ctx.fillText(`Stage ${game.stageIndex+1}: ${game.stage.name}`,18,717);
  if(game.paused){ctx.fillStyle='#070b0caa';ctx.fillRect(0,0,1000,740);ctx.fillStyle='#e8e2d1';ctx.textAlign='center';ctx.font='bold 34px system-ui';ctx.fillText('PAUSED',500,366);}
}
function frame(now){
  if(!lastFrame)lastFrame=now;
  const dt=Math.min(.045,Math.max(0,(now-lastFrame)/1000));lastFrame=now;
  if(canPlay&&game.phase==='running'&&!game.paused){
    stepActFour(game,control(),dt);
    if(game.phase!==wasPhase&&['cleared','won','lost'].includes(game.phase)){
      if(game.phase!=='lost')storeClear();keys.clear();updateOverlay();
    }
    wasPhase=game.phase;
  }
  structuralResponse=structuralFeedback.update(game,{shipId:game.shipId,reducedMotion:preferences.reducedMotion,decorative:preferences.juice});
  draw();updateHUD();audioBus.process(game);window.requestAnimationFrame(frame);
}
window.arrowSpaceShiftActFour=Object.freeze({audio:()=>audioBus.diagnosticState(),read:()=>structuredClone({stageIndex:game.stageIndex,phase:game.phase,paused:game.paused,time:game.time,
  shipId:game.shipId,score:game.score,echoes:game.echoes,player:game.player,enemies:game.enemies,shots:game.shots,
  finalReward:game.finalReward,bossPhase:game.bossPhase,events:game.events})});
updatePreferences();updateStageSelector();updateHUD();updateOverlay();window.requestAnimationFrame(frame);
