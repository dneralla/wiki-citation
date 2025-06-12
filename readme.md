# Wiki Citation Extension

This project demonstrates a Chrome extension that replaces "citation needed" placeholders on Wikipedia with automatically generated references.

- `chromeext/` – source for the browser extension.
- `server/` – simple Flask server that queries an LLM for a citation suggestion.

## Running the server

1. Install dependencies:
   ```bash
   pip install -r server/requirements.txt
   ```
2. Set your OpenAI API key:
   ```bash
   export OPENAI_API_KEY=your-key
   ```
3. Start the server:
   ```bash
   python server/wikicit_server.py
   ```
   The server listens on `http://localhost:4567/get-topranked-citation`.

## Using the extension

Load the `chromeext/` directory as an unpacked extension in Chrome and navigate to a Wikipedia page containing "citation needed" markers. The extension will query the server for a citation and insert it into the page.

## Continuous Integration

A simple GitHub Actions workflow is included in `.github/workflows/ci.yml`. It installs the server dependencies and checks that `wikicit_server.py` compiles without errors. Push this repository to GitHub and open the **Actions** tab to see the workflow run. The URL of a run follows the pattern `https://github.com/<user>/<repo>/actions/runs/<run-id>`.
