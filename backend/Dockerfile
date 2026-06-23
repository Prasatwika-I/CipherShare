# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy the application source code
COPY src ./src

# Build the application (skipping tests for faster deployment)
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy the built jar file from the build stage
COPY --from=build /app/target/CipherShare-1.0-SNAPSHOT.jar app.jar

# Expose the port (Render will override this via the PORT env var)
EXPOSE 8081

# Run the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
