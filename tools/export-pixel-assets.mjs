import fs from 'node:fs/promises';
import {deflateSync,inflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {PALETTE,MANIFEST,sprites} from '../art/source/crossing.mjs';

const root=resolve(import.meta.dirname,'..');
const out=resolve(root,process.argv.find(value=>value.startsWith('--output='))?.slice(9)||'assets/crossing');
const check=process.argv.includes('--check'),refresh=process.argv.includes('--refresh-manifest');
const hash=value=>createHash('sha256').update(value).digest('hex');
const crc=data=>{let c=0xffffffff;for(const b of data){c^=b;for(let n=0;n<8;n++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
function chunk(name,data){const type=Buffer.from(name),body=Buffer.concat([type,data]),head=Buffer.alloc(4),tail=Buffer.alloc(4);head.writeUInt32BE(data.length);tail.writeUInt32BE(crc(body));return Buffer.concat([head,body,tail]);}
function png(w,h,pixels){
  const header=Buffer.alloc(13);header.writeUInt32BE(w);header.writeUInt32BE(h,4);header[8]=8;header[9]=6;
  const rows=Buffer.alloc(h*(1+w*4));for(let y=0;y<h;y++)pixels.copy(rows,y*(1+w*4)+1,y*w*4,(y+1)*w*4);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
}
function rgbaPng(bytes){
  if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Invalid PNG signature.');
  let width,height;const chunks=[];
  for(let offset=8;offset<bytes.length;){
    const length=bytes.readUInt32BE(offset),type=bytes.toString('ascii',offset+4,offset+8),data=bytes.subarray(offset+8,offset+8+length);
    if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);if(data[8]!==8||data[9]!==6||data[12])throw Error('Use non-interlaced RGBA8 PNGs.');}
    if(type==='IDAT')chunks.push(data);offset+=length+12;
  }
  const stride=width*4,raw=inflateSync(Buffer.concat(chunks)),pixels=Buffer.alloc(stride*height);
  if(raw.length!==height*(stride+1))throw Error('Invalid PNG row length.');
  for(let y=0;y<height;y++)for(let x=0;x<stride;x++){
    const filter=raw[y*(stride+1)],value=raw[y*(stride+1)+x+1],a=x>=4?pixels[y*stride+x-4]:0,b=y?pixels[(y-1)*stride+x]:0,c=y&&x>=4?pixels[(y-1)*stride+x-4]:0;
    const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c),paeth=pa<=pb&&pa<=pc?a:pb<=pc?b:c;
    if(filter>4)throw Error('Invalid PNG row filter.');
    pixels[y*stride+x]=(value+[0,a,b,Math.floor((a+b)/2),paeth][filter])&255;
  }
  return {width,height,pixels};
}
const colors=Object.fromEntries(Object.entries(PALETTE).map(([key,value])=>[key,Buffer.from([...value.slice(1).matchAll(/../g)].map(item=>parseInt(item[0],16)).concat(255))]));
const atlas=Buffer.alloc(MANIFEST.width*MANIFEST.height*4),outputs=[];
if(new Set(sprites.map(sprite=>sprite.id)).size!==sprites.length||sprites.length!==Object.keys(MANIFEST.frames).length)throw Error('Sprite identities differ.');
for(const sprite of sprites){
  const frame=MANIFEST.frames[sprite.id],pixels=Buffer.alloc(sprite.width*sprite.height*4);
  if(!frame||frame.width!==sprite.width||frame.height!==sprite.height||sprite.pixels.length!==sprite.height)throw Error(`Dimensions differ: ${sprite.id}`);
  if(frame.x<0||frame.y<0||frame.x+sprite.width>MANIFEST.width||frame.y+sprite.height>MANIFEST.height)throw Error(`Frame leaves atlas: ${sprite.id}`);
  for(let y=0;y<sprite.height;y++){
    if(sprite.pixels[y].length!==sprite.width)throw Error(`Row width differs: ${sprite.id}`);
    for(let x=0;x<sprite.width;x++){
      const token=sprite.pixels[y][x];if(token==='.')continue;
      if(!colors[token])throw Error(`Unknown palette token: ${sprite.id}: ${token}`);
      colors[token].copy(pixels,(y*sprite.width+x)*4);
      colors[token].copy(atlas,((frame.y+y)*MANIFEST.width+frame.x+x)*4);
    }
  }
  outputs.push({file:frame.file,width:sprite.width,height:sprite.height,pixels});
}
outputs.push({file:MANIFEST.atlas,width:MANIFEST.width,height:MANIFEST.height,pixels:atlas});
await fs.mkdir(out,{recursive:true});const records=[];
for(const item of outputs){
  let bytes;
  if(check||refresh){
    bytes=await fs.readFile(resolve(out,item.file));const decoded=rgbaPng(bytes);
    if(decoded.width!==item.width||decoded.height!==item.height||!decoded.pixels.equals(item.pixels))throw Error(`Export pixels differ: ${item.file}`);
  }else{bytes=png(item.width,item.height,item.pixels);await fs.writeFile(resolve(out,item.file),bytes);}
  records.push({file:item.file,sha256:hash(bytes),rgbaSha256:hash(item.pixels)});
}
const sourceHash=hash(await fs.readFile(resolve(root,'art/source/crossing.mjs')));
const manifest={...MANIFEST,sourceSha256:sourceHash,atlasSha256:records.find(item=>item.file===MANIFEST.atlas).sha256};
if(check){
  const current=JSON.parse(await fs.readFile(resolve(out,'manifest.json'),'utf8'));
  if(current.sourceSha256!==sourceHash||current.atlasSha256!==manifest.atlasSha256)throw Error('Manifest hashes differ.');
}else await fs.writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({mode:check?'check':refresh?'manifest refresh':'export',sprites:sprites.length,sourceSha256:sourceHash,files:records},null,2));
