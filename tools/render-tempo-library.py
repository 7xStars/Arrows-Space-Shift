"""Render the nine original tempo studies with FoxDot Patterns and native SC."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import struct
import subprocess
import sys
import time
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
AUTHOR = ROOT / 'audio/stc-tempo-r2'
ASSETS = ROOT / 'assets/audio/stc-tempo-r2'
REPORTS = ROOT / 'reports/stc-tempo-r2b'
DEFAULT_OUTPUT = Path('G:/Music Projects/Arrow Space Shift/stc-tempo-r2b')
BASELINE = DEFAULT_OUTPUT / 'baseline-r2'
SC = Path('G:/Music Tools/SuperCollider/App/SuperCollider')
FFMPEG = Path('G:/Music Tools/FFmpeg/python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v9.0.2.exe')


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded


helpers = module('tempo_osc_helpers', ROOT / 'tools/render-foxdot-room.py')
composer = module('tempo_composer', AUTHOR / 'compose.py')


def digest(path):
    value = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(block)
    return value.hexdigest()


def fingerprint(track):
    files = [AUTHOR / 'compose.py', AUTHOR / 'instruments.scd', ROOT / 'audio/stc-act-library-r1/compose.py',
             ROOT / 'tools/mix-act-library.mjs', Path(__file__)]
    return hashlib.sha256(('|'.join(digest(path) for path in files) + json.dumps(track, sort_keys=True)).encode()).hexdigest()


def run(command, log, cwd=None, timeout=300):
    started = time.monotonic()
    result = subprocess.run([str(value) for value in command], cwd=cwd or ROOT, capture_output=True, timeout=timeout)
    Path(log).write_bytes(result.stdout + result.stderr)
    if result.returncode:
        raise RuntimeError(f'Command returned {result.returncode}. Read {log}.')
    return {'exit_code': result.returncode, 'seconds': round(time.monotonic() - started, 3)}


def immediate(messages):
    value = b'#bundle\0' + struct.pack('>II', 0, 1)
    for message in messages:
        value += struct.pack('>i', len(message)) + message
    return value


def score_file(score, synths):
    track, sound = score['track'], score['production_parameters']
    initialization = immediate([
        helpers.osc_message('/g_new', [1, 0, 0]),
        helpers.osc_message('/s_new', ['assTempoPan', 1001, 0, 0, 'bpm', float(track['bpm']),
                                      'depth', float(track['pan_depth']), 'cycleBeats', float(sound['pan_cycle_beats'])]),
        helpers.osc_message('/s_new', ['assTempoMix', 1002, 1, 0, 'bpm', float(track['bpm']), 'roomMix', float(sound['room_mix']),
                                      'airPanDepth', float(sound['atmos_pan_depth']), 'airCycleBeats', float(sound['atmos_pan_cycle_beats'])]),
    ])
    for path in reversed(synths):
        initialization = helpers.osc_message('/d_recv', [path.read_bytes(), initialization])
    data = helpers.osc_bundle(0, [initialization])
    for index, event in enumerate(score['events']):
        arguments = ['assTempo' + event['kind'], 10000 + index, 0, 1, 'amp', float(event['amp'])]
        if 'midi' in event:
            arguments += ['freq', 440.0 * 2 ** ((event['midi'] - 69) / 12)]
        for key in ['dur', 'cutoff', 'drive', 'act', 'pan', 'seed', 'depth', 'cycle']:
            if key in event:
                arguments += [key, int(event[key]) if key == 'seed' else float(event[key])]
        data += helpers.osc_bundle(event['time'], [helpers.osc_message('/s_new', arguments)])
    data += helpers.osc_bundle(track['seconds'], [helpers.osc_message('/g_freeAll', [0])])
    data += helpers.osc_bundle(track['seconds'] + .01, [helpers.osc_message('/c_set', [0, 0])])
    return data


def asset_stem(track):
    return track['id'] + ('-r2b' if track.get('mix_revision', 1) >= 2 else '')


def render_track(track, synths, args):
    identifier = track['id']
    report, scores = REPORTS / identifier, AUTHOR / 'scores'
    for folder in [report, scores, args.output / 'masters', args.output / 'stems', args.output / 'previews']:
        folder.mkdir(parents=True, exist_ok=True)
    score = composer.compose(track)
    (scores / (identifier + '.json')).write_text(json.dumps(score, indent=2) + '\n', encoding='utf-8')
    osc = args.scratch / (identifier + '.osc')
    osc.write_bytes(score_file(score, synths))
    raw = args.scratch / (identifier + '-4ch-float.wav')
    full = args.output / 'masters' / (identifier + '.wav')
    core = args.output / 'stems' / (identifier + '-core.wav')
    air = args.output / 'stems' / (identifier + '-atmosphere.wav')
    native = run([args.sc_root / 'scsynth.exe', '-N', osc, '_', raw, '48000', 'WAV', 'float', '-o', '4', '-i', '0', '-z', '64', '-m', '131072'],
                 report / 'scsynth.log', args.scratch)
    native_text = (report / 'scsynth.log').read_text(errors='replace')
    if any(value in native_text for value in ['FAILURE IN SERVER', 'SynthDef not found', 'exception in GraphDef']):
        raise RuntimeError(f'Native score failed: {identifier}.')
    mix_path = report / 'mix.json'
    run(['node', ROOT / 'tools/mix-act-library.mjs', raw, full, core, air, mix_path, str(track['seconds'])], report / 'mix-log.txt')
    metrics = json.loads(mix_path.read_text())
    old_path = BASELINE / 'reports' / identifier / 'result.json'
    old = json.loads(old_path.read_text()) if old_path.is_file() else None
    outputs = []
    for kind, source in [('full', full), ('core', core), ('atmosphere', air)]:
        target = ASSETS / (asset_stem(track) + ('' if kind == 'full' else '-' + kind) + '.ogg')
        old_source = old['master'] if old and kind == 'full' else next((item for item in (old or {}).get('stems', []) if ('-' + kind + '.wav') in item['file']), None)
        old_output = next((item for item in (old or {}).get('outputs', []) if item['kind'] == kind), None)
        if old_source and old_output and digest(source) == old_source['sha256'] and target.is_file() and digest(target) == old_output['sha256']:
            outputs.append({**old_output, 'kept_encoded_bytes': True})
            continue
        run([args.ffmpeg, '-hide_banner', '-y', '-i', source, '-map_metadata', '-1', '-c:a', 'libvorbis', '-q:a', '6', '-ar', '48000', '-ac', '2', target],
            report / (kind + '-encode.txt'))
        outputs.append({'kind': kind, 'file': target.name, 'bytes': target.stat().st_size, 'sha256': digest(target)})
    preview = ASSETS / (asset_stem(track) + '-preview.ogg')
    preview_wav = args.output / 'previews' / (identifier + '-preview.wav')
    preview_start = 32.4
    preview_filter = 'afade=t=in:d=0.03,afade=t=out:st=19.9:d=0.1'
    if old and digest(full) == old['master']['sha256'] and preview.is_file() and digest(preview) == old['preview']['sha256']:
        shutil.copyfile(old['preview']['wav']['file'], preview_wav)
    else:
        for target, codec in [(preview, ['-c:a', 'libvorbis', '-q:a', '6']), (preview_wav, ['-c:a', 'pcm_s16le'])]:
            run([args.ffmpeg, '-hide_banner', '-y', '-ss', str(preview_start), '-i', full, '-t', '20', '-af', preview_filter,
                 '-map_metadata', '-1', *codec, '-ar', '48000', '-ac', '2', target], report / ('preview-' + target.suffix[1:] + '.txt'))
    run([args.ffmpeg, '-hide_banner', '-i', full, '-filter_complex', 'ebur128=peak=true', '-f', 'null', '-'], report / 'loudness.txt')
    def wav_record(path):
        return {'file': str(path), 'sha256': digest(path), 'bytes': path.stat().st_size}
    record = {'id': identifier, 'mix_revision': 'r2b', 'source_fingerprint': fingerprint(track), 'native': native, 'events': len(score['events']),
              'metrics': metrics, 'master': wav_record(full), 'stems': [wav_record(core), wav_record(air)], 'outputs': outputs,
              'preview': {'file': preview.name, 'start': preview_start, 'seconds': 20, 'sha256': digest(preview), 'wav': wav_record(preview_wav)},
              'foxdot': score['foxdot'], 'production_parameters': score['production_parameters']}
    (report / 'result.json').write_text(json.dumps(record, indent=2) + '\n', encoding='utf-8')
    if raw.resolve().is_relative_to(args.scratch.resolve()):
        raw.unlink()
    return record


def make_catalog(tracks):
    return {'revision': 'stc-tempo-r2', 'mix_revision': 'r2b', 'tracks': [
        {**track, 'full': asset_stem(track) + '.ogg', 'core': asset_stem(track) + '-core.ogg',
         'atmosphere': asset_stem(track) + '-atmosphere.ogg', 'preview': asset_stem(track) + '-preview.ogg'}
        for track in tracks]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--track', action='append')
    parser.add_argument('--resume', action='store_true')
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument('--scratch', type=Path, default=DEFAULT_OUTPUT / 'scratch')
    parser.add_argument('--sc-root', type=Path, default=SC)
    parser.add_argument('--ffmpeg', type=Path, default=FFMPEG)
    args = parser.parse_args()
    for folder in [ASSETS, REPORTS, args.output, args.scratch, args.output / 'synthdefs']:
        folder.mkdir(parents=True, exist_ok=True)
    environment = {'python': sys.version, 'executable': sys.executable,
                   'scsynth': subprocess.run([str(args.sc_root / 'scsynth.exe'), '-v'], capture_output=True).stdout.decode(errors='replace').strip(),
                   'output': str(args.output), 'scratch': str(args.scratch),
                   'route': 'Installed FoxDot Patterns -> finite OSC score -> native SC synthesis -> shared linear gain -> WAV and Vorbis.',
                   'limits': 'No live FoxDot Clock, external audio device, reference recording, REAPER render, or listening approval.'}
    (REPORTS / 'environment.json').write_text(json.dumps(environment, indent=2) + '\n', encoding='utf-8')
    run([args.sc_root / 'sclang.exe', '-a', '--include-path', args.sc_root / 'SCClassLibrary', '-D', '-u', '57149', AUTHOR / 'instruments.scd',
         (args.output / 'synthdefs').as_posix()], REPORTS / 'sclang.log', args.scratch)
    synths = sorted((args.output / 'synthdefs').glob('assTempo*.scsyndef'))
    if len(synths) != 11:
        raise RuntimeError(f'Expected eleven SynthDefs, received {len(synths)}.')
    tracks = composer.definitions()
    for track in tracks:
        if args.track and track['id'] not in args.track:
            continue
        previous = REPORTS / track['id'] / 'result.json'
        if args.resume and previous.is_file():
            old = json.loads(previous.read_text())
            valid = old.get('source_fingerprint') == fingerprint(track)
            valid = valid and Path(old['master']['file']).is_file() and digest(old['master']['file']) == old['master']['sha256']
            valid = valid and all((ASSETS / item['file']).is_file() and digest(ASSETS / item['file']) == item['sha256'] for item in old['outputs'])
            if valid:
                print(track['id'], 'kept', flush=True)
                continue
        print(track['id'], 'rendering', track['bpm'], 'BPM', flush=True)
        render_track(track, synths, args)
        print(track['id'], 'complete', flush=True)
    catalog = make_catalog(tracks)
    (ASSETS / 'catalog.json').write_text(json.dumps(catalog, indent=2) + '\n', encoding='utf-8')
    records = [json.loads((REPORTS / track['id'] / 'result.json').read_text()) for track in tracks if (REPORTS / track['id'] / 'result.json').is_file()]
    result = {'revision': catalog['revision'], 'environment': environment, 'tracks': records}
    (REPORTS / 'render-results.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'completed': len(records), 'target': len(tracks), 'seconds': sum(item['metrics']['seconds'] for item in records)}, indent=2))


if __name__ == '__main__':
    main()
