// Música original con aire chino, sintetizada aquí mismo (sin licencias de terceros).
// Mi menor pentatónica (Mi Sol La Si Re), 100 BPM. Cuerda pulsada tipo guzheng (Karplus-Strong) con notas de
// adorno, bloque de madera, gong suave, pad y bajo. Sigue los tramos del video:
// gancho juguetón · 3 ejes oscuro y escaso · datos con pulso firme · remate liviano · terremoto casi en silencio ·
// inauguración festiva con gong · cierre.
// Uso: node scripts/build-music.cjs [nivel]   (nivel bajo la voz, por defecto 0.1)
const fs = require('fs');
const path = require('path');
const SR = 48000;
const TOTAL = 71.6;
const N = Math.floor(TOTAL * SR);
const L = new Float32Array(N), R = new Float32Array(N);
const BPM = 100, BEAT = 60 / BPM, BAR = BEAT * 4;
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 8086;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ramp = (t, a, b) => clamp((t - a) / (b - a));
const saw = (x) => 2 * (x - Math.floor(x + 0.5));

// Tramos (segundos de video, iguales a los cortes de world.html)
const EJES = 15.35, DATOS = 32.63, REMATE = 53.03, SISMO = 60.77, INAUG = 63.99, VOICE_END = 68.6;
const section = (t) => (t < EJES ? 0 : t < DATOS ? 1 : t < REMATE ? 2 : t < SISMO ? 3 : t < INAUG ? 4 : 5);

// Escala pentatónica de Mi menor, en varias octavas
const PENTA = [64, 67, 69, 71, 74];
const scale = (deg) => PENTA[((deg % 5) + 5) % 5] + 12 * Math.floor(deg / 5);
// Acordes por 2 compases: Mim, Do, Sol, Re
const CHORDS = [[52, 59, 64, 67], [48, 55, 60, 64], [43, 50, 55, 59], [50, 57, 62, 66]];
const chordAt = (t) => Math.floor(t / (BAR * 2)) % 4;

function put(i, l, r) { if (i >= 0 && i < N) { L[i] += l; R[i] += r; } }

// Cuerda pulsada (Karplus-Strong): brillante al ataque, se apaga sola.
function pluck(at, m, gain, pan, decay = 0.996) {
  const f = hz(m), per = Math.max(2, Math.round(SR / f));
  const buf = new Float32Array(per);
  for (let k = 0; k < per; k++) buf[k] = rnd() * 2 - 1;
  const s = Math.floor(at * SR), d = Math.floor(2.6 * SR);
  let idx = 0, prev = 0;
  for (let j = 0; j < d; j++) {
    const cur = buf[idx];
    const nv = decay * 0.5 * (cur + prev);
    prev = cur;
    buf[idx] = nv;
    idx = (idx + 1) % per;
    const v = cur * gain * Math.min(1, j / 40);
    put(s + j, v * (1 - pan), v * (1 + pan));
  }
}
// Nota con adorno: una nota de paso muy breve un tono abajo, como el deslizamiento del guzheng.
function grace(at, m, gain, pan) {
  pluck(at - 0.07, m - 2, gain * 0.45, pan);
  pluck(at, m, gain, pan);
}
function woodblock(at, gain, high) {
  const s = Math.floor(at * SR), d = Math.floor(0.12 * SR);
  const f1 = high ? 1250 : 880, f2 = f1 * 1.52;
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const v = (Math.sin(2 * Math.PI * f1 * x) + 0.4 * Math.sin(2 * Math.PI * f2 * x)) * Math.exp(-x * 55) * gain;
    put(s + j, v * 1.1, v * 0.9);
  }
}
// Gong suave: parciales inarmónicos que crecen un instante y decaen lento.
function gong(at, base, gain, len = 5) {
  const s = Math.floor(at * SR), d = Math.floor(len * SR);
  const parts = [[1, 1], [1.47, 0.6], [2.09, 0.45], [2.76, 0.3], [3.41, 0.22], [4.17, 0.15]];
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    let v = 0;
    parts.forEach(([k, a], n) => { v += a * Math.sin(2 * Math.PI * base * k * (1 - 0.004 * Math.min(1, x)) * x + n) * Math.exp(-x * (0.6 + n * 0.35)); });
    v *= Math.min(1, x * 30) * gain * (1 - x / len);
    put(s + j, v * 0.95, v * 1.05);
  }
}
function kick(at, gain) {
  const s = Math.floor(at * SR), d = Math.floor(0.38 * SR);
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const ph = 2 * Math.PI * (46 * x + (100 / 30) * (1 - Math.exp(-x * 30)));
    const v = Math.sin(ph) * Math.exp(-x * 9) * gain;
    put(s + j, v, v);
  }
}
function shaker(at, gain, pan) {
  const s = Math.floor(at * SR), d = Math.floor(0.06 * SR);
  let prev = 0;
  for (let j = 0; j < d; j++) {
    const w = rnd() * 2 - 1;
    const hp = w - prev; prev = w;
    const v = hp * Math.sin(Math.PI * j / d) * gain;
    put(s + j, v * (1 - pan), v * (1 + pan));
  }
}
function bass(at, m, gain, dur) {
  const s = Math.floor(at * SR), d = Math.floor(dur * SR), f = hz(m);
  let lp = 0;
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const raw = Math.sin(2 * Math.PI * f * x) + 0.3 * saw(x * f);
    lp += 0.08 * (raw - lp);
    const env = Math.min(1, x * 300) * Math.exp(-x * 2.5) * Math.min(1, (dur - x) * 50);
    put(s + j, lp * env * gain, lp * env * gain);
  }
}
// Pad cálido de fondo: se apaga en el terremoto.
function pad() {
  const lp = [0, 0];
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const notes = CHORDS[chordAt(t)];
    let a = 0, b = 0;
    notes.forEach((m, k) => {
      const f = hz(m);
      a += saw(t * f * 1.003 + k * 0.21);
      b += saw(t * f * 0.997 + k * 0.43);
    });
    const s = section(t);
    const cut = [0.012, 0.008, 0.014, 0.012, 0.004, 0.02][s];
    lp[0] += cut * (a - lp[0]);
    lp[1] += cut * (b - lp[1]);
    let lvl = [0.12, 0.14, 0.13, 0.1, 0.0, 0.16][s];
    if (s === 4) lvl = 0.1 * (1 - ramp(t, SISMO, SISMO + 0.4));
    put(i, lp[0] * lvl, lp[1] * lvl);
  }
}

