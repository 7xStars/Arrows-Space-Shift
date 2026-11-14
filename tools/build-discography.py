"""Package selected full masters. Keep revisions and stems out of the track count."""
import argparse
import csv
import hashlib
import html
import io
import json
import re
import subprocess
import wave
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = Path('G:/Music Projects/Arrow Space Shift/discography/stc-discography-r1')
ARCHIVE_NAME = 'Arrow-Space-Shift-Discography-r1-WAV.zip'
RELEASES = [
    {'id': '01-act-studies', 'title': 'Structural Techno-Cosmism - Act Studies', 'kind': 'collection', 'revision': 'stc-act-library-r1'},
    {'id': '02-tempo-studies', 'title': 'Structural Techno-Cosmism - Tempo Studies', 'kind': 'collection', 'revision': 'stc-tempo-r2b'},
    {'id': '03-identified-return', 'title': 'Identified Return', 'kind': 'single', 'revision': 'identified-return-r9'},
]


def digest_stream(stream):
    value = hashlib.sha256()
    while block := stream.read(1024 * 1024):
        value.update(block)
    return value.hexdigest()


def digest(path):
    with Path(path).open('rb') as stream:
        return digest_stream(stream)


def duration_label(seconds):
    minutes, remainder = divmod(seconds, 60)
    return f'{int(minutes)}:{remainder:05.2f}'


def inspect_wav(path, expected_seconds):
    with wave.open(str(path), 'rb') as source:
        frames, rate = source.getnframes(), source.getframerate()
        if (source.getnchannels(), rate, source.getsampwidth(), source.getcomptype()) != (2, 48000, 2, 'NONE'):
            raise ValueError(f'Expected stereo 48 kHz PCM16 WAV: {path}')
        if abs(frames / rate - expected_seconds) > 1 / rate:
            raise ValueError(f'Duration differs from the source record: {path}')
        payload_bytes = 0
        while block := source.readframes(262144):
            payload_bytes += len(block)
        if payload_bytes != frames * 4:
            raise ValueError(f'The WAV payload is incomplete: {path}')
    return {'frames': frames, 'sample_rate': rate, 'channels': 2, 'sample_bits': 16,
            'seconds': frames / rate, 'bytes': Path(path).stat().st_size, 'sha256': digest(path)}


def safe_name(title):
    return re.sub(r'[^A-Za-z0-9 -]', '', title).strip()


def validate_tracks(tracks):
    if len(tracks) != 26 or len({track['composition_id'] for track in tracks}) != 26:
        raise ValueError('Expected 26 distinct composition IDs.')
    if len({track['sha256'] for track in tracks}) != 26:
        raise ValueError('Two selected tracks contain the same master file.')
    names = [track['file'] for track in tracks]
    if len(set(names)) != len(names):
        raise ValueError('Two archive paths are the same.')
    for name in names:
        path = PurePosixPath(name)
        if path.is_absolute() or '..' in path.parts or '\\' in name:
            raise ValueError('An archive path leaves the collection.')
    if sum(track['frames'] for track in tracks) != 205278806:
        raise ValueError('The total sample-frame count differs from the source collection.')


def read_json(root, name):
    return json.loads((root / name).read_text(encoding='utf-8'))


def runtime_tracks(root):
    script = "import {CAMPAIGN_RECORDINGS as r} from './src/campaign-recorded-audio.js';import {isActAvailable} from './src/build.js';console.log(JSON.stringify({tracks:Object.fromEntries(Object.entries(r).map(([k,v])=>[v.id,k])),available_acts:[1,2,3,4].filter(isActAvailable)}))"
    result = subprocess.run(['node', '--input-type=module', '-e', script], cwd=root, capture_output=True, text=True, check=True)
    return json.loads(result.stdout)


