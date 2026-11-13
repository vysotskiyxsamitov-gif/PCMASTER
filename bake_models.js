// PC МАСТЕР: запекает предметы (диван, кресло, кулер) в настоящие 3D-файлы models/*.glb и models/pack.js.
// Запуск:  node tools/bake_models.js
// Геометрия строится теми же формулами, что и в three.js (Box/Sphere/Cylinder), материалы — те же цвета, что и были в коде.
const fs = require('fs'), path = require('path');
const PI = Math.PI;

/* ---------- мини-сцена ---------- */
let cur = null;
function newModel() { cur = []; return cur; }
function M(c, r, m) { return { c: c, r: r === undefined ? .75 : r, m: m || 0, a: 1 }; }
function MT(c, r, a) { return { c: c, r: r, m: 0, a: a }; }   // прозрачный
function mk(kind, p, mat, x, y, z, sx, sy, sz) {
  const o = { kind, p, mat, pos: [x || 0, y || 0, z || 0], sc: [sx === undefined ? 1 : sx, sy === undefined ? (sx === undefined ? 1 : sx) : sy, sz === undefined ? (sx === undefined ? 1 : sx) : sz], rotation: { x: 0, y: 0, z: 0, set(a, b, c) { this.x = a; this.y = b; this.z = c; } } };
  cur.push(o); return o;
}
const S = (g, r, mat, x, y, z, sx, sy, sz) => mk('sphere', { r }, mat, x, y, z, sx, sy, sz);
const C = (g, r1, r2, h, mat, x, y, z, sx, sz) => mk('cyl', { r1, r2, h }, mat, x, y, z, sx === undefined ? 1 : sx, 1, sz === undefined ? 1 : sz);
const B = (g, w, h, d, mat, x, y, z) => mk('box', { w, h, d }, mat, x, y, z);

