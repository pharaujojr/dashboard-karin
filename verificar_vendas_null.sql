-- Verificar vendas com valor NULL
SELECT COUNT(*) as total_vendas_null, 
       MIN(id) as primeiro_id,
       MAX(id) as ultimo_id
FROM vendas_nacional 
WHERE valor_venda IS NULL;

-- Ver alguns exemplos
SELECT id, cliente, vendedor, data_venda, filial, valor_venda
FROM vendas_nacional 
WHERE valor_venda IS NULL 
LIMIT 10;
