# 🚀 Início Rápido - Dashboard de Vendas

## ⚡ Setup em 3 Passos

### 1. Executar Setup Automático
```bash
./setup.sh
```

### 2. OU usar Docker (mais fácil)
```bash
docker-compose up -d
```

### 3. Acessar Dashboard
```
http://localhost:8080
```

## 📊 Funcionalidades Principais

✅ **Filtros**: Unidade, Vendedor, Período  
✅ **Métricas**: Total de Vendas, Ticket Médio  
✅ **Destaques**: Maior Venda, Top Vendedor, Top Unidade  
✅ **Gráfico**: Evolução das vendas no período  
✅ **Design**: Clean, responsivo, animações suaves  

## 🎨 Tecnologias

- **Backend**: Java 17 + Spring Boot 3.1.5
- **Frontend**: HTML5 + CSS3 + JavaScript + Chart.js  
- **Banco**: PostgreSQL 15
- **Build**: Maven + Gradle
- **Deploy**: Docker + Docker Compose

## 🔧 Comandos Úteis

```bash
# Gradle  
./gradlew bootRun

# Build
./gradlew build

# Docker
docker-compose up -d
docker-compose logs -f dashboard

# Parar Docker
docker-compose down
```

## 📱 Endpoints API

- `GET /api/dashboard` - Dados do dashboard
- `GET /api/filiais` - Lista de unidades  
- `GET /api/vendedores` - Lista de vendedores

## 🗃️ Banco de Dados

```sql
-- Estrutura da tabela
CREATE TABLE vendas (
    id SERIAL PRIMARY KEY,
    cliente TEXT NOT NULL,
    vendedor TEXT NOT NULL, 
    data_venda DATE NOT NULL,
    filial TEXT NOT NULL,
    valor_venda DECIMAL(10,2) NOT NULL
);
```

## 🚨 Pré-requisitos

- Java 17+
- PostgreSQL (tabela vendas_nacional já existente)
- Gradle 7.0+
- Docker (opcional)

## 🎯 Paleta de Cores

- **Branco**: #ffffff, #f8f9fa (predominante)
- **Azul Marinho**: #1e3a8a, #3b82f6  
- **Laranja Vibrante**: #f97316, #ea580c

---

**Criado por Paulo** | **Java Spring Boot Dashboard** 🔥