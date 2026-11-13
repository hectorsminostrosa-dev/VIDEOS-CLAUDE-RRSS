// Genera compositions/captions.html e index.html (con sus sonidos) desde _transcript/final.json.
// Uso: node scripts/build-transcript.cjs && node scripts/build-captions.cjs
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const OFF = 0.25; // el audio arranca en este punto (se recorta el silencio inicial de 0,31 s)
const DUR = 50.0; // voz y escenas
const TOTAL = 51.0; // con el fundido final a negro (sin créditos)
const MAX_WORDS = 5;
const MAX_CHARS = 27;
const KEY = new Set(['psilocibina', 'depresión', '68', 'macrodosis', 'ego', 'abuelita']);

// Sonidos con moderación (10 en total): Click 3 y Pop 3 al aparecer textos o figuras clave; Whoosh solo en 2 cortes;
// timbre al estampar "AUTORIZADO" y campanita en la manzanilla. El resto de cortes, sin sonido.
const POPS = [15.45, 23.93, 27.19]; // molécula de psilocibina · 68 participantes · llega la macrodosis
const CLICKS = [2.04, 12.09, 47.19]; // hito médico · primer ensayo clínico · pregunta final
const WHOOSHES = [9.63, 40.32]; // a la noticia (ISP) · al remate de la abuelita
const BOOMS = [];
const STAMPS = [10.97]; // timbre "AUTORIZADO"
const RUMBLES = [];
const DINGS = [45.05]; // "manzanilla"
const WHOOSH_START = 1.25;
const WHOOSH_PEAK = 0.37;
const CLICK_LEAD = 0.11;
const DING_LEAD = 0.26;
const VOL = { click: 0.3, pop: 0.32, whoosh: 0.4, boom: 0.3, stamp: 0.26, rumble: 0.42, ding: 0.3 };

const clean = (t) => t.toLowerCase().replace(/[¡!¿?.]/g, '').replace(/,$/, '');
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, '_transcript', 'final.json'), 'utf8'));
const fixed = [];
for (let i = 0; i < raw.length; i++) {
  const w = { ...raw[i] };
  const n = raw[i + 1];
  if (/^\d+$/.test(w.text) && n && n.text === '%') { w.text = w.text + '%'; w.end = n.end; i++; }
  fixed.push(w);
}
const words = fixed.map((w) => ({ text: w.text, start: Math.max(0, w.start - OFF), end: w.end - OFF }));

const groups = [];
let cur = [];
words.forEach((w, i) => {
  cur.push(w);
  const next = words[i + 1];
  const chars = cur.map((x) => x.text).join(' ').length + (next ? next.text.length + 1 : 0);
  if (!next || /[.!?]$/.test(w.text) || /[a-zñáéíóú0-9],$/i.test(w.text) || next.start - w.end >= 0.15 || cur.length >= MAX_WORDS || chars > MAX_CHARS) {
    groups.push({ items: cur });
    cur = [];
  }
});
// Reequilibrio: ninguna frase termina en palabra débil ("de", "en el", "e") ni deja una palabra sola.
const WEAK = new Set(['e', 'y', 'o', 'a', 'en', 'la', 'el', 'de', 'los', 'las', 'un', 'que', 'no', 'con', 'al', 'del', 'como']);
const len = (items) => items.map((x) => x.text).join(' ').length;
const moveWeak = () => {
  for (let i = 0; i < groups.length - 1; i++) {
    const g = groups[i], n = groups[i + 1];
    while (g.items.length > 1 && WEAK.has(g.items[g.items.length - 1].text) && n.items[0].start - g.items[g.items.length - 1].end < 0.15) n.items.unshift(g.items.pop());
    if (g.items.length === 1 && WEAK.has(g.items[0].text) && n.items[0].start - g.items[0].end < 0.4) { n.items.unshift(g.items.pop()); groups.splice(i, 1); i--; }
  }
};
moveWeak();
for (let i = 1; i < groups.length; i++) {
  const g = groups[i], p = groups[i - 1];
  if (g.items.length === 1 && p.items.length >= 4 && g.items[0].start - p.items[p.items.length - 1].end < 0.15) g.items.unshift(...p.items.splice(-2));
}
moveWeak();
for (let i = 0; i < groups.length - 1; i++) {
  const g = groups[i], n = groups[i + 1];
  const last = g.items[g.items.length - 1];
  if (!/[.!?]$/.test(last.text) && n.items[0].start - last.end < 0.15 && g.items.length + n.items.length <= MAX_WORDS && len([...g.items, ...n.items]) <= 28) {
    g.items.push(...n.items);
    groups.splice(i + 1, 1);
    i--;
  }
}
// Frases largas (más de 28 caracteres): se parten en dos, en el corte más parejo que no deje palabra débil al final.
for (let i = 0; i < groups.length; i++) {
  const g = groups[i];
  if (len(g.items) <= 28 || g.items.length < 2) continue;
  let best = -1, score = 1e9;
  for (let k = 1; k < g.items.length; k++) {
    if (WEAK.has(g.items[k - 1].text)) continue;
    const s = Math.abs(len(g.items.slice(0, k)) - len(g.items.slice(k)));
    if (s < score) { score = s; best = k; }
  }
  if (best > 0) { groups.splice(i + 1, 0, { items: g.items.slice(best) }); g.items = g.items.slice(0, best); i--; }
}
// Frases a mano para este video (cortes naturales al leer); se respetan las palabras y tiempos de la voz.
const MANUAL = ['¿Hongos para', 'la salud mental?', 'Por primera vez', 'en la historia de Chile,', 'una sustancia', 'tradicionalmente prohibida',
  'entra de manera oficial', 'a los laboratorios', 'para tratar la salud mental.', 'El Instituto de', 'Salud Pública', 'autorizó formalmente',
  'el primer ensayo clínico', 'que utilizará psilocibina,', 'el principio activo', 'de los hongos alucinógenos,', 'enfocado en pacientes',
  'con depresión', 'que no respondieron', 'a los antidepresivos', 'tradicionales.', 'El estudio se aplicará', 'a 68 voluntarios',
  'y no mediante microdosis,', 'sino con una', 'macrodosis única', 'y guiada por terapeutas.', 'El objetivo médico', 'es inducir',
  'la disolución temporal', 'del ego', 'para que la persona pueda', 'reordenar su experiencia', 'emocional.', 'Un avance histórico',
  'y prometedor', 'para la ciencia en Chile,', 'aunque', 'anda a convencer', 'a tu abuelita', 'de que esto calma', 'las penas',
  'mejor que una agüita', 'de melisa y manzanilla,', 'no lo hay.', '¿Tú estarías dispuesto', 'a probar esta terapia?'];
