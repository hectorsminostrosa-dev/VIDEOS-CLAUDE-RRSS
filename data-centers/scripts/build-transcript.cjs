// Genera _transcript/final.json (palabras con tiempos) desde la salida de Whisper, con las correcciones de lo que dice la voz.
// Uso: node scripts/build-transcript.cjs
// Se comparó con una segunda pasada sin el guion como pista (_transcript/sinpista): la voz empieza con "Chile", no "En Chile".
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, '_transcript', 'voz16k.json'), 'utf8'));
let words = raw.segments.flatMap((s) => s.words.map((w) => ({ text: w.word.trim(), start: w.start, end: w.end })));

const fix = (from, to) => {
  for (let i = 0; i <= words.length - from.length; i++) {
    if (from.every((f, k) => words[i + k].text === f)) {
      if (from.length === to.length) { to.forEach((t, k) => (words[i + k].text = t)); return; } // mismo número de palabras: se conservan sus tiempos
      const a = words[i].start, b = words[i + from.length - 1].end;
      const out = to.map((t, k) => ({ text: t, start: +(a + ((b - a) * k) / to.length).toFixed(3), end: +(a + ((b - a) * (k + 1)) / to.length).toFixed(3) }));
      words.splice(i, from.length, ...out);
      return;
    }
  }
  throw new Error('No se encontró: ' + from.join(' '));
};
words.splice(0, 2, { text: 'Chile', start: 0.12, end: words[1].end });
fix(['1', '.000'], ['1.000']);
fix(['Inversión,'], ['inversión,']);
fix(['Desarrollo'], ['desarrollo']);
fix(['Medio', 'Ambiente', 'deberían'], ['medio', 'ambiente', 'deberían']);
fix(['eso'], ['eso,']);
// Puntuación: Whisper corta en oraciones lo que la voz dice de corrido.
fix(['Cerrillos.', 'Para'], ['Cerrillos,', 'para']);
fix(['servidores.', 'Hasta'], ['servidores,', 'hasta']);
fix(['trámites.', 'Dejando'], ['trámites,', 'dejando']);
fix(['máquinas.', 'Mientras'], ['máquinas,', 'mientras']);
fix(['torta.', 'Pero'], ['torta,', 'pero']);
fix(['juntos.', 'Pero'], ['juntos,', 'pero']);
fs.writeFileSync(path.join(ROOT, '_transcript', 'final.json'), JSON.stringify(words, null, 1));
console.log(words.length, 'palabras');
console.log(words.map((w) => w.text).join(' '));
