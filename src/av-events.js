const freeze=value=>{
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){
    for(const item of Object.values(value))freeze(item);
    Object.freeze(value);
  }
  return value;
};

const rule=(id,type,meaning,animation,sound,priority=1)=>freeze({
  id,type,meaning,animation,sound,priority,
  timing:'Use the simulation event. Do not change action time.',
  invariants:['Keep simulation state unchanged.','Keep object identity when it is supplied.'],
  fallback:'Keep the existing visual cue when sound is off.',
  acceptance:'Route one event once. Do not create a projectile or a collision body.',
});

// These records describe the cues used by the current game.
// The source proposal remains separate from this implemented subset.
export const AV_GRAMMAR=freeze({
  'player.weapon.fire':rule('ASS-AV-001','player.weapon.fire','A manual shot was fired.','Muzzle pulse and bounded mechanical recoil. The collision core stays fixed.','player-fire'),
  'enemy.weapon.fire':rule('ASS-AV-002','enemy.weapon.fire','An enemy fired.','Existing filled shot core and trail.','enemy-fire'),
  'player.damage':rule('ASS-AV-003','player.damage','The player received hull damage.','Bounded coupled response, hit ring, and hull display. Reduced motion keeps a static outline.','damage',3),
  'boss.telegraph':rule('ASS-AV-004','boss.telegraph','A scheduled attack has a warning.','Existing pattern label and aim cue.','pattern',3),
  'topology.klein.cross':rule('ASS-AV-005','topology.klein.cross','An object crossed a Klein join.','Existing paired notch and live continuation.','klein-crossing',2),
  'topology.projective.cross':rule('ASS-AV-006','topology.projective.cross','An object crossed a projective join.','Existing opposed ticks and live continuation.','projective-crossing',2),
  'topology.hybrid.warning':rule('ASS-AV-007','topology.hybrid.warning','The hybrid phase changed.','Existing source-specific phase display.','hybrid-phase',3),
  'topology.bolza.join':rule('ASS-AV-008','topology.bolza.join','An object crossed a Bolza paired edge.','Existing paired letters and arrival ring.','bolza-crossing',2),
  'preview.future_image':rule('ASS-AV-009','preview.future_image','This image is a forecast.','Existing hollow outline and dashed lead-in.',null),
  'module.capture':rule('ASS-AV-010','module.capture','Capture succeeded.','Existing echo count and capture cue.','echo-captured',2),
  'module.release':rule('ASS-AV-011','module.release','Release succeeded.','Existing released echo trajectories.','echo-released',2),
  'fold.phase':rule('ASS-AV-012','fold.phase','The fold state changed.','Existing fold display.','fold',2),
  'stage.recovery':rule('ASS-AV-013','stage.recovery','An authored recovery interval started.','Existing recovery label.','wave-break'),
  'boss.defeat':rule('ASS-AV-014','boss.defeat','The boss was defeated. The reward is not yet banked.','Existing defeat cue.','target-hit',2),
  'topology.periodic.cross':rule('ASS-AV-PERIODIC','topology.periodic.cross','An object crossed a periodic join.','Existing parallel edge marks.','periodic-crossing',2),
  'projectile.impact':rule('ASS-AV-IMPACT','projectile.impact','A projectile hit its target.','Existing impact cue.','enemy-hit'),
  'enemy.destroyed':rule('ASS-AV-DESTROYED','enemy.destroyed','An enemy was destroyed.','Existing destruction cue.','target-hit'),
  'module.collected':rule('ASS-AV-COLLECTED','module.collected','A module was collected. Extraction is still required.','Existing physical pickup cue.','drive-part-collected',2),
  'stage.complete':rule('ASS-AV-COMPLETE','stage.complete','The stage was completed.','Existing clear display.','won',2),
  'stage.start':rule('ASS-AV-START','stage.start','The stage started.','Existing stage display.','launch'),
});

export const isHyperbolicState=s=>Number.isInteger(s?.stageIndex)&&Boolean(s?.player?.position);
const point=value=>value&&Number.isFinite(value.x)?
  (Number.isFinite(value.z)?{x:value.x,z:value.z}:Number.isFinite(value.y)?{x:value.x,y:value.y}:null):null;
const identity=value=>typeof value==='string'||Number.isFinite(value)?value:null;

