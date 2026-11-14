// Render added voices. The retained foundation uses a separate file.
(
var folder = thisProcess.argv.at(0);
SynthDef(\assR8Harmony, { |out=32, freq=220, amp=0.025, dur=4, pan=0, cutoff=1600|
    var envelope, tone;
    envelope = EnvGen.ar(Env.linen(0.16, dur, 0.7, 1, -4), doneAction: 2);
    tone = (SinOsc.ar(freq) * 0.7) + (VarSaw.ar(freq, 0, 0.42) * 0.22)
        + (SinOsc.ar(freq * 2) * 0.08);
    tone = LPF.ar(HPF.ar(tone, 180), cutoff);
    Out.ar(out, Pan2.ar(LeakDC.ar(tone) * envelope * amp, pan));
}).writeDefFile(folder);
SynthDef(\assR8Mechanism, { |out=34, freq=220, amp=0.025, dur=0.18, pan=0|
    var envelope, body, edge;
    envelope = EnvGen.ar(Env.perc(0.003, dur, 1, -5), doneAction: 2);
    body = SinOsc.ar(freq * (1 + (envelope * 0.05))) * 0.65;
    edge = (SinOsc.ar(freq * 2.13) * 0.22) + (SinOsc.ar(freq * 3.47) * 0.13);
    Out.ar(out, Pan2.ar(HPF.ar(body + edge, 220) * envelope * amp, pan));
}).writeDefFile(folder);
SynthDef(\assR8LayerProcessor, { |harmonyBus=32, mechanismBus=34, gateLevel=0|
    var source, gate, direct, percussion, gateRoom, roomGate, room;
    room = { |input|
        var send, pre, early, diffuse;
        send = LPF.ar(HPF.ar(input, 260), 3800);
        pre = DelayN.ar(send, 0.15, 0.027);
        early = (DelayN.ar(pre, 0.2, [0.037, 0.049]) * 0.45)
            + (DelayN.ar(pre.reverse, 0.2, [0.079, 0.103]) * 0.3)
            + (DelayN.ar(pre, 0.2, [0.137, 0.157]) * 0.18);
        diffuse = (CombC.ar(pre, 0.12, [0.067, 0.083], 1.25) * 0.3)
            + (CombC.ar(pre.reverse, 0.12, [0.097, 0.109], 1.25) * 0.2);
        LPF.ar(HPF.ar(early + diffuse, 260), 3800)
    };
    source = In.ar(harmonyBus, 2);
    percussion = In.ar(mechanismBus, 2);
    gate = LagUD.kr(gateLevel, 0.02, 0.02);
    direct = source * gate;
    gateRoom = room.value(direct);
    roomGate = room.value(source) * gate;
    Out.ar(0, direct);
    Out.ar(2, percussion);
    Out.ar(4, gateRoom);
    Out.ar(6, roomGate);
}).writeDefFile(folder);
"ASS_OPERATOR_R8_SYNTHDEFS_WRITTEN".postln;
0.exit;
)