def runtime_use_for(track, runtime):
    if track.get('act') is not None and track['act'] not in runtime['available_acts']:
        return 'post-jam source only'
    use = runtime['tracks'].get(track['id'])
    result = 'title' if use == 'title' else f'Act {track["act"]} campaign' if use else 'review library only'
    if use == 'bolza':
        result += '; atmosphere also serves repair and ending'
    return result


def build_manifest(root, tempo_masters=None):
    runtime = runtime_tracks(root)
    original = read_json(root, 'assets/audio/stc-act-library-r1/catalog.json')
    tempo = read_json(root, 'assets/audio/stc-tempo-r2/catalog.json')
    production = read_json(root, 'reports/stc-tempo-r2/production-manifest.json')
    original_records = {track['id']: track['master'] for track in read_json(root, 'reports/stc-act-library-r1/render-results.json')['tracks']}
    tempo_records = {track['id']: track for track in production['masters']}
    title_manifest = read_json(root, 'audio/stc-study/foxdot-percussion-r9/render-manifest.json')
    title_record = next(item for item in title_manifest['outputs'] if item['file'] == 'ass-identified-return-r9-music.wav')
    if tempo.get('mix_revision') != 'r2b' or production.get('mix_revision') != 'r2b':
        raise ValueError('The current tempo collection must select mix r2b.')
    expected_original = {f'act{act}-{slot:02d}' for act in range(1, 5) for slot in range(1, 5)}
    expected_tempo = {f'tempo-act{act}-{slot:02d}' for act, count in enumerate([3, 2, 2, 2], 1) for slot in range(1, count + 1)}
    if {track['id'] for track in original['tracks']} != expected_original or {track['id'] for track in tempo['tracks']} != expected_tempo:
        raise ValueError('The source catalogs do not contain the selected compositions.')
    tracks, sources = [], {}

    def add(track, release, number, source, record, revision, provenance):
        metrics = inspect_wav(source, track['seconds'])
        if metrics['sha256'] != record['sha256']:
            raise ValueError(f'The master hash differs from the production record: {source}')
        name = f"{release}/{number:02d} - {safe_name(track['title'])}.wav"
        runtime_use = runtime_use_for(track, runtime)
        tracks.append({'composition_id': track['id'], 'title': track['title'], 'release_id': release,
                       'track_number': number, 'act': track.get('act'), 'bpm': track['bpm'],
                       'mix_revision': revision, 'file': name, **metrics, 'source_file': str(source),
                       'provenance': provenance, 'runtime_use': runtime_use,
                       'listening_status': 'No final listening approval is recorded for this selected master.',
                       'purpose': track.get('purpose', 'Title-screen composition with a driving pulse and ordered transformations.'),
                       'invariant': track.get('invariant', 'Retained motif, form, and harmony across the selected percussion revision.'),
                       'operations': track.get('operations', ['repeat', 'pan', 'gate then room', 'room then gate', 'increase percussion gain'])})
        sources[name] = source

    for number, track in enumerate(original['tracks'], 1):
        add(track, RELEASES[0]['id'], number, root / original_records[track['id']]['file'], original_records[track['id']],
            'r1', ['audio/stc-act-library-r1/act12.json', 'audio/stc-act-library-r1/act34.json',
                   'audio/stc-act-library-r1/compose.py', 'audio/stc-act-library-r1/instruments.scd',
                   'reports/stc-act-library-r1/render-results.json'])
    for number, track in enumerate(tempo['tracks'], 1):
        record = tempo_records[track['id']]
        portable_source = root / record['archive_file']
        source = Path(tempo_masters) / f"{track['id']}.wav" if tempo_masters else portable_source if portable_source.exists() else Path(record['source'])
        add(track, RELEASES[1]['id'], number, source, record, 'r2b',
            ['audio/stc-tempo-r2/act12.json', 'audio/stc-tempo-r2/act34.json', 'audio/stc-tempo-r2/compose.py',
             'audio/stc-tempo-r2/instruments.scd', 'reports/stc-tempo-r2/production-manifest.json'])
    title = {'id': 'identified-return-r9', 'title': 'Identified Return', 'bpm': title_manifest['bpm'], 'seconds': title_record['duration']}
    add(title, RELEASES[2]['id'], 1, root / 'audio/stc-study/foxdot-percussion-r9' / title_record['file'], title_record, 'r9',
        ['audio/stc-study/foxdot-percussion-r9/README.md', 'audio/stc-study/foxdot-percussion-r9/compose.py',
         'audio/stc-study/foxdot-percussion-r9/operator_track.scd', 'audio/stc-study/foxdot-percussion-r9/render-manifest.json'])
    validate_tracks(tracks)
    releases = []
    for release in RELEASES:
        selected = [track for track in tracks if track['release_id'] == release['id']]
        releases.append({**release, 'tracks': len(selected), 'seconds': sum(track['seconds'] for track in selected)})
    return {'schema': 1, 'revision': 'stc-discography-r1', 'created_utc': datetime.now(timezone.utc).isoformat(),
            'publication_status': 'Local collection. Not publicly released.', 'releases': releases,
            'total_compositions': len(tracks), 'total_seconds': sum(track['seconds'] for track in tracks),
            'authoring': 'FoxDot Pattern event scores and native SuperCollider synthesis. REAPER sessions are editing handoffs. No REAPER render is claimed.',
            'credits': 'Original project compositions and synthesis. Coding agents assisted with composition, synthesis, integration, and documentation. No reference recording, commercial sample, or external impulse response was added.',
            'excluded_from_count': ['stems', 'previews', 'SFX', 'operator proof clips', 'earlier mixes of the same composition', 'procedural test fixtures'],
            'limits': 'File and archive checks do not establish musical acceptance, human comprehension, device performance, or public-release clearance.',
            'tracks': tracks}, sources


