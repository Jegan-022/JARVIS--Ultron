import { SceneManager } from '../scenes/SceneManager'
import { SceneId } from '../types/scene'
import { spatialEngine } from '../gestures/SpatialInteractionEngine'
import { voiceManager } from './VoiceManager'
import { useUniverseStore } from '../stores/universeStore'
import { useGestureStore } from '../stores/gestureStore'
import { backendClient } from '../services/backendClient'

export interface CommandExecutionResult {
  handled: boolean
  spokenResponse?: string
  toolExecuted?: string
}

// ─── Simple fuzzy match: does the command contain keywords (in any order)? ───
function matchesKeywords(cmd: string, keywords: string[]): boolean {
  return keywords.every((kw) => cmd.includes(kw))
}

function matchesAny(cmd: string, patterns: string[]): boolean {
  return patterns.some((p) => cmd.includes(p))
}

// ─── Scene name constants ───
const SCENE_NAMES: Array<{ id: SceneId; names: string[]; reply: string }> = [
  {
    id: SceneId.GALAXY,
    names: ['galaxy', 'milky way', 'deep space', 'cosmos'],
    reply: 'Transitioning to Galaxy simulation. Quite the view, sir.',
  },
  {
    id: SceneId.SOLAR_SYSTEM,
    names: ['solar system', 'planets', 'solar', 'orbital'],
    reply: 'Displaying the Solar System planetary model. All eight planets accounted for.',
  },
  {
    id: SceneId.EARTH,
    names: ['earth', 'home planet', 'terra', 'globe'],
    reply: 'Focusing on Earth. Our little blue marble in the void.',
  },
  {
    id: SceneId.NEURAL_NETWORK,
    names: ['neural network', 'neural', 'synapse', 'brain', 'network'],
    reply: 'Loading the neural architecture visualization. Fascinating topology.',
  },
  {
    id: SceneId.DIGITAL_GLOBE,
    names: ['digital globe', 'cyber globe', 'global network', 'data globe'],
    reply: 'Activating the Digital Globe. Global data nodes online.',
  },
  {
    id: SceneId.SYSTEM_VISUALIZATION,
    names: ['system', 'diagnostics', 'system visualization', 'quantum', 'core status'],
    reply: 'Displaying core system diagnostics. All subsystems nominal.',
  },
]

// ─── Scene cycling ───
const SCENE_ORDER: SceneId[] = [
  SceneId.GALAXY,
  SceneId.SOLAR_SYSTEM,
  SceneId.EARTH,
  SceneId.NEURAL_NETWORK,
  SceneId.DIGITAL_GLOBE,
  SceneId.SYSTEM_VISUALIZATION,
]

