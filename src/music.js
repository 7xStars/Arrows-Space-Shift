const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const theme=(bpm,lead,bass,kick,snare,hat,style)=>({bpm,lead,bass,kick,snare,hat,style});
export const SCORE_THEMES=freeze({
  traditional:theme(108,[62,null,null,65,null,null,69,null,67,null,null,65,null,60,null,null],
    [38,null,null,null,null,null,38,null,41,null,null,36,null,null,33,null],[0,6,8,11],[4,12],[2,6,10,14],'electro / mechanical'),
  klein:theme(120,[62,null,null,null,60,null,57,null,65,null,null,64,null,60,null,57],
    [38,null,38,null,36,null,38,41,34,null,38,null,33,null,36,null],[0,4,8,12],[12],[2,6,10,14],'hypnotic / acid'),
  projective:theme(116,[62,null,65,null,null,69,null,72,70,null,69,null,65,null,null,62],
    [38,null,null,38,41,null,38,null,43,null,null,41,36,null,38,null],[0,3,8,10],[4,12],[2,6,11,14],'EBM / industrial'),
  bolza:theme(104,[62,null,null,null,65,null,null,69,null,null,74,null,72,null,null,null],
    [38,null,null,45,null,null,41,null,38,null,null,43,null,null,36,null],[0,8],[12],[6,14],'ambient / hypnotic / acid'),
  recovery:theme(84,[62,null,null,null,null,null,65,null,null,null,69,null,null,null,null,null],
    [38,null,null,null,null,null,null,null,43,null,null,null,null,null,null,null],[],[],[],'sparse recovery'),
  ending:theme(84,[62,null,null,null,65,null,null,null,69,null,null,null,74,null,null,null],
    [38,null,null,null,null,null,null,null,41,null,null,null,null,null,null,null],[],[],[],'activation / resolution'),
});
const clamp=value=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
export const midiHz=midi=>440*2**((midi-69)/12);
export const MUSIC_PHRASE_STEPS=128;
export const HARMONIC_CYCLE=freeze([
  {name:'Dm',root:38,chord:[50,53,57]},
  {name:'Bb',root:34,chord:[46,50,53]},
  {name:'F',root:41,chord:[48,53,57]},
  {name:'C',root:36,chord:[48,52,55]},
  {name:'Dm',root:38,chord:[50,53,57]},
  {name:'Bb',root:34,chord:[46,50,53]},
  {name:'Gm',root:43,chord:[50,55,58]},
  {name:'Am',root:33,chord:[48,52,57]},
]);
export const MELODIC_PHRASE=freeze([
  {step:0,midi:62,length:6},{step:8,midi:65,length:6},
  {step:16,midi:69,length:6},{step:24,midi:67,length:6},
  {step:32,midi:65,length:10},{step:44,midi:72,length:3},
  {step:48,midi:67,length:6},{step:56,midi:64,length:6},
  {step:64,midi:62,length:6},{step:72,midi:65,length:6},
  {step:80,midi:69,length:10},{step:92,midi:65,length:3},
  {step:96,midi:70,length:6},{step:104,midi:69,length:6},
  {step:112,midi:67,length:6},{step:120,midi:64,length:6},
]);
export function scoreThemeFor(s){
  if(s?.musicState==='ending'||s?.phase==='ending'||s?.campaignCompleted===true)return 'ending';
  if(s?.musicState==='recovery'||s?.musicState==='repair'||['salvage','exit'].includes(s?.campaign?.bossPhase)||
    s?.phase==='cleared'||s?.phase==='won'||(Number.isFinite(s?.breakUntil)&&s.breakUntil>s.time)||
    s?.campaign?.currentWave?.kind==='break'||s?.campaign?.phaseBreakUntil>s?.time||s?.bossRecoveryUntil>s?.time)return 'recovery';
  if(Number.isInteger(s?.stageIndex)&&s?.player?.position)return 'bolza';
  return (s?.campaign?.index??-1)>=18?'projective':(s?.campaign?.index??-1)>=9?'klein':'traditional';
}
export function musicContextFor(s){
  const enemies=(s?.enemies||[]).filter(enemy=>(enemy.hp>0||enemy.hull>0)&&enemy.waveActive!==false),
    shotCount=(s?.shots?.length||0)+(s?.enemyShots?.length||0);
  const boss=Boolean(s?.stage?.boss||s?.campaign?.bossPhase==='combat'||enemies.some(enemy=>enemy.boss||enemy.role==='core'||enemy.kind==='boss'));
  return {intensity:clamp(shotCount/65+enemies.length/18),boss,
    fold:Boolean(s?.foldUntil>s?.time||(s?.fields||[]).length),
    phase:s?.bossPhase||s?.campaign?.hybridPhase||s?.campaign?.curvaturePhase||0};
}
/** Return audio instructions only. This function never changes a game state. */
export function arrangementStep(name,step,context={}){
  const t=SCORE_THEMES[name]||SCORE_THEMES.traditional,i=step%16,bar=Math.floor(step/16),
    unit=15/t.bpm,intensity=clamp(context.intensity),quiet=name==='recovery'||name==='ending',
    spacious=name==='bolza'||quiet,harmony=HARMONIC_CYCLE[bar%8],notes=[];
  const tone=(midi,duration,volume,wave='triangle',extra={})=>notes.push({kind:'tone',from:midiHz(midi),to:midiHz(midi),duration,volume,wave,bus:'music',priority:0,...extra});
  // Keep a continuing musical phrase when combat intensity changes.
  // Rhythm density can change. It must not remove the phrase or retime combat.
  if(!quiet&&t.kick.includes(i))notes.push({kind:'tone',role:'pulse',from:110,to:42,duration:.14,volume:.023,wave:'sine',bus:'music',priority:0});
  if(!spacious&&t.snare.includes(i)&&intensity>.3)notes.push({kind:'noise',role:'percussion',duration:.065,volume:.007,frequency:name==='projective'?1800:2900,bus:'music',priority:0,filterType:'highpass'});
  if(!spacious&&t.hat.includes(i)&&intensity>.7)notes.push({kind:'noise',role:'percussion',duration:.03,volume:.0035,frequency:5200,bus:'music',priority:0,filterType:'highpass',pan:i%4===2?-.22:.22});
  if(i===0){
    tone(harmony.root,unit*(quiet?11:7),quiet?.018:.023,
      name==='projective'?'square':name==='klein'?'sawtooth':'triangle',
      {role:'bass',cutoff:quiet?300:420+(context.fold?200:0),resonance:name==='klein'?2.2:.7,
        attack:.025,sustain:.72,release:.18,distortion:name==='projective'?.1:0});
    const chord=spacious?[harmony.chord[0],harmony.chord[2]]:harmony.chord;
    for(const [voice,midi] of chord.entries())tone(midi,unit*(quiet?12.5:13.5),spacious?.0065:.008,'sine',
      {role:'harmony',attack:.18,sustain:.8,release:.35,cutoff:1800,pan:(voice-(chord.length-1)/2)*.24,detune:voice%2?2:-2});
    if(spacious&&bar%2===0)tone(harmony.root+12,Math.min(3.8,unit*22),.005,'sine',
      {role:'drone',bus:'ambience',attack:.3,sustain:.7,release:.5,pan:-.2});
  }
  if(!quiet&&i===10)tone(harmony.root+(bar%2?7:12),unit*3.5,.012,name==='projective'?'square':'triangle',
    {role:'bass',attack:.025,sustain:.6,release:.12,cutoff:400+(name==='klein'?350:0),distortion:name==='projective'?.1:0});
  let melody=MELODIC_PHRASE.find(event=>event.step===step%MUSIC_PHRASE_STEPS);
  if(melody&&(!spacious||i===0)){
    const midi=name==='ending'?melody.midi+12:melody.midi;
    tone(midi,unit*(spacious?10:melody.length),quiet?.018:.025,name==='projective'?'triangle':'sine',
      {role:'melody',attack:.045,sustain:.78,release:.22,cutoff:2200,pan:name==='bolza'?.12:0});
  }
  if(context.boss&&intensity>.35&&i===8&&bar%2===1&&!quiet)tone(harmony.chord[(context.phase||0)%3],unit*5,.005,'triangle',
    {role:'tension',attack:.06,sustain:.65,release:.2,cutoff:850,distortion:.1});
  return notes;
}
