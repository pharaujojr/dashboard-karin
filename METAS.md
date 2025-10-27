# Sistema de Metas - Dashboard de Vendas

## Visão Geral

O sistema de metas permite armazenar e gerenciar valores de meta para cada filial em períodos específicos.

## Estrutura do Banco de Dados

### Tabela: `metas`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | BIGINT | Identificador único (auto-increment) |
| filial | VARCHAR(100) | Nome da filial |
| valor_meta | DECIMAL(15,2) | Valor da meta em reais |
| data_inicio | DATE | Data de início do período |
| data_fim | DATE | Data de fim do período |
| ativa | BOOLEAN | Indica se a meta está ativa |
| descricao | VARCHAR(255) | Descrição da meta |

**Constraint**: Não pode haver duas metas ativas para a mesma filial no mesmo período.

## API Endpoints

### 1. Buscar Meta de uma Filial

```http
GET /api/metas/filial?filial=Jaraguá do Sul&dataInicio=2025-10-27&dataFim=2025-10-31
```

**Resposta:**
```json
{
  "filial": "Jaraguá do Sul",
  "valorMeta": 1000000.00,
  "dataInicio": "2025-10-27",
  "dataFim": "2025-10-31"
}
```

### 2. Buscar Metas de Múltiplas Filiais

```http
GET /api/metas/filiais?filial=Jaraguá do Sul&filial=Matupá&dataInicio=2025-10-27&dataFim=2025-10-31
```

**Resposta:**
```json
{
  "Jaraguá do Sul": 1000000.00,
  "Matupá": 1000000.00
}
```

### 3. Criar Nova Meta

```http
POST /api/metas
Content-Type: application/json

{
  "filial": "Jaraguá do Sul",
  "valorMeta": 1500000.00,
  "dataInicio": "2025-11-01",
  "dataFim": "2025-11-30",
  "ativa": true,
  "descricao": "Meta Novembro 2025"
}
```

### 4. Atualizar Meta

```http
PUT /api/metas/{id}
Content-Type: application/json

{
  "filial": "Jaraguá do Sul",
  "valorMeta": 2000000.00,
  "dataInicio": "2025-10-27",
  "dataFim": "2025-10-31",
  "ativa": true,
  "descricao": "Meta atualizada"
}
```

### 5. Desativar Meta

```http
DELETE /api/metas/{id}
```

### 6. Listar Todas as Metas Ativas

```http
GET /api/metas
```

### 7. Histórico de Metas de uma Filial

```http
GET /api/metas/filial/Jaraguá do Sul/historico
```

## Uso no Código

### Service Layer

```java
@Autowired
private MetaService metaService;

// Buscar meta para uma filial
BigDecimal meta = metaService.obterMetaPorFilialEPeriodo(
    "Jaraguá do Sul", 
    LocalDate.of(2025, 10, 27), 
    LocalDate.of(2025, 10, 31)
);

// Buscar metas para múltiplas filiais
List<String> filiais = Arrays.asList("Jaraguá do Sul", "Matupá", "Sorriso");
Map<String, BigDecimal> metas = metaService.obterMetasPorFiliaisEPeriodo(
    filiais,
    LocalDate.of(2025, 10, 27),
    LocalDate.of(2025, 10, 31)
);

// Criar nova meta
Meta novaMeta = metaService.criarMeta(
    "Jaraguá do Sul",
    new BigDecimal("1500000.00"),
    LocalDate.of(2025, 11, 1),
    LocalDate.of(2025, 11, 30),
    "Meta Novembro 2025"
);
```

## SQL - Operações Comuns

### Inserir Nova Meta
```sql
INSERT INTO metas (filial, valor_meta, data_inicio, data_fim, ativa, descricao)
VALUES ('Jaraguá do Sul', 1500000.00, '2025-11-01', '2025-11-30', TRUE, 'Meta Novembro');
```

### Atualizar Valor da Meta
```sql
UPDATE metas 
SET valor_meta = 2000000.00 
WHERE filial = 'Jaraguá do Sul' 
  AND data_inicio = '2025-10-27' 
  AND data_fim = '2025-10-31';
```

### Desativar Meta
```sql
UPDATE metas 
SET ativa = FALSE 
WHERE id = 1;
```

### Consultar Metas Ativas de uma Filial
```sql
SELECT * FROM metas 
WHERE filial = 'Jaraguá do Sul' 
  AND ativa = TRUE 
  AND data_inicio <= '2025-10-31' 
  AND data_fim >= '2025-10-27'
ORDER BY data_inicio DESC;
```

## Metas Padrão

Se não houver meta cadastrada para uma filial em um período específico, o sistema retorna automaticamente o valor padrão de **R$ 1.000.000,00**.

## Filiais Suportadas

- Jaraguá do Sul
- Matupá
- Sorriso
- Lucas do Rio Verde
- Sinop

## Migração Inicial

A migração `V2__criar_tabela_metas.sql` cria a tabela e insere metas padrão de R$ 1.000.000,00 para todas as filiais no período do Closing Day (27/10/2025 a 31/10/2025).

## Exemplos de Uso

### Criar meta diferenciada para período específico
```sql
-- Meta maior para unidade com melhor desempenho
INSERT INTO metas (filial, valor_meta, data_inicio, data_fim, ativa, descricao)
VALUES ('Jaraguá do Sul', 1500000.00, '2025-12-01', '2025-12-31', TRUE, 'Meta Dezembro - Black Friday');

-- Meta consolidada para região
INSERT INTO metas (filial, valor_meta, data_inicio, data_fim, ativa, descricao)
VALUES ('Mato Grosso', 4000000.00, '2025-12-01', '2025-12-31', TRUE, 'Meta agregada MT');
```

### Ajustar meta durante o período
```sql
-- Aumentar meta no meio do mês
UPDATE metas 
SET valor_meta = 1800000.00,
    descricao = 'Meta ajustada - desempenho excepcional'
WHERE filial = 'Jaraguá do Sul' 
  AND data_inicio = '2025-10-27';
```
