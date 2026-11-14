import {moveBolza,unit,hyperbolicDistance} from './hyperbolic.js';
import {quotientDistance} from './hyperbolic-campaign.js';

export const PULSE_PHASES=Object.freeze([
  {id:'establishment',name:'Establishment',instruction:'Observe the repeated pulse. Move and fire manually.'},
  {id:'transformation',name:'Transformation',instruction:'Follow the same solid attack through a paired edge.'},
  {id:'complication',name:'Complication',instruction:'A second attack enters. Keep the two identities distinct.'},
  {id:'disclosure',name:'Disclosure',instruction:'Inspect the actual departure and arrival. The edge mapping caused the return.'},
  {id:'transfer',name:'Transfer',instruction:'Predict the arrival edge for this new path. Commit one choice before feedback.'},
].map(Object.freeze));
export const PULSE_CONDITIONS=Object.freeze(['combined','visual','audio','mismatched']);
const clone=value=>structuredClone(value),clamp=value=>Math.max(-1,Math.min(1,Number(value)||0));
const actor=(id,position,heading,family='pulse')=>({id,position:{...position},heading:unit(heading),family,speed:1.1,age:0,joins:0,trail:[]});
const primary=()=>actor('pulse-1',{x:-.32,y:.03},{x:1,y:.05});

