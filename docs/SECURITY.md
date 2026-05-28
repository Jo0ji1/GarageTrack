# Segurança — GarageTrack

## 1. Princípios

1. **Privacy-by-default**: dados ficam no dispositivo; sync remoto é opcional.
2. **Defesa em profundidade**: PIN + biometria + lockout + auto-lock + criptografia em repouso.
3. **Sem secrets em commits**: `.env*` ignorado, segredos via EAS Secrets ou variáveis de ambiente.
4. **Mínimo privilégio**: permissões pedidas só quando a feature é usada.

## 2. Modelo de ameaças

| ID | Ameaça | Vetor | Mitigação |
|---|---|---|---|
| T1 | Acesso físico ao dispositivo desbloqueado | Aplicativo aberto sem lock | Auto-lock após 60s em background; gating por AuthGate |
| T2 | Roubo do PIN por shoulder-surfing | Observação visual | PIN nunca exibido, biometria preferencial após setup |
| T3 | Brute-force de PIN | Tentativas repetidas | Lockout exponencial `[0,0,0,0,15,30,60,120,300]s` |
| T4 | Dump de SecureStore por root/jailbreak | Acesso ao Keystore | SecureStore usa Android Keystore; PIN nunca armazenado em texto plano (apenas hash com salt) |
| T5 | Leitura do SQLite por backup ADB | `adb backup` em modo debug | `android:allowBackup=false` em produção (configurar em `app.json`) |
| T6 | Backup `.gtbk` exposto | Compartilhamento acidental | Arquivo criptografado com chave derivada do PIN |
| T7 | MITM em chamadas a Overpass | Rede hostil | HTTPS only; dados públicos, sem envio de PII |
| T8 | Prompt injection via descrição de problema | LLM futura | Sanitização antes de enviar a backends de IA; nunca executar saída |
| T9 | Exfiltração via screenshot/screen recording | Apps maliciosos com overlay | `FLAG_SECURE` em tela de unlock (roadmap) |
| T10 | Comprometimento da conta Google (sync futuro) | Credencial reusada | RLS no Supabase + e-mail verificado + escopos mínimos |

## 3. Criptografia

| Item | Algoritmo | Notas |
|---|---|---|
| Hash de PIN | SHA-256(PIN \|\| salt) | Salt gerado uma vez por instalação; armazenado em SecureStore |
| Backup | XOR keystream sobre SHA-256 encadeado | Substituir por AES-GCM via libsodium quando bind nativo estiver estável |
| Transporte Overpass / Supabase | TLS 1.2+ | Padrão HTTPS |
| Armazenamento de tokens (futuro Supabase) | SecureStore | Refresh token nunca em AsyncStorage |

## 4. Permissões Android

| Permissão | Uso | Quando solicitar |
|---|---|---|
| `CAMERA` | Foto do problema | Ao abrir picker pela 1ª vez |
| `READ_MEDIA_IMAGES` | Galeria | Ao escolher anexo |
| `RECORD_AUDIO` | Áudio do problema | Ao iniciar gravação |
| `ACCESS_FINE_LOCATION` | Oficinas próximas | Ao abrir mapa |
| `USE_BIOMETRIC` | Unlock por digital/face | Setup inicial |

## 5. Fluxo de autenticação

```
[primeira abertura]
  → SetupScreen (nome → PIN → confirmar PIN)
  → gerar salt, salvar SHA-256(PIN+salt) em SecureStore
  → habilita biometria se disponível

[abertura subsequente]
  → UnlockScreen
  → tenta biometria (silently)
  → se falha/cancelado: prompt de PIN
  → verifica hash
  → em N falhas: aplica lockout exponencial
  → após sucesso: timestamp de sessão, libera AppShell

[background ≥ 60s]
  → invalida sessão → próxima foreground volta ao UnlockScreen
```

## 6. Reportar vulnerabilidades

Abra uma issue com label `security` ou contate os mantenedores em privado. Não divulgue publicamente antes de uma correção estar disponível.

## 7. Checklist pré-release

- [ ] `android:allowBackup=false` no manifesto
- [ ] `usesCleartextTraffic=false`
- [ ] Nenhum log de PIN, token ou e-mail em produção (`__DEV__` gates)
- [ ] Dependências sem CVEs críticos (`npm audit --production`)
- [ ] APK assinado com release keystore (não debug)
- [ ] EAS Secrets configurados para chaves Supabase/Google
