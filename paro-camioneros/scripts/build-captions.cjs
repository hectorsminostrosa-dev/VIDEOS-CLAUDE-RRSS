// Genera compositions/captions.html e index.html (con sus sonidos) desde _transcript/final.json.
// Uso: node scripts/build-transcript.cjs && node scripts/build-captions.cjs
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const OFF = 1.3; // el audio arranca en este punto (la voz empieza en 1,52 s del original)
const DUR = 144.2; // voz y escenas (la voz termina en 143,9 s)
const TOTAL = 147.2; // con el cierre en negro
const MAX_WORDS = 5;
const MAX_CHARS = 27;
// Palabras con recuadro magenta (todas sus apariciones) y apariciones puntuales (texto@segundo del video).
const KEY = new Set(['diésel', 'tag', 'grúas', 'totales', 'suspendidos', 'latam', 'sky', 'alarmas', 'abastecimiento', 'residuos', 'cndc', 'cntc', 'anarquía', 'cacique', 'febrero', 'cut', 'aislados']);
const KEY_AT = [['5', 46.18], ['horas', 46.58], ['conducción', 141.1]];

// Sonidos con moderación (15 en un video de 2,5 min): Shutter + destello en las 5 fotos, Pop 3 veces, Click 3 veces,
// Whoosh en 3 cortes y Data en el contador. Sin música.
const SHUTTERS = [1.94, 3.82, 27.68, 104.8, 116.1]; // Kast en la cabina · fila de camiones · bloqueo aéreo · Juan Araya · Kast en el podio
const POPS = [21.22, 22.56, 22.96]; // buses · taxis · grúas
const CLICKS = [9.1, 52.26, 121.6]; // letrero "alerta vial" · "SUSPENDIDO" · tarjeta "hasta febrero"
const WHOOSHES = [34.26, 90.24, 114.74]; // impacto ciudadano · grieta en el gremio · gobierno
const DATAS = [46.0]; // contador "hasta 5 horas"
const SHUTTER_LEAD = 0.1;
const WHOOSH_START = 1.25;
const WHOOSH_PEAK = 0.37;
const CLICK_LEAD = 0.11;
const DATA_LEAD = 0.05;
const VOL = { click: 0.3, pop: 0.32, whoosh: 0.4, shutter: 0.35, data: 0.3 };
const clean = (t) => t.toLowerCase().replace(/[¡!¿?.«»:]/g, '').replace(/,$/, '');
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, '_transcript', 'final.json'), 'utf8'));
const words = raw.map((w) => ({ text: w.text, start: Math.max(0, w.start - OFF), end: w.end - OFF }));
const isKey = (w) => KEY.has(clean(w.text)) || KEY_AT.some(([k, at]) => clean(w.text) === k && Math.abs(w.start - at) < 0.3);

