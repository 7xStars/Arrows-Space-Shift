import { addFold, removeFold, metricAt, spaceDistance, advanceThroughSpace, MAX_FOLDS } from './space.js';
import { createFlight, tick, readFlight, STEP, ROUTE_LENGTH } from './simulation.js';

const $ = id => document.getElementById(id);
const canvas = $('space'), ctx = canvas.getContext('2d');
const testing = new URLSearchParams(location.search).get('test') === '1';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const keys = new Set();
let flight = createFlight(), fireToggle = false;
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
  if (addFold(flight)) { flash = 0.32; tone(340, 0.2); notify('Fold added. Both sides’ shots accelerate inside it. Folded kills earn extra points.'); }
  else notify('Three fields are active. Unfold one before you add another.');
}
function unfold() {
  if (flight.phase !== 'running') return;
  if (removeFold(flight)) { flash = 0.22; tone(190, 0.2); notify('Latest fold removed. Both sides’ shots slow there. Its kill bonus is removed too.'); }
  else notify('Space is already open.');
}
function clearInput() { keys.clear(); fireToggle = false; }
function start(mode = flight.mode) {
  clearInput(); flight = createFlight(mode); flight.phase = 'running';
  flight.lastEvent = mode === 'space' ? 'Space-only test. Compare the grid before and after a fold.' : 'Flight started. Fly through the gate openings.';
  accumulator = 0; oldPhase = ''; oldStack = null; updateUI(true); canvas.focus({preventScroll:true});
}
function pause(reason = 'Flight paused.') {
  if (flight.phase !== 'running') return;
  flight.phase = 'paused'; clearInput(); notify(reason); tone(150);
}
function resume() { flight.phase = 'running'; clearInput(); accumulator = 0; notify('Flight resumed.'); canvas.focus({preventScroll:true}); }
function restart() {
  clearInput(); flight = createFlight(flight.mode); accumulator = 0; oldPhase = ''; oldStack = null;
  updateUI(true);
}

$('primary').addEventListener('click', () => flight.phase === 'paused' ? resume() : start());
$('practice').addEventListener('click', () => start(flight.mode === 'space' ? 'flight' : 'space'));
$('restart').addEventListener('click', restart);
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

