FROM python:3.12-slim

WORKDIR /srv/app

# postgresql-client provides pg_isready, used by wait-for-postgres.sh below to
# detect when the sidecar container is actually accepting connections.
RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements before the rest of the app so dependency installation is
# cached across builds where only application code changed.
COPY app/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./
COPY scripts/wait-for-postgres.sh /usr/local/bin/wait-for-postgres.sh
RUN chmod +x /usr/local/bin/wait-for-postgres.sh

EXPOSE 5000

# Entrypoint blocks until Postgres is reachable, then execs whatever CMD (or
# a docker-run override, as the CI test job does) was passed in.
ENTRYPOINT ["wait-for-postgres.sh"]
CMD ["python", "app.py"]
