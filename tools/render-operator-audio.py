"""Render and measure the bounded operator-order sound comparisons."""
import argparse
import array
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import struct
import subprocess
import time
import wave

ROOT = Path(__file__).resolve().parent.parent
AUTHOR = ROOT / 'audio/stc-operator-lab-r1'
DEFAULT_SC = Path('G:/Music Tools/SuperCollider/App/SuperCollider')
SCRATCH = Path('G:/Music Projects/Arrow Space Shift/scratch/operator-lab-r1/audio')
RATE, SECONDS = 48000, 12
NONLINEAR_FAMILY_TRIM = .08
CLIPS = [
    ('dry', 'Original input', 'reference', []),
    ('gate-room', 'Gate then room', 'gate-room', ['gate', 'room']),
    ('room-gate', 'Room then gate', 'gate-room', ['room', 'gate']),
    ('transfer-gate-room', 'Shifted gate then room', 'transfer-gate-room', ['gate', 'room']),
    ('transfer-room-gate', 'Room then shifted gate', 'transfer-gate-room', ['room', 'gate']),
    ('filter-drive', 'Filter then saturation', 'filter-drive', ['filter', 'saturation']),
    ('drive-filter', 'Saturation then filter', 'filter-drive', ['saturation', 'filter']),
    ('constant-gate-room', 'Constant gain then room', 'constant-gate-room', ['constant-gain', 'room']),
    ('room-constant-gate', 'Room then constant gain', 'constant-gate-room', ['room', 'constant-gain']),
]


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


helpers = load_module('operator_audio_helpers', ROOT / 'tools/render-foxdot-room.py')
composer = load_module('operator_audio_composer', AUTHOR / 'compose.py')


def run(command, log, cwd):
    result = subprocess.run([str(x) for x in command], cwd=cwd, capture_output=True, timeout=120)
    log.write_bytes(result.stdout + result.stderr)
    if result.returncode:
        raise RuntimeError(f'Native command returned {result.returncode}. Read {log}.')
    return {'command': [str(x) for x in command], 'exit_code': result.returncode}


def score_bytes(authored):
    mix = helpers.osc_message('/s_new', ['assOperatorCompare', 1001, 1, 0])
    voice = AUTHOR / 'assOperatorVoice.scsyndef'
    comparison = AUTHOR / 'assOperatorCompare.scsyndef'
    init = helpers.osc_message('/d_recv', [voice.read_bytes(), helpers.osc_message('/d_recv', [comparison.read_bytes(), mix])])
    value = helpers.osc_bundle(0, [init])
    for event in authored['events']:
        frequency = 440.0 * 2 ** ((event['midi'] - 69) / 12)
        value += helpers.osc_bundle(event['time'], [helpers.osc_message('/s_new',
                 ['assOperatorVoice', 2000 + event['index'], 0, 0, 'freq', frequency, 'amp', event['amp'], 'dur', event['duration']])])
    value += helpers.osc_bundle(SECONDS, [helpers.osc_message('/g_freeAll', [0])])
    value += helpers.osc_bundle(SECONDS + .01, [helpers.osc_message('/c_set', [0, 0])])
    return value


def window_energy(values, windows):
    return sum(value * value for start, end in windows for value in values[int(start * RATE) * 2:int(end * RATE) * 2])


