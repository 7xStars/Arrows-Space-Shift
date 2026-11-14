# Binaural title-theme candidate

Study: `stc-study-r5`.
Score: `identified-return-r5-binaural`.
Baseline: `stc-study-r4`, 226 passing tests.
Date: November 13, 2026.

## Implemented change

The user approved binaural positioning for three parts of the current piece.
The implementation uses six native Web Audio HRTF routes.
The listener stays fixed. There is no head tracking.

| Part | Routing |
|---|---|
| Kick | The main body stays centered. Selected upper punch and click layers alternate between front positions. An upper reflection uses a rear position. |
| Sustained hum | The two existing sine drone voices follow slow paths around the listener. |
| Repeated notes | The existing acid voice follows a restrained front arc. |

A complementary first-order crossover separates selected kick layers at 180 Hz.
Its low branch remains on the centered route.
The filters have gradual slopes. They do not impose an absolute frequency boundary.
The primary kick body retains its direct route.

Position ramps use the musical steps and audio clock.
The page offers `Headphones · binaural` and `Speakers · stereo`.
The speaker option changes the native panners to `equalpower`.
It bypasses HRTF processing without creating a second musical instance.
These choices remain in the current session.
The study does not write campaign settings or progress.

The authoritative entry and crossing cues keep their existing stereo paths.
Their actual positions and identity meanings remain unchanged.
Game motion, damage, attack timing, and save rules remain unchanged.
The 640 score steps, note data, rhythm, articulation, and section definitions match r4.
No new binaural-beat frequency difference was added.

The [Web Audio HRTF documentation](https://developer.mozilla.org/en-US/docs/Web/API/PannerNode/panningModel) describes the selected processor.
The browser supplies its response data. No external audio asset was added.

## Review files

- [Full binaural track](../reports/stc-study-r5/ass-identified-return-r5-binaural-music.wav).
- [Quiet-break sample](../reports/stc-study-r5/ass-identified-return-r5-binaural-break.wav).
- [Stereo comparison](../reports/stc-study-r5/ass-identified-return-r5-stereo-music.wav).
- [Binaural entry/return mix](../reports/stc-study-r5/ass-identified-return-r5-binaural-crossing-mix.wav).

Use headphones for the binaural file.
The 11-second sample takes seconds 49 to 60 from the full render.
It has short edge fades for audition. It is not a loop.
The full musical form remains about 71.64 seconds with a two-second ending interval.
The native renders are stereo 48 kHz PCM.
Master gain is 1.0. Bus gains remain music 0.55, effects 0.80, and ambience 0.25.
No loudness normalization was applied.
The files use the same instruments and routing as the live study.
The event mix uses synthetic presentation times and actual kernel mappings.
It is not a gameplay recording.

## Executed verification

| Check | Result |
|---|---|
| `npm run check` | 229 passed; 0 failed; 0 skipped; 54 source/tool syntax checks |
| Focused audio suite | 10 tests passed |
| `node tools/stc-study-browser.mjs` on the source | 56 checks passed; no page exceptions, missing resources, or campaign-storage writes |
| The same browser command on the extracted PLAY archive | 56 checks passed; the tested runtime matches the final archive |
| Packaged campaign comparison | 32 existing browser checks passed |
| Archive entry and Game link | Two startup checks passed |
| Extracted SOURCE archive | 229 tests passed; 2,093 preserved files passed their hash checks |
| `node tools/verify-hrtf-render.mjs` | Native HRTF filtering and interaural timing verified against an equal-power control |
| `node tools/render-stc-study.mjs` | Three native renders passed finite-sample and full-scale checks |
| Decoded WAV checks | Four review files have valid stereo 48 kHz PCM and no full-scale samples |
| Baseline preservation | Nine r4 source snapshots and three review-file hashes passed |
| Existing preserved workspace | 2,093 files passed their hash checks |

The full binaural render measured about -3.04 dBFS sample peak.
FFmpeg measured -14.6 LUFS integrated loudness and about -3.0 dBFS true peak.
The stereo comparison measured about -3.09 dBFS sample peak.
The event mix measured about -3.17 dBFS sample peak.
Each native render reached 11 transient voices and 25 active sources.
No requested voice was rejected in these fixtures.
The six spatial nodes are reused. Pause and reset dispose them.

The native impulse check used the same signal and off-center position in both models.
Equal-power processing retained one impulse sample per channel.
HRTF processing produced a filter response and different channel peak times.
This establishes native processing. It does not establish a listener's perceived location.
The compact Options dialog uses normal vertical scrolling.
The release folder is `releases/stc-study-r5/`.
It contains separate PLAY and SOURCE archives, file counts, sizes, and SHA-256 values.

## Scope and remaining review

The current piece remains a title-screen candidate in the separate study.
This revision does not install it on the campaign title screen.
It does not compose the rest of the campaign.
Earlier campaign and r4 study archives remain intact.
Headphone localization, musical preference, and physical-device performance remain open.
The change has not been published.

The writing uses short sentences and consistent terms.
Full ASD-STE100 dictionary and editorial review remain incomplete.
