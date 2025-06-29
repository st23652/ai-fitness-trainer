# app.py
import random
from flask import Flask, render_template, request, jsonify
import openai
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

openai.api_key = os.getenv("OPENAI_API_KEY")

ROASTS = [
    "You skipped it? Even my grandma does better.",
    "You call that fitness? Shame.",
    "Wow. Olympic level laziness detected.",
    "You skipped leg day again, didn't you?",
    "Do you even lift, bro?"
]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate_plan', methods=['POST'])
def generate():
    data = request.json
    weight = data.get('weight')
    age = data.get('age')
    lifestyle = data.get('lifestyle')
    goals = data.get('goals', [])
    roast_mode = data.get('roast', False)

    prompt = f"""
    Create a detailed 3-day workout plan for a {age}-year-old with a {lifestyle} lifestyle, weighing {weight} kg.
    Goals: {', '.join(goals)}.
    The plan should include warm-ups, main workouts, and cooldowns. Keep it beginner-friendly but goal-focused.
    Format the output cleanly.
    """

    response = openai.ChatCompletion.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=800
    )

    plan = response.choices[0].message['content']
    return jsonify({"plan": plan})

@app.route('/compliance', methods=['POST'])
def compliance():
    data = request.json
    did_do = data.get("did_do")
    roast_mode = data.get("roast", False)

    if did_do:
        return jsonify({"msg": "Nice work! Come back tomorrow!"})
    else:
        msg = "Try harder tomorrow!"
        if roast_mode:
            msg = random.choice(ROASTS)
        return jsonify({"msg": msg})

if __name__ == '__main__':
    app.run(debug=True)
