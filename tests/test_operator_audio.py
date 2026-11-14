"""Measure the native ordered sound comparisons and their source identity."""
import array
import importlib.util
import json
from pathlib import Path
import sys
import unittest
import wave

ROOT = Path(__file__).resolve().parent.parent
AUTHOR = ROOT / 'audio/stc-operator-lab-r1'
SPEC = importlib.util.spec_from_file_location('operator_render', ROOT / 'tools/render-operator-audio.py')
RENDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(RENDER)


def samples(path):
    with wave.open(str(path), 'rb') as file:
        header = (file.getnchannels(), file.getframerate(), file.getnframes(), file.getsampwidth())
        values = array.array('h', file.readframes(file.getnframes()))
    return header, values


class OperatorAudioTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest = json.loads((AUTHOR / 'render-manifest.json').read_text(encoding='utf-8'))
        cls.catalog = json.loads((AUTHOR / 'catalog.json').read_text(encoding='utf-8'))
        cls.values = {item['id']: samples(AUTHOR / item['file']) for item in cls.catalog['clips']}

    def test_installed_foxdot_authors_the_same_finite_input_twice(self):
        first = RENDER.composer.author_input()
        self.assertEqual(first, RENDER.composer.author_input())
        self.assertEqual(len(first['events']), 16)
        self.assertEqual({event['midi'] for event in first['events']}, {41, 44, 48, 51})
        self.assertEqual(first['foxdot']['version'], '0.9.0')
        self.assertTrue(first['foxdot']['original_composition_authored_with_foxdot'])
        self.assertFalse(first['foxdot']['realtime_scheduler_used'])
        self.assertFalse(any('TempoClock' in name or 'ServerManager' in name for name in sys.modules if name.startswith('FoxDot.')))

    def test_native_compile_render_and_explicit_end_succeed(self):
        self.assertEqual(self.manifest['compile']['exit_code'], 0)
        self.assertEqual(self.manifest['native']['exit_code'], 0)
        score = (AUTHOR / 'operator-score.osc').read_bytes()
        self.assertIn(b'/g_freeAll\0', score)
        self.assertIn(b'/c_set\0', score)
        self.assertNotIn(b'/quit', score)
        self.assertEqual(self.manifest['rt_memory_kib'], 65536)
        self.assertNotIn('alloc failed', (AUTHOR / 'scsynth.log').read_text(errors='replace').lower())

    def test_nine_files_share_one_frame_interval_and_retained_hashes(self):
        self.assertEqual(len(self.values), 9)
        self.assertEqual(self.catalog['seconds'], 12)
        self.assertEqual(self.catalog['sampleRate'], 48000)
        for item in self.manifest['clips']:
            with self.subTest(clip=item['id']):
                self.assertEqual(self.values[item['id']][0], (2, 48000, 576000, 2))
                self.assertEqual(RENDER.helpers.sha256(AUTHOR / item['file']), item['metrics']['sha256'])
                self.assertEqual(item['metrics']['non_finite'], 0)
                self.assertEqual(item['metrics']['full_scale'], 0)
                self.assertLess(item['metrics']['peak'], 1)
                self.assertEqual(self.values[item['id']][1][-2:], array.array('h', [0, 0]))

    def test_modulated_gate_order_leaves_a_tail_only_before_the_room(self):
        for key, first, second in [('gate-room', 'gate-room', 'room-gate'),
                                   ('transfer-gate-room', 'transfer-gate-room', 'transfer-room-gate')]:
            with self.subTest(pair=key):
                windows = self.manifest['comparisons'][key]['closed_gate_windows_seconds']
                energies = [RENDER.window_energy(self.values[name][1], windows) for name in [first, second]]
                self.assertGreater(energies[0], 1000)
                self.assertEqual(energies[1], 0)
                self.assertTrue(self.manifest['comparisons'][key]['zero_denominator'])
                self.assertIsNone(self.manifest['comparisons'][key]['tail_energy_ratio'])

    def test_positive_control_constant_gain_commutes_with_the_linear_room(self):
        first = self.values['constant-gate-room'][1]
        second = self.values['room-constant-gate'][1]
        self.assertEqual(first, second)
        proof = self.manifest['comparisons']['constant-gate-room']
        self.assertTrue(proof['expected_commutation'])
        self.assertLessEqual(proof['difference_rms_before_common_gain'], 1e-7)

    def test_transfer_changes_the_gate_without_changing_the_source_motif(self):
        self.assertNotEqual(self.values['gate-room'][1], self.values['transfer-gate-room'][1])
        self.assertNotEqual(self.manifest['operators']['gate']['phase'], self.manifest['operators']['transfer_gate']['phase'])
        source = json.loads((AUTHOR / 'foxdot-input.json').read_text(encoding='utf-8'))
        self.assertEqual(source, RENDER.composer.author_input())
        pairs = {item['id']: item['order'] for item in self.catalog['clips']}
        self.assertEqual(pairs['gate-room'], ['gate', 'room'])
        self.assertEqual(pairs['room-gate'], ['room', 'gate'])

    def test_nonlinear_pair_has_a_real_difference_without_a_linear_claim(self):
        first, second = self.values['filter-drive'][1], self.values['drive-filter'][1]
        self.assertNotEqual(first, second)
        self.assertGreater(RENDER.difference(first, second), 3)
        self.assertFalse(self.manifest['comparisons']['filter-drive']['linear_operator_claim'])

    def test_one_common_gain_preserves_the_matched_pair_level_relation(self):
        gain = self.manifest['common_gain']
        self.assertTrue(0 < gain <= 8)
        before = self.manifest['comparisons']['gate-room']['difference_rms_before_common_gain']
        after = RENDER.difference(self.values['gate-room'][1], self.values['room-gate'][1]) / 32768
        self.assertAlmostEqual(after, before * gain, delta=2 / 32768)
        trims = self.manifest['family_trims']
        self.assertEqual(trims['filter-drive'], .08)
        self.assertEqual(trims['drive-filter'], .08)
        self.assertTrue(all(value == 1 for key, value in trims.items() if key not in ['filter-drive', 'drive-filter']))
        nonlinear_before = self.manifest['comparisons']['filter-drive']['difference_rms_before_common_gain']
        nonlinear_after = RENDER.difference(self.values['filter-drive'][1], self.values['drive-filter'][1]) / 32768
        self.assertAlmostEqual(nonlinear_after, nonlinear_before * gain * .08, delta=2 / 32768)

    def test_source_hashes_and_reproduced_allocation_control_are_retained(self):
        for name, expected in self.manifest['sources'].items():
            self.assertEqual(RENDER.helpers.sha256(AUTHOR / name), expected)
        diagnostic = self.manifest['diagnostic_low_memory']
        self.assertIsNotNone(diagnostic)
        self.assertEqual(diagnostic['native_exit_code'], 0)
        self.assertGreater(diagnostic['allocation_failures'], 0)
        self.assertGreater(diagnostic['constant_control_difference_rms'], 1e-7)
        self.assertEqual(diagnostic['accepted_control_difference_rms'], 0)
        self.assertEqual(diagnostic['operator_source_sha256'], RENDER.helpers.sha256(AUTHOR / 'operators.scd'))


if __name__ == '__main__': unittest.main()
