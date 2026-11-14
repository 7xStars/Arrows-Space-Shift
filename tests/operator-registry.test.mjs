import test from 'node:test';
import assert from 'node:assert/strict';
import {recordFirstPrediction} from '../src/operator-registry.js';

test('the first prediction remains intact after feedback and later attempts',()=>{
  const records=[],context={source:{x:.4,y:.2}};
  const first=recordFirstPrediction(records,'case-a','left','right',context);
  context.source.x=99;
  const later=recordFirstPrediction(records,'case-a','right','left',{source:{x:-1,y:1}});
  assert.equal(first.correct,false);assert.equal(later.retained,true);
  assert.equal(later.choice,'left');assert.equal(later.expected,'right');
  assert.equal(records.length,1);assert.equal(records[0].context.source.x,.4);
  assert.ok(Object.isFrozen(records[0]));
});

test('a changed transfer case receives its own first prediction',()=>{
  const records=[];
  recordFirstPrediction(records,'baseline','a','a');
  const transfer=recordFirstPrediction(records,'transfer','a','b');
  assert.equal(transfer.correct,false);assert.equal(transfer.retained,false);
  assert.deepEqual(records.map(value=>[value.key,value.choice,value.expected]),[['baseline','a','a'],['transfer','a','b']]);
});
