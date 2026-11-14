import {AVEventReader} from './av-events.js';
import {MATRIX_MODELS,operatorTrajectory,MOTION_PROFILES,stepMechanical} from './operator-models.js';

const trajectory=operatorTrajectory(MATRIX_MODELS.coupled,[0,1],24);
const peak=Math.max(...trajectory.map(value=>value.norm));
const clamp=(value,limit)=>Math.max(-limit,Math.min(limit,value));

export function mechanicalImpulse(age,heavy=false){
  if(!Number.isFinite(age)||age<0||age>2)return 0;
  const profile=heavy?MOTION_PROFILES.heavy:MOTION_PROFILES.settled;
  return clamp(stepMechanical({position:0,velocity:36/profile.mass},0,age,profile).position,2.8);
}

/** A normalized decorative response to one actual damage event. */
export function damageResponse(age){
  if(!Number.isFinite(age)||age<0||age>=.96)return 0;
  const index=age/.04,first=Math.floor(index),part=index-first;
  return (trajectory[first].norm*(1-part)+trajectory[Math.min(first+1,24)].norm*part)/peak;
}

/** Presentation state has no write path to movement, damage, or collision. */
export class StructuralFeedback{
  constructor(){this.reader=new AVEventReader();this.state=null;this.chapter=null;this.time=0;this.spring={position:0,velocity:0};this.hitAt=-Infinity;}
  update(state,{shipId=state.shipId??0,reducedMotion=false,decorative=true}={}){
    const time=Number.isFinite(state.time)?state.time:0;
    if(this.state!==state||time<this.time||this.chapter!==state.campaign){
      this.state=state;this.chapter=state.campaign;this.time=time;this.spring={position:0,velocity:0};this.hitAt=-Infinity;this.reader=new AVEventReader();
    }
    const profile=shipId===3?MOTION_PROFILES.heavy:shipId===1?MOTION_PROFILES.elastic:MOTION_PROFILES.settled;
    const dt=state.paused?0:Math.max(0,Math.min(60,time-this.time));this.time=time;
    this.spring=stepMechanical(this.spring,0,dt,profile);
    for(const event of this.reader.read(state)){
      if(!event.isPhysical||event.forecast)continue;
      if(event.type==='player.weapon.fire')this.spring.velocity=clamp(this.spring.velocity+36/profile.mass,72);
      if(event.type==='player.damage')this.hitAt=event.simTime;
    }
    const motion=decorative&&!reducedMotion,age=time-this.hitAt;
    return {recoilPixels:motion?clamp(this.spring.position,2.8):0,
      damage:age>=0&&age<.55?(motion?damageResponse(age):.42):0,
      profile:profile.id??(shipId===3?'heavy':shipId===1?'elastic':'settled'),
      collisionOffset:0,model:'bounded-render-response'};
  }
}
