import test from 'node:test';
import assert from 'node:assert/strict';
import {isCampaignEntryMenu} from '../src/interface.js';
import {launchAudioPreferences} from '../src/audio-interface.js';

test('the title menu includes a saved entry but excludes a live pause',()=>{
  const entry={mode:'campaign',phase:'paused',restoredCheckpoint:true,score:1750};
  const before=structuredClone(entry);
  assert.equal(isCampaignEntryMenu(entry),true);
  assert.equal(isCampaignEntryMenu({...entry,restoredCheckpoint:false}),false);
  assert.equal(isCampaignEntryMenu({...entry,phase:'running'}),false);
  assert.equal(isCampaignEntryMenu({mode:'campaign',phase:'ready'}),true);
  assert.equal(isCampaignEntryMenu({mode:'space',phase:'ready'}),false);
  assert.equal(isCampaignEntryMenu(null),false);
  assert.deepEqual(entry,before);
});

test('each launch enables audio without losing other saved settings',()=>{
  const saved={sound:false,music:false,volume:0,musicVolume:0,effectsVolume:.3,reducedMotion:true};
  const before=structuredClone(saved),launch=launchAudioPreferences(saved);
  assert.equal(launch.sound,true);assert.equal(launch.music,true);
  assert.equal(launch.volume,.5);assert.equal(launch.musicVolume,.55);
  assert.equal(launch.effectsVolume,.3);assert.equal(launch.reducedMotion,true);
  assert.deepEqual(saved,before);
  assert.equal(launchAudioPreferences({...saved,volume:.2,musicVolume:.8}).musicVolume,.8);
});
