"""Measure the r8 score, retained inputs, and native music outputs."""
import array
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import sys
import unittest
import wave

ROOT = Path(__file__).resolve().parent.parent
AUTHOR = ROOT / 'audio/stc-study/foxdot-operator-r8'
RATE = 48000
FRAMES = 3678806
ORIGIN = .04
BAR_SECONDS = 240 / 134
INPUTS = {
    'reports/stc-study-r5/ass-identified-return-r5-stereo-music.wav': '473d928d8d1228fe25744dc57f7fd1ee1d9ac2be6026e3c0e5ec0c15a6d8a841',
    'audio/stc-study/foxdot-bass-r7/room_mix.wav': '51d7229c03b3b2c2a1373c51360dc8451760146b4bcb6bb7a4dfeda5410bd7a5',
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_score():
    spec = importlib.util.spec_from_file_location('qa_r8_composer', AUTHOR / 'compose.py')
    composer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(composer)
    return composer.author_score()


def pcm(path):
    with wave.open(str(path), 'rb') as source:
        header = (source.getnchannels(), source.getframerate(), source.getnframes(), source.getsampwidth())
        values = array.array('h', source.readframes(source.getnframes()))
    return header, values


def window(values, start, end):
    return values[math.ceil(start * RATE) * 2:math.floor(end * RATE) * 2]


class ScoreTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.score = load_score()

    def test_actual_foxdot_authors_a_finite_repeatable_score_without_live_startup(self):
        self.assertEqual(self.score, load_score())
        self.assertEqual(self.score['foxdot']['version'], '0.9.0')
        self.assertTrue(self.score['foxdot']['original_composition_authored_with_foxdot'])
        self.assertFalse(self.score['foxdot']['realtime_scheduler_used'])
        self.assertFalse(any('TempoClock' in key or 'ServerManager' in key
                             for key in sys.modules if key.startswith('FoxDot.')))

    def test_events_retain_the_approved_tempo_form_and_finite_parameter_bounds(self):
        score = self.score
        self.assertEqual((score['bpm'], score['bars']), (134, 40))
        self.assertAlmostEqual(score['origin_seconds'], ORIGIN)
        self.assertAlmostEqual(score['bar_seconds'], BAR_SECONDS)
        self.assertAlmostEqual(score['form_end_seconds'], ORIGIN + 40 * BAR_SECONDS)
        events = score['events']
        self.assertEqual(len({event['id'] for event in events}), len(events))
        self.assertEqual([event['time'] for event in events], sorted(event['time'] for event in events))
        self.assertLessEqual(len(events), 40)
        for event in events:
            with self.subTest(event=event['id']):
                self.assertIn(event['instrument'], ['harmony', 'mechanism'])
                self.assertTrue(all(math.isfinite(event[key]) for key in ['time', 'duration', 'amp', 'pan']))
                self.assertGreaterEqual(event['time'], ORIGIN + 4 * BAR_SECONDS)
                self.assertGreater(event['duration'], 0)
                self.assertLess(event['time'] + event['duration'], ORIGIN + 40 * BAR_SECONDS)
                self.assertTrue(0 < event['amp'] <= .1)
                self.assertLessEqual(abs(event['pan']), .25)

    def test_fm7_changes_voicing_without_changing_pitch_classes(self):
        harmony = [event for event in self.score['events'] if event['instrument'] == 'harmony']
        self.assertEqual([event['bar'] for event in harmony], [12, 16, 20, 24, 28, 32, 36])
        for event in harmony:
            self.assertEqual({note % 12 for note in event['notes']}, {0, 3, 5, 8})
            self.assertEqual(event['notes'], [53, 56, 60, 63] if event['bar'] < 20 else [56, 60, 63, 65])
        self.assertEqual(self.score['harmony_pitch_classes'], [0, 3, 5, 8])

    def test_sparse_percussion_keeps_the_break_and_uses_displaced_entries(self):
        mechanism = [event for event in self.score['events'] if event['instrument'] == 'mechanism']
        self.assertGreater(len(mechanism), 0)
        self.assertLessEqual(len(mechanism), 24)
        for event in mechanism:
            self.assertFalse(28 <= event['bar'] < 32)
            self.assertEqual(event['step'] % 1, .5)
            self.assertLess(event['step'], 16)
            self.assertGreaterEqual(event['step'], 0)

    def test_transient_has_real_growth_and_recovery_under_a_fixed_bounded_gain(self):
        model = self.score['transient_model']
        self.assertEqual(model['matrix'], [[.6, 2], [0, .6]])
        self.assertEqual(model['initial_state'], [0, 1])
        trajectory = model['trajectory']
        for value in trajectory:
            n = value['step']
            expected = [2 * n * .6 ** (n - 1), .6 ** n] if n else [0, 1]
            for actual, target in zip(value['state'], expected):
                self.assertAlmostEqual(actual, target)
            self.assertAlmostEqual(value['norm'], math.hypot(*expected))
        peak = max(trajectory, key=lambda value: value['norm'])
        self.assertEqual(peak['step'], 2)
        self.assertGreater(trajectory[2]['norm'], trajectory[0]['norm'])
        self.assertLess(trajectory[6]['norm'], trajectory[2]['norm'])
        gains = model['normalized_gains']
        self.assertTrue(all(math.isfinite(value) and 0 <= value <= 1 for value in gains))
        self.assertGreater(gains[1], gains[0])
        self.assertGreater(gains[1], gains[2])

    def test_declared_effect_order_changes_at_the_return_and_masks_the_final_gap(self):
        self.assertEqual([(section['from_bar'], section['to_bar'], section['order'], section['notation'])
                          for section in self.score['sections']],
                         [(0, 32, 'gate-room', 'R(G(x))'), (32, 40, 'room-gate', 'G(R(x))')])
        for event in self.score['gate_events']:
            self.assertTrue(math.isfinite(event['time']))
            self.assertIn(event['level'], [0, 1])
            self.assertIn(event['order'], ['gate-room', 'room-gate'])
            self.assertGreaterEqual(event['time'], 0)
            self.assertLessEqual(event['time'], ORIGIN + 40 * BAR_SECONDS)
            if ORIGIN + 31.5 * BAR_SECONDS <= event['time'] < ORIGIN + 32 * BAR_SECONDS:
                self.assertEqual(event['level'], 0)
        self.assertEqual(self.score['gate_events'][-1]['level'], 0)


class NativeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest = json.loads((AUTHOR / 'render-manifest.json').read_text(encoding='utf-8'))
        cls.samples = {name: pcm(AUTHOR / name) for name in [
            'ass-identified-return-r8-music.wav', 'foundation-control.wav', 'new-layer.wav',
            'harmony-direct.wav', 'mechanical-response.wav', 'gate-room-proof.wav', 'room-gate-proof.wav']}

    def test_supplied_input_files_retain_their_original_hashes(self):
        for relative, expected in INPUTS.items():
            with self.subTest(file=relative):
                self.assertEqual(sha(ROOT / relative), expected)

    def test_full_outputs_have_one_frame_interval_and_valid_pcm_headroom(self):
        self.assertEqual(self.manifest['revision'], 'identified-return-r8')
        self.assertEqual(self.manifest['frames'], FRAMES)
        self.assertEqual(self.manifest['sample_rate'], RATE)
        records = {entry['file']: entry for entry in self.manifest['outputs']}
        for name, (header, values) in self.samples.items():
            with self.subTest(file=name):
                self.assertEqual(header, (2, RATE, FRAMES, 2))
                self.assertEqual(sha(AUTHOR / name), records[name]['sha256'])
                self.assertLess(max(abs(value) for value in values), 32767)
                self.assertNotIn(-32768, values)
                self.assertEqual(values[-2:], array.array('h', [0, 0]))

    def test_one_common_linear_gain_retains_the_r7_foundation_samples(self):
        gain = self.manifest['common_gain']
        self.assertTrue(math.isfinite(gain) and 0 < gain <= 2)
        header, source = pcm(ROOT / 'audio/stc-study/foxdot-bass-r7/room_mix.wav')
        control = self.samples['foundation-control.wav'][1]
        self.assertEqual(header, (2, RATE, FRAMES, 2))
        self.assertLessEqual(max(abs(actual - expected * gain) for actual, expected in zip(control, source)), 1)

    def test_candidate_is_the_same_gain_foundation_plus_the_new_layer(self):
        candidate = self.samples['ass-identified-return-r8-music.wav'][1]
        control = self.samples['foundation-control.wav'][1]
        layer = self.samples['new-layer.wav'][1]
        self.assertLessEqual(max(abs(a - b - c) for a, b, c in zip(candidate, control, layer)), 2)
        self.assertTrue(any(layer))

    def test_new_layer_keeps_the_opening_and_the_two_beat_silence(self):
        layer = self.samples['new-layer.wav'][1]
        self.assertFalse(any(window(layer, 0, ORIGIN + 4 * BAR_SECONDS)))
        self.assertFalse(any(window(layer, ORIGIN + 31.5 * BAR_SECONDS, ORIGIN + 32 * BAR_SECONDS)))
        mechanism = self.samples['mechanical-response.wav'][1]
        self.assertFalse(any(window(mechanism, ORIGIN + 28 * BAR_SECONDS + .3, ORIGIN + 32 * BAR_SECONDS)))

    def test_ordered_room_paths_are_real_distinct_outputs(self):
        first, second = (self.samples[name][1] for name in ['gate-room-proof.wav', 'room-gate-proof.wav'])
        self.assertTrue(any(first))
        self.assertTrue(any(second))
        self.assertNotEqual(first, second)
        score = load_score()
        energies = [0, 0]
        gates = score['gate_events']
        for index, event in enumerate(gates[:-1]):
            if event['level'] != 0 or not (12 <= (event['time'] - ORIGIN) / BAR_SECONDS < 28):
                continue
            start, end = event['time'] + .08, gates[index + 1]['time'] - .01
            if end <= start:
                continue
            for path, values in enumerate([first, second]):
                energies[path] += sum(value * value for value in window(values, start, end))
        self.assertGreater(energies[0], 0)
        self.assertGreater(energies[0], 10 * energies[1])

    def test_native_processes_keep_explicit_memory_and_no_hidden_allocation_failure(self):
        self.assertEqual(self.manifest['rt_memory_kib'], 65536)
        self.assertEqual(self.manifest['compile']['exit_code'], 0)
        self.assertEqual(self.manifest['native']['exit_code'], 0)
        command = self.manifest['native']['command']
        self.assertEqual(str(command[command.index('-m') + 1]), '65536')
        for name, expected in self.manifest['sources'].items():
            self.assertEqual(sha(AUTHOR / name), expected)
        self.assertEqual(sha(ROOT / 'tools/render-foxdot-operator-track.py'), self.manifest['renderer_sha256'])
        for name in ['sclang.log', 'scsynth-nrt.log']:
            text = (AUTHOR / name).read_text(encoding='utf-8', errors='replace').lower()
            for failure in ['alloc failed', 'exception', 'error:', 'failure in server', 'synthdef not found', 'out of memory']:
                self.assertNotIn(failure, text)


if __name__ == '__main__':
    unittest.main()