export async function processVoiceCommand(rawCommand: string): Promise<CommandExecutionResult> {
  const cmd = rawCommand.toLowerCase().trim()

  // ─────────────── 1. Scene Navigation ───────────────
  for (const scene of SCENE_NAMES) {
    const matched = scene.names.some((name) => {
      if (cmd.includes(name)) return true
      // Fuzzy: "show me X", "take me to X", "go to X", "fly to X", "open X"
      const prefixes = ['show', 'open', 'go to', 'fly to', 'take me to', 'switch to', 'display']
      return prefixes.some((p) => matchesKeywords(cmd, [p, ...name.split(' ')]))
    })

    if (matched) {
      SceneManager.switch(scene.id)
      voiceManager.speak(scene.reply)
      return { handled: true, spokenResponse: scene.reply, toolExecuted: 'change_scene' }
    }
  }

  // "next scene" / "previous scene"
  if (matchesAny(cmd, ['next scene', 'next view', 'switch scene'])) {
    const current = useUniverseStore.getState().sceneId
    const idx = SCENE_ORDER.indexOf(current)
    const next = SCENE_ORDER[(idx + 1) % SCENE_ORDER.length]
    SceneManager.switch(next)
    const reply = 'Advancing to the next spatial environment.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'change_scene' }
  }

  if (matchesAny(cmd, ['previous scene', 'last scene', 'go back'])) {
    const current = useUniverseStore.getState().sceneId
    const idx = SCENE_ORDER.indexOf(current)
    const prev = SCENE_ORDER[(idx - 1 + SCENE_ORDER.length) % SCENE_ORDER.length]
    SceneManager.switch(prev)
    const reply = 'Returning to the previous environment.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'change_scene' }
  }

  // ─────────────── 2. Camera & Spatial Controls ───────────────
  if (matchesAny(cmd, ['zoom in', 'zoom into', 'closer', 'magnify', 'enhance'])) {
    spatialEngine.ingestZoomDelta(-25)
    const reply = 'Zooming in, sir.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'zoom_scene' }
  }

  if (matchesAny(cmd, ['zoom out', 'pull back', 'further', 'wide view'])) {
    spatialEngine.ingestZoomDelta(25)
    const reply = 'Pulling back for a wider view.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'zoom_scene' }
  }

  if (matchesAny(cmd, ['rotate left', 'turn left', 'spin left'])) {
    spatialEngine.ingestPointerDelta(-0.4, 0)
    const reply = 'Rotating counter-clockwise.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'rotate_scene' }
  }

  if (matchesAny(cmd, ['rotate right', 'turn right', 'spin right', 'rotate', 'spin'])) {
    spatialEngine.ingestPointerDelta(0.4, 0)
    const reply = 'Rotating clockwise, sir.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'rotate_scene' }
  }

  if (matchesAny(cmd, ['look up', 'tilt up', 'rotate up'])) {
    spatialEngine.ingestPointerDelta(0, -0.25)
    const reply = 'Tilting the view upward.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'rotate_scene' }
  }

  if (matchesAny(cmd, ['look down', 'tilt down', 'rotate down'])) {
    spatialEngine.ingestPointerDelta(0, 0.25)
    const reply = 'Adjusting view downward.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'rotate_scene' }
  }

  if (matchesAny(cmd, ['orbit', 'cinematic', 'auto rotate'])) {
    useUniverseStore.getState().setPaused(false)
    const reply = 'Engaging cinematic orbit mode.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'orbit' }
  }

  if (matchesAny(cmd, ['reset', 'recenter', 'home position', 'default view'])) {
    spatialEngine.reset()
    const reply = 'Spatial camera reset to default position, sir.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'reset_scene' }
  }

  if (matchesAny(cmd, ['pause', 'stop', 'freeze', 'hold'])) {
    useUniverseStore.getState().setPaused(true)
    const reply = 'Simulation paused. Press Space or say resume to continue.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'pause' }
  }

  if (matchesAny(cmd, ['resume', 'unpause', 'continue', 'play'])) {
    useUniverseStore.getState().setPaused(false)
    const reply = 'Resuming simulation.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'resume' }
  }

  // ─────────────── 3. Gesture & Camera Controls ───────────────
  if (matchesAny(cmd, ['enable camera', 'start camera', 'enable tracking', 'start hand tracking', 'activate vision'])) {
    useGestureStore.getState().setCameraEnabled(true)
    const reply = 'Activating spatial vision and hand tracking systems.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'enable_camera' }
  }

  if (matchesAny(cmd, ['disable camera', 'stop camera', 'disable tracking', 'stop hand tracking', 'deactivate vision'])) {
    useGestureStore.getState().setCameraEnabled(false)
    const reply = 'Hand tracking deactivated.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'disable_camera' }
  }

  // ─────────────── 4. Debug ───────────────
  if (matchesAny(cmd, ['debug', 'show debug', 'toggle debug', 'diagnostics overlay'])) {
    useUniverseStore.getState().toggleDebug()
    const reply = 'Debug overlay toggled.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'toggle_debug' }
  }

  // ─────────────── 5. Conversational / Greetings ───────────────
  if (matchesAny(cmd, ['hello', 'hey', 'hi jarvis', 'good morning', 'good evening', 'good afternoon'])) {
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
    const reply = `${greeting}, sir. All systems are operational. How may I assist you?`
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply }
  }

  if (matchesAny(cmd, ['thank you', 'thanks', 'nice job', 'good work', 'well done'])) {
    const reply = 'Happy to be of service, sir.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply }
  }

  if (matchesAny(cmd, ['what can you do', 'help', 'capabilities', 'what are your abilities'])) {
    const reply = 'I can navigate 3D scenes, control smart home devices, check system diagnostics, answer questions, and respond to spatial hand gestures. Simply ask, sir.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply }
  }

  if (matchesAny(cmd, ['who are you', 'what are you', 'introduce yourself'])) {
    const reply = "I am J.A.R.V.I.S., Just A Rather Very Intelligent System. Your advanced AI command interface, at your service."
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply }
  }

  // ─────────────── 6. Fallback to Backend AI Agent ───────────────
  try {
    const universeState = useUniverseStore.getState()
    const gestureState = useGestureStore.getState()

    const contextPayload = {
      command: rawCommand,
      activeScene: universeState.sceneId,
      selectedObject: universeState.selectedObject,
      handGesture: gestureState.currentGesture,
      cursorPosition: gestureState.cursor,
      cameraPosition: universeState.cameraPosition,
    }

    const response = await fetch(`${backendClient.baseUrl}/api/ai/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contextPayload),
    })

    if (response.ok) {
      const data = await response.json()

      // Execute scene change if the backend returned one
      if (data.tool_executed === 'change_scene' && data.tool_results?.[0]?.result?.scene) {
        const targetScene = data.tool_results[0].result.scene
        SceneManager.switch(targetScene as SceneId)
      }

      if (data.spoken_response) {
        voiceManager.speak(data.spoken_response)
      }
      return {
        handled: true,
        spokenResponse: data.spoken_response || data.text,
        toolExecuted: data.tool_executed,
      }
    }
  } catch (err) {
    console.warn('Backend AI command error:', err)
  }

  // Local fallback if offline
  const fallback = `I received your command: "${rawCommand}". However, I'm currently operating in offline mode. Please check the backend connection.`
  voiceManager.speak(fallback)
  return { handled: true, spokenResponse: fallback }
}
