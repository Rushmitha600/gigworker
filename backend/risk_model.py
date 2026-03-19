import numpy as np
from datetime import datetime

class RiskAssessmentModel:
    def __init__(self):
        self.base_premium = 100  # Base weekly premium in rupees
    
    def calculate_weekly_premium(self, worker_data, weather_risk):
        """
        Calculate dynamic weekly premium based on multiple factors
        
        worker_data: {
            'experience_years': float,
            'avg_daily_earnings': float,
            'delivery_mode': string,  # 'bike', 'scooter', 'cycle'
            'city': string,
            'previous_claims': int,
            'working_hours': int
        }
        """
        risk_factors = []
        total_risk = 0
        
        # 1. Experience factor (less experience = higher risk)
        exp = worker_data.get('experience_years', 1)
        exp_risk = max(0, (3 - exp) * 10)
        risk_factors.append(('Experience', exp_risk))
        total_risk += exp_risk
        
        # 2. Delivery mode factor
        mode = worker_data.get('delivery_mode', 'bike')
        mode_risks = {
            'bike': 20,
            'scooter': 15,
            'cycle': 25,
            'walk': 10
        }
        mode_risk = mode_risks.get(mode, 15)
        risk_factors.append(('Vehicle Type', mode_risk))
        total_risk += mode_risk
        
        # 3. Previous claims factor
        claims = worker_data.get('previous_claims', 0)
        claims_risk = min(claims * 15, 30)
        risk_factors.append(('Claims History', claims_risk))
        total_risk += claims_risk
        
        # 4. Working hours factor
        hours = worker_data.get('working_hours', 8)
        if hours > 10:
            hours_risk = 20
        elif hours > 8:
            hours_risk = 10
        else:
            hours_risk = 5
        risk_factors.append(('Working Hours', hours_risk))
        total_risk += hours_risk
        
        # 5. Weather risk (from API)
        total_risk += weather_risk
        
        # Calculate final premium (base + risk adjustments)
        final_premium = self.base_premium + (total_risk * 2)
        
        # Apply city multiplier
        city_multipliers = {
            'Mumbai': 1.2,
            'Delhi': 1.15,
            'Bangalore': 1.1,
            'Chennai': 1.05,
            'Kolkata': 1.15,
            'Pune': 1.0
        }
        city = worker_data.get('city', 'Mumbai')
        final_premium *= city_multipliers.get(city, 1.0)
        
        return {
            'weekly_premium': round(final_premium, 2),
            'risk_score': total_risk,
            'risk_factors': risk_factors,
            'base_premium': self.base_premium,
            'city_multiplier': city_multipliers.get(city, 1.0)
        }
    
    def predict_income_loss(self, weather_risk, worker_data):
        """Predict potential income loss due to weather"""
        avg_daily_earnings = worker_data.get('avg_daily_earnings', 500)
        
        # Simple prediction model
        if weather_risk > 70:
            loss_percentage = 0.30  # 30% loss
        elif weather_risk > 50:
            loss_percentage = 0.20
        elif weather_risk > 30:
            loss_percentage = 0.10
        else:
            loss_percentage = 0.05
        
        daily_loss = avg_daily_earnings * loss_percentage
        weekly_loss = daily_loss * 7
        
        return {
            'daily_loss': round(daily_loss, 2),
            'weekly_loss': round(weekly_loss, 2),
            'loss_percentage': loss_percentage * 100,
            'weather_risk': weather_risk
        }