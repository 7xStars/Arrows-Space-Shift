import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),results=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
const check=(label,value)=>{assert.ok(value,label);results.push(label);};
const read=()=>page.evaluate(()=>window.arrowSpaceShiftTest.read());
const advance=n=>page.evaluate(n=>window.arrowSpaceShiftTest.advance(n),n);
try{
  await page.goto('http://127.0.0.1:4177/?test=1');
  check('Level 0 is the first campaign section',(await read()).campaign.index===-1);
  await page.screenshot({path:'reports/ui-ready.png',fullPage:true});
  await page.getByRole('button',{name:'Start campaign',exact:true}).click();
  for(const key of ['ArrowRight','ArrowLeft']){await page.keyboard.down(key);await advance(.25);await page.keyboard.up(key);}
  check('Left and right input completes the movement checks',(await read()).campaign.lesson==='shoot');
  await advance(.8);await page.screenshot({path:'reports/ui-tutorial.png',fullPage:true});
  await page.keyboard.down('Space');await advance(2);await page.keyboard.up('Space');
  check('Real Space input completes the firing lesson',(await read()).phase==='cleared');
  await page.getByRole('button',{name:'Start Level 1',exact:true}).click();
  check('Level 1 follows the tutorial',(await read()).campaign.index===0);
  await page.getByRole('button',{name:'Equipment',exact:true}).click();
  check('Opening equipment pauses combat',(await read()).phase==='paused');
  const frozen=(await read()).time;await advance(2);check('Time stays fixed while equipment is open',(await read()).time===frozen);
  check('The equipment dialog has focus',await page.evaluate(()=>document.querySelector('#equipment-dialog').contains(document.activeElement)));
  for(let i=0;i<12;i++)await page.keyboard.press('Tab');
  check('Tab stays inside the modal panel',await page.evaluate(()=>document.querySelector('#equipment-dialog').contains(document.activeElement)));
  await page.locator('#slot-one').click();await page.locator('button[data-seed="0:-1"]').click();
  check('Equipment can be changed while paused',(await read()).equipped[0].polarity===-1);
  await page.keyboard.press('Escape');
  check('Escape closes the panel without resuming play',!(await page.locator('#equipment-dialog').isVisible())&&(await read()).phase==='paused');
  check('Closing restores focus to the panel trigger',await page.locator('#open-equipment').evaluate(e=>e===document.activeElement));
  await page.getByRole('button',{name:'Resume flight',exact:true}).click();await advance(.4);
  await page.getByRole('button',{name:'Options',exact:true}).click();await page.getByRole('button',{name:'New run',exact:true}).click();
  check('Clearing a campaign requires confirmation',await page.locator('#reset-dialog').isVisible());
  const seed=(await read()).runSeed;await page.getByRole('button',{name:'Keep progress',exact:true}).click();
  check('Cancel retains the campaign',(await read()).runSeed===seed&&(await read()).campaign.index===0);
  await page.getByRole('button',{name:'Close options',exact:true}).click();await page.getByRole('button',{name:'Resume flight',exact:true}).click();
  await page.evaluate(()=>window.arrowSpaceShiftTest.loadChapterTrial(1));await advance(.3);
  await page.screenshot({path:'reports/ui-flight.png',fullPage:true});
  const pairs=await page.evaluate(()=>['campaign-goal','combat-loadout','live-debt','hull','open-guide','event'].map(id=>{
    const element=document.getElementById(id),style=getComputedStyle(element);let node=element,background;
    while(node){const color=getComputedStyle(node).backgroundColor;if(color!=='rgba(0, 0, 0, 0)'){background=color;break;}node=node.parentElement;}
    return {id,foreground:style.color,background};
  }));
  const luminance=color=>{const values=color.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});return values[0]*.2126+values[1]*.7152+values[2]*.0722;};
  for(const pair of pairs){const a=luminance(pair.foreground),b=luminance(pair.background);pair.ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);check(`${pair.id} text contrast is at least 4.5:1`,pair.ratio>=4.5);}
  await fs.writeFile('reports/interface-contrast.json',JSON.stringify(pairs,null,2));
  for(const [width,height] of [[1440,1000],[1280,720],[390,844],[320,740],[720,500]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(100);
    check(`No horizontal overflow at ${width} x ${height}`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    check(`Only the viewport occupies the page at ${width} x ${height}`,await page.locator('canvas').evaluate(e=>{const r=e.getBoundingClientRect();return r.x===0&&r.y===0&&Math.abs(r.width-innerWidth)<1&&Math.abs(r.height-innerHeight)<1;}));
    await page.getByRole('button',{name:'Guide',exact:true}).click();
    check(`Guide remains inside the window at ${width} x ${height}`,await page.locator('#guide-dialog').evaluate(e=>{const r=e.getBoundingClientRect();return r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;}));
    await page.keyboard.press('Escape');
    if(width===320)await page.screenshot({path:'reports/ui-compact.png',fullPage:true});
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.keyboard.press('Tab');
  check('Keyboard focus has an outline',await page.evaluate(()=>getComputedStyle(document.activeElement).outlineStyle!=='none'));
  await page.setViewportSize({width:320,height:740});
  await page.evaluate(()=>window.arrowSpaceShiftTest.loadChapterTrial(4));
  await page.locator('#open-equipment').click();await page.locator('#slot-two').click();await page.locator('button[data-seed="6:1"]').click();await page.keyboard.press('Escape');await page.getByRole('button',{name:'Resume flight',exact:true}).click();
  check('Two-slot campaign status fits at 320 px',await page.locator('#combat-loadout').evaluate(e=>{const r=e.getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.bottom<innerHeight-150&&e.textContent.includes('Utility Exchange');}));
  await page.screenshot({path:'reports/ui-two-slots-compact.png',fullPage:true});
  check('No runtime errors occurred',errors.length===0);
  const report={checks:results.length,results,errors,limits:'Headless Edge. The 720 x 500 case represents reduced layout space, not actual browser zoom. No screen reader or human learning session was run.'};
  await fs.writeFile('reports/interface-browser-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
