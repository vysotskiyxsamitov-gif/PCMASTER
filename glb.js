/* PC МАСТЕР — glb.js: загрузчик 3D-моделей из папки models/ (формат .glb), без внешних библиотек.
   Модели лежат в models/pack.js (те же файлы .glb, закодированные для запуска без сервера).
   Если модели нет или она не прочиталась, игра строит предмет кодом, как раньше. */
(function () {
  if (window.__glbLoaded) return;
  window.__glbLoaded = 1;
  var cache = {};
  function b64(s) { var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
  /* разбор .glb в простые массивы (без three.js) */
  function parse(buf) {
    var dv = new DataView(buf);
    if (dv.getUint32(0, true) !== 0x46546C67) throw new Error('не glb');
    var jl = dv.getUint32(12, true), json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jl)));
    var bo = 20 + jl + 8, bin = buf.slice(bo, bo + dv.getUint32(20 + jl, true));
    var NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }, CT = { 5126: Float32Array, 5123: Uint16Array, 5125: Uint32Array };
    function acc(i) { var a = json.accessors[i], v = json.bufferViews[a.bufferView], T = CT[a.componentType], n = a.count * NC[a.type]; return new T(bin, (v.byteOffset || 0) + (a.byteOffset || 0), n); }
    var out = [];
    json.meshes[0].primitives.forEach(function (p) {
      var m = json.materials[p.material] || {}, pb = m.pbrMetallicRoughness || {}, bc = pb.baseColorFactor || [1, 1, 1, 1];
      out.push({ pos: acc(p.attributes.POSITION), nor: p.attributes.NORMAL !== undefined ? acc(p.attributes.NORMAL) : null, uv: p.attributes.TEXCOORD_0 !== undefined ? acc(p.attributes.TEXCOORD_0) : null, idx: acc(p.indices), color: bc, rough: pb.roughnessFactor === undefined ? 1 : pb.roughnessFactor, metal: pb.metallicFactor === undefined ? 1 : pb.metallicFactor, blend: m.alphaMode === 'BLEND' });
    });
    return out;
  }
  function toSRGB(c) { return c <= .0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - .055; }
  function make(name) {
    var pack = window.__glbPack; if (!pack || !pack[name] || typeof THREE === 'undefined') return null;
    try {
      var prims = cache[name] || (cache[name] = parse(b64(pack[name]))), g = new THREE.Group(); g.name = 'glb_' + name;
      prims.forEach(function (p) {
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(p.pos, 3));
        if (p.nor) geo.setAttribute('normal', new THREE.BufferAttribute(p.nor, 3)); else { }
        if (p.uv) geo.setAttribute('uv', new THREE.BufferAttribute(p.uv, 2));
        geo.setIndex(new THREE.BufferAttribute(p.idx, 1)); if (!p.nor) geo.computeVertexNormals();
        var mat = new THREE.MeshStandardMaterial({ roughness: p.rough, metalness: p.metal });
        mat.color.setRGB(toSRGB(p.color[0]), toSRGB(p.color[1]), toSRGB(p.color[2]));
        if (p.blend || p.color[3] < 1) { mat.transparent = true; mat.opacity = p.color[3]; }
        var m = new THREE.Mesh(geo, mat); m.castShadow = !(p.blend || p.color[3] < 1); m.receiveShadow = true; g.add(m);
      });
      return g;
    } catch (e) { console.warn('[glb] не удалось прочитать', name, e); return null; }
  }
  window.__glb = { make: make, parse: parse, has: function (n) { return !!(window.__glbPack && window.__glbPack[n]); } };
})();
