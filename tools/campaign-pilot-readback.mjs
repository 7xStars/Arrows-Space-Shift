/** Change only the running Node controller's copied readback. Never change game state. */
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const pid=Number(process.argv[2]),output=resolve(process.argv[3]||'reports/campaign-concept-review/readback-instrumentation.json');
if(!Number.isInteger(pid)||pid<=0)throw new Error('A controller process ID is required.');
const report={pid,scope:'Node automation only. Keep all actors and projectiles. Trim only the copied event records returned through Playwright.',started:new Date().toISOString(),changed:false};
let socket,sequence=0,breakpoint,paused=false;
const pending=new Map(),events=new Map();
const request=(method,params={})=>new Promise((accept,reject)=>{const id=++sequence;pending.set(id,{accept,reject});socket.send(JSON.stringify({id,method,params}));});
const wait=(method,timeout=15000)=>new Promise((accept,reject)=>{const timer=setTimeout(()=>reject(new Error(`No ${method} event.`)),timeout);events.set(method,value=>{clearTimeout(timer);accept(value);});});
try{
  process._debugProcess(pid);
  let target;
  for(let i=0;i<50&&!target;i++){
    try{const list=await fetch('http://127.0.0.1:9229/json/list').then(response=>response.json());target=list.find(item=>item.url?.includes('campaign-full-browser.mjs'));}catch{}
    if(!target)await new Promise(resolve=>setTimeout(resolve,100));
  }
  if(!target)throw new Error('The expected controller inspector is unavailable.');
  report.target={id:target.id,url:target.url};
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((accept,reject)=>{socket.addEventListener('open',accept,{once:true});socket.addEventListener('error',reject,{once:true});});
  socket.addEventListener('message',event=>{
    const value=JSON.parse(event.data);
    if(value.id){const job=pending.get(value.id);if(!job)return;pending.delete(value.id);if(value.error)job.reject(new Error(JSON.stringify(value.error)));else job.accept(value.result);}
    else if(value.method){if(value.method==='Debugger.paused')paused=true;if(value.method==='Debugger.resumed')paused=false;const handler=events.get(value.method);if(handler){events.delete(value.method);handler(value.params);}}
  });
  await request('Debugger.enable');
  const pause=wait('Debugger.paused');
  breakpoint=(await request('Debugger.setBreakpointByUrl',{urlRegex:'campaign-full-browser\\.mjs$',lineNumber:128})).breakpointId;
  const stopped=await pause,frame=stopped.callFrames.find(frame=>frame.url===target.url)||stopped.callFrames[0];
  const result=await request('Debugger.evaluateOnCallFrame',{callFrameId:frame.callFrameId,returnByValue:true,expression:`(()=>{
    if(!page||typeof page.evaluate!=='function'||report.runtimeReadbackTrim)return {changed:false};
    const original=page.evaluate.bind(page);
    page.evaluate=function(fn,...args){
      if(typeof fn==='function'&&fn.toString().replaceAll(' ','')==='()=>window.arrowSpaceShift.read()'){
        return original(()=>{const snapshot=window.arrowSpaceShift.read();snapshot.events=snapshot.events.slice(-200);return snapshot;});
      }
      return original(fn,...args);
    };
    report.runtimeReadbackTrim={at:new Date().toISOString(),eventLimit:200,scope:'Only the cloned readback sent to the Node controller. The simulation log and all physical objects remain unchanged.',damageRecord:'damageObservations'};
    return {changed:true,progress:report.progress,record:report.runtimeReadbackTrim};
  })()`});
  if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));
  report.result=result.result.value;report.changed=report.result?.changed===true;
  await request('Debugger.removeBreakpoint',{breakpointId:breakpoint});breakpoint=null;
  await request('Debugger.resume');paused=false;
}catch(error){report.error=error.stack||error.message;}
finally{
  if(socket?.readyState===WebSocket.OPEN){
    if(breakpoint)try{await request('Debugger.removeBreakpoint',{breakpointId:breakpoint});}catch{}
    if(paused)try{await request('Debugger.resume');}catch{}
    try{await request('Debugger.disable');}catch{}
    socket.close();
  }
  await writeFile(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(report.error)process.exitCode=1;
}
