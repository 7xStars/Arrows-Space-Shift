import { addFold, removeFold, metricAt, spaceDistance, advanceThroughSpace } from './space.js';
import {OPERATIONS,EFFECT_AXES,roster,commonCounters,auditTournament,activeSourceSide,seedLabel,loadout,equipSeed,upgradeModes,collectDrop,makeDrop,WARP_RADIUS} from './upgrades.js';
import { createFlight, tick, readFlight, recordEvent, targetOpen, ENCOUNTERS, STEP, ROUTE_LENGTH } from './simulation.js';
import {projectInView,usesVisibleCombat,inCombatView,combatReady,presentEnemy,ENTRY_TIME,campaignScale} from './combat-view.js';
import {CHAPTERS,isCampaign,isBoss,isKleinRoute,isTutorial,isScrollingLevel,chapter,continueCampaign,retryCampaign,enterChapter,arenaY,arenaZ} from './campaign.js';
import {mountInterface} from './interface.js';
import {PixelArt,enemyArt} from './pixel-art.js';
import {KLEIN_BOUNDS} from './klein.js';

const $ = id => document.getElementById(id);
const canvas = $('space'), ctx = canvas.getContext('2d');
const testing = new URLSearchParams(location.search).get('test') === '1';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const keys = new Set();
let flight = createFlight('campaign'), fireToggle = false;
const attempts=[];
let attemptRecorded=false;
let attemptPrediction='';
let width = 900, height = 740, lastFrame = 0, accumulator = 0;
let oldPhase = '', oldStack = null, oldEvent = '', sound = false, audio;
let flash = 0, hudClock = 0;
let inventorySignature='';
const shell=mountInterface({pause,phase:()=>flight.phase,development:testing||new URLSearchParams(location.search).has('lab')});
const pixelArt=new PixelArt();pixelArt.load().then(()=>{updateUI(true);render();});
function viewState(){return {width,height,topInset:document.querySelector('.viewport-dock').getBoundingClientRect().height+16};}

function tone(frequency, duration = 0.08) {
  if (!sound) return;
  try {
    audio ||= new AudioContext();
    if (audio.state !== 'running') return;
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.6, audio.currentTime + duration);
    gain.gain.setValueAtTime(0.04, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(); oscillator.stop(audio.currentTime + duration);
  } catch { sound = false; $('sound').textContent = 'Sound unavailable'; }
}

function notify(message) { flight.lastEvent = message; updateUI(true); }
function fold() {
  if (flight.phase !== 'running') return;
  if(isTutorial(flight)){notify('Level 0 teaches movement and firing. Folding starts in Level 1.');return;}
  if (addFold(flight)) { recordEvent(flight,'fold',{fields:flight.fields.length,countdown:flight.countdown});flash = 0.32; tone(340, 0.2); notify('Fold added. Both sides’ shots accelerate inside it.'); }
  else notify(`${flight.maxFolds} field${flight.maxFolds===1?' is':'s are'} active. Unfold before you add another.`);
}
function unfold() {
  if (flight.phase !== 'running') return;
  if (removeFold(flight)) { recordEvent(flight,'unfold',{fields:flight.fields.length,countdown:flight.countdown});flash = 0.22; tone(190, 0.2); notify('Latest fold removed. Both sides’ shots slow there.'); }
  else notify('Space is already open.');
}
function clearInput() { keys.clear(); fireToggle = false; }
function retainExplanation(){if(attemptRecorded && attempts.length)attempts.at(-1).explanation=$('explanation').value;}
function start(mode = flight.mode, encounterIndex=0) {
  retainExplanation();attemptPrediction=$('prediction').value;$('explanation').value='';
  clearInput(); flight = createFlight(mode,{bonusEnabled:$('bonus-enabled').checked,encounterIndex}); flight.phase = 'running';
  flight.view=viewState();
  attemptRecorded=false;
  $('mode').value=mode;
  flight.lastEvent = flight.encounter ? flight.encounter.goal : upgradeModes.includes(mode)?'Collect a seed. Check its accepted side before the shot arrives.':mode === 'space' ? 'Space-only test. Compare the grid before and after a fold.' : 'Reference route started. Fly through the openings.';
  if(isCampaign(flight))flight.lastEvent=chapter(flight).goal;
  recordEvent(flight,'start',{mode,encounterIndex:flight.encounterIndex,bonusEnabled:flight.bonusEnabled});
  accumulator = 0; oldPhase = ''; oldStack = null; updateUI(true); canvas.focus({preventScroll:true});
}
function pause(reason = 'Flight paused.') {
  if (flight.phase !== 'running') return;
  flight.phase = 'paused'; clearInput(); notify(reason); tone(150);
}
function resume() { flight.phase = 'running'; clearInput(); accumulator = 0; notify('Flight resumed.'); canvas.focus({preventScroll:true}); }
function restart() {
  retainExplanation();
  if($('mode').value==='campaign'&&isCampaign(flight)&&flight.phase!=='ready'){
    clearInput();retryCampaign(flight);attemptRecorded=false;oldPhase='';oldStack=null;accumulator=0;updateUI(true);canvas.focus({preventScroll:true});return;
  }
  clearInput(); flight = createFlight($('mode').value,{bonusEnabled:$('bonus-enabled').checked}); accumulator = 0; oldPhase = ''; oldStack = null;attemptRecorded=false;
  flight.view=viewState();
  updateUI(true);
}

