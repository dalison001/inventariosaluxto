-- ============================================================
-- 003_triggers.sql  — Triggers de auditoria e novo usuário
-- ============================================================

-- ============================================================
-- Trigger: cria perfil automaticamente ao registrar usuário
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfis (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Trigger: atualiza ultimo_acesso no perfil
-- ============================================================
CREATE OR REPLACE FUNCTION handle_user_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.perfis
  SET ultimo_acesso = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- ============================================================
-- Trigger: auditoria automática em equipamentos
-- ============================================================
CREATE OR REPLACE FUNCTION audit_equipamentos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_acao       acao_audit_enum;
  v_antes      JSONB := NULL;
  v_depois     JSONB := NULL;
  v_usuario_id UUID;
  v_hospital_id UUID;
  v_equip_id   UUID;
BEGIN
  -- Identifica o usuário atual
  v_usuario_id := auth.uid();

  IF TG_OP = 'INSERT' THEN
    v_acao        := 'criou';
    v_depois      := to_jsonb(NEW);
    v_hospital_id := NEW.hospital_id;
    v_equip_id    := NEW.id;

  ELSIF TG_OP = 'UPDATE' THEN
    v_antes       := to_jsonb(OLD);
    v_depois      := to_jsonb(NEW);
    v_hospital_id := NEW.hospital_id;
    v_equip_id    := NEW.id;

    -- Identifica se foi uma validação
    IF OLD.status = 'pendente' AND NEW.status = 'validado' THEN
      v_acao := 'validou';
    ELSE
      v_acao := 'editou';
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_acao        := 'excluiu';
    v_antes       := to_jsonb(OLD);
    v_hospital_id := OLD.hospital_id;
    v_equip_id    := OLD.id;
  END IF;

  INSERT INTO logs_auditoria (
    usuario_id,
    acao,
    equipamento_id,
    hospital_id,
    dados_antes,
    dados_depois
  ) VALUES (
    v_usuario_id,
    v_acao,
    v_equip_id,
    v_hospital_id,
    v_antes,
    v_depois
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_audit_equipamentos
  AFTER INSERT OR UPDATE OR DELETE ON equipamentos
  FOR EACH ROW EXECUTE FUNCTION audit_equipamentos();

-- ============================================================
-- Trigger: garante que validado_por e validado_em sejam
--          preenchidos ao mudar status para 'validado'
-- ============================================================
CREATE OR REPLACE FUNCTION enforce_validacao()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'validado' AND (TG_OP = 'INSERT' OR OLD.status = 'pendente') THEN
    NEW.validado_por := auth.uid();
    NEW.validado_em  := NOW();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_validacao
  BEFORE INSERT OR UPDATE ON equipamentos
  FOR EACH ROW
  EXECUTE FUNCTION enforce_validacao();
