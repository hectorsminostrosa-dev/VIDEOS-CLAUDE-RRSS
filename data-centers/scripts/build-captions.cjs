// Genera compositions/captions.html e index.html (video del usuario, recuadro PiP y sonidos) desde _transcript/final.json.
// Uso: node scripts/build-transcript.cjs && node scripts/build-captions.cjs
// Video para el canal de YouTube del usuario: colores naturales, subtítulos dinámicos blancos con palabras clave en ámbar.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const OFF = 0; // la voz empieza al inicio del video
const DUR = 81.6; // voz y escenas
const TOTAL = 82.8; // con el fundido a negro final
const VIDEO_LEN = 81.86;
const AMBER = '#F2B544';
const KEY = new Set(['segundo', '37', 'quilicura', 'nube', 'agua', 'electricidad', 'hídrica', 'google', '169', 'cerrillos', 'justicia',
  'aire', 'diésel', 'maestra', '80', '1000', 'luz', 'verde', 'evaluación', 'mesa', 'permanente', 'invitado', 'chipe', 'libre',
  'contaminar', 'ruido', 'torta', 'platos', 'rotos', 'bien', 'comunidad']);

// Sonidos: [archivo, instante visual, inicio dentro del archivo (silencio que se salta), duración, volumen, fundido de salida]
// Click, Pop y Whoosh 3 veces cada uno; Data en cada cifra que sube.
const SFX = [
  ['data.wav', 5.18, 0.05, 1.25, 0.3, 0.3], // 0 → 37 data centers
  ['pop.wav', 8.42, 0, 0.55, 0.32, 0.15], // pin de Quilicura
  ['click.wav', 14.64 - 0.11, 0, 0.5, 0.3, 0.1], // tarjeta "agua y electricidad"
  ['whoosh.mp3', 18.85 - 0.37, 1.25, 1.15, 0.4, 0.2], // al acuífero (el video pasa al recuadro)
  ['data.wav', 20.9, 0.05, 1.25, 0.3, 0.3], // 0 → 169 L/s
  ['pop.wav', 28.3, 0, 0.55, 0.32, 0.15], // candado en la tubería
  ['data.wav', 34.26, 0.05, 1.25, 0.3, 0.3], // 0 → 696 t
  ['whoosh.mp3', 36.65 - 0.37, 1.25, 1.15, 0.4, 0.2], // a la "jugada maestra"
  ['data.wav', 42.24, 0.05, 1.25, 0.3, 0.3], // tope 80 → 1.000 t
  ['whoosh.mp3', 51.75 - 0.37, 1.25, 1.15, 0.4, 0.2], // a la mesa del gobierno
  ['click.wav', 58.7 - 0.11, 0, 0.5, 0.3, 0.1], // sello "solo invitado"
  ['pop.wav', 65.98, 0, 0.55, 0.32, 0.15], // el plato vacío de los vecinos
  ['click.wav', 72.52 - 0.11, 0, 0.5, 0.3, 0.1], // "¿Te parece bien?"
];

// Recuadro del video (PiP): arriba a la derecha, 300 x 533 px. [inicio, fin, 'pip' | 'full']
const PIP = { x: 750, y: 190, s: 300 / 1080 };
const MOVES = [[8.75, 9.35, 'full'], [18.5, 19.2, 'pip'], [29.0, 29.6, 'full'], [36.3, 37.0, 'pip'], [59.15, 59.75, 'full']];

const clean = (t) => t.toLowerCase().replace(/[¡!¿?.:,]/g, '');
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, '_transcript', 'final.json'), 'utf8'));
const words = raw.map((w) => ({ text: w.text, start: Math.max(0, w.start - OFF), end: w.end - OFF }));

