"""Sequence the selected stereo recording with installed FoxDot patterns."""
import importlib
import importlib.metadata
import importlib.util
from pathlib import Path
import sys
import types


def load_pattern_api():
    """Load the installed pattern code without its realtime package startup."""
    spec = importlib.util.find_spec('FoxDot')
    if spec is None or spec.origin is None:
        raise RuntimeError('Run this script with the installed FoxDot environment Python.')
    source = Path(spec.origin).parent
    for name, folder in [('FoxDot', source), ('FoxDot.lib', source / 'lib')]:
        if name not in sys.modules:
            module = types.ModuleType(name)
            module.__path__ = [str(folder)]
            module.__spec__ = (spec if name == 'FoxDot' else
                               importlib.util.spec_from_file_location(
                                   name, folder / '__init__.py',
                                   submodule_search_locations=[str(folder)]))
            sys.modules[name] = module
    patterns = importlib.import_module('FoxDot.lib.Patterns')
    importlib.import_module('FoxDot.lib.TimeVar')
    forbidden = [name for name in sys.modules if name.startswith('FoxDot.')
                 and ('TempoClock' in name or 'ServerManager' in name)]
    if forbidden:
        raise RuntimeError('A realtime FoxDot module was loaded: ' + ', '.join(forbidden))
    return patterns.Pattern, {
        'distribution': 'FoxDot',
        'version': importlib.metadata.version('FoxDot'),
        'pattern_source': str(Path(patterns.__file__).resolve()),
        'import_method': 'Installed Patterns and TimeVar definitions in isolated package namespaces. Package realtime startup was not executed.',
        'realtime_scheduler_used': False,
        'original_composition_authored_with_foxdot': False,
        'role': 'Author and evaluate a finite sample-entry sequence for the selected existing take.',
    }


def author_take(source_frames, source_rate, bpm=134):
    Pattern, provenance = load_pattern_api()
    starts = Pattern([0]) + Pattern([0])
    gains = Pattern([1]).rotate(0)
    rates = Pattern([1])
    duration_beats = source_frames / source_rate * bpm / 60
    durations = Pattern([duration_beats])
    events = [{
        'index': index,
        'synth': 'assStereoRoomR6',
        'beat': float(starts[index]),
        'seconds': float(starts[index]) * 60 / bpm,
        'gain': float(gains[index]),
        'rate': float(rates[index]),
        'source_start_frame': 0,
        'source_frames': source_frames,
        'duration_beats': float(durations[index]),
    } for index in range(1)]
    return {'bpm': bpm, 'events': events, 'foxdot': provenance}
