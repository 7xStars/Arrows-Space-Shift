# Operator source review r1

Candidate: `stc-operator-lab-r1`.
Date: November 13, 2026.
Role: Research Support.
Scope: Selected mathematical claims and the local STE reference.

## Source identity and method

The supplied book is *Non-commutative Gelfand Theories: A Tool-kit for Operator Theorists and Numerical Analysts*.
The authors are Steffen Roch, Pedro A. Santos, and Bernd Silbermann.
The copyright page gives Springer-Verlag London Limited, 2011, and DOI `10.1007/978-0-85729-183-7`.
The local PDF has 387 pages.
Its SHA-256 value is `2c2e0675144bbe2427e3f3bdd182a302c7a334a411b3edc2fc0dc57c29000387`.

The local STE file has 424 PDF pages.
The cover identifies ASD-STE100 Issue 8, April 2021.
The page footers give the date `2021-04-30`.
Its SHA-256 value is `6ffc3b5a325e7de3e64f8db5bd8c19710750fe34f03c89b3b789b5cc3b25c3d5`.

Python and PyMuPDF extracted page text, bookmarks, labels, and file metadata.
The review used complete relevant pages, not isolated search snippets.
Eleven representative pages were rendered as PNG files.
Eight rendered pages received visual inspection: book PDF pages 2, 32, 84, 159, 269, and 325; STE pages 1 and 45.
The source pages contain no clipping that prevents the reviewed formulas or rules from being read.

The private text and images remain in `G:/Music Projects/Arrow Space Shift/scratch/operator-lab-r1/references/`.
The project does not contain copies of either reference PDF or their complete extracted text.
The review does not claim to cover every theorem or dictionary entry.

## Verified book passages

PDF page numbers below use a one-based count.
Printed page numbers come from the page labels and visible page headings.
The offsets change within this PDF. A single page offset is not reliable.

| Passage | Complete PDF pages examined | Printed pages | Source result and conditions |
|---|---|---|---|
| Section 1.2, invertibility and spectrum | 28-34 | 17-23 | The resolvent uses an inverse in the stated unital algebra. The complex Banach-algebra spectrum is nonempty and compact. |
| Section 1.2.3, spectral radius | 32-33 | 21-22 | The definition uses a supremum. Theorem 1.2.12 equates the radius with the limit of the roots of power norms. The nearby convention makes algebras complex. |
| Section 2.2, Allan's local principle | 82-85 | 72-75 | Theorem 2.2.2 requires a central subalgebra of a unital Banach algebra. Its local maps are particular quotient maps. |
| Section 3.3, two idempotents and a flip | 159-161 | 150-152 | The setup requires `p²=p`, `r²=r`, and `j²=e`. Additional relations distinguish two classes of algebras. |
| Section 5.3, convolution commutators | 269-271 | 262-264 | The text defines `[A,B]=AB-BA`. Its subsequent compactness results require stated multiplier, function-space, and regularity conditions. |
| Section 6.1, approximation and stability | 324-326 | 317-319 | Definition 6.1.2 requires eventual invertibility and uniformly bounded inverse norms. Strong convergence alone does not establish this stability. |

These passages support an operator vocabulary.
They do not provide animation presets, a sound-design method, or evidence about player comprehension.

For Allan's theorem, the central subalgebra is closed and contains the identity of the larger algebra.
Each maximal ideal of that subalgebra generates a particular closed two-sided ideal in the larger algebra.
The theorem uses all resulting quotient maps.
The book also states a convention for a quotient whose defining ideal equals the whole algebra.
An arbitrary collection of local game checks does not satisfy this construction merely because it is called local.

## Mathematical distinctions for the laboratory

For a complex unital Banach algebra, compactness permits a maximum in the spectral-radius expression.
The book's more general definition uses `sup` when the spectrum is nonempty.
The laboratory's finite matrices can use their complex eigenvalues.
An empty real spectrum must not be silently treated as the complex spectrum.

If the spectral radius is less than one, the powers tend to zero in norm.
This conclusion does not require every intermediate power or state norm to decrease.
The matrix in the user's study is a separate illustrative model:

```text
A = [[0.6, 2], [0, 0.6]]
v0 = [0, 1]
A^n v0 = [2 n (0.6)^(n-1), (0.6)^n], for n >= 1.
```

Its Euclidean state norms begin `1`, `2.08806130`, `2.42684981`, and `2.17077313`.
The largest value occurs at step 2, followed by eventual decay.
This is transient amplification in a stable nonnormal example.
It is not evidence that a ship, boss, or numerical integrator has the same response.

