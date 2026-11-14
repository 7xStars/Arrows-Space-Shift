"""Render the selected take through FoxDot patterns and SuperCollider NRT."""
import argparse
import array
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import platform
import struct
import subprocess
import sys
import time
import wave

ROOT = Path(__file__).resolve().parent.parent
AUTHORING = ROOT / 'audio/stc-study/foxdot-room-r6'
DEFAULT_SC = Path('G:/Music Tools/SuperCollider/App/SuperCollider')
DEFAULT_SOURCE = ROOT / 'reports/stc-study-r5/ass-identified-return-r5-stereo-music.wav'


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def osc_string(value):
    data = str(value).encode('utf-8') + b'\0'
    return data + b'\0' * ((-len(data)) % 4)


def osc_message(address, values):
    tags, payload = ',', bytearray()
    for value in values:
        if isinstance(value, int):
            tags += 'i'
            payload.extend(struct.pack('>i', value))
        elif isinstance(value, float):
            tags += 'f'
            payload.extend(struct.pack('>f', value))
        elif isinstance(value, bytes):
            tags += 'b'
            payload.extend(struct.pack('>i', len(value)) + value)
            payload.extend(b'\0' * ((-len(value)) % 4))
        else:
            tags += 's'
            payload.extend(osc_string(value))
    return osc_string(address) + osc_string(tags) + bytes(payload)


def osc_bundle(seconds, messages):
    whole = math.floor(seconds)
    fractional = int((seconds - whole) * 2**32)
    result = b'#bundle\0' + struct.pack('>II', whole, fractional)
    for message in messages:
        result += struct.pack('>i', len(message)) + message
    return struct.pack('>i', len(result)) + result


def read_float_wav(path):
    blob = Path(path).read_bytes()
    if blob[:4] != b'RIFF' or blob[8:12] != b'WAVE':
        raise ValueError('The NRT file is not a RIFF WAV.')
    offset, fmt, payload = 12, None, None
    while offset + 8 <= len(blob):
        name, size = blob[offset:offset+4], struct.unpack_from('<I', blob, offset+4)[0]
        value = blob[offset+8:offset+8+size]
        if name == b'fmt ': fmt = value
        if name == b'data': payload = value
        offset += 8 + size + (size % 2)
    if fmt is None or payload is None:
        raise ValueError('The WAV format or sample data is missing.')
    tag, channels, rate, _, _, bits = struct.unpack_from('<HHIIHH', fmt)
    if tag == 65534:
        tag = struct.unpack_from('<H', fmt, 24)[0]
    if tag != 3 or bits != 32:
        raise ValueError(f'Expected 32-bit float PCM, received format {tag}/{bits}.')
    samples = array.array('f', payload)
    if sys.byteorder != 'little': samples.byteswap()
    return channels, rate, samples


def write_pcm16(path, values, frames, rate=48000):
    samples = array.array('h')
    peak, squares, nonfinite, fullscale = 0.0, 0.0, 0, 0
    for value in values:
        if not math.isfinite(value):
            nonfinite += 1
            raise ValueError('The output contains a non-finite sample.')
        peak = max(peak, abs(value))
        squares += value * value
        if abs(value) >= 1: fullscale += 1
        if abs(value) >= 1:
            raise ValueError('The output reaches full scale. Do not clip it.')
        samples.append(round(value * 32768))
    if len(samples) != frames * 2:
        raise ValueError('The stereo frame count does not match.')
    if sys.byteorder != 'little': samples.byteswap()
    with wave.open(str(path), 'wb') as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(rate)
        output.writeframes(samples.tobytes())
    return {'file': Path(path).name, 'frames': frames, 'channels': 2,
            'sample_rate': rate, 'duration': frames / rate,
            'peak': peak, 'peak_dbfs': 20 * math.log10(max(1e-12, peak)),
            'rms': math.sqrt(squares / max(1, len(samples))),
            'non_finite': nonfinite, 'full_scale': fullscale, 'sha256': sha256(path)}


