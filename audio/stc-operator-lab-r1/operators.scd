// Render the same source through explicitly ordered processors.
(
var folder = thisProcess.argv.at(0);
SynthDef(\assOperatorVoice, { |out=32, freq=110, amp=0.15, dur=0.31|
    var env, tone;
    env = EnvGen.ar(Env.perc(0.006, dur, 1, -4), doneAction: 2);
    tone = (Saw.ar(freq) * 0.7) + (SinOsc.ar(freq) * 0.3);
    tone = LPF.ar(tone, 450 + (env * 1800));
    Out.ar(out, tone * env * amp);
}).writeDefFile(folder);
SynthDef(\assOperatorCompare, { |input=32|
    var source, gate, transferGate, room, dry, gateRoom, roomGate, transferGateRoom, transferRoomGate, filterDrive, driveFilter, constantGateRoom, roomConstantGate;
    source = In.ar(input, 1);
    gate = LagUD.ar(LFPulse.ar(0.5, 0, 0.45), 0.005, 0.005);
    transferGate = LagUD.ar(LFPulse.ar(0.5, 0.25, 0.35), 0.005, 0.005);
    room = { |signal|
        var filtered, taps, diffuse;
        filtered = LPF.ar(HPF.ar(signal, 80), 4600);
        taps = (DelayN.ar(filtered, 1.5, 0.073) * 0.35)
            + (DelayN.ar(filtered, 1.5, 0.157) * 0.28)
            + (DelayN.ar(filtered, 1.5, 0.293) * 0.23)
            + (DelayN.ar(filtered, 1.5, 0.467) * 0.18)
            + (DelayN.ar(filtered, 1.5, 0.95) * 0.55)
            + (DelayN.ar(filtered, 1.5, 1.21) * 0.35);
        diffuse = CombC.ar(filtered, 0.2, 0.113, 1.3) * 0.45;
        (signal * 0.5) + taps + diffuse
    };
    dry = source;
    gateRoom = room.value(source * gate);
    roomGate = room.value(source) * gate;
    transferGateRoom = room.value(source * transferGate);
    transferRoomGate = room.value(source) * transferGate;
    filterDrive = (LPF.ar(source, 260) * 10).tanh;
    driveFilter = LPF.ar((source * 10).tanh, 260);
    constantGateRoom = room.value(source * 0.5);
    roomConstantGate = room.value(source) * 0.5;
    [dry, gateRoom, roomGate, transferGateRoom, transferRoomGate, filterDrive, driveFilter, constantGateRoom, roomConstantGate].do({ |signal, i|
        Out.ar(i * 2, Pan2.ar(signal, 0));
    });
}).writeDefFile(folder);
"ASS_OPERATOR_SYNTHDEFS_WRITTEN".postln;
0.exit;
)
