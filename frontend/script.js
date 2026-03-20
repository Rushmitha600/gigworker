// ==================== API CONFIG ====================
const API_URL = ''; // Update with your backend URL

// ==================== APP STATE ====================
let userLocations = [];

// ==================== DARK MODE - FIXED ====================
// This runs IMMEDIATELY before anything else
(function() {
    console.log('🚀 Dark mode initializing...');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // Apply theme immediately
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
})();

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('App initializing...');
    
    // Fix theme toggle button
    fixThemeToggle();
    
    loadTheme();
    checkUserLocations();
    setupNavigation();
    setupEventListeners();
});

// ==================== FIX THEME TOGGLE ====================
function fixThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        // Set correct icon based on current theme
        if (document.body.classList.contains('dark-mode')) {
            themeToggle.textContent = '☀️';
        } else {
            themeToggle.textContent = '🌙';
        }
        
        // Remove any existing listeners and add new one
        themeToggle.replaceWith(themeToggle.cloneNode(true));
        const newToggle = document.getElementById('themeToggle');
        newToggle.addEventListener('click', function(e) {
            e.preventDefault();
            toggleTheme();
        });
    }
}
function setTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('themeToggle').textContent = '🌙';
        localStorage.setItem('theme', 'light');
    }
    
    // Update active state in settings
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.remove('active');
        if ((theme === 'dark' && opt.textContent.includes('Dark')) || 
            (theme === 'light' && opt.textContent.includes('Light'))) {
            opt.classList.add('active');
        }
    });
}

// ==================== THEME FUNCTIONS ====================
function toggleTheme() {
    console.log('Toggling theme...');
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    
    if (body.classList.contains('dark-mode')) {
        // Switch to light
        body.classList.remove('dark-mode');
        if (themeToggle) themeToggle.textContent = '🌙';
        localStorage.setItem('theme', 'light');
        console.log('Switched to light mode');
    } else {
        // Switch to dark
        body.classList.add('dark-mode');
        if (themeToggle) themeToggle.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
        console.log('Switched to dark mode');
    }
}

function loadTheme() {
    // Already applied at top, just ensure toggle is correct
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        if (document.body.classList.contains('dark-mode')) {
            themeToggle.textContent = '☀️';
        } else {
            themeToggle.textContent = '🌙';
        }
    }
}

// ==================== LOCATION FUNCTIONS ====================
function checkUserLocations() {
    console.log('Checking user locations...');

    // First check localStorage
    const saved = localStorage.getItem('userLocations');
    if (saved) {
        userLocations = JSON.parse(saved);
    }

    // Then sync with backend
    fetch(`${API_URL}/api/locations`)
        .then(res => res.json())
        .then(data => {
            const backendLocations = data.locations || [];
            
            // If backend has locations but localStorage doesn't
            if (backendLocations.length > 0 && (!userLocations || userLocations.length === 0)) {
                userLocations = backendLocations;
                localStorage.setItem('userLocations', JSON.stringify(backendLocations));
            }
            // If localStorage has locations but backend doesn't
            else if (userLocations.length > 0 && backendLocations.length === 0) {
                // Save to backend
                fetch(`${API_URL}/api/locations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ locations: userLocations })
                });
            }

            if (!userLocations || userLocations.length === 0) {
                showLocationModal();
            } else {
                // Hide modal & show app
                document.getElementById('locationModal').style.display = 'none';
                document.getElementById('appContainer').style.display = 'block';
                document.getElementById('chatbotWidget').style.display = 'block';

                // Fill settings inputs
                if (userLocations[0]) document.getElementById('settings-location1').value = userLocations[0];
                if (userLocations[1]) document.getElementById('settings-location2').value = userLocations[1];
                if (userLocations[2]) document.getElementById('settings-location3').value = userLocations[2];

                // Fetch weather for saved locations
                loadSavedLocationsWeather();
            }
        })
        .catch(err => {
            console.error('Error fetching user locations from backend:', err);
            // If backend fails, use localStorage
            if (userLocations && userLocations.length > 0) {
                document.getElementById('locationModal').style.display = 'none';
                document.getElementById('appContainer').style.display = 'block';
                document.getElementById('chatbotWidget').style.display = 'block';
                loadSavedLocationsWeather();
            } else {
                showLocationModal();
            }
        });
}

function showLocationModal() {
    document.getElementById('locationModal').style.display = 'flex';
}

function saveUserLocations() {
    const loc1 = document.getElementById('location1').value.trim();
    const loc2 = document.getElementById('location2').value.trim();
    const loc3 = document.getElementById('location3').value.trim();
    
    const locations = [];
    if (loc1) locations.push(loc1);
    if (loc2) locations.push(loc2);
    if (loc3) locations.push(loc3);
    
    if (locations.length === 0) {
        alert('Please enter at least one location');
        return;
    }
    
    // LocalStorage lo save
    localStorage.setItem('userLocations', JSON.stringify(locations));
    userLocations = locations;
    
    // ✅ IMPORTANT: Backend ki kuda save chey
    fetch(`${API_URL}/api/locations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locations: locations })
    })
    .then(res => res.json())
    .then(data => {
        console.log('✅ Locations saved to backend:', data);
    })
    .catch(err => {
        console.error('❌ Error saving locations to backend:', err);
    });
    
    // UI updates
    document.getElementById('locationModal').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('chatbotWidget').style.display = 'block';
    
    if (loc1) document.getElementById('settings-location1').value = loc1;
    if (loc2) document.getElementById('settings-location2').value = loc2;
    if (loc3) document.getElementById('settings-location3').value = loc3;
    
    loadAppData();
    alert('Locations saved successfully!');
}

