/** Verify the retained encounter records and earned import continuation. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
const folder=resolve(process.argv[2]||'reports/campaign-concept-review');
const firstPath=join(folder,'candidate-full-r2/results.json'),secondPath=join(folder,'candidate-continuation-r3/results.json');
const firstText=await readFile(firstPath,'utf8'),secondText=await readFile(secondPath,'utf8');
const first=JSON.parse(firstText),second=JSON.parse(secondText),checks=[];
const check=(label,condition)=>{assert.ok(condition,label);checks.push(label);};
check('The original run began with an empty earned journey',first.checks.includes('Fresh isolated context has no earned journey'));
assert.deepEqual(first.sections.map(item=>item.chapter),Array.from({length:28},(_,index)=>index-1));
checks.push('Training, all 24 scrolling levels, and three main bosses completed in order');
check('All three main boss records include physical pickup',first.sections.filter(item=>item.result==='extracted').every(item=>item.part.collected));
check('The original stop was the recorded Act IV controller timeout',first.failure.includes('Act IV stage 1 controller timeout'));
check('The continuation used the normal progress import control',second.checks.includes('Normal import accepts the earned snapshot'));
const recoveryText=await readFile(second.continuation.payloadPath,'utf8');
check('The imported recovery file matches its retained identity',createHash('sha256').update(recoveryText).digest('hex')===second.continuation.payloadSha256);
const originalParts=JSON.parse(first.storage['arrow-space-shift:journey:v1']).parts;
for(const id of ['klein-relay','projective-module','curvature-seed'])assert.deepEqual(second.finalJourney.parts[id],originalParts[id]);
checks.push('All three earned receipts survived import without a value change');
assert.deepEqual(second.sections.map(item=>item.actFour),[1,2,3,4,5,6,7,8,9]);
check('All nine Act IV encounters completed through keyboard input',second.sections.every(item=>['cleared','won'].includes(item.result)));
check('Core exposure and pickup did not bank the reward',second.checks.includes('Core exposed is not yet banked')&&second.checks.includes('Core collected is not yet banked'));
for(const [id,receipt] of Object.entries(second.finalJourney.parts)){
  check(`Physical extraction receipt retained: ${id}`,receipt.exposed&&receipt.collected&&receipt.extracted&&!receipt.legacy&&receipt.seed===4181845467&&receipt.shipId===0);
}
check('Assembly alone did not complete the campaign',second.checks.includes('Assembly does not complete the campaign'));
check('All three playable repair deliveries were observed',Object.values(second.activation.charged).every(Boolean));
check('The ending completed and persisted after reload',second.finalJourney.assembled&&second.finalJourney.activated&&second.finalJourney.completed&&second.finalJourney.endingSeen&&second.checks.includes('Completion survives reload'));
check('The main title recognized saved completion',second.checks.includes('Main title recognizes earned completion'));
check('Neither browser run reported a page exception',first.errors.length===0&&second.errors.length===0);
check('Neither browser run reported a failed HTTP request',first.badRequests.length===0&&second.badRequests.length===0);
const report={result:'Linked fresh-profile campaign path completed',method:'A fresh-profile ordinary-input main campaign followed by a disclosed controller timeout and normal import of its exact earned saved records. The corrected controller completed Act IV, repair, and ending. This is not one uninterrupted run.',
  checks,encounters:37,mainEncounters:first.sections.length,actFourEncounters:second.sections.length,
  seed:4181845467,shipId:0,wallSeconds:+(first.wallSeconds+second.wallSeconds).toFixed(2),
  browserSeconds:+(first.observedSeconds+second.observedSeconds).toFixed(3),
  sourceReportHashes:{first:createHash('sha256').update(firstText).digest('hex'),continuation:createHash('sha256').update(secondText).digest('hex')},
  recoveryFileSha256:second.continuation.payloadSha256,journey:second.finalJourney,
  limits:'Headless Edge, browser virtual time, and state-informed input. No human comprehension, listening, physical-device performance, broad seed fairness, or uninterrupted-run claim. The frozen runtime predates later title, UI, label, audio lifecycle, and event-reader changes that have separate checks.'};
await writeFile(join(folder,'linked-acceptance.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({result:report.result,checks:checks.length,encounters:report.encounters,wallSeconds:report.wallSeconds,browserSeconds:report.browserSeconds},null,2));
