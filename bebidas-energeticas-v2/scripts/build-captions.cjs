// Genera compositions/captions.html e index.html (con sus sonidos) desde _transcript/final.json.
// Uso: node scripts/build-transcript.cjs && node scripts/build-captions.cjs
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const OFF = 0.2; // el audio arranca en este punto (la voz empieza en 0,31 s)
const DUR = 72.0; // voz y escenas
const TOTAL = 75.0; // con el cierre en negro
const MAX_WORDS = 5;
const MAX_CHARS = 27;
const KEY = new Set(['ayunas', 'desayuno', '505', 'superando', 'enmascara', 'borrachera', 'despierta', 'corazón', 'congreso', 'prohibir', 'arritmias', 'hipertensivas', 'tres', 'vibrando', 'timbre', 'café', 'agüita', 'abuela']);

// Sonidos con moderación (11 en total): Click 3 veces, Pop 3 veces, Whoosh en 2 cortes, Shutter + destello en las 2 fotos
// y el timbre del recreo. Sin música (v2).
const SHUTTERS = [2.2, 39.56]; // joven con la lata · ilustración de The Clinic
const POPS = [54.54, 54.8, 55.1]; // una, dos, tres latas
const CLICKS = [13.3, 33.66, 41.75]; // tarjeta "505 mg" · sello "borrachera despierta" · sello "proyecto de ley"
const WHOOSHES = [19.95, 52.9]; // al bar · al remate
const BELL = 63.54; // "timbre"
const SHUTTER_LEAD = 0.1;
const WHOOSH_START = 1.25;
const WHOOSH_PEAK = 0.37;
const CLICK_LEAD = 0.11;
const VOL = { click: 0.3, pop: 0.32, whoosh: 0.4, shutter: 0.35, bell: 0.3 };
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
// Frases a mano (siguen la voz y no parten el nombre de la canción): reemplazan el corte automático.
const PHRASES = [
  'En Chile,', 'cada vez más escolares', 'y universitarios', 'están consumiendo', 'bebidas energéticas', 'en ayunas',
  'para sustituir el desayuno', 'y así rendir mejor', 'en clases.',
  'Pero ojo al dato:', 'una sola lata', 'de energética', 'puede llegar a contener', 'hasta 505 miligramos', 'de cafeína,',
  'superando con creces', 'la dosis máxima', 'recomendada para un adulto.',
  'Tropical Gin,', 'Dragon Gin,', 'Thunder Mule', 'o Tropical Shock,', '¿te suenan?',
  'Son tragos que se hacen', 'a base de', 'bebida energética,', 'los cuales esconden', 'otro problema.',
  'La cafeína te enmascara', 'el efecto del alcohol', 'creando la llamada', 'borrachera despierta,', 'que engaña a tu cerebro',
  'mientras que el corazón', 'te palpita como motor', 'de micro amarilla.',
  'El tema es tan crítico', 'que ya hay un proyecto', 'en el Congreso', 'para prohibir su venta', 'a menores de edad,',
  'tal como lo hicieron', 'en Canadá', 'o en Reino Unido,',
  'buscando frenar urgencias', 'por arritmias', 'y crisis hipertensivas', 'en adultos jóvenes.',
  'Así que si pensabas', 'tomarte tres latas al hilo', 'para salvar el semestre', 'a última hora,', 'piénsalo,',
  'porque en vez de', 'pasar el examen,', 'vas a terminar', 'vibrando tanto', 'que vas a confundir', 'el timbre del recreo.',
  'Mejor tómate', 'un buen café,', 'un pancito', 'con huevo revuelto', 'o una agüita de hierbas', 'de la abuela,',
  'no andís', 'tomando hueás.',
];
{
  const all = groups.flatMap((g) => g.items);
  groups.length = 0;
  let k = 0;
  PHRASES.forEach((p) => {
    const n = p.split(' ').length;
    const items = all.slice(k, k + n);
    if (items.map((w) => w.text).join(' ') !== p) throw new Error('La frase no calza con la voz: "' + p + '" / "' + items.map((w) => w.text).join(' ') + '"');
    groups.push({ items });
    k += n;
  });
  if (k !== all.length) throw new Error('Sobran palabras: ' + all.slice(k).map((w) => w.text).join(' '));
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
const TRACK = { pop: 5, click: 6, whoosh: 7, shutter: 8, bell: 9 };
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
addSfx('sfx-bell', 'bell.wav', BELL + FRAME, 1.6, VOL.bell);

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
      <audio id="narracion" class="clip" src="assets/narracion.mp3" data-start="0" data-media-start="${OFF}" data-duration="${Math.min(DUR, 71.84)}" data-track-index="3" data-volume="1"></audio>
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