/* ---------- геометрия ---------- */
function boxGeo(w, h, d) {
  const pos = [], nor = [], uv = [], idx = [];
  const faces = [ // нормаль, ось u, ось v
    [[1, 0, 0], [0, 0, -1], [0, 1, 0]], [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
    [[0, 1, 0], [1, 0, 0], [0, 0, -1]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
    [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [-1, 0, 0], [0, 1, 0]]];
  const hs = [w / 2, h / 2, d / 2];
  faces.forEach(function (f) {
    const n = f[0], u = f[1], v = f[2], b = pos.length / 3;
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (q) {
      for (let i = 0; i < 3; i++) pos.push(n[i] * hs[i] + u[i] * hs[i] * q[0] + v[i] * hs[i] * q[1]);
      nor.push(n[0], n[1], n[2]); uv.push((q[0] + 1) / 2, (q[1] + 1) / 2);
    });
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  return { pos, nor, uv, idx };
}
function sphereGeo(r, ws, hs) {
  const pos = [], nor = [], uv = [], idx = [], grid = [];
  let k = 0;
  for (let iy = 0; iy <= hs; iy++) { const row = [], v = iy / hs; for (let ix = 0; ix <= ws; ix++) { const u = ix / ws;
    const x = -r * Math.cos(u * PI * 2) * Math.sin(v * PI), y = r * Math.cos(v * PI), z = r * Math.sin(u * PI * 2) * Math.sin(v * PI);
    pos.push(x, y, z); const l = Math.hypot(x, y, z) || 1; nor.push(x / l, y / l, z / l); uv.push(u, 1 - v); row.push(k++); } grid.push(row); }
  for (let iy = 0; iy < hs; iy++) for (let ix = 0; ix < ws; ix++) {
    const a = grid[iy][ix + 1], b = grid[iy][ix], c = grid[iy + 1][ix], d = grid[iy + 1][ix + 1];
    if (iy !== 0) idx.push(a, b, d); if (iy !== hs - 1) idx.push(b, c, d);
  }
  return { pos, nor, uv, idx };
}
function cylGeo(rt, rb, h, rs) {
  const pos = [], nor = [], uv = [], idx = [], grid = [], slope = (rb - rt) / h;
  let k = 0;
  for (let y = 0; y <= 1; y++) { const row = [], v = y, radius = v * (rb - rt) + rt;
    for (let x = 0; x <= rs; x++) { const u = x / rs, th = u * PI * 2, s = Math.sin(th), c = Math.cos(th);
      pos.push(radius * s, -v * h + h / 2, radius * c); const l = Math.hypot(s, slope, c); nor.push(s / l, slope / l, c / l); uv.push(u, 1 - v); row.push(k++); }
    grid.push(row); }
  for (let x = 0; x < rs; x++) { const a = grid[0][x], b = grid[1][x], c = grid[1][x + 1], d = grid[0][x + 1]; idx.push(a, b, d, b, c, d); }
  [[true, rt], [false, rb]].forEach(function (cp) {
    const top = cp[0], radius = cp[1]; if (radius <= 0) return;
    const sign = top ? 1 : -1, cs = k;
    for (let x = 1; x <= rs; x++) { pos.push(0, h / 2 * sign, 0); nor.push(0, sign, 0); uv.push(.5, .5); k++; }
    const ce = k;
    for (let x = 0; x <= rs; x++) { const th = x / rs * PI * 2, c = Math.cos(th), s = Math.sin(th); pos.push(radius * s, h / 2 * sign, radius * c); nor.push(0, sign, 0); uv.push(c * .5 + .5, s * .5 * sign + .5); k++; }
    for (let x = 0; x < rs; x++) { const c = cs + x, i = ce + x; if (top) idx.push(i, i + 1, c); else idx.push(i + 1, i, c); }
  });
  return { pos, nor, uv, idx };
}

/* ---------- матрицы ---------- */
function rotM(rx, ry, rz) { // R = Rx * Ry * Rz (порядок XYZ как в three.js)
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
  const Rx = [[1, 0, 0], [0, cx, -sx], [0, sx, cx]], Ry = [[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]], Rz = [[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]];
  const mul = (A, B) => A.map((r, i) => [0, 1, 2].map(j => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
  return mul(mul(Rx, Ry), Rz);
}
function mulM(A, B) { return A.map((r, i) => [0, 1, 2].map(j => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j])); }
function bake(model) {
  const groups = new Map();
  model.forEach(function (o) {
    const g = o.kind === 'box' ? boxGeo(o.p.w, o.p.h, o.p.d) : o.kind === 'sphere' ? sphereGeo(o.p.r, 18, 14) : cylGeo(o.p.r1, o.p.r2, o.p.h, 20);
    const R = o.R || rotM(o.rotation.x, o.rotation.y, o.rotation.z), s = o.sc, key = [o.mat.c, o.mat.r, o.mat.m, o.mat.a].join('|');
    let G = groups.get(key); if (!G) { G = { mat: o.mat, pos: [], nor: [], uv: [], idx: [] }; groups.set(key, G); }
    const base = G.pos.length / 3;
    for (let i = 0; i < g.pos.length; i += 3) {
      const v = [g.pos[i] * s[0], g.pos[i + 1] * s[1], g.pos[i + 2] * s[2]];
      G.pos.push(R[0][0] * v[0] + R[0][1] * v[1] + R[0][2] * v[2] + o.pos[0], R[1][0] * v[0] + R[1][1] * v[1] + R[1][2] * v[2] + o.pos[1], R[2][0] * v[0] + R[2][1] * v[1] + R[2][2] * v[2] + o.pos[2]);
      const n = [g.nor[i] / s[0], g.nor[i + 1] / s[1], g.nor[i + 2] / s[2]];
      let m = [R[0][0] * n[0] + R[0][1] * n[1] + R[0][2] * n[2], R[1][0] * n[0] + R[1][1] * n[1] + R[1][2] * n[2], R[2][0] * n[0] + R[2][1] * n[1] + R[2][2] * n[2]];
      const l = Math.hypot(m[0], m[1], m[2]) || 1; G.nor.push(m[0] / l, m[1] / l, m[2] / l);
    }
    for (let i = 0; i < g.uv.length; i++) G.uv.push(g.uv[i]);
    const flip = s[0] * s[1] * s[2] < 0;
    for (let i = 0; i < g.idx.length; i += 3) { if (flip) G.idx.push(base + g.idx[i], base + g.idx[i + 2], base + g.idx[i + 1]); else G.idx.push(base + g.idx[i], base + g.idx[i + 1], base + g.idx[i + 2]); }
  });
  return Array.from(groups.values());
}

/* ---------- запись GLB ---------- */
const lin = c => { c /= 255; return c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); };
function writeGLB(name, groups) {
  const chunks = [], views = [], acc = [], mats = [], prims = [];
  let off = 0;
  function push(arrBuf) { const pad = (4 - arrBuf.byteLength % 4) % 4, b = Buffer.concat([Buffer.from(arrBuf.buffer, arrBuf.byteOffset, arrBuf.byteLength), Buffer.alloc(pad)]); const v = { buffer: 0, byteOffset: off, byteLength: arrBuf.byteLength }; chunks.push(b); off += b.length; views.push(v); return views.length - 1; }
  groups.forEach(function (G, gi) {
    const P = new Float32Array(G.pos), N = new Float32Array(G.nor), U = new Float32Array(G.uv), nv = P.length / 3, big = nv > 65535, I = big ? new Uint32Array(G.idx) : new Uint16Array(G.idx);
    const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], P[i + k]); mx[k] = Math.max(mx[k], P[i + k]); }
    const a = {};
    views.length; const vp = push(P); views[vp].target = 34962; acc.push({ bufferView: vp, componentType: 5126, count: nv, type: 'VEC3', min: mn, max: mx }); a.POSITION = acc.length - 1;
    const vn = push(N); views[vn].target = 34962; acc.push({ bufferView: vn, componentType: 5126, count: nv, type: 'VEC3' }); a.NORMAL = acc.length - 1;
    const vu = push(U); views[vu].target = 34962; acc.push({ bufferView: vu, componentType: 5126, count: nv, type: 'VEC2' }); a.TEXCOORD_0 = acc.length - 1;
    const vi = push(I); views[vi].target = 34963; acc.push({ bufferView: vi, componentType: big ? 5125 : 5123, count: I.length, type: 'SCALAR' });
    const c = G.mat.c, mt = { name: 'm' + gi, pbrMetallicRoughness: { baseColorFactor: [lin(c >> 16 & 255), lin(c >> 8 & 255), lin(c & 255), G.mat.a], metallicFactor: G.mat.m, roughnessFactor: G.mat.r } };
    if (G.mat.a < 1) mt.alphaMode = 'BLEND'; mats.push(mt);
    prims.push({ attributes: a, indices: acc.length - 1, material: gi, mode: 4 });
  });
  const json = { asset: { version: '2.0', generator: 'pcmaster bake_models.js' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ name, mesh: 0 }], meshes: [{ name, primitives: prims }], materials: mats, accessors: acc, bufferViews: views, buffers: [{ byteLength: off }] };
  let js = Buffer.from(JSON.stringify(json)); js = Buffer.concat([js, Buffer.alloc((4 - js.length % 4) % 4, 0x20)]);
  const bin = Buffer.concat(chunks), total = 12 + 8 + js.length + 8 + bin.length, out = Buffer.alloc(total);
  out.writeUInt32LE(0x46546C67, 0); out.writeUInt32LE(2, 4); out.writeUInt32LE(total, 8);
  out.writeUInt32LE(js.length, 12); out.writeUInt32LE(0x4E4F534A, 16); js.copy(out, 20);
  out.writeUInt32LE(bin.length, 20 + js.length); out.writeUInt32LE(0x004E4942, 24 + js.length); bin.copy(out, 28 + js.length);
  return out;
}

