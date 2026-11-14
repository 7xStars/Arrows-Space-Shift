"""Render the sixteen original FoxDot scores with native SuperCollider."""
import argparse
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import shutil
import struct
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parent.parent
AUTHOR = ROOT / 'audio/stc-act-library-r1'
ASSETS = ROOT / 'assets/audio/stc-act-library-r1'
REPORTS = ROOT / 'reports/stc-act-library-r1'
SC = Path('G:/Music Tools/SuperCollider/App/SuperCollider')
FFMPEG = Path('G:/Music Tools/FFmpeg/python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v9.0.2.exe')
SCRATCH = Path('G:/Music Projects/Arrow Space Shift/scratch/stc-act-library-r1')


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


helpers = module('act_osc_helpers', ROOT / 'tools/render-foxdot-room.py')
composer = module('act_composer', AUTHOR / 'compose.py')


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b''): h.update(chunk)
    return h.hexdigest()


def fingerprint(track):
    parts = [digest(path) for path in [AUTHOR / 'compose.py', AUTHOR / 'instruments.scd', ROOT / 'tools/mix-act-library.mjs', Path(__file__)]]
    parts.append(json.dumps(track, sort_keys=True))
    return hashlib.sha256('|'.join(parts).encode()).hexdigest()


def run(command, log, cwd=None, timeout=300):
    started = time.monotonic()
    result = subprocess.run([str(value) for value in command], cwd=cwd or ROOT, capture_output=True, timeout=timeout)
    Path(log).write_bytes(result.stdout + result.stderr)
    if result.returncode:
        raise RuntimeError(f'Command returned {result.returncode}. Read {log}.')
    return {'exit_code': result.returncode, 'seconds': round(time.monotonic() - started, 3)}


def immediate(messages):
    value = b'#bundle\0' + struct.pack('>II', 0, 1)
    for message in messages: value += struct.pack('>i', len(message)) + message
    return value


def score_file(score, synths):
    track = score['track']
    initialization = immediate([
        helpers.osc_message('/g_new', [1, 0, 0]),
        helpers.osc_message('/s_new', ['assLibPan', 1001, 0, 0, 'bpm', float(track['bpm']), 'depth', float(track['pan_depth'])]),
        helpers.osc_message('/s_new', ['assLibMix', 1002, 1, 0, 'bpm', float(track['bpm'])]),
    ])
    for path in reversed(synths): initialization = helpers.osc_message('/d_recv', [path.read_bytes(), initialization])
    data = helpers.osc_bundle(0, [initialization])
    for index, event in enumerate(score['events']):
        args = ['assLib' + event['kind'], 10000 + index, 0, 1, 'amp', float(event['amp'])]
        if 'midi' in event: args.extend(['freq', 440.0 * 2 ** ((event['midi'] - 69) / 12)])
        for key in ['dur', 'cutoff', 'drive', 'act', 'pan', 'seed']:
            if key in event: args.extend([key, float(event[key]) if key != 'seed' else int(event[key])])
        data += helpers.osc_bundle(event['time'], [helpers.osc_message('/s_new', args)])
    data += helpers.osc_bundle(track['seconds'], [helpers.osc_message('/g_freeAll', [0])])
    data += helpers.osc_bundle(track['seconds'] + .01, [helpers.osc_message('/c_set', [0, 0])])
    return data


