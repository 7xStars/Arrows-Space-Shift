"""Create curated PLAY and editable SOURCE archives. Use --plan before packaging."""
import argparse
import hashlib
import json
import os
import posixpath
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUTPUT = Path('G:/Music Projects/Arrow Space Shift/releases') if os.name == 'nt' else ROOT / 'releases'
ENTRIES = ('index.html', 'hyperbolic-act.html', 'repair-dock.html')
LAUNCH = ('NOTICE.txt', 'READ-ME-FIRST.txt', 'START-GAME-WINDOWS.bat', 'package.json', 'tools/local-server.mjs', 'tools/launch-local.py')
EXCLUDED_DIRS = {'.git', '.local', 'node_modules', '__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache', 'releases', 'private', 'secrets', '.venv', 'venv'}
EXCLUDED_SUFFIXES = {'.zip', '.7z', '.rar', '.tar', '.gz', '.pdf', '.epub', '.pyc', '.pyo', '.pem', '.key', '.p12', '.pfx'}
IMPORT = re.compile(r'''(?:\b(?:import|export)\s+(?:[^;\n]*?\s+from\s+)?|\bimport\s*\()\s*['"]([^'"]+)['"]''')
MODULE_URL = re.compile(r'''new\s+URL\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url''')
CSS_URL = re.compile(r'''url\(\s*['"]?([^)'"\s]+)''')

