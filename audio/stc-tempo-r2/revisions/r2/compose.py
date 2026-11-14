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
            'room_mix': .10, 'snare_decay': .16, 'bass_gate': .95, 'pan_cycle_beats': 16}
BOUNDS = {'kick_decay': (.08, .5), 'kick_gain': (.1, .8), 'snare_gain': (0, .4),
          'hat_gain': (0, .15), 'room_mix': (0, .18), 'snare_decay': (.04, .3),
          'bass_gate': (.4, 1.2), 'pan_cycle_beats': (8, 64)}


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
    score['production_parameters'] = sound
    score['revision'] = 'stc-tempo-r2'
    score['foxdot']['role'] = 'Compose new finite note, rhythm, and phrase transformations for the original tempo studies.'
    return score
