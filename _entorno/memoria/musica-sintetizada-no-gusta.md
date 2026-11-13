---
name: musica-sintetizada-no-gusta
description: "Nunca sintetizar música para los videos: el usuario la rechazó dos veces; usar solo una pista que él entregue, o dejar el video sin música"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 26a4fffe-dc02-4385-975e-3d46b7cae272
  modified: 2026-11-10T22:43:06.741Z
---

No generar música sintetizada (`scripts/build-music.cjs`) para los videos, ni siquiera si el usuario pide "crea una canción".

- 2026-11-09 (video 7 v2, nvidia-trampa-miel-v2): llamó "horrible" la pista de espías y comedia, y mandó su propia canción ("Music to Soothe the Savage Snake Plant.mp3").
- 2026-11-10 (video 8, bebidas-energeticas): pidió expresamente "crea una canción… más bien incidental"; se hizo una pista que seguía cada tramo y respondió: "dámelo sin la música, definitivamente te quedan mal". Se entregó la v2 sin música.

**Why:** en sus palabras, la música "definitivamente" me queda mal; dos intentos con enfoques distintos fueron rechazados. (Interpretación mía: el problema es el timbre de la síntesis, no la composición.)

**How to apply:** si un video debe llevar música, pedirle una pista (o proponer buscar una libre de derechos) y decirle sin rodeos que la sintetizada no le ha gustado antes; si no hay pista, entregar sin música. Con una pista suya: unos 18 dB bajo la narración (LUFS), compresión suave y una rebaja pequeña cerca de 2,5 kHz, como en nvidia-trampa-miel-v3 (aprobado). Los efectos de sonido del pack sí le gustan. Relacionado: [[responder-siempre-en-espanol]].