if (MANUAL.length) {
  const all = groups.flatMap((g) => g.items);
  groups.length = 0;
  let k = 0;
  MANUAL.forEach((p) => {
    const n = p.split(' ').length;
    const items = all.slice(k, k + n);
    if (items.map((w) => w.text).join(' ') !== p) throw new Error('frase manual no calza: ' + p + ' <> ' + items.map((w) => w.text).join(' '));
    groups.push({ items });
    k += n;
  });
  if (k !== all.length) throw new Error('sobran palabras: ' + all.slice(k).map((w) => w.text).join(' '));
}
groups.forEach((g, i) => {
  g.start = g.items[0].start;
  const lastEnd = g.items[g.items.length - 1].end;
  const next = groups[i + 1];
  if (!next) g.end = Math.min(lastEnd + 0.1, DUR);
  else g.end = next.items[0].start - lastEnd < 0.4 ? next.items[0].start : lastEnd + 0.25;
});

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const tweens = [];
const rows = groups.map((g, i) => {
  const body = g.items.map((w, j) => {
    if (!KEY.has(clean(w.text))) return esc(w.text);
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
    .kwb { position: absolute; inset: 2px 0; z-index: -1; background: rgba(168, 122, 66, 0.92); border: 2px solid #e6cc98; border-radius: 7px; }
    .h { position: absolute; width: 13px; height: 13px; border-radius: 50%; background: #e6cc98; }
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
const TRACK = { pop: 5, click: 6, whoosh: 7, boom: 8, stamp: 9, rumble: 10, ding: 11 };
const addSfx = (id, file, start, dur, vol, extra = '') => {
  if (start < 0 || start >= DUR) return;
  const d = Math.min(dur, DUR - start);
  const track = TRACK[file.split('.')[0]];
  sfx.push(`      <audio id="${id}" class="clip" src="assets/sfx/${file}" data-start="${start.toFixed(3)}" data-duration="${d.toFixed(3)}" data-track-index="${track}" data-volume="${vol}"${extra}></audio>`);
};
POPS.forEach((t, i) => addSfx(`sfx-pop-${i}`, 'pop.wav', t + FRAME, 0.55, VOL.pop, ' data-fade-out="0.15"'));
CLICKS.forEach((t, i) => addSfx(`sfx-click-${i}`, 'click.wav', Math.max(0, t - CLICK_LEAD + FRAME), 0.45, VOL.click));
WHOOSHES.forEach((c, i) => addSfx(`sfx-whoosh-${i}`, 'whoosh.mp3', c - WHOOSH_PEAK + FRAME, 1.15, VOL.whoosh, ` data-media-start="${WHOOSH_START}" data-fade-out="0.2"`));
BOOMS.forEach((t, i) => addSfx(`sfx-boom-${i}`, 'boom.mp3', t + FRAME, 1.1, VOL.boom, ' data-fade-out="0.4"'));
STAMPS.forEach((t, i) => addSfx(`sfx-stamp-${i}`, 'stamp.mp3', t + FRAME, 0.6, VOL.stamp, ' data-fade-out="0.25"'));
RUMBLES.forEach((t, i) => addSfx(`sfx-rumble-${i}`, 'rumble.mp3', t + FRAME, 2.6, VOL.rumble, ' data-fade-out="0.8"'));
DINGS.forEach((t, i) => addSfx(`sfx-ding-${i}`, 'ding.mp3', t - DING_LEAD + FRAME, 1.6, VOL.ding, ' data-fade-out="0.4"'));

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
console.log(groups.map((g) => g.start.toFixed(2) + ' ' + g.items.map((w) => w.text).join(' ')).join('\n'));
