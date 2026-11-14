"""Check selected master identity, archive paths, metadata, and audio integrity."""
import importlib.util
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
import wave
from zipfile import ZipFile

spec = importlib.util.spec_from_file_location('discography', Path(__file__).resolve().parents[1] / 'tools/build-discography.py')
discography = importlib.util.module_from_spec(spec)
spec.loader.exec_module(discography)


class DiscographyTests(unittest.TestCase):
    def test_runtime_use_follows_the_edition_and_retains_later_tracks(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'src').mkdir()
            (root / 'package.json').write_text('{"type":"module"}', encoding='utf-8')
            (root / 'src/campaign-recorded-audio.js').write_text("export const CAMPAIGN_RECORDINGS={traditional:{id:'act1-03'},bolza:{id:'act4-03'},title:{id:'identified-return-r9'}};", encoding='utf-8')
            for limit in [3, 4]:
                (root / 'src/build.js').write_text(f'export const isActAvailable=act=>act>=1&&act<={limit};', encoding='utf-8')
                runtime = discography.runtime_tracks(root)
                self.assertEqual(discography.runtime_use_for({'id': 'act1-03', 'act': 1}, runtime), 'Act 1 campaign')
                self.assertEqual(discography.runtime_use_for({'id': 'identified-return-r9'}, runtime), 'title')
                selected = discography.runtime_use_for({'id': 'act4-03', 'act': 4}, runtime)
                study = discography.runtime_use_for({'id': 'tempo-act4-02', 'act': 4}, runtime)
                self.assertEqual(selected, 'post-jam source only' if limit == 3 else 'Act 4 campaign; atmosphere also serves repair and ending')
                self.assertEqual(study, 'post-jam source only' if limit == 3 else 'review library only')
                self.assertIn('act4-03', runtime['tracks'])

    def wav(self, path, channels=2, frames=480):
        with wave.open(str(path), 'wb') as target:
            target.setnchannels(channels)
            target.setsampwidth(2)
            target.setframerate(48000)
            target.writeframes(b'\x01\x00' * frames * channels)

    def selected(self):
        return [{'composition_id': f'track-{index}', 'sha256': f'{index:064x}',
                 'file': f'collection/{index}.wav', 'frames': 205278781 if index == 0 else 1} for index in range(26)]

    def test_selected_compositions_exclude_duplicate_audio_or_identity(self):
        tracks = self.selected()
        discography.validate_tracks(tracks)
        tracks[1]['sha256'] = tracks[0]['sha256']
        with self.assertRaisesRegex(ValueError, 'same master'):
            discography.validate_tracks(tracks)
        tracks = self.selected()
        tracks[1]['composition_id'] = tracks[0]['composition_id']
        with self.assertRaisesRegex(ValueError, 'distinct composition'):
            discography.validate_tracks(tracks)

    def test_paths_and_total_frames_are_checked(self):
        tracks = self.selected()
        tracks[0]['file'] = '../outside.wav'
        with self.assertRaisesRegex(ValueError, 'leaves the collection'):
            discography.validate_tracks(tracks)
        tracks = self.selected()
        tracks[0]['frames'] += 1
        with self.assertRaisesRegex(ValueError, 'total sample-frame'):
            discography.validate_tracks(tracks)

    def test_wav_format_duration_and_complete_payload_are_checked(self):
        with TemporaryDirectory() as directory:
            path = Path(directory) / 'test.wav'
            self.wav(path)
            self.assertEqual(discography.inspect_wav(path, .01)['frames'], 480)
            with self.assertRaisesRegex(ValueError, 'Duration differs'):
                discography.inspect_wav(path, .02)
            self.wav(path, channels=1)
            with self.assertRaisesRegex(ValueError, 'stereo 48 kHz PCM16'):
                discography.inspect_wav(path, .01)
            self.wav(path)
            path.write_bytes(path.read_bytes()[:-4])
            with self.assertRaisesRegex(ValueError, 'payload is incomplete'):
                discography.inspect_wav(path, .01)

    def fixture(self, directory):
        source = directory / 'source.wav'
        self.wav(source)
        track = {'composition_id': 'fixture', 'title': 'Test <track>', 'release_id': 'test', 'track_number': 1,
                 'act': 1, 'bpm': 144, 'mix_revision': 'r1', 'file': 'test/01 - Test.wav',
                 'runtime_use': 'review library only', **discography.inspect_wav(source, .01)}
        manifest = {'revision': 'fixture', 'total_compositions': 1, 'total_seconds': .01,
                    'authoring': 'fixture', 'credits': 'fixture', 'limits': 'fixture', 'tracks': [track],
                    'releases': [{'id': 'test', 'title': 'Test collection', 'tracks': 1, 'seconds': .01}]}
        return manifest, {track['file']: source}

    def test_archive_preserves_source_bytes_and_metadata(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            manifest, sources = self.fixture(root)
            report = discography.write_collection(manifest, sources, root / 'output')
            self.assertEqual(report['master_hashes_checked'], 1)
            with ZipFile(report['archive']) as archive:
                self.assertEqual(archive.read(manifest['tracks'][0]['file']), next(iter(sources.values())).read_bytes())
                self.assertIn('index.html', archive.namelist())
                self.assertEqual(json.loads(archive.read('discography.json')), manifest)
            with self.assertRaises(FileExistsError):
                discography.write_collection(manifest, sources, root / 'output')

    def test_archive_rejects_unlisted_members(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            manifest, sources = self.fixture(root)
            report = discography.write_collection(manifest, sources, root / 'output')
            with ZipFile(report['archive'], 'a') as archive:
                archive.writestr('extra.wav', b'unlisted')
            with self.assertRaisesRegex(ValueError, 'Archive members differ'):
                discography.verify_archive(Path(report['archive']), manifest)

    def test_archive_rejects_changed_audio_with_the_same_member_names(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            manifest, sources = self.fixture(root)
            report = discography.write_collection(manifest, sources, root / 'output')
            path = Path(report['archive'])
            with ZipFile(path) as archive:
                files = {name: archive.read(name) for name in archive.namelist()}
            name = manifest['tracks'][0]['file']
            files[name] = files[name][:-2] + b'\x00\x00'
            with ZipFile(path, 'w') as archive:
                for name, value in files.items():
                    archive.writestr(name, value)
            with self.assertRaisesRegex(ValueError, 'Archive audio differs'):
                discography.verify_archive(path, manifest)

    def test_offline_player_has_one_explicit_audio_element_and_escaped_titles(self):
        with TemporaryDirectory() as directory:
            manifest, _ = self.fixture(Path(directory))
            page = discography.listening_page(manifest)
            self.assertEqual(page.count('<audio '), 1)
            self.assertNotIn('autoplay', page)
            self.assertIn('Test &lt;track&gt;', page)
            self.assertNotIn('>Test <track><', page)
            self.assertIn('data-file="test/01 - Test.wav"', page)
            self.assertIn('audio.pause();audio.src=', page)
            self.assertNotIn('localStorage', page)


if __name__ == '__main__':
    unittest.main()
