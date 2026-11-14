import test from 'node:test';
import assert from 'node:assert/strict';
import {isCampaignEntryMenu} from '../src/interface.js';

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
