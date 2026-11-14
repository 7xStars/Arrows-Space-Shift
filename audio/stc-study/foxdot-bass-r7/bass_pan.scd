// Render the captured source stems and the FoxDot pan sequence without an audio device.
(
var outputFolder = thisProcess.argv.at(0);
SynthDef(\assBassPanR7, { |out=0, fixedBuf=0, acidBuf=1, pan=(-0.85)|
    var fixed, acid, low, upper, upperPan, lowCenter, panned, centered, dry, control, room, controlRoom;
    var roomProcessor = { |input|
        var send, pre, early, late;
        var combTimes = #[0.0297, 0.0371, 0.0411, 0.0437, 0.0531, 0.0617];
        var allpassTimes = #[0.031, 0.043, 0.059, 0.071];
        send = LPF.ar(HPF.ar(input, 220), 4800);
        pre = DelayN.ar(send, 0.25, 0.030);
        early = (DelayN.ar(pre, 0.25, [0.021, 0.029]) * 0.55)
            + (DelayN.ar(pre.reverse, 0.25, [0.052, 0.061]) * 0.38)
            + (DelayN.ar(pre, 0.25, [0.087, 0.103]) * 0.25)
            + (DelayN.ar(pre.reverse, 0.25, [0.137, 0.157]) * 0.18);
        late = Array.fill(6, { |i| CombC.ar(pre, 0.12, combTimes[i], 2.2) }).sum * 0.28;
        4.do({ |i| late = AllpassC.ar(late, 0.12, allpassTimes[i], 0.5) });
        LPF.ar(HPF.ar((early * 0.75) + (late * 0.65), 220), 4800) * 1.5
    };
    var safety = { |input|
        var detector = input[0].abs.max(input[1].abs);
        Compander.ar(input, detector, (-8).dbamp, 1, 0.125, 0.003, 0.09)
    };
    fixed = PlayBuf.ar(2, fixedBuf, BufRateScale.kr(fixedBuf), loop: 0);
    acid = PlayBuf.ar(1, acidBuf, BufRateScale.kr(acidBuf), loop: 0);
    low = LPF.ar(acid, 120);
    upper = acid - low;
    upperPan = Pan2.ar(upper, Lag.kr(pan, 0.025));
    lowCenter = Pan2.ar(low, 0);
    panned = fixed + lowCenter + upperPan;
    centered = fixed + lowCenter + Pan2.ar(upper, 0);
    dry = safety.value(panned);
    control = safety.value(centered);
    room = roomProcessor.value(dry);
    controlRoom = roomProcessor.value(control);
    Out.ar(out, dry);
    Out.ar(out + 2, room);
    Out.ar(out + 4, control);
    Out.ar(out + 6, controlRoom);
    Out.ar(out + 8, upperPan);
    Out.ar(out + 10, lowCenter);
}).writeDefFile(outputFolder);
"ASS_BASS_R7_SYNTHDEF_WRITTEN".postln;
0.exit;
)
