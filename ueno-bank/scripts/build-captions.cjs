// Genera compositions/captions.html e index.html (con sus sonidos) desde la transcripción de Whisper.
// Uso: node scripts/build-captions.cjs
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const OFF = 0.3; // el audio arranca en este punto (se recorta el silencio inicial)
const DUR = 58.35; // voz y escenas
const TOTAL = 61.4; // con el cierre en negro
const MAX_WORDS = 5;
const MAX_CHARS = 27;
const KEY = new Set(['intervino', 'paraguay', 'solvencia', '2,9', '355', 'irregulares', 'billón', '8', 'renunció', '38', 'forzoso', 'ahorros', 'colchón', 'inflación', 'polillas']);

// Sonidos: Click y Pop solo en 2 o 3 textos; Whoosh en cada cambio de toma.
const POPS = [18.86, 35.0, 40.2]; // frena el contador 2,9 M · sello RENUNCIA · tarjeta 38 mil
const CLICKS = [4.74, 22.92, 31.3]; // Cuenta suspendida · $355 M · 8 altos ejecutivos
const CUTS = [5.7, 10.7, 14.18, 18.08, 21.46, 26.38, 31.28, 33.5, 38.18, 41.68, 46.72, 51.68, 56.43];
const WHOOSH_START = 1.25;
const WHOOSH_PEAK = 0.37;
const CLICK_LEAD = 0.11;
const VOL = { click: 0.3, pop: 0.32, whoosh: 0.4 };

const clean = (t) => t.toLowerCase().replace(/[¡!¿?.]/g, '').replace(/,$/, '');
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, '_transcript', 'ueno bank.json'), 'utf8'));
let list = raw.segments.flatMap((s) => s.words).map((w) => ({ text: w.word.trim(), start: w.start, end: w.end }));

// Correcciones de Whisper: el audio manda, pero estos son errores de transcripción y no de la voz.
const fixed = [];
for (let i = 0; i < list.length; i++) {
  const w = { ...list[i] };
  const n = list[i + 1];
  if (w.text === '2' && n && n.text === '.9') { w.text = '2,9'; w.end = n.end; i++; }
  else if (w.text === 'a' && n && /^riendo/.test(n.text)) { w.text = 'arriendo.'; w.end = n.end; i++; }
  else if (w.text === 'saltos') w.text = 'altos';
  else if (w.text === 'donde') w.text = 'dónde';
  fixed.push(w);
}
// Inicios reales medidos con silencedetect: Whisper alarga la palabra que sigue a un silencio.
const STARTS = { Imagina: 0.32, Ueno: 14.5, '8': 31.6 };
fixed.forEach((w) => { if (STARTS[w.text] !== undefined) w.start = STARTS[w.text]; if (w.text === 'Así') w.start = 47.06; });
const words = fixed.map((w) => ({ text: w.text, start: Math.max(0, w.start - OFF), end: w.end - OFF }));

const groups = [];
let cur = [];
words.forEach((w, i) => {
  cur.push(w);
  const next = words[i + 1];
  const chars = cur.map((x) => x.text).join(' ').length + (next ? next.text.length + 1 : 0);
  if (!next || /[.!?]$/.test(w.text) || /[a-zñáéíóú],$/i.test(w.text) || next.start - w.end >= 0.15 || cur.length >= MAX_WORDS || chars > MAX_CHARS) {
    groups.push({ items: cur });
    cur = [];
  }
});
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

const FRAME = 1 / 30;
const sfx = [];
const TRACK = { pop: 5, click: 6, whoosh: 7 };
const addSfx = (id, file, start, dur, vol, extra = '') => {
  if (start < 0 || start >= DUR) return;
  const d = Math.min(dur, DUR - start);
  const track = TRACK[file.split('.')[0]];
  sfx.push(`      <audio id="${id}" class="clip" src="assets/sfx/${file}" data-start="${start.toFixed(3)}" data-duration="${d.toFixed(3)}" data-track-index="${track}" data-volume="${vol}"${extra}></audio>`);
};
POPS.forEach((t, i) => addSfx(`sfx-pop-${i}`, 'pop.wav', t + FRAME, 0.55, VOL.pop, ' data-fade-out="0.15"'));
CLICKS.forEach((t, i) => addSfx(`sfx-click-${i}`, 'click.wav', Math.max(0, t - CLICK_LEAD + FRAME), 0.3, VOL.click));
CUTS.forEach((c, i) => addSfx(`sfx-whoosh-${i}`, 'whoosh.mp3', c - WHOOSH_PEAK + FRAME, 1.15, VOL.whoosh, ` data-media-start="${WHOOSH_START}" data-fade-out="0.2"`));

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
console.log('frases:', groups.length, '| pops:', POPS.length, '| clicks:', CLICKS.length, '| whooshes:', CUTS.length);
console.log(groups.map((g) => g.start.toFixed(2) + ' ' + g.items.map((w) => w.text).join(' ')).join('\n'));
