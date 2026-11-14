import {openSync,readSync,writeSync,closeSync,fstatSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import assert from 'node:assert/strict';
const [raw,fullPath,corePath,airPath,metricsPath,secondsText]=process.argv.slice(2),seconds=Number(secondsText),rate=48000,frames=seconds*rate;
assert.ok(raw&&metricsPath&&Number.isInteger(frames)&&seconds>=60&&seconds<=360);
const input=openSync(raw,'r'),header=Buffer.alloc(12);readSync(input,header,0,12,0);
assert.equal(header.toString('ascii',0,4),'RIFF');assert.equal(header.toString('ascii',8,12),'WAVE');
let position=12,dataStart,format;
while(position+8<fstatSync(input).size){
  const chunk=Buffer.alloc(8);readSync(input,chunk,0,8,position);const size=chunk.readUInt32LE(4),name=chunk.toString('ascii',0,4);
  if(name==='fmt '){format=Buffer.alloc(size);readSync(input,format,0,size,position+8);}
  if(name==='data'){dataStart=position+8;assert.ok(size>=frames*16);break;}
  position+=8+size+(size%2);
}
assert.ok(dataStart&&format);assert.equal(format.readUInt16LE(2),4);assert.equal(format.readUInt32LE(4),rate);
assert.equal(format.readUInt16LE(14),32);assert.ok([3,65534].includes(format.readUInt16LE(0)));
const blockFrames=8192,block=Buffer.alloc(blockFrames*16),peaks=[0,0,0],squares=[0,0,0],regions=Array.from({length:8},()=>({squares:0,count:0}));
let nonFinite=0;
const fade=frame=>Math.min(1,frame/(rate*.02),Math.max(0,(frames-1-frame)/(rate*3)));
for(let frame=0;frame<frames;frame+=blockFrames){
  const count=Math.min(blockFrames,frames-frame);assert.equal(readSync(input,block,0,count*16,dataStart+frame*16),count*16);
  for(let i=0;i<count;i++)for(let channel=0;channel<2;channel++){
    const core=block.readFloatLE(i*16+channel*4)*fade(frame+i),air=block.readFloatLE(i*16+8+channel*4)*fade(frame+i),values=[core+air,core,air];
    for(let j=0;j<3;j++){const value=values[j];if(!Number.isFinite(value))nonFinite++;peaks[j]=Math.max(peaks[j],Math.abs(value));squares[j]+=value*value;}
    const region=regions[Math.min(7,Math.floor((frame+i)/frames*8))];region.squares+=values[0]**2;region.count++;
  }
}
assert.equal(nonFinite,0);assert.ok(peaks[0]>.001);
const rms=squares.map(value=>Math.sqrt(value/(frames*2))),gain=Math.min(.17/rms[0],.82/Math.max(...peaks),2.5);
const paths=[fullPath,corePath,airPath],outputs=paths.map(path=>{mkdirSync(dirname(path),{recursive:true});const fd=openSync(path,'w'),h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(36+frames*4,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(2,22);h.writeUInt32LE(rate,24);h.writeUInt32LE(rate*4,28);h.writeUInt16LE(4,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(frames*4,40);writeSync(fd,h);return fd;});
const pcm=outputs.map(()=>Buffer.alloc(blockFrames*4));let fullScale=0;
for(let frame=0;frame<frames;frame+=blockFrames){
  const count=Math.min(blockFrames,frames-frame);readSync(input,block,0,count*16,dataStart+frame*16);
  for(let i=0;i<count;i++)for(let channel=0;channel<2;channel++){
    const core=block.readFloatLE(i*16+channel*4)*fade(frame+i)*gain,air=block.readFloatLE(i*16+8+channel*4)*fade(frame+i)*gain;
    for(const [j,value]of [core+air,core,air].entries()){if(Math.abs(value)>=1)fullScale++;assert.ok(Math.abs(value)<1);pcm[j].writeInt16LE(Math.round(value*32767),i*4+channel*2);}
  }
  for(let j=0;j<3;j++)writeSync(outputs[j],pcm[j],0,count*4);
}
closeSync(input);for(const fd of outputs)closeSync(fd);
const result={frames,sampleRate:rate,channels:2,seconds,nonFinite,fullScale,commonGain:gain,peaks:peaks.map(value=>value*gain),rms:rms.map(value=>value*gain),
  regionRms:regions.map(region=>Math.sqrt(region.squares/region.count)*gain),
  mix:'One common linear gain for full, core, and atmosphere. No independent normalization or shared nonlinear processor.',
  tail:'Exact track duration includes the final three-second fade. No seamless-loop claim.'};
writeFileSync(metricsPath,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
