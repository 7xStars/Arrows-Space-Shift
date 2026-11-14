"""Compare the fresh Git runtime with the tested working source."""
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FRESH = Path('G:/Music Projects/Arrow Space Shift/scratch/git-fresh-0.25.1-dev.1')
spec = importlib.util.spec_from_file_location('release_package', ROOT / 'tools/package-release.py')
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)
names = sorted(set(release.play_files(ROOT)) | {'art/source/crossing.mjs'})
records, differences, errors = [], [], []
text_types = {'.js', '.mjs', '.json', '.html', '.css', '.txt', '.md', '.py', '.bat'}
for name in names:
    original, copied = (ROOT / name).read_bytes(), (FRESH / name).read_bytes()
    exact = original == copied
    normalized = original.replace(b'\r\n', b'\n') == copied.replace(b'\r\n', b'\n')
    if not exact:
        differences.append(name)
    if not exact and not (Path(name).suffix in text_types and normalized):
        errors.append(name)
    records.append({'file': name, 'exactBytes': exact, 'equalAfterLFNormalization': normalized,
                    'workingSha256': hashlib.sha256(original).hexdigest(),
                    'freshSha256': hashlib.sha256(copied).hexdigest()})
report = {'checks': len(names), 'result': 'passed' if not errors else 'failed',
          'lineEndingDifferences': differences, 'errors': errors, 'records': records}
(Path(__file__).parent / 'fresh-comparison.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps({key: value for key, value in report.items() if key != 'records'}, indent=2))
if errors:
    raise SystemExit(1)
