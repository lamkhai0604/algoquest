# Build context: the repository root (the jar includes content/, D-033).
#   docker build -f backend/Dockerfile .

# Build stage: compile and package the Spring Boot jar (tests run in CI, not here).
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app/backend
COPY backend/pom.xml .
RUN mvn -B -q dependency:go-offline
COPY backend/src src
COPY content /app/content
RUN mvn -B -q package -DskipTests -Dspotless.check.skip=true

# Runtime stage: JRE only, non-root user.
FROM eclipse-temurin:21-jre
RUN useradd --system --uid 10001 app
WORKDIR /app
COPY --from=build /app/backend/target/algoquest-backend.jar app.jar
USER app
EXPOSE 8080
# Fits the 512 MB free instance (D-037): serial GC, smaller thread stacks, heap at 70% of memory.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70", "-XX:+UseSerialGC", "-Xss512k", "-XX:TieredStopAtLevel=1", "-jar", "/app/app.jar"]
