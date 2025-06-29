from flask import Flask, render_template, request, jsonify
import random

app = Flask(__name__)

EXERCISES = {
    "easy": ["20-min walk", "10 pushups", "15 squats"],
    "medium": ["30-min jog", "20 pushups", "30 squats", "15 burpees"],
    "hard": ["45-min run", "40 pushups", "50 squats", "30 burpees", "plank 2 min"]
} 

ROASTS = [
    "You skipped it? Even my grandma does better.",
    "You call that fitness? Shame.",
    "Wow. Olympic level laziness detected.",
    "You skipped leg day again, didn't you?",
    "Do you even lift, bro?"
]

def generate_plan(level):
    return random.sample(EXERCISES[level], 3)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate_plan', methods=['POST'])
def generate():
    data = request.json
    weight = int(data.get('weight', 60))
    age = int(data.get('age', 25))
    lifestyle = data.get('lifestyle', 'medium')
    roast_mode = data.get('roast', False)

    # Plan level logic (simplified)
    if lifestyle == 'sedentary' or weight > 90:
        level = "easy"
    elif weight < 60 and age < 30:
        level = "hard"
    else:
        level = "medium"

    plan = generate_plan(level)
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
