import {writeFile} from 'node:fs/promises';
import {createFlight,tick,STEP} from '../../src/simulation.js';
import {createFleetProfile} from '../../src/fleet.js';
import {enterChapter} from '../../src/campaign.js';
const s=createFlight('campaign',{fleetProfile:createFleetProfile({fleetUnlocked:true,driveParts:['klein-relay','projective-module']}),seed:18});
enterChapter(s,26);s.phase='running';s.campaign.introRemaining=0;
for(const e of s.enemies){e.hp=0;e.x=s.x;e.z=s.z;}
s.campaign.lastDefeat={id:s.enemies[0].id,x:s.x,z:s.z};tick(s,{},STEP);
const part=s.campaign.repairPart;part.x=s.x;part.z=s.z;part.readyAt=s.time;tick(s,{},STEP);
const result={candidate:'0.24.2-dev.1',method:'State fixture copied from the existing Act III boss regression. This isolates reward text; it is not a combat clear.',part:part.id,collected:part.collected,phase:s.campaign.bossPhase,message:s.lastEvent};
await writeFile(new URL('./curvature-pickup.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
