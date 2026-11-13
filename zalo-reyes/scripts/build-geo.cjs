// Uso: node scripts/build-geo.cjs <ne_10m_admin_1.geojson> lib/geo.js
// Dos mapas reales desde Natural Earth, con límites compartidos y suavizados:
//  - ESPAÑA peninsular y Baleares (provincias) con sus vecinos (Portugal, Francia, Andorra, Marruecos).
//  - CHILE continental (regiones) con sus vecinos (Argentina, Bolivia, Perú).
// Los módulos topojson-* se cargan desde D:\_descargas\geo-tools (instalados aparte).
const fs = require('fs');
const TOOLS = 'D:/_descargas/geo-tools/node_modules/';
const { topology } = require(TOOLS + 'topojson-server');
const { presimplify, simplify } = require(TOOLS + 'topojson-simplify');
const { feature, merge } = require(TOOLS + 'topojson-client');
const [src, outFile] = process.argv.slice(2);

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

function build({ main, near, lat0, lon0, keepPoly, tol, minMain, minNear, cities }) {
  const KX = 111.32 * Math.cos(lat0 * Math.PI / 180), KY = 110.57;
  const proj = ([lon, lat]) => [(lon - lon0) * KX, (lat - lat0) * KY];
  const features = world.features
    .filter((f) => f.properties.admin === main || near.includes(f.properties.admin))
    .map((f) => {
      const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      const keep = polys.filter((p) => keepPoly(f.properties.admin, p[0]));
      return { type: 'Feature', properties: { name: f.properties.name, country: f.properties.admin }, geometry: { type: 'MultiPolygon', coordinates: keep.map((p) => p.map((r) => r.map(proj))) } };
    })
    .filter((f) => f.geometry.coordinates.length);
  let topo = topology({ m: { type: 'FeatureCollection', features } }, 1e6);
  topo = presimplify(topo);
  topo = simplify(topo, tol);
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
    if (f.properties.country !== main) continue;
    const r = rings(f.geometry, minMain);
    if (r.length) regions[f.properties.name] = r;
  }
  const neighbors = {};
  for (const c of near) {
    const geoms = topo.objects.m.geometries.filter((g) => g.properties.country === c);
    if (!geoms.length) continue;
    const r = rings(merge(topo, geoms), minNear);
    if (r.length) neighbors[c] = r;
  }
  const pts = {};
  for (const k in cities) pts[k] = proj(cities[k]).map((v) => +v.toFixed(1));
  return { regions, neighbors, cities: pts };
}

// España: fuera Canarias (al sur de 30° N), Ceuta, Melilla y las islas lejanas; Europa y África cercanas recortadas al encuadre.
const inBox = (r, a, b, c, d) => r.some(([lon, lat]) => lon > a && lon < b && lat > c && lat < d);
const spain = build({
  main: 'Spain', near: ['Portugal', 'France', 'Andorra', 'Morocco', 'Algeria'], lat0: 40.2, lon0: -3.7,
  keepPoly: (c, r) => c === 'Spain' ? r.every(([lon, lat]) => lat > 35.9) : inBox(r, -12, 6, 33, 46),
  tol: 4, minMain: 20, minNear: 400,
  cities: { Madrid: [-3.7038, 40.4168] },
});
// Chile: fuera Rapa Nui, Juan Fernández y otras islas oceánicas (al oeste de 76° O).
const chile = build({
  main: 'Chile', near: ['Argentina', 'Bolivia', 'Peru'], lat0: -36, lon0: -71,
  keepPoly: (c, r) => !(c === 'Chile' && r.every(([lon]) => lon < -76)),
  tol: 25, minMain: 150, minNear: 3000,
  cities: { Conchali: [-70.675, -33.385] },
});
fs.writeFileSync(outFile, 'window.GEO=' + JSON.stringify({ spain, chile }) + ';\n');
console.log('España:', Object.keys(spain.regions).length, 'provincias; vecinos:', Object.keys(spain.neighbors).join(', '));
console.log('Chile:', Object.keys(chile.regions).length, 'regiones; vecinos:', Object.keys(chile.neighbors).join(', '));
console.log('tamaño:', fs.statSync(outFile).size, 'bytes');
