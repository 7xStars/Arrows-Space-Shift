"""Prepare the percussion-only revision and aligned r8 comparisons."""
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUTHOR = ROOT / 'audio/stc-study/foxdot-percussion-r9'
PRIOR = ROOT / 'audio/stc-study/foxdot-operator-r8'


def main():
    spec = importlib.util.spec_from_file_location('retained_r8_excerpt', ROOT / 'tools/prepare-track-review-r8.py')
    helper = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(helper)
    for old, new in [('ass-identified-return-r8-music.wav', 'r8-control.wav'),
                     ('mechanical-response.wav', 'r8-percussion-control.wav')]:
        data = (PRIOR / old).read_bytes()
        (AUTHOR / new).write_bytes(data)
        assert hashlib.sha256((AUTHOR / new).read_bytes()).digest() == hashlib.sha256(data).digest()
    records = []
    for name, start_bar, end_bar in [('percussion', 10, 14), ('break-return', 26, 36)]:
        start, end = (.04 + bar * 240 / 134 for bar in [start_bar, end_bar])
        for revision, file in [('r9', 'ass-identified-return-r9-music.wav'), ('r8', 'r8-control.wav')]:
            records.append(helper.excerpt(AUTHOR / file, AUTHOR / f'{name}-{revision}.wav', start, end))
    (AUTHOR / 'review-excerpts.json').write_text(json.dumps({'revision': 'identified-return-r9',
        'excerpts': records, 'comparison': 'Equal source-frame intervals and 20 ms edge fades. No separate gain change.'}, indent=2) + '\n')
    rpp = (PRIOR / 'Identified-Return-r8.RPP').read_text(encoding='utf-8').replace('r8', 'r9')
    (AUTHOR / 'Identified-Return-r9.RPP').write_text(rpp, encoding='utf-8')
    script = (ROOT / 'src/track-review-r8.js').read_text().replace('foxdot-operator-r8', 'foxdot-percussion-r9').replace('Harmony entry', 'Percussion response')
    (ROOT / 'src/track-review-r9.js').write_text(script, encoding='utf-8')
    page = (ROOT / 'track-review-r8.html').read_text()
    page = page.replace('track-review-r8.js', 'track-review-r9.js').replace('foxdot-operator-r8', 'foxdot-percussion-r9')
    page = page.replace('music review r8', 'music review r9').replace('Return r8', 'Return r9')
    page = page.replace('Compare the new mix with the r7 foundation.', 'Compare the stronger percussion with the r8 mix.')
    first, last = page.index('<select id="track">'), page.index('</select>') + len('</select>')
    page = page[:first] + '''<select id="track">
<optgroup label="Full tracks"><option value="ass-identified-return-r9-music.wav" data-full="true">r9 / stronger percussion</option><option value="r8-control.wav" data-full="true">r8 / previous percussion level</option></optgroup>
<optgroup label="Short comparisons"><option value="percussion-r9.wav">Percussion response / r9</option><option value="percussion-r8.wav">Percussion response / r8</option><option value="break-return-r9.wav">Break and return / r9</option><option value="break-return-r8.wav">Break and return / r8</option></optgroup>
<optgroup label="Percussion alone"><option value="mechanical-response.wav" data-full="true" data-start="20">Added percussion / r9</option><option value="r8-percussion-control.wav" data-full="true" data-start="20">Added percussion / r8</option></optgroup>
</select>''' + page[last:]
    page = page.replace('data-time="21.5325373134">Harmony', 'data-time="20.3534328358">Response')
    page = page.replace('ass-identified-return-r8-music.wav', 'ass-identified-return-r9-music.wav')
    page = page.replace('foundation-control.wav', 'r8-control.wav').replace('Download r8 WAV', 'Download r9 WAV')
    page = page.replace('Download foundation WAV', 'Download r8 comparison WAV')
    page = page.replace('break-return-r8.wav" download>Download short r8 comparison', 'percussion-r9.wav" download>Download short r9 comparison')
    first, last = page.index('<section aria-labelledby="changes-heading">'), page.index('</section>', page.index('<section aria-labelledby="changes-heading">')) + len('</section>')
    page = page[:first] + '''<section aria-labelledby="changes-heading"><h2 id="changes-heading">One controlled change</h2><p>The added mechanical percussion is 10 dB higher. The harmony, bass movement, original drum timing, and room processing retain their r8 settings.</p><p>Use Response to hear the three-hit pattern before the harmony entry. Use Return to hear the stronger percussion with the full pulse.</p></section>''' + page[last:]
    first, last = page.index('<details>'), page.index('</details>') + len('</details>')
    page = page[:first] + '''<details><summary>Comparison limits</summary><p>The r8 control is an unchanged copy of the track from the previous review. Both versions use a final output gain of 1.</p><p>The short clips use equal source-frame intervals and edge fades. They receive no separate gain adjustment.</p><p>The isolated percussion retains its mix level. These files start near the response so you can compare the gain change.</p><p>The full track includes its ending. It is not a seamless loop. Human listening must determine whether the percussion is distinct enough.</p></details>''' + page[last:]
    (ROOT / 'track-review-r9.html').write_text(page, encoding='utf-8')
    browser = (ROOT / 'tools/track-review-r8-browser.mjs').read_text()
    for old, new in [('track-review-r8', 'track-review-r9'), ('identified-return-r8', 'identified-return-r9'),
                     ('stc-study-r8', 'stc-study-r9'), ('ass-identified-return-r8-music.wav', 'ass-identified-return-r9-music.wav'),
                     ('foundation-control.wav', 'r8-control.wav')]:
        browser = browser.replace(old, new)
    (ROOT / 'tools/track-review-r9-browser.mjs').write_text(browser, encoding='utf-8')
    print(json.dumps({'excerpts': len(records), 'controls': 'Unchanged copies of r8', 'player': 'track-review-r9.html'}, indent=2))


if __name__ == '__main__':
    main()
