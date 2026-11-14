"""Compose finite original note scores with installed FoxDot Patterns."""
import importlib
import importlib.util
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FOLDER = Path(__file__).resolve().parent


def pattern_api():
    spec = importlib.util.spec_from_file_location('library_foxdot_loader', ROOT / 'audio/stc-study/foxdot-room-r6/foxdot_take.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    Pattern, provenance = module.load_pattern_api()
    api = importlib.import_module('FoxDot.lib.Patterns')
    provenance = {**provenance, 'role': 'Compose note, rhythm, transformation, and irregular atmosphere events with installed FoxDot Pattern classes.',
                  'original_composition_authored_with_foxdot': True, 'realtime_scheduler_used': False}
    return Pattern, api.PRand, api.PWhite, provenance


def definitions():
    result = []
    for name in ['act12.json', 'act34.json']:
        result.extend(json.loads((FOLDER / name).read_text(encoding='utf-8')))
    return sorted(result, key=lambda track: (track['act'], track['slot']))


def section_at(track, time):
    return next((part for part in reversed(track['form']) if time / track['seconds'] >= part['at']), track['form'][0])


def transform(pattern, operation):
    if operation == 'rotate': return pattern.rotate(3)
    if operation == 'reverse': return pattern.reverse()
    if operation == 'reverse-rotate': return pattern.reverse().rotate(3)
    if operation == 'rotate-reverse': return pattern.rotate(3).reverse()
    return pattern


def voice_chord(notes, alternate=False):
    return sorted([notes[-1] - 12, *notes[:-1]]) if alternate else list(notes)


def compose(track):
    Pattern, PRand, PWhite, provenance = pattern_api()
    bpm, duration, seed = track['bpm'], track['seconds'], track['seed']
    step = 15 / bpm
    motif = Pattern(track['bass_motif'])
    gates = {name: Pattern([int(i in track[name + '_steps']) for i in range(16)]) for name in ['kick', 'snare', 'hat', 'metal']}
    roots = Pattern(track['harmony_roots'])
    event_pan = PWhite(-.55, .55, seed=seed + 7)
    variation = PRand([.84, .92, 1, 1.04], seed=seed + 11)
    events = []

    def emit(t, kind, amp, **parameters):
        if amp <= 0 or t >= duration - 3: return
        events.append({'time': round(t, 8), 'kind': kind, 'amp': round(float(amp), 7),
                       'seed': seed + len(events) * 17, **parameters})

    for index in range(math.ceil((duration - 3) / step)):
        t = .04 + index * step
        part = section_at(track, t)
        i, bar, phrase = index % 16, index // 16, index // 64
        energy = part['energy']
        drum_gain = part['drums'] * (.65 + .35 * energy)
        accent = 1 if i in (0, 3, 6, 10, 14) else .78
        bass = transform(motif, part['mutation'])[i]
        bass = getattr(bass, 'value', bass)
        if bass is not None:
            cutoff = track['cutoff_low'] + (track['cutoff_high'] - track['cutoff_low']) * (.5 + .5 * math.sin(index / 256 * math.pi * 2))
            emit(t, 'Bass', track['bass_gain'] * part['bass'] * accent,
                 midi=track['root_midi'] + 12 + int(bass) + int(roots[phrase]), dur=step * (1.65 if i in (6, 14) else .95),
                 cutoff=round(cutoff, 3), drive=track['drive'], act=track['act'], mutation=part['mutation'])
        if gates['kick'][i]: emit(t, 'Kick', .48 * drum_gain)
        if gates['snare'][i]: emit(t, 'Snare', .17 * drum_gain)
        if gates['hat'][i]: emit(t, 'Hat', .055 * drum_gain * float(variation[index]), dur=.13 if i == 14 else .045, pan=float(event_pan[index]))
        if gates['metal'][i]:
            emit(t, 'Metal', track['metal_gain'] * drum_gain, midi=62 + (i % 3) * 5, pan=float(event_pan[index + 3]), drive=track['drive'], dur=.13)
            if 'stutter' in track['operations'] and bar % 8 == 7:
                emit(t + step * .75, 'Metal', track['metal_gain'] * drum_gain * .42, midi=62 + (i % 3) * 5, pan=-float(event_pan[index + 3]), drive=track['drive'], dur=.08)
        if bar % 8 == 7 and i in (13, 15) and energy > .65:
            emit(t, 'Hat', .038 * drum_gain, dur=.035, pan=(-.3 if i == 13 else .3))
        if track['act'] == 3 and i == (10 if phrase % 2 else 2) and part['pads'] > 0:
            chord = track['chords'][phrase % len(track['chords'])]
            for midi in voice_chord(chord, part['mutation'] == 'voicing'):
                emit(t, 'Stab', track['pad_gain'] * part['pads'] * .42, midi=midi, dur=.35, pan=.22 if phrase % 2 else -.22)

    gaps = PWhite(*track['atmosphere_gap'], seed=seed + 31)
    pans = PWhite(-.55, .55, seed=seed + 41)
    choices = PRand([0, 1, 2], seed=seed + 53)
    t, index = 2.3 + seed % 7 * .17, 0
    while t < duration - 11:
        part = section_at(track, t)
        phrase = int(t * bpm / 60 / 16)
        chord = track['chords'][phrase % len(track['chords'])]
        chord = voice_chord(chord, part['mutation'] == 'voicing' and phrase % 2 == 1)
        for voice, midi in enumerate(chord):
            emit(t + voice * .035, 'Pad', track['pad_gain'] * part['pads'] * .42,
                 midi=midi, dur=6.2 + float(choices[index]) * .4, pan=float(pans[index + voice]), cutoff=1250 + 400 * part['energy'])
        if part['texture'] > 0:
            emit(t + .73, 'Noise', .032 * part['texture'], dur=3.4 + float(choices[index]) * .3, pan=-float(pans[index]))
        t += float(gaps[index])
        index += 1
    events.sort(key=lambda event: (event['time'], event['kind']))
    return {'track': track, 'foxdot': provenance, 'time_unit': 'seconds', 'note_unit': 'MIDI semitones',
            'events': events, 'tail_policy': 'Exact full duration includes a three-second fade and tail. This is not a seamless loop.',
            'clock': 'Finite offline score. Gameplay does not use this clock.'}


if __name__ == '__main__':
    output = FOLDER / 'scores'
    output.mkdir(exist_ok=True)
    for track in definitions():
        score = compose(track)
        (output / (track['id'] + '.json')).write_text(json.dumps(score, indent=2) + '\n', encoding='utf-8')
        print(track['id'], len(score['events']), 'events')
