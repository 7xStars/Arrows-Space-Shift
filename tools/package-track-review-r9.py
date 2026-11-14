"""Package the isolated percussion revision and complete music sources."""
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
RELEASE = ROOT / 'releases/stc-study-r9'
AUTHOR = 'audio/stc-study/foxdot-percussion-r9'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def add(files, name):
    files[name] = (ROOT / name).read_bytes()


def folder(files, name):
    for path in sorted((ROOT / name).rglob('*')):
        if path.is_file() and '__pycache__' not in path.parts:
            add(files, path.relative_to(ROOT).as_posix())


def archive(kind, files):
    assert 'index.html' in files
    assert not any(name.lower().endswith('.pdf') for name in files)
    assert all(not Path(name).is_absolute() and '..' not in Path(name).parts for name in files)
    records = [{'file': name, 'bytes': len(data), 'sha256': sha(data)} for name, data in sorted(files.items())]
    entries = dict(files)
    entries['PACKAGED-FILES.json'] = (json.dumps({'revision': 'identified-return-r9', 'kind': kind,
        'files': records, 'limit': 'This list excludes itself. The archive contains a music review, not the campaign.'}, indent=2) + '\n').encode()
    target = RELEASE / f'Arrow-Space-Shift-Identified-Return-r9-{kind}.zip'
    with ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=6) as output:
        for name, data in sorted(entries.items()):
            output.writestr(name, data)
    with ZipFile(target) as output:
        assert output.testzip() is None
        assert len(output.namelist()) == len(set(output.namelist()))
        for name, data in entries.items():
            assert sha(output.read(name)) == sha(data)
    return {'file': target.name, 'bytes': target.stat().st_size, 'sha256': sha(target.read_bytes()),
            'entries': len(entries), 'files': records}


def main():
    RELEASE.mkdir(parents=True, exist_ok=True)
    play = {}
    for name in ['track-review-r9.html', 'src/track-review-r9.js', 'src/build.js', 'tools/local-server.mjs', 'NOTICE.txt']:
        add(play, name)
    play['index.html'] = play['track-review-r9.html']
    for name in ['ass-identified-return-r9-music.wav', 'r8-control.wav', 'mechanical-response.wav',
                 'r8-percussion-control.wav', 'percussion-r9.wav', 'percussion-r8.wav',
                 'break-return-r9.wav', 'break-return-r8.wav', 'review-excerpts.json']:
        add(play, AUTHOR + '/' + name)
    play['package.json'] = (json.dumps({'name': 'arrow-space-shift-r9-music-review', 'version': '0.25.0-dev.1',
        'private': True, 'type': 'module', 'scripts': {'start': 'node tools/local-server.mjs --port=4193',
        'syntax': 'node tools/check-syntax.mjs', 'test': 'node --test tests/*.test.mjs',
        'check': 'npm run syntax && npm test'}}, indent=2) + '\n').encode()
    play['START-MUSIC-WINDOWS.bat'] = b'@echo off\r\nstart "" "%~dp0index.html"\r\n'
    play['README.txt'] = (
        'Arrow Space Shift: Identified Return r9\n\n'
        'This music review raises only the added percussion by 10 dB.\n'
        'The r8 mix remains available for comparison.\n'
        'Extract the complete archive.\n'
        'Open index.html, or run START-MUSIC-WINDOWS.bat on Windows.\n'
        'Local file playback requires a browser. It does not require an audio authoring tool.\n'
        'For optional HTTP playback, use: node tools/local-server.mjs --port=4193\n'
        'Then open http://127.0.0.1:4193/ in your browser.\n\n'
        'Select r9 stronger percussion or r8 previous percussion level.\n'
        'Use the same listening volume for both.\n'
        'Use Response for the three-hit response before the harmony.\n'
        'Use Return for the full pulse.\n'
        'The short clips use equal source intervals and edge fades.\n'
        'The complete take has an ending. It is not a seamless loop.\n'
        'No campaign save or game rule changes.\n\n'
        'SOURCE contains the r8 and r9 authoring sources and native outputs.\n'
        'FoxDot 0.9.0 supplies the retained finite patterns. SuperCollider 3.14.1 renders them.\n'
        'The r9 renderer also requires FFmpeg for loudness measurements.\n'
        'Run: python tools/render-foxdot-percussion-r9.py --help\n'
        'Set --sc-root, --scratch, and --ffmpeg for your computer.\n'
        'Run the Python tests in an environment with FoxDot installed:\n'
        'python -m unittest discover -s tests -p "test_*.py"\n'
        'The REAPER files are editing handoffs. They were not rendered in REAPER.\n'
        'Human listening must determine musical quality and distinctness.\n'
        'No source-code license has been selected. See NOTICE.txt.\n'
    ).encode()
    result = {'revision': 'identified-return-r9', 'review': archive('REVIEW', play)}
    source = dict(play)
    folder(source, 'audio/stc-study/foxdot-operator-r8')
    folder(source, AUTHOR)
    for name in ['audio/stc-study/foxdot-bass-r7/room_mix.wav', 'audio/stc-study/foxdot-bass-r7/dry_take.wav',
                 'audio/stc-study/foxdot-bass-r7/room_return.wav', 'reports/stc-study-r5/ass-identified-return-r5-stereo-music.wav',
                 'audio/stc-study/foxdot-room-r6/foxdot_take.py', 'tools/render-foxdot-room.py',
                 'tools/render-foxdot-operator-track.py', 'tools/prepare-track-review-r8.py',
                 'track-review-r8.html', 'src/track-review-r8.js', 'tools/track-review-r8-browser.mjs',
                 'tools/render-foxdot-percussion-r9.py', 'tools/prepare-track-review-r9.py',
                 'tools/package-track-review-r9.py', 'tools/track-review-r9-browser.mjs', 'tools/check-syntax.mjs',
                 'tests/test_foxdot_operator_track.py', 'tests/test_foxdot_percussion_r9.py', 'tests/server-media.test.mjs',
                 'assets/audio/stc-operator-lab-r1/dry.wav', 'docs/tasks/STC-TRACK-009.md', 'docs/tasks/STC-TRACK-010.md',
                 'docs/STC-IDENTIFIED-RETURN-r8.md', 'docs/STC-IDENTIFIED-RETURN-r9.md',
                 'reports/stc-study-r9/input-preservation.json', 'reports/stc-study-r9/output-audit.json',
                 'reports/stc-study-r9/python-production.txt', 'reports/stc-study-r9/final-node-check.txt',
                 'reports/stc-study-r9/browser-source/results.json']:
        add(source, name)
    result['source'] = archive('SOURCE', source)
    (RELEASE / 'MANIFEST.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    (RELEASE / 'SHA256SUMS.txt').write_text(''.join(f'{result[key]["sha256"]}  {result[key]["file"]}\n' for key in ['review', 'source']), encoding='utf-8')
    print(json.dumps({key: {field: result[key][field] for field in ['file', 'bytes', 'entries', 'sha256']}
                      for key in ['review', 'source']}, indent=2))


if __name__ == '__main__':
    main()
