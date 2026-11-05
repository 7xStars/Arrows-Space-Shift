import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:960,height:720}}),results=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));const check=(name,value)=>{assert.ok(value,name);results.push(name);};
const read=()=>page.evaluate(()=>window.arrowSpaceShiftTest.read()),advance=n=>page.evaluate(n=>window.arrowSpaceShiftTest.advance(n),n);
try{
  await page.goto('http://127.0.0.1:4177/?test=1');
  for(let index=0;index<8;index++){
    await page.evaluate(index=>window.arrowSpaceShiftTest.loadEnemyReturnTrial(index),index);const before=(await read()).enemies[0];await advance(.04);const after=(await read()).enemies[0];
    check(`Level ${index+1} returns a bottom-edge enemy with retained health`,after.loopCount===1&&after.hp===before.hp&&after.id===before.id&&!after.escaped);
    check(`Level ${index+1} gives the returned enemy a new entry period`,!after.ready&&after.visibleFor<.65&&(await read()).enemyShotCount===0);
  }
  await page.evaluate(()=>window.arrowSpaceShiftTest.loadEnemyReturnTrial(6,'right'));const before=(await read()).enemies[0];await advance(.02);let s=await read();
  check('Stage 7 visibly returns a side-crossing carrier at the opposite side',s.enemies[0].x< -390&&s.enemies[0].hp===before.hp&&s.events.some(e=>e.type==='klein-crossing'&&e.edge==='right'));
  await advance(.25);s=await read();check('The side return is drawn before combat becomes active',s.enemies[0].presented&&s.enemies[0].visible&&!s.enemies[0].ready);
  await page.screenshot({path:'reports/stage-seven-side-return.png'});
  await page.evaluate(()=>window.arrowSpaceShiftTest.loadEnemyReturnTrial(6,'top'));await advance(.04);s=await read();
  check('Stage 7 top crossing returns at the bottom with the same horizontal position',Math.abs(s.enemies[0].x-140)<1e-6&&s.events.some(e=>e.type==='klein-crossing'&&e.edge==='top'));
  await page.evaluate(()=>window.arrowSpaceShiftTest.loadEnemyReturnTrial(0));await advance(.8);s=await read();check('A returned carrier becomes active after visible entry',s.enemies[0].ready&&s.enemies[0].hp===1);
  await page.screenshot({path:'reports/enemy-bottom-return.png'});
  await page.evaluate(()=>window.arrowSpaceShiftTest.loadChapterTrial(6));await advance(3);await page.screenshot({path:'reports/stage-seven-flight.png'});
  check('No runtime error occurred',errors.length===0);
  const report={checks:results.length,results,errors,limits:'Prepared edge fixtures verify returns and visible entry. They do not establish full-level balance or player recognition.'};await fs.writeFile('reports/enemy-return-browser-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
