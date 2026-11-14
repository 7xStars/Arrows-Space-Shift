# Operator audiovisual grammar v2

Candidate: `stc-operator-lab-r1`.
Registry version: `operator-av-grammar-2.0`.
Date: November 13, 2026.
Status: Implemented in the controlled laboratory. Campaign use remains proposed.
The [result report](OPERATOR-LAB-RESULT-r1.md) identifies the executed models, sounds, and browser cases.

This registry expands the project's Structural Techno-Cosmism vocabulary.
The ten expressive families are project design categories.
They are not a taxonomy from the book.
The [source review](OPERATOR-SOURCE-REVIEW-r1.md) gives the verified passages, assumptions, and limits.

## Three distinct kinds of statement

1. A formal identity follows from a defined model and assumptions.
2. An implemented effect executes that model in a named build and state.
3. A listener or player recognizes the intended relation under stated conditions.

None of these statements automatically establishes either of the others.
A successful automated test is not a human recognition result.
The Structural Disclosure skill supplies a practical method from the user's registry summary.
The full research paper was not supplied for this task.

## Grammar entries

| ID and family | Defined relation | Controlled expression | Measurement or discriminating case | Current scope |
|---|---|---|---|---|
| `ASS-OP-WEIGHT`: Mechanical weight | A declared second-order response model relates input to displacement. | A slower body response can contrast with a faster secondary part. | Measure rise, settling, and peak displacement under the same input. | Laboratory presentation. Perceived weight remains unverified. |
| `ASS-OP-ELASTIC`: Elasticity | Damping and restoration change the response under a stated mechanical model. | A secondary element can overshoot and settle after an input. | Compare the Heavy, Elastic, and Settled profiles with the same start and target. | Laboratory presentation. No change to ship controls or hitboxes. |
| `ASS-OP-TRANSIENT`: Instability | A nonnormal matrix can amplify a state temporarily while its powers eventually decay. | A bounded secondary trace can reveal growth followed by recovery. | Compare the coupled matrix with `0.6I` from the same start. Keep unclamped values available. | Finite matrix example. It does not establish game instability. |
| `ASS-OP-ANTICIPATE`: Anticipation | An actual scheduled event or verified forecast provides an allowed warning. | A static mark can remain after a short approach cue. | Compare actual event time, warning time, and forecast error. | Existing event authority is required. New encounter mapping remains proposed. |
| `ASS-OP-RESONATE`: Resonance | A specified filter or convolution relates an input to its frequency and time response. | An impulse or short motif can leave a decaying response. | Use the same source, gain, and time origin. Compare the complete response and its tail. | Sound laboratory. The book does not prescribe a reverb preset. |
| `ASS-OP-ORDER`: Transformation | Operator composition can depend on order. The models must define the operations. | Gate then reverb can differ from reverb then gate. Channel selection and swap supply a finite matrix example. | Use noncommuting and commuting pairs. State chronological order explicitly. | Formal model and controlled audio. No automatic topology equivalence. |
| `ASS-OP-LOCAL`: Locality | A model can expose local states, rules, and interfaces before its composite behavior. | A trace can isolate an approach, crossing, continuation, and recovery. | Inspect each local result, then the composite. Use cases that challenge interface assumptions. | Production method. Allan's theorem does not certify an encounter. |
| `ASS-OP-PERSIST`: Persistence | A named property survives a specified transformation. | A real projectile can retain its ID through an actual boundary map. A chord voicing can retain pitch classes. | Compare IDs or pitch classes directly. Use a changed start or register for transfer. | Existing simulation identity and the musical studies. Recognition remains open. |
| `ASS-OP-REVERSE`: Reversibility | An inverse or involution restores a defined state under its stated domain. | Two channel swaps restore the source channels. | Apply `J` twice. Include a projection as a contrasting information-loss case. | Finite operator example. No claim that every fold, collision, or reward is reversible. |
| `ASS-OP-COUPLE`: Coupling | A declared cross-term lets one state influence another. | A coupled transient can grow before it settles. Sound can share a defined response envelope. | Remove the cross-term while the remaining model and input stay the same. | Controlled model. Perceived coherence requires listener evidence. |

## Required entry data

Each production entry must contain these fields:

```json
{
  "id": "ASS-OP-ORDER",
  "revision": "operator-av-grammar-2.0",
  "family": "Transformation",
  "sourceKind": "lab",
  "trigger": "user-start",
  "inputIdentity": "fixed-source-01",
  "inputUnits": "linear samples at a stated sample rate",
  "model": "fixed gate and fixed convolution",
  "chronologicalOrder": ["gate", "reverb"],
  "compositionNotation": "R(G(x))",
  "intendedMeaning": "The first operation changes what enters the second operation.",
  "preservedProperties": ["source identity", "time origin", "final gain"],
  "changedProperties": ["output samples", "tail during a closed gate"],
  "limits": ["finite declared model", "no added collider"],
  "reducedMotionFallback": "static traces and named order",
  "silentFallback": "inspectable sample traces and gate intervals",
  "performanceBounds": "declared voices, buffers, and display amplitude",
  "verification": "named local test and output record",
  "humanEvidence": "not collected"
}
```

Use `sourceKind` values that distinguish an actual event, a forecast, and a laboratory action.
The event producer owns that distinction.
The audiovisual consumer must not promote a forecast into an actual event.
An event must retain its real object ID and collision status.
An effect must not create a projectile or change damage.

The fields above define a registry contract.
They do not claim that every existing game event has this exact JSON schema.

## Operation order and invariants

Write chronological order in words before any algebraic abbreviation.
Gate then reverb means `R(G(x))`.
Reverb then gate means `G(R(x))`.
Under `[G,R]=GR-RG`, the first result minus the second equals `-[G,R]x`.

A time-varying gate can fail to commute with a fixed convolution.
A constant scalar gain commutes with that convolution and supplies a contrasting case.
A nonlinear distortion can also change the outcome when its order changes.
The nonlinear example does not inherit linear Banach-algebra theorems.

For the two-channel example, define `P=diag(1,0)` and let `J` swap channels.
The identities `P²=P`, `J²=I`, and `JPJ=I-P` follow by matrix multiplication.
In general, `JP` and `PJ` differ.
The projection discards information; the swap does not.
Idempotence alone does not establish orthogonality for an arbitrary projection.

The matrix example is not the Klein bottle or a projective surface.
The game's boundary kernel must calculate the actual crossing.
The K+P hybrid remains a prototype. This registry does not establish a connected-sum realization.
The registry also does not remove the documented Bolza collision and numerical limits.
Render-only previews remain hollow and separate from the filled live projectile.
No analogy creates harmless copies or collision sheets.

## Controlled laboratory sequence

1. Establish the input, operations, and retained identity.
2. Record the first prediction before a preview or answer appears.
3. Execute both operation orders from the same input.
4. Disclose the trace, operation order, and measured difference.
5. Include a case where the operations commute.
6. Use an unfamiliar input or timing arrangement for the transfer question.
7. Record assistance and later corrections separately from the first response.

The mechanical view must identify the input, normalized units, model, and solver.
It must keep unclamped model values separate from any display cap.
The sound view must retain the same source and final gain between paths.
The topology view must consume the real geometry trace and retain projectile identity.
Reduced motion must retain the static traces, labels, and prediction controls.
Silent use must retain the evidence needed to understand the relation.

## Verification and evidence labels

| Label | Meaning in this registry |
|---|---|
| Specified | The model and expected distinction are written. |
| Derived | A calculation establishes the consequence under stated assumptions. |
| Executed | The identified build executes the operation with recorded inputs and output. |
| Compared | Matched cases and a discriminating alternative have recorded outputs. |
| Human observation | A person predicts or explains a case under stated conditions. |
| Transferred | An unfamiliar case has separate first-response evidence. |

These labels supplement the user's E0-E4 and EP distinctions.
They do not replace those evidence rules with a numeric score.
Formal proof remains separate from empirical observations.
Integration must attach the actual test commands and results before changing an entry to Executed.

## Release boundary

The controlled laboratory precedes full encounter use.
No new ship motion rule, collision path, projectile speed, boss warning, or saved reward follows from this registry alone.
The 16 existing music masters retain their original hashes during this laboratory work.
The separate WAV download must contain those masters, not newly normalized replacements.
No human comprehension or listening approval is claimed.
The [source review](OPERATOR-SOURCE-REVIEW-r1.md) records the book and STE limits.
