-- ============================================================
-- 008_remove_equipamento_detalhes.sql -- Remove observações
-- ============================================================

ALTER TABLE equipamentos DROP COLUMN IF EXISTS detalhes;
