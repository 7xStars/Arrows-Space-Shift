export function newRunSeed(){
  if(globalThis.crypto?.getRandomValues)return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
  return (Date.now()^Math.floor(Math.random()*0x100000000))>>>0;
}
export function randomFor(seed,section=0){
  let state=(seed^Math.imul(section+1,0x9e3779b9))>>>0;
  return ()=>{
    state=(state+0x6d2b79f5)>>>0;let value=state;
    value=Math.imul(value^(value>>>15),value|1);value^=value+Math.imul(value^(value>>>7),value|61);
    return ((value^(value>>>14))>>>0)/4294967296;
  };
}
