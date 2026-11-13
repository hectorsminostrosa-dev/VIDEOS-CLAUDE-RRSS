// Genera compositions/captions.html e index.html (con sus sonidos) desde _transcript/final.json.
// Uso: node scripts/build-transcript.cjs && node scripts/build-captions.cjs
// Estilo de este video (canal de YouTube, guion "Escándalo en Nvidia"): subtítulos dinámicos en blanco y amarillo.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const OFF = 0.78; // el audio arranca aquí (se recorta el silencio inicial)
const DUR = 69.1; // voz y escenas
const TOTAL = 70.3; // con el fundido a negro final
const YELLOW = '#FFD23F';
const KEY = new Set(['miel', 'espionaje', 'seducción', 'nvidia', 'trampas', 'investigación', 'extramatrimonial', 'china', 'cinco', 'mil', 'millones',
  'correo', 'suelo', 'débito', 'carisma', 'microchips', 'billetera', 'ndivia', 'pato']);

// Sonidos (17 en total, sin música): [archivo, instante visual, inicio dentro del archivo (silencio que se salta), duración, volumen, fundido de salida]
const SFX = [
  ['liquid.mp3', 1.5, 0.1, 0.75, 0.35, 0.2], // la miel toca el chip
  ['whoosh.mp3', 5.5 - 0.37, 1.25, 1.15, 0.4, 0.2], // corte a Jensen (pico del whoosh en el corte)
  ['alarm.mp3', 9.88, 0.46, 1.9, 0.2, 0.5], // "¡Y adivinen qué!"
  ['glass.mp3', 13.4, 0.4, 0.9, 0.38, 0.2], // el logo se quiebra en "caer"
  ['shutter.wav', 13.95, 0.1, 0.5, 0.35, 0], // tuit
  ['paper.wav', 18.28, 0.24, 0.8, 0.32, 0.25], // se abre el expediente en "destaparse"
  ['shutter.wav', 19.08, 0.1, 0.5, 0.35, 0], // foto de Jensen Huang
  ['shutter.wav', 22.84, 0.1, 0.5, 0.35, 0], // fotos de Alice Huang
  ['whoosh.mp3', 25.26 - 0.37, 1.25, 1.15, 0.4, 0.2], // corte al globo
  ['data.wav', 27.4, 0.09, 1.4, 0.3, 0.4], // rutas de los chips
  ['pop.wav', 28.18, 0, 0.55, 0.32, 0.15], // US$4.800M
  ['notif.mp3', 35.94, 1.8, 0.8, 0.28, 0.2], // "correo"
  ['shutter.wav', 39.3, 0.1, 0.5, 0.35, 0], // gráfico de NVDA
  ['badum.mp3', 46.9, 0.28, 1.85, 0.42, 0.3], // platillo: corte en seco al sillón
  ['money.mp3', 55.5, 0.05, 1.3, 0.32, 0.3], // "Billetera"
  ['electric.mp3', 61.1, 0.14, 1.2, 0.22, 0.3], // la tarjeta radiactiva
  ['duck.mp3', 68.1, 0.21, 0.75, 0.45, 0.15], // "pato"
];

const clean = (t) => t.toLowerCase().replace(/[¡!¿?.:,]/g, '');
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, '_transcript', 'final.json'), 'utf8'));
const words = raw.map((w) => ({ text: w.text, start: Math.max(0, w.start - OFF), end: w.end - OFF }));

// Frases a mano: cortan en pausas y signos, hasta ~5 palabras o 27 caracteres, sin palabras débiles al final.
const PHRASES = [
  '¿Saben lo que es', 'la trampa de miel?',
  'Es la táctica de espionaje', 'más vieja del mundo,',
  'usar el romance,', 'el sexo y la seducción', 'para robar', 'secretos de Estado.',
  '¡Y adivinen qué!',
  'El mismísimo CEO de Nvidia', 'acaba de caer completito', 'en una de esas trampas.',
  'La propia compañía', 'abrió una investigación', 'tras destaparse que', 'Jensen Huang mantuvo', 'una relación', 'extramatrimonial',
  'con una empresaria vinculada', 'a la inteligencia china,',
  'sospechosa de sacar', 'información clave', 'y desviar casi', 'cinco mil millones', 'de dólares en chips', 'avanzados hacia', 'el continente asiático.',
  'El propio magnate', 'tuvo que enviar un correo', 'pidiendo disculpas', 'y reconociendo', 'el lío familiar,',
  'pero Wall Street', 'no perdona.',
  'Las acciones', 'se fueron al suelo', 'y la junta directiva', 'ahora la revisa', 'hasta lo que compra', 'con la tarjeta de débito.',
  'Mi compadre juraba', 'que lo miraban', 'por su carisma', 'y su sensual', 'chaqueta de cuero,',
  'pero solo querían', 'sacarle los microchips.',
  'Ya lo dice', 'el viejo refrán:', 'Billetera mata galán.',
  'Así que si', 'el próximo mes', 'pillas en AliExpress', 'una flamante', 'NDIVIA LTX 5090', 'a 15 lucas', 'y con envío gratis,',
  'ya sabes', 'quién pagó el pato.',
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
    // Cada palabra se enciende cuando se dice; las claves se vuelven amarillas con un pequeño golpe de escala.
    if (j > 0) tweens.push(`    tl.fromTo("#${id}", { opacity: 0.45 }, { opacity: 1, duration: 0.08, ease: "none" }, ${w.start.toFixed(3)});`);
    if (key) tweens.push(`    tl.fromTo("#${id}", { color: "#ffffff", scale: 1 }, { color: "${YELLOW}", scale: 1.12, duration: 0.09, ease: "power2.out" }, ${w.start.toFixed(3)});`,
      `    tl.to("#${id}", { scale: 1, duration: 0.16, ease: "sine.inOut" }, ${(w.start + 0.09).toFixed(3)});`);
    return `<span id="${id}" class="w${key ? ' k' : ''}">${esc(w.text)}</span>`;
  }).join(' ');
  tweens.push(`    tl.fromTo("#capt-${i}", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.16, ease: "power2.out" }, ${g.start.toFixed(3)});`);
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
    .k { text-shadow: 0 2px 14px rgba(0, 0, 0, 0.9), 0 0 18px rgba(255, 210, 63, 0.35); }
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

fs.writeFileSync(path.join(ROOT, 'index.html'), `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="lib/gsap.min.js"></script>
    <script src="lib/three.min.js"></script>
    <script src="lib/globe.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #000000; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1080" data-height="1920">
      <div id="world" data-composition-id="world" data-composition-src="compositions/world.html" data-start="0" data-duration="${TOTAL}" data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920"></div>
      <div id="captions" data-composition-id="captions" data-composition-src="compositions/captions.html" data-start="0" data-duration="${TOTAL}" data-track-index="2" data-track-kind="captions" data-width="1080" data-height="1920"></div>
      <audio id="narracion" class="clip" src="assets/narracion.mp3" data-start="0" data-media-start="${OFF}" data-duration="${DUR}" data-track-index="3" data-volume="1"></audio>
      <audio id="musica" class="clip" src="assets/musica.wav" data-start="0" data-duration="${TOTAL}" data-track-index="4" data-volume="1"></audio>
${sfx.join('\n')}
    </div>
    <script>
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`);
console.log('frases:', groups.length, '| sonidos:', sfx.length);
console.log(groups.map((g) => g.start.toFixed(2) + '-' + g.end.toFixed(2) + ' ' + g.items.map((w) => w.text).join(' ')).join('\n'));
