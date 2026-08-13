@echo off
rem Link WhatsApp to OpenClaw with a phone-number pairing code instead of a QR.
rem Writes Baileys auth state into the folder @openclaw/whatsapp reads.
rem Usage: pair-whatsapp.cmd [digits-only-phone] [creds-dir]
setlocal
set "PAIRDIR=%~dp0tools\whatsapp-pair"
set "PHONE=%~1"
if "%PHONE%"=="" set "PHONE=19177278063"

if not exist "%PAIRDIR%\node_modules" (
  echo Installing pairing dependencies...
  pushd "%PAIRDIR%" && call npm install --no-audit --no-fund && popd
)

echo Have WhatsApp open at: Settings ^> Linked devices ^> Link a device ^> Link with phone number instead
echo Pairing %PHONE% ... code appears in a few seconds.
echo Leave this window open until it prints PAIRED - the 515 restart in between is normal.
echo.
node "%PAIRDIR%\pair-whatsapp.js" %PHONE% %2
echo.
pause
