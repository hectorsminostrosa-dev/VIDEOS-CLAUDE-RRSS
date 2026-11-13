// Muestra las palabras de una transcripción de Whisper con sus tiempos (más un desfase opcional).
// Uso: node scripts/show-words.cjs _transcript/tramo-a.json 24
const [f, off = '0'] = process.argv.slice(2);
const j = require(require('path').resolve(f));
const o = parseFloat(off);
console.log(j.segments.flatMap((s) => s.words).map((w) => `${w.word.trim()}[${(w.start + o).toFixed(2)}-${(w.end + o).toFixed(2)}]`).join(' '));
