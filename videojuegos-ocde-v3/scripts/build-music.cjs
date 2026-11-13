// Música original synthwave / gamer, sintetizada aquí mismo (sin licencias de terceros).
// La menor, 110 BPM, progresión Lam–Fa–Do–Sol. Sigue la historia del video:
// intro con arpegio · datos con bajo en corcheas · campeones con más energía · ciencia más calma ·
// noche (03:00) casi vacía · trofeo triunfal · cierre.
// El nivel queda fijo en el archivo: ya viene mezclado para ir bajo la voz.
// Uso: node scripts/build-music.cjs [nivel]   (nivel bajo la voz, por defecto 0.2)
const fs = require('fs');
const path = require('path');
const SR = 48000;
const TOTAL = 70.0;
const N = Math.floor(TOTAL * SR);
const L = new Float32Array(N), R = new Float32Array(N);
const BPM = 110, BEAT = 60 / BPM, BAR = BEAT * 4;
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 4242;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ramp = (t, a, b) => clamp((t - a) / (b - a));
const saw = (x) => 2 * (x - Math.floor(x + 0.5));
const sq = (x, w = 0.5) => ((x - Math.floor(x)) < w ? 1 : -1);

// Tramos (segundos de video, iguales a los cortes de world.html)
const DATA = 10.4, CHAMPS = 24.5, SCIENCE = 45.35, NIGHT = 58.35, TROPHY = 63.2, VOICE_END = 67.0;
const section = (t) => (t < DATA ? 0 : t < CHAMPS ? 1 : t < SCIENCE ? 2 : t < NIGHT ? 3 : t < TROPHY ? 4 : 5);

// Acordes por compás (2 compases cada uno): Lam, Fa, Do, Sol
const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
const ROOTS = [45, 41, 36, 43];
const chordAt = (t) => Math.floor(t / (BAR * 2)) % 4;
// En el trofeo la progresión sube: Fa–Sol–Lam (resolución épica)
const TROPHY_CHORDS = [[53, 57, 60, 65], [55, 59, 62, 67], [57, 60, 64, 69]];

function put(i, l, r) { if (i >= 0 && i < N) { L[i] += l; R[i] += r; } }

// Pad: dientes de sierra desafinados y filtrados; se abre en campeones y se cierra en la noche.
function pad() {
  const lp = [0, 0];
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    let notes;
    if (t >= TROPHY) notes = TROPHY_CHORDS[Math.min(2, Math.floor((t - TROPHY) / (BAR)))];
    else notes = CHORDS[chordAt(t)];
    let a = 0, b = 0;
    notes.forEach((m, k) => {
      const f = hz(m);
      a += saw(t * f * 1.004 + k * 0.13) + 0.5 * saw(t * f * 0.5 * 0.998);
      b += saw(t * f * 0.996 + k * 0.37) + 0.5 * saw(t * f * 0.5 * 1.002);
    });
    const s = section(t);
    const cut = [0.018, 0.022, 0.04, 0.016, 0.01, 0.05][s];
    lp[0] += cut * (a - lp[0]);
    lp[1] += cut * (b - lp[1]);
    const lvl = [0.2, 0.18, 0.2, 0.2, 0.16, 0.3][s];
    put(i, lp[0] * lvl, lp[1] * lvl);
  }
}

