-- ============================================================
-- 005_fix_profile_rls.sql -- Corrige seleção inicial de hospital
-- ============================================================

-- As funções SECURITY DEFINER leem o perfil sem acionar as policies da
-- própria tabela, evitando recursão durante o UPDATE do técnico.
CREATE OR REPLACE FUNCTION get_my_profile_role()
RETURNS role_enum
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM perfis WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_my_selected_hospital_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT hospital_id FROM perfis WHERE id = auth.uid();
$$;

DROP POLICY IF EXISTS "perfis_update_proprio" ON perfis;

-- O técnico só atualiza o próprio perfil, não altera o cargo e só escolhe
-- hospital quando ainda não há um hospital vinculado à sua conta.
CREATE POLICY "perfis_update_proprio"
  ON perfis FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = get_my_profile_role()
    AND (
      get_my_selected_hospital_id() IS NULL
      OR hospital_id = get_my_selected_hospital_id()
    )
  );
