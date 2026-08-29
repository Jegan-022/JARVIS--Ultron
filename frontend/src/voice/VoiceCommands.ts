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

export async function processVoiceCommand(rawCommand: string): Promise<CommandExecutionResult> {
  const cmd = rawCommand.toLowerCase().trim()

  // 1. Direct scene switching shortcuts
  if (cmd.includes('show galaxy') || cmd.includes('open galaxy') || cmd.includes('galaxy scene')) {
    SceneManager.switch(SceneId.GALAXY)
    const reply = 'Transitioning to Galaxy simulation.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'change_scene' }
  }

  if (cmd.includes('show solar system') || cmd.includes('solar system') || cmd.includes('planets')) {
    SceneManager.switch(SceneId.SOLAR_SYSTEM)
    const reply = 'Displaying Solar System planetary model.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'change_scene' }
  }

  if (cmd.includes('show earth') || cmd.includes('open earth') || cmd.includes('locate earth')) {
    SceneManager.switch(SceneId.EARTH)
    const reply = 'Focusing on Earth orbital visualization.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'change_scene' }
  }

  if (cmd.includes('neural network') || cmd.includes('show neural') || cmd.includes('synapse')) {
    SceneManager.switch(SceneId.NEURAL_NETWORK)
    const reply = 'Loading 3D Neural Architecture.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'change_scene' }
  }

  if (cmd.includes('digital globe') || cmd.includes('cyber globe') || cmd.includes('global network')) {
    SceneManager.switch(SceneId.DIGITAL_GLOBE)
    const reply = 'Activating Digital Cyber Globe.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'change_scene' }
  }

  if (cmd.includes('system status') || cmd.includes('system visualization') || cmd.includes('diagnostics')) {
    SceneManager.switch(SceneId.SYSTEM_VISUALIZATION)
    const reply = 'Displaying ULTRON Core system status.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'change_scene' }
  }

  // 2. Spatial Camera Controls
  if (cmd.includes('zoom in') || cmd.includes('zoom into')) {
    spatialEngine.ingestZoomDelta(-20)
    const reply = 'Zooming in.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'zoom_scene' }
  }

  if (cmd.includes('zoom out')) {
    spatialEngine.ingestZoomDelta(20)
    const reply = 'Zooming out.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'zoom_scene' }
  }

  if (cmd.includes('rotate left')) {
    spatialEngine.ingestPointerDelta(-0.35, 0)
    const reply = 'Rotating scene counter-clockwise.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'rotate_scene' }
  }

  if (cmd.includes('rotate right') || cmd.includes('rotate galaxy') || cmd.includes('rotate scene')) {
    spatialEngine.ingestPointerDelta(0.35, 0)
    const reply = 'Rotating scene clockwise.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'rotate_scene' }
  }

  if (cmd.includes('reset') || cmd.includes('recenter')) {
    spatialEngine.reset()
    const reply = 'Spatial camera reset to neutral position.'
    voiceManager.speak(reply)
    return { handled: true, spokenResponse: reply, toolExecuted: 'reset_scene' }
  }

  // 3. Fallback to Multimodal AI Agent on Backend
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
  const fallback = `Processed command: "${rawCommand}". Ready for spatial interaction.`
  voiceManager.speak(fallback)
  return { handled: true, spokenResponse: fallback }
}
