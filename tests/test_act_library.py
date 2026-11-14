"""Check the original Act library with the installed FoxDot Pattern API."""
from collections import Counter
import copy
import importlib.util
import math
from pathlib import Path
import sys
import unittest


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'audio/stc-act-library-r1/compose.py'
SPEC = importlib.util.spec_from_file_location('act_library_composer', SOURCE)
COMPOSER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(COMPOSER)


class ActLibraryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tracks = COMPOSER.definitions()
        cls.Pattern, _, _, cls.provenance = COMPOSER.pattern_api()
        cls.scores = {track['id']: COMPOSER.compose(track) for track in cls.tracks}

    def test_all_four_acts_have_the_four_required_durations(self):
        expected_ids = {f'act{act}-{slot:02d}' for act in range(1, 5) for slot in range(1, 5)}
        self.assertEqual(len(self.tracks), 16)
        self.assertEqual({track['id'] for track in self.tracks}, expected_ids)
        for act in range(1, 5):
            tracks = sorted((track for track in self.tracks if track['act'] == act), key=lambda item: item['slot'])
            with self.subTest(act=act):
                self.assertEqual([track['slot'] for track in tracks], [1, 2, 3, 4])
                self.assertEqual([track['seconds'] for track in tracks], [60, 120, 240, 360])

    def test_titles_motifs_and_seeds_are_distinct(self):
        self.assertEqual(len({track['title'].casefold() for track in self.tracks}), 16)
        self.assertEqual(len({tuple(track['bass_motif']) for track in self.tracks}), 16)
        self.assertEqual(len({track['seed'] for track in self.tracks}), 16)
        for track in self.tracks:
            with self.subTest(track=track['id']):
                self.assertTrue(track['title'].strip())
                self.assertEqual(len(track['bass_motif']), 16)
                self.assertGreaterEqual(len({note for note in track['bass_motif'] if note is not None}), 3)
                self.assertIn(None, track['bass_motif'])

    def test_forms_have_ordered_sections_recovery_and_return(self):
        allowed = {'identity', 'rotate', 'reverse', 'reverse-rotate', 'rotate-reverse', 'voicing'}
        for track in self.tracks:
            with self.subTest(track=track['id']):
                form = track['form']
                self.assertGreaterEqual(len(form), 8 if track['seconds'] == 360 else 4)
                self.assertEqual(form[0]['at'], 0)
                self.assertLess(form[-1]['at'], 1)
                self.assertTrue(all(left['at'] < right['at'] for left, right in zip(form, form[1:])))
                self.assertGreater(max(part['energy'] for part in form) - min(part['energy'] for part in form), .2)
                self.assertGreaterEqual(len({part['label'] for part in form}), 4)
                self.assertTrue(any(part['mutation'] == 'identity' for part in form))
                for part in form:
                    self.assertIn(part['mutation'], allowed)
                    for key in ['bass', 'drums', 'pads', 'texture']:
                        self.assertTrue(0 <= part[key] <= 1)
                    self.assertTrue(.2 <= part['energy'] <= 1)
                if track['seconds'] >= 120:
                    self.assertTrue(any(part['drums'] <= .45 for part in form))
                    self.assertTrue(any(part['drums'] >= .8 for part in form[1:]))

    def test_chords_and_roots_define_complete_harmonic_material(self):
        for track in self.tracks:
            with self.subTest(track=track['id']):
                self.assertEqual(len(track['chords']), len(track['harmony_roots']))
                self.assertGreaterEqual(len(track['chords']), 1)
                for chord in track['chords']:
                    self.assertEqual(len(chord), 4)
                    self.assertEqual(chord, sorted(chord))
                    self.assertTrue(all(isinstance(note, int) and 48 <= note <= 84 for note in chord))
                self.assertTrue(all(isinstance(root, int) and -12 <= root <= 12 for root in track['harmony_roots']))

    def test_real_foxdot_patterns_compose_without_a_live_clock(self):
        self.assertEqual(self.Pattern.__module__.split('.')[0], 'FoxDot')
        self.assertEqual(self.provenance['distribution'], 'FoxDot')
        self.assertTrue(self.provenance['original_composition_authored_with_foxdot'])
        self.assertFalse(self.provenance['realtime_scheduler_used'])
        self.assertFalse(any('TempoClock' in name or 'ServerManager' in name
                             for name in sys.modules if name.startswith('FoxDot.')))
        for score in self.scores.values():
            self.assertEqual(score['time_unit'], 'seconds')
            self.assertEqual(score['note_unit'], 'MIDI semitones')
            self.assertFalse(score['foxdot']['realtime_scheduler_used'])

    def test_short_and_long_scores_repeat_exactly_with_the_same_seed(self):
        for identifier in ['act1-01', 'act2-03', 'act4-04']:
            with self.subTest(track=identifier):
                track = next(track for track in self.tracks if track['id'] == identifier)
                before = copy.deepcopy(track)
                self.assertEqual(COMPOSER.compose(track), self.scores[identifier])
                self.assertEqual(track, before)

    def test_a_new_seed_changes_variation_without_changing_the_bass_phrase(self):
        original = next(track for track in self.tracks if track['id'] == 'act2-02')
        changed = {**original, 'seed': original['seed'] + 10000}
        first, second = self.scores[original['id']]['events'], COMPOSER.compose(changed)['events']
        bass = lambda events: [(event['time'], event['midi'], event['dur']) for event in events if event['kind'] == 'Bass']
        detail = lambda events: [(event['time'], event['kind'], event['amp'], event.get('pan'))
                                 for event in events if event['kind'] in {'Hat', 'Pad', 'Noise'}]
        self.assertEqual(bass(first), bass(second))
        self.assertNotEqual(detail(first), detail(second))

    def test_schedules_are_finite_sorted_and_leave_the_tail_interval(self):
        for score in self.scores.values():
            with self.subTest(track=score['track']['id']):
                events, duration = score['events'], score['track']['seconds']
                self.assertTrue(events)
                times = [event['time'] for event in events]
                self.assertEqual(times, sorted(times))
                self.assertTrue(all(math.isfinite(time) and 0 <= time < duration - 3 for time in times))
                for event in events:
                    if 'dur' in event:
                        self.assertTrue(math.isfinite(event['dur']) and event['dur'] > 0)
                        self.assertLessEqual(event['time'] + event['dur'], duration)

    def test_note_gain_filter_and_pan_requests_stay_in_safe_parameter_ranges(self):
        for score in self.scores.values():
            with self.subTest(track=score['track']['id']):
                for event in score['events']:
                    self.assertTrue(math.isfinite(event['amp']) and 0 < event['amp'] <= 1)
                    self.assertIsInstance(event['seed'], int)
                    if 'midi' in event:
                        self.assertTrue(isinstance(event['midi'], int) and 21 <= event['midi'] <= 96)
                    if 'pan' in event:
                        self.assertTrue(math.isfinite(event['pan']) and -1 <= event['pan'] <= 1)
                    if 'cutoff' in event:
                        self.assertTrue(math.isfinite(event['cutoff']) and 20 <= event['cutoff'] < 24000)

    def test_every_piece_contains_real_bass_and_percussion_events(self):
        for score in self.scores.values():
            with self.subTest(track=score['track']['id']):
                kinds = Counter(event['kind'] for event in score['events'])
                self.assertGreater(kinds['Bass'], 40)
                self.assertGreater(kinds['Kick'], 20)
                self.assertGreater(kinds['Snare'], 10)
                self.assertGreater(kinds['Hat'], 20)
                self.assertGreater(kinds['Metal'], 5)
                self.assertGreaterEqual(len({event['midi'] for event in score['events'] if event['kind'] == 'Bass'}), 3)

    def test_foxdot_rest_constants_do_not_become_extra_bass_notes(self):
        wrapped = self.Pattern([None])[0]
        self.assertIsNone(getattr(wrapped, 'value', wrapped))
        for track in self.tracks:
            with self.subTest(track=track['id']):
                step = 15 / track['bpm']
                events = [event for event in self.scores[track['id']]['events'] if event['kind'] == 'Bass']
                first_bar = [round((event['time'] - .04) / step) for event in events
                             if event['time'] < .04 + 16 * step - .000001]
                self.assertEqual(track['form'][0]['mutation'], 'identity')
                self.assertEqual(first_bar, [index for index, note in enumerate(track['bass_motif']) if note is not None])
                counts = Counter(round((event['time'] - .04) / step) // 16 for event in events)
                expected = sum(note is not None for note in track['bass_motif'])
                for bar, count in counts.items():
                    start, last = .04 + bar * 16 * step, .04 + (bar * 16 + 15) * step
                    part = COMPOSER.section_at(track, start)
                    if last < track['seconds'] - 3 and part == COMPOSER.section_at(track, last) and part['bass'] > 0:
                        self.assertEqual(count, expected)

    def test_rotation_and_reversal_have_distinct_orders_and_retain_the_cell(self):
        motif = self.Pattern([0, 2, 5, 1])
        reverse_rotate = list(COMPOSER.transform(motif, 'reverse-rotate'))
        rotate_reverse = list(COMPOSER.transform(motif, 'rotate-reverse'))
        self.assertEqual(reverse_rotate, [0, 1, 5, 2])
        self.assertEqual(rotate_reverse, [5, 2, 0, 1])
        self.assertNotEqual(reverse_rotate, rotate_reverse)
        for track in self.tracks:
            original = self.Pattern(track['bass_motif'])
            for operation in ['rotate', 'reverse', 'reverse-rotate', 'rotate-reverse']:
                with self.subTest(track=track['id'], operation=operation):
                    values = lambda pattern: Counter(getattr(note, 'value', note) for note in pattern)
                    self.assertEqual(values(COMPOSER.transform(original, operation)), values(original))

    def test_ordered_transformation_sections_emit_the_named_mutations(self):
        score = self.scores['act2-03']
        bass = [event for event in score['events'] if event['kind'] == 'Bass']
        orders = {}
        for mutation in ['reverse-rotate', 'rotate-reverse']:
            events = [event for event in bass if event['mutation'] == mutation]
            self.assertGreater(len(events), 16)
            orders[mutation] = [event['midi'] for event in events[:16]]
        self.assertNotEqual(orders['reverse-rotate'], orders['rotate-reverse'])
        for track in self.tracks:
            emitted = {event['mutation'] for event in self.scores[track['id']]['events'] if event['kind'] == 'Bass'}
            for part in track['form']:
                if part['bass'] > 0:
                    with self.subTest(track=track['id'], mutation=part['mutation']):
                        self.assertIn(part['mutation'], emitted)

    def test_octave_revoicing_retains_the_chord_pitch_classes(self):
        for track in self.tracks:
            for chord in track['chords']:
                with self.subTest(track=track['id'], chord=chord):
                    transformed = COMPOSER.voice_chord(chord, True)
                    self.assertEqual(Counter(note % 12 for note in transformed), Counter(note % 12 for note in chord))
                    self.assertEqual(len(transformed), len(chord))
                    self.assertNotEqual(transformed, chord)
                    self.assertEqual(COMPOSER.voice_chord(chord, False), chord)

    def test_active_atmosphere_has_irregular_off_grid_onsets(self):
        for track in self.tracks:
            pads = [event for event in self.scores[track['id']]['events'] if event['kind'] == 'Pad']
            with self.subTest(track=track['id']):
                if not any(part['pads'] > 0 for part in track['form']):
                    self.assertEqual(pads, [])
                    continue
                self.assertGreaterEqual(len(pads), 4)
                starts = [event['time'] for event in pads[::4]]
                step = 15 / track['bpm']
                self.assertTrue(any(abs((time - .04) / step - round((time - .04) / step)) > .05 for time in starts))
                if track['seconds'] >= 120:
                    gaps = [right - left for left, right in zip(starts, starts[1:])]
                    self.assertGreaterEqual(len(gaps), 3)
                    self.assertGreater(max(gaps) - min(gaps), .25)
                    self.assertTrue(any(abs(gap / step - round(gap / step)) > .05 for gap in gaps))

    def test_the_stutter_switch_adds_off_grid_repeats_without_removing_the_base_events(self):
        original = next(track for track in self.tracks if track['id'] == 'act2-03')
        enabled = {**original, 'operations': [*original['operations'], 'stutter']}
        source = [event for event in self.scores[original['id']]['events'] if event['kind'] == 'Metal']
        repeated = [event for event in COMPOSER.compose(enabled)['events'] if event['kind'] == 'Metal']
        step = 15 / original['bpm']
        self.assertGreater(len(repeated), len(source))
        base = {(event['time'], event['midi'], event['amp']) for event in repeated}
        self.assertTrue(all((event['time'], event['midi'], event['amp']) in base for event in source))
        self.assertTrue(any(abs((event['time'] - .04) / step - round((event['time'] - .04) / step)) > .2
                            for event in repeated))


if __name__ == '__main__':
    unittest.main()
