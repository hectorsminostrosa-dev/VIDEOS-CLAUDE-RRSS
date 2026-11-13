// Música original para "Nvidia y la trampa de miel", sintetizada aquí mismo (sin licencias de terceros).
// Dos climas, como pide el guion:
//  1) Suspenso de espías (0 a 46,9 s): Re menor, 104 BPM. Bajo ostinato con aire de blues, vibráfono y voz suave tipo saxo,
//     escobillas y chasquidos. Cambia por tramo: miel (sensual) · Jensen (melodía) · alarma (tensión con cuerdas en staccato) ·
//     expediente (investigación) · globo (pulso de datos) · correo (piano eléctrico, sin batería) · bolsa (latido y caída) ·
//     junta (vuelve la tensión). Se corta en seco en 46,9 s, junto al platillo.
//  2) Remate cómico (47,25 s al final): Fa mayor, 126 BPM, "um-pa" con bajo pizzicato, fagot travieso y glockenspiel;
//     acentos en la billetera, la caja, la tarjeta radiactiva y un "¡ta-da!" final en el pato.
// Uso: node scripts/build-music.cjs [nivel]   (nivel bajo la voz, por defecto 0.16: unos 14 dB bajo la narración)
const fs = require('fs');
const path = require('path');
const SR = 48000;
const TOTAL = 70.3;
const N = Math.floor(TOTAL * SR);
const L = new Float32Array(N), R = new Float32Array(N);
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 5090;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ramp = (t, a, b) => clamp((t - a) / (b - a));
const saw = (x) => 2 * (x - Math.floor(x + 0.5));
const put = (i, l, r) => { if (i >= 0 && i < N) { L[i] += l; R[i] += r; } };

// Tramos (segundos de video, iguales a los cortes de world.html)
const T = { jensen: 5.5, alarm: 9.88, crack: 13.4, folder: 15.74, globe: 25.26, email: 33.92, market: 39.24, suelo: 42.2, audit: 42.46, cut: 46.9, comedy: 47.25, wallet: 53.76, box: 57.5, reveal: 61.1, pato: 68.1, voiceEnd: 69.06 };
const sec = (t) => (t < T.jensen ? 0 : t < T.alarm ? 1 : t < T.folder ? 2 : t < T.globe ? 3 : t < T.email ? 4 : t < T.market ? 5 : t < T.audit ? 6 : t < T.cut ? 7 : 8);

