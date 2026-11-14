// The tournament records intended coverage roles. It never modifies damage.
export const PALEY_19_RESIDUES=Object.freeze([1,4,5,6,7,9,11,16,17]);
export const shipCovers=(a,b)=>Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&a<19&&b>=0&&b<19&&a!==b&&PALEY_19_RESIDUES.includes((b-a+19)%19);
export const commonShipResponses=types=>Array.from({length:19},(_,id)=>id).filter(id=>types.every(type=>shipCovers(id,type)));

// Nozzle offsets use the center of the native 32-pixel cell. Clip dimensions
// are world units at the common 56-unit display size; neither defines collision.
const exhaust=(width,length,...nozzles)=>Object.freeze({nativeSize:32,width,length,
  nozzles:Object.freeze(nozzles.map(([x,y])=>Object.freeze({x,y})))});

export const STARTER_SHIPS=Object.freeze([
  Object.freeze({id:0,name:'Arrow',sprite:'player.arrow',exhaust:exhaust(14,24,[0,13]),role:'Responsive steering',strength:'Changes direction immediately.',weakness:'Needs more room than Needle in narrow gaps.',handles:'Covers Skater: sharp reversals',weakTo:'Needle: narrow gaps',speed:360,acceleration:0,braking:0,coreRadius:18}),
  Object.freeze({id:1,name:'Skater',sprite:'player.skater',exhaust:exhaust(10,24,[-10,12],[10,12]),role:'Fast crossing',strength:'Crosses wide patterns faster; brakes sharply.',weakness:'Has a brief ramp when starting or reversing.',handles:'Covers Needle: long crossings',weakTo:'Arrow: sharp reversals',speed:440,acceleration:4400,braking:8800,coreRadius:18}),
  Object.freeze({id:8,name:'Needle',sprite:'player.needle',exhaust:exhaust(10,20,[0,13]),role:'Small collision core',strength:'Its smaller core fits narrower bullet gaps.',weakness:'Takes longer to cross a wide pattern.',handles:'Covers Arrow: narrow gaps',weakTo:'Skater: long crossings',speed:320,acceleration:0,braking:0,coreRadius:15}),
]);
export const CRAFTABLE_SHIPS=Object.freeze([
  Object.freeze({id:3,name:'Aftwing',sprite:'player.aftwing',exhaust:exhaust(16,22,[-8,12],[8,12]),role:'Act IV retreat specialist',strength:'Reverse drive is 50% faster in Act IV. Its core is smaller than Arrow.',weakness:'Crosses the screen more slowly than the starter ships.',handles:'Trades lateral speed for Act IV reverse drive',weakTo:'Skater: wide lateral crossings',speed:305,acceleration:0,braking:0,coreRadius:17,reverseFactor:1.5}),
]);
export const SHIPS=Object.freeze([...STARTER_SHIPS,...CRAFTABLE_SHIPS]);
const starterIds=new Set(STARTER_SHIPS.map(ship=>ship.id));
const knownIds=new Set(SHIPS.map(ship=>ship.id));
export const FABRICATION_COST=5;
// First clears are used as receipts. Replays and repeated imports cannot mint more salvage.
export const SALVAGE_CHAPTERS=Object.freeze([...Array.from({length:8},(_,i)=>9+i),...Array.from({length:8},(_,i)=>18+i)]);
const earnedSalvage=profile=>SALVAGE_CHAPTERS.filter(id=>profile?.completedChapters?.includes(id)).length;
export function fabricationStatus(profile){
  const earned=earnedSalvage(profile),spent=Math.min(earned,Number.isInteger(profile?.fabricationSpent)?profile.fabricationSpent:0);
  return {earned,spent,available:earned-spent,cost:FABRICATION_COST,blueprint:profile?.driveParts?.includes('projective-module')===true,crafted:profile?.craftedShipIds?.includes(3)===true};
}
export function craftAftwing(profile){
  const status=fabricationStatus(profile);
  if(!profile||!status.blueprint||status.crafted||status.available<FABRICATION_COST)return false;
  profile.fabricationSpent=(profile.fabricationSpent||0)+FABRICATION_COST;
  profile.craftedShipIds=Array.from(new Set([...(profile.craftedShipIds||[]),3]));
  profile.unlockedShips=Array.from(new Set([...(profile.unlockedShips||[]),3]));
  profile.version=FLEET_PROFILE_VERSION;
  return true;
}
export const shipById=id=>SHIPS.find(ship=>ship.id===id)||STARTER_SHIPS[0];
export const activeShip=s=>shipById(s.shipId);

