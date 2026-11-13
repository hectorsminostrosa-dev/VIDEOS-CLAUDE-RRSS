// Música original cálida y acústica, sintetizada aquí mismo (sin licencias de terceros).
// Re mayor, 84 BPM. Piano suave, guitara pulsada (Karplus-Strong), pad cálido, bajo redondo y percusión mínima.
// Sigue los tramos del video: gancho íntimo · noticia con pulso tranquilo · estudio con arpegio que avanza ·
// hito luminoso · remate juguetón (campanitas) · pregunta final y acorde de cierre.
// Uso: node scripts/build-music.cjs [nivel]   (nivel bajo la voz, por defecto 0.1)
const fs = require('fs');
const path = require('path');
const SR = 48000;
const TOTAL = 51.0;
const N = Math.floor(TOTAL * SR);
const L = new Float32Array(N), R = new Float32Array(N);
const BPM = 84, BEAT = 60 / BPM, BAR = BEAT * 4;
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 4242;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ramp = (t, a, b) => clamp((t - a) / (b - a));

// Tramos (segundos de video, iguales a los cortes de world.html)
const NEWS = 9.63, STUDY = 22.67, HITO = 37.06, JOKE = 40.32, CTA = 47.19, VOICE_END = 50.0;
const section = (t) => (t < NEWS ? 0 : t < STUDY ? 1 : t < HITO ? 2 : t < JOKE ? 3 : t < CTA ? 4 : 5);

// Pentatónica de Re mayor (Re Mi Fa# La Si)
const PENTA = [62, 64, 66, 69, 71];
const scale = (deg) => PENTA[((deg % 5) + 5) % 5] + 12 * Math.floor(deg / 5);
// Acordes por 2 compases: Re7M, Si m7, Sol7M, La sus
const CHORDS = [[50, 57, 61, 66], [47, 54, 57, 62], [43, 50, 54, 59], [45, 52, 55, 62]];
const chordAt = (t) => Math.floor(t / (BAR * 2)) % 4;

function put(i, l, r) { if (i >= 0 && i < N) { L[i] += l; R[i] += r; } }

// Piano suave: parciales con caída propia y un ataque redondeado.
function piano(at, m, gain, pan, len = 3.2) {
  const f = hz(m), s = Math.floor(at * SR), d = Math.floor(len * SR);
  const parts = [[1, 1, 1.1], [2, 0.42, 2.0], [3, 0.16, 3.2], [4, 0.07, 4.5], [5.02, 0.03, 6]];
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    let v = 0;
    parts.forEach(([k, a, dec]) => { v += a * Math.sin(2 * Math.PI * f * k * x) * Math.exp(-x * dec); });
    v *= Math.min(1, x * 160) * gain * (1 - x / len);
    put(s + j, v * (1 - pan), v * (1 + pan));
  }
}
// Guitarra pulsada (Karplus-Strong) con el ruido inicial suavizado: menos brillante, más madera.
function pluck(at, m, gain, pan, decay = 0.995) {
  const f = hz(m), per = Math.max(2, Math.round(SR / f));
  const buf = new Float32Array(per);
  let p = 0;
  for (let k = 0; k < per; k++) { p += 0.5 * ((rnd() * 2 - 1) - p); buf[k] = p; }
  const s = Math.floor(at * SR), d = Math.floor(2.4 * SR);
  let idx = 0, prev = 0;
  for (let j = 0; j < d; j++) {
    const cur = buf[idx];
    const nv = decay * 0.5 * (cur + prev);
    prev = cur;
    buf[idx] = nv;
    idx = (idx + 1) % per;
    const v = cur * gain * Math.min(1, j / 60);
    put(s + j, v * (1 - pan), v * (1 + pan));
  }
}
// Campanita (para el remate): seno agudo con un parcial metálico y caída rápida.
function bell(at, m, gain, pan) {
  const f = hz(m), s = Math.floor(at * SR), d = Math.floor(1.4 * SR);
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const v = (Math.sin(2 * Math.PI * f * x) + 0.35 * Math.sin(2 * Math.PI * f * 2.76 * x) * Math.exp(-x * 6)) * Math.exp(-x * 3.2) * Math.min(1, x * 400) * gain;
    put(s + j, v * (1 - pan), v * (1 + pan));
  }
}
function kick(at, gain) {
  const s = Math.floor(at * SR), d = Math.floor(0.35 * SR);
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const ph = 2 * Math.PI * (44 * x + (70 / 28) * (1 - Math.exp(-x * 28)));
    const v = Math.sin(ph) * Math.exp(-x * 10) * gain;
    put(s + j, v, v);
  }
}
function shaker(at, gain, pan) {
  const s = Math.floor(at * SR), d = Math.floor(0.07 * SR);
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
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const raw = Math.sin(2 * Math.PI * f * x) + 0.18 * Math.sin(4 * Math.PI * f * x);
    const env = Math.min(1, x * 120) * Math.exp(-x * 1.6) * Math.min(1, (dur - x) * 30);
    put(s + j, raw * env * gain, raw * env * gain);
  }
}
// Pad cálido (senos y triángulos desafinados, filtrado), sube en el hito y baja en el remate.
function pad() {
  const lp = [0, 0];
  const tri = (x) => 1 - 4 * Math.abs(x - Math.floor(x + 0.5));
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const notes = CHORDS[chordAt(t)];
    let a = 0, b = 0;
    notes.forEach((m, k) => {
      const f = hz(m);
      a += tri(t * f * 1.002 + k * 0.21) + 0.5 * Math.sin(2 * Math.PI * f * 0.5 * t);
      b += tri(t * f * 0.998 + k * 0.43) + 0.5 * Math.sin(2 * Math.PI * f * 0.5 * t + 0.7);
    });
    const s = section(t);
    const cut = [0.02, 0.025, 0.03, 0.05, 0.02, 0.025][s];
    lp[0] += cut * (a - lp[0]);
    lp[1] += cut * (b - lp[1]);
    let lvl = [0.1, 0.09, 0.09, 0.15, 0.06, 0.11][s];
    if (s === 3) lvl = 0.09 + 0.06 * ramp(t, HITO, HITO + 1.2);
    lvl *= ramp(t, 0, 1.2);
    put(i, lp[0] * lvl, lp[1] * lvl);
  }
}