def difference(first, second):
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(first, second)) / len(first))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sc-root', type=Path, default=DEFAULT_SC)
    parser.add_argument('--scratch', type=Path, default=SCRATCH)
    parser.add_argument('--diagnostic-low-memory', action='store_true', help='Compare the accepted room with a deliberately small RT-memory control.')
    args = parser.parse_args()
    AUTHOR.mkdir(exist_ok=True)
    args.scratch.mkdir(parents=True, exist_ok=True)
    authored = composer.author_input()
    (AUTHOR / 'foxdot-input.json').write_text(json.dumps(authored, indent=2) + '\n', encoding='utf-8')
    compile_result = run([args.sc_root / 'sclang.exe', '-a', '--include-path', args.sc_root / 'SCClassLibrary', '-D', '-u', '57141',
                          AUTHOR / 'operators.scd', AUTHOR.as_posix()], AUTHOR / 'sclang.log', args.scratch)
    if 'ASS_OPERATOR_SYNTHDEFS_WRITTEN' not in (AUTHOR / 'sclang.log').read_text(errors='replace'):
        raise RuntimeError('The SynthDef completion marker is missing.')
    score = AUTHOR / 'operator-score.osc'
    score.write_bytes(score_bytes(authored))
    output_channels = len(CLIPS) * 2
    raw = args.scratch / f'operator-comparisons-{output_channels}ch-float.wav'
    started = time.monotonic()
    native = run([args.sc_root / 'scsynth.exe', '-N', score, '_', raw, str(RATE), 'WAV', 'float', '-o', str(output_channels), '-i', '0', '-z', '64', '-m', '65536'],
                 AUTHOR / 'scsynth.log', args.scratch)
    log = (AUTHOR / 'scsynth.log').read_text(errors='replace')
    if any(text.lower() in log.lower() for text in ['FAILURE IN SERVER', 'SynthDef not found', 'exception in GraphDef', 'alloc failed', 'out of memory']):
        raise RuntimeError('The server reported a synthesis failure.')
    channels, rate, data = helpers.read_float_wav(raw)
    frames = RATE * SECONDS
    if channels != output_channels or rate != RATE or len(data) // output_channels < frames:
        raise ValueError('The native output interval or format is not valid.')
    values = [array.array('f') for _ in CLIPS]
    trims = [NONLINEAR_FAMILY_TRIM if item[2] == 'filter-drive' else 1.0 for item in CLIPS]
    peak = raw_peak = 0.0
    for frame in range(frames):
        fade = min(1, frame / (RATE * .01), max(0, (frames - 1 - frame) / (RATE * .25)))
        for index in range(len(CLIPS)):
            for channel in range(2):
                value = float(data[frame * output_channels + index * 2 + channel]) * fade
                if not math.isfinite(value): raise ValueError('The comparison contains a non-finite sample.')
                values[index].append(value)
                raw_peak = max(raw_peak, abs(value))
                peak = max(peak, abs(value * trims[index]))
    common_gain = min(8.0, .78 / peak)
    results = []
    for index, (identifier, title, pair, order) in enumerate(CLIPS):
        metrics = helpers.write_pcm16(AUTHOR / (identifier + '.wav'), (value * trims[index] * common_gain for value in values[index]), frames, RATE)
        results.append({'id': identifier, 'title': title, 'file': metrics['file'], 'pair': pair, 'order': order,
                        'transfer': identifier.startswith('transfer-'), 'familyTrim': trims[index], 'metrics': metrics})
    standard_windows = [(1.15 + 2 * i, 1.8 + 2 * i) for i in range(4)]
    transfer_windows = [(.45 + 2 * i, 1.3 + 2 * i) for i in range(4)]
    standard = [window_energy(values[i], standard_windows) for i in (1, 2)]
    transfer = [window_energy(values[i], transfer_windows) for i in (3, 4)]
    comparisons = {
        'gate-room': {'difference_rms_before_common_gain': difference(values[1], values[2]),
                      'closed_gate_windows_seconds': standard_windows, 'gate_then_room_energy': standard[0],
                      'room_then_gate_energy': standard[1], 'tail_energy_ratio': standard[0] / standard[1] if standard[1] else None,
                      'zero_denominator': standard[1] == 0},
        'transfer-gate-room': {'difference_rms_before_common_gain': difference(values[3], values[4]),
                      'closed_gate_windows_seconds': transfer_windows, 'gate_then_room_energy': transfer[0],
                      'room_then_gate_energy': transfer[1], 'tail_energy_ratio': transfer[0] / transfer[1] if transfer[1] else None,
                      'zero_denominator': transfer[1] == 0},
        'filter-drive': {'difference_rms_before_common_gain': difference(values[5], values[6]),
                         'linear_operator_claim': False},
        'constant-gate-room': {'difference_rms_before_common_gain': difference(values[7], values[8]),
                              'expected_commutation': True, 'constant_gain': .5},
    }
    for key in ['gate-room', 'transfer-gate-room']:
        comparison = comparisons[key]
        if comparison['gate_then_room_energy'] <= max(.0001, comparison['room_then_gate_energy'] * 100):
            raise ValueError('The selected closed-gate windows do not discriminate the operator orders.')
    if min(comparisons[key]['difference_rms_before_common_gain'] for key in ['gate-room', 'transfer-gate-room', 'filter-drive']) <= .0001:
        raise ValueError('An ordered comparison lacks a measured difference.')
    if comparisons['constant-gate-room']['difference_rms_before_common_gain'] > 1e-7:
        raise ValueError('Constant gain does not commute with the implemented linear room within tolerance.')
    diagnostic = None
    if args.diagnostic_low_memory:
        folder = AUTHOR / 'diagnostics'
        folder.mkdir(exist_ok=True)
        failed_raw = args.scratch / 'low-memory-control-18ch-float.wav'
        command = [args.sc_root / 'scsynth.exe', '-N', score, '_', failed_raw, str(RATE), 'WAV', 'float',
                   '-o', str(output_channels), '-i', '0', '-z', '64', '-m', '8192']
        control = run(command, folder / 'low-memory-control.log', args.scratch)
        control_text = (folder / 'low-memory-control.log').read_text(errors='replace')
        if 'alloc failed' not in control_text.lower():
            raise RuntimeError('The low-memory diagnostic did not reproduce its expected allocation failure.')
        control_channels, control_rate, control_data = helpers.read_float_wav(failed_raw)
        if control_channels != output_channels or control_rate != RATE:
            raise RuntimeError('The low-memory diagnostic has an unexpected output format.')
        first = [control_data[frame * output_channels + 14] for frame in range(frames)]
        second = [control_data[frame * output_channels + 16] for frame in range(frames)]
        control_difference = difference(first, second)
        if control_difference <= 1e-7:
            raise RuntimeError('The low-memory diagnostic did not reproduce the scalar-control discrepancy.')
        diagnostic = {'native_exit_code': control['exit_code'], 'rt_memory_kib': 8192,
                      'allocation_failures': control_text.lower().count('alloc failed'),
                      'constant_control_difference_rms': control_difference,
                      'accepted_render_rt_memory_kib': 65536,
                      'accepted_control_difference_rms': comparisons['constant-gate-room']['difference_rms_before_common_gain'],
                      'operator_source_sha256': helpers.sha256(AUTHOR / 'operators.scd'),
                      'interpretation': 'Exit zero alone does not establish a valid render. Missing delay allocations caused a false scalar-control difference. This degraded control is not delivered as an accepted audio clip.'}
        (folder / 'result.json').write_text(json.dumps(diagnostic, indent=2) + '\n', encoding='utf-8')
    elif (AUTHOR / 'diagnostics/result.json').is_file():
        prior = json.loads((AUTHOR / 'diagnostics/result.json').read_text(encoding='utf-8'))
        if prior.get('operator_source_sha256') == helpers.sha256(AUTHOR / 'operators.scd'):
            diagnostic = prior
    catalog = {'revision': 'stc-operator-lab-r1', 'seconds': SECONDS, 'sampleRate': RATE, 'commonGain': common_gain,
               'clips': [{key: item[key] for key in ['id', 'title', 'file', 'pair', 'order', 'transfer', 'familyTrim']} for item in results]}
    (AUTHOR / 'catalog.json').write_text(json.dumps(catalog, indent=2) + '\n', encoding='utf-8')
    manifest = {'revision': catalog['revision'], 'seconds': SECONDS, 'frames': frames, 'sample_rate': RATE,
                'common_gain': common_gain, 'foxdot': authored['foxdot'], 'compile': compile_result, 'native': native,
                'family_trims': {item[0]: trims[i] for i, item in enumerate(CLIPS)},
                'gain_order': 'Apply the same fixed 0.08 family trim to both nonlinear paths. Then apply one common gain to all nine outputs. No independent A/B normalization.',
                'native_raw_peak': raw_peak, 'peak_after_family_trim_before_common_gain': peak,
                'native_seconds': round(time.monotonic() - started, 3),
                'supercollider': subprocess.run([str(args.sc_root / 'scsynth.exe'), '-v'], capture_output=True).stdout.decode(errors='replace').strip(),
                'source_sha256': helpers.sha256(AUTHOR / 'foxdot-input.json'), 'clips': results, 'comparisons': comparisons,
                'sources': {name: helpers.sha256(AUTHOR / name) for name in ['compose.py', 'operators.scd', 'foxdot-input.json', 'operator-score.osc']},
                'renderer_sha256': helpers.sha256(Path(__file__)),
                'rt_memory_kib': 65536, 'diagnostic_low_memory': diagnostic,
                'diagnostic_run_in_this_invocation': args.diagnostic_low_memory,
                'composition_notation': 'Gate then room is R after G, or R∘G. Room then gate is G after R, or G∘R. The reported RMS is the norm of their output difference; it does not assign a commutator sign.',
                'operators': {'gate': {'rate_hz': .5, 'phase': 0, 'duty': .45, 'smooth_seconds': .005},
                              'transfer_gate': {'rate_hz': .5, 'phase': .25, 'duty': .35, 'smooth_seconds': .005},
                              'room': 'Fixed linear 80 Hz HPF/4600 Hz LPF, six delay taps, stable 0.113-second comb with 1.3-second decay, and direct signal.',
                              'filter': 'Linear 260 Hz low-pass filter.', 'saturation': 'Pointwise tanh of 10 times the input.',
                              'constant_gate': 'Scalar multiplication by 0.5; it commutes with the fixed linear room.'},
                'limits': 'Finite original offline input. Linear gate/room composition is distinct from the nonlinear filter/saturation example. No global operator theorem, topology equivalence, gameplay authority, live FoxDot Clock, REAPER use, HRTF, listening, or physical-device claim.'}
    (AUTHOR / 'render-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'clips': len(results), 'seconds_each': SECONDS, 'common_gain': common_gain, 'comparisons': comparisons}, indent=2))


if __name__ == '__main__': main()
