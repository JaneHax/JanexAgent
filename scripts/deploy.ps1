param(
  [string]$RepoDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [int]$BackendPort = 3001
)

$ErrorActionPreference = 'Stop'

function Info([string]$Message) { Write-Host "[✓] $Message" -ForegroundColor Green }
function Warn([string]$Message) { Write-Host "[!] $Message" -ForegroundColor Cyan }

Write-Host 'janex Deploy — sync repo + restart' -ForegroundColor Cyan
Write-Host ''

Set-Location $RepoDir

git pull --ff-only origin main
Info 'Repo synced'

try {
  npx tsc 2>$null
  Info 'Build OK'
} catch {
  Warn 'Build skipped (tsc not found or errors)'
}

try {
  pm2 delete janex-reddit-api *> $null
} catch {}

try {
  pm2 restart janex-agent --update-env *> $null
  Info 'PM2 restarted'
} catch {
  Warn 'PM2 janex-agent not running (run: pm2 start dist/index.js --name janex-agent)'
}

try {
  Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:$BackendPort/api/health" -TimeoutSec 5 | Out-Null
  Info 'Embedded Reddit API healthy'
} catch {
  Warn "Embedded Reddit API not responding on port $BackendPort"
}

Write-Host ''
Info 'Deploy complete — janex backend is synced and restarted'

