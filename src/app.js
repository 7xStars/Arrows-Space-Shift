import { addFold, removeFold, metricAt, spaceDistance, advanceThroughSpace } from './space.js';
import {OPERATIONS,EFFECT_AXES,roster,commonCounters,auditTournament,activeSourceSide,seedLabel,loadout,equipSeed,upgradeModes,collectDrop,makeDrop,WARP_RADIUS} from './upgrades.js';
import { createFlight, tick, readFlight, recordEvent, targetOpen, ENCOUNTERS, STEP, ROUTE_LENGTH } from './simulation.js';
import {combatViewLayout,usesVisibleCombat,inCombatView,presentEnemy,ENTRY_TIME,screenFacing} from './combat-view.js';
import {CHAPTERS,isCampaign,isBoss,isKleinRoute,isTutorial,isScrollingLevel,isKleinSurfaceRoute,hybridProjectiveActive,SCROLL_SPEED,chapter,continueCampaign,retryCampaign,enterChapter,arenaY,arenaZ,bossContinuationIndex,continueAfterBoss} from './campaign.js';
import {mountInterface,mountSoundToggle,campaignNotice,isCampaignEntryMenu} from './interface.js';
import {PixelArt} from './pixel-art.js';
import {FlightRenderer} from './renderer.js';
import {FlightAudio} from './audio.js';
import {loadPreferences,savePreferences,readCheckpoint,writeCheckpoint,clearCheckpoint,checkpointFromFlight,bestScore,updateBestScore,loadFleetProfile,saveFleetProfile} from './storage.js';
import {KLEIN_BOUNDS} from './klein.js';
import {STARTER_SHIPS,SHIPS,createFleetProfile,selectShip,activeShip,markChapterReached,recordStageResult,practiceChapters,unlockKleinFleet,unlockProjectiveModule,fabricationStatus,craftAftwing} from './fleet.js';
import {PATTERN_DEFINITIONS} from './boss.js';
import {EVOLUTION_BY_ID,chooseEvolution,captureEchoes,releaseEchoes} from './ecology.js';
import {BUILD,isActAvailable,isJamCampaignComplete,isJamCompletionEntry} from './build.js';
import {createStageClearClock,autoAdvanceEligible} from './stage-flow.js';
import {playerJoinForecast} from './geometry-cues.js';
import {revealFoldWake,foldRoutePace} from './fold-wake.js';
import {loadJourney,saveJourney,syncLegacyParts,setActFourBridge,recordBankedPart} from './journey.js';
import {launchAudioPreferences} from './audio-interface.js';
import {exportProgress,importProgress,recoverProgressTransfer} from './progress-transfer.js';