def companion_files(manifest):
    files = {'discography.json': json.dumps(manifest, ensure_ascii=False, indent=2) + '\n'}
    playlist = ['#EXTM3U']
    csv_text = io.StringIO(newline='')
    writer = csv.writer(csv_text)
    writer.writerow(['collection', 'track', 'title', 'act', 'bpm', 'seconds', 'mix', 'runtime_use', 'file', 'sha256'])
    for track in manifest['tracks']:
        playlist += [f"#EXTINF:{track['seconds']:.6f},{track['title']}", track['file']]
        writer.writerow([track['release_id'], track['track_number'], track['title'], track['act'], track['bpm'],
                         f"{track['seconds']:.9f}", track['mix_revision'], track['runtime_use'], track['file'], track['sha256']])
    files['All-Tracks.m3u8'] = '\n'.join(playlist) + '\n'
    files['TRACKS.csv'] = csv_text.getvalue()
    files['index.html'] = listening_page(manifest)
    for release in manifest['releases']:
        playlist = ['#EXTM3U']
        for track in manifest['tracks']:
            if track['release_id'] == release['id']:
                playlist += [f"#EXTINF:{track['seconds']:.6f},{track['title']}", PurePosixPath(track['file']).name]
        files[f"{release['id']}/Playlist.m3u8"] = '\n'.join(playlist) + '\n'
    active_count = sum(track['runtime_use'] not in {'review library only', 'post-jam source only'} for track in manifest['tracks'])
    files['README.txt'] = (
        'ARROW SPACE SHIFT - STRUCTURAL TECHNO-COSMISM\n'
        f"Local discography r1: {manifest['total_compositions']} compositions, {duration_label(manifest['total_seconds'])}.\n\n"
        'Extract this ZIP before playback.\nOpen index.html in a browser.\n'
        'Or open All-Tracks.m3u8 in a media player.\n'
        'Each collection also has its own playlist.\nThe WAV files retain their original bytes.\n'
        'All files use stereo 48 kHz PCM16.\nNo new normalization, effects, or mastering was applied.\n'
        'Track endings include their fade and tail. These are finite tracks.\n\n'
        'Act Studies contains sixteen compositions and lasts 52 minutes.\n'
        'Tempo Studies contains nine compositions and lasts 18 minutes.\n'
        'Identified Return is the title single at mix r9.\n'
        'Earlier mixes, stems, previews, and proof clips remain in their source folders.\n'
        'They are not extra compositions in this collection.\n\n'
        f'{active_count} recordings serve the current edition.\n'
        'The other pieces remain review candidates or post-jam sources.\n'
        'The 240 BPM r2b mix adds swells and more upper-range stereo movement.\n'
        'The user called its earlier rhythmic foundation hypnotic.\n'
        'Final listening approval for this selected mix is not recorded.\n\n'
        f"AUTHORING\n{manifest['authoring']}\n\nCREDITS\n{manifest['credits']}\n\n"
        'This is a local collection. It has not been published.\n'
        'No new distribution license is selected by this archive.\n'
        'Technical checks do not establish artistic approval or release readiness.\n'
        'The writing uses short sentences. A full ASD-STE100 dictionary review is not claimed.\n')
    return files


