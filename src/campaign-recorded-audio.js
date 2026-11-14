const clamp=value=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
const asset=name=>new URL(`../assets/audio/campaign-music-v1/${name}`,import.meta.url).href;
const track=(id,title,bpm)=>Object.freeze({id,title,bpm,duration:240,span:24,overlap:.08,
  segments:Object.freeze(Array.from({length:10},(_,index)=>Object.freeze({index,span:24,duration:index===9?24:24.08,
    urls:Object.freeze([asset(`${id}-${String(index).padStart(2,'0')}-core.ogg`),asset(`${id}-${String(index).padStart(2,'0')}-atmosphere.ogg`)])})))});

export const CAMPAIGN_RECORDINGS=Object.freeze({
  traditional:track('act1-03','Off Axis',134),
  klein:track('act2-03','Order of Returns',134),
  projective:track('act3-03','Order of Force',132),
  bolza:track('act4-03','Order Leaves a Trace',128),
  title:Object.freeze({id:'identified-return-r9',title:'Identified Return r9',bpm:134,duration:3678806/48000,
    span:3678806/48000,overlap:0,segments:Object.freeze([Object.freeze({index:0,span:3678806/48000,
      duration:3678806/48000,urls:Object.freeze([new URL('../assets/audio/stc-title-r9.ogg',import.meta.url).href])})])}),
});

/** Select presentation data. Never change the supplied simulation state. */
export function campaignRecordingFor(state,{title=false,recovery=false}={}){
  if(title)return {key:'title',track:CAMPAIGN_RECORDINGS.title,quiet:false,mixMode:'full',intensity:.5,repeat:true,offset:0};
  const ending=state?.phase==='ending'||state?.musicState==='ending';
  const repair=state?.mode==='repair';
  const theme=ending||repair||(Number.isInteger(state?.stageIndex)&&state?.player?.position)?'bolza':
    (state?.campaign?.index??0)>=18?'projective':(state?.campaign?.index??0)>=9?'klein':'traditional';
  const mixMode=ending||repair?'atmosphere':recovery||state?.phase==='choosing'?'recovery':'full';
  return {key:ending?'bolza-ending':theme,track:CAMPAIGN_RECORDINGS[theme],quiet:mixMode!=='full',mixMode,
    intensity:clamp((state?.shots?.length||0)/65+(state?.enemyShots?.length||0)/65+(state?.enemies?.length||0)/18),
    repeat:!ending,offset:ending?216:0};
}

