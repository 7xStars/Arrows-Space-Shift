import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';

const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}
catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=resolve(import.meta.dirname,'..');
const output=resolve(process.argv[2]||'G:/Music Projects/Arrow Space Shift/scratch/itch-media-dev5');
await mkdir(output,{recursive:true});
const report={candidate:JSON.parse(await readFile(join(root,'package.json'),'utf8')).version,
  method:'Native browser captures. QA chapter selection supplies late-stage access. All later movement, shooting, folds, capture, release, and evolution choices use keyboard input. No added projectiles, damage, invulnerability, or retouched combat.',
  viewport:{width:1280,height:800},captures:[],errors:[],failedAssets:[],sourceHashes:{}};
for(const file of ['src/app.js','src/interface.js','src/build.js','style.css','assets/crossing/manifest.json'])
  report.sourceHashes[file]=createHash('sha256').update(await readFile(join(root,file))).digest('hex');
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
let browser;
const compact=s=>({phase:s.phase,time:s.time,chapter:s.campaign?.index,name:s.campaign?.chapter?.name,hull:s.hull,score:s.score,
  folds:s.fields.length,shots:s.shotCount,enemyShots:s.enemyShotCount,enemies:s.enemies.filter(e=>e.hp>0&&e.visible).length,
  captured:s.projective?.captured||0,released:s.projective?.released||0,echoes:s.projective?.echoes||0,notice:s.lastEvent});
try{
  const url=await new Promise((accept,reject)=>{let log='';const timeout=setTimeout(()=>reject(Error('Capture server timed out.')),10000);
    server.stdout.on('data',chunk=>{log+=chunk;const found=log.match(/http:\/\/127\.0\.0\.1:\d+\//);if(found){clearTimeout(timeout);accept(found[0]);}});server.once('error',reject);});
  browser=await chromium.launch({channel:'msedge',headless:true});report.browser=browser.version();
  for(const item of [
    {id:'01-act-i-folded-route',index:0,fold:true,fire:true},
    {id:'02-klein-fleet',index:8,fold:false,fire:true},
    {id:'03-act-ii-returning-fire',index:14,fold:true,fire:true},
    {id:'04-act-iii-echo-ecology',index:19,fold:false,fire:false,capture:true},
    {id:'05-curvature-gate',index:26,fold:false,fire:true,capture:true},
  ].filter(item=>!process.argv[3]||item.id===process.argv[3])){
    const context=await browser.newContext({viewport:report.viewport,deviceScaleFactor:1});
    const page=await context.newPage();page.setDefaultTimeout(15000);
    page.on('pageerror',e=>report.errors.push({scene:item.id,message:e.message}));
    page.on('response',r=>{if(r.status()>=400)report.failedAssets.push({scene:item.id,url:r.url(),status:r.status()});});
    await page.goto(url+'?qa=1');await page.waitForFunction(()=>window.arrowSpaceShift?.assets().ready);
    await page.getByRole('button',{name:'Options',exact:true}).click();
    await page.getByRole('button',{name:item.index>=18?'QA: Fleet Foundry':'QA: Stage 7',exact:true}).click();
    await page.evaluate(index=>window.arrowSpaceShiftTest.loadChapterTrial(index),item.index);
    await page.locator('#space').focus();
    if(item.fire)await page.keyboard.down('Space');
    if(item.capture)await page.keyboard.down('c');
    let direction=null;
    for(let step=0;step<30;step++){
      let s=await page.evaluate(()=>window.arrowSpaceShift.read());
      if(s.phase==='choosing'){await page.keyboard.press('Digit1');s=await page.evaluate(()=>window.arrowSpaceShift.read());}
      if(s.phase!=='running')break;
      if(item.fold&&step===3)await page.keyboard.press('ShiftLeft');
      if(item.fold&&step===17)await page.keyboard.press('ShiftRight');
      if(item.capture&&s.projective?.echoes>0&&step%5===0)await page.keyboard.press('e',{delay:100});
      const target=Math.sin(step*.32)*180;
      const next=Math.abs(target-s.x)<35?null:target>s.x?'ArrowRight':'ArrowLeft';
      if(next!==direction){if(direction)await page.keyboard.up(direction);if(next)await page.keyboard.down(next);direction=next;}
      await page.waitForTimeout(550);
      if([7,12,17,22,27].includes(step)){
        s=await page.evaluate(()=>window.arrowSpaceShift.read());
        if(s.phase!=='running')continue;
        const file=`${item.id}-${String(step).padStart(2,'0')}.png`;
        await page.screenshot({path:join(output,file)});
        const entry={file,scene:item.id,fixtureChapter:item.index,state:compact(s)};
        report.captures.push(entry);console.log(JSON.stringify(entry));
      }
    }
    if(direction)await page.keyboard.up(direction);
    if(item.fire)await page.keyboard.up('Space');if(item.capture)await page.keyboard.up('c');
    await context.close();
  }
}catch(error){report.failure=error.stack||String(error);process.exitCode=1;}
finally{await browser?.close();server.kill();await writeFile(join(output,'capture-report.json'),JSON.stringify(report,null,2)+'\n');}
