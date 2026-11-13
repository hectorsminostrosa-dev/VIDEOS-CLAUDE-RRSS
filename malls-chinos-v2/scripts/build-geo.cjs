// Uso: node build-geo.cjs <ne_10m_admin_1.geojson> <outFile>
// Regiones de Chile y vecinos (Argentina, Bolivia, Perú) desde Natural Earth, con límites compartidos y suavizados.
// Los módulos topojson-* se cargan desde D:\_descargas\geo-tools (instalados aparte).
const fs = require('fs');
const path = require('path');
const TOOLS = 'D:/_descargas/geo-tools/node_modules/';
const { topology } = require(TOOLS + 'topojson-server');
const { presimplify, simplify } = require(TOOLS + 'topojson-simplify');
const { feature, merge } = require(TOOLS + 'topojson-client');
const [src, outFile] = process.argv.slice(2);

const LAT0 = -36, LON0 = -71;
const KX = 111.32 * Math.cos(LAT0 * Math.PI / 180), KY = 110.57;
const proj = ([lon, lat]) => [(lon - LON0) * KX, (lat - LAT0) * KY];

function chaikinOpen(pts, it) {
  let p = pts;
  for (let k = 0; k < it; k++) {
    if (p.length < 3) return p;
    const out = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const [ax, ay] = p[i], [bx, by] = p[i + 1];
      out.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
    }
    out.push(p[p.length - 1]);
    p = out;
  }
  return p;
}
const area = (r) => { let s = 0; for (let i = 0; i < r.length - 1; i++) s += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]; return Math.abs(s) / 2; };

const world = JSON.parse(fs.readFileSync(src, 'utf8'));
const NEAR = ['Chile', 'Argentina', 'Bolivia', 'Peru'];
const features = world.features
  .filter((f) => NEAR.includes(f.properties.admin))
  .map((f) => {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    // Fuera: Rapa Nui, Juan Fernández y otras islas oceánicas (al oeste de 76° O), que no van en el encuadre.
    const keep = polys.filter((p) => !(f.properties.admin === 'Chile' && p[0].every(([lon]) => lon < -76)));
    return { type: 'Feature', properties: { name: f.properties.name, country: f.properties.admin }, geometry: { type: 'MultiPolygon', coordinates: keep.map((p) => p.map((r) => r.map(proj))) } };
  })
  .filter((f) => f.geometry.coordinates.length);

let topo = topology({ m: { type: 'FeatureCollection', features } }, 1e6);
topo = presimplify(topo);
topo = simplify(topo, 25);
const t = topo.transform;
topo.arcs = topo.arcs.map((arc) => {
  let x = 0, y = 0;
  const abs = arc.map((p) => {
    if (t) { x += p[0]; y += p[1]; return [x * t.scale[0] + t.translate[0], y * t.scale[1] + t.translate[1]]; }
    return [p[0], p[1]];
  });
  return chaikinOpen(abs, 2);
});
delete topo.transform;

const rings = (geom, minA) => {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : (geom.coordinates || []);
  return polys.map((p) => p[0]).filter((r) => r.length >= 4 && area(r) >= minA).map((r) => r.map((q) => [+q[0].toFixed(1), +q[1].toFixed(1)]));
};
const regions = {};
for (const f of feature(topo, topo.objects.m).features) {
  if (f.properties.country !== 'Chile') continue;
  regions[f.properties.name] = rings(f.geometry, 150);
}
const neighbors = {};
for (const c of ['Argentina', 'Bolivia', 'Peru']) {
  const geoms = topo.objects.m.geometries.filter((g) => g.properties.country === c);
  neighbors[c] = rings(merge(topo, geoms), 3000);
}
// Capitales regionales (coordenadas reales), para ubicar marcas sobre las regiones del estudio.
const CITIES = { Santiago: [-70.6483, -33.4569], Iquique: [-70.1431, -20.2141], Valparaiso: [-71.6197, -33.0458], Concepcion: [-73.0498, -36.8270], Temuco: [-72.5904, -38.7359], PuertoMontt: [-72.9411, -41.4693] };
const cities = {};
for (const k in CITIES) cities[k] = proj(CITIES[k]).map((v) => +v.toFixed(1));
fs.writeFileSync(outFile, 'window.GEO=' + JSON.stringify({ regions, neighbors, cities }) + ';\n');
console.log('regiones:', Object.keys(regions).map((k) => k + ' (' + regions[k].length + ')').join(', '));
console.log('vecinos:', Object.keys(neighbors).map((k) => k + ' (' + neighbors[k].length + ')').join(', '));
console.log('tamaño:', fs.statSync(outFile).size, 'bytes');
