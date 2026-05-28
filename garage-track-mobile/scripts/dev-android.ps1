# GarageTrack — boot do app no emulador Android (solucao permanente).
#
# Problema raiz no Windows:
#   - `expo start --localhost` faz o Metro escutar em "localhost", que o Node
#     22+ resolve para ::1 (IPv6) primeiro. Mas `adb reverse` so roteia IPv4.
#   - Resultado: Metro vivo, adb reverse aplicado, mas o emulador nao conecta
#     -> "Failed to download remote update".
#
# Solucao:
#   - Forcar IPv4 no Node via NODE_OPTIONS=--dns-result-order=ipv4first
#   - Servir o Metro em 127.0.0.1
#   - Aplicar adb reverse e abrir Expo Go em exp://127.0.0.1:8081
#
# Uso:
#   npm run dev:android
#
# O script:
#   1) garante que ha emulador conectado
#   2) mata Metro orfao na 8081
#   3) aplica adb reverse
#   4) inicia um job em background que vai detectar o Metro subir e abrir o Expo Go
#   5) sobe o Metro no terminal atual em foreground (Ctrl+C para parar)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "==> Verificando adb..." -ForegroundColor Cyan
if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
  Write-Error "adb nao encontrado no PATH."
  exit 1
}

Write-Host "==> Verificando emulador..." -ForegroundColor Cyan
$tries = 0
$devices = $null
while ($tries -lt 30) {
  $devices = & adb devices | Select-String "device$"
  if ($devices) { break }
  Start-Sleep -Seconds 1
  $tries++
}
if (-not $devices) {
  Write-Error "Nenhum emulador conectado. Abra o AVD primeiro: emulator -avd Pixel_7"
  exit 1
}
Write-Host "    Dispositivo OK." -ForegroundColor Green

Write-Host "==> Liberando porta 8081 se necessario..." -ForegroundColor Cyan
$conns = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
if ($conns) {
  $procIds = $conns | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($targetPid in $procIds) {
    try {
      $proc = Get-Process -Id $targetPid -ErrorAction Stop
      Write-Host "    Matando processo orfao $($proc.ProcessName) PID=$targetPid" -ForegroundColor Yellow
      Stop-Process -Id $targetPid -Force
    } catch { }
  }
  Start-Sleep -Seconds 2
}

Write-Host "==> Aplicando adb reverse 8081..." -ForegroundColor Cyan
& adb reverse tcp:8081 tcp:8081 | Out-Null

Write-Host "==> Agendando reabertura do Expo Go (background job)..." -ForegroundColor Cyan
$bgJob = Start-Job -ScriptBlock {
  for ($i = 0; $i -lt 120; $i++) {
    Start-Sleep -Seconds 1
    try {
      $r = Invoke-WebRequest -Uri "http://127.0.0.1:8081/status" -TimeoutSec 2 -UseBasicParsing
      if ($r.StatusCode -eq 200) {
        & adb reverse tcp:8081 tcp:8081 | Out-Null
        & adb shell am force-stop host.exp.exponent 2>$null | Out-Null
        Start-Sleep -Milliseconds 500
        & adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081" host.exp.exponent | Out-Null
        return "Expo Go reaberto em exp://127.0.0.1:8081"
      }
    } catch { }
  }
  return "Timeout esperando Metro."
}

# Forca Node a resolver localhost como IPv4 primeiro (Node 22 padrao = IPv6).
$env:NODE_OPTIONS = "--dns-result-order=ipv4first"
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "127.0.0.1"
$env:EXPO_DEVTOOLS_LISTEN_ADDRESS = "127.0.0.1"

Set-Location $projectRoot

Write-Host ""
Write-Host "==> Iniciando Metro (Ctrl+C para parar)..." -ForegroundColor Cyan
Write-Host "    Assim que aparecer 'Metro: exp://127.0.0.1:8081', o app reabrira sozinho." -ForegroundColor Gray
Write-Host ""

try {
  & npx expo start --localhost
} finally {
  Write-Host ""
  Write-Host "==> Limpando job em background..." -ForegroundColor Cyan
  if ($bgJob) {
    $bgResult = Receive-Job -Job $bgJob -ErrorAction SilentlyContinue
    if ($bgResult) { Write-Host "    $bgResult" -ForegroundColor Gray }
    Remove-Job -Job $bgJob -Force -ErrorAction SilentlyContinue
  }
}
