$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$manifest = Get-Content -LiteralPath (Join-Path $projectRoot 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$releaseRoot = Join-Path $projectRoot ('dist\itch\' + $manifest.version)
$stageRoot = Join-Path $releaseRoot 'web'
New-Item -ItemType Directory -Force -Path $stageRoot | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $stageRoot 'src') | Out-Null
$utf8 = New-Object System.Text.UTF8Encoding($false)
$html = Get-Content -LiteralPath (Join-Path $projectRoot 'index.html') -Raw -Encoding UTF8
$html = $html -replace '<a href="reference/v0.7/"[^>]*>.*?</a>', ''
[IO.File]::WriteAllText((Join-Path $stageRoot 'index.html'), $html, $utf8)
Copy-Item -LiteralPath (Join-Path $projectRoot 'style.css') -Destination $stageRoot
Copy-Item -LiteralPath (Join-Path $projectRoot 'NOTICE.txt') -Destination $stageRoot
Copy-Item -LiteralPath (Join-Path $projectRoot 'assets') -Destination $stageRoot -Recurse -Force
foreach ($file in Get-ChildItem -LiteralPath (Join-Path $projectRoot 'src') -Filter '*.js' -File) {
  $content = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
  if ($file.Name -eq 'app.js') {
    $content = $content.Replace("const testing = new URLSearchParams(location.search).get('test') === '1';", 'const testing = false;')
    $content = $content.Replace("development:testing||new URLSearchParams(location.search).has('lab')", 'development:false')
  }
  [IO.File]::WriteAllText((Join-Path (Join-Path $stageRoot 'src') $file.Name), $content, $utf8)
}
$zipPath = Join-Path $releaseRoot ('arrow-space-shift-' + $manifest.version + '-itch.zip')
Compress-Archive -LiteralPath (Join-Path $stageRoot 'index.html'),(Join-Path $stageRoot 'style.css'),(Join-Path $stageRoot 'NOTICE.txt'),(Join-Path $stageRoot 'src'),(Join-Path $stageRoot 'assets') -DestinationPath $zipPath -Force
Expand-Archive -LiteralPath $zipPath -DestinationPath (Join-Path $releaseRoot 'verified') -Force
$stream = [IO.File]::OpenRead($zipPath)
$sha = [Security.Cryptography.SHA256]::Create()
try { $hash = ([BitConverter]::ToString($sha.ComputeHash($stream))).Replace('-', '').ToLowerInvariant() }
finally { $stream.Dispose(); $sha.Dispose() }
$record = [ordered]@{game='Arrow Space Shift';version=$manifest.version;archive=$zipPath;sha256=$hash;bytes=(Get-Item -LiteralPath $zipPath).Length;publicTestInterface=$false;published=$false}
$record | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $releaseRoot 'package.json') -Encoding UTF8
$record | ConvertTo-Json
