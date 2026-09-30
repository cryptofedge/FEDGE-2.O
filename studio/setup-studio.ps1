# FEDGE 2.O Studio — one-time setup on Windows.
# Installs OpenMontage next to FEDGE (in your home folder) plus the tools it needs.
# Run from PowerShell:
#   powershell -ExecutionPolicy Bypass -File "$HOME\FEDGE-2.O-push\studio\setup-studio.ps1"
$ErrorActionPreference = 'Continue'
function Step($m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "    $m" -ForegroundColor Green }
function Warn($m) { Write-Host "    $m" -ForegroundColor Yellow }
function RefreshPath { $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User') }
function Need($cmd, $wingetId, $label) {
  if (Get-Command $cmd -ErrorAction SilentlyContinue) { Ok "$label found"; return }
  Warn "$label missing - installing with winget..."
  winget install --id $wingetId -e --accept-source-agreements --accept-package-agreements --silent
  RefreshPath
  if (Get-Command $cmd -ErrorAction SilentlyContinue) { Ok "$label installed" } else { Warn "$label still not found. Close PowerShell, reopen it, and run this script again." }
}

$fedge = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$om    = if ($env:OPENMONTAGE_DIR) { $env:OPENMONTAGE_DIR } else { Join-Path $HOME 'OpenMontage' }

Step "Checking tools"
Need git     'Git.Git'            'Git'
Need node    'OpenJS.NodeJS.LTS'  'Node.js'
Need python  'Python.Python.3.12' 'Python'
Need ffmpeg  'Gyan.FFmpeg'        'FFmpeg'

Step "Getting OpenMontage -> $om"
if (Test-Path (Join-Path $om '.git')) { git -C $om pull -q; Ok "updated" }
else { git clone -q https://github.com/calesthio/OpenMontage.git $om; Ok "downloaded" }

Step "Installing OpenMontage's Python tools (a few minutes the first time)"
$py = Join-Path $om '.venv\Scripts\python.exe'
if (-not (Test-Path $py)) { python -m venv (Join-Path $om '.venv') }
& $py -m pip install -q --upgrade pip
& $py -m pip install -q -r (Join-Path $om 'requirements.txt')
& $py -m pip install -q piper-tts
Ok "Python tools ready"

Step "Downloading the free Piper voice (backup for when there's no ElevenLabs key)"
$voices = Join-Path $om '.piper-voices'
New-Item -ItemType Directory -Force $voices | Out-Null
if (-not (Test-Path (Join-Path $voices 'en_US-ryan-high.onnx'))) { & $py -m piper.download_voices --download-dir $voices en_US-ryan-high }
if (Test-Path (Join-Path $voices 'en_US-ryan-high.onnx')) { Ok "voice ready" } else { Warn "voice download failed - videos will use ElevenLabs or captions only" }

Step "Installing the video renderer (Remotion)"
Push-Location (Join-Path $om 'remotion-composer')
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { Warn "npm install failed, retrying the Windows way..."; npx --yes npm install --no-audit --no-fund }
Pop-Location
Ok "renderer ready"

Step "Linking FEDGE to OpenMontage"
$envFile = Join-Path $fedge '.env'
if (-not (Test-Path $envFile)) { New-Item -ItemType File $envFile | Out-Null }
$envText = Get-Content $envFile -Raw -ErrorAction SilentlyContinue
if ($envText -notmatch '(?m)^OPENMONTAGE_DIR=') { Add-Content $envFile "`nOPENMONTAGE_DIR=$om"; Ok "added OPENMONTAGE_DIR to .env" } else { Ok "OPENMONTAGE_DIR already in .env" }
if ($envText -notmatch '(?m)^FEDGE_ADMINS=') { Add-Content $envFile "FEDGE_ADMINS="; Warn "Add your WhatsApp number to FEDGE_ADMINS in .env (digits only, e.g. 19175551234) to use VIDEO from WhatsApp" }

Step "Recording gameplay clips of all 6 games (about 2 minutes)"
Push-Location $fedge
if (-not (Test-Path (Join-Path $fedge 'node_modules\playwright'))) { npm install --no-audit --no-fund }
npx --yes playwright install chromium
node studio\capture_gameplay.js
Pop-Location

Step "Test render: TradeStreet promo"
Push-Location $fedge
python studio\render_promo.py tradestreet
Pop-Location
$out = Join-Path $fedge 'studio\renders\tradestreet.mp4'
if (Test-Path $out) { Ok "SUCCESS - opening $out"; Start-Process $out } else { Warn "Test render failed - copy the red text above to Claude" }
