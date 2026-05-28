# Arquitetura — GarageTrack

> Documento vivo. Última atualização: 2026-Q1.

## 1. Visão geral

GarageTrack é um app móvel offline-first para gestão de manutenção veicular pessoal. Foi desenhado em camadas claras (apresentação, domínio, infraestrutura) para permitir evolução incremental — incluindo a futura sincronização opcional com backend remoto sem reescrita.

```
┌──────────────────────────────────────────────────────┐
│                     Presentation                      │
│  Screens · Components · ThemeContext · AuthContext   │
└─────────────┬────────────────────────────┬───────────┘
              │                            │
        ┌─────▼──────┐               ┌─────▼─────┐
        │   Domain   │               │  Services │
        │ Entities,  │◄──────────────│  workshops│
        │ validation │               │  backup   │
        └─────┬──────┘               │  location │
              │                      │  notif    │
        ┌─────▼──────┐               └─────┬─────┘
        │ Infrastruct│                     │
        │ SQLite/WAL │◄────────────────────┘
        │ SecureStore│
        │ FileSystem │
        └────────────┘
```

## 2. Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Expo SDK 56, React Native 0.85, React 19, Hermes |
| Linguagem | TypeScript 6 (strict) |
| Persistência local | `expo-sqlite` (WAL + FTS5) |
| Storage seguro | `expo-secure-store` (Keystore/Keychain) |
| Crypto | `expo-crypto` (SHA-256 + salt) |
| Auth | `expo-local-authentication` (biometria) |
| Mapas | `react-native-maps` (Google Provider Android) |
| Oficinas online | OpenStreetMap Overpass API |
| Notificações | `expo-notifications` |
| Mídia | `expo-image-picker`, `expo-audio` |
| Backup | `expo-file-system/legacy` + `expo-sharing` |

## 3. Camadas

### 3.1 Presentation (`src/presentation/`)

- **`GarageTrackApp.tsx`** — container principal e roteador interno por `activeScreen`. Mantém shell (header + switcher de veículos + tab rail) e renderiza a tela ativa.
- **`AuthContext.tsx`** — máquina de estados de PIN/biometria, lockout exponencial, auto-lock após 60s em background.
- **`AuthGate.tsx`** — gating entre setup, unlock e app.
- **`ThemeContext.tsx`** — modo `light | dark | system`, persistido em `AsyncStorage`.
- **`ErrorBoundary.tsx`** — fallback com retry para crashes de render.
- **`screens/`** — telas extraídas (Settings, ReportProblem).

### 3.2 Domain (`src/domain/`)

- **`entities.ts`** — `Vehicle`, `MaintenanceRecord`, `Workshop`, `Alert`.
- **`validation.ts`** — `validateMaintenanceDraft` retornando erros tipados antes de tocar o banco.

### 3.3 Services (`src/services/`)

- **`database.ts`** — bootstrap SQLite, migrações, transações `withTransactionAsync`, FTS5.
- **`workshopsApi.ts`** — chamada à Overpass API para oficinas próximas via tags `amenity=car_repair`, `shop=motorcycle_repair`, `shop=tyres`. Timeout 15s, ordenação por distância Haversine.
- **`backup.ts`** — exportação/importação de pacote criptografado (XOR keystream sobre SHA-256 derivado da senha + salt).
- **`location.ts`** — acesso a `expo-location` com fallbacks.
- **`notifications.ts`** — registro defensivo, suportando Expo Go SDK 53+.

## 4. Modelo de dados (SQLite)

| Tabela | Campos chave |
|---|---|
| `vehicles` | id, name, type, plate, current_mileage, image_uri |
| `maintenance_records` | id, vehicle_id (FK), category_id, title, mileage, cost_cents, performed_at, workshop_id |
| `workshops` | id, name, lat, lng, address, phone |
| `alerts` | id, vehicle_id, kind, due_at, dismissed_at |
| `attachments` | id, record_id (FK), kind (photo/audio), uri |
| `maintenance_records_fts` | FTS5 mirror para busca textual |

Foreign keys ON, WAL ativo, transações em toda escrita multi-tabela.

## 5. Fluxos críticos

### 5.1 Cadastrar manutenção

```
Form → validateMaintenanceDraft → withTransactionAsync(
  INSERT maintenance_records,
  INSERT attachments[],
  UPDATE vehicles.current_mileage (se maior),
  TRIGGER recalc alerts
)
```

### 5.2 Buscar oficinas próximas

```
ServiceMapScreen → getCurrentGarageLocation (expo-location)
                → searchNearbyWorkshops(lat,lng,radius)
                → Overpass POST
                → parse + Haversine sort
                → render markers (laranja) + lista
```

### 5.3 Backup

```
User PIN → derivar chave (SHA-256(PIN || salt))
        → SELECT * de todas as tabelas
        → serializar JSON
        → XOR keystream (SHA-256 chained nonce)
        → escrever arquivo .gtbk
        → Sharing.shareAsync
```

### 5.4 Auth

Ver [SECURITY.md](SECURITY.md#5-fluxo-de-autenticação).

## 6. Convenções

- Nomes de arquivos em `kebab-case` para módulos, `PascalCase.tsx` para componentes.
- Estilos próximos ao componente (`StyleSheet.create`).
- Funções de banco sempre `async` e sempre via helper de transação para multi-tabela.
- UI em pt-BR, código em inglês.
- Nenhum `any` em domain; tipagem completa em entidades.

## 7. Build & Deploy

- **Dev**: `npm run dev:android` (script `scripts/dev-android.ps1`).
- **APK preview**: `npm run build:apk` (requer `eas-cli` e conta Expo).
- **Production AAB**: `eas build --platform android --profile production`.
- **Update OTA**: `eas update --branch preview` (após configurar `expo-updates`).

## 8. Decisões arquiteturais

| # | Decisão | Razão |
|---|---|---|
| ADR-001 | Offline-first com SQLite | Confiabilidade sem rede, custo zero de infra inicial |
| ADR-002 | PIN+biometria local em vez de OAuth obrigatório | Privacidade dos dados de manutenção, baixa fricção |
| ADR-003 | Overpass em vez de Google Places | Sem custo, sem chave, sem termos restritivos |
| ADR-004 | `expo-file-system/legacy` | API estável em SDK 56; nova API ainda incompleta |
| ADR-005 | XOR-keystream sobre SHA-256 para backup | Sem deps nativas; revisitar para AES-GCM via libsodium quando viável |
| ADR-006 | Sincronização remota opcional (Supabase) | Manter offline-first; sync é feature, não dependência |
