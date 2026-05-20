FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /workspace
ARG MODULE
COPY . .
RUN --mount=type=cache,target=/root/.m2/repository mvn -s .mvn/settings.xml -pl ${MODULE} -am -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
ARG MODULE
ENV JAVA_OPTS=""
COPY --from=build /workspace/${MODULE}/target/${MODULE}-0.1.0-SNAPSHOT.jar app.jar
EXPOSE 8080 8101 8102 8103 8104 8105 8106 8107 8108 8109 8110
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
