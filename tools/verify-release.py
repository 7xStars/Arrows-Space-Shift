"""Verify a release ZIP without extracting it."""
import argparse
import importlib.util
import json
from pathlib import Path

spec = importlib.util.spec_from_file_location('release_package', Path(__file__).with_name('package-release.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path)
    parser.add_argument('--label', choices=['PLAY', 'SOURCE'], required=True)
    args = parser.parse_args()
    result = module.verify_archive(args.archive, label=args.label)
    print(json.dumps({'archive': str(args.archive), 'sha256': module.streamed_sha256(args.archive), **result}, indent=2))
