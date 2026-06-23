import os
import time

import psycopg2
import pytest

from app import app, get_connection


@pytest.fixture(scope="session", autouse=True)
def seed_database():
    last_error = None
    for _ in range(20):
        try:
            conn = get_connection()
            break
        except psycopg2.OperationalError as exc:
            last_error = exc
            time.sleep(1)
    else:
        raise RuntimeError(f"could not connect to postgres: {last_error}")

    with conn.cursor() as cur:
        cur.execute("DROP TABLE IF EXISTS widgets;")
        cur.execute("CREATE TABLE widgets (id SERIAL PRIMARY KEY, name TEXT NOT NULL);")
        cur.execute("INSERT INTO widgets (name) VALUES ('sprocket'), ('gear');")
    conn.commit()
    conn.close()
    yield


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.get_json() == {"status": "ok"}


def test_list_widgets(client):
    resp = client.get("/widgets")
    assert resp.status_code == 200
    names = [w["name"] for w in resp.get_json()]
    assert names == ["sprocket", "gear"]
