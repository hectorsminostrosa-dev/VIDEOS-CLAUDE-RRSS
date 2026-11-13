// Música incidental original para "Bebidas energéticas en jóvenes chilenos", sintetizada aquí mismo (sin licencias de terceros).
// No es una canción pareja: sigue lo que pasa en pantalla, tramo por tramo (tiempos de video, iguales a world.html):
//  A  0,0  desayuno: cajita de música somnolienta (Do mayor); la lata cae con una nota "equivocada".
//  B  5,85 la lata reemplaza el desayuno: la melodía se desinfla; "ojo al dato" = dos notas de aviso.
//  C 10,75 contador de cafeína: latido que se acelera de 70 a 165 pulsaciones y pizzicato que sube; golpe en "505".
//  D 19,95 bar: bossa de lounge; cada trago enciende un arpegio de vibráfono.
//  E 28,28 "esconden otro problema": el lounge se agria y se apaga.
//  F 30,4  borrachera despierta: acordes mareados (afinación que se balancea) con un tic-tic rápido y despierto.
//  G 36,26 corazón con arritmia y motor de micro que tose y se ahoga.
//  H 39,48 Congreso: serio, Re menor, timbal y redoble suave de marcha.
//  I 47,5  urgencias: pitidos de monitor que se desordenan (arritmia) y vuelven a ordenarse.
//  J 52,9  tres latas y el examen: pizzicato en puntillas que se acelera hasta temblar; se corta con el timbre.
//  K 64,75 la abuela: vals cálido de guitarra en Sol mayor, con remate final.
// Uso: node scripts/build-music.cjs
const fs = require('fs');
const path = require('path');
const SR = 48000;
const TOTAL = 75.0;
const N = Math.floor(TOTAL * SR);
const L = new Float32Array(N), R = new Float32Array(N);
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 7331;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ramp = (t, a, b) => clamp((t - a) / (b - a));
const saw = (x) => 2 * (x - Math.floor(x + 0.5));
const put = (i, l, r) => { if (i >= 0 && i < N) { L[i] += l; R[i] += r; } };
const pan2 = (v, p) => [v * Math.min(1, 1 - p), v * Math.min(1, 1 + p)];

const T = { can: 0.55, B: 5.85, ojo: 9.56, C: 10.75, hit: 14.6, D: 19.95, E: 28.28, F: 30.4, stamp: 33.66, G: 36.26, micro: 37.85, H: 39.48, cong: 41.1, globe: 44.75, I: 47.5, J: 52.9, bell: 63.54, K: 64.85, end: 71.8 };

