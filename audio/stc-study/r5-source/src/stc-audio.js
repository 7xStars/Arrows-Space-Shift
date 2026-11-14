import {STC_SCORE,STC_STEP_SECONDS,STC_DURATION,stcScoreStep,stcMidiHz} from './stc-score.js';
export {STC_SCORE,STC_DURATION} from './stc-score.js';
export const STC_AUDIO_LIMITS=Object.freeze({voices:32,sources:96,history:64,identities:128});
const clamp=(value,fallback=0)=>Math.max(0,Math.min(1,Number.isFinite(value)?value:fallback));
const set=(parameter,value,time)=>parameter.setValueAtTime(value,time);
const hash=value=>{let result=2166136261;for(const letter of String(value))result=Math.imul(result^letter.charCodeAt(0),16777619);return result>>>0;};
const shapeCurve=(drive=2)=>{const values=new Float32Array(2049),normal=Math.tanh(drive);for(let i=0;i<values.length;i++)values[i]=Math.tanh((i/1024-1)*drive)/normal;return values;};

/** Original browser synthesis for the isolated Structural Techno-Cosmism study. */
export class StructuralAudio{
  constructor(options={}){
    this.options={sound:true,volume:.5,music:true,musicVolume:.55,effectsVolume:.8,ambienceVolume:.25,spatialMode:'headphones',...options};
    this.context=null;this.offline=false;this.playing=false;this.mode='combined';this.step=0;this.nextTime=0;
    this.contextCreations=0;this.voices=new Set();this.sources=new Set();this.staticNodes=[];this.persistent=[];this.spatialRoutes=[];
    this.history=[];this.identities=new Map();this.seen=new Map();this.scheduled=[];this.state={intensity:.5,phase:0};
    this.stats={peakVoices:0,peakSources:0,dropped:0,crossings:0,announcements:0,steps:0};this.lastAcid=null;
  }
  useContext(context){
    if(this.context&&this.context!==context)throw new Error('The study already has an audio context.');
    this.context=context;this.offline=typeof context.startRendering==='function';return this;
  }
  async unlock(){
    if(!this.options.sound)return false;
    try{
      if(!this.context){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return false;this.context=new Audio();this.contextCreations++;}
      if(this.context.state!=='running'&&!this.offline)await this.context.resume();
      return this.context.state==='running'||this.offline;
    }catch{return false;}
  }
  makeGain(value){const node=this.context.createGain();node.gain.value=value;this.staticNodes.push(node);return node;}
  makeFilter(type,frequency,q=.7){const node=this.context.createBiquadFilter();node.type=type;node.frequency.value=frequency;node.Q.value=q;this.staticNodes.push(node);return node;}
  makeShape(drive){const node=this.context.createWaveShaper();node.curve=shapeCurve(drive);node.oversample='2x';this.staticNodes.push(node);return node;}
  connect(source,...nodes){let tail=source;for(const node of nodes){tail.connect(node);tail=node;}return tail;}
  spatialPosition(name,seconds=0){
    if(name==='acid'){const angle=.2+.9*Math.sin(seconds/11);return {x:1.25*Math.sin(angle),y:.1,z:-1.25*Math.cos(angle)};}
    const angle=(name==='drone-left'?-1.15:1.15)+seconds*Math.PI*2/38;
    return {x:1.4*Math.sin(angle),y:name==='drone-left'?.06:-.04,z:-1.4*Math.cos(angle)};
  }
  spatialRoute(name,position){
    const panner=this.context.createPanner();panner.panningModel=this.options.spatialMode==='stereo'?'equalpower':'HRTF';
    panner.distanceModel='inverse';panner.refDistance=1;panner.maxDistance=10000;panner.rolloffFactor=0;
    panner.coneInnerAngle=360;panner.coneOuterAngle=360;panner.coneOuterGain=1;
    panner.channelCount=1;panner.channelCountMode='clamped-max';
    const route={name,panner,targetPosition:{...position}};
    this.staticNodes.push(panner);this.spatialRoutes.push(route);
    this.positionSpatial(route,position,this.context.currentTime,false);return route;
  }
  positionSpatial(route,position,time,smooth=true){
    for(const [key,value] of Object.entries(position)){
      const parameter=route.panner[`position${key.toUpperCase()}`];
      if(parameter){if(smooth)parameter.linearRampToValueAtTime(value,time);else parameter.setValueAtTime(value,time);}
    }
    route.targetPosition={...position};
  }
  buildSpatialRoutes(){
    const listener=this.context.listener,now=this.context.currentTime;
    if(listener){
      for(const [key,value] of Object.entries({positionX:0,positionY:0,positionZ:0,forwardX:0,forwardY:0,forwardZ:-1,upX:0,upY:1,upZ:0}))
        listener[key]?.setValueAtTime(value,now);
    }
    this.kickUpperRoutes=[this.spatialRoute('kick-upper-left',{x:-.55,y:.15,z:-1.2}),this.spatialRoute('kick-upper-right',{x:.55,y:.15,z:-1.2})];
    for(const route of this.kickUpperRoutes)route.panner.connect(this.drums);
    this.kickReflection=this.spatialRoute('kick-reflection',{x:.75,y:.05,z:.65});this.kickReflection.panner.connect(this.bassDuck);
    this.acidRoute=this.spatialRoute('acid',this.spatialPosition('acid',this.step*STC_STEP_SECONDS));this.acidRoute.panner.connect(this.synthDuck);
    this.droneRoutes=['drone-left','drone-right'].map(name=>this.spatialRoute(name,this.spatialPosition(name,this.step*STC_STEP_SECONDS)));
  }
  splitKickBand(source,lowDestination,highDestination,nodes){
    // Complementary first-order bands keep the low part on the centered path.
    const k=Math.tan(Math.PI*180/this.context.sampleRate),denominator=[1,(k-1)/(k+1)];
    const low=this.context.createIIRFilter([k/(k+1),k/(k+1)],denominator),
      high=this.context.createIIRFilter([1/(k+1),-1/(k+1)],denominator);
    nodes.push(low,high);this.connect(source,low,lowDestination);this.connect(source,high,highDestination);
  }
  buildGraph(){
    if(this.master)return;
    const a=this.context;this.master=this.makeGain(0);this.buses={music:this.makeGain(0),effects:this.makeGain(0),ambience:this.makeGain(0)};
    const safety=a.createDynamicsCompressor();safety.threshold.value=-8;safety.knee.value=3;safety.ratio.value=8;safety.attack.value=.003;safety.release.value=.09;this.staticNodes.push(safety);
    for(const bus of Object.values(this.buses))bus.connect(safety);
    this.connect(safety,this.master,a.destination);
    this.drums=this.makeGain(.7);this.drums.connect(this.buses.music);
    this.bassDuck=this.makeGain(1);this.bassDuck.connect(this.buses.music);
    this.synthDuck=this.makeGain(1);this.synthDuck.connect(this.buses.music);
    this.buildSpatialRoutes();this.buildDelay();this.buildRumble();this.buildAcid();this.buildDrone();this.applyOptions();
  }
  buildDelay(){
    const a=this.context;this.delaySend=this.makeGain(.22);
    const left=a.createDelay(2),right=a.createDelay(2);left.delayTime.value=STC_STEP_SECONDS*3;right.delayTime.value=STC_STEP_SECONDS*5;
    const lpf=this.makeFilter('lowpass',2100),rpf=this.makeFilter('lowpass',1700),high=this.makeFilter('highpass',380),feedback=this.makeGain(.29),returnGain=this.makeGain(.2);
    const lp=a.createStereoPanner(),rp=a.createStereoPanner();lp.pan.value=-.36;rp.pan.value=.36;
    this.staticNodes.push(left,right,lp,rp);this.connect(this.delaySend,high,left,lpf,lp,returnGain,this.buses.music);
    this.connect(lpf,right,rpf,rp,returnGain);this.connect(rpf,feedback,left);
  }
  buildRumble(){
    const a=this.context;this.rumbleSend=this.makeGain(.13);
    const delay=a.createDelay(1);delay.delayTime.value=STC_STEP_SECONDS*3;this.staticNodes.push(delay);
    const low=this.makeFilter('lowpass',165),high=this.makeFilter('highpass',38),drive=this.makeShape(2.2),feedback=this.makeGain(.38),level=this.makeGain(.42);
    this.connect(this.rumbleSend,delay,low,drive,high,level);this.connect(high,feedback,delay);
    this.splitKickBand(level,this.bassDuck,this.kickReflection.panner,this.staticNodes);
  }
  persistentOscillator(type,frequency){
    const node=this.context.createOscillator();node.type=type;node.frequency.value=frequency;this.sources.add(node);this.persistent.push(node);
    node.onended=()=>{this.sources.delete(node);try{node.disconnect();}catch{}};node.start(this.context.currentTime);return node;
  }
  buildAcid(){
    const a=this.context,first=this.makeFilter('lowpass',300,8),second=this.makeFilter('lowpass',1800,.6),
      drive=this.makeShape(2.8),post=this.makeFilter('lowpass',2300,.65),high=this.makeFilter('highpass',53),gain=this.makeGain(.0001),main=this.makeGain(.34);
    this.acid={first,second,gain,osc:[]};
    for(const [type,level] of [['sawtooth',.9],['square',.045]]){
      const osc=this.persistentOscillator(type,stcMidiHz(41)),mix=this.makeGain(level);this.connect(osc,mix,first);this.acid.osc.push(osc);
    }
    this.connect(first,second,drive,post,high,gain,main,this.acidRoute.panner);main.connect(this.delaySend);this.lastAcid=null;
  }
  buildDrone(){
    this.droneGain=this.makeGain(.016);this.droneGain.connect(this.buses.ambience);
    for(const [index,frequency] of [stcMidiHz(41),stcMidiHz(41)*1.002].entries()){
      const osc=this.persistentOscillator('sine',frequency),route=this.droneRoutes[index];this.connect(osc,route.panner,this.droneGain);
    }
    this.stats.peakSources=Math.max(this.stats.peakSources,this.sources.size);
  }
  applyOptions(){
    if(!this.master)return;
    const now=this.context.currentTime,audible=this.options.sound&&this.mode!=='visual',musicOn=this.playing&&this.options.music;
    this.master.gain.setTargetAtTime(audible?clamp(this.options.volume,.5):0,now,.018);
    this.buses.music.gain.setTargetAtTime(musicOn?clamp(this.options.musicVolume,.55):0,now,.018);
    this.buses.effects.gain.setTargetAtTime(clamp(this.options.effectsVolume,.8),now,.018);
    this.buses.ambience.gain.setTargetAtTime(musicOn?clamp(this.options.ambienceVolume,.25):0,now,.018);
    const model=this.options.spatialMode==='stereo'?'equalpower':'HRTF';
    for(const route of this.spatialRoutes)route.panner.panningModel=model;
  }
  setOptions(options={}){
    if(options.spatialMode!==undefined&&!['headphones','stereo'].includes(options.spatialMode))throw new RangeError('Unknown spatial audio mode.');
    Object.assign(this.options,options);this.applyOptions();
  }
  setMode(mode){if(!['combined','visual','audio','mismatched'].includes(mode))throw new RangeError('Unknown study audio mode.');this.mode=mode;this.applyOptions();}
  start(){this.stop();this.seen.clear();this.history=[];this.identities.clear();this.playing=true;this.nextTime=(this.context?.currentTime||0)+.04;if(this.context)this.buildGraph();this.applyOptions();return this;}
  pause(){
    if(!this.playing)return;const now=this.context?.currentTime||0,future=this.scheduled.find(event=>event.time>=now);
    if(future)this.step=future.step;this.playing=false;this.disposeGraph();this.scheduled=[];
  }
  resume(){if(this.playing)return;this.playing=true;this.nextTime=(this.context?.currentTime||0)+.04;if(this.context)this.buildGraph();this.applyOptions();}
  stop(){this.playing=false;this.disposeGraph();this.step=0;this.nextTime=0;this.scheduled=[];}
  disposeGraph(){
    const now=this.context?.currentTime||0;
    if(this.master){this.master.gain.cancelScheduledValues(now);this.master.gain.setValueAtTime(0,now);}
    for(const voice of [...this.voices])this.finish(voice,true);
    for(const source of this.persistent){try{source.stop(now+.005);}catch{}this.sources.delete(source);try{source.disconnect();}catch{}}
    for(const node of this.staticNodes){try{node.disconnect();}catch{}}
    this.persistent=[];this.staticNodes=[];this.spatialRoutes=[];this.master=null;this.buses={};this.acid=null;this.lastAcid=null;
  }
  noiseBuffer(){
    if(!this.noise){const a=this.context,length=a.sampleRate,buffer=a.createBuffer(1,length,a.sampleRate),data=buffer.getChannelData(0);let seed=0x03d15251;
      for(let i=0;i<length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/2147483648-1;}this.noise=buffer;}
    return this.noise;
  }
  finish(voice,stop=false){
    if(voice.finished)return;voice.finished=true;this.voices.delete(voice);
    for(const source of voice.sources){if(stop)try{source.stop(this.context.currentTime+.005);}catch{}this.sources.delete(source);}
    for(const node of voice.nodes)try{node.disconnect();}catch{}
  }
  voice(time,duration,priority,build){
    if(this.voices.size>=STC_AUDIO_LIMITS.voices||this.sources.size>=STC_AUDIO_LIMITS.sources-6){
      const victim=[...this.voices].find(voice=>voice.priority<priority);
      if(victim)this.finish(victim,true);else{this.stats.dropped++;return null;}
    }
    const a=this.context,voice={sources:[],nodes:[],priority,time,finished:false};
    const gain=a.createGain();voice.nodes.push(gain);
    const oscillator=(type,frequency)=>{const source=a.createOscillator();source.type=type;source.frequency.value=frequency;voice.sources.push(source);voice.nodes.push(source);return source;};
    const noise=()=>{const source=a.createBufferSource();source.buffer=this.noiseBuffer();voice.sources.push(source);voice.nodes.push(source);return source;};
    const filter=(type,frequency,q=.7)=>{const node=a.createBiquadFilter();node.type=type;node.frequency.value=frequency;node.Q.value=q;voice.nodes.push(node);return node;};
    const pan=value=>{const node=a.createStereoPanner();node.pan.value=value;voice.nodes.push(node);return node;};
    build({a,gain,oscillator,noise,filter,pan,voice});
    this.voices.add(voice);let pending=voice.sources.length;
    for(const source of voice.sources){this.sources.add(source);source.onended=()=>{this.sources.delete(source);if(--pending===0)this.finish(voice);};source.start(time);source.stop(time+duration);}
    this.stats.peakVoices=Math.max(this.stats.peakVoices,this.voices.size);this.stats.peakSources=Math.max(this.stats.peakSources,this.sources.size);return voice;
  }
  instrument(event,time){
    const level=Number.isFinite(event.level)?event.level:1,instrument=event.instrument;
    if(instrument==='kick'){
      this.voice(time,.54,1,({a,gain,oscillator,noise,filter,voice})=>{
        const body=oscillator('sine',165),drive=a.createWaveShaper();drive.curve=shapeCurve(3.1);drive.oversample='2x';voice.nodes.push(drive);
        set(body.frequency,165,time);body.frequency.exponentialRampToValueAtTime(49,time+.024);body.frequency.exponentialRampToValueAtTime(44,time+.24);
        set(gain.gain,.0001,time);gain.gain.exponentialRampToValueAtTime(.95*level,time+.002);gain.gain.exponentialRampToValueAtTime(.46*level,time+.07);gain.gain.exponentialRampToValueAtTime(.0001,time+.5);
        this.connect(body,drive,gain,this.drums);gain.connect(this.rumbleSend);
        const upper=this.kickUpperRoutes[Math.floor(time/(STC_STEP_SECONDS*4))%2].panner;
        const punch=oscillator('triangle',95),pg=a.createGain();voice.nodes.push(pg);punch.frequency.exponentialRampToValueAtTime(48,time+.055);set(pg.gain,.17*level,time);pg.gain.exponentialRampToValueAtTime(.0001,time+.11);this.connect(punch,pg);this.splitKickBand(pg,this.drums,upper,voice.nodes);
        const click=noise(),hp=filter('highpass',1900),cg=a.createGain();voice.nodes.push(cg);set(cg.gain,.09*level,time);cg.gain.exponentialRampToValueAtTime(.0001,time+.011);this.connect(click,hp,cg,upper);
      });return;
    }
    if(instrument==='sub'){
      this.voice(time,.23,0,({gain,oscillator})=>{const osc=oscillator('sine',stcMidiHz(event.midi));set(gain.gain,.0001,time);gain.gain.exponentialRampToValueAtTime(.26*level,time+.013);gain.gain.exponentialRampToValueAtTime(.0001,time+.22);this.connect(osc,gain,this.bassDuck);});return;
    }
    if(instrument==='hat-open'||instrument==='hat-closed'){
      const open=instrument==='hat-open',duration=open?.18:.055;
      this.voice(time,duration+.015,0,({gain,noise,filter,pan})=>{const source=noise(),hp=filter('highpass',open?6800:7800),lp=filter('lowpass',12500),stereo=pan(event.pan||0);set(gain.gain,.045*level,time);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);this.connect(source,hp,lp,gain,stereo,this.drums);});return;
    }
    if(instrument==='clap'){
      this.voice(time,.23,0,({a,gain,noise,filter,oscillator,voice})=>{const source=noise(),hp=filter('highpass',620),lp=filter('lowpass',5200),drive=a.createWaveShaper();drive.curve=shapeCurve(2.5);voice.nodes.push(drive);set(gain.gain,.0001,time);
        for(const offset of [0,.011,.023,.035]){set(gain.gain,.14*level,time+offset+.001);gain.gain.exponentialRampToValueAtTime(.006,time+offset+.01);}
        set(gain.gain,.09*level,time+.047);gain.gain.exponentialRampToValueAtTime(.0001,time+.22);this.connect(source,hp,lp,drive,gain,this.drums);
        const body=oscillator('triangle',190),bodyGain=a.createGain();voice.nodes.push(bodyGain);body.frequency.exponentialRampToValueAtTime(115,time+.055);set(bodyGain.gain,.11*level,time);bodyGain.gain.exponentialRampToValueAtTime(.0001,time+.13);this.connect(body,bodyGain,this.drums);
      });return;
    }
    if(instrument==='tom'){
      this.voice(time,.24,0,({gain,oscillator})=>{const hz=stcMidiHz(event.midi),osc=oscillator('sine',hz*2);set(osc.frequency,hz*2,time);osc.frequency.exponentialRampToValueAtTime(hz,time+.065);set(gain.gain,.2*level,time);gain.gain.exponentialRampToValueAtTime(.0001,time+.23);this.connect(osc,gain,this.drums);});return;
    }
    this.voice(time,.16,0,({a,gain,oscillator,filter,pan,voice})=>{
      const metal=instrument==='metal',hz=metal?780:425,mix=a.createGain();mix.gain.value=.3;voice.nodes.push(mix);
      for(const ratio of metal?[1,1.414,2.77]:[1,2.31]){const osc=oscillator('sine',hz*ratio);osc.frequency.exponentialRampToValueAtTime(hz*ratio*.93,time+.045);osc.connect(mix);}
      const hp=filter('highpass',metal?440:280),lp=filter('lowpass',metal?3000:2300),stereo=pan(event.pan||0),drive=a.createWaveShaper();drive.curve=shapeCurve(2.7);voice.nodes.push(drive);set(gain.gain,.13*level,time);gain.gain.exponentialRampToValueAtTime(.0001,time+(metal?.12:.075));this.connect(mix,hp,drive,lp,gain,stereo,this.drums);gain.connect(this.delaySend);
    });
  }
  scheduleAcid(note,time){
    const acid=this.acid;if(!acid)return;
    const gain=acid.gain.gain,step=STC_STEP_SECONDS;
    if(!note){gain.setTargetAtTime(.0001,time,.015);this.lastAcid=null;return;}
    const hz=stcMidiHz(note.midi),tied=this.lastAcid?.slide&&time-this.lastAcid.time<step*1.1;
    for(const osc of acid.osc){osc.frequency.cancelScheduledValues(time);set(osc.frequency,tied?this.lastAcid.hz:hz,time);if(tied)osc.frequency.exponentialRampToValueAtTime(hz,time+.075);}
    const peak=(note.accent?.39:.25)*note.level,gate=step*note.gate;
    gain.cancelScheduledValues(time);if(!tied)set(gain,.0001,time);gain.exponentialRampToValueAtTime(peak,time+.005);
    if(note.slide)set(gain,peak*.65,time+step);else{gain.exponentialRampToValueAtTime(peak*.55,time+gate*.7);gain.exponentialRampToValueAtTime(.0001,time+Math.max(.025,gate));}
    const cutoff=note.cutoff,maximum=Math.min(8500,cutoff+note.envelope*(note.accent?1.5:1));
    acid.first.Q.setValueAtTime(note.resonance,time);acid.first.frequency.cancelScheduledValues(time);
    set(acid.first.frequency,tied?cutoff+note.envelope*.5:cutoff,time);acid.first.frequency.exponentialRampToValueAtTime(maximum,time+.006);
    acid.first.frequency.exponentialRampToValueAtTime(cutoff,time+Math.max(.025,note.decay));
    set(acid.second.frequency,Math.min(6500,maximum*.95+300),time);
    this.lastAcid={time,hz,slide:note.slide===true};
  }
  scheduleStep(index,time,context=this.state){
    if(!this.context)return;this.buildGraph();const frame=stcScoreStep(index,context);
    for(const route of [this.acidRoute,...this.droneRoutes])this.positionSpatial(route,this.spatialPosition(route.name,index*STC_STEP_SECONDS),time+STC_STEP_SECONDS);
    if(frame.pump){for(const [node,low] of [[this.bassDuck,.25],[this.synthDuck,.55]]){set(node.gain,low,time);node.gain.exponentialRampToValueAtTime(1,time+.19);}}
    this.droneGain.gain.setTargetAtTime(.018*frame.drone,time,.2);
    for(const event of frame.events)this.instrument(event,time+(event.offset||0)*STC_STEP_SECONDS);this.scheduleAcid(frame.acid,time);
    this.stats.steps++;return frame;
  }
  update(state={}){
    this.state={...this.state,intensity:clamp(state.intensity,this.state.intensity),phase:state.phase??this.state.phase};
    const a=this.context;if(!this.playing||!a||(!this.offline&&a.state!=='running'))return;
    this.buildGraph();if(this.nextTime<a.currentTime-.08)this.nextTime=a.currentTime+.025;
    this.scheduled=this.scheduled.filter(event=>event.time>=a.currentTime-.2);
    let guard=0;while(this.nextTime<a.currentTime+.16&&guard++<3){this.scheduleStep(this.step,this.nextTime);this.scheduled.push({step:this.step,time:this.nextTime});this.step++;this.nextTime+=STC_STEP_SECONDS;}
  }
  identityCue(event,kind){
    const id=String(event.eventId);if(this.seen.has(id))return null;this.seen.set(id,true);
    while(this.seen.size>STC_AUDIO_LIMITS.identities)this.seen.delete(this.seen.keys().next().value);
    const objectId=String(event.objectId);if(!this.identities.has(objectId))this.identities.set(objectId,hash(event.motif??event.family??objectId)%4);
    while(this.identities.size>STC_AUDIO_LIMITS.identities)this.identities.delete(this.identities.keys().next().value);
    const position=kind==='crossing'?event.destination:event.position,
      pan=Math.max(-.65,Math.min(.65,Number.isFinite(event.pan)?event.pan:Number.isFinite(position?.x)?position.x:0)),
      actualPan=this.mode==='mismatched'&&kind==='crossing'?-pan:pan,
      cue={kind,type:event.type,eventId:id,objectId,from:event.from,to:event.to,motif:this.identities.get(objectId),pan:actualPan,mode:this.mode};
    this.history.push(Object.freeze(cue));if(this.history.length>STC_AUDIO_LIMITS.history)this.history.shift();return cue;
  }
  playIdentity(cue){
    if(!this.playing||!this.options.sound||this.mode==='visual'||!this.context||(!this.offline&&this.context.state!=='running'))return;
    this.buildGraph();const time=this.context.currentTime+.002,note=[53,56,58,60][cue.motif];
    for(const [offset,midi,level] of [[0,note,.11],[.085,note+7,.075]])this.voice(time+offset,.14,3,({gain,oscillator,pan:stereo})=>{
      const source=oscillator('triangle',stcMidiHz(midi)),panner=stereo(cue.pan);set(gain.gain,.0001,time+offset);gain.gain.exponentialRampToValueAtTime(level*(cue.kind==='entry'?.82:1),time+offset+.004);gain.gain.exponentialRampToValueAtTime(.0001,time+offset+.13);this.connect(source,gain,panner,this.buses.effects);
    });
  }
  announce(event){
    if(!event||event.type!=='attack-entered'||event.eventId===undefined||event.eventId===null||event.objectId===undefined||event.objectId===null||
      event.topology!=='bolza'||event.predicted===true||event.renderOnly===true||
      !Number.isFinite(event.position?.x)||!Number.isFinite(event.position?.y))return false;
    const cue=this.identityCue(event,'entry');if(!cue)return false;this.stats.announcements++;this.playIdentity(cue);return true;
  }
  attack(event){return this.announce(event);}
  crossing(event){
    if(!event||event.type!=='crossing'||event.eventId===undefined||event.eventId===null||event.objectId===undefined||event.objectId===null||event.topology!=='bolza'||
      !Number.isInteger(event.from)||event.from<0||event.from>7||!Number.isInteger(event.to)||event.to<0||event.to>7||
      event.predicted===true||event.renderOnly===true)return false;
    const cue=this.identityCue(event,'crossing');if(!cue)return false;this.stats.crossings++;this.playIdentity(cue);return true;
  }
  diagnosticState(){
    return {contextState:this.context?.state||'uninitialized',contextCreations:this.contextCreations,playing:this.playing,mode:this.mode,step:this.step,
      spatialMode:this.options.spatialMode,hrtfNodes:this.spatialRoutes.filter(route=>route.panner.panningModel==='HRTF').length,
      spatialBypassed:this.options.spatialMode==='stereo',routes:this.spatialRoutes.map(route=>({name:route.name,model:route.panner.panningModel,
        position:Object.fromEntries(['x','y','z'].map(key=>[key,route.panner[`position${key.toUpperCase()}`].value])),targetPosition:{...route.targetPosition}})),
      voices:this.voices.size,sources:this.sources.size,identities:this.identities.size,seenEvents:this.seen.size,
      buses:Object.fromEntries(Object.entries(this.buses||{}).map(([name,node])=>[name,node.gain.value])),
      ...this.stats,cueHistory:this.history.map(event=>({...event})),sourceHistory:this.history.filter(event=>event.kind==='entry').map(event=>({...event})),
      crossingHistory:this.history.filter(event=>event.kind==='crossing').map(event=>({...event}))};
  }
}
