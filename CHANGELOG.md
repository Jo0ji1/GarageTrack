# Changelog

Todas as mudanças notáveis serão documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Unreleased]

## [1.5.0] — 2026-06-16
### Corrigido
- **Ressurreição de dados após exclusão local**: o sync agora remove no Supabase os veículos e registros que foram apagados no SQLite local, evitando que itens excluídos reapareçam após pull.
- **Tela travada em "Preparando garagem" ao excluir todos os veículos**: o app agora trata garagem vazia com estado próprio e ações para criar novo veículo ou abrir configurações.

### Alterado
- **Seed inicial para novos bancos locais**: reduzido para 1 veículo de referência (antes eram 2), diminuindo ruído em contas novas e no primeiro contato com a aplicação.
- **Isolamento local por conta na nuvem**: leituras de veículos/manutenções/alertas/reviews agora são filtradas pelo usuário ativo (cloud user), evitando mistura de dados entre contas no mesmo dispositivo.
- **Sync destrutivo com segurança**: deleções remotas só são aplicadas em fluxos automáticos de mutação local, reduzindo risco de apagar dados da nuvem em bootstrap manual de conta.
- **Reconciliação completa do pull**: `applyRemoteData` passou a podar dados locais do usuário ativo que não existem mais no remoto, evitando sobras e inconsistências.

### Adicionado
- Guia de apresentação para Gamma em `docs/ROTEIRO_APRESENTACAO_GAMMA.md`, com narrativa, estrutura de slides e perguntas para avaliação dos colegas.
- Documento acadêmico final preenchido a partir do template: `docs/academico/Template_trabalho_20_dias.docx`.

## [1.4.4] — 2026-06-10
### Corrigido
- **Auto-sync inconsistente após múltiplas ações rápidas**: mudanças locais podiam ficar para trás e só refletirem após novas ações manuais. Agora o sync usa fila persistida em memória com reprocessamento automático quando há alterações durante um sync em andamento.

### Alterado
- **Janela de acumulação (debounce) ajustada para 3s**: alterações consecutivas são agrupadas para reduzir spam no banco e manter comportamento dinâmico.
- **Prioridade de sync**: eventos críticos (app indo para background/inactive) disparam flush imediato da fila.
- **Retry automático de fila**: em falha de rede/API, o último payload permanece enfileirado e tenta novamente após 5s.

## [1.4.3] — 2026-06-10
### Corrigido
- **Falha de sincronização entre contas diferentes** [42501]: IDs locais (`veh-*`, `mnt-*`) eram globais no Supabase e colidiam entre usuários no `upsert` por `id`, acionando caminho de update bloqueado por RLS. O sync agora usa IDs escopados por usuário na nuvem (`{userId}::{localId}`), eliminando colisões cross-account sem alterar os IDs locais.
- **Auto-sync com snapshot antigo**: gatilhos nas mutações podiam enviar estado anterior ao `refresh`, atrasando reflexo no banco e forçando sync manual.

### Alterado
- **Auto-sync reativo por mudança de snapshot**: `GarageTrackApp` agora dispara auto-sync quando o snapshot local atualizado muda.
- **Flush ao ir para background/inactive**: ao minimizar/fechar app, dispara tentativa imediata de sync para reduzir risco de perda de dados.
- **Debounce do auto-sync reduzido**: de 3s para 700ms para comportamento mais dinâmico.

## [1.4.2] — 2026-06-10
### Corrigido
- **RLS policy blocking INSERT** [42501]: policies com `for all` estavam bloqueando inserção de veículos durante sync. Agora cada operação (SELECT, INSERT, UPDATE, DELETE) tem policy específica. INSERT só valida `WITH CHECK`, não `USING`. ⚠️ **Requer migration no Supabase** (ver `supabase/migrations/20260610000300_fix_rls_policies.sql`).

## [1.4.1] — 2026-06-10
### Corrigido
- **OAuth Google PKCE validation failed**: `signInWithGoogle` agora extrai corretamente o `code` da URL de retorno antes de chamar `exchangeCodeForSession(code)` — antes passava a URL inteira, causando erro "both auth code and code verifier should be non-empty [validation_failed]". Fallback para implicit flow (tokens no fragment) se code não vier. ⚠️ **BLOCKER resolvido.**

