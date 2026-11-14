import {traceKlein,traceProjectiveSurface} from './klein.js';

const finite=(value,name)=>{
  if(!Number.isFinite(value))throw new RangeError(`${name} must be finite.`);
  return value;
};
const matrix=value=>{
  if(!Array.isArray(value)||value.length!==2||value.some(row=>!Array.isArray(row)||row.length!==2))
    throw new TypeError('Use a two by two matrix.');
  value.forEach(row=>row.forEach(entry=>finite(entry,'Matrix entry')));
  return value;
};
const vector=value=>{
  if(!Array.isArray(value)||value.length!==2)throw new TypeError('Use a two-component vector.');
  value.forEach(entry=>finite(entry,'Vector entry'));return value;
};
const freezeMatrix=value=>Object.freeze(value.map(row=>Object.freeze(row)));

export const MATRIX_MODELS=Object.freeze({
  identity:freezeMatrix([[1,0],[0,1]]),
  projection:freezeMatrix([[1,0],[0,0]]),
  swap:freezeMatrix([[0,1],[1,0]]),
  coupled:freezeMatrix([[.6,2],[0,.6]]),
  decay:freezeMatrix([[.6,0],[0,.6]]),
});

export function multiply2(left,right){
  matrix(left);matrix(right);
  return left.map((row,i)=>row.map((_,j)=>finite(left[i][0]*right[0][j]+left[i][1]*right[1][j],'Matrix product')));
}
export function apply2(operator,state){
  matrix(operator);vector(state);
  return operator.map(row=>finite(row[0]*state[0]+row[1]*state[1],'Operator result'));
}
export function subtract2(left,right){
  matrix(left);matrix(right);
  return left.map((row,i)=>row.map((entry,j)=>finite(entry-right[i][j],'Matrix difference')));
}
/** The product AB applies B first, then A, to a column vector. */
export function commutator2(left,right){return subtract2(multiply2(left,right),multiply2(right,left));}
export function vectorNorm2(state){vector(state);return finite(Math.hypot(...state),'Vector norm');}
export function matrixNorm2(operator){
  matrix(operator);const [[a,b],[c,d]]=operator,scale=Math.max(Math.abs(a),Math.abs(b),Math.abs(c),Math.abs(d));
  if(scale===0)return 0;
  const aa=a/scale,bb=b/scale,cc=c/scale,dd=d/scale,
    sum=aa*aa+bb*bb+cc*cc+dd*dd,det=(aa*dd-bb*cc)**2;
  return finite(scale*Math.sqrt((sum+Math.sqrt(Math.max(0,sum*sum-4*det)))/2),'Matrix norm');
}
export function spectralRadius2(operator){
  matrix(operator);const [[a,b],[c,d]]=operator,scale=Math.max(Math.abs(a),Math.abs(b),Math.abs(c),Math.abs(d));
  if(scale===0)return 0;
  const trace=a/scale+d/scale,det=(a/scale)*(d/scale)-(b/scale)*(c/scale),discriminant=trace*trace-4*det;
  return finite(scale*(discriminant>=0?Math.max(Math.abs((trace+Math.sqrt(discriminant))/2),Math.abs((trace-Math.sqrt(discriminant))/2)):Math.sqrt(det)),'Spectral radius');
}
export function operatorTrajectory(operator=MATRIX_MODELS.coupled,initial=[0,1],steps=24){
  matrix(operator);vector(initial);
  if(!Number.isInteger(steps)||steps<0||steps>256)throw new RangeError('Use zero to 256 operator steps.');
  let value=[...initial];const samples=[{step:0,value:[...value],norm:vectorNorm2(value)}];
  for(let step=1;step<=steps;step++){value=apply2(operator,value);samples.push({step,value:[...value],norm:vectorNorm2(value)});}
  return samples;
}

