# VIDEOS RRSS: contexto del proyecto

Copia de `VIDEOS-RRSS-contexto.md` (Google Drive, carpeta "VIDEOS RRSS"), con las rutas actualizadas al 2026-11-07. Cada video en una subcarpeta de `D:\Videos PROYECTO CLAUDE\` (por ejemplo `ueno-bank\`), con su propio `CLAUDE.md` de HyperFrames.

Todos los videos de este proyecto siguen el estilo y el método de abajo, salvo que se pida otra cosa. Son para **CERO ANESTESIA** (@ceroanestesia.tv), un medio de comunicación digital: identidad oscura, tecnológica y semifuturista, con credibilidad periodística y sin saturación de efectos. El video de referencia aprobado ("quedó excelente") era `calor-final-v5.mp4`; su carpeta se perdió. La plantilla actual es `ueno-bank\`, que usa el mismo estilo.

## Cómo prefiere trabajar el usuario
- Responde en español, en lenguaje claro y sin tecnicismos innecesarios. **Todo** va en español: también los avisos cortos de avance, los resúmenes y la entrega (el 2026-11-08 pidió "deja de hablar en ingles").
- **Música:** nunca sintetizarla, aunque pida "crea una canción" (rechazada dos veces). Pídele una pista o entrega sin música; con su pista, unos 18 dB bajo la voz, como en `nvidia-trampa-miel-v3`.
- **Fluidez (60 fps, cámara continua, motion blur de 6 muestras, `check-jerks.cjs`):** se usa en todos los videos desde `malls-chinos`, pero el usuario no la ha aprobado de forma explícita como estándar.
- Si dice "te voy a ir preguntando" o "puedes...?", responde sin aplicar nada hasta que dé la orden, y junta los cambios en una sola versión.
- Cada ronda de cambios va en una versión nueva (`tema-v2`, `tema-v3`...), sin tocar las anteriores.
- Entrega siempre el MP4 con lo que cambió, lo que debe revisar y lo no comprobado.

## Lo que entrega el usuario
- **Guion:** archivo de texto con tiempos, visuales y locución.
- **Audio de la narración:** MP3 o WAV.
- **Fuente:** enlace a la noticia o estudio.
- **Indicaciones del video:** duración aproximada y si lleva música.

Si falta alguna de estas cosas, pregúntala. Si está todo, haz el video sin pedir aprobación del plan escena por escena.

## Reglas de contenido
1. **El audio manda sobre el guion.** Los tiempos y subtítulos salen de lo que realmente se dice. Avisa de cada diferencia con el guion.
2. **No aceleres ni edites la voz** para calzar una duración. Recorta solo los silencios del inicio y del final, y avisa si la duración final difiere de la pedida.
3. **Verifica cada dato del guion contra la fuente** antes de animar. No inventes cifras.
4. **Marca lo ilustrativo.** Colores, alturas y termómetros sin cifras no representan datos; dilo en la entrega. Si una cifra es una proyección, muéstrala como tal ("≈200", "Proyección: ...").
5. **Cita la fuente en pantalla**, en texto pequeño pero legible (30 px o más).
6. **Avisa de los riesgos editoriales** (por ejemplo, un chiste junto a una cifra de muertes), pero la decisión es del usuario.
7. **Reemplaza presentadores por 3D:** si el guion pide presentador/a, cuenta esa parte con objetos y escenas 3D, y avísalo.

## Estilo visual

| Parámetro | Valor |
|---|---|
| Formato | Vertical, 1080x1920, 30 fps, H.264 + AAC |
| Música | Solo si se pide |
| Medio | 3D liso con Three.js: superficies curvas, bordes redondeados y materiales oscuros con luz lateral magenta. **Sin facetas, puntas ni grietas**: `flatShading: false`, esferas y cilindros de muchos segmentos, `roundedGeo` para cajas, render a `setPixelRatio(1.5)`. Movimientos con arranque y frenada suaves |
| Fondos | Oscuros y de alto contraste, con degradados hacia magenta y una grilla fina y tenue |
| Tipografía | Montserrat para titulares y cifras; Bahnschrift para subtítulos y textos secundarios (`src: local("Bahnschrift")`, instalada en Windows). Caveat solo para la nota a mano |
| HUD y luz | Marcas de esquina finas y brillo suave sobre lo más claro (`#w-bloom`). Efectos sutiles: evitar saturación y estilos genéricos |
| Transiciones | Desenfoque gaussiano (hasta 26 px, unos 0,7 s) con un barrido de luz magenta en 3 o 4 cortes, no en todos |
| Cierre | Fundido a negro con texto pequeño blanco al centro, unos 3 s: "Video creado por @hectorignorado / para @ceroanestesia.tv". Sin logo |
| Texto | **Todo texto entra y sale con Fade In y Fade Out, muy sobrio** (solo opacidad: tarjetas 0,35 s y 0,28 s; subtítulos 0,16 s y 0,13 s). Excepciones: el sello y la nota a mano |
| Mapas | Geometría real de Natural Earth, extruida, con límites compartidos (ver `build-geo.cjs`). Nunca dibujados a mano. Océano como degradado continuo por shader, no triángulos. Sin líneas negras entre regiones |
| Tono | Serio con los datos, con remate visual cómico en los chistes del guion |
| Ritmo | Algo nuevo cada 2 a 4 s, una acción principal por toma, cortes en movimiento |
| Cuadro inicial | Ya muestra el tema: nunca negro ni un logo |

