# Prepared Git candidate

Date: November 13, 2026.
Status: Local commit and verified bundle complete. Remote publication was not performed.
This final report supersedes the earlier preparation status in this folder.

## Candidate identity

Repository: `https://github.com/7xStars/Arrows-Space-Shift`.
Branch: `candidate/0.25.1-dev.1`.
Commit: `97c52a599e3653f1dcc97b60bc97d267dd9aa325`.
Parent: `4a1d77e255db437602de68871d9a57c6f47ecc4d`.
The parent is the earlier local and remote main commit.
The old history remains intact.

The prepared checkout is:
`G:/Music Projects/Arrow Space Shift/scratch/git-candidate-0.25.1`.
It has 1,662 tracked files. The selected working source was 335,019,182 bytes before Git text normalization.
The checkout was clean after the commit.
The original D: working tree was not reset, stashed, moved, or deleted.

The final source includes all runtime files, current tests, tools, documents,
editable art, encoded study assets, and audio authoring sources.
It includes all 81 campaign recordings and nine retained laboratory WAV assets.
Raw authoring and report WAVs remain in the complete SOURCE and master artifacts.
Private reference books, PDFs, credentials, caches, old ZIPs, local archives,
and imported historical folders are excluded from Git.
The prior code remains available in Git history.
No source license was added or changed.

## Verification

The final prepared checkout passed `npm run check`: 299 tests and 76 syntax files.
A separate fresh Git clone passed the same command with the same counts.
The fresh clone passed `node tools/export-pixel-assets.mjs --check` for all 109 PNG exports.
Its pixel-master source hash is:
`2e646f0e886ef3e8b7ba17650b747cac83cbd9241a7bde80f06e300adcb17ee1`.

The fresh runtime comparison passed for 242 files.
Binary files and the editable pixel master match exactly.
Three text files differ only by the declared CRLF-to-LF policy:
`READ-ME-FIRST.txt`, `hyperbolic-act.html`, and `src/campaign.js`.
There is no code or data difference in those normalized files.
`fresh-comparison.json` retains exact hashes and the normalization result.

The new source and tool count is 76.
The earlier count of 72 predates the later browser and report tools.
No old active source file was retained outside the current selection.
Old tracked files absent from the current selection were removed only from the isolated checkout.

Secret-pattern and forbidden-path scans returned no matches in the publication selection.
`git diff --check` reports whitespace in retained raw production logs and two final blank lines.
Those records were preserved. No functional check failed on the final candidate.

## Bundle

File:
`G:/Music Projects/Arrow Space Shift/releases/0.25.1-dev.1/Arrow-Space-Shift-v0.25.1-dev.1-GIT.bundle`.

Size: 280,898,982 bytes.
SHA-256: `3c3be8b76b6ed9d5c4413a657a8e4b85bb9849ede0c3c4333f86a645c6c86648`.

`git bundle verify` passed.
The bundle contains the candidate branch and requires parent commit `4a1d77e`.
It is an incremental bundle for the existing repository.
It is not the playable HTML5 ZIP or the complete SOURCE ZIP.
This report is external to its named commit. Its hash does not depend on a self-referential report.

## Publication access and next command

The GitHub connection reports no push permission.
The local noninteractive Git dry-run could not obtain a login.
No credential was read or requested. No remote ref was changed.
The final remote main check still returned the parent commit `4a1d77e`.

After write access is available, use the prepared checkout:

```powershell
Set-Location -LiteralPath 'G:\Music Projects\Arrow Space Shift\scratch\git-candidate-0.25.1'
git fetch origin
if ($LASTEXITCODE -ne 0) { throw 'The remote fetch failed.' }
git merge-base --is-ancestor origin/main candidate/0.25.1-dev.1
if ($LASTEXITCODE -ne 0) { throw 'Remote main has changes that need review.' }
git push origin candidate/0.25.1-dev.1:refs/heads/main
if ($LASTEXITCODE -ne 0) { throw 'The source update was not published.' }
git ls-remote --heads origin main
```

The returned remote hash must equal `97c52a599e3653f1dcc97b60bc97d267dd9aa325`.
Do not force the push.
The itch.io upload and jam submission remain separate actions.
The human acceptance and development-history limits remain in the candidate QA report.

The writing uses short sentences and consistent terms.
Full ASD-STE100 dictionary and editorial review is incomplete.
