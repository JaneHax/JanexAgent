param()
$ErrorActionPreference = 'Stop'

Write-Host "Deploying Janex..."

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Error: Node.js not found"
  exit 1
}

Write-Host "Building..."
npm run build

Write-Host "Linking..."
npm link

Write-Host "Deploy complete!"
