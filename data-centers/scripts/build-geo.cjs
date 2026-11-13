// Uso: node scripts/build-geo.cjs
// Dos mapas reales desde Natural Earth, con límites compartidos y suavizados (ver zalo-reyes/scripts/build-geo.cjs):
//  - sa: Sudamérica por países (ne_50m_admin_0_countries), en km, centrada en 20° S / 60° O.
//  - rm: Región Metropolitana y regiones vecinas (ne_10m_admin_1), en km, centrada en Santiago, con las comunas del guion.
// Los módulos topojson-* se cargan desde D:\_descargas\geo-tools (instalados aparte).
const fs = require('fs');
const path = require('path');
const TOOLS = 'D:/_descargas/geo-tools/node_modules/';
const { topology } = require(TOOLS + 'topojson-server');
const { presimplify, simplify } = require(TOOLS + 'topojson-simplify');
const { feature } = require(TOOLS + 'topojson-client');
const DATA = 'D:/_descargas/natural-earth-chile/';
const OUT = path.join(__dirname, '..', 'lib', 'geo.js');

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
const inBox = (r, a, b, c, d) => r.some(([lon, lat]) => lon > a && lon < b && lat > c && lat < d);

function build(features, { lat0, lon0, tol, minA, keepPoly, cities, dec = 1 }) {
  const KX = 111.32 * Math.cos(lat0 * Math.PI / 180), KY = 110.57;
  const proj = ([lon, lat]) => [(lon - lon0) * KX, (lat - lat0) * KY];
  const fs2 = features.map(({ name, geometry }) => {
    const polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    const keep = polys.filter((p) => keepPoly(name, p[0]));
    return { type: 'Feature', properties: { name }, geometry: { type: 'MultiPolygon', coordinates: keep.map((p) => p.map((r) => r.map(proj))) } };
  }).filter((f) => f.geometry.coordinates.length);
  let topo = topology({ m: { type: 'FeatureCollection', features: fs2 } }, 1e6);
  topo = presimplify(topo);
  topo = simplify(topo, tol);
  const t = topo.transform;
  topo.arcs = topo.arcs.map((arc) => {
    let x = 0, y = 0;
    const abs = arc.map((p) => { if (t) { x += p[0]; y += p[1]; return [x * t.scale[0] + t.translate[0], y * t.scale[1] + t.translate[1]]; } return [p[0], p[1]]; });
    return chaikinOpen(abs, 2);
  });
  delete topo.transform;
  const out = {};
  for (const f of feature(topo, topo.objects.m).features) {
    const g = f.geometry; if (!g) continue;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    const rings = polys.map((p) => p[0]).filter((r) => r.length >= 4 && area(r) >= minA).map((r) => r.map((q) => [+q[0].toFixed(dec), +q[1].toFixed(dec)]));
    if (rings.length) out[f.properties.name] = rings;
  }
  const pts = {};
  for (const k in cities) pts[k] = proj(cities[k]).map((v) => +v.toFixed(2));
  return { shapes: out, cities: pts };
}

// Sudamérica: países del continente, más la Guayana Francesa (parte de Francia) y Panamá; fuera islas lejanas (Galápagos, etc.).
const W = JSON.parse(fs.readFileSync(DATA + 'countries.geojson', 'utf8'));
const SA = ['Venezuela', 'Uruguay', 'Suriname', 'Peru', 'Paraguay', 'Guyana', 'Ecuador', 'Colombia', 'Chile', 'Brazil', 'Bolivia', 'Argentina', 'France', 'Panama', 'Costa Rica'];
const saFeat = W.features.filter((f) => SA.includes(f.properties.ADMIN)).map((f) => ({ name: f.properties.ADMIN, geometry: f.geometry }));
const sa = build(saFeat, {
  lat0: -20, lon0: -60, tol: 60, minA: 900,
  keepPoly: (n, r) => (n === 'France' ? inBox(r, -55, -51, 2, 6.5) : r.every(([lon]) => lon > -82) && inBox(r, -85, -30, -57, 13)),
  cities: { Santiago: [-70.66, -33.45], SaoPaulo: [-46.63, -23.55] },
});

// Región Metropolitana: regiones chilenas cercanas y provincias argentinas vecinas, recortadas al encuadre.
const A = JSON.parse(fs.readFileSync(DATA + 'admin1.geojson', 'utf8'));
const RM = ['Región Metropolitana de Santiago', 'Valparaíso', "Libertador General Bernardo O'Higgins", 'Mendoza', 'San Juan', 'Coquimbo', 'Maule'];
const rmFeat = A.features.filter((f) => RM.includes(f.properties.name) && (f.properties.admin === 'Chile' || f.properties.admin === 'Argentina')).map((f) => ({ name: f.properties.name, geometry: f.geometry }));
const rm = build(rmFeat, {
  lat0: -33.45, lon0: -70.66, tol: 0.4, minA: 3,
  keepPoly: (n, r) => r.every(([lon]) => lon > -75) && inBox(r, -73, -68.5, -35.5, -31.5),
  dec: 2,
  cities: {
    Quilicura: [-70.7296, -33.3600], Cerrillos: [-70.7167, -33.5000], 'Puente Alto': [-70.5758, -33.6117],
    Lampa: [-70.8770, -33.2860], Buin: [-70.7428, -33.7325], Santiago: [-70.6506, -33.4378],
    'Bajos de Mena': [-70.5970, -33.6290], 'Valle Grande': [-70.7440, -33.3330],
  },
});
fs.writeFileSync(OUT, 'window.GEO=' + JSON.stringify({ sa, rm }) + ';\n');
console.log('sa:', Object.keys(sa.shapes).map((k) => k + ' ' + sa.shapes[k].length).join(', '));
console.log('rm:', Object.keys(rm.shapes).map((k) => k + ' ' + rm.shapes[k].length).join(', '));
console.log('ciudades rm:', JSON.stringify(rm.cities));
console.log('tamaño:', fs.statSync(OUT).size, 'bytes');