/* ---------- Instrumentos ---------- */
function bassNote(at, m, gain, dur) {
  const s = Math.floor(at * SR), d = Math.floor(dur * SR), f = hz(m);
  let lp = 0;
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const raw = Math.sin(2 * Math.PI * f * x) + 0.35 * saw(x * f);
    lp += 0.09 * (raw - lp);
    const env = Math.min(1, x * 250) * Math.exp(-x * 3.0) * Math.min(1, (dur - x) * 40);
    put(s + j, lp * env * gain, lp * env * gain);
  }
}
function vibe(at, m, gain, dur = 1.8, pan = 0) {
  const s = Math.floor(at * SR), d = Math.floor(dur * SR), f = hz(m);
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const v = (Math.sin(2 * Math.PI * f * x) + 0.22 * Math.sin(2 * Math.PI * 4 * f * x) * Math.exp(-x * 7)) *
      Math.exp(-x * 1.9) * (1 + 0.28 * Math.sin(2 * Math.PI * 5.2 * x)) * Math.min(1, x * 500) * Math.min(1, (dur - x) * 20) * gain;
    put(s + j, v * (1 - pan), v * (1 + pan));
  }
}
// Voz suave tipo saxo: diente de sierra filtrado con vibrato que entra tarde.
function lead(at, m, gain, dur, pan = 0.1) {
  const s = Math.floor(at * SR), d = Math.floor((dur + 0.12) * SR), f = hz(m);
  let ph = 0, lp = 0, lp2 = 0;
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const vib = 1 + 0.007 * Math.sin(2 * Math.PI * 5.2 * x) * Math.min(1, x / 0.3);
    ph += (f * vib) / SR;
    const raw = saw(ph) + 0.4 * Math.sin(2 * Math.PI * ph);
    const cut = 0.07 + 0.05 * Math.exp(-x * 4);
    lp += cut * (raw - lp); lp2 += cut * (lp - lp2);
    const env = Math.min(1, x / 0.05) * (x < dur ? 0.85 + 0.15 * Math.exp(-x * 3) : Math.max(0, 1 - (x - dur) / 0.12));
    const v = lp2 * env * gain;
    put(s + j, v * (1 - pan), v * (1 + pan));
  }
}
function hat(at, gain, pan = 0.2, decay = 70) {
  const s = Math.floor(at * SR), d = Math.floor(0.12 * SR);
  let prev = 0;
  for (let j = 0; j < d; j++) {
    const w = rnd() * 2 - 1, hp = w - prev; prev = w;
    const v = hp * Math.exp(-(j / SR) * decay) * gain;
    put(s + j, v * (1 - pan), v * (1 + pan));
  }
}
function brush(at, gain) {
  const s = Math.floor(at * SR), d = Math.floor(0.3 * SR);
  let lp = 0;
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    lp += 0.35 * (rnd() * 2 - 1 - lp);
    const v = lp * Math.min(1, x * 120) * Math.exp(-x * 11) * gain;
    put(s + j, v * 0.9, v * 1.1);
  }
}
function snap(at, gain) {
  const s = Math.floor(at * SR), d = Math.floor(0.05 * SR);
  let prev = 0;
  for (let j = 0; j < d; j++) {
    const x = j / SR, w = rnd() * 2 - 1, hp = w - prev; prev = w;
    const v = (hp * 0.8 + Math.sin(2 * Math.PI * 2100 * x) * 0.4) * Math.exp(-x * 90) * gain;
    put(s + j, v * 1.15, v * 0.85);
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
// Cuerdas en staccato: tres sierras desafinadas, filtradas y cortas.
function stab(at, m, gain, dur = 0.12, pan = 0) {
  const s = Math.floor(at * SR), d = Math.floor((dur + 0.08) * SR), f = hz(m);
  let lp = 0;
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const raw = saw(f * x) + saw(f * 1.006 * x) + saw(f * 0.994 * x);
    lp += 0.12 * (raw / 3 - lp);
    const env = Math.min(1, x * 300) * (x < dur ? 1 : Math.max(0, 1 - (x - dur) / 0.08)) * Math.exp(-x * 6);
    const v = lp * env * gain;
    put(s + j, v * (1 - pan), v * (1 + pan));
  }
}
// Cuerda pulsada (Karplus-Strong)
function pluck(at, m, gain, pan, decay = 0.996, len = 2.0) {
  const f = hz(m), per = Math.max(2, Math.round(SR / f));
  const buf = new Float32Array(per);
  for (let k = 0; k < per; k++) buf[k] = rnd() * 2 - 1;
  const s = Math.floor(at * SR), d = Math.floor(len * SR);
  let idx = 0, prev = 0;
  for (let j = 0; j < d; j++) {
    const cur = buf[idx];
    const nv = decay * 0.5 * (cur + prev);
    prev = cur; buf[idx] = nv; idx = (idx + 1) % per;
    const v = cur * gain * Math.min(1, j / 40);
    put(s + j, v * (1 - pan), v * (1 + pan));
  }
}
function epiano(at, m, gain, dur, pan = 0) {
  const s = Math.floor(at * SR), d = Math.floor(dur * SR), f = hz(m);
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const v = (Math.sin(2 * Math.PI * f * x) + 0.3 * Math.sin(2 * Math.PI * 2 * f * x) * Math.exp(-x * 3) + 0.1 * Math.sin(2 * Math.PI * 7 * f * x) * Math.exp(-x * 20)) *
      Math.exp(-x * 1.1) * Math.min(1, x * 400) * Math.min(1, (dur - x) * 10) * (1 + 0.12 * Math.sin(2 * Math.PI * 4.5 * x)) * gain;
    put(s + j, v * (1 - pan), v * (1 + pan));
  }
}
function glock(at, m, gain, pan = 0) {
  const s = Math.floor(at * SR), d = Math.floor(2.2 * SR), f = hz(m);
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const v = (Math.sin(2 * Math.PI * f * x) + 0.35 * Math.sin(2 * Math.PI * 2.76 * f * x) * Math.exp(-x * 6) + 0.15 * Math.sin(2 * Math.PI * 5.4 * f * x) * Math.exp(-x * 14)) *
      Math.exp(-x * 2.4) * Math.min(1, x * 2000) * gain;
    put(s + j, v * (1 - pan), v * (1 + pan));
  }
}
// Fagot travieso: pulso estrecho filtrado, staccato.
function bassoon(at, m, gain, dur, pan = -0.15) {
  const s = Math.floor(at * SR), d = Math.floor((dur + 0.05) * SR), f = hz(m);
  let ph = 0, lp = 0, lp2 = 0;
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    ph += (f * (1 + 0.004 * Math.sin(2 * Math.PI * 6 * x))) / SR;
    const fr = ph - Math.floor(ph);
    const raw = (fr < 0.3 ? 1 : -0.43) + 0.3 * saw(ph);
    lp += 0.1 * (raw - lp); lp2 += 0.14 * (lp - lp2);
    const env = Math.min(1, x / 0.015) * (x < dur ? 1 - 0.3 * x / dur : Math.max(0, 1 - (x - dur) / 0.05));
    const v = lp2 * env * gain;
    put(s + j, v * (1 - pan), v * (1 + pan));
  }
}
function sweepDown(at, dur, gain) {
  const s = Math.floor(at * SR), d = Math.floor(dur * SR);
  let ph = 0, lp = 0;
  for (let j = 0; j < d; j++) {
    const x = j / SR, k = x / dur;
    const f = 700 * Math.pow(55 / 700, k);
    ph += f / SR;
    lp += 0.2 * (saw(ph) * 0.5 + Math.sin(2 * Math.PI * ph) - lp);
    const v = lp * Math.sin(Math.PI * Math.min(1, k * 1.1)) * gain;
    put(s + j, v, v);
  }
}
function boom(at, gain, len = 1.6) {
  const s = Math.floor(at * SR), d = Math.floor(len * SR);
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const v = Math.sin(2 * Math.PI * (38 + 30 * Math.exp(-x * 6)) * x) * Math.exp(-x * 2.6) * Math.min(1, x * 300) * gain;
    put(s + j, v, v);
  }
}
function riser(at, dur, gain) {
  const s = Math.floor(at * SR), d = Math.floor(dur * SR);
  let lp = 0;
  for (let j = 0; j < d; j++) {
    const k = j / d;
    lp += (0.02 + 0.3 * k * k) * (rnd() * 2 - 1 - lp);
    const v = lp * k * k * gain;
    put(s + j, v * 0.9, v * 1.1);
  }
}
// Theremin cómico (tarjeta radiactiva): seno con glissando y vibrato ancho.
function theremin(at, m0, m1, dur, gain) {
  const s = Math.floor(at * SR), d = Math.floor(dur * SR);
  let ph = 0;
  for (let j = 0; j < d; j++) {
    const x = j / SR, k = x / dur;
    const m = m0 + (m1 - m0) * (k < 0.4 ? k / 0.4 : 1) + 0.35 * Math.sin(2 * Math.PI * 6 * x);
    ph += hz(m) / SR;
    const v = Math.sin(2 * Math.PI * ph) * Math.min(1, x * 20) * Math.min(1, (dur - x) * 3) * gain;
    put(s + j, v * 0.85, v * 1.15);
  }
}

