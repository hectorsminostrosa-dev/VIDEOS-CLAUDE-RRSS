// Ajusta inicios y finales de Whisper con silencedetect (-40 dB): Whisper alarga la palabra junto a un silencio.
// Uso: node scripts/build-transcript.cjs  ->  _transcript/final.json (tiempos del audio original)
// No corrige palabras: los subtítulos siguen lo que realmente se dice ("realizaría", "estilo más flamenco").
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const j = JSON.parse(fs.readFileSync(path.join(ROOT, '_transcript', 'narracion-original.json'), 'utf8'));
const out = j.segments.flatMap((s) => s.words).map((w) => ({ text: w.word.trim().replace(/[“”"]/g, ''), start: +w.start.toFixed(3), end: +w.end.toFixed(3) }));

const STARTS = [['¿Por', 0.52], ['La', 4.29], ['Fue', 9.98], ['en', 13.49, 13], ['Años', 15.67], ['realizaría', 19.79], ['En', 23.37], ['fue', 24.17], ['el', 27.97, 27.5], ['quien', 29.93], ['¿Y', 34.35, 34], ['Porque', 36.19], ['Con', 42.27], ['y', 46.25, 45.9], ['¿Y', 48.88, 48.5]];
const ENDS = [['Reyes?', 3.72], ['España.', 9.38], ['Cecilia,', 13.2], ['1974.', 14.93], ['Manzanita', 19.43], ['flamenco.', 22.68], ['Chile,', 23.86], ['Reyes', 27.64, 26], ['Conchalí,', 29.47], ['chilena.', 33.56], ['noviembre?', 35.71, 34], ['violetas.', 41.74], ['cantante', 45.92], ['queridos.', 48.28], ['violetas?', 51.55, 50]];
const find = (txt, at, after, key) => out.find((x) => x.text === txt && x.start >= (after || 0) - 0.01 && Math.abs(x[key] - at) < 1.5);
STARTS.forEach(([txt, at, after]) => { const w = find(txt, at, after, 'start'); if (w) w.start = at; else console.warn('sin inicio:', txt, at); });
ENDS.forEach(([txt, at, after]) => { const w = find(txt, at, after, 'end'); if (w) w.end = at; else console.warn('sin final:', txt, at); });
fs.writeFileSync(path.join(ROOT, '_transcript', 'final.json'), JSON.stringify(out, null, 1));
console.log(out.map((w) => `${w.text}[${w.start.toFixed(2)}]`).join(' '));
