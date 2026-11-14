import {MATRIX_MODELS,MOTION_PROFILES,apply2,operatorTrajectory,sampleMechanical,stepMechanical,advanceTopology,forecastTopology,TOPOLOGY_MODELS} from './operator-models.js';
import {OPERATOR_GRAMMAR,recordFirstPrediction} from './operator-registry.js';
const $=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg',fmt=value=>Number(value).toFixed(3);
const records=[],events=[];let active='motion',reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,lastFrame=0;
const motion={time:0,running:false},space={projectile:null,segments:[],crossings:[],running:false,revealed:false};
let motionData,catalog=null,analysis=null,clipIds=[],audioReady=false,grammarOpened=false,eventSequence=0,playbackGeneration=0;
const initialMotion={position:0,velocity:0},player=$('sound-player');
function event(type,data={}){events.push(Object.freeze({...structuredClone(data),id:++eventSequence,type,scope:'operator-lab'}));if(events.length>128)events.shift();}
function node(name,attributes={},text){const element=document.createElementNS(ns,name);for(const [key,value]of Object.entries(attributes))element.setAttribute(key,value);if(text!==undefined)element.textContent=text;return element;}
function clear(svg){svg.replaceChildren();return svg;}
function graph(svg,series,{max=1.5,seconds=6,label='Time'}={}){
  clear(svg);const width=640,height=Number(svg.viewBox.baseVal.height),left=45,right=620,top=20,bottom=height-35;
  svg.append(node('path',{d:`M${left} ${top}V${bottom}H${right}`,fill:'none',stroke:'#71877e'}));
  for(let i=0;i<=3;i++){const y=bottom-(bottom-top)*i/3;svg.append(node('line',{x1:left,y1:y,x2:right,y2:y,stroke:'#263b35'}),node('text',{x:4,y:y+4},(max*i/3).toFixed(1)));}
  svg.append(node('text',{x:left,y:height-10},'0'),node('text',{x:right,y:height-10,'text-anchor':'end'},`${seconds} · ${label}`));
  series.forEach((item,index)=>{const d=item.points.map((point,i)=>`${i?'L':'M'}${left+point.x/seconds*(right-left)} ${bottom-point.y/max*(bottom-top)}`).join(' ');
    svg.append(node('path',{d,fill:'none',stroke:item.color,'stroke-width':2,'stroke-dasharray':index?'6 4':'none'}));});
}
function refreshMotion(){
  const profile=MOTION_PROFILES[$('profile').value];motionData=sampleMechanical(profile);
  graph($('motion-chart'),[{points:motionData.samples.map(value=>({x:value.time,y:value.position})),color:'#efce87'},
    {points:[{x:0,y:1},{x:6,y:1}],color:'#a8c9c0'}]);
  const m=motionData.metrics,rows=[['M, C, K',`${profile.mass}, ${profile.damping}, ${profile.stiffness}`],['Overshoot',`${(m.overshootRatio*100).toFixed(2)}%`],
    ['Settling time',m.settlingTime===null?'Not reached in six seconds':`${m.settlingTime.toFixed(3)} s`],['Settling rule','2% position band, sampled at 120 Hz'],['Sample window','6 seconds']];
  $('motion-metrics').replaceChildren(...rows.map(([label,value])=>{const li=document.createElement('li');li.textContent=`${label}: ${value}`;return li;}));
  $('response-samples').replaceChildren(...motionData.samples.filter((_,index)=>index%120===0).map(value=>{const tr=document.createElement('tr');for(const number of [value.time,value.position,value.velocity]){const td=document.createElement('td');td.textContent=fmt(number);tr.append(td);}return tr;}));
  drawMechanism();
}
function drawMechanism(){
  const svg=clear($('mechanism')),t=motion.time;
  for(const [index,key]of ['heavy',$('profile').value].entries()){
    const value=stepMechanical(initialMotion,1,t,MOTION_PROFILES[key]).position,x=55+value*390,y=25+index*55;
    svg.append(node('line',{x1:55,y1:y+12,x2:x,y2:y+12,stroke:'#6e9386','stroke-dasharray':index?'4 3':'none'}),node('rect',{x,y,width:index?30:55,height:24,fill:index?'#a8c9c0':'#efce87'}),node('text',{x:12,y:y+18},index?'B':'A'));
  }
  svg.append(node('text',{x:80,y:122},'A: primary heavy response · B: selected response · shared target'));
}
function transient(){
  const coupled=operatorTrajectory(MATRIX_MODELS.coupled,[0,1],24),decay=operatorTrajectory(MATRIX_MODELS.decay,[0,1],24),peak=coupled.reduce((best,item)=>item.norm>best.norm?item:best);
  graph($('transient-chart'),[{points:coupled.map(value=>({x:value.step,y:value.norm})),color:'#efce87'}, {points:decay.map(value=>({x:value.step,y:value.norm})),color:'#a8c9c0'}],{max:2.7,seconds:24,label:'operator step'});
  $('transient-metrics').textContent=`Solid: coupled. Dashed: uncoupled. Coupled peak: ${fmt(peak.norm)} at step ${peak.step}. Norm at step 24: ${coupled.at(-1).norm.toExponential(3)}.`;
}
function predictMatrix(choice){const key=`matrix:${$('matrix-case').value}`,input=$('matrix-case').value==='a'?[1,.5]:$('matrix-case').value==='b'?[-.25,.9]:[0,0],
  first=apply2(MATRIX_MODELS.swap,apply2(MATRIX_MODELS.projection,input)),second=apply2(MATRIX_MODELS.projection,apply2(MATRIX_MODELS.swap,input));
  const expected=first.every((value,index)=>value===second[index])?'same':'different',result=recordFirstPrediction(records,key,choice,expected,{input,first,second,grammarOpened});
  $('matrix-result').textContent=`First choice: ${result.choice}. P then J: (${first.map(fmt).join(', ')}). J then P: (${second.map(fmt).join(', ')}). ${expected==='same'?'The outputs are equal for this input. This does not prove that P and J commute.':'The outputs differ for this input.'} P²=P and J²=I.`;event('matrix-result',{key,choice:result.choice});
}
function soundCase(){const key=$('sound-case').value;
  return key==='gate'?{ids:['gate-room','room-gate'],question:'Which result keeps a room tail during a closed-gate interval?',answer:'a'}:
    key==='transfer'?{ids:['transfer-room-gate','transfer-gate-room'],question:'The gate phase changed. Which result keeps a room tail during a closed interval?',answer:'b'}:
    key==='constant'?{ids:['constant-gate-room','room-constant-gate'],question:'Will these two orders give equal outputs?',answer:'a'}:
    {ids:['filter-drive','drive-filter'],question:'Will these filter and saturation paths give equal outputs?',answer:'b'};
}
function stopSound(){playbackGeneration++;player.pause();player.currentTime=0;if(audioReady)$('audio-status').textContent=$('sound-enabled').checked?'Sound stopped.':'Sound is off.';}
function refreshSound(){stopSound();clipIds=soundCase().ids;$('sound-question').textContent=soundCase().question;$('sound-result').textContent='Make a prediction before the order labels are shown.';$('audio-order').textContent='';$('sound-disclosure').hidden=true;
  const relation=['constant','drive'].includes($('sound-case').value);document.querySelector('[data-sound="a"]').textContent=relation?'Equal outputs':'Result A';document.querySelector('[data-sound="b"]').textContent=relation?'Different outputs':'Result B';}