The relation `P²=P` defines an idempotent. It does not require an orthogonal projection.
Orthogonality needs additional inner-product structure and conditions such as self-adjointness.
The channel selector `P=diag(1,0)` is orthogonal in the usual Euclidean inner product.
Other idempotent matrices need not be orthogonal.

The relation `J²=I` defines an involution in the example.
The book explains its orientation terminology through particular operators on the unit circle.
An arbitrary channel swap does not establish the orientation of a game surface.
A projective boundary identification is not the same operation as a linear projection matrix.
No projection example creates a harmless projectile sheet or a second collider.

## Sound composition order

Chronological order and algebraic product order run in opposite directions under function composition.
Gate followed by reverb is `R(G(x))`, or `RGx`.
Reverb followed by gate is `G(R(x))`, or `GRx`.
Thus, `RGx-GRx` is `-[G,R]x` under the book's convention.

A fixed time-dependent gate is multiplication by a fixed envelope.
A fixed finite convolution is a linear reverb model.
Both can be bounded linear maps on a finite sample space.
Their operation-order difference is a valid finite linear example.
The source sound and final gain must stay the same in both paths.

A constant scalar gate commutes with a fixed linear reverb.
This supplies a useful positive control against the claim that every pair must differ.
Compatible scalar linear time-invariant convolutions can also commute.
The chapter title does not imply that all convolution pairs fail to commute.

Distortion such as `tanh` is nonlinear.
Filter-then-distortion and distortion-then-filter can differ, but this does not place distortion in a Banach algebra of bounded linear operators.
Call this an operation-order experiment. Do not apply linear spectral theorems to it without a new model and assumptions.

## Mechanics, locality, and numerical methods

The equation `M y'' + C y' + K y = F(t)` comes from mechanics and control theory.
The book does not prescribe its mass, damping, stiffness, or perceptual interpretation.
The laboratory must identify its units, input, response model, and numerical method separately.
Measured settling or overshoot does not establish perceived weight.

Allan's local principle concerns a defined family of algebra homomorphisms.
It does not state that successful tests of separate encounter parts prove that the full encounter is correct.
Inspecting parts, interfaces, and the composite is a production analogy.
Human recognition requires separate observations.

The sequence-stability definition concerns approximate inverse problems.
It does not directly certify a frame-time animation solver.
Variable-frame tests must use the actual model, inputs, time units, and solver.
A display clamp can bound the drawn effect while the unclamped mathematical model remains unstable.
Report those two facts separately.

## STE reference review

The local Issue 8 reference removes the previous lack of dictionary access.
It does not establish that Issue 8 and Issue 9 are identical.
This task did not compare the issues or complete an Issue 9 dictionary review.
No project instruction file was changed.

| Local Issue 8 pages | Applied content |
|---|---|
| PDF 45-46; printed `1-1-1` to `1-1-2` | Approved words, part of speech, meaning, and technical-name categories |
| PDF 65 and 69; printed `1-3-1` and `1-3-5` | Approved verb forms and active voice |
| PDF 81 and 85; printed `1-5-1` and `1-5-5` | Short procedures, one instruction, imperative form, conditions, and informational notes |
| PDF 87; printed `1-6-1` | Descriptive sentence and paragraph limits |
| PDF 123; printed `2-0-3` | Dictionary layout and interpretation of approved entries |
| PDF 176, 182, and 391 | Focused entries for `CHECK`, `COMPARE`, and `TEST` |

The dictionary approves `CHECK` and `TEST` as nouns, not general verbs.
It approves `COMPARE` as a verb.
Use formulations such as “Do a check,” “Do a test,” “Examine,” or “Measure” when their meanings apply.
Required identifiers, paths, formulas, names, and user data retain their exact forms.
This focused review does not establish full ASD-STE100 conformity.

## Source access record

- Book: `D:/Projects/misc/apps/CompassionAnchor/[Universitext ] Steffen Roch, Pedro A. Santos, Bernd Silbermann (auth.) - Non-commutative Gelfand Theories_ A Tool-kit for Operator Theorists and Numerical Analysts (2011, Springer) [10.1007_978-0-85729-183-7] - li.pdf`
- STE: `C:/Users/André/Downloads/[ASD STE100 2021-8] Group of authors - (2021, ASD, AeroSpace and Defence Industries Association of Europe) - libgen.li.pdf`

The video links did not supply playable audio or a complete transcript during this review.
The supplied video studies remain user reference material.
This review makes no claim to have heard or transcribed those videos.
