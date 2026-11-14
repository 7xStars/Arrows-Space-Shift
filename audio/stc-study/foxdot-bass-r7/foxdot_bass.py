"""Author a finite stereo pan sequence with installed FoxDot Pattern classes."""
import importlib.util
import math
from pathlib import Path


def author_pan(steps=640, bpm=134, depth=.85):
    source = Path(__file__).resolve().parent.parent / 'foxdot-room-r6/foxdot_take.py'
    spec = importlib.util.spec_from_file_location('foxdot_r7_pattern_loader', source)
    loader = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loader)
    Pattern, provenance = loader.load_pattern_api()
    provenance = {**provenance, 'role': 'Author and evaluate the finite r7 pan trajectory with FoxDot Pattern arithmetic.',
                  'pan_pattern_authored_with_foxdot': True}
    pans = Pattern([math.cos(index * 2 * math.pi / 64) for index in range(64)]) * -depth
    onsets = Pattern(list(range(steps))) * (15 / bpm)
    events = [{'index': index, 'beat': index / 4, 'seconds': .04 + float(onsets[index]),
               'pan': float(pans[index])} for index in range(steps)]
    return {'bpm': bpm, 'bars_per_cycle': 4, 'beats_per_leg': 8, 'pan_depth': depth,
            'time_origin_seconds': .04, 'step_seconds': 15 / bpm,
            'smoothing_seconds': .025, 'events': events, 'foxdot': provenance,
            'role': 'FoxDot Pattern arithmetic authors a four-bar cosine pan sequence for the isolated acid upper path. The original notes and instrument sources are retained.'}
