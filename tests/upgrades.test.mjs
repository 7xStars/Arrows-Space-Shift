import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlight,tick,STEP,readFlight} from '../src/simulation.js';
import {addFold,removeFold,advanceThroughSpace,spaceDistance} from '../src/space.js';
import {auditTournament,counters,commonCounters,makeDrop,collectDrop,activeSourceSide,applyOperations,moveShot,equipSeed,loadout,roster} from '../src/upgrades.js';
import {presentEnemy,ENTRY_TIME} from '../src/combat-view.js';

const active=mode=>{const s=createFlight(mode||'warp-lab');s.phase='running';s.countdown=0;s.drops=[];s.events=[];s.enemies=[];s.gates=[];s.labWave=999;s.labDropClock=999;return s;};
const run=(s,seconds,input={})=>{for(let i=0;i<Math.round(seconds/STEP);i++)tick(s,input,STEP);};
function equip(s,type=0,polarity=1){const drop=makeDrop(s,0,s.z,'fixture',type,polarity);collectDrop(s,drop);s.drops=[];return s.inventory.find(seed=>seed.type===type&&seed.polarity===polarity);}
function presentFixtures(s){for(const enemy of s.enemies){presentEnemy(s,enemy);enemy.visibleFor=ENTRY_TIME;}}
function approach(s,{source=1,payload=[],x=60,vz=-145}={}){
  const shot={x:s.x+source*x,z:advanceThroughSpace(s.z,130,s.fields),vx:-source*20,vz,payload};
  const from={x:shot.x,z:shot.z};moveShot(shot,STEP,s.fields);
  const paths=applyOperations(s,s,shot,from,{x:s.x,z:s.z},STEP);return {shot,paths};
}
test('The three-node cycle has an outside counter for each operation',()=>{
  const a=auditTournament(1);assert.equal(a.valid,true);assert.equal(a.edges.length,3);assert.equal(a.witnesses.length,3);
  assert.ok(counters(0,1)&&counters(1,3)&&counters(3,0));
});
test('The seven-node graph covers every pair and retains the initial cycle',()=>{
  const a=auditTournament(2);assert.equal(a.valid,true);assert.equal(a.edges.length,21);assert.equal(a.witnesses.length,21);
  for(const w of a.witnesses){assert.equal(w.counters.length,1);assert.ok(!w.set.includes(w.counters[0]));}
  assert.deepEqual(commonCounters([0,1],2),[6]);assert.ok(auditTournament(1).edges.every(([x,y])=>counters(x,y)));
});
test('A right seed in folded space moves a right shot left without changing its forward position',()=>{
  const s=active();equip(s);addFold(s);const {shot,paths}=approach(s);
  assert.ok(shot.x<0);assert.equal(shot.vx,-20);assert.equal(shot.vz,-145);assert.equal(paths.length,2);
  assert.equal(paths[0].to.z,paths[1].from.z);assert.equal(Math.abs(paths[0].to.x),Math.abs(paths[1].from.x));
});
test('A left seed ignores a right shot when folded, then accepts it when unfolded',()=>{
  const s=active();equip(s,0,-1);addFold(s);const folded=approach(s);assert.ok(!folded.shot.warped);
  removeFold(s);const open=approach(s);assert.ok(open.shot.x<0);assert.ok(open.shot.warped);
});
test('All four handed seed and space-state cases select only the declared side',()=>{
  for(const polarity of [-1,1])for(const folds of [0,1])for(const source of [-1,1]){
    const s=active();equip(s,0,polarity);if(folds)addFold(s);
    const {shot}=approach(s,{source});assert.equal(Boolean(shot.warped),source===polarity*(folds?1:-1));
  }
});
test('A center shot is not stopped or moved by Position Warp',()=>{
  const s=active();equip(s);addFold(s);s.enemyShots=[{x:0,z:40,vx:0,vz:-145}];run(s,.3);
  assert.equal(s.hull,4);assert.equal(s.warpCount,0);
});
test('A shot from the inactive side retains its normal path',()=>{
  const s=active();equip(s);addFold(s);const {shot}=approach(s,{source:-1});
  assert.ok(shot.x<0);assert.equal(shot.vx,20);assert.equal(shot.vz,-145);assert.ok(!shot.warped);
});
test('Repeated fold and unfold cycles reverse the accepted side at each level',()=>{
  const s=active();equip(s);const observed=[activeSourceSide(s,s.upgrade)];
  for(let cycle=0;cycle<3;cycle++){
    for(let i=0;i<3;i++){assert.equal(addFold(s),true);observed.push(activeSourceSide(s,s.upgrade));}
    assert.equal(addFold(s),false);
    for(let i=0;i<3;i++){assert.ok(removeFold(s));observed.push(activeSourceSide(s,s.upgrade));}
  }
  for(let i=1;i<observed.length;i++)assert.equal(observed[i],-observed[i-1]);
  assert.equal(s.x,0);assert.equal(s.fields.length,0);assert.equal(s.foldsUsed,9);
});
test('Seed handedness survives collection in either fold state',()=>{
  const a=active(),b=active();equip(a,0,1);addFold(a);addFold(b);equip(b,0,1);
  assert.equal(a.upgrade.polarity,b.upgrade.polarity);assert.equal(activeSourceSide(a,a.upgrade),activeSourceSide(b,b.upgrade));
});
test('Warp timing is order dependent at the shot entry',()=>{
  const a=active(),b=active();equip(a);equip(b);addFold(a);const early=approach(a);const late=approach(b);addFold(b);
  assert.deepEqual(a.fields,b.fields);assert.ok(early.shot.warped);assert.ok(!late.shot.warped);
});
test('A shot cannot warp twice around the same actor',()=>{
  const s=active();equip(s);addFold(s);const {shot}=approach(s);
  removeFold(s);assert.equal(applyOperations(s,s,shot,{...shot},s,STEP),null);assert.equal(s.warpCount,1);
});
test('The warp jump does not cause a collision through the ship',()=>{
  const s=active();equip(s);addFold(s);s.enemyShots=[{x:60,z:130,vx:-20,vz:-145}];run(s,STEP);
  assert.equal(s.hull,5);assert.ok(s.enemyShots[0].warped);
});
test('A warped shot remains hostile at its destination',()=>{
  const s=active();equip(s);addFold(s);s.enemyShots=[{x:60,z:130,vx:0,vz:-145}];run(s,STEP);
  const shot=s.enemyShots[0];s.x=shot.x;s.z=shot.z-25;run(s,.2);assert.equal(s.hull,4);
});
test('The lab supplies more than one seed and both handed variants',()=>{
  const s=createFlight('warp-lab');s.phase='running';run(s,9);
  const drops=s.events.filter(e=>e.type==='upgrade-drop');assert.ok(drops.length>=2);assert.ok(drops.some(d=>d.polarity===-1));
});
test('Enemy destruction drops its actual equipped type and handedness once',()=>{
  for(const type of [0,1,2,3,4,5,6]){
    const s=active('paley');s.enemies=[{id:5,x:0,z:100,hp:1,clock:999,stage:2,equipped:[{type,polarity:-1}],dropsUpgrade:true}];
    presentFixtures(s);s.shots=[{x:0,z:90,vz:680,vx:0,payload:[]}];run(s,.1);
    assert.equal(s.kills,1);const drops=s.events.filter(e=>e.type==='upgrade-drop');assert.equal(drops.length,1);
    assert.equal(drops[0].typeId,type);assert.equal(drops[0].polarity,-1);
  }
});
test('The campaign introduces one, then three, then seven operations',()=>{
  const s=createFlight('upgrades');assert.equal(s.stage,0);assert.ok(s.enemies.filter(e=>e.stage===0).every(e=>e.equipped[0].type===0));
  assert.deepEqual([...new Set(s.enemies.filter(e=>e.stage===1).map(e=>e.equipped[0].type))].sort(),[0,1,3]);
  assert.equal(new Set(s.enemies.filter(e=>e.stage===2).flatMap(e=>e.equipped.map(seed=>seed.type))).size,7);
  s.phase='running';s.z=1301;tick(s,{},STEP);assert.equal(s.stage,1);s.z=3801;tick(s,{},STEP);assert.equal(s.stage,2);assert.equal(s.slotCount,2);
});
test('Later-stage enemies do not fire or defend before their stage starts',()=>{
  const s=active('upgrades');s.enemies=[{id:7,x:80,z:500,hp:5,clock:0,stage:2,equipped:[{type:0,polarity:1}]}];
  run(s,1);assert.equal(s.enemyShots.length,0);assert.ok(!s.events.some(e=>e.type==='operation'));
});
test('Enemy upgrades act on incoming player shots with the same side rule',()=>{
  const s=active('trio');addFold(s);s.enemies=[{id:2,x:0,z:250,hp:3,clock:999,stage:1,equipped:[{type:0,polarity:1}]}];
  presentFixtures(s);s.shots=[{x:60,z:120,vx:0,vz:680,payload:[]}];run(s,STEP);
  assert.ok(s.shots[0].x<0);assert.ok(s.events.some(e=>e.type==='operation'&&e.actor==='enemy-2'));
});
test('Enemy shots carry the equipped operation identities',()=>{
  const s=active('paley');s.enemies=[{id:2,x:80,z:500,hp:3,clock:0,stage:2,equipped:[{type:1,polarity:1},{type:4,polarity:1}]}];
  presentFixtures(s);tick(s,{},STEP);assert.deepEqual(s.enemyShots[0].payload,[1,4]);
});
test('All three directed cycle counters bypass the opposing operation',()=>{
  for(const [attack,defense] of auditTournament(1).edges){
    const s=active();equip(s,defense);addFold(s);const {shot}=approach(s,{payload:[attack]});
    assert.ok(!shot.operated);assert.equal(shot.damage,undefined);assert.ok(s.events.some(e=>e.type==='counter-bypass'));
  }
});
test('The reverse cycle matchups execute their operation',()=>{
  for(const [defense,attack] of auditTournament(1).edges){const s=active();equip(s,defense);addFold(s);const {shot}=approach(s,{payload:[attack]});assert.equal(shot.operated,true);}
});
test('All 21 pair counters bypass both equipped defenses in the runtime',()=>{
  for(const {set,counters:outside} of auditTournament(2).witnesses){
    const s=active('paley');equip(s,set[0]);s.selectedSlot=1;equip(s,set[1]);addFold(s);
    assert.equal(loadout(s).length,2);const {shot}=approach(s,{payload:[outside[0]]});
    assert.ok(!shot.operated);assert.equal(s.events.filter(e=>e.type==='counter-bypass').length,2);
  }
});
test('Vector Lens changes velocity without moving the trigger position',()=>{
  const s=active();equip(s,1);addFold(s);const {shot,paths}=approach(s);
  assert.equal(shot.vx,140);assert.equal(shot.vz,-108.75);assert.equal(paths[0].to.x,paths[1].from.x);
});
test('Path Bend retains the shot and changes its future velocity',()=>{
  const s=active();equip(s,2);addFold(s);const {shot}=approach(s);const vx=shot.vx;moveShot(shot,.25,s.fields);
  assert.ok(shot.vx>vx);assert.ok(shot.curveTime>0);assert.ok(!shot.dead);
});
test('Impact Buffer retains damage and applies the debt after the delay',()=>{
  const s=active();equip(s,3);addFold(s);s.enemyShots=[{x:12,z:135,vx:-25,vz:-145}];
  run(s,.6);assert.equal(s.hull,5);assert.ok(s.debts.length);run(s,1);assert.equal(s.hull,4);assert.equal(s.debts.length,0);
});
test('Stored damage is not erased by protection or route completion',()=>{
  const s=active();s.invulnerable=4;s.debts=[{target:'player',due:0,amount:2}];tick(s,{},STEP);assert.equal(s.hull,3);
  s.z=8399;s.hull=1;s.debts=[{target:'player',due:999,amount:1}];run(s,.1);assert.equal(s.phase,'lost');assert.equal(s.hull,0);
});
test('Arrival Delay pauses and then resumes the same shot',()=>{
  const s=active();equip(s,4);addFold(s);const {shot}=approach(s);const z=shot.z;
  moveShot(shot,.3,s.fields);assert.equal(shot.z,z);moveShot(shot,.5,s.fields);assert.ok(shot.z<z);assert.equal(shot.vz,-145);
});
test('Distance Anchor halves both velocity components',()=>{
  const s=active();equip(s,5);addFold(s);const {shot}=approach(s);assert.equal(shot.vx,-10);assert.equal(shot.vz,-72.5);
});
test('Utility Exchange grants firing time but keeps a heavier hostile shot',()=>{
  const s=active();s.fireClock=.5;equip(s,6);addFold(s);const {shot}=approach(s);
  assert.equal(s.fireClock,.38);assert.equal(shot.damage,2);assert.equal(shot.vz,-72.5);assert.ok(!shot.dead);
});
test('The two-slot operation order changes the resulting path',()=>{
  const values=[];
  for(const order of [[0,1],[1,0]]){
    const s=active('paley');equip(s,order[0]);s.selectedSlot=1;equip(s,order[1]);addFold(s);
    const {shot}=approach(s);values.push(shot.x);
  }
  assert.notEqual(values[0],values[1]);
});
test('Collected seeds remain available after equipment changes and reset clears them',()=>{
  const s=active('paley');const p=equip(s,0),v=equip(s,1);assert.equal(s.inventory.length,2);
  s.selectedSlot=0;assert.equal(equipSeed(s,v.key),true);assert.equal(s.equipped[0].key,v.key);assert.equal(s.equipped[1],null);
  assert.ok(s.inventory.some(seed=>seed.key===p.key));const fresh=createFlight('paley');assert.equal(fresh.inventory.length,0);
});
test('A handed variant replaces its operation without occupying two slots',()=>{
  const s=active('paley');equip(s,0,1);equip(s,1,1);equip(s,0,-1);
  assert.equal(loadout(s).length,2);assert.equal(loadout(s).filter(seed=>seed.type===0).length,1);
  assert.equal(s.equipped[0].polarity,-1);assert.equal(s.inventory.length,3);
  equipSeed(s,'0:1',1);assert.equal(s.equipped[0],null);assert.equal(s.equipped[1].polarity,1);
});
test('A defeated two-operation carrier drops both equipped seeds',()=>{
  const s=active('paley');s.enemies=[{id:5,x:0,z:100,hp:1,clock:999,stage:2,
    equipped:[{type:1,polarity:-1},{type:4,polarity:1}],dropsUpgrade:true}];
  presentFixtures(s);s.shots=[{x:0,z:90,vz:680,vx:0,payload:[]}];run(s,.1);
  assert.equal(s.kills,1);assert.deepEqual(s.events.filter(e=>e.type==='upgrade-drop').map(e=>[e.typeId,e.polarity]),[[1,-1],[4,1]]);
});
test('State inspection does not expose mutable equipment records',()=>{
  const s=active();equip(s);const r=readFlight(s);r.equipped[0].polarity=-1;r.inventory[0].type=6;
  assert.equal(s.equipped[0].polarity,1);assert.equal(s.inventory[0].type,0);
});
