$ErrorActionPreference = "Stop"
Write-Host "FEDGE 2.O Bot Health Check"
Write-Host "=========================="
$requiredFiles = @("package.json",".env","index.js")
$missing = @()
foreach ($f in $requiredFiles) { if (-not (Test-Path -LiteralPath $f)) { $missing += $f } }
if ($missing.Count -gt 0) { Write-Host "❌ Missing required files: $($missing -join ', ')"; exit 1 }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Host "❌ Node.js not found in PATH"; exit 1 }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { Write-Host "❌ npm not found in PATH"; exit 1 }
Write-Host "✅ Node: $(node -v)"
Write-Host "✅ npm: $(npm -v)"
if (Test-Path -LiteralPath "node_modules") { Write-Host "✅ node_modules exists" } else { Write-Host "⚠️ node_modules missing (run npm install)" }
Write-Host "`nRunning syntax check on index.js..."
node --check index.js
Write-Host "✅ index.js syntax is valid"
Write-Host "`nHealth check complete. Try: npm run start"
