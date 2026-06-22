from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    app.config['SQLALCHEMY_DATABASE_URI'] = app.config.get('SQLALCHEMY_DATABASE_URI')
    db.init_app(app)
    with app.app_context():
        db.create_all()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
