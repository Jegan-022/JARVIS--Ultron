# ULTRON Architecture

ULTRON is a futuristic multimodal AI spatial computing interface structured as a high-performance monorepo:
- **Frontend**: React 19, TypeScript, Vite, Three.js, React Three Fiber, Drei, MediaPipe Tasks Vision, Web Speech API, Tailwind CSS.
- **Backend**: FastAPI, WebSockets, Pydantic, AsyncIO, Provider-Agnostic LLM Engine, Home Assistant REST, MQTT Bridge.
- **Perception Layer**: Client-side MediaPipe HandLandmarker (21 landmarks) running at 60 FPS.
- **Voice System**: Client-side Web Speech Recognition with "Ultron" wake-word parser & speech synthesis.
- **Device & IoT Integration**: Home Assistant REST API and ESP32 MQTT pub/sub broker.

```
                                  ┌───────────────────────────┐
                                  │        ULTRON CORE        │
                                  │   (FastAPI / WebSocket)   │
                                  └─────────────┬─────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ↓                              ↓                              ↓
          VISION PIPELINE                 VOICE SYSTEM                     AI AGENT
          (MediaPipe Tasks)              (STT / TTS Engine)            (LLM / Tools)
                 ↓                              ↓                              ↓
          21 Hand Landmarks             Wake-Word ("Ultron")           Whitelisted Tool
          & Gesture Engine               & Natural Commands             Call Execution
                 └──────────────────────────────┼──────────────────────────────┘
                                                ↓
                                    MULTIMODAL CONTEXT BUS
                                                ↓
              ┌─────────────────────────────────┼─────────────────────────────────┐
              ↓                                 ↓                                 ↓
      THREE.JS 3D SCENES                HOST AUTOMATION                     IoT & DEVICES
  - Galaxy Particle Spiral           - Whitelisted PC tools             - Home Assistant
  - Solar System & Planets           - Weather / Reminders              - ESP32 Microcontrollers
  - Detailed Earth Globe             - Web Queries                      - MQTT Sensor Telemetry
  - 3D Neural Architecture           - System Status Diagnostics        - Smart Bulbs & Relays
  - Digital Cyber Globe
  - System Core Visualization
```

## Data Flow & Processing Loops

1. **Vision Perception**:
   - `WebcamManager` captures live 60 FPS video stream.
   - `HandTracker` processes 21 3D landmarks via `@mediapipe/tasks-vision` (GPU accelerated with CPU fallback).
   - `HandLandmarkProcessor` calculates finger extensions, pinch distances, and gesture classifications.
   - `GestureStateMachine` applies hysteresis and debouncing, routing normalized deltas to `SpatialInteractionEngine`.
   - `VirtualCursor` projects the index fingertip into 3D world space with state-reactive reticles.

2. **Voice Interaction**:
   - `VoiceManager` performs continuous STT and filters for wake-word `"Ultron"`.
   - Direct spatial commands ("rotate left", "show earth", "zoom in") execute instantly via local scene dispatchers.
   - Natural language queries forward to `/api/ai/command` with multimodal context (`activeScene`, `selectedObject`, `handGesture`).
   - Responses are verbalized via SpeechSynthesis and displayed in the HUD transcript log.

3. **Controlled Tool Calling & Security**:
   - The LLM never has arbitrary shell or bash access.
   - All external actions execute strictly through the whitelisted `ToolRegistry` with JSON schema validation and confirmation barriers for sensitive operations.
