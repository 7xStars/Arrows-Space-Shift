import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'));}catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=process.cwd(),out=resolve(root,'reports/review-2026-11-13');
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
let browser;
try{
 const url=await new Promise((accept,reject)=>{let text='';const timer=setTimeout(()=>reject(new Error('server timeout')),10000);server.stdout.on('data',chunk=>{text+=chunk;const m=text.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m){clearTimeout(timer);accept(m[0]);}});server.once('error',reject);});
 browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const Native=window.AudioContext||window.webkitAudioContext;window.__contexts=[];if(Native)window.AudioContext=class extends Native{constructor(...args){super(...args);window.__contexts.push(this);}};});
 await page.goto(new URL('hyperbolic-act.html?qa=1',url).href);
 await page.locator('#launch').click();
 await page.waitForFunction(()=>window.__contexts.length===1&&window.__contexts[0].state==='running');
 const before=await page.evaluate(()=>({contexts:window.__contexts.length,state:window.__contexts[0].state}));
 await page.evaluate(()=>window.__contexts[0].suspend());
 await page.waitForTimeout(300);
 await page.keyboard.down('Space');await page.waitForTimeout(200);await page.keyboard.up('Space');
 const afterFire=await page.evaluate(()=>({state:window.__contexts[0].state,status:document.getElementById('pause').textContent}));
 await page.keyboard.press('p');await page.keyboard.press('p');
 await page.waitForFunction(()=>window.__contexts[0].state==='running');
 const afterResume=await page.evaluate(()=>({contexts:window.__contexts.length,state:window.__contexts[0].state}));
 const report={candidate:'0.24.2-dev.1',browser:browser.version(),method:'Local headless Edge. The probe calls AudioContext.suspend() to simulate an interruption. It uses real Space and P keys after that call. No audible-output review.',before,afterFire,afterResume,errors};
 await writeFile(join(out,'audio-lifecycle.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();server.kill();}
