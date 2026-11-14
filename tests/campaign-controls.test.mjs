import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlight,tick,STEP} from '../src/simulation.js';
import {enterChapter,arenaY,arenaZ,isKleinSurfaceRoute,isBoss} from '../src/campaign.js';
import {createFleetProfile} from '../src/fleet.js';

function campaign(index){
  const profile=createFleetProfile({fleetUnlocked:true,driveParts:['klein-relay','projective-module'],unlockedShips:[0,1,8],selectedShip:0});
  const s=createFlight('campaign',{seed:2511,fleetProfile:profile});
  if(index>=0)enterChapter(s,index);
  s.phase='running';s.countdown=0;
  if(isBoss(s))s.campaign.introRemaining=0;
  if(isKleinSurfaceRoute(s)){s.x=398;s.z=arenaZ(s,160);}
  return s;
}

test('main campaign throttle cannot change state in tutorial, three Acts, or bosses',()=>{
  for(const index of [-1,0,6,9,13,18,24,8,17,26]){
    const initial=campaign(index),neutral=structuredClone(initial),up=structuredClone(initial),down=structuredClone(initial);
    for(let frame=0;frame<80;frame++){
      const horizontal=frame<20?1:frame<40?-1:0;
      const actions={horizontal,fire:frame%3===0};
      tick(neutral,{...actions,throttle:0},STEP);
      tick(up,{...actions,throttle:1},STEP);
      tick(down,{...actions,throttle:-1},STEP);
    }
    assert.deepEqual(up,neutral,`Up changed chapter ${index}`);
    assert.deepEqual(down,neutral,`Down changed chapter ${index}`);
    assert.equal(neutral.lastAxialInput,0);
    if(index>=0&&!isBoss(neutral))assert.ok(neutral.cameraZ>initial.cameraZ,'the route keeps moving forward');
  }
});

test('restored surface-route bounds remain safe without axial movement authority',()=>{
  for(const index of [9,18])for(const offset of [25,160,405]){
    const s=campaign(index);s.x=0;s.z=arenaZ(s,offset);const before=s.cameraZ;
    tick(s,{horizontal:0,throttle:1,fire:false},STEP);
    assert.ok(Math.abs(arenaY(s,s.z)-offset)<1e-8);
    assert.ok(s.cameraZ>before);assert.equal(s.lastAxialInput,0);
  }
});

test('noncampaign flight retains its independent thrust control',()=>{
  const initial=createFlight('flight',{seed:2512});initial.phase='running';initial.countdown=0;
  const neutral=structuredClone(initial),forward=structuredClone(initial),reverse=structuredClone(initial);
  tick(neutral,{horizontal:0,throttle:0,fire:false},STEP);
  tick(forward,{horizontal:0,throttle:1,fire:false},STEP);
  tick(reverse,{horizontal:0,throttle:-1,fire:false},STEP);
  assert.ok(forward.z>neutral.z);assert.ok(reverse.z<neutral.z);
});
