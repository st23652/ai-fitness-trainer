from flask import Flask, render_template, request
import openai
import os

app = Flask(__name__)

# Set your API key here or load it securely via environment variable
openai.api_key = os.getenv("OPENAI_API_KEY") or "your-api-key-here"

@app.route("/", methods=["GET", "POST"])
def index():
    workout_plan = ""

    if request.method == "POST":
        age = request.form.get("age")
        weight = request.form.get("weight")
        location = request.form.get("location")
        goals = request.form.getlist("goals")
        focus = request.form.get("focus")

        prompt = f"""Create a 1-day personalized workout plan.
Age: {age}, Weight: {weight}kg, Location: {location}, Goals: {', '.join(goals)}, Focus Areas: {focus}.
Include warm-up, workout, cool down. Format clearly and concisely."""

        try:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            workout_plan = response.choices[0].message.content.strip()
        except Exception as e:
            workout_plan = f"⚠️ Error: {e}"

    return render_template("index.html", workout_plan=workout_plan)

if __name__ == "__main__":
    app.run(debug=True)
