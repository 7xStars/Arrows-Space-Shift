/** Game Off first-time experience protocol. This defines questions and
 * acceptance targets; it NEVER asserts that unrun human testing passed. */
export const FIRST_TIME_CHECKS=Object.freeze([
  {id:'controls',title:'Basic controls without coaching',target:0.9},
  {id:'fold',title:'Explained one consequence of folding',target:0.8},
  {id:'damage',title:'Explained a hit or plausible alternative',target:0.8},
  {id:'transfer',title:'Applied a learned SHIFT rule in a new encounter',target:0.75},
  {id:'continue',title:'Voluntarily wanted to continue after Act I',target:0.8},
]);
export function evaluateResponses(responses=[]){
  const completed=responses.filter(response=>response&&typeof response==='object');
  const tests=FIRST_TIME_CHECKS.map(test=>{
    const rated=completed.filter(response=>[true,false].includes(response[test.id]));
    const passing=rated.filter(response=>response[test.id]===true).length;
    return {id:test.id,n:rated.length,passing,rate:rated.length?passing/rated.length:null,target:test.target,
      met:rated.length?passing/rated.length>=test.target:null};
  });
  const scored=completed.map(x=>Number(x.overall)).filter(x=>x>=1&&x<=5&&Number.isInteger(x));
  const average=scored.length?scored.reduce((a,b)=>a+b,0)/scored.length:null;
  return {sample:completed.length,rated:scored.length,average,tests};
}