export const MOTION_PROFILES=Object.freeze({
  heavy:Object.freeze({id:'heavy',label:'Heavy',mass:4,damping:21.6,stiffness:36}),
  elastic:Object.freeze({id:'elastic',label:'Elastic',mass:1,damping:6,stiffness:100}),
  settled:Object.freeze({id:'settled',label:'Settled',mass:1,damping:20,stiffness:100}),
});
function mechanicalProfile(value){
  const profile=typeof value==='string'?MOTION_PROFILES[value]:value;
  if(!profile||!(finite(profile.mass,'Mass')>0)||!(finite(profile.stiffness,'Stiffness')>0)||!(finite(profile.damping,'Damping')>=0))
    throw new RangeError('Use positive mass and stiffness. Damping cannot be negative.');
  const alpha=profile.damping/(2*profile.mass),omegaSquared=profile.stiffness/profile.mass;
  finite(alpha,'Damping rate');finite(alpha*alpha,'Squared damping rate');finite(omegaSquared,'Squared frequency');
  return {profile,alpha,omegaSquared};
}

/** Exact update for M y'' + C y' + K(y-target) = 0 with a constant target. */
export function stepMechanical(state={position:0,velocity:0},target=1,dt=0,profile=MOTION_PROFILES.heavy){
  const {alpha,omegaSquared}=mechanicalProfile(profile);
  const position=finite(state?.position,'Position'),velocity=finite(state?.velocity,'Velocity');
  finite(target,'Target');finite(dt,'Time interval');
  if(dt<0||dt>60)throw new RangeError('Use a time interval from zero to 60 seconds.');
  if(dt===0)return {position,velocity};
  const displacement=position-target,difference=alpha*alpha-omegaSquared;
  let cosineTerm,sineTerm;
  if(difference===0){
    cosineTerm=Math.exp(-alpha*dt);sineTerm=dt*cosineTerm;
  }else if(difference<0){
    const rate=Math.sqrt(-difference),phase=rate*dt,decay=Math.exp(-alpha*dt),
      sinc=Math.abs(phase)<1e-4?1-phase*phase/6+phase**4/120:Math.sin(phase)/phase;
    cosineTerm=decay*Math.cos(phase);sineTerm=decay*dt*sinc;
  }else{
    const root=Math.sqrt(difference),slow=-omegaSquared/(alpha+root),fast=-alpha-root,
      slowDecay=Math.exp(slow*dt),fastDecay=Math.exp(fast*dt);
    cosineTerm=(slowDecay+fastDecay)/2;
    sineTerm=slowDecay*(-Math.expm1(-2*root*dt))/(2*root);
  }
  const nextPosition=target+cosineTerm*displacement+sineTerm*(velocity+alpha*displacement),
    nextVelocity=cosineTerm*velocity-sineTerm*(alpha*velocity+omegaSquared*displacement);
  return {position:finite(nextPosition,'Response position'),velocity:finite(nextVelocity,'Response velocity')};
}
export function mechanicalEnergy(state,target=0,profile=MOTION_PROFILES.heavy){
  const {profile:properties}=mechanicalProfile(profile);
  finite(target,'Target');finite(state?.position,'Position');finite(state?.velocity,'Velocity');
  return finite(.5*properties.mass*state.velocity**2+.5*properties.stiffness*(state.position-target)**2,'Mechanical energy');
}
export function sampleMechanical(profile=MOTION_PROFILES.heavy,{seconds=6,dt=1/120,target=1,initial={position:0,velocity:0},band=.02}={}){
  mechanicalProfile(profile);finite(seconds,'Duration');finite(dt,'Sample interval');finite(band,'Settling band');finite(target,'Target');
  if(seconds<0||seconds>60||dt<=0||dt>.25||Math.ceil(seconds/dt)>50000||band<=0||band>=1)
    throw new RangeError('Use a duration up to 60 seconds and a positive sample interval up to 0.25 seconds.');
  let state=stepMechanical(initial,target,0,profile),time=0;
  const samples=[{time,...state}],count=Math.ceil(seconds/dt);
  for(let index=1;index<=count;index++){
    const nextTime=Math.min(seconds,index*dt);state=stepMechanical(state,target,nextTime-time,profile);time=nextTime;samples.push({time,...state});
  }
  const amplitude=Math.abs(target-initial.position),direction=Math.sign(target-initial.position),tolerance=Math.max(amplitude,1e-9)*band;
  let overshoot=0,lastOutside=-1;
  for(const [index,sample] of samples.entries()){
    overshoot=Math.max(overshoot,direction*(sample.position-target));
    if(Math.abs(sample.position-target)>tolerance)lastOutside=index;
  }
  return {samples,metrics:{overshoot,overshootRatio:amplitude?overshoot/amplitude:0,
    settlingTime:lastOutside===samples.length-1?null:samples[Math.max(0,lastOutside+1)].time,
    settlingBand:tolerance,windowSeconds:seconds,finalError:Math.abs(samples.at(-1).position-target)}};
}

