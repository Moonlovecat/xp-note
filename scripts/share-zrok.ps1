param(
  [string]$Name = $(if ($env:ZROK2_NAME) { $env:ZROK2_NAME } else { "weenaireview" }),
  [string]$Namespace = $(if ($env:ZROK2_NAMESPACE) { $env:ZROK2_NAMESPACE } else { "public" }),
  [string]$Target = $(if ($env:ZROK_TARGET) { $env:ZROK_TARGET } else { "http://localhost:3000" }),
  [string]$BackendMode = $(if ($env:ZROK_BACKEND_MODE) { $env:ZROK_BACKEND_MODE } else { "proxy" }),
  [string]$AccountToken = $env:ZROK2_ACCOUNT_TOKEN,
  [switch]$PromptForToken,
  [switch]$CreateName,
  [switch]$SkipCreateName,
  [switch]$CleanExistingShare,
  [switch]$RestartOnExit,
  [int]$RestartDelaySeconds = 5
)

$ErrorActionPreference = "Stop"

function Resolve-Zrok2 {
  $cmd = Get-Command zrok2 -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd.Source
  }

  $local = Join-Path $PSScriptRoot "..\.tools\zrok2\zrok2.exe"
  if (Test-Path $local) {
    return (Resolve-Path $local).Path
  }

  throw "zrok2 CLI is required. Run: powershell -ExecutionPolicy Bypass -File .\scripts\install-zrok2.ps1"
}

function Read-AccountToken {
  $secureToken = Read-Host "Enter zrok2 account token" -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)

  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

function Remove-ExistingShare {
  param(
    [string]$Endpoint,
    [string]$ExpectedTarget
  )

  $json = & $zrok2 list shares --json --target $ExpectedTarget
  if ($LASTEXITCODE -ne 0) {
    throw "Unable to list zrok shares before cleanup."
  }

  $result = $json | ConvertFrom-Json
  $shares = @($result.shares | Where-Object {
    $_.shareMode -eq "public" -and
    $_.target -eq $ExpectedTarget -and
    @($_.frontendEndpoints) -contains $Endpoint
  })

  foreach ($share in $shares) {
    Write-Host "Deleting existing zrok share '$($share.shareToken)' for $Endpoint" -ForegroundColor Yellow
    & $zrok2 delete share $share.shareToken
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to delete existing zrok share '$($share.shareToken)'."
    }
  }
}

$zrok2 = Resolve-Zrok2
$environmentFile = Join-Path $HOME ".zrok2\environment.json"

if (-not (Test-Path $environmentFile)) {
  if (-not $AccountToken -and $PromptForToken) {
    $AccountToken = Read-AccountToken
  }

  if (-not $AccountToken) {
    throw "zrok2 is not enabled. Run this script with -PromptForToken, or set `$env:ZROK2_ACCOUNT_TOKEN in PowerShell first."
  }

  & $zrok2 enable $AccountToken --headless
  if ($LASTEXITCODE -ne 0) {
    throw "zrok2 enable failed."
  }
}

if ($CreateName -and -not $SkipCreateName) {
  & $zrok2 create name -n $Namespace $Name
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Name creation did not complete. If '${Namespace}:${Name}' already exists in your account, this is safe to ignore." -ForegroundColor Yellow
  }
}

$nameSelector = "${Namespace}:${Name}"
$endpoint = "$Name.shares.zrok.io"

if ($CleanExistingShare) {
  Remove-ExistingShare -Endpoint $endpoint -ExpectedTarget $Target
}

if ($Namespace -eq "public") {
  Write-Host "Starting zrok public share: https://$endpoint -> $Target"
} else {
  Write-Host "Starting zrok public share for ${nameSelector} -> $Target"
}

$shareArgs = @(
  "share",
  "public",
  $Target,
  "-n",
  $nameSelector,
  "--backend-mode",
  $BackendMode,
  "--headless"
)

do {
  & $zrok2 @shareArgs
  $exitCode = $LASTEXITCODE

  if ($RestartOnExit) {
    Write-Host "zrok exited with code $exitCode. Restarting in $RestartDelaySeconds seconds. Press Ctrl+C to stop." -ForegroundColor Yellow
    Start-Sleep -Seconds $RestartDelaySeconds
  }
} while ($RestartOnExit)

exit $exitCode
