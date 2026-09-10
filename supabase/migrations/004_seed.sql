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
-- Hospitais da rede estadual do Tocantins
-- ============================================================
INSERT INTO hospitais (nome, codigo, cidade, ativo) VALUES
  ('HRA – Hospital Regional de Araguaína',          'HRA',   'Araguaína',            TRUE),
  ('HMDR – Hospital e Maternidade Dona Regina',     'HMDR',  'Palmas',               TRUE),
  ('HRG – Hospital Regional de Gurupi',             'HRG',   'Gurupi',               TRUE),
  ('HRPT – Hospital Regional Paraíso do Tocantins', 'HRPT',  'Paraíso do Tocantins', TRUE),
  ('HRPN – Hospital Regional de Porto Nacional',    'HRPN',  'Porto Nacional',       TRUE),
  ('HMITD – Hospital e Maternidade Tia Dedé',       'HMITD', 'Porto Nacional',       TRUE),
  ('HRGUA – Hospital Regional de Guaraí',           'HRGUA', 'Guaraí',               TRUE),
  ('HRM – Hospital Regional de Miracema',           'HRM',   'Miracema',             TRUE),
  ('HRAUG – Hospital Regional de Augustinópolis',   'HRAUG', 'Augustinópolis',       TRUE),
  ('HRPA – Hospital Regional de Pedro Afonso',      'HRPA',  'Pedro Afonso',         TRUE),
  ('HMR – Hospital e Maternidade Irmã Rita',        'HMR',   'Araguatins',           TRUE),
  ('HRTC – Hospital de Referência de Araguaçu',     'HRTC',  'Araguaçu',             TRUE),
  ('HIARR – Hospital Regional de Arraias',          'HIARR', 'Arraias',              TRUE),
  ('HRD – Hospital de Referência de Dianópolis',    'HRD',   'Dianópolis',           TRUE),
  ('HRX – Hospital Regional de Xambioá',            'HRX',   'Xambioá',              TRUE),
  ('HRAV – Hospital Regional de Alvorada',          'HRAV',  'Alvorada',             TRUE)
ON CONFLICT (codigo) DO NOTHING;
