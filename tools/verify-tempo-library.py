"""Check rendered tempo studies and their decoded delivery files."""
import array
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import sys
import wave

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'assets/audio/stc-tempo-r2'
REPORTS = ROOT / 'reports/stc-tempo-r2b'
FFMPEG = Path('G:/Music Tools/FFmpeg/python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v9.0.2.exe')


def digest(path):
    result = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            result.update(block)
    return result.hexdigest()


def metadata(path, frames):
    with wave.open(str(path), 'rb') as source:
        actual = (source.getnchannels(), source.getframerate(), source.getnframes(), source.getsampwidth())
    expected = (2, 48000, frames, 2)
    if actual != expected:
        raise ValueError(f'Incorrect WAV format: {path}: {actual}.')
    return {'file': str(path), 'frames': frames, 'sampleRate': 48000, 'channels': 2}


def reconstruction(full, core, atmosphere):
    maximum, count = 0, 0
    with wave.open(str(full), 'rb') as first, wave.open(str(core), 'rb') as second, wave.open(str(atmosphere), 'rb') as third:
        while block := first.readframes(8192):
            groups = [array.array('h', values) for values in [block, second.readframes(8192), third.readframes(8192)]]
            if sys.byteorder != 'little':
                for values in groups:
                    values.byteswap()
            if len({len(values) for values in groups}) != 1:
                raise ValueError('WAV stem lengths differ.')
            for a, b, c in zip(*groups):
                maximum = max(maximum, abs(a - b - c))
            count += len(groups[0])
    if maximum > 1:
        raise ValueError(f'The common-gain stems do not reconstruct: {maximum} PCM units.')
    return {'samples': count, 'maximumResidualPcm16Units': maximum}


def decode(job):
    path, frames, expected_hash = job
    if not path.is_file() or digest(path) != expected_hash:
        raise ValueError(f'Delivery file or hash differs: {path}.')
    result = subprocess.run([str(FFMPEG), '-hide_banner', '-i', str(path), '-af', 'astats=reset=0,ebur128=peak=true', '-f', 'null', '-'],
                            capture_output=True, timeout=120)
    text = (result.stdout + result.stderr).decode(errors='replace')
    (REPORTS / 'decoded' / (path.stem + '.txt')).write_text(text, encoding='utf-8')
    if result.returncode:
        raise ValueError(f'Delivery decode failed: {path}.')
    overall = text.rsplit('Overall', 1)[-1]
    def field(label):
        values = re.findall(re.escape(label) + r':\s+([-+\w.]+)', overall)
        if not values:
            raise ValueError(f'Missing decoded metric: {label}.')
        return float(values[-1])
    count, nan, infinite, peak = [field(label) for label in ['Number of samples', 'Number of NaNs', 'Number of Infs', 'Peak level dB']]
    summary = text.rsplit('Summary:', 1)[-1]
    true_peak = float(re.findall(r'Peak:\s+([-\d.]+) dBFS', summary)[-1])
    loudness = float(re.findall(r'I:\s+([-\d.]+) LUFS', summary)[-1])
    if count != frames or nan != 0 or infinite != 0 or peak >= 0 or true_peak >= 0:
        raise ValueError(f'Decoded format or sample level failed: {path}.')
    return {'file': path.name, 'frames': int(count), 'nan': int(nan), 'infinite': int(infinite),
            'sample_peak_dbfs': peak, 'measured_true_peak_dbfs': true_peak,
            'integrated_lufs': loudness, 'sha256': expected_hash}


def main():
    (REPORTS / 'decoded').mkdir(parents=True, exist_ok=True)
    catalog = json.loads((ASSETS / 'catalog.json').read_text())
    expected = [120, 136, 144, 152, 168, 184, 200, 220, 240]
    if sorted(track['bpm'] for track in catalog['tracks']) != expected:
        raise ValueError('The required tempo range is incomplete.')
    tracks, jobs = [], []
    for track in catalog['tracks']:
        result = json.loads((REPORTS / track['id'] / 'result.json').read_text())
        if result['native']['exit_code'] or result['metrics']['nonFinite'] or result['metrics']['fullScale']:
            raise ValueError(f'Native render failed: {track["id"]}.')
        frames = track['seconds'] * 48000
        paths = [result['master'], *result['stems']]
        for item in paths:
            metadata(Path(item['file']), frames)
            if digest(item['file']) != item['sha256']:
                raise ValueError(f'WAV hash differs: {item["file"]}.')
        metadata(Path(result['preview']['wav']['file']), 20 * 48000)
        residue = reconstruction(*(Path(item['file']) for item in paths))
        for item in result['outputs']:
            jobs.append((ASSETS / item['file'], frames, item['sha256']))
        jobs.append((ASSETS / result['preview']['file'], 20 * 48000, result['preview']['sha256']))
        text = (REPORTS / track['id'] / 'loudness.txt').read_text().rsplit('Summary:', 1)[-1]
        loudness = float(re.findall(r'I:\s+([-\d.]+) LUFS', text)[-1])
        peak = float(re.findall(r'Peak:\s+([-\d.]+) dBFS', text)[-1])
        if peak >= 0:
            raise ValueError(f'Master true peak failed: {track["id"]}.')
        tracks.append({'id': track['id'], 'bpm': track['bpm'], 'seconds': track['seconds'],
                       'master': result['master'], 'wav_reconstruction': residue,
                       'integrated_lufs': loudness, 'master_true_peak_dbfs': peak})
    with ThreadPoolExecutor(max_workers=3) as workers:
        decoded = list(workers.map(decode, jobs))
    report = {'revision': catalog['revision'], 'tracks': tracks, 'decoded': decoded, 'track_count': len(tracks),
              'seconds': sum(item['seconds'] for item in tracks), 'decoded_file_count': len(decoded),
              'limits': 'Offline file and decoded-sample checks. No human listening, game integration, physical device, or latency result.'}
    (REPORTS / 'file-verification.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'tracks': len(tracks), 'seconds': report['seconds'], 'decoded_files': len(decoded),
                      'lufs_range': [min(item['integrated_lufs'] for item in tracks), max(item['integrated_lufs'] for item in tracks)],
                      'highest_master_true_peak_dbfs': max(item['master_true_peak_dbfs'] for item in tracks),
                      'highest_decoded_true_peak_dbfs': max(item['measured_true_peak_dbfs'] for item in decoded)}, indent=2))


if __name__ == '__main__':
    main()
