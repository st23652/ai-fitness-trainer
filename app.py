from flask import Flask, render_template, request, jsonify, send_from_directory
import openai
import os

app = Flask(__name__, static_folder='static', template_folder='templates')

# --- Configuration and Security ---
# It's highly recommended to set this as an environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")

if not openai.api_key:
    print("WARNING: OpenAI API key is not set as an environment variable. The application will not be able to generate plans.")

# --- App Routes ---
@app.route("/")
def index():
    """Serves the main application page."""
    return render_template("index.html")

@app.route("/generate", methods=["POST"])
def generate_workout():
    """API endpoint to generate the workout plan."""
    if not openai.api_key:
        return jsonify({"error": "Server configuration error: OpenAI API key is not set."}), 500
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON provided."}), 400

        # --- Data Validation ---
        required_fields = ["age", "weight", "location", "duration", "goals", "workout_hours"]
        if not all(field in data and data[field] for field in required_fields):
            return jsonify({"error": "Missing required fields. Please fill out the entire form."}), 400

        # --- Prompt Engineering ---
        prompt = f"""
        Act as an expert fitness coach. Create a personalized workout plan based on the user's details.
        The plan must be well-structured, safe, and motivating.

        **User Profile:**
        - **Age:** {data.get("age")}
        - **Weight:** {data.get("weight")} kg
        - **Workout Location:** {data.get("location")}
        - **Plan Duration:** {data.get("duration")}
        - **Desired Workout Time Per Day:** {data.get("workout_hours")} hours
        - **Primary Goals:** {', '.join(data.get("goals"))}
        - **Specific Focus Areas:** {data.get("focus") or 'Overall body fitness'}

        **Response Requirements:**
        1.  **CRITICAL:** For every single exercise name you list, you MUST wrap it in a `<span>` tag with two specific attributes:
            - `class="exercise-name"`
            - `data-instruction="..."` where the `...` is a detailed, step-by-step guide on how to perform that exercise. The instructions should be concise and clear.
            - **Example:** `<li><span class="exercise-name" data-instruction="1. Stand with feet shoulder-width apart. 2. Lower your hips as if sitting in a chair. 3. Keep your chest up and back straight. 4. Push through your heels to return to the start.">Barbell Squats</span>: 3 sets of 10-12 reps, 60-90 sec rest.</li>`

        2.  **Title:** Start with a catchy title for the plan.
        3.  **Structure:** For multi-day plans, structure the response clearly by day (e.g., "Day 1: Upper Body").
        4.  **Daily Components:** Each day must include:
            - **Warm-up (5-10 mins):** List 3-4 dynamic stretches.
            - **Main Workout:** Provide a list of exercises. For each exercise, specify **Sets**, **Reps** (or **Duration**), and **Rest**. The number and length of exercises must be adjusted to fit the user's "Desired Workout Time Per Day".
            - **Cool-down (5-10 mins):** List 3-4 static stretches.
        5.  **Important Note:** Add a concluding note about listening to one's body and the importance of proper form.

        Generate the response in clean HTML format. Use <h3> for main sections, <h4> for subsections, and <ul> or <ol> for lists.
        IMPORTANT: Do NOT wrap the output in markdown code fences like ```html or ```. The output should be pure HTML.
        """

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2048
        )
        workout_plan = response.choices[0].message['content'].strip()
        return jsonify({"plan": workout_plan})

    except openai.error.OpenAIError as e:
        return jsonify({"error": f"OpenAI API error: {e}"}), 502
    except Exception as e:
        return jsonify({"error": f"An unexpected server error occurred: {e}"}), 500

# --- PWA Routes ---
@app.route('/manifest.json')
def serve_manifest():
    return send_from_directory(app.root_path, 'manifest.json')

@app.route('/sw.js')
def serve_sw():
    return send_from_directory(app.root_path, 'sw.js')

# --- For Production Deployment (e.g., on Gunicorn) ---
if __name__ == "__main__":
    app.run(debug=True, port=5001)