function kick(at, gain) {
  const s = Math.floor(at * SR), d = Math.floor(0.38 * SR);
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const ph = 2 * Math.PI * (48 * x + (110 / 30) * (1 - Math.exp(-x * 30)));
    const v = Math.sin(ph) * Math.exp(-x * 9) * gain;
    put(s + j, v, v);
  }
}
function snare(at, gain) {
  const s = Math.floor(at * SR), d = Math.floor(0.22 * SR);
  let lp = 0, prev = 0;
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const w = rnd() * 2 - 1;
    lp += 0.35 * (w - lp);
    const bp = lp - prev; prev = lp;
    const v = (bp * 1.6 + Math.sin(2 * Math.PI * 190 * x) * 0.35 * Math.exp(-x * 30)) * Math.exp(-x * 16) * gain;
    put(s + j, v * 0.95, v * 1.05);
  }
}
function hat(at, gain, pan) {
  const s = Math.floor(at * SR), d = Math.floor(0.045 * SR);
  let prev = 0;
  for (let j = 0; j < d; j++) {
    const w = rnd() * 2 - 1;
    const hp = w - prev; prev = w;
    const v = hp * Math.exp(-j / SR * 110) * gain;
    put(s + j, v * (1 - pan), v * (1 + pan));
  }
}
// Bajo synth: diente de sierra con filtro que se cierra en cada nota.
function bass(at, m, gain, dur) {
  const s = Math.floor(at * SR), d = Math.floor(dur * SR), f = hz(m);
  let lp = 0;
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const raw = saw(x * f) + 0.6 * Math.sin(2 * Math.PI * f * 0.5 * x);
    lp += (0.03 + 0.12 * Math.exp(-x * 14)) * (raw - lp);
    const env = Math.min(1, x * 400) * Math.exp(-x * 2.2) * Math.min(1, (dur - x) * 60);
    const v = lp * env * gain;
    put(s + j, v, v);
  }
}
// Arpegio de onda cuadrada (sabor a videojuego), suave y con eco.
function blip(at, m, gain, dur, pan) {
  const s = Math.floor(at * SR), d = Math.floor(dur * SR), f = hz(m);
  let lp = 0;
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    lp += 0.25 * (sq(x * f, 0.25) - lp);
    const v = lp * Math.min(1, x * 600) * Math.exp(-x * 9) * gain;
    put(s + j, v * (1 - pan), v * (1 + pan));
  }
}
// Campana brillante para el trofeo.
function bell(at, m, gain) {
  const s = Math.floor(at * SR), d = Math.floor(2.2 * SR), f = hz(m);
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const v = (Math.sin(2 * Math.PI * f * x) + 0.3 * Math.sin(2 * Math.PI * f * 3.01 * x) * Math.exp(-x * 5)) * Math.exp(-x * 2.2) * Math.min(1, x * 500) * gain;
    put(s + j, v * 0.85, v * 1.15);
  }
}
// Subida de ruido (riser) antes de un cambio de tramo, y golpe al llegar.
function riser(end, len, gain) {
  const s = Math.floor((end - len) * SR), d = Math.floor(len * SR);
  let lp = 0;
  for (let j = 0; j < d; j++) {
    const p = j / d;
    lp += (0.02 + 0.3 * p * p) * ((rnd() * 2 - 1) - lp);
    const v = lp * p * p * gain;
    put(s + j, v * 0.9, v * 1.1);
  }
}
function impact(at, gain) {
  const s = Math.floor(at * SR), d = Math.floor(2.4 * SR);
  let lp = 0;
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    lp += 0.05 * ((rnd() * 2 - 1) - lp);
    const v = (Math.sin(2 * Math.PI * (40 + 50 * Math.exp(-x * 10)) * x) + lp * 1.6) * Math.exp(-x * 2.4) * gain;
    put(s + j, v, v);
  }
}