/* ---------- Instrumentos ---------- */
// Cuerda pulsada (Karplus-Strong): pizzicato, contrabajo y guitarra.
function pluck(at, m, gain, pan = 0, decay = 0.996, len = 2.0, bright = 0.5) {
  const f = hz(m), per = Math.max(2, Math.round(SR / f));
  const buf = new Float32Array(per);
  let lp = 0;
  for (let k = 0; k < per; k++) { lp += bright * (rnd() * 2 - 1 - lp); buf[k] = lp; }
  const s = Math.floor(at * SR), d = Math.floor(len * SR);
  let idx = 0, prev = 0;
  for (let j = 0; j < d; j++) {
    const cur = buf[idx];
    const nv = decay * 0.5 * (cur + prev);
    prev = cur; buf[idx] = nv; idx = (idx + 1) % per;
    const v = cur * gain * Math.min(1, j / 60) * Math.min(1, (d - j) / 2000) / Math.max(0.25, bright);
    put(s + j, ...pan2(v, pan));
  }
}
// Cajita de música / celesta
function box(at, m, gain, pan = 0, len = 2.4) {
  const s = Math.floor(at * SR), d = Math.floor(len * SR), f = hz(m);
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const v = (Math.sin(2 * Math.PI * f * x) + 0.3 * Math.sin(2 * Math.PI * 3.0 * f * x) * Math.exp(-x * 9) + 0.12 * Math.sin(2 * Math.PI * 6.3 * f * x) * Math.exp(-x * 22)) *
      Math.exp(-x * 2.6) * Math.min(1, x * 1500) * Math.min(1, (len - x) * 20) * gain;
    put(s + j, ...pan2(v, pan));
  }
}
// Vibráfono (wob = mareo: la afinación se balancea)
function vibe(at, m, gain, dur = 1.8, pan = 0, wob = 0) {
  const s = Math.floor(at * SR), d = Math.floor(dur * SR);
  let ph = 0;
  for (let j = 0; j < d; j++) {
    const x = j / SR, tt = at + x;
    ph += hz(m + wob * Math.sin(2 * Math.PI * 0.7 * tt)) / SR;
    const v = (Math.sin(2 * Math.PI * ph) + 0.2 * Math.sin(2 * Math.PI * 4 * ph) * Math.exp(-x * 7)) *
      Math.exp(-x * 1.7) * (1 + 0.25 * Math.sin(2 * Math.PI * 5.2 * x)) * Math.min(1, x * 500) * Math.min(1, (dur - x) * 20) * gain;
    put(s + j, ...pan2(v, pan));
  }
}
// Piano eléctrico suave
function epiano(at, m, gain, dur, pan = 0, wob = 0) {
  const s = Math.floor(at * SR), d = Math.floor(dur * SR);
  let ph = 0;
  for (let j = 0; j < d; j++) {
    const x = j / SR, tt = at + x;
    ph += hz(m + wob * Math.sin(2 * Math.PI * 0.7 * tt + 1)) / SR;
    const v = (Math.sin(2 * Math.PI * ph + 0.9 * Math.exp(-x * 5) * Math.sin(2 * Math.PI * ph)) + 0.12 * Math.sin(2 * Math.PI * 7 * ph) * Math.exp(-x * 25)) *
      Math.exp(-x * 1.3) * Math.min(1, x * 300) * Math.min(1, (dur - x) * 12) * gain;
    put(s + j, ...pan2(v, pan));
  }
}
// Latido: golpe grave y redondo
function thump(at, gain, f0 = 52) {
  const s = Math.floor(at * SR), d = Math.floor(0.3 * SR);
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const ph = 2 * Math.PI * (f0 * x + (70 / 28) * (1 - Math.exp(-x * 28)));
    const v = Math.sin(ph) * Math.exp(-x * 13) * Math.min(1, x * 800) * gain;
    put(s + j, v, v);
  }
}
const beat = (at, g) => { thump(at, g); thump(at + 0.13, g * 0.6, 46); }; // "lub-dub"
// Timbal
function timp(at, m, gain, len = 1.6) {
  const s = Math.floor(at * SR), d = Math.floor(len * SR), f = hz(m);
  let lp = 0;
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    lp += 0.06 * (rnd() * 2 - 1 - lp);
    const v = (Math.sin(2 * Math.PI * f * x * (1 + 0.03 * Math.exp(-x * 20))) + 0.4 * Math.sin(2 * Math.PI * 1.5 * f * x) * Math.exp(-x * 5) + lp * 2.5 * Math.exp(-x * 30)) *
      Math.exp(-x * 2.4) * Math.min(1, x * 600) * gain;
    put(s + j, v, v);
  }
}
function noiseHit(at, gain, decay, cut, pan = 0, len = 0.25, hp = false) {
  const s = Math.floor(at * SR), d = Math.floor(len * SR);
  let lp = 0;
  for (let j = 0; j < d; j++) {
    const x = j / SR, w = rnd() * 2 - 1;
    lp += cut * (w - lp);
    const v = (hp ? w - lp : lp) * Math.min(1, x * 900) * Math.exp(-x * decay) * gain;
    put(s + j, ...pan2(v, pan));
  }
}
const shaker = (at, g, pan) => noiseHit(at, g, 45, 0.5, pan, 0.12, true);
const tick = (at, g, pan) => noiseHit(at, g, 120, 0.6, pan, 0.05, true);
const snare = (at, g) => { noiseHit(at, g, 28, 0.35, 0.1, 0.2, true); thump(at, g * 0.5, 150); };
function wood(at, m, gain, pan = 0) {
  const s = Math.floor(at * SR), d = Math.floor(0.12 * SR), f = hz(m);
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const v = (Math.sin(2 * Math.PI * f * x) + 0.4 * Math.sin(2 * Math.PI * 2.4 * f * x)) * Math.exp(-x * 55) * Math.min(1, x * 3000) * gain;
    put(s + j, ...pan2(v, pan));
  }
}
// Cuerdas: sierras desafinadas muy filtradas; trem = trémolo nervioso; gliss = sube de tono.
function strings(at, notes, gain, dur, o = {}) {
  const s = Math.floor(at * SR), d = Math.floor(dur * SR);
  const att = o.att || 0.5, rel = o.rel || 0.6, cut = o.cut || 0.035;
  const ph = notes.map(() => [rnd(), rnd(), rnd()]);
  let l1 = 0, l2 = 0, r1 = 0, r2 = 0;
  for (let j = 0; j < d; j++) {
    const x = j / SR, k = x / dur;
    let a = 0, b = 0;
    notes.forEach((m, n) => {
      const f = hz(m + (o.gliss || 0) * k);
      ph[n][0] += f * 1.004 / SR; ph[n][1] += f * 0.996 / SR; ph[n][2] += f / SR;
      a += saw(ph[n][0]) + 0.6 * saw(ph[n][2]); b += saw(ph[n][1]) + 0.6 * saw(ph[n][2]);
    });
    l1 += cut * (a - l1); l2 += cut * (l1 - l2); r1 += cut * (b - r1); r2 += cut * (r1 - r2);
    const tr = o.trem ? 0.55 + 0.45 * Math.sin(2 * Math.PI * o.trem * x) : 1;
    const env = Math.min(1, x / att) * Math.min(1, (dur - x) / rel) * (o.cresc ? 0.35 + 0.65 * k : 1) * tr * gain / Math.sqrt(notes.length);
    put(s + j, l2 * env, r2 * env);
  }
}
function beep(at, gain, f = 988, len = 0.09) {
  const s = Math.floor(at * SR), d = Math.floor(len * SR);
  for (let j = 0; j < d; j++) {
    const x = j / SR;
    const v = Math.sin(2 * Math.PI * f * x) * Math.min(1, x * 400) * Math.min(1, (len - x) * 400) * gain;
    put(s + j, v * 0.9, v * 1.1);
  }
}
// Motor de micro: zumbido grave que tose (se entrecorta) y se ahoga bajando de tono.
function engine(at, dur, gain) {
  const s = Math.floor(at * SR), d = Math.floor(dur * SR);
  let ph = 0, lp = 0, chop = 0;
  for (let j = 0; j < d; j++) {
    const x = j / SR, k = x / dur;
    const f = 58 * (1 + 0.25 * Math.sin(2 * Math.PI * 1.7 * x)) * (k > 0.72 ? 1 - 0.55 * (k - 0.72) / 0.28 : 1);
    ph += f / SR;
    chop += f * 0.5 / SR;
    const put1 = (chop - Math.floor(chop)) < 0.55 ? 1 : 0.25;
    lp += 0.07 * (saw(ph) + 0.5 * saw(ph * 2.01) + (rnd() - 0.5) * 0.8 - lp);
    const v = lp * put1 * Math.min(1, x * 30) * Math.min(1, (dur - x) * 6) * gain;
    put(s + j, v, v);
  }
}

