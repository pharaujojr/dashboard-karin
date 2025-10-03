#!/bin/bash

echo "🚀 Configurando Dashboard de Vendas..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL não está instalado!"
    print_status "Para instalar no Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    print_status "Para instalar no CentOS/RHEL: sudo yum install postgresql postgresql-server"
    print_status "Para instalar no macOS: brew install postgresql"
    exit 1
fi

print_success "PostgreSQL encontrado!"

# Verificar se Java está instalado
if ! command -v java &> /dev/null; then
    print_error "Java não está instalado!"
    print_status "Instale Java 17 ou superior"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 17 ]; then
    print_error "Java 17 ou superior é necessário. Versão atual: $JAVA_VERSION"
    exit 1
fi

print_success "Java $JAVA_VERSION encontrado!"

# Perguntar se deseja configurar o banco
echo
print_success "Usando banco de dados existente configurado em application.properties"

# Perguntar qual build tool usar
echo
echo "Usando Gradle como build tool..."
BUILD_TOOL="gradle"
BUILD_CMD="./gradlew"

print_success "Build tool selecionado: $BUILD_TOOL"

# Verificar se o wrapper existe
if [ ! -f "$BUILD_CMD" ]; then
    print_error "Wrapper $BUILD_CMD não encontrado!"
    print_error "Por favor, execute 'gradle wrapper' para gerar o wrapper Gradle"
    exit 1
fi

# Tornar executável
chmod +x "$BUILD_CMD"

# Compilar projeto
print_status "Compilando projeto..."
$BUILD_CMD build

if [ $? -eq 0 ]; then
    print_success "Projeto compilado com sucesso!"
else
    print_error "Falha na compilação!"
    exit 1
fi

# Perguntar se deseja executar
echo
read -p "Deseja executar a aplicação agora? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Iniciando aplicação..."
    print_status "Acesse http://localhost:8080 após a inicialização"
    echo
    
    $BUILD_CMD bootRun
else
    echo
    print_success "Setup concluído!"
    print_status "Para executar a aplicação:"
    print_status "  $BUILD_CMD bootRun"
    print_status "Depois acesse: http://localhost:8080"
fi