# 🌿 Trilhas da Infância

**Plataforma de Gestão Pedagógica para Educação Infantil**  
_Mapeando vivências, valorizando percursos_

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | Node.js 20, Express 4, TypeScript |
| Banco | PostgreSQL 15 + Prisma ORM |
| IA | OpenAI API (GPT-4o) com streaming |
| Auth | JWT + bcrypt (RBAC com 5 perfis) |
| Deploy | Vercel (front) · Railway (back + DB) |
| Dev Local | Docker Compose |

---

## Quickstart Local (Docker)

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/trilhas-da-infancia.git
cd trilhas-da-infancia

# 2. Configure as variáveis de ambiente
cp apps/api/.env.example apps/api/.env
# Edite apps/api/.env e adicione sua OPENAI_API_KEY

# 3. Suba tudo com Docker Compose
OPENAI_API_KEY=sk-... docker compose up --build

# 4. Em outro terminal, rode o seed
docker exec trilhas_api npx tsx prisma/seed.ts

# 5. Acesse
# Frontend: http://localhost:3000
# API:      http://localhost:3001
# Health:   http://localhost:3001/health
```

### Credenciais de teste

| Perfil | E-mail | Senha |
|---|---|---|
| SME | sme@trilhas.edu.br | Trilhas@2026 |
| Coordenador | coord@trilhas.edu.br | Trilhas@2026 |
| Diretora | diretora@trilhas.edu.br | Trilhas@2026 |
| Professora | prof@trilhas.edu.br | Trilhas@2026 |
| Corregente | corregente@trilhas.edu.br | Trilhas@2026 |

---

## Desenvolvimento Local (sem Docker)

### Pré-requisitos
- Node.js 20+
- PostgreSQL 15+ rodando localmente

### API
```bash
cd apps/api
cp .env.example .env
# Edite .env com suas variáveis

npm install
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
npm run dev   # roda em http://localhost:3001
```

### Web
```bash
cd apps/web
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001

