/**
 * A cleared ordinary campaign route is a brief, skippable intermission, not a
 * paused simulation awaiting a mouse click. Act bosses, practice, defeat and
 * the last implemented chapter retain their existing explicit actions.
 *
 * The countdown accrues only visible, unobstructed frame time. It never
 * changes the campaign state itself: the caller invokes continueCampaign so
 * all existing checkpoint, equipment and UI work goes through one path.
 */
export const STAGE_CLEAR_SECONDS = 2.8;

export function autoAdvanceEligible(flight,maxChapterIndex){
  const index=flight?.campaign?.index;
  return flight?.mode==='campaign'&&!flight.practice&&flight.phase==='cleared'&&
    Number.isInteger(index)&&index>=0&&index<maxChapterIndex;
}

export function createStageClearClock(seconds=STAGE_CLEAR_SECONDS){
  let key=null,remaining=seconds,consumed=false;
  return Object.freeze({
    reset(){key=null;remaining=seconds;consumed=false;},
    remaining(){return remaining;},
    tick(flight,dt,{blocked=false,maxChapterIndex=Infinity}={}){
      if(!autoAdvanceEligible(flight,maxChapterIndex)){
        key=null;remaining=seconds;consumed=false;return false;
      }
      const nextKey=`${flight.runSeed}:${flight.campaign.index}:${flight.campaign.startedAt}`;
      if(key!==nextKey){key=nextKey;remaining=seconds;consumed=false;}
      if(consumed||blocked)return false;
      // Avoid a background tab or a long stalled frame consuming the entire
      // intermission. The UI's animation loop supplies a bounded frame delta.
      remaining=Math.max(0,remaining-Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0)));
      if(remaining>0)return false;
      consumed=true;
      return true;
    },
  });
}
