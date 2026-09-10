-- ============================================================
-- 002_rls.sql  — Row Level Security
-- ============================================================

-- Habilitar RLS em TODAS as tabelas
ALTER TABLE hospitais          ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_equipamento  ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipamentos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_auditoria     ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes      ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HOSPITAIS
-- ============================================================

-- Qualquer autenticado vê hospitais ativos
CREATE POLICY "hospitais_select_autenticado"
  ON hospitais FOR SELECT
  TO authenticated
  USING (ativo = TRUE OR is_admin());

-- Só admin faz CRUD completo
CREATE POLICY "hospitais_insert_admin"
  ON hospitais FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "hospitais_update_admin"
  ON hospitais FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "hospitais_delete_admin"
  ON hospitais FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================
-- PERFIS
-- ============================================================

-- Usuário vê apenas o próprio perfil; admin vê todos
CREATE POLICY "perfis_select"
  ON perfis FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR is_admin());

-- Técnico pode atualizar apenas os próprios campos básicos
-- (não pode alterar role, nem hospital_id depois de selecionado)
CREATE POLICY "perfis_update_proprio"
  ON perfis FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM perfis WHERE id = auth.uid())  -- não altera própria role
    AND (
      -- pode alterar hospital_id APENAS se ainda não selecionou
      hospital_selecionado_em IS NULL
      OR hospital_id = (SELECT hospital_id FROM perfis WHERE id = auth.uid())
    )
  );

-- Admin pode atualizar qualquer perfil (inclusive hospital_id e role)
CREATE POLICY "perfis_update_admin"
  ON perfis FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Inserção feita apenas pelo trigger handle_new_user (service role)
-- Nenhuma policy de INSERT para authenticated

-- ============================================================
-- TIPOS_EQUIPAMENTO
-- ============================================================

CREATE POLICY "tipos_select_autenticado"
  ON tipos_equipamento FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "tipos_insert_autenticado"
  ON tipos_equipamento FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Só admin edita/exclui tipos existentes
CREATE POLICY "tipos_update_admin"
  ON tipos_equipamento FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "tipos_delete_admin"
  ON tipos_equipamento FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================
-- EQUIPAMENTOS
-- ============================================================

-- Técnico vê apenas equipamentos do próprio hospital
-- Admin vê tudo
CREATE POLICY "equipamentos_select"
  ON equipamentos FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR hospital_id = get_my_hospital_id()
  );

-- Técnico insere apenas no próprio hospital
CREATE POLICY "equipamentos_insert"
  ON equipamentos FOR INSERT
  TO authenticated
  WITH CHECK (
    (is_admin() OR hospital_id = get_my_hospital_id())
    AND auth.uid() IS NOT NULL
  );

-- Usuário do hospital edita itens pendentes e pode validá-los.
-- Admin pode editar qualquer item.
CREATE POLICY "equipamentos_update"
  ON equipamentos FOR UPDATE
  TO authenticated
  USING (
    is_admin()
    OR (hospital_id = get_my_hospital_id() AND status = 'pendente')
  )
  WITH CHECK (
    is_admin()
    OR (
      hospital_id = get_my_hospital_id()
    )
  );

-- Técnico exclui apenas pendentes do próprio hospital; admin exclui qualquer
CREATE POLICY "equipamentos_delete"
  ON equipamentos FOR DELETE
  TO authenticated
  USING (
    is_admin()
    OR (hospital_id = get_my_hospital_id() AND status = 'pendente')
  );

-- ============================================================
-- LOGS_AUDITORIA  (somente leitura para admin)
-- ============================================================

CREATE POLICY "audit_select_admin"
  ON logs_auditoria FOR SELECT
  TO authenticated
  USING (is_admin());

-- INSERT apenas via trigger (service role) — nenhuma policy de INSERT para authenticated
-- DELETE bloqueado para todos (imutável)

-- ============================================================
-- CONFIGURACOES  (somente admin)
-- ============================================================

CREATE POLICY "config_select_admin"
  ON configuracoes FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "config_update_admin"
  ON configuracoes FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
