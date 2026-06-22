# Uses only Python stdlib (http.server) — no requirements.txt needed, so
# the slim base image is sufficient with no extra layer for dependencies.
FROM python:3.12-slim
WORKDIR /app
COPY src ./src
EXPOSE 8080
CMD ["python3", "src/server.py"]
