# Kombuy MVP

Kombuy e um MVP em Next.js para simulacao externa de financiamento em e-commerce, com painel administrativo de propostas e base pronta para integracao OAuth/Webhook da Yampi.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase
- Deploy na Vercel

## Rotas

- `/simular`: formulario publico de simulacao.
- `/admin/propostas`: painel administrativo de propostas.
- `/admin/integracoes/yampi`: painel da integracao Yampi.
- `/api/propostas`: cria propostas e atualiza status.
- `/api/yampi/oauth/start`: inicia OAuth Yampi com PKCE.
- `/api/yampi/oauth/callback`: inicia OAuth quando vem sem `code`, ou recebe `code`, valida `state`, troca por token com PKCE e salva a loja.
- `/api/yampi/webhook`: recebe webhooks e salva payload bruto.

## Rodar localmente

```bash
npm install
npm run dev
```

Para validar antes de deploy:

```bash
npm run lint
npm run typecheck
npm run build
```

## Variaveis de ambiente

Crie `.env.local` a partir de `.env.example`:

```bash
cp .env.example .env.local
```

Preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
YAMPI_CLIENT_ID=
YAMPI_REDIRECT_URI=
YAMPI_AUTH_URL=
YAMPI_TOKEN_URL=
```

Em desenvolvimento local:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
YAMPI_REDIRECT_URI=http://localhost:3000/api/yampi/oauth/callback
```

## Configurar Supabase

1. Crie um projeto no Supabase.
2. Abra SQL Editor.
3. Execute `supabase/schema.sql`.
4. Em Project Settings > API, copie:
   - Project URL para `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key para `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key para `SUPABASE_SERVICE_ROLE_KEY`

Tabelas usadas:

- `propostas`
- `yampi_instalacoes`
- `yampi_webhook_logs`

## Configurar Vercel

No projeto da Vercel, cadastre as mesmas variaveis do `.env.local` em Settings > Environment Variables.

Para producao:

```env
NEXT_PUBLIC_APP_URL=https://kombuy.vercel.app
YAMPI_REDIRECT_URI=https://kombuy.vercel.app/api/yampi/oauth/callback
YAMPI_AUTH_URL=https://auth.yampi.com.br/oauth/authorize
YAMPI_TOKEN_URL=https://auth.yampi.com.br/oauth/token
```

Depois de mudar variaveis, faca um novo deploy.

## URLs para copiar na Yampi

Use o dominio final do deploy:

```text
URL de instalacao:
https://kombuy.vercel.app/api/yampi/oauth/start

URL de redirecionamento/OAuth:
https://kombuy.vercel.app/api/yampi/oauth/callback

URL de webhook:
https://kombuy.vercel.app/api/yampi/webhook

URL do painel/configuracao:
https://kombuy.vercel.app/admin/integracoes/yampi
```

Essas URLs tambem aparecem com botao de copiar em `/admin/integracoes/yampi`.

## Testar /simular

Abra:

```text
http://localhost:3000/simular?loja=Loja%20Teste&loja_id=abc123&produto=Notebook&valor=2500&nome=Joao%20Silva&cpf=12345678900&email=joao@email.com&telefone=35999999999&cep=37700000
```

Preencha renda mensal, parcelas e aceite dos termos. Ao enviar, a proposta e salva no Supabase com status `nova` e o app redireciona para `/analise`.

## Testar /admin/propostas

Abra:

```text
http://localhost:3000/admin/propostas
```

O painel mostra:

- total de propostas
- propostas novas
- propostas em analise
- propostas aprovadas
- propostas recusadas
- tabela no desktop
- cards no mobile
- seletor para alterar status para `nova`, `em_analise`, `aprovada`, `recusada` ou `cancelada`

## Testar /admin/integracoes/yampi

Abra:

```text
http://localhost:3000/admin/integracoes/yampi
```

Verifique:

- status da integracao
- botao `Conectar Yampi`
- lojas conectadas
- status do token
- URLs copiaveis para o painel Yampi Parceiros

Para testar OAuth:

1. Configure `YAMPI_CLIENT_ID`, `YAMPI_AUTH_URL`, `YAMPI_TOKEN_URL`, `YAMPI_REDIRECT_URI` e `NEXT_PUBLIC_APP_URL`.
2. Clique em `Conectar Yampi`.
3. A Kombuy gera `state`, `code_verifier` e `code_challenge`, salva `state` e `code_verifier` em cookies HttpOnly e redireciona para a Yampi.
4. Autorize na Yampi.
5. A Yampi redireciona para `/api/yampi/oauth/callback?code=...&state=...`.
6. A Kombuy valida `state`, usa o `code_verifier`, troca o `code` por tokens e salva em `yampi_instalacoes`.
7. O app limpa os cookies temporarios e volta para `/admin/integracoes/yampi?status=conectado`.

A Yampi pode abrir diretamente `/api/yampi/oauth/callback` sem `code` na primeira chamada. Nesse caso, a Kombuy inicia o fluxo OAuth com PKCE automaticamente.

## Testar webhook

Envie um `POST` para:

```text
http://localhost:3000/api/yampi/webhook
```

O endpoint salva `payload` e `headers` em `yampi_webhook_logs` e retorna HTTP 200 mesmo se o evento for desconhecido.

## Seguranca e limites do MVP

- Nao ha autenticacao ainda. Proteja `/admin/*` antes de producao.
- Nao ha Hiberbank ainda.
- Nao ha forma de pagamento real.
- `SUPABASE_SERVICE_ROLE_KEY` e usado apenas server-side.
- A integracao Yampi usa OAuth 2.0 com PKCE e nao usa `YAMPI_CLIENT_SECRET`.
- Tokens Yampi nao sao exibidos no frontend.
