-- Script para adicionar meta da filial Nova Mutum
-- Execute este script no seu banco de dados PostgreSQL

INSERT INTO metas (filial, valor_meta, data_inicio, data_fim, ativa, descricao)
VALUES (
    'Nova Mutum',
    1000000.00,
    '2025-01-01',
    '2025-12-31',
    true,
    'Meta anual 2025 - Nova Mutum'
);

-- Verificar se foi inserido corretamente
SELECT * FROM metas WHERE filial = 'Nova Mutum';