const $ = id => document.getElementById(id);
const canvas = $('space'), ctx = canvas.getContext('2d');
const testing = /^(127\.0\.0\.1|localhost)$/.test(location.hostname)&&new URLSearchParams(location.search).has('qa');
const progressStorageReady=testing||recoverProgressTransfer();
const preferences=launchAudioPreferences(loadPreferences(undefined,matchMedia('(prefers-reduced-motion: reduce)').matches));
let campaignJourney=loadJourney();
const audioBus=new FlightAudio(preferences);
const keys = new Set();
let suppressSpaceUntilRelease=false;
let fleetProfile=testing?createFleetProfile():loadFleetProfile();
let fleetProfileSignature=JSON.stringify(fleetProfile),fleetProfileSaved=progressStorageReady,hangarSignature='';
let launchShipConfirmed=false;
let newCampaignChosen=false;
let flight = (!testing&&readCheckpoint())||createFlight('campaign',{fleetProfile});
flight.fleetProfile ||= createFleetProfile(fleetProfile);
if(!progressStorageReady)flight.lastEvent='Saved progress needs recovery. Browser writes are blocked. Keep the existing records before continuing.';
const attempts=[];
let attemptRecorded=false;
let attemptPrediction='';
let width = 900, height = 740, lastFrame = 0, accumulator = 0;
let qaPlayback=false;
let oldPhase = '', oldStack = null, oldEvent = '';
let progressReceipt='',practiceSignature='',recordsSignature='';
let highScore=bestScore(),checkpointAvailable=Boolean(flight.restoredCheckpoint);
let flash = 0, hudClock = 0;
let inventorySignature='';
const stageClearClock=createStageClearClock();
const shell=mountInterface({pause,phase:()=>flight.phase,development:false,patternDefinitions:PATTERN_DEFINITIONS,audio:audioBus});
function requestTitleMusic(gesture=false){
  if(!isCampaignEntryMenu(flight)||document.hidden||!preferences.sound||!preferences.music||document.querySelector('dialog[open]'))return;
  if(!audioBus.titleRequested||gesture)void audioBus.startTitle();
}
const soundToggle=mountSoundToggle({container:document.querySelector('.viewport'),onToggle:setSoundEnabled});
function updateSoundToggle(){
  const enabled=preferences.sound,recorded=audioBus.recorded?.read();
  const state=!preferences.sound?'muted':!audioBus.context||audioBus.context.state!=='running'?'blocked':recorded?.error?'unavailable':
    recorded?.state==='loading'?'loading':recorded?.state==='playing'?'playing':flight.phase==='paused'?'paused':'ready';
  const description=state==='muted'?'Sound is off.':state==='blocked'?'Sound is enabled. Begin play to start audio.':state==='loading'?'Sound is on. Music is loading.':
    !preferences.music?'Effects are on. Music is off. Enable music in Options.':
    preferences.musicVolume===0?'Effects are on. Music volume is zero.':
    state==='paused'?'Sound is on. Play is paused.':state==='unavailable'?'Music could not load. Action sounds remain on.':'Sound is on.';
  soundToggle.update({enabled:Boolean(enabled),state,description});
}
async function setSoundEnabled(enabled){
  preferences.sound=enabled;
  if(!enabled)audioBus.stopTitle();
  updateOptions();updateSoundToggle();
  if(enabled){
    if(isCampaignEntryMenu(flight)&&preferences.music)await audioBus.startTitle();
    else if(await audioBus.unlock())audioBus.process(flight);
  }
  updateSoundToggle();shell.audioStatus?.update();
}
$('primary').addEventListener('click',()=>audioBus.stopTitle(),{capture:true});
for(const eventName of ['pointerdown','keydown','click'])document.addEventListener(eventName,event=>{
  if(!event.isTrusted||event.target.closest?.('#sound-toggle')||event.ctrlKey||event.altKey||event.metaKey||event.repeat||eventName==='keydown'&&['Tab','Escape'].includes(event.key))return;
  requestTitleMusic(true);
  if(preferences.sound&&audioBus.context?.state!=='running')void audioBus.unlock().then(ready=>{
    if(ready){audioBus.process(flight);updateSoundToggle();}
  });
},{capture:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)requestTitleMusic(true);});
const pixelArt=new PixelArt();
const renderer=new FlightRenderer(ctx,pixelArt,preferences);
requestTitleMusic();
pixelArt.load().then(()=>{updateUI(true);render();requestTitleMusic();});
function viewState(){return {width,height,topInset:document.querySelector('.viewport-dock').getBoundingClientRect().height+16,bottomInset:106};}
function saveSection(){
  if(testing||flight.practice||!isCampaign(flight))return;
  if(!progressStorageReady){$('checkpoint-status').textContent='Saved progress needs recovery. This session will not overwrite it.';return;}
  checkpointAvailable=writeCheckpoint(flight);
  $('checkpoint-status').textContent=checkpointAvailable?'Section checkpoint saved in this browser. Reloading restarts the current section with its saved equipment, score, and route layout.':'This browser cannot save the checkpoint. Section retry still works while the page stays open.';
}
function syncFleetProgress(){
  if(flight.practice||!isCampaign(flight)||!flight.fleetProfile)return;
  const next=createFleetProfile(flight.fleetProfile),signature=JSON.stringify(next);
  if(signature===fleetProfileSignature)return;
  fleetProfile=next;fleetProfileSignature=signature;
  if(!testing)fleetProfileSaved=progressStorageReady&&saveFleetProfile(fleetProfile);
}
function finishFleetCheckpoint(){
  if(flight.practice||!isCampaign(flight)||flight.phase!=='won')return;
  const destination=bossContinuationIndex(flight);
  const name=chapter(flight).hybrid?'Projective Module':chapter(flight).projectiveBoss?'Curvature Seed':'Klein Relay';
  if(!testing){
    const journey=loadJourney();syncLegacyParts(journey,fleetProfile);
    const extraction=flight.events.findLast(event=>event.type==='boss-extracted'&&event.chapter===flight.campaign.index);
    if(extraction)recordBankedPart(journey,{id:extraction.part,source:'campaign-extraction',chapter:flight.campaign.index,
      seed:flight.runSeed,shipId:flight.shipId,score:flight.score,extracted:true});
    if(fleetProfile.curvatureSeed&&chapter(flight).projectiveBoss&&(isActAvailable(4)||!journey.actFourBridge))setActFourBridge(journey,actFourBridge());
    campaignJourney=journey;
    if(!progressStorageReady||!saveJourney(journey)){$('checkpoint-status').textContent='The browser could not save the campaign transfer. Keep this page open and export progress before leaving.';return;}
  }
  if(fleetProfileSaved){
    if(destination!==null){
      // Checkpoint the *next Act*, using the already banked part and this run's
      // score, seed, equipment and current ship. Never erase the bridge on win.
      checkpointAvailable=testing?true:writeCheckpoint(flight);
      $('checkpoint-status').textContent=checkpointAvailable?
        `${name} banked. The next Act is ready; reloading resumes at Level ${CHAPTERS[destination].number}, not Level 0.`:
        `${name} banked. Your part is saved, but the browser could not save the next-Act checkpoint.`;
    }else{
      // Act IV uses a separate page. Keep the banked Curvature Seed.
      if(!testing)clearCheckpoint();checkpointAvailable=false;
      $('checkpoint-status').textContent=isActAvailable(4)?`${name} banked. Act III is complete. The separate hyperbolic Act IV campaign is unlocked.`:
        `${name} banked. Acts I–III are complete. Your recovered parts and records are saved.`;
    }
  }else{
    $('checkpoint-status').textContent=`${name} secured for this session. This browser cannot save the progression. `+
      (checkpointAvailable?'Your previous section checkpoint is kept for reload.':'No previous checkpoint is available.');
  }
}
function actFourBridge(){
  return {shipId:flight.shipId??fleetProfile.selectedShip,seed:flight.runSeed,score:flight.score,
    echoes:flight.projective?.echoes||0,inventory:structuredClone(flight.inventory||[]),
    equipped:flight.equipped.map(seed=>seed?.key||null)};
}
function launchActFour(){
  if(!isActAvailable(4)||!fleetProfile.curvatureSeed||flight.practice)return;
  if(!testing){
    const journey=loadJourney();syncLegacyParts(journey,fleetProfile);
    if(flight.phase==='won'&&chapter(flight).projectiveBoss)setActFourBridge(journey,actFourBridge());
    else if(!journey.actFourBridge)setActFourBridge(journey,{shipId:fleetProfile.selectedShip,seed:flight.runSeed,score:0,echoes:0,inventory:[],equipped:[null,null]});
    campaignJourney=journey;
    if(!progressStorageReady||!saveJourney(journey)){$('checkpoint-status').textContent='The browser could not save the Act IV transfer. Export progress before leaving.';return;}
  }
  window.location.assign('hyperbolic-act.html');
}
function persistFleetProfile(nextProfile=fleetProfile){
  fleetProfile=createFleetProfile(nextProfile);fleetProfileSignature=JSON.stringify(fleetProfile);
  if(!testing)fleetProfileSaved=progressStorageReady&&saveFleetProfile(fleetProfile);
  if(isCampaign(flight)&&!flight.practice)flight.fleetProfile=createFleetProfile(fleetProfile);
  recordsSignature='';practiceSignature='';
  return fleetProfileSaved;
}
function noteChapterReached(s=flight){
  if(!isCampaign(s)||s.practice||s.campaign.index<0)return;
  if(markChapterReached(s.fleetProfile,s.campaign.index))persistFleetProfile(s.fleetProfile);
}
function recordCampaignProgress(s=flight){
  if(!isCampaign(s)||s.practice||!['cleared','lost','won'].includes(s.phase))return false;
  const receipt=`${s.runSeed}:${s.campaign.index}:${s.phase}:${Math.round(s.time*1000)}`;
  if(progressReceipt===receipt)return false;progressReceipt=receipt;
  recordStageResult(s.fleetProfile,{chapter:s.campaign.index,name:chapter(s).name,result:s.phase,score:s.score,
    grazes:s.campaign.metrics?.grazes||0,shipId:s.shipId,grade:s.campaign.grade,time:s.time-s.campaign.startedAt,
    cause:s.deathRecap?`${s.deathRecap.title}: ${s.deathRecap.detail}`:'',receipt,runSeed:s.runSeed});
  persistFleetProfile(s.fleetProfile);return true;
}
function chooseForge(id){
  if(!chooseEvolution(flight,id))return;
  clearInput();oldPhase='';accumulator=0;updateUI(true);canvas.focus({preventScroll:true});
}
function needsShipChoice(){
  if(!isCampaign(flight)||flight.practice||!fleetProfile.fleetUnlocked)return false;
  return flight.phase==='won'&&flight.campaign.index===8 ||
    flight.phase==='paused'&&flight.restoredTransitionFrom===8;
}
function describeShipForRelease(ship){
  return ship.id===3&&!isActAvailable(4)?{...ship,role:'Small collision core',strength:'Its collision core is smaller than Arrow\'s core.',handles:'Trades lateral speed for a smaller collision core.'}:ship;
}
function updateHangar(){
  const unlocked=Boolean(fleetProfile.fleetUnlocked);
  const preflight=needsShipChoice();
  shell.placeHangar(preflight);
  $('fleet-hangar').hidden=!unlocked;
  if(!unlocked)return;
  const selected=preflight&&!launchShipConfirmed?null:SHIPS.find(ship=>ship.id===fleetProfile.selectedShip)||STARTER_SHIPS[0];
  $('fleet-status').textContent=fleetProfile.curvatureSeed?(isActAvailable(4)?'Curvature Seed secured. The next research goal is the Hyperbolic Drive. The foundry can prepare a fourth movement hull.':'Curvature Seed secured. Acts I–III are complete. Your ships and recovered parts remain available for replay.'):fleetProfile.projectiveModule?'Klein Relay and Projective Module recovered. Projective Ecology and the Aftwing blueprint are available.':'Klein Relay recovered. The Warp Drive still needs other repair parts. Three movement hulls are ready for your next flight.';
  const signature=JSON.stringify([fleetProfile.selectedShip,fleetProfile.unlockedShips,preflight,launchShipConfirmed,fleetProfile.fabricationSpent]);
  if(signature!==hangarSignature){
    hangarSignature=signature;
    $('fleet-ships').replaceChildren(...SHIPS.filter(ship=>fleetProfile.unlockedShips.includes(ship.id)).map(ship=>{
      const description=describeShipForRelease(ship);
      const button=document.createElement('button'),preview=document.createElement('img'),name=document.createElement('strong'),role=document.createElement('span'),strength=document.createElement('small'),weakness=document.createElement('small'),coverage=document.createElement('small');
      button.type='button';button.className='fleet-ship-card';button.dataset.ship=String(ship.id);button.setAttribute('aria-pressed',String(ship.id===selected?.id));
      preview.className='fleet-ship-preview';preview.src=new URL(`../assets/crossing/${ship.sprite}.png`,import.meta.url).href;preview.alt='';preview.width=96;preview.height=96;preview.draggable=false;
      name.textContent=ship.name;role.textContent=description.role||description.description||'Movement hull';
      strength.textContent=description.strength?`Excels: ${description.strength}`:'';weakness.textContent=ship.weakness?`Watch for: ${ship.weakness}`:'';coverage.textContent=description.handles||'';coverage.className='fleet-coverage';
      button.append(preview,name,role);if(strength.textContent)button.append(strength);if(weakness.textContent)button.append(weakness);if(coverage.textContent)button.append(coverage);return button;
    }));
  }
  $('fleet-note').textContent=preflight?
    `${selected?`${selected.name} selected. Launch when you are ready.`:'Select a ship, then use the launch button.'} All ships use the same forward gun and Paley-7 equipment.`:
    `Next flight preference: ${selected.name}. Your active ship does not change mid-section. Every hull uses the same forward gun and Paley-7 equipment.`;
  $('fleet-save-note').textContent=fleetProfileSaved?'Drive parts, crafting, and ship choice are kept between campaigns.':'Browser storage is unavailable. Your parts and ship choice remain available while this page stays open.';
  const foundry=fabricationStatus(fleetProfile),button=$('craft-aftwing');
  $('fleet-foundry').hidden=false;
  $('fabrication-summary').textContent=`Salvage ${foundry.available}/${foundry.earned} from first-cleared Act II/III lessons · ${foundry.blueprint?'Aftwing blueprint recovered':'Aftwing blueprint awaits Projective Module'} · ${foundry.crafted?'Hull constructed':'Cost 5'}.`;
  button.disabled=!foundry.blueprint||foundry.crafted||foundry.available<foundry.cost;
  button.textContent=foundry.crafted?'Aftwing constructed':`Construct Aftwing · ${foundry.cost} salvage`;
}
function updatePracticeMenu(){
  const chapters=practiceChapters(fleetProfile),signature=JSON.stringify([chapters,fleetProfile.selectedShip,flight.practice,flight.campaign?.index]);
  $('open-practice').disabled=!chapters.length;
  if(signature===practiceSignature)return;practiceSignature=signature;$('practice-stages').replaceChildren();
  if(!chapters.length){$('practice-status').textContent='Recover the Klein Relay to unlock Act II practice.';return;}
  $('practice-status').textContent=`Practice uses ${(SHIPS.find(ship=>ship.id===fleetProfile.selectedShip)||STARTER_SHIPS[0]).name}. No parts or records are awarded.`;
  for(const index of chapters){
    const c=CHAPTERS[index],button=document.createElement('button');button.type='button';button.dataset.practiceChapter=String(index);
    const name=document.createElement('strong'),lesson=document.createElement('span');name.textContent=`Act ${c.act||2}-${c.actStage} · ${c.name}`;lesson.textContent=c.goal;
    button.append(name,lesson);$('practice-stages').append(button);
  }
}
function updateProgressRecords(){
  const signature=JSON.stringify([fleetProfile.stageRecords,fleetProfile.runHistory]);if(signature===recordsSignature)return;recordsSignature=signature;
  const records=$('stage-records');records.replaceChildren();
  const entries=Object.entries(fleetProfile.stageRecords||{}).map(([index,record])=>[Number(index),record])
    .filter(([index])=>[2,3].includes(CHAPTERS[index]?.act)).sort((a,b)=>a[0]-b[0]);
  if(!entries.length){const p=document.createElement('p');p.className='small';p.textContent='Complete an Act II or III stage to create a record.';records.append(p);}
  for(const [index,record] of entries){const c=CHAPTERS[index];
    const row=document.createElement('article'),title=document.createElement('strong'),details=document.createElement('span');title.textContent=c.name;
    details.textContent=`Best ${record.bestGrade} · ${record.bestGradeScore}/100 · Score ${record.bestScore.toLocaleString('en-US')}${record.bestClearTime?` · Fastest ${record.bestClearTime.toFixed(2)}s`:''} · ${record.completions} clear${record.completions===1?'':'s'}`;row.append(title,details);records.append(row);}
  const history=$('run-history');history.replaceChildren();
  for(const entry of (fleetProfile.runHistory||[]).slice(0,8)){const li=document.createElement('li'),ship=SHIPS.find(s=>s.id===entry.shipId)?.name||'Arrow';
    li.textContent=`${entry.name} · ${entry.result} · ${ship} · ${entry.grade} · ${entry.score.toLocaleString('en-US')}${entry.cause?` · ${entry.cause}`:''}`;history.append(li);}
  if(!history.children.length){const li=document.createElement('li');li.textContent='No recorded attempts yet.';history.append(li);}
}
function startPracticeChapter(index){
  if(!practiceChapters(fleetProfile).includes(index))return;
  retainExplanation();clearInput();launchShipConfirmed=false;
  flight=createFlight('campaign',{bonusEnabled:$('bonus-enabled').checked,fleetProfile,shipId:fleetProfile.selectedShip});enterChapter(flight,index);
  flight.practice=true;flight.phase='running';flight.view=viewState();attemptRecorded=false;progressReceipt='';oldPhase='';oldStack=null;oldEvent='';accumulator=0;
  shell.dialogs.practice.close();unlockSound();updateUI(true);canvas.focus({preventScroll:true});
}
function updateOptions(){
  $('sound').textContent=preferences.sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(preferences.sound));
  $('volume').value=Math.round(preferences.volume*100);$('volume-value').textContent=`${Math.round(preferences.volume*100)}%`;
  for(const [id,key] of [['music-volume','musicVolume'],['effects-volume','effectsVolume'],['ambience-volume','ambienceVolume']]){
    $(id).value=Math.round(preferences[key]*100);$(`${id}-value`).textContent=`${Math.round(preferences[key]*100)}%`;
  }
  $('music').checked=preferences.music;$('juice').checked=preferences.juice;$('reduced-motion').checked=preferences.reducedMotion;$('collision-core').checked=preferences.showCore;$('pattern-labels').checked=preferences.patternLabels;$('manifold-cues').checked=preferences.manifoldCues;
  $('best-score').textContent=`Best score in this browser: ${highScore.toLocaleString('en-US')}`;
  audioBus.setOptions(preferences);renderer.setOptions(preferences);if(progressStorageReady)savePreferences(preferences);
  updateSoundToggle();
}
function unlockSound(){audioBus.unlock().then(ok=>{if(ok)audioBus.setPlaying(flight.phase==='running',flight);});}
const effectSummary=['Moves an incoming shot across your ship.','Deflects an incoming shot outward.','Bends an incoming shot outward.','Stores a hit for 0.8 seconds; damage still lands.','Holds an incoming shot for 0.65 seconds.','Slows an incoming shot to half speed.','Slows a shot, doubles its damage; fires sooner.'];

