import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {resolve} from 'node:path';

test('The launcher serves this build and refuses an occupied save origin',async()=>{
  const entry=resolve(import.meta.dirname,'../tools/local-server.mjs');
  const server=spawn(process.execPath,[entry,'--port=0'],{windowsHide:true});
  let second;
  try{
    const url=await new Promise((accept,reject)=>{
      let text='';const timer=setTimeout(()=>reject(new Error('Server startup timed out.')),8000);
      server.once('error',reject);
      server.stdout.on('data',chunk=>{text+=chunk;const match=text.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);accept(match[0]);}});
    });
    const response=await fetch(url);
    assert.equal(response.status,200);
    assert.match(await response.text(),/Arrow Space Shift/);
    assert.equal((await fetch(new URL('.git/config',url))).status,403);
    assert.equal((await fetch(new URL('archive/workspace-v0.15.0-20261112/README.md',url))).status,403);
    second=spawn(process.execPath,[entry,`--port=${new URL(url).port}`],{windowsHide:true});
    let diagnostic='',output='';
    second.stderr.on('data',chunk=>diagnostic+=chunk);
    second.stdout.on('data',chunk=>output+=chunk);
    const [code]=await once(second,'exit');
    assert.equal(code,1);
    assert.match(diagnostic,/Close the previous game server/);
    assert.equal(output.includes('http://'),false,'Do not open a different build at the occupied origin.');
  }finally{
    server.kill();second?.kill();
  }
});
