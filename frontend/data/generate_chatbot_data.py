import csv
import json
import random

plans = ["Basic plan", "Standard plan", "Premium plan"]
cities = ["Mumbai","Delhi","Bangalore","Chennai","Hyderabad","Kolkata","Pune","Vijayawada"]

questions = []
answers = []

# greetings
greetings = [
("hi","👋 Hello! How can I help you with GigSuraksha insurance?"),
("hello","👋 Hi there! Ask me about plans, weather, or claims."),
("hey","Hey! 👋 How can I help you today?")
]

for q,a in greetings:
    questions.append(q)
    answers.append(a)

# plans questions
for plan in plans:
    for i in range(80):
        questions.append(f"What is {plan}?")
        answers.append(f"{plan} provides weather protection and income safety for delivery workers.")

        questions.append(f"How much does {plan} cost?")
        answers.append(f"{plan} pricing is available in the plans section of the app.")

# weather questions
for city in cities:
    for i in range(30):
        questions.append(f"What is the weather in {city}?")
        answers.append(f"You can check live weather for {city} in the weather section of the app.")

        questions.append(f"Is rain expected in {city}?")
        answers.append(f"If heavy rain happens in {city}, insurance payout may trigger.")

# claim questions
claim_questions = [
"How do claims work?",
"How will I get money?",
"When will claim payment come?",
"How to request claim?",
"Is claim automatic?"
]

for q in claim_questions:
    for i in range(40):
        questions.append(q)
        answers.append("⚡ Claims are automatic. If bad weather affects work, payment is credited within 24 hours.")

# premium questions
premium_questions = [
"What is insurance premium?",
"How much insurance cost?",
"Calculate premium",
"Price of insurance",
"Weekly insurance price"
]

for q in premium_questions:
    for i in range(40):
        questions.append(q)
        answers.append("💰 Insurance premium starts from ₹100 per week. Use the Premium Calculator for exact cost.")

# create CSV
with open("chatbot_training_data.csv","w",newline='',encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["question","answer"])
    for q,a in zip(questions,answers):
        writer.writerow([q,a])

# create JSON
data = [{"question":q,"answer":a} for q,a in zip(questions,answers)]

with open("chatbot_training_data.json","w",encoding="utf-8") as f:
    json.dump(data,f,indent=4)

print("✅ Files created successfully")
print(f"Total Q&A generated: {len(data)}")