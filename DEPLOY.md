# 🚀 Deploy Guide — Trilhas da Infância

## ⚠️ IMPORTANTE: Configuração do Root Directory no Vercel

O erro "No Output Directory named public found" acontece porque o Vercel aponta para a raiz do monorepo.
**É obrigatório configurar o Root Directory como `apps/web` no painel do Vercel.**

---

## Frontend → Vercel

### Passo a passo no painel:

1. Acesse https://vercel.com/new
2. Importe o repositório `trilhas_educacao`
3. **ANTES de clicar em Deploy**, clique em **"Edit"** nas configurações:

```
Root Directory:  apps/web        ← OBRIGATÓRIO
Framework:       Next.js         ← detectado automaticamente
Build Command:   npm run build   ← padrão
Output Dir:      .next           ← padrão Next.js
```

4. Em **Environment Variables**, adicione:
```
NEXT_PUBLIC_API_URL = https://sua-api.railway.app
```

5. Clique em **Deploy**

### Via Vercel CLI (alternativa):
```bash
npm i -g vercel
cd apps/web
vercel --prod
# O CLI vai detectar Next.js automaticamente a partir da pasta apps/web
```

---

## Backend → Railway

1. Acesse https://railway.app/new
2. **Deploy from GitHub repo** → selecione `trilhas_educacao`
3. Configure:
```
Root Directory:  apps/api
```
4. Adicione um **PostgreSQL** plugin ao projeto
5. Variáveis de ambiente:
```
DATABASE_URL         = (copiado do PostgreSQL plugin automaticamente)
JWT_SECRET           = (gere com: openssl rand -hex 64)
JWT_REFRESH_SECRET   = (gere com: openssl rand -hex 64)
OPENAI_API_KEY       = sk-...
FRONTEND_URL         = https://seu-app.vercel.app
NODE_ENV             = production
PORT                 = 3001
```
6. Após deploy, rode o seed pelo Railway CLI:
```bash
railway run --service trilhas-api npx tsx prisma/seed.ts
```

---

## Checklist pós-deploy

- [ ] Frontend acessível em `https://seu-app.vercel.app`
- [ ] API respondendo em `https://sua-api.railway.app/health`
- [ ] Login funcionando com `prof@trilhas.edu.br / Trilhas@2026`
- [ ] Planejamento criado e notificação gerada
- [ ] Parecer com IA gerando (requer OPENAI_API_KEY válida)
- [ ] Gráficos carregando no dashboard

---

## Troubleshooting

**"No Output Directory named public"**  
→ Você está fazendo deploy a partir da raiz do repo. Configure **Root Directory = `apps/web`** no painel do Vercel.

**"Module not found: @prisma/client"**  
→ A API não rodou `prisma generate`. O Dockerfile já faz isso automaticamente.

**CORS error no browser**  
→ Confira se `FRONTEND_URL` na API está com o domínio correto do Vercel (sem barra no final).

**Parecer IA não gera**  
→ Verifique se `OPENAI_API_KEY` está configurada na Railway e tem créditos disponíveis.