// Frases a mano: siguen las pausas de la voz y no parten nombres ("José Antonio Kast", "Puerto Montt", "Cámara Nacional de Comercio").
const PHRASES = [
  'Chile enfrenta', 'una nueva crisis', 'para el Gobierno', 'de José Antonio Kast.',
  'El paro de camioneros,', 'que comenzó con', 'movilizaciones de pequeños', 'y medianos transportistas,',
  'ya está generando', 'consecuencias', 'en distintas regiones', 'del país.',
  'Las protestas comenzaron', 'por el alza', 'de los combustibles,', 'especialmente el diésel,',
  'además de los costos', 'operacionales', 'y los cobros', 'del TAG y peajes.',
  'A la movilización', 'se sumaron', 'buses interurbanos,', 'taxis,', 'grúas y organizaciones','de conductores,',
  'provocando cortes parciales', 'y en algunos momentos', 'interrupciones totales', 'del tránsito', 'en rutas como', 'la 5 Norte,', '5 Sur y 68.',
  'Pero el conflicto', 'ya dejó de ser solamente', 'un problema entre', 'transportistas', 'y el Gobierno.',
  'Los bloqueos', 'han provocado', 'enormes congestiones,', 'viajes suspendidos', 'y retrasos', 'de varias horas.',
  'Se reportan trayectos', 'de hasta 5 horas', 'entre Santiago', 'y Valparaíso,',
  'mientras servicios de buses', 'entre Puerto Montt', 'y Santiago', 'también sufrieron', 'suspensiones', 'y modificaciones.',
  'Incluso,', 'Latam y SKY', 'advirtieron dificultades', 'para llegar', 'a los aeropuertos.',
  'Latam habilitó', 'cambios y devoluciones', 'de pasajes sin costo', 'para determinados vuelos', 'afectados', 'por la contingencia.',
  'El comercio también', 'encendió las alarmas.', 'La Cámara Nacional', 'de Comercio advirtió', 'sobre los riesgos', 'para la distribución', 'de mercaderías,',
  'el abastecimiento,', 'las ventas de fin de año', 'y los compromisos', 'comerciales', 'de miles de empresas', 'y emprendedores.',
  'En algunas comunas', 'también comenzaron', 'a registrarse problemas', 'con servicios municipales.',
  'En el sur,', 'por ejemplo,', 'se advirtió que', 'la continuidad', 'de la recolección', 'de residuos', 'podría verse comprometida', 'si la dificultad', 'de transportes', 'se prolonga.',
  'Pero hay otro elemento:', 'no todos los camioneros', 'están de acuerdo', 'con el paro.',
  'Los dos principales', 'confederaciones,', 'las históricas', 'del transporte de carga,', 'la CNDC', 'y la CNTC,',
  'rechazaron sumarse', 'a la movilización', 'y optaron por negociar', 'con el Gobierno.',
  'El presidente', 'de la CNDC,', 'Juan Araya,', 'cuestionó la conducción', 'del movimiento', 'y lanzó una dura frase:',
  '«Hay una anarquía,', 'aparece un cacique', 'por todas partes».',
  'Mientras tanto,', 'el Gobierno anunció medidas', 'para contener las alzas', 'de los combustibles,',
  'incluyendo una propuesta', 'de congelamiento', 'de precios hasta febrero,', 'pero hasta ahora', 'no ha conseguido', 'desactivar el conflicto',
  'y el escenario', 'se vuelve todavía', 'más complejo', 'con las movilizaciones', 'estudiantiles', 'contra los recortes', 'presupuestarios',
  'y las próximas jornadas', 'de protestas', 'anunciadas por la CUT.',
  'La pregunta', 'es inevitable:', '¿Estamos frente', 'a conflictos aislados', 'o ante una creciente', 'crisis de conducción', 'política y social', 'para el Gobierno', 'de José Antonio Kast?',
];
const groups = [];
{
  let k = 0;
  PHRASES.forEach((p) => {
    const n = p.split(' ').length;
    const items = words.slice(k, k + n);
    if (items.map((w) => w.text).join(' ') !== p) throw new Error('La frase no calza con la voz: "' + p + '" / "' + items.map((w) => w.text).join(' ') + '"');
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
    if (!isKey(w)) return esc(w.text);
    const id = `kw-${i}-${j}`;
    tweens.push(`    tl.fromTo("#${id}", { opacity: 0 }, { opacity: 1, duration: 0.14, ease: "sine.inOut" }, ${w.start.toFixed(3)});`);
    return `<span class="kw"><span id="${id}" class="kwb"><i class="h a"></i><i class="h b"></i></span>${esc(w.text)}</span>`;
  }).join(' ');
  tweens.push(`    tl.fromTo("#capt-${i}", { opacity: 0 }, { opacity: 1, duration: 0.16, ease: "sine.inOut" }, ${g.start.toFixed(3)});`);
  tweens.push(`    tl.to("#capt-${i}", { opacity: 0, duration: 0.13, ease: "sine.inOut" }, ${(g.end - 0.14).toFixed(3)});`);
  return `    <div id="cap-${i}" class="clip cap" data-start="${g.start.toFixed(3)}" data-duration="${(g.end - g.start).toFixed(3)}" data-track-index="1"><div id="capt-${i}" class="capt">${body}</div></div>`;
}).join('\n');

