import os
from flask import Flask, render_template, request
from dotenv import load_dotenv
import openai

load_dotenv()

app = Flask(__name__)
openai.api_key = os.getenv("OPENAI_API_KEY")

@app.route('/', methods=['GET', 'POST'])
def home():
    plan = None
    if request.method == 'POST':
        goal = request.form.get('goal', '')
        age = request.form.get('age', '')
        weight = request.form.get('weight', '')
        location = request.form.get('location', '')
        focus_areas = request.form.getlist('focus')

        prompt = f"""
        Create a 1-day personalized workout plan for a person who is {age} years old, weighs {weight}kg,
        wants to achieve '{goal}', works out at the '{location}', and wants to focus on: {', '.join(focus_areas)}.
        Vary the exercises if asked multiple times. Be creative and motivational.
        Output should be in bullet points and include warmup, workout, and cooldown.
        """

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a personal AI fitness trainer."},
                {"role": "user", "content": prompt}
            ]
        )

        plan = response.choices[0].message['content']

    return render_template('index.html', plan=plan)

if __name__ == '__main__':
    app.run(debug=True)
