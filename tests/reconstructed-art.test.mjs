import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

test('reconstructed editable art retains all exported pixels, dimensions, and identities',()=>{
  const result=JSON.parse(execFileSync(process.execPath,['tools/export-pixel-assets.mjs','--check'],{cwd:new URL('..',import.meta.url),encoding:'utf8'}));
  assert.equal(result.sprites,108);
  assert.equal(result.files.length,109);
  assert.ok(result.files.every(item=>/^[a-f0-9]{64}$/.test(item.rgbaSha256)));
});
