$ErrorActionPreference = "Stop"
Write-Host "FEDGE 2.O Bot Health Check"
Write-Host "=========================="
$requiredFiles = @("package.json",".env","fedge-bot.js")
$missing = @()
foreach ($f in $requiredFiles) { if (-not (Test-Path -LiteralPath $f)) { $missing += $f } }
if ($missing.Count -gt 0) { Write-Host "❌ Missing required files: $($missing -join ', ')"; exit 1 }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Host "❌ Node.js not found in PATH"; exit 1 }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { Write-Host "❌ npm not found in PATH"; exit 1 }
$nodeVersion = [version]((node -v).TrimStart('v'))
if ($nodeVersion -lt [version]"22.12.0") { Write-Host "❌ Node $nodeVersion is too old. Install Node.js 22.12 or newer."; exit 1 }
Write-Host "✅ Node: $(node -v)"
Write-Host "✅ npm: $(npm -v)"
if (Test-Path -LiteralPath "node_modules") { Write-Host "✅ node_modules exists" } else { Write-Host "⚠️ node_modules missing (run npm install)" }
if (-not (Select-String -LiteralPath ".env" -Pattern '^\s*GEMINI_API_KEY\s*=\s*\S' -Quiet)) { Write-Host "❌ GEMINI_API_KEY is not set in .env"; exit 1 }
Write-Host "✅ GEMINI_API_KEY is set"
if (-not (Select-String -LiteralPath ".env" -Pattern '^\s*FEDGE_ADMINS\s*=\s*\S' -Quiet)) { Write-Host "⚠️ FEDGE_ADMINS is empty: VIDEO and private memory are off for everyone" }
Write-Host "`nRunning syntax check on fedge-bot.js..."
node --check fedge-bot.js
Write-Host "✅ fedge-bot.js syntax is valid"
Write-Host "`nHealth check complete. Try: npm run start"
