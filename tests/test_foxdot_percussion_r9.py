"""Measure the isolated percussion change and the retained r8 music."""
import array
import hashlib
import json
import math
from pathlib import Path
import unittest
import wave

ROOT = Path(__file__).resolve().parent.parent
AUTHOR = ROOT / 'audio/stc-study/foxdot-percussion-r9'
PREVIOUS = ROOT / 'audio/stc-study/foxdot-operator-r8'
RATE, FRAMES = 48000, 3678806
ORIGIN, BAR_SECONDS = .04, 240 / 134
PERCUSSION_GAIN = math.sqrt(10)
R8_HASHES = {
    'ass-identified-return-r8-music.wav': 'f9dec019ac909847619e18fd51f57e1dda99f4703b3ae60f5d75a12ba4c0d818',
    'foundation-control.wav': '51d7229c03b3b2c2a1373c51360dc8451760146b4bcb6bb7a4dfeda5410bd7a5',
    'new-layer.wav': 'd3d59599012a956c5c0a62c1f3a286e3589ae75577f4732777469bd50bfbf561',
    'harmony-direct.wav': 'b6c9cb45f3ce1de5677f783f4a3919d83042656ff09b27c19be6576bdce0c078',
    'mechanical-response.wav': 'f1f05841aa439e57480d6d34e99d3cfa72ea470a7e41338433bb6d1b50884599',
    'gate-room-proof.wav': '64e6994fb0490e136d916f5b72f054ac3635c181dc389ccb02bec7aadaf7bd29',
    'room-gate-proof.wav': '8c5980a2fa101d197f1d33afe229deb3c736b0404e2747ae5038aafbfe6bc70f',
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def pcm(path):
    with wave.open(str(path), 'rb') as source:
        header = (source.getnchannels(), source.getframerate(), source.getnframes(), source.getsampwidth())
        values = array.array('h', source.readframes(source.getnframes()))
    return header, values


def interval(values, start, end):
    return values[math.ceil(start * RATE) * 2:math.floor(end * RATE) * 2]


class PercussionRevisionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest = json.loads((AUTHOR / 'render-manifest.json').read_text(encoding='utf-8'))
        cls.old = {name: pcm(PREVIOUS / name)[1] for name in [
            'ass-identified-return-r8-music.wav', 'mechanical-response.wav']}
        cls.new = {name: pcm(AUTHOR / name) for name in [
            'ass-identified-return-r9-music.wav', 'foundation-control.wav', 'new-layer.wav',
            'harmony-direct.wav', 'mechanical-response.wav', 'gate-room-proof.wav', 'room-gate-proof.wav']}

    def test_the_supplied_masters_and_all_seven_r8_wavs_keep_their_hashes(self):
        self.assertEqual(sha(ROOT / 'reports/stc-study-r5/ass-identified-return-r5-stereo-music.wav'),
                         '473d928d8d1228fe25744dc57f7fd1ee1d9ac2be6026e3c0e5ec0c15a6d8a841')
        self.assertEqual(sha(ROOT / 'audio/stc-study/foxdot-bass-r7/room_mix.wav'),
                         '51d7229c03b3b2c2a1373c51360dc8451760146b4bcb6bb7a4dfeda5410bd7a5')
        for name, expected in R8_HASHES.items():
            with self.subTest(file=name):
                self.assertEqual(sha(PREVIOUS / name), expected)

    def test_the_finite_note_rhythm_and_gate_score_is_unchanged(self):
        old = json.loads((PREVIOUS / 'foxdot-score.json').read_text(encoding='utf-8'))
        new = json.loads((AUTHOR / 'foxdot-score.json').read_text(encoding='utf-8'))
        self.assertEqual(old, new)
        self.assertEqual((new['bpm'], new['bars']), (134, 40))
        self.assertEqual(new['foxdot']['version'], '0.9.0')
        self.assertFalse(new['foxdot']['realtime_scheduler_used'])

    def test_new_outputs_share_the_retained_interval_and_pcm_headroom(self):
        self.assertEqual(self.manifest['frames'], FRAMES)
        self.assertEqual(self.manifest['sample_rate'], RATE)
        records = {entry['file']: entry for entry in self.manifest['outputs']}
        for name, (header, values) in self.new.items():
            with self.subTest(file=name):
                self.assertEqual(header, (2, RATE, FRAMES, 2))
                self.assertEqual(sha(AUTHOR / name), records[name]['sha256'])
                self.assertLess(max(abs(value) for value in values), 32767)
                self.assertNotIn(-32768, values)
                self.assertEqual(values[-2:], array.array('h', [0, 0]))

    def test_foundation_harmony_and_ordered_room_outputs_are_sample_identical_to_r8(self):
        for name in ['foundation-control.wav', 'harmony-direct.wav', 'gate-room-proof.wav', 'room-gate-proof.wav']:
            with self.subTest(file=name):
                self.assertEqual(sha(AUTHOR / name), R8_HASHES[name])

    def test_only_the_percussion_amplitude_grows_by_ten_decibels(self):
        old = self.old['mechanical-response.wav']
        new = self.new['mechanical-response.wav'][1]
        self.assertGreater(max(abs(value) for value in old), 0)
        self.assertLessEqual(max(abs(actual - previous * PERCUSSION_GAIN) for actual, previous in zip(new, old)), 3)
        ratio = math.sqrt(sum(value * value for value in new) / sum(value * value for value in old))
        self.assertAlmostEqual(20 * math.log10(ratio), 10, delta=.01)

    def test_the_full_mix_change_equals_the_percussion_change(self):
        old_mix = self.old['ass-identified-return-r8-music.wav']
        new_mix = self.new['ass-identified-return-r9-music.wav'][1]
        old_percussion = self.old['mechanical-response.wav']
        new_percussion = self.new['mechanical-response.wav'][1]
        error = max(abs((b - a) - (q - p)) for a, b, p, q in zip(old_mix, new_mix, old_percussion, new_percussion))
        self.assertLessEqual(error, 2)
        self.assertNotEqual(old_mix, new_mix)
        control = self.new['foundation-control.wav'][1]
        layer = self.new['new-layer.wav'][1]
        self.assertLessEqual(max(abs(a - b - c) for a, b, c in zip(new_mix, control, layer)), 2)

    def test_the_opening_gap_and_end_keep_their_added_layer_silence(self):
        layer = self.new['new-layer.wav'][1]
        self.assertFalse(any(interval(layer, 0, ORIGIN + 4 * BAR_SECONDS)))
        self.assertFalse(any(interval(layer, ORIGIN + 31.5 * BAR_SECONDS, ORIGIN + 32 * BAR_SECONDS)))
        self.assertFalse(any(interval(layer, ORIGIN + 40 * BAR_SECONDS, FRAMES / RATE)))
        percussion = self.new['mechanical-response.wav'][1]
        self.assertFalse(any(interval(percussion, ORIGIN + 28 * BAR_SECONDS, ORIGIN + 32 * BAR_SECONDS)))

    def test_the_native_render_keeps_its_source_identity_and_memory_budget(self):
        self.assertEqual(self.manifest['common_gain'], 1)
        self.assertEqual(self.manifest['layer_mix']['layer_gain'], 1.25)
        self.assertEqual(self.manifest['layer_mix']['harmony_room_gain'], .11)
        self.assertEqual(self.manifest['percussion_revision']['source_gain_db'], 10)
        self.assertAlmostEqual(self.manifest['percussion_revision']['source_gain'], PERCUSSION_GAIN)
        self.assertEqual(self.manifest['rt_memory_kib'], 65536)
        self.assertEqual(self.manifest['compile']['exit_code'], 0)
        self.assertEqual(self.manifest['native']['exit_code'], 0)
        command = self.manifest['native']['command']
        self.assertEqual(str(command[command.index('-m') + 1]), '65536')
        for name, expected in self.manifest['sources'].items():
            self.assertEqual(sha(AUTHOR / name), expected)
        self.assertEqual(sha(ROOT / 'tools/render-foxdot-percussion-r9.py'), self.manifest['renderer_sha256'])
        for name in ['compose.py', 'operator_track.scd']:
            self.assertEqual(sha(AUTHOR / name), sha(PREVIOUS / name))
        for name in ['sclang.log', 'scsynth-nrt.log']:
            text = (AUTHOR / name).read_text(encoding='utf-8', errors='replace').lower()
            for failure in ['alloc failed', 'exception', 'error:', 'failure in server', 'synthdef not found', 'out of memory']:
                self.assertNotIn(failure, text)


if __name__ == '__main__':
    unittest.main()
