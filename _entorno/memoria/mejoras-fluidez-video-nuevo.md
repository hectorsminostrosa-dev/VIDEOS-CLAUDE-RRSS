---
name: mejoras-fluidez-video-nuevo
description: "Las 4 mejoras de fluidez (60 fps, cámara continua, motion blur de 6 muestras y revisor de tirones) se aplicaron por primera vez en malls-chinos; falta que el usuario las apruebe como estándar"
metadata:
  node_type: memory
  type: project
  originSessionId: 92eb7914-5177-4ce4-9cf2-797841678e07
  modified: 2026-11-07T20:58:08.292Z
---

El 2026-11-07 el usuario pidió aplicar las mejoras de fluidez directamente en el video nuevo, sin hacer una copia de prueba. Se aplicaron en `malls-chinos\`:

1. Render a 60 fps (`npx hyperframes render --fps 60`). El render tardó unos 4,5 min para 71,6 s, mucho menos de lo que se temía.
2. Cámara con curva Catmull-Rom y una sola curva de velocidad por toma (`u = 0.3x + 0.7·smootherstep`): nunca se detiene del todo.
3. Motion blur de 6 muestras en 1/120 s; el grano cambia por cuadro a 60.
4. `scripts/check-jerks.cjs`: marca los saltos bruscos del MP4, salvo cortes y golpes previstos. Ya encontró un error real: un documento que, con el rebote de `settle()`, se hundía bajo el suelo.

**Why:** el usuario quiere videos más fluidos. Las ideas salieron del repositorio yihui-dev/awesome-opus5-5-videos, que no trae skills: solo prompts de ejemplo.

**How to apply:** si el usuario aprueba malls-chinos, conviene usarla como nueva plantilla y cambiar en el CLAUDE.md la regla de "30 fps" por 60. Mientras no lo apruebe, pregúntale antes de dar las mejoras por estándar.
