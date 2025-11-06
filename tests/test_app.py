import pytest
from app import app, init_db
from app.models import db, User

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = "postgresql://testuser:password@localhost:5432/testdb"
    init_db(app)
    with app.test_client() as client:
        yield client

def test_index(client):
    rv = client.get('/')
    assert rv.status_code == 200
    data = rv.get_json()
    assert 'status' in data
    assert data['status'] == 'ok'
