"""Export bounded, aligned campaign segments from the retained music stems."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'assets/audio/stc-act-library-r1'
OUTPUT = ROOT / 'assets/audio/campaign-music-v1'
REPORTS = ROOT / 'reports/campaign-music-v1'
SCRATCH = Path('G:/Music Projects/Arrow Space Shift/scratch/campaign-music-v1')
FFMPEG = Path('G:/Music Tools/FFmpeg/python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v9.0.2.exe')
SEGMENT_SECONDS, OVERLAP_SECONDS, RATE = 24, .08, 48000
SELECTED = {'traditional': 'act1-03', 'klein': 'act2-03', 'projective': 'act3-03', 'bolza': 'act4-03'}


def digest(path):
    value = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(block)
    return value.hexdigest()


def run(command, log):
    process = subprocess.run([str(item) for item in command], capture_output=True, timeout=180)
    log.write_bytes(process.stdout + process.stderr)
    if process.returncode:
        raise RuntimeError(f'The audio export failed. Read {log}.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ffmpeg', type=Path, default=FFMPEG)
    parser.add_argument('--scratch', type=Path, default=SCRATCH)
    args = parser.parse_args()
    for path in [OUTPUT, REPORTS, args.scratch]:
        path.mkdir(parents=True, exist_ok=True)
    catalog = json.loads((SOURCE / 'catalog.json').read_text(encoding='utf-8'))
    tracks = {entry['id']: entry for entry in catalog['tracks']}
    jobs, records = [], {}
    for theme, identifier in SELECTED.items():
        track = tracks[identifier]
        records[theme] = {'id': identifier, 'title': track['title'], 'bpm': track['bpm'], 'seconds': track['seconds'],
                          'segments': [], 'source_stems': []}
        assert track['seconds'] == 240
        for index in range(10):
            first = index * SEGMENT_SECONDS * RATE
            frames = min(round((SEGMENT_SECONDS + OVERLAP_SECONDS) * RATE), track['seconds'] * RATE - first)
            records[theme]['segments'].append({'index': index, 'source_first_frame': first, 'frames': frames,
                'span_seconds': SEGMENT_SECONDS, 'seconds': frames / RATE,
                'core': f'{identifier}-{index:02d}-core.ogg', 'atmosphere': f'{identifier}-{index:02d}-atmosphere.ogg'})
        for stem in ['core', 'atmosphere']:
            source = SOURCE / track[stem]
            source_hash = digest(source)
            raw = args.scratch / f'{identifier}-{stem}.f32'
            run([args.ffmpeg, '-hide_banner', '-y', '-i', source, '-f', 'f32le', '-ar', RATE, '-ac', 2, raw],
                REPORTS / f'{identifier}-{stem}-decode.log')
            assert raw.stat().st_size == track['seconds'] * RATE * 2 * 4
            records[theme]['source_stems'].append({'stem': stem, 'file': source.relative_to(ROOT).as_posix(), 'sha256': source_hash})
            for segment in records[theme]['segments']:
                jobs.append((raw, segment['source_first_frame'], segment['frames'], OUTPUT / segment[stem]))

    def encode(job):
        source, first, frames, target = job
        run([args.ffmpeg, '-hide_banner', '-y', '-f', 'f32le', '-ar', RATE, '-ac', 2,
             '-ss', str(first / RATE), '-i', source, '-t', str(frames / RATE), '-map_metadata', '-1',
             '-c:a', 'libvorbis', '-q:a', '8', '-ar', RATE, '-ac', 2, target], REPORTS / (target.stem + '.log'))
        return {'file': target.name, 'bytes': target.stat().st_size, 'sha256': digest(target)}

    with ThreadPoolExecutor(max_workers=2) as pool:
        files = list(pool.map(encode, jobs))
    for entry in records.values():
        for source in entry['source_stems']:
            assert digest(ROOT / source['file']) == source['sha256']
    manifest = {'revision': 'campaign-music-v1', 'sample_rate': RATE, 'segment_seconds': SEGMENT_SECONDS,
        'overlap_seconds': OVERLAP_SECONDS, 'tracks': records, 'files': files,
        'routing': 'Current and next aligned stereo stem pairs. Linear 80 ms overlap. Repeat the finite composition after its ending.',
        'limits': 'Vorbis derivatives of the retained production stems. No new composition or seamless-loop claim. No human listening or physical-device result.'}
    (OUTPUT / 'catalog.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'tracks': len(records), 'files': len(files), 'bytes': sum(item['bytes'] for item in files)}, indent=2))


if __name__ == '__main__':
    main()
