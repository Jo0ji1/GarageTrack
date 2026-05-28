# Runbook — GarageTrack

Guia prático para desenvolvedores e mantenedores.

## 1. Setup de ambiente (Windows)

```powershell
# Node 20+ (recomendado via nvm-windows)
node --version

# Android Studio + Pixel_7_API_34 emulator
# Adicionar platform-tools ao PATH (adb deve estar acessível)
adb --version

# Clone & install
git clone https://github.com/OWNER/GarageTrack.git
cd GarageTrack\garage-track-mobile
npm install --legacy-peer-deps
```

## 2. Rodar em emulador Android

```powershell
# 1) Inicie o emulador pela Android Studio (AVD Manager)
# 2) Rode:
npm run dev:android
```

O script `scripts/dev-android.ps1`:
- Verifica `adb` + emulador
- Mata Metro órfão na porta 8081
- Aplica `adb reverse tcp:8081 tcp:8081`
- Define `NODE_OPTIONS=--dns-result-order=ipv4first` e `REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1` (corrige IPv6/Node 20+)
- Agenda job que abre o Expo Go em `exp://127.0.0.1:8081` quando Metro estiver pronto
- Inicia o Metro no terminal atual

### Quando algo desconecta
```powershell
npm run reconnect
```
Reaplica `adb reverse` e reabre o Expo Go sem reiniciar o Metro.

## 3. Rodar em dispositivo físico

```powershell
# USB
adb devices
npm run dev:android   # mesmo script
```

Para Wi-Fi:
```powershell
adb tcpip 5555
adb connect <ip-do-celular>:5555
npm run start         # use o QR code do Expo Go
```

## 4. Build de APK público

Pré-requisitos: conta Expo e `eas-cli`:
```powershell
npm install -g eas-cli
eas login
```

Build preview (APK instalável):
```powershell
npm run build:apk
```

O artefato é gerado nos servidores Expo e o link de download aparece no terminal e em https://expo.dev/accounts/<você>/projects/garage-track-mobile/builds.

## 5. Variáveis de ambiente

| Variável | Onde | Uso |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `.env` / EAS Secrets | URL do projeto Supabase (v1.3) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `.env` / EAS Secrets | Anon key (segura por RLS) |
| `EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` | EAS Secrets | OAuth Google (v1.3) |

Variáveis `EXPO_PUBLIC_*` ficam visíveis no bundle JS — use apenas para valores que podem ser públicos (URLs e anon keys com RLS).

## 6. Troubleshooting

| Sintoma | Causa | Fix |
|---|---|---|
| `Failed to download remote update` no Expo Go | Metro em `::1` (IPv6) e `adb reverse` só fala IPv4 | Use `npm run dev:android` |
| Tela cinza no mapa | Provider Google sem Play Services no emulador | Use AVD com imagem "Google APIs" / "Google Play" |
| Localização sempre em Mountain View | GPS padrão do emulador | Em Extended Controls → Location, ajuste para sua cidade |
| `expo-notifications` warning em SDK 53+ | API remota removida do Expo Go | Esperado; ignorar em dev, irrelevante em build standalone |
| `EACCES adb` em macOS/Linux | Permissão USB | `sudo adb kill-server && sudo adb start-server` |

## 7. Checklist de release

1. `npm run typecheck` ✅
2. Smoke test no emulador (setup → cadastrar veículo → registrar manutenção → backup → restore)
3. Atualizar `CHANGELOG.md` e bump em `app.json` (`version`, `android.versionCode`)
4. `npm run build:apk`
5. Criar GitHub Release com APK anexado
6. Postar nota no README
