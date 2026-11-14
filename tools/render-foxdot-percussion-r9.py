"""Increase only the retained percussion events by ten decibels."""
import argparse
import array
import importlib.util
import json
import math
from pathlib import Path
import re
import subprocess
import sys
import time
import wave

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'audio/stc-study/foxdot-percussion-r9'
PRIOR = ROOT / 'audio/stc-study/foxdot-operator-r8'
PERCUSSION_GAIN_DB = 10
PERCUSSION_GAIN = 10 ** (PERCUSSION_GAIN_DB / 20)
BASE = ROOT / 'audio/stc-study/foxdot-bass-r7/room_mix.wav'
EARLIER = ROOT / 'reports/stc-study-r5/ass-identified-return-r5-stereo-music.wav'
SC = Path('G:/Music Tools/SuperCollider/App/SuperCollider')
SCRATCH = Path('G:/Music Projects/Arrow Space Shift/scratch/identified-return-r9')
FFMPEG = Path('G:/Music Tools/FFmpeg/python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v9.0.2.exe')
RATE, FRAMES, ROOM_GAIN = 48000, 3678806, .11


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


helpers = load('r9_audio_helpers', ROOT / 'tools/render-foxdot-room.py')


def run(command, log, cwd):
    started = time.monotonic()
    result = subprocess.run([str(item) for item in command], cwd=cwd, capture_output=True, timeout=180)
    log.write_bytes(result.stdout + result.stderr)
    if result.returncode:
        raise RuntimeError(f'Native command failed. Read {log}.')
    return {'command': [str(item) for item in command], 'exit_code': result.returncode,
            'elapsed_seconds': round(time.monotonic() - started, 3)}


def read_pcm16(path):
    with wave.open(str(path), 'rb') as file:
        header = (file.getnchannels(), file.getframerate(), file.getsampwidth(), file.getnframes())
        if header != (2, RATE, 2, FRAMES):
            raise ValueError('The retained foundation format or frame count changed.')
        samples = array.array('h', file.readframes(FRAMES))
    if sys.byteorder != 'little': samples.byteswap()
    return samples


def score_bytes(authored):
    definitions = [OUTPUT / (name + '.scsyndef') for name in ['assR8Harmony', 'assR8Mechanism', 'assR8LayerProcessor']]
    start = helpers.osc_message('/s_new', ['assR8LayerProcessor', 1001, 1, 0, 'gateLevel', 0.0])
    for path in reversed(definitions):
        start = helpers.osc_message('/d_recv', [path.read_bytes(), start])
    score = helpers.osc_bundle(0, [start])
    messages = []
    for event in authored['events']:
        notes = event['notes'] if event['instrument'] == 'harmony' else [event['midi']]
        for note_index, midi in enumerate(notes):
            frequency = 440 * 2 ** ((midi - 69) / 12)
            synth = 'assR8Harmony' if event['instrument'] == 'harmony' else 'assR8Mechanism'
            values = [synth, 2000 + len(messages), 0, 0, 'freq', frequency, 'amp', float(event['amp']) * (PERCUSSION_GAIN if event['instrument'] == 'mechanism' else 1),
                      'dur', float(event['duration']), 'pan', float(event['pan'])]
            if event['instrument'] == 'harmony':
                values += ['cutoff', float(event['cutoff'])]
            messages.append((event['time'], helpers.osc_message('/s_new', values)))
    for event in authored['gate_events']:
        messages.append((event['time'], helpers.osc_message('/n_set', [1001, 'gateLevel', float(event['level'])])))
    for timestamp, message in sorted(messages, key=lambda item: item[0]):
        score += helpers.osc_bundle(timestamp, [message])
    score += helpers.osc_bundle(FRAMES / RATE, [helpers.osc_message('/g_freeAll', [0])])
    score += helpers.osc_bundle(FRAMES / RATE + .01, [helpers.osc_message('/c_set', [0, 0])])
    return score


