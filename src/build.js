/** Release gates. Keep 0.20.3 history and the Act I seed namespace stable. */
export const BUILD=Object.freeze({
  version:'0.25.1-dev.6',label:'Three-Act jam edition',maxChapterIndex:26,maxAct:3,postJamContent:false,
  practice:true,history:true,persistentGrades:true,collisionCoreOption:true,
});

export const isActAvailable=act=>Number.isInteger(act)&&act>=1&&act<=BUILD.maxAct&&(act<=3||BUILD.postJamContent);

/** The jam ending requires the banked Act III reward. */
export const isJamCampaignComplete=(state,profile=state?.fleetProfile)=>BUILD.maxAct===3&&
  state?.mode==='campaign'&&state.phase==='won'&&state.campaign?.index===26&&state.practice!==true&&profile?.curvatureSeed===true;

export const isJamCompletionEntry=(state,profile=state?.fleetProfile)=>BUILD.maxAct===3&&
  state?.mode==='campaign'&&state.phase==='ready'&&state.restoredCheckpoint!==true&&profile?.curvatureSeed===true;
