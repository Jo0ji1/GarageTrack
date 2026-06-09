# Changelog

Todas as mudanças notáveis serão documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Unreleased]
### Adicionado
- **Sync bidirecional**: o "Sincronizar agora" agora também aplica os dados recebidos da nuvem no SQLite local (`applyRemoteData` em `useGarageTrack`), fazendo merge de veículos (mantém a maior quilometragem) e registros de manutenção. Antes o pull baixava os dados mas não os persistia localmente.

### Alterado
- **Reorganização de docs**: entregáveis acadêmicos movidos para `docs/academico/`; material de origem (PDFs, atividades) em `docs/academico/material-origem/`. Docs de engenharia (`ARCHITECTURE`, `SECURITY`, `ROADMAP`, `RUNBOOK`, `SUPABASE`) permanecem em `docs/`.

## [1.3.0] — 2026-Q2
### Adicionado
- **Sincronização na nuvem (Supabase)**: cliente em `src/services/supabaseClient.ts`, helpers `cloudSync.ts` (signIn/signUp/signOut, pushVehicles, pushRecords, pullVehicles, pullRecords, syncAll) e `CloudContext` global.
- **Tela "Conta na nuvem"** integrada em `SettingsScreen` (`AccountSection`): login/cadastro por e-mail, status da sessão, "Sincronizar agora", sair.
- **Migrações Supabase** (`supabase/migrations/*.sql`): tabelas `profiles`, `vehicles`, `maintenance_records`, `attachments` com RLS por `auth.uid()`; trigger `handle_new_user`; policies de storage para bucket `attachments`.
- **`app.config.js`** substitui `app.json`: lê `EXPO_PUBLIC_*` via `dotenv`; chave do Google Maps fica em `.env` e nunca mais é commitada.
- `.env.example` documentando todas as variáveis (Maps, Supabase, OAuth).
- `eas.json` (perfis development/preview/production) e script `npm run build:apk`.
- `scheme: garagetrack` para deep links e OAuth.
- `android.package`, `ios.bundleIdentifier` definidos como `com.garagetrack.app`.
- `android.allowBackup=false` (mitigação T5 do threat model).
- Documentação completa: `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/ROADMAP.md`, `docs/RUNBOOK.md`, `docs/SUPABASE.md`.
- README principal com badges, `CONTRIBUTING.md`, templates de Issue/PR, workflow CI (typecheck em PRs).

### Alterado
- **Acentuação pt-BR** restaurada em ~90 termos em 8 arquivos: `data/database.ts`, `data/useGarageTrack.ts`, `domain/maintenanceRules.ts`, `domain/models.ts`, `domain/validation.ts`, `presentation/screens/ReportProblemScreen.tsx`, `presentation/GarageTrackApp.tsx`, `services/nativeCapabilities.ts` (Início, Saúde, Manutenção, Localização, serviço, veículo, etc.).
- Versão do app passa para `1.3.0` em `app.config.js` e rodapé de Configurações.

### Segurança
- Removida `app.json` do repositório (chave do Google Maps ia plain text). Substituída por `app.config.js` + `.env` (gitignored).
- ⚠️ **Ação manual obrigatória**: rotacionar a Google Maps Android key no Google Cloud Console — a anterior está no histórico do git (commits `30b433c`, `5568834`, `e540c6d`, `764c736`). Veja [docs/SECURITY.md](docs/SECURITY.md#rotação-de-chaves).
- `.gitignore` reforçado: `.env*`, `*.apk`, `*.aab`, `*.ipa`, `build/`, `.vscode`, `.idea`, `*.log`.

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