function updateUserLocations() {
    const loc1 = document.getElementById('settings-location1').value.trim();
    const loc2 = document.getElementById('settings-location2').value.trim();
    const loc3 = document.getElementById('settings-location3').value.trim();
    

    const locations = [];
    if (loc1) locations.push(loc1);
    if (loc2) locations.push(loc2);
    if (loc3) locations.push(loc3);
    
    if (locations.length === 0) {
        alert('Please enter at least one location');
        return;
    }
    
    // LocalStorage lo save
    localStorage.setItem('userLocations', JSON.stringify(locations));
    userLocations = locations;
    
    // ✅ Backend ki save chey
    fetch(`${API_URL}/api/locations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locations: locations })
    })
    .then(res => res.json())
    .then(data => {
        console.log('✅ Locations updated in backend:', data);
        loadSavedLocationsWeather();
        alert('Locations updated successfully!');
    })
    .catch(err => {
        console.error('❌ Error updating locations in backend:', err);
        alert('Locations updated locally but failed to save to server!');
    });
}

// ==================== NAVIGATION FUNCTIONS ====================
function setupNavigation() {
    console.log('Setting up navigation...');
    const navBtns = document.querySelectorAll('.nav-btn');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            console.log('Navigating to:', section);
            showSection(section);
        });
    });

    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            document.querySelector('.nav-items').classList.toggle('show');
        });
    }
}

function toggleChatbotVisibility(section) {
    const chatbot = document.getElementById('chatbotWidget');
    if (!chatbot) return;
    
    // Show chatbot only on home page
    if (section === 'home') {
        chatbot.style.display = 'block';
    } else {
        chatbot.style.display = 'none';
    }
}


function showSection(section) {
    console.log('Showing section:', section);
    
    // Update active button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if(btn.dataset.section === section) {
            btn.classList.add('active');
        }
    });
    
    // Show selected section
    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
    });
    
    const targetSection = document.getElementById(section + '-section');
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Close mobile menu
    document.querySelector('.nav-items')?.classList.remove('show');
    
    // CONTROL CHATBOT VISIBILITY - Only on home page
    const chatbot = document.getElementById('chatbotWidget');
    if (chatbot) {
        if (section === 'home') {
            chatbot.style.display = 'block';
        } else {
            chatbot.style.display = 'none';
        }
    }
    
    // Load section-specific data
    if (section === 'home') {
        loadSavedLocationsWeather();
    } else if (section === 'plans') {
        loadPlans();
    } else if (section === 'claims') {
        loadClaimsInfo();
    }
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    
    // Weather search
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', getWeatherAndForecast);
    }
    
    const weatherInput = document.getElementById('weatherCity');
    if (weatherInput) {
        weatherInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                getWeatherAndForecast();
            }
        });
    }

    // Premium calculator
    const premiumCityInput = document.getElementById('premium-city-input');
    if (premiumCityInput) {
        premiumCityInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                calculatePremium();
            }
        });
    }
}

// ==================== WEATHER FUNCTIONS ====================
// ==================== HOME PAGE WEATHER - REAL DATA ONLY ====================
// ==================== HOME PAGE WEATHER - FIXED VERSION ====================
function loadSavedLocationsWeather() {
    const container = document.getElementById('savedLocationsWeather');
    if (!container) return;
    
    if (!userLocations || userLocations.length === 0) {
        container.innerHTML = '<div class="loading">No locations saved. Go to Settings to add locations.</div>';
        return;
    }
    
    container.innerHTML = '<div class="loading">Loading weather data for your locations...</div>';
    
    // Instead of calling API, just fetch each location directly
    // This is a temporary fix - let's get weather for each city one by one
    
    let locationsHtml = '';
    let promises = [];
    
    userLocations.forEach(city => {
        // Create a promise for each city
        const promise = fetch(`${API_URL}/api/weather/${encodeURIComponent(city)}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const riskClass = data.risk_score > 60 ? 'risk-high' : 
                                    data.risk_score > 40 ? 'risk-medium' : 'risk-low';
                    
                    return `
                        <div class="location-weather-card">
                            <div class="location-header">
                                <h3>${data.city}</h3>
                            </div>
                            <div class="weather-temp-large">${data.temperature}°C</div>
                            <div class="weather-condition">${data.condition}</div>
                            <span class="risk-badge ${riskClass}">${data.risk_level} Risk (${data.risk_score})</span>
                            
                            <div class="weather-details">
                                <div class="weather-detail-item">
                                    <span>💧 Humidity</span>
                                    <strong>${data.humidity}%</strong>
                                </div>
                                <div class="weather-detail-item">
                                    <span>💨 Wind</span>
                                    <strong>${data.wind_speed} km/h</strong>
                                </div>
                            </div>
                            
                            <div class="precautions">
                                <h4>🛡️ Today's Precautions</h4>
                                <ul class="precautions-list">
                                    ${data.precautions.map(p => `<li>${p}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    `;
                } else {
                    return `
                        <div class="location-weather-card">
                            <div class="location-header">
                                <h3>${city}</h3>
                            </div>
                            <div class="error-message" style="color: #f56565; padding: 20px; text-align: center;">
                                ❌ Weather not available for ${city}<br>
                                <small>${data.error || 'Please check city name'}</small>
                            </div>
                        </div>
                    `;
                }
            })
            .catch(err => {
                console.error(`Error fetching ${city}:`, err);
                return `
                    <div class="location-weather-card">
                        <div class="location-header">
                            <h3>${city}</h3>
                        </div>
                        <div class="error-message" style="color: #f56565; padding: 20px; text-align: center;">
                            ❌ Error loading weather for ${city}
                        </div>
                    </div>
                `;
            });
        
        promises.push(promise);
    });
    
    // Wait for all promises to resolve
    Promise.all(promises).then(results => {
        container.innerHTML = results.join('');
        
        // Count high risk locations
        const highRiskCount = Array.from(document.querySelectorAll('.risk-badge'))
            .filter(badge => badge.textContent.includes('High')).length;
        
        const riskSummary = document.getElementById('riskSummary');
        if (riskSummary) {
            if (highRiskCount > 0) {
                riskSummary.innerHTML = `
                    <h3>⚠️ High Risk Alert</h3>
                    <p>${highRiskCount} location(s) have HIGH risk today. Coverage is active.</p>
                `;
            } else {
                riskSummary.innerHTML = `
                    <h3>✅ All Clear</h3>
                    <p>No high risk conditions in your locations.</p>
                `;
            }
        }
    });
}

function displayWeatherCards(locations) {
    const container = document.getElementById('savedLocationsWeather');
    if (!container) return;
    
    let html = '';
    let highRiskCount = 0;
    
    locations.forEach((loc, index) => {
        const riskClass = loc.risk_score > 60 ? 'risk-high' : 
                        loc.risk_score > 40 ? 'risk-medium' : 'risk-low';
        
        if (loc.risk_score > 60) highRiskCount++;
        
        html += `
            <div class="location-weather-card ${index === 0 ? 'primary' : ''}">
                <div class="location-header">
                    <h3>${loc.city}</h3>
                    ${index === 0 ? '<span class="primary-badge">PRIMARY</span>' : ''}
                </div>
                <div class="weather-temp-large">${loc.temperature}°C</div>
                <div class="weather-condition">${loc.condition}</div>
                <span class="risk-badge ${riskClass}">${loc.risk_level} Risk (${loc.risk_score})</span>
                
                <div class="weather-details">
                    <div class="weather-detail-item">
                        <span>💧 Humidity</span>
                        <strong>${loc.humidity}%</strong>
                    </div>
                    <div class="weather-detail-item">
                        <span>💨 Wind</span>
                        <strong>${loc.wind_speed} km/h</strong>
                    </div>
                </div>
                
                <div class="precautions">
                    <h4>🛡️ Today's Precautions</h4>
                    <ul class="precautions-list">
                        ${loc.precautions.map(p => `<li>${p}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    const riskSummary = document.getElementById('riskSummary');
    if (riskSummary) {
        if (highRiskCount > 0) {
            riskSummary.innerHTML = `
                <h3>⚠️ High Risk Alert</h3>
                <p>${highRiskCount} location(s) have HIGH risk today. Coverage is active.</p>
            `;
        } else {
            riskSummary.innerHTML = `
                <h3>✅ All Clear</h3>
                <p>No high risk conditions in your locations.</p>
            `;
        }
    }
}

function getWeatherAndForecast() {
    const city = document.getElementById('weatherCity').value.trim();

    if (!city) {
        alert('Please enter a city name');
        return;
    }
    // ===== WEEKLY FORECAST =====
    fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=bb2d87b40339704b46f88cfc9c6782fd`)
    .then(res => res.json())
    .then(data => {
        const forecastDiv = document.getElementById("weeklyForecast");
        let html = "<h3>📅 Weekly Forecast</h3><div class='forecast-container'>";

        for (let i = 0; i < data.list.length; i += 8) {
            const item = data.list[i];

            const date = new Date(item.dt * 1000).toDateString();

            html += `
            <div class="forecast-card">
                <h4>${date}</h4>
                <p>🌡 ${item.main.temp}°C</p>
                <p>${item.weather[0].description}</p>
                <p>💧 ${item.main.humidity}%</p>
            </div>
        `;
    }

        html += "</div>";

        forecastDiv.innerHTML = html;

});
    const detailDiv = document.getElementById('weatherDetail');
    detailDiv.innerHTML = '<div class="loading">Loading weather...</div>';

    fetch(`${API_URL}/api/weather/${city}`)
        .then(res => res.json())
        .then(data => {

            if (!data.success) {
                detailDiv.innerHTML = `<div class="error">❌ ${data.error}</div>`;
                return;
            }

            const riskClass =
                data.risk_score > 60 ? "risk-high" :
                data.risk_score > 40 ? "risk-medium" :
                "risk-low";

            let weatherHtml = `
                <div class="weather-main">
                    <div class="weather-temp">${data.temperature}°C</div>
                    <div class="weather-condition">${data.condition}</div>
                    <span class="risk-badge ${riskClass}">
                        ${data.risk_level} Risk (${data.risk_score})
                    </span>
                </div>

                <div class="weather-details">
                    <div class="detail-item">
                        <span class="detail-label">💧 Humidity</span>
                        <span class="detail-value">${data.humidity}%</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">💨 Wind</span>
                        <span class="detail-value">${data.wind_speed} km/h</span>
                    </div>
                </div>

                <div class="precautions-section">
                    <h4>🛡️ Safety Precautions</h4>
                    <ul>
                        ${data.precautions.map(p => `<li>${p}</li>`).join("")}
                    </ul>
                </div>
            `;

            detailDiv.innerHTML = weatherHtml;
        })
        .catch(err => {
            console.error(err);
            detailDiv.innerHTML = "<div class='error'>❌ Error loading weather</div>";
        });
}

// ==================== PLANS FUNCTIONS ====================
// ==================== PLANS FUNCTIONS ====================

function loadPlans() { 
    const container = document.getElementById('plansContainer'); 
    if (!container) return; 

    const plans = [ 
        {
            name: 'Basic Plan',
            price_per_week: '₹100',
            price_per_month: '₹380',
            coverage: 'Up to ₹2,000 per week',
            features: [
                '🌧️ Rain coverage',
                '🌡️ Heat wave coverage',
                '❄️ Cold wave coverage'
            ],
            icon: '🛡️',
            popular: false
        },
        {
            name: 'Standard Plan',
            price_per_week: '₹200',
            price_per_month: '₹760',
            coverage: 'Up to ₹4,000 per week',
            features: [
                '✅ Everything in Basic',
                '⛈️ Storm coverage',
                '🌫️ Air pollution coverage',
                '24/7 support'
            ],
            icon: '⭐',
            popular: true
        },
        {
            name: 'Premium Plan',
            price_per_week: '₹300',
            price_per_month: '₹1140',
            coverage: 'Up to ₹7,000 per week',
            features: [
                '✨ Everything in Standard',
                '🌊 Natural disaster coverage',
                '🎉 Holiday bonus',
                'Priority claims'
            ],
            icon: '👑',
            popular: false
        }
    ];

    container.innerHTML = `
        <div class="plans-grid">
            ${plans.map(plan => `
                <div class="plan-card ${plan.popular ? 'popular' : ''}">
                    
                    ${plan.popular ? '<span class="popular-badge">🔥 Most Popular</span>' : ''}

                    <div class="plan-icon">${plan.icon}</div>

                    <div class="plan-name">${plan.name}</div>

                    <div class="plan-price">
                        ${plan.price_per_week}<small>/week</small>
                    </div>

                    <div class="plan-price">
                        ${plan.price_per_month}<small>/month</small>
                    </div>

                    <div class="plan-coverage">${plan.coverage}</div>

                    <ul class="plan-features">
                        ${plan.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>

                    <button class="select-plan-btn"
                        onclick="selectPlan('${plan.name}')">
                        Choose Plan
                    </button>

                </div>
            `).join('')}
        </div>
    `;
}


// ==================== SELECT PLAN ====================

function selectPlan(planName) {

    // Open premium calculator page
    showSection('premium');

    const planSelect = document.getElementById('premium-plan');

    if (!planSelect) return;

    if (planName.includes('Basic')) {
        planSelect.value = 'basic';
    }
    else if (planName.includes('Standard')) {
        planSelect.value = 'standard';
    }
    else if (planName.includes('Premium')) {
        planSelect.value = 'premium';
    }
}

// ==================== PREMIUM CALCULATOR ====================
function calculatePremium() {
    const city = document.getElementById('premium-city-input').value.trim();
    const mode = document.getElementById('delivery-mode').value;
    const experience = document.getElementById('experience').value;
    const hours = document.getElementById('work-hours').value;
    const plan = document.getElementById('premium-plan').value;
    const period = document.getElementById('payment-period').value;
    
    if (!city) {
        alert('Please enter a city name');
        return;
    }
    
    let basePrice = plan === 'basic' ? 100 : plan === 'standard' ? 200 : 300;
    
    let cityFactor = 1.0;
    const cityLower = city.toLowerCase();
    
    if (cityLower.includes('mumbai')) {
        cityFactor = 1.2;
    } else if (cityLower.includes('delhi')) {
        cityFactor = 1.15;
    } else if (cityLower.includes('bangalore')) {
        cityFactor = 1.1;
    } else if (cityLower.includes('chennai')) {
        cityFactor = 1.05;
    } else if (cityLower.includes('kolkata')) {
        cityFactor = 1.15;
    } else if (cityLower.includes('pune')) {
        cityFactor = 1.0;
    } else if (cityLower.includes('hyderabad')) {
        cityFactor = 1.05;
    } else {
        cityFactor = 1.1;
    }
    
    let modeFactor = mode === 'bike' ? 1.1 : mode === 'scooter' ? 1.0 : 0.9;
    let expFactor = Math.max(0.9, 1.0 - (experience * 0.02));
    let hoursFactor = hours > 10 ? 1.2 : hours > 8 ? 1.1 : 1.0;
    
    let weeklyAmount = Math.round(basePrice * cityFactor * modeFactor * expFactor * hoursFactor);
    let monthlyAmount = Math.round(weeklyAmount * 4 * 0.9);
    
    const amount = period === 'weekly' ? weeklyAmount : monthlyAmount;
    
    document.getElementById('premiumAmount').textContent = `₹${amount}`;
    document.getElementById('premiumPeriod').textContent = 
        period === 'weekly' ? 'per week' : 'per month (10% discount applied)';
    
    const displayCity = city.charAt(0).toUpperCase() + city.slice(1);
    
    document.getElementById('premiumBreakdown').innerHTML = `
        <div class="breakdown-item"><span>Base Price:</span> <span>₹${basePrice}</span></div>
        <div class="breakdown-item"><span>City Factor (${displayCity}):</span> <span>${cityFactor.toFixed(2)}x</span></div>
        <div class="breakdown-item"><span>Vehicle Factor:</span> <span>${modeFactor}x</span></div>
        <div class="breakdown-item"><span>Experience Factor:</span> <span>${expFactor.toFixed(2)}x</span></div>
        <div class="breakdown-item"><span>Hours Factor:</span> <span>${hoursFactor}x</span></div>
        <div class="breakdown-item" style="font-weight: bold; border-top: 2px solid var(--accent); margin-top: 8px; padding-top: 8px;">
            <span>Total:</span> <span>₹${amount}</span>
        </div>
    `;
    
    document.getElementById('premiumResult').style.display = 'block';
}

// ==================== CLAIMS FUNCTIONS ====================
function loadClaimsInfo() {
    const mockClaimsInfo = {
        process: [
            {step: 1, title: 'Weather Monitoring', description: '24/7 monitoring of your locations', icon: '🌤️'},
            {step: 2, title: 'Auto-Trigger', description: 'Claim starts when conditions exceed thresholds', icon: '⚡'},
            {step: 3, title: 'Amount Calculation', description: 'Based on your earnings and weather severity', icon: '💰'},
            {step: 4, title: 'Instant Payment', description: 'Money in your bank within 24 hours', icon: '💸'}
        ],
        coverage_details: [
            {condition: 'Heavy Rain (>75mm)', payout: '50-70% of earnings', threshold: '4+ hours of rain'},
            {condition: 'Heat Wave (>40°C)', payout: '40-60% of earnings', threshold: 'Peak hours 12-4 PM'},
            {condition: 'Storm/Cyclone', payout: '60-80% of earnings', threshold: 'Wind speed >60 km/h'}
        ],
        faq: [
            {q: 'How are payouts calculated?', a: 'Based on your average daily earnings × weather impact percentage'},
            {q: 'When will I receive money?', a: 'Within 24 hours of the weather event'},
            {q: 'Do I need to file anything?', a: 'No! It\'s completely automatic'}
        ]
    };
    
    const processContainer = document.getElementById('claimsProcess');
    if (processContainer) {
        processContainer.innerHTML = mockClaimsInfo.process.map(step => `
            <div class="process-step">
                <div class="step-number">${step.step}</div>
                <div class="step-icon">${step.icon}</div>
                <div class="step-title">${step.title}</div>
                <div class="step-description">${step.description}</div>
            </div>
        `).join('');
    }
    
    const coverageGrid = document.getElementById('coverageGrid');
    if (coverageGrid) {
        coverageGrid.innerHTML = mockClaimsInfo.coverage_details.map(item => `
            <div class="coverage-item">
                <h4>${item.condition}</h4>
                <p>💰 Payout: ${item.payout}</p>
                <p>⚡ Trigger: ${item.threshold}</p>
            </div>
        `).join('');
    }
    
    const faqList = document.getElementById('claimsFaqList');
    if (faqList) {
        faqList.innerHTML = mockClaimsInfo.faq.map((item, index) => `
            <div class="faq-item" onclick="this.classList.toggle('active')">
                <div class="faq-question">
                    ${item.q}
                    <span>▼</span>
                </div>
                <div class="faq-answer">${item.a}</div>
            </div>
        `).join('');
    }
}

// ==================== EXPOSE GLOBAL FUNCTIONS ====================
window.toggleTheme = toggleTheme;
window.saveUserLocations = saveUserLocations;
window.updateUserLocations = updateUserLocations;
window.showSection = showSection;
window.selectPlan = selectPlan;
window.calculatePremium = calculatePremium;
window.getWeatherAndForecast = getWeatherAndForecast;