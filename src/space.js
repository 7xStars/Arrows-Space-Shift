import {isBoss,isScrollingLevel,isKleinSurfaceRoute} from './campaign.js';
import {KLEIN_BOUNDS,kleinY} from './klein.js';

export const FIELD_LENGTH = 1200;
export const FIELD_LEAD = 120;
export const MAX_FOLDS = 3;

export function metricAt(z, fields) {
  return fields.reduce((m, f) => z >= f.start && z < f.end ? m * f.factor : m, 1);
}

function boundaries(fields) {
  return [...new Set(fields.flatMap(f => [f.start, f.end]))].sort((a, b) => a - b);
}

export function spaceDistance(from, to, fields) {
  if (to < from) return -spaceDistance(to, from, fields);
  const cuts = [from, ...boundaries(fields).filter(v => v > from && v < to), to];
  let distance = 0;
  for (let i = 1; i < cuts.length; i++) {
    const a = cuts[i - 1], b = cuts[i];
    distance += (b - a) * metricAt((a + b) / 2, fields);
  }
  return distance;
}

export function advanceThroughSpace(z, distance, fields) {
  const direction = Math.sign(distance);
  if (!direction) return z;
  let remaining = Math.abs(distance);
  const cuts = boundaries(fields).filter(v => direction > 0 ? v > z : v < z);
  if (direction < 0) cuts.reverse();
  for (const boundary of cuts) {
    const cost = Math.abs(spaceDistance(z, boundary, fields));
    if (remaining <= cost) {
      const m = metricAt((z + boundary) / 2, fields);
      return z + direction * remaining / m;
    }
    remaining -= cost;
    z = boundary;
  }
  return z + direction * remaining / metricAt(z + direction * 0.000001, fields);
}

export function advanceProjectile(z, distance, fields) {
  return advanceThroughSpace(z, distance, fields.map(f => ({...f, factor: f.factor * f.factor})));
}

export function foldDepthAt(z, fields) {
  return fields.filter(f => z >= f.start && z < f.end).length;
}

export function addFold(state) {
  if(state.mode==='campaign'&&state.campaign?.index===-1&&!['fold','unfold','engage'].includes(state.campaign.lesson))return false;
  if (state.fields.length >= (state.maxFolds ?? MAX_FOLDS)) return false;
  const backward=state.mode==='campaign'&&state.facing===-1;
  const boss=isBoss(state);
  // Ordinary scrolling levels keep the ship screen-anchored. Their route
  // coordinate is the camera, not the ship's stale world z. Place new folds
  // ahead of the current action so late-stage speedrunning remains possible.
  const routeOrigin=isScrollingLevel(state)&&!isKleinSurfaceRoute(state)?state.cameraZ:state.z;
  let entry=routeOrigin+FIELD_LEAD;
  if(boss){
    let y=kleinY(spaceDistance(0,entry,state.fields));
    // Enter the connected surface before placing the interval. A backward
    // entry at the bottom uses the top representative so it has real length.
    if(backward&&Math.abs(y-KLEIN_BOUNDS.bottom)<1e-9)y=KLEIN_BOUNDS.top;
    entry=advanceThroughSpace(0,y,state.fields);
  }
  const field={id:++state.foldSerial,start:backward?entry-FIELD_LENGTH:entry,
    end:backward?entry:entry+FIELD_LENGTH,factor:.5};
  state.fields.push(field);
  if(boss){
    // Finale folds end at the canonical seam when their interval is longer
    // than the available surface. Clip after compression so both boundary
    // markers describe actual support, without altering the metric helpers.
    const bottom=advanceThroughSpace(0,KLEIN_BOUNDS.bottom,state.fields);
    const top=advanceThroughSpace(0,KLEIN_BOUNDS.top,state.fields);
    field.start=Math.max(field.start,bottom);field.end=Math.min(field.end,top);
  }
  state.foldsUsed++;
  return true;
}

export function removeFold(state) {
  return state.fields.pop() ?? null;
}
