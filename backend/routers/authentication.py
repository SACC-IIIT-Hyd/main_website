from flask import Blueprint, request, redirect, url_for, make_response
from flask import current_app as app
from urllib.parse import quote_plus
from functools import wraps
from jwt import encode, decode
from cas import CASClient

from os import getenv

CAS_SERVER_URL = getenv("CAS_SERVER_URL")
SERVICE_URL = getenv("SERVICE_URL")
REDIRECT_URL = "/home"
JWT_SECRET_KEY = getenv("JWT_SECRET_KEY", "jwt-secret")

blueprint = Blueprint("authentication", __name__)

# instantiate CAS client
cas_client = CASClient(
    version=3,
    service_url=f"{SERVICE_URL}?next={quote_plus(REDIRECT_URL)}",
    server_url=CAS_SERVER_URL,
)


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if request.cookies.get("Authorization_YearBook"):
            token = request.cookies.get("Authorization_YearBook")
        if not token:
            return redirect(url_for("login"))
        try:
            current_user = decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        except Exception as e:
            return {
                "message": "Something went wrong",
                "data": None,
                "error": str(e),
            }, 500

        return f(current_user, *args, **kwargs)

    return decorated


def verify_token() -> bool:
    try:
        token = None
        if request.cookies.get("Authorization_YearBook"):
            token = request.cookies.get("Authorization_YearBook")
        if token:
            current_user = decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
            return True
        return False
    except Exception as e:
        return False


@blueprint.route("/login")
def login():
    # Already logged in
    if request.cookies.get("Authorization_YearBook"):
        return redirect("/home")

    next = request.args.get("next")
    ticket = request.args.get("ticket")
    if not ticket:
        # No ticket, the request come from end user, send to CAS login
        cas_login_url = cas_client.get_login_url()
        # app.debug("CAS login URL: %s", type(cas_login_url))
        return redirect(cas_login_url)

    # There is a ticket, the request come from CAS as callback.
    # need call `verify_ticket()` to validate ticket and get user profile.
    # app.debug("ticket: %s", ticket)

    user, attributes, pgtiou = cas_client.verify_ticket(ticket)

    # app.debug(
    #     "CAS verify ticket response: user: %s, attributes: %s, pgtiou: %s",
    #     user,
    #     attributes,
    #     pgtiou,
    # )

    if not user:
        return 'Failed to verify ticket. <a href="/api/login">Login</a>'

    # Login successful, make JWT and redirect according to `next` query parameter.
    else:
        payload = {
            "uid": attributes.get("uid"),
            "email": user,
            "name": attributes.get("Name"),
            "roll_no": attributes.get("RollNo"),
            "first_name": attributes.get("FirstName"),
            "last_name": attributes.get("LastName"),
        }

        # app.debug("JWT payload: %s", payload)

        # generate JWT
        token = encode(payload, JWT_SECRET_KEY, algorithm="HS256")

        # send JWT as cookie
        response = make_response(redirect(next))
        response.set_cookie(
            "Authorization_YearBook",
            token,
            httponly=False,
            secure=False,
            max_age=86400,  # 1 day
        )

        return response


@blueprint.route("/logout")
def logout():
    redirect_url = url_for("api.authentication.logout_callback", _external=True)
    cas_logout_url = cas_client.get_logout_url(redirect_url)
    # app.debug("CAS logout URL: %s", cas_logout_url)

    return redirect(cas_logout_url)


@blueprint.route("/logoutCallback")
def logout_callback():
    # Expire cookie
    response = make_response()
    response.set_cookie("Authorization_YearBook", "", expires=0)
    response.set_cookie("logout", "", expires=0)

    # app.debug(response.headers)

    # Redirect from CAS logout request after logout successful
    return response
