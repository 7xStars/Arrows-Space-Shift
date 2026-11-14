/**
 * Authored Act II wave scripts. The attack grammar stays stable; these scripts
 * decide when, where, and in what combinations the grammar appears.
 */

import {ACT_THREE_WAVE_SCRIPTS} from './act3-waves.js';
const member=(lane,pattern,options={})=>Object.freeze({lane,pattern,...options});
const wave=(id,at,label,members=[],options={})=>Object.freeze({id,at,label,members:Object.freeze(members),...options});
// Every authored break is a genuine, hostile-fire-free interval by default.
// A specific lesson can override clearHostile only when the returning volley
// itself is what players are meant to observe.
const pause=(id,at,label='Recovery',options={})=>wave(id,at,label,[],{kind:'break',clearHostile:true,...options});

export const ACT_TWO_WAVE_SCRIPTS=Object.freeze({
  'seam-gap':Object.freeze({
    id:'seam-gap',
    notices:Object.freeze([
      {at:0,text:'SEAM GAP: first read an ordinary opening.'},
      {at:.18,text:'Break: let the ordinary volley clear before tracking its return.'},
      {at:.29,text:'The border bullets now travel through the joined sides.'},
      {at:.49,text:'Break: empty screen space may still lie on an older return path.'},
      {at:.57,text:'FALSE GAP: read the whole surface, not only the visible opening.'},
      {at:.72,text:'Break: reset before the Aperture test.'},
      {at:.79,text:'THE APERTURE: survive a moving opening bordered by returning fire.'},
    ]),
    waves:Object.freeze([
      wave('sg-popcorn',.045,'Opening formation',[
        member(-230,'aimed',{role:'popcorn',dropsUpgrade:false,attackDelay:.3}),
        member(0,'aimed',{role:'popcorn',dropsUpgrade:false,attackDelay:.48}),
        member(230,'aimed',{role:'popcorn',dropsUpgrade:false,attackDelay:.66}),
      ]),
      wave('sg-ordinary',.125,'Ordinary GAP',[member(0,'gap',{patternConfig:{count:4,beats:2,gapWidth:2,recovery:2.15}})]),
      pause('sg-break-1',.215),
      wave('sg-return-border',.30,'Returning border',[
        member(-245,'gap',{attackDelay:.1,patternConfig:{count:4,beats:2,gapWidth:2,recovery:2.25}}),
        member(245,'return',{attackDelay:.38,patternConfig:{count:3,beats:2,spread:.78,recovery:2.4}}),
      ]),
      wave('sg-light-line',.405,'Light formation',[
        member(-270,'aimed',{role:'popcorn',dropsUpgrade:false,attackDelay:.1}),
        member(0,'aimed',{role:'popcorn',dropsUpgrade:false,attackDelay:.32}),
        member(270,'aimed',{role:'popcorn',dropsUpgrade:false,attackDelay:.54}),
      ]),
      pause('sg-break-2',.495),
      wave('sg-false-gap',.575,'False GAP',[
        member(0,'gap',{attackDelay:0,patternConfig:{count:5,beats:2,gapWidth:2,gapMotion:1,recovery:2.3}}),
        member(-315,'return',{attackDelay:.32,patternConfig:{count:3,beats:2,spread:.82,recovery:2.5}}),
        member(315,'return',{attackDelay:.62,patternConfig:{count:3,beats:2,spread:-.82,recovery:2.5}}),
      ]),
      pause('sg-break-3',.715),
      wave('sg-aperture',.79,'The Aperture',[
        member(0,'gap',{name:'The Aperture',role:'miniboss',hp:7,dropsUpgrade:true,attackDelay:.25,
          patternSequence:['gap','return','wall'],patternConfig:{count:5,beats:2,gapWidth:2,gapMotion:1,recovery:1.45}}),
        member(-270,'aimed',{role:'popcorn',dropsUpgrade:false,attackDelay:.65}),
        member(270,'aimed',{role:'popcorn',dropsUpgrade:false,attackDelay:.85}),
      ],{kind:'miniboss'}),
    ]),
  }),

  'cross-current':Object.freeze({
    id:'cross-current',
    notices:Object.freeze([
      {at:0,text:'CROSS CURRENT: familiar patterns will now overlap.'},
      {at:.12,text:'FAN + SWEEP: read the immediate lanes and the moving second layer.'},
      {at:.25,text:'Break: the next formation returns to ordinary forward combat.'},
      {at:.39,text:'GAP + AIMED: enter the opening, then move after the aim commits.'},
      {at:.52,text:'Break: let the aimed lane clear.'},
      {at:.59,text:'RETURN + FAN: immediate danger and delayed danger now coexist.'},
      {at:.74,text:'Break: prepare for the linked pair.'},
      {at:.80,text:'CROSS CURRENT PAIR: destroying either ship changes the survivor.'},
    ]),
    waves:Object.freeze([
      wave('cc-popcorn-v',.04,'V formation',[-260,-130,0,130,260].map((lane,i)=>member(lane,'aimed',{role:'popcorn',dropsUpgrade:false,attackDelay:.15+i*.12}))),
      wave('cc-fan-sweep',.13,'FAN + SWEEP',[
        member(-180,'fan',{attackDelay:.05,patternConfig:{count:4,beats:2,recovery:2.1}}),
        member(180,'sweep',{attackDelay:.24,patternConfig:{count:3,beats:3,rotation:.18,recovery:2.2}}),
      ]),
      pause('cc-break-1',.25),
      wave('cc-line',.315,'Line formation',[-285,-95,95,285].map((lane,i)=>member(lane,'aimed',{role:'popcorn',dropsUpgrade:false,attackDelay:.12+i*.14}))),
      wave('cc-gap-aimed',.395,'GAP + AIMED',[
        member(-155,'gap',{attackDelay:.05,patternConfig:{count:5,beats:2,gapWidth:2,recovery:2.25}}),
        member(165,'aimed',{attackDelay:.48,patternConfig:{count:2,beats:2,spread:.045,recovery:2.4}}),
      ]),
      pause('cc-break-2',.515),
      wave('cc-return-fan',.59,'RETURN + FAN',[
        member(-270,'return',{attackDelay:.05,patternConfig:{count:3,beats:2,spread:.8,recovery:2.35}}),
        member(270,'fan',{attackDelay:.32,patternConfig:{count:4,beats:2,recovery:2.05}}),
        member(0,'wall',{role:'anchor',hp:3,dropsUpgrade:true,attackDelay:.72,patternConfig:{count:5,beats:1,spread:.11,recovery:2.8}}),
      ]),
      pause('cc-break-3',.735),
      wave('cc-linked-pair',.805,'Cross Current Pair',[
        member(-220,'return',{name:'Current Left',role:'miniboss',hp:6,linkGroup:'cross-current-pair',attackDelay:.15,
          patternSequence:['return','gap','fan'],patternConfig:{count:4,beats:2,recovery:1.55}}),
        member(220,'sweep',{name:'Current Right',role:'miniboss',hp:6,linkGroup:'cross-current-pair',attackDelay:.42,
          patternSequence:['sweep','wall','aimed'],patternConfig:{count:4,beats:2,recovery:1.55}}),
      ],{kind:'miniboss'}),
    ]),
  }),

  'fold-timing':Object.freeze({
    id:'fold-timing',
    notices:Object.freeze([
      {at:0,text:'FOLD TIMING: geometry tells you where; folds change when.'},
      {at:.1,text:'A predictable drive surge will fold one side of the first comparison.'},
      {at:.22,text:'Break: unfold if you want the original arrival order back.'},
      {at:.34,text:'STAGGERED RETURN: compare which edge sends the first threat back.'},
      {at:.48,text:'Break: experiment with preserving or removing the fold.'},
      {at:.58,text:'TIMED GAP: the opening changes because its borders arrive at different times.'},
      {at:.72,text:'Break: restore the space you want before the final anchor.'},
      {at:.80,text:'CHRONOMETRIC ANCHOR: solve path and arrival order together.'},
    ]),
    scriptedFolds:Object.freeze([
      {at:.095,action:'add',label:'Scripted comparison fold'},
      {at:.325,action:'add',label:'Return timing fold'},
      {at:.565,action:'add',label:'Timed gap fold'},
    ]),
    waves:Object.freeze([
      wave('ft-symmetry',.07,'Broken symmetry',[
        member(-185,'fan',{attackDelay:.05,patternConfig:{count:3,beats:2,recovery:2.4}}),
        member(185,'fan',{attackDelay:.05,patternConfig:{count:3,beats:2,recovery:2.4}}),
      ]),
      pause('ft-break-1',.225),
      wave('ft-staggered-return',.34,'Staggered return',[
        member(-290,'return',{attackDelay:.05,patternConfig:{count:3,beats:2,spread:.8,recovery:2.55}}),
        member(290,'return',{attackDelay:.35,patternConfig:{count:3,beats:2,spread:-.8,recovery:2.55}}),
      ]),
      pause('ft-break-2',.485),
      wave('ft-timed-gap',.575,'Timed GAP',[
        member(0,'gap',{attackDelay:.05,patternConfig:{count:5,beats:3,gapWidth:2,gapMotion:1,recovery:2.4}}),
        member(300,'sweep',{attackDelay:.48,patternConfig:{count:3,beats:2,rotation:-.17,recovery:2.65}}),
      ]),
      pause('ft-break-3',.72),
      wave('ft-anchor',.80,'Chronometric Anchor',[
        member(0,'cycle',{name:'Chronometric Anchor',role:'miniboss',hp:8,dropsUpgrade:true,attackDelay:.2,
          patternSequence:['fan','return','gap','sweep'],patternConfig:{count:4,beats:2,recovery:1.5}}),
      ],{kind:'miniboss'}),
    ]),
  }),

  'pressure-field':Object.freeze({
    id:'pressure-field',
    notices:Object.freeze([
      {at:0,text:'PRESSURE FIELD: no new geometry rule. Execute the known grammar at scale.'},
      {at:.18,text:'Break: pressure should fall before the next layer.'},
      {at:.39,text:'ANCHOR FIELD: remove the persistent source or route around it.'},
      {at:.58,text:'Recovery corridor: collect, reposition, and let old bullets clear.'},
      {at:.68,text:'RETURN FORMATION: several known returns overlap.'},
      {at:.83,text:'FIELD OVERSEER: final density test.'},
    ]),
    waves:Object.freeze([
      wave('pf-popcorn-v',.035,'Popcorn V',[-290,-145,0,145,290].map((lane,i)=>member(lane,'aimed',{role:'popcorn',dropsUpgrade:false,attackDelay:.08+i*.1}))),
      wave('pf-fan',.115,'FAN carrier',[member(0,'fan',{patternConfig:{count:5,beats:2,recovery:1.85}})]),
      pause('pf-break-1',.19),
      wave('pf-gap-line',.275,'GAP line',[
        ...[-280,-95,95,280].map((lane,i)=>member(lane,'aimed',{role:'popcorn',dropsUpgrade:false,attackDelay:.08+i*.08})),
        member(0,'gap',{attackDelay:.32,patternConfig:{count:5,beats:2,gapWidth:2,recovery:1.8}}),
      ]),
      pause('pf-break-2',.405),
      wave('pf-anchor-field',.46,'Anchor field',[
        member(0,'wall',{name:'Field Anchor',role:'anchor',hp:4,attackDelay:.05,patternConfig:{count:6,beats:2,recovery:1.45}}),
        member(-245,'sweep',{attackDelay:.28,patternConfig:{count:4,beats:2,rotation:.18,recovery:1.7}}),
        member(245,'fan',{attackDelay:.5,patternConfig:{count:4,beats:2,recovery:1.7}}),
        member(-80,'aimed',{role:'popcorn',dropsUpgrade:false,attackDelay:.76}),
        member(80,'aimed',{role:'popcorn',dropsUpgrade:false,attackDelay:.88}),
      ]),
      pause('pf-recovery',.60,'Recovery corridor',{clearHostile:true}),
      wave('pf-return-formation',.685,'Return formation',[
        member(-300,'return',{attackDelay:.05,patternConfig:{count:3,beats:2,spread:.82,recovery:1.75}}),
        member(-100,'gap',{attackDelay:.2,patternConfig:{count:4,beats:2,recovery:1.75}}),
        member(100,'sweep',{attackDelay:.38,patternConfig:{count:3,beats:2,recovery:1.75}}),
        member(300,'return',{attackDelay:.56,patternConfig:{count:3,beats:2,spread:-.82,recovery:1.75}}),
      ]),
      wave('pf-high-pressure',.785,'High pressure',[
        member(-210,'wall',{role:'anchor',hp:3,attackDelay:.05,patternConfig:{count:5,beats:2,recovery:1.45}}),
        member(210,'return',{role:'anchor',hp:3,attackDelay:.32,patternConfig:{count:4,beats:2,recovery:1.5}}),
      ]),
      wave('pf-overseer',.875,'Field Overseer',[
        member(0,'cycle',{name:'Field Overseer',role:'miniboss',hp:9,attackDelay:.15,
          patternSequence:['fan','gap','sweep','wall','return'],patternConfig:{count:5,beats:2,recovery:1.25}}),
      ],{kind:'miniboss'}),
    ]),
  }),

  'klein-mastery':Object.freeze({
    id:'klein-mastery',
    notices:Object.freeze([
      {at:0,text:'KLEIN MASTERY: nothing here is new.'},
      {at:.11,text:'SEAM ESCAPE: the joined edge is the cleaner route.'},
      {at:.27,text:'Break: reset before the folded opening.'},
      {at:.36,text:'FOLDED OPENING: path and arrival time must both work.'},
      {at:.51,text:'Break: let the delayed field clear.'},
      {at:.59,text:'FALSE SAFETY CROSSFIRE: an empty region may belong to an older return.'},
      {at:.71,text:'Break: the Klein Warden is ahead.'},
      {at:.77,text:'KLEIN WARDEN: use the complete Act II vocabulary.'},
      {at:.88,text:'Quiet approach. The boundary markings are becoming unstable.'},
    ]),
    scriptedFolds:Object.freeze([{at:.35,action:'add',label:'Mastery timing fold'}]),
    waves:Object.freeze([
      wave('km-opening',.035,'Opening formation',[-270,-90,90,270].map((lane,i)=>member(lane,'aimed',{role:'popcorn',dropsUpgrade:false,attackDelay:.08+i*.1}))),
      wave('km-seam-escape',.115,'Seam Escape',[
        member(-260,'wall',{attackDelay:.05,patternConfig:{count:6,beats:2,recovery:1.75}}),
        member(260,'sweep',{attackDelay:.28,patternConfig:{count:4,beats:3,rotation:-.17,recovery:1.8}}),
        member(-40,'aimed',{role:'popcorn',dropsUpgrade:false,attackDelay:.6}),
        member(40,'aimed',{role:'popcorn',dropsUpgrade:false,attackDelay:.72}),
      ]),
      pause('km-break-1',.275),
      wave('km-folded-opening',.36,'Folded Opening',[
        member(0,'gap',{attackDelay:.05,patternConfig:{count:5,beats:3,gapWidth:2,gapMotion:1,recovery:1.9}}),
        member(-295,'return',{attackDelay:.34,patternConfig:{count:3,beats:2,spread:.84,recovery:2.0}}),
        member(295,'return',{attackDelay:.58,patternConfig:{count:3,beats:2,spread:-.84,recovery:2.0}}),
      ]),
      pause('km-break-2',.515),
      wave('km-false-safety',.59,'False Safety Crossfire',[
        member(-285,'return',{attackDelay:.05,patternConfig:{count:4,beats:2,recovery:1.65}}),
        member(0,'gap',{attackDelay:.26,patternConfig:{count:5,beats:2,recovery:1.7}}),
        member(285,'fan',{attackDelay:.48,patternConfig:{count:5,beats:2,recovery:1.65}}),
        member(-95,'aimed',{role:'popcorn',dropsUpgrade:false,attackDelay:.7}),
        member(95,'aimed',{role:'popcorn',dropsUpgrade:false,attackDelay:.82}),
      ]),
      pause('km-break-3',.715),
      wave('km-warden',.77,'Klein Warden',[
        member(0,'cycle',{name:'Klein Warden',role:'miniboss',hp:12,attackDelay:.15,
          patternSequence:['fan','return','gap','sweep','wall','crossfire'],patternConfig:{count:5,beats:2,recovery:1.15}}),
        member(-290,'aimed',{name:'Warden Escort Left',role:'anchor',hp:3,attackDelay:.55,patternConfig:{count:2,beats:2,recovery:1.7}}),
        member(290,'aimed',{name:'Warden Escort Right',role:'anchor',hp:3,attackDelay:.75,patternConfig:{count:2,beats:2,recovery:1.7}}),
      ],{kind:'miniboss'}),
      pause('km-quiet-approach',.88,'Quiet approach',{clearHostile:true}),
    ]),
  }),
});

