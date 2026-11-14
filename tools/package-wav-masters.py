"""Package the sixteen unchanged Act WAV masters with a local player page."""
import csv
import hashlib
import html
import io
import json
from pathlib import Path
import re
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'releases/stc-act-library-r1'
TARGET = OUTPUT / 'Arrow-Space-Shift-16-Act-WAV-Masters-r1.zip'


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as file:
        for block in iter(lambda: file.read(1024 * 1024), b''): h.update(block)
    return h.hexdigest()


def main():
    catalog = json.loads((ROOT / 'assets/audio/stc-act-library-r1/catalog.json').read_text(encoding='utf-8'))
    verified = json.loads((ROOT / 'reports/stc-act-library-r1/file-verification.json').read_text(encoding='utf-8'))
    expected = {item['id']: item['master_sha256'] for item in verified['tracks']}
    rows, records = [], []
    for track in catalog['tracks']:
        source = ROOT / 'audio/stc-act-library-r1/masters' / (track['id'] + '.wav')
        value = digest(source)
        assert value == expected[track['id']]
        title = re.sub('[^A-Za-z0-9]+', '-', track['title']).strip('-')
        name = f"Act-{['I', 'II', 'III', 'IV'][track['act']-1]}/{track['slot']:02d}-{title}.wav"
        records.append({'id': track['id'], 'act': track['act'], 'title': track['title'], 'seconds': track['seconds'],
                        'file': name, 'source': source.relative_to(ROOT).as_posix(), 'sha256': value})
        rows.append(f'<tr><td>{track["act"]}</td><td>{html.escape(track["title"])}</td><td>{track["seconds"]//60}:00</td>'
                    f'<td><a href="{name}" download>Download WAV</a></td><td><audio controls preload="none" src="{name}"></audio></td></tr>')
    assert len(records) == 16
    page = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    page += '<title>Arrow Space Shift: WAV masters</title><style>body{font:16px system-ui;line-height:1.5;margin:24px;background:#05090b;color:#eee2ca}a{color:#f1cc7c}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:12px;border-bottom:1px solid #52636a}audio{max-width:100%}@media(max-width:700px){tr,td,th{display:block}thead{display:none}}</style>'
    page += '<h1>Arrow Space Shift: WAV masters</h1><p>Sixteen original Act tracks. Total: 52 minutes. Stereo, 48 kHz, PCM16.</p>'
    page += '<p>Extract the complete ZIP. Open this page to use the local audio controls.</p><p>The files retain their original samples. Each full duration includes its ending.</p>'
    page += '<table><thead><tr><th>Act</th><th>Track</th><th>Length</th><th>WAV file</th><th>Audio controls</th></tr></thead><tbody>' + ''.join(rows) + '</tbody></table></html>'
    csv_text = io.StringIO(newline='')
    writer = csv.DictWriter(csv_text, fieldnames=['id', 'act', 'title', 'seconds', 'file', 'source', 'sha256'])
    writer.writeheader();writer.writerows(records)
    OUTPUT.mkdir(exist_ok=True)
    with ZipFile(TARGET, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
        archive.writestr('index.html', page)
        archive.writestr('TRACKS.csv', csv_text.getvalue())
        archive.writestr('SHA256SUMS.txt', ''.join(f"{item['sha256']}  {item['file']}\n" for item in records))
        for item in records: archive.write(ROOT / item['source'], item['file'])
    with ZipFile(TARGET) as archive:
        assert archive.testzip() is None
        assert len(archive.namelist()) == len(set(archive.namelist()))
        for item in records:
            assert hashlib.sha256(archive.read(item['file'])).hexdigest() == item['sha256']
    manifest = {'revision': 'stc-act-library-r1-wav', 'tracks': records, 'seconds': 3120,
                'archive': {'file': TARGET.name, 'bytes': TARGET.stat().st_size, 'sha256': digest(TARGET)},
                'format': 'Stereo 48 kHz PCM16 WAV. Original masters. No new render or normalization.'}
    (OUTPUT / 'WAV-MASTER-MANIFEST.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    lines = ['# WAV downloads', '', 'These are the original sixteen Act masters.', '',
             f'[All sixteen WAV files]({TARGET.as_posix()})', '', '| Act | Track | Length | WAV |', '|---|---|---|---|']
    for item in records:
        lines.append(f"| {item['act']} | {item['title']} | {item['seconds']//60}:00 | [WAV]({(ROOT/item['source']).as_posix()}) |")
    title = ROOT / 'audio/stc-study/foxdot-bass-r7/room_mix.wav'
    assert title.is_file()
    lines += ['', f'[Title-theme WAV, r7]({title.as_posix()})', '', 'The r7 title study is separate from the sixteen Act tracks.']
    (ROOT / 'docs/WAV-DOWNLOADS.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(json.dumps({'file': str(TARGET), 'tracks': len(records), 'seconds': 3120, 'bytes': TARGET.stat().st_size}, indent=2))


if __name__ == '__main__': main()
