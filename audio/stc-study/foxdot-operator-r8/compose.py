"""Author the finite r8 additions with installed FoxDot Patterns."""
import importlib.util
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parent
BPM, BARS, ORIGIN = 134, 40, .04
STEP_SECONDS = 15 / BPM
BAR_SECONDS = 16 * STEP_SECONDS
BASE_VOICING = (53, 56, 60, 63)
ALTERNATE_VOICING = (56, 60, 63, 65)


def _patterns():
    source = ROOT.parent / 'foxdot-room-r6/foxdot_take.py'
    spec = importlib.util.spec_from_file_location('foxdot_r8_pattern_loader', source)
    loader = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loader)
    return loader.load_pattern_api()


def _transient():
    operator = ((.6, 2), (0, .6))
    state = [0., 1.]
    trajectory = []
    for step in range(9):
        trajectory.append({'step': step, 'state': list(state), 'norm': math.hypot(*state)})
        state = [sum(row[i] * state[i] for i in range(2)) for row in operator]
    maximum = max(item['norm'] for item in trajectory)
    selected = [0, 2, 6]
    return {'matrix': [list(row) for row in operator], 'initial_state': [0, 1],
            'trajectory': trajectory, 'selected_steps': selected,
            'normalized_gains': [trajectory[step]['norm'] / maximum for step in selected],
            'gain_bound': 1., 'mapping': 'Divide selected state norms by the maximum norm in the finite trajectory.',
            'limit': 'This is a bounded musical gain mapping. It is not a model of physical percussion or ship movement.'}


def author_score():
    Pattern, provenance = _patterns()
    transient = _transient()
    events = []
    harmony_bars = Pattern([12, 16, 20, 24, 28, 32, 36])
    harmony_onsets = harmony_bars * BAR_SECONDS + ORIGIN
    voicings = [Pattern(list(BASE_VOICING)), Pattern(list(ALTERNATE_VOICING))]
    harmony_levels = Pattern([.045, .048, .050, .048, .035, .050, .047])
    harmony_pans = Pattern([-.13, .13, -.13, .13, 0, -.13, .13])
    harmony_cutoffs = Pattern([1150, 1300, 1450, 1600, 1050, 1450, 1300])
    for index in range(7):
        bar = int(harmony_bars[index])
        notes = voicings[int(bar >= 20)]
        events.append({'id': f'harmony-{index:02d}', 'instrument': 'harmony',
                       'bar': bar, 'step': 0., 'time': float(harmony_onsets[index]),
                       'duration': 2.5 * BAR_SECONDS, 'amp': float(harmony_levels[index]),
                       'pan': float(harmony_pans[index]), 'cutoff': float(harmony_cutoffs[index]),
                       'notes': [int(notes[n]) for n in range(4)],
                       'operation': 'pitch-class persistence through a change of voicing'})

    answer_bars = Pattern([4, 8, 12, 16, 20, 24, 32, 36])
    answer_steps = Pattern([6.5, 10.5, 6.5, 10.5, 6.5, 10.5, 10.5, 6.5])
    answer_onsets = (answer_bars * 16 + answer_steps) * STEP_SECONDS + ORIGIN
    answer_notes = Pattern([53, 60, 56, 53, 60, 56, 53, 60])
    answer_pans = Pattern([-.20, .20, -.15, .15])
    answer_levels = Pattern([.036, .032, .035, .032])
    for index in range(8):
        events.append({'id': f'mechanism-answer-{index:02d}', 'instrument': 'mechanism',
                       'bar': int(answer_bars[index]), 'step': float(answer_steps[index]),
                       'time': float(answer_onsets[index]), 'duration': .12,
                       'amp': float(answer_levels[index]), 'pan': float(answer_pans[index]),
                       'midi': int(answer_notes[index]), 'operation': 'sparse interlocking answer'})

    response_bars = Pattern([11, 19, 27, 35])
    response_steps = Pattern([5.5, 9.5, 13.5])
    response_gains = Pattern(transient['normalized_gains']) * .062
    response_notes = Pattern([60, 56, 53])
    response_pans = Pattern([-.16, .08, .16])
    for phrase in range(4):
        bar = int(response_bars[phrase])
        onsets = (response_steps + bar * 16) * STEP_SECONDS + ORIGIN
        for hit in range(3):
            events.append({'id': f'mechanism-response-{phrase:02d}-{hit}', 'instrument': 'mechanism',
                           'bar': bar, 'step': float(response_steps[hit]), 'time': float(onsets[hit]),
                           'duration': .14, 'amp': float(response_gains[hit]),
                           'pan': float(response_pans[hit]), 'midi': int(response_notes[hit]),
                           'response_step': transient['selected_steps'][hit],
                           'normalized_gain': transient['normalized_gains'][hit],
                           'operation': 'bounded transient rise and recovery'})

    gate_levels = Pattern([1, 1, 0, 1, 1, 0, 1, 0])
    gate_times = Pattern(list(range(BARS * 8))) * (2 * STEP_SECONDS) + ORIGIN
    gate_events = [{'time': 0., 'level': 0., 'order': 'gate-room'}]
    for index in range(BARS * 8):
        position = index / 8
        level = 0. if 31.5 <= position < 32 else float(gate_levels[index])
        gate_events.append({'time': float(gate_times[index]), 'level': level,
                            'order': 'gate-room' if position < 32 else 'room-gate'})
    gate_events.append({'time': ORIGIN + BARS * BAR_SECONDS, 'level': 0., 'order': 'room-gate'})
    events.sort(key=lambda event: (event['time'], event['id']))
    return {'revision': 'identified-return-r8', 'bpm': BPM, 'bars': BARS,
            'origin_seconds': ORIGIN, 'step_seconds': STEP_SECONDS,
            'bar_seconds': BAR_SECONDS, 'form_end_seconds': ORIGIN + BARS * BAR_SECONDS,
            'events': events, 'gate_events': gate_events,
            'gate_smoothing_seconds': .020,
            'silence_intervals': [{'from_bar': 31.5, 'to_bar': 32.,
                                  'from_seconds': ORIGIN + 31.5 * BAR_SECONDS,
                                  'to_seconds': ORIGIN + 32 * BAR_SECONDS}],
            'sections': [{'from_bar': 0, 'to_bar': 32, 'order': 'gate-room',
                          'notation': 'R(G(x))', 'meaning': 'The allowed signal leaves a room tail.'},
                         {'from_bar': 32, 'to_bar': 40, 'order': 'room-gate',
                          'notation': 'G(R(x))', 'meaning': 'The gate interrupts the room response.'}],
            'harmony_pitch_classes': sorted({note % 12 for note in BASE_VOICING}),
            'transient_model': transient,
            'foxdot': {**provenance, 'original_composition_authored_with_foxdot': True,
                       'role': 'Author the new harmony, percussion, gate, and pan event Patterns. The retained foundation predates this score.'},
            'limits': 'Finite offline events. No live FoxDot Clock, gameplay event authority, physical response claim, or listening approval. The native processor must mask all added components during the declared gap.'}
