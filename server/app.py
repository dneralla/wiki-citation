from flask import Flask, jsonify, redirect, url_for
from flask_dance.contrib.google import make_google_blueprint, google
import os

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET", "change-me")

# Google OAuth setup
google_bp = make_google_blueprint(
    client_id=os.environ.get("GOOGLE_OAUTH_CLIENT_ID"),
    client_secret=os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET"),
    scope=["profile", "email"],
    redirect_url="/"
)
app.register_blueprint(google_bp, url_prefix="/login")

# Example stream list
STREAMS = [
    {
        "name": "Big Buck Bunny",
        "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    },
    {
        "name": "Sintel",
        "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
    },
    {
        "name": "Tears of Steel",
        "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
    }
]

@app.route("/")
def index():
    if not google.authorized:
        return redirect(url_for("google.login"))
    resp = google.get("/oauth2/v2/userinfo")
    if resp.ok:
        user_info = resp.json()
    else:
        user_info = {}
    return jsonify({"user": user_info, "streams": STREAMS})

@app.route("/streams")
def list_streams():
    return jsonify(STREAMS)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