/* ---------- 1. SUSPENSO DE ESPÍAS (Re menor, 104 BPM) ---------- */
const B1 = 60 / 104, BAR1 = B1 * 4;
const ROOTS = [38, 34, 31, 33]; // Re, Si bemol, Sol, La (bajo)
const TONES = [[0, 3, 7, 10], [0, 4, 7, 11], [0, 3, 7, 10], [0, 4, 7, 10]];
const chordAt = (t) => Math.floor(t / (BAR1 * 2)) % 4;
const OST = [0, 0, 3, 0, 5, 0, 6, 5]; // bajo con aire de blues
// Pad de acordes (sube en el correo, baja en la alarma)
{
  const lp = [0, 0];
  for (let i = 0; i < Math.floor(T.cut * SR); i++) {
    const t = i / SR, s = sec(t), ci = chordAt(t);
    let a = 0, b = 0;
    TONES[ci].forEach((o, k) => { const f = hz(ROOTS[ci] + 24 + o); a += saw(t * f * 1.003 + k * 0.2); b += saw(t * f * 0.997 + k * 0.4); });
    const cut = [0.01, 0.01, 0.014, 0.008, 0.012, 0.012, 0.006, 0.012][s];
    lp[0] += cut * (a - lp[0]); lp[1] += cut * (b - lp[1]);
    const lvl = [0.08, 0.09, 0.07, 0.08, 0.07, 0.15, 0.1, 0.08][s] * ramp(t, 0, 0.6);
    put(i, lp[0] * lvl, lp[1] * lvl);
  }
}
const STEP = B1 / 2;
for (let k = 0; k * STEP < T.cut - 0.01; k++) {
  const t = k * STEP, s = sec(t), inBar = k % 8, ci = chordAt(t), root = ROOTS[ci];
  const ost = root + OST[inBar];
  const pan = k % 2 ? 0.25 : -0.25;
  const tone = (n, oct) => root + 12 * oct + TONES[ci][((n % 4) + 4) % 4] + 12 * Math.floor(n / 4);
  if (s === 0 || s === 1) {
    bassNote(t, ost, 0.15, STEP * 0.85);
    if (inBar === 2 || inBar === 6) brush(t, 0.05);
    hat(t + (inBar % 2 ? 0.04 : 0), 0.012, pan);
    if (s === 1 && (inBar === 2 || inBar === 6)) snap(t, 0.07);
  } else if (s === 2) {
    // Alarma: tensión, bombo en negras, cuerdas en semicorcheas.
    bassNote(t, ost, 0.17, STEP * 0.8);
    if (inBar % 2 === 0) kick(t, 0.26);
    hat(t, 0.02, pan, 50);
    stab(t, tone(k % 3, 2), 0.06, 0.09, pan);
    stab(t + STEP / 2, tone((k + 1) % 3, 2), 0.045, 0.07, -pan);
  } else if (s === 3) {
    // Expediente: investigación, bajo y reloj de semicorcheas suaves.
    bassNote(t, ost, 0.14, STEP * 0.8);
    hat(t, 0.01, pan, 90); hat(t + STEP / 2, 0.007, -pan, 90);
    if (inBar === 0) kick(t, 0.2);
    if (inBar === 0 || inBar === 5) pluck(t, tone(inBar === 0 ? 2 : 3, 3), 0.11, pan, 0.997);
  } else if (s === 4) {
    // Globo: pulso de datos.
    pluck(t, tone(k % 4, 3), 0.08, pan, 0.993, 0.8);
    pluck(t + STEP / 2, tone((k + 2) % 4, 3), 0.06, -pan, 0.993, 0.8);
    if (inBar % 2 === 0) kick(t, 0.24);
    hat(t + STEP / 2, 0.016, -pan);
    if (inBar % 2 === 0) bassNote(t, root, 0.16, B1 * 0.9);
  } else if (s === 5) {
    // Correo: piano eléctrico, sin batería.
    if (inBar === 0) [0, 1, 2, 3].forEach((n) => epiano(t + n * 0.02, tone(n, 2), 0.05, BAR1 * 0.95, (n - 1.5) * 0.12));
    if (inBar === 0) bassNote(t, root, 0.12, BAR1 * 0.9);
  } else if (s === 6) {
    // Bolsa: latido.
    if (inBar === 0) kick(t, 0.32);
    if (inBar === 1) kick(t, 0.22);
    if (inBar === 0) bassNote(t, root - 12 + 12, 0.1, BAR1 * 0.5);
  } else if (s === 7) {
    // Junta: vuelve la tensión y crece hasta el corte.
    const g = 0.6 + 0.4 * ramp(t, T.audit, T.cut);
    bassNote(t, ost, 0.16 * g, STEP * 0.8);
    hat(t, 0.014 * g, pan, 60); hat(t + STEP / 2, 0.01 * g, -pan, 80);
    stab(t, tone(k % 3, 2), 0.045 * g, 0.08, pan);
    if (inBar % 2 === 0) kick(t, 0.22 * g);
  }
}
// Vibráfono (miel) y melodía tipo saxo (Jensen), en el pulso de 104 BPM.
[[0, 57, 1.5], [1.5, 62, 0.5], [2, 65, 1], [3, 64, 2], [5, 62, 0.5], [5.5, 60, 0.5], [6, 62, 1], [7, 57, 2.5]].forEach(([b, m, du], i) => vibe(b * B1 + 0.02, m + 12, 0.075, du * B1 + 1.2, i % 2 ? 0.2 : -0.2));
[[10, 58, 1], [11, 62, 0.5], [11.5, 65, 0.5], [12, 67, 1], [13, 65, 1], [14, 64, 2], [16, 61, 1], [16.9, 57, 0.9]].forEach(([b, m, du]) => lead(b * B1, m, 0.09, du * B1 * 0.92));
riser(T.alarm - 0.9, 0.9, 0.12);
boom(T.crack, 0.22);
sweepDown(41.6, 0.65, 0.12);
boom(T.suelo, 0.28);
riser(T.cut - 0.95, 0.93, 0.1);

