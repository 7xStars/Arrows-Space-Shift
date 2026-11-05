import {spaceDistance} from './space.js';

export const ENTRY_TIME=.65;
export const usesVisibleCombat=s=>['campaign','upgrades','trio','paley'].includes(s.mode);
export const viewTop=s=>s.view?.topInset??112;
export const campaignScale=s=>Math.max(80,(s.view?.height||740)-viewTop(s)-88)/950;
export function projectInView(s,x,z){
  const {width=900,height=740}=s.view||{};
  return {x:width/2+x*width/800,y:height-88-spaceDistance(s.mode==='campaign'?(s.cameraZ||0):s.z,z,s.fields)*(s.mode==='campaign'?campaignScale(s):(height-150)/1050)};
}
export function inCombatView(s,object){
  const {width=900,height=740}=s.view||{},p=projectInView(s,object.x,object.z);
  return p.x>=32&&p.x<=width-32&&p.y>=viewTop(s)&&p.y<=height-58;
}
export function inPlayerShotView(s,shot){
  const {width=900,height=740}=s.view||{},p=projectInView(s,shot.x,shot.z);
  return p.x>=0&&p.x<=width&&p.y>=viewTop(s)&&p.y<=height-40;
}
export function combatReady(s,enemy){
  return !usesVisibleCombat(s)||Boolean(enemy.presented&&enemy.visibleFor>=ENTRY_TIME&&inCombatView(s,enemy));
}
export function presentEnemy(s,enemy){
  if(!usesVisibleCombat(s)||s.phase!=='running'||!inCombatView(s,enemy)||enemy.stage>s.stage||enemy.hp<=0||enemy.escaped)return;
  if(!enemy.presented){
    enemy.presented=true;enemy.visibleFor=0;
    s.events.push({time:s.time,type:'enemy-presented',target:enemy.id,x:enemy.x,z:enemy.z});
  }
}
export function updateCombatReadiness(s,dt){
  if(!usesVisibleCombat(s))return;
  for(const enemy of s.enemies){
    if(!inCombatView(s,enemy)||enemy.stage>s.stage){enemy.presented=false;enemy.visibleFor=0;}
    else if(enemy.presented)enemy.visibleFor=(enemy.visibleFor||0)+dt;
  }
}
