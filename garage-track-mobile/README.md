# GarageTrack

Aplicativo mobile **offline-first** para gestão inteligente de manutenção de carros e motos. Registra histórico técnico, custo, quilometragem, oficina, GPS, fotos, áudio, peças, checklist contextual e calcula alertas preventivos por data e quilometragem.

> **Versão 1.2** — adiciona busca de oficinas reais em tempo real via OpenStreetMap (Overpass API), modal de Configurações dedicado (sem switcher/tabs), chips de categoria em grid flex-wrap.
>
> **Versão 1.1** — adiciona autenticação local (PIN + biometria), tema escuro, backup cifrado, validação estruturada de domínio, ErrorBoundary, telas Configurações e Reportar Problema, transações SQLite atômicas.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Expo SDK 56, React 19, React Native 0.85 |
| Linguagem | TypeScript estrito |
| Persistência | `expo-sqlite` (WAL, FKs ON, FTS5), `expo-secure-store`, AsyncStorage |
| Nativos | Location, ImagePicker, Audio, Maps (Google Provider), LocalAuthentication |
| Segurança | `expo-crypto` (SHA-256 + salt), Secure Store, biometria |
| Backup | `expo-file-system` + `expo-sharing` + cifragem stream XOR derivada de SHA-256 |
| UI | Lucide React Native, SafeAreaContext, tema light/dark/system |

---

## Como executar

### 1) Pré-requisitos
- Node 20+ (testado em 25.9)
- Android Studio com pelo menos um AVD criado (Pixel 7 + API 34 recomendado), **ou** Expo Go instalado num dispositivo físico
- `ANDROID_HOME` e `platform-tools`/`emulator` no PATH (Windows): consulte `docs/runbook-emulator.md` (se aplicável)

### 2) Instalar dependências e validar
```powershell
cd garage-track-mobile
npm install
npx expo install --check
npx tsc --noEmit
```

### 3) Rodar com emulador
```powershell
emulator -list-avds
emulator -avd Pixel_7_API_34          # em terminal separado
adb reverse tcp:8081 tcp:8081         # contorna firewall do Windows
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "127.0.0.1"
npx expo start --localhost
# então pressione 'a' para abrir no emulador
```

### 4) Rodar em dispositivo físico (modo tunnel)
```powershell
npx expo start --tunnel
# escaneie o QR code no Expo Go
```

---

## Arquitetura

```text
src/
├── data/                       Acesso a dados
│   ├── database.ts             Migração, PRAGMAs, seed
│   └── useGarageTrack.ts       Hook de leitura + escrita (transactional)
├── domain/                     Núcleo de regras de negócio (puro)
│   ├── models.ts               Entidades + tipos
│   ├── maintenanceRules.ts     Cálculo de saúde, checklist, formatos
│   └── validation.ts           Validação de drafts (zero deps)
├── services/                   Adaptadores de plataforma
│   ├── nativeCapabilities.ts   GPS, câmera, áudio (com fallbacks defensivos)
│   ├── workshopsApi.ts         Busca de oficinas reais via OSM Overpass
│   └── backup.ts               Export/import cifrado de snapshot
├── presentation/               UI
│   ├── App.tsx                 Composição: Providers + ErrorBoundary + AuthGate
│   ├── GarageTrackApp.tsx      Container + telas legacy (em modularização)
│   ├── ThemeContext.tsx        Tema light/dark/system persistido
│   ├── AuthContext.tsx         Sessão local + PIN + biometria
│   ├── AuthGate.tsx            Tela de setup + unlock
│   ├── ErrorBoundary.tsx       Captura de crash com retry
│   ├── theme.ts                Tokens (palette/spacing/radii/typography)
│   └── screens/
│       ├── SettingsScreen.tsx
│       └── ReportProblemScreen.tsx
```

### Princípios
- **Domínio puro**: `domain/` não importa nada de React Native ou SQLite. Testável em Node puro.
- **Adaptadores no `services/`**: capacidades nativas são abstraídas e degradam sem quebrar a UI (ex: notifications no Expo Go SDK 53+).
- **Apresentação reativa via Context**: tema e auth são providers; consumimos via `useTheme()`/`useAuth()`.
- **Transações atômicas**: escritas SQLite que envolvem múltiplas tabelas usam `db.withTransactionAsync`.

---

## Segurança

### Modelo de ameaças

| # | Ameaça | Mitigação | Status |
|---|---|---|---|
| T1 | Acesso físico ao device → leitura do banco | Gate de PIN/biometria + auto-lock após 60s em background | **Implementado** |
| T2 | Brute force no PIN | Lock-out progressivo (15s, 30s, 60s, 120s, 300s) a partir da 5ª tentativa | **Implementado** |
| T3 | Vazamento do PIN no storage | SHA-256 + salt aleatório por usuário, gravado em SecureStore (Keystore/Keychain) | **Implementado** |
| T4 | Perda do device → perda de dados | Export para arquivo cifrado com senha do usuário, compartilhável | **Implementado** |
| T5 | Backup vazado | Cifra stream derivada de SHA-256(password \|\| salt \|\| counter). Senha mín. 8 chars | **Implementado** (substituir por AES-GCM real em produção) |
| T6 | SQL injection | `expo-sqlite` força placeholders `?`; nunca concatenamos string | **Implementado** |
| T7 | XSS / web exploits | App nativo sem WebView; vetores não aplicáveis | N/A |
| T8 | Banco em texto plano (root/jailbreak) | Aceito como risco para escopo acadêmico; produção exigiria SQLCipher | **Mitigação parcial** |
| T9 | Crash silencioso sem recovery | `ErrorBoundary` global com retry | **Implementado** |
| T10 | Permissões nativas sem fallback | `services/nativeCapabilities` retorna `{error}` semântico | **Implementado** |

