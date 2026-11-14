import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';

const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}
catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=resolve(process.argv[2]||resolve(import.meta.dirname,'..'));
const output=resolve(process.argv[3]||join(root,'reports/title-speaker-dev4/browser'));
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
const browsers=[],pages=[];
const report={root,candidate:JSON.parse(await readFile(join(root,'package.json'),'utf8')).version,
  method:'Isolated headless Edge. Real keyboard and pointer input. Native Web Audio is observed. A Level 1 checkpoint is earned through normal training. Browser policies are tested in separate processes.',
  policyReference:'https://developer.chrome.com/blog/autoplay',results:[],errors:[],missingAssets:[],states:{},failure:null};
for(const name of ['src/app.js','src/interface.js','src/audio.js','style.css'])
  (report.sourceHashes??={})[name]=createHash('sha256').update(await readFile(join(root,name))).digest('hex');
const check=(name,value)=>{assert.ok(value,name);report.results.push(name);};
const state=page=>page.evaluate(()=>{
  const button=document.getElementById('sound-toggle');
  return {flight:window.arrowSpaceShift.read(),audio:window.arrowSpaceShift.audio(),
    contextCount:window.__titleContexts.length,resumeCalls:window.__titleResumeCalls,
    speaker:{exists:Boolean(button),label:button?.getAttribute('aria-label'),pressed:button?.getAttribute('aria-pressed'),state:button?.dataset.audioState},
    checkpoint:localStorage.getItem('arrow-space-shift:checkpoint:v1'),preferences:localStorage.getItem('arrow-space-shift:preferences:v1')};
});
const waitTitle=page=>page.waitForFunction(()=>{
  const audio=window.arrowSpaceShift.audio();return audio.recorded.trackId==='identified-return-r9'&&audio.recorded.state==='playing'&&audio.recorded.activeSources===1&&document.getElementById('sound-toggle')?.getAttribute('aria-pressed')==='true';
});
async function openBrowser(policy='default'){
  const args=policy==='default'?[]:[`--autoplay-policy=${policy}`, ...(policy==='document-user-activation-required'?['--disable-features=PreloadMediaEngagementData,MediaEngagementBypassAutoplayPolicies']:[])];
  const browser=await chromium.launch({channel:'msedge',headless:true,args,
    ...(policy==='default'?{ignoreDefaultArgs:['--autoplay-policy=no-user-gesture-required']}:{} )});browsers.push(browser);
  const session=await browser.newBrowserCDPSession();
  const command=await session.send('Browser.getBrowserCommandLine').catch(error=>({inspectionLimit:error.message}));await session.detach();
  (report.browserPolicies??=[]).push({policy,requestedArgs:args,actualAutoplayArgs:command.arguments?.filter(value=>value.startsWith('--autoplay-policy=')),inspectionLimit:command.inspectionLimit});
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  await context.addInitScript(()=>{
    const Native=window.AudioContext||window.webkitAudioContext;window.__titleContexts=[];window.__titleResumeCalls=0;
    if(Native)window.AudioContext=class extends Native{
      constructor(...args){super(...args);window.__titleContexts.push(this);}
      resume(){window.__titleResumeCalls++;return super.resume();}
    };
  });
  const page=await context.newPage();pages.push(page);page.setDefaultTimeout(12000);
  page.on('pageerror',error=>report.errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)report.missingAssets.push({url:response.url(),status:response.status()});});
  return {browser,context,page};
}
async function entry(page,url){
  await page.goto(url);await page.waitForFunction(()=>window.arrowSpaceShift?.assets().ready);
  await page.waitForFunction(()=>window.arrowSpaceShift.audio().contextState!=='uninitialized');
  await page.waitForTimeout(180);
}
async function speakerLayout(page,label){
  await page.waitForTimeout(180);
  const layout=await page.evaluate(()=>{
    const button=document.getElementById('sound-toggle'),r=button.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
    const launch=document.getElementById('primary').getBoundingClientRect();
    return {button:{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom},inside:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,
      uncovered:hit===button||button.contains(hit),bottomLeft:r.left<=32&&innerHeight-r.bottom<=32,
      noLaunchOverlap:r.right<=launch.left||r.left>=launch.right||r.bottom<=launch.top||r.top>=launch.bottom,
      semantic:button.tagName==='BUTTON'&&button.type==='button'&&button.querySelector('svg')?.getAttribute('aria-hidden')==='true',
      noOldText:!document.getElementById('title-music')&&!/title music (on|off)/i.test(button.textContent),scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth};
  });
  (report.layouts??={})[label]=layout;
  check(`${label}: speaker target is at least 44 pixels`,layout.button.width>=44&&layout.button.height>=44);
  check(`${label}: speaker fits the lower-left corner without covering launch`,layout.inside&&layout.uncovered&&layout.bottomLeft&&layout.noLaunchOverlap);
  check(`${label}: native icon control replaces the old title text button`,layout.semantic&&layout.noOldText);
}
async function flightControlLayout(page,label){
  await page.waitForTimeout(180);
  const layout=await page.evaluate(()=>{
    const speaker=document.getElementById('sound-toggle').getBoundingClientRect();
    return [...document.querySelectorAll('.flight-controls button')].filter(button=>!button.hidden).map(button=>{
      const r=button.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      const contentFits=[...button.querySelectorAll('span,kbd')].every(node=>{const range=document.createRange();range.selectNodeContents(node);return [...range.getClientRects()].every(text=>text.left>=r.left-1&&text.right<=r.right+1&&text.top>=r.top-1&&text.bottom<=r.bottom+1);});
      return {id:button.id,label:button.textContent,width:r.width,height:r.height,contentFits,scrollFits:button.scrollWidth<=button.clientWidth&&[...button.querySelectorAll('kbd')].every(node=>node.scrollWidth<=node.clientWidth),inside:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,
        separate:r.right<=speaker.left||r.left>=speaker.right||r.bottom<=speaker.top||r.top>=speaker.bottom,
        uncovered:hit===button||button.contains(hit)};
    });
  });
  (report.flightLayouts??={})[label]=layout;
  check(`${label}: visible flight controls stay clear of the speaker`,layout.length>=2&&layout.every(item=>item.inside&&item.separate&&item.uncovered));
  check(`${label}: control labels fit usable targets`,layout.every(item=>item.width>=24&&item.height>=44&&item.contentFits&&item.scrollFits));
}
async function echoPanelLayout(page){
  const layout=await page.evaluate(()=>{
    const speaker=document.getElementById('sound-toggle').getBoundingClientRect(),bar=document.querySelector('.flight-controls').getBoundingClientRect();
    const separate=(a,b)=>a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom;
    return ['echo-counter','echo-build'].map(id=>{
      const element=document.getElementById(id),range=document.createRange();range.selectNodeContents(element);
      const rows=[...range.getClientRects()].filter(r=>r.width&&r.height).map(r=>({x:r.x,y:r.y,width:r.width,height:r.height,
        inside:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,separate:separate(r,speaker)&&separate(r,bar)}));
      return {id,text:element.textContent,rows};
    });
  });report.echoLayout=layout;
  check('Act III echo count and build remain visible above the controls',layout.every(item=>item.rows.length>0&&item.rows.every(row=>row.inside&&row.separate)));
}
async function train(page){
  await page.locator('#primary').click();
  for(const [key,duration] of [['ArrowLeft',200],['ArrowRight',400]]){
    await page.keyboard.down(key);await page.waitForTimeout(duration);await page.keyboard.up(key);
  }
  await page.waitForFunction(()=>window.arrowSpaceShift.read().campaign.lesson==='shoot');
  await page.keyboard.down('Space');await page.waitForTimeout(160);await page.keyboard.up('Space');
  await page.waitForFunction(()=>window.arrowSpaceShift.read().campaign.lesson==='fold');
  await page.keyboard.press('ShiftLeft');await page.keyboard.press('ShiftRight');
  const x=await page.evaluate(()=>window.arrowSpaceShift.read().x);
  if(Math.abs(x)>2){const key=x>0?'ArrowLeft':'ArrowRight';await page.keyboard.down(key);await page.waitForTimeout(Math.abs(x)/360*1000);await page.keyboard.up(key);}
  await page.keyboard.down('Space');await page.waitForFunction(()=>window.arrowSpaceShift.read().campaign.index===0,{},{timeout:14000});await page.keyboard.up('Space');
}
try{
  const url=await new Promise((accept,reject)=>{
    let text='';const timer=setTimeout(()=>reject(Error('Server startup timed out.')),10000);
    server.once('error',reject);server.stdout.on('data',data=>{text+=data;const match=text.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);accept(match[0]);}});
  });report.url=url;

  const normal=await openBrowser();report.defaultBrowserVersion=normal.browser.version();await entry(normal.page,url);
  report.states.defaultAttempt=await state(normal.page);
  check('Default policy receives one automatic title request before input',report.states.defaultAttempt.contextCount===1);
  if(report.states.defaultAttempt.audio.contextState!=='running'){
    check('Blocked default policy shows an enabled speaker action',report.states.defaultAttempt.speaker.label==='Enable sound'&&report.states.defaultAttempt.speaker.pressed==='false');
    await normal.page.locator('#sound-toggle').click();report.defaultEnableClicks=1;
  }else report.defaultEnableClicks=0;
  await waitTitle(normal.page);
  check('Default policy plays after at most one speaker click',(await state(normal.page)).contextCount===1);
  await normal.page.screenshot({path:join(output,'default-title.png')});
  if(!report.defaultEnableClicks)report.defaultFallbackLimit='Default Edge permitted automatic playback. The separate strict-policy process checks blocking.';
  await normal.context.close();

  const strict=await openBrowser('document-user-activation-required');await entry(strict.page,url);
  const blocked=await state(strict.page);report.states.strictAttempt=blocked;
  check('Strict policy leaves native audio suspended before input',blocked.audio.contextState==='suspended'&&blocked.contextCount===1&&(blocked.audio.recorded.activeSources||0)===0);
  check('Blocked speaker has an accessible Enable sound action',blocked.speaker.label==='Enable sound'&&blocked.speaker.pressed==='false');
  await strict.page.locator('#sound-toggle').click();await waitTitle(strict.page);
  const enabled=await state(strict.page);
  check('First blocked speaker click enables sound instead of muting it',enabled.speaker.pressed==='true'&&enabled.speaker.label==='Mute sound'&&JSON.parse(enabled.preferences).sound===true);
  check('Blocked startup recovers with the same native context',enabled.contextCount===1&&enabled.audio.recorded.activeSources===1);
  await strict.context.close();

  const keyboard=await openBrowser('document-user-activation-required');await entry(keyboard.page,url);await keyboard.page.keyboard.press('a');await waitTitle(keyboard.page);
  check('First ordinary key starts blocked title audio without launching the game',(await state(keyboard.page)).flight.phase==='ready'&&(await state(keyboard.page)).contextCount===1);
  await keyboard.context.close();

  const delayedArt=await openBrowser('no-user-gesture-required');
  let releaseArt;const artGate=new Promise(accept=>{releaseArt=accept;});
  await delayedArt.page.route('**/assets/crossing/*.png',async route=>{await artGate;await route.continue().catch(()=>{});});
  await delayedArt.page.goto(url,{waitUntil:'domcontentloaded'});await waitTitle(delayedArt.page);
  check('Title playback does not wait for the sprite atlas',!await delayedArt.page.evaluate(()=>window.arrowSpaceShift.assets().ready));
  releaseArt();await delayedArt.page.waitForFunction(()=>window.arrowSpaceShift.assets().ready);await delayedArt.context.close();

  const delayedMusic=await openBrowser('no-user-gesture-required');
  let releaseMusic;const musicGate=new Promise(accept=>{releaseMusic=accept;});
  await delayedMusic.page.route('**/stc-title-r9.ogg',async route=>{await musicGate;await route.continue().catch(()=>{});});
  await delayedMusic.page.goto(url,{waitUntil:'domcontentloaded'});
  await delayedMusic.page.waitForFunction(()=>document.getElementById('sound-toggle')?.getAttribute('aria-pressed')==='true');
  await delayedMusic.page.locator('#sound-toggle').click();releaseMusic();
  await delayedMusic.page.waitForFunction(()=>window.arrowSpaceShift.audio().recorded.pendingSegments===0);await delayedMusic.page.waitForTimeout(180);
  const cancelled=await state(delayedMusic.page);report.states.muteDuringLoad=cancelled;
  check('Mute cancels a title start while its recording loads',cancelled.audio.recorded.activeSources===0&&JSON.parse(cancelled.preferences).sound===false&&cancelled.speaker.pressed==='false');
  await delayedMusic.context.close();

  const allowed=await openBrowser('no-user-gesture-required');report.permittedBrowserVersion=allowed.browser.version();const page=allowed.page;
  await entry(page,url);await waitTitle(page);
  const auto=await state(page);report.states.permittedEntry=auto;
  check('Permitted-policy entry starts the title before a click',auto.contextCount===1&&auto.audio.recorded.activeSources===1&&auto.speaker.pressed==='true');
  check('Normal entry has no QA controls',await page.evaluate(()=>!window.arrowSpaceShiftTest));
  await page.keyboard.press('Tab');await page.waitForTimeout(100);
  check('Tab navigation does not change sound preference',JSON.parse((await state(page)).preferences).sound===true);
  await speakerLayout(page,'Desktop title');
  await page.locator('#sound-toggle').focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>window.arrowSpaceShift.audio().recorded.activeSources===0);
  check('Enter mutes sound and saves the preference',JSON.parse((await state(page)).preferences).sound===false&&(await state(page)).speaker.pressed==='false');
  await page.keyboard.press('Space');await waitTitle(page);
  check('Space restores title playback with one context',(await state(page)).speaker.pressed==='true'&&(await state(page)).contextCount===1);
  const focus=await page.locator('#sound-toggle').evaluate(node=>({visible:node.matches(':focus-visible'),width:parseFloat(getComputedStyle(node).outlineWidth),style:getComputedStyle(node).outlineStyle}));
  check('Keyboard focus has a visible indicator',focus.visible&&focus.width>=2&&focus.style!=='none');
  await train(page);
  await page.waitForFunction(()=>window.arrowSpaceShift.audio().recorded.trackId==='act1-03'&&window.arrowSpaceShift.audio().recorded.state==='playing');
  const earned=await state(page);report.states.earnedCheckpoint=earned;
  check('Real training controls earn the Level 1 checkpoint',earned.flight.campaign.index===0&&JSON.parse(earned.checkpoint).chapterIndex===0);
  check('Launch replaces the title with one campaign pair',earned.audio.recorded.trackId==='act1-03'&&earned.contextCount===1&&earned.audio.recorded.activeSources===2);
  await page.reload();await page.waitForFunction(()=>window.arrowSpaceShift?.assets().ready);await waitTitle(page);
  const restored=await state(page);report.states.restoredEntry=restored;
  check('Permitted-policy saved entry starts title automatically',restored.flight.phase==='paused'&&restored.audio.recorded.trackId==='identified-return-r9'&&restored.contextCount===1);
  check('Saved entry retains the earned checkpoint',restored.checkpoint===earned.checkpoint&&restored.flight.campaign.index===0&&restored.flight.runSeed===earned.flight.runSeed);
  await page.waitForTimeout(250);
  check('Title playback does not advance the saved section',await page.evaluate(time=>window.arrowSpaceShift.read().time===time,restored.flight.time));
  await page.setViewportSize({width:320,height:568});await speakerLayout(page,'320 by 568 saved entry');
  const noteLayout=await page.evaluate(()=>{
    const speaker=document.getElementById('sound-toggle').getBoundingClientRect(),note=document.getElementById('overlay-note');
    const tree=document.createTreeWalker(note,NodeFilter.SHOW_TEXT),rows=[];
    while(tree.nextNode()){
      const node=tree.currentNode;if(!node.textContent.trim())continue;
      const range=document.createRange();range.selectNodeContents(node);
      for(const r of range.getClientRects())if(r.width&&r.height)rows.push({x:r.x,y:r.y,width:r.width,height:r.height,inside:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,
        separate:r.right<=speaker.left||r.left>=speaker.right||r.bottom<=speaker.top||r.top>=speaker.bottom});
    }
    return rows;
  });report.savedEntryHintLayout=noteLayout;
  check('The lower-left speaker does not cover saved-entry instructions',noteLayout.length>0&&noteLayout.every(row=>row.separate));
  check('Saved-entry instructions stay inside the narrow viewport',noteLayout.every(row=>row.inside));
  await page.screenshot({path:join(output,'saved-entry-320x568.png'),fullPage:true});
  await page.locator('#sound-toggle').click();await page.waitForFunction(()=>window.arrowSpaceShift.audio().recorded.activeSources===0);await page.waitForTimeout(200);
  check('Speaker mute keeps the saved entry quiet and preserves its checkpoint',(await state(page)).checkpoint===earned.checkpoint&&(await state(page)).audio.recorded.activeSources===0);
  await page.locator('#sound-toggle').click();await waitTitle(page);
  await page.locator('#primary').click();await page.waitForFunction(()=>window.arrowSpaceShift.read().phase==='running'&&window.arrowSpaceShift.audio().recorded.trackId==='act1-03'&&window.arrowSpaceShift.audio().recorded.state==='playing');
  check('Resume keeps Level 1 and reuses the context',(await state(page)).flight.campaign.index===0&&(await state(page)).contextCount===1);
  await flightControlLayout(page,'320 by 568 Act I flight');
  await page.keyboard.press('p');await page.waitForFunction(()=>window.arrowSpaceShift.read().phase==='paused'&&window.arrowSpaceShift.audio().recorded.activeSources===0);
  const paused=await state(page);await page.waitForTimeout(200);
  check('Manual pause stays silent while the sound control remains available',await page.evaluate(time=>window.arrowSpaceShift.read().time===time&&!document.getElementById('sound-toggle').hidden&&window.arrowSpaceShift.audio().recorded.activeSources===0,paused.flight.time));
  await page.setViewportSize({width:1280,height:900});await page.getByRole('button',{name:'Options',exact:true}).click();
  await page.locator('#sound').click();await page.keyboard.press('Escape');
  check('Options mute synchronizes the speaker state',(await state(page)).speaker.pressed==='false'&&JSON.parse((await state(page)).preferences).sound===false);
  await page.reload();await page.waitForFunction(()=>window.arrowSpaceShift?.assets().ready);await page.waitForTimeout(250);
  const muted=await state(page);report.states.savedMute=muted;
  check('Saved mute prevents automatic audio context creation',muted.contextCount===0&&(muted.audio.recorded.activeSources||0)===0&&muted.speaker.pressed==='false'&&muted.speaker.label==='Enable sound');
  check('Saved mute keeps the speaker available',await page.locator('#sound-toggle').isEnabled());
  check('Saved mute preserves the earned checkpoint',muted.checkpoint===earned.checkpoint&&muted.flight.campaign.index===0&&muted.flight.phase==='paused');
  await page.locator('#sound-toggle').click();await waitTitle(page);
  check('The saved-mute speaker can enable sound directly',(await state(page)).contextCount===1&&(await state(page)).speaker.pressed==='true');
  const layoutPage=await allowed.context.newPage();pages.push(layoutPage);
  await layoutPage.setViewportSize({width:320,height:568});await layoutPage.goto(url+'?qa=1');
  await layoutPage.waitForFunction(()=>window.arrowSpaceShiftTest&&window.arrowSpaceShift.assets().ready);
  await layoutPage.evaluate(()=>window.arrowSpaceShiftTest.loadChapterTrial(25));
  report.layoutFixture='The local QA entry selects Act III only for control geometry. It is not progression evidence.';
  await flightControlLayout(layoutPage,'320 by 568 Act III flight');
  await echoPanelLayout(layoutPage);
  await layoutPage.screenshot({path:join(output,'act3-controls-320x568.png'),fullPage:true});
  await layoutPage.close();
  check('No title-entry page exception or resource failure occurred',report.errors.length===0&&report.missingAssets.length===0);
}catch(error){report.failure=error.stack||error.message;const page=pages.at(-1);if(page&&!page.isClosed()){report.failureState=await state(page).catch(()=>null);await page.screenshot({path:join(output,'failure.png'),fullPage:true});}throw error;}
finally{
  report.checks=report.results.length;
  report.limits='Native Web Audio state and sources are observed. Permitted and strict policies run only in isolated test processes. Default policy is reported separately. These checks do not establish physical sound output, latency, screen-reader use, all-browser autoplay permission, or human understanding. The user browser and storage remain unchanged.';
  await writeFile(join(output,'results.json'),JSON.stringify(report,null,2)+'\n');
  for(const browser of browsers)await browser.close();server.kill();console.log(JSON.stringify({checks:report.checks,results:report.results,defaultEnableClicks:report.defaultEnableClicks,errors:report.errors,failure:report.failure},null,2));
}