def interval_rms(values, start, end):
    part = values[int(start * RATE) * 2:int(end * RATE) * 2]
    return math.sqrt(sum(value * value for value in part) / max(1, len(part)))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sc-root', type=Path, default=SC)
    parser.add_argument('--scratch', type=Path, default=SCRATCH)
    parser.add_argument('--ffmpeg', type=Path, default=FFMPEG)
    parser.add_argument('--gain', type=float, default=1)
    parser.add_argument('--layer-gain', type=float, default=1.25)
    args = parser.parse_args()
    if not 0 < args.gain <= 1 or not 0 < args.layer_gain <= 4:
        raise ValueError('Use output gain in (0,1] and layer gain in (0,4].')
    OUTPUT.mkdir(exist_ok=True)
    args.scratch.mkdir(parents=True, exist_ok=True)
    composer = load('r9_foxdot_composer', OUTPUT / 'compose.py')
    authored = composer.author_score()
    (OUTPUT / 'foxdot-score.json').write_text(json.dumps(authored, indent=2) + '\n', encoding='utf-8')
    preserved = [BASE, EARLIER, ROOT / 'audio/stc-study/foxdot-bass-r7/dry_take.wav', ROOT / 'audio/stc-study/foxdot-bass-r7/room_return.wav']
    preserved += [path for path in PRIOR.rglob('*') if path.is_file() and '__pycache__' not in path.parts]
    before = {path.relative_to(ROOT).as_posix(): helpers.sha256(path) for path in preserved}
    compiled = run([args.sc_root / 'sclang.exe', '-a', '--include-path', args.sc_root / 'SCClassLibrary',
                    '-D', '-u', '57144', OUTPUT / 'operator_track.scd', OUTPUT.as_posix()], OUTPUT / 'sclang.log', args.scratch)
    if 'ASS_OPERATOR_R8_SYNTHDEFS_WRITTEN' not in (OUTPUT / 'sclang.log').read_text(errors='replace'):
        raise RuntimeError('The SynthDef marker is missing.')
    score = OUTPUT / 'operator-track-score.osc'
    score.write_bytes(score_bytes(authored))
    raw = args.scratch / 'r9-layers-8ch-float.wav'
    native = run([args.sc_root / 'scsynth.exe', '-N', score, '_', raw, RATE, 'WAV', 'float', '-o', 8,
                  '-i', 0, '-z', 64, '-m', 65536], OUTPUT / 'scsynth-nrt.log', args.scratch)
    log = (OUTPUT / 'scsynth-nrt.log').read_text(errors='replace').lower()
    failures = ['alloc failed', 'failure in server', 'synthdef not found', 'exception in graphdef', 'out of memory', 'nan in']
    if any(value in log for value in failures):
        raise RuntimeError('The native synthesis log contains a failure.')
    channels, rate, raw_values = helpers.read_float_wav(raw)
    if channels != 8 or rate != RATE or len(raw_values) < FRAMES * 8:
        raise ValueError('The native render interval or format is wrong.')
    base_pcm = read_pcm16(BASE)
    base = array.array('f', (value / 32768 for value in base_pcm))
    direct, percussion, first, second = [array.array('f') for _ in range(4)]
    new, candidate = array.array('f'), array.array('f')
    start = .04 + 4 * 240 / 134
    gap_start, gap_end = [.04 + bar * 240 / 134 for bar in [31.5, 32]]
    end = FRAMES / RATE
    crossfade_seconds = .02
    for frame in range(FRAMES):
        timestamp = frame / RATE
        mask = min(1, max(0, (timestamp - start) / .02), max(0, (end - timestamp - 1 / RATE) / .25))
        if gap_start - .02 < timestamp < gap_start:
            mask *= (gap_start - timestamp) / .02
        elif gap_start <= timestamp <= gap_end:
            mask = 0
        elif gap_end < timestamp < gap_end + .02:
            mask *= (timestamp - gap_end) / .02
        order = min(1, max(0, (timestamp - gap_end) / crossfade_seconds))
        for channel in range(2):
            values = [raw_values[frame * 8 + channel + pair * 2] for pair in range(4)]
            if not all(math.isfinite(value) for value in values):
                raise ValueError('The native output contains a non-finite sample.')
            d, p = [value * mask * args.layer_gain for value in values[:2]]
            a, b = [value * mask * args.layer_gain * ROOM_GAIN for value in values[2:]]
            layer = d + p + a * (1 - order) + b * order
            direct.append(d); percussion.append(p); first.append(a); second.append(b)
            new.append(layer); candidate.append(base[frame * 2 + channel] + layer)
    active = [(.04 + 12 * 240 / 134, .04 + 28 * 240 / 134), (.04 + 32 * 240 / 134, .04 + 40 * 240 / 134)]
    base_active = math.sqrt(sum(interval_rms(base, a, b) ** 2 * (b - a) for a, b in active) / sum(b - a for a, b in active))
    new_active = math.sqrt(sum(interval_rms(new, a, b) ** 2 * (b - a) for a, b in active) / sum(b - a for a, b in active))
    difference = math.sqrt(sum((a - b) ** 2 for a, b in zip(first, second)) / len(first))
    outputs = []
    files = [('ass-identified-return-r9-music.wav', candidate), ('foundation-control.wav', base), ('new-layer.wav', new),
             ('harmony-direct.wav', direct), ('mechanical-response.wav', percussion),
             ('gate-room-proof.wav', first), ('room-gate-proof.wav', second)]
    for name, values in files:
        outputs.append(helpers.write_pcm16(OUTPUT / name, (value * args.gain for value in values), FRAMES, RATE))
    unchanged = ['harmony-direct.wav', 'gate-room-proof.wav', 'room-gate-proof.wav', 'foundation-control.wav']
    for name in unchanged:
        if helpers.sha256(OUTPUT / name) != helpers.sha256(PRIOR / name):
            raise RuntimeError(f'An unrelated component changed: {name}.')
    previous_candidate = read_pcm16(PRIOR / 'ass-identified-return-r8-music.wav')
    current_candidate = read_pcm16(OUTPUT / 'ass-identified-return-r9-music.wav')
    previous_percussion = read_pcm16(PRIOR / 'mechanical-response.wav')
    current_percussion = read_pcm16(OUTPUT / 'mechanical-response.wav')
    delta_error = max(abs((a-b)-(c-d)) for a,b,c,d in zip(current_candidate, previous_candidate, current_percussion, previous_percussion))
    percussion_scale_error = max(abs(a - PERCUSSION_GAIN*b) for a,b in zip(current_percussion, previous_percussion))
    previous_percussion_rms = math.sqrt(sum(value*value for value in previous_percussion)/len(previous_percussion))
    current_percussion_rms = math.sqrt(sum(value*value for value in current_percussion)/len(current_percussion))
    percussion_gain_measured = 20 * math.log10(current_percussion_rms / previous_percussion_rms)
    if delta_error > 2 or percussion_scale_error > 3 or abs(percussion_gain_measured - PERCUSSION_GAIN_DB) > .02:
        raise RuntimeError('The percussion-only output comparison failed.')
    loudness = {}
    for name in ['ass-identified-return-r9-music.wav', 'foundation-control.wav', 'new-layer.wav']:
        target = OUTPUT / (Path(name).stem + '-loudness.txt')
        run([args.ffmpeg, '-hide_banner', '-i', OUTPUT / name, '-filter_complex', 'ebur128=peak=true', '-f', 'null', '-'], target, args.scratch)
        tail = target.read_text(errors='replace').split('Summary:')[-1]
        integrated = re.search(r'I:\s+(-?[\d.]+) LUFS', tail)
        true_peak = re.search(r'Peak:\s+(-?[\d.]+) dBFS', tail)
        loudness[name] = {'integrated_lufs': float(integrated.group(1)) if integrated else None,
                          'true_peak_dbfs': float(true_peak.group(1)) if true_peak else None, 'log': target.name}
    after = {path.relative_to(ROOT).as_posix(): helpers.sha256(path) for path in preserved}
    if before != after:
        raise RuntimeError('A retained source file changed.')
    manifest = {'revision': 'identified-return-r9', 'bpm': 134, 'bars': 40, 'origin_seconds': .04,
        'frames': FRAMES, 'sample_rate': RATE, 'duration': end, 'common_gain': args.gain,
        'base_source': {'file': BASE.relative_to(ROOT).as_posix(), 'sha256': before[BASE.relative_to(ROOT).as_posix()]},
        'preserved_sources': [{'file': key, 'sha256': value, 'unchanged': True} for key, value in after.items()],
        'compile': compiled, 'native': native, 'rt_memory_kib': 65536, 'native_failures': [], 'foxdot': authored['foxdot'],
        'sources': {name: helpers.sha256(OUTPUT / name) for name in ['compose.py', 'operator_track.scd', 'foxdot-score.json', 'operator-track-score.osc']},
        'renderer_sha256': helpers.sha256(Path(__file__)), 'outputs': outputs,
        'r8_control_source': {'file': (PRIOR / 'ass-identified-return-r8-music.wav').relative_to(ROOT).as_posix(), 'sha256': before[(PRIOR / 'ass-identified-return-r8-music.wav').relative_to(ROOT).as_posix()]},
        'percussion_revision': {'source_gain_db': PERCUSSION_GAIN_DB, 'source_gain': PERCUSSION_GAIN, 'changed_field': 'Only mechanism-event amp before native synthesis.',
            'native_amp_events': [{'id': event['id'], 'source_amp': event['amp'], 'native_amp': event['amp'] * PERCUSSION_GAIN} for event in authored['events'] if event['instrument'] == 'mechanism'], 'same_foxdot_score': helpers.sha256(OUTPUT / 'foxdot-score.json') == helpers.sha256(PRIOR / 'foxdot-score.json'), 'same_supercollider_source': helpers.sha256(OUTPUT / 'operator_track.scd') == helpers.sha256(PRIOR / 'operator_track.scd')},
        'layer_mix': {'layer_gain': args.layer_gain, 'harmony_room_gain': ROOM_GAIN, 'gate_smoothing_seconds': .02,
            'order_before_bar32': 'gate then room (R after G)', 'order_after_bar32': 'room then gate (G after R)',
            'order_crossfade_seconds': .02, 'foundation_room_gain_retained': .12,
            'common_gain_policy': 'Apply one linear final gain to the foundation, new layer, candidate, and all proof stems. No independent normalization.'},
        'gap_windows_seconds': [[0, start], [gap_start, gap_end]],
        'mask': {'fade_seconds': .02, 'final_fade_seconds': .25, 'applies_to': 'All new direct and room components only.'},
        'measurements': {'base_active_rms': base_active, 'new_layer_active_rms': new_active,
            'layer_to_base_active_db': 20 * math.log10(max(1e-15, new_active) / base_active),
            'ordered_room_difference_rms': difference, 'loudness': loudness,
            'r9_r8_delta_max_pcm_units': delta_error,
            'percussion_scale_max_pcm_units': percussion_scale_error,
            'percussion_gain_measured_db': percussion_gain_measured,
            'unchanged_r8_components': {name: helpers.sha256(OUTPUT / name) for name in unchanged},
            'pre_pcm_additive_identity': 'candidate = foundation + new-layer',
            'new_layer_reconstruction': 'harmony-direct + mechanical-response + selected ordered-room proof; 20 ms crossfade at bar 32.'},
        'limits': 'Music review candidate. No live FoxDot Clock, REAPER render, HRTF, gameplay cue, simulation change, physical-device, human listening, or seamless-loop claim.'}
    (OUTPUT / 'render-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'outputs': outputs, 'measurements': manifest['measurements']}, indent=2))


if __name__ == '__main__':
    main()
