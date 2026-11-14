"""Check all delivered music files, hashes, lengths, and decoded sample levels."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import wave

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'assets/audio/stc-act-library-r1'
REPORTS = ROOT / 'reports/stc-act-library-r1'
FFMPEG = Path('G:/Music Tools/FFmpeg/python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v9.0.2.exe')


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as file:
        for block in iter(lambda: file.read(1024 * 1024), b''): h.update(block)
    return h.hexdigest()


def decode(item):
    path, frames, expected_hash = item
    assert path.is_file(), str(path)
    assert digest(path) == expected_hash, str(path)
    command = [str(FFMPEG), '-hide_banner', '-i', str(path), '-af', 'astats=reset=0', '-f', 'null', '-']
    result = subprocess.run(command, capture_output=True, timeout=120)
    text = (result.stdout + result.stderr).decode(errors='replace')
    (REPORTS / 'decoded' / (path.stem + '.txt')).write_text(text, encoding='utf-8')
    assert result.returncode == 0, str(path)
    overall = text.rsplit('Overall', 1)[-1]
    def field(name):
        matches = re.findall(re.escape(name) + r':\s+([-+\w.]+)', overall)
        assert matches, name
        return float(matches[-1])
    samples, nan, infinite, peak = field('Number of samples'), field('Number of NaNs'), field('Number of Infs'), field('Peak level dB')
    assert samples == frames, (path, samples, frames)
    assert nan == infinite == 0, str(path)
    assert peak < 0, (path, peak)
    return {'file': path.name, 'frames': int(samples), 'peak_dbfs': peak if math.isfinite(peak) else None,
            'nan': int(nan), 'infinite': int(infinite), 'sha256': expected_hash}


def main():
    (REPORTS / 'decoded').mkdir(exist_ok=True)
    catalog = json.loads((ASSETS / 'catalog.json').read_text(encoding='utf-8'))
    assert len(catalog['tracks']) == 16
    records, jobs = [], []
    for track in catalog['tracks']:
        result = json.loads((REPORTS / track['id'] / 'result.json').read_text(encoding='utf-8'))
        assert result['native']['exit_code'] == 0
        assert result['metrics']['nonFinite'] == result['metrics']['fullScale'] == 0
        assert result['metrics']['frames'] == track['seconds'] * 48000
        master = ROOT / result['master']['file']
        assert digest(master) == result['master']['sha256']
        with wave.open(str(master), 'rb') as file:
            assert (file.getnchannels(), file.getframerate(), file.getnframes(), file.getsampwidth()) == (2, 48000, track['seconds'] * 48000, 2)
        for item in result['outputs']:
            jobs.append((ASSETS / item['file'], track['seconds'] * 48000, item['sha256']))
        jobs.append((ASSETS / result['preview']['file'], 20 * 48000, result['preview']['sha256']))
        loudness = (REPORTS / track['id'] / 'loudness.txt').read_text(encoding='utf-8').rsplit('Summary:', 1)[-1]
        integrated = float(re.findall(r'I:\s+([-\d.]+) LUFS', loudness)[-1])
        true_peak = float(re.findall(r'Peak:\s+([-\d.]+) dBFS', loudness)[-1])
        assert true_peak < 0
        records.append({'id': track['id'], 'seconds': track['seconds'], 'events': result['events'], 'integrated_lufs': integrated,
                        'master_true_peak_dbfs': true_peak, 'master_sha256': result['master']['sha256']})
    with ThreadPoolExecutor(max_workers=3) as pool:
        decoded = list(pool.map(decode, jobs))
    assert len({item['master_sha256'] for item in records}) == 16
    report = {'revision': catalog['revision'], 'tracks': records, 'decoded': decoded, 'track_count': len(records),
              'seconds': sum(item['seconds'] for item in records), 'decoded_file_count': len(decoded),
              'limits': 'File and decoded-sample checks. No listening approval, physical-device, or true-peak guarantee for lossy encodings.'}
    (REPORTS / 'file-verification.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'tracks': len(records), 'seconds': report['seconds'], 'decoded_files': len(decoded),
                      'lufs_range': [min(item['integrated_lufs'] for item in records), max(item['integrated_lufs'] for item in records)],
                      'highest_master_true_peak_dbfs': max(item['master_true_peak_dbfs'] for item in records)}, indent=2))


if __name__ == '__main__': main()