function route(event,hyperbolic){
  const aliases={
    'player-fire':'player.weapon.fire','enemy-fire':'enemy.weapon.fire',damage:'player.damage',
    'pattern-warning':'boss.telegraph','hybrid-phase':'topology.hybrid.warning',
    'echo-captured':'module.capture','echo-released':'module.release',fold:'fold.phase',unfold:'fold.phase',
    'wave-break':'stage.recovery','enemy-hit':'projectile.impact','target-hit':'enemy.destroyed',
    'drive-part-collected':'module.collected','chapter-cleared':'stage.complete',won:'stage.complete',
    'future-image':'preview.future_image','preview.future_image':'preview.future_image',
  };
  if(event.forecast===true||event.isPhysical===false)return {type:'preview.future_image',cue:null};
  if(event.type==='klein-crossing'){
    const topology=event.rule||(event.edge==='left'||event.edge==='right'?'klein':'periodic');
    if(['klein','projective','periodic'].includes(topology))return {type:`topology.${topology}.cross`,cue:`${topology}-crossing`,topology};
    return {type:null,cue:null,topology:null};
  }
  if(hyperbolic){
    const alias={fire:'player.weapon.fire','enemy-volley':'enemy.weapon.fire',hit:'player.damage',
      'player-crossing':'topology.bolza.join','shot-crossing':'topology.bolza.join',
      capture:'module.capture',release:'module.release',recovery:'stage.recovery',
      'stage-clear':'stage.complete','stage-start':'stage.start'};
    if(event.type==='kill')return {type:event.boss?'boss.defeat':'enemy.destroyed',topology:'bolza'};
    if(alias[event.type])return {type:alias[event.type],topology:'bolza'};
  }
  return {type:aliases[event.type]||null};
}

/** Copy presentation data. Never expose a mutable simulation reference. */
export function adaptAVEvent(event,s,instanceId='event'){
  if(!event||typeof event.type!=='string')return null;
  const hyperbolic=isHyperbolicState(s),mapped=route(event,hyperbolic),grammar=AV_GRAMMAR[mapped.type];
  const simTime=Number.isFinite(event.time)?event.time:Number.isFinite(event.t)?event.t:s.time;
  let cue=mapped.cue!==undefined?mapped.cue:grammar?.sound??event.type;
  if(mapped.type==='boss.telegraph')cue=`pattern-${event.patternKey||'fan'}`;
  if(event.type==='unfold')cue='unfold';
  if(event.type==='drive-part-collected'&&event.part==='klein-relay')cue='relay-recovered';
  const forecast=mapped.type==='preview.future_image';
  return freeze({instanceId,type:mapped.type||'legacy',grammarId:grammar?.id||null,
    sourceType:event.type,simTime,cue,topology:mapped.topology||null,
    sourceId:identity(event.sourceId??event.enemy??event.actor),
    objectId:identity(event.objectId??event.shotId),
    objectIds:Array.isArray(event.shotIds)?event.shotIds.map(identity).filter(value=>value!==null):[],
    worldPos:point(event.position)||point(event),
    transform:{rule:identity(event.rule),edge:identity(event.edge),
      from:point(event.from)||identity(event.from),to:point(event.to)||identity(event.to)},
    forecast,isPhysical:!forecast,
  });
}

/** Skip an unchanged prefix. Use object identity when a bounded log shifts. */
export class AVEventReader{
  constructor(){
    this.state=null;this.seen=new WeakSet();this.generation=0;this.serial=0;this.lastTime=-Infinity;
    this.log=null;this.length=0;this.tail=null;
  }
  read(s){
    if(this.state!==s){
      this.state=s;this.seen=new WeakSet();this.generation++;this.serial=0;
      this.log=null;this.length=0;this.tail=null;
    }
    const log=s.events||[],array=Array.isArray(log);
    const append=array&&this.log===log&&log.length>=this.length&&s.time>=this.lastTime&&
      (this.length===0||Object.is(log[this.length-1],this.tail));
    const start=append?this.length:0;
    this.lastTime=s.time;
    const active=!s.paused&&['running','cleared','won','lost','ending','complete'].includes(s.phase),result=[];
    if(array){
      for(let index=start;index<log.length;index++)this.consume(log[index],s,active,result);
      this.log=log;this.length=log.length;this.tail=this.length?log[this.length-1]:null;
    }else{
      for(const event of log)this.consume(event,s,active,result);
      this.log=null;this.length=0;this.tail=null;
    }
    return result;
  }
  consume(event,s,active,result){
    if(!event||typeof event!=='object'||this.seen.has(event))return;
    this.seen.add(event);
    const record=adaptAVEvent(event,s,`${this.generation}:${++this.serial}`);
    if(!record||!active)return;
    if(!Number.isFinite(record.simTime)||record.simTime>s.time+1e-8||s.time-record.simTime>1.5)return;
    result.push(record);
  }
}
