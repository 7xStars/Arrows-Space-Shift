/**
 * Genus-two Bolza research-room visualization. Never add a preview to the
 * physics actor/shot arrays; these are future positions of the same object.
 * Move Bolza is authoritative for the side pairing, so the glyph is truthful.
 */
import {insideOctagon,moveBolza} from './hyperbolic.js';

export const HYPERBOLIC_VISUAL_CONTRACT=Object.freeze({
  solid:'filled = a real mover / shot',
  hollow:'hollow dashed image = a future position across a paired edge, not an extra collider',
  paired:"A–D and the matching primed label use the same opposite-side isometry",
  geometry:'metric and pairing provided by the Bolza kernel; collision sweeps remain a separate future task',
});
export const pairedSideGlyph=i=>i>=0&&i<8&&Number.isInteger(i)?`${'ABCD'[i%4]}${i>=4?'′':''}`:null;

export function forecastBolzaPair(position,heading,{lookAhead=.45,stepLimit=.02}={}){
  if(!position||!heading||!Number.isFinite(position.x)||!Number.isFinite(position.y)||!Number.isFinite(heading.x)||!Number.isFinite(heading.y)||
    !insideOctagon(position,1e-7)||lookAhead<=0||lookAhead>4||stepLimit<=0)return null;
  try{
    const motion=moveBolza(position,heading,lookAhead,stepLimit);
    const i=motion.segments.findIndex(segment=>segment.jump===true);
    if(i<0)return null;
    const side=motion.crossings[0];
    if(!side)return null;
    const seg=motion.segments[i];
    return Object.freeze({kind:'future-projection',collisionEntity:false,status:'preview',
      from:side.from,to:side.to,sourceGlyph:pairedSideGlyph(side.from),targetGlyph:pairedSideGlyph(side.to),
      pair:side.pair,source:Object.freeze({...seg.from}),destination:Object.freeze({...seg.to}),
      approximateDistance:Number(((i+.5)*stepLimit).toFixed(3)),
      note:'Pairing and arrival derived from moveBolza; source entry sampled to finite intrinsic steps.'});
  }catch{return null;} // close-to-vertex paths need finer geometry; never invent a preview
}
