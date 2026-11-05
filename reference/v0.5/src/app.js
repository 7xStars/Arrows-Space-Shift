import { addFold, removeFold, metricAt, spaceDistance, advanceThroughSpace } from './space.js';
import {OPERATIONS,EFFECT_AXES,roster,commonCounters,auditTournament,warpSide,rotateDisplacement,collectDrop,makeDrop,WARP_RADIUS} from './upgrades.js';
import { createFlight, tick, readFlight, recordEvent, targetOpen, ENCOUNTERS, STEP, ROUTE_LENGTH } from './simulation.js';

const $ = id => document.getElementById(id);
const canvas = $('space'), ctx = canvas.getContext('2d');
const testing = new URLSearchParams(location.search).get('test') === '1';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const keys = new Set();
let flight = createFlight('upgrades'), fireToggle = false;
const attempts=[];
let attemptRecorded=false;
let attemptPrediction='';
let width = 900, height = 740, lastFrame = 0, accumulator = 0;
let oldPhase = '', oldStack = null, oldEvent = '', sound = false, audio;
let flash = 0, hudClock = 0;

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
  attemptRecorded=false;
  $('mode').value=mode;
  flight.lastEvent = flight.encounter ? flight.encounter.goal : mode === 'upgrades'?'Destroy the first enemy. Collect its Position Warp seed.':mode==='warp-lab'?'Collect the seed before or after a fold. Compare the warp side.':mode === 'space' ? 'Space-only test. Compare the grid before and after a fold.' : 'Reference route started. Fly through the openings.';
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
  clearInput(); flight = createFlight($('mode').value,{bonusEnabled:$('bonus-enabled').checked}); accumulator = 0; oldPhase = ''; oldStack = null;attemptRecorded=false;
  updateUI(true);
}