// Frases a mano: cortan en pausas y signos, hasta ~5 palabras o 28 caracteres, sin palabras débiles al final.
const PHRASES = [
  'Chile se consolidó', 'como el segundo país', 'de América Latina', 'con más data centers', 'después de Brasil.',
  '37 instalaciones operativas,', 'concentradas principalmente', 'en Quilicura.',
  'Pero detrás', 'de esta nube digital', 'hay un costo silencioso', 'que las empresas', 'prefieren no ventilar.',
  'Un consumo colosal', 'de agua y electricidad', 'en plena crisis hídrica.',
  'El data center de Google', 'pedía extraer', '169 litros por segundo', 'del Acuífero', 'Santiago Central', 'ubicado en Cerrillos,',
  'para refrigerar', 'sus servidores,', 'hasta que los vecinos', 'lo frenaron en la justicia.',
  '¿Y qué hicieron?', 'Cambian el agua', 'por aire acondicionado', 'industrial sostenido', 'por cientos de toneladas', 'de diésel', 'para sus generadores.',
  'Y aquí vino', 'la jugada maestra.', 'Un cambio', 'en el reglamento ambiental', 'subió el tope', 'de almacenamiento', 'de diésel de 80', 'a 1.000 toneladas.',
  'Con eso, Google', 'y otros cinco proyectos', 'en Puente Alto,', 'Buin y Lampa', 'lograron luz verde', 'sin someterse', 'a una evaluación', 'de impacto ambiental.',
  '¿Y qué hizo el gobierno?', 'Armó una mesa permanente', 'para apurar los trámites,', 'dejando al Ministerio', 'del Medio Ambiente', 'apenas como', 'un simple invitado.',
  'O sea, le dieron', 'chipe libre', 'a las empresas', 'para contaminar,', 'gastar agua', 'y meter ruido', 'con sus máquinas,',
  'mientras que los vecinos', 'no pinchan ni cortan', 'ni un pedazo', 'de esta torta,',
  'pero pagando al final', 'de todos los platos rotos.',
  '¿Te parece bien?',
  'Yo creo que', 'inversión, desarrollo', 'y medio ambiente', 'deberían trabajar juntos,', 'pero también', 'con la comunidad incluida.',
];
const groups = [];
{
  let k = 0;
  PHRASES.forEach((p) => {
    const n = p.split(' ').length;
    const items = words.slice(k, k + n);
    if (items.map((w) => w.text).join(' ') !== p) throw new Error('La frase no calza con la voz: "' + p + '" / "' + items.map((w) => w.text).join(' ') + '"');
    if (p.length > 28) throw new Error('Frase larga: ' + p);
    groups.push({ items });
    k += n;
  });
  if (k !== words.length) throw new Error('Sobran palabras: ' + words.slice(k).map((w) => w.text).join(' '));
}
groups.forEach((g, i) => {
  g.start = g.items[0].start;
  const lastEnd = g.items[g.items.length - 1].end;
  const next = groups[i + 1];
  if (!next) g.end = Math.min(lastEnd + 0.25, DUR);
  else g.end = next.items[0].start - lastEnd < 0.4 ? next.items[0].start : lastEnd + 0.25;
});

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const tweens = [];
const rows = groups.map((g, i) => {
  const body = g.items.map((w, j) => {
    const id = `w-${i}-${j}`;
    const key = KEY.has(clean(w.text));
    // Cada palabra se enciende cuando se dice; las claves se vuelven ámbar con un pequeño golpe de escala.
    if (j > 0) tweens.push(`    tl.fromTo("#${id}", { opacity: 0.45 }, { opacity: 1, duration: 0.08, ease: "none" }, ${w.start.toFixed(3)});`);
    if (key) tweens.push(`    tl.fromTo("#${id}", { color: "#ffffff", scale: 1 }, { color: "${AMBER}", scale: 1.12, duration: 0.09, ease: "power2.out" }, ${w.start.toFixed(3)});`,
      `    tl.to("#${id}", { scale: 1, duration: 0.16, ease: "sine.inOut" }, ${(w.start + 0.09).toFixed(3)});`);
    return `<span id="${id}" class="w${key ? ' k' : ''}">${esc(w.text)}</span>`;
  }).join(' ');
  tweens.push(`    tl.fromTo("#capt-${i}", { opacity: 0 }, { opacity: 1, duration: 0.16, ease: "sine.out" }, ${g.start.toFixed(3)});`);
  tweens.push(`    tl.to("#capt-${i}", { opacity: 0, duration: 0.13, ease: "sine.inOut" }, ${(g.end - 0.14).toFixed(3)});`);
  return `    <div id="cap-${i}" class="clip cap" data-start="${g.start.toFixed(3)}" data-duration="${(g.end - g.start).toFixed(3)}" data-track-index="1"><div id="capt-${i}" class="capt">${body}</div></div>`;
}).join('\n');

fs.writeFileSync(path.join(ROOT, 'compositions', 'captions.html'), `<template>
  <style>
    @font-face { font-family: "Bahnschrift"; src: local("Bahnschrift"); }
    @font-face { font-family: "Bahnschrift"; src: local("Bahnschrift SemiBold"), local("Bahnschrift"); font-weight: 600; }
    #root { position: absolute; inset: 0; pointer-events: none; }
    .cap { position: absolute; left: 40px; right: 40px; top: 1250px; text-align: center; overflow: visible; z-index: 20; }
    .capt {
      font-family: "Bahnschrift", sans-serif;
      font-weight: 600;
      font-size: 62px;
      line-height: 1.28;
      color: #ffffff;
      text-shadow: 0 2px 14px rgba(0, 0, 0, 0.9), 0 0 3px rgba(0, 0, 0, 0.7);
    }
    .w { display: inline-block; }
    .w + .w { margin-left: 0.06em; }
    .k { text-shadow: 0 2px 14px rgba(0, 0, 0, 0.9), 0 0 18px rgba(242, 181, 68, 0.35); }
  </style>
  <div id="root" data-composition-id="captions" data-start="0" data-duration="${TOTAL}" data-width="1080" data-height="1920">
${rows}
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
${tweens.join('\n')}
    tl.set({}, {}, ${TOTAL});
    window.__timelines["captions"] = tl;
  </script>
</template>
`);

