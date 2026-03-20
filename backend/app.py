from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
from datetime import datetime
import json
import os
import webbrowser
import threading

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# ==================== CONFIG ====================
API_KEY = "bb2d87b40339704b46f88cfc9c6782fd"
USER_LOCATIONS_FILE = "/tmp/user_locations.json"
USERS_FILE = "/tmp/users.json"

# ==================== USER MANAGEMENT ====================
def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return {"users": []}

def save_user(user_data):
    users_data = load_users()

    for user in users_data["users"]:
        if user["email"] == user_data["email"]:
            return {"success": False, "error": "Email already registered"}

    users_data["users"].append(user_data)

    with open(USERS_FILE, 'w') as f:
        json.dump(users_data, f, indent=2)

    return {"success": True}

def validate_user(email, password):
    users_data = load_users()

    for user in users_data["users"]:
        if user["email"] == email and user["password"] == password:
            return {"success": True, "user": user}

    return {"success": False, "error": "Invalid email or password"}

@app.route('/api/logout', methods=['POST'])
def logout():
    """Logout user (just for API completeness)"""
    return jsonify({"success": True, "message": "Logged out successfully"})

# ==================== USER LOCATIONS ====================
def load_user_locations():
    if os.path.exists(USER_LOCATIONS_FILE):
        with open(USER_LOCATIONS_FILE, 'r') as f:
            return json.load(f)
    return {"locations": []}

def save_user_locations(locations):
    with open(USER_LOCATIONS_FILE, 'w') as f:
        json.dump({"locations": locations}, f)

# ==================== INSURANCE PLANS ====================
INSURANCE_PLANS = [
    {
        "id": 1,
        "name": "Basic Plan",
        "price_per_week": "₹100",
        "coverage": "Up to ₹2,000 per week"
    },
    {
        "id": 2,
        "name": "Standard Plan",
        "price_per_week": "₹200",
        "coverage": "Up to ₹4,000 per week"
    },
    {
        "id": 3,
        "name": "Premium Plan",
        "price_per_week": "₹300",
        "coverage": "Up to ₹7,000 per week"
    }
]

# ==================== WEATHER ====================
def get_real_weather(city):
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?q={city},IN&units=metric&appid={API_KEY}"
        response = requests.get(url, timeout=5)

        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "temp": round(data['main']['temp']),
                "feels_like": round(data['main']['feels_like']),
                "condition": data['weather'][0]['description'],
                "main_condition": data['weather'][0]['main'],
                "humidity": data['main']['humidity'],
                "wind_speed": round(data['wind']['speed'] * 3.6, 1),
                "city": data['name']
            }
        else:
            return {"success": False, "error": "City not found"}

    except Exception as e:
        return {"success": False, "error": str(e)}

def calculate_risk(weather_data):
    if not weather_data.get('success'):
        return 40, "Medium"

    risk = 30
    temp = weather_data['temp']

    if temp > 40:
        risk += 40
    elif temp > 35:
        risk += 20

    if 'rain' in weather_data['main_condition'].lower():
        risk += 25

    if weather_data['wind_speed'] > 20:
        risk += 15

    risk = min(risk, 100)

    if risk > 60:
        level = "High"
    elif risk > 40:
        level = "Medium"
    else:
        level = "Low"

    return risk, level

# ==================== ROUTES ====================

@app.route('/')
def serve_landing():
    return send_from_directory(app.static_folder, 'landing.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# ==================== AUTH ====================

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json

    required_fields = ['firstName','lastName','age','email','bankAccount','panCard','aadhaarCard','workerId','password']

    for field in required_fields:
        if field not in data:
            return jsonify({"success": False, "error": f"Missing {field}"})

    user = {
        **data,
        "registeredAt": datetime.now().isoformat()
    }

    result = save_user(user)

    return jsonify(result)

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    return jsonify(validate_user(data.get('email'), data.get('password')))

# ==================== WEATHER ====================

@app.route('/api/weather/<city>', methods=['GET'])
def get_weather(city):
    weather = get_real_weather(city)

    if not weather['success']:
        return jsonify(weather)

    risk_score, risk_level = calculate_risk(weather)

    return jsonify({
        "success": True,
        "city": weather['city'],
        "temperature": weather['temp'],
        "condition": weather['condition'],
        "humidity": weather['humidity'],       # ✅ add this
        "wind_speed": weather['wind_speed'],   # ✅ add this
        "risk_score": risk_score,
        "risk_level": risk_level,
        "precautions": [                       # ✅ add this
        "Stay hydrated 💧",
        "Avoid extreme weather ☀️🌧️",
        "Take breaks during work 🛑"
        ]
    })

# ==================== LOCATIONS ====================

@app.route('/api/locations', methods=['GET'])
def get_locations():
    return jsonify(load_user_locations())

@app.route('/api/locations', methods=['POST'])
def save_locations_route():
    data = request.json
    save_user_locations(data.get('locations', []))
    return jsonify({"success": True})

# ==================== PLANS ====================

@app.route('/api/plans', methods=['GET'])
def get_plans():
    return jsonify(INSURANCE_PLANS)

# ==================== CHATBOT ====================

@app.route('/api/chat', methods=['POST'])
def chat():
    msg = request.json.get("message","").lower()

    if "hi" in msg:
        return jsonify({"response": "Hello! 👋 I'm GigSuraksha AI"})

    if "plan" in msg:
        return jsonify({"response": "We have Basic, Standard, Premium plans."})

    if "claim" in msg:
        return jsonify({"response": "Claims are automatic within 24 hrs ⚡"})

    return jsonify({"response": "Ask about plans, weather, claims 😊"})

# ==================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "GigSuraksha AI Backend is running!"})

# ==================== FOR VERCEL ====================
# This line is CRITICAL for Vercel
app = app

# IMPORTANT: Comment out the local server code for Vercel
# if __name__ == '__main__': 
#     print("=" * 60) 
#     print("🚀 GigSuraksha AI - Server Started Successfully") 
#     print("=" * 60) 
#     print("\n📍 API Key loaded:", API_KEY[:5] + "..." + API_KEY[-5:]) 
#     print("\n🌐 Open this link in your browser to use the app:") 
#     print("👉 http://127.0.0.1:5000") 
#     print("\n⚠️ Browser will NOT open automatically.") 
#     print("Click the link above to access the application.") 
#     print("=" * 60) 
#     
#     app.run(debug=True, port=5000)

