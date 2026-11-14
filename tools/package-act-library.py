"""Package the separate music library and complete current project source."""
import hashlib
import importlib.util
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'releases/stc-act-library-r1'
spec = importlib.util.spec_from_file_location('study_package_files', ROOT / 'tools/package-stc-study.py')
study = importlib.util.module_from_spec(spec)
spec.loader.exec_module(study)
README = '''Arrow Space Shift: Act music library r1

This separate listening build contains sixteen original experimental tracks.
Each Act has 1-, 2-, 4-, and 6-minute pieces. Total: 52 minutes.
The complete file durations include their endings. They are not seamless loops.
FoxDot authors the notes and patterns. SuperCollider renders the original instruments.
The browser plays two aligned exported layers.
Include atmosphere switches pads and noise on or off. Short chord stabs can remain in the core.
The campaign soundtrack is not replaced. No campaign progress is written by this page.
Listening approval, human recognition, and physical-device checks remain open.

Extract the complete ZIP before starting.
On Windows, open START-MUSIC-WINDOWS.bat.
The launcher requires Python 3 or Node.js.
Keep the server window open during use.
The default address is http://127.0.0.1:4189/.
You can also run: node tools/local-server.mjs --port=4189

Select an Act. Select a track. Select Play.
Use Include atmosphere to compare the same core at the same position.
Use Pause and Resume to retain the selected position.
Selecting another track stops the current track.
The player loads only the selected pair. A six-minute pair uses more memory than a short pair.

The campaign comparison is in game/index.html.
The earlier title-theme study remains at divergent-pulse.html.
This is not a published jam submission or a claim of full campaign acceptance.
No source license was selected. See NOTICE.txt.
'''
LAUNCHER = '''@echo off
setlocal
cd /d "%~dp0"
set ASS_PORT=4189
call START-GAME-WINDOWS.bat
'''


def package():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    runtime = {ROOT / name for name in study.CAMPAIGN}
    runtime.update(study.files_in('src'))
    runtime.update(study.files_in('assets'))
    runtime.update(ROOT.glob('RELEASE-NOTES-*.md'))
    sources = set(runtime)
    for folder in ['docs', 'tests', 'tools', 'archive', 'imports', 'reports', 'audio']:
        sources.update(study.files_in(folder))
    for pattern in ['*.html', '*.md', '*.txt']:
        sources.update(ROOT.glob(pattern))
    sources.add(ROOT / '.gitignore')
    html = (ROOT / 'music-library.html').read_text(encoding='utf-8').replace('href="index.html"', 'href="game/index.html"')
    title = (ROOT / 'divergent-pulse.html').read_text(encoding='utf-8').replace('href="./index.html"', 'href="./game/index.html"').replace('href="index.html"', 'href="game/index.html"')
    records = []
    for label in ['PLAY', 'SOURCE']:
        target = OUTPUT / f'Arrow-Space-Shift-STC-Act-Library-r1-{label}.zip'
        with ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
            if label == 'PLAY':
                archive.writestr('index.html', html)
                archive.writestr('music-library.html', html)
                archive.writestr('divergent-pulse.html', title)
                archive.writestr('READ-MUSIC.txt', README)
                archive.writestr('START-MUSIC-WINDOWS.bat', LAUNCHER)
                for path in sorted(runtime):
                    relative = path.relative_to(ROOT).as_posix()
                    if not relative.startswith('assets/audio/stc-act-library-r1/'):
                        archive.write(path, 'game/' + relative)
                for folder in ['src', 'assets/audio']:
                    for path in sorted(study.files_in(folder)):
                        archive.write(path, path.relative_to(ROOT).as_posix())
                for name in ['NOTICE.txt', 'START-GAME-WINDOWS.bat', 'package.json', 'tools/local-server.mjs', 'tools/launch-local.py']:
                    archive.write(ROOT / name, name)
            else:
                for path in sorted(sources):
                    assert path.resolve().is_relative_to(ROOT)
                    archive.write(path, path.relative_to(ROOT).as_posix())
        with ZipFile(target) as archive:
            names = archive.namelist()
            assert archive.testzip() is None
            assert len(names) == len(set(names))
            assert 'index.html' in names and 'music-library.html' in names
            assert 'assets/audio/stc-act-library-r1/catalog.json' in names
            for act in range(1, 5):
                for slot in range(1, 5):
                    assert f'assets/audio/stc-act-library-r1/act{act}-{slot:02d}.ogg' in names
        records.append({'file': target.name, 'bytes': target.stat().st_size, 'files': len(names), 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
        print(target, flush=True)
    (OUTPUT / 'manifest.json').write_text(json.dumps({'revision': 'stc-act-library-r1', 'archives': records}, indent=2) + '\n', encoding='utf-8')
    (OUTPUT / 'SHA256SUMS.txt').write_text(''.join(f"{item['sha256']}  {item['file']}\n" for item in records), encoding='utf-8')


if __name__ == '__main__': package()
