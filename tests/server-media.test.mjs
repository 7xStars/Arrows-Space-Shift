import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {stat,readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';

test('local media supplies accurate full, HEAD, and byte-range responses for native seeking',async()=>{
  const root=resolve(import.meta.dirname,'..'),path='assets/audio/stc-operator-lab-r1/dry.wav';
  const info=await stat(join(root,path));
  const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
  try{
    const url=await new Promise((accept,reject)=>{let output='';const timer=setTimeout(()=>reject(new Error('The server did not start.')),10000);
      server.once('error',reject);server.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);accept(match[0]);}});});
    const head=await fetch(new URL(path,url),{method:'HEAD'});
    assert.equal(head.status,200);assert.equal(head.headers.get('content-type'),'audio/wav');
    assert.equal(Number(head.headers.get('content-length')),info.size);assert.equal((await head.arrayBuffer()).byteLength,0);
    assert.equal(head.headers.get('accept-ranges'),'bytes');
    const response=await fetch(new URL(path,url)),data=new Uint8Array(await response.arrayBuffer());
    assert.equal(response.status,200);assert.equal(Number(response.headers.get('content-length')),data.length);
    assert.equal(data.length,info.size);assert.equal(new TextDecoder().decode(data.slice(0,4)),'RIFF');
    const expected=await readFile(join(root,path));
    for(const [range,start,end]of [['bytes=0-43',0,43],['bytes=100-199',100,199],['bytes=-128',info.size-128,info.size-1],
      [`bytes=${info.size-64}-`,info.size-64,info.size-1],['bytes=0-999999999999999999999999999999999999',0,info.size-1],
      ['bytes=-999999999999999999999999999999999999',0,info.size-1]]){
      const partial=await fetch(new URL(path,url),{headers:{Range:range}});
      assert.equal(partial.status,206);assert.equal(partial.headers.get('content-range'),`bytes ${start}-${end}/${info.size}`);
      assert.equal(Number(partial.headers.get('content-length')),end-start+1);
      assert.deepEqual(new Uint8Array(await partial.arrayBuffer()),new Uint8Array(expected.subarray(start,end+1)));
    }
    for(const range of [`bytes=${info.size}-`,'bytes=100-99','bytes=-0','bytes=999999999999999999999999999999999999-']){
      const rejected=await fetch(new URL(path,url),{headers:{Range:range}});
      assert.equal(rejected.status,416);assert.equal(rejected.headers.get('content-range'),`bytes */${info.size}`);
      assert.equal((await rejected.arrayBuffer()).byteLength,0);
    }
    for(const range of ['items=0-1','bytes=0-1,4-5','bytes=wrong']){
      const ignored=await fetch(new URL(path,url),{headers:{Range:range}});
      assert.equal(ignored.status,200);assert.equal(ignored.headers.get('content-range'),null);
      assert.equal((await ignored.arrayBuffer()).byteLength,info.size);
    }
    const rangeHead=await fetch(new URL(path,url),{method:'HEAD',headers:{Range:'bytes=0-43'}});
    assert.equal(rangeHead.status,200);assert.equal(rangeHead.headers.get('content-range'),null);
    assert.equal(Number(rangeHead.headers.get('content-length')),info.size);assert.equal((await rangeHead.arrayBuffer()).byteLength,0);
    const conditional=await fetch(new URL(path,url),{headers:{Range:'bytes=0-43','If-Range':'"unknown"'}});
    assert.equal(conditional.status,200);assert.equal((await conditional.arrayBuffer()).byteLength,info.size);
  }finally{server.kill();}
});
