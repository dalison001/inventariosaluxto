-- ============================================================
-- 004_seed.sql  — Dados iniciais
-- ============================================================

-- Tipos de equipamento pré-definidos
INSERT INTO tipos_equipamento (id, nome) VALUES
  (uuid_generate_v4(), 'PC/Desktop'),
  (uuid_generate_v4(), 'Monitor'),
  (uuid_generate_v4(), 'TV'),
  (uuid_generate_v4(), 'Impressora'),
  (uuid_generate_v4(), 'Notebook'),
  (uuid_generate_v4(), 'Scanner'),
  (uuid_generate_v4(), 'Roteador/Switch'),
  (uuid_generate_v4(), 'Servidor'),
  (uuid_generate_v4(), 'Tablet'),
  (uuid_generate_v4(), 'Telefone IP')
ON CONFLICT (nome) DO NOTHING;

-- ============================================================
-- Hospitais (substitua pelos dados reais da sua rede)
-- Você pode editar estes dados diretamente no admin do sistema
-- ============================================================
INSERT INTO hospitais (nome, codigo, cidade, ativo) VALUES
  ('Hospital 01', 'HSP-001', 'Cidade 1', TRUE),
  ('Hospital 02', 'HSP-002', 'Cidade 2', TRUE),
  ('Hospital 03', 'HSP-003', 'Cidade 3', TRUE),
  ('Hospital 04', 'HSP-004', 'Cidade 4', TRUE),
  ('Hospital 05', 'HSP-005', 'Cidade 5', TRUE),
  ('Hospital 06', 'HSP-006', 'Cidade 6', TRUE),
  ('Hospital 07', 'HSP-007', 'Cidade 7', TRUE),
  ('Hospital 08', 'HSP-008', 'Cidade 8', TRUE),
  ('Hospital 09', 'HSP-009', 'Cidade 9', TRUE),
  ('Hospital 10', 'HSP-010', 'Cidade 10', TRUE),
  ('Hospital 11', 'HSP-011', 'Cidade 11', TRUE),
  ('Hospital 12', 'HSP-012', 'Cidade 12', TRUE),
  ('Hospital 13', 'HSP-013', 'Cidade 13', TRUE),
  ('Hospital 14', 'HSP-014', 'Cidade 14', TRUE),
  ('Hospital 15', 'HSP-015', 'Cidade 15', TRUE),
  ('Hospital 16', 'HSP-016', 'Cidade 16', TRUE),
  ('Hospital 17', 'HSP-017', 'Cidade 17', TRUE),
  ('Hospital 18', 'HSP-018', 'Cidade 18', TRUE),
  ('Hospital 19', 'HSP-019', 'Cidade 19', TRUE),
  ('Hospital 20', 'HSP-020', 'Cidade 20', TRUE),
  ('Hospital 21', 'HSP-021', 'Cidade 21', TRUE),
  ('Hospital 22', 'HSP-022', 'Cidade 22', TRUE),
  ('Hospital 23', 'HSP-023', 'Cidade 23', TRUE),
  ('Hospital 24', 'HSP-024', 'Cidade 24', TRUE),
  ('Hospital 25', 'HSP-025', 'Cidade 25', TRUE)
ON CONFLICT (codigo) DO NOTHING;
