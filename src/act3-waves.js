/** Authored Act III. Every stage teaches one ability, releases pressure, then
 * recombines the old shmup grammar with projective echoes and controlled growth.
 * The first two breaks per stage present one optional evolution choice.
 */
const m=(lane,pattern,opts={})=>({lane,pattern,...opts});
const w=(id,at,label,members,opts={})=>({id,at,label,members,...opts});
const rest=(id,at)=>w(id,at,'Recovery · Echo Forge',[],{kind:'break',clearHostile:true});
const popcorn=lanes=>lanes.map((lane,i)=>m(lane,'aimed',{role:'popcorn',hp:1,attackDelay:.1+i*.12,dropsUpgrade:false}));
const carrier=(lane,pattern,config={})=>m(lane,pattern,{role:'pattern-carrier',patternConfig:{count:3,beats:2,recovery:2,...config}});
const anchor=(lane,pattern,config={})=>m(lane,pattern,{role:'anchor',hp:4,patternConfig:{count:4,beats:2,recovery:1.9,...config}});
const guardian=(name,patterns,hp=8)=>m(0,'cycle',{name,role:'miniboss',hp,patternSequence:patterns,patternConfig:{count:4,beats:2,recovery:1.5}});
const stage=(id,intro,n1,n2,n3,final)=>({id,
  notices:[{at:0,text:intro},{at:.22,text:'Recovery: examine the surface and choose one Echo Forge evolution.'},
    {at:.34,text:n1},{at:.49,text:'Recovery: capture echoes, inspect your build, then choose again.'},
    {at:.61,text:n2},{at:.74,text:'Recovery: old hostile fire clears, reposition for the final lesson.'},
    {at:.83,text:n3}],
  waves:[
    w(`${id}-opening`,.045,'Opening formation',popcorn([-240,0,240])),
    w(`${id}-lesson`,.125,'First lesson',final[0]),
    rest(`${id}-rest-a`,.22),
    w(`${id}-second`,.34,'Compare and apply',final[1]),
    rest(`${id}-rest-b`,.49),
    w(`${id}-third`,.61,'Layer the known grammar',final[2]),
    rest(`${id}-rest-c`,.74),
    w(`${id}-final`,.83,'Stage examination',final[3],{kind:'miniboss'}),
  ]});
