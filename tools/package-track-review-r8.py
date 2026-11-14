"""Package the separate r8 music review and its authoring source."""
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
RELEASE = ROOT / 'releases/stc-study-r8'
AUTHOR = 'audio/stc-study/foxdot-operator-r8'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def add(files, name):
    path = ROOT / name
    if not path.is_file():
        raise FileNotFoundError(path)
    files[name] = path.read_bytes()


def archive(kind, files):
    assert 'index.html' in files and not any(name.lower().endswith('.pdf') for name in files)
    assert all('..' not in Path(name).parts and not Path(name).is_absolute() for name in files)
    entries = dict(files)
    records = [{'file': name, 'bytes': len(data), 'sha256': digest(data)} for name, data in sorted(entries.items())]
    entries['PACKAGED-FILES.json'] = (json.dumps({'revision': 'identified-return-r8', 'kind': kind,
        'files': records, 'limit': 'This list excludes itself. This archive contains a music review, not the campaign.'}, indent=2) + '\n').encode()
    target = RELEASE / f'Arrow-Space-Shift-Identified-Return-r8-{kind}.zip'
    with ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=6) as output:
        for name, data in sorted(entries.items()):
            output.writestr(name, data)
    with ZipFile(target) as output:
        assert output.testzip() is None
        assert len(output.namelist()) == len(set(output.namelist()))
        for name, data in entries.items():
            assert digest(output.read(name)) == digest(data)
    return {'file': target.name, 'bytes': target.stat().st_size, 'sha256': digest(target.read_bytes()),
            'entries': len(entries), 'files': records}


def main():
    RELEASE.mkdir(parents=True, exist_ok=True)
    play = {}
    for name in ['track-review-r8.html', 'src/track-review-r8.js', 'src/build.js', 'tools/local-server.mjs', 'NOTICE.txt']:
        add(play, name)
    play['index.html'] = play['track-review-r8.html']
    for name in ['ass-identified-return-r8-music.wav', 'foundation-control.wav', 'new-layer.wav',
                 'gate-room-proof.wav', 'room-gate-proof.wav', 'harmony-r8.wav', 'harmony-control.wav',
                 'break-return-r8.wav', 'break-return-control.wav', 'review-excerpts.json']:
        add(play, AUTHOR + '/' + name)
    play['package.json'] = (json.dumps({'name': 'arrow-space-shift-r8-music-review', 'version': '0.25.0-dev.1',
        'private': True, 'type': 'module', 'scripts': {'start': 'node tools/local-server.mjs --port=4193',
        'syntax': 'node tools/check-syntax.mjs', 'test': 'node --test tests/*.test.mjs',
        'check': 'npm run syntax && npm test'}}, indent=2) + '\n').encode()
    play['START-MUSIC-WINDOWS.bat'] = b'@echo off\r\nstart "" "%~dp0index.html"\r\n'
    play['README.txt'] = (
        'Arrow Space Shift: Identified Return r8\n\n'
        'This is a separate music review. It does not contain the campaign.\n'
        'Extract the complete archive.\n'
        'Open index.html to use the local native audio player.\n'
        'Alternatively, run START-MUSIC-WINDOWS.bat on Windows.\n'
        'It opens the local index.html file in your default browser.\n'
        'This review does not require Python or Node.js for local file playback.\n'
        'For optional HTTP playback, use the supplied Node.js server.\n'
        'Run: node tools/local-server.mjs --port=4193\n'
        'Then open http://127.0.0.1:4193/ in your browser.\n'
        'Keep that server terminal open during HTTP playback.\n\n'
        'Select r8 new mix or the retained foundation.\n'
        'Use the same listening volume for both.\n'
        'The short comparison files use the same source intervals and edge fades.\n'
        'The isolated new layers and room examples retain their mix levels.\n'
        'They are quieter than the complete track.\n'
        'The full take lasts 76.6418 seconds and includes its ending.\n'
        'It is not a seamless loop.\n'
        'The review does not write campaign saves or change gameplay.\n'
        'Human listening must determine musical quality and comfort.\n\n'
        'SOURCE adds FoxDot patterns, SuperCollider processors, inputs, and production tests.\n'
        'The input WAV files retain their original hashes.\n'
        'Use Python 3 with FoxDot 0.9.0 for the production tests.\n'
        'Run: python -m unittest discover -s tests -p "test_foxdot_operator_track.py"\n'
        'The native renderer also requires SuperCollider 3.14.1 and FFmpeg.\n'
        'Run: python tools/render-foxdot-operator-track.py --help\n'
        'Set --sc-root, --ffmpeg, and --scratch for your computer.\n'
        'The REAPER project is an editing handoff. It was not rendered in REAPER.\n'
        'No reference recording, sample pack, or reference PDF is included.\n'
        'No source-code license has been selected. See NOTICE.txt.\n'
    ).encode()
    result = {'revision': 'identified-return-r8', 'review': archive('REVIEW', play)}
    source = dict(play)
    for path in sorted((ROOT / AUTHOR).rglob('*')):
        if path.is_file() and '__pycache__' not in path.parts:
            add(source, path.relative_to(ROOT).as_posix())
    for name in ['audio/stc-study/foxdot-bass-r7/room_mix.wav', 'audio/stc-study/foxdot-bass-r7/dry_take.wav',
                 'audio/stc-study/foxdot-bass-r7/room_return.wav', 'reports/stc-study-r5/ass-identified-return-r5-stereo-music.wav',
                 'audio/stc-study/foxdot-room-r6/foxdot_take.py', 'tools/render-foxdot-room.py',
                 'tools/render-foxdot-operator-track.py', 'tools/prepare-track-review-r8.py',
                 'tools/package-track-review-r8.py', 'tools/track-review-r8-browser.mjs', 'tools/check-syntax.mjs',
                 'tests/test_foxdot_operator_track.py', 'tests/server-media.test.mjs',
                 'docs/tasks/STC-TRACK-009.md', 'docs/STC-TRACK-r8-INTERFACE.md', 'docs/STC-IDENTIFIED-RETURN-r8.md',
                 'reports/stc-study-r8/input-audit.json', 'reports/stc-study-r8/output-audit.json',
                 'reports/stc-study-r8/production-tests.txt', 'reports/stc-study-r8/final-node-check.txt',
                 'reports/stc-study-r8/final-python-tests.txt', 'reports/stc-study-r8/browser-source/results.json']:
        add(source, name)
    # The real HTTP media test uses a retained short fixture.
    add(source, 'assets/audio/stc-operator-lab-r1/dry.wav')
    result['source'] = archive('SOURCE', source)
    (RELEASE / 'MANIFEST.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    (RELEASE / 'SHA256SUMS.txt').write_text(''.join(f'{result[key]["sha256"]}  {result[key]["file"]}\n' for key in ['review', 'source']), encoding='utf-8')
    print(json.dumps({key: {field: result[key][field] for field in ['file', 'bytes', 'entries', 'sha256']}
                      for key in ['review', 'source']}, indent=2))


if __name__ == '__main__':
    main()