export const FLEET_PROFILE_VERSION=5;
const validChapter=value=>Number.isInteger(value)&&value>=-1&&value<=64;
const uniqueChapters=value=>Array.from(new Set(Array.isArray(value)?value.filter(validChapter):[])).sort((a,b)=>a-b);
const boundedInt=(value,max=Number.MAX_SAFE_INTEGER)=>Number.isInteger(value)&&value>=0&&value<=max?value:0;
const gradeLetters=new Set(['S','A','B','C','D','E','—']);
const normalizeRecord=value=>{
  if(!value||typeof value!=='object')return null;
  return {
    bestGrade:gradeLetters.has(value.bestGrade)?value.bestGrade:'—',
    bestGradeScore:boundedInt(value.bestGradeScore,100),
    bestScore:boundedInt(value.bestScore),
    bestClearTime:Number.isFinite(value.bestClearTime)&&value.bestClearTime>0?Math.round(value.bestClearTime*100)/100:null,
    bestGrazes:boundedInt(value.bestGrazes),
    completions:boundedInt(value.completions,100000),
    attempts:boundedInt(value.attempts,100000),
    lastShip:knownIds.has(value.lastShip)?value.lastShip:0,
    lastResult:['cleared','won','lost'].includes(value.lastResult)?value.lastResult:'cleared',
  };
};
const normalizeRecords=value=>{
  const records={};
  if(!value||typeof value!=='object'||Array.isArray(value))return records;
  for(const [key,record] of Object.entries(value)){
    const chapter=Number(key),normalized=validChapter(chapter)?normalizeRecord(record):null;
    if(normalized)records[chapter]=normalized;
  }
  return records;
};
const normalizeHistory=value=>(Array.isArray(value)?value:[]).slice(0,20).flatMap(item=>{
  if(!item||typeof item!=='object'||!validChapter(item.chapter)||!['cleared','won','lost'].includes(item.result))return [];
  return [{chapter:item.chapter,name:String(item.name||'Unknown stage').slice(0,80),result:item.result,
    score:boundedInt(item.score),grazes:boundedInt(item.grazes),shipId:knownIds.has(item.shipId)?item.shipId:0,
    grade:gradeLetters.has(item.grade)?item.grade:'—',gradeScore:boundedInt(item.gradeScore,100),
    time:Number.isFinite(item.time)&&item.time>=0&&item.time<1e9?Math.round(item.time*100)/100:0,
    cause:String(item.cause||'').slice(0,160),receipt:String(item.receipt||'').slice(0,160)}];
});

export function createFleetProfile(value){
  const parts=Array.isArray(value?.driveParts)?value.driveParts.filter(x=>['klein-relay','projective-module','curvature-seed'].includes(x)):[];
  const recovered=parts.includes('klein-relay');
  const fleetUnlocked=Boolean(recovered&&value?.fleetUnlocked===true);
  const projectiveModule=parts.includes('projective-module');
  // Crafting consumes earned unique-clear salvage. Older profiles begin with
  // zero spent; a completed stage cannot be farmed through checkpoint retry.
  const rawSpent=boundedInt(value?.fabricationSpent,16);
  const claimedCrafted=projectiveModule&&Array.isArray(value?.craftedShipIds)&&value.craftedShipIds.includes(3);
  const unlockedShips=fleetUnlocked?[0,1,8]:[0];
  const curvatureSeed=parts.includes('curvature-seed');
  const reached=uniqueChapters(value?.reachedChapters),completed=uniqueChapters(value?.completedChapters);
  if(recovered&&!reached.includes(9))reached.push(9);
  if(projectiveModule)for(let chapter=9;chapter<=17;chapter++){if(!reached.includes(chapter))reached.push(chapter);if(!completed.includes(chapter))completed.push(chapter);}
  if(projectiveModule&&!reached.includes(18))reached.push(18);
  reached.sort((a,b)=>a-b);completed.sort((a,b)=>a-b);
  const earned=SALVAGE_CHAPTERS.filter(id=>completed.includes(id)).length;
  const spent=Math.min(earned,Math.max(claimedCrafted?FABRICATION_COST:0,rawSpent));
  const crafted=claimedCrafted&&earned>=FABRICATION_COST&&spent>=FABRICATION_COST;
  if(crafted&&fleetUnlocked)unlockedShips.push(3);
  return {version:FLEET_PROFILE_VERSION,fleetUnlocked,driveParts:recovered?Array.from(new Set(parts)):[],projectiveModule,curvatureSeed,unlockedShips,
    craftedShipIds:crafted?[3]:[],fabricationSpent:spent,
    selectedShip:unlockedShips.includes(value?.selectedShip)?value.selectedShip:0,reachedChapters:reached,completedChapters:completed,
    stageRecords:normalizeRecords(value?.stageRecords),runHistory:normalizeHistory(value?.runHistory)};
}

