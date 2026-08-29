# ULTRON — Multimodal 3D Spatial AI Interface

> A futuristic AI command center and spatial interface controlled by webcam hand gestures, voice commands, provider-agnostic AI reasoning, and IoT device automation.

![ULTRON Interface Preview](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/og.jpg)

---

## 🌟 Core Features

- **🖐️ 3D Spatial Hand & Finger Tracking**: Real-time 21-landmark tracking via MediaPipe Tasks Vision (GPU accelerated).
- **🪐 Multiple Interactive 3D Scenes**:
  - **Galaxy**: Supermassive particle core, spiral arms, and star fields.
  - **Solar System**: Interactive planets, orbital rings, and the Sun.
  - **Earth**: Procedural atmospheric globe, clouds, satellite, and regional data beacons.
  - **Neural Network**: 3D synapses with firing impulse pulses and interactive neuron layers.
  - **Digital Globe**: Cyber wireframe globe with global data hub nodes.
  - **System Visualization**: ULTRON Quantum Processing Unit cube and subsystem modules.
- **✨ 3D Virtual Cursor & Spatial Dragging**:
  - Holographic reticle follows index fingertip with smooth exponential interpolation.
  - Pinch-to-grab: Objects follow cursor in 3D world space and persist in place upon release.
- **🎙️ Continuous Voice & Wake-Word Engine**:
  - Wake phrase: `"Ultron"` (e.g. *"Ultron, show Earth"*, *"Ultron, rotate galaxy"*, *"Ultron, zoom in"*).
  - Real-time STT and speech synthesis (TTS) feedback.
- **🧠 Provider-Independent AI Agent & Whitelisted Tools**:
  - Supports **Ollama (local LLM)**, **OpenAI-compatible APIs**, and offline mock fallback.
  - Whitelisted tool calling for spatial controls, weather, time, website opening, and system telemetry.
  - Multimodal context reasoning: Point at an object and say *"Tell me about this"*.
- **🏠 Smart Home & Hardware Automation**:
  - **Home Assistant** REST integration for lights, switches, and scenes.
  - **ESP32 MQTT Bridge** for IoT relays and real-time temperature/humidity telemetry.
- **📊 Futuristic Cyber HUD**:
  - Live 2D MediaPipe skeleton tracker tile.
  - Subsystem status telemetry, IoT device switches, and real-time audio transcripts.
  - **`F3` Debug Overlay**: Real-time FPS, gesture confidence, normalized coords, and memory diagnostics.

---

## 🚀 Quick Start Guide

### 1. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **`http://127.0.0.1:5173`** in your browser.

### 2. Start Backend

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

```bash
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

---

## 🎮 Spatial Gesture Controls

| Gesture | Action |
| --- | --- |
| **Point (Index Finger)** | Move finger to rotate 3D scene smoothly |
| **Pinch (Thumb + Index)** | Lock on / select 3D entity or planet |
| **Grab (Fist)** | Drag selected 3D object in 3D world space |
| **Two Fingers Up** | Move up/down or depth for camera zoom |
| **Open Palm** | Release object & return to neutral idle |
| **Swipe Left / Right** | 90° quick scene rotation |
| **`F3`** | Toggle diagnostic debug overlay |
| **`Space` / `R`** | Pause auto-orbit / Reset camera |

---

## 🧪 Testing

### Frontend Build
```bash
cd frontend
npm run build
```

### Backend Test Suite
```bash
cd d:\JARVIS-Ultron
backend\.venv\Scripts\python.exe -m pytest
```

---

## 📖 Documentation

- [Architecture Guide](docs/architecture.md)
- [Gesture Controls & Landmark Topology](docs/gestures.md)
- [Setup & Environment Configuration](docs/setup.md)
- [REST & WebSocket API Reference](docs/api.md)
- [ESP32 & IoT Hardware Guide](docs/hardware.md)
