const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const STC_SCORE=freeze({id:'identified-return-r5-binaural',title:'Identified Return',bpm:134,bars:40,stepsPerBar:16,
  root:29,description:'Hypnotic pulse, interlocking electro percussion, acid transformation, and sparse recovery.'});
export const STC_STEP_SECONDS=15/STC_SCORE.bpm;
export const STC_DURATION=STC_SCORE.bars*STC_SCORE.stepsPerBar*STC_STEP_SECONDS;
export const STC_ACID_PATTERN=freeze([
  {midi:41,accent:true,gate:.62},{midi:41,gate:.48},null,{midi:48,slide:true,gate:1},
  {midi:41,gate:.58},{midi:44,slide:true,gate:1},{midi:41,gate:.48},{midi:51,accent:true,gate:.65},
  {midi:41,gate:.48},null,{midi:41,slide:true,gate:1},{midi:53,slide:true,gate:1},
  {midi:51,gate:.6},{midi:41,gate:.45},{midi:48,accent:true,gate:.65},{midi:41,slide:true,gate:1},
]);
export const STC_SECTIONS=freeze([
  {from:0,to:4,id:'orientation',meaning:'Pulse and repeating figure'},
  {from:4,to:12,id:'establishment',meaning:'Interlocking rhythm'},
  {from:12,to:20,id:'transformation',meaning:'The sequence persists while its timbre changes'},
  {from:20,to:28,id:'complication',meaning:'A displaced percussion cycle joins the pulse'},
  {from:28,to:32,id:'disclosure',meaning:'Space opens before the pulse returns'},
  {from:32,to:40,id:'transfer',meaning:'The figure returns with a different surface'},
]);
export const stcMidiHz=midi=>440*2**((midi-69)/12);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

/** Produce music instructions. These data have no gameplay authority. */
export function stcScoreStep(index,context={}){
  if(!Number.isInteger(index)||index<0)throw new RangeError('A score step must be a nonnegative integer.');
  const step=index%(STC_SCORE.bars*16),bar=Math.floor(step/16),i=step%16,
    section=STC_SECTIONS.find(value=>bar>=value.from&&bar<value.to),
    intensity=clamp(Number.isFinite(context.intensity)?context.intensity:.5,0,1),
    pressure=context.phase===2?90:0,
    breakdown=bar>=28&&bar<32,opening=bar<4,transfer=bar>=32,
    openingFilter=bar<12?bar/12:bar<20?.25+(bar-12)/8*.65:bar<28?.9:breakdown?.1:.45+(bar-32)/8*.45,
    mutation=.5+.5*Math.sin(index/16*Math.PI/4),events=[];
  const add=(instrument,extra={})=>events.push({instrument,...extra});
  const silence=bar===31&&i>=8;
  if(!silence){
    if(!breakdown&&i%4===0)add('kick',{level:opening?.83:1});
    if(!breakdown&&bar>=2&&i%4===2)add('sub',{midi:STC_SCORE.root,level:opening?.65:1});
    if(bar>=2&&(!breakdown||i===2||i===10)){
      if(i%4===2)add('hat-open',{level:breakdown?.24:opening?.5:1,pan:(i===2||i===10)?-.16:.16});
      if(!opening&&!breakdown&&[1,3,7,9,11,15].includes(i))add('hat-closed',{level:i%4===3?.55:.32,pan:i%2?-.23:.23});
    }
    if(bar>=4&&!breakdown&&[4,12].includes(i))add('clap',{level:bar>=20?.9:.7});
    if(bar>=4&&!breakdown&&[3,6,11,14].includes((i+(transfer?2:0))%16))add('rim',{level:.55+(i===11?.2:0),pan:i<8?-.28:.28});
    if(bar>=12&&!breakdown&&(index%15===0||index%15===7))add('metal',{level:bar>=20?.72:.4,pan:index%15===0?-.33:.33});
    if(!breakdown&&bar>=6&&bar%4===3&&[10,13,15].includes(i))add('tom',{midi:i===10?48:i===13?41:36,level:i===15?.9:.72,pan:i===13?-.25:.25});
    if(!breakdown&&bar>=4&&bar%8===7&&i===15)add('kick',{level:.42,offset:.5});
    if(!breakdown&&bar>=12&&bar%4===3&&i===14)add('rim',{level:.72,pan:-.23,offset:.5});
  }
  let acid=silence?null:STC_ACID_PATTERN[i];
  if(opening&&i>=8&&bar<2)acid=null;
  if(breakdown&&i!==0&&i!==7&&i!==10)acid=null;
  if(acid){
    acid={...acid,midi:acid.midi+(transfer&&[3,7,11].includes(i)?-12:0),
      cutoff:clamp(130+openingFilter*620+mutation*100+intensity*65+pressure,110,1200),
      envelope:opening?600:breakdown?340:720+openingFilter*1350,
      resonance:breakdown?3.3:4.2+openingFilter*1.1,level:breakdown?.63:opening?.72:1,
      decay:breakdown?.15:.085+mutation*.055};
  }
  return {index,bar,i,section:section.id,events,acid,drone:breakdown?.9:opening?.52:.25,
    pump:!breakdown&&i%4===0,stepSeconds:STC_STEP_SECONDS};
}
