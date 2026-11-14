"""Copy the public source candidate into its isolated Git checkout."""
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[2]
TARGET = Path('G:/Music Projects/Arrow Space Shift/scratch/git-candidate-0.25.1')
REPORT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('release_package', ROOT / 'tools/package-release.py')
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


def digest(path):
    value = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(block)
    return value.hexdigest()


def selected_files():
    names = release.source_files(ROOT, TARGET)
    return [name for name in names
            if not name.startswith(('archive/', 'imports/'))
            and not (name.startswith(('audio/', 'reports/')) and Path(name).suffix.lower() == '.wav')
            and not name.endswith(('.rpp-bak', '.RPP-bak'))
            and name != 'reports/git-release-0.25.1/source-selection.json']


def prepare():
    target = TARGET.resolve()
    expected = Path('G:/Music Projects/Arrow Space Shift/scratch/git-candidate-0.25.1').resolve()
    if target != expected or not (target / '.git').is_dir():
        raise ValueError('The isolated Git target is not available.')
    names = selected_files()
    wanted = set(names)
    tracked = subprocess.check_output(['git', 'ls-files', '-z'], cwd=target).decode('utf-8').split('\0')
    removed = []
    for name in tracked:
        if not name or name in wanted:
            continue
        old = target / name
        if not old.resolve().is_relative_to(target) or name.startswith('.git/'):
            raise ValueError(f'Unsafe old path: {name}')
        if old.is_file():
            old.unlink()
            removed.append(name)
    records = []
    for name in names:
        source, destination = ROOT / name, target / name
        if not destination.resolve().is_relative_to(target):
            raise ValueError(f'Unsafe target path: {name}')
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        records.append({'file': name, 'bytes': source.stat().st_size, 'sha256': digest(source)})
    report = {'root': str(ROOT), 'target': str(target), 'files': len(records),
              'bytes': sum(record['bytes'] for record in records), 'removedOldPaths': removed,
              'excluded': ['Raw WAV files', 'Preserved imports and archives', 'Private reference PDFs',
                           'Caches, environment files, credentials, and prior release archives'],
              'selected': records}
    REPORT.mkdir(parents=True, exist_ok=True)
    (REPORT / 'source-selection.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({key: value for key, value in report.items() if key not in {'selected', 'removedOldPaths'}}, indent=2))


if __name__ == '__main__':
    prepare()