function notify(message) { flight.lastEvent = message; updateUI(true); }
function fold() {
  if (flight.phase !== 'running') return;
  if(isTutorial(flight)&&!['fold','unfold','engage'].includes(flight.campaign.lesson)){notify('First move and shoot. Folding is the next lesson.');return;}
  if (addFold(flight)) { recordEvent(flight,'fold',{fields:flight.fields.length,countdown:flight.countdown});const wake=revealFoldWake(flight);flash = 0.32; notify(isTutorial(flight)?'Keep firing. Right Shift unfolds.':wake?'Fold wake: new silhouettes approaching from compressed space.':'Space folded. Reach the exit faster.'); }
  else notify(`${flight.maxFolds} field${flight.maxFolds===1?' is':'s are'} active. Unfold before you add another.`);
}
function unfold() {
  if (flight.phase !== 'running') return;
  if (removeFold(flight)) { recordEvent(flight,'unfold',{fields:flight.fields.length,countdown:flight.countdown});flash = 0.22; notify(isTutorial(flight)?flight.campaign.lesson==='engage'?'Space unfolded. Destroy the training enemy with Space.':'Keep unfolding to restore open space.':'Latest fold removed. Both sides’ shots slow there.'); }
  else notify('Space is already open.');
}
function clearInput() { suppressSpaceUntilRelease ||= keys.has('Space');keys.clear(); }
function retainExplanation(){if(attemptRecorded && attempts.length)attempts.at(-1).explanation=$('explanation').value;}
function start(mode = flight.mode, encounterIndex=0, continueAt=null) {
  retainExplanation();attemptPrediction=$('prediction').value;$('explanation').value='';
  clearInput(); launchShipConfirmed=false;flight = createFlight(mode,{bonusEnabled:$('bonus-enabled').checked,encounterIndex,fleetProfile,continueAt}); flight.phase = 'running';
  flight.view=viewState();
  attemptRecorded=false;progressReceipt='';
  $('mode').value=mode;
  flight.lastEvent = flight.encounter ? flight.encounter.goal : upgradeModes.includes(mode)?'Collect a seed. Check its accepted side before the shot arrives.':mode === 'space' ? 'Space-only test. Compare the grid before and after a fold.' : 'Reference route started. Fly through the openings.';
  if(isCampaign(flight))flight.lastEvent=chapter(flight).goal;
  noteChapterReached(flight);
  recordEvent(flight,'start',{mode,encounterIndex:flight.encounterIndex,bonusEnabled:flight.bonusEnabled});
  accumulator = 0; oldPhase = ''; oldStack = null; saveSection();unlockSound();updateUI(true); canvas.focus({preventScroll:true});
}
function pause(reason = 'Flight paused.') {
  if (flight.phase !== 'running') return;
  flight.phase = 'paused'; clearInput(); audioBus.setPlaying(false);notify(reason);
}
function resume() {
  const transition=flight.restoredTransitionFrom;
  if(transition!==null&&transition!==undefined&&fleetProfile.unlockedShips.includes(fleetProfile.selectedShip))
    flight.shipId=fleetProfile.selectedShip;
  flight.phase='running';flight.restoredCheckpoint=false;flight.restoredTransitionFrom=null;
  clearInput();accumulator=0;
  if(transition!==null&&transition!==undefined){saveSection();noteChapterReached(flight);}
  unlockSound();notify(transition===8?'Klein Relay active. Welcome to Act II.':
    transition===17?'Projective Module active. Welcome to Act III.':'Flight resumed.');
  canvas.focus({preventScroll:true});
}
function restart() {
  retainExplanation();
  if($('mode').value==='campaign'&&isCampaign(flight)&&flight.phase!=='ready'){
    clearInput();retryCampaign(flight);attemptRecorded=false;progressReceipt='';oldPhase='';oldStack=null;accumulator=0;saveSection();unlockSound();updateUI(true);canvas.focus({preventScroll:true});return;
  }
  clearInput(); flight = createFlight($('mode').value,{bonusEnabled:$('bonus-enabled').checked,fleetProfile}); accumulator = 0; oldPhase = ''; oldStack = null;attemptRecorded=false;
  flight.view=viewState();
  updateUI(true);
}

