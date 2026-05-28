# Contribuindo com o GarageTrack

Obrigado pelo interesse! Este projeto é mantido como um trabalho acadêmico open-source.

## Setup rápido

```powershell
git clone https://github.com/Jo0ji1/GarageTrack.git
cd GarageTrack/garage-track-mobile
npm install --legacy-peer-deps
npm run dev:android   # Windows: sobe Metro + adb reverse + Expo Go
```

Pré-requisitos: Node 20+, Android Studio com emulador Pixel_7_API_34, `adb` no PATH.

## Fluxo de trabalho

1. Crie uma branch a partir de `main`: `git checkout -b feat/minha-feature`.
2. Faça commits pequenos e descritivos (convencionados: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
3. Garanta que `npm run typecheck` passa sem erros.
4. Atualize a documentação quando mudar comportamento público.
5. Abra um PR usando o template e descreva impacto, testes e screenshots.

## Padrões de código

- TypeScript estrito; evite `any`.
- Componentes funcionais com hooks.
- Estilos via `StyleSheet.create` próximos ao componente.
- Strings de UI em pt-BR.
- Não adicione dependências sem justificar no PR.

## Segurança

- Nunca commite `.env`, chaves, tokens, APKs assinados.
- Reporte vulnerabilidades em privado via Issues com label `security` ou contato direto antes de divulgar.
- Veja [docs/SECURITY.md](docs/SECURITY.md) para o modelo de ameaças.

## Licença

Ao contribuir você concorda em licenciar suas mudanças sob a [MIT License](garage-track-mobile/LICENSE).
