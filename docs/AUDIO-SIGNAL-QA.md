# Audio signal verification

Candidate: `0.25.1-dev.4`.
Browser: isolated headless Microsoft Edge `157.0.4341.46` on Windows.
Result: 14 checks passed. No page exception or failed asset response occurred.

## Purpose

A running source does not prove that sound reaches the output.
This check measures decoded PCM and signals after the native audio gains.
It covers the title, the Act I tutorial, and actual manual firing.
It also uses mute and zero volume as silent controls.

## Method

The test uses a new browser context and its own local server.
Ordinary pointer and keyboard actions start the game and change settings.
The test does not use a QA level selector or write simulation state.
It does not change the user's browser, saved game, sound settings, or output device.

Native `AnalyserNode` instances sample the master, music, effects, ambience, core, and atmosphere gains.
The observer keeps every original audio connection intact.
Each observer branch has a zero-gain connection to the destination.
That branch permits signal processing but adds no audible signal.
The native decoded buffers are also measured for nonzero PCM.

The source implementation connects the master to the native audio destination.
The signal measurements are taken before that hardware output boundary.
They cannot establish speaker volume, tab mute, system mixer state, output-device selection, or physical sound.
They must not be reported as a human listening test.

## Results

The following values are linear sample amplitudes.
RMS is measured in short analysis windows. It is not an integrated loudness value.

| Case | Measured point | Peak | Maximum window RMS |
|---|---|---:|---:|
| Title with default preferences | After master gain | 0.1288704 | 0.0825223 |
| Act I tutorial without firing | After master gain | 0.1217255 | 0.0511098 |
| Actual manual firing | Effects bus | 0.0254003 | 0.0057065 |
| Speaker mute | After master gain | 0 | 0 |
| Speaker enabled during flight | After master gain | 0.1231014 | 0.0508052 |
| Master volume at zero | Music bus | 0.2036285 | 0.0967859 |
| Master volume at zero | After master gain | 0 | 0 |
| Master volume restored | After master gain | 0.2236252 | 0.0933459 |

The title PCM, title music bus, and title master signal were nonzero.
The campaign music and master signals were nonzero.
Manual Space input produced a nonzero effects signal.
Mute produced a zero master signal and saved the sound preference as off.
Enabling sound restored the current campaign recording.
One audio context served all these actions.

The zero-volume control is an important boundary case.
It retained a playing recording and a nonzero music bus, but its master output was zero.
Thus, a playing-source assertion alone cannot establish useful audio output.

## Reproduce

```powershell
node tools/audio-signal-browser.mjs . reports/mute-investigation/signal-browser
```

The test requires the project's Playwright setup and Microsoft Edge.
The test records its source hashes, browser version, native diagnostics, settings, and signal values.
It closes its isolated browser and local server after the check.

Browser command-line inspection was unavailable in this run.
The native protocol reported that `--enable-automation` was not set.
The test therefore does not claim an observed list of headless audio flags.
Headless output behavior is separate from the user's normal browser.

## Limits

This is one title and early-campaign signal check.
It does not cover every Act, every mix, physical latency, or full campaign acceptance.
No production audio or gameplay code was changed for this diagnostic.
No music master was changed.
The English text received a clarity review.
A full ASD-STE100 dictionary and editorial conformity review was not completed.
