"""Package the separate STC study and retain the campaign interface."""
import hashlib
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'releases/stc-study-r4'
CAMPAIGN = [
    'index.html', 'hyperbolic-act.html', 'hyperbolic-lab.html',
    'repair-dock.html', 'playtest.html', 'style.css', 'NOTICE.txt',
    'READ-ME-FIRST.txt', 'START-GAME-WINDOWS.bat', 'package.json',
    'tools/local-server.mjs', 'tools/launch-local.py',
]
STUDY_README = '''Arrow Space Shift: Structural Techno-Cosmism study r4

This is a separate research build. It is not the jam submission.
The earlier r2 musical direction was rejected.
This study develops pulse, groove, acid articulation, and gradual timbre changes.
Musical acceptance and human learning remain open.

Extract the complete ZIP before starting.
On Windows, open START-STUDY-WINDOWS.bat.
The launcher requires Python 3 or Node.js.
Keep the server window open during play.
If port 4187 is in use, close the earlier study server first.
You can also run: node tools/local-server.mjs --port=4187
Then open http://127.0.0.1:4187/.

The root entry opens The Divergent Pulse.
Use the page controls to start, pause, advance, or restart the study.
Space fires manually. Arrow keys turn and move the ship.
The field counts contacts without hull loss or campaign rewards.
The first transfer choice is recorded before feedback.
Audio-only is a listening probe. It is not blind combat.
The comparison conditions are research controls, not public campaign options.

The optional campaign comparison is in game/index.html.
It retains the rejected r2 score for comparison. It is not approved music.
The study does not write campaign saves.
This separate port has a different browser-storage origin from port 4177.

The browser synthesizes the original score and cues.
No REAPER, FoxDot, or SuperCollider installation is required for playback.
No reference recording, sample, image, or video is included.
See NOTICE.txt and the SOURCE archive for production and test records.
No game publication or source-license selection was made.
'''
STUDY_LAUNCHER = '''@echo off
setlocal
cd /d "%~dp0"
set ASS_PORT=4187
call START-GAME-WINDOWS.bat
'''


def files_in(folder):
    return [p for p in (ROOT / folder).rglob('*')
            if p.is_file() and not p.is_symlink()
            and not any(part in ['__pycache__', '.git', 'node_modules'] for part in p.parts)
            and not p.name.startswith('.env')]


def package():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    html = (ROOT / 'divergent-pulse.html').read_text(encoding='utf-8')
    game_link = 'href="./index.html"' if 'href="./index.html"' in html else 'href="index.html"'
    assert game_link in html, 'The study needs its campaign return link.'
    study_html = html.replace(game_link, 'href="./game/index.html"')
    runtime = {ROOT / name for name in CAMPAIGN}
    runtime.update(files_in('src'))
    runtime.update(files_in('assets'))
    runtime.update(ROOT.glob('RELEASE-NOTES-*.md'))
    sources = set(runtime)
    for folder in ['docs', 'tests', 'tools', 'archive', 'imports', 'reports', 'audio']:
        sources.update(files_in(folder))
    for pattern in ['*.html', '*.md', '*.txt']:
        sources.update(ROOT.glob(pattern))
    sources.add(ROOT / '.gitignore')
    records = []
    for label in ['PLAY', 'SOURCE']:
        target = OUTPUT / f'Arrow-Space-Shift-STC-study-r4-{label}.zip'
        with ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
            if label == 'PLAY':
                archive.writestr('index.html', study_html)
                archive.writestr('divergent-pulse.html', study_html)
                archive.writestr('READ-STUDY.txt', STUDY_README)
                archive.writestr('START-STUDY-WINDOWS.bat', STUDY_LAUNCHER)
                for path in sorted(runtime):
                    archive.write(path, 'game/' + path.relative_to(ROOT).as_posix())
                for folder in ['src']:
                    for path in sorted(files_in(folder)):
                        archive.write(path, path.relative_to(ROOT).as_posix())
                for name in ['NOTICE.txt', 'START-GAME-WINDOWS.bat', 'package.json',
                             'tools/local-server.mjs', 'tools/launch-local.py']:
                    archive.write(ROOT / name, name)
            else:
                for path in sorted(sources):
                    assert path.resolve().is_relative_to(ROOT)
                    archive.write(path, path.relative_to(ROOT).as_posix())
        with ZipFile(target) as archive:
            names = archive.namelist()
            assert archive.testzip() is None
            assert len(names) == len(set(names)) and 'index.html' in names
            assert 'src/stc-audio.js' in names and 'src/divergent-pulse-app.js' in names
        records.append({'file': target.name, 'bytes': target.stat().st_size,
                        'files': len(names), 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
        print(target)
    (OUTPUT / 'manifest.json').write_text(json.dumps({'study': 'stc-study-r4', 'archives': records}, indent=2) + '\n', encoding='utf-8')
    (OUTPUT / 'SHA256SUMS.txt').write_text(''.join(f"{record['sha256']}  {record['file']}\n" for record in records), encoding='utf-8')


if __name__ == '__main__':
    package()