### Adicionado
- **Auto-sync opcional após mutações locais**: nova flag `ENABLE_AUTO_SYNC` (padrão: `false`) em `cloudSync.ts`. Quando `true`, `CloudContext` dispara sync automático 3s após cada mutação (addMaintenance, updateVehicle, etc.) com debounce, e sync periódico a cada 5 min se houver dados pendentes. Evita ter que clicar em "Sincronizar agora" manualmente. Recomendado apenas para redes estáveis (WiFi).
- **Documentação de configuração de email**: criado `docs/EMAIL_CONFIRMATION.md` com guia completo para configurar SMTP customizado (Resend, SendGrid, etc.) e habilitar emails de confirmação de cadastro.
- **Runbook de diagnóstico**: criado `docs/OAUTH_SYNC_FIX.md` com causa raiz, fix aplicado, checklist de config Supabase/Google Cloud, e testes de validação.

### Alterado
- **Wrappers de mutação em `GarageTrackApp`**: todas as funções que alteram dados locais (`handleAddMaintenance`, `handleUpdateVehicle`, `handleAddVehicle`, `handleDeleteVehicle`, `handleUpdateAlertPreference`, `handleAddWorkshopReview`) agora chamam `triggerAutoSync` (se `ENABLE_AUTO_SYNC=true` e usuário logado).
- **Safe guards para `snapshot` null**: adicionadas verificações `if (snapshot)` antes de chamar `triggerAutoSync` para evitar crash em strict mode.

## [1.4.0] — 2026-06-09
### Adicionado
- **Notificações agendadas de alertas**: ao abrir o app, `scheduleHealthNotifications` cancela notificações antigas e reagenda uma notificação imediata para itens `overdue` e uma para o dia anterior ao vencimento para itens `attention`.
- **Atualização rápida de quilometragem**: tocar no card "Quilometragem" no Dashboard abre um mini-modal com campo numérico para atualizar o odômetro sem precisar entrar no formulário completo do veículo.
- **Dashboard de gastos por categoria**: a tela Saúde exibe um gráfico de barras horizontais com os valores gastos por categoria, ordenados por custo decrescente.
- **Busca no histórico**: campo de texto com ícone de lupa e botão limpar (X) filtra registros por título, notas ou marca da peça em tempo real.
- **Modal de detalhes de registro**: clicar em qualquer item do histórico abre um `Modal` fullscreen (pageSheet) com data, km, custo, categoria, notas, peça/produto, oficina, checklist, reprodução de áudio (play/pause via `useAudioPlayer`) e foto.
- **Ícones de anexo no histórico**: items com foto ou áudio exibem ícones de câmera/microfone na linha da lista.

### Corrigido
- **Date value out of bounds** (crash no startup após sync): `toDate()` agora normaliza timestamps ISO completos para `YYYY-MM-DD`; `applyRemoteData` faz `.slice(0,10)` em `performed_at` antes de gravar em `service_date`.

### Alterado
- **Versão 1.4.0** em `app.config.js`.
- **~15 acentos restaurados** na UI: "Olá", "saúde", "pré-viagem", "áudio", "evidências", "geográfica", "Não foi possível", "migrações", "distância", "Título", "Comentário", "própria", "quilômetros", "crítico", "únicas", etc.
- `StatCard` aceita prop opcional `onPress` (renderiza `Pressable` com indicador de edição quando presente).

- **Sync bidirecional**: o "Sincronizar agora" agora também aplica os dados recebidos da nuvem no SQLite local (`applyRemoteData` em `useGarageTrack`), fazendo merge de veículos (mantém a maior quilometragem) e registros de manutenção. Antes o pull baixava os dados mas não os persistia localmente.
- **CRUD de veículos**: usuário pode adicionar, editar e excluir veículos diretamente no app (`VehicleFormScreen`). Alertas de manutenção são criados automaticamente ao adicionar um veículo. Botão "Novo" e ícone de edição no seletor de veículos.
- **Problema → Navegação pós-envio**: após salvar um relato de problema, o app oferece ligar ou navegar até a oficina selecionada (via `Linking`).

### Corrigido
- **FK violation no sync**: `pushVehicles` agora executa antes de `pushRecords` (eram paralelos, causando violação de chave estrangeira no Supabase — erro `[23503]`).
- **Mapa: fallback interativo**: quando o Google Maps não carrega (timeout 4 s), exibe mensagem explicativa e botão "Abrir no app de mapas" — antes o overlay bloqueava o toque.

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
