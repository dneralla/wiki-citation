# Streaming App Example

This repository provides a minimal example of a live video streaming app. It consists of a Flask backend that authenticates with Google and returns a set of example streams, and a simple React Native front-end using Expo.

## Backend

The Flask server exposes two routes:

- `/` – requires Google login and returns the user info plus a list of available streams
- `/streams` – returns only the list of streams

To run the server:

```bash
pip install -r server/requirements.txt
export FLASK_SECRET=your-secret
export GOOGLE_OAUTH_CLIENT_ID=your-client-id
export GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
python server/app.py
```

## Mobile App

The `mobile` directory contains a basic React Native project. Install dependencies and start it with Expo:

```bash
cd mobile
npm install
npm start
```

You can then run the app on your phone using the Expo Go application. After logging in with Google, you can pick from one of the sample streams.

This setup is intended as a starting point and does not include production deployment or binaries.
