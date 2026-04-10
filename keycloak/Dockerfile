FROM quay.io/keycloak/keycloak:24.0

# Bake the realm config into the image so no volume mount is needed at runtime
COPY realm-mef.json /opt/keycloak/data/import/realm-mef.json

EXPOSE 8180

CMD ["start-dev", "--import-realm"]
