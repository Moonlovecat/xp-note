param(
  [string]$InstallDir = $(Join-Path $PSScriptRoot "..\.tools\zrok2")
)

$ErrorActionPreference = "Stop"

$release = Invoke-RestMethod "https://api.github.com/repos/openziti/zrok/releases/latest"
$asset = $release.assets |
  Where-Object { $_.name -match "^zrok_.*_windows_amd64\.tar\.gz$" } |
  Select-Object -First 1

if (-not $asset) {
  throw "Could not find a Windows amd64 zrok2 release asset."
}

$checksums = $release.assets |
  Where-Object { $_.name -eq "checksums.sha256.txt" } |
  Select-Object -First 1

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

$archivePath = Join-Path $InstallDir $asset.name
$checksumPath = Join-Path $InstallDir "checksums.sha256.txt"

Write-Host "Downloading $($asset.name)..."
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $archivePath

if ($checksums) {
  Invoke-WebRequest -Uri $checksums.browser_download_url -OutFile $checksumPath
  $expected = Get-Content $checksumPath |
    Where-Object { $_ -match [regex]::Escape($asset.name) } |
    ForEach-Object { ($_ -split "\s+")[0] } |
    Select-Object -First 1

  if ($expected) {
    $actual = (Get-FileHash -Algorithm SHA256 $archivePath).Hash.ToLowerInvariant()
    if ($actual -ne $expected.ToLowerInvariant()) {
      throw "Checksum mismatch for $($asset.name)."
    }
  }
}

tar -xf $archivePath -C $InstallDir

$zrok2 = Get-ChildItem -Path $InstallDir -Recurse -Filter "zrok2.exe" |
  Select-Object -First 1

if (-not $zrok2) {
  throw "zrok2.exe was not found in the release archive."
}

if ($zrok2.DirectoryName -ne (Resolve-Path $InstallDir).Path) {
  Copy-Item -LiteralPath $zrok2.FullName -Destination (Join-Path $InstallDir "zrok2.exe") -Force
}

Write-Host "Installed zrok2 to $(Join-Path (Resolve-Path $InstallDir).Path "zrok2.exe")"
Write-Host "Next: get an account token from zrok.io, then run:"
Write-Host "  `$env:ZROK2_ACCOUNT_TOKEN='your_account_token'"
Write-Host "  powershell -ExecutionPolicy Bypass -File .\scripts\share-zrok.ps1"
