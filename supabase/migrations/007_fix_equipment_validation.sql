-- ============================================================
-- 007_fix_equipment_validation.sql -- Cadastro e validação local
-- ============================================================

-- Salvar inicialmente como validado também registra quem validou e quando.
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

DROP TRIGGER IF EXISTS trg_enforce_validacao ON equipamentos;
CREATE TRIGGER trg_enforce_validacao
  BEFORE INSERT OR UPDATE ON equipamentos
  FOR EACH ROW EXECUTE FUNCTION enforce_validacao();

-- Qualquer usuário autenticado pode validar itens do próprio hospital.
DROP POLICY IF EXISTS "equipamentos_update" ON equipamentos;
CREATE POLICY "equipamentos_update"
  ON equipamentos FOR UPDATE
  TO authenticated
  USING (
    is_admin()
    OR (hospital_id = get_my_hospital_id() AND status = 'pendente')
  )
  WITH CHECK (
    is_admin()
    OR hospital_id = get_my_hospital_id()
  );