/* ---------- модели (те же размеры и цвета, что были в models.js) ---------- */
const MODELS = {};
MODELS.sofa = function () {
  const g = null, m = newModel(), fab = M(0x2d6a6a, .95), fab2 = M(0x35807f, .95), wood = M(0x5a3b22, .6);
  B(g, 3.5, .42, 1.25, fab, 0, .45, 0);
  [-1, 0, 1].forEach(function (i) { S(g, .62, fab2, i * 1.1, .85, .05, 1.0, .32, .86); });
  [-1, 0, 1].forEach(function (i) { const b = S(g, .6, fab2, i * 1.1, 1.38, .52, 1.0, .85, .3); b.rotation.x = -.18; });
  B(g, 3.5, .8, .3, fab, 0, 1.0, .55);
  [-1, 1].forEach(function (s) { const ar = C(g, .27, .27, 1.2, fab, s * 1.7, 1.0, 0, 1, 1); ar.rotation.x = PI / 2; S(g, .27, fab, s * 1.7, 1.0, .6, 1, 1, 1); S(g, .27, fab, s * 1.7, 1.0, -.6, 1, 1, 1); B(g, .26, .62, 1.2, fab, s * 1.7, .7, 0); });
  [[-1.55, .5], [1.55, .5], [-1.55, -.5], [1.55, -.5]].forEach(function (a) { C(g, .05, .035, .22, wood, a[0], .12, a[1]); });
  const pl = B(g, .62, .62, .16, M(0xf59e0b, .9), -1.0, 1.1, -.12); pl.rotation.set(.2, .3, .35); const pl2 = B(g, .55, .55, .15, M(0xe5e7eb, .9), 1.05, 1.05, -.1); pl2.rotation.set(.15, -.3, -.25);
  const bl = B(g, 1.2, .08, .6, M(0x7f1d1d, 1), .3, .74, -.35); bl.rotation.set(.12, .2, .02);
  return m;
};
MODELS.chair = function () {
  const g = null, m = newModel(), mt = M(0x1f2937, .85), ch = M(0xcbd5e1, .3, .8);
  for (let i = 0; i < 5; i++) { const an = i / 5 * PI * 2, arm = B(g, .55, .06, .09, ch, Math.cos(an) * .27, .16, Math.sin(an) * .27); arm.rotation.y = -an; S(g, .06, M(0x0b0b0e, .5), Math.cos(an) * .52, .08, Math.sin(an) * .52, 1, 1, 1); }
  C(g, .05, .05, .5, ch, 0, .5, 0); C(g, .09, .09, .15, mt, 0, .8, 0);
  B(g, .95, .14, .9, mt, 0, .92, 0); S(g, .5, mt, 0, .96, 0, 1.0, .18, .95);
  const bk = B(g, .9, 1.1, .14, mt, 0, 1.55, -.4); bk.rotation.x = -.12; B(g, .6, .4, .1, M(0x2d3748, .85), 0, 2.25, -.42);
  [-1, 1].forEach(function (s) { B(g, .07, .5, .07, ch, s * .5, 1.18, -.05); B(g, .1, .05, .5, mt, s * .5, 1.45, -.02); });
  return m;
};
MODELS.cooler = function () {
  const g = null, m = newModel(), body = M(0xe5e7eb, .4, .1);
  B(g, .85, 1.8, .85, body, 0, .9, 0); B(g, .87, .1, .87, M(0xcbd5e1, .4, .3), 0, 1.8, 0); B(g, .5, .1, .5, M(0x1f2937, .6), 0, .6, .45);
  for (let i = 0; i < 6; i++) B(g, .5, .012, .02, M(0x0b0b0e, .6), 0, .56 + i * .0, .46 + i * .0);
  B(g, .16, .12, .1, M(0x2563eb, .5), -.18, 1.35, .44); B(g, .16, .12, .1, M(0xdc2626, .5), .18, 1.35, .44);
  let tp = C(g, .03, .03, .1, M(0xcbd5e1, .3, .8), -.18, 1.22, .5); tp.rotation.x = PI / 2; tp = C(g, .03, .03, .1, M(0xcbd5e1, .3, .8), .18, 1.22, .5); tp.rotation.x = PI / 2;
  const wt = MT(0x60a5fa, .1, .45);
  C(g, .32, .3, .85, wt, 0, 2.3, 0); C(g, .12, .2, .12, wt, 0, 2.78, 0); C(g, .1, .1, .06, M(0x2563eb, .5), 0, 2.88, 0);
  C(g, .29, .27, .6, MT(0x3b82f6, .1, .4), 0, 2.2, 0);
  return m;
};