class PageReferences(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []
    def handle_starttag(self, tag, attrs):
        self.urls += [value for key, value in attrs if key in {'src', 'href', 'poster'} and value]

def local_reference(owner, value):
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc or not parsed.path:
        return None
    name = posixpath.normpath(posixpath.join(posixpath.dirname(owner), unquote(parsed.path)))
    if name in {'.', ''}:
        return 'index.html'
    if name.startswith('../') or name.startswith('/'):
        raise ValueError(f'Reference leaves the package: {owner}: {value}')
    return name

def text_references(name, text):
    suffix = Path(name).suffix
    values = []
    if suffix == '.html':
        parser = PageReferences()
        parser.feed(text)
        values += parser.urls
    if suffix in {'.html', '.css'}:
        values += CSS_URL.findall(text)
    if suffix in {'.js', '.mjs'}:
        values += [value for value in IMPORT.findall(text) if value.startswith('.')]
        values += MODULE_URL.findall(text)
    return {item for value in values if (item := local_reference(name, value)) is not None}

def public_act_limit(build_source):
    match = re.search(r'\bmaxAct\s*:\s*(\d+)', build_source)
    limit = int(match.group(1)) if match else 4
    if re.search(r'\bpostJamContent\s*:\s*false\b', build_source):
        limit = min(limit, 3)
    if not 1 <= limit <= 4:
        raise ValueError('The public Act limit is not valid.')
    return limit


def act_limit(root):
    path = root / 'src/build.js'
    return public_act_limit(path.read_text(encoding='utf-8')) if path.is_file() else 4


def public_entries(limit):
    return ENTRIES if limit >= 4 else ('index.html',)


def recorded_files(root):
    """Read the runtime registry. Do not repeat its track IDs here."""
    limit = act_limit(root)
    script = "import {CAMPAIGN_RECORDINGS as r} from './src/campaign-recorded-audio.js';" + f"console.log(JSON.stringify(Object.values(r).filter(t=>t.id.startsWith('identified-return-')||Number(t.id.match(/^act(\\d+)-/)?.[1])<={limit}).flatMap(t=>t.segments.flatMap(s=>s.urls))))"
    result = subprocess.run(['node', '--input-type=module', '-e', script], cwd=root, text=True, capture_output=True, check=True)
    names = []
    for url in json.loads(result.stdout):
        parsed = urlsplit(url)
        path = Path(unquote(parsed.path.lstrip('/') if os.name == 'nt' else parsed.path))
        names.append(path.resolve().relative_to(root.resolve()).as_posix())
    expected = limit * 20 + 1
    if len(names) != expected or len(set(names)) != expected:
        raise ValueError(f'Expected {limit * 20} campaign stems and one title recording.')
    return set(names)

def play_files(root, music=None):
    """Follow static dependencies and the two dynamic asset registries."""
    selected = set(public_entries(act_limit(root))) | set(LAUNCH) | (recorded_files(root) if music is None else set(music))
    selected |= {p.relative_to(root).as_posix() for p in (root / 'assets/crossing').rglob('*') if p.is_file()}
    version = json.loads((root / 'package.json').read_text(encoding='utf-8'))['version']
    notes = root / f'RELEASE-NOTES-v{version}.md'
    if notes.is_file():
        selected.add(notes.name)
    pending, checked = list(selected), set()
    while pending:
        name = pending.pop()
        if name in checked:
            continue
        checked.add(name)
        path = root / name
        if not path.is_file():
            raise FileNotFoundError(f'Missing runtime file: {name}')
        if path.suffix in {'.html', '.css', '.js', '.mjs'}:
            for dependency in text_references(name, path.read_text(encoding='utf-8')):
                if dependency not in selected:
                    selected.add(dependency)
                    pending.append(dependency)
    forbidden = [name for name in selected if Path(name).name in {'hyperbolic-lab.html', 'operator-lab.html', 'divergent-pulse.html', 'playtest.html', 'music-library.html', 'track-review-r8.html', 'track-review-r9.html'}]
    if forbidden:
        raise ValueError(f'Research pages entered PLAY: {forbidden}')
    return sorted(selected)

def source_allowed(name):
    parts = Path(name).parts
    return not (any(part in EXCLUDED_DIRS for part in parts) or Path(name).suffix.lower() in EXCLUDED_SUFFIXES
                or Path(name).as_posix().startswith('reports/mute-investigation/')
                or any(part.startswith('.env') for part in parts)
                or any(part.lower() in {'credentials.json', 'token.json', 'tokens.json'} for part in parts))

def source_files(root, output):
    selected, output = [], output.resolve()
    for folder, dirs, files in os.walk(root, followlinks=False):
        current = Path(folder)
        dirs[:] = [name for name in dirs if name not in EXCLUDED_DIRS and not (current / name).is_symlink()
                   and not getattr(current / name, 'is_junction', lambda: False)() and (current / name).resolve() != output]
        for name in files:
            path = current / name
            relative = path.relative_to(root).as_posix()
            if path.is_file() and not path.is_symlink() and source_allowed(relative):
                selected.append(relative)
    return sorted(selected)

def streamed_sha256(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()

def tempo_master_files(root, directory):
    """Map verified production masters to portable SOURCE paths."""
    if directory is None:
        return {}
    directory = Path(directory)
    if directory.is_symlink() or getattr(directory, 'is_junction', lambda: False)():
        raise ValueError('The master folder must not be a link.')
    directory = directory.resolve(strict=True)
    catalog = json.loads((root / 'assets/audio/stc-tempo-r2/catalog.json').read_text(encoding='utf-8'))
    expected = {f'tempo-act{act}-{slot:02d}' for act, count in enumerate([3, 2, 2, 2], 1) for slot in range(1, count + 1)}
    tracks = catalog.get('tracks', [])
    if catalog.get('revision') != 'stc-tempo-r2' or len(tracks) != 9 or {track.get('id') for track in tracks} != expected:
        raise ValueError('The tempo master catalog must contain all nine expected identities.')
    if {path.stem for path in directory.glob('*.wav')} != expected:
        raise ValueError('The master folder must contain exactly the nine tempo WAVs.')
    selected = {}
    for identity in sorted(expected):
        path = directory / f'{identity}.wav'
        if path.is_symlink() or not path.is_file() or path.resolve().parent != directory:
            raise ValueError(f'The master must be a regular file in its folder: {identity}')
        name = f'audio/stc-tempo-r2/masters/{identity}.wav'
        if (root / name).exists():
            raise ValueError(f'The source already contains this master: {name}')
        selected[name] = path
    return selected

def tempo_production_files(root, manifest_path):
    """Include the exact verified production set, with portable archive names."""
    manifest = json.loads(Path(manifest_path).read_text(encoding='utf-8'))
    if manifest.get('revision') != 'stc-tempo-r2' or len(manifest.get('masters', [])) != 9:
        raise ValueError('The production manifest must identify the nine tempo masters.')
    production = Path(manifest['masters'][0]['source']).parent.parent
    masters = tempo_master_files(root, production / 'masters')
    identities = [Path(name).stem for name in masters]
    expected = {}
    for identity in identities:
        for group, filename in [('masters', f'{identity}.wav'), ('stems', f'{identity}-core.wav'),
                                ('stems', f'{identity}-atmosphere.wav'), ('previews', f'{identity}-preview.wav'),
                                ('sessions', f'{identity}.RPP')]:
            expected[f'audio/stc-tempo-r2/{group}/{filename}'] = production / group / filename
    records = manifest.get('files', [])
    if len(records) != 45 or {item.get('archive_file') for item in records} != set(expected):
        raise ValueError('The production manifest must contain the exact 45-file tempo set.')
    for item in records:
        name = item['archive_file']
        path = expected[name]
        if path.is_symlink() or path.parent.is_symlink() or getattr(path.parent, 'is_junction', lambda: False)():
            raise ValueError(f'Production links are not permitted: {name}')
        if not path.is_file() or Path(item['source']).resolve() != path.resolve():
            raise ValueError(f'The production source differs: {name}')
        if (root / name).exists():
            raise ValueError(f'The source already contains this production file: {name}')
        if item.get('bytes') != path.stat().st_size or item.get('sha256') != streamed_sha256(path):
            raise ValueError(f'The production hash or size differs: {name}')
    return expected

def verify_archive(path, expected=None, label=None):
    with ZipFile(path) as archive:
        names = archive.namelist()
        if len(names) != len(set(names)):
            raise ValueError('Archive names must be unique.')
        if any(name.startswith('/') or '..' in name.split('/') or '\\' in name for name in names):
            raise ValueError('Unsafe archive path.')
        if archive.testzip() is not None:
            raise ValueError('Archive CRC check failed.')
        build_source = archive.read('src/build.js').decode('utf-8') if 'src/build.js' in names else ''
        limit = public_act_limit(build_source)
        required = set(public_entries(limit)) | {'src/app.js', 'src/campaign-recorded-audio.js', 'assets/crossing/manifest.json'} | set(LAUNCH)
        if label != 'PLAY' or limit >= 4:
            required |= set(ENTRIES) | {'src/hyperbolic-act.js', 'src/repair-app.js'}
        if not required.issubset(names):
            raise ValueError(f'Required files are missing: {sorted(required - set(names))}')
        if expected is not None and set(expected) != set(names):
            raise ValueError('Archive contents differ from the selected file list.')
        for name in names:
            if Path(name).suffix in {'.html', '.css', '.js', '.mjs'} and (label == 'PLAY' or name in ENTRIES):
                references = text_references(name, archive.read(name).decode('utf-8'))
                if references - set(names):
                    raise ValueError(f'Missing relative files in {name}: {sorted(references - set(names))}')
        if label == 'PLAY':
            recorded = [n for n in names if n.startswith('assets/audio/campaign-music-v1/') and n.endswith('.ogg')]
            if len(recorded) != limit * 20 or 'assets/audio/stc-title-r9.ogg' not in names:
                raise ValueError('The campaign recordings are incomplete.')
            registry = archive.read('src/campaign-recorded-audio.js').decode('utf-8')
            ids = [identity for identity in re.findall(r"\btrack\('([^']+)'", registry)
                   if int(re.match(r'act(\d+)-', identity).group(1)) <= limit]
            expected_music = {f'assets/audio/campaign-music-v1/{track}-{i:02d}-{layer}.ogg'
                              for track in ids for i in range(10) for layer in ['core', 'atmosphere']}
            if len(ids) != limit or expected_music != set(recorded):
                raise ValueError('Recorded file names differ from the runtime registry.')
            if limit < 4 and any(name in names for name in ('hyperbolic-act.html', 'repair-dock.html', 'src/hyperbolic-act.js', 'src/repair-app.js')):
                raise ValueError('Post-jam entry content entered PLAY.')
            if any(n.startswith(('audio/', 'tests/', 'reports/', 'imports/', 'archive/')) for n in names):
                raise ValueError('Authoring or test files entered PLAY.')
            if any(Path(n).name in {'hyperbolic-lab.html', 'operator-lab.html', 'divergent-pulse.html',
                   'playtest.html', 'music-library.html', 'track-review-r8.html', 'track-review-r9.html'} for n in names):
                raise ValueError('A research page entered PLAY.')
        manifest = json.loads(archive.read('assets/crossing/manifest.json').decode('utf-8'))
        art_files = {manifest['atlas']} | {frame['file'] for frame in manifest['frames'].values()}
        missing_art = {f'assets/crossing/{name}' for name in art_files} - set(names)
        if missing_art:
            raise ValueError(f'Art files are missing: {sorted(missing_art)}')
        return {'files': len(names), 'uncompressedBytes': sum(info.file_size for info in archive.infolist()), 'crc': 'passed', 'relativeReferences': 'passed'}

def build_plan(root, output, extras=None):
    extras = extras or {}
    play, source = play_files(root), source_files(root, output)
    if set(source) & set(extras):
        raise ValueError('External masters must not replace source files.')
    source = sorted(set(source) | set(extras))
    if not set(play).issubset(source):
        raise ValueError('SOURCE must contain every PLAY file.')
    return {label: {'files': files, 'count': len(files), 'bytes': sum(extras.get(name, root / name).stat().st_size for name in files)} for label, files in [('PLAY', play), ('SOURCE', source)]}

def package(root=ROOT, output=DEFAULT_OUTPUT, plan_only=False, plan_file=None, tempo_masters=None, tempo_manifest=None):
    version = json.loads((root / 'package.json').read_text(encoding='utf-8'))['version']
    if tempo_masters is not None and tempo_manifest is not None:
        raise ValueError('Select one tempo production input.')
    extras = tempo_production_files(root, tempo_manifest) if tempo_manifest else tempo_master_files(root, tempo_masters)
    plan = build_plan(root, output, extras)
    if plan_file:
        plan_file.parent.mkdir(parents=True, exist_ok=True)
        plan_file.write_text(json.dumps({'version': version, 'packages': plan}, indent=2) + '\n', encoding='utf-8')
    if plan_only:
        print(json.dumps({'version': version, 'output': str(output / version), 'packages': {label: {k: v for k, v in item.items() if k != 'files'} for label, item in plan.items()}}, indent=2))
        return
    destination = output / version
    destination.mkdir(parents=True, exist_ok=True)
    targets = {label: destination / f'Arrow-Space-Shift-v{version}-{label}.zip' for label in plan}
    if any(path.exists() for path in targets.values()):
        raise FileExistsError('Release archives already exist. Use a new output folder or version.')
    records = []
    for label, item in plan.items():
        target = targets[label]
        with ZipFile(target, 'x', ZIP_DEFLATED, compresslevel=6) as archive:
            for name in item['files']:
                archive.write(extras.get(name, root / name), name)
        verified = verify_archive(target, item['files'], label)
        records.append({'file': target.name, 'bytes': target.stat().st_size, 'sha256': streamed_sha256(target), **verified})
        print(target, flush=True)
    extra_records = [{'file': name, 'sha256': streamed_sha256(path)} for name, path in extras.items()]
    (destination / 'manifest.json').write_text(json.dumps({'version': version, 'archives': records, 'sourceExtras': extra_records}, indent=2) + '\n', encoding='utf-8')
    (destination / 'package-file-lists.json').write_text(json.dumps(plan, indent=2) + '\n', encoding='utf-8')
    (destination / 'SHA256SUMS.txt').write_text(''.join(f"{r['sha256']}  {r['file']}\n" for r in records), encoding='utf-8')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT, help='Parent folder for the versioned release folder.')
    parser.add_argument('--plan', action='store_true', help='Report selected files and sizes. Do not create archives.')
    parser.add_argument('--plan-file', type=Path, help='Write the complete selected file lists as JSON.')
    tempo_input = parser.add_mutually_exclusive_group()
    tempo_input.add_argument('--tempo-masters', type=Path, help='Include the nine production WAVs in portable SOURCE paths.')
    tempo_input.add_argument('--tempo-manifest', type=Path, help='Include all 45 verified tempo production files in SOURCE.')
    args = parser.parse_args()
    package(output=args.output, plan_only=args.plan, plan_file=args.plan_file, tempo_masters=args.tempo_masters, tempo_manifest=args.tempo_manifest)
