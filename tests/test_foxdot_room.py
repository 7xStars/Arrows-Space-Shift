"""Check the finite score and the exported room stems."""
import array
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import sys
import unittest
import wave

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'audio/stc-study/foxdot-room-r6'
spec = importlib.util.spec_from_file_location('render_foxdot_room', ROOT / 'tools/render-foxdot-room.py')
render = importlib.util.module_from_spec(spec)
spec.loader.exec_module(render)


def wave_data(path):
    with wave.open(str(path), 'rb') as audio:
        return (audio.getnchannels(), audio.getframerate(), audio.getsampwidth(),
                audio.getnframes(), audio.readframes(audio.getnframes()))


class ScoreTests(unittest.TestCase):
    def test_osc_padding_and_nested_completion(self):
        completion = render.osc_message('/s_new', ['take', 1000, 0, 0])
        packet = render.osc_message('/b_allocRead', [0, 'a.wav', 0, -1, completion])
        self.assertEqual(len(packet) % 4, 0)
        self.assertIn(b',isiib\0', packet)
        self.assertIn(struct.pack('>i', len(completion)) + completion, packet)
        bundle = render.osc_bundle(1.25, [packet])
        self.assertEqual(struct.unpack_from('>i', bundle)[0], len(bundle) - 4)
        self.assertEqual(bundle[4:12], b'#bundle\0')
        self.assertEqual(struct.unpack_from('>II', bundle, 12), (1, 2**30))

    @unittest.skipUnless(importlib.util.find_spec('FoxDot'), 'Run with the installed FoxDot Python environment.')
    def test_actual_foxdot_patterns_make_one_unmodified_take(self):
        author_spec = importlib.util.spec_from_file_location('foxdot_take_test', OUTPUT / 'foxdot_take.py')
        author = importlib.util.module_from_spec(author_spec)
        author_spec.loader.exec_module(author)
        take = author.author_take(48000, 48000)
        repeated = author.author_take(48000, 48000)
        self.assertEqual(repeated, take)
        self.assertEqual(len(take['events']), 1)
        event = take['events'][0]
        self.assertEqual((event['seconds'], event['source_start_frame'], event['gain'], event['rate']), (0, 0, 1, 1))
        self.assertEqual(event['source_frames'], 48000)
        self.assertEqual(take['foxdot']['version'], '0.9.0')
        self.assertFalse(take['foxdot']['realtime_scheduler_used'])
        self.assertFalse(take['foxdot']['original_composition_authored_with_foxdot'])
        self.assertFalse(any('TempoClock' in key or 'ServerManager' in key
                             for key in sys.modules if key.startswith('FoxDot')))


@unittest.skipUnless((OUTPUT / 'render-manifest.json').is_file(), 'Render the room stems first.')
class RenderTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest = json.loads((OUTPUT / 'render-manifest.json').read_text(encoding='utf-8'))
        cls.source = wave_data(render.DEFAULT_SOURCE)
        cls.dry = wave_data(OUTPUT / 'dry_take.wav')
        cls.wet = wave_data(OUTPUT / 'room_return.wav')
        cls.mix = wave_data(OUTPUT / 'room_mix.wav')

    def test_all_stems_have_one_frame_interval_and_an_exact_dry_prefix(self):
        self.assertEqual(self.dry[:4], self.wet[:4])
        self.assertEqual(self.dry[:4], self.mix[:4])
        self.assertEqual(self.dry[:3], (2, 48000, 2))
        self.assertEqual(self.dry[3], self.source[3] + 3 * 48000)
        self.assertEqual(self.dry[4][:len(self.source[4])], self.source[4])
        self.assertFalse(any(self.dry[4][len(self.source[4]):]))
        self.assertEqual(self.manifest['max_dry_pcm_difference'], 0)
        self.assertEqual(self.manifest['source_alignment_offset_frames'], 0)

    def test_export_hashes_and_successful_native_render_are_recorded(self):
        for output in self.manifest['outputs']:
            self.assertEqual(hashlib.sha256((OUTPUT / output['file']).read_bytes()).hexdigest(), output['sha256'])
            self.assertEqual(output['full_scale'], 0)
            self.assertEqual(output['non_finite'], 0)
        self.assertEqual(self.manifest['supercollider']['compile_exit_code'], 0)
        self.assertEqual(self.manifest['supercollider']['render_exit_code'], 0)
        self.assertEqual(self.manifest['supercollider']['mode'], 'NRT')
        self.assertFalse(self.manifest['reaper']['opened_or_rendered'])
        score = (OUTPUT / 'room-score.osc').read_bytes()
        self.assertIn(b'/n_free\0', score)
        self.assertIn(b'/b_free\0', score)
        self.assertIn(b'/c_set\0', score)
        self.assertNotIn(b'/quit', score)

    def test_room_mix_adds_a_return_without_changing_the_dry_track(self):
        dry = array.array('h', self.dry[4])
        wet = array.array('h', self.wet[4])
        mix = array.array('h', self.mix[4])
        gain = self.manifest['room_gain']
        differences = [abs(mix[i] - round(dry[i] + gain * wet[i])) for i in range(0, len(dry), 97)]
        self.assertLessEqual(max(differences), 1)
        self.assertTrue(any(wet))
        tail_start = self.source[3] * 2
        self.assertTrue(any(wet[tail_start:]))
        self.assertEqual(wet[-2:], array.array('h', [0, 0]))
        self.assertLess(max(abs(value) for value in mix), 32767)


if __name__ == '__main__':
    unittest.main()
