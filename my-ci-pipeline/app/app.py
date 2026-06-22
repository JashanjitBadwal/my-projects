from flask import Flask, jsonify
from models import init_db, User

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = "postgresql://testuser:password@localhost:5432/testdb"

@app.route("/")
def index():
    return jsonify({"status":"ok", "users": User.query.count()})

if __name__ == "__main__":
    init_db(app)
    app.run(host="0.0.0.0", port=8080)
