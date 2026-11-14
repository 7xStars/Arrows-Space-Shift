# Incremental audiovisual event reader

The main campaign retains its event history.
The previous audiovisual reader checked every retained event on every frame.
It used a `WeakSet` to prevent repeated delivery.
The new reader keeps that identity filter and adds an array cursor.

For an append-only update, the reader checks the previous tail identity.
If that identity stays at its previous index, the reader starts after it.
An unchanged history therefore requires only two tail reads.
A new event does not require a scan of the older prefix.

If the array changes, shrinks, shifts, or rewinds in time, the reader scans it.
The existing `WeakSet` prevents repeated delivery during that scan.
A new simulation state starts a new reader generation.
Cleared arrays can receive new event objects normally.
Old objects in a reused array remain consumed.

The fast path relies on the current producers' append-only prefix contract.
It does not detect an arbitrary middle replacement that preserves the tail.
The game does not use that update form for these logs.
The change does not remove history or change `readFlight`.
It does not change event timing, forecasts, pause behavior, or collision state.
Grammar text remains unchanged.

## Checks

`node --test tests/av-events.test.mjs tests/structural-feedback.test.mjs tests/campaign-recorded-audio.test.mjs`

Result: 36 tests passed.

`npm run check`

Result: 297 tests passed; 72 syntax files passed.
The full log is `npm-check.log`.

The new tests count array index reads directly.
They do not use a timing threshold.
They cover 10,000 retained events and 1,000 unchanged reads.
They also cover append, bounded shift, clear/reuse, replacement, and time rewind.
Existing tests cover event order, forecasts, pause, stale records, and future records.

## Reader CPU benchmark

Command: `node reports/av-reader-incremental/benchmark.mjs`.

Both readers processed 10,000 events before timing started.
Each timed round then read the unchanged history 1,000 times.
The test used seven rounds and alternated reader order.
The baseline came from the preserved v0.25.0-dev.1 source copy on G:.

| Reader | Median time for 1,000 reads |
|---|---:|
| Previous full scan | 112.0706 ms |
| Incremental cursor | 0.0214 ms |

The complete measurements are in `benchmark.json`.
This is a synchronous JavaScript reader benchmark on this host.
It is not a frame-rate result.
It excludes rendering, physics, `readFlight` copies, native audio, and human perception.
Browser and packaged game checks remain separate evidence.