fs.writeFileSync(path.join(ROOT, 'compositions', 'captions.html'), `<template>
  <style>
    @font-face { font-family: "Bahnschrift"; src: local("Bahnschrift"); }
    #root { position: absolute; inset: 0; pointer-events: none; }
    .cap { position: absolute; left: 40px; right: 40px; top: 1250px; text-align: center; overflow: visible; z-index: 20; }
    .capt {
      font-family: "Bahnschrift", sans-serif;
      font-size: 60px;
      line-height: 1.28;
      color: #ffffff;
      text-shadow: 0 2px 14px rgba(0, 0, 0, 0.85), 0 0 3px rgba(0, 0, 0, 0.6);
    }
    .kw { position: relative; display: inline-block; padding: 0 10px; margin: 0 -4px; isolation: isolate; }
    .kwb { position: absolute; inset: 2px 0; z-index: -1; background: rgba(202, 51, 144, 0.9); border: 2px solid #ee8ccb; border-radius: 7px; }
    .h { position: absolute; width: 13px; height: 13px; border-radius: 50%; background: #ee8ccb; }
    .h.a { left: -7px; top: -7px; }
    .h.b { right: -7px; bottom: -7px; }
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
const sfx = [];
const TRACK = { pop: 5, click: 6, whoosh: 7, shutter: 8, data: 9 };
const addSfx = (id, file, start, dur, vol, extra = '') => {
  if (start < 0 || start >= DUR) return;
  const d = Math.min(dur, DUR - start);
  const track = TRACK[file.split('.')[0]] + (id.startsWith('sfx-pop') && id.endsWith('1') ? 5 : 0);
  sfx.push(`      <audio id="${id}" class="clip" src="assets/sfx/${file}" data-start="${start.toFixed(3)}" data-duration="${d.toFixed(3)}" data-track-index="${track}" data-volume="${vol}"${extra}></audio>`);
};
POPS.forEach((t, i) => addSfx(`sfx-pop-${i}`, 'pop.wav', t + FRAME, 0.55, VOL.pop, ' data-fade-out="0.15"'));
CLICKS.forEach((t, i) => addSfx(`sfx-click-${i}`, 'click.wav', Math.max(0, t - CLICK_LEAD + FRAME), 0.45, VOL.click));
WHOOSHES.forEach((c, i) => addSfx(`sfx-whoosh-${i}`, 'whoosh.mp3', c - WHOOSH_PEAK + FRAME, 1.15, VOL.whoosh, ` data-media-start="${WHOOSH_START}" data-fade-out="0.2"`));
SHUTTERS.forEach((t, i) => addSfx(`sfx-shutter-${i}`, 'shutter.wav', Math.max(0, t - SHUTTER_LEAD + FRAME), 0.6, VOL.shutter));
DATAS.forEach((t, i) => addSfx(`sfx-data-${i}`, 'data.wav', Math.max(0, t - DATA_LEAD + FRAME), 1.25, VOL.data, ' data-fade-out="0.2"'));

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
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1080" data-height="1920">
      <div id="world" data-composition-id="world" data-composition-src="compositions/world.html" data-start="0" data-duration="${TOTAL}" data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920"></div>
      <div id="captions" data-composition-id="captions" data-composition-src="compositions/captions.html" data-start="0" data-duration="${TOTAL}" data-track-index="2" data-track-kind="captions" data-width="1080" data-height="1920"></div>
      <audio id="narracion" class="clip" src="assets/narracion.mp3" data-start="0" data-media-start="${OFF}" data-duration="${DUR}" data-track-index="3" data-volume="1"></audio>
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
