import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const version=JSON.parse(await fs.readFile('package.json','utf8')).version;
const release=path.resolve(`dist/itch/${version}`),root=path.join(release,'verified');
const record=JSON.parse((await fs.readFile(path.join(release,'package.json'),'utf8')).replace(/^\uFEFF/,''));
const results=[],errors=[],requests=[];
const check=(label,condition)=>{assert.ok(condition,label);results.push(label);};
const zip=await fs.readFile(record.archive);check('The tested ZIP matches its SHA-256 record',createHash('sha256').update(zip).digest('hex')===record.sha256);
const files=await fs.readdir(root);check('The extracted ZIP contains only runtime files, assets, and the notice',files.sort().join(',')==='NOTICE.txt,assets,index.html,src,style.css');
const app=await fs.readFile(path.join(root,'src/app.js'),'utf8');check('The release preserves UTF-8 status labels',app.includes('↑')&&app.includes(' · ')&&!app.includes('Â·'));
const game=http.createServer(async(req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname;const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(path.relative(root,file).startsWith('..'))throw Error();const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':file.endsWith('.json')?'application/json':'text/html'});res.end(data);}catch{res.writeHead(404).end();}});
await new Promise(resolve=>game.listen(0,'127.0.0.1',resolve));const gameUrl=`http://127.0.0.1:${game.address().port}`;
const host=http.createServer((req,res)=>res.end(`<!doctype html><html><body><p>Local itch.io iframe check</p><iframe title="Arrow Space Shift" width="960" height="720" src="${gameUrl}/?test=1&lab=1" allow="fullscreen"></iframe></body></html>`));
await new Promise(resolve=>host.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1280,height:900}});
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)requests.push({url:r.url(),status:r.status()});});
try{
  await page.goto(`http://127.0.0.1:${host.address().port}`);const frame=page.frames().find(f=>f.url().startsWith(gameUrl));await frame.waitForFunction(()=>window.arrowSpaceShift);
  const read=()=>frame.evaluate(()=>window.arrowSpaceShift.read());
  check('Release query parameters cannot enable fixture controls',await frame.evaluate(()=>!window.arrowSpaceShiftTest));
  await frame.waitForFunction(()=>window.arrowSpaceShift.assets().ready&&window.arrowSpaceShift.assets().used.includes('player.arrow'));
  check('The packaged pixel atlas loads and draws the player',await frame.evaluate(()=>{const a=window.arrowSpaceShift.assets();return a.ready&&a.used.includes('player.arrow')&&!a.error;}));
  check('Release mode hides prototype selection and research tools',!(await frame.locator('.setup').isVisible())&&!(await frame.locator('#save-results').isVisible()));
  check('Canvas fills the 960 x 720 iframe',await frame.locator('canvas').evaluate(e=>{const r=e.getBoundingClientRect();return r.x===0&&r.y===0&&r.width===innerWidth&&r.height===innerHeight;}));
  await frame.getByRole('button',{name:'Start campaign',exact:true}).click();
  for(const key of ['ArrowRight','ArrowLeft']){await page.keyboard.down(key);await page.waitForTimeout(250);await page.keyboard.up(key);}
  check('Release tutorial accepts left and right steering',(await read()).campaign.lesson==='shoot');
  await page.waitForTimeout(800);await page.keyboard.down('Space');await frame.waitForFunction(()=>window.arrowSpaceShift.read().phase==='cleared');await page.keyboard.up('Space');
  check('The extracted release completes Level 0 with real fire',(await read()).phase==='cleared');
  await frame.getByRole('button',{name:'Start Level 1',exact:true}).click();
  const original=(await read()).facing;
  for(const key of ['ArrowUp','ArrowDown']){await page.keyboard.down(key);await page.waitForTimeout(250);await page.keyboard.up(key);}
  const travel=await read();check('Vertical keys do not move the ship relative to the route',Math.abs(travel.z-travel.cameraZ)<1e-6&&travel.facing===original&&travel.cameraZ>0);
  await page.keyboard.press('ShiftLeft');check('Left Shift folds in the release',(await read()).fields.length===1);
  await page.keyboard.press('ShiftRight');check('Right Shift unfolds in the release',(await read()).fields.length===0);
  await frame.getByRole('button',{name:'Equipment',exact:true}).click();check('Release equipment pauses the game',(await read()).phase==='paused');await page.keyboard.press('Escape');await frame.getByRole('button',{name:'Resume flight',exact:true}).click();
  check('No page scrolling is needed inside the iframe',await frame.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth));
  check('Combat excludes the in-viewport status area',await read().then(s=>s.view.topInset>100&&s.enemies.filter(e=>e.ready).every(e=>e.visible)));
  await page.locator('iframe').screenshot({path:'reports/itch-viewport.png'});
  for(const [width,height] of [[640,480],[320,568]]){
    await page.locator('iframe').evaluate((e,size)=>{e.width=size[0];e.height=size[1];},[width,height]);await page.waitForTimeout(100);
    check(`Release viewport fits a ${width} x ${height} iframe`,await frame.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth));
  }
  check('All requested release resources loaded',requests.length===0);check('No release runtime error occurred',errors.length===0);
  const report={checks:results.length,results,errors,requests,archive:record.archive,sha256:record.sha256,limits:'Local cross-origin iframe serving the extracted ZIP. Not an upload to itch.io. No hosted fullscreen, audio, full campaign, or human playtest.'};
  await fs.writeFile('reports/itch-browser-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();await Promise.all([new Promise(r=>game.close(r)),new Promise(r=>host.close(r))]);}
