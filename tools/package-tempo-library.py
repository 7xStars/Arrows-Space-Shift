"""Package the tempo-study WAV masters and their complete editable source."""
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = Path('G:/Music Projects/Arrow Space Shift/stc-tempo-r2b')
REPORTS = ROOT / 'reports/stc-tempo-r2b'
AUTHOR = ROOT / 'audio/stc-tempo-r2'


def digest(path):
    value = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(block)
    return value.hexdigest()


def reaper_session(track):
    lines = ['<REAPER_PROJECT 0.1 7.0 1', '  SAMPLERATE 48000', f'  TEMPO {track["bpm"]}', '  LOOP 0']
    for index, section in enumerate(track['form'], 1):
        label = section['label'].replace('"', "'")
        lines.append(f'  MARKER {index} {section["at"] * track["seconds"]:.6f} "{label}" 0')
    for layer in ['core', 'atmosphere']:
        lines += ['  <TRACK', f'    NAME "{layer.title()}"', '    VOLPAN 1 0 1 -1', '    <ITEM', '      POSITION 0',
                  '      SNAPOFFS 0', f'      LENGTH {track["seconds"]}', '      VOLPAN 1 0 1 -1',
                  f'      NAME "{track["title"]} - {layer}"', '      <SOURCE WAVE',
                  f'        FILE "../stems/{track["id"]}-{layer}.wav"', '      >', '    >', '  >']
    lines.append('>')
    return '\n'.join(lines) + '\n'