pad();
const STEP = BEAT / 4; // semicorcheas
for (let k = 0; k * STEP < VOICE_END + 3; k++) {
  const t = k * STEP;
  const s = section(t);
  const beatIdx = Math.floor(k / 4), sub = k % 4, inBar = beatIdx % 4;
  const c = chordAt(t);
  const notes = CHORDS[c], root = ROOTS[c];
  if (t >= TROPHY) {
    // Trofeo: golpes amplios en negras, campanas en la tríada, sin arpegio rápido.
    const tc = TROPHY_CHORDS[Math.min(2, Math.floor((t - TROPHY) / BAR))];
    if (sub === 0) kick(t, inBar === 0 ? 0.5 : 0.32);
    if (sub === 0 && inBar % 2 === 1) snare(t, 0.22);
    if (sub === 0 && beatIdx % 2 === 0 && t < VOICE_END + 0.5) bell(t, tc[(beatIdx / 2) % tc.length] + 12, 0.07);
    if (sub % 2 === 0) bass(t, tc[0] - 12, 0.16, STEP * 1.8);
    continue;
  }
  // Arpegio: presente en casi todo, muy bajo en la noche.
  const arpGain = [0.055, 0.045, 0.06, 0.035, 0.022][s];
  const arpNote = notes[[0, 1, 2, 1][sub]] + 12 + (beatIdx % 2 ? 12 : 0);
  if (s !== 3 || sub % 2 === 0) blip(t, arpNote, arpGain, STEP * 1.6, (k % 2 ? 0.35 : -0.35));
  if (s === 0) {
    if (t >= 3.45 && sub === 0) kick(t, 0.28);
    if (t >= 5.75 && sub === 2) hat(t, 0.06, 0.2);
  } else if (s === 1) {
    if (sub === 0) kick(t, 0.38);
    if (sub === 2) hat(t, 0.08, inBar % 2 ? 0.3 : -0.3);
    if (sub % 2 === 0) bass(t, root, 0.2, STEP * 1.7);
  } else if (s === 2) {
    if (sub === 0) kick(t, 0.45);
    if (sub === 0 && inBar % 2 === 1) snare(t, 0.3);
    hat(t, sub % 2 ? 0.05 : 0.08, sub % 2 ? 0.35 : -0.35);
    if (sub % 2 === 0) bass(t, root + (sub === 2 && inBar === 3 ? 12 : 0), 0.24, STEP * 1.7);
    if (sub === 0 && beatIdx % 4 === 0) blip(t, notes[2] + 24, 0.04, BEAT * 1.5, 0);
  } else if (s === 3) {
    // Ciencia: medio tiempo, más aire.
    if (sub === 0 && inBar % 2 === 0) kick(t, 0.3);
    if (sub === 0 && inBar === 2) snare(t, 0.14);
    if (sub === 0) bass(t, root, 0.16, BEAT * 0.9);
  } else if (s === 4) {
    // Noche: solo pad, arpegio tenue y un pulso grave muy suave.
    if (sub === 0 && inBar === 0) kick(t, 0.16);
  }
}
riser(CHAMPS, 1.6, 0.18);
impact(CHAMPS, 0.4);
riser(TROPHY, 2.0, 0.2);
impact(TROPHY, 0.45);

// Reverberación simple para dar espacio.
function reverb(buf, delays, fb, mixV) {
  const out = new Float32Array(N);
  delays.forEach((ms) => {
    const d = Math.floor(ms * SR / 1000);
    const line = new Float32Array(N);
    for (let i = 0; i < N; i++) { line[i] = buf[i] + (i >= d ? line[i - d] * fb : 0); out[i] += line[i] / delays.length; }
  });
  for (let i = 0; i < N; i++) buf[i] += out[i] * mixV;
}
reverb(L, [41, 67, 97, 139], 0.55, 0.35);
reverb(R, [47, 73, 103, 151], 0.55, 0.35);

// Mezcla: baja mientras hay voz, sube en el cierre y se apaga al final.
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
  const fade = (1 - ramp(t, TOTAL - 2.2, TOTAL - 0.1)) * ramp(t, 0, 0.15);
  const g = close * fade / peak;
  buf.writeInt16LE(Math.round(clamp(L[i] * g, -1, 1) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(clamp(R[i] * g, -1, 1) * 32767), 46 + i * 4);
}
const outFile = path.join(__dirname, '..', 'assets', 'musica.wav');
fs.writeFileSync(outFile, buf);
console.log('música lista:', outFile, TOTAL + ' s', 'nivel bajo la voz:', BED);
