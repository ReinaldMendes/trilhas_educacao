-- CreateEnum
CREATE TYPE "Role" AS ENUM ('professor', 'corregente', 'coordenador', 'diretora', 'sme');
CREATE TYPE "PlanejamentoStatus" AS ENUM ('rascunho', 'enviado', 'vistado', 'devolvido');
CREATE TYPE "TipoVinculo" AS ENUM ('regente', 'corregente');
CREATE TYPE "ModalidadeProposta" AS ENUM ('dirigida', 'livre', 'externa');
CREATE TYPE "TipoProposta" AS ENUM ('escrita','leitura','jogo','brincadeira','arte','musica','movimento','exploracao','experiencia','roda_conversa','outro');
CREATE TYPE "ParecerStatus" AS ENUM ('rascunho', 'finalizado');
CREATE TYPE "TipoUnidade" AS ENUM ('cmei', 'escola');

-- Users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          "Role" NOT NULL,
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token      VARCHAR(255) UNIQUE NOT NULL,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Unidades
CREATE TABLE unidades (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(200) NOT NULL,
  type       "TipoUnidade" NOT NULL,
  address    TEXT,
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Unidade <-> User (coordenadores/diretoras)
CREATE TABLE unidade_users (
  unidade_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL,
  PRIMARY KEY (unidade_id, user_id)
);

-- Turmas
CREATE TABLE turmas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  year        INTEGER NOT NULL,
  unidade_id  UUID NOT NULL REFERENCES unidades(id),
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Alunos
CREATE TABLE alunos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(200) NOT NULL,
  birth_date DATE,
  turma_id   UUID NOT NULL REFERENCES turmas(id),
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Professor <-> Turma
CREATE TABLE professor_turmas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES users(id),
  turma_id     UUID NOT NULL REFERENCES turmas(id),
  tipo_vinculo "TipoVinculo" DEFAULT 'regente',
  data_inicio  DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim     DATE,
  ativo        BOOLEAN DEFAULT true,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- Planejamentos
CREATE TABLE planejamentos (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id             UUID NOT NULL REFERENCES users(id),
  turma_id                 UUID NOT NULL REFERENCES turmas(id),
  week_start               DATE NOT NULL,
  campos_experiencia       JSONB DEFAULT '[]',
  objetivos                TEXT,
  conteudos                TEXT,
  mobilizacao              TEXT,
  desenvolvimento_propostas TEXT,
  anotacoes_finais         TEXT,
  status                   "PlanejamentoStatus" DEFAULT 'rascunho',
  coordenador_visto        BOOLEAN DEFAULT false,
  coordenador_obs          TEXT,
  vistado_por              VARCHAR(200),
  gerado_em_substituicao   BOOLEAN DEFAULT false,
  created_at               TIMESTAMP DEFAULT NOW(),
  updated_at               TIMESTAMP DEFAULT NOW()
);

-- Propostas
CREATE TABLE propostas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planejamento_id UUID NOT NULL REFERENCES planejamentos(id) ON DELETE CASCADE,
  day_of_week     INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 5),
  tipo            "TipoProposta" NOT NULL,
  descricao       TEXT NOT NULL,
  modalidade      "ModalidadeProposta" NOT NULL
);

-- Registros
CREATE TABLE registros (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id   UUID NOT NULL REFERENCES users(id),
  aluno_id       UUID NOT NULL REFERENCES alunos(id),
  turma_id       UUID NOT NULL REFERENCES turmas(id),
  date           DATE NOT NULL,
  observacao     TEXT NOT NULL,
  coordenador_obs TEXT,
  vistado        BOOLEAN DEFAULT false,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- Registro Anexos
CREATE TABLE registro_anexos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_id UUID NOT NULL REFERENCES registros(id) ON DELETE CASCADE,
  filename    VARCHAR(255) NOT NULL,
  mime_type   VARCHAR(100) NOT NULL,
  storage_url TEXT NOT NULL,
  size_bytes  INTEGER NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Pareceres
CREATE TABLE pareceres (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id           UUID NOT NULL REFERENCES users(id),
  aluno_id               UUID NOT NULL REFERENCES alunos(id),
  period                 VARCHAR(20) NOT NULL,
  text_ia                TEXT,
  text_final             TEXT,
  header                 TEXT,
  intro                  TEXT,
  pdf_url                TEXT,
  status                 "ParecerStatus" DEFAULT 'rascunho',
  gerado_em_substituicao BOOLEAN DEFAULT false,
  substituto_por         VARCHAR(200),
  created_at             TIMESTAMP DEFAULT NOW(),
  updated_at             TIMESTAMP DEFAULT NOW()
);

-- Notificações
CREATE TABLE notificacoes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  title      VARCHAR(200) NOT NULL,
  message    TEXT NOT NULL,
  read       BOOLEAN DEFAULT false,
  link       TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit logs
CREATE TABLE audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id),
  action     VARCHAR(100) NOT NULL,
  entity     VARCHAR(100) NOT NULL,
  entity_id  UUID,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_planejamentos_professor ON planejamentos(professor_id);
CREATE INDEX idx_planejamentos_turma ON planejamentos(turma_id);
CREATE INDEX idx_registros_aluno ON registros(aluno_id);
CREATE INDEX idx_registros_professor ON registros(professor_id);
CREATE INDEX idx_notificacoes_user ON notificacoes(user_id, read);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_professor_turmas_professor ON professor_turmas(professor_id, ativo);
