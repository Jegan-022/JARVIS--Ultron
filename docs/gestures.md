# ULTRON Gesture Controls & Spatial Mapping

ULTRON employs a 21-point hand tracking model via MediaPipe Tasks Vision to enable touchless 3D spatial computing.

## Landmark Topology

```
             8 (Index Tip)    12 (Middle Tip)   16 (Ring Tip)   20 (Pinky Tip)
             |                 |                 |               |
             7                 11                15              19
             |                 |                 |               |
4 (Thumb)    6                 10                14              18
    \        |                 |                 |               |
     3       5 (Index MCP)     9 (Middle MCP)   13 (Ring MCP)   17 (Pinky MCP)
      \     /                 /                 /               /
       2   /                 /                 /               /
        \ /                 /                 /               /
         1                 /                 /               /
          \               /                 /               /
           └─────────────┬─────────────────┴───────────────┘
                         0 (Wrist)
```

## Gesture Catalog

| Gesture | Finger State | Action / Spatial Effect |
| --- | --- | --- |
| `POINT` | Index extended, others curled | Move index finger to rotate 3D scene smoothly along X and Y axes |
| `PINCH` | Thumb tip + Index tip touching ($d < 0.055$) | Lock onto / select nearest 3D entity |
| `GRAB` / `FIST` | All fingers curled close to palm | Drag selected 3D object in 3D world space |
| `TWO_FINGER` | Index + Middle extended, others curled | Move vertically or forward/back for smooth spatial camera zoom |
| `OPEN_PALM` | All 5 fingers extended and spread | Release object, reset interaction state to neutral `IDLE` |
| `SWIPE_LEFT` / `SWIPE_RIGHT` | Rapid wrist/index lateral motion | Flick rotate 3D scene 90 degrees |
| `SWIPE_UP` / `SWIPE_DOWN` | Rapid vertical motion | Vertical scene tilt / pitch change |

## Virtual 3D Cursor

- **Core Reticle**: Unprojected at index fingertip $(x, y, z)$.
- **Pinch State**: Reticle contracts dynamically based on pinch distance.
- **Grab State**: Expanding orange magnetic halo indicating 3D entity drag.
- **Object Lock-On**: Hexagonal targeting ring locks onto selected planet/node.

## Keyboard & Pointer Fallback

If webcam is offline or in development:
- **Mouse Drag**: Rotate active 3D universe.
- **Mouse Scroll**: Zoom camera.
- **Mouse Click**: Select / lock 3D object.
- **`R`**: Recenter / Reset scene.
- **`Space`**: Pause / Resume automatic simulation orbit.
- **`F3`**: Toggle real-time Diagnostic HUD Overlay.
- **`G`**: Galaxy Scene.
- **`S`**: Solar System Scene.
- **`E`**: Earth Globe Scene.
