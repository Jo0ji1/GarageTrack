# Configuração de Email no Supabase

## 📧 Por que não recebo email de confirmação?

O Supabase **envia email de confirmação por padrão** ao criar uma conta via `signUp`, MAS requer configuração de SMTP ou uso dos templates padrão.

### ✅ Estado atual (provável)
- ✅ Conta é criada no banco (`profiles` tem o registro)
- ✅ Usuário pode fazer login imediatamente (mesmo sem confirmar)
- ❌ Email de confirmação **não chega** porque:
  - SMTP customizado não está configurado, OU
  - Rate limit do serviço de email do Supabase (max 4 emails/hora no plano free)

---

## 🔧 Como habilitar emails de confirmação

### Opção 1: Usar o serviço de email do Supabase (Free tier)
1. Acesse: **Supabase Dashboard → Project Settings → Authentication**
2. Role até **Email Settings**
3. Verifique se **"Enable email confirmations"** está **ON**
4. **IMPORTANTE**: No plano gratuito, o Supabase só envia **4 emails por hora**. Se você criou várias contas de teste, pode ter atingido o limite.

### Opção 2: Configurar SMTP customizado (Recomendado para produção)
Se você quer emails ilimitados e confiáveis, configure um provedor externo (ex: SendGrid, Mailgun, Resend, Gmail):

1. **Supabase Dashboard → Project Settings → Authentication → Email Settings**
2. Clique em **"Enable Custom SMTP"**
3. Preencha:
   - **SMTP Host**: `smtp.sendgrid.net` (ou outro provedor)
   - **SMTP Port**: `587` (TLS) ou `465` (SSL)
   - **SMTP User**: sua chave de API ou username
   - **SMTP Password**: sua senha ou token
   - **Sender Email**: `noreply@seudominio.com`
   - **Sender Name**: `GarageTrack`

**Provedores recomendados:**
| Provedor | Tier gratuito | Setup |
|---|---|---|
| **Resend** | 3.000 emails/mês | Muito simples, foco em dev |
| **SendGrid** | 100 emails/dia | Clássico, exige verificação de domínio |
| **Mailgun** | 1.000 emails/mês | Bom para Europa (GDPR) |
| **Gmail SMTP** | 500/dia | Só para dev, pode cair em spam |

### Opção 3: Desabilitar confirmação de email (NÃO recomendado)
Se você NÃO precisa de confirmação (ex: app interno):
1. **Supabase Dashboard → Authentication → Settings**
2. Desative **"Enable email confirmations"**
3. Usuários podem logar imediatamente sem confirmar

⚠️ **Problema**: qualquer pessoa pode criar uma conta com qualquer email (inclusive emails falsos).

---

## 🧪 Testando emails localmente

Se você quer testar sem configurar SMTP:
1. Use **Mailtrap.io** (captura emails em sandbox, não envia de verdade)
2. Configure SMTP no Supabase apontando para Mailtrap
3. Veja os emails no dashboard do Mailtrap

---

## 🐛 Diagnóstico: Por que o Google OAuth falhou?

O erro `"invalid request: both auth code and code verifier should be non-empty"` foi causado por:

### Causa raiz
O método `exchangeCodeForSession(result.url)` estava recebendo a URL inteira, mas o Supabase v2+ exige **PKCE** (Proof Key for Code Exchange). O código esperava:
- `code` (extraído da query string da URL de retorno)
- `code_verifier` (gerado automaticamente pelo SDK)

### Fix aplicado
O código foi corrigido para:
1. Parse da URL de retorno (`garagetrack://auth/callback?code=...`)
2. Extração do `code` da query string
3. Chamada de `exchangeCodeForSession(code)` **apenas com o code** (o SDK injeta o verifier automaticamente)
4. Fallback para implicit flow (tokens no fragment) se o code não vier

**Commit que resolve:** (será incluído na v1.4.1)

---

## 📝 Checklist de configuração completa

Antes de distribuir o app para produção:

- [ ] **SMTP configurado** (Resend, SendGrid, ou outro)
- [ ] **Email de confirmação testado** (criar conta + verificar inbox)
- [ ] **Templates de email customizados** (Supabase → Authentication → Email Templates):
  - Confirmação de cadastro
  - Reset de senha
  - Magic link (se usar)
- [ ] **Domínio verificado** no provedor de email (evita cair em spam)
- [ ] **Rate limit aumentado** (se necessário, upgrade para Pro)
- [ ] **Redirect URLs** no Supabase incluem:
  - `garagetrack://auth/callback` (OAuth mobile)
  - `https://seudominio.com/auth/callback` (se tiver web)

---

## 🚀 Próximos passos

1. **Configure SMTP agora** (Resend é o mais rápido: 5 min)
2. **Teste criando uma conta nova** e verifique o inbox
3. **Customize os templates** (opcional, mas recomendado para branding)
4. **Documente as credenciais** em `.env` e EAS Secrets (se usar SMTP)

**Quer ajuda para configurar Resend/SendGrid?** Me avise e eu gero o passo-a-passo detalhado.