/* ---------- 2. REMATE CÓMICO (Fa mayor, 126 BPM) ---------- */
const B2 = 60 / 126, BAR2 = B2 * 4, C0 = T.comedy;
const PROG = [[41, [0, 4, 7]], [36, [0, 4, 7, 10]], [41, [0, 4, 7]], [36, [0, 4, 7, 10]], [46, [0, 4, 7]], [41, [0, 4, 7]], [36, [0, 4, 7, 10]], [41, [0, 4, 7]]];
// Melodía del fagot por compás (corcheas; null = silencio)
const MEL = [
  [53, null, 57, null, 60, 57, 53, null], [55, null, 58, 55, 52, null, 48, null],
  [53, null, 57, null, 60, null, 65, 64], [64, 60, 55, null, 52, null, 55, null],
  [58, null, 62, null, 65, 62, 58, null], [57, null, 60, 57, 53, null, 57, null],
  [55, 57, 58, 60, 62, null, 60, 58], [57, null, 53, null, 48, null, null, null],
];
for (let k = 0; C0 + k * (B2 / 2) < T.pato + 0.3; k++) {
  const t = C0 + k * (B2 / 2), bar = Math.floor(k / 8), inBar = k % 8;
  const [root, tones] = PROG[bar % 8];
  const pan = inBar % 2 ? 0.2 : -0.2;
  // Um-pa: bajo en 1 y 3 (fundamental y quinta), acorde corto en 2 y 4.
  if (inBar === 0) pluck(t, root - 12, 0.22, 0, 0.985, 0.6);
  if (inBar === 4) pluck(t, root - 5, 0.18, 0, 0.985, 0.6);
  if (inBar === 2 || inBar === 6) tones.forEach((o, n) => pluck(t + n * 0.008, root + 12 + o, 0.06, (n - 1) * 0.2, 0.975, 0.35));
  if (inBar % 2 === 1) hat(t, 0.008, pan, 120);
  // Fagot: se calla un poco donde la voz es más densa (cada 4 compases descansa uno).
  const note = MEL[bar % 8][inBar];
  if (note !== null && bar % 4 !== 3) bassoon(t, note - 12, 0.085, B2 * 0.38, -0.15);
}
// Acentos de glockenspiel en los cambios de toma
glock(T.wallet, 77, 0.07, 0.2); glock(T.wallet + 0.12, 81, 0.06, -0.2);
[72, 76, 79, 84].forEach((m, i) => glock(T.box + i * 0.1, m, 0.05, (i - 1.5) * 0.15));
theremin(T.reveal - 0.05, 72, 79, 1.9, 0.05);
[77, 81, 84].forEach((m, i) => glock(T.reveal + 0.1 + i * 0.12, m, 0.045, (i - 1) * 0.2));
// "¡Ta-da!" final justo después de la palabra "pato" (termina en 68,48 s): Do7 → Fa, con glockenspiel y bajo largo.
const TADA = T.pato + 0.75;
[48, 52, 55, 58].forEach((m, i) => stab(TADA - 0.3, m + 12, 0.07, 0.16, (i - 1.5) * 0.2));
[53, 57, 60, 65].forEach((m, i) => stab(TADA, m + 12, 0.09, 0.5, (i - 1.5) * 0.2));
pluck(TADA, 29, 0.35, 0, 0.997, 2.2);
[77, 81, 84, 89].forEach((m, i) => glock(TADA + i * 0.07, m, 0.07, (i - 1.5) * 0.2));
kick(TADA, 0.3);