### Subtítulos
- Frases cortas sincronizadas con la voz: hasta 5 palabras o 27 caracteres, cortando en pausas y signos de puntuación.
- Bahnschrift, 60 px, blancos, sin borde, con sombra suave (`0 2px 14px rgba(0,0,0,.85)`), y entran y salen con Fade In y Fade Out.
- Posición: a media altura, `top: 1250px`, centrados. Mantén libre esa franja al encuadrar: que no choque con tarjetas ni rótulos.
- **Recuadro magenta** sobre la palabra clave, solo mientras se dice y no en todas las palabras: fondo `rgba(202,51,144,.9)`, borde de 2 px `#ee8ccb`, radio de 7 px y dos puntitos de 13 px en las esquinas superior izquierda e inferior derecha, como una selección de texto. Se definen en `KEY`, en `scripts/build-captions.cjs`.

### Tarjetas y texto
- Tarjetas negras: fondo `rgba(0,0,0,.82)`, borde fino de 1,5 px `#CA3390` (rojo `#CA0010` solo para alertas), radio de 12 px y brillo suave.
- Cifra en Montserrat 700 blanca, con la unidad más pequeña al lado en Bahnschrift. Rótulos en Bahnschrift blanca.
- Flotan sobre el objeto, sin línea ni palito. **Nunca** usar carteles rojos con línea, bordes negros gruesos ni texto con contorno.
- Nada de texto en los 168 px superiores ni bajo los 1330 px.

### Efectos
Se usan con moderación y solo si refuerzan el contenido:
- **Contador** en la tarjeta de la cifra principal, junto con una grilla u objetos que representen esa cantidad.
- **Foco:** el resto de la escena se oscurece y queda destacado lo que se nombra.
- **Sello estampado:** Montserrat 700, blanco con borde de 4 px, inclinado unos 6°.
- **Nota escrita a mano:** fuente Caveat (`assets/fonts/caveat-700.woff2`), en rojo `#CA0010`, que se escribe de izquierda a derecha.
- **Barra de progreso o de tiempo: prohibida.** No usarla nunca; al usuario no le gustó.
- **Cifra gigante tenue de fondo:** magenta, con baja opacidad, sobre una zona despejada; mueve la cámara para abrirle espacio.

### Sonidos
**Con moderación: no deben sonar a cada rato** (el usuario lo pidió el 2026-11-07, tras un video con 24 sonidos). Unos 12 en total para un video de un minuto. La mayoría de los cortes van **sin sonido**.

