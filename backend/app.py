from flask import Flask, Blueprint
from os import getenv

from routers.authentication import blueprint as authentication_blueprint
from routers.trial import blueprint as trial_blueprint

DEBUG = getenv("DEBUG", "False").lower() in ("true", "1", "t")
SECRET_KEY = getenv("SECRET_KEY", "secret-key")

app = Flask(__name__)
api = Blueprint('api', __name__, url_prefix='/api')

api.register_blueprint(authentication_blueprint)
api.register_blueprint(trial_blueprint)

@api.route("/")
def index():
    return "App is running!!"

app.register_blueprint(api)
app.secret_key = SECRET_KEY

if __name__ == '__main__':
    app.run(debug=DEBUG, host="0.0.0.0", port=80)