/* ---------- A. Desayuno (Do mayor, 84) ---------- */
{
  const b = 60 / 84;
  [[0, 76], [1, 79], [2, 84], [3, 79], [4, 81], [5, 79], [6, 76]].forEach(([n, m], i) => box(0.05 + n * b, m, 0.11, i % 2 ? 0.25 : -0.25));
  [[0, 48], [2, 43], [4, 41], [6, 43]].forEach(([n, m]) => pluck(0.05 + n * b, m, 0.26, 0, 0.994, 1.4, 0.3));
  // La lata cae: nota grave "equivocada" (Re bemol) que ensucia la mañana.
  timp(T.can, 37, 0.3, 1.4);
  box(T.can + 0.02, 85, 0.06, 0.1);
}
/* ---------- B. La lata reemplaza el desayuno ---------- */
{
  // La misma melodía se desinfla: baja por semitonos y se frena.
  let t = T.B + 0.1, gap = 0.36;
  [84, 83, 81, 80, 78, 76, 73, 72].forEach((m, i) => { box(t, m, 0.1 - i * 0.006, i % 2 ? 0.25 : -0.25, 2.0); t += gap; gap *= 1.09; });
  [[T.B + 0.1, 45], [T.B + 1.6, 44], [T.B + 3.0, 43]].forEach(([at, m]) => pluck(at, m, 0.24, 0, 0.994, 1.4, 0.3));
  // "Pero ojo al dato": dos notas de aviso.
  pluck(T.ojo, 43, 0.3, 0, 0.99, 0.6, 0.45); pluck(T.ojo + 0.4, 44, 0.32, 0, 0.99, 0.7, 0.45);
  wood(T.ojo, 79, 0.07, 0.3); wood(T.ojo + 0.4, 80, 0.08, -0.3);
}
/* ---------- C. Contador de cafeína: latido que se acelera ---------- */
{
  let t = T.C + 0.05, i = 0;
  while (t < T.D - 0.35) {
    const k = ramp(t, T.C, T.hit);
    const bpm = 70 + 95 * k * k;
    const g = t < T.hit ? 0.3 + 0.2 * k : 0.42;
    beat(t, g);
    if (t < T.hit - 0.15) { pluck(t, 48 + i, 0.14 + 0.1 * k, i % 2 ? 0.3 : -0.3, 0.985, 0.5, 0.5); if (k > 0.35) pluck(t + 30 / bpm, 60 + i, 0.08, i % 2 ? -0.3 : 0.3, 0.98, 0.3, 0.6); }
    t += 60 / bpm; i++;
  }
  // "505": golpe con acorde tenso.
  timp(T.hit, 36, 0.4, 2.0);
  [60, 63, 67, 74].forEach((m, n) => vibe(T.hit + n * 0.015, m, 0.085, 2.6, (n - 1.5) * 0.25));
  // "Superando con creces...": trémolo con tritono que crece y se corta.
  strings(16.2, [36, 42, 48], 0.55, T.D - 0.2 - 16.2, { trem: 11, cresc: true, att: 0.4, rel: 0.08, cut: 0.05 });
  strings(17.6, [66, 72], 0.2, T.D - 0.2 - 17.6, { trem: 13, cresc: true, att: 0.5, rel: 0.08, gliss: 2, cut: 0.06 });
}
/* ---------- D y E. Bar: bossa de lounge ---------- */
{
  const b = 60 / 126, e = b / 2;
  const CH = [[38, [53, 57, 60, 64]], [43, [53, 57, 59, 64]], [36, [52, 55, 59, 62]], [45, [49, 55, 58, 64]]]; // Rem9 · Sol13 · Domaj9 · La7b9
  const BOSSA = [0, 3, 6, 10, 13]; // clave de bossa en semicorcheas
  for (let k = 0; T.D + k * e < T.E - 0.02; k++) {
    const t = T.D + k * e, bar = Math.floor(k / 8), inBar = k % 8;
    const [root, tones] = CH[bar % 4];
    shaker(t, inBar % 2 ? 0.035 : 0.022, inBar % 2 ? 0.3 : -0.3);
    if (inBar === 0) pluck(t, root, 0.3, 0, 0.993, 0.9, 0.3);
    if (inBar === 3) pluck(t, root + 7, 0.22, 0, 0.993, 0.5, 0.3);
    if (inBar === 4) pluck(t, root + 7, 0.26, 0, 0.993, 0.8, 0.3);
    if (inBar === 7) pluck(t, root, 0.2, 0, 0.993, 0.4, 0.3);
    if (BOSSA.includes((k % 16))) tones.forEach((m, n) => epiano(t + n * 0.006, m, 0.035, 0.5, (n - 1.5) * 0.2));
    if (inBar === 2 || inBar === 6) wood(t, 84, 0.03, 0.4);
  }
  // Cada trago: arpegio de vibráfono, cada vez más arriba.
  [[20.1, [62, 65, 69, 72]], [21.28, [64, 67, 71, 74]], [22.28, [65, 69, 72, 76]], [23.46, [67, 71, 74, 79]]].forEach(([at, ns], q) => ns.forEach((m, n) => vibe(at + n * 0.07, m, 0.075, 1.4, q % 2 ? 0.3 : -0.3)));
  // "¿Te suenan?": dos notas en pregunta.
  box(24.46, 81, 0.08, 0.2, 1.2); box(24.7, 86, 0.09, -0.2, 1.6);
  // "Esconden otro problema": acorde disminuido que se queda colgando.
  [50, 53, 56, 59].forEach((m, n) => epiano(T.E + n * 0.03, m, 0.075, 2.3, (n - 1.5) * 0.2));
  pluck(T.E, 32, 0.34, 0, 0.996, 2.0, 0.25);
  pluck(29.6, 31, 0.3, 0, 0.996, 1.2, 0.25);
}
/* ---------- F. Borrachera despierta: mareado y despierto a la vez ---------- */
{
  const CH = [[38, [53, 57, 60, 64]], [37, [53, 56, 59, 63]], [36, [52, 55, 59, 62]], [35, [51, 54, 57, 62]]];
  const step = (T.G - T.F) / 4;
  CH.forEach(([root, tones], q) => {
    const t = T.F + q * step;
    tones.forEach((m, n) => { epiano(t + n * 0.05, m, 0.06, step * 1.05, (n - 1.5) * 0.25, 0.45); vibe(t + 0.4 + n * 0.11, m + 12, 0.035, 1.4, (1.5 - n) * 0.3, 0.6); });
    pluck(t, root, 0.3, 0, 0.996, step, 0.25);
  });
  // Tic-tic rápido: los ojos bien abiertos.
  for (let t = T.F; t < T.G - 0.05; t += 0.118) tick(t, 0.022 + 0.012 * Math.sin(t * 5), Math.sin(t * 9) * 0.5);
  // Sello "borrachera despierta".
  timp(T.stamp, 33, 0.34, 1.6);
}
/* ---------- G. Corazón con arritmia y motor de micro ---------- */
{
  [36.3, 36.6, 36.86, 37.3, 37.48, 37.74].forEach((t, i) => beat(t, 0.5 - (i % 2) * 0.08));
  engine(T.micro, 1.55, 0.8);
  [38.0, 38.32, 38.58, 38.98].forEach((t) => thump(t, 0.4, 60));
}
/* ---------- H. Congreso: serio (Re menor) ---------- */
{
  epiano(T.H, 38, 0.2, 2.2); epiano(T.H, 50, 0.12, 2.2);
  strings(T.H, [50, 57, 62], 0.4, 1.9, { att: 0.5, rel: 0.5 });
  timp(T.cong - 0.3, 38, 0.2, 0.5); timp(T.cong - 0.15, 38, 0.26, 0.5); timp(T.cong, 38, 0.42, 2.0);
  const PR = [[T.cong, [50, 53, 57, 62], 38], [42.3, [46, 53, 58, 62], 34], [43.5, [43, 50, 55, 58], 31], [T.globe, [45, 52, 57, 61], 33]];
  PR.forEach(([at, ns, bass], q) => {
    const dur = (q < 3 ? PR[q + 1][0] : T.I - 0.2) - at;
    strings(at, ns, 0.5, dur + 0.5, { att: 0.35, rel: 0.6, cut: 0.04 });
    pluck(at, bass, 0.34, 0, 0.997, dur, 0.22);
  });
  // Redoble de marcha, suave.
  const b = 60 / 100;
  for (let t = T.cong; t < T.globe - 0.1; t += b) { snare(t, 0.05); snare(t + b * 0.5, 0.03); snare(t + b * 0.75, 0.03); }
  // Canadá y Reino Unido: dos campanitas.
  box(45.82, 81, 0.09, -0.4, 1.8); box(46.66, 85, 0.09, 0.4, 1.8);
}
/* ---------- I. Urgencias: monitor ---------- */
{
  strings(T.I - 0.2, [43, 50, 58, 62], 0.42, 3.0, { att: 0.6, rel: 0.8, cut: 0.03 });
  strings(50.2, [45, 52, 55, 61], 0.42, 2.6, { att: 0.6, rel: 1.2, cut: 0.03 });
  pluck(T.I, 31, 0.3, 0, 0.997, 2.5, 0.22); pluck(50.2, 33, 0.3, 0, 0.997, 2.4, 0.22);
  [47.6, 48.2, 48.8, 49.0, 49.17, 49.34, 49.52, 49.95, 50.1, 50.6, 50.72, 51.3, 51.9, 52.5].forEach((t) => beep(t, 0.05));
}
/* ---------- J. Tres latas y el examen: en puntillas, cada vez más rápido ---------- */
{
  const LINE = [45, 48, 52, 51, 50, 53, 57, 56, 45, 48, 52, 55, 57, 56, 52, 51];
  let t = T.J + 0.25, i = 0;
  while (t < 57.7) {
    pluck(t, LINE[i % 16], 0.3, i % 2 ? 0.2 : -0.2, 0.975, 0.35, 0.45);
    wood(t + 0.01, 76, 0.03, i % 2 ? -0.4 : 0.4); // reloj: "a última hora"
    t += 60 / (108 + 3 * i) ; i++;
  }
  // Una, dos, tres latas.
  [[54.54, 72], [54.8, 76], [55.1, 80]].forEach(([at, m], n) => { box(at, m, 0.1, (n - 1) * 0.4, 1.4); pluck(at, m - 12, 0.16, (n - 1) * 0.4, 0.985, 0.5, 0.6); });
  // "Piénsalo": una sola nota grave, con aire alrededor.
  pluck(58.16, 40, 0.4, 0, 0.997, 1.0, 0.25); wood(58.16, 64, 0.06);
  // "En vez de pasar el examen...": vuelve más rápido y empieza a temblar.
  t = 58.9; i = 0;
  while (t < T.bell - 0.12) {
    const k = ramp(t, 58.9, T.bell);
    pluck(t, LINE[i % 16] + Math.floor(k * 7), 0.24 + 0.1 * k, i % 2 ? 0.25 : -0.25, 0.97, 0.25, 0.5);
    if (k > 0.4) tick(t + 0.05, 0.03 * k, i % 2 ? -0.5 : 0.5);
    t += (60 / (132 + 170 * k * k)) * (k > 0.55 ? 0.5 : 1); i++;
  }
  strings(60.9, [57, 60, 64], 0.45, T.bell - 60.9, { trem: 14, cresc: true, att: 0.5, rel: 0.04, gliss: 5, cut: 0.06 });
  strings(61.6, [69, 72], 0.2, T.bell - 61.6, { trem: 17, cresc: true, att: 0.5, rel: 0.04, gliss: 5, cut: 0.07 });
}
/* ---------- K. La abuela: vals cálido (Sol mayor, 96) ---------- */
{
  const b = 60 / 96;
  const BARS = [[43, [59, 62, 67]], [40, [59, 64, 67]], [36, [60, 64, 67]], [38, [57, 62, 66]]]; // Sol · Mim · Do · Re
  BARS.forEach(([bass, ch], q) => {
    const t = T.K + q * 3 * b;
    pluck(t, bass, 0.36, -0.1, 0.997, 1.8, 0.3);
    [1, 2].forEach((n) => ch.forEach((m, c) => pluck(t + n * b + c * 0.018, m, 0.13, 0.15 + c * 0.1, 0.994, 1.2, 0.4)));
  });
  [[0, 83], [2, 86], [3, 79], [5, 83], [6, 76], [7, 81], [8, 84], [9, 81], [10, 78], [11, 74]].forEach(([n, m], i) => box(T.K + n * b, m, 0.085, i % 2 ? 0.3 : -0.3, 2.2));
  // Remate después de la última palabra: acorde de Sol rasgueado y una campanita.
  const e = T.end + 0.1;
  [43, 50, 55, 59, 62, 67].forEach((m, c) => pluck(e + c * 0.035, m, 0.2, (c - 2.5) * 0.12, 0.998, 3.0, 0.4));
  box(e + 0.28, 91, 0.1, 0.2, 2.6); box(e + 0.42, 95, 0.08, -0.2, 2.6);
}

