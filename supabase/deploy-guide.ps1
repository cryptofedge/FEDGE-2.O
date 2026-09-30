# FEDGE 2.O - put the "Ask FEDGE" AI guide online (one time, then again whenever you change it).
# Run from PowerShell:
#   powershell -ExecutionPolicy Bypass -File "$HOME\FEDGE-2.O-push\supabase\deploy-guide.ps1"
$ErrorActionPreference = 'Continue'
$repo = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $repo
function Step($m) { Write-Host "`n==> $m" -ForegroundColor Cyan }

# Read SUPABASE_URL and GEMINI_API_KEY from .env
$envVals = @{}
if (Test-Path .env) { Get-Content .env | ForEach-Object { if ($_ -match '^\s*([A-Z_]+)\s*=\s*(.*)$') { $envVals[$matches[1]] = $matches[2].Trim().Trim('"').Trim("'") } } }
$url = $envVals['SUPABASE_URL']
if (-not $url) { $url = Read-Host "Paste your Supabase project URL (https://xxxx.supabase.co)" }
if ($url -notmatch 'https://([a-z0-9]+)\.supabase\.co') { Write-Host "That doesn't look like a Supabase URL." -ForegroundColor Red; exit 1 }
$ref = $matches[1]
$gem = $envVals['GEMINI_API_KEY']
if (-not $gem) { $gem = Read-Host "Paste your Gemini API key (from aistudio.google.com)" }

Step "Logging in to Supabase (a browser window opens - approve it)"
npx --yes supabase login

Step "Uploading the AI guide to project $ref"
npx --yes supabase functions deploy fedge-guide --project-ref $ref --no-verify-jwt --use-api
if ($LASTEXITCODE -ne 0) { Write-Host "Deploy failed - copy the red text above to Claude" -ForegroundColor Red; exit 1 }

Step "Saving the Gemini key on the server (it never goes in the web page)"
$tmp = New-TemporaryFile
Set-Content -Path $tmp -Value "GEMINI_API_KEY=$gem" -NoNewline
npx --yes supabase secrets set --env-file $tmp --project-ref $ref
Remove-Item $tmp -Force

$fn = "https://$ref.supabase.co/functions/v1/fedge-guide"
Step "Testing FEDGE"
try {
  $body = @{ stop = 'credit'; player = 'Test'; messages = @(@{ role = 'user'; text = 'In one sentence, what is the biggest part of a FICO score?' }) } | ConvertTo-Json -Depth 4
  $r = Invoke-RestMethod -Uri $fn -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 60
  Write-Host "    FEDGE says: $($r.reply)$($r.error)" -ForegroundColor Green
} catch { Write-Host "    Test call failed: $($_.Exception.Message)" -ForegroundColor Yellow }

Step "Switching on live chat in the journey page"
$page = Join-Path $repo 'docs\journey\index.html'
$html = [IO.File]::ReadAllText($page)
$html = [regex]::Replace($html, 'window\.FEDGE_GUIDE_URL = "[^"]*";', "window.FEDGE_GUIDE_URL = `"$fn`";")
[IO.File]::WriteAllText($page, $html, (New-Object System.Text.UTF8Encoding($false)))
git add docs/journey/index.html
git commit -q -m "Journey: switch on live Ask FEDGE chat"
git push -q origin main
if ($LASTEXITCODE -eq 0) { Write-Host "`nDone. Live chat is on at https://fedge2o.com/journey/ in about a minute." -ForegroundColor Green }
else { Write-Host "Push failed - copy the red text above to Claude" -ForegroundColor Red }
