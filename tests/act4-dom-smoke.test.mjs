import test from 'node:test';
import assert from 'node:assert/strict';

// A deliberately small DOM contract smoke, NOT a real browser playtest.
// It catches missing IDs or render-frame exceptions when Chromium cannot run.
test('Act IV imports, initializes its view, launches and draws three frames in a DOM proxy',async()=>{
  const frames=[],elements=new Map(),handlers=new Map();
  const context=new Proxy({}, {get(obj,name){if(name in obj)return obj[name];return ()=>{};},set(obj,name,value){obj[name]=value;return true;}});
  class Element {
    constructor(name){this.name=name;this.textContent='';this.value='';this.checked=false;this.hidden=false;this.style={};this.dataset={};this.children=[];this.listeners=new Map();}
    getContext(){return context;}
    addEventListener(event,fn){this.listeners.set(event,fn);}
    dispatch(event,details={}){this.listeners.get(event)?.({...details,target:this});}
    replaceChildren(...children){this.children=children;}
    append(...children){this.children.push(...children);}
    setAttribute(name,value){this[name]=value;}
    focus(){document.activeElement=this;}
    showModal(){this.open=true;}
    close(){this.open=false;this.dispatch('close');}
  }
  const get=id=>{if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id);};
  globalThis.document={getElementById:get,querySelectorAll:()=>[],createElement:tag=>new Element(tag),addEventListener:(key,fn)=>handlers.set(key,fn),hidden:false};
  globalThis.window={matchMedia:()=>({matches:false}),addEventListener:(key,fn)=>handlers.set(key,fn),requestAnimationFrame:fn=>frames.push(fn)};
  globalThis.location={hostname:'localhost',search:'?qa=1'};
  const stored=new Map([['arrow-space-shift:preferences:v1',JSON.stringify({version:1,reducedMotion:true,sound:false,music:false,volume:.2,manifoldCues:false})]]);
  globalThis.localStorage={getItem:key=>stored.get(key)??null,setItem:(key,value)=>stored.set(key,value)};
  await import('../src/hyperbolic-act.js');
  assert.equal(get('modal-title').textContent, 'The Eight Edges');
  assert.equal(get('launch').hidden,false);
  assert.equal(get('stage-select').children.length,9,'local QA stage selector has all stages');
  assert.equal(get('reduced-motion').checked,true);
  assert.equal(get('pair-previews').checked,false);
  assert.equal(get('sound').textContent,'Sound off');
  assert.equal(get('music').checked,false);
  assert.equal(get('volume').value,20);
  get('launch').dispatch('click');
  assert.equal(get('overlay').hidden,true);
  assert.equal(frames.length,1);
  for(const now of [16,32,48,64]){
    assert.ok(frames.length>0);
    frames.shift()(now);
  }
  assert.equal(get('wave').textContent,'1 / 2');
  assert.match(get('status').textContent,/Wave/);
  const key=code=>handlers.get('keydown')({code,repeat:false,preventDefault(){},target:{closest:()=>false}});
  key('KeyP');assert.match(get('status').textContent,/Paused/);
  key('KeyP');assert.doesNotMatch(get('status').textContent,/Paused/,'P must resume a paused stage');
  handlers.get('blur')();assert.match(get('status').textContent,/Paused/);
  key('KeyP');assert.doesNotMatch(get('status').textContent,/Paused/);
  get('options-open').focus();get('options-open').dispatch('click');
  assert.equal(get('options-dialog').open,true);
  assert.match(get('status').textContent,/Paused/);
  key('KeyP');assert.match(get('status').textContent,/Paused/,'the modal cannot resume play');
  get('options-close').dispatch('click');
  assert.equal(get('options-dialog').open,false);
  assert.equal(document.activeElement,get('options-open'));
  assert.match(get('status').textContent,/Paused/,'closing Options leaves play paused');
  let prevented=false;
  handlers.get('keydown')({code:'KeyP',repeat:false,preventDefault(){prevented=true;},target:{closest:selector=>selector==='button,a'}});
  assert.equal(prevented,true);assert.doesNotMatch(get('status').textContent,/Paused/,'P works when a button has focus');
  handlers.get('keydown')({code:'KeyP',repeat:false,preventDefault(){},target:{closest:selector=>selector.includes('input')}});
  assert.doesNotMatch(get('status').textContent,/Paused/,'P does not change play while a settings input has focus');
  get('reduced-motion').checked=false;get('reduced-motion').dispatch('change');
  assert.equal(JSON.parse(stored.get('arrow-space-shift:preferences:v1')).reducedMotion,false);
  assert.equal(JSON.parse(stored.get('arrow-space-shift:preferences:v1')).sound,false,'other shared settings remain saved');
});
