"""Compose original tempo studies with the installed FoxDot Pattern API."""
import importlib.util
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FOLDER = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location('tempo_pattern_composer', ROOT / 'audio/stc-act-library-r1/compose.py')
BASE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BASE)
DEFAULTS = {'kick_decay': .36, 'kick_gain': .48, 'snare_gain': .17, 'hat_gain': .055,
            'room_mix': .10, 'snare_decay': .16, 'bass_gate': .95, 'pan_cycle_beats': 16,
            'swell_gain': 0, 'swell_duration': 10, 'swell_every_beats': 64,
            'swell_pan_depth': 0, 'swell_pan_cycle_beats': 32,
            'atmos_pan_depth': 0, 'atmos_pan_cycle_beats': 24}
BOUNDS = {'kick_decay': (.08, .5), 'kick_gain': (.1, .8), 'snare_gain': (0, .4),
          'hat_gain': (0, .15), 'room_mix': (0, .18), 'snare_decay': (.04, .3),
          'bass_gate': (.4, 1.2), 'pan_cycle_beats': (8, 64),
          'swell_gain': (0, .08), 'swell_duration': (8, 14), 'swell_every_beats': (32, 128),
          'swell_pan_depth': (0, 1), 'swell_pan_cycle_beats': (8, 128),
          'atmos_pan_depth': (0, .9), 'atmos_pan_cycle_beats': (8, 128)}


def parameters(track):
    result = {name: track.get(name, value) for name, value in DEFAULTS.items()}
    for name, value in result.items():
        low, high = BOUNDS[name]
        if not isinstance(value, (float, int)) or not math.isfinite(value) or not low <= value <= high:
            raise ValueError(f'Invalid production parameter: {name}.')
    return result


def definitions():
    tracks = []
    for name in ['act12.json', 'act34.json']:
        tracks.extend(json.loads((FOLDER / name).read_text(encoding='utf-8')))
    for track in tracks:
        if track['seconds'] != 120 or not 120 <= track['bpm'] <= 240:
            raise ValueError('Tempo studies require 120 seconds and 120–240 BPM.')
        parameters(track)
    return sorted(tracks, key=lambda item: (item['act'], item['slot']))


def compose(track):
    """Use new note cells and forms, then set tempo-specific voice envelopes."""
    sound = parameters(track)
    score = BASE.compose(track)
    for event in score['events']:
        if event['kind'] == 'Kick':
            event['amp'] *= sound['kick_gain'] / .48
            event['dur'] = sound['kick_decay']
        elif event['kind'] == 'Snare':
            event['amp'] *= sound['snare_gain'] / .17
            event['dur'] = sound['snare_decay']
        elif event['kind'] == 'Hat':
            event['amp'] *= sound['hat_gain'] / .055
        elif event['kind'] == 'Bass':
            event['dur'] *= sound['bass_gate'] / .95
        event['amp'] = round(event['amp'], 8)
    if sound['swell_gain'] > 0:
        beat = 60 / track['bpm']
        start, index = .04 + 16 * beat, 0
        while start + sound['swell_duration'] < track['seconds'] - 3:
            part = BASE.section_at(track, start)
            chord = track['chords'][index % len(track['chords'])]
            for voice, midi in enumerate(chord[-2:]):
                score['events'].append({'time': round(start, 8), 'kind': 'Swell',
                    'amp': round(sound['swell_gain'] * .7 * (.55 + .45 * part['energy']), 8),
                    'midi': midi, 'dur': sound['swell_duration'], 'pan': voice,
                    'depth': sound['swell_pan_depth'], 'cycle': beat * sound['swell_pan_cycle_beats'],
                    'seed': track['seed'] + 1000000 + index * 37 + voice})
            start += beat * sound['swell_every_beats']
            index += 1
        score['events'].sort(key=lambda event: (event['time'], event['kind']))
    score['production_parameters'] = sound
    score['revision'] = 'stc-tempo-r2'
    score['mix_revision'] = 'r2b'
    score['foxdot']['role'] = 'Compose new finite note, rhythm, and phrase transformations for the original tempo studies.'
    return score
