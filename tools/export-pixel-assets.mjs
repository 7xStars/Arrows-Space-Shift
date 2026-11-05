import fs from 'node:fs/promises';
import {deflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {PALETTE,sprites} from '../art/source/crossing.mjs';
const out='assets/crossing';await fs.mkdir(out,{recursive:true});
const crc=data=>{let c=0xffffffff;for(const b of data){c^=b;for(let n=0;n<8;n++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
function chunk(name,data){const type=Buffer.from(name),body=Buffer.concat([type,data]),head=Buffer.alloc(4),tail=Buffer.alloc(4);head.writeUInt32BE(data.length);tail.writeUInt32BE(crc(body));return Buffer.concat([head,body,tail]);}
function png(w,h,pixels){const header=Buffer.alloc(13);header.writeUInt32BE(w);header.writeUInt32BE(h,4);header[8]=8;header[9]=6;const rows=Buffer.alloc(h*(1+w*4));for(let y=0;y<h;y++){rows[y*(1+w*4)]=0;Buffer.from(pixels.slice(y*w*4,(y+1)*w*4)).copy(rows,y*(1+w*4)+1);}return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);}
const rgba=hex=>[...hex.slice(1).matchAll(/../g)].map(m=>parseInt(m[0],16)).concat(255);
const colors=Object.fromEntries(Object.entries(PALETTE).map(([k,v])=>[k,rgba(v)]));
function surface(w,h,bg=null){const p=new Uint8Array(w*h*4);if(bg)for(let i=0;i<w*h;i++)p.set(rgba(bg),i*4);return {w,h,p};}
function dot(s,x,y,c){x=Math.round(x);y=Math.round(y);if(x>=0&&x<s.w&&y>=0&&y<s.h)s.p.set(c,(y*s.w+x)*4);}
function rect(s,x,y,w,h,c){const color=typeof c==='string'?rgba(c):c;for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++)dot(s,x+dx,y+dy,color);}
function draw(s,sprite,x,y,scale=1,mode=null,flip=false){for(let py=0;py<sprite.height;py++)for(let px=0;px<sprite.width;px++){
  const token=sprite.pixels[py][px];if(token==='.')continue;let color=colors[token];
  if(mode==='silhouette')color=[0,0,0,255];if(mode==='gray'){const gray=Math.round(color[0]*.2126+color[1]*.7152+color[2]*.0722);color=[gray,gray,gray,255];}
  rect(s,x+px*scale,y+(flip?sprite.height-1-py:py)*scale,scale,scale,color);
}}
const glyphs={
 A:'01110/10001/10001/11111/10001/10001/10001',B:'11110/10001/10001/11110/10001/10001/11110',C:'01111/10000/10000/10000/10000/10000/01111',D:'11110/10001/10001/10001/10001/10001/11110',E:'11111/10000/10000/11110/10000/10000/11111',F:'11111/10000/10000/11110/10000/10000/10000',G:'01111/10000/10000/10111/10001/10001/01111',H:'10001/10001/10001/11111/10001/10001/10001',I:'11111/00100/00100/00100/00100/00100/11111',J:'00111/00010/00010/00010/10010/10010/01100',K:'10001/10010/10100/11000/10100/10010/10001',L:'10000/10000/10000/10000/10000/10000/11111',M:'10001/11011/10101/10101/10001/10001/10001',N:'10001/11001/10101/10011/10001/10001/10001',O:'01110/10001/10001/10001/10001/10001/01110',P:'11110/10001/10001/11110/10000/10000/10000',Q:'01110/10001/10001/10001/10101/10010/01101',R:'11110/10001/10001/11110/10100/10010/10001',S:'01111/10000/10000/01110/00001/00001/11110',T:'11111/00100/00100/00100/00100/00100/00100',U:'10001/10001/10001/10001/10001/10001/01110',V:'10001/10001/10001/10001/10001/01010/00100',W:'10001/10001/10001/10101/10101/10101/01010',X:'10001/10001/01010/00100/01010/10001/10001',Y:'10001/10001/01010/00100/00100/00100/00100',Z:'11111/00001/00010/00100/01000/10000/11111',
 0:'01110/10001/10011/10101/11001/10001/01110',1:'00100/01100/00100/00100/00100/00100/01110',2:'01110/10001/00001/00010/00100/01000/11111',3:'11110/00001/00001/01110/00001/00001/11110',4:'00010/00110/01010/10010/11111/00010/00010',5:'11111/10000/10000/11110/00001/00001/11110',6:'01110/10000/10000/11110/10001/10001/01110',7:'11111/00001/00010/00100/01000/01000/01000',8:'01110/10001/10001/01110/10001/10001/01110',9:'01110/10001/10001/01111/00001/00001/01110',
 '#':'01010/11111/01010/01010/11111/01010/00000','-':'00000/00000/00000/11111/00000/00000/00000','/':'00001/00001/00010/00100/01000/10000/10000',':':'00000/00100/00100/00000/00100/00100/00000', '.':'00000/00000/00000/00000/00000/00100/00100',
};
function text(s,str,x,y,scale=1,c=PALETTE.O){for(const char of str.toUpperCase()){const glyph=glyphs[char]?.split('/');if(glyph)for(let dy=0;dy<7;dy++)for(let dx=0;dx<5;dx++)if(glyph[dy][dx]==='1')rect(s,x+dx*scale,y+dy*scale,scale,scale,c);x+=6*scale;}}
const byId=Object.fromEntries(sprites.map(s=>[s.id,s])),atlas=surface(320,Math.ceil(sprites.length/8)*40),frames={};
for(const [i,s] of sprites.entries()){
  if(s.pixels.length!==s.height||s.pixels.some(row=>row.length!==s.width))throw Error(`Invalid dimensions: ${s.id}`);
  for(const row of s.pixels)for(const c of row)if(c!=='.'&&!PALETTE[c])throw Error(`Invalid color: ${s.id}`);
  const tile=surface(s.width,s.height);draw(tile,s,0,0);await fs.writeFile(`${out}/${s.id}.png`,png(s.width,s.height,tile.p));
  const x=i%8*40+4,y=Math.floor(i/8)*40+4;draw(atlas,s,x,y);frames[s.id]={x,y,width:s.width,height:s.height,pivot:[s.width/2,s.height/2],file:`${s.id}.png`};
}
const atlasFile=png(atlas.w,atlas.h,atlas.p);await fs.writeFile(`${out}/atlas.png`,atlasFile);
const source=await fs.readFile('art/source/crossing.mjs');
const manifest={version:1,id:'crossing-v1',palette:PALETTE,atlas:'atlas.png',width:atlas.w,height:atlas.h,filter:'nearest',alpha:'binary',source:'art/source/crossing.mjs',sourceSha256:createHash('sha256').update(source).digest('hex'),atlasSha256:createHash('sha256').update(atlasFile).digest('hex'),frames,animations:{'asteroid.break':{frames:['asteroid.break-0','asteroid.break-1','asteroid.break-2'],durationsMs:[90,90,120],loop:false}}};
await fs.writeFile(`${out}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');await fs.writeFile('art/source/crossing-pixels.json',JSON.stringify({palette:PALETTE,sprites},null,2)+'\n');
const sheet=surface(960,1230,PALETTE.a);
function panel(title,x,y,w,h){rect(sheet,x,y,w,1,PALETTE.O);rect(sheet,x,y+h,w,1,PALETTE.O);rect(sheet,x,y,1,h,PALETTE.O);rect(sheet,x+w,y,1,h,PALETTE.O);text(sheet,title,x+12,y+10,2);}
text(sheet,'ARROW SPACE SHIFT',20,16,3);text(sheet,'THE CROSSING / GRID 16 / ICON 32 / LIGHT TOP LEFT',20,47,1);
panel('ENEMIES - DOWN / PLAYER - UP',16,72,440,214);
for(const [i,id] of ['player.arrow','enemy.scout','enemy.gunner','enemy.heavy','enemy.klein'].entries()){draw(sheet,byId[id],36+i*80,118,4);text(sheet,['ARROW','SCOUT','GUNNER','HEAVY','KLEIN'][i],34+i*80,193,1);}
draw(sheet,byId['icon.klein'],44,211,2);text(sheet,'KLEIN ICON 32',130,233,2);
panel('HEALTH AND RETURN',472,72,472,214);
for(let n=1;n<=4;n++){draw(sheet,byId[`health.${n}`],482+n*82,109,3);draw(sheet,byId['enemy.heavy'],482+n*82,125,3);text(sheet,String(n),500+n*82,180,1);}
draw(sheet,byId['enemy.heavy-damaged'],492,207,3);draw(sheet,byId['health.2'],492,195,3);draw(sheet,byId['return.exit'],594,207,3);draw(sheet,byId['return.entry'],730,207,3);text(sheet,'DAMAGED',486,267);text(sheet,'ESCAPES BELOW',575,267);text(sheet,'RETURNS ABOVE',710,267);
panel('ASTEROIDS / BREAK / GLINT',16,304,440,214);
draw(sheet,byId['asteroid.large'],32,340,3);draw(sheet,byId['asteroid.medium'],160,350,3);draw(sheet,byId['asteroid.small'],242,360,3);text(sheet,'32',65,440);text(sheet,'16',173,411);text(sheet,'8',250,398);
for(let i=0;i<3;i++){draw(sheet,byId[`asteroid.break-${i}`],160+i*70,452,3);text(sheet,`F${i}`,175+i*70,505);}
draw(sheet,byId['effect.glint'],318,340,3);draw(sheet,byId['effect.absorb'],383,340,3);text(sheet,'GLINT',316,402);text(sheet,'ABSORB',378,402);
panel('KLEIN EDGE TILES AND CROSSING',472,304,472,214);
for(const [i,id] of ['edge.left','edge.right','edge.twist','edge.top','edge.bottom'].entries()){draw(sheet,byId[id],490+i*82,342,3);text(sheet,['LEFT','RIGHT','TWIST','TOP','BOTTOM'][i],492+i*82,396);}
for(let i=0;i<3;i++){
  const x=492+i*144;rect(sheet,x,424,128,72,PALETTE.D);rect(sheet,x,424,1,72,PALETTE.F);rect(sheet,x+127,424,1,72,PALETTE.U);
  draw(sheet,byId['enemy.klein'],x+[90,112,3][i],424+[8,16,48][i],1,null,i===2);text(sheet,['APPROACH','EXIT RIGHT','ENTER LEFT'][i],x,504);
}
panel('ROUTE MARKERS',16,536,440,128);for(let i=0;i<8;i++){draw(sheet,byId[`stage.${i}`],30+i*52,578,2);text(sheet,`S${i}`,38+i*52,626);}
panel('QUIET BELT',472,536,232,314);rect(sheet,496,573,160,224,PALETTE.D);
for(let y=0;y<7;y++)for(let x=0;x<5;x++)if((x+y)%3===0)rect(sheet,510+x*30,582+y*30,1,1,PALETTE.G);
draw(sheet,byId['player.arrow'],560,754,2);draw(sheet,byId['asteroid.large'],500,600,2);draw(sheet,byId['asteroid.medium'],608,666,2);draw(sheet,byId['asteroid.small'],530,722,2);draw(sheet,byId['shot.enemy'],624,646,2);draw(sheet,byId['effect.absorb'],606,660,2);text(sheet,'5 X 7 / NO ENEMY / NO HUD',484,818);
panel('SCALE CHECK',16,682,440,168);
for(const [i,id] of ['player.arrow','enemy.scout','enemy.gunner','enemy.heavy','enemy.klein','asteroid.small','asteroid.medium','asteroid.large'].entries()){draw(sheet,byId[id],35+i*49,722);draw(sheet,byId[id],28+i*49,770);}
text(sheet,'NATIVE PIXELS / PLAYER 16 / ROCKS 8 16 32',28,826);
panel('COLOR PALETTE',16,870,928,140);
const roles=['OUTLINE','LIGHT','MID','SHADOW','SPACE','GLOW','FOLD','UNFOLD','S0','S1','S2','S3','S4','S5','S6'];
for(const [i,[key,value]] of Object.entries(PALETTE).entries()){const x=29+i*60;rect(sheet,x,910,44,34,value);text(sheet,roles[i],x,954);text(sheet,value,x,971);}
text(sheet,'S7: DIAGONAL FOLD / UNFOLD',28,994);
panel('READABILITY - SILHOUETTES AND GRAYSCALE',16,1030,928,180);
for(const [i,id] of ['enemy.scout','enemy.gunner','enemy.heavy','enemy.klein','asteroid.small','asteroid.medium','asteroid.large'].entries()){
  const x=45+i*124;draw(sheet,byId[id],x,1073,1,'silhouette');draw(sheet,byId[id],x,1134,1,'gray');text(sheet,id.split('.').at(-1),x,1180);
}
text(sheet,'NATIVE SIZE / GEOMETRY CHECK ONLY / HUMAN RECOGNITION NOT TESTED',28,1099);
await fs.writeFile('art/crossing-production-sheet.png',png(sheet.w,sheet.h,sheet.p));
console.log(JSON.stringify({sprites:sprites.length,atlas:[atlas.w,atlas.h],sourceSha256:manifest.sourceSha256,atlasSha256:manifest.atlasSha256},null,2));
