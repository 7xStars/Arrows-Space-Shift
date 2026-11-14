"""Make aligned short WAV comparisons and a REAPER editing handoff."""
import array
import hashlib
import json
from pathlib import Path
import wave

ROOT = Path(__file__).resolve().parent.parent
AUTHOR = ROOT / 'audio/stc-study/foxdot-operator-r8'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def excerpt(source, target, start, end):
    with wave.open(str(source), 'rb') as input_file:
        assert (input_file.getnchannels(), input_file.getframerate(), input_file.getsampwidth()) == (2, 48000, 2)
        first, last = round(start * 48000), round(end * 48000)
        assert 0 <= first < last <= input_file.getnframes()
        input_file.setpos(first)
        data = array.array('h', input_file.readframes(last - first))
    count = last - first
    for i in range(min(960, count // 2)):
        factor = i / 960
        for channel in range(2):
            data[2 * i + channel] = round(data[2 * i + channel] * factor)
            index = 2 * (count - 1 - i) + channel
            data[index] = round(data[index] * factor)
    with wave.open(str(target), 'wb') as output_file:
        output_file.setparams((2, 2, 48000, count, 'NONE', 'not compressed'))
        output_file.writeframes(data.tobytes())
    return {'file': target.name, 'source': source.name, 'frames': count,
            'source_first_frame_inclusive': first, 'source_last_frame_exclusive': last,
            'rate': 48000, 'channels': 2, 'edge_fade_seconds': .02, 'sha256': sha(target)}


def main():
    records = []
    for region, begin_bar, end_bar in [('harmony', 12, 24), ('break-return', 26, 36)]:
        start, end = (.04 + bar * 240 / 134 for bar in [begin_bar, end_bar])
        for name, source in [('r8', 'ass-identified-return-r8-music.wav'), ('control', 'foundation-control.wav')]:
            records.append(excerpt(AUTHOR / source, AUTHOR / f'{region}-{name}.wav', start, end))
    manifest = {'revision': 'identified-return-r8-review', 'excerpts': records,
        'comparison': 'Same frame intervals and 20 ms edge fades. No independent gain change.',
        'limits': 'Finite takes with endings. No seamless-loop or human listening claim.'}
    (AUTHOR / 'review-excerpts.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    regions = [(0, .04 + 12 * 240 / 134, 'Retained pulse and sparse response'),
               (.04 + 12 * 240 / 134, .04 + 28 * 240 / 134, 'Harmonic persistence'),
               (.04 + 28 * 240 / 134, .04 + 32 * 240 / 134, 'Break and gate then room'),
               (.04 + 32 * 240 / 134, .04 + 40 * 240 / 134, 'Return and room then gate')]
    lines = ['<REAPER_PROJECT 0.1 7.0 1', '  SAMPLERATE 48000', '  TEMPO 134', '  MASTER_VOLUME 1']
    for number, (start, end, title) in enumerate(regions, 1):
        lines += [f'  MARKER {number} {start:.9f} "{title}" 1', f'  MARKER {number} {end:.9f} "" 1']
    with wave.open(str(AUTHOR / 'ass-identified-return-r8-music.wav'), 'rb') as file:
        seconds = file.getnframes() / file.getframerate()
    for title, name, mute in [('r7 foundation: common gain', 'foundation-control.wav', 0),
                              ('r8 added layers: common gain', 'new-layer.wav', 0),
                              ('r8 full mix reference: muted', 'ass-identified-return-r8-music.wav', 1)]:
        lines += ['  <TRACK', f'    NAME "{title}"', '    VOLPAN 1 0 1 -1', f'    MUTESOLO {mute} 0 0',
                  '    <ITEM', '      POSITION 0', f'      LENGTH {seconds:.9f}', '      VOLPAN 1 0 1 -1',
                  f'      NAME "{name}"', '      <SOURCE WAVE', f'        FILE "{name}"', '      >', '    >', '  >']
    lines += ['>']
    (AUTHOR / 'Identified-Return-r8.RPP').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(json.dumps({'excerpts': len(records), 'reaper': 'Editing handoff only. REAPER was not opened or used for rendering.'}, indent=2))


if __name__ == '__main__':
    main()
