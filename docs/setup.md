# ULTRON Setup & Configuration

## 1. Prerequisites

- **Node.js**: v20 or newer (v22+ recommended)
- **npm**: v10+
- **Python**: 3.11 or 3.12
- **Web Browser**: Chrome, Edge, Brave, or Firefox with WebGL 2 enabled.
- **Hardware**: Standard built-in or USB webcam and microphone.

---

## 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at `http://127.0.0.1:5173`.

---

## 3. Backend Setup

```bash
cd backend
python -m venv .venv
```

**Windows (PowerShell)**:
```powershell
.venv\Scripts\activate
```

**Linux / macOS**:
```bash
source .venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
copy .env.example .env  # On Linux/macOS: cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

---

## 4. Environment Variables (`backend/.env`)

```ini
# Server Settings
ULTRON_HOST=127.0.0.1
ULTRON_PORT=8000
ULTRON_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# LLM Configuration (Provider-Agnostic)
# Options: "ollama", "openai", "groq", "anthropic"
LLM_PROVIDER=ollama
LLM_BASE_URL=http://127.0.0.1:11434/v1
LLM_MODEL=llama3.1
LLM_API_KEY=

# Speech System
STT_PROVIDER=browser
TTS_PROVIDER=browser
WAKE_WORD=ultron

# Home Assistant Integration (Optional)
HOME_ASSISTANT_URL=http://homeassistant.local:8123
HOME_ASSISTANT_TOKEN=

# ESP32 MQTT Broker (Optional)
MQTT_HOST=127.0.0.1
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_TOPIC_PREFIX=ultron
```

---

## 5. Offline Capabilities

ULTRON is engineered with an offline-first architecture:
- 3D rendering and gesture processing run 100% locally in the browser.
- Local LLM inference is supported out of the box via Ollama (`llama3.1`, `mistral`, `gemma2`).
- Smart `OfflineMockProvider` allows full spatial commands and device automation testing even with zero network connectivity.