export function unlockKleinFleet(profile){
  const changed=!profile.fleetUnlocked||!profile.driveParts?.includes('klein-relay');
  profile.version=FLEET_PROFILE_VERSION;profile.fleetUnlocked=true;
  profile.driveParts=Array.from(new Set([...(profile.driveParts||[]),'klein-relay']));profile.unlockedShips=Array.from(new Set([0,1,8,...(profile.craftedShipIds?.includes(3)?[3]:[])]));
  profile.reachedChapters=uniqueChapters([...(profile.reachedChapters||[]),9]);profile.completedChapters=uniqueChapters(profile.completedChapters);
  profile.stageRecords=normalizeRecords(profile.stageRecords);profile.runHistory=normalizeHistory(profile.runHistory);
  if(!knownIds.has(profile.selectedShip))profile.selectedShip=0;
  return changed;
}

export function selectShip(profile,id){
  if(!profile?.fleetUnlocked||!knownIds.has(id)||!profile.unlockedShips?.includes(id))return false;
  profile.selectedShip=id;return true;
}

export function unlockProjectiveModule(profile){
  const changed=!profile.projectiveModule||!profile.driveParts?.includes('projective-module');
  profile.version=FLEET_PROFILE_VERSION;profile.driveParts=Array.from(new Set([...(profile.driveParts||[]),'klein-relay','projective-module']));profile.projectiveModule=true;
  profile.reachedChapters=uniqueChapters([...(profile.reachedChapters||[]),...Array.from({length:10},(_,i)=>9+i)]);
  profile.completedChapters=uniqueChapters([...(profile.completedChapters||[]),...Array.from({length:9},(_,i)=>9+i)]);
  profile.stageRecords=normalizeRecords(profile.stageRecords);profile.runHistory=normalizeHistory(profile.runHistory);
  return changed;
}

export function markChapterReached(profile,chapter){
  if(!profile||!validChapter(chapter))return false;
  const before=(profile.reachedChapters||[]).length;
  profile.version=FLEET_PROFILE_VERSION;profile.reachedChapters=uniqueChapters([...(profile.reachedChapters||[]),chapter]);
  return profile.reachedChapters.length!==before;
}

export function recordStageResult(profile,result={}){
  if(!profile||!validChapter(result.chapter)||!['cleared','won','lost'].includes(result.result))return false;
  profile.version=FLEET_PROFILE_VERSION;markChapterReached(profile,result.chapter);
  const grade=result.grade||{},score=boundedInt(result.score),grazes=boundedInt(result.grazes),gradeScore=boundedInt(grade.score,100),gradeLetter=gradeLetters.has(grade.letter)?grade.letter:'—';
  const records=normalizeRecords(profile.stageRecords),old=records[result.chapter]||normalizeRecord({}),completed=result.result!=='lost';
  const clearTime=completed&&Number.isFinite(result.time)&&result.time>0?Math.round(result.time*100)/100:null;
  records[result.chapter]={
    bestGrade:gradeScore>=old.bestGradeScore?gradeLetter:old.bestGrade,
    bestGradeScore:Math.max(old.bestGradeScore,gradeScore),bestScore:Math.max(old.bestScore,score),bestGrazes:Math.max(old.bestGrazes,grazes),
    bestClearTime:clearTime===null?old.bestClearTime:old.bestClearTime===null?clearTime:Math.min(old.bestClearTime,clearTime),
    completions:old.completions+(completed?1:0),attempts:old.attempts+1,lastShip:knownIds.has(result.shipId)?result.shipId:0,lastResult:result.result,
  };
  profile.stageRecords=records;
  if(completed){profile.completedChapters=uniqueChapters([...(profile.completedChapters||[]),result.chapter]);if(result.chapter<26)markChapterReached(profile,result.chapter+1);}
  const receipt=String(result.receipt||`${result.runSeed??0}:${result.chapter}:${result.result}:${Math.round((result.time||0)*1000)}`);
  const entry={chapter:result.chapter,name:String(result.name||`Stage ${result.chapter}`).slice(0,80),result:result.result,score,grazes,
    shipId:knownIds.has(result.shipId)?result.shipId:0,grade:gradeLetter,gradeScore,time:Number.isFinite(result.time)?result.time:0,
    cause:String(result.cause||'').slice(0,160),receipt};
  profile.runHistory=[entry,...normalizeHistory(profile.runHistory).filter(item=>item.receipt!==receipt)].slice(0,20);
  return true;
}

export function practiceChapters(profile){
  const normalized=createFleetProfile(profile);if(!normalized.fleetUnlocked)return [];
  const reached=new Set(normalized.reachedChapters);
  return Array.from({length:17},(_,i)=>9+i).filter(chapter=>reached.has(chapter));
}

/** Research seed, not a completed Hyperbolic Drive. */
export function unlockCurvatureSeed(profile){
  if(!profile)return false;
  const changed=!profile.driveParts?.includes('curvature-seed');
  profile.driveParts=Array.from(new Set([...(profile.driveParts||[]),'curvature-seed']));
  profile.curvatureSeed=true;return changed;
}
