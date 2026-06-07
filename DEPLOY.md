# 🚀 Deploy Guide — Trilhas da Infância

---

## Backend → Railway

### Configurações EXATAS do painel (conforme screenshots)

#### 📁 Source (aba Source)
```
Source Repo:       ReinaldMendes/trilhas_educacao
Root Directory:    apps/api          ← SEM barra inicial (não /apps/api)
Branch:            main
```

#### 🔨 Build (aba Build)
```
Builder:           Railpack (Default)   ← manter padrão, NÃO mudar para Dockerfile
Custom Build Command:
  npm install && npx prisma generate && npm run build
```

#### 🚀 Deploy (aba Deploy / Build)
```
Custom Start Command:
  npx prisma migrate deploy && node dist/server.js
```

#### 🔐 Variables (aba Variables)
Clique em "+ New Variable" e adicione cada uma:
```
DATABASE_URL         = (copie do serviço PostgreSQL → Connect → DATABASE_URL)
JWT_SECRET           = (gere: openssl rand -hex 64)
JWT_REFRESH_SECRET   = (gere: openssl rand -hex 64)
OPENAI_API_KEY       = sk-...
FRONTEND_URL         = https://seu-app.vercel.app
NODE_ENV             = production
PORT                 = 3001
```

#### 🌐 Networking (aba Networking)
- Clique em **"Generate Domain"** para gerar a URL pública da API
- Anote essa URL — você vai precisar para configurar o Vercel

---

### Por que estava travando em "Processing deployment..."?

O Railway estava usando o **Railpack** builder mas sem comandos de build/start definidos.
Ele ficava aguardando sem saber o que executar.

Com o arquivo `apps/api/railway.toml` atualizado, os comandos agora estão explícitos:
- **Build:** `npm install && npx prisma generate && npm run build`
- **Start:** `npx prisma migrate deploy && node dist/server.js`

---

### Após o primeiro deploy bem-sucedido — Rodar o Seed

```bash
# Opção 1: Railway CLI
npm i -g @railway/cli
railway login
railway link    # selecione o projeto e o serviço da API
railway run npx tsx prisma/seed.ts

# Opção 2: Pelo painel Railway
# Settings → "Deploy" → clique em "..." → "Run Command"
# Digite: npx tsx prisma/seed.ts
```

Isso cria os usuários de demonstração:
| Perfil      | E-mail                    | Senha        |
|-------------|---------------------------|--------------|
| SME         | sme@trilhas.edu.br        | Trilhas@2026 |
| Coordenador | coord@trilhas.edu.br      | Trilhas@2026 |
| Diretora    | diretora@trilhas.edu.br   | Trilhas@2026 |
| Professora  | prof@trilhas.edu.br       | Trilhas@2026 |
| Corregente  | corregente@trilhas.edu.br | Trilhas@2026 |

---

## Frontend → Vercel

```
Root Directory:  apps/web       ← OBRIGATÓRIO no painel Vercel
Framework:       Next.js        ← detectado automaticamente

Environment Variables:
  NEXT_PUBLIC_API_URL = https://sua-api.up.railway.app
```

---

## Quickstart Local (Docker)

```bash
cp apps/api/.env.example apps/api/.env
# Edite apps/api/.env com sua OPENAI_API_KEY

OPENAI_API_KEY=sk-... docker compose up --build

# Seed em outro terminal:
docker exec trilhas_api npx tsx prisma/seed.ts

# Acesse: http://localhost:3000
```

---

## Troubleshooting

**"Processing deployment..." para sempre**
→ Build/Start Command não estão configurados.
  Configure em Settings → Build Command e Start Command conforme acima.

**"SECURITY VULNERABILITIES DETECTED"**
→ Root Directory está errado (provavelmente na raiz do monorepo).
  Configure Root Directory = `apps/api` (sem barra).

**"Can't reach database server"**
→ `DATABASE_URL` não está configurada ou aponta para o host errado.
  Copie direto do PostgreSQL plugin em Railway → Connect.

**CORS error no browser**
→ `FRONTEND_URL` na Railway precisa ser exatamente `https://seu-app.vercel.app` (sem barra no final).
