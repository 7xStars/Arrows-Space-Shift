import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {join,resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';

const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'));}
catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=resolve(import.meta.dirname,'..'),output=join(root,'reports/fold-lesson-016/keyboard');
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
const report={method:'Headless Edge, fresh browser storage, real keyboard input for tutorial and Level 1. A separate existing asteroid fixture uses the QA simulation advance control to check the clear result. It is not a full campaign playthrough.',results:[],states:{},errors:[],missing:[]};
let browser,activePage;
try{
  const url=await new Promise((accept,reject)=>{
    let buffer='';const timer=setTimeout(()=>reject(new Error('Server startup timeout')),10000);
    server.stdout.on('data',chunk=>{buffer+=chunk;const match=buffer.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);accept(match[0]);}});
    server.on('error',reject);
  });
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  activePage=page;
  page.on('pageerror',error=>report.errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)report.missing.push(response.url());});
  const read=()=>page.evaluate(()=>window.arrowSpaceShift.read());
  const check=(name,value)=>{assert.ok(value,name);report.results.push(name);};
  await page.goto(url);await page.waitForFunction(()=>window.arrowSpaceShift?.assets().ready);
  check('Normal entry has no scenario controls',await page.evaluate(()=>!window.arrowSpaceShiftTest));
  await page.locator('#primary').click();
  for(const [key,duration] of [['ArrowLeft',200],['ArrowRight',400]]){
    await page.keyboard.down(key);await page.waitForTimeout(duration);await page.keyboard.up(key);
  }
  await page.waitForFunction(()=>window.arrowSpaceShift.read().campaign.lesson==='shoot');
  const before=await read();report.states.beforeFire=before;
  check('Enemy is present before the first shot',before.enemies.length===1&&before.events.every(e=>e.type!=='player-fire'));
  const x=before.x,key=x>0?'ArrowLeft':'ArrowRight';
  await page.keyboard.down(key);await page.waitForTimeout(Math.abs(x)/360*1000);await page.keyboard.up(key);
  await page.keyboard.down('Space');
  await page.waitForFunction(()=>window.arrowSpaceShift.read().campaign.lesson==='fold');
  await page.keyboard.press('ShiftLeft');
  await page.waitForTimeout(650);
  const folded=await read();report.states.folded=folded;
  check('One living enemy remains during compressed fire',folded.enemies[0].id===before.enemies[0].id&&folded.enemies[0].hp>0&&folded.fields.length===1);
  check('Held Space produces shots during the unfold step',folded.events.filter(e=>e.type==='player-fire').length>=3&&folded.campaign.lesson==='unfold');
  check('A player shot crosses the actual fold',folded.events.some(e=>e.type==='fold-entry'&&e.owner==='player'));
  await page.screenshot({path:join(output,'folded-combat.png')});
  await page.keyboard.press('ShiftRight');
  const unfolded=await read();report.states.unfolded=unfolded;
  check('Unfold preserves target identity and health',unfolded.enemies[0].id===folded.enemies[0].id&&unfolded.enemies[0].hp<=folded.enemies[0].hp);
  check('Unfold preserves active player shots',unfolded.fields.length===0&&unfolded.shotCount>0);
  await page.waitForFunction(()=>window.arrowSpaceShift.read().campaign.index===0,{},{timeout:12000});
  await page.keyboard.up('Space');
  const level=await read();
  check('Normal combat reaches Level 1',level.events.some(e=>e.type==='enemy-hit')&&level.events.some(e=>e.type==='tutorial-complete'));
  await page.waitForFunction(()=>window.arrowSpaceShift.read().drive.faults>0,{},{timeout:12000});
  check('Automatic campaign folds remain active',(await read()).drive.faults>0);
  await page.keyboard.press('ShiftLeft');await page.waitForTimeout(1600);
  check('Route HUD exposes saved time',await page.locator('#time-label').textContent().then(text=>/\+\d+\.\d+s saved/.test(text)));
  await page.screenshot({path:join(output,'route-speed.png')});
  report.states.route=await read();
  await page.goto(new URL('?qa=1',url).href);
  await page.waitForFunction(()=>window.arrowSpaceShiftTest&&window.arrowSpaceShift.assets().ready);
  await page.evaluate(()=>window.arrowSpaceShiftTest.loadAsteroidTrial('none'));
  for(let i=0;i<3;i++)await page.keyboard.press('ShiftLeft');
  await page.evaluate(()=>window.arrowSpaceShiftTest.advance(40));
  await page.waitForFunction(()=>window.arrowSpaceShift.read().phase==='cleared');
  const cleared=await read();report.states.fixtureClear=cleared;
  const speed=cleared.campaign.grade.speed,bonus=cleared.events.filter(e=>e.type==='speed-bonus').at(-1);
  check('Route fixture earns one actual speed bonus',speed.bonus>0&&bonus.bonus===speed.bonus);
  check('Clear result displays speed grade and points',await page.locator('#overlay-text').textContent().then(text=>text.includes(`Speed ${speed.letter}`)&&text.includes(`+${speed.bonus} points`)));
  await page.screenshot({path:join(output,'speed-result.png')});
  const record=cleared.fleetProfile.stageRecords?.[1];
  check('The in-memory record includes the bonus and clear time',record?.bestScore===cleared.score&&Math.abs(record.bestClearTime-speed.elapsed)<.02);
  check('No page errors or missing resources',report.errors.length===0&&report.missing.length===0);
}catch(error){report.failure=error.stack;process.exitCode=1;
  if(activePage){report.states.failure=await activePage.evaluate(()=>window.arrowSpaceShift?.read()).catch(()=>null);await activePage.screenshot({path:join(output,'failure.png')}).catch(()=>{});}
}
finally{
  if(browser)await browser.close();server.kill();
  await writeFile(join(output,'results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({results:report.results,failure:report.failure,errors:report.errors,missing:report.missing},null,2));
}