def render_track(track, synths, args):
    identifier = track['id']
    report = REPORTS / identifier
    report.mkdir(parents=True, exist_ok=True)
    score = composer.compose(track)
    scores = AUTHOR / 'scores'
    scores.mkdir(exist_ok=True)
    (scores / (identifier + '.json')).write_text(json.dumps(score, indent=2) + '\n', encoding='utf-8')
    osc = scores / (identifier + '.osc')
    osc.write_bytes(score_file(score, synths))
    raw = args.scratch / (identifier + '-4ch-float.wav')
    full = AUTHOR / 'masters' / (identifier + '.wav')
    core = args.scratch / (identifier + '-core.wav')
    air = args.scratch / (identifier + '-atmosphere.wav')
    full.parent.mkdir(exist_ok=True)
    native = run([args.sc_root / 'scsynth.exe', '-N', osc, '_', raw, '48000', 'WAV', 'float', '-o', '4', '-i', '0', '-z', '64', '-m', '131072'],
                 report / 'scsynth.log', args.scratch)
    native_text = (report / 'scsynth.log').read_text(errors='replace')
    if any(word in native_text for word in ['FAILURE IN SERVER', 'SynthDef not found', 'exception in GraphDef']):
        raise RuntimeError(f'The native score reported a server failure: {identifier}')
    metrics_path = report / 'mix.json'
    run(['node', ROOT / 'tools/mix-act-library.mjs', raw, full, core, air, metrics_path, str(track['seconds'])], report / 'mix-log.txt')
    metrics = json.loads(metrics_path.read_text())
    outputs = []
    for kind, source in [('full', full), ('core', core), ('atmosphere', air)]:
        target = ASSETS / (identifier + ('' if kind == 'full' else '-' + kind) + '.ogg')
        run([args.ffmpeg, '-hide_banner', '-y', '-i', source, '-map_metadata', '-1', '-c:a', 'libvorbis', '-q:a', '6', '-ar', '48000', '-ac', '2', target],
            report / (kind + '-encode.txt'))
        outputs.append({'kind': kind, 'file': target.name, 'bytes': target.stat().st_size, 'sha256': digest(target)})
    preview = ASSETS / (identifier + '-preview.ogg')
    preview_start = max(4, min(track['seconds'] * .27, track['seconds'] - 24))
    run([args.ffmpeg, '-hide_banner', '-y', '-ss', str(preview_start), '-i', full, '-t', '20', '-af', 'afade=t=in:d=0.03,afade=t=out:st=19.9:d=0.1',
         '-map_metadata', '-1', '-c:a', 'libvorbis', '-q:a', '6', preview], report / 'preview-encode.txt')
    run([args.ffmpeg, '-hide_banner', '-i', full, '-filter_complex', 'ebur128=peak=true', '-f', 'null', '-'], report / 'loudness.txt')
    record = {'id': identifier, 'source_fingerprint': fingerprint(track), 'native': native, 'events': len(score['events']), 'metrics': metrics,
              'master': {'file': full.relative_to(ROOT).as_posix(), 'sha256': digest(full), 'bytes': full.stat().st_size},
              'outputs': outputs, 'preview': {'file': preview.name, 'start': preview_start, 'seconds': 20, 'sha256': digest(preview)},
              'foxdot': score['foxdot']}
    (report / 'result.json').write_text(json.dumps(record, indent=2) + '\n', encoding='utf-8')
    for path in [raw, core, air]:
        if path.resolve().is_relative_to(args.scratch.resolve()): path.unlink()
    return record


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--track', action='append', help='Render only the named track. Repeat for more tracks.')
    parser.add_argument('--resume', action='store_true', help='Keep completed tracks whose output hashes still match.')
    parser.add_argument('--sc-root', type=Path, default=SC)
    parser.add_argument('--ffmpeg', type=Path, default=FFMPEG)
    parser.add_argument('--scratch', type=Path, default=SCRATCH)
    args = parser.parse_args()
    for folder in [AUTHOR, ASSETS, REPORTS, args.scratch]: folder.mkdir(parents=True, exist_ok=True)
    environment = {'python': sys.version, 'executable': sys.executable,
                   'scsynth': subprocess.run([str(args.sc_root / 'scsynth.exe'), '-v'], capture_output=True).stdout.decode(errors='replace').strip(),
                   'scratch': str(args.scratch), 'route': 'Installed FoxDot note/rhythm Patterns -> finite OSC score -> native SC synthesis -> common linear mix -> WAV and Vorbis.',
                   'limits': 'No live FoxDot Clock, external audio device, reference recording, REAPER render, or listening acceptance.'}
    (REPORTS / 'environment.json').write_text(json.dumps(environment, indent=2) + '\n', encoding='utf-8')
    run([args.sc_root / 'sclang.exe', '-a', '--include-path', args.sc_root / 'SCClassLibrary', '-D', '-u', '57139', AUTHOR / 'instruments.scd', AUTHOR.as_posix()],
        REPORTS / 'sclang.log', args.scratch)
    synths = sorted(AUTHOR.glob('assLib*.scsyndef'))
    if len(synths) != 10: raise RuntimeError(f'Expected ten SynthDefs, received {len(synths)}.')
    tracks, records = composer.definitions(), []
    for track in tracks:
        if args.track and track['id'] not in args.track: continue
        result_path = REPORTS / track['id'] / 'result.json'
        if args.resume and result_path.is_file():
            prior = json.loads(result_path.read_text())
            valid = prior.get('source_fingerprint') == fingerprint(track) and digest(ROOT / prior['master']['file']) == prior['master']['sha256']
            valid = valid and all(digest(ASSETS / item['file']) == item['sha256'] for item in prior['outputs'])
            if valid:
                print(track['id'], 'kept', flush=True)
                records.append(prior)
                continue
        print(track['id'], 'rendering', track['seconds'], 'seconds', flush=True)
        records.append(render_track(track, synths, args))
        print(track['id'], 'complete', flush=True)
    all_records = []
    for track in tracks:
        path = REPORTS / track['id'] / 'result.json'
        if path.is_file(): all_records.append(json.loads(path.read_text()))
    catalog = {'revision': 'stc-act-library-r1', 'tracks': []}
    for track in tracks:
        catalog['tracks'].append({**track, 'full': track['id'] + '.ogg', 'core': track['id'] + '-core.ogg',
                                  'atmosphere': track['id'] + '-atmosphere.ogg', 'preview': track['id'] + '-preview.ogg'})
    (ASSETS / 'catalog.json').write_text(json.dumps(catalog, indent=2) + '\n', encoding='utf-8')
    (REPORTS / 'render-results.json').write_text(json.dumps({'revision': catalog['revision'], 'environment': environment, 'tracks': all_records}, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'completed': len(all_records), 'target': 16, 'seconds': sum(item['metrics']['seconds'] for item in all_records)}, indent=2))


if __name__ == '__main__': main()