$('primary').addEventListener('click', () => {
  if(flight.phase==='paused'){resume();return;}
  if(isCampaign(flight)&&flight.phase==='cleared'){advanceChapter();return;}
  if(isCampaign(flight)&&flight.phase==='lost'){restart();return;}
  const index=flight.encounter ? flight.phase==='won' ? (flight.encounterIndex+1)%ENCOUNTERS.length : flight.encounterIndex : 0;
  start(flight.mode,index);
});
function advanceChapter(){clearInput();if(continueCampaign(flight)){attemptRecorded=false;oldPhase='';oldStack=null;accumulator=0;updateUI(true);canvas.focus({preventScroll:true});}}
$('new-run').addEventListener('click',()=>shell.confirmReset(()=>{
  retainExplanation();clearInput();flight=createFlight('campaign',{bonusEnabled:$('bonus-enabled').checked});flight.view=viewState();
  $('mode').value='campaign';attemptRecorded=false;oldPhase='';oldStack=null;accumulator=0;updateUI(true);
},true));
$('practice').addEventListener('click', () => start(flight.mode === 'space' ? 'flight' : 'space'));
$('restart').addEventListener('click', ()=>shell.confirmReset(restart));
$('mode').addEventListener('change',restart);
$('bonus-enabled').addEventListener('change',restart);
$('save-results').addEventListener('click',()=>{
  retainExplanation();
  const payload={game:'Arrow Space Shift',version:'0.14.0',recordedAt:new Date().toISOString(),attempts,
    current:readFlight(flight),prediction:$('prediction').value,explanation:$('explanation').value};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='arrow-space-shift-playtest.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('pause').addEventListener('click', () => flight.phase === 'paused' ? resume() : pause());
$('fire').addEventListener('click', () => { if (flight.phase === 'running') { fireToggle = !fireToggle; updateUI(true); } });
$('sound').addEventListener('click', async () => {
  sound = !sound;
  if (sound) { try { audio ||= new AudioContext(); await audio.resume(); } catch { sound = false; } }
  $('sound').textContent = sound ? 'Sound on' : 'Sound off';
  $('sound').setAttribute('aria-pressed', String(sound)); tone(440);
});
const actionKeys = new Set(['ShiftLeft','ShiftRight','KeyP','Escape','Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown']);
window.addEventListener('keydown', event => {
  if(document.querySelector('dialog[open]'))return;
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
window.addEventListener('keyup', event => keys.delete(event.code));
window.addEventListener('blur', () => { clearInput(); pause('Focus lost. Resume when you are ready.'); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { clearInput(); pause('Tab hidden. Resume when you are ready.'); } });
canvas.addEventListener('pointerdown', () => canvas.focus({preventScroll:true}));
function input() {
  return { horizontal: Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft')),
    throttle: testing||new URLSearchParams(location.search).has('lab')?Number(keys.has('ArrowUp')) - Number(keys.has('ArrowDown')):0,
    fire: fireToggle || keys.has('Space') };
}

for(const [id,slot] of [['slot-one',0],['slot-two',1]])$(id).addEventListener('click',()=>{flight.selectedSlot=slot;updateUI(true);});
$('inventory').addEventListener('click',event=>{
  const button=event.target.closest('button[data-seed]');if(!button)return;
  equipSeed(flight,button.dataset.seed);updateUI(true);
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
  const s = flight, factor = 1 / metricAt(s.z, s.fields);
  $('progress-label').textContent = s.encounter ? `Encounter ${s.encounterIndex+1} / 3` : `${Math.floor(s.z).toLocaleString('en-US')} / 8,400`;
  $('route').value = s.encounter ? (s.encounterIndex+(s.phase==='won'?1:0))/3*ROUTE_LENGTH : s.z; $('hull').textContent = `${s.hull} / 5`;
  $('time').textContent = s.countdown>0 && s.phase!=='ready'?`In ${Math.ceil(s.countdown)} s`:`${s.time.toFixed(2)} s`; $('score').textContent = s.score;
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
  $('debt').textContent=`Stored damage due: ${s.debts.filter(d=>d.target==='player').reduce((n,d)=>n+d.amount,0)}`;
  const inventoryState=JSON.stringify([s.inventory.map(seed=>seed.key),s.equipped.map(seed=>seed?.key),s.selectedSlot,s.slotCount]);
  if(inventoryState!==inventorySignature){
    inventorySignature=inventoryState;
    $('slot-one').textContent=`Slot 1: ${s.equipped[0]?seedLabel(s.equipped[0]):'empty'}`;
    $('slot-two').textContent=s.slotCount===2?`Slot 2: ${s.equipped[1]?seedLabel(s.equipped[1]):'empty'}`:'Slot 2: opens at 7-Paley';
    $('slot-two').disabled=s.slotCount<2;
    $('slot-one').setAttribute('aria-pressed',String(s.selectedSlot===0));$('slot-two').setAttribute('aria-pressed',String(s.selectedSlot===1));
    $('inventory').replaceChildren(...s.inventory.map(seed=>{const button=document.createElement('button');button.type='button';button.dataset.seed=seed.key;button.textContent=seedLabel(seed);button.setAttribute('aria-pressed',String(s.equipped[s.selectedSlot]?.key===seed.key));return button;}));
    $('inventory-note').textContent=s.inventory.length?'Select a slot. Then select a collected seed.':'Collect seeds during flight. They remain in your inventory.';
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
  $('factor').textContent = `${factor}×`; $('thrust').textContent = s.thrust.toFixed(0);
  $('speed').textContent = (s.thrust * factor).toFixed(0); $('metric').textContent = (1 / factor).toFixed(3);
  $('factor-note').textContent = factor === 1 ? 'The ship is outside a fold field.' : `The ship covers ${factor} route units for each thrust unit.`;
  $('fold-count').textContent = `${s.fields.length} / ${s.maxFolds}`;
  $('field-caption').textContent = factor > 1 ? `Inside compressed space · ${factor}× route speed` : s.fields.length ? 'Fold fields ahead or behind the ship' : 'Space is open';
  $('fire').setAttribute('aria-pressed', String(fireToggle));
  $('fire').firstElementChild.textContent = fireToggle ? 'Fire on' : 'Fire off';
  $('fold').classList.toggle('available', s.phase === 'running' && !isTutorial(s) && s.fields.length < s.maxFolds);
  $('unfold').classList.toggle('available', s.phase === 'running' && s.fields.length > 0);
  $('fire').disabled = s.phase !== 'running';
  $('pause').disabled = !['running','paused'].includes(s.phase);
  $('pause').textContent = s.phase === 'paused' ? 'Resume' : 'Pause';
  const signature = s.fields.map(f => `${f.id}:${s.z < f.start ? 'ahead' : s.z < f.end ? 'inside' : 'passed'}`).join('|');
  if (signature !== oldStack) {
    oldStack = signature;
    $('fold-stack').replaceChildren();
    if (!s.fields.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'No active fields.'; $('fold-stack').append(li); }
    s.fields.forEach((f, i) => {
      const li = document.createElement('li'); li.textContent = `Field ${f.id}${i === s.fields.length - 1 ? ' · latest' : ''}`;
      const small = document.createElement('small'); small.textContent = `${Math.round(f.start)}–${Math.round(f.end)} · ${s.z < f.start ? 'Ahead' : s.z < f.end ? 'Inside' : 'Passed'} · Shots ×2`;
      li.append(small); $('fold-stack').append(li);
    });
  }
  if (s.lastEvent !== oldEvent) { oldEvent = s.lastEvent; $('event').textContent = s.lastEvent; }
  if(s.phase==='running' && s.countdown>0)$('flight-state').textContent=`Launch in ${Math.ceil(s.countdown)} s`;
  else if(s.phase==='running')$('flight-state').textContent=s.encounter?'Timing course':upgradeModes.includes(s.mode)?s.mode==='warp-lab'?'Position warp lab':['Introduction · 1','3-Paley','7-Paley'][s.stage]:s.mode==='space'?'Space-only test':'Reference route';
  if (s.phase !== oldPhase) {
    oldPhase = s.phase;
    $('overlay').hidden = s.phase === 'running';
    $('flight-state').textContent = ({ready:'Ready for flight',running:s.mode === 'space' ? 'Space-only test' : 'Flight in progress',paused:'Flight paused',won:'Transit complete',lost:'Hull lost'})[s.phase];
    if (s.phase === 'ready') {
      $('overlay-title').textContent = s.encounter?s.encounter.name:s.mode==='warp-lab'?'Choose the incoming side.':upgradeModes.includes(s.mode)?['One, then three, then seven.','Test the three-operation cycle.','Test seven operations.'][s.stage]:'Fold the distance.';
      $('overlay-text').textContent = s.encounter?s.encounter.brief:upgradeModes.includes(s.mode)?'A right seed accepts right-side shots with one fold. A left seed accepts left-side shots. Unfold to reverse those sides. Other shots continue normally. Enemies use and drop upgrades.':'Fold for faster shots. Enemy shots accelerate too. Unfold to gain reaction time.';
      $('primary').textContent = s.encounter?'Start encounter 1':s.mode==='warp-lab'?'Start warp lab':upgradeModes.includes(s.mode)?'Start upgrade flight':s.mode === 'space' ? 'Start space test' : 'Start reference route';
    } else if (s.phase === 'paused') {
      $('overlay-title').textContent = 'Flight paused.'; $('overlay-text').textContent = s.lastEvent;
      $('primary').textContent = 'Resume flight';
    } else if (s.phase === 'won' || s.phase === 'lost') {
      $('overlay-title').textContent = s.encounter ? s.phase==='won' ? s.encounterIndex===2?'Timing course complete.':'Encounter cleared.' : 'Try the timing again.' : s.phase === 'won' ? 'Transit complete.' : 'Hull lost.';
      $('overlay-text').textContent = s.encounter?`${s.lastEvent} Time: ${s.time.toFixed(2)} s. Score: ${s.score}. Bonus ${s.bonusEnabled?'on':'off'}.`:`${s.z.toFixed(0)} route units in ${s.time.toFixed(1)} seconds. ${s.foldsUsed} folds made. Score: ${s.score}.`;
      $('primary').textContent = s.encounter ? s.phase==='won' ? s.encounterIndex===2?'Repeat course':`Start encounter ${s.encounterIndex+2}` : 'Retry encounter' : 'Fly again';
      if(!attemptRecorded){
        attemptRecorded=true;
        attempts.push({mode:s.mode,encounterIndex:s.encounterIndex ?? null,result:s.phase,time:s.time,hull:s.hull,score:s.score,bonusEnabled:s.bonusEnabled,
          events:s.events.map(e=>({...e})),prediction:attemptPrediction,explanation:''});
        const li=document.createElement('li');li.textContent=`${s.encounter?s.encounter.name:s.mode}: ${s.phase==='won'?'cleared':'failed'} · ${s.time.toFixed(2)} s · bonus ${s.bonusEnabled?'on':'off'}`;$('attempts').append(li);
      }
      if (s.phase === 'won') tone(580, 0.4);
    }
    $('practice').hidden = s.phase === 'paused' || !!s.encounter || upgradeModes.includes(s.mode);
    $('overlay-note').textContent=s.encounter?'One active fold. A two-second countdown starts each attempt. Use Restart to change the score comparison.':upgradeModes.includes(s.mode)?'Space fires straight ahead. Align the ship with a visible enemy. An entering enemy becomes active after a short delay.':'Use a keyboard. The space-only test has no enemies.';
    $('practice').textContent = s.mode === 'space' ? 'Start reference route' : 'Test space only';
    $('overlay-note').hidden = s.phase === 'paused';
    if (s.phase !== 'running' && s.phase !== 'ready') $('primary').focus({preventScroll:true});
  }
  updateCampaignUI();
  $('primary').disabled=!pixelArt.image&&!pixelArt.error;
  $('space-status').textContent=`Space ${factor}× · Folds ${s.fields.length}/${s.maxFolds}`;
  const debt=s.debts.filter(d=>d.target==='player').reduce((n,d)=>n+d.amount,0);
  $('live-debt').textContent=`Stored damage: ${debt}`;$('live-debt').classList.toggle('has-debt',debt>0);
}

function updateCampaignUI(){
  const s=flight,on=isCampaign(s);$('campaign-panel').hidden=!on;$('new-run').hidden=!on;
  if(!on)$('route-marker').hidden=true;
  $('tutorial-prompt').hidden=!isTutorial(s);
  $('campaign-help').hidden=!on;$('combat-loadout').hidden=!on;
  $('restart').textContent=on?'Retry section':'Restart';
  $('thrust-control').textContent=on?'No action':'Change thrust';
  $('thrust-label').textContent=on?isScrollingLevel(s)?'Ship speed':'Vertical speed':'Thrust';
  if(!on)return;
  const c=chapter(s),boss=isBoss(s),tutorial=isTutorial(s),scrolling=isScrollingLevel(s);
  $('route-marker').hidden=boss||tutorial;
  if(!boss&&!tutorial&&$('route-marker').dataset.stage!==String(c.number-1)){$('route-marker').dataset.stage=String(c.number-1);$('route-marker').src=new URL(`../assets/crossing/stage.${c.number-1}.png`,import.meta.url).href;}
  $('tutorial-prompt').hidden=!tutorial;
  if(tutorial){
    const movement=s.campaign.movement;
    const text=s.campaign.lesson==='move'?`Move left and right: ${[['left','←'],['right','→']].map(([key,label])=>`${label} ${movement[key]>=24?'done':'not yet'}`).join(' · ')}`:s.phase==='cleared'?'Target hit. Movement and firing complete.':'Align with the target. Hold Space to fire.';
    if($('tutorial-prompt').textContent!==text)$('tutorial-prompt').textContent=text;
  }
  $('combat-loadout').textContent=`Facing ${s.facing===1?'↑':'↓'} · ${loadout(s).map(seed=>`${seedLabel(seed)} accepts ${activeSourceSide(s,seed)===1?'right':'left'}`).join(' / ')}`;
  $('campaign-name').textContent=boss?'Final battle · The Klein Fleet':`Level ${c.number} / 8 · ${c.name}`;
  $('campaign-goal').textContent=tutorial?s.campaign.lesson==='move'?'Use Left and Right to move the ship.':'Align with the training target. Hold Space to hit it.':c.goal;$('campaign-hint').textContent=c.hint;
  const alive=s.enemies.filter(e=>e.hp>0&&!e.escaped);
  $('campaign-objective').textContent=tutorial?s.campaign.lesson==='move'?'1 / 2 · Move':'2 / 2 · Fire':boss?`Fleet hull: ${alive.reduce((n,e)=>n+e.hp,0)} · ${alive.length} ships · ${s.campaign.wraps} edge crossings`:`Route ${Math.min(c.routeLength,Math.floor(s.z))} / ${c.routeLength} · ${alive.filter(e=>inCombatView(s,e)).length} carriers${c.calm?` · ${s.asteroids.filter(a=>inCombatView(s,a)).length} asteroids`:''} in view`;
  $('campaign-route').textContent=`${tutorial?'●':'✓'} 0  `+CHAPTERS.map((node,i)=>`${i===s.campaign.index?'●':i<s.campaign.index?'✓':'○'} ${node.number||'Boss'}`).join('  ');
  $('progress-label').textContent=boss?'Final battle':`Level ${c.number} / 8`;
  $('route').value=scrolling?Math.min(1,s.z/c.routeLength)*ROUTE_LENGTH:(s.campaign.index+(s.phase==='won'?1:0))/CHAPTERS.length*ROUTE_LENGTH;
  $('upgrade-title').textContent=`${['One operation','Three operations','Seven operations'][s.stage]} · facing ${s.facing===1?'front':'back'}`;
  $('stage-guide').textContent=c.hint;
  $('flight-state').textContent=s.phase==='running'?`${boss?'Boss':`Level ${c.number}`} · ${c.name}`:s.phase==='cleared'?'Level complete':s.phase==='won'?'Campaign complete':s.phase==='lost'?'Retry this section':s.phase==='paused'?'Paused':'Ready for campaign';
  $('practice').hidden=true;$('overlay-note').textContent='Controls are listed on the game page. Progress lasts until the page is closed or reloaded.';
  if(tutorial)$('overlay-note').textContent='Folding starts in Level 1. Use a keyboard.';
  $('overlay').hidden=s.phase==='running';
  if(s.phase==='ready'){
    $('overlay-title').textContent='Arrow Space Shift';$('overlay-text').textContent='Start with Level 0. Learn to move and fire before the eight routes and final battle. Use a keyboard. Guide and equipment panels pause play.';$('primary').textContent='Start campaign';
  }else if(s.phase==='cleared'){
    $('overlay-title').textContent=`${c.name} complete.`;$('overlay-text').textContent='Your equipment and score will carry forward. The next section starts with full hull.';$('primary').textContent=CHAPTERS[s.campaign.index+1]?.kind==='boss'?'Enter the final battle':`Start Level ${CHAPTERS[s.campaign.index+1]?.number}`;
  }else if(s.phase==='lost'){
    $('overlay-title').textContent='Try this section again.';$('overlay-text').textContent=`${s.lastEvent} Retry from the section checkpoint. Earlier progress remains available.`;$('primary').textContent='Retry section';
  }else if(s.phase==='won'){
    $('overlay-title').textContent='The fleet is destroyed.';$('overlay-text').textContent=`Campaign complete. Score: ${s.score}. Edge crossings: ${s.campaign.wraps}.`;$('primary').textContent='Start a new campaign';
  }
}

function resize() {
  const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  width = r.width; height = r.height;
  flight.view={width,height,topInset:document.querySelector('.viewport-dock').getBoundingClientRect().height+16};
  document.querySelector('.viewport').style.setProperty('--dock-height',`${flight.view.topInset}px`);
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
const viewObserver=new ResizeObserver(resize);viewObserver.observe(canvas);viewObserver.observe(document.querySelector('.viewport-dock'));
function project(x,z) {
  return projectInView(flight,x,z);
}
function line(x1,y1,x2,y2,color,lineWidth=1) { ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.stroke(); }
function polygon(points,fill,stroke) {
  ctx.beginPath(); points.forEach(([x,y],i)=>i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();} if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}
}
function drawShip(x,y,enemy=false,strong=false,facing=enemy?-1:1,artId=null) {
  const id=artId||(enemy?'enemy.gunner':'player.arrow');
  const oriented=enemy?(facing===1?`${id}-up`:id):facing===-1?'player.arrow-down':id;
  if(pixelArt.draw(ctx,oriented,x,y,enemy?typeof strong==='number'?Math.round(strong*3):3:3))return;
  ctx.save();ctx.translate(x,y);
  if(facing===-1)ctx.rotate(Math.PI);
  const color = enemy ? '#ffb8a0' : '#7ae8e0';
  const size = enemy ? typeof strong==='number'?strong:strong?1.1:0.85 : 1;
  ctx.scale(size,size);
  if (!enemy) { const flame = reducedMotion ? 14 : 11 + Math.sin(flight.time * 40) * 5;
    polygon([[-5,14],[0,14+flame],[5,14]],'#b8a6ed'); }
  polygon([[0,-23],[-9,-2],[-23,15],[-8,11],[0,18],[8,11],[23,15],[9,-2]],enemy?'#4d3345':'#254657',color);
  polygon([[0,-13],[-4,3],[0,8],[4,3]],color);
  line(-10,5,-18,12,color); line(10,5,18,12,color);
  ctx.restore();
}
function render() {
  ctx.fillStyle = pixelArt.manifest?.palette.D||'#0b1528'; ctx.fillRect(0,0,width,height);
  const s = flight,origin=isCampaign(s)?s.cameraZ:s.z,topZ = advanceThroughSpace(origin,1300,s.fields);
  for(let i=0;i<95;i++){
    const baseZ=i*173.57, z=baseZ + Math.floor(origin / 16500)*16500;
    const p=project(Math.sin(i*71.19)*390,z < origin-100 ? z+16500 : z);
    if(p.y<0 || p.y>height)continue;
    ctx.fillStyle=i%4===0?'#8ca6c5':'#3c5271';ctx.fillRect(p.x,p.y,i%4===0?2:1,2);
  }
  for(let x=-320;x<=320;x+=80){const a=project(x,origin-200),b=project(x,topZ);line(a.x,a.y,b.x,b.y,'#283c574f');}
  for(let z=Math.floor(origin/100)*100;z<topZ;z+=100){const p=project(0,z);line(width*.06,p.y,width*.94,p.y,'#35496766');}
  if(isBoss(s)||isKleinRoute(s))drawKleinEdges(s);
  for(const f of s.fields){
    const a=project(0,f.start),b=project(0,f.end);
    if(a.y<-100 || b.y>height+100)continue;
    ctx.fillStyle='#b8a6ed0d';ctx.fillRect(0,b.y,width,a.y-b.y);
    for(const [p,label] of [[a,`Fold ${f.id} · shots ×2`],[b,`End ${f.id}`]]){
      if(p.y<65 || p.y>height-40)continue;
      const shift = reducedMotion ? 0 : Math.sin(s.time*2+f.id)*3;
      ctx.beginPath();ctx.moveTo(0,p.y);ctx.bezierCurveTo(width*.3,p.y-12-shift,width*.7,p.y+12+shift,width,p.y);
      ctx.strokeStyle='#b8a6ed';ctx.lineWidth=1.2;ctx.stroke();
      ctx.fillStyle='#c3b5f0';ctx.font='11px Segoe UI';ctx.fillText(label,16,p.y-9);
    }
  }
  for(const rock of s.asteroids){
    if(rock.hp<=0||!inCombatView(s,rock)){rock.presented=false;continue;}rock.presented=true;
    const p=project(rock.x,rock.z),rx=rock.radius*width/800,ry=rock.radius*(isCampaign(s)?campaignScale(s):(height-150)/1050);
    const rockId=rock.hp<rock.maxHp?'asteroid.break-0':rock.radius>=27?'asteroid.large':rock.radius>=23?'asteroid.medium':'asteroid.small';
    const rockScale=rockId==='asteroid.large'?2:rockId==='asteroid.small'?5:3;
    if(pixelArt.draw(ctx,rockId,p.x,p.y,rockScale)){if(rock.hitUntil>s.time)pixelArt.draw(ctx,'effect.absorb',p.x,p.y,3);continue;}
    const rotation=rock.rotation+(reducedMotion?0:s.time*.12),points=Array.from({length:9},(_,i)=>{
      const angle=rotation+i/9*Math.PI*2,size=.82+.14*Math.sin(rock.shape+i*8.7);
      return [p.x+Math.cos(angle)*rx*size,p.y+Math.sin(angle)*ry*size];
    });
    polygon(points,'#3c4550',rock.hitUntil>s.time?'#fff3dc':'#c4bdac');
    line(p.x-rx*.2,p.y-ry*.4,p.x+rx*.25,p.y+ry*.3,'#737b82',1);
    if(rock.hp<rock.maxHp){line(p.x,p.y-ry*.6,p.x-rx*.2,p.y+ry*.3,'#c4bdac',1);line(p.x-rx*.2,p.y+ry*.3,p.x+rx*.3,p.y+ry*.5,'#c4bdac',1);}
  }
  for(const drop of s.drops){
    if(drop.collected)continue;const p=project(drop.x,drop.z);
    if(p.y<65 || p.y>height+30)continue;
    const color=OPERATIONS[drop.type].color;
    polygon([[p.x,p.y-13],[p.x+13,p.y],[p.x,p.y+13],[p.x-13,p.y]],'#392f54',color);
    ctx.fillStyle=color;ctx.font='11px Segoe UI';ctx.textAlign='center';ctx.fillText(`${drop.polarity===1?'R':'L'} · ${OPERATIONS[drop.type].name}`,p.x,p.y-23);ctx.textAlign='left';
  }
  for(const [index,seed] of loadout(s).entries()){
    const side=activeSourceSide(s,seed),p=project(s.x+side*90,advanceThroughSpace(s.z,WARP_RADIUS,s.fields));
    const color=OPERATIONS[seed.type].color;
    polygon([[p.x-side*9,p.y-7],[p.x,p.y],[p.x-side*9,p.y+7]],null,color);
    if(width>500){ctx.fillStyle=color;ctx.font='11px Segoe UI';ctx.textAlign='center';ctx.fillText(`${index+1}: ${OPERATIONS[seed.type].code} · ${side===1?'right':'left'}`,p.x,p.y-14-index*14);ctx.textAlign='left';}
  }
  for(const e of s.events.slice(-16)){
    if(e.type!=='operation'||e.typeId!==0||s.time-e.time>.18)continue;
    const a=project(e.from.x,e.from.z),b=project(e.to.x,e.to.z);ctx.setLineDash([3,5]);line(a.x,a.y,b.x,b.y,'#b8a6ed80');ctx.setLineDash([]);
  }
  for(const gate of s.gates){
    const p=project(0,gate.z);if(p.y<60 || p.y>height+30)continue;
    const a=project(gate.gap-gate.width/2,gate.z),b=project(gate.gap+gate.width/2,gate.z);
    ctx.fillStyle='#ecd28312';ctx.fillRect(0,p.y-7,a.x,14);ctx.fillRect(b.x,p.y-7,width-b.x,14);
    line(0,p.y,a.x,p.y,'#ecd283',3);line(b.x,p.y,width,p.y,'#ecd283',3);
    line(a.x,p.y-12,a.x,p.y+12,'#ecd283',3);line(b.x,p.y-12,b.x,p.y+12,'#ecd283',3);
    ctx.fillStyle='#ecd283';ctx.font='10px Segoe UI';ctx.textAlign='center';ctx.fillText('Opening',(a.x+b.x)/2,p.y-12);ctx.textAlign='left';
  }
  if(s.encounterIndex===2 && !s.encounter.hit){
    const a=project(s.x-220,s.z+360),b=project(s.x+220,s.z+360);
    ctx.setLineDash([5,5]);line(a.x,a.y,b.x,b.y,'#ffb8a080',2);ctx.setLineDash([]);
    ctx.fillStyle='#ffb8a0';ctx.font='11px Segoe UI';ctx.textAlign='center';ctx.fillText('Guard aims at this lane after the hit',(a.x+b.x)/2,a.y-12);ctx.textAlign='left';
  }
  for(const enemy of s.enemies){
    if(enemy.hp<=0 || enemy.escaped || enemy.stage>s.stage)continue;const p=project(enemy.x,enemy.z);
    if(usesVisibleCombat(s)?inCombatView(s,enemy):p.y>65 && p.y<height+40){
      presentEnemy(s,enemy);enemy.maxHp??=enemy.hp;
      ctx.save();if(usesVisibleCombat(s)&&!combatReady(s,enemy))ctx.globalAlpha=.45;
      const artId=enemyArt(enemy,isKleinRoute(s));
      drawShip(p.x,p.y,true,enemy.boss?(enemy.name==='Core'?1.6:1.1):enemy.hp>2,isCampaign(s)?enemy.facing:-1,artId);
      ctx.restore();
      if(usesVisibleCombat(s)){
        const ready=combatReady(s,enemy);ctx.fillStyle='#344760';ctx.fillRect(p.x-20,p.y+25,40,3);
        ctx.fillStyle=ready?'#ffb8a0':'#b8a6ed';ctx.fillRect(p.x-20,p.y+25,40*(ready?Math.max(0,enemy.hp/enemy.maxHp):Math.min(1,(enemy.visibleFor||0)/ENTRY_TIME)),3);
        if(!ready){ctx.fillStyle='#b8a6ed';ctx.font='10px Segoe UI';ctx.textAlign='center';ctx.fillText('Entering',p.x,p.y+42);ctx.textAlign='left';}
        if(!ready&&enemy.loopCount)pixelArt.draw(ctx,'return.entry',p.x,p.y-48,1);
        if(ready&&!enemy.boss)pixelArt.draw(ctx,`health.${Math.min(4,Math.max(1,Math.ceil(enemy.hp)))}`,p.x,p.y-30,2);
      }
      if(enemy.hitUntil>s.time){ctx.beginPath();ctx.arc(p.x,p.y,28,0,Math.PI*2);ctx.strokeStyle='#fff3dc';ctx.stroke();}
      if(enemy.dropsUpgrade||isTutorial(s)){ctx.fillStyle='#d8c7ff';ctx.font='11px Segoe UI';ctx.textAlign='center';ctx.fillText([enemy.name,loadout(enemy).map(seed=>`${OPERATIONS[seed.type].code}${seed.polarity===1?'R':'L'}`).join(' / ')].filter(Boolean).join(' · '),p.x,p.y-(enemy.boss?48:34));ctx.textAlign='left';}
      if(enemy.shield){
        const open=targetOpen(s);ctx.strokeStyle=open?'#7ae8e0':'#ecd283';ctx.lineWidth=3;
        ctx.setLineDash(open?[3,7]:[]);ctx.beginPath();ctx.arc(p.x,p.y,34,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle=open?'#7ae8e0':'#ecd283';ctx.font='12px Segoe UI';ctx.textAlign='center';ctx.fillText(open?'Target open':'Shield closed',p.x,p.y+52);ctx.textAlign='left';
      }
    }
  }
  for(const effect of s.effects){
    const p=project(effect.x,effect.z);if(p.y<90||p.y>height-35)continue;
    const age=(s.time-effect.start)/(effect.until-effect.start),defeat=effect.type==='defeat'||effect.type==='asteroid';
    if(effect.type==='asteroid'){const frame=pixelArt.animationFrame('asteroid.break',(s.time-effect.start)*1000);if(frame)pixelArt.draw(ctx,frame,p.x,p.y,3);}
    ctx.save();ctx.globalAlpha=1-age;ctx.strokeStyle=effect.color||(defeat?'#ecd283':'#fff3dc');ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(p.x,p.y,reducedMotion?22:8+age*(defeat?40:20),0,Math.PI*2);ctx.stroke();
    if(defeat&&effect.points){ctx.fillStyle='#ecd283';ctx.font='13px Segoe UI';ctx.textAlign='center';ctx.fillText(`+${effect.points}`,p.x,p.y-35);ctx.textAlign='left';}
    ctx.restore();
  }
  for(const shot of s.shots){const p=project(shot.x,shot.z);const boost=1/metricAt(shot.z,s.fields);if(p.y>55 && p.y<height){if(boost>1)line(p.x,p.y,p.x,p.y+Math.min(48,5*boost),'#FFE9A0',2);if(!pixelArt.draw(ctx,'shot.player',p.x,p.y,2))line(p.x,p.y-9,p.x,p.y+Math.min(48,5*boost),'#7ae8e0',boost>1?3:2);}}
  for(const shot of s.enemyShots){
    const p=project(shot.x,shot.z);const boost=1/metricAt(shot.z,s.fields);
    if(p.y>55 && p.y<height){
      if(shot.salvo){const a=project(shot.x-shot.halfWidth,shot.z),b=project(shot.x+shot.halfWidth,shot.z);ctx.fillStyle='#ffb8a030';ctx.fillRect(a.x,p.y-15,b.x-a.x,30);line(a.x,p.y,b.x,p.y,'#ffb8a0',5);line(a.x,p.y-18,a.x,p.y+18,'#ffb8a0',2);line(b.x,p.y-18,b.x,p.y+18,'#ffb8a0',2);ctx.fillStyle='#ffdfbb';ctx.font='11px Segoe UI';ctx.textAlign='center';ctx.fillText(`Salvo · shots ×${boost}`,p.x,p.y-24);ctx.textAlign='left';}
      else {const color=shot.payload?.length?OPERATIONS[shot.payload[0]].color:'#ffb8a0';if(boost>1)line(p.x,p.y-Math.min(48,7*boost),p.x,p.y,color,2);ctx.beginPath();ctx.arc(p.x,p.y,shot.damage>1?7:5,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();if(shot.payload?.length){ctx.fillStyle='#0b1528';ctx.font='8px Segoe UI';ctx.textAlign='center';ctx.fillText(OPERATIONS[shot.payload[0]].code,p.x,p.y+3);ctx.textAlign='left';}}
    }
  }
  const exit=project(0,isScrollingLevel(s)?chapter(s).routeLength:ROUTE_LENGTH);
  if((!isCampaign(s)||isScrollingLevel(s))&&exit.y>60 && exit.y<height){line(0,exit.y,width,exit.y,'#7ae8e0',2);ctx.fillStyle='#7ae8e0';ctx.textAlign='center';ctx.font='16px Bahnschrift';ctx.fillText(isScrollingLevel(s)?'End of level':'Exit',width/2,exit.y-15);ctx.textAlign='left';}
  const p=project(s.x,s.z);
  if(s.invulnerable<=0 || reducedMotion || Math.floor(s.time*10)%2===0)drawShip(p.x,p.y,false,false,s.facing);
  if(s.invulnerable>0){ctx.beginPath();ctx.arc(p.x,p.y,31,0,Math.PI*2);ctx.strokeStyle='#ffb8a080';ctx.stroke();}
  if(flash>0 && !reducedMotion){ctx.fillStyle=`rgba(184,166,237,${flash*.15})`;ctx.fillRect(0,0,width,height);}
  if(s.countdown>0 && s.phase==='running'){
    ctx.textAlign='center';ctx.fillStyle='#eaf2ff';ctx.font='48px Bahnschrift';ctx.fillText(Math.ceil(s.countdown),width/2,height*.5);
    ctx.font='14px Segoe UI';ctx.fillText('Get ready',width/2,height*.5+30);ctx.textAlign='left';
  }
}
function drawKleinEdges(s){
  const top=project(0,arenaZ(s,KLEIN_BOUNDS.top)).y,bottom=project(0,arenaZ(s,KLEIN_BOUNDS.bottom)).y;
  line(3,top,3,bottom,'#b8a6ed',2);line(width-3,top,width-3,bottom,'#b8a6ed',2);
  line(3,top,width-3,top,'#7ae8e0',2);line(3,bottom,width-3,bottom,'#7ae8e0',2);
  ctx.fillStyle='#7ae8e0';ctx.font='10px Segoe UI';ctx.textAlign='center';ctx.fillText('TOP ↔ BOTTOM',width/2,top+16);
  ctx.fillStyle='#b8a6ed';ctx.fillText('LEFT ↔ RIGHT · VERTICAL POSITION REVERSED',width/2,bottom-9);ctx.textAlign='left';
  pixelArt.draw(ctx,'edge.twist',12,(top+bottom)/2,1);pixelArt.draw(ctx,'edge.twist',width-12,(top+bottom)/2,1);
  for(const enemy of s.enemies){
    if(enemy.hp<=0||(isKleinRoute(s)&&!enemy.routeActive))continue;const y=arenaY(s,enemy.z);let destination=null;
    if(enemy.x>300&&enemy.driftX>0)destination={x:-380,y:KLEIN_BOUNDS.bottom+KLEIN_BOUNDS.top-y};
    else if(enemy.x< -300&&enemy.driftX<0)destination={x:380,y:KLEIN_BOUNDS.bottom+KLEIN_BOUNDS.top-y};
    else if(y>850&&enemy.driftY>0)destination={x:enemy.x,y:KLEIN_BOUNDS.bottom+35};
    else if(y<20&&enemy.driftY<0)destination={x:enemy.x,y:KLEIN_BOUNDS.top-35};
    if(!destination)continue;const p=project(destination.x,arenaZ(s,destination.y));
    ctx.strokeStyle='#ecd283';ctx.setLineDash([3,4]);ctx.beginPath();ctx.arc(p.x,p.y,13,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#ecd283';ctx.font='10px Segoe UI';ctx.textAlign='center';ctx.fillText('Return',Math.max(30,Math.min(width-30,p.x)),p.y+26);ctx.textAlign='left';
  }
}
function frame(now){
  const dt=lastFrame ? Math.min((now-lastFrame)/1000,0.1) : 0;lastFrame=now;
  if(!testing && flight.phase==='running'){
    accumulator+=dt;
    while(accumulator>=STEP){tick(flight,input(),STEP);accumulator-=STEP;}
  }
  flash=Math.max(0,flash-dt);hudClock+=dt;updateUI();render();requestAnimationFrame(frame);
}
window.arrowSpaceShift = Object.freeze({read:()=>readFlight(flight),results:()=>structuredClone(attempts),assets:()=>pixelArt.status()});
if(testing)window.arrowSpaceShiftTest=Object.freeze({
  start, restart, read:()=>readFlight(flight),
  loadChapterTrial(index=0){start('campaign');enterChapter(flight,index);flight.view=viewState();oldPhase='';oldStack=null;updateUI(true);render();return readFlight(flight);},
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
resize();updateUI(true);requestAnimationFrame(frame);

