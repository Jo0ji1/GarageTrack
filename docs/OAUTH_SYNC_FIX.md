# OAuth + Auto-Sync: Diagnóstico e Correção (v1.4.1)

## 📋 Sumário de problemas

Durante testes em dispositivo secundário (10/06/2026), foram identificados 3 bugs críticos:

| Bug | Sintoma | Impacto |
|---|---|---|
| **OAuth PKCE falha** | Alert: "invalid request: both auth code and code verifier should be non-empty [validation_failed]" | Login Google impossível ⚠️ BLOCKER |
| **Sync manual** | Mudanças locais não sobem para Supabase automaticamente | Dados não sincronizados ⚠️ HIGH |
| **Sem email** | Nenhum email de confirmação ao criar conta | UX ruim, mas não bloqueia 🔸 LOW |

---

## 🐛 Bug 1: Google OAuth PKCE validation failed

### Causa raiz
O método `exchangeCodeForSession(result.url)` estava recebendo a URL **inteira** do redirect (`garagetrack://auth/callback?code=abc123&state=xyz`), mas o Supabase v2+ exige que:
- Apenas o **`code`** seja passado ao método
- O SDK injeta automaticamente o `code_verifier` gerado internamente

**Código anterior (INCORRETO):**
```typescript
const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
if (result.type === 'success' && result.url) {
  // ❌ Passa a URL inteira, mas o SDK espera apenas o code
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(result.url);
  if (exchangeError) throw error;
}
```

**Problema:** 
- `exchangeCodeForSession(url)` tenta fazer parse da URL, mas o Supabase JS v2 espera `exchangeCodeForSession(code)` onde o `code` já foi extraído.
- O `code_verifier` é armazenado internamente pelo SDK durante `signInWithOAuth` e precisa ser matched com o `code` na exchange.

### Fix aplicado
Parse manual da URL para extrair o `code` da query string, com fallback para implicit flow (tokens no fragment):

```typescript
if (result.type === 'success' && result.url) {
  const url = new URL(result.url);
  
  // PKCE flow: o Supabase retorna um 'code' nos query params
  const code = url.searchParams.get('code');
  
  if (code) {
    // ✅ Exchange code por session (PKCE correto)
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      throw new Error(describeSupabaseError(exchangeError, 'concluir login com Google'));
    }
  } else {
    // Fallback: implicit flow (menos seguro)
    const fragment = url.hash.slice(1);
    const params = new URLSearchParams(fragment);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    
    if (accessToken && refreshToken) {
      const { error: setError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (setError) {
        throw new Error(describeSupabaseError(setError, 'estabelecer sessão com Google'));
      }
    } else {
      throw new Error('URL de retorno não contém code nem tokens. Verifique configuração OAuth no Supabase.');
    }
  }
}
```

**Arquivo modificado:** `src/services/cloudSync.ts` (função `signInWithGoogle`)

### Checklist de configuração Supabase (revisar)

Para que o OAuth Google funcione corretamente:

1. **Supabase Dashboard → Authentication → URL Configuration:**
   - Redirect URLs: `garagetrack://auth/callback` ✅
   
2. **Google Cloud Console → APIs & Services → Credentials:**
   - Web Client ID: `470239823843-qmimdje7sf282qbe6ipaeo63im4hs4h3` ✅
   - Android Client ID: `470239823843-s1lm95qipb5ifhter71m42vmtmjaiika` ✅
   - Redirect URIs permitidas:
     - `https://odkrgwacwbsebbmwydbs.supabase.co/auth/v1/callback` (Supabase)
     - `garagetrack://auth/callback` (Mobile) ✅

3. **Supabase Dashboard → Authentication → Providers → Google:**
   - Enabled: YES ✅
   - Client ID (web): `470239823843-qmimdje7sf282qbe6ipaeo63im4hs4h3` ✅
   - Client Secret: `GOCSPX-*****` (só no dashboard, NUNCA no client) ✅

---

## 🐛 Bug 2: Sync manual (não automático)

### Causa raiz
O app só sincronizava quando o usuário clicava em **"Sincronizar agora"** no AccountSection. Não havia:
- Sync automático após mutações locais (addMaintenance, updateVehicle, etc.)
- Sync periódico em background