export const ACT_THREE_WAVE_SCRIPTS=Object.freeze({
 'projective-chart':stage('projective-chart','PROJECTIVE CHART: the Klein Relay remains; the Projective Module changes the second join.',
  'The same FAN now passes a second reversed boundary.',
  'Watch a GAP after its projective return.',
  'Projective Scout: follow the seam marks, not a Euclidean straight line.',[
    [carrier(0,'fan',{count:2,beats:1})],
    [carrier(-230,'fan',{count:3}),carrier(230,'gap',{count:3,gapWidth:1})],
    [carrier(0,'gap',{count:4,beats:2,gapWidth:2}),...popcorn([-270,270])],
    [guardian('Projective Scout',['fan','gap','return'],5)],
  ]),
 'echo-capture':stage('echo-capture','ECHO CAPTURE: C converts nearby hostile bullets into stored power. Not automatic.',
  'Capture one incoming volley near your ship. The shot ceases to be hostile.',
  'Two offset sources demand timing and positioning.',
  'Echo Gatherer: store danger before it can become damage.',[
    [carrier(0,'aimed',{count:2,beats:1,spread:.08})],
    [carrier(-200,'fan',{count:3,beats:2}),carrier(200,'aimed',{count:2})],
    [carrier(-250,'return',{count:3,spread:.65}),carrier(250,'gap',{count:3})],
    [guardian('Echo Gatherer',['aimed','fan','return'],6)],
  ]),
 'echo-release':stage('echo-release','ECHO RELEASE: E spends captured echoes as player-controlled shots. Space remains manual fire.',
  'Capture, then choose a line and release your stored shots.',
  'Release after the enemy moves into your preferred lane.',
  'Resonator: shooting and power construction work together.',[
    [carrier(0,'fan',{count:2,beats:1})],
    [anchor(0,'gap',{count:4}),...popcorn([-270,270])],
    [carrier(-240,'return',{count:3}),carrier(240,'sweep',{count:3})],
    [guardian('Resonator',['fan','gap','sweep'],7)],
  ]),
 'ordered-synthesis':stage('ordered-synthesis','ORDERED SYNTHESIS: the seven operations still apply. Projective echoes are an extra tool.',
  'Experiment with equipment order while capturing one threatened lane.',
  'The same pattern has different outcomes with a split or mirrored echo.',
  'Synthesis Pair: choose targets before releasing echoes.',[
    [carrier(0,'gap',{count:3})],
    [anchor(-210,'wall'),carrier(210,'aimed')],
    [carrier(-280,'return',{count:4}),carrier(280,'sweep',{count:4})],
    [m(-180,'cycle',{name:'Synthesis Left',role:'miniboss',hp:6,patternSequence:['fan','gap']}),
     m(180,'cycle',{name:'Synthesis Right',role:'miniboss',hp:6,patternSequence:['sweep','return']})],
  ]),
 'stellar-harvest':stage('stellar-harvest','STELLAR HARVEST: more enemies, more capturable shots, more power. Watch your hitbox.',
  'Harvest small volleys before the next horde arrives.',
  'Build strength by choosing which sources to approach.',
  'Harvest Overseer: pressure and power escalate together.',[
    [...popcorn([-330,-220,-110,0,110,220,330]),carrier(0,'fan',{count:4})],
    [anchor(-245,'wall'),anchor(245,'gap'),...popcorn([-130,130])],
    [carrier(-290,'return',{count:4,beats:3}),carrier(290,'sweep',{count:4,beats:3})],
    [guardian('Harvest Overseer',['fan','wall','return','crossfire'],10)],
  ]),
 'antipodal-storm':stage('antipodal-storm','ANTIPODAL STORM: a bullet heaven still needs readable, precise bullet-hell movement.',
  'Use your upgraded capture in a dense projective field.',
  'The short-lived safe route may pass through the identified boundary.',
  'Storm Anchor: spend echoes offensively or keep them for a ward.',[
    [carrier(0,'spiral',{count:3,beats:4}),...popcorn([-290,290])],
    [anchor(-260,'return',{count:4}),anchor(260,'crossfire',{count:4})],
    [carrier(0,'gap',{count:5,beats:3}),carrier(-280,'aimed',{count:2,beats:3})],
    [guardian('Storm Anchor',['gap','return','spiral','wall'],11)],
  ]),
 'power-without-passivity':stage('power-without-passivity','POWER WITHOUT PASSIVITY: orbitals spend stored echoes. No free automatic offense.',
  'If equipped, Echo Orbit must be fed by intentional captures.',
  'Choose between spending echoes and keeping an emergency defense.',
  'Overflow Choir: positioning and commitment remain decisive.',[
    [carrier(0,'fan',{count:4,beats:2})],
    [anchor(-290,'wall',{count:5}),anchor(290,'return',{count:4}),...popcorn([-120,120])],
    [carrier(-150,'spiral',{count:3,beats:4}),carrier(150,'gap',{count:5})],
    [guardian('Overflow Choir',['crossfire','fan','return','gap'],12)],
  ]),
 'projective-mastery':stage('projective-mastery','PROJECTIVE MASTERY: read, capture, construct, release. The geometry remains coherent.',
  'Recombine ordinary shooting, projective returns and stored echoes.',
  'Hold some captured power for the next danger field.',
  'Projective Warden: show the strength and cost of your build.',[
    [carrier(-200,'sweep',{count:4}),carrier(200,'fan',{count:4})],
    [anchor(0,'wall',{count:5}),carrier(-300,'return',{count:3}),carrier(300,'return',{count:3})],
    [anchor(-240,'crossfire',{count:5}),anchor(240,'spiral',{count:3,beats:4}),...popcorn([-90,90])],
    [guardian('Projective Warden',['fan','return','gap','spiral','crossfire'],14)],
  ]),
});
