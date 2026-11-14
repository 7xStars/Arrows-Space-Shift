"""Package the separate operator laboratory without the reference PDFs."""
import hashlib
import json
from pathlib import Path
import re
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'releases/stc-operator-lab-r1'
REVISION = 'stc-operator-lab-r1'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def add(files, relative):
    path = ROOT / relative
    if not path.is_file():
        raise FileNotFoundError(path)
    files[relative] = path.read_bytes()


def folder(files, relative):
    for path in sorted((ROOT / relative).rglob('*')):
        if path.is_file() and '__pycache__' not in path.parts:
            add(files, path.relative_to(ROOT).as_posix())


def package(kind, files):
    assert not any(name.lower().endswith('.pdf') for name in files)
    assert 'index.html' in files
    assert all(not name.startswith('/') and '..' not in Path(name).parts for name in files)
    records = [{'file': name, 'bytes': len(data), 'sha256': digest(data)} for name, data in sorted(files.items())]
    entries = dict(files)
    entries['PACKAGED-FILES.json'] = (json.dumps({'revision': REVISION, 'kind': kind,
        'scope': 'Separate operator laboratory. The complete campaign and music library are supplied separately.',
        'files': records, 'limit': 'This list excludes PACKAGED-FILES.json itself.'}, indent=2) + '\n').encode()
    target = OUTPUT / f'Arrow-Space-Shift-Operator-Lab-r1-{kind}.zip'
    with ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
        for name, data in sorted(entries.items()):
            archive.writestr(name, data)
    with ZipFile(target) as archive:
        assert archive.testzip() is None
        assert len(archive.namelist()) == len(set(archive.namelist()))
        for name, data in entries.items():
            assert digest(archive.read(name)) == digest(data)
    return {'file': target.name, 'bytes': target.stat().st_size,
            'sha256': digest(target.read_bytes()), 'entries': len(entries), 'files': records}


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    files = {}
    page = (ROOT / 'operator-lab.html').read_text(encoding='utf-8')
    page, changed = re.subn(r'<nav aria-label="Project pages">.*?</nav>',
        '<p class="small">Separate laboratory. The campaign and Act music library are supplied separately.</p>', page, count=1)
    assert changed == 1
    files['index.html'] = files['operator-lab.html'] = page.encode('utf-8')
    for name in ['src/operator-lab-app.js', 'src/operator-models.js', 'src/operator-registry.js',
                 'src/klein.js', 'src/build.js', 'tools/local-server.mjs', 'tools/launch-local.py',
                 'START-GAME-WINDOWS.bat', 'NOTICE.txt']:
        add(files, name)
    folder(files, 'assets/audio/stc-operator-lab-r1')
    files['package.json'] = (json.dumps({'name': 'arrow-space-shift-operator-lab', 'version': '0.25.0-dev.1',
        'private': True, 'type': 'module', 'scripts': {'start': 'node tools/local-server.mjs --port=4192',
        'syntax': 'node tools/check-syntax.mjs', 'test': 'node --test tests/*.test.mjs',
        'check': 'npm run syntax && npm test'}}, indent=2) + '\n').encode()
    files['START-OPERATOR-WINDOWS.bat'] = b'@echo off\r\nsetlocal\r\nset ASS_PORT=4192\r\ncall "%~dp0START-GAME-WINDOWS.bat"\r\n'
    files['README.txt'] = (
        'Arrow Space Shift: operator laboratory r1\n\n'
        'This archive contains a separate laboratory. It does not contain the campaign.\n'
        'Extract the complete archive.\n'
        'On Windows, run START-OPERATOR-WINDOWS.bat.\n'
        'The launcher requires Python 3 or Node.js. It uses local port 4192.\n'
        'Alternatively, run: node tools/local-server.mjs --port=4192\n'
        'Then open http://127.0.0.1:4192/ in a current browser.\n'
        'Keep the server terminal open during use.\n'
        'Do not open index.html directly. Browser modules require a local HTTP server.\n\n'
        'Select Motion, Sound order, or Space kernels.\n'
        'Make a prediction before you inspect the result.\n'
        'To listen, select Sound in the Sound order section.\n'
        'Sound is off at startup. Reduced motion keeps static traces and labels.\n'
        'Export notes saves the first choices and a bounded event record.\n'
        'The laboratory does not write campaign saves.\n'
        'No FoxDot, SuperCollider, or REAPER installation is required for playback.\n'
        'The 16 Act music WAVs and title theme are supplied separately.\n\n'
        'The SOURCE archive adds authoring files, tests, reports, and native logs.\n'
        'In SOURCE, npm run check executes the 20 laboratory tests.\n'
        'The 9 Python production tests require Python 3 with FoxDot 0.9.0 installed.\n'
        'Run: python -m unittest discover -s tests -p "test_*.py"\n'
        'The renderer also requires SuperCollider 3.14.1.\n'
        'Run: python tools/render-operator-audio.py --help\n'
        'Set the native tool and scratch paths for your computer.\n'
        'Technical tests do not establish human listening quality or recognition.\n'
        'No reference PDF or external sound recording is included.\n'
        'No source-code license has been selected. See NOTICE.txt.\n'
    ).encode()
    play = package('PLAY', files)
    source = dict(files)
    folder(source, 'audio/stc-operator-lab-r1')
    for name in ['tools/render-operator-audio.py', 'tools/render-foxdot-room.py',
                 'tools/sync-operator-assets.py', 'tools/check-syntax.mjs', 'tools/operator-lab-browser.mjs',
                 'tools/package-operator-lab.py', 'audio/stc-study/foxdot-room-r6/foxdot_take.py',
                 'tests/operator-models.test.mjs', 'tests/operator-registry.test.mjs',
                 'tests/server-media.test.mjs', 'tests/test_operator_audio.py',
                 'docs/OPERATOR-SOURCE-REVIEW-r1.md', 'docs/OPERATOR-AV-GRAMMAR-v2.md',
                 'docs/OPERATOR-LAB-RESULT-r1.md', 'docs/tasks/STC-OPERATOR-008.md',
                 'reports/stc-operator-lab-r1/browser-source/results.json',
                 'reports/stc-operator-lab-r1/automated-check.txt',
                 'reports/stc-operator-lab-r1/python-production.txt',
                 'reports/stc-operator-lab-r1/wav-delivery.json']:
        add(source, name)
    result = {'revision': REVISION, 'play': play, 'source': package('SOURCE', source),
        'excluded': ['Reference PDFs and extracted text', 'Complete campaign', '16 Act music masters',
                     'FoxDot, SuperCollider, REAPER runtimes', 'Human listening or recognition results']}
    (OUTPUT / 'MANIFEST.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({key: {field: result[key][field] for field in ['file', 'bytes', 'sha256', 'entries']}
                      for key in ['play', 'source']}, indent=2))


if __name__ == '__main__':
    main()
