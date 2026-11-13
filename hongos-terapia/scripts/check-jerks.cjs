// Revisor de tirones: mide cuánto cambia la imagen de un cuadro al siguiente en el MP4 y marca los saltos bruscos.
// Un movimiento fluido cambia de forma pareja; un tirón es un cuadro que cambia mucho más que sus vecinos.
// Los cortes de toma (CUTS) se ignoran, porque ahí el cambio es esperado.
// Uso: node scripts/check-jerks.cjs <video.mp4> [umbral]   (umbral por defecto 3: veces el cambio típico de los vecinos)
const { spawn } = require('child_process');
const file = process.argv[2];
const K = Number(process.argv[3] || 3);
const W = 72, H = 128, FS = W * H;
const CUTS = [3.95, 9.63, 15.35, 17.79, 22.67, 25.85, 29.82, 37.06, 40.32, 50.0];
// Momentos con cambios bruscos a propósito (golpes, sellos, aparición de tarjetas grandes), en segundos.
const EVENTS = [5.6, 7.75, 8.15, 10.97, 23.93, 26.05, 27.19, 31.7, 45.84, 46.05];

const ff = spawn('ffmpeg', ['-v', 'error', '-i', file, '-vf', `scale=${W}:${H},format=gray`, '-f', 'rawvideo', '-']);
let buf = Buffer.alloc(0), prev = null;
const diffs = [];
ff.stdout.on('data', (d) => {
  buf = Buffer.concat([buf, d]);
  while (buf.length >= FS) {
    const fr = buf.subarray(0, FS);
    if (prev) { let s = 0; for (let i = 0; i < FS; i++) s += Math.abs(fr[i] - prev[i]); diffs.push(s / FS); }
    prev = Buffer.from(fr);
    buf = buf.subarray(FS);
  }
});
ff.on('close', () => {
  const fps = 60;
  const med = (a) => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
  const near = (t, list, w) => list.some((c) => Math.abs(t - c) < w);
  const flags = [];
  for (let i = 3; i < diffs.length - 3; i++) {
    const t = (i + 1) / fps;
    if (near(t, CUTS, 0.5) || near(t, EVENTS, 0.25) || t > 68.4) continue;
    const around = [diffs[i - 3], diffs[i - 2], diffs[i - 1], diffs[i + 1], diffs[i + 2], diffs[i + 3]];
    const m = Math.max(med(around), 0.15);
    if (diffs[i] > K * m && diffs[i] > 1.0) flags.push({ t: t.toFixed(3), cambio: diffs[i].toFixed(2), vecinos: m.toFixed(2) });
  }
  console.log('cuadros medidos:', diffs.length + 1, '| cambio medio por cuadro:', (diffs.reduce((a, b) => a + b, 0) / diffs.length).toFixed(2));
  console.log(flags.length ? 'posibles tirones:' : 'sin tirones fuera de los cortes y golpes previstos');
  flags.slice(0, 40).forEach((f) => console.log('  ' + f.t + ' s  cambio ' + f.cambio + ' (vecinos ' + f.vecinos + ')'));
});
