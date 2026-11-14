"""Check the isolated bass source, FoxDot pan sequence, and native render."""
import array
import importlib.util
import json
import math
from pathlib import Path
import sys
import unittest
import wave

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT/'audio/stc-study/foxdot-bass-r7'
spec = importlib.util.spec_from_file_location('bass_render',ROOT/'tools/render-foxdot-bass.py')
render = importlib.util.module_from_spec(spec)
spec.loader.exec_module(render)


def pcm(path):
    with wave.open(str(path),'rb') as file:
        return (file.getnchannels(),file.getframerate(),file.getnframes(),array.array('h',file.readframes(file.getnframes())))


class PatternTests(unittest.TestCase):
    @unittest.skipUnless(importlib.util.find_spec('FoxDot'),'Run with the installed FoxDot Python environment.')
    def test_actual_patterns_repeat_a_four_bar_fade_without_realtime_startup(self):
        spec = importlib.util.spec_from_file_location('bass_author_test',OUTPUT/'foxdot_bass.py')
        author = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(author)
        first = author.author_pan()
        self.assertEqual(first,author.author_pan())
        self.assertEqual(len(first['events']),640)
        self.assertEqual(first['events'][0]['pan'],-.85)
        self.assertAlmostEqual(first['events'][32]['pan'],.85)
        self.assertEqual(first['events'][64]['pan'],-.85)
        self.assertAlmostEqual(first['events'][64]['seconds']-first['events'][0]['seconds'],16*60/134)
        self.assertEqual(first['foxdot']['version'],'0.9.0')
        self.assertFalse(any('TempoClock' in key or 'ServerManager' in key for key in sys.modules if key.startswith('FoxDot')))


@unittest.skipUnless((OUTPUT/'render-manifest.json').is_file(),'Render the r7 stems first.')
class NativeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest = json.loads((OUTPUT/'render-manifest.json').read_text())

    def test_isolated_sources_have_one_time_origin_and_retained_source_code(self):
        fixed = render.helpers.read_float_wav(OUTPUT/'source-accompaniment.wav')
        acid = render.helpers.read_float_wav(OUTPUT/'source-acid-direct.wav')
        self.assertEqual((fixed[0],acid[0]),(2,1))
        self.assertEqual((fixed[1],acid[1]),(48000,48000))
        self.assertEqual(len(fixed[2])//2,len(acid[2]))
        for item in self.manifest['sources']:
            self.assertEqual(render.helpers.sha256(OUTPUT/item['file']),item['sha256'])
        for file,value in self.manifest['source_capture']['sources'].items():
            self.assertEqual(render.helpers.sha256(ROOT/file),value)

    def test_native_pan_moves_only_the_upper_path_while_low_is_identical_in_both_channels(self):
        proof = self.manifest['pan_proof']
        self.assertEqual(proof['low_max_channel_difference'],0)
        self.assertGreater(proof['left_window_left_to_right_energy'],20)
        self.assertGreater(proof['right_window_right_to_left_energy'],20)
        low = pcm(OUTPUT/'bass_low_center.wav')[3]
        self.assertEqual(low[::2],low[1::2])
        self.assertTrue(any(low))

    def test_native_render_exits_cleanly_and_retains_an_explicit_end(self):
        self.assertEqual(self.manifest['supercollider']['mode'],'NRT')
        self.assertEqual(self.manifest['supercollider']['compile_exit_code'],0)
        self.assertEqual(self.manifest['supercollider']['render_exit_code'],0)
        score = (OUTPUT/'bass-score.osc').read_bytes()
        self.assertIn(b'/n_set\0',score)
        self.assertIn(b'/n_free\0',score)
        self.assertIn(b'/b_free\0',score)
        self.assertIn(b'/c_set\0',score)
        self.assertNotIn(b'/quit',score)

    def test_output_files_have_shared_frames_valid_hashes_and_headroom(self):
        for item in self.manifest['outputs']:
            self.assertEqual(render.helpers.sha256(OUTPUT/item['file']),item['sha256'])
            data = pcm(OUTPUT/item['file'])
            self.assertEqual(data[:3],(2,48000,self.manifest['common_frames']))
            self.assertEqual(item['full_scale'],0)
            self.assertEqual(item['non_finite'],0)
        self.assertEqual(self.manifest['common_frames'],self.manifest['source_frames']+3*48000)

    def test_common_gain_matches_reference_rms_without_independent_normalization(self):
        calibration = self.manifest['level_calibration']
        output = next(item for item in self.manifest['outputs'] if item['file']=='dry_take.wav')
        self.assertAlmostEqual(output['rms'],calibration['reference_r6_dry_rms'],places=7)
        self.assertEqual(self.manifest['shared_output_gain'],calibration['selected_common_gain'])
        for value in calibration['room_mix_peaks_after_gain'].values():
            self.assertLess(value,1)

    def test_runtime_stems_reconstruct_the_review_mix_at_the_lower_room_amount(self):
        dry = pcm(OUTPUT/'dry_take.wav')[3]
        wet = pcm(OUTPUT/'room_return.wav')[3]
        mix = pcm(OUTPUT/'room_mix.wav')[3]
        self.assertEqual(self.manifest['room_gain'],.12)
        error = max(abs(mix[i]-round(dry[i]+.12*wet[i])) for i in range(0,len(dry),97))
        self.assertLessEqual(error,1)
        self.assertEqual(wet[-2:],array.array('h',[0,0]))
        self.assertTrue(any(wet[self.manifest['source_frames']*2:]))


if __name__ == '__main__':
    unittest.main()
