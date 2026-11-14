import test from 'node:test';import assert from 'node:assert/strict';
import {FIRST_TIME_CHECKS,evaluateResponses} from '../src/playtest-protocol.js';
test('no human responses means no measured performance or invented rating',()=>{
 const out=evaluateResponses([]);assert.equal(out.average,null);assert.ok(out.tests.every(t=>t.rate===null&&t.met===null));
});
test('only observed answers enter the denominator, no U as zero',()=>{
 const r=evaluateResponses([{controls:true,fold:false,overall:5},{controls:false,overall:3}]);
 assert.equal(r.rated,2);assert.equal(r.average,4);
 assert.deepEqual(r.tests.find(x=>x.id==='controls'),{id:'controls',n:2,passing:1,rate:.5,target:.9,met:false});
 assert.equal(r.tests.find(x=>x.id==='fold').n,1);
 assert.equal(FIRST_TIME_CHECKS.length,5);
});
