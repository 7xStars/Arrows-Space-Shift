"""Verify the laboratory archives and extract them to a new scratch folder."""
import hashlib
import json
from pathlib import Path, PurePosixPath
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent.parent
RELEASE = ROOT / 'releases/stc-operator-lab-r1'
SCRATCH = Path('G:/Music Projects/Arrow Space Shift/scratch/verified-stc-operator-lab-r1')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    manifest = json.loads((RELEASE / 'MANIFEST.json').read_text(encoding='utf-8'))
    result = {'revision': manifest['revision'], 'archives': {}}
    for kind in ['play', 'source']:
        record = manifest[kind]
        archive_path = RELEASE / record['file']
        assert sha(archive_path.read_bytes()) == record['sha256']
        assert archive_path.stat().st_size == record['bytes']
        destination = (SCRATCH / (kind + '-' + record['sha256'][:12])).resolve()
        destination.relative_to(SCRATCH.resolve())
        destination.mkdir(parents=True, exist_ok=False)
        with ZipFile(archive_path) as archive:
            assert archive.testzip() is None
            names = archive.namelist()
            assert len(names) == len(set(names)) == record['entries']
            assert 'index.html' in names
            assert not any(name.lower().endswith('.pdf') for name in names)
            entries = json.loads(archive.read('PACKAGED-FILES.json'))['files']
            for name in names:
                parsed = PurePosixPath(name)
                assert not parsed.is_absolute() and '..' not in parsed.parts and '\\' not in name and ':' not in name
                output = (destination / name).resolve()
                output.relative_to(destination)
                output.parent.mkdir(parents=True, exist_ok=True)
                output.write_bytes(archive.read(name))
            for entry in entries:
                data = (destination / entry['file']).read_bytes()
                assert len(data) == entry['bytes'] and sha(data) == entry['sha256']
        catalog = json.loads((destination / 'assets/audio/stc-operator-lab-r1/catalog.json').read_text())
        for clip in catalog['clips']:
            asset = 'assets/audio/stc-operator-lab-r1/' + clip['file']
            assert sha((destination / asset).read_bytes()) == sha((ROOT / asset).read_bytes())
        result['archives'][kind] = {'file': str(archive_path), 'root': str(destination),
            'sha256': record['sha256'], 'bytes': record['bytes'], 'entries': record['entries'],
            'integrity': 'passed', 'retained_file_hashes': 'passed', 'runtime_audio_hashes': 9,
            'entry': 'index.html', 'reference_pdf_count': 0}
    (ROOT / 'reports/stc-operator-lab-r1/package-extraction.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
