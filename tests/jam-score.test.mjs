import test from 'node:test';
import assert from 'node:assert/strict';
import {SCORE_THEMES,scoreThemeFor,FlightAudio} from '../src/audio.js';
import {createFlight} from '../src/simulation.js';
import {enterChapter} from '../src/campaign.js';
import {BUILD} from '../src/build.js';
import {readFileSync} from 'node:fs';

test('original score shares a contour but changes by act and relay recovery',()=>{
 const s=createFlight('campaign',{seed:7});
 enterChapter(s,0);assert.equal(scoreThemeFor(s),'traditional');
 enterChapter(s,9);assert.equal(scoreThemeFor(s),'klein');
 enterChapter(s,18);assert.equal(scoreThemeFor(s),'projective');
 enterChapter(s,8);s.campaign.bossPhase='salvage';assert.equal(scoreThemeFor(s),'recovery');
 for(const theme of Object.values(SCORE_THEMES)){
  assert.equal(theme.lead.length,16);assert.equal(theme.bass.length,16);
  assert.ok(theme.bpm>=84&&theme.bpm<150);
  assert.equal(theme.lead[0],62,'the act variations retain the shared opening motif');
  assert.ok(theme.bass.every(note=>note===null||Number.isInteger(note)));
  assert.ok(Object.isFrozen(theme));
 }
 assert.equal(BUILD.version,JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version);
});
test('music is opt-out and audio remains silent until explicit browser unlock',()=>{
 const audio=new FlightAudio();assert.equal(audio.options.music,true);
 assert.equal(audio.context,null);audio.process(createFlight('space',{seed:2}));assert.equal(audio.context,null);
 audio.setOptions({sound:false,music:false});assert.equal(audio.ambient,null);
});
