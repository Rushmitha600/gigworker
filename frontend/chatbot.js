// ==================== SMART AI CHATBOT ====================
let chatOpen = true;
let trainingData = {
    faq: [],
    responses: [],
    greetings: {},
    fallback: "I can help with plans, claims, weather, and premiums. What would you like to know?"
};

// Load training data
async function loadTrainingData() {
    try {
        // Load the combined JSON file - FIXED PATH
        const response = await fetch('data/chatbot_responses.json');
        if (response.ok) {
            const data = await response.json();
            trainingData.faq = data.faq || [];
            trainingData.responses = data.responses || [];
            console.log(`✅ Loaded ${trainingData.faq.length} FAQ items and ${trainingData.responses.length} responses`);
        }
        
        // Load greetings
        const greetResponse = await fetch('data/greetings.json');
        if (greetResponse.ok) {
            const data = await greetResponse.json();
            trainingData.greetings = data.greetings || {};
            trainingData.fallback = data.fallback || trainingData.fallback;
            console.log('✅ Loaded greetings data');
        }

        // CSV file load
        const csvResponse = await fetch('data/chatbot_responses.csv');
        if (csvResponse.ok) {
            const text = await csvResponse.text();
            const rows = text.split("\n");
            rows.slice(1).forEach(row => {
                if (row.trim()) {
                    const cols = row.split(",");
                    if(cols.length >= 2){
                        trainingData.faq.push({
                            question: cols[0].trim(),
                            answer: cols[1].trim()
                        });
                    }
                }
            });
            console.log(`✅ Loaded ${trainingData.faq.length} CSV questions`);
        }
    } catch (error) {
        console.log('Using built-in training data');
        trainingData.responses = [
            {
                keywords: ["hi", "hello", "hey"],
                response: "👋 Hello! How can I help?",
                category: "greeting"
            },
            {
                keywords: ["plan", "insurance"],
                response: "We have Basic (₹100), Standard (₹200), Premium (₹300)",
                category: "plans"
            },
            {
                keywords: ["claim", "payout"],
                response: "⚡ Claims are automatic! We pay within 24 hours.",
                category: "claims"
            }
        ];
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadTrainingData();
    
    const messagesDiv = document.getElementById('chatMessages');
    if (messagesDiv && messagesDiv.children.length === 0) {
        addMessage("👋 Hi! I'm your AI assistant. Ask me about insurance, claims, weather, or premiums!", 'bot');
    }
    
    // Initialize chat state
    const chatBody = document.getElementById('chatBody');
    const chatToggle = document.getElementById('chatToggle');
    if (chatBody && chatToggle) {
        chatBody.style.display = 'flex';
        chatToggle.textContent = '✕';
        chatOpen = true;
    }
    
    // Add enter key listener
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if(e.key === "Enter") {
                sendMessage();
            }
        });
    }
});

// ==================== TOGGLE CHAT FUNCTION ====================
function toggleChat() {
    const chatBody = document.getElementById('chatBody');
    const chatToggle = document.getElementById('chatToggle');
    
    if (!chatBody || !chatToggle) {
        console.error('Chat elements not found');
        return;
    }
    
    if (chatOpen) {
        // Minimize chat
        chatBody.style.display = 'none';
        chatToggle.textContent = '💬';
        chatOpen = false;
        console.log('Chat minimized');
    } else {
        // Expand chat
        chatBody.style.display = 'flex';
        chatToggle.textContent = '✕';
        chatOpen = true;
        console.log('Chat expanded');
    }
}

// ==================== SIMILARITY FUNCTION - FIXED ====================
function similarity(a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();
    
    let longer = a.length > b.length ? a : b;
    let shorter = a.length > b.length ? b : a;
    let same = 0;
    
    for (let char of shorter) {
        if (longer.includes(char)) {
            same++;
        }
    }
    
    return same / longer.length;
}

// ==================== SEND MESSAGE FUNCTION ====================
function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    addMessage(message, 'user');
    input.value = '';

    showTypingIndicator();

    // First try frontend smart AI
    const localResponse = getSmartResponse(message);

    // If local AI found good answer
    if (localResponse && localResponse !== trainingData.fallback) {
        setTimeout(() => {
            removeTypingIndicator();
            addMessage(localResponse, 'bot');
        }, 500);
        return;
    }

    // Otherwise call backend AI
    fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: message })
    })
    .then(res => res.json())
    .then(data => {
        removeTypingIndicator();
        addMessage(data.response, 'bot');
    })
    .catch(() => {
        removeTypingIndicator();
        addMessage("⚠️ Server error. Please try again.", "bot");
    });
}

// ==================== SEND QUICK QUESTION ====================
function sendQuickQuestion(question) {
    addMessage(question, 'user');
    showTypingIndicator();

    const localResponse = getSmartResponse(question);

    if (localResponse && localResponse !== trainingData.fallback) {
        setTimeout(() => {
            removeTypingIndicator();
            addMessage(localResponse, 'bot');
        }, 400);
        return;
    }

    fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question })
    })
    .then(res => res.json())
    .then(data => {
        removeTypingIndicator();
        addMessage(data.response, "bot");
    })
    .catch(() => {
        removeTypingIndicator();
        addMessage("⚠️ Server error. Please try again.", "bot");
    });
}

