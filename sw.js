// Offline support. App files: network first (so updates arrive), cache when offline.
// three.js library from the CDN: cached once, then always served from the cache.
const CACHE = '3d-uzegch-v1.17';
const LOCAL = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];
const CDN = [
  "https://cdn.jsdelivr.net/npm/openskp@1.3.0/+esm",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/ColladaLoader.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/OBJLoader.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/MTLLoader.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/STLLoader.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/FBXLoader.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/TGALoader.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/curves/NURBSCurve.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/curves/NURBSUtils.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/fflate.module.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/utils/BufferGeometryUtils.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/environments/RoomEnvironment.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/lines/LineSegments2.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/lines/LineSegmentsGeometry.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/lines/LineMaterial.js"
];
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(LOCAL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    await Promise.all(CDN.map(u => c.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request;
  // Android "Share → 3D загвар харагч": keep the shared files, then open the app to show them
  if (req.method === 'POST' && new URL(req.url).pathname.endsWith('/share')) {
    e.respondWith((async () => {
      const fd = await req.formData();
      const files = fd.getAll('file').filter(f => f && f.size);
      const c = await caches.open('shared-files');
      for (const k of await c.keys()) await c.delete(k);
      let i = 0;
      for (const f of files)
        await c.put(new Request('shared-' + (i++)), new Response(f, { headers: { 'x-name': encodeURIComponent(f.name || 'model.skp') } }));
      return Response.redirect('./?shared=' + Date.now(), 303);
    })());
    return;
  }
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  const sameOrigin = new URL(req.url).origin === self.location.origin;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    if (sameOrigin) {
      try {
        const res = await fetch(req, { cache: 'no-cache' });
        if (res.ok) c.put(req, res.clone());
        return res;
      } catch (err) {
        return (await c.match(req, { ignoreSearch: true })) ||
               (req.mode === 'navigate' && await c.match('index.html')) || Response.error();
      }
    }
    if (new URL(req.url).hostname === 'www.googleapis.com') {
      try { const res = await fetch(req); if (res.ok) c.put(req, res.clone()); return res; }
      catch (err) { return (await c.match(req)) || Response.error(); }
    }
    const hit = await c.match(req);
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok) c.put(req, res.clone());
    return res;
  })());
});
