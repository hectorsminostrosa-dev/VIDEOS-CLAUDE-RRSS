// Une las dos transcripciones de Whisper y ajusta inicios y finales con silencedetect (-40 dB).
// Hasta "microamarilla" se usa la pasada con el guion como pista; desde "El tema es tan crítico" (39,4 s),
// la pasada sin el guion (la voz se aparta del guion al final: "adultos jóvenes", "a última hora", "pancito con huevo revuelto"...).
// Uso: node scripts/build-transcript.cjs  ->  _transcript/final.json (tiempos del audio original)
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, '_transcript', f), 'utf8')).segments.flatMap((s) => s.words);
const CUT = 39.4;
const a = read('narracion-original.json').filter((w) => w.start < CUT - 0.1);
const b = read('tramo-final.json').map((w) => ({ ...w, start: w.start + CUT, end: w.end + CUT }));
const out = [...a, ...b].map((w) => ({ text: w.word.trim().replace(/[“”"]/g, ''), start: +w.start.toFixed(3), end: +w.end.toFixed(3) }));

// Correcciones de escritura (no de contenido).
const FIX = { 'dato,': 'dato:', 'microamarilla.': null, 'hueás.': 'hueás.' };
for (let i = 0; i < out.length; i++) {
  const w = out[i];
  if (w.text === 'microamarilla.') { const m = (w.start + w.end) / 2 - 0.12; out.splice(i, 1, { text: 'micro', start: w.start, end: +m.toFixed(3) }, { text: 'amarilla.', start: +m.toFixed(3), end: w.end }); }
  else if (FIX[w.text]) w.text = FIX[w.text];
  if (w.text === 'a' && out[i + 1] && out[i + 1].text === 'base' && out[i + 1].end - out[i + 1].start < 0.05) { w.end = 27.02; out[i + 1].start = 27.02; }
}
const STARTS = [['En', 0.31], ['para', 6.09, 5.5], ['Pero', 9.57], ['una', 10.86], ['superando', 16.27], ['Tropical', 20.25], ['Dragon', 21.29], ['Thunder', 22.41], ['Tropical', 23.52, 23], ['¿te', 24.64], ['Son', 25.78], ['los', 28.45], ['La', 30.59], ['que', 35.31, 35], ['El', 39.69], ['tal', 44.97], ['buscando', 47.39], ['Así', 53.36], ['piénsalo,', 58.34], ['Mejor', 64.94], ['un', 66.47, 66.3], ['o', 68.58], ['no', 70.62]];
const ENDS = [['ayunas', 5.73], ['clases.', 9.04], ['dato:', 10.49], ['cafeína,', 15.99], ['adulto.', 19.67], ['Gin,', 20.97], ['Gin,', 21.99, 21.5], ['Mule', 23.0], ['Shock,', 24.33], ['suenan?', 25.07], ['energética,', 28.18], ['problema.', 30.23], ['despierta,', 34.94], ['amarilla.', 39.22], ['edad,', 44.5], ['Unido,', 47.07], ['jóvenes.', 52.19], ['hora,', 57.52], ['recreo.', 64.45], ['café,', 66.26], ['revuelto', 67.87], ['abuela,', 70.05], ['hueás.', 71.85]];
const find = (txt, at, after, key) => out.find((x) => x.text === txt && x.start >= (after || 0) - 0.01 && Math.abs(x[key] - at) < 1.5);
STARTS.forEach(([txt, at, after]) => { const w = find(txt, at, after, 'start'); if (w) w.start = at; else console.warn('sin inicio:', txt, at); });
ENDS.forEach(([txt, at, after]) => { const w = find(txt, at, after, 'end'); if (w) w.end = at; else console.warn('sin final:', txt, at); });
// "o Tropical Shock": la "o" quedó pegada a "Mule"; va justo antes de "Tropical".
const o = out.find((w) => w.text === 'o' && w.start > 23 && w.start < 24);
if (o) { o.start = 23.4; o.end = 23.52; }
fs.writeFileSync(path.join(ROOT, '_transcript', 'final.json'), JSON.stringify(out, null, 1));
console.log(out.map((w) => `${w.text}[${w.start.toFixed(2)}]`).join(' '));