/** Keep only the current and next decoded stereo stem pairs. */
export class CampaignRecordedAudio{
  constructor(context,buses,{fetcher=(...args)=>globalThis.fetch(...args)}={}){
    this.context=context;this.buses=buses;this.fetcher=fetcher;this.selection=null;this.cache=new Map();this.pending=new Map();
    this.groups=new Map();this.queue=Promise.resolve();this.controllers=new Set();this.generation=0;this.desired=false;this.offset=0;
    this.clockTime=null;this.clockOffset=0;this.error='';this.state='idle';this.warnUntil=0;this.history=[];
    this.stats={fetches:0,decodes:0,peakDecodedSegments:0,starts:0,underruns:0,repeats:0};
    this.core=context.createGain();this.air=context.createGain();this.core.gain.value=0;this.air.gain.value=0;
    this.core.connect(buses.music);this.air.connect(buses.ambience);this.levels={core:0,atmosphere:0};
  }
  position(){return this.clockTime===null?this.offset:this.clockOffset+Math.max(0,this.context.currentTime-this.clockTime);}
  partAt(position){return Math.floor(Math.max(0,position)/this.selection.track.span);}
  localIndex(absolute){return absolute%this.selection.track.segments.length;}
  select(selection){
    if(this.selection?.key===selection.key){this.selection={...selection};return;}
    const sameTrack=this.selection?.track.id===selection.track.id;
    this.stopSources();this.generation++;for(const controller of this.controllers)controller.abort();
    this.pending.clear();if(!sameTrack)this.cache.clear();
    this.selection={...selection};this.offset=selection.offset||0;this.clockTime=null;this.error='';this.state='ready';
    this.trim();
  }
  trim(){
    if(!this.selection)return;const index=this.partAt(this.position()),count=this.selection.track.segments.length;
    const keep=new Set([index%count,(index+1)%count]);
    for(const key of this.cache.keys())if(!keep.has(key))this.cache.delete(key);
  }
  ensure(index){
    if(this.cache.has(index))return Promise.resolve(this.cache.get(index));
    if(this.pending.has(index))return this.pending.get(index);
    const token=this.generation,segment=this.selection.track.segments[index];
    const job=this.queue.then(async()=>{
      if(token!==this.generation)return null;
      const buffers=[];
      // Decode one job at a time. Do not overlap long native allocations.
      for(const url of segment.urls){
        const controller=new AbortController();this.controllers.add(controller);
        const timer=setTimeout(()=>controller.abort(new Error('Music load timed out. Select Retry.')),15000);let bytes;
        try{
          const response=await this.fetcher(url,{signal:controller.signal});
          if(!response.ok)throw new Error(`Music load failed (${response.status}).`);
          this.stats.fetches++;bytes=await response.arrayBuffer();
        }finally{clearTimeout(timer);this.controllers.delete(controller);}
        if(token!==this.generation)return null;
        const buffer=await this.context.decodeAudioData(bytes);this.stats.decodes++;
        if(token!==this.generation)return null;
        if(buffer.numberOfChannels!==2||Math.abs(buffer.duration-segment.duration)>2/buffer.sampleRate)
          throw new Error('The music segment format or duration is not valid.');
        buffers.push(buffer);
      }
      if(buffers.length===2&&(buffers[0].sampleRate!==buffers[1].sampleRate||buffers[0].length!==buffers[1].length))
        throw new Error('The music stems are not aligned.');
      if(token!==this.generation)return null;
      this.cache.set(index,buffers);this.trim();this.stats.peakDecodedSegments=Math.max(this.stats.peakDecodedSegments,this.cache.size);
      return buffers;
    }).catch(error=>{
      if(token===this.generation){this.offset=this.position();this.clockTime=null;this.stopSources();this.error=String(error.message||error);this.state='error';}
      return null;
    }).finally(()=>{if(token===this.generation)this.pending.delete(index);});
    this.pending.set(index,job);this.queue=job.then(()=>undefined);return job;
  }
  update(selection,playing=true){
    if(selection)this.select(selection);this.desired=Boolean(playing);
    if(!this.selection)return;
    if(!this.desired){this.pause();return;}
    if(this.error){this.state='error';return;}
    if(this.context.state!=='running'){this.state='suspended';return;}
    let position=this.position(),index=this.partAt(position),part=this.localIndex(index);
    if(!this.selection.repeat&&position>=this.selection.track.duration){this.desired=false;this.pause();this.state='ended';return;}
    this.setLayers();
    if(!this.cache.has(part)){
      if(this.clockTime!==null){this.offset=position;this.clockTime=null;this.stopSources();this.stats.underruns++;}
      this.state='loading';this.ensure(part).then(buffers=>{if(buffers&&this.desired&&!this.error)this.update(null,this.desired);});return;
    }
    if(this.clockTime===null){this.clockTime=this.context.currentTime+.045;this.clockOffset=this.offset;position=this.offset;index=this.partAt(position);part=this.localIndex(index);}
    this.state='playing';this.schedule(index);
    const next=index+1,nextPart=this.localIndex(next),count=this.selection.track.segments.length;
    if(this.selection.repeat||next<count){
      if(!this.cache.has(nextPart)&&!this.pending.has(nextPart))this.ensure(nextPart);
      const nextAt=this.clockTime+next*this.selection.track.span-this.clockOffset;
      if(nextAt<=this.context.currentTime+.3&&this.cache.has(nextPart))this.schedule(next);
    }
    this.trim();
  }
  setLayers(){
    const mode=this.selection.mixMode||(this.selection.quiet?'atmosphere':'full'),duck=this.context.currentTime<this.warnUntil;
    const core=(mode==='atmosphere'?0:mode==='recovery'?.42:.78+this.selection.intensity*.22)*(duck?.75:1);
    const atmosphere=(mode==='full'?.85:1)*(duck?.9:1);
    for(const [name,node,value]of [['core',this.core,core],['atmosphere',this.air,atmosphere]]){
      if(Math.abs(this.levels[name]-value)<.008)continue;
      this.levels[name]=value;node.gain.setTargetAtTime(value,this.context.currentTime,mode==='full'?.035:.12);
    }
  }
  schedule(absolute){
    if(this.groups.has(absolute))return;
    const index=this.localIndex(absolute),buffers=this.cache.get(index);if(!buffers)return;
    const segment=this.selection.track.segments[index],now=this.context.currentTime;
    const expected=this.clockTime+absolute*this.selection.track.span-this.clockOffset;
    const at=Math.max(expected,this.clockTime,now+.008),skip=Math.max(0,at-expected);
    if(skip>=segment.duration)return;
    const token=this.generation,group={sources:[],gains:[],remaining:buffers.length};
    this.groups.set(absolute,group);
    buffers.forEach((buffer,layer)=>{
      const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;source.loop=false;
      source.connect(gain);gain.connect(layer?this.air:this.core);
      const fadeIn=absolute===this.partAt(this.clockOffset)?Math.min(.02,segment.duration-skip):Math.max(0,segment.duration-segment.span-skip);
      gain.gain.setValueAtTime(fadeIn>0?0:1,at);if(fadeIn>0)gain.gain.linearRampToValueAtTime(1,at+fadeIn);
      if(segment.duration>segment.span){const fadeAt=expected+segment.span;gain.gain.setValueAtTime(1,Math.max(at+fadeIn,fadeAt));gain.gain.linearRampToValueAtTime(0,expected+segment.duration);}
      source.onended=()=>{source.disconnect();gain.disconnect();group.remaining--;if(group.remaining===0&&token===this.generation&&this.groups.get(absolute)===group)this.groups.delete(absolute);};
      source.start(at,skip,segment.duration-skip);group.sources.push(source);group.gains.push(gain);this.stats.starts++;
    });
    if(absolute>=this.selection.track.segments.length&&index===0)this.stats.repeats++;
    this.history.push({trackId:this.selection.track.id,segment:index,absolute,start:at,offset:skip});if(this.history.length>24)this.history.shift();
  }
  stopSources(){
    const now=this.context.currentTime;
    for(const group of this.groups.values())group.sources.forEach((source,index)=>{
      const gain=group.gains[index];gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(gain.gain.value,now);gain.gain.linearRampToValueAtTime(0,now+.015);
      source.onended=()=>{source.disconnect();gain.disconnect();};
      try{source.stop(this.context.state==='running'?now+.015:now);}catch{source.disconnect();gain.disconnect();}
    });
    this.groups.clear();
  }
  pause(){
    this.offset=this.position();this.clockTime=null;this.stopSources();if(this.state!=='error'&&this.state!=='ended')this.state='paused';
  }
  restart(){this.stopSources();this.offset=this.selection?.offset||0;this.clockTime=null;this.error='';this.state='ready';this.trim();}
  duck(seconds=.24){this.warnUntil=Math.max(this.warnUntil,this.context.currentTime+seconds);if(this.selection)this.setLayers();}
  async retry(){
    this.error='';this.state='ready';if(!this.selection)return false;
    const data=await this.ensure(this.localIndex(this.partAt(this.offset)));if(data&&this.desired)this.update(null,true);return Boolean(data);
  }
  read(){
    const duration=this.selection?.track.duration||0,position=this.position();
    return {engine:'recorded-segments',trackId:this.selection?.track.id||null,title:this.selection?.track.title||'',
      mode:this.selection?.key||'idle',state:this.state,error:this.error,offset:duration?Math.min(duration,this.selection?.repeat?position%duration:position):0,
      duration,loadedSegments:this.cache.size,pendingSegments:this.pending.size,
      decodedBytes:[...this.cache.values()].flat().reduce((sum,buffer)=>sum+buffer.length*buffer.numberOfChannels*4,0),
      activeSources:[...this.groups.values()].reduce((sum,group)=>sum+group.sources.length,0),layers:{...this.levels},
      quiet:Boolean(this.selection?.quiet),mixMode:this.selection?.mixMode||(this.selection?.quiet?'atmosphere':'full'),
      ducked:this.context.currentTime<this.warnUntil,
      repeatPolicy:'Repeat the finite composition after its ending.',...this.stats,history:this.history.map(item=>({...item}))};
  }
}

