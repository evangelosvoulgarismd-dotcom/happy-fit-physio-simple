// Happy Fit Physio: 3D Anatomy viewer (ES module, lazy loaded).
// Loads a glTF binary (.glb) with named meshes, maps them to muscle groups with a JSON rule file,
// and offers rotation, zoom, standard views, group selection and left/right filtering.
// No external loaders: a small glTF 2.0 parser is included (no Draco, meshopt or KTX: unsupported files are reported, never guessed).

const COMP = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const NCOMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const NORM = { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 };

function parseGLB(buf) {
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('Δεν είναι αρχείο GLB.');
  let off = 12, json = null, bin = null;
  while (off < dv.byteLength) {
    const len = dv.getUint32(off, true), type = dv.getUint32(off + 4, true);
    const data = buf.slice(off + 8, off + 8 + len);
    if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(data));
    else if (type === 0x004e4942 && !bin) bin = data;
    off += 8 + len;
  }
  if (!json) throw new Error('Λείπει το JSON του GLB.');
  const req = json.extensionsRequired || [];
  const bad = req.filter(e => ['KHR_draco_mesh_compression', 'EXT_meshopt_compression', 'KHR_texture_basisu'].includes(e));
  if (bad.length) throw new Error('Μη υποστηριζόμενη συμπίεση στο GLB: ' + bad.join(', ') + '. Εξαγωγή χωρίς συμπίεση χρειάζεται.');
  return { json, bin };
}

function readAccessor(json, bin, idx) {
  const a = json.accessors[idx], bv = json.bufferViews[a.bufferView];
  const T = COMP[a.componentType], n = NCOMP[a.type], size = T.BYTES_PER_ELEMENT;
  const base = (bv.byteOffset || 0) + (a.byteOffset || 0), stride = bv.byteStride || n * size;
  let out;
  if (stride === n * size && base % size === 0) out = new T(bin, base, a.count * n).slice();
  else {
    out = new T(a.count * n); const dv = new DataView(bin);
    const get = { 5120: 'getInt8', 5121: 'getUint8', 5122: 'getInt16', 5123: 'getUint16', 5125: 'getUint32', 5126: 'getFloat32' }[a.componentType];
    for (let i = 0; i < a.count; i++) for (let k = 0; k < n; k++) out[i * n + k] = dv[get](base + i * stride + k * size, true);
  }
  if (a.componentType !== 5126 && a.normalized) {
    const f = new Float32Array(out.length), d = NORM[a.componentType];
    for (let i = 0; i < out.length; i++) f[i] = Math.max(out[i] / d, -1);
    return { array: f, n, count: a.count };
  }
  return { array: out, n, count: a.count, int: a.componentType !== 5126 };
}

function buildScene(THREE, json, bin) {
  const geoms = (json.meshes || []).map(m => m.primitives.filter(p => (p.mode === undefined || p.mode === 4) && p.attributes && p.attributes.POSITION !== undefined).map(p => {
    const g = new THREE.BufferGeometry();
    const pos = readAccessor(json, bin, p.attributes.POSITION);
    g.setAttribute('position', new THREE.BufferAttribute(pos.int ? Float32Array.from(pos.array) : pos.array, 3));
    if (p.attributes.NORMAL !== undefined) { const nr = readAccessor(json, bin, p.attributes.NORMAL); g.setAttribute('normal', new THREE.BufferAttribute(nr.int ? Float32Array.from(nr.array) : nr.array, 3)); }
    if (p.indices !== undefined) { const ix = readAccessor(json, bin, p.indices); g.setIndex(new THREE.BufferAttribute(ix.array, 1)); }
    if (!g.getAttribute('normal')) g.computeVertexNormals();
    g.computeBoundingBox(); g.computeBoundingSphere();
    return g;
  }));
  const root = new THREE.Group(); root.name = 'anatomyRoot';
  const nodes = (json.nodes || []).map(nd => {
    let o = new THREE.Object3D(); o.name = nd.name || '';
    if (nd.matrix) { o.matrix.fromArray(nd.matrix); o.matrix.decompose(o.position, o.quaternion, o.scale); }
    else { if (nd.translation) o.position.fromArray(nd.translation); if (nd.rotation) o.quaternion.fromArray(nd.rotation); if (nd.scale) o.scale.fromArray(nd.scale); }
    o.userData.meshIndex = nd.mesh;
    return o;
  });
  (json.nodes || []).forEach((nd, i) => (nd.children || []).forEach(c => nodes[i].add(nodes[c])));
  const sc = json.scenes && json.scenes[json.scene || 0];
  const tops = sc ? sc.nodes : nodes.map((_, i) => i).filter(i => !nodes[i].parent);
  tops.forEach(i => root.add(nodes[i]));
  return { root, nodes, geoms };
}

