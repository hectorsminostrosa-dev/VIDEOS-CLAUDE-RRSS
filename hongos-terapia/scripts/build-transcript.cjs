// Ajusta los inicios y finales de Whisper con silencedetect (-40 dB): Whisper alarga la palabra junto a un silencio.
// Uso: node scripts/build-transcript.cjs  ->  _transcript/final.json (tiempos del audio original)
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const j = JSON.parse(fs.readFileSync(path.join(ROOT, '_transcript', 'narracion-original.json'), 'utf8'));
const out = j.segments.flatMap((s) => s.words).map((w) => ({ text: w.word.trim(), start: +w.start.toFixed(3), end: +w.end.toFixed(3) }));

// Coma de lectura: "mejor que una agüita de melisa y manzanilla, no lo hay."
out.forEach((w) => { if (w.text === 'manzanilla') w.text = 'manzanilla,'; });

const STARTS = [['¿Hongos', 0.31], ['Por', 2.29], ['El', 9.88], ['el', 15.6], ['enfocado', 18.04], ['El', 22.92, 22], ['sino', 26.75], ['El', 30.07, 29.5], ['para', 33.78, 33], ['Un', 37.31], ['aunque', 40.57], ['anda', 41.38], ['mejor', 44.0], ['no', 46.09, 45.5], ['¿Tú', 47.44], ['estarías', 47.94], ['a', 49.09, 48.9]];
const ENDS = [['mental?', 1.73], ['mental.', 9.18], ['psilocibina,', 15.08], ['alucinógenos,', 17.48], ['tradicionales.', 22.07], ['microdosis,', 26.39], ['terapeutas.', 29.59], ['emocional.', 36.6], ['Chile,', 40.05, 39], ['aunque', 41.01], ['penas', 43.63], ['manzanilla,', 45.77], ['hay.', 46.59], ['¿Tú', 47.6], ['dispuesto', 48.81]];
const near = (txt, at, after = 0) => out.find((x) => x.text === txt && x.start >= after - 0.01 && Math.abs(x.start - at) < 1.5);
STARTS.forEach(([txt, at, after]) => { const w = near(txt, at, after); if (w) w.start = at; else console.warn('sin inicio:', txt, at); });
ENDS.forEach(([txt, at, after]) => { const w = out.find((x) => x.text === txt && x.start >= (after || 0) - 0.01 && Math.abs(x.end - at) < 1.5); if (w) w.end = at; else console.warn('sin final:', txt, at); });
// Ninguna palabra termina después de que empieza la siguiente.
for (let i = 0; i < out.length - 1; i++) if (out[i].end > out[i + 1].start) out[i].end = out[i + 1].start;
fs.writeFileSync(path.join(ROOT, '_transcript', 'final.json'), JSON.stringify(out, null, 1));
console.log(out.map((w) => `${w.text}[${w.start.toFixed(2)}]`).join(' '));