Plantilla actual: `videojuegos-ocde-v3\assets\sfx\`. Originales en `D:\PACK SONIDOS 2025 (manuDT)\`. `scripts/build-captions.cjs` los ubica solos (listas `CLICKS`, `POPS`, `WHOOSHES`, `SHUTTERS`).

| Sonido | Original | Dónde | Volumen | Ajuste |
|---|---|---|---|---|
| `click.wav` | `CLICK\click.wav` | **3 veces por video**, al aparecer un texto o figura clave | 0,3 | 0,11 s de silencio inicial: se adelanta |
| `pop.wav` | `POP\Pop 1.wav` | **3 veces por video**, al aparecer un texto o figura clave | 0,32 | Elegir los más importantes |
| `whoosh.mp3` | `TRANSICION\Deep Whoosh...mp3` | **Solo 2 cortes por video**, los cambios de tema más grandes | 0,4 | Recortar desde 1,25 s; su pico queda 0,37 s después |
| `shutter.wav` | `CAMARA\camera Shutter.wav` | **Solo cuando aparece una imagen o foto**, junto con un destello blanco breve (`FLASH_CUTS` en `world.html`) | 0,35 | 0,1 s de silencio inicial |
| `data.wav` | `DATA\Data 08.wav` | **Cada vez que un dato numérico sube** (contador), pedido por el usuario el 2026-11-11 "desde ahora" | 0,3 | 0,05 s de silencio inicial; dura 1,25 s |

Desde el 2026-11-11 el usuario pide Click, Pop y Whoosh **2 a 3 veces cada uno por video**.

Cada sonido entra un cuadro después de la imagen. Sin música, salvo que se pida.

### Paleta base
| Uso | Color |
|---|---|
| Colores institucionales | Negro `#000000`, blanco `#FFFFFF`, magenta `#CA3390` (protagonista) y rojo alerta `#CA0010` |
| Apoyo | Se permiten grises y degradados entre ellos para dar volumen ("no son tan estrictos"). Otro tono solo si un objeto lo necesita, apagado y en poca cantidad |
| Océano y fondos | `#06060a`, `#000000` |
| Tierra vecina | `#17171d`, con contorno luminoso magenta |
| Territorio protagonista | `#6a6a75` (frío), `#CA3390` (calor), `#CA0010` (riesgo) |
| Bandas de calor | `#06060a`, `#2a0b26`, `#7a1f5c`, `#CA3390`, `#CA0010` |
| Sol | Blanco con rayos magenta |
| Paredes y suelos | `#18181f`, `#101015`, con línea LED magenta |

## Método
Trabaja en Claude Code, en Windows. Herramientas (portables, en `D:\herramientas`, en el PATH del usuario): Node.js, FFmpeg, yt-dlp, Git (MinGit), Python 3.12 y Whisper (`whisper`, en `D:\whisper-env`). HyperFrames 0.9.13 con sus skills. Lee primero la skill `/hyperframes`.

