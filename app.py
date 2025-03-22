from base64 import b64decode
from uuid import uuid4
from flask import Flask, render_template, request
from google import genai
from os import environ

client = genai.Client(api_key=environ.get('GEMINI_API_KEY'))
PROMPT = ('(system): You are "AI". Use markdown and inline LaTeX to format responses. The user will send you messages.'
          'An image of their whiteboard will also be sent to you. Respond accordingly. This is an educational'
          'resource, so you should not provide answers to questions that are meant to be solved by the user. Try to'
          'guide the user to the answer instead. For example, you could ask them to draw a table, or to write out a'
          'particular formula. Also, remember, messages from users will be prefixed with "(user): ".')

app = Flask(__name__)
app.config["TEMPLATES_AUTO_RELOAD"] = True

histories = {}

@app.route('/')
def home():
    return render_template('home.html')


@app.route('/api/ask', methods=['POST'])
def ask():
    question = request.json['question']
    image = request.json['image']
    history = request.json.get('history', None)
    contents = []
    if histories.get(history):
        contents = histories[history]
    else:
        contents.append(PROMPT)
    contents.append('(user): ' + question + '\n(whiteboard): ')
    contents.append(genai.types.Part.from_bytes(data=image, mime_type="image/png"))
    response = client.models.generate_content(
        model='gemini-2.0-flash-thinking-exp',
        contents=contents)
    if response.text.startswith('(AI): '):
        contents.append(response.text)
    else:
        contents.append('(AI): ' + response.text)
    if not history:
        history = str(uuid4())
    histories[history] = contents
    return {
        'response': response.text.replace('(AI): ', '', 1),
        'history': history
    }


if __name__ == '__main__':
    app.run()
