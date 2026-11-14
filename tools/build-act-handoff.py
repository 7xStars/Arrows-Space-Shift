"""Make REAPER editing handoffs from the delivered aligned music layers."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUTHOR = ROOT / 'audio/stc-act-library-r1'
OUT = AUTHOR / 'reaper'
OUT.mkdir(exist_ok=True)
catalog = json.loads((ROOT / 'assets/audio/stc-act-library-r1/catalog.json').read_text(encoding='utf-8'))
for track in catalog['tracks']:
    lines = ['<REAPER_PROJECT 0.1 7.0 1', '  SAMPLERATE 48000', f"  TEMPO {track['bpm']}"]
    for role in ['core', 'atmosphere']:
        source = '../../../assets/audio/stc-act-library-r1/' + track[role]
        assert (OUT / source).resolve().is_file()
        lines.extend(['  <TRACK', f'    NAME "{role}"', '    VOLPAN 1 0 1 -1', '    <ITEM', '      POSITION 0',
                      f"      LENGTH {track['seconds']}", '      SOFFS 0', '      VOLPAN 1 0 1 -1', '      <SOURCE VORBIS',
                      f'        FILE "{source}"', '      >', '    >', '  >'])
    lines.append('>')
    (OUT / (track['id'] + '.rpp')).write_text('\n'.join(lines) + '\n', encoding='utf-8')
(OUT / 'README.txt').write_text('These sixteen REAPER project files reference the delivered Vorbis stems.\n'
                              'Both items start at zero with unity gain.\n'
                              'The WAV masters and FoxDot/SC sources remain in the parent folders.\n'
                              'REAPER was not opened or used to render this collection.\n', encoding='utf-8')
print('Created sixteen REAPER editing handoffs. All source paths exist.')
