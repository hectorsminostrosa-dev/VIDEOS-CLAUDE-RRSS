// Corrige errores de transcripción de Whisper (no de la voz) y ajusta inicios y finales con silencedetect.
// Uso: node scripts/build-transcript.cjs  ->  _transcript/final.json (tiempos del audio original)
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const j = JSON.parse(fs.readFileSync(path.join(ROOT, '_transcript', 'narracion-original.json'), 'utf8'));
const list = j.segments.flatMap((s) => s.words).map((w) => ({ text: w.word.trim(), start: +w.start.toFixed(3), end: +w.end.toFixed(3) }));

// Whisper oye "redienta" (guion: "revienta"), "molchino" (mall chino) y "servicio de puente(s) a la SEC":
// el guion dice "al SII, la SEC"; se subtitula como el nombre completo del SII.
const FIX = { 'redienta': 'revienta', 'molchino': 'mall chino', 'servicio': 'Servicio', 'puente': 'Impuestos', 'chino.': 'chino.' };
const out = [];
for (let i = 0; i < list.length; i++) {
  const w = { ...list[i] };
  if (w.text === 'a' && list[i - 1] && list[i - 1].text === 'puente') w.text = 'Internos,';
  else if (FIX[w.text]) w.text = FIX[w.text];
  out.push(w);
}
// Inicios y finales reales medidos con silencedetect (-40 dB): Whisper alarga la palabra junto a un silencio.
const STARTS = [['En', 0.4], ['te', 4.68], ['Pero', 8.79], ['organizaciones', 25.87], ['y', 29.52, 29], ['y', 43.28, 42.5], ['Así', 53.38], ['nosotros', 59.44], ['tranquilos.', 60.19]];
const ENDS = [['ley,', 1.28], ['esquina,', 3.79], ['¡pum,', 4.33], ['dinosaurio!', 8.33], ['chino.', 15.12, 14], ['turbios.', 18.53], ['documentados,', 22.29], ['formal,', 25.5], ['fachada', 29.13], ['fiscalizarlos.', 32.39], ['confirman.', 34.09], ['ISP', 42.82], ['SEC,', 46.38, 45], ['Lagos,', 49.48], ['26%.', 52.5], ['SEC,', 58.02, 57], ['municipios,', 59.09], ['nosotros', 59.93], ['tranquilos.', 60.68], ['escombros.', 66.76], ['gratis.', 68.54]];
const near = (txt, at, after = 0) => out.find((x) => x.text === txt && x.start >= after - 0.01 && Math.abs(x.start - at) < 1.5);
STARTS.forEach(([txt, at, after]) => { const w = near(txt, at, after); if (w) w.start = at; else console.warn('sin inicio:', txt, at); });
ENDS.forEach(([txt, at, after]) => { const w = out.find((x) => x.text === txt && x.start >= (after || 0) - 0.01 && Math.abs(x.end - at) < 1.5); if (w) w.end = at; else console.warn('sin final:', txt, at); });
fs.writeFileSync(path.join(ROOT, '_transcript', 'final.json'), JSON.stringify(out, null, 1));
console.log(out.map((w) => `${w.text}[${w.start.toFixed(2)}]`).join(' '));