function discloseSound(){if(!analysis)return;const key=$('sound-case').value,pair=key==='transfer'?'transfer-gate-room':key==='constant'?'constant-gate-room':key==='drive'?'filter-drive':'gate-room',values=analysis.comparisons[pair];
  $('sound-disclosure').hidden=false;$('gate-chart').toggleAttribute('hidden',key==='drive');$('gate-note').textContent=key==='drive'?'The saturation operation is nonlinear.':key==='constant'?'The declared gain is constant at 0.5.':'Nominal gate: 0 means closed. 1 means open. The source smooths each edge over five milliseconds.';
  if(key!=='drive'){const gate=key==='transfer'?analysis.operators.transfer_gate:analysis.operators.gate,points=[];for(let i=0;i<=1200;i++){const time=i/100;points.push({x:time,y:key==='constant'?.5:((time*gate.rate_hz+gate.phase)%1<gate.duty?1:0)});}graph($('gate-chart'),[{points,color:'#efce87'}],{max:1.2,seconds:12,label:'seconds'});}
  $('sound-measurements').textContent=`${analysis.units}\n${JSON.stringify(values,null,2)}`;
}
function predictSound(choice){const data=soundCase(),key=`sound:${$('sound-case').value}`,labels=['constant','drive'].includes($('sound-case').value)?['Equal outputs','Different outputs']:['Result A','Result B'],result=recordFirstPrediction(records,key,choice,data.answer,{ids:data.ids,question:data.question,labels,grammarOpened});
  const names=data.ids.map(id=>catalog?.clips.find(clip=>clip.id===id)?.title||id);
  $('sound-result').textContent=`First choice: ${labels[result.choice==='a'?0:1]}. Model result: ${labels[data.answer==='a'?0:1]}. A: ${names[0]}. B: ${names[1]}.`;
  $('audio-order').textContent=$('sound-case').value==='drive'?'Saturation is nonlinear. This result does not prove a claim about linear operators.':$('sound-case').value==='constant'?'A constant scalar gain commutes with this fixed linear room response. Both orders give equal samples.':'Chronological order is shown above. Both paths use the same input and gain.';
  event('sound-result',{key,choice:result.choice});discloseSound();renderRegistry();
}
function playSound(index){
  if(!$('sound-enabled').checked){$('audio-status').textContent='Select Sound to listen.';return;}
  if(!audioReady){$('audio-status').textContent='Audio is not available. The visual models remain available.';return;}
  const clip=catalog.clips.find(value=>value.id===clipIds[index]);if(!clip){$('audio-status').textContent='This audio file is not available.';return;}
  stopSound();const generation=playbackGeneration,source=new URL(`../assets/audio/stc-operator-lab-r1/${clip.file}`,import.meta.url).href;player.src=source;
  player.play().then(()=>{if(generation!==playbackGeneration||player.src!==source)return;$('audio-status').textContent=`Playing result ${index?'B':'A'}.`;event('audio-play',{clip:clip.id});}).catch(error=>{if(generation!==playbackGeneration||player.src!==source||error.name==='AbortError')return;$('audio-status').textContent='Audio is not available. Select Play A or Play B to try again.';});
}
function startPoint(){const kind=$('topology').value,reverse=$('space-case').value==='b';return kind==='klein'?{id:'P-01',x:.76,y:reverse?-.35:.28,vx:.55,vy:reverse?-.2:.2}:{id:'P-01',x:reverse?-.3:.3,y:.79,vx:reverse?-.18:.18,vy:.55};}
function resetSpace(){space.projectile=startPoint();space.segments=[];space.crossings=[];space.running=false;space.revealed=false;$('space-run').disabled=true;$('space-run').textContent='Run path';
  const klein=$('topology').value==='klein';$('space-question').textContent=klein?'After the right edge, which vertical heading returns?':'After the top edge, which horizontal heading returns?';
  $('space-first').textContent=klein?'Down':'Left';$('space-second').textContent=klein?'Up':'Right';$('space-result').textContent='Make a prediction before the forecast is shown.';
  $('kernel-note').textContent=TOPOLOGY_MODELS[$('topology').value].note;drawSpace();
}
function predictSpace(choice){const kind=$('topology').value,key=`space:${kind}:${$('space-case').value}`,forecast=forecastTopology(startPoint(),1.1,kind),expected=(kind==='klein'?forecast.projectile.vy:forecast.projectile.vx)<0?'first':'second',
  result=recordFirstPrediction(records,key,choice,expected,{source:startPoint(),destination:forecast.projectile,grammarOpened});
  space.revealed=true;$('space-run').disabled=false;$('space-result').textContent=`First choice: ${result.choice==='first'?$('space-first').textContent:$('space-second').textContent}. Kernel result: ${expected==='first'?$('space-first').textContent:$('space-second').textContent}. You can now see the forecast.`;
  event('space-prediction',{key,choice:result.choice,kernel:forecast.kernel});drawSpace();
}
function drawSpace(){const svg=clear($('space-chart')),map=p=>({x:65+(p.x+1)*255,y:365-(p.y+1)*155}),kind=$('topology').value;
  svg.append(node('rect',{x:65,y:55,width:510,height:310,fill:'none',stroke:'#8da89b'}),node('text',{x:270,y:35},kind==='klein'?'B · wrap':'B · x flip'),node('text',{x:270,y:395},'B'),node('text',{x:15,y:210},'A'),node('text',{x:595,y:210},'A'));
  function segments(values,color,dashed){for(const value of values){const a=map(value.from),b=map(value.to);svg.append(node('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:color,'stroke-width':2,'stroke-dasharray':dashed?'5 5':'none'}));}}
  segments(space.segments,'#efce87',false);
  if(space.revealed){const future=forecastTopology(space.projectile,1.1,kind),p=map(future.projectile);segments(future.segments,'#a8c9c0',true);svg.append(node('circle',{cx:p.x,cy:p.y,r:8,fill:'none',stroke:'#a8c9c0','stroke-width':2}));}
  const p=map(space.projectile),speed=Math.hypot(space.projectile.vx,space.projectile.vy)||1;
  svg.append(node('circle',{cx:p.x,cy:p.y,r:7,fill:'#efce87'}),node('line',{x1:p.x,y1:p.y,x2:p.x+space.projectile.vx/speed*25,y2:p.y-space.projectile.vy/speed*25,stroke:'#efce87','stroke-width':2}),node('text',{x:p.x+12,y:p.y-12},space.projectile.id));
  $('space-info').textContent=`ID ${space.projectile.id} · kernel ${TOPOLOGY_MODELS[kind].kernel} · actual crossings ${space.crossings.length}. Solid segments stop at the identified edge. No line spans the jump.`;
  $('crossing-records').textContent=space.crossings.length?JSON.stringify(space.crossings,null,2):'No crossing yet.';
}
function selectPanel(id){active=id;motion.running=false;space.running=false;stopSound();$('motion-run').textContent='Run response';$('space-run').textContent='Run path';
  for(const button of document.querySelectorAll('[data-panel]'))button.setAttribute('aria-pressed',String(button.dataset.panel===id));
  for(const name of ['motion','sound','space'])$(name).hidden=name!==id;$(id+'-heading').focus();event('panel',{panelId:id});
}
document.querySelectorAll('[data-panel]').forEach(button=>button.addEventListener('click',()=>selectPanel(button.dataset.panel)));
$('profile').addEventListener('change',()=>{motion.time=0;motion.running=false;$('motion-run').textContent='Run response';$('motion-state').textContent='Ready. Select Run response.';refreshMotion();});
$('motion-run').addEventListener('click',()=>{if(reduced){motion.time=6;motion.running=false;$('motion-state').textContent='Static result. Motion is reduced.';drawMechanism();return;}
  if(motion.time>=6)motion.time=0;motion.running=!motion.running;$('motion-run').textContent=motion.running?'Pause response':'Run response';$('motion-state').textContent=motion.running?'Response is running.':'Response is paused.';event('motion-step',{profile:$('profile').value});});
$('motion-reset').addEventListener('click',()=>{motion.time=0;motion.running=false;$('motion-run').textContent='Run response';$('motion-state').textContent='Ready. Select Run response.';drawMechanism();});
$('reduced').checked=reduced;$('reduced').addEventListener('change',()=>{reduced=$('reduced').checked;motion.running=space.running=false;$('motion-run').textContent='Run response';$('space-run').textContent='Run path';$('motion-state').textContent=reduced?'Motion is reduced. Run response shows the static result.':'Ready. Select Run response.';drawMechanism();drawSpace();});
document.querySelectorAll('[data-matrix]').forEach(button=>button.addEventListener('click',()=>predictMatrix(button.dataset.matrix)));
$('matrix-case').addEventListener('change',()=>{$('matrix-result').textContent='Make a prediction before the result is shown.';});
$('sound-case').addEventListener('change',refreshSound);document.querySelectorAll('[data-sound]').forEach(button=>button.addEventListener('click',()=>predictSound(button.dataset.sound)));
$('play-a').addEventListener('click',()=>playSound(0));$('play-b').addEventListener('click',()=>playSound(1));$('stop-sound').addEventListener('click',()=>{stopSound();$('audio-status').textContent='Sound stopped.';});
$('sound-enabled').addEventListener('change',()=>{player.muted=!$('sound-enabled').checked;if(player.muted){stopSound();$('audio-status').textContent='Sound is off.';}else $('audio-status').textContent=audioReady?'Sound is on. Select Play A or Play B.':'The audio list is not available yet.';});player.muted=true;
player.addEventListener('error',()=>{$('audio-status').textContent='Audio is not available. The visual models remain available.';});
player.addEventListener('ended',()=>{$('audio-status').textContent='Sound ended.';});
for(const id of ['topology','space-case'])$(id).addEventListener('change',resetSpace);$('space-reset').addEventListener('click',resetSpace);
document.querySelectorAll('[data-space]').forEach(button=>button.addEventListener('click',()=>predictSpace(button.dataset.space)));
$('space-run').addEventListener('click',()=>{if(reduced){const value=advanceTopology(startPoint(),1.1,$('topology').value);space.projectile=value.projectile;space.segments=value.segments;space.crossings=value.crossings;space.running=false;for(const crossing of value.crossings)event('actual-crossing',crossing);drawSpace();return;}
  space.running=!space.running;$('space-run').textContent=space.running?'Pause path':'Run path';});
$('export').addEventListener('click',()=>{const data={revision:'stc-operator-lab-r1',records,events,reducedMotion:reduced,scope:'Laboratory observations. No human recognition claim.'},blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='operator-lab-r1-notes.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){motion.running=space.running=false;stopSound();$('motion-run').textContent='Run response';$('space-run').textContent='Run path';}});globalThis.addEventListener('pagehide',stopSound);
function frame(now){const dt=Math.min(.1,lastFrame?(now-lastFrame)/1000:0);lastFrame=now;if(motion.running&&!reduced){motion.time=Math.min(6,motion.time+dt);drawMechanism();if(motion.time===6){motion.running=false;$('motion-run').textContent='Run response';$('motion-state').textContent='The six-second response is complete.';}}
  if(space.running&&!reduced){const value=advanceTopology(space.projectile,dt,$('topology').value);space.projectile=value.projectile;space.segments.push(...value.segments);space.segments=space.segments.slice(-240);space.crossings.push(...value.crossings);space.crossings=space.crossings.slice(-24);for(const crossing of value.crossings)event('actual-crossing',crossing);drawSpace();}requestAnimationFrame(frame);}
function renderRegistry(){$('registry').replaceChildren();for(const entry of OPERATOR_GRAMMAR){const row=document.createElement('tr'),invariant=entry.id==='ASS-OP-RESONATE'&&!records.some(value=>value.key==='sound:constant')?'Make a prediction for the constant-gain case before you inspect this result.':entry.invariant;for(const text of [entry.family,entry.order.join(' → '),invariant,entry.limit]){const td=document.createElement('td');td.textContent=text;row.append(td);}$('registry').append(row);}}
$('grammar-details').addEventListener('toggle',()=>{if($('grammar-details').open){grammarOpened=true;event('grammar-opened');}});
globalThis.arrowSpaceShiftOperatorLab={read:()=>({revision:'stc-operator-lab-r1',active,reducedMotion:reduced,motion:{...motion,profile:$('profile').value,metrics:motionData.metrics},space:structuredClone(space),audio:{ready:audioReady,analysisReady:Boolean(analysis),paused:player.paused,muted:player.muted,src:player.currentSrc,currentTime:player.currentTime,duration:Number.isFinite(player.duration)?player.duration:null,clipIds:[...clipIds]},records:structuredClone(records),events:structuredClone(events),grammarCount:OPERATOR_GRAMMAR.length})};
refreshMotion();transient();refreshSound();resetSpace();renderRegistry();requestAnimationFrame(frame);
fetch(new URL('../assets/audio/stc-operator-lab-r1/catalog.json',import.meta.url)).then(response=>{if(!response.ok)throw new Error('Audio list is not available.');return response.json();}).then(value=>{catalog=value;audioReady=true;$('audio-status').textContent=$('sound-enabled').checked?'Sound is on. Select Play A or Play B.':'Audio is ready. Sound is off.';}).catch(()=>{$('audio-status').textContent='Audio is not available. The visual models remain available.';});
fetch(new URL('../assets/audio/stc-operator-lab-r1/analysis.json',import.meta.url)).then(response=>{if(!response.ok)throw new Error('The measurement record is not available.');return response.json();}).then(value=>{analysis=value;if(records.some(record=>record.key===`sound:${$('sound-case').value}`))discloseSound();}).catch(()=>{$('status').textContent='The measurement record is not available. The response and kernel views remain available.';});
