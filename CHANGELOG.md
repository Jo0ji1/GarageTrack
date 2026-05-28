# Changelog

Todas as mudanças notáveis serão documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Unreleased]
### Adicionado
- `eas.json` (profiles dev/preview/production) e script `npm run build:apk`.
- `scheme: garagetrack` em `app.json` para deep links e OAuth (preparação v1.3).
- `android.package`, `ios.bundleIdentifier` definidos.
- `googleMaps.apiKey` placeholder para builds standalone.
- `android.allowBackup=false` (T5 do threat model).
- Documentação completa: `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/ROADMAP.md`, `docs/RUNBOOK.md`, `docs/SUPABASE.md`.
- README principal com badges e links de navegação.
- `CONTRIBUTING.md`, templates de Issue/PR, workflow CI (`typecheck` em PRs).

### Corrigido
- Chips de veículos cresciam verticalmente nas telas Registrar/Problema (faltava trava de altura no `ScrollView` horizontal e contenção de overflow no texto).
- `tabRail` agora tem altura travada (evita esticar quando irmãos usam `flex:1`).

## [1.2.0] — 2026-Q1
### Adicionado
- Busca real de oficinas via OpenStreetMap Overpass (`src/services/workshopsApi.ts`).
- Script `scripts/dev-android.ps1` (Windows): IPv4 enforcement + adb reverse + Expo Go.
- Script `scripts/reconnect.ps1` para reconexão rápida.
- Categorias e oficinas em grid wrap (`chipGrid`) no formulário de manutenção.
- `ModalHeader` para tela Configurações.

### Corrigido
- Metro escutando `::1:8081` (IPv6) quebrava `adb reverse` no Windows + Node 20+.

## [1.1.0]
### Adicionado
- `AuthContext` + `AuthGate` com PIN, biometria, lockout exponencial, auto-lock 60s.
- `ThemeContext` com persistência (`AsyncStorage`).
- `ErrorBoundary` global.
- Backup criptografado export/import (XOR keystream sobre SHA-256 derivado).
- `validateMaintenanceDraft` em domain.
- `SettingsScreen`, `ReportProblemScreen`.
- Transações SQLite em escritas multi-tabela.

## [1.0.0]
### Adicionado
- Cadastro de veículos (carro/moto), manutenções, alertas, mapa local.
- SQLite com WAL + FTS5.
