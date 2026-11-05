import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const browser=await chromium.launch({headless:true,channel:'msedge'});
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const page=await context.newPage(),errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));
const check=(name,condition)=>{assert.ok(condition,name);results.push(name);};
const read=()=>page.evaluate(()=>window.arrowSpaceShiftTest.read());
const advance=seconds=>page.evaluate(n=>window.arrowSpaceShiftTest.advance(n),seconds);
const reset=async(newRun=false)=>{await page.locator('#open-options').click();await page.locator(newRun?'#new-run':'#restart').click();await page.locator('#confirm-reset').click();};
const finish=async()=>{await page.evaluate(()=>window.arrowSpaceShiftTest.finishWaveTrial());return advance(.1);};
await fs.mkdir('reports',{recursive:true});
try{
  await page.goto('http://127.0.0.1:4177/?test=1');
  check('The campaign starts with Level 0 and a start screen',(await read()).campaign.index===-1&&(await read()).phase==='ready');
  await page.screenshot({path:'reports/campaign-ready.png',fullPage:true});
  await page.getByRole('button',{name:'Start campaign',exact:true}).click();
  await page.evaluate(()=>window.arrowSpaceShiftTest.loadChapterTrial(0));
  check('The player ship is within the desktop browser view',await page.evaluate(()=>{const r=document.querySelector('canvas').getBoundingClientRect();return r.top+r.height-88<innerHeight-20;}));
  await page.keyboard.down('Space');await advance(2);await page.keyboard.up('Space');
  const firstFire=await read();
  check('Normal-health targets can be defeated while the route scrolls',firstFire.kills>0&&firstFire.cameraZ>100&&firstFire.events.some(e=>e.type==='target-hit'&&e.visible&&e.presented));
  await page.screenshot({path:'reports/scrolling-combat.png',fullPage:true});
  await page.keyboard.down('ArrowRight');await advance(.3);await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowUp');await advance(.2);await page.keyboard.up('ArrowUp');
  const moved=await read();check('Real arrow keys move freely in the campaign',moved.x>80&&moved.z>0);
  await page.keyboard.down('ArrowDown');await advance(.1);await page.keyboard.up('ArrowDown');
  await page.keyboard.down('Space');await advance(.05);await page.keyboard.up('Space');
  check('Up and Down do not change route travel or facing',(await read()).facing===1&&Math.abs((await read()).z-(await read()).cameraZ)<1e-6&&(await read()).projectiles.player.every(s=>s.vz>0));
  await reset();
  check('Retry restores the current section checkpoint',(await read()).campaign.index===0&&(await read()).x===0&&(await read()).hull===5);
  for(const index of [0,1,2,3,4,5,6,7]){
    const state=await read();check(`Level ${state.campaign.chapter.number} begins at its proper place`,state.campaign.index===index&&state.phase==='running');
    await advance(.2);check(`Level ${state.campaign.chapter.number} advances the scrolling camera`,(await read()).cameraZ>0&&(await read()).phase==='running');
    if(index%2===1){
      check(`Level ${index+1} contains mostly asteroids and occasional enemies`,state.asteroids.length>state.enemies.length&&state.enemies.length<=4);
      check(`Level ${index+1} has no countdown or target quota`,state.campaign.chapter.timeLimit===undefined&&state.campaign.chapter.targetCount===undefined&&!(await page.locator('#campaign-objective').innerText()).includes('s left'));
      if(index===1){
        await page.screenshot({path:'reports/quiet-belt.png',fullPage:true});
        const positions=state.asteroids.map(a=>[a.x,a.z]);await reset();
        check('Retry preserves the generated asteroid layout',JSON.stringify((await read()).asteroids.map(a=>[a.x,a.z]))===JSON.stringify(positions));
      }
    }
    await page.evaluate(()=>window.arrowSpaceShiftTest.finishRouteTrial());await advance(.1);
    check(`Level ${state.campaign.chapter.number} clears at its route end`,(await read()).phase==='cleared'&&(await read()).campaign.routeReached);
    if(index===4)await page.screenshot({path:'reports/campaign-level-three.png',fullPage:true});
    await page.getByRole('button',{name:index===7?'Enter the final battle':`Start Level ${state.campaign.chapter.number+1}`,exact:true}).click();
  }
  check('The final battle contains a persistent core and two escorts',(await read()).campaign.chapter.kind==='boss'&&(await read()).enemies.length===3);
  const before=(await read()).enemies.map(e=>e.hp);await advance(3);const after=await read();
  check('Boss ships cross screen edges and remain alive',after.events.some(e=>e.type==='klein-crossing'&&e.actor.startsWith('enemy-'))&&after.enemies.every((e,i)=>e.hp===before[i]&&!e.escaped));
  check('The boss uses both reversed side edges and ordinary vertical edges',after.events.some(e=>e.type==='klein-crossing'&&['left','right'].includes(e.edge))&&after.events.some(e=>e.type==='klein-crossing'&&['top','bottom'].includes(e.edge)));
  await page.screenshot({path:'reports/campaign-boss.png',fullPage:true});
  await page.keyboard.press('KeyP');const paused=(await read()).time;await advance(1);check('Pause freezes the boss battle',(await read()).time===paused);
  await page.getByRole('button',{name:'Resume flight',exact:true}).click();
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);
  check('The campaign has no horizontal overflow at 390 px',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'reports/campaign-boss-compact.png',fullPage:true});
  await page.setViewportSize({width:320,height:740});await page.waitForTimeout(100);
  check('The campaign has no horizontal overflow at 320 px',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.setViewportSize({width:1440,height:1000});
  await page.evaluate(()=>window.arrowSpaceShiftTest.loadChapterTrial(8));await finish();
  check('Destroying all fleet members reaches the campaign ending',(await read()).phase==='won'&&await page.getByRole('heading',{name:'The fleet is destroyed.',exact:true}).isVisible());
  await page.screenshot({path:'reports/campaign-complete.png',fullPage:true});
  await page.getByRole('button',{name:'Start a new campaign',exact:true}).click();
  check('A new campaign clears earlier score and progression',(await read()).campaign.index===-1&&(await read()).score===0);
  await page.evaluate(()=>window.arrowSpaceShiftTest.loadAsteroidTrial('player'));await advance(.1);
  check('Player fire breaks a rendered asteroid',(await read()).events.some(e=>e.type==='asteroid-broken'&&e.owner==='player')&&(await read()).score===10);
  await page.screenshot({path:'reports/asteroid-break.png',fullPage:true});
  await page.evaluate(()=>window.arrowSpaceShiftTest.loadAsteroidTrial('enemy'));await advance(.1);
  check('Enemy fire also breaks a rendered asteroid',(await read()).events.some(e=>e.type==='asteroid-broken'&&e.owner==='enemy')&&(await read()).score===0);
  await page.evaluate(()=>window.arrowSpaceShiftTest.loadAsteroidTrial('ship'));await advance(.1);
  check('Asteroid contact still reduces hull in a calm level',(await read()).hull===4&&(await read()).events.some(e=>e.type==='asteroid-broken'&&e.owner==='ship'));
  await page.goto('http://127.0.0.1:4177/');await page.getByRole('button',{name:'Start campaign',exact:true}).click();await page.waitForTimeout(1000);
  const normal=await page.evaluate(()=>window.arrowSpaceShift.read());
  check('The normal campaign loop waits for tutorial movement',normal.time>.3&&normal.z===0&&normal.cameraZ===0&&normal.campaign.index===-1);
  check('Campaign fixture controls are absent from the normal page',await page.evaluate(()=>!window.arrowSpaceShiftTest));
  await reset(true);
  check('New run returns to setup and unlocks the mode selector',await page.locator('#mode').isEnabled()&&await page.evaluate(()=>window.arrowSpaceShift.read().phase==='ready'));
  const fresh=await page.evaluate(()=>window.arrowSpaceShift.read());check('A new run uses a new layout seed',fresh.runSeed!==normal.runSeed);
  check('No campaign browser error occurred',errors.length===0);
  const report={browser:'Microsoft Edge, headless',version:browser.version(),checks:results.length,results,errors,limits:'Route transitions start near the exit. The boss ending uses prepared one-hit targets. Asteroid collisions have separate rendered fixtures. Pressure and human understanding remain untested.'};
  await fs.writeFile('reports/campaign-browser-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
