# Kombuy MVP

Aplicacao web em Next.js para simulacao externa de financiamento em e-commerce, com cadastro de propostas no Supabase e preparacao inicial para integracao OAuth/Webhook da Yampi.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase
- Deploy na Vercel

## Rotas principais

- `/simular`: simulacao de financiamento com preenchimento por parametros de URL.
- `/admin/propostas`: painel de propostas salvas.
- `/admin/integracoes/yampi`: status, conexao OAuth e instalacoes Yampi.
- `/api/propostas`: cria propostas no Supabase.
- `/api/yampi/oauth/start`: inicia OAuth da Yampi.
- `/api/yampi/oauth/callback`: recebe `code`, troca por token e salva a instalacao.
- `/api/yampi/webhook`: recebe eventos Yampi e salva o payload bruto.

## Como rodar localmente

1. Instale dependencias:

```bash
npm install
```

2. Crie `.env.local`:

```bash
cp .env.example .env.local
```

3. Preencha as variaveis:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
YAMPI_CLIENT_ID=
YAMPI_CLIENT_SECRET=
YAMPI_REDIRECT_URI=
YAMPI_AUTH_URL=
YAMPI_TOKEN_URL=
NEXT_PUBLIC_APP_URL=
```

Para teste local, use `NEXT_PUBLIC_APP_URL=http://localhost:3000` e `YAMPI_REDIRECT_URI=http://localhost:3000/api/yampi/oauth/callback`.

4. Rode:

```bash
npm run dev
```

5. Valide build antes do deploy:

```bash
npm run lint
npm run typecheck
npm run build
```

## Configurar Supabase

1. Crie um projeto no Supabase.
2. Abra SQL Editor.
3. Execute `supabase/schema.sql`.
4. Em Project Settings > API, copie:
   - Project URL para `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key para `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key para `SUPABASE_SERVICE_ROLE_KEY`

`SUPABASE_SERVICE_ROLE_KEY` e tokens da Yampi sao usados apenas em rotas server-side/API e server components de admin. Nao exponha essas chaves em componentes client-side.

## Configurar variaveis na Vercel

No projeto da Vercel, abra Settings > Environment Variables e cadastre:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
YAMPI_CLIENT_ID=
YAMPI_CLIENT_SECRET=
YAMPI_REDIRECT_URI=https://seu-dominio.vercel.app/api/yampi/oauth/callback
YAMPI_AUTH_URL=
YAMPI_TOKEN_URL=
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
```

Depois de alterar variaveis na Vercel, faça um novo deploy.

## URLs para copiar no painel da Yampi

Use o dominio final do deploy:

```text
URL de callback OAuth:
https://seu-dominio.vercel.app/api/yampi/oauth/callback

URL de webhook:
https://seu-dominio.vercel.app/api/yampi/webhook
```

Se estiver testando localmente com uma URL publica de tunel, use essa URL publica em `NEXT_PUBLIC_APP_URL` e `YAMPI_REDIRECT_URI`.

## Testar simulacao

Abra:

```text
http://localhost:3000/simular?loja=Loja%20Teste&loja_id=abc123&produto=Notebook&valor=2500&nome=Joao%20Silva&cpf=12345678900&email=joao@email.com&telefone=35999999999&cep=37700000
```

Preencha renda mensal, parcelas e aceite dos termos. Ao enviar, a proposta e salva em `propostas` com status `nova` e o app redireciona para `/analise`.

## Testar OAuth da Yampi

1. Confirme que estas variaveis existem:
   - `YAMPI_CLIENT_ID`
   - `YAMPI_CLIENT_SECRET`
   - `YAMPI_AUTH_URL`
   - `YAMPI_TOKEN_URL`
   - `NEXT_PUBLIC_APP_URL`
   - `YAMPI_REDIRECT_URI`
2. Abra `/admin/integracoes/yampi`.
3. Clique em `Conectar Yampi`.
4. Autorize no ambiente da Yampi.
5. A Yampi deve redirecionar para `/api/yampi/oauth/callback?code=...`.
6. O app troca o `code` por token, salva em `yampi_instalacoes` e volta para `/admin/integracoes/yampi?status=conectado`.

## Testar webhook

Envie um `POST` para `/api/yampi/webhook` com qualquer JSON. Eventos desconhecidos sao aceitos e salvos em `yampi_webhook_logs`.

## Observacoes de seguranca

- Nao ha autenticacao no MVP. Proteja `/admin/*` antes de producao.
- Nao ha integracao Hiberbank neste MVP.
- Tokens Yampi nao sao exibidos no painel.
- O webhook retorna `200` mesmo quando recebe evento desconhecido.
