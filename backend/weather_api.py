import requests
from datetime import datetime, timedelta

class WeatherAPI:
    def __init__(self, api_key):
        """Initialize Weather API with your OpenWeatherMap API key"""
        self.api_key = api_key
        self.base_url = "https://api.openweathermap.org/data/2.5"
        
    def get_weather(self, city):
        """
        Get REAL current weather for a city from OpenWeatherMap API
        NO MOCK DATA - Only real API data
        """
        try:
            # Call OpenWeatherMap API
            url = f"{self.base_url}/weather?q={city},IN&units=metric&appid={self.api_key}"
            response = requests.get(url, timeout=5)
            
            # If city not found, return error
            if response.status_code == 404:
                return {
                    "success": False,
                    "error": f"City '{city}' not found. Please check spelling."
                }
            
            # If other API error
            if response.status_code != 200:
                return {
                    "success": False,
                    "error": f"Weather API error: {response.status_code}"
                }
            
            # Parse successful response
            data = response.json()
            
            # Return REAL weather data only
            return {
                "success": True,
                "city": data['name'],
                "temp": round(data['main']['temp']),
                "feels_like": round(data['main']['feels_like']),
                "temp_min": round(data['main']['temp_min']),
                "temp_max": round(data['main']['temp_max']),
                "condition": data['weather'][0]['description'],
                "main_condition": data['weather'][0]['main'],
                "humidity": data['main']['humidity'],
                "wind_speed": round(data['wind']['speed'] * 3.6, 1),  # Convert m/s to km/h
                "wind_gust": round(data['wind'].get('gust', 0) * 3.6, 1) if 'gust' in data['wind'] else 0,
                "pressure": data['main']['pressure'],
                "visibility": data.get('visibility', 10000) / 1000,  # Convert to km
                "clouds": data['clouds']['all'],
                "icon": data['weather'][0]['icon'],
                "country": data['sys']['country'],
                "sunrise": datetime.fromtimestamp(data['sys']['sunrise']).strftime('%H:%M'),
                "sunset": datetime.fromtimestamp(data['sys']['sunset']).strftime('%H:%M'),
                "timestamp": datetime.now().isoformat()
            }
            
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "error": "Weather API timeout. Please try again."
            }
        except requests.exceptions.ConnectionError:
            return {
                "success": False,
                "error": "Cannot connect to weather service. Check internet."
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Error fetching weather: {str(e)}"
            }
    
    def get_forecast(self, city, days=5):
        """
        Get REAL 5-day weather forecast (OpenWeatherMap free tier)
        """
        try:
            url = f"{self.base_url}/forecast?q={city},IN&units=metric&appid={self.api_key}"
            response = requests.get(url, timeout=5)
            
            if response.status_code != 200:
                return {"success": False, "error": "Forecast not available"}
            
            data = response.json()
            
            # Process forecast (OpenWeatherMap gives 3-hour intervals)
            forecast_list = []
            seen_dates = set()
            
            for item in data['list']:
                date = item['dt_txt'].split(' ')[0]
                
                # Get one forecast per day (around noon)
                if date not in seen_dates and '12:00:00' in item['dt_txt']:
                    seen_dates.add(date)
                    forecast_list.append({
                        "date": date,
                        "day": datetime.strptime(date, '%Y-%m-%d').strftime('%a'),
                        "temp": round(item['main']['temp']),
                        "temp_min": round(item['main']['temp_min']),
                        "temp_max": round(item['main']['temp_max']),
                        "condition": item['weather'][0]['description'],
                        "icon": item['weather'][0]['icon'],
                        "humidity": item['main']['humidity'],
                        "wind_speed": round(item['wind']['speed'] * 3.6, 1),
                        "pop": round(item['pop'] * 100)  # Probability of precipitation
                    })
            
            return {
                "success": True,
                "city": city,
                "forecast": forecast_list[:5]  # Max 5 days
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def calculate_risk(self, weather_data):
        """Calculate risk score based on REAL weather data"""
        if not weather_data or not weather_data.get('success'):
            return 0, "Unknown"
        
        risk = 30  # Base risk
        
        # Temperature risk
        temp = weather_data['temp']
        if temp > 40:
            risk += 40
        elif temp > 38:
            risk += 30
        elif temp > 35:
            risk += 20
        elif temp < 10:
            risk += 35
        elif temp < 15:
            risk += 15
        
        # Weather condition risk
        condition = weather_data['main_condition'].lower()
        if 'rain' in condition:
            risk += 25
        elif 'storm' in condition or 'thunder' in condition:
            risk += 40
        elif 'haze' in condition or 'mist' in condition or 'fog' in condition:
            risk += 15
        
        # Wind risk
        wind = weather_data['wind_speed']
        if wind > 40:
            risk += 30
        elif wind > 30:
            risk += 20
        elif wind > 20:
            risk += 10
        
        risk = min(risk, 100)
        
        # Determine risk level
        if risk > 60:
            level = "High"
        elif risk > 40:
            level = "Medium"
        else:
            level = "Low"
        
        return risk, level
    
    def get_precautions(self, weather_data):
        """Generate REAL precautions based on actual weather"""
        if not weather_data or not weather_data.get('success'):
            return ["Unable to generate precautions"]
        
        precautions = []
        temp = weather_data['temp']
        condition = weather_data['main_condition'].lower()
        wind = weather_data['wind_speed']
        
        if temp > 40:
            precautions = [
                "🔥 EXTREME HEAT WARNING",
                "🌡️ Temperature above 40°C - HIGH RISK",
                "💧 Drink water every 30 minutes",
                "🧢 Work before 10 AM or after 4 PM",
                "🚗 Take AC breaks every hour",
                "⚠️ Insurance coverage ACTIVE"
            ]
        elif temp > 38:
            precautions = [
                "🌡️ Heat Alert - Temperature above 38°C",
                "💧 Carry 2+ liters water",
                "🧢 Wear light cotton clothes",
                "⏰ Avoid 12 PM - 3 PM",
                "✅ Coverage active"
            ]
        elif temp > 35:
            precautions = [
                "🌡️ High Temperature",
                "💧 Stay hydrated",
                "🧢 Cap recommended",
                "⏰ Take regular breaks"
            ]
        elif temp < 10:
            precautions = [
                "❄️ COLD WAVE WARNING",
                "🌡️ Temperature below 10°C",
                "🧥 Wear warm clothes and gloves",
                "☕ Carry hot beverages",
                "⚠️ Insurance coverage ACTIVE"
            ]
        
        if 'rain' in condition:
            rain_intensity = "Heavy" if 'heavy' in condition else "Light" if 'light' in condition else "Moderate"
            precautions.extend([
                f"🌧️ {rain_intensity} Rain Detected",
                "🧥 Wear raincoat",
                "🚗 Drive slowly, maintain distance",
                "⚠️ Avoid water logging areas",
                "📱 Keep phone in waterproof cover"
            ])
        elif 'thunder' in condition or 'storm' in condition:
            precautions.extend([
                "⛈️ THUNDERSTORM WARNING",
                "🏠 Find safe shelter immediately",
                "🚫 Stop deliveries until safe",
                "⚡ Auto-pay will trigger",
                "📞 Emergency: 112"
            ])
        
        if wind > 30:
            precautions.extend([
                "💨 VERY STRONG WINDS",
                "🏍️ Hold handlebars firmly",
                "⚠️ Avoid bridges and highways",
                "🐢 Reduce speed significantly"
            ])
        elif wind > 20:
            precautions.extend([
                "💨 Strong Winds",
                "🏍️ Be careful while riding",
                "⚠️ Avoid riding near billboards"
            ])
        
        if not precautions:
            precautions = [
                "✅ Weather conditions are favorable",
                "🪖 Always wear helmet",
                "💧 Stay hydrated",
                "📞 Keep phone charged"
            ]
        
        return precautions

# No mock data - only real API
# You must provide your API key when creating instance
weather_api = None  # Will be initialized in app.py with your API key

def init_weather_api(api_key):
    """Initialize weather API with your key"""
    global weather_api
    weather_api = WeatherAPI(api_key)
    return weather_api

def get_weather(city):
    """Get REAL weather for a city"""
    if not weather_api:
        return {"success": False, "error": "Weather API not initialized"}
    return weather_api.get_weather(city)

def get_forecast(city, days=5):
    """Get REAL forecast for a city"""
    if not weather_api:
        return {"success": False, "error": "Weather API not initialized"}
    return weather_api.get_forecast(city, days)

def calculate_risk(weather_data):
    """Calculate risk score from REAL weather"""
    if not weather_api:
        return 0, "Unknown"
    return weather_api.calculate_risk(weather_data)

def get_precautions(weather_data):
    """Get precautions based on REAL weather"""
    if not weather_api:
        return ["Weather API not initialized"]
    return weather_api.get_precautions(weather_data)