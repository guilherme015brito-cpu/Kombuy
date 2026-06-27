# Kombuy MVP

Kombuy e um MVP em Next.js para simulacao externa de financiamento em e-commerce, com painel administrativo protegido, propostas no Supabase e base operacional para integracao Yampi.

## Arquitetura Atual

- `Next.js App Router`, TypeScript e Tailwind CSS.
- Supabase para banco, Auth e service role somente no servidor.
- `/simular` publico cria propostas via `/api/propostas`.
- `/admin/*` protegido por Supabase Auth e allowlist `ADMIN_EMAILS`.
- OAuth Yampi usa PKCE, sem `YAMPI_CLIENT_SECRET`.
- Tokens Yampi ficam somente em `yampi_instalacoes`, nunca no frontend.
- Hiperban ainda nao integrado; existe apenas adapter desabilitado.

## Variaveis De Ambiente

```env
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
YAMPI_CLIENT_ID=
YAMPI_REDIRECT_URI=https://kombuy.vercel.app/api/yampi/oauth/callback
YAMPI_AUTH_URL=https://auth.yampi.com.br/oauth/authorize
YAMPI_TOKEN_URL=https://auth.yampi.com.br/oauth/token
YAMPI_WEBHOOK_SECRET=
ADMIN_EMAILS=admin@seudominio.com
ALLOWED_RETURN_HOSTS=sua-loja.com.br
HIPERBAN_API_URL=
HIPERBAN_CLIENT_ID=
HIPERBAN_CLIENT_SECRET=
HIPERBAN_WEBHOOK_SECRET=
```

Nao configure `YAMPI_CLIENT_SECRET`; a Yampi usa OAuth 2.0 com PKCE.

## Rodar Localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Validacao:

```bash
npm run lint
npm run typecheck
npm run build
```

## Migration Do Supabase

Execute no SQL Editor:

```text
supabase/migrations/20260627_yampi_integration_hardening.sql
```

A migration e idempotente, nao apaga dados, adiciona colunas, RLS, indices, trigger de `updated_at` e backfill seguro de `merchant_alias`.

## Criar Administrador

1. No Supabase, va em Authentication > Users.
2. Crie um usuario com e-mail e senha.
3. Adicione o e-mail em `ADMIN_EMAILS` na Vercel, separado por virgula se houver mais de um.
4. Acesse `/admin/login` e entre com esse usuario.

## Fluxo OAuth Yampi

1. A Yampi pode abrir `/api/yampi/oauth/callback` sem `code`.
2. A Kombuy gera `state`, `code_verifier` e `code_challenge`.
3. `state` e `code_verifier` sao salvos em cookies HttpOnly, Secure e SameSite=Lax.
4. O usuario e redirecionado para `https://auth.yampi.com.br/oauth/authorize`.
5. No retorno com `code`, a Kombuy valida `state`, usa `code_verifier` e troca o code por tokens.
6. A instalacao e salva/atualizada por `merchant_alias`, evitando duplicidade.
7. Cookies temporarios sao apagados.

Redirect URI obrigatoria:

```text
https://kombuy.vercel.app/api/yampi/oauth/callback
```

## Renovacao De Tokens

O gerenciador em `lib/yampi/token-manager.ts`:

- considera access token valido por 10 minutos;
- considera refresh token valido por 30 dias;
- renova quando faltar menos de 60 segundos;
- marca a instalacao como `reautorizacao_necessaria` se o refresh token expirar ou for revogado;
- nunca retorna tokens para componentes client-side.

## Testar Conexao Yampi

No painel `/admin/integracoes/yampi`, clique em `Testar conexao`.

A rota autenticada `/api/yampi/test-connection` consulta:

```text
GET /{merchant_alias}/checkout/payments
GET /{merchant_alias}/checkout/gateways?include=form
```

O retorno ao frontend e resumido e seguro: contagens, aliases, nomes e flags basicas. Tokens, cookies e headers sensiveis nunca sao retornados.

## Configurar Webhook

Na Yampi, configure:

```text
https://kombuy.vercel.app/api/yampi/webhook
```

Configure `YAMPI_WEBHOOK_SECRET` na Vercel. O webhook valida `X-Yampi-Hmac-SHA256` com HMAC-SHA256 em Base64, salva payload e headers seguros, aceita eventos desconhecidos e evita duplicidade quando houver `event_id`.

Eventos reconhecidos inicialmente:

- `order.created`
- `order.paid`
- `order.status.updated`
- `transaction.payment.refused`
- `cart.reminder`
- `customer.created`
- `customer.address.created`

## Testar Uma Proposta

```text
https://kombuy.vercel.app/simular?merchant_alias=test-kombuy-sandbox-02&produto=Notebook&valor=2500&nome=Joao%20Silva&cpf=12345678900&email=joao@email.com&telefone=35999999999&cep=37700000
```

Com `merchant_alias`, a proposta e salva com `origem='yampi'`; sem ele, `origem='direto'`.

## Retorno Ao Checkout

`/proposta/[id]` mostra dados seguros ao cliente. O botao de retorno ao checkout so aparece quando `return_url` possui host permitido em `ALLOWED_RETURN_HOSTS`.

## Passos Manuais Apos O Deploy

1. Supabase: rode `supabase/migrations/20260627_yampi_integration_hardening.sql`.
2. Supabase Auth: crie o usuario administrador.
3. Vercel: configure todas as variaveis de ambiente.
4. Vercel: remova `YAMPI_CLIENT_SECRET`, se existir.
5. Yampi Parceiros: configure redirect URI, URL de instalacao e webhook.
6. Admin: acesse `/admin/login`.
7. Admin: abra `/admin/integracoes/yampi` e clique em `Testar conexao`.
8. Admin: abra `/admin/propostas` e confirme que propostas antigas aparecem.

## Limites Atuais

- Nao ha integracao real com Hiperban ainda.
- Nao ha envio de WhatsApp ou e-mail.
- Nao ha criacao automatica de gateway, meio de pagamento ou botao nativo no checkout.
- A criacao da opcao `Financiar com Kombuy` no bloco de pagamentos depende da especificacao e homologacao da Yampi como gateway ou meio de pagamento alternativo.
