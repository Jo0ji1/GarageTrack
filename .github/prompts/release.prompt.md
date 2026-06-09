---
description: "Prepara uma release do GarageTrack: valida tsc, decide o bump SemVer, atualiza a versão em app.config.js, escreve a entrada do CHANGELOG (Keep a Changelog, pt-BR), faz o commit e a tag, e lista os passos de build EAS."
name: "Release GarageTrack"
agent: "GarageTrack Engineer"
argument-hint: "Tipo de bump (patch/minor/major) ou descreva as mudanças desta versão"
---
Prepare uma nova release do GarageTrack seguindo este fluxo. Execute os passos em ordem e pare se algum falhar.

## 1. Pré-condições
- Confirme a branch e que a árvore de trabalho está limpa (`git status` na raiz `GarageTrack/`).
- Rode `npx tsc --noEmit` em `garage-track-mobile/`. Se houver erro, **pare** e reporte.

## 2. Decidir a versão
- Leia a versão atual em [garage-track-mobile/app.config.js](../../garage-track-mobile/app.config.js).
- Determine o bump por SemVer a partir das mudanças desde a última tag (`git log <ultima-tag>..HEAD --oneline`):
  - `fix:` → patch · `feat:` → minor · breaking change → major.
  - Se o usuário indicou o tipo no argumento, use-o.
- Atualize `version` em `app.config.js` e a linha de versão no rodapé de Configurações, se existir.

## 3. CHANGELOG
- Em [CHANGELOG.md](../../CHANGELOG.md), mova o conteúdo de `[Unreleased]` para uma nova seção `[x.y.z] — AAAA-MM-DD`, agrupado em Adicionado / Alterado / Corrigido / Segurança (omita seções vazias).
- Mantenha o padrão Keep a Changelog em pt-BR. Recrie um `[Unreleased]` vazio no topo.

## 4. Commit e tag
- Commit em pt-BR: `chore(release): vX.Y.Z`.
- Crie a tag anotada `vX.Y.Z` com a mensagem resumindo os destaques.
- **NÃO** faça `push` automaticamente — apresente os comandos `git push origin main` e `git push origin vX.Y.Z` para o usuário confirmar.

## 5. Build
Liste os comandos de build (não execute sem confirmação):
- APK de teste: `npm run build:apk` (em `garage-track-mobile/`).
- Build EAS (se aplicável): `eas build --profile preview --platform android`.
- Lembre o usuário de conferir EAS Secrets e a rotação de chaves, se relevante.

## Saída
Resuma: versão final, resumo do CHANGELOG, comandos de push pendentes e próximos passos de build/distribuição.
