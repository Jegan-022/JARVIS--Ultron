export const GestureType = {
  NONE: 'NONE',
  POINT: 'POINT',
  PINCH: 'PINCH',
  GRAB: 'GRAB',
  OPEN_PALM: 'OPEN_PALM',
  FIST: 'FIST',
  TWO_FINGER: 'TWO_FINGER',
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
} as const

export type InteractionState = (typeof InteractionState)[keyof typeof InteractionState]