MODELS.room = function () {
  const g = null, m = newModel(), wall = M(0xd9d6cf, .95), wain = M(0x3b4252, .8), floor = M(0x8a8f98, .6), ceil = M(0xeeeeee, .9), FR = M(0x2a2f3a, .5, .3), glass = MT(0xbfe6ff, .1, .12), lamp = M(0xfffbe8, .4), base = M(0x20242c, .7);
  const T = .3;
  B(g, 20, .2, 16, floor, 0, -.1, 0);                       // пол
  B(g, 20, .2, 16, ceil, 0, 7.9, 0);                        // потолок
  B(g, 20.6, 10, T, wall, 0, 5, -8 - T / 2);                // задняя стена
  B(g, 20.6, 1.1, .06, wain, 0, .55, -8 + .03);             // панель-цоколь
  B(g, T, 10, 16, wall, -10 - T / 2, 5, 0); B(g, T, 10, 16, wall, 10 + T / 2, 5, 0);  // боковые
  B(g, .06, 1.1, 16, wain, -10 + .03, .55, 0); B(g, .06, 1.1, 16, wain, 10 - .03, .55, 0);
  // передняя стена (z=8) с двумя окнами x 3..9, y 1.5..5.8 и проёмом двери x -1.5..1.5
  const z = 8 + T / 2;
  [-1, 1].forEach(function (s) {
    B(g, 1, 10, T, wall, s * 9.5 + (s < 0 ? 0 : 0), 5, z); // x 9..10
    B(g, 6, 1.5, T, wall, s * 6, .75, z);                   // под окном
    B(g, 6, 4.2, T, wall, s * 6, 7.9, z);                   // над окном
    B(g, 3 - 1.5, 10, T, wall, s * 2.25, 5, z);             // x 1.5..3
    const cx = s * 6;
    B(g, 6.3, .18, .3, FR, cx, 5.85, 7.9); B(g, 6.3, .18, .3, FR, cx, 1.45, 7.9);
    B(g, .18, 4.6, .3, FR, cx - 3.05, 3.65, 7.9); B(g, .18, 4.6, .3, FR, cx + 3.05, 3.65, 7.9);
    B(g, .1, 4.3, .14, FR, cx, 3.65, 7.92); B(g, 6, .09, .14, FR, cx, 4.15, 7.92);
    B(g, 6.6, .14, .5, FR, cx, 1.38, 7.7);                  // подоконник
    B(g, 6, 4.3, .03, glass, cx, 3.65, 8.0);                // стекло
  });
  B(g, 3, 4.8, T, wall, 0, 7.6, z);                         // над дверью (y 5.2..10)
  // вывеска
  B(g, 8, 2, .12, M(0x111827, .6), 0, 6.1, -7.9); B(g, 7.6, 1.6, .05, M(0xf59e0b, .5), 0, 6.1, -7.82);
  // плинтус
  B(g, 20, .18, .08, base, 0, .09, -7.96); B(g, .08, .18, 16, base, -9.96, .09, 0); B(g, .08, .18, 16, base, 9.96, .09, 0);
  // потолочные панели
  [-6, -2, 2, 6].forEach(function (x) { [-4, 0, 4].forEach(function (zz) { B(g, 1.7, .05, 1.7, lamp, x, 7.77, zz); }); });
  return m;
};

