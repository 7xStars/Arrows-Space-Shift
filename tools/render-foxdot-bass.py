"""Render the isolated acid voice with a FoxDot-authored stereo fade."""
import argparse
import array
import importlib.util
import json
import math
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'audio/stc-study/foxdot-bass-r7'
SC = Path('G:/Music Tools/SuperCollider/App/SuperCollider')
spec = importlib.util.spec_from_file_location('room_render_helpers', ROOT / 'tools/render-foxdot-room.py')
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)


def pan_proof(upper, low, rate, bpm):
    energy = {'left_leg': [0.0, 0.0], 'right_leg': [0.0, 0.0]}
    cycle = 16 * 60 / bpm
    low_difference = max(abs(low[i] - low[i+1]) for i in range(0, len(low), 2))
    for frame in range(int(8 * 4 * 60 / bpm * rate), min(len(upper)//2, int(27 * 4 * 60 / bpm * rate))):
        phase = ((frame / rate - .04) / cycle) % 1
        key = 'left_leg' if phase < .04 or phase > .96 else 'right_leg' if abs(phase - .5) < .04 else None
        if key:
            energy[key][0] += upper[frame*2]**2
            energy[key][1] += upper[frame*2+1]**2
    return {'low_max_channel_difference': low_difference, 'upper_energy_windows': energy,
            'left_window_left_to_right_energy': energy['left_leg'][0] / max(1e-30, energy['left_leg'][1]),
            'right_window_right_to_left_energy': energy['right_leg'][1] / max(1e-30, energy['right_leg'][0]),
            'method': 'SC output before the shared safety stage. Compare equal phase windows around the left and right endpoints in bars 8 through 27. The centered low channels must match.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--room-gain', type=float, default=.12)
    parser.add_argument('--output-gain', type=float, default=None)
    parser.add_argument('--sc-root', type=Path, default=SC)
    args = parser.parse_args()
    if not 0 <= args.room_gain <= 1 or (args.output_gain is not None and not .1 <= args.output_gain <= 2):
        raise ValueError('The room gain or shared output gain is outside its range.')
    OUTPUT.mkdir(parents=True, exist_ok=True)
    scratch = ROOT / '.local/foxdot-bass-r7'
    scratch.mkdir(parents=True, exist_ok=True)
    source_paths = [OUTPUT/'source-accompaniment.wav', OUTPUT/'source-acid-direct.wav']
    sources = [helpers.read_float_wav(path) for path in source_paths]
    if [(item[0], item[1]) for item in sources] != [(2, 48000), (1, 48000)]:
        raise ValueError('Use the aligned captured stereo accompaniment and mono acid source.')
    source_frames = len(sources[0][2]) // 2
    if len(sources[1][2]) != source_frames:
        raise ValueError('The source frame counts differ.')
    author_spec = importlib.util.spec_from_file_location('foxdot_bass_author', OUTPUT/'foxdot_bass.py')
    author = importlib.util.module_from_spec(author_spec)
    author_spec.loader.exec_module(author)
    authored = author.author_pan()
    (OUTPUT/'foxdot-pan-events.json').write_text(json.dumps(authored, indent=2)+'\n', encoding='utf-8')
    compiled = subprocess.run([str(args.sc_root/'sclang.exe'), '-a', '--include-path', str(args.sc_root/'SCClassLibrary'),
                               '-D', '-u', '57139', str(OUTPUT/'bass_pan.scd'), OUTPUT.as_posix()],
                              cwd=scratch, capture_output=True, timeout=60)
    (OUTPUT/'sclang.log').write_bytes(compiled.stdout + compiled.stderr)
    synth = OUTPUT/'assBassPanR7.scsyndef'
    if compiled.returncode or b'ASS_BASS_R7_SYNTHDEF_WRITTEN' not in compiled.stdout or not synth.is_file():
        raise RuntimeError('The SC compile failed. Read sclang.log.')
    play = helpers.osc_message('/s_new', ['assBassPanR7', 1000, 0, 0, 'fixedBuf', 0, 'acidBuf', 1,
                                          'pan', authored['events'][0]['pan']])
    acid_alloc = helpers.osc_message('/b_allocRead', [1, source_paths[1].as_posix(), 0, -1, play])
    fixed_alloc = helpers.osc_message('/b_allocRead', [0, source_paths[0].as_posix(), 0, -1, acid_alloc])
    define = helpers.osc_message('/d_recv', [synth.read_bytes(), fixed_alloc])
    score = helpers.osc_bundle(0, [define])
    for event in authored['events']:
        score += helpers.osc_bundle(event['seconds'], [helpers.osc_message('/n_set', [1000, 'pan', event['pan']])])
    frames, rate = source_frames + 3*48000, 48000
    duration = frames / rate
    score += helpers.osc_bundle(duration, [helpers.osc_message('/n_free', [1000])])
    score += helpers.osc_bundle(duration+.01, [helpers.osc_message('/b_free', [0]), helpers.osc_message('/b_free', [1])])
    score += helpers.osc_bundle(duration+.02, [helpers.osc_message('/c_set', [0, 0])])
    score_file = OUTPUT/'bass-score.osc'
    score_file.write_bytes(score)
    raw = scratch/'bass-render-12ch-float.wav'
    command = [str(args.sc_root/'scsynth.exe'), '-N', str(score_file), '_', str(raw), '48000', 'WAV', 'float', '-o', '12', '-i', '0', '-z', '64']
    started = time.monotonic()
    native = subprocess.run(command, cwd=scratch, capture_output=True, timeout=120)
    (OUTPUT/'scsynth-nrt.log').write_bytes(native.stdout + native.stderr)
    if native.returncode or not raw.is_file():
        raise RuntimeError('The native NRT render failed. Read scsynth-nrt.log.')
    channels, native_rate, samples = helpers.read_float_wav(raw)
    if (channels, native_rate) != (12, 48000) or len(samples)//channels < frames:
        raise ValueError('The native output does not have the expected channels or duration.')
    pairs = {name: array.array('f') for name in ['dry', 'room', 'control_dry', 'control_room', 'upper', 'low']}
    for frame in range(frames):
        fade = min(1, max(0, (frames-1-frame)/(rate*.25)))
        for pair, values in enumerate(pairs.values()):
            factor = fade if pair in (1, 3) else 1
            for channel in range(2):
                values.append(samples[frame*12 + pair*2 + channel] * factor)
    proof = pan_proof(pairs['upper'], pairs['low'], rate, authored['bpm'])
    if proof['low_max_channel_difference'] != 0 or min(proof['left_window_left_to_right_energy'], proof['right_window_right_to_left_energy']) < 20:
        raise ValueError('The native pan or centered-low proof failed.')
    initial_rms = math.sqrt(sum(value*value for value in pairs['dry'])/len(pairs['dry']))
    reference = json.loads((ROOT/'audio/stc-study/foxdot-room-r6/render-manifest.json').read_text())
    target_rms = next(item['rms'] for item in reference['outputs'] if item['file']=='dry_take.wav')
    before_peaks = {str(amount): max(abs(dry+amount*wet) for dry,wet in zip(pairs['dry'],pairs['room']))
                    for amount in (0, args.room_gain, 1)}
    matching_gain = target_rms/initial_rms
    safe_gain = .94/max(before_peaks.values())
    common_gain = args.output_gain if args.output_gain is not None else min(matching_gain,safe_gain,2)
    if max(before_peaks.values())*common_gain >= 1:
        raise ValueError('The shared output gain would clip a supported room mix.')
    outputs = []
    def write(name, values):
        metrics = helpers.write_pcm16(OUTPUT/name, values, frames, rate)
        outputs.append(metrics)
    write('dry_take.wav', (value*common_gain for value in pairs['dry']))
    write('room_return.wav', (value*common_gain for value in pairs['room']))
    write('room_mix.wav', ((dry+args.room_gain*wet)*common_gain for dry, wet in zip(pairs['dry'], pairs['room'])))
    write('centered_control.wav', ((dry+args.room_gain*wet)*common_gain for dry, wet in zip(pairs['control_dry'], pairs['control_room'])))
    write('bass_upper_pan.wav', pairs['upper'])
    write('bass_low_center.wav', pairs['low'])
    manifest = {'revision': 'bass-fade-r7', 'source_frames': source_frames, 'common_frames': frames,
                'sample_rate': rate, 'tail_seconds': 3, 'final_room_fade_seconds': .25,
                'room_gain': args.room_gain, 'shared_output_gain': common_gain,
                'level_calibration': {'initial_dry_rms': initial_rms, 'reference_r6_dry_rms': target_rms,
                    'matching_gain': matching_gain, 'maximum_gain_for_0_94_peak': safe_gain,
                    'selected_common_gain': common_gain,
                    'method': 'One linear common gain after the reconstructed shared safety path. Apply it equally to both runtime stems and both complete review variants. No independent normalization.',
                    'room_mix_peaks_before_gain': before_peaks,
                    'room_mix_peaks_after_gain': {key:value*common_gain for key,value in before_peaks.items()}},
                'room': {'same_timing_as': 'stereo-room-r6', 'predelay_seconds': .03, 'comb_decay_seconds': 2.2,
                         'highpass_hz': 220, 'lowpass_hz': 4800},
                'pan': {key: authored[key] for key in ['bpm','bars_per_cycle','beats_per_leg','pan_depth','smoothing_seconds']},
                'split': 'Only isolated acid direct: low = LPF(source, 120 Hz); upper = source - low. Center low. Pan upper with Pan2. Gradual filter response.',
                'mix': 'Fixed accompaniment + centered acid low + panned acid upper -> one shared stereo-linked Compander -> dry output. The room is a linear return from this dry output. The centered control has its own complete shared path. No separate instrument compression or stem normalization.',
                'safety': {'threshold_db': -8, 'slope_above': .125, 'clamp_seconds': .003, 'relax_seconds': .09},
                'sources': [{'file': path.name, 'sha256': helpers.sha256(path)} for path in source_paths],
                'source_capture': json.loads((OUTPUT/'source-capture.json').read_text()),
                'foxdot': authored['foxdot'], 'pan_proof': proof,
                'supercollider': {'compile_exit_code': compiled.returncode, 'render_exit_code': native.returncode,
                    'version': subprocess.run([str(args.sc_root/'scsynth.exe'), '-v'],capture_output=True).stdout.decode(errors='replace').strip(),
                    'mode': 'NRT', 'render_command': command, 'elapsed_seconds': time.monotonic()-started},
                'outputs': outputs, 'limits': 'New mix from pre-safety source captures. No exact match to the old nonlinear master. No note or rhythm changes. No HRTF, detuning, inter-ear delay, polarity change, binaural-beat, live FoxDot, REAPER capture, listening approval, or physical-device claim. Full take with tail; not a seamless beat loop.'}
    (OUTPUT/'render-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'output': str(OUTPUT),'proof': proof,'outputs': outputs},indent=2))


if __name__ == '__main__':
    main()