def main():
    catalog = json.loads((ROOT / 'assets/audio/stc-tempo-r2/catalog.json').read_text())
    verification = json.loads((REPORTS / 'file-verification.json').read_text())
    if verification['track_count'] != len(catalog['tracks']) or verification['decoded_file_count'] != len(catalog['tracks']) * 4:
        raise ValueError('The verified delivery set is incomplete.')
    sessions = OUTPUT / 'sessions'
    sessions.mkdir(parents=True, exist_ok=True)
    masters, external = [], []
    for track in catalog['tracks']:
        record = json.loads((REPORTS / track['id'] / 'result.json').read_text())
        session = sessions / (track['id'] + '.RPP')
        session.write_text(reaper_session(track), encoding='utf-8')
        selections = [('masters', record['master']), *[('stems', item) for item in record['stems']], ('previews', record['preview']['wav'])]
        for folder, item in selections:
            path = Path(item['file'])
            if digest(path) != item['sha256']:
                raise ValueError(f'Delivery WAV hash differs: {path}.')
            details = {'id': track['id'], 'group': folder, 'source': str(path),
                       'archive_file': f'audio/stc-tempo-r2/{folder}/{path.name}', 'bytes': path.stat().st_size, 'sha256': item['sha256']}
            external.append(details)
            if folder == 'masters':
                masters.append(details)
        external.append({'id': track['id'], 'group': 'sessions', 'source': str(session),
                         'archive_file': f'audio/stc-tempo-r2/sessions/{session.name}',
                         'bytes': session.stat().st_size, 'sha256': digest(session)})
    manifest = {'revision': 'stc-tempo-r2', 'mix_revision': 'r2b', 'seconds': sum(track['seconds'] for track in catalog['tracks']),
                'masters': masters, 'files': external,
                'limits': 'REAPER files are generated editing handoffs. They were not opened or rendered in REAPER. Raw audio is on G:. Archive media paths are relative.'}
    (REPORTS / 'production-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    (ROOT / 'reports/stc-tempo-r2/production-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    source_files = {}
    folders = [AUTHOR, ROOT / 'assets/audio/stc-tempo-r2', REPORTS / 'decoded']
    folders += [REPORTS / track['id'] for track in catalog['tracks']]
    for folder in folders:
        for path in folder.rglob('*'):
            if path.is_file() and '__pycache__' not in path.parts:
                source_files[path.relative_to(ROOT).as_posix()] = path
    for name in ['environment.json', 'render-results.json', 'file-verification.json', 'production-manifest.json',
                 'verify.log', 'production-tests.log', 'RESULT.md', 'stereo-comparison.json', 'stereo-comparison.md',
                 'baseline-file-comparison.json']:
        path = REPORTS / name
        if path.is_file():
            source_files[path.relative_to(ROOT).as_posix()] = path
    for name in ['audio/stc-act-library-r1/compose.py', 'audio/stc-act-library-r1/act12.json', 'audio/stc-act-library-r1/act34.json',
                 'audio/stc-study/foxdot-room-r6/foxdot_take.py', 'tools/render-tempo-library.py', 'tools/verify-tempo-library.py',
                 'tools/package-tempo-library.py', 'tools/render-foxdot-room.py', 'tools/mix-act-library.mjs', 'tools/analyze-tempo-stereo.py',
                 'tests/test_tempo_library.py']:
        source_files[name] = ROOT / name
    source_files['NOTICE.txt'] = ROOT / 'NOTICE.txt'
    for item in external:
        source_files[item['archive_file']] = Path(item['source'])
    readme = OUTPUT / 'READ-ME-FIRST.txt'
    readme.write_text('Arrow Space Shift: STC tempo studies r2b\n\n'
                      'Nine original pieces span 120 through 240 BPM. Each piece lasts two minutes.\n'
                      'The 240 BPM piece now adds slow electronic swells and stronger upper-band stereo motion.\n'
                      'The other eight musical definitions remain unchanged. See the comparison report for actual file hashes.\n'
                      'The WAV archive contains the nine full mixes.\n'
                      'The SOURCE archive also contains core and atmosphere WAVs, previews, and editing handoffs.\n'
                      'Open audio/stc-tempo-r2/sessions/ in REAPER after extracting the complete SOURCE archive.\n'
                      'Each session uses relative paths to its two stems. REAPER did not render these recordings.\n'
                      'FoxDot 0.9.0 authors finite patterns. SuperCollider 3.14.1 generates the instruments.\n'
                      'No external samples or reference recordings were added. Coding agents assisted with this work.\n'
                      'Use the installed FoxDot Python to run tools/render-tempo-library.py.\n'
                      'Use --output and --scratch to select writable folders for the large WAV files.\n'
                      'The default tools paths refer to this workstation. Review those paths on another computer.\n'
                      'Run tools/verify-tempo-library.py after rendering.\n'
                      'These are finite arrangements with endings. No seamless loop or human listening approval is claimed.\n'
                      'No source license was selected. No publication occurred.\n', encoding='utf-8')
    source_files['READ-ME-FIRST.txt'] = readme
    targets = [('WAV', {Path(item['source']).name: Path(item['source']) for item in masters}), ('SOURCE', source_files)]
    archives = []
    for label, selected in targets:
        target = OUTPUT / f'Arrow-Space-Shift-STC-Tempo-r2b-{label}.zip'
        if target.exists():
            with ZipFile(target) as archive:
                if set(archive.namelist()) != set(selected) or archive.testzip() is not None:
                    raise FileExistsError(f'Existing archive does not match this delivery: {target}.')
                for name, path in selected.items():
                    value = hashlib.sha256()
                    with archive.open(name) as stream:
                        for block in iter(lambda: stream.read(1024 * 1024), b''):
                            value.update(block)
                    if value.hexdigest() != digest(path):
                        raise FileExistsError(f'Existing archive content differs: {target}: {name}.')
        else:
            with ZipFile(target, 'x', ZIP_DEFLATED, compresslevel=6) as archive:
                for name, path in sorted(selected.items()):
                    if not path.is_file():
                        raise FileNotFoundError(path)
                    archive.write(path, name)
        with ZipFile(target) as archive:
            if archive.testzip() is not None or len(archive.namelist()) != len(set(archive.namelist())):
                raise ValueError(f'Archive verification failed: {target}.')
            if label == 'WAV' and len(archive.namelist()) != 9:
                raise ValueError('The master archive does not contain all nine WAVs.')
            if label == 'SOURCE':
                names = set(archive.namelist())
                for track in catalog['tracks']:
                    for layer in ['core', 'atmosphere']:
                        if f'audio/stc-tempo-r2/stems/{track["id"]}-{layer}.wav' not in names:
                            raise ValueError('A relative REAPER input is missing.')
        archives.append({'file': str(target), 'bytes': target.stat().st_size, 'sha256': digest(target),
                         'files': len(selected), 'crc': 'passed'})
        print(str(target), flush=True)
    result = {'revision': catalog['revision'], 'mix_revision': 'r2b', 'archives': archives, 'masters': masters}
    (OUTPUT / 'manifest.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    (REPORTS / 'package-result.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'archives': len(archives), 'masters': len(masters), 'seconds': manifest['seconds']}, indent=2))


if __name__ == '__main__':
    main()
