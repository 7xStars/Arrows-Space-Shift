import {isActAvailable} from './build.js';

const runtimes=Object.freeze({
  act4:()=>import('./hyperbolic-act.js'),
  repair:()=>import('./repair-app.js'),
});
const entry=document.querySelector('script[data-later-content]')?.dataset.laterContent;

if(isActAvailable(4)&&Object.hasOwn(runtimes,entry)){
  await runtimes[entry]();
}else{
  document.title='Arrow Space Shift · Game Off edition';
  const main=document.createElement('main'),heading=document.createElement('h1'),summary=document.createElement('p'),detail=document.createElement('p'),back=document.createElement('a');
  main.id='deferred-content';main.setAttribute('aria-labelledby','deferred-heading');
  heading.id='deferred-heading';heading.textContent='Acts I–III';
  summary.textContent='This Game Off edition ends after Act III.';
  detail.textContent='Later content is kept for a future version. Existing progress is retained.';
  back.href='./index.html';back.textContent='Return to campaign';
  main.append(heading,summary,detail,back);document.body.replaceChildren(main);
  document.body.style.cssText='display:grid;grid-template-rows:1fr;place-items:center;padding:24px;background:#030405;color:#e8e2d1;';
  main.style.cssText='display:block;width:min(100%,40rem);padding:24px;border:1px solid #61777b;border-radius:8px;background:#101718;';
  heading.style.cssText='font-size:clamp(24px,5vw,38px);margin:0 0 16px;';
  back.style.cssText='display:inline-flex;align-items:center;min-height:44px;margin-top:12px;padding:8px 12px;border:1px solid #61777b;border-radius:6px;color:inherit;';
}
