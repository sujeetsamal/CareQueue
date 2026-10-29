# ==============================================================================
# Multi-stage Dockerfile for CareQueue Backend (Java 21 / Spring Boot)
# ==============================================================================

# Stage 1: Build JAR using Maven and Eclipse Temurin JDK 21
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace/backend

# Copy Maven wrapper and POM for layer caching
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN chmod +x mvnw

# Download dependencies offline
RUN ./mvnw dependency:go-offline -B

# Copy source code and build production jar
COPY src src
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Minimal Production JRE Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create a non-privileged application user with data directory permissions
RUN addgroup -S carequeue && adduser -S carequeue -G carequeue \
    && mkdir -p /app/data && chown -R carequeue:carequeue /app
USER carequeue


# Copy packaged JAR from builder stage
COPY --from=builder /workspace/backend/target/carequeue-backend-*.jar app.jar

# Render / Cloud Platform Port Configuration
ENV PORT=8080
ENV SERVER_PORT=${PORT}
EXPOSE ${PORT}

# Healthcheck for container orchestrators
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-Dserver.port=${PORT}", "-jar", "app.jar"]
