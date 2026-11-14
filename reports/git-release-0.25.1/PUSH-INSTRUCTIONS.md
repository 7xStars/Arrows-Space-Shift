# Publish the prepared Git candidate

Status: preparation only. The local commit and bundle are not yet final.
The current Git connection cannot write to the repository.
No remote ref was changed.

The coordinator must supply the final commit hash before these instructions are used.
Use a Git credential that can write to `7xStars/Arrows-Space-Shift`.
Do not paste a password or access token into a project file or chat message.

## Existing isolated checkout

Open PowerShell.
Run these commands from the prepared checkout after the final commit is verified:

```powershell
Set-Location -LiteralPath 'G:\Music Projects\Arrow Space Shift\scratch\git-candidate-0.25.1'
git status --short
git log -1 --oneline candidate/0.25.1-dev.1
git fetch origin
if ($LASTEXITCODE -ne 0) { throw 'The remote fetch failed.' }
git merge-base --is-ancestor origin/main candidate/0.25.1-dev.1
if ($LASTEXITCODE -ne 0) { throw 'Remote main has changes that need review.' }
git push origin candidate/0.25.1-dev.1:refs/heads/main
if ($LASTEXITCODE -ne 0) { throw 'The source update was not published.' }
git ls-remote --heads origin main
```

Compare the returned remote hash with the final candidate commit hash.
If they differ, do not report the update as complete.
Do not force the push.
Do not reset or clean the original D: working tree.

## Bundle recovery

The final handoff will identify the verified incremental bundle and its SHA-256.
The incremental bundle requires the existing base commit:
`4a1d77e255db437602de68871d9a57c6f47ecc4d`.
The existing repository contains that commit.
Verify the bundle in a checkout that contains the base commit.
Fetch its candidate branch into that checkout.
Then use the same non-forced publication checks.

An incremental bundle is not an itch.io game archive.
A Git update does not submit the game to the jam.
