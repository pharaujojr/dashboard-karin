-- Verificar dados no período da competição de bonés
-- Período: 19/11/2025 até 31/12/2025

-- 1. Verificar se existem vendas com bone='SIM' no período
SELECT 
    COUNT(*) as total_vendas,
    COUNT(DISTINCT vendedor) as total_vendedores,
    SUM(valor_venda) as valor_total
FROM vendas_nacional
WHERE bone = 'SIM'
  AND filial IN ('Sorriso', 'Lucas do Rio Verde', 'Sinop')
  AND data_venda BETWEEN '2025-11-19' AND '2025-12-31';

-- 2. Verificar distribuição por filial
SELECT 
    filial,
    COUNT(*) as qtd_vendas,
    SUM(valor_venda) as total
FROM vendas_nacional
WHERE bone = 'SIM'
  AND filial IN ('Sorriso', 'Lucas do Rio Verde', 'Sinop')
  AND data_venda BETWEEN '2025-11-19' AND '2025-12-31'
GROUP BY filial
ORDER BY total DESC;

-- 3. Top 5 vendedores no período
SELECT 
    vendedor,
    filial,
    COUNT(*) as qtd_vendas,
    SUM(valor_venda) as total
FROM vendas_nacional
WHERE bone = 'SIM'
  AND filial IN ('Sorriso', 'Lucas do Rio Verde', 'Sinop')
  AND data_venda BETWEEN '2025-11-19' AND '2025-12-31'
GROUP BY vendedor, filial
ORDER BY total DESC
LIMIT 5;

-- 4. Verificar range de datas disponíveis com bone='SIM'
SELECT 
    MIN(data_venda) as data_mais_antiga,
    MAX(data_venda) as data_mais_recente
FROM vendas_nacional
WHERE bone = 'SIM'
  AND filial IN ('Sorriso', 'Lucas do Rio Verde', 'Sinop');

-- 5. Verificar se há vendas HOJE (20/11/2025)
SELECT 
    COUNT(*) as vendas_hoje,
    SUM(valor_venda) as total_hoje
FROM vendas_nacional
WHERE bone = 'SIM'
  AND filial IN ('Sorriso', 'Lucas do Rio Verde', 'Sinop')
  AND data_venda = '2025-11-20';