def find_alignment(source, rendered, maximum_offset=512):
    first = next((i // 2 for i, value in enumerate(source) if value), 0)
    start = max(0, first - 8)
    length = min(512, len(source) // 2 - start)
    for offset in range(maximum_offset + 1):
        match = True
        for frame in range(start, start + length):
            for channel in range(2):
                if round(rendered[(frame + offset) * 4 + channel] * 32768) != source[frame * 2 + channel]:
                    match = False
                    break
            if not match: break
        if match: return offset
    raise ValueError('The NRT dry playback does not match the selected take.')


def write_reaper_project(path, frames, rate, room_gain):
    duration = frames / rate
    tracks = []
    for name, filename, volume in [('Selected stereo take', 'dry_take.wav', 1),
                                   ('Original room return', 'room_return.wav', room_gain)]:
        tracks.append(f'''  <TRACK
    NAME "{name}"
    VOLPAN {volume} 0 1 -1
    <ITEM
      POSITION 0
      LENGTH {duration:.12f}
      VOLPAN 1 0 1 -1
      SOFFS 0
      PLAYRATE 1 1 0 -1 0 0.0025
      <SOURCE WAVE
        FILE "{filename}"
      >
    >
  >''')
    path.write_text('<REAPER_PROJECT 0.1 7.0 1\n  SAMPLERATE 48000 1 0\n'
                    + '\n'.join(tracks) + '\n>\n', encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=DEFAULT_SOURCE)
    parser.add_argument('--output', type=Path, default=AUTHORING)
    parser.add_argument('--sc-root', type=Path, default=DEFAULT_SC)
    parser.add_argument('--room-gain', type=float, default=.3)
    args = parser.parse_args()
    if not 0 <= args.room_gain <= 1:
        raise ValueError('Use a room gain from 0 to 1.')
    source = args.source.resolve()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    scratch = ROOT / '.local/foxdot-room-r6'
    scratch.mkdir(parents=True, exist_ok=True)
    with wave.open(str(source), 'rb') as input_file:
        if (input_file.getnchannels(), input_file.getframerate(), input_file.getsampwidth()) != (2, 48000, 2):
            raise ValueError('Use the selected stereo 48 kHz 16-bit source.')
        source_frames, source_rate = input_file.getnframes(), input_file.getframerate()
        source_data = input_file.readframes(source_frames)
    source_samples = array.array('h', source_data)
    if sys.byteorder != 'little': source_samples.byteswap()
    spec = importlib.util.spec_from_file_location('foxdot_room_take', AUTHORING / 'foxdot_take.py')
    author = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(author)
    authored = author.author_take(source_frames, source_rate)
    (output / 'foxdot-events.json').write_text(json.dumps(authored, indent=2) + '\n', encoding='utf-8')
    synth_binary = output / 'assStereoRoomR6.scsyndef'
    compile_command = [str(args.sc_root / 'sclang.exe'), '-a', '--include-path',
                       str(args.sc_root / 'SCClassLibrary'), '-D', '-u', '57139',
                       str(AUTHORING / 'stereo_room.scd'), output.as_posix()]
    compiled = subprocess.run(compile_command, cwd=scratch, capture_output=True, timeout=60)
    (output / 'sclang.log').write_bytes(compiled.stdout + compiled.stderr)
    if compiled.returncode or not synth_binary.is_file() or b'ASS_ROOM_R6_SYNTHDEF_WRITTEN' not in compiled.stdout:
        raise RuntimeError('SuperCollider SynthDef compilation failed. Read sclang.log.')
    total_frames = source_frames + source_rate * 3
    duration = total_frames / source_rate
    event = authored['events'][0]
    play = osc_message('/s_new', ['assStereoRoomR6', 1000, 0, 0, 'out', 0,
                                 'buf', 0, 'gain', float(event['gain']), 'rate', float(event['rate'])])
    allocate = osc_message('/b_allocRead', [0, source.as_posix(), 0, -1, play])
    define = osc_message('/d_recv', [synth_binary.read_bytes(), allocate])
    score_file = output / 'room-score.osc'
    score_file.write_bytes(osc_bundle(event['seconds'], [define])
                           + osc_bundle(duration, [osc_message('/n_free', [1000])])
                           + osc_bundle(duration + .01, [osc_message('/b_free', [0])])
                           + osc_bundle(duration + .02, [osc_message('/c_set', [0, 0])]))
    raw = scratch / 'room-render-4ch-float.wav'
    nrt_command = [str(args.sc_root / 'scsynth.exe'), '-N', str(score_file), '_', str(raw),
                   str(source_rate), 'WAV', 'float', '-o', '4', '-i', '0', '-z', '64']
    started = time.monotonic()
    rendered = subprocess.run(nrt_command, cwd=scratch, capture_output=True, timeout=120)
    (output / 'scsynth-nrt.log').write_bytes(rendered.stdout + rendered.stderr)
    if rendered.returncode or not raw.is_file():
        raise RuntimeError('SuperCollider NRT rendering failed. Read scsynth-nrt.log.')
    channels, rate, samples = read_float_wav(raw)
    if channels != 4 or rate != source_rate:
        raise ValueError('The NRT channel count or rate does not match.')
    alignment = find_alignment(source_samples, samples)
    if (len(samples) // 4) < total_frames + alignment:
        raise ValueError('The NRT output is shorter than the common stem interval.')
    max_dry_error = 0
    for frame in range(source_frames):
        for channel in range(2):
            max_dry_error = max(max_dry_error, abs(round(samples[(frame+alignment)*4+channel] * 32768)
                                                  - source_samples[frame*2+channel]))
    if max_dry_error != 0:
        raise ValueError('The NRT sample playback changed the selected dry take.')
    tail_fade_frames = int(.25 * source_rate)
    dry_values, wet_values = array.array('f'), array.array('f')
    for frame in range(total_frames):
        fade = min(1.0, max(0.0, (total_frames - 1 - frame) / tail_fade_frames))
        for channel in range(2):
            dry_values.append(source_samples[frame*2+channel] / 32768 if frame < source_frames else 0.0)
            wet_values.append(float(samples[(frame+alignment)*4+2+channel]) * fade)
    dry_metrics = write_pcm16(output / 'dry_take.wav', dry_values, total_frames)
    wet_metrics = write_pcm16(output / 'room_return.wav', wet_values, total_frames)
    mix_metrics = write_pcm16(output / 'room_mix.wav',
                              (dry + args.room_gain * wet for dry, wet in zip(dry_values, wet_values)), total_frames)
    with wave.open(str(output / 'dry_take.wav'), 'rb') as check:
        if check.readframes(source_frames) != source_data:
            raise ValueError('The exported dry stem changed the original PCM prefix.')
    write_reaper_project(output / 'Stereo Room r6.rpp', total_frames, source_rate, args.room_gain)
    manifest = {
        'revision': 'stereo-room-r6', 'source': str(source), 'source_sha256': sha256(source),
        'source_frames': source_frames, 'source_rate': source_rate, 'common_frames': total_frames,
        'tail_seconds': 3, 'tail_policy': 'Dry is padded with zeros. The wet return has a final 0.25-second boundary fade. This is not a seamless loop.',
        'room_gain': args.room_gain, 'room': {'predelay_seconds': .03, 'comb_decay_seconds': 2.2,
            'highpass_hz': 220, 'lowpass_hz': 4800, 'original_early_reflections': True},
        'source_alignment_offset_frames': alignment, 'max_dry_pcm_difference': max_dry_error,
        'foxdot': authored['foxdot'], 'events': authored['events'],
        'supercollider': {'sclang_version': subprocess.run([str(args.sc_root/'sclang.exe'), '-v'], capture_output=True).stdout.decode(errors='replace').strip(),
                          'scsynth_version': subprocess.run([str(args.sc_root/'scsynth.exe'), '-v'], capture_output=True).stdout.decode(errors='replace').strip(),
                          'mode': 'NRT', 'compile_command': compile_command, 'render_command': nrt_command,
                          'compile_exit_code': compiled.returncode, 'render_exit_code': rendered.returncode,
                          'cleanup': 'Free synth and buffer before the final /c_set marker. Do not send /quit.',
                          'render_elapsed_seconds': time.monotonic()-started},
        'python': {'version': platform.python_version(), 'executable': sys.executable},
        'outputs': [dry_metrics, wet_metrics, mix_metrics],
        'reaper': {'file': 'Stereo Room r6.rpp', 'opened_or_rendered': False},
        'provenance': 'FoxDot Pattern APIs sequence one existing take. SuperCollider sample-plays it and creates the room return. The original composition was not authored in FoxDot.',
        'limits': 'Offline adapter. No live FoxDot scheduler, workstation capture, physical room model, listening acceptance, or diegetic-source implementation is claimed.',
    }
    (output / 'render-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'output': str(output), 'foxdot': authored['foxdot']['version'],
                      'alignment': alignment, 'dry_pcm_difference': max_dry_error,
                      'outputs': manifest['outputs']}, indent=2))


if __name__ == '__main__':
    main()
