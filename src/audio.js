import {playerJoinForecast} from './geometry-cues.js';
import {AV_GRAMMAR,AVEventReader,isHyperbolicState} from './av-events.js';
import {SCORE_THEMES,scoreThemeFor,musicContextFor,arrangementStep} from './music.js';
import {CampaignRecordedAudio,CampaignAttackMotifs,campaignRecordingFor} from './campaign-recorded-audio.js';
export {SCORE_THEMES,scoreThemeFor} from './music.js';
const clamp=(value,fallback=0)=>Math.max(0,Math.min(1,Number.isFinite(value)?value:fallback));
const priorityOf=value=>value===true?3:Math.max(0,Math.min(3,Number.isFinite(value)?value:1));
const hiddenPage=()=>typeof document!=='undefined'&&document.hidden===true;
export const AUDIO_LIMITS=Object.freeze({voices:24,regularVoices:18,retiringVoices:4,noiseBuffers:4,distortionCurves:4});
export class FlightAudio{
  constructor(options={}){
    this.options={sound:true,volume:.5,music:true,musicVolume:.55,effectsVolume:.8,ambienceVolume:.25,recordedMusic:true,...options};
    this.context=null;this.flight=null;this.events=new AVEventReader();this.last=new Map();this.voices=0;
    this.activeVoices=new Set();this.retiringVoices=new Set();this.noiseCache=new Map();this.shapeCache=new Map();this.buses={};
    this.ambient=null;this.scoreTheme='';this.scoreStep=0;this.nextScoreTime=0;this.joinWarningKey='';this.joinWarningAt=-10;
    this.statistics={admitted:0,dropped:0,stolen:0,peakVoices:0,resumes:0};this.cueParameters=null;
    this.recorded=null;this.recordedUnavailable='';this.titleRequested=false;this.titleGeneration=0;this.attackMotifs=new CampaignAttackMotifs();
  }
  useContext(context){
    if(this.context&&this.context!==context)throw new Error('The audio context is already assigned.');
    this.context=context;this.offline=typeof context.startRendering==='function';
    if(!this.master){
      this.master=context.createGain();this.master.gain.value=this.options.sound?clamp(this.options.volume,.5):0;
      this.master.connect(context.destination);
      for(const [name,key] of [['music','musicVolume'],['effects','effectsVolume'],['ambience','ambienceVolume']]){
        const gain=context.createGain();gain.gain.value=name==='music'&&!this.options.music?0:clamp(this.options[key]);gain.connect(this.master);this.buses[name]=gain;
      }
    }
    if(this.options.recordedMusic!==false&&!this.offline&&!this.recorded){
      if(typeof context.decodeAudioData==='function'&&typeof context.createBufferSource==='function')
        this.recorded=new CampaignRecordedAudio(context,this.buses,this.options.recordedFetcher?{fetcher:this.options.recordedFetcher}:{});
      else this.recordedUnavailable='Recorded music is not available in this audio context.';
    }
    return this;
  }
  async resumeFromGesture(){
    if(!this.options.sound)return false;
    try{
      if(!this.context){
        const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return false;
        this.useContext(new Audio());
      }
      if(this.context.state!=='running'){await this.context.resume();this.statistics.resumes++;this.nextScoreTime=this.context.currentTime+.035;}
      return this.context.state==='running';
    }catch{return false;}
  }
  unlock(){return this.resumeFromGesture();}
  async startTitle(){
    if(!this.options.sound||!this.options.music||hiddenPage())return false;
    this.titleRequested=true;const generation=++this.titleGeneration;
    const resume=this.resumeFromGesture();
    // Load the recording while the browser waits for a permitted audio start.
    // Decoding does not start a source or change the browser audio policy.
    if(this.recorded){
      this.recorded.select(campaignRecordingFor(null,{title:true}));
      void this.recorded.ensure(0);
    }
    if(!await resume||!this.recorded||!this.titleRequested||!this.options.sound||!this.options.music||hiddenPage()||generation!==this.titleGeneration)return false;
    this.recorded.update(campaignRecordingFor(null,{title:true}),true);return true;
  }
  stopTitle(){this.titleRequested=false;this.titleGeneration++;if(this.recorded?.selection?.key==='title')this.recorded.update(null,false);}
  async retryMusic(){
    if(!await this.resumeFromGesture()||!this.recorded)return false;
    return this.recorded.retry();
  }
  setOptions(options){
    Object.assign(this.options,options);
    for(const [node,value] of [[this.master,this.options.sound?clamp(this.options.volume):0],
      [this.buses.music,this.options.music?clamp(this.options.musicVolume):0],
      [this.buses.effects,clamp(this.options.effectsVolume)],[this.buses.ambience,clamp(this.options.ambienceVolume)]]){
      if(node)node.gain.setTargetAtTime(value,this.context.currentTime,.03);
    }
    if(!this.options.sound||!this.options.music)this.stopAmbient();
  }
  diagnosticState(){
    const recorded=this.recorded?.read()||{engine:this.options.recordedMusic===false||this.offline?'legacy-procedural':'recorded-segments',state:this.recordedUnavailable?'error':'locked',trackId:null,title:'',error:this.recordedUnavailable};
    const titleState=!this.options.sound||!this.options.music?'muted':!this.titleRequested?'off':hiddenPage()?'hidden':
      recorded.error?'error':this.context?.state!=='running'?'waiting-for-gesture':
      recorded.trackId==='identified-return-r9'&&recorded.state==='playing'?'playing':'loading';
    return {contextState:this.context?.state||'uninitialized',voices:this.activeVoices.size,retiringVoices:this.retiringVoices.size,
      noiseBuffers:this.noiseCache.size,distortionCurves:this.shapeCache.size,theme:this.scoreTheme,scoreStep:this.scoreStep,
      buses:Object.fromEntries(Object.entries(this.buses).map(([name,node])=>[name,node.gain.value])),
      titleStartup:{requested:this.titleRequested,state:titleState},recorded,
      motifs:{tracked:this.attackMotifs.identities.size,history:this.attackMotifs.history.map(cue=>({...cue}))},...this.statistics};
  }
  finishVoice(voice){
    if(voice.finished)return;voice.finished=true;this.activeVoices.delete(voice);this.retiringVoices.delete(voice);
    for(const node of voice.nodes)node.disconnect();this.voices=this.activeVoices.size;
  }
  stopVoice(voice,fade=.008){
    if(voice.stopping||voice.finished)return;voice.stopping=true;
    const now=this.context.currentTime;
    voice.gain.gain.cancelScheduledValues(now);voice.gain.gain.setTargetAtTime(.0001,now,.003);
    voice.osc.stop(now+fade);this.activeVoices.delete(voice);this.retiringVoices.add(voice);
    while(this.retiringVoices.size>AUDIO_LIMITS.retiringVoices){const oldest=this.retiringVoices.values().next().value;oldest.osc.stop(now);this.finishVoice(oldest);}
    this.voices=this.activeVoices.size;
  }
  admitVoice(priority){
    const limit=priority>=2?AUDIO_LIMITS.voices:AUDIO_LIMITS.regularVoices;
    if(this.activeVoices.size<limit)return true;
    const victim=[...this.activeVoices].filter(voice=>voice.priority<priority).sort((a,b)=>a.priority-b.priority||a.start-b.start)[0];
    if(!victim){this.statistics.dropped++;return false;}
    this.stopVoice(victim);this.statistics.stolen++;return true;
  }
  buildVoice(source,parameters){
    const a=this.context,p={duration:.1,volume:.04,delay:0,bus:'effects',priority:1,attack:.006,pan:0,...parameters},
      start=a.currentTime+Math.max(0,p.delay),duration=Math.max(.02,Math.min(4,p.duration)),gain=a.createGain(),nodes=[source,gain];
    let tail=source;
    if(p.distortion>0&&a.createWaveShaper){
      const amount=Math.round(Math.min(.2,p.distortion)*100)/100,key=String(amount);
      if(!this.shapeCache.has(key)){
        const curve=new Float32Array(513),drive=1+amount*3;
        for(let i=0;i<curve.length;i++)curve[i]=Math.tanh((i/(curve.length-1)*2-1)*drive)/drive;
        if(this.shapeCache.size>=AUDIO_LIMITS.distortionCurves)this.shapeCache.delete(this.shapeCache.keys().next().value);
        this.shapeCache.set(key,curve);
      }
      const shape=a.createWaveShaper();shape.curve=this.shapeCache.get(key);shape.oversample='none';tail.connect(shape);tail=shape;nodes.push(shape);
    }
    if(Number.isFinite(p.cutoff)&&a.createBiquadFilter){const filter=a.createBiquadFilter();filter.type=p.filterType||'lowpass';filter.frequency.setValueAtTime(Math.max(40,Math.min(a.sampleRate*.45,p.cutoff)),start);filter.Q.value=p.resonance||.7;tail.connect(filter);tail=filter;nodes.push(filter);}
    tail.connect(gain);tail=gain;
    if(a.createStereoPanner&&p.pan){const pan=a.createStereoPanner();pan.pan.value=Math.max(-.7,Math.min(.7,p.pan));tail.connect(pan);tail=pan;nodes.push(pan);}
    tail.connect(this.buses[p.bus]||this.master);
    const peak=Math.max(.0002,Math.min(.2,p.volume)),attack=Math.min(duration*.35,Math.max(.002,p.attack));
    gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(peak,start+attack);
    if(Number.isFinite(p.sustain)){
      const release=Math.max(.02,Math.min(duration*.45,p.release||duration*.22)),
        decayEnd=start+Math.min(duration*.35,attack+.09),sustain=Math.max(.0002,peak*clamp(p.sustain,.7));
      gain.gain.exponentialRampToValueAtTime(sustain,decayEnd);
      gain.gain.setValueAtTime(sustain,Math.max(decayEnd,start+duration-release));
    }
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    const voice={osc:source,gain,bus:p.bus,priority:priorityOf(p.priority),start,stopping:false,nodes};
    this.activeVoices.add(voice);this.voices=this.activeVoices.size;this.statistics.admitted++;
    this.statistics.peakVoices=Math.max(this.statistics.peakVoices,this.voices);
    source.onended=()=>this.finishVoice(voice);source.start(start);source.stop(start+duration+.02);return voice;
  }
  voice(parameters={}){
    const p={from:440,to:220,wave:'triangle',...this.cueParameters,...parameters},a=this.context;
    if(!this.options.sound||!a||(!this.offline&&a.state!=='running')||!this.admitVoice(priorityOf(p.priority)))return false;
    const source=a.createOscillator(),start=a.currentTime+Math.max(0,p.delay||0),duration=Math.max(.02,Math.min(4,p.duration||.1));
    source.type=p.wave;source.frequency.setValueAtTime(Math.max(20,p.from),start);
    if(Number.isFinite(p.detune)&&source.detune)source.detune.setValueAtTime(p.detune,start);
    source.frequency.exponentialRampToValueAtTime(Math.max(20,p.to),start+duration);return this.buildVoice(source,p);
  }
  noise(duration=.18,volume=.12,frequency=700,priority,extra={}){
    const p={...this.cueParameters,...extra,duration,volume,cutoff:frequency},a=this.context;
    if(priority!==undefined)p.priority=priority;
    if(!this.options.sound||!a||(!this.offline&&a.state!=='running')||!this.admitVoice(priorityOf(p.priority)))return false;
    const seconds=Math.min(4,Math.max(1,Math.ceil(duration))),key=`${a.sampleRate}:${seconds}`;
    if(!this.noiseCache.has(key)){
      const n=Math.ceil(a.sampleRate*seconds),buffer=a.createBuffer(1,n,a.sampleRate),data=buffer.getChannelData(0);let seed=0x51f15e;
      for(let i=0;i<n;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/0x80000000-1;}
      if(this.noiseCache.size>=AUDIO_LIMITS.noiseBuffers)this.noiseCache.delete(this.noiseCache.keys().next().value);
      this.noiseCache.set(key,buffer);
    }
    const source=a.createBufferSource();source.buffer=this.noiseCache.get(key);return this.buildVoice(source,p);
  }
  cue(type,parameters={}){
    const a=this.context;if(!a||(!this.offline&&a.state!=='running')||!this.options.sound)return;
    const now=a.currentTime,interval=type==='player-fire'?.09:type==='enemy-fire'?.12:type==='damage'?.1:.045;
    if(now-(this.last.get(type)??-Infinity)<interval)return;this.last.set(type,now);
    this.cueParameters={priority:type==='damage'||type==='join-warning'||type.startsWith('pattern-')?3:1,...parameters};
    switch(type){
      case 'player-fire':this.voice({from:680,to:260,duration:.07,volume:.034*(now<(this.impactUntil||0)?.4:1),wave:'triangle'});break;
      case 'pattern-fan':this.voice({from:310,to:380,duration:.09,volume:.036,wave:'triangle'});this.voice({from:380,to:450,duration:.09,volume:.025,wave:'triangle',delay:.08});break;
      case 'pattern-sweep':this.voice({from:260,to:520,duration:.19,volume:.04,wave:'sine'});break;
      case 'pattern-gap':this.voice({from:430,to:430,duration:.07,volume:.035,wave:'square'});this.voice({from:430,to:430,duration:.07,volume:.035,wave:'square',delay:.13});break;
      case 'pattern-aimed':this.voice({from:700,to:310,duration:.16,volume:.043,wave:'triangle'});break;
      case 'pattern-wall':this.voice({from:135,to:105,duration:.22,volume:.05,wave:'sawtooth'});break;
      case 'pattern-return':this.voice({from:220,to:470,duration:.12,volume:.04,wave:'triangle'});this.voice({from:470,to:220,duration:.12,volume:.03,wave:'triangle',delay:.13});break;
      case 'pattern-burst':this.voice({from:360,to:280,duration:.05,volume:.035,wave:'square'});this.voice({from:360,to:280,duration:.05,volume:.035,wave:'square',delay:.09});break;
      case 'pattern-spiral':this.voice({from:260,to:620,duration:.28,volume:.037,wave:'sine'});break;
      case 'pattern-crossfire':this.voice({from:250,to:430,duration:.1,volume:.035});this.voice({from:430,to:250,duration:.1,volume:.035,delay:.08});break;
      case 'fold-wake':this.voice({from:270,to:450,duration:.18,volume:.047,wave:'triangle'});this.voice({from:450,to:190,duration:.23,volume:.03,wave:'sine',delay:.11});break;
      case 'wave-start':this.voice({from:190,to:260,duration:.08,volume:.025});break;
      case 'wave-break':this.voice({from:420,to:210,duration:.22,volume:.03,wave:'sine'});break;
      case 'graze':this.voice({from:880,to:1180,duration:.055,volume:.022,wave:'sine'});break;
      case 'fold-entry':this.voice({from:260,to:560,duration:.08,volume:.025,wave:'triangle'});break;
      case 'fold-exit':this.voice({from:560,to:260,duration:.08,volume:.022,wave:'triangle'});break;
      case 'miniboss-phase':this.voice({from:180,to:460,duration:.24,volume:.06,wave:'square'});this.voice({from:460,to:220,duration:.2,volume:.035,wave:'triangle',delay:.12});break;
      case 'join-warning':this.voice({from:310,to:425,duration:.09,volume:.042,wave:'triangle'});this.voice({from:425,to:280,duration:.13,volume:.032,wave:'sine',delay:.11});break;
      case 'relay-recovered':
        for(const [i,note] of [392,494,587,784].entries())this.voice({from:note,to:note,duration:.28,volume:.08,wave:'triangle',delay:i*.14,priority:true});break;
      case 'hybrid-phase':this.voice({from:145,to:620,duration:.4,volume:.07,wave:'triangle'});this.voice({from:510,to:185,duration:.4,volume:.045,wave:'sine',delay:.08});break;
      case 'enemy-fire':this.voice({from:170,to:100,duration:.1,volume:.027,wave:'sawtooth'});break;
      case 'enemy-hit':
        this.noise(.055,.065,2600);this.voice({from:520,to:145,duration:.085,volume:.065,wave:'square'});break;
      case 'asteroid-hit':this.noise(.07,.06,1300);this.voice({from:220,to:75,duration:.08,volume:.055});break;
      case 'target-hit':case 'asteroid-broken':
        this.noise(.32,.16,1300);this.voice({from:115,to:30,duration:.34,volume:.14});
        this.voice({from:310,to:65,duration:.16,volume:.06,wave:'square',delay:.035});break;
      case 'damage':
        // Keep four channels available for a hull hit under sustained weapons fire.
        this.impactUntil=now+.24;this.noise(.24,.17,850,true);
        this.voice({from:105,to:32,duration:.32,volume:.17,wave:'sine',priority:true});
        this.voice({from:560,to:140,duration:.095,volume:.075,wave:'square',priority:true});break;
      case 'damage-debt':case 'impact-stored':case 'damage-buffered':case 'buffer-admitted':this.voice({from:240,to:490,duration:.17,volume:.07});break;
      case 'impact-absorbed':case 'contact-absorbed':this.voice({from:480,to:260,duration:.06,volume:.025});break;
      case 'debt-paid':case 'damage-paid':this.voice({from:130,to:65,duration:.18,volume:.09,wave:'square'});break;
      case 'duplicate-repair':case 'upgrade-collected':case 'collect':case 'pickup':case 'seed-collected':case 'drive-part-collected':this.voice({from:390,to:590,duration:.11,volume:.075});this.voice({from:590,to:880,duration:.14,volume:.055,delay:.075});break;
      case 'drive-warning':this.voice({from:230,to:340,duration:.12,volume:.065});this.voice({from:230,to:340,duration:.12,volume:.065,delay:.2});break;
      case 'fold':this.voice({from:160,to:760,duration:.28,volume:.085,wave:'triangle'});this.voice({from:80,to:380,duration:.25,volume:.04});break;
      case 'unfold':this.voice({from:760,to:160,duration:.34,volume:.08,wave:'triangle'});break;
      case 'counter-bypass':this.voice({from:920,to:440,duration:.07,volume:.028});break;
      case 'operation':this.voice({from:330,to:510,duration:.075,volume:.028});break;
      case 'enemy-return':case 'klein-crossing':this.voice({from:210,to:420,duration:.12,volume:.045});break;
      case 'projective-crossing':this.voice({from:420,to:315,duration:.09,volume:.035,wave:'sine'});this.voice({from:315,to:210,duration:.09,volume:.03,wave:'sine',delay:.09});break;
      case 'periodic-crossing':this.voice({from:260,to:260,duration:.075,volume:.025,wave:'sine'});break;
      case 'bolza-crossing':this.voice({from:210,to:315,duration:.09,volume:.03,wave:'triangle'});this.voice({from:315,to:420,duration:.13,volume:.025,wave:'sine',delay:.08});break;
      case 'echo-captured':this.voice({from:760,to:240,duration:.16,volume:.05,wave:'sine'});this.voice({from:380,to:240,duration:.12,volume:.025,wave:'triangle',delay:.05});break;
      case 'echo-released':this.voice({from:240,to:760,duration:.16,volume:.05,wave:'triangle'});this.voice({from:380,to:760,duration:.12,volume:.025,wave:'sine',delay:.05});break;
      case 'chapter-cleared':case 'tutorial-complete':case 'won':case 'boss-extracted':
        for(const [i,note] of [330,440,660].entries())this.voice({from:note,to:note,duration:.2,volume:.07,delay:i*.1});break;
      case 'launch':this.voice({from:180,to:360,duration:.2,volume:.055});break;
      case 'preview':this.voice({from:440,to:660,duration:.12,volume:.07});break;
      case 'drive-activated':for(const [i,note] of [147,220,294,440].entries())this.voice({from:note,to:note,duration:.45,volume:.045,wave:'sine',delay:i*.16,priority:3});break;
      case 'defeat':this.noise(.15,.055,600,true);this.voice({from:164,to:55,duration:.45,volume:.07,wave:'sine',priority:true});break;
    }
    this.cueParameters=null;
  }
  process(s){
    if(this.flight!==s||s.time<this.lastSimTime){if(this.flight&&this.flight!==s)this.recorded?.restart();this.flight=s;this.last.clear();this.impactUntil=0;this.joinWarningKey='';this.joinWarningAt=-10;this.attackMotifs.reset();}
    this.lastSimTime=s.time;
    const fresh=this.events.read(s);
    for(const event of fresh){
      const priority=AV_GRAMMAR[event.type]?.priority??1;
      if(priority===3)this.recorded?.duck();
      const identity=this.attackMotifs.read(event,this.context?.currentTime??s.time);
      if(identity)this.playAttackMotif(identity);
      else if(event.cue)this.cue(event.cue,{priority});
    }
    if(s.phase==='lost'&&this.lastPhase==='running')this.cue('defeat',{priority:3});
    this.lastPhase=s.phase;
    const forecast=isHyperbolicState(s)||s.mode==='repair'||s.paused?null:playerJoinForecast(s,{horizontalVelocity:s.lateralVelocity||0,axialInput:s.lastAxialInput||0,horizon:.7});
    const forecastKey=forecast?`${s.campaign?.index}:${forecast.edge}:${forecast.rule}`:'';
    if(forecastKey&&forecast.timeSeconds<=.65&&forecastKey!==this.joinWarningKey&&s.time-this.joinWarningAt>1){
      this.cue('join-warning');this.joinWarningAt=s.time;
    }
    this.joinWarningKey=forecastKey;
    this.setPlaying(['running','choosing','ending','cleared','won'].includes(s.phase)&&!s.paused,s);
    return fresh;
  }
  playAttackMotif(cue){
    const root=[262,294,330,392][cue.motif],crossing=cue.kind==='crossing';
    const wave=cue.topology==='projective'||cue.topology==='periodic'?'sine':'triangle';
    const cutoff=cue.topology==='projective'?650:cue.topology==='bolza'?1100:850;
    this.voice({from:root,to:root,duration:.075,volume:crossing?.027:.021,wave,cutoff,priority:crossing?2:1});
    this.voice({from:root*1.5,to:root*1.5,duration:.075,volume:crossing?.019:.014,wave,cutoff,delay:.075,priority:crossing?2:1});
  }
  scheduleScore(s){
    if(this.options.recordedMusic!==false&&!this.offline)return;
    const a=this.context;if(!a||a.state!=='running'||!this.options.music||!this.options.sound)return;
    const themeName=scoreThemeFor(s),theme=SCORE_THEMES[themeName],interval=15/theme.bpm,context=musicContextFor(s);
    if(!this.scoreTheme){this.scoreTheme=themeName;this.scoreStep=0;this.nextScoreTime=a.currentTime+.035;}
    // Change the arrangement at a beat. Keep the event feedback immediate.
    if(this.scoreTheme!==themeName&&this.scoreStep%4===0)this.scoreTheme=themeName;
    if(this.nextScoreTime<a.currentTime-.1)this.nextScoreTime=a.currentTime+.025;
    let guard=0;
    while(this.nextScoreTime<a.currentTime+.18&&guard++<3){
      if(this.scoreTheme!==themeName&&this.scoreStep%4===0)this.scoreTheme=themeName;
      this.scheduleMusicStep(this.scoreTheme,this.scoreStep++,this.nextScoreTime,context);
      this.nextScoreTime+=this.scoreTheme===themeName?interval:15/SCORE_THEMES[this.scoreTheme].bpm;
    }
  }
  scheduleMusicStep(theme,step,start,context={}){
    const delay=Math.max(0,start-this.context.currentTime);
    for(const note of arrangementStep(theme,step,context)){
      if(note.kind==='noise')this.noise(note.duration,note.volume,note.frequency,note.priority,{...note,delay});
      else this.voice({...note,delay});
    }
  }
  setPlaying(playing,s=this.flight){
    if(!this.offline&&hiddenPage()){this.stopAmbient();return;}
    const title=this.titleRequested&&!playing&&!s?.paused;
    if((!playing&&!title)||!this.options.sound||!this.options.music){this.stopAmbient();return;}
    const a=this.context;if(!a)return;
    if(this.options.recordedMusic!==false&&!this.offline){
      if(playing&&this.titleRequested){this.titleRequested=false;this.titleGeneration++;}
      if(!this.recorded){this.ambient=null;return;}
      const quiet=scoreThemeFor(s)==='recovery'||['cleared','won'].includes(s?.phase);
      const selection=campaignRecordingFor(s,{title,recovery:quiet});
      this.recorded.update(selection,true);this.scoreTheme=selection.key;this.ambient={playing:true,source:'recorded'};
      return;
    }
    if(a.state!=='running')return;
    if(!this.ambient){this.ambient={playing:true};this.scoreTheme='';this.nextScoreTime=a.currentTime+.035;}
    this.scheduleScore(s);
  }
  stopAmbient(){
    this.ambient=null;this.scoreTheme='';this.nextScoreTime=0;
    this.recorded?.update(null,false);
    for(const voice of [...this.activeVoices])if(voice.bus==='music'||voice.bus==='ambience')this.stopVoice(voice,.02);
  }
}
