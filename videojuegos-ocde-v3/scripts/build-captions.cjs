// Genera compositions/captions.html e index.html (con sus sonidos) desde _transcript/final.json.
// Uso: node scripts/build-transcript.cjs && node scripts/build-captions.cjs
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const OFF = 0.75; // el audio arranca en este punto (se recorta el silencio inicial)
const DUR = 67.0; // voz y escenas
const TOTAL = 70.0; // con el cierre en negro
const MAX_WORDS = 5;
const MAX_CHARS = 27;
const KEY = new Set(['1', 'ocde', '36%', '9%', 'rendimiento', 'esports', 'neuroplasticidad', 'reflejos', 'coordinación', 'chancho', 'campeón']);

// Sonidos con moderación (pedido del usuario en v2): Click 3 veces y Pop 3 veces, al aparecer textos o figuras clave;
// Whoosh solo en 2 cortes; Shutter + destello solo cuando aparece una imagen (las 4 fotos). El resto de cortes, sin sonido.
const POPS = [11.25, 17.75, 65.35]; // frena el contador 36% · tarjeta 9% · logro desbloqueado
const CLICKS = [3.72, 15.15, 61.41]; // informe OCDE · promedio OCDE 26% · 03:00 AM
const WHOOSHES = [24.5, 45.35]; // a la arena de esports · a la ciencia
const SHUTTERS = [30.85, 33.1, 37.0, 39.85]; // fotos: Craime · hermanos · PoniX · GamezK1ng
const WHOOSH_START = 1.25;
const WHOOSH_PEAK = 0.37;
const CLICK_LEAD = 0.11;
const SHUTTER_LEAD = 0.1;
const VOL = { click: 0.3, pop: 0.32, whoosh: 0.4, shutter: 0.35 };

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
const WEAK = new Set(['e', 'y', 'o', 'a', 'en', 'la', 'el', 'de', 'los', 'las', 'un', 'que']);
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
const TRACK = { pop: 5, click: 6, whoosh: 7, shutter: 8 };
const addSfx = (id, file, start, dur, vol, extra = '') => {
  if (start < 0 || start >= DUR) return;
  const d = Math.min(dur, DUR - start);
  const track = TRACK[file.split('.')[0]];
  sfx.push(`      <audio id="${id}" class="clip" src="assets/sfx/${file}" data-start="${start.toFixed(3)}" data-duration="${d.toFixed(3)}" data-track-index="${track}" data-volume="${vol}"${extra}></audio>`);
};
POPS.forEach((t, i) => addSfx(`sfx-pop-${i}`, 'pop.wav', t + FRAME, 0.55, VOL.pop, ' data-fade-out="0.15"'));
CLICKS.forEach((t, i) => addSfx(`sfx-click-${i}`, 'click.wav', Math.max(0, t - CLICK_LEAD + FRAME), 0.45, VOL.click));
WHOOSHES.forEach((c, i) => addSfx(`sfx-whoosh-${i}`, 'whoosh.mp3', c - WHOOSH_PEAK + FRAME, 1.15, VOL.whoosh, ` data-media-start="${WHOOSH_START}" data-fade-out="0.2"`));
SHUTTERS.forEach((c, i) => addSfx(`sfx-shutter-${i}`, 'shutter.wav', c - SHUTTER_LEAD + FRAME, 0.6, VOL.shutter));

fs.writeFileSync(path.join(ROOT, 'index.html'), `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="lib/gsap.min.js"></script>
    <script src="lib/three.min.js"></script>
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
console.log('frases:', groups.length, '| pops:', POPS.length, '| clicks:', CLICKS.length, '| shutters:', SHUTTERS.length, '| whooshes:', WHOOSHES.length);
console.log(groups.map((g) => g.start.toFixed(2) + ' ' + g.items.map((w) => w.text).join(' ')).join('\n'));
