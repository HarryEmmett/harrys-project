# Kafka Connect worker with the two plugins this demo needs:
#   1. Debezium Postgres  -> source connector (reads the WAL)
#   2. Elasticsearch sink -> sink connector (writes documents)
#
# Debezium comes straight from Maven Central so the version is pinned and
# reproducible. The Elasticsearch sink is only distributed via Confluent Hub.

ARG CP_VERSION=7.6.1
FROM confluentinc/cp-kafka-connect:${CP_VERSION}

# Debezium 2.7.x targets Kafka 3.x and Java 11, which matches the CP 7.6 image.
# Bump with care: Debezium 3.x requires Java 17.
ARG DEBEZIUM_VERSION=2.7.4.Final
# Pin this once you know which version you got: `latest` keeps the build working
# but makes it non-reproducible.
ARG ES_SINK_VERSION=latest

USER root
RUN set -eux; \
    mkdir -p /opt/connectors/debezium-connector-postgres; \
    curl -fsSL \
      "https://repo1.maven.org/maven2/io/debezium/debezium-connector-postgres/${DEBEZIUM_VERSION}/debezium-connector-postgres-${DEBEZIUM_VERSION}-plugin.tar.gz" \
      | tar -xz -C /opt/connectors/debezium-connector-postgres --strip-components=1; \
    chmod -R a+rX /opt/connectors

USER appuser
RUN confluent-hub install --no-prompt "confluentinc/kafka-connect-elasticsearch:${ES_SINK_VERSION}"
