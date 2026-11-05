import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {inflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {PALETTE,sprites} from '../art/source/crossing.mjs';
import {PixelArt,enemyArt} from '../src/pixel-art.js';
const manifest=JSON.parse(fs.readFileSync('assets/crossing/manifest.json'));
function decode(file){const b=fs.readFileSync(file);assert.equal(b.subarray(1,4).toString(),'PNG');let w,h;const parts=[];for(let pos=8;pos<b.length;){const size=b.readUInt32BE(pos),type=b.toString('ascii',pos+4,pos+8),data=b.subarray(pos+8,pos+8+size);if(type==='IHDR'){w=data.readUInt32BE(0);h=data.readUInt32BE(4);assert.equal(data[8],8);assert.equal(data[9],6);}if(type==='IDAT')parts.push(data);pos+=size+12;}const raw=inflateSync(Buffer.concat(parts)),pixels=[];for(let y=0;y<h;y++){assert.equal(raw[y*(w*4+1)],0);for(let x=0;x<w;x++)pixels.push([...raw.subarray(y*(w*4+1)+1+x*4,y*(w*4+1)+5+x*4)]);}return {w,h,pixels};}
test('Pixel exports use only the specified colors and binary transparency',()=>{
  const allowed=new Set(Object.values(PALETTE).map(v=>v.toLowerCase()));
  for(const sprite of sprites){const decoded=decode(`assets/crossing/${sprite.id}.png`);assert.equal(decoded.w,sprite.width);assert.equal(decoded.h,sprite.height);assert.ok(decoded.pixels.some(p=>p[3]===0));assert.ok(decoded.pixels.some(p=>p[3]===255));for(const p of decoded.pixels){assert.ok(p[3]===0||p[3]===255);if(p[3])assert.ok(allowed.has('#'+p.slice(0,3).map(n=>n.toString(16).padStart(2,'0')).join('')));}}
});
test('The exported atlas and source match the recorded identities',()=>{
  const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');assert.equal(hash('assets/crossing/atlas.png'),manifest.atlasSha256);assert.equal(hash('art/source/crossing.mjs'),manifest.sourceSha256);assert.equal(Object.keys(manifest.frames).length,42);
});
test('Sprite cells have valid bounds and do not overlap in the atlas',()=>{
  const cells=Object.values(manifest.frames);for(const [i,a] of cells.entries()){assert.ok(a.x>=0&&a.y>=0&&a.x+a.width<=manifest.width&&a.y+a.height<=manifest.height);for(const b of cells.slice(i+1))assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y);}
});
test('The four enemy masks and three asteroid masks are different',()=>{
  const masks=ids=>ids.map(id=>sprites.find(s=>s.id===id).pixels.map(row=>row.replace(/[^.]/g,'#')).join('\n'));
  assert.equal(new Set(masks(['enemy.scout','enemy.gunner','enemy.heavy','enemy.klein'])).size,4);assert.equal(new Set(masks(['asteroid.small','asteroid.medium','asteroid.large'])).size,3);
});
test('Art selection preserves damaged and facing-specific forms without changing actor state',()=>{
  const e={id:1,hp:1,maxHp:2},before=structuredClone(e);assert.equal(enemyArt(e),'enemy.heavy-damaged');assert.equal(enemyArt(e,true),'enemy.klein');assert.deepEqual(e,before);assert.ok(manifest.frames['enemy.heavy-damaged-up']);assert.ok(manifest.frames['player.arrow-down']);
});
test('The break animation follows the declared frame durations and stops',()=>{
  const art=new PixelArt();art.manifest=manifest;assert.equal(art.animationFrame('asteroid.break',0),'asteroid.break-0');assert.equal(art.animationFrame('asteroid.break',89),'asteroid.break-0');assert.equal(art.animationFrame('asteroid.break',90),'asteroid.break-1');assert.equal(art.animationFrame('asteroid.break',180),'asteroid.break-2');assert.equal(art.animationFrame('asteroid.break',300),null);
});
test('Edge rails join without gaps at their repeat boundaries',()=>{
  for(const id of ['edge.left','edge.right']){const s=sprites.find(s=>s.id===id);assert.equal(s.pixels[0],s.pixels.at(-1));}
  for(const id of ['edge.top','edge.bottom']){const s=sprites.find(s=>s.id===id);assert.equal(s.pixels.map(row=>row[0]).join(''),s.pixels.map(row=>row.at(-1)).join(''));}
});
