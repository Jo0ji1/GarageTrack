# GarageTrack — atalho para reconectar o Expo Go ao Metro local.
#
# Quando usar:
#   - Voce ja tem o Metro rodando (npm run start:local em outro terminal).
#   - O emulador esta aberto.
#   - O Expo Go esta mostrando "Failed to download remote update" ou tela
#     branca.
#
# O que faz:
#   1) Aplica `adb reverse tcp:8081 tcp:8081`
#   2) Mata o Expo Go atual
#   3) Reabre apontando para exp://127.0.0.1:8081
#
# Uso:
#   npm run reconnect

$ErrorActionPreference = 'Stop'

Write-Host "==> Verificando emulador..." -ForegroundColor Cyan
$devices = & adb devices | Select-String "device$"
if (-not $devices) {
  Write-Error "Nenhum emulador conectado."
  exit 1
}

Write-Host "==> Verificando Metro em 127.0.0.1:8081..." -ForegroundColor Cyan
try {
  $resp = Invoke-WebRequest -Uri "http://127.0.0.1:8081/status" -TimeoutSec 3 -UseBasicParsing
  if ($resp.StatusCode -ne 200) { throw "Metro respondeu $($resp.StatusCode)" }
} catch {
  Write-Host ""
  Write-Host "Metro NAO esta rodando em 127.0.0.1:8081." -ForegroundColor Red
  Write-Host "Em OUTRO terminal, rode primeiro:" -ForegroundColor Yellow
  Write-Host "  cd garage-track-mobile" -ForegroundColor Yellow
  Write-Host "  npm run start:local" -ForegroundColor Yellow
  Write-Host "Depois rode 'npm run reconnect' aqui de novo." -ForegroundColor Yellow
  exit 1
}
Write-Host "    Metro OK." -ForegroundColor Green

Write-Host "==> adb reverse..." -ForegroundColor Cyan
& adb reverse tcp:8081 tcp:8081 | Out-Null

Write-Host "==> Reabrindo Expo Go em exp://127.0.0.1:8081..." -ForegroundColor Cyan
& adb shell am force-stop host.exp.exponent 2>$null | Out-Null
Start-Sleep -Milliseconds 500
& adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081" host.exp.exponent | Out-Null

Write-Host ""
Write-Host "OK. Aguarde o bundle baixar no emulador." -ForegroundColor Green
