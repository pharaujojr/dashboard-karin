# Estágio 1: Build
FROM eclipse-temurin:17-jdk-alpine AS build

WORKDIR /app

# Copiar arquivos de configuração do Gradle
COPY build.gradle .
COPY settings.gradle* .
COPY gradlew .
COPY gradle gradle

# Baixar dependências
RUN ./gradlew dependencies --no-daemon

# Copiar código fonte
COPY src src

# Build da aplicação
RUN ./gradlew clean build -x test --no-daemon

# Estágio 2: Runtime
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Instalar curl para health checks
RUN apk add --no-cache curl

# Criar usuário não-root
RUN addgroup -g 1001 -S dashboard && \
    adduser -S dashboard -u 1001 -G dashboard

# Copiar JAR do estágio de build
COPY --from=build /app/build/libs/dashboard-vendas-*.jar app.jar

# Definir propriedades do usuário
RUN chown dashboard:dashboard app.jar
USER dashboard

# Porta da aplicação
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# Comando para executar a aplicação
ENTRYPOINT ["java", "-jar", "app.jar"]