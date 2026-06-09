# GarageTrack — Convenções para agentes

App mobile **offline-first** de manutenção veicular. SQLite local é a fonte da verdade; Supabase é nuvem opcional. O app deve funcionar 100% sem login/internet.

## Estrutura
- Git fica na raiz `GarageTrack/`; o app em `garage-track-mobile/`.
- Rode `tsc`/`npm`/`eas`/`adb` dentro de `garage-track-mobile/`; rode `git` na raiz.
- Camadas: `src/data` (SQLite), `src/domain` (regras puras), `src/presentation` (UI/contexts), `src/services` (Supabase, nativo, backup, mapas).
- Migrations e RLS em `supabase/migrations/`; docs em `docs/`.

## Regras invioláveis
- NUNCA commitar segredos. Chaves vão em `.env` (gitignored); documente em `.env.example`; use EAS Secrets no CI.
- Não quebrar o modo offline: nuvem é opcional.
- IDs locais são strings (ex.: `vehicle-honda`), não UUIDs — colunas Supabase correspondentes usam `TEXT`.
- Preservar identificadores de libs ao traduzir texto pt-BR (`Camera`, `Audio` são nomes de export, não traduzir).
- Sem `git push --force`, `git reset --hard` em histórico publicado, nem deletar arquivos do usuário sem confirmar.

## Fluxo de trabalho
1. Validar sempre com `npx tsc --noEmit` (em `garage-track-mobile/`) após editar.
2. Mudanças mínimas e idiomáticas; sem refatorações/comentários não solicitados.
3. Validação só em fronteiras (input do usuário, rede, SQL).
4. Checar OWASP Top 10 e permissões Android mínimas; nada sensível em logs fora de `__DEV__`.
5. Atualizar `CHANGELOG.md` (Keep a Changelog, pt-BR) e `docs/` afetados.

## Convenções
- Idioma: pt-BR (UI, docs, commits) com acentuação correta.
- Commits: Conventional Commits em pt-BR (`feat:`, `fix:`, `docs:`, `chore:`).
- Ambiente: Windows + PowerShell (encadeie com `;`, nunca `&&`).
- Expo SDK 56: consulte https://docs.expo.dev/versions/v56.0.0/ antes de usar APIs nativas.

## Agente especializado
Para tarefas de engenharia deste projeto, use o agente **GarageTrack Engineer** (`.github/agents/garagetrack-engineer.agent.md`).