// ==================== SMART RESPONSE LOGIC ====================
function getSmartResponse(message) {
    const input = message.toLowerCase().trim();
    
    // 1. Check greetings first
    if (trainingData.greetings[input]) {
        return trainingData.greetings[input];
    }
    
    // 2. Smart FAQ matching (AI similarity search)
    let bestAnswer = null;
    let bestScore = 0;
    
    if (trainingData.faq && trainingData.faq.length > 0) {
        for (let faq of trainingData.faq) {
            if (faq.question) {
                const question = faq.question.toLowerCase();
                const score = similarity(input, question);
                if (score > bestScore) {
                    bestScore = score;
                    bestAnswer = faq.answer;
                }
            }
        }
    }
    
    if (bestScore > 0.5) {
        return bestAnswer;
    }
    
    // 3. Check responses with keywords
    let bestMatch = null;
    let highestScore = 0;
    
    if (trainingData.responses && trainingData.responses.length > 0) {
        for (let item of trainingData.responses) {
            if (item.keywords) {
                for (let keyword of item.keywords) {
                    if (input.includes(keyword) || keyword.includes(input)) {
                        const score = Math.min(keyword.length, input.length);
                        if (score > highestScore) {
                            highestScore = score;
                            bestMatch = item.response;
                        }
                    }
                }
            }
        }
    }
    
    if (bestMatch) {
        return bestMatch;
    }

    // Detect "weather in city"
    const cityMatch = input.match(/weather in (\w+)/);
    if (cityMatch) {
        const city = cityMatch[1];
        return `🌤️ Checking weather for ${city}. Please open the Weather tab for detailed forecast and risk analysis.`;
    }
    
    // 4. Weather-specific logic
    if (input.includes('weather') || input.includes('temperature') || input.includes('rain') || input.includes('heat')) {
        const cities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'pune', 'hyderabad'];
        for (let city of cities) {
            if (input.includes(city)) {
                return `🌤️ Check weather for ${city} in the Weather tab! Our insurance covers weather-related income loss.`;
            }
        }
        return "You can check weather for any city in the Weather tab! We cover rain, heat waves, storms, and more.";
    }
    
    // 5. Premium calculation logic
    if (input.includes('premium') || input.includes('cost') || input.includes('price') || input.includes('how much')) {
        if (input.includes('basic')) {
            return "🛡️ Basic Plan: ₹100/week or ₹380/month. Covers rain, heat waves, cold waves up to ₹2,000.";
        }
        if (input.includes('standard')) {
            return "⭐ Standard Plan: ₹200/week or ₹760/month. Most popular! Covers storms & pollution too. Up to ₹4,000.";
        }
        if (input.includes('premium')) {
            return "👑 Premium Plan: ₹300/week or ₹1140/month. Maximum coverage with priority claims! Up to ₹7,000.";
        }
        return "💰 Premiums start from ₹100/week. Use the Premium Calculator for exact amount based on your city and vehicle!";
    }
    
    // 6. Claims logic
    if (input.includes('claim') || input.includes('payout') || input.includes('money') || input.includes('compensation')) {
        return "⚡ Claims are AUTOMATIC! We monitor weather 24/7 and pay within 24 hours. No paperwork needed!";
    }
    
    // 7. Location logic
    if (input.includes('location') || input.includes('city') || input.includes('where') || input.includes('area')) {
        return "📍 You can save up to 3 locations in Settings. We cover all major Indian cities including Mumbai, Delhi, Bangalore, Chennai, Kolkata, Pune, Hyderabad!";
    }
    
    // 8. Single word handling
    const singleWords = {
        'hi': '👋 Hello! How can I help?',
        'hello': '👋 Hi there!',
        'hey': 'Hey! 👋',
        'plan': 'We have Basic, Standard, and Premium plans. Which interests you?',
        'claim': '⚡ Claims are automatic! No paperwork needed.',
        'rain': '🌧️ Rain coverage activates at 75mm+. Get 50-70% of lost earnings.',
        'heat': '🌡️ Heat wave coverage at 40°C+. Get 40-60% of earnings.',
        'cold': '❄️ Cold wave coverage at 10°C-. Get 40-60% of earnings.',
        'storm': '⛈️ Storm coverage in Standard & Premium plans.',
        'cost': '💰 Premiums start from ₹100/week.',
        'price': '💰 Plans: Basic ₹100, Standard ₹200, Premium ₹300 per week.',
        'help': '🤖 I can help with plans, claims, weather, and premiums!',
        'thanks': '😊 You\'re welcome!',
        'bye': '👋 Goodbye! Stay safe!'
    };
    
    if (singleWords[input]) {
        return singleWords[input];
    }
    
    // 9. Handle spelling mistakes
    for (let [word, response] of Object.entries(singleWords)) {
        if (Math.abs(word.length - input.length) <= 2) {
            let common = 0;
            for (let char of input) {
                if (word.includes(char)) common++;
            }
            if (common >= Math.min(word.length, input.length) * 0.7) {
                return response + " (Did you mean '" + word + "'?)";
            }
        }
    }
    
    // 10. Fallback
    return trainingData.fallback || "I can help with plans, claims, weather, and premiums. What would you like to know?";
}

// ==================== ADD MESSAGE ====================
function addMessage(text, sender) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.innerHTML = `<div class="message-content">${text.replace(/\n/g, '<br>')}</div>`;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    // Keep only last 20 messages
    while (messagesDiv.children.length > 20) {
        messagesDiv.removeChild(messagesDiv.children[0]);
    }
}

// ==================== TYPING INDICATOR ====================
function showTypingIndicator() {
    const messagesDiv = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = '<div class="message-content">🤖 AI is typing...</div>';
    messagesDiv.appendChild(typingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function removeTypingIndicator() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
}

// Make functions global
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
window.sendQuickQuestion = sendQuickQuestion;