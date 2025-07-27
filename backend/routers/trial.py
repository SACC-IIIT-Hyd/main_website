from flask import Blueprint
from routers.authentication import login_required

blueprint = Blueprint("trial", __name__)


@blueprint.route("/trial")
@login_required
def index(current_user=None):
    return current_user
