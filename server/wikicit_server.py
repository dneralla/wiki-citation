import os
from flask import Flask, jsonify
import openai

app = Flask(__name__)

openai.api_key = os.getenv("OPENAI_API_KEY")

@app.route('/get-topranked-citation')
def get_topranked_citation():
    '''
    Call an LLM to generate a citation suggestion. This is a proof of concept
    using OpenAI's API. Set the OPENAI_API_KEY environment variable before
    running the server.
    '''
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You provide a plausible citation for Wikipedia text."},
                {"role": "user", "content": "Generate a citation."}
            ],
            max_tokens=60
        )
        citation = response['choices'][0]['message']['content'].strip()
    except Exception as e:
        citation = f"Error: {e}"

    return jsonify(citation)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 4567))
    app.run(host='0.0.0.0', port=port)
