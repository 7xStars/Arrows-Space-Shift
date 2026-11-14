"""Check original tempo scores and the production envelope contract."""
import copy
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parent.parent
SPEC = importlib.util.spec_from_file_location('tested_tempo_composer', ROOT / 'audio/stc-tempo-r2/compose.py')
COMPOSER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(COMPOSER)


class TempoTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tracks = COMPOSER.definitions()
        cls.scores = {track['id']: COMPOSER.compose(track) for track in cls.tracks}

    def test_required_tempo_range_and_duration(self):
        self.assertEqual(sorted(track['bpm'] for track in self.tracks), [120, 136, 144, 152, 168, 184, 200, 220, 240])
        self.assertTrue(all(track['seconds'] == 120 for track in self.tracks))
        self.assertEqual(len({track['id'] for track in self.tracks}), 9)
        self.assertEqual(len({track['seed'] for track in self.tracks}), 9)

    def test_new_cells_are_not_old_track_speed_changes(self):
        old = COMPOSER.BASE.definitions()
        old_cells = {tuple(track['bass_motif']) for track in old}
        self.assertTrue(all(tuple(track['bass_motif']) not in old_cells for track in self.tracks))
        self.assertEqual(len({tuple(track['bass_motif']) for track in self.tracks}), 9)

    def test_actual_foxdot_provenance_and_repeated_score(self):
        first = self.tracks[0]
        self.assertEqual(self.scores[first['id']], COMPOSER.compose(first))
        for score in self.scores.values():
            self.assertEqual(score['foxdot']['distribution'], 'FoxDot')
            self.assertTrue(score['foxdot']['original_composition_authored_with_foxdot'])
            self.assertFalse(score['foxdot']['realtime_scheduler_used'])

    def test_envelopes_follow_the_track_instead_of_fixed_old_decay(self):
        for track in self.tracks:
            sound = COMPOSER.parameters(track)
            events = self.scores[track['id']]['events']
            self.assertTrue(any(event['kind'] == 'Kick' for event in events))
            self.assertTrue(all(event['dur'] == sound['kick_decay'] for event in events if event['kind'] == 'Kick'))
            self.assertTrue(all(event['dur'] == sound['snare_decay'] for event in events if event['kind'] == 'Snare'))
        fast = next(track for track in self.tracks if track['bpm'] == 240)
        self.assertLessEqual(COMPOSER.parameters(fast)['kick_decay'], .25)

    def test_invalid_production_controls_are_rejected(self):
        for name, value in [('room_mix', .9), ('kick_decay', -1), ('bass_gate', float('nan'))]:
            with self.subTest(name=name), self.assertRaises(ValueError):
                COMPOSER.parameters({name: value})

    def test_composition_preserves_definition_and_has_finite_ending(self):
        for track in self.tracks:
            before = copy.deepcopy(track)
            score = COMPOSER.compose(track)
            self.assertEqual(track, before)
            self.assertTrue(all(0 <= event['time'] < 117 for event in score['events']))
            self.assertEqual(score['events'], sorted(score['events'], key=lambda event: (event['time'], event['kind'])))

    def test_fast_hat_gain_and_atmosphere_are_bounded(self):
        for track in self.tracks:
            sound = COMPOSER.parameters(track)
            self.assertLessEqual(sound['room_mix'], .18)
            if track['bpm'] >= 200:
                self.assertLessEqual(sound['hat_gain'], .055)
                self.assertGreaterEqual(sound['pan_cycle_beats'] * 60 / track['bpm'], 4)

    def test_swells_do_not_retime_the_accepted_core(self):
        track = next(item for item in self.tracks if item['id'] == 'tempo-act3-02')
        old = next(item for item in __import__('json').loads((ROOT / 'audio/stc-tempo-r2/revisions/r2/act34.json').read_text()) if item['id'] == track['id'])
        old_score = COMPOSER.compose(old)
        current = self.scores[track['id']]
        self.assertEqual([event for event in current['events'] if event['kind'] != 'Swell'], old_score['events'])
        swells = [event for event in current['events'] if event['kind'] == 'Swell']
        self.assertGreaterEqual(len(swells), 10)
        self.assertTrue(all(8 <= event['dur'] <= 12 for event in swells))
        self.assertEqual(track['pan_cycle_beats'] * 60 / track['bpm'], 4)

    def test_other_eight_definitions_stay_unchanged(self):
        import json
        before = []
        for name in ['act12.json', 'act34.json']:
            before.extend(json.loads((ROOT / 'audio/stc-tempo-r2/revisions/r2' / name).read_text()))
        old = {track['id']: track for track in before}
        for track in self.tracks:
            if track['id'] != 'tempo-act3-02':
                self.assertEqual(track, old[track['id']])
                self.assertFalse(any(event['kind'] == 'Swell' for event in self.scores[track['id']]['events']))


if __name__ == '__main__':
    unittest.main()