const FRAME = 1 / 60;
const TRACK = {};
let nextTrack = 5;
const sfx = SFX.map(([file, t, ms, dur, vol, fade], i) => {
  if (!(file in TRACK)) TRACK[file] = nextTrack++;
  const start = t + FRAME;
  const d = Math.min(dur, DUR - start);
  return `      <audio id="sfx-${i}" class="clip" src="assets/sfx/${file}" data-start="${start.toFixed(3)}" data-duration="${d.toFixed(3)}" data-track-index="${TRACK[file]}" data-volume="${vol}"${ms ? ` data-media-start="${ms}"` : ''}${fade ? ` data-fade-out="${fade}"` : ''}></audio>`;
});

// Recuadro: el video se achica a la esquina (queda sobre la escena 3D) o vuelve a pantalla completa (queda bajo los objetos 3D).
const R = 30 / PIP.s, B = 4 / PIP.s;
const pipTw = [
  `      tl.set("#cam-wrap", { x: ${PIP.x}, y: ${PIP.y}, scale: ${PIP.s.toFixed(5)}, borderRadius: ${R.toFixed(1)}, zIndex: 3 }, 0);`,
  `      tl.set("#cam-frame", { opacity: 1, borderRadius: ${R.toFixed(1)} }, 0);`,
];
MOVES.forEach(([a, b, to]) => {
  const pip = to === 'pip';
  if (pip) pipTw.push(`      tl.set("#cam-wrap", { zIndex: 3 }, ${a});`);
  pipTw.push(`      tl.to("#cam-wrap", { x: ${pip ? PIP.x : 0}, y: ${pip ? PIP.y : 0}, scale: ${pip ? PIP.s.toFixed(5) : 1}, borderRadius: ${pip ? R.toFixed(1) : 0}, duration: ${(b - a).toFixed(2)}, ease: "power2.inOut" }, ${a});`);
  pipTw.push(`      tl.to("#cam-frame", { opacity: ${pip ? 1 : 0}, borderRadius: ${pip ? R.toFixed(1) : 0}, duration: ${(b - a).toFixed(2)}, ease: "power2.inOut" }, ${a});`);
  if (!pip) pipTw.push(`      tl.set("#cam-wrap", { zIndex: 1 }, ${b});`);
});

fs.writeFileSync(path.join(ROOT, 'index.html'), `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="lib/gsap.min.js"></script>
    <script src="lib/three.min.js"></script>
    <script src="lib/geo.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #000000; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #000000; }
      #cam-wrap { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; overflow: hidden; transform-origin: 0 0; z-index: 1; box-shadow: 0 30px 90px rgba(0, 0, 0, 0.55); }
      #cam { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; object-fit: cover; }
      #cam-frame { position: absolute; inset: 0; border: ${B.toFixed(1)}px solid rgba(255, 255, 255, 0.9); opacity: 0; pointer-events: none; }
      #world { z-index: 2; }
      #captions { z-index: 4; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1080" data-height="1920">
      <div id="cam-wrap" data-layout-allow-overflow>
        <video id="cam" class="clip" src="assets/video/hector.mp4" muted playsinline data-start="0" data-duration="${VIDEO_LEN}" data-track-index="0"></video>
        <div id="cam-frame"></div>
      </div>
      <div id="world" data-composition-id="world" data-composition-src="compositions/world.html" data-start="0" data-duration="${TOTAL}" data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920"></div>
      <div id="captions" data-composition-id="captions" data-composition-src="compositions/captions.html" data-start="0" data-duration="${TOTAL}" data-track-index="2" data-track-kind="captions" data-width="1080" data-height="1920"></div>
      <audio id="voz" class="clip" src="assets/voz.wav" data-start="0" data-media-start="${OFF}" data-duration="${DUR}" data-track-index="3" data-volume="1" data-fade-out="0.15"></audio>
${sfx.join('\n')}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
${pipTw.join('\n')}
      tl.set({}, {}, ${TOTAL});
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`);
console.log('frases:', groups.length, '| sonidos:', sfx.length);
console.log(groups.map((g) => g.start.toFixed(2) + '-' + g.end.toFixed(2) + ' ' + g.items.map((w) => w.text).join(' ')).join('\n'));
