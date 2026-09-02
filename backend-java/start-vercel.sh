#!/bin/sh
set -eu

public_port="${PORT:-80}"
internal_port="${APP_INTERNAL_PORT:-8081}"

socat \
  "TCP-LISTEN:${public_port},fork,reuseaddr" \
  "TCP:127.0.0.1:${internal_port},retry=60,interval=1" &

export PORT="${internal_port}"

exec /opt/java/openjdk/bin/java \
  -XX:MaxRAMPercentage=75.0 \
  -XX:+UseSerialGC \
  -XX:TieredStopAtLevel=1 \
  -jar /app/app.jar \
  --spring.datasource.hikari.maximum-pool-size=1 \
  --spring.datasource.hikari.minimum-idle=0 \
  --spring.datasource.hikari.idle-timeout=30000 \
  --spring.datasource.hikari.keepalive-time=0 \
  --spring.datasource.hikari.connection-timeout=10000 \
  --spring.flyway.enabled=false \
  --spring.jpa.hibernate.ddl-auto=none \
  --springdoc.api-docs.enabled=false \
  --springdoc.swagger-ui.enabled=false \
  --app.scheduling.enabled=false