1. **Crear la carpeta** `D:\Videos PROYECTO CLAUDE\<tema>` copiando `videojuegos-ocde-v3\` como plantilla: `compositions/world.html` (incluye tone mapping, reflejos de entorno, motion blur, grano, tarjetas de fotos, destello y piezas como control, trofeo y monitor), `scripts/build-transcript.cjs`, `scripts/build-music.cjs` (adapta los tramos y el estilo al tema), `scripts/build-captions.cjs` (genera `captions.html` e `index.html` con sus sonidos), `assets/` y `lib/`. Para mapas, `scripts/build-geo.cjs` y `lib/geo.js` están en `ueno-bank\`. Quita lo propio del video anterior (narración, fotos, escenas).
2. **Revisar la fuente** y comparar el guion con los datos.
3. **Medir el audio** con `ffprobe` y `silencedetect` para definir el recorte inicial.
4. **Transcribir** con el guion como pista:
   ```bash
   whisper "audio.mp3" --model medium --language es --device cuda --word_timestamps True --output_format json --output_dir _transcript --initial_prompt "<texto del guion>"
   ```
5. **Generar subtítulos** con `node scripts/build-captions.cjs`, ajustando `OFF` (recorte), `DUR` (duración) y `TOTAL` (duración con el cierre), `KEY` (palabras con recuadro magenta), `POPS`, `CLICKS` y `CUTS` (momentos de cada sonido). El mismo script genera `index.html` con los sonidos.
6. **Construir la escena 3D** en `world.html`: cada toma con su set, cámara y tiempos tomados de la voz; todo debe depender solo del tiempo `t`.
7. **Revisar** con `npx hyperframes check --json` y `npx hyperframes snapshot --at <tiempos>`, mirando las hojas de capturas. Corrige y vuelve a mirar lo cambiado.
8. **Renderizar** en segundo plano: `npx hyperframes render -o video-final.mp4`
9. **Comprobar el MP4 real:** formato y duración con `ffprobe`, volumen con `volumedetect`, sincronía con `silencedetect` y cuadros con `ffmpeg`.
10. **Entregar:** el archivo, las diferencias con el guion, lo ilustrativo, los riesgos editoriales y lo no comprobado. Nunca digas que se escuchó el audio: solo se mide.

## Respaldo en GitHub y uso en otro PC
Desde el 2026-11-13 el proyecto es un repositorio Git que se sube a GitHub (privado). En `_entorno\`:
- `guardar.ps1`: copia las skills (`~\.claude\skills`) y la memoria de Claude a `_entorno\`, registra los cambios y los sube. Córrelo al terminar cada video: `powershell -ExecutionPolicy Bypass -File _entorno\guardar.ps1 "video X listo"`.
- `instalar.ps1`: en un PC nuevo instala Git, Node, FFmpeg, Python, yt-dlp y Whisper en las mismas rutas, agrega el PATH, descarga el proyecto y restaura skills y memoria: `powershell -ExecutionPolicy Bypass -File instalar.ps1 -Repo <dirección del repositorio>`.

No van a GitHub (ver `.gitignore`): los MP4 terminados, `data-centers\assets\video\hector.mp4` (124 MB, sobre el límite de 100 MB), las cachés `.hyperframes\` y los registros. Esos y `D:\PACK SONIDOS 2025 (manuDT)` se respaldan en Google Drive. Ningún archivo nuevo puede pasar de 100 MB: si un video del usuario pesa más, agrégalo al `.gitignore` y guárdalo en Drive.

## Errores ya resueltos: no repetir
- **Whisper en la GTX 1660 Super:** con `fp16` da `NaN`. El comando `whisper` (`whisper.cmd`) ya lo desactiva; si llamas a `D:\whisper-env\Scripts\whisper.exe` directamente, agrega `--fp16 False`.
- **`hyperframes transcribe`:** usa whisper.cpp (no compilado aquí) y su modelo por defecto es solo para inglés. Usa `whisper`.
- **Three.js:** usa 0.159 local (`lib/three.min.js`, script clásico). También deja GSAP local en `lib/`.
- **Etiquetas 3D desalineadas:** llama a `camera.updateMatrixWorld(true)` tras `lookAt`, antes de proyectarlas. Antes de `localToWorld`, llama a `updateWorldMatrix(true, false)`.
- **Desenfoque en el marco:** al desenfocar el canvas aparece un borde del fondo. Amplía el canvas mientras dura (`scale(1 + blur * 0.004)`).
- **Objetos fuera de cuadro:** también proyectan sombra. Ocúltalos (`visible = false`) hasta que entren.
- **Encuadre vertical angosto:** con FOV 35, el ancho visible es de solo 0,354 × distancia. Calcula la distancia antes de ubicar objetos.
- **Colores de calor:** mezclar azul con rojo da morado. Pasa por las bandas de la paleta con `smoothstep`.
- **Humo:** las esferas translúcidas se ven como discos. Usa sprites con textura radial.
- **Sonidos:** revisa el silencio inicial de cada archivo antes de ubicarlo. `Set-Content` sin `-Encoding` puede dañar los acentos.
- **Natural Earth:** el CDN jsDelivr rechaza el archivo de regiones (40 MB); bájalo de `raw.githubusercontent.com`. Usa `scripts/build-geo.cjs` (`topojson-server`, `topojson-simplify`, `topojson-client`, instalados con `npm install` en una carpeta aparte). El mapa ya generado está en `lib/geo.js` (en `ueno-bank` es Paraguay). Los datos de origen de Chile (`calor\_data`) se perdieron: hay que volver a bajarlos si se necesita ese mapa. Valparaíso incluye Rapa Nui y Juan Fernández: fíltralos si no van en el encuadre.
- **`hyperframes init`:** no escribe en una carpeta con archivos.
- **`hyperframes skills`:** requiere Git y sale con código 0 aunque falle.
- **Render:** el comando puede tardar en cerrarse después de terminar. Lánzalo en segundo plano.
- **PATH en la sesión:** si `node`, `ffmpeg` o `whisper` no se encuentran (la app arrancó antes de agregarlos), antepón en cada comando: `$env:Path = "D:\herramientas\node;D:\herramientas\ffmpeg\bin;D:\herramientas\bin;D:\herramientas\git\cmd;D:\whisper-env\Scripts;" + $env:Path`.
- **Whisper y Triton:** los avisos "Failed to launch Triton kernels" son normales en este PC; los tiempos por palabra salen igual, un poco más lento.
- **Descargas en PowerShell 5.1:** `Invoke-WebRequest` es muy lento con archivos grandes; usa `curl.exe -L`.

## Skills
No uses `reverse-any-video` salvo que se pida: Snyk la marcó como riesgo crítico, y le indica al agente usar HeyGen (de pago) sin avisar. No copies videos de referencia ni sus marcas; toma solo el estilo.

## Historial
- **2026-11-04, video 1 (calor extremo en Chile), v1 a v5:** se llegó al estilo actual. v5: identidad de CERO ANESTESIA (oscura, magenta, HUD sutil), subtítulos a media altura, sin logo, nota "¡15 años!" a mano en rojo, cierre en negro con créditos, sonidos Click/Pop/Whoosh medidos, sin barra de progreso. 40,4 s. Aprobado: "quedó excelente". Se corrigió "@ceroantestesia.tv" a "@ceroanestesia.tv" tras verificar en Instagram; @hectorignorado está bien escrito. Publicado: https://www.instagram.com/p/DfV20ymAxds/
- **2026-11-05, video 2 (crisis de Ueno Bank, Paraguay):** mismo estilo. Primera vez con música, a pedido: pista original sintetizada (`scripts/build-music.cjs`), unos 16 dB bajo la voz. 61,4 s. Logo real de Ueno entregado por el usuario. Ficha en `ueno-bank-ficha.md` (Drive). Publicado: https://www.instagram.com/ceroanestesia.tv/reel/DfYUtcygomn/
- **2026-11-07, video 3 (videojuegos, ranking OCDE):** carpeta `videojuegos-ocde\`. Nuevo: sonido **Shutter** (`assets/sfx/shutter.wav`, de `CAMARA\camera Shutter.wav`, 0,1 s de silencio inicial, volumen 0,35) en 3 cortes con un destello blanco breve, a pedido del usuario ("2 o 3 veces por video"); el resto de cortes con Whoosh. Fotos de personas en tarjetas 3D con marco redondeado magenta (`drawCard`). Whisper se saltó 19 s con los nombres de jugadores: se transcribió ese tramo aparte sin `--initial_prompt` y se unió con `scripts/build-transcript.cjs`. `build-captions.cjs` ahora reequilibra frases (sin palabras débiles al final ni palabras sueltas). 70 s (66,7 s con voz más cierre). Comentario: "se ve bien", pero sobraban sonidos (15 whooshes).
- **2026-11-07, video 3 v2:** carpeta `videojuegos-ocde-v2\`. Sonidos reducidos de 24 a 12: Click nuevo (`CLICK\click.wav`) 3 veces, Pop 3 veces, Whoosh 2 veces, Shutter con destello en las 4 fotos. Aprobado: "quedó súper el video".
- **2026-11-07, video 3 v3 (prueba de calidad):** carpeta `videojuegos-ocde-v3\`, mismo contenido que v2. Mejoras de render en `world.html`: tone mapping ACES (exposición 1,2) con `toneMapped = false` en fotos, pantallas, textos y LED para que sus colores no cambien; iluminación de entorno (`envScene` con paneles blancos y magenta, vía `PMREMGenerator`) para reflejos en metales; sombras `PCFSoftShadowMap`; motion blur real (4 muestras en 1/60 s, sin mezclar tomas); grano sutil (`#w-grain`, 5 %); leve deriva de cámara. Música original synthwave (`scripts/build-music.cjs`, La menor, 110 BPM, sigue los tramos del video, unos 14 dB bajo la voz: `node scripts/build-music.cjs 0.1`). Skills instaladas ese día: gsap-skills (oficial) y 3dviz-pro-max, más la actualización de las de HyperFrames (CLI 0.9.20; los proyectos siguen fijados en 0.9.13). El usuario la eligió como **nuevo estándar** frente a v2. Es la plantilla actual: render con tone mapping, reflejos, motion blur y grano, y música original de fondo cuando el video la lleve.
- **2026-11-07, video 4 (malls chinos, estudio CNC):** carpeta `malls-chinos\`, desde la plantilla `videojuegos-ocde-v3`. Primera vez con las mejoras de fluidez: render a **60 fps** (`npx hyperframes render --fps 60`, unos 4,5 min), cámara con curva continua Catmull-Rom (`path()` en `world.html`, que nunca se detiene del todo, para cortar en movimiento), motion blur de 6 muestras en 1/120 s y `scripts/check-jerks.cjs`, que marca los tirones del MP4. Mapa real de Chile por regiones (`scripts/build-geo.cjs`; datos en `D:\_descargas\natural-earth-chile`, módulos topojson en `D:\_descargas\geo-tools`). Música original con aire chino (pentatónica, guzheng y gong). Sonidos nuevos: golpe, timbre, retumbo y campanita (13 en total). Sellos ISP y SEC redibujados a partir de las imágenes del usuario. 71,6 s. Ojo: con `settle()`, el rebote puede hundir un objeto bajo el suelo; acota el desplazamiento con `Math.max(0, 1 - k)`.
- **2026-11-07, video 4 v2:** carpeta `malls-chinos-v2\`. Comentario sobre la v1: "me encantó", pero faltaban las pantuflas de dinosaurio del guion. Se agregó un par en 3D, modeladas a partir de una foto del usuario (`dinoSlipper` en `world.html`: felpa verde, boca roja con dientes redondeados, púas crema), sobre un pedestal al final del pasillo, que muerden al decir "¡dinosaurio!".
- **2026-11-11, video 4 v3:** carpeta `malls-chinos-v3\`, igual que la v2 pero **sin música**, a pedido (sin `assets/musica.wav` ni `build-music.cjs`; quedan la voz y los 13 sonidos).
- **2026-11-08, video 5 (hongos y depresión resistente, The Clinic):** carpeta `hongos-terapia\`, desde `malls-chinos-v2`. **No es para CERO ANESTESIA: es para el canal de YouTube personal del usuario**, que pidió colores naturales como su imagen de referencia (pared pizarra azul grisácea, mesa arena soleada, haz de luz de ventana, café de hongo, verde oliva, ocre) y **sin el cierre de créditos** (solo fundido a negro). Mismo método y efectos, sin grilla. Ventana invisible (`occ` en `world.html`) que proyecta el haz de sol diagonal. Música original cálida (piano, guitarra, Re mayor, 84 BPM). 60 fps, 51 s. La web de The Clinic bloquea el lector automático (403): se leyó con el navegador integrado.
- **2026-11-09, video 6 (Zalo Reyes y "Un ramito de violetas"):** carpeta `zalo-reyes\`, desde `malls-chinos-v2`, para CERO ANESTESIA, sin música (no se pidió). El usuario no entregó fuente: se verificó con CNN Chile y Wikipedia (citadas en pantalla). Ojo: la voz dice "cantante **zamorana** Cecilia", pero Cecilia nació en Madrid (murió en Zamora, 1976); también dice "realizaría" y "estilo **más** flamenco" (el guion dice "realizó" y "estilo flamenco"). Nuevo: dos mapas reales en un `lib/geo.js` (`GEO.spain` por provincias y `GEO.chile` por regiones; `scripts/build-geo.cjs` genera ambos), ramito de violetas 3D reutilizable (`buildBouquet`: flores de 5 pétalos instanciadas, paniculata, helechos, cinta), guitarra flamenca, gorrión, tocadiscos con casete/CD/celular y una silueta invisible que solo proyecta sombra (`colorWrite: false`). Las fotos se ubican con `anchorCard(..., frac)`: quedan a una fracción de la distancia entre la cámara y su punto de mira, con su escala calculada para el alto en píxeles pedido (si no, en tomas cercanas quedan bajo el mapa). Subtítulos por frases a mano (`PHRASES` en `build-captions.cjs`). 12 sonidos: 7 Shutter (una por foto), 2 Pop, 1 Click y 2 Whoosh. 54,3 s, 60 fps.
- **2026-11-09, video 7 (Jensen Huang, Nvidia y la "trampa de miel"):** carpeta `nvidia-trampa-miel\`, desde `zalo-reyes`. **Para el canal de YouTube del usuario, no para CERO ANESTESIA:** colores naturales (madera, miel, cuero, cartón) con la estética del PDF del guion (verde Nvidia `#76b900` y grafito), subtítulos dinámicos blancos con palabras clave en amarillo `#FFD23F` (cada palabra se enciende al decirse) y tarjetas con emoji (`@font-face` "Emoji" = Segoe UI Emoji; la bandera chilena va en SVG porque Windows no dibuja banderas emoji). Sin música, sin créditos (fundido a negro). 17 sonidos del pack (miel, alarma, vidrio, papel, datos, notificación, platillo "Badum tssss", dinero, eléctrico, pato). Nuevo: franja oscura suave detrás de subtítulos y fuentes (`#w-scrim`) para fondos claros; globo en malla con puntos de Natural Earth (`scripts/build-globe.cjs` → `lib/globe.js`, datos en `D:\_descargas\natural-earth-world`); figura 3D de Jensen de espaldas; logo de cristal que se quiebra; fotogramas de un video como imágenes (`assets/video/kc/`) dibujados en la tele. Ojo: en `taperTube` el coseno va negativo (si no, el tubo queda al revés y se ve negro); para girar el globo por el camino corto, "desenrolla" las longitudes. El video de WhatsApp era un deepfake (kiss cam hecha con IA): se rotuló como falso. La voz dura 69 s (el guion decía ~50). Comentario: "quedó muy bueno".
- **2026-11-09, video 7 v2:** carpeta `nvidia-trampa-miel-v2\`, con música "en contexto" a pedido (`scripts/build-music.cjs`, original): suspenso de espías en Re menor a 104 BPM (bajo con aire de blues, vibráfono, voz tipo saxo, cuerdas en staccato en la alarma, pulso en el globo, piano eléctrico en el correo, latido en la bolsa), **corte en seco** en 46,9 s junto al platillo, y remate cómico en Fa mayor a 126 BPM ("um-pa", fagot, glockenspiel, theremin en la tarjeta radiactiva) con un "¡ta-da!" justo después de "pato". Unos 14 dB bajo la voz (`node scripts/build-music.cjs 0.16`; el tramo cómico lleva ×1,7 para quedar parejo). **Comentario: "horrible la canción que creaste".**
- **2026-11-09, video 7 v3:** carpeta `nvidia-trampa-miel-v3\`, con la canción que entregó el usuario ("Music to Soothe the Savage Snake Plant.mp3", 203 s; se usan los primeros 70 s) "a un volumen donde la música no tape mi voz": compresión suave (`acompressor` umbral −24 dB, razón 2), rebaja de 3 dB en 2,5 kHz (zona de la voz), **18 dB bajo la voz** (−38,7 LUFS contra −20,7 LUFS de la narración), entrada de 0,3 s y salida de 1,1 s con el fundido final. Se quitó `build-music.cjs`; la pista queda en `assets/musica.wav`. **Aprobado: "quedó bien".** Es la versión final del video 7.
- **2026-11-10, video 8 (bebidas energéticas en jóvenes, The Clinic):** carpeta `bebidas-energeticas\`, desde `zalo-reyes`, para CERO ANESTESIA. 75 s (72 s de voz más cierre), 60 fps. Música incidental original a pedido ("que no sea genérica"): `scripts/build-music.cjs` sigue cada tramo (cajita de música, latido que se acelera con el contador, bossa de bar, acordes mareados, Congreso serio, pizzicato que tiembla, vals de la abuela), unos 17 dB bajo la voz (`MUSIC_VOL = 0.05`). **Comentario: "dámelo sin la música, definitivamente te quedan mal".** La versión final es `bebidas-energeticas-v2\` (mismo video, sin música ni `build-music.cjs`, 11 sonidos). **No volver a sintetizar música: solo una pista que entregue el usuario, o sin música.** 12 sonidos: 3 Click, 3 Pop, 2 Whoosh, 2 Shutter (fotos del usuario) y `bell.wav` (`MEMES\School Bell.mp3` desde 0,93 s). Piezas nuevas reutilizables en `world.html`: `buildCan` (lata sin marca), medidor con aguja, letreros de neón, copón, cerebro con antifaz, corazón, micro amarilla, Congreso estilizado, globo con candados (`lib/globe.js`), monitor ECG, timbre. Ojo: un `Sprite` de brillo pegado a una pared se corta en diagonal (queda mitad detrás); sepáralo unos 0,4 de la pared. La voz se apartó del guion al final: se transcribió ese tramo sin el guion como pista.
- **2026-11-11, video 9 (data centers en Chile, El Desconcierto):** carpeta `data-centers\`, desde `nvidia-trampa-miel-v3`. **Para el canal de YouTube del usuario**, con colores naturales y sin créditos. **Primera vez con video del usuario hablando a cámara** (`assets/video/hector.mp4`, recodificado con `-g 60`, mudo; la voz va aparte en `assets/voz.wav`): alterna entre pantalla completa con objetos 3D flotando a su lado (el canvas 3D es transparente: `alpha: true`, sin fondo) y escenas 3D completas con él en un recuadro arriba a la derecha (`#cam-wrap`, 300 x 533 px, se anima en `index.html` desde `MOVES` en `build-captions.cjs`; el `z-index` pasa de 1 a 3 para quedar sobre o bajo el 3D). Rótulos 3D con tamaño en píxeles de pantalla (`sizePx`). Mapas reales de Sudamérica y de la RM (`scripts/build-geo.cjs` → `lib/geo.js`). La voz dura 81,5 s (el guion decía ~50) y agrega un cierre que no está en el guion. Varios datos del guion no están en la fuente: se verificaron en otras (Forbes Chile, GPS Property, El Desconcierto del 25 de octubre). 82,8 s, 60 fps, 13 sonidos (Data 4, Click 3, Pop 3, Whoosh 3). **Aprobado: "quedó excelente".** Es la plantilla para mezclar video del usuario con 3D.
- **2026-11-12, video 10 (paro de camioneros y crisis del Gobierno de Kast):** carpeta `paro-camioneros\`, desde `bebidas-energeticas-v2`, para CERO ANESTESIA, sin música. 147,2 s (la voz dura 144 s; el guion decía 1:42), 60 fps, 15 sonidos (5 Shutter con destello, 3 Pop, 3 Click, 3 Whoosh, 1 Data). No vino enlace de fuente: se verificó con El Mostrador, BioBioChile, Emol, CNN Chile, La Tercera, El Desconcierto, Pauta y El Clarín. Whisper se saltó tres tramos (entre ellos la frase de Juan Araya): se transcribieron aparte y se unieron en `scripts/build-transcript.cjs`; Whisper no distingue "CNDC" de "CNTC" (se escribió según el guion). Piezas nuevas reutilizables en `world.html`: `buildTruck` (camión con remolque o solo cabina, luces de emergencia compartidas `HAZ`/`HAZG`), `buildCars` (autos instanciados para tacos), `buildRoad` (carretera con postes y pozos de luz), letrero LED, surtidor, pórtico TAG, pantalla de salidas con letras que giran, avión genérico, pase de abordaje, bodega con baliza, termómetro, calle con contenedores y bolsas, mesa de diálogo, megáfonos, bloque de hielo que se triza (`drawCracks`), La Moneda estilizada con radar y signo "?" 3D, rótulos 3D (`labelSprite`). Mapa de Chile con ciudades de las rutas 5 y 68 (`scripts/build-geo.cjs`). Ojo: en Chile se maneja por la derecha (camiones hacia +z en x negativa); la salida de las fotos usa el segundo `end` de `CARDS`: si el video pasa de 99 s, usa 999 para "nunca". Se avisó que el congelamiento se amplió hasta el 31 de marzo (la voz dice "hasta febrero"). **Aprobado: "está bien".**
- **2026-11-07:** el PC ya no tenía `D:\videitos` ni las herramientas. Se reinstalaron en `D:\herramientas` y se recuperó `ueno-bank` desde el zip de Drive como plantilla.