// ---- name rules -> group slug ----
function compileRules(map) {
  return ((map && map.rules) || []).map(r => ({ re: new RegExp(r.match, 'i'), group: r.group, side: r.side || null }));
}
function sideFromName(name) {
  if (/(^|[._\s-])(l|left|sin)(?=$|[._\s-])|_l$|\.l$|left/i.test(name)) return 'left';
  if (/(^|[._\s-])(r|right|dex)(?=$|[._\s-])|_r$|\.r$|right/i.test(name)) return 'right';
  return null;
}

export async function mountAnatomy(container, opts = {}) {
  const THREE = opts.three || await import(opts.threeUrl || './three.module.min.js');
  const o = Object.assign({ glbUrl: './assets/anatomy/ecorche.glb', mapUrl: './assets/anatomy/anatomy_map.json', base: 0x9a9ea6, dim: 0x6f737b, hi: 0xe0592a, bg: null, onSelect: null, onReady: null, onError: null, onProgress: null }, opts);
  const state = { disposed: false, raf: 0, dirty: true, selected: null, side: 'both' };
  container.style.position = container.style.position || 'relative';
  const cv = document.createElement('canvas'); cv.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;outline:none;'; cv.tabIndex = 0;
  cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Τρισδιάστατο ανατομικό μοντέλο. Σύρε για περιστροφή, τσίμπημα ή τροχός για ζουμ, πάτησε μυϊκή ομάδα για επιλογή.');
  const ov = document.createElement('div'); ov.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:14px system-ui,sans-serif;color:#888;pointer-events:none;';
  ov.textContent = 'Φόρτωση μοντέλου…';
  container.append(cv, ov);
  const fail = e => { if (state.disposed) return; ov.style.pointerEvents = 'auto'; ov.textContent = 'Δεν φόρτωσε το 3D μοντέλο.'; ov.title = String(e && e.message || e); if (o.onError) o.onError(e); };

  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: !o.bg, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  if (o.bg) renderer.setClearColor(o.bg, 1);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3f4a, 1.15));
  const key = new THREE.DirectionalLight(0xffffff, 1.2); scene.add(key); scene.add(key.target);
  const cam = new THREE.PerspectiveCamera(32, 1, 0.01, 100);

  // ---- load ----
  let model, groups = new Map(), unmapped = [], bbox = new THREE.Box3(), target = new THREE.Vector3(), R0 = 3;
  const meshes = [], mats = { base: null, dim: null, hi: null };
  mats.base = new THREE.MeshStandardMaterial({ color: o.base, roughness: 0.85, metalness: 0 });
  mats.dim = new THREE.MeshStandardMaterial({ color: o.dim, roughness: 0.9, metalness: 0 });
  mats.hi = new THREE.MeshStandardMaterial({ color: o.hi, roughness: 0.6, metalness: 0, emissive: o.hi, emissiveIntensity: 0.18 });
  let rules = [];
  try {
    const [rg, rm] = await Promise.all([
      fetch(o.glbUrl).then(r => { if (!r.ok) throw new Error('GLB ' + r.status); return r.arrayBuffer(); }),
      fetch(o.mapUrl).then(r => r.ok ? r.json() : { rules: [] }).catch(() => ({ rules: [] }))
    ]);
    if (state.disposed) return null;
    rules = compileRules(rm);
    const { json, bin } = parseGLB(rg);
    const sc = buildScene(THREE, json, bin);
    model = sc.root; scene.add(model); model.updateMatrixWorld(true);
    sc.nodes.forEach(nd => {
      const mi = nd.userData.meshIndex; if (mi === undefined) return;
      sc.geoms[mi].forEach((g, k) => {
        const m = new THREE.Mesh(g, mats.base); m.name = nd.name || ('mesh' + mi + '_' + k);
        nd.add(m); meshes.push(m);
      });
    });
    model.updateMatrixWorld(true);
    meshes.forEach(m => {
      const rule = rules.find(r => r.re.test(m.name));
      const bb = new THREE.Box3().setFromObject(m), c = bb.getCenter(new THREE.Vector3());
      m.userData.side = (rule && rule.side) || sideFromName(m.name) || (Math.abs(c.x) < 1e-4 ? 'mid' : (c.x > 0 ? 'left' : 'right'));
      m.userData.group = rule ? rule.group : null;
      if (rule) { if (!groups.has(rule.group)) groups.set(rule.group, []); groups.get(rule.group).push(m); } else unmapped.push(m.name);
    });
    bbox.setFromObject(model);
    const size = bbox.getSize(new THREE.Vector3()); bbox.getCenter(target);
    R0 = (size.y * 0.5) / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * 1.15;
    ov.remove();
    if (o.onProgress) o.onProgress(1);
  } catch (e) { fail(e); return { dispose() { state.disposed = true; try { renderer.dispose(); } catch (_) {} cv.remove(); ov.remove(); }, error: e }; }

  // ---- camera (orbit) ----
  const sph = { th: 0, ph: Math.PI / 2, r: R0 }, goal = { th: 0, ph: Math.PI / 2, r: R0 };
  const VIEWS = { front: 0, right: Math.PI / 2, back: Math.PI, left: -Math.PI / 2 };   // subject faces +Z; camera orbits around Y
  function place() {
    const s = Math.sin(sph.ph), x = sph.r * s * Math.sin(sph.th), y = sph.r * Math.cos(sph.ph), z = sph.r * s * Math.cos(sph.th);
    cam.position.set(target.x + x, target.y + y, target.z + z); cam.lookAt(target);
    key.position.copy(cam.position).add(new THREE.Vector3(0.6, 1.2, 0.8).multiplyScalar(sph.r * 0.4)); key.target.position.copy(target);
  }
  function resize() {
    const w = container.clientWidth || 300, h = container.clientHeight || 400;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); state.dirty = true;
  }
  const ro = new ResizeObserver(resize); ro.observe(container); resize();

  function tick() {
    state.raf = 0; if (state.disposed) return;
    const k = 0.22, dth = angDiff(goal.th, sph.th);
    sph.th += dth * k; sph.ph += (goal.ph - sph.ph) * k; sph.r += (goal.r - sph.r) * k;
    const moving = Math.abs(dth) > 1e-3 || Math.abs(goal.ph - sph.ph) > 1e-3 || Math.abs(goal.r - sph.r) > 1e-3 * R0;
    place(); renderer.render(scene, cam); state.dirty = false;
    if (moving) state.raf = requestAnimationFrame(tick);
  }
  function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
  function wake() { state.dirty = true; if (!state.raf && !state.disposed) state.raf = requestAnimationFrame(tick); }

  // ---- input: rotate / pinch / wheel / tap ----
  const ptrs = new Map(); let down = null, pinch0 = 0, r0 = 0;
  const onDown = e => { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 }; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); r0 = goal.r; } };
  const onMove = e => {
    const p = ptrs.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (down) down.moved += Math.abs(dx) + Math.abs(dy);
    if (ptrs.size === 1) { goal.th -= dx * 0.008; goal.ph = Math.min(Math.PI - 0.15, Math.max(0.15, goal.ph - dy * 0.006)); sph.th = goal.th; sph.ph = goal.ph; wake(); }
    else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0 > 0) { goal.r = clampR(r0 * pinch0 / d); sph.r = goal.r; wake(); } }
  };
  const onUp = e => {
    const had = ptrs.delete(e.pointerId);
    if (had && down && ptrs.size === 0 && down.moved < 6 && performance.now() - down.t < 600) pick(e.clientX, e.clientY);
    if (ptrs.size === 0) down = null;
  };
  const onWheel = e => { e.preventDefault(); goal.r = clampR(goal.r * Math.exp(e.deltaY * 0.0012)); wake(); };
  const clampR = r => Math.min(R0 * 2.2, Math.max(R0 * 0.25, r));
  const onKey = e => {
    const st = 0.12; let u = true;
    if (e.key === 'ArrowLeft') goal.th += st; else if (e.key === 'ArrowRight') goal.th -= st; else if (e.key === 'ArrowUp') goal.ph = Math.max(0.15, goal.ph - st); else if (e.key === 'ArrowDown') goal.ph = Math.min(Math.PI - 0.15, goal.ph + st);
    else if (e.key === '+' || e.key === '=') goal.r = clampR(goal.r * 0.85); else if (e.key === '-') goal.r = clampR(goal.r / 0.85); else if (e.key === 'Escape') api.clearSelection(); else u = false;
    if (u) { e.preventDefault(); wake(); }
  };
  cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
  cv.addEventListener('wheel', onWheel, { passive: false }); cv.addEventListener('keydown', onKey);
  const onLost = e => { e.preventDefault(); }; const onRest = () => { state.dirty = true; wake(); };
  cv.addEventListener('webglcontextlost', onLost); cv.addEventListener('webglcontextrestored', onRest);

  // ---- selection ----
  const ray = new THREE.Raycaster(), nd = new THREE.Vector2();
  function pick(cx, cy) {
    const r = cv.getBoundingClientRect(); nd.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(nd, cam);
    const hit = ray.intersectObjects(meshes.filter(m => m.visible), false)[0];
    if (!hit) { api.clearSelection(); return; }
    const g = hit.object.userData.group; if (!g) { if (o.onSelect) o.onSelect(null, state.side, hit.object); return; }
    const side = hit.object.userData.side;
    api.select(g, side === 'left' || side === 'right' ? side : state.side, hit.object);
  }
  function paint() {
    const sel = state.selected;
    meshes.forEach(m => {
      if (!sel) { m.material = mats.base; return; }
      const inGroup = m.userData.group === sel.slug, sd = m.userData.side;
      const sideOk = state.side === 'both' || sd === 'mid' || sd === state.side;
      m.material = inGroup && sideOk ? mats.hi : mats.dim;
    });
    wake();
  }

  const api = {
    THREE, meshes, groups, unmapped,
    get selection() { return state.selected ? { slug: state.selected.slug, side: state.side } : null; },
    select(slug, side = 'both', mesh = null) {
      if (!groups.has(slug)) return false;
      state.selected = { slug }; state.side = side; paint();
      if (o.onSelect) o.onSelect(slug, side, mesh); return true;
    },
    setSide(side) { state.side = side; paint(); if (state.selected && o.onSelect) o.onSelect(state.selected.slug, side, null); },
    clearSelection() { if (!state.selected) return; state.selected = null; state.side = 'both'; paint(); if (o.onSelect) o.onSelect(null, 'both', null); },
    setView(name, animate = true) {
      if (!(name in VIEWS)) return false;
      goal.th = sph.th + angDiff(VIEWS[name], sph.th); goal.ph = Math.PI / 2; goal.r = R0;
      if (!animate) { sph.th = goal.th; sph.ph = goal.ph; sph.r = goal.r; }
      wake(); return true;
    },
    resetView() { this.setView('front'); },
    zoom(f) { goal.r = clampR(goal.r / f); wake(); },
    focusGroup(slug) {
      const ms = groups.get(slug); if (!ms) return false;
      const bb = new THREE.Box3(); ms.forEach(m => bb.expandByObject(m)); const c = bb.getCenter(new THREE.Vector3());
      target.copy(c); goal.r = clampR(Math.max(bb.getSize(new THREE.Vector3()).length() * 2.2, R0 * 0.45)); wake(); return true;
    },
    unfocus() { bbox.getCenter(target); goal.r = R0; wake(); },
    screenOf(meshName) {   // for tests: viewport coordinates of a mesh centre
      const m = meshes.find(x => x.name === meshName); if (!m) return null;
      const c = new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3()).project(cam), r = cv.getBoundingClientRect();
      return { x: r.left + (c.x + 1) / 2 * r.width, y: r.top + (1 - c.y) / 2 * r.height };
    },
    dispose() {
      if (state.disposed) return; state.disposed = true; if (state.raf) cancelAnimationFrame(state.raf); ro.disconnect();
      cv.removeEventListener('pointerdown', onDown); cv.removeEventListener('pointermove', onMove); cv.removeEventListener('pointerup', onUp); cv.removeEventListener('pointercancel', onUp);
      cv.removeEventListener('wheel', onWheel); cv.removeEventListener('keydown', onKey); cv.removeEventListener('webglcontextlost', onLost); cv.removeEventListener('webglcontextrestored', onRest);
      new Set(meshes.map(m => m.geometry)).forEach(g => g.dispose()); Object.values(mats).forEach(m => m.dispose());
      renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); cv.remove(); ov.remove();
    }
  };
  sph.th = goal.th = Math.PI * 0; place(); wake();
  if (o.onReady) o.onReady(api);
  return api;
}
