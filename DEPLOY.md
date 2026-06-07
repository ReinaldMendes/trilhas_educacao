# 🚀 Deploy Guide — Trilhas da Infância

---

## Backend → Railway

### ⚠️ IMPORTANTE: Configurar Root Directory como `apps/api`

O Railway precisa apontar para a pasta da API, não para a raiz do monorepo.

### Passo a passo:

1. Acesse https://railway.app/new
2. **Deploy from GitHub repo** → selecione `trilhas_educacao`
3. Antes de confirmar, clique em **Settings** e configure:

```
Root Directory:  apps/api       ← OBRIGATÓRIO
```

4. Adicione um **PostgreSQL** database ao projeto (botão "+ New" → Database → PostgreSQL)

5. Variáveis de ambiente no serviço da API:

```
DATABASE_URL         = (Railway preenche automaticamente do PostgreSQL plugin)
JWT_SECRET           = (gere: openssl rand -hex 64)
JWT_REFRESH_SECRET   = (gere: openssl rand -hex 64)
OPENAI_API_KEY       = sk-...
FRONTEND_URL         = https://seu-app.vercel.app
NODE_ENV             = production
PORT                 = 3001
```

6. Após o primeiro deploy bem-sucedido, rode o seed:

```bash
# Via Railway CLI
npm i -g @railway/cli
railway login
railway link           # selecione o projeto
railway run --service=api npx tsx prisma/seed.ts
```

### Por que o Root Directory é obrigatório?

O Railway faz scan de vulnerabilidades no `package-lock.json` que encontrar.
Se apontar para a raiz do monorepo, ele vê o Next.js (frontend) e bloqueia por CVE.
Apontando para `apps/api`, ele só vê as dependências do backend (Node/Express), que estão limpas.

---

## Frontend → Vercel

### ⚠️ IMPORTANTE: Configurar Root Directory como `apps/web`

1. Acesse https://vercel.com/new
2. Importe o repositório `trilhas_educacao`
3. **Antes de clicar em Deploy**, configure:

```
Root Directory:  apps/web       ← OBRIGATÓRIO
Framework:       Next.js        ← detectado automaticamente
```

4. Variáveis de ambiente::

```
NEXT_PUBLIC_API_URL = https://sua-api.railway.app
```

5. Clique em **Deploy**

---

## Resumo dos Root Directories

| Serviço  | Root Directory | Por quê                                    |
|----------|----------------|--------------------------------------------|
| Railway  | `apps/api`     | Só vê deps do backend, sem CVE do Next.js  |
| Vercel   | `apps/web`     | Next.js precisa ser a raiz do projeto      |

---

## Quickstart Local (Docker)

```bash
cp apps/api/.env.example apps/api/.env
# Edite apps/api/.env com sua OPENAI_API_KEY

OPENAI_API_KEY=sk-... docker compose up --build

# Seed (em outro terminal):
docker exec trilhas_api npx tsx prisma/seed.ts

# Acesse:
# Frontend: http://localhost:3000
# API:      http://localhost:3001/health
```

## Credenciais de teste

| Perfil      | E-mail                      | Senha        |
|-------------|-----------------------------|--------------|
| SME         | sme@trilhas.edu.br          | Trilhas@2026 |
| Coordenador | coord@trilhas.edu.br        | Trilhas@2026 |
| Diretora    | diretora@trilhas.edu.br     | Trilhas@2026 |
| Professora  | prof@trilhas.edu.br         | Trilhas@2026 |
| Corregente  | corregente@trilhas.edu.br   | Trilhas@2026 |

---

## Troubleshooting

**"SECURITY VULNERABILITIES DETECTED" no Railway**
→ Root Directory não está configurado como `apps/api`.
  Railway está lendo o `package-lock.json` da raiz que contém o Next.js (frontend).
  Configure Root Directory = `apps/api` no painel do Railway.

**"No Output Directory named public" no Vercel**
→ Root Directory não está configurado como `apps/web` no painel do Vercel.

**CORS error no browser**
→ Verifique se `FRONTEND_URL` na Railway tem o domínio exato do Vercel (sem barra final).

**Prisma: "Can't reach database server"**
→ Confira se `DATABASE_URL` está com as credenciais corretas do PostgreSQL plugin da Railway.

**Parecer IA não gera**
→ Verifique `OPENAI_API_KEY` na Railway e se a chave tem créditos disponíveis.
