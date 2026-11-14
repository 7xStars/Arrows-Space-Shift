import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createFlight,tick,recordEvent,STEP} from '../src/simulation.js';
import {isTutorial,chapter,CHAPTERS,enterChapter} from '../src/campaign.js';
import {addFold,removeFold} from '../src/space.js';
import {campaignNotice} from '../src/interface.js';
import {presentEnemy,ENTRY_TIME} from '../src/combat-view.js';
import {checkpointFromFlight,validateCheckpoint} from '../src/storage.js';

const input=(horizontal=0,fire=false)=>({horizontal,throttle:0,fire,capture:false,release:false});
const frames=(s,count,motion=input())=>{for(let i=0;i<count;i++)tick(s,motion,STEP);};
const start=()=>{const s=createFlight('campaign',{seed:235});s.phase='running';return s;};
const moveDone=s=>{
  frames(s,20,input(-1));
  frames(s,42,input(1));
  assert.equal(s.campaign.lesson,'shoot');
};
const foldDone=s=>{
  assert.equal(addFold(s),true);
  recordEvent(s,'fold',{fields:s.fields.length});
  assert.equal(s.campaign.lesson,'unfold');
  assert.ok(s.fields.length);
  assert.ok(removeFold(s));
  recordEvent(s,'unfold',{fields:s.fields.length});
  assert.equal(s.campaign.lesson,'engage');
};

test('Stage 0 keeps one armed target and manual shots through fold and unfold',()=>{
  const s=start();assert.equal(chapter(s).number,0);assert.equal(s.campaign.lesson,'move');
  assert.match(campaignNotice(s).text,/Arrows to move/);
  assert.equal(addFold(s),false,'cannot fold until the fold lesson');
  frames(s,16,input(0,true));assert.equal(s.shots.length,0,'early shooting does not skip movement');
  frames(s,20,input(-1));assert.equal(s.campaign.lesson,'move','both directions are required');
  frames(s,42,input(1));assert.equal(s.campaign.lesson,'shoot');assert.equal(s.enemies.length,1);
  const enemy=s.enemies[0];
  assert.match(campaignNotice(s).text,/Hold Space/);
  assert.equal(addFold(s),false,'cannot bypass shooting with fold');
  frames(s,1,input(0,true));
  assert.equal(s.campaign.lesson,'fold');assert.equal(s.campaign.training.shot,true);
  assert.match(campaignNotice(s).text,/L\.Shift folds distance/);
  assert.equal(s.enemies[0],enemy);
  assert.equal(removeFold(s),null,'unfold with no field is not a successful lesson');
  assert.equal(s.campaign.lesson,'fold');
  presentEnemy(s,enemy);
  frames(s,Math.ceil(ENTRY_TIME/STEP)+2,input(0,true));
  const shots=s.events.filter(e=>e.type==='player-fire').length;
  assert.equal(addFold(s),true);recordEvent(s,'fold',{fields:1});
  frames(s,30,input(0,true));
  assert.ok(s.events.filter(e=>e.type==='player-fire').length>shots,'fire remains active inside the fold lesson');
  const activeShots=s.shots.slice();
  removeFold(s);recordEvent(s,'unfold',{fields:0});
  assert.equal(s.campaign.lesson,'engage');
  assert.deepEqual(s.shots,activeShots,'unfold does not erase shots');
  assert.equal(s.enemies[0],enemy,'unfold does not reset target identity or health');
  assert.equal(s.campaign.training.folded,true);
  assert.equal(s.campaign.training.unfolded,true);
  assert.equal(s.fields.length,0);
  assert.equal(s.enemies.length,1);
  assert.equal(s.enemies[0].training,true);
  assert.equal(s.enemies[0].maxHp,10);
  assert.equal(s.enemies[0].dropsUpgrade,false);
  assert.equal(s.enemyShots.length,0);
  assert.match(campaignNotice(s).text,/Destroy the training enemy/);
});

