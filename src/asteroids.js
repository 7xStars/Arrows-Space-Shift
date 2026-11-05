import {spaceDistance} from './space.js';
import {inCombatView} from './combat-view.js';

export function contactTime(s,paths,object,radius,{moving=false,halfWidth=0}={}){
  let earliest=Infinity;
  const edge=x=>Math.sign(x)*Math.max(0,Math.abs(x)-halfWidth);
  for(const path of paths){
    const a=moving?(path.shipFrom||object):object,b=moving?(path.shipTo||object):object;
    const x=edge(path.from.x-a.x),z=spaceDistance(a.z,path.from.z,s.fields);
    const dx=edge(path.to.x-b.x)-x,dz=spaceDistance(b.z,path.to.z,s.fields)-z;
    if(!Number.isFinite(x+z+dx+dz))continue;
    const A=dx*dx+dz*dz,B=2*(x*dx+z*dz),C=x*x+z*z-radius*radius;
    let t=0;
    if(C>0){const d=B*B-4*A*C;if(!A||d<0)continue;t=(-B-Math.sqrt(d))/(2*A);if(t<0||t>1)continue;}
    earliest=Math.min(earliest,(path.t0??0)+((path.t1??1)-(path.t0??0))*t);
  }
  return earliest;
}

export function asteroidContact(s,paths){
  let result=null;
  for(const asteroid of s.asteroids){
    if(asteroid.hp<=0||!asteroid.presented||!inCombatView(s,asteroid))continue;
    const time=contactTime(s,paths,asteroid,asteroid.radius);
    if(Number.isFinite(time)&&(!result||time<result.time))result={asteroid,time};
  }
  return result;
}

export function breakAsteroid(s,asteroid,owner){
  if(asteroid.destroyed)return;
  asteroid.hp=0;asteroid.destroyed=true;
  const points=owner==='player'?10:0;s.score+=points;
  if(s.campaign)s.campaign.asteroidsBroken++;
  s.effects.push({type:'asteroid',x:asteroid.x,z:asteroid.z,start:s.time,until:s.time+.55,points,color:'#c4bdac'});
  s.events.push({time:s.time,type:'asteroid-broken',target:asteroid.id,owner,x:asteroid.x,z:asteroid.z,points});
  s.lastEvent=owner==='player'?'Asteroid broken. +10 points.':owner==='enemy'?'Enemy fire broke an asteroid.':'Asteroid impact. The rock broke.';
}

export function interceptAsteroid(s,paths,shot,owner,{before=Infinity,bodies=[]}={}){
  const hit=asteroidContact(s,paths);if(!hit||hit.time>before)return false;
  for(const body of bodies)if(contactTime(s,paths,body.object,body.radius,body)<hit.time)return false;
  const rock=hit.asteroid;rock.hp-=shot.damage||1;rock.hitUntil=s.time+.12;shot.dead=true;
  s.events.push({time:s.time,type:'asteroid-hit',target:rock.id,owner,amount:shot.damage||1});
  if(rock.hp<=0)breakAsteroid(s,rock,owner);return true;
}