/* ---------- Mezcla ---------- */
function reverb(buf, delays, fb, mixV) {
  const out = new Float32Array(N);
  delays.forEach((ms) => {
    const d = Math.floor((ms * SR) / 1000);
    const line = new Float32Array(N);
    let lp = 0;
    for (let i = 0; i < N; i++) { const fbv = i >= d ? line[i - d] : 0; lp += 0.45 * (fbv - lp); line[i] = buf[i] + lp * fb; out[i] += line[i] / delays.length; }
  });
  for (let i = 0; i < N; i++) buf[i] += out[i] * mixV;
}
reverb(L, [43, 71, 101, 149, 211], 0.62, 0.3);
reverb(R, [47, 77, 107, 157, 223], 0.62, 0.3);

// Nivel parejo por tramo (para que ninguno quede perdido ni tape la voz), con cruces suaves.
const SECS = [0, T.B, T.C, T.hit, T.D, T.E, T.F, T.G, T.H, T.I, T.J, 58.0, T.K, TOTAL];
const rms = SECS.slice(0, -1).map((a, q) => {
  let s = 0; const i0 = Math.floor(a * SR), i1 = Math.floor(Math.min(SECS[q + 1], T.end + 1.5) * SR);
  for (let i = i0; i < i1; i++) s += L[i] * L[i] + R[i] * R[i];
  return Math.sqrt(s / (2 * Math.max(1, i1 - i0)));
});
const target = rms.slice().sort((a, b) => a - b)[Math.floor(rms.length / 2)];
const gains = rms.map((r) => clamp(target / Math.max(1e-5, r), 0.5, 2.0));
const gainAt = (t) => {
  let q = SECS.length - 2;
  for (let k = 0; k < SECS.length - 1; k++) if (t < SECS[k + 1]) { q = k; break; }
  const x = ramp(t, SECS[q], SECS[q] + 0.25);
  return q === 0 ? gains[0] : gains[q - 1] + (gains[q] - gains[q - 1]) * x;
};
let peak = 0;
for (let i = 0; i < N; i++) { const g = gainAt(i / SR); L[i] *= g; R[i] *= g; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  // El timbre del recreo corta la música en seco (cola incluida) hasta que entra el vals.
  const gate = t < T.bell - 0.03 ? 1 : t < T.bell ? (T.bell - t) / 0.03 : t < T.K - 0.03 ? 0 : 1;
  const fade = (1 - ramp(t, TOTAL - 1.6, TOTAL - 0.1)) * ramp(t, 0, 0.05);
  const g = (0.89 * gate * fade) / peak;
  buf.writeInt16LE(Math.round(clamp(L[i] * g, -1, 1) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(clamp(R[i] * g, -1, 1) * 32767), 46 + i * 4);
}
const outFile = path.join(__dirname, '..', 'assets', 'musica.wav');
fs.writeFileSync(outFile, buf);
console.log('música lista:', outFile, TOTAL + ' s');
console.log('nivel por tramo (rms → ganancia):', rms.map((r, q) => SECS[q].toFixed(1) + ': ' + r.toFixed(3) + ' ×' + gains[q].toFixed(2)).join(' | '));
