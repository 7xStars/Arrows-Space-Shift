"""Copy the accepted native clips and their measured records to runtime assets."""
import hashlib
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent.parent
AUTHOR = ROOT / 'audio/stc-operator-lab-r1'
OUT = ROOT / 'assets/audio/stc-operator-lab-r1'
manifest = json.loads((AUTHOR / 'render-manifest.json').read_text(encoding='utf-8'))
assert manifest['native']['exit_code'] == 0
assert manifest['comparisons']['constant-gate-room']['difference_rms_before_common_gain'] == 0
OUT.mkdir(parents=True, exist_ok=True)
for clip in manifest['clips']:
    name = clip['file']
    assert Path(name).name == name and name.endswith('.wav')
    source = AUTHOR / name
    assert hashlib.sha256(source.read_bytes()).hexdigest() == clip['metrics']['sha256']
    shutil.copy2(source, OUT / name)
shutil.copy2(AUTHOR / 'catalog.json', OUT / 'catalog.json')
analysis = {'revision': manifest['revision'], 'operators': manifest['operators'], 'comparisons': manifest['comparisons'],
            'units': 'RMS and sums of squared native samples before family trim and common output gain.',
            'limits': 'Finite signal measurements. No human perception or global theorem result.'}
(OUT / 'analysis.json').write_text(json.dumps(analysis, indent=2) + '\n', encoding='utf-8')
print('Copied nine accepted clips, the catalog, and the finite measurement record.')
