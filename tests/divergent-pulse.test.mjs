import test from 'node:test';
import assert from 'node:assert/strict';
import {moveBolza} from '../src/hyperbolic.js';
import {createPulseStudy,startPulseStudy,stepPulseStudy,advancePulsePhase,pulseCanAdvance,pulseSnapshot,
  submitPulsePrediction,retryPulseTransfer,setPulseCondition,markPulseHelp,pulseDisplayCrossing} from '../src/divergent-pulse.js';

const run=(s,seconds,input={})=>{for(let t=0;t<seconds-1e-8;t+=.05)stepPulseStudy(s,input,Math.min(.05,seconds-t));};
function reachTransfer(options={}){
  const s=createPulseStudy(options);startPulseStudy(s);run(s,1.2);assert.equal(advancePulsePhase(s),true);
  for(let i=0;i<200&&!pulseCanAdvance(s);i++)run(s,.05);
  assert.equal(advancePulsePhase(s),true);run(s,1.2);assert.equal(advancePulsePhase(s),true);
  assert.equal(advancePulsePhase(s),true);assert.equal(s.phaseIndex,4);return s;
}
test('the same physical attack crosses the actual Bolza seam without replacement',()=>{
  const s=createPulseStudy();startPulseStudy(s);const physical=s.primary;
  run(s,1.2);assert.equal(s.trace.length,0);assert.equal(s.primary,physical);
  const expected=moveBolza(s.primary.position,s.primary.heading,3,.012).crossings[0];
  advancePulsePhase(s);for(let i=0;i<200&&!s.trace.length;i++)run(s,.05);
  assert.equal(s.primary,physical,'the live attack object is retained');
  const crossing=s.trace.find(t=>t.objectId===physical.id);assert.ok(crossing);
  assert.equal(crossing.from,expected.from);assert.equal(crossing.to,expected.to);
  assert.equal(crossing.topology,'bolza');assert.equal(crossing.type,'crossing');
  assert.equal(s.primary.joins,1);assert.equal(s.primary.id,'pulse-1');
});
test('manual fire and signed movement operate without auto fire or campaign progress',()=>{
  const s=createPulseStudy();startPulseStudy(s);run(s,.3);assert.equal(s.shots.length,0);
  const before=structuredClone(s.player.position);run(s,.1,{drive:1,fire:true});
  assert.notDeepEqual(s.player.position,before);assert.equal(s.shots.length,1);
  assert.equal(s.events.filter(e=>e.type==='manual-fire').length,1);assert.equal('journey' in s,false);
  run(s,.1,{turn:1});assert.ok(s.player.heading.x<0);
});
test('transfer withholds motion and destination feedback until one first choice',()=>{
  const s=reachTransfer(),position=structuredClone(s.primary.position);run(s,1,{drive:1,fire:true});
  assert.deepEqual(s.primary.position,position);assert.equal(s.shots.length,0);
  const snapshot=pulseSnapshot(s);assert.equal(snapshot.awaitingPrediction,true);
  assert.deepEqual(snapshot.trace,[]);assert.ok(snapshot.events.every(e=>e.type!=='crossing'));
  assert.equal(snapshot.prediction,null);assert.equal(snapshot.feedback,null);
  assert.ok(snapshot.events.filter(e=>e.type==='attack-entered').every(e=>e.objectId!==s.primary.id));
  const predicted=moveBolza(position,s.primary.heading,4,.012).crossings[0];
  assert.ok(predicted);assert.equal(submitPulsePrediction(s,predicted.to),true);
  assert.ok(s.events.some(e=>e.type==='attack-entered'&&e.objectId===s.primary.id));
  assert.equal(submitPulsePrediction(s,(predicted.to+1)%8),false);
  assert.equal(s.records.length,1);assert.equal(s.prediction.actualSide,null);
  for(let i=0;i<200&&!s.feedback;i++)run(s,.05);
  assert.equal(s.prediction.firstChoice,predicted.to);assert.equal(s.prediction.actualSide,predicted.to);
  assert.equal(s.feedback.correct,true);assert.equal(s.records[0].taskKind,'destination-prediction');
});
test('help, condition order, and corrected attempts remain distinct evidence',()=>{
  const s=createPulseStudy();markPulseHelp(s);assert.equal(s.guideHistory.length,1);
  assert.equal(setPulseCondition(s,'visual'),true);startPulseStudy(s);run(s,1.2);advancePulsePhase(s);
  for(let i=0;i<200&&!pulseCanAdvance(s);i++)run(s,.05);
  advancePulsePhase(s);run(s,1.2);advancePulsePhase(s);advancePulsePhase(s);
  markPulseHelp(s);submitPulsePrediction(s,0);assert.equal(s.prediction.assisted,true);
  assert.equal(s.prediction.priorGuideCount,2);assert.equal(s.prediction.conditionOrder.at(-1).condition,'visual');
  const first=s.prediction;for(let i=0;i<200&&!s.feedback;i++)run(s,.05);
  assert.equal(retryPulseTransfer(s),true);submitPulsePrediction(s,1);
  assert.equal(s.records.length,2);assert.equal(s.records[0],first);assert.equal(s.records[1].assisted,true);
  assert.equal(s.records[1].retry,1);assert.equal(setPulseCondition(s,'combined'),false);
});
test('audio-only is an unscored listening case and mismatched cues require Probe',()=>{
  const normal=createPulseStudy();assert.equal(setPulseCondition(normal,'audio'),false);
  assert.equal(setPulseCondition(normal,'mismatched'),false);
  const s=reachTransfer({condition:'audio',probe:true});assert.equal(submitPulsePrediction(s,0),false);
  const player=structuredClone(s.player);run(s,.1,{drive:1,fire:true,turn:1});assert.deepEqual(s.player,player);
  assert.equal(s.shots.length,0);assert.equal(s.contacts,0);
  assert.equal(pulseSnapshot(s).awaitingPrediction,false);
  for(let i=0;i<200&&!s.feedback;i++)run(s,.05);
  assert.equal(s.records.length,1);assert.equal(s.records[0].taskKind,'listen-only');
  assert.equal(s.records[0].notScored,true);assert.equal(s.records[0].correct,null);
  assert.equal(createPulseStudy({condition:'mismatched',probe:true}).condition,'mismatched');
});
test('pause preserves all study clocks, actors, and records',()=>{
  const s=createPulseStudy();startPulseStudy(s);run(s,.3,{fire:true});s.paused=true;
  const before=structuredClone(s);run(s,2,{drive:1,fire:true,turn:1});assert.deepEqual(s,before);
});
test('the disclosed canvas trace and HUD share the latest primary crossing after several returns',()=>{
  const s=createPulseStudy();startPulseStudy(s);run(s,1.2);advancePulsePhase(s);
  for(let i=0;i<400&&s.trace.filter(t=>t.objectId===s.primary.id).length<2;i++)run(s,.05);
  const crossings=s.trace.filter(t=>t.objectId===s.primary.id);assert.ok(crossings.length>=2);
  assert.deepEqual(pulseDisplayCrossing(s),crossings.at(-1));
  assert.deepEqual(pulseSnapshot(s).displayCrossing,crossings.at(-1));
  assert.notEqual(crossings[0].eventId,crossings.at(-1).eventId);
});