pad();
// Frase melódica pentatónica (grados de la escala), repetida con variaciones por tramo.
const PHRASE = [0, 2, 3, 4, 3, 2, 1, 0, 2, 4, 5, 4, 3, 2, 3, null];
const STEP = BEAT / 2; // corcheas
for (let k = 0; k * STEP < VOICE_END + 3; k++) {
  const t = k * STEP;
  const s = section(t);
  const inBar = k % 8, bar = Math.floor(k / 8);
  const deg = PHRASE[k % 16];
  const pan = (k % 2 ? 0.3 : -0.3);
  const root = CHORDS[chordAt(t)][0];
  if (s === 0) {
    // Gancho: melodía completa con adornos, bloque de madera a contratiempo.
    if (deg !== null) (inBar === 0 ? grace : pluck)(t, scale(deg), 0.16, pan);
    if (inBar % 2 === 1) woodblock(t, 0.05, inBar === 7);
    if (inBar % 4 === 0 && t > 0.5) kick(t, 0.25);
    if (inBar % 4 === 0) bass(t, root - 12, 0.18, BEAT * 1.8);
  } else if (s === 1) {
    // 3 ejes: más grave y escaso, notas sueltas y un pulso lento.
    if (inBar % 4 === 0 && deg !== null) pluck(t, scale(deg) - 12, 0.15, pan, 0.997);
    if (inBar === 0) kick(t, 0.3);
    if (inBar === 0) bass(t, root - 12, 0.2, BAR * 0.9);
    if (inBar === 6) woodblock(t, 0.035, false);
  } else if (s === 2) {
    // Datos: arpegio pentatónico firme en corcheas, bombo en negras, shaker.
    const arp = [0, 2, 4, 2, 1, 3, 4, 3][inBar] + (bar % 2 ? 5 : 0);
    pluck(t, scale(arp) - 12, 0.12, pan);
    if (inBar % 2 === 0) kick(t, inBar === 0 ? 0.32 : 0.22);
    shaker(t + STEP / 2, 0.05, -pan);
    if (inBar % 2 === 0) bass(t, root - 12, 0.17, BEAT * 0.9);
  } else if (s === 3) {
    // Remate: liviano y juguetón, notas cortas en staccato.
    if (deg !== null && inBar % 2 === 0) pluck(t, scale(deg) + 12, 0.13, pan, 0.99);
    if (inBar % 2 === 1) woodblock(t, 0.06, inBar % 4 === 3);
    if (inBar === 0) bass(t, root - 12, 0.14, BEAT);
  } else if (s === 5 && t < VOICE_END + 0.6) {
    // Inauguración: melodía arriba, más bloque de madera y bombo.
    if (deg !== null) (inBar === 0 ? grace : pluck)(t, scale(deg) + 12, 0.14, pan);
    if (inBar % 2 === 1) woodblock(t, 0.05, true);
    if (inBar % 2 === 0) kick(t, 0.26);
    if (inBar % 4 === 0) bass(t, root - 12, 0.18, BEAT * 1.8);
  }
}
gong(0.0, 68, 0.12, 4);
gong(EJES, 62, 0.16, 5);
gong(INAUG, 74, 0.2, 6);
gong(VOICE_END, 66, 0.18, 3);
// Acorde final pentatónico pulsado
[52, 59, 64, 67, 71].forEach((m, i) => pluck(VOICE_END + 0.02 + i * 0.06, m, 0.12, (i - 2) * 0.15, 0.998));

function reverb(buf, delays, fb, mixV) {
  const out = new Float32Array(N);
  delays.forEach((ms) => {
    const d = Math.floor(ms * SR / 1000);
    const line = new Float32Array(N);
    for (let i = 0; i < N; i++) { line[i] = buf[i] + (i >= d ? line[i - d] * fb : 0); out[i] += line[i] / delays.length; }
  });
  for (let i = 0; i < N; i++) buf[i] += out[i] * mixV;
}
reverb(L, [43, 71, 101, 149], 0.55, 0.4);
reverb(R, [47, 77, 107, 157], 0.55, 0.4);

let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const BED = Number(process.argv[2] || 0.1);
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const close = BED + (0.45 - BED) * ramp(t, VOICE_END, VOICE_END + 0.4);
  const fade = (1 - ramp(t, TOTAL - 2.2, TOTAL - 0.1)) * ramp(t, 0, 0.1);
  const g = close * fade / peak;
  buf.writeInt16LE(Math.round(clamp(L[i] * g, -1, 1) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(clamp(R[i] * g, -1, 1) * 32767), 46 + i * 4);
}
const outFile = path.join(__dirname, '..', 'assets', 'musica.wav');
fs.writeFileSync(outFile, buf);
console.log('música lista:', outFile, TOTAL + ' s', 'nivel bajo la voz:', BED);
