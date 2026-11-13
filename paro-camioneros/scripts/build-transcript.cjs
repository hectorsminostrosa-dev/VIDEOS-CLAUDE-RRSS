// Une la transcripción principal de Whisper (con pista de palabras clave) con tres tramos que se saltó
// y que se transcribieron aparte sin pista:
//   a) "de conductores," (25,2 s)   b) "En algunas comunas ... servicios municipales." (78,7 s)
//   c) la frase de Juan Araya: "Hay una anarquía, aparece un cacique por todas partes." (112,2 s)
// Uso: node scripts/build-transcript.cjs  ->  _transcript/final.json (tiempos del audio original)
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const read = (f, off = 0) => JSON.parse(fs.readFileSync(path.join(ROOT, '_transcript', f), 'utf8')).segments.flatMap((s) => s.words).map((w) => ({ text: w.word.trim().replace(/[“”"]/g, ''), start: +(w.start + off).toFixed(3), end: +(w.end + off).toFixed(3) }));
const main = read('narracion-original.json');
const A = read('tramo-a.json', 24.0).filter((w) => w.start >= 25.1 && w.start < 26.0);
const B = read('tramo-b.json', 77.5).filter((w) => w.start >= 78.6 && w.start < 83.25);
const C = read('tramo-c.json', 111.0).filter((w) => w.start >= 112.0 && w.start < 116.0);
let out = main.filter((w) => !(w.start >= 78.5 && w.start < 83.25));
const insertAt = (list, words) => { const i = out.findIndex((w) => w.start > words[0].start); out.splice(i, 0, ...list); };
insertAt(A, A);
insertAt(B, B);
insertAt(C, C);

// Correcciones de escritura (no de contenido): nombres propios y siglas que Whisper no escribe bien.
for (let i = 0; i < out.length; i++) {
  const w = out[i], n = out[i + 1];
  if (w.text === 'la' && n && n.text === 'TAM') { out.splice(i, 2, { text: 'Latam', start: w.start, end: n.end }); continue; }
  if (w.text === 'La' && n && n.text === 'TAM') { out.splice(i, 2, { text: 'Latam', start: w.start, end: n.end }); continue; }
  if (w.text === 'la' && n && n.text === 'salsa') { out.splice(i, 2, { text: 'las', start: w.start, end: w.start + 0.12 }, { text: 'alzas', start: w.start + 0.12, end: n.end }); continue; }
  if (w.text === 'Cast?') w.text = 'Kast?';
  if (w.text === 'Sky') w.text = 'SKY';
  if (w.text === 'conductores') w.text = 'conductores,';
  if (w.text === 'anarquía.') w.text = 'anarquía,';
  if (w.text === 'Aparece') w.text = 'aparece';
  if (w.text === 'Hay' && w.start > 112) w.text = '«Hay';
  if (w.text === 'partes.' && w.start > 115) w.text = 'partes».';
  if (w.text === 'frase.' && w.start > 111) w.text = 'frase:';
  if (w.text === 'elemento.') w.text = 'elemento:';
  if (w.text === 'No' && w.start > 93 && w.start < 94) w.text = 'no';
  if (w.text === 'inevitable.') w.text = 'inevitable:';
}
// Siglas: la voz sigue el guion ("la CNDC y la CNTC" y "el presidente de la CNDC"); Whisper no distingue la D de la T.
const cn = out.filter((w) => /^CNTC/.test(w.text));
if (cn[0]) cn[0].text = 'CNDC';
if (cn[2]) cn[2].text = 'CNDC,';
fs.writeFileSync(path.join(ROOT, '_transcript', 'final.json'), JSON.stringify(out, null, 1));
console.log(out.map((w) => `${w.text}[${w.start.toFixed(2)}]`).join(' '));
