"""Author the finite comparison input with installed FoxDot Patterns."""
import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def author_input():
    spec = importlib.util.spec_from_file_location('operator_pattern_loader', ROOT / 'audio/stc-study/foxdot-room-r6/foxdot_take.py')
    loader = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loader)
    Pattern, provenance = loader.load_pattern_api()
    notes = Pattern([41, 44, 48, 51])
    onsets = Pattern(list(range(16))) * .5 + .04
    levels = Pattern([.17, .14, .15, .13])
    events = [{'index': i, 'time': float(onsets[i]), 'midi': int(notes[i]),
               'amp': float(levels[i]), 'duration': .31} for i in range(16)]
    return {'revision': 'stc-operator-lab-r1', 'seconds': 12, 'sampleRate': 48000,
            'events': events, 'foxdot': {**provenance,
                'role': 'Author the original four-note input motif and finite onset sequence.',
                'original_composition_authored_with_foxdot': True},
            'limits': 'Finite offline pattern evaluation. No live FoxDot Clock or game event clock.'}