function updateUI(force = false) {
  if (!force && hudClock < 0.1) return;
  hudClock = 0;
  const s = flight, factor = 1 / metricAt(s.z, s.fields);
  $('progress-label').textContent = `${Math.floor(s.z).toLocaleString('en-US')} / 8,400`;
  $('route').value = s.z; $('hull').textContent = `${s.hull} / 5`;
  $('time').textContent = `${s.time.toFixed(1)} s`; $('score').textContent = s.score;
  $('bonus').textContent = `Fold bonus earned: ${s.foldBonus}`;
  $('factor').textContent = `${factor}×`; $('thrust').textContent = s.thrust.toFixed(0);
  $('speed').textContent = (s.thrust * factor).toFixed(0); $('metric').textContent = (1 / factor).toFixed(3);
  $('factor-note').textContent = factor === 1 ? 'The ship is outside a fold field.' : `The ship covers ${factor} route units for each thrust unit.`;
  $('fold-count').textContent = `${s.fields.length} / ${MAX_FOLDS}`;
  $('field-caption').textContent = factor > 1 ? `Inside compressed space · ${factor}× route speed` : s.fields.length ? 'Fold fields ahead or behind the ship' : 'Space is open';
  $('fire').setAttribute('aria-pressed', String(fireToggle));
  $('fire').firstElementChild.textContent = fireToggle ? 'Fire on' : 'Fire off';
  $('fold').classList.toggle('available', s.phase === 'running' && s.fields.length < MAX_FOLDS);
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
  if (s.phase !== oldPhase) {
    oldPhase = s.phase;
    $('overlay').hidden = s.phase === 'running';
    $('flight-state').textContent = ({ready:'Ready for flight',running:s.mode === 'space' ? 'Space-only test' : 'Flight in progress',paused:'Flight paused',won:'Transit complete',lost:'Hull lost'})[s.phase];
    if (s.phase === 'ready') {
      $('overlay-title').textContent = 'Fold the distance.';
      $('overlay-text').textContent = 'Fold for faster shots and bonus points. Enemy shots accelerate too. Unfold to get more reaction time, but lose shot speed and the field’s bonus.';
      $('primary').textContent = s.mode === 'space' ? 'Start space test' : 'Start flight';
    } else if (s.phase === 'paused') {
      $('overlay-title').textContent = 'Flight paused.'; $('overlay-text').textContent = s.lastEvent;
      $('primary').textContent = 'Resume flight';
    } else if (s.phase === 'won' || s.phase === 'lost') {
      $('overlay-title').textContent = s.phase === 'won' ? 'Transit complete.' : 'Hull lost.';
      $('overlay-text').textContent = `${s.z.toFixed(0)} route units in ${s.time.toFixed(1)} seconds. ${s.foldsUsed} folds made. ${s.kills} enemy ships destroyed. Score: ${s.score}.`;
      $('primary').textContent = 'Fly again';
      if (s.phase === 'won') tone(580, 0.4);
    }
    $('practice').hidden = s.phase === 'paused';
    $('practice').textContent = s.mode === 'space' ? 'Start combat flight' : 'Test space only';
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
  for(const gate of s.gates){
    const p=project(0,gate.z);if(p.y<60 || p.y>height+30)continue;
    const a=project(gate.gap-gate.width/2,gate.z),b=project(gate.gap+gate.width/2,gate.z);
    ctx.fillStyle='#ecd28312';ctx.fillRect(0,p.y-7,a.x,14);ctx.fillRect(b.x,p.y-7,width-b.x,14);
    line(0,p.y,a.x,p.y,'#ecd283',3);line(b.x,p.y,width,p.y,'#ecd283',3);
    line(a.x,p.y-12,a.x,p.y+12,'#ecd283',3);line(b.x,p.y-12,b.x,p.y+12,'#ecd283',3);
    ctx.fillStyle='#ecd283';ctx.font='10px Segoe UI';ctx.textAlign='center';ctx.fillText('Opening',(a.x+b.x)/2,p.y-12);ctx.textAlign='left';
  }
  for(const enemy of s.enemies){if(enemy.hp<=0 || enemy.escaped)continue;const p=project(enemy.x,enemy.z);if(p.y>65 && p.y<height+40)drawShip(p.x,p.y,true,enemy.hp>2);}
  for(const shot of s.shots){const p=project(shot.x,shot.z);const boost=1/metricAt(shot.z,s.fields);if(p.y>55 && p.y<height){line(p.x,p.y-9,p.x,p.y+Math.min(48,5*boost),'#7ae8e0',boost>1?3:2);}}
  for(const shot of s.enemyShots){const p=project(shot.x,shot.z);const boost=1/metricAt(shot.z,s.fields);if(p.y>55 && p.y<height){if(boost>1)line(p.x,p.y-Math.min(48,7*boost),p.x,p.y,'#ffb8a0',2);ctx.beginPath();ctx.arc(p.x,p.y,boost>1?5:4,0,Math.PI*2);ctx.fillStyle=boost>1?'#ffdfbb':'#ffb8a0';ctx.fill();}}
  const exit=project(0,ROUTE_LENGTH);
  if(exit.y>60 && exit.y<height){line(0,exit.y,width,exit.y,'#7ae8e0',2);ctx.fillStyle='#7ae8e0';ctx.textAlign='center';ctx.font='16px Bahnschrift';ctx.fillText('Exit',width/2,exit.y-15);ctx.textAlign='left';}
  const p=project(s.x,s.z);
  if(s.invulnerable<=0 || reducedMotion || Math.floor(s.time*10)%2===0)drawShip(p.x,p.y);
  if(s.invulnerable>0){ctx.beginPath();ctx.arc(p.x,p.y,31,0,Math.PI*2);ctx.strokeStyle='#ffb8a080';ctx.stroke();}
  if(flash>0 && !reducedMotion){ctx.fillStyle=`rgba(184,166,237,${flash*.15})`;ctx.fillRect(0,0,width,height);}
}
function frame(now){
  const dt=lastFrame ? Math.min((now-lastFrame)/1000,0.1) : 0;lastFrame=now;
  if(!testing && flight.phase==='running'){
    accumulator+=dt;
    while(accumulator>=STEP){tick(flight,input(),STEP);accumulator-=STEP;}
  }
  flash=Math.max(0,flash-dt);hudClock+=dt;updateUI();render();requestAnimationFrame(frame);
}
window.foldspace = Object.freeze({read:()=>readFlight(flight)});
if(testing)window.foldspaceTest=Object.freeze({
  start, restart, read:()=>readFlight(flight),
  loadShotTrial(){
    start('space'); flight.z=300;
    flight.shots=[{x:-120,z:600}]; flight.enemyShots=[{x:180,z:1050,vx:0}];
    updateUI(true);render();return readFlight(flight);
  },
  advance(seconds){for(let i=0;i<Math.round(seconds/STEP);i++)tick(flight,input(),STEP);updateUI(true);render();return readFlight(flight);},
});
resize();updateUI(true);requestAnimationFrame(frame);
