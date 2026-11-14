import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}
catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=resolve(import.meta.dirname,'..');
const pageURL=process.argv[2]||'https://noodl-exe.itch.io/arrows-space-shift';
const output=resolve(process.argv[3]||'G:/Music Projects/Arrow Space Shift/reports/itch-page-live-dev5');
const metadataOnly=process.argv.includes('--metadata-only');
await mkdir(output,{recursive:true});
const mediaRoot=join(root,'art/marketing/game-off-2026');
const media=JSON.parse(await readFile(join(mediaRoot,'media-manifest.json'),'utf8'));
const expectedDescription=await readFile(join(mediaRoot,'itch-description.html'),'utf8');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const report={pageURL,candidate:media.candidate,startedUTC:new Date().toISOString(),
  method:'Public anonymous HTTP and an isolated browser. No signed-in cookie or editor control is used. The browser strips outgoing Cookie headers. Local game actions affect only the isolated profile.',
  checks:[],assets:[],signals:[],errors:[],failedGameAssets:[],failure:null};
const check=(name,value)=>{assert.ok(value,name);report.checks.push(name);console.log('PASS '+name);};
const normalize=text=>text.replace(/\s+/g,' ').trim();
async function publicBytes(url){
  const response=await fetch(url,{headers:{'user-agent':'Mozilla/5.0','cache-control':'no-cache'}});
  if(!response.ok)throw Error(`Public HTTP ${response.status}: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}
async function imageRecord(kind,url,expected){
  const bytes=await publicBytes(url);
  check(`${kind} is a PNG`,bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
  const record={kind,url,bytes:bytes.length,sha256:sha(bytes),width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),expected:expected?.file||null};
  report.assets.push(record);await writeFile(join(output,`${kind.replace(/[^a-z0-9-]/gi,'-')}.png`),bytes);
  return record;
}
let browser,page,game;
async function sample(label,seconds=1){
  const rows=await game.evaluate(async seconds=>{
    const context=window.__itchAudioContexts[0],names=['master','music','effects','ambience','core','atmosphere'];
    if(!context)return [];
    const rows=context.__itchAnalysers.map((analyser,i)=>({name:names[i],peak:0,rmsMax:0,frames:0,buffer:new Float32Array(analyser.fftSize)}));
    const end=performance.now()+seconds*1000;
    while(performance.now()<end){
      rows.forEach((row,i)=>{context.__itchAnalysers[i].getFloatTimeDomainData(row.buffer);let energy=0;
        for(const value of row.buffer){row.peak=Math.max(row.peak,Math.abs(value));energy+=value*value;}
        row.rmsMax=Math.max(row.rmsMax,Math.sqrt(energy/row.buffer.length));row.frames++;
      });await new Promise(resolve=>setTimeout(resolve,25));
    }
    return rows.map(({buffer,...row})=>row);
  },seconds);
  report.signals.push({label,rows});return Object.fromEntries(rows.map(row=>[row.name,row]));
}
try{
  browser=await chromium.launch({channel:'msedge',headless:true,ignoreDefaultArgs:['--autoplay-policy=no-user-gesture-required']});
  report.browser=browser.version();
  const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
  await context.route('**/*',route=>{const headers={...route.request().headers()};delete headers.cookie;return route.continue({headers});});
  await context.addInitScript(()=>{
    const Native=window.AudioContext||window.webkitAudioContext;window.__itchAudioContexts=[];
    if(Native){const connect=AudioNode.prototype.connect;
      window.AudioContext=class extends Native{
        constructor(...args){super(...args);this.__itchGainCount=0;this.__itchAnalysers=[];window.__itchAudioContexts.push(this);}
        createGain(){
          const gain=super.createGain(),index=this.__itchGainCount++;
          if(index<6){const analyser=super.createAnalyser(),sink=super.createGain();analyser.fftSize=2048;sink.gain.value=0;
            connect.call(gain,analyser);connect.call(analyser,sink);connect.call(sink,this.destination);this.__itchAnalysers.push(analyser);}
          return gain;
        }
      };
    }
  });
  page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',error=>report.errors.push(error.message));
  page.on('response',response=>{if(/^https:\/\/(?:html-classic|html)\.itch\.zone\/html\//.test(response.url())&&response.status()>=400)report.failedGameAssets.push({url:response.url(),status:response.status()});});
  const response=await page.goto(pageURL,{waitUntil:'domcontentloaded'});check('The public page responds successfully',response?.status()===200);
  const html=await response.text();await writeFile(join(output,'public-page.html'),html);
  const details=await page.evaluate(()=>({
    title:document.title,cover:document.querySelector('meta[property="og:image"]')?.content,
    screenshots:[...document.querySelectorAll('a[data-image_lightbox] img[data-screenshot_id]')].map(image=>({id:image.dataset.screenshot_id,url:image.closest('a').href})),
    description:document.querySelector('.formatted_description')?.innerText||'',theme:document.querySelector('#game_theme')?.textContent||'',
    iframe:document.querySelector('iframe#game_drop')?.src||null,
  }));
  report.page=details;
  check('The page contains exactly five gallery screenshots',details.screenshots.length===5);
  const cover=await imageRecord('cover',details.cover,{file:'cover-630x500.png'});
  check('The cover is 630 by 500',cover.width===630&&cover.height===500);
  check('The live cover matches the selected PNG bytes',cover.sha256===media.cover.files['cover-630x500.png'].sha256);
  const hashes=[];
  for(let i=0;i<details.screenshots.length;i++){
    const item=details.screenshots[i],expected=media.screenshots[i],actual=await imageRecord(`screenshot-${i+1}`,item.url,expected);
    hashes.push(actual.sha256);
    check(`Gallery image ${i+1} has the selected 1280 by 800 dimensions`,actual.width===1280&&actual.height===800);
    check(`Gallery image ${i+1} matches its selected native capture`,actual.sha256===expected.sha256);
  }
  check('All five selected captures are distinct',new Set(hashes).size===5);
  const expectedText=await page.evaluate(source=>{const node=document.createElement('div');node.innerHTML=source.replace(/<\/(p|h2|li)>/g,'</$1> ');return node.textContent;},expectedDescription);
  check('The public description matches the selected text',normalize(details.description)===normalize(expectedText));
  for(const [name,color] of Object.entries({background:'#070a10',panel:'#101418',text:'#f3e8d0',links:'#80b7dc',headings:'#c8a573',buttons:'#78502e'}))
    check(`The theme retains the selected ${name} color`,details.theme.toLowerCase().includes(color)||name==='panel'&&/rgba\(16,\s*20,\s*24,\s*1\)/i.test(details.theme));
  const background=details.theme.match(/background-image:\s*url\(([^)]+)\)/)?.[1];
  check('The page uses the selected title-art background',Boolean(background));
  const bg=await imageRecord('theme-background',background.replace(/^['"]|['"]$/g,''));
  check('The page background matches the existing realm artwork',bg.sha256===media.cover.source_sha256);
  await page.screenshot({path:join(output,'public-desktop.png'),fullPage:true});

  if(!metadataOnly){
    const run=page.locator('.load_iframe_btn');if(await run.count()&&await run.first().isVisible())await run.first().click();
    await page.waitForFunction(()=>document.querySelector('iframe#game_drop')?.src);
    report.iframeURL=await page.locator('iframe#game_drop').getAttribute('src');
    check('The game uses a public itch HTML iframe',/^https:\/\/(?:html-classic|html)\.itch\.zone\/html\//.test(report.iframeURL));
    const frameElement=await page.locator('iframe#game_drop').elementHandle();
    game=await frameElement.contentFrame();
    if(!game||!game.evaluate)throw Error('The game iframe did not expose its native frame.');
    await game.waitForFunction(()=>window.arrowSpaceShift?.assets().ready);
    report.hostedBuild=await game.evaluate(async()=>{const {BUILD,isActAvailable}=await import('./src/build.js');return {build:BUILD,actFourAvailable:isActAvailable(4),caption:document.querySelector('.build')?.textContent,viewport:{width:innerWidth,height:innerHeight}};});
    check('The hosted runtime is v0.25.1-dev.5',report.hostedBuild.build.version==='0.25.1-dev.5');
    check('The hosted runtime is the three-Act edition',report.hostedBuild.build.maxAct===3&&report.hostedBuild.build.postJamContent===false&&!report.hostedBuild.actFourAvailable);
    const buildBytes=await publicBytes(new URL('src/build.js',report.iframeURL).href);
    check('The hosted build module matches the local candidate',sha(buildBytes)===sha(await readFile(join(root,'src/build.js'))));
    check('The old title text control is absent',await game.locator('#title-music').count()===0);
    const initial=await game.evaluate(()=>window.arrowSpaceShift.audio());report.initialAudio=initial;
    if(initial.contextState!=='running'){await game.locator('#sound-toggle').click();report.enableClick=true;}else report.enableClick=false;
    await game.waitForFunction(()=>window.arrowSpaceShift.audio().recorded.state==='playing');
    check('The hosted title recording starts on its native clock',await game.evaluate(()=>window.arrowSpaceShift.audio().recorded.trackId==='identified-return-r9'&&window.arrowSpaceShift.audio().recorded.activeSources===1));
    const title=await sample('Hosted title',2);check('The hosted title has a nonzero post-master signal',title.master?.rmsMax>1e-4);
    await game.locator('#primary').click();
    await game.waitForFunction(()=>window.arrowSpaceShift.read().phase==='running'&&window.arrowSpaceShift.audio().recorded.trackId==='act1-03'&&window.arrowSpaceShift.audio().recorded.state==='playing');
    const campaign=await sample('Hosted campaign',2);check('The hosted campaign has a nonzero post-master signal',campaign.master?.rmsMax>1e-4);
    for(const [key,ms] of [['ArrowLeft',200],['ArrowRight',400]]){await page.keyboard.down(key);await page.waitForTimeout(ms);await page.keyboard.up(key);}
    await game.waitForFunction(()=>window.arrowSpaceShift.read().campaign.lesson==='shoot');
    await page.keyboard.down('Space');const fire=await sample('Hosted manual firing',1.2);await page.keyboard.up('Space');
    check('Manual Space firing produces a hosted effects signal',fire.effects?.rmsMax>1e-4);
    await page.keyboard.press('p');await game.waitForFunction(()=>window.arrowSpaceShift.read().phase==='paused'&&window.arrowSpaceShift.audio().recorded.activeSources===0);
    const paused=await game.evaluate(()=>window.arrowSpaceShift.audio().recorded.offset);
    check('Pause stops the hosted music sources',true);
    await page.keyboard.press('p');await game.waitForFunction(()=>window.arrowSpaceShift.audio().recorded.state==='playing');
    const resumed=await game.evaluate(()=>window.arrowSpaceShift.audio().recorded.offset);
    check('Resume retains the hosted recording position',resumed>=paused&&resumed<paused+1);
    await game.locator('#sound-toggle').click();await page.waitForTimeout(500);
    const muted=await sample('Hosted mute',.5);check('The hosted speaker mute produces a zero master signal',muted.master?.peak<1e-7);
    await game.locator('#sound-toggle').click();await game.waitForFunction(()=>window.arrowSpaceShift.audio().recorded.state==='playing');
    const enabled=await sample('Hosted enable',1);check('The hosted speaker restores the music signal',enabled.master?.rmsMax>1e-4);
    check('One native audio context serves hosted title and gameplay',await game.evaluate(()=>window.__itchAudioContexts.length===1));
    for(const name of ['hyperbolic-act.html','repair-dock.html']){
      const hidden=await fetch(new URL(name,report.iframeURL));
      check(`The hosted edition omits ${name}`,[403,404].includes(hidden.status));
    }
    check('The hosted game has no visible later-Act entry',await game.locator('#continue-act4').isHidden());
    await page.screenshot({path:join(output,'hosted-game.png'),fullPage:true});
    check('The hosted active game assets loaded',report.failedGameAssets.length===0);
  }
  await page.setViewportSize({width:390,height:844});
  report.narrowLayout=await page.evaluate(()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth}));
  await page.screenshot({path:join(output,'public-narrow.png'),fullPage:true});
  check('No browser exception occurred',report.errors.length===0);
}catch(error){report.failure=error.stack||String(error);process.exitCode=1;if(page)await page.screenshot({path:join(output,'failure.png'),fullPage:true}).catch(()=>{});}
finally{
  report.completedUTC=new Date().toISOString();
  report.limits='Public metadata and native browser signals are measured. Audio signals stop before hardware output. Headless output does not establish human hearing, physical-device performance, full hosted play, or player comprehension. No editor action, signed-in cookie, comment, or account setting is used.';
  await browser?.close();await writeFile(join(output,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({checks:report.checks.length,failure:report.failure,output},null,2));
}
