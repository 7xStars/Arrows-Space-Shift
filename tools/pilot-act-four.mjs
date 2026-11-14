import {createActFour,startActFour,stepActFour,actFourAction,quotientAim,quotientDistance,nextActFour} from '../src/hyperbolic-campaign.js';
import {writeFile,mkdir} from 'node:fs/promises';
const angle=(a,b)=>Math.atan2(a.x*b.y-a.y*b.x,a.x*b.x+a.y*b.y);
export function pilotInput(s){
  let target=s.finalReward?.state==='exposed'?s.finalReward.position:s.finalReward?.state==='collected'?s.finalReward.extractionPosition:null;
  if(!target&&s.enemies.length)target=[...s.enemies].sort((a,b)=>quotientDistance(s.player.position,a.position)-quotientDistance(s.player.position,b.position))[0].position;
  if(!target)return {turn:0,drive:s.crossings<1?1:0,fire:false};
  const error=angle(s.player.heading,quotientAim(s.player.position,target)),distance=quotientDistance(s.player.position,target);
  if(s.shots.some(shot=>shot.team==='enemy'&&quotientDistance(s.player.position,shot.position)<.3))actFourAction(s,'capture');
  if(s.echoes&&Math.abs(error)<.15)actFourAction(s,'release');
  if(s.stageIndex===4&&s.foldUses===0)actFourAction(s,'fold');
  const nearest=s.shots.filter(shot=>shot.team==='enemy').reduce((d,shot)=>Math.min(d,quotientDistance(s.player.position,shot.position)),Infinity);
  const needCapture=s.stage.require?.captures&&!s.captures;
  return {turn:Math.max(-1,Math.min(1,error*3)),
    drive:s.finalReward?Math.abs(error)<.55?1:0:nearest<.45?-.8:distance>1? .4:0,
    fire:!s.finalReward&&!needCapture&&Math.abs(error)<.15};
}
export function pilotCampaign(shipId=0,limit=180){
  const results=[];let game=createActFour(0,{shipId,seed:2501});
  for(let stage=0;stage<9;stage++){
    startActFour(game);
    while(game.phase==='running'&&game.time<limit)stepActFour(game,pilotInput(game),1/60);
    results.push({stage:stage+1,shipId,phase:game.phase,seconds:+game.time.toFixed(2),hull:game.player.hull,
      kills:game.kills,crossings:game.crossings,captures:game.captures,releases:game.releases,folds:game.foldUses,reward:game.finalReward?.state||null});
    if(!['cleared','won'].includes(game.phase))break;
    if(stage<8)game=nextActFour(game);
  }
  return results;
}
if(process.argv[1]&&new URL(import.meta.url).pathname.toLowerCase().endsWith(process.argv[1].replaceAll('\\','/').split('/').at(-1).toLowerCase())){
  const results=[0,1,8,3].map(shipId=>pilotCampaign(shipId));
  await mkdir('reports/completion-0.25.0-dev.1',{recursive:true});
  const report={method:'Deterministic controller with ordinary turn, drive, manual fire, capture, release and fold actions. No state writes, extra hull, or arbitrary damage. Simulation evidence only.',results};
  await writeFile('reports/completion-0.25.0-dev.1/act4-pilot.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}
