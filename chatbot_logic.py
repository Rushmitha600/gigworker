def get_response(msg):

    msg = msg.lower()

    if "hi" in msg or "hello" in msg:
        return "Hi! I'm SafeRide Buddy 🤖 How can I help you?"

    elif "insurance" in msg:
        return "Income protection insurance helps delivery partners recover earnings lost due to weather disruptions."

    elif "risk" in msg or "rain" in msg:
        return "⚠️ Heavy rain expected tomorrow. Your deliveries may reduce."

    elif "claim" in msg:
        return "To file a claim: 1. Confirm disruption 2. Submit delivery details."

    else:
        return "Sorry, I didn't understand. Please ask about insurance, risk alerts, or claims."