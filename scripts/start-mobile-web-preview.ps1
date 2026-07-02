$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
$MobileRoot = Join-Path $Root 'apps\mobile'
$LogDir = Join-Path $Root '.runtime-logs'
$BackendPort = 8787
$WebPort = 8082
$BackendUrl = "http://127.0.0.1:$BackendPort"
$PreviewUrl = "http://localhost:$WebPort"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Find-CommandPath {
  param(
    [string] $PreferredPath,
    [string] $CommandName
  )

  if ($PreferredPath -and (Test-Path $PreferredPath)) {
    return $PreferredPath
  }

  $resolved = Get-Command $CommandName -ErrorAction SilentlyContinue
  if ($resolved) {
    return $resolved.Source
  }

  throw "Cannot find $CommandName. Please install Node.js first."
}

function Test-PortListening {
  param([int] $Port)
  return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Wait-HttpOk {
  param(
    [string] $Url,
    [int] $Seconds
  )

  $deadline = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $true
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  }

  return $false
}

$Node = Find-CommandPath -PreferredPath 'C:\Program Files\nodejs\node.exe' -CommandName 'node.exe'
$Npm = Find-CommandPath -PreferredPath 'C:\Program Files\nodejs\npm.cmd' -CommandName 'npm.cmd'

Write-Host 'Starting Bazi App browser preview...'

if (-not (Test-Path (Join-Path $MobileRoot 'node_modules'))) {
  Write-Host 'Installing mobile dependencies. This may take a few minutes...'
  Push-Location $MobileRoot
  try {
    & $Npm install
  } finally {
    Pop-Location
  }
}

if (-not (Test-PortListening -Port $BackendPort)) {
  $backendOut = Join-Path $LogDir 'one-click-backend.out.log'
  $backendErr = Join-Path $LogDir 'one-click-backend.err.log'
  Start-Process `
    -FilePath $Node `
    -ArgumentList 'backend\server.js' `
    -WorkingDirectory $Root `
    -RedirectStandardOutput $backendOut `
    -RedirectStandardError $backendErr `
    -WindowStyle Hidden | Out-Null
}

if (-not (Wait-HttpOk -Url "$BackendUrl/health" -Seconds 15)) {
  throw "Backend did not start. Check logs in $LogDir."
}

if (-not (Test-PortListening -Port $WebPort)) {
  $webOut = Join-Path $LogDir 'one-click-web.out.log'
  $webErr = Join-Path $LogDir 'one-click-web.err.log'
  $webCommand = "/c set EXPO_PUBLIC_BAZI_API_BASE_URL=$BackendUrl&& `"$Npm`" run web -- --host localhost --port $WebPort"
  Start-Process `
    -FilePath 'cmd.exe' `
    -ArgumentList $webCommand `
    -WorkingDirectory $MobileRoot `
    -RedirectStandardOutput $webOut `
    -RedirectStandardError $webErr `
    -WindowStyle Hidden | Out-Null
}

if (-not (Wait-HttpOk -Url $PreviewUrl -Seconds 45)) {
  throw "Web preview did not start. Check logs in $LogDir."
}

Start-Process $PreviewUrl

Write-Host ''
Write-Host 'Bazi App preview is ready.'
Write-Host "Open: $PreviewUrl"
Write-Host ''
Write-Host 'If the browser is already open, refresh the page.'