export function createPulseStudy({condition='combined',probe=false}={}){
  if(!PULSE_CONDITIONS.includes(condition)||(['audio','mismatched'].includes(condition)&&!probe))condition='combined';
  return {version:'stc-study-r5',status:'ready',paused:false,time:0,phaseTime:0,phaseIndex:0,condition,probe:Boolean(probe),
    player:{position:{x:0,y:-.25},heading:{x:0,y:1}},primary:primary(),secondary:null,shots:[],targets:[{position:{x:.2,y:.25}},{position:{x:-.28,y:-.18}}],
    eventSeq:0,objectSeq:1,events:[],trace:[],records:[],prediction:null,feedback:null,retryCount:0,helpUsed:false,
    contacts:0,targetsHit:0,contactUntil:0,fireUntil:0,notice:'',guideHistory:[],conditionHistory:[{condition,probe:Boolean(probe),time:0,phase:'establishment'}]};
}
function event(s,type,detail={}){
  const value={eventId:`pulse-event-${++s.eventSeq}`,type,time:s.time,...detail};s.events.push(value);
  if(s.events.length>100)s.events.shift();return value;
}
function enterAttack(s,item){
  event(s,'attack-entered',{objectId:item.id,family:item.family,position:{...item.position},topology:'bolza'});
}
export function startPulseStudy(s){
  if(s.status!=='ready')return false;s.status='running';s.paused=false;event(s,'stage',{phase:PULSE_PHASES[0].id});enterAttack(s,s.primary);return true;
}
export function pulseCanAdvance(s){
  if(s.status!=='running')return false;
  if(s.phaseIndex===0)return s.phaseTime>=1.1;
  if(s.phaseIndex===1)return s.trace.some(t=>t.objectId===s.primary.id);
  if(s.phaseIndex===2)return s.secondary?.age>=1.1;
  if(s.phaseIndex===3)return s.trace.length>0;
  return Boolean(s.feedback);
}
function prepareTransfer(s){
  const theta=s.retryCount*Math.PI/4,turn=p=>({x:p.x*Math.cos(theta)-p.y*Math.sin(theta),y:p.x*Math.sin(theta)+p.y*Math.cos(theta)});
  s.primary=actor(`transfer-${++s.objectSeq}`,turn({x:.05,y:.14}),turn({x:-.82,y:-.58}),'transfer');
  s.secondary=null;s.shots=[];s.trace=[];s.prediction=null;s.feedback=null;s.helpUsed=false;s.notice='Choose an arrival edge. The attack will wait for your first choice.';
}
export function advancePulsePhase(s){
  if(s.paused||!pulseCanAdvance(s))return false;
  if(s.phaseIndex===4){s.status='complete';s.paused=true;event(s,'study-complete');return true;}
  s.phaseIndex++;s.phaseTime=0;
  if(s.phaseIndex===2)s.secondary=actor(`counter-${++s.objectSeq}`,{x:.02,y:-.42},{x:.4,y:1},'counter');
  if(s.phaseIndex===4)prepareTransfer(s);
  event(s,'stage',{phase:PULSE_PHASES[s.phaseIndex].id});
  if(s.phaseIndex===2)enterAttack(s,s.secondary);
  if(s.phaseIndex===4&&s.condition==='audio')enterAttack(s,s.primary);
  return true;
}
export function retryPulseTransfer(s){
  if(s.phaseIndex!==4||!s.feedback)return false;
  s.retryCount++;s.phaseTime=0;s.status='running';s.paused=false;prepareTransfer(s);event(s,'transfer-retry',{assisted:true});
  if(s.condition==='audio')enterAttack(s,s.primary);return true;
}
export function setPulseCondition(s,condition,probe=s.probe){
  if(!PULSE_CONDITIONS.includes(condition)||(['audio','mismatched'].includes(condition)&&!probe)||s.phaseIndex===4)return false;
  s.condition=condition;s.probe=Boolean(probe);
  s.conditionHistory.push({condition,probe:s.probe,time:s.time,phase:PULSE_PHASES[s.phaseIndex].id});return true;
}
export function markPulseHelp(s){
  const record={phase:PULSE_PHASES[s.phaseIndex].id,condition:s.condition,time:s.time};
  s.guideHistory.push(record);event(s,'guide-open',record);
  if(s.phaseIndex===4&&!s.prediction)s.helpUsed=true;
}
export function submitPulsePrediction(s,side){
  if(s.status!=='running'||s.paused||s.phaseIndex!==4||s.condition==='audio'||s.prediction||!Number.isInteger(side)||side<0||side>7)return false;
  s.prediction={taskKind:'destination-prediction',firstChoice:side,condition:s.condition,probe:s.probe,responseSeconds:s.phaseTime,
    assisted:s.helpUsed||s.retryCount>0,retry:s.retryCount,correct:null,actualSide:null,
    priorGuideCount:s.guideHistory.length,conditionOrder:clone(s.conditionHistory)};
  s.records.push(s.prediction);event(s,'prediction',{firstChoice:side,condition:s.condition,assisted:s.prediction.assisted});
  enterAttack(s,s.primary);
  s.notice='Choice recorded. Watch or hear the actual crossing.';return true;
}
function moveActor(s,item,distance){
  if(Math.abs(distance)<1e-10)return;
  try{
    const result=moveBolza(item.position,item.heading,distance,.012);
    item.position=result.position;item.heading=result.heading;
    const jumps=result.segments.filter(segment=>segment.jump);
    for(let i=0;i<result.crossings.length;i++){
      const crossing=result.crossings[i],segment=jumps[Math.min(i,jumps.length-1)];
      const record=event(s,'crossing',{objectId:item.id,family:item.family,from:crossing.from,to:crossing.to,
        source:{...segment.from},destination:{...segment.to},topology:'bolza'});
      item.joins++;s.trace.push(record);if(s.trace.length>12)s.trace.shift();
      if(s.phaseIndex===4&&item===s.primary&&s.prediction&&!s.feedback){
        s.prediction.actualSide=crossing.to;s.prediction.correct=s.prediction.firstChoice===crossing.to;
        s.feedback={actualSide:crossing.to,from:crossing.from,correct:s.prediction.correct,objectId:item.id};
        s.notice='The actual mapping is now disclosed. A retry is an assisted attempt.';
      }
      if(s.phaseIndex===4&&item===s.primary&&s.condition==='audio'&&!s.feedback){
        s.feedback={listenOnly:true,objectId:item.id};
        s.records.push({taskKind:'listen-only',condition:'audio',probe:true,notScored:true,firstChoice:null,correct:null});
        s.notice='Listening example complete. No destination prediction was scored.';
      }
    }
    for(const segment of result.segments)item.trail.push(segment.jump?null:{from:{...segment.from},to:{...segment.to}});
    if(item.trail.length>220)item.trail.splice(0,item.trail.length-220);
  }catch{
    s.notice='A vertex tolerance stopped this path. Restart the study.';s.paused=true;
  }
}
function tick(s,input,dt){
  s.time+=dt;s.phaseTime+=dt;
  const awaiting=s.phaseIndex===4&&s.condition!=='audio'&&!s.prediction;
  if(awaiting)return;
  if(s.condition==='audio')input={};
  const turn=clamp(input.turn)*2.4*dt,d=s.player.heading;
  s.player.heading={x:d.x*Math.cos(turn)-d.y*Math.sin(turn),y:d.x*Math.sin(turn)+d.y*Math.cos(turn)};
  const drive=clamp(input.drive);
  if(drive){
    const temporary={...s.player,id:'pilot',family:'pilot',joins:0,trail:[]};
    moveActor(s,temporary,drive*(drive>0?1.25:.9)*dt);
    s.player.position=temporary.position;s.player.heading=temporary.heading;
  }
  if(input.fire&&s.time>=s.fireUntil&&s.shots.length<24){
    const shot=actor(`manual-${++s.objectSeq}`,s.player.position,s.player.heading,'manual');shot.speed=2.5;shot.life=3.2;
    s.shots.push(shot);s.fireUntil=s.time+.24;event(s,'manual-fire',{objectId:shot.id});
  }
  let active=dt;
  if(s.phaseIndex===0)active=Math.max(0,Math.min(dt,1.1-(s.phaseTime-dt)));
  if(s.phaseIndex===3||awaiting||s.feedback)active=0;
  if(active){s.primary.age+=active;moveActor(s,s.primary,s.primary.speed*active);}
  if(s.secondary&&active){s.secondary.age+=active;moveActor(s,s.secondary,s.secondary.speed*active);}
  for(const shot of s.shots){
    shot.age+=dt;if(shot.age>=shot.life)continue;moveActor(s,shot,shot.speed*dt);
    for(const target of s.targets)if(quotientDistance(shot.position,target.position)<.12){
      s.targetsHit++;shot.age=shot.life;event(s,'target-hit',{objectId:shot.id});break;
    }
  }
  s.shots=s.shots.filter(shot=>shot.age<shot.life);
  if(s.condition!=='audio'&&!awaiting&&s.phaseIndex!==3&&s.time>=s.contactUntil){
    for(const hazard of [s.primary,s.secondary].filter(Boolean))if(quotientDistance(hazard.position,s.player.position)<.12){
      s.contacts++;s.contactUntil=s.time+1;event(s,'contact',{objectId:hazard.id});break;
    }
  }
}
export function stepPulseStudy(s,input={},seconds=1/60){
  if(!Number.isFinite(seconds)||seconds<0||seconds>.25)throw new RangeError('Unsupported study frame duration.');
  if(s.status!=='running'||s.paused)return s;
  let left=seconds;
  while(left>1e-9&&!s.paused){const dt=Math.min(left,1/90);tick(s,input,dt);left-=dt;}
  return s;
}
export function pulseSnapshot(s){
  const snapshot=clone(s),awaiting=s.phaseIndex===4&&s.condition!=='audio'&&!s.prediction;
  snapshot.phase=PULSE_PHASES[s.phaseIndex].id;snapshot.canAdvance=pulseCanAdvance(s);
  snapshot.awaitingPrediction=awaiting;snapshot.predictionCommitted=Boolean(s.prediction);
  snapshot.displayCrossing=clone(pulseDisplayCrossing(s));
  if(awaiting){snapshot.trace=[];snapshot.events=snapshot.events.filter(e=>e.type!=='crossing');}
  return snapshot;
}
export function pulseDisplayCrossing(s){
  if(s.phaseIndex===4&&s.condition!=='audio'&&!s.prediction)return null;
  return s.trace.filter(record=>record.objectId===s.primary.id).at(-1)||null;
}
export function pulseDistance(a,b){return hyperbolicDistance(a,b);}
