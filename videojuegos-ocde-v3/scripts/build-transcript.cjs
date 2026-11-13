// Une las dos transcripciones de Whisper y corrige errores de transcripción (no de la voz).
// La pasada completa se saltó de 27 s a 46 s (los nombres de los jugadores); ese tramo se
// transcribió aparte, desde 25,3 s del audio original.
// Uso: node scripts/build-transcript.cjs  ->  _transcript/final.json (tiempos del audio original)
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, '_transcript', f), 'utf8'));
const words = (j, off = 0) => j.segments.flatMap((s) => s.words).map((w) => ({ text: w.word.trim(), start: +(w.start + off).toFixed(3), end: +(w.end + off).toFixed(3) }));

const full = words(read('narracion-original.json'));
const tramo = words(read('tramo.json'), 25.3);
const cut = full.findIndex((w) => w.text === 'Chile' && w.start > 27);
const resume = full.findIndex((w) => w.text === 'Jugar');
const endTramo = tramo.findIndex((w) => /^respalda/.test(w.text));
// "Aunque ojo, no es por nada que" (7 palabras) quedó en las dos pasadas: se usa la del tramo.
const list = [...full.slice(0, cut - 7), ...tramo.slice(0, endTramo + 1), ...full.slice(resume)];

const FIX = {
  'OCTE,': 'OCDE,', 'chiles': 'Chile se', 'Cryme,': 'Craime,', 'Ponyx,': 'PoniX,', 'GameSkin,': 'GamezK1ng,',
  '-sport,': 'esports,', 'Aunque,': 'Aunque', '1,': '1,',
};
const out = [];
for (let i = 0; i < list.length; i++) {
  const w = { ...list[i] };
  const n = list[i + 1];
  if (w.text === 'Scorpion' && n && n.text === 'Proxy') { w.text = 'Scorpionprocs'; w.end = n.end; i++; }
  else if (w.text === 'e' && n && n.text === '-sport,') { w.text = 'esports,'; w.end = n.end; i++; }
  else if (FIX[w.text]) w.text = FIX[w.text];
  out.push(w);
}
// Inicios reales medidos con silencedetect: Whisper alarga la palabra que sigue a un silencio.
const STARTS = [['Chile', 1.03, 0], ['pero', 2.63], ['Según', 4.47], ['Y', 18.26, 17], ['lo', 21.41, 20], ['Aunque', 25.57], ['Y', 46.14, 45], ['Jugar', 47.94], ['Claro,', 55.93], ['la', 56.62, 56], ['Así', 59.18], ['no', 63.16, 62.5], ['probablemente', 64.04]];
STARTS.forEach(([txt, at, after = 0]) => {
  const w = out.find((x) => x.text === txt && x.start >= after - 0.01 && Math.abs(x.start - at) < 1.2);
  if (w) w.start = at; else console.warn('sin ajuste:', txt, at);
});
fs.writeFileSync(path.join(ROOT, '_transcript', 'final.json'), JSON.stringify(out, null, 1));
console.log(out.map((w) => `${w.text}[${w.start.toFixed(2)}]`).join(' '));
