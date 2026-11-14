import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {resolve,join} from 'node:path';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';

const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}
catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const project=resolve(import.meta.dirname,'..'),root=resolve(process.argv[2]||project),
  output=resolve(process.argv[3]||join(project,'reports/stc-operator-lab-r1/browser-source'));
await mkdir(output,{recursive:true});
const results=[],errors=[],failedRequests=[],requests=[];
const report={revision:'stc-operator-lab-r1',root,results,errors,failedRequests,
  input:'Ordinary native controls and keyboard input, with read-only model records.',
  limits:'Local headless Microsoft Edge. No human recognition, listening approval, screen-reader, physical-device, physical audio latency, or performance result.'};
for(const file of ['operator-lab.html','src/operator-lab-app.js','src/operator-models.js','src/operator-registry.js']){
  report.sourceIdentity||={};report.sourceIdentity[file]=createHash('sha256').update(await readFile(join(root,file))).digest('hex');
}
const catalog=JSON.parse(await readFile(join(root,'assets/audio/stc-operator-lab-r1/catalog.json'),'utf8'));
const clip=id=>{const value=catalog.clips.find(item=>item.id===id);assert.ok(value,`No catalog clip ${id}`);return value;};
const check=(name,value)=>{assert.ok(value,name);results.push(name);};
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
let browser,url,page;
try{
  url=await new Promise((accept,reject)=>{let log='';const timer=setTimeout(()=>reject(new Error('The operator server did not start.')),10000);
    server.once('error',reject);server.stdout.on('data',chunk=>{log+=chunk;const match=log.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);accept(match[0]);}});});
  browser=await chromium.launch({headless:true,channel:'msedge'});report.browserVersion=browser.version();
  const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'no-preference'});
  await context.addInitScript(()=>{
    localStorage.setItem('arrow-space-shift:operator-fixture','retained');
    window.__operatorStorageBefore=JSON.stringify(Object.fromEntries(Object.entries(localStorage)));
    window.__operatorStorageWrites=[];
    for(const key of ['setItem','removeItem','clear']){
      const method=Storage.prototype[key];Storage.prototype[key]=function(...args){window.__operatorStorageWrites.push(key);return method.apply(this,args);};
    }
    window.__operatorMediaCalls=[];
    for(const key of ['play','pause']){
      const method=HTMLMediaElement.prototype[key];HTMLMediaElement.prototype[key]=function(...args){
        window.__operatorMediaCalls.push({method:key,src:this.currentSrc||this.src,time:this.currentTime});
        return method.apply(this,args);
      };
    }
  });
  page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)failedRequests.push({url:response.url(),status:response.status()});});
  page.on('request',request=>{if(/\.wav(?:\?|$)/i.test(request.url()))requests.push(request.url());});
  await page.goto(new URL('operator-lab.html',url).href);
  await page.waitForFunction(()=>{const value=window.arrowSpaceShiftOperatorLab?.read();return value?.audio.ready&&value.audio.analysisReady;});
  const read=()=>page.evaluate(()=>window.arrowSpaceShiftOperatorLab.read());
  const section=async id=>{
    await page.locator(`[data-panel="${id}"]`).focus();await page.keyboard.press('Enter');
    await page.waitForFunction(value=>window.arrowSpaceShiftOperatorLab.read().active===value,id);
  };
  let state=await read();
  check('Startup is muted and creates no automatic audio playback',state.active==='motion'&&state.audio.muted&&state.audio.paused&&requests.length===0&&
    !(await page.locator('#sound-enabled').isChecked())&&await page.locator('audio').count()===1);
  check('The laboratory retains ten explicitly scoped grammar families',state.revision==='stc-operator-lab-r1'&&state.grammarCount===10&&
    /no combat colliders or campaign rewards/.test(await page.locator('.note').first().innerText()));
  check('Response, Sound, and Reduced motion have native accessible names',await page.getByRole('combobox',{name:'Response',exact:true}).count()===1&&
    await page.getByRole('checkbox',{name:'Reduced motion',exact:true}).count()===1);
  const heavy=state.motion.metrics;
  await page.locator('#profile').selectOption('elastic');state=await read();
  check('Elastic response exposes its distinct measured overshoot',state.motion.profile==='elastic'&&state.motion.metrics.overshootRatio>.35&&state.motion.metrics.overshootRatio<.4&&
    state.motion.metrics.settlingTime<heavy.settlingTime&&/37\./.test(await page.locator('#motion-metrics').innerText()));
  await page.locator('#profile').selectOption('settled');state=await read();
  check('Settled response retains zero overshoot and a shorter measured settling interval',state.motion.metrics.overshoot===0&&state.motion.metrics.settlingTime<heavy.settlingTime);
  await page.locator('#motion-run').focus();await page.keyboard.press('Enter');await page.waitForTimeout(180);
  check('Keyboard input starts the response',(await read()).motion.running&&(await read()).motion.time>0);
  await page.keyboard.press('Space');state=await read();const pausedTime=state.motion.time;
  await page.waitForTimeout(100);
  check('The visible pause control retains the response time',!state.motion.running&&state.motion.time===pausedTime&&(await read()).motion.time===pausedTime);
  await page.locator('#reduced').check();await page.locator('#motion-reset').click();await page.locator('#motion-run').click();state=await read();
  check('Reduced motion shows the static result and retains the response samples',state.reducedMotion&&!state.motion.running&&state.motion.time===6&&
    await page.locator('#response-samples tr').count()===7&&/Static result/.test(await page.locator('#motion-state').innerText()));
  check('The coupled response states its measured transient peak and eventual decay',/2\.427 at step 2/.test(await page.locator('#transient-metrics').innerText())&&
    /spectral radius 0\.6/.test(await page.locator('#motion').innerText()));
  check('The operator-step axis label remains inside its chart',await page.locator('#transient-chart text').last().evaluate(element=>{
    const bounds=element.getBBox(),view=element.ownerSVGElement.viewBox.baseVal;return bounds.x>=view.x&&bounds.x+bounds.width<=view.x+view.width;
  }));
  const matrixDetails=page.locator('details').filter({has:page.locator('#matrix-case')});
  await matrixDetails.locator('summary').click();
  check('Matrix outputs stay hidden before the first prediction',/Make a prediction/.test(await page.locator('#matrix-result').innerText()));
  await page.locator('[data-matrix="same"]').focus();await page.keyboard.press('Enter');await page.locator('[data-matrix="different"]').click();
  state=await read();
  check('A repeated matrix answer cannot replace the first answer',state.records.find(record=>record.key==='matrix:a')?.choice==='same'&&
    state.records.find(record=>record.key==='matrix:a')?.correct===false&&/First choice: same/.test(await page.locator('#matrix-result').innerText()));
  await page.locator('#matrix-case').selectOption('b');
  check('The unfamiliar matrix input restores the prediction prompt',/Make a prediction/.test(await page.locator('#matrix-result').innerText()));
  await page.locator('[data-matrix="different"]').click();
  check('The matrix transfer uses a new input and retains its answer',(await read()).records.find(record=>record.key==='matrix:b')?.correct===true);
  await page.locator('#matrix-case').selectOption('c');await page.locator('[data-matrix="same"]').click();state=await read();
  const zero=state.records.find(record=>record.key==='matrix:c');
  check('Equal zero-input outputs do not imply that the operators commute',zero?.correct===true&&zero.expected==='same'&&
    zero.context.first.every(value=>value===0)&&zero.context.second.every(value=>value===0)&&/not.*commut|does not prove/i.test(await page.locator('#matrix-result').innerText()));
  report.matrixRecords=state.records.filter(record=>record.key.startsWith('matrix:'));
  await page.screenshot({path:join(output,'motion-desktop.png'),fullPage:true});
  await section('sound');
  check('Section navigation moves focus to the selected heading',await page.locator('#sound-heading').evaluate(element=>element===document.activeElement));
  await page.locator('#play-a').click();
  check('A muted Play request leaves the media stopped',(await read()).audio.paused&&requests.length===0&&/Select Sound/.test(await page.locator('#audio-status').innerText()));
  await page.locator('#sound-enabled').check();
  check('The Sound control updates both native mute and visible status',!(await read()).audio.muted&&!/Sound is off/i.test(await page.locator('#audio-status').innerText()));
  const soundRecords=[];
  for(const item of [{key:'gate',answer:'a'},{key:'transfer',answer:'b'},{key:'constant',answer:'a'},{key:'drive',answer:'b'}]){
    await page.locator('#sound-case').selectOption(item.key);
    check(`The ${item.key} case hides its order labels before prediction`,/Make a prediction/.test(await page.locator('#sound-result').innerText())&&
      await page.locator('#audio-order').innerText()===''&&await page.locator('#sound-disclosure').evaluate(element=>element.hidden));
    if(item.key==='constant')check('The constant-gain answer is not printed before the prediction',
      !/constant scalar gain commutes|constant gain commutes/i.test(await page.locator('#sound').innerText()));
    const ids=(await read()).audio.clipIds;
    for(const [index,id]of ids.entries()){
      await page.locator(index?'#play-b':'#play-a').click();
      await page.waitForFunction(()=>{const audio=document.querySelector('#sound-player');return !audio.paused&&audio.currentTime>.04;},null,{timeout:15000});
      const native=await page.locator('#sound-player').evaluate(element=>({src:element.currentSrc,duration:element.duration,currentTime:element.currentTime,paused:element.paused,muted:element.muted,readyState:element.readyState,networkState:element.networkState,error:element.error?.message||null}));
      report.currentAudioProbe={case:item.key,id,...native};
      assert.ok(native.src.endsWith('/'+clip(id).file));assert.ok(Number.isFinite(native.duration)&&native.duration>1&&!native.muted);
      soundRecords.push({case:item.key,id,...native});
      check(`Native result ${item.key} ${index?'B':'A'} starts the catalog file`,!native.paused&&await page.locator('audio').count()===1);
    }
    check(`Listening to ${item.key} does not disclose its order labels`,/Make a prediction/.test(await page.locator('#sound-result').innerText())&&
      await page.locator('#audio-order').innerText()==='');
    await page.locator(`[data-sound="${item.key==='gate'?'b':item.answer}"]`).click();
    if(item.key==='gate')await page.locator('[data-sound="a"]').click();
    state=await read();const record=state.records.find(value=>value.key===`sound:${item.key}`);
    check(`The ${item.key} audio comparison retains the first prediction`,record?.choice===(item.key==='gate'?'b':item.answer)&&record.expected===item.answer&&
      !/Make a prediction/.test(await page.locator('#sound-result').innerText())&&!(await page.locator('#sound-disclosure').evaluate(element=>element.hidden)));
    check(`The ${item.key} disclosure shows only its applicable chart`,await page.locator('#gate-chart').isVisible()===(item.key!=='drive'));
  }
  report.soundRecords=soundRecords;
  await page.locator('#sound-enabled').uncheck();
  check('Muting stops playback and updates the native media state',(await read()).audio.muted&&(await read()).audio.paused&&/Sound is off/.test(await page.locator('#audio-status').innerText()));
  await page.locator('#sound-enabled').check();await page.locator('#play-a').click();await page.waitForFunction(()=>!window.arrowSpaceShiftOperatorLab.read().audio.paused);
  await section('space');state=await read();
  check('Section replacement pauses and rewinds the one media element',state.audio.paused&&await page.locator('#sound-player').evaluate(element=>element.currentTime===0));
  await section('sound');
  check('The audio status remains correct after returning to the Sound section',!/Playing result/.test(await page.locator('#audio-status').innerText()));
  await page.screenshot({path:join(output,'sound-desktop.png'),fullPage:true});
  await section('space');await page.locator('#reduced').uncheck();
  check('Space forecasts stay hidden until a prediction',!(await read()).space.revealed&&await page.locator('#space-run').isDisabled()&&
    await page.locator('#space-chart circle[fill="none"]').count()===0);
  await page.locator('#space-second').click();await page.locator('#space-first').click();state=await read();
  check('The first space prediction remains retained after a second choice',state.records.find(record=>record.key==='space:klein:a')?.choice==='second'&&
    state.records.find(record=>record.key==='space:klein:a')?.correct===false);
  check('The forecast uses a hollow mark after prediction',state.space.revealed&&!(await page.locator('#space-run').isDisabled())&&await page.locator('#space-chart circle[fill="none"]').count()===1);
  await page.locator('#space-run').click();await page.waitForFunction(()=>window.arrowSpaceShiftOperatorLab.read().space.crossings.length>0);
  await page.locator('#space-run').click();state=await read();
  check('The actual Klein crossing retains P-01 and reverses the vertical heading',state.space.projectile.id==='P-01'&&state.space.projectile.vy<0&&
    state.space.crossings.every(crossing=>crossing.objectId==='P-01'&&!crossing.predicted)&&state.space.crossings[0].rule==='klein');
  check('Actual segments remain split at the identified edge',state.space.segments.length>1&&state.space.segments.every(segment=>Math.abs(segment.to.x-segment.from.x)<.2)&&
    state.events.some(event=>event.type==='actual-crossing'&&event.objectId==='P-01'));
  await page.locator('#space-case').selectOption('b');
  check('The changed start hides the earlier forecast',!(await read()).space.revealed&&await page.locator('#space-run').isDisabled());
  await page.locator('#space-second').click();await page.locator('#reduced').check();await page.locator('#space-run').click();state=await read();
  check('Klein transfer Start B produces the opposite returned heading',state.space.projectile.vy>0&&state.records.find(record=>record.key==='space:klein:b')?.correct===true);
  await page.locator('#topology').selectOption('projective');await page.locator('#space-case').selectOption('a');
  check('The Projective Module chart retains its explicit prototype limit',/experimental chart is not a verified model of RP/.test(await page.locator('#kernel-note').innerText()));
  await page.locator('#space-first').click();await page.locator('#space-run').click();state=await read();
  check('The prototype top crossing retains the object and reverses its horizontal heading',state.space.projectile.id==='P-01'&&state.space.projectile.vx<0&&
    state.space.crossings[0].rule==='projective'&&state.space.crossings[0].edge==='top');
  await page.locator('#space-case').selectOption('b');await page.locator('#space-second').click();await page.locator('#space-run').click();state=await read();
  check('Prototype transfer Start B returns the opposite horizontal heading',state.space.projectile.vx>0&&state.records.find(record=>record.key==='space:projective:b')?.correct===true);
  check('The laboratory keeps one object representation and adds no campaign runtime',await page.evaluate(()=>typeof window.arrowSpaceShift==='undefined')&&
    state.space.projectile.id==='P-01'&&await page.locator('#space-chart circle[fill="#efce87"]').count()===1);
  const crossingDetails=page.locator('details').filter({has:page.locator('#crossing-records')});await crossingDetails.locator('summary').click();
  check('Actual crossing records remain available after motion is reduced',/"objectId": "P-01"/.test(await page.locator('#crossing-records').innerText())&&!state.space.running&&state.reducedMotion);
  await page.screenshot({path:join(output,'space-desktop.png'),fullPage:true});
  for(const panel of ['motion','sound','space']){
    await section(panel);await page.setViewportSize({width:320,height:568});
    await page.screenshot({path:join(output,`${panel}-320.png`),fullPage:true});
    check(`The ${panel} section retains content at 320 pixels`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await page.evaluate(()=>{document.documentElement.dir='rtl';});
  await page.screenshot({path:join(output,'space-320-rtl.png'),fullPage:true});
  check('RTL layout retains content without horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.evaluate(()=>{
    document.documentElement.dir='ltr';
    const entries=[...document.querySelectorAll('body,button,select,a,h1,h2,h3,p,label,th,td,summary,pre')].map(element=>[element,parseFloat(getComputedStyle(element).fontSize)]);
    window.__operatorFontSizes=entries.map(([element])=>[element,element.style.fontSize]);
    for(const [element,size]of entries)element.style.fontSize=`${size*2}px`;
  });
  await page.screenshot({path:join(output,'space-320-text-200.png'),fullPage:true});
  check('Text at 200 percent retains section controls and reflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.evaluate(()=>{for(const [element,size]of window.__operatorFontSizes)element.style.fontSize=size;delete window.__operatorFontSizes;});
  await page.setViewportSize({width:1280,height:900});
  const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;
  const notes=JSON.parse(await readFile(await download.path(),'utf8'));report.export=notes;
  check('Native export retains all eleven first answers and ordered laboratory events',download.suggestedFilename()==='operator-lab-r1-notes.json'&&
    notes.revision==='stc-operator-lab-r1'&&notes.records.length===11&&new Set(notes.records.map(record=>record.key)).size===11&&
    notes.records.find(record=>record.key==='matrix:a')?.choice==='same'&&notes.records.find(record=>record.key==='sound:gate')?.choice==='b'&&
    notes.records.find(record=>record.key==='space:klein:a')?.choice==='second'&&notes.events.every((event,index)=>Number.isInteger(event.id)&&event.scope==='operator-lab'&&(index===0||event.id>notes.events[index-1].id)));
  const storage=await page.evaluate(()=>({unchanged:window.__operatorStorageBefore===JSON.stringify(Object.fromEntries(Object.entries(localStorage))),writes:window.__operatorStorageWrites}));
  report.storage=storage;check('The laboratory does not write campaign or preference storage',storage.unchanged&&storage.writes.length===0);
  check('The normal browser flow has no runtime exception or missing asset',errors.length===0&&failedRequests.length===0);
  const reducedContext=await browser.newContext({reducedMotion:'reduce'}),reducedPage=await reducedContext.newPage();
  await reducedPage.goto(new URL('operator-lab.html',url).href);await reducedPage.waitForFunction(()=>window.arrowSpaceShiftOperatorLab);
  await reducedPage.locator('#motion-run').click();
  check('The browser motion preference selects the static response on startup',await reducedPage.locator('#reduced').isChecked()&&
    await reducedPage.evaluate(()=>{const value=window.arrowSpaceShiftOperatorLab.read();return value.reducedMotion&&!value.motion.running&&value.motion.time===6;}));
  await reducedContext.close();
  const assistanceContext=await browser.newContext(),assistancePage=await assistanceContext.newPage();
  await assistancePage.goto(new URL('operator-lab.html',url).href);await assistancePage.waitForFunction(()=>window.arrowSpaceShiftOperatorLab?.read().audio.analysisReady);
  await assistancePage.locator('#grammar-details summary').click();
  await assistancePage.waitForFunction(()=>window.arrowSpaceShiftOperatorLab.read().events.some(event=>event.type==='grammar-opened'));
  await assistancePage.locator('[data-panel="sound"]').click();await assistancePage.locator('#sound-case').selectOption('constant');
  check('The grammar keeps the constant-gain answer hidden before a prediction',!/constant scalar gain commutes|constant gain commutes/i.test(await assistancePage.locator('#grammar-details').innerText()));
  await assistancePage.locator('[data-sound="a"]').click();
  const assistance=await assistancePage.evaluate(()=>window.arrowSpaceShiftOperatorLab.read());report.assistance=assistance.records;
  check('A first answer records prior access to the operator grammar',assistance.records[0]?.context.grammarOpened===true&&
    notes.records.every(record=>record.context.grammarOpened===false));await assistanceContext.close();
  const rapidContext=await browser.newContext(),rapidPage=await rapidContext.newPage(),rapidErrors=[];
  rapidPage.on('pageerror',error=>rapidErrors.push(error.message));
  await rapidPage.route('**/assets/audio/stc-operator-lab-r1/*.wav',async route=>{await new Promise(accept=>setTimeout(accept,300));await route.continue().catch(()=>{});});
  await rapidPage.goto(new URL('operator-lab.html',url).href);await rapidPage.waitForFunction(()=>window.arrowSpaceShiftOperatorLab?.read().audio.ready);
  await rapidPage.locator('[data-panel="sound"]').click();await rapidPage.locator('#sound-enabled').check();
  await rapidPage.locator('#play-a').click();await rapidPage.locator('#play-b').click();await rapidPage.locator('[data-panel="space"]').click();
  await rapidPage.waitForTimeout(650);
  report.rapidAudio={state:await rapidPage.evaluate(()=>window.arrowSpaceShiftOperatorLab.read().audio),status:await rapidPage.locator('#audio-status').innerText(),errors:rapidErrors};
  check('Rapid Play A, Play B, and section changes retain the stopped audio status',report.rapidAudio.state.paused&&report.rapidAudio.state.currentTime===0&&
    await rapidPage.locator('audio').count()===1&&report.rapidAudio.status==='Sound stopped.'&&rapidErrors.length===0);
  await rapidContext.close();
  const failureContext=await browser.newContext(),failurePage=await failureContext.newPage(),failureErrors=[];
  failurePage.on('pageerror',error=>failureErrors.push(error.message));
  await failurePage.route('**/assets/audio/stc-operator-lab-r1/*.wav',route=>route.fulfill({status:503,body:'Controlled unavailable audio fixture'}));
  await failurePage.goto(new URL('operator-lab.html',url).href);await failurePage.waitForFunction(()=>window.arrowSpaceShiftOperatorLab?.read().audio.ready);
  await failurePage.locator('[data-panel="sound"]').click();await failurePage.locator('#sound-enabled').check();await failurePage.locator('#play-a').click();
  await failurePage.waitForFunction(()=>/Audio is not available/.test(document.querySelector('#audio-status').textContent));
  check('A controlled audio-file failure preserves the visual laboratory',await failurePage.evaluate(()=>window.arrowSpaceShiftOperatorLab.read().audio.paused)&&failureErrors.length===0);
  await failurePage.unroute('**/assets/audio/stc-operator-lab-r1/*.wav');await failurePage.locator('#play-a').click();
  await failurePage.waitForFunction(()=>!document.querySelector('#sound-player').paused&&document.querySelector('#sound-player').currentTime>.04);
  check('A normal Play request recovers after the controlled file failure',await failurePage.locator('audio').count()===1&&failureErrors.length===0);
  report.controlledFailure={status:503,errors:failureErrors};await failureContext.close();
  report.mediaCalls=await page.evaluate(()=>window.__operatorMediaCalls);
  console.log(JSON.stringify({checks:results.length,results,errors,failedRequests},null,2));
}catch(error){report.failure=String(error.stack||error);if(page)await page.screenshot({path:join(output,'failure.png'),fullPage:true}).catch(()=>{});throw error;}
finally{
  report.url=url;report.checks=results.length;await writeFile(join(output,'results.json'),JSON.stringify(report,null,2)+'\n');
  if(browser)await browser.close();server.kill();
}