### Privacidade
- Tudo é **local**. Não enviamos nenhum dado para nenhum servidor.
- Fotos/áudio ficam no sandbox do app (URI privado do iOS/Android).
- Backup só sai do device por ação explícita do usuário, sempre cifrado.

### Boas práticas adotadas
- PIN nunca armazenado em texto plano.
- Salt criptograficamente aleatório por usuário (`expo-crypto.getRandomBytes`).
- Auto-lock baseado em tempo em background (`AppState`).
- Validação de entrada sanitiza e normaliza antes de persistir.
- `KeyboardAvoidingView` em todos os formulários.

---

## Recursos do app

### Implementados
- Dashboard com greeting dinâmico, KPIs e atalhos
- Múltiplos veículos (chip switcher)
- Saúde do veículo por categoria (oil/brakes/tires/battery/cooling/inspection/chain/general)
- Registro completo de manutenção (foto, áudio, GPS, oficina, peças, checklist contextual)
- Histórico com filtro por categoria
- Mapa nativo de oficinas (Google Provider em Android) + fallback para "Abrir no app de mapas"
- **Busca online de oficinas reais** (novo) via OpenStreetMap Overpass API — `amenity=car_repair` num raio de 5 km da posição do usuário
- Modo pré-viagem com cruzamento de KM x calendário
- Alertas configuráveis por categoria
- **Reportar Problema** (novo): fluxo rápido para registrar sintoma com evidências
- **Configurações** (novo): perfil, tema, biometria, backup, bloqueio manual
- **Tema escuro** (novo) com toggle light/dark/system
- **Autenticação local** com PIN + biometria + lock-out
- **Backup cifrado** com senha do usuário (export via share sheet)

### Roadmap
- [ ] Refatoração modular de `GarageTrackApp.tsx` (1400 linhas → 7 screens + 10 components)
- [ ] Import de backup (atualmente só export está plugado na UI)
- [ ] Cadastro/edição de veículos pela UI (hoje apenas seed)
- [ ] Notificações locais com `expo-notifications` em dev build (Expo Go SDK 53+ não suporta)
- [ ] Suite de testes com `jest-expo` + `@testing-library/react-native`
- [ ] Internacionalização (PT/EN) com `i18next`
- [ ] Migração para AES-GCM real no backup (libsodium nativo)
- [ ] Sync opcional com backend (cifrado E2E)
- [ ] Acessibilidade WCAG AA (contraste, hit area, labels)
- [ ] ErrorBoundary com telemetria (Sentry)

---

## Banco de dados

Schema versionado em `src/data/database.ts`. Tabelas:
- `users` (perfil do dono — seed)
- `vehicles` (carros e motos)
- `workshops` (oficinas)
- `workshop_reviews`
- `maintenance_records` (com `parts_json`, `checklist_json` serializados)
- `alert_preferences`

PRAGMAs ativos: `journal_mode = WAL`, `foreign_keys = ON`, `user_version` para futuras migrações.

---

## Convenções de código

- **Imports**: agrupados em (1) externos, (2) internos por camada (data → domain → services → presentation), separados por linha em branco.
- **Naming**: camelCase para variáveis/funções, PascalCase para componentes/tipos, kebab-case para arquivos de domínio.
- **Estilo**: StyleSheet local por screen com função `makeStyles(palette)` para reagir ao tema.
- **Erros**: nunca engolir — sempre `Alert` ou retornar `{error: string}`.
- **Logs**: `console.error('[Tag]', ...)` apenas em catch verdadeiramente excepcionais.

---

## Troubleshooting

| Sintoma | Causa provável | Solução |
|---|---|---|
| "Failed to download remote update" no Expo Go | Firewall do Windows ou IP da LAN não alcança o Metro | `adb reverse tcp:8081 tcp:8081` + `expo start --localhost` |
| Mapa preto no Android | Sem `PROVIDER_GOOGLE` | Já corrigido — usa Google Provider explícito |
| Crash ao boot mencionando `expo-notifications` | Expo Go SDK 53+ removeu notificações remotas | Já mitigado — load defensivo em `services/nativeCapabilities.ts` |
| "PIN incorreto" persistente | Lock-out ativo após 5 tentativas | Aguarde o tempo indicado; ou remova o app e reinstale para zerar |
| Backup não compartilha | `Sharing.isAvailableAsync()` retornou false | Arquivo fica em `cacheDirectory`, usuário pode acessar via gerenciador |

---

## Licença

Projeto acadêmico — uso educacional irrestrito.

## Funcionalidades implementadas

- Dashboard com KPIs por veículo.
- Cadastro de registro de manutenção com checklist dinâmico.
- Histórico filtrável por categoria.
- Detalhe de manutenção com peças, custo, notas, foto e áudio.
- Mapa com oficinas e pontos de manutenção.
- Avaliação local de oficinas.
- Painel de saúde por categoria.
- Modo pré-viagem com análise de risco.
- Configuração de alertas por dias e quilômetros.
