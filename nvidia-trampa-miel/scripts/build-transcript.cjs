// Genera _transcript/final.json (palabras con tiempos) desde la salida de Whisper, con las correcciones de lo que dice la voz.
// Uso: node scripts/build-transcript.cjs
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, '_transcript', 'narracion-original.json'), 'utf8'));
let words = raw.segments.flatMap((s) => s.words.map((w) => ({ text: w.word.trim(), start: w.start, end: w.end })));

// Correcciones (Whisper oyó mal nombres y palabras; se revisaron tramos sin la pista del guion).
const fix = (from, to) => {
  for (let i = 0; i <= words.length - from.length; i++) {
    if (from.every((f, k) => words[i + k].text === f)) {
      const a = words[i].start, b = words[i + from.length - 1].end;
      const out = to.map((t, k) => ({ text: t, start: +(a + ((b - a) * k) / to.length).toFixed(3), end: +(a + ((b - a) * (k + 1)) / to.length).toFixed(3) }));
      // "trampa de miel": "trampa" conserva su tiempo; "de miel" ocupa el resto.
      words.splice(i, from.length, ...out);
      return;
    }
  }
  throw new Error('No se encontró: ' + from.join(' '));
};
{
  const i = words.findIndex((w) => w.text === 'Daniel?');
  const d = words[i];
  words.splice(i, 1, { text: 'de', start: words[i - 1].end, end: d.start }, { text: 'miel?', start: d.start, end: d.end });
  words[i - 1].text = 'trampa';
}
fix(['estado.'], ['Estado.']);
fix(['NVIDIA', 'acaba'], ['Nvidia', 'acaba']);
fix(['Yen', 'Zhenhuan'], ['Jensen', 'Huang']);
fix(['extra', 'matrimonial'], ['extramatrimonial']);
fix(['mejor', 'refan.'], ['viejo', 'refrán:']);
fix(['Dilletera'], ['Billetera']);
fix(['galan.'], ['galán.']);
fix(['Aliexpress'], ['AliExpress']);
fix(['NVIDIA', 'LTX'], ['NDIVIA', 'LTX']);
fs.writeFileSync(path.join(ROOT, '_transcript', 'final.json'), JSON.stringify(words, null, 1));
console.log(words.length, 'palabras');
console.log(words.map((w) => w.text).join(' '));