pad();
const PHRASE = [2, null, 3, 4, null, 3, 2, 1, 0, null, 1, 2, 4, null, 3, null];
const STEP = BEAT / 2; // corcheas
for (let k = 0; k * STEP < VOICE_END; k++) {
  const t = k * STEP;
  const s = section(t);
  const inBar = k % 8, bar = Math.floor(k / 8);
  const deg = PHRASE[k % 16];
  const pan = (k % 2 ? 0.25 : -0.25);
  const chord = CHORDS[chordAt(t)], root = chord[0];
  if (s === 0) {
    // Gancho: piano íntimo, pocas notas, bajo largo.
    if (deg !== null && inBar % 2 === 0) piano(t, scale(deg), 0.11, pan);
    if (inBar === 0) bass(t, root - 12, 0.16, BAR * 0.95);
  } else if (s === 1) {
    // Noticia: guitarra en corcheas suaves, piano en los tiempos fuertes, pulso tranquilo.
    pluck(t, chord[[0, 2, 1, 3, 2, 1, 3, 2][inBar]], 0.1, pan);
    if (deg !== null && inBar % 4 === 0) piano(t, scale(deg), 0.1, -pan);
    if (inBar % 4 === 0) kick(t, 0.16);
    if (inBar === 0) bass(t, root - 12, 0.17, BAR * 0.9);
  } else if (s === 2) {
    // Estudio: arpegio que avanza, bombo en negras muy bajo y shaker.
    const arp = [0, 2, 4, 2, 1, 3, 4, 3][inBar] + (bar % 2 ? 2 : 0);
    pluck(t, scale(arp) - 12, 0.1, pan);
    if (deg !== null && inBar % 2 === 0) piano(t, scale(deg) + (bar % 2 ? 12 : 0), 0.07, -pan, 2.4);
    if (inBar % 2 === 0) kick(t, inBar === 0 ? 0.2 : 0.13);
    shaker(t + STEP / 2, 0.035, -pan);
    if (inBar % 4 === 0) bass(t, root - 12, 0.16, BEAT * 1.8);
  } else if (s === 3) {
    // Hito: acordes abiertos de piano.
    if (inBar === 0 || inBar === 4) chord.forEach((m, i) => piano(t + i * 0.03, m + 12, 0.07, (i - 1.5) * 0.2, 3.6));
    if (deg !== null) pluck(t, scale(deg) + 12, 0.07, pan);
    if (inBar === 0) bass(t, root - 12, 0.18, BAR);
  } else if (s === 4) {
    // Remate: liviano y juguetón, campanitas en staccato y guitarra corta.
    if (deg !== null && inBar % 2 === 0) bell(t, scale(deg) + 12, 0.07, pan);
    if (inBar % 2 === 1) pluck(t, chord[inBar % 4 === 1 ? 1 : 2], 0.08, -pan, 0.985);
    if (inBar === 0) bass(t, root - 12, 0.13, BEAT);
    if (inBar === 4) bass(t, root - 5, 0.11, BEAT);
  } else if (s === 5) {
    // Pregunta final: piano que se abre.
    if (deg !== null && inBar % 2 === 0) piano(t, scale(deg) + 12, 0.08, pan, 2.6);
    if (inBar === 0) bass(t, root - 12, 0.15, BAR);
  }
}
// Acorde final de Re mayor abierto, en el último segundo.
[50, 57, 62, 66, 69, 74].forEach((m, i) => piano(VOICE_END - 0.4 + i * 0.05, m, 0.08, (i - 2.5) * 0.12, 2.2));

function reverb(buf, delays, fb, mixV) {
  const out = new Float32Array(N);
  delays.forEach((ms) => {
    const d = Math.floor(ms * SR / 1000);
    const line = new Float32Array(N);
    for (let i = 0; i < N; i++) { line[i] = buf[i] + (i >= d ? line[i - d] * fb : 0); out[i] += line[i] / delays.length; }
  });
  for (let i = 0; i < N; i++) buf[i] += out[i] * mixV;
}
reverb(L, [43, 71, 101, 149], 0.6, 0.45);
reverb(R, [47, 77, 107, 157], 0.6, 0.45);

let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const BED = Number(process.argv[2] || 0.1);
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const close = BED + (0.3 - BED) * ramp(t, VOICE_END, VOICE_END + 0.2);
  const fade = (1 - ramp(t, TOTAL - 0.9, TOTAL - 0.05)) * ramp(t, 0, 0.1);
  const g = close * fade / peak;
  buf.writeInt16LE(Math.round(clamp(L[i] * g, -1, 1) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(clamp(R[i] * g, -1, 1) * 32767), 46 + i * 4);
}
const outFile = path.join(__dirname, '..', 'assets', 'musica.wav');
fs.writeFileSync(outFile, buf);
console.log('música lista:', outFile, TOTAL + ' s', 'nivel bajo la voz:', BED);