test('Level 0 cannot complete without destroying the training enemy, then automatically enters Level 1',()=>{
  const s=start();moveDone(s);frames(s,1,input(0,true));foldDone(s);
  frames(s,100,input());assert.equal(s.campaign.index,-1);assert.equal(s.campaign.defeated,0);
  const enemy=s.enemies[0];presentEnemy(s,enemy);
  frames(s,Math.ceil(ENTRY_TIME/STEP)+2,input());
  // Align with the same target after the distance changes.
  s.x=enemy.x;
  frames(s,800,input(0,true));
  assert.equal(s.enemies[0]?.hp<=0||s.campaign.index===0,true);
  assert.equal(s.campaign.index,0,'the game proceeds without a second Start button');
  assert.equal(s.phase,'running');
  assert.equal(chapter(s).number,1);
  assert.equal(s.campaign.autoFromTutorial,true,'signals that the new stage needs a section checkpoint');
  assert.equal(s.campaign.announcement.text,'LEVEL 1 · TWO SIDES');
  assert.ok(s.events.some(e=>e.type==='chapter-start'&&e.chapter===0));
  const checkpoint=checkpointFromFlight(s);
  assert.equal(validateCheckpoint(checkpoint).chapterIndex,0);
});

test('Stage 0 target uses real warnings, hostile shots, and hull damage without drive faults',()=>{
  const s=start();moveDone(s);frames(s,1,input(0,true));foldDone(s);
  const enemy=s.enemies[0];presentEnemy(s,enemy);s.x=enemy.x;
  frames(s,1000,input());
  assert.equal(isTutorial(s),true);
  assert.ok(s.events.some(e=>e.type==='enemy-windup'));
  assert.ok(s.events.some(e=>e.type==='enemy-fire'));
  assert.ok(s.hull<5,'training does not suppress ordinary shot damage');
  assert.equal(s.asteroids.length,0);
  assert.equal(s.enemies.length,1);
  assert.equal(s.drive.faults,0);
  assert.equal(s.events.filter(e=>e.type==='fold-wake').length,0);
});

test('early right-shift, duplicate folds, and release of only one fold cannot skip the lesson',()=>{
  const s=start();moveDone(s);frames(s,1,input(0,true));
  assert.equal(s.campaign.lesson,'fold');
  recordEvent(s,'unfold',{fields:0});assert.equal(s.campaign.lesson,'fold');
  assert.equal(addFold(s),true);recordEvent(s,'fold',{fields:1});
  assert.equal(addFold(s),true);recordEvent(s,'fold',{fields:2});
  assert.equal(s.campaign.lesson,'unfold');
  removeFold(s);recordEvent(s,'unfold',{fields:1});
  assert.equal(s.campaign.lesson,'unfold','must restore open space');
  assert.equal(s.enemies.length,1);
  removeFold(s);recordEvent(s,'unfold',{fields:0});
  assert.equal(s.campaign.lesson,'engage');assert.equal(s.enemies.length,1);
});

test('an early combat kill completes training without forced Shift inputs',()=>{
  const s=start();moveDone(s);const enemy=s.enemies[0];presentEnemy(s,enemy);s.x=enemy.x;
  frames(s,800,input(0,true));
  assert.equal(s.campaign.index,0);
  assert.ok(s.events.some(e=>e.type==='tutorial-complete'));
  assert.equal(s.events.filter(e=>e.type==='tutorial-fold-complete').length,0);
});

test('original Act I and post-relay Acts retain their chapter definitions and no tutorial restrictions',()=>{
  const s=start();
  assert.equal(CHAPTERS[0].name,'Two Sides');assert.equal(CHAPTERS[8].name,'The Klein Fleet');
  enterChapter(s,0);assert.equal(addFold(s),true);
  enterChapter(s,9);assert.equal(addFold(s),true);
  enterChapter(s,18);assert.equal(addFold(s),true);
  const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  assert.match(app,/autoFromTutorial/);
  assert.match(app,/saveSection\(\)/);
  assert.doesNotMatch(app,/Folding starts in Level 1/);
});
