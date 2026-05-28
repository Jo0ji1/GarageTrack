# GarageTrack

> Gestão pessoal de manutenção veicular, offline-first, com biometria e backup criptografado.

[![CI](https://github.com/OWNER/GarageTrack/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/GarageTrack/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](garage-track-mobile/LICENSE)
[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2056-000020?logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)

App mobile (Android, em breve iOS) para acompanhar manutenção de carros e motos: registro de serviços, alertas inteligentes, mapa de oficinas próximas via OpenStreetMap, relato rápido de problemas, backup criptografado e bloqueio biométrico.

## ✨ Recursos

- 🛡️ **Autenticação local**: PIN + biometria, lockout exponencial, auto-lock em background.
- 🔐 **Backup criptografado**: exporta/importa toda a base com chave derivada via SHA-256.
- 🏍️ **Veículos múltiplos**: carro e moto no mesmo perfil, troca rápida.
- 🧾 **Manutenções**: histórico, custo, próxima revisão sugerida por km.
- 📍 **Oficinas próximas**: busca em tempo real via OpenStreetMap Overpass.
- 🌗 **Tema claro / escuro / sistema**.
- 🚨 **Relatar problema**: foto, áudio e descrição direto para uma oficina escolhida.
- 📴 **Offline-first**: SQLite local + WAL + FTS5.

## 🚀 Comece a usar

### Instalar o APK (em breve)

> Link da Release virá aqui assim que o primeiro build EAS for publicado.

### Rodar localmente

```powershell
git clone https://github.com/OWNER/GarageTrack.git
cd GarageTrack/garage-track-mobile
npm install --legacy-peer-deps
npm run dev:android
```

> O script `dev:android` resolve o problema clássico de IPv6 no Metro em Windows + Node 20+ e aplica `adb reverse` automaticamente.

Detalhes completos em [garage-track-mobile/README.md](garage-track-mobile/README.md).

## 🏗️ Arquitetura

- **Stack**: Expo SDK 56 · React Native 0.85 · React 19 · TypeScript 6
- **Persistência**: `expo-sqlite` com transações e WAL
- **Auth**: `expo-local-authentication` + `expo-secure-store` + `expo-crypto`
- **Mapas**: `react-native-maps` (Google Provider no Android) + Overpass OSM
- **Notificações**: `expo-notifications` (defensivo no Expo Go)

Documentação completa:
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/SECURITY.md](docs/SECURITY.md)
- [docs/ROADMAP.md](docs/ROADMAP.md)
- [docs/RUNBOOK.md](docs/RUNBOOK.md)
- [docs/documentacao_produto.md](docs/documentacao_produto.md)

## 🗺️ Roadmap (resumo)

- [x] v1.0 — Núcleo offline (manutenções, alertas, oficinas locais)
- [x] v1.1 — Auth biométrica, backup criptografado, temas
- [x] v1.2 — Busca real de oficinas via OSM, scripts Windows
- [ ] v1.3 — Login Google + sync opcional com Supabase
- [ ] v1.4 — APK público via EAS + auto-update OTA
- [ ] v2.0 — iOS, widgets Android, integração calendário

Veja [docs/ROADMAP.md](docs/ROADMAP.md) para o plano detalhado.

## 🤝 Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md). PRs e issues são bem-vindos.

## 📄 Licença

[MIT](garage-track-mobile/LICENSE) © 2026 GarageTrack contributors.