export function waveScriptFor(chapter){return chapter?.waveScript?(ACT_TWO_WAVE_SCRIPTS[chapter.waveScript]||ACT_THREE_WAVE_SCRIPTS[chapter.waveScript]||null):null;}

export function compileWaveScript(chapter,random=Math.random){
  const script=waveScriptFor(chapter);if(!script)return null;
  const enemies=[],waves=[];
  for(const source of script.waves){
    const plan={id:source.id,at:source.at,label:source.label,kind:source.kind||'combat',clearHostile:Boolean(source.clearHostile),enemyIds:[]};
    source.members.forEach((sourceMember,index)=>{
      const jitter=sourceMember.jitter===0?0:(random()-.5)*(Math.abs(sourceMember.lane)>300?8:18);
      const spec={...sourceMember,waveId:source.id,waveLabel:source.label,waveKind:source.kind||'combat',
        progress:Math.max(0,Math.min(.98,source.at+(sourceMember.progressOffset||index*.004))),
        activationAt:Math.max(0,source.at-.19),lane:Math.max(-330,Math.min(330,sourceMember.lane+jitter)),
        attackDelay:sourceMember.attackDelay??index*.18};
      enemies.push(spec);plan.enemyIds.push(enemies.length-1);
    });
    waves.push(plan);
  }
  return {script,enemies,waves,notices:script.notices||[],scriptedFolds:script.scriptedFolds||[]};
}
