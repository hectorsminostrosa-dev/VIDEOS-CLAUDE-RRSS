// Música original de tensión financiera, sintetizada aquí mismo (sin licencias de terceros).
// Sigue la historia: bloqueo sobrio, datos con pulso, golpe político, ironía final.
// El nivel queda fijo en el archivo: ya viene mezclado para ir bajo la voz.
const fs = require('fs');
const path = require('path');
const SR = 48000;
const TOTAL = 61.4;
const N = Math.floor(TOTAL * SR);
const L = new Float32Array(N), R = new Float32Array(N);
const BPM = 92, BEAT = 60 / BPM, BAR = BEAT * 4;
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 12345;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ramp = (t, a, b) => clamp((t - a) / (b - a));

// Tramos de la historia (segundos de video)
const THREAT = 14.18, POLITICS = 31.28, IRONY = 46.72, VOICE_END = 58.3;

function put(i, l, r) { if (i >= 0 && i < N) { L[i] += l; R[i] += r; } }

// Pad oscuro: acordes menores, dientes de sierra filtrados y levemente desafinados.
const CHORDS = [[38, 50, 53, 57], [34, 46, 50, 53], [31, 43, 46, 50], [33, 45, 49, 52]]; // Rem, Sib, Solm, La
function pad() {
  const lp = [0, 0];
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const bar = Math.floor(t / (BAR * 2)) % CHORDS.length;
    const local = (t % (BAR * 2)) / (BAR * 2);
    const env = Math.min(1, local * 8) * Math.min(1, (1 - local) * 8);
    let a = 0, b = 0;
    CHORDS[bar].forEach((m, k) => {
      const f = hz(m);
      const s = (x) => 2 * (x - Math.floor(x + 0.5));
      a += s(t * f * 1.003 + k * 0.17);
      b += s(t * f * 0.997 + k * 0.41);
    });
    const cut = 0.012 + 0.02 * ramp(t, THREAT, POLITICS) + 0.02 * ramp(t, POLITICS, POLITICS + 2) - 0.022 * ramp(t, IRONY - 1, IRONY + 1);
    lp[0] += cut * (a - lp[0]);
    lp[1] += cut * (b - lp[1]);
    const lvl = 0.32 * env;
    put(i, lp[0] * lvl * 0.25, lp[1] * lvl * 0.25);
  }
}

// Latido grave: entra con los datos y se hace más firme con la crisis política.
function kick(at, gain) {
  const s = Math.floor(at * SR), d = Math.floor(0.42 * SR);
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const f = 44 + 62 * Math.exp(-x * 26);
    const v = Math.sin(2 * Math.PI * f * x + 8 * (1 - Math.exp(-x * 26)) * 0) * Math.exp(-x * 8.5) * gain;
    put(s + j, v, v);
  }
}
// Tictac seco, como un contador o un reloj de bóveda.
function tick(at, gain, pan) {
  const s = Math.floor(at * SR), d = Math.floor(0.05 * SR);
  let prev = 0;
  for (let j = 0; j < d; j++) {
    const w = rnd() * 2 - 1;
    const hp = w - prev; prev = w;
    const v = hp * Math.exp(-j / SR * 130) * gain;
    put(s + j, v * (1 - pan), v * (1 + pan));
  }
}
// Pulsación sutil de bajo en corcheas.
function pluck(at, m, gain, dur = 0.34) {
  const s = Math.floor(at * SR), d = Math.floor(dur * SR), f = hz(m);
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const v = (Math.sin(2 * Math.PI * f * x) + 0.4 * Math.sin(4 * Math.PI * f * x) * Math.exp(-x * 18)) * Math.exp(-x * (5.5 / dur) * 0.6) * Math.min(1, x * 300) * gain;
    put(s + j, v, v);
  }
}
// Golpe grave largo con ruido filtrado: marca el giro político.
function hit(at, gain) {
  const s = Math.floor(at * SR), d = Math.floor(3.4 * SR);
  let lp = 0;
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    lp += 0.03 * ((rnd() * 2 - 1) - lp);
    const v = (Math.sin(2 * Math.PI * (36 + 40 * Math.exp(-x * 9)) * x) * 0.9 + lp * 2.2) * Math.exp(-x * 1.7) * gain;
    put(s + j, v, v);
  }
}
// Campanita tenue, algo desafinada: ironía de los últimos segundos.
function bell(at, m, gain) {
  const s = Math.floor(at * SR), d = Math.floor(1.5 * SR), f = hz(m);
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const v = (Math.sin(2 * Math.PI * f * x) + 0.35 * Math.sin(2 * Math.PI * f * 2.76 * x) * Math.exp(-x * 6)) * Math.exp(-x * 3) * Math.min(1, x * 500) * gain;
    put(s + j, v * 0.8, v * 1.2);
  }
}

pad();
const bass = [38, 34, 31, 33];
for (let b = 0; b * BEAT < VOICE_END + 2; b++) {
  const t = b * BEAT;
  const chord = bass[Math.floor(t / (BAR * 2)) % 4];
  if (t < IRONY) {
    if (t >= 5.7 && b % 2 === 0) kick(t, 0.2 + 0.25 * ramp(t, THREAT, POLITICS) + 0.15 * (t >= POLITICS ? 1 : 0));
    if (t >= THREAT) { pluck(t, chord + 12, 0.1); pluck(t + BEAT / 2, chord + 12, 0.07); }
    if (t >= 2) tick(t + BEAT / 2, 0.05 + 0.05 * ramp(t, THREAT, POLITICS), b % 4 === 1 ? -0.3 : 0.3);
    if (t >= POLITICS) tick(t, 0.09, b % 2 ? 0.25 : -0.25);
  } else {
    // Ironía: se vacía y queda un compás juguetón, un poco torcido.
    if (b % 4 === 0) kick(t, 0.2);
    if (b % 2 === 1) pluck(t, chord + 24, 0.09, 0.22);
    if (b % 8 === 2) bell(t, 74, 0.05);
    if (b % 8 === 6) bell(t, 73, 0.05);
  }
}
hit(POLITICS, 0.55);
hit(35.0, 0.35); // renuncia

// Reverberación simple para dar espacio y quitar lo seco.
function reverb(buf, delays, fb, mixV) {
  const out = new Float32Array(N);
  delays.forEach((ms) => {
    const d = Math.floor(ms * SR / 1000);
    const line = new Float32Array(N);
    for (let i = 0; i < N; i++) { line[i] = buf[i] + (i >= d ? line[i - d] * fb : 0); out[i] += line[i] / delays.length; }
  });
  for (let i = 0; i < N; i++) buf[i] += out[i] * mixV;
}
reverb(L, [47, 71, 103, 149], 0.62, 0.45);
reverb(R, [53, 79, 113, 157], 0.62, 0.45);

// Mezcla: libre al partir, baja mientras hay voz, sube en el cierre y se apaga.
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const BED = Number(process.argv[2] || 0.2);
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const close = BED + (0.5 - BED) * ramp(t, VOICE_END, VOICE_END + 0.5);
  const fade = (1 - ramp(t, TOTAL - 2.1, TOTAL - 0.1)) * ramp(t, 0, 0.25);
  const g = close * fade / peak;
  buf.writeInt16LE(Math.round(clamp(L[i] * g, -1, 1) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(clamp(R[i] * g, -1, 1) * 32767), 46 + i * 4);
}
const outFile = path.join(__dirname, '..', 'assets', 'musica.wav');
fs.writeFileSync(outFile, buf);
console.log('música lista:', outFile, TOTAL + ' s', 'nivel bajo la voz:', BED);
