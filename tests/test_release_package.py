"""Check release omissions, exclusions, file integrity, and bounded hashing."""
import hashlib
import importlib.util
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch
from zipfile import ZipFile, ZIP_STORED

spec = importlib.util.spec_from_file_location('release_package', Path(__file__).resolve().parents[1] / 'tools/package-release.py')
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


class ReleasePackageTests(unittest.TestCase):
    def test_public_act_limit_uses_the_edition_gate(self):
        self.assertEqual(release.public_act_limit('export const BUILD={maxAct:3,postJamContent:false};'), 3)
        self.assertEqual(release.public_act_limit('export const BUILD={maxAct:4,postJamContent:false};'), 3)
        self.assertEqual(release.public_act_limit('export const BUILD={maxAct:4,postJamContent:true};'), 4)
        self.assertEqual(release.public_act_limit(''), 4)
        with self.assertRaises(ValueError):
            release.public_act_limit('export const BUILD={maxAct:0};')

    def test_three_act_play_excludes_later_entries_and_recordings(self):
        with TemporaryDirectory() as folder:
            root = Path(folder)
            files = self.fixture(root)
            files['src/build.js'] = 'export const BUILD={maxAct:3,postJamContent:false};'
            files['src/app.js'] += "import './build.js';"
            for name in ['src/build.js', 'src/app.js']:
                (root / name).write_text(files[name], encoding='utf-8')
            music = [name for name in files if name.startswith('assets/audio/') and 'act4-' not in name]
            selected = release.play_files(root, music=music)
            self.assertNotIn('hyperbolic-act.html', selected)
            self.assertNotIn('repair-dock.html', selected)
            self.assertNotIn('src/hyperbolic-act.js', selected)
            self.assertNotIn('src/repair-app.js', selected)
            self.assertFalse(any('campaign-music-v1/act4-' in name for name in selected))
            archive = self.archive(root, {name: files[name] for name in selected})
            self.assertEqual(release.verify_archive(archive, selected, 'PLAY')['crc'], 'passed')
            with ZipFile(archive, 'a') as output:
                output.writestr('hyperbolic-act.html', files['hyperbolic-act.html'])
                output.writestr('src/hyperbolic-act.js', files['src/hyperbolic-act.js'])
            with self.assertRaisesRegex(ValueError, 'Post-jam'):
                release.verify_archive(archive, label='PLAY')

    def test_host_diagnostics_remain_outside_source_packages(self):
        self.assertFalse(release.source_allowed('reports/mute-investigation/host-audio.json'))
        self.assertFalse(release.source_allowed('reports/mute-investigation/github-status.md'))
        self.assertTrue(release.source_allowed('docs/AUDIO-SIGNAL-QA.md'))

    def tempo_masters(self, root, directory):
        identities = [f'tempo-act{act}-{slot:02d}' for act, count in enumerate([3, 2, 2, 2], 1) for slot in range(1, count + 1)]
        catalog = root / 'assets/audio/stc-tempo-r2/catalog.json'
        catalog.parent.mkdir(parents=True, exist_ok=True)
        catalog.write_text(json.dumps({'revision': 'stc-tempo-r2', 'tracks': [{'id': identity} for identity in identities]}))
        directory.mkdir(parents=True)
        for identity in identities:
            (directory / f'{identity}.wav').write_bytes(f'packaging fixture: {identity}'.encode())
        return identities

    def fixture(self, root):
        files = {name: '' for name in release.ENTRIES + release.LAUNCH}
        files.update({'package.json': '{"version":"fixture"}', 'index.html': '<script type="module" src="src/app.js"></script>',
                      'src/app.js': "import './dependency.js';import './campaign-recorded-audio.js';", 'src/dependency.js': 'export const x=1;',
                      'hyperbolic-act.html': '<script type="module" src="src/hyperbolic-act.js"></script>',
                      'repair-dock.html': '<script type="module" src="src/repair-app.js"></script>',
                      'src/hyperbolic-act.js': '', 'src/repair-app.js': '',
                      'src/campaign-recorded-audio.js': "const r={a:track('act1-03'),b:track('act2-03'),c:track('act3-03'),d:track('act4-03')};",
                      'assets/crossing/manifest.json': json.dumps({'atlas': 'atlas.png', 'frames': {'ship': {'file': 'ship.png'}}}),
                      'assets/crossing/atlas.png': 'atlas', 'assets/crossing/ship.png': 'ship',
                      'assets/audio/stc-title-r9.ogg': 'title'})
        for act in range(1, 5):
            for segment in range(10):
                for layer in ['core', 'atmosphere']:
                    files[f'assets/audio/campaign-music-v1/act{act}-03-{segment:02d}-{layer}.ogg'] = 'stem'
        for name, value in files.items():
            path = root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(value, encoding='utf-8')
        return files

    def archive(self, root, files, omitted=()):
        target = root / 'test.zip'
        with ZipFile(target, 'w', ZIP_STORED) as archive:
            for name, value in files.items():
                if name not in omitted:
                    archive.writestr(name, value)
        return target

    def test_dependency_closure_finds_imports_and_excludes_unreachable_labs(self):
        with TemporaryDirectory() as folder:
            root = Path(folder)
            self.fixture(root)
            (root / 'operator-lab.html').write_text('lab')
            selected = release.play_files(root, music=[])
            self.assertIn('src/dependency.js', selected)
            self.assertNotIn('operator-lab.html', selected)
            (root / 'src/dependency.js').unlink()
            with self.assertRaisesRegex(FileNotFoundError, 'dependency.js'):
                release.play_files(root, music=[])

    def test_source_keeps_editable_audio_and_excludes_private_or_recursive_files(self):
        with TemporaryDirectory() as folder:
            root = Path(folder)
            names = ['audio/master.wav', 'audio/compose.py', 'audio/instruments.scd', 'art/source/crossing.mjs',
                     'reports/test.txt', 'archive/old/game.js', 'imports/old/game.js', 'releases/old.zip',
                     '.env', 'nested/.env.example', '.local/file', 'node_modules/file', 'private/receipt.txt',
                     'book.pdf', 'cache/__pycache__/file.pyc', 'output/partial.zip']
            for name in names:
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text('fixture')
            selected = release.source_files(root, root / 'output')
            self.assertEqual(set(selected), set(names[:7]))

    def test_verification_rejects_a_missing_audio_segment_and_wrong_segment_identity(self):
        with TemporaryDirectory() as folder:
            root = Path(folder)
            files = self.fixture(root)
            target = self.archive(root, files)
            self.assertEqual(release.verify_archive(target, label='PLAY')['crc'], 'passed')
            omitted = 'assets/audio/campaign-music-v1/act4-03-09-core.ogg'
            target = self.archive(root, files, [omitted])
            with self.assertRaisesRegex(ValueError, 'recordings are incomplete'):
                release.verify_archive(target, label='PLAY')
            files['assets/audio/campaign-music-v1/wrong-09-core.ogg'] = files.pop(omitted)
            target = self.archive(root, files)
            with self.assertRaisesRegex(ValueError, 'file names differ'):
                release.verify_archive(target, label='PLAY')

    def test_verification_rejects_relative_omissions_and_missing_root_entry(self):
        with TemporaryDirectory() as folder:
            root = Path(folder)
            files = self.fixture(root)
            target = self.archive(root, files, ['src/dependency.js'])
            with self.assertRaisesRegex(ValueError, 'Missing relative files'):
                release.verify_archive(target, label='PLAY')
            target = self.archive(root, files, ['index.html'])
            with self.assertRaisesRegex(ValueError, 'Required files are missing'):
                release.verify_archive(target, label='PLAY')

    def test_verification_rejects_a_corrupt_member(self):
        with TemporaryDirectory() as folder:
            root = Path(folder)
            files = self.fixture(root)
            target = self.archive(root, files)
            with target.open('r+b') as stream:
                data = stream.read()
                at = data.index(b'export const x=1;')
                stream.seek(at)
                stream.write(b'X')
            with self.assertRaisesRegex(ValueError, 'CRC'):
                release.verify_archive(target, label='PLAY')

    def test_hashing_uses_a_stream_and_matches_the_content(self):
        with TemporaryDirectory() as folder:
            path = Path(folder) / 'file'
            value = b'content' * 200000
            path.write_bytes(value)
            with patch.object(Path, 'read_bytes', side_effect=AssertionError('Whole-file read is prohibited')):
                self.assertEqual(release.streamed_sha256(path), hashlib.sha256(value).hexdigest())

    def test_external_masters_require_exact_identities_and_cannot_replace_existing_source(self):
        with TemporaryDirectory() as folder:
            root, directory = Path(folder) / 'project', Path(folder) / 'masters'
            identities = self.tempo_masters(root, directory)
            files = release.tempo_master_files(root, directory)
            self.assertEqual(len(files), 9)
            missing = directory / 'tempo-act1-03.wav'
            retained = missing.read_bytes()
            missing.unlink()
            with self.assertRaisesRegex(ValueError, 'exactly the nine'):
                release.tempo_master_files(root, directory)
            missing.write_bytes(retained)
            collision = root / f'audio/stc-tempo-r2/masters/{identities[0]}.wav'
            collision.parent.mkdir(parents=True)
            collision.write_bytes(b'earlier master')
            with self.assertRaisesRegex(ValueError, 'already contains'):
                release.tempo_master_files(root, directory)

    def test_external_masters_are_packaged_in_source_without_entering_play(self):
        with TemporaryDirectory() as folder:
            root, directory, output = Path(folder) / 'project', Path(folder) / 'masters', Path(folder) / 'output'
            files = self.fixture(root)
            identities = self.tempo_masters(root, directory)
            music = {name for name in files if name.startswith('assets/audio/')}
            with patch.object(release, 'recorded_files', return_value=music):
                release.package(root=root, output=output, tempo_masters=directory)
            with ZipFile(output / 'fixture/Arrow-Space-Shift-vfixture-SOURCE.zip') as archive:
                for identity in identities:
                    self.assertEqual(archive.read(f'audio/stc-tempo-r2/masters/{identity}.wav'), (directory / f'{identity}.wav').read_bytes())
            with ZipFile(output / 'fixture/Arrow-Space-Shift-vfixture-PLAY.zip') as archive:
                self.assertFalse(any(name.startswith('audio/') for name in archive.namelist()))
            self.assertEqual(len(json.loads((output / 'fixture/manifest.json').read_text())['sourceExtras']), 9)

    def test_full_tempo_production_requires_exact_paths_and_unchanged_hashes(self):
        with TemporaryDirectory() as folder:
            root, production = Path(folder) / 'project', Path(folder) / 'production'
            identities = self.tempo_masters(root, production / 'masters')
            records = []
            for identity in identities:
                for group, filename in [('masters', f'{identity}.wav'), ('stems', f'{identity}-core.wav'),
                                        ('stems', f'{identity}-atmosphere.wav'), ('previews', f'{identity}-preview.wav'),
                                        ('sessions', f'{identity}.RPP')]:
                    path = production / group / filename
                    path.parent.mkdir(parents=True, exist_ok=True)
                    if not path.exists():
                        path.write_bytes(filename.encode())
                    records.append({'source': str(path), 'archive_file': f'audio/stc-tempo-r2/{group}/{filename}',
                                    'sha256': release.streamed_sha256(path), 'bytes': path.stat().st_size})
            manifest = {'revision': 'stc-tempo-r2', 'masters': [item for item in records if '/masters/' in item['archive_file']], 'files': records}
            path = Path(folder) / 'production.json'
            path.write_text(json.dumps(manifest))
            self.assertEqual(len(release.tempo_production_files(root, path)), 45)
            records[-1]['archive_file'] = '../private.txt'
            path.write_text(json.dumps(manifest))
            with self.assertRaisesRegex(ValueError, 'exact 45-file'):
                release.tempo_production_files(root, path)
            records[-1]['archive_file'] = f'audio/stc-tempo-r2/sessions/{identities[-1]}.RPP'
            path.write_text(json.dumps(manifest))
            Path(records[-1]['source']).write_bytes(b'changed')
            with self.assertRaisesRegex(ValueError, 'hash or size'):
                release.tempo_production_files(root, path)


if __name__ == '__main__':
    unittest.main()
