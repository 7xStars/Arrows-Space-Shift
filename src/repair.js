import {addFold,removeFold,advanceProjectile,advanceThroughSpace,spaceDistance} from './space.js';
import {traceKlein,pathsHit,KLEIN_BOUNDS} from './klein.js';
import {shipById} from './fleet.js';

export const REPAIR_LESSONS=Object.freeze([
  Object.freeze({id:'compression',name:'Distance circuit',x:-220,z:760,
    brief:'Move left to the receiver. Fold with Left Shift. Fire with Space. Charge lasts 1.2 seconds.',
    cause:'The fold reduced travel distance. The charge arrived before it faded.'}),
  Object.freeze({id:'klein',name:'Return circuit',x:-240,z:475,
    brief:'Move to the right entry mark. Fire with Space. The signal returns through the Klein side join.',
    cause:'The same signal crossed the right edge. The join reflected its vertical position and direction.'}),
  Object.freeze({id:'echo',name:'Echo circuit',x:-180,z:760,
    brief:'Catch the falling charge near the right mark with C. Move left. Press E to send the echo to its receiver.',
    cause:'Capture stored a real charge. Release spent it on the receiver.'}),
]);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const emit=(s,type,data={})=>{s.events.push({type,time:s.time,...data});if(s.events.length>120)s.events.shift();};
export function createRepair({shipId=0,resumeEnding=false}={}){
  const s={mode:'repair',phase:'ready',time:0,x:0,z:180,shipId,fields:[],foldSerial:0,foldsUsed:0,maxFolds:1,
    stageIndex:0,shots:[],charges:[],shotSerial:0,fireClock:0,captureClock:0,releaseClock:0,
    echoCount:0,nextCharge:0,charged:{compression:false,klein:false,echo:false},
    activated:false,endingTime:0,endingZ:0,endingDistance:1600,events:[],paused:false,
    message:REPAIR_LESSONS[0].brief,lastCause:'',musicState:'repair'};
  if(resumeEnding){s.phase='ending';s.activated=true;s.charged={compression:true,klein:true,echo:true};s.musicState='ending';}
  return s;
}
export function startRepair(s){if(s.phase!=='ready')return false;s.phase='running';emit(s,'launch');return true;}
function spawn(s,kind){
  const diagonal=s.stageIndex===1;
  s.shots.push({id:++s.shotSerial,x:s.x,z:s.z,vx:diagonal?330:0,vz:diagonal?180:kind==='echo'?440:300,
    age:0,kind,joins:0});
}
export function repairAction(s,action){
  if(s.phase!=='running'||s.paused)return false;
  if(action==='fold'&&s.stageIndex===0){
    if(!addFold(s))return false;emit(s,'fold');s.message='Distance is compressed. Fire into the left receiver.';return true;
  }
  if(action==='unfold'&&s.stageIndex===0){
    if(!removeFold(s))return false;emit(s,'unfold');return true;
  }
  if(action==='fire'&&s.fireClock<=0){
    s.fireClock=.24;spawn(s,'charge');emit(s,'player-fire',{x:s.x,z:s.z});return true;
  }
  if(action==='capture'&&s.stageIndex===2&&s.echoCount===0&&s.captureClock<=0){
    s.captureClock=.35;
    const charge=s.charges.find(item=>Math.hypot(item.x-s.x,item.z-s.z)<=105);
    if(!charge){s.message='No charge in range. Move to the right mark and wait for the filled core.';return false;}
    s.charges=s.charges.filter(item=>item!==charge);s.echoCount=1;emit(s,'echo-captured',{x:charge.x,z:charge.z,shotId:charge.id});
    s.message='Echo stored. Move left to the receiver. Press E to release.';return true;
  }
  if(action==='release'&&s.stageIndex===2&&s.echoCount>0&&s.releaseClock<=0){
    s.echoCount--;s.releaseClock=.4;spawn(s,'echo');emit(s,'echo-released');return true;
  }
  return false;
}
function chargeReceiver(s){
  const lesson=REPAIR_LESSONS[s.stageIndex];s.charged[lesson.id]=true;s.lastCause=lesson.cause;
  emit(s,'chapter-cleared',{circuit:lesson.id});s.shots=[];s.fields=[];s.charges=[];
  if(s.stageIndex===2){
    s.activated=true;s.phase='ending';s.endingTime=0;s.musicState='ending';s.message='The repaired drive holds a stable route.';emit(s,'drive-activated');
  }else{
    s.stageIndex++;s.x=0;s.z=220;s.fireClock=.3;s.message=REPAIR_LESSONS[s.stageIndex].brief;
    s.nextCharge=s.time+.8;
  }
}
function tick(s,input,dt){
  if(s.paused)return;
  if(s.phase==='ending'){
    s.time+=dt;s.endingTime+=dt;
    const factor=1-.8*Math.min(1,s.endingTime/5),fields=[{start:120,end:1320,factor}];
    s.endingZ=advanceThroughSpace(s.endingZ,180*dt,fields);
    s.endingDistance=spaceDistance(0,1600,fields);
    if(s.endingTime>=8){s.phase='complete';s.message='The stars remain. Your journey can continue.';emit(s,'won');}
    return;
  }
  if(s.phase!=='running')return;
  s.time+=dt;s.fireClock=Math.max(0,s.fireClock-dt);s.captureClock=Math.max(0,s.captureClock-dt);s.releaseClock=Math.max(0,s.releaseClock-dt);
  const horizontal=clamp(Number(input.horizontal)||0,-1,1);
  s.x=clamp(s.x+horizontal*shipById(s.shipId).speed*dt,-360,360);
  if(input.fire)repairAction(s,'fire');
  if(input.capture)repairAction(s,'capture');
  if(input.release)repairAction(s,'release');
  if(s.stageIndex===2&&s.time>=s.nextCharge){
    s.nextCharge=s.time+5;s.charges.push({id:++s.shotSerial,x:120,z:840});
  }
  for(const charge of s.charges)charge.z-=160*dt;
  s.charges=s.charges.filter(charge=>charge.z>=20);
  const lesson=REPAIR_LESSONS[s.stageIndex],target=[{from:{x:lesson.x,y:lesson.z},to:{x:lesson.x,y:lesson.z},t0:0,t1:1}];
  for(const shot of [...s.shots]){
    const old={x:shot.x,z:shot.z},age=shot.age;shot.age+=dt;
    if(s.stageIndex===1){
      const motion=traceKlein({x:shot.x,y:shot.z},shot.vx*dt,shot.vz*dt,KLEIN_BOUNDS);
      shot.paths=motion.segments;
      shot.x=motion.x;shot.z=motion.y;shot.joins+=motion.crossings.length;
      if(motion.twists%2)shot.vz*=-1;
      for(const crossing of motion.crossings)emit(s,'klein-crossing',{...crossing,rule:crossing.edge==='left'||crossing.edge==='right'?'klein':'periodic',shotId:shot.id});
      if(pathsHit(motion.segments,target,32)){chargeReceiver(s);break;}
    }else{
      shot.z=advanceProjectile(shot.z,shot.vz*dt,s.fields);
      shot.paths=[{from:{x:old.x,y:old.z},to:{x:shot.x,y:shot.z}}];
      if(old.z<=lesson.z&&shot.z>=lesson.z&&Math.abs(shot.x-lesson.x)<=32){
        const cost=spaceDistance(old.z,lesson.z,s.fields.map(field=>({...field,factor:field.factor**2})));
        const arrivalAge=age+cost/shot.vz;
        if((s.stageIndex===0&&arrivalAge<=1.2)||(s.stageIndex===2&&shot.kind==='echo')){chargeReceiver(s);break;}
      }
    }
    const life=s.stageIndex===0?1.2:4;
    if(shot.age>life||shot.z>1400)s.shots=s.shots.filter(item=>item!==shot);
  }
}
export function stepRepair(s,input={},seconds=1/60){
  if(!Number.isFinite(seconds)||seconds<0||seconds>.5)throw new RangeError('Use a frame duration from 0 to 0.5 seconds.');
  let left=seconds;
  while(left>1e-9){const dt=Math.min(left,1/120);tick(s,input,dt);left-=dt;}
  return s;
}