/* ---------- Mezcla ---------- */
function reverb(buf, delays, fb, mixV) {
  const out = new Float32Array(N);
  delays.forEach((ms) => {
    const d = Math.floor((ms * SR) / 1000);
    const line = new Float32Array(N);
    for (let i = 0; i < N; i++) { line[i] = buf[i] + (i >= d ? line[i - d] * fb : 0); out[i] += line[i] / delays.length; }
  });
  for (let i = 0; i < N; i++) buf[i] += out[i] * mixV;
}
reverb(L, [43, 71, 101, 149], 0.5, 0.35);
reverb(R, [47, 77, 107, 157], 0.5, 0.35);

let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const BED = Number(process.argv[2] || 0.16);
const COMEDY = 1.7; // el remate cómico es más liviano: se sube para quedar al mismo nivel que el suspenso
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  // Corte en seco con el platillo (incluida la cola de reverberación) y entrada del remate cómico.
  const gate = t < T.cut - 0.02 ? 1 : t < T.cut ? (T.cut - t) / 0.02 : t < C0 - 0.03 ? 0 : 1;
  const close = BED + (0.32 - BED) * ramp(t, T.voiceEnd, T.voiceEnd + 0.25);
  const fade = (1 - ramp(t, TOTAL - 1.0, TOTAL - 0.05)) * ramp(t, 0, 0.08);
  const g = (gate * close * fade * (t >= C0 - 0.03 ? COMEDY : 1)) / peak;
  buf.writeInt16LE(Math.round(clamp(L[i] * g, -1, 1) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(clamp(R[i] * g, -1, 1) * 32767), 46 + i * 4);
}
const outFile = path.join(__dirname, '..', 'assets', 'musica.wav');
fs.writeFileSync(outFile, buf);
console.log('música lista:', outFile, TOTAL + ' s', 'nivel bajo la voz:', BED);