export const TOPOLOGY_BOUNDS=Object.freeze({left:-1,right:1,bottom:-1,top:1});
export const TOPOLOGY_MODELS=Object.freeze({
  klein:Object.freeze({label:'Klein chart',kernel:'traceKlein',note:'Side joins reflect y. Vertical joins wrap y.'}),
  projective:Object.freeze({label:'Projective Module prototype',kernel:'traceProjectiveSurface',note:'This experimental chart is not a verified model of RP².'}),
});
function topologyInput(projectile,dt,kind,bounds){
  if(!TOPOLOGY_MODELS[kind])throw new RangeError('Select a supported topology chart.');
  if(projectile?.id===null||projectile?.id===undefined)throw new TypeError('The projectile needs a retained identity.');
  for(const key of ['x','y','vx','vy'])finite(projectile[key],key);
  for(const key of ['left','right','bottom','top'])finite(bounds[key],key);
  if(!(bounds.right>bounds.left)||!(bounds.top>bounds.bottom))throw new RangeError('The chart bounds must have positive width and height.');
  if(kind==='projective'&&Math.abs(bounds.left+bounds.right)>1e-10*(bounds.right-bounds.left))
    throw new RangeError('The Projective Module prototype needs horizontally centered bounds.');
  if(projectile.x<bounds.left||projectile.x>bounds.right||projectile.y<bounds.bottom||projectile.y>bounds.top)
    throw new RangeError('Start the projectile inside the chart.');
  finite(dt,'Time interval');if(dt<0||dt>60)throw new RangeError('Use a time interval from zero to 60 seconds.');
}
export function advanceTopology(projectile,dt,kind='klein',bounds=TOPOLOGY_BOUNDS){
  topologyInput(projectile,dt,kind,bounds);
  const kernel=kind==='klein'?traceKlein:traceProjectiveSurface,
    trace=kernel({x:projectile.x,y:projectile.y},projectile.vx*dt,projectile.vy*dt,bounds),
    vx=projectile.vx*((trace.projectiveCrossings||0)%2?-1:1),vy=projectile.vy*(trace.twists%2?-1:1),
    speed=Math.hypot(vx,vy);
  const crossings=trace.crossings.map((crossing,index)=>{
    const previous=trace.crossings[index-1],sameTime=previous&&Math.abs(previous.time-crossing.time)<1e-10,
      before=trace.segments.find(segment=>Math.abs(segment.t1-crossing.time)<1e-10),
      from=sameTime?{x:previous.x,y:previous.y}:before?{...before.to}:{x:projectile.x,y:projectile.y},
      to={x:crossing.x,y:crossing.y},rule=crossing.rule||(['left','right'].includes(crossing.edge)?'klein':'wrap');
    return {...crossing,rule,objectId:projectile.id,predicted:false,from,to,source:{...from},destination:{...to}};
  });
  return {kind,kernel:TOPOLOGY_MODELS[kind].kernel,projectile:{...projectile,x:trace.x,y:trace.y,vx,vy,
    heading:{x:speed?vx/speed:0,y:speed?vy/speed:0}},
    segments:trace.segments.map(segment=>({...segment,from:{...segment.from},to:{...segment.to}})),crossings,
    jumps:crossings.map(crossing=>({from:{...crossing.from},to:{...crossing.to},time:crossing.time,objectId:projectile.id,renderOnly:true})),
    twists:trace.twists,projectiveCrossings:trace.projectiveCrossings||0};
}
/** Forecasts are drawing data. They do not add projectile identities or colliders. */
export function forecastTopology(projectile,seconds=.5,kind='klein',bounds=TOPOLOGY_BOUNDS){
  const forecast=advanceTopology(projectile,seconds,kind,bounds);
  return {...forecast,renderOnly:true,collisionRelevant:false,createsCollider:false,
    crossings:forecast.crossings.map(crossing=>({...crossing,predicted:true}))};
}
