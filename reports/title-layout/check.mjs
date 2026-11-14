import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {join,resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}catch{({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=resolve(process.argv[2]||'.'),out=resolve(process.argv[3]||'reports/title-layout/current');await mkdir(out,{recursive:true});
const server=spawn(process.execPath,[join(root,'tools/local-server.mjs'),'--port=0'],{cwd:root,windowsHide:true});
const url=await new Promise((accept,reject)=>{let data='';server.stdout.on('data',chunk=>{data+=chunk;const match=data.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match)accept(match[0]);});server.once('error',reject);});
const browser=await chromium.launch({channel:'msedge',headless:true}),cases=[],errors=[];
const bounds=async(page,selector)=>page.locator(selector).evaluateAll(elements=>elements.filter(element=>element.getClientRects().length).map(element=>{
  const r=element.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y);
  return {id:element.id,tag:element.tagName,text:(element.textContent||element.getAttribute('aria-label')||element.type||'').trim().slice(0,130),
    x:r.x,y:r.y,width:r.width,height:r.height,inside:r.x>=-.5&&r.y>=-.5&&r.right<=innerWidth+.5&&r.bottom<=innerHeight+.5,
    centerReceivesInput:Boolean(hit&&(hit===element||element.contains(hit))),disabled:Boolean(element.disabled)};
}));
try{
  const sizes=[{width:320,height:568},{width:390,height:844},{width:640,height:450},{width:1280,height:900}];
  if(process.argv.includes('--extended'))sizes.push({width:320,height:568,direction:'rtl'},{width:640,height:450,zoom:2});
  for(const {width,height,direction='ltr',zoom=1}of sizes){
    const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();page.setDefaultTimeout(5000);
    page.on('pageerror',error=>errors.push({width,height,error:error.message}));
    await page.goto(url);await page.waitForFunction(()=>window.arrowSpaceShift&&window.arrowSpaceShift.assets().ready);
    await page.evaluate(({direction,zoom})=>{document.documentElement.dir=direction;if(zoom!==1)document.documentElement.style.zoom=String(zoom);},{direction,zoom});
    await page.waitForTimeout(250);
    const label=`${width}x${height}${direction==='rtl'?'-rtl':''}${zoom!==1?'-csszoom2':''}`;
    const row={width,height,direction,zoom,title:await bounds(page,'#primary,#title-music,#open-options,#open-guide'),dialogs:[],failures:[]};
    for(const control of row.title)if(!control.disabled&&(!control.inside||!control.centerReceivesInput))row.failures.push({state:'title',id:control.id,error:'The initial action is clipped or covered before scrolling.',bounds:control});
    row.titleStructure=await page.evaluate(()=>{
      const read=element=>{const r=element.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scrollWidth:element.scrollWidth,clientWidth:element.clientWidth,scrollHeight:element.scrollHeight,clientHeight:element.clientHeight,overflowY:getComputedStyle(element).overflowY};};
      return {body:read(document.body),overlay:read(document.querySelector('#overlay')),brief:read(document.querySelector('.brief')),dock:read(document.querySelector('.viewport-dock'))};
    });
    await page.screenshot({path:join(out,`title-${label}.png`)});
    for(const selector of ['#title-music','#primary'])try{await page.locator(selector).click({trial:true,timeout:1500});}catch(error){row.failures.push({state:'title',selector,error:error.message});}
    for(const name of ['options','guide']){
      await page.locator(`#open-${name}`).click();await page.waitForFunction(id=>document.querySelector(id).open,`#${name}-dialog`);
      const dialog=`#${name}-dialog`,entry={name,initial:await bounds(page,`${dialog} button,${dialog} input,${dialog} select,${dialog} a,${dialog} summary`),controls:[]};
      entry.structure=await page.locator(dialog).evaluate(element=>({scrollWidth:element.scrollWidth,clientWidth:element.clientWidth,scrollHeight:element.scrollHeight,clientHeight:element.clientHeight,overflowY:getComputedStyle(element).overflowY}));
      await page.screenshot({path:join(out,`${name}-${label}.png`)});
      const controls=page.locator(`${dialog} button,${dialog} input,${dialog} select,${dialog} a,${dialog} summary`);
      for(let index=0;index<await controls.count();index++){
        const control=controls.nth(index);if(!await control.isVisible()||!await control.isEnabled())continue;
        const id=await control.getAttribute('id'),tag=await control.evaluate(element=>element.tagName),label=(await control.textContent()||await control.getAttribute('aria-label')||'').trim().slice(0,100);
        try{
          await control.scrollIntoViewIfNeeded();await control.click({trial:true,timeout:1500});
          const r=await control.boundingBox(),inside=r.x>=-.5&&r.y>=-.5&&r.x+r.width<=width+.5&&r.y+r.height<=height+.5;
          entry.controls.push({id,tag,label,bounds:r,inside,reachable:true});
          if(!inside)row.failures.push({state:name,id,label,error:'A control extends beyond the viewport after scroll.'});
        }catch(error){entry.controls.push({id,tag,label,reachable:false,error:error.message});row.failures.push({state:name,id,label,error:error.message});}
      }
      if(entry.structure.scrollWidth>entry.structure.clientWidth+1)row.failures.push({state:name,error:'The dialog has horizontal overflow.',...entry.structure});
      row.dialogs.push(entry);await page.keyboard.press('Escape');await page.waitForFunction(id=>!document.querySelector(id).open,dialog);
    }
    cases.push(row);console.log(JSON.stringify({label,failures:row.failures.length,dialogs:row.dialogs.map(entry=>({name:entry.name,controls:entry.controls.length}))}));await context.close();
  }
}finally{
  const report={root,browser:'Microsoft Edge headless',cases,errors,limits:'CSS viewport sizes with actual control bounds, trial click access, and dialog scrolling. Extended cases use document dir=rtl at320x568 and CSS zoom:2 at640x450. CSS zoom is not native browser zoom. No physical mobile, touch hardware, keyboard overlay, native 200 percent zoom, or translation result.'};
  await writeFile(join(out,'results.json'),JSON.stringify(report,null,2)+'\n');await browser.close();server.kill();
  console.log(JSON.stringify({cases:cases.map(row=>({width:row.width,height:row.height,direction:row.direction,zoom:row.zoom,title:row.title,failures:row.failures,dialogs:row.dialogs.map(dialog=>({name:dialog.name,controls:dialog.controls.length,structure:dialog.structure}))})),errors},null,2));
}
