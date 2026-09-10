-- ============================================================
-- 006_hospitais_tocantins.sql -- Substitui hospitais de exemplo
-- ============================================================

-- Reaproveita os primeiros 16 registros de exemplo para preservar qualquer
-- vínculo já existente com perfis ou equipamentos.
WITH hospitais_reais(codigo_antigo, codigo, nome, cidade) AS (
  VALUES
    ('HSP-001', 'HRA',   'HRA – Hospital Regional de Araguaína',          'Araguaína'),
    ('HSP-002', 'HMDR',  'HMDR – Hospital e Maternidade Dona Regina',     'Palmas'),
    ('HSP-003', 'HRG',   'HRG – Hospital Regional de Gurupi',             'Gurupi'),
    ('HSP-004', 'HRPT',  'HRPT – Hospital Regional Paraíso do Tocantins', 'Paraíso do Tocantins'),
    ('HSP-005', 'HRPN',  'HRPN – Hospital Regional de Porto Nacional',    'Porto Nacional'),
    ('HSP-006', 'HMITD', 'HMITD – Hospital e Maternidade Tia Dedé',       'Porto Nacional'),
    ('HSP-007', 'HRGUA', 'HRGUA – Hospital Regional de Guaraí',           'Guaraí'),
    ('HSP-008', 'HRM',   'HRM – Hospital Regional de Miracema',           'Miracema'),
    ('HSP-009', 'HRAUG', 'HRAUG – Hospital Regional de Augustinópolis',   'Augustinópolis'),
    ('HSP-010', 'HRPA',  'HRPA – Hospital Regional de Pedro Afonso',      'Pedro Afonso'),
    ('HSP-011', 'HMR',   'HMR – Hospital e Maternidade Irmã Rita',        'Araguatins'),
    ('HSP-012', 'HRTC',  'HRTC – Hospital de Referência de Araguaçu',     'Araguaçu'),
    ('HSP-013', 'HIARR', 'HIARR – Hospital Regional de Arraias',          'Arraias'),
    ('HSP-014', 'HRD',   'HRD – Hospital de Referência de Dianópolis',    'Dianópolis'),
    ('HSP-015', 'HRX',   'HRX – Hospital Regional de Xambioá',            'Xambioá'),
    ('HSP-016', 'HRAV',  'HRAV – Hospital Regional de Alvorada',          'Alvorada')
)
UPDATE hospitais AS hospital
SET
  codigo = reais.codigo,
  nome = reais.nome,
  cidade = reais.cidade,
  ativo = TRUE
FROM hospitais_reais AS reais
WHERE hospital.codigo = reais.codigo_antigo
  AND NOT EXISTS (
    SELECT 1 FROM hospitais existente WHERE existente.codigo = reais.codigo
  );

INSERT INTO hospitais (nome, codigo, cidade, ativo)
VALUES
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
ON CONFLICT (codigo) DO UPDATE
SET
  nome = EXCLUDED.nome,
  cidade = EXCLUDED.cidade,
  ativo = TRUE;

-- Os exemplos que não foram reaproveitados deixam de aparecer no aplicativo.
UPDATE hospitais
SET ativo = FALSE
WHERE codigo LIKE 'HSP-%';
