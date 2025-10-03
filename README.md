# Dashboard de Vendas

## Descrição
Dashboard de vendas desenvolvido em Java Spring Boot com interface web moderna e responsiva. Permite análise de vendas por período, unidade e vendedor, com métricas de performance e gráficos interativos.

## Tecnologias Utilizadas
- **Backend**: Java 17, Spring Boot 3.1.5, Spring Data JPA
- **Frontend**: HTML5, CSS3, JavaScript ES6, Chart.js
- **Banco de Dados**: PostgreSQL
- **Build Tools**: Maven e Gradle (opcionais)

## Funcionalidades
✅ **Filtros Avançados**
- Filtro por unidade/filial
- Filtro por vendedor
- Filtro por período (data início e fim)

✅ **Métricas Principais**
- Total de vendas no período
- Ticket médio
- Seção MAX com destaques:
  - Maior venda do período
  - Vendedor que mais vendeu
  - Unidade que mais vendeu

✅ **Visualização**
- Gráfico de evolução das vendas
- Interface responsiva e moderna
- Design clean com tons de branco, azul marinho e laranja vibrante
- Animações suaves

## Pré-requisitos
- Java 17 ou superior
- PostgreSQL 12 ou superior
- Maven 3.6+ ou Gradle 7.0+

## Configuração do Banco de Dados

### 1. Criar o banco PostgreSQL
```sql
CREATE DATABASE dashboard_vendas;
```

### 2. Executar o script de inicialização
```bash
psql -U postgres -d dashboard_vendas -f database/init.sql
```

### 3. Configurar credenciais
Edite o arquivo `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/dashboard_vendas
spring.datasource.username=seu_usuario
spring.datasource.password=sua_senha
```

## Como Executar

### Opção 1: Setup Automático (Recomendado)
```bash
# Executar script de setup automático
./setup.sh
```

### Opção 2: Docker (Mais Fácil)
```bash
# Executar com Docker Compose
docker-compose up -d

# Parar os containers
docker-compose down
```

### Opção 3: Usando Gradle
```bash
# Instalar dependências
./gradlew build

# Executar aplicação
./gradlew bootRun
```

### Executar JAR
```bash
# Gerar JAR
./mvnw clean package
# ou
./gradlew build

# Executar
java -jar target/dashboard-vendas-0.0.1-SNAPSHOT.jar
```

## Acesso
Após iniciar a aplicação, acesse:
- **Dashboard**: http://localhost:8080
- **API Base**: http://localhost:8080/api

## Endpoints da API

### Dashboard
- `GET /api/dashboard?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD&filial=NOME&vendedor=NOME`
  - Retorna dados do dashboard com filtros

### Filtros
- `GET /api/filiais` - Lista todas as filiais
- `GET /api/vendedores` - Lista todos os vendedores

## Estrutura do Projeto
```
dashboard-vendas/
├── src/
│   ├── main/
│   │   ├── java/com/exemplo/dashboardvendas/
│   │   │   ├── controller/     # Controllers REST
│   │   │   ├── dto/           # Data Transfer Objects
│   │   │   ├── model/         # Entidades JPA
│   │   │   ├── repository/    # Repositórios JPA
│   │   │   ├── service/       # Lógica de negócio
│   │   │   └── DashboardVendasApplication.java
│   │   └── resources/
│   │       ├── static/        # CSS, JS, imagens
│   │       ├── templates/     # Templates Thymeleaf
│   │       └── application.properties
├── database/
│   └── init.sql              # Script de inicialização do BD
├── pom.xml                   # Configuração Maven
├── build.gradle             # Configuração Gradle
└── README.md
```

## Design e UX
- **Paleta de Cores**:
  - Branco predominante (#ffffff, #f8f9fa)
  - Azul marinho (#1e3a8a, #3b82f6)
  - Laranja vibrante (#f97316, #ea580c)
- **Tipografia**: Segoe UI (system fonts)
- **Ícones**: Font Awesome 6
- **Animações**: CSS transitions e keyframes
- **Responsivo**: Grid CSS e media queries

## Estrutura da Tabela de Vendas
```sql
CREATE TABLE vendas (
    id SERIAL PRIMARY KEY,
    cliente TEXT NOT NULL,
    vendedor TEXT NOT NULL,
    data_venda DATE NOT NULL,
    filial TEXT NOT NULL,
    valor_venda DECIMAL(10,2) NOT NULL
);
```

## Dados de Exemplo
O script `database/init.sql` inclui dados de exemplo com:
- 3 unidades (Centro, Norte, Sul)
- 3 vendedores (Maria Santos, Carlos Oliveira, Ana Rodriguez)
- Vendas distribuídas ao longo do ano
- Dados dos últimos 30 dias para teste

## Melhorias Futuras
- [ ] Autenticação e autorização
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Notificações em tempo real
- [ ] Dashboard mobile app
- [ ] Integração com sistemas ERP
- [ ] Cache Redis para performance
- [ ] Logs estruturados
- [ ] Métricas de performance (Micrometer)

## Contribuição
1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença
Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## Contato
Paulo - [seu-email@exemplo.com]

Link do Projeto: [https://github.com/seu-usuario/dashboard-vendas]