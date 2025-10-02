# Build stage
FROM eclipse-temurin:25-jdk-alpine AS build
WORKDIR /app

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY src src

# Run only controller tests for REST API documentation generation
RUN --mount=type=cache,target=/root/.m2 ./mvnw -Dnet.bytebuddy.experimental=true clean package -Dtest="tech.omarshabaan.tasksmanagement.controller.**"

# Runtime stage
FROM eclipse-temurin:25-jre-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-Dnet.bytebuddy.experimental=true", "-jar", "app.jar"]
