-- ============================================================
-- 001_schema.sql  — Inventário TI Saluxx
-- Aplicar no Supabase SQL Editor (ordem importa!)
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE role_enum       AS ENUM ('tecnico', 'admin');
CREATE TYPE status_enum     AS ENUM ('pendente', 'validado');
CREATE TYPE acao_audit_enum AS ENUM ('criou', 'editou', 'excluiu', 'validou', 'exportou');

-- ============================================================
-- hospitais
-- ============================================================
CREATE TABLE hospitais (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome       TEXT NOT NULL,
  codigo     TEXT NOT NULL UNIQUE,
  cidade     TEXT NOT NULL DEFAULT '',
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hospitais_ativo  ON hospitais(ativo);
CREATE INDEX idx_hospitais_codigo ON hospitais(codigo);

-- ============================================================
-- perfis  (1:1 com auth.users)
-- ============================================================
CREATE TABLE perfis (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome                    TEXT NOT NULL DEFAULT '',
  email                   TEXT NOT NULL DEFAULT '',
  hospital_id             UUID REFERENCES hospitais(id) ON DELETE SET NULL,
  role                    role_enum NOT NULL DEFAULT 'tecnico',
  hospital_selecionado_em TIMESTAMPTZ,          -- bloqueia re-seleção pelo próprio usuário
  ultimo_acesso           TIMESTAMPTZ,
  criado_em               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_perfis_hospital ON perfis(hospital_id);
CREATE INDEX idx_perfis_role     ON perfis(role);

-- ============================================================
-- tipos_equipamento
-- ============================================================
CREATE TABLE tipos_equipamento (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome       TEXT NOT NULL UNIQUE,
  criado_por UUID REFERENCES perfis(id) ON DELETE SET NULL,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- equipamentos
-- ============================================================
CREATE TABLE equipamentos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome          TEXT NOT NULL,
  tipo_id       UUID NOT NULL REFERENCES tipos_equipamento(id),
  numero_serie  TEXT,
  patrimonio    TEXT NOT NULL,
  status        status_enum NOT NULL DEFAULT 'pendente',
  hospital_id   UUID NOT NULL REFERENCES hospitais(id),
  criado_por    UUID REFERENCES perfis(id) ON DELETE SET NULL,
  validado_por  UUID REFERENCES perfis(id) ON DELETE SET NULL,
  validado_em   TIMESTAMPTZ,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- patrimônio único por hospital
  CONSTRAINT uq_patrimonio_hospital UNIQUE (hospital_id, patrimonio)
);

CREATE INDEX idx_equip_hospital  ON equipamentos(hospital_id);
CREATE INDEX idx_equip_status    ON equipamentos(status);
CREATE INDEX idx_equip_tipo      ON equipamentos(tipo_id);
CREATE INDEX idx_equip_patrimonio ON equipamentos(patrimonio);

-- ============================================================
-- logs_auditoria
-- ============================================================
CREATE TABLE logs_auditoria (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id     UUID REFERENCES perfis(id) ON DELETE SET NULL,
  acao           acao_audit_enum NOT NULL,
  equipamento_id UUID,          -- pode ser NULL se equip foi excluído
  hospital_id    UUID REFERENCES hospitais(id) ON DELETE SET NULL,
  dados_antes    JSONB,
  dados_depois   JSONB,
  ip_address     INET,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_usuario    ON logs_auditoria(usuario_id);
CREATE INDEX idx_audit_hospital   ON logs_auditoria(hospital_id);
CREATE INDEX idx_audit_acao       ON logs_auditoria(acao);
CREATE INDEX idx_audit_criado_em  ON logs_auditoria(criado_em DESC);
CREATE INDEX idx_audit_equip_id   ON logs_auditoria(equipamento_id);

-- ============================================================
-- configuracoes  (chave-valor para settings do sistema)
-- ============================================================
CREATE TABLE configuracoes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chave       TEXT NOT NULL UNIQUE,
  valor       TEXT,                  -- JSON ou string simples
  descricao   TEXT,
  sensivel    BOOLEAN NOT NULL DEFAULT FALSE,  -- se TRUE, valor fica mascarado no front
  atualizado_por UUID REFERENCES perfis(id) ON DELETE SET NULL,
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Registros iniciais (vazios)
INSERT INTO configuracoes (chave, descricao, sensivel) VALUES
  ('ms_tenant_id',       'Azure Tenant ID para integração Microsoft',       TRUE),
  ('ms_client_id',       'Azure Client ID para integração Microsoft',       TRUE),
  ('ms_client_secret',   'Azure Client Secret para integração Microsoft',   TRUE),
  ('ms_drive_id',        'OneDrive/SharePoint Drive ID',                    FALSE),
  ('ms_planilha_path',   'Caminho da planilha no OneDrive (ex: /Inventario.xlsx)', FALSE),
  ('ms_integracao_ativa','Habilita envio automático para planilha (true/false)',    FALSE);

-- ============================================================
-- FUNÇÕES AUXILIARES
-- ============================================================

-- Retorna hospital_id do usuário logado
CREATE OR REPLACE FUNCTION get_my_hospital_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT hospital_id FROM perfis WHERE id = auth.uid();
$$;

-- Verifica se o usuário logado é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM perfis WHERE id = auth.uid()),
    FALSE
  );
$$;

-- Atualiza atualizado_em automaticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_hospitais_updated_at
  BEFORE UPDATE ON hospitais
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_perfis_updated_at
  BEFORE UPDATE ON perfis
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_equipamentos_updated_at
  BEFORE UPDATE ON equipamentos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
