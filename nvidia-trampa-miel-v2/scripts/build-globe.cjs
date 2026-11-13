// Genera lib/globe.js: puntos sobre tierra firme (Natural Earth 110m, vía world-atlas) y contornos de costa,
// para el globo en malla. Los países del caso (China, Malasia, Estados Unidos) quedan marcados.
// Uso: node scripts/build-globe.cjs  (datos en D:\_descargas\natural-earth-world, módulos en D:\_descargas\geo-tools)
const fs = require('fs');
const path = require('path');
const topo = require('D:/_descargas/geo-tools/node_modules/topojson-client');
const DATA = 'D:/_descargas/natural-earth-world';
const land = JSON.parse(fs.readFileSync(path.join(DATA, 'land-110m.json'), 'utf8'));
const countries = JSON.parse(fs.readFileSync(path.join(DATA, 'countries-110m.json'), 'utf8'));

const landGeo = topo.feature(land, land.objects.land);
const ctry = topo.feature(countries, countries.objects.countries);
const polysOf = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []);
const landPolys = landGeo.features.flatMap((f) => polysOf(f.geometry));
const MARK = { '156': 1, '458': 2, '840': 3 }; // China, Malasia, Estados Unidos
const marked = ctry.features.filter((f) => MARK[f.id]).map((f) => ({ k: MARK[f.id], polys: polysOf(f.geometry) }));

const inRing = (x, y, r) => {
  let ins = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
};
const inPoly = (x, y, p) => inRing(x, y, p[0]) && !p.slice(1).some((h) => inRing(x, y, h));

const dots = [];
const STEP = 1.2;
for (let lat = -84; lat <= 84; lat += STEP) {
  const n = Math.max(1, Math.round((360 * Math.cos((lat * Math.PI) / 180)) / STEP));
  for (let i = 0; i < n; i++) {
    const lon = -180 + (i + 0.5) * (360 / n);
    if (!landPolys.some((p) => inPoly(lon, lat, p))) continue;
    let k = 0;
    for (const m of marked) if (m.polys.some((p) => inPoly(lon, lat, p))) { k = m.k; break; }
    dots.push([+lat.toFixed(2), +lon.toFixed(2), k]);
  }
}
// Costas: anillos exteriores, con un punto cada ~0,8° para que la línea siga la curva de la esfera.
const coast = [];
landPolys.forEach((p) => {
  const r = p[0];
  const out = [];
  for (let i = 0; i < r.length; i++) {
    const [x0, y0] = r[i], [x1, y1] = r[(i + 1) % r.length];
    const seg = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.8));
    for (let s = 0; s < seg; s++) out.push([+(y0 + ((y1 - y0) * s) / seg).toFixed(2), +(x0 + ((x1 - x0) * s) / seg).toFixed(2)]);
  }
  if (out.length > 8) coast.push(out);
});
fs.writeFileSync(path.join(__dirname, '..', 'lib', 'globe.js'), 'window.GLOBE = ' + JSON.stringify({ dots, coast }) + ';\n');
console.log('puntos:', dots.length, '| marcados:', dots.filter((d) => d[2]).length, '| costas:', coast.length);
