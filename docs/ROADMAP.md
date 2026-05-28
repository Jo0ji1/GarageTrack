# Roadmap — GarageTrack

## v1.0 — Núcleo (✅ concluído)
- Cadastro de veículos (carro/moto)
- Manutenções com categorias, custo, km
- Alertas baseados em km/data
- Mapa de oficinas locais
- SQLite + WAL + FTS5

## v1.1 — Segurança & UX (✅ concluído)
- PIN + biometria com lockout exponencial
- Auto-lock em background
- Backup criptografado (export/import)
- Tema claro/escuro/sistema
- ErrorBoundary
- Validação de domínio

## v1.2 — Mapas reais & DX Windows (✅ concluído)
- Busca real de oficinas via OpenStreetMap Overpass
- ScrollView de veículos com altura travada
- Script `dev:android` que resolve IPv6/Metro/adb reverse
- Modal header em Configurações

## v1.3 — Conta na nuvem (🔵 próximo)
- [ ] Supabase: schema `profiles`, `vehicles`, `maintenance_records`, `attachments`
- [ ] Row-Level Security por `user_id`
- [ ] Login com Google via Supabase Auth ou `expo-auth-session/providers/google`
- [ ] Sync seletivo (offline-first mantido, push/pull com fila)
- [ ] Tela "Conta" em Configurações
- [ ] EAS Secrets para `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GOOGLE_OAUTH_CLIENT_ID`

## v1.4 — Distribuição pública (🔵 próximo)
- [ ] `eas.json` (✅ feito) + primeiro build `preview` (APK)
- [ ] GitHub Release com APK anexado e CHANGELOG.md
- [ ] `expo-updates` para OTA em canal `preview`
- [ ] README com link direto para download
- [ ] Página simples (GitHub Pages) com screenshots + botão "Baixar APK"

## v1.5 — Insights & automação
- [ ] Dashboard de gastos por veículo (12 meses)
- [ ] Previsão de próximas trocas com regressão simples
- [ ] Notificações locais agendadas para alertas
- [ ] Exportar PDF do histórico para seguro/revenda

## v2.0 — Multi-plataforma
- [ ] iOS (TestFlight)
- [ ] Widgets Android (próxima manutenção)
- [ ] Integração calendário (Google/iCloud)
- [ ] Compartilhar veículo com mecânico (read-only)
- [ ] OCR de notas fiscais

## v2.x — IA assistiva (opt-in)
- [ ] Sugestão de manutenção baseada em padrão de uso
- [ ] Diagnóstico inicial por foto/áudio do problema
- [ ] Comparativo de preços por região com dados públicos

## Backlog técnico
- [ ] Substituir XOR-keystream por AES-GCM (libsodium)
- [ ] Migrar `expo-file-system/legacy` quando API nova estabilizar
- [ ] Testes E2E com Maestro
- [ ] Detox / Jest para unitários de domain
- [ ] Storybook RN para componentes
- [ ] Sentry para crash reporting (opt-in)
