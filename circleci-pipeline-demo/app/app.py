import os
import psycopg2
from flask import Flask, jsonify

app = Flask(__name__)


def get_connection():
    return psycopg2.connect(
        host=os.environ.get("DB_HOST", "localhost"),
        port=os.environ.get("DB_PORT", "5432"),
        dbname=os.environ.get("DB_NAME", "circleci_demo"),
        user=os.environ.get("DB_USER", "postgres"),
        password=os.environ.get("DB_PASSWORD", "postgres"),
    )


@app.route("/health")
def health():
    return jsonify(status="ok")


@app.route("/widgets")
def list_widgets():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name FROM widgets ORDER BY id;")
            rows = cur.fetchall()
    finally:
        conn.close()
    return jsonify([{"id": r[0], "name": r[1]} for r in rows])


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
