export const OPERATOR_GRAMMAR=Object.freeze([
  {id:'ASS-OP-WEIGHT',family:'Mechanical weight',model:'Second-order target response',order:['target step','response','settling'],invariant:'The target remains fixed.',lab:'Motion',limit:'Normalized model units. No flight rule changes.'},
  {id:'ASS-OP-ELASTIC',family:'Elasticity',model:'Damped spring response',order:['displace','restore','decay'],invariant:'Positive mass and stiffness.',lab:'Motion',limit:'Overshoot is a measured model value, not a perception result.'},
  {id:'ASS-OP-TRANSIENT',family:'Instability',model:'Finite matrix powers',order:['disturb','couple','amplify','decay'],invariant:'The coupled example has spectral radius 0.6.',lab:'Motion',limit:'Transient growth does not imply asymptotic instability.'},
  {id:'ASS-OP-ANTICIPATE',family:'Anticipation',model:'Existing trace kernel',order:['source','forecast','actual crossing'],invariant:'The source identity remains the same.',lab:'Space kernels',limit:'A forecast is drawing data. It creates no collider.'},
  {id:'ASS-OP-RESONATE',family:'Resonance',model:'Fixed linear room response',order:['source','response','tail'],invariant:'A fixed scalar gain commutes with the linear response.',lab:'Sound order',limit:'This finite DSP example is not a physical room model.'},
  {id:'ASS-OP-ORDER',family:'Transformation',model:'Ordered composition',order:['first operation','second operation'],invariant:'Both orders use the same input.',lab:'Sound order',limit:'Nonlinear saturation is separate from the linear commutator example.'},
  {id:'ASS-OP-LOCAL',family:'Locality',model:'Kernel segments at identified edges',order:['segment','edge map','next segment'],invariant:'No path line crosses a warp jump.',lab:'Space kernels',limit:'Local observations do not prove a global theorem.'},
  {id:'ASS-OP-PERSIST',family:'Persistence',model:'Retained object identity',order:['entry','crossing','continuation'],invariant:'One object ID remains in all actual segments.',lab:'Space kernels',limit:'The channel model does not create harmless collision sheets.'},
  {id:'ASS-OP-REVERSE',family:'Reversibility',model:'Projection and channel swap',order:['select or swap','compose','compare'],invariant:'P squared equals P. J squared equals I.',lab:'Motion',limit:'An idempotent need not be an orthogonal projection.'},
  {id:'ASS-OP-COUPLE',family:'Coupling',model:'Upper-triangular response matrix',order:['second state','cross-response','first state'],invariant:'Both diagonal entries remain 0.6.',lab:'Motion',limit:'This matrix is an illustrative model, not a ship-motion law.'},
].map(value=>Object.freeze({...value,revision:'operator-av-grammar-2.0',order:Object.freeze(value.order),chronologicalOrder:value.order,
  status:'implemented-laboratory',gameUse:'proposed',sourceKind:value.family==='Anticipation'?'forecast':'lab',trigger:'user-start',
  inputIdentity:value.lab==='Space kernels'?'P-01':value.lab==='Sound order'?'operator-input-r1':'declared-model-start',
  inputUnits:value.lab==='Sound order'?'linear stereo samples at 48000 Hz':value.lab==='Space kernels'?'normalized chart coordinates':'normalized model units',
  compositionNotation:value.id==='ASS-OP-ORDER'?'R(G(x)) versus G(R(x))':value.model,
  intendedMeaning:value.family,preservedProperties:Object.freeze([value.invariant]),changedProperties:Object.freeze(['declared output state']),
  limits:Object.freeze([value.limit]),reducedMotionFallback:'Static traces and result values.',silentFallback:'Named operations and result values.',
  performanceBounds:'One media element. At most 128 retained presentation events.',
  verification:value.lab==='Sound order'?'tests/test_operator_audio.py and the native render record':'tests/operator-models.test.mjs and the browser record',
  humanEvidence:'not-collected'})));

export function recordFirstPrediction(records,key,choice,expected,context={}){
  const prior=records.find(record=>record.key===key);
  if(prior)return {...prior,retained:true};
  const record=Object.freeze({key,choice,expected,correct:choice===expected,context:structuredClone(context),first:true});
  records.push(record);return {...record,retained:false};
}
