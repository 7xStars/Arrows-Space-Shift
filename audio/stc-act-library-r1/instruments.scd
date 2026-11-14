// Compile original instruments for the finite FoxDot scores.
(
var folder = thisProcess.argv.at(0);
SynthDef(\assLibKick, { |out=16, amp=0.5, seed=1|
    var env, freq, body, click;
    RandSeed.ir(1, seed);
    env = EnvGen.ar(Env.perc(0.001, 0.48, 1, -5), doneAction: 2);
    freq = EnvGen.ar(Env([175, 52, 45], [0.035, 0.28], [-8, -3]));
    body = (SinOsc.ar(freq) * 2.6).tanh * env;
    click = HPF.ar(WhiteNoise.ar, 1800) * EnvGen.ar(Env.perc(0.0005, 0.016)) * 0.2;
    Out.ar(out, Pan2.ar((body + click) * amp, 0));
    Out.ar(20, env * amp * 2);
}).writeDefFile(folder);
SynthDef(\assLibBass, { |out=22, freq=87.3, amp=0.23, dur=0.16, cutoff=700, drive=2, act=1|
    var env, raw, filtered, low, upper, sub, pan;
    env = EnvGen.ar(Env.perc(0.004, dur.max(0.045), 1, -4), doneAction: 2);
    raw = (Saw.ar(freq) * 0.65) + (Pulse.ar(freq, 0.42) * (0.035 + (act * 0.018)));
    filtered = RLPF.ar(raw, (cutoff + (env * cutoff * 1.6)).clip(110, 6000), (0.22 - (act * 0.02)).max(0.09));
    filtered = LPF.ar((filtered * drive).tanh, 2600);
    low = LPF.ar(filtered, 120);
    upper = filtered - low;
    sub = SinOsc.ar((freq * 0.5).max(27)) * 0.24;
    pan = In.kr(0, 1);
    Out.ar(out, (Pan2.ar(low + sub, 0) + Pan2.ar(upper, pan)) * env * amp);
}).writeDefFile(folder);
SynthDef(\assLibHat, { |out=16, amp=0.06, dur=0.06, pan=0, seed=1|
    var env;
    RandSeed.ir(1, seed);
    env = EnvGen.ar(Env.perc(0.001, dur, 1, -6), doneAction: 2);
    Out.ar(out, Pan2.ar(HPF.ar(WhiteNoise.ar, 6800) * env * amp, pan));
}).writeDefFile(folder);
SynthDef(\assLibSnare, { |out=16, amp=0.13, seed=1|
    var env, noise, body;
    RandSeed.ir(1, seed);
    env = EnvGen.ar(Env.perc(0.002, 0.2, 1, -5), doneAction: 2);
    noise = BPF.ar(WhiteNoise.ar, 1800, 1.1) + (HPF.ar(WhiteNoise.ar, 600) * 0.3);
    body = SinOsc.ar(EnvGen.ar(Env([210, 125], [0.055], -4))) * 0.55;
    Out.ar(out, Pan2.ar((noise + body).tanh * env * amp, 0));
}).writeDefFile(folder);
SynthDef(\assLibMetal, { |out=16, freq=310, amp=0.07, pan=0, drive=1.5, dur=0.17|
    var env, tone;
    env = EnvGen.ar(Env.perc(0.001, dur, 1, -5), doneAction: 2);
    tone = SinOsc.ar(freq * [1, 1.414, 2.71]).sum * 0.3;
    tone = HPF.ar(LPF.ar((tone * drive).tanh, 3800), 350);
    Out.ar(out, Pan2.ar(tone * env * amp, pan));
}).writeDefFile(folder);
SynthDef(\assLibStab, { |out=16, freq=220, amp=0.045, pan=0, dur=0.4|
    var env, tone;
    env = EnvGen.ar(Env.perc(0.006, dur, 1, -4), doneAction: 2);
    tone = LPF.ar((Saw.ar(freq) * 0.3) + (SinOsc.ar(freq) * 0.5), 1400);
    Out.ar(out, Pan2.ar(tone * env * amp, pan));
}).writeDefFile(folder);
SynthDef(\assLibPad, { |out=18, freq=220, amp=0.025, dur=6, pan=0, seed=1, cutoff=1500|
    var env, tone, motion;
    RandSeed.ir(1, seed);
    env = EnvGen.ar(Env.linen(1.2, (dur - 3.2).max(0.3), 2), doneAction: 2);
    motion = LFNoise1.kr(0.071).range(0.75, 1.3);
    tone = (SinOsc.ar(freq * [0.998, 1.002]).sum * 0.33) + (LFTri.ar(freq * 0.5) * 0.12);
    tone = LPF.ar(tone, cutoff * motion);
    Out.ar(out, Pan2.ar(tone * env * amp, (pan + (LFNoise1.kr(0.047) * 0.12)).clip(-0.8, 0.8)));
}).writeDefFile(folder);
SynthDef(\assLibNoise, { |out=18, amp=0.012, dur=4, pan=0, seed=1|
    var env, tone;
    RandSeed.ir(1, seed);
    env = EnvGen.ar(Env.linen(0.7, (dur - 1.7).max(0.1), 1), doneAction: 2);
    tone = BPF.ar(PinkNoise.ar, LFNoise1.kr(0.11).exprange(450, 2400), 0.24);
    Out.ar(out, Pan2.ar(tone * env * amp, pan));
}).writeDefFile(folder);
SynthDef(\assLibPan, { |bpm=134, depth=0.7|
    Out.kr(0, SinOsc.kr(bpm / 960, pi / 2) * depth.neg);
}).writeDefFile(folder);
SynthDef(\assLibMix, { |core=16, atmosphere=18, bpm=134|
    var rhythm, air, coreDelay, airRoom, kick;
    kick = In.ar(20, 1).clip(0, 1);
    rhythm = In.ar(core, 2) + (In.ar(22, 2) * (1 - (kick * 0.52)));
    air = In.ar(atmosphere, 2) * (1 - (kick * 0.15));
    coreDelay = DelayC.ar(LPF.ar(HPF.ar(rhythm, 420), 2100).reverse, 1, [45 / bpm, 75 / bpm]) * 0.055;
    airRoom = CombC.ar(LPF.ar(HPF.ar(air, 250), 4200), 0.2, [0.071, 0.097], 2.5) * 0.12;
    airRoom = AllpassC.ar(airRoom, 0.15, [0.043, 0.067], 0.6);
    Out.ar(0, rhythm + coreDelay);
    Out.ar(2, air + airRoom);
}).writeDefFile(folder);
"ASS_ACT_LIBRARY_SYNTHDEFS_WRITTEN".postln;
0.exit;
)