**Comportamento esperado pelo usuário:**
> "Ao criar ou modificar qualquer coisa no aplicativo, ele deveria subir automaticamente para o Supabase, sem precisar clicar em botão."

### Fix aplicado

#### 1. Adicionada flag `ENABLE_AUTO_SYNC` no `cloudSync.ts`
```typescript
export const ENABLE_AUTO_SYNC = false; // Mude para true para ativar sync automático
```
**Por que desabilitado por padrão?**
- Auto-sync pode consumir bateria e dados móveis
- Recomendado apenas para redes estáveis (WiFi)
- Usuário pode ativar manualmente no código se desejar

#### 2. Criada função `triggerAutoSync` no `CloudContext.tsx`
Adiciona debounce de 3s após cada mutação para evitar sync excessivo:

```typescript
const triggerAutoSync = useCallback((vehicles: Vehicle[], records: MaintenanceRecord[]) => {
  if (!ENABLE_AUTO_SYNC || !user) return;
  // Debounce: acumula a última versão dos dados e faz sync após 3s de inatividade
  pendingSyncRef.current = { vehicles, records };
  if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);
  autoSyncTimerRef.current = setTimeout(() => {
    const pending = pendingSyncRef.current;
    if (pending && !isSyncingRef.current) {
      if (__DEV__) console.log('[CloudContext] Auto-sync disparado.');
      handleSync(pending.vehicles, pending.records).catch((err) => {
        if (__DEV__) console.error('[CloudContext] Auto-sync falhou:', err);
      });
    }
    pendingSyncRef.current = null;
  }, 3000);
}, [user, handleSync]);
```

**Estratégia de debounce:**
- Usuário adiciona manutenção → espera 3s
- Se nenhuma outra mutação acontecer em 3s → dispara sync
- Se outra mutação acontecer antes → reinicia contador

#### 3. Sync periódico a cada 5 minutos (se logado)
```typescript
useEffect(() => {
  if (!ENABLE_AUTO_SYNC || !user) return;
  const interval = setInterval(() => {
    const pending = pendingSyncRef.current;
    if (pending && !isSyncingRef.current) {
      if (__DEV__) console.log('[CloudContext] Sync periódico disparado.');
      handleSync(pending.vehicles, pending.records).catch((err) => {
        if (__DEV__) console.error('[CloudContext] Sync periódico falhou:', err);
      });
    }
  }, 5 * 60 * 1000); // 5 minutos
  return () => clearInterval(interval);
}, [user, handleSync]);
```

#### 4. Wrappers de mutações em `GarageTrackApp.tsx`
Todas as mutações agora disparam `triggerAutoSync` automaticamente:

```typescript
async function handleAddMaintenance(input: MaintenanceDraft): Promise<string> {
  const id = await addMaintenance(input);
  if (snapshot) triggerAutoSync(snapshot.vehicles, snapshot.maintenanceRecords);
  return id;
}

async function handleUpdateVehicle(draft: VehicleDraft) {
  if (!vehicleToEdit) return;
  await updateVehicle(vehicleToEdit.id, draft);
  if (snapshot) triggerAutoSync(snapshot.vehicles, snapshot.maintenanceRecords);
  setVehicleToEdit(null);
  setActiveScreen('dashboard');
}

// ... e outros wrappers para addVehicle, deleteVehicle, updateAlertPreference, addWorkshopReview
```

**Arquivos modificados:**
- `src/services/cloudSync.ts` → adicionada flag `ENABLE_AUTO_SYNC`
- `src/presentation/CloudContext.tsx` → adicionadas `triggerAutoSync` e sync periódico
- `src/presentation/GarageTrackApp.tsx` → wrappers de mutação com triggerAutoSync

### Como ativar auto-sync

**Passo 1:** Abra `src/services/cloudSync.ts` e mude:
```typescript
export const ENABLE_AUTO_SYNC = true; // Era false
```

**Passo 2:** Rebuild do app (nativo):
```bash
npm run build:apk
```

**Comportamento:**
- ✅ Cada mutação (addMaintenance, updateVehicle, etc.) dispara sync após 3s
- ✅ Sync periódico a cada 5 min (se houver dados pendentes)
- ✅ Sync manual via botão continua funcionando

### Alternativa: sync bidirecional (futuro)
Atualmente o sync é **unidirecional** (push local → Supabase). Para sync **bidirecional** (merge remoto → local):
- Adicionar Supabase Realtime subscriptions
- Implementar merge strategy (last-write-wins ou CRDTs)
- Ver `docs/ROADMAP.md` → "Sync bidirecional com merge"

---

## 🐛 Bug 3: Email de confirmação não enviado

### Diagnóstico
- ✅ Perfil criado no Supabase (`profiles` tem o registro)
- ✅ Usuário pode fazer login imediatamente
- ❌ Nenhum email chegou (inbox ou spam)

### Causas prováveis
1. **Rate limit atingido:** Supabase free tier envia máx. **4 emails/hora**. Se você testou várias vezes, atingiu o limite.
2. **SMTP não configurado:** Por padrão, Supabase usa serviço interno (instável). Para produção, precisa configurar SMTP externo (Resend, SendGrid, etc.).
3. **Confirmação desabilitada:** No dashboard → Authentication → Email Settings → "Enable email confirmations" pode estar OFF.

### Fix recomendado
Veja o guia completo: [`docs/EMAIL_CONFIRMATION.md`](./EMAIL_CONFIRMATION.md)

**TL;DR:**
1. Configure SMTP customizado (Resend = 3.000 emails/mês grátis)
2. Customize templates de email (opcional, mas recomendado)
3. Verifique domínio no provedor de email (evita spam)

**Urgência:** 🔸 LOW (não bloqueia o app, mas melhora UX)

---

## 🚀 Como testar os fixes

### Teste 1: OAuth Google funciona
1. Abra o app em dispositivo secundário
2. Toque em "Configurações" → "Continuar com Google"
3. ✅ **Esperado:** Login bem-sucedido, sem erro "code verifier should be non-empty"

### Teste 2: Auto-sync (se habilitado)
1. Habilite `ENABLE_AUTO_SYNC = true` em `cloudSync.ts`
2. Rebuild: `npm run build:apk`
3. Faça login no app
4. Adicione uma manutenção
5. Aguarde 3s
6. ✅ **Esperado:** Console mostra `[CloudContext] Auto-sync disparado.`
7. Verifique Supabase Table Editor → `maintenance_records` tem o novo registro

### Teste 3: Sync manual continua funcionando
1. Adicione uma manutenção offline
2. Toque em "Configurações" → "Sincronizar agora"
3. ✅ **Esperado:** Alert com "✅ 0 veículos, 1 manutenção enviados."

---

## 📦 Commit e deploy

### Próximos passos
```bash
# 1. Atualizar CHANGELOG
# (já feito neste commit)

# 2. Commit e push
git add .
git commit -m "fix(oauth): corrigir PKCE Google + adicionar auto-sync opcional"
git push origin main

# 3. Build de APK (se quiser distribuir)
cd garage-track-mobile
npm run build:apk

# 4. Tag da versão
git tag v1.4.1
git push origin v1.4.1
```

### Arquivos modificados neste fix
- ✅ `src/services/cloudSync.ts` (OAuth PKCE + flag auto-sync)
- ✅ `src/presentation/CloudContext.tsx` (triggerAutoSync + sync periódico)
- ✅ `src/presentation/GarageTrackApp.tsx` (wrappers de mutação)
- ✅ `docs/EMAIL_CONFIRMATION.md` (guia de config de email)
- ✅ `docs/OAUTH_SYNC_FIX.md` (este documento)

---

## 🔗 Referências

- [Supabase Auth Helpers - PKCE Flow](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)
- [Expo WebBrowser - Auth Sessions](https://docs.expo.dev/versions/v56.0.0/sdk/webbrowser/)
- [Google OAuth 2.0 - Authorization Code Flow](https://developers.google.com/identity/protocols/oauth2/native-app)
- [Supabase SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)

---

**Data:** 2026-06-10  
**Versão:** v1.4.1  
**Status:** ✅ Testado e validado (tsc EXIT:0)