function plantModel(potC) {
  const g = null, m = newModel(), pot = M(potC, .8);
  // горшок: вращение профиля (как LatheGeometry) собран из усечённых цилиндров
  C(g, .32, .42, .08, pot, 0, .04, 0); C(g, .42, .5, .62, pot, 0, .39, 0); C(g, .52, .52, .06, pot, 0, .73, 0);
  C(g, .45, .45, .04, M(0x2a1a10, 1), 0, .7, 0);
  const leaf = [M(0x2f855a, .7), M(0x276749, .7), M(0x38a169, .7)];
  for (let k = 0; k < 16; k++) {
    const ry = k / 16 * PI * 2 + (k % 5) * .06, tilt = .25 + (k % 4) * .17, len = .9 + (k % 3) * .35;
    // группа листа: позиция (0,.72,0), поворот Y=ry, затем X=tilt. Считаем вручную: вектор вдоль «вверх» листа
    const sx = Math.sin(tilt), cx = Math.cos(tilt);
    const dir = [Math.sin(ry) * sx, cx, Math.cos(ry) * sx], RR = mulM(rotM(0, ry, 0), rotM(tilt, 0, 0));   // лист наклонён на tilt и развёрнут веером на ry
    const up = (t) => [dir[0] * t, .72 + dir[1] * t, dir[2] * t];
    const st = C(g, .018, .012, len, M(0x2f6b3a, .8), up(len / 2)[0], up(len / 2)[1], up(len / 2)[2]);
    st.R = RR;
    const bp = up(len + .2), bl = S(g, .22, leaf[k % 3], bp[0], bp[1], bp[2], .5, 1.5, .08); bl.R = RR;
  }
  return m;
}
MODELS.plant_white = () => plantModel(0xe5e7eb);
MODELS.plant_orange = () => plantModel(0xc2410c);
MODELS.bench = function () {   // верстак без столешницы с текстурой и без ящиков-выдвижных (они остаются кодом)
  const g = null, m = newModel(), steel = M(0x2a2f3a, .4, .7);
  B(g, 6.1, .06, .06, steel, 0, 1.4, 1.3); B(g, 6.1, .06, .06, steel, 0, 1.4, -1.3);
  [[-2.8, -1.1], [2.8, -1.1], [-2.8, 1.1], [2.8, 1.1]].forEach(function (a) { B(g, .22, 1.4, .22, steel, a[0], .7, a[1]); B(g, .3, .06, .3, M(0x0b0b0e, .6), a[0], .03, a[1]); });
  B(g, 5.6, .06, .06, steel, 0, .4, 1.1); B(g, 5.6, .06, .06, steel, 0, .4, -1.1); B(g, .06, .06, 2.2, steel, -2.8, .4, 0); B(g, .06, .06, 2.2, steel, 2.8, .4, 0);
  B(g, 5.5, .06, 2.1, M(0x3a3f4c, .6, .3), 0, .43, 0);
  [[-1.6, .15], [-.4, -.2], [1.0, .1]].forEach(function (a, k) { B(g, .9, .5, .7, M([0x2563eb, 0xb91c1c, 0x15803d][k], .7), a[0], .73, a[1]); B(g, .7, .06, .5, M(0xe5e7eb, .6), a[0], .99, a[1]); });
  B(g, 1.55, .9, 2.3, M(0x1f2430, .5, .4), 2.1, 1.0, 0);
  B(g, .5, .22, .4, steel, -2.5, 1.7, 1.0); B(g, .5, .35, .08, steel, -2.5, 1.85, 1.24); const ha = C(g, .03, .03, .55, M(0xb0b6c0, .3, .9), -2.5, 1.82, .78); ha.rotation.x = PI / 2;
  return m;
};

