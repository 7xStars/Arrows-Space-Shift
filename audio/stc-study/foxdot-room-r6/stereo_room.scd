// Compile the sample player and original room processor for offline rendering.
(
var outputFolder = thisProcess.argv.at(0);
SynthDef(\assStereoRoomR6, { |out=0, buf=0, gain=1, rate=1|
    var dry, send, pre, early, late, wet;
    var combTimes = #[0.0297, 0.0371, 0.0411, 0.0437, 0.0531, 0.0617];
    var allpassTimes = #[0.031, 0.043, 0.059, 0.071];
    dry = PlayBuf.ar(2, buf, BufRateScale.kr(buf) * rate, loop: 0) * gain;
    send = LPF.ar(HPF.ar(dry, 220), 4800);
    pre = DelayN.ar(send, 0.25, 0.030);
    early = (DelayN.ar(pre, 0.25, [0.021, 0.029]) * 0.55)
        + (DelayN.ar(pre.reverse, 0.25, [0.052, 0.061]) * 0.38)
        + (DelayN.ar(pre, 0.25, [0.087, 0.103]) * 0.25)
        + (DelayN.ar(pre.reverse, 0.25, [0.137, 0.157]) * 0.18);
    late = Array.fill(6, { |i| CombC.ar(pre, 0.12, combTimes[i], 2.2) }).sum * 0.28;
    4.do({ |i| late = AllpassC.ar(late, 0.12, allpassTimes[i], 0.5) });
    wet = LPF.ar(HPF.ar((early * 0.75) + (late * 0.65), 220), 4800) * 1.5;
    Out.ar(out, dry);
    Out.ar(out + 2, wet);
}).writeDefFile(outputFolder);
"ASS_ROOM_R6_SYNTHDEF_WRITTEN".postln;
0.exit;
)
