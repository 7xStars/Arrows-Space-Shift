"""Verify the preserved source files against their import records."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def verify():
    records = []
    archive = ROOT / 'archive/workspace-v0.15.0-20261112'
    imports = ROOT / 'imports/downloads-2026-11-12'
    for item in json.loads((archive / 'file-manifest.json').read_text(encoding='utf-8-sig')):
        records.append((archive / item['path'], item['sha256'], item['bytes']))
    for item in json.loads((imports / 'file-manifest.json').read_text(encoding='utf-8-sig')):
        records.append((ROOT / item['destination'], item['sha256'], item['bytes']))
    for path, digest, size in records:
        if not path.resolve().is_relative_to(ROOT):
            raise ValueError(f'The file is outside the project: {path}')
        data = path.read_bytes()
        if len(data) != size or hashlib.sha256(data).hexdigest().lower() != digest.lower():
            raise ValueError(f'The file differs from the record: {path}')
    print(f'Preserved file verification passed: {len(records)} files.')

if __name__ == '__main__':
    verify()
