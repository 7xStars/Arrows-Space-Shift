"""Measure actual channel energy in the baseline and revised 240 BPM files."""
import array
import hashlib
import json
import math
from pathlib import Path
import statistics
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
OLD = Path('G:/Music Projects/Arrow Space Shift/stc-tempo-r2')
NEW = Path('G:/Music Projects/Arrow Space Shift/stc-tempo-r2b')
REPORTS = ROOT / 'reports/stc-tempo-r2b'
FFMPEG = Path('G:/Music Tools/FFmpeg/python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v9.0.2.exe')
IDENTIFIER = 'tempo-act3-02'


def digest(path):
    value = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(block)
    return value.hexdigest()


def energy(path, high, low):
    result = subprocess.run([str(FFMPEG), '-hide_banner', '-loglevel', 'error', '-i', str(path),
                             '-af', f'highpass=f={high},lowpass=f={low}', '-ar', '12000', '-ac', '2', '-f', 'f32le', '-'],
                            capture_output=True, check=True, timeout=120)
    samples = array.array('f', result.stdout)
    if sys.byteorder != 'little':
        samples.byteswap()
    window = 3000
    rows = []
    for first in range(0, len(samples), window * 2):
        values = samples[first:first + window * 2]
        left = sum(value * value for value in values[0::2])
        right = sum(value * value for value in values[1::2])
        total = left + right
        if not math.isfinite(total):
            raise ValueError('Non-finite decoded energy.')
        rows.append({'time': first / 24000, 'balance': (right - left) / total if total > 1e-16 else 0,
                     'leftRms': math.sqrt(left / (len(values) / 2)), 'rightRms': math.sqrt(right / (len(values) / 2))})
    selected = [row for row in rows if 20 <= row['time'] < 44]
    balances = [row['balance'] for row in selected]
    return {'filterHz': [high, low], 'windowSeconds': .25, 'comparisonSeconds': [20, 44],
            'balanceConvention': 'Positive means greater right-channel energy.', 'rows': rows,
            'summary': {'standardDeviation': statistics.pstdev(balances),
                        'medianAbsoluteBalance': statistics.median(abs(value) for value in balances),
                        'minimumBalance': min(balances), 'maximumBalance': max(balances),
                        'rightWindowsAbovePointOne': sum(value > .1 for value in balances),
                        'leftWindowsBelowMinusPointOne': sum(value < -.1 for value in balances)}}


def main():
    REPORTS.mkdir(parents=True, exist_ok=True)
    comparison = {'track': IDENTIFIER, 'measurement': 'Actual filtered stereo PCM energy. These are file measurements, not a perceptual or headphone test.', 'signals': {}}
    for kind in ['full', 'core', 'atmosphere']:
        suffix = '' if kind == 'full' else '-' + kind
        folder = 'masters' if kind == 'full' else 'stems'
        old, new = OLD / folder / (IDENTIFIER + suffix + '.wav'), NEW / folder / (IDENTIFIER + suffix + '.wav')
        comparison['signals'][kind] = {'baseline': {'file': str(old), 'sha256': digest(old)}, 'revised': {'file': str(new), 'sha256': digest(new)}}
        for label, path in [('baseline', old), ('revised', new)]:
            comparison['signals'][kind][label]['upper'] = energy(path, 250, 2600)
            comparison['signals'][kind][label]['low'] = energy(path, 20, 90)
    baseline_source = json.loads((NEW / 'baseline-r2/authoring/act34.json').read_text())
    current_source = json.loads((ROOT / 'audio/stc-tempo-r2/act34.json').read_text())
    old_track, new_track = [next(item for item in source if item['id'] == IDENTIFIER) for source in [baseline_source, current_source]]
    comparison['sourcePan'] = {'baseline': {'depth': old_track['pan_depth'], 'cycleSeconds': old_track['pan_cycle_beats'] * 60 / old_track['bpm']},
                               'revised': {'depth': new_track['pan_depth'], 'cycleSeconds': new_track['pan_cycle_beats'] * 60 / new_track['bpm']}}
    comparison['limits'] = 'Kick and low-bass source routes remain centered. The 120 Hz crossover is not a brick-wall filter. Existing delays, residual upper-bass content, and ambience can produce low-band channel differences. These measurements do not claim a perfectly mono complete low band or human recognition.'
    (REPORTS / 'stereo-comparison.json').write_text(json.dumps(comparison, indent=2) + '\n', encoding='utf-8')
    lines = ['# 240 BPM stereo comparison', '', 'The analysis filters actual PCM files and measures each 250 ms window.',
             'The selected comparison interval is 20 through 44 seconds.', '', '| Signal | Baseline upper-band balance deviation | Revised upper-band balance deviation |', '|---|---:|---:|']
    for kind, signal in comparison['signals'].items():
        before = signal['baseline']['upper']['summary']['standardDeviation']
        after = signal['revised']['upper']['summary']['standardDeviation']
        lines.append(f'| {kind} | {before:.4f} | {after:.4f} |')
    lines += ['', comparison['limits'], '', 'These results do not establish musical approval. The supplied WAVs permit a separate listening comparison.']
    (REPORTS / 'stereo-comparison.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    excerpt = NEW / 'comparison'
    excerpt.mkdir(exist_ok=True)
    for label, source in [('baseline', OLD), ('revised', NEW)]:
        subprocess.run([str(FFMPEG), '-hide_banner', '-loglevel', 'error', '-y', '-ss', '20', '-i', str(source / 'masters' / (IDENTIFIER + '.wav')),
                        '-t', '24', '-af', 'afade=t=in:d=0.02,afade=t=out:st=23.95:d=0.05', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le',
                        str(excerpt / (label + '-240-stereo.wav'))], check=True)
    print(json.dumps({kind: {label: signal[label]['upper']['summary'] for label in ['baseline', 'revised']} for kind, signal in comparison['signals'].items()}, indent=2))


if __name__ == '__main__':
    main()
