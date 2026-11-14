import test from 'node:test';
import assert from 'node:assert/strict';
import {CHAPTERS} from '../src/campaign.js';
import {ACT_TWO_WAVE_SCRIPTS,waveScriptFor} from '../src/waves.js';
import {ENEMY_WINDUP} from '../src/simulation.js';
import {KLEIN_BOUNDS,traceKleinProjective} from '../src/klein.js';

test('all scripted Act II pressure breaks clear hostile shots and occupy distinct progress intervals',()=>{
  for(const c of CHAPTERS.filter(c=>c.act===2&&c.kind==='level'&&c.waveScript)){
    const script=waveScriptFor(c);
    assert.ok(script,c.name);
    let last=-1,breaks=0;
    for(const wave of script.waves){
      assert.ok(wave.at>last,`${c.name}: waves need strictly ordered entrance positions`);
      last=wave.at;
      if(wave.kind==='break'){
        breaks++;
        assert.equal(wave.clearHostile,true,`${c.name}: recovery must clear old hostile fire`);
        assert.equal(wave.members.length,0,`${c.name}: recovery must not spawn a surprise wave`);
      }
    }
    assert.ok(breaks>=2,`${c.name}: multiple relief intervals are part of the promised lesson structure`);
    assert.ok(script.waves.at(-1).at<1,`${c.name}: all encounters must precede the exit`);
  }
});

test('known authored bullet fields retain a committed warning interval',()=>{
  assert.ok(ENEMY_WINDUP>=.6,`warn ${ENEMY_WINDUP}`);
  for(const script of Object.values(ACT_TWO_WAVE_SCRIPTS)){
    for(const wave of script.waves)for(const member of wave.members){
      assert.ok((member.attackDelay||0)>=0,`${script.id} ${wave.id}: negative attack delay`);
      assert.ok(Math.abs(member.lane)<=400,`${script.id} ${wave.id}: launch outside the Klein domain`);
    }
  }
});

test('a projective boundary reappears at its predicted opposite x, and cannot jump without a crossing',()=>{
 const b=KLEIN_BOUNDS;
 const stationary=traceKleinProjective({x:120,y:400},0,0);
 assert.deepEqual([stationary.x,stationary.y],[120,400]);
 assert.equal(stationary.crossings.length,0);
 const crossing=traceKleinProjective({x:120,y:940},0,25);
 assert.equal(crossing.projectiveCrossings,1);
 assert.equal(crossing.crossings[0].edge,'top');
 assert.equal(crossing.crossings[0].rule,'projective');
 assert.equal(crossing.crossings[0].x,-120);
 assert.equal(crossing.crossings[0].y,b.bottom);
});
