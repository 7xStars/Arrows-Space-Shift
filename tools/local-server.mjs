import http from 'node:http';
import {execFile} from 'node:child_process';
import {stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {BUILD} from '../src/build.js';
const root=resolve(import.meta.dirname,'..');
const portArgument=process.argv.find(arg=>arg.startsWith('--port='));
const port=Number(portArgument?.slice(7)??process.env.ASS_PORT??4177);
if(!Number.isInteger(port)||port<0||port>65535)throw new RangeError('Use a port from 0 to 65535.');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.wav':'audio/wav','.ogg':'audio/ogg'};
const server=http.createServer(async (req,res)=>{
  try {
    const pathName=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    const path=resolve(root, '.'+ (pathName==='/'?'/index.html':pathName));
    if(!path.startsWith(root+sep)&&path!==root)throw Object.assign(new Error('Forbidden'),{status:403});
    const relative=path.slice(root.length+1).split(sep);
    if(relative.some(part=>part.startsWith('.'))||['archive','imports','releases'].includes(relative[0]))throw Object.assign(new Error('Forbidden'),{status:403});
    const info=await stat(path);if(!info.isFile())throw Object.assign(new Error('Not a file'),{status:404});
    const headers={'Content-Type':types[extname(path)]||'application/octet-stream','Content-Length':info.size,'Cache-Control':'no-store','Accept-Ranges':'bytes'};
    if(req.method==='HEAD'){res.writeHead(200,headers);res.end();return;}
    let start=0,end=info.size-1,status=200;
    // Ignore unsupported range forms and If-Range without a matching validator.
    const range=req.method==='GET'&&!req.headers['if-range']&&info.size>0?/^bytes=(\d*)-(\d*)$/i.exec(req.headers.range||''):null;
    if(range&&(range[1]||range[2])){
      const size=BigInt(info.size),first=range[1]?BigInt(range[1]):null,last=range[2]?BigInt(range[2]):null;
      if((first!==null&&(first>=size||(last!==null&&last<first)))||(first===null&&last===0n)){
        res.writeHead(416,{...headers,'Content-Length':0,'Content-Range':`bytes */${info.size}`});res.end();return;
      }
      start=Number(first===null?(last>=size?0n:size-last):first);
      end=Number(first===null||last===null||last>=size?size-1n:last);status=206;
      headers['Content-Length']=end-start+1;headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;
    }
    res.writeHead(status,headers);
    if(info.size===0){res.end();return;}
    const stream=createReadStream(path,{start,end});
    stream.on('error',error=>res.destroy(error));res.on('close',()=>stream.destroy());stream.pipe(res);
  }catch(err){res.writeHead(err.status||404);res.end(err.message);}
});
server.on('error',error=>{
  console.error(error.code==='EADDRINUSE'?`Port ${port} is in use. Close the previous game server, then start this build again. Keep the same port to retain browser saves.`:error.message);
  process.exitCode=1;
});
server.listen(port,'127.0.0.1',function(){
  const url=`http://127.0.0.1:${this.address().port}/`;
  console.log(`Arrow Space Shift v${BUILD.version} at ${url}`);
  console.log(`Source: ${root}`);
  console.log('The default port stays the same to retain browser saves.');
  if(process.argv.includes('--open')&&process.platform==='win32')
    execFile('cmd',['/c','start','',url],{windowsHide:true},err=>{if(err)console.log(`Open ${url} manually.`);});
});
