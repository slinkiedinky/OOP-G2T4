#!/bin/bash
# clinicsystem/run-dev.sh — load .env (module or repo root) and start backend from clinicsystem folder
# Set Java 21 for this project
export JAVA_HOME=$(/usr/libexec/java_home -v 21)

# Prefer module-local .env, fall back to repo root ../.env
if [ -f ".env" ]; then
    ENVFILE=".env"
elif [ -f "../.env" ]; then
    ENVFILE="../.env"
else
    echo ".env not found in module or repo root. Copy .env.sample to .env and fill values."
    echo "Use: cp ../.env.sample .env  OR edit clinicsystem/.env.sample"
    exit 1
fi

# Load environment variables from the .env file
set -a
source "$ENVFILE"
set +a

echo "Loaded environment from $ENVFILE"

# Run the Maven wrapper in this module
./mvnw -Dspring-boot.run.profiles=local spring-boot:run