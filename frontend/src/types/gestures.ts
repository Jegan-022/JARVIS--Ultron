export const GestureType = {
  NONE: 'NONE',
  POINT: 'POINT',
  PINCH: 'PINCH',
  GRAB: 'GRAB',
  OPEN_PALM: 'OPEN_PALM',
  FIST: 'FIST',
  TWO_FINGER: 'TWO_FINGER',
  THREE_FINGERS: 'THREE_FINGERS',
  FOUR_FINGERS: 'FOUR_FINGERS',
  THUMBS_UP: 'THUMBS_UP',
  THUMBS_DOWN: 'THUMBS_DOWN',
  PEACE_SIGN: 'PEACE_SIGN',
  FINGER_GUN: 'FINGER_GUN',
  WAVE: 'WAVE',
  SWIPE_LEFT: 'SWIPE_LEFT',
  SWIPE_RIGHT: 'SWIPE_RIGHT',
  SWIPE_UP: 'SWIPE_UP',
  SWIPE_DOWN: 'SWIPE_DOWN',
} as const

export type GestureType = (typeof GestureType)[keyof typeof GestureType]

export const InteractionState = {
  IDLE: 'IDLE',
  POINTING: 'POINTING',
  PINCHING: 'PINCHING',
  GRABBING: 'GRABBING',
  ROTATING: 'ROTATING',
  ZOOMING: 'ZOOMING',
  SELECTING: 'SELECTING',
  VOICE_OVERRIDE: 'VOICE_OVERRIDE',
  CONFIRMING: 'CONFIRMING',
  SCENE_SWITCHING: 'SCENE_SWITCHING',
} as const

export type InteractionState = (typeof InteractionState)[keyof typeof InteractionState]