const hash=value=>{let result=2166136261;for(const letter of String(value))result=Math.imul(result^letter.charCodeAt(0),16777619);return result>>>0;};
/** A small motif follows a real hostile projectile. Forecasts never enter this map. */
export class CampaignAttackMotifs{
  constructor(){this.identities=new Map();this.history=[];this.lastEntry=-Infinity;this.lastCross=-Infinity;}
  reset(){this.identities.clear();this.history=[];this.lastEntry=this.lastCross=-Infinity;}
  read(event,now){
    if(!event?.isPhysical||event.forecast)return null;
    if(event.type==='enemy.weapon.fire'){
      const ids=(event.objectIds?.length?event.objectIds:[event.objectId]).filter(id=>typeof id==='string'||Number.isFinite(id));
      if(!ids.length)return null;const motif=hash(event.sourceId??ids[0])%4;
      for(const id of ids)this.identities.set(String(id),motif);
      while(this.identities.size>128)this.identities.delete(this.identities.keys().next().value);
      if(now-this.lastEntry<.2)return null;this.lastEntry=now;
      return this.retain({kind:'entry',objectId:String(ids[0]),motif,topology:event.topology||'scrolling'});
    }
    if(!['topology.klein.cross','topology.projective.cross','topology.periodic.cross','topology.bolza.join'].includes(event.type)||event.objectId===null)return null;
    const motif=this.identities.get(String(event.objectId));if(motif===undefined||now-this.lastCross<.22)return null;
    this.lastCross=now;return this.retain({kind:'crossing',objectId:String(event.objectId),motif,topology:event.topology});
  }
  retain(cue){this.history.push(Object.freeze(cue));if(this.history.length>32)this.history.shift();return cue;}
}