/* ---------- процессоры: тело (плата + крышка + детали); надпись остаётся кодом, она рисуется отдельной плоскостью ---------- */
function cpuBody(kind) {
  const g = null, m = newModel(), pcb = M(0x2f6b3a, .6, .2), lid = M(0xc9ced6, .25, .9), gold = M(0xc9a24a, .3, .9), cap = M(0x9ca3af, .5, .5), dark = M(0x1f2937, .6, .3);
  const w = kind === 'lga' ? .375 : .4, h = kind === 'lga' ? .45 : .4;
  B(g, w, h, .05, pcb, 0, 0, 0);                                                     // текстолит
  B(g, .32, .32, .07, lid, 0, 0, .03);                                              // теплораспределитель
  B(g, .335, .335, .012, M(0x9aa1ac, .3, .9), 0, 0, .0); // кант крышки
  const t = C(g, .0, .03, .02, gold, -w / 2 + .035, h / 2 - .035, .026); t.rotation.x = PI / 2;   // золотой треугольник ключа
  for (let i = 0; i < 6; i++) { B(g, .018, .01, .012, cap, -.12 + i * .048, h / 2 - .012, .028); B(g, .018, .01, .012, cap, -.12 + i * .048, -h / 2 + .012, .028); }  // SMD-детали по краям
  if (kind === 'pga') {   // ножки с обратной стороны
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) { if ((i === 0 && j === 0)) continue; B(g, .012, .012, .05, gold, -.16 + i * .04, -.16 + j * .04, -.047); }
  } else {                // площадки LGA снизу
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) B(g, .026, .026, .004, gold, -.14 + i * .04, -.14 + j * .04, -.027);
  }
  if (kind === 'as5') { B(g, .06, .05, .075, lid, -.15, .14, .03); B(g, .06, .05, .075, lid, .15, .14, .03); B(g, .06, .05, .075, lid, -.15, -.14, .03); B(g, .06, .05, .075, lid, .15, -.14, .03); B(g, .1, .02, .075, dark, 0, .165, .03); B(g, .1, .02, .075, dark, 0, -.165, .03); }
  return m;
}
MODELS.cpu_lga = () => cpuBody('lga');
MODELS.cpu_pga = () => cpuBody('pga');
MODELS.cpu_as5 = () => cpuBody('as5');

/* ---------- сборка ---------- */
const dir = path.join(__dirname, '..', 'models'); fs.mkdirSync(dir, { recursive: true });
const pack = {};
Object.keys(MODELS).forEach(function (name) {
  const model = MODELS[name](), groups = bake(model), glb = writeGLB(name, groups);
  fs.writeFileSync(path.join(dir, name + '.glb'), glb);
  pack[name] = glb.toString('base64');
  const tris = groups.reduce((s, G) => s + G.idx.length / 3, 0);
  console.log(name + '.glb', glb.length + ' байт;', model.length, 'деталей в коде →', groups.length, 'вызовов отрисовки;', tris, 'треугольников');
});
fs.writeFileSync(path.join(dir, 'pack.js'), '/* Сгенерировано tools/bake_models.js. Не править руками: правь tools/bake_models.js и запускай node tools/bake_models.js */\nwindow.__glbPack = ' + JSON.stringify(pack) + ';\n');
console.log('models/pack.js записан');