def listening_page(manifest):
    active_count = sum(track['runtime_use'] not in {'review library only', 'post-jam source only'} for track in manifest['tracks'])
    sections = []
    for release in manifest['releases']:
        rows = []
        for track in manifest['tracks']:
            if track['release_id'] != release['id']:
                continue
            title, path = html.escape(track['title']), html.escape(track['file'], quote=True)
            rows.append(f'<li><button type="button" data-file="{path}" data-title="{title}">Play {title}</button>'
                        f'<span>{track["bpm"]} BPM · {duration_label(track["seconds"])} · {html.escape(track["mix_revision"])}</span>'
                        f'<small>{html.escape(track["runtime_use"])}</small>'
                        f'<a href="{path}" download>WAV</a></li>')
        sections.append(f'<section><h2>{html.escape(release["title"])}</h2>'
                        f'<p>{release["tracks"]} compositions · {duration_label(release["seconds"])}</p><ol>{"".join(rows)}</ol></section>')
    return '''<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Arrow Space Shift · Discography</title>
<style>
body{margin:0;background:#080c12;color:#e4ecf3;font:17px/1.5 system-ui,sans-serif}main{max-width:960px;margin:auto;padding:24px}
h1{font-size:2rem;line-height:1.2}h2{font-size:1.25rem}section{margin:40px 0}p{max-width:75ch;color:#bdccd9}
.player{position:sticky;top:0;background:#101b27;padding:16px;border:1px solid #7898ac;border-radius:6px;z-index:1}
audio{display:block;width:100%;margin-top:12px}ol{padding-left:24px}li{padding:14px 8px;border-bottom:1px solid #344c60}
button{font:inherit;background:#20384c;color:#f4f8fc;border:1px solid #94bbd1;border-radius:4px;padding:8px 12px;cursor:pointer;text-align:left}
button:focus-visible,a:focus-visible{outline:3px solid #ffdb73;outline-offset:3px}li span,li small{display:block;margin-top:5px}
li small{color:#bdccd9}a{color:#a5d9ff}li a{display:inline-block;padding:6px 0}button[aria-pressed="true"]{border-color:#ffdb73;background:#35404a}
@media(max-width:500px){main{padding:14px}.player{position:relative}h1{font-size:1.6rem}}
</style><main><p>ARROW SPACE SHIFT / STRUCTURAL TECHNO-COSMISM</p><h1>Discography</h1>
''' + f'<p>{manifest["total_compositions"]} compositions · {duration_label(manifest["total_seconds"])} · stereo 48 kHz WAV. This is a local listening collection.</p>\n<p>{active_count} recordings serve the current edition. The other pieces remain review candidates or post-jam sources. Earlier mixes, stems, and previews are not counted as more compositions.</p>\n' + '''
<div class="player"><strong id="current">Select a track.</strong><audio id="audio" controls preload="none"></audio>
<p id="status" role="status" aria-live="polite">Playback starts when you select Play.</p></div>
''' + ''.join(sections) + '''
<p>Original project compositions and synthesis. Coding agents assisted with composition, synthesis, integration, and documentation. No reference recording was added.</p>
<p>No new distribution license is selected by this collection. Technical checks do not establish listening approval.</p>
<p><a href="TRACKS.csv">Track data</a> · <a href="discography.json">Full manifest</a> · <a href="All-Tracks.m3u8">Playlist</a> · <a href="README.txt">Read me</a></p>
</main><script>
const audio=document.querySelector('#audio'),current=document.querySelector('#current'),status=document.querySelector('#status');
document.addEventListener('click',async event=>{
  const button=event.target.closest('button[data-file]');if(!button)return;
  audio.pause();audio.src=button.dataset.file;current.textContent=button.dataset.title;
  for(const item of document.querySelectorAll('button[data-file]'))item.setAttribute('aria-pressed',String(item===button));
  status.textContent='Loading '+button.dataset.title+'.';
  try{await audio.play();status.textContent='Playing '+button.dataset.title+'.';}
  catch(error){status.textContent='Playback did not start. Use the audio controls or open the WAV file.';}
});
audio.addEventListener('pause',()=>{if(audio.src&&!audio.ended)status.textContent='Playback paused.';});
audio.addEventListener('playing',()=>{status.textContent='Playing '+current.textContent+'.';});
audio.addEventListener('ended',()=>{status.textContent='Track ended. Select another track.';});
audio.addEventListener('error',()=>{status.textContent='The WAV file could not load. Extract the complete ZIP before playback.';});
</script></html>\n'''


