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
  if (state.fields.length >= (state.maxFolds ?? MAX_FOLDS)) return false;
  state.fields.push({ id: ++state.foldSerial, start: state.z + FIELD_LEAD,
    end: state.z + FIELD_LEAD + FIELD_LENGTH, factor: 0.5 });
  state.foldsUsed++;
  return true;
}

export function removeFold(state) {
  return state.fields.pop() ?? null;
}
