// Uso: node build-geo.cjs <countries.geojson> <outFile>
// Paraguay y vecinos desde Natural Earth, con límites compartidos y suavizados.
const fs = require('fs');
const { topology } = require('topojson-server');
const { presimplify, simplify } = require('topojson-simplify');
const { feature } = require('topojson-client');
const [src, outFile] = process.argv.slice(2);

const LAT0 = -23.4, LON0 = -58.4;
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
const near = ['Paraguay', 'Argentina', 'Bolivia', 'Brazil', 'Uruguay', 'Chile', 'Peru'];
const features = world.features
  .filter((f) => near.includes(f.properties.NAME || f.properties.ADMIN))
  .map((f) => {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    return { type: 'Feature', properties: { name: f.properties.NAME || f.properties.ADMIN }, geometry: { type: 'MultiPolygon', coordinates: polys.map((p) => p.map((r) => r.map(proj))) } };
  });

let topo = topology({ m: { type: 'FeatureCollection', features } }, 1e6);
topo = presimplify(topo);
topo = simplify(topo, 60);
const t = topo.transform;
topo.arcs = topo.arcs.map((arc) => {
  let x = 0, y = 0;
  const abs = arc.map((p) => {
    if (t) { x += p[0]; y += p[1]; return [x * t.scale[0] + t.translate[0], y * t.scale[1] + t.translate[1]]; }
    return [p[0], p[1]];
  });
  return chaikinOpen(abs, 3);
});
delete topo.transform;

const out = {};
for (const f of feature(topo, topo.objects.m).features) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : (f.geometry.coordinates || []);
  out[f.properties.name] = polys.map((p) => p[0]).filter((r) => r.length >= 4 && area(r) >= 2000)
    .map((r) => r.map((q) => [+q[0].toFixed(1), +q[1].toFixed(1)]));
}
const paraguay = out.Paraguay;
delete out.Paraguay;
const asuncion = proj([-57.5759, -25.2637]).map((v) => +v.toFixed(1)); // coordenadas reales de Asunción
fs.writeFileSync(outFile, 'window.GEO=' + JSON.stringify({ paraguay, neighbors: out, asuncion }) + ';\n');
console.log('paraguay polígonos:', paraguay.length, '| vecinos:', Object.keys(out).join(', '), '| asunción:', asuncion);