npm install
npm run dev   # roda em http://localhost:3000
```

---

## Deploy em Produção

### Backend → Railway

1. Crie um novo projeto no [Railway](https://railway.app)
2. Adicione um serviço PostgreSQL ao projeto
3. Conecte o repositório GitHub → selecione `apps/api` como root
4. Configure as variáveis de ambiente:

```
DATABASE_URL=        (gerado pelo Railway PostgreSQL)
JWT_SECRET=          (string aleatória 64 chars)
JWT_REFRESH_SECRET=  (string aleatória 64 chars)
OPENAI_API_KEY=      sk-...
FRONTEND_URL=        https://seu-app.vercel.app
NODE_ENV=production
PORT=3001
```

5. O Dockerfile em `apps/api/Dockerfile` já roda `prisma migrate deploy` no start.
6. Após o deploy, rode o seed via Railway CLI:
```bash
railway run npx tsx prisma/seed.ts
```

### Frontend → Vercel

1. Importe o repositório no [Vercel](https://vercel.com)
2. Configure o Root Directory como `apps/web`
3. Adicione a variável de ambiente:
```
NEXT_PUBLIC_API_URL=https://sua-api.railway.app
```
4. Deploy automático a cada push na branch `main`

---

## Estrutura do Projeto

```
trilhas-da-infancia/
├── apps/
│   ├── api/                    # Backend Node.js/Express
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Modelo de dados completo
│   │   │   └── seed.ts         # Dados iniciais
│   │   └── src/
│   │       ├── app.ts          # Express app
│   │       ├── server.ts       # Entry point
│   │       ├── config/         # Prisma client
│   │       ├── middleware/      # Auth, roles
│   │       ├── modules/        # Rotas por domínio
│   │       │   ├── auth/
│   │       │   ├── users/
│   │       │   ├── turmas/
│   │       │   ├── alunos/
│   │       │   ├── planejamentos/
│   │       │   ├── registros/
│   │       │   ├── pareceres/   # IA com streaming
│   │       │   └── dashboards/
│   │       └── utils/          # JWT, audit log
│   └── web/                    # Frontend Next.js
│       └── src/
│           ├── app/
│           │   ├── auth/login/          # Tela de login
│           │   └── dashboard/
│           │       ├── layout.tsx       # Sidebar + header
│           │       ├── professor/       # Planej., reg., pareceres, gráficos
│           │       ├── coordenador/     # Visto, comentários, cadastros, IA subst.
│           │       ├── diretora/        # Visualização ampla
│           │       └── sme/             # Dashboard estratégico da rede
│           ├── lib/             # API client, auth context, utils
│           └── types/           # Tipos TypeScript completos
├── docker-compose.yml           # Dev local completo
└── README.md
```

---

## Perfis e Permissões (RBAC)

| Funcionalidade | Regente | Corregente | Coordenador | Diretora | SME |
|---|:---:|:---:|:---:|:---:|:---:|
| Login | ✅ | ✅ | ✅ | ✅ | ✅ |
| Criar Planejamento | ✅ | ✅* | ❌ | ❌ | ❌ |
| Vistar Planejamento | ❌ | ❌ | ✅ | ✅ | ❌ |
| Criar Registro | ✅ | ✅* | ❌ | ❌ | ❌ |
| Comentar Registro | ❌ | ❌ | ✅ | ✅ | ❌ |
| Gerar Parecer IA | ✅ | ✅* | ✅** | ❌ | ❌ |
| Exportar PDF | ✅ | ✅ | ✅ | ❌ | ❌ |
| Cadastros | ❌ | ❌ | ✅ | ❌ | ❌ |
| Dashboards Unidade | 🟡 | 🟡* | ✅ | ✅ | ❌ |
| Dados da Rede | ❌ | ❌ | ❌ | ❌ | ✅ |

_* Somente quando vinculada temporariamente a uma turma_  
_** Identificado como "Gerado em substituição"_

---

## Endpoints da API

### Auth
- `POST /api/auth/login` — Login com e-mail e senha
- `POST /api/auth/refresh` — Renovar access token
- `POST /api/auth/logout` — Revogar refresh token
- `GET  /api/auth/me` — Dados do usuário autenticado

### Turmas
- `GET    /api/turmas` — Listar turmas
- `GET    /api/turmas/minhas` — Turmas do professor/corregente
- `POST   /api/turmas` — Criar turma (coordenador)
- `POST   /api/turmas/:id/vinculos` — Vincular professor/corregente
- `DELETE /api/turmas/:id/vinculos/:vinculoId` — Encerrar vínculo

### Planejamentos
- `GET  /api/planejamentos` — Listar (filtrado por perfil)
- `POST /api/planejamentos` — Criar planejamento
- `POST /api/planejamentos/:id/visto` — Dar visto (coord/diretora)

### Registros
- `GET   /api/registros` — Listar registros
- `POST  /api/registros` — Criar com upload de anexos
- `PATCH /api/registros/:id/comentario` — Comentário da coordenação

### Pareceres
- `POST /api/pareceres/gerar` — Gerar com IA (SSE streaming)
- `POST /api/pareceres` — Salvar parecer finalizado

### Dashboards
- `GET /api/dashboards/professor` — Autoavaliação
- `GET /api/dashboards/unidade` — Indicadores da unidade
- `GET /api/dashboards/rede` — Indicadores da rede (SME)
- `GET /api/dashboards/notificacoes` — Notificações do usuário

---

## Segurança

- JWT (8h) + Refresh Token (7 dias)
- bcrypt (salt rounds: 12)
- Rate limiting: 120 req/min geral, 20 req/15min em login
- Helmet.js (headers de segurança)
- CORS restrito ao domínio do frontend
- Logs de auditoria em ações críticas
- LGPD: dados de crianças acessíveis apenas por professores e coordenadores da unidade

---

## Modelo de Dados (resumo)

```
users → professor_turmas ← turmas → alunos
                                  ↓
                             registros → registro_anexos
                                  ↓
                              pareceres
turmas → planejamentos → propostas
unidades → turmas
unidades → unidade_users (coord/diretora)
users → notificacoes
users → audit_logs
users → refresh_tokens
```

---

_Cada passo, cada registro, cada olhar... Juntos, construímos percursos que transformam infâncias._ 🌿
