FROM eclipse-temurin:17-jdk-jammy AS sqlite-native

WORKDIR /work
COPY skn-api.jar /work/skn-api.jar

RUN set -eux; \
    nested_jar=$(jar tf /work/skn-api.jar \
      | awk '/^BOOT-INF\/lib\/sqlite-jdbc-[^/]+\.jar$/ { print; exit }'); \
    test -n "$nested_jar"; \
    jar xf /work/skn-api.jar "$nested_jar"; \
    mkdir -p /out; \
    cd /out; \
    jar xf "/work/$nested_jar" org/sqlite/native/Linux/aarch64/libsqlitejdbc.so; \
    mv org/sqlite/native/Linux/aarch64/libsqlitejdbc.so /out/libsqlitejdbc.so

FROM eclipse-temurin:17-jre-jammy

WORKDIR /app
COPY skn-api.jar /app/skn-api.jar
COPY --from=sqlite-native /out/libsqlitejdbc.so /app/native/libsqlitejdbc.so

RUN chmod 0444 /app/skn-api.jar \
    && chmod 0555 /app/native/libsqlitejdbc.so

ENTRYPOINT ["java", "-Dorg.sqlite.lib.path=/app/native", "-Dorg.sqlite.lib.name=libsqlitejdbc.so", "-jar", "/app/skn-api.jar"]