function continueUnlockedAct(index){
  if(!isCampaign(flight)||flight.phase!=='ready'||
     !(index===9&&fleetProfile.fleetUnlocked||index===18&&fleetProfile.projectiveModule))return;
  $('mode').value='campaign';
  start('campaign',0,index);
}
$('continue-act2').addEventListener('click',()=>continueUnlockedAct(9));
$('continue-act3').addEventListener('click',()=>continueUnlockedAct(18));
$('continue-act4').addEventListener('click',launchActFour);
// Saved checkpoints are never silently thrown away. Starting over from a
// restored checkpoint uses the same explicit confirmation as New run.
$('start-over').addEventListener('click',()=>$('new-run').click());
$('evolution-choices').addEventListener('click',event=>{const button=event.target.closest('button[data-evolution]');if(button)chooseForge(button.dataset.evolution);});
$('capture-echo').addEventListener('click',()=>{if(flight.phase==='running'){captureEchoes(flight);updateUI(true);canvas.focus({preventScroll:true});}});
$('release-echo').addEventListener('click',()=>{if(flight.phase==='running'){releaseEchoes(flight);updateUI(true);canvas.focus({preventScroll:true});}});
$('primary').addEventListener('click', () => {
  if(needsShipChoice()&&!launchShipConfirmed){$('fleet-ships').querySelector('button[data-ship]')?.focus({preventScroll:true});return;}
  if(flight.phase==='paused'){resume();return;}
  if(isJamCompletionEntry(flight,fleetProfile)&&!newCampaignChosen){start('campaign',0,18);return;}
  if(flight.practice&&['cleared','lost','won'].includes(flight.phase)){startPracticeChapter(flight.campaign.index);return;}
  if(isCampaign(flight)&&flight.phase==='cleared'){if(flight.campaign.index>=BUILD.maxChapterIndex)return;advanceChapter();return;}
  if(isCampaign(flight)&&flight.phase==='lost'){restart();return;}
  if(isCampaign(flight)&&flight.phase==='won'){
    if(isJamCampaignComplete(flight,fleetProfile)){start('campaign',0,18);return;}
    if(chapter(flight).projectiveBoss&&!flight.practice&&fleetProfile.curvatureSeed&&isActAvailable(4)){launchActFour();return;}
    // Boss victory never falls through to start('campaign'), which would
    // silently restart the entire game at Level 0.
    const destination=bossContinuationIndex(flight);
    if(destination===null)return; // End of currently implemented campaign.
    clearInput();flight.fleetProfile=createFleetProfile(fleetProfile);
    const shipId=fleetProfile.unlockedShips.includes(fleetProfile.selectedShip)?fleetProfile.selectedShip:flight.shipId;
    if(!continueAfterBoss(flight,shipId))return;
    launchShipConfirmed=false;attemptRecorded=false;progressReceipt='';
    oldPhase='';oldStack=null;accumulator=0;noteChapterReached(flight);
    saveSection();unlockSound();updateUI(true);canvas.focus({preventScroll:true});return;
  }
  if(isCampaign(flight)&&flight.phase!=='ready')return;
  const index=flight.encounter ? flight.phase==='won' ? (flight.encounterIndex+1)%ENCOUNTERS.length : flight.encounterIndex : 0;
  start(flight.mode,index);
});
function advanceChapter(){stageClearClock.reset();clearInput();if(fleetProfile.unlockedShips.includes(fleetProfile.selectedShip))flight.shipId=fleetProfile.selectedShip;if(continueCampaign(flight)){attemptRecorded=false;progressReceipt='';oldPhase='';oldStack=null;accumulator=0;noteChapterReached(flight);saveSection();unlockSound();updateUI(true);canvas.focus({preventScroll:true});}}
$('new-run').addEventListener('click',()=>shell.confirmReset(()=>{
  newCampaignChosen=true;
  retainExplanation();clearInput();if(progressStorageReady)clearCheckpoint();checkpointAvailable=false;flight=createFlight('campaign',{bonusEnabled:$('bonus-enabled').checked,fleetProfile,replayActOne:true});flight.view=viewState();
  $('checkpoint-status').textContent='No active checkpoint. Begin a flight to save your first section. Recovered parts, unlocked ships, your best score, and settings are kept.';
  $('mode').value='campaign';attemptRecorded=false;progressReceipt='';oldPhase='';oldStack=null;accumulator=0;updateUI(true);
},true));
$('practice').addEventListener('click', () => start(flight.mode === 'space' ? 'flight' : 'space'));
$('restart').addEventListener('click', ()=>shell.confirmReset(restart));
$('mode').addEventListener('change',restart);
$('bonus-enabled').addEventListener('change',restart);
$('save-results').addEventListener('click',()=>{
  retainExplanation();
  const payload={game:'Arrow Space Shift',version:BUILD.version,recordedAt:new Date().toISOString(),attempts,
    current:readFlight(flight),prediction:$('prediction').value,explanation:$('explanation').value};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='arrow-space-shift-playtest.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('pause').addEventListener('click', () => flight.phase === 'paused' ? resume() : pause());
$('fold').addEventListener('click',()=>{fold();if(flight.phase==='running')canvas.focus({preventScroll:true});});
$('unfold').addEventListener('click',()=>{unfold();if(flight.phase==='running')canvas.focus({preventScroll:true});});
$('sound').addEventListener('click',()=>setSoundEnabled(!preferences.sound));
$('volume').addEventListener('input',()=>{preferences.volume=Number($('volume').value)/100;updateOptions();});
$('volume').addEventListener('change',async()=>{await audioBus.unlock();audioBus.cue('preview');});
for(const [id,key] of [['music-volume','musicVolume'],['effects-volume','effectsVolume'],['ambience-volume','ambienceVolume']])$(id).addEventListener('input',()=>{
  preferences[key]=Math.max(0,Math.min(1,Number($(id).value)/100));updateOptions();
});
for(const [id,key] of [['music','music'],['juice','juice'],['reduced-motion','reducedMotion'],['collision-core','showCore'],['pattern-labels','patternLabels'],['manifold-cues','manifoldCues']])$(id).addEventListener('change',()=>{preferences[key]=$(id).checked;updateOptions();render();});
$('practice-stages').addEventListener('click',event=>{const button=event.target.closest('button[data-practice-chapter]');if(button)startPracticeChapter(Number(button.dataset.practiceChapter));});
$('export-progress').addEventListener('click',()=>{
  try{
  const payload={...exportProgress(undefined,{profile:fleetProfile,journey:campaignJourney,checkpoint:checkpointFromFlight(flight),preferences}),build:BUILD.version,exportedAt:new Date().toISOString()};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=document.createElement('a');
  a.href=url;a.download=`arrow-space-shift-progress-${BUILD.version}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  $('progress-transfer-status').textContent=BUILD.postJamContent?'Campaign export created. It includes fleet, checkpoints, repair progress, and settings. Import replaces these records.':'Campaign export created. It includes saved progress, ships, checkpoints, and settings. Import replaces these records.';
  }catch(error){$('progress-transfer-status').textContent=`Export failed. No file was created: ${error.message}`;}
});
$('import-progress-button').addEventListener('click',()=>$('import-progress').click());
$('import-progress').addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{
    const payload=JSON.parse(await file.text()),result=importProgress(payload);
    if(!result.ok)throw new Error(result.recovered?'The write failed. Previous progress was restored.':'The write failed. A recovery record remains in this browser.');
    fleetProfile=loadFleetProfile();fleetProfileSignature=JSON.stringify(fleetProfile);
    campaignJourney=loadJourney();
    Object.assign(preferences,loadPreferences());updateOptions();
    flight=readCheckpoint()||createFlight('campaign',{fleetProfile});flight.fleetProfile=createFleetProfile(fleetProfile);
    clearInput();oldPhase='';oldStack=null;accumulator=0;hangarSignature='';
    $('progress-transfer-status').textContent=BUILD.postJamContent?'Progress imported. The saved checkpoint and repair state are ready.':'Progress imported. Saved campaign progress and settings are ready.';
    updateUI(true);
  }catch(error){$('progress-transfer-status').textContent=`Import rejected: ${error.message}`;}
  event.target.value='';
});
updateOptions();
const actionKeys = new Set(['ShiftLeft','ShiftRight','KeyP','Escape','Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyC','KeyE','Digit1','Digit2','Digit3']);
window.addEventListener('keydown', event => {
  if(!event.repeat&&['Space','KeyC','KeyE','ShiftLeft','ShiftRight','KeyP'].includes(event.code))void audioBus.unlock();
  if(event.code==='Space'&&suppressSpaceUntilRelease){if(event.repeat){event.preventDefault();return;}suppressSpaceUntilRelease=false;}
  if(document.querySelector('dialog[open]'))return;
  if(flight.phase==='choosing'&&['Digit1','Digit2','Digit3'].includes(event.code)){event.preventDefault();const index=Number(event.code.slice(-1))-1,choice=flight.projective?.offers[index];if(choice)chooseForge(choice);return;}
  if(needsShipChoice())return;
  if (event.ctrlKey || event.altKey || event.metaKey || !actionKeys.has(event.code)) return;
  if (event.target.closest?.('input,textarea,select') || (event.target.closest?.('button,summary,a') && event.code === 'Space')) return;
  event.preventDefault(); keys.add(event.code);
  if (event.repeat) return;
  if (event.code === 'ShiftLeft') fold();
  if (event.code === 'ShiftRight') unfold();
  if (event.code === 'KeyP' || event.code === 'Escape') {
    if (flight.phase === 'paused') resume(); else pause();
  }
});
window.addEventListener('keyup', event => {keys.delete(event.code);if(event.code==='Space'){if(suppressSpaceUntilRelease)event.preventDefault();suppressSpaceUntilRelease=false;}});
window.addEventListener('blur', () => { clearInput(); pause('Focus lost. Resume when you are ready.'); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { clearInput(); audioBus.stopAmbient();pause('Tab hidden. Resume when you are ready.'); } });
canvas.addEventListener('pointerdown', () => {void audioBus.unlock();canvas.focus({preventScroll:true});});
function input() {
  return { horizontal: Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft')),
    throttle: 0,
    fire: keys.has('Space'),capture:keys.has('KeyC'),release:keys.has('KeyE') };
}

for(const [id,slot] of [['slot-one',0],['slot-two',1]])$(id).addEventListener('click',()=>{flight.selectedSlot=slot;updateUI(true);});
$('inventory').addEventListener('click',event=>{
  const button=event.target.closest('button[data-seed]');if(!button)return;
  equipSeed(flight,button.dataset.seed);updateUI(true);
});
$('craft-aftwing').addEventListener('click',()=>{
  if(!craftAftwing(fleetProfile)){$('fabrication-message').textContent='Aftwing requires the Projective Module blueprint and five first-clear salvage units.';return;}
  const saved=persistFleetProfile(fleetProfile);
  $('fabrication-message').textContent=saved?'Aftwing constructed. Choose it for your next flight.':'Aftwing constructed for this session; browser storage could not save it.';
  hangarSignature='';updateUI(true);
});
$('fleet-ships').addEventListener('click',event=>{
  const button=event.target.closest('button[data-ship]');if(!button)return;
  if(!selectShip(fleetProfile,Number(button.dataset.ship)))return;
  if(needsShipChoice())launchShipConfirmed=true;
  flight.fleetProfile=createFleetProfile(fleetProfile);fleetProfileSignature=JSON.stringify(fleetProfile);
  if(!testing)fleetProfileSaved=progressStorageReady&&saveFleetProfile(fleetProfile);
  finishFleetCheckpoint();
  updateHangar();updateUI(true);$('fleet-ships').querySelector(`button[data-ship="${fleetProfile.selectedShip}"]`)?.focus({preventScroll:true});
});

function renderCounterGraph(reset=false){
  const stage=Number($('graph-stage').value),ids=roster(stage);
  if(reset || !$('graph-a').options.length){
    for(const id of ['graph-a','graph-b']){
      $(id).replaceChildren(...ids.map(n=>new Option(OPERATIONS[n].name,String(n))));
    }
    $('graph-b').value=String(ids[1]);
  }
  $('graph-second').hidden=stage===1;
  const a=Number($('graph-a').value),b=Number($('graph-b').value),selected=stage===1?[a]:[a,b];
  const matches=commonCounters(selected,stage),audit=auditTournament(stage);
  $('counter-result').textContent=stage===2&&a===b?'Select two different operations.':`Outside counter: ${matches.map(n=>OPERATIONS[n].name).join(', ')}.`;
  $('graph-status').textContent=`${audit.vertices.length} operations. ${audit.witnesses.length} ${stage===1?'single-operation':'pair'} checks passed. Counter shots pass the opposing operation. Combat balance needs playtests.`;
  const table=$('counter-matrix');table.replaceChildren();
  const caption=table.createCaption();caption.textContent='Row counters column. A counter shot passes that operation.';
  const heading=table.createTHead().insertRow();
  for(const text of ['Operation',...ids.map(n=>OPERATIONS[n].code)]){const th=document.createElement('th');th.scope='col';th.textContent=text;heading.append(th);}
  const body=table.createTBody();
  for(const n of ids){const row=body.insertRow(),th=document.createElement('th');th.scope='row';th.textContent=OPERATIONS[n].name;row.append(th);
    for(const m of ids){const cell=row.insertCell();cell.textContent=n===m?'—':audit.edges.some(([x,y])=>x===n&&y===m)?'Yes':'No';cell.title=OPERATIONS[m].name;}
  }
  const operation=OPERATIONS[a];$('operation-name').textContent=operation.name;$('operation-status').textContent=operation.status;
  $('operation-effects').replaceChildren(...EFFECT_AXES.map((axis,i)=>{const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=axis;dd.textContent=operation.effects[i];div.append(dt,dd);return div;}));
}
$('graph-stage').addEventListener('change',()=>renderCounterGraph(true));
for(const id of ['graph-a','graph-b'])$(id).addEventListener('change',()=>renderCounterGraph());
renderCounterGraph(true);

function updateUI(force = false) {
  if (!force && hudClock < 0.1) return;
  hudClock = 0;
  shell.audioStatus?.update();
  updateSoundToggle();
  syncFleetProgress();
  const s = flight, factor = 1 / metricAt(isScrollingLevel(s)&&!isKleinSurfaceRoute(s)?s.cameraZ:s.z,s.fields),phaseChanged=s.phase!==oldPhase;
  const pace=foldRoutePace(s);
  $('progress-label').textContent=s.encounter?`Encounter ${s.encounterIndex+1} / 3`:pace?`${Math.floor(pace.progress).toLocaleString('en-US')} / ${pace.routeLength.toLocaleString('en-US')} · +${pace.leadSeconds.toFixed(1)}s`:`${Math.floor(s.z).toLocaleString('en-US')} / 8,400`;
  $('route').max=pace?.routeLength||ROUTE_LENGTH;
  $('route').value=s.encounter?(s.encounterIndex+(s.phase==='won'?1:0))/3*ROUTE_LENGTH:pace?.progress??s.z; $('hull').textContent = `${s.hull} / 5`;
  $('time-label').textContent=pace?`+${pace.leadSeconds.toFixed(1)}s saved`:'Flight time';
  $('time').textContent = s.countdown>0 && s.phase!=='ready'?`In ${Math.ceil(s.countdown)} s`:`${(pace?.elapsed??s.time).toFixed(2)} s`; $('score').textContent = s.score;$('graze-count').textContent=s.campaign?.metrics?.grazes||0;
  $('bonus').textContent = s.bonusEnabled?`Fold bonus earned: ${s.foldBonus}`:'Fold score bonus is off';
  $('bonus-rule').textContent=s.bonusEnabled?'Each fold at the target adds 50 points to a kill.':'A kill gives 100 points in folded or open space.';
  $('unfold-rule').textContent=s.bonusEnabled?'Unfold: more reaction time, slower outgoing shots, lower kill reward.':'Unfold: more reaction time and slower outgoing shots. Kill points stay the same.';
  $('tradeoff-intro').textContent=s.bonusEnabled?'Fold for faster shots and bonus points. Enemy shots accelerate too. Unfold to get more reaction time.':'Fold for faster shots. Enemy shots accelerate too. Unfold to get more reaction time.';
  $('upgrade-panel').hidden=!upgradeModes.includes(s.mode);
  $('upgrade-title').textContent=s.mode==='warp-lab'?'Position Warp lab':['Introduction · one operation','3-Paley · three operations','7-Paley · seven operations'][s.stage];
  $('warp-state').textContent=`${s.fields.length} folds · ${s.warpCount} position warps`;
  $('upgrade-binding').textContent=loadout(s).length?loadout(s).map(seed=>`${seedLabel(seed)}: accepts ${activeSourceSide(s,seed)===1?'right':'left'} shots`).join(' / '):'Collect a seed to equip an operation.';
  $('upgrade-side').textContent='Each fold or unfold reverses the accepted side. Other shots pass normally. Center shots are not affected.';
  $('stage-guide').textContent=s.stage===0?'Introduction: Position Warp. At route 1,300, the three-operation cycle begins.':s.stage===1?'Cycle: Position Warp → Vector Lens → Impact Buffer → Position Warp. At route 3,800, seven operations begin.':'Each pair has an outside counter. Slot 1 acts before Slot 2. A moved shot can leave the next operation’s accepted side.';
  const interaction=s.events.findLast(e=>(e.type==='counter-bypass'||e.type==='operation')&&s.time-e.time<2);
  $('interaction').textContent=interaction?interaction.type==='counter-bypass'?`${interaction.actor==='player'?'Enemy':'Your'} ${OPERATIONS[interaction.attack].name} shot passed ${interaction.actor==='player'?'your':'enemy'} ${OPERATIONS[interaction.defense].name}.`:`${interaction.actor==='player'?'Your':'Enemy'} ${OPERATIONS[interaction.typeId].name} acted on a shot.`:'Counter results appear here during combat.';
  $('drop-preview').textContent=s.drops.length?`Seeds ahead: ${s.drops.slice(0,2).map(d=>`${seedLabel(d)} (accepts ${activeSourceSide(s,d)===1?'right':'left'})`).join('; ')}`:'Defeated carriers drop their equipped seeds.';
  if(s.mode==='campaign'&&(s.campaign?.index??-1)>=9&&(s.campaign?.index??-1)<18){
    const count=Math.min(2,s.campaign.duplicateRepairSeeds||0);
    $('drop-preview').textContent+=s.campaign.duplicateRepairUsed?' · Field patch used this stage':` · Duplicate seeds ${count}/2 toward 1 hull field patch (once per stage)`;
  }
  $('debt').textContent=`Stored damage due: ${s.debts.filter(d=>d.target==='player').reduce((n,d)=>n+d.amount,0)}`;
  const inventoryState=JSON.stringify([s.inventory.map(seed=>seed.key),s.equipped.map(seed=>seed?.key),s.selectedSlot,s.slotCount,s.fields.length%2]);
  if(inventoryState!==inventorySignature){
    inventorySignature=inventoryState;
    $('slot-one').textContent=`Slot 1: ${s.equipped[0]?seedLabel(s.equipped[0]):'empty'}`;
    $('slot-two').textContent=s.slotCount===2?`Slot 2: ${s.equipped[1]?seedLabel(s.equipped[1]):'empty'}`:'Slot 2: opens at 7-Paley';
    $('slot-two').disabled=s.slotCount<2;
    $('slot-one').setAttribute('aria-pressed',String(s.selectedSlot===0));$('slot-two').setAttribute('aria-pressed',String(s.selectedSlot===1));
    $('inventory').replaceChildren(...s.inventory.map(seed=>{
      const button=document.createElement('button'),heading=document.createElement('strong'),detail=document.createElement('small'),side=document.createElement('small');
      button.type='button';button.className='seed-card';button.dataset.seed=seed.key;button.style.setProperty('--seed-color',OPERATIONS[seed.type].color);
      heading.textContent=`${OPERATIONS[seed.type].code} · ${seedLabel(seed)}`;detail.textContent=effectSummary[seed.type];
      side.textContent=`Now accepts ${activeSourceSide(s,seed)===1?'RIGHT':'LEFT'} shots · ${seed.polarity===1?'right':'left'} seed`;
      button.append(heading,detail,side);button.setAttribute('aria-pressed',String(s.equipped[s.selectedSlot]?.key===seed.key));return button;
    }));
    $('inventory-note').textContent=s.inventory.length?'Select a slot, then a seed. Pickups fill empty slots; they keep your existing choices.':'Collect seeds during flight. They remain in your inventory.';
  }
  const activeEcho=Boolean(s.projective&&s.campaign?.index>=18);
  $('echo-panel').hidden=!activeEcho;$('capture-echo').hidden=!activeEcho;$('release-echo').hidden=!activeEcho;
  if(activeEcho){
    const p=s.projective;$('echo-counter').textContent=`Echoes ${p.echoes} / ${p.capacity} · Captured ${p.captured} · Released ${p.released}`;
    $('echo-build').textContent=p.upgrades.length?`Installed: ${p.upgrades.map(id=>EVOLUTION_BY_ID[id]?.name||id).join(' · ')}`:'No evolutions yet · Capture C · Release E';
    $('capture-echo').disabled=s.phase!=='running'||p.captureCooldown>0||p.echoes>=p.capacity;
    $('release-echo').disabled=s.phase!=='running'||p.releaseCooldown>0||p.echoes===0;
  }
  $('mode').disabled=s.phase!=='ready';$('bonus-enabled').disabled=s.phase!=='ready';
  $('encounter-panel').hidden=!s.encounter;
  if(s.encounter){
    const e=s.encounter;
    $('encounter-name').textContent=`${s.encounterIndex+1} / 3 · ${e.name}`;
    $('encounter-goal').textContent=e.goal;
    let label='Salvo approaching. Steer clear of the marked band.';
    if(e.opens!==undefined)label=e.hit ? s.encounterIndex===2?'Guard salvo launched at your lane.':'Target hit.' : s.time<e.opens?`Target opens in ${(e.opens-s.time).toFixed(2)} s`:targetOpen(s)?`Target open · ${(e.closes-s.time).toFixed(2)} s left`:'Target closed.';
    $('target-clock').textContent=s.countdown>0 ? s.phase==='ready'?'Two-second countdown at launch':`Launch in ${Math.ceil(s.countdown)} s` : label;
    $('window-progress').value=Math.min(1,s.time/(e.closes||e.limit));
  }
  const displayThrust=isScrollingLevel(s)?SCROLL_SPEED:isBoss(s)?Math.abs(s.thrust):s.thrust;
  $('factor').textContent = `${factor}×`; $('thrust').textContent = displayThrust.toFixed(0);
  $('speed').textContent = (displayThrust * factor).toFixed(0); $('metric').textContent = (1 / factor).toFixed(3);
  $('factor-note').textContent = factor === 1 ? 'The route is outside a fold field.' : `The compressed route advances at ${factor}× its normal pace.`;
  $('fold-count').textContent = `${s.fields.length} / ${s.maxFolds}`;
  $('field-caption').textContent = factor > 1 ? `Compressed corridor · ${factor}× route pace` : s.fields.length ? 'Fold fields ahead or behind the ship' : 'Space is open';
  const tutorialMayFold=!isTutorial(s)||['fold','unfold','engage'].includes(s.campaign.lesson);
  $('fold').classList.toggle('available', s.phase === 'running' && tutorialMayFold && s.fields.length < s.maxFolds);
  $('unfold').classList.toggle('available', s.phase === 'running' && s.fields.length > 0);
  $('fold').disabled=s.phase!=='running'||!tutorialMayFold||s.fields.length>=s.maxFolds;
  $('unfold').disabled=s.phase!=='running'||!s.fields.length;
  $('pause').disabled = !['running','paused'].includes(s.phase);
  $('pause').textContent = s.phase === 'paused' ? 'Resume' : 'Pause';
  const routeAnchor=isScrollingLevel(s)&&!isKleinSurfaceRoute(s)?s.cameraZ:s.z;
  const signature = s.fields.map(f => `${f.id}:${routeAnchor < f.start ? 'ahead' : routeAnchor < f.end ? 'inside' : 'passed'}`).join('|');
  if (signature !== oldStack) {
    oldStack = signature;
    $('fold-stack').replaceChildren();
    if (!s.fields.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'No active fields.'; $('fold-stack').append(li); }
    s.fields.forEach((f, i) => {
      const li = document.createElement('li'); li.textContent = `Field ${f.id}${i === s.fields.length - 1 ? ' · latest' : ''}`;
      const small = document.createElement('small'); small.textContent = `${Math.round(f.start)}–${Math.round(f.end)} · ${routeAnchor < f.start ? 'Ahead' : routeAnchor < f.end ? 'Inside' : 'Passed'} · Shots ×2`;
      li.append(small); $('fold-stack').append(li);
    });
  }
  const eventText=!isActAvailable(4)&&s.mode==='campaign'&&s.campaign?.index===26&&s.phase==='won'?
    s.practice?'Curvature Gate practice complete.':'Curvature Seed banked. Act III is complete.':
    isJamCompletionEntry(s,fleetProfile)&&!newCampaignChosen?'Curvature Seed banked. Act III is complete.':s.lastEvent;
  if (eventText !== oldEvent) { oldEvent = eventText; $('event').textContent = eventText; }
  if(s.phase==='running' && s.countdown>0)$('flight-state').textContent=`Launch in ${Math.ceil(s.countdown)} s`;
  else if(s.phase==='running')$('flight-state').textContent=s.encounter?'Timing course':upgradeModes.includes(s.mode)?s.mode==='warp-lab'?'Position warp lab':['Introduction · 1','3-Paley','7-Paley'][s.stage]:s.mode==='space'?'Space-only test':'Reference route';
  if (s.phase !== oldPhase) {
    $('campaign-completion').hidden=!BUILD.postJamContent||!campaignJourney.completed;
    oldPhase = s.phase;
    if(s.phase==='ready'||s.phase==='won')launchShipConfirmed=false;
    if(s.phase!=='running'){
      clearInput();
      if(s.phase!=='choosing')audioBus.setPlaying(false);
    }
    $('overlay').dataset.phase=s.phase;document.querySelector('.viewport').dataset.phase=s.phase;
    $('evolution-choices').hidden=s.phase!=='choosing';$('primary').hidden=s.phase==='choosing';
    if(isCampaign(s)&&['cleared','lost','won'].includes(s.phase)){recordCampaignProgress(s);syncFleetProgress();}
    if(isCampaign(s)&&s.phase==='cleared')saveSection();
    if(isCampaign(s)&&s.phase==='won')finishFleetCheckpoint();
    if(!testing&&progressStorageReady&&['cleared','lost','won'].includes(s.phase)){highScore=updateBestScore(s.score);$('best-score').textContent=`Best score in this browser: ${highScore.toLocaleString('en-US')}`;}
    $('overlay').hidden = s.phase === 'running';
    $('flight-state').textContent = ({ready:'Ready for flight',running:s.mode === 'space' ? 'Space-only test' : 'Flight in progress',paused:'Flight paused',won:'Transit complete',lost:'Hull lost'})[s.phase];
    if(s.phase==='choosing'){
      $('overlay-title').textContent='Echo Forge · Choose an evolution';
      $('overlay-text').textContent='Battle paused. Every evolution changes an action, resource, or positional tradeoff. Press 1–3 or choose a card.';
      const cards=(s.projective?.offers||[]).map((id,index)=>{
        const data=EVOLUTION_BY_ID[id],button=document.createElement('button'),title=document.createElement('strong'),detail=document.createElement('span');
        button.type='button';button.className='evolution-choice';button.dataset.evolution=id;title.textContent=`${index+1} · ${data.name}`;detail.textContent=data.description;button.append(title,detail);return button;});
      $('evolution-choices').replaceChildren(...cards);$('evolution-choices').hidden=false;
      $('overlay-note').textContent='Evolutions persist across Act III stages and consume no repair components.';
      cards[0]?.focus({preventScroll:true});
    } else if (s.phase === 'ready') {
      $('overlay-title').textContent = s.encounter?s.encounter.name:s.mode==='warp-lab'?'Choose the incoming side.':upgradeModes.includes(s.mode)?['One, then three, then seven.','Test the three-operation cycle.','Test seven operations.'][s.stage]:'Fold the distance.';
      $('overlay-text').textContent = s.encounter?s.encounter.brief:upgradeModes.includes(s.mode)?'A right seed accepts right-side shots with one fold. A left seed accepts left-side shots. Unfold to reverse those sides. Other shots continue normally. Enemies use and drop upgrades.':'Fold for faster shots. Enemy shots accelerate too. Unfold to gain reaction time.';
      $('primary').textContent = s.encounter?'Start encounter 1':s.mode==='warp-lab'?'Start warp lab':upgradeModes.includes(s.mode)?'Start upgrade flight':s.mode === 'space' ? 'Start space test' : 'Start reference route';
    } else if (s.phase === 'paused') {
      $('overlay-title').textContent = 'Flight paused.'; $('overlay-text').textContent = s.lastEvent;
      $('primary').textContent = 'Resume flight';
    } else if (s.phase === 'won' || s.phase === 'lost') {
      $('overlay-title').textContent = s.encounter ? s.phase==='won' ? s.encounterIndex===2?'Timing course complete.':'Encounter cleared.' : 'Try the timing again.' : s.phase === 'won' ? 'Transit complete.' : 'Hull lost.';
      if(isCampaign(s)&&s.phase==='won'&&s.campaign?.index===8)$('overlay-title').textContent='Klein Relay recovered · the surface is now yours.';
      $('overlay-text').textContent = s.encounter?`${s.lastEvent} Time: ${s.time.toFixed(2)} s. Score: ${s.score}. Bonus ${s.bonusEnabled?'on':'off'}.`:`${s.z.toFixed(0)} route units in ${s.time.toFixed(1)} seconds. ${s.foldsUsed} folds made. Score: ${s.score}.`;
      if(isCampaign(s)&&s.phase==='won'&&s.campaign?.index===8)
        $('overlay-text').textContent='You survived the Alice Universe and physically recovered the relay. The next chapter changes the battlefield: YOU can now cross the Klein joins. Choose a ship to launch into that surface.';
      $('primary').textContent = s.encounter ? s.phase==='won' ? s.encounterIndex===2?'Repeat course':`Start encounter ${s.encounterIndex+2}` : 'Retry encounter' : 'Fly again';
      if(!attemptRecorded){
        attemptRecorded=true;
        attempts.push({mode:s.mode,encounterIndex:s.encounterIndex ?? null,result:s.phase,time:s.time,hull:s.hull,score:s.score,bonusEnabled:s.bonusEnabled,
          events:s.events.map(e=>({...e})),prediction:attemptPrediction,explanation:''});
        const li=document.createElement('li');li.textContent=`${s.encounter?s.encounter.name:s.mode}: ${s.phase==='won'?'cleared':'failed'} · ${s.time.toFixed(2)} s · bonus ${s.bonusEnabled?'on':'off'}`;$('attempts').append(li);
      }
      if (s.phase === 'won') audioBus.cue('won');
    }
    $('practice').hidden = s.phase === 'paused'||s.phase==='choosing'||!!s.encounter||upgradeModes.includes(s.mode);
    $('overlay-note').textContent=s.encounter?'One active fold. A two-second countdown starts each attempt. Use Restart to change the score comparison.':upgradeModes.includes(s.mode)?'Space fires straight ahead. Align the ship with a visible enemy. An entering enemy becomes active after a short delay.':'Use a keyboard. The space-only test has no enemies.';
    $('practice').textContent = s.mode === 'space' ? 'Start reference route' : 'Test space only';
    $('overlay-note').hidden = s.phase === 'paused';
    if (s.phase !== 'running' && s.phase !== 'ready'&&s.phase!=='choosing'&&!needsShipChoice()) $('primary').focus({preventScroll:true});
  }
  const grade=s.campaign?.grade,showGrade=isCampaign(s)&&s.phase==='cleared'&&Boolean(grade);
  $('stage-scorecard').hidden=!showGrade;
  if(showGrade){$('grade-letter').textContent=grade.letter;$('grade-score').textContent=`${grade.score} / 100`;
    for(const key of ['survival','execution','precision','topology','control'])$(`grade-${key}`).textContent=grade[key];}
  updateCampaignUI();
  updateHangar();
  updatePracticeMenu();
  updateProgressRecords();
  $('primary').disabled=(!pixelArt.image&&!pixelArt.error)||(needsShipChoice()&&!launchShipConfirmed)||(s.phase==='won'&&chapter(s)?.projectiveBoss&&!fleetProfile.curvatureSeed);
  if(phaseChanged&&needsShipChoice())$('fleet-ships').querySelector('button[data-ship]')?.focus({preventScroll:true});
  $('space-status').textContent=`${factor>1?'Inside fold':'Open space'} ${factor}× · Folds ${s.fields.length}/${s.maxFolds}`;
  const debts=s.debts.filter(d=>d.target==='player'),debt=debts.reduce((n,d)=>n+d.amount,0),due=debts.length?Math.max(0,Math.min(...debts.map(d=>d.due))-s.time):0;
  $('live-debt').textContent=debt?`Stored damage ${debt} · due in ${due.toFixed(1)} s`:'Stored damage 0';$('live-debt').classList.toggle('has-debt',debt>0);
}

function updateCampaignUI(){
  const s=flight,on=isCampaign(s);$('campaign-panel').hidden=!on;$('new-run').hidden=!on;
  if(!on)$('route-marker').hidden=true;
  $('axial-control-row').hidden=true;
  $('tutorial-prompt').hidden=true;$('drive-status').hidden=!on;
  $('geometry-warning').hidden=true;
  $('campaign-help').hidden=!on;$('combat-loadout').hidden=!on;
  $('restart').textContent=on?'Retry section':'Restart';
  $('thrust-control').textContent=on?'No action':'Change thrust';
  $('thrust-label').textContent=on?(isScrollingLevel(s)||isBoss(s)?'Scroll speed':'Vertical speed'):'Thrust';
  if(!on)return;
  const c=chapter(s),boss=isBoss(s),tutorial=isTutorial(s),scrolling=isScrollingLevel(s);
  // The route-results view needs its own pace snapshot. The similarly named
  // value in updateUI() is function-local and unavailable here.
  const pace=foldRoutePace(s);
  $('axial-control-row').hidden=true;
  $('thrust-control').textContent=c.kleinSurface&&!boss?'Advance / reverse':'No action';
  const ship=activeShip(s),bossPhase=s.campaign.bossPhase||'combat';
  const recovering=boss&&bossPhase==='salvage',exiting=boss&&bossPhase==='exit';
  if(s.phase==='choosing')return;
  const projectivePart=c.hybrid||s.campaign.repairPart?.id==='projective-module';
  const curvaturePart=c.projectiveBoss||s.campaign.repairPart?.id==='curvature-seed';
  const partName=curvaturePart?'Curvature Seed':projectivePart?'Projective Module':'Klein relay';
  const bossGoal=recovering?`Pick up the ${partName}. The surface continues to scroll.`:exiting?`${partName} secured. Cross the extraction line to complete the recovery.`:c.goal;
  const warning=Number.isFinite(s.drive?.warningUntil)&&s.drive.warningUntil>s.time;
  $('drive-status').dataset.warning=String(warning);
  const hasRelay=fleetProfile.driveParts.includes('klein-relay'),hasProjective=fleetProfile.driveParts.includes('projective-module');
  $('drive-condition').textContent=warning?`Damaged Warp Drive · fold surge in ${(s.drive.warningUntil-s.time).toFixed(1)} s`:s.drive?.status==='repaired'?'Warp Drive repaired':hasProjective?'Damaged Warp Drive · Klein Relay + Projective Module recovered':s.campaign.repairPart?.collected||hasRelay?'Damaged Warp Drive · Klein Relay recovered':'Damaged Warp Drive · find repair parts';
  $('current-ship').textContent=`${ship.name} · ${describeShipForRelease(ship).role}`;
  $('route-marker').hidden=boss||tutorial;
  if(!boss&&!tutorial&&$('route-marker').dataset.stage!==String(Math.min(7,c.number-1))){$('route-marker').dataset.stage=String(Math.min(7,c.number-1));$('route-marker').src=new URL(`../assets/crossing/stage.${Math.min(7,c.number-1)}.png`,import.meta.url).href;}
  const notice=campaignNotice(s);$('tutorial-prompt').hidden=!notice;
  if(notice){$('tutorial-prompt').dataset.kind=notice.kind;if($('tutorial-prompt').textContent!==notice.text)$('tutorial-prompt').textContent=notice.text;}
  const arming=c.hybrid&&(s.campaign?.hybridPhase||1)>=3&&!hybridProjectiveActive(s);
  const approaching=playerJoinForecast(s,{horizontalVelocity:s.lateralVelocity||0,axialInput:s.lastAxialInput||0,horizon:2});
  const geometryWarning=$('geometry-warning');geometryWarning.hidden=!(approaching||arming);
  if(arming){
    geometryWarning.dataset.rule='arming';
    geometryWarning.textContent=`HYBRID JOIN ARMING · projective top/bottom activates in ${Math.max(0,s.campaign.phaseBreakUntil-s.time).toFixed(1)} s. The side joins remain Klein.`;
  } else if(approaching){
    geometryWarning.dataset.rule=approaching.rule;
    const description=approaching.rule==='projective'?'PROJECTIVE: x reverses':approaching.rule==='klein'?'KLEIN: forward direction reverses':'TOP/BOTTOM: facing preserved';
    const lane=approaching.destination.x < -110?'LEFT':approaching.destination.x > 110?'RIGHT':'CENTER';
    const message=`JOIN IN ~${approaching.timeSeconds.toFixed(1)}s · ${approaching.edge.toUpperCase()} · ${description} · EXIT ${lane}`;
    if(geometryWarning.textContent!==message)geometryWarning.textContent=message;
  }
  $('combat-loadout').textContent=loadout(s).length?`${boss?'Scrolling · Facing':'Facing'} ${screenFacing(s)===1?'↑':'↓'} · ${loadout(s).map(seed=>`${OPERATIONS[seed.type].code} ${OPERATIONS[seed.type].name} ← accepts ${activeSourceSide(s,seed)===1?'RIGHT':'LEFT'}`).join('   /   ')}`:boss?'Surface scrolling · Left / Right steer · Hold Space to fire':'Flight controls · Left / Right steer · Hold Space to fire';
  $('side-heading').textContent=tutorial?'First flight':recovering?`Recover the ${partName}`:exiting?'Reach extraction':c.name;$('side-goal').textContent=boss?bossGoal:s.campaign.hint||c.goal;
  $('side-continuation').textContent=boss?`Destroy the ${c.projectiveBoss?'Curvature Gate':c.hybrid?'hybrid intrusion':'fleet'}, collect its repair part, then cross the exit. The part must reach your ship before it is secured.`:tutorial?'Hold Space. Fold to attack faster. Unfold to slow incoming fire.':'The damaged drive can fold space on its own. Right Shift removes the latest fold. Reach the route exit.';
  const sideSignature=JSON.stringify([s.equipped.map(seed=>seed?.key),s.fields.length%2,s.facing]);
  if($('side-loadout').dataset.signature!==sideSignature){
    $('side-loadout').dataset.signature=sideSignature;
    $('side-loadout').replaceChildren(...loadout(s).map(seed=>{const div=document.createElement('div'),name=document.createElement('strong'),detail=document.createElement('small'),side=document.createElement('em');div.className='operation-note';name.textContent=`${OPERATIONS[seed.type].code} · ${OPERATIONS[seed.type].name}`;name.style.color=OPERATIONS[seed.type].color;detail.textContent=effectSummary[seed.type];side.textContent=`ACCEPTS ${activeSourceSide(s,seed)===1?'RIGHT':'LEFT'} SHOTS`;div.append(name,detail,side);return div;}));
    if(!loadout(s).length)$('side-loadout').textContent='Your first operation arrives in Level 1.';
  }
  $('campaign-name').textContent=`${s.practice?'PRACTICE · ':''}${boss?`${c.act===3?'Boss 3':c.act===2?'Boss 2':'Boss 1'} · ${c.name}`:c.act===3?`Act III · ${c.actStage} / 8 · ${c.name}`:c.act===2?`Act II · ${c.actStage} / 8 · ${c.name}`:`Level ${c.number} / 8 · ${c.name}`}`;
  $('campaign-goal').textContent=tutorial?(notice?.text||c.goal):boss?bossGoal:c.goal;$('campaign-hint').textContent=c.hint;
  const alive=s.enemies.filter(e=>e.hp>0&&!e.escaped);
  const hybridPhase=c.hybrid?` · geometry ${s.campaign.hybridPhase||1} / 4`:'';
  $('campaign-objective').textContent=tutorial?({move:'1 / 4 · Move',shoot:'2 / 4 · Shoot',fold:'3 / 4 · Fold / Unfold',unfold:'3 / 4 · Fold / Unfold',engage:'4 / 4 · Destroy enemy',complete:'Level 1 starting…'}[s.campaign.lesson]||'Training'):recovering?'Repair part awaiting pickup':exiting?`${Math.ceil(s.campaign.exit?.remaining||0)} distance units to the exit`:boss?`${c.projectiveBoss?'Gate':c.hybrid?'Intrusion':'Fleet'} hull: ${alive.reduce((n,e)=>n+e.hp,0)} · ${alive.length} ships · ${s.campaign.wraps} edge crossings${hybridPhase}`:`Route ${Math.min(c.routeLength,Math.floor(s.z))} / ${c.routeLength} · ${alive.filter(e=>inCombatView(s,e)).length} carriers${c.calm?` · ${s.asteroids.filter(a=>inCombatView(s,a)).length} asteroids`:''} in view`;
  const routeOffset=c.act===3?18:c.act===2?9:0,routeNodes=c.act===3?CHAPTERS.slice(18,27):c.act===2?CHAPTERS.slice(9,18):CHAPTERS.slice(0,9);
  $('campaign-route').textContent=c.act>=2?`ACT ${c.act===3?'III':'II'}  `+routeNodes.map((node,j)=>`${routeOffset+j===s.campaign.index?'●':routeOffset+j<s.campaign.index?'✓':'○'} ${node.kind==='boss'?`Boss ${c.act}`:node.actStage}`).join('  '):`${tutorial?'●':'✓'} 0  `+routeNodes.map((node,i)=>`${i===s.campaign.index?'●':i<s.campaign.index?'✓':'○'} ${node.number||'Boss'}`).join('  ');
  $('progress-label').textContent=recovering?`Collect the ${partName}`:exiting?'Reach the exit':boss?c.name:pace?`${Math.round(100*pace.progress/pace.routeLength)}% · ${pace.leadSeconds.toFixed(1)}s saved`:'Level 0';
  $('route').value=scrolling?Math.min(1,(c.kleinSurface?s.cameraZ:s.z)/c.routeLength)*ROUTE_LENGTH:(s.campaign.index+(s.phase==='won'?1:0))/CHAPTERS.length*ROUTE_LENGTH;
  if(boss){
    const totalHull=s.enemies.reduce((n,e)=>n+(e.maxHp||e.hp),0)||1;
    $('route').value=(exiting?1-Math.max(0,s.campaign.exit?.remaining||0)/(s.campaign.exit?.total||900):recovering?0:1-alive.reduce((n,e)=>n+e.hp,0)/totalHull)*ROUTE_LENGTH;
  }
  $('route').setAttribute('aria-label',recovering?`Collect the ${partName}`:exiting?'Distance to the extraction line':boss?'Boss progress':'Route progress');
  $('upgrade-title').textContent=`${['One operation','Three operations','Seven operations'][s.stage]} · facing ${screenFacing(s)===1?'front':'back'}`;
  $('stage-guide').textContent=c.hint;
  $('flight-state').textContent=s.phase==='running'?recovering?`Recover the ${partName}`:exiting?'Reach extraction':`${boss?c.act===3?'Boss 3':c.act===2?'Boss 2':'Boss 1':`Level ${c.number}`} · ${c.name}`:s.phase==='cleared'?'Level complete':s.phase==='won'?curvaturePart?'Curvature Seed secured':projectivePart?'Projective Module secured':'Relay secured':s.phase==='lost'?'Retry this section':s.phase==='paused'?'Paused':'Ready for campaign';
  $('practice').hidden=true;$('overlay-note').textContent=c.act===3?'← → steer · Space fire · C capture · E release · Left Shift fold · Right Shift unfold':c.kleinSurface?'← → Seam steer · Space Fire · Left Shift Fold · Right Shift Unfold · P Pause':'← → Steer · Space Fire · Left Shift Fold · Right Shift Unfold · P Pause';
  if(boss)$('overlay-note').textContent='The surface scrolls. ← → Steer · Hold Space to fire · Left Shift Fold · Right Shift Unfold · P Pause';
  $('overlay-note').hidden=false;
  if(tutorial)$('overlay-note').textContent='Stage 0 · ← → Move → Space Fire → Left Shift Fold / Right Shift Unfold → Destroy enemy';
  $('overlay').hidden=s.phase==='running';$('primary').disabled=false;
  $('overlay').dataset.titleMenu=String(isCampaignEntryMenu(s));
  requestTitleMusic();
  // Unlocked modules remain owned, but choosing to skip an Act is explicit.
  // A saved section checkpoint takes precedence until resumed or cleared.
  $('continue-act2').hidden=!(isCampaign(s)&&s.phase==='ready'&&fleetProfile.fleetUnlocked);
  $('continue-act3').hidden=!(isCampaign(s)&&s.phase==='ready'&&fleetProfile.projectiveModule);
  $('continue-act4').hidden=!(isActAvailable(4)&&isCampaign(s)&&s.phase==='ready'&&fleetProfile.curvatureSeed);
  const completedEntry=isJamCompletionEntry(s,fleetProfile)&&!newCampaignChosen;
  $('start-over').hidden=!(isCampaign(s)&&s.phase==='paused'&&s.restoredCheckpoint||completedEntry);
  $('start-over').textContent=completedEntry?'New campaign · Level 0':'Start over · Level 0';
  if(s.phase==='ready'){
    $('overlay-title').textContent='Arrow Space Shift';
    $('overlay-text').textContent=fleetProfile.curvatureSeed?
      isActAvailable(4)?'Acts I–III completed. Act IV is unlocked as a separate playable Bolza campaign. Replay from Level 0 or choose an unlocked Act; nothing has been reset.':
      'Acts I–III completed. Thank you for playing Arrow Space Shift. Choose an unlocked Act for replay, or begin a new run. Your saved rewards remain available.':
      fleetProfile.fleetUnlocked?'Begin at Level 0, or continue an unlocked Act. Your saved modules and ships stay unlocked.':'Begin at Level 0. Learn movement, manual fire, and space folds.';
    $('primary').textContent='Begin at Level 0';
    $('overlay-note').textContent=fleetProfile.fleetUnlocked?'Your saved relay, modules, and ships remain unlocked. You can replay Act I or choose an unlocked Act below.':'Keyboard recommended · Learn the controls in Level 0 · Section checkpoints save automatically';
    if(completedEntry){
      $('overlay-title').textContent='Act III complete';
      $('overlay-text').textContent='Your Curvature Seed is banked. Thank you for playing Arrow Space Shift. Your recovered parts, ships, and stage records remain saved.';
      $('primary').textContent='Replay Act III';
      $('overlay-note').textContent='Replay Act III, choose another unlocked Act, or select New campaign to begin at Level 0.';
      $('side-heading').textContent='Act III complete';$('side-goal').textContent='Your Curvature Seed and campaign records are saved.';
    }
  }else if(s.phase==='paused'&&s.restoredCheckpoint){
    if(s.restoredTransitionFrom===8||s.restoredTransitionFrom===17){
      const nextAct=s.restoredTransitionFrom===8?'II':'III';
      const part=s.restoredTransitionFrom===8?'Klein Relay':'Projective Module';
      $('overlay-title').textContent=`Act ${nextAct} is ready`;
      $('overlay-text').textContent=`${part} already recovered and banked. Your score, equipment, ship, and previous progress are preserved. Begin ${c.name} rather than replaying Act I.`;
      $('primary').textContent=`Launch Act ${nextAct} · ${c.name}`;
      $('overlay-note').textContent=s.restoredTransitionFrom===8?'Select your ship below, then launch into Klein traversal.':'You may change your selected ship at the Fleet Hangar, or launch the current choice.';
    }else{
      const checkpointName=tutorial?'Level 0':boss?c.name:`Level ${c.number}`;
      $('overlay-title').textContent='Continue your flight';$('overlay-text').textContent=`Your ${checkpointName} checkpoint is ready. Start this section with full hull, the same route layout, and your saved equipment and score.`;$('primary').textContent=tutorial?'Resume training':boss?`Resume ${c.name}`:`Resume Level ${c.number}`;$('overlay-note').textContent='To start from Level 0 instead, choose Start over below. Saved fleet unlocks and records will remain.';
    }
  }else if(s.phase==='cleared'){
    const releaseComplete=s.campaign.index>=BUILD.maxChapterIndex;
    $('overlay-title').textContent=releaseComplete?`${BUILD.label} complete.`:`${c.name} complete.`;
    const best=fleetProfile.stageRecords?.[s.campaign.index]?.bestClearTime;
    const speed=s.campaign.grade?.speed;
    const paceText=pace?`Time ${pace.elapsed.toFixed(1)}s · Speed ${speed?.letter||'—'} · +${speed?.bonus||0} points${best?` · Best ${best.toFixed(1)}s`:''}`:'';
    $('overlay-text').textContent=releaseComplete?`Version ${BUILD.version} complete. Score ${s.score.toLocaleString('en-US')}${s.campaign.grade?` · Stage grade ${s.campaign.grade.letter} (${s.campaign.grade.score})`:''}. Your equipment and recovered drive parts remain saved.`:`Score ${s.score.toLocaleString('en-US')}${s.campaign.grade?` · Stage grade ${s.campaign.grade.letter} (${s.campaign.grade.score})`:''}. ${paceText}. Your equipment carries forward. The next section starts with full hull.${checkpointAvailable?' Checkpoint saved.':''}`;
    $('primary').textContent=releaseComplete?'Version complete':CHAPTERS[s.campaign.index+1]?.kind==='boss'?'Engage the next geometry':`Start Level ${CHAPTERS[s.campaign.index+1]?.number}`;
    $('primary').disabled=releaseComplete;
    if(autoAdvanceEligible(s,BUILD.maxChapterIndex)){
      const nextLabel=CHAPTERS[s.campaign.index+1]?.kind==='boss'?'Next boss':'Next level';
      const checkpointText=checkpointAvailable?'Your next-stage checkpoint is saved.':'This session retains progress, but browser checkpoint storage is unavailable.';
      $('overlay-note').textContent=`${nextLabel} starts automatically in ${Math.max(1,Math.ceil(stageClearClock.remaining()))} s. Press the button to continue now. ${checkpointText}`;
    }
  }else if(s.phase==='lost'){
    const recap=s.deathRecap?`${s.deathRecap.title}. ${s.deathRecap.detail}`:s.lastEvent;
    $('overlay-title').textContent='Try this section again.';$('overlay-text').textContent=`${recap} Retry from the section checkpoint. Earlier progress remains available.`;$('primary').textContent='Retry section';
  }else if(s.phase==='won'){
    $('overlay-title').textContent=c.projectiveBoss?'Act III complete · Curvature Seed secured.':c.hybrid?'Act II complete · Projective Module secured.':'Act I complete · Klein Relay secured.';$('overlay-text').textContent=c.projectiveBoss?`The Curvature Gate was defeated. Your ship and run are ready for the Bolza field. Score: ${s.score.toLocaleString('en-US')}.`:c.hybrid?`The hybrid geometry has been defeated. The Projective Module is banked. Continue directly into Act III · Projective Chart. Score: ${s.score.toLocaleString('en-US')}.`:`Klein Fleet defeated. Relay recovered and banked. Choose a ship and continue directly into Act II · Return Flight. Score: ${s.score.toLocaleString('en-US')}.`;
    $('overlay-note').textContent=fleetProfileSaved?(c.projectiveBoss?'Curvature Seed saved. Act IV keeps your ship differences, manual gun, fold, capture, and release. Equipment is stored, but its seven operation effects are inactive there. Recover the final core, then return to the repair dock.':c.hybrid?'The Klein Relay and Projective Module are saved. Act III now unlocks projective traversal.':'Your recovered part and unlocked ships are saved. Choose a hull to continue into Act II.'):`The unlock is held for this session.${checkpointAvailable?' Your previous section checkpoint is kept for reload.':' Browser storage is unavailable.'}`;
  }
  if(s.practice&&['cleared','lost','won'].includes(s.phase)){
    const recap=s.phase==='lost'&&s.deathRecap?` ${s.deathRecap.title}. ${s.deathRecap.detail}`:'';
    $('overlay-title').textContent=s.phase==='lost'?`${c.name} practice ended.`:`${c.name} practice complete.`;
    $('overlay-text').textContent=`Practice does not change campaign progress.${recap} Score ${s.score.toLocaleString('en-US')}${s.campaign.grade?` · Grade ${s.campaign.grade.letter}`:''}.`;
    $('primary').textContent='Retry practice';$('primary').disabled=false;$('overlay-note').textContent='Open Practice to choose another reached lesson.';
  }
  if(needsShipChoice())$('primary').textContent=launchShipConfirmed?
    `Launch Act II · ${(SHIPS.find(ship=>ship.id===fleetProfile.selectedShip)||STARTER_SHIPS[0]).name}`:'Select a ship for Act II';
  if(s.phase==='won'&&c.hybrid&&!s.practice){$('primary').textContent='Continue to Act III · Projective Chart';$('primary').disabled=false;}
  if(s.phase==='won'&&c.projectiveBoss&&!s.practice){
    if(isJamCampaignComplete(s,fleetProfile)){
      $('overlay-title').textContent='Act III complete';
      $('overlay-text').textContent=`You defeated the Curvature Gate and extracted the Curvature Seed. Thank you for playing Arrow Space Shift. Score: ${s.score.toLocaleString('en-US')}.`;
      $('overlay-note').textContent=fleetProfileSaved?'Your recovered parts, ships, and stage records are saved. Use Practice to replay a reached stage, or select Replay Act III for a new Act III run.':'The reward is held for this session. Export progress before leaving if browser storage is unavailable.';
      $('primary').textContent='Replay Act III';$('primary').disabled=false;
      $('side-heading').textContent='Act III complete';$('side-goal').textContent='The Curvature Seed is banked.';
      $('side-continuation').textContent='Replay a reached stage from Practice, or begin another Act III run.';
    }else if(isActAvailable(4)){
      $('primary').textContent='Launch Act IV · The Eight Edges';$('primary').disabled=!fleetProfile.curvatureSeed;
    }else{
      $('primary').textContent='Complete extraction';$('primary').disabled=true;
    }
  }
}

function resize() {
  const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  width = r.width; height = r.height;
  flight.view=viewState();
  document.querySelector('.viewport').style.setProperty('--dock-height',`${flight.view.topInset}px`);
  const layout=combatViewLayout(flight);document.querySelector('.viewport').style.setProperty('--arena-width',`${layout.arenaWidth}px`);
  document.querySelectorAll('.realm-aside').forEach(node=>{node.hidden=layout.left<215;});
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
const viewObserver=new ResizeObserver(resize);viewObserver.observe(canvas);viewObserver.observe(document.querySelector('.viewport-dock'));
function render(dt=0){renderer.render(flight,{width,height,dt,flash,debug:false});}
function frame(now){
  const dt=lastFrame ? Math.min((now-lastFrame)/1000,0.1) : 0;lastFrame=now;
  if((!testing||qaPlayback) && flight.phase==='running'){
    accumulator+=dt;
    while(accumulator>=STEP){tick(flight,input(),STEP);accumulator-=STEP;}
  }
  if(flight.campaign?.autoFromTutorial){
    delete flight.campaign.autoFromTutorial;
    noteChapterReached(flight);saveSection();
  }
  // Normal route clears used to stop simulation until the player clicked
  // a potentially off-screen button. The checkpoint already points at the
  // next route, so an automatic in-page handoff avoids a perceived freeze.
  // Keep results visible briefly; never skip boss rewards or practice.
  if(stageClearClock.tick(flight,dt,{
    blocked:document.hidden||Boolean(document.querySelector('dialog[open]')),
    maxChapterIndex:BUILD.maxChapterIndex,
  }))advanceChapter();
  flash=Math.max(0,flash-dt);hudClock+=dt;updateUI();render(dt);audioBus.process(flight);requestAnimationFrame(frame);
}
window.arrowSpaceShift = Object.freeze({read:()=>readFlight(flight),results:()=>structuredClone(attempts),assets:()=>pixelArt.status(),audio:()=>audioBus.diagnosticState()});
if(testing)window.arrowSpaceShiftTest=Object.freeze({
  start, restart, read:()=>readFlight(flight),
  loadFoundryTrial(constructed=false){
    // In-memory QA only. No permanent profile writes and no part rewards.
    const trial=createFleetProfile({fleetUnlocked:true,driveParts:['klein-relay','projective-module'],selectedShip:0});
    persistFleetProfile(trial);
    if(constructed){craftAftwing(fleetProfile);selectShip(fleetProfile,3);persistFleetProfile(fleetProfile);}
    clearInput();flight=createFlight('campaign',{fleetProfile,shipId:constructed?3:0,seed:2300});enterChapter(flight,18);
    flight.view=viewState();oldPhase='';oldStack=null;updateUI(true);render();return readFlight(flight);
  },
  loadChapterTrial(index=0){start('campaign');if(index>=18)unlockProjectiveModule(flight.fleetProfile);else if(index>=9)unlockKleinFleet(flight.fleetProfile);enterChapter(flight,index);flight.view=viewState();oldPhase='';oldStack=null;updateUI(true);render();return readFlight(flight);},
  loadDriveWarningTrial(){
    start('campaign');enterChapter(flight,0);flight.view=viewState();
    flight.drive.warningUntil=flight.time+1.4;flight.drive.nextFaultAt=flight.drive.warningUntil;
    oldPhase='';oldStack=null;updateUI(true);render();return readFlight(flight);
  },
  loadBossRecoveryTrial(index=8){
    if(![8,17,26].includes(index))index=8;
    start('campaign');
    if(index>=9)unlockKleinFleet(flight.fleetProfile);
    if(index>=18)unlockProjectiveModule(flight.fleetProfile);
    enterChapter(flight,index);flight.view=viewState();
    flight.campaign.introRemaining=0;flight.campaign.announcement=null;
    for(const enemy of flight.enemies)enemy.hp=0;
    flight.enemyShots=[];flight.shots=[];flight.debts=[];tick(flight,{},STEP);
    if(flight.campaign.repairPart){flight.campaign.repairPart.x=160;flight.campaign.repairPart.z=arenaZ(flight,180);}
    oldPhase='';oldStack=null;updateUI(true);render();return readFlight(flight);
  },
  loadManifoldPreviewTrial(index=8,phase=1){
    // In-memory visual fixtures. Genuine shots remain real/collidable; the
    // projected hollow positions are drawn by the renderer only.
    start('campaign');enterChapter(flight,index);flight.view=viewState();
    flight.phase='running';flight.countdown=0;flight.campaign.introRemaining=0;
    flight.campaign.phaseBreakUntil=0;
    if(index===17)flight.campaign.hybridPhase=phase;
    flight.enemyShots=[
      {x:370,z:arenaZ(flight,310),vx:160,vz:0,damage:1,owner:'enemy',geometryRule:phase>=3?'hybrid':'klein',projective:phase>=3,bornAt:flight.time},
      ...(index===17?[{x:130,z:arenaZ(flight,929),vx:0,vz:170,damage:1,owner:'enemy',geometryRule:'projective',projective:true,bornAt:flight.time}]:[]),
    ];
    oldPhase='';oldStack=null;updateUI(true);render();return readFlight(flight);
  },
  loadEnemyReturnTrial(index=0,edge='bottom'){
    start('campaign');enterChapter(flight,index);flight.view=viewState();flight.enemies=flight.enemies.slice(0,1);flight.asteroids=[];
    const enemy=flight.enemies[0];enemy.x=edge==='right'?399:140;enemy.z=arenaZ(flight,edge==='right'?350:edge==='top'?949:index===6?-69:-119);
    enemy.driftX=edge==='right'?150:0;enemy.driftY=edge==='top'?140:0;enemy.routeActive=true;enemy.hp=1;enemy.clock=.2;enemy.presented=true;enemy.visibleFor=ENTRY_TIME;
    oldPhase='';updateUI(true);render();return readFlight(flight);
  },
  finishWaveTrial(){
    for(const enemy of flight.enemies){if(enemy.hp<=0||!inCombatView(flight,enemy))continue;presentEnemy(flight,enemy);enemy.visibleFor=ENTRY_TIME;enemy.hp=1;
      flight.shots.push({x:enemy.x,z:advanceThroughSpace(enemy.z,-10,flight.fields),vx:0,vz:680,payload:[]});}
    return readFlight(flight);
  },
  finishRouteTrial(){if(isScrollingLevel(flight)){flight.cameraZ=chapter(flight).routeLength-1;flight.z=flight.cameraZ;flight.enemyShots=[];flight.debts=[];flight.invulnerable=2;}return readFlight(flight);},
  loadAsteroidTrial(owner='player'){start('campaign');enterChapter(flight,1);flight.view=viewState();flight.enemies=[];
    flight.asteroids=[{id:'fixture-rock',x:0,z:owner==='ship'?30:300,radius:26,hp:1,maxHp:1,shape:31,rotation:.5,presented:false}];
    const shot={x:0,z:owner==='player'?280:320,vx:0,vz:owner==='player'?680:-145,payload:[]};
    if(owner==='player')flight.shots=[shot];else if(owner==='enemy')flight.enemyShots=[shot];
    oldPhase='';updateUI(true);render();return readFlight(flight);
  },
  loadShotTrial(){
    start('space'); flight.z=300;
    flight.shots=[{x:-120,z:600}]; flight.enemyShots=[{x:180,z:1050,vx:0}];
    updateUI(true);render();return readFlight(flight);
  },
  loadSideTrial({polarity=1,folds=1,source=1,type=0,payload=[]}={}){start('warp-lab');flight.countdown=0;flight.z=300;flight.drops=[];flight.labWave=999;flight.labDropClock=999;
    for(let i=0;i<folds;i++)addFold(flight);
    collectDrop(flight,makeDrop(flight,0,300,'fixture',type,polarity));flight.drops=[];
    flight.enemyShots=[{x:source*60,z:advanceThroughSpace(flight.z,132,flight.fields),vx:-source*30,vz:-145,payload}];
    updateUI(true);render();return readFlight(flight);
  },
  loadStageTrial(stage=1){start(stage===2?'paley':'trio');flight.countdown=0;flight.enemies=[];flight.gates=[];flight.drops=[];
    const ids=roster(stage);for(const [i,type] of ids.entries())makeDrop(flight,(i-ids.length/2+.5)*70,200+i*60,'stage-fixture',type,i%2?-1:1);
    updateUI(true);render();return readFlight(flight);
  },
  loadEquipmentTrial(){start('paley');flight.enemies=[];flight.gates=[];flight.drops=[];
    for(const type of roster(2))collectDrop(flight,makeDrop(flight,0,0,'equipment-fixture',type,1));
    flight.drops=[];updateUI(true);render();return readFlight(flight);
  },
  loadEnemyTrial(){start('trio');flight.drops=[];flight.gates=[];
    flight.enemies=[{id:0,x:0,z:300,hp:1,clock:999,stage:1,equipped:[{type:0,polarity:1}],dropsUpgrade:true}];
    addFold(flight);flight.shots=[{x:60,z:170,vx:0,vz:680,payload:[]}];
    presentEnemy(flight,flight.enemies[0]);flight.enemies[0].visibleFor=ENTRY_TIME;
    updateUI(true);render();return readFlight(flight);
  },
  loadVisibilityTrial({folds=0,z=1600,presented=false,visibleFor=0}={}){start('trio');flight.drops=[];flight.gates=[];
    flight.enemies=[{id:0,x:0,z,hp:1,clock:0,stage:1,equipped:[],dropsUpgrade:true,presented,visibleFor}];
    for(let i=0;i<folds;i++)addFold(flight);
    flight.shots=[{x:0,z:z-10,vx:0,vz:680,payload:[]}];
    updateUI(true);render();return readFlight(flight);
  },
  advance(seconds){for(let i=0;i<Math.round(seconds/STEP);i++){tick(flight,input(),STEP);if(usesVisibleCombat(flight)&&i%4===0)render();}updateUI(true);render();return readFlight(flight);},
});
if(testing){
  const checks=document.createElement('section');checks.className='reset-actions';checks.id='qa-scenarios';
  const heading=document.createElement('h3'),note=document.createElement('p');heading.textContent='Scenario checks';note.className='small';note.textContent='Internal preview only. Each scenario starts a live flight. Use Pause to inspect it.';
  checks.append(heading,note);
  for(const [label,run] of [
    ['QA: Klein entry',()=>window.arrowSpaceShiftTest.loadChapterTrial(8)],
    ['QA: Klein live/preview shots',()=>window.arrowSpaceShiftTest.loadManifoldPreviewTrial(8)],
    ['QA: K/P projective intrusion',()=>window.arrowSpaceShiftTest.loadManifoldPreviewTrial(17,2)],
    ['QA: K+P hybrid preview',()=>window.arrowSpaceShiftTest.loadManifoldPreviewTrial(17,3)],
    ['QA: Drive warning',()=>window.arrowSpaceShiftTest.loadDriveWarningTrial()],
    ['QA: Relay recovery',()=>window.arrowSpaceShiftTest.loadBossRecoveryTrial()],
    ['QA: Curvature Seed recovery',()=>window.arrowSpaceShiftTest.loadBossRecoveryTrial(26)],
    ['QA: Stage 7',()=>window.arrowSpaceShiftTest.loadChapterTrial(6)],
    ['QA: Projective Ecology',()=>window.arrowSpaceShiftTest.loadChapterTrial(18)],
    ['QA: Echo Capture',()=>window.arrowSpaceShiftTest.loadChapterTrial(19)],
    ['QA: Curvature Gate',()=>window.arrowSpaceShiftTest.loadChapterTrial(26)],
    ['QA: Fleet Foundry',()=>window.arrowSpaceShiftTest.loadFoundryTrial(false)],
    ['QA: Aftwing flight',()=>window.arrowSpaceShiftTest.loadFoundryTrial(true)],
  ]){
    const button=document.createElement('button');button.type='button';button.textContent=label;
    button.addEventListener('click',()=>{shell.dialogs.options.close();run();qaPlayback=true;canvas.focus({preventScroll:true});});checks.append(button);
  }
  shell.dialogs.options.querySelector('.dialog-content').append(checks);
}
noteChapterReached(flight);resize();updateUI(true);requestAnimationFrame(frame);

