-- Criação da tabela de metas
CREATE TABLE IF NOT EXISTS metas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    filial VARCHAR(100) NOT NULL,
    valor_meta DECIMAL(15, 2) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    descricao VARCHAR(255),
    UNIQUE KEY uk_meta_filial_periodo (filial, data_inicio, data_fim)
);

-- Inserir metas padrão para o período do Closing Day (27/10/2025 a 31/10/2025)
INSERT INTO metas (filial, valor_meta, data_inicio, data_fim, ativa, descricao) VALUES
('Jaraguá do Sul', 1000000.00, '2025-10-27', '2025-10-31', TRUE, 'Meta Closing Day Nacional 2025'),
('Matupá', 1000000.00, '2025-10-27', '2025-10-31', TRUE, 'Meta Closing Day Nacional 2025'),
('Sorriso', 1000000.00, '2025-10-27', '2025-10-31', TRUE, 'Meta Closing Day Nacional 2025'),
('Lucas do Rio Verde', 1000000.00, '2025-10-27', '2025-10-31', TRUE, 'Meta Closing Day Nacional 2025'),
('Sinop', 1000000.00, '2025-10-27', '2025-10-31', TRUE, 'Meta Closing Day Nacional 2025')
ON DUPLICATE KEY UPDATE 
    valor_meta = VALUES(valor_meta),
    ativa = VALUES(ativa),
    descricao = VALUES(descricao);

-- Exemplo de como alterar a meta de uma filial específica:
-- UPDATE metas SET valor_meta = 1500000.00 WHERE filial = 'Jaraguá do Sul' AND data_inicio = '2025-10-27';

-- Exemplo de como criar meta para um novo período:
-- INSERT INTO metas (filial, valor_meta, data_inicio, data_fim, ativa, descricao) 
-- VALUES ('Jaraguá do Sul', 2000000.00, '2025-11-01', '2025-11-30', TRUE, 'Meta Novembro 2025');