$('primary').addEventListener('click', () => {
  if(flight.phase==='paused'){resume();return;}
  const index=flight.encounter ? flight.phase==='won' ? (flight.encounterIndex+1)%ENCOUNTERS.length : flight.encounterIndex : 0;
  start(flight.mode,index);
});
$('practice').addEventListener('click', () => start(flight.mode === 'space' ? 'flight' : 'space'));
$('restart').addEventListener('click', restart);
$('mode').addEventListener('change',restart);
$('bonus-enabled').addEventListener('change',restart);
$('save-results').addEventListener('click',()=>{
  retainExplanation();
  const payload={game:'Arrow Space Shift',version:'0.5.0',recordedAt:new Date().toISOString(),attempts,
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
    throttle: Number(keys.has('ArrowUp')) - Number(keys.has('ArrowDown')),
    fire: fireToggle || keys.has('Space') };
}

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
  $('counter-result').textContent=stage===2&&a===b?'Select two different operations.':`Proposed outside counter: ${matches.map(n=>OPERATIONS[n].name).join(', ')}.`;
  $('graph-status').textContent=`${audit.vertices.length} operations. ${audit.witnesses.length} ${stage===1?'single-operation':'pair'} checks passed. Combat interactions are not validated.`;
  const table=$('counter-matrix');table.replaceChildren();
  const caption=table.createCaption();caption.textContent='Row counters column. These are proposed relationships.';
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
  $('upgrade-panel').hidden=!['upgrades','warp-lab'].includes(s.mode);
  $('warp-state').textContent=s.upgrade?`${s.warpCount} ${s.warpCount===1?'shot':'shots'} moved`:'No upgrade';
  $('upgrade-binding').textContent=s.upgrade?`Stored state: ${s.upgrade.imprint===1?'open':'folded'}.`:'Collection stores the current fold state.';
  $('upgrade-side').textContent=s.upgrade?`Active side: ${warpSide(s)===1?'right':'left'}. Shift changes the side. Shots remain hostile.`:'Collect open → fold: left. Fold → collect: right.';
  $('drop-preview').textContent=s.drops.some(d=>!d.collected)?`Seed ahead. Collect now: ${s.fields.length?'folded':'open'} state. The first active side will be right.`:s.mode==='warp-lab'?'Restart to test the other collection order.':'A marked enemy drops the next seed.';
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
  $('fold').classList.toggle('available', s.phase === 'running' && s.fields.length < s.maxFolds);
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
  else if(s.phase==='running')$('flight-state').textContent=s.encounter?'Timing course':s.mode==='upgrades'?'Upgrade flight':s.mode==='warp-lab'?'Position warp lab':s.mode==='space'?'Space-only test':'Reference route';
  if (s.phase !== oldPhase) {
    oldPhase = s.phase;
    $('overlay').hidden = s.phase === 'running';
    $('flight-state').textContent = ({ready:'Ready for flight',running:s.mode === 'space' ? 'Space-only test' : 'Flight in progress',paused:'Flight paused',won:'Transit complete',lost:'Hull lost'})[s.phase];
    if (s.phase === 'ready') {
      $('overlay-title').textContent = s.encounter?s.encounter.name:s.mode==='upgrades'?'Collect an operation.':s.mode==='warp-lab'?'Store a fold state.':'Fold the distance.';
      $('overlay-text').textContent = s.encounter?s.encounter.brief:['upgrades','warp-lab'].includes(s.mode)?'Position Warp moves incoming shots around your ship. Collection stores the fold state. Compare collection before a fold with collection after a fold. Shots remain hostile.':'Fold for faster shots. Enemy shots accelerate too. Unfold to gain reaction time.';
      $('primary').textContent = s.encounter?'Start encounter 1':s.mode==='upgrades'?'Start upgrade flight':s.mode==='warp-lab'?'Start warp lab':s.mode === 'space' ? 'Start space test' : 'Start reference route';
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
    $('practice').hidden = s.phase === 'paused' || !!s.encounter || ['upgrades','warp-lab'].includes(s.mode);
    $('overlay-note').textContent=s.encounter?'One active fold. A two-second countdown starts each attempt. Use Restart to change the score comparison.':['upgrades','warp-lab'].includes(s.mode)?'Only Position Warp is playable. The counter graphs below are design targets.':'Use a keyboard. The space-only test has no enemies.';
    $('practice').textContent = s.mode === 'space' ? 'Start reference route' : 'Test space only';
    $('overlay-note').hidden = s.phase === 'paused';
    if (s.phase !== 'running' && s.phase !== 'ready') $('primary').focus({preventScroll:true});
  }
}

function resize() {
  const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  width = r.width; height = r.height;
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
new ResizeObserver(resize).observe(canvas);
function project(x,z) {
  const distance = spaceDistance(flight.z,z,flight.fields);
  return { x: width / 2 + x * width / 800, y: height - 88 - distance * (height - 150) / 1050 };
}
function line(x1,y1,x2,y2,color,lineWidth=1) { ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.stroke(); }
function polygon(points,fill,stroke) {
  ctx.beginPath(); points.forEach(([x,y],i)=>i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();} if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}
}
function drawShip(x,y,enemy=false,strong=false) {
  ctx.save();ctx.translate(x,y);
  if(enemy)ctx.rotate(Math.PI);
  const color = enemy ? '#ffb8a0' : '#7ae8e0';
  const size = enemy ? strong ? 1.1 : 0.85 : 1;
  ctx.scale(size,size);
  if (!enemy) { const flame = reducedMotion ? 14 : 11 + Math.sin(flight.time * 40) * 5;
    polygon([[-5,14],[0,14+flame],[5,14]],'#b8a6ed'); }
  polygon([[0,-23],[-9,-2],[-23,15],[-8,11],[0,18],[8,11],[23,15],[9,-2]],enemy?'#4d3345':'#254657',color);
  polygon([[0,-13],[-4,3],[0,8],[4,3]],color);
  line(-10,5,-18,12,color); line(10,5,18,12,color);
  ctx.restore();
}
function render() {
  ctx.fillStyle = '#0b1528'; ctx.fillRect(0,0,width,height);
  const s = flight, topZ = advanceThroughSpace(s.z,1300,s.fields);
  for(let i=0;i<95;i++){
    const baseZ=i*173.57, z=baseZ + Math.floor(s.z / 16500)*16500;
    const p=project(Math.sin(i*71.19)*390,z < s.z-100 ? z+16500 : z);
    if(p.y<0 || p.y>height)continue;
    ctx.fillStyle=i%4===0?'#8ca6c5':'#3c5271';ctx.fillRect(p.x,p.y,i%4===0?2:1,2);
  }
  for(let x=-320;x<=320;x+=80){const a=project(x,s.z-200),b=project(x,topZ);line(a.x,a.y,b.x,b.y,'#283c574f');}
  for(let z=Math.floor(s.z/100)*100;z<topZ;z+=100){const p=project(0,z);line(width*.06,p.y,width*.94,p.y,'#35496766');}
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
  for(const drop of s.drops){
    if(drop.collected)continue;const p=project(drop.x,drop.z);
    if(p.y<65 || p.y>height+30)continue;
    const color=s.fields.length?'#d8c7ff':'#7ae8e0';
    polygon([[p.x,p.y-13],[p.x+13,p.y],[p.x,p.y+13],[p.x-13,p.y]],'#392f54',color);
    ctx.fillStyle=color;ctx.font='11px Segoe UI';ctx.textAlign='center';ctx.fillText(`Warp seed · ${s.fields.length?'folded':'open'}`,p.x,p.y-23);ctx.textAlign='left';
  }
  if(s.upgrade){
    const p=project(s.x,s.z);ctx.setLineDash([4,7]);ctx.strokeStyle='#b8a6ed90';ctx.beginPath();ctx.ellipse(p.x,p.y,WARP_RADIUS*width/800,WARP_RADIUS*(height-150)/1050,0,Math.PI,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    for(const shot of s.enemyShots.filter(b=>!b.warped).slice(0,3)){
      const dz=spaceDistance(s.z,shot.z,s.fields);if(dz<=0 || dz>350)continue;
      const r=rotateDisplacement(shot.x-s.x,dz,warpSide(s));const scale=WARP_RADIUS/Math.hypot(r.x,r.z);
      const landing=project(s.x+r.x*scale,advanceThroughSpace(s.z,r.z*scale,s.fields));
      ctx.beginPath();ctx.arc(landing.x,landing.y,7,0,Math.PI*2);ctx.strokeStyle='#d8c7ff';ctx.stroke();
    }
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
    if(enemy.hp<=0 || enemy.escaped)continue;const p=project(enemy.x,enemy.z);
    if(p.y>65 && p.y<height+40){
      drawShip(p.x,p.y,true,enemy.hp>2);
      if(enemy.dropsUpgrade){ctx.fillStyle='#d8c7ff';ctx.font='11px Segoe UI';ctx.textAlign='center';ctx.fillText('Warp seed',p.x,p.y-34);ctx.textAlign='left';}
      if(enemy.shield){
        const open=targetOpen(s);ctx.strokeStyle=open?'#7ae8e0':'#ecd283';ctx.lineWidth=3;
        ctx.setLineDash(open?[3,7]:[]);ctx.beginPath();ctx.arc(p.x,p.y,34,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle=open?'#7ae8e0':'#ecd283';ctx.font='12px Segoe UI';ctx.textAlign='center';ctx.fillText(open?'Target open':'Shield closed',p.x,p.y+52);ctx.textAlign='left';
      }
    }
  }
  for(const shot of s.shots){const p=project(shot.x,shot.z);const boost=1/metricAt(shot.z,s.fields);if(p.y>55 && p.y<height){line(p.x,p.y-9,p.x,p.y+Math.min(48,5*boost),'#7ae8e0',boost>1?3:2);}}
  for(const shot of s.enemyShots){
    const p=project(shot.x,shot.z);const boost=1/metricAt(shot.z,s.fields);
    if(p.y>55 && p.y<height){
      if(shot.salvo){const a=project(shot.x-shot.halfWidth,shot.z),b=project(shot.x+shot.halfWidth,shot.z);ctx.fillStyle='#ffb8a030';ctx.fillRect(a.x,p.y-15,b.x-a.x,30);line(a.x,p.y,b.x,p.y,'#ffb8a0',5);line(a.x,p.y-18,a.x,p.y+18,'#ffb8a0',2);line(b.x,p.y-18,b.x,p.y+18,'#ffb8a0',2);ctx.fillStyle='#ffdfbb';ctx.font='11px Segoe UI';ctx.textAlign='center';ctx.fillText(`Salvo · shots ×${boost}`,p.x,p.y-24);ctx.textAlign='left';}
      else {if(boost>1)line(p.x,p.y-Math.min(48,7*boost),p.x,p.y,shot.warped?'#d8c7ff':'#ffb8a0',2);ctx.beginPath();ctx.arc(p.x,p.y,boost>1?5:4,0,Math.PI*2);ctx.fillStyle=shot.warped?'#d8c7ff':boost>1?'#ffdfbb':'#ffb8a0';ctx.fill();}
    }
  }
  const exit=project(0,ROUTE_LENGTH);
  if(exit.y>60 && exit.y<height){line(0,exit.y,width,exit.y,'#7ae8e0',2);ctx.fillStyle='#7ae8e0';ctx.textAlign='center';ctx.font='16px Bahnschrift';ctx.fillText('Exit',width/2,exit.y-15);ctx.textAlign='left';}
  const p=project(s.x,s.z);
  if(s.invulnerable<=0 || reducedMotion || Math.floor(s.time*10)%2===0)drawShip(p.x,p.y);
  if(s.invulnerable>0){ctx.beginPath();ctx.arc(p.x,p.y,31,0,Math.PI*2);ctx.strokeStyle='#ffb8a080';ctx.stroke();}
  if(flash>0 && !reducedMotion){ctx.fillStyle=`rgba(184,166,237,${flash*.15})`;ctx.fillRect(0,0,width,height);}
  if(s.countdown>0 && s.phase==='running'){
    ctx.textAlign='center';ctx.fillStyle='#eaf2ff';ctx.font='48px Bahnschrift';ctx.fillText(Math.ceil(s.countdown),width/2,height*.5);
    ctx.font='14px Segoe UI';ctx.fillText('Get ready',width/2,height*.5+30);ctx.textAlign='left';
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
window.arrowSpaceShift = Object.freeze({read:()=>readFlight(flight),results:()=>structuredClone(attempts)});
if(testing)window.arrowSpaceShiftTest=Object.freeze({
  start, restart, read:()=>readFlight(flight),
  loadShotTrial(){
    start('space'); flight.z=300;
    flight.shots=[{x:-120,z:600}]; flight.enemyShots=[{x:180,z:1050,vx:0}];
    updateUI(true);render();return readFlight(flight);
  },
  loadUpgradeTrial(foldFirst=false){start('warp-lab');flight.countdown=0;flight.z=300;flight.drops=[];flight.labWave=999;
    const drop=makeDrop(flight,0,300);
    if(foldFirst)addFold(flight);collectDrop(flight,drop);if(!foldFirst)addFold(flight);
    flight.enemyShots=[{x:60,z:advanceThroughSpace(flight.z,100,flight.fields),vx:0}];
    updateUI(true);render();return readFlight(flight);
  },
  advance(seconds){for(let i=0;i<Math.round(seconds/STEP);i++)tick(flight,input(),STEP);updateUI(true);render();return readFlight(flight);},
});
resize();updateUI(true);requestAnimationFrame(frame);