def verify_archive(path, manifest):
    expected_files = companion_files(manifest)
    with ZipFile(path) as archive:
        names = archive.namelist()
        expected = set(expected_files) | {track['file'] for track in manifest['tracks']}
        if len(names) != len(set(names)) or set(names) != expected:
            raise ValueError('Archive members differ from the manifest.')
        for name, text in expected_files.items():
            if archive.read(name) != text.encode('utf-8'):
                raise ValueError(f'Archive metadata differs: {name}')
        for track in manifest['tracks']:
            with archive.open(track['file']) as source:
                if digest_stream(source) != track['sha256']:
                    raise ValueError(f'Archive audio differs: {track["file"]}')
    return {'member_count': len(expected), 'master_hashes_checked': len(manifest['tracks']),
            'bytes': path.stat().st_size, 'sha256': digest(path)}


def write_collection(manifest, sources, output):
    output.mkdir(parents=True, exist_ok=True)
    path = output / ARCHIVE_NAME
    if path.exists():
        raise FileExistsError(f'The archive already exists. Use another output folder: {path}')
    files = companion_files(manifest)
    with ZipFile(path, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
        for name, text in files.items():
            archive.writestr(name, text.encode('utf-8'))
        for name, source in sources.items():
            archive.write(source, name)
    verification = verify_archive(path, manifest)
    for name in ['discography.json', 'TRACKS.csv', 'README.txt']:
        (output / name).write_text(files[name], encoding='utf-8', newline='')
    report = {'revision': manifest['revision'], 'archive': str(path), 'compositions': manifest['total_compositions'],
              'seconds': manifest['total_seconds'], 'duration': duration_label(manifest['total_seconds']),
              'checks': ['26 unique composition IDs', '26 unique source master hashes', 'source production hashes match',
                         'all source WAV payloads complete', 'stereo 48 kHz PCM16', 'exact expected frame total',
                         'all archived masters match sources', 'all archive metadata matches', 'no extra archive members'],
              **verification, 'limits': manifest['limits']}
    (output / 'VERIFICATION.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument('--tempo-masters', type=Path)
    options = parser.parse_args()
    manifest, sources = build_manifest(ROOT, options.tempo_masters)
    print(json.dumps(write_collection(manifest, sources, options.output), indent=2))


if __name__ == '__main__':
    main()
