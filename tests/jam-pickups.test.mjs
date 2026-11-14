import test from 'node:test';import assert from 'node:assert/strict';
import {createFlight} from '../src/simulation.js';import {enterChapter} from '../src/campaign.js';
import {makeDrop,collectDrop} from '../src/upgrades.js';

test('Act I duplicate seed behavior and score stay unchanged',()=>{
 const s=createFlight('campaign',{seed:11});enterChapter(s,8);
 const score=s.score,amount=s.inventory.length;
 const d=makeDrop(s,0,0,'qa',0,1);assert.equal(collectDrop(s,d),true);
 assert.equal(s.score,score);assert.equal(s.inventory.length,amount);
});
test('Act II duplicate becomes a modest score pickup, not a replacement operation',()=>{
 const s=createFlight('campaign',{seed:11});enterChapter(s,9);
 const score=s.score,amount=s.inventory.length;
 const d=makeDrop(s,0,0,'qa',0,1);collectDrop(s,d);
 assert.equal(s.score,score+35);assert.equal(s.inventory.length,amount);
 assert.match(s.lastEvent,/duplicate recovered/);
});
test('Act III duplicate can become a limited, deliberate-use echo, with no farming after two',()=>{
 const s=createFlight('campaign',{seed:11});enterChapter(s,18);
 s.projective.echoes=0;const amount=s.inventory.length;
 for(let i=0;i<5;i++)collectDrop(s,makeDrop(s,0,0,'qa',0,1));
 assert.equal(s.projective.echoes,2);assert.equal(s.campaign.duplicateEchoCredits,2);
 assert.equal(s.inventory.length,amount);assert.equal(s.score,35*5);
});
