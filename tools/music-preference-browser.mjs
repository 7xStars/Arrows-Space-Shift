import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {join,resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {DEFAULT_PREFERENCES,PREFS_KEY} from '../src/storage.js';

const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=resolve(import.meta.dirname,'..'),output=join(root,'reports/audio-recovery-017');
await mkdir(output,{recursive:true});
const channel=process.argv.includes('--chrome')?'chrome':'msedge';
const report={channel,checks:[],errors:[],method:'Isolated browser with saved sound and music disabled. Normal game-start input, normal audio policy, and native post-master PCM observation. No speaker click or URL option.'};
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});let browser;
try{
  const url=await new Promise((accept,reject)=>{
    let text='';const timer=setTimeout(()=>reject(Error('Server timeout')),10000);
    server.stdout.on('data',chunk=>{text+=chunk;const match=text.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);accept(match[0]);}});
    server.on('error',reject);
  });
  browser=await chromium.launch({channel,headless:true,ignoreDefaultArgs:['--autoplay-policy=no-user-gesture-required']});
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  await context.addInitScript(({key,prefs})=>{
    if(!sessionStorage.getItem('music-test-seeded')){localStorage.setItem(key,JSON.stringify({...prefs,version:1,sound:false,music:false,volume:0,musicVolume:0,reducedMotion:true}));sessionStorage.setItem('music-test-seeded','1');}
    const Native=window.AudioContext;window.__musicContexts=[];
    window.AudioContext=class extends Native{
      constructor(...args){super(...args);window.__musicContexts.push(this);}
      createGain(){const gain=super.createGain();if(!this.__probe){
        this.__probe=super.createAnalyser();this.__probe.fftSize=2048;
        const sink=super.createGain();sink.gain.value=0;gain.connect(this.__probe);this.__probe.connect(sink);sink.connect(this.destination);
      }return gain;}
    };
  },{key:PREFS_KEY,prefs:DEFAULT_PREFERENCES});
  const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
  const check=(name,value)=>{assert.ok(value,name);report.checks.push(name);};
  const ready=()=>page.waitForFunction(()=>window.arrowSpaceShift?.assets().ready);
  const prefs=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PREFS_KEY);
  async function playing(){
    if(await page.evaluate(()=>window.arrowSpaceShift.audio().contextState!=='running')){
      await page.locator('#primary').click();report.usedNormalStartAction=true;
    }
    await page.waitForFunction(()=>window.arrowSpaceShift.audio().recorded.state==='playing');
  }
  async function signal(){return page.evaluate(async()=>{
    const probe=window.__musicContexts[0].__probe,buffer=new Float32Array(probe.fftSize);let peak=0;
    for(let i=0;i<30;i++){probe.getFloatTimeDomainData(buffer);for(const value of buffer)peak=Math.max(peak,Math.abs(value));await new Promise(r=>setTimeout(r,40));}
    return peak;
  });}
  await page.goto(url);await ready();
  report.titleLayout=[];
  for(const [width,height,dir]of [[1280,900,'ltr'],[390,844,'ltr'],[320,568,'ltr'],[640,450,'ltr'],[320,568,'rtl']]){
    await page.setViewportSize({width,height});await page.evaluate(value=>document.documentElement.dir=value,dir);
    const box=await page.evaluate(()=>{
      const node=document.querySelector('.menu-kicker'),parent=document.querySelector('.brief'),a=node.getBoundingClientRect(),b=parent.getBoundingClientRect();
      const range=document.createRange();range.selectNodeContents(node);const text=range.getBoundingClientRect();
      return {offset:Math.abs((a.left+a.right-b.left-b.right)/2),textOffset:Math.abs((text.left+text.right-b.left-b.right)/2),fits:a.left>=b.left-1&&a.right<=b.right+1};
    });
    report.titleLayout.push({width,height,dir,...box});
    check(`Title line is centered at ${width} by ${height} ${dir}`,box.offset<1.5&&box.textOffset<2&&box.fits);
    if(width===1280)await page.screenshot({path:join(output,`title-centered-${channel}.png`)});
  }
  await page.setViewportSize({width:1280,height:900});await page.evaluate(()=>document.documentElement.dir='ltr');
  const launched=await prefs();
  check('Plain URL enables sound and music',launched.sound===true&&launched.music===true);
  check('Launch restores nonzero music levels and preserves reduced motion',launched.volume===.5&&launched.musicVolume===.55&&launched.reducedMotion===true);
  check('Speaker starts enabled',await page.locator('#sound-toggle').getAttribute('aria-pressed')==='true');
  await playing();
  report.plainUrlPeak=await signal();check('Normal game start produces music without a speaker click',report.plainUrlPeak>1e-4);
  await page.screenshot({path:join(output,'plain-url-music.png')});
  await page.locator('#sound-toggle').click();
  check('The player can still mute during play',(await prefs()).sound===false);
  await page.reload();await ready();await playing();
  check('The next launch enables audio again',(await prefs()).sound===true&&(await prefs()).music===true);
  report.reloadPeak=await signal();check('Plain reload produces music',report.reloadPeak>1e-4);
  check('No page exception occurred',report.errors.length===0);
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{if(browser)await browser.close();server.kill();await writeFile(join(output,`browser-results-${channel}.json`),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
