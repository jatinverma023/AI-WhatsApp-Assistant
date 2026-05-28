# 🤖 WhatsApp AI Bot

An AI-powered WhatsApp chatbot built with **Python**, **FastAPI**, **Google Gemini 2.5 Flash**, and **Twilio**.

## Features

- 💬 Receive and reply to WhatsApp messages automatically
- 🧠 AI-powered responses using Google Gemini 2.5 Flash
- 🧵 Conversation memory — maintains context per user
- 👥 Multi-user support
- 🏗️ Clean, scalable architecture ready for SaaS

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Python 3.11+ | Core language |
| FastAPI | Web framework (async) |
| Google Gemini | AI response generation |
| Twilio | WhatsApp messaging API |
| ngrok | Local tunnel for webhooks |

## Quick Start

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd WPBot

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Setup environment variables
cp .env.example .env
# Edit .env with your API keys

# 5. Run the server
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check — verify server is running |
| GET | `/health` | Detailed health status |
| GET | `/docs` | Interactive API documentation (Swagger) |

## Project Structure

```
WPBot/
├── src/
│   ├── api/            # HTTP route handlers
│   ├── services/       # Business logic (AI, messaging)
│   ├── config/         # Environment & settings
│   ├── models/         # Data schemas
│   ├── utils/          # Shared helpers
│   └── main.py         # App entry point
├── requirements.txt
├── .env.example
└── README.md
```

## Development Status

- [x] Phase 1: Foundation Setup
- [ ] Phase 2: Twilio Webhook + Gemini Integration
- [ ] Phase 3: Conversation Memory
- [ ] Phase 4: Advanced Features
- [ ] Phase 5: SaaS Scaling

## License

MIT